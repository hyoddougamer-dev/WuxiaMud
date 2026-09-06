import { describe, expect, it } from 'vitest'
import { TICK_S } from '../src/core/loop'
import { Rng } from '../src/core/rng'
import { BOSS_EVERY, ENEMY_KINDS, KIND_BY_ID, pickEnemyKind } from '../src/data/enemies'
import { CHARGE_DASH, CHARGE_WINDUP, Swarm } from '../src/sim/enemies'
import { Hazards } from '../src/sim/hazards'
import { MAX_SPEED } from '../src/sim/player'
import { deriveStats, emptyKit } from '../src/sim/loadout'

const step = (swarm: Swarm, hazards: Hazards, elapsed: number, ticks: number, px = 0, py = 0) => {
  for (let i = 0; i < ticks; i++) swarm.update(px, py, elapsed, TICK_S, hazards)
}

describe('enemy roster', () => {
  it('gives every kind a distinct id', () => {
    expect(new Set(ENEMY_KINDS.map((k) => k.id)).size).toBe(ENEMY_KINDS.length)
  })

  it('covers several behaviours, not just chasing', () => {
    // The whole point of the roster: a field of pure chasers is the same fight
    // at minute one and minute five, only denser.
    expect(new Set(ENEMY_KINDS.map((k) => k.behaviour)).size).toBeGreaterThanOrEqual(5)
  })

  it('never lets a normal enemy outrun the player', () => {
    // Walking away is the only defence a one-thumb game has. The charger is the
    // deliberate exception, and only for the moment its dash lasts.
    for (const kind of ENEMY_KINDS) {
      if (kind.behaviour === 'charger') continue
      expect(kind.speed).toBeLessThan(MAX_SPEED)
    }
  })

  it('keeps summon-only kinds out of the normal draw', () => {
    // Scraps and the boss must arrive by their own routes, never by a roll.
    for (let roll = 0; roll < 1; roll += 0.01) {
      const kind = pickEnemyKind(10000, roll)
      expect(kind.weight).toBeGreaterThan(0)
      expect(kind.behaviour).not.toBe('boss')
    }
  })

  it('points every splitter at a kind that exists', () => {
    for (const kind of ENEMY_KINDS) {
      if (!kind.splitsInto) continue
      expect(KIND_BY_ID.has(kind.splitsInto)).toBe(true)
    }
  })
})

describe('charger', () => {
  it('winds up, then dashes in a locked direction', () => {
    const swarm = new Swarm(new Rng(5))
    const hazards = new Hazards()
    const kind = KIND_BY_ID.get('charger')!
    const e = swarm.place(kind, 150, 0, 0)!

    // It only commits once it is close enough for the dash to threaten.
    let sawWindup = false
    let sawDash = false
    let dashDir: [number, number] | null = null
    for (let i = 0; i < 600; i++) {
      swarm.update(0, 0, 0, TICK_S, hazards)
      if (e.state === CHARGE_WINDUP) sawWindup = true
      if (e.state === CHARGE_DASH) {
        sawDash = true
        dashDir ??= [e.dirX, e.dirY]
      }
      if (sawDash && dashDir) {
        // Direction must stay locked: a homing dash cannot be dodged, which
        // would make it just a fast chaser with extra steps.
        expect(e.dirX).toBeCloseTo(dashDir[0], 9)
        break
      }
    }
    expect(sawWindup).toBe(true)
    expect(sawDash).toBe(true)
  })

  it('stands still while winding up', () => {
    const swarm = new Swarm(new Rng(9))
    const hazards = new Hazards()
    const e = swarm.place(KIND_BY_ID.get('charger')!, 120, 0, 0)!
    for (let i = 0; i < 900; i++) {
      swarm.update(0, 0, 0, TICK_S, hazards)
      if (e.state !== CHARGE_WINDUP) continue
      const before = e.x
      swarm.update(0, 0, 0, TICK_S, hazards)
      if (e.state !== CHARGE_WINDUP) break
      // The telegraph is only fair if it is a real pause the player can read.
      expect(Math.abs(e.x - before)).toBeLessThan(2)
      return
    }
    throw new Error('never reached the windup state')
  })
})

describe('shooter', () => {
  it('fires at the player from range', () => {
    const swarm = new Swarm(new Rng(3))
    const hazards = new Hazards()
    swarm.place(KIND_BY_ID.get('archer')!, 200, 0, 0)
    step(swarm, hazards, 0, 300)
    expect(hazards.count).toBeGreaterThan(0)
  })

  it('holds its distance instead of closing', () => {
    const swarm = new Swarm(new Rng(4))
    const hazards = new Hazards()
    const e = swarm.place(KIND_BY_ID.get('archer')!, 500, 0, 0)!
    step(swarm, hazards, 0, 900)
    const dist = Math.hypot(e.x, e.y)
    const standoff = KIND_BY_ID.get('archer')!.standoff!
    // It should settle near its ring rather than walking into the sweep.
    expect(dist).toBeGreaterThan(standoff * 0.5)
  })
})

describe('enemy projectiles', () => {
  it('hits the player once and is consumed', () => {
    const hazards = new Hazards()
    hazards.fire(0, 0, 1, 0, 9)
    expect(hazards.strike(0, 0, 11)).toBe(9)
    // A projectile that passed through would keep hitting every tick the
    // player stayed inside it.
    expect(hazards.strike(0, 0, 11)).toBe(0)
  })

  it('misses when the player is elsewhere', () => {
    const hazards = new Hazards()
    hazards.fire(0, 0, 1, 0, 9)
    expect(hazards.strike(400, 400, 11)).toBe(0)
  })

  it('expires rather than travelling forever', () => {
    const hazards = new Hazards()
    hazards.fire(0, 0, 1, 0, 9)
    for (let i = 0; i < 60 * 10; i++) hazards.update(TICK_S)
    expect(hazards.count).toBe(0)
  })
})

describe('splitter', () => {
  it('comes apart into its scraps', () => {
    const swarm = new Swarm(new Rng(6))
    const effigy = KIND_BY_ID.get('effigy')!
    const e = swarm.place(effigy, 0, 0, 0)!
    expect(swarm.count).toBe(1)
    swarm.splitOnDeath(e, 0)
    swarm.kill(0)
    expect(swarm.count).toBe(effigy.splitCount)
    for (let i = 0; i < swarm.count; i++) {
      expect(swarm.pool.at(i).kind.id).toBe('scrap')
    }
  })
})

describe('boss', () => {
  it('never arrives on a clock alone — only once queued', () => {
    // The rift replaced the clock: a boss now has to be ASKED for. A long
    // headless run with nobody ever calling queueBoss() must stay clean, or
    // the balance harnesses would be measuring a fight they never asked for.
    const swarm = new Swarm(new Rng(2))
    const hazards = new Hazards()
    // A fixed, late elapsed — the exact value that used to trigger a boss
    // outright under the old clock — held for a couple of thousand ticks.
    step(swarm, hazards, BOSS_EVERY * 5, 2000)
    expect(swarm.bossAlive).toBe(false)
  })

  it('arrives once queued, and only once', () => {
    const swarm = new Swarm(new Rng(2))
    const hazards = new Hazards()
    swarm.queueBoss()
    swarm.update(0, 0, BOSS_EVERY, TICK_S, hazards)
    expect(swarm.bossAlive).toBe(true)

    let bosses = 0
    for (let i = 0; i < swarm.count; i++) {
      if (swarm.pool.at(i).kind.behaviour === 'boss') bosses++
    }
    expect(bosses).toBe(1)

    step(swarm, hazards, BOSS_EVERY, 600)
    let stillOne = 0
    for (let i = 0; i < swarm.count; i++) {
      if (swarm.pool.at(i).kind.behaviour === 'boss') stillOne++
    }
    expect(stillOne).toBe(1)
  })

  it('clears the flag when killed, so the next one can come', () => {
    const swarm = new Swarm(new Rng(2))
    const hazards = new Hazards()
    swarm.queueBoss()
    swarm.update(0, 0, BOSS_EVERY, TICK_S, hazards)
    for (let i = swarm.count - 1; i >= 0; i--) {
      if (swarm.pool.at(i).kind.behaviour === 'boss') swarm.kill(i)
    }
    expect(swarm.bossAlive).toBe(false)
  })

  it('is not despawned by the player running away', () => {
    // A boss recycled for distance would simply vanish mid-fight.
    const swarm = new Swarm(new Rng(2))
    const hazards = new Hazards()
    swarm.queueBoss()
    swarm.update(0, 0, BOSS_EVERY, TICK_S, hazards)
    step(swarm, hazards, BOSS_EVERY, 120, 2000, 2000)
    expect(swarm.bossAlive).toBe(true)
  })

  it('fires a ring rather than a single aimed shot', () => {
    const swarm = new Swarm(new Rng(2))
    const hazards = new Hazards()
    swarm.queueBoss()
    swarm.update(0, 0, BOSS_EVERY, TICK_S, hazards)
    step(swarm, hazards, BOSS_EVERY, 300)
    // A ring means the answer is to move, not to face.
    expect(hazards.count).toBeGreaterThanOrEqual(6)
  })
})


describe('the world has to be able to reach you', () => {
  /**
   * The bug this exists to make impossible again.
   *
   * Played on a device, the game read as "everything is OP, there is no
   * challenge". The cause was one number nobody had ever compared: the player
   * moves at 250, and the FASTEST thing in the entire roster was a boss at
   * 170 — 0.68x. Every ordinary enemy sat between 0.09x and 0.47x. Walking in
   * a straight line made the swordsman untouchable, so the only way to take
   * damage was to choose to stand still.
   *
   * Worse, a previous pass had already "fixed" boss speed by raising bosses
   * against EACH OTHER and never against the player, so they stayed
   * un-catchable and the fix read as done. These tests compare against the
   * player, which is the only comparison that decides whether there is a game.
   */
  const playerSpeed = (): number => deriveStats(emptyKit()).moveSpeed

  it('gives the darters something worth the name', () => {
    // "darter — fast, fragile, arrives early" is the roster's own description.
    // At 0.38x of the player it described nothing.
    const darters = ENEMY_KINDS.filter((k) => k.behaviour === 'darter')
    expect(darters.length).toBeGreaterThan(0)
    for (const kind of darters) {
      expect(kind.speed / playerSpeed()).toBeGreaterThan(0.8)
    }
  })

  it('lets a boss close on a fleeing player', () => {
    // A boss that can be walked away from is an optional boss — and the gate
    // it guards is the spine of the progression now. The Reed Mother is the
    // documented exception: her fight is about whether you can reach HER while
    // wading, so she is allowed to be slow.
    const bosses = ENEMY_KINDS.filter((k) => k.behaviour === 'boss' && k.id !== 'reedmother')
    expect(bosses.length).toBeGreaterThan(0)
    for (const kind of bosses) {
      expect(kind.speed / playerSpeed()).toBeGreaterThan(0.85)
    }
  })

  it('still lets a player outrun the ordinary horde', () => {
    // The other half of the same rule. If the whole field matched the player,
    // repositioning — the only verb this control scheme has — would stop
    // working, and several arts fire on conditions like standing still.
    const horde = ENEMY_KINDS.filter((k) => k.behaviour === 'chaser')
    for (const kind of horde) {
      expect(kind.speed / playerSpeed()).toBeLessThan(0.75)
    }
  })

  it('never ships a roster nothing in which can catch the player', () => {
    // The single assertion that would have caught the original bug.
    const fastest = Math.max(...ENEMY_KINDS.map((k) => k.speed))
    expect(fastest / playerSpeed()).toBeGreaterThan(0.85)
  })
})
