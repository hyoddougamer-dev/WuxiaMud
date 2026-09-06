/**
 * The new spine: a resource you can see, and skills you fire.
 *
 * The system this replaces failed in a way tests could not catch, because
 * everything it did was correct in isolation — the arts applied, the conditions
 * sensed, the momentum banked. What it lacked was a DECISION, and a suite full
 * of green unit tests said nothing about that. So these hold the properties a
 * player would notice going wrong: that the pool is spent and refilled by
 * moving, that a skill on cooldown does not fire however hard you press, that
 * the number on the tile is the number that lands, and that the posture pays
 * more without deciding whether anything happens at all.
 */
import { describe, expect, it } from 'vitest'
import { MAX_SHI, createShi, spendShi, updateShi } from '../src/sim/shi'
import { createBar, updateBar, applySkills, skillReading, MANUAL_SLOT } from '../src/sim/skills'
import {
  SKILLS,
  SKILL_BY_ID,
  SLOTTED_SKILLS,
  defaultBar,
  skillPower,
  skillsFor,
  type SkillEffect,
} from '../src/data/skills'
import { noConditions } from '../src/sim/conditions'
import { deriveStats } from '../src/sim/loadout'
import type { Condition } from '../src/data/arts'

const still = (): Record<Condition, boolean> => ({ ...noConditions(), still: true })
/** Only `which` holds, so a boost can be read against exactly its own posture. */
const posture = (which: Condition): Record<Condition, boolean> => ({
  ...noConditions(),
  [which]: true,
})

describe('势, the resource', () => {
  it('fills by moving and not at all by standing', () => {
    const shi = createShi()
    updateShi(shi, { pace: 0, turned: false }, 3)
    expect(shi.value).toBe(0)
    updateShi(shi, { pace: 1, turned: false }, 3)
    expect(shi.value).toBeGreaterThan(0)
  })

  it('fills in a few seconds of running, not in a minute and not instantly', () => {
    // A pool that fills instantly is not a resource, and one that takes a
    // minute is a resource nobody plays around. Literal bounds, measured.
    const shi = createShi()
    let t = 0
    while (shi.value < MAX_SHI && t < 60) {
      updateShi(shi, { pace: 1, turned: false }, 0.1)
      t += 0.1
    }
    expect(t).toBeGreaterThan(3)
    expect(t).toBeLessThan(12)
  })

  it('never banks past the ceiling, however long you run', () => {
    // TURNING OFF, and that is the point. Written with `turned: true` this
    // passed against a build whose FILL had no ceiling at all, because the turn
    // bonus clamps on its own line and put the value back every frame. The test
    // was green for a reason that had nothing to do with what it claimed.
    const shi = createShi()
    for (let i = 0; i < 600; i++) updateShi(shi, { pace: 1, turned: false }, 0.1)
    expect(shi.value).toBe(MAX_SHI)
  })

  it('never banks past the ceiling on turns either', () => {
    const shi = createShi()
    for (let i = 0; i < 600; i++) updateShi(shi, { pace: 0, turned: true }, 0.1)
    expect(shi.value).toBe(MAX_SHI)
  })

  it('spends whole points, all or nothing', () => {
    const shi = createShi()
    updateShi(shi, { pace: 1, turned: false }, 4)
    const before = shi.value
    expect(shi.ready).toBeGreaterThanOrEqual(1)
    // Asking for more than is banked changes nothing at all — a skill that
    // fired at half strength for want of a point would make its own tile lie.
    expect(spendShi(shi, MAX_SHI + 1)).toBe(false)
    expect(shi.value).toBe(before)
    expect(spendShi(shi, 1)).toBe(true)
    expect(shi.value).toBeCloseTo(before - 1, 6)
  })
})

describe('the bar', () => {
  const full = () => {
    const shi = createShi()
    shi.value = MAX_SHI
    return shi
  }

  it('fires the automatic slots the moment they are ready and affordable', () => {
    const bar = createBar(['sink', null, null])
    const report = updateBar(bar, full(), still(), false, 0.016)
    expect(report.fired).toEqual([0])
    expect(bar.slots[0]!.live).toBeGreaterThan(0)
  })

  it('leaves the manual slot alone until the button is pressed', () => {
    const ids = Array<string | null>(SLOTTED_SKILLS).fill(null)
    ids[MANUAL_SLOT] = 'onecut'
    const bar = createBar(ids)
    expect(updateBar(bar, full(), still(), false, 0.016).fired).toEqual([])
    expect(updateBar(bar, full(), still(), true, 0.016).fired).toEqual([MANUAL_SLOT])
  })

  it('will not fire on an empty pool, and does not queue the press', () => {
    const bar = createBar(['sink', null, null])
    const shi = createShi()
    expect(updateBar(bar, shi, still(), false, 0.016).fired).toEqual([])
    expect(bar.slots[0]!.live).toBe(0)
    // And the press is gone rather than remembered: a queued cast on a phone
    // fires at a moment the player has stopped meaning.
    shi.value = MAX_SHI
    expect(updateBar(bar, shi, still(), false, 0.016).fired).toEqual([0])
  })

  it('holds a skill down for its whole cooldown', () => {
    const bar = createBar(['sink', null, null])
    const shi = full()
    updateBar(bar, shi, still(), false, 0.016)
    const skill = SKILL_BY_ID.get('sink')!
    let fires = 0
    for (let t = 0; t < skill.cooldown - 0.2; t += 0.1) {
      shi.value = MAX_SHI
      fires += updateBar(bar, shi, still(), false, 0.1).fired.length
    }
    expect(fires).toBe(0)
    // And comes back once it has run out.
    for (let t = 0; t < 0.5; t += 0.1) {
      shi.value = MAX_SHI
      fires += updateBar(bar, shi, still(), false, 0.1).fired.length
    }
    expect(fires).toBe(1)
  })
})

describe('the posture pays, it does not decide', () => {
  it('fires whether or not the condition holds', () => {
    // The whole failure of the old system in one assertion: an ability that
    // only happens when you happen to be moving right is an ability the player
    // cannot plan, and cannot be taught.
    const bar = createBar(['sink', null, null])
    const shi = createShi()
    shi.value = MAX_SHI
    expect(updateBar(bar, shi, noConditions(), false, 0.016).fired).toEqual([0])
  })

  it('pays more when it does', () => {
    const sink = SKILL_BY_ID.get('sink')!
    const flat = skillPower(sink, noConditions())
    const boosted = skillPower(sink, still())
    expect(boosted).toBeGreaterThan(flat)
    expect(boosted).toBeCloseTo(sink.power * (1 + sink.boost.extra), 6)
  })

  it('lands the number the tile promised, frozen at the cast', () => {
    // One function decides both, so the screen and the simulation cannot
    // disagree — which is exactly how 神 came to scale the arts invisibly.
    const bar = createBar(['sink', null, null])
    const shi = createShi()
    shi.value = MAX_SHI
    updateBar(bar, shi, still(), false, 0.016)
    const sink = SKILL_BY_ID.get('sink')!
    expect(bar.slots[0]!.cast).toBeCloseTo(skillPower(sink, still()), 6)

    const base = deriveStats()
    const out = deriveStats()
    applySkills(base, bar, out)
    expect(out.slashDamage).toBeCloseTo(base.slashDamage * (1 + bar.slots[0]!.cast), 6)
  })

  it('stops applying once the duration is out', () => {
    const bar = createBar(['sink', null, null])
    const shi = createShi()
    shi.value = MAX_SHI
    updateBar(bar, shi, still(), false, 0.016)
    const sink = SKILL_BY_ID.get('sink')!
    for (let t = 0; t < sink.duration + 0.2; t += 0.1) updateBar(bar, shi, still(), false, 0.1)
    const base = deriveStats()
    const out = deriveStats()
    applySkills(base, bar, out)
    expect(out.slashDamage).toBeCloseTo(base.slashDamage, 6)
  })
})

describe('the roster', () => {
  it('gives every weapon a full bar to choose from, and more than three', () => {
    // Slotting three out of exactly three is not a decision.
    for (const weapon of ['great', 'feidao']) {
      expect(skillsFor(weapon).length).toBeGreaterThan(SLOTTED_SKILLS + 2)
    }
  })

  it('states a cost, a cooldown and a boost for every skill', () => {
    for (const s of SKILLS) {
      expect(s.cost, `${s.id} cost`).toBeGreaterThan(0)
      expect(s.cost, `${s.id} cost`).toBeLessThanOrEqual(MAX_SHI)
      expect(s.cooldown, `${s.id} cooldown`).toBeGreaterThan(0)
      expect(s.power, `${s.id} power`).toBeGreaterThan(0)
      expect(s.boost.extra, `${s.id} boost`).toBeGreaterThan(0)
    }
  })

  it('never costs more than a full pool, or nothing could ever fire it', () => {
    for (const s of SKILLS) expect(s.cost).toBeLessThanOrEqual(MAX_SHI)
  })
})

describe('what a skill says it does', () => {
  it('gives every skill a reading, and never a bare number', () => {
    // The failure this is written against is not a crash, it is a screen that
    // prints `power` raw: "2.0" for a thrust, "+35%" for a speed buff and
    // "1.2" for a rate, side by side under one heading. Every reading must
    // carry its own unit, so a row cannot be misread as another row's unit.
    for (const skill of SKILLS) {
      const text = skillReading(skill)
      expect(text.length).toBeGreaterThan(3)
      expect(/^[\d.]+$/.test(text)).toBe(false)
      // A unit, not just a figure: at least one letter after the number.
      expect(/[a-z]/.test(text)).toBe(true)
    }
  })

  it('reads the boost as a bigger number, in the same unit', () => {
    for (const skill of SKILLS) {
      const plain = skillReading(skill)
      const boosted = skillReading(skill, true)
      // The unit is whatever survives when the digits are stripped. It has to
      // be identical, or the boosted line is answering a different question
      // from the line above it.
      const unit = (t: string): string => t.replace(/[\d.]+/g, '')
      expect(unit(boosted)).toBe(unit(plain))
    }
  })

  it('turns away exactly what a guard skill claims, and never the shield', () => {
    // TWO CLAIMS, and the first is the one this caught. `stats.guard` is a POOL
    // of hit points that absorbs damage and regrows; `damageScale` is the
    // multiplier on what gets through. Written against `guard`, Mountain took a
    // shield of twenty-one points down to 0.7 — a defensive skill that made you
    // easier to kill, reported by no screen.
    const guards = SKILLS.filter((s) => s.effect === 'guard')
    expect(guards.length).toBeGreaterThan(0)
    for (const skill of guards) {
      const base = deriveStats()
      const out = deriveStats()
      const bar = createBar([skill.id])
      const shi = createShi()
      updateShi(shi, { pace: 1, turned: false }, 30)
      // Cast IN the posture the tile's boosted line quotes, or the test would
      // be comparing a boosted claim against an unboosted cast.
      updateBar(bar, shi, posture(skill.boost.when), false, 0.016)
      applySkills(base, bar, out)
      expect(out.guard).toBe(base.guard)
      // And the second: the number on the tile is the number that lands.
      const quoted = Number(/[\d.]+/.exec(skillReading(skill, true))![0]) / 100
      expect(1 - out.damageScale / base.damageScale).toBeCloseTo(quoted, 6)
    }
  })

  it('never leaves a granted shockwave with no radius', () => {
    // deriveStats supplies one, but a caller assembling Stats by hand may not,
    // and a burst of radius zero hits nothing while every other number says it
    // worked. Checked through a hand-built sheet on purpose.
    const base = { ...deriveStats(), novaRadius: 0 }
    const out = deriveStats()
    const nova = SKILLS.find((s) => s.effect === 'nova')!
    const bar = createBar([nova.id])
    const shi = createShi()
    updateShi(shi, { pace: 1, turned: false }, 30)
    updateBar(bar, shi, still(), false, 0.016)
    applySkills(base, bar, out)
    expect(out.novaDamage).toBeGreaterThan(0)
    expect(out.novaRadius).toBeGreaterThan(0)
  })
})

describe('the bar a swordsman starts with', () => {
  it('gives every weapon exactly the slots the bar has', () => {
    for (const weaponId of ['great', 'feidao']) {
      const ids = defaultBar(weaponId)
      expect(ids).toHaveLength(SLOTTED_SKILLS)
      expect(new Set(ids).size).toBe(SLOTTED_SKILLS)
      // Slottable by this class, or the bar would offer a greatsword's
      // techniques to somebody holding knives.
      const allowed = new Set(skillsFor(weaponId).map((s) => s.id))
      for (const id of ids) expect(allowed.has(id)).toBe(true)
    }
  })

  it('opens with a shape rather than two copies of one idea', () => {
    // The two auto slots must not both be offence. This is not taste: with 沉
    // and 裂 — damage and reach — tools/skillBalance.mts read the greatsword's
    // whole bar as worth +3% survival to a pilot that plants its feet, against
    // +26% to one that circles. A default nobody edits has to hold a floor.
    const DEFENSIVE = new Set<SkillEffect>(['guard', 'speed', 'heal'])
    for (const weaponId of ['great', 'feidao']) {
      const autos = defaultBar(weaponId)
        .slice(0, MANUAL_SLOT)
        .map((id) => SKILL_BY_ID.get(id)!)
      expect(autos.some((s) => DEFENSIVE.has(s.effect))).toBe(true)
      expect(autos.some((s) => !DEFENSIVE.has(s.effect))).toBe(true)
    }
  })

  it('puts a skill worth a full pool in the manual slot', () => {
    // The manual slot is the only decision the system has, and a decision
    // about a one-点 skill is not much of one.
    for (const weaponId of ['great', 'feidao']) {
      const manual = SKILL_BY_ID.get(defaultBar(weaponId)[MANUAL_SLOT]!)!
      const autos = defaultBar(weaponId)
        .slice(0, MANUAL_SLOT)
        .map((id) => SKILL_BY_ID.get(id)!)
      expect(manual.cost).toBeGreaterThanOrEqual(Math.max(...autos.map((s) => s.cost)))
      // And the pair has to be affordable back to back out of a full pool, or
      // the opening of every run is a wait.
      expect(autos.reduce((n, s) => n + s.cost, 0)).toBeLessThanOrEqual(MAX_SHI)
    }
  })
})
