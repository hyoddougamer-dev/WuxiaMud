import type { PathId } from './paths.ts'
import type { Satchel } from './materials.ts'
import type { PillBag } from './pills.ts'
import type { Seal } from './names.ts'
import { origin, type OriginId } from './origins.ts'
import { realm } from './realms.ts'
import { FIRST_GROUND } from './grounds.ts'

export const SAVE_VERSION = 6

export interface PlayerState {
  readonly version: number
  name: string
  seal: Seal
  /** Where you were before any of this. Fixed at birth. */
  origin: OriginId
  /** How many forebears this cultivator stands on. 1 is the first of a line. */
  generation: number
  /** The art received from an ancestor: free to keep, and stronger if off-path. */
  inherited: { techniqueId: string; from: string; fromPath: PathId; artName: string } | null
  /** What the line was worth on the day this cultivator was born. */
  lineBonus: number
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
  /**
   * Hunting runs on charges rather than a bare cooldown, and this one number holds
   * all of it: charges available are the whole three-hour periods since this instant,
   * capped. Spending one moves the anchor forward instead of resetting it, so a
   * player who checks in once a day and one who checks in five times get the same
   * four hunts — which is the only way the Sword Path could afford a meridian.
   */
  huntAnchorAt: number
  /** 洞天 you are standing in. Decides what a hunt can find and what it costs in calm. */
  ground: string
  /** 經脈 opened, permanently. The active player's power curve. */
  meridians: string[]
  /** Realms whose 瓶頸 has been broken. A gate stays open once passed. */
  gates: number[]
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

export function newPlayer(
  path: PathId,
  now: number,
  opts: {
    name?: string
    seal?: Seal
    origin?: OriginId
    generation?: number
    inherited?: PlayerState['inherited']
    lineBonus?: number
    /** Meridians the line remembers — opened before this cultivator drew breath. */
    meridians?: string[]
  } = {},
): PlayerState {
  return {
    version: SAVE_VERSION,
    name: opts.name ?? 'Nameless',
    seal: opts.seal ?? '道',
    origin: opts.origin ?? 'rogue',
    generation: opts.generation ?? 1,
    inherited: opts.inherited ?? null,
    lineBonus: opts.lineBonus ?? 0,
    meridians: opts.meridians ? [...opts.meridians] : [],
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
    // Epoch zero: charged since before the world, so a new cultivator opens the game
    // with a full set of hunts rather than a locked screen.
    huntAnchorAt: 0,
    ground: FIRST_GROUND,
    gates: [],
    failedTribulations: 0,
    lastSeenAt: now,
    lastOpenedAt: now,
    lastBreakthroughAt: now,
    createdAt: now,
    totalBreakthroughs: 0,
    activeSeconds: 0,
    ...startingKit(opts.origin ?? 'rogue'),
  }
}

/**
 * What an origin puts in your hands on the first morning. Separated from the
 * lasting traits so the two can be read — and balanced — independently.
 */
function startingKit(id: OriginId): Partial<PlayerState> {
  const k = origin(id).starting
  const out: Partial<PlayerState> = {}
  if (k.qiOfFirstBreakthrough) out.qi = realm(1).cost * k.qiOfFirstBreakthrough
  if (k.insight) out.insight = k.insight
  if (k.turmoil) out.turmoil = k.turmoil
  if (k.materials) out.satchel = { ...k.materials }
  if (k.pills) out.pills = { ...k.pills }
  if (k.learned) out.learned = [...k.learned]
  if (k.beasts) out.seenBeasts = [...k.beasts]
  return out
}
