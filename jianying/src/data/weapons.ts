/**
 * The two classes.
 *
 * The control scheme spends the entire thumb on movement, so a "class" cannot
 * be a set of buttons. It has to be the shape of the attack that happens on its
 * own — and, above everything else, WHERE THAT ATTACK MAKES YOU STAND. That is
 * the only decision this game asks of a player, so it is the only axis a class
 * can meaningfully sit on.
 *
 * WHY TWO, WHEN THERE WERE SIX. A playtest said the game was confusing and the
 * classes were buggy, and rendering the six portraits side by side settled the
 * argument in one image: they were the same swordsman six times with a
 * differently shaped line beside them. Six weapons, thirty arts, five of which
 * a player ever sees at once — and the differences between them were 20% of
 * reach here and 0.4 radians there. That is not six classes; it is one class
 * with a tuning slider, spread thin enough that nothing was finished and
 * everything had somewhere to hide a bug.
 *
 * These two sit at the opposite ends of the only axis that matters:
 *
 *   斩马刀  You stand IN the crowd. An enormous, slow arc that takes eight at
 *          once — and between sweeps you are holding a heavy thing and nothing
 *          is protecting you.
 *   飞刀    You stay OUT of the crowd. Blades that leave your hand and fly, so
 *          distance is your weapon; let anything close and you have nothing.
 *
 * A player can feel that difference in three seconds without reading a number,
 * which is the test six weapons kept failing.
 */
import type { BladeStyle } from '../render/wardrobe'
import { BLADE_BY_ID } from '../render/wardrobe'

/**
 * How the attack reaches an enemy — the one branch the simulation makes.
 *
 * `sweep` cuts an arc around the swordsman; `throw` looses blades that travel.
 * Everything else about a weapon is numbers, and both kinds read the SAME
 * numbers (see Stats in sim/loadout.ts) so that every art works on both
 * classes. Reach becomes flight distance, arc becomes the spread of the
 * volley, rate and damage mean what they always meant.
 */
export type Strike = 'sweep' | 'throw'

export interface WeaponClass {
  readonly id: string
  readonly name: string
  /** Chinese name, used as the seal on cards. */
  readonly seal: string
  /** One line describing how it plays, not what it is. */
  readonly blurb: string
  /** Which blade geometry it draws with. */
  readonly bladeId: string
  readonly strike: Strike

  readonly damage: number
  /** Seconds between sweeps, or between volleys. */
  readonly interval: number
  /** Reach of the arc, or how far a thrown blade flies, in world units. */
  readonly range: number
  /** Half-angle of the arc, or half the spread of a volley, in radians. */
  readonly halfAngle: number
  /** Blades per volley. Always 1 for a sweep. */
  readonly throwCount: number
}

export const WEAPONS: readonly WeaponClass[] = [
  {
    id: 'great',
    name: 'Heavy Zhanmadao',
    seal: '斩',
    blurb: 'Enormous and slow. It takes the whole crowd — if you are standing in it.',
    bladeId: 'great',
    strike: 'sweep',
    // Carried over from the six-weapon roster, where these were tuned against
    // each other and measured. The zhanmadao was already the extreme end of
    // "stand in the crowd"; it did not need changing to become one of two, only
    // to stop being one of six.
    damage: 30,
    interval: 0.95,
    range: 106,
    halfAngle: 2.35,
    throwCount: 1,
  },
  {
    id: 'feidao',
    name: 'Flying Daggers',
    seal: '飞刀',
    blurb: 'Three blades a throw, and none of them come back. Distance is the weapon.',
    bladeId: 'feidao',
    strike: 'throw',
    // Tuned to sit at the zhanmadao's single-target output when every blade
    // lands, and well UNDER it when they do not — which is the trade. A volley
    // that misses is gone; a sweep that misses comes round again in a second.
    //
    //   3 blades x 11 damage / 0.5s = 66 dps if all three land
    //   1 blade  x 11 damage / 0.5s = 22 dps against a single distant target
    //   zhanmadao: 30 / 0.95        = 32 dps, but across eight bodies at once
    //
    // So the daggers beat it on a packed line and lose to it badly on one
    // target — the opposite shape, which is the whole point.
    damage: 11,
    interval: 0.5,
    // Flight distance. Longer than any sweep in the old roster, because the
    // entire class is the promise that you never have to be close.
    range: 250,
    // The spread of the fan, not an arc that hits everything inside it. Narrow
    // enough that aim matters, wide enough that a volley can catch two.
    halfAngle: 0.22,
    throwCount: 3,
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
 * Damage per second against a single target.
 *
 * A THROWN weapon only lands its whole volley on a packed line; against one
 * distant body a fanned volley puts one blade on it. So the honest single-
 * target figure counts one blade, and `volleyDps` below counts them all. The
 * gap between those two numbers IS the class.
 */
export function singleTargetDps(weapon: WeaponClass): number {
  return weapon.damage / weapon.interval
}

/**
 * A crude measure of how much ground an attack threatens per second.
 *
 * The counterweight to `singleTargetDps`: a weapon allowed to lead on both is
 * simply the best one. For a sweep this is the wedge it cuts; for a volley it
 * is the much narrower corridor the blades fly down. The tests assert the two
 * classes trade rather than one dominating.
 */
export function sweptAreaPerSecond(weapon: WeaponClass): number {
  const area = weapon.halfAngle * weapon.range * weapon.range
  return area / weapon.interval
}
