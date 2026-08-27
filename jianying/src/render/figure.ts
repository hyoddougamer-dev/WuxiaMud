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
 */
export function buildSwordsmanTopDown(seed = 1, scale = 1): Swordsman {
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

  // ---- Robe -------------------------------------------------------------
  // Seen from above the hem reads as a skirt spreading toward the camera, so
  // the flare is stronger and the whole shape shorter than in profile.
  mark({ x: 0, y: -29 * s }, { x: 0, y: 0 }, 0, (t) => (8 + t * 16) * s, {
    alpha: 0.97,
    segments: 26,
    jitter: 1.1 * s,
  })

  // ---- Shoulders and sleeves --------------------------------------------
  // Elliptic, not calligraphic: a brush profile keeps most of its width at the
  // ends, which turned the shoulders into a hard rectangle.
  mark({ x: -9 * s, y: -32 * s }, { x: 9 * s, y: -32 * s }, 0.5 * s, elliptic(11 * s), {
    segments: 20,
    jitter: 0.6 * s,
  })
  mark({ x: -7 * s, y: -32 * s }, { x: -13 * s, y: -19 * s }, 1.5 * s, calligraphic(6 * s, 0.7, 0.15), {
    alpha: 0.92,
  })
  mark({ x: 7 * s, y: -32 * s }, { x: 13 * s, y: -19 * s }, -1.5 * s, calligraphic(6 * s, 0.7, 0.15), {
    alpha: 0.92,
  })

  // ---- Head -------------------------------------------------------------
  // Sits clear of the shoulders with just enough overlap to avoid a seam. In an
  // overhead view a head that merges into the torso leaves an unreadable blob.
  mark({ x: -4.6 * s, y: -40 * s }, { x: 4.6 * s, y: -39.6 * s }, 0.3 * s, elliptic(10 * s), {
    segments: 18,
    jitter: 0.35 * s,
    bleedBy: 0.9 * s,
  })

  // Topknot, rising straight up since there is no profile to lean into.
  mark({ x: 0, y: -44 * s }, { x: -1 * s, y: -50 * s }, 1 * s, calligraphic(3.8 * s, 0.55, 0.1), {
    segments: 12,
    jitter: 0.3 * s,
    bleedBy: 0.7 * s,
  })

  return {
    bleed,
    body,
    // Behind the shoulders, so the ribbon reads as tied at the back.
    sashAnchor: { x: 0, y: -33 * s },
    bladeTip: { x: 0, y: 0 },
    height: 50 * s,
  }
}

/**
 * The blade, as its own stroke, drawn pointing along +x from a pivot at the
 * character's hands. The renderer rotates it to the aim direction.
 */
export function buildBlade(seed = 2, scale = 1): FigureStroke[] {
  const rng = new Rng(seed)
  const s = scale
  const out: FigureStroke[] = []

  const spine = bowedSpine({ x: 6 * s, y: 0 }, { x: 40 * s, y: -3 * s }, -1.6 * s, 24)
  const width: WidthProfile = (t) => (2.8 - t * 2.55) * s

  const bleedPoly = sweep(spine, widen(width, 0.6 * s), rng, 0.4 * s)
  if (bleedPoly.length >= 6) out.push({ poly: bleedPoly, alpha: 0.14 })
  const poly = sweep(spine, width, rng, 0.2 * s)
  if (poly.length >= 6) out.push({ poly, alpha: 0.95 })

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
