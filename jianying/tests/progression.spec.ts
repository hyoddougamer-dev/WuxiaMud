import { describe, expect, it } from 'vitest'
import { Rng } from '../src/core/rng'
import { TICK_S } from '../src/core/loop'
import { xpForLevel } from '../src/data/insight'
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

describe('the baseline the skill bar folds into', () => {
  it('starts from the weapon, with nothing taken', () => {
    const s = deriveStats()
    expect(s.slashHalfAngle).toBeCloseTo(DEFAULT_WEAPON.halfAngle, 6)
    expect(s.slashDamage).toBeCloseTo(DEFAULT_WEAPON.damage, 9)
    expect(s.slashInterval).toBeCloseTo(DEFAULT_WEAPON.interval, 9)
  })

  it('leaves every second attack OFF until a skill grants it', () => {
    // This is not tidiness, it is the contract `applySkills` is written
    // against: it grants an effect only where it finds a zero, so a non-zero
    // floor here would mean Guardian Blades silently kept the floor's damage
    // instead of its own. See the grant branches in sim/skills.ts.
    const s = deriveStats()
    expect(s.orbitBlades).toBe(0)
    expect(s.orbitDamage).toBe(0)
    expect(s.boltInterval).toBe(0)
    expect(s.boltDamage).toBe(0)
    expect(s.novaInterval).toBe(0)
    expect(s.novaDamage).toBe(0)
  })

  it('still gives a granted shockwave a size to be', () => {
    // The one exception, and it has to be one: a nova of radius zero hits
    // nothing at all, so the radius is a property of the character rather
    // than of the skill that sets it off.
    expect(deriveStats().novaRadius).toBeGreaterThan(0)
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
    motes.drop(0, 0, 1, new Rng(1), 0, 0)
    expect(run(motes, 0, 0, 62, 2)).toBe(1)
    expect(motes.count).toBe(0)
  })

  it('is left behind when the player is far', () => {
    const motes = new Motes()
    motes.drop(600, 600, 1, new Rng(1), 0, 0)
    expect(run(motes, 0, 0, 62, 2)).toBe(0)
    expect(motes.count).toBe(1)
  })

  it('keeps chasing once caught, even if the player walks away', () => {
    // Otherwise motes twitch in and out of pursuit at the edge of the pull,
    // which looks broken and feels arbitrary.
    const motes = new Motes()
    motes.drop(40, 0, 1, new Rng(5), 0, 0)
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
      near.drop(x, y, 1, rngA, 0, 0)
      far.drop(x, y, 1, rngB, 0, 0)
    }
    const withNarrow = run(near, 0, 0, 40, 1.2)
    const withWide = run(far, 0, 0, 200, 1.2)
    expect(withWide).toBeGreaterThan(withNarrow)
  })

  it('still pays the newest kill once the field is full', () => {
    // The leak this pins: `spawn()` returning null meant a full field silently
    // dropped nothing, so every kill after saturation paid the player zero.
    // Measured in a real run, that froze Insight at grade 10 while the kill
    // count ran to fourteen hundred.
    const motes = new Motes()
    const rng = new Rng(3)
    // Fill the field with qi abandoned far away, as a player who never doubles
    // back leaves it.
    for (let i = 0; i < 600; i++) motes.drop(4000, 4000, 1, rng, 0, 0)
    expect(motes.count).toBe(600)

    // A kill at the player's feet must still pay, and must not grow the pool.
    motes.drop(0, 0, 7, rng, 0, 0)
    expect(motes.count).toBe(600)
    expect(run(motes, 0, 0, 62, 2)).toBe(7)
  })

  it('gives up the furthest qi first, never a mote already flying in', () => {
    // The awkward case that decides the rule: a mote the player earned, then
    // ran away from. It is the FURTHEST thing on the field, so furthest-first
    // would recycle exactly the qi the player is owed.
    const motes = new Motes()
    const rng = new Rng(4)
    motes.drop(55, 0, 5, rng, 0, 0)
    run(motes, 0, 0, 62, TICK_S) // inside the pull: it latches on

    const away = 4000
    for (let i = 0; i < 599; i++) motes.drop(away, 0, 1, rng, away, 0)
    expect(motes.count).toBe(600)
    motes.drop(away, 0, 1, rng, away, 0) // full, so something is recycled

    let earned = 0
    for (let i = 0; i < motes.count; i++) {
      const m = motes.pool.at(i)
      if (m.value === 5 && m.homing) earned++
    }
    expect(earned).toBe(1)
  })

  it('survives a storm of drops without exceeding its pool', () => {
    const motes = new Motes()
    const rng = new Rng(8)
    for (let i = 0; i < 5000; i++)
      motes.drop(rng.range(-400, 400), rng.range(-400, 400), 1, rng, 0, 0)
    expect(motes.count).toBeLessThanOrEqual(600)
    run(motes, 0, 0, 62, 1)
    for (let i = 0; i < motes.count; i++) {
      expect(Number.isFinite(motes.pool.at(i).x)).toBe(true)
    }
  })
})
