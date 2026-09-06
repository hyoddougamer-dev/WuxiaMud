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
import type { Stats } from './loadout'
import { copyStats, MAX_HALF_ANGLE, STEP, GRANT, CRIT_EVERY, ECHO_DELAY } from './arts'

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
export function applySkills(base: Stats, bar: SkillBar, out: Stats): Stats {
  copyStats(base, out)
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
        // Clamped well below 1: a guard that could reach total immunity is a
        // skill that ends the game rather than helps you survive it.
        out.guard = Math.min(0.7, out.guard + p)
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
        out.orbitDamage = out.orbitDamage === 0 ? GRANT.orbitDamage : out.orbitDamage
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
        break
      case 'heal':
        out.healPerKill += p
        break
    }
  }
  return out
}
