/**
 * What the Wheel adds up to, and the ONE place each of its effects lands.
 *
 * A passive tree fails in a particular way, and this file is written against
 * that failure: nodes accumulate faster than the code that applies them, and
 * the board fills with text that means nothing because nobody wired the last
 * three. So the effect vocabulary in data/talents.ts is tiny, every kind in it
 * is folded here, and a test walks the whole table asserting that each node
 * moves at least one number. A node that does nothing cannot be written without
 * the suite saying so.
 *
 * Everything is collapsed ONCE, when an expedition starts, into a flat
 * `Boons`. The hot loop reads fields off a struct rather than walking a
 * board of nineteen nodes sixty times a second — the same reason `deriveStats`
 * exists at all.
 */
import { TALENTS, TALENT_BY_ID, type Talent, type Wheel } from '../data/talents'
import { CONDITIONS, type Condition } from '../data/arts'
import type { Conditions } from './conditions'

/** Zero for every posture. Its own helper: `noConditions` returns booleans. */
function noPower(): Record<Condition, number> {
  const out = {} as Record<Condition, number>
  for (const cond of CONDITIONS) out[cond.id] = 0
  return out
}

/**
 * Everything permanent that bends a skill or the sheet.
 *
 * The Wheel fills most of it; the lines on your gear fill `perSkill` (see
 * foldGearSkills in sim/loadout.ts). ONE struct for both, because the
 * simulation asks one question — "what is this skill's cost, rest, duration and
 * power right now" — and answering it from two places is how two sources of the
 * same lever come to disagree.
 */
export interface Boons {
  /**
   * Per-skill lines, keyed by skill id. Only skills a worn piece NAMES appear.
   *
   * A map rather than fields on the skill, because a skill is a table row
   * shared by every save and this is one swordsman's gear.
   */
  perSkill: Map<string, SkillLines>
  /** Whole points added to the 势 pool. */
  maxShi: number
  /** Multiplier on how fast movement fills 势. */
  fill: number
  /** Fraction of the running fill earned while STANDING STILL. Normally 0. */
  stillFill: number
  /** Extra 势 on a hard reversal, beyond the base turn bonus. */
  turnGain: number
  /** Seconds between 转 refunds, or 0 when nothing refunds. */
  refundEvery: number
  /** Added to every skill's 势 cost. Never takes a cost below zero. */
  cost: number
  /** Multiplier on every cooldown. */
  cooldown: number
  /** Multiplier on how long an effect stays live. */
  duration: number
  /** Added to skill power while the named posture holds. */
  power: Record<Condition, number>
  /** Added to skill power at all times. */
  powerAlways: number
  /** Every skill's boost counts as active. Keystone 破围. */
  anyPosture: boolean
  /** Flat armour. */
  armour: number
  /** Multiplier on movement speed. */
  move: number
  /** Multiplier on damage taken. Above 1 is a keystone paying for itself. */
  taken: number
}

/** What one piece's lines add to one named skill. */
export interface SkillLines {
  /** Added to the skill's power, in the skill's own unit. */
  power: number
  /** Added to its 势 cost. Negative is a discount. */
  cost: number
  /** Multiplier on its rest. Below 1 is faster. */
  rest: number
}

export function emptyLines(): SkillLines {
  return { power: 0, cost: 0, rest: 1 }
}

/** The lines for `id`, creating the entry if this is the first mention. */
export function linesFor(boons: Boons, id: string): SkillLines {
  let lines = boons.perSkill.get(id)
  if (!lines) {
    lines = emptyLines()
    boons.perSkill.set(id, lines)
  }
  return lines
}

export function noTalents(): Boons {
  return {
    perSkill: new Map(),
    maxShi: 0,
    fill: 1,
    stillFill: 0,
    turnGain: 0,
    refundEvery: 0,
    cost: 0,
    cooldown: 1,
    duration: 1,
    power: noPower(),
    powerAlways: 0,
    anyPosture: false,
    armour: 0,
    move: 1,
    taken: 1,
  }
}

/**
 * Folds every rank into one struct.
 *
 * Ranks stack by APPLYING THE EFFECT AGAIN, not by multiplying an amount by a
 * rank count — so three ranks of a 6% cooldown cut are 0.94³, not 0.82. That is
 * the diminishing shape every other multiplier in this game already has, and it
 * is what stops a three-rank node from being strictly better per point than a
 * one-rank one.
 */
export function foldTalents(wheel: Wheel, out: Boons = noTalents()): Boons {
  out.maxShi = 0
  out.fill = 1
  out.stillFill = 0
  out.turnGain = 0
  out.refundEvery = 0
  out.cost = 0
  out.cooldown = 1
  out.duration = 1
  // The record is CLEARED IN PLACE rather than replaced, so a caller reusing
  // one `out` across expeditions never ends up sharing a posture map with a
  // scratch object built here.
  for (const cond of CONDITIONS) out.power[cond.id] = 0
  out.powerAlways = 0
  out.anyPosture = false
  out.armour = 0
  out.move = 1
  out.taken = 1
  // NOT cleared: the gear's lines are folded by a different function into the
  // same struct, and clearing them here would make the order of two folds
  // matter. See foldGearSkills, which clears what it owns.
  for (const talent of TALENTS) {
    const ranks = Math.min(Math.max(0, wheel[talent.id] ?? 0), talent.ranks)
    for (let r = 0; r < ranks; r++) applyTalent(talent, out)
  }
  return out
}

function applyTalent(talent: Talent, out: Boons): void {
  for (const effect of talent.effects) {
    switch (effect.kind) {
      case 'maxShi':
        out.maxShi += effect.amount
        break
      case 'fill':
        out.fill += effect.amount
        break
      case 'stillFill':
        // The largest wins rather than summing: two sources of "standing still
        // pays" would otherwise reach the running rate and quietly delete the
        // one tension the whole resource is built on.
        out.stillFill = Math.max(out.stillFill, effect.amount)
        break
      case 'turnGain':
        out.turnGain += effect.amount
        break
      case 'power':
        if (effect.when === null) out.powerAlways += effect.amount
        else out.power[effect.when] += effect.amount
        break
      case 'cost':
        out.cost += effect.amount
        break
      case 'cooldown':
        out.cooldown *= effect.amount
        break
      case 'duration':
        out.duration *= effect.amount
        break
      case 'armour':
        out.armour += effect.amount
        break
      case 'move':
        out.move *= effect.amount
        break
      case 'taken':
        out.taken *= effect.amount
        break
      case 'anyPosture':
        out.anyPosture = true
        break
      case 'refundOnTurn':
        out.refundEvery = effect.every
        break
    }
  }
}

/** Folds the ranks of ONE node, for the hub's "what would this add" line. */
export function foldOne(id: string, ranks: number): Boons {
  const talent = TALENT_BY_ID.get(id)
  const out = noTalents()
  if (!talent) return out
  for (let r = 0; r < Math.min(ranks, talent.ranks); r++) applyTalent(talent, out)
  return out
}

/**
 * The postures a skill's boost may read, given the wheel.
 *
 * 破围 turns every boost on at once, and this is the one place that rule lives
 * — so the tile in the HUD, the row in the hub and the arithmetic in the
 * simulation cannot disagree about whether a skill is being paid double.
 */
export function boostView(active: Conditions, bonus: Boons): Conditions {
  if (!bonus.anyPosture) return active
  return { still: true, running: true, turn: true, surrounded: true }
}
