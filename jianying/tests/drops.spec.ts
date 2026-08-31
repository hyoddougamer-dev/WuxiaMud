/**
 * Equipment on the ground.
 *
 * These pin the reversal recorded in sim/drops.ts. A drop used to go straight
 * into the bag, for a reason that was right at the time: a find the player can
 * fail to collect while being chased is a punishment dressed as a reward. That
 * reasoning held while loot was read on the way out; it stopped holding when
 * loot became the progression during the run, because a piece that teleports
 * into a bag you cannot open mid-fight is a piece that happened to somebody
 * else. What answers the original worry is the numbers below — a generous
 * radius, and a piece that never expires — not the fact that it was dismissed.
 */
import { describe, expect, it } from 'vitest'
import { TICK_S } from '../src/core/loop'
import { DROP_PICKUP_RADIUS, Drops } from '../src/sim/drops'

const always = (): boolean => true
const never = (): boolean => false

describe('pieces on the ground', () => {
  it('lies where its owner fell', () => {
    const drops = new Drops()
    drops.drop(120, -40, 'a', 3)
    expect(drops.count).toBe(1)
    expect(drops.pool.at(0).x).toBe(120)
    expect(drops.pool.at(0).y).toBe(-40)
    expect(drops.pool.at(0).rarity).toBe(3)
  })

  it('is picked up by walking over it', () => {
    const drops = new Drops()
    drops.drop(0, 0, 'a', 0)
    expect(drops.update(0, 0, TICK_S, always)).toEqual(['a'])
    expect(drops.count).toBe(0)
  })

  it('is not picked up from across the field', () => {
    const drops = new Drops()
    drops.drop(0, 0, 'a', 0)
    expect(drops.update(DROP_PICKUP_RADIUS + 20, 0, TICK_S, always)).toEqual([])
    expect(drops.count).toBe(1)
  })

  it('reaches far enough that collecting is a choice about ground, not a reflex', () => {
    // The answer to the original worry. A radius as tight as a mote's would
    // make the best moment in an expedition into a needle to thread while
    // something is chasing you.
    const drops = new Drops()
    drops.drop(0, 0, 'a', 0)
    expect(drops.update(DROP_PICKUP_RADIUS - 4, 0, TICK_S, always)).toEqual(['a'])
  })

  it('never expires, however long the expedition runs', () => {
    // A piece stays exactly where it fell for the rest of the run, so a player
    // can leave it, fight elsewhere, and come back for it.
    const drops = new Drops()
    drops.drop(300, 300, 'a', 0)
    for (let i = 0; i < Math.round(600 / TICK_S); i++) drops.update(0, 0, TICK_S, always)
    expect(drops.count).toBe(1)
    expect(drops.update(300, 300, TICK_S, always)).toEqual(['a'])
  })

  it('stays on the ground when the caller refuses it', () => {
    // A full pack must leave the piece lying there rather than eating it: the
    // player can go and drop something, then come back.
    const drops = new Drops()
    drops.drop(0, 0, 'a', 0)
    expect(drops.update(0, 0, TICK_S, never)).toEqual([])
    expect(drops.count).toBe(1)
    expect(drops.update(0, 0, TICK_S, always)).toEqual(['a'])
  })

  it('hands over several at once when the player walks through a pile', () => {
    const drops = new Drops()
    drops.drop(0, 0, 'a', 0)
    drops.drop(10, 10, 'b', 2)
    drops.drop(-10, 5, 'c', 4)
    expect(drops.update(0, 0, TICK_S, always).sort()).toEqual(['a', 'b', 'c'])
    expect(drops.count).toBe(0)
  })

  it('ages what it does not hand over, for the settle animation', () => {
    const drops = new Drops()
    drops.drop(500, 500, 'a', 0)
    drops.update(0, 0, TICK_S, always)
    expect(drops.pool.at(0).age).toBeCloseTo(TICK_S)
  })

  it('is emptied between expeditions', () => {
    const drops = new Drops()
    drops.drop(0, 0, 'a', 0)
    drops.clear()
    expect(drops.count).toBe(0)
  })

  it('survives more finds than a run can produce without corrupting itself', () => {
    // The pool is fixed-capacity; overflowing it must drop the extra quietly
    // rather than throw inside the frame loop.
    const drops = new Drops()
    for (let i = 0; i < 500; i++) drops.drop(i, 0, `x${i}`, 0)
    expect(drops.count).toBeGreaterThan(0)
    expect(() => drops.update(0, 0, TICK_S, always)).not.toThrow()
  })
})
