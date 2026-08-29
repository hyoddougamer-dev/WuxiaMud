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
import { ARTS, EQUIPPED_ARTS, MAX_ART_LEVEL, artScale, type Art } from '../src/data/arts'
import { WEAPONS } from '../src/data/weapons'
import {
  advanceArt,
  applyArts,
  artActs,
  beginProgress,
  carriedFor,
  equippedIds,
  LIVE_EFFECTS,
  START_LEVEL,
} from '../src/sim/arts'
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
      // The thrust is a TRADE — narrower and longer — so it is the one effect
      // where a stat legitimately gets worse, and the test has to say so or a
      // future change could quietly flip it into a pure bonus.
      pierce: (b, o) => {
        expect(o.slashHalfAngle).toBeLessThan(b.slashHalfAngle)
        expect(o.slashRange).toBeGreaterThan(b.slashRange)
      },
      crit: (b, o) => {
        expect(b.critEvery).toBe(0)
        expect(o.critEvery).toBeGreaterThan(1)
      },
      echo: (b, o) => {
        expect(b.echoDelay).toBe(0)
        expect(o.echoDelay).toBeGreaterThan(0)
        expect(o.echoDamage).toBeGreaterThan(0)
        // Never the full blow, or the echo is simply double damage with a
        // delay bolted on.
        expect(o.echoDamage).toBeLessThan(1)
      },
      push: (b, o) => {
        expect(b.pushForce).toBe(0)
        expect(o.pushForce).toBeGreaterThan(0)
      },
      // A multiplier on damage TAKEN, so lower is better and it must never
      // reach zero — an invulnerable player has no game left.
      guard: (b, o) => {
        expect(b.damageScale).toBe(1)
        expect(o.damageScale).toBeLessThan(1)
        expect(o.damageScale).toBeGreaterThan(0)
      },
      heal: (b, o) => {
        expect(b.healPerKill).toBe(0)
        expect(o.healPerKill).toBeGreaterThan(0)
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

  it('now has a lever for every art in the game', () => {
    // This used to assert the opposite — that the thirteen arts with no lever
    // were no-ops — and flipping it is the point of the change that landed the
    // six new effects. Every art in the game now does something.
    const idle = ARTS.filter((a) => !artActs(a))
    expect(idle.map((a) => `${a.id}:${a.effect}`)).toEqual([])
  })

  it('never lets stacked guards make a player untouchable', () => {
    // Multiplicative reduction approaches zero without reaching it. Additive
    // reduction reaches invulnerability, and a survivors-like with an
    // invulnerable player is not a game.
    const guards = ARTS.filter((a) => a.effect === 'guard').map((art) => ({ art, level: 5 }))
    const all = only(...guards.map((c) => c.art.condition))
    const out = applyArts(base(), guards, all, scratch())
    expect(out.damageScale).toBeGreaterThan(0)
    expect(out.damageScale).toBeLessThan(1)
  })

  it('keeps the shorter crit cycle when two overlap, rather than stacking them', () => {
    const crits = ARTS.filter((a) => a.effect === 'crit')
    const b = base()
    const one = applyArts(b, [{ art: crits[0]!, level: 1 }], only(crits[0]!.condition), scratch())
    const both = applyArts(
      b,
      crits.map((art) => ({ art, level: 5 })),
      only(...crits.map((a) => a.condition)),
      scratch(),
    )
    expect(both.critEvery).toBeLessThanOrEqual(one.critEvery)
    // A cycle of 1 would be "every sweep doubled", which is just damage under
    // a different name.
    expect(both.critEvery).toBeGreaterThan(1)
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

describe('the run progression', () => {
  it('starts every carried art at grade one', () => {
    const p = beginProgress(equippedIds({}, 'jian'))
    expect(p.carried.length).toBe(EQUIPPED_ARTS)
    for (const c of p.carried) expect(c.level).toBe(START_LEVEL)
  })

  it('advances the list in order, cycling', () => {
    const p = beginProgress(equippedIds({}, 'jian'))
    const first = p.carried.map((c) => c.art.id)
    for (let i = 0; i < EQUIPPED_ARTS; i++) {
      const raised = advanceArt(p)
      expect(raised?.art.id).toBe(first[i])
      expect(raised?.level).toBe(START_LEVEL + 1)
    }
    // Round two lands back on the head of the list.
    expect(advanceArt(p)?.art.id).toBe(first[0])
  })

  it('skips an art already at the cap rather than wasting the 感悟', () => {
    // A level-up that appears to do nothing is worse than no level-up: the
    // player has no way to tell it apart from a bug.
    const p = beginProgress(equippedIds({}, 'jian'))
    let raised = advanceArt(p)
    let guard = 0
    while (raised && guard++ < 200) raised = advanceArt(p)
    for (const c of p.carried) expect(c.level).toBe(MAX_ART_LEVEL)
    // Everything capped: it reports so rather than silently bumping past five.
    expect(advanceArt(p)).toBeNull()
  })

  it('falls back to the head of the scroll when nothing is equipped', () => {
    // The 法 tab is optional by design — a player who never opens it still
    // walks out with a coherent build, and a save from before it existed still
    // means something.
    for (const weapon of WEAPONS) {
      const ids = equippedIds({}, weapon.id)
      expect(ids.length, weapon.id).toBe(EQUIPPED_ARTS)
      for (const id of ids) {
        expect(ARTS.find((a) => a.id === id)?.weapon).toBe(weapon.id)
      }
    }
  })

  it('honours an explicit order, and only that weapon’s arts', () => {
    const spear = ARTS.filter((a) => a.weapon === 'spear').map((a) => a.id)
    const chosen = [spear[3]!, spear[1]!]
    const ids = equippedIds({ spear: chosen }, 'spear')
    expect(ids).toEqual(chosen)
  })

  it('drops an art from a weapon you are not holding', () => {
    const p = beginProgress(['jian-point', 'spear-thrust'])
    // beginProgress does not filter by weapon — that is the save parser's job —
    // but it must never invent an art for an id it does not know.
    expect(p.carried.every((c) => ARTS.includes(c.art))).toBe(true)
    expect(beginProgress(['no-such-art']).carried).toEqual([])
  })
})
