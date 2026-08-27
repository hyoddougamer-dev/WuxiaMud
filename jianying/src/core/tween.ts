/**
 * Easing curves and small time-based helpers.
 *
 * This module is deliberately tiny and dependency-free. It exists because the
 * difference between a game that feels "robotic" and one that feels alive is
 * almost entirely here: nothing in a good-feeling game moves linearly.
 *
 * Rule of thumb used throughout the project:
 *   - things entering the screen        -> outCubic / outBack
 *   - things leaving                    -> inCubic
 *   - impacts, hits, pickups            -> outElastic / outBack
 *   - camera and follow motion          -> expDecay (frame-rate independent)
 */

export const easing = {
  linear: (t: number) => t,

  inQuad: (t: number) => t * t,
  outQuad: (t: number) => t * (2 - t),
  inOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  inCubic: (t: number) => t * t * t,
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),

  /** Overshoots past 1 then settles — good for pop-in. */
  outBack: (t: number, overshoot = 1.70158) =>
    1 + (overshoot + 1) * Math.pow(t - 1, 3) + overshoot * Math.pow(t - 1, 2),

  /** Springy wobble — good for hits and level-up flourishes. Use sparingly. */
  outElastic: (t: number) => {
    if (t === 0 || t === 1) return t
    const p = 0.3
    return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1
  },

  /** Bounce to rest. */
  outBounce: (t: number) => {
    const n1 = 7.5625
    const d1 = 2.75
    if (t < 1 / d1) return n1 * t * t
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
    return n1 * (t -= 2.625 / d1) * t + 0.984375
  },
} as const

export type EasingFn = (t: number) => number

export const clamp = (v: number, min: number, max: number): number =>
  v < min ? min : v > max ? max : v

export const clamp01 = (v: number): number => clamp(v, 0, 1)

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

/** Maps `v` from one range to another, clamped. */
export const remap = (v: number, inMin: number, inMax: number, outMin: number, outMax: number) =>
  lerp(outMin, outMax, clamp01((v - inMin) / (inMax - inMin)))

/**
 * Frame-rate independent exponential smoothing.
 *
 * `lerp(current, target, 0.1)` every frame is the usual way to write a
 * follow-camera, but its speed silently depends on the frame rate — the camera
 * lags more on a slow device. This version does not.
 *
 * @param halfLife seconds for the gap to close by half.
 */
export const expDecay = (current: number, target: number, halfLife: number, dt: number): number =>
  target + (current - target) * Math.pow(2, -dt / halfLife)

/** Shortest signed angular difference, in radians. */
export const angleDelta = (from: number, to: number): number => {
  let d = (to - from) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return d
}

/**
 * Squash & stretch factors for an impact, preserving area so the shape does not
 * appear to change mass. `amount` 0 = at rest, 1 = fully squashed.
 */
export const squashStretch = (amount: number): { sx: number; sy: number } => {
  const s = 1 + amount * 0.45
  return { sx: s, sy: 1 / s }
}
