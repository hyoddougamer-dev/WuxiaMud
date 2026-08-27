/**
 * Enemy swarm: spawning, behaviour and separation.
 *
 * The swarm is a fixed-capacity pool that never allocates while a run is in
 * progress. Every position update is a plain indexed loop over dense storage,
 * which is what makes several hundred pursuers affordable on a phone.
 *
 * Behaviour is a tiny state machine per enemy rather than a class hierarchy.
 * Pooled objects have to be recyclable into any kind, so an enemy cannot own
 * its behaviour as a subtype — the kind is data, and the state is three numbers
 * that mean different things depending on it.
 */
import { Pool } from '../core/pool'
import { Rng } from '../core/rng'
import { SpatialGrid } from '../core/grid'
import type { Hazards } from './hazards'
import {
  BOSS_EVERY,
  KIND_BY_ID,
  MAX_ENEMIES,
  type EnemyKind,
  healthScale,
  pickEnemyKind,
  spawnRate,
} from '../data/enemies'

/** Phases a charger passes through. */
export const CHARGE_IDLE = 0
export const CHARGE_WINDUP = 1
export const CHARGE_DASH = 2

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
  /**
   * Counts down before an orbiting blade may strike this enemy again.
   *
   * Without it, a blade parked on a slow enemy deletes it sixty times a second
   * and Guardian Blades becomes the only technique worth taking.
   */
  orbitImmunity: number

  // --- behaviour state ---
  /** Generic timer: shot cooldown, charge phase timer, dart retarget. */
  timer: number
  /** Charger phase, one of the CHARGE_* constants. */
  state: number
  /** Locked direction, used by the charger's dash and the darter's weave. */
  dirX: number
  dirY: number
}

const GRID_CELL = 28
const SEPARATION_FORCE = 42
const SPAWN_RING = 520

/**
 * Enemies further than this from the player are recycled.
 *
 * Larger than the spawn ring so that walking toward a group never despawns the
 * ones you are approaching — which would look like enemies blinking out.
 */
const DESPAWN_RADIUS = 1100

/** A boss is never recycled for distance; it would vanish the moment you ran. */
const BOSS_LEASH = 4000

export class Swarm {
  readonly pool: Pool<Enemy>
  readonly grid = new SpatialGrid(GRID_CELL)

  private spawnCredit = 0
  /** Index of the next boss wave, so each fires exactly once. */
  private nextBoss = 1
  /** True while a boss is alive; the ramp eases off during the fight. */
  bossAlive = false

  constructor(private rng: Rng) {
    const base = KIND_BY_ID.get('bandit')!
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
        orbitImmunity: 0,
        timer: 0,
        state: CHARGE_IDLE,
        dirX: 1,
        dirY: 0,
      }),
      (e) => {
        e.hp = 1
        e.maxHp = 1
        e.hitFlash = 0
        e.orbitImmunity = 0
        e.timer = 0
        e.state = CHARGE_IDLE
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
    this.nextBoss = 1
    this.bossAlive = false
    this.rng = new Rng(seed)
  }

  /** Places one enemy of `kind` at a world position. Returns it, or null. */
  place(kind: EnemyKind, x: number, y: number, elapsed: number): Enemy | null {
    const e = this.pool.spawn()
    if (!e) return null
    e.x = x
    e.y = y
    e.prevX = x
    e.prevY = y
    e.kind = kind
    e.maxHp = kind.hp * healthScale(elapsed)
    e.hp = e.maxHp
    e.hitFlash = 0
    e.orbitImmunity = 0
    e.phase = this.rng.next() * Math.PI * 2
    // Staggered, so a wave of shooters does not volley in perfect unison.
    e.timer = this.rng.range(0, kind.fireInterval ?? 1)
    e.state = CHARGE_IDLE
    const a = this.rng.next() * Math.PI * 2
    e.dirX = Math.cos(a)
    e.dirY = Math.sin(a)
    return e
  }

  /** Places one enemy on a ring around the player, outside what the camera sees. */
  private spawnOne(playerX: number, playerY: number, elapsed: number): boolean {
    const kind = pickEnemyKind(elapsed, this.rng.next())
    const angle = this.rng.next() * Math.PI * 2
    const distance = SPAWN_RING + this.rng.range(0, 120)
    return (
      this.place(
        kind,
        playerX + Math.cos(angle) * distance,
        playerY + Math.sin(angle) * distance,
        elapsed,
      ) !== null
    )
  }

  /** Splits a dying effigy into its scraps, thrown outward from the corpse. */
  splitOnDeath(e: Enemy, elapsed: number): void {
    const childId = e.kind.splitsInto
    if (!childId) return
    const child = KIND_BY_ID.get(childId)
    if (!child) return
    const count = e.kind.splitCount ?? 2
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + this.rng.next()
      this.place(child, e.x + Math.cos(a) * 18, e.y + Math.sin(a) * 18, elapsed)
    }
  }

  /** Advances spawning, behaviour and separation by one fixed tick. */
  update(
    playerX: number,
    playerY: number,
    elapsed: number,
    dt: number,
    hazards: Hazards,
  ): void {
    // --- boss schedule -------------------------------------------------
    if (!this.bossAlive && elapsed >= this.nextBoss * BOSS_EVERY) {
      const boss = KIND_BY_ID.get('warlord')!
      const a = this.rng.next() * Math.PI * 2
      const placed = this.place(
        boss,
        playerX + Math.cos(a) * SPAWN_RING,
        playerY + Math.sin(a) * SPAWN_RING,
        elapsed,
      )
      if (placed) {
        this.bossAlive = true
        this.nextBoss++
      }
    }

    // --- spawn ---------------------------------------------------------
    // Credit accumulates fractionally so a rate of 2.5/s really produces 2.5,
    // rather than being rounded off every tick. The ramp eases during a boss
    // so the fight is legible instead of being buried under the usual flood.
    const rate = spawnRate(elapsed) * (this.bossAlive ? 0.45 : 1)
    this.spawnCredit += rate * dt
    while (this.spawnCredit >= 1) {
      this.spawnCredit -= 1
      if (!this.spawnOne(playerX, playerY, elapsed)) {
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

    // --- behave --------------------------------------------------------
    for (let i = 0; i < this.pool.size; i++) {
      const e = this.pool.at(i)
      e.prevX = e.x
      e.prevY = e.y

      let dx = playerX - e.x
      let dy = playerY - e.y
      const dist = Math.hypot(dx, dy) || 1
      dx /= dist
      dy /= dist

      let speed = e.kind.speed
      let moveX = dx
      let moveY = dy

      switch (e.kind.behaviour) {
        case 'darter': {
          // Weaves around the approach line instead of walking it, so a cluster
          // of fast enemies does not arrive as a single arrow.
          e.timer -= dt
          if (e.timer <= 0) {
            e.timer = this.rng.range(0.35, 0.9)
            e.dirX = this.rng.range(-1, 1)
          }
          const swayX = -dy * e.dirX * 0.55
          const swayY = dx * e.dirX * 0.55
          moveX = dx + swayX
          moveY = dy + swayY
          break
        }

        case 'charger': {
          e.timer -= dt
          if (e.state === CHARGE_IDLE) {
            // Only commits once it is close enough for the dash to threaten.
            if (dist < 300 && e.timer <= 0) {
              e.state = CHARGE_WINDUP
              e.timer = e.kind.windup ?? 0.7
            }
            speed = e.kind.speed
          } else if (e.state === CHARGE_WINDUP) {
            // Braced and telegraphing. Standing still here is the whole point:
            // the player is given a beat to read it and step aside.
            speed = 0
            if (e.timer <= 0) {
              e.state = CHARGE_DASH
              e.timer = e.kind.dashTime ?? 0.5
              // Direction locks at the moment of commitment, so a dash can be
              // dodged. A homing dash would just be a fast chaser.
              e.dirX = dx
              e.dirY = dy
            }
          } else {
            speed = e.kind.speed * (e.kind.dashSpeed ?? 5)
            moveX = e.dirX
            moveY = e.dirY
            if (e.timer <= 0) {
              e.state = CHARGE_IDLE
              e.timer = this.rng.range(0.6, 1.4)
            }
          }
          break
        }

        case 'shooter': {
          const standoff = e.kind.standoff ?? 220
          // Holds a ring at `standoff`: closes when far, backs off when close.
          if (dist > standoff * 1.15) {
            speed = e.kind.speed
          } else if (dist < standoff * 0.8) {
            moveX = -dx
            moveY = -dy
            speed = e.kind.speed * 0.8
          } else {
            // Strafes, so a line of archers does not stand in a frozen ring.
            moveX = -dy
            moveY = dx
            speed = e.kind.speed * 0.5
          }

          e.timer -= dt
          if (e.timer <= 0 && dist < standoff * 1.6) {
            e.timer = e.kind.fireInterval ?? 2
            hazards.fire(e.x, e.y, dx, dy, e.kind.shotDamage ?? 6)
          }
          break
        }

        case 'boss': {
          e.timer -= dt
          if (e.timer <= 0) {
            e.timer = e.kind.fireInterval ?? 2.4
            // A ring of six, so the answer is to move rather than to face.
            for (let k = 0; k < 6; k++) {
              const a = e.phase + (k / 6) * Math.PI * 2
              hazards.fire(e.x, e.y, Math.cos(a), Math.sin(a), e.kind.shotDamage ?? 10, 170, 9)
            }
            e.phase += 0.45
          }
          break
        }

        default:
          break
      }

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
          const push = (min - d) / min
          sepX += (ox / d) * push
          sepY += (oy / d) * push
        }
      })

      const len = Math.hypot(moveX, moveY) || 1
      e.x += ((moveX / len) * speed + sepX * SEPARATION_FORCE) * dt
      e.y += ((moveY / len) * speed + sepY * SEPARATION_FORCE) * dt

      if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt)
      if (e.orbitImmunity > 0) e.orbitImmunity = Math.max(0, e.orbitImmunity - dt)
    }

    // --- recycle -------------------------------------------------------
    this.pool.forEachActive((e) => {
      const dx = e.x - playerX
      const dy = e.y - playerY
      const leash = e.kind.behaviour === 'boss' ? BOSS_LEASH : DESPAWN_RADIUS
      return dx * dx + dy * dy > leash * leash
    })
  }

  /** Removes the enemy at `index`. Used when it dies. */
  kill(index: number): void {
    if (this.pool.at(index).kind.behaviour === 'boss') this.bossAlive = false
    this.pool.release(index)
  }
}
