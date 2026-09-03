/**
 * Equipment that drops and is kept.
 *
 * Two rules shape every row in this file, and both exist to keep a loot game
 * playable on a phone with one thumb.
 *
 * ONE LINE OF STAT. Not eight. A phone screen cannot hold a comparison table,
 * and a player who has to read one during a game about not standing still will
 * stop reading it. So an item is a silhouette plus a single sentence, and
 * "is this better?" is answerable in the time it takes to glance.
 *
 * IT MUST CHANGE THE SHAPE. These figures have no interior detail, so an item
 * that does not alter the outline is invisible — trim, texture and material
 * simply do not exist at this size. Every item therefore points at a wardrobe
 * style, and no two items in a slot may share one.
 *
 * Weapons are the exception to the one-line rule, and deliberately so: a weapon
 * carries a whole WeaponClass, because changing how the blade sweeps is the
 * point of picking one up. See data/weapons.ts.
 */

export type Slot = 'weapon' | 'robe' | 'shoulders' | 'head'

export interface Item {
  readonly id: string
  readonly name: string
  readonly slot: Slot
  /**
   * Wardrobe style for armour, or weapon id for a weapon. This is the half of
   * the item the player actually sees.
   */
  readonly styleId: string
  /** Lowest expedition depth this can drop from. */
  readonly depth: number
}

/**
 * The table.
 *
 * Every armour style in the wardrobe appears exactly once, so the set of items
 * and the set of silhouettes are the same set — there is no item you can own
 * that you cannot see, and no silhouette that is unreachable.
 */
export const ITEMS: readonly Item[] = [
  // --- weapons ---------------------------------------------------------
  // No stat line: the weapon IS the change, and adding a number on top would
  // bury the thing the player is meant to notice.
  // Two weapons, both available from the first road. A class you cannot find
  // until depth 4 is a class most players never meet — which was true of the
  // zhanmadao for the whole life of the six-weapon roster.
  { id: 'w-great', name: 'Heavy Zhanmadao', slot: 'weapon', styleId: 'great', depth: 1 },
  { id: 'w-feidao', name: 'Flying Daggers', slot: 'weapon', styleId: 'feidao', depth: 1 },

  // --- robes -------------------------------------------------------------
  {
    id: 'r-plain',
    name: 'Hemp Robe',
    slot: 'robe',
    styleId: 'plain',
    depth: 1,
  },
  {
    id: 'r-travelling',
    name: 'Travelling Coat',
    slot: 'robe',
    styleId: 'travelling',
    depth: 1,
  },
  {
    id: 'r-lamellar',
    name: 'Lamellar Skirt',
    slot: 'robe',
    styleId: 'lamellar',
    depth: 2,
  },
  {
    id: 'r-layered',
    name: 'Layered Vestment',
    slot: 'robe',
    styleId: 'layered',
    depth: 3,
  },
  {
    id: 'r-tattered',
    name: 'Tattered Shroud',
    slot: 'robe',
    styleId: 'tattered',
    depth: 4,
  },
  {
    id: 'r-court',
    name: 'Court Silks',
    slot: 'robe',
    styleId: 'court',
    depth: 5,
  },

  // --- shoulders ---------------------------------------------------------
  {
    id: 's-plain',
    name: 'Bound Sleeves',
    slot: 'shoulders',
    styleId: 'plain',
    depth: 1,
  },
  {
    id: 's-bare',
    name: 'Bare Arms',
    slot: 'shoulders',
    styleId: 'bare',
    depth: 1,
  },
  {
    id: 's-pauldron',
    name: 'Iron Pauldrons',
    slot: 'shoulders',
    styleId: 'pauldron',
    depth: 2,
  },
  {
    id: 's-wide',
    name: 'Wide Sleeves',
    slot: 'shoulders',
    styleId: 'wide',
    depth: 3,
  },
  {
    id: 's-mantle',
    name: 'Feather Mantle',
    slot: 'shoulders',
    styleId: 'mantle',
    depth: 5,
  },

  // --- headwear ----------------------------------------------------------
  {
    id: 'h-topknot',
    name: 'Bound Topknot',
    slot: 'head',
    styleId: 'topknot',
    depth: 1,
  },
  {
    id: 'h-bare',
    name: 'Loose Hair',
    slot: 'head',
    styleId: 'bare',
    depth: 1,
  },
  {
    id: 'h-hat',
    name: 'Bamboo Hat',
    slot: 'head',
    styleId: 'hat',
    depth: 2,
  },
  {
    id: 'h-crown',
    name: 'Jade Crown',
    slot: 'head',
    styleId: 'crown',
    depth: 4,
  },
  {
    id: 'h-veiled',
    name: 'Veiled Hat',
    slot: 'head',
    styleId: 'veiled',
    depth: 6,
  },
] as const

export const ITEM_BY_ID = new Map(ITEMS.map((i) => [i.id, i]))

export const SLOTS: readonly Slot[] = ['weapon', 'head', 'shoulders', 'robe'] as const

export const SLOT_NAMES: Record<Slot, string> = {
  weapon: 'Weapon',
  head: 'Head',
  shoulders: 'Shoulders',
  robe: 'Robe',
}

/**
 * Chance that felling an enemy drops something, at a given depth.
 *
 * TUNED DOWN, twice now, and the second time by measuring rather than by feel.
 *
 * It was raised sharply when loot became the in-run progression: the purple
 * sword at the halfway mark was meant to be what made minute eight differ from
 * minute one, and at two finds an expedition that beat almost never landed.
 * That justification is gone — a piece is no longer worn during the run (see
 * main.ts), so a find is once again something read on the way out, and the
 * quantity that made the mid-run beat likely just makes the end screen a wall.
 *
 * A playtest reported it as too high, so it was measured against the real kill
 * counts tools/runLength.mts produces rather than adjusted by taste:
 *
 *   region              kills   old      new
 *   The Post Road         264   7.9      3.3   (+1 from the boss)
 *   The Reed Marsh        107   3.6      1.6
 *   The Ghost Market      105   4.4      2.0
 *
 * Three or four finds on a long expedition, most of them grey. What keeps a
 * find special is the ladder — see data/rarity.ts — not starving the player.
 */
export function dropChance(depth: number): number {
  return 0.0125 + Math.max(0, depth - 1) * 0.0022
}

/** The bases that can drop at `depth`. */
export function dropTable(depth: number): Item[] {
  return ITEMS.filter((item) => item.depth <= depth)
}

/** How much likelier a base the player has never seen is than a familiar one. */
const NEW_BASE_BIAS = 3

/**
 * Picks the BASE a drop is rolled from. Its rarity and lines are rolled
 * separately — see data/rarity.ts and data/affixes.ts.
 *
 * The bias toward unseen bases is gentler than it was. It existed because a
 * repeat used to be worthless: the same Hemp Robe was the same +2 Body forever,
 * so half the drops coming back "already yours" made the loop a slot machine
 * that mostly paid nothing. A repeat is now a fresh roll of the lines, so a
 * second Hemp Robe is a real find — the bias only keeps the silhouettes varied,
 * which is a much smaller job.
 */
export function rollDrop(depth: number, pick: number, seen: ReadonlySet<string>): Item | null {
  const table = dropTable(depth)
  if (table.length === 0) return null
  const weights = table.map((item) => (seen.has(item.id) ? 1 : NEW_BASE_BIAS))
  const total = weights.reduce((a, b) => a + b, 0)
  let target = pick * total
  for (let i = 0; i < table.length; i++) {
    target -= weights[i]!
    if (target <= 0) return table[i]!
  }
  return table[table.length - 1]!
}
