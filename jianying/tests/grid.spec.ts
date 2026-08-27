import { describe, expect, it } from 'vitest'
import { SpatialGrid } from '../src/core/grid'
import { Rng } from '../src/core/rng'

/** Collects the unique indices a query returns. */
function queryUnique(grid: SpatialGrid, x: number, y: number, r: number): Set<number> {
  const seen = new Set<number>()
  grid.query(x, y, r, (i) => seen.add(i))
  return seen
}

describe('SpatialGrid', () => {
  it('rejects a non-positive cell size', () => {
    expect(() => new SpatialGrid(0)).toThrow()
    expect(() => new SpatialGrid(-5)).toThrow()
  })

  it('finds a point filed at the query centre', () => {
    const grid = new SpatialGrid(32)
    grid.insert(7, 100, 100)
    expect(queryUnique(grid, 100, 100, 10).has(7)).toBe(true)
  })

  it('handles negative coordinates', () => {
    const grid = new SpatialGrid(32)
    grid.insert(1, -100, -250)
    expect(queryUnique(grid, -100, -250, 5).has(1)).toBe(true)
  })

  it('clears without losing capacity', () => {
    const grid = new SpatialGrid(32)
    for (let i = 0; i < 100; i++) grid.insert(i, i * 5, 0)
    expect(grid.size).toBe(100)
    grid.clear()
    expect(grid.size).toBe(0)
    grid.insert(1, 0, 0)
    expect(queryUnique(grid, 0, 0, 4).has(1)).toBe(true)
  })

  it('never misses a point inside the radius', () => {
    // The property that matters: the grid may return extra candidates, but it
    // must never omit a real one, or enemies would pass through swords.
    const rng = new Rng(1234)
    const grid = new SpatialGrid(40)
    const points: Array<{ x: number; y: number }> = []
    for (let i = 0; i < 2000; i++) {
      const p = { x: rng.range(-1200, 1200), y: rng.range(-1200, 1200) }
      points.push(p)
      grid.insert(i, p.x, p.y)
    }

    for (let q = 0; q < 200; q++) {
      const qx = rng.range(-1200, 1200)
      const qy = rng.range(-1200, 1200)
      const radius = rng.range(5, 120)

      const expected = new Set<number>()
      points.forEach((p, i) => {
        if (Math.hypot(p.x - qx, p.y - qy) <= radius) expected.add(i)
      })

      const got = queryUnique(grid, qx, qy, radius)
      for (const i of expected) {
        expect(got.has(i)).toBe(true)
      }
    }
  })

  it('returns far fewer candidates than a brute-force scan', () => {
    const rng = new Rng(99)
    const grid = new SpatialGrid(40)
    const total = 3000
    for (let i = 0; i < total; i++) {
      grid.insert(i, rng.range(-2000, 2000), rng.range(-2000, 2000))
    }
    const got = queryUnique(grid, 0, 0, 50)
    // The whole point of the grid: a small query must not touch everything.
    expect(got.size).toBeLessThan(total / 10)
  })

  it('separates points that share a diagonal', () => {
    // A hash that does not decorrelate the axes buckets every (n, n) together
    // and degrades into a linear scan.
    const grid = new SpatialGrid(10)
    for (let i = 0; i < 400; i++) grid.insert(i, i * 10, i * 10)
    const got = queryUnique(grid, 0, 0, 5)
    expect(got.size).toBeLessThan(20)
    expect(got.has(0)).toBe(true)
  })

  it('reports duplicates at most, never corruption', () => {
    const grid = new SpatialGrid(16)
    grid.insert(42, 0, 0)
    const visited: number[] = []
    grid.query(0, 0, 8, (i) => visited.push(i))
    expect(visited.every((i) => i === 42)).toBe(true)
    expect(visited.length).toBeGreaterThan(0)
  })
})
