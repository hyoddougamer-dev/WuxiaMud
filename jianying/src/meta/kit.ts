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
import { SLOTTED_SKILLS, defaultBar } from '../data/skills'
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
 * THE WEAPON IS IN `worn` NOW, and it was not for a long time. The reasoning
 * was that a blade's contribution is its WeaponClass — reach, arc, rhythm — and
 * not a set of rolled lines. But a weapon rolls lines like everything else, and
 * the item sheet has always printed them: so a 珍 sword reading "+11 Edge" gave
 * nothing at all, and the screen said otherwise. Dead text on a card is the
 * class of lie this project keeps having to dig out.
 *
 * Caught by the harness, on the day the skill affixes landed: a fixture wearing
 * a greatsword whose lines NAMED two of its own class's skills produced no
 * answer on the 法 screen, because the weapon never reached the fold.
 *
 * The class still comes from `weapon`; `worn` is only where the lines live. The
 * school's blade stands in when no weapon is equipped, which is why a new
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
    worn: SLOTS.map(at).filter((e): e is OwnedItem => e !== null),
  }
}

/**
 * The three skills `c` takes out with `weaponId` in hand.
 *
 * ONE FUNCTION, BOTH CALLERS, for exactly the reason `kitOf` above is one
 * function: the hub draws this list and the expedition runs on it, and a screen
 * that promises a bar the run does not use is worse than no screen at all.
 *
 * A weapon the player has never edited falls back to `defaultBar`, so a fresh
 * swordsman — and a save written before any of this existed — still walks out
 * with a build rather than an empty strip. A player who has deliberately
 * emptied a slot keeps it empty: the fallback applies to "never chosen", not to
 * "chose fewer", and telling those apart is the whole reason this reads the
 * record rather than counting entries.
 */
export function barFor(c: Character, weaponId: string): string[] {
  const chosen = c.skills[weaponId]
  return chosen ? chosen.slice(0, SLOTTED_SKILLS) : defaultBar(weaponId)
}
