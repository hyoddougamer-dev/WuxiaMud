/**
 * What the swordsman owns and what they are wearing.
 *
 * ONE ROW PER PIECE WAS THE OLD RULE, AND IT HAD TO GO. It existed for a real
 * reason — this game drops the same Hemp Robe a hundred times over a long
 * evening, and a bag that grew by a row each time would be unusable on a phone.
 * But it only worked because two copies of a piece were genuinely identical:
 * one fixed stat, and a `rank` that the better copy simply overwrote.
 *
 * Now that a piece rolls its own lines (see data/affixes.ts), two Hemp Robes
 * are two different objects, and collapsing them would throw away the whole
 * point of rolling. So the bag holds INSTANCES, and the phone problem is solved
 * the way every ARPG solves it instead: a hard capacity, and the player throws
 * things away. That is not a compromise — deciding what to keep IS the game
 * between expeditions.
 *
 * Every row carries its own `uid` because a base id no longer identifies
 * anything: `equipped` points at a uid, not at an item, and two rows can share
 * a baseId forever without either being the other.
 */
import { ITEM_BY_ID, type Item, type Slot } from '../data/items'
import { type Affix, affixWeight } from '../data/affixes'
import { MAX_RARITY, type Rarity } from '../data/rarity'

/**
 * How many pieces the pack holds.
 *
 * Chosen against the drop rate rather than picked round: at roughly three or
 * four finds an expedition, this is six or seven runs of hoarding before the
 * player has to make a decision, which is long enough to not feel nagged and
 * short enough that the decision arrives while they still remember what the
 * pieces are.
 */
export const BAG_CAPACITY = 24

/** One piece the swordsman owns — a rolled instance, not a table row. */
export interface OwnedItem {
  /** Unique per instance. `equipped` points at this, never at a base id. */
  readonly uid: string
  /** Which base from the item table. Two rows may share one. */
  readonly baseId: string
  readonly rarity: Rarity
  /** The lines this copy rolled. Never empty. */
  readonly affixes: Affix[]
  /** Named power id, on 神 and 仙 pieces only. See data/affixes.ts. */
  readonly power: string | null
  /** Expedition depth it was found at. Shown on the sheet, never in maths. */
  readonly depth: number
}

/** Equipped instance uid per slot. A slot may be empty. */
export type Equipped = Partial<Record<Slot, string>>

export interface Inventory {
  owned: OwnedItem[]
  equipped: Equipped
}

export function emptyInventory(): Inventory {
  return { owned: [], equipped: {} }
}

/**
 * Mints an instance uid.
 *
 * Not random: a seeded expedition has to replay to the same bag, and a
 * `Math.random()` here would have quietly broken that the first time anyone
 * used the replay harness. The counter is per-session and the baseId prefix
 * keeps a uid readable in a save file when something has gone wrong.
 */
let minted = 0
export function mintUid(baseId: string): string {
  minted++
  return `${baseId}#${minted.toString(36)}`
}

/** Resets the uid counter. Tests only — a fresh session starts at zero anyway. */
export function resetUids(): void {
  minted = 0
}

export function byUid(inv: Inventory, uid: string): OwnedItem | null {
  return inv.owned.find((entry) => entry.uid === uid) ?? null
}

/** The base an instance was rolled from, or null when the build dropped it. */
export function baseOf(entry: OwnedItem): Item | null {
  return ITEM_BY_ID.get(entry.baseId) ?? null
}

/** True when the pack has no room for another find. */
export function bagFull(inv: Inventory): boolean {
  return carried(inv).length >= BAG_CAPACITY
}

/**
 * Everything owned that is NOT currently worn.
 *
 * Worn pieces do not occupy the pack: a player who fills the bag and then
 * cannot equip anything because the piece they want to take off has nowhere to
 * go is a player fighting the interface rather than the game.
 */
export function carried(inv: Inventory): OwnedItem[] {
  const worn = new Set(Object.values(inv.equipped).filter(Boolean) as string[])
  return inv.owned.filter((entry) => !worn.has(entry.uid))
}

/** What acquiring a piece actually did. The reward screen says which. */
export type Acquired = 'kept' | 'full'

/**
 * Puts a rolled instance in the pack.
 *
 * Returns 'full' rather than silently dropping it, so the caller can tell the
 * player their pack is full instead of quietly eating a find — which is the
 * loot equivalent of a level-up that grants nothing, and this project has
 * shipped one of those before.
 */
export function acquire(inv: Inventory, entry: OwnedItem): Acquired {
  if (bagFull(inv)) return 'full'
  inv.owned.push(entry)
  return 'kept'
}

/** Throws a piece away for good. Refuses to discard something being worn. */
export function discard(inv: Inventory, uid: string): boolean {
  const worn = Object.values(inv.equipped).includes(uid)
  if (worn) return false
  const before = inv.owned.length
  inv.owned = inv.owned.filter((entry) => entry.uid !== uid)
  return inv.owned.length < before
}

/** Equips an owned instance into its base's slot. Returns false if not owned. */
export function equip(inv: Inventory, uid: string): boolean {
  const entry = byUid(inv, uid)
  if (!entry) return false
  const base = baseOf(entry)
  if (!base) return false
  inv.equipped[base.slot] = uid
  return true
}

/** Takes off whatever is in `slot`. The piece returns to the pack. */
export function unequip(inv: Inventory, slot: Slot): void {
  delete inv.equipped[slot]
}

export function equippedIn(inv: Inventory, slot: Slot): OwnedItem | null {
  const uid = inv.equipped[slot]
  return uid ? byUid(inv, uid) : null
}

/** Every worn instance, in slot order. */
export function equippedItems(inv: Inventory): OwnedItem[] {
  const out: OwnedItem[] = []
  for (const uid of Object.values(inv.equipped)) {
    const entry = uid ? byUid(inv, uid) : null
    if (entry) out.push(entry)
  }
  return out
}

/** Everything in the pack that fits `slot`, best first. */
export function carriedInSlot(inv: Inventory, slot: Slot): OwnedItem[] {
  return carried(inv)
    .filter((entry) => baseOf(entry)?.slot === slot)
    .sort((a, b) => b.rarity - a.rarity || affixWeight(b.affixes) - affixWeight(a.affixes))
}

/**
 * True when `entry` is the better of the two by the game's own crude measure.
 *
 * Used only to sort and to mark a likely upgrade; the player decides by reading
 * the lines. See affixWeight for why no score is ever printed.
 */
export function isUpgrade(entry: OwnedItem, over: OwnedItem | null): boolean {
  if (!over) return true
  return affixWeight(entry.affixes) > affixWeight(over.affixes)
}

/**
 * Drops instances this build cannot make sense of, and unequips the dangling.
 *
 * Called on load. A save is a text file on a device: it can name a base that no
 * longer exists, carry a rarity outside the ladder, or point a slot at a uid
 * that is not in the bag. None of those may cost the player their swordsman.
 */
export function sanitise(inv: Inventory): Inventory {
  const seen = new Set<string>()
  const owned: OwnedItem[] = []
  for (const entry of inv.owned) {
    const base = ITEM_BY_ID.get(entry.baseId)
    if (!base) continue
    // A hand-edited save can repeat a uid, and two rows sharing one would make
    // `equipped` ambiguous about which piece is actually on.
    if (seen.has(entry.uid)) continue
    if (!Array.isArray(entry.affixes) || entry.affixes.length === 0) continue
    seen.add(entry.uid)
    owned.push({
      uid: entry.uid,
      baseId: entry.baseId,
      rarity: Math.max(0, Math.min(MAX_RARITY, Math.floor(entry.rarity) || 0)) as Rarity,
      affixes: entry.affixes,
      power: typeof entry.power === 'string' ? entry.power : null,
      depth: Math.max(1, Math.floor(entry.depth) || 1),
    })
  }
  // Over capacity — a save from a build with a bigger pack, or a hand edit.
  // Trimmed from the end rather than refused, and worn pieces are safe because
  // they do not count against it.
  const equipped: Equipped = {}
  for (const [slot, uid] of Object.entries(inv.equipped)) {
    if (!uid || !seen.has(uid)) continue
    const entry = owned.find((e) => e.uid === uid)!
    const base = ITEM_BY_ID.get(entry.baseId)
    if (base && base.slot === slot) equipped[base.slot] = uid
  }
  const wornUids = new Set(Object.values(equipped) as string[])
  const kept = owned.filter((e) => wornUids.has(e.uid))
  for (const entry of owned) {
    if (wornUids.has(entry.uid)) continue
    if (kept.length - wornUids.size >= BAG_CAPACITY) break
    kept.push(entry)
  }
  return { owned: kept, equipped }
}
