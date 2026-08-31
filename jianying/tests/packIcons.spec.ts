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
  PACK_CONDITION_ICON,
  PACK_CREDIT,
  packIconSvg,
  effectIconSvg,
  conditionIconSvg,
} from '../src/render/packIcons'
import { PACK_ICON_DATA } from '../src/render/packIconData'
import { ARTS, CONDITIONS } from '../src/data/arts'

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
    for (const [id, name] of Object.entries(PACK_CONDITION_ICON)) {
      expect(icons[name], `condition ${id} points at "${name}", which is not in the set`).toBeDefined()
    }
  })

  it('draws a picture for every condition, so no seal carries a mechanic alone', () => {
    // The rule this pins: a player who reads no Chinese must still be able to
    // learn what wakes an art. A missing entry here does not throw — the tile
    // silently falls back to being nothing but 静, which is the exact failure
    // the condition icons were added to remove.
    for (const cond of CONDITIONS) {
      const name = PACK_CONDITION_ICON[cond.id]
      expect(name, `${cond.id} (${cond.seal}) has no picture`).toBeTruthy()
      expect(PACK_ICON_DATA[name!], `${cond.id} ("${name}") is not extracted`).toBeDefined()
      expect(conditionIconSvg(cond.id, 0x000000)).toContain('<svg')
    }
    // And a condition icon must never be an effect icon: the strip shows both on
    // one tile, and the same mark twice reads as a duplicate rather than as two
    // facts.
    const effects = new Set(Object.values(PACK_ICON))
    for (const [id, name] of Object.entries(PACK_CONDITION_ICON)) {
      expect(effects.has(name), `${id} reuses the effect icon "${name}"`).toBe(false)
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
