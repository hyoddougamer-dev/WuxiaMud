/**
 * Expedition depth — where the permanent progression is spent.
 *
 * Without this file the persistent character is a trap. Levels only ever add
 * power, the difficulty curve is a fixed function of elapsed time, so after a
 * dozen expeditions the opening minutes of every run would be a formality the
 * player sits through. That is the standard failure of bolting permanent
 * upgrades onto a survivors-like, and it is worth naming rather than
 * discovering later.
 *
 * The answer is the MMORPG one, because it is the right one: growing does not
 * make the same ground easier, it makes new ground survivable. Each realm opens
 * a deeper road with tougher enemies and a proportionally larger reward, and
 * the player chooses which to walk before setting out. Standing still on an easy
 * road stays possible — it simply pays less.
 */
import { depthReward } from './character'

export interface Road {
  /** Chinese name for the seal. */
  readonly seal: string
  readonly name: string
  /** One line, shown under the name on the hub's depth selector. */
  readonly blurb: string
}

export const ROADS: readonly Road[] = [
  { seal: '官道', name: 'The Post Road', blurb: 'Bandits and dust. Where every sword begins.' },
  { seal: '芦荡', name: 'The Reed Marsh', blurb: 'Footing you cannot trust, and more of them.' },
  { seal: '断崖', name: 'The Broken Cliff', blurb: 'Crossbows above, and nowhere to stand.' },
  { seal: '寒林', name: 'The Cold Forest', blurb: 'Iron monks keep this wood, and they do not tire.' },
  { seal: '鬼市', name: 'The Ghost Market', blurb: 'Paper effigies trade here, and come apart when cut.' },
  { seal: '关隘', name: 'The Pass', blurb: 'The warlord holds it. He has held it a long time.' },
  { seal: '云顶', name: 'The Cloud Summit', blurb: 'Thin air, and things that do not need it.' },
  { seal: '剑冢', name: 'The Sword Mound', blurb: 'Ten thousand blades, all of them buried.' },
] as const

export const MAX_DEPTH = ROADS.length

export function roadOf(depth: number): Road {
  return ROADS[Math.min(ROADS.length - 1, Math.max(0, depth - 1))]!
}

/**
 * Multiplier on enemy health at a given depth.
 *
 * Health rather than damage: a deeper road should ask for more sustained
 * cutting, not delete a player who misreads one charge. Damage scaling would
 * make depth a coin flip against the immunity window instead of a test.
 */
export function depthHealthScale(depth: number): number {
  return 1 + (Math.max(1, depth) - 1) * 0.38
}

/** Multiplier on the spawn rate. Gentler than health, since the pool has a ceiling. */
export function depthSpawnScale(depth: number): number {
  return 1 + (Math.max(1, depth) - 1) * 0.16
}

/** Clamps a stored depth to what the character has actually unlocked. */
export function clampDepth(depth: number, unlocked: number): number {
  return Math.max(1, Math.min(Math.min(MAX_DEPTH, unlocked), Math.floor(depth) || 1))
}

/** Reward multiplier, re-exported so the hub reads one module rather than two. */
export { depthReward }
