/**
 * The pack icon names must all be real, and cover everything.
 *
 * A misspelled name in `packIcons.ts` does not throw — the lookup returns
 * undefined and the tile renders empty, which reads on screen as "this art has
 * no icon" rather than as a bug. That is precisely the failure that survives a
 * casual look at the game and is caught here instead.
 *
 * It also pins the dependency's shape: if a future version of the set renames
 * or drops an icon, this fails on `npm update` rather than in a build.
 */
import { describe, expect, it } from 'vitest'
import iconSet from '@iconify-json/game-icons/icons.json' with { type: 'json' }
import { PACK_ICON, PACK_SLOT_ICON, PACK_CREDIT } from '../src/render/packIcons'
import { ARTS } from '../src/data/arts'

const icons = (iconSet as unknown as { icons: Record<string, unknown> }).icons

describe('pack icons', () => {
  it('names an icon for every effect an art actually uses', () => {
    for (const art of ARTS) {
      expect(PACK_ICON[art.effect], `${art.id} uses "${art.effect}" with no pack icon`).toBeTruthy()
    }
  })

  it('every named icon exists in the installed set', () => {
    for (const [effect, name] of Object.entries(PACK_ICON)) {
      expect(icons[name], `${effect} points at "${name}", which is not in the set`).toBeDefined()
    }
    for (const [slot, name] of Object.entries(PACK_SLOT_ICON)) {
      expect(icons[name], `slot ${slot} points at "${name}", which is not in the set`).toBeDefined()
    }
  })

  it('no two effects share an icon', () => {
    // Two effects drawn with one icon is the collision the whole exercise was
    // about, and it is the one kind a machine can check for a pack.
    const seen = new Map<string, string>()
    for (const [effect, name] of Object.entries(PACK_ICON)) {
      const first = seen.get(name)
      expect(first, `${effect} and ${first} both use "${name}"`).toBeUndefined()
      seen.set(name, effect)
    }
  })

  it('carries the attribution the licence requires', () => {
    // CC BY 3.0 is only free if the credit ships. Losing this string in a
    // refactor would quietly put the project out of licence.
    expect(PACK_CREDIT).toMatch(/game-icons\.net/)
    expect(PACK_CREDIT).toMatch(/CC BY 3\.0/)
  })
})
