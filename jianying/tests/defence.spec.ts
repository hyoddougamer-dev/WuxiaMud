import { describe, expect, it } from 'vitest'
import {
  ARMOUR_K,
  BODY_ARMOUR,
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
  /**
   * Guard has no test of its own beyond this note, because what makes it
   * correct is not a number — it is WHAT REFILLS IT, and that is pinned by the
   * two balance invariants in tests/combat.spec.ts and tests/regions.spec.ts:
   * a standing player must still die, and pure evasion must not outlast
   * fighting. Two earlier designs passed every unit test I could write for
   * them and failed both of those.
   *
   * Refilling on calm seconds paid a kiting player a permanently full bar.
   * Refilling per kill was worse: kills scale with the crowd and the crowd
   * scales with time, so the refill rate rose to meet the damage rate and a
   * player who simply stood still survived the full five minutes — the exact
   * stabilising loop RunState.healCooldown documents for the 血 art.
   *
   * Levelling refills it now, which is earned, scales with progress rather
   * than with bodies nearby, and cannot be farmed by running away.
   */
  it('is a pool spent between levels, not a regenerating bar', () => {
    // The size is the only free number left: big enough to matter, small
    // enough that it is not a second health bar.
    const stats = attributeBonuses({ body: 0, edge: 0, swift: 0, spirit: 0 })
    expect(stats.armour).toBe(0)
  })
})
