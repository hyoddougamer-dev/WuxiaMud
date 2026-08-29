/**
 * The five conditions, read off the run.
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
 * SITUATION IS NOT POSTURE. Surrounded and peril are not things you hold, they
 * are things that happen to you, and they may overlap a posture. That is
 * deliberate: they are the two conditions a player reacts to rather than
 * chooses, and an art on one of them is a safety net rather than a plan.
 */
import type { Condition } from '../data/arts'

/** How slow counts as still, as a fraction of top speed. */
const STILL_SPEED = 0.1
/** How fast counts as running. */
const RUN_SPEED = 0.86
/** Seconds a posture must be held before it counts. */
const STILL_HOLD = 0.55
const RUN_HOLD = 0.9
/** How sharp a reversal counts as a turn: dot product below this. cos(120°). */
const TURN_DOT = -0.5
/** How long a turn stays lit after it happens. */
const TURN_FLASH = 0.8
/** Enemies within this radius to count as surrounded. */
export const SURROUND_RADIUS = 120
const SURROUND_COUNT = 5
/** Health at or below this fraction is peril. */
const PERIL_FRACTION = 0.3

export type Conditions = Record<Condition, boolean>

export function noConditions(): Conditions {
  return { still: false, running: false, turn: false, surrounded: false, peril: false }
}

export interface ConditionSense {
  /** Which hold right now. Read by the HUD and, later, by the arts. */
  active: Conditions
  stillFor: number
  runningFor: number
  turnFor: number
  /** Last direction the player was actually MOVING, not facing. */
  lastX: number
  lastY: number
}

export function createSense(): ConditionSense {
  return { active: noConditions(), stillFor: 0, runningFor: 0, turnFor: 0, lastX: 0, lastY: 0 }
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
  sense.active.peril = maxHp > 0 && hp / maxHp <= PERIL_FRACTION

  return sense.active
}

/** Conditions that hold, as their seals — what the HUD and the harness read. */
export function activeSeals(active: Conditions): Condition[] {
  const out: Condition[] = []
  if (active.still) out.push('still')
  if (active.running) out.push('running')
  if (active.turn) out.push('turn')
  if (active.surrounded) out.push('surrounded')
  if (active.peril) out.push('peril')
  return out
}
