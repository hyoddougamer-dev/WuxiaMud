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
  artGrowth,
  conditionKind,
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
  into.strike = from.strike
  into.throwCount = from.throwCount
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
  into.artScale = from.artScale
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
 * 内力 — what a level-up grants, now that it no longer touches the arts.
 *
 * Deliberately dull, and that is the design. The interesting growth inside a
 * run is the drop; this is the background hum underneath it, the thing that
 * makes the clock itself worth something on a run where nothing good falls. It
 * is flat, it is two numbers, and it can never be confused with an art —
 * which is precisely the confusion the 感悟 banner used to cause.
 */
export const MIGHT = {
  /** Sweep damage per level past the first. */
  damage: 1.6,
  /** Maximum health per level past the first. */
  maxHp: 6,
} as const

function addMight(into: Stats, level: number): void {
  const n = Math.max(0, Math.floor(level) - 1)
  into.slashDamage += MIGHT.damage * n
  into.maxHp += MIGHT.maxHp * n
}

/**
 * How hard an art is firing right now: nothing, or a discharge worth `spent`.
 *
 * `desperate` is 危 in its new shape — see DESPERATE_FRACTION in data/arts.ts.
 * It lifts EVERY art a grade rather than gating one of them, so the worst
 * moment of a run is the moment a comeback is worth attempting.
 */
export interface Surge {
  /** 势 feeding the live discharge. Zero means no spending art fires. */
  readonly spent: number
  readonly desperate: boolean
}
export const NO_SURGE: Surge = { spent: 0, desperate: false }

/** Reads a `ConditionSense` as a Surge, which is all applyArts needs of it. */
export function surgeOf(sense: { spent: number; desperate: boolean }): Surge {
  return { spent: sense.spent, desperate: sense.desperate }
}

/**
 * Grade five at full 势. Past this the numbers stop meaning anything.
 *
 * A charging art asks for `artGrowth(level)` — the same steady bonus it always
 * paid. A spending art asks for `artGrowth(level * spent)`, which is why
 * banking 势 before planting your feet is worth doing: the same art at the same
 * grade pays up to three times the shape.
 */
const MAX_POWER = MAX_ART_LEVEL * 3

/**
 * Applies every carried art that is firing right now, into `out`.
 *
 * `out` is caller-owned and returned, so a frame costs one copy of fifteen
 * numbers and no allocation. Arts of the same effect multiply — two conditions
 * can hold at once by design (a posture and a situation), and a build that
 * lines both up on one stat should feel like it lined them up.
 *
 * WHAT FIRES DEPENDS ON THE KIND OF CONDITION, and that is the whole repair.
 * A charging art (running, turning) pays while its posture holds, as before. A
 * spending art (still, surrounded) pays NOTHING while its condition merely
 * holds — it pays in a burst, on the frame the condition arrives, scaled by
 * the 势 banked before it. Being surrounded for a minute is one burst, not
 * sixty seconds of quiet bonus; planting your feet with nothing banked does
 * nothing at all.
 */
export function applyArts(
  base: Stats,
  carried: readonly CarriedArt[],
  active: Conditions,
  out: Stats,
  runLevel = 1,
  surge: Surge = NO_SURGE,
): Stats {
  copyStats(base, out)
  // 内力 folded in HERE rather than into `base`, and that is not tidiness. The
  // run's levels are a running total; adding them to the permanent block would
  // compound every time that block was recomputed — and the block IS recomputed
  // mid-run now, every time a piece is put on. Folding them into the per-frame
  // copy makes double-counting impossible by construction rather than by
  // everybody remembering. See MIGHT.
  addMight(out, runLevel)
  for (const { art, level: grade } of carried) {
    const spending = conditionKind(art.condition as Condition) === 'spend'
    // 危: every art a grade harder while the run is nearly lost.
    const level = surge.desperate ? Math.min(MAX_ART_LEVEL, grade + 1) : grade
    if (spending) {
      if (surge.spent <= 0) continue
    } else if (!active[art.condition as Condition]) {
      continue
    }
    // 神 multiplies the GRADE, not the result, so a Spirit build compounds with
    // the 势 behind a discharge instead of adding beside it.
    //
    // CAPPED BEFORE 神, NOT AFTER. The ceiling is there to stop grade times
    // momentum running away; applying it afterwards would mean a build at top
    // grade and full 势 is already at the cap and every point of Spirit it owns
    // does nothing — a whole attribute silently worth zero to the players most
    // likely to have invested in it.
    const power = Math.min(MAX_POWER, spending ? level * surge.spent : level) * out.artScale
    const s = artGrowth(power)
    switch (art.effect) {
      case 'damage':
        out.slashDamage *= s
        break
      case 'rate':
        // Divided, not multiplied: this is an interval, so smaller is faster.
        out.slashInterval /= s
        break
      case 'range':
        out.slashRange *= 1 + STEP.range * power
        break
      case 'arc':
        out.slashHalfAngle = Math.min(MAX_HALF_ANGLE, out.slashHalfAngle * s)
        break
      case 'speed':
        out.moveSpeed *= 1 + STEP.speed * power
        break
      case 'magnet':
        out.pickupRadius *= 1 + STEP.magnet * power
        break
      case 'orbit':
        if (out.orbitBlades === 0) {
          out.orbitBlades = GRANT.orbitBlades + power - 1
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
        out.slashHalfAngle *= Math.pow(STEP.pierceArc, 1 / (1 + (power - 1) * 0.4))
        out.slashRange *= 1 + STEP.pierceRange * power
        break
      case 'crit': {
        // Keeps the SHORTER cycle when two crit arts overlap, rather than
        // multiplying two counters into something nobody can predict.
        const every = CRIT_EVERY[Math.min(Math.round(power), CRIT_EVERY.length - 1)]!
        out.critEvery = out.critEvery === 0 ? every : Math.min(out.critEvery, every)
        break
      }
      case 'echo':
        out.echoDelay = ECHO_DELAY
        out.echoDamage += STEP.echo * power
        break
      case 'push':
        out.pushForce += STEP.push * power
        break
      case 'guard':
        // Multiplicative, so stacked guards approach zero without ever
        // reaching it. Additive reduction reaches invulnerability, and a
        // survivors-like with an invulnerable player has no game left.
        out.damageScale *= Math.pow(STEP.guard, power)
        break
      case 'heal':
        out.healPerKill += STEP.heal * power
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
// 器蕴 — the arts come from what you carry
// ---------------------------------------------------------------------------
/**
 * WHAT THIS REPLACED, AND WHY.
 *
 * The arts used to be raised by two separate ladders and neither was one.
 *
 *   - 感悟, during a run: every level-up pushed the next carried art up a grade,
 *     and the whole climb was thrown away when the run ended. A player watched
 *     "Flow 2 → 3" flash past mid-fight, could not act on it, could not keep it,
 *     and started the next expedition back at the bottom.
 *   - 秘笈, between runs: a manual raised the grade an art OPENED at. Permanent,
 *     but invisible — a number in a save file that the player never saw move.
 *
 * Two ladders climbing the same number, one of them a treadmill, and neither
 * attached to anything the player could look at. That is what "levels sobem de
 * forma ridícula" and "skills sobem em combate não faz sentido" were reports of.
 *
 * THE RULE NOW IS ONE SENTENCE: the weapon decides what you do, and the gear
 * decides how hard you do it.
 *
 *   - WHICH arts — the scroll of the weapon in hand, as ever.
 *   - HOW MANY of them wake — the weapon's RUNG. A grey blade wakes one art; a
 *     purple blade wakes four; a divine blade wakes the whole scroll.
 *   - WHAT GRADE they sit at — the rungs of everything worn, added up.
 *
 * Every one of those three is something the player is already looking at. The
 * art strip stops being a mystery meter and becomes a readout of the gear.
 *
 * AND IT KEEPS THE GENRE. A survivors-like needs minute eight to differ from
 * minute one. It still does — but the growth is now the drop. Walk over the
 * purple sword at minute six and a fourth art wakes, mid-fight, in the colour
 * you saw land. That is the beat the treadmill was standing in for.
 */

/**
 * How much added-up worn rung buys one grade of every art.
 *
 * Four, so the ladder spans exactly the space the rarities span: four slots at
 * 凡 is nothing (grade 1), four at 良 is grade 2, four at 珍 grade 3, four at
 * 宝 grade 4, four at 神 grade 5. Every rung of gear moves the number, and the
 * cap is reached only by a set that is nearly all divine — which is the point
 * of having a cap at all.
 */
export const ATTUNE_PER_GRADE = 4

/**
 * How many of the scroll the weapon in hand wakes.
 *
 * Starts at one rather than zero on purpose. A swordsman with a rusty blade is
 * still a swordsman: they have an art, it fires, and the strip has something on
 * it from the first second of the first expedition. Handing a new player an
 * empty scroll to teach them that rarity matters would teach them instead that
 * the game does nothing.
 */
export function awakeCount(weaponRarity: number, scrollLength: number): number {
  const rung = Math.max(0, Math.floor(weaponRarity))
  return Math.max(0, Math.min(scrollLength, 1 + rung))
}

/**
 * The grade every awake art sits at, from the rungs of everything worn.
 *
 * The WEAPON'S rung counts here too, and it is the only number that appears in
 * both halves of the rule. That is deliberate rather than sloppy: a great blade
 * should be felt twice — once as another art waking, once as every art hitting
 * harder — because "the weapon is the class" is the promise this whole system
 * rests on, and a promise you only feel once is a small promise.
 */
export function artGrade(wornRarities: readonly number[]): number {
  let total = 0
  for (const r of wornRarities) total += Math.max(0, Math.floor(r))
  return Math.min(MAX_ART_LEVEL, 1 + Math.floor(total / ATTUNE_PER_GRADE))
}

/**
 * The arts a kit grants: which, how many, and at what grade.
 *
 * `orderedIds` is the whole scroll in the order the player set — see
 * `equippedIds`. Slicing rather than filtering is what makes that order a real
 * decision: the arts that wake are the ones at the TOP of your list, so a
 * player carrying a common blade is choosing their single art, not being handed
 * whichever one the table happened to list first.
 */
export function attune(
  orderedIds: readonly string[],
  weaponRarity: number,
  wornRarities: readonly number[],
): CarriedArt[] {
  const level = artGrade(wornRarities)
  const awake = awakeCount(weaponRarity, orderedIds.length)
  const carried: CarriedArt[] = []
  for (const id of orderedIds.slice(0, awake)) {
    const art = ARTS.find((a) => a.id === id)
    // Unknown ids are dropped rather than thrown on: a save can name an art
    // from a build that renamed one, and losing a slot beats losing the run.
    if (art) carried.push({ art, level })
  }
  return carried
}

/**
 * The weapon's whole scroll, in the order the player set.
 *
 * RETURNS ALL FIVE, not the four chosen. The chosen ones lead, in their order,
 * and the rest of the scroll follows — because how far down this list the arts
 * actually wake is decided by the blade in hand, and a 神 weapon reaches the
 * fifth. Truncating here would make that reward unreachable and would hide the
 * fact that the order is a full ranking rather than a set.
 *
 * The fallback is not a placeholder to remove later — it is what makes the
 * 法 tab optional. A player who never opens it still walks out with a coherent
 * build, and a save written before equipping existed still means something.
 */
export function equippedIds(arts: Record<string, string[]>, weaponId: string): string[] {
  const scroll = ARTS.filter((a) => a.weapon === weaponId).map((a) => a.id)
  const chosen = (arts[weaponId] ?? []).slice(0, EQUIPPED_ARTS).filter((id) => scroll.includes(id))
  return [...chosen, ...scroll.filter((id) => !chosen.includes(id))]
}
