import { BEASTS, type Beast } from './beasts.ts'
import { MATERIAL_FOR_RANK, add } from './materials.ts'
import { originHuntDiscount } from './origins.ts'
import { realm } from './realms.ts'
import type { PlayerState } from './state.ts'

/**
 * The one active verb in the game. An idle loop with nothing to *do* is a progress
 * bar with a theme; a single deliberate action on a cooldown is what gives a player
 * a reason to open the app at a particular moment.
 */
export const HUNT_COOLDOWN_MS = 25 * 60_000

/**
 * A hunt costs the qi your realm gathers in five minutes.
 *
 * It used to cost a fifth of everything you were holding, which reads well and plays
 * terribly. A fifth of the *bank* is a compounding tax on the act of saving: a player
 * who opens the game five times an evening pays it five times a day and loses about
 * two thirds of their stored qi daily, so the more they play the less they progress.
 * A simulation of real play found exactly that — every Blade run hunted about two
 * thousand times and never once accumulated enough surplus to survive the sixth
 * tribulation. The one active verb in the game must not be a verb you have to stop using.
 *
 * Five minutes of gathering is frequency-neutral (you pay per hunt, not per coin held),
 * realm-neutral as a share of throughput (the cooldown is twenty-five minutes, so a
 * player hunting flat out spends a fifth of what they make), and sayable in one line.
 */
export const HUNT_COST_SECONDS = 300

export function huntCost(s: PlayerState): number {
  return Math.ceil(realm(s.realm).rate * HUNT_COST_SECONDS * originHuntDiscount(s.origin))
}

export function canHunt(s: PlayerState, now: number): boolean {
  return now >= s.huntReadyAt && quarry(s).length > 0 && s.qi >= huntCost(s)
}

/** Beasts at or below the cultivator's realm. Nothing above: you would lose. */
export function quarry(s: PlayerState): Beast[] {
  return BEASTS.filter((b) => b.realm <= s.realm)
}

export interface Spoils {
  state: PlayerState
  beast: Beast
  material: { id: string; amount: number }
  insight: number
  firstSighting: boolean
}

/** `roll` is injected for the same reason as in tribulation: the engine stays pure. */
export function hunt(s: PlayerState, now: number, roll: number): Spoils | null {
  if (!canHunt(s, now)) return null
  const pool = quarry(s)
  const beast = pool[Math.min(pool.length - 1, Math.floor(roll * pool.length))]
  const material = MATERIAL_FOR_RANK[beast.rank]
  const amount = 1 + Math.floor(roll * 3)
  const insight = beast.rank * 2
  const firstSighting = !s.seenBeasts.includes(beast.id)

  return {
    state: {
      ...s,
      qi: Math.max(0, s.qi - huntCost(s)),
      insight: s.insight + insight,
      satchel: add(s.satchel, material, amount),
      seenBeasts: firstSighting ? [...s.seenBeasts, beast.id] : s.seenBeasts,
      huntReadyAt: now + HUNT_COOLDOWN_MS,
    },
    beast,
    material: { id: material, amount },
    insight,
    firstSighting,
  }
}
