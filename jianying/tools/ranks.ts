/**
 * 淬炼 — gear that is tempered, not merely swapped.
 *
 *   npx tsx tools/ranks.ts
 *
 * The three sheets before this one all described a piece of gear as something
 * you FIND. Find a better robe, wear the better robe, discard the old one. That
 * is a list of swaps, and it is why "progression" kept feeling like nothing was
 * progressing: the pieces changed but nothing ever grew.
 *
 * This sheet adds the missing axis. A piece has a RANK, it is raised by
 * tempering, and every rank is visible on the silhouette. The vocabulary was
 * already in the game: realm one is 淬体, Body Tempering. You temper your body;
 * the same word is what a smith does to steel. Nothing had to be imported from
 * another genre to name this.
 *
 * TWO REQUIREMENTS THIS HAD TO MEET, both stated outright:
 *
 *   CLEARLY VISIBLE. Rank could have been a brighter accent, and that would
 *   have been cheap and nearly invisible. Instead each rank adds a MARK to the
 *   silhouette — a hem at the skirt, then a knotted cord at the belt. Both read
 *   at a glance and both survive being shrunk to the size the game draws.
 *
 *   MODULAR. Rank opens SOCKETS, and a socket is empty until a rite is cut into
 *   it. So two pieces of the same set at the same rank are still not the same
 *   item, and the player composes rather than collects.
 *
 * Everything drawn here is the game's own figure geometry. The rank marks, the
 * sockets and the rites are still the proposal; the marks below now ship.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { palette } from '../src/render/palette'
import { REGIONS } from '../src/data/regions'
import { ITEM_BY_ID, type Item, type Slot } from '../src/data/items'
import { gearFromIds } from '../src/render/wardrobe'
import { BUILDS } from '../src/meta/look'
import {
  RITES,
  TIERS,
  W,
  columns,
  figure,
  heading,
  hex,
  label,
  socketPips,
  socketsAt,
  type Rite,
} from './sheet'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'docs')

const RITE_BY_NAME = new Map(RITES.map((r) => [r.name, r]))

/** A region's set, read out of its own drop table. Nothing invented. */
function setGear(regionIndex: number, weaponStyle?: string) {
  const best = new Map<Slot, Item>()
  for (const id of REGIONS[regionIndex]!.drops) {
    const item = ITEM_BY_ID.get(id)
    if (!item) continue
    const held = best.get(item.slot)
    if (!held || item.rarity > held.rarity) best.set(item.slot, item)
  }
  return gearFromIds({
    robe: best.get('robe')?.styleId,
    shoulders: best.get('shoulders')?.styleId,
    head: best.get('head')?.styleId,
    blade: weaponStyle ?? best.get('weapon')?.styleId,
  })
}

const defs: string[] = []
const rows: string[] = []
let y = 0

function washDef(id: number, colour: number): void {
  defs.push(
    `<radialGradient id="wash-${id}"><stop offset="0%" stop-color="${hex(colour)}" stop-opacity="0.34"/>` +
      `<stop offset="100%" stop-color="${hex(colour)}" stop-opacity="0"/></radialGradient>`,
  )
}

rows.push(
  `<text x="40" y="40" font-family="system-ui, sans-serif" font-size="15" letter-spacing="3" ` +
    `fill="${hex(palette.ink)}" fill-opacity="0.5">剑影 JIÀNYǏNG · 淬炼 TEMPERING — MODULAR RANKS</text>`,
  `<text x="40" y="62" font-family="system-ui, sans-serif" font-size="12.5" fill="${hex(palette.cinnabar)}">` +
    `Figures AND rank marks are the game's own geometry — both shipped. Sockets and rites are still proposal.</text>`,
)
y = 62

// --- 1. six ranks ---------------------------------------------------------
y += 54
rows.push(
  heading(
    y,
    '一',
    'One piece, six ranks — and you can see every one',
    'Rank could have been a brighter accent. That would be cheap and nearly invisible, so instead each rank puts a MARK on the silhouette: hems stack at the skirt, then knotted cords hang from the belt. Readable at the size the game actually draws.',
  ),
)
y += 114

{
  const gear = setGear(2)
  const RANKS = [0, 1, 2, 3, 4, 5]
  const cells = RANKS.map((rank) =>
    figure(gear, 101 + rank, 2.5, { accent: TIERS[1]!.colour, rank }),
  )
  const base = y + 176
  const capY = base + Math.max(...cells.map((c) => c.bottom)) + 26
  const x = columns(RANKS.length, Math.max(...cells.map((c) => c.right)))
  RANKS.forEach((rank, i) => {
    rows.push(`<g transform="translate(${x(i)},${base})">${cells[i]!.markup}</g>`)
    rows.push(label(x(i), capY, `阶 ${rank}`, 16, hex(palette.cinnabar), rank === 0 ? 0.45 : 1))
    const open = socketsAt(rank)
    rows.push(
      label(
        x(i),
        capY + 20,
        rank === 0 ? 'Found' : rank === 5 ? 'Fully tempered' : `Tempered ×${rank}`,
        11.5,
        hex(palette.ink),
        0.65,
      ),
    )
    rows.push(
      label(
        x(i),
        capY + 37,
        open === 0 ? 'no socket yet' : `${open} socket${open > 1 ? 's' : ''}`,
        10,
        hex(palette.ink),
        0.42,
      ),
    )
    if (open > 0) rows.push(socketPips(x(i), capY + 52, open, 0, palette.goldDeep))
  })
  y = capY + 92
}

// --- 2. sockets -----------------------------------------------------------
y += 22
rows.push(
  heading(
    y,
    '二',
    'Rank opens sockets — the sockets are what make it modular',
    'A socket is empty until a rite is cut into it. Two pieces of the same set at the same rank are therefore still not the same item, and the player composes a swordsman rather than collecting one.',
  ),
)
y += 96

{
  const gear = setGear(2)
  const combos: Array<{ rites: Rite[]; note: string }> = [
    { rites: [], note: 'Three sockets, all empty.' },
    { rites: [RITE_BY_NAME.get('Frost')!], note: 'One cut. Slows what it cuts.' },
    {
      rites: [RITE_BY_NAME.get('Frost')!, RITE_BY_NAME.get('Ember')!],
      note: 'Two. Cold and burning at once.',
    },
    {
      rites: [RITE_BY_NAME.get('Frost')!, RITE_BY_NAME.get('Ember')!, RITE_BY_NAME.get('Venom')!],
      note: 'Three. This is a named blade now.',
    },
  ]
  combos.forEach((combo, i) => {
    if (combo.rites.some((r) => r.kind === 'wash')) washDef(121 + i, RITE_BY_NAME.get('Frost')!.colour)
  })
  // Only one rite can be drawn as the halo, so the FIRST cut is the one that
  // shows — which is also the honest reading of the budget rule from the aura
  // sheet: at most one aura is ever fully lit.
  const cells = combos.map((combo, i) =>
    figure(gear, 121 + i, 2.6, {
      accent: TIERS[2]!.colour,
      rank: 5,
      ...(combo.rites[0] ? { rite: combo.rites[0] } : {}),
    }),
  )
  const base = y + 176
  const capY = base + Math.max(...cells.map((c) => c.bottom)) + 26
  const x = columns(combos.length, Math.max(...cells.map((c) => c.right)))
  combos.forEach((combo, i) => {
    rows.push(`<g transform="translate(${x(i)},${base})">${cells[i]!.markup}</g>`)
    rows.push(socketPips(x(i), capY - 4, 3, combo.rites.length, palette.cinnabar))
    rows.push(
      label(
        x(i),
        capY + 20,
        combo.rites.map((r) => `${r.seal} ${r.name}`).join(' · ') || '—',
        12,
        hex(combo.rites[0]?.colour ?? palette.ink),
        combo.rites.length ? 0.95 : 0.4,
      ),
    )
    rows.push(label(x(i), capY + 38, combo.note, 10.5, hex(palette.ink), 0.42))
  })
  y = capY + 76
}

// --- 3. one road ----------------------------------------------------------
y += 22
rows.push(
  heading(
    y,
    '三',
    'What a whole road looks like',
    'Set, rank and sockets stacked over one playthrough. This is the answer to the original question — the swordsman is not swapping between unrelated things, they are raising a specific one.',
  ),
)
y += 96

{
  interface Beat {
    seal: string
    what: string
    region: number
    rank: number
    tier: number
    rites: Rite[]
  }
  const beats: Beat[] = [
    { seal: '始', what: 'The kit you begin with', region: 0, rank: 0, tier: 0, rites: [] },
    { seal: '官', what: 'Post Road set complete', region: 0, rank: 1, tier: 1, rites: [] },
    { seal: '荡', what: 'Marsh set, first temper', region: 1, rank: 2, tier: 1, rites: [RITE_BY_NAME.get('Venom')!] },
    { seal: '崖', what: 'Cliff set, socketed', region: 2, rank: 3, tier: 2, rites: [RITE_BY_NAME.get('Frost')!] },
    { seal: '市', what: 'Paper Vestment, twice cut', region: 3, rank: 4, tier: 2, rites: [RITE_BY_NAME.get('Shadow')!] },
    { seal: '关', what: 'Pass Armour, fully tempered', region: 4, rank: 5, tier: 3, rites: [RITE_BY_NAME.get('Ember')!] },
  ]
  beats.forEach((beat, i) => {
    if (beat.rites.some((r) => r.kind === 'wash')) washDef(141 + i, beat.rites[0]!.colour)
  })
  const cells = beats.map((beat, i) =>
    figure(setGear(beat.region), 141 + i, 2.4, {
      accent: TIERS[beat.tier]!.colour,
      rank: beat.rank,
      build: BUILDS[1]!.width,
      ...(beat.rites[0] ? { rite: beat.rites[0] } : {}),
    }),
  )
  const base = y + 176
  const capY = base + Math.max(...cells.map((c) => c.bottom)) + 26
  const x = columns(beats.length, Math.max(...cells.map((c) => c.right)))
  beats.forEach((beat, i) => {
    rows.push(`<g transform="translate(${x(i)},${base})">${cells[i]!.markup}</g>`)
    rows.push(label(x(i), capY, beat.seal, 17, hex(palette.cinnabar)))
    rows.push(label(x(i), capY + 20, beat.what, 10.5, hex(palette.ink), 0.62))
    rows.push(
      label(
        x(i),
        capY + 37,
        `阶 ${beat.rank} · ${TIERS[beat.tier]!.name}`,
        10,
        hex(palette.ink),
        0.42,
      ),
    )
    const open = socketsAt(beat.rank)
    if (open > 0) rows.push(socketPips(x(i), capY + 52, open, beat.rites.length, palette.cinnabar))
  })
  y = capY + 90
}

// --- how a rank is earned -------------------------------------------------
y += 26
rows.push(
  `<rect x="40" y="${y}" width="${W - 80}" height="128" fill="${hex(palette.ink)}" fill-opacity="0.04"/>`,
  `<text x="60" y="${y + 28}" font-family="system-ui, sans-serif" font-size="13" fill="${hex(palette.cinnabar)}">淬炼 — where a rank comes from, and what it costs to build</text>`,
  `<text x="60" y="${y + 52}" font-family="system-ui, sans-serif" font-size="12" fill="${hex(palette.ink)}" fill-opacity="0.6">A duplicate is the fuel. Today a second Bamboo Hat is dead weight and the drop reads as "already yours"; under this it is the thing that raises the</text>`,
  `<text x="60" y="${y + 70}" font-family="system-ui, sans-serif" font-size="12" fill="${hex(palette.ink)}" fill-opacity="0.6">one you wear. That turns the most common disappointment in the game into its main currency, and it needs no new drop table.</text>`,
  `<text x="60" y="${y + 94}" font-family="system-ui, sans-serif" font-size="12" fill="${hex(palette.ink)}" fill-opacity="0.6">Cost: the rank marks are geometry (real work, but rows of numbers). Sockets and rank need an item INSTANCE — today an owned item is a bare</text>`,
  `<text x="60" y="${y + 112}" font-family="system-ui, sans-serif" font-size="12" fill="${hex(palette.ink)}" fill-opacity="0.6">id in the save, so this is the change that touches how the game stores what you own. It is the one piece of architecture in the whole proposal.</text>`,
)
y += 152

const H = y + 30
const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
  `<defs>${defs.join('')}</defs>` +
  `<rect width="${W}" height="${H}" fill="${hex(palette.paper)}"/>` +
  rows.join('') +
  `</svg>`

await mkdir(OUT, { recursive: true })
await writeFile(join(OUT, 'ranks.svg'), svg, 'utf8')
console.log(`sheet:  ${join(OUT, 'ranks.svg')}`)
console.log(`ranks:  6 (阶 0..5), sockets at ${[0, 1, 2, 3, 4, 5].map(socketsAt).join('/')}`)
console.log(`fuel:   duplicates — no new drop table needed`)
