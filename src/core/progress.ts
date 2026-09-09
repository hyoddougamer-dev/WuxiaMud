import { PATHS, meanRate } from './paths.ts'
import { realm, V1_CEILING } from './realms.ts'
import { TECHNIQUES, technique } from './techniques.ts'
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

export interface Modifiers {
  rate: number
  breakthrough: number
  insight: number
  offlineCapHours: number
  noDecay: boolean
}

export function modifiers(s: PlayerState): Modifiers {
  const m: Modifiers = {
    rate: 1,
    breakthrough: 1,
    insight: 1,
    offlineCapHours: DEFAULT_OFFLINE_CAP_HOURS,
    noDecay: false,
  }
  for (const id of s.equipped) {
    const t = technique(id)
    if (!t) continue
    if (t.kind === 'rate') m.rate += t.value
    else if (t.kind === 'breakthrough') m.breakthrough -= t.value
    else if (t.kind === 'insight') m.insight += t.value
    else if (t.kind === 'offlineCap') m.offlineCapHours += t.value
  }
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

/** Qi per second right now — what the Cultivate screen shows ticking. */
export function ratePerSecond(s: PlayerState, at: number): number {
  const m = modifiers(s)
  const path = PATHS[s.path]
  const mult = path.rateAt(clockHours(s, at), { noDecay: m.noDecay })
  return BASE_QI_PER_SECOND * realm(s.realm).rate * mult * m.rate
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
  const qiGained = (creditedMs / 1000) * BASE_QI_PER_SECOND * realm(s.realm).rate * mult * m.rate

  return {
    state: { ...s, qi: s.qi + qiGained, lastSeenAt: now },
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

export function breakThrough(s: PlayerState, now: number): PlayerState {
  if (!canBreakThrough(s)) return s
  const cost = breakthroughCost(s)
  const m = modifiers(s)
  const gained = Math.round((s.realm * 2) * m.insight)
  return {
    ...s,
    qi: s.qi - cost,
    realm: s.realm + 1,
    insight: s.insight + gained,
    totalBreakthroughs: s.totalBreakthroughs + 1,
    lastBreakthroughAt: now,
  }
}

export function learn(s: PlayerState, id: string): PlayerState {
  const t = technique(id)
  if (!t || s.learned.includes(id) || s.insight < t.cost || s.realm < t.realm) return s
  return { ...s, insight: s.insight - t.cost, learned: [...s.learned, id] }
}

export function equip(s: PlayerState, id: string, slots: number): PlayerState {
  if (!s.learned.includes(id) || s.equipped.includes(id) || s.equipped.length >= slots) return s
  return { ...s, equipped: [...s.equipped, id] }
}

export function unequip(s: PlayerState, id: string): PlayerState {
  return { ...s, equipped: s.equipped.filter((e) => e !== id) }
}

export function available(s: PlayerState) {
  return TECHNIQUES.filter((t) => t.realm <= s.realm)
}
