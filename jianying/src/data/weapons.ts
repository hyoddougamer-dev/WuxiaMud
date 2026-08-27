/**
 * Weapons — where a class actually lives in this game.
 *
 * The control scheme spends the entire thumb on movement, so a "class" cannot
 * be a set of buttons. It has to be the shape of the attack that happens on its
 * own, because that is the only thing the player is really reading: how far the
 * blade reaches, how much of the circle it covers, and how often it lands.
 * Change those four numbers and you change where the player has to stand, which
 * is the only decision the game asks — so it changes the game.
 *
 * That is why these are not damage tiers. Every weapon here is meant to be a
 * defensible choice at every depth, and each one asks a different question:
 *
 *   jian    the baseline; nothing it does is wrong
 *   dao     heavier and wider — stand in the crowd, not beside it
 *   great   enormous and slow; the gaps between sweeps are the danger
 *   twin    fast and short; you must be closer than is comfortable
 *   spear   very long, very narrow; position matters more than for anything else
 *   fan     nearly a full circle, but you have to be surrounded to use it
 *
 * DPS is deliberately close across the set (see the balance tests); what
 * differs is the SHAPE, and shape is what the player feels.
 */
import type { BladeStyle } from '../render/wardrobe'
import { BLADE_BY_ID } from '../render/wardrobe'

export interface WeaponClass {
  readonly id: string
  readonly name: string
  /** Chinese name, used as the seal on cards. */
  readonly seal: string
  /** One line describing how it plays, not what it is. */
  readonly blurb: string
  /** Which blade geometry it draws with. */
  readonly bladeId: string

  readonly damage: number
  /** Seconds between sweeps. */
  readonly interval: number
  /** Reach, in world units. */
  readonly range: number
  /** Half-angle of the arc, in radians. PI would be a full circle. */
  readonly halfAngle: number
}

export const WEAPONS: readonly WeaponClass[] = [
  {
    id: 'jian',
    name: 'Straight Jian',
    seal: '剑',
    blurb: 'Even in every way. Nothing it does is wrong.',
    bladeId: 'jian',
    damage: 11,
    interval: 0.46,
    range: 95,
    halfAngle: 1.75,
  },
  {
    id: 'dao',
    name: 'Curved Dao',
    seal: '刀',
    blurb: 'Heavier and wider. Made for standing in the crowd, not beside it.',
    bladeId: 'dao',
    damage: 16,
    interval: 0.6,
    range: 90,
    halfAngle: 2.15,
  },
  {
    id: 'great',
    name: 'Heavy Zhanmadao',
    seal: '斩',
    blurb: 'Enormous and slow. The gaps between sweeps are where you die.',
    bladeId: 'great',
    damage: 30,
    interval: 0.95,
    // Pulled in from 124 because the balance test caught it dominating first
    // the jian and then the dao on BOTH output and coverage — which would have
    // made the starting weapons strictly obsolete the moment one dropped.
    // Area goes as the square of reach, so a small trim buys the trade back.
    //
    // It leaves the zhanmadao where it should be: the highest damage per swing
    // and the highest sustained output in the set, but the LOWEST ground
    // covered per second, because it spends so much of each second not
    // swinging. It is the weapon you take to kill one large thing.
    range: 106,
    halfAngle: 2.35,
  },
  {
    id: 'twin',
    name: 'Twin Blades',
    seal: '双',
    blurb: 'Fast and short. You must stand closer than is comfortable.',
    bladeId: 'twin',
    damage: 7,
    interval: 0.27,
    range: 76,
    halfAngle: 1.35,
  },
  {
    id: 'spear',
    name: 'Long Spear',
    seal: '枪',
    blurb: 'Reaches far and cuts narrow. Where you face matters again.',
    bladeId: 'spear',
    damage: 21,
    interval: 0.62,
    range: 168,
    halfAngle: 0.6,
  },
  {
    id: 'fan',
    name: 'Iron Fan',
    seal: '扇',
    blurb: 'Almost the full circle, barely past arm’s length.',
    bladeId: 'fan',
    // Ten, not nine, so it fells the opening bandit in one sweep. At nine it
    // took two, and a crowd-clearing weapon that cannot clear the weakest
    // thing on the road is a bad first hour for the school that starts with it.
    damage: 10,
    interval: 0.42,
    range: 72,
    // Just under the 3.0 ceiling the arc test allows: at PI the sweep can no
    // longer miss, and "which way am I facing" would silently stop mattering.
    halfAngle: 2.85,
  },
] as const

export const WEAPON_BY_ID = new Map(WEAPONS.map((w) => [w.id, w]))

export const DEFAULT_WEAPON = WEAPONS[0]!

export function weaponById(id: string | undefined): WeaponClass {
  return WEAPON_BY_ID.get(id ?? '') ?? DEFAULT_WEAPON
}

export function bladeOf(weapon: WeaponClass): BladeStyle {
  return BLADE_BY_ID.get(weapon.bladeId) ?? BLADE_BY_ID.get('jian')!
}

/**
 * Damage per second against a single target, ignoring the arc.
 *
 * Used by the balance tests rather than by the game: the point of the roster is
 * that weapons differ in shape, so if any one of them also wins on raw output
 * it stops being a choice and becomes the answer.
 */
export function singleTargetDps(weapon: WeaponClass): number {
  return weapon.damage / weapon.interval
}

/**
 * A crude measure of how much ground a sweep covers per second.
 *
 * The counterweight to `singleTargetDps`: a weapon allowed to lead on both is
 * simply the best one. The spear trades area for reach, the fan trades reach
 * for area, and the tests assert that neither is ahead on both counts.
 */
export function sweptAreaPerSecond(weapon: WeaponClass): number {
  const area = weapon.halfAngle * weapon.range * weapon.range
  return area / weapon.interval
}
