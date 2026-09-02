/**
 * 闪 — the dodge, and the verb this game did not have.
 *
 * Measured before it was written, in docs/CORRIDAS.md §8: enemies die at one
 * and a half to four a second and none of them is a threat on its own, while no
 * region lasts past fifty-seven seconds against an intent of three hundred. Both
 * of those are the same fact. Death arrives as accumulated contact damage rather
 * than as a mistake, because there is nothing the player can DO in the instant
 * before being hit. The report put it plainly: "não tendo como escapar de
 * ataques está uma confusão".
 *
 * No amount of enemy health fixes that — it makes runs longer and equally
 * passive. What was missing is a second verb. Attack was automatic and movement
 * was continuous, so the whole game was one held thumb.
 *
 * Three properties, and each one is doing a job:
 *
 *   IT IS SHORT AND FAST. Two tenths of a second at three times top speed, which
 *   carries about a hundred and fifty units — past a body, out of a closing
 *   ring. Long enough to escape, far too short to travel with.
 *
 *   IT GRANTS INVULNERABILITY FOR ITS WHOLE LENGTH, plus a breath after. This is
 *   what makes it an answer rather than a repositioning: a dodge that still lets
 *   the blow land is a dodge nobody learns to time.
 *
 *   IT HAS A COOLDOWN, and the cooldown is the cost. Free escape would delete
 *   the reason to stand anywhere, which is the failure docs/CORRIDAS.md already
 *   records for fleeing.
 *
 * The direction is LOCKED at the start rather than steered. A dodge you can
 * curve is a speed boost; a dodge that commits is a decision, and a decision is
 * the thing this game was short of.
 */
import type { Player } from './player'

/** Seconds the dash lasts. */
export const DODGE_TIME = 0.2

/** Multiplier on top speed while dashing. */
export const DODGE_SPEED = 3.1

/** Seconds before it can be used again. */
export const DODGE_COOLDOWN = 1.8

/**
 * Invulnerability granted, in seconds. Longer than the dash by a breath.
 *
 * The tail matters more than it looks: without it, a dodge that ends a hair
 * inside a body takes the hit anyway, and the player — who did the right thing
 * at the right moment — reads that as the dodge not working.
 */
export const DODGE_IMMUNITY = DODGE_TIME + 0.12

/** After-images left behind. */
export const TRAIL_LENGTH = 4

export interface DodgeState {
  /** Seconds left in the dash. 0 means not dodging. */
  timer: number
  /** Seconds until it can be used again. */
  cooldown: number
  /** Unit direction, locked when the dash began. */
  dirX: number
  dirY: number
  /**
   * Where the figure has been during this dash, newest first.
   *
   * Kept by the simulation rather than the renderer so a replay draws the same
   * trail as the run that produced it — the whole project turns on that being
   * true, see core/rng.ts.
   */
  trail: { x: number; y: number }[]
}

export function createDodge(): DodgeState {
  return { timer: 0, cooldown: 0, dirX: 1, dirY: 0, trail: [] }
}

/** Can a dodge start this instant? */
export function dodgeReady(dodge: DodgeState): boolean {
  return dodge.timer <= 0 && dodge.cooldown <= 0
}

/**
 * Starts a dash, if one is allowed. Returns whether it began.
 *
 * `dirX`/`dirY` is the thumb's direction; a still thumb dodges the way the
 * swordsman is already facing, which is what stops a panic tap from doing
 * nothing at the exact moment it is needed most.
 */
export function startDodge(
  dodge: DodgeState,
  player: Player,
  dirX: number,
  dirY: number,
): boolean {
  if (!dodgeReady(dodge)) return false
  const len = Math.hypot(dirX, dirY)
  if (len > 0.01) {
    dodge.dirX = dirX / len
    dodge.dirY = dirY / len
  } else {
    dodge.dirX = player.faceX
    dodge.dirY = player.faceY
  }
  dodge.timer = DODGE_TIME
  dodge.cooldown = DODGE_COOLDOWN
  dodge.trail.length = 0
  return true
}

/**
 * Advances a dash and moves the player along it. Returns true while dashing,
 * which tells the caller to skip normal movement for this tick.
 *
 * Velocity is written as well as position: without it the character would snap
 * back to whatever it was doing before the dash the instant the dash ended, and
 * the lean, the bob and the sash all read from that velocity.
 */
export function updateDodge(
  dodge: DodgeState,
  player: Player,
  dt: number,
  maxSpeed: number,
): boolean {
  if (dodge.cooldown > 0) dodge.cooldown = Math.max(0, dodge.cooldown - dt)
  if (dodge.timer <= 0) {
    // The wake outlives the dash, and has to be swept up or it hangs on the
    // field for the rest of the run. Dropping the OLDEST ghost each tick makes
    // the trail retract toward where the swordsman ended up, which reads as ink
    // drying from the far end rather than as four figures blinking out at once.
    if (dodge.trail.length > 0) dodge.trail.pop()
    return false
  }

  player.prevX = player.x
  player.prevY = player.y

  // Eased out over the dash, so it leaves hard and settles rather than stopping
  // dead. A constant-speed dash reads as a teleport with frames in the middle.
  const t = 1 - dodge.timer / DODGE_TIME
  const speed = maxSpeed * DODGE_SPEED * (1 - t * t * 0.55)
  player.x += dodge.dirX * speed * dt
  player.y += dodge.dirY * speed * dt
  player.vx = dodge.dirX * speed
  player.vy = dodge.dirY * speed
  player.faceX = dodge.dirX
  player.faceY = dodge.dirY

  dodge.timer = Math.max(0, dodge.timer - dt)

  // After-images, spaced along the dash rather than one per tick. Twelve ticks
  // of solid figure is a smear; four, spread over the distance, read as four
  // separate swordsmen — which is what an ink trail is, and the reason this
  // effect belongs in this game rather than a motion blur.
  const want = Math.min(TRAIL_LENGTH, Math.floor((1 - dodge.timer / DODGE_TIME) * TRAIL_LENGTH) + 1)
  if (dodge.trail.length < want) dodge.trail.unshift({ x: player.x, y: player.y })
  return true
}

/** 0..1, how much of the cooldown remains. Drives the HUD's dial. */
export function dodgeCharge(dodge: DodgeState): number {
  return dodge.cooldown <= 0 ? 1 : 1 - dodge.cooldown / DODGE_COOLDOWN
}
