/**
 * How good a piece rolled, on a ladder a player already knows how to read.
 *
 * WHY THIS EXISTS. The game had a `rarity: 0 | 1 | 2` on every item, and it was
 * invisible: it only weighted the drop table. Nothing on screen was ever
 * coloured by it, so the single most legible signal in the entire loot genre
 * was being computed and thrown away. Played on a device, the verdict was
 * "drops feel like nothing" — correctly, because a drop said nothing.
 *
 * THE COLOUR ORDER IS NOT A STYLE CHOICE. Grey, green, blue, purple, gold is
 * the ladder every ARPG player has already learned, and reading it costs them
 * nothing. It happens to also be right for this game's world: purple is the
 * imperial colour in Chinese tradition, which is why it outranks blue here as
 * it does in Diablo, and cinnabar — the loudest colour this palette owns, used
 * for damage and for seals — is held back for the rarest tier of all so that
 * seeing it on the ground means exactly one thing.
 *
 * RARITY IS A PROPERTY OF THE DROP, NOT OF THE ITEM. A Hemp Robe is not a
 * common item; it is a base that can roll common or can roll purple with four
 * lines on it. That is the whole difference between a loot game and a table of
 * gear, and it is why `Item` in data/items.ts no longer carries a rarity.
 */

/** 凡 common · 良 fine · 珍 rare · 宝 precious · 神 divine · 仙 immortal. */
export type Rarity = 0 | 1 | 2 | 3 | 4 | 5

export interface RarityTier {
  readonly id: Rarity
  /** The seal, which is how the tier is NAMED in play. */
  readonly seal: string
  /** English name — the product language. See ui/strings.ts. */
  readonly name: string
  /** Packed 0xRRGGBB, for the renderer. */
  readonly colour: number
  /** The same colour for the DOM. Kept beside it so the two cannot drift. */
  readonly css: string
  /** How many lines a piece of this tier rolls. See data/affixes.ts. */
  readonly affixes: number
  /**
   * How much bigger each of those lines rolls, against the depth's baseline.
   *
   * Without this the ladder was not monotone and it showed the moment real
   * rolls were printed: 神 and 仙 roll the same FOUR lines as 宝, so the only
   * thing separating the top three rungs was the named power, and a sampled
   * 宝 came out plainly stronger than the 神 beside it. A tier has to be
   * better at the thing every tier does, not only carry an extra.
   *
   * Kept gentle — a lucky common can still out-roll an unlucky precious on a
   * SINGLE line, which is what makes individual lines worth reading. What it
   * cannot do is out-roll it on the whole piece, because the piece also has
   * three more lines.
   */
  readonly potency: number
  /**
   * Relative weight at depth 1. The deeper roll shifts these — see rollRarity.
   *
   * Tuned so a first expedition is nearly all commons with the odd green: the
   * ladder has to have a bottom for its top to mean anything, and a player who
   * sees purple in their first ten minutes has been robbed of the moment.
   */
  readonly weight: number
}

export const RARITIES: readonly RarityTier[] = [
  // The weights on the top two rungs are set from how often a player would
  // actually SEE one, not from how rare the word sounds. At three or four drops
  // an expedition, the first pass put a divine at one piece in forty-five runs
  // — a colour most players would never meet. These land it near one in a
  // dozen at depth three, which is still an event.
  { id: 0, seal: '凡', name: 'Common', colour: 0x6b6459, css: '#6b6459', affixes: 1, potency: 1, weight: 620 },
  { id: 1, seal: '良', name: 'Fine', colour: 0x3f6b46, css: '#3f6b46', affixes: 2, potency: 1.06, weight: 240 },
  { id: 2, seal: '珍', name: 'Rare', colour: 0x2f5d8a, css: '#2f5d8a', affixes: 3, potency: 1.14, weight: 100 },
  { id: 3, seal: '宝', name: 'Precious', colour: 0x6b3f8a, css: '#6b3f8a', affixes: 4, potency: 1.26, weight: 34 },
  { id: 4, seal: '神', name: 'Divine', colour: 0x8a6d16, css: '#8a6d16', affixes: 4, potency: 1.42, weight: 13 },
  { id: 5, seal: '仙', name: 'Immortal', colour: 0xc1272d, css: '#c1272d', affixes: 4, potency: 1.62, weight: 3 },
] as const

export const RARITY_BY_ID = new Map(RARITIES.map((r) => [r.id, r]))

export function rarityOf(id: Rarity): RarityTier {
  return RARITY_BY_ID.get(id) ?? RARITIES[0]!
}

/** The highest tier. Named rather than written as 5 wherever it is needed. */
export const MAX_RARITY: Rarity = 5

/**
 * Tiers that carry a power with a name of its own, on top of their lines.
 *
 * 神 and 仙 only. A named power is the thing a player tells someone else about
 * ("I found the one that freezes the ground"), and it stops being that the
 * moment every third drop has one.
 */
export function hasNamedPower(rarity: Rarity): boolean {
  return rarity >= 4
}

/**
 * How much better than an ordinary corpse a boss's one guaranteed piece rolls.
 *
 * A boss already always leaves something — but "always leaves a grey robe" is
 * the same disappointment as leaving nothing, dressed up. This is what replaced
 * the 秘笈 the boss used to guarantee: the reliable vertical progression is
 * still routed through the gate, it just arrives as gear now, in a colour, on
 * the ground, instead of as a rank in a save file nobody could see.
 *
 * Three, measured rather than picked: at depth 1 it takes the odds of coming
 * away with better than 良 from roughly a third to roughly two thirds, which
 * makes clearing a gate worth doing without making the field drops pointless.
 */
export const BOSS_LUCK = 3

/** The drawing weights at a depth, tilted by luck. One place, three callers. */
function weightsAt(depth: number, luck: number): number[] {
  const lift = (1 + Math.max(0, depth - 1) * 0.55) * Math.max(1, luck)
  return RARITIES.map((tier) => (tier.id === 0 ? tier.weight : tier.weight * lift))
}

/**
 * Rolls a tier for a drop at `depth`, from a seeded 0..1 pick.
 *
 * Depth tilts the ladder rather than replacing it: every tier stays reachable
 * everywhere, so the shallow road can still — rarely — hand over something
 * extraordinary, and the deep road is a better place to hunt without being the
 * only place. `pick` is a seeded roll, so a replay of the same expedition finds
 * the same pieces at the same tiers.
 *
 * The tilt is applied to the weights of the tiers ABOVE common, which is the
 * cheap way to say "deeper ground rolls better" without four separate curves
 * to hold in your head. `luck` tilts the same weights the same way, and exists
 * so that a boss's piece and a bandit's piece come off ONE table — a separate
 * boss table would drift from this one the first time either was retuned.
 */
export function rollRarity(depth: number, pick: number, luck = 1): Rarity {
  const weights = weightsAt(depth, luck)
  let total = 0
  for (const w of weights) total += w
  let target = Math.max(0, Math.min(1, pick)) * total
  for (let i = 0; i < RARITIES.length; i++) {
    target -= weights[i]!
    if (target <= 0) return RARITIES[i]!.id
  }
  return 0
}

/**
 * The chance of each tier at a depth, as fractions summing to 1.
 *
 * Exists so the odds shown to the player and the odds the game actually rolls
 * come from ONE place. The first version of the rarity sheet quoted numbers
 * typed by hand beside a table that had since been retuned, which is a lie the
 * player has no way to catch.
 */
export function rarityOdds(depth: number, luck = 1): number[] {
  const weights = weightsAt(depth, luck)
  const total = weights.reduce((a, b) => a + b, 0)
  return weights.map((w) => w / total)
}
