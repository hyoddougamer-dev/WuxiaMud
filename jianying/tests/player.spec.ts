import { describe, expect, it } from 'vitest'
import { TICK_S, simulateTicks } from '../src/core/loop'
import {
  ACCEL_HALF_LIFE,
  MAX_SPEED,
  createPlayer,
  playerSpeed,
  playerSpeedRatio,
  updatePlayer,
} from '../src/sim/player'

/** Runs `ticks` fixed steps with a constant input. */
function drive(player: ReturnType<typeof createPlayer>, ix: number, iy: number, ticks: number) {
  for (let i = 0; i < ticks; i++) updatePlayer(player, ix, iy, TICK_S)
}

describe('player movement', () => {
  it('starts at rest', () => {
    const p = createPlayer()
    expect(playerSpeed(p)).toBe(0)
  })

  it('reaches roughly half speed in one half-life', () => {
    const p = createPlayer()
    drive(p, 1, 0, Math.round(ACCEL_HALF_LIFE / TICK_S))
    expect(p.vx).toBeGreaterThan(MAX_SPEED * 0.4)
    expect(p.vx).toBeLessThan(MAX_SPEED * 0.6)
  })

  it('approaches but never exceeds top speed', () => {
    const p = createPlayer()
    drive(p, 1, 0, 600) // ten seconds
    expect(p.vx).toBeGreaterThan(MAX_SPEED * 0.99)
    expect(p.vx).toBeLessThanOrEqual(MAX_SPEED)
  })

  it('caps diagonal speed at the same maximum as cardinal', () => {
    // A joystick clamped to the unit disc must not let diagonals travel
    // ~1.41x faster, which is the classic movement bug in this genre.
    const diagonal = createPlayer()
    const d = Math.SQRT1_2
    drive(diagonal, d, d, 600)

    const cardinal = createPlayer()
    drive(cardinal, 1, 0, 600)

    expect(playerSpeed(diagonal)).toBeCloseTo(playerSpeed(cardinal), 4)
  })

  it('comes to a complete stop after release, not an endless drift', () => {
    const p = createPlayer()
    drive(p, 1, 0, 120)
    drive(p, 0, 0, 120)
    expect(playerSpeed(p)).toBe(0)
  })

  it('keeps facing after the thumb is released', () => {
    const p = createPlayer()
    drive(p, -1, 0, 60)
    expect(p.faceX).toBeCloseTo(-1, 6)
    drive(p, 0, 0, 120)
    expect(p.faceX).toBeCloseTo(-1, 6)
  })

  it('turns facing immediately, without waiting for momentum', () => {
    const p = createPlayer()
    drive(p, 1, 0, 120)
    // One single tick in the opposite direction.
    updatePlayer(p, -1, 0, TICK_S)
    expect(p.faceX).toBeCloseTo(-1, 6)
    // Velocity still carries the old direction — that is the intended weight.
    expect(p.vx).toBeGreaterThan(0)
  })

  it('normalises facing to a unit vector', () => {
    const p = createPlayer()
    drive(p, 0.3, 0.4, 10)
    expect(Math.hypot(p.faceX, p.faceY)).toBeCloseTo(1, 10)
  })

  it('travels the same distance regardless of tick subdivision', () => {
    // Frame-rate independence: the same elapsed time at 60Hz and at 240Hz must
    // land the player in the same place, or replays would not reproduce
    // across devices and a 120Hz phone would play a different game.
    const at60 = createPlayer()
    for (let i = 0; i < 120; i++) updatePlayer(at60, 1, 0, 1 / 60)

    const at240 = createPlayer()
    for (let i = 0; i < 480; i++) updatePlayer(at240, 1, 0, 1 / 240)

    expect(at240.x).toBeCloseTo(at60.x, 1)
    expect(at240.vx).toBeCloseTo(at60.vx, 6)
  })

  it('reports a speed ratio inside 0..1', () => {
    const p = createPlayer()
    expect(playerSpeedRatio(p)).toBe(0)
    drive(p, 1, 0, 600)
    expect(playerSpeedRatio(p)).toBeGreaterThan(0.99)
    expect(playerSpeedRatio(p)).toBeLessThanOrEqual(1)
  })

  it('never produces NaN over a long erratic session', () => {
    const p = createPlayer()
    const inputs: Array<[number, number]> = [
      [1, 0],
      [0, 0],
      [-0.5, 0.5],
      [0, -1],
      [0.7, 0.7],
      [0, 0],
    ]
    for (let round = 0; round < 200; round++) {
      const [ix, iy] = inputs[round % inputs.length]!
      simulateTicks((dt) => updatePlayer(p, ix, iy, dt), 30)
    }
    expect(Number.isFinite(p.x)).toBe(true)
    expect(Number.isFinite(p.y)).toBe(true)
    expect(Number.isFinite(p.vx)).toBe(true)
    expect(Number.isFinite(p.vy)).toBe(true)
  })

  it('records the previous position for render interpolation', () => {
    const p = createPlayer()
    drive(p, 1, 0, 30)
    const before = p.x
    updatePlayer(p, 1, 0, TICK_S)
    expect(p.prevX).toBe(before)
    expect(p.x).toBeGreaterThan(p.prevX)
  })
})
