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
import type { OwnedItem } from '../meta/inventory'
import { DEFAULT_WEAPON, type Strike, type WeaponClass } from '../data/weapons'
import { type Attributes, emptyAttributes } from '../meta/character'
import { BASE_PICKUP_RADIUS } from './pickups'
import { PLAYER_MAX_HP } from './combat'
import { MAX_SPEED } from './player'

export interface Stats {
  /**
   * How the attack reaches: an arc, or blades that fly. See data/weapons.ts.
   *
   * The ONE branch the simulation makes. Everything below is read the same way
   * by both — reach becomes flight distance, arc becomes the spread of a
   * volley — so every art works on both classes with no second implementation.
   */
  strike: Strike
  /** Blades per volley. 1 for a sweep. */
  throwCount: number
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

  // --- channels only the arts move, so far ------------------------------
  // Each one is zero (or one, for a multiplier) at rest, which is what lets
  // combat read them unconditionally instead of asking whether an art is on.
  /**
   * Every Nth sweep lands doubled. 0 means never.
   *
   * A COUNTER RATHER THAN A CHANCE, and that is not a style choice. Rolling for
   * a crit would have to draw from the run's rng, and every draw shifts every
   * later drop roll — which would make loot depend on how often you happened to
   * provoke an art, and break the seed + inputs = same run property that
   * replays and the balance harnesses rest on.
   */
  critEvery: number
  /** Seconds until a sweep repeats itself. 0 means it does not. */
  echoDelay: number
  /** Fraction of the sweep's damage the echo carries. */
  echoDamage: number
  /** Distance a struck enemy is shoved outward. 0 means none. */
  pushForce: number
  /** Multiplier on damage taken. 1 is normal; lower is tougher. */
  damageScale: number
  /**
   * Armour. Cuts a fraction of every blow, on a curve — see `afterArmour`.
   *
   * Deliberately NOT a flat subtraction and NOT a flat percentage. Both of
   * those are the same lever as health wearing a different name: one more
   * number that makes every blow smaller by the same proportion. A curve
   * against the SIZE of the blow is a different lever, because it makes armour
   * excellent against a swarm and poor against a boss — which is the first
   * defensive choice this game has ever offered.
   */
  armour: number
  /**
   * Guard: a shield that absorbs damage before health and grows back.
   *
   * The second defensive axis, and the one that pays the dodge back. Health
   * lost is lost for the run; guard returns after GUARD_CALM seconds without
   * being hit, so disengaging is worth something — which it never was before,
   * in a game whose only defensive verb is a dash.
   */
  guard: number
  /** Health returned per enemy felled. 0 means none. */
  healPerKill: number
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
/**
 * Body: armour per point, alongside the health.
 *
 * One attribute now feeds two defensive layers with different shapes, which is
 * what stops it being a single line on a curve. See `afterArmour`.
 */
export const BODY_ARMOUR = 4

/**
 * How much armour it takes to halve a blow of size 1.
 *
 * The whole formula is `blow x K x blow / (armour + K x blow)`, so `armour =
 * K x blow` is exactly half mitigation. At K = 6, 300 armour halves a blow of
 * 50, cuts 71% off a blow of 20, and only 33% off a blow of 100.
 *
 * The constant IS the design: raise it and armour becomes a flat percentage
 * that never cares what hit you, lower it and armour trivialises the swarm.
 */
export const ARMOUR_K = 6

/** Seconds without being hit before guard starts coming back. */
export const GUARD_CALM = 4
/** Fraction of maximum guard returned per second, once calm. */
export const GUARD_REGEN = 0.25

/**
 * What actually lands after armour.
 *
 * Never reduces a blow to nothing: a hit that deals zero is indistinguishable
 * from not being hit, and a player who cannot tell they are being attacked
 * cannot learn to stop it.
 */
export function afterArmour(raw: number, armour: number): number {
  if (raw <= 0) return raw
  if (armour <= 0) return raw
  const scaled = ARMOUR_K * raw
  return Math.max(1, (raw * scaled) / (armour + scaled))
}

/** Spirit: fractional bonus to art damage and radius per point. */
export const SPIRIT_ART = 0.05

/**
 * Baseline stats a character with no attributes and no techniques would have.
 * Exported so the hub can show "120 → 127" rather than a bare number.
 */
export function attributeBonuses(spent: Attributes): {
  maxHp: number
  armour: number
  slashDamage: number
  slashIntervalScale: number
  artScale: number
} {
  return {
    maxHp: spent.body * BODY_HP,
    armour: spent.body * BODY_ARMOUR,
    slashDamage: spent.edge * EDGE_DAMAGE,
    slashIntervalScale: Math.pow(SWIFT_INTERVAL, spent.swift),
    artScale: 1 + spent.spirit * SPIRIT_ART,
  }
}

/**
 * A worn piece: the rolled instance itself.
 *
 * It used to be `{ item, rank }` — a table row plus a number — because a piece
 * had one fixed stat and rank was the only thing that varied. A piece now
 * carries its own rolled lines, so the instance IS the thing worn, and there is
 * no second field that could disagree with it.
 */
export type Worn = OwnedItem

export interface Kit {
  spent: Attributes
  weapon: WeaponClass
  /** Worn pieces. Each contributes every line it rolled. */
  worn: readonly Worn[]
}

export function emptyKit(): Kit {
  return { spent: emptyAttributes(), weapon: DEFAULT_WEAPON, worn: [] }
}

/**
 * Sums the ATTRIBUTE lines the worn pieces rolled.
 *
 * Item-granted attributes go through exactly the same maths as bought ones, so
 * "+3 Body" on a robe means what "+3 Body" means on the hub's spend screen —
 * including reaching the same diminishing return, which an earlier design's raw
 * per-stat channels bypassed entirely.
 *
 * The three lines that are NOT attributes — health, reach and sweep speed —
 * are summed separately by `wornShape`, because they act on the sweep rather
 * than on the character.
 */
export function wornAttributes(worn: readonly Worn[]): Attributes {
  const out = emptyAttributes()
  for (const entry of worn) {
    for (const affix of entry.affixes) {
      if (affix.kind === 'body' || affix.kind === 'edge' || affix.kind === 'swift' || affix.kind === 'spirit') {
        out[affix.kind] += affix.amount
      }
    }
  }
  return out
}

/** What the worn pieces do to the SHAPE of the sweep, and to raw health. */
export interface WornShape {
  /** Flat health, added after the Body curve. */
  vigour: number
  /** Fraction added to the sweep's reach — 0.08 is +8%. */
  reach: number
  /** Fraction taken OFF the interval between sweeps. */
  haste: number
}

export function wornShape(worn: readonly Worn[]): WornShape {
  const out: WornShape = { vigour: 0, reach: 0, haste: 0 }
  for (const entry of worn) {
    for (const affix of entry.affixes) {
      if (affix.kind === 'vigour') out.vigour += affix.amount
      else if (affix.kind === 'reach') out.reach += affix.amount / 100
      else if (affix.kind === 'haste') out.haste += affix.amount / 100
    }
  }
  // Capped so a bag full of one line cannot delete the weapon's identity: at
  // 90% off the interval every class becomes the same blur, and the shape of
  // the sweep IS the class here.
  out.haste = Math.min(0.6, out.haste)
  out.reach = Math.min(1.5, out.reach)
  return out
}

export function deriveStats(loadout: Loadout, kit: Kit = emptyKit()): Stats {
  const lv = (id: string): number => loadout.get(id) ?? 0
  const gear = wornAttributes(kit.worn)
  const shape = wornShape(kit.worn)

  // Attributes bought with points and attributes granted by items are the same
  // currency, added before the curve so both reach the same diminishing return.
  const combined: Attributes = {
    body: kit.spent.body + gear.body,
    edge: kit.spent.edge + gear.edge,
    swift: kit.spent.swift + gear.swift,
    spirit: kit.spent.spirit + gear.spirit,
  }
  const attr = attributeBonuses(combined)

  const orbit = lv('orbit')
  const bolt = lv('bolt')
  const nova = lv('nova')
  const art = attr.artScale

  // The weapon supplies the baseline the whole sweep is built on. This is where
  // a class stops being a label: reach, arc and rhythm all come from here.
  const weapon = kit.weapon

  return {
    strike: weapon.strike,
    throwCount: weapon.throwCount,
    slashDamage: weapon.damage + attr.slashDamage + lv('keen') * 4,
    // Multiplicative, so each level is worth the same proportion rather than
    // the first one being nearly everything.
    slashInterval: weapon.interval * attr.slashIntervalScale * Math.pow(0.86, lv('swift')) * (1 - shape.haste),
    slashRange: (weapon.range + lv('reach') * 16) * (1 + shape.reach),
    // Capped just under a full circle: at exactly PI the arc test stops being
    // able to miss, and "which way am I facing" would silently stop mattering.
    slashHalfAngle: Math.min(3.0, weapon.halfAngle + lv('wide') * 0.28),
    moveSpeed: MAX_SPEED * (1 + lv('fleet') * 0.09),
    pickupRadius: BASE_PICKUP_RADIUS * (1 + lv('greed') * 0.85),
    maxHp: PLAYER_MAX_HP + attr.maxHp + lv('vigour') * 25 + shape.vigour,
    armour: attr.armour,
    // Guard scales off the same pool as health for now, so it is never the
    // only thing keeping somebody alive before any item that grants it exists.
    // It is deliberately small: this layer is meant to reward disengaging, not
    // to be a second health bar.
    guard: Math.round((PLAYER_MAX_HP + attr.maxHp) * 0.18),

    orbitBlades: orbit === 0 ? 0 : 1 + orbit,
    orbitDamage: (5 + orbit * 3) * art,

    boltInterval: bolt === 0 ? 0 : 1.5 * Math.pow(0.85, bolt - 1),
    boltDamage: (9 + bolt * 5) * art,

    novaInterval: nova === 0 ? 0 : 4.2 * Math.pow(0.87, nova - 1),
    novaRadius: (95 + nova * 22) * art,
    novaDamage: (12 + nova * 7) * art,

    // At rest. Only the arts move these, and only while a condition holds —
    // see sim/arts.ts. There is deliberately no technique that grants them:
    // a card that made you tougher always would be a different game.
    critEvery: 0,
    echoDelay: 0,
    echoDamage: 0,
    pushForce: 0,
    damageScale: 1,
    healPerKill: 0,
  }
}
