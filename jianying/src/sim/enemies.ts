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
import {
  DEFAULT_REGION,
  depthHealthScale,
  depthSpawnScale,
  pickFromRoster,
  type Region,
} from '../data/regions'
import type { Hazards } from './hazards'
import {
  KIND_BY_ID,
  MAX_ENEMIES,
  type EnemyKind,
  healthScale,
  spawnRate,
  tierHealthScale,
  tierSpawnScale,
} from '../data/enemies'

/** Phases a charger passes through. */
export const CHARGE_IDLE = 0
export const CHARGE_WINDUP = 1
export const CHARGE_DASH = 2

/**
 * A lurker or an enrager that has woken up.
 *
 * Shares the `state` field with the charger phases, which is safe because no
 * kind is ever both — a pooled enemy is recycled into any kind, so behaviour
 * cannot live in a subtype and these numbers mean different things depending
 * on `kind.behaviour`. Given a distinct value so a stray CHARGE_IDLE reset
 * cannot silently wake something.
 */
export const ROUSED = 10

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
  /**
   * True when this arrived by something else coming apart, rather than walking
   * in from the ring.
   *
   * It exists for exactly one reason: a splinter must not roll for equipment.
   * Loot is rolled per corpse, so without this the Ghost Market — where the
   * region rule splits everything — pays roughly two and a half times the loot
   * of anywhere else at the same depth, purely because it manufactures corpses.
   * That rewards the behaviour the place was built to punish: its whole rule is
   * that killing is not automatically right, and paying extra for each cut says
   * the opposite. Qi is deliberately left alone — a scrap is worth 1, which is
   * a rounding error, and stripping it would make the market unlevellable.
   */
  splinter: boolean
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
  /**
   * Set by the simulation once `RunState.riftValue` crosses its target — see
   * `sim/combat.ts`. The swarm no longer decides FOR ITSELF when a boss is
   * due; it only knows how to place one once told. Consumed on the next
   * `update()`, which is a one-frame lag nobody can feel at 60Hz.
   */
  private bossQueued = false
  /** True while a boss is alive; the ramp eases off during the fight. */
  bossAlive = false
  /**
   * How many gates this expedition has pushed past, at the CURRENT floor.
   * 1 at the first floor of any rift. Read by `place()` and `update()` to
   * scale health and spawn rate — see `tierHealthScale`/`tierSpawnScale`.
   */
  tier = 1

  /**
   * The place this expedition is walking.
   *
   * It supplies the roster, the boss, and the rule that bends the simulation.
   * Its depth also scales health and spawn rate, which is why permanent
   * character power does not simply flatten the game: growth is meant to be
   * spent on new ground, not on an easier version of the same ground.
   */
  region: Region = DEFAULT_REGION

  get depth(): number {
    return this.region.depth
  }

  /**
   * Where the formation arc currently points, in radians.
   *
   * Only meaningful in a region with `formationArc`. Advanced by `update` and
   * exposed so the renderer can show the player which way the front is.
   */
  formationAngle = 0

  /**
   * Set when a boss is placed, so the run can announce it. Read-and-clear: the
   * simulation has no channel back to the UI other than state the caller polls,
   * and a flag that resets on read cannot fire the same banner twice.
   */
  private bossJustArrived = false

  constructor(private rng: Rng, region: Region = DEFAULT_REGION) {
    this.region = region
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
        splinter: false,
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
   * Clears the field, sets the region, and rewinds the random stream.
   *
   * Reseeding matters: an expedition is meant to be fully described by its
   * seed, so re-running one seed must produce the same enemies in the same
   * order. Without this, only the first run after launch would reproduce.
   */
  reset(seed: number, region: Region = this.region, tier = 1): void {
    this.pool.clear()
    this.grid.clear()
    this.spawnCredit = 0
    this.bossQueued = false
    this.bossAlive = false
    this.bossJustArrived = false
    this.region = region
    this.tier = tier
    this.formationAngle = 0
    this.rng = new Rng(seed)
  }

  /** True once per boss arrival, then false until the next one. */
  takeBossArrival(): boolean {
    const arrived = this.bossJustArrived
    this.bossJustArrived = false
    return arrived
  }

  /**
   * Asks for a boss to be placed on the next `update()`.
   *
   * Called by `sim/combat.ts` once a rift's gate opens. A no-op while one is
   * already alive, so a bar that lingers at 100% for a frame or two — it can,
   * since crossing the target and the boss actually landing are a frame apart
   * — cannot double-book the fight.
   */
  queueBoss(): void {
    if (!this.bossAlive) this.bossQueued = true
  }

  /** Places one enemy of `kind` at a world position. Returns it, or null. */
  place(
    kind: EnemyKind,
    x: number,
    y: number,
    elapsed: number,
    splinter = false,
  ): Enemy | null {
    const e = this.pool.spawn()
    if (!e) return null
    e.x = x
    e.y = y
    e.prevX = x
    e.prevY = y
    e.kind = kind
    e.maxHp = kind.hp * healthScale(elapsed) * depthHealthScale(this.depth) * tierHealthScale(this.tier)
    e.hp = e.maxHp
    e.hitFlash = 0
    e.orbitImmunity = 0
    e.phase = this.rng.next() * Math.PI * 2
    // Staggered, so a wave of shooters does not volley in perfect unison.
    e.timer = this.rng.range(0, kind.fireInterval ?? 1)
    e.state = CHARGE_IDLE
    e.splinter = splinter
    const a = this.rng.next() * Math.PI * 2
    e.dirX = Math.cos(a)
    e.dirY = Math.sin(a)
    return e
  }

  /** Places one enemy on a ring around the player, outside what the camera sees. */
  private spawnOne(playerX: number, playerY: number, elapsed: number): boolean {
    const kind = KIND_BY_ID.get(pickFromRoster(this.region, this.rng.next()))
    if (!kind) return false

    // In a region with a formation, arrivals are confined to an arc that sweeps
    // slowly around. That is the whole difference between being surrounded and
    // holding a line, and it changes where the player wants to stand more than
    // any stat on this page.
    const arc = this.region.rule.formationArc
    const angle =
      arc === undefined
        ? this.rng.next() * Math.PI * 2
        : this.formationAngle + this.rng.range(-arc, arc)

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

  /**
   * Splits a dying enemy, from its own kind and from the region's rule.
   *
   * Two sources, and they stack. A Paper Effigy comes apart wherever it dies
   * because that is what an effigy is; in the Ghost Market EVERYTHING comes
   * apart, because that is what the market is. An effigy killed in the market
   * therefore does both, which is exactly the escalation the place promises.
   */
  splitOnDeath(e: Enemy, elapsed: number): void {
    const scatter = (childId: string, count: number): void => {
      const child = KIND_BY_ID.get(childId)
      if (!child) return
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + this.rng.next()
        this.place(child, e.x + Math.cos(a) * 18, e.y + Math.sin(a) * 18, elapsed, true)
      }
    }

    if (e.kind.splitsInto) scatter(e.kind.splitsInto, e.kind.splitCount ?? 2)

    const rule = this.region.rule
    // Scraps are exempt, or the market would produce an unbounded cascade from
    // a single kill and the pool ceiling would become the difficulty curve.
    if (rule.splitAll && rule.splitInto && e.kind.id !== rule.splitInto) {
      scatter(rule.splitInto, rule.splitAll)
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
    // --- the region's own weather ---------------------------------------
    // Advanced before anything spawns, so a formation's front has already
    // turned by the time this tick's arrivals are placed.
    const period = this.region.rule.formationPeriod
    if (period) this.formationAngle += ((Math.PI * 2) / period) * dt

    // --- boss schedule -------------------------------------------------
    // Placed the instant it is asked for, not on a clock — see `queueBoss`.
    if (!this.bossAlive && this.bossQueued) {
      // Each region keeps its own, and each one asks that region's question.
      const boss = KIND_BY_ID.get(this.region.bossId) ?? KIND_BY_ID.get('warlord')!
      const a = this.rng.next() * Math.PI * 2
      const placed = this.place(
        boss,
        playerX + Math.cos(a) * SPAWN_RING,
        playerY + Math.sin(a) * SPAWN_RING,
        elapsed,
      )
      if (placed) {
        this.bossAlive = true
        this.bossJustArrived = true
        this.bossQueued = false
      }
      // Left true on failure (pool full) so the very next open slot fills it —
      // a gate that silently never opens because the pool was momentarily
      // full would be worse than one that opens a tick late.
    }

    // --- spawn ---------------------------------------------------------
    // Credit accumulates fractionally so a rate of 2.5/s really produces 2.5,
    // rather than being rounded off every tick. The ramp eases during a boss
    // so the fight is legible instead of being buried under the usual flood.
    const rate =
      spawnRate(elapsed) * depthSpawnScale(this.depth) * tierSpawnScale(this.tier) *
      (this.bossAlive ? 0.45 : 1)
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
            hazards.fire(e.x, e.y, dx, dy, e.kind.shotDamage ?? 6, undefined, undefined, e.kind.name)
          }
          break
        }

        case 'lurker': {
          // Motionless and harmless until the player comes close, then a
          // committed chaser for the rest of its life. It never goes back to
          // sleep: a thing that could be re-lost would teach nothing.
          if (e.state !== ROUSED) {
            const wake = e.kind.wakeRadius ?? 110
            if (dist < wake) {
              e.state = ROUSED
              // Flashed so waking is visible. Without it, the player only
              // learns the marsh has lurkers by taking the hit.
              e.hitFlash = 0.25
            }
            speed = 0
          } else {
            speed = e.kind.speed * (e.kind.rousedSpeed ?? 1)
          }
          break
        }

        case 'enrager': {
          // Wanders slowly and does no contact damage until it is struck; see
          // `contactDamage` below. Once roused it is one of the faster things
          // on the field, which is what gives cutting indiscriminately a price.
          if (e.state === ROUSED) {
            speed = e.kind.speed * (e.kind.rousedSpeed ?? 2.5)
          } else {
            // A slow drift that ignores the player entirely.
            e.timer -= dt
            if (e.timer <= 0) {
              e.timer = this.rng.range(1.6, 3.4)
              const a = this.rng.next() * Math.PI * 2
              e.dirX = Math.cos(a)
              e.dirY = Math.sin(a)
            }
            moveX = e.dirX
            moveY = e.dirY
            speed = e.kind.speed
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
              hazards.fire(
                e.x,
                e.y,
                Math.cos(a),
                Math.sin(a),
                e.kind.shotDamage ?? 10,
                170,
                9,
                e.kind.name,
              )
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

/**
 * Contact damage this enemy can currently do.
 *
 * Zero for the two behaviours that are not yet a threat: a lurker still under
 * the water, and a pilgrim nobody has swung at. Walking through either has to
 * be safe, or neither behaviour means anything.
 */
export function contactDamage(e: Enemy): number {
  const behaviour = e.kind.behaviour
  if ((behaviour === 'lurker' || behaviour === 'enrager') && e.state !== ROUSED) return 0
  return e.kind.damage
}

/**
 * Wakes an enrager that has just been struck.
 *
 * Called from combat rather than from the swarm, because being hit is the only
 * thing that triggers it — and that is the whole design: the player, not the
 * simulation, decides when a pilgrim becomes dangerous.
 */
export function rouse(e: Enemy): void {
  if (e.kind.behaviour !== 'enrager' || e.state === ROUSED) return
  e.state = ROUSED
  // A long flash, so the moment it turns is unmistakable.
  e.hitFlash = 0.4
}
