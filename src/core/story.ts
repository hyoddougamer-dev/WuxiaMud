import { PATHS, type PathId } from './paths.ts'
import { SEAL_MEANING, type Seal } from './names.ts'
import { origin } from './origins.ts'
import { realm, V1_CEILING } from './realms.ts'
import { MATERIALS, count } from './materials.ts'
import { breakthroughCost, ratePerSecond, modifiers } from './progress.ts'
import { huntCharges, huntCost } from './hunt.ts'
import type { PlayerState } from './state.ts'

/**
 * The words the game says about a cultivator, kept out of the components.
 *
 * Character creation ended on a five-row table — accurate, and completely inert. The
 * fix is not more adjectives: it is showing the player the *actual opening state*,
 * computed by the same functions that will run it, and saying what each number means
 * in a sentence. Everything below reads a real PlayerState, so the confirmation
 * screen cannot promise something the first morning will not deliver.
 */

/** What signing under this mark says about a life. One line, second person. */
export const SEAL_VOW: Record<Seal, string> = {
  '林': 'Things grow where you stopped.',
  '玄': 'What you leave will be argued over for a century.',
  '雲': 'You were never quite where they looked.',
  '劍': 'One edge. One answer.',
  '道': 'You walked it. You did not name it.',
  '寒': 'What you touched stayed touched.',
  '火': 'Nothing you gave back came back unchanged.',
  '風': 'You were felt, never held.',
  '山': 'You did not move. The road did.',
  '心': 'You kept it. Through all of it.',
  '影': 'You went on ahead of the light.',
  '天': 'You asked, and it answered.',
}

/** How a path actually feels to live with, rather than what it does to the numbers. */
export const PATH_RHYTHM: Record<PathId, string> = {
  sword: 'Left alone, intent sharpens. Come back once a day and the rate is steeper than you left it — and a breakthrough resets the climb.',
  blade: 'Momentum. The hour after you open the game is the best hour you will get, and it fades until you come again.',
}

export interface Line {
  /** Left column. Short enough to sit beside a value on a phone. */
  readonly k: string
  readonly v: string
  /** True when this line is a lasting rule rather than a one-off. */
  readonly keeps?: boolean
}

/** Seconds to the first breakthrough at the opening rate. An estimate, and said so. */
export function secondsToFirstBreakthrough(s: PlayerState, now: number): number {
  const rate = ratePerSecond(s, now)
  return rate > 0 ? Math.max(0, (breakthroughCost(s) - s.qi) / rate) : Infinity
}

/**
 * The first morning, read off the state rather than off the origin's prose.
 *
 * The prose says "four hides and a spirit core"; this says what is in the satchel.
 * When the two ever disagree, this one is right, which is the point of building it
 * from newPlayer() instead of from a copy of the same sentence.
 */
export function firstMorning(s: PlayerState, now: number): Line[] {
  const out: Line[] = []
  if (s.qi > 0) out.push({ k: 'Qi in hand', v: `${Math.round(s.qi)}` })
  if (s.insight > 0) out.push({ k: 'Insight', v: `${s.insight}` })

  const carried = MATERIALS
    .filter((m) => count(s.satchel, m.id) > 0)
    .map((m) => `${count(s.satchel, m.id)}× ${m.name}`)
  if (carried.length) out.push({ k: 'Satchel', v: carried.join(', ') })

  if (s.learned.length) out.push({ k: 'Already known', v: `${s.learned.length} art${s.learned.length > 1 ? 's' : ''}` })
  if (s.seenBeasts.length) out.push({ k: 'Bestiary', v: `${s.seenBeasts.length} recorded` })
  if (s.turmoil > 0) out.push({ k: 'Heart demon', v: `${Math.round(s.turmoil)} of 100, already` })
  if (s.meridians.length) out.push({ k: 'Meridians open', v: `${s.meridians.length}, from your line` })

  out.push({ k: 'Hunts held', v: `${huntCharges(s, now)}, at ${Math.round(huntCost(s))} qi each` })
  out.push({
    k: `First breakthrough`,
    v: `${breakthroughCost(s)} qi — ${realm(2).name}`,
  })
  return out
}

/** The rules that outlive every realm: the origin's trait, the path, and the line. */
export function whatNeverLeaves(s: PlayerState): Line[] {
  const o = origin(s.origin)
  const m = modifiers(s)
  const out: Line[] = [
    { k: o.name, v: o.trait.replace(/\.$/, ''), keeps: true },
    { k: PATHS[s.path].name, v: PATH_RHYTHM[s.path], keeps: true },
  ]
  if (s.lineBonus > 0) {
    out.push({ k: 'Your line', v: `+${Math.round(s.lineBonus * 100)}% generation, from ${s.generation - 1} forebear${s.generation > 2 ? 's' : ''}`, keeps: true })
  }
  if (s.inherited) {
    out.push({ k: 'Carried', v: `${s.inherited.artName}, sealed by ${s.inherited.from} — no upkeep`, keeps: true })
  }
  if (m.rate !== 1) out.push({ k: 'Opening generation', v: `${m.rate.toFixed(2)}× the base rate` })
  return out
}

/** Where this ends, and what of you is left when it does. */
export function whereThisEnds(s: PlayerState): string {
  return `Nine realms stand above you and one life reaches all of them only just. ` +
    `If you get as far as ${realm(V1_CEILING).name} you will seal a single art under ` +
    `${s.seal} — ${SEAL_MEANING[s.seal]} — and step off the road. ` +
    `${SEAL_VOW[s.seal]} Whoever of your line comes next begins with that art, ` +
    `and with a third of every meridian you opened.`
}
