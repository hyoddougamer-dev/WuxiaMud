/**
 * What the FIELD says a skill is doing.
 *
 * Every effect in this system was already true and none of it was an event. A
 * lit tile is a signal aimed at somebody looking at the tile, and nobody is —
 * they are watching the thing chasing them. So the ring, the band and the hot
 * blade are not decoration: they are the only place the mechanic appears where
 * the player's eye already is.
 *
 * These hold the properties that break silently. A missing glyph does not
 * throw — `BitmapText` drops it and the floater renders as empty space, which
 * is how the parry mark shipped invisible for as long as parries have existed.
 * A cast look that returned the same colour for everything would not throw
 * either; it would just quietly stop distinguishing "I hurt them" from "I
 * saved myself".
 */
import { describe, expect, it } from 'vitest'
import { SKILLS, type SkillEffect } from '../src/data/skills'
import { createBar, updateBar, liveEffects, bladeIsHot } from '../src/sim/skills'
import { createShi, updateShi } from '../src/sim/shi'
import { noConditions } from '../src/sim/conditions'
import { castLook } from '../src/render/casts'
import { FLOAT_CHARS, PARRY_SEAL } from '../src/render/floaters'
import { palette } from '../src/render/palette'
import { defaultBar } from '../src/data/skills'

/** A bar with `ids` slotted and a full pool, advanced one frame. */
const fireAll = (ids: string[]): ReturnType<typeof createBar> => {
  const bar = createBar(ids)
  const shi = createShi()
  updateShi(shi, { pace: 1, turned: false }, 60)
  updateBar(bar, shi, noConditions(), true, 0.016)
  return bar
}

describe('the atlas carries every mark the game floats', () => {
  /**
   * THE ONE THAT SHIPPED BROKEN. `parry` has floated 挡 since parries existed,
   * and the font was installed with digits, a minus and an exclamation mark.
   * BitmapText silently drops a glyph it has no quad for, so the single piece
   * of feedback for the one mechanic that is invisible by nature — a shaft that
   * does NOT hit you — rendered as nothing at all.
   */
  it('includes the parry mark', () => {
    expect(FLOAT_CHARS).toContain(PARRY_SEAL)
  })

  it('includes every character of every skill seal', () => {
    for (const skill of SKILLS) {
      for (const ch of skill.seal) {
        expect(FLOAT_CHARS, `${skill.name} floats "${skill.seal}"`).toContain(ch)
      }
    }
  })

  it('carries no character nothing can float', () => {
    // A dead glyph is not free: every one is rasterised into the atlas the
    // game ships, and the atlas is the reason this font exists at all.
    const floatable = new Set([PARRY_SEAL, ...SKILLS.flatMap((s) => [...s.seal])])
    for (const ch of FLOAT_CHARS) expect(floatable.has(ch), `"${ch}"`).toBe(true)
  })
})

describe('a cast ring says which kind of thing just happened', () => {
  it('separates saving yourself from hurting them, by colour AND direction', () => {
    // Both, because either alone is ambiguous at half a second: a jade ring
    // expanding reads as an attack, and a cinnabar ring collapsing reads as
    // being hit. The pair is what makes it one glance.
    const guard = castLook('guard')
    const damage = castLook('damage')
    expect(guard.colour).not.toBe(damage.colour)
    expect(guard.inward).not.toBe(damage.inward)
  })

  it('draws every effect in one of the three colours the game already uses', () => {
    // A fourth colour would teach a new vocabulary on the one screen with no
    // time to learn it. Cinnabar is damage, jade is mending, gold is qi —
    // everywhere else in this game already.
    const allowed = new Set<number>([palette.cinnabar, palette.jade, palette.gold])
    const effects: SkillEffect[] = [...new Set(SKILLS.map((s) => s.effect))]
    for (const effect of effects) {
      expect(allowed.has(castLook(effect).colour), effect).toBe(true)
    }
  })

  it('gives what keeps you alive a ring that closes in', () => {
    for (const skill of SKILLS) {
      if (skill.effect !== 'guard' && skill.effect !== 'heal') continue
      expect(castLook(skill.effect).inward, skill.name).toBe(true)
    }
  })
})

describe('what the field shows while a skill runs', () => {
  it('reports one live effect per running skill, and none when nothing runs', () => {
    expect(liveEffects(createBar(['sink', 'mountain', 'guardian']))).toEqual([])
    // Two, not three, and that is the design rather than a shortfall: the
    // greatsword's opening three cost 1 + 2 + 2 against a pool of four, so a
    // full pool buys two of them and the third waits. A bar you could dump
    // entirely on the first frame of every fight is a bar with no decision in
    // it — see MAX_SHI. The band count under the figure is therefore a live
    // reading, not a constant.
    const bar = fireAll(['sink', 'mountain', 'guardian'])
    expect(liveEffects(bar)).toHaveLength(2)
    // And a bar the pool CAN cover fires whole.
    expect(liveEffects(fireAll(['sink', 'rend']))).toHaveLength(2)
  })

  it('stops reporting a skill the moment its duration runs out', () => {
    // The band under the figure lasts exactly as long as the effect does, and
    // that IS the claim it makes. A band that outlived its skill would be the
    // HUD lying about the numbers, which is the failure this project keeps
    // having to dig out.
    const skill = SKILLS.find((s) => s.id === 'sink')!
    const bar = fireAll([skill.id])
    expect(liveEffects(bar)).toHaveLength(1)
    updateBar(bar, createShi(), noConditions(), false, skill.duration + 0.001)
    expect(liveEffects(bar)).toHaveLength(0)
  })

  it('heats the blade for what sharpens the sweep, and not for what does not', () => {
    expect(bladeIsHot(['damage'])).toBe(true)
    expect(bladeIsHot(['range', 'crit'])).toBe(true)
    // A bolt and a shockwave are their own drawings on screen. Colouring the
    // sweep for them would claim something about the sweep that is not true.
    expect(bladeIsHot(['bolt'])).toBe(false)
    expect(bladeIsHot(['nova', 'orbit', 'magnet', 'speed', 'guard'])).toBe(false)
    expect(bladeIsHot([])).toBe(false)
  })

  it('gives both classes a default bar that can heat the blade', () => {
    // Not a taste call: the hot sweep is the most visible thing in the system,
    // and a class whose opening three could never trigger it would ship with
    // the feature effectively off.
    for (const weaponId of ['great', 'feidao']) {
      const bar = fireAll(defaultBar(weaponId))
      expect(bladeIsHot(liveEffects(bar)), weaponId).toBe(true)
    }
  })
})
