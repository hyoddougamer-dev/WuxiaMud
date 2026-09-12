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
export const MASTERY_MAX = 5
/** Each level adds this fraction of the art's own listed value. Five doubles it. */
export const MASTERY_STEP = 0.2

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
  return t.value * (1 + MASTERY_STEP * level)
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
