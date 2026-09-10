/** Cultivator names. A seal means nothing on a nameless character. */
const SURNAMES = ['Lin', 'Yuwen', 'Shen', 'Mei', 'Xiao', 'Han', 'Cang', 'Bai',
                  'Nie', 'Su', 'Gu', 'Wei', 'Tang', 'Yan', 'Qiu', 'Luo']
const GIVEN = ['Ke', 'Bai', 'Qiao', 'Lan', 'Yan', 'Zhi', 'Wu', 'Jing',
               'Xun', 'Rui', 'Mo', 'Chen', 'Yi', 'Ning', 'Hua', 'Shan']

/** The seals a cultivator may sign with. One character, chosen once, kept forever. */
export const SEALS = ['林', '玄', '雲', '劍', '道', '寒', '火', '風', '山', '心', '影', '天'] as const
export type Seal = (typeof SEALS)[number]

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
