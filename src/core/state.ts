import type { PathId } from './paths.ts'

export const SAVE_VERSION = 1

export interface PlayerState {
  readonly version: number
  /** Chosen once at the start; switching costs a realm (not implemented in the slice). */
  path: PathId
  realm: number
  qi: number
  insight: number
  learned: string[]
  equipped: string[]
  flame: string | null
  seenBeasts: string[]
  /** Epoch ms. All three clocks are server-owned in production. */
  lastSeenAt: number
  lastOpenedAt: number
  lastBreakthroughAt: number
  createdAt: number
  totalBreakthroughs: number
  /** Seconds of active foreground time, for the forty-hour target. */
  activeSeconds: number
}

export function newPlayer(path: PathId, now: number): PlayerState {
  return {
    version: SAVE_VERSION,
    path,
    realm: 1,
    qi: 0,
    insight: 0,
    learned: [],
    equipped: [],
    flame: null,
    seenBeasts: [],
    lastSeenAt: now,
    lastOpenedAt: now,
    lastBreakthroughAt: now,
    createdAt: now,
    totalBreakthroughs: 0,
    activeSeconds: 0,
  }
}
