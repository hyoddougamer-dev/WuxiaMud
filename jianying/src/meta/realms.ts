/**
 * The cultivation ladder — the spine of the permanent progression.
 *
 * A survivors-like normally throws everything away at death, and that is
 * precisely what made this game feel directionless: every run started and ended
 * at zero, so nothing you did on Tuesday existed on Wednesday. The ladder here
 * is the MMORPG half of the design. Your swordsman has a level that only ever
 * goes up, and five levels lift them into a new Realm with a name worth
 * reaching.
 *
 * Realms exist for legibility rather than for maths. "Level 14" tells a player
 * nothing about where they stand; "Foundation Establishment, 4 of 5" tells them
 * they are two thirds of the way through a named tier and can see the next one.
 * The stat effect of a level is identical whether or not it crosses a realm
 * boundary — the ceremony is the point.
 */

export interface Realm {
  /** Chinese name, used as the seal glyph. */
  readonly seal: string
  /** English name — the product language. */
  readonly name: string
  /** One line describing what this tier of cultivation means. */
  readonly blurb: string
}

/** Levels inside each realm. */
export const LEVELS_PER_REALM = 5

/**
 * Eight realms, forty levels. The last one keeps accepting levels forever —
 * running out of ladder would be worse than repeating its top rung.
 */
export const REALMS: readonly Realm[] = [
  {
    seal: '淬体',
    name: 'Body Tempering',
    blurb: 'Flesh hardened against the road.',
  },
  {
    seal: '炼气',
    name: 'Qi Refining',
    blurb: 'Breath gathered, and made to answer.',
  },
  {
    seal: '筑基',
    name: 'Foundation Building',
    blurb: 'A base laid that will not crack.',
  },
  {
    seal: '金丹',
    name: 'Golden Core',
    blurb: 'Qi condensed into a core of light.',
  },
  {
    seal: '元婴',
    name: 'Nascent Soul',
    blurb: 'A second self stirs behind the eyes.',
  },
  {
    seal: '化神',
    name: 'Spirit Severing',
    blurb: 'The mortal thread is cut, cleanly.',
  },
  {
    seal: '渡劫',
    name: 'Tribulation',
    blurb: 'Heaven takes notice, and objects.',
  },
  {
    seal: '剑仙',
    name: 'Sword Immortal',
    blurb: 'The blade and the hand are one thing.',
  },
] as const

/** Zero-based realm index for a level (level 1 is the first rung of realm 0). */
export function realmIndex(level: number): number {
  const raw = Math.floor((Math.max(1, level) - 1) / LEVELS_PER_REALM)
  return Math.min(REALMS.length - 1, raw)
}

export function realmOf(level: number): Realm {
  return REALMS[realmIndex(level)]!
}

/** Rung within the realm, 1-based, for display as "3 / 5". */
export function realmStep(level: number): number {
  if (realmIndex(level) === REALMS.length - 1) {
    // The top realm has no ceiling, so the step counts on past five rather than
    // wrapping back to 1 and implying a promotion that will never come.
    return Math.max(1, level) - (REALMS.length - 1) * LEVELS_PER_REALM
  }
  return ((Math.max(1, level) - 1) % LEVELS_PER_REALM) + 1
}

/** True when reaching `level` moved the character into a new realm. */
export function isRealmAdvance(level: number): boolean {
  return level > 1 && realmIndex(level) !== realmIndex(level - 1)
}
