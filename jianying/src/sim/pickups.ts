/**
 * Qi motes — the experience the fallen leave behind.
 *
 * These carry more weight than "XP dropped": they are the first thing on screen
 * that is neither ink nor paper, and they give movement a second purpose. Until
 * now the only reason to move was to avoid being touched, which is a purely
 * negative pull. Motes pull the player *toward* danger, and that tension —
 * wanting the ground you just cleared — is most of what makes the genre work.
 */
import { Pool } from '../core/pool'
import type { Rng } from '../core/rng'

export interface Mote {
  x: number
  y: number
  prevX: number
  prevY: number
  vx: number
  vy: number
  value: number
  /** Seconds this mote has existed, for the idle shimmer. */
  age: number
  /** True once it has been caught by the player's pull. */
  homing: boolean
}

/**
 * Plenty for the densest fights — but NOT plenty for a field nobody walks back
 * across, which is why `drop` recycles rather than trusting this number.
 *
 * Measured before that change: a player circling at speed leaves every mote
 * where it fell, the pool saturates at 180 seconds, and from that instant
 * `spawn()` returns null and EVERY subsequent kill pays nothing. Insight froze
 * at grade 10 while the kill count ran on to fourteen hundred. The engaged
 * pilot hit the same wall about ninety seconds later. It was a silent leak in
 * the reward loop, not a balance problem, and it is the reason a run longer
 * than three minutes stopped advancing a build at all.
 */
const MAX_MOTES = 600

/** How close the player must be before a mote starts flying to them. */
export const BASE_PICKUP_RADIUS = 62

/** Distance at which a homing mote is absorbed. */
const ABSORB_RADIUS = 14

/** Acceleration of a homing mote, in world units per second squared. */
const HOMING_ACCEL = 1350

/** Motes decelerate from their scatter burst at this rate. */
const SCATTER_DRAG = 5.5

export class Motes {
  readonly pool: Pool<Mote>

  constructor() {
    this.pool = new Pool<Mote>(
      MAX_MOTES,
      () => ({ x: 0, y: 0, prevX: 0, prevY: 0, vx: 0, vy: 0, value: 1, age: 0, homing: false }),
      (m) => {
        m.vx = 0
        m.vy = 0
        m.value = 1
        m.age = 0
        m.homing = false
      },
    )
  }

  get count(): number {
    return this.pool.size
  }

  clear(): void {
    this.pool.clear()
  }

  /**
   * Drops a mote where an enemy fell, with a small outward scatter so that a
   * cluster of deaths reads as several rewards rather than one bright dot.
   */
  drop(x: number, y: number, value: number, rng: Rng, playerX: number, playerY: number): void {
    const mote = this.pool.spawn() ?? this.recycle(playerX, playerY)
    if (!mote) return
    const angle = rng.next() * Math.PI * 2
    const speed = rng.range(26, 70)
    mote.x = x
    mote.y = y
    mote.prevX = x
    mote.prevY = y
    mote.vx = Math.cos(angle) * speed
    mote.vy = Math.sin(angle) * speed
    mote.value = value
    mote.age = 0
    mote.homing = false
  }

  /**
   * Reuses the mote furthest from the player when the field is full.
   *
   * The alternative — the fixed ceiling this pool was built for — is right for
   * enemies and projectiles, where a full pool means "stop adding" and nothing
   * is owed to the player. Qi is different: dropping nothing is not a spawn
   * budget, it is a kill that paid the player nothing, and it is invisible.
   *
   * Furthest-first, because the qi you walked away from longest ago is the one
   * you were least likely to come back for, and the kill in front of you should
   * always pay. Motes already homing are never taken: those are on their way in
   * and reclaiming one would rob a player who had earned it.
   */
  private recycle(playerX: number, playerY: number): Mote | null {
    let worst: Mote | null = null
    let worstSq = -1
    for (let i = 0; i < this.pool.size; i++) {
      const m = this.pool.at(i)
      if (m.homing) continue
      const dx = m.x - playerX
      const dy = m.y - playerY
      const distSq = dx * dx + dy * dy
      if (distSq > worstSq) {
        worstSq = distSq
        worst = m
      }
    }
    return worst
  }

  /**
   * Advances every mote and returns the qi absorbed this tick.
   *
   * @param pickupRadius how far the player's pull reaches — a technique can
   *   widen it, which is one of the most satisfying upgrades in the genre
   *   because it changes how the whole field feels rather than a single number.
   */
  update(playerX: number, playerY: number, pickupRadius: number, dt: number): number {
    let collected = 0
    const pullSq = pickupRadius * pickupRadius

    this.pool.forEachActive((m) => {
      m.prevX = m.x
      m.prevY = m.y
      m.age += dt

      const dx = playerX - m.x
      const dy = playerY - m.y
      const distSq = dx * dx + dy * dy

      // Once homing, a mote never loses interest — otherwise walking past the
      // edge of the pull would leave motes twitching in and out of pursuit.
      if (!m.homing && distSq <= pullSq) m.homing = true

      if (m.homing) {
        const dist = Math.sqrt(distSq) || 1
        if (dist <= ABSORB_RADIUS) {
          collected += m.value
          return true
        }
        m.vx += (dx / dist) * HOMING_ACCEL * dt
        m.vy += (dy / dist) * HOMING_ACCEL * dt
      } else {
        // Scatter burst bleeds off, so motes settle where the body fell.
        const drag = Math.exp(-SCATTER_DRAG * dt)
        m.vx *= drag
        m.vy *= drag
      }

      m.x += m.vx * dt
      m.y += m.vy * dt
      return false
    })

    return collected
  }
}
