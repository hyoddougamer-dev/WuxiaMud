/**
 * Skills at runtime: what is on cooldown, what is live, and what it does.
 *
 * THE SHAPE THIS REPLACES. `applyArts` walked a scroll every frame and asked,
 * for each art, whether the player's current posture matched its condition. An
 * art was therefore on or off by accident of movement, for exactly as long as
 * the accident lasted, and nothing on screen said which. There was no cast, no
 * cost, and no moment — so there was nothing to learn and nothing to decide.
 *
 * Here a skill is FIRED. It costs 势, it goes on cooldown, and it stays live for
 * its duration whatever the player does next. The posture no longer decides
 * whether it happens; it decides how much it PAYS, which is printed on the tile
 * (see data/skills.ts) and computed by one function shared with the screen.
 *
 * TWO FIRE THEMSELVES, ONE IS YOURS. Slots one and two cast the moment they are
 * ready and affordable, because a phone held in one hand cannot carry three
 * cooldowns of manual timing and a joystick. Slot three waits for the button.
 * That is the smallest arrangement that is still a decision: the auto pair set
 * the floor of a build, the third is the one you spend a full pool on at the
 * moment you choose.
 */
import { SKILL_BY_ID, SLOTTED_SKILLS, skillPower, type Skill } from '../data/skills'
import type { Condition } from '../data/arts'
import { spendShi, type Shi } from './shi'
import { NOVA_RADIUS, type Stats } from './loadout'
import { addMight, copyStats, MAX_HALF_ANGLE, STEP, GRANT, CRIT_EVERY, ECHO_DELAY } from './arts'

/** One slot on the bar. */
export interface Slot {
  skill: Skill | null
  /** Seconds until it can fire again. */
  cooling: number
  /** Seconds the effect has left. 0 when nothing is live. */
  live: number
  /** The power the effect was cast at, frozen at the moment of the cast. */
  cast: number
}

export interface SkillBar {
  readonly slots: Slot[]
}

export function createBar(ids: readonly (string | null)[] = []): SkillBar {
  const slots: Slot[] = []
  for (let i = 0; i < SLOTTED_SKILLS; i++) {
    const id = ids[i]
    slots.push({ skill: (id ? SKILL_BY_ID.get(id) : null) ?? null, cooling: 0, live: 0, cast: 0 })
  }
  return { slots }
}

/** The slot the player fires by hand. The last one; see the file's note. */
export const MANUAL_SLOT = SLOTTED_SKILLS - 1

/**
 * The most damage a guard skill may turn away.
 *
 * Well below total on purpose: a reduction that could reach immunity is a
 * skill that ends the game rather than one that helps you survive it. Shared
 * by the arithmetic and by the reading, so the tile cannot promise more than
 * the simulation applies.
 */
export const GUARD_CAP = 0.7

export interface CastReport {
  /** Slots that fired this frame, so the caller can sound and draw them. */
  fired: number[]
}

const NOTHING: CastReport = { fired: [] }

/**
 * Advances cooldowns and durations, and fires whatever should fire.
 *
 * `wantManual` is the button: true only on the frame it was pressed. A press
 * with the skill cooling or the pool short does nothing at all rather than
 * queueing — a queued cast on a phone fires at a moment the player has stopped
 * meaning, which reads as the game ignoring them and then acting on its own.
 */
export function updateBar(
  bar: SkillBar,
  shi: Shi,
  active: Record<Condition, boolean>,
  wantManual: boolean,
  dt: number,
): CastReport {
  let fired: number[] | null = null
  for (let i = 0; i < bar.slots.length; i++) {
    const slot = bar.slots[i]!
    if (slot.cooling > 0) slot.cooling = Math.max(0, slot.cooling - dt)
    if (slot.live > 0) slot.live = Math.max(0, slot.live - dt)
    const skill = slot.skill
    if (!skill || slot.cooling > 0) continue
    const wants = i === MANUAL_SLOT ? wantManual : true
    if (!wants) continue
    if (!spendShi(shi, skill.cost)) continue
    slot.cooling = skill.cooldown
    // FROZEN AT THE CAST. The posture that paid for it is the one you were in
    // when you fired, not the one you drift into afterwards — otherwise a
    // four-second buff would flicker in strength as the player moved, which is
    // both unreadable and impossible to plan around.
    slot.cast = skillPower(skill, active)
    slot.live = Math.max(dt, skill.duration)
    ;(fired ??= []).push(i)
  }
  return fired ? { fired } : NOTHING
}

/**
 * Folds every live skill into `out`.
 *
 * The switch is the same vocabulary sim/arts.ts has always applied, and the
 * constants are literally its constants — imported rather than copied, so the
 * two can never drift while both exist.
 */
export function applySkills(base: Stats, bar: SkillBar, out: Stats, runLevel = 1): Stats {
  copyStats(base, out)
  // 内力 folded in HERE rather than into `base`, and that is not tidiness. The
  // run's levels are a running total; adding them to the permanent block would
  // compound every time that block was recomputed — and the block IS recomputed
  // mid-run, every time a piece is put on. Folding them into the per-frame copy
  // makes double-counting impossible by construction rather than by everybody
  // remembering. See MIGHT in sim/arts.ts.
  addMight(out, runLevel)
  for (const slot of bar.slots) {
    const skill = slot.skill
    if (!skill || slot.live <= 0) continue
    const p = slot.cast
    switch (skill.effect) {
      case 'damage':
        out.slashDamage *= 1 + p
        break
      case 'rate':
        // Divided, not multiplied: this is an interval, so smaller is faster.
        out.slashInterval /= 1 + p
        break
      case 'range':
        out.slashRange *= 1 + p
        break
      case 'speed':
        out.moveSpeed *= 1 + p
        break
      case 'arc':
        out.slashHalfAngle = Math.min(MAX_HALF_ANGLE, out.slashHalfAngle * (1 + p))
        break
      case 'magnet':
        out.pickupRadius *= 1 + p
        break
      case 'guard':
        // `damageScale`, NOT `guard`, and the difference is the whole bug this
        // line shipped with. `stats.guard` is a POOL of hit points that absorbs
        // damage and regrows (see sim/combat.ts); `damageScale` is the
        // multiplier on what gets through. Written as `out.guard = min(0.7,
        // guard + p)` this took a shield of twenty-one points down to 0.7 —
        // a skill named Mountain that made you very slightly easier to kill,
        // reported by no screen and caught only by a test that compared the
        // number on the tile against the number that landed.
        //
        // Clamped well below total: a reduction that could reach immunity is a
        // skill that ends the game rather than one that helps you survive it.
        out.damageScale *= 1 - Math.min(GUARD_CAP, p)
        break
      case 'pierce':
        // Narrow AND long, which is the trade the throw is built on.
        out.slashHalfAngle *= Math.pow(STEP.pierceArc, 1 / p)
        out.slashRange *= 1 + STEP.pierceRange * p
        break
      case 'crit': {
        const every = CRIT_EVERY[Math.min(Math.round(p), CRIT_EVERY.length - 1)]!
        out.critEvery = out.critEvery === 0 ? every : Math.min(out.critEvery, every)
        break
      }
      case 'echo':
        out.echoDelay = ECHO_DELAY
        out.echoDamage += p
        break
      case 'orbit':
        out.orbitBlades += Math.round(p)
        if (out.orbitDamage === 0) out.orbitDamage = GRANT.orbitDamage
        break
      case 'bolt':
        out.boltInterval = out.boltInterval === 0
          ? GRANT.boltInterval / p
          : out.boltInterval / p
        out.boltDamage = out.boltDamage === 0 ? GRANT.boltDamage * p : out.boltDamage * p
        break
      case 'nova':
        out.novaDamage += GRANT.boltDamage * p
        // Fires once on the cast rather than on a cycle: the duration is 0, so
        // `live` lasts a single frame and this window is the burst itself.
        out.novaInterval = out.novaInterval === 0 ? 0.05 : out.novaInterval
        // deriveStats always supplies a radius, but a caller that assembled a
        // Stats by hand may not, and a shockwave of radius zero hits nothing.
        if (out.novaRadius <= 0) out.novaRadius = NOVA_RADIUS
        break
      case 'heal':
        out.healPerKill += p
        break
    }
  }
  return out
}

/**
 * What a skill does, in the unit a player can act on.
 *
 * ONE FUNCTION FOR ONE READING, and this is the third time this project has
 * had to learn the lesson. A skill's `power` is stored in whatever unit its
 * effect happens to use — 0.55 is 55% more damage, 3 is three blades, 1.2 is a
 * rate — and a screen that printed `power` raw put "2.0" and "+35%" and "1.2"
 * side by side under one heading. Three units wearing one hat is exactly how
 * the arts screen came to be called incomprehensible.
 *
 * So the conversion lives HERE, beside the switch in `applySkills` that does
 * the arithmetic, and every screen reads it. If the two ever disagree it will
 * be because somebody edited one of two adjacent functions, which is a mistake
 * you can see rather than one you have to hunt.
 *
 * @param boosted true to read the number as it lands while the posture holds.
 */
export function skillReading(skill: Skill, boosted = false): string {
  const p = boosted ? skill.power * (1 + skill.boost.extra) : skill.power
  const pct = (v: number): string => `${Math.round(v * 100)}%`
  switch (skill.effect) {
    case 'damage':
      return `+${pct(p)} damage`
    case 'rate':
      return `+${pct(p)} faster`
    case 'range':
      return `+${pct(p)} reach`
    case 'speed':
      return `+${pct(p)} speed`
    case 'arc':
      return `+${pct(p)} wider`
    case 'magnet':
      return `+${pct(p)} pickup`
    case 'echo':
      return `+${pct(p)} second blow`
    case 'heal':
      return `+${p.toFixed(1)} hp per kill`
    case 'guard':
      // Capped where applySkills caps it, so the tile cannot promise a
      // reduction the simulation refuses to apply.
      return `−${pct(Math.min(GUARD_CAP, p))} damage taken`
    case 'pierce':
      // The trade, both halves, because half of it is a cost. A player told
      // only "+70% reach" would rank this above the range skill and be wrong.
      return `+${pct(STEP.pierceRange * p)} reach, narrower`
    case 'crit':
      return `crit every ${CRIT_EVERY[Math.min(Math.round(p), CRIT_EVERY.length - 1)]}`
    case 'orbit':
      return `${Math.round(p)} blades`
    case 'bolt':
      return `a bolt every ${(GRANT.boltInterval / p).toFixed(1)}s`
    case 'nova':
      return `${Math.round(GRANT.boltDamage * p)} burst damage`
  }
}
