/**
 * Equipment lying on the ground, waiting to be walked over.
 *
 * WHY A DROP IS NO LONGER INSTANT. It used to go straight into the bag the
 * moment an enemy fell, and there was a good reason recorded for it: a drop the
 * player can fail to collect while being chased is a punishment dressed as a
 * reward, and this genre never gives them a safe moment to go back.
 *
 * That reasoning held while loot was something you READ ON THE WAY OUT. It does
 * not hold now that loot is the progression during the run itself. If the
 * purple sword at the halfway mark is what makes minute eight play differently
 * from minute one, then seeing it land — in its own colour, on ground you have
 * to choose to cross — is the whole beat. A find that teleports into a bag you
 * cannot open mid-fight is a find that happened to somebody else.
 *
 * The original worry is answered by the numbers rather than by dismissing it:
 * the pull radius is generous, a drop never expires, and it stays exactly where
 * it fell for the rest of the expedition. Missing one is a choice about ground,
 * not a reflex test.
 *
 * The pool carries a RARITY and an opaque handle, and nothing else about the
 * item. The renderer needs the rung to know what colour to shout in; the
 * simulation needs neither the base, the lines, nor the name. `id` is minted by
 * the caller, which holds the rolled instance — see main.ts.
 */
import { Pool } from '../core/pool'

export interface GroundDrop {
  x: number
  y: number
  prevX: number
  prevY: number
  /** Opaque handle the caller uses to find the instance this represents. */
  id: string
  /** 0..5, for the label's colour. See data/rarity.ts. */
  rarity: number
  /** Seconds it has lain there, for the settle animation and the shimmer. */
  age: number
}

/**
 * Far more than a run will ever produce at once, and cheap.
 *
 * At the raised drop rate a long expedition leaves six or seven pieces, and a
 * player who ignores every one of them still cannot overflow this.
 */
const MAX_DROPS = 64

/**
 * How close the player must come to pick a piece up.
 *
 * Larger than a mote's absorb radius on purpose. A mote is one of hundreds and
 * missing one costs nothing; a piece is the run's progression, and making the
 * player thread a needle for it would turn the best moment in the expedition
 * into a chore.
 */
export const DROP_PICKUP_RADIUS = 46

export class Drops {
  readonly pool: Pool<GroundDrop>

  constructor() {
    this.pool = new Pool<GroundDrop>(
      MAX_DROPS,
      () => ({ x: 0, y: 0, prevX: 0, prevY: 0, id: '', rarity: 0, age: 0 }),
      (d) => {
        d.id = ''
        d.rarity = 0
        d.age = 0
      },
    )
  }

  get count(): number {
    return this.pool.size
  }

  clear(): void {
    this.pool.clear()
  }

  /** Lays a piece on the ground where its owner fell. */
  drop(x: number, y: number, id: string, rarity: number): void {
    const d = this.pool.spawn()
    if (!d) return
    d.x = x
    d.y = y
    d.prevX = x
    d.prevY = y
    d.id = id
    d.rarity = rarity
    d.age = 0
  }

  /**
   * Ages every piece and hands back the ids the player has just walked over.
   *
   * Returns the ids rather than firing a callback so the caller stays in charge
   * of what a pickup MEANS — the bag may be full, and only the caller knows.
   * A piece whose pickup is refused simply stays on the ground, which is the
   * honest behaviour: the player can drop something and come back for it.
   */
  update(px: number, py: number, dt: number, accept: (id: string) => boolean): string[] {
    const taken: string[] = []
    for (let i = this.pool.size - 1; i >= 0; i--) {
      const d = this.pool.at(i)
      d.prevX = d.x
      d.prevY = d.y
      d.age += dt
      const dx = px - d.x
      const dy = py - d.y
      if (dx * dx + dy * dy > DROP_PICKUP_RADIUS * DROP_PICKUP_RADIUS) continue
      if (!accept(d.id)) continue
      taken.push(d.id)
      this.pool.release(i)
    }
    return taken
  }
}
