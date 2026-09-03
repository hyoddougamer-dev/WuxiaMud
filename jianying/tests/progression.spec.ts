import { describe, expect, it } from 'vitest'
import { Rng } from '../src/core/rng'
import { TICK_S } from '../src/core/loop'
import {
  TECHNIQUES,
  type Loadout,
  offerTechniques,
  xpForLevel,
} from '../src/data/techniques'
import { deriveStats } from '../src/sim/loadout'
import { Motes } from '../src/sim/pickups'
import { DEFAULT_WEAPON } from '../src/data/weapons'

describe('experience curve', () => {
  it('rises with level', () => {
    let last = 0
    for (let lv = 1; lv <= 40; lv++) {
      const need = xpForLevel(lv)
      expect(need).toBeGreaterThan(last)
      last = need
    }
  })

  it('makes the first levels quick', () => {
    // The player has to learn that killing leads to choosing, and they learn it
    // by having it happen early rather than by being told.
    expect(xpForLevel(1)).toBeLessThan(12)
  })
})

describe('technique offers', () => {
  const roll = (rng: Rng) => () => rng.next()

  it('offers three distinct techniques', () => {
    const rng = new Rng(7)
    const offer = offerTechniques(new Map(), roll(rng))
    expect(offer).toHaveLength(3)
    expect(new Set(offer.map((t) => t.id)).size).toBe(3)
  })

  it('never offers a maxed technique', () => {
    const loadout: Loadout = new Map(TECHNIQUES.map((t) => [t.id, t.maxLevel]))
    // Everything is maxed except one.
    loadout.set('keen', 0)
    const rng = new Rng(11)
    for (let i = 0; i < 40; i++) {
      const offer = offerTechniques(loadout, roll(rng))
      expect(offer.every((t) => t.id === 'keen')).toBe(true)
    }
  })

  it('copes when fewer than three remain', () => {
    const loadout: Loadout = new Map(TECHNIQUES.map((t) => [t.id, t.maxLevel]))
    loadout.set('keen', 0)
    const offer = offerTechniques(loadout, roll(new Rng(3)))
    expect(offer).toHaveLength(1)
  })

  it('favours arts the player does not own yet', () => {
    // A run made only of stat bumps looks identical at minute one and minute
    // five. Seeing a new art is most of the reward for levelling.
    const rng = new Rng(99)
    let withArt = 0
    const rounds = 300
    for (let i = 0; i < rounds; i++) {
      const offer = offerTechniques(new Map(), roll(rng))
      if (offer.some((t) => t.kind === 'art')) withArt++
    }
    expect(withArt / rounds).toBeGreaterThan(0.7)
  })

  it('is deterministic for a given seed', () => {
    const a = offerTechniques(new Map(), roll(new Rng(42))).map((t) => t.id)
    const b = offerTechniques(new Map(), roll(new Rng(42))).map((t) => t.id)
    expect(b).toEqual(a)
  })
})

describe('derived stats', () => {
  it('starts from the baselines with nothing taken', () => {
    const s = deriveStats(new Map())
    expect(s.orbitBlades).toBe(0)
    expect(s.boltInterval).toBe(0)
    expect(s.novaInterval).toBe(0)
    expect(s.slashHalfAngle).toBeCloseTo(DEFAULT_WEAPON.halfAngle, 6)
  })

  it('stacks modifiers', () => {
    // Three levels of Keen Edge is thirty-six points into the Power pool, and
    // the pool multiplies the weapon rather than adding to it — so the gain is
    // 36% of the base rather than a flat twelve. See data/techniques.ts for
    // why the card's wording moved to a percentage along with the maths.
    const base = deriveStats(new Map())
    const buffed = deriveStats(new Map([['keen', 3]]))
    expect(buffed.slashDamage).toBeCloseTo(base.slashDamage * 1.36, 9)
  })

  it('makes each level of Swift Hand worth the same proportion', () => {
    const one = deriveStats(new Map([['swift', 1]])).slashInterval
    const two = deriveStats(new Map([['swift', 2]])).slashInterval
    const three = deriveStats(new Map([['swift', 3]])).slashInterval
    expect(two / one).toBeCloseTo(three / two, 6)
  })

  it('never lets the arc close a full circle', () => {
    // At a half-angle of PI the arc test can no longer miss, and "which way am
    // I facing" would silently stop mattering.
    const maxed = deriveStats(new Map([['wide', 99]]))
    expect(maxed.slashHalfAngle).toBeLessThan(Math.PI)
  })

  it('turns an art on only once it is taken', () => {
    expect(deriveStats(new Map([['orbit', 1]])).orbitBlades).toBeGreaterThan(0)
    expect(deriveStats(new Map([['bolt', 1]])).boltInterval).toBeGreaterThan(0)
    expect(deriveStats(new Map([['nova', 1]])).novaInterval).toBeGreaterThan(0)
  })

  it('makes arts fire faster with each level', () => {
    const one = deriveStats(new Map([['bolt', 1]])).boltInterval
    const four = deriveStats(new Map([['bolt', 4]])).boltInterval
    expect(four).toBeLessThan(one)
  })
})

describe('qi motes', () => {
  const run = (motes: Motes, px: number, py: number, radius: number, seconds: number): number => {
    let total = 0
    const ticks = Math.round(seconds / TICK_S)
    for (let i = 0; i < ticks; i++) total += motes.update(px, py, radius, TICK_S)
    return total
  }

  it('is collected when the player is close', () => {
    const motes = new Motes()
    motes.drop(0, 0, 1, new Rng(1))
    expect(run(motes, 0, 0, 62, 2)).toBe(1)
    expect(motes.count).toBe(0)
  })

  it('is left behind when the player is far', () => {
    const motes = new Motes()
    motes.drop(600, 600, 1, new Rng(1))
    expect(run(motes, 0, 0, 62, 2)).toBe(0)
    expect(motes.count).toBe(1)
  })

  it('keeps chasing once caught, even if the player walks away', () => {
    // Otherwise motes twitch in and out of pursuit at the edge of the pull,
    // which looks broken and feels arbitrary.
    const motes = new Motes()
    motes.drop(40, 0, 1, new Rng(5))
    run(motes, 0, 0, 62, 0.1) // inside the radius: it starts homing
    // Now flee well beyond the pull radius; it should still arrive.
    let collected = 0
    for (let i = 0; i < 240; i++) collected += motes.update(0, 0, 1, TICK_S)
    expect(collected).toBe(1)
  })

  it('collects far more with a wider pull', () => {
    const near = new Motes()
    const far = new Motes()
    const rngA = new Rng(21)
    const rngB = new Rng(21)
    for (let i = 0; i < 40; i++) {
      const x = (i % 8) * 30 - 105
      const y = Math.floor(i / 8) * 30 - 60
      near.drop(x, y, 1, rngA)
      far.drop(x, y, 1, rngB)
    }
    const withNarrow = run(near, 0, 0, 40, 1.2)
    const withWide = run(far, 0, 0, 200, 1.2)
    expect(withWide).toBeGreaterThan(withNarrow)
  })

  it('survives a storm of drops without exceeding its pool', () => {
    const motes = new Motes()
    const rng = new Rng(8)
    for (let i = 0; i < 5000; i++) motes.drop(rng.range(-400, 400), rng.range(-400, 400), 1, rng)
    expect(motes.count).toBeLessThanOrEqual(600)
    run(motes, 0, 0, 62, 1)
    for (let i = 0; i < motes.count; i++) {
      expect(Number.isFinite(motes.pool.at(i).x)).toBe(true)
    }
  })
})
