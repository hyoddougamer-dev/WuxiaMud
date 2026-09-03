import { describe, expect, it } from 'vitest'
import { SPEED_CAP, deriveStats, emptyKit } from '../src/sim/loadout'
import { emptyAttributes, type Attributes } from '../src/meta/character'

const kitWith = (spent: Partial<Attributes>) => ({
  ...emptyKit(),
  spent: { ...emptyAttributes(), ...spent },
})

/** Sweep damage per second — the number a build is actually judged on. */
const dps = (spent: Partial<Attributes>): number => {
  const s = deriveStats(new Map(), kitWith(spent))
  return (s.slashDamage * s.throwCount) / s.slashInterval
}

describe('the damage layers', () => {
  /**
   * The property the whole build system rests on.
   *
   * Damage and rate are separate pools multiplied together, so the same number
   * of points is worth MORE split between them than poured into either one.
   * With the old model — flat damage plus a rate multiplier — this was not
   * true in any useful way, and that is precisely why the game had exactly one
   * optimal spend that never changed no matter what dropped.
   */
  it('pays better for a split than for a pile', () => {
    const POINTS = 40
    const allEdge = dps({ edge: POINTS })
    const allSwift = dps({ swift: POINTS })
    const split = dps({ edge: POINTS / 2, swift: POINTS / 2 })
    expect(split).toBeGreaterThan(allEdge)
    expect(split).toBeGreaterThan(allSwift)
  })

  /**
   * And the reason the optimum MOVES: the more of one pool you hold, the less
   * the next point in it is worth relative to the other. A player who finds a
   * weapon full of Power should start buying Swiftness, which is the whole of
   * "what should I take next" being a real question.
   */
  it('gives a pool falling value as it grows', () => {
    const base = dps({ edge: 10, swift: 10 })
    const firstEdge = dps({ edge: 11, swift: 10 }) - base
    const deep = dps({ edge: 40, swift: 10 })
    const laterEdge = dps({ edge: 41, swift: 10 }) - deep
    // Absolute gain still rises — the pool is bigger — so the test is on the
    // PROPORTION, which is what a player is really choosing between.
    expect(laterEdge / deep).toBeLessThan(firstEdge / base)
  })

  it('never divides the rate by nothing, however much Speed is stacked', () => {
    const floor = emptyKit().weapon.interval / (1 + SPEED_CAP / 100)
    for (const swift of [50, 200, 5000]) {
      expect(deriveStats(new Map(), kitWith({ swift })).slashInterval).toBeGreaterThanOrEqual(
        floor - 1e-9,
      )
    }
  })

  /**
   * The conversion was meant to change the SHAPE, not the magnitudes: with
   * both changing at once there would be nothing to measure the new curve
   * against. Twenty points used to give a zhanmadao 56 damage and a rate of
   * x1.44; it now gives 54 and x1.50.
   */
  it('lands near the old numbers at ordinary totals', () => {
    const weapon = emptyKit().weapon
    const s = deriveStats(new Map(), kitWith({ edge: 20, swift: 20 }))
    expect(s.slashDamage).toBeGreaterThan(weapon.damage * 1.6)
    expect(s.slashDamage).toBeLessThan(weapon.damage * 2.0)
    const rate = weapon.interval / s.slashInterval
    expect(rate).toBeGreaterThan(1.35)
    expect(rate).toBeLessThan(1.65)
  })
})
