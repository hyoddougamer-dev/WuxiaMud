/**
 * What the swordsman owns and what they are wearing.
 *
 * Stored as ids rather than as item objects, which is the whole reason a save
 * from an old build still opens: an id that no longer exists is dropped on
 * load, and an item added in a later build simply becomes findable. Storing
 * inflated objects would freeze the item table into every save ever written.
 *
 * Ownership is a SET, not a list. This game drops the same Hemp Robe a hundred
 * times over a long enough run, and an inventory that grew by one row each time
 * would be unusable on a phone within an evening. Owning something is a fact,
 * not a quantity — the second copy of a robe is worth nothing here, so it is
 * not recorded, and the reward screen says "already yours" instead.
 */
import { ITEM_BY_ID, type Item, type Slot } from '../data/items'

/** Equipped item id per slot. A slot may be empty. */
export type Equipped = Partial<Record<Slot, string>>

export interface Inventory {
  /** Ids of every item ever found. */
  owned: string[]
  equipped: Equipped
}

export function emptyInventory(): Inventory {
  return { owned: [], equipped: {} }
}

export function owns(inv: Inventory, id: string): boolean {
  return inv.owned.includes(id)
}

/**
 * Records an item as found.
 *
 * Returns false when it was already owned, which the reward screen needs in
 * order to say something honest about a duplicate rather than pretending it was
 * a discovery.
 */
export function acquire(inv: Inventory, id: string): boolean {
  if (!ITEM_BY_ID.has(id) || owns(inv, id)) return false
  inv.owned.push(id)
  return true
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

/** Everything owned that fits `slot`, in table order. */
export function ownedInSlot(inv: Inventory, slot: Slot): Item[] {
  const items: Item[] = []
  for (const id of inv.owned) {
    const item = ITEM_BY_ID.get(id)
    if (item && item.slot === slot) items.push(item)
  }
  return items
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
  const owned = inv.owned.filter((id) => ITEM_BY_ID.has(id))
  const equipped: Equipped = {}
  for (const [slot, id] of Object.entries(inv.equipped)) {
    if (!id) continue
    const item = ITEM_BY_ID.get(id)
    // Equipped-but-not-owned is not a state the game can produce, but a
    // hand-edited save can, and silently honouring it would be a free item.
    if (item && item.slot === slot && owned.includes(id)) equipped[item.slot] = id
  }
  return { owned, equipped }
}
