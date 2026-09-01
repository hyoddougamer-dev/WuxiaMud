/**
 * 功法 — the arts a swordsman learns, and what wakes them.
 *
 * This is the build layer, and it exists because the game had two progressions
 * and neither was one: attributes are four numbers going up, and the in-run
 * technique cards are a draw. Neither lets a player decide HOW they want to
 * fight.
 *
 * Three rules shape the whole file.
 *
 * AN ART BELONGS TO A WEAPON. Each weapon has its own scroll of five, and you
 * only ever see the scroll for the weapon in hand. That is what makes the
 * agreed "your class is the weapon you carry" mean something: picking up a
 * spear is picking up a different way to fight, not a different reach number.
 *
 * THERE IS NO BUTTON. Every art has a CONDITION, and the condition is
 * something the player controls with the thumb already on the joystick.
 * Standing still, running flat out, turning hard, letting yourself be
 * surrounded, hanging on at low health. The art fires itself when the
 * condition holds.
 *
 * That distinction is the whole design. An art that applies always is a
 * number, and a game made of those plays itself by minute five. An art that
 * waits for a condition the player can PROVOKE is a skill — "if I plant my
 * feet, my sweep pierces" is learned by playing, not read in a menu. It costs
 * no new button, which is the constraint this game has had since day one.
 *
 * NOTHING HERE ACTS YET. This file is data and vocabulary only; the simulation
 * reads none of it. That is deliberate — see docs/ARTES.md for the build
 * order, and for the honest list of which effects are levers the sim already
 * has and which are new work.
 */

/**
 * What wakes an art.
 *
 * Five, and no more, because each one needs a tell on screen and a player can
 * only learn so many rules while being chased. Every condition below is
 * readable off state the simulation already keeps — speed, facing, the enemy
 * grid, health — so detecting them costs nothing new.
 */
export type Condition = 'still' | 'running' | 'turn' | 'surrounded' | 'peril'

export interface ConditionKind {
  readonly id: Condition
  /** Chinese seal, used as the tell on the HUD. */
  readonly seal: string
  readonly name: string
  /** What the player has to DO. Written as an instruction, not a description. */
  readonly how: string
}

export const CONDITIONS: readonly ConditionKind[] = [
  { id: 'still', seal: '静', name: 'Still', how: 'Plant your feet and stop moving.' },
  { id: 'running', seal: '疾', name: 'Running', how: 'Hold top speed without turning.' },
  { id: 'turn', seal: '转', name: 'Turning', how: 'Reverse hard, back the way you came.' },
  { id: 'surrounded', seal: '围', name: 'Surrounded', how: 'Let them close in around you.' },
  { id: 'peril', seal: '危', name: 'Peril', how: 'Keep fighting on low health.' },
] as const

export const CONDITION_BY_ID = new Map(CONDITIONS.map((c) => [c.id, c]))

/**
 * What an art does, from a closed vocabulary.
 *
 * Closed on purpose. An open one would make every art its own special case in
 * the simulation, which is the failure that produced ten stat kinds across
 * sixteen items — sixteen exceptions, and nothing comparable to anything.
 *
 * The first ten are levers `deriveStats` already moves. The last six are new
 * simulation work, one small feature each, and they are marked so that the
 * cost of an art is visible when the art is written rather than when it is
 * implemented.
 */
export type EffectKind =
  // --- levers that already exist ---
  | 'damage'
  | 'rate'
  | 'range'
  | 'arc'
  | 'speed'
  | 'magnet'
  | 'orbit'
  | 'bolt'
  | 'nova'
  | 'maxHp'
  // --- new simulation work, one small feature each ---
  | 'pierce'
  | 'crit'
  | 'echo'
  | 'push'
  | 'guard'
  | 'heal'

/** The effects that need simulation this game does not have yet. */
export const NEW_EFFECTS: readonly EffectKind[] = [
  'pierce',
  'crit',
  'echo',
  'push',
  'guard',
  'heal',
] as const

export interface Art {
  readonly id: string
  /** Chinese seal — how the art is named on the scroll and in play. */
  readonly seal: string
  readonly name: string
  /** Weapon style id this belongs to. See data/weapons.ts. */
  readonly weapon: string
  readonly condition: Condition
  readonly effect: EffectKind
  /** One line, in the player's own terms. Shown on the card. */
  readonly blurb: string
}

/** How far an art can be raised. Five, like a piece's rank. */
export const MAX_ART_LEVEL = 5

/**
 * How many of a weapon's scroll a swordsman may ORDER in the hub.
 *
 * Not how many fire. How far down that order the arts actually wake is decided
 * by the weapon in hand — see `awakeCount` in sim/arts.ts. Four is what a thumb
 * can arrange without the pane becoming a spreadsheet; the fifth is the reward
 * for carrying a 神 or 仙 blade, and it wakes in whatever place the other four
 * leave it.
 */
export const EQUIPPED_ARTS = 4

/**
 * Two scrolls of five.
 *
 * Each class covers all five conditions exactly once, which is not a
 * decoration: it means neither has a dead condition, and a player who changes
 * class keeps the same five things to DO while everything those things produce
 * changes. That is the cheapest way to make two classes feel different without
 * teaching two control schemes.
 *
 * THERE WERE SIX SCROLLS AND THIRTY ARTS. Twenty of them are gone with the four
 * weapons they belonged to. Nothing was salvaged into the survivors: an art
 * written for a fan reads wrong on a zhanmadao, and keeping it would have
 * bought content at the price of the thing this cut was for.
 */
export const ARTS: readonly Art[] = [
  // --- 斩马刀 great — 重, the weight ------------------------------------
  // Carried over unchanged from the six-weapon roster. They were the set built
  // around standing IN the crowd, and that is exactly what this class now is.
  {
    id: 'great-sink',
    seal: '沉',
    name: 'Sink',
    weapon: 'great',
    condition: 'still',
    effect: 'damage',
    blurb: 'Planted, the weight goes into the cut.',
  },
  {
    id: 'great-grind',
    seal: '碾',
    name: 'Grind',
    weapon: 'great',
    condition: 'running',
    effect: 'echo',
    blurb: 'At speed, the blade comes back through on the same swing.',
  },
  {
    id: 'great-mountain',
    seal: '山',
    name: 'Mountain',
    weapon: 'great',
    condition: 'peril',
    effect: 'guard',
    blurb: 'On low health, what reaches you lands lighter.',
  },
  {
    id: 'great-rend',
    seal: '裂',
    name: 'Rend',
    weapon: 'great',
    condition: 'surrounded',
    effect: 'range',
    blurb: 'Surrounded, the blade needs more room and takes it.',
  },
  {
    id: 'great-onecut',
    seal: '一斩',
    name: 'One Cut',
    weapon: 'great',
    condition: 'turn',
    effect: 'crit',
    blurb: 'The sweep after a turn lands like a felled tree.',
  },

  // --- 飞刀 feidao — 距, the distance ------------------------------------
  //
  // Every effect below reads the SAME stat the zhanmadao's does — see Strike in
  // data/weapons.ts. On a thrown weapon reach is flight distance and the arc is
  // the spread of the volley, so `pierce` (narrow and long) becomes a tight,
  // far-flying line and `arc` becomes a shotgun. One vocabulary, two meanings,
  // no second implementation to drift.
  //
  // The 危 art is the one deliberate mirror-image of the zhanmadao's. Its
  // answer to being nearly dead is to stand there and take less; a thrower's
  // answer has to be to LEAVE, or the class is being asked to play against its
  // own premise at the worst possible moment.
  {
    id: 'feidao-steady',
    seal: '定',
    name: 'Steady',
    weapon: 'feidao',
    condition: 'still',
    effect: 'pierce',
    blurb: 'Planted, the throw narrows and carries much further.',
  },
  {
    id: 'feidao-chain',
    seal: '连',
    name: 'Chain',
    weapon: 'feidao',
    condition: 'running',
    effect: 'rate',
    blurb: 'At speed the volleys come one on top of another.',
  },
  {
    id: 'feidao-return',
    seal: '回',
    name: 'Return',
    weapon: 'feidao',
    condition: 'turn',
    effect: 'echo',
    blurb: 'Turning looses a second volley back the way you came.',
  },
  {
    id: 'feidao-scatter',
    seal: '散',
    name: 'Scatter',
    weapon: 'feidao',
    condition: 'surrounded',
    effect: 'arc',
    blurb: 'Surrounded, the blades leave your hand in a wide fan.',
  },
  {
    id: 'feidao-shadow',
    seal: '影',
    name: 'Shadowstep',
    weapon: 'feidao',
    condition: 'peril',
    effect: 'speed',
    blurb: 'On low health your feet find the gap. You move faster.',
  },
] as const

export const ART_BY_ID = new Map(ARTS.map((a) => [a.id, a]))

/** The scroll for one weapon, in the order it is written above. */
export function artsFor(weaponStyleId: string): Art[] {
  return ARTS.filter((art) => art.weapon === weaponStyleId)
}

/**
 * What one grade of an art is worth, as a multiplier on its effect.
 *
 * The same shape as a piece's rank (data/items.ts statAt) and for the same
 * reason: one rule the player can hold in their head, rather than thirty
 * curves nobody can compare. Grade 0 means known but not yet raised, and it
 * still does something — an art that reads as nothing until it is levelled is
 * an art nobody equips.
 */
export function artScale(level: number): number {
  const n = Math.max(0, Math.min(MAX_ART_LEVEL, Math.floor(level)))
  return 1 + n * 0.35
}
