/**
 * What the swordsman owns and what they are wearing.
 *
 * Stored as ids rather than as item objects, which is the whole reason a save
 * from an old build still opens: an id that no longer exists is dropped on
 * load, and an item added in a later build simply becomes findable. Storing
 * inflated objects would freeze the item table into every save ever written.
 *
 * Ownership is still ONE ROW PER PIECE, not a list of every copy ever found.
 * This game drops the same Hemp Robe a hundred times over a long enough run,
 * and an inventory that grew by one row each time would be unusable on a phone
 * within an evening.
 *
 * What changed is what a second copy is worth. A row is no longer a bare id but
 * an INSTANCE — `{ id, rank, rites }` — so a robe found deep is a better robe
 * than the same robe found on the post road, and finding it again at a higher
 * rank raises the one already in the chest. That keeps duplicates meaningful
 * without keeping duplicates.
 *
 * `rites` is empty in every save this build writes. It exists now because the
 * forge is coming and a piece will carry what has been worked into it; adding
 * the field later would mean a second migration over every player's save, and
 * this file is the one place where that cost is paid by somebody real.
 */
import { ITEM_BY_ID, MAX_RANK, type Item, type Slot } from '../data/items'

/** One piece the swordsman owns. */
export interface OwnedItem {
  /** Which piece from the item table. Unique within `owned`. */
  readonly id: string
  /** 0 to MAX_RANK. Where a piece was found decides how good a piece it is. */
  rank: number
  /** What the forge has worked into it. Always empty in this build. */
  rites: string[]
}

/** Equipped item id per slot. A slot may be empty. */
export type Equipped = Partial<Record<Slot, string>>

export interface Inventory {
  /** One row per piece ever found, best rank kept. */
  owned: OwnedItem[]
  equipped: Equipped
}

/** What acquiring a piece actually did. The reward screen says which. */
export type Acquired = 'new' | 'raised' | 'duplicate'

export function emptyInventory(): Inventory {
  return { owned: [], equipped: {} }
}

export function held(inv: Inventory, id: string): OwnedItem | null {
  return inv.owned.find((entry) => entry.id === id) ?? null
}

export function owns(inv: Inventory, id: string): boolean {
  return held(inv, id) !== null
}

/** The rank of a held piece, or 0 for one not held. */
export function rankOf(inv: Inventory, id: string): number {
  return held(inv, id)?.rank ?? 0
}

/**
 * Records a piece as found, at `rank`.
 *
 * Three outcomes rather than a boolean, because the reward screen has three
 * honest things to say. A duplicate is still a duplicate — but a duplicate that
 * is BETTER than what is held raises it, and reporting that as "already yours"
 * would hide the only interesting thing that happened.
 *
 * Rites survive a raise: a piece the forge has worked on is still that piece,
 * and losing that work to a lucky drop would make the forge feel like a trap.
 */
export function acquire(inv: Inventory, id: string, rank = 0): Acquired {
  if (!ITEM_BY_ID.has(id)) return 'duplicate'
  const clamped = Math.max(0, Math.min(MAX_RANK, Math.floor(rank)))
  const entry = held(inv, id)
  if (!entry) {
    inv.owned.push({ id, rank: clamped, rites: [] })
    return 'new'
  }
  if (clamped > entry.rank) {
    entry.rank = clamped
    return 'raised'
  }
  return 'duplicate'
}

/** Equips an owned item into its own slot. Returns false if not owned. */
export function equip(inv: Inventory, id: string): boolean {
  const item = ITEM_BY_ID.get(id)
  if (!item || !owns(inv, id)) return false
  inv.equipped[item.slot] = id
  return true
}

export function equippedIn(inv: Inventory, slot: Slot): Item | null {
  const id = inv.equipped[slot]
  return id ? (ITEM_BY_ID.get(id) ?? null) : null
}

/** Everything owned that fits `slot`, in table order, with its instance. */
export function ownedInSlot(inv: Inventory, slot: Slot): Array<{ item: Item; entry: OwnedItem }> {
  const out: Array<{ item: Item; entry: OwnedItem }> = []
  for (const entry of inv.owned) {
    const item = ITEM_BY_ID.get(entry.id)
    if (item && item.slot === slot) out.push({ item, entry })
  }
  return out
}

/** Every equipped item, in slot order. */
export function equippedItems(inv: Inventory): Item[] {
  const out: Item[] = []
  for (const id of Object.values(inv.equipped)) {
    const item = id ? ITEM_BY_ID.get(id) : undefined
    if (item) out.push(item)
  }
  return out
}

/**
 * Drops ids this build does not know, and unequips anything left dangling.
 *
 * Called on load. Without it, a save written by a build with an item that was
 * later renamed would leave a slot pointing at nothing, and the figure would
 * quietly lose a piece of itself with no explanation.
 */
export function sanitise(inv: Inventory): Inventory {
  const seen = new Set<string>()
  const owned: OwnedItem[] = []
  for (const entry of inv.owned) {
    // A hand-edited save can carry the same id twice, and two rows for one
    // piece would show as two cards that equip over each other.
    if (!ITEM_BY_ID.has(entry.id) || seen.has(entry.id)) continue
    seen.add(entry.id)
    owned.push({
      id: entry.id,
      rank: Math.max(0, Math.min(MAX_RANK, Math.floor(entry.rank) || 0)),
      rites: Array.isArray(entry.rites) ? entry.rites.filter((r) => typeof r === 'string') : [],
    })
  }

  const equipped: Equipped = {}
  for (const [slot, id] of Object.entries(inv.equipped)) {
    if (!id) continue
    const item = ITEM_BY_ID.get(id)
    // Equipped-but-not-owned is not a state the game can produce, but a
    // hand-edited save can, and silently honouring it would be a free item.
    if (item && item.slot === slot && seen.has(id)) equipped[item.slot] = id
  }
  return { owned, equipped }
}
