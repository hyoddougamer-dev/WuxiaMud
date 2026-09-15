/**
 * 氣 The field of rising motes, and the breath of an aura.
 *
 * Pure, like everything else in here: a mote has no stored state. Its position is a
 * function of its index and the clock, so the same field can be drawn by a canvas, by
 * a test, or by a server, and two devices looking at the same cultivator at the same
 * instant see the same thing. It also means the animation cannot drift, leak, or need
 * resetting when a tab sleeps for an hour — there is nothing to reset.
 *
 * Everything here works in unit space (0..1 across, 0..1 up) so the component owns the
 * pixels and this owns the motion.
 */

/** A single point of qi, in unit space. `a` is opacity, `r` a radius multiplier. */
export interface Mote {
  readonly x: number
  readonly y: number
  readonly r: number
  readonly a: number
}

/** How long one mote takes to cross the field, bottom to top. */
export const RISE_MS = 5_400

/** The aura's breath. Slow — this is meditation, not a heartbeat. */
export const BREATH_MS = 4_200

/**
 * Deterministic 0..1 from an index. FNV-ish, the same trick the trail uses, because a
 * mote needs a stable lane and a stable phase and must not consult Math.random.
 */
function hash01(i: number, salt: number): number {
  let h = 2166136261 ^ Math.imul(i + 1, 0x9e3779b1) ^ Math.imul(salt + 1, 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 15), 0x2545f491)
  h ^= h >>> 13
  return ((h >>> 0) % 100_000) / 100_000
}

const frac = (v: number) => v - Math.floor(v)

/**
 * How many motes a realm deserves.
 *
 * It climbs with the realm because the aura is the one thing on the screen that says
 * "you are stronger than you were last week" without a number. It is capped because a
 * phone drawing four hundred sprites at sixty frames is a phone with a warm back and a
 * flat battery, and because past a point more motes read as fog rather than as power.
 */
export function moteCount(realm: number, reduced = false): number {
  if (reduced) return 0
  const n = 14 + Math.max(0, Math.min(9, realm) - 1) * 7
  return Math.min(70, n)
}

/**
 * Where mote `i` is at time `t`.
 *
 * Each mote owns a lane, a speed, a size and a phase offset, all derived from its
 * index. It rises, drifts sideways on a slow sine, fades in off the floor and out
 * before the ceiling — a mote that pops out of existence at full opacity is the single
 * most obvious tell that a particle field is cheap.
 */
export function moteAt(i: number, t: number, speed = 1): Mote {
  const lane = hash01(i, 1)
  const phase = hash01(i, 2)
  const swing = 0.35 + hash01(i, 3) * 0.65
  const size = 0.45 + hash01(i, 4) * 0.85
  const pace = 0.72 + hash01(i, 5) * 0.62

  const life = frac(phase + (t / RISE_MS) * pace * speed)
  const drift = Math.sin((phase + life * swing) * Math.PI * 2) * 0.055

  // In at the bottom, out at the top, full through the middle. The in-ramp is the
  // longer of the two: a mote that is already visible at the floor looks spawned,
  // and a field of spawning motes reads as a screensaver rather than as qi.
  const fade = Math.min(1, life / 0.26) * Math.min(1, (1 - life) / 0.26)

  return {
    x: lane + drift,
    y: life,
    r: size * (0.85 + life * 0.3),
    a: fade * (0.30 + hash01(i, 6) * 0.55),
  }
}

/** The whole field at `t`. */
export function field(n: number, t: number, speed = 1): Mote[] {
  const out: Mote[] = []
  for (let i = 0; i < n; i++) out.push(moteAt(i, t, speed))
  return out
}

/**
 * 0..1, sinusoidal. Drives the aura's radius and glow so it swells and settles rather
 * than sitting there — a static glow reads as a PNG, a breathing one reads as alive.
 */
export function breath(t: number, period = BREATH_MS): number {
  return 0.5 + 0.5 * Math.sin((t / period) * Math.PI * 2)
}

/**
 * How hard the aura burns, 0..1.
 *
 * Realm sets the floor, progress toward the next one raises it, and settling drops it
 * to almost nothing — a cultivator letting their heart settle is visibly banked, which
 * is the only feedback that state has ever had.
 */
export function intensity(realm: number, progress: number, settling = false): number {
  const base = 0.22 + Math.max(0, Math.min(9, realm) - 1) / 8 * 0.5
  const lift = Math.max(0, Math.min(1, progress)) * 0.28
  return settling ? base * 0.3 : Math.min(1, base + lift)
}
