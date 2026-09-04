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
import {
  ARTS,
  EQUIPPED_ARTS,
  MAX_ART_LEVEL,
  artScale,
  conditionKind,
  type Art,
} from '../src/data/arts'
import { WEAPONS } from '../src/data/weapons'
import { MAX_RARITY } from '../src/data/rarity'
import {
  ATTUNE_PER_GRADE,
  MIGHT,
  applyArts,
  artActs,
  artGrade,
  attune,
  awakeCount,
  carriedFor,
  equippedIds,
  LIVE_EFFECTS,
} from '../src/sim/arts'
import { deriveStats, emptyKit, type Stats } from '../src/sim/loadout'
import { MAX_MOMENTUM, createSense, type Conditions } from '../src/sim/conditions'

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

/**
 * Fires one art, whichever half of the loop its condition belongs to.
 *
 * A charging art fires while its posture holds; a spending art fires only
 * inside a discharge and never from its condition alone. A test that wants to
 * see WHAT an effect does should not have to care which — but it must not
 * paper over the difference either, which is why the two paths are visibly
 * different here rather than hidden behind one always-on flag.
 */
function fire(b: Stats, art: Art, level = 1, spent = 1, desperate = false): Stats {
  const spending = conditionKind(art.condition) === 'spend'
  return applyArts(
    b,
    [{ art, level }],
    spending ? nothing() : only(art.condition),
    scratch(),
    1,
    { spent: spending ? spent : 0, desperate },
  )
}

const artFor = (effect: string): Art | undefined => ARTS.find((a) => a.effect === effect)

/** The same, for the tests that need one and would be meaningless without. */
const mustArtFor = (effect: string): Art => {
  const art = artFor(effect)
  if (!art) throw new Error(`no art uses the ${effect} effect any more`)
  return art
}

/**
 * Effects the simulation can act on that NO art currently uses.
 *
 * Written down rather than skipped silently. Cutting six weapons to two took
 * twenty arts with them, and five working levers lost their only caller in the
 * process. They are kept, not deleted, because each one already has a declared
 * future use: `greed` is magnet, `tide` is push and `vigil` is heal among the
 * named powers in data/affixes.ts, and orbit and bolt are what a third class
 * would most naturally be built from. Listing them here means the day one is
 * wired up, this test starts covering it without anybody remembering to.
 */
const UNUSED_EFFECTS = ['bolt', 'heal', 'magnet', 'orbit', 'push'] as const

describe('the arts acting', () => {
  it('changes nothing while no condition holds', () => {
    // The whole promise of a conditional system: an art is a thing you PROVOKE.
    // If any of it leaked into the idle state it would be a passive bonus with
    // a decoration on top, which is the design this replaced.
    const b = base()
    const out = applyArts(b, carriedFor('great'), nothing(), scratch())
    expect(out).toEqual(b)
  })

  it('changes nothing when the scroll is empty', () => {
    const b = base()
    const out = applyArts(b, [], only('running', 'surrounded'), scratch())
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
    // Every lever the simulation owns still has a check written for it, used
    // or not — dropping the check with the art would leave the lever
    // unexercised the day something calls it again.
    expect(Object.keys(CHECKS).sort()).toEqual([...LIVE_EFFECTS].sort())

    const covered: string[] = []
    for (const [effect, check] of Object.entries(CHECKS)) {
      const art = artFor(effect)
      if (!art) continue
      covered.push(effect)
      const b = base()
      const out = fire(b, art)
      check(b, out)
    }
    // And the ones with no art are exactly the ones we said they were.
    const missing = [...LIVE_EFFECTS].filter((e) => !covered.includes(e)).sort()
    expect(missing).toEqual([...UNUSED_EFFECTS].sort())
  })

  it('scales with the grade', () => {
    const art = mustArtFor('damage')
    const b = base()
    const one = fire(b, art, 1).slashDamage
    const three = fire(b, art, 3).slashDamage
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

  it('stacks when two arts move the same stat at once', () => {
    // WHAT THIS PINS CHANGED, and it is worth saying why it was kept.
    //
    // It used to use two `damage` arts, which a single scroll really could
    // carry. It cannot any more: each of the two scrolls covers its five
    // conditions with five DIFFERENT effects, so within one class no two arts
    // ever touch the same stat. The pair below is therefore cross-scroll and
    // unreachable in play today.
    //
    // The test stays because it pins `applyArts`'s contract rather than a
    // build: the accumulate-don't-replace rule is what a third class, or a
    // named power that grants an art, would immediately depend on — and it is
    // the kind of thing that silently becomes "last one wins" during a
    // refactor with nothing to catch it.
    const [a, b2] = ARTS.filter((x) => x.effect === 'echo')
    expect(a && b2, 'two echo arts to stack').toBeTruthy()
    const b = base()
    const one = fire(b, a!, 1).echoDamage
    const both = applyArts(
      b,
      [
        { art: a!, level: 1 },
        { art: b2!, level: 1 },
      ],
      only(a!.condition, b2!.condition),
      scratch(),
    ).echoDamage
    expect(one).toBeGreaterThan(0)
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
    // At the worst case the game can produce: top grade, full 势 behind it, and
    // desperate on top — which is where an additive reduction would have gone
    // through the floor and handed the player invulnerability.
    const guards = ARTS.filter((a) => a.effect === 'guard').map((art) => ({ art, level: 5 }))
    const all = only(...guards.map((c) => c.art.condition))
    const out = applyArts(base(), guards, all, scratch(), 1, {
      spent: MAX_MOMENTUM,
      desperate: true,
    })
    expect(out.damageScale).toBeGreaterThan(0)
    expect(out.damageScale).toBeLessThan(1)
  })

  it('keeps the shorter crit cycle when two overlap, rather than stacking them', () => {
    const crits = ARTS.filter((a) => a.effect === 'crit')
    const b = base()
    const one = fire(b, crits[0]!, 1)
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

describe('器蕴 — the arts, read off the gear', () => {
  /** All four slots at one rung, which is how a "full set" is expressed. */
  const set = (rung: number): number[] => [rung, rung, rung, rung]

  it('wakes one art for a swordsman in rags, never zero', () => {
    // A common blade is still a blade. Handing a new player an empty strip to
    // teach them that rarity matters would teach them instead that the game
    // does nothing.
    expect(awakeCount(0, 5)).toBe(1)
  })

  it('wakes one more art per rung of the weapon, up to the whole scroll', () => {
    expect(awakeCount(1, 5)).toBe(2)
    expect(awakeCount(2, 5)).toBe(3)
    expect(awakeCount(3, 5)).toBe(4)
    expect(awakeCount(4, 5)).toBe(5)
  })

  it('never wakes more arts than the scroll has', () => {
    // 仙 would reach six by the formula, and there are five.
    expect(awakeCount(MAX_RARITY, 5)).toBe(5)
    expect(awakeCount(MAX_RARITY, 3)).toBe(3)
  })

  it('grades every art at one for a set with nothing in it', () => {
    expect(artGrade([])).toBe(1)
    expect(artGrade(set(0))).toBe(1)
  })

  it('lifts the grade one rung of the ladder at a time, all the way to the cap', () => {
    // The ladder is meant to span exactly the space the rarities span: a full
    // set at each rung is worth exactly one grade more than the rung below.
    // Pinning every step rather than "high beats low" — the rarity ladder
    // itself shipped non-monotone once because only the ends were checked.
    const grades = [0, 1, 2, 3, 4, 5].map((rung) => artGrade(set(rung)))
    expect(grades).toEqual([1, 2, 3, 4, 5, 5])
  })

  it('counts partial sets, so one good piece is felt before the set is finished', () => {
    // The whole reason the grade is a SUM rather than a minimum: an ARPG in
    // which a single purple changes nothing until three more arrive is an ARPG
    // where most drops are noise.
    expect(artGrade([3, 0, 0, 0])).toBe(1)
    expect(artGrade([3, 1, 0, 0])).toBe(2)
    expect(artGrade([ATTUNE_PER_GRADE, 0, 0, 0])).toBe(2)
  })

  it('never grades past the art cap, whatever a save claims to be wearing', () => {
    expect(artGrade([99, 99, 99, 99])).toBe(MAX_ART_LEVEL)
    expect(artGrade([-4, -4, -4, -4])).toBe(1)
  })

  it('takes the arts from the top of the ranking, in order', () => {
    // What makes the 法 tab a real decision: with a common blade you are
    // choosing your ONE art, not being handed whichever the table listed first.
    const ranked = equippedIds({}, 'great')
    expect(attune(ranked, 0, set(0)).map((c) => c.art.id)).toEqual([ranked[0]])
    expect(attune(ranked, 2, set(0)).map((c) => c.art.id)).toEqual(ranked.slice(0, 3))
  })

  it('puts every art it wakes at the same grade', () => {
    const carried = attune(equippedIds({}, 'great'), 3, set(2))
    expect(carried.length).toBe(4)
    for (const c of carried) expect(c.level).toBe(artGrade(set(2)))
  })

  it('makes a better weapon worth finding twice over', () => {
    // The one number that appears in both halves of the rule, deliberately:
    // a great blade wakes another art AND grades every art higher. "The weapon
    // is the class" is a small promise if you only feel it once.
    const ranked = equippedIds({}, 'feidao')
    const common = attune(ranked, 0, [0, 2, 2, 2])
    const divine = attune(ranked, 4, [4, 2, 2, 2])
    expect(divine.length).toBeGreaterThan(common.length)
    expect(divine[0]!.level).toBeGreaterThan(common[0]!.level)
  })

  it('never invents an art for an id it does not know', () => {
    // Ids arrive from a save file, which is a text file on a device.
    expect(attune(['no-such-art'], 5, set(5))).toEqual([])
    const mixed = attune(['great-sink', 'no-such-art', 'feidao-chain'], 5, set(5))
    expect(mixed.every((c) => ARTS.includes(c.art))).toBe(true)
  })

  it('ranks the whole scroll, not just the four the hub lets you choose', () => {
    // The fifth has to be reachable, or the reward for a 神 blade is a rule
    // with nothing behind it.
    for (const weapon of WEAPONS) {
      const ids = equippedIds({}, weapon.id)
      const scroll = ARTS.filter((a) => a.weapon === weapon.id)
      expect(ids.length, weapon.id).toBe(scroll.length)
      expect(new Set(ids).size, weapon.id).toBe(scroll.length)
      for (const id of ids) expect(ARTS.find((a) => a.id === id)?.weapon).toBe(weapon.id)
    }
  })

  it('honours an explicit ranking, and puts the rest of the scroll behind it', () => {
    const feidao = ARTS.filter((a) => a.weapon === 'feidao').map((a) => a.id)
    const chosen = [feidao[3]!, feidao[1]!]
    const ids = equippedIds({ feidao: chosen }, 'feidao')
    expect(ids.slice(0, 2)).toEqual(chosen)
    expect(ids.slice(2).sort()).toEqual([feidao[0]!, feidao[2]!, feidao[4]!].sort())
  })

  it('ignores an art ranked for a weapon you are not holding', () => {
    const ids = equippedIds({ great: ['feidao-chain', 'great-grind'] }, 'great')
    expect(ids).not.toContain('feidao-chain')
    expect(ids[0]).toBe('great-grind')
  })

  it('never ranks more than the hub can set', () => {
    const great = ARTS.filter((a) => a.weapon === 'great').map((a) => a.id)
    // A save claiming all five are "chosen" must still leave the fifth as the
    // tail, or the cap in the hub would be a suggestion.
    const ids = equippedIds({ great: [...great].reverse() }, 'great')
    expect(ids.slice(0, EQUIPPED_ARTS)).toEqual([...great].reverse().slice(0, EQUIPPED_ARTS))
  })
})

describe('内力 — what a level-up grants now', () => {
  const carried = attune(equippedIds({}, 'great'), 0, [0, 0, 0, 0])

  it('grants nothing at level one, so a run opens on its baseline', () => {
    const out = applyArts(base(), carried, nothing(), scratch(), 1)
    expect(out.slashDamage).toBeCloseTo(base().slashDamage)
    expect(out.maxHp).toBeCloseTo(base().maxHp)
  })

  it('adds flat damage and health per level, and nothing else', () => {
    const b = base()
    const out = applyArts(b, [], nothing(), scratch(), 5)
    expect(out.slashDamage).toBeCloseTo(b.slashDamage + MIGHT.damage * 4)
    expect(out.maxHp).toBeCloseTo(b.maxHp + MIGHT.maxHp * 4)
    // Everything a level used to be able to touch through the arts stays put.
    expect(out.slashInterval).toBeCloseTo(b.slashInterval)
    expect(out.moveSpeed).toBeCloseTo(b.moveSpeed)
    expect(out.critEvery).toBe(b.critEvery)
  })

  it('cannot compound, however often the permanent block is recomputed', () => {
    // The bug this shape exists to make impossible. Stats are recomputed
    // mid-run every time a piece is put on; folding the levels into THAT block
    // would add them again on every pickup.
    const b = base()
    const once = applyArts(b, [], nothing(), scratch(), 7).slashDamage
    const twice = applyArts(b, [], nothing(), scratch(), 7)
    applyArts(b, [], nothing(), twice, 7)
    expect(twice.slashDamage).toBeCloseTo(once)
  })

  it('leaves the baseline untouched, since the copy is what grows', () => {
    const b = base()
    const before = b.slashDamage
    applyArts(b, carried, nothing(), scratch(), 12)
    expect(b.slashDamage).toBe(before)
  })
})

describe('the ranking is the build', () => {
  /**
   * THE EARLIEST AND SHARPEST DECISION IN THE GAME, and nothing was holding it.
   *
   * `awakeCount` is one plus the weapon's rung, taken off the TOP of the
   * player's order — so a swordsman carrying a 凡 blade wakes exactly ONE art
   * and the 法 tab is where they choose which of the five it is. The suite
   * checked how MANY woke and never once checked that the ranking decided
   * WHICH, which is the half a player can feel.
   */
  it('wakes the art the player ranked first, on a common blade', () => {
    expect(awakeCount(0, 5)).toBe(1)
    for (const id of ['great-onecut', 'great-mountain', 'great-sink']) {
      const carried = attune(equippedIds({ great: [id] }, 'great'), 0, [0, 0, 0, 0])
      expect(carried.map((c) => c.art.id)).toEqual([id])
    }
  })

  it('opens the scroll downward as the blade improves, in the ranked order', () => {
    const order = ['great-onecut', 'great-mountain', 'great-sink']
    for (const rung of [0, 1, 2]) {
      const carried = attune(equippedIds({ great: order }, 'great'), rung, [0, 0, 0, 0])
      // The blade decides how far down; the player decides what is up there.
      expect(carried.map((c) => c.art.id)).toEqual(order.slice(0, rung + 1))
    }
  })

  it('never wakes more than the scroll holds, however good the blade', () => {
    const scroll = equippedIds({}, 'great')
    expect(attune(scroll, 5, [5, 5, 5, 5])).toHaveLength(scroll.length)
  })
})
