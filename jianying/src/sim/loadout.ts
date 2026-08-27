/**
 * Turns what a player owns into the numbers combat actually uses.
 *
 * Two sources feed in, and keeping them distinct is the whole design:
 *
 *   - ATTRIBUTES are permanent. They come from the character record, they were
 *     bought with points earned across many expeditions, and they are the same
 *     at the first second of a run as at the last.
 *   - TECHNIQUES are temporary. They are picked up during a run, they compound
 *     fast, and they are gone when it ends.
 *
 * Attributes are applied first and techniques second, so a technique's stated
 * effect ("+4 damage per sweep") stays literally true no matter what the
 * character has invested. Reversing the order would make every card on the
 * level-up screen quietly lie by a percentage that changes week to week.
 *
 * Everything is derived in one place and recomputed only when something
 * changes. Scattering `if (has('keen'))` through the combat loop would put the
 * cost of every upgrade the player owns into every tick, and would make the
 * effect of a technique impossible to read without hunting through the code.
 */
import type { Loadout } from '../data/techniques'
import type { Item } from '../data/items'
import { DEFAULT_WEAPON, type WeaponClass } from '../data/weapons'
import { type Attributes, emptyAttributes } from '../meta/character'
import { BASE_PICKUP_RADIUS } from './pickups'
import { PLAYER_MAX_HP } from './combat'
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

// --- what one attribute point is worth ----------------------------------
// These four numbers are the entire permanent power curve, and each one is
// quoted verbatim on the hub card so a point is never spent blind.

/** Body: max health per point. */
export const BODY_HP = 7
/** Edge: sweep damage per point. */
export const EDGE_DAMAGE = 1.3
/**
 * Swiftness: multiplier on the interval between sweeps, per point.
 *
 * Multiplicative so that the tenth point is worth the same proportion as the
 * first. Additive would either be irrelevant early or reach a zero interval and
 * divide the game by nothing.
 */
export const SWIFT_INTERVAL = 0.982
/** Spirit: fractional bonus to art damage and radius per point. */
export const SPIRIT_ART = 0.05

/**
 * Baseline stats a character with no attributes and no techniques would have.
 * Exported so the hub can show "120 → 127" rather than a bare number.
 */
export function attributeBonuses(spent: Attributes): {
  maxHp: number
  slashDamage: number
  slashIntervalScale: number
  artScale: number
} {
  return {
    maxHp: spent.body * BODY_HP,
    slashDamage: spent.edge * EDGE_DAMAGE,
    slashIntervalScale: Math.pow(SWIFT_INTERVAL, spent.swift),
    artScale: 1 + spent.spirit * SPIRIT_ART,
  }
}

/** Everything the character permanently brings to an expedition. */
export interface Kit {
  spent: Attributes
  weapon: WeaponClass
  /** Worn armour. Each contributes at most one stat line. */
  worn: readonly Item[]
}

export function emptyKit(): Kit {
  return { spent: emptyAttributes(), weapon: DEFAULT_WEAPON, worn: [] }
}

/** Sums the single stat line off each worn item, by kind. */
function wornBonuses(worn: readonly Item[]): {
  spent: Attributes
  maxHp: number
  damage: number
  ratePct: number
  range: number
  pickupPct: number
  artPct: number
} {
  const out = {
    spent: emptyAttributes(),
    maxHp: 0,
    damage: 0,
    ratePct: 0,
    range: 0,
    pickupPct: 0,
    artPct: 0,
  }
  for (const item of worn) {
    const stat = item.stat
    if (!stat) continue
    switch (stat.kind) {
      case 'body':
      case 'edge':
      case 'swift':
      case 'spirit':
        // Item-granted attributes go through the same maths as bought ones, so
        // "+3 Body" on a robe means exactly what "+3 Body" means in the hub.
        out.spent[stat.kind] += stat.amount
        break
      case 'maxHp':
        out.maxHp += stat.amount
        break
      case 'damage':
        out.damage += stat.amount
        break
      case 'rate':
        out.ratePct += stat.amount
        break
      case 'range':
        out.range += stat.amount
        break
      case 'pickup':
        out.pickupPct += stat.amount
        break
      case 'artPower':
        out.artPct += stat.amount
        break
    }
  }
  return out
}

export function deriveStats(loadout: Loadout, kit: Kit = emptyKit()): Stats {
  const lv = (id: string): number => loadout.get(id) ?? 0
  const gear = wornBonuses(kit.worn)

  // Attributes bought with points and attributes granted by items are the same
  // currency, added before the curve so both reach the same diminishing return.
  const combined: Attributes = {
    body: kit.spent.body + gear.spent.body,
    edge: kit.spent.edge + gear.spent.edge,
    swift: kit.spent.swift + gear.spent.swift,
    spirit: kit.spent.spirit + gear.spent.spirit,
  }
  const attr = attributeBonuses(combined)

  const orbit = lv('orbit')
  const bolt = lv('bolt')
  const nova = lv('nova')
  const art = attr.artScale * (1 + gear.artPct / 100)

  // The weapon supplies the baseline the whole sweep is built on. This is where
  // a class stops being a label: reach, arc and rhythm all come from here.
  const weapon = kit.weapon

  return {
    slashDamage: weapon.damage + attr.slashDamage + gear.damage + lv('keen') * 4,
    // Multiplicative, so each level is worth the same proportion rather than
    // the first one being nearly everything.
    slashInterval:
      weapon.interval *
      attr.slashIntervalScale *
      Math.pow(0.86, lv('swift')) *
      (1 - Math.min(0.6, gear.ratePct / 100)),
    slashRange: weapon.range + gear.range + lv('reach') * 16,
    // Capped just under a full circle: at exactly PI the arc test stops being
    // able to miss, and "which way am I facing" would silently stop mattering.
    slashHalfAngle: Math.min(3.0, weapon.halfAngle + lv('wide') * 0.28),
    moveSpeed: MAX_SPEED * (1 + lv('fleet') * 0.09),
    pickupRadius:
      BASE_PICKUP_RADIUS * (1 + lv('greed') * 0.85 + gear.pickupPct / 100),
    maxHp: PLAYER_MAX_HP + attr.maxHp + gear.maxHp + lv('vigour') * 25,

    orbitBlades: orbit === 0 ? 0 : 1 + orbit,
    orbitDamage: (5 + orbit * 3) * art,

    boltInterval: bolt === 0 ? 0 : 1.5 * Math.pow(0.85, bolt - 1),
    boltDamage: (9 + bolt * 5) * art,

    novaInterval: nova === 0 ? 0 : 4.2 * Math.pow(0.87, nova - 1),
    novaRadius: (95 + nova * 22) * art,
    novaDamage: (12 + nova * 7) * art,
  }
}
