/**
 * Brush-stroke geometry.
 *
 * Every visible shape in the game is built from these strokes rather than from
 * sprite sheets. A stroke is a spine (a curve) swept by a varying width, with a
 * little deterministic jitter on the outline so the edge reads as bristles on
 * absorbent paper instead of a vector shape.
 *
 * Two properties matter beyond looks:
 *   - silhouettes with no interior detail stay legible with hundreds of
 *     entities on screen, which is exactly the load this genre produces;
 *   - geometry is generated from a seed, so it costs no download and no atlas.
 */
import { Rng } from '../core/rng'

export interface Point {
  x: number
  y: number
}

/** Width profile along a stroke. `t` runs 0 (start) to 1 (end). */
export type WidthProfile = (t: number) => number

/**
 * The default calligraphic profile: the brush lands, presses, then lifts into a
 * whip. Asymmetric on purpose — a symmetric taper reads as a machine-drawn
 * lozenge, which is precisely the "robotic" look we are avoiding.
 */
export const calligraphic =
  (max: number, startScale = 0.35, endScale = 0.06): WidthProfile =>
  (t) => {
    const press = Math.sin(Math.pow(t, 0.75) * Math.PI)
    const base = startScale + (1 - startScale) * press
    const lift = 1 - Math.pow(t, 3) * (1 - endScale)
    return max * base * lift
  }

/**
 * A true ellipse when swept along a straight spine: the width falls to zero at
 * both ends instead of merely thinning.
 *
 * This exists because `calligraphic` keeps roughly 80% of its width at the
 * ends — right for a brush mark, badly wrong for a head or a pair of
 * shoulders, which came out as hard-edged rectangles.
 */
export const elliptic =
  (max: number): WidthProfile =>
  (t) =>
    max * Math.sqrt(Math.max(0, 1 - Math.pow(2 * t - 1, 2)))

/** A steady stroke that only tapers at the very ends — for limbs and blades. */
export const tapered =
  (max: number, taper = 0.18): WidthProfile =>
  (t) => {
    const head = Math.min(1, t / taper)
    const tail = Math.min(1, (1 - t) / taper)
    return max * Math.min(head, tail) ** 0.6
  }

/** Samples a quadratic bezier into a spine. `bow` bends the curve sideways. */
export function bowedSpine(from: Point, to: Point, bow: number, segments = 16): Point[] {
  const mx = (from.x + to.x) / 2
  const my = (from.y + to.y) / 2
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  // Control point pushed along the curve's normal.
  const cx = mx + (-dy / len) * bow
  const cy = my + (dx / len) * bow

  const points: Point[] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const u = 1 - t
    points.push({
      x: u * u * from.x + 2 * u * t * cx + t * t * to.x,
      y: u * u * from.y + 2 * u * t * cy + t * t * to.y,
    })
  }
  return points
}

/**
 * Builds a smooth, band-limited noise function over t in [0,1].
 *
 * Independent random noise per sample was the first thing tried here, and it
 * makes an outline look torn rather than brushed: real bristles wander slowly,
 * they do not jump between adjacent points. Summing a few low harmonics gives
 * that slow wander, and stays deterministic for a given Rng.
 */
function wobble(rng: Rng, harmonics = 3): (t: number) => number {
  const freqs: number[] = []
  const amps: number[] = []
  const phases: number[] = []
  let total = 0
  for (let i = 0; i < harmonics; i++) {
    const amp = 1 / (i + 1.4)
    freqs.push(rng.range(0.7, 1.6) * (i + 1))
    amps.push(amp)
    phases.push(rng.next() * Math.PI * 2)
    total += amp
  }
  return (t: number) => {
    let sum = 0
    for (let i = 0; i < harmonics; i++) {
      sum += amps[i]! * Math.sin(t * Math.PI * 2 * freqs[i]! + phases[i]!)
    }
    return sum / total
  }
}

/**
 * Sweeps `spine` by `width` and returns a closed outline as flat [x,y,...]
 * coordinates, ready for Pixi's `Graphics.poly()`.
 *
 * @param jitter sideways wander on the outline, in pixels. Keep it small
 *               (0.5-2); past that the shape stops reading as a confident mark.
 */
export function sweep(
  spine: readonly Point[],
  width: WidthProfile,
  rng: Rng,
  jitter = 1.1,
): number[] {
  const n = spine.length
  if (n < 2) return []

  // Each side gets its own wander, so the stroke is not symmetric.
  const wobbleLeft = wobble(rng)
  const wobbleRight = wobble(rng)

  const left: number[] = []
  const right: number[] = []

  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const prev = spine[Math.max(0, i - 1)]!
    const next = spine[Math.min(n - 1, i + 1)]!
    const dx = next.x - prev.x
    const dy = next.y - prev.y
    const len = Math.hypot(dx, dy) || 1
    // Normal to the spine at this sample.
    const nx = -dy / len
    const ny = dx / len

    const half = width(t) / 2
    // Ends carry no wander, so the taper stays sharp rather than frayed.
    const edge = Math.sin(t * Math.PI)
    const jl = wobbleLeft(t) * jitter * edge
    const jr = wobbleRight(t) * jitter * edge

    const p = spine[i]!
    left.push(p.x + nx * (half + jl), p.y + ny * (half + jl))
    right.push(p.x - nx * (half + jr), p.y - ny * (half + jr))
  }

  // Down one side, back up the other.
  const poly = left.slice()
  for (let i = right.length - 2; i >= 0; i -= 2) {
    poly.push(right[i]!, right[i + 1]!)
  }
  return poly
}
