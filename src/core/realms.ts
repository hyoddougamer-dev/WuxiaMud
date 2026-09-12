/** The nine realms. All nine are climbable; the ninth is where a life ends and a line begins. */
export interface Realm {
  readonly id: number
  readonly name: string
  readonly zh: string
  /** Qi required to break through *from* this realm to the next. */
  readonly cost: number
  /** Multiplier applied to base qi generation while in this realm. */
  readonly rate: number
}

/**
 * The top of the ladder. Was 7 while realms 8 and 9 were drawn but locked, which cut
 * the game off two rungs from its own ending and was most of why a measured climb
 * lasted seventeen days instead of a season.
 */
export const V1_CEILING = 9

/**
 * Cost is derived, not invented: cost = (seconds this realm should take) × (its rate).
 *
 * The first table was written by eye and a simulation of real play found the whole
 * climb lasted an afternoon — costs grew about 7× per realm while the rate grew 3.3×,
 * so the two nearly cancelled. The second was honest but short: seventeen measured
 * days, because the ladder stopped at seven. These are the times for all nine rungs,
 * and the shape is deliberate — the first four realms are a tutorial that fits in an
 * evening, and the last two are most of the game.
 *
 *   realm   1     2      3     4     5      6     7      8
 *   time    3m    15m    1h    5h    1.2d   4d    22d    90d
 *
 * The last two rungs have grown twice: from twelve and forty-five when 精通 and 奇遇
 * arrived, and again when 妖王 and 法寶 did. Each time for the same reason:
 * mastery roughly doubles a loadout over a life and encounters pay out on top of it,
 * and a measured climb had quietly fallen from fifty-five days to forty-six. New power
 * is paid for in the cost table, never by taking the power back out.
 *
 * That is about sixty-two days of gathering at a bare multiplier of one. Arts,
 * meridians and a line pull it well under that; bottlenecks push it back out. The
 * only number that means anything is what `npm run measure` reports.
 */
export const REALMS: readonly Realm[] = [
  { id: 1, name: 'Qi Refining',     zh: '練氣', cost: 1.8e2,  rate: 1 },
  { id: 2, name: 'Foundation',      zh: '築基', cost: 2.9e3,  rate: 3.2 },
  { id: 3, name: 'Golden Core',     zh: '金丹', cost: 3.6e4,  rate: 10 },
  { id: 4, name: 'Nascent Soul',    zh: '元嬰', cost: 5.9e5,  rate: 33 },
  { id: 5, name: 'Spirit Severing', zh: '化神', cost: 1.34e7, rate: 108 },
  { id: 6, name: 'Void Refining',   zh: '煉虛', cost: 1.57e8, rate: 350 },
  { id: 7, name: 'Unity',           zh: '合體', cost: 3.29e9, rate: 1150 },
  { id: 8, name: 'Great Vehicle',   zh: '大乘', cost: 5.02e10, rate: 3800 },
  { id: 9, name: 'Tribulation',     zh: '渡劫', cost: Infinity, rate: 12500 },
]

export function realm(id: number): Realm {
  return REALMS[Math.min(Math.max(id, 1), REALMS.length) - 1]
}

/**
 * 五行 The five phases, walked across nine realms.
 *
 * This was a nine-step ember ramp: nine shades of one orange, which made the ladder a
 * gradient rather than a journey — a screenshot of the eighth realm and one of the
 * second were the same picture at different brightnesses. The phases are the cosmology
 * the genre is actually built from, and spending the ramp on them costs nothing and
 * buys a climb you can see.
 *
 * Two realms to a phase and the ninth alone at the top, which is right both ways: the
 * eight climbable rungs pair off cleanly, and 渡劫 is the one realm that belongs to no
 * pair. Within a phase the first realm is its darker step and the second its brighter,
 * so the ladder still reads as a progression at a glance and never as two identical pips.
 */
export type Phase = 'wood' | 'fire' | 'earth' | 'metal' | 'water'

export const PHASE_NAME: Record<Phase, { name: string; zh: string }> = {
  wood:  { name: 'Wood',  zh: '木' },
  fire:  { name: 'Fire',  zh: '火' },
  earth: { name: 'Earth', zh: '土' },
  metal: { name: 'Metal', zh: '金' },
  water: { name: 'Water', zh: '水' },
}

/** Realm to phase. The one table this whole system rests on. */
export const PHASE_OF: readonly Phase[] = [
  'wood', 'wood', 'fire', 'fire', 'earth', 'earth', 'metal', 'metal', 'water',
]

export function phaseOf(id: number): Phase {
  return PHASE_OF[Math.min(Math.max(id, 1), PHASE_OF.length) - 1]
}

/**
 * The three steps a realm lights its artwork with.
 *
 * Deliberately all from one phase rather than from the realms two either side, which is
 * what the ramp used to do. With a nine-orange ladder that read fine; across phases it
 * meant a cultivator at the fourth realm glowed half fire and half wood, and the figure
 * looked broken rather than transitional.
 */
export function realmRamp(id: number): { lo: string; mid: string; hi: string } {
  const p = phaseOf(id)
  return { lo: `var(--${p}-lo)`, mid: `var(--${p}-mid)`, hi: `var(--${p}-hi)` }
}

/** Nine rungs, two to a phase: the darker step, then the brighter. */
export const REALM_COLOUR: readonly string[] = [
  'var(--wood-lo)',  'var(--wood-mid)',
  'var(--fire-lo)',  'var(--fire-mid)',
  'var(--earth-lo)', 'var(--earth-mid)',
  'var(--metal-lo)', 'var(--metal-mid)',
  'var(--water-mid)',
]

export function realmColour(id: number): string {
  return REALM_COLOUR[Math.min(Math.max(id, 1), REALM_COLOUR.length) - 1]
}
