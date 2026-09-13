import { BEASTS } from './beasts.ts'
import { BOTTLENECKS } from './bottlenecks.ts'
import { FLAMES } from './flames.ts'
import { PATTERNS, TEMPER_MAX, pattern } from './forge.ts'
import { GROUNDS, ground, groundOf } from './grounds.ts'
import { MATERIALS, type MaterialId } from './materials.ts'
import { MASTERY_MAX } from './mastery.ts'
import { MERIDIANS, courseOf, meridian } from './meridians.ts'
import { ORIGINS } from './origins.ts'
import { PATHS } from './paths.ts'
import { REALMS, V1_CEILING, realm } from './realms.ts'
import { RELICS, SLOTS, relic } from './relics.ts'
import { TECHNIQUES, slotsAt, technique } from './techniques.ts'
import { WARDENS, warden } from './wardens.ts'
import { SAVE_VERSION, type PlayerState } from './state.ts'

/**
 * 驗 Is this a cultivator anybody could actually have?
 *
 * A note on what this is and is not, because the distinction decides everything built
 * on top of it. **This is not a defence against cheating while the client owns the
 * simulation.** If the phone does the arithmetic, the phone can lie, and no amount of
 * checking on the phone changes that — the checker runs on the same machine as the lie.
 * The only real defence is a server that runs the simulation itself, which is what the
 * pure core, the injected clock and the actions-as-data design exist to make possible.
 *
 * What this *is*, and why it is worth having now:
 *
 *   It is what that server will run. Every score a ranking accepts has to be checked
 *   against the rules, and these are the rules. Written now, against the live data, it
 *   cannot drift from the game the way a checker written later always does.
 *   It refuses an edited backup today. The one door through which a hand-written state
 *   can walk into the game is a restore, and that door now asks questions.
 *   It catches our own bugs. Every invariant here is something a correct game already
 *   guarantees, so a fault is a bug in the engine before it is a cheat.
 *
 * Two severities, and keeping them apart matters. A **fault** is a state the rules make
 * unreachable — an art from a realm you have not seen, a relic from a warden you have
 * not beaten, a ninth realm reached in a week. Those are refused. A **suspicion** is
 * merely improbable: a great deal of qi, a satchel deeper than the hunts could fill.
 * Those are reported and allowed, because an idle game's honest edge cases look strange
 * and refusing a real player their save is far worse than letting a liar onto a board.
 */
export interface Fault {
  readonly code: string
  /** Plain enough to show a player whose own save was refused. */
  readonly says: string
}

export interface Verdict {
  readonly ok: boolean
  readonly faults: Fault[]
  readonly suspicions: Fault[]
}

/**
 * A generosity that will never accuse an honest player.
 *
 * The best loadout in the game reaches a rate multiplier somewhere near three, and both
 * path curves peak below one. Ten is far outside anything reachable, so a run faster
 * than this floor is not a lucky player — it is arithmetic that never happened.
 */
const IMPOSSIBLY_FAST = 10

/** The least wall-clock time in which realm `id` could conceivably be reached. */
export function earliestSeconds(id: number): number {
  let total = 0
  for (let r = 1; r < Math.min(id, V1_CEILING); r++) {
    const x = realm(r)
    if (!Number.isFinite(x.cost)) continue
    total += x.cost / (x.rate * IMPOSSIBLY_FAST)
  }
  return total
}

const isCount = (n: unknown): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n >= 0 && Number.isInteger(n)
const isNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n)

/**
 * Check a state against every rule the game enforces while playing.
 *
 * `now` is the caller's clock, as everywhere else in core, so a server checks against
 * its own time rather than against anything the client claimed.
 */
export function verify(s: PlayerState, now: number): Verdict {
  const faults: Fault[] = []
  const suspicions: Fault[] = []
  const bad = (code: string, says: string) => faults.push({ code, says })
  const odd = (code: string, says: string) => suspicions.push({ code, says })

  /* ---- shape. Anything failing here is not a save, it is a document. ---- */
  if (s.version !== SAVE_VERSION) bad('version', `This save is version ${s.version}; the game is on ${SAVE_VERSION}.`)
  if (!Number.isInteger(s.realm) || s.realm < 1 || s.realm > REALMS.length) {
    bad('realm', `There is no realm ${s.realm}.`)
  }
  if (!isNum(s.qi) || s.qi < 0) bad('qi', 'The qi is not a number a cultivator can hold.')
  if (!isNum(s.insight) || s.insight < 0) bad('insight', 'The insight is not a number.')
  if (!isNum(s.turmoil) || s.turmoil < 0 || s.turmoil > 100) bad('turmoil', 'The heart demon sits outside 0 and 100.')
  if (!isCount(s.generation) || s.generation < 1) bad('generation', 'A generation starts at one.')
  if (!isCount(s.totalBreakthroughs)) bad('breakthroughs', 'The breakthrough count is not a whole number.')
  for (const [k, v] of [['createdAt', s.createdAt], ['lastSeenAt', s.lastSeenAt],
                        ['lastBreakthroughAt', s.lastBreakthroughAt]] as const) {
    if (!isNum(v) || v < 0) bad('clock', `The ${k} timestamp is not a time.`)
  }
  if (isNum(s.createdAt) && s.createdAt > now + 60_000) bad('future', 'This cultivator was born in the future.')

  /* ---- names. Every id has to be one the game defines. ---- */
  if (!(s.path in PATHS)) bad('path', `There is no path called ${String(s.path)}.`)
  if (!ORIGINS.some((o) => o.id === s.origin)) bad('origin', `There is no origin called ${String(s.origin)}.`)
  if (s.flame !== null && !FLAMES.some((f) => f.id === s.flame)) bad('flame', 'That flame does not exist.')
  if (!GROUNDS.some((g) => g.id === s.ground)) bad('ground', 'That hunting ground does not exist.')
  for (const id of s.learned) if (!technique(id)) bad('art', `There is no art called ${id}.`)
  for (const id of s.seenBeasts) if (!BEASTS.some((b) => b.id === id)) bad('beast', `There is no beast called ${id}.`)
  for (const id of s.meridians) if (!meridian(id)) bad('meridian', `There is no meridian called ${id}.`)
  for (const id of s.relics) if (!relic(id)) bad('relic', `There is no relic called ${id}.`)
  for (const id of s.wardens) if (!warden(id)) bad('warden', `There is no warden called ${id}.`)
  for (const id of Object.keys(s.forged)) if (!pattern(id)) bad('pattern', `There is no forge pattern called ${id}.`)
  for (const id of Object.keys(s.mastery)) if (!technique(id)) bad('mastery', `There is no art called ${id} to refine.`)

  /* ---- no duplicates. A list that repeats itself has been edited by hand. ---- */
  for (const [name, list] of [['arts', s.learned], ['beasts', s.seenBeasts], ['meridians', s.meridians],
                              ['relics', s.relics], ['wardens', s.wardens], ['equipped', s.equipped]] as const) {
    if (new Set(list).size !== list.length) bad('twice', `The same ${name.slice(0, -1)} is listed twice.`)
  }

  /* ---- the rules of the game, which are the interesting half. ---- */
  const slots = slotsAt(s.realm)
  if (s.equipped.length > slots) bad('slots', `${s.equipped.length} arts are equipped; realm ${s.realm} has ${slots} slots.`)
  for (const id of s.equipped) if (!s.learned.includes(id)) bad('unlearned', `${id} is equipped but was never learned.`)
  const schools = s.equipped.map((id) => technique(id)?.school).filter(Boolean)
  if (new Set(schools).size !== schools.length) bad('clash', 'Two equipped arts come from the same school.')
  for (const id of s.learned) {
    const t = technique(id)
    if (t && t.realm > s.realm) bad('artrealm', `${t.name} is not taught before realm ${t.realm}.`)
  }
  for (const [id, lv] of Object.entries(s.mastery)) {
    if (!isCount(lv) || lv > MASTERY_MAX) bad('refine', `${id} is refined to ${lv}; the ceiling is ${MASTERY_MAX}.`)
    if (!s.learned.includes(id)) bad('refineunlearned', `${id} is refined but was never learned.`)
  }

  for (const id of s.meridians) {
    const m = meridian(id)
    if (!m) continue
    if (m.realm > s.realm) bad('merrealm', `The ${m.name} does not open before realm ${m.realm}.`)
    const before = courseOf(m.course).filter((x) => x.step < m.step)
    for (const b of before) {
      if (!s.meridians.includes(b.id)) bad('merorder', `The ${m.name} is open but the ${b.name} before it is not.`)
    }
  }

  for (const [id, lv] of Object.entries(s.forged)) {
    const p = pattern(id)
    if (!p) continue
    if (!isCount(lv) || lv > TEMPER_MAX) bad('temper', `${p.name} is at level ${lv}; the ceiling is ${TEMPER_MAX}.`)
    if (lv > 0 && p.realm > s.realm) bad('patternrealm', `${p.name} is not known before realm ${p.realm}.`)
  }

  for (const g of s.gates) {
    if (!BOTTLENECKS.some((b) => b.realm === g)) bad('gate', `There is no bottleneck at realm ${g}.`)
    if (g > s.realm) bad('gateahead', `The gate at realm ${g} is broken, but this cultivator is at ${s.realm}.`)
  }

  for (const id of s.wardens) {
    const w = warden(id)
    if (!w) continue
    const g = ground(w.ground)
    if (g.realm > s.realm) bad('wardenrealm', `${w.name} sits in a ground that opens at realm ${g.realm}.`)
    for (const b of g.beasts) {
      if (!s.seenBeasts.includes(b)) bad('wardenunseen', `${w.name} was beaten without recording everything in its ground.`)
    }
  }
  for (const id of s.relics) {
    const r = relic(id)
    if (r && !s.wardens.includes(r.from)) bad('relicsource', `${r.name} only comes off a warden that has not been beaten.`)
  }

  for (const id of s.seenBeasts) {
    const g = groundOf(id)
    if (g && g.realm > s.realm) bad('beastrealm', `A beast was recorded in a ground that opens at realm ${g.realm}.`)
  }
  const here = GROUNDS.find((g) => g.id === s.ground)
  if (here && here.realm > s.realm) bad('standing', `Standing in ${here.name}, which opens at realm ${here.realm}.`)

  for (const slot of SLOTS) {
    const id = s.wearing[slot]
    if (id === null || id === undefined) continue
    const r = relic(id)
    const p = pattern(id)
    if (r) {
      if (r.slot !== slot) bad('wornslot', `${r.name} is not worn in the ${slot} slot.`)
      if (!s.relics.includes(id)) bad('wornunowned', `${r.name} is worn but was never taken.`)
    } else if (p) {
      if (p.slot !== slot) bad('wornslot', `${p.name} is not worn in the ${slot} slot.`)
      if (!(s.forged[id] > 0)) bad('wornunforged', `${p.name} is worn but was never forged.`)
    } else {
      bad('wornunknown', `Something called ${id} is being worn and does not exist.`)
    }
  }

  for (const m of MATERIALS) {
    const n = s.satchel[m.id as MaterialId]
    if (n !== undefined && !isCount(n)) bad('satchel', `The ${m.name} count is not a whole number.`)
  }

  if (isCount(s.totalBreakthroughs) && Number.isInteger(s.realm) && s.totalBreakthroughs < s.realm - 1) {
    bad('climb', `Realm ${s.realm} takes ${s.realm - 1} breakthroughs; only ${s.totalBreakthroughs} are recorded.`)
  }

  /* ---- time. The one check a ranking cannot do without. ---- */
  if (isNum(s.createdAt) && Number.isInteger(s.realm)) {
    const lived = (now - s.createdAt) / 1000
    const least = earliestSeconds(s.realm)
    if (lived < least) {
      bad('toofast', `Realm ${s.realm} cannot be reached in under ${Math.round(least / 86_400)} days; this one claims ${Math.round(lived / 86_400)}.`)
    }
  }

  /* ---- and the things that are merely strange. ---- */
  if (isNum(s.qi) && Number.isInteger(s.realm) && s.realm < V1_CEILING) {
    const cost = realm(s.realm).cost
    if (Number.isFinite(cost) && s.qi > cost * 20) {
      odd('hoard', `Holding ${Math.round(s.qi / cost)}× what this realm costs.`)
    }
  }
  const carried = MATERIALS.reduce((n, m) => n + (s.satchel[m.id as MaterialId] ?? 0), 0)
  if (carried > 4000) odd('satcheldeep', `Carrying ${carried} materials.`)
  if (isNum(s.insight) && s.insight > 60_000) odd('insighthoard', `Holding ${Math.round(s.insight)} unspent insight.`)
  if (s.learned.length > TECHNIQUES.length) odd('arts', 'More arts than the game has.')
  if (s.wardens.length > WARDENS.length) odd('wardens', 'More wardens than the game has.')
  if (s.relics.length > RELICS.length) odd('relics', 'More relics than the game has.')
  if (s.meridians.length > MERIDIANS.length) odd('meridians', 'More meridians than the game has.')
  if (s.forged && Object.keys(s.forged).length > PATTERNS.length) odd('patterns', 'More patterns than the game has.')

  return { ok: faults.length === 0, faults, suspicions }
}

/** One line, for a player whose own save was just refused. */
export function why(v: Verdict): string {
  if (v.ok) return ''
  const first = v.faults[0]
  return v.faults.length === 1
    ? first.says
    : `${first.says} (and ${v.faults.length - 1} other ${v.faults.length === 2 ? 'problem' : 'problems'}.)`
}
