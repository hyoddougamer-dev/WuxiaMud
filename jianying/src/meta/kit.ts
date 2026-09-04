/**
 * The kit a swordsman fights in — the one place it is assembled.
 *
 * This lived twice: once in main.ts, building what the expedition actually
 * runs on, and once in the hub, predicting what a piece would do if you put it
 * on. Two copies is exactly the bug a comparison sheet cannot survive. A sheet
 * that predicts by a different rule than the game applies is worse than no
 * sheet at all, because it is confidently wrong — the player equips the piece
 * the sheet promised, and the run does something else. One function, both
 * callers, and a test that holds them to it.
 */
import { schoolById } from './schools'
import { baseOf, equippedIn, type OwnedItem } from './inventory'
import { SLOTS, type Slot } from '../data/items'
import { weaponById } from '../data/weapons'
import type { Character } from './character'
import type { Kit } from '../sim/loadout'

/** One slot answered differently than the character currently has it. */
export interface Swap {
  slot: Slot
  /** The piece that would be in it — null for taking the slot's piece off. */
  entry: OwnedItem | null
}

/**
 * What `c` would fight with, optionally with one slot answered differently.
 *
 * The weapon is not in `worn`: its contribution is the WeaponClass, which is
 * how the blade decides the arts and the strike, not a set of rolled lines.
 * The school's blade stands in when no weapon is equipped, which is why a new
 * swordsman is never unarmed.
 */
export function kitOf(c: Character, swap?: Swap): Kit {
  const at = (s: Slot): OwnedItem | null =>
    swap && swap.slot === s ? swap.entry : equippedIn(c.inventory, s)
  const weaponEntry = at('weapon')
  const styleId = (weaponEntry ? baseOf(weaponEntry) : null)?.styleId
  return {
    spent: c.spent,
    weapon: weaponById(styleId ?? schoolById(c.origin).weaponId),
    worn: SLOTS.filter((s) => s !== 'weapon')
      .map(at)
      .filter((e): e is OwnedItem => e !== null),
  }
}
