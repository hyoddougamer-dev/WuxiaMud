/**
 * Rank, worn where it can be seen.
 *
 * A number on a card is not progression in a game whose whole art direction is
 * "the equipment IS the silhouette". If a piece can be raised five times and
 * the swordsman looks identical at every step, the axis exists only in the
 * inventory screen — which is the one screen a player is not looking at while
 * playing.
 *
 * Two rules shape everything below, and both were learned by drawing it wrong:
 *
 * MARKS BELONG TO THEIR SLOT. The first version put the same growing hem on
 * everything, which meant a tempered HAT grew a hem. Each slot now has its own
 * vocabulary — bands stack above a crown, tassels hang off cuffs, cords hang
 * off a belt, a cord hangs off a hilt — so the figure says WHICH piece was
 * raised, not merely that something was.
 *
 * MARKS HANG OFF THE FIGURE, NOT OFF CONSTANTS. Anchors come from the
 * swordsman that was actually built (see Swordsman.anchors), because a cuff
 * moves with the shoulder item, the bearing and the build. Hard-coded
 * positions drew tassels in mid-air on every wide-sleeved set.
 *
 * Geometry, not SVG: the same polygons feed Pixi in play and `<polygon>` in
 * the DOM, which is the only reason the hub and the contact sheets cannot
 * drift apart.
 */
import { Rng } from '../core/rng'
import { bowedSpine, elliptic, sweep, tapered, type Point } from './ink'
import type { Slot } from '../data/items'
import type { Swordsman } from './figure'

/** One mark, as a closed outline ready for Pixi or SVG. */
export interface RankMark {
  poly: number[]
  alpha: number
}

/**
 * How many inscription sockets a rank has opened.
 *
 * The modular half, kept here beside the marks so the two cannot disagree
 * about what a rank is worth. Nothing consumes it yet — rites are step 7.
 */
export function socketsAt(rank: number): number {
  return rank >= 5 ? 3 : rank >= 4 ? 2 : rank >= 2 ? 1 : 0
}

/** A short line, swept to an even width. */
function line(rng: Rng, from: Point, to: Point, width: number, bow = 0): number[] {
  return sweep(bowedSpine(from, to, bow, 10), tapered(width, 0.22), rng, width * 0.08)
}

/** A knot: the small round terminal a cord or tassel ends in. */
function knot(rng: Rng, at: Point, radius: number): number[] {
  return sweep(
    bowedSpine({ x: at.x - radius, y: at.y }, { x: at.x + radius, y: at.y }, 0, 10),
    elliptic(radius * 2),
    rng,
    radius * 0.1,
  )
}

/**
 * The marks one piece at `rank` puts on this figure.
 *
 * Returns empty at rank 0, which is the common case — most of what a swordsman
 * wears was picked up off the post road.
 */
export function rankMarks(
  slot: Slot,
  rank: number,
  figure: Swordsman,
  scale = 1,
  seed = 5,
): RankMark[] {
  const n = Math.min(5, Math.max(0, Math.floor(rank)))
  if (n === 0) return []
  const rng = new Rng(seed * 131 + n)
  const s = scale
  const { crown, cuffs, waist, hem } = figure.anchors
  const out: RankMark[] = []
  const push = (poly: number[], alpha = 0.95): void => {
    if (poly.length >= 6) out.push({ poly, alpha })
  }

  switch (slot) {
    case 'head': {
      // Bands stacked above the crown, like the rings on a monk's staff. They
      // narrow going up, so five of them read as a stack rather than a block.
      // The first band OVERLAPS the silhouette rather than clearing it. Drawn
      // fully clear they read as three lozenges hovering above a hat, which is
      // a rendering fault, not a rank.
      for (let i = 0; i < n; i++) {
        const y = crown.y + 1.2 * s - i * 2.4 * s
        const w = (6.5 - i * 0.8) * s
        push(line(rng, { x: -w, y }, { x: w, y }, (i === 0 ? 1.5 : 1.1) * s), 0.9)
      }
      break
    }
    case 'shoulders': {
      // Tassels off the cuffs, alternating side so an odd rank is not lopsided
      // by accident — it is lopsided on purpose, and reads as one more.
      for (let i = 0; i < n; i++) {
        const cuff = cuffs[i % 2 === 0 ? 0 : 1]!
        const side = i % 2 === 0 ? -1 : 1
        const tier = Math.floor(i / 2)
        const from = { x: cuff.x + side * tier * 2.2 * s, y: cuff.y - 1 * s }
        const to = { x: from.x + side * 1.2 * s, y: from.y + 6 * s }
        push(line(rng, from, to, 1.3 * s), 0.9)
        push(knot(rng, to, 1.1 * s), 0.9)
      }
      break
    }
    case 'robe': {
      // Hems first: shallow arcs across the skirt, so they read as cloth lying
      // over a body rather than as rings drawn on a cylinder.
      //
      // The FIRST hem is the heaviest. At an even weight, rank 0 and rank 1
      // were nearly indistinguishable — and "you can see every rank" is the
      // whole claim, so the step that proves it cannot be the faint one.
      const w = hem.halfWidth * 0.82
      for (let i = 0; i < Math.min(3, n); i++) {
        const y = hem.y - 3.5 * s - i * 3.4 * s
        push(line(rng, { x: -w, y }, { x: w, y }, (i === 0 ? 1.5 : 1.1 - i * 0.1) * s, 3.2 * s), 0.9)
      }
      // Cords from the belt, from rank four. Knotted cord is what a tempered
      // blade and a raised robe both carry, and at this size it is the clearest
      // small mark available that is not simply another line.
      for (let i = 0; i < Math.max(0, n - 3); i++) {
        const from = { x: (-5 + i * 10) * s, y: waist.y + 1 * s }
        const to = { x: from.x + 1.4 * s, y: from.y + 7 * s }
        push(line(rng, from, to, 1.2 * s), 0.88)
        push(knot(rng, to, 1 * s), 0.88)
      }
      break
    }
    case 'weapon': {
      // A knotted cord at the hilt that lengthens with every temper. One mark
      // rather than a stack, because the hand is the busiest part of the
      // silhouette and five things hanging off it would read as fringe.
      const hand = figure.hand
      const drop = (5 + n * 3.4) * s
      const to = { x: hand.x - 1.5 * s, y: hand.y + drop }
      push(line(rng, hand, to, 1.5 * s, -3 * s), 0.9)
      push(knot(rng, to, 1.2 * s), 0.9)
      break
    }
  }
  return out
}

/** Every mark for a whole set of worn pieces, in slot order. */
export function allRankMarks(
  worn: ReadonlyArray<{ slot: Slot; rank: number }>,
  figure: Swordsman,
  scale = 1,
  seed = 5,
): RankMark[] {
  const out: RankMark[] = []
  for (const piece of worn) out.push(...rankMarks(piece.slot, piece.rank, figure, scale, seed))
  return out
}
