/**
 * 功法 — the arts a swordsman learns, and what wakes them.
 *
 * This is the build layer, and it exists because the game had two progressions
 * and neither was one: attributes are four numbers going up, and the in-run
 * technique cards were a draw. Neither let a player decide HOW they wanted to
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
 * FOUR, AND THEY COME IN TWO KINDS. There were five, and the fifth is gone;
 * what replaced it is at DESPERATE_FRACTION below.
 *
 * The kinds are the repair. Measured in play, the old five were not five
 * conditions — they were two that worked and three that did not. Running held
 * for 99% of a mover's run and 23% of a fighter's, which is not a condition
 * either way: a thing that is always on is a number you already have, and a
 * thing that is never on is an art you do not have. Still reached 17% only for
 * a pilot written to plant its feet on purpose, because it demanded better
 * than half a second under a tenth of top speed and the player still has to
 * brake into it. Peril reached 1%.
 *
 * So the conditions now pull in opposite directions and feed each other:
 *
 *   CHARGE — running, turning, being surrounded. The three states of being IN
 *   the fight. Each pays its art the same steady bonus it always did, and each
 *   also banks 势 while it holds.
 *
 *   SPEND — standing still. The one thing you choose rather than fall into.
 *   Planting your feet DISCHARGES the lot in a single burst, scaled by what
 *   you banked.
 *
 * SURROUNDED WAS BRIEFLY A SPENDING CONDITION AND THAT WAS WRONG, measured and
 * reverted rather than argued: it is a state, not an instant. An engaged
 * player is surrounded more or less continuously, so paying on the frame the
 * ring closes paid almost never — the arts went from 26% below the technique
 * cards to 37% below. The three charging conditions are the ones the
 * measurement already showed working or harmless; the only one that was
 * genuinely broken as a sustained bonus was 静, because it demanded a long
 * planted hold in the middle of a crowd for a modest trickle. That one is now
 * the burst, which is the trade the hold was always asking for.
 *
 * Nothing here adds a button: it is still the thumb already on the joystick.
 */
export type Condition = 'still' | 'running' | 'turn' | 'surrounded'

/** Whether entering a condition banks 势 or spends it. */
export type ConditionKindName = 'charge' | 'spend'

export interface ConditionKind {
  readonly id: Condition
  /** Chinese seal, used as the tell on the HUD. */
  readonly seal: string
  readonly name: string
  /** What the player has to DO. Written as an instruction, not a description. */
  readonly how: string
  readonly kind: ConditionKindName
  /** What it does to 势, in the player's own terms. */
  readonly does: string
}

export const CONDITIONS: readonly ConditionKind[] = [
  {
    id: 'running', seal: '疾', name: 'Running', kind: 'charge',
    how: 'Hold top speed without turning.', does: 'Builds momentum.',
  },
  {
    id: 'turn', seal: '转', name: 'Turning', kind: 'charge',
    how: 'Reverse hard, back the way you came.', does: 'Builds momentum, fast.',
  },
  {
    id: 'surrounded', seal: '围', name: 'Surrounded', kind: 'charge',
    how: 'Let them close in around you.', does: 'Builds momentum while it lasts.',
  },
  {
    id: 'still', seal: '静', name: 'Still', kind: 'spend',
    how: 'Plant your feet.', does: 'Spends everything you built, at once.',
  },
] as const

/**
 * Health at or below this fraction makes every art fire one grade higher.
 *
 * This is what became of 危. As a CONDITION it was measured at 1% of a run —
 * an art bound to it was a dead slot, and a level-one swordsman whose single
 * woken art sat on it had a build that could never once fire. As a RULE it
 * costs no slot, can never be dead, and does the one thing the condition was
 * reaching for: it makes the worst moment of a run the moment a comeback is
 * worth attempting.
 */
export const DESPERATE_FRACTION = 0.3

export const CONDITION_BY_ID = new Map(CONDITIONS.map((c) => [c.id, c]))

/** Whether a condition banks 势 or spends it. */
export function conditionKind(id: Condition): ConditionKindName {
  return CONDITION_BY_ID.get(id)!.kind
}

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
 * by the weapon in hand — see `awakeCount` in sim/arts.ts.
 *
 * FIVE, WHICH IS ALL OF THEM. It was four, and the cut was taken off the
 * bottom of the list. That is a silent deletion rather than a choice, and it
 * was deleting the wrong art: on the zhanmadao the fifth in order is the 转
 * art, and 转 is the best-attended condition an engaged player has. The game
 * was quietly removing a live art and keeping two dead ones.
 *
 * The scarcity that made a four worth having has not gone anywhere — it just
 * sits where it was always readable, on the blade. A grey blade still wakes
 * one art and a divine blade the whole scroll, so which arts fire is still a
 * thing you earn. What no longer happens is the ordering pane deciding it for
 * you, off screen, by list position.
 */
export const EQUIPPED_ARTS = 5

/**
 * Two scrolls of five.
 *
 * THE ORDER IS THE DEFAULT LOADOUT, and it is not cosmetic: a blade wakes the
 * scroll from the top down, so whatever sits fourth and fifth does not exist
 * until the player carries a very good weapon. That makes it tempting to
 * reorder a scroll whenever a class measures badly, and TWO SUCH GUESSES WERE
 * TRIED HERE AND BOTH REFUTED — Shadowstep third, on the theory the thrower
 * lacked a survival tool (312s to 295s, worse); Scatter third, on the theory
 * it lacked an art on the condition that holds half a run (291s, worse
 * again). The order below is the original one. Whatever the 飞刀's gap is, it
 * is not the order, and the file should not carry a change that measured
 * worse just because the reasoning behind it sounded good.
 *
 * Five arts over four conditions, so each class doubles up on exactly one —
 * and WHICH one it doubles is the class. The zhanmadao doubles on 围: ringed
 * in, it both takes more room and takes less damage, because standing in the
 * crowd is what it does. The 飞刀 doubles on 转: breaking back the way you came
 * throws a second volley AND finds you the gap, because leaving is what it
 * does. A player who changes class keeps the same four things to DO while
 * everything those things produce changes, which is the cheapest way to make
 * two classes feel different without teaching two control schemes.
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
    condition: 'surrounded',
    effect: 'guard',
    blurb: 'Ringed in, you set yourself and what reaches you lands lighter.',
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
    condition: 'turn',
    effect: 'speed',
    blurb: 'Break back the way you came and your feet find the gap.',
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
  return artGrowth(Math.min(MAX_ART_LEVEL, Math.floor(level)))
}

/**
 * The same curve without the grade ceiling, for 势.
 *
 * A discharge multiplies a grade by the momentum behind it, which runs past
 * five by design — `artScale` clamps because a GRADE cannot exceed five, not
 * because the curve stops there. One formula, so the burst and the steady
 * bonus can never drift into two different games.
 */
export function artGrowth(power: number): number {
  return 1 + Math.max(0, power) * 0.35
}
