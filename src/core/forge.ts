import { type MaterialId, type Satchel, canPay, pay } from './materials.ts'
import type { Slot } from './relics.ts'
import type { PlayerState } from './state.ts'

/**
 * 鍛 The forge. The second currency lane, and the answer to three complaints at once.
 *
 * Before this existed the game had exactly one currency for permanent power — insight —
 * and every sink drew on it: learning an art, refining an art, opening a meridian. Beast
 * materials had almost no sink at all: the twelve meridians together ask for sixty-four
 * items across a two-month climb, and a player hunting their four charges a day brings
 * home something like eight hundred. So the satchel filled with hide that did nothing
 * while every button on the screen was greyed out behind an insight number, and the only
 * honest advice the game could give was "wait".
 *
 * A forged item fixes the shape rather than the numbers:
 *
 *   It is bought with materials and nothing else. Insight buys knowledge — arts and
 *   meridians; materials buy objects. Two activities, two currencies, two ladders, and
 *   neither one starves while the other overflows.
 *   It is tempered, not found. Nine levels, each dearer than the last, so the satchel
 *   has a bottom that recedes as you climb instead of a ceiling you hit in a week.
 *   It is chosen. Three patterns to a slot and three slots, sharing those slots with
 *   the warden relics — so "what am I wearing" is a real question with a wrong answer.
 *
 * And unlike a relic, a forged item *does* touch generation. That rule — no relic
 * raises qi — was right for relics, which are found rather than built: a relic that
 * gave +20% would be an art you could not refine. A forged item is the opposite case.
 * You paid for every point of it out of a satchel you filled by going out, which is
 * exactly the vertical, active-play power curve the game was missing. It is paid for
 * in the realm cost table like every other source of power, never taken back out.
 */
export type ForgeEffect =
  | 'rate'         // fraction added to generation
  | 'breakthrough' // fraction taken off the breakthrough cost
  | 'insight'      // fraction added to insight from everything
  | 'odds'         // flat addition to every tribulation and every warden
  | 'turmoil'      // fraction taken off how fast the heart stirs
  | 'hunt'         // fraction taken off the time a hunt charge takes
  | 'haul'         // flat addition to every material haul

export interface Pattern {
  readonly id: string
  readonly name: string
  readonly zh: string
  readonly slot: Slot
  readonly glyph: string
  /** The one material it eats, at every level. Which is also what gates it in practice. */
  readonly mat: MaterialId
  /** Realm at which the pattern becomes known. */
  readonly realm: number
  readonly kind: ForgeEffect
  /** What one level is worth. The item's value is this times its level, always. */
  readonly per: number
  /** Materials for the first level; every level after is this times a growing curve. */
  readonly base: number
  readonly note: string
}

/** Nine levels, because everything in this game counts to nine. */
export const TEMPER_MAX = 9

/**
 * Three patterns to a slot, in three tiers of material.
 *
 * The tiers are what make the forge a map of the hunting grounds rather than a shop:
 * a hide pattern is something you can start on the first afternoon, an essence pattern
 * is something you cannot touch until the Sunken Palace opens. So "which ground do I
 * hunt today" finally has an answer that is not "whichever".
 */
export const PATTERNS: readonly Pattern[] = [
  // 皮 hide — the first afternoon. Cheap per level, and there is a lot of hide.
  {
    id: 'ring', name: 'Riverstone Ring', zh: '河石戒', slot: 'implement', glyph: 'f-ring',
    mat: 'hide', realm: 1, kind: 'rate', per: 0.025, base: 2.5,
    note: 'A hoop of river stone, drilled through. The first thing every cultivator makes and the last thing they throw away.',
  },
  {
    id: 'vest', name: 'Hidebound Vest', zh: '韌皮甲', slot: 'robe', glyph: 'f-vest',
    mat: 'hide', realm: 2, kind: 'turmoil', per: 0.04, base: 2.5,
    note: 'Layered wet and dried in the sun. It does not stop a claw. It stops you flinching from one.',
  },
  {
    id: 'bonecharm', name: 'Bone Charm', zh: '骨符', slot: 'charm', glyph: 'f-bonecharm',
    mat: 'hide', realm: 2, kind: 'haul', per: 0.5, base: 2.5,
    note: 'Knuckle bones on a thong, one from everything you have brought down. They rattle before the beast does.',
  },

  // 丹 core — the middle of a life. The headline generation pattern lives here.
  {
    id: 'seal', name: 'Stormcore Seal', zh: '雷丹印', slot: 'implement', glyph: 'f-seal',
    mat: 'core', realm: 4, kind: 'rate', per: 0.05, base: 1.6,
    note: 'A spirit core set in iron and struck until it stopped arguing. It pulls qi the way a drain pulls water.',
  },
  {
    id: 'corefire', name: 'Corefire Mantle', zh: '丹火氅', slot: 'robe', glyph: 'f-corefire',
    mat: 'core', realm: 4, kind: 'breakthrough', per: 0.025, base: 1.6,
    note: 'Cores burnt into the weave, one to a panel. It is warm in a way that has nothing to do with weather.',
  },
  {
    id: 'foxcharm', name: 'Foxbone Charm', zh: '狐骨符', slot: 'charm', glyph: 'f-foxcharm',
    mat: 'core', realm: 4, kind: 'insight', per: 0.06, base: 1.6,
    note: 'Nine small bones that were not nine small bones when they were taken.',
  },

  // 真元 essence — the last stretch. Few levels affordable, each one enormous.
  {
    id: 'skyiron', name: 'Skyiron Blade', zh: '天鐵刃', slot: 'implement', glyph: 'f-skyiron',
    mat: 'essence', realm: 6, kind: 'rate', per: 0.09, base: 1.0,
    note: 'Folded from what fell when the sky opened. It has never needed sharpening and it never will.',
  },
  {
    id: 'trueweave', name: 'Trueweave Robe', zh: '真織袍', slot: 'robe', glyph: 'f-trueweave',
    mat: 'essence', realm: 6, kind: 'odds', per: 0.012, base: 1.0,
    note: 'Thread spun from essence, which should not be possible, and is not, quite.',
  },
  {
    id: 'knot', name: 'Essence Knot', zh: '真元結', slot: 'charm', glyph: 'f-knot',
    mat: 'essence', realm: 7, kind: 'hunt', per: 0.03, base: 1.0,
    note: 'Tied once and never untied. The road to a hunting ground is shorter when you are wearing it.',
  },
]

/**
 * Relic ids and pattern ids share one namespace, because `wearing` holds either kind
 * in the same field. That is convenient and it is a trap: `wear()` resolves relics
 * first, so a pattern that borrowed a relic's id would be silently unwearable — which
 * is exactly what happened when this file first called its robe 'mantle'. A test in
 * test/forge.ts asserts the two sets never overlap; this note is why it is there.
 */
export function pattern(id: string): Pattern | undefined {
  return PATTERNS.find((p) => p.id === id)
}

export function patternsOf(slot: Slot): Pattern[] {
  return PATTERNS.filter((p) => p.slot === slot)
}

/** What you have poured into each pattern. Absent means never forged. */
export type Forged = Record<string, number>

export function levelOf(f: Forged, id: string): number {
  return f[id] ?? 0
}

/** Level 1 is forging it; every level after is tempering it. Same call, same cost curve. */
export function temperCost(p: Pattern, level: number): Satchel {
  if (level >= TEMPER_MAX) return {}
  return { [p.mat]: Math.ceil(p.base * Math.pow(level + 1, 1.4)) }
}

/** Everything from here to the top, for a screen that wants to say what it will take. */
export function costToMax(p: Pattern, from: number): number {
  let total = 0
  for (let l = from; l < TEMPER_MAX; l++) total += temperCost(p, l)[p.mat] ?? 0
  return total
}

/** What the item is worth at a level. Linear on purpose — a forge should be readable. */
export function valueAt(p: Pattern, level: number): number {
  return p.per * level
}

/**
 * A haul is a count of things in a bag, so it can only ever be a whole number. The
 * pattern is priced at half an item a level and rounded at the point of use, which is
 * what stops the first two levels of a charm from being decorative: the alternative,
 * a third of an item a level truncated to zero, meant a player spent ten hides on
 * something that visibly did nothing.
 */
export function haulFrom(value: number): number {
  return Math.round(value)
}

export function effectText(p: Pattern, level: number): string {
  const v = valueAt(p, Math.max(1, level))
  const pc = (n: number) => `${(n * 100).toFixed(n * 100 < 1 ? 1 : 0)}%`
  switch (p.kind) {
    case 'rate':         return `+${pc(v)} qi generation`
    case 'breakthrough': return `−${pc(v)} breakthrough cost`
    case 'insight':      return `+${pc(v)} insight from everything`
    case 'odds':         return `+${pc(v)} on every tribulation and warden`
    case 'turmoil':      return `the heart stirs ${pc(v)} slower`
    case 'hunt':         return `hunt charges return ${pc(v)} faster`
    case 'haul':         return `+${haulFrom(v)} to every material haul`
  }
}

export function canTemper(s: PlayerState, id: string): boolean {
  const p = pattern(id)
  if (!p) return false
  const level = levelOf(s.forged, id)
  if (level >= TEMPER_MAX) return false
  if (s.realm < p.realm) return false
  return canPay(s.satchel, temperCost(p, level))
}

/**
 * Forge it, or temper it one further. One call for both, because they are the same
 * act: the first level is simply the one where the item did not exist yet.
 */
export function temper(s: PlayerState, id: string): PlayerState {
  if (!canTemper(s, id)) return s
  const p = pattern(id)!
  const level = levelOf(s.forged, id)
  return {
    ...s,
    satchel: pay(s.satchel, temperCost(p, level)),
    forged: { ...s.forged, [id]: level + 1 },
  }
}

/** Forged and therefore wearable. Level zero is a pattern you know, not an object. */
export function made(s: PlayerState, id: string): boolean {
  return levelOf(s.forged, id) > 0
}

/** The forged item in a slot, if what is in that slot is forged rather than found. */
export function wornForge(s: PlayerState, slot: Slot): Pattern | undefined {
  const id = s.wearing[slot]
  return id ? pattern(id) : undefined
}

/** The value of one effect across everything forged that is currently worn. */
export function forgeValue(s: PlayerState, kind: ForgeEffect): number {
  let total = 0
  for (const slot of ['implement', 'robe', 'charm'] as Slot[]) {
    const p = wornForge(s, slot)
    if (p && p.kind === kind) total += valueAt(p, levelOf(s.forged, p.id))
  }
  return total
}
