/**
 * Follow camera for the overhead view.
 *
 * Two things separate a camera that feels good from one that feels stiff:
 *
 * 1. It lags. Snapping the camera to the player makes the world jitter around a
 *    pinned sprite, and the player loses any sense of their own speed.
 * 2. It looks ahead. Biasing the centre toward where the player is heading
 *    shows more of the space being moved into — which in a survivors-like is
 *    the difference between seeing an incoming swarm and being ambushed by it.
 */
import { expDecay } from '../core/tween'

/** Seconds for the camera to close half its distance to the target. */
const FOLLOW_HALF_LIFE = 0.14

/** How far ahead of the player, in world units, at full speed. */
const LOOK_AHEAD = 70

/** Look-ahead eases in slowly so a direction change does not whip the view. */
const LOOK_AHEAD_HALF_LIFE = 0.42

export interface Camera {
  x: number
  y: number
  shakeX: number
  shakeY: number
}

export function createCamera(x = 0, y = 0): Camera {
  return { x, y, shakeX: 0, shakeY: 0 }
}

interface FollowTarget {
  x: number
  y: number
  vx: number
  vy: number
}

let leadX = 0
let leadY = 0

export function updateCamera(
  camera: Camera,
  target: FollowTarget,
  maxSpeed: number,
  dt: number,
): void {
  const speed = Math.hypot(target.vx, target.vy)
  const ratio = maxSpeed > 0 ? Math.min(1, speed / maxSpeed) : 0

  // Desired lead, in the direction of travel, scaled by how fast we are going.
  const desiredLeadX = speed > 1 ? (target.vx / speed) * LOOK_AHEAD * ratio : 0
  const desiredLeadY = speed > 1 ? (target.vy / speed) * LOOK_AHEAD * ratio : 0

  leadX = expDecay(leadX, desiredLeadX, LOOK_AHEAD_HALF_LIFE, dt)
  leadY = expDecay(leadY, desiredLeadY, LOOK_AHEAD_HALF_LIFE, dt)

  camera.x = expDecay(camera.x, target.x + leadX, FOLLOW_HALF_LIFE, dt)
  camera.y = expDecay(camera.y, target.y + leadY, FOLLOW_HALF_LIFE, dt)
}

/** Resets the internal look-ahead. Call when teleporting or restarting a run. */
export function resetCamera(camera: Camera, x: number, y: number): void {
  camera.x = x
  camera.y = y
  leadX = 0
  leadY = 0
}
