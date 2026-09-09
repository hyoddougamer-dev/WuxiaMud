/** A flame changes a rule, never a number. If it can be written as "+15% to something", it does not ship. */
export interface Flame {
  readonly id: string
  readonly name: string
  readonly zh: string
  readonly rank: number
  readonly realm: number
  readonly rule: string
}

export const FLAMES: readonly Flame[] = [
  { id: 'bonechill', name: 'Bone-Chilling Flame', zh: '骨寒炎', rank: 7, realm: 3, rule: 'Your offline gains stop decaying. Blade Path stops being a punishment.' },
  { id: 'fallheart',  name: 'Falling Heart Flame', zh: '隕落心炎', rank: 6, realm: 5, rule: 'Breakthroughs cost half. Deviation risk doubles.' },
  { id: 'seaheart',   name: 'Sea-Heart Flame',     zh: '海心炎',  rank: 5, realm: 6, rule: 'Insight from breakthroughs counts twice.' },
]

export function flame(id: string): Flame | undefined {
  return FLAMES.find((f) => f.id === id)
}
