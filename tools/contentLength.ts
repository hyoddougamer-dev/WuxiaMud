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
import { hunt, canHunt, huntCharges, travel } from '../src/core/hunt.ts'
import { openSession } from '../src/core/progress.ts'
import { choose, encounter } from '../src/core/encounters.ts'
import { refine, canRefine, refineCost, levelOf, MASTERY_MAX } from '../src/core/mastery.ts'
import { GROUNDS, ground, openAt, quarryOf } from '../src/core/grounds.ts'
import { bottleneckAt, canBreakGate, breakGate, checklist, gateOpen } from '../src/core/bottlenecks.ts'
import { MERIDIANS, unlocked } from '../src/core/meridians.ts'
import { newPlayer, type PlayerState } from '../src/core/state.ts'
import { TECHNIQUES, slotsAt, schoolClash, technique, upkeepOf } from '../src/core/techniques.ts'
import { BEASTS } from '../src/core/beasts.ts'
import { V1_CEILING } from '../src/core/realms.ts'
import { canPay, MATERIAL_FOR_RANK, count, type MaterialId } from '../src/core/materials.ts'
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
  travels: number
  beastsSeen: number
  encounters: number
  refines: number
  masteryTotal: number
  insightLeft: number
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
  return Math.min(0.82, o.base + SURPLUS_CAP + modifiers(s).odds - 0.04)
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

/**
 * The material the next thing you want is short of, or null when nothing is blocked.
 *
 * This is what makes the ground picker a decision rather than a ladder: the deepest
 * open ground is not always the useful one, because the Lung Channel wants hides and
 * the Ash Slopes are the only place that drops nothing else.
 */
function shortOf(s: PlayerState): MaterialId | null {
  const b = bottleneckAt(s.realm)
  if (b && !gateOpen(s)) {
    for (const [k, v] of Object.entries(b.offering)) {
      if (count(s.satchel, k as MaterialId) < (v ?? 0)) return k as MaterialId
    }
  }
  const next = [...MERIDIANS].sort((a, x) => a.insight - x.insight)
    .find((m) => !s.meridians.includes(m.id) && unlocked(s.meridians, m) && s.realm >= m.realm)
  if (next) {
    for (const [k, v] of Object.entries(next.mats)) {
      if (count(s.satchel, k as MaterialId) < (v ?? 0)) return k as MaterialId
    }
  }
  return null
}

/**
 * Where a competent player goes. Deepest ground they can pay for in calm — unless
 * something they need only drops somewhere shallower, in which case they go there.
 */
function chooseGround(s: PlayerState): string {
  const open = GROUNDS.filter((g) => openAt(g, s.realm))
  if (!open.length) return s.ground

  // With a tribulation or a quiet gate waiting, there is exactly one right answer:
  // the ground that costs nothing. Not hunting at all was the first draft's answer and
  // it cost the Sword Path half its hunts — one session a day means a day skipped is a
  // day's charges gone, and charges do not bank past four.
  if (wantsQuiet(s) !== null) return open[0].id

  // Four hunts a day is the cap, so four trips is the honest unit of a budget.
  const budget = Math.max(0, (TURMOIL_FREE - s.turmoil) / 4)
  const affordable = open.filter((g) => g.danger <= budget)
  const pool = affordable.length ? affordable : [open[0]]

  // What you need beats what is comfortable. When a gate or the next meridian is
  // short of a material, go to the *shallowest* ground that drops it — even over
  // budget, because turmoil can be settled and a missing essence cannot be waited out.
  const need = shortOf(s)
  if (need) {
    const drops = open.filter((g) => quarryOf(g).some((b) => MATERIAL_FOR_RANK[b.rank] === need))
    if (drops.length) return drops[0].id
  }
  return pool[pool.length - 1].id
}

/**
 * How good a state looks, in one number, so an encounter can be answered by weighing
 * its options rather than by matching their wording.
 *
 * Everything is converted into seconds of gathering, which is the only unit the whole
 * game shares. It is crude, and it is a great deal better than reading the labels.
 */
function worth(s: PlayerState, now: number): number {
  const rate = Math.max(1e-6, ratePerSecond(s, now))
  return s.qi / rate
    + s.insight * 60
    + count(s.satchel, 'hide') * 90
    + count(s.satchel, 'core') * 400
    + count(s.satchel, 'essence') * 1400
    + held(s.pills, 'settling') * 300
    + held(s.pills, 'tribulation') * 900
    - s.turmoil * 260
    - Math.max(0, s.injuredUntil - now) / 1000 * 0.4
    + huntCharges(s, now) * 700
}

/** Answer whatever was waiting, by trying every option and keeping the best. */
function answer(s: PlayerState, now: number, roll: () => number, tally: Run): PlayerState {
  const e = s.encounter ? encounter(s.encounter) : null
  if (!e) return s
  let best = -Infinity
  let bestIndex = e.options.length - 1
  for (let i = 0; i < e.options.length; i++) {
    const o = e.options[i]
    if (!o.can(s)) continue
    // Both faces of a gamble, averaged: a competent player knows the odds are there
    // without knowing which way this one falls.
    const v = (worth(o.take(s, 0.1).state, now) + worth(o.take(s, 0.9).state, now)) / 2
    if (v > best) { best = v; bestIndex = i }
  }
  tally.encounters++
  return choose(s, bestIndex, now, roll()).state
}

/** What a competent player does with a minute and a half, in priority order. */
function play(s: PlayerState, now: number, roll: () => number, tally: Run): PlayerState {
  const slots = slotsAt(s.realm)

  // 0. Whatever happened while you were away is answered before anything else — the
  //    modal is in the way on the real screen too.
  s = answer(s, now, roll, tally)

  //    Then the heavens, while the heart is still quiet from the night.
  s = faceIt(s, now, roll, tally)
  if (s.settling && wantsQuiet(s) === null) s = toggleSettle(s)

  // Then decide where to stand before deciding whether to hunt.
  const where = chooseGround(s)
  if (where !== s.ground) { s = travel(s, where); tally.travels++ }

  // 1. Hunt out the charges first. Insight and materials are what everything below
  //    spends, and a hunt now costs five minutes of gathering rather than a fifth of
  //    the bank, so there is no longer a reason to hold them back.
  //    Whether to hunt at all is decided once, before the first one. Charges are
  //    capped at four and a day makes exactly four, so a charge not spent today is a
  //    charge lost — stopping halfway through is the worst of both. The first draft
  //    broke out of this loop the moment the heart got loud, which quietly halved the
  //    Sword Path: one session a day meant one hunt a day, and mastery became a
  //    system only the Blade Path could afford to use.
  if (wantsQuiet(s) === null || ground(s.ground).danger === 0) {
    while (canHunt(s, now) && huntCharges(s, now) > 0) {
      const got = hunt(s, now, roll())
      if (!got) break
      s = got.state
      tally.hunts++
    }
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

  // 5b. Pour what is left into the arts actually being run. Meridians come first —
  //     they are stronger per point — so a reserve is kept for the next one.
  //     The reserve only holds while the meridian is actually within reach — that is,
  //     while insight is the *only* thing it is short of. Reserving against a channel
  //     whose materials are nowhere near the satchel means never refining at all,
  //     which is exactly what the first draft did to the Sword Path.
  const nextMeridian = [...MERIDIANS].sort((a, b) => a.insight - b.insight)
    .find((m) => !s.meridians.includes(m.id) && unlocked(s.meridians, m) && s.realm >= m.realm)
  const reserve = nextMeridian && canPay(s.satchel, nextMeridian.mats) ? nextMeridian.insight : 0
  for (;;) {
    const pick = s.equipped
      .filter((id) => canRefine(s, id) && levelOf(s.mastery, id) < MASTERY_MAX)
      .map((id) => [id, refineCost(technique(id)!, levelOf(s.mastery, id))] as const)
      .filter(([, c]) => s.insight - c >= reserve)
      .sort((a, b) => a[1] - b[1])[0]
    if (!pick) break
    s = refine(s, pick[0])
    tally.refines++
  }

  // 6. Break the bottleneck the moment it will let you. Breaking one can open a
  //    tribulation, which is why the heart is looked at once more below.
  if (canBreakGate(s)) { s = breakGate(s); tally.gates++ }
  const after = wantsQuiet(s)
  if (after !== null && s.turmoil > after && !s.settling) { s = toggleSettle(s); tally.settles++ }

  // 7. And once more, because breaking a gate can open a tribulation that was not
  //    available when this session started.
  return faceIt(s, now, roll, tally)
}

/**
 * Face the tribulation if the odds have stopped improving.
 *
 * This runs *before* the hunt as well as after the gate, and the order is the whole
 * point. With it only at the end, every Sword run parked at Great Vehicle forever:
 * each session opened with clear odds of 89%, spent four charges in The Scar, came
 * back with twelve turmoil, watched the odds fall under the threshold, sat down to
 * settle, and did it again the next day. Nobody would play like that. You face the
 * heavens while your heart is quiet, and then you go hunting.
 */
function faceIt(s: PlayerState, now: number, roll: () => number, tally: Run): PlayerState {
  if (!canBreakThrough(s)) return s
  const o = odds(s)
  const target = attemptTarget(s)
  const plateaued = s.qi >= breakthroughCost(s) * 2 && s.turmoil <= 12 && !s.settling
  if (!(!o.needed || o.total >= target || plateaued)) return s

  if (o.needed && !s.pillPrimed && o.total < 0.9 && held(s.pills, 'tribulation') > 0) {
    s = takePill(s, 'tribulation', now)
  }
  const out = attempt(s, now, roll())
  if (out.succeeded) tally.breakthroughs++
  else tally.failures++
  return out.state
}

function simulate(path: PathId, origin: OriginId, seed: number): Run {
  const start = 1_700_000_000_000
  let s = newPlayer(path, start, { origin, name: 'Sim', seal: '道' })
  const roll = rng(seed)
  const tally: Run = {
    path, origin, days: 0, sessions: 0, breakthroughs: 0, failures: 0,
    hunts: 0, settles: 0, artsLearned: 0, meridians: 0, gates: 0,
    travels: 0, beastsSeen: 0, encounters: 0, refines: 0, masteryTotal: 0,
    insightLeft: 0, activeMinutes: 0, reachedCeiling: false,
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
    s = openSession(s, now, roll())
    s = play(s, now, roll, tally)
    tally.sessions++
    s = { ...s, activeSeconds: s.activeSeconds + SESSION_SECONDS }
    tally.days = Math.ceil(i / perDay)
  }
  tally.beastsSeen = s.seenBeasts.length
  tally.masteryTotal = Object.values(s.mastery).reduce((a: number, b) => a + (b as number), 0)
  tally.insightLeft = Math.round(s.insight)
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
      `\n         ground ${ground(s.ground).name} · meridians ${s.meridians.length}/12` +
      ` · arts ${s.learned.length} · beasts ${s.seenBeasts.length}/${BEASTS.length}` +
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
console.log('path   origin      days  sessions  active  hunts  beasts  merid  arts  mastery  events  insight  done')
console.log('─'.repeat(98))
for (const r of rows) {
  console.log(
    r.path.padEnd(7) + r.origin.padEnd(12) +
    pad(r.days, 4) + pad(r.sessions, 10) + pad(`${(r.activeMinutes / 60).toFixed(1)}h`, 8) +
    pad(r.hunts, 7) + pad(`${r.beastsSeen}/${BEASTS.length}`, 8) +
    pad(r.meridians, 7) + pad(r.artsLearned, 6) + pad(r.masteryTotal, 9) +
    pad(r.encounters, 8) + pad(r.insightLeft, 9) + pad(r.reachedCeiling ? 'yes' : 'NO', 6),
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
