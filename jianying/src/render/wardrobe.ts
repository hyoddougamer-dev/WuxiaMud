/**
 * Equipment as brush geometry.
 *
 * This file is the answer to a question that decides the whole art direction:
 * can a game drawn in ink silhouettes show visual progression, and can every
 * item look genuinely different?
 *
 * With sprites the answer is "only if someone draws each one" — forty items is
 * forty drawings, and that is the cost that quietly kills art-heavy scope. But
 * nothing here is drawn. Every mark on the swordsman is a spine swept by a
 * width profile, so a piece of equipment is not a picture: it is a handful of
 * numbers that change where the spines go. Robes get longer and flare wider,
 * sleeves grow into court silks, a bamboo hat is a wide flat ellipse above the
 * head, a sabre is the same blade stroke with the bow turned up.
 *
 * That makes variety combinatorial instead of linear. Five slots with eight
 * options each is thirty-two thousand silhouettes for the cost of forty rows of
 * numbers, and — the part that matters — each one is a genuinely different
 * OUTLINE, not a recolour.
 *
 * The constraint that comes with it, stated plainly because it shapes every
 * item added later: these figures have no interior detail, so an item can only
 * read through its silhouette. Filigree, trim, texture and material are all
 * invisible at this size. An item must change the shape of the character or it
 * changes nothing, and the four accent colours are the only other channel.
 */

export interface RobeStyle {
  readonly id: string
  readonly name: string
  /** Top of the robe in local units (negative is up). */
  readonly top: number
  /** Where the hem lands. Below zero rises off the ground. */
  readonly bottom: number
  readonly topWidth: number
  readonly hemWidth: number
  /** Sideways bend of the silhouette. */
  readonly bow: number
  /** Optional outer layer, drawn over the robe. */
  readonly overlay?: { top: number; bottom: number; topWidth: number; hemWidth: number }
  /** A belt bar across the waist, at this height. */
  readonly belt?: number
}

export interface ShoulderStyle {
  readonly id: string
  readonly name: string
  /** Half-width of the shoulder bar. */
  readonly span: number
  /** Thickness of the shoulder bar. */
  readonly cap: number
  /** How far out and down the sleeves reach. */
  readonly sleeveOut: number
  readonly sleeveDrop: number
  readonly sleeveWidth: number
  readonly sleeveBow: number
  /** Armoured caps outboard of the shoulders, of this size. */
  readonly pauldron?: number
  /** A collar or cape spreading to this half-width. */
  readonly mantle?: number
}

export interface HeadStyle {
  readonly id: string
  readonly name: string
  readonly headWidth: number
  /** A topknot rising from the crown. */
  readonly knot?: { rise: number; width: number; lean: number }
  /** A 斗笠 — a wide flat disc, the most distinctive silhouette in the set. */
  readonly hat?: { span: number; thickness: number; lift: number }
  /** A tall 冠, squared off rather than tapered. */
  readonly crown?: { rise: number; width: number }
  /** Cloth hanging from the brim. */
  readonly veil?: number
}

export interface BladeStyle {
  readonly id: string
  readonly name: string
  /** How far the blade reaches from the hand. */
  readonly reach: number
  /** Curve. Negative bows the edge one way, positive the other. */
  readonly bow: number
  readonly baseWidth: number
  readonly tipWidth: number
  /** More than one blade, fanned by `spread` radians. */
  readonly count: number
  readonly spread: number
  /** A crossguard of this half-width. */
  readonly guard?: number
}

// --- robes ---------------------------------------------------------------

export const ROBES: readonly RobeStyle[] = [
  {
    id: 'plain',
    name: 'Hemp Robe',
    top: -29,
    bottom: 0,
    topWidth: 8,
    hemWidth: 24,
    bow: 0,
  },
  {
    id: 'travelling',
    name: 'Travelling Coat',
    // Cut short for the road: a narrower, more upright silhouette that reads as
    // somebody who expects to run.
    top: -27,
    bottom: -3,
    topWidth: 7,
    hemWidth: 17,
    bow: 0,
  },
  {
    id: 'court',
    name: 'Court Silks',
    top: -31,
    bottom: 1,
    topWidth: 9,
    hemWidth: 36,
    bow: 0,
  },
  {
    id: 'layered',
    name: 'Layered Vestment',
    top: -29,
    bottom: 0,
    topWidth: 8,
    hemWidth: 26,
    bow: 0,
    overlay: { top: -31, bottom: -13, topWidth: 13, hemWidth: 25 },
  },
  {
    id: 'lamellar',
    name: 'Lamellar Skirt',
    top: -28,
    bottom: -1,
    topWidth: 11,
    hemWidth: 21,
    bow: 0,
    belt: -22,
  },
  {
    id: 'tattered',
    name: 'Tattered Shroud',
    top: -30,
    bottom: 2,
    topWidth: 7,
    hemWidth: 29,
    // A bent hem reads as cloth caught mid-drift rather than a bell.
    bow: 3.5,
  },
] as const

// --- shoulders -----------------------------------------------------------

export const SHOULDERS: readonly ShoulderStyle[] = [
  {
    id: 'plain',
    name: 'Bound Sleeves',
    span: 9,
    cap: 11,
    sleeveOut: 13,
    sleeveDrop: 13,
    sleeveWidth: 6,
    sleeveBow: 1.5,
  },
  {
    id: 'wide',
    name: 'Wide Sleeves',
    span: 10,
    cap: 12,
    sleeveOut: 21,
    sleeveDrop: 16,
    sleeveWidth: 11,
    sleeveBow: 4,
  },
  {
    id: 'pauldron',
    name: 'Iron Pauldrons',
    span: 10,
    cap: 12,
    sleeveOut: 13,
    sleeveDrop: 12,
    sleeveWidth: 6,
    sleeveBow: 1.2,
    pauldron: 9,
  },
  {
    id: 'mantle',
    name: 'Feather Mantle',
    span: 9,
    cap: 11,
    sleeveOut: 12,
    sleeveDrop: 14,
    sleeveWidth: 6,
    sleeveBow: 1.5,
    mantle: 17,
  },
  {
    id: 'bare',
    name: 'Bare Arms',
    span: 8,
    cap: 9,
    sleeveOut: 11,
    sleeveDrop: 15,
    sleeveWidth: 3.6,
    sleeveBow: 0.8,
  },
] as const

// --- headwear ------------------------------------------------------------

export const HEADS: readonly HeadStyle[] = [
  {
    id: 'topknot',
    name: 'Topknot',
    headWidth: 10,
    knot: { rise: 6, width: 3.8, lean: -1 },
  },
  {
    id: 'bare',
    name: 'Loose Hair',
    headWidth: 10.5,
  },
  {
    id: 'hat',
    name: 'Bamboo Hat',
    // The clearest silhouette in the whole set: a wide flat disc reads as a
    // different character from across the screen, which is the bar every item
    // in an ink game has to clear.
    headWidth: 9.5,
    hat: { span: 17, thickness: 4.5, lift: 4 },
  },
  {
    id: 'crown',
    name: 'Jade Crown',
    headWidth: 10,
    crown: { rise: 8, width: 6.5 },
  },
  {
    id: 'veiled',
    name: 'Veiled Hat',
    headWidth: 9.5,
    hat: { span: 15, thickness: 4, lift: 4 },
    veil: 13,
  },
] as const

// --- blades --------------------------------------------------------------

export const BLADES: readonly BladeStyle[] = [
  {
    id: 'jian',
    name: 'Straight Jian',
    reach: 40,
    bow: -1.6,
    baseWidth: 2.8,
    tipWidth: 0.25,
    count: 1,
    spread: 0,
  },
  {
    id: 'dao',
    name: 'Curved Dao',
    reach: 42,
    bow: -7,
    baseWidth: 3.6,
    tipWidth: 0.9,
    count: 1,
    spread: 0,
  },
  {
    id: 'great',
    name: 'Heavy Zhanmadao',
    reach: 58,
    bow: -2.5,
    baseWidth: 5.2,
    tipWidth: 1.4,
    count: 1,
    spread: 0,
    guard: 5,
  },
  {
    id: 'twin',
    name: 'Twin Blades',
    reach: 34,
    bow: -1.2,
    baseWidth: 2.4,
    tipWidth: 0.25,
    count: 2,
    spread: 0.34,
  },
  {
    id: 'spear',
    name: 'Long Spear',
    reach: 76,
    bow: -0.6,
    baseWidth: 1.9,
    tipWidth: 0.3,
    count: 1,
    spread: 0,
    guard: 3,
  },
  {
    id: 'fan',
    name: 'Iron Fan',
    reach: 26,
    bow: -2,
    baseWidth: 2.2,
    tipWidth: 1.6,
    count: 5,
    spread: 0.2,
  },
] as const

export interface Gear {
  robe: RobeStyle
  shoulders: ShoulderStyle
  head: HeadStyle
  blade: BladeStyle
}

const byId = <T extends { id: string }>(list: readonly T[]): Map<string, T> =>
  new Map(list.map((item) => [item.id, item]))

export const ROBE_BY_ID = byId(ROBES)
export const SHOULDER_BY_ID = byId(SHOULDERS)
export const HEAD_BY_ID = byId(HEADS)
export const BLADE_BY_ID = byId(BLADES)

/** What a swordsman with nothing earned looks like. */
export const DEFAULT_GEAR: Gear = {
  robe: ROBES[0]!,
  shoulders: SHOULDERS[0]!,
  head: HEADS[0]!,
  blade: BLADES[0]!,
}

/** Resolves stored ids into styles, falling back rather than throwing. */
export function gearFromIds(ids: Partial<Record<keyof Gear, string>>): Gear {
  return {
    robe: ROBE_BY_ID.get(ids.robe ?? '') ?? DEFAULT_GEAR.robe,
    shoulders: SHOULDER_BY_ID.get(ids.shoulders ?? '') ?? DEFAULT_GEAR.shoulders,
    head: HEAD_BY_ID.get(ids.head ?? '') ?? DEFAULT_GEAR.head,
    blade: BLADE_BY_ID.get(ids.blade ?? '') ?? DEFAULT_GEAR.blade,
  }
}
