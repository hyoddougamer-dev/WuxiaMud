/**
 * Enemy silhouettes, one per behaviour.
 *
 * Each kind is built once into reusable geometry and then drawn hundreds of
 * times. Regenerating brush strokes per enemy per frame would be both an
 * allocation storm and a visual one — the outlines would shimmer.
 *
 * Shape follows behaviour, not flavour. At the size these are drawn the player
 * cannot read detail, only outline, so the outline has to carry the one fact
 * that matters: what is this thing about to do to me? A leaning wedge charges,
 * a wide stance shoots, a squat block soaks. Enemies that behave differently
 * must not share a silhouette, or the roster reads as one enemy at three sizes.
 */
import { Rng } from '../core/rng'
import { bowedSpine, calligraphic, elliptic, sweep, type WidthProfile } from './ink'
import type { FigureStroke } from './figure'
import type { Behaviour, EnemyKind } from '../data/enemies'
import { palette } from './palette'

const widen =
  (profile: WidthProfile, by: number): WidthProfile =>
  (t) =>
    profile(t) + by

export interface EnemyArt {
  bleed: FigureStroke[]
  body: FigureStroke[]
  /** Accent colour used for this kind's threat markings. */
  accent: number
}

interface Builder {
  (mark: MarkFn, s: number): void
}

type MarkFn = (
  from: { x: number; y: number },
  to: { x: number; y: number },
  bow: number,
  width: WidthProfile,
  alpha?: number,
) => void

/**
 * Shapes, keyed by behaviour. `s` scales everything from the collision radius,
 * so a bigger enemy is the same silhouette drawn larger.
 */
const SHAPES: Record<Behaviour, Builder> = {
  // Hunched and forward-leaning: it simply comes at you.
  chaser: (mark, s) => {
    mark({ x: 2.4 * s, y: -20 * s }, { x: 0, y: 0 }, 0, (t) => (7 + t * 9) * s, 0.96)
    mark({ x: -6 * s, y: -19 * s }, { x: -10 * s, y: -7 * s }, 1.3 * s, calligraphic(4.6 * s, 0.7, 0.2), 0.9)
    mark({ x: 6 * s, y: -19 * s }, { x: 10 * s, y: -7 * s }, -1.3 * s, calligraphic(4.6 * s, 0.7, 0.2), 0.9)
    mark({ x: 1 * s, y: -25 * s }, { x: 7.4 * s, y: -24.7 * s }, 0.25 * s, elliptic(7.4 * s))
  },

  // Narrow and blade-like, tipped forward — it reads as fast standing still.
  darter: (mark, s) => {
    mark({ x: 5 * s, y: -17 * s }, { x: -2 * s, y: 0 }, 1.1 * s, (t) => (4.5 + t * 5) * s, 0.95)
    // A trailing streak instead of arms.
    mark({ x: -1 * s, y: -13 * s }, { x: -11 * s, y: -3 * s }, 2.2 * s, calligraphic(3.4 * s, 0.6, 0.05), 0.75)
    mark({ x: 2.6 * s, y: -22 * s }, { x: 7.6 * s, y: -21 * s }, 0.2 * s, elliptic(5.6 * s))
  },

  // A coiled wedge: broad at the shoulders, planted low, weight forward.
  charger: (mark, s) => {
    mark({ x: 4 * s, y: -19 * s }, { x: -2 * s, y: 0 }, 0.5 * s, (t) => (6 + t * 13) * s, 0.96)
    mark({ x: -9 * s, y: -20 * s }, { x: 9 * s, y: -20 * s }, 1.2 * s, elliptic(9 * s), 0.95)
    mark({ x: 2 * s, y: -26 * s }, { x: 9 * s, y: -25 * s }, 0.2 * s, elliptic(7 * s))
  },

  // Wide stance with a raised arm — the outline of something aiming.
  shooter: (mark, s) => {
    mark({ x: 0, y: -19 * s }, { x: 0, y: 0 }, 0, (t) => (6 + t * 10) * s, 0.96)
    // The bow arm, held out level. This is the read: it hurts from over there.
    mark({ x: -2 * s, y: -21 * s }, { x: 13 * s, y: -23 * s }, -1.2 * s, calligraphic(3.4 * s, 0.8, 0.15), 0.92)
    mark({ x: -3 * s, y: -20 * s }, { x: -9 * s, y: -10 * s }, 1.4 * s, calligraphic(4 * s, 0.7, 0.2), 0.88)
    mark({ x: -3.4 * s, y: -25 * s }, { x: 2.6 * s, y: -24.6 * s }, 0.25 * s, elliptic(6.8 * s))
  },

  // A squat slab. Nothing about it suggests speed; it suggests mass.
  splitter: (mark, s) => {
    mark({ x: 0, y: -21 * s }, { x: 0, y: 0 }, 0, (t) => (13 + t * 5) * s, 0.94)
    mark({ x: -11 * s, y: -21 * s }, { x: 11 * s, y: -21 * s }, 0.4 * s, elliptic(8 * s), 0.92)
    mark({ x: -3.2 * s, y: -26 * s }, { x: 3.2 * s, y: -26 * s }, 0.2 * s, elliptic(6 * s))
  },

  // Low and horizontal, barely clearing the ground: something already lying
  // there rather than something coming for you. Nothing about it reads as
  // upright, which is the whole point — you are meant to walk near it.
  lurker: (mark, s) => {
    mark({ x: -13 * s, y: -5 * s }, { x: 13 * s, y: -5 * s }, 1.4 * s, elliptic(9 * s), 0.9)
    mark({ x: -6 * s, y: -10 * s }, { x: 6 * s, y: -9 * s }, 0.5 * s, elliptic(5.5 * s), 0.82)
    // A single ridge breaking the surface. The only thing that gives it away.
    mark({ x: 1 * s, y: -13 * s }, { x: 5 * s, y: -16 * s }, 0.6 * s, calligraphic(3 * s, 0.6, 0.1), 0.7)
  },

  // Upright, narrow, head bowed, arms held in. It reads as a person standing
  // rather than a threat leaning — and it must, because the lesson is that not
  // everything on the field should be cut.
  enrager: (mark, s) => {
    mark({ x: 0, y: -20 * s }, { x: 0, y: 0 }, 0, (t) => (5 + t * 7) * s, 0.94)
    mark({ x: -3.5 * s, y: -18 * s }, { x: -5 * s, y: -6 * s }, 0.4 * s, calligraphic(3 * s, 0.75, 0.25), 0.86)
    mark({ x: 3.5 * s, y: -18 * s }, { x: 5 * s, y: -6 * s }, -0.4 * s, calligraphic(3 * s, 0.75, 0.25), 0.86)
    mark({ x: -3 * s, y: -24 * s }, { x: 3 * s, y: -23.4 * s }, 0.3 * s, elliptic(6.2 * s))
    // The stick of incense, held up. A small mark, but it is what separates
    // this outline from every other upright thing on the field.
    mark({ x: 4.5 * s, y: -22 * s }, { x: 7 * s, y: -30 * s }, 0.3 * s, calligraphic(1.6 * s, 0.5, 0.1), 0.6)
  },

  // Tall, broad, crowned. It has to read as different in one glance.
  boss: (mark, s) => {
    mark({ x: 0, y: -26 * s }, { x: 0, y: 0 }, 0, (t) => (12 + t * 16) * s, 0.97)
    mark({ x: -14 * s, y: -28 * s }, { x: 14 * s, y: -28 * s }, 0.8 * s, elliptic(13 * s), 0.96)
    mark({ x: -11 * s, y: -27 * s }, { x: -18 * s, y: -12 * s }, 1.8 * s, calligraphic(7 * s, 0.7, 0.15), 0.9)
    mark({ x: 11 * s, y: -27 * s }, { x: 18 * s, y: -12 * s }, -1.8 * s, calligraphic(7 * s, 0.7, 0.15), 0.9)
    mark({ x: -5 * s, y: -36 * s }, { x: 5 * s, y: -36 * s }, 0.25 * s, elliptic(10 * s))
    // Crown horns, the one flourish that says "this is the one".
    mark({ x: -4 * s, y: -40 * s }, { x: -9 * s, y: -50 * s }, 1 * s, calligraphic(4 * s, 0.6, 0.08), 0.95)
    mark({ x: 4 * s, y: -40 * s }, { x: 9 * s, y: -50 * s }, -1 * s, calligraphic(4 * s, 0.6, 0.08), 0.95)
  },
}

/**
 * Accent per behaviour. Colour is used sparingly and only where it carries
 * information: cinnabar means "this one reaches you from range or commits to a
 * lunge", gold marks the boss. Everything harmless stays ink.
 */
const ACCENTS: Record<Behaviour, number> = {
  chaser: palette.ink,
  darter: palette.ink,
  charger: palette.cinnabar,
  shooter: palette.cinnabar,
  splitter: palette.ink,
  // Ink for both, and deliberately so. A lurker that announced itself in
  // cinnabar would not be a lurker, and a pilgrim marked as dangerous would
  // remove the only decision it exists to create. The simulation paints them
  // cinnabar the moment they become a threat — that is the information.
  lurker: palette.ink,
  enrager: palette.ink,
  boss: palette.gold,
}

function buildBody(seed: number, radius: number, behaviour: Behaviour): EnemyArt {
  const rng = new Rng(seed)
  const body: FigureStroke[] = []
  const bleed: FigureStroke[] = []
  const s = radius / 9

  const mark: MarkFn = (from, to, bow, width, alpha = 1) => {
    const spine = bowedSpine(from, to, bow, 20)
    const b = sweep(spine, widen(width, 1.2 * s), rng, 1.1 * s)
    if (b.length >= 6) bleed.push({ poly: b, alpha: alpha * 0.16 })
    const p = sweep(spine, width, rng, 0.7 * s)
    if (p.length >= 6) body.push({ poly: p, alpha })
  }

  SHAPES[behaviour](mark, s)
  return { bleed, body, accent: ACCENTS[behaviour] }
}

/** Per-kind art, keyed by kind id. */
export function buildEnemyArt(kinds: readonly EnemyKind[]): Map<string, EnemyArt> {
  const art = new Map<string, EnemyArt>()
  kinds.forEach((kind, i) => {
    art.set(kind.id, buildBody(101 + i * 17, kind.radius, kind.behaviour))
  })
  return art
}
