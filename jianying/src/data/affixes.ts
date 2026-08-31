/**
 * The lines a piece rolls — what makes two copies of the same base different.
 *
 * WHY THIS EXISTS. Every item used to carry ONE fixed stat: a Hemp Robe was
 * always +2 Body, forever, in every save. So a second Hemp Robe was worth
 * nothing, "did I find something good?" had no answer beyond the item's own
 * name, and the loop that a loot game runs on — kill, look, compare — had
 * nothing to compare. Rolling the lines per drop is the whole repair.
 *
 * SEVEN KINDS, AND WHY NOT MORE. Four of them are the attributes the hub
 * already shows with their effect spelled out in the player's own units, so
 * "+5 Body" needs no explanation on a phone. The other three change the SHAPE
 * of the sweep, which is the only other thing this control scheme lets a player
 * feel. An eighth kind would be an eighth currency, and the file this replaced
 * carried a note about exactly that mistake: ten kinds across sixteen pieces,
 * half of them saying the same thing twice.
 *
 * ONE LINE OF STAT was the old rule, written for a card 158px wide, and it
 * still holds THERE — a bag tile shows a silhouette and a colour, nothing more.
 * The lines are read on the sheet that opens when a piece is tapped, which is a
 * whole screen with the worn piece beside it and a delta per row. That is the
 * only place this game has ever been able to afford a comparison table, and it
 * is the place a player is standing still.
 */
import type { AttributeId } from '../meta/character'
import { type Rarity, hasNamedPower, rarityOf } from './rarity'
import type { Rng } from '../core/rng'

/** The four attributes, plus the three things that change the sweep's shape. */
export type AffixKind = AttributeId | 'reach' | 'haste' | 'vigour'

export interface Affix {
  readonly kind: AffixKind
  /** Attributes are flat points; reach and haste are percents; vigour is health. */
  readonly amount: number
}

interface AffixSpec {
  readonly kind: AffixKind
  /** Chinese seal, matching the attribute rows the hub already draws. */
  readonly seal: string
  readonly name: string
  /**
   * What one point of this is worth at depth 1, before the depth scale.
   *
   * The four attributes share a base because they share a currency — the hub
   * adds item attributes to bought attributes before the curve, so an item
   * point and a spent point are worth exactly the same thing, and a player who
   * learns one has learned the other.
   */
  readonly base: number
  /** How much a step of depth adds, as a fraction of `base`. */
  readonly perDepth: number
  /** Relative chance of this kind appearing on a roll. */
  readonly weight: number
}

/**
 * Reach and haste are scarcer than the attributes on purpose.
 *
 * They multiply everything rather than adding to it — a longer sweep hits more
 * things which kills faster which fills the rift faster — so at equal frequency
 * they would be the only lines anyone read, and the four attributes would
 * become the filler you scroll past.
 */
const SPECS: readonly AffixSpec[] = [
  { kind: 'body', seal: '体', name: 'Body', base: 3, perDepth: 0.45, weight: 100 },
  { kind: 'edge', seal: '锋', name: 'Edge', base: 3, perDepth: 0.45, weight: 100 },
  { kind: 'swift', seal: '疾', name: 'Swiftness', base: 3, perDepth: 0.45, weight: 100 },
  { kind: 'spirit', seal: '神', name: 'Spirit', base: 3, perDepth: 0.45, weight: 100 },
  { kind: 'vigour', seal: '命', name: 'Health', base: 14, perDepth: 0.5, weight: 70 },
  { kind: 'reach', seal: '远', name: 'Sweep reach', base: 4, perDepth: 0.35, weight: 42 },
  { kind: 'haste', seal: '疾', name: 'Sweep speed', base: 3, perDepth: 0.35, weight: 42 },
] as const

export const AFFIX_SPECS = SPECS
export const AFFIX_BY_KIND = new Map(SPECS.map((s) => [s.kind, s]))

/** True when the kind reads as a percentage rather than a flat number. */
export function isPercent(kind: AffixKind): boolean {
  return kind === 'reach' || kind === 'haste'
}

/** The line as the player reads it: "+5 Body", "+8% sweep reach". */
export function affixLine(affix: Affix): string {
  const spec = AFFIX_BY_KIND.get(affix.kind)
  if (!spec) return ''
  return isPercent(affix.kind)
    ? `+${affix.amount}% ${spec.name.toLowerCase()}`
    : `+${affix.amount} ${spec.name}`
}

/**
 * How big one line of `kind` rolls at `depth`, given a 0..1 roll.
 *
 * The spread is 70% to 130% of the value the depth suggests, which is wide
 * enough that two purples of the same base are worth comparing and narrow
 * enough that a lucky common never beats an unlucky rare. That relationship is
 * the one this whole ladder rests on, and there is a test pinning it.
 */
export function rollAmount(kind: AffixKind, depth: number, roll: number, potency = 1): number {
  const spec = AFFIX_BY_KIND.get(kind)
  if (!spec) return 0
  const centre = spec.base * (1 + Math.max(0, depth - 1) * spec.perDepth) * potency
  const spread = 0.7 + Math.max(0, Math.min(1, roll)) * 0.6
  return Math.max(1, Math.round(centre * spread))
}

/**
 * Rolls the full set of lines for a piece of `rarity` found at `depth`.
 *
 * No kind appears twice: two "+3 Body" rows on one item read as a bug, and a
 * player cannot tell them from a single "+6 Body" that would have been simpler
 * to print. Rarity decides HOW MANY lines, depth decides how big each one is,
 * and the two axes never touch — which is what lets a deep common still be
 * worth picking up, and a shallow purple still be a find.
 */
export function rollAffixes(rarity: Rarity, depth: number, rng: Rng): Affix[] {
  const tier = rarityOf(rarity)
  const count = tier.affixes
  const pool = [...SPECS]
  const out: Affix[] = []
  for (let i = 0; i < count && pool.length > 0; i++) {
    const total = pool.reduce((sum, spec) => sum + spec.weight, 0)
    let target = rng.next() * total
    let index = pool.length - 1
    for (let j = 0; j < pool.length; j++) {
      target -= pool[j]!.weight
      if (target <= 0) {
        index = j
        break
      }
    }
    const spec = pool.splice(index, 1)[0]!
    out.push({ kind: spec.kind, amount: rollAmount(spec.kind, depth, rng.next(), tier.potency) })
  }
  return out
}

/**
 * A rough single number for "how good is this piece", used to sort a bag and to
 * decide which of two pieces the game should call better.
 *
 * Deliberately crude. It exists so the bag can put the best thing first and so
 * "is this an upgrade?" has a default answer; it is NOT shown to the player,
 * because a game that prints a power score invites optimising the score instead
 * of reading the lines, and the lines are the interesting part.
 */
export function affixWeight(affixes: readonly Affix[]): number {
  let total = 0
  for (const affix of affixes) {
    const spec = AFFIX_BY_KIND.get(affix.kind)
    if (!spec) continue
    total += (affix.amount / spec.base) * (100 / spec.weight)
  }
  return total
}

/**
 * The named powers, which only 神 and 仙 pieces carry.
 *
 * These are the thing a player tells someone else about, so each one changes a
 * RULE rather than a number — a number is what the lines above already are, and
 * a legendary that granted "+18 Edge" would be a rare with a better colour.
 *
 * The list is deliberately short for a first release. Every one of these needs
 * real simulation work behind it, and six that land are worth more than twenty
 * that are names in a table with nothing under them — which is the exact trap
 * the arts fell into in an earlier pass of this project.
 */
export interface NamedPower {
  readonly id: string
  readonly seal: string
  readonly name: string
  /** One line, in the player's own terms, describing what it changes. */
  readonly blurb: string
  /** Which slot may roll it. A power has to suit what it is worn on. */
  readonly slot: string
}

export const NAMED_POWERS: readonly NamedPower[] = [
  {
    id: 'frost',
    seal: '霜',
    name: 'Frost That Follows',
    blurb: 'Every third sweep freezes the ground. What steps on it moves at half speed.',
    slot: 'weapon',
  },
  {
    id: 'echo',
    seal: '影',
    name: 'The Second Blade',
    blurb: 'A sweep leaves a shadow of itself that lands a moment later.',
    slot: 'weapon',
  },
  {
    id: 'ward',
    seal: '甲',
    name: 'Paper Armour',
    blurb: 'The first blow of every fight is turned aside entirely.',
    slot: 'robe',
  },
  {
    id: 'tide',
    seal: '潮',
    name: 'Turning Tide',
    blurb: 'Falling below a third of your health pushes everything around you away.',
    slot: 'robe',
  },
  {
    id: 'greed',
    seal: '贪',
    name: 'The Long Reach',
    blurb: 'Qi and pieces on the ground come to you from twice as far.',
    slot: 'head',
  },
  {
    id: 'vigil',
    seal: '守',
    name: 'Unbroken Vigil',
    blurb: 'Standing still for two seconds mends a sliver of health.',
    slot: 'shoulders',
  },
] as const

export const POWER_BY_ID = new Map(NAMED_POWERS.map((p) => [p.id, p]))

/**
 * Picks a named power for a piece, or null when the tier does not carry one.
 *
 * A power that does not suit the slot is not rolled at all rather than
 * substituted: a slot with no power in the table simply rolls a 神 piece with
 * four strong lines, which is a fine thing to find, and inventing a seventh
 * power to fill a gap is how a table ends up full of names with nothing under
 * them.
 */
export function rollPower(rarity: Rarity, slot: string, pick: number): string | null {
  if (!hasNamedPower(rarity)) return null
  const fitting = NAMED_POWERS.filter((p) => p.slot === slot)
  if (fitting.length === 0) return null
  const index = Math.min(fitting.length - 1, Math.floor(Math.max(0, Math.min(1, pick)) * fitting.length))
  return fitting[index]!.id
}
