import type { MaterialId, Satchel } from './materials.ts'

export type PillId = 'settling' | 'tribulation' | 'gathering'

export interface Pill {
  readonly id: PillId
  readonly name: string
  readonly zh: string
  readonly cost: Partial<Record<MaterialId, number>>
  readonly text: string
}

export const PILLS: readonly Pill[] = [
  { id: 'settling',    name: 'Settling Pill',    zh: '定心丹', cost: { hide: 3 },            text: 'Quiets 45 turmoil at once.' },
  { id: 'tribulation', name: 'Tribulation Pill', zh: '渡劫丹', cost: { hide: 2, core: 1 },   text: 'Adds 20% to your next tribulation. Held until spent.' },
  { id: 'gathering',   name: 'Gathering Pill',   zh: '聚氣丹', cost: { core: 1 },            text: 'Two hours of qi, immediately.' },
]

export function pill(id: PillId): Pill | undefined {
  return PILLS.find((p) => p.id === id)
}

export type PillBag = Partial<Record<PillId, number>>

export function held(bag: PillBag, id: PillId): number {
  return bag[id] ?? 0
}

export function brewable(sat: Satchel, p: Pill): boolean {
  return Object.entries(p.cost).every(([k, v]) => (sat[k as MaterialId] ?? 0) >= (v ?? 0))
}
