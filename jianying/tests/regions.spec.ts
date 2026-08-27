import { describe, expect, it } from 'vitest'
import { TICK_S } from '../src/core/loop'
import { Rng } from '../src/core/rng'
import { ENEMY_KINDS, KIND_BY_ID } from '../src/data/enemies'
import { ITEM_BY_ID } from '../src/data/items'
import {
  MAX_DEPTH,
  REGIONS,
  REGION_BY_ID,
  clampDepth,
  depthHealthScale,
  depthReward,
  depthSpawnScale,
  pickFromRoster,
  regionAt,
  regionById,
  type Region,
} from '../src/data/regions'
import { ROUSED, Swarm, contactDamage, rouse } from '../src/sim/enemies'
import { Hazards } from '../src/sim/hazards'
import { MAX_SPEED, createPlayer, updatePlayer } from '../src/sim/player'

const region = (id: string): Region => REGION_BY_ID.get(id)!

const step = (swarm: Swarm, hazards: Hazards, ticks: number, px = 0, py = 0): void => {
  for (let i = 0; i < ticks; i++) swarm.update(px, py, 0, TICK_S, hazards)
}

describe('the world', () => {
  it('gives every region an id, a place and a rule the player can read', () => {
    expect(new Set(REGIONS.map((r) => r.id)).size).toBe(REGIONS.length)
    for (const r of REGIONS) {
      expect(r.blurb.trim().length).toBeGreaterThan(0)
      // A region whose rule the player has to infer from being slowed is a bug,
      // not a discovery — so even the Post Road, which has no rule, says so.
      expect(r.ruleText.trim().length).toBeGreaterThan(0)
      expect(REGION_BY_ID.get(r.id)).toBe(r)
    }
  })

  it('numbers the regions in order, with no gaps', () => {
    REGIONS.forEach((r, i) => expect(r.depth).toBe(i + 1))
    expect(MAX_DEPTH).toBe(REGIONS.length)
  })

  it('points every roster and boss at a kind that exists', () => {
    for (const r of REGIONS) {
      expect(r.roster.length).toBeGreaterThan(0)
      for (const id of r.roster) {
        expect(KIND_BY_ID.has(id), `${r.name}: ${id}`).toBe(true)
      }
      const boss = KIND_BY_ID.get(r.bossId)
      expect(boss, r.name).toBeDefined()
      expect(boss!.behaviour, r.name).toBe('boss')
    }
  })

  it('gives every region a boss of its own', () => {
    // A shared boss would undo the point of the place: the fight is meant to
    // ask the region's own question, loudly, once.
    const bosses = REGIONS.map((r) => r.bossId)
    expect(new Set(bosses).size).toBe(bosses.length)
  })

  it('points every drop at an item that exists, and shares none between regions', () => {
    const seen = new Set<string>()
    for (const r of REGIONS) {
      expect(r.drops.length).toBeGreaterThan(0)
      for (const id of r.drops) {
        expect(ITEM_BY_ID.has(id), `${r.name}: ${id}`).toBe(true)
        // An item findable in two places is an item with no address, and the
        // address is the whole reason to choose one region over another.
        expect(seen.has(id), `${id} drops in more than one region`).toBe(false)
        seen.add(id)
      }
    }
  })

  it('makes every item in the game findable somewhere', () => {
    // The alternative is an item the player can never obtain, which is worse
    // than not shipping it.
    const dropped = new Set(REGIONS.flatMap((r) => [...r.drops]))
    for (const id of ITEM_BY_ID.keys()) {
      expect(dropped.has(id), `${id} drops nowhere`).toBe(true)
    }
  })

  it('keeps every regional kind out of the global draw', () => {
    // Regional kinds are named by their region, never rolled at large — that is
    // what stops the marsh from drawing cliff hawks.
    const regional = new Set(REGIONS.flatMap((r) => [...r.roster, r.bossId]))
    for (const kind of ENEMY_KINDS) {
      if (kind.weight > 0) continue
      // Everything with no weight must be reachable some other way: a region
      // roster, a region boss, or something a splitter leaves behind.
      const isSplit = ENEMY_KINDS.some((k) => k.splitsInto === kind.id)
      expect(regional.has(kind.id) || isSplit, `${kind.id} is unreachable`).toBe(true)
    }
  })

  it('gets harder and pays more the deeper it goes', () => {
    for (let d = 1; d < MAX_DEPTH; d++) {
      expect(depthHealthScale(d + 1)).toBeGreaterThan(depthHealthScale(d))
      expect(depthSpawnScale(d + 1)).toBeGreaterThan(depthSpawnScale(d))
      expect(depthReward(d + 1)).toBeGreaterThan(depthReward(d))
    }
  })

  it('resolves a depth or an id to a real region, always', () => {
    expect(regionAt(0).id).toBe(REGIONS[0]!.id)
    expect(regionAt(99).id).toBe(REGIONS[REGIONS.length - 1]!.id)
    expect(regionById('not-a-place').id).toBe(REGIONS[0]!.id)
    expect(clampDepth(9, 2)).toBe(2)
    expect(clampDepth(0, 5)).toBe(1)
  })

  it('only ever draws from the region it is in', () => {
    const rng = new Rng(11)
    for (const r of REGIONS) {
      for (let i = 0; i < 300; i++) {
        expect(r.roster).toContain(pickFromRoster(r, rng.next()))
      }
    }
  })
})

describe('the marsh slows you, and not them', () => {
  it('moves the player less for the same input', () => {
    const marsh = region('marsh')
    expect(marsh.rule.playerSpeed).toBeLessThan(1)

    const walk = (scale: number): number => {
      const p = createPlayer(0, 0)
      for (let i = 0; i < 120; i++) updatePlayer(p, 1, 0, TICK_S, MAX_SPEED * scale)
      return p.x
    }
    expect(walk(marsh.rule.playerSpeed!)).toBeLessThan(walk(1) * 0.95)
  })

  it('leaves enemy speed untouched', () => {
    // The asymmetry IS the rule. If the marsh slowed everything it would just
    // be the same fight at a lower frame of reference.
    for (const id of region('marsh').roster) {
      const here = KIND_BY_ID.get(id)!
      expect(here.speed).toBe(KIND_BY_ID.get(id)!.speed)
    }
  })
})

describe('the cliff wind moves you whatever you do', () => {
  it('displaces a player who is pushing back against it', () => {
    const cliff = region('cliff')
    const drift = cliff.rule.drift!
    expect(drift).toBeGreaterThan(0)

    // Pushing straight into a wind that is weaker than top speed still makes
    // ground — but strictly less ground than with no wind at all.
    const withWind = createPlayer(0, 0)
    const still = createPlayer(0, 0)
    for (let i = 0; i < 180; i++) {
      updatePlayer(withWind, 1, 0, TICK_S, MAX_SPEED, -drift, 0)
      updatePlayer(still, 1, 0, TICK_S, MAX_SPEED)
    }
    expect(withWind.x).toBeLessThan(still.x)
    expect(withWind.x).toBeGreaterThan(0)
  })

  it('moves a player who is not touching the controls at all', () => {
    // Velocity-based wind would be cancelled the moment the thumb pushed back.
    // Position-based wind cannot be, which is the point of the place.
    const p = createPlayer(0, 0)
    for (let i = 0; i < 120; i++) updatePlayer(p, 0, 0, TICK_S, MAX_SPEED, 40, 0)
    expect(p.x).toBeGreaterThan(60)
  })
})

describe('the market makes everything come apart', () => {
  it('splits a kind that would not normally split', () => {
    const swarm = new Swarm(new Rng(3), region('market'))
    const leech = KIND_BY_ID.get('leech')!
    const e = swarm.place(leech, 0, 0, 0)!
    expect(leech.splitsInto).toBeUndefined()

    swarm.splitOnDeath(e, 0)
    swarm.kill(0)
    expect(swarm.count).toBe(region('market').rule.splitAll)
  })

  it('stacks with a kind that splits on its own', () => {
    const swarm = new Swarm(new Rng(3), region('market'))
    const effigy = KIND_BY_ID.get('effigy')!
    const e = swarm.place(effigy, 0, 0, 0)!
    swarm.splitOnDeath(e, 0)
    swarm.kill(0)
    expect(swarm.count).toBe(effigy.splitCount! + region('market').rule.splitAll!)
  })

  it('does not split the scraps, so a kill cannot cascade forever', () => {
    const swarm = new Swarm(new Rng(3), region('market'))
    const scrap = KIND_BY_ID.get('scrap')!
    const e = swarm.place(scrap, 0, 0, 0)!
    swarm.splitOnDeath(e, 0)
    swarm.kill(0)
    expect(swarm.count).toBe(0)
  })

  it('leaves other regions alone', () => {
    const swarm = new Swarm(new Rng(3), region('road'))
    const e = swarm.place(KIND_BY_ID.get('bandit')!, 0, 0, 0)!
    swarm.splitOnDeath(e, 0)
    swarm.kill(0)
    expect(swarm.count).toBe(0)
  })
})

describe('the pass gives you a front', () => {
  it('lands arrivals inside an arc rather than all around', () => {
    const pass = region('pass')
    const swarm = new Swarm(new Rng(7), pass)
    const hazards = new Hazards()
    // Long enough to spawn a crowd, short enough that the arc has only turned
    // a fraction of its 38-second circuit.
    step(swarm, hazards, 300)
    expect(swarm.count).toBeGreaterThan(3)

    let widest = 0
    for (let i = 0; i < swarm.count; i++) {
      const e = swarm.pool.at(i)
      if (e.kind.behaviour === 'boss') continue
      widest = Math.max(widest, Math.abs(Math.atan2(e.y, e.x)))
    }
    // Everything arrived within the arc, plus whatever it turned meanwhile.
    expect(widest).toBeLessThan(pass.rule.formationArc! + 1)
  })

  it('spreads arrivals all around in a region with no formation', () => {
    const swarm = new Swarm(new Rng(7), region('road'))
    const hazards = new Hazards()
    step(swarm, hazards, 200)

    let minA = Infinity
    let maxA = -Infinity
    for (let i = 0; i < swarm.count; i++) {
      const a = Math.atan2(swarm.pool.at(i).y, swarm.pool.at(i).x)
      minA = Math.min(minA, a)
      maxA = Math.max(maxA, a)
    }
    expect(maxA - minA).toBeGreaterThan(Math.PI)
  })
})

describe('lurkers wait', () => {
  it('stays put and harmless until the player comes close', () => {
    const swarm = new Swarm(new Rng(5), region('marsh'))
    const hazards = new Hazards()
    const e = swarm.place(KIND_BY_ID.get('drowned')!, 400, 0, 0)!

    step(swarm, hazards, 120, 0, 0)
    expect(Math.abs(e.x - 400)).toBeLessThan(2)
    expect(e.state).not.toBe(ROUSED)
    // Walking past a sleeping one has to be safe, or it is just a slow chaser.
    expect(contactDamage(e)).toBe(0)
  })

  it('wakes when the player is inside its radius, and stays awake', () => {
    const swarm = new Swarm(new Rng(5), region('marsh'))
    const hazards = new Hazards()
    const drowned = KIND_BY_ID.get('drowned')!
    const e = swarm.place(drowned, drowned.wakeRadius! - 20, 0, 0)!

    step(swarm, hazards, 2, 0, 0)
    expect(e.state).toBe(ROUSED)
    expect(contactDamage(e)).toBe(drowned.damage)

    // Running away must not put it back to sleep: a threat that can be
    // re-lost teaches nothing.
    step(swarm, hazards, 60, 900, 0)
    expect(e.state).toBe(ROUSED)
  })
})

describe('pilgrims are only dangerous once you swing', () => {
  it('does nothing to a player who leaves it alone', () => {
    const swarm = new Swarm(new Rng(6), region('market'))
    const hazards = new Hazards()
    const e = swarm.place(KIND_BY_ID.get('pilgrim')!, 20, 0, 0)!

    step(swarm, hazards, 180, 0, 0)
    expect(e.state).not.toBe(ROUSED)
    expect(contactDamage(e)).toBe(0)
  })

  it('turns the moment it is struck, and hits hard afterwards', () => {
    const swarm = new Swarm(new Rng(6), region('market'))
    const pilgrim = KIND_BY_ID.get('pilgrim')!
    const e = swarm.place(pilgrim, 20, 0, 0)!

    rouse(e)
    expect(e.state).toBe(ROUSED)
    expect(contactDamage(e)).toBe(pilgrim.damage)
    // Faster than it was, which is what gives cutting blind a real price.
    expect(pilgrim.rousedSpeed!).toBeGreaterThan(1)
  })

  it('leaves every other behaviour alone', () => {
    const swarm = new Swarm(new Rng(6), region('road'))
    const e = swarm.place(KIND_BY_ID.get('bandit')!, 20, 0, 0)!
    rouse(e)
    expect(e.state).not.toBe(ROUSED)
    expect(contactDamage(e)).toBe(KIND_BY_ID.get('bandit')!.damage)
  })
})

describe('each region fields its own roster', () => {
  it('never spawns another region’s inhabitants', () => {
    const hazards = new Hazards()
    for (const r of REGIONS) {
      const swarm = new Swarm(new Rng(21), r)
      step(swarm, hazards, 240)
      expect(swarm.count).toBeGreaterThan(0)
      for (let i = 0; i < swarm.count; i++) {
        const id = swarm.pool.at(i).kind.id
        const allowed =
          r.roster.includes(id) ||
          id === r.bossId ||
          // Whatever the region's own inhabitants leave behind when cut.
          ENEMY_KINDS.some((k) => k.splitsInto === id)
        expect(allowed, `${r.name} fielded ${id}`).toBe(true)
      }
    }
  })

  it('summons the region’s own boss, not the warlord everywhere', () => {
    const hazards = new Hazards()
    for (const r of REGIONS) {
      const swarm = new Swarm(new Rng(2), r)
      // One tick past the boss timer is enough to place it.
      swarm.update(0, 0, 10_000, TICK_S, hazards)
      expect(swarm.bossAlive, r.name).toBe(true)

      let found = ''
      for (let i = 0; i < swarm.count; i++) {
        if (swarm.pool.at(i).kind.behaviour === 'boss') found = swarm.pool.at(i).kind.id
      }
      expect(found, r.name).toBe(r.bossId)
    }
  })
})
