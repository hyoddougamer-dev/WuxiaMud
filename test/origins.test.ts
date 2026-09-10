import { test } from 'node:test'
import assert from 'node:assert/strict'
import { newPlayer } from '../src/core/state.ts'
import { ORIGINS, origin } from '../src/core/origins.ts'
import { advance, brew, breakthroughCost, modifiers, pillCost, ratePerSecond } from '../src/core/progress.ts'
import { huntCost, canHunt } from '../src/core/hunt.ts'
import { realm } from '../src/core/realms.ts'
import { count } from '../src/core/materials.ts'
import { held } from '../src/core/pills.ts'

const T0 = 1_700_000_000_000
const H = 3_600_000
const born = (id: Parameters<typeof origin>[0]) => newPlayer('sword', T0, { origin: id })

test('every origin states a kit and a trait, and none is silently empty', () => {
  for (const o of ORIGINS) {
    assert.ok(o.kit.trim().length > 3, `${o.id} must say what it brings`)
    assert.ok(o.trait.trim().length > 3, `${o.id} must say what it keeps`)
    assert.ok(o.story.trim().length > 20, `${o.id} must say who you were`)
  }
})

test('Old Family starts able to break through, and pays less for it', () => {
  const s = born('family')
  assert.equal(s.qi, realm(1).cost)
  assert.ok(breakthroughCost(s) < breakthroughCost(born('rogue')))
})

test('the Wandering Cultivator brings nothing and learns faster', () => {
  const s = born('rogue')
  assert.equal(s.qi, 0)
  assert.deepEqual(s.learned, [])
  assert.ok(modifiers(s).insight > modifiers(born('family')).insight)
})

test('the Cauldron Child brews cheaper, and never for free', () => {
  const child = { ...born('cauldron') }
  const other = { ...born('rogue'), satchel: { hide: 4, core: 1 } }
  assert.equal(count(pillCost(child, 'settling'), 'hide'), 2)
  assert.equal(count(pillCost(other, 'settling'), 'hide'), 3)
  assert.equal(count(pillCost(child, 'gathering'), 'core'), 1, 'a discount never reaches zero')

  const brewed = brew(child, 'settling')
  assert.equal(held(brewed.pills, 'settling'), 1)
  assert.equal(count(brewed.satchel, 'hide'), 2)
})

test('the Hunter hunts at half price, forever', () => {
  const h = { ...born('hunter'), qi: 1000 }
  const r = { ...born('rogue'), qi: 1000 }
  assert.equal(huntCost(h), 100)
  assert.equal(huntCost(r), 200)
  assert.deepEqual(h.seenBeasts, ['hare'])
  assert.equal(count(h.satchel, 'hide'), 2)
})

test('nobody is locked out of hunting on their first morning', () => {
  for (const o of ORIGINS) {
    assert.equal(canHunt({ ...born(o.id), qi: 1000 }, T0), true,
      `${o.id} must be able to hunt straight away`)
  }
})

test('the Cast Out starts loud, generates more, and pays for it in turmoil', () => {
  const c = born('castout')
  assert.equal(c.turmoil, 25)
  assert.deepEqual(c.learned, ['frost'])
  assert.ok(ratePerSecond(c, T0) > ratePerSecond({ ...born('rogue'), turmoil: 25 }, T0))

  const after = advance(c, T0 + 4 * H).state.turmoil - c.turmoil
  const plain = advance({ ...born('rogue'), turmoil: 25 }, T0 + 4 * H).state.turmoil - 25
  assert.ok(after > plain * 1.15, 'turmoil must actually rise faster')
})

test('an origin is fixed at birth and appears in the save', () => {
  for (const o of ORIGINS) assert.equal(born(o.id).origin, o.id)
})
