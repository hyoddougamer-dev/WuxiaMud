import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SWORD, BLADE, meanRate } from '../src/core/paths.ts'

/** Sword's clock runs from its last breakthrough, so an untouched day is one integral. */
function swordDay(): number {
  return meanRate(SWORD, 0, 24)
}

/** Blade's clock resets on every visit, so a day is N equal segments. */
function bladeDay(visits: number): number {
  const span = 24 / visits
  return meanRate(BLADE, 0, span)
}

test('a path is a schedule, not a power level: both land within 5% over a day', () => {
  const sword = swordDay()
  const blade = bladeDay(5)
  const drift = Math.abs(blade - sword) / sword
  assert.ok(drift < 0.05, `paths drifted ${(drift * 100).toFixed(1)}% (sword ${sword.toFixed(3)}, blade ${blade.toFixed(3)})`)
})

test('sword rewards being left alone', () => {
  assert.ok(SWORD.rateAt(24) > SWORD.rateAt(12))
  assert.ok(SWORD.rateAt(12) > SWORD.rateAt(1))
})

test('sword is clamped so an absent week is not worth more than a day', () => {
  assert.equal(SWORD.rateAt(24), SWORD.rateAt(24 * 7))
})

test('blade decays and never reaches zero', () => {
  assert.ok(BLADE.rateAt(0) > BLADE.rateAt(4))
  assert.ok(BLADE.rateAt(4) > BLADE.rateAt(24))
  assert.ok(BLADE.rateAt(1e6) > 0)
})

test('playing blade like sword is meaningfully worse, which is the point', () => {
  assert.ok(bladeDay(1) < swordDay() * 0.6)
})

test('bone-chilling flame removes blade decay', () => {
  assert.equal(BLADE.rateAt(20, { noDecay: true }), BLADE.rateAt(0, { noDecay: true }))
})

test('meanRate integrates rather than sampling an endpoint', () => {
  const mean = meanRate(SWORD, 0, 24)
  assert.ok(mean > SWORD.rateAt(0) && mean < SWORD.rateAt(24))
})
