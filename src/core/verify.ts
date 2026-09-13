import { ANCESTOR_BONUS_CAP, ASCEND_REALM, type Ancestor } from './ancestry.ts'
import { BEASTS } from './beasts.ts'
import { BOTTLENECKS } from './bottlenecks.ts'
import { FLAMES } from './flames.ts'
import { PATTERNS, TEMPER_MAX, pattern } from './forge.ts'
import { GROUNDS, ground, groundOf } from './grounds.ts'
import { MATERIALS } from './materials.ts'
import { MASTERY_MAX } from './mastery.ts'
import { MERIDIANS, courseOf, meridian } from './meridians.ts'
import { flame } from './flames.ts'
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

  /**
   * Nothing below may throw. A state hand-written badly enough to be missing a list
   * entirely used to crash this function on `for (const id of s.learned)`, and a
   * checker that crashes instead of refusing is a checker whose caller has to decide
   * what a crash means — which is a way around it. Missing is a fault, like anything
   * else that is not a cultivator.
   */
  const list = (v: unknown, name: string): readonly string[] => {
    if (Array.isArray(v) && v.every((x) => typeof x === 'string')) return v as string[]
    bad('shape', `The ${name} are missing or are not a list of names.`)
    return []
  }
  const learned = list(s.learned, 'learned arts')
  const equipped = list(s.equipped, 'equipped arts')
  const seenBeasts = list(s.seenBeasts, 'recorded beasts')
  const meridians = list(s.meridians, 'meridians')
  const relics = list(s.relics, 'relics')
  const wardens = list(s.wardens, 'wardens')
  const gates = Array.isArray(s.gates) ? s.gates : (bad('shape', 'The gates are missing.'), [])
  const forged = (s.forged && typeof s.forged === 'object') ? s.forged
    : (bad('shape', 'The forge record is missing.'), {} as Record<string, number>)
  const mastery = (s.mastery && typeof s.mastery === 'object') ? s.mastery
    : (bad('shape', 'The mastery record is missing.'), {} as Record<string, number>)
  const satchel = (s.satchel && typeof s.satchel === 'object') ? s.satchel : {}
  const wearing = (s.wearing && typeof s.wearing === 'object') ? s.wearing
    : (bad('shape', 'The worn slots are missing.'), {} as Record<string, string | null>)

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
  for (const id of learned) if (!technique(id)) bad('art', `There is no art called ${id}.`)
  for (const id of seenBeasts) if (!BEASTS.some((b) => b.id === id)) bad('beast', `There is no beast called ${id}.`)
  for (const id of meridians) if (!meridian(id)) bad('meridian', `There is no meridian called ${id}.`)
  for (const id of relics) if (!relic(id)) bad('relic', `There is no relic called ${id}.`)
  for (const id of wardens) if (!warden(id)) bad('warden', `There is no warden called ${id}.`)
  for (const id of Object.keys(forged)) if (!pattern(id)) bad('pattern', `There is no forge pattern called ${id}.`)
  for (const id of Object.keys(mastery)) if (!technique(id)) bad('mastery', `There is no art called ${id} to refine.`)

  /* ---- no duplicates. A list that repeats itself has been edited by hand. ---- */
  for (const [name, list] of [['arts', learned], ['beasts', seenBeasts], ['meridians', meridians],
                              ['relics', relics], ['wardens', wardens], ['equipped', equipped]] as const) {
    if (new Set(list).size !== list.length) bad('twice', `The same ${name.slice(0, -1)} is listed twice.`)
  }

  /* ---- the rules of the game, which are the interesting half. ---- */
  const slots = slotsAt(s.realm)
  if (equipped.length > slots) bad('slots', `${equipped.length} arts are equipped; realm ${s.realm} has ${slots} slots.`)
  for (const id of equipped) if (!learned.includes(id)) bad('unlearned', `${id} is equipped but was never learned.`)
  const schools = equipped.map((id) => technique(id)?.school).filter(Boolean)
  if (new Set(schools).size !== schools.length) bad('clash', 'Two equipped arts come from the same school.')
  for (const id of learned) {
    const t = technique(id)
    if (t && t.realm > s.realm) bad('artrealm', `${t.name} is not taught before realm ${t.realm}.`)
  }
  for (const [id, lv] of Object.entries(mastery)) {
    if (!isCount(lv) || lv > MASTERY_MAX) bad('refine', `${id} is refined to ${lv}; the ceiling is ${MASTERY_MAX}.`)
    if (!learned.includes(id)) bad('refineunlearned', `${id} is refined but was never learned.`)
  }

  for (const id of meridians) {
    const m = meridian(id)
    if (!m) continue
    if (m.realm > s.realm) bad('merrealm', `The ${m.name} does not open before realm ${m.realm}.`)
    const before = courseOf(m.course).filter((x) => x.step < m.step)
    for (const b of before) {
      if (!meridians.includes(b.id)) bad('merorder', `The ${m.name} is open but the ${b.name} before it is not.`)
    }
  }

  for (const [id, lv] of Object.entries(forged)) {
    const p = pattern(id)
    if (!p) continue
    if (!isCount(lv) || lv > TEMPER_MAX) bad('temper', `${p.name} is at level ${lv}; the ceiling is ${TEMPER_MAX}.`)
    if (lv > 0 && p.realm > s.realm) bad('patternrealm', `${p.name} is not known before realm ${p.realm}.`)
  }

  for (const g of gates) {
    if (!BOTTLENECKS.some((b) => b.realm === g)) bad('gate', `There is no bottleneck at realm ${g}.`)
    if (g > s.realm) bad('gateahead', `The gate at realm ${g} is broken, but this cultivator is at ${s.realm}.`)
  }

  for (const id of wardens) {
    const w = warden(id)
    if (!w) continue
    const g = ground(w.ground)
    if (g.realm > s.realm) bad('wardenrealm', `${w.name} sits in a ground that opens at realm ${g.realm}.`)
    for (const b of g.beasts) {
      if (!seenBeasts.includes(b)) bad('wardenunseen', `${w.name} was beaten without recording everything in its ground.`)
    }
  }
  for (const id of relics) {
    const r = relic(id)
    if (r && !wardens.includes(r.from)) bad('relicsource', `${r.name} only comes off a warden that has not been beaten.`)
  }

  for (const id of seenBeasts) {
    const g = groundOf(id)
    if (g && g.realm > s.realm) bad('beastrealm', `A beast was recorded in a ground that opens at realm ${g.realm}.`)
  }
  const here = GROUNDS.find((g) => g.id === s.ground)
  if (here && here.realm > s.realm) bad('standing', `Standing in ${here.name}, which opens at realm ${here.realm}.`)

  for (const slot of SLOTS) {
    const id = (wearing as Record<string, string | null>)[slot]
    if (id === null || id === undefined) continue
    const r = relic(id)
    const p = pattern(id)
    if (r) {
      if (r.slot !== slot) bad('wornslot', `${r.name} is not worn in the ${slot} slot.`)
      if (!relics.includes(id)) bad('wornunowned', `${r.name} is worn but was never taken.`)
    } else if (p) {
      if (p.slot !== slot) bad('wornslot', `${p.name} is not worn in the ${slot} slot.`)
      if (!((forged as Record<string, number>)[id] > 0)) bad('wornunforged', `${p.name} is worn but was never forged.`)
    } else {
      bad('wornunknown', `Something called ${id} is being worn and does not exist.`)
    }
  }

  for (const m of MATERIALS) {
    const n = (satchel as Record<string, number>)[m.id]
    if (n !== undefined && !isCount(n)) bad('satchel', `The ${m.name} count is not a whole number.`)
  }

  if (isCount(s.totalBreakthroughs) && Number.isInteger(s.realm) && s.totalBreakthroughs < s.realm - 1) {
    bad('climb', `Realm ${s.realm} takes ${s.realm - 1} breakthroughs; only ${s.totalBreakthroughs} are recorded.`)
  }

  /* ---- what the line gave you, which is where the rate multiplier actually lives.
     These two were the hole: verify() checked every id and every count and never
     looked at the two numbers that feed modifiers().rate. A hand-written heirloom
     claiming a mastery of a million passed clean and generated qi two hundred
     thousand times faster than the best legal loadout. ---- */
  if (!isNum(s.lineBonus) || s.lineBonus < 0 || s.lineBonus > ANCESTOR_BONUS_CAP) {
    bad('linebonus', `A line is worth at most ${Math.round(ANCESTOR_BONUS_CAP * 100)}% of generation; this one claims ${isNum(s.lineBonus) ? Math.round(s.lineBonus * 100) : '?'}%.`)
  }
  if (s.inherited !== null && s.inherited !== undefined) {
    const h = s.inherited
    if (typeof h !== 'object') bad('heirloom', 'The inherited art is not an art.')
    else {
      if (!technique(h.techniqueId)) bad('heirloomart', `There is no art called ${String(h.techniqueId)} to inherit.`)
      if (!(h.fromPath in PATHS)) bad('heirloompath', `No forebear walked a path called ${String(h.fromPath)}.`)
      if (!isCount(h.mastery) || h.mastery > MASTERY_MAX) {
        bad('heirloommastery', `An inherited art is refined to ${String(h.mastery)}; the ceiling is ${MASTERY_MAX}.`)
      }
    }
  }
  if (s.flame !== null && s.flame !== undefined) {
    const f = flame(s.flame)
    if (f && f.realm > s.realm) bad('flamerealm', `The ${f.name} is not taken before realm ${f.realm}.`)
  }
  if (isCount(s.generation) && s.generation > 1 && s.lineBonus === 0) {
    odd('lineless', `Generation ${s.generation} with no lineage bonus.`)
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
  const carried = MATERIALS.reduce((n, m) => n + ((satchel as Record<string, number>)[m.id] ?? 0), 0)
  if (carried > 4000) odd('satcheldeep', `Carrying ${carried} materials.`)
  if (isNum(s.insight) && s.insight > 60_000) odd('insighthoard', `Holding ${Math.round(s.insight)} unspent insight.`)
  if (learned.length > TECHNIQUES.length) odd('arts', 'More arts than the game has.')
  if (wardens.length > WARDENS.length) odd('wardens', 'More wardens than the game has.')
  if (relics.length > RELICS.length) odd('relics', 'More relics than the game has.')
  if (meridians.length > MERIDIANS.length) odd('meridians', 'More meridians than the game has.')
  if (Object.keys(forged).length > PATTERNS.length) odd('patterns', 'More patterns than the game has.')

  return { ok: faults.length === 0, faults, suspicions }
}

/**
 * 譜 The forebears that arrived alongside a state.
 *
 * Verified separately because they are restored separately — `saveLine()` writes them
 * straight through — and because they outlive the cultivator: a forged ancestor with an
 * impossible mastery feeds the *next* character's inheritance through the legitimate
 * create path, long after the backup that carried it is forgotten.
 */
export function verifyLine(line: readonly Ancestor[], now: number): Verdict {
  const faults: Fault[] = []
  if (!Array.isArray(line)) return { ok: false, faults: [{ code: 'shape', says: 'The line is not a list of forebears.' }], suspicions: [] }
  const bad = (code: string, says: string) => faults.push({ code, says })

  const seen = new Set<string>()
  for (const a of line) {
    if (!a || typeof a !== 'object') { bad('shape', 'One of the forebears is not a forebear.'); continue }
    const who = typeof a.name === 'string' && a.name ? a.name : 'A forebear'
    if (typeof a.id !== 'string' || !a.id) bad('id', `${who} has no id.`)
    else if (seen.has(a.id)) bad('twice', `${who} appears in the line twice.`)
    else seen.add(a.id)
    if (!technique(a.techniqueId)) bad('art', `${who} sealed an art that does not exist.`)
    if (!(a.path in PATHS)) bad('path', `${who} walked a path that does not exist.`)
    if (!isCount(a.mastery) || a.mastery > MASTERY_MAX) bad('mastery', `${who} sealed an art refined to ${String(a.mastery)}; the ceiling is ${MASTERY_MAX}.`)
    if (!isCount(a.meridians) || a.meridians > MERIDIANS.length) bad('meridians', `${who} opened ${String(a.meridians)} meridians; there are ${MERIDIANS.length}.`)
    if (!isCount(a.realm) || a.realm < ASCEND_REALM || a.realm > REALMS.length) bad('realm', `${who} sealed a line at realm ${String(a.realm)}; sealing begins at ${ASCEND_REALM}.`)
    if (!isCount(a.generation) || a.generation < 1) bad('generation', `${who} has no generation.`)
    if (!isNum(a.ascendedAt) || a.ascendedAt > now + 60_000) bad('clock', `${who} sealed their line in the future.`)
  }
  return { ok: faults.length === 0, faults, suspicions: [] }
}

/** One line, for a player whose own save was just refused. */
export function why(v: Verdict): string {
  if (v.ok) return ''
  const first = v.faults[0]
  return v.faults.length === 1
    ? first.says
    : `${first.says} (and ${v.faults.length - 1} other ${v.faults.length === 2 ? 'problem' : 'problems'}.)`
}
