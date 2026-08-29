/**
 * 功法 icons — the shape of what an art DOES, drawn in the same ink.
 *
 * The arts were labelled with their Chinese seals, and that was wrong for the
 * place the label actually lives. In the hub, next to a name, 点 is exactly
 * right. On the strip during a run it is a reading test: the player has half a
 * second, one thumb busy, and four seals that share a stroke count. Nothing
 * about 点 tells you it makes your sweep run through what it hits.
 *
 * WHY NOT AN ICON PACK. game-icons.net and the CC0 packs are the usual answer
 * and they lose three ways here: they are drawn in a fantasy line style that
 * fights ink wash and would have to be redrawn to fit, they arrive as raster or
 * as paths that cannot be tinted per state without a second copy, and this
 * container cannot reach any of those hosts. AI-generated icons lose worse —
 * thirty images that must agree with each other, in a game with no raster
 * assets at all.
 *
 * WHAT IS DRAWN. Not a symbol for the art: a DIAGRAM of the effect. A spike
 * running through two marks is pierce. A faint second copy behind a stroke is
 * echo. A ring of blades is orbit. Sixteen effects, sixteen shapes, and the
 * shape is the explanation — which is the only kind of icon that survives being
 * glanced at while something is chasing you.
 *
 * That also means the vocabulary bounds the art: a new effect needs a glyph, so
 * the closed `EffectKind` list in data/arts.ts is what keeps this file from
 * growing without limit.
 *
 * The condition keeps its seal. It is five shapes, not sixteen, and it is the
 * half the player must LEARN rather than recognise — see docs/ARTES.md.
 */
import { Rng } from '../core/rng'
import { bowedSpine, elliptic, sweep, tapered, type Point } from './ink'
import type { EffectKind } from '../data/arts'

/**
 * One mark of a glyph.
 *
 * `role` carries meaning rather than a colour, so a caller can paint the same
 * geometry for a lit tile, a dim tile, a scroll entry or a printed sheet
 * without the glyph knowing which it is.
 */
export interface GlyphMark {
  /** Closed outline as flat [x, y, ...], in a 100×100 box centred on the origin. */
  readonly poly: number[]
  /**
   * `ink` the effect itself · `self` the swordsman, which takes the accent when
   * a tile is lit · `ghost` a repeat or a shadow, always faint.
   */
  readonly role: 'ink' | 'self' | 'ghost'
}

/** The box every glyph is drawn in. Callers size purely with CSS. */
export const GLYPH_BOX = 100

const P = (x: number, y: number): Point => ({ x, y })

/**
 * Where the swordsman stands when a glyph needs to show one.
 *
 * Only about half of these mean anything relative to the player — `magnet`
 * winding inward and `bolt` flying outward are the same marks otherwise — and
 * for those the wedge is the anchor that says which way the shape reads. The
 * rest are better without it, so each glyph passes its own position.
 */
const SELF = P(0, 0)

/** A stroke, in glyph units. */
const stroke = (
  from: Point,
  to: Point,
  bow: number,
  width: number,
  rng: Rng,
  taper = 0.22,
): number[] => sweep(bowedSpine(from, to, bow, 14), tapered(width, taper), rng, 1.3)

/** A round blot — a target, a droplet, a gem. */
const blot = (at: Point, r: number, rng: Rng): number[] =>
  sweep(bowedSpine(P(at.x - r * 0.5, at.y), P(at.x + r * 0.5, at.y), 0, 10), elliptic(r * 2), rng, 0.7)

/** An arc of a circle, from `a0` to `a1` radians. A full turn gives a ring. */
const arcAbout = (
  centre: Point,
  radius: number,
  a0: number,
  a1: number,
  width: number,
  rng: Rng,
): number[] => {
  const spine: Point[] = []
  const steps = 24
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps
    spine.push(P(centre.x + Math.cos(a) * radius, centre.y + Math.sin(a) * radius))
  }
  return sweep(spine, tapered(width, 0.3), rng, 1.1)
}

/** A hollow ring — a target seen through, rather than a blot. */
const ring = (centre: Point, radius: number, width: number, rng: Rng): number[] =>
  arcAbout(centre, radius, 0, Math.PI * 2.02, width, rng)

/** A spiral winding inward — the only shape in the set that turns on itself. */
const spiral = (centre: Point, from: number, to: number, turns: number, rng: Rng): number[] => {
  const spine: Point[] = []
  const steps = 48
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const a = t * Math.PI * 2 * turns
    const r = from + (to - from) * t
    spine.push(P(centre.x + Math.cos(a) * r, centre.y + Math.sin(a) * r))
  }
  return sweep(spine, tapered(5, 0.25), rng, 0.9)
}

/**
 * A closed shield: wide and round at the top, coming to a point below.
 *
 * The width profile does all the work — a vertical spine swept by a curve that
 * is fat at the crown and reaches zero at the foot. This shape exists to break
 * the crescent family: `arc`, `guard` and `push` all began as open curves and
 * were the same picture at tile size.
 */
const shield = (centre: Point, halfWidth: number, height: number, rng: Rng): number[] =>
  sweep(
    bowedSpine(P(centre.x, centre.y - height / 2), P(centre.x, centre.y + height / 2), 0, 16),
    (t) => halfWidth * 2 * Math.sqrt(Math.max(0, 1 - Math.pow(t * 1.02, 2.4))),
    rng,
    0.8,
  )

/** A dart: a stroke that comes to a hard point, for things that fly. */
const dart = (from: Point, to: Point, width: number, rng: Rng): number[] =>
  sweep(bowedSpine(from, to, 0, 12), (t) => width * (1 - t) ** 0.7, rng, 0.7)

/** The player wedge. Only drawn where the effect is relative to where you are. */
const selfMark = (rng: Rng, at: Point = SELF, r = 7): GlyphMark[] => [
  { poly: blot(at, r, rng), role: 'self' },
]

/**
 * The sixteen diagrams.
 *
 * ONE RULE, and it was learned the expensive way. The first draft drew each
 * effect as a faithful little picture, and at tile size three families
 * collapsed: `arc`, `guard` and `push` were all one crescent, `rate` and `bolt`
 * were both three parallel strokes, and `damage`, `pierce` and `echo` were all
 * a diagonal bar. Six of sixteen unreadable. So every glyph now owns a
 * SILHOUETTE CLASS that no other glyph may use — a bar, a stack of dashes, a
 * ring, a spiral, a shield, a star, a dimension line, an urn — and the detail
 * inside it is decoration. At 34px on a phone strip an interior line is one
 * pixel and does not exist, exactly as with the figures.
 *
 * The swordsman wedge appears only where the effect is RELATIVE to where you
 * stand. On `damage` or `rate` it was a second shape competing with the one
 * that carries the meaning.
 */
const DRAW: Record<EffectKind, (rng: Rng) => GlyphMark[]> = {
  // --- levers the simulation already has ---------------------------------

  /** ONE heavy blunt bar. The baseline weight everything else reads against. */
  damage: (rng) => [
    { poly: stroke(P(-26, 24), P(26, -24), 0, 26, rng, 0.06), role: 'ink' },
  ],

  /** A tight stack of short equal dashes. Frequency is repetition, close up. */
  rate: (rng) => [
    { poly: stroke(P(-20, 22), P(14, 14), 0, 9, rng, 0.15), role: 'ink' },
    { poly: stroke(P(-20, 4), P(14, -4), 0, 9, rng, 0.15), role: 'ink' },
    { poly: stroke(P(-20, -14), P(14, -22), 0, 9, rng, 0.15), role: 'ink' },
  ],

  /** A dimension line: a span with a stop at each end. Reach, measured. */
  range: (rng) => [
    { poly: stroke(P(-34, 0), P(34, 0), 0, 7, rng, 0.06), role: 'ink' },
    { poly: stroke(P(-34, -18), P(-34, 18), 0, 9, rng, 0.25), role: 'ink' },
    { poly: stroke(P(34, -22), P(34, 22), 0, 11, rng, 0.25), role: 'ink' },
  ],

  /** The wide open crescent. This glyph owns the curve; nothing else may. */
  arc: (rng) => [
    ...selfMark(rng, P(0, 26), 8),
    { poly: arcAbout(P(0, 26), 40, -Math.PI * 0.95, -Math.PI * 0.05, 13, rng), role: 'ink' },
  ],

  /** Chevrons behind the wedge. Direction, stacked — nothing else is a chevron. */
  speed: (rng) => [
    ...selfMark(rng, P(24, 0), 9),
    { poly: stroke(P(-4, -22), P(10, 0), 0, 8, rng, 0.2), role: 'ink' },
    { poly: stroke(P(-4, 22), P(10, 0), 0, 8, rng, 0.2), role: 'ink' },
    { poly: stroke(P(-26, -20), P(-14, 0), 0, 7, rng, 0.2), role: 'ghost' },
    { poly: stroke(P(-26, 20), P(-14, 0), 0, 7, rng, 0.2), role: 'ghost' },
  ],

  /** A spiral winding in. The only shape in the set that turns on itself. */
  magnet: (rng) => [
    { poly: spiral(P(0, 0), 42, 8, 1.6, rng), role: 'ink' },
    ...selfMark(rng, P(0, 0), 9),
  ],

  /** A hollow ring carrying two solid blades. */
  orbit: (rng) => [
    { poly: ring(P(0, 0), 32, 3.5, rng), role: 'ghost' },
    ...selfMark(rng, P(0, 0), 9),
    { poly: stroke(P(20, -26), P(38, -14), 0, 12, rng, 0.15), role: 'ink' },
    { poly: stroke(P(-20, 26), P(-38, 14), 0, 12, rng, 0.15), role: 'ink' },
  ],

  /** Darts that come to a point, thrown clear of the hand. */
  bolt: (rng) => [
    ...selfMark(rng, P(-32, 14), 8),
    { poly: dart(P(-10, 16), P(34, 6), 11, rng), role: 'ink' },
    { poly: dart(P(-14, 0), P(30, -16), 11, rng), role: 'ink' },
    { poly: dart(P(-18, -16), P(20, -38), 11, rng), role: 'ink' },
  ],

  /** Two rings going out together. Concentric, and nothing else is. */
  nova: (rng) => [
    ...selfMark(rng, P(0, 0), 8),
    { poly: ring(P(0, 0), 20, 7, rng), role: 'ink' },
    { poly: ring(P(0, 0), 38, 4, rng), role: 'ghost' },
  ],

  /**
   * A lid over a full body, with air between them. Capacity, not a heart.
   *
   * The neck was drawn joined to the body first and the three marks fused into
   * one silhouette that read as a light bulb. The gap is what makes it a vessel.
   */
  maxHp: (rng) => [
    { poly: stroke(P(-22, -32), P(22, -32), 0, 10, rng, 0.2), role: 'ink' },
    { poly: blot(P(0, 10), 28, rng), role: 'self' },
  ],

  // --- new simulation work ------------------------------------------------

  /** One thin line, skewering two rings. The rings are what make it pierce. */
  pierce: (rng) => [
    { poly: ring(P(-4, 6), 13, 4, rng), role: 'ghost' },
    { poly: ring(P(22, -22), 13, 4, rng), role: 'ghost' },
    { poly: stroke(P(-38, 34), P(40, -40), 0, 7, rng, 0.05), role: 'ink' },
  ],

  /** A star burst. Radiating from one point, going nowhere — impact, not flight. */
  crit: (rng) => [
    { poly: stroke(P(-30, -30), P(30, 30), 0, 9, rng, 0.02), role: 'ink' },
    { poly: stroke(P(30, -30), P(-30, 30), 0, 9, rng, 0.02), role: 'ink' },
    { poly: stroke(P(0, -38), P(0, 38), 0, 7, rng, 0.02), role: 'ink' },
    { poly: stroke(P(-38, 0), P(38, 0), 0, 7, rng, 0.02), role: 'ink' },
    { poly: blot(P(0, 0), 13, rng), role: 'self' },
  ],

  /** The same hooked cut twice, the second left behind. Doubling IS the glyph. */
  echo: (rng) => [
    { poly: stroke(P(6, -32), P(30, 18), 16, 11, rng, 0.12), role: 'ink' },
    { poly: stroke(P(-30, -18), P(-6, 32), 16, 11, rng, 0.12), role: 'ghost' },
  ],

  /**
   * A wall, and two things thrown clear of it.
   *
   * Three darts read as the teeth of a comb once the bar was close enough to
   * touch them. Two, further out and splayed, keep the wall a wall.
   */
  push: (rng) => [
    ...selfMark(rng, P(0, 34), 8),
    { poly: stroke(P(-36, 14), P(36, 14), 0, 15, rng, 0.1), role: 'ink' },
    { poly: dart(P(-18, -8), P(-32, -38), 11, rng), role: 'ink' },
    { poly: dart(P(18, -8), P(32, -38), 11, rng), role: 'ink' },
  ],

  /** A closed shield. The one filled, symmetrical body in the set. */
  guard: (rng) => [
    { poly: shield(P(0, -2), 24, 64, rng), role: 'ink' },
    { poly: dart(P(-42, -44), P(-16, -22), 8, rng), role: 'ghost' },
  ],

  /** A cross, and a drop falling into it. */
  heal: (rng) => [
    { poly: stroke(P(0, -8), P(0, 34), 0, 13, rng, 0.18), role: 'ink' },
    { poly: stroke(P(-21, 13), P(21, 13), 0, 13, rng, 0.18), role: 'ink' },
    { poly: blot(P(0, -30), 11, rng), role: 'self' },
  ],
}

/**
 * The geometry for one effect's glyph.
 *
 * Deterministic in the effect id alone: the same effect must produce the same
 * brush wander every time it is drawn, or the icon on the strip and the icon on
 * the scroll would be two different pictures of the same thing.
 */
export function artGlyph(effect: EffectKind): GlyphMark[] {
  // A per-effect seed, from the name, so adding an effect cannot renumber the
  // wander of the ones already drawn.
  let seed = 0x9e3779b9
  for (let i = 0; i < effect.length; i++) seed = (Math.imul(seed ^ effect.charCodeAt(i), 0x85ebca6b) >>> 0)
  return DRAW[effect](new Rng(seed))
}

export interface GlyphColours {
  readonly ink: number
  /** Colour for the `self` wedge. Defaults to the ink colour. */
  readonly self?: number
  /** Multiplied into every mark's opacity, for a dim tile. */
  readonly opacity?: number
}

/** Alpha per role, before `opacity` is applied. */
const ROLE_ALPHA: Record<GlyphMark['role'], number> = { ink: 0.92, self: 0.9, ghost: 0.3 }

const hex = (colour: number): string => `#${colour.toString(16).padStart(6, '0')}`

/**
 * A glyph as a complete `<svg>` string, sized by the CSS around it.
 *
 * The Pixi side reads `artGlyph()` directly and batches the same polygons, so
 * the HUD tile and the hub card cannot drift — the same rule that keeps the
 * figure honest between the game and the contact sheets.
 */
export function glyphSvg(effect: EffectKind, colours: GlyphColours, className = 'art-glyph'): string {
  const { ink, self = ink, opacity = 1 } = colours
  const body = artGlyph(effect)
    .map((mark) => {
      const pts: string[] = []
      for (let i = 0; i < mark.poly.length; i += 2) {
        pts.push(`${mark.poly[i]!.toFixed(1)},${mark.poly[i + 1]!.toFixed(1)}`)
      }
      const colour = mark.role === 'self' ? self : ink
      const alpha = (ROLE_ALPHA[mark.role] * opacity).toFixed(3)
      return `<polygon points="${pts.join(' ')}" fill="${hex(colour)}" fill-opacity="${alpha}"/>`
    })
    .join('')
  const h = GLYPH_BOX / 2
  return (
    `<svg class="${className}" viewBox="${-h} ${-h} ${GLYPH_BOX} ${GLYPH_BOX}" ` +
    `xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`
  )
}
