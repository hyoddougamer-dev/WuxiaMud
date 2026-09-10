/**
 * How long does the content actually last?
 *
 * Not an estimate: this drives the real engine — the same advance(), attempt(),
 * hunt() and modifiers() the game runs — with a policy a competent player would
 * follow, and counts the days and the sessions it takes to reach the ceiling.
 *
 *   npm run measure
 */
import { advance, breakthroughCost, canBreakThrough, learn, equip, brew, takePill,
         toggleSettle, ratePerSecond, modifiers, clockHours, TURMOIL_FREE } from '../src/core/progress.ts'
import { attempt, odds, SURPLUS_CAP } from '../src/core/tribulation.ts'
import { hunt, canHunt } from '../src/core/hunt.ts'
import { newPlayer, type PlayerState } from '../src/core/state.ts'
import { TECHNIQUES, slotsAt, schoolClash, technique, upkeepOf } from '../src/core/techniques.ts'
import { V1_CEILING, realm } from '../src/core/realms.ts'
import { canPay } from '../src/core/materials.ts'
import { pillCost } from '../src/core/progress.ts'
import { held } from '../src/core/pills.ts'
import { PATHS, type PathId } from '../src/core/paths.ts'
import type { OriginId } from '../src/core/origins.ts'

const H = 3_600_000
const MIN = 60_000

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
  /** Minutes of foreground time, at a measured 90s per session. */
  activeMinutes: number
  reachedCeiling: boolean
  stall?: string
}

const SESSION_SECONDS = 90

/** What a competent player does with two minutes, in priority order. */
function play(s: PlayerState, now: number, roll: () => number, tally: Run): PlayerState {
  const slots = slotsAt(s.realm)

  // 1. Stop settling once the heart is quiet — settling is expensive.
  if (s.settling && s.turmoil <= 5) s = toggleSettle(s)
  // Quiet it *before* it starts costing, rather than discovering the problem at the
  // gate. A competent player watches the second bar; a perfect one is not simulated.
  if (!s.settling && s.turmoil > TURMOIL_FREE + 20 && held(s.pills, 'settling') === 0) {
    s = toggleSettle(s); tally.settles++
  }

  // 2. Brew and swallow what helps, when it is free to do so.
  if (canPay(s.satchel, pillCost(s, 'settling'))) s = brew(s, 'settling')
  if (canPay(s.satchel, pillCost(s, 'tribulation'))) s = brew(s, 'tribulation')
  if (s.turmoil > 70 && held(s.pills, 'settling') > 0) s = takePill(s, 'settling', now)

  // 3. Spend insight on the best affordable art that does not clash.
  for (const t of [...TECHNIQUES].sort((a, b) => b.cost - a.cost)) {
    if (s.realm >= t.realm && s.insight >= t.cost && !s.learned.includes(t.id)) {
      const before = s.learned.length
      s = learn(s, t.id)
      if (s.learned.length > before) { tally.artsLearned++; break }
    }
  }
  // Equip anything that fits, worth its upkeep, and does not clash.
  for (const id of s.learned) {
    const t = technique(id)
    if (!t || s.equipped.includes(id) || s.equipped.length >= slots) continue
    if (schoolClash(s.equipped, t)) continue
    if (upkeepOf(t) > ratePerSecond(s, now) * 0.35) continue
    s = equip(s, id, slots)
  }

  // 4. Break through when the odds are worth it. Below realm 3 there is no gamble.
  //
  // The threshold is read off the realm rather than fixed. A flat 0.75 gate looks
  // reasonable and is unreachable: realm 6 starts at 70% and surplus is capped at
  // +25%, so a player holding 1.3x the cost tops out around 77% and one carrying any
  // turmoil never qualifies at all. The first version of this simulator used 0.75 and
  // reported that two of ten runs could not finish the game — the *policy* could not
  // finish it. What a competent player actually does is bank toward the surplus cap,
  // quiet the heart, and go when the odds stop improving.
  if (canBreakThrough(s)) {
    const o = odds(s)
    const target = Math.min(0.85, o.base + SURPLUS_CAP - 0.03)
    const plateaued = s.qi >= breakthroughCost(s) * 2 && s.turmoil <= 12 && !s.settling
    if (!o.needed || o.total >= target || plateaued) {
      if (o.needed && s.pillPrimed === false && held(s.pills, 'tribulation') > 0) {
        s = takePill(s, 'tribulation', now)
      }
      const out = attempt(s, now, roll())
      s = out.state
      if (out.succeeded) tally.breakthroughs++
      else tally.failures++
    } else if (s.turmoil > TURMOIL_FREE && !s.settling) {
      // Odds too thin and the heart is the reason: sit down.
      s = toggleSettle(s); tally.settles++
    }
  }

  // 5. Hunt whenever the cooldown allows. Since a hunt costs five minutes of gathering
  // rather than a fifth of the bank, there is no longer a reason to hold off.
  if (canHunt(s, now)) {
    const got = hunt(s, now, roll())
    if (got) { s = got.state; tally.hunts++ }
  }
  return s
}

function simulate(path: PathId, origin: OriginId, seed: number): Run {
  const start = 1_700_000_000_000
  let s = newPlayer(path, start, { origin, name: 'Sim', seal: '道' })
  const roll = rng(seed)
  const tally: Run = {
    path, origin, days: 0, sessions: 0, breakthroughs: 0, failures: 0,
    hunts: 0, settles: 0, artsLearned: 0, activeMinutes: 0, reachedCeiling: false,
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
    tally.stall = `realm ${s.realm} · qi ${(s.qi / breakthroughCost(s)).toFixed(2)}× cost` +
      ` · turmoil ${s.turmoil.toFixed(0)} · odds ${(o.total * 100).toFixed(0)}%` +
      ` (base ${(o.base * 100).toFixed(0)} surplus +${(o.surplus * 100).toFixed(0)}` +
      ` turmoil ${(o.turmoil * 100).toFixed(0)}) · rate ${ratePerSecond(s, now).toFixed(0)}/s` +
      ` · upkeep ${modifiers(s).upkeep.toFixed(0)}/s · equipped ${s.equipped.length}` +
      ` · settling ${s.settling} · injured ${now < s.injuredUntil}` +
      ` · pathMult ${PATHS[s.path].rateAt(clockHours(s, now)).toFixed(2)}` +
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
console.log('\nNinefold · measured content length to realm 7 (Unity)\n')
console.log('path   origin      days  sessions  active   breakthroughs  failed  hunts  arts  reached')
console.log('─'.repeat(88))
for (const r of rows) {
  console.log(
    r.path.padEnd(7) + r.origin.padEnd(12) +
    pad(r.days, 4) + pad(r.sessions, 10) + pad(`${(r.activeMinutes / 60).toFixed(1)}h`, 8) +
    pad(r.breakthroughs, 15) + pad(r.failures, 8) + pad(r.hunts, 7) + pad(r.artsLearned, 6) +
    pad(r.reachedCeiling ? 'yes' : 'NO', 9),
  )
}

const done = rows.filter((r) => r.reachedCeiling)
const avgDays = done.reduce((a, r) => a + r.days, 0) / Math.max(1, done.length)
const avgHours = done.reduce((a, r) => a + r.activeMinutes, 0) / Math.max(1, done.length) / 60
console.log('─'.repeat(88))
for (const r of rows) if (r.stall) console.log(`\n  STALL  ${r.path}/${r.origin}: ${r.stall}`)
console.log(`\n${done.length}/${rows.length} runs reached the ceiling.`)
console.log(`Average: ${avgDays.toFixed(0)} days, ${avgHours.toFixed(1)}h of active time.\n`)
console.log(`A day of Sword is one session; a day of Blade is five. Active time assumes`)
console.log(`${SESSION_SECONDS}s per session, which is what the loop actually asks for.\n`)
if (done.length < rows.length) {
  console.error('Some runs never reached the ceiling — the curve is broken somewhere.')
  process.exit(1)
}
