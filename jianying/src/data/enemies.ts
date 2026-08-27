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
 *   boss     — everything at once
 */

export type Behaviour = 'chaser' | 'darter' | 'charger' | 'shooter' | 'splitter' | 'boss'

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
