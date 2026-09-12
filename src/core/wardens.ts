import { ground, type Ground } from './grounds.ts'
import { realm } from './realms.ts'
import { levelOf } from './mastery.ts'
import { relicValue } from './relics.ts'
import { forgeValue } from './forge.ts'
import { modifiers, TURMOIL_MAX } from './progress.ts'
import { add, type Satchel } from './materials.ts'
import type { PlayerState } from './state.ts'

/**
 * 妖王. The thing at the bottom of a hunting ground that the other three are avoiding.
 *
 * A hunt is a chore you do four times a day and it should stay one. A warden is the
 * opposite of a chore in every direction, and the differences are what make it read as
 * a boss rather than a rare mob:
 *
 *   It has to be earned. All three beasts of the ground recorded first — you do not
 *   meet the warden until you have learned the place.
 *   It costs a day. Three of your four charges and twenty minutes of gathering, so
 *   going in is a decision about the whole day, not a tap.
 *   It can be lost. Real odds, shown in full, and every line of them comes from
 *   something you built: your realm, the arts you run, the mastery you poured in, what
 *   you are wearing, how quiet your heart is.
 *   It drops the only equipment in the game, once, and never again.
 *
 * Losing costs calm and a long injury. It never costs the realm, the relic, or the
 * character — a two-month save must not end on one roll.
 *
 * The rewards below are about a third of what they first were. Six wardens at the
 * original numbers handed over roughly a whole run's worth of insight on their own,
 * and a measured climb fell from fifty-six days to thirty-five. A boss should be the
 * best afternoon of the week, not the week.
 */
export interface Warden {
  readonly id: string
  readonly name: string
  readonly zh: string
  readonly symbol: string
  /** The ground it sits under. */
  readonly ground: string
  /** Chance before anything you have done is counted. */
  readonly base: number
  /** What it leaves the first time it is beaten. */
  readonly relic: string
  readonly haul: Satchel
  readonly insight: number
  readonly text: string
  /** Said once, on the first kill. */
  readonly first: string
}

export const WARDENS: readonly Warden[] = [
  {
    id: 'grey', name: 'The Grey King', zh: '灰王', symbol: 'w-grey', ground: 'ash',
    base: 0.72, relic: 'cord', haul: { hide: 9 }, insight: 40,
    text: 'Something has been eating the hares. It is the size of a cart and it has been on the slopes longer than the village below them.',
    first: 'It goes down slowly and without any noise at all. The cord around its neck was put there by someone.',
  },
  {
    id: 'marsh', name: 'The Marsh Lord', zh: '沼君', symbol: 'w-marsh', ground: 'marsh',
    base: 0.66, relic: 'robe', haul: { hide: 10, core: 3 }, insight: 80,
    text: 'The water goes down by a foot when it breathes in. Nothing in the reeds moves while you are both standing there.',
    first: 'You find the robe folded on a stone, dry side down, as though it had been waiting for the fight to finish.',
  },
  {
    id: 'cinder', name: 'The Cinder Mother', zh: '燼母', symbol: 'w-cinder', ground: 'wood',
    base: 0.60, relic: 'pendant', haul: { hide: 8, core: 7 }, insight: 200,
    text: 'Every fox in the burnt wood is one of hers. She has been counting them for four hundred years and she knows you are three short.',
    first: 'She is courteous about it, at the end. The pendant was already in her mouth.',
  },
  {
    id: 'sovereign', name: 'The Thunder Sovereign', zh: '雷君', symbol: 'w-sovereign', ground: 'ridge',
    base: 0.55, relic: 'mantle', haul: { core: 12, essence: 2 }, insight: 380,
    text: 'The storm on the ridge is not weather. It has been the same storm for eleven years and it is standing in the middle of it.',
    first: 'The weather stops the moment it does, and does not come back that season.',
  },
  {
    id: 'guardian', name: 'The Palace Guardian', zh: '沉宮守', symbol: 'w-guardian', ground: 'palace',
    base: 0.50, relic: 'bell', haul: { core: 10, essence: 6 }, insight: 700,
    text: 'It has held the inner door since the sect drowned and it does not appear to have noticed that there is no longer a sect.',
    first: 'It sets the bell down before it stops, which is the closest thing to a handover you will get.',
  },
  {
    id: 'skysplitter', name: 'Skysplitter', zh: '裂天', symbol: 'w-skysplitter', ground: 'scar',
    base: 0.44, relic: 'blade', haul: { essence: 16 }, insight: 1500,
    text: 'The thing that opened the sky is still in the opening. Eight of its heads are asleep. That has always been the arrangement.',
    first: 'The ninth head looks at you for a long moment and then, deliberately, closes its eyes with the others.',
  },
]

export function warden(id: string): Warden | undefined {
  return WARDENS.find((w) => w.id === id)
}

export function wardenOf(groundId: string): Warden | undefined {
  return WARDENS.find((w) => w.ground === groundId)
}

/** Three charges and twenty minutes of gathering at your realm. */
export const WARDEN_CHARGES = 3
export const WARDEN_COST_SECONDS = 1200

/**
 * Priced off the realm's own rate rather than the player's, so a strong loadout makes
 * a warden cheaper in time rather than dearer in qi.
 */
export function wardenCost(s: PlayerState): number {
  return Math.ceil(realm(s.realm).rate * WARDEN_COST_SECONDS)
}

export interface WardenOdds {
  base: number
  /** Every realm above the ground's own is worth this much. */
  standing: number
  /** The arts you are actually running, and what you poured into them. */
  craft: number
  /** What you are wearing. */
  gear: number
  /** An unquiet heart, as everywhere else. */
  turmoil: number
  total: number
}

const STANDING_PER_REALM = 0.06
const CRAFT_PER_ART = 0.015
const CRAFT_PER_LEVEL = 0.008
const TURMOIL_WEIGHT = 0.3
const FLOOR = 0.05
const CEILING = 0.95

/**
 * Every line comes from something the player built, and every line is shown. A boss
 * you cannot price is a slot machine with a portrait.
 */
export function odds(s: PlayerState, w: Warden): WardenOdds {
  const g = ground(w.ground)
  const standing = Math.max(0, s.realm - g.realm) * STANDING_PER_REALM
  const levels = s.equipped.reduce((n, id) => n + levelOf(s.mastery, id), 0)
  const craft = s.equipped.length * CRAFT_PER_ART + levels * CRAFT_PER_LEVEL
  const gear = relicValue(s, 'odds') + forgeValue(s, 'odds')
  const turmoil = -(Math.min(s.turmoil, TURMOIL_MAX) / TURMOIL_MAX) * TURMOIL_WEIGHT
  const total = Math.min(CEILING, Math.max(FLOOR, w.base + standing + craft + gear + turmoil))
  return { base: w.base, standing, craft, gear, turmoil, total }
}

/** Recorded all three of its ground, standing in it, and the realm is open. */
export function known(s: PlayerState, w: Warden): boolean {
  const g: Ground = ground(w.ground)
  return g.beasts.every((b) => s.seenBeasts.includes(b))
}

export function canChallenge(s: PlayerState, w: Warden, charges: number): boolean {
  return known(s, w)
    && s.realm >= ground(w.ground).realm
    && charges >= WARDEN_CHARGES
    && s.qi >= wardenCost(s)
}

export interface Kill {
  state: PlayerState
  warden: Warden
  won: boolean
  chance: number
  roll: number
  /** The relic, only the first time. */
  took: string | null
  firstKill: boolean
}

/**
 * Fight it. Pure, like everything else — the roll is the caller's.
 *
 * Failure is expensive and survivable: the qi is spent either way, the heart takes
 * twenty, and the injury runs six hours. It never takes the realm or the character.
 */
export function fight(s: PlayerState, w: Warden, now: number, roll: number, charges: number): Kill | null {
  if (!canChallenge(s, w, charges)) return null
  const chance = odds(s, w).total
  const spent = { ...s, qi: Math.max(0, s.qi - wardenCost(s)) }
  const firstKill = !s.wardens.includes(w.id)

  if (roll >= chance) {
    return {
      state: {
        ...spent,
        turmoil: Math.min(TURMOIL_MAX, spent.turmoil + 20),
        injuredUntil: Math.max(spent.injuredUntil, now) + 6 * 3_600_000,
      },
      warden: w, won: false, chance, roll, took: null, firstKill: false,
    }
  }

  let satchel = spent.satchel
  for (const [k, v] of Object.entries(w.haul)) satchel = add(satchel, k as keyof Satchel, v ?? 0)
  const took = firstKill ? w.relic : null

  return {
    state: {
      ...spent,
      satchel,
      insight: spent.insight + Math.round(w.insight * modifiers(s).insight),
      turmoil: Math.min(TURMOIL_MAX, spent.turmoil + 8),
      wardens: firstKill ? [...spent.wardens, w.id] : spent.wardens,
      relics: took ? [...spent.relics, took] : spent.relics,
    },
    warden: w, won: true, chance, roll, took, firstKill,
  }
}
