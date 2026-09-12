import { PATHS, meanRate } from './paths.ts'
import { realm, V1_CEILING } from './realms.ts'
import { TECHNIQUES, technique, upkeepOf, schoolClash } from './techniques.ts'
import { PILLS, type PillId, held } from './pills.ts'
import { canPay, pay, type Satchel } from './materials.ts'
import { inheritedEffect } from './ancestry.ts'
import { MERIDIANS, meridian, unlocked } from './meridians.ts'
import { masteredValue } from './mastery.ts'
import { relicValue } from './relics.ts'
import { gateOpen } from './bottlenecks.ts'
import { draw as drawEncounter } from './encounters.ts'
import { originBreakthrough, originInsight, originPillDiscount, originRate, originTurmoilRate } from './origins.ts'
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
 * Was 4/hour until a simulation of real play found it trapped the Sword Path: a
 * player who opens the game once a day banks twenty-four hours in one go, arrived at
 * every tribulation with a full meter, and could never present a quiet heart. At 1.5
 * a day of gathering costs about twenty-two — well under the free fifty — so settling
 * is something you do every third day rather than every single one.
 *
 * The first model tied this to qi gathered against the realm's cost, which saturated
 * in under an hour: early realms are cheap relative to the rate, so an idle player
 * banked twelve realms' worth of qi overnight and pinned the meter at maximum before
 * the mechanic had said anything. Time is the honest unit — and multiplying by the
 * path's own curve means Sword's sharpened intent and Blade's fresh momentum both
 * cost the same calm for the same output.
 */
export const TURMOIL_PER_HOUR = 1.5
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
  /** Multiplier on how fast the heart stirs. Below one is calmer. */
  turmoilRate: number
  /** Multiplier on how fast settling drains. Above one is faster. */
  settleDrain: number
  /** Multiplier on how long a hunt charge takes to return. Below one is faster. */
  huntSpeed: number
  /** Flat addition to every tribulation's chance, from the extraordinary vessels. */
  odds: number
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
    turmoilRate: 1,
    settleDrain: 1,
    huntSpeed: 1,
    odds: 0,
  }

  // Meridians first: they are permanent, have no upkeep and cannot clash, so they
  // form the floor everything else is measured against.
  for (const id of s.meridians) {
    const v = meridian(id)
    if (!v) continue
    if (v.kind === 'rate') m.rate += v.value
    else if (v.kind === 'insight') m.insight += v.value
    else if (v.kind === 'breakthrough') m.breakthrough -= v.value
    else if (v.kind === 'offlineCap') m.offlineCapHours += v.value
    else if (v.kind === 'turmoil') m.turmoilRate -= v.value
    else if (v.kind === 'settle') m.settleDrain += v.value
    else if (v.kind === 'hunt') m.huntSpeed -= v.value
    else if (v.kind === 'odds') m.odds += v.value
  }
  m.turmoilRate = Math.max(0.2, m.turmoilRate)
  m.huntSpeed = Math.max(0.3, m.huntSpeed)

  // 法寶 are deliberately absent from the rate: generation is what arts are for, and
  // a relic that gave +20% qi would just be an art you cannot refine.
  m.insight += relicValue(s, 'insight')
  m.odds += relicValue(s, 'odds')
  for (const id of s.equipped) {
    const t = technique(id)
    if (!t) continue
    // Mastery raises what the art gives and never what it costs, which is the whole
    // reason refining is a commitment rather than a tax.
    const v = masteredValue(s, id)
    if (t.kind === 'rate') m.rate += v
    else if (t.kind === 'breakthrough') m.breakthrough -= v
    else if (t.kind === 'insight') m.insight += v
    else if (t.kind === 'offlineCap') m.offlineCapHours += v
    m.upkeep += upkeepOf(t)
  }
  // The inherited art is carried by the ancestor, not by you: full effect, no upkeep,
  // and worth more when it comes from a path that is not your own.
  if (s.inherited) {
    const t = technique(s.inherited.techniqueId)
    if (t) {
      const v = inheritedEffect(t, s.inherited.fromPath, s.path, s.inherited.mastery)
      if (t.kind === 'rate') m.rate += v
      else if (t.kind === 'breakthrough') m.breakthrough -= v
      else if (t.kind === 'insight') m.insight += v
      else if (t.kind === 'offlineCap') m.offlineCapHours += v
    }
  }
  // Fixed at birth rather than read live: your line is what it was when you were
  // born, which is both simpler to reason about and better fiction.
  m.rate += s.lineBonus

  m.rate += originRate(s.origin)
  m.insight += originInsight(s.origin)
  m.breakthrough -= originBreakthrough(s.origin)

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

/**
 * Qi alone stopped being enough at the third realm. `gateOpen` is the 瓶頸 check, and
 * it is deliberately part of this function rather than bolted onto the UI: the server
 * will run the same call, and a client that forgets a gate would otherwise be able to
 * skip one.
 */
export function canBreakThrough(s: PlayerState): boolean {
  return s.realm < V1_CEILING && s.qi >= breakthroughCost(s) && gateOpen(s)
}

/** True when the only thing missing is the gate — worth saying differently in the UI. */
export function heldAtGate(s: PlayerState): boolean {
  return s.realm < V1_CEILING && s.qi >= breakthroughCost(s) && !gateOpen(s)
}

/**
 * Open a meridian. Costs insight and materials, needs the realm, and needs the
 * meridian before it in its own course. Permanent and unequippable — the one kind of
 * progress in the game that cannot be undone by a bad decision later.
 */
export function openMeridian(s: PlayerState, id: string): PlayerState {
  const v = meridian(id)
  if (!v || s.meridians.includes(id)) return s
  if (s.realm < v.realm || s.insight < v.insight) return s
  if (!unlocked(s.meridians, v)) return s
  if (!canPay(s.satchel, v.mats)) return s
  return {
    ...s,
    insight: s.insight - v.insight,
    satchel: pay(s.satchel, v.mats),
    meridians: [...s.meridians, id],
  }
}

export function canOpenMeridian(s: PlayerState, id: string): boolean {
  return openMeridian(s, id) !== s
}

/** Everything a meridian asks for, so the UI can grey the right line. */
export function meridiansAt(s: PlayerState) {
  return MERIDIANS.map((v) => ({
    meridian: v,
    open: s.meridians.includes(v.id),
    reachable: unlocked(s.meridians, v),
    affordable: s.insight >= v.insight && canPay(s.satchel, v.mats),
    realmReady: s.realm >= v.realm,
  }))
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
    ? Math.max(0, s.turmoil - SETTLE_DRAIN_PER_HOUR * m.settleDrain * hours)
    : Math.min(TURMOIL_MAX,
        s.turmoil + hours * TURMOIL_PER_HOUR * mult * originTurmoilRate(s.origin) * m.turmoilRate)

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

/**
 * Called once when the player brings the game to the foreground. Resets Blade's clock,
 * and is where 奇遇 are drawn — the one moment the game gets to say "while you were
 * away". The roll comes from the caller for the same reason every other roll does.
 */
export function openSession(s: PlayerState, now: number, roll = 1): PlayerState {
  const found = drawEncounter(s, now, roll)
  return { ...s, lastOpenedAt: now, lastSeenAt: now, encounter: found ? found.id : s.encounter }
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

/** What a pill actually asks of this cultivator, after their origin. */
export function pillCost(s: PlayerState, id: PillId): Satchel {
  const p = PILLS.find((x) => x.id === id)
  if (!p) return {}
  const off = originPillDiscount(s.origin)
  const out: Satchel = {}
  for (const [k, v] of Object.entries(p.cost)) {
    out[k as keyof Satchel] = Math.max(1, (v ?? 0) - off)
  }
  return out
}

export function brew(s: PlayerState, id: PillId): PlayerState {
  const cost = pillCost(s, id)
  if (!PILLS.some((x) => x.id === id) || !canPay(s.satchel, cost)) return s
  return {
    ...s,
    satchel: pay(s.satchel, cost),
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
