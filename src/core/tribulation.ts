import { realm } from './realms.ts'
import { breakthroughCost, canBreakThrough, modifiers, TURMOIL_MAX } from './progress.ts'
import type { PlayerState } from './state.ts'

/**
 * 雷劫. From the third realm onward a breakthrough is a gamble, and deciding *when*
 * to take it is the only real decision in the game.
 *
 * Three levers, all visible before committing: wait for surplus qi, quiet the heart,
 * or swallow a pill. Nothing here is hidden from the player — a gamble you cannot
 * price is not a decision, it is a slot machine.
 */

/** Realms one and two break through cleanly, so the player learns the loop first. */
export const FIRST_TRIBULATION_REALM = 3

/**
 * The last two rungs are the game, so they are the two that can actually kill a run:
 * a Great Vehicle tribulation at 52% is a decision, not a formality. Nothing here is
 * hidden — `odds()` hands back every term separately so the UI can show the sum.
 */
const BASE_ODDS: Record<number, number> = {
  3: 0.92, 4: 0.86, 5: 0.78, 6: 0.72, 7: 0.64, 8: 0.52,
}
export const SURPLUS_CAP = 0.25
export const TURMOIL_WEIGHT = 0.35
export const PILL_BONUS = 0.2
const FLOOR = 0.05
const CEILING = 0.98

export interface Odds {
  needed: boolean
  base: number
  surplus: number
  turmoil: number
  pill: number
  /** The Conception and Girdling vessels, if they are open. */
  vessel: number
  total: number
}

export function odds(s: PlayerState): Odds {
  const cost = breakthroughCost(s)
  if (s.realm < FIRST_TRIBULATION_REALM) {
    return { needed: false, base: 1, surplus: 0, turmoil: 0, pill: 0, vessel: 0, total: 1 }
  }
  const base = BASE_ODDS[s.realm] ?? 0.55
  const surplus = Math.min(SURPLUS_CAP, Math.max(0, s.qi / cost - 1) * SURPLUS_CAP)
  const turmoil = -(Math.min(s.turmoil, TURMOIL_MAX) / TURMOIL_MAX) * TURMOIL_WEIGHT
  const pill = s.pillPrimed ? PILL_BONUS : 0
  const vessel = modifiers(s).odds
  const total = Math.min(CEILING, Math.max(FLOOR, base + surplus + turmoil + pill + vessel))
  return { needed: true, base, surplus, turmoil, pill, vessel, total }
}

export interface Outcome {
  state: PlayerState
  succeeded: boolean
  /** The roll, kept so the UI can show what actually happened. */
  roll: number
  chance: number
}

/**
 * `roll` is injected rather than drawn here: the engine stays pure, and the same
 * function will run on the server where the client must not pick its own number.
 */
export function attempt(s: PlayerState, now: number, roll: number): Outcome {
  const cost = breakthroughCost(s)
  // Asks the same question the button asks, rather than re-deriving half of it. The
  // first version repeated only the qi check, so the engine would happily run a
  // tribulation whose 瓶頸 was still unbroken — a test caught it, and on the server
  // that would have been a client able to skip every gate in the game.
  if (!canBreakThrough(s)) {
    return { state: s, succeeded: false, roll, chance: 0 }
  }
  const chance = odds(s).total
  const m = modifiers(s)

  if (roll < chance) {
    const gained = Math.round(s.realm * 2 * m.insight)
    return {
      state: {
        ...s,
        qi: s.qi - cost,
        realm: s.realm + 1,
        insight: s.insight + gained,
        totalBreakthroughs: s.totalBreakthroughs + 1,
        lastBreakthroughAt: now,
        turmoil: s.turmoil * 0.45,
        pillPrimed: false,
      },
      succeeded: true, roll, chance,
    }
  }

  // Failure costs qi, time and calm — never the character. A cultivation game that
  // deletes a three-week save on one bad roll is a cultivation game nobody finishes.
  return {
    state: {
      ...s,
      qi: s.qi * 0.55,
      turmoil: Math.min(TURMOIL_MAX, s.turmoil + 12),
      injuredUntil: now + 2 * 3_600_000,
      failedTribulations: s.failedTribulations + 1,
      pillPrimed: false,
    },
    succeeded: false, roll, chance,
  }
}

export function realmName(id: number): string {
  return realm(id).name
}
