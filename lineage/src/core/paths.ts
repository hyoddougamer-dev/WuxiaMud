/**
 * A path is a schedule, not a power level.
 *
 * Each path returns a multiplier on the base generation rate as a function of hours
 * on its own clock. Sword's clock runs from the last breakthrough and rewards being
 * left alone; Blade's runs from the last time the player opened the game and rewards
 * frequent visits. Both are tuned to land within a few percent of each other over a
 * day of their intended rhythm.
 */
export type PathId = 'sword' | 'blade'
export type PathClock = 'sinceBreakthrough' | 'sinceOpen'

export interface Path {
  readonly id: PathId
  readonly name: string
  readonly zh: string
  readonly clock: PathClock
  readonly blurb: string
  /** Multiplier at `hours` on this path's clock. */
  rateAt(hours: number, opts?: { noDecay?: boolean }): number
}

const CLAMP_HOURS = 24
const BLADE_PEAK = 0.9
const BLADE_FLOOR = 0.17
const BLADE_HALFLIFE = 4.2

export const SWORD: Path = {
  id: 'sword',
  name: 'Sword Path',
  zh: '劍修',
  clock: 'sinceBreakthrough',
  blurb: 'Intent sharpens while untouched. The longer you go without breaking through, the steeper the rate climbs.',
  rateAt(hours) {
    const h = Math.min(Math.max(hours, 0), CLAMP_HOURS)
    return 0.4 + 0.58 * Math.pow(h / CLAMP_HOURS, 1.85)
  },
}

export const BLADE: Path = {
  id: 'blade',
  name: 'Blade Path',
  zh: '刀修',
  clock: 'sinceOpen',
  blurb: 'Momentum. Opening the game sets the rate high and it decays hour by hour. Every visit resets it.',
  rateAt(hours, opts) {
    const h = Math.max(hours, 0)
    if (opts?.noDecay) return BLADE_PEAK
    // Tuned so that five visits spread across a day integrate to the same mean as
    // Sword's single uninterrupted day. See test/paths.test.ts, which enforces it.
    return BLADE_FLOOR + (BLADE_PEAK - BLADE_FLOOR) * Math.exp(-h / BLADE_HALFLIFE)
  },
}

export const PATHS: Record<PathId, Path> = { sword: SWORD, blade: BLADE }
export const PATH_LIST: readonly Path[] = [SWORD, BLADE]

/**
 * Mean multiplier over [h0, h1] on a path's clock, by Simpson's rule.
 * Used for offline accrual, where the rate changes continuously while nobody is watching.
 */
export function meanRate(path: Path, h0: number, h1: number, opts?: { noDecay?: boolean }): number {
  if (h1 <= h0) return path.rateAt(h0, opts)
  const steps = 64
  const dx = (h1 - h0) / steps
  let sum = path.rateAt(h0, opts) + path.rateAt(h1, opts)
  for (let i = 1; i < steps; i++) {
    sum += path.rateAt(h0 + i * dx, opts) * (i % 2 === 0 ? 2 : 4)
  }
  return (sum * dx / 3) / (h1 - h0)
}
