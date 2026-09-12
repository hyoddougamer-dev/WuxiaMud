import { technique, type Technique } from './techniques.ts'
import type { PlayerState } from './state.ts'

/**
 * 精通. An art you have run for a month is not the art you learned.
 *
 * Two measured problems, one answer. Insight ran dry of things to buy: a finished run
 * ended holding sixty thousand of it, every art learned and every meridian open, so
 * the last third of the game had a currency that did nothing. And the loadout was
 * decided once and never revisited, because swapping two arts of equal value is a
 * coin flip and nobody flips a coin twice.
 *
 * Refining is an unbounded, scaling sink that turns the second problem into the first
 * one's answer: what you spend insight on is *this* art, so the six you run become the
 * six you have invested in, and changing your mind costs what you put in. It is the
 * only place in the game where a decision you already made gets more expensive to undo
 * the longer it stands — which is what a cultivation game should feel like.
 */
/**
 * Nine levels, like the realms and like the forge — and the four beyond five exist
 * because a measurement found the sink running dry again.
 *
 * At a ceiling of five, an active player finished a climb having maxed every art they
 * ran, opened all twelve meridians, and learnt all eighteen arts by about day thirty,
 * and then spent the last three weeks earning twenty-three thousand insight that had
 * nowhere to go. A currency with no sink is a currency that says "your extra sessions
 * did not matter", which is the exact opposite of what hunting more is supposed to buy.
 *
 * The four extra levels are deliberately cheap in power and dear in insight: the step
 * tapers to half past level five, so nine is worth 2.4× the listed value against 2.0×
 * at five, while costing more than three times as much to reach. It is a place to put
 * a surplus, not a second power curve.
 */
export const MASTERY_MAX = 9
/** Each of the first five levels adds this fraction of the art's own listed value. */
export const MASTERY_STEP = 0.2
/** Past the fifth, half as much per level — depth to spend into, not power to gain. */
export const MASTERY_STEP_LATE = 0.1
/** Where the step halves. */
export const MASTERY_KNEE = 5

export type Mastery = Record<string, number>

export function levelOf(m: Mastery, id: string): number {
  return Math.min(MASTERY_MAX, Math.max(0, m[id] ?? 0))
}

/**
 * Insight to go from `level` to `level + 1`, priced off the art's own cost.
 *
 * Deliberately steep and deliberately per-art: mastering the whole book is not a plan,
 * it is an arithmetic impossibility, and that is the point of a sink.
 */
export function refineCost(t: Technique, level: number): number {
  return Math.ceil(t.cost * 4 * (level + 1))
}

/** What the art is worth at its current mastery. Level zero returns the listed value. */
export function valueAt(t: Technique, level: number): number {
  const early = Math.min(level, MASTERY_KNEE)
  const late = Math.max(0, level - MASTERY_KNEE)
  return t.value * (1 + MASTERY_STEP * early + MASTERY_STEP_LATE * late)
}

export function masteredValue(s: PlayerState, id: string): number {
  const t = technique(id)
  return t ? valueAt(t, levelOf(s.mastery, id)) : 0
}

export function canRefine(s: PlayerState, id: string): boolean {
  const t = technique(id)
  if (!t || !s.learned.includes(id)) return false
  const level = levelOf(s.mastery, id)
  return level < MASTERY_MAX && s.insight >= refineCost(t, level)
}

/** Pure. Refusal returns the same object, like every other verb in the engine. */
export function refine(s: PlayerState, id: string): PlayerState {
  if (!canRefine(s, id)) return s
  const t = technique(id)!
  const level = levelOf(s.mastery, id)
  return {
    ...s,
    insight: s.insight - refineCost(t, level),
    mastery: { ...s.mastery, [id]: level + 1 },
  }
}

/** Everything spent on one art so far — what walking away from it would cost. */
export function investedIn(s: PlayerState, id: string): number {
  const t = technique(id)
  if (!t) return 0
  let total = 0
  for (let l = 0; l < levelOf(s.mastery, id); l++) total += refineCost(t, l)
  return total
}
