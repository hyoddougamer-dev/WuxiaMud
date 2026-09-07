/**
 * Spending on the Wheel: what is legal, what it costs, and what it adds up to.
 *
 * Pure arithmetic over a record of ranks, with no DOM and no simulation in
 * sight — the same shape `character.ts` takes and for the same reason. Every
 * rule about what a player may take is checkable by a test rather than by
 * clicking around a radial menu hoping to find the one node that lets you skip
 * a gate.
 *
 * THE THREE RULES, and they are the whole system:
 *
 *   1. A node may be taken up to its rank cap, one point each.
 *   2. A ring opens once enough points sit INSIDE THAT ARM — see RING_GATE. The
 *      hub has no gate; it is where every wheel starts.
 *   3. A swordsman holds at most MAX_KEYSTONES of the four ring-3 nodes.
 *
 * Rule 3 is the one that makes this theorycrafting. Rules 1 and 2 only shape
 * the order you spend in; rule 3 is a door that closes.
 */
import {
  MAX_KEYSTONES,
  RING_GATE,
  TALENTS,
  TALENT_BY_ID,
  isKeystone,
  wheelPointsAt,
  type Arm,
  type Talent,
  type Wheel,
} from '../data/talents'
import type { Character } from './character'

/** Ranks taken in one node. */
export const ranksIn = (wheel: Wheel, id: string): number => Math.max(0, wheel[id] ?? 0)

/** Every point spent anywhere. */
export function pointsSpent(wheel: Wheel): number {
  let total = 0
  for (const talent of TALENTS) total += Math.min(ranksIn(wheel, talent.id), talent.ranks)
  return total
}

/** Points spent inside one arm. What the ring gates read. */
export function pointsInArm(wheel: Wheel, arm: Arm): number {
  let total = 0
  for (const talent of TALENTS) {
    if (talent.arm === arm) total += Math.min(ranksIn(wheel, talent.id), talent.ranks)
  }
  return total
}

/** Keystones held. At most MAX_KEYSTONES, and that is the whole build decision. */
export function keystonesHeld(wheel: Wheel): Talent[] {
  return TALENTS.filter((t) => isKeystone(t) && ranksIn(wheel, t.id) > 0)
}

/** Points a character has left to spend. */
export function pointsLeft(c: Character): number {
  return wheelPointsAt(c.level) - pointsSpent(c.wheel)
}

/**
 * How far out this arm is open, as the deepest ring the player may buy into.
 *
 * Ring 1 is always open on an arm; 2 needs RING_GATE points in it, 3 needs
 * twice that. The hub is ring 0 and never gated.
 */
export function openRing(wheel: Wheel, arm: Arm): number {
  if (arm === 'core') return 0
  const inArm = pointsInArm(wheel, arm)
  if (inArm >= RING_GATE * 2) return 3
  if (inArm >= RING_GATE) return 2
  return 1
}

/** Why a node cannot be taken right now, or null when it can. */
export type Refusal = 'maxed' | 'no-points' | 'ring-locked' | 'keystone-taken'

export function refusalFor(c: Character, id: string): Refusal | null {
  const talent = TALENT_BY_ID.get(id)
  if (!talent) return 'maxed'
  if (ranksIn(c.wheel, id) >= talent.ranks) return 'maxed'
  if (pointsLeft(c) <= 0) return 'no-points'
  if (talent.ring > openRing(c.wheel, talent.arm)) return 'ring-locked'
  // The door. Checked AFTER the ring gate so a player at the end of an arm is
  // told the useful thing — "you already hold one" — rather than being told to
  // spend more in an arm that would not let them take it anyway.
  if (isKeystone(talent) && keystonesHeld(c.wheel).length >= MAX_KEYSTONES) return 'keystone-taken'
  return null
}

export const canTake = (c: Character, id: string): boolean => refusalFor(c, id) === null

/**
 * Takes one rank, if the rules allow it. Returns whether anything changed.
 *
 * Mutates `c.wheel` rather than returning a new one, because the hub holds the
 * character and re-renders from it — the same convention the attribute screen
 * has always used.
 */
export function takeTalent(c: Character, id: string): boolean {
  if (!canTake(c, id)) return false
  c.wheel = { ...c.wheel, [id]: ranksIn(c.wheel, id) + 1 }
  return true
}

/**
 * Puts every point back.
 *
 * FREE, AND ALWAYS. There is no wiki for this game: the only way to find out
 * what Breaking the Ring does to a run is to take it and walk out. A respec
 * cost would make the interesting node the one nobody dares press, which is
 * the opposite of what a wheel is for.
 */
export function respec(c: Character): void {
  c.wheel = {}
}

/**
 * Drops ranks a save should not be holding.
 *
 * A wheel is a text file on a device, and a build that changes the tables
 * underneath it — a node deleted, a rank cap lowered, a gate moved — must not
 * leave a swordsman spending points on something that no longer exists or
 * holding two keystones. Rebuilt in the table's own order so the result is
 * deterministic rather than dependent on the order the save's keys happen to
 * be in.
 */
export function sanitiseWheel(raw: unknown, level: number): Wheel {
  const out: Wheel = {}
  if (typeof raw !== 'object' || raw === null) return out
  const record = raw as Record<string, unknown>
  const budget = wheelPointsAt(level)
  let spent = 0
  let keystones = 0
  for (const talent of TALENTS) {
    const asked = record[talent.id]
    if (typeof asked !== 'number' || !Number.isFinite(asked)) continue
    let want = Math.min(Math.max(0, Math.floor(asked)), talent.ranks)
    if (want <= 0) continue
    if (isKeystone(talent)) {
      if (keystones >= MAX_KEYSTONES) continue
      // A keystone the gate no longer reaches is dropped rather than kept: a
      // rule change the player can neither see nor undo is worse than a refund.
      if (talent.ring > openRing(out, talent.arm)) continue
      keystones++
    } else if (talent.ring > openRing(out, talent.arm)) {
      continue
    }
    want = Math.min(want, budget - spent)
    if (want <= 0) continue
    out[talent.id] = want
    spent += want
  }
  return out
}
