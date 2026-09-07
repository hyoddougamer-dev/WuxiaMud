/**
 * 势轮 — the rules that make it a build rather than a shopping list.
 *
 * A passive tree fails in a particular way: nodes accumulate faster than the
 * code that applies them, and the board fills with text nobody wired. The first
 * describe below is written directly against that — it walks the whole table
 * and asserts every node moves at least one number the simulation reads. A
 * talent that does nothing cannot be added without this failing.
 *
 * The rest hold the three rules the screen enforces, and the one that actually
 * shapes a build: you may hold exactly one keystone.
 */
import { describe, expect, it } from 'vitest'
import {
  MAX_KEYSTONES,
  RING_GATE,
  TALENTS,
  TALENT_BY_ID,
  isKeystone,
  wheelPointsAt,
  type Wheel,
} from '../src/data/talents'
import {
  canTake,
  keystonesHeld,
  openRing,
  pointsInArm,
  pointsLeft,
  pointsSpent,
  ranksIn,
  refusalFor,
  respec,
  sanitiseWheel,
  takeTalent,
} from '../src/meta/wheel'
import { foldOne, foldTalents, noTalents, boostView } from '../src/sim/talents'
import { createCharacter, type Character } from '../src/meta/character'
import { noConditions } from '../src/sim/conditions'
import { MAX_SHI, createShi, updateShi } from '../src/sim/shi'
import { createBar, updateBar, costOf, restOf, applySkills } from '../src/sim/skills'
import { affixLine, namesSkill, rollAffixes, type Affix } from '../src/data/affixes'
import { foldGearSkills } from '../src/sim/loadout'
import type { OwnedItem } from '../src/meta/inventory'
import { ITEMS } from '../src/data/items'
import { parseCharacter } from '../src/meta/save'
import { Rng } from '../src/core/rng'
import { SKILL_BY_ID } from '../src/data/skills'
import { deriveStats } from '../src/sim/loadout'

/** A character at `level` with `wheel` already spent. */
const at = (level: number, wheel: Wheel = {}): Character => {
  const c = createCharacter()
  c.level = level
  c.wheel = wheel
  return c
}

/** Spends `n` points on `id`, ignoring whether the rules allow it. */
const forced = (id: string, n: number): Wheel => ({ [id]: n })

describe('every node does something', () => {
  it('moves at least one number the simulation reads', () => {
    // THE TEST THIS FILE EXISTS FOR. A tree grows faster than the code that
    // applies it, and a node whose effect nothing folds is indistinguishable
    // from a node that works — it just quietly never helps.
    const empty = noTalents()
    for (const talent of TALENTS) {
      const one = foldOne(talent.id, 1)
      const same =
        one.maxShi === empty.maxShi &&
        one.fill === empty.fill &&
        one.stillFill === empty.stillFill &&
        one.turnGain === empty.turnGain &&
        one.refundEvery === empty.refundEvery &&
        one.cost === empty.cost &&
        one.cooldown === empty.cooldown &&
        one.duration === empty.duration &&
        one.powerAlways === empty.powerAlways &&
        one.anyPosture === empty.anyPosture &&
        one.armour === empty.armour &&
        one.move === empty.move &&
        one.taken === empty.taken &&
        Object.values(one.power).every((v) => v === 0)
      expect(same, `${talent.name} (${talent.id}) folds into nothing`).toBe(false)
    }
  })

  it('gives every node a blurb, and every keystone a stated cost', () => {
    for (const talent of TALENTS) {
      expect(talent.blurb.trim().length, talent.id).toBeGreaterThan(10)
      // A keystone that reads as pure upside is a keystone nobody would decline,
      // which makes the one-keystone rule meaningless.
      if (isKeystone(talent)) {
        expect(talent.cost?.trim().length ?? 0, `${talent.id} states no cost`).toBeGreaterThan(5)
        expect(talent.ranks, talent.id).toBe(1)
      }
    }
  })

  it('gives each arm a keystone, and no arm two', () => {
    const arms = ['still', 'running', 'turn', 'surrounded']
    for (const arm of arms) {
      const keys = TALENTS.filter((t) => t.arm === arm && isKeystone(t))
      expect(keys, arm).toHaveLength(1)
    }
    expect(TALENTS.filter(isKeystone)).toHaveLength(arms.length)
  })

  it('stacks ranks by re-applying, so the third is worth less than the first', () => {
    // Multiplicative levers compound and additive ones do not, and both have to
    // behave. A cooldown node taken three times must not be 3x its own number,
    // or a three-rank node would be strictly better per point than any other.
    const one = foldOne('thrift', 1).cooldown
    const three = foldOne('thrift', 3).cooldown
    expect(three).toBeCloseTo(one ** 3, 9)
    expect(1 - three).toBeLessThan(3 * (1 - one))
  })

  it('never lets ranks past the cap change anything', () => {
    const talent = TALENT_BY_ID.get('current')!
    expect(foldOne('current', talent.ranks + 5).fill).toBeCloseTo(
      foldOne('current', talent.ranks).fill,
      9,
    )
  })
})

describe('what a swordsman may take', () => {
  it('hands a fresh swordsman a point, so the board is never a locked screen', () => {
    // The harness found this: a brand-new swordsman opened the wheel and every
    // node refused with "No points left", which teaches nothing about the
    // screen. Same reasoning as the attribute point handed out at creation.
    expect(wheelPointsAt(1)).toBe(1)
    expect(wheelPointsAt(12)).toBe(12)
    expect(canTake(createCharacter(), 'current')).toBe(true)
  })

  it('refuses a node with no points left', () => {
    const c = at(1, forced('current', 1))
    expect(pointsLeft(c)).toBe(0)
    expect(refusalFor(c, 'thrift')).toBe('no-points')
    expect(takeTalent(c, 'thrift')).toBe(false)
  })

  it('refuses a node past its rank cap', () => {
    const c = at(40, forced('deepwell', 2))
    expect(refusalFor(c, 'deepwell')).toBe('maxed')
  })

  it('gates the outer rings behind points in the SAME arm', () => {
    const c = at(40)
    // Ring 1 is open from the start; 2 and 3 are not.
    expect(canTake(c, 'rooted')).toBe(true)
    expect(refusalFor(c, 'longbreath')).toBe('ring-locked')
    expect(refusalFor(c, 'stillpoint')).toBe('ring-locked')
    // Points in ANOTHER arm do not open this one — otherwise the arms would be
    // one pool with four labels.
    c.wheel = forced('gale', 6)
    expect(refusalFor(c, 'longbreath')).toBe('ring-locked')
    c.wheel = forced('rooted', RING_GATE)
    expect(canTake(c, 'longbreath')).toBe(true)
    expect(refusalFor(c, 'stillpoint')).toBe('ring-locked')
    // TWO NODES, not six ranks of one: `pointsInArm` clamps each node at its
    // own cap, so reaching the rim means spreading across the arm rather than
    // pouring everything into the cheapest node on it. Found by this test
    // failing against `{ rooted: 6 }`.
    c.wheel = { rooted: 3, anvil: 3 }
    expect(pointsInArm(c.wheel, 'still')).toBe(RING_GATE * 2)
    expect(canTake(c, 'stillpoint')).toBe(true)
  })

  it('lets a swordsman hold exactly one keystone', () => {
    const c = at(40, { rooted: 3, anvil: 3, stillpoint: 1, gale: 3, swiftfoot: 3 })
    expect(keystonesHeld(c.wheel)).toHaveLength(MAX_KEYSTONES)
    // The other arm is open all the way and the point is there to spend, and it
    // is still refused. This is the rule that makes two builds different KINDS
    // of thing rather than the same thing at different sizes.
    expect(openRing(c.wheel, 'running')).toBe(3)
    expect(pointsLeft(c)).toBeGreaterThan(0)
    expect(refusalFor(c, 'traceless')).toBe('keystone-taken')
  })

  it('counts spending per arm and overall', () => {
    const c = at(40, { rooted: 3, gale: 2, current: 1 })
    expect(pointsInArm(c.wheel, 'still')).toBe(3)
    expect(pointsInArm(c.wheel, 'running')).toBe(2)
    expect(pointsInArm(c.wheel, 'core')).toBe(1)
    expect(pointsSpent(c.wheel)).toBe(6)
    expect(pointsLeft(c)).toBe(wheelPointsAt(40) - 6)
  })

  it('takes a point, and a respec gives them all back', () => {
    const c = at(6)
    expect(takeTalent(c, 'current')).toBe(true)
    expect(ranksIn(c.wheel, 'current')).toBe(1)
    expect(pointsLeft(c)).toBe(wheelPointsAt(6) - 1)
    respec(c)
    expect(pointsSpent(c.wheel)).toBe(0)
    expect(pointsLeft(c)).toBe(wheelPointsAt(6))
  })
})

describe('a wheel read off disk', () => {
  it('drops ranks past the cap and nodes that no longer exist', () => {
    const out = sanitiseWheel({ deepwell: 99, nosuchnode: 4 }, 40)
    expect(out.deepwell).toBe(TALENT_BY_ID.get('deepwell')!.ranks)
    expect(out.nosuchnode).toBeUndefined()
  })

  it('never returns more points than the level has earned', () => {
    const out = sanitiseWheel({ current: 3, thrift: 3, deepwell: 2 }, 4)
    expect(pointsSpent(out)).toBeLessThanOrEqual(wheelPointsAt(4))
  })

  it('drops a second keystone rather than letting a save carry two', () => {
    const out = sanitiseWheel(
      { rooted: 3, anvil: 3, stillpoint: 1, gale: 3, swiftfoot: 3, traceless: 1 },
      40,
    )
    expect(keystonesHeld(out)).toHaveLength(MAX_KEYSTONES)
  })

  it('drops a node the gate no longer reaches', () => {
    // A rule change the player can neither see nor undo is worse than a refund.
    const out = sanitiseWheel({ stillpoint: 1 }, 40)
    expect(out.stillpoint).toBeUndefined()
  })

  it('survives rubbish', () => {
    expect(sanitiseWheel(null, 10)).toEqual({})
    expect(sanitiseWheel('nope', 10)).toEqual({})
    expect(sanitiseWheel({ current: 'three' }, 10)).toEqual({})
    expect(sanitiseWheel({ current: -4 }, 10)).toEqual({})
  })
})

describe('the wheel reaches the simulation', () => {
  it('raises the 势 ceiling, and the pool respects it', () => {
    const bonus = foldTalents({ deepwell: 2 })
    expect(bonus.maxShi).toBe(2)
    const shi = createShi(MAX_SHI + bonus.maxShi)
    updateShi(shi, { pace: 1, turned: false }, 999)
    expect(shi.value).toBe(MAX_SHI + 2)
  })

  it('fills faster with 流 taken', () => {
    const plain = createShi()
    const quick = createShi()
    const bonus = foldTalents({ current: 3 })
    updateShi(plain, { pace: 1, turned: false }, 1)
    updateShi(quick, { pace: 1, turned: false, fill: bonus.fill }, 1)
    expect(quick.value).toBeGreaterThan(plain.value)
  })

  it('lets 定心 fill 势 while standing perfectly still', () => {
    // The keystone that inverts the loop the whole resource is built on.
    // Standing still earns NOTHING without it — see sim/shi.ts.
    const bonus = foldTalents({ rooted: 3, anvil: 3, stillpoint: 1 })
    const still = createShi()
    updateShi(still, { pace: 0, turned: false }, 2)
    expect(still.value).toBe(0)
    const rooted = createShi()
    updateShi(rooted, { pace: 0, turned: false, stillFill: bonus.stillFill }, 2)
    expect(rooted.value).toBeGreaterThan(0)
  })

  it('makes 无踪 cheapen every skill, and shorten every effect', () => {
    const bonus = foldTalents({ gale: 3, swiftfoot: 3, traceless: 1 })
    const sink = SKILL_BY_ID.get('sink')!
    expect(costOf(sink, bonus)).toBe(sink.cost - 1)
    expect(bonus.duration).toBeLessThan(1)
    // A one-点 skill becomes free, which is the keystone's whole promise — and
    // the floor is zero rather than one for exactly that reason.
    const cheapest = SKILL_BY_ID.get('rend')!
    expect(cheapest.cost).toBe(1)
    expect(costOf(cheapest, bonus)).toBe(0)
  })

  it('makes 破围 pay every boost at once', () => {
    const plain = noConditions()
    expect(boostView(plain, noTalents())).toEqual(plain)
    const bonus = foldTalents({ ironring: 3, press: 3, breakring: 1 })
    const paid = boostView(plain, bonus)
    expect(paid.still && paid.running && paid.turn && paid.surrounded).toBe(true)
    // And it charges for it. A keystone that reads as pure upside is one
    // nobody would decline.
    expect(bonus.taken).toBeGreaterThan(1)
  })

  it('lets 回身 refund exactly what the last cast cost', () => {
    // A TWO-点 SKILL, deliberately. With a one-点 skill "refund what it cost"
    // and "refund a flat 1" are the same number, and a mutation swapping one
    // for the other left this green.
    const bonus = foldTalents({ pivot: 3, whirl: 3, aboutface: 1 })
    expect(bonus.refundEvery).toBeGreaterThan(0)
    const skill = SKILL_BY_ID.get('mountain')!
    expect(skill.cost).toBeGreaterThan(1)

    const bar = createBar([null, null, skill.id])
    const shi = createShi()
    updateShi(shi, { pace: 1, turned: false }, 30)
    updateBar(bar, shi, noConditions(), true, 0.016, bonus)
    const afterCast = shi.value
    expect(afterCast).toBeCloseTo(shi.max - skill.cost, 6)

    updateBar(bar, shi, { ...noConditions(), turn: true }, false, 0.016, bonus)
    expect(shi.value).toBeCloseTo(afterCast + skill.cost, 6)
  })

  it('makes 回身 wait out its own rest before it pays again', () => {
    // A CHEAP, FAST SKILL so a second cast lands INSIDE the refund's rest.
    // Written against an earlier version that used a nine-second cooldown: the
    // refund had always cooled by the time the skill could fire again, so
    // deleting the cooldown check entirely left the suite green.
    const bonus = foldTalents({ pivot: 3, whirl: 3, aboutface: 1 })
    const skill = SKILL_BY_ID.get('rend')!
    expect(skill.cooldown).toBeLessThan(bonus.refundEvery)
    const turn = { ...noConditions(), turn: true }
    const calm = noConditions()

    const bar = createBar([skill.id])
    const shi = createShi()
    updateShi(shi, { pace: 1, turned: false }, 30)

    updateBar(bar, shi, calm, false, 0.016, bonus)
    updateBar(bar, shi, turn, false, 0.016, bonus)
    // The skill fires again the moment its own rest is up, well before the
    // refund's is.
    updateBar(bar, shi, calm, false, skill.cooldown, bonus)
    const afterSecond = shi.value
    updateBar(bar, shi, turn, false, 0.016, bonus)
    expect(shi.value, 'refunded twice inside its own rest').toBeCloseTo(afterSecond, 9)
    // And once it has cooled, it pays again. Sampled AFTER the wait rather
    // than against `afterSecond`: the wait is long enough for the skill to fire
    // a third time, so comparing across it would net a spend against a refund
    // and read as nothing happening.
    updateBar(bar, shi, calm, false, bonus.refundEvery, bonus)
    const beforeLastTurn = shi.value
    updateBar(bar, shi, turn, false, 0.016, bonus)
    expect(shi.value).toBeGreaterThan(beforeLastTurn)
  })

  it('adds arm power to a skill in the skill\'s own unit', () => {
    // "+9% skill power while still" has to move a 55% damage skill to 64% — a
    // figure the player can add up from two lines they have both read. A
    // multiplier would make the node's own number untrue on every skill.
    const bonus = foldTalents({ rooted: 1 })
    const bar = createBar(['sink'])
    const shi = createShi()
    updateShi(shi, { pace: 1, turned: false }, 30)
    updateBar(bar, shi, { ...noConditions(), still: true }, false, 0.016, bonus)
    const sink = SKILL_BY_ID.get('sink')!
    const boosted = sink.power * (1 + sink.boost.extra)
    expect(bar.slots[0]!.cast).toBeCloseTo(boosted + sink.power * 0.09, 9)
  })

  it('folds armour, movement and damage taken into the live sheet', () => {
    const base = deriveStats()
    const out = deriveStats()
    const bonus = foldTalents({ anvil: 3, swiftfoot: 3, unmoved: 2 })
    applySkills(base, createBar([]), out, 1, bonus)
    expect(out.armour).toBe(base.armour + bonus.armour)
    expect(out.moveSpeed).toBeGreaterThan(base.moveSpeed)
    expect(out.damageScale).toBeLessThan(base.damageScale)
  })

  it('changes nothing at all with an empty wheel', () => {
    // The floor every one of the claims above is measured from.
    const base = deriveStats()
    const out = deriveStats()
    applySkills(base, createBar([]), out, 1, foldTalents({}))
    expect(out.armour).toBe(base.armour)
    expect(out.moveSpeed).toBeCloseTo(base.moveSpeed, 9)
    expect(out.damageScale).toBeCloseTo(base.damageScale, 9)
  })
})

describe('gear that names a skill', () => {
  /** One worn piece carrying `affixes`. */
  const wearing = (affixes: Affix[]): OwnedItem[] => [
    { uid: 'u1', baseId: ITEMS[0]!.id, rarity: 2, affixes, power: null, depth: 3 },
  ]

  it('rolls a real skill onto every line that names one', () => {
    // A line with no skill, or a skill that does not exist, prints a raw id on
    // the sheet and silently never matches in the simulation — a piece whose
    // best row does nothing.
    const rng = new Rng(4242)
    for (let i = 0; i < 400; i++) {
      for (const affix of rollAffixes(3, 4, rng)) {
        if (!namesSkill(affix.kind)) {
          expect(affix.skill, `${affix.kind} should not name a skill`).toBeUndefined()
          continue
        }
        expect(affix.skill, `${affix.kind} rolled with no skill`).toBeTruthy()
        expect(SKILL_BY_ID.has(affix.skill!), affix.skill).toBe(true)
      }
    }
  })

  it('says the skill by NAME on the line, not by id', () => {
    const line = affixLine({ kind: 'skillPower', amount: 18, skill: 'mountain' })
    expect(line).toContain(SKILL_BY_ID.get('mountain')!.name)
    expect(line).toContain('18')
    // The two that IMPROVE a skill are drawn as reductions with a real minus.
    // "+12% rest" reads as a downside at a glance and is the opposite.
    expect(affixLine({ kind: 'skillRest', amount: 12, skill: 'sink' })).toContain('−')
    expect(affixLine({ kind: 'skillCost', amount: 1, skill: 'sink' })).toContain('−')
  })

  it('cheapens, hastens and sharpens the skill it names — and only that one', () => {
    const boons = foldGearSkills(
      wearing([
        { kind: 'skillPower', amount: 20, skill: 'sink' },
        { kind: 'skillCost', amount: 1, skill: 'sink' },
        { kind: 'skillRest', amount: 25, skill: 'sink' },
      ]),
      noTalents(),
    )
    const sink = SKILL_BY_ID.get('sink')!
    const other = SKILL_BY_ID.get('rend')!
    expect(costOf(sink, boons)).toBe(sink.cost - 1)
    expect(restOf(sink, boons)).toBeCloseTo(sink.cooldown * 0.75, 9)
    // The piece named ONE skill. Everything else on the bar must be untouched,
    // or the line is a flat bonus wearing a skill's name.
    expect(costOf(other, boons)).toBe(other.cost)
    expect(restOf(other, boons)).toBeCloseTo(other.cooldown, 9)
  })

  it('lands the power line on the cast, in the skill\'s own unit', () => {
    const boons = foldGearSkills(
      wearing([{ kind: 'skillPower', amount: 20, skill: 'sink' }]),
      noTalents(),
    )
    const bar = createBar(['sink'])
    const shi = createShi()
    updateShi(shi, { pace: 1, turned: false }, 30)
    updateBar(bar, shi, noConditions(), false, 0.016, boons)
    const sink = SKILL_BY_ID.get('sink')!
    expect(bar.slots[0]!.cast).toBeCloseTo(sink.power * 1.2, 9)
  })

  it('stacks two pieces on one skill without ever reaching no rest at all', () => {
    // Multiplied, not added: a skill with no rest is a skill with no rhythm,
    // and two lucky pieces should approach that without arriving.
    const heavy = foldGearSkills(
      [
        ...wearing([{ kind: 'skillRest', amount: 60, skill: 'sink' }]),
        {
          uid: 'u2',
          baseId: ITEMS[1]!.id,
          rarity: 2,
          affixes: [{ kind: 'skillRest', amount: 60, skill: 'sink' }],
          power: null,
          depth: 3,
        },
      ],
      noTalents(),
    )
    const sink = SKILL_BY_ID.get('sink')!
    const rest = restOf(sink, heavy)
    expect(rest).toBeGreaterThan(0)
    expect(rest).toBeLessThan(sink.cooldown * 0.3)
  })

  it('drops a line naming a skill this build no longer has', () => {
    // Worse than no line: the sheet would print a raw id and the simulation
    // would never match it.
    const raw = {
      owned: [
        {
          uid: 'u1',
          baseId: ITEMS[0]!.id,
          rarity: 2,
          depth: 3,
          affixes: [
            { kind: 'skillPower', amount: 12, skill: 'nosuchskill' },
            { kind: 'body', amount: 4 },
          ],
        },
      ],
      equipped: {},
    }
    // Through the SAVE, because that is the only door a bad line comes in by.
    const c = createCharacter()
    const back = parseCharacter(JSON.stringify({ ...c, inventory: raw }))!
    const kept = back.inventory.owned.find((e: OwnedItem) => e.uid === 'u1')!
    expect(kept.affixes).toHaveLength(1)
    expect(kept.affixes[0]!.kind).toBe('body')
  })

  it('folds gear and the Wheel into one struct, in EITHER order', () => {
    // TWO FOLDS INTO ONE STRUCT, and neither may clear what the other owns.
    // BOTH orders are asserted because main.ts runs them one way and the hub
    // the other — checking a single order left a mutation that reset the
    // Wheel's fields inside the gear fold completely invisible.
    const worn = wearing([{ kind: 'skillCost', amount: 1, skill: 'sink' }])
    const wheel = { current: 2 }

    const gearFirst = noTalents()
    foldGearSkills(worn, gearFirst)
    foldTalents(wheel, gearFirst)

    const wheelFirst = noTalents()
    foldTalents(wheel, wheelFirst)
    foldGearSkills(worn, wheelFirst)

    for (const boons of [gearFirst, wheelFirst]) {
      expect(boons.perSkill.get('sink')?.cost).toBe(-1)
      expect(boons.fill).toBeGreaterThan(1)
    }
    expect(gearFirst.fill).toBeCloseTo(wheelFirst.fill, 9)
  })
})
