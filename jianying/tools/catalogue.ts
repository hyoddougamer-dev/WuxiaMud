/**
 * PROPOSAL sheet: every item, on its own, and the stat table redone.
 *
 *   npx tsx tools/catalogue.ts
 *
 * This is the base the forge was going to be built on top of without ever being
 * examined. Counting it first was the right call and the numbers were worse
 * than expected:
 *
 *   22 items, and 22 wardrobe styles. The table and the geometry are exactly
 *   the same size, so there is no headroom at all — every new item today needs
 *   new geometry before it can exist.
 *
 *   TEN stat kinds across sixteen armour pieces. Half of them appear on one or
 *   two items. That is not a system, it is sixteen exceptions, and it produces
 *   dead rows: +10 max health next to +28 max health is not a choice, it is an
 *   obsolete item.
 *
 * TWO DECISIONS, both confirmed before this was drawn.
 *
 * ONE SILHOUETTE PER SET, NOT PER ITEM. The original rule — no two items may
 * share a wardrobe style — sounded rigorous and was wrong. At the size the game
 * draws, four robes that differ by a few units of hem are four identical black
 * triangles; the rule bought nothing and capped the table at 22. A set now owns
 * a family look, and the four pieces inside it differ by SLOT. The same four
 * robes become four robes belonging to four different traditions, and the
 * difference finally means something.
 *
 * FOUR STATS, WITH A SCALE. Ten kinds collapse to four, each with a base value
 * that multiplies with rank. Every line is then comparable to every other line,
 * and a piece is never strictly worse than one you already have — it is lower
 * ranked, which is a thing you can fix at the forge.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { palette } from '../src/render/palette'
import { DEFAULT_GEAR, gearFromIds } from '../src/render/wardrobe'
import { ITEMS, type Slot } from '../src/data/items'
import { W, columns, figure, heading, hex, label } from './sheet'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'docs')

// --- the four stats -------------------------------------------------------

/**
 * Four kinds, and every one of them is something the player already watches on
 * the HUD during a run. A stat the player cannot see the effect of is a number
 * asking to be trusted, and this game has spent five documents learning that
 * asking to be trusted is the thing that makes it incomprehensible.
 */
interface StatKind {
  readonly seal: string
  readonly name: string
  /** What one point of it buys, quoted in the units the HUD uses. */
  readonly unit: string
  /** Value at rank 0. Rank multiplies it — see valueAt. */
  readonly base: number
  readonly perRank: number
}

const STATS: Record<string, StatKind> = {
  vigour: { seal: '体', name: 'Vigour', unit: 'max health', base: 14, perRank: 7 },
  edge: { seal: '锋', name: 'Edge', unit: 'sweep damage', base: 2, perRank: 1.2 },
  swift: { seal: '疾', name: 'Swift', unit: '% faster sweep', base: 3, perRank: 1.6 },
  reach: { seal: '远', name: 'Reach', unit: 'sweep range', base: 8, perRank: 4 },
}

const valueAt = (kind: StatKind, rank: number): string => {
  const v = kind.base + kind.perRank * rank
  return `+${v % 1 === 0 ? v : v.toFixed(1)} ${kind.unit}`
}

// --- the sets -------------------------------------------------------------

interface SetLine {
  readonly seal: string
  readonly name: string
  readonly stat: StatKind
  readonly blurb: string
  /** styleId per slot. Every one of these exists in the wardrobe today. */
  readonly pieces: Partial<Record<Slot, string>>
}

/**
 * Five sets and one unaligned pair, out of exactly the 22 items that exist.
 *
 * Nothing invented, nothing dropped. The Hemp Robe and the Straight Jian are
 * left deliberately outside any set: they are what a swordsman begins with, and
 * a starting kit that already belongs to a tradition would make the first
 * decision look already made.
 */
const SETS: readonly SetLine[] = [
  {
    seal: '龙泉',
    name: 'Dragon Spring',
    stat: STATS.swift!,
    blurb: 'The town that has forged for a thousand years. Nothing it makes is wrong.',
    pieces: { robe: 'travelling', shoulders: 'plain', head: 'topknot', weapon: 'dao' },
  },
  {
    seal: '干将',
    name: "The Smith's Sword",
    stat: STATS.vigour!,
    blurb: 'Forged the night its maker walked into his own furnace to make the metal run.',
    pieces: { robe: 'lamellar', shoulders: 'pauldron', head: 'veiled', weapon: 'great' },
  },
  {
    seal: '莫邪',
    name: 'Her Answer',
    stat: STATS.edge!,
    blurb: "Ganjiang's pair, and its opposite. Water where he was fire.",
    pieces: { robe: 'court', shoulders: 'mantle', head: 'crown', weapon: 'fan' },
  },
  {
    seal: '湛卢',
    name: 'The Black Sword',
    stat: STATS.reach!,
    blurb: 'It leaves an unjust king in the night, and is found next morning in another hand.',
    pieces: { robe: 'layered', shoulders: 'wide', head: 'hat', weapon: 'spear' },
  },
  {
    seal: '鱼肠',
    name: 'Fish-gut',
    stat: STATS.edge!,
    blurb: 'Short enough to be carried inside a served fish. Drawn once, at the table.',
    pieces: { robe: 'tattered', shoulders: 'bare', head: 'bare', weapon: 'twin' },
  },
  {
    seal: '无谱',
    name: 'Unaligned',
    stat: STATS.vigour!,
    blurb: 'What a swordsman is handed on the first day. It belongs to nobody.',
    pieces: { robe: 'plain', weapon: 'jian' },
  },
]

const SLOT_ORDER: readonly Slot[] = ['head', 'shoulders', 'robe', 'weapon']
const SLOT_SEAL: Record<Slot, string> = { head: '首', shoulders: '肩', robe: '袍', weapon: '兵' }

const nameOf = (slot: Slot, style: string): string =>
  ITEMS.find((i) => i.slot === slot && i.styleId === style)?.name ?? style

/** The full figure with exactly one slot swapped, so the piece reads in context. */
function gearWith(slot: Slot, style: string) {
  return gearFromIds({
    robe: slot === 'robe' ? style : DEFAULT_GEAR.robe.id,
    shoulders: slot === 'shoulders' ? style : DEFAULT_GEAR.shoulders.id,
    head: slot === 'head' ? style : DEFAULT_GEAR.head.id,
    blade: slot === 'weapon' ? style : DEFAULT_GEAR.blade.id,
  })
}

const rows: string[] = []
let y = 0

rows.push(
  `<text x="40" y="40" font-family="system-ui, sans-serif" font-size="15" letter-spacing="3" ` +
    `fill="${hex(palette.ink)}" fill-opacity="0.5">剑影 JIÀNYǏNG · EVERY ITEM, AND THE STAT TABLE REDONE — PROPOSAL</text>`,
  `<text x="40" y="62" font-family="system-ui, sans-serif" font-size="12.5" fill="${hex(palette.cinnabar)}">` +
    `All 22 items that exist today, regrouped into 5 sets. No item invented, no wardrobe style added. The stat lines and the ranks are the proposal.</text>`,
)
y = 62

// --- 1. rank marks per slot ----------------------------------------------
y += 54
rows.push(
  heading(
    y,
    '一',
    'Each slot is tempered in its own language',
    'A hole in my own earlier proposal, found by drawing the items separately instead of only the robe. Hems and belt cords are ROBE marks — a hat cannot grow a hem. Now you can tell WHICH piece was tempered, not merely that something was.',
  ),
)
y += 114

{
  const RANKS = [0, 2, 5]
  const cells: Array<{ markup: string; bottom: number; right: number }> = []
  const captions: Array<[string, string]> = []
  for (const slot of SLOT_ORDER) {
    for (const rank of RANKS) {
      const style =
        slot === 'robe' ? 'lamellar' : slot === 'shoulders' ? 'pauldron' : slot === 'head' ? 'hat' : 'dao'
      cells.push(
        figure(gearWith(slot, style), 301 + cells.length, 1.85, {
          accent: palette.gold,
          rank,
          rankSlot: slot,
        }),
      )
      captions.push([`${SLOT_SEAL[slot]} 阶 ${rank}`, rank === 0 ? nameOf(slot, style) : ''])
    }
  }
  const base = y + 132
  const capY = base + Math.max(...cells.map((c) => c.bottom)) + 22
  const x = columns(cells.length, Math.max(...cells.map((c) => c.right)))
  cells.forEach((cell, i) => {
    rows.push(`<g transform="translate(${x(i)},${base})">${cell.markup}</g>`)
    rows.push(label(x(i), capY, captions[i]![0], 12, hex(palette.cinnabar), i % 3 === 0 ? 0.55 : 1))
    if (captions[i]![1]) rows.push(label(x(i), capY + 16, captions[i]![1], 9.5, hex(palette.ink), 0.45))
  })
  y = capY + 62
}

// --- 2. the stat table ----------------------------------------------------
y += 22
rows.push(
  heading(
    y,
    '二',
    'Ten stat kinds become four, and every one has a scale',
    'Ten kinds across sixteen armour pieces was not a system, it was sixteen exceptions — and it produced dead rows: +10 max health beside +28 is an obsolete item, not a choice. Four kinds, each rising with rank, means no piece is ever strictly worse than one you own. It is lower ranked, and that is fixable.',
  ),
)
y += 114

{
  const kinds = Object.values(STATS)
  const step = (W - 80) / kinds.length
  kinds.forEach((k, i) => {
    const x0 = 40 + step * i + 6
    rows.push(
      `<rect x="${x0}" y="${y}" width="${step - 12}" height="112" fill="${hex(palette.ink)}" fill-opacity="0.04" rx="3"/>`,
      `<text x="${x0 + 16}" y="${y + 36}" font-family="serif" font-size="25" fill="${hex(palette.cinnabar)}">${k.seal}</text>`,
      `<text x="${x0 + 48}" y="${y + 34}" font-family="system-ui, sans-serif" font-size="14" fill="${hex(palette.ink)}">${k.name}</text>`,
      `<text x="${x0 + 16}" y="${y + 62}" font-family="system-ui, sans-serif" font-size="11" fill="${hex(palette.goldDeep)}">阶 0 → ${valueAt(k, 0)}</text>`,
      `<text x="${x0 + 16}" y="${y + 80}" font-family="system-ui, sans-serif" font-size="11" fill="${hex(palette.goldDeep)}">阶 5 → ${valueAt(k, 5)}</text>`,
      `<text x="${x0 + 16}" y="${y + 100}" font-family="system-ui, sans-serif" font-size="10" fill="${hex(palette.ink)}" fill-opacity="0.45">a fully tempered piece is worth ${(((k.base + k.perRank * 5) / k.base) * 100 - 100).toFixed(0)}% more</text>`,
    )
  })
  y += 142
}

// --- 3. every item --------------------------------------------------------
y += 22
rows.push(
  heading(
    y,
    '三',
    'All twenty-two, one at a time',
    'Each figure differs from the default swordsman in exactly one slot, so what you are looking at is that piece and nothing else. Left is found, right is fully tempered. The set decides which stat the line carries; the slot decides the shape.',
  ),
)
y += 108

for (const set of SETS) {
  const slots = SLOT_ORDER.filter((s) => set.pieces[s])
  rows.push(
    `<text x="40" y="${y}" font-family="serif" font-size="20" fill="${hex(palette.cinnabar)}">${set.seal}</text>`,
    `<text x="${40 + set.seal.length * 21}" y="${y}" font-family="system-ui, sans-serif" font-size="15" fill="${hex(palette.ink)}">${set.name}</text>`,
    `<text x="${40 + set.seal.length * 21 + set.name.length * 8 + 16}" y="${y}" font-family="system-ui, sans-serif" ` +
      `font-size="12" fill="${hex(palette.cinnabar)}" fill-opacity="0.8">${set.stat.seal} ${set.stat.name}</text>`,
    `<text x="40" y="${y + 19}" font-family="system-ui, sans-serif" font-size="11" fill="${hex(palette.ink)}" fill-opacity="0.45">${set.blurb}</text>`,
  )

  const base = y + 178
  const cells: Array<{ markup: string; bottom: number; right: number }> = []
  for (const slot of slots) {
    const style = set.pieces[slot]!
    cells.push(figure(gearWith(slot, style), 401 + cells.length, 1.9, { rank: 0, rankSlot: slot }))
    cells.push(
      figure(gearWith(slot, style), 401 + cells.length, 1.9, {
        accent: palette.gold,
        rank: 5,
        rankSlot: slot,
      }),
    )
  }
  const capY = base + Math.max(...cells.map((c) => c.bottom)) + 22
  // Two figures per item, so the grid is laid out in pairs and the caption is
  // centred between them.
  const x = columns(cells.length, Math.max(...cells.map((c) => c.right)))
  cells.forEach((cell, i) => rows.push(`<g transform="translate(${x(i)},${base})">${cell.markup}</g>`))
  slots.forEach((slot, k) => {
    const mid = (x(k * 2) + x(k * 2 + 1)) / 2
    rows.push(label(mid, capY, `${SLOT_SEAL[slot]}  ${nameOf(slot, set.pieces[slot]!)}`, 12, hex(palette.ink), 0.78))
    rows.push(
      label(
        mid,
        capY + 17,
        slot === 'weapon' ? 'the weapon is the line' : valueAt(set.stat, 0),
        10.5,
        hex(palette.goldDeep),
        0.85,
      ),
    )
    rows.push(
      label(
        mid,
        capY + 32,
        slot === 'weapon' ? 'reach · arc · rhythm' : `阶 5 → ${valueAt(set.stat, 5)}`,
        10,
        hex(palette.ink),
        0.42,
      ),
    )
  })
  y = capY + 74
}

// --- what this costs ------------------------------------------------------
y += 8
rows.push(
  `<rect x="40" y="${y}" width="${W - 80}" height="106" fill="${hex(palette.ink)}" fill-opacity="0.04"/>`,
  `<text x="60" y="${y + 28}" font-family="system-ui, sans-serif" font-size="13" fill="${hex(palette.cinnabar)}">What is left open</text>`,
  `<text x="60" y="${y + 52}" font-family="system-ui, sans-serif" font-size="12" fill="${hex(palette.ink)}" fill-opacity="0.6">The table is still only 22 items, which is a handful of expeditions before you own all of them. Ranks buy depth without new items — a set you own</text>`,
  `<text x="60" y="${y + 70}" font-family="system-ui, sans-serif" font-size="12" fill="${hex(palette.ink)}" fill-opacity="0.6">at 阶 0 is not the same as one at 阶 5 — but that is a stopgap, not an answer. Set-family silhouettes are what makes more items cheap later.</text>`,
  `<text x="60" y="${y + 92}" font-family="system-ui, sans-serif" font-size="12" fill="${hex(palette.ink)}" fill-opacity="0.6">Also open: the two sets sharing 锋 Edge. Five sets and four stats do not divide, and pretending otherwise would be a worse answer than saying so.</text>`,
)
y += 130

const H = y + 30
const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
  `<rect width="${W}" height="${H}" fill="${hex(palette.paper)}"/>` +
  rows.join('') +
  `</svg>`

await mkdir(OUT, { recursive: true })
await writeFile(join(OUT, 'catalogue.svg'), svg, 'utf8')
console.log(`sheet:  ${join(OUT, 'catalogue.svg')}`)
console.log(`items:  ${SETS.reduce((n, s) => n + Object.keys(s.pieces).length, 0)} placed of ${ITEMS.length} that exist`)
console.log(`stats:  ${Object.keys(STATS).length} kinds, down from 10`)
