/**
 * Turns the techniques a player has taken into the numbers combat actually uses.
 *
 * Everything is derived in one place and recomputed only when the loadout
 * changes. Scattering `if (has('keen'))` through the combat loop would put the
 * cost of every upgrade the player owns into every tick, and would make the
 * effect of a technique impossible to read without hunting through the code.
 */
import type { Loadout } from '../data/techniques'
import { BASE_PICKUP_RADIUS } from './pickups'
import {
  SLASH_DAMAGE,
  SLASH_HALF_ANGLE,
  SLASH_INTERVAL,
  SLASH_RANGE,
  PLAYER_MAX_HP,
} from './combat'
import { MAX_SPEED } from './player'

export interface Stats {
  slashDamage: number
  slashInterval: number
  slashRange: number
  slashHalfAngle: number
  moveSpeed: number
  pickupRadius: number
  maxHp: number
  /** Guardian Blades: 0 means the art is not owned. */
  orbitBlades: number
  orbitDamage: number
  /** Sword Qi: seconds between bolts, 0 means not owned. */
  boltInterval: number
  boltDamage: number
  /** Thunder Palm: seconds between shockwaves, 0 means not owned. */
  novaInterval: number
  novaRadius: number
  novaDamage: number
}

export function deriveStats(loadout: Loadout): Stats {
  const lv = (id: string): number => loadout.get(id) ?? 0

  const orbit = lv('orbit')
  const bolt = lv('bolt')
  const nova = lv('nova')

  return {
    slashDamage: SLASH_DAMAGE + lv('keen') * 4,
    // Multiplicative, so each level is worth the same proportion rather than
    // the first one being nearly everything.
    slashInterval: SLASH_INTERVAL * Math.pow(0.86, lv('swift')),
    slashRange: SLASH_RANGE + lv('reach') * 16,
    // Capped just under a full circle: at exactly PI the arc test stops being
    // able to miss, and "which way am I facing" would silently stop mattering.
    slashHalfAngle: Math.min(3.0, SLASH_HALF_ANGLE + lv('wide') * 0.28),
    moveSpeed: MAX_SPEED * (1 + lv('fleet') * 0.09),
    pickupRadius: BASE_PICKUP_RADIUS * (1 + lv('greed') * 0.85),
    maxHp: PLAYER_MAX_HP + lv('vigour') * 25,

    orbitBlades: orbit === 0 ? 0 : 1 + orbit,
    orbitDamage: 5 + orbit * 3,

    boltInterval: bolt === 0 ? 0 : 1.5 * Math.pow(0.85, bolt - 1),
    boltDamage: 9 + bolt * 5,

    novaInterval: nova === 0 ? 0 : 4.2 * Math.pow(0.87, nova - 1),
    novaRadius: 95 + nova * 22,
    novaDamage: 12 + nova * 7,
  }
}
