/**
 * The swordsman, assembled from brush strokes.
 *
 * Nothing here has interior detail — it is a silhouette, and the readability
 * that buys is the whole reason the art direction was chosen.
 *
 * Every mark is emitted twice: a wide, faint "bleed" pass underneath and the
 * solid stroke on top. That pair is what sells ink soaking into paper; a single
 * hard-edged fill reads as a vector shape no matter how good its outline is.
 */
import { Rng } from '../core/rng'
import { bowedSpine, calligraphic, elliptic, sweep, type Point, type WidthProfile } from './ink'
import { DEFAULT_GEAR, type BladeStyle, type Gear } from './wardrobe'

export interface FigureStroke {
  poly: number[]
  alpha: number
}

/** Widens a profile by a constant, for the bleed pass. */
const widen =
  (profile: WidthProfile, by: number): WidthProfile =>
  (t) =>
    profile(t) + by

export interface Swordsman {
  /** Faint wide pass, drawn first. */
  bleed: FigureStroke[]
  /** Solid pass, drawn over the bleed. */
  body: FigureStroke[]
  /** Where the sash attaches, in local space. */
  sashAnchor: Point
  /** Where the blade's tip sits at rest, for trail effects. */
  bladeTip: Point
  height: number
}

/**
 * The swordsman seen from a three-quarter overhead camera, facing the viewer.
 *
 * Local space: origin at the feet, ~44 units tall — shorter than the side
 * profile because an overhead camera foreshortens height. The character is
 * symmetric and never mirrors, which is the point: in a side profile, turning
 * left-to-right had to flip scale.x through zero, and that flip visibly
 * squashed the figure flat on every direction change.
 *
 * The sword is NOT part of this geometry. It is drawn separately so it can
 * rotate freely around the body to point wherever the player is heading, which
 * a baked-in arm cannot do across eight directions.
 *
 * Every measurement below comes from `gear` rather than being written into the
 * function. That is what makes equipment visible: a robe is not a picture laid
 * over the character, it is where the robe's spine goes, so a longer hem really
 * is a longer silhouette. See render/wardrobe.ts.
 */
export function buildSwordsmanTopDown(seed = 1, scale = 1, gear: Gear = DEFAULT_GEAR): Swordsman {
  const rng = new Rng(seed)
  const s = scale
  const body: FigureStroke[] = []
  const bleed: FigureStroke[] = []

  const mark = (
    from: Point,
    to: Point,
    bow: number,
    width: WidthProfile,
    opts: { alpha?: number; segments?: number; jitter?: number; bleedBy?: number } = {},
  ): void => {
    const { alpha = 1, segments = 22, jitter = 0.85 * s, bleedBy = 1.5 * s } = opts
    const spine = bowedSpine(from, to, bow, segments)
    const bleedPoly = sweep(spine, widen(width, bleedBy), rng, jitter * 1.5)
    if (bleedPoly.length >= 6) bleed.push({ poly: bleedPoly, alpha: alpha * 0.16 })
    const poly = sweep(spine, width, rng, jitter)
    if (poly.length >= 6) body.push({ poly, alpha })
  }

  const { robe, shoulders, head } = gear

  // ---- Robe -------------------------------------------------------------
  // Seen from above the hem reads as a skirt spreading toward the camera, so
  // the flare is stronger and the whole shape shorter than in profile.
  const spread = robe.hemWidth - robe.topWidth
  mark(
    { x: 0, y: robe.top * s },
    { x: 0, y: robe.bottom * s },
    robe.bow * s,
    (t) => (robe.topWidth + t * spread) * s,
    { alpha: 0.97, segments: 26, jitter: 1.1 * s },
  )

  // A second, shorter panel over the first. Two hems at different heights is
  // the cheapest way to read as "wearing more" rather than "wearing bigger".
  if (robe.overlay) {
    const outer = robe.overlay
    const outerSpread = outer.hemWidth - outer.topWidth
    mark(
      { x: 0, y: outer.top * s },
      { x: 0, y: outer.bottom * s },
      0,
      (t) => (outer.topWidth + t * outerSpread) * s,
      { alpha: 0.9, segments: 20, jitter: 0.9 * s },
    )
  }

  // ---- Shoulders and sleeves --------------------------------------------
  // Elliptic, not calligraphic: a brush profile keeps most of its width at the
  // ends, which turned the shoulders into a hard rectangle.
  const shoulderY = -32 * s

  // A mantle sits behind everything, so it reads as cloth the arms hang over.
  if (shoulders.mantle) {
    mark(
      { x: -shoulders.mantle * s, y: -29 * s },
      { x: shoulders.mantle * s, y: -29 * s },
      3 * s,
      elliptic(15 * s),
      { alpha: 0.55, segments: 22, jitter: 1.2 * s },
    )
  }

  mark(
    { x: -shoulders.span * s, y: shoulderY },
    { x: shoulders.span * s, y: shoulderY },
    0.5 * s,
    elliptic(shoulders.cap * s),
    { segments: 20, jitter: 0.6 * s },
  )

  for (const side of [-1, 1]) {
    mark(
      { x: side * (shoulders.span - 2) * s, y: shoulderY },
      { x: side * shoulders.sleeveOut * s, y: (shoulderY / s + shoulders.sleeveDrop) * s },
      -side * shoulders.sleeveBow * s,
      calligraphic(shoulders.sleeveWidth * s, 0.7, 0.15),
      { alpha: 0.92 },
    )
    if (shoulders.pauldron) {
      mark(
        { x: side * (shoulders.span - 1) * s, y: (shoulderY / s - 1.5) * s },
        { x: side * (shoulders.span + 5) * s, y: (shoulderY / s + 3) * s },
        side * 1.5 * s,
        elliptic(shoulders.pauldron * s),
        { segments: 16, jitter: 0.4 * s },
      )
    }
  }

  // A belt is drawn after the sleeves so it reads as cinching them in.
  if (robe.belt !== undefined) {
    mark(
      { x: -8 * s, y: robe.belt * s },
      { x: 8 * s, y: robe.belt * s },
      0,
      elliptic(4 * s),
      { alpha: 0.75, segments: 14, jitter: 0.3 * s },
    )
  }

  // ---- Head -------------------------------------------------------------
  // Sits clear of the shoulders with just enough overlap to avoid a seam. In an
  // overhead view a head that merges into the torso leaves an unreadable blob.
  const hw = head.headWidth
  mark(
    { x: -hw * 0.46 * s, y: -40 * s },
    { x: hw * 0.46 * s, y: -39.6 * s },
    0.3 * s,
    elliptic(hw * s),
    { segments: 18, jitter: 0.35 * s, bleedBy: 0.9 * s },
  )

  if (head.knot) {
    // Rising straight up, since there is no profile to lean into.
    mark(
      { x: 0, y: -44 * s },
      { x: head.knot.lean * s, y: (-44 - head.knot.rise) * s },
      1 * s,
      calligraphic(head.knot.width * s, 0.55, 0.1),
      { segments: 12, jitter: 0.3 * s, bleedBy: 0.7 * s },
    )
  }

  if (head.crown) {
    // Squared off rather than tapered: a crown must not read as another topknot.
    mark(
      { x: 0, y: -43 * s },
      { x: 0, y: (-43 - head.crown.rise) * s },
      0,
      () => head.crown!.width * s,
      { segments: 10, jitter: 0.25 * s, bleedBy: 0.6 * s },
    )
    mark(
      { x: -head.crown.width * 0.9 * s, y: (-43 - head.crown.rise * 0.55) * s },
      { x: head.crown.width * 0.9 * s, y: (-43 - head.crown.rise * 0.55) * s },
      0,
      elliptic(2.2 * s),
      { alpha: 0.8, segments: 10, jitter: 0.2 * s, bleedBy: 0.4 * s },
    )
  }

  if (head.hat) {
    // Drawn last so the brim overlaps the head, which is what makes a disc read
    // as sitting ON somebody rather than floating above them.
    const brimY = (-40 - head.hat.lift) * s
    mark(
      { x: -head.hat.span * s, y: brimY },
      { x: head.hat.span * s, y: brimY },
      1.2 * s,
      elliptic(head.hat.thickness * s),
      { alpha: 0.95, segments: 26, jitter: 0.5 * s, bleedBy: 1.1 * s },
    )
    if (head.veil) {
      for (const side of [-1, 1]) {
        mark(
          { x: side * head.hat.span * 0.72 * s, y: brimY },
          { x: side * head.hat.span * 0.55 * s, y: (brimY / s + head.veil) * s },
          side * 1.5 * s,
          calligraphic(3.4 * s, 0.8, 0.4),
          { alpha: 0.42, segments: 14, jitter: 0.5 * s },
        )
      }
    }
  }

  // The tallest thing worn decides how much room the figure needs.
  const crest = 50 + (head.hat ? head.hat.lift + 2 : 0) + (head.crown ? head.crown.rise - 6 : 0)

  return {
    bleed,
    body,
    // Behind the shoulders, so the ribbon reads as tied at the back.
    sashAnchor: { x: 0, y: -33 * s },
    bladeTip: { x: 0, y: 0 },
    height: crest * s,
  }
}

/**
 * The blade, as its own stroke, drawn pointing along +x from a pivot at the
 * character's hands. The renderer rotates it to the aim direction.
 */
export function buildBlade(
  seed = 2,
  scale = 1,
  style: BladeStyle = DEFAULT_GEAR.blade,
): FigureStroke[] {
  const rng = new Rng(seed)
  const s = scale
  const out: FigureStroke[] = []

  const width: WidthProfile = (t) =>
    (style.baseWidth - t * (style.baseWidth - style.tipWidth)) * s

  // Fanned about the hand, so twin blades and a fan are the same code with a
  // different count — the silhouette that results is completely different.
  const half = (style.count - 1) / 2
  for (let i = 0; i < style.count; i++) {
    const angle = (i - half) * style.spread
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const from = { x: 6 * s * cos, y: 6 * s * sin }
    const to = {
      x: style.reach * s * cos - -3 * s * sin,
      y: style.reach * s * sin + -3 * s * cos,
    }
    const spine = bowedSpine(from, to, style.bow * s, 24)

    const bleedPoly = sweep(spine, widen(width, 0.6 * s), rng, 0.4 * s)
    if (bleedPoly.length >= 6) out.push({ poly: bleedPoly, alpha: 0.14 })
    const poly = sweep(spine, width, rng, 0.2 * s)
    if (poly.length >= 6) out.push({ poly, alpha: 0.95 })
  }

  // A crossguard: short, perpendicular, and the one mark that separates a
  // heavy blade from a long one at a glance.
  if (style.guard) {
    const guard = bowedSpine(
      { x: 7 * s, y: -style.guard * s },
      { x: 7 * s, y: style.guard * s },
      0,
      8,
    )
    const guardPoly = sweep(guard, elliptic(2.6 * s), rng, 0.2 * s)
    if (guardPoly.length >= 6) out.push({ poly: guardPoly, alpha: 0.9 })
  }

  return out
}

/**
 * A sash that trails behind the figure.
 *
 * A travelling-wave approximation rather than a cloth simulation: each segment
 * lags the one before it in phase, and the whole ribbon is dragged opposite to
 * movement. It is a handful of sines, and it does more for "this character is
 * alive" than any amount of added detail would.
 *
 * `trailX`/`trailY` is the unit direction the ribbon should stream along —
 * normally the opposite of travel. In the overhead view this is a free 2D
 * vector rather than the old "behind means local -x", which only had a meaning
 * while the character could face two ways.
 */
export function sashSpine(
  anchor: Point,
  time: number,
  trailX: number,
  trailY: number,
  speed: number,
  scale = 1,
  segments = 16,
  length = 42,
): Point[] {
  const points: Point[] = []
  // Faster movement streams the ribbon straight out; at rest it settles.
  const pull = 0.45 + Math.min(1, speed / 220) * 0.55
  // The perpendicular, for the wave to travel along.
  const perpX = -trailY
  const perpY = trailX

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const reach = t * length * scale * pull
    // Later segments lag further in phase — that lag is the wave.
    const wave = Math.sin(time * 5.2 - t * 5.0) * (1.5 + t * 9) * scale
    // With little airflow the cloth simply hangs toward the camera.
    const settle = t * t * 16 * scale * (1 - Math.min(1, speed / 200))
    points.push({
      x: anchor.x + trailX * reach + perpX * wave * 0.55,
      y: anchor.y + trailY * reach + perpY * wave * 0.55 + settle,
    })
  }
  return points
}

/** Sweeps a sash spine into a drawable outline. */
export function sashPoly(spine: Point[], rng: Rng, scale = 1): number[] {
  return sweep(spine, calligraphic(4.6 * scale, 0.8, 0.04), rng, 0.35 * scale)
}
