/**
 * The mark a skill makes when it goes off.
 *
 * WHY THIS EXISTS. Every effect a skill has was already true and none of it was
 * an EVENT. Sink raised your damage by 55% and the only trace was that the
 * numbers over the bodies got bigger; Mountain turned away a third of what hit
 * you and left no mark at all. The tile in the HUD lit — and nobody is looking
 * at the HUD, they are watching the thing chasing them. A player reported this
 * as "não se percebe nada" about the system this replaced, and the replacement
 * would have inherited it exactly.
 *
 * So a cast draws itself ON THE FIGURE, where the eye already is: a ring of ink
 * thrown outward from where you stand, in the colour of what the skill does.
 * It costs one stroke, it is gone in half a second, and it is the difference
 * between a buff and a moment.
 *
 * ONE Graphics, redrawn each frame, like every other layer in this game. The
 * pool is fixed and saturates rather than growing: three slots fire at most a
 * few times a second, and a ring that arrives during a wall of other rings is
 * a ring nobody reads anyway.
 */
import { Graphics } from 'pixi.js'
import { palette } from './palette'
import { easing } from '../core/tween'
import type { SkillEffect } from '../data/skills'

/** Rings alive at once. Three slots on a bar cannot outrun this. */
const CAPACITY = 8

/** Seconds a ring takes to travel out and fade. A glance, not an animation. */
const LIFE = 0.5

/** World units the ring reaches. Wider than the figure, well under the sweep. */
const REACH = 62

/**
 * Where an outward ring starts.
 *
 * Clear of the band that sits under the figure while a skill is live (radius
 * 26 — see main.ts), because for the first fifth of a second the two were the
 * same ellipse in the same colour and read as one thickening line rather than
 * as an event on top of a state.
 */
const BIRTH = 34

interface Ring {
  x: number
  y: number
  life: number
  colour: number
  /** Rings drawn inward instead of outward — see `cast` below. */
  inward: boolean
}

export interface Casts {
  /**
   * A skill just fired at this position.
   *
   * `inward` is for the defensive ones. A ring collapsing toward the figure
   * reads as something closing around you; the same ring expanding reads as
   * something you threw. They are opposite fantasies and the direction is the
   * cheapest way to tell them apart without a second colour.
   */
  cast(x: number, y: number, colour: number, inward: boolean): void
  update(dt: number): void
  /** Redraws every live ring. Call once a frame, after `update`. */
  draw(gfx: Graphics): void
  clear(): void
}

export function createCasts(): Casts {
  const rings: Ring[] = []
  for (let i = 0; i < CAPACITY; i++) {
    rings.push({ x: 0, y: 0, life: 0, colour: palette.gold, inward: false })
  }

  return {
    cast(x, y, colour, inward) {
      // Saturates rather than evicting: the ring that arrives into a full pool
      // is the least informative one on screen by definition.
      const free = rings.find((r) => r.life <= 0)
      if (!free) return
      free.x = x
      free.y = y
      free.life = LIFE
      free.colour = colour
      free.inward = inward
    },

    update(dt) {
      for (const ring of rings) if (ring.life > 0) ring.life = Math.max(0, ring.life - dt)
    },

    draw(gfx) {
      for (const ring of rings) {
        if (ring.life <= 0) continue
        const t = 1 - ring.life / LIFE
        // Out fast and slowing, which is how ink leaves a brush. Linear reads
        // as a loading spinner.
        const eased = easing.outCubic(t)
        const r = ring.inward ? REACH * (1 - eased * 0.62) + BIRTH * eased : BIRTH + REACH * eased
        // Squashed to the ground plane, because everything else in this game is
        // drawn from three-quarters above and a true circle would float.
        gfx
          .ellipse(ring.x, ring.y, r, r * 0.42)
          .stroke({
            color: ring.colour,
            // Thins as it goes, so the ring dissolves rather than blinking out.
            width: 3.2 * (1 - eased * 0.7),
            alpha: 0.75 * (1 - eased),
          })
      }
    },

    clear() {
      for (const ring of rings) ring.life = 0
    },
  }
}

/**
 * How a given effect throws its ring: what colour, and which way.
 *
 * THREE COLOURS AND TWO DIRECTIONS, and no more, because the ring is read in a
 * fifth of a second by someone being chased. It answers one question — "was
 * that for hurting them, for saving me, or for moving?" — and a palette of
 * fourteen would answer none of them.
 *
 * The colours are the ones this game already uses for exactly these meanings:
 * cinnabar is what damage is drawn in, jade is what mending is drawn in (see
 * floaters.mend), and gold is qi. Inventing a fourth would teach a new
 * vocabulary on the one screen with no time to learn it.
 */
export function castLook(effect: SkillEffect): { colour: number; inward: boolean } {
  switch (effect) {
    // What keeps you alive closes AROUND you. The direction is doing real work
    // here: the same jade ring expanding would read as an attack.
    case 'guard':
    case 'heal':
      return { colour: palette.jade, inward: true }
    // Qi, and the two that move rather than strike. `magnet` pulls inward for
    // the same reason guard does — it is a thing coming to you.
    case 'speed':
      return { colour: palette.gold, inward: false }
    case 'magnet':
      return { colour: palette.gold, inward: true }
    // Everything that makes the blade worse to be near.
    default:
      return { colour: palette.cinnabar, inward: false }
  }
}
