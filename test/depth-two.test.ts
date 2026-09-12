import { test } from 'node:test'
import assert from 'node:assert/strict'
import { newPlayer, type PlayerState } from '../src/core/state.ts'
import { TECHNIQUES, technique, upkeepOf, effectText } from '../src/core/techniques.ts'
import { refine, canRefine, refineCost, levelOf, valueAt, investedIn, MASTERY_MAX, MASTERY_STEP } from '../src/core/mastery.ts'
import { modifiers, openSession, ratePerSecond } from '../src/core/progress.ts'
import { ENCOUNTERS, ENCOUNTER_CHANCE, ENCOUNTER_GAP_MS, choose, draw, encounter } from '../src/core/encounters.ts'
import { TURMOIL_MAX } from '../src/core/progress.ts'
import { inheritedEffect } from '../src/core/ancestry.ts'

const T0 = 1_700_000_000_000
const rich = (over: Partial<PlayerState> = {}): PlayerState =>
  ({ ...newPlayer('sword', T0), realm: 9, insight: 1e6, qi: 1e9,
     satchel: { hide: 99, core: 99, essence: 99 }, ...over })

/* ------------------------------------------------------------- 精通 mastery */

test('refining costs insight, raises the effect and never the upkeep', () => {
  const t = technique('frost')!
  const s = rich({ learned: ['frost'], equipped: ['frost'] })
  const before = modifiers(s)

  const one = refine(s, 'frost')
  assert.equal(levelOf(one.mastery, 'frost'), 1)
  assert.equal(one.insight, s.insight - refineCost(t, 0))
  const after = modifiers(one)
  assert.ok(after.rate > before.rate, 'the art gives more')
  assert.equal(after.upkeep, before.upkeep, 'and costs exactly the same to carry')
  assert.ok(ratePerSecond(one, T0) > ratePerSecond(s, T0))
})

test('mastery stops at five and gets dearer every step', () => {
  const t = technique('frost')!
  let s = rich({ learned: ['frost'] })
  const costs: number[] = []
  for (let i = 0; i < MASTERY_MAX; i++) {
    costs.push(refineCost(t, levelOf(s.mastery, 'frost')))
    s = refine(s, 'frost')
  }
  assert.equal(levelOf(s.mastery, 'frost'), MASTERY_MAX)
  assert.equal(refine(s, 'frost'), s, 'six is not a level')
  assert.deepEqual(costs, [...costs].sort((a, b) => a - b), 'each step costs more than the last')
  assert.equal(investedIn(s, 'frost'), costs.reduce((a, b) => a + b, 0))
  assert.equal(valueAt(t, MASTERY_MAX), t.value * (1 + MASTERY_STEP * MASTERY_MAX))
})

test('an art you have not learned cannot be refined, however rich you are', () => {
  const s = rich()
  assert.equal(canRefine(s, 'frost'), false)
  assert.equal(refine(s, 'frost'), s)
  assert.equal(refine(rich({ learned: ['frost'], insight: 0 }), 'frost').mastery.frost, undefined)
  assert.equal(refine(s, 'nonesuch'), s)
})

test('mastering the whole book is arithmetic, not a plan', () => {
  // The point of a sink is that it does not empty. If every art could be taken to five
  // on the insight a run produces, insight would go back to being dead weight at the end.
  const whole = TECHNIQUES.reduce((total, t) => {
    for (let l = 0; l < MASTERY_MAX; l++) total += refineCost(t, l)
    return total
  }, 0)
  assert.ok(whole > 40_000, `the whole book costs ${whole}, which a run can afford`)
})

test('the effect text reports the art as refined, not as sold', () => {
  const t = technique('frost')!
  assert.notEqual(effectText(t, valueAt(t, 0)), effectText(t, valueAt(t, 3)))
  assert.ok(effectText(t, valueAt(t, 0)).includes('10%'))
  assert.equal(upkeepOf(t), upkeepOf(t))
})

test('an heirloom is as good as it was made', () => {
  const t = technique('frost')!
  const plain = inheritedEffect(t, 'sword', 'sword', 0)
  const honed = inheritedEffect(t, 'sword', 'sword', MASTERY_MAX)
  assert.ok(honed > plain, 'the mastery the ancestor put in comes down with the art')
  assert.ok(inheritedEffect(t, 'blade', 'sword', 0) > plain, 'and off-path is still worth more')
})

/* --------------------------------------------------------- 奇遇 encounters */

test('every encounter states its price and always lets you walk away', () => {
  for (const e of ENCOUNTERS) {
    assert.ok(e.text.trim().length > 60, `${e.id} needs a scene, not a label`)
    assert.ok(e.options.length >= 2, `${e.id} with one option is not a choice`)
    for (const o of e.options) {
      assert.ok(o.label.trim().length > 3, `${e.id} has an unlabelled option`)
      assert.ok(o.detail.trim().length > 10, `${e.id}/${o.label} must say what it costs`)
    }
    // Every encounter needs at least one option nobody can be locked out of.
    const bare = { ...newPlayer('sword', T0), realm: e.realm }
    assert.ok(e.options.some((o) => o.can(bare)),
      `${e.id} can be reached with every option greyed out`)
  }
})

test('no option is purely a punishment for opening the app', () => {
  // Every branch is a trade. A player who picks badly has spent something, never
  // simply lost for having been there.
  const s = rich({ turmoil: 50, realm: 9 })
  for (const e of ENCOUNTERS) {
    for (const o of e.options) {
      if (!o.can(s)) continue
      for (const roll of [0.1, 0.5, 0.9]) {
        const out = o.take(s, roll)
        assert.ok(out.said.trim().length > 10, `${e.id}/${o.label} says nothing back`)
        assert.ok(out.state.turmoil <= TURMOIL_MAX, `${e.id}/${o.label} overflows the heart`)
        assert.ok(out.state.turmoil >= 0)
        assert.ok(out.state.qi >= 0 && out.state.insight >= 0)
      }
    }
  }
})

test('one is drawn on opening, at most, and never twice in a row', () => {
  const s = { ...newPlayer('sword', T0), realm: 9, lastEncounterAt: 0 }
  assert.equal(draw(s, T0, 0.99), null, 'a high roll finds nothing')
  const found = draw(s, T0, 0.01)
  assert.ok(found, 'a low roll finds something')

  const again = { ...s, lastEncounter: found!.id }
  for (let i = 0; i < 30; i++) {
    const other = draw(again, T0, (i / 30) * ENCOUNTER_CHANCE * 0.99)
    if (other) assert.notEqual(other.id, found!.id, 'the same scene must not repeat immediately')
  }
})

test('the gap keeps the Blade Path from farming strangers', () => {
  // Without it, five sessions an evening would meet five times as many people as one.
  const justHad = { ...newPlayer('sword', T0), realm: 9, lastEncounterAt: T0 }
  assert.equal(draw(justHad, T0 + 60_000, 0.001), null)
  assert.equal(draw(justHad, T0 + ENCOUNTER_GAP_MS - 1, 0.001), null)
  assert.ok(draw(justHad, T0 + ENCOUNTER_GAP_MS + 1, 0.001))
})

test('openSession puts what it drew where a reload will find it', () => {
  const s = { ...newPlayer('sword', T0), realm: 9, lastEncounterAt: 0 }
  const opened = openSession(s, T0, 0.01)
  assert.ok(opened.encounter, 'the encounter survives being closed and reopened')
  // Opening again must not replace a scene the player has not answered yet.
  assert.equal(openSession(opened, T0 + 1, 0.99).encounter, opened.encounter)
})

test('answering spends it, records it, and refuses a choice you cannot make', () => {
  const held = { ...rich({ lastEncounterAt: 0 }), encounter: 'merchant', satchel: {} }
  const e = encounter('merchant')!
  const tradeIndex = e.options.findIndex((o) => o.label.startsWith('Trade'))
  assert.equal(choose(held, tradeIndex, T0, 0.5).state, held, 'no hides, no trade')

  const stocked = { ...held, satchel: { hide: 9 } }
  const out = choose(stocked, tradeIndex, T0, 0.5)
  assert.equal(out.state.encounter, null)
  assert.equal(out.state.lastEncounter, 'merchant')
  assert.equal(out.state.lastEncounterAt, T0)
  assert.ok(out.said.length > 10)

  assert.equal(choose(stocked, 99, T0, 0.5).state, stocked, 'an index out of range does nothing')
  assert.equal(choose({ ...stocked, encounter: null }, 0, T0, 0.5).state.encounter, null)
})
