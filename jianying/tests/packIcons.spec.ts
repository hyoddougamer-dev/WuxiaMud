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
  PACK_WEAPON_ICON,
  itemIconSvg,
  PACK_CONDITION_ICON,
  PACK_CREDIT,
  packIconSvg,
  effectIconSvg,
  conditionIconSvg,
} from '../src/render/packIcons'
import { PACK_ICON_DATA } from '../src/render/packIconData'
import { ARTS, CONDITIONS } from '../src/data/arts'
import { SKILLS, SLOTTED_SKILLS, skillsFor } from '../src/data/skills'
import { WEAPONS } from '../src/data/weapons'
import { ITEMS } from '../src/data/items'

const icons = (iconSet as unknown as { icons: Record<string, unknown> }).icons

describe('pack icons', () => {
  /**
   * THE ONE THAT SHIPPED BROKEN. PACK_WEAPON_ICON was written for a six-weapon
   * roster and never updated when the roster became two, so 飞刀 — half of
   * every weapon that drops — mapped to nothing and drew an empty card. The
   * lookup fails silently, which is why a whole class of item went out with no
   * icon and nobody saw it.
   */
  it('draws a shape for every weapon in the roster', () => {
    for (const weapon of WEAPONS) {
      const name = PACK_WEAPON_ICON[weapon.id]
      expect(name, `no pack icon for the weapon style ${weapon.id}`).toBeTruthy()
      expect(PACK_ICON_DATA[name!], `${weapon.id} names a missing icon`).toBeTruthy()
    }
  })

  it('leaves no dead style in the weapon table', () => {
    // The other half of the same bug: entries for weapons that no longer exist
    // are what made the missing one hard to notice.
    const live = new Set(WEAPONS.map((w) => w.id))
    expect(Object.keys(PACK_WEAPON_ICON).filter((id) => !live.has(id))).toEqual([])
  })

  it('renders a non-empty icon for every item base the game can drop', () => {
    // itemIconSvg is what the pack, the reward screen and the ground drop all
    // call. An empty string from any of them is an item with no picture.
    for (const item of ITEMS) {
      expect(
        itemIconSvg(item.slot, item.styleId, 0x0d0d0d),
        `${item.id} draws no icon`,
      ).not.toBe('')
    }
  })

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

describe('every mark means one thing', () => {
  /**
   * NO TWO ENTRIES MAY DRAW THE SAME PICTURE, across all four maps.
   *
   * Compared by GEOMETRY rather than by name, because that is the failure that
   * actually happened: `damage` and the greatsword both named `broadsword`, and
   * `bolt` and the flying daggers both named `striking-arrows`. Two of them
   * were even defensible in isolation — a damage skill IS a heavy blade — and
   * the sum was a game where the same drawing meant "this skill hits harder" in
   * one place and "this is the weapon you are holding" in another.
   *
   * Names would have caught those two. Geometry also catches the version of it
   * where somebody picks two different names for one drawing, which is the way
   * this comes back.
   */
  it('never draws one glyph for two different things', () => {
    const entries: Array<[string, string]> = [
      ...Object.entries(PACK_ICON).map(([k, v]) => [`effect.${k}`, v] as [string, string]),
      ...Object.entries(PACK_CONDITION_ICON).map(([k, v]) => [`condition.${k}`, v] as [string, string]),
      ...Object.entries(PACK_SLOT_ICON).map(([k, v]) => [`slot.${k}`, v] as [string, string]),
      ...Object.entries(PACK_WEAPON_ICON).map(([k, v]) => [`weapon.${k}`, v] as [string, string]),
    ]
    const byShape = new Map<string, string[]>()
    for (const [who, name] of entries) {
      const svg = packIconSvg(name, 0)
      expect(svg, `${who} names "${name}", which draws nothing`).not.toBe('')
      const shape = svg.slice(svg.indexOf('>') + 1)
      byShape.set(shape, [...(byShape.get(shape) ?? []), `${who} (${name})`])
    }
    const clashes = [...byShape.values()].filter((list) => list.length > 1)
    expect(clashes.map((c) => c.join(' == ')), 'two things drawn the same').toEqual([])
  })

  /**
   * A PLAYER LOOKING AT ONE SCREEN SEES DISTINCT MARKS.
   *
   * The map-wide check above is the strong claim; this is the one a player
   * would actually notice failing. The 法 tab lists every skill a weapon can
   * slot, each with its effect's icon, all at once.
   */
  it('gives one weapon\'s whole skill list a distinct mark each', () => {
    for (const weapon of WEAPONS) {
      const roster = skillsFor(weapon.id)
      expect(roster.length).toBeGreaterThan(SLOTTED_SKILLS)
      const marks = roster.map((s) => PACK_ICON[s.effect])
      expect(new Set(marks).size, `${weapon.id}: ${marks.join(', ')}`).toBe(marks.length)
      const seals = roster.map((s) => s.seal)
      expect(new Set(seals).size, `${weapon.id}: ${seals.join(' ')}`).toBe(seals.length)
    }
  })

  it('draws a mark for every effect a skill can have', () => {
    // The effect vocabulary is wider than the roster uses. What must never
    // happen is a skill whose effect has no picture — it would render as a
    // blank square beside eight drawn ones and read as broken.
    for (const skill of SKILLS) {
      expect(effectIconSvg(skill.effect, 0), `${skill.name} (${skill.effect})`).not.toBe('')
    }
  })

  it('draws a mark for every posture a boost can name', () => {
    for (const skill of SKILLS) {
      expect(conditionIconSvg(skill.boost.when, 0), `${skill.name}`).not.toBe('')
    }
  })

  it('leaves no stale posture in the condition table', () => {
    // `peril` outlived the condition it named. A dead entry here is not inert:
    // the extractor carries its icon into the bundle, and the next person to
    // read the map counts five postures where the game has four.
    for (const id of Object.keys(PACK_CONDITION_ICON)) {
      expect(CONDITIONS.some((c) => c.id === id), `${id} is not a condition`).toBe(true)
    }
  })
})
