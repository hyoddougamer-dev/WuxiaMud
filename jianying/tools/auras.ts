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
import { Rng } from '../src/core/rng'
import { buildBlade, buildSwordsmanTopDown } from '../src/render/figure'
import { strokeToPolygon } from '../src/render/silhouette'
import { palette } from '../src/render/palette'
import { gearFromIds, type Gear } from '../src/render/wardrobe'
import { REGIONS } from '../src/data/regions'
import { ITEM_BY_ID, type Item, type Slot } from '../src/data/items'
import { SCHOOLS } from '../src/meta/schools'
import { BUILDS } from '../src/meta/look'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'docs')

const W = 1180
const hex = (c: number): string => `#${c.toString(16).padStart(6, '0')}`

/**
 * The proposed extension to the palette.
 *
 * Two pigments, not four, and both of them classical. 青绿山水 painting is built
 * on mineral indigo and malachite over ink, so these read as the same tradition
 * rather than as an RPG legend bolted on.
 */
const INDIGO = 0x2e4a6b
const MALACHITE = 0x4a6b52

// --- rarity ---------------------------------------------------------------

interface Tier {
  readonly seal: string
  readonly name: string
  readonly colour: number | null
  readonly note: string
}

/**
 * Four tiers, and the accent gets louder rather than merely different.
 *
 * Deliberately reusing the accents the item cards ALREADY use in the hub: gold
 * for uncommon, cinnabar for rare. A player who has learnt what a gold edge
 * means on a card does not have to learn it again on the figure.
 */
const TIERS: readonly Tier[] = [
  { seal: '常', name: 'Common', colour: null, note: 'Flat ink. Most of what drops.' },
  { seal: '珍', name: 'Uncommon', colour: palette.gold, note: 'A gold hairline along the piece.' },
  { seal: '奇', name: 'Rare', colour: palette.cinnabar, note: 'Cinnabar, and the ink bleeds wider.' },
  { seal: '神', name: 'Divine', colour: INDIGO, note: 'The bleed becomes a wash of qi.' },
]

// --- enchantments ---------------------------------------------------------

interface Rite {
  readonly seal: string
  readonly name: string
  readonly colour: number
  readonly kind: 'motes' | 'wash' | 'arcs' | 'ghost' | 'trail'
  readonly line: string
}

/**
 * Five inscriptions, each with ONE effect that is visible in a still frame.
 *
 * "Visible in a still frame" is the acceptance test, and it is stricter than it
 * sounds: an enchantment that only reads while moving cannot be judged in the
 * hub, cannot be compared against another item, and cannot be photographed by a
 * player asking whether the drop was any good.
 */
const RITES: readonly Rite[] = [
  {
    seal: '焰',
    name: 'Ember',
    colour: palette.cinnabar,
    kind: 'motes',
    line: 'Sparks rise from the hem. Burns what it cuts.',
  },
  {
    seal: '霜',
    name: 'Frost',
    colour: INDIGO,
    kind: 'wash',
    line: 'A cold wash clings to the figure. Slows what it cuts.',
  },
  {
    seal: '雷',
    name: 'Thunder',
    colour: palette.gold,
    kind: 'arcs',
    line: 'Arcs flicker off the blade. Strikes a second foe.',
  },
  {
    seal: '影',
    name: 'Shadow',
    colour: palette.inkSoft,
    kind: 'ghost',
    line: 'A second silhouette, half a step behind. Strikes twice, faintly.',
  },
  {
    seal: '毒',
    name: 'Venom',
    colour: MALACHITE,
    kind: 'trail',
    line: 'Green ink trails the sweep. What it cuts keeps bleeding.',
  },
]

const BLADE_ANGLE = 56

/** The aura markup for one effect, drawn behind or in front of the figure. */
function auraFor(
  kind: Rite['kind'],
  colour: number,
  seed: number,
  scale: number,
  gear: Gear,
): { behind: string; front: string } {
  const rng = new Rng(seed)
  const c = hex(colour)
  const behind: string[] = []
  const front: string[] = []

  switch (kind) {
    case 'motes': {
      // Rising, and thinning as they rise. Sixteen is enough to read as a
      // stream; more turns into a cloud and stops looking like brushwork.
      for (let i = 0; i < 16; i++) {
        const t = i / 16
        const x = (rng.next() - 0.5) * 26 * scale
        const yy = -(6 + t * 46 + rng.next() * 8) * scale
        const r = (2.1 - t * 1.3) * scale * (0.6 + rng.next() * 0.6)
        front.push(
          `<circle cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" r="${Math.max(0.4, r).toFixed(1)}" ` +
            `fill="${c}" fill-opacity="${(0.62 - t * 0.42).toFixed(2)}"/>`,
        )
      }
      break
    }
    case 'wash': {
      // A soft field behind the whole figure. This is the cheapest effect to
      // draw and the one that changes the silhouette's read the least, which is
      // exactly right for something meant to feel like cold air.
      behind.push(
        `<ellipse cx="0" cy="${-22 * scale}" rx="${30 * scale}" ry="${34 * scale}" ` +
          `fill="url(#wash-${seed})"/>`,
      )
      for (let i = 0; i < 7; i++) {
        const a = rng.next() * Math.PI * 2
        const d = (18 + rng.next() * 14) * scale
        front.push(
          `<path d="M ${(Math.cos(a) * d).toFixed(1)} ${(-24 * scale + Math.sin(a) * d).toFixed(1)} ` +
            `l ${(3 * scale).toFixed(1)} ${(-4 * scale).toFixed(1)}" stroke="${c}" ` +
            `stroke-width="${(1.1 * scale).toFixed(1)}" stroke-opacity="0.55" stroke-linecap="round"/>`,
        )
      }
      break
    }
    case 'arcs': {
      // Off the blade specifically, not the body: the point of Thunder is that
      // it is a property of the weapon, and the aura has to say which slot it
      // came from or enchantments become a single undifferentiated glow.
      const rad = (BLADE_ANGLE * Math.PI) / 180
      for (let i = 0; i < 5; i++) {
        const along = (14 + i * 7) * scale
        const bx = 8 * scale + Math.cos(rad) * along
        const by = -26 * scale + Math.sin(rad) * along
        const j = () => (rng.next() - 0.5) * 9 * scale
        front.push(
          `<path d="M ${bx.toFixed(1)} ${by.toFixed(1)} l ${j().toFixed(1)} ${j().toFixed(1)} ` +
            `l ${j().toFixed(1)} ${j().toFixed(1)}" fill="none" stroke="${c}" ` +
            `stroke-width="${(0.9 * scale).toFixed(1)}" stroke-opacity="0.75" stroke-linecap="round"/>`,
        )
      }
      break
    }
    case 'ghost': {
      // The figure itself, offset and faint. Costs nothing new to draw because
      // the geometry is already built, and it is the only effect here that
      // changes the SHAPE rather than adding light to it.
      const copy = buildSwordsmanTopDown(seed, scale, gear)
      const marks = [...copy.bleed, ...copy.body]
        .map((s) => strokeToPolygon(s, colour))
        .join('')
      behind.push(
        `<g transform="translate(${(-9 * scale).toFixed(1)},${(1.5 * scale).toFixed(1)})" ` +
          `opacity="0.28">${marks}</g>`,
      )
      break
    }
    case 'trail': {
      // The arc the sweep travels, left behind as wet ink. It is the only one
      // that shows what the weapon DOES rather than what it is.
      const r = 30 * scale
      front.push(
        `<path d="M ${(-r * 0.75).toFixed(1)} ${(-30 * scale).toFixed(1)} ` +
          `A ${r.toFixed(1)} ${(r * 0.72).toFixed(1)} 0 0 0 ${(r * 0.85).toFixed(1)} ${(-12 * scale).toFixed(1)}" ` +
          `fill="none" stroke="${c}" stroke-width="${(3.4 * scale).toFixed(1)}" ` +
          `stroke-opacity="0.42" stroke-linecap="round"/>`,
      )
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * (0.15 + rng.next() * 0.7)
        front.push(
          `<circle cx="${(-Math.cos(a) * r * 0.9).toFixed(1)}" ` +
            `cy="${(-26 * scale - Math.sin(a) * r * 0.35).toFixed(1)}" ` +
            `r="${(rng.next() * 1.8 * scale + 0.5).toFixed(1)}" fill="${c}" fill-opacity="0.5"/>`,
        )
      }
      break
    }
  }
  return { behind: behind.join(''), front: front.join('') }
}

/**
 * One figure, optionally accented and haloed.
 *
 * `accent` recolours the BLEED pass rather than the body. That choice is the
 * whole trick: the bleed is the wide faint pass that sells ink soaking into
 * paper, so tinting it reads as the piece glowing from within the paper, while
 * tinting the body would just produce a coloured cut-out and throw away the
 * silhouette the game depends on.
 */
function figure(
  gear: Gear,
  seed: number,
  scale: number,
  opts: { accent?: number | null; rite?: Rite; build?: number } = {},
): { markup: string; bottom: number; right: number } {
  const { accent = null, rite, build = 1 } = opts
  const swordsman = buildSwordsmanTopDown(seed, scale, gear, build)
  const parts: string[] = []
  let bottom = 6 * scale
  let right = 13 * scale * build

  const halo = rite ? auraFor(rite.kind, rite.colour, seed, scale, gear) : null
  if (halo) parts.push(halo.behind)

  parts.push(
    `<ellipse cx="0" cy="${2 * scale}" rx="${11 * scale * build}" ry="${3.4 * scale}" ` +
      `fill="${hex(palette.ink)}" fill-opacity="0.1"/>`,
  )

  const rad = (BLADE_ANGLE * Math.PI) / 180
  const originX = 8 * scale * build
  const originY = -26 * scale
  const blade = buildBlade(seed + 1, scale, gear.blade)
  for (const stroke of blade) {
    for (let i = 0; i < stroke.poly.length; i += 2) {
      const px = stroke.poly[i]!
      const py = stroke.poly[i + 1]!
      bottom = Math.max(bottom, originY + px * Math.sin(rad) + py * Math.cos(rad))
      right = Math.max(right, originX + px * Math.cos(rad) - py * Math.sin(rad))
    }
  }
  parts.push(
    `<g transform="translate(${originX},${originY}) rotate(${BLADE_ANGLE})">` +
      blade.map((s) => strokeToPolygon(s, palette.ink)).join('') +
      `</g>`,
  )

  // The bleed carries the accent; the body stays ink, always.
  for (const stroke of swordsman.bleed) {
    parts.push(
      accent === null
        ? strokeToPolygon(stroke, palette.ink)
        : strokeToPolygon({ poly: stroke.poly, alpha: stroke.alpha * 3.4 }, accent),
    )
  }
  for (const stroke of swordsman.body) {
    parts.push(strokeToPolygon(stroke, palette.ink))
    for (let i = 0; i < stroke.poly.length; i += 2) {
      bottom = Math.max(bottom, stroke.poly[i + 1]!)
      right = Math.max(right, stroke.poly[i]!)
    }
  }

  if (halo) parts.push(halo.front)
  return { markup: parts.join(''), bottom, right }
}

function gearOf(ids: readonly string[]): Gear {
  const best = new Map<Slot, Item>()
  for (const id of ids) {
    const item = ITEM_BY_ID.get(id)
    if (!item) continue
    const held = best.get(item.slot)
    if (!held || item.rarity > held.rarity) best.set(item.slot, item)
  }
  return gearFromIds({
    robe: best.get('robe')?.styleId,
    shoulders: best.get('shoulders')?.styleId,
    head: best.get('head')?.styleId,
    blade: best.get('weapon')?.styleId,
  })
}

function label(x: number, y: number, text: string, size: number, fill: string, op = 1): string {
  return (
    `<text x="${x}" y="${y}" text-anchor="middle" font-family="system-ui, sans-serif" ` +
    `font-size="${size}" fill="${fill}" fill-opacity="${op}">${text}</text>`
  )
}

/**
 * Greedy word wrap at a character budget.
 *
 * SVG `<text>` does not wrap, and the first version of this sheet simply ran
 * two of its explanatory notes off the right edge — the reader lost the end of
 * the sentence that justified the whole section. 13px system-ui averages about
 * 6.6px per character, so 1100px of usable width is roughly 165; 150 leaves
 * room for the wide characters.
 */
function wrap(text: string, budget = 150): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    if (line && line.length + 1 + word.length > budget) {
      lines.push(line)
      line = word
    } else {
      line = line ? `${line} ${word}` : word
    }
  }
  if (line) lines.push(line)
  return lines
}

function heading(y: number, seal: string, text: string, note: string): string {
  return (
    `<text x="40" y="${y}" font-family="system-ui, sans-serif" font-size="26" fill="${hex(palette.cinnabar)}">${seal}</text>` +
    `<text x="80" y="${y}" font-family="system-ui, sans-serif" font-size="21" fill="${hex(palette.ink)}">${text}</text>` +
    wrap(note)
      .map(
        (line, i) =>
          `<text x="40" y="${y + 24 + i * 18}" font-family="system-ui, sans-serif" font-size="13" ` +
          `fill="${hex(palette.ink)}" fill-opacity="0.55">${line}</text>`,
      )
      .join('')
  )
}

function columns(count: number, reach: number): (i: number) => number {
  const step = (W - 80 - reach) / count
  return (i) => 40 + step * (i + 0.5)
}

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
