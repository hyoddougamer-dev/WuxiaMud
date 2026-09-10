import { equip, learn, unequip, toggleSettle, brew, takePill, openSession } from './progress.ts'
import { attempt, type Outcome } from './tribulation.ts'
import { hunt, type Spoils } from './hunt.ts'
import type { PillId } from './pills.ts'
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
  | { type: 'open' }

/** Anything an action wants the caller to show once, over and above the new state. */
export interface ActionEvent {
  tribulation?: Outcome
  spoils?: Spoils
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
): ActionResult {
  const same = (s: PlayerState): ActionResult => ({ state: s, event: {}, applied: s !== state })

  switch (action.type) {
    case 'settle':   return same(toggleSettle(state))
    case 'learn':    return same(learn(state, action.id))
    case 'equip':    return same(equip(state, action.id, slots))
    case 'unequip':  return same(unequip(state, action.id))
    case 'brew':     return same(brew(state, action.id))
    case 'takePill': return same(takePill(state, action.id, now))
    case 'open':     return same(openSession(state, now))

    case 'flame': {
      if (action.id === state.flame) return { state, event: {}, applied: false }
      return { state: { ...state, flame: action.id }, event: {}, applied: true }
    }

    case 'attempt': {
      const out = attempt(state, now, roll)
      if (out.state === state) return { state, event: {}, applied: false }
      return { state: out.state, event: { tribulation: out }, applied: true }
    }

    case 'hunt': {
      const got = hunt(state, now, roll)
      if (!got) return { state, event: {}, applied: false }
      return { state: got.state, event: { spoils: got }, applied: true }
    }
  }
}

/** True when the action consumes randomness, so the server knows to draw a roll. */
export function needsRoll(action: Action): boolean {
  return action.type === 'attempt' || action.type === 'hunt'
}
