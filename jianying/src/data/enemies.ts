/**
 * Enemy definitions and the difficulty ramp.
 *
 * Everything here is data, deliberately: balancing a survivors-like is dozens
 * of small numeric passes, and each one should be a number edited in this file
 * rather than a change to the simulation. The headless balance tests read these
 * same values, so a tuning change is checked by CI instead of by feel alone.
 */

export interface EnemyKind {
  readonly id: string
  /** Display name, English — the product language. */
  readonly name: string
  readonly hp: number
  /** World units per second. */
  readonly speed: number
  /** Damage dealt to the player on contact. */
  readonly damage: number
  /** Collision radius, in world units. */
  readonly radius: number
  /** Drawn size relative to the base silhouette. */
  readonly scale: number
  /** Seconds from the start of a run before this kind can appear. */
  readonly unlockAt: number
  /** Relative spawn weight once unlocked. */
  readonly weight: number
}

/**
 * Speeds sit below the player's 250 on purpose. Enemies that outrun the player
 * remove the only defence a one-thumb game has — walking away — and the genre's
 * tension comes from being surrounded, not outpaced.
 */
export const ENEMY_KINDS: readonly EnemyKind[] = [
  {
    id: 'bandit',
    name: 'Roadside Bandit',
    hp: 10,
    speed: 62,
    damage: 5,
    radius: 9,
    scale: 0.85,
    unlockAt: 0,
    weight: 100,
  },
  {
    id: 'runner',
    name: 'Cutpurse',
    hp: 6,
    speed: 118,
    damage: 4,
    radius: 7.5,
    scale: 0.7,
    // Held back so the opening seconds are readable: fast enemies in the first
    // moments of a run teach the player nothing except that they are unlucky.
    unlockAt: 45,
    weight: 60,
  },
  {
    id: 'brute',
    name: 'Iron Monk',
    hp: 42,
    speed: 44,
    damage: 14,
    radius: 13,
    scale: 1.25,
    unlockAt: 100,
    weight: 30,
  },
] as const

/** Hard ceiling on live enemies. The pool is sized to this. */
export const MAX_ENEMIES = 420

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
  const available = ENEMY_KINDS.filter((k) => elapsed >= k.unlockAt)
  // ENEMY_KINDS always contains at least one kind unlocked at 0.
  const total = available.reduce((sum, k) => sum + k.weight, 0)
  let target = roll * total
  for (const kind of available) {
    target -= kind.weight
    if (target <= 0) return kind
  }
  return available[available.length - 1]!
}
