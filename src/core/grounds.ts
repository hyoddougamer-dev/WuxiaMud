import { BEASTS, type Beast } from './beasts.ts'

/**
 * 洞天 Hunting grounds.
 *
 * The hunt was the one thing a player actually presses — two hundred and fifty times
 * in a Sword life, eight hundred in a Blade one — and it contained no decision at all.
 * You pressed Hunt and a random beast from every beast in the game appeared. Once
 * meridians made materials the currency of all permanent power, an undecidable loop
 * at the centre of the game was the most expensive shallow thing left in it.
 *
 * A ground is a choice with a price. Each holds three beasts and therefore leans
 * toward one material; each stirs the heart by a fixed amount every time you hunt
 * there. So the question stops being "shall I hunt" and becomes "I need cores, and
 * Cinder Wood costs me one turmoil a trip, and I have a tribulation waiting" — a
 * decision priced in a currency the game already has, rather than a new resource.
 *
 * The danger numbers are small on purpose, and a simulation is why. They started at
 * 0/1/2/3/4/6 and blocked the Sword Path outright: a player who opens the game once a
 * day banks twenty-four hours of cultivation in one go and arrives with thirty-five
 * turmoil already on the meter, so four trips to the Sunken Palace at four apiece was
 * never affordable — and the Sunken Palace is the only place True Essence drops.
 * A ground must be a cost you weigh, never a door that a play schedule closes.
 */
export interface Ground {
  readonly id: string
  readonly name: string
  readonly zh: string
  /** The realm that opens it. The ground gates its beasts, not the other way round. */
  readonly realm: number
  /** Turmoil added by one hunt here. The whole risk axis of the choice. */
  readonly danger: number
  /** Added to every material haul taken here. Deeper ground, fuller satchel. */
  readonly bonus: number
  readonly note: string
  readonly beasts: readonly string[]
}

export const GROUNDS: readonly Ground[] = [
  {
    id: 'ash', name: 'Ash Slopes', zh: '灰坡', realm: 1, danger: 0, bonus: 0,
    note: 'Grey scrub above the last village. Nothing here is worth much and nothing here bites back.',
    beasts: ['hare', 'beetle', 'shrike'],
  },
  {
    id: 'marsh', name: 'Reed Marsh', zh: '蘆沼', realm: 2, danger: 1, bonus: 0,
    note: 'Standing water that never freezes. The first place a cultivator finds something with a core in it.',
    beasts: ['serpent', 'crane', 'toad'],
  },
  {
    id: 'wood', name: 'Cinder Wood', zh: '燼林', realm: 4, danger: 1, bonus: 1,
    note: 'Burnt a century ago and still warm underfoot. Everything that lives here learned to.',
    beasts: ['fox', 'ape', 'moth'],
  },
  {
    id: 'ridge', name: 'Thunder Ridge', zh: '雷脊', realm: 5, danger: 2, bonus: 1,
    note: 'Storms sit on it for weeks. What survives up there is worth the climb and knows it.',
    beasts: ['tiger', 'boar', 'lynx'],
  },
  {
    id: 'palace', name: 'Sunken Palace', zh: '沉宮', realm: 6, danger: 2, bonus: 2,
    note: 'A sect that argued with the heavens and lost. Its guardians are still at their posts.',
    beasts: ['roc', 'turtle', 'drake'],
  },
  {
    id: 'scar', name: 'The Scar', zh: '天裂', realm: 7, danger: 3, bonus: 2,
    note: 'Where the sky was opened and not closed again. Cultivators who went in changed into what comes out.',
    beasts: ['qilin', 'wraith', 'hydra'],
  },
]

export function ground(id: string): Ground {
  return GROUNDS.find((g) => g.id === id) ?? GROUNDS[0]
}

export const FIRST_GROUND = GROUNDS[0].id

export function groundsAt(realmId: number): Ground[] {
  return GROUNDS.filter((g) => g.realm <= realmId)
}

export function openAt(g: Ground, realmId: number): boolean {
  return realmId >= g.realm
}

/** The beasts of a ground, in the order they are listed. */
export function quarryOf(g: Ground): Beast[] {
  return g.beasts.map((id) => BEASTS.find((b) => b.id === id)).filter((b): b is Beast => !!b)
}

/**
 * Which ground a beast lives in — the single source of truth for "when can I hunt
 * this". A beast carried its own realm before grounds existed, and two numbers that
 * must agree are one number too many.
 */
export function groundOf(beastId: string): Ground | undefined {
  return GROUNDS.find((g) => g.beasts.includes(beastId))
}

export function beastRealm(beastId: string): number {
  return groundOf(beastId)?.realm ?? 1
}
