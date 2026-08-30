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
 * FOURTEEN EFFECTS, AND ALL THIRTY ARTS ACT. This landed in two passes: eight
 * effects that were already levers the simulation owned (arc, bolt, damage,
 * magnet, orbit, range, rate, speed), covering 17 arts, and then the six that
 * were real simulation work (pierce, crit, echo, push, guard, heal) for the
 * other 13. `maxHp` and `nova` remain in the vocabulary with no art using them,
 * and the first is a relief: a conditional maximum health would have to decide
 * what happens to current health when the condition drops, and every answer to
 * that is bad.
 *
 * A ONE-FRAME LAG, deliberately. Conditions are sensed at the end of a frame
 * from the state that frame produced, and the arts are applied at the start of
 * the next one. Sensing first would mean sensing from a position the player has
 * not moved to yet. Sixteen milliseconds is not a thing anyone can feel, and
 * the alternative is a circular dependency between movement and the speed art.
 */
import {
  ARTS,
  EQUIPPED_ARTS,
  MAX_ART_LEVEL,
  artScale,
  type Art,
  type Condition,
  type EffectKind,
} from '../data/arts'
import type { Conditions } from './conditions'
import type { Stats } from './loadout'

/** One art the swordsman carries into an expedition, and the grade it is at. */
export interface CarriedArt {
  readonly art: Art
  /**
   * 1 to MAX_ART_LEVEL.
   *
   * `advanceArt` raises it and is fully tested, but nothing calls it in the
   * game yet: 感悟 still buys a technique card. See docs/ARTES.md for the
   * measurement that is holding that swap back.
   */
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
  /**
   * The thrust, per grade: the arc closes to this fraction while the reach
   * grows by the same step the range art uses.
   *
   * A TRADE, not a bonus, and it had to become one. The sweep already strikes
   * every enemy inside its arc, so "runs through what it hits" was ALREADY
   * true and `pierce` would have been a word with no effect behind it. Narrow
   * and long is a genuinely different shape from wide and short — it is the
   * thrust the art is named for — and it costs something, which a conditional
   * art can afford to.
   */
  pierceArc: 0.5,
  pierceRange: 0.35,
  /** Damage the echo carries, per grade. Never the full blow. */
  echo: 0.3,
  /** Distance a struck enemy is shoved, per grade. */
  push: 26,
  /** Damage taken is multiplied by this, per grade, compounding. */
  guard: 0.86,
  /** Health per kill, per grade. */
  heal: 1.2,
} as const

/** Sweeps between doubled blows at grade n. Fewer is better, so it counts down. */
const CRIT_EVERY = [0, 5, 4, 3, 3, 2] as const

/** How long the echo waits before it lands. Long enough to read as a second blow. */
const ECHO_DELAY = 0.22

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
  into.critEvery = from.critEvery
  into.echoDelay = from.echoDelay
  into.echoDamage = from.echoDamage
  into.pushForce = from.pushForce
  into.damageScale = from.damageScale
  into.healPerKill = from.healPerKill
  return into
}

/** The effects this file can act on. The rest are still simulation work. */
export const LIVE_EFFECTS: readonly EffectKind[] = [
  'arc',
  'bolt',
  'crit',
  'damage',
  'echo',
  'guard',
  'heal',
  'magnet',
  'orbit',
  'pierce',
  'push',
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
      case 'pierce':
        // Narrow AND long. See STEP.pierceArc for why this is a trade.
        out.slashHalfAngle *= Math.pow(STEP.pierceArc, 1 / (1 + (level - 1) * 0.4))
        out.slashRange *= 1 + STEP.pierceRange * level
        break
      case 'crit': {
        // Keeps the SHORTER cycle when two crit arts overlap, rather than
        // multiplying two counters into something nobody can predict.
        const every = CRIT_EVERY[Math.min(level, CRIT_EVERY.length - 1)]!
        out.critEvery = out.critEvery === 0 ? every : Math.min(out.critEvery, every)
        break
      }
      case 'echo':
        out.echoDelay = ECHO_DELAY
        out.echoDamage += STEP.echo * level
        break
      case 'push':
        out.pushForce += STEP.push * level
        break
      case 'guard':
        // Multiplicative, so stacked guards approach zero without ever
        // reaching it. Additive reduction reaches invulnerability, and a
        // survivors-like with an invulnerable player has no game left.
        out.damageScale *= Math.pow(STEP.guard, level)
        break
      case 'heal':
        out.healPerKill += STEP.heal * level
        break
      default:
        // nova and maxHp are in the vocabulary and no art uses them. Falling
        // through is correct rather than lazy: an art with no lever must be a
        // no-op, not a partial effect landing on whichever stat looked closest.
        break
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// 感悟 — how a run grows now
// ---------------------------------------------------------------------------
/**
 * The in-run progression, which replaces the three technique cards.
 *
 * The cards were the motor of the genre — they are what made a run GROW while
 * the enemies grew — and taking them away without a replacement would break the
 * curve outright. The replacement, agreed in docs/ARTES.md, is that each 感悟
 * advances the next art in the order you set, cycling.
 *
 * WHY THAT IS BETTER THAN A DRAW. Three cards offered at random are a sorting
 * problem, not a decision: over a run you take most of what you are shown and
 * two players with the same weapon end up in nearly the same place. Advancing a
 * list you chose in the hub means the run deepens the build you brought, and
 * the order you put them in is a real choice made with time to think rather
 * than one made in a freeze-frame with things closing in.
 *
 * GRADES ARE PER RUN, like the cards were. What persists is which arts you
 * know and which four you carry; what resets is how far they got. That keeps
 * the survivors-like shape — every run starts at the bottom of its own curve.
 */
export interface ArtProgress {
  /** The four carried, in the order they advance. Mutated in place. */
  readonly carried: CarriedArt[]
  /** Index of the next art to advance. */
  next: number
}

/** The grade every carried art starts a run at. */
export const START_LEVEL = 1

/**
 * Sets up a run's progression from an ordered list of art ids.
 *
 * Unknown ids are dropped rather than throwing: a save can name an art from a
 * build that renamed one, and losing a slot beats losing the expedition.
 */
export function beginProgress(artIds: readonly string[]): ArtProgress {
  const carried: CarriedArt[] = []
  for (const id of artIds) {
    const art = ARTS.find((a) => a.id === id)
    if (art) carried.push({ art, level: START_LEVEL })
  }
  return { carried, next: 0 }
}

/**
 * Advances one art by a grade and returns it, or null if every one is capped.
 *
 * Walks forward from `next` rather than simply taking it, so a maxed art does
 * not swallow a 感悟 and leave the player with a level-up that did nothing.
 */
export function advanceArt(progress: ArtProgress): CarriedArt | null {
  const n = progress.carried.length
  if (n === 0) return null
  for (let step = 0; step < n; step++) {
    const i = (progress.next + step) % n
    const entry = progress.carried[i]!
    if (entry.level < MAX_ART_LEVEL) {
      const raised: CarriedArt = { art: entry.art, level: entry.level + 1 }
      progress.carried[i] = raised
      progress.next = (i + 1) % n
      return raised
    }
  }
  return null
}

/**
 * The four art ids a weapon carries, falling back to the head of its scroll.
 *
 * The fallback is not a placeholder to remove later — it is what makes the
 * 法 tab optional. A player who never opens it still walks out with a real
 * build, and a save written before equipping existed still means something.
 * Choosing simply replaces a default that was already coherent.
 */
export function equippedIds(
  arts: Record<string, string[]>,
  weaponId: string,
): string[] {
  const chosen = arts[weaponId]
  if (chosen && chosen.length > 0) return chosen.slice(0, EQUIPPED_ARTS)
  return ARTS.filter((a) => a.weapon === weaponId)
    .slice(0, EQUIPPED_ARTS)
    .map((a) => a.id)
}
