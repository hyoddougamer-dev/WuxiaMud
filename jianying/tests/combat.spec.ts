import { describe, expect, it } from 'vitest'
import { TICK_S } from '../src/core/loop'
import { Rng } from '../src/core/rng'
import { MAX_ENEMIES, pickEnemyKind, spawnRate, healthScale } from '../src/data/enemies'
import { Swarm } from '../src/sim/enemies'
import { createPlayer, updatePlayer, type Player } from '../src/sim/player'
import {
  HURT_IMMUNITY,
  PLAYER_MAX_HP,
  createRun,
  updateCombat,
  type RunState,
} from '../src/sim/combat'

interface Sim {
  player: Player
  swarm: Swarm
  run: RunState
}

function newSim(seed = 4242): Sim {
  return { player: createPlayer(0, 0), swarm: new Swarm(new Rng(seed)), run: createRun() }
}

/**
 * Runs the full simulation headlessly. This is the payoff of the deterministic
 * design: balance can be asserted as numbers in CI instead of judged by feel.
 */
function play(sim: Sim, seconds: number, input: (t: number) => [number, number]): void {
  const ticks = Math.round(seconds / TICK_S)
  for (let i = 0; i < ticks; i++) {
    if (sim.run.over) break
    const [ix, iy] = input(sim.run.elapsed)
    updatePlayer(sim.player, ix, iy, TICK_S)
    sim.swarm.update(sim.player.x, sim.player.y, sim.run.elapsed, TICK_S)
    updateCombat(sim.run, sim.player, sim.swarm, TICK_S)
  }
}

const STAND_STILL = (): [number, number] => [0, 0]
/**
 * A slow, wide retreat — the strategy headless runs show to be the strongest,
 * and roughly what a player who has understood the game does.
 */
const KITE = (t: number): [number, number] => [Math.cos(t * 0.25) * 0.3, Math.sin(t * 0.25) * 0.3]
/** Close-quarters weaving. Engages constantly, so it is the test for killing. */
const SKIRMISH = (t: number): [number, number] => [
  Math.cos(t * 1.6) * 0.45,
  Math.sin(t * 1.6) * 0.45,
]

describe('difficulty ramp', () => {
  it('starts gently and grows', () => {
    expect(spawnRate(0)).toBeLessThan(3)
    expect(spawnRate(60)).toBeGreaterThan(spawnRate(0))
    expect(spawnRate(300)).toBeGreaterThan(spawnRate(60))
  })

  it('caps the spawn rate so the pool ceiling is never the limiter', () => {
    expect(spawnRate(100000)).toBeLessThanOrEqual(28)
  })

  it('scales health upward but not absurdly', () => {
    expect(healthScale(0)).toBe(1)
    expect(healthScale(600)).toBeGreaterThan(1)
    expect(healthScale(600)).toBeLessThan(8)
  })

  it('only offers kinds already unlocked', () => {
    for (let roll = 0; roll < 1; roll += 0.05) {
      expect(pickEnemyKind(0, roll).unlockAt).toBe(0)
    }
    const late = new Set<string>()
    for (let roll = 0; roll < 1; roll += 0.02) late.add(pickEnemyKind(200, roll).id)
    expect(late.size).toBeGreaterThan(1)
  })
})

describe('swarm', () => {
  it('spawns enemies over time', () => {
    const sim = newSim()
    play(sim, 5, STAND_STILL)
    expect(sim.swarm.count).toBeGreaterThan(0)
  })

  it('never exceeds the pool ceiling, even deep into a run', () => {
    const sim = newSim()
    sim.run.elapsed = 600 // jump to a brutal spawn rate
    for (let i = 0; i < 3600; i++) {
      sim.swarm.update(0, 0, 600, TICK_S)
      expect(sim.swarm.count).toBeLessThanOrEqual(MAX_ENEMIES)
    }
  })

  it('moves enemies toward the player', () => {
    const sim = newSim()
    play(sim, 3, STAND_STILL)
    const before = sim.swarm.pool
      .at(0)
    const d0 = Math.hypot(before.x - sim.player.x, before.y - sim.player.y)
    for (let i = 0; i < 60; i++) sim.swarm.update(0, 0, 3, TICK_S)
    const after = sim.swarm.pool.at(0)
    const d1 = Math.hypot(after.x - sim.player.x, after.y - sim.player.y)
    expect(d1).toBeLessThan(d0)
  })

  it('keeps enemies apart instead of collapsing them onto one point', () => {
    const sim = newSim()
    play(sim, 25, STAND_STILL)
    // Sample pairs among the closest enemies; heavy overlap would mean the
    // separation force is not doing its job and the swarm reads as one blob.
    let overlapping = 0
    let pairs = 0
    const n = Math.min(sim.swarm.count, 40)
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = sim.swarm.pool.at(i)
        const b = sim.swarm.pool.at(j)
        const min = a.kind.radius + b.kind.radius
        pairs++
        if (Math.hypot(a.x - b.x, a.y - b.y) < min * 0.5) overlapping++
      }
    }
    expect(pairs).toBeGreaterThan(0)
    expect(overlapping / pairs).toBeLessThan(0.1)
  })

  it('produces no NaN over a long run', () => {
    const sim = newSim()
    play(sim, 180, KITE)
    for (let i = 0; i < sim.swarm.count; i++) {
      const e = sim.swarm.pool.at(i)
      expect(Number.isFinite(e.x)).toBe(true)
      expect(Number.isFinite(e.y)).toBe(true)
      expect(Number.isFinite(e.hp)).toBe(true)
    }
    expect(Number.isFinite(sim.player.x)).toBe(true)
    expect(Number.isFinite(sim.run.hp)).toBe(true)
  })
})

describe('combat', () => {
  it('kills enemies that walk into the arc', () => {
    const sim = newSim()
    play(sim, 30, STAND_STILL)
    expect(sim.run.kills).toBeGreaterThan(0)
  })

  it('kills a standing player eventually', () => {
    // A game you cannot lose is not a game. Standing still must be fatal.
    const sim = newSim()
    play(sim, 300, STAND_STILL)
    expect(sim.run.over).toBe(true)
    expect(sim.run.hp).toBe(0)
  })

  it('rewards moving: kiting survives longer than standing still', () => {
    const standing = newSim(77)
    play(standing, 300, STAND_STILL)

    const kiting = newSim(77)
    play(kiting, 300, KITE)

    expect(kiting.run.elapsed).toBeGreaterThan(standing.run.elapsed)
  })

  it('caps damage to one hit per immunity window', () => {
    // Surrounded by a crowd, the player must not take every enemy's damage on
    // the same tick. Without the immunity window the health bar empties in a
    // fraction of a second, faster than the player can read what hit them.
    // Standing still, the sweep holds the crowd off for roughly the first
    // half-minute before bodies start getting through, so this samples after
    // that grace period.
    const sim = newSim()
    play(sim, 45, STAND_STILL)
    expect(sim.run.hp).toBeGreaterThan(0)
    expect(sim.run.hp).toBeLessThan(PLAYER_MAX_HP)
    // However dense the crowd, damage is bounded by the immunity window.
    const maxHits = Math.ceil(45 / HURT_IMMUNITY) + 1
    expect(PLAYER_MAX_HP - sim.run.hp).toBeLessThanOrEqual(maxHits * 20)
  })

  it('kills while moving, not only while standing still', () => {
    // The original design aimed the arc along the direction of travel. Enemies
    // chase, so they sat behind a moving player and the sweep hit empty ground:
    // headless runs scored ZERO kills in every style except standing perfectly
    // still. Auto-targeting is what fixed it, and this is the regression test.
    const sim = newSim()
    play(sim, 60, SKIRMISH)
    expect(sim.run.kills).toBeGreaterThan(20)
  })

  it('ends a run in a plausible amount of time', () => {
    // Long enough to learn something, short enough that a loss costs little.
    for (const style of [STAND_STILL, SKIRMISH, KITE]) {
      const sim = newSim()
      play(sim, 600, style)
      expect(sim.run.over).toBe(true)
      expect(sim.run.elapsed).toBeGreaterThan(30)
      expect(sim.run.elapsed).toBeLessThan(400)
    }
  })

  it('stops simulating once the run is over', () => {
    const sim = newSim()
    play(sim, 400, STAND_STILL)
    const at = sim.run.elapsed
    const kills = sim.run.kills
    play(sim, 10, STAND_STILL)
    expect(sim.run.elapsed).toBe(at)
    expect(sim.run.kills).toBe(kills)
  })

  it('reproduces a run exactly from the same seed and inputs', () => {
    // The property that makes replays, ghosts and server-side anti-cheat
    // possible: a run is fully described by its seed plus its input stream.
    const a = newSim(31337)
    play(a, 120, KITE)
    const b = newSim(31337)
    play(b, 120, KITE)

    expect(b.run.elapsed).toBeCloseTo(a.run.elapsed, 9)
    expect(b.run.kills).toBe(a.run.kills)
    expect(b.run.hp).toBe(a.run.hp)
    expect(b.swarm.count).toBe(a.swarm.count)
    expect(b.player.x).toBeCloseTo(a.player.x, 9)
  })

  it('diverges for a different seed', () => {
    const a = newSim(1)
    play(a, 90, SKIRMISH)
    const b = newSim(2)
    play(b, 90, SKIRMISH)
    // Compare the swarm rather than the score: two seeds can coincidentally
    // reach the same kill count, but their enemy layouts will not match.
    const first = (s: typeof a) => (s.swarm.count > 0 ? s.swarm.pool.at(0).x : NaN)
    expect(first(b)).not.toBeCloseTo(first(a), 3)
  })
})
