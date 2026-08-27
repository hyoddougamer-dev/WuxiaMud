/**
 * Deterministic RNG (mulberry32).
 *
 * Every random draw in the simulation MUST come from here, never from
 * Math.random(). That single rule is what buys us three things at once:
 *   - headless balance tests that assert real numbers instead of guessing,
 *   - replays stored as `seed + input stream` (kilobytes, not video),
 *   - server-side anti-cheat, by re-simulating a submitted run.
 *
 * The state is a single uint32, so snapshotting and restoring is trivial.
 */
export class Rng {
  private state: number

  constructor(seed: number) {
    // Normalise to uint32 so a float or negative seed still behaves.
    this.state = seed >>> 0
  }

  /** Current internal state — snapshot this to fork or persist a stream. */
  get snapshot(): number {
    return this.state
  }

  set snapshot(state: number) {
    this.state = state >>> 0
  }

  /** Uniform float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0
    let t = this.state
    t = Math.imul(t ^ (t >>> 15), 1 | t)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /** Uniform float in [min, max). */
  range(min: number, max: number): number {
    return min + this.next() * (max - min)
  }

  /** Uniform integer in [min, max] (both inclusive). */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1))
  }

  /** True with probability `p`. */
  chance(p: number): boolean {
    return this.next() < p
  }

  /** A uniformly random unit vector. */
  unitVector(): { x: number; y: number } {
    const angle = this.next() * Math.PI * 2
    return { x: Math.cos(angle), y: Math.sin(angle) }
  }

  /** Uniformly picks one element. Throws on an empty list rather than returning undefined. */
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick: empty list')
    return items[this.int(0, items.length - 1)]!
  }

  /** In-place Fisher-Yates. Deterministic for a given seed and input order. */
  shuffle<T>(items: T[]): T[] {
    for (let i = items.length - 1; i > 0; i--) {
      const j = this.int(0, i)
      const a = items[i]!
      items[i] = items[j]!
      items[j] = a
    }
    return items
  }

  fork(): Rng {
    return new Rng(Math.imul(this.state ^ 0x9e3779b9, 0x85ebca6b))
  }
}

/**
 * The seed for a given calendar day (UTC), so every player gets the same run.
 * UTC rather than local time, so a leaderboard is not split across timezones.
 */
export function dailySeed(date: Date = new Date()): number {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth() + 1
  const d = date.getUTCDate()
  return (y * 10000 + m * 100 + d) >>> 0
}
