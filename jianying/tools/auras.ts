/**
 * PROPOSAL sheet: rarity and enchantment as a second visual channel.
 *
 *   npx tsx tools/auras.ts
 *
 * Read the honesty label first, because this sheet is not the same kind of
 * document as docs/progression.svg. There, every mark came out of the shipped
 * game. HERE, the FIGURES are still the game's own geometry, but the COLOUR and
 * the AURAS are a proposal — nothing in the game draws them yet. The sheet
 * exists so the idea can be judged by looking rather than by imagining.
 *
 * WHY IT IS WORTH DOING. The progression sheet made a problem visible that no
 * amount of new items would fix: silhouette is a low-bandwidth channel, and it
 * saturates. By the end of the road every school converges on the same black
 * mass, because the endgame armour dominates and the weapon is a thin line.
 * Colour is orthogonal to shape — it adds a dimension instead of competing for
 * the one that is already full.
 *
 * WHY NOT THE USUAL RARITY RAINBOW. Green/blue/purple/orange is the genre
 * default and it would wreck this game specifically. The whole look rests on a
 * four-colour palette; adding four saturated hues turns an ink painting into a
 * loot spreadsheet. So the extension is drawn from 青绿山水 — the blue-green
 * landscape tradition — whose pigments are 靛 indigo and 石绿 malachite. Those
 * are the colours this art would already have had, which is a very different
 * argument from "we needed four more tiers".
 *
 * THE BUDGET, which matters more than the palette. Auras are the player's and
 * the drops', never the swarm's: two hundred glowing enemies would cost the
 * frame budget AND destroy the readability the silhouettes were chosen for. And
 * at most one aura is ever fully lit at once.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { palette } from '../src/render/palette'
import { gearFromIds } from '../src/render/wardrobe'
import { REGIONS } from '../src/data/regions'
import { ITEM_BY_ID } from '../src/data/items'
import { SCHOOLS } from '../src/meta/schools'
import { BUILDS } from '../src/meta/look'
import {
  RITES,
  TIERS,
  W,
  columns,
  figure,
  gearOf,
  heading,
  hex,
  label,
} from './sheet'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'docs')

const defs: string[] = []
const rows: string[] = []
let y = 0

// --- honesty label -------------------------------------------------------
rows.push(
  `<text x="40" y="40" font-family="system-ui, sans-serif" font-size="15" letter-spacing="3" ` +
    `fill="${hex(palette.ink)}" fill-opacity="0.5">剑影 JIÀNYǏNG · COLOUR AND ENCHANTMENT — PROPOSAL</text>`,
  `<text x="40" y="62" font-family="system-ui, sans-serif" font-size="12.5" ` +
    `fill="${hex(palette.cinnabar)}">The figures are the game's own geometry. The colour and the auras are NOT in the game — this sheet is the proposal.</text>`,
)
y = 62

// --- 1. rarity ------------------------------------------------------------
y += 54
rows.push(
  heading(
    y,
    '一',
    'Rarity lives in the bleed, not the body',
    'Every stroke is drawn twice: a wide faint bleed, then solid ink. Tinting the BLEED reads as the piece glowing out of the paper; tinting the body would just make a coloured cut-out and throw the silhouette away.',
  ),
)
y += 96

{
  const gear = gearOf(['r-lamellar', 's-pauldron', 'h-hat', 'w-dao'])
  const cells = TIERS.map((tier, i) => figure(gear, 31 + i, 2.7, { accent: tier.colour }))
  const base = y + 176
  const capY = base + Math.max(...cells.map((c) => c.bottom)) + 26
  const x = columns(TIERS.length, Math.max(...cells.map((c) => c.right)))
  TIERS.forEach((tier, i) => {
    rows.push(`<g transform="translate(${x(i)},${base})">${cells[i]!.markup}</g>`)
    rows.push(label(x(i), capY, tier.seal, 18, hex(tier.colour ?? palette.ink), tier.colour ? 1 : 0.5))
    rows.push(label(x(i), capY + 21, tier.name, 13, hex(palette.ink), 0.7))
    rows.push(label(x(i), capY + 39, tier.note, 10.5, hex(palette.ink), 0.42))
  })
  y = capY + 74
}

// --- 2. enchantments ------------------------------------------------------
y += 22
rows.push(
  heading(
    y,
    '二',
    'An inscription is one thing you can see standing still',
    'Each rite has a single effect that reads in a still frame. An enchantment only visible in motion cannot be compared in the hub, which is where a player decides whether the drop was worth anything.',
  ),
)
y += 96

{
  const gear = gearOf(['r-travelling', 's-wide', 'h-topknot', 'w-jian'])
  RITES.forEach((rite, i) => {
    if (rite.kind !== 'wash') return
    defs.push(
      `<radialGradient id="wash-${41 + i}"><stop offset="0%" stop-color="${hex(rite.colour)}" stop-opacity="0.34"/>` +
        `<stop offset="100%" stop-color="${hex(rite.colour)}" stop-opacity="0"/></radialGradient>`,
    )
  })
  const cells = RITES.map((rite, i) => figure(gear, 41 + i, 2.5, { rite }))
  const base = y + 176
  const capY = base + Math.max(...cells.map((c) => c.bottom)) + 26
  const x = columns(RITES.length, Math.max(...cells.map((c) => c.right)))
  RITES.forEach((rite, i) => {
    rows.push(`<g transform="translate(${x(i)},${base})">${cells[i]!.markup}</g>`)
    rows.push(label(x(i), capY, rite.seal, 18, hex(rite.colour)))
    rows.push(label(x(i), capY + 21, rite.name, 13, hex(palette.ink), 0.7))
    // Wrapped by hand: SVG text does not wrap, and a measured wrapper is more
    // machinery than a five-cell sheet is worth.
    const words = rite.line.split(' ')
    const mid = Math.ceil(words.length / 2)
    rows.push(label(x(i), capY + 38, words.slice(0, mid).join(' '), 10.5, hex(palette.ink), 0.42))
    rows.push(label(x(i), capY + 52, words.slice(mid).join(' '), 10.5, hex(palette.ink), 0.42))
  })
  y = capY + 88
}

// --- 3. the problem this solves ------------------------------------------
y += 22
rows.push(
  heading(
    y,
    '三',
    'What it fixes',
    'The progression sheet showed the five schools converging on one black mass at the end of the road — the endgame armour dominates and the weapon is a thin line. Same five figures here, each carrying a different rite.',
  ),
)
y += 96

{
  const armour = gearOf(
    REGIONS.flatMap((r) => r.drops).filter((id) => ITEM_BY_ID.get(id)?.slot !== 'weapon'),
  )
  RITES.forEach((rite, i) => {
    if (rite.kind !== 'wash') return
    defs.push(
      `<radialGradient id="wash-${61 + i}"><stop offset="0%" stop-color="${hex(rite.colour)}" stop-opacity="0.34"/>` +
        `<stop offset="100%" stop-color="${hex(rite.colour)}" stop-opacity="0"/></radialGradient>`,
    )
  })
  const cells = SCHOOLS.map((school, i) =>
    figure(
      { ...armour, blade: gearFromIds({ blade: school.weaponId }).blade },
      61 + i,
      2.5,
      { rite: RITES[i]!, accent: TIERS[(i % 3) + 1]!.colour, build: BUILDS[i % BUILDS.length]!.width },
    ),
  )
  const base = y + 176
  const capY = base + Math.max(...cells.map((c) => c.bottom)) + 26
  const x = columns(SCHOOLS.length, Math.max(...cells.map((c) => c.right)))
  SCHOOLS.forEach((school, i) => {
    rows.push(`<g transform="translate(${x(i)},${base})">${cells[i]!.markup}</g>`)
    rows.push(label(x(i), capY, `${school.seal} ${RITES[i]!.seal}`, 16, hex(RITES[i]!.colour)))
    rows.push(label(x(i), capY + 20, school.name, 12, hex(palette.ink), 0.65))
    rows.push(
      label(x(i), capY + 37, `${TIERS[(i % 3) + 1]!.name} · ${RITES[i]!.name}`, 10.5, hex(palette.ink), 0.42),
    )
  })
  y = capY + 76
}

// --- the budget ----------------------------------------------------------
y += 26
rows.push(
  `<rect x="40" y="${y}" width="${W - 80}" height="86" fill="${hex(palette.ink)}" fill-opacity="0.04"/>`,
  `<text x="60" y="${y + 28}" font-family="system-ui, sans-serif" font-size="13" fill="${hex(palette.cinnabar)}">The budget, which matters more than the palette</text>`,
  `<text x="60" y="${y + 50}" font-family="system-ui, sans-serif" font-size="12" fill="${hex(palette.ink)}" fill-opacity="0.6">Auras belong to the player and to drops on the ground — never to the swarm. Two hundred glowing enemies would cost the frame budget AND destroy</text>`,
  `<text x="60" y="${y + 68}" font-family="system-ui, sans-serif" font-size="12" fill="${hex(palette.ink)}" fill-opacity="0.6">the readability the silhouettes were chosen for. One rite lit at a time, and two added pigments in total: 靛 indigo and 石绿 malachite.</text>`,
)
y += 110

const H = y + 30
const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
  `<defs>${defs.join('')}</defs>` +
  `<rect width="${W}" height="${H}" fill="${hex(palette.paper)}"/>` +
  rows.join('') +
  `</svg>`

await mkdir(OUT, { recursive: true })
await writeFile(join(OUT, 'auras.svg'), svg, 'utf8')
console.log(`sheet:  ${join(OUT, 'auras.svg')}`)
console.log(`tiers:  ${TIERS.length}   rites: ${RITES.length}`)
console.log(`added:  2 pigments (indigo, malachite) on top of the existing four`)
