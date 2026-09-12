import { technique, type Technique } from './techniques.ts'
import { realm, V1_CEILING } from './realms.ts'
import { MERIDIANS } from './meridians.ts'
import { levelOf, MASTERY_STEP } from './mastery.ts'
import type { PathId } from './paths.ts'
import type { Seal } from './names.ts'
import type { PlayerState } from './state.ts'

/**
 * 傳承. A single life is not long enough to climb nine realms, so a cultivator who
 * reaches their limit seals one art with their name and gives it to whoever comes
 * next. Locally that "whoever" is your own next character; when the server exists it
 * becomes somebody else's.
 *
 * The mechanic is identical either way, which is why it is worth building now.
 */
export interface Ancestor {
  readonly id: string
  readonly name: string
  readonly seal: Seal
  readonly path: PathId
  readonly realm: number
  readonly generation: number
  /** The art they sealed, and what they chose to call it. */
  readonly techniqueId: string
  readonly artName: string
  /** How many meridians they got open before they stopped. The line remembers. */
  readonly meridians: number
  /** The mastery the sealed art had. An heirloom is as good as it was made. */
  readonly mastery: number
  readonly ascendedAt: number
}

export type Line = Ancestor[]

/** Each forebear leaves the ground a little warmer. Capped so a long line is a
 *  head start, never a substitute for playing. */
export const ANCESTOR_BONUS = 0.04
export const ANCESTOR_BONUS_CAP = 0.4

export function lineageBonus(line: Line): number {
  return Math.min(ANCESTOR_BONUS_CAP, line.length * ANCESTOR_BONUS)
}

export function generationOf(line: Line): number {
  return line.length + 1
}

/**
 * A third of the best set of meridians any forebear ever opened, granted at birth.
 *
 * The line needed to be worth more than a few percent of generation. Meridians are
 * the right currency for it: they are the slowest thing in the game to earn, they are
 * permanent, and inheriting them means a second cultivator starts where the first
 * spent a fortnight getting to. A third rather than all of them, so the climb is
 * shortened and never skipped.
 */
export const INHERITED_MERIDIAN_SHARE = 3

/** Cheapest first — which, checked against the courses, is always a legal order. */
const BY_PRICE = [...MERIDIANS].sort((a, b) => a.insight - b.insight)

export function inheritedMeridians(line: Line): string[] {
  const best = line.reduce((n, a) => Math.max(n, a.meridians ?? 0), 0)
  return BY_PRICE.slice(0, Math.floor(best / INHERITED_MERIDIAN_SHARE)).map((m) => m.id)
}

/** An inherited art costs no upkeep — the ancestor is carrying it, not you. */
export function inheritedUpkeep(): number {
  return 0
}

/**
 * Inheriting across paths is the interesting case: your master was not chosen by you,
 * so the art rarely matches your own way of fighting. The mismatch is rewarded rather
 * than punished, because that is where builds nobody designed come from.
 */
export const OFF_PATH_BONUS = 0.15

export function inheritedEffect(
  t: Technique, ancestorPath: PathId, own: PathId, mastery = 0,
): number {
  return t.value * (1 + MASTERY_STEP * mastery) * (ancestorPath === own ? 1 : 1 + OFF_PATH_BONUS)
}

export interface Ascension {
  ancestor: Ancestor
  line: Line
}

/**
 * Seal an art and step off the road. Pure, like everything else: the id and the
 * instant come from the caller.
 */
export function ascend(
  s: PlayerState,
  line: Line,
  artName: string,
  techniqueId: string,
  now: number,
  id: string,
): Ascension | null {
  if (!canAscend(s)) return null
  if (!technique(techniqueId) || !s.learned.includes(techniqueId)) return null
  const ancestor: Ancestor = {
    id,
    name: s.name,
    seal: s.seal,
    path: s.path,
    realm: s.realm,
    generation: s.generation,
    techniqueId,
    artName: artName.trim().slice(0, 32) || technique(techniqueId)!.name,
    meridians: s.meridians.length,
    mastery: levelOf(s.mastery, techniqueId),
    ascendedAt: now,
  }
  return { ancestor, line: [...line, ancestor] }
}

/** Only at the top of what this release allows, and only with something to leave. */
export function canAscend(s: PlayerState): boolean {
  return s.realm >= ASCEND_REALM && s.learned.length > 0
}

/** The top of the ladder. A life ends where the ninth realm begins. */
export const ASCEND_REALM = V1_CEILING

export function ascensionSummary(s: PlayerState): string {
  return `${s.name} · ${realm(s.realm).name}`
}
