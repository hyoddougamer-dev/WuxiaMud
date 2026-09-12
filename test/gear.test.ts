import { test } from 'node:test'
import assert from 'node:assert/strict'
import { newPlayer, type PlayerState } from '../src/core/state.ts'
import { RELICS, SLOTS, relic, relicsOf, wear, worn, owns, relicValue } from '../src/core/relics.ts'
import { WARDENS, warden, wardenOf, odds, fight, known, canChallenge, wardenCost,
         WARDEN_CHARGES } from '../src/core/wardens.ts'
import { GROUNDS, ground, quarryOf } from '../src/core/grounds.ts'
import { modifiers, ratePerSecond, TURMOIL_MAX } from '../src/core/progress.ts'
import { huntCharges, maxCharges, dangerHere, hunt, HUNT_MAX_CHARGES } from '../src/core/hunt.ts'
import { attempt } from '../src/core/tribulation.ts'
import { chanceFor, ENCOUNTER_CHANCE } from '../src/core/encounters.ts'
import { realm } from '../src/core/realms.ts'
import { count } from '../src/core/materials.ts'

const T0 = 1_700_000_000_000

/** Someone who has seen everything and can pay for anything. */
function veteran(over: Partial<PlayerState> = {}): PlayerState {
  return {
    ...newPlayer('sword', T0),
    realm: 9, qi: 1e12, insight: 1e6, turmoil: 0,
    satchel: { hide: 99, core: 99, essence: 99 },
    seenBeasts: GROUNDS.flatMap((g) => g.beasts),
    relics: RELICS.map((r) => r.id),
    ...over,
  }
}

/* ------------------------------------------------------------ 法寶 relics */

test('every relic comes off a warden, fills a slot, and says what it does', () => {
  for (const r of RELICS) {
    assert.ok(warden(r.from), `${r.id} comes from ${r.from}, which is not a warden`)
    assert.ok(SLOTS.includes(r.slot), `${r.id} has no slot`)
    assert.ok(r.text.trim().length > 8, `${r.id} must state its effect`)
    assert.ok(r.note.trim().length > 20, `${r.id} must be a thing, not a stat line`)
    assert.ok(r.glyph.startsWith('r-'), `${r.id} needs its own mark`)
  }
  assert.equal(new Set(RELICS.map((r) => r.glyph)).size, RELICS.length, 'no two share a drawing')
  for (const slot of SLOTS) {
    assert.ok(relicsOf(slot).length >= 2, `${slot} has nothing to choose between`)
  }
})

test('no relic touches qi generation — that is what arts are for', () => {
  const bare = veteran({ wearing: { implement: null, robe: null, charm: null } })
  for (const r of RELICS) {
    const on = wear(bare, r.id, r.slot)
    assert.equal(ratePerSecond(on, T0), ratePerSecond(bare, T0),
      `${r.id} moves generation, which makes it an art you cannot refine`)
  }
})

test('one to a slot, and only what you own', () => {
  const nothing = veteran({ relics: [] })
  assert.equal(wear(nothing, 'bell', 'implement'), nothing, 'you cannot wear what you never took')

  const s = wear(veteran(), 'bell', 'implement')
  assert.equal(worn(s, 'implement')?.id, 'bell')
  assert.equal(wear(s, 'bell', 'charm'), s, 'a bell is not a charm')

  const swapped = wear(s, 'blade', 'implement')
  assert.equal(worn(swapped, 'implement')?.id, 'blade', 'the slot holds one')
  assert.equal(worn(wear(swapped, null, 'implement'), 'implement'), undefined, 'and can be emptied')
  assert.equal(owns(s, 'bell'), true, 'taking it off never loses it')
})

test('each relic reaches the rule it claims', () => {
  const bare = veteran({ wearing: { implement: null, robe: null, charm: null }, turmoil: 40 })

  assert.equal(maxCharges(wear(bare, 'bell', 'implement')), HUNT_MAX_CHARGES + 2)
  assert.ok(modifiers(wear(bare, 'blade', 'implement')).odds > modifiers(bare).odds)
  assert.ok(modifiers(wear(bare, 'pendant', 'charm')).insight > modifiers(bare).insight)
  assert.ok(chanceFor(wear(bare, 'mirror', 'charm')) > ENCOUNTER_CHANCE)

  const deep = { ...bare, ground: 'scar' }
  assert.equal(dangerHere(wear(deep, 'robe', 'robe')), dangerHere(deep) - 1)
  assert.equal(dangerHere(wear({ ...bare, ground: 'ash' }, 'robe', 'robe')), 0, 'never below zero')

  const rich = { ...bare, realm: 4, gates: [4], qi: realm(4).cost * 1.2, turmoil: 20 }
  const hard = attempt(rich, T0, 0.999)
  const soft = attempt(wear(rich, 'mantle', 'robe'), T0, 0.999)
  assert.equal(hard.succeeded, false)
  assert.ok(soft.state.qi > hard.state.qi, 'the mantle keeps half the qi')
  assert.ok(soft.state.turmoil < hard.state.turmoil, 'and half the calm')
  assert.ok(soft.state.injuredUntil < hard.state.injuredUntil, 'and half the hours')

  const cord = wear({ ...bare, ground: 'ash' }, 'cord', 'charm')
  assert.equal(relicValue(cord, 'haul'), 1)
  // Same hour and same ground, so both hunts meet the same beast and the only thing
  // that differs is the cord.
  const plain = hunt({ ...bare, ground: 'ash' }, T0, 0.5)!
  const laden = hunt(cord, T0, 0.5)!
  assert.equal(laden.beast.id, plain.beast.id)
  assert.equal(laden.material.amount, plain.material.amount + 1)
})

/* ---------------------------------------------------------- 妖王 wardens */

test('one warden to a ground, and each is dearer than the last', () => {
  assert.equal(WARDENS.length, GROUNDS.length)
  for (const g of GROUNDS) {
    const w = wardenOf(g.id)
    assert.ok(w, `${g.id} has nothing at the bottom of it`)
    assert.ok(w!.text.trim().length > 60, `${w!.id} needs a scene`)
    assert.ok(w!.first.trim().length > 30, `${w!.id} needs something said on the first kill`)
    assert.ok(relic(w!.relic), `${w!.id} drops ${w!.relic}, which does not exist`)
  }
  const bases = WARDENS.map((w) => w.base)
  assert.deepEqual(bases, [...bases].sort((a, b) => b - a), 'deeper wardens must be harder')
  const rewards = WARDENS.map((w) => w.insight)
  assert.deepEqual(rewards, [...rewards].sort((a, b) => a - b), 'and worth more')
  assert.equal(new Set(WARDENS.map((w) => w.relic)).size, WARDENS.length, 'each drops its own')
})

test('a warden has to be earned before it will meet you', () => {
  const w = warden('grey')!
  const stranger = veteran({ seenBeasts: ['hare'], ground: 'ash' })
  assert.equal(known(stranger, w), false)
  assert.equal(canChallenge(stranger, w, 4), false)
  assert.equal(fight(stranger, w, T0, 0, 4), null, 'and the engine refuses, not just the button')

  const local = veteran({ ground: 'ash' })
  assert.equal(known(local, w), true)
  assert.equal(canChallenge(local, w, WARDEN_CHARGES), true)
  assert.equal(canChallenge(local, w, WARDEN_CHARGES - 1), false, 'three charges, not two')
  assert.equal(canChallenge({ ...local, qi: 0 }, w, 4), false, 'and the qi is real')
})

test('every line of the odds comes from something the player built', () => {
  const w = warden('cinder')!
  const g = ground(w.ground)
  const bare = veteran({
    realm: g.realm, equipped: [], mastery: {}, turmoil: 0,
    wearing: { implement: null, robe: null, charm: null },
  })
  assert.equal(odds(bare, w).total, w.base, 'with nothing built, the base is the whole of it')

  assert.ok(odds({ ...bare, realm: g.realm + 3 }, w).standing > 0, 'realms above it count')
  assert.ok(odds({ ...bare, equipped: ['frost', 'thread'] }, w).craft > 0, 'the arts you run count')
  assert.ok(
    odds({ ...bare, equipped: ['frost'], mastery: { frost: 5 } }, w).craft >
    odds({ ...bare, equipped: ['frost'] }, w).craft, 'and what you poured into them')
  assert.ok(odds(wear(bare, 'blade', 'implement'), w).gear > 0, 'and what you are wearing')
  assert.ok(odds({ ...bare, turmoil: 80 }, w).turmoil < 0, 'and an unquiet heart still bills you')

  const o = odds(veteran({ realm: 9, equipped: ['frost'], turmoil: 0 }), w)
  assert.ok(o.total <= 0.95, 'nothing is ever certain')
  assert.ok(odds({ ...bare, turmoil: TURMOIL_MAX }, warden('skysplitter')!).total >= 0.05)
})

test('winning takes the haul and the relic, once', () => {
  const w = warden('marsh')!
  const s = veteran({ ground: 'marsh', relics: [], wardens: [] })
  const first = fight(s, w, T0, 0, 4)!
  assert.equal(first.won, true)
  assert.equal(first.took, w.relic)
  assert.equal(first.firstKill, true)
  assert.deepEqual(first.state.wardens, ['marsh'])
  assert.ok(first.state.relics.includes(w.relic))
  assert.equal(count(first.state.satchel, 'core'), count(s.satchel, 'core') + (w.haul.core ?? 0))
  assert.ok(first.state.insight > s.insight)
  assert.ok(first.state.qi < s.qi, 'the qi is spent going in')

  const again = fight(first.state, w, T0, 0, 4)!
  assert.equal(again.won, true)
  assert.equal(again.took, null, 'a relic drops once and only once')
  assert.equal(again.firstKill, false)
  assert.deepEqual(again.state.wardens, ['marsh'], 'and it is not recorded twice')
})

test('losing is expensive and survivable — never the realm, never the character', () => {
  const w = warden('skysplitter')!
  const s = veteran({ ground: 'scar', realm: 8, turmoil: 30, relics: [], wardens: [] })
  const lost = fight(s, w, T0, 0.999, 4)!
  assert.equal(lost.won, false)
  assert.equal(lost.state.realm, s.realm, 'the realm is kept')
  assert.equal(lost.state.learned.length, s.learned.length)
  assert.deepEqual(lost.state.relics, [])
  assert.deepEqual(lost.state.wardens, [])
  assert.ok(lost.state.qi < s.qi)
  assert.ok(lost.state.turmoil > s.turmoil)
  assert.ok(lost.state.injuredUntil > T0)
  assert.ok(lost.state.turmoil <= TURMOIL_MAX)
})

test('a warden costs twenty minutes of the realm it is fought at', () => {
  for (let r = 1; r <= 9; r++) {
    const s = veteran({ realm: r })
    assert.equal(wardenCost(s), Math.ceil(realm(r).rate * 1200))
  }
  // Dearer as you climb, so it stays a decision about the day rather than loose change.
  assert.ok(wardenCost(veteran({ realm: 8 })) > wardenCost(veteran({ realm: 2 })))
})

test('the relic ladder is reachable: every warden sits in a ground you can open', () => {
  for (const w of WARDENS) {
    const g = ground(w.ground)
    assert.ok(g.realm <= 9, `${w.id} sits under a ground that never opens`)
    assert.equal(quarryOf(g).length, 3)
    // And nothing asks you to beat a warden before you could have met its ground.
    assert.ok(relic(w.relic)!.from === w.id)
  }
})

test('a new cultivator owns nothing, wears nothing and has put nothing down', () => {
  const s = newPlayer('blade', T0)
  assert.deepEqual(s.relics, [])
  assert.deepEqual(s.wardens, [])
  assert.deepEqual(s.wearing, { implement: null, robe: null, charm: null })
  assert.equal(maxCharges(s), HUNT_MAX_CHARGES)
  assert.equal(huntCharges(s, T0), HUNT_MAX_CHARGES)
})
