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
import { barFor, kitOf } from '../src/meta/kit'
import { acquire, emptyInventory, equip, mintUid, unequip, type OwnedItem } from '../src/meta/inventory'
import { deriveStats } from '../src/sim/loadout'
import { rollAmount } from '../src/data/affixes'
import { SLOTTED_SKILLS, defaultBar } from '../src/data/skills'
import { parseCharacter, serialiseCharacter } from '../src/meta/save'
import { SCHOOL_BY_ID } from '../src/meta/schools'
import type { Rarity } from '../src/data/rarity'


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

  it('puts the weapon in `worn` too, so its rolled lines are not dead text', () => {
    // THIS TEST SAID THE OPPOSITE, and the opposite shipped. The weapon was
    // kept out of `worn` on the reasoning that a blade contributes a CLASS —
    // reach, arc, rhythm — rather than lines. But a weapon rolls lines like
    // everything else and the item sheet has always printed them, so a 珍 sword
    // reading "+11 Edge" gave nothing at all while the screen said otherwise.
    // Caught by the harness the day skill affixes landed: a fixture wearing a
    // greatsword whose lines NAMED two of its own skills produced no answer on
    // the 法 screen, because the weapon never reached the fold.
    const blade = roll('w-feidao')
    const robe = roll('r-plain')
    const c = withPack(blade, robe)
    equip(c.inventory, blade.uid)
    equip(c.inventory, robe.uid)
    const kit = kitOf(c)
    expect(kit.worn.map((e) => e.uid).sort()).toEqual([blade.uid, robe.uid].sort())
    // And the class still comes from the blade, not from the lines.
    expect(kit.weapon.id).toBe('feidao')
  })

  it('lets a weapon\'s lines reach the numbers, like every other piece', () => {
    const plain = createCharacter()
    const armed = createCharacter()
    const blade = roll('w-feidao')
    armed.inventory = withPack(blade).inventory
    equip(armed.inventory, blade.uid)
    // Same weapon class either way — the school's default IS the flying
    // daggers here — so any difference can only be the rolled lines.
    expect(kitOf(armed).weapon.id).toBe(kitOf(armed).weapon.id)
    const before = deriveStats({ ...kitOf(plain), weapon: kitOf(armed).weapon })
    const after = deriveStats(kitOf(armed))
    expect(after.slashDamage + after.maxHp).toBeGreaterThan(before.slashDamage + before.maxHp)
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

    const predicted = deriveStats(kitOf(c, { slot: 'robe', entry: better }))
    equip(c.inventory, better.uid)
    const actual = deriveStats(kitOf(c))

    expect(predicted).toEqual(actual)
    // And the prediction was not simply the sheet the player already had —
    // otherwise the equality above would hold for a broken kitOf that ignored
    // the swap entirely.
    expect(predicted.maxHp).toBeGreaterThan(
      deriveStats(kitOf(c, { slot: 'robe', entry: worn })).maxHp,
    )
  })

  it('predicts taking a piece off, which is the other half of the second tap', () => {
    const worn = roll('r-plain', 1)
    const c = withPack(worn)
    equip(c.inventory, worn.uid)

    const predicted = deriveStats(kitOf(c, { slot: 'robe', entry: null }))
    unequip(c.inventory, 'robe')
    expect(predicted).toEqual(deriveStats(kitOf(c)))
    // Bare is worse than robed, or the sheet is measuring nothing.
    expect(predicted.maxHp).toBeLessThan(
      deriveStats(kitOf(withPackWorn(worn))).maxHp,
    )
  })

  it('predicts a weapon swap, which changes the class and not only a number', () => {
    const daggers = roll('w-feidao')
    const c = withPack(daggers)
    const predicted = deriveStats(kitOf(c, { slot: 'weapon', entry: daggers }))
    equip(c.inventory, daggers.uid)
    expect(predicted).toEqual(deriveStats(kitOf(c)))
    // The zhanmadao and the daggers do not share a reach; a sheet that showed
    // the same row for both would be hiding the whole decision.
    expect(predicted.slashRange).not.toBe(deriveStats(kitOf(withPack())).slashRange)
  })
})

function withPackWorn(entry: OwnedItem) {
  const c = withPack(entry)
  equip(c.inventory, entry.uid)
  return c
}

describe('the bar a swordsman actually walks out with', () => {
  /**
   * ONE FUNCTION, BOTH CALLERS, for the same reason `kitOf` is one function:
   * the hub's 法 screen draws this list and the expedition runs on it. A screen
   * that promises a bar the run does not use is worse than no screen at all.
   */
  it('falls back to the default for a weapon never edited', () => {
    const c = createCharacter()
    expect(c.skills).toEqual({})
    expect(barFor(c, 'great')).toEqual(defaultBar('great'))
    expect(barFor(c, 'feidao')).toEqual(defaultBar('feidao'))
  })

  it('keeps a bar the player deliberately emptied', () => {
    // "Never chosen" and "chose fewer" are different states and the fallback
    // applies only to the first. Collapsing them would make a slot impossible
    // to leave empty: the game would helpfully refill it every time the hub
    // re-rendered, which reads as the screen ignoring you.
    const c = createCharacter()
    c.skills = { great: ['sink'] }
    expect(barFor(c, 'great')).toEqual(['sink'])
    const emptied = createCharacter()
    emptied.skills = { great: [] }
    expect(barFor(emptied, 'great')).toEqual([])
  })

  it('never hands back more slots than the bar has', () => {
    const c = createCharacter()
    c.skills = { great: ['sink', 'rend', 'mountain', 'grind', 'onecut'] }
    expect(barFor(c, 'great')).toHaveLength(SLOTTED_SKILLS)
  })

  it('keeps each weapon its own bar', () => {
    // Picking up flying daggers is picking up a different way to fight, and the
    // three chosen for the greatsword mean nothing while holding knives.
    const c = createCharacter()
    c.skills = { great: ['sink'] }
    expect(barFor(c, 'great')).toEqual(['sink'])
    expect(barFor(c, 'feidao')).toEqual(defaultBar('feidao'))
  })
})

describe('the bar survives being written to disk', () => {
  it('round-trips exactly, order included', () => {
    // The order is half the choice — the last slot is the one with a button on
    // it — so a save that kept the SET and lost the ORDER would quietly move
    // which skill the player fires by hand.
    const c = createCharacter()
    c.skills = { great: ['guardian', 'sink', 'mountain'] }
    const back = parseCharacter(serialiseCharacter(c))!
    expect(back.skills.great).toEqual(['guardian', 'sink', 'mountain'])
  })

  it('drops a skill the weapon cannot slot', () => {
    // A save is a text file on a device. A greatsword technique on a knife
    // thrower's bar would sit there doing nothing anybody could explain.
    const c = createCharacter()
    const raw = JSON.stringify({ ...c, skills: { feidao: ['steady', 'sink', 'shadow'] } })
    expect(parseCharacter(raw)!.skills.feidao).toEqual(['steady', 'shadow'])
  })

  it('drops duplicates, unknown ids and unknown weapons', () => {
    const c = createCharacter()
    const raw = JSON.stringify({
      ...c,
      skills: { great: ['sink', 'sink', 'nosuchskill', 'rend'], nosuchweapon: ['sink'] },
    })
    const back = parseCharacter(raw)!
    expect(back.skills.great).toEqual(['sink', 'rend'])
    expect(back.skills.nosuchweapon).toBeUndefined()
  })

  it('opens a save from the arts era on the default bar', () => {
    // `arts` is deliberately not read. The ids do not even mean the same
    // things, and folding an art ranking into a skill bar would hand some saves
    // a build nothing on screen could explain.
    const c = createCharacter()
    const raw = JSON.stringify({ ...c, arts: { great: ['mountain', 'onecut'] }, skills: undefined })
    const back = parseCharacter(raw)!
    expect(back.skills).toEqual({})
    expect(barFor(back, 'great')).toEqual(defaultBar('great'))
  })
})
