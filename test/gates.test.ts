import { test } from 'node:test'
import assert from 'node:assert/strict'
import { newPlayer, type PlayerState } from '../src/core/state.ts'
import { BOTTLENECKS, bottleneckAt, breakGate, canBreakGate, checklist, gateOpen } from '../src/core/bottlenecks.ts'
import { breakthroughCost, canBreakThrough, heldAtGate, openMeridian } from '../src/core/progress.ts'
import { attempt } from '../src/core/tribulation.ts'
import { MERIDIANS } from '../src/core/meridians.ts'
import { TECHNIQUES } from '../src/core/techniques.ts'
import { BEASTS } from '../src/core/beasts.ts'
import { count, MATERIAL_FOR_RANK, type MaterialId } from '../src/core/materials.ts'
import { V1_CEILING } from '../src/core/realms.ts'

const T0 = 1_700_000_000_000

function at(realm: number, over: Partial<PlayerState> = {}): PlayerState {
  const s: PlayerState = { ...newPlayer('sword', T0), realm, insight: 100_000, turmoil: 0,
    satchel: { hide: 999, core: 999, essence: 999 }, ...over }
  return { ...s, qi: breakthroughCost(s) * 3 }
}

test('every gate asks for something the game can actually supply', () => {
  // A requirement of "twelve beasts" in a game with ten is not a hard bottleneck, it
  // is an unfinishable save. The ceilings are checked here rather than trusted.
  for (const b of BOTTLENECKS) {
    assert.ok(b.realm >= 3 && b.realm < V1_CEILING, `${b.name} sits on a climbable realm`)
    assert.ok(b.text.trim().length > 20, `${b.name} must say why`)
    for (const r of b.requires) {
      const ceiling =
        r.label === 'Meridians opened' ? MERIDIANS.length
        : r.label === 'Arts learned' ? TECHNIQUES.length
        : r.label === 'Beasts recorded' ? BEASTS.length
        : r.atMost ? 100 : Infinity
      assert.ok(r.need <= ceiling, `${b.name} asks for ${r.need} ${r.label}, only ${ceiling} exist`)
    }
  }
})

test('gates are ordered: every realm from three to eight has exactly one', () => {
  const realms = BOTTLENECKS.map((b) => b.realm)
  assert.deepEqual(realms, [3, 4, 5, 6, 7, 8])
  assert.deepEqual([...new Set(realms)], realms, 'no realm may carry two gates')
  assert.equal(bottleneckAt(1), undefined, 'the first two realms are a tutorial')
  assert.equal(bottleneckAt(2), undefined)
})

test('qi alone no longer breaks a realm from the third on', () => {
  const s = at(3, { turmoil: 90 })
  assert.ok(s.qi >= breakthroughCost(s), 'the qi is there')
  assert.equal(canBreakThrough(s), false, 'and it is not enough')
  assert.equal(heldAtGate(s), true, 'the UI must be able to say why')
  assert.equal(attempt(s, T0, 0).state, s, 'the engine refuses it too, not just the button')
})

test('the Heart Gate is passed by settling, and stays passed', () => {
  const noisy = at(3, { turmoil: 90 })
  assert.equal(canBreakGate(noisy), false)

  const quiet = { ...noisy, turmoil: 10 }
  assert.equal(canBreakGate(quiet), true)
  const through = breakGate(quiet)
  assert.deepEqual(through.gates, [3])
  assert.equal(canBreakThrough(through), true)

  // Letting the heart rise again must not re-close a gate already broken.
  assert.equal(gateOpen({ ...through, turmoil: 99 }), true)
})

test('breaking a gate spends its offering exactly once', () => {
  const s = at(4, { learned: ['frost', 'thread', 'cloud'] })
  const b = bottleneckAt(4)!
  assert.equal(b.offering.core, 3)
  const after = breakGate(s)
  assert.equal(count(after.satchel, 'core'), count(s.satchel, 'core') - 3)
  assert.equal(breakGate(after), after, 'a broken gate cannot be broken again')
})

test('a gate refuses when the offering is short, even with everything else met', () => {
  const s = at(4, { learned: ['frost', 'thread', 'cloud'], satchel: { core: 2 } })
  assert.equal(canBreakGate(s), false)
  assert.equal(breakGate(s), s)
})

test('the checklist tells the truth about every row, materials included', () => {
  const s = at(5, { learned: ['frost', 'thread', 'cloud'] })
  const rows = checklist(s, bottleneckAt(5)!)
  const arts = rows.find((r) => r.label === 'Arts learned')!
  assert.equal(arts.have, 3)
  assert.equal(arts.need, 5)
  assert.equal(arts.ok, false)

  const opened = MERIDIANS.slice(0, 1).reduce((x, m) => openMeridian(x, m.id), s)
  const after = checklist(opened, bottleneckAt(5)!).find((r) => r.label === 'Meridians opened')!
  assert.equal(after.have, 1)
})

test('a quiet-heart row is a ceiling, not a floor', () => {
  const b = bottleneckAt(7)!
  const row = (t: number) => checklist({ ...at(7), turmoil: t }, b).find((r) => r.atMost)!
  assert.equal(row(10).ok, true, 'under the line passes')
  assert.equal(row(90).ok, false, 'over it does not')
})

test('the last gate is the hardest and still passable', () => {
  const everything = MERIDIANS.reduce((x, m) => openMeridian(x, m.id), at(8, {
    learned: TECHNIQUES.slice(0, 9).map((t) => t.id),
    seenBeasts: BEASTS.slice(0, 9).map((b) => b.id),
  }))
  assert.equal(canBreakGate(everything), true)
  assert.equal(canBreakThrough(breakGate(everything)), true)
})

test('no gate or meridian asks for a material the realm cannot yet drop', () => {
  // The deadlock this guards against is not hypothetical: every measured run stalled
  // at Void Refining holding two thousand spirit cores, because the sixth gate asked
  // for one True Essence and the only beasts that dropped any were locked behind the
  // seventh realm. A circular requirement is unwinnable and invisible in the UI.
  const droppedBy = (realmId: number) =>
    new Set(BEASTS.filter((b) => b.realm <= realmId).map((b) => MATERIAL_FOR_RANK[b.rank]))

  for (const b of BOTTLENECKS) {
    for (const k of Object.keys(b.offering)) {
      assert.ok(droppedBy(b.realm).has(k as MaterialId),
        `${b.name} at realm ${b.realm} asks for ${k}, which no beast drops until later`)
    }
  }
  for (const m of MERIDIANS) {
    for (const k of Object.keys(m.mats)) {
      assert.ok(droppedBy(m.realm).has(k as MaterialId),
        `${m.name} opens at realm ${m.realm} but asks for ${k}, dropped only above it`)
    }
  }
})
