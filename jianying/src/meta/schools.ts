/**
 * Schools — the class choice, and the first question the game asks.
 *
 * The previous version of this file offered origins that granted three or four
 * attribute points. The verdict on it was blunt and correct: you could not feel
 * it. Three points is a rounding error against a level-five character, and a
 * choice you cannot feel in the first thirty seconds is not a choice, it is a
 * form field.
 *
 * So a school is a WEAPON first. Since the thumb is entirely spent on movement,
 * the shape of the automatic sweep — its reach, its arc, its rhythm — is the
 * whole of how the game plays, and swapping it swaps the game. A spear school
 * and a twin-blade school ask the player to stand in genuinely different
 * places from the opening second.
 *
 * The attribute points remain, but as flavour on top rather than as the point.
 * And nothing here is permanent: every weapon in the game can drop, so a school
 * is where you start, not what you are. That matters on the one screen where
 * the player knows least about the game.
 */
import type { AttributeId, Attributes } from './character'

export interface School {
  readonly id: string
  readonly seal: string
  readonly name: string
  /** One line of fiction. */
  readonly blurb: string
  /** Weapon id from data/weapons.ts. This is the real content of the choice. */
  readonly weaponId: string
  /** How the weapon plays, in the player's words. Quoted from the weapon. */
  readonly grants: Partial<Record<AttributeId, number>>
  /** Starting armour, as item ids. */
  readonly kit: readonly string[]
}

export const SCHOOLS: readonly School[] = [
  {
    id: 'mountain',
    seal: '山门',
    name: 'Mountain Sect',
    blurb: 'Twelve years of forms before they let you hold an edge. You are not fast, and you do not break.',
    weaponId: 'jian',
    grants: { body: 2, edge: 1 },
    kit: ['r-plain', 's-plain', 'h-topknot'],
  },
  {
    id: 'garrison',
    seal: '将门',
    name: 'Frontier Garrison',
    blurb: 'Raised where the line either holds or it does not. You were taught to swing through, not around.',
    weaponId: 'dao',
    grants: { body: 3 },
    kit: ['r-lamellar', 's-pauldron', 'h-bare'],
  },
  {
    id: 'wanderer',
    seal: '游侠',
    name: 'Wandering Blade',
    blurb: 'No master, no school, and a great many roads. Two edges, and no patience for a guard.',
    weaponId: 'twin',
    grants: { swift: 3 },
    kit: ['r-travelling', 's-bare', 'h-bare'],
  },
  {
    id: 'temple',
    seal: '道观',
    name: 'Temple Acolyte',
    blurb: 'Taught to move qi before you were taught to fight. The fan came later, and reluctantly.',
    weaponId: 'fan',
    grants: { spirit: 3 },
    kit: ['r-plain', 's-wide', 'h-crown'],
  },
  {
    id: 'watch',
    seal: '关隘',
    name: 'Pass Watch',
    blurb: 'A spear and a stretch of road nobody else wanted. You learned to keep everything at arm’s length.',
    weaponId: 'spear',
    grants: { edge: 2, swift: 1 },
    kit: ['r-travelling', 's-plain', 'h-hat'],
  },
] as const

export const SCHOOL_BY_ID = new Map(SCHOOLS.map((s) => [s.id, s]))

export const DEFAULT_SCHOOL = SCHOOLS[0]!

export function schoolById(id: string | undefined): School {
  return SCHOOL_BY_ID.get(id ?? '') ?? DEFAULT_SCHOOL
}

/** Applies a school's attribute grant onto a fresh spread. Never mutates. */
export function applySchool(school: School, spent: Attributes): Attributes {
  const out: Attributes = { ...spent }
  for (const [id, amount] of Object.entries(school.grants)) {
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
