/**
 * The kit, and the promise the hub's comparison sheet makes.
 *
 * The sheet says "Reach 118 → 134" before you equip a piece. That is a
 * prediction, and a prediction is only worth showing if it is the same
 * calculation the expedition will run — otherwise the player equips the piece
 * the sheet promised and the run does something else, which is worse than
 * showing nothing. These tests hold the prediction and the run to one answer.
 */
import { describe, expect, it } from 'vitest'
import { createCharacter } from '../src/meta/character'
import { kitOf } from '../src/meta/kit'
import { acquire, emptyInventory, equip, mintUid, unequip, type OwnedItem } from '../src/meta/inventory'
import { deriveStats } from '../src/sim/loadout'
import { rollAmount } from '../src/data/affixes'
import { SCHOOL_BY_ID } from '../src/meta/schools'
import type { Loadout } from '../src/data/techniques'
import type { Rarity } from '../src/data/rarity'

const EMPTY: Loadout = new Map()

/** `luck` moves the rolled amounts, so two copies of one base differ. */
const roll = (baseId: string, luck = 0.9, rarity: Rarity = 2, depth = 3): OwnedItem => ({
  uid: mintUid(baseId),
  baseId,
  rarity,
  affixes: [
    { kind: 'body', amount: rollAmount('body', depth, luck) },
    { kind: 'edge', amount: rollAmount('edge', depth, luck) },
  ],
  power: null,
  depth,
})

const withPack = (...entries: OwnedItem[]) => {
  const c = createCharacter('Test', 'garrison')
  c.inventory = emptyInventory()
  for (const e of entries) acquire(c.inventory, e)
  return c
}

describe('the kit', () => {
  it('falls back to the school blade, so a new swordsman is never unarmed', () => {
    const c = withPack()
    expect(kitOf(c).weapon.id).toBe(SCHOOL_BY_ID.get('garrison')!.weaponId)
  })

  it('takes the weapon from the equipped weapon, not from the school', () => {
    const blade = roll('w-feidao')
    const c = withPack(blade)
    expect(kitOf(c).weapon.id).toBe('great')
    equip(c.inventory, blade.uid)
    expect(kitOf(c).weapon.id).toBe('feidao')
  })

  it('keeps the weapon out of `worn`, because it contributes a class not lines', () => {
    const blade = roll('w-feidao')
    const robe = roll('r-plain')
    const c = withPack(blade, robe)
    equip(c.inventory, blade.uid)
    equip(c.inventory, robe.uid)
    const kit = kitOf(c)
    expect(kit.worn.map((e) => e.uid)).toEqual([robe.uid])
  })

  it('answers one slot differently when asked, leaving the rest alone', () => {
    const worn = roll('r-plain')
    const spare = roll('r-plain')
    const sleeves = roll('s-plain')
    const c = withPack(worn, spare, sleeves)
    equip(c.inventory, worn.uid)
    equip(c.inventory, sleeves.uid)

    const swapped = kitOf(c, { slot: 'robe', entry: spare })
    expect(swapped.worn.map((e) => e.uid).sort()).toEqual([sleeves.uid, spare.uid].sort())

    const off = kitOf(c, { slot: 'robe', entry: null })
    expect(off.worn.map((e) => e.uid)).toEqual([sleeves.uid])
  })
})

describe('what the comparison sheet promises', () => {
  /**
   * The load-bearing test. If the hub ever predicts by a different route than
   * the expedition builds, every row on the sheet becomes a lie — and the lie
   * is silent, because both halves keep working on their own.
   */
  it('predicts exactly the stats the run will have once the piece is worn', () => {
    const worn = roll('r-plain', 0.1)
    const better = roll('r-plain', 1)
    const c = withPack(worn, better)
    equip(c.inventory, worn.uid)

    const predicted = deriveStats(EMPTY, kitOf(c, { slot: 'robe', entry: better }))
    equip(c.inventory, better.uid)
    const actual = deriveStats(EMPTY, kitOf(c))

    expect(predicted).toEqual(actual)
    // And the prediction was not simply the sheet the player already had —
    // otherwise the equality above would hold for a broken kitOf that ignored
    // the swap entirely.
    expect(predicted.maxHp).toBeGreaterThan(
      deriveStats(EMPTY, kitOf(c, { slot: 'robe', entry: worn })).maxHp,
    )
  })

  it('predicts taking a piece off, which is the other half of the second tap', () => {
    const worn = roll('r-plain', 1)
    const c = withPack(worn)
    equip(c.inventory, worn.uid)

    const predicted = deriveStats(EMPTY, kitOf(c, { slot: 'robe', entry: null }))
    unequip(c.inventory, 'robe')
    expect(predicted).toEqual(deriveStats(EMPTY, kitOf(c)))
    // Bare is worse than robed, or the sheet is measuring nothing.
    expect(predicted.maxHp).toBeLessThan(
      deriveStats(EMPTY, kitOf(withPackWorn(worn))).maxHp,
    )
  })

  it('predicts a weapon swap, which changes the class and not only a number', () => {
    const daggers = roll('w-feidao')
    const c = withPack(daggers)
    const predicted = deriveStats(EMPTY, kitOf(c, { slot: 'weapon', entry: daggers }))
    equip(c.inventory, daggers.uid)
    expect(predicted).toEqual(deriveStats(EMPTY, kitOf(c)))
    // The zhanmadao and the daggers do not share a reach; a sheet that showed
    // the same row for both would be hiding the whole decision.
    expect(predicted.slashRange).not.toBe(deriveStats(EMPTY, kitOf(withPack())).slashRange)
  })
})

function withPackWorn(entry: OwnedItem) {
  const c = withPack(entry)
  equip(c.inventory, entry.uid)
  return c
}
