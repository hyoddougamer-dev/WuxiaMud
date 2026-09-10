/** The nine realms. Release one lets the player reach realm 7; 8 and 9 are visible and locked. */
export interface Realm {
  readonly id: number
  readonly name: string
  readonly zh: string
  /** Qi required to break through *from* this realm to the next. */
  readonly cost: number
  /** Multiplier applied to base qi generation while in this realm. */
  readonly rate: number
}

export const V1_CEILING = 7

/**
 * Cost is derived, not invented: cost = (seconds this realm should take) × (its rate).
 *
 * The first table was written by eye and a simulation of real play found the whole
 * climb lasted between two and eight days — costs grew about 7× per realm while the
 * rate grew 3.3×, so the two nearly cancelled and the game ended in an afternoon.
 * These are built from the times below, which escalate about 5× per realm: three
 * minutes to the first breakthrough, roughly a month to the last.
 *
 *   realm   1     2      3       4      5       6        7
 *   time    3m    15m    1.25h   6h     1.3d    6.4d     30d
 */
export const REALMS: readonly Realm[] = [
  { id: 1, name: 'Qi Refining',     zh: '練氣', cost: 1.8e2, rate: 1 },
  { id: 2, name: 'Foundation',      zh: '築基', cost: 2.9e3, rate: 3.2 },
  { id: 3, name: 'Golden Core',     zh: '金丹', cost: 4.5e4, rate: 10 },
  { id: 4, name: 'Nascent Soul',    zh: '元嬰', cost: 7.3e5, rate: 33 },
  { id: 5, name: 'Spirit Severing', zh: '化神', cost: 1.2e7, rate: 108 },
  { id: 6, name: 'Void Refining',   zh: '煉虛', cost: 1.9e8, rate: 350 },
  { id: 7, name: 'Unity',           zh: '合體', cost: 3.0e9, rate: 1150 },
  { id: 8, name: 'Great Vehicle',   zh: '大乘', cost: 5.0e10, rate: 3800 },
  { id: 9, name: 'Tribulation',     zh: '渡劫', cost: Infinity, rate: 12500 },
]

export function realm(id: number): Realm {
  return REALMS[Math.min(Math.max(id, 1), REALMS.length) - 1]
}

/** Nine-step ember ramp. Realm colour is the single most-read piece of state in the game. */
export const REALM_COLOUR: readonly string[] = [
  '#7C3411', '#91400F', '#A64F12', '#BC6016', '#D0741C',
  '#E08E2C', '#EDA948', '#F6C673', '#FCE2AA',
]

export function realmColour(id: number): string {
  return REALM_COLOUR[Math.min(Math.max(id, 1), REALM_COLOUR.length) - 1]
}
