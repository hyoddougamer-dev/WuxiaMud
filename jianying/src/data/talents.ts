/**
 * 势轮 — the Wheel. Permanent choices that change how the skills behave.
 *
 * WHY A WHEEL AND NOT A TREE. Every ARPG in the reference set has a large
 * passive graph, and every one of them is read on a monitor you can pan around
 * with a mouse. On a phone, panning a big graph with the same thumb that has to
 * tap a node is the whole reason those screens do not port. A wheel has no
 * off-screen: four arms and a hub, all of it inside one thumb's reach at 390px,
 * and the shape itself carries the structure — the further out, the bigger the
 * commitment.
 *
 * WHAT MAKES IT THEORYCRAFTING RATHER THAN A SHOPPING LIST. Three things, and
 * the first two are the ones this project has failed at before:
 *
 *   IT POINTS AT THE SKILLS YOU CHOSE. Nothing here is "+5 damage". Every node
 *   moves what a SKILL costs, how long it runs, how hard it lands, or how fast
 *   the 势 that pays for it comes back. A wheel that only moved the sweep would
 *   be the attribute screen with more steps.
 *
 *   THE ARMS ARE THE POSTURES. 静 疾 转 围 already decide which skill pays
 *   double; investing in an arm is declaring how you intend to move. That makes
 *   the wheel and the bar one decision rather than two — you cannot sensibly
 *   pick nodes without knowing your three skills, or your three without knowing
 *   your arm.
 *
 *   ONE KEYSTONE, EVER. Each arm ends in a rule change with a real cost, and a
 *   swordsman may hold exactly one of the four. That single constraint is what
 *   makes two players' builds different KINDS of thing rather than the same
 *   thing at different sizes — which is the actual definition of the word.
 *
 * RESPEC IS FREE AND ALWAYS AVAILABLE. There is no wiki for this game and no
 * way to look a build up: the only way to learn what a keystone does is to take
 * it and walk out. Charging for that would make the interesting choice the one
 * nobody dares make.
 */
import type { Condition } from './arts'

/** The four arms, plus the hub every wheel starts from. */
export type Arm = 'core' | Condition

/**
 * What a node does, in the vocabulary the simulation can actually apply.
 *
 * Deliberately small. Every kind below has exactly one place it lands — see
 * sim/talents.ts, which is the only file that reads these — so a node cannot be
 * written that does something no code applies, which is how a passive tree
 * comes to be full of text that means nothing.
 */
export type TalentEffect =
  /** Whole points added to the 势 pool. */
  | { readonly kind: 'maxShi'; readonly amount: number }
  /** Multiplier on how fast movement fills 势. */
  | { readonly kind: 'fill'; readonly amount: number }
  /** Fraction of the normal fill earned while STANDING STILL, which is 0. */
  | { readonly kind: 'stillFill'; readonly amount: number }
  /** Extra 势 banked on a hard reversal, on top of the base turn bonus. */
  | { readonly kind: 'turnGain'; readonly amount: number }
  /** Added to every skill's power while `when` holds — or always, when null. */
  | { readonly kind: 'power'; readonly when: Condition | null; readonly amount: number }
  /** Added to every skill's 势 cost. Negative is a discount. */
  | { readonly kind: 'cost'; readonly amount: number }
  /** Multiplier on every cooldown. Below 1 is faster. */
  | { readonly kind: 'cooldown'; readonly amount: number }
  /** Multiplier on how long an effect stays live. */
  | { readonly kind: 'duration'; readonly amount: number }
  /** Flat armour, which subtracts from every blow before anything else. */
  | { readonly kind: 'armour'; readonly amount: number }
  /** Multiplier on movement speed. */
  | { readonly kind: 'move'; readonly amount: number }
  /** Multiplier on damage taken. Above 1 is a cost a keystone is paying. */
  | { readonly kind: 'taken'; readonly amount: number }
  /** Every skill's boost counts as active, whatever posture it names. */
  | { readonly kind: 'anyPosture' }
  /** A hard reversal refunds the 势 of the last cast, on its own cooldown. */
  | { readonly kind: 'refundOnTurn'; readonly every: number }

export interface Talent {
  readonly id: string
  readonly arm: Arm
  /**
   * How far out. 0 is the hub, 1..3 are the rings.
   *
   * The ring is the gate as well as the position: ring 2 opens once `RING_GATE`
   * points sit in the same arm, ring 3 once twice that does. Spending has to
   * mean something before the arm's mechanic and its keystone come into reach,
   * or the wheel is four keystones and some decoration.
   */
  readonly ring: 0 | 1 | 2 | 3
  readonly seal: string
  readonly name: string
  /** How many times it can be taken. A keystone is always 1. */
  readonly ranks: number
  /** What ONE rank does. Ranks stack by repeating the effect. */
  readonly effects: readonly TalentEffect[]
  /** One line, in the player's units. Shown verbatim on the node's sheet. */
  readonly blurb: string
  /** What it costs you, for the nodes that cost something. Shown in cinnabar. */
  readonly cost?: string
}

/** Points inside one arm before its ring-2 node opens. Doubled for ring 3. */
export const RING_GATE = 3

/** A swordsman may hold exactly one keystone. See the file's note. */
export const MAX_KEYSTONES = 1

export const TALENTS: readonly Talent[] = [
  // --- 核 the hub: 势 itself ------------------------------------------------
  {
    id: 'deepwell', arm: 'core', ring: 0, seal: '渊', name: 'Deep Well', ranks: 2,
    effects: [{ kind: 'maxShi', amount: 1 }],
    blurb: '+1 to your 势 pool.',
  },
  {
    id: 'current', arm: 'core', ring: 0, seal: '流', name: 'Current', ranks: 3,
    effects: [{ kind: 'fill', amount: 0.12 }],
    blurb: '势 fills 12% faster while you move.',
  },
  {
    id: 'thrift', arm: 'core', ring: 0, seal: '俭', name: 'Thrift', ranks: 3,
    effects: [{ kind: 'cooldown', amount: 0.94 }],
    blurb: 'Every skill rests 6% less.',
  },

  // --- 静 Still: the arm that pays for planting your feet -------------------
  {
    id: 'rooted', arm: 'still', ring: 1, seal: '根', name: 'Rooted', ranks: 3,
    effects: [{ kind: 'power', when: 'still', amount: 0.09 }],
    blurb: '+9% skill power while you stand still.',
  },
  {
    id: 'anvil', arm: 'still', ring: 1, seal: '砧', name: 'Anvil', ranks: 3,
    effects: [{ kind: 'armour', amount: 5 }],
    blurb: '+5 armour, always.',
  },
  {
    id: 'longbreath', arm: 'still', ring: 2, seal: '息', name: 'Long Breath', ranks: 2,
    effects: [{ kind: 'duration', amount: 1.18 }],
    blurb: 'Every skill stays live 18% longer.',
  },
  {
    id: 'stillpoint', arm: 'still', ring: 3, seal: '定心', name: 'Stillpoint', ranks: 1,
    effects: [
      { kind: 'stillFill', amount: 0.55 },
      { kind: 'cost', amount: 1 },
    ],
    blurb: 'Standing still fills 势 at 55% of running speed, instead of not at all.',
    cost: 'Every skill costs 1 more 势.',
  },

  // --- 疾 Running: the arm that pays for never stopping ---------------------
  {
    id: 'swiftfoot', arm: 'running', ring: 1, seal: '捷', name: 'Swift Foot', ranks: 3,
    effects: [{ kind: 'move', amount: 1.04 }],
    blurb: '+4% movement speed.',
  },
  {
    id: 'gale', arm: 'running', ring: 1, seal: '飙', name: 'Gale', ranks: 3,
    effects: [{ kind: 'power', when: 'running', amount: 0.09 }],
    blurb: '+9% skill power while you are running.',
  },
  {
    id: 'secondwind', arm: 'running', ring: 2, seal: '风', name: 'Second Wind', ranks: 2,
    effects: [{ kind: 'fill', amount: 0.2 }],
    blurb: '势 fills another 20% faster while you move.',
  },
  {
    id: 'traceless', arm: 'running', ring: 3, seal: '无踪', name: 'Traceless', ranks: 1,
    effects: [
      { kind: 'cost', amount: -1 },
      { kind: 'duration', amount: 0.55 },
    ],
    blurb: 'Every skill costs 1 less 势 — many of them become free.',
    cost: 'Every effect lasts barely half as long.',
  },

  // --- 转 Turning: the arm that pays for reversing on the spot --------------
  {
    id: 'pivot', arm: 'turn', ring: 1, seal: '枢', name: 'Pivot', ranks: 3,
    effects: [{ kind: 'turnGain', amount: 0.2 }],
    blurb: 'A hard reversal banks another 0.2 势.',
  },
  {
    id: 'whirl', arm: 'turn', ring: 1, seal: '旋', name: 'Whirl', ranks: 3,
    effects: [{ kind: 'power', when: 'turn', amount: 0.11 }],
    blurb: '+11% skill power in the instant you reverse.',
  },
  {
    id: 'unspent', arm: 'turn', ring: 2, seal: '省', name: 'Unspent', ranks: 2,
    effects: [{ kind: 'cooldown', amount: 0.9 }],
    blurb: 'Every skill rests another 10% less.',
  },
  {
    id: 'aboutface', arm: 'turn', ring: 3, seal: '回身', name: 'About-Face', ranks: 1,
    effects: [{ kind: 'refundOnTurn', every: 6 }],
    blurb: 'A hard reversal refunds what your last cast cost. Once every 6s.',
    cost: 'Nothing — but it pays only as often as you turn.',
  },

  // --- 围 Surrounded: the arm that pays for letting them close --------------
  {
    id: 'ironring', arm: 'surrounded', ring: 1, seal: '铁', name: 'Iron Ring', ranks: 3,
    effects: [{ kind: 'armour', amount: 4 }, { kind: 'move', amount: 1.01 }],
    blurb: '+4 armour and +1% movement.',
  },
  {
    id: 'press', arm: 'surrounded', ring: 1, seal: '压', name: 'Press', ranks: 3,
    effects: [{ kind: 'power', when: 'surrounded', amount: 0.11 }],
    blurb: '+11% skill power while they are all around you.',
  },
  {
    id: 'unmoved', arm: 'surrounded', ring: 2, seal: '岿', name: 'Unmoved', ranks: 2,
    effects: [{ kind: 'taken', amount: 0.93 }],
    blurb: 'You take 7% less damage from everything.',
  },
  {
    id: 'breakring', arm: 'surrounded', ring: 3, seal: '破围', name: 'Breaking the Ring', ranks: 1,
    effects: [
      { kind: 'anyPosture' },
      { kind: 'taken', amount: 1.25 },
    ],
    blurb: 'Every skill fires at its boosted number, whatever posture it names.',
    cost: 'You take 25% more damage from everything.',
  },
]

export const TALENT_BY_ID = new Map(TALENTS.map((t) => [t.id, t]))

/** A keystone is the ring-3 node of an arm. There are four, and you take one. */
export const isKeystone = (t: Talent): boolean => t.ring === 3

/** Every node on one arm, innermost first. */
export function armTalents(arm: Arm): Talent[] {
  return TALENTS.filter((t) => t.arm === arm)
}

/** Points taken, keyed by talent id. */
export type Wheel = Record<string, number>

/**
 * Points a swordsman has to spend by `level`.
 *
 * ONE FROM THE VERY FIRST LEVEL, for the same reason `createCharacter` hands
 * out an attribute point at creation: the first thing a new player should meet
 * on this screen is a choice, not a locked board full of zeroes. Caught by the
 * harness, which opened the wheel on a fresh swordsman and found every node
 * refused with "No points left" — a screen that teaches nothing about itself.
 *
 * It is a SEPARATE currency from the attribute point, deliberately: making them
 * one pool would turn every level into "stats or build?", which is a false
 * choice dressed as a real one. Both tracks advance, and what the player
 * decides is the shape of each.
 */
export function wheelPointsAt(level: number): number {
  return Math.max(0, Math.floor(level))
}
