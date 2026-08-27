import { describe, expect, it } from 'vitest'
import { TICK_S } from '../src/core/loop'
import { Rng } from '../src/core/rng'
import {
  ATTRIBUTES,
  type Attributes,
  createCharacter,
  emptyAttributes,
  grantXp,
  recordRun,
  rewardFor,
  spendPoint,
  xpForCultivation,
} from '../src/meta/character'
import {
  MAX_DEPTH,
  ROADS,
  clampDepth,
  depthHealthScale,
  depthReward,
  depthSpawnScale,
  roadOf,
} from '../src/meta/depth'
import {
  LEVELS_PER_REALM,
  REALMS,
  isRealmAdvance,
  realmIndex,
  realmOf,
  realmStep,
} from '../src/meta/realms'
import { parseCharacter, serialiseCharacter } from '../src/meta/save'
import { SLASH_DAMAGE, SLASH_INTERVAL, createRun, updateCombat } from '../src/sim/combat'
import { Swarm } from '../src/sim/enemies'
import { Hazards } from '../src/sim/hazards'
import { deriveStats } from '../src/sim/loadout'
import { Motes } from '../src/sim/pickups'
import { Bolts } from '../src/sim/projectiles'
import { createPlayer, updatePlayer } from '../src/sim/player'

const attrs = (partial: Partial<Attributes>): Attributes => ({ ...emptyAttributes(), ...partial })

describe('realms', () => {
  it('gives every level a realm', () => {
    for (let level = 1; level <= 200; level++) {
      expect(realmOf(level).name).toBeTruthy()
      expect(realmIndex(level)).toBeGreaterThanOrEqual(0)
      expect(realmIndex(level)).toBeLessThan(REALMS.length)
    }
  })

  it('promotes exactly once every five levels, until the last realm', () => {
    let advances = 0
    for (let level = 2; level <= REALMS.length * LEVELS_PER_REALM; level++) {
      if (isRealmAdvance(level)) advances++
    }
    // One promotion into each realm after the first.
    expect(advances).toBe(REALMS.length - 1)
  })

  it('never promotes past the top realm', () => {
    for (let level = REALMS.length * LEVELS_PER_REALM + 1; level < 400; level++) {
      expect(isRealmAdvance(level)).toBe(false)
      expect(realmIndex(level)).toBe(REALMS.length - 1)
    }
  })

  it('keeps counting the step in the open-ended top realm', () => {
    // A step that wrapped back to 1 up there would promise a promotion that is
    // never coming.
    const top = (REALMS.length - 1) * LEVELS_PER_REALM
    expect(realmStep(top + 1)).toBe(1)
    expect(realmStep(top + 9)).toBe(9)
  })

  it('reads sensibly at the very first level', () => {
    expect(realmIndex(1)).toBe(0)
    expect(realmStep(1)).toBe(1)
    expect(isRealmAdvance(1)).toBe(false)
  })
})

describe('cultivation curve', () => {
  it('always costs more to reach the next level', () => {
    for (let level = 1; level < 200; level++) {
      expect(xpForCultivation(level + 1)).toBeGreaterThan(xpForCultivation(level))
    }
  })

  it('lets an early expedition pay for more than one level', () => {
    // The opening levels must arrive fast enough that a first-time player sees
    // the loop close — set out, die, gain, spend — inside one sitting. The
    // input here is a measured headless first expedition, not a guess: the
    // full-loop harness run scored 228.
    const c = createCharacter()
    const gain = grantXp(c, rewardFor({ kills: 96, seconds: 190, insight: 9, depth: 1 }).total)
    expect(gain.levelsGained).toBeGreaterThanOrEqual(2)
    expect(gain.pointsGained).toBeGreaterThanOrEqual(2)
  })

  it('slows to roughly a level per expedition by the mid game', () => {
    // Guards the far end of the same curve: if a strong run at level 15 still
    // bought five levels, the ladder would be decoration.
    const c = createCharacter()
    c.level = 15
    const before = c.level
    grantXp(c, rewardFor({ kills: 240, seconds: 260, insight: 12, depth: 3 }).total)
    expect(c.level - before).toBeLessThanOrEqual(2)
  })

  it('crosses several levels in one grant rather than swallowing the extra', () => {
    const c = createCharacter()
    const huge = xpForCultivation(1) + xpForCultivation(2) + xpForCultivation(3)
    const gain = grantXp(c, huge)
    expect(gain.levelsGained).toBe(3)
    expect(c.level).toBe(4)
    expect(c.xp).toBe(0)
  })

  it('ignores a non-positive grant', () => {
    const c = createCharacter()
    const gain = grantXp(c, 0)
    expect(gain.levelsGained).toBe(0)
    expect(c.xp).toBe(0)
    expect(grantXp(c, -500).levelsGained).toBe(0)
    expect(c.xp).toBe(0)
  })

  it('pays extra points and opens a road on a realm advance', () => {
    const c = createCharacter()
    let total = 0
    for (let level = 1; level < LEVELS_PER_REALM + 1; level++) total += xpForCultivation(level)
    const gain = grantXp(c, total)
    expect(c.level).toBe(LEVELS_PER_REALM + 1)
    expect(gain.realmAdvancedTo).toBe(LEVELS_PER_REALM + 1)
    // One point for each ordinary level, three for the promotion.
    expect(gain.pointsGained).toBe(LEVELS_PER_REALM - 1 + 3)
    expect(gain.depthUnlocked).toBe(2)
    expect(c.depth).toBe(2)
  })

  it('never unlocks a road that does not exist', () => {
    const c = createCharacter()
    // Enough to run off the end of the named ladder several times over.
    grantXp(c, 50_000_000)
    expect(c.depth).toBeLessThanOrEqual(MAX_DEPTH)
    expect(roadOf(c.depth)).toBeTruthy()
  })
})

describe('expedition reward', () => {
  it('itemises into terms that add up', () => {
    const reward = rewardFor({ kills: 40, seconds: 120, insight: 5, depth: 1 })
    expect(reward.kills).toBe(40)
    expect(reward.time).toBe(40)
    expect(reward.insight).toBe(32)
    expect(reward.total).toBe(112)
  })

  it('pays for surviving even when nothing was killed', () => {
    // A player who spends the whole expedition running still learned the road,
    // and an expedition worth literally nothing would make death feel punitive
    // rather than instructive.
    expect(rewardFor({ kills: 0, seconds: 90, insight: 1, depth: 1 }).total).toBeGreaterThan(0)
  })

  it('scales with depth', () => {
    const shallow = rewardFor({ kills: 50, seconds: 100, insight: 4, depth: 1 })
    const deep = rewardFor({ kills: 50, seconds: 100, insight: 4, depth: 4 })
    expect(deep.total).toBeGreaterThan(shallow.total)
    expect(deep.depthBonus).toBeCloseTo(depthReward(4), 9)
  })

  it('records lifetime totals', () => {
    const c = createCharacter()
    recordRun(c, { kills: 30, seconds: 88.6, insight: 4, depth: 1 })
    recordRun(c, { kills: 12, seconds: 40, insight: 2, depth: 1 })
    expect(c.runs).toBe(2)
    expect(c.totalKills).toBe(42)
    // Best, not last.
    expect(c.bestSeconds).toBe(88)
  })
})

describe('attribute points', () => {
  it('refuses to spend what has not been earned', () => {
    const c = createCharacter()
    c.points = 1
    expect(spendPoint(c, 'edge')).toBe(true)
    expect(spendPoint(c, 'edge')).toBe(false)
    expect(c.spent.edge).toBe(1)
    expect(c.points).toBe(0)
  })

  it('gives every attribute a stated effect', () => {
    // A point whose effect the player cannot predict is a point they will not
    // spend, so the blurb is part of the contract rather than decoration.
    for (const attr of ATTRIBUTES) {
      expect(attr.effect.trim().length).toBeGreaterThan(0)
      expect(attr.name.trim().length).toBeGreaterThan(0)
    }
    expect(new Set(ATTRIBUTES.map((a) => a.id)).size).toBe(ATTRIBUTES.length)
  })
})

describe('attributes feed combat', () => {
  it('raises health, damage and rate', () => {
    const base = deriveStats(new Map())
    const grown = deriveStats(new Map(), attrs({ body: 5, edge: 5, swift: 5 }))
    expect(grown.maxHp).toBeGreaterThan(base.maxHp)
    expect(grown.slashDamage).toBeGreaterThan(base.slashDamage)
    expect(grown.slashInterval).toBeLessThan(base.slashInterval)
  })

  it('keeps a technique blurb literally true whatever the character invested', () => {
    // "+4 damage per sweep" must mean +4 whatever the character has invested.
    // Applying techniques before attributes would make every card on the
    // level-up screen quietly lie by a shifting percentage.
    const keen = new Map([['keen', 3]])
    for (const edge of [0, 4, 20]) {
      const without = deriveStats(new Map(), attrs({ edge }))
      const with3 = deriveStats(keen, attrs({ edge }))
      expect(with3.slashDamage - without.slashDamage).toBeCloseTo(12, 9)
    }
  })

  it('never lets Swiftness reach a zero interval', () => {
    // Multiplicative decay approaches zero but cannot arrive, which is what
    // keeps the sweep from dividing the frame by nothing.
    const absurd = deriveStats(new Map(), attrs({ swift: 500 }))
    expect(absurd.slashInterval).toBeGreaterThan(0)
    expect(absurd.slashInterval).toBeLessThan(SLASH_INTERVAL)
    expect(Number.isFinite(absurd.slashInterval)).toBe(true)
  })

  it('lets Spirit raise the arts without touching the sweep', () => {
    const loadout = new Map([
      ['orbit', 2],
      ['bolt', 2],
      ['nova', 2],
    ])
    const plain = deriveStats(loadout)
    const spirited = deriveStats(loadout, attrs({ spirit: 6 }))
    expect(spirited.orbitDamage).toBeGreaterThan(plain.orbitDamage)
    expect(spirited.boltDamage).toBeGreaterThan(plain.boltDamage)
    expect(spirited.novaRadius).toBeGreaterThan(plain.novaRadius)
    expect(spirited.slashDamage).toBeCloseTo(SLASH_DAMAGE, 9)
  })

  it('produces finite stats for an empty and a maxed character alike', () => {
    for (const spent of [emptyAttributes(), attrs({ body: 80, edge: 80, swift: 80, spirit: 80 })]) {
      const stats = deriveStats(new Map([['keen', 6]]), spent)
      for (const value of Object.values(stats)) {
        expect(Number.isFinite(value)).toBe(true)
      }
    }
  })
})

describe('expedition depth', () => {
  it('names every road it can unlock', () => {
    expect(ROADS.length).toBe(MAX_DEPTH)
    for (let d = 1; d <= MAX_DEPTH; d++) {
      expect(roadOf(d).name.trim().length).toBeGreaterThan(0)
    }
  })

  it('gets harder and pays more, monotonically', () => {
    for (let d = 1; d < MAX_DEPTH; d++) {
      expect(depthHealthScale(d + 1)).toBeGreaterThan(depthHealthScale(d))
      expect(depthSpawnScale(d + 1)).toBeGreaterThan(depthSpawnScale(d))
      expect(depthReward(d + 1)).toBeGreaterThan(depthReward(d))
    }
  })

  it('clamps a chosen depth to what has actually been unlocked', () => {
    expect(clampDepth(6, 2)).toBe(2)
    expect(clampDepth(0, 5)).toBe(1)
    expect(clampDepth(99, 99)).toBe(MAX_DEPTH)
  })
})

describe('save', () => {
  it('round-trips a character', () => {
    const c = createCharacter('Bai')
    grantXp(c, 900)
    spendPoint(c, 'body')
    recordRun(c, { kills: 12, seconds: 60, insight: 3, depth: 1 })
    const back = parseCharacter(serialiseCharacter(c))
    expect(back).toEqual(c)
  })

  it('returns null for text that is not an object', () => {
    expect(parseCharacter('not json at all')).toBeNull()
    expect(parseCharacter('42')).toBeNull()
    expect(parseCharacter('null')).toBeNull()
  })

  it('repairs a save rather than discarding it', () => {
    // Dropping a whole save over one bad field would punish the player for a
    // bug that is ours. Everything coerces to something playable.
    const back = parseCharacter(
      JSON.stringify({
        name: '   ',
        level: 'seven',
        xp: -40,
        points: Number.NaN,
        spent: { body: '3', nonsense: 9 },
        depth: 999,
        runs: 2.7,
      }),
    )!
    expect(back.name).toBe('Wanderer')
    expect(back.level).toBe(1)
    expect(back.xp).toBe(0)
    // Zero, not the one a fresh character starts with: an unreadable field must
    // never mint currency, or a corrupt save becomes a way to farm points.
    expect(back.points).toBe(0)
    expect(back.spent.body).toBe(3)
    expect(back.spent.edge).toBe(0)
    expect(back).not.toHaveProperty('nonsense')
    expect(back.depth).toBe(MAX_DEPTH)
    expect(back.runs).toBe(2)
  })

  it('trims a name that would break the hub', () => {
    const back = parseCharacter(JSON.stringify({ name: 'x'.repeat(4000) }))!
    expect(back.name.length).toBeLessThanOrEqual(24)
  })

  it('never throws, whatever it is handed', () => {
    for (const raw of ['', '{', '[]', '"a"', '{"spent":7}', '{"spent":null}']) {
      expect(() => parseCharacter(raw)).not.toThrow()
    }
  })
})

/**
 * The honest risk of permanent progression, measured rather than assumed.
 *
 * Permanent power against a fixed difficulty curve eventually makes the opening
 * of every expedition a formality. This asserts the shape of the intended
 * answer: growth buys survival on the shallow road, and the deep road takes it
 * back. If a future tuning pass breaks that relationship, this fails.
 */
describe('depth holds permanent power in check', () => {
  const survive = (spent: Attributes, depth: number, seed = 90210): number => {
    const player = createPlayer(0, 0)
    const swarm = new Swarm(new Rng(seed), depth)
    const motes = new Motes()
    const bolts = new Bolts()
    const hazards = new Hazards()
    const rng = new Rng(seed ^ 0x5bf03635)
    const run = createRun()
    const stats = deriveStats(new Map(), spent)
    run.hp = stats.maxHp

    const ticks = Math.round(400 / TICK_S)
    for (let i = 0; i < ticks; i++) {
      if (run.over) break
      // The retreat headless runs show to be strongest — roughly what a player
      // who has understood the game does.
      const t = run.elapsed
      updatePlayer(player, Math.cos(t * 0.25) * 0.3, Math.sin(t * 0.25) * 0.3, TICK_S, stats.moveSpeed)
      swarm.update(player.x, player.y, run.elapsed, TICK_S, hazards)
      run.pendingLevelUps = 0
      updateCombat({ run, player, swarm, motes, bolts, hazards, stats, rng }, TICK_S)
    }
    return run.elapsed
  }

  const NOVICE = emptyAttributes()
  const ADEPT = attrs({ body: 10, edge: 10, swift: 8, spirit: 6 })

  it('makes the first road survivable for longer as the character grows', () => {
    expect(survive(ADEPT, 1)).toBeGreaterThan(survive(NOVICE, 1))
  })

  it('gives that growth somewhere to be spent', () => {
    // A deeper road must actually push back, or depth is a free reward
    // multiplier and the choice in the hub is not a choice.
    expect(survive(ADEPT, 5)).toBeLessThan(survive(ADEPT, 1))
  })

  it('still ends the expedition, however invested the character is', () => {
    // No build may run forever: an expedition that never resolves never pays,
    // and the whole meta loop stalls.
    expect(survive(attrs({ body: 40, edge: 40, swift: 30, spirit: 30 }), 1)).toBeLessThan(400)
  })
})
