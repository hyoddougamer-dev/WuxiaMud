import { BEASTS, type Beast } from './beasts.ts'
import { MATERIAL_FOR_RANK, add } from './materials.ts'
import type { PlayerState } from './state.ts'

/**
 * The one active verb in the game. An idle loop with nothing to *do* is a progress
 * bar with a theme; a single deliberate action on a cooldown is what gives a player
 * a reason to open the app at a particular moment.
 */
export const HUNT_COOLDOWN_MS = 25 * 60_000
/** Paid from stored qi, so hunting competes with breaking through. */
export const HUNT_COST_FRACTION = 0.2

export function huntCost(s: PlayerState): number {
  return s.qi * HUNT_COST_FRACTION
}

export function canHunt(s: PlayerState, now: number): boolean {
  return now >= s.huntReadyAt && quarry(s).length > 0 && s.qi > 0
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
      qi: s.qi - huntCost(s),
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
