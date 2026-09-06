/**
 * PROPOSAL sheet: the whole progression system, on one page.
 *
 *   npx tsx tools/system.ts
 *
 * Four sheets have gone out one idea at a time, and the reasonable response to
 * the fourth was that the whole thing still could not be seen at once. This is
 * that page. It supersedes docs/sets.png, whose sets were tied to the map.
 *
 * THREE THINGS CHANGED, and each was asked for:
 *
 * 1. SETS ARE NO LONGER PLACES. Tying a set to the region that drops it made
 *    the set a label for a map pin, which meant the only way to want one was to
 *    want to go somewhere. A set is now a LINEAGE — a named forge with a
 *    tradition behind it — and the names are the famous swords of Chinese
 *    legend rather than "Marsh Cast-off". 干将 was forged when the smith gave
 *    himself to the furnace. That is a thing to want. "The robe from area two"
 *    is not.
 *
 * 2. VERTICAL, AND GATED, THE WAY POE GATES IT. PoE's item level decides which
 *    modifiers a base can carry; here the character's REALM decides how far a
 *    piece can be tempered. You cannot raise steel past your own cultivation.
 *    That single rule ties the permanent character ladder to the gear ladder —
 *    and it finally gives the permanent level a job beyond buying attributes.
 *
 * 3. EVERY PIECE VISIBLY COUNTS. Solved by the medium rather than by geometry:
 *    a Chinese painting collects seals down its side, so a swordsman collects
 *    the seal of every forge they wear. One piece, one seal, countable from
 *    across the screen. The lineage's rite ignites only when its seals are all
 *    stamped, which is what makes the fourth piece feel unlike the third.
 *
 * The figures are the game's own geometry. Everything else here is proposal.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { palette } from '../src/render/palette'
import { gearFromIds } from '../src/render/wardrobe'
import { REALMS } from '../src/meta/realms'
import {
  RITES,
  TIERS,
  W,
  columns,
  figure,
  heading,
  hex,
  label,
  lineageSeals,
  socketPips,
  socketsAt,
  type Rite,
} from './sheet'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'docs')

const RITE = new Map(RITES.map((r) => [r.name, r]))

/**
 * A forge, not a place.
 *
 * Named for the famous swords of Chinese legend, which is where this fiction's
 * own vocabulary lives. Each lineage owns one rite, one motif and one look, and
 * none of them is reachable by "go to region N" — they are crafted at the forge
 * out of what the road hands over.
 */
interface Lineage {
  readonly seal: string
  readonly pinyin: string
  readonly name: string
  readonly rite: Rite
  readonly story: string
  /** Wardrobe styles this forge works in. Its pieces look like each other. */
  readonly styles: { robe: string; shoulders: string; head: string; blade: string }
}

const LINEAGES: readonly Lineage[] = [
  {
    seal: '龙泉',
    pinyin: 'Lóngquán',
    name: 'Dragon Spring',
    rite: RITE.get('Thunder')!,
    story: 'The town that has forged swords for a thousand years. Orthodox, and the storm over its well.',
    styles: { robe: 'plain', shoulders: 'plain', head: 'topknot', blade: 'jian' },
  },
  {
    seal: '干将',
    pinyin: 'Gānjiàng',
    name: "The Smith's Sword",
    rite: RITE.get('Ember')!,
    story: 'Forged the night its maker walked into his own furnace to make the metal run.',
    styles: { robe: 'lamellar', shoulders: 'pauldron', head: 'veiled', blade: 'great' },
  },
  {
    seal: '莫邪',
    pinyin: 'Mòxié',
    name: 'Her Answer',
    rite: RITE.get('Frost')!,
    story: "Ganjiang's pair, and its opposite. Water where he was fire.",
    styles: { robe: 'court', shoulders: 'mantle', head: 'crown', blade: 'fan' },
  },
  {
    seal: '湛卢',
    pinyin: 'Zhànlú',
    name: 'The Black Sword',
    rite: RITE.get('Shadow')!,
    story: 'It leaves an unjust king in the night, and is found the next morning in another hand.',
    styles: { robe: 'layered', shoulders: 'wide', head: 'hat', blade: 'spear' },
  },
  {
    seal: '鱼肠',
    pinyin: 'Yúcháng',
    name: 'Fish-gut',
    rite: RITE.get('Venom')!,
    story: 'Short enough to be carried inside a served fish. Drawn once, at the table.',
    styles: { robe: 'tattered', shoulders: 'bare', head: 'bare', blade: 'twin' },
  },
]

const gearOfLineage = (l: Lineage) => gearFromIds(l.styles)

const defs: string[] = []
const rows: string[] = []
let y = 0

const washDef = (id: number, colour: number): void => {
  defs.push(
    `<radialGradient id="wash-${id}"><stop offset="0%" stop-color="${hex(colour)}" stop-opacity="0.34"/>` +
      `<stop offset="100%" stop-color="${hex(colour)}" stop-opacity="0"/></radialGradient>`,
  )
}

rows.push(
  `<text x="40" y="40" font-family="system-ui, sans-serif" font-size="15" letter-spacing="3" ` +
    `fill="${hex(palette.ink)}" fill-opacity="0.5">剑影 JIÀNYǏNG · THE WHOLE SYSTEM — PROPOSAL</text>`,
  `<text x="40" y="62" font-family="system-ui, sans-serif" font-size="12.5" fill="${hex(palette.cinnabar)}">` +
    `Supersedes docs/sets.png. Sets are no longer places — they are named forges. The figures are the game's geometry; everything else is proposal.</text>`,
)
y = 62

// --- 1. the three ladders -------------------------------------------------
y += 54
rows.push(
  heading(
    y,
    '一',
    'Three ladders, and only one of them touches the others',
    'This is the answer to "progression and levels". Insight is spent inside one expedition and dies with it. Realm is permanent. A piece of gear has its own rank — and the rule that binds the system is that a piece can never be tempered above your realm.',
  ),
)
y += 100

{
  const left = 150
  const right = W - 70
  const span = right - left

  const track = (
    ty: number,
    seal: string,
    name: string,
    note: string,
    steps: number,
    filled: number,
    colour: number,
    labels?: string[],
  ): void => {
    rows.push(
      `<text x="40" y="${ty + 5}" font-family="system-ui, sans-serif" font-size="17" fill="${hex(colour)}">${seal}</text>`,
      `<text x="72" y="${ty + 5}" font-family="system-ui, sans-serif" font-size="13" fill="${hex(palette.ink)}" fill-opacity="0.75">${name}</text>`,
      // Below the step labels, not level with them. At the same height the
      // realm seals were being written straight through this sentence.
      `<text x="40" y="${ty + 44}" font-family="system-ui, sans-serif" font-size="10.5" fill="${hex(palette.ink)}" fill-opacity="0.42">${note}</text>`,
      `<line x1="${left}" y1="${ty}" x2="${right}" y2="${ty}" stroke="${hex(palette.ink)}" stroke-opacity="0.14" stroke-width="1.5"/>`,
    )
    for (let i = 0; i < steps; i++) {
      const cx = left + (span * i) / (steps - 1)
      rows.push(
        i < filled
          ? `<circle cx="${cx.toFixed(1)}" cy="${ty}" r="6" fill="${hex(colour)}" fill-opacity="0.9"/>`
          : `<circle cx="${cx.toFixed(1)}" cy="${ty}" r="6" fill="${hex(palette.paper)}" stroke="${hex(palette.ink)}" stroke-opacity="0.24"/>`,
      )
      if (labels?.[i]) {
        rows.push(
          `<text x="${cx.toFixed(1)}" y="${ty + 22}" text-anchor="middle" font-family="system-ui, sans-serif" ` +
            `font-size="9.5" fill="${hex(palette.ink)}" fill-opacity="0.5">${labels[i]}</text>`,
        )
      }
    }
  }

  track(y + 10, '悟', 'Insight', 'Inside one expedition. Deepens 内力. Lost at death.', 8, 5, palette.gold)
  track(
    y + 84,
    '境',
    'Realm',
    'Permanent. Buys attributes — and caps how far steel can be raised.',
    REALMS.length,
    3,
    palette.cinnabar,
    REALMS.map((r) => r.seal),
  )
  track(y + 192, '阶', 'Rank', 'Per PIECE. Raised at the forge by feeding it duplicates.', 6, 3, palette.goldDeep, [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
  ])

  // The gate. Drawn as an actual line between the two tracks, because it is the
  // one rule in the system that makes the other two ladders one system.
  const realmX = left + (span * 2) / (REALMS.length - 1)
  const rankX = left + (span * 3) / 5
  rows.push(
    `<path d="M ${realmX.toFixed(1)} ${y + 104} L ${realmX.toFixed(1)} ${y + 152} L ${rankX.toFixed(1)} ${y + 152} L ${rankX.toFixed(1)} ${y + 184}" ` +
      `fill="none" stroke="${hex(palette.cinnabar)}" stroke-width="1.6" stroke-dasharray="4 3" stroke-opacity="0.75"/>`,
    `<text x="${((realmX + rankX) / 2).toFixed(1)}" y="${y + 147}" text-anchor="middle" ` +
      `font-family="system-ui, sans-serif" font-size="11" fill="${hex(palette.cinnabar)}">Realm 3 → nothing may be tempered past 阶 3</text>`,
  )
  y += 262
}

// --- 2. the lineages ------------------------------------------------------
y += 30
rows.push(
  heading(
    y,
    '二',
    'Five forges, and not one of them is a place on the map',
    'Named for the famous swords of legend. A lineage owns one rite, one look and one story. You do not travel to a lineage — you build one, out of what the road hands over.',
  ),
)
y += 96

{
  LINEAGES.forEach((l, i) => {
    if (l.rite.kind === 'wash') washDef(201 + i, l.rite.colour)
  })
  const cells = LINEAGES.map((l, i) =>
    figure(gearOfLineage(l), 201 + i, 2.4, { accent: TIERS[2]!.colour, rank: 4, rite: l.rite }),
  )
  const base = y + 176
  const capY = base + Math.max(...cells.map((c) => c.bottom)) + 26
  const x = columns(LINEAGES.length, Math.max(...cells.map((c) => c.right)))
  LINEAGES.forEach((l, i) => {
    rows.push(`<g transform="translate(${x(i)},${base})">${cells[i]!.markup}</g>`)
    rows.push(label(x(i), capY, `${l.seal} ${l.rite.seal}`, 17, hex(l.rite.colour)))
    rows.push(label(x(i), capY + 20, `${l.pinyin} · ${l.name}`, 11.5, hex(palette.ink), 0.7))
    // The story, wrapped by hand into three short lines. It is the reason to
    // want the lineage, and a list of stats is not.
    const words = l.story.split(' ')
    const per = Math.ceil(words.length / 3)
    for (let k = 0; k < 3; k++) {
      rows.push(
        label(
          x(i),
          capY + 38 + k * 13,
          words.slice(k * per, (k + 1) * per).join(' '),
          9.5,
          hex(palette.ink),
          0.42,
        ),
      )
    }
    rows.push(label(x(i), capY + 92, `${l.rite.seal} ${l.rite.name}`, 11, hex(l.rite.colour), 0.85))
  })
  y = capY + 128
}

// --- 3. every piece counts ------------------------------------------------
y += 22
rows.push(
  heading(
    y,
    '三',
    'One piece, one seal — so every piece is visible',
    'A Chinese painting collects seals down its side: the artist, then every owner. A swordsman collects the seal of every forge they wear. You can count what somebody is carrying from across the screen, and the rite ignites only when the last seal is stamped.',
  ),
)
y += 114

{
  const l = LINEAGES[1]!
  const WORN = [1, 2, 3, 4]
  WORN.forEach((_, i) => {
    if (l.rite.kind === 'wash') washDef(221 + i, l.rite.colour)
  })
  const cells = WORN.map((worn, i) =>
    figure(gearOfLineage(l), 221 + i, 2.5, {
      accent: TIERS[worn >= 4 ? 2 : 1]!.colour,
      rank: worn,
      // The rite is dark until the set is whole. That is the entire reward for
      // the fourth piece, and it has to be the loudest step in the row.
      ...(worn === 4 ? { rite: l.rite } : {}),
    }),
  )
  const base = y + 176
  const capY = base + Math.max(...cells.map((c) => c.bottom)) + 26
  const x = columns(WORN.length, Math.max(...cells.map((c) => c.right)) + 40)
  WORN.forEach((worn, i) => {
    rows.push(`<g transform="translate(${x(i)},${base})">${cells[i]!.markup}</g>`)
    rows.push(
      `<g transform="translate(${(x(i) - 62).toFixed(1)},${base})">${lineageSeals(
        0,
        0,
        l.seal[0]!,
        worn,
        4,
        worn === 4,
      )}</g>`,
    )
    rows.push(label(x(i), capY, `${worn} / 4`, 15, hex(palette.cinnabar), worn === 4 ? 1 : 0.6))
    rows.push(
      label(
        x(i),
        capY + 20,
        worn === 4 ? `${l.rite.seal} ${l.rite.name} ignites` : 'sealed, not yet lit',
        11.5,
        hex(worn === 4 ? l.rite.colour : palette.ink),
        worn === 4 ? 0.95 : 0.45,
      ),
    )
  })
  y = capY + 66
}

// --- 4. the forge ---------------------------------------------------------
y += 22
rows.push(
  heading(
    y,
    '四',
    'The forge — where the crafting actually happens',
    'Four operations, and every one of them consumes something the game already produces. No new drop table, and no currency the player has to be taught separately.',
  ),
)
y += 96

{
  const OPS = [
    {
      seal: '淬',
      name: 'Temper',
      cost: 'A duplicate of the piece',
      does: 'Raises 阶 by one, up to your realm. Opens a socket at 2, 4 and 5.',
    },
    {
      seal: '铭',
      name: 'Inscribe',
      cost: "A boss's relic",
      does: 'Cuts one rite into one empty socket. Choose from what that boss carried.',
    },
    {
      seal: '磨',
      name: 'Grind out',
      cost: 'Cultivation',
      does: 'Removes a rite and frees its socket. Nothing is ever a dead end.',
    },
    {
      seal: '承',
      name: 'Carry over',
      cost: 'Two pieces of one lineage',
      does: 'Moves a rank from a piece you have outgrown into one you have not.',
    },
  ]
  const step = (W - 80) / OPS.length
  const boxY = y
  OPS.forEach((op, i) => {
    const x0 = 40 + step * i + 6
    rows.push(
      `<rect x="${x0}" y="${boxY}" width="${step - 12}" height="132" fill="${hex(palette.ink)}" fill-opacity="0.04" rx="3"/>`,
      `<text x="${x0 + 16}" y="${boxY + 36}" font-family="serif" font-size="26" fill="${hex(palette.cinnabar)}">${op.seal}</text>`,
      `<text x="${x0 + 50}" y="${boxY + 34}" font-family="system-ui, sans-serif" font-size="14" fill="${hex(palette.ink)}">${op.name}</text>`,
      `<text x="${x0 + 16}" y="${boxY + 60}" font-family="system-ui, sans-serif" font-size="10.5" fill="${hex(palette.goldDeep)}">${op.cost}</text>`,
    )
    const words = op.does.split(' ')
    const per = Math.ceil(words.length / 4)
    for (let k = 0; k < 4; k++) {
      const line = words.slice(k * per, (k + 1) * per).join(' ')
      if (!line) continue
      rows.push(
        `<text x="${x0 + 16}" y="${boxY + 82 + k * 15}" font-family="system-ui, sans-serif" font-size="10.5" ` +
          `fill="${hex(palette.ink)}" fill-opacity="0.58">${line}</text>`,
      )
    }
  })
  y = boxY + 156
}

// --- what a piece is, in full --------------------------------------------
y += 8
{
  const rank = 4
  rows.push(
    `<rect x="40" y="${y}" width="${W - 80}" height="118" fill="${hex(palette.ink)}" fill-opacity="0.04"/>`,
    `<text x="60" y="${y + 28}" font-family="system-ui, sans-serif" font-size="13" fill="${hex(palette.cinnabar)}">One piece, in full — and why two of the same thing are never the same item</text>`,
    `<text x="60" y="${y + 54}" font-family="system-ui, sans-serif" font-size="12" fill="${hex(palette.ink)}" fill-opacity="0.7">` +
      `干将 Lamellar Skirt · 阶 4 · Rare · sockets ${socketsAt(rank)} · 焰 Ember, 霜 Frost</text>`,
    `<text x="60" y="${y + 78}" font-family="system-ui, sans-serif" font-size="11.5" fill="${hex(palette.ink)}" fill-opacity="0.55">` +
      `形 the shape comes from the base · 谱 the lineage stamps the seal and owns the rite · 阶 the rank marks the hems and cords · 铭 the sockets carry what you cut</text>`,
    `<text x="60" y="${y + 100}" font-family="system-ui, sans-serif" font-size="11.5" fill="${hex(palette.ink)}" fill-opacity="0.55">` +
      `Four axes. The one architectural cost in all of this is that an owned item stops being a bare id in the save and becomes an instance with a rank and sockets.</text>`,
  )
  rows.push(socketPips(W - 130, y + 50, socketsAt(rank), 2, palette.cinnabar))
  y += 142
}

const H = y + 30
const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
  `<defs>${defs.join('')}</defs>` +
  `<rect width="${W}" height="${H}" fill="${hex(palette.paper)}"/>` +
  rows.join('') +
  `</svg>`

await mkdir(OUT, { recursive: true })
await writeFile(join(OUT, 'system.svg'), svg, 'utf8')
console.log(`sheet:    ${join(OUT, 'system.svg')}`)
console.log(`ladders:  悟 insight (lost) · 境 realm ${REALMS.length} (kept) · 阶 rank 0-5 (per piece)`)
console.log(`lineages: ${LINEAGES.map((l) => l.seal).join(' ')}  — none tied to a region`)
console.log(`forge:    4 operations, all fed by things the game already drops`)
