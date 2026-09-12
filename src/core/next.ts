import { GROUNDS, ground, quarryOf, openAt } from './grounds.ts'
import { MATERIALS, MATERIAL_FOR_RANK, count, type MaterialId } from './materials.ts'
import { bottleneckAt, canBreakGate, checklist, passed } from './bottlenecks.ts'
import { canBreakThrough, heldAtGate, breakthroughCost, ratePerSecond, meridiansAt, TURMOIL_FREE } from './progress.ts'
import { canHunt, huntCharges, maxCharges, trailAt } from './hunt.ts'
import { canChallenge, wardenOf } from './wardens.ts'
import { PATTERNS, canTemper, levelOf, temperCost, TEMPER_MAX } from './forge.ts'
import { refineCost, levelOf as masteryOf, MASTERY_MAX } from './mastery.ts'
import { TECHNIQUES, technique, type Technique } from './techniques.ts'
import { V1_CEILING } from './realms.ts'
import type { PlayerState } from './state.ts'

/**
 * 指路 One sentence saying what to do next, and which screen to do it on.
 *
 * This exists because of a screenshot. A player at Nascent Soul was looking at a
 * bottleneck row that read "Offer Spirit Core 0 / 3" and had no way to find out, from
 * anywhere in the game, that a spirit core comes off a rank-two beast, that the
 * shallowest place one lives is the Reed Marsh, or that the Reed Marsh had been open
 * to them since the second realm. Every screen in the game was a status report and not
 * one of them was an instruction, so the honest summary of the whole interface was
 * "all of this is very confusing".
 *
 * A game may be hard to master. It must never be hard to *read*. Everything below is
 * derived from state the player can already see — nothing here is a hint system with
 * private knowledge — and the point is only that the derivation is done for them
 * rather than left as an exercise.
 *
 * Order matters more than coverage. The list is the order a competent player would
 * actually work in, so the top line is the one thing most worth doing at this instant,
 * and the rest wait their turn quietly instead of shouting at once.
 */
export type Where = 'cultivate' | 'body' | 'arts' | 'gear' | 'hunt' | 'lineage'

export interface Step {
  /** The instruction, in the imperative, short enough for one line on a phone. */
  readonly say: string
  /** Why — the number or the fact behind it. Never more than a sentence. */
  readonly why: string
  readonly where: Where
  /** True when this is progress rather than upkeep, so the UI can light it. */
  readonly urgent: boolean
}

/**
 * Where to go for this material, right now.
 *
 * A ground whose trail is standing on the thing you need beats one that merely could
 * drop it in principle, because what is on the trail is what you will find. Only when
 * nothing open has it up does this fall back to the shallowest ground that carries it
 * at all — which is the honest answer to "then where, eventually".
 */
export function sourceOf(s: PlayerState, mat: MaterialId, now?: number): { ground: string; beast: string } | null {
  const open = GROUNDS.filter((g) => openAt(g, s.realm))
  if (now !== undefined) {
    const up = open.find((g) => {
      const b = trailAt(g.id, now)
      return b && MATERIAL_FOR_RANK[b.rank] === mat
    })
    if (up) return { ground: up.id, beast: trailAt(up.id, now)!.id }
  }
  for (const g of open) {
    const b = quarryOf(g).find((x) => MATERIAL_FOR_RANK[x.rank] === mat)
    if (b) return { ground: g.id, beast: b.id }
  }
  return null
}

/** The shallowest ground that drops it at all, open or not — for "not yet, and why". */
export function eventualSourceOf(mat: MaterialId): { ground: string; beast: string } | null {
  for (const g of GROUNDS) {
    const b = quarryOf(g).find((x) => MATERIAL_FOR_RANK[x.rank] === mat)
    if (b) return { ground: g.id, beast: b.id }
  }
  return null
}

function materialName(id: string): string {
  return MATERIALS.find((m) => m.id === id)?.name ?? id
}

/** Where a missing material comes from, said as a place and a beast. */
function huntFor(s: PlayerState, mat: MaterialId, short: number, now: number): Step {
  const here = sourceOf(s, mat, now)
  const name = materialName(mat)
  if (here) {
    const g = ground(here.ground)
    const b = quarryOf(g).find((x) => x.id === here.beast)!
    const onTrail = trailAt(g.id, now)?.id === b.id
    const where = here.ground === s.ground ? 'You are standing in it.' : `Travel to ${g.name}.`
    return {
      say: `Hunt ${short} more ${name}`,
      why: onTrail
        ? `${b.name} is on the trail in ${g.name} and drops it. ${where}`
        : `${b.name} drops it in ${g.name}. ${where}`,
      where: 'hunt', urgent: true,
    }
  }
  const later = eventualSourceOf(mat)
  const g = later ? ground(later.ground) : null
  return {
    say: `${name} is out of reach`,
    why: g ? `It drops in ${g.name}, which opens at realm ${g.realm}. Keep climbing.` : 'Keep climbing.',
    where: 'cultivate', urgent: false,
  }
}

/**
 * What to do now. Always returns something — a game that answers "nothing" has told
 * the player to close it, which for an idle game is the one sentence it must not say.
 */
export function nextStep(s: PlayerState, now: number): Step {
  const b = bottleneckAt(s.realm)

  // 1. The tribulation is open. Nothing outranks it.
  if (canBreakThrough(s)) {
    return { say: 'Face the tribulation', why: `You have the qi and the gate is open.`, where: 'cultivate', urgent: true }
  }

  // 2. The gate is standing between you and a realm you can already afford.
  if (b && !passed(s, s.realm)) {
    if (canBreakGate(s)) {
      return { say: `Break ${b.name}`, why: 'Everything it asks for is in hand.', where: 'cultivate', urgent: true }
    }
    // Deliberately not gated on how much qi is banked. A gate asking for three spirit
    // cores is days of hunting in a ground you may not be standing in, while the qi
    // accrues on its own whether you are told about it or not — so the gate is the
    // thing worth saying from the moment the realm opens, not at the end of the bar.
    const rows = checklist(s, b)
    const missing = rows.filter((r) => !r.ok)
    if (missing.length > 0) {
      const m = missing[0]
      // An offering is the one requirement with an address, so say the address.
      const mat = Object.keys(b.offering).find((k) => m.label === `Offer ${materialName(k)}`)
      if (mat) return huntFor(s, mat as MaterialId, m.need - m.have, now)
      if (m.label === 'Heart demon') {
        return { say: 'Settle the heart', why: `${b.name} wants it at ${m.need} or below. It is at ${m.have}.`, where: 'cultivate', urgent: true }
      }
      if (m.label === 'Arts learned') {
        return { say: `Learn ${m.need - m.have} more art${m.need - m.have > 1 ? 's' : ''}`, why: `${b.name} asks for ${m.need}. You know ${m.have}.`, where: 'arts', urgent: true }
      }
      if (m.label === 'Meridians opened') {
        return { say: `Open ${m.need - m.have} more meridian${m.need - m.have > 1 ? 's' : ''}`, why: `${b.name} asks for ${m.need}. You have ${m.have}.`, where: 'body', urgent: true }
      }
      if (m.label === 'Beasts recorded') {
        return { say: `Record ${m.need - m.have} more beast${m.need - m.have > 1 ? 's' : ''}`, why: `${b.name} asks for ${m.need}. Deeper grounds hold ones you have not met.`, where: 'hunt', urgent: true }
      }
    }
  }

  // 3. An unquiet heart is costing you generation right now, not hypothetically.
  if (s.turmoil > TURMOIL_FREE && !s.settling) {
    return { say: 'Settle the heart', why: `Above ${TURMOIL_FREE} it is taking qi off every second.`, where: 'cultivate', urgent: true }
  }

  // 4. A warden is a day's decision and the best one available when it is available.
  const w = wardenOf(s.ground)
  if (w && canChallenge(s, w, huntCharges(s, now)) && !s.wardens.includes(w.id)) {
    return { say: `Challenge ${w.name}`, why: 'Three charges and it drops its relic once.', where: 'hunt', urgent: true }
  }

  // 5. Charges are a wasting asset: at the cap, the next one to arrive is thrown away.
  const charges = huntCharges(s, now)
  if (charges >= maxCharges(s) && canHunt(s, now)) {
    const t = trailAt(s.ground, now)
    return {
      say: 'Hunt — charges are full',
      why: t ? `${t.name} is on the trail in ${ground(s.ground).name}. Charges past the cap are lost.`
             : 'Charges past the cap are lost.',
      where: 'hunt', urgent: true,
    }
  }

  // 6. Materials you are sitting on are power you have not taken.
  const temperable = PATTERNS.filter((p) => canTemper(s, p.id))
  if (temperable.length > 0) {
    const best = temperable.sort((x, y) => levelOf(s.forged, y.id) - levelOf(s.forged, x.id))[0]
    const lv = levelOf(s.forged, best.id)
    return {
      say: lv === 0 ? `Forge the ${best.name}` : `Temper the ${best.name} to ${lv + 1}`,
      why: `The satchel already holds what it asks for. Nine levels is the ceiling.`,
      where: 'gear', urgent: true,
    }
  }

  // 7. Insight sitting unspent is the same mistake in the other currency.
  const mer = meridiansAt(s).find((m) => !m.open && m.reachable && m.affordable && m.realmReady)
  if (mer) {
    return { say: `Open the ${mer.meridian.name}`, why: `${mer.meridian.text}. Permanent, and it cannot be undone.`, where: 'body', urgent: true }
  }
  const canLearn = pickLearnable(s)
  if (canLearn) {
    return { say: `Learn ${canLearn.name}`, why: `${canLearn.text}, for ${canLearn.cost} insight.`, where: 'arts', urgent: true }
  }
  const refinable = s.equipped.find((id) => {
    const t = technique(id)
    return t && masteryOf(s.mastery, id) < MASTERY_MAX && s.insight >= refineCost(t, masteryOf(s.mastery, id))
  })
  if (refinable) {
    const t = technique(refinable)!
    return { say: `Refine ${t.name}`, why: 'Refining raises what an art gives and never what it costs.', where: 'arts', urgent: false }
  }

  // 8. Nothing to press. Say what is actually happening and when it changes.
  if (s.realm >= V1_CEILING) {
    return { say: 'Seal the line', why: 'The ninth realm is the ceiling. What you pass on decides the next life.', where: 'lineage', urgent: true }
  }
  const rate = ratePerSecond(s, now)
  const left = Math.max(0, breakthroughCost(s) - s.qi)
  const hours = rate > 0 ? left / rate / 3600 : Infinity
  const when = hours < 1 ? `${Math.ceil(hours * 60)} minutes` : hours < 48 ? `${Math.round(hours)} hours` : `${Math.round(hours / 24)} days`
  return {
    say: 'Cultivate. Nothing is waiting on you',
    why: Number.isFinite(hours) ? `The next tribulation is about ${when} of gathering away.` : 'Gathering.',
    where: 'cultivate', urgent: false,
  }
}

/**
 * The dearest art you can afford and have not learned. Dearest rather than cheapest:
 * insight is worth the most when it is spent on the thing you have only just become
 * able to spend it on.
 */
function pickLearnable(s: PlayerState): Technique | null {
  let best: Technique | null = null
  for (const t of TECHNIQUES) {
    if (t.realm > s.realm || s.learned.includes(t.id) || t.cost > s.insight) continue
    if (!best || t.cost > best.cost) best = t
  }
  return best
}

/** Everything worth doing, for a screen that wants a list rather than one line. */
export function agenda(s: PlayerState, now: number): Step[] {
  const out: Step[] = [nextStep(s, now)]
  const charges = huntCharges(s, now)
  if (!out.some((x) => x.where === 'hunt') && charges > 0 && canHunt(s, now)) {
    const t = trailAt(s.ground, now)
    out.push({
      say: `${charges} hunt${charges > 1 ? 's' : ''} banked`,
      why: t ? `${t.name} is on the trail in ${ground(s.ground).name}.` : `In ${ground(s.ground).name}.`,
      where: 'hunt', urgent: false,
    })
  }
  const unfinished = PATTERNS.filter((p) => s.realm >= p.realm && levelOf(s.forged, p.id) < TEMPER_MAX)
  if (!out.some((x) => x.where === 'gear') && unfinished.length > 0) {
    const p = unfinished[0]
    const lv = levelOf(s.forged, p.id)
    const need = temperCost(p, lv)[p.mat] ?? 0
    out.push({
      say: lv === 0 ? `${p.name} not forged yet` : `${p.name} is at ${lv} of ${TEMPER_MAX}`,
      why: `Needs ${need} ${materialName(p.mat)}. You have ${count(s.satchel, p.mat)}.`,
      where: 'gear', urgent: false,
    })
  }
  return out
}

/** Whether the gate, rather than the qi, is what is holding this realm shut. */
export function stuckAtGate(s: PlayerState): boolean {
  return heldAtGate(s)
}
