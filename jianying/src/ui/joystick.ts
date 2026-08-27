/**
 * Floating virtual joystick.
 *
 * "Floating" rather than fixed: the stick materialises wherever the thumb first
 * lands. A joystick painted at a fixed corner forces the player to look down
 * and aim for it, and on a 6-inch phone held one-handed the reachable area
 * differs with hand size and grip. Anchoring to the touch removes the problem
 * entirely — wherever the thumb is, is where the stick is.
 *
 * Output is clamped to the unit DISC, not a square. Clamping per-axis is the
 * classic bug that makes diagonals travel 1.41x faster than cardinals.
 */

/** Movement below this fraction of the radius is treated as noise. */
const DEAD_ZONE = 0.12

/** Thumb travel, in CSS pixels, that corresponds to full deflection. */
const RADIUS = 54

export interface JoystickState {
  /** -1..1, clamped to the unit disc. Zero when untouched. */
  x: number
  y: number
  /** 0..1 */
  magnitude: number
  active: boolean
  /** Where the stick is anchored, in CSS pixels. Only meaningful while active. */
  originX: number
  originY: number
  /** Current thumb position, in CSS pixels. */
  thumbX: number
  thumbY: number
}

export interface Joystick {
  readonly state: JoystickState
  /** Seconds since the player last touched the screen. */
  idleTime(): number
  tick(dt: number): void
  destroy(): void
}

export function createJoystick(target: HTMLElement): Joystick {
  const state: JoystickState = {
    x: 0,
    y: 0,
    magnitude: 0,
    active: false,
    originX: 0,
    originY: 0,
    thumbX: 0,
    thumbY: 0,
  }

  // Only the pointer that started the gesture drives the stick. Without this,
  // a second thumb (or a stray palm touch) would yank the character around.
  let pointerId: number | null = null
  let idle = 0

  const reset = (): void => {
    pointerId = null
    state.active = false
    state.x = 0
    state.y = 0
    state.magnitude = 0
  }

  const apply = (clientX: number, clientY: number): void => {
    state.thumbX = clientX
    state.thumbY = clientY

    let dx = (clientX - state.originX) / RADIUS
    let dy = (clientY - state.originY) / RADIUS

    let mag = Math.hypot(dx, dy)

    if (mag < DEAD_ZONE) {
      state.x = 0
      state.y = 0
      state.magnitude = 0
      return
    }

    // Rescale past the dead zone so the very first movement out of it is not a
    // jump from 0 to DEAD_ZONE — the stick should ramp from nothing.
    const scaled = Math.min(1, (mag - DEAD_ZONE) / (1 - DEAD_ZONE))
    dx /= mag
    dy /= mag

    state.x = dx * scaled
    state.y = dy * scaled
    state.magnitude = scaled

    // Clamp the drawn thumb to the ring so the knob never flies off.
    if (mag > 1) mag = 1
    state.thumbX = state.originX + dx * mag * RADIUS
    state.thumbY = state.originY + dy * mag * RADIUS
  }

  const onDown = (e: PointerEvent): void => {
    if (pointerId !== null) return
    pointerId = e.pointerId
    target.setPointerCapture(e.pointerId)
    state.active = true
    state.originX = e.clientX
    state.originY = e.clientY
    idle = 0
    apply(e.clientX, e.clientY)
    e.preventDefault()
  }

  const onMove = (e: PointerEvent): void => {
    if (e.pointerId !== pointerId) return
    idle = 0
    apply(e.clientX, e.clientY)
    e.preventDefault()
  }

  const onUp = (e: PointerEvent): void => {
    if (e.pointerId !== pointerId) return
    if (target.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId)
    reset()
    e.preventDefault()
  }

  target.addEventListener('pointerdown', onDown)
  target.addEventListener('pointermove', onMove)
  target.addEventListener('pointerup', onUp)
  target.addEventListener('pointercancel', onUp)
  // A pointer leaving the window without an up event would otherwise leave the
  // character running forever in the last direction.
  window.addEventListener('blur', reset)

  return {
    state,
    idleTime: () => idle,
    tick: (dt: number) => {
      if (!state.active) idle += dt
    },
    destroy: () => {
      target.removeEventListener('pointerdown', onDown)
      target.removeEventListener('pointermove', onMove)
      target.removeEventListener('pointerup', onUp)
      target.removeEventListener('pointercancel', onUp)
      window.removeEventListener('blur', reset)
      reset()
    },
  }
}
