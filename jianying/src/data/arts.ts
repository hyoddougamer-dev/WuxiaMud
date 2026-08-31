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

/** How many arts a swordsman may carry into an expedition. */
export const EQUIPPED_ARTS = 4

/**
 * How far a 秘笈 can raise an art PERMANENTLY.
 *
 * The problem this exists to fix: an art's grade used to be entirely temporary.
 * Every expedition began at grade one and 感悟 pushed it up during the run, and
 * then the whole thing was thrown away — so a player who spent an expedition
 * raising an art to grade five started the next one back at one. There was no
 * vertical progression in the arts at all, only a treadmill that reset, which
 * is exactly why the game read as "levels go up and nothing improves".
 *
 * A manual is the permanent half. Finding and studying one raises an art's
 * BASE grade — the grade it walks out of the hub at — and that is what makes a
 * late build fast where an early one is slow.
 *
 * THREE, NOT FOUR, and the missing step is deliberate. At four, a fully
 * studied art would start at grade five, which is the cap, and 感悟 would have
 * nothing left to do for it all expedition. Carry four such arts and the entire
 * in-run ramp — the thing that makes a survivors-like a survivors-like —
 * disappears at exactly the moment the player has invested most. Stopping at
 * three leaves every art one grade of headroom forever: a mastered art still
 * climbs, it just gets there in one step instead of four. That gap IS the
 * power fantasy, and it costs nothing to keep the run's own arc alive.
 */
export const MAX_MANUAL_RANK = 3

/**
 * The grade an art begins an expedition at, given the manuals studied for it.
 *
 * Rank zero — nothing studied — starts at one, which is where every art in the
 * game started before manuals existed. So a save that has never seen a manual
 * plays exactly as it did.
 */
export function startLevelFor(manualRank: number): number {
  const rank = Math.max(0, Math.min(MAX_MANUAL_RANK, Math.floor(manualRank)))
  return Math.min(MAX_ART_LEVEL, 1 + rank)
}

/**
 * Chance that felling an ordinary enemy leaves a 秘笈, at a given depth.
 *
 * Deliberately scarcer than equipment — a manual is permanent power, and gear
 * is not — but not so scarce that a shallow expedition is a waste of time. The
 * real source is the gate: a boss ALWAYS leaves one (see damageEnemy). That is
 * the point of routing permanent progression through the rift rather than
 * through the grind — the thing that pays is the fight you chose to have, not
 * the four hundredth bandit.
 */
export function manualChance(depth: number): number {
  return 0.0035 + Math.max(0, depth - 1) * 0.0009
}

/**
 * Six scrolls of five.
 *
 * Every weapon covers all five conditions exactly once, which is not a
 * decoration: it means no weapon has a dead condition, and a player who
 * changes weapon keeps the same five things to DO while everything those
 * things produce changes. That is the cheapest possible way to make six
 * classes feel different without teaching six control schemes.
 */
export const ARTS: readonly Art[] = [
  // --- 剑 jian — 剑意, the precise cut -----------------------------------
  {
    id: 'jian-point',
    seal: '点',
    name: 'Point',
    weapon: 'jian',
    condition: 'still',
    effect: 'pierce',
    blurb: 'Planted, the arc narrows and runs through what it hits.',
  },
  {
    id: 'jian-flow',
    seal: '流',
    name: 'Flow',
    weapon: 'jian',
    condition: 'running',
    effect: 'rate',
    blurb: 'At speed, the sweeps come closer together.',
  },
  {
    id: 'jian-shadow',
    seal: '影',
    name: 'Shadow',
    weapon: 'jian',
    condition: 'turn',
    effect: 'echo',
    blurb: 'Turning leaves an echo of the sweep where you stood.',
  },
  {
    id: 'jian-sever',
    seal: '断',
    name: 'Sever',
    weapon: 'jian',
    condition: 'surrounded',
    effect: 'crit',
    blurb: 'Surrounded, the sweep finds the gap and cuts twice as deep.',
  },
  {
    id: 'jian-qi',
    seal: '剑气',
    name: 'Sword Qi',
    weapon: 'jian',
    condition: 'peril',
    effect: 'bolt',
    blurb: 'On low health, the sweep throws qi past its own reach.',
  },

  // --- 刀 dao — 势, the blade that does not stop -------------------------
  {
    id: 'dao-momentum',
    seal: '势',
    name: 'Momentum',
    weapon: 'dao',
    condition: 'running',
    effect: 'damage',
    blurb: 'Damage grows the longer you keep moving.',
  },
  {
    id: 'dao-furl',
    seal: '卷',
    name: 'Furl',
    weapon: 'dao',
    condition: 'surrounded',
    effect: 'arc',
    blurb: 'The arc widens for every enemy standing close.',
  },
  {
    id: 'dao-blood',
    seal: '血',
    name: 'Blood',
    weapon: 'dao',
    /**
     * MENDING IS PAIRED WITH STANDING STILL, not with being in peril, and the
     * swap was forced by measurement rather than taste.
     *
     * On 危 this art produced 460-525 seconds against 135 with no arts and 179
     * with the technique cards — three times any other build in the game. The
     * cause is structural and no amount of tuning reached it: a mend tied to
     * LOW HEALTH is a stabilising loop. It only has to match incoming damage at
     * the threshold it fires below, and the player decides how much damage
     * comes in. A cooldown moved 525 to 523. Quartering the heal still left
     * 479. A budget per scrape still left 460, because leaving peril is what
     * refills it and a kiting player crosses that line constantly.
     *
     * On 静 the loop cannot close: mending demands that you stop moving, and
     * standing still in a crowd is how you die. The art becomes a real decision
     * made under pressure instead of a floor to sit on — which is what every
     * other art in this game already is.
     */
    condition: 'still',
    effect: 'heal',
    blurb: 'Plant your feet and each kill staunches the wound.',
  },
  {
    id: 'dao-press',
    seal: '压',
    name: 'Press',
    weapon: 'dao',
    condition: 'peril',
    effect: 'push',
    blurb: 'On low health, the sweep shoves what it touches away.',
  },
  {
    id: 'dao-armybreaker',
    seal: '破军',
    name: 'Army-breaker',
    weapon: 'dao',
    condition: 'turn',
    effect: 'arc',
    blurb: 'A hard turn carries the blade the whole way round.',
  },

  // --- 斩马刀 great — 重, the weight ------------------------------------
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

  // --- 双刀 twin — 疾, the short distance --------------------------------
  {
    id: 'twin-pair',
    seal: '双',
    name: 'Pair',
    weapon: 'twin',
    condition: 'running',
    effect: 'echo',
    blurb: 'At speed, the second blade cuts behind you.',
  },
  {
    id: 'twin-entangle',
    seal: '缠',
    name: 'Entangle',
    weapon: 'twin',
    condition: 'surrounded',
    effect: 'rate',
    blurb: 'The more of them there are, the faster the hands move.',
  },
  {
    id: 'twin-swallow',
    seal: '燕',
    name: 'Swallow',
    weapon: 'twin',
    condition: 'turn',
    effect: 'speed',
    blurb: 'A turn throws you forward out of it.',
  },
  {
    id: 'twin-inch',
    seal: '寸',
    name: 'Inch',
    weapon: 'twin',
    condition: 'still',
    effect: 'damage',
    blurb: 'Planted, everything goes into a cut you must be close to make.',
  },
  {
    id: 'twin-butterfly',
    seal: '蝶',
    name: 'Butterfly',
    weapon: 'twin',
    condition: 'peril',
    effect: 'orbit',
    blurb: 'On low health, the blades leave your hands and circle.',
  },

  // --- 枪 spear — 远, the reach ------------------------------------------
  {
    id: 'spear-thrust',
    seal: '刺',
    name: 'Thrust',
    weapon: 'spear',
    condition: 'still',
    effect: 'pierce',
    blurb: 'Planted, the point runs a line through everything ahead.',
  },
  {
    id: 'spear-sweep',
    seal: '扫',
    name: 'Sweep',
    weapon: 'spear',
    condition: 'surrounded',
    effect: 'arc',
    blurb: 'Surrounded, the shaft comes round instead of forward.',
  },
  {
    id: 'spear-pursue',
    seal: '追',
    name: 'Pursue',
    weapon: 'spear',
    condition: 'running',
    effect: 'range',
    blurb: 'The faster you go, the further ahead it reaches.',
  },
  {
    id: 'spear-bar',
    seal: '拦',
    name: 'Bar',
    weapon: 'spear',
    condition: 'turn',
    effect: 'push',
    blurb: 'Turning sets the shaft across them and drives them back.',
  },
  {
    id: 'spear-dragon',
    seal: '龙',
    name: 'Dragon',
    weapon: 'spear',
    condition: 'peril',
    effect: 'bolt',
    blurb: 'On low health, the point spits what it cannot reach.',
  },

  // --- 扇 fan — 变, the change -------------------------------------------
  {
    id: 'fan-open',
    seal: '展',
    name: 'Open',
    weapon: 'fan',
    condition: 'still',
    effect: 'arc',
    blurb: 'Planted, the fan opens the whole circle.',
  },
  {
    id: 'fan-wind',
    seal: '风',
    name: 'Wind',
    weapon: 'fan',
    condition: 'running',
    effect: 'magnet',
    blurb: 'At speed, qi comes to you from much further off.',
  },
  {
    id: 'fan-conceal',
    seal: '藏',
    name: 'Conceal',
    weapon: 'fan',
    condition: 'peril',
    effect: 'guard',
    blurb: 'On low health, there is a moment where nothing lands.',
  },
  {
    id: 'fan-scatter',
    seal: '乱',
    name: 'Scatter',
    weapon: 'fan',
    condition: 'surrounded',
    effect: 'bolt',
    blurb: 'Surrounded, the blades leave the fan in every direction.',
  },
  {
    id: 'fan-return',
    seal: '回',
    name: 'Return',
    weapon: 'fan',
    condition: 'turn',
    effect: 'echo',
    blurb: 'A turn sends the sweep back the way it came.',
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
