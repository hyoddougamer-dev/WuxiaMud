import { equip, learn, unequip, toggleSettle, brew, takePill, openSession, openMeridian } from './progress.ts'
import { breakGate } from './bottlenecks.ts'
import { attempt, type Outcome } from './tribulation.ts'
import { refine } from './mastery.ts'
import { choose, type Outcome as EncounterOutcome } from './encounters.ts'
import { wear, type Slot } from './relics.ts'
import { temper } from './forge.ts'
import { fight, warden, type Kill } from './wardens.ts'
import { huntCharges, HUNT_CHARGE_MS } from './hunt.ts'
import { hunt, travel, type Spoils } from './hunt.ts'
import type { PillId } from './pills.ts'
import { ascend, canAscend, type Ancestor, type Line } from './ancestry.ts'
import type { PlayerState } from './state.ts'

/**
 * Every way a player can change the world, as data rather than as a function call.
 *
 * This is what makes the client and the server able to run the same game: the phone
 * sends one of these, the server re-runs it against its own copy with its own clock
 * and its own dice, and the two agree by construction rather than by trust.
 */
export type Action =
  | { type: 'settle' }
  | { type: 'learn'; id: string }
  | { type: 'equip'; id: string }
  | { type: 'unequip'; id: string }
  | { type: 'flame'; id: string | null }
  | { type: 'brew'; id: PillId }
  | { type: 'takePill'; id: PillId }
  | { type: 'attempt' }
  | { type: 'hunt' }
  | { type: 'travel'; id: string }
  | { type: 'refine'; id: string }
  | { type: 'answer'; index: number }
  | { type: 'wear'; id: string | null; slot: Slot }
  | { type: 'temper'; id: string }
  | { type: 'challenge'; id: string }
  | { type: 'meridian'; id: string }
  | { type: 'gate' }
  | { type: 'open' }
  | { type: 'ascend'; artName: string; techniqueId: string }

/** Anything an action wants the caller to show once, over and above the new state. */
export interface ActionEvent {
  tribulation?: Outcome
  spoils?: Spoils
  /** The forebear this action just created, if any. */
  ascended?: Ancestor
  /** What the 奇遇 turned into, said once. */
  answered?: EncounterOutcome
  /** How the warden went. */
  kill?: Kill
}

export interface ActionResult {
  state: PlayerState
  event: ActionEvent
  /** False when the action was refused — not enough insight, on cooldown, wrong realm. */
  applied: boolean
}

/**
 * Pure, like everything else here: `now` and `roll` come from the caller so that the
 * server can supply its own and the phone cannot mint either.
 */
export function apply(
  state: PlayerState,
  action: Action,
  now: number,
  roll: number,
  slots: number,
  line: Line = [],
  newId: () => string = () => String(now),
): ActionResult {
  const same = (s: PlayerState): ActionResult => ({ state: s, event: {}, applied: s !== state })

  switch (action.type) {
    case 'settle':   return same(toggleSettle(state))
    case 'learn':    return same(learn(state, action.id))
    case 'equip':    return same(equip(state, action.id, slots))
    case 'unequip':  return same(unequip(state, action.id))
    case 'brew':     return same(brew(state, action.id))
    case 'takePill': return same(takePill(state, action.id, now))
    case 'meridian': return same(openMeridian(state, action.id))
    case 'gate':     return same(breakGate(state))
    case 'travel':   return same(travel(state, action.id))
    case 'refine':   return same(refine(state, action.id))
    case 'wear':     return same(wear(state, action.id, action.slot))
    case 'temper':   return same(temper(state, action.id))
    case 'open':     return same(openSession(state, now, roll))

    case 'answer': {
      const out = choose(state, action.index, now, roll)
      if (out.state === state) return { state, event: {}, applied: false }
      return { state: out.state, event: { answered: out }, applied: true }
    }

    case 'flame': {
      if (action.id === state.flame) return { state, event: {}, applied: false }
      return { state: { ...state, flame: action.id }, event: {}, applied: true }
    }

    case 'attempt': {
      const out = attempt(state, now, roll)
      if (out.state === state) return { state, event: {}, applied: false }
      return { state: out.state, event: { tribulation: out }, applied: true }
    }

    case 'ascend': {
      if (!canAscend(state)) return { state, event: {}, applied: false }
      const out = ascend(state, line, action.artName, action.techniqueId, now, newId())
      if (!out) return { state, event: {}, applied: false }
      // The cultivator is spent. The caller starts the next one, which is why the
      // state is returned untouched: ascension ends a life, it does not edit one.
      return { state, event: { ascended: out.ancestor }, applied: true }
    }

    case 'hunt': {
      const got = hunt(state, now, roll)
      if (!got) return { state, event: {}, applied: false }
      return { state: got.state, event: { spoils: got }, applied: true }
    }

    case 'challenge': {
      const w = warden(action.id)
      if (!w) return { state, event: {}, applied: false }
      const out = fight(state, w, now, roll, huntCharges(state, now))
      if (!out) return { state, event: {}, applied: false }
      // Three charges, spent whichever way it goes. The anchor moves rather than
      // resetting, so whatever was left over is still there afterwards.
      const spent = { ...out.state, huntAnchorAt: chargesAfter(state, now, 3) }
      return { state: spent, event: { kill: { ...out, state: spent } }, applied: true }
    }
  }
}

/** True when the action consumes randomness, so the server knows to draw a roll. */
export function needsRoll(action: Action): boolean {
  return action.type === 'attempt' || action.type === 'hunt'
    || action.type === 'answer' || action.type === 'open'
    || action.type === 'challenge'
}

/** The anchor that leaves `spent` fewer charges than are held right now. */
function chargesAfter(s: PlayerState, now: number, spent: number): number {
  const left = Math.max(0, huntCharges(s, now) - spent)
  return now - left * HUNT_CHARGE_MS
}

/** Ascension ends the character, so the caller has to do something after it. */
export function endsLife(action: Action): boolean {
  return action.type === 'ascend'
}
