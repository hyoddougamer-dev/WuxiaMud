/**
 * Renders the wardrobe as a single SVG contact sheet.
 *
 *   npx tsx tools/wardrobe.ts
 *
 * This exists to answer one question with evidence rather than opinion: can
 * equipment be visually distinct in a game drawn entirely in ink silhouettes?
 * The sheet either shows figures you can tell apart from across a room, or it
 * does not, and either answer is worth more than an argument about it.
 *
 * No browser and no Pixi. The figure builders are pure geometry, so the same
 * polygons the game draws with WebGL can be written straight into SVG — which
 * makes this the fastest possible loop for judging silhouettes.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildBlade, buildSwordsmanTopDown } from '../src/render/figure'
import { strokeToPolygon } from '../src/render/silhouette'
import { palette } from '../src/render/palette'
import {
  BLADES,
  DEFAULT_GEAR,
  HEADS,
  ROBES,
  SHOULDERS,
  type Gear,
} from '../src/render/wardrobe'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'shots')

const CELL_W = 150
const CELL_H = 190
const COLS = 6

const hex = (colour: number): string => `#${colour.toString(16).padStart(6, '0')}`

// Shared with the DOM screens rather than duplicated. The sheet exists to be
// trusted as evidence about what the game draws, so it must not be able to
// render polygons by a slightly different rule than the hub does.
const polygon = strokeToPolygon

/** One figure, drawn in its own translated group. */
function cell(gear: Gear, label: string, x: number, y: number, index: number): string {
  // A seed per cell, so the brush jitter differs between figures the way it
  // would between two real brush marks.
  const figure = buildSwordsmanTopDown(7 + index, 1.55, gear)
  const blade = buildBlade(2 + index, 1.55, gear.blade)

  const parts: string[] = []
  // Blade first and behind, pointing off to the right at rest.
  parts.push(`<g transform="translate(0,-42)">`)
  for (const stroke of blade) parts.push(polygon(stroke, palette.ink))
  parts.push(`</g>`)
  for (const stroke of figure.bleed) parts.push(polygon(stroke, palette.ink))
  for (const stroke of figure.body) parts.push(polygon(stroke, palette.ink))

  return `
  <g transform="translate(${x + CELL_W / 2},${y + CELL_H - 40})">
    ${parts.join('\n    ')}
    <text x="0" y="26" text-anchor="middle" font-family="system-ui, sans-serif"
          font-size="10" fill="${hex(palette.ink)}" fill-opacity="0.62">${label}</text>
  </g>`
}

interface Row {
  title: string
  cells: Array<{ gear: Gear; label: string }>
}

function rows(): Row[] {
  const out: Row[] = []

  // Each row varies exactly one slot against an otherwise default swordsman, so
  // any difference you see is attributable to that slot alone.
  out.push({
    title: 'Robes — the hem carries most of the silhouette',
    cells: ROBES.map((robe) => ({ gear: { ...DEFAULT_GEAR, robe }, label: robe.name })),
  })
  out.push({
    title: 'Shoulders — width and what hangs off it',
    cells: SHOULDERS.map((shoulders) => ({
      gear: { ...DEFAULT_GEAR, shoulders },
      label: shoulders.name,
    })),
  })
  out.push({
    title: 'Headwear — the clearest read at distance',
    cells: HEADS.map((head) => ({ gear: { ...DEFAULT_GEAR, head }, label: head.name })),
  })
  out.push({
    title: 'Weapons — reach, curve and count',
    cells: BLADES.map((blade) => ({ gear: { ...DEFAULT_GEAR, blade }, label: blade.name })),
  })

  // And the point of the whole exercise: combinations, which is where the
  // variety actually lives. Six of roughly a thousand.
  const combos: Array<[string, string, string, string, string]> = [
    ['travelling', 'plain', 'hat', 'dao', 'Road Warden'],
    ['court', 'wide', 'crown', 'jian', 'Sect Elder'],
    ['lamellar', 'pauldron', 'bare', 'great', 'Border Officer'],
    ['tattered', 'bare', 'bare', 'twin', 'Grave Bandit'],
    ['layered', 'mantle', 'veiled', 'spear', 'Temple Warden'],
    ['plain', 'wide', 'veiled', 'fan', 'Wandering Envoy'],
  ]
  out.push({
    title: 'Combinations — five slots, and this is where the count explodes',
    cells: combos.map(([robe, shoulders, head, blade, label]) => ({
      gear: {
        robe: ROBES.find((r) => r.id === robe)!,
        shoulders: SHOULDERS.find((s) => s.id === shoulders)!,
        head: HEADS.find((h) => h.id === head)!,
        blade: BLADES.find((b) => b.id === blade)!,
      },
      label,
    })),
  })

  return out
}

async function main(): Promise<void> {
  const sheet = rows()
  // Generous, because the figures reach upward from their baseline and a tight
  // header sits inside the previous row's hats.
  const headerH = 54
  const height = sheet.length * (headerH + CELL_H) + 40
  const width = COLS * CELL_W + 40

  const parts: string[] = []
  let y = 30
  for (const row of sheet) {
    parts.push(
      `<text x="20" y="${y}" font-family="system-ui, sans-serif" font-size="12"
             letter-spacing="1.6" fill="${hex(palette.cinnabar)}">${row.title}</text>`,
    )
    y += headerH - 24
    row.cells.forEach((c, i) => {
      parts.push(cell(c.gear, c.label, 20 + i * CELL_W, y, i + row.title.length))
    })
    y += CELL_H
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"
     viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${hex(palette.paper)}"/>
  ${parts.join('\n  ')}
</svg>`

  await mkdir(OUT, { recursive: true })
  const path = join(OUT, 'wardrobe.svg')
  await writeFile(path, svg, 'utf8')
  const count = ROBES.length * SHOULDERS.length * HEADS.length * BLADES.length
  console.log(`sheet:  ${path}`)
  console.log(`slots:  ${ROBES.length} robes x ${SHOULDERS.length} shoulders x ${HEADS.length} heads x ${BLADES.length} weapons`)
  console.log(`combos: ${count} distinct silhouettes from ${ROBES.length + SHOULDERS.length + HEADS.length + BLADES.length} rows of numbers`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
