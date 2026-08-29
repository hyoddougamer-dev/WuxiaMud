/**
 * Guards on the art icons — and an honest note about what they cannot do.
 *
 * The first draft of the glyphs failed by collision: at tile size `arc`,
 * `guard` and `push` were one crescent, `rate` and `bolt` one stack of strokes,
 * `damage`, `pierce` and `echo` one diagonal bar. Six of sixteen unreadable,
 * found by eye on the contact sheet.
 *
 * The obvious response is to replace the eye with a similarity metric, and that
 * was tried here twice before this file settled. Stamping the glyphs into a
 * fixed grid scores the old `arc` against the old `guard` at 0.03, because two
 * crescents of different radii ink different cells. Normalising each glyph to
 * its own bounding box first scores the same pair at 0.03 too, because `guard`
 * carried one extra mark that moved its box. Neither number resembles what a
 * person sees, so neither is the gate this file pretends to be if it claims
 * otherwise.
 *
 * So the checks below are deliberately modest. They catch what a machine can
 * genuinely judge — a glyph that draws nothing, a glyph that floods its box,
 * geometry that changes between calls, an effect with no glyph at all, and two
 * glyphs that are near-literally the same geometry. Perceptual collision stays
 * the job of `tools/glyphs.ts`, which lays all sixteen out at the size they are
 * actually read. That sheet is not a nicety; it is the test for the property
 * that matters most here.
 */
import { describe, expect, it } from 'vitest'
import { artGlyph, GLYPH_BOX } from '../src/render/artGlyph'
import { ARTS, type EffectKind } from '../src/data/arts'

const EFFECTS: EffectKind[] = [
  'damage', 'rate', 'range', 'arc', 'speed', 'magnet', 'orbit', 'bolt', 'nova', 'maxHp',
  'pierce', 'crit', 'echo', 'push', 'guard', 'heal',
]

/** Resolution of the stamp. 14×14 is about what a tile-sized glyph resolves. */
const N = 14

function inside(poly: number[], px: number, py: number): boolean {
  let hit = false
  const n = poly.length / 2
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = poly[i * 2]!
    const yi = poly[i * 2 + 1]!
    const xj = poly[j * 2]!
    const yj = poly[j * 2 + 1]!
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

/** The glyph as N×N booleans — what a tile-sized reader actually receives. */
function stamp(effect: EffectKind): boolean[] {
  const marks = artGlyph(effect)
  const cells: boolean[] = []
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const px = -GLYPH_BOX / 2 + ((c + 0.5) * GLYPH_BOX) / N
      const py = -GLYPH_BOX / 2 + ((r + 0.5) * GLYPH_BOX) / N
      cells.push(marks.some((m) => inside(m.poly, px, py)))
    }
  }
  return cells
}

describe('art glyphs', () => {
  it('draws one for every effect in the vocabulary', () => {
    // Every art in the game points at an effect, so a missing glyph is an art
    // that renders as an empty tile rather than as an error.
    const used = new Set(ARTS.map((a) => a.effect))
    for (const effect of used) {
      expect(EFFECTS, `${effect} is used by an art but not covered here`).toContain(effect)
    }
    for (const effect of EFFECTS) {
      const marks = artGlyph(effect)
      expect(marks.length, `${effect} draws nothing`).toBeGreaterThan(0)
      for (const mark of marks) {
        expect(mark.poly.length, `${effect} has an empty mark`).toBeGreaterThan(6)
        expect(mark.poly.every(Number.isFinite), `${effect} has a NaN vertex`).toBe(true)
      }
    }
  })

  it('is deterministic — the same effect draws the same shape every time', () => {
    // The strip and the hub scroll draw the same icon from separate calls. If
    // the brush wander were re-seeded per call they would be two pictures of
    // one art, which is worse than no icon at all.
    for (const effect of EFFECTS) {
      expect(artGlyph(effect)).toEqual(artGlyph(effect))
    }
  })

  it('fills a readable share of the box, without flooding it', () => {
    // A glyph that covers almost nothing is invisible on a tile; one that
    // covers almost everything is a black square. Both were real drafts.
    for (const effect of EFFECTS) {
      const filled = stamp(effect).filter(Boolean).length / (N * N)
      expect(filled, `${effect} covers ${(filled * 100).toFixed(0)}% of the box`)
        .toBeGreaterThan(0.04)
      expect(filled, `${effect} covers ${(filled * 100).toFixed(0)}% of the box`)
        .toBeLessThan(0.55)
    }
  })

  it('no two glyphs are near-duplicates of one another', () => {
    // A floor, not a perceptual judgement — see the note at the top of the
    // file. Two effects drawn from the same marks with a nudge would pass every
    // other check here and be indistinguishable in play; this is what stops
    // that. Measured worst pair is maxHp/guard at 0.48, so 0.7 leaves real room
    // for glyphs that legitimately share a region of the box.
    const stamps = new Map(EFFECTS.map((e) => [e, stamp(e)]))
    let worst = { pair: '', agree: 0 }
    for (let i = 0; i < EFFECTS.length; i++) {
      for (let j = i + 1; j < EFFECTS.length; j++) {
        const a = stamps.get(EFFECTS[i]!)!
        const b = stamps.get(EFFECTS[j]!)!
        // Jaccard over the inked cells. Counting the blank paper too would
        // score every sparse pair as near-identical on the emptiness they
        // share.
        let both = 0
        let either = 0
        for (let k = 0; k < a.length; k++) {
          if (a[k] || b[k]) either++
          if (a[k] && b[k]) both++
        }
        const agree = either === 0 ? 1 : both / either
        if (agree > worst.agree) worst = { pair: `${EFFECTS[i]} / ${EFFECTS[j]}`, agree }
      }
    }
    expect(worst.agree, `closest pair is ${worst.pair} at ${worst.agree.toFixed(2)}`)
      .toBeLessThan(0.7)
  })
})
