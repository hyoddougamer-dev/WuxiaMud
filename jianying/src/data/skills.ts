/**
 * The skills a swordsman knows, slots and fires.
 *
 * WHAT THIS REPLACES, AND WHY. There were two ability systems. Technique cards
 * were picked on a level-up and died with the run; arts woke automatically if
 * the weapon's rung reached far enough down a list, and fired if the player's
 * movement happened to satisfy a condition nobody had been shown. Five of the
 * ten cards were the same EFFECT as an art under a different name. The verdict
 * from a real session was "não se percebe nada", and it was right: you never
 * chose an ability, and you never saw one fire because you chose it.
 *
 * A skill here is what every ARPG in the reference set means by one:
 *
 *   YOU OWN IT.        Not granted by a rung. Known, and slotted by hand.
 *   IT COSTS.          势, spent from a pool that movement fills. See sim/shi.
 *   IT RECHARGES.      A cooldown you can watch, so firing has a rhythm.
 *   IT SAYS WHAT IT DOES, in a number, at the size it will actually land.
 *   A CONDITION PAYS IT MORE, printed on the tile — not deciding whether it
 *     goes off. That is the whole difference between Grim Dawn's "while X"
 *     (legible, plannable) and what this game had (invisible, incidental).
 *
 * THE EFFECT VOCABULARY IS THE ONE THE SIMULATION ALREADY READS. Nothing here
 * invents a verb: `damage`, `range`, `rate`, `arc`, `guard`, `echo`, `crit`,
 * `pierce`, `speed`, `orbit`, `bolt`, `nova`, `magnet`, `heal` are the effects
 * sim/arts.ts has always applied. What changes is who decides they happen.
 */
import type { Condition } from './arts'

/** The effects the simulation knows how to apply. See sim/arts.ts. */
export type SkillEffect =
  | 'damage' | 'range' | 'rate' | 'arc' | 'guard' | 'echo' | 'crit'
  | 'pierce' | 'speed' | 'orbit' | 'bolt' | 'nova' | 'magnet' | 'heal'

export interface Skill {
  readonly id: string
  readonly seal: string
  readonly name: string
  /**
   * Which class can slot it, or null for the ones any swordsman may learn.
   *
   * The weapon is still the class — that was always the best idea in this game
   * — but a handful of skills belong to no school, so a build has something to
   * differ in besides the blade.
   */
  readonly weapon: string | null
  /** 势 spent to fire it. See MAX_SHI: one to three of a pool of four. */
  readonly cost: number
  /** Seconds before it can fire again. */
  readonly cooldown: number
  readonly effect: SkillEffect
  /**
   * How hard it lands, in the effect's own unit.
   *
   * Written as the number a player will SEE on the tile, so a skill cannot say
   * one thing on the screen and do another — the failure this project has hit
   * more than once with stats that were computed and never displayed.
   */
  readonly power: number
  /** Seconds the effect lasts. 0 for the ones that resolve instantly. */
  readonly duration: number
  /** The posture that pays more, and by how much. Printed on the tile. */
  readonly boost: { readonly when: Condition; readonly extra: number }
  readonly blurb: string
}

/**
 * The roster.
 *
 * Five per weapon, and four anyone can learn. The per-weapon five are the old
 * arts with a cost and a cooldown attached; the shared four are the technique
 * cards that had no art twin — the ones the merge had to CREATE rather than
 * collapse, so nothing that existed is lost.
 */
export const SKILLS: readonly Skill[] = [
  // --- 斩马刀, the weight ---------------------------------------------------
  {
    id: 'sink', seal: '沉', name: 'Sink', weapon: 'great',
    cost: 1, cooldown: 4, effect: 'damage', power: 0.55, duration: 3,
    boost: { when: 'still', extra: 0.8 },
    blurb: 'The weight goes into the cut.',
  },
  {
    id: 'grind', seal: '碾', name: 'Grind', weapon: 'great',
    cost: 2, cooldown: 7, effect: 'echo', power: 0.6, duration: 4,
    boost: { when: 'running', extra: 0.7 },
    blurb: 'The blade comes back through on the same swing.',
  },
  {
    id: 'mountain', seal: '山', name: 'Mountain', weapon: 'great',
    cost: 2, cooldown: 9, effect: 'guard', power: 0.34, duration: 4,
    boost: { when: 'surrounded', extra: 0.5 },
    blurb: 'Plant yourself. What reaches you lands lighter.',
  },
  {
    id: 'rend', seal: '裂', name: 'Rend', weapon: 'great',
    cost: 1, cooldown: 5, effect: 'range', power: 0.4, duration: 4,
    boost: { when: 'surrounded', extra: 0.6 },
    blurb: 'The blade needs more room, and takes it.',
  },
  {
    id: 'onecut', seal: '一斩', name: 'One Cut', weapon: 'great',
    cost: 2, cooldown: 7, effect: 'crit', power: 3, duration: 5,
    boost: { when: 'turn', extra: 1 },
    blurb: 'The next sweeps land like a felled tree.',
  },

  // --- 飞刀, the distance ---------------------------------------------------
  {
    id: 'steady', seal: '定', name: 'Steady', weapon: 'feidao',
    cost: 1, cooldown: 4, effect: 'pierce', power: 2, duration: 3,
    boost: { when: 'still', extra: 1 },
    blurb: 'The throw narrows and carries through.',
  },
  {
    id: 'chain', seal: '连', name: 'Chain', weapon: 'feidao',
    cost: 2, cooldown: 7, effect: 'rate', power: 0.45, duration: 4,
    boost: { when: 'running', extra: 0.6 },
    blurb: 'The volleys come one on top of another.',
  },
  {
    id: 'return', seal: '回', name: 'Return', weapon: 'feidao',
    cost: 2, cooldown: 7, effect: 'echo', power: 0.6, duration: 4,
    boost: { when: 'turn', extra: 0.8 },
    blurb: 'A second volley, back the way you came.',
  },
  {
    id: 'scatter', seal: '散', name: 'Scatter', weapon: 'feidao',
    cost: 1, cooldown: 5, effect: 'arc', power: 0.7, duration: 4,
    boost: { when: 'surrounded', extra: 0.6 },
    blurb: 'The blades leave your hand in a wide fan.',
  },
  {
    id: 'shadow', seal: '影', name: 'Shadowstep', weapon: 'feidao',
    cost: 1, cooldown: 6, effect: 'speed', power: 0.35, duration: 3,
    boost: { when: 'surrounded', extra: 0.5 },
    blurb: 'Your feet find the gap.',
  },

  // --- the four anyone may learn -------------------------------------------
  // These are the technique cards that had no art twin. They survive the merge
  // as skills rather than being deleted, because each is a distinct verb the
  // game would otherwise lose.
  {
    id: 'guardian', seal: '卫', name: 'Guardian Blades', weapon: null,
    cost: 2, cooldown: 10, effect: 'orbit', power: 3, duration: 6,
    boost: { when: 'surrounded', extra: 0.7 },
    blurb: 'Swords circle you, cutting what they touch.',
  },
  {
    id: 'swordqi', seal: '气', name: 'Sword Qi', weapon: null,
    cost: 2, cooldown: 8, effect: 'bolt', power: 1.2, duration: 5,
    boost: { when: 'still', extra: 0.6 },
    blurb: 'Qi looses from the blade at whatever is nearest.',
  },
  {
    id: 'thunder', seal: '雷', name: 'Thunder Palm', weapon: null,
    cost: 3, cooldown: 11, effect: 'nova', power: 1.5, duration: 0,
    boost: { when: 'surrounded', extra: 0.9 },
    blurb: 'A shockwave bursts from where you stand.',
  },
  {
    id: 'gather', seal: '聚', name: 'Gathering Palm', weapon: null,
    cost: 1, cooldown: 9, effect: 'magnet', power: 1.6, duration: 6,
    boost: { when: 'running', extra: 0.5 },
    blurb: 'Qi on the ground comes to you from much further.',
  },
]

export const SKILL_BY_ID = new Map(SKILLS.map((s) => [s.id, s]))

/** How many go on the bar. Three is what a thumb fits; see the overhaul page. */
export const SLOTTED_SKILLS = 3

/** Everything a swordsman carrying `weaponId` is allowed to slot. */
export function skillsFor(weaponId: string): Skill[] {
  return SKILLS.filter((s) => s.weapon === null || s.weapon === weaponId)
}

/**
 * What a skill is worth right now, given which postures hold.
 *
 * One function, so the number on the tile and the number the simulation applies
 * can never disagree — which is exactly how 神 came to scale the arts through a
 * formula no screen ever showed.
 */
export function skillPower(skill: Skill, active: Record<Condition, boolean>): number {
  return active[skill.boost.when] ? skill.power * (1 + skill.boost.extra) : skill.power
}
