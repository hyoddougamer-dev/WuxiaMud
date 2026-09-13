import { huntCharges, maxCharges, nextChargeAt, HUNT_CHARGE_MS } from './hunt.ts'
import { breakthroughCost, canBreakThrough, modifiers, ratePerSecond } from './progress.ts'
import { gateOpen } from './bottlenecks.ts'
import { realm } from './realms.ts'
import { trailAt, trailEndsAt } from './hunt.ts'
import type { PlayerState } from './state.ts'

/**
 * 報 The four moments the game already knows and could not tell anyone about.
 *
 * The whole design rewards opening the app when a charge lands: charges arrive every six
 * hours, the trail in every ground turns over on the same clock, and the measured
 * advantage of playing actively — about thirty percent better quarry — depends entirely
 * on being there when it does. The game had no way to say so. That is the retention loop
 * of an idle game, and it was simply absent.
 *
 * Pure, like everything else in core: this says *when* and *what*, and the edge in
 * ui/useReminders.ts does the scheduling. That keeps the decision testable and means the
 * same function can one day run on a server that sends a push instead.
 *
 * Two rules it will not break. Everything here is a moment the player is *losing*
 * something — a charge thrown away past the cap, a tribulation sitting ready, a
 * settling that has finished and is now costing eighty-five percent of generation.
 * Nothing here is "come back and look at us". And there are at most two a day, because
 * an idle game that buzzes is an idle game that gets uninstalled.
 */
export type ReminderKind = 'charges' | 'tribulation' | 'settled' | 'injury'

export interface Reminder {
  readonly kind: ReminderKind
  /** Epoch ms. Always in the future, or the caller drops it. */
  readonly at: number
  readonly title: string
  readonly body: string
}

/** What is on by default. The two that are about losing something outright, and settling. */
export const DEFAULT_ON: Record<ReminderKind, boolean> = {
  charges: true, tribulation: true, settled: true, injury: false,
}

export const KIND_NAME: Record<ReminderKind, { name: string; note: string }> = {
  charges: { name: 'Hunts at the cap', note: 'Once, when the last charge lands' },
  tribulation: { name: 'A tribulation is ready', note: 'When the qi and the gate are both in hand' },
  settled: { name: 'The heart is quiet', note: 'Settling costs 85% of your generation' },
  injury: { name: 'An injury lifts', note: 'After a failed tribulation' },
}

/** Never more than this in a day, whatever the state says. */
export const MOST_PER_DAY = 2

/** When the satchel stops filling: every charge that lands after this is thrown away. */
export function chargesFullAt(s: PlayerState, now: number): number {
  if (huntCharges(s, now) >= maxCharges(s)) return 0
  const per = HUNT_CHARGE_MS * modifiers(s).huntSpeed
  return s.huntAnchorAt + maxCharges(s) * per
}

/**
 * When the qi will be enough, at the rate the cultivator is producing right now.
 *
 * An estimate and openly so: the path multiplier drifts, an art may be equipped, a hunt
 * spends qi. Being an hour out on a notification that says "there is something waiting"
 * costs nothing, and the alternative — simulating forward to find the exact instant — is
 * a great deal of arithmetic for a message.
 */
export function tribulationAt(s: PlayerState, now: number): number {
  if (canBreakThrough(s)) return now
  if (!gateOpen(s)) return 0 // the gate needs the player, not the clock
  const rate = ratePerSecond(s, now)
  if (rate <= 0) return 0
  const left = breakthroughCost(s) - s.qi
  return left <= 0 ? now : now + (left / rate) * 1000
}

/**
 * Everything worth saying, soonest first, capped.
 *
 * `on` comes from the player's own switches; a kind that is off is never computed into
 * a message. Anything already due is dropped rather than fired immediately — a
 * notification for something that happened before you closed the app is noise.
 */
export function due(s: PlayerState, now: number, on: Record<ReminderKind, boolean> = DEFAULT_ON): Reminder[] {
  const out: Reminder[] = []

  if (on.charges) {
    const at = chargesFullAt(s, now)
    if (at > now) {
      const cap = maxCharges(s)
      const beast = trailAt(s.ground, at)
      out.push({
        kind: 'charges', at,
        title: `${cap} hunts waiting`,
        body: beast
          ? `${beast.name} is on the trail. Anything past the cap is lost.`
          : 'Anything that lands past the cap is lost.',
      })
    }
  }

  if (on.tribulation) {
    const at = tribulationAt(s, now)
    if (at > now) {
      out.push({
        kind: 'tribulation', at,
        title: 'The heavens are ready',
        body: `You have the qi to leave ${realm(s.realm).name}.`,
      })
    }
  }

  if (on.settled && s.settling && s.turmoil > 0) {
    const m = modifiers(s)
    const hours = s.turmoil / (180 * m.settleDrain)
    const at = now + hours * 3_600_000
    if (at > now) {
      out.push({
        kind: 'settled', at,
        title: 'The heart is quiet',
        body: 'Settling is done and is costing you generation. Sit up.',
      })
    }
  }

  if (on.injury && s.injuredUntil > now) {
    out.push({
      kind: 'injury', at: s.injuredUntil,
      title: 'The injury has healed',
      body: 'Generation is back to full.',
    })
  }

  return out.sort((a, b) => a.at - b.at).slice(0, MOST_PER_DAY)
}

/**
 * Whether it is a decent moment to ask for permission.
 *
 * Not on the first launch. A game that asks to send notifications before the player has
 * done anything is a game that gets refused, and a refusal on Android is close to
 * permanent. The first breakthrough is the earliest point at which the player has any
 * reason to want to be told something, so that is when it asks — once.
 */
export function worthAsking(s: PlayerState, asked: boolean): boolean {
  return !asked && s.totalBreakthroughs >= 1
}

/** Only used to explain the timing on the settings screen. */
export { nextChargeAt, trailEndsAt }
