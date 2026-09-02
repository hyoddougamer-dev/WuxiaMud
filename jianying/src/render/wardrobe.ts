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
  /**
   * Where the point starts, as a fraction along the blade. 0 tapers the whole
   * length, which is a needle.
   *
   * This is what separates a BROAD blade from a long one, and its absence is
   * why the zhanmadao was reported as reading like a pole. A single linear ramp
   * from base to tip is a triangle: however wide you make its base, the eye
   * sees a spike, because almost none of the length is actually at full width.
   * A greatsword is a slab that holds its width and then comes to a point in
   * the last fifth, and that shape cannot be expressed as a ramp.
   */
  readonly taper?: number
  /**
   * The handle, running BEHIND the hand, this long. 0 draws none.
   *
   * There was no grip at all before — every blade began at the fist and went
   * outward — and on a two-handed weapon that is most of the silhouette
   * missing. A 斩马刀 is a long haft with a blade on the end; drawn without the
   * haft it is just a stick, which is exactly what was reported.
   */
  readonly grip?: number
  /** A pommel at the end of the grip, of this half-width. */
  readonly pommel?: number
  /**
   * What carrying this does to the body. See `Stance` below.
   *
   * It hangs off the BLADE rather than off the weapon class on purpose: the
   * blade is the one piece of the class that every screen already resolves —
   * the hub portrait, the creation preview, the contact sheets, the figure in
   * play. Putting the stance here meant every one of them started drawing two
   * distinguishable classes without a single call site changing.
   */
  readonly stance: Stance
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

/**
 * How carrying a weapon changes the body that carries it.
 *
 * This exists because of a report I could not argue with: the six weapon
 * portraits were the same character six times, with a different stroke beside
 * them. The body, the robe, the head, the posture — identical. A class you can
 * only identify by squinting at the object in its hand is not a class, it is a
 * stat block with a picture attached.
 *
 * The fix has to respect the rule the whole art direction rests on: these
 * figures have NO interior detail, so a class can only read through its
 * outline. That rules out the obvious answers — no uniform, no colour scheme,
 * no emblem. What is left is proportion and what juts out past the body:
 *
 *   shoulders  the frame, widened or narrowed
 *   chest      the mass hanging on that frame
 *   waist      where the body folds, which reads as heavy or light
 *   feet       how wide the stance is planted, seen under a short hem
 *   beltBlades throwing knives at the hip, as spikes outside the hip line
 *
 * THERE WAS A SIXTH: a scabbard slung across the zhanmadao's back, added when
 * that class's blade was a thin stroke and something had to say "this person
 * carries something enormous". Once the blade itself became a broad slab with a
 * two-handed haft, the scabbard stopped adding and started subtracting — put
 * side by side at creation size it read as a stray blob beside the ear, which
 * is precisely the "clunky" that was reported. Two marks competing to say the
 * same thing is worse than one saying it well.
 *
 * IMPORTANT — this MULTIPLIES the player's own choices rather than replacing
 * them. A broad woman with a zhanmadao is still broader than a lean one with a
 * zhanmadao, and still narrower than a broad man with one. The class moves the
 * baseline; the look still moves the figure. Anything that overwrote the look
 * would take back a choice made at creation, which is the one thing meta/look.ts
 * exists to prevent.
 */
export interface Stance {
  readonly id: string
  readonly name: string
  /** Multiplier on shoulder span. */
  readonly shoulders: number
  /** Multiplier on the chest's width. */
  readonly chest: number
  /**
   * Multiplier on how far down the waist sits, clamped so it stays a waist.
   * Above 1 lengthens the torso, which reads as weight.
   */
  readonly waist: number
  /** Multiplier on how far apart the feet are planted. */
  readonly feet: number
  /** Throwing knives worn at the left hip, this many. */
  readonly beltBlades: number
}

export const STANCES = {
  /**
   * The baseline. Nothing about a jian or a dao asks the body to change — they
   * are held in one hand at the hip, which is the posture the figure was drawn
   * in to begin with.
   */
  even: {
    id: 'even',
    name: 'Even',
    shoulders: 1,
    chest: 1,
    waist: 1,
    feet: 1,
    beltBlades: 0,
  },
  /**
   * 斩马刀. Everything about this reads as mass. The weapon is heavier than the
   * arm that swings it, so the arm has to be thicker, the feet have to be
   * planted, and the torso has to be long enough to swing from.
   */
  planted: {
    id: 'planted',
    name: 'Planted',
    shoulders: 1.18,
    chest: 1.16,
    waist: 1.14,
    feet: 1.8,
    beltBlades: 0,
  },
  /**
   * 飞刀. The opposite of the above on every axis, deliberately: the two classes
   * have to be told apart in the fifth of a second a player spends looking at
   * their own character, and two silhouettes that both merely "differ" are not
   * enough — they have to differ in OPPOSITE directions.
   */
  poised: {
    id: 'poised',
    name: 'Poised',
    shoulders: 0.88,
    chest: 0.88,
    waist: 0.84,
    feet: 0.55,
    beltBlades: 3,
  },
} as const satisfies Record<string, Stance>

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
    stance: STANCES.even,
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
    stance: STANCES.even,
  },
  {
    id: 'great',
    name: 'Heavy Zhanmadao',
    // BROAD before long. The first version was 58 long and 5 wide, which is a
    // ratio of twelve to one — a pole. Thirteen wide was then too far the other
    // way and came out a paddle. Eight and a half over fifty-six is about seven
    // to one, and — the part that matters more than the ratio — it HOLDS that
    // width for three quarters of its length before the point. The 斩马刀 was a weapon
    // for cutting down cavalry: mass is the entire idea, and mass is the one
    // thing a thin stroke cannot say.
    reach: 56,
    bow: -1.2,
    baseWidth: 8.5,
    tipWidth: 0.9,
    taper: 0.72,
    count: 1,
    spread: 0,
    guard: 6,
    // Two-handed, and the haft is nearly half the whole silhouette. This is
    // what makes it read as a weapon somebody swings with their whole body
    // rather than a blade somebody points.
    grip: 18,
    pommel: 2.6,
    stance: STANCES.planted,
  },
  {
    id: 'feidao',
    name: 'Flying Daggers',
    // SHORT, and that is the whole read. A thrown blade is held in the fingers,
    // not swung from the shoulder, so nothing sticks out past the hand — which
    // is exactly what makes this silhouette impossible to confuse with the
    // zhanmadao's from across a phone screen.
    reach: 22,
    bow: -0.4,
    // Each one is a real little blade rather than a hair: wide enough at the
    // shoulder to have a shape, with the point in the last third. At 2.1 wide
    // and tapering the whole way, three of them overlapping came out as one
    // dark smudge beside the hip — which is what was reported.
    baseWidth: 3.4,
    tipWidth: 0.25,
    taper: 0.62,
    count: 3,
    // Wider, so the three read as THREE. Fanned tightly they were one shape
    // with a ragged edge; fanned at 0.72 with grips on, the butts crossed each
    // other and made a lattice. This is the width where they read as separate
    // blades and still as one hand holding them.
    spread: 0.46,
    // Short grips, so each blade has a butt and a point instead of two points.
    grip: 4,
    stance: STANCES.poised,
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
export function gearFromIds(ids: Partial<Record<keyof Gear, string | undefined>>): Gear {
  return {
    robe: ROBE_BY_ID.get(ids.robe ?? '') ?? DEFAULT_GEAR.robe,
    shoulders: SHOULDER_BY_ID.get(ids.shoulders ?? '') ?? DEFAULT_GEAR.shoulders,
    head: HEAD_BY_ID.get(ids.head ?? '') ?? DEFAULT_GEAR.head,
    blade: BLADE_BY_ID.get(ids.blade ?? '') ?? DEFAULT_GEAR.blade,
  }
}
