/**
 * Enemy silhouettes.
 *
 * Each kind is built once into a reusable geometry and then drawn hundreds of
 * times. Regenerating brush strokes per enemy per frame would be both an
 * allocation storm and a visual one — the outlines would shimmer.
 *
 * Enemies are hunched where the player stands upright. At the size these are
 * drawn, posture is the only characterisation that survives, and it is enough:
 * the player reads "not me" instantly without needing any interior detail.
 */
import { Rng } from '../core/rng'
import { bowedSpine, calligraphic, elliptic, sweep, type WidthProfile } from './ink'
import type { FigureStroke } from './figure'
import type { EnemyKind } from '../data/enemies'

const widen =
  (profile: WidthProfile, by: number): WidthProfile =>
  (t) =>
    profile(t) + by

export interface EnemyArt {
  bleed: FigureStroke[]
  body: FigureStroke[]
}

/** Builds one silhouette, sized from the kind's collision radius. */
function buildBody(seed: number, radius: number, hunch: number): EnemyArt {
  const rng = new Rng(seed)
  const body: FigureStroke[] = []
  const bleed: FigureStroke[] = []
  // Enemies are drawn a bit taller than they are wide, so the collision radius
  // reads as the body's footprint rather than its full height.
  const s = radius / 9

  const mark = (
    from: { x: number; y: number },
    to: { x: number; y: number },
    bow: number,
    width: WidthProfile,
    alpha = 1,
  ): void => {
    const spine = bowedSpine(from, to, bow, 20)
    const b = sweep(spine, widen(width, 1.2 * s), rng, 1.1 * s)
    if (b.length >= 6) bleed.push({ poly: b, alpha: alpha * 0.16 })
    const p = sweep(spine, width, rng, 0.7 * s)
    if (p.length >= 6) body.push({ poly: p, alpha })
  }

  // Torso: a squat mass leaning forward by `hunch`.
  mark({ x: hunch * 3 * s, y: -20 * s }, { x: 0, y: 0 }, 0, (t) => (7 + t * 9) * s, 0.96)

  // Arms, hanging low and wide — the classic "coming for you" read.
  mark({ x: -6 * s, y: -19 * s }, { x: -10 * s, y: -7 * s }, 1.3 * s, calligraphic(4.6 * s, 0.7, 0.2), 0.9)
  mark({ x: 6 * s, y: -19 * s }, { x: 10 * s, y: -7 * s }, -1.3 * s, calligraphic(4.6 * s, 0.7, 0.2), 0.9)

  // Head, pushed forward of the shoulders by the hunch.
  mark(
    { x: hunch * 5 * s - 3.2 * s, y: -25 * s },
    { x: hunch * 5 * s + 3.2 * s, y: -24.7 * s },
    0.25 * s,
    elliptic(7.4 * s),
  )

  return { bleed, body }
}

/** Per-kind art, keyed by kind id. */
export function buildEnemyArt(kinds: readonly EnemyKind[]): Map<string, EnemyArt> {
  const art = new Map<string, EnemyArt>()
  kinds.forEach((kind, i) => {
    // A different hunch per kind, so the three read apart in silhouette even
    // before their size difference registers.
    const hunch = kind.speed > 100 ? 1.5 : kind.hp > 30 ? 0.2 : 0.8
    art.set(kind.id, buildBody(101 + i * 17, kind.radius, hunch))
  })
  return art
}
