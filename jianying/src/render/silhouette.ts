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
import { allRankMarks } from './rankMarks'
import type { Slot } from '../data/items'
import { palette } from './palette'
import type { Gear } from './wardrobe'
import { bearingOf, buildOf, pigmentOf, sashOf, type Look } from '../meta/look'

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
  /**
   * Worn pieces and the rank each is held at, so the figure can wear its rank.
   *
   * Optional because most callers — a school card on the creation screen, a
   * roster thumbnail — are drawing a swordsman who owns nothing yet.
   */
  readonly ranked?: ReadonlyArray<{ slot: Slot; rank: number }>
  /** Height of the viewBox in figure units. Width is derived. */
  readonly box?: number
  /** Draw the blade beside the figure. */
  readonly blade?: boolean
  /** Ink colour. Defaults to the palette's. */
  readonly ink?: number
  /**
   * Ground colour, for carved marks. Defaults to the palette's paper.
   *
   * A cut is only a hole if it is painted the colour of what is behind it, so
   * anything drawing this portrait on a different ground has to say so — on the
   * title screen's dark panel the default would punch paper-coloured holes.
   */
  readonly ground?: number
}

/**
 * A standing portrait of one swordsman, as a complete `<svg>` string.
 *
 * The viewBox is in figure units with the origin at the feet, so the caller
 * sizes it purely with CSS and never has to know the geometry's scale.
 */
export function portraitSvg(gear: Gear, look: Look, options: PortraitOptions = {}): string {
  const { box = 78, blade = true, ink = palette.ink, ground = palette.paper, ranked } = options
  const build = buildOf(look).width
  const sash = sashOf(look)
  const bearing = bearingOf(look)
  // Null means undyed cloth, which stays ink — the default, and still the most
  // common thing a swordsman on this road is wearing.
  const dye = pigmentOf(look).colour

  // Scale 1: the viewBox does the sizing, so the geometry stays in its native
  // units and the brush jitter keeps the proportion it was tuned at.
  const figure = buildSwordsmanTopDown(look.seed, 1, gear, build, bearing)

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
    //
    // It hangs from the waist knot and past the hem. Anchored at the collar it
    // came out as a short red hook across the chest, because a stroke that
    // short cannot read as cloth however it is coloured.
    const a = figure.sashAnchor
    parts.push(
      `<path d="M ${a.x.toFixed(1)} ${a.y.toFixed(1)} ` +
        `q ${(-5 * build).toFixed(1)} 3 ${(-6 * build).toFixed(1)} 8 ` +
        `q ${(-0.3 * build).toFixed(1)} 3 ${(1.2 * build).toFixed(1)} 4" ` +
        `fill="none" stroke="${hex(sash.colour)}" stroke-width="2.4" ` +
        `stroke-linecap="round" stroke-opacity="0.9"/>`,
    )
  }

  // The robe takes the dye, a cut takes the ground, and every other mark stays
  // ink. That split is the whole of "colour without losing the silhouette" —
  // the head, the shoulders and the blade still read black against paper no
  // matter what the robe is dyed.
  const inkOf = (stroke: FigureStroke): number =>
    stroke.part === 'cut' ? ground : stroke.part === 'robe' && dye !== null ? dye : ink
  for (const stroke of figure.bleed) parts.push(strokeToPolygon(stroke, inkOf(stroke)))
  for (const stroke of figure.body) parts.push(strokeToPolygon(stroke, inkOf(stroke)))

  // Rank, worn where it can be seen — over the body, because a hem lies on top
  // of the cloth it belongs to. Gold rather than ink: it is the one thing on
  // the figure that is not a garment, and it has to survive being drawn on a
  // robe that may itself be dyed.
  if (ranked && ranked.length > 0) {
    for (const stroke of allRankMarks(ranked, figure, 1, look.seed)) {
      parts.push(strokeToPolygon(stroke, palette.gold))
    }
  }

  if (blade) {
    // Held at the side, tip toward the ground — the way a sword is carried when
    // nobody is being cut. The first attempt left it floating clear of the
    // figure at shoulder height, which read as a stray brush mark rather than a
    // weapon; it now hangs from the hand the figure actually has, and is drawn
    // over the body so the grip reads as in front of the robe rather than
    // buried in it.
    const marks = buildBlade(look.seed + 1, 1, gear.blade)
    const hand = figure.hand
    // Raised, not lowered. The hand sits about eleven units off the ground, so
    // a forty-unit blade pointed down leaves the frame before it leaves the
    // body — which is exactly what the first version did.
    //
    // Long weapons are then foreshortened to fit. A spear is nearly twice the
    // figure's height, and a box that contained it would shrink the swordsman
    // to a third of the card; drawing it at 0.6 keeps it reading as the longest
    // and thinnest thing in the wardrobe, which is the distinction that
    // matters, at the cost of its literal length. This is a portrait, and
    // portraits foreshorten.
    const fit = Math.min(1, 46 / gear.blade.reach)
    parts.push(
      `<g transform="translate(${hand.x.toFixed(1)},${hand.y.toFixed(1)}) ` +
        `rotate(-62) scale(${fit.toFixed(3)}) translate(-7,3)">`,
    )
    for (const stroke of marks) parts.push(strokeToPolygon(stroke, ink))
    parts.push('</g>')
  }

  // Wider than tall in ratio terms, because a lowered blade reaches further to
  // the side than the figure does and a tighter box clipped its tip.
  const half = box * 0.46
  return (
    `<svg class="portrait-svg" viewBox="${-half} ${-box + 8} ${half * 2} ${box}" ` +
    `preserveAspectRatio="xMidYMax meet" aria-hidden="true">${parts.join('')}</svg>`
  )
}
