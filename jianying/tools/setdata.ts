/**
 * The item table as it is being proposed: four stats, five sets, twenty-two
 * items — and not one of those items invented.
 *
 * Split out of tools/catalogue.ts the moment a second sheet needed it. Two
 * copies of a set definition would let two sheets disagree about what a set
 * IS, which is the exact failure these documents exist to prevent.
 */
import { DEFAULT_GEAR, gearFromIds } from '../src/render/wardrobe'
import { ITEMS, statAt, type Slot } from '../src/data/items'

// --- the four stats -------------------------------------------------------

/**
 * Four kinds, and every one of them is something the player already watches on
 * the HUD during a run. A stat the player cannot see the effect of is a number
 * asking to be trusted, and this game has spent five documents learning that
 * asking to be trusted is the thing that makes it incomprehensible.
 */
export interface StatKind {
  readonly seal: string
  readonly name: string
  /** What the card says it grants, in the words the card uses. */
  readonly unit: string
}

/**
 * The four the GAME has, not four this sheet invented.
 *
 * This used to read 体 锋 疾 远 — Vigour, Edge, Swift, Reach — which was a
 * proposal written before the game had a stat model, and it stayed here after
 * the game settled on 体 锋 疾 神. A contact sheet advertising a stat that does
 * not exist is worse than no sheet: it is a document that reads as authority
 * and is wrong. Kept in step with meta/character.ts ATTRIBUTES.
 */
export const STATS: Record<string, StatKind> = {
  vigour: { seal: '体', name: 'Body', unit: 'Body' },
  edge: { seal: '锋', name: 'Edge', unit: 'Edge' },
  swift: { seal: '疾', name: 'Swiftness', unit: 'Swiftness' },
  reach: { seal: '神', name: 'Spirit', unit: 'Spirit' },
}

/**
 * What a piece's line is worth at `rank`, phrased as the card phrases it.
 *
 * Delegates to the game's own `statAt` rather than carrying a second curve —
 * two curves would drift, and this sheet exists to be checked against.
 */
export const valueAt = (kind: StatKind, rank: number, amount = 3): string =>
  `+${statAt({ kind: 'body', amount }, rank)} ${kind.unit}`

// --- the sets -------------------------------------------------------------

export interface SetLine {
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
export const SETS: readonly SetLine[] = [
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

export const SLOT_ORDER: readonly Slot[] = ['head', 'shoulders', 'robe', 'weapon']
export const SLOT_SEAL: Record<Slot, string> = { head: '首', shoulders: '肩', robe: '袍', weapon: '兵' }

export const nameOf = (slot: Slot, style: string): string =>
  ITEMS.find((i) => i.slot === slot && i.styleId === style)?.name ?? style

/** The full figure with exactly one slot swapped, so the piece reads in context. */
export function gearWith(slot: Slot, style: string) {
  return gearFromIds({
    robe: slot === 'robe' ? style : DEFAULT_GEAR.robe.id,
    shoulders: slot === 'shoulders' ? style : DEFAULT_GEAR.shoulders.id,
    head: slot === 'head' ? style : DEFAULT_GEAR.head.id,
    blade: slot === 'weapon' ? style : DEFAULT_GEAR.blade.id,
  })
}

