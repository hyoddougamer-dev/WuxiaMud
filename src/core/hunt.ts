import { BEASTS, type Beast } from './beasts.ts'
import { MATERIAL_FOR_RANK, add } from './materials.ts'
import { originHuntDiscount } from './origins.ts'
import { realm } from './realms.ts'
import { modifiers } from './progress.ts'
import type { PlayerState } from './state.ts'

/**
 * The one active verb in the game. An idle loop with nothing to *do* is a progress
 * bar with a theme; a single deliberate action on a cooldown is what gives a player
 * a reason to open the app at a particular moment.
 */
/**
 * Hunting runs on charges, not a cooldown.
 *
 * A bare twenty-five-minute cooldown quietly decided who could play: the Blade Path
 * opens the game five times an evening and got five hunts, the Sword Path opens it
 * once and got one. Once meridians made insight and beast materials the currency of
 * permanent power, that gap stopped being a flavour difference and became a wall —
 * the Sword Path could not afford the eleven meridians the last gate asks for.
 *
 * Charges accrue whether the app is open or not and stop at four, so both paths get
 * about the same number of hunts a day and neither is rewarded for compulsive
 * checking. The cap is the part that matters: it is what stops a player who vanishes
 * for a week from returning to fifty free hunts.
 */
export const HUNT_CHARGE_MS = 3 * 3_600_000
export const HUNT_MAX_CHARGES = 4

/** Whole charge periods banked at `now`, capped. The Girdling of the hunt. */
export function huntCharges(s: PlayerState, now: number): number {
  const per = HUNT_CHARGE_MS * modifiers(s).huntSpeed
  return Math.max(0, Math.min(HUNT_MAX_CHARGES, Math.floor((now - s.huntAnchorAt) / per)))
}

/** Epoch ms at which the next charge lands, or 0 when already full. */
export function nextChargeAt(s: PlayerState, now: number): number {
  if (huntCharges(s, now) >= HUNT_MAX_CHARGES) return 0
  const per = HUNT_CHARGE_MS * modifiers(s).huntSpeed
  return s.huntAnchorAt + (huntCharges(s, now) + 1) * per
}

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
  return huntCharges(s, now) > 0 && quarry(s).length > 0 && s.qi >= huntCost(s)
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
  // Insight scales with the realm as well as the quarry: meridians cost hundreds by
  // the end, and a game where the only way to afford them is to hunt a hare four
  // thousand times is a spreadsheet, not a climb.
  const insight = Math.round(beast.rank * (2 + s.realm) * modifiers(s).insight)
  const firstSighting = !s.seenBeasts.includes(beast.id)

  return {
    state: {
      ...s,
      qi: Math.max(0, s.qi - huntCost(s)),
      insight: s.insight + insight,
      satchel: add(s.satchel, material, amount),
      seenBeasts: firstSighting ? [...s.seenBeasts, beast.id] : s.seenBeasts,
      // Move the anchor forward by one period rather than resetting it, so the
      // charges you did not spend are still there afterwards.
      huntAnchorAt: now - (huntCharges(s, now) - 1) * HUNT_CHARGE_MS * modifiers(s).huntSpeed,
    },
    beast,
    material: { id: material, amount },
    insight,
    firstSighting,
  }
}
