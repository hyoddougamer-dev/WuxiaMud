/**
 * Where a swordsman came from — the choice made at character creation.
 *
 * An origin does two jobs, and the second matters more than the first.
 *
 * Mechanically it is a starting attribute spread: a few free points, so no two
 * characters open identically and the first expedition already feels like it
 * belongs to somebody.
 *
 * But its real job is to be the first thing the game ever asks. Dropping a
 * player straight into a management panel gives them a screen full of numbers
 * with no reason to care about any of them. Choosing where you trained, before
 * seeing a single stat, is what makes the swordsman yours — and a stat attached
 * to somebody yours is a stat worth reading.
 *
 * The spreads are deliberately small. An origin should colour the opening hour,
 * not decide the character: everything after level five swamps three free
 * points, and a starting choice that locked a build would be a trap laid on the
 * one screen where the player knows least.
 */
import type { AttributeId, Attributes } from './character'

export interface Origin {
  readonly id: string
  /** Chinese name, used as the seal. */
  readonly seal: string
  readonly name: string
  /** One line of fiction. This is what the player is actually choosing. */
  readonly blurb: string
  /** Free attribute points, applied once at creation. */
  readonly grants: Partial<Record<AttributeId, number>>
  /** How the grant reads in plain words, shown on the card. */
  readonly effect: string
}

export const ORIGINS: readonly Origin[] = [
  {
    id: 'sect',
    seal: '山门',
    name: 'Mountain Sect',
    blurb: 'Twelve years of forms before they let you hold an edge. You are not fast, and you do not break.',
    grants: { body: 2, edge: 1 },
    effect: 'Sturdier, and cuts a little deeper',
  },
  {
    id: 'wanderer',
    seal: '游侠',
    name: 'Wandering Blade',
    blurb: 'No master, no school, and a great many roads. Whatever you know, you learned the hard way.',
    grants: { swift: 3 },
    effect: 'Sweeps noticeably faster',
  },
  {
    id: 'temple',
    seal: '道观',
    name: 'Temple Acolyte',
    blurb: 'You were taught to move qi before you were taught to fight. The sword came later, and reluctantly.',
    grants: { spirit: 3 },
    effect: 'Arts strike harder and reach further',
  },
  {
    id: 'soldier',
    seal: '将门',
    name: "Soldier's Child",
    blurb: 'Raised in a garrison on the frontier. You have seen a line hold, and you have seen one break.',
    grants: { body: 4 },
    effect: 'Markedly more health',
  },
] as const

export const ORIGIN_BY_ID = new Map(ORIGINS.map((o) => [o.id, o]))

export const DEFAULT_ORIGIN = ORIGINS[0]!

/** Applies an origin's grant onto a fresh attribute spread. */
export function applyOrigin(origin: Origin, spent: Attributes): Attributes {
  const out: Attributes = { ...spent }
  for (const [id, amount] of Object.entries(origin.grants)) {
    out[id as AttributeId] += amount
  }
  return out
}

// --- names ---------------------------------------------------------------
// Offered as a roll rather than demanded as typing. A text field is the first
// thing a phone player meets, and forcing a keyboard open before the game has
// shown them anything is a bad trade — so the field is prefilled and there is a
// button that keeps giving new ones.

const SURNAMES = [
  'Bai', 'Chen', 'Duan', 'Fang', 'Gu', 'Han', 'Jiang', 'Li', 'Lin', 'Lu',
  'Mo', 'Qin', 'Shen', 'Song', 'Tang', 'Wei', 'Xiao', 'Ye', 'Yu', 'Zhao',
]

const GIVEN = [
  'Anzhi', 'Bingwen', 'Chunhua', 'Feiyan', 'Guiying', 'Hanxue', 'Jinlong',
  'Liuyun', 'Mingzhu', 'Qingfeng', 'Ruoxi', 'Shanyuan', 'Tianyi', 'Wanqing',
  'Xueyan', 'Yanran', 'Zhaoyi', 'Zilan',
]

/** A wuxia-flavoured name. `roll` is a 0..1 uniform. */
export function rollName(roll: () => number): string {
  const surname = SURNAMES[Math.floor(roll() * SURNAMES.length) % SURNAMES.length]!
  const given = GIVEN[Math.floor(roll() * GIVEN.length) % GIVEN.length]!
  return `${surname} ${given}`
}
