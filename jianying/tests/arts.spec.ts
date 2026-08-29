/**
 * The arts, as behaviour rather than as a table.
 *
 * `data/arts.ts` was written long before anything read it, and the gap between
 * "defined" and "acting" is exactly where this system was invisible. These
 * tests pin the half that now acts: what each effect does to which stat, in
 * which direction, and — the one that matters most for a survivors-like — that
 * nothing fires while its condition is false.
 */
import { describe, expect, it } from 'vitest'
import { ARTS, artScale, type Art } from '../src/data/arts'
import { WEAPONS } from '../src/data/weapons'
import { applyArts, artActs, carriedFor, LIVE_EFFECTS } from '../src/sim/arts'
import { deriveStats, emptyKit, type Stats } from '../src/sim/loadout'
import { createSense, type Conditions } from '../src/sim/conditions'

const base = (): Stats => deriveStats(new Map(), emptyKit())
const scratch = (): Stats => deriveStats(new Map(), emptyKit())

/** No condition true. The state a player is in most of the time. */
const nothing = (): Conditions => createSense().active

/** Exactly one condition true. */
function only(...active: Array<Art['condition']>): Conditions {
  const c = createSense().active
  for (const key of Object.keys(c) as Array<keyof Conditions>) {
    c[key] = active.includes(key as Art['condition'])
  }
  return c
}

const artFor = (effect: string): Art => ARTS.find((a) => a.effect === effect)!

describe('the arts acting', () => {
  it('changes nothing while no condition holds', () => {
    // The whole promise of a conditional system: an art is a thing you PROVOKE.
    // If any of it leaked into the idle state it would be a passive bonus with
    // a decoration on top, which is the design this replaced.
    const b = base()
    const out = applyArts(b, carriedFor('jian'), nothing(), scratch())
    expect(out).toEqual(b)
  })

  it('changes nothing when the scroll is empty', () => {
    const b = base()
    const out = applyArts(b, [], only('running', 'surrounded', 'peril'), scratch())
    expect(out).toEqual(b)
  })

  it('moves each live effect in the direction it claims', () => {
    // Written as a table so a new effect cannot be added to LIVE_EFFECTS
    // without someone deciding, here, which way it goes.
    const CHECKS: Record<string, (b: Stats, o: Stats) => void> = {
      damage: (b, o) => expect(o.slashDamage).toBeGreaterThan(b.slashDamage),
      // An interval: faster means SMALLER, and getting this backwards would
      // read as an art that makes you worse.
      rate: (b, o) => expect(o.slashInterval).toBeLessThan(b.slashInterval),
      range: (b, o) => expect(o.slashRange).toBeGreaterThan(b.slashRange),
      arc: (b, o) => expect(o.slashHalfAngle).toBeGreaterThan(b.slashHalfAngle),
      speed: (b, o) => expect(o.moveSpeed).toBeGreaterThan(b.moveSpeed),
      magnet: (b, o) => expect(o.pickupRadius).toBeGreaterThan(b.pickupRadius),
      orbit: (b, o) => {
        expect(b.orbitBlades).toBe(0)
        expect(o.orbitBlades).toBeGreaterThan(0)
        expect(o.orbitDamage).toBeGreaterThan(0)
      },
      bolt: (b, o) => {
        expect(b.boltInterval).toBe(0)
        expect(o.boltInterval).toBeGreaterThan(0)
        expect(o.boltDamage).toBeGreaterThan(0)
      },
    }
    expect(Object.keys(CHECKS).sort()).toEqual([...LIVE_EFFECTS].sort())

    for (const [effect, check] of Object.entries(CHECKS)) {
      const art = artFor(effect)
      const b = base()
      const out = applyArts(b, [{ art, level: 1 }], only(art.condition), scratch())
      check(b, out)
    }
  })

  it('scales with the grade', () => {
    const art = artFor('damage')
    const b = base()
    const one = applyArts(b, [{ art, level: 1 }], only(art.condition), scratch()).slashDamage
    const three = applyArts(b, [{ art, level: 3 }], only(art.condition), scratch()).slashDamage
    expect(three).toBeGreaterThan(one)
    expect(one / b.slashDamage).toBeCloseTo(artScale(1), 5)
  })

  it('never lets the sweep arc reach a full circle', () => {
    // At exactly PI the arc test cannot miss and facing silently stops
    // mattering. Stacking every arc art in the game must not get there.
    const arcs = ARTS.filter((a) => a.effect === 'arc').map((art) => ({ art, level: 5 }))
    const all = only(...arcs.map((c) => c.art.condition))
    const out = applyArts(base(), arcs, all, scratch())
    expect(out.slashHalfAngle).toBeLessThan(Math.PI)
  })

  it('stacks when two conditions hold at once', () => {
    // A posture and a situation can be true together by design — see
    // sim/conditions.ts — and a build that lines both up on one stat should
    // feel like it did.
    const a = artFor('damage')
    const b2 = ARTS.find((x) => x.effect === 'damage' && x.id !== a.id)!
    const b = base()
    const one = applyArts(b, [{ art: a, level: 1 }], only(a.condition), scratch()).slashDamage
    const both = applyArts(
      b,
      [
        { art: a, level: 1 },
        { art: b2, level: 1 },
      ],
      only(a.condition, b2.condition),
      scratch(),
    ).slashDamage
    expect(both).toBeGreaterThan(one)
  })

  it('carries the whole scroll of the weapon in hand, and nothing else', () => {
    for (const weapon of WEAPONS) {
      const carried = carriedFor(weapon.id)
      expect(carried.length, `${weapon.id} scroll`).toBe(5)
      for (const { art } of carried) expect(art.weapon).toBe(weapon.id)
    }
  })

  it('leaves the arts with no lever alone rather than half-applying them', () => {
    // pierce, crit, echo, push, guard and heal are still simulation work. An
    // art without a lever must be a no-op, not a partial effect that quietly
    // lands on whichever stat looked closest.
    const b = base()
    for (const art of ARTS.filter((a) => !artActs(a))) {
      const out = applyArts(b, [{ art, level: 5 }], only(art.condition), scratch())
      expect(out, `${art.id} (${art.effect}) should do nothing yet`).toEqual(b)
    }
  })

  it('agrees with itself about which arts act', () => {
    // The hub, the sheets and the simulation all ask `artActs`. If that ever
    // disagreed with what applyArts actually does, a tile would promise an
    // effect the frame never delivers.
    for (const art of ARTS) {
      expect(artActs(art)).toBe(LIVE_EFFECTS.includes(art.effect))
    }
  })
})
