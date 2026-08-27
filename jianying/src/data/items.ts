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
import type { AttributeId } from '../meta/character'

export type Slot = 'weapon' | 'robe' | 'shoulders' | 'head'

/** What an item's single line can say. */
export type StatKind =
  | AttributeId
  | 'maxHp'
  | 'damage'
  | 'rate'
  | 'range'
  | 'pickup'
  | 'artPower'

export interface ItemStat {
  readonly kind: StatKind
  readonly amount: number
}

export interface Item {
  readonly id: string
  readonly name: string
  readonly slot: Slot
  /**
   * Wardrobe style for armour, or weapon id for a weapon. This is the half of
   * the item the player actually sees.
   */
  readonly styleId: string
  /** The single line. Weapons may have none — the weapon itself is the line. */
  readonly stat?: ItemStat
  /** Lowest expedition depth this can drop from. */
  readonly depth: number
  /** 0 common, 1 uncommon, 2 rare. Drives the accent colour and the drop odds. */
  readonly rarity: 0 | 1 | 2
}

/** Renders a stat as the sentence shown on the card. */
export function statLine(stat: ItemStat | undefined): string {
  if (!stat) return ''
  const n = stat.amount
  switch (stat.kind) {
    case 'body':
      return `+${n} Body`
    case 'edge':
      return `+${n} Edge`
    case 'swift':
      return `+${n} Swiftness`
    case 'spirit':
      return `+${n} Spirit`
    case 'maxHp':
      return `+${n} max health`
    case 'damage':
      return `+${n} sweep damage`
    case 'rate':
      return `Sweep ${n}% faster`
    case 'range':
      return `+${n} sweep range`
    case 'pickup':
      return `Draw qi ${n}% further`
    case 'artPower':
      return `+${n}% art power`
    default:
      return ''
  }
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
  { id: 'w-jian', name: 'Straight Jian', slot: 'weapon', styleId: 'jian', depth: 1, rarity: 0 },
  { id: 'w-dao', name: 'Curved Dao', slot: 'weapon', styleId: 'dao', depth: 1, rarity: 0 },
  { id: 'w-twin', name: 'Twin Blades', slot: 'weapon', styleId: 'twin', depth: 2, rarity: 1 },
  { id: 'w-fan', name: 'Iron Fan', slot: 'weapon', styleId: 'fan', depth: 2, rarity: 1 },
  { id: 'w-spear', name: 'Long Spear', slot: 'weapon', styleId: 'spear', depth: 3, rarity: 1 },
  { id: 'w-great', name: 'Heavy Zhanmadao', slot: 'weapon', styleId: 'great', depth: 4, rarity: 2 },

  // --- robes -------------------------------------------------------------
  {
    id: 'r-plain',
    name: 'Hemp Robe',
    slot: 'robe',
    styleId: 'plain',
    stat: { kind: 'maxHp', amount: 10 },
    depth: 1,
    rarity: 0,
  },
  {
    id: 'r-travelling',
    name: 'Travelling Coat',
    slot: 'robe',
    styleId: 'travelling',
    stat: { kind: 'swift', amount: 2 },
    depth: 1,
    rarity: 0,
  },
  {
    id: 'r-lamellar',
    name: 'Lamellar Skirt',
    slot: 'robe',
    styleId: 'lamellar',
    stat: { kind: 'maxHp', amount: 28 },
    depth: 2,
    rarity: 1,
  },
  {
    id: 'r-layered',
    name: 'Layered Vestment',
    slot: 'robe',
    styleId: 'layered',
    stat: { kind: 'body', amount: 3 },
    depth: 3,
    rarity: 1,
  },
  {
    id: 'r-tattered',
    name: 'Tattered Shroud',
    slot: 'robe',
    styleId: 'tattered',
    stat: { kind: 'pickup', amount: 45 },
    depth: 4,
    rarity: 1,
  },
  {
    id: 'r-court',
    name: 'Court Silks',
    slot: 'robe',
    styleId: 'court',
    stat: { kind: 'artPower', amount: 22 },
    depth: 5,
    rarity: 2,
  },

  // --- shoulders ---------------------------------------------------------
  {
    id: 's-plain',
    name: 'Bound Sleeves',
    slot: 'shoulders',
    styleId: 'plain',
    stat: { kind: 'rate', amount: 4 },
    depth: 1,
    rarity: 0,
  },
  {
    id: 's-bare',
    name: 'Bare Arms',
    slot: 'shoulders',
    styleId: 'bare',
    stat: { kind: 'swift', amount: 3 },
    depth: 1,
    rarity: 0,
  },
  {
    id: 's-pauldron',
    name: 'Iron Pauldrons',
    slot: 'shoulders',
    styleId: 'pauldron',
    stat: { kind: 'maxHp', amount: 22 },
    depth: 2,
    rarity: 1,
  },
  {
    id: 's-wide',
    name: 'Wide Sleeves',
    slot: 'shoulders',
    styleId: 'wide',
    stat: { kind: 'range', amount: 18 },
    depth: 3,
    rarity: 1,
  },
  {
    id: 's-mantle',
    name: 'Feather Mantle',
    slot: 'shoulders',
    styleId: 'mantle',
    stat: { kind: 'spirit', amount: 4 },
    depth: 5,
    rarity: 2,
  },

  // --- headwear ----------------------------------------------------------
  {
    id: 'h-topknot',
    name: 'Bound Topknot',
    slot: 'head',
    styleId: 'topknot',
    stat: { kind: 'edge', amount: 1 },
    depth: 1,
    rarity: 0,
  },
  {
    id: 'h-bare',
    name: 'Loose Hair',
    slot: 'head',
    styleId: 'bare',
    stat: { kind: 'pickup', amount: 20 },
    depth: 1,
    rarity: 0,
  },
  {
    id: 'h-hat',
    name: 'Bamboo Hat',
    slot: 'head',
    styleId: 'hat',
    stat: { kind: 'damage', amount: 5 },
    depth: 2,
    rarity: 1,
  },
  {
    id: 'h-crown',
    name: 'Jade Crown',
    slot: 'head',
    styleId: 'crown',
    stat: { kind: 'artPower', amount: 15 },
    depth: 4,
    rarity: 1,
  },
  {
    id: 'h-veiled',
    name: 'Veiled Hat',
    slot: 'head',
    styleId: 'veiled',
    stat: { kind: 'edge', amount: 4 },
    depth: 6,
    rarity: 2,
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

/** What a new swordsman is handed. A school swaps the weapon; see meta/schools. */
export const STARTING_ITEMS: readonly string[] = ['r-plain', 's-plain', 'h-topknot']

/**
 * Chance that felling an enemy drops something, at a given depth.
 *
 * Low, and only slightly depth-scaled. A survivors-like kills hundreds of
 * things per expedition, so anything generous turns the reward screen into a
 * wall of duplicates and the drop stops being an event. Measured against a real
 * expedition: 177 kills at this rate is between one and two drops.
 */
export function dropChance(depth: number): number {
  return 0.009 + Math.max(0, depth - 1) * 0.0015
}

/** Items that can drop at `depth`, weighted by rarity (rarer is scarcer). */
export function dropTable(depth: number): Item[] {
  return ITEMS.filter((item) => item.depth <= depth)
}

/** How much likelier an unowned item is than one already in the chest. */
const NEW_ITEM_BIAS = 5

/**
 * Picks a drop, strongly favouring something the player does not have.
 *
 * Without the bias the shallow table is small enough — eight items at depth 1,
 * four of which the school already handed over — that roughly half of all
 * drops come back "already yours". That is not a loot game, it is a slot
 * machine that mostly pays nothing, and the first expedition is exactly when a
 * player most needs the loop to show them something.
 *
 * Duplicates stay possible rather than being eliminated: once everything at a
 * depth is owned, a drop has to be something, and "already yours" is at least
 * honest about it.
 */
export function rollDrop(depth: number, pick: number, owned: ReadonlySet<string>): Item | null {
  const table = dropTable(depth)
  if (table.length === 0) return null
  const weights = table.map(
    (item) => [4, 2, 1][item.rarity]! * (owned.has(item.id) ? 1 : NEW_ITEM_BIAS),
  )
  const total = weights.reduce((a, b) => a + b, 0)
  let target = pick * total
  for (let i = 0; i < table.length; i++) {
    target -= weights[i]!
    if (target <= 0) return table[i]!
  }
  return table[table.length - 1]!
}
