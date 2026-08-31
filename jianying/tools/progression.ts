/**
 * Gear progression, as a single sheet.
 *
 *   npx tsx tools/progression.ts
 *
 * This is a mockup only in the sense that nobody has played through it yet.
 * Every figure on it is built by the game's own geometry from the game's own
 * item table — `buildSwordsmanTopDown` with the wardrobe styles the real drop
 * tables hand over — so it is a rendering of what the game already does, not an
 * illustration of what somebody hopes it will do. If a row here looks wrong,
 * the game is wrong, and that is exactly what makes the sheet worth having.
 *
 * It answers three questions in order, and they are the three that decide
 * whether "all items are visually different" was a real claim or a slogan:
 *
 *   1. Does the swordsman visibly change as they walk the world?
 *   2. Does each SLOT carry its own readable change, or does one dominate?
 *   3. Does the school you pick still show at the end of the road?
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildBlade, buildSwordsmanTopDown } from '../src/render/figure'
import { strokeToPolygon } from '../src/render/silhouette'
import { palette } from '../src/render/palette'
import { DEFAULT_GEAR, gearFromIds, type Gear } from '../src/render/wardrobe'
import { REGIONS } from '../src/data/regions'
import { ITEMS, ITEM_BY_ID, type Item, type Slot } from '../src/data/items'
import { SCHOOLS } from '../src/meta/schools'
import { BUILDS, DEFAULT_LOOK } from '../src/meta/look'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
// docs/, not shots/. The screenshot harness writes throwaway output to shots/
// and that directory is gitignored; this sheet is a document meant to be opened
// on a phone from GitHub, so it has to be committed.
const OUT = join(ROOT, 'docs')

const W = 1180
const hex = (c: number): string => `#${c.toString(16).padStart(6, '0')}`

const BLADE_ANGLE = 56

/**
 * One figure, with the blade held at its side, plus how far it actually reaches.
 *
 * The bounds are the point. A long spear at this angle extends far past the
 * feet, and the first version of this sheet placed every label at a fixed
 * offset — so the spear and the zhanmadao ran their tips straight through the
 * captions. Measuring what was drawn and putting the label below THAT is the
 * only version that stays correct when a longer weapon is added later.
 */
function figure(
  gear: Gear,
  seed: number,
  scale: number,
  build = 1,
): { markup: string; bottom: number; right: number } {
  const swordsman = buildSwordsmanTopDown(seed, scale, gear, build)
  const parts: string[] = []
  let bottom = 6 * scale
  let right = 12 * scale * build

  parts.push(
    `<ellipse cx="0" cy="${2 * scale}" rx="${11 * scale * build}" ry="${3.4 * scale}" fill="${hex(palette.ink)}" fill-opacity="0.1"/>`,
  )

  // The blade is rotated by the group transform, so its reach has to be worked
  // out in the rotated frame rather than read off the raw polygons.
  const rad = (BLADE_ANGLE * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const originX = 8 * scale * build
  const originY = -26 * scale
  const blade = buildBlade(seed + 1, scale, gear.blade)
  for (const stroke of blade) {
    for (let i = 0; i < stroke.poly.length; i += 2) {
      const px = stroke.poly[i]!
      const py = stroke.poly[i + 1]!
      bottom = Math.max(bottom, originY + px * sin + py * cos)
      right = Math.max(right, originX + px * cos - py * sin)
    }
  }
  parts.push(
    `<g transform="translate(${originX},${originY}) rotate(${BLADE_ANGLE})">` +
      blade.map((s) => strokeToPolygon(s, palette.ink)).join('') +
      `</g>`,
  )

  for (const strokes of [swordsman.bleed, swordsman.body]) {
    for (const stroke of strokes) {
      parts.push(strokeToPolygon(stroke, palette.ink))
      for (let i = 0; i < stroke.poly.length; i += 2) {
        bottom = Math.max(bottom, stroke.poly[i + 1]!)
        right = Math.max(right, stroke.poly[i]!)
      }
    }
  }
  return { markup: parts.join(''), bottom, right }
}

/** The best item a set of ids offers in each slot, as wardrobe styles. */
function gearOf(ids: readonly string[]): Gear {
  const best = new Map<Slot, Item>()
  for (const id of ids) {
    const item = ITEM_BY_ID.get(id)
    if (!item) continue
    const held = best.get(item.slot)
    if (!held || item.depth > held.depth) best.set(item.slot, item)
  }
  return gearFromIds({
    robe: best.get('robe')?.styleId,
    shoulders: best.get('shoulders')?.styleId,
    head: best.get('head')?.styleId,
    blade: best.get('weapon')?.styleId,
  })
}

/**
 * Where to put column `i` so that nothing runs off the right edge.
 *
 * A held spear reaches much further to the side than the figure does, and the
 * first version divided the width evenly and clipped the last one's tip against
 * the edge of the sheet. The row is laid out inside a width reduced by the
 * widest reach in that row, measured rather than guessed, so adding a longer
 * weapon later cannot silently reintroduce the clipping.
 */
function columns(count: number, reach: number): { x: (i: number) => number } {
  const usable = W - 80 - reach
  const step = usable / count
  return { x: (i: number) => 40 + step * (i + 0.5) }
}

function label(x: number, y: number, text: string, size: number, colour: string, weight = 400): string {
  return (
    `<text x="${x}" y="${y}" text-anchor="middle" font-family="system-ui, sans-serif" ` +
    `font-size="${size}" font-weight="${weight}" fill="${colour}">${text}</text>`
  )
}

function heading(y: number, seal: string, text: string, note: string): string {
  return (
    `<text x="40" y="${y}" font-family="system-ui, sans-serif" font-size="26" fill="${hex(palette.cinnabar)}">${seal}</text>` +
    `<text x="80" y="${y}" font-family="system-ui, sans-serif" font-size="21" fill="${hex(palette.ink)}">${text}</text>` +
    `<text x="40" y="${y + 24}" font-family="system-ui, sans-serif" font-size="13" fill="${hex(palette.ink)}" fill-opacity="0.55">${note}</text>`
  )
}

const rows: string[] = []
let y = 0

// --- 1. the road ---------------------------------------------------------
// The swordsman as they would look walking INTO each place, carrying the best
// of what everything before it dropped. This is the sheet's headline claim.
y += 64
rows.push(
  heading(
    y,
    '一',
    'The road, walked',
    'The same swordsman entering each region, wearing the best of what every earlier region dropped.',
  ),
)
y += 70

{
  const base = y + 200
  const stages: Array<{ seal: string; name: string; ids: string[] }> = [
    { seal: '始', name: 'Mountain Sect', ids: [...SCHOOLS[0]!.kit, 'w-jian'] },
  ]
  const carried = [...stages[0]!.ids]
  for (const region of REGIONS) {
    carried.push(...region.drops)
    stages.push({ seal: region.seal, name: region.name, ids: [...carried] })
  }

  // One caption line for every stage, aligned across the row, so the reader
  // compares figures rather than following six different baselines.
  const drawn = stages.map((stage, i) => figure(gearOf(stage.ids), 7 + i, 2.9))
  const capTop = base + Math.max(...drawn.map((d) => d.bottom)) + 22
  const grid = columns(stages.length, Math.max(...drawn.map((d) => d.right)))

  stages.forEach((stage, i) => {
    const x = grid.x(i)
    rows.push(`<g transform="translate(${x},${base})">${drawn[i]!.markup}</g>`)
    rows.push(label(x, capTop, stage.seal, 17, hex(palette.cinnabar)))
    rows.push(label(x, capTop + 20, stage.name, 12, `${hex(palette.ink)}" fill-opacity="0.6`))
    // What that step actually added, so a difference in the silhouette can be
    // traced to a specific find rather than admired vaguely.
    const gained = i === 0 ? [] : REGIONS[i - 1]!.drops
    gained.slice(0, 5).forEach((id, k) => {
      const item = ITEM_BY_ID.get(id)
      if (!item) return
      rows.push(
        label(x, capTop + 40 + k * 15, item.name, 10.5, `${hex(palette.ink)}" fill-opacity="0.4`),
      )
    })
  })
  y = capTop + 130
}

// --- 2. slot by slot -----------------------------------------------------
y += 44
rows.push(
  heading(
    y,
    '二',
    'One slot at a time',
    'Each row varies a single slot against an otherwise unchanged swordsman, so any difference belongs to that slot alone.',
  ),
)
y += 60

for (const slot of ['robe', 'shoulders', 'head', 'weapon'] as const) {
  const items = ITEMS.filter((item) => item.slot === slot)
  const base = y + 132
  rows.push(
    `<text x="40" y="${y + 16}" font-family="system-ui, sans-serif" font-size="12" ` +
      `letter-spacing="1.6" fill="${hex(palette.ink)}" fill-opacity="0.45">${slot.toUpperCase()}</text>`,
  )
  const cells = items.map((item, i) =>
    figure(
      // Every slot but the one under test is held at its default, so any
      // difference in the row is attributable to that slot alone.
      gearFromIds({
        robe: slot === 'robe' ? item.styleId : DEFAULT_GEAR.robe.id,
        shoulders: slot === 'shoulders' ? item.styleId : DEFAULT_GEAR.shoulders.id,
        head: slot === 'head' ? item.styleId : DEFAULT_GEAR.head.id,
        blade: slot === 'weapon' ? item.styleId : DEFAULT_GEAR.blade.id,
      }),
      11 + i,
      2.0,
    ),
  )
  const capY = base + Math.max(...cells.map((c) => c.bottom)) + 20
  const grid = columns(items.length, Math.max(...cells.map((c) => c.right)))
  items.forEach((item, i) => {
    const x = grid.x(i)
    rows.push(`<g transform="translate(${x},${base})">${cells[i]!.markup}</g>`)
    rows.push(label(x, capY, item.name, 11, `${hex(palette.ink)}" fill-opacity="0.6`))
  })
  y = capY + 34
}

// --- 3. the schools, fully geared ---------------------------------------
y += 44
rows.push(
  heading(
    y,
    '三',
    'Where you began still shows',
    'Every school at the end of the road, each carrying the weapon it trained with. The build is the one choice no drop can overwrite.',
  ),
)
y += 60

{
  const base = y + 190
  // Every school given the SAME endgame armour, so the only things that differ
  // are the weapon it trained with and the build chosen at creation. This is
  // the honest test of whether the opening choice still reads at the end, and
  // the sheet is where the answer shows up rather than in an argument.
  const endgameArmour = REGIONS.flatMap((r) => r.drops).filter(
    (id) => ITEM_BY_ID.get(id)?.slot !== 'weapon',
  )
  const armour = gearOf(endgameArmour)
  const cells = SCHOOLS.map((school, i) =>
    figure(
      { ...armour, blade: gearFromIds({ blade: school.weaponId }).blade },
      21 + i,
      2.7,
      BUILDS[i % BUILDS.length]!.width,
    ),
  )
  const capY = base + Math.max(...cells.map((c) => c.bottom)) + 24
  const grid = columns(SCHOOLS.length, Math.max(...cells.map((c) => c.right)))
  SCHOOLS.forEach((school, i) => {
    const x = grid.x(i)
    rows.push(`<g transform="translate(${x},${base})">${cells[i]!.markup}</g>`)
    rows.push(label(x, capY, school.seal, 16, hex(palette.cinnabar)))
    rows.push(label(x, capY + 19, school.name, 12, `${hex(palette.ink)}" fill-opacity="0.6`))
    rows.push(
      label(
        x,
        capY + 36,
        `${BUILDS[i % BUILDS.length]!.name} build`,
        10.5,
        `${hex(palette.ink)}" fill-opacity="0.4`,
      ),
    )
  })
  y = capY + 70
}

const H = y + 40
const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
  `<rect width="${W}" height="${H}" fill="${hex(palette.paper)}"/>` +
  `<text x="40" y="40" font-family="system-ui, sans-serif" font-size="15" letter-spacing="3" ` +
  `fill="${hex(palette.ink)}" fill-opacity="0.5">剑影 JIÀNYǏNG · GEAR PROGRESSION</text>` +
  rows.join('') +
  `</svg>`

await mkdir(OUT, { recursive: true })
await writeFile(join(OUT, 'progression.svg'), svg, 'utf8')
console.log(`sheet:  ${join(OUT, 'progression.svg')}`)
console.log(`stages: ${REGIONS.length + 1} on the road`)
console.log(`items:  ${ITEMS.length} across ${new Set(ITEMS.map((i) => i.slot)).size} slots`)
console.log(`look:   ${DEFAULT_LOOK.build} default build, ${BUILDS.length} available`)
