/**
 * The four conditions, read off the run, and the 势 they trade in.
 *
 * This is the input layer for 功法 (see data/arts.ts): every art waits on one
 * of these, and none of them is a button. The whole design rests on the player
 * being able to PROVOKE a condition with the thumb already on the joystick, so
 * what counts as "still" or "running" has to be something a person can hit on
 * purpose, not a threshold that flickers.
 *
 * Three rules shaped the numbers below.
 *
 * HOLD, DON'T FLICKER. Both postures need to be sustained before they count —
 * a condition that fires on a single frame of low speed would trip constantly
 * while dodging, and the player would never learn what caused it. That delay
 * is also the game asking for a commitment, which is what makes it a decision.
 *
 * THE POSTURES ARE EXCLUSIVE. Standing still, running flat out and turning
 * hard cannot be true at the same time, by construction. Without that the
 * system rots into "everything fires always", which is passive with extra
 * steps — the failure this design exists to avoid.
 *
 * SITUATION IS NOT POSTURE. Surrounded is not a thing you hold, it is a thing
 * that happens to you, and it may overlap a posture. That is deliberate: it is
 * the condition a player reacts to rather than chooses.
 *
 * 势 — MOMENTUM — IS WHAT MAKES THEM ONE SYSTEM. Holding a charging posture
 * banks it; entering a spending one discharges the lot in a single burst. The
 * numbers below are chosen so the loop is short enough to be a rhythm rather
 * than a chore: a couple of seconds of running is a full bank, and a burst is
 * about the length of one committed exchange.
 */
import { DESPERATE_FRACTION, type Condition } from '../data/arts'

/** How slow counts as still, as a fraction of top speed. */
const STILL_SPEED = 0.1
/** How fast counts as running. */
const RUN_SPEED = 0.86
/**
 * Seconds a posture must be held before it counts.
 *
 * Still was 0.55 and is now 0.3. The hold exists to stop a posture flickering
 * on one frame of low speed while dodging — that is all it was ever for — and
 * 0.55 plus the player's own braking meant nearly three quarters of a second
 * planted in the middle of a crowd before anything happened. Measured, a pilot
 * that deliberately stood still 37% of the time banked the condition for 17%:
 * more than half of every stop was eaten by the threshold. A burst that pays
 * on arrival does not need a long commitment to feel earned; the burst IS the
 * commitment.
 */
const STILL_HOLD = 0.3
const RUN_HOLD = 0.9
/** How sharp a reversal counts as a turn: dot product below this. cos(120°). */
const TURN_DOT = -0.5
/** How long a turn stays lit after it happens. */
const TURN_FLASH = 0.8
/** Enemies within this radius to count as surrounded. */
export const SURROUND_RADIUS = 120
const SURROUND_COUNT = 5
/**
 * 势 — how much a charging posture banks per second, and the ceiling.
 *
 * Three at 1.25/s is 2.4 seconds of running for a full bank, which is about
 * one crossing of the screen. Long enough that a full burst is a thing you set
 * up, short enough that the loop turns over several times a minute.
 */
export const MAX_MOMENTUM = 3
const MOMENTUM_PER_SECOND = 1.25
/** A turn is a sharper commitment than a straight run, and pays like one. */
const TURN_MOMENTUM_BONUS = 1.6
/** How long a discharge lasts. About one committed exchange. */
export const BURST_SECONDS = 0.9

export type Conditions = Record<Condition, boolean>

export function noConditions(): Conditions {
  return { still: false, running: false, turn: false, surrounded: false }
}

export interface ConditionSense {
  /** Which hold right now. Read by the HUD and by the arts. */
  active: Conditions
  stillFor: number
  runningFor: number
  turnFor: number
  /** Last direction the player was actually MOVING, not facing. */
  lastX: number
  lastY: number
  /** 势 banked, 0..MAX_MOMENTUM. */
  momentum: number
  /** Seconds left of a live discharge. */
  burst: number
  /** How much 势 fed the live discharge. Zero when none is running. */
  spent: number
  /** Whether a spending condition held last step, for edge detection. */
  wasSpending: boolean
  /** Health is low enough that every art fires a grade higher. */
  desperate: boolean
}

export function createSense(): ConditionSense {
  return {
    active: noConditions(),
    stillFor: 0,
    runningFor: 0,
    turnFor: 0,
    lastX: 0,
    lastY: 0,
    momentum: 0,
    burst: 0,
    spent: 0,
    wasSpending: false,
    desperate: false,
  }
}

export interface ConditionInput {
  /** World units per second. */
  speed: number
  maxSpeed: number
  /** Unit direction of travel. Zero when standing. */
  moveX: number
  moveY: number
  /** Enemies within SURROUND_RADIUS. */
  nearby: number
  hp: number
  maxHp: number
}

/**
 * Advances the sense by one step and returns what holds.
 *
 * Mutates and returns `sense.active` rather than allocating: this runs every
 * frame of a game that already refuses to allocate in its hot loop.
 */
export function senseConditions(
  sense: ConditionSense,
  input: ConditionInput,
  dt: number,
): Conditions {
  const { speed, maxSpeed, moveX, moveY, nearby, hp, maxHp } = input
  const ratio = maxSpeed > 0 ? speed / maxSpeed : 0
  const moving = moveX !== 0 || moveY !== 0

  // --- turn: a reversal of the direction of TRAVEL ------------------------
  // Facing would be wrong here. The figure keeps facing where it last aimed
  // while standing still, so a player who stops and starts would read as having
  // turned without having moved at all.
  if (moving) {
    if (sense.lastX !== 0 || sense.lastY !== 0) {
      const dot = moveX * sense.lastX + moveY * sense.lastY
      if (dot < TURN_DOT) sense.turnFor = TURN_FLASH
    }
    sense.lastX = moveX
    sense.lastY = moveY
  }
  sense.turnFor = Math.max(0, sense.turnFor - dt)

  // --- postures -----------------------------------------------------------
  sense.stillFor = ratio <= STILL_SPEED ? sense.stillFor + dt : 0
  sense.runningFor = ratio >= RUN_SPEED ? sense.runningFor + dt : 0

  const turn = sense.turnFor > 0
  // A turn suppresses the other two while it lasts. Reversing hard means
  // passing through a moment of low speed, which would otherwise read as
  // standing still and light two postures at once.
  sense.active.turn = turn
  sense.active.still = !turn && sense.stillFor >= STILL_HOLD
  sense.active.running = !turn && sense.runningFor >= RUN_HOLD

  // --- situations ---------------------------------------------------------
  sense.active.surrounded = nearby >= SURROUND_COUNT
  sense.desperate = maxHp > 0 && hp / maxHp <= DESPERATE_FRACTION

  updateMomentum(sense, dt)
  return sense.active
}

/**
 * Banks 势 while a charging posture holds, and discharges it on entering a
 * spending one.
 *
 * ON THE RISING EDGE of standing still, not while it holds. Planting your feet
 * is a decision, and a decision should pay on arrival — the alternative is the
 * long planted hold that made 静 worth 17% of a run to the one pilot that even
 * tried it.
 *
 * A discharge needs at least one full point, so a spending art can never fire
 * off nothing. That is the rule that ties the two halves together: without
 * having been in the fight first, standing still does nothing at all.
 */
function updateMomentum(sense: ConditionSense, dt: number): void {
  if (sense.burst > 0) {
    sense.burst = Math.max(0, sense.burst - dt)
    if (sense.burst === 0) sense.spent = 0
  }

  const charging = sense.active.running || sense.active.turn || sense.active.surrounded
  if (charging) {
    const rate = MOMENTUM_PER_SECOND * (sense.active.turn ? TURN_MOMENTUM_BONUS : 1)
    sense.momentum = Math.min(MAX_MOMENTUM, sense.momentum + rate * dt)
  }

  const spending = sense.active.still
  if (spending && !sense.wasSpending && sense.momentum >= 1) {
    sense.spent = Math.floor(sense.momentum)
    sense.momentum = 0
    sense.burst = BURST_SECONDS
  }
  sense.wasSpending = spending
}

/** Conditions that hold, as their seals — what the HUD and the harness read. */
export function activeSeals(active: Conditions): Condition[] {
  const out: Condition[] = []
  if (active.still) out.push('still')
  if (active.running) out.push('running')
  if (active.turn) out.push('turn')
  if (active.surrounded) out.push('surrounded')
  return out
}
