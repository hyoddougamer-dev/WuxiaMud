import { realm } from './realms.ts'

export type EffectKind = 'rate' | 'offlineCap' | 'breakthrough' | 'insight'

export interface Technique {
  readonly id: string
  readonly name: string
  readonly zh: string
  readonly glyph: string
  /** Realm at which it becomes available. */
  readonly realm: number
  /** Insight cost to learn. */
  readonly cost: number
  readonly kind: EffectKind
  /** Qi per second, as a fraction of the base rate at the realm it unlocks.
   *  Constant in absolute terms, so a cheap early art stays cheap forever and a
   *  late one costs a third of your output the day you can equip it. */
  readonly upkeep: number
  /** rate/breakthrough/insight: fraction. offlineCap: hours. */
  readonly value: number
  readonly text: string
}

export const TECHNIQUES: readonly Technique[] = [
  { id: 'frost',      name: 'Frost Palm',        zh: '寒掌', glyph: 'g-frost',     realm: 1, cost: 2,   upkeep: 0.12, kind: 'rate',         value: 0.10, text: '+10% qi generation' },
  { id: 'thread',     name: 'Single Thread',     zh: '一線', glyph: 'g-thread',    realm: 1, cost: 2,   upkeep: 0.10, kind: 'breakthrough', value: 0.06, text: '−6% breakthrough cost' },
  { id: 'cloud',      name: 'Cloud Step',        zh: '踏雲', glyph: 'g-cloud',     realm: 1, cost: 3,   upkeep: 0.14, kind: 'offlineCap',   value: 2,    text: '+2h offline cap' },
  { id: 'wind',       name: 'Wind Trace',        zh: '風痕', glyph: 'g-wind',      realm: 2, cost: 5,   upkeep: 0.16, kind: 'rate',         value: 0.14, text: '+14% qi generation' },
  { id: 'bell',       name: 'Golden Bell',       zh: '金鐘', glyph: 'g-bell',      realm: 2, cost: 6,   upkeep: 0.14, kind: 'breakthrough', value: 0.10, text: '−10% breakthrough cost' },
  { id: 'bone',       name: 'Bone Freeze',       zh: '冰骨', glyph: 'g-bone',      realm: 2, cost: 6,   upkeep: 0.12, kind: 'insight',      value: 0.25, text: '+25% insight from breakthroughs' },
  { id: 'swordrain',  name: 'Sword Rain',        zh: '劍雨', glyph: 'g-swordrain', realm: 3, cost: 10,  upkeep: 0.20, kind: 'rate',         value: 0.20, text: '+20% qi generation' },
  { id: 'void',       name: 'Void Step',         zh: '虛步', glyph: 'g-void',      realm: 3, cost: 12,  upkeep: 0.24, kind: 'offlineCap',   value: 4,    text: '+4h offline cap' },
  { id: 'thunder',    name: 'Thunder Call',      zh: '引雷', glyph: 'g-thunder',   realm: 3, cost: 14,  upkeep: 0.26, kind: 'rate',         value: 0.24, text: '+24% qi generation' },
  { id: 'pillfire',   name: 'Pill Fire',         zh: '丹火', glyph: 'g-pillfire',  realm: 4, cost: 22,  upkeep: 0.20, kind: 'insight',      value: 0.40, text: '+40% insight from breakthroughs' },
  { id: 'heart',      name: 'Heart Demon',       zh: '心魔', glyph: 'g-heart',     realm: 4, cost: 26,  upkeep: 0.30, kind: 'rate',         value: 0.34, text: '+34% qi generation' },
  { id: 'blood',      name: 'Blood Escape',      zh: '血遁', glyph: 'g-blood',     realm: 4, cost: 28,  upkeep: 0.22, kind: 'breakthrough', value: 0.16, text: '−16% breakthrough cost' },
  { id: 'serpent',    name: 'Serpent Bond',      zh: '蛇契', glyph: 'g-cauldron',  realm: 5, cost: 44,  upkeep: 0.34, kind: 'rate',         value: 0.45, text: '+45% qi generation' },
  { id: 'cauldron',   name: 'Cauldron Breath',   zh: '爐息', glyph: 'g-stone',     realm: 5, cost: 50,  upkeep: 0.28, kind: 'offlineCap',   value: 6,    text: '+6h offline cap' },
  { id: 'talisman',   name: 'Sealing Talisman',  zh: '封符', glyph: 'g-talisman',  realm: 6, cost: 78,  upkeep: 0.24, kind: 'breakthrough', value: 0.22, text: '−22% breakthrough cost' },
  { id: 'flysword',   name: 'Riding the Sword',  zh: '御劍', glyph: 'g-flysword',  realm: 6, cost: 86,  upkeep: 0.38, kind: 'rate',         value: 0.60, text: '+60% qi generation' },
  { id: 'ninewinter', name: 'Nine Winters Palm', zh: '九冬', glyph: 'g-frost',     realm: 7, cost: 130, upkeep: 0.46, kind: 'rate',         value: 0.85, text: '+85% qi generation' },
  { id: 'unbroken',   name: 'Unbroken Thread',   zh: '不斷', glyph: 'g-thread',    realm: 7, cost: 150, upkeep: 0.30, kind: 'insight',      value: 0.75, text: '+75% insight from breakthroughs' },
]

export function technique(id: string): Technique | undefined {
  return TECHNIQUES.find((t) => t.id === id)
}

/** Slots open as the player climbs. Six is the ceiling in release one. */
export function slotsAt(realmId: number): number {
  return 2 + [2, 3, 5, 7].filter((r) => realmId >= r).length
}

/** Absolute qi/second an equipped art costs, fixed at the realm it unlocks. */
export function upkeepOf(t: Technique): number {
  return t.upkeep * realm(t.realm).rate
}
