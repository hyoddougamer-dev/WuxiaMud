/**
 * How a swordsman looks, beyond what they happen to be wearing.
 *
 * This file exists because of a tension that character creation exposed. The
 * art direction says a silhouette has no interior detail, so armour IS the
 * appearance — a robe is not a picture laid over the character, it is where the
 * robe's hem goes. That is what makes loot visible, and it is not negotiable.
 *
 * But it means every appearance choice made at creation would be erased by the
 * first robe that dropped. A creation screen whose choices last ten minutes is
 * worse than none, because it promises something it takes back.
 *
 * So the choices here are exactly the ones equipment cannot overwrite:
 *
 *   build   how wide the figure is. Armour decides the shape of the hem; this
 *           decides the frame the hem hangs on, and no drop changes it.
 *   sash    the ribbon at the back. It is the only colour on the character and
 *           nothing in the item table touches it.
 *   seed    the brush hand. Every mark is swept with jitter drawn from this, so
 *           two swordsmen in identical gear still read as two different pieces
 *           of brushwork, the way two real ink drawings would.
 *
 * Three axes, 3 × 4 × arbitrary. Multiplied by the 900 gear silhouettes the
 * wardrobe can already assemble, no two players share a figure — and unlike the
 * gear half, this half is theirs from the first second and never taken away.
 */

export interface Look {
  /** Brush hand. Drives the ink jitter on every stroke. */
  readonly seed: number
  /** Index into BUILDS. */
  readonly build: number
  /** Index into SASHES. */
  readonly sash: number
  /** Index into BEARINGS. */
  readonly bearing: number
  /** Index into PIGMENTS — the colour the robe is dyed. */
  readonly pigment: number
}

/**
 * Man or woman, expressed the only way a silhouette can express it.
 *
 * There is no face here and no interior detail, so this is proportion and
 * carriage: shoulder span against hem, and whether hair falls below the collar.
 * Both survive armour, which is the requirement — anything the first robe
 * erased would be a choice the game took back within ten minutes.
 *
 * Honest about the size of it: at the forty pixels the game draws in play this
 * is subtle. It is unmistakable in the hub and in creation, where the figure is
 * four times larger and where the choice is actually made.
 */
export interface Bearing {
  readonly id: string
  readonly name: string
  /** Multiplier on shoulder span. */
  readonly shoulders: number
  /** Multiplier on hem width. */
  readonly hem: number
  /** Hair falling below the collar, in figure units. 0 draws none. */
  readonly hair: number
}

export const BEARINGS: readonly Bearing[] = [
  { id: 'man', name: 'Man', shoulders: 1.07, hem: 0.96, hair: 0 },
  { id: 'woman', name: 'Woman', shoulders: 0.93, hem: 1.06, hair: 9 },
] as const

/**
 * The colour the robe is dyed.
 *
 * The game was built on ink alone and was reported, fairly, as monochrome. That
 * rule was mine and it was too strict: ink-and-colour painting has always put
 * 墨 in the line and mineral pigment in the wash, and 青绿山水 — the blue-green
 * landscape tradition — is built on exactly these minerals. So the ROBE takes
 * the colour and every other mark stays ink. The silhouette survives, because
 * the head, the shoulders and the blade still read as black against paper.
 */
export interface Pigment {
  readonly id: string
  readonly seal: string
  readonly name: string
  /** 0xRRGGBB, or null for undyed cloth, which stays ink. */
  readonly colour: number | null
}

export const PIGMENTS: readonly Pigment[] = [
  { id: 'ink', seal: '墨', name: 'Undyed', colour: null },
  { id: 'cinnabar', seal: '朱', name: 'Cinnabar', colour: 0x9e2b2b },
  { id: 'indigo', seal: '靛', name: 'Indigo', colour: 0x2e4a6b },
  { id: 'malachite', seal: '石绿', name: 'Malachite', colour: 0x40614a },
  { id: 'ochre', seal: '赭', name: 'Ochre', colour: 0x8a5a2b },
  { id: 'aubergine', seal: '紫', name: 'Aubergine', colour: 0x4a3355 },
] as const

export interface BuildStyle {
  readonly id: string
  readonly name: string
  /**
   * Horizontal scale on the finished figure.
   *
   * Applied to x only, never to height: a shorter swordsman would change how
   * much room the sprite needs and how the camera frames them, which is a
   * simulation change wearing a costume. Width is pure silhouette.
   */
  readonly width: number
}

export const BUILDS: readonly BuildStyle[] = [
  { id: 'lean', name: 'Lean', width: 0.88 },
  { id: 'even', name: 'Even', width: 1 },
  { id: 'broad', name: 'Broad', width: 1.14 },
] as const

export interface SashStyle {
  readonly id: string
  readonly name: string
  /** 0xRRGGBB, or null for a swordsman who wears none. */
  readonly colour: number | null
}

export const SASHES: readonly SashStyle[] = [
  { id: 'cinnabar', name: 'Cinnabar', colour: 0xc1272d },
  { id: 'ink', name: 'Ink', colour: 0x1a1a1a },
  { id: 'gold', name: 'Old gold', colour: 0xb08d2a },
  { id: 'none', name: 'None', colour: null },
] as const

export const DEFAULT_LOOK: Look = { seed: 7, build: 1, sash: 0, bearing: 0, pigment: 0 }

export function buildOf(look: Look): BuildStyle {
  return BUILDS[Math.min(BUILDS.length - 1, Math.max(0, look.build))] ?? BUILDS[1]!
}

export function sashOf(look: Look): SashStyle {
  return SASHES[Math.min(SASHES.length - 1, Math.max(0, look.sash))] ?? SASHES[0]!
}

export function bearingOf(look: Look): Bearing {
  return BEARINGS[Math.min(BEARINGS.length - 1, Math.max(0, look.bearing))] ?? BEARINGS[0]!
}

export function pigmentOf(look: Look): Pigment {
  return PIGMENTS[Math.min(PIGMENTS.length - 1, Math.max(0, look.pigment))] ?? PIGMENTS[0]!
}

/**
 * Repairs a look read from disk.
 *
 * Saves outlive the code that wrote them. A build index that no longer exists
 * must not be able to produce a figure with a NaN width — that would not throw,
 * it would silently draw nothing, and an invisible player character is the
 * single worst failure this file could cause.
 */
export function parseLook(raw: unknown): Look {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_LOOK
  const r = raw as Record<string, unknown>
  const int = (value: unknown, fallback: number, max: number): number => {
    const n = typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : fallback
    return Math.min(max, Math.max(0, n))
  }
  const seed = typeof r.seed === 'number' && Number.isFinite(r.seed) ? Math.floor(r.seed) : DEFAULT_LOOK.seed
  return {
    seed: seed >>> 0 || DEFAULT_LOOK.seed,
    build: int(r.build, DEFAULT_LOOK.build, BUILDS.length - 1),
    sash: int(r.sash, DEFAULT_LOOK.sash, SASHES.length - 1),
    bearing: int(r.bearing, DEFAULT_LOOK.bearing, BEARINGS.length - 1),
    pigment: int(r.pigment, DEFAULT_LOOK.pigment, PIGMENTS.length - 1),
  }
}
