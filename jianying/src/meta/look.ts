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
}

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

export const DEFAULT_LOOK: Look = { seed: 7, build: 1, sash: 0 }

export function buildOf(look: Look): BuildStyle {
  return BUILDS[Math.min(BUILDS.length - 1, Math.max(0, look.build))] ?? BUILDS[1]!
}

export function sashOf(look: Look): SashStyle {
  return SASHES[Math.min(SASHES.length - 1, Math.max(0, look.sash))] ?? SASHES[0]!
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
  }
}
