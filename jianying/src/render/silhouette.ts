/**
 * The swordsman, drawn as inline SVG for the DOM screens.
 *
 * This exists because the hub had a genuine hole in it: the game is drawn
 * entirely in ink silhouettes, the wardrobe can assemble nine hundred of them,
 * and the one screen where the player chooses their equipment did not draw the
 * character at all. It listed the items as text. So the whole visible half of a
 * loot game was invisible in the place it mattered most.
 *
 * The fix is cheap because the figure builders are pure geometry — they return
 * polygons, not draw calls. The same arrays Pixi batches into WebGL can be
 * written straight into `<polygon>` elements, which means:
 *
 *   - no second Pixi canvas competing with the game's renderer for context
 *   - no offscreen render target, no texture upload, no readback
 *   - it scales with the CSS around it, because it is vector
 *   - it works before the renderer has ever been initialised
 *
 * `tools/wardrobe.ts` writes the same polygons to a contact sheet. Both call
 * this, so the sheet and the game cannot drift apart.
 */
import { buildBlade, buildSwordsmanTopDown, type FigureStroke } from './figure'
import { palette } from './palette'
import type { Gear } from './wardrobe'
import { buildOf, sashOf, type Look } from '../meta/look'

const hex = (colour: number): string => `#${colour.toString(16).padStart(6, '0')}`

/** One stroke as an SVG polygon. Coordinates are trimmed — this goes in the DOM. */
export function strokeToPolygon(stroke: FigureStroke, colour: number): string {
  const pts: string[] = []
  for (let i = 0; i < stroke.poly.length; i += 2) {
    pts.push(`${stroke.poly[i]!.toFixed(1)},${stroke.poly[i + 1]!.toFixed(1)}`)
  }
  return `<polygon points="${pts.join(' ')}" fill="${hex(colour)}" fill-opacity="${stroke.alpha.toFixed(3)}"/>`
}

export interface PortraitOptions {
  /** Height of the viewBox in figure units. Width is derived. */
  readonly box?: number
  /** Draw the blade beside the figure. */
  readonly blade?: boolean
  /** Ink colour. Defaults to the palette's. */
  readonly ink?: number
}

/**
 * A standing portrait of one swordsman, as a complete `<svg>` string.
 *
 * The viewBox is in figure units with the origin at the feet, so the caller
 * sizes it purely with CSS and never has to know the geometry's scale.
 */
export function portraitSvg(gear: Gear, look: Look, options: PortraitOptions = {}): string {
  const { box = 78, blade = true, ink = palette.ink } = options
  const build = buildOf(look).width
  const sash = sashOf(look)

  // Scale 1: the viewBox does the sizing, so the geometry stays in its native
  // units and the brush jitter keeps the proportion it was tuned at.
  const figure = buildSwordsmanTopDown(look.seed, 1, gear, build)

  const parts: string[] = []

  // Ground shadow, first and underneath. One ellipse, and it does a surprising
  // amount of work: without it the figure floats, and a floating silhouette
  // reads as a sticker rather than as somebody standing.
  parts.push(
    `<ellipse cx="0" cy="2" rx="${(11 * build).toFixed(1)}" ry="3.4" ` +
      `fill="${hex(ink)}" fill-opacity="0.1"/>`,
  )

  if (sash.colour !== null) {
    // BEHIND the body, deliberately. In play the sash flips in front or behind
    // depending on which way the swordsman faces; a portrait has one pose, and
    // a ribbon draped over the chest reads as a strap rather than as cloth tied
    // at the back. Drawn as a curve rather than run through the game's cloth
    // simulation, because that simulation trails from velocity and wind — at a
    // standstill it hangs dead straight, which looks like a bug.
    const a = figure.sashAnchor
    parts.push(
      `<path d="M ${a.x.toFixed(1)} ${a.y.toFixed(1)} ` +
        `q ${(11 * build).toFixed(1)} 6 ${(13 * build).toFixed(1)} 17 ` +
        `q ${(-1 * build).toFixed(1)} 6 ${(-6 * build).toFixed(1)} 9" ` +
        `fill="none" stroke="${hex(sash.colour)}" stroke-width="2.8" ` +
        `stroke-linecap="round" stroke-opacity="0.85"/>`,
    )
  }

  if (blade) {
    // Held at the side, tip toward the ground — the way a sword is carried when
    // nobody is being cut. The first attempt left it floating clear of the
    // figure at shoulder height, which read as a stray brush mark rather than a
    // weapon, so it is anchored at the hand and angled down across the body's
    // own silhouette.
    const marks = buildBlade(look.seed + 1, 1, gear.blade)
    parts.push(`<g transform="translate(${(8 * build).toFixed(1)},-26) rotate(56)">`)
    for (const stroke of marks) parts.push(strokeToPolygon(stroke, ink))
    parts.push('</g>')
  }

  for (const stroke of figure.bleed) parts.push(strokeToPolygon(stroke, ink))
  for (const stroke of figure.body) parts.push(strokeToPolygon(stroke, ink))

  // Wider than tall in ratio terms, because a lowered blade reaches further to
  // the side than the figure does and a tighter box clipped its tip.
  const half = box * 0.46
  return (
    `<svg class="portrait-svg" viewBox="${-half} ${-box + 8} ${half * 2} ${box}" ` +
    `preserveAspectRatio="xMidYMax meet" aria-hidden="true">${parts.join('')}</svg>`
  )
}
