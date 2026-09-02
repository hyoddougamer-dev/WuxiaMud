import { describe, expect, it } from 'vitest'
import {
  ARMOUR_K,
  BODY_ARMOUR,
  GUARD_CALM,
  GUARD_REGEN,
  afterArmour,
  attributeBonuses,
} from '../src/sim/loadout'
import { emptyAttributes } from '../src/meta/character'

describe('armour', () => {
  /**
   * The property the whole layer exists for. A flat percentage or a flat
   * subtraction would be health wearing a different name — one more number
   * that shrinks every blow by the same proportion. This one cares how hard
   * the blow was, which is what turns it into a decision.
   */
  it('is worth more against small blows than large ones', () => {
    const armour = 300
    const smallCut = 1 - afterArmour(20, armour) / 20
    const largeCut = 1 - afterArmour(100, armour) / 100
    expect(smallCut).toBeGreaterThan(largeCut)
    expect(smallCut).toBeGreaterThan(0.65)
    expect(largeCut).toBeLessThan(0.4)
  })

  it('halves a blow exactly when armour equals K times the blow', () => {
    const blow = 50
    expect(afterArmour(blow, ARMOUR_K * blow)).toBeCloseTo(blow / 2, 6)
  })

  it('never reduces a blow to nothing', () => {
    // A hit that deals zero cannot be told from not being hit, and a player
    // who cannot tell they are under attack cannot learn to stop it.
    expect(afterArmour(3, 1_000_000)).toBeGreaterThanOrEqual(1)
    expect(afterArmour(0, 500)).toBe(0)
  })

  it('does nothing at zero, and never adds damage', () => {
    expect(afterArmour(40, 0)).toBe(40)
    for (const armour of [0, 10, 100, 5000]) {
      expect(afterArmour(40, armour)).toBeLessThanOrEqual(40)
    }
  })

  it('comes off Body, alongside the health', () => {
    const spent = { ...emptyAttributes(), body: 10 }
    expect(attributeBonuses(spent).armour).toBe(10 * BODY_ARMOUR)
    expect(attributeBonuses(spent).maxHp).toBeGreaterThan(0)
  })
})

describe('guard', () => {
  it('refills in a bounded, knowable time', () => {
    // The number the player is really being taught: disengage for this long
    // and the layer is back. A regen that took an unclear time would be a
    // trickle they never plan around.
    const seconds = 1 / GUARD_REGEN
    expect(seconds).toBeGreaterThan(2)
    expect(seconds).toBeLessThan(8)
    expect(GUARD_CALM).toBeGreaterThan(1)
  })
})
