/**
 * 功法 — the arts, finally acting.
 *
 * `data/arts.ts` has held thirty arts since it was written and the simulation
 * never read one of them. The HUD strip lit correctly and then nothing
 * happened, which made a defined system look like decoration. This file is what
 * closes that gap.
 *
 * WHAT IT DOES. `deriveStats` produces the numbers a character permanently
 * brings to an expedition; those change only when equipment or a technique
 * changes, and recomputing them per frame would put the cost of everything the
 * player owns into every tick. An art is the opposite kind of thing: it is true
 * for as long as a condition holds and false the instant it stops. So the arts
 * are a SECOND, cheap layer applied on top of the derived stats each frame,
 * into a caller-owned scratch object so the hot loop allocates nothing.
 *
 * EIGHT OF SIXTEEN EFFECTS, and the honest count of what that buys. Only eight
 * of the vocabulary's effects are used by an art that also has a lever the
 * simulation already owns: arc, bolt, damage, magnet, orbit, range, rate and
 * speed. Those cover 17 of the 30 arts. The remaining 13 wait on the six new
 * features — pierce, crit, echo, push, guard, heal — which are real simulation
 * work and land one at a time. `maxHp` and `nova` are in the vocabulary but no
 * art uses them, which is a relief in the first case: a conditional maximum
 * health would have to decide what happens to current health when the condition
 * drops, and every answer to that is bad.
 *
 * A ONE-FRAME LAG, deliberately. Conditions are sensed at the end of a frame
 * from the state that frame produced, and the arts are applied at the start of
 * the next one. Sensing first would mean sensing from a position the player has
 * not moved to yet. Sixteen milliseconds is not a thing anyone can feel, and
 * the alternative is a circular dependency between movement and the speed art.
 */
import { ARTS, artScale, type Art, type Condition, type EffectKind } from '../data/arts'
import type { Conditions } from './conditions'
import type { Stats } from './loadout'

/** One art the swordsman carries into an expedition, and the grade it is at. */
export interface CarriedArt {
  readonly art: Art
  /** 1 to MAX_ART_LEVEL. Advancing this is a later step; everything is 1 now. */
  readonly level: number
}

/**
 * How much each effect moves, per grade.
 *
 * These are the numbers that decide whether the game still has a curve, so each
 * one carries its reason. The shared `artScale` (1 + 0.35n) is used only where
 * 35% of a stat is a sane step; three effects need their own, and pretending
 * otherwise is how a survivors-like ends up unplayable at minute three.
 */
const STEP = {
  /**
   * Reach, per grade. Gentler than the others because a sweep's area grows with
   * the SQUARE of its reach — +35% range is nearly double the kills, and would
   * make the one art that grants it the only art worth carrying.
   */
  range: 0.22,
  /**
   * Move speed, per grade. Gentlest of all: in a game whose only verb is
   * moving, speed is not one stat among several, it is how much of the screen
   * you are allowed to escape. At +35% nothing can catch you and the genre
   * stops working.
   */
  speed: 0.12,
  /**
   * Pickup radius, per grade. The most generous, because it costs the player
   * nothing to have and takes nothing from the enemies — it removes a chore
   * rather than winning a fight.
   */
  magnet: 0.6,
} as const

/** Guard against the arc test becoming unable to miss. Same cap deriveStats uses. */
const MAX_HALF_ANGLE = 3.0

/**
 * Orbiting blades an art grants when the character has none.
 *
 * An art that granted nothing when the technique was not already owned would be
 * dead weight on most runs, so `orbit`, `bolt` and `nova` GRANT rather than
 * scale. When the player does own the technique, the art scales what they have
 * instead — a build that stacked both should feel stacked.
 */
const GRANT = {
  orbitBlades: 2,
  orbitDamage: 6,
  /** Seconds between bolts. Slower than the technique's 1.5s: this is a bonus. */
  boltInterval: 1.9,
  boltDamage: 10,
} as const

/** Every art on the scroll of one weapon, at one grade. */
export function carriedFor(weaponId: string, level = 1): CarriedArt[] {
  return ARTS.filter((a) => a.weapon === weaponId).map((art) => ({ art, level }))
}

/** Copies `from` into `into`. Fifteen numbers, so the hot loop allocates none. */
function copyStats(from: Stats, into: Stats): Stats {
  into.slashDamage = from.slashDamage
  into.slashInterval = from.slashInterval
  into.slashRange = from.slashRange
  into.slashHalfAngle = from.slashHalfAngle
  into.moveSpeed = from.moveSpeed
  into.pickupRadius = from.pickupRadius
  into.maxHp = from.maxHp
  into.orbitBlades = from.orbitBlades
  into.orbitDamage = from.orbitDamage
  into.boltInterval = from.boltInterval
  into.boltDamage = from.boltDamage
  into.novaInterval = from.novaInterval
  into.novaRadius = from.novaRadius
  into.novaDamage = from.novaDamage
  return into
}

/** The effects this file can act on. The rest are still simulation work. */
export const LIVE_EFFECTS: readonly EffectKind[] = [
  'arc',
  'bolt',
  'damage',
  'magnet',
  'orbit',
  'range',
  'rate',
  'speed',
] as const

const LIVE = new Set<EffectKind>(LIVE_EFFECTS)

/** Whether an art does anything yet. The hub and the sheets read this. */
export const artActs = (art: Art): boolean => LIVE.has(art.effect)

/**
 * Applies every carried art whose condition currently holds, into `out`.
 *
 * `out` is caller-owned and returned, so a frame costs one copy of fifteen
 * numbers and no allocation. Arts of the same effect multiply — two conditions
 * can hold at once by design (a posture and a situation), and a build that
 * lines both up on one stat should feel like it lined them up.
 */
export function applyArts(
  base: Stats,
  carried: readonly CarriedArt[],
  active: Conditions,
  out: Stats,
): Stats {
  copyStats(base, out)
  for (const { art, level } of carried) {
    if (!active[art.condition as Condition]) continue
    const s = artScale(level)
    switch (art.effect) {
      case 'damage':
        out.slashDamage *= s
        break
      case 'rate':
        // Divided, not multiplied: this is an interval, so smaller is faster.
        out.slashInterval /= s
        break
      case 'range':
        out.slashRange *= 1 + STEP.range * level
        break
      case 'arc':
        out.slashHalfAngle = Math.min(MAX_HALF_ANGLE, out.slashHalfAngle * s)
        break
      case 'speed':
        out.moveSpeed *= 1 + STEP.speed * level
        break
      case 'magnet':
        out.pickupRadius *= 1 + STEP.magnet * level
        break
      case 'orbit':
        if (out.orbitBlades === 0) {
          out.orbitBlades = GRANT.orbitBlades + level - 1
          out.orbitDamage = GRANT.orbitDamage * s
        } else {
          out.orbitBlades += 1
          out.orbitDamage *= s
        }
        break
      case 'bolt':
        if (out.boltInterval === 0) {
          out.boltInterval = GRANT.boltInterval / s
          out.boltDamage = GRANT.boltDamage * s
        } else {
          out.boltInterval /= s
          out.boltDamage *= s
        }
        break
      default:
        // pierce, crit, echo, push, guard, heal, nova, maxHp — see the header.
        // Falling through silently is correct: the art is carried and its tile
        // still lights, it simply has no lever yet.
        break
    }
  }
  return out
}
