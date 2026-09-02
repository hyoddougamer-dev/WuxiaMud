import { describe, expect, it } from 'vitest'
import { buildSwordsmanFront } from '../src/render/portraitFigure'
import { BLADE_BY_ID, DEFAULT_GEAR, HEAD_BY_ID, type Gear } from '../src/render/wardrobe'

const MAN = { shoulders: 1.1, hem: 0.94, hair: 0, waist: 0.5, cinch: 1.28, sleeve: 1.06 }

/** Where a polygon's outline crosses a horizontal line, as [left, right]. */
function spanAt(poly: readonly number[], y: number): [number, number] | null {
  const xs: number[] = []
  for (let i = 0; i < poly.length; i += 2) {
    const x1 = poly[i]!
    const y1 = poly[i + 1]!
    const j = (i + 2) % poly.length
    const x2 = poly[j]!
    const y2 = poly[j + 1]!
    if ((y1 - y) * (y2 - y) <= 0 && y1 !== y2) xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1))
  }
  return xs.length ? [Math.min(...xs), Math.max(...xs)] : null
}

const gearWith = (bladeId: string): Gear => ({
  ...DEFAULT_GEAR,
  blade: BLADE_BY_ID.get(bladeId) ?? DEFAULT_GEAR.blade,
})

describe('the portrait figure', () => {
  /**
   * The bug this exists for was invisible in code and nearly invisible on the
   * page: `sweep()` reads a WidthProfile as the mark's FULL width and halves it
   * itself, while every measurement in portraitFigure is a half-width. So the
   * body rendered at half the width its own profile claimed, the arms — which
   * are POSITIONED, not swept, and so were unaffected — ended up hanging
   * outside it, and the figure had a channel of bare paper down each side.
   *
   * Nothing threw, no test failed, and the drawing was merely "estranho". A
   * silhouette is one shape or it is not a person, so that is what is asserted.
   */
  it('joins the arms to the body, with no paper between them', () => {
    const f = buildSwordsmanFront(7, DEFAULT_GEAR, 1, MAN)
    // Chest height: below the shoulder, above the waist.
    for (const y of [-48, -45, -42]) {
      const torso = f.body.map((s) => spanAt(s.poly, y)).filter((s): s is [number, number] => !!s)
      expect(torso.length).toBeGreaterThan(2)
      const bodyLeft = Math.min(...torso.map((s) => s[0]))
      // The widest mark on the left at this height is an arm or a sleeve; the
      // torso must reach past its inner edge or the two are separate objects.
      const trunk = spanAt(f.body[4]!.poly, y)
      expect(trunk, `no torso at y=${y}`).not.toBeNull()
      const armInner = Math.max(
        ...torso.filter((s) => s[0] < trunk![0]).map((s) => s[1]),
        Number.NEGATIVE_INFINITY,
      )
      expect(armInner).toBeGreaterThan(trunk![0])
      expect(bodyLeft).toBeLessThan(trunk![0])
    }
  })

  it('stands in human proportion — about six heads tall', () => {
    // A bare head, so the last mark drawn IS the skull: anything worn on it —
    // a topknot, a hat — goes on afterwards and would be measured instead.
    const bare: Gear = { ...DEFAULT_GEAR, head: HEAD_BY_ID.get('bare') ?? DEFAULT_GEAR.head }
    const f = buildSwordsmanFront(7, bare, 1, MAN)
    const head = spanAt(f.body[f.body.length - 1]!.poly, -f.height + 6)
    expect(head).not.toBeNull()
    const headWidth = head![1] - head![0]
    // Five to seven heads tall. Four is the overhead sprite, which is what this
    // builder exists to stop the portrait from using.
    expect(f.height / headWidth).toBeGreaterThan(5)
    expect(f.height / headWidth).toBeLessThan(8)
  })

  it('tells the two classes apart by silhouette alone', () => {
    const heavy = buildSwordsmanFront(7, gearWith('great'), 1, MAN)
    const light = buildSwordsmanFront(7, gearWith('feidao'), 1, MAN)
    // The TORSO, not the overall bounding box: the knife-thrower's widest
    // point is the fan of blades at their hip, which reaches further than any
    // part of the heavier build's body. That is the intended read — one class
    // is broad, the other bristles — and measuring the box would confuse them.
    const chest = (f: ReturnType<typeof buildSwordsmanFront>): number => {
      const at = spanAt(f.body[4]!.poly, -45)
      expect(at).not.toBeNull()
      return at![1] - at![0]
    }
    expect(chest(heavy)).toBeGreaterThan(chest(light))
    // And the thrower carries blades nobody else does, so has strictly more
    // marks on them at the same gear.
    expect(light.body.length).toBeGreaterThan(heavy.body.length)
  })
})
