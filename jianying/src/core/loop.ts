/**
 * Fixed-timestep game loop with a decoupled, interpolated render.
 *
 * The simulation always advances in whole 1/60s steps regardless of the display
 * refresh rate. Without this, a 90Hz or 120Hz phone would run the game at a
 * different speed than a 60Hz one, and — worse — replays recorded on one device
 * would not reproduce on another, which would break determinism.
 *
 * `alpha` lets the renderer draw between two simulation states so motion still
 * looks smooth on a 120Hz panel even though logic ticks at 60Hz.
 */

export const TICK_HZ = 60
export const TICK_MS = 1000 / TICK_HZ
export const TICK_S = 1 / TICK_HZ

/** Never simulate more than this many ticks in one frame. */
const MAX_STEPS_PER_FRAME = 5

export interface LoopCallbacks {
  /** Advance the simulation exactly one fixed step. */
  update(dtSeconds: number): void
  /** Draw. `alpha` in [0,1) is the progress between the last and next tick. */
  render(alpha: number): void
}

export interface LoopStats {
  fps: number
  /** Simulation ticks executed in the last rendered frame. */
  stepsLastFrame: number
  /** Total ticks since the loop started — the simulation's clock. */
  totalTicks: number
}

export class GameLoop {
  private accumulator = 0
  private lastTime = 0
  private rafId = 0
  private running = false

  private fpsFrames = 0
  private fpsElapsed = 0

  readonly stats: LoopStats = { fps: 0, stepsLastFrame: 0, totalTicks: 0 }

  constructor(private readonly callbacks: LoopCallbacks) {}

  start(): void {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    this.accumulator = 0
    this.rafId = requestAnimationFrame(this.frame)
  }

  stop(): void {
    this.running = false
    cancelAnimationFrame(this.rafId)
  }

  /**
   * Drop accumulated time without simulating it. Call this when resuming from
   * background: Android suspends rAF, so the first frame back can report a gap
   * of minutes. Simulating that gap would teleport every enemy onto the player.
   */
  resetClock(): void {
    this.lastTime = performance.now()
    this.accumulator = 0
  }

  private frame = (now: number): void => {
    if (!this.running) return
    this.rafId = requestAnimationFrame(this.frame)

    let elapsed = now - this.lastTime
    this.lastTime = now

    // Guard against absurd deltas (tab restore, debugger pause, GC hitch).
    if (elapsed > 250) elapsed = 250

    this.accumulator += elapsed

    let steps = 0
    while (this.accumulator >= TICK_MS && steps < MAX_STEPS_PER_FRAME) {
      this.callbacks.update(TICK_S)
      this.accumulator -= TICK_MS
      steps++
      this.stats.totalTicks++
    }

    // If we hit the step ceiling the device cannot keep up; shed the backlog
    // instead of spiralling further behind every frame.
    if (steps === MAX_STEPS_PER_FRAME && this.accumulator > TICK_MS) {
      this.accumulator = 0
    }

    this.stats.stepsLastFrame = steps
    this.callbacks.render(this.accumulator / TICK_MS)

    this.fpsFrames++
    this.fpsElapsed += elapsed
    if (this.fpsElapsed >= 500) {
      this.stats.fps = Math.round((this.fpsFrames * 1000) / this.fpsElapsed)
      this.fpsFrames = 0
      this.fpsElapsed = 0
    }
  }
}

/**
 * Headless equivalent used by tests: runs N ticks as fast as possible with no
 * rAF and no rendering. This is how balance is asserted in CI without a screen.
 */
export function simulateTicks(update: (dt: number) => void, ticks: number): void {
  for (let i = 0; i < ticks; i++) update(TICK_S)
}
