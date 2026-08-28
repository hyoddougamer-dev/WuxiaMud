/**
 * The item table as it is being proposed: four stats, five sets, twenty-two
 * items — and not one of those items invented.
 *
 * Split out of tools/catalogue.ts the moment a second sheet needed it. Two
 * copies of a set definition would let two sheets disagree about what a set
 * IS, which is the exact failure these documents exist to prevent.
 */
import { DEFAULT_GEAR, gearFromIds } from '../src/render/wardrobe'
import { ITEMS, type Slot } from '../src/data/items'

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
  /** What one point of it buys, quoted in the units the HUD uses. */
  readonly unit: string
  /** Value at rank 0. Rank multiplies it — see valueAt. */
  readonly base: number
  readonly perRank: number
}

export const STATS: Record<string, StatKind> = {
  vigour: { seal: '体', name: 'Vigour', unit: 'max health', base: 14, perRank: 7 },
  edge: { seal: '锋', name: 'Edge', unit: 'sweep damage', base: 2, perRank: 1.2 },
  swift: { seal: '疾', name: 'Swift', unit: '% faster sweep', base: 3, perRank: 1.6 },
  reach: { seal: '远', name: 'Reach', unit: 'sweep range', base: 8, perRank: 4 },
}

export const valueAt = (kind: StatKind, rank: number): string => {
  const v = kind.base + kind.perRank * rank
  return `+${v % 1 === 0 ? v : v.toFixed(1)} ${kind.unit}`
}

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

