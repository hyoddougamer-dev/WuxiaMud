/** Three materials, one per beast rank. Deliberately few: a crafting screen with
 *  twelve reagents is depth you read about, not depth you feel. */
export type MaterialId = 'hide' | 'core' | 'essence'

export interface Material {
  readonly id: MaterialId
  readonly name: string
  readonly zh: string
  readonly rank: 1 | 2 | 3
}

export const MATERIALS: readonly Material[] = [
  { id: 'hide',    name: 'Beast Hide',   zh: '獸皮', rank: 1 },
  { id: 'core',    name: 'Spirit Core',  zh: '妖丹', rank: 2 },
  { id: 'essence', name: 'True Essence', zh: '真元', rank: 3 },
]

export const MATERIAL_FOR_RANK: Record<1 | 2 | 3, MaterialId> = {
  1: 'hide', 2: 'core', 3: 'essence',
}

export type Satchel = Partial<Record<MaterialId, number>>

export function count(sat: Satchel, id: MaterialId): number {
  return sat[id] ?? 0
}

export function add(sat: Satchel, id: MaterialId, n: number): Satchel {
  return { ...sat, [id]: count(sat, id) + n }
}

export function canPay(sat: Satchel, cost: Satchel): boolean {
  return Object.entries(cost).every(([k, v]) => count(sat, k as MaterialId) >= (v ?? 0))
}

export function pay(sat: Satchel, cost: Satchel): Satchel {
  const next: Satchel = { ...sat }
  for (const [k, v] of Object.entries(cost)) {
    next[k as MaterialId] = count(sat, k as MaterialId) - (v ?? 0)
  }
  return next
}
