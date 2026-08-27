/**
 * Fixed-capacity object pool.
 *
 * A survivors-like allocates and discards hundreds of enemies, projectiles and
 * particles per second. On a phone, that allocation churn is what produces the
 * periodic stutter players read as "the game is badly optimised" — it is the
 * garbage collector, not the frame cost. So the hot loop allocates nothing:
 * every entity is created once up front and recycled.
 *
 * Active entries are kept densely packed in [0, size) so iteration is a plain
 * indexed for-loop with no holes and no allocation.
 */
export class Pool<T> {
  private readonly items: T[]
  private count = 0

  constructor(
    readonly capacity: number,
    factory: (index: number) => T,
    private readonly reset: (item: T) => void,
  ) {
    this.items = new Array<T>(capacity)
    for (let i = 0; i < capacity; i++) this.items[i] = factory(i)
  }

  /** Number of currently active items. */
  get size(): number {
    return this.count
  }

  get full(): boolean {
    return this.count >= this.capacity
  }

  /**
   * Activates and returns the next free item, or null when the pool is full.
   *
   * Returning null rather than growing is deliberate: a fixed ceiling keeps the
   * frame cost bounded and turns "too many entities" into a design decision
   * (spawn budget) instead of an unbounded frame-time cliff.
   */
  spawn(): T | null {
    if (this.count >= this.capacity) return null
    const item = this.items[this.count]!
    this.reset(item)
    this.count++
    return item
  }

  /**
   * Releases the active item at `index` by swapping the last active item into
   * its place, keeping the array dense in O(1).
   *
   * Callers iterating forward must NOT advance their loop counter after calling
   * this, since a new, unvisited item now occupies `index`.
   */
  release(index: number): void {
    if (index < 0 || index >= this.count) return
    const last = this.count - 1
    if (index !== last) {
      const tmp = this.items[index]!
      this.items[index] = this.items[last]!
      this.items[last] = tmp
    }
    this.count--
  }

  at(index: number): T {
    return this.items[index]!
  }

  /** Deactivates everything. Objects are retained for reuse. */
  clear(): void {
    this.count = 0
  }

  /**
   * Iterates active items, allowing the callback to request removal by
   * returning true. Handles the index bookkeeping that `release` imposes.
   */
  forEachActive(fn: (item: T, index: number) => boolean | void): void {
    for (let i = 0; i < this.count; ) {
      if (fn(this.items[i]!, i) === true) this.release(i)
      else i++
    }
  }
}
