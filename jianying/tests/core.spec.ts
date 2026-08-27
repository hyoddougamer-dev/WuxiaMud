import { describe, expect, it } from 'vitest'
import { Rng, dailySeed } from '../src/core/rng'
import { Pool } from '../src/core/pool'
import { TICK_HZ, TICK_S, simulateTicks } from '../src/core/loop'
import { angleDelta, clamp01, expDecay, remap, squashStretch } from '../src/core/tween'

describe('Rng', () => {
  it('reproduces the same stream for the same seed', () => {
    const a = new Rng(12345)
    const b = new Rng(12345)
    const left = Array.from({ length: 500 }, () => a.next())
    const right = Array.from({ length: 500 }, () => b.next())
    expect(left).toEqual(right)
  })

  it('produces different streams for different seeds', () => {
    const a = new Rng(1)
    const b = new Rng(2)
    expect(a.next()).not.toBe(b.next())
  })

  it('stays within [0,1) over a long stream', () => {
    const rng = new Rng(99)
    for (let i = 0; i < 100_000; i++) {
      const v = rng.next()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
      expect(Number.isNaN(v)).toBe(false)
    }
  })

  it('resumes an identical stream from a snapshot', () => {
    const rng = new Rng(777)
    for (let i = 0; i < 50; i++) rng.next()
    const snapshot = rng.snapshot
    const expected = Array.from({ length: 20 }, () => rng.next())

    const resumed = new Rng(0)
    resumed.snapshot = snapshot
    expect(Array.from({ length: 20 }, () => resumed.next())).toEqual(expected)
  })

  it('keeps int() inside the inclusive bounds', () => {
    const rng = new Rng(4242)
    const seen = new Set<number>()
    for (let i = 0; i < 20_000; i++) {
      const v = rng.int(1, 6)
      expect(Number.isInteger(v)).toBe(true)
      expect(v).toBeGreaterThanOrEqual(1)
      expect(v).toBeLessThanOrEqual(6)
      seen.add(v)
    }
    // Every face of a d6 should appear across 20k draws.
    expect(seen.size).toBe(6)
  })

  it('emits unit vectors', () => {
    const rng = new Rng(5)
    for (let i = 0; i < 1000; i++) {
      const { x, y } = rng.unitVector()
      expect(Math.hypot(x, y)).toBeCloseTo(1, 10)
    }
  })

  it('shuffles deterministically and without losing elements', () => {
    const source = Array.from({ length: 40 }, (_, i) => i)
    const a = new Rng(31).shuffle([...source])
    const b = new Rng(31).shuffle([...source])
    expect(a).toEqual(b)
    expect([...a].sort((x, y) => x - y)).toEqual(source)
  })

  it('derives a stable daily seed from a UTC date', () => {
    const seed = dailySeed(new Date('2026-08-27T23:59:00Z'))
    expect(seed).toBe(20260827)
    // Same UTC day, different clock time -> same run for everyone.
    expect(dailySeed(new Date('2026-08-27T00:01:00Z'))).toBe(seed)
  })
})

describe('Pool', () => {
  interface Dummy {
    id: number
    hp: number
  }
  const makePool = (capacity: number) =>
    new Pool<Dummy>(
      capacity,
      (id) => ({ id, hp: 0 }),
      (item) => {
        item.hp = 10
      },
    )

  it('spawns up to capacity and then refuses', () => {
    const pool = makePool(3)
    expect(pool.spawn()).not.toBeNull()
    expect(pool.spawn()).not.toBeNull()
    expect(pool.spawn()).not.toBeNull()
    expect(pool.spawn()).toBeNull()
    expect(pool.size).toBe(3)
    expect(pool.full).toBe(true)
  })

  it('applies the reset function on spawn', () => {
    const pool = makePool(2)
    const item = pool.spawn()!
    expect(item.hp).toBe(10)
    item.hp = 0
    pool.clear()
    expect(pool.spawn()!.hp).toBe(10)
  })

  it('keeps active items dense after a release', () => {
    const pool = makePool(4)
    for (let i = 0; i < 4; i++) pool.spawn()
    pool.release(1)
    expect(pool.size).toBe(3)
    const ids = new Set<number>()
    for (let i = 0; i < pool.size; i++) ids.add(pool.at(i).id)
    expect(ids.size).toBe(3)
  })

  it('removes exactly the items the callback marks, and visits every survivor', () => {
    const pool = makePool(10)
    for (let i = 0; i < 10; i++) pool.spawn()!.hp = 0
    for (let i = 0; i < pool.size; i++) pool.at(i).hp = pool.at(i).id

    // Remove the even ids; every odd id must survive and be visited exactly once.
    pool.forEachActive((item) => item.hp % 2 === 0)

    const survivors: number[] = []
    for (let i = 0; i < pool.size; i++) survivors.push(pool.at(i).hp)
    expect(survivors.sort((a, b) => a - b)).toEqual([1, 3, 5, 7, 9])
  })

  it('ignores an out-of-range release', () => {
    const pool = makePool(2)
    pool.spawn()
    pool.release(5)
    pool.release(-1)
    expect(pool.size).toBe(1)
  })
})

describe('loop timing', () => {
  it('uses a 60Hz step', () => {
    expect(TICK_HZ).toBe(60)
    expect(TICK_S).toBeCloseTo(1 / 60, 12)
  })

  it('advances the simulation by exactly the requested tick count', () => {
    let elapsed = 0
    let calls = 0
    simulateTicks((dt) => {
      elapsed += dt
      calls++
    }, 600)
    expect(calls).toBe(600)
    expect(elapsed).toBeCloseTo(10, 9) // 600 ticks == 10 seconds
  })
})

describe('tween helpers', () => {
  it('clamps to [0,1]', () => {
    expect(clamp01(-3)).toBe(0)
    expect(clamp01(0.4)).toBe(0.4)
    expect(clamp01(9)).toBe(1)
  })

  it('remaps and clamps ranges', () => {
    expect(remap(5, 0, 10, 0, 100)).toBe(50)
    expect(remap(-1, 0, 10, 0, 100)).toBe(0)
    expect(remap(11, 0, 10, 0, 100)).toBe(100)
  })

  it('closes half the gap in one half-life, independent of step size', () => {
    // One 1.0s half-life applied as a single step...
    const once = expDecay(0, 100, 1, 1)
    // ...must match the same second applied as 60 small steps.
    let stepped = 0
    for (let i = 0; i < 60; i++) stepped = expDecay(stepped, 100, 1, 1 / 60)
    expect(once).toBeCloseTo(50, 6)
    expect(stepped).toBeCloseTo(once, 6)
  })

  it('returns the shortest angular path across the wrap point', () => {
    expect(angleDelta(0.1, -0.1)).toBeCloseTo(-0.2, 10)
    // 350deg -> 10deg is +20deg, not -340deg.
    expect(angleDelta((350 * Math.PI) / 180, (10 * Math.PI) / 180)).toBeCloseTo(
      (20 * Math.PI) / 180,
      10,
    )
  })

  it('preserves area when squashing', () => {
    for (const amount of [0, 0.25, 0.5, 1]) {
      const { sx, sy } = squashStretch(amount)
      expect(sx * sy).toBeCloseTo(1, 10)
    }
  })
})
