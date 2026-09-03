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
import { deriveStats, emptyKit, type Stats } from '../src/sim/loadout'

const TICK = 1 / 60
const base = (): Stats => deriveStats(new Map(), emptyKit())
const scratch = (): Stats => deriveStats(new Map(), emptyKit())

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
