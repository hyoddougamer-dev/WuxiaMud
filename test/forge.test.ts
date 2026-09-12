import test from 'node:test'
import assert from 'node:assert/strict'
import { newPlayer, type PlayerState } from '../src/core/state.ts'
import {
  PATTERNS, TEMPER_MAX, canTemper, costToMax, forgeValue, levelOf, made,
  pattern, temper, temperCost, valueAt,
} from '../src/core/forge.ts'
import { RELICS, SLOTS, wear, worn } from '../src/core/relics.ts'
import { modifiers } from '../src/core/progress.ts'
import { hunt, insightFor, trailAt, trailEndsAt, TRAIL_MS, HUNT_CHARGE_MS, maxCharges } from '../src/core/hunt.ts'
import { GROUNDS, quarryOf } from '../src/core/grounds.ts'
import { BEASTS } from '../src/core/beasts.ts'
import { MATERIAL_FOR_RANK } from '../src/core/materials.ts'
import { nextStep } from '../src/core/next.ts'
import { apply } from '../src/core/actions.ts'

const T0 = 1_700_000_000_000
const smith = (over: Partial<PlayerState> = {}): PlayerState => ({
  ...newPlayer('sword', T0),
  realm: 7, huntAnchorAt: 0,
  satchel: { hide: 9999, core: 9999, essence: 9999 },
  ...over,
})

/* ------------------------------------------------------------------ 鍛 the forge */

test('nine patterns, three to a slot, three tiers of material', () => {
  assert.equal(PATTERNS.length, 9)
  for (const slot of SLOTS) {
    assert.equal(PATTERNS.filter((p) => p.slot === slot).length, 3, `${slot} has three`)
  }
  for (const mat of ['hide', 'core', 'essence']) {
    assert.equal(PATTERNS.filter((p) => p.mat === mat).length, 3, `${mat} carries three`)
  }
  // Every pattern must be reachable: a material it eats has to drop somewhere its
  // realm can already go, or the pattern is a picture of an item.
  for (const p of PATTERNS) {
    const reachable = GROUNDS.some((g) => g.realm <= p.realm
      && quarryOf(g).some((b) => MATERIAL_FOR_RANK[b.rank] === p.mat))
    assert.ok(reachable, `${p.id} asks for ${p.mat} before anywhere drops it`)
  }
})

test('the forge is paid in materials and never in insight', () => {
  let s = smith({ insight: 0 })
  for (const p of PATTERNS) {
    if (s.realm < p.realm) continue
    const before = s.satchel[p.mat] ?? 0
    const cost = temperCost(p, 0)[p.mat] ?? 0
    s = temper(s, p.id)
    assert.equal(levelOf(s.forged, p.id), 1, `${p.id} forges at zero insight`)
    assert.equal(s.satchel[p.mat], before - cost, `${p.id} is paid in ${p.mat}`)
    assert.equal(s.insight, 0, 'and insight is never touched')
  }
})

test('nine levels, each dearer than the last, and then it stops', () => {
  for (const p of PATTERNS) {
    const costs = Array.from({ length: TEMPER_MAX }, (_, l) => temperCost(p, l)[p.mat] ?? 0)
    assert.deepEqual(costs, [...costs].sort((a, b) => a - b), `${p.id} gets dearer`)
    assert.ok(costs[TEMPER_MAX - 1] > costs[0] * 5, `${p.id} ends much dearer than it starts`)
    assert.equal(costToMax(p, 0), costs.reduce((a, b) => a + b, 0))

    let s = smith({ forged: { [p.id]: TEMPER_MAX } })
    assert.equal(canTemper(s, p.id), false, `${p.id} stops at ${TEMPER_MAX}`)
    assert.equal(temper(s, p.id), s, 'and refuses rather than overflowing')
  }
})

test('a pattern is worth its level, and nothing until it is forged', () => {
  const p = pattern('ring')!
  assert.equal(valueAt(p, 0), 0)
  for (let l = 1; l <= TEMPER_MAX; l++) assert.equal(valueAt(p, l), p.per * l)

  const bare = smith({ forged: {}, wearing: { implement: null, robe: null, charm: null } })
  assert.equal(made(bare, 'ring'), false)
  assert.equal(wear(bare, 'ring', 'implement'), bare, 'an unforged pattern cannot be worn')
  const one = temper(bare, 'ring')
  assert.equal(worn(wear(one, 'ring', 'implement'), 'implement'), undefined, 'it is not a relic')
  assert.equal(wear(one, 'ring', 'implement').wearing.implement, 'ring', 'but it fills the slot')
})

test('forged and found compete for the same three slots', () => {
  const s = smith({ relics: [...RELICS.map((r) => r.id)], forged: { ring: 4, seal: 4 } })
  const withRelic = wear(s, 'bell', 'implement')
  assert.equal(withRelic.wearing.implement, 'bell')
  const withForge = wear(withRelic, 'seal', 'implement')
  assert.equal(withForge.wearing.implement, 'seal', 'the forged item displaces the relic')
  assert.equal(maxCharges(withForge), maxCharges(s), 'and the bell stops counting')
  // A pattern still only fits its own slot.
  assert.equal(wear(s, 'seal', 'robe'), s, 'an implement is not a robe')
})

test('only what is worn counts, and it reaches the numbers it claims', () => {
  const bare = smith({ forged: { ring: TEMPER_MAX, corefire: TEMPER_MAX, foxcharm: TEMPER_MAX },
                       wearing: { implement: null, robe: null, charm: null } })
  assert.equal(forgeValue(bare, 'rate'), 0, 'made but not worn is worth nothing')

  const ring = pattern('ring')!
  const dressed = wear(bare, 'ring', 'implement')
  assert.equal(forgeValue(dressed, 'rate'), ring.per * TEMPER_MAX)
  assert.ok(modifiers(dressed).rate > modifiers(bare).rate, 'the forge is the one gear that raises generation')

  const robed = wear(dressed, 'corefire', 'robe')
  assert.ok(modifiers(robed).breakthrough < modifiers(dressed).breakthrough)
  const charmed = wear(robed, 'foxcharm', 'charm')
  assert.ok(modifiers(charmed).insight > modifiers(robed).insight)
})

test('the haul charm actually fills the satchel faster', () => {
  const bare = smith({ realm: 2, ground: 'ash', qi: 1e6, forged: { bonecharm: TEMPER_MAX },
                       wearing: { implement: null, robe: null, charm: null } })
  const plain = hunt(bare, T0, 0.5)!
  const laden = hunt(wear(bare, 'bonecharm', 'charm'), T0, 0.5)!
  assert.equal(laden.beast.id, plain.beast.id, 'same hour, same ground, same quarry')
  assert.ok(laden.material.amount > plain.material.amount, 'nine levels of bone is a fuller bag')
})

test('no forged pattern may borrow a relic id', () => {
  // One field holds both kinds and wear() resolves relics first, so an overlapping id
  // is a pattern that can never be put on — silently, with no error anywhere.
  const relics = new Set(RELICS.map((r) => r.id))
  for (const p of PATTERNS) assert.ok(!relics.has(p.id), `${p.id} collides with a relic`)
})

/* ------------------------------------------------------------------ 蹤 the trail */

test('the trail is the same for everyone and turns over on the clock', () => {
  for (const g of GROUNDS) {
    const b = trailAt(g.id, T0)!
    assert.ok(quarryOf(g).some((x) => x.id === b.id), 'it is always something that lives there')
    assert.equal(trailAt(g.id, T0 + 1000)!.id, b.id, 'and it does not flicker')
    assert.equal(trailAt(g.id, T0)!.id, trailAt(g.id, T0)!.id, 'and it is a function, not a roll')
  }
  const ends = trailEndsAt(T0)
  assert.ok(ends > T0 && ends - T0 <= TRAIL_MS)
  assert.equal(trailEndsAt(ends - 1), ends, 'the window closes where it says it does')

  // Over a few days a ground shows more than one of its beasts, and the grounds do not
  // all move together — otherwise there is one right moment to play rather than a
  // choice of where to be.
  const seen = new Set<string>()
  for (let i = 0; i < 12; i++) seen.add(trailAt('marsh', T0 + i * TRAIL_MS)!.id)
  assert.ok(seen.size > 1, 'a ground shows more than one beast across a few days')
  const together = GROUNDS.every((g) => trailAt(g.id, T0)!.rank === trailAt('marsh', T0)!.rank)
  assert.equal(together, false, 'the grounds turn over independently')

  // One charge, one trail: the window is the charge period exactly, so a player who
  // looks when their charge lands is looking at a ground that has just turned over.
  assert.equal(TRAIL_MS, HUNT_CHARGE_MS)
})

test('what is on the trail is what you find, whatever the dice say', () => {
  // The one word the whole mechanic turns on. A sixty-percent chance of the advertised
  // beast is something that happens to you; a certainty is something you can plan
  // around, and planning is the only thing a second look in a day can buy.
  const s = smith({ realm: 4, ground: 'wood', satchel: {}, qi: 1e9, seenBeasts: ['fox', 'ape', 'moth'] })
  const up = trailAt('wood', T0)!
  for (const roll of [0, 0.17, 0.5, 0.83, 0.999]) {
    assert.equal(hunt(s, T0, roll)!.beast.id, up.id, `roll ${roll} still finds what was advertised`)
  }
  // A later window is a different hunt, and rank is what the choice is actually about.
  const later = trailAt('wood', T0 + TRAIL_MS * 5)!
  assert.ok(insightFor(s, later) > 0 && insightFor(s, up) > 0)
  assert.ok(insightFor(s, { ...up, rank: 3 }) > insightFor(s, { ...up, rank: 1 }),
            'a deeper quarry teaches more')
})

test('the once-a-day player still hunts, still takes materials, still climbs', () => {
  // The promise the trail has to keep. Attention buys better picks and must never buy
  // the only picks: every window in every ground has something standing in it.
  const s = smith({ realm: 7, satchel: {}, qi: 1e12 })
  for (const g of GROUNDS) {
    for (let w = 0; w < 16; w++) {
      const got = hunt({ ...s, ground: g.id }, T0 + w * TRAIL_MS, 0.5)
      assert.ok(got, `${g.name} window ${w} is huntable`)
      assert.ok(got!.material.amount >= 1, 'every hunt brings something back')
      assert.ok(got!.insight > 0, 'and teaches something')
    }
  }
})

/* ------------------------------------------------------------------ 指路 the advisor */

test('the advisor names the material, the beast and the ground', () => {
  // The exact state from the screenshot that caused all of this: realm four, the Bone
  // Gate wanting three spirit cores, and a player standing in a ground that has none.
  const stuck = smith({
    realm: 4, ground: 'ash', qi: 54_700, insight: 3, satchel: { hide: 14 }, turmoil: 3,
    learned: ['frost', 'thread', 'cloud', 'wind', 'bell'], gates: [],
  })
  // Whatever hour it is, the answer must name the material, a beast that carries it,
  // and a ground that is open — and must prefer a ground with it standing on the trail
  // now over one that merely could drop it, because the trail is what you will find.
  const cores = BEASTS.filter((b) => b.rank === 2).map((b) => b.name)
  for (let w = 0; w < 8; w++) {
    const now = T0 + w * TRAIL_MS
    const step = nextStep(stuck, now)
    assert.match(step.say, /Spirit Core/, `window ${w} names what is missing`)
    assert.equal(step.where, 'hunt', 'and which screen to go to')
    assert.ok(cores.some((n) => step.why.includes(n)), `window ${w} names something that drops it`)
    assert.ok(GROUNDS.some((g) => step.why.includes(g.name)), `window ${w} names where that lives`)

    const named = GROUNDS.find((g) => step.why.includes(g.name))!
    assert.ok(named.realm <= stuck.realm, 'and never sends you somewhere shut')
    const up = trailAt(named.id, now)!
    if (step.why.includes('on the trail')) {
      assert.equal(MATERIAL_FOR_RANK[up.rank], 'core', 'a trail answer is a trail that has it')
    }
  }

  const here = GROUNDS.find((g) => quarryOf(g).some((b) => b.rank === 2))!
  const there = nextStep({ ...stuck, ground: here.id }, T0)
  if (there.why.includes(here.name)) {
    assert.match(there.why, /standing in it/, 'and notices when you are already there')
  }
})

test('the advisor always has an answer, at every realm and in every state', () => {
  for (let realm = 1; realm <= 9; realm++) {
    for (const turmoil of [0, 60]) {
      for (const qi of [0, 1e12]) {
        const s = smith({ realm, turmoil, qi, satchel: {}, forged: {}, insight: 0, gates: [] })
        const step = nextStep(s, T0)
        assert.ok(step.say.length > 0 && step.why.length > 0, `realm ${realm} says something`)
        assert.ok(['cultivate', 'body', 'arts', 'gear', 'hunt', 'lineage'].includes(step.where))
      }
    }
  }
})

/* ------------------------------------------------------------------ the action */

test('tempering goes through the same action path as everything else', () => {
  const s = smith({ realm: 1, satchel: { hide: 3 }, forged: {} })
  const out = apply(s, { type: 'temper', id: 'ring' }, T0, 0.5, 4)
  assert.equal(out.applied, true)
  assert.equal(levelOf(out.state.forged, 'ring'), 1)

  const broke = apply(smith({ realm: 1, satchel: {}, forged: {} }), { type: 'temper', id: 'ring' }, T0, 0.5, 4)
  assert.equal(broke.applied, false, 'an empty satchel forges nothing')

  const early = apply(smith({ realm: 1, satchel: { essence: 99 }, forged: {} }),
                      { type: 'temper', id: 'skyiron' }, T0, 0.5, 4)
  assert.equal(early.applied, false, 'and a pattern you do not know yet stays unknown')
})
