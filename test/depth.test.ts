import { test } from 'node:test'
import assert from 'node:assert/strict'
import { newPlayer } from '../src/core/state.ts'
import {
  advance, brew, equip, grossPerSecond, learn, modifiers, ratePerSecond,
  takePill, toggleSettle, turmoilFactor, TURMOIL_FREE, TURMOIL_MAX, INJURY_RATE,
} from '../src/core/progress.ts'
import { attempt, odds, FIRST_TRIBULATION_REALM } from '../src/core/tribulation.ts'
import { hunt, canHunt, HUNT_COOLDOWN_MS } from '../src/core/hunt.ts'
import { count } from '../src/core/materials.ts'
import { held } from '../src/core/pills.ts'
import { realm } from '../src/core/realms.ts'

const H = 3_600_000
const T0 = 1_700_000_000_000
const rich = (over: Partial<ReturnType<typeof newPlayer>> = {}) =>
  ({ ...newPlayer('sword', T0), insight: 9999, ...over })

/* ---------------- turmoil ---------------- */

test('turmoil rises with cultivation and does not saturate in an hour', () => {
  const one = advance(newPlayer('sword', T0), T0 + H).state
  const six = advance(newPlayer('sword', T0), T0 + 6 * H).state
  assert.ok(one.turmoil > 0, 'cultivating is never free')
  assert.ok(six.turmoil > one.turmoil, 'longer must cost more')
  assert.ok(one.turmoil < TURMOIL_FREE, 'one hour must not already be a problem')
})

test('settling is a thing you do every few days, not every single one', () => {
  // A day of gathering must cost real turmoil without immediately demanding the cure.
  // Turmoil ran at 4/hour until a simulation showed what that does to the Sword Path:
  // a player who opens the game once a day banks the whole day in one go and so meets
  // every tribulation with a full meter and no way to empty it in one sitting. The
  // threshold has to be reachable in a few days of neglect, not in one.
  const day = advance(newPlayer('sword', T0), T0 + 24 * H).state
  assert.ok(day.turmoil > 10, 'a day of gains is never free')
  assert.ok(day.turmoil < TURMOIL_FREE, 'but one day alone must not force a player to sit down')

  // Three *visits* a day apart, not one 72-hour jump: offline credit is capped at a
  // day, so a single long absence and a single day are worth the same turmoil.
  let three = newPlayer('sword', T0)
  for (let d = 1; d <= 3; d++) three = advance(three, T0 + d * 24 * H).state
  assert.ok(three.turmoil > TURMOIL_FREE, 'three days of neglect should')
  assert.ok(three.turmoil <= TURMOIL_MAX)
})

test('turmoil is free below the threshold and never exceeds the maximum', () => {
  assert.equal(turmoilFactor(0), 1)
  assert.equal(turmoilFactor(TURMOIL_FREE), 1)
  assert.ok(turmoilFactor(TURMOIL_MAX) < 1)
  const s = advance({ ...newPlayer('sword', T0), turmoil: 95 }, T0 + 20 * H).state
  assert.ok(s.turmoil <= TURMOIL_MAX)
})

test('settling trades output for quiet, and both halves are real', () => {
  const noisy = { ...newPlayer('sword', T0), turmoil: 80 }
  const quiet = toggleSettle(noisy)
  assert.ok(ratePerSecond(quiet, T0) < ratePerSecond(noisy, T0))
  const after = advance(quiet, T0 + H).state
  assert.ok(after.turmoil < noisy.turmoil, 'settling must drain turmoil')
  assert.ok(after.qi > 0, 'settling still cultivates, just badly')
})

test('a loud heart costs generation', () => {
  const calm = { ...newPlayer('sword', T0), turmoil: 0 }
  const loud = { ...newPlayer('sword', T0), turmoil: TURMOIL_MAX }
  assert.ok(ratePerSecond(loud, T0) < ratePerSecond(calm, T0))
})

/* ---------------- upkeep ---------------- */

test('equipping everything is a mistake: upkeep is subtracted from the rate', () => {
  let s = rich({ realm: 3 })
  const bare = ratePerSecond(s, T0)
  for (const id of ['frost', 'thread', 'cloud']) s = learn(s, id)
  for (const id of ['frost', 'thread', 'cloud']) s = equip(s, id, 6)
  assert.ok(modifiers(s).upkeep > 0)
  const loaded = ratePerSecond(s, T0)
  assert.ok(loaded < grossPerSecond(s, T0), 'upkeep must bite')
  assert.ok(loaded !== bare)
})

test('upkeep can never take more than ninety percent of the gross', () => {
  let s = rich({ realm: 7 })
  for (const t of ['ninewinter', 'flysword', 'serpent', 'heart', 'thunder', 'talisman']) s = learn(s, t)
  for (const t of ['ninewinter', 'flysword', 'serpent', 'heart', 'thunder', 'talisman']) s = equip(s, t, 6)
  const gross = grossPerSecond(s, T0)
  assert.ok(ratePerSecond(s, T0) >= gross * 0.1 - 1e-9)
})

/* ---------------- tribulation ---------------- */

test('the first two realms give way without a gamble', () => {
  const s = { ...newPlayer('sword', T0), qi: 1e9 }
  assert.equal(odds(s).needed, false)
  assert.equal(attempt(s, T0, 0.999).succeeded, true, 'even the worst roll passes early')
})

test('surplus qi, a quiet heart and a pill each raise the odds', () => {
  const base = { ...newPlayer('sword', T0), realm: FIRST_TRIBULATION_REALM, turmoil: 0 }
  const cost = realm(base.realm).cost
  const exact = odds({ ...base, qi: cost }).total
  const double = odds({ ...base, qi: cost * 2 }).total
  const noisy = odds({ ...base, qi: cost, turmoil: TURMOIL_MAX }).total
  const pilled = odds({ ...base, qi: cost, pillPrimed: true }).total
  assert.ok(double > exact, 'waiting must pay')
  assert.ok(noisy < exact, 'turmoil must cost')
  assert.ok(pilled > exact, 'the pill must matter')
})

test('a failed tribulation costs qi and time but never the realm', () => {
  const s = { ...newPlayer('sword', T0), realm: 4, qi: realm(4).cost * 1.0, turmoil: 30 }
  const out = attempt(s, T0, 0.999)
  assert.equal(out.succeeded, false)
  assert.equal(out.state.realm, 4, 'the realm is kept')
  assert.ok(out.state.qi < s.qi && out.state.qi > 0)
  assert.ok(out.state.injuredUntil > T0)
  assert.ok(out.state.turmoil > s.turmoil)
  assert.equal(out.state.failedTribulations, 1)
})

test('a passed tribulation quiets the heart', () => {
  const s = { ...newPlayer('sword', T0), realm: 4, qi: realm(4).cost * 3, turmoil: 60 }
  const out = attempt(s, T0, 0.0)
  assert.equal(out.succeeded, true)
  assert.ok(out.state.turmoil < s.turmoil)
  assert.equal(out.state.pillPrimed, false)
})

test('injury only slows the hours it actually covers', () => {
  const hurt = { ...newPlayer('sword', T0), injuredUntil: T0 + H }
  const oneHour = advance(hurt, T0 + H).state.qi
  const twoHours = advance(hurt, T0 + 2 * H).state.qi
  const healthy = advance(newPlayer('sword', T0), T0 + H).state.qi
  assert.ok(oneHour < healthy * (INJURY_RATE + 0.01))
  assert.ok(twoHours > oneHour * 1.5, 'the second hour must be uninjured')
})

/* ---------------- hunting and pills ---------------- */

test('hunting costs qi, yields materials and sets a cooldown', () => {
  const s = { ...newPlayer('sword', T0), qi: 1000 }
  const got = hunt(s, T0, 0.1)
  assert.ok(got)
  assert.ok(got!.state.qi < 1000)
  assert.ok(got!.state.insight > 0)
  assert.equal(got!.state.seenBeasts.length, 1)
  assert.equal(got!.state.huntReadyAt, T0 + HUNT_COOLDOWN_MS)
  assert.equal(canHunt(got!.state, T0), false)
  assert.equal(canHunt(got!.state, T0 + HUNT_COOLDOWN_MS), true)
})

test('a beast is only recorded once', () => {
  const s = { ...newPlayer('sword', T0), qi: 1000 }
  const first = hunt(s, T0, 0.1)!
  const again = hunt({ ...first.state, huntReadyAt: 0 }, T0, 0.1)!
  assert.equal(again.firstSighting, false)
  assert.equal(again.state.seenBeasts.length, 1)
})

test('brewing spends materials and pills do what they say', () => {
  const s = { ...newPlayer('sword', T0), satchel: { hide: 3 }, turmoil: 80 }
  const brewed = brew(s, 'settling')
  assert.equal(count(brewed.satchel, 'hide'), 0)
  assert.equal(held(brewed.pills, 'settling'), 1)

  const taken = takePill(brewed, 'settling', T0)
  assert.equal(taken.turmoil, 35)
  assert.equal(held(taken.pills, 'settling'), 0)
})

test('brewing without the materials changes nothing', () => {
  const s = newPlayer('sword', T0)
  assert.equal(brew(s, 'settling'), s)
})

test('a tribulation pill cannot be stacked with itself', () => {
  let s = { ...newPlayer('sword', T0), pills: { tribulation: 2 } }
  s = takePill(s, 'tribulation', T0)
  assert.equal(s.pillPrimed, true)
  const again = takePill(s, 'tribulation', T0)
  assert.equal(held(again.pills, 'tribulation'), 1, 'the second is refused, not swallowed')
})
