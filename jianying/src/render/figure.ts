/**
 * The swordsman, assembled from brush strokes.
 *
 * Local space: origin at the feet, character facing +x, roughly 62 units tall.
 * Nothing here has interior detail — it is a silhouette, and the readability
 * that buys is the whole reason the art direction was chosen.
 *
 * Every mark is emitted twice: a wide, faint "bleed" pass underneath and the
 * solid stroke on top. That pair is what sells ink soaking into paper; a single
 * hard-edged fill reads as a vector shape no matter how good its outline is.
 */
import { Rng } from '../core/rng'
import { bowedSpine, calligraphic, sweep, tapered, type Point, type WidthProfile } from './ink'

export interface FigureStroke {
  poly: number[]
  alpha: number
}

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

/** Widens a profile by a constant, for the bleed pass. */
const widen =
  (profile: WidthProfile, by: number): WidthProfile =>
  (t) =>
    profile(t) + by

export function buildSwordsman(seed = 1, scale = 1): Swordsman {
  const rng = new Rng(seed)
  const s = scale
  const body: FigureStroke[] = []
  const bleed: FigureStroke[] = []

  /**
   * Emits one brush mark. `segments` is generous by default: a swept polygon
   * folds in on itself where the stroke is wide relative to its curvature, and
   * that fold is exactly the notch artefact that makes a shape look broken.
   */
  const mark = (
    from: Point,
    to: Point,
    bow: number,
    width: WidthProfile,
    opts: { alpha?: number; segments?: number; jitter?: number; bleedBy?: number } = {},
  ): void => {
    const { alpha = 1, segments = 22, jitter = 0.9 * s, bleedBy = 1.6 * s } = opts
    const spine = bowedSpine(from, to, bow, segments)
    // Bleed uses its own Rng draws, so its outline wobbles independently of the
    // solid stroke — matching how a wet edge never traces the mark exactly.
    const bleedPoly = sweep(spine, widen(width, bleedBy), rng, jitter * 1.5)
    if (bleedPoly.length >= 6) bleed.push({ poly: bleedPoly, alpha: alpha * 0.16 })
    const poly = sweep(spine, width, rng, jitter)
    if (poly.length >= 6) body.push({ poly, alpha })
  }

  // ---- Robe -------------------------------------------------------------
  // One confident downward sweep flaring to the hem. Drawn first so later
  // marks overlap it the way wet ink layers.
  mark({ x: 0.5 * s, y: -34 * s }, { x: -1 * s, y: 0 }, 1.4 * s, (t) => (7 + t * 11) * s, {
    alpha: 0.97,
    segments: 26,
    jitter: 1.1 * s,
  })

  // Rear hem flick, so the bottom edge is not a flat cut.
  mark({ x: -4 * s, y: -8 * s }, { x: -11 * s, y: -1 * s }, 2.2 * s, calligraphic(5 * s, 0.8, 0.05), {
    alpha: 0.9,
  })

  // ---- Torso and neck ---------------------------------------------------
  // The torso reaches up to -45 and the head blob bottoms out near -44, so the
  // two overlap. An abutting joint leaves a visible seam at any scale.
  mark({ x: 0, y: -45 * s }, { x: -0.5 * s, y: -28 * s }, 0.9 * s, tapered(10 * s, 0.22), {
    segments: 16,
  })

  // ---- Head -------------------------------------------------------------
  // `sweep` applies width perpendicular to the spine, so the spine sets the
  // head's WIDTH and the profile sets its HEIGHT. A short spine here produced a
  // vertical splinter rather than a head.
  mark({ x: -4.2 * s, y: -50 * s }, { x: 4.2 * s, y: -49.4 * s }, 0.5 * s, calligraphic(10 * s, 0.55, 0.5), {
    segments: 16,
    jitter: 0.45 * s,
    bleedBy: 1 * s,
  })

  // Topknot — the one flourish that reads as "wuxia" even in a 20px silhouette.
  mark({ x: -1 * s, y: -54 * s }, { x: -5.5 * s, y: -61 * s }, 1.5 * s, calligraphic(4.2 * s, 0.55, 0.12), {
    segments: 12,
    jitter: 0.35 * s,
    bleedBy: 0.8 * s,
  })

  // ---- Arms and blade ---------------------------------------------------
  const hand: Point = { x: 14 * s, y: -32 * s }
  mark({ x: 1 * s, y: -40 * s }, hand, -2.2 * s, tapered(4 * s, 0.28), { segments: 16 })

  // The blade: long, thin, whipping to nothing at the tip. Kept narrow on
  // purpose — a wide taper here reads as a wing, not a jian.
  const bladeTip: Point = { x: 46 * s, y: -46 * s }
  mark(hand, bladeTip, -2.2 * s, (t) => (2.6 - t * 2.35) * s, {
    alpha: 0.95,
    segments: 26,
    jitter: 0.22 * s,
    bleedBy: 0.5 * s,
  })

  // Trailing rear sleeve, for asymmetry.
  mark({ x: -1 * s, y: -39 * s }, { x: -12 * s, y: -23 * s }, 2.4 * s, calligraphic(5.4 * s, 0.6, 0.08), {
    alpha: 0.9,
  })

  return { bleed, body, sashAnchor: { x: -2.5 * s, y: -33 * s }, bladeTip, height: 62 * s }
}

/**
 * A sash that trails behind the figure.
 *
 * A travelling-wave approximation rather than a cloth simulation: each segment
 * lags the one before it in phase, and the whole ribbon is dragged opposite to
 * movement. It is a handful of sines, and it does more for "this character is
 * alive" than any amount of added detail would.
 */
export function sashSpine(
  anchor: Point,
  time: number,
  velocityX: number,
  velocityY: number,
  scale = 1,
  segments = 16,
  length = 48,
): Point[] {
  const points: Point[] = []
  const speed = Math.hypot(velocityX, velocityY)
  // Local -x is behind the character (it faces +x). The ribbon keeps a standing
  // bias in that direction and only leans with velocity, so it can never whip
  // around to the front — which is what a pure velocity drag did, and it read
  // as a scarf blowing into the swordsman's face.
  const dirX = speed > 1 ? -velocityX / speed : 0
  const dirY = speed > 1 ? -velocityY / speed : 0
  const dragX = -0.6 + dirX * 0.4
  const dragY = 0.12 + dirY * 0.55
  // Faster movement straightens the ribbon out behind; at rest it falls.
  const stretch = 0.55 + Math.min(1, speed / 150) * 0.45

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const reach = t * length * scale * stretch
    // Later segments lag further in phase — that lag is the wave.
    const wave = Math.sin(time * 5.2 - t * 5.0) * (1.5 + t * 10) * scale
    // Gravity wins where the drag is weak.
    const droop = t * t * 22 * scale * (1 - Math.min(1, speed / 190))
    points.push({
      x: anchor.x + dragX * reach + -dragY * wave * 0.6,
      y: anchor.y + dragY * reach + droop + dragX * wave * 0.6,
    })
  }
  return points
}

/** Sweeps a sash spine into a drawable outline. */
export function sashPoly(spine: Point[], rng: Rng, scale = 1): number[] {
  return sweep(spine, calligraphic(4.6 * scale, 0.8, 0.04), rng, 0.35 * scale)
}
