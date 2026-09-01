/**
 * What a piece of equipment looks like lying on the ground.
 *
 * WHY THIS FILE EXISTS. The first version drew a drop as an ink lozenge with a
 * coloured rim, and a playtest on a real phone reported it exactly right: "it's
 * just a black dot". Two things were wrong with it, and only one of them was
 * about contrast.
 *
 *   - A lozenge is not a thing. It does not say EQUIPMENT, it does not say
 *     which slot, and next to four hundred ink silhouettes and a scatter of qi
 *     motes it says nothing at all. A player has no reason to cross the field
 *     for a shape that carries no promise.
 *   - Rarity was doing two jobs: how loudly the piece announces itself AND
 *     whether it could be seen. So the common piece — the one a new player
 *     finds first, and the one most likely to be their first upgrade — was the
 *     least visible object in the game.
 *
 * The fix separates those jobs. Every piece, at every rung, gets the SAME
 * plaque: a disc of pale paper, a ring, and the silhouette of the slot it fits.
 * That is the floor, and it is what makes a drop legible as loot. Rarity then
 * buys only the volume — the ring's colour, and the shaft of light above it,
 * which is drawn by the caller.
 *
 * THE SHAPES ARE COARSE ON PURPOSE. Each glyph is about 20 device pixels tall
 * on a phone. Anything with interior detail turns to mush at that size, so each
 * one is built from two or three flat polygons chosen to be distinguishable by
 * SILHOUETTE alone — the same constraint the enemy art works under, and the
 * reason this game reads at all with a crowd on screen.
 *
 * HOW THESE WERE TUNED, and how to do it again. Two of the four glyphs were
 * wrong on the first pass in ways no amount of reading the coordinates would
 * have revealed — the headgear read as a tunnel mouth, and the robe read as a
 * mountain, which on a field of ink landscape washes is worse than reading as
 * nothing. Both were caught by laying one piece of every slot at every rung on
 * the field and photographing it. That harness is not kept in the tree, because
 * it needs a hook that spawns loot on demand and the shipped bundle has no
 * business carrying one; recreating it is twenty minutes with tools/shoot.ts as
 * the template. Do that rather than trusting the numbers.
 */
import type { Graphics } from 'pixi.js'
import { palette } from './palette'

/** Radius of the plaque. Everything else is sized against this. */
export const MARK_RADIUS = 11

/**
 * How high the piece floats above the point it fell on.
 *
 * It floats rather than lying flat because the ground is a texture and the
 * field is seen from three-quarters above: a mark drawn ON the ground competes
 * with the paper grain, and a mark drawn above it has a shadow, which is the
 * cheapest depth cue there is.
 */
const LIFT = 15

/** How far the piece bobs, and how fast. Slow enough to read as weight. */
const BOB = 1.8
const BOB_RATE = 2.1

/**
 * The silhouette for one slot, as flat polygons in mark space.
 *
 * Centred on (0, 0) and drawn point-down or bottom-heavy, so each one hangs
 * inside the plaque the same way. `cut` is subtracted in the plaque's own
 * colour rather than being a hole, because a hole would show whatever happens
 * to be behind the drop.
 */
interface SlotGlyph {
  readonly fill: readonly number[][]
  readonly cut?: readonly number[][]
}

const GLYPHS: Record<string, SlotGlyph> = {
  /** A blade, point down, as though driven into the ground. */
  weapon: {
    fill: [
      [-1.7, -6, 1.7, -6, 1.7, 2.6, 0, 6.4, -1.7, 2.6],
      [-5.4, -7.4, 5.4, -7.4, 5.4, -5.8, -5.4, -5.8],
      [-1.1, -9.6, 1.1, -9.6, 1.1, -7.4, -1.1, -7.4],
    ],
  },
  /**
   * A conical 斗笠, brim and crown.
   *
   * The first attempt was a dome over a band with a notch cut from it, and a
   * screenshot settled it: at this size it read as a tunnel mouth, or a no-entry
   * sign, and certainly not as something you wear on your head. A cone on a wide
   * brim is the one headgear silhouette that survives being 20 pixels tall.
   */
  head: {
    fill: [
      [-4.6, 0.4, 0, -7, 4.6, 0.4],
      [-8, 0.4, 8, 0.4, 6.2, 3.2, -6.2, 3.2],
    ],
  },
  /** Pauldrons: two chevrons, the stacked plates of a shoulder guard. */
  shoulders: {
    fill: [
      [-7, -4.6, 0, -0.4, 7, -4.6, 7, -2, 0, 2.2, -7, -2],
      [-5.6, 1.2, 0, 4.6, 5.6, 1.2, 5.6, 3.8, 0, 7.2, -5.6, 3.8],
    ],
  },
  /**
   * A robe: wide sleeves across, a body tapering to a flared hem.
   *
   * A plain trapezoid with a notch was the first try and it read as a MOUNTAIN
   * — two peaks with a valley — which is both wrong and, on a field of ink
   * landscape washes, actively confusing. The sleeve bar is what makes it
   * clothing: nothing else on screen is a horizontal bar with a body hanging
   * off it.
   */
  robe: {
    fill: [
      [-7.6, -4.6, 7.6, -4.6, 7.6, -1.8, -7.6, -1.8],
      [-3.4, -5.6, 3.4, -5.6, 5.2, 6.6, -5.2, 6.6],
    ],
    cut: [[-1.9, -5.6, 1.9, -5.6, 0, -2.2]],
  },
}

/** Falls back to the robe's shape, which reads as "a thing you wear". */
const glyphFor = (slot: string): SlotGlyph => GLYPHS[slot] ?? GLYPHS.robe!

/** Where the mark's centre sits this frame, so the caller can aim a label. */
export function markCentre(y: number, rise: number, time: number, phase: number): number {
  return y - LIFT * rise + Math.sin(time * BOB_RATE + phase) * BOB
}

/**
 * Draws one piece on the ground.
 *
 * `rise` is 0..1 over the settle animation, so a drop reads as having LANDED
 * rather than as having always been there. `colour` is the rung's — the only
 * thing on the whole mark that rarity is allowed to change.
 */
export function drawDropMark(
  g: Graphics,
  x: number,
  y: number,
  slot: string,
  colour: number,
  rise: number,
  time: number,
  phase: number,
): void {
  const cy = markCentre(y, rise, time, phase)
  const r = MARK_RADIUS * rise

  // The shadow stays on the ground and tightens as the piece rises, which is
  // what sells the float without costing a second draw pass.
  const gap = (y - cy) / LIFT
  g.ellipse(x, y + 1, 7.5 - gap * 1.8, 2.8 - gap * 0.7).fill({
    color: palette.paperShadow,
    alpha: 0.5 * rise,
  })

  // The plaque. Pale, opaque, and the same at every rung — this is the part
  // that makes a common piece findable at all.
  g.circle(x, cy, r).fill({ color: palette.paper, alpha: 0.95 * rise })
  g.circle(x, cy, r).stroke({ color: palette.ink, width: 1, alpha: 0.28 * rise })

  const glyph = glyphFor(slot)
  for (const poly of glyph.fill) {
    g.poly(shift(poly, x, cy, rise)).fill({ color: palette.ink, alpha: 0.9 * rise })
  }
  for (const poly of glyph.cut ?? []) {
    g.poly(shift(poly, x, cy, rise)).fill({ color: palette.paper, alpha: 0.95 * rise })
  }

  // The rung, last, so it sits over the glyph's edge and reads as a mount
  // around the piece rather than as a halo behind it.
  g.circle(x, cy, r).stroke({ color: colour, width: 2.4, alpha: 0.95 * rise })
}

/** Moves a glyph polygon into world space at the mark's scale. */
function shift(poly: readonly number[], x: number, y: number, scale: number): number[] {
  const out = new Array<number>(poly.length)
  for (let i = 0; i < poly.length; i += 2) {
    out[i] = x + poly[i]! * scale
    out[i + 1] = y + poly[i + 1]! * scale
  }
  return out
}
