/**
 * Enemy swarm: spawning, pursuit and separation.
 *
 * The swarm is a fixed-capacity pool that never allocates while a run is in
 * progress. Every position update is a plain indexed loop over dense storage,
 * which is what makes several hundred pursuers affordable on a phone.
 */
import { Pool } from '../core/pool'
import { Rng } from '../core/rng'
import { SpatialGrid } from '../core/grid'
import {
  MAX_ENEMIES,
  type EnemyKind,
  healthScale,
  pickEnemyKind,
  spawnRate,
} from '../data/enemies'

export interface Enemy {
  x: number
  y: number
  prevX: number
  prevY: number
  hp: number
  maxHp: number
  kind: EnemyKind
  /** Counts down while the enemy flashes from a hit. */
  hitFlash: number
  /** Small per-enemy phase so a crowd does not bob in unison. */
  phase: number
}

/**
 * Cell size for the swarm grid.
 *
 * Sized near the separation radius, which is the most frequent query. Sword
 * sweeps query a larger radius and simply visit a few more cells.
 */
const GRID_CELL = 28

/** How hard enemies push apart when overlapping, in world units per second. */
const SEPARATION_FORCE = 42

/** Distance from the camera centre at which enemies are spawned. */
const SPAWN_RING = 520

/**
 * Enemies further than this from the player are recycled.
 *
 * Larger than the spawn ring so that walking toward a group never despawns the
 * ones you are approaching — which would look like enemies blinking out.
 */
const DESPAWN_RADIUS = 1100

export class Swarm {
  readonly pool: Pool<Enemy>
  readonly grid = new SpatialGrid(GRID_CELL)

  private spawnCredit = 0

  constructor(private rng: Rng) {
    const base = ENEMY_KINDS_FALLBACK
    this.pool = new Pool<Enemy>(
      MAX_ENEMIES,
      () => ({
        x: 0,
        y: 0,
        prevX: 0,
        prevY: 0,
        hp: 1,
        maxHp: 1,
        kind: base,
        hitFlash: 0,
        phase: 0,
      }),
      // Fields are set properly by spawnOne right after; this only guarantees
      // a recycled enemy never carries state from its previous life.
      (e) => {
        e.hp = 1
        e.maxHp = 1
        e.hitFlash = 0
      },
    )
  }

  get count(): number {
    return this.pool.size
  }

  /**
   * Clears the field and rewinds the random stream.
   *
   * Reseeding matters: a run is meant to be fully described by its seed, so two
   * players given the same daily seed must meet the same enemies in the same
   * order. Without this, only the first run after launch would match.
   */
  reset(seed: number): void {
    this.pool.clear()
    this.grid.clear()
    this.spawnCredit = 0
    this.rng = new Rng(seed)
  }

  /**
   * Places one enemy on a ring around the player, outside what the camera can
   * see. Returns false when the pool is full.
   */
  private spawnOne(playerX: number, playerY: number, elapsed: number): boolean {
    const enemy = this.pool.spawn()
    if (!enemy) return false

    const kind = pickEnemyKind(elapsed, this.rng.next())
    const angle = this.rng.next() * Math.PI * 2
    // A little jitter on the radius, so arrivals do not form a visible circle.
    const distance = SPAWN_RING + this.rng.range(0, 120)

    enemy.x = playerX + Math.cos(angle) * distance
    enemy.y = playerY + Math.sin(angle) * distance
    enemy.prevX = enemy.x
    enemy.prevY = enemy.y
    enemy.kind = kind
    enemy.maxHp = kind.hp * healthScale(elapsed)
    enemy.hp = enemy.maxHp
    enemy.hitFlash = 0
    enemy.phase = this.rng.next() * Math.PI * 2
    return true
  }

  /** Advances spawning, pursuit and separation by one fixed tick. */
  update(playerX: number, playerY: number, elapsed: number, dt: number): void {
    // --- spawn ---------------------------------------------------------
    // Credit accumulates fractionally so a rate of 2.5/s really produces 2.5,
    // rather than being rounded off every tick.
    this.spawnCredit += spawnRate(elapsed) * dt
    while (this.spawnCredit >= 1) {
      this.spawnCredit -= 1
      if (!this.spawnOne(playerX, playerY, elapsed)) {
        // Pool is full: drop the backlog instead of letting it build up and
        // dump a wall of enemies the moment space frees.
        this.spawnCredit = 0
        break
      }
    }

    // --- index ---------------------------------------------------------
    this.grid.clear()
    for (let i = 0; i < this.pool.size; i++) {
      const e = this.pool.at(i)
      this.grid.insert(i, e.x, e.y)
    }

    // --- move ----------------------------------------------------------
    for (let i = 0; i < this.pool.size; i++) {
      const e = this.pool.at(i)
      e.prevX = e.x
      e.prevY = e.y

      let dx = playerX - e.x
      let dy = playerY - e.y
      const dist = Math.hypot(dx, dy) || 1
      dx /= dist
      dy /= dist

      // Separation: push away from neighbours that are overlapping. Without
      // it the whole swarm collapses onto one point and reads as a single
      // blob, and the player cannot tell how many are actually there.
      let sepX = 0
      let sepY = 0
      const reach = e.kind.radius * 2
      this.grid.query(e.x, e.y, reach, (j) => {
        if (j === i || j >= this.pool.size) return
        const other = this.pool.at(j)
        const ox = e.x - other.x
        const oy = e.y - other.y
        const d2 = ox * ox + oy * oy
        const min = e.kind.radius + other.kind.radius
        if (d2 > 0.0001 && d2 < min * min) {
          const d = Math.sqrt(d2)
          // Strength rises as they overlap more.
          const push = (min - d) / min
          sepX += (ox / d) * push
          sepY += (oy / d) * push
        }
      })

      e.x += (dx * e.kind.speed + sepX * SEPARATION_FORCE) * dt
      e.y += (dy * e.kind.speed + sepY * SEPARATION_FORCE) * dt

      if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt)
    }

    // --- recycle -------------------------------------------------------
    this.pool.forEachActive((e) => {
      const dx = e.x - playerX
      const dy = e.y - playerY
      return dx * dx + dy * dy > DESPAWN_RADIUS * DESPAWN_RADIUS
    })
  }

  /** Removes the enemy at `index`. Used when it dies. */
  kill(index: number): void {
    this.pool.release(index)
  }
}

/** Placeholder kind used only to give pooled objects a valid shape at birth. */
const ENEMY_KINDS_FALLBACK: EnemyKind = {
  id: 'placeholder',
  name: '',
  hp: 1,
  speed: 0,
  damage: 0,
  radius: 8,
  scale: 1,
  unlockAt: 0,
  weight: 0,
}
