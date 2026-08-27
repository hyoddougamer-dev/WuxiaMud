/**
 * Uniform spatial hash grid — the collision broadphase.
 *
 * With 400 enemies on screen, testing every pair is ~80,000 distance checks per
 * tick, sixty times a second. A grid turns that into "look at the handful of
 * cells near me", which is linear in the number of entities and roughly
 * constant per query.
 *
 * The implementation is allocation-free after construction: cells are flat
 * arrays of indices that get truncated rather than recreated each frame. That
 * matters as much as the algorithmic win — rebuilding a Map of arrays every
 * tick would hand the garbage collector exactly the churn the object pools were
 * built to avoid.
 *
 * Coordinates are unbounded: the world has no walls, so cells are addressed by
 * a hash of the cell coordinates rather than by an offset into a fixed
 * rectangle.
 */

/** Number of buckets. A power of two, so the modulo is a mask. */
const BUCKET_COUNT = 4096
const BUCKET_MASK = BUCKET_COUNT - 1

export class SpatialGrid {
  private readonly buckets: number[][] = []
  /** How many entries of each bucket are currently live. */
  private readonly counts: Int32Array

  /**
   * @param cellSize World units per cell. Set it near the largest query radius:
   *   too small and a query spans many cells, too large and each cell holds
   *   entities that are nowhere near each other.
   */
  constructor(readonly cellSize: number) {
    if (cellSize <= 0) throw new Error('SpatialGrid: cellSize must be positive')
    this.counts = new Int32Array(BUCKET_COUNT)
    for (let i = 0; i < BUCKET_COUNT; i++) this.buckets.push([])
  }

  /** Cell index along one axis. Floor, so negatives bucket correctly. */
  private cellOf(v: number): number {
    return Math.floor(v / this.cellSize)
  }

  /**
   * Hashes a cell coordinate pair into a bucket.
   *
   * The two large primes decorrelate the axes; without them, points on a
   * diagonal would all collide into the same bucket and the grid would degrade
   * into a linked list.
   */
  private hash(cx: number, cy: number): number {
    return ((cx * 73856093) ^ (cy * 19349663)) & BUCKET_MASK
  }

  /** Drops every entry. Buckets keep their capacity for reuse. */
  clear(): void {
    this.counts.fill(0)
  }

  /** Files `index` under the cell containing (x, y). */
  insert(index: number, x: number, y: number): void {
    const b = this.hash(this.cellOf(x), this.cellOf(y))
    const bucket = this.buckets[b]!
    const n = this.counts[b]!
    // Overwrite in place when the slot already exists; push only to grow.
    if (n < bucket.length) bucket[n] = index
    else bucket.push(index)
    this.counts[b] = n + 1
  }

  /**
   * Calls `visit` for every index filed in a cell overlapping the square that
   * bounds (x, y, radius).
   *
   * Two caveats the caller must handle, both deliberate to keep this cheap:
   *   - results are candidates, not hits: an exact distance test is still
   *     needed, since a cell is a square and the query is a circle;
   *   - an index can be visited more than once when buckets collide, so the
   *     callback must tolerate duplicates or dedupe.
   */
  query(x: number, y: number, radius: number, visit: (index: number) => void): void {
    const minX = this.cellOf(x - radius)
    const maxX = this.cellOf(x + radius)
    const minY = this.cellOf(y - radius)
    const maxY = this.cellOf(y + radius)

    for (let cy = minY; cy <= maxY; cy++) {
      for (let cx = minX; cx <= maxX; cx++) {
        const b = this.hash(cx, cy)
        const bucket = this.buckets[b]!
        const n = this.counts[b]!
        for (let i = 0; i < n; i++) visit(bucket[i]!)
      }
    }
  }

  /** Total entries currently filed. Diagnostics only — it walks every bucket. */
  get size(): number {
    let total = 0
    for (let i = 0; i < BUCKET_COUNT; i++) total += this.counts[i]!
    return total
  }
}
