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
