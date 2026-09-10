/**
 * How long does the content actually last?
 *
 * Not an estimate: this drives the real engine — the same advance(), attempt(),
 * hunt(), openMeridian() and breakGate() the game runs — with a policy a competent
 * player would follow, and counts the days and the sessions it takes to reach the top
 * of the ladder.
 *
 *   npm run measure
 */
import { advance, breakthroughCost, canBreakThrough, learn, equip, brew, takePill,
         toggleSettle, ratePerSecond, modifiers, clockHours, openMeridian,
         pillCost, TURMOIL_FREE } from '../src/core/progress.ts'
import { attempt, odds, SURPLUS_CAP } from '../src/core/tribulation.ts'
import { hunt, canHunt, huntCharges } from '../src/core/hunt.ts'
import { bottleneckAt, canBreakGate, breakGate, checklist, gateOpen } from '../src/core/bottlenecks.ts'
import { MERIDIANS, unlocked } from '../src/core/meridians.ts'
import { newPlayer, type PlayerState } from '../src/core/state.ts'
import { TECHNIQUES, slotsAt, schoolClash, technique, upkeepOf } from '../src/core/techniques.ts'
import { V1_CEILING } from '../src/core/realms.ts'
import { canPay } from '../src/core/materials.ts'
import { held } from '../src/core/pills.ts'
import { PATHS, type PathId } from '../src/core/paths.ts'
import type { OriginId } from '../src/core/origins.ts'

const H = 3_600_000

/** Seeded so a run is reproducible and a regression is visible. */
function rng(seed: number) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 4294967296)
}

interface Run {
  path: PathId
  origin: OriginId
  days: number
  sessions: number
  breakthroughs: number
  failures: number
  hunts: number
  settles: number
  artsLearned: number
  meridians: number
  gates: number
  /** Minutes of foreground time, at a measured 100s per session. */
  activeMinutes: number
  reachedCeiling: boolean
  stall?: string
}

/**
 * Seconds of foreground time a session actually asks for. Up from 90 now that the
 * meridian screen and the bottleneck checklist exist: there is more to read and more
 * to decide, and holding the old number would flatter the active-time figure.
 */
const SESSION_SECONDS = 100

/**
 * The odds a competent player waits for before facing a tribulation.
 *
 * Read off the realm rather than fixed. A flat 0.75 gate looks reasonable and is
 * unreachable: Great Vehicle opens at 52% and surplus caps at +25%.
 */
function attemptTarget(s: PlayerState): number {
  const o = odds(s)
  return Math.min(0.85, o.base + SURPLUS_CAP + modifiers(s).odds - 0.03)
}

/**
 * How quiet this cultivator needs to be, or null if it does not matter yet.
 *
 * Two reasons to sit down, and the second is the one the first draft of this policy
 * missed: a gate that asks for quiet outright, and a tribulation already waiting
 * whose only missing points are the ones turmoil is taking. Without the second, every
 * run parked at Unity on 74% odds against an 85% target, holding ninety-five times
 * the qi it needed and a heart at fifty-five that nothing would ever ask it to settle.
 */
function wantsQuiet(s: PlayerState): number | null {
  const b = bottleneckAt(s.realm)
  if (b && !gateOpen(s)) {
    const row = checklist(s, b).find((r) => r.atMost && !r.ok)
    if (row) return row.need
  }
  if (canBreakThrough(s) && odds(s).needed && odds(s).total < attemptTarget(s)) return 8
  return null
}

/** What a competent player does with a minute and a half, in priority order. */
function play(s: PlayerState, now: number, roll: () => number, tally: Run): PlayerState {
  const slots = slotsAt(s.realm)

  // 1. Hunt out the charges first. Insight and materials are what everything below
  //    spends, and a hunt now costs five minutes of gathering rather than a fifth of
  //    the bank, so there is no longer a reason to hold them back.
  while (canHunt(s, now) && huntCharges(s, now) > 0) {
    const got = hunt(s, now, roll())
    if (!got) break
    s = got.state
    tally.hunts++
  }

  // 2. Open every meridian the purse stretches to, cheapest first. Permanent, no
  //    upkeep, nothing to weigh it against — the only question is affordability.
  for (;;) {
    const next = [...MERIDIANS]
      .sort((a, b) => a.insight - b.insight)
      .find((m) => !s.meridians.includes(m.id) && unlocked(s.meridians, m)
        && s.realm >= m.realm && s.insight >= m.insight && canPay(s.satchel, m.mats))
    if (!next) break
    s = openMeridian(s, next.id)
    tally.meridians++
  }

  // 3. The heart. A gate that asks for quiet is the one thing worth settling for even
  //    when the meter is nowhere near the free threshold.
  const wants = wantsQuiet(s)
  if (wants !== null && s.turmoil > wants && !s.settling) { s = toggleSettle(s); tally.settles++ }
  else if (s.settling && (wants === null ? s.turmoil <= 5 : s.turmoil <= wants)) s = toggleSettle(s)
  if (!s.settling && wants === null && s.turmoil > TURMOIL_FREE + 20 && held(s.pills, 'settling') === 0) {
    s = toggleSettle(s); tally.settles++
  }

  // 4. Brew and swallow what helps — but keep a couple on the shelf, not a warehouse.
  //    Brewing whenever it was affordable is what the first version did, and it spent
  //    six thousand hides on settling pills nobody swallowed while the Lung Channel
  //    sat two hides out of reach. Pills and meridians compete for the same satchel.
  if (held(s.pills, 'settling') < 2 && canPay(s.satchel, pillCost(s, 'settling'))) s = brew(s, 'settling')
  if (held(s.pills, 'tribulation') < 2 && canPay(s.satchel, pillCost(s, 'tribulation'))) s = brew(s, 'tribulation')
  if (s.turmoil > 70 && held(s.pills, 'settling') > 0) s = takePill(s, 'settling', now)

  // 5. Spend what insight is left on the best affordable art that does not clash.
  for (const t of [...TECHNIQUES].sort((a, b) => b.cost - a.cost)) {
    if (s.realm >= t.realm && s.insight >= t.cost && !s.learned.includes(t.id)) {
      const before = s.learned.length
      s = learn(s, t.id)
      if (s.learned.length > before) { tally.artsLearned++; break }
    }
  }
  for (const id of s.learned) {
    const t = technique(id)
    if (!t || s.equipped.includes(id) || s.equipped.length >= slots) continue
    if (schoolClash(s.equipped, t)) continue
    if (upkeepOf(t) > ratePerSecond(s, now) * 0.35) continue
    s = equip(s, id, slots)
  }

  // 6. Break the bottleneck the moment it will let you. Breaking one can open a
  //    tribulation, which is why the heart is looked at once more below.
  if (canBreakGate(s)) { s = breakGate(s); tally.gates++ }
  const after = wantsQuiet(s)
  if (after !== null && s.turmoil > after && !s.settling) { s = toggleSettle(s); tally.settles++ }

  // 7. Break through when the odds stop improving.
  //
  //    The threshold is read off the realm rather than fixed. A flat 0.75 gate looks
  //    reasonable and is unreachable: Great Vehicle opens at 52% and surplus caps at
  //    +25%. What a competent player does is bank toward the cap, quiet the heart,
  //    swallow the pill on the rungs that can actually kill them, and go.
  if (canBreakThrough(s)) {
    const o = odds(s)
    const target = attemptTarget(s)
    const plateaued = s.qi >= breakthroughCost(s) * 2 && s.turmoil <= 12 && !s.settling
    if (!o.needed || o.total >= target || plateaued) {
      if (o.needed && !s.pillPrimed && o.total < 0.9 && held(s.pills, 'tribulation') > 0) {
        s = takePill(s, 'tribulation', now)
      }
      const out = attempt(s, now, roll())
      s = out.state
      if (out.succeeded) tally.breakthroughs++
      else tally.failures++
    }
  }
  return s
}

function simulate(path: PathId, origin: OriginId, seed: number): Run {
  const start = 1_700_000_000_000
  let s = newPlayer(path, start, { origin, name: 'Sim', seal: '道' })
  const roll = rng(seed)
  const tally: Run = {
    path, origin, days: 0, sessions: 0, breakthroughs: 0, failures: 0,
    hunts: 0, settles: 0, artsLearned: 0, meridians: 0, gates: 0,
    activeMinutes: 0, reachedCeiling: false,
  }

  // Sword is played once a day; Blade five times. Session times are computed from
  // the index rather than accumulated, so an off-by-one cannot stop the clock —
  // which is exactly what the first version of this did, and it made Sword look
  // unfinishable when the simulator was the thing that was broken.
  const perDay = path === 'sword' ? 1 : 5
  const step = (24 * H) / perDay

  const MAX_DAYS = 400
  const maxSessions = MAX_DAYS * perDay
  let now = start
  for (let i = 1; i <= maxSessions && s.realm < V1_CEILING; i++) {
    now = start + i * step
    s = advance(s, now).state
    s = { ...s, lastOpenedAt: now }
    s = play(s, now, roll, tally)
    tally.sessions++
    s = { ...s, activeSeconds: s.activeSeconds + SESSION_SECONDS }
    tally.days = Math.ceil(i / perDay)
  }
  tally.reachedCeiling = s.realm >= V1_CEILING
  if (!tally.reachedCeiling) {
    const o = odds(s)
    const b = bottleneckAt(s.realm)
    const missing = b && !gateOpen(s)
      ? checklist(s, b).filter((r) => !r.ok).map((r) => `${r.label} ${r.have}/${r.need}`).join(', ')
      : 'open'
    tally.stall = `realm ${s.realm} · qi ${(s.qi / breakthroughCost(s)).toFixed(2)}× cost` +
      ` · turmoil ${s.turmoil.toFixed(0)} · odds ${(o.total * 100).toFixed(0)}%` +
      ` (base ${(o.base * 100).toFixed(0)} surplus +${(o.surplus * 100).toFixed(0)}` +
      ` turmoil ${(o.turmoil * 100).toFixed(0)} vessels +${(o.vessel * 100).toFixed(0)})` +
      `\n         gate: ${missing}` +
      `\n         meridians ${s.meridians.length}/12 · arts ${s.learned.length} · beasts ${s.seenBeasts.length}` +
      ` · insight ${s.insight} · hide/core/essence ${s.satchel.hide ?? 0}/${s.satchel.core ?? 0}/${s.satchel.essence ?? 0}` +
      `\n         rate ${ratePerSecond(s, now).toFixed(0)}/s · upkeep ${modifiers(s).upkeep.toFixed(0)}/s` +
      ` · settling ${s.settling} · pathMult ${PATHS[s.path].rateAt(clockHours(s, now)).toFixed(2)}` +
      ` · rateMod ${modifiers(s).rate.toFixed(2)}`
  }
  tally.activeMinutes = Math.round((tally.sessions * SESSION_SECONDS) / 60)
  return tally
}

const ORIGINS: OriginId[] = ['rogue', 'family', 'cauldron', 'hunter', 'castout']
const rows: Run[] = []
for (const path of ['sword', 'blade'] as PathId[]) {
  for (const o of ORIGINS) rows.push(simulate(path, o, 1234 + o.length))
}

const pad = (v: string | number, n: number) => String(v).padStart(n)
console.log(`\nNinefold · measured content length to realm ${V1_CEILING}\n`)
console.log('path   origin      days  sessions  active  breaks  failed  hunts  arts  merid  gates  reached')
console.log('─'.repeat(94))
for (const r of rows) {
  console.log(
    r.path.padEnd(7) + r.origin.padEnd(12) +
    pad(r.days, 4) + pad(r.sessions, 10) + pad(`${(r.activeMinutes / 60).toFixed(1)}h`, 8) +
    pad(r.breakthroughs, 7) + pad(r.failures, 8) + pad(r.hunts, 7) + pad(r.artsLearned, 6) +
    pad(r.meridians, 7) + pad(r.gates, 7) + pad(r.reachedCeiling ? 'yes' : 'NO', 9),
  )
}

const done = rows.filter((r) => r.reachedCeiling)
const avgDays = done.reduce((a, r) => a + r.days, 0) / Math.max(1, done.length)
const avgHours = done.reduce((a, r) => a + r.activeMinutes, 0) / Math.max(1, done.length) / 60
console.log('─'.repeat(94))
for (const r of rows) if (r.stall) console.log(`\n  STALL  ${r.path}/${r.origin}: ${r.stall}`)
console.log(`\n${done.length}/${rows.length} runs reached the ceiling.`)
if (done.length) {
  const days = done.map((r) => r.days).sort((a, b) => a - b)
  console.log(`Days:   ${days[0]}–${days[days.length - 1]}, average ${avgDays.toFixed(0)}.`)
  console.log(`Active: ${avgHours.toFixed(1)}h average of foreground time.`)
}
console.log(`\nA day of Sword is one session; a day of Blade is five. Active time assumes`)
console.log(`${SESSION_SECONDS}s per session, which is what the loop actually asks for.\n`)
if (done.length < rows.length) {
  console.error('Some runs never reached the ceiling — the curve is broken somewhere.')
  process.exit(1)
}
