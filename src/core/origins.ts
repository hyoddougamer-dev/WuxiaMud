import type { MaterialId } from './materials.ts'
import type { PillId } from './pills.ts'

/**
 * 出身. Where you were before any of this.
 *
 * The path answers "when do you play"; the origin answers "what did you bring".
 * Each one is a starting kit *and* a trait that never goes away — a kit alone is
 * forgotten by the second hour, and a trait alone gives the first hour nothing.
 *
 * Every effect here is stated to the player in the same words the code uses. A
 * choice you cannot price is not a choice.
 */
export type OriginId = 'rogue' | 'family' | 'cauldron' | 'hunter' | 'castout'

export interface Origin {
  readonly id: OriginId
  readonly name: string
  readonly zh: string
  /** Two lines of who you were. */
  readonly story: string
  /** What you carry in, in plain words. */
  readonly kit: string
  /** What never goes away, in plain words. */
  readonly trait: string
  readonly art: string
  readonly starting: {
    qiOfFirstBreakthrough?: number
    insight?: number
    turmoil?: number
    materials?: Partial<Record<MaterialId, number>>
    pills?: Partial<Record<PillId, number>>
    learned?: string[]
    beasts?: string[]
  }
}

export const ORIGINS: readonly Origin[] = [
  {
    id: 'rogue', name: 'Wandering Cultivator', zh: '散修', art: 's-meditate',
    story: 'Nobody taught you. You worked it out from a stolen manual and a great many bad nights.',
    kit: 'Nothing at all.',
    trait: '+25% insight from every breakthrough.',
    starting: {},
  },
  {
    id: 'family', name: 'Old Family', zh: '世家', art: 's-elder',
    story: 'Your house has been gathering since before the Closing. The cellar is not empty, and neither is the shelf of names.',
    kit: 'Enough qi to break through once, immediately.',
    trait: '−10% on every breakthrough cost.',
    starting: { qiOfFirstBreakthrough: 1 },
  },
  {
    id: 'cauldron', name: 'Cauldron Child', zh: '藥童', art: 's-zither',
    story: 'You grew up fetching herbs for somebody else’s pills, and learned the recipes by listening.',
    kit: 'Four hides and a spirit core.',
    trait: 'Every pill costs one material fewer.',
    starting: { materials: { hide: 4, core: 1 } },
  },
  {
    id: 'hunter', name: 'Hunter', zh: '獵戶', art: 's-blade',
    story: 'You knew what a beast was worth before you knew what qi was. The first one you killed was not for qi.',
    // "A hunt ready now" was in this kit until a test asked what it was worth.
    // Nothing: the cooldown starts spent for everyone, because locking a new player
    // out of a whole system for twenty-five minutes is a worse idea than the perk.
    kit: 'An Ash Hare already taken, and two hides from it.',
    trait: 'Every hunt costs you half what it costs anyone else.',
    starting: { beasts: ['hare'], materials: { hide: 2 } },
  },
  {
    id: 'castout', name: 'Cast Out', zh: '棄徒', art: 's-sword',
    story: 'A sect taught you one thing and threw you out for asking about the second. You kept the one thing.',
    kit: 'Frost Palm already learned, and a heart that is already loud.',
    trait: '+10% generation, and turmoil rises 20% faster.',
    starting: { learned: ['frost'], turmoil: 25, insight: 2 },
  },
]

export function origin(id: OriginId): Origin {
  return ORIGINS.find((o) => o.id === id) ?? ORIGINS[0]
}

/* ---- the lasting traits, read wherever they apply ---- */

export function originInsight(id: OriginId): number {
  return id === 'rogue' ? 0.25 : 0
}
export function originBreakthrough(id: OriginId): number {
  return id === 'family' ? 0.1 : 0
}
export function originRate(id: OriginId): number {
  return id === 'castout' ? 0.1 : 0
}
export function originTurmoilRate(id: OriginId): number {
  return id === 'castout' ? 1.2 : 1
}
/** A multiplier on the qi price of a hunt, not on the spoils. */
export function originHuntDiscount(id: OriginId): number {
  return id === 'hunter' ? 0.5 : 1
}
/** Pills cost one fewer of each material they ask for, never below one. */
export function originPillDiscount(id: OriginId): number {
  return id === 'cauldron' ? 1 : 0
}
