import { type Beast } from './beasts.ts'
import { ground, openAt, quarryOf } from './grounds.ts'
import { MATERIAL_FOR_RANK, add } from './materials.ts'
import { originHuntDiscount } from './origins.ts'
import { realm } from './realms.ts'
import { modifiers, TURMOIL_MAX } from './progress.ts'
import { relicValue } from './relics.ts'
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
 * the same number of hunts a day and neither is rewarded for compulsive checking. The
 * cap is what stops a player who vanishes for a week from returning to fifty free
 * hunts; the six-hour period is what makes the cap fair.
 *
 * That period was three hours, and a measurement caught what it quietly did. Four
 * charges cap what you can *hold*, not what you can *earn*: at three hours a day makes
 * eight, so a Blade player dipping in five times an evening drew eight a day while a
 * Sword player who opened once found four waiting and lost the rest to the ceiling.
 * It did not matter until mastery arrived — and then one path could afford to refine
 * its whole loadout and the other could not afford to refine anything. Six hours is
 * one full set a day, banked whether you look or not, identical for both.
 */
export const HUNT_CHARGE_MS = 6 * 3_600_000
export const HUNT_MAX_CHARGES = 4

/** Whole charge periods banked at `now`, capped. The Girdling of the hunt. */
/** The cap a relic may raise. Everything else reads this rather than the constant. */
export function maxCharges(s: PlayerState): number {
  return HUNT_MAX_CHARGES + relicValue(s, 'charge')
}

export function huntCharges(s: PlayerState, now: number): number {
  const per = HUNT_CHARGE_MS * modifiers(s).huntSpeed
  return Math.max(0, Math.min(maxCharges(s), Math.floor((now - s.huntAnchorAt) / per)))
}

/** Epoch ms at which the next charge lands, or 0 when already full. */
export function nextChargeAt(s: PlayerState, now: number): number {
  if (huntCharges(s, now) >= maxCharges(s)) return 0
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

/** The three beasts of the ground you are standing in, or none if it is shut to you. */
export function quarry(s: PlayerState): Beast[] {
  const g = ground(s.ground)
  return openAt(g, s.realm) ? quarryOf(g) : []
}

/** What this ground actually costs you in calm, after the robe. Never below zero. */
export function dangerHere(s: PlayerState): number {
  return Math.max(0, ground(s.ground).danger - relicValue(s, 'danger'))
}

/** Move to a ground. Refused if the realm does not open it. */
export function travel(s: PlayerState, id: string): PlayerState {
  const g = ground(id)
  if (g.id === s.ground || !openAt(g, s.realm)) return s
  return { ...s, ground: g.id }
}

export interface Spoils {
  state: PlayerState
  beast: Beast
  /** Turmoil this trip cost, so the caller can say so rather than hide it. */
  danger: number
  material: { id: string; amount: number }
  insight: number
  firstSighting: boolean
}

/** `roll` is injected for the same reason as in tribulation: the engine stays pure. */
export function hunt(s: PlayerState, now: number, roll: number): Spoils | null {
  if (!canHunt(s, now)) return null
  const pool = quarry(s)
  const beast = pool[Math.min(pool.length - 1, Math.floor(roll * pool.length))]
  const g = ground(s.ground)
  const material = MATERIAL_FOR_RANK[beast.rank]
  const amount = 1 + Math.floor(roll * 3) + g.bonus + relicValue(s, 'haul')
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
      // The price of a deep ground is paid in calm, not in qi: the satchel comes back
      // fuller and the tribulation you were saving for comes back thinner.
      turmoil: Math.min(TURMOIL_MAX, s.turmoil + dangerHere(s)),
      // Move the anchor forward by one period rather than resetting it, so the
      // charges you did not spend are still there afterwards.
      huntAnchorAt: now - (huntCharges(s, now) - 1) * HUNT_CHARGE_MS * modifiers(s).huntSpeed,
    },
    beast,
    danger: dangerHere(s),
    material: { id: material, amount },
    insight,
    firstSighting,
  }
}
