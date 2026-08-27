/**
 * 水墨 (shuǐmò) ink-wash palette.
 *
 * Four colours, and deliberately no more. A tight palette is what makes hand-
 * drawn and generated art sit together without looking like a collage, and it
 * keeps 400 on-screen silhouettes readable: the player must be able to parse
 * threat at a glance, which a rich palette actively works against.
 */
export const palette = {
  /** Brush black. Enemies, strokes, outlines. */
  ink: 0x0d0d0d,
  inkSoft: 0x2a2724,
  /** Aged paper. The ground the whole game sits on. */
  paper: 0xe8dcc0,
  paperDeep: 0xc9b998,
  paperShadow: 0xa89878,
  /** Cinnabar red — seals, damage, danger. Used sparingly so it stays loud. */
  cinnabar: 0xc1272d,
  /** Gold — qi, pickups, the player's own techniques. */
  gold: 0xd4af37,
  goldPale: 0xf0d98a,
  /** Gold dark enough to read as text on paper. Matches the art chips in CSS. */
  goldDeep: 0x8a6d16,
} as const

export const paletteCss = {
  ink: '#0d0d0d',
  paper: '#e8dcc0',
  cinnabar: '#c1272d',
  gold: '#d4af37',
} as const

/** Mixes two packed 0xRRGGBB colours. `t` 0 = a, 1 = b. */
export function mixColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff
  const ag = (a >> 8) & 0xff
  const ab = a & 0xff
  const br = (b >> 16) & 0xff
  const bg = (b >> 8) & 0xff
  const bb = b & 0xff
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return (r << 16) | (g << 8) | bl
}
