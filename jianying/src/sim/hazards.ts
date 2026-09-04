/**
 * Enemy projectiles.
 *
 * Kept separate from the player's bolts because they answer a different design
 * question. Every threat so far had to walk into the sweep to hurt the player,
 * which meant the correct play was always the same: keep the crowd in front.
 * A bolt fired from two hundred units away cannot be answered by facing — only
 * by moving — and that is the first thing in the game that punishes standing in
 * one good spot.
 */
import { Pool } from '../core/pool'

export interface Hazard {
  x: number
  y: number
  prevX: number
  prevY: number
  vx: number
  vy: number
  damage: number
  radius: number
  life: number
  /** Display name of whatever loosed it, so a death can be explained. */
  source: string
}

const MAX_HAZARDS = 260
const HAZARD_SPEED = 210
const HAZARD_LIFE = 3.4

export class Hazards {
  readonly pool: Pool<Hazard>

  /**
   * Name of whatever fired the projectile consumed by the last `strike`.
   *
   * Returned out of band rather than in the return value because `strike`
   * already reports damage as a number and the hot path should not allocate a
   * result object sixty times a second just to carry a string that is only read
   * when the number is non-zero.
   */
  lastStrikeSource = ''

  constructor() {
    this.pool = new Pool<Hazard>(
      MAX_HAZARDS,
      () => ({
        x: 0,
        y: 0,
        prevX: 0,
        prevY: 0,
        vx: 0,
        vy: 0,
        damage: 0,
        radius: 7,
        life: 0,
        source: '',
      }),
      (h) => {
        h.life = HAZARD_LIFE
        h.radius = 7
        h.source = ''
      },
    )
  }

  get count(): number {
    return this.pool.size
  }

  clear(): void {
    this.pool.clear()
  }

  fire(
    x: number,
    y: number,
    dirX: number,
    dirY: number,
    damage: number,
    speed = HAZARD_SPEED,
    radius = 7,
    source = '',
  ): void {
    const h = this.pool.spawn()
    if (!h) return
    h.x = x
    h.y = y
    h.prevX = x
    h.prevY = y
    h.vx = dirX * speed
    h.vy = dirY * speed
    h.damage = damage
    h.radius = radius
    h.life = HAZARD_LIFE
    h.source = source
  }

  update(dt: number): void {
    this.pool.forEachActive((h) => {
      h.prevX = h.x
      h.prevY = h.y
      h.x += h.vx * dt
      h.y += h.vy * dt
      h.life -= dt
      return h.life <= 0
    })
  }

  /**
   * Cuts every hazard inside the arc out of the air, and says how many.
   *
   * WHY THIS EXISTS, and it is the largest single finding of the balance work.
   * Measured on the Broken Cliff, the number of enemies TOUCHING the player at
   * any moment was 0.0 to 0.5, and the three things that killed a bare
   * swordsman were a Windbell Adept, a Crossbow Hand and a Cliff Hawk — two
   * shooters and a darter. Nobody dies to the crowd in this game. You are shot
   * to death from beyond your own reach.
   *
   * That is why twenty points of offence bought almost nothing on a deep road
   * while twenty into Body nearly tripled the run: every offensive stat feeds a
   * sweep, and the sweep could not touch the only thing that was killing you.
   * The doc at the top of this file said as much without noticing — "cannot be
   * answered by facing, only by moving" — which, once shooters became the whole
   * threat, made facing decorative.
   *
   * So the blade answers arrows. It is the oldest image the genre has, and
   * mechanically it is the missing conversion: REACH becomes a bigger umbrella,
   * RATE becomes fewer gaps between umbrellas, ARC becomes a wider one. Damage
   * deliberately buys nothing here — a sweep either meets the shaft or it does
   * not — which keeps Power honest as the stat that kills rather than the stat
   * that saves.
   */
  parry(
    px: number,
    py: number,
    aimX: number,
    aimY: number,
    range: number,
    halfAngle: number,
  ): number {
    let cut = 0
    this.pool.forEachActive((h) => {
      const dx = h.x - px
      const dy = h.y - py
      const distance = Math.hypot(dx, dy)
      if (distance > range + h.radius) return false
      // Straight overhead is inside every arc: a shaft already on top of the
      // swordsman is not one they are turning away from.
      if (distance > 0.001) {
        const dot = (dx / distance) * aimX + (dy / distance) * aimY
        if (Math.acos(Math.max(-1, Math.min(1, dot))) > halfAngle) return false
      }
      cut++
      return true
    })
    return cut
  }

  /**
   * Returns the damage of the first hazard overlapping the player and consumes
   * it, or 0. Consuming matters: a projectile that passes through would keep
   * hitting on every tick the player stayed inside it.
   */
  strike(px: number, py: number, playerRadius: number): number {
    let damage = 0
    this.lastStrikeSource = ''
    this.pool.forEachActive((h) => {
      if (damage > 0) return false
      const dx = h.x - px
      const dy = h.y - py
      const reach = h.radius + playerRadius
      if (dx * dx + dy * dy > reach * reach) return false
      damage = h.damage
      this.lastStrikeSource = h.source
      return true
    })
    return damage
  }
}
