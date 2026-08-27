/**
 * Follow camera for the overhead view.
 *
 * Three things separate a camera that feels good from one that feels stiff:
 *
 * 1. It lags. Snapping to the player makes the world jitter around a pinned
 *    sprite, and the player loses any sense of their own speed.
 * 2. It looks ahead. Biasing the centre toward where the player is heading
 *    shows more of the space being moved into.
 * 3. It sits far enough back. This one was missing entirely at first: the
 *    figure's own scale doubled as the zoom, so the visible area shrank as the
 *    character grew. A survivors-like lives or dies on seeing the swarm arrive,
 *    which means the world must be framed in WORLD units, independently of how
 *    big the character is drawn.
 */
import { clamp, expDecay } from '../core/tween'

/** Seconds for the camera to close half its distance to the target. */
const FOLLOW_HALF_LIFE = 0.14

/** How far ahead of the player, in world units, at full speed. */
const LOOK_AHEAD = 70

/** Look-ahead eases in slowly so a direction change does not whip the view. */
const LOOK_AHEAD_HALF_LIFE = 0.42

/**
 * How much of the world, vertically, should fit on screen — in world units.
 *
 * This is the framing dial. The swordsman is ~50 world units tall, so at 640
 * they occupy roughly 8% of the screen height, which is about where the genre
 * sits: small enough that an approaching crowd is visible with time to react.
 * Lower this number to move the camera in, raise it to pull back.
 */
export const VISIBLE_WORLD_HEIGHT = 640

/** Bounds on zoom, so a tablet does not end up looking through a keyhole. */
const MIN_ZOOM = 0.7
const MAX_ZOOM = 2.2

export interface Camera {
  x: number
  y: number
  /** Screen pixels per world unit. */
  zoom: number
}

export function createCamera(x = 0, y = 0): Camera {
  return { x, y, zoom: 1 }
}

/** Recomputes zoom for the current viewport. Call on resize. */
export function fitCamera(camera: Camera, screenHeight: number): void {
  camera.zoom = clamp(screenHeight / VISIBLE_WORLD_HEIGHT, MIN_ZOOM, MAX_ZOOM)
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

/** Resets position and look-ahead. Call when teleporting or restarting a run. */
export function resetCamera(camera: Camera, x: number, y: number): void {
  camera.x = x
  camera.y = y
  leadX = 0
  leadY = 0
}
