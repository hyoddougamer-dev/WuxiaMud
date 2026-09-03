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
  /**
   * 神 — how hard every 功法 art fires, as a multiplier on its grade.
   *
   * It lived only on `attributeBonuses` before, where it scaled orbit, bolt
   * and nova — three TECHNIQUE CARDS. No art uses any of those three effects,
   * so the attribute the interface calls "art power" was doing nothing at all
   * for the arts, and a thrower who put most of its twenty points into 神 saw
   * no number move anywhere. It is on `Stats` now because `applyArts` is where
   * an art's strength is decided, and that is the only place it can honestly
   * apply.
   */
  artScale: number
}

// --- what one attribute point is worth ----------------------------------
// These four numbers are the entire permanent power curve, and each one is
// quoted verbatim on the hub card so a point is never spent blind.

/** Body: max health per point. */
export const BODY_HP = 7
/**
 * Edge: points of POWER per attribute point.
 *
 * Power is an additive pool of percentages, not flat damage. That one change
 * is the whole of the build system: a pool multiplies against the rate pool
 * and against the weapon, so a point in Edge is worth MORE when you already
 * have Swiftness, and worth LESS the more Edge you already have. With flat
 * damage none of that is true, there is exactly one optimal split, and it
 * never changes no matter what you find on the ground.
 *
 * Deliberately calibrated to land near the old flat value at ordinary totals —
 * at twenty points a zhanmadao went from 56 damage to 54 — because the SHAPE
 * is what is being changed here, not the magnitudes. Changing both at once
 * would leave nothing to compare a measurement against.
 */
export const EDGE_POWER = 4
/**
 * Swiftness: points of SPEED per attribute point.
 *
 * A second pool, kept separate from Power on purpose. Two pools that each
 * scale the same result are what make the optimum move: stacking one has
 * falling value relative to the other, so what you should buy next depends on
 * what you already have — which is the difference between a build and a
 * shopping list.
 *
 * Near the old curve at ordinary totals: twenty points used to give a rate of
 * x1.44 and now gives x1.50.
 */
export const SWIFT_SPEED = 2.5

/**
 * The most Speed the pool will carry, in points.
 *
 * At +150% the sweep lands two and a half times as often, which is where the
 * old fractional cap sat. Past it every class becomes the same blur, and the
 * shape of the sweep IS the class here.
 */
export const SPEED_CAP = 150

/**
 * How much of the Speed pool reaches the legs rather than the arms.
 *
 * A fifth. The pool already divides `slashInterval`; this is the same pool
 * paying a smaller second dividend into movement, so gear that rolls `haste`
 * moves you too and a player has one currency to reason about, not two.
 *
 * IT WAS A THIRD AND THAT WAS TOO MUCH, found by the test rather than by
 * taste: at 0.35 the kiting invariant in tests/regions.spec.ts went from one
 * region to two, because moving faster helps a pilot who never stops more than
 * one who stands and fights. Measured at three settings, 0.2 is the largest
 * that leaves fleeing outliving fighting on the Pass alone. Twenty points is
 * +10% movement — enough to change what reaches you, not enough to make
 * running away the game.
 */
export const MOVE_FROM_SPEED = 0.2
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

/**
 * Guard refills ONLY on levelling up. Nothing else gives it back.
 *
 * Two versions of this were wrong before the harness settled it, and both were
 * wrong for reasons this codebase had already written down.
 *
 * The first regrew guard after four seconds without being hit. That pays a
 * kiting player a permanently full bar while a player who stands and fights
 * never sees it return, and the measurement was blunt: at the same rift target
 * the kiting pilot cleared 100% of runs against the engaged pilot's 50%, in a
 * game whose own design note says kiting should almost never clear the gate.
 *
 * The second regrew it per enemy felled, which looked like the opposite
 * incentive and was in fact worse. `RunState.healCooldown` documents exactly
 * this trap for the 血 art: a mend tied to kills is a STABILISING LOOP,
 * because kills scale with the crowd and the crowd scales with time, so the
 * refill rate rises to meet the damage rate and never falls behind. It made a
 * player who simply stood still survive the full five minutes. Magnitude
 * cannot beat a feedback loop, and I walked into the same one the file warns
 * about a hundred lines above.
 *
 * Levelling is the event that breaks it: it is earned, it scales with the run
 * making PROGRESS rather than with how many bodies happen to be nearby, and it
 * cannot be farmed by running away, since fleeing earns less qi. Guard is a
 * pool you spend between levels and get back for advancing.
 */

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

/**
 * 神 — fractional bonus to how hard every art fires, per point.
 *
 * Five percent a point reads small next to Edge's four points of Power, and it
 * is not: it multiplies the GRADE an art fires at, so it compounds with the
 * 势 behind a discharge rather than adding to a pool. Twenty points is a third
 * again on every art in the scroll, at every grade, on both halves of the loop.
 */
export const SPIRIT_ART = 0.05

/**
 * Baseline stats a character with no attributes and no techniques would have.
 * Exported so the hub can show "120 → 127" rather than a bare number.
 */
export function attributeBonuses(spent: Attributes): {
  maxHp: number
  armour: number
  /** Points into the additive Power pool. */
  power: number
  /** Points into the additive Speed pool. */
  speed: number
  artScale: number
} {
  return {
    maxHp: spent.body * BODY_HP,
    armour: spent.body * BODY_ARMOUR,
    power: spent.edge * EDGE_POWER,
    speed: spent.swift * SWIFT_SPEED,
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
  /**
   * Points into the Speed pool, from `haste` lines.
   *
   * POINTS, not a fraction off the interval. The old form subtracted — an
   * interval of `base x (1 - haste)` — which is a different curve and a
   * different ceiling: it approaches zero and has to be clamped away from
   * dividing the game by nothing. A pool divides instead, so it can never
   * reach zero however much is stacked, and it lands in the same currency as
   * the Swiftness attribute rather than in a second one that behaves subtly
   * differently at the top end.
   */
  speed: number
}

export function wornShape(worn: readonly Worn[]): WornShape {
  const out: WornShape = { vigour: 0, reach: 0, speed: 0 }
  for (const entry of worn) {
    for (const affix of entry.affixes) {
      if (affix.kind === 'vigour') out.vigour += affix.amount
      else if (affix.kind === 'reach') out.reach += affix.amount / 100
      else if (affix.kind === 'haste') out.speed += affix.amount
    }
  }
  // Reach is still capped so a bag full of one line cannot delete the weapon's
  // identity. Speed no longer needs its own clamp here — the pool is capped
  // once, where it is spent, so gear and attributes share one ceiling instead
  // of each having a private one that the other could sail past.
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

  // ---- the two pools --------------------------------------------------
  // Everything that makes the sweep hit harder lands in POWER; everything that
  // makes it land more often lands in SPEED. They are separate on purpose:
  // `damage x rate` is a product, so each pool is worth more when the other is
  // already large, and stacking one alone has falling value against the other.
  // That single property is what makes a build a decision rather than a sum,
  // and there is a test pinning it.
  //
  // `keen` is a technique card rather than a permanent stat, and it pours into
  // the same pool: an in-run card and a worn item saying "+12% damage" should
  // mean the same thing, or the player has to learn two currencies.
  const power = attr.power + lv('keen') * 12
  const speed = Math.min(SPEED_CAP, attr.speed + shape.speed)

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
    slashDamage: weapon.damage * (1 + power / 100),
    // Divided by the pool, then multiplied by what is NOT in it. The `swift`
    // technique stays its own factor rather than joining Speed, and that is
    // the second layer of the model working as intended: a separate multiplier
    // is worth the same proportion however much pool you already have, which
    // is exactly why it is rare and why relics will live here.
    slashInterval: (weapon.interval / (1 + speed / 100)) * Math.pow(0.86, lv('swift')),
    slashRange: (weapon.range + lv('reach') * 16) * (1 + shape.reach),
    // Capped just under a full circle: at exactly PI the arc test stops being
    // able to miss, and "which way am I facing" would silently stop mattering.
    slashHalfAngle: Math.min(3.0, weapon.halfAngle + lv('wide') * 0.28),
    // MOVEMENT READS THE SPEED POOL TOO, and until now it did not.
    //
    // 疾 is called Swiftness and made you swing faster without making you move
    // faster at all — `moveSpeed` answered only to the `fleet` card. In a game
    // where the crowd comes to you, moving is the primary defence, so that left
    // 体 as the only attribute able to keep anybody alive.
    //
    // Measured on the Broken Cliff before this: twenty points of 锋 bought
    // exactly nothing — 44 seconds with none and 44 with eighty, dying at the
    // same second to the same enemy. In fifty sweeps, 3.7x the damage bought
    // ONE extra kill, because everything on that ground already dies to one
    // blow. Offence had no defensive value at all, which made 体 mandatory and
    // the other three optional. That is not a build system, it is one build.
    //
    // A FIFTH of the pool, not all of it: at parity 疾 would be one stat doing
    // two jobs, which is exactly what makes 体 dominant. See MOVE_FROM_SPEED
    // for why a third was too much.
    moveSpeed: MAX_SPEED * (1 + lv('fleet') * 0.09) * (1 + (speed / 100) * MOVE_FROM_SPEED),
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
    artScale: art,
  }
}
