import { test } from 'node:test'
import assert from 'node:assert/strict'
import { newPlayer } from '../src/core/state.ts'
import {
  advance, breakThrough, breakthroughCost, canBreakThrough, equip, learn,
  modifiers, openSession, ratePerSecond, DEFAULT_OFFLINE_CAP_HOURS,
} from '../src/core/progress.ts'
import { V1_CEILING } from '../src/core/realms.ts'

const H = 3_600_000
const T0 = 1_700_000_000_000

test('advance is pure: the input state is never mutated', () => {
  const s = newPlayer('sword', T0)
  const snapshot = JSON.stringify(s)
  advance(s, T0 + H)
  assert.equal(JSON.stringify(s), snapshot)
})

test('offline gains are capped, and the excess is discarded rather than banked', () => {
  const s = newPlayer('sword', T0)
  const day = advance(s, T0 + DEFAULT_OFFLINE_CAP_HOURS * H)
  const week = advance(s, T0 + 7 * 24 * H)
  assert.equal(week.state.qi, day.state.qi)
  assert.ok(week.report.cappedBy > 0)
  assert.equal(day.report.cappedBy, 0)
})

test('techniques that raise the offline cap actually extend credited time', () => {
  let s = newPlayer('sword', T0)
  s = { ...s, insight: 99, realm: 3 }
  s = learn(s, 'cloud')
  s = equip(s, 'cloud', 6)
  assert.equal(modifiers(s).offlineCapHours, DEFAULT_OFFLINE_CAP_HOURS + 2)
  const r = advance(s, T0 + 30 * H).report
  assert.ok(Math.abs(r.creditedSeconds - 26 * 3600) < 1)
})

test('breaking through spends qi, climbs a realm and resets the sword clock', () => {
  let s = newPlayer('sword', T0)
  const cost = breakthroughCost(s)
  s = { ...s, qi: cost + 5 }
  assert.ok(canBreakThrough(s))
  const after = breakThrough(s, T0 + 10 * H)
  assert.equal(after.realm, 2)
  assert.equal(after.qi, 5)
  assert.equal(after.lastBreakthroughAt, T0 + 10 * H)
  assert.ok(after.insight > 0)
})

test('release one stops at the ceiling even with unlimited qi', () => {
  let s = newPlayer('sword', T0)
  s = { ...s, realm: V1_CEILING, qi: Number.MAX_SAFE_INTEGER }
  assert.equal(canBreakThrough(s), false)
  assert.equal(breakThrough(s, T0).realm, V1_CEILING)
})

test('opening a session resets blade momentum but not sword intent', () => {
  const blade = openSession(newPlayer('blade', T0), T0 + 10 * H)
  assert.equal(blade.lastOpenedAt, T0 + 10 * H)
  const sword = newPlayer('sword', T0)
  const opened = openSession(sword, T0 + 10 * H)
  assert.equal(opened.lastBreakthroughAt, sword.lastBreakthroughAt)
})

test('blade generates more right after opening than sword does', () => {
  const b = openSession(newPlayer('blade', T0), T0)
  const s = newPlayer('sword', T0)
  assert.ok(ratePerSecond(b, T0) > ratePerSecond(s, T0))
})

test('learning is refused without insight or realm, and never double-charges', () => {
  const poor = learn(newPlayer('sword', T0), 'frost')
  assert.deepEqual(poor.learned, [])

  let s = { ...newPlayer('sword', T0), insight: 100, realm: 1 }
  s = learn(s, 'thunder')            // realm 3 technique
  assert.deepEqual(s.learned, [])

  s = learn(s, 'frost')
  const spent = s.insight
  s = learn(s, 'frost')
  assert.equal(s.insight, spent)
  assert.deepEqual(s.learned, ['frost'])
})

test('slots are respected', () => {
  let s = { ...newPlayer('sword', T0), insight: 500, realm: 3 }
  for (const id of ['frost', 'thread', 'cloud']) s = learn(s, id)
  s = equip(s, 'frost', 2)
  s = equip(s, 'thread', 2)
  s = equip(s, 'cloud', 2)
  assert.deepEqual(s.equipped, ['frost', 'thread'])
})

test('a forged clock running backwards cannot mint qi', () => {
  const s = { ...newPlayer('sword', T0), qi: 500 }
  const back = advance(s, T0 - 10 * H)
  assert.equal(back.state.qi, 500)
  assert.equal(back.report.qiGained, 0)
})
