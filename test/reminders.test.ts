import test from 'node:test'
import assert from 'node:assert/strict'
import { newPlayer, type PlayerState } from '../src/core/state.ts'
import {
  DEFAULT_ON, MOST_PER_DAY, chargesFullAt, due, tribulationAt, worthAsking,
} from '../src/core/reminders.ts'
import { huntCharges, maxCharges } from '../src/core/hunt.ts'
import { breakthroughCost } from '../src/core/progress.ts'

const T0 = 1_700_000_000_000
const H = 3_600_000

const p = (over: Partial<PlayerState> = {}): PlayerState => ({
  ...newPlayer('sword', T0), realm: 4, huntAnchorAt: T0, gates: [4], ...over,
})

test('nothing is ever sent for a moment that has already passed', () => {
  // A notification about something that happened before you closed the app is noise,
  // and noise is how a player learns to turn all of them off.
  const full = p({ huntAnchorAt: T0 - 100 * H, qi: 1e12 })
  for (const r of due(full, T0)) assert.ok(r.at > T0, `${r.kind} is in the future`)
})

test('the charge reminder lands exactly when the satchel stops filling', () => {
  const s = p({ huntAnchorAt: T0 })
  const at = chargesFullAt(s, T0)
  assert.ok(at > T0)
  assert.equal(huntCharges(s, at - 1000) < maxCharges(s), true, 'one second before, not yet full')
  assert.equal(huntCharges(s, at), maxCharges(s), 'at the instant, full')
  assert.equal(chargesFullAt(p({ huntAnchorAt: T0 - 500 * H }), T0), 0, 'and nothing once it already is')
})

test('a tribulation is never announced while the gate is shut', () => {
  // The gate needs the player, not the clock. Telling someone the heavens are ready when
  // they are not is worse than telling them nothing.
  const shut = p({ realm: 4, gates: [], qi: 0 })
  assert.equal(tribulationAt(shut, T0), 0)
  assert.equal(due(shut, T0).some((r) => r.kind === 'tribulation'), false)

  const open = p({ realm: 4, gates: [4], qi: 0 })
  const at = tribulationAt(open, T0)
  assert.ok(at > T0, 'with the gate open it is a matter of time')

  const there = p({ realm: 4, gates: [4], qi: breakthroughCost(p({ realm: 4 })) * 2 })
  assert.equal(tribulationAt(there, T0), T0, 'and now when it is already due')
})

test('never more than two a day, whatever the state says', () => {
  const everything = p({
    settling: true, turmoil: 90, injuredUntil: T0 + 5 * H, huntAnchorAt: T0, qi: 0, gates: [4],
  })
  const all = due(everything, T0, { charges: true, tribulation: true, settled: true, injury: true })
  assert.ok(all.length <= MOST_PER_DAY, `got ${all.length}`)
  // And the soonest survive the cap, because they are the ones about to be missed.
  const sorted = [...all].sort((a, b) => a.at - b.at)
  assert.deepEqual(all, sorted)
})

test('a kind that is switched off is never computed into a message', () => {
  const s = p({ huntAnchorAt: T0, settling: true, turmoil: 60 })
  const none = due(s, T0, { charges: false, tribulation: false, settled: false, injury: false })
  assert.equal(none.length, 0)
  const only = due(s, T0, { charges: true, tribulation: false, settled: false, injury: false })
  assert.deepEqual(only.map((r) => r.kind), ['charges'])
})

test('the two that are on by default are the two about losing something', () => {
  assert.equal(DEFAULT_ON.charges, true, 'charges past the cap are thrown away')
  assert.equal(DEFAULT_ON.tribulation, true, 'a ready tribulation is a realm not being taken')
  assert.equal(DEFAULT_ON.injury, false, 'an injury lifting costs nothing to miss')
})

test('every message says a thing, not a category', () => {
  const s = p({ huntAnchorAt: T0, qi: 0, gates: [4] })
  for (const r of due(s, T0)) {
    assert.ok(r.title.length > 0 && r.title.length < 42, `${r.kind} title is a line`)
    assert.ok(/[.!]$/.test(r.body), `${r.kind} body is a sentence: "${r.body}"`)
    assert.doesNotMatch(r.body, /undefined|NaN|\[object/, `${r.kind} body is clean`)
  }
})

test('permission is not asked on the first launch', () => {
  // A game that asks before the player has done anything gets refused, and a refusal on
  // Android is close to permanent. The first breakthrough is the earliest moment anyone
  // has a reason to want to be told something.
  assert.equal(worthAsking(p({ totalBreakthroughs: 0 }), false), false)
  assert.equal(worthAsking(p({ totalBreakthroughs: 1 }), false), true)
  assert.equal(worthAsking(p({ totalBreakthroughs: 9 }), true), false, 'and only once')
})
