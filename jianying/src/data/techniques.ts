/**
 * Techniques — the choices that make one run differ from the next.
 *
 * Two kinds live here, and the distinction matters more than it looks:
 *
 *   - MODIFIERS sharpen what you already do (harder, faster, wider). They are
 *     satisfying but they never change the picture on screen.
 *   - ARTS add a new thing that acts on its own (orbiting blades, thrown qi).
 *     They are what fills the screen by minute three, and what a player
 *     actually remembers about a run.
 *
 * A pool of only modifiers produces a bigger number and an identical game. The
 * level-up draw therefore biases toward offering an art the player does not yet
 * have — see `offerTechniques`.
 */

export type TechniqueKind = 'modifier' | 'art'

export interface Technique {
  readonly id: string
  readonly name: string
  /** One line, shown on the level-up card. */
  readonly blurb: string
  readonly kind: TechniqueKind
  /** How many times it can be taken. */
  readonly maxLevel: number
  /** Relative draw weight. */
  readonly weight: number
}

export const TECHNIQUES: readonly Technique[] = [
  // --- modifiers -------------------------------------------------------
  {
    id: 'keen',
    name: 'Keen Edge',
    blurb: '+4 damage per sweep',
    kind: 'modifier',
    maxLevel: 6,
    weight: 100,
  },
  {
    id: 'swift',
    name: 'Swift Hand',
    blurb: 'Sweep 14% more often',
    kind: 'modifier',
    maxLevel: 6,
    weight: 100,
  },
  {
    id: 'reach',
    name: 'Long Reach',
    blurb: '+16 sweep range',
    kind: 'modifier',
    maxLevel: 5,
    weight: 90,
  },
  {
    id: 'wide',
    name: 'Encircling Step',
    blurb: 'Widen the arc',
    kind: 'modifier',
    maxLevel: 4,
    weight: 80,
  },
  {
    id: 'fleet',
    name: 'Cloud Stride',
    blurb: '+9% movement speed',
    kind: 'modifier',
    maxLevel: 5,
    weight: 85,
  },
  {
    id: 'greed',
    name: 'Gathering Palm',
    blurb: 'Draw qi from much further',
    kind: 'modifier',
    maxLevel: 4,
    weight: 80,
  },
  {
    id: 'vigour',
    name: 'Iron Skin',
    blurb: '+25 max health, and heal for it',
    kind: 'modifier',
    maxLevel: 4,
    weight: 75,
  },

  // --- arts ------------------------------------------------------------
  {
    id: 'orbit',
    name: 'Guardian Blades',
    blurb: 'Swords circle you, cutting all they touch',
    kind: 'art',
    maxLevel: 5,
    weight: 70,
  },
  {
    id: 'bolt',
    name: 'Sword Qi',
    blurb: 'Loose a blade of qi at the nearest foe',
    kind: 'art',
    maxLevel: 5,
    weight: 70,
  },
  {
    id: 'nova',
    name: 'Thunder Palm',
    blurb: 'A shockwave bursts from you at intervals',
    kind: 'art',
    maxLevel: 4,
    weight: 60,
  },
] as const

export const TECHNIQUE_BY_ID = new Map(TECHNIQUES.map((t) => [t.id, t]))

/** Levels taken, keyed by technique id. */
export type Loadout = Map<string, number>

/** XP needed to go from `level` to the next one. */
export function xpForLevel(level: number): number {
  // Gentle curve: early levels arrive fast so the player learns that killing
  // leads to choosing, then it stretches so later picks feel earned.
  return Math.round(5 + level * 3.2 + level * level * 0.55)
}

/**
 * Picks three techniques to offer.
 *
 * Maxed techniques are excluded. Arts the player does not yet own get a heavy
 * bonus, because a run made only of stat bumps looks identical at minute one
 * and minute five — and looking different is most of the reward.
 */
export function offerTechniques(loadout: Loadout, roll: () => number, count = 3): Technique[] {
  const candidates = TECHNIQUES.filter((t) => (loadout.get(t.id) ?? 0) < t.maxLevel)
  const chosen: Technique[] = []
  const pool = candidates.slice()

  while (chosen.length < count && pool.length > 0) {
    const weights = pool.map((t) => {
      const owned = loadout.get(t.id) ?? 0
      // A new art is the most interesting thing that can happen to a run.
      if (t.kind === 'art' && owned === 0) return t.weight * 2.4
      return t.weight
    })
    const total = weights.reduce((a, b) => a + b, 0)
    let target = roll() * total
    let index = pool.length - 1
    for (let i = 0; i < pool.length; i++) {
      target -= weights[i]!
      if (target <= 0) {
        index = i
        break
      }
    }
    chosen.push(pool[index]!)
    pool.splice(index, 1)
  }

  return chosen
}
