/**
 * The persistent swordsman — the part of the game that survives dying.
 *
 * Everything in `sim/` is thrown away when a run ends. This file is the
 * opposite: a single record that only ever grows, carried between expeditions
 * and written to disk. It is pure data and pure arithmetic on purpose, so the
 * whole progression curve can be checked by tests rather than by playing for an
 * hour and forming an impression.
 *
 * The shape is deliberately the MMORPG one rather than the survivors one:
 *
 *   expedition  ->  cultivation XP  ->  level  ->  attribute points  ->  stats
 *
 * A run therefore never ends in nothing. Even a bad one moves the bar, which is
 * the whole reason this layer exists — the previous build reset to zero on every
 * death and gave a player no reason to believe the last ten minutes had counted.
 *
 * The honest risk, recorded here because it will need revisiting: permanent
 * power against a fixed difficulty curve eventually makes the early minutes of
 * every expedition trivial. The answer in this design is expedition depth (see
 * `depth.ts`) — the character grows, and the player is expected to spend that
 * growth on harder ground rather than on an easier version of the same ground.
 */
import { MAX_DEPTH, depthReward } from '../data/regions'
import { emptyInventory, type Inventory } from './inventory'
import { DEFAULT_LOOK, type Look } from './look'
import { LEVELS_PER_REALM, REALMS, isRealmAdvance } from './realms'

/** The four things a point can be spent on. */
export type AttributeId = 'body' | 'edge' | 'swift' | 'spirit'

export interface Attribute {
  readonly id: AttributeId
  /** Chinese character, used as the seal on the hub card. */
  readonly seal: string
  readonly name: string
  /** What one point does, in the player's own units. Shown verbatim. */
  readonly effect: string
}

/**
 * Four attributes, each mapping to exactly one readable number.
 *
 * Four is a deliberate ceiling. Six or eight would let the numbers overlap —
 * two stats that both nudge damage — and an attribute the player cannot predict
 * the effect of is an attribute they will not spend on. Every entry below states
 * its effect in the units the HUD already shows.
 */
export const ATTRIBUTES: readonly Attribute[] = [
  { id: 'body', seal: '体', name: 'Body', effect: '+7 max health' },
  { id: 'edge', seal: '锋', name: 'Edge', effect: '+1.3 sweep damage' },
  { id: 'swift', seal: '疾', name: 'Swiftness', effect: 'Sweep 1.8% faster' },
  { id: 'spirit', seal: '神', name: 'Spirit', effect: '+5% art damage and reach' },
] as const

export type Attributes = Record<AttributeId, number>

export interface Character {
  /** Chosen by the player. Never used as a key — the save has its own slot. */
  name: string
  /**
   * Id of the school picked at creation.
   *
   * It decides the starting weapon and kit, and nothing after that: every
   * weapon in the game can drop, so a school is where you began rather than
   * what you are. That matters on the one screen where the player knows least.
   */
  origin: string
  /**
   * Appearance the equipment cannot overwrite — build, sash and brush hand.
   *
   * Armour is the rest of the appearance by design, so these three are what is
   * left for the player to actually own. See meta/look.ts.
   */
  look: Look
  /** Owned and worn equipment. */
  inventory: Inventory
  /**
   * False until the player has finished one expedition.
   *
   * Gates the first-run coaching. A tutorial that keeps firing after the player
   * has understood the game stops being help and becomes noise, and this genre
   * gives them no way to dismiss it mid-fight.
   */
  taught: boolean
  level: number
  /** Cultivation XP toward the next level. */
  xp: number
  /** Earned but not yet assigned. */
  points: number
  spent: Attributes
  /**
   * The arts carried into an expedition, per weapon, in the order they advance.
   *
   * Keyed by weapon because an art belongs to a weapon: picking up a spear is
   * picking up a different way to fight, and the four you chose for the sabre
   * mean nothing while you are holding it. Up to EQUIPPED_ARTS ids each; a
   * weapon with no entry falls back to the first four of its scroll, so a save
   * written before this existed still walks out with a build.
   *
   * The ORDER is the decision. Each 感悟 during a run advances the next one in
   * this list, so putting an art first means it reaches grade five and putting
   * it fourth means it might not.
   */
  arts: Record<string, string[]>
  /** Deepest expedition unlocked. Starts at 1. */
  depth: number
  /** Lifetime totals, purely for the hub to have something to show. */
  runs: number
  bestSeconds: number
  totalKills: number
}

export function emptyAttributes(): Attributes {
  return { body: 0, edge: 0, swift: 0, spirit: 0 }
}

/**
 * A blank swordsman.
 *
 * `spent` starts empty; the origin's grant is applied by the creation screen
 * through `applyOrigin`, so this stays the one place that defines what "new"
 * means and the origins stay pure data.
 */
export function createCharacter(
  name = 'Wanderer',
  origin = 'mountain',
  look: Look = DEFAULT_LOOK,
): Character {
  return {
    name,
    origin,
    look,
    inventory: emptyInventory(),
    taught: false,
    level: 1,
    xp: 0,
    // One in hand at creation, so the very first thing a new player does after
    // choosing an origin is make another choice, rather than read a locked
    // screen full of zeroes.
    points: 1,
    spent: emptyAttributes(),
    arts: {},
    depth: 1,
    runs: 0,
    bestSeconds: 0,
    totalKills: 0,
  }
}

/**
 * Cultivation XP required to go from `level` to the next.
 *
 * Tuned against measured expeditions rather than taste. A headless first run
 * yields around 230, and the first three levels cost 79, 122 and 173 — so an
 * opening expedition buys two levels and most of a third, and a new player sees
 * the whole loop close (set out, die, gain, spend) inside one sitting.
 *
 * The quadratic term is what makes the far end behave: by level fifteen a
 * strong deep-road expedition is worth roughly half a level, which is the pace
 * at which a permanent number stays worth chasing without becoming a job.
 */
export function xpForCultivation(level: number): number {
  return Math.round(45 + level * 30 + level * level * 4.2)
}

/** Points granted for reaching `level`. Realm advances pay extra. */
export function pointsForLevel(level: number): number {
  return isRealmAdvance(level) ? 3 : 1
}

/** What a finished expedition is worth, itemised so the end screen can show it. */
export interface RunResult {
  kills: number
  seconds: number
  /** In-run Insight level reached. */
  insight: number
  depth: number
}

export interface Reward {
  kills: number
  time: number
  insight: number
  /** Multiplier from expedition depth, already applied to `total`. */
  depthBonus: number
  total: number
}

/**
 * Turns an expedition into cultivation XP.
 *
 * Three terms, because three is what fits on the end screen as three rows the
 * player can read and connect to what they just did. Kills reward clearing,
 * time rewards surviving, and Insight rewards actually gathering qi instead of
 * running in circles — without that third term, the optimal expedition would be
 * to walk away from every fight.
 */
export function rewardFor(result: RunResult): Reward {
  const kills = result.kills
  const time = Math.floor(result.seconds / 3)
  const insight = Math.max(0, result.insight - 1) * 8
  const depthBonus = depthReward(result.depth)
  return {
    kills,
    time,
    insight,
    depthBonus,
    total: Math.round((kills + time + insight) * depthBonus),
  }
}

/**
 * XP multiplier for expedition depth.
 *
 * Re-exported rather than redefined. It was briefly defined in both this file
 * and the region table, and the two drifted apart the moment one was tuned —
 * the reward screen quoted one number while the totals used another. A region's
 * payout is a property of the region, so the region table owns it.
 */
export { depthReward }

/** What `grantXp` actually did, so the caller can announce it. */
export interface LevelGain {
  levelsGained: number
  pointsGained: number
  /** Highest realm crossed, or null if none was. */
  realmAdvancedTo: number | null
  /** New depths unlocked by this gain. */
  depthUnlocked: number | null
}

/**
 * Adds cultivation XP and applies every level it crosses.
 *
 * Mutates `character` and returns a summary. The loop is a `while` for the same
 * reason the in-run one is: a strong expedition at a low level can cross several
 * thresholds at once, and swallowing the extra levels would quietly take
 * something the player earned.
 */
export function grantXp(character: Character, amount: number): LevelGain {
  const gain: LevelGain = {
    levelsGained: 0,
    pointsGained: 0,
    realmAdvancedTo: null,
    depthUnlocked: null,
  }
  if (amount <= 0) return gain

  character.xp += amount
  while (character.xp >= xpForCultivation(character.level)) {
    character.xp -= xpForCultivation(character.level)
    character.level++
    gain.levelsGained++
    const points = pointsForLevel(character.level)
    character.points += points
    gain.pointsGained += points

    if (isRealmAdvance(character.level)) {
      gain.realmAdvancedTo = character.level
      // A realm is also the key to deeper ground: the ladder and the difficulty
      // unlock are the same event, so "what did that get me" has one answer.
      // Capped at the number of regions that exist. The ladder runs to forty
      // levels and the world has five places; without this the character ends
      // up "unlocking" a sixth region and the hub points at nothing.
      const unlocked = Math.min(
        MAX_DEPTH,
        1 + Math.floor((character.level - 1) / LEVELS_PER_REALM),
      )
      if (unlocked > character.depth) {
        character.depth = unlocked
        gain.depthUnlocked = unlocked
      }
    }
  }
  return gain
}

/** Anything with a slot and a rank — deliberately structural, not imported
 * from ui/hud.ts's `Found`, so this file does not reach into the UI layer for
 * a shape this generic. */
export interface SettledFind {
  readonly item: { readonly slot: string }
  readonly rank: number
}

/**
 * Which of an expedition's finds a DEATH actually keeps — the "semi hardcore"
 * stake that makes pushing a rift's gate a real decision rather than a free
 * one.
 *
 * Before this, banking and dying paid out identically: `settleExpedition`
 * granted the same cultivation and the same loot either way, so a player who
 * kept pushing risked nothing by not banking. Two things are still NEVER at
 * risk, on purpose, so a bad expedition still always means SOMETHING:
 *
 *   - everything found before the last gate this expedition cleared. Clearing
 *     a gate is the proof of progress, and it banks everything up to it
 *     whether the player then leaves or pushes on — see `pushDeeper` in
 *     main.ts, which is what advances `securedCount`.
 *   - the FIRST piece found for a slot that was empty at the start of the
 *     expedition. A death must never be able to erase a run's only find, or a
 *     bad first expedition would teach a new player that finding gear was
 *     pointless.
 *
 * Everything else — an upgrade, a duplicate, a second piece for a slot
 * already filled, found in the tier being fought toward the NEXT gate — is
 * lost on death and kept only by banking (`banked = true`, which this
 * function then treats as "everything is secured", matching the gate
 * screen's own promise that leaving risks nothing).
 */
export function settleFound<T extends SettledFind>(
  found: readonly T[],
  securedCount: number,
  emptyAtStart: ReadonlySet<string>,
  banked: boolean,
): T[] {
  if (banked) return [...found]
  const claimed = new Set<string>()
  const kept: T[] = []
  found.forEach((f, i) => {
    if (i < securedCount) {
      kept.push(f)
      return
    }
    const slot = f.item.slot
    if (emptyAtStart.has(slot) && !claimed.has(slot)) {
      claimed.add(slot)
      kept.push(f)
    }
  })
  return kept
}

/** Spends one point. Returns false when there is none to spend. */
export function spendPoint(character: Character, id: AttributeId): boolean {
  if (character.points <= 0) return false
  character.points--
  character.spent[id]++
  return true
}

/** Total levels the ladder describes before the last realm goes open-ended. */
export const NAMED_LEVEL_CAP = REALMS.length * LEVELS_PER_REALM

/** Folds an expedition's outcome into the lifetime totals. */
export function recordRun(character: Character, result: RunResult): void {
  character.runs++
  character.totalKills += result.kills
  character.bestSeconds = Math.max(character.bestSeconds, Math.floor(result.seconds))
}
