/** Cultivator names. A seal means nothing on a nameless character. */
const SURNAMES = ['Lin', 'Yuwen', 'Shen', 'Mei', 'Xiao', 'Han', 'Cang', 'Bai',
                  'Nie', 'Su', 'Gu', 'Wei', 'Tang', 'Yan', 'Qiu', 'Luo']
const GIVEN = ['Ke', 'Bai', 'Qiao', 'Lan', 'Yan', 'Zhi', 'Wu', 'Jing',
               'Xun', 'Rui', 'Mo', 'Chen', 'Yi', 'Ning', 'Hua', 'Shan']

/** The seals a cultivator may sign with. One character, chosen once, kept forever. */
export const SEAL_MEANING = {
  '林': 'forest',   '玄': 'profound', '雲': 'cloud',  '劍': 'sword',
  '道': 'the way',  '寒': 'cold',     '火': 'fire',   '風': 'wind',
  '山': 'mountain', '心': 'heart',    '影': 'shadow', '天': 'heaven',
} as const

export const SEALS = Object.keys(SEAL_MEANING) as (keyof typeof SEAL_MEANING)[]
export type Seal = keyof typeof SEAL_MEANING

export function randomName(roll: () => number): string {
  const s = SURNAMES[Math.floor(roll() * SURNAMES.length)]
  const g = GIVEN[Math.floor(roll() * GIVEN.length)]
  return `${s} ${g}`
}

export function randomSeal(roll: () => number): Seal {
  return SEALS[Math.floor(roll() * SEALS.length)]
}

/** Names are shown to nobody but the player for now, and still get sanitised —
 *  because the day the line reaches other players, this text goes with it. */
export function cleanName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, 24)
}
