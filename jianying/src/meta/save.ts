/**
 * Persistence for the character record.
 *
 * Two storage backends, tried in order: Capacitor Preferences on a device
 * (which survives an app update, unlike a webview's localStorage, whose
 * lifetime is at the system's discretion), and localStorage everywhere else so
 * the browser build and the screenshot harness behave the same as the phone.
 *
 * The parsing is defensive to an extent that looks excessive until you consider
 * what a bad save costs here. This is the one file whose failure mode is losing
 * a player's progress, and the second-worst failure mode is a thrown exception
 * during boot, which on a phone is an unexplained black screen — a bug this
 * project has already shipped once. So every field is validated and coerced,
 * and anything unreadable degrades to a fresh character instead of propagating.
 */
import {
  ATTRIBUTES,
  type Attributes,
  type Character,
  createCharacter,
  emptyAttributes,
} from './character'
import { ITEMS } from '../data/items'
import { MAX_DEPTH } from '../data/regions'
import { acquire, emptyInventory, equip, sanitise, type Inventory } from './inventory'
import { SCHOOL_BY_ID, schoolById } from './schools'

/** Versioned: a future shape change gets a new key rather than a silent misread. */
export const SAVE_KEY = 'jianying.character.v1'

/** A finite, non-negative integer, or `fallback`. */
function int(value: unknown, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.floor(n)))
}

function parseAttributes(value: unknown): Attributes {
  const out = emptyAttributes()
  if (typeof value !== 'object' || value === null) return out
  const record = value as Record<string, unknown>
  for (const attr of ATTRIBUTES) out[attr.id] = int(record[attr.id], 0)
  return out
}

/**
 * Reads an inventory, repairing whatever it finds.
 *
 * A save written before equipment existed has no inventory at all, so it is
 * handed its school's starting kit rather than an empty one — a returning
 * character opening the hub to a naked swordsman with no weapon would look
 * exactly like their progress had been eaten.
 */
function parseInventory(value: unknown, schoolId: string): Inventory {
  const school = schoolById(schoolId)
  const starter = (): Inventory => {
    const inv = emptyInventory()
    for (const id of school.kit) acquire(inv, id)
    const weapon = ITEMS.find((i) => i.slot === 'weapon' && i.styleId === school.weaponId)
    if (weapon) acquire(inv, weapon.id)
    for (const id of inv.owned) equip(inv, id)
    return inv
  }

  if (typeof value !== 'object' || value === null) return starter()
  const record = value as Record<string, unknown>
  const owned = Array.isArray(record.owned)
    ? record.owned.filter((id): id is string => typeof id === 'string')
    : []
  if (owned.length === 0) return starter()

  const equipped: Record<string, string> = {}
  if (typeof record.equipped === 'object' && record.equipped !== null) {
    for (const [slot, id] of Object.entries(record.equipped as Record<string, unknown>)) {
      if (typeof id === 'string') equipped[slot] = id
    }
  }
  // `sanitise` drops ids this build no longer knows and unequips anything left
  // dangling, so an item renamed between builds cannot make a slot vanish.
  return sanitise({ owned, equipped })
}

/**
 * Reads a character out of stored JSON.
 *
 * Returns null only when the text is not an object at all. Anything that parses
 * yields a usable character, because dropping a save over one bad field would
 * punish the player for a bug that is ours.
 */
export function parseCharacter(raw: string): Character | null {
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof value !== 'object' || value === null) return null
  const record = value as Record<string, unknown>

  const base = createCharacter()
  const name = typeof record.name === 'string' && record.name.trim() ? record.name.trim() : base.name
  // An unknown school id — a save from a build that had one this version does
  // not — falls back rather than leaving the hub with nothing to render.
  const origin =
    typeof record.origin === 'string' && SCHOOL_BY_ID.has(record.origin)
      ? record.origin
      : base.origin
  return {
    inventory: parseInventory(record.inventory, origin),
    // Trimmed to something a UI can lay out; a save carrying a kilobyte of text
    // should not be able to break the hub.
    name: name.slice(0, 24),
    origin,
    // Anything already carrying progress has plainly been played, so it must
    // not be handed a tutorial. Only a genuinely fresh save gets taught.
    taught: record.taught === true || int(record.runs, 0) > 0,
    level: int(record.level, base.level, 1),
    xp: int(record.xp, 0),
    points: int(record.points, 0),
    spent: parseAttributes(record.spent),
    depth: int(record.depth, 1, 1, MAX_DEPTH),
    runs: int(record.runs, 0),
    bestSeconds: int(record.bestSeconds, 0),
    totalKills: int(record.totalKills, 0),
  }
}

export function serialiseCharacter(character: Character): string {
  return JSON.stringify(character)
}

/** Resolved once and cached; `null` means the plugin is not available here. */
let prefsModule: typeof import('@capacitor/preferences') | null | undefined

/**
 * Capacitor Preferences, imported lazily so the web build never pays for it.
 *
 * Returns the module NAMESPACE rather than the `Preferences` object, and that
 * detail is load-bearing. Capacitor's web implementation is a Proxy that throws
 * on any property it does not implement — including `then`. Returning it from
 * an `async` function makes the runtime probe it for thenability, which throws
 * `"Preferences.then() is not implemented on web"` and takes the whole boot
 * with it. A module namespace has no such trap.
 */
async function preferences(): Promise<typeof import('@capacitor/preferences') | null> {
  if (prefsModule === undefined) {
    try {
      prefsModule = await import('@capacitor/preferences')
    } catch {
      prefsModule = null
    }
  }
  return prefsModule
}

function localGet(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null
  } catch {
    // Private browsing and some webview configurations throw on access rather
    // than returning null.
    return null
  }
}

function localSet(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value)
  } catch {
    // Nothing useful to do: the run still plays, it just will not be remembered.
  }
}

export interface LoadedSave {
  character: Character
  /**
   * True when nothing was stored — this is a first launch.
   *
   * The caller needs to know, because a first launch goes through character
   * creation and a returning one must not: sending a player who already has a
   * swordsman back to "choose your origin" would look exactly like their
   * progress had been lost.
   */
  fresh: boolean
}

/** Loads the stored character, or creates a fresh one. Never throws. */
export async function loadCharacter(): Promise<LoadedSave> {
  let raw: string | null = null
  try {
    const mod = await preferences()
    if (mod) raw = (await mod.Preferences.get({ key: SAVE_KEY })).value
  } catch {
    // Web, or a platform where the plugin is not installed. localStorage next.
    raw = null
  }
  raw ??= localGet(SAVE_KEY)
  if (!raw) return { character: createCharacter(), fresh: true }
  const parsed = parseCharacter(raw)
  // A save that existed but could not be read is still not a first launch in
  // spirit, but there is nothing to continue from, so creation is the honest
  // place to land.
  return parsed ? { character: parsed, fresh: false } : { character: createCharacter(), fresh: true }
}

/**
 * Writes the character to both backends.
 *
 * Both, not one: Preferences is the durable store on a device, and the
 * localStorage copy is what the browser build and the harness read. Writing
 * both keeps a single code path rather than branching on platform, and the cost
 * is a few hundred bytes written a handful of times per session.
 */
export async function saveCharacter(character: Character): Promise<void> {
  const raw = serialiseCharacter(character)
  localSet(SAVE_KEY, raw)
  try {
    const mod = await preferences()
    if (mod) await mod.Preferences.set({ key: SAVE_KEY, value: raw })
  } catch {
    // The localStorage copy above already landed.
  }
}

/** Forgets the character. Used by the hub's reset, which asks first. */
export async function clearCharacter(): Promise<void> {
  try {
    globalThis.localStorage?.removeItem(SAVE_KEY)
  } catch {
    /* ignore */
  }
  try {
    const mod = await preferences()
    if (mod) await mod.Preferences.remove({ key: SAVE_KEY })
  } catch {
    /* ignore */
  }
}
