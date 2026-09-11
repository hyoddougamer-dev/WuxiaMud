import { test } from 'node:test'
import assert from 'node:assert/strict'
import { newPlayer, type PlayerState } from '../src/core/state.ts'
import { BEASTS } from '../src/core/beasts.ts'
import { GROUNDS, FIRST_GROUND, ground, groundOf, openAt, quarryOf } from '../src/core/grounds.ts'
import { hunt, canHunt, travel, quarry, huntCharges } from '../src/core/hunt.ts'
import { MATERIAL_FOR_RANK, count } from '../src/core/materials.ts'
import { V1_CEILING } from '../src/core/realms.ts'
import { TURMOIL_MAX } from '../src/core/progress.ts'

const T0 = 1_700_000_000_000
const rich = (over: Partial<PlayerState> = {}): PlayerState =>
  ({ ...newPlayer('sword', T0), qi: 1e12, realm: 9, ...over })

test('every beast lives in exactly one ground, and every ground holds three', () => {
  // Where a beast can be hunted is decided by its ground and nowhere else. If a beast
  // belonged to two grounds, or to none, the bestiary would be telling the player
  // something the hunt does not honour.
  for (const b of BEASTS) {
    const homes = GROUNDS.filter((g) => g.beasts.includes(b.id))
    assert.equal(homes.length, 1, `${b.id} lives in ${homes.length} grounds`)
  }
  for (const g of GROUNDS) {
    assert.equal(g.beasts.length, 3, `${g.id} holds ${g.beasts.length}`)
    assert.equal(quarryOf(g).length, 3, `${g.id} names a beast that does not exist`)
    assert.ok(g.note.trim().length > 30, `${g.id} must say what the place is`)
  }
  assert.equal(GROUNDS.reduce((n, g) => n + g.beasts.length, 0), BEASTS.length)
})

test('grounds open in order, and the first one is open to everybody', () => {
  const realms = GROUNDS.map((g) => g.realm)
  assert.deepEqual(realms, [...realms].sort((a, b) => a - b), 'grounds are listed in order')
  assert.equal(GROUNDS[0].realm, 1)
  assert.equal(GROUNDS[0].danger, 0, 'the starting ground must cost no calm')
  assert.equal(FIRST_GROUND, GROUNDS[0].id)
  assert.ok(GROUNDS[GROUNDS.length - 1].realm < V1_CEILING, 'the last ground opens before the top')
})

test('deeper ground, worse for the heart and better for the satchel', () => {
  // Monotone on purpose: a ground that is both safer and richer than the one before it
  // is not a decision, and the picker would be a list with one right answer.
  for (let i = 1; i < GROUNDS.length; i++) {
    assert.ok(GROUNDS[i].danger >= GROUNDS[i - 1].danger, `${GROUNDS[i].id} must not be calmer`)
    assert.ok(GROUNDS[i].bonus >= GROUNDS[i - 1].bonus, `${GROUNDS[i].id} must not pay less`)
  }
  assert.ok(GROUNDS[GROUNDS.length - 1].danger > GROUNDS[0].danger, 'and the range must be real')
})

test('a hunt can only find what lives where you are standing', () => {
  const s = rich({ ground: 'wood' })
  const names = new Set(quarryOf(ground('wood')).map((b) => b.id))
  for (let i = 0; i < 40; i++) {
    const got = hunt(s, T0, i / 40)
    assert.ok(got, 'a hunt in an open ground must succeed')
    assert.ok(names.has(got!.beast.id), `${got!.beast.id} does not live in Cinder Wood`)
  }
})

test('travel is refused by the realm, not by the button', () => {
  const early = rich({ realm: 2 })
  assert.equal(travel(early, 'scar'), early, 'The Scar is shut at the second realm')
  assert.equal(travel(early, 'marsh').ground, 'marsh')
  assert.equal(travel(early, 'marsh').ground, 'marsh')

  const already = travel(early, 'marsh')
  assert.equal(travel(already, 'marsh'), already, 'travelling where you stand is a no-op')

  // Standing in a ground your realm no longer opens cannot happen forwards, but a
  // hand-edited save could arrive that way, and it must not produce a hunt.
  assert.deepEqual(quarry({ ...early, ground: 'scar' }), [])
  assert.equal(canHunt({ ...early, ground: 'scar' }, T0), false)
})

test('the ground decides the material, which is the whole reason to choose one', () => {
  for (const g of GROUNDS) {
    const s = rich({ ground: g.id })
    const got = hunt(s, T0, 0.5)!
    assert.equal(got.material.id, MATERIAL_FOR_RANK[got.beast.rank])
    assert.equal(count(got.state.satchel, got.material.id), got.material.amount)
    assert.ok(got.material.amount >= 1 + g.bonus, 'the ground bonus is paid out')
  }
})

test('a deep ground charges calm for every trip, and says so in the spoils', () => {
  const s = rich({ ground: 'scar', turmoil: 10 })
  const got = hunt(s, T0, 0.2)!
  assert.equal(got.danger, ground('scar').danger)
  assert.equal(got.state.turmoil, 10 + ground('scar').danger)

  const brim = hunt({ ...s, turmoil: TURMOIL_MAX }, T0, 0.2)!
  assert.equal(brim.state.turmoil, TURMOIL_MAX, 'and it never runs past the maximum')

  const safe = hunt(rich({ ground: 'ash', turmoil: 10 }), T0, 0.2)!
  assert.equal(safe.state.turmoil, 10, 'the Ash Slopes take nothing')
})

test('a new cultivator stands somewhere they can actually hunt', () => {
  const s = { ...newPlayer('sword', T0), qi: 1e6 }
  assert.equal(s.ground, FIRST_GROUND)
  assert.ok(openAt(ground(s.ground), s.realm))
  assert.equal(huntCharges(s, T0) > 0, true)
  assert.equal(canHunt(s, T0), true)
})

test('the bestiary can name the ground of every beast it shows', () => {
  for (const b of BEASTS) {
    const g = groundOf(b.id)
    assert.ok(g, `${b.id} has nowhere to be found`)
    assert.ok(b.note.trim().length > 20, `${b.id} needs a line worth reading`)
    assert.ok(b.symbol.startsWith('s-'), `${b.id} needs a drawing`)
  }
  assert.equal(new Set(BEASTS.map((b) => b.symbol)).size, BEASTS.length,
    'two beasts sharing one drawing is how a bestiary stops being worth filling')
})
