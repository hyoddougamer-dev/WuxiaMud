import { PATHS, meanRate } from './paths.ts'
import { realm, V1_CEILING } from './realms.ts'
import { TECHNIQUES, technique, upkeepOf, schoolClash } from './techniques.ts'
import { PILLS, type PillId, held } from './pills.ts'
import { canPay, pay, type Satchel } from './materials.ts'
import { inheritedEffect } from './ancestry.ts'
import type { PlayerState } from './state.ts'

/**
 * The whole progress engine, kept pure and free of browser APIs on purpose.
 *
 * In release one this runs on the client. Before any merit flows between players it
 * moves to an edge function unchanged and the client keeps only the display copy —
 * which is why nothing in here reads Date.now(), localStorage or window.
 */

export const BASE_QI_PER_SECOND = 1
export const DEFAULT_OFFLINE_CAP_HOURS = 24
const HOUR_MS = 3_600_000

/** Turmoil above this is free; past it, cultivation starts fighting you. */
export const TURMOIL_FREE = 50
export const TURMOIL_MAX = 100
/**
 * Turmoil per hour of cultivation, scaled by how hard the path is pushing at the time.
 *
 * The first model tied this to qi gathered against the realm's cost, which saturated
 * in under an hour: early realms are cheap relative to the rate, so an idle player
 * banked twelve realms' worth of qi overnight and pinned the meter at maximum before
 * the mechanic had said anything. Time is the honest unit — and multiplying by the
 * path's own curve means Sword's sharpened intent and Blade's fresh momentum both
 * cost the same calm for the same output.
 */
export const TURMOIL_PER_HOUR = 4
/** Settling trades output for quiet: this share of the rate, this much drained per hour. */
export const SETTLE_RATE = 0.15
export const SETTLE_DRAIN_PER_HOUR = 180
export const INJURY_RATE = 0.55

export interface Modifiers {
  rate: number
  breakthrough: number
  insight: number
  offlineCapHours: number
  noDecay: boolean
  /** Absolute qi/second consumed by equipped arts. */
  upkeep: number
}

/** Everything the arts, the flame, the inherited art and the line do to the numbers. */
export function modifiers(s: PlayerState): Modifiers {
  const m: Modifiers = {
    rate: 1,
    breakthrough: 1,
    insight: 1,
    offlineCapHours: DEFAULT_OFFLINE_CAP_HOURS,
    noDecay: false,
    upkeep: 0,
  }
  for (const id of s.equipped) {
    const t = technique(id)
    if (!t) continue
    if (t.kind === 'rate') m.rate += t.value
    else if (t.kind === 'breakthrough') m.breakthrough -= t.value
    else if (t.kind === 'insight') m.insight += t.value
    else if (t.kind === 'offlineCap') m.offlineCapHours += t.value
    m.upkeep += upkeepOf(t)
  }
  // The inherited art is carried by the ancestor, not by you: full effect, no upkeep,
  // and worth more when it comes from a path that is not your own.
  if (s.inherited) {
    const t = technique(s.inherited.techniqueId)
    if (t) {
      const v = inheritedEffect(t, s.inherited.fromPath, s.path)
      if (t.kind === 'rate') m.rate += v
      else if (t.kind === 'breakthrough') m.breakthrough -= v
      else if (t.kind === 'insight') m.insight += v
      else if (t.kind === 'offlineCap') m.offlineCapHours += v
    }
  }
  // Fixed at birth rather than read live: your line is what it was when you were
  // born, which is both simpler to reason about and better fiction.
  m.rate += s.lineBonus

  if (s.flame === 'bonechill') m.noDecay = true
  if (s.flame === 'fallheart') m.breakthrough *= 0.5
  if (s.flame === 'seaheart') m.insight *= 2
  m.breakthrough = Math.max(m.breakthrough, 0.15)
  return m
}

/** Hours on this player's path clock at a given instant. */
export function clockHours(s: PlayerState, at: number): number {
  const anchor = PATHS[s.path].clock === 'sinceBreakthrough' ? s.lastBreakthroughAt : s.lastOpenedAt
  return Math.max(0, (at - anchor) / HOUR_MS)
}

/** Penalty from an unquiet heart. Free up to TURMOIL_FREE, then down to 0.7x. */
export function turmoilFactor(turmoil: number): number {
  const over = Math.max(0, Math.min(turmoil, TURMOIL_MAX) - TURMOIL_FREE)
  return 1 - (over / (TURMOIL_MAX - TURMOIL_FREE)) * 0.3
}

/** Before upkeep and before settling: what the cultivator produces. */
export function grossPerSecond(s: PlayerState, at: number): number {
  const m = modifiers(s)
  const path = PATHS[s.path]
  const mult = path.rateAt(clockHours(s, at), { noDecay: m.noDecay })
  const injured = at < s.injuredUntil ? INJURY_RATE : 1
  return BASE_QI_PER_SECOND * realm(s.realm).rate * mult * m.rate * turmoilFactor(s.turmoil) * injured
}

/**
 * Qi per second right now — what the Cultivate screen shows ticking.
 * Upkeep can never take more than 90% of the gross, so a bad loadout is a bad
 * decision rather than a dead save.
 */
export function ratePerSecond(s: PlayerState, at: number): number {
  const gross = grossPerSecond(s, at)
  if (s.settling) return gross * SETTLE_RATE
  return Math.max(gross * 0.1, gross - modifiers(s).upkeep)
}

export function breakthroughCost(s: PlayerState): number {
  return Math.ceil(realm(s.realm).cost * modifiers(s).breakthrough)
}

export function canBreakThrough(s: PlayerState): boolean {
  return s.realm < V1_CEILING && s.qi >= breakthroughCost(s)
}

export interface ElapsedReport {
  /** Real seconds since the last recorded sighting. */
  elapsedSeconds: number
  /** Seconds that actually counted, after the offline cap. */
  creditedSeconds: number
  qiGained: number
  cappedBy: number
}

/**
 * Advance the state to `now`. Pure: returns a new state and a report, mutates nothing.
 * Elapsed time beyond the offline cap is discarded, never banked.
 */
export function advance(s: PlayerState, now: number): { state: PlayerState; report: ElapsedReport } {
  const elapsedMs = Math.max(0, now - s.lastSeenAt)
  const m = modifiers(s)
  const capMs = m.offlineCapHours * HOUR_MS
  const creditedMs = Math.min(elapsedMs, capMs)

  const path = PATHS[s.path]
  const h0 = clockHours(s, s.lastSeenAt)
  const h1 = h0 + creditedMs / HOUR_MS
  const mult = meanRate(path, h0, h1, { noDecay: m.noDecay })

  // The injury clock may expire partway through the window, so credit the two
  // stretches separately rather than judging the whole window by its start.
  const injuredMs = Math.max(0, Math.min(s.injuredUntil, s.lastSeenAt + creditedMs) - s.lastSeenAt)
  const injuryFactor = creditedMs === 0 ? 1
    : (injuredMs * INJURY_RATE + (creditedMs - injuredMs)) / creditedMs

  const seconds = creditedMs / 1000
  const gross = seconds * BASE_QI_PER_SECOND * realm(s.realm).rate * mult * m.rate
    * turmoilFactor(s.turmoil) * injuryFactor

  const qiGained = s.settling
    ? gross * SETTLE_RATE
    : Math.max(gross * 0.1, gross - m.upkeep * seconds)

  const hours = creditedMs / HOUR_MS
  const turmoil = s.settling
    ? Math.max(0, s.turmoil - SETTLE_DRAIN_PER_HOUR * hours)
    : Math.min(TURMOIL_MAX, s.turmoil + hours * TURMOIL_PER_HOUR * mult)

  return {
    state: { ...s, qi: s.qi + qiGained, turmoil, lastSeenAt: now },
    report: {
      elapsedSeconds: elapsedMs / 1000,
      creditedSeconds: creditedMs / 1000,
      qiGained,
      cappedBy: Math.max(0, (elapsedMs - creditedMs) / 1000),
    },
  }
}

/** Called once when the player brings the game to the foreground. Resets Blade's clock. */
export function openSession(s: PlayerState, now: number): PlayerState {
  return { ...s, lastOpenedAt: now, lastSeenAt: now }
}

export function learn(s: PlayerState, id: string): PlayerState {
  const t = technique(id)
  if (!t || s.learned.includes(id) || s.insight < t.cost || s.realm < t.realm) return s
  return { ...s, insight: s.insight - t.cost, learned: [...s.learned, id] }
}

export function equip(s: PlayerState, id: string, slots: number): PlayerState {
  const t = technique(id)
  if (!t || !s.learned.includes(id) || s.equipped.includes(id) || s.equipped.length >= slots) return s
  if (schoolClash(s.equipped, t)) return s
  return { ...s, equipped: [...s.equipped, id] }
}

export function unequip(s: PlayerState, id: string): PlayerState {
  return { ...s, equipped: s.equipped.filter((e) => e !== id) }
}

export function available(s: PlayerState) {
  return TECHNIQUES.filter((t) => t.realm <= s.realm)
}

/** Toggling settle is instantaneous, but only after the elapsed window is credited —
 *  otherwise the last hour of cultivation is re-priced at the new mode's rate. */
export function toggleSettle(s: PlayerState): PlayerState {
  return { ...s, settling: !s.settling }
}

export function brew(s: PlayerState, id: PillId): PlayerState {
  const p = PILLS.find((x) => x.id === id)
  if (!p || !canPay(s.satchel, p.cost as Satchel)) return s
  return {
    ...s,
    satchel: pay(s.satchel, p.cost as Satchel),
    pills: { ...s.pills, [id]: held(s.pills, id) + 1 },
  }
}

export function takePill(s: PlayerState, id: PillId, at: number): PlayerState {
  if (held(s.pills, id) < 1) return s
  const bag = { ...s.pills, [id]: held(s.pills, id) - 1 }
  if (id === 'settling') {
    return { ...s, pills: bag, turmoil: Math.max(0, s.turmoil - 45) }
  }
  if (id === 'tribulation') {
    if (s.pillPrimed) return s
    return { ...s, pills: bag, pillPrimed: true }
  }
  // gathering: two hours of what you currently produce, banked immediately
  return { ...s, pills: bag, qi: s.qi + ratePerSecond(s, at) * 7200 }
}
