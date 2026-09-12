import type { PlayerState } from './state.ts'

/**
 * 法寶. Three things you carry, as against eighteen things you know.
 *
 * Arts and relics are deliberately opposite systems, and keeping them on separate
 * screens is the point rather than an accident of layout. An art is knowledge: bought
 * with insight, six at a time, costing qi every second to hold, and refinable forever.
 * A relic is an object: taken off something that did not want to give it up, one to a
 * kind, free to carry, and never improved — what it is, is what it is.
 *
 * So they touch different numbers. No relic gives qi generation, because that is what
 * arts are for. Relics change the rules around the edges instead: how many hunts you
 * hold, what a ground costs, what a failed tribulation takes, how often the world
 * happens to you.
 */
export type Slot = 'implement' | 'robe' | 'charm'

export const SLOT_NAME: Record<Slot, { name: string; zh: string; note: string }> = {
  implement: { name: 'Implement', zh: '器', note: 'What you hold. Taken from the deepest things.' },
  robe:      { name: 'Robe',      zh: '袍', note: 'What you wear. Cut from what wore it first.' },
  charm:     { name: 'Charm',     zh: '符', note: 'What you carry. Small, and never quiet.' },
}

export const SLOTS: Slot[] = ['implement', 'robe', 'charm']

export type RelicEffect =
  | 'haul'      // +n to every material haul
  | 'danger'    // −n turmoil from every hunt, never below zero
  | 'insight'   // fraction added to insight from everything
  | 'mercy'     // fraction taken off what a failed tribulation costs
  | 'charge'    // +n hunt charges held
  | 'odds'      // flat addition to every tribulation and every warden
  | 'omen'      // fraction added to the chance the world happens to you

export interface Relic {
  readonly id: string
  readonly name: string
  readonly zh: string
  readonly slot: Slot
  readonly glyph: string
  /** The warden it comes off. Nothing here is bought, found or crafted. */
  readonly from: string
  readonly kind: RelicEffect
  readonly value: number
  readonly text: string
  readonly note: string
}

export const RELICS: readonly Relic[] = [
  {
    id: 'cord', name: "Herdsman's Cord", zh: '牧繩', slot: 'charm', glyph: 'r-cord',
    from: 'grey', kind: 'haul', value: 1,
    text: '+1 to every material you take',
    note: 'Knotted at intervals nobody has explained. The beasts of the slopes will not cross it.',
  },
  {
    id: 'robe', name: 'Reedwater Robe', zh: '蘆水袍', slot: 'robe', glyph: 'r-robe',
    from: 'marsh', kind: 'danger', value: 1,
    text: 'Every ground stirs the heart one less',
    note: 'Still damp. It has been still damp for two hundred years.',
  },
  {
    id: 'pendant', name: 'Emberheart Pendant', zh: '燼心佩', slot: 'charm', glyph: 'r-pendant',
    from: 'cinder', kind: 'insight', value: 0.2,
    text: '+20% insight from everything',
    note: 'Warm on the side facing you, whichever side that is.',
  },
  {
    id: 'mantle', name: 'Stormhide Mantle', zh: '雷皮氅', slot: 'robe', glyph: 'r-mantle',
    from: 'sovereign', kind: 'mercy', value: 0.5,
    text: 'A failed tribulation costs half as much',
    note: 'The hide is still angry. It takes the lightning meant for you and stays angry about it.',
  },
  {
    id: 'bell', name: 'Drowned Bell', zh: '沉鐘', slot: 'implement', glyph: 'r-bell',
    from: 'guardian', kind: 'charge', value: 2,
    text: '+2 hunts held',
    note: 'Rung under water it is silent, and every beast within a mile turns to face you.',
  },
  {
    id: 'blade', name: 'Splitsky Blade', zh: '裂天刃', slot: 'implement', glyph: 'r-blade',
    from: 'skysplitter', kind: 'odds', value: 0.06,
    text: '+6% on every tribulation and every warden',
    note: 'The edge is the part of the sky that came down with it.',
  },
  {
    id: 'mirror', name: 'Shatterday Mirror', zh: '碎日鏡', slot: 'charm', glyph: 'r-mirror',
    from: 'skysplitter', kind: 'omen', value: 0.15,
    text: 'The world happens to you 15% more often',
    note: 'It shows the road you are on, about a day ahead, and is right slightly too often.',
  },
]

export function relic(id: string): Relic | undefined {
  return RELICS.find((r) => r.id === id)
}

export function relicsOf(slot: Slot): Relic[] {
  return RELICS.filter((r) => r.slot === slot)
}

/** Held but not worn: taken from a warden and sitting in the satchel. */
export function owns(s: PlayerState, id: string): boolean {
  return s.relics.includes(id)
}

export function worn(s: PlayerState, slot: Slot): Relic | undefined {
  const id = s.wearing[slot]
  return id ? relic(id) : undefined
}

/** Put it on, or take it off by wearing nothing. One to a slot, always. */
export function wear(s: PlayerState, id: string | null, slot: Slot): PlayerState {
  if (id === null) return { ...s, wearing: { ...s.wearing, [slot]: null } }
  const r = relic(id)
  if (!r || r.slot !== slot || !owns(s, id)) return s
  if (s.wearing[slot] === id) return s
  return { ...s, wearing: { ...s.wearing, [slot]: id } }
}

/** The value of one effect across everything currently worn. */
export function relicValue(s: PlayerState, kind: RelicEffect): number {
  let total = 0
  for (const slot of SLOTS) {
    const r = worn(s, slot)
    if (r && r.kind === kind) total += r.value
  }
  return total
}
