/**
 * Enemy definitions, behaviours and the difficulty ramp.
 *
 * Everything here is data, deliberately: balancing a survivors-like is dozens
 * of small numeric passes, and each one should be a number edited in this file
 * rather than a change to the simulation. The headless balance tests read these
 * same values, so a tuning change is checked by CI instead of by feel alone.
 *
 * Behaviour is the part that matters most for how the game feels over time. A
 * field of pure chasers is the same fight at minute one and minute five, only
 * denser — which is exactly the monotony this roster exists to break. Each
 * behaviour asks the player a different question:
 *
 *   chaser   — where do I stand?          (the baseline pressure)
 *   darter   — what do I deal with first? (fast, fragile, arrives early)
 *   charger  — when do I move?            (telegraphs, then commits)
 *   shooter  — can I ignore the back?     (hurts from outside the sweep)
 *   splitter — is killing this a good idea? (dies into two more)
 *   lurker   — is that ground safe?       (waits, unmoving, until you are close)
 *   enrager  — should I swing at this?    (harmless until struck, then not)
 *   boss     — everything at once
 *
 * The last two exist because the regions needed questions the first six could
 * not ask. A marsh is frightening because of what is already in the water, not
 * because of what runs at you; and a market of paper offerings is only
 * interesting if cutting indiscriminately is a mistake.
 */

export type Behaviour =
  | 'chaser'
  | 'darter'
  | 'charger'
  | 'shooter'
  | 'splitter'
  | 'lurker'
  | 'enrager'
  | 'boss'

export interface EnemyKind {
  readonly id: string
  /** Display name, English — the product language. */
  readonly name: string
  readonly behaviour: Behaviour
  readonly hp: number
  /** World units per second. */
  readonly speed: number
  /** Damage dealt to the player on contact. */
  readonly damage: number
  /** Collision radius, in world units. */
  readonly radius: number
  /** Seconds from the start of a run before this kind can appear. */
  readonly unlockAt: number
  /** Relative spawn weight once unlocked. Zero means it never spawns normally. */
  readonly weight: number
  /** Qi dropped on death. */
  readonly qi: number

  // --- behaviour parameters, ignored by behaviours that do not use them ---
  /** charger: seconds spent winding up before the dash. */
  readonly windup?: number
  /** charger: speed multiplier during the dash. */
  readonly dashSpeed?: number
  /** charger: seconds the dash lasts. */
  readonly dashTime?: number
  /** shooter: seconds between shots. */
  readonly fireInterval?: number
  /** shooter: distance it tries to hold. */
  readonly standoff?: number
  /** shooter/boss: damage of the projectile it fires. */
  readonly shotDamage?: number
  /** splitter: id of the kind it splits into. */
  readonly splitsInto?: string
  /** splitter: how many it splits into. */
  readonly splitCount?: number
  /** lurker: how close the player must come before it wakes. */
  readonly wakeRadius?: number
  /** lurker/enrager: speed multiplier once roused. */
  readonly rousedSpeed?: number
}

/**
 * Speeds sit below the player's 250 on purpose. Enemies that outrun the player
 * remove the only defence a one-thumb game has — walking away — and the genre's
 * tension comes from being surrounded, not outpaced. The charger is the single
 * exception, and only for the second or so its dash lasts.
 */
export const ENEMY_KINDS: readonly EnemyKind[] = [
  {
    id: 'bandit',
    name: 'Roadside Bandit',
    behaviour: 'chaser',
    hp: 10,
    speed: 62,
    damage: 5,
    radius: 9,
    unlockAt: 0,
    weight: 100,
    qi: 1,
  },
  {
    id: 'runner',
    name: 'Cutpurse',
    behaviour: 'darter',
    hp: 6,
    speed: 118,
    damage: 4,
    radius: 7.5,
    // Held back so the opening seconds are readable: fast enemies in the first
    // moments of a run teach the player nothing except that they are unlucky.
    unlockAt: 30,
    weight: 60,
    qi: 1,
  },
  {
    id: 'charger',
    name: 'Leaping Adept',
    behaviour: 'charger',
    hp: 18,
    speed: 40,
    damage: 10,
    radius: 10,
    unlockAt: 55,
    weight: 55,
    qi: 2,
    windup: 0.75,
    dashSpeed: 6.5,
    dashTime: 0.55,
  },
  {
    id: 'brute',
    name: 'Iron Monk',
    behaviour: 'chaser',
    hp: 42,
    speed: 44,
    damage: 14,
    radius: 13,
    unlockAt: 90,
    weight: 32,
    qi: 3,
  },
  {
    id: 'archer',
    name: 'Crossbow Hand',
    behaviour: 'shooter',
    hp: 14,
    speed: 70,
    damage: 4,
    radius: 9,
    unlockAt: 72,
    weight: 45,
    qi: 2,
    fireInterval: 2.1,
    standoff: 240,
    shotDamage: 8,
  },
  {
    id: 'effigy',
    name: 'Paper Effigy',
    behaviour: 'splitter',
    hp: 30,
    speed: 52,
    damage: 8,
    radius: 12,
    unlockAt: 108,
    weight: 40,
    qi: 2,
    splitsInto: 'scrap',
    splitCount: 3,
  },
  {
    id: 'scrap',
    name: 'Torn Scrap',
    behaviour: 'darter',
    hp: 5,
    speed: 96,
    damage: 3,
    radius: 6,
    unlockAt: 0,
    // Never rolled directly — it only ever arrives by an effigy coming apart.
    weight: 0,
    qi: 1,
  },
  {
    id: 'warlord',
    name: 'Warlord of the Pass',
    behaviour: 'boss',
    hp: 1400,
    speed: 56,
    damage: 22,
    radius: 30,
    unlockAt: 0,
    weight: 0, // summoned by the schedule, never rolled
    qi: 40,
    fireInterval: 2.4,
    shotDamage: 11,
  },

  // ===================================================================
  // Regional rosters. Every kind below has `weight: 0` in the global draw
  // and is instead named by a region in data/regions.ts — that is what makes
  // the marsh feel like the marsh instead of like the road with more health.
  // ===================================================================

  // --- 官道 The Post Road ---------------------------------------------
  {
    id: 'courier',
    name: 'Relay Courier',
    behaviour: 'darter',
    hp: 8,
    // Still carrying the imperial post, and still trying to deliver it. Fast,
    // fragile, and worth chasing down — the road's one reason to break stance.
    speed: 132,
    damage: 3,
    radius: 7.5,
    unlockAt: 20,
    weight: 0,
    qi: 5,
  },
  {
    id: 'roadtiger',
    name: 'The Tiger Who Blocks the Road',
    behaviour: 'boss',
    hp: 900,
    speed: 62,
    damage: 18,
    radius: 26,
    unlockAt: 0,
    weight: 0,
    qi: 30,
    fireInterval: 3.2,
    shotDamage: 8,
  },

  // --- 芦荡 The Reed Marsh --------------------------------------------
  {
    id: 'drowned',
    name: 'The Drowned',
    behaviour: 'lurker',
    hp: 26,
    // Motionless in the water until you are almost on top of it, then quick.
    speed: 96,
    damage: 11,
    radius: 10,
    unlockAt: 0,
    weight: 0,
    qi: 2,
    wakeRadius: 120,
    rousedSpeed: 1,
  },
  {
    id: 'leech',
    name: 'Fen Leech',
    behaviour: 'chaser',
    // Slow and hard to finish. In a region where you are already slowed, a
    // thing that will not die is a different problem from a thing that is fast.
    // Down from 58: at that value the marsh cut the kill rate to a quarter of
    // the road's, which reads as a broken weapon rather than as deep water.
    hp: 38,
    speed: 38,
    damage: 9,
    radius: 11,
    unlockAt: 0,
    weight: 0,
    qi: 3,
  },
  {
    id: 'reedmother',
    name: 'Mother of Reeds',
    behaviour: 'boss',
    hp: 1150,
    // Barely moves. The fight is about whether you can reach her at all while
    // wading — which is exactly the marsh's own question, asked once, loudly.
    speed: 22,
    damage: 20,
    radius: 30,
    unlockAt: 0,
    weight: 0,
    qi: 36,
    fireInterval: 2.1,
    shotDamage: 10,
  },

  // --- 断崖 The Broken Cliff ------------------------------------------
  {
    id: 'hawk',
    name: 'Cliff Hawk',
    behaviour: 'darter',
    hp: 9,
    // The fastest thing in the game. On a road where the wind already moves
    // you, something quicker than the wind is genuinely alarming.
    speed: 158,
    damage: 6,
    radius: 7,
    unlockAt: 0,
    weight: 0,
    qi: 2,
  },
  {
    id: 'windbell',
    name: 'Windbell Adept',
    behaviour: 'shooter',
    hp: 20,
    speed: 62,
    damage: 5,
    radius: 9,
    unlockAt: 0,
    weight: 0,
    qi: 3,
    fireInterval: 1.7,
    standoff: 265,
    shotDamage: 9,
  },
  {
    id: 'cliffwarden',
    name: 'Warden of the Broken Cliff',
    behaviour: 'boss',
    hp: 1250,
    speed: 48,
    damage: 19,
    radius: 28,
    unlockAt: 0,
    weight: 0,
    qi: 38,
    // Fires faster than the other bosses: with the wind already moving you,
    // the ring volleys become a positional puzzle rather than a dodge.
    fireInterval: 1.9,
    shotDamage: 10,
  },

  // --- 鬼市 The Ghost Market ------------------------------------------
  {
    id: 'paperhorse',
    name: 'Paper Horse',
    behaviour: 'charger',
    hp: 24,
    speed: 44,
    damage: 12,
    radius: 11,
    unlockAt: 0,
    weight: 0,
    qi: 2,
    windup: 0.65,
    dashSpeed: 7,
    dashTime: 0.5,
    splitsInto: 'scrap',
    splitCount: 2,
  },
  {
    id: 'pilgrim',
    name: 'Incense Pilgrim',
    behaviour: 'enrager',
    hp: 34,
    // Wanders, harmless, until something cuts it. In a market where the sweep
    // hits everything nearby, that is a real cost to swinging without looking.
    speed: 30,
    damage: 16,
    radius: 10,
    unlockAt: 0,
    weight: 0,
    qi: 4,
    rousedSpeed: 3.1,
  },
  {
    id: 'papermaker',
    name: 'The Paper Maker',
    behaviour: 'boss',
    hp: 1050,
    speed: 44,
    damage: 17,
    radius: 27,
    unlockAt: 0,
    weight: 0,
    qi: 36,
    fireInterval: 2.6,
    shotDamage: 9,
    // Comes apart like everything else here, and into a great deal of it.
    splitsInto: 'scrap',
    splitCount: 8,
  },

  // --- 关隘 The Pass ---------------------------------------------------
  {
    id: 'glaive',
    name: 'Glaive Rank',
    behaviour: 'chaser',
    // Down from 72. It is meant to be the thing that holds a line, not the
    // thing a starting weapon cannot scratch.
    hp: 46,
    speed: 46,
    damage: 16,
    radius: 13,
    unlockAt: 0,
    weight: 0,
    qi: 4,
  },
  {
    id: 'signal',
    name: 'Signal Arrow',
    behaviour: 'shooter',
    hp: 16,
    speed: 74,
    damage: 4,
    radius: 8.5,
    unlockAt: 0,
    weight: 0,
    qi: 3,
    fireInterval: 2.6,
    standoff: 300,
    shotDamage: 7,
  },
] as const

export const KIND_BY_ID = new Map(ENEMY_KINDS.map((k) => [k.id, k]))

/** Hard ceiling on live enemies. The pool is sized to this. */
export const MAX_ENEMIES = 420

/**
 * Seconds between bosses. The first arrives at the first multiple.
 *
 * Set against measured run lengths, not taste. At 180 the boss was simply
 * unreachable: headless runs end around 90s and even a good player was dying
 * before it appeared, so a fight that had been built and tested was content
 * nobody would ever see. The same measurement pulled every unlock earlier.
 */
export const BOSS_EVERY = 115

/**
 * Spawns per second at a given point in the run.
 *
 * Roughly linear early, then bending upward, so the pressure builds without the
 * first minute being empty. Capped so the pool ceiling is a design decision
 * rather than something the ramp collides with by accident.
 */
export function spawnRate(elapsedSeconds: number): number {
  const minutes = elapsedSeconds / 60
  return Math.min(22, 0.9 + minutes * 1.7 + minutes * minutes * 0.55)
}

/**
 * Multiplier applied to enemy HP as the run goes on.
 *
 * Without this, late-game weapons erase everything instantly and the run has no
 * end. Kept gentle: difficulty in this genre should come mostly from the
 * quantity on screen, not from bullet-sponge enemies.
 */
export function healthScale(elapsedSeconds: number): number {
  return 1 + (elapsedSeconds / 60) * 0.42
}

/** Picks a kind available at `elapsed`, weighted. `roll` is a 0..1 uniform. */
export function pickEnemyKind(elapsed: number, roll: number): EnemyKind {
  const available = ENEMY_KINDS.filter((k) => k.weight > 0 && elapsed >= k.unlockAt)
  const total = available.reduce((sum, k) => sum + k.weight, 0)
  let target = roll * total
  for (const kind of available) {
    target -= kind.weight
    if (target <= 0) return kind
  }
  return available[available.length - 1]!
}
