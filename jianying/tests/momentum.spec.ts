/**
 * 势 — the loop the arts trade in.
 *
 * These pin the rule that makes the four conditions one system rather than
 * four: being in the fight banks momentum, planting your feet spends it. The
 * measurements that forced this design are recorded in data/arts.ts; what is
 * pinned here is the behaviour, so the next person to tune a threshold finds
 * out immediately whether they broke the loop.
 */
import { describe, expect, it } from 'vitest'
import { CONDITIONS, conditionKind, artGrowth, ARTS, MAX_ART_LEVEL } from '../src/data/arts'
import {
  MAX_MOMENTUM,
  BURST_SECONDS,
  createSense,
  senseConditions,
  type ConditionInput,
  type ConditionSense,
} from '../src/sim/conditions'
import { applyArts, NO_SURGE, surgeOf } from '../src/sim/arts'
import { WEAPONS } from '../src/data/weapons'
import { deriveStats, emptyKit, type Stats } from '../src/sim/loadout'
import { emptyAttributes } from '../src/meta/character'

const TICK = 1 / 60
const base = (): Stats => deriveStats(emptyKit())
const scratch = (): Stats => deriveStats(emptyKit())

/** Runs the sense for `seconds` under one steady input. */
function hold(sense: ConditionSense, input: Partial<ConditionInput>, seconds: number): void {
  const full: ConditionInput = {
    speed: 0,
    maxSpeed: 200,
    moveX: 0,
    moveY: 0,
    nearby: 0,
    hp: 100,
    maxHp: 100,
    ...input,
  }
  for (let i = 0; i < Math.round(seconds / TICK); i++) senseConditions(sense, full, TICK)
}

/** Top speed in a straight line — the cheapest way to bank 势. */
const RUN = { speed: 200, maxSpeed: 200, moveX: 1, moveY: 0 }
const STAND = { speed: 0, maxSpeed: 200, moveX: 0, moveY: 0 }

describe('势', () => {
  it('banks while the fight holds and caps rather than growing forever', () => {
    const sense = createSense()
    hold(sense, RUN, 1)
    expect(sense.momentum).toBeGreaterThan(0)
    hold(sense, RUN, 30)
    expect(sense.momentum).toBe(MAX_MOMENTUM)
  })

  it('pays nothing for standing still with nothing banked', () => {
    // The rule that ties the two halves together. Without it, a player who
    // never moves gets the burst for free and the loop is not a loop.
    const sense = createSense()
    // Measured just past the hold, NOT after two seconds: a burst only lasts
    // BURST_SECONDS, so a late look sees zero either way and the test cannot
    // tell a discharge that never happened from one that already finished.
    hold(sense, STAND, 0.35)
    expect(sense.active.still).toBe(true)
    expect(sense.spent).toBe(0)
    expect(sense.burst).toBe(0)
  })

  it('discharges on planting the feet, once, and then runs dry', () => {
    const sense = createSense()
    hold(sense, RUN, 3)
    const banked = Math.floor(sense.momentum)
    expect(banked).toBeGreaterThanOrEqual(1)

    hold(sense, STAND, 0.35) // past STILL_HOLD, inside BURST_SECONDS
    expect(sense.spent).toBe(banked)
    expect(sense.momentum).toBe(0)

    // Standing there longer does not re-trigger: it is an edge, not a state.
    hold(sense, STAND, BURST_SECONDS + 0.2)
    expect(sense.burst).toBe(0)
    expect(sense.spent).toBe(0)
  })

  it('can be earned again by going back into the fight', () => {
    const sense = createSense()
    hold(sense, RUN, 3)
    hold(sense, STAND, BURST_SECONDS + 0.4)
    expect(sense.spent).toBe(0)
    hold(sense, RUN, 3)
    hold(sense, STAND, 0.35)
    expect(sense.spent).toBeGreaterThanOrEqual(1)
  })

  it('lets being surrounded bank it, because a crowd is being in the fight', () => {
    // Surrounded was briefly a SPENDING condition. It is a state, not an
    // instant — an engaged player is surrounded more or less continuously, so
    // paying on the rising edge paid almost never, and the arts fell from 26%
    // below the technique cards to 37% below. Measured, reverted, pinned.
    const sense = createSense()
    expect(conditionKind('surrounded')).toBe('charge')
    // Standing in a crowd: still holds too, so the only thing that can have
    // filled the bank is the crowd. Asserting on the momentum rather than on
    // the classification is what gives this teeth — the data can say 'charge'
    // while updateMomentum quietly ignores it.
    hold(sense, { ...STAND, nearby: 8 }, 1.5)
    expect(sense.active.surrounded).toBe(true)
    expect(sense.momentum + sense.spent).toBeGreaterThan(0)
  })
})

describe('what a discharge is worth', () => {
  const spendArt = ARTS.find((a) => conditionKind(a.condition) === 'spend')!

  it('pays a spending art more for more 势, and nothing for none', () => {
    const b = base()
    const quiet = applyArts(b, [{ art: spendArt, level: 2 }], createSense().active, scratch())
    expect(quiet).toEqual(b)

    const one = applyArts(b, [{ art: spendArt, level: 2 }], createSense().active, scratch(), 1, {
      spent: 1,
      desperate: false,
    })
    const full = applyArts(b, [{ art: spendArt, level: 2 }], createSense().active, scratch(), 1, {
      spent: MAX_MOMENTUM,
      desperate: false,
    })
    expect(one).not.toEqual(b)
    expect(artGrowth(2 * MAX_MOMENTUM)).toBeGreaterThan(artGrowth(2))
    // Whatever stat this art moves, three points of 势 must move it further
    // than one. Compared through the growth curve so the assertion does not
    // have to know which effect the art happens to use.
    const moved = (o: Stats): number =>
      o.slashDamage + o.slashRange + o.moveSpeed + o.echoDamage + (1 / o.slashInterval) * 10
    expect(moved(full)).toBeGreaterThan(moved(one))
  })

  it('lifts every art a grade when the run is nearly lost', () => {
    // 危 as a rule rather than a slot. It was measured at 1% of a run as a
    // condition — a level-one swordsman whose one woken art sat on it had a
    // build that could never fire once.
    const b = base()
    const charge = ARTS.find((a) => conditionKind(a.condition) === 'charge')!
    const on = createSense().active
    on[charge.condition] = true
    const calm = applyArts(b, [{ art: charge, level: 1 }], on, scratch(), 1, NO_SURGE)
    const desperate = applyArts(b, [{ art: charge, level: 1 }], on, scratch(), 1, {
      spent: 0,
      desperate: true,
    })
    expect(desperate).not.toEqual(calm)
  })

  it('never lets desperation push a grade past the ceiling', () => {
    const b = base()
    const charge = ARTS.find((a) => conditionKind(a.condition) === 'charge')!
    const on = createSense().active
    on[charge.condition] = true
    const top = applyArts(b, [{ art: charge, level: MAX_ART_LEVEL }], on, scratch(), 1, NO_SURGE)
    const topDesperate = applyArts(
      b,
      [{ art: charge, level: MAX_ART_LEVEL }],
      on,
      scratch(),
      1,
      { spent: 0, desperate: true },
    )
    expect(topDesperate).toEqual(top)
  })
})

describe('神 reaches the arts', () => {
  // What Spirit did before this: it scaled `orbitDamage`, `boltDamage` and
  // `novaDamage` — three TECHNIQUE CARDS. No art uses any of those three
  // effects, so the attribute the interface called "art power" moved nothing
  // at all for the arts, and a thrower who put most of its twenty points into
  // 神 watched no number change anywhere.
  const sheet = (spirit: number) => ({ ...emptyAttributes(), body: 6, edge: 6, swift: 4, spirit })

  /**
   * The stat each effect moves, and which way is stronger.
   *
   * Written out rather than compared with `toEqual`, and that is the whole
   * reason this test has teeth. Two sheets with different Spirit produce
   * different `Stats` before any art fires — `deriveStats` has always scaled
   * orbit, bolt and nova by it — so "the results differ" passes whether or not
   * 神 ever reaches an art. The comparison has to be the art's OWN
   * contribution, measured against its own base.
   */
  const READS: Partial<Record<string, { of: (s: Stats) => number; bigger: boolean }>> = {
    damage: { of: (o) => o.slashDamage, bigger: true },
    rate: { of: (o) => o.slashInterval, bigger: false },
    range: { of: (o) => o.slashRange, bigger: true },
    arc: { of: (o) => o.slashHalfAngle, bigger: true },
    speed: { of: (o) => o.moveSpeed, bigger: true },
    echo: { of: (o) => o.echoDamage, bigger: true },
    guard: { of: (o) => o.damageScale, bigger: false },
    pierce: { of: (o) => o.slashRange, bigger: true },
  }

  it('makes every art it can move, move further', () => {
    for (const art of ARTS) {
      const read = READS[art.effect]
      if (!read) continue // crit is a counter; covered by its own test
      const spending = conditionKind(art.condition) === 'spend'
      // ON ITS OWN WEAPON. Fired from the default kit, the 飞刀's 围 art
      // widened a zhanmadao's already broad sweep past MAX_HALF_ANGLE and
      // clamped, so the test read 3.00 against 3.00 and reported a saturation
      // the game does not have — on the thrower the same art at the same grade
      // sits at 0.45 rad, nowhere near the ceiling. An art measured on the
      // wrong weapon measures nothing.
      const weapon = WEAPONS.find((w) => w.id === art.weapon)!
      const shot = (spirit: number): { before: number; after: number } => {
        const spent = sheet(spirit)
        const base = deriveStats({ ...emptyKit(), spent, weapon })
        const out = deriveStats({ ...emptyKit(), spent, weapon })
        const active = createSense().active
        if (!spending) active[art.condition] = true
        const fired = applyArts(base, [{ art, level: 3 }], active, out, 1, {
          spent: spending ? MAX_MOMENTUM : 0,
          desperate: false,
        })
        return { before: read.of(base), after: read.of(fired) }
      }
      const quiet = shot(0)
      const rich = shot(18)
      const label = `${art.name} (${art.effect})`
      // None of these stats is touched by Spirit before an art fires — 神
      // reaches orbit, bolt and nova in `deriveStats` and nothing else — so
      // the two runs start from the same number and the fired values can be
      // compared directly. Asserted rather than assumed, because the day that
      // stops being true this test would quietly start measuring the base.
      expect(rich.before, `${label} base`).toBe(quiet.before)
      const none = quiet.after
      const lots = rich.after
      if (read.bigger) expect(lots, label).toBeGreaterThan(none)
      else expect(lots, label).toBeLessThan(none)
    }
  })

  it('carries 神 through the per-frame copy', () => {
    // `applyArts` copies base into a caller-owned scratch every frame. The
    // scratch here is derived from a sheet with NO Spirit, so the only way the
    // multiplier can reach the art is through that copy — which is the point:
    // a field missing from it reads as whatever the scratch happened to hold,
    // and for a multiplier that is every art silently firing at the wrong
    // strength, from the quietest possible omission.
    const base = deriveStats({ ...emptyKit(), spent: sheet(18) })
    const out = deriveStats({ ...emptyKit(), spent: sheet(0) })
    expect(out.artScale).toBeLessThan(base.artScale)
    applyArts(base, [], createSense().active, out)
    expect(out.artScale).toBe(base.artScale)
  })
})

describe('the edges a mutation audit found unguarded', () => {
  // Each of these is a rule the code states and no test was reading. They were
  // found by changing the code in one small way and watching the suite stay
  // green — which is a statement about the suite, not about the code.

  it('fires no spending art on an empty bank, at the apply as well as the sense', () => {
    // `momentum` pins the rule where 势 is COUNTED. This pins it where it is
    // SPENT: flipping `surge.spent <= 0` to `< 0` in applyArts let a spending
    // art fire off nothing, and every test still passed.
    // EVERY spending art, not the first one. Most of them multiply, and a
    // multiplier at zero power is 1 — so testing one of those proves nothing:
    // the maths is already a no-op and the guard could be deleted unnoticed.
    // `pierce` is the one that is not neutral at zero (its arc exponent goes
    // the wrong way), and it is the reason this loop exists.
    for (const art of ARTS.filter((a) => conditionKind(a.condition) === 'spend')) {
      const weapon = WEAPONS.find((w) => w.id === art.weapon)!
      const base = deriveStats({ ...emptyKit(), weapon })
      const out = deriveStats({ ...emptyKit(), weapon })
      // Its own condition held, and nothing banked. It must do nothing at all.
      const active = createSense().active
      active[art.condition] = true
      const fired = applyArts(base, [{ art, level: 5 }], active, out, 1, {
        spent: 0,
        desperate: true,
      })
      expect(fired, `${art.name} (${art.effect})`).toEqual(base)
    }
  })

  it('keeps the crit cycle inside its own table, at every power the game allows', () => {
    // The cycle is a lookup, and the index is grade times 势 times 神 — three
    // things that multiply. `Math.min` is the only thing keeping it in the
    // table; turning it into `Math.max` reads past the end, and `critEvery`
    // becomes undefined rather than a number. Nothing noticed.
    const critArt = ARTS.find((a) => a.effect === 'crit')!
    const weapon = WEAPONS.find((w) => w.id === critArt.weapon)!
    for (const spirit of [0, 20]) {
      for (const level of [1, 3, MAX_ART_LEVEL]) {
        const spent = { ...emptyAttributes(), spirit }
        const base = deriveStats({ ...emptyKit(), weapon, spent })
        const out = deriveStats({ ...emptyKit(), weapon, spent })
        const active = createSense().active
        active[critArt.condition] = true
        const fired = applyArts(base, [{ art: critArt, level }], active, out, 1, {
          spent: MAX_MOMENTUM,
          desperate: true,
        })
        expect(Number.isFinite(fired.critEvery), `grade ${level}, 神 ${spirit}`).toBe(true)
        // A cycle of 1 is "every sweep crits", which is damage under another
        // name; 0 would be a divide waiting to happen.
        expect(fired.critEvery, `grade ${level}, 神 ${spirit}`).toBeGreaterThan(1)
      }
    }
  })

  it('takes the shorter of two crit cycles rather than stacking them', () => {
    // The existing version of this passed for the wrong reason: only ONE art
    // in the game uses crit, so "two overlapping" was one art and the
    // comparison was against itself. Built here from two real arts on
    // different conditions, which is the case the rule exists for.
    const critArt = ARTS.find((a) => a.effect === 'crit')!
    // A CHARGING condition, so it fires from its posture alone — picking any
    // art at all can land on the spending one, which needs 势 and then simply
    // does not fire, and the test reads that as the rule failing.
    const other = ARTS.find(
      (a) =>
        a.weapon === critArt.weapon &&
        a.condition !== critArt.condition &&
        conditionKind(a.condition) === 'charge',
    )!
    const twin = { ...other, effect: 'crit' as const }
    const weapon = WEAPONS.find((w) => w.id === critArt.weapon)!
    const base = deriveStats({ ...emptyKit(), weapon })
    const active = createSense().active
    active[critArt.condition] = true
    active[twin.condition] = true
    const one = applyArts(base, [{ art: critArt, level: 1 }], active,
      deriveStats({ ...emptyKit(), weapon }))
    const both = applyArts(base, [{ art: critArt, level: 1 }, { art: twin, level: 5 }], active,
      deriveStats({ ...emptyKit(), weapon }))
    expect(both.critEvery).toBeLessThan(one.critEvery)
    expect(both.critEvery).toBeGreaterThan(1)
  })
})

describe('the loop is a loop', () => {
  it('has both halves, and every condition belongs to exactly one', () => {
    const kinds = CONDITIONS.map((c) => c.kind)
    expect(kinds).toContain('charge')
    expect(kinds).toContain('spend')
    for (const c of CONDITIONS) expect(conditionKind(c.id)).toBe(c.kind)
  })

  it('reads the surge straight off the sense, with no second opinion', () => {
    const sense = createSense()
    hold(sense, RUN, 3)
    hold(sense, STAND, 0.35)
    expect(surgeOf(sense)).toEqual({ spent: sense.spent, desperate: sense.desperate })
  })
})
