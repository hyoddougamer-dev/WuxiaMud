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
import {
  PACK_ICON,
  PACK_SLOT_ICON,
  PACK_CREDIT,
  packIconSvg,
  effectIconSvg,
} from '../src/render/packIcons'
import { PACK_ICON_DATA } from '../src/render/packIconData'
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

  it('has extracted geometry for every name the game uses', () => {
    // The game does NOT import the 6.2 MB set — `tools/extractIcons.ts` copies
    // the two dozen icons it names into src/render/packIconData.ts, and that
    // file is committed. Renaming an icon without re-running the extractor
    // leaves a tile that renders EMPTY rather than throwing, which is exactly
    // the kind of failure that survives a casual look at the game.
    for (const [effect, name] of Object.entries(PACK_ICON)) {
      expect(PACK_ICON_DATA[name], `${effect} ("${name}") is not extracted — run tools/extractIcons.ts`)
        .toBeDefined()
    }
    for (const [slot, name] of Object.entries(PACK_SLOT_ICON)) {
      expect(PACK_ICON_DATA[name], `slot ${slot} ("${name}") is not extracted — run tools/extractIcons.ts`)
        .toBeDefined()
    }
  })

  it('renders an svg that carries the tint and the geometry', () => {
    const svg = effectIconSvg('guard', 0x0d0d0d, 0.5, 'art-icon')
    expect(svg).toContain('<svg')
    expect(svg).toContain('class="art-icon"')
    expect(svg).toContain('color="#0d0d0d"')
    expect(svg).toContain('opacity="0.5"')
    expect(svg).toContain('viewBox=')
    // An unknown name must not throw — the tile goes empty and the checks
    // above are what report it.
    expect(packIconSvg('no-such-icon', 0x000000)).toBe('')
  })

  it('carries the attribution the licence requires', () => {
    // CC BY 3.0 is only free if the credit ships. Losing this string in a
    // refactor would quietly put the project out of licence.
    expect(PACK_CREDIT).toMatch(/game-icons\.net/)
    expect(PACK_CREDIT).toMatch(/CC BY 3\.0/)
  })
})
