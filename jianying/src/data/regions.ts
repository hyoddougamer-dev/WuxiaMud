/**
 * The world — five places, not eight difficulty steps.
 *
 * What this replaces is worth stating, because it is the whole point of the
 * change. A "road" used to be enemy health ×1.38 and a line of flavour text:
 * the same ground everywhere, with a dial on it. You picked road 4 because 4
 * was bigger than 3, which is not a decision, it is arithmetic.
 *
 * A region is a PLACE. It has:
 *
 *   a rule     one sentence that changes how the game is played there
 *   a roster   enemies that appear nowhere else
 *   a boss     which asks the region's own question, loudly, once
 *   a table    items that drop only here
 *
 * That last one is what makes the map a decision rather than a ladder: you walk
 * into the marsh because the Tattered Shroud is in the marsh, and you accept
 * being slowed to get it.
 *
 * Five, not eight. The eight roads were four named steps and four empty ones;
 * five places with rosters are worth more than eight with skins. The three that
 * were cut had names and nothing behind them.
 */

/**
 * How a region bends the simulation.
 *
 * Every field is optional and every one is read in exactly one place, so a new
 * region is a row of data rather than a branch in the game loop. The Post Road
 * sets none of them, deliberately: somewhere has to be the baseline the others
 * are felt against.
 */
export interface RegionRule {
  /**
   * Multiplier on the player's movement speed. Enemies are unaffected — that
   * asymmetry is the point, and it is what makes reach suddenly matter.
   */
  readonly playerSpeed?: number
  /**
   * A steady push on the player, in world units per second. The direction
   * rotates slowly, so no single stance stays safe.
   */
  readonly drift?: number
  /** Seconds for the drift to complete one full turn. */
  readonly driftPeriod?: number
  /**
   * Everything that dies comes apart into this many of `splitInto`, on top of
   * whatever it would normally split into.
   */
  readonly splitAll?: number
  readonly splitInto?: string
  /**
   * Enemies arrive inside an arc of this half-width (radians) instead of the
   * full ring. Small values give the player a front to hold.
   */
  readonly formationArc?: number
  /** Seconds for the formation's arc to sweep once around. */
  readonly formationPeriod?: number
}

export interface Region {
  readonly id: string
  /** Chinese name, used as the seal on the map. */
  readonly seal: string
  readonly name: string
  /** Two lines of place, not of mechanics. */
  readonly blurb: string
  /** The rule, in the player's words. Shown on the map and in the HUD. */
  readonly ruleText: string
  readonly rule: RegionRule
  /**
   * Kinds that spawn here. Regional kinds carry `weight: 0` globally and are
   * named here instead, which is what keeps a marsh from drawing cliff hawks.
   */
  readonly roster: readonly string[]
  readonly bossId: string
  /**
   * Bases this region can drop. This is what makes the map a choice.
   *
   * BOTH WEAPONS SIT ON THE FIRST ROAD, and nothing deeper drops a weapon at
   * all. With six of them the roster could afford to gate a class behind depth
   * 4 — there were five others to meet first. With two, a gated class is a
   * class most players never see, and the choice between them is the whole
   * game. Deeper ground pays in rungs and lines instead, which is what the
   * rarity ladder is for.
   */
  readonly drops: readonly string[]
  /** Position in the world, and the difficulty step. 1-based. */
  readonly depth: number
  /**
   * Qi needed to fill this region's rift at tier 1 — see `riftTargetFor` in
   * data/enemies.ts. MEASURED per region rather than one constant for all
   * five: `tools/runLength.mts --calibrate` found the qi a clean run earns in
   * five minutes, and a first pass set `riftBase` straight from that. It was
   * wrong — that number is roughly what a build earns in its whole LIFE, so a
   * boss calibrated to it arrives the instant before the player was already
   * going to die, with no room left to actually fight it. The value here
   * instead comes from `tools/runLength.mts --search`, against a criterion
   * that CHANGED once the reward loop was measured properly, so the old one is
   * recorded here rather than quietly replaced.
   *
   * It used to be "the largest target an unequipped, mid-cultivation swordsman
   * clears about half the time". That produced gates around a hundred seconds,
   * and a hundred seconds turned out to be shorter than a build: the engaged
   * pilot reached grade 11 of the 16 a four-art build needs, so a run ended
   * just before the thing the whole genre is built around — watching the build
   * come online — could happen. The gate was cutting the run off mid-sentence.
   *
   * The criterion now is `--secs 200 --aim 0.9`: the gate OPENS at about two
   * hundred seconds and opens reliably, after which staying is the player's
   * choice rather than the game's. Measured at these values, the engaged pilot
   * finishes a build on the Post Road and comes close on the Reed Marsh.
   *
   * THE DEEPER THREE MOVED A LONG WAY on the second pass, and the reason is
   * that the simulation changed under them. When they were searched, 疾 did not
   * move the player and 神 did not reach the arts; with both wired, the same
   * swordsman survives deeper ground for longer and the search can push the
   * gate further before it stops being clearable. The Ghost Market went from
   * 369 to 609 and the Pass from 385 to 529 — which is to say a deep run had
   * become a sixty-second sprint, and is now closer to the hundred and fifty
   * the shallow ones take.
   *
   * They still open sooner than the Post Road's two hundred, and that is left
   * standing: how long an ungeared swordsman lasts is the ceiling down there,
   * not the size of the target. Deep ground asking for gear before it will pay
   * a full build is a defensible progression statement; it is not one anybody
   * chose, so it stays written down.
   *
   * The Broken Cliff's search result, 641, was REJECTED after checking it: at
   * the search's own four seeds it cleared every time, and at six it fell to
   * 67% for the sweeper. Left at 513, which clears for both classes across all
   * six. `play`'s own note warns about calibrating against too little of the
   * game; four seeds is the same mistake in the other axis.
   */
  readonly riftBase: number
}

export const REGIONS: readonly Region[] = [
  {
    id: 'road',
    seal: '官道',
    name: 'The Post Road',
    blurb:
      'The imperial highway, and nobody left to police it. Milestones, dust, and relay stations standing open.',
    ruleText: 'Open ground. Nothing here is against you but what walks it.',
    rule: {},
    roster: ['bandit', 'runner', 'courier'],
    bossId: 'roadtiger',
    drops: ['r-plain', 's-plain', 'h-topknot', 'w-great', 'w-feidao'],
    depth: 1,
    // RECALIBRATED from 547 when the roster went from six weapons to two, and
    // the old value was plainly stale even before that: every other region on
    // this map sits between 3 and 97, and 547 was tuned against a jian that
    // survived far longer here than either surviving class does.
    //
    // Measured with tools/runLength.mts at the duel pilot: the zhanmadao earns
    // 212 qi and the daggers 231 before the run ends, so 180 is a bar both
    // reach. See docs/CORRIDAS.md for the imbalance this measurement exposed,
    // which is a design problem rather than a number: the gate is a single
    // fast boss, which is the thrower's best fight and the sweeper's worst.
    riftBase: 2209,
  },
  {
    id: 'marsh',
    seal: '芦荡',
    name: 'The Reed Marsh',
    blurb:
      'Flooded farmland south of the road. Reeds above head height, and the water keeps what it takes.',
    ruleText: 'You wade. They do not — reach is worth more than closing.',
    rule: { playerSpeed: 0.85 },
    roster: ['bandit', 'drowned', 'leech'],
    bossId: 'reedmother',
    drops: ['r-tattered', 's-bare', 'h-bare'],
    depth: 2,
    riftBase: 1089,
  },
  {
    id: 'cliff',
    seal: '断崖',
    name: 'The Broken Cliff',
    blurb:
      'A mountain road half fallen into the gorge. What is left of it is loose, and the wind never stops.',
    ruleText: 'The wind pushes you, and it turns. Standing still is not standing still.',
    rule: { drift: 38, driftPeriod: 26 },
    roster: ['archer', 'hawk', 'windbell'],
    bossId: 'cliffwarden',
    drops: ['r-travelling', 's-wide', 'h-hat'],
    depth: 3,
    riftBase: 737,
  },
  {
    id: 'market',
    seal: '鬼市',
    name: 'The Ghost Market',
    blurb:
      'A night market that trades in paper offerings for the dead. Everything sold here is folded, and nothing stays whole.',
    ruleText: 'Everything you cut comes apart. Killing is not automatically right.',
    rule: { splitAll: 1, splitInto: 'scrap' },
    roster: ['effigy', 'paperhorse', 'pilgrim'],
    bossId: 'papermaker',
    drops: ['r-court', 's-mantle', 'h-crown'],
    depth: 4,
    riftBase: 609,
  },
  {
    id: 'pass',
    seal: '关隘',
    name: 'The Pass',
    blurb:
      'The gate between the provinces, held for eleven years by a man who was never given the order to hold it.',
    ruleText: 'They come in ranks, from one side. For once you have a front.',
    rule: { formationArc: 0.85, formationPeriod: 38 },
    roster: ['brute', 'glaive', 'signal', 'archer'],
    bossId: 'warlord',
    drops: ['r-lamellar', 'r-layered', 's-pauldron', 'h-veiled'],
    depth: 5,
    riftBase: 529,
  },
] as const

export const REGION_BY_ID = new Map(REGIONS.map((r) => [r.id, r]))

export const MAX_DEPTH = REGIONS.length

export const DEFAULT_REGION = REGIONS[0]!

/** The region at a 1-based depth, clamped. */
export function regionAt(depth: number): Region {
  const index = Math.min(REGIONS.length, Math.max(1, Math.floor(depth) || 1)) - 1
  return REGIONS[index]!
}

export function regionById(id: string | undefined): Region {
  return REGION_BY_ID.get(id ?? '') ?? DEFAULT_REGION
}

/** Clamps a chosen depth to what the character has unlocked. */
export function clampDepth(depth: number, unlocked: number): number {
  return Math.max(1, Math.min(Math.min(MAX_DEPTH, unlocked), Math.floor(depth) || 1))
}

/**
 * Multiplier on enemy health for a region.
 *
 * Health rather than damage: a deeper region should ask for more sustained
 * cutting, not delete a player who misreads one charge. Damage scaling would
 * turn depth into a coin flip against the immunity window instead of a test.
 */
export function depthHealthScale(depth: number): number {
  // Gentle, and it was not always. At 0.4 per step the Pass multiplied an
  // already-heavy roster by 2.6 and a starting character scored literally zero
  // kills in fifty-four seconds — measured, not guessed. A region is now hard
  // because of WHAT lives there, so the multiplier only has to tilt the scales,
  // not carry the difficulty on its own.
  return 1 + (Math.max(1, depth) - 1) * 0.18
}

/** Multiplier on spawn rate. Gentler than health, since the pool has a ceiling. */
export function depthSpawnScale(depth: number): number {
  return 1 + (Math.max(1, depth) - 1) * 0.17
}

/** Cultivation multiplier for walking a deeper region. */
export function depthReward(depth: number): number {
  return 1 + (Math.max(1, depth) - 1) * 0.55
}

/**
 * Picks a kind from a region's roster. `roll` is a 0..1 uniform.
 *
 * Unlike the old global draw this ignores `weight` and `unlockAt` entirely: a
 * region's roster IS the answer to what lives there, and a marsh should not
 * have to wait thirty seconds before its own inhabitants are allowed to appear.
 */
export function pickFromRoster(region: Region, roll: number): string {
  const roster = region.roster
  const index = Math.min(roster.length - 1, Math.floor(roll * roster.length))
  return roster[index]!
}
