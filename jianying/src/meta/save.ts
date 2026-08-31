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
import { ARTS, EQUIPPED_ARTS } from '../data/arts'
import { WEAPONS } from '../data/weapons'
import {
  acquire,
  emptyInventory,
  equip,
  mintUid,
  sanitise,
  type Inventory,
  type OwnedItem,
} from './inventory'
import { AFFIX_BY_KIND, rollAmount, type AffixKind } from '../data/affixes'
import { MAX_RARITY, type Rarity } from '../data/rarity'
import { parseLook } from './look'
import { SCHOOL_BY_ID, schoolById } from './schools'

/**
 * Versioned: a shape change gets a new key rather than a silent misread.
 *
 * v2 changes two things at once, on purpose. Ownership became instances
 * (`{ id, rank, rites }` per piece) and the file became a ROSTER rather than a
 * single swordsman. Either alone would have been a migration over every real
 * player's save; done together it is one. The roster envelope is written even
 * while only one swordsman exists, so the screen that lets a player keep
 * several costs no further migration when it arrives.
 */
export const SAVE_KEY = 'jianying.save.v2'

/** Where v1 saves live. Read once, migrated forward, then left alone. */
export const SAVE_KEY_V1 = 'jianying.character.v1'

/** How many swordsmen one player may keep. */
export const ROSTER_LIMIT = 6

export interface Roster {
  /** Index into `swordsmen`. Always in range once parsed. */
  active: number
  swordsmen: Character[]
}

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
 * Rolls the plain starting instance of a base — one modest line, no rarity.
 *
 * A starting piece is not a find, so it does not roll: everyone's first robe is
 * the same robe, and the first genuinely rolled thing a player sees is the
 * first thing that drops. That is the moment the ladder is supposed to teach
 * itself, and it lands harder against a flat baseline.
 */
function starterInstance(baseId: string, kind: AffixKind): OwnedItem {
  return {
    uid: mintUid(baseId),
    baseId,
    rarity: 0,
    affixes: [{ kind, amount: rollAmount(kind, 1, 0.5) }],
    power: null,
    depth: 1,
  }
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
    const kinds: AffixKind[] = ['body', 'swift', 'edge']
    school.kit.forEach((id, i) => {
      acquire(inv, starterInstance(id, kinds[i % kinds.length]!))
    })
    const weapon = ITEMS.find((i) => i.slot === 'weapon' && i.styleId === school.weaponId)
    if (weapon) acquire(inv, starterInstance(weapon.id, 'edge'))
    for (const entry of inv.owned) equip(inv, entry.uid)
    return inv
  }

  if (typeof value !== 'object' || value === null) return starter()
  const record = value as Record<string, unknown>

  /**
   * Three shapes are accepted, and the two old ones are why this function is
   * long rather than clever.
   *
   * v3 is the instance a build after the loot rework writes. v2 was
   * `{ id, rank }` and v1 was a bare id string, and BOTH of those describe a
   * piece whose single line was fixed by the item table — a table that no
   * longer carries one. So an old row is brought forward as an instance with
   * one rolled line whose SIZE comes from the rank it was held at: a rank 4
   * robe stays a better robe than a rank 0 one, which is the promise those
   * ranks made to the player who earned them.
   *
   * The kind is derived from the base id so it is stable across loads — a
   * player's Hemp Robe does not become a different robe each time the game
   * opens.
   */
  const owned: OwnedItem[] = []
  const legacyKind = (baseId: string): AffixKind => {
    const kinds: AffixKind[] = ['body', 'edge', 'swift', 'spirit']
    let hash = 0
    for (let i = 0; i < baseId.length; i++) hash = (hash * 31 + baseId.charCodeAt(i)) >>> 0
    return kinds[hash % kinds.length]!
  }
  const fromLegacy = (baseId: string, rank: number): OwnedItem => {
    const kind = legacyKind(baseId)
    // The old rank ran 0..5 and multiplied a fixed stat by up to 2.5x. Mapping
    // it onto depth reproduces roughly the same number through the new curve,
    // so nobody's gear quietly gets worse across the migration.
    const asDepth = 1 + rank
    return {
      uid: mintUid(baseId),
      baseId,
      rarity: Math.min(2, Math.floor(rank / 2)) as Rarity,
      affixes: [{ kind, amount: rollAmount(kind, asDepth, 0.5) }],
      power: null,
      depth: asDepth,
    }
  }

  const legacyByBase = new Map<string, string>()
  if (Array.isArray(record.owned)) {
    for (const raw of record.owned) {
      if (typeof raw === 'string') {
        const entry = fromLegacy(raw, 0)
        legacyByBase.set(raw, entry.uid)
        owned.push(entry)
      } else if (typeof raw === 'object' && raw !== null) {
        const e = raw as Record<string, unknown>
        if (typeof e.uid === 'string' && typeof e.baseId === 'string' && Array.isArray(e.affixes)) {
          owned.push({
            uid: e.uid,
            baseId: e.baseId,
            rarity: int(e.rarity, 0, 0, MAX_RARITY) as Rarity,
            affixes: (e.affixes as unknown[]).flatMap((a) => {
              if (typeof a !== 'object' || a === null) return []
              const affix = a as Record<string, unknown>
              if (typeof affix.kind !== 'string' || !AFFIX_BY_KIND.has(affix.kind as AffixKind)) return []
              return [{ kind: affix.kind as AffixKind, amount: int(affix.amount, 1, 1) }]
            }),
            power: typeof e.power === 'string' ? e.power : null,
            depth: int(e.depth, 1, 1),
          })
        } else if (typeof e.id === 'string') {
          const entry = fromLegacy(e.id, int(e.rank, 0, 0, 5))
          legacyByBase.set(e.id, entry.uid)
          owned.push(entry)
        }
      }
    }
  }
  if (owned.length === 0) return starter()

  const equipped: Record<string, string> = {}
  if (typeof record.equipped === 'object' && record.equipped !== null) {
    for (const [slot, ref] of Object.entries(record.equipped as Record<string, unknown>)) {
      if (typeof ref !== 'string') continue
      // A v3 save points at a uid; v1 and v2 point at a base id, which is
      // translated through the row that base became.
      equipped[slot] = legacyByBase.get(ref) ?? ref
    }
  }
  // `sanitise` drops bases this build no longer knows and unequips anything
  // left dangling, so an item renamed between builds cannot make a slot vanish.
  return sanitise({ owned, equipped })
}

/**
 * Reads a character out of stored JSON.
 *
 * Returns null only when the text is not an object at all. Anything that parses
 * yields a usable character, because dropping a save over one bad field would
 * punish the player for a bug that is ours.
 */
/**
 * The equipped arts, per weapon, from whatever the save happens to hold.
 *
 * Everything is filtered against the real art table rather than trusted: a save
 * is a text file on a device and an id that no longer exists would put an empty
 * slot into a run. An unknown weapon key is dropped for the same reason, and a
 * list longer than the limit is trimmed rather than rejected — losing a slot
 * beats losing the swordsman.
 */
function parseArts(value: unknown): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  if (typeof value !== 'object' || value === null) return out
  for (const [weaponId, ids] of Object.entries(value as Record<string, unknown>)) {
    if (!WEAPONS.some((w) => w.id === weaponId)) continue
    if (!Array.isArray(ids)) continue
    const kept: string[] = []
    for (const id of ids) {
      if (typeof id !== 'string') continue
      // Must belong to THIS weapon, so a save cannot smuggle a spear art into
      // a sabre's scroll and have it silently never fire.
      if (!ARTS.some((a) => a.id === id && a.weapon === weaponId)) continue
      if (kept.includes(id)) continue
      kept.push(id)
      if (kept.length === EQUIPPED_ARTS) break
    }
    if (kept.length > 0) out[weaponId] = kept
  }
  return out
}

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
    // A save written before appearance existed has no `look` at all, and gets
    // the default rather than an undefined that would draw an invisible figure.
    look: parseLook(record.look),
    // Anything already carrying progress has plainly been played, so it must
    // not be handed a tutorial. Only a genuinely fresh save gets taught.
    taught: record.taught === true || int(record.runs, 0) > 0,
    level: int(record.level, base.level, 1),
    xp: int(record.xp, 0),
    points: int(record.points, 0),
    spent: parseAttributes(record.spent),
    arts: parseArts(record.arts),
    // `manuals` is deliberately NOT read, and a save that still carries one
    // simply loses it. The 秘笈 ladder is gone: an art's grade now comes from
    // the rungs of the gear worn (see `attune` in sim/arts.ts), so a manual
    // rank would be a second, invisible ladder climbing the same number — which
    // is the exact mishmash this pass exists to remove. Dropping the field is
    // the honest migration; silently folding it into the new grade would hand
    // some saves a head start nothing on screen could explain.
    depth: int(record.depth, 1, 1, MAX_DEPTH),
    runs: int(record.runs, 0),
    bestSeconds: int(record.bestSeconds, 0),
    totalKills: int(record.totalKills, 0),
  }
}

export function serialiseCharacter(character: Character): string {
  return JSON.stringify(character)
}

/**
 * Reads a whole save file: v2's roster, or a v1 single character wrapped as a
 * roster of one.
 *
 * Both shapes are accepted from the same text, because the migration reads the
 * old KEY and hands the result straight here — the caller should not have to
 * know which era a blob came from.
 */
export function parseRoster(raw: string): Roster | null {
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof value !== 'object' || value === null) return null
  const record = value as Record<string, unknown>

  if (!Array.isArray(record.swordsmen)) {
    // v1: the file WAS the character.
    const single = parseCharacter(raw)
    return single ? { active: 0, swordsmen: [single] } : null
  }

  const swordsmen: Character[] = []
  for (const entry of record.swordsmen.slice(0, ROSTER_LIMIT)) {
    const parsed = parseCharacter(JSON.stringify(entry))
    if (parsed) swordsmen.push(parsed)
  }
  // A roster that parsed to nothing is not a roster. Saying so lets the caller
  // land on creation rather than on a hub with no swordsman to draw.
  if (swordsmen.length === 0) return null
  return { active: int(record.active, 0, 0, swordsmen.length - 1), swordsmen }
}

export function serialiseRoster(roster: Roster): string {
  return JSON.stringify({
    v: 3,
    active: Math.max(0, Math.min(roster.swordsmen.length - 1, roster.active)),
    swordsmen: roster.swordsmen.slice(0, ROSTER_LIMIT),
  })
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
  /** The whole roster. `character` is the active one, and the same object. */
  roster: Roster
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

/** Reads one key from whichever backend has it. Never throws. */
async function readKey(key: string): Promise<string | null> {
  let raw: string | null = null
  try {
    const mod = await preferences()
    if (mod) raw = (await mod.Preferences.get({ key })).value
  } catch {
    // Web, or a platform where the plugin is not installed. localStorage next.
    raw = null
  }
  return raw ?? localGet(key)
}

/** Loads the stored roster, or creates a fresh swordsman. Never throws. */
export async function loadCharacter(): Promise<LoadedSave> {
  // v2 first, then the v1 key. A player who installed this build over the last
  // one has a v1 blob and no v2 one, and reading the old key is the entire
  // migration — the parser already accepts both inventory shapes.
  const raw = (await readKey(SAVE_KEY)) ?? (await readKey(SAVE_KEY_V1))
  const fresh = (): LoadedSave => {
    const character = createCharacter()
    return { roster: { active: 0, swordsmen: [character] }, character, fresh: true }
  }
  if (!raw) return fresh()
  const roster = parseRoster(raw)
  // A save that existed but could not be read is still not a first launch in
  // spirit, but there is nothing to continue from, so creation is the honest
  // place to land.
  if (!roster) return fresh()
  return { roster, character: roster.swordsmen[roster.active]!, fresh: false }
}

/**
 * Writes the character to both backends.
 *
 * Both, not one: Preferences is the durable store on a device, and the
 * localStorage copy is what the browser build and the harness read. Writing
 * both keeps a single code path rather than branching on platform, and the cost
 * is a few hundred bytes written a handful of times per session.
 */
export async function saveCharacter(roster: Roster): Promise<void> {
  const raw = serialiseRoster(roster)
  localSet(SAVE_KEY, raw)
  try {
    const mod = await preferences()
    if (mod) await mod.Preferences.set({ key: SAVE_KEY, value: raw })
  } catch {
    // The localStorage copy above already landed.
  }
}

/**
 * Forgets everything. Used by the hub's reset, which asks first.
 *
 * Clears the v1 key as well: leaving it behind would make the next boot read
 * the pre-migration save and resurrect the swordsman the player just discarded.
 */
export async function clearCharacter(): Promise<void> {
  for (const key of [SAVE_KEY, SAVE_KEY_V1]) {
    try {
      globalThis.localStorage?.removeItem(key)
    } catch {
      /* ignore */
    }
    try {
      const mod = await preferences()
      if (mod) await mod.Preferences.remove({ key })
    } catch {
      /* ignore */
    }
  }
}
