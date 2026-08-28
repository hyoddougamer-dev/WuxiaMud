/**
 * PROPOSAL sheet: sets, and the three layers a piece of gear is made of.
 *
 *   npx tsx tools/sets.ts
 *
 * This sheet exists because the last one caused honest confusion, and the
 * confusion was mine to fix. I showed twenty-two loose items and called the
 * result "progression". Twenty-two unrelated things in a row is not a
 * progression, it is a list — there is nothing to want, only things to swap.
 *
 * THE FINDING THAT CHANGES THE WORK. The sets already exist in the code. Every
 * region drops exactly one robe, one pair of shoulders, one head and one
 * weapon; that is a four-piece set, and it has been sitting there unnamed since
 * the regions were written. Nothing about them says "set": they have no name,
 * no shared look, and completing one pays nothing. So the structure is built
 * and only the meaning is missing, which makes this data work rather than
 * architecture.
 *
 * THE MODEL, which is the thing that was never explained. A piece of gear is
 * three INDEPENDENT layers, and every one of them was being conflated with the
 * others in every conversation so far:
 *
 *   形 SHAPE   which set the piece belongs to. Decides the silhouette.
 *   色 GRADE   how good this particular instance rolled. Decides the ink.
 *   铭 RITE    the inscription cut into it. Decides the aura and one effect.
 *
 * Two Lamellar Skirts are then genuinely different items: same shape, one
 * common with no rite, the other divine and carrying Frost. That is what makes
 * loot differ item to item rather than only slot to slot.
 *
 * AND CLASS TO CLASS. A set is worn by anybody, but the weapon inside it is
 * the school's, the build is the player's, and a completed set lights its own
 * rite. Section three is the test of whether that is enough to keep five
 * swordsmen apart at the end of the road, which is exactly what the previous
 * sheet showed the game currently failing.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { palette } from '../src/render/palette'
import { gearFromIds } from '../src/render/wardrobe'
import { REGIONS, type Region } from '../src/data/regions'
import { ITEM_BY_ID, type Item, type Slot } from '../src/data/items'
import { SCHOOLS } from '../src/meta/schools'
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
  type Rite,
} from './sheet'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'docs')

/**
 * A named set, built from what a region ALREADY drops.
 *
 * Nothing here invents an item. The pieces are looked up from the region's own
 * drop table, which is the whole point: if this sheet needed new items to make
 * its case, the case would be much weaker.
 */
interface SetLine {
  readonly seal: string
  readonly name: string
  readonly region: Region
  /** Lit when all three armour pieces are worn. The road pays nothing — it is
   *  the baseline every other set is felt against, exactly as its rule is. */
  readonly rite: Rite | null
  readonly bonus: string
}

const RITE_BY_NAME = new Map(RITES.map((r) => [r.name, r]))

const SETS: readonly SetLine[] = [
  {
    seal: '官装',
    name: 'Post Road Kit',
    region: REGIONS[0]!,
    rite: null,
    bonus: 'No rite. The road is what everywhere else is measured against.',
  },
  {
    seal: '荡蜕',
    name: 'Marsh Cast-off',
    region: REGIONS[1]!,
    rite: RITE_BY_NAME.get('Venom') ?? null,
    bonus: 'What you cut keeps bleeding, the way the water keeps what it takes.',
  },
  {
    seal: '崖衣',
    name: 'Cliff Windcoat',
    region: REGIONS[2]!,
    rite: RITE_BY_NAME.get('Frost') ?? null,
    bonus: 'The cold that lives on the ledge comes down with you.',
  },
  {
    seal: '纸衣',
    name: 'Paper Vestment',
    region: REGIONS[3]!,
    rite: RITE_BY_NAME.get('Shadow') ?? null,
    bonus: 'A second self, folded from the same sheet.',
  },
  {
    seal: '关甲',
    name: 'Pass Armour',
    region: REGIONS[4]!,
    rite: RITE_BY_NAME.get('Ember') ?? null,
    bonus: 'Eleven years of holding a gate leaves something burning.',
  },
]

/** The pieces a set is made of, read straight out of its region's drop table. */
function piecesOf(line: SetLine): Map<Slot, Item> {
  const out = new Map<Slot, Item>()
  for (const id of line.region.drops) {
    const item = ITEM_BY_ID.get(id)
    if (!item) continue
    const held = out.get(item.slot)
    // Where a region drops two of a slot the rarer one is the set piece; the
    // other is a loose find. The Pass is the only region this applies to.
    if (!held || item.rarity > held.rarity) out.set(item.slot, item)
  }
  return out
}

function gearOfSet(line: SetLine, weaponStyle?: string) {
  const p = piecesOf(line)
  return gearFromIds({
    robe: p.get('robe')?.styleId,
    shoulders: p.get('shoulders')?.styleId,
    head: p.get('head')?.styleId,
    blade: weaponStyle ?? p.get('weapon')?.styleId,
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
    `fill="${hex(palette.ink)}" fill-opacity="0.5">剑影 JIÀNYǏNG · SETS AND THE THREE LAYERS — PROPOSAL</text>`,
  `<text x="40" y="62" font-family="system-ui, sans-serif" font-size="12.5" fill="${hex(palette.cinnabar)}">` +
    `The sets are built from items the game already drops. Only the names, the rites and the set bonuses are new.</text>`,
)
y = 62

// --- 1. the three layers --------------------------------------------------
y += 54
rows.push(
  heading(
    y,
    '一',
    'One piece, three independent layers',
    'This is what was never explained, and why the last sheet was confusing. Shape, grade and rite vary separately — so two swordsmen in the same set, wearing the same slot, can still be nothing alike.',
  ),
)
y += 96

{
  const line = SETS[4]!
  const layers: Array<{ seal: string; name: string; note: string; accent: number | null; rite?: Rite }> = [
    { seal: '形', name: 'Shape', note: 'The set. Pass Armour.', accent: null },
    { seal: '色', name: 'Grade', note: 'Same shape, rare.', accent: TIERS[2]!.colour },
    {
      seal: '铭',
      name: 'Rite',
      note: 'Same shape, inscribed.',
      accent: null,
      rite: RITE_BY_NAME.get('Frost')!,
    },
    {
      seal: '全',
      name: 'All three',
      note: 'Divine, and inscribed.',
      accent: TIERS[3]!.colour,
      rite: RITE_BY_NAME.get('Frost')!,
    },
  ]
  layers.forEach((l, i) => {
    if (l.rite?.kind === 'wash') washDef(71 + i, l.rite.colour)
  })
  const cells = layers.map((l, i) =>
    figure(gearOfSet(line), 71 + i, 2.6, { accent: l.accent, ...(l.rite ? { rite: l.rite } : {}) }),
  )
  const base = y + 176
  const capY = base + Math.max(...cells.map((c) => c.bottom)) + 26
  const x = columns(layers.length, Math.max(...cells.map((c) => c.right)))
  layers.forEach((l, i) => {
    rows.push(`<g transform="translate(${x(i)},${base})">${cells[i]!.markup}</g>`)
    rows.push(label(x(i), capY, l.seal, 19, hex(palette.cinnabar)))
    rows.push(label(x(i), capY + 21, l.name, 13, hex(palette.ink), 0.72))
    rows.push(label(x(i), capY + 38, l.note, 10.5, hex(palette.ink), 0.42))
  })
  y = capY + 76
}

// --- 2. the five sets -----------------------------------------------------
y += 22
rows.push(
  heading(
    y,
    '二',
    'Five sets, and they are already in the game',
    'Every region drops exactly one robe, one pair of shoulders, one head and one weapon. That is a set, and it has been sitting unnamed in the drop tables since the regions were written. Wearing all three armour pieces lights the set rite.',
  ),
)
y += 114

{
  SETS.forEach((line, i) => {
    if (line.rite?.kind === 'wash') washDef(81 + i, line.rite.colour)
  })
  const cells = SETS.map((line, i) =>
    figure(gearOfSet(line), 81 + i, 2.5, {
      accent: TIERS[1]!.colour,
      ...(line.rite ? { rite: line.rite } : {}),
    }),
  )
  const base = y + 176
  const capY = base + Math.max(...cells.map((c) => c.bottom)) + 26
  const x = columns(SETS.length, Math.max(...cells.map((c) => c.right)))
  SETS.forEach((line, i) => {
    rows.push(`<g transform="translate(${x(i)},${base})">${cells[i]!.markup}</g>`)
    rows.push(
      label(
        x(i),
        capY,
        `${line.seal}${line.rite ? ` ${line.rite.seal}` : ''}`,
        17,
        hex(line.rite?.colour ?? palette.ink),
        line.rite ? 1 : 0.45,
      ),
    )
    rows.push(label(x(i), capY + 21, line.name, 13, hex(palette.ink), 0.72))
    rows.push(label(x(i), capY + 37, line.region.name, 10.5, hex(palette.ink), 0.4))
    // The pieces, so the claim "these already exist" is checkable rather than
    // asserted — every name here is in src/data/items.ts today.
    const pieces = [...piecesOf(line).values()].filter((p) => p.slot !== 'weapon')
    pieces.forEach((piece, k) => {
      rows.push(label(x(i), capY + 56 + k * 14, piece.name, 10, hex(palette.goldDeep), 0.75))
    })
    rows.push(
      label(x(i), capY + 56 + pieces.length * 14 + 6, line.rite ? line.rite.name : '—', 10.5, hex(palette.ink), 0.5),
    )
  })
  y = capY + 150
}

// --- 3. class to class ----------------------------------------------------
y += 22
rows.push(
  heading(
    y,
    '三',
    'The same set, five different swordsmen',
    'The previous sheet showed all five schools converging on one black mass at the end of the road. Here they all wear Pass Armour — and the weapon, the build and the rite still keep them apart. That is the test this had to pass.',
  ),
)
y += 114

{
  const line = SETS[4]!
  SCHOOLS.forEach((_, i) => {
    const rite = RITES[i % RITES.length]!
    if (rite.kind === 'wash') washDef(91 + i, rite.colour)
  })
  const cells = SCHOOLS.map((school, i) =>
    figure(gearOfSet(line, school.weaponId), 91 + i, 2.5, {
      accent: TIERS[(i % 3) + 1]!.colour,
      rite: RITES[i % RITES.length]!,
      build: BUILDS[i % BUILDS.length]!.width,
    }),
  )
  const base = y + 176
  const capY = base + Math.max(...cells.map((c) => c.bottom)) + 26
  const x = columns(SCHOOLS.length, Math.max(...cells.map((c) => c.right)))
  SCHOOLS.forEach((school, i) => {
    const rite = RITES[i % RITES.length]!
    rows.push(`<g transform="translate(${x(i)},${base})">${cells[i]!.markup}</g>`)
    rows.push(label(x(i), capY, `${school.seal} ${rite.seal}`, 16, hex(rite.colour)))
    rows.push(label(x(i), capY + 20, school.name, 12, hex(palette.ink), 0.68))
    rows.push(
      label(
        x(i),
        capY + 37,
        `${BUILDS[i % BUILDS.length]!.name} · ${TIERS[(i % 3) + 1]!.name} · ${rite.name}`,
        10,
        hex(palette.ink),
        0.42,
      ),
    )
  })
  y = capY + 74
}

// --- what this costs ------------------------------------------------------
y += 26
rows.push(
  `<rect x="40" y="${y}" width="${W - 80}" height="106" fill="${hex(palette.ink)}" fill-opacity="0.04"/>`,
  `<text x="60" y="${y + 28}" font-family="system-ui, sans-serif" font-size="13" fill="${hex(palette.cinnabar)}">What this costs, honestly</text>`,
  `<text x="60" y="${y + 50}" font-family="system-ui, sans-serif" font-size="12" fill="${hex(palette.ink)}" fill-opacity="0.6">Naming the sets and paying for completing one is data — no new geometry, because every piece above already drops today. The rites need</text>`,
  `<text x="60" y="${y + 68}" font-family="system-ui, sans-serif" font-size="12" fill="${hex(palette.ink)}" fill-opacity="0.6">real drawing and real combat effects. The grade roll needs an item instance, which the save format does not have yet: an owned item is a</text>`,
  `<text x="60" y="${y + 86}" font-family="system-ui, sans-serif" font-size="12" fill="${hex(palette.ink)}" fill-opacity="0.6">bare id today, so &quot;two Lamellar Skirts that differ&quot; is the one part of this that changes how the game stores what you own.</text>`,
)
y += 130

const H = y + 30
const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
  `<defs>${defs.join('')}</defs>` +
  `<rect width="${W}" height="${H}" fill="${hex(palette.paper)}"/>` +
  rows.join('') +
  `</svg>`

await mkdir(OUT, { recursive: true })
await writeFile(join(OUT, 'sets.svg'), svg, 'utf8')
console.log(`sheet:  ${join(OUT, 'sets.svg')}`)
console.log(`sets:   ${SETS.length}, built from ${new Set(SETS.flatMap((s) => [...piecesOf(s).values()].map((p) => p.id))).size} items that already exist`)
console.log(`new:    0 items, 0 wardrobe styles`)
