import type { PathId } from './paths.ts'
import type { Satchel } from './materials.ts'
import type { PillBag } from './pills.ts'

export const SAVE_VERSION = 2

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
  /** 心魔. Rises with every qi gathered; the whole risk axis of the game. 0–100. */
  turmoil: number
  /** While settling, generation drops and turmoil drains. A deliberate pause. */
  settling: boolean
  satchel: Satchel
  pills: PillBag
  /** A Tribulation Pill already swallowed, waiting for the next attempt. */
  pillPrimed: boolean
  /** Epoch ms until which a failed tribulation still slows you. */
  injuredUntil: number
  /** Epoch ms the next hunt becomes available. */
  huntReadyAt: number
  failedTribulations: number
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
    turmoil: 0,
    settling: false,
    satchel: {},
    pills: {},
    pillPrimed: false,
    injuredUntil: 0,
    huntReadyAt: 0,
    failedTribulations: 0,
    lastSeenAt: now,
    lastOpenedAt: now,
    lastBreakthroughAt: now,
    createdAt: now,
    totalBreakthroughs: 0,
    activeSeconds: 0,
  }
}
