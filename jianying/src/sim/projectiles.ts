/**
 * Sword-qi bolts: crescents of energy loosed at whatever is nearest.
 *
 * Kept apart from the sweep because they are the first thing in the game that
 * exists independently of the player's position — they keep travelling and
 * keep killing after you have walked away, which is exactly the feeling an
 * "art" is supposed to give.
 */
import { Pool } from '../core/pool'

export interface Bolt {
  x: number
  y: number
  prevX: number
  prevY: number
  vx: number
  vy: number
  damage: number
  /** Seconds left before it dissipates. */
  life: number
  /** How many more enemies it can cut through. */
  pierce: number
}

const MAX_BOLTS = 220

export const BOLT_SPEED = 420
export const BOLT_LIFE = 1.5
export const BOLT_RADIUS = 11

export class Bolts {
  readonly pool: Pool<Bolt>

  constructor() {
    this.pool = new Pool<Bolt>(
      MAX_BOLTS,
      () => ({ x: 0, y: 0, prevX: 0, prevY: 0, vx: 0, vy: 0, damage: 0, life: 0, pierce: 0 }),
      (b) => {
        b.life = BOLT_LIFE
        b.pierce = 1
      },
    )
  }

  get count(): number {
    return this.pool.size
  }

  clear(): void {
    this.pool.clear()
  }

  fire(x: number, y: number, dirX: number, dirY: number, damage: number, pierce: number): void {
    const bolt = this.pool.spawn()
    if (!bolt) return
    bolt.x = x
    bolt.y = y
    bolt.prevX = x
    bolt.prevY = y
    bolt.vx = dirX * BOLT_SPEED
    bolt.vy = dirY * BOLT_SPEED
    bolt.damage = damage
    bolt.life = BOLT_LIFE
    bolt.pierce = pierce
  }

  /** Moves every bolt and retires the expired ones. */
  update(dt: number): void {
    this.pool.forEachActive((b) => {
      b.prevX = b.x
      b.prevY = b.y
      b.x += b.vx * dt
      b.y += b.vy * dt
      b.life -= dt
      return b.life <= 0 || b.pierce <= 0
    })
  }
}
