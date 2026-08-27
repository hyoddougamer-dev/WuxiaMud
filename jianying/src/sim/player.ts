/**
 * Player movement.
 *
 * The first build eased the player's POSITION toward a target with expDecay.
 * That is why it felt clunky: exponential decay is fast at the start and then
 * crawls asymptotically, so every move was a lurch followed by a long drift,
 * followed by another lurch when the target changed.
 *
 * This model eases VELOCITY toward a target velocity instead. The position is
 * then integrated from it. The result is a character that reaches full speed in
 * a predictable fraction of a second, keeps it while the thumb is down, and
 * carries a little weight when released — which is what "responsive but not
 * weightless" actually means mechanically.
 */


/** Top speed, in world units per second. */
export const MAX_SPEED = 250

/**
 * Seconds for the velocity to close half the gap to its target.
 *
 * This is the single most important number for how the game feels.
 *   ~0.03s -> instant, weightless, twitchy
 *   ~0.06s -> responsive with a hint of body   <- chosen
 *   ~0.15s -> heavy, sluggish, boat-like
 */
export const ACCEL_HALF_LIFE = 0.06

/** Slightly longer on release, so stopping has more weight than starting. */
export const BRAKE_HALF_LIFE = 0.09

export interface Player {
  x: number
  y: number
  /** Previous tick's position, for render interpolation. */
  prevX: number
  prevY: number
  vx: number
  vy: number
  /** Unit vector the character is facing. Persists when standing still. */
  faceX: number
  faceY: number
}

export function createPlayer(x = 0, y = 0): Player {
  // Facing right at rest, so the blade reads as held out to the side. Facing
  // down pointed it straight at the camera, where it looked like a tail.
  return { x, y, prevX: x, prevY: y, vx: 0, vy: 0, faceX: 1, faceY: 0 }
}

/**
 * Advances the player one fixed tick.
 *
 * @param inputX -1..1
 * @param inputY -1..1  (already dead-zoned and clamped to a unit disc)
 * @param maxSpeed top speed for this loadout; techniques raise it.
 */
export function updatePlayer(
  player: Player,
  inputX: number,
  inputY: number,
  dt: number,
  maxSpeed: number = MAX_SPEED,
  /**
   * A steady push from the region, in world units per second.
   *
   * Applied to POSITION and not to velocity, deliberately. Folding it into the
   * velocity would let the exponential approach cancel it out the moment the
   * thumb pushed back, and the wind would quietly stop existing. Displacing the
   * position means the wind moves you whatever you are doing — which is the
   * entire experience the Broken Cliff is built on.
   */
  driftX = 0,
  driftY = 0,
): void {
  player.prevX = player.x
  player.prevY = player.y

  const targetVx = inputX * maxSpeed
  const targetVy = inputY * maxSpeed

  const moving = inputX !== 0 || inputY !== 0
  const halfLife = moving ? ACCEL_HALF_LIFE : BRAKE_HALF_LIFE

  // Velocity follows an exponential approach, so its displacement over the step
  // has a closed form. Integrating it analytically instead of doing
  // `x += v * dt` removes the Euler error entirely: with v(t) = T + (v0-T)·2^(-t/h),
  //   ∫v dt = T·dt + (v0-T)·(h/ln2)·(1 - 2^(-dt/h))
  // The fixed 60Hz timestep already guarantees determinism, but exactness here
  // is free and keeps distance travelled independent of how time is sliced.
  const decay = Math.pow(2, -dt / halfLife)
  const scale = (halfLife / Math.LN2) * (1 - decay)

  player.x += targetVx * dt + (player.vx - targetVx) * scale + driftX * dt
  player.y += targetVy * dt + (player.vy - targetVy) * scale + driftY * dt

  player.vx = targetVx + (player.vx - targetVx) * decay
  player.vy = targetVy + (player.vy - targetVy) * decay

  // Below a pixel per second the character is stopped for all practical
  // purposes; letting the exponential tail run forever keeps the idle
  // animation subtly drifting, which reads as the game never being still.
  if (!moving && Math.hypot(player.vx, player.vy) < 1) {
    player.vx = 0
    player.vy = 0
  }

  // Facing tracks input, not velocity: it should snap to the new direction the
  // instant the thumb moves, rather than lagging behind the body's momentum.
  if (moving) {
    const len = Math.hypot(inputX, inputY)
    if (len > 0) {
      player.faceX = inputX / len
      player.faceY = inputY / len
    }
  }
}

/** Current speed in world units per second. */
export const playerSpeed = (player: Player): number => Math.hypot(player.vx, player.vy)

/** 0..1, how close the player is to top speed. Drives lean, bob and sash pull. */
export const playerSpeedRatio = (player: Player, maxSpeed: number = MAX_SPEED): number =>
  Math.min(1, playerSpeed(player) / maxSpeed)
