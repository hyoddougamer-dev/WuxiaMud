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
import { createBar, updateBar, applySkills, MANUAL_SLOT } from '../src/sim/skills'
import { SKILLS, SKILL_BY_ID, SLOTTED_SKILLS, skillPower, skillsFor } from '../src/data/skills'
import { noConditions } from '../src/sim/conditions'
import { deriveStats } from '../src/sim/loadout'
import type { Condition } from '../src/data/arts'

const EMPTY = new Map<string, number>()
const still = (): Record<Condition, boolean> => ({ ...noConditions(), still: true })

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

    const base = deriveStats(EMPTY)
    const out = deriveStats(EMPTY)
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
    const base = deriveStats(EMPTY)
    const out = deriveStats(EMPTY)
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
