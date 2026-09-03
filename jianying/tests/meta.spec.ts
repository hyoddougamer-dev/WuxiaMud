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
  settleFound,
  spendPoint,
  xpForCultivation,
} from '../src/meta/character'
import {
  MAX_DEPTH,
  REGIONS,
  clampDepth,
  depthHealthScale,
  depthReward,
  depthSpawnScale,
  regionAt,
} from '../src/data/regions'
import {
  LEVELS_PER_REALM,
  REALMS,
  isRealmAdvance,
  realmIndex,
  realmOf,
  realmStep,
} from '../src/meta/realms'
import { SCHOOLS, SCHOOL_BY_ID, applySchool, rollName } from '../src/meta/schools'
import {
  ROSTER_LIMIT,
  parseCharacter,
  parseRoster,
  serialiseCharacter,
  serialiseRoster,
} from '../src/meta/save'
import { BUILDS, DEFAULT_LOOK, SASHES, buildOf } from '../src/meta/look'
import { buildSwordsmanTopDown } from '../src/render/figure'
import { rankMarks, socketsAt } from '../src/render/rankMarks'
import { gearFromIds } from '../src/render/wardrobe'
import { portraitSvg } from '../src/render/silhouette'
import { createRun, updateCombat } from '../src/sim/combat'
import {
  DEFAULT_WEAPON,
  WEAPONS,
  WEAPON_BY_ID,
  singleTargetDps,
  sweptAreaPerSecond,
} from '../src/data/weapons'
import { BLADE_BY_ID } from '../src/render/wardrobe'
import {
  activeSeals,
  createSense,
  noConditions,
  senseConditions,
} from '../src/sim/conditions'
import {
  ARTS,
  CONDITIONS,
  EQUIPPED_ARTS,
  MAX_ART_LEVEL,
  NEW_EFFECTS,
  artScale,
  artsFor,
} from '../src/data/arts'
import { Swarm } from '../src/sim/enemies'
import { Hazards } from '../src/sim/hazards'
import {
  SPEED_CAP,
  deriveStats,
  emptyKit,
  wornAttributes,
  wornShape,
  type Kit,
  type Worn,
} from '../src/sim/loadout'
import { ITEMS, ITEM_BY_ID, SLOTS, dropChance, dropTable } from '../src/data/items'
import { rollAmount, type Affix } from '../src/data/affixes'
import type { Rarity } from '../src/data/rarity'
import {
  BAG_CAPACITY,
  acquire,
  carried,
  carriedInSlot,
  discard,
  emptyInventory,
  equip,
  equippedIn,
  mintUid,
  sanitise,
  type OwnedItem,
} from '../src/meta/inventory'
import { Motes } from '../src/sim/pickups'
import { Bolts } from '../src/sim/projectiles'
import { createPlayer, updatePlayer } from '../src/sim/player'

const attrs = (partial: Partial<Attributes>): Attributes => ({ ...emptyAttributes(), ...partial })

/** A Kit carrying only bought attributes — the default weapon, nothing worn. */
const kit = (spent: Attributes = emptyAttributes(), worn: Worn[] = []): Kit => ({
  spent,
  weapon: DEFAULT_WEAPON,
  worn,
})

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

  it('closes the loop on a first expedition — a level, and a point to spend', () => {
    // The opening level must arrive fast enough that a first-time player sees
    // the loop close — set out, die, gain, spend — inside one sitting. The
    // input here is a measured headless first expedition, not a guess.
    //
    // The bar is ONE level, not two. It was two while kills paid one for one,
    // and that was the inflation: the same measured run used to buy three
    // levels on the easiest road. One level plus visible progress on the next
    // bar is what closing the loop actually needs — see `rewardFor`.
    const c = createCharacter()
    const gain = grantXp(c, rewardFor({ kills: 96, seconds: 190, insight: 9, depth: 1 }).total)
    expect(gain.levelsGained).toBeGreaterThanOrEqual(1)
    expect(gain.pointsGained).toBeGreaterThanOrEqual(1)
  })

  it('never lets grinding the shallow road out-earn a real descent', () => {
    // The regression this guards is measured, not hypothetical. With kills paid
    // one for one, a 634-kill sweep of the safest region paid 744 XP — four
    // levels — while a 159-kill descent into the Ghost Market paid 562. The
    // easiest ground in the game was the fastest ladder, which makes every
    // deeper region decoration.
    const shallowGrind = rewardFor({ kills: 634, seconds: 222, insight: 5.5, depth: 1 })
    const realDescent = rewardFor({ kills: 159, seconds: 39, insight: 6, depth: 4 })
    expect(realDescent.total).toBeGreaterThan(shallowGrind.total)
  })

  it('pays a mid-game expedition around half a level, as the design claims', () => {
    // The doc note on xpForCultivation promises "roughly half a level" for a
    // strong deep run. It was six times that before kills went on a curve, and
    // nothing checked. Now something does.
    const c = createCharacter()
    c.level = 6
    const before = xpForCultivation(c.level)
    const strongDeepRun = rewardFor({ kills: 159, seconds: 39, insight: 6, depth: 4 }).total
    expect(strongDeepRun / before).toBeGreaterThan(0.25)
    expect(strongDeepRun / before).toBeLessThan(1)
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
    expect(regionAt(c.depth)).toBeTruthy()
  })
})

describe('expedition reward', () => {
  it('itemises into terms that add up', () => {
    // Kills are paid on a square root now — 5·√40 ≈ 32 — so the three rows on
    // the end screen still sum to the total the player is credited.
    const reward = rewardFor({ kills: 40, seconds: 120, insight: 5, depth: 1 })
    expect(reward.kills).toBe(32)
    expect(reward.time).toBe(20)
    expect(reward.insight).toBe(16)
    expect(reward.total).toBe(68)
  })

  it('pays the hundredth kill far less than the first', () => {
    // The property, stated directly rather than left implicit in a constant:
    // ten times the corpses must not mean ten times the cultivation, or the
    // rift's own kill counts turn into level inflation all over again.
    const few = rewardFor({ kills: 10, seconds: 0, insight: 1, depth: 1 }).total
    const many = rewardFor({ kills: 1000, seconds: 0, insight: 1, depth: 1 }).total
    expect(many).toBeGreaterThan(few)
    expect(many).toBeLessThan(few * 15)
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
    const grown = deriveStats(new Map(), kit(attrs({ body: 5, edge: 5, swift: 5 })))
    expect(grown.maxHp).toBeGreaterThan(base.maxHp)
    expect(grown.slashDamage).toBeGreaterThan(base.slashDamage)
    expect(grown.slashInterval).toBeLessThan(base.slashInterval)
  })

  it('keeps a technique blurb literally true whatever the character invested', () => {
    // "+12% sweep damage" must add twelve POINTS to the pool per level, on
    // every weapon and at every level of investment. It reads as a constant
    // absolute gain per weapon precisely because the pool is additive — which
    // is what stops the level-up screen quoting a shifting percentage.
    //
    // The card was flat damage until the pool existed, and the blurb was "+4
    // damage per sweep". That wording survived the change for about a minute
    // and this test is what caught it: the same card had started giving +3.6
    // on a zhanmadao and +1.3 on flying daggers.
    const keen = new Map([['keen', 3]])
    const expected = emptyKit().weapon.damage * 0.36
    for (const edge of [0, 4, 20]) {
      const without = deriveStats(new Map(), kit(attrs({ edge })))
      const with3 = deriveStats(keen, kit(attrs({ edge })))
      expect(with3.slashDamage - without.slashDamage).toBeCloseTo(expected, 9)
    }
  })

  it('never lets Swiftness reach a zero interval', () => {
    // Multiplicative decay approaches zero but cannot arrive, which is what
    // keeps the sweep from dividing the frame by nothing.
    const absurd = deriveStats(new Map(), kit(attrs({ swift: 500 })))
    expect(absurd.slashInterval).toBeGreaterThan(0)
    expect(absurd.slashInterval).toBeLessThan(DEFAULT_WEAPON.interval)
    expect(Number.isFinite(absurd.slashInterval)).toBe(true)
  })

  it('lets Spirit raise the arts without touching the sweep', () => {
    const loadout = new Map([
      ['orbit', 2],
      ['bolt', 2],
      ['nova', 2],
    ])
    const plain = deriveStats(loadout)
    const spirited = deriveStats(loadout, kit(attrs({ spirit: 6 })))
    expect(spirited.orbitDamage).toBeGreaterThan(plain.orbitDamage)
    expect(spirited.boltDamage).toBeGreaterThan(plain.boltDamage)
    expect(spirited.novaRadius).toBeGreaterThan(plain.novaRadius)
    expect(spirited.slashDamage).toBeCloseTo(DEFAULT_WEAPON.damage, 9)
  })

  it('produces finite stats for an empty and a maxed character alike', () => {
    for (const spent of [emptyAttributes(), attrs({ body: 80, edge: 80, swift: 80, spirit: 80 })]) {
      const stats = deriveStats(new Map([['keen', 6]]), kit(spent))
      // Every NUMBER, which is now not every field: `strike` is the one
      // discriminator on the block (see data/weapons.ts) and is a string. The
      // point of this test is that no arithmetic path produces a NaN, so it
      // checks the numbers and asserts the shape of what it skipped rather
      // than quietly widening to "anything goes".
      for (const [key, value] of Object.entries(stats)) {
        if (key === 'strike') {
          expect(value === 'sweep' || value === 'throw', key).toBe(true)
          continue
        }
        expect(Number.isFinite(value), key).toBe(true)
      }
    }
  })
})

describe('expedition depth', () => {
  it('names every road it can unlock', () => {
    expect(REGIONS.length).toBe(MAX_DEPTH)
    for (let d = 1; d <= MAX_DEPTH; d++) {
      expect(regionAt(d).name.trim().length).toBeGreaterThan(0)
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

describe('schools', () => {
  it('gives every school an id, a story and a real weapon', () => {
    expect(new Set(SCHOOLS.map((s) => s.id)).size).toBe(SCHOOLS.length)
    for (const school of SCHOOLS) {
      expect(school.blurb.trim().length).toBeGreaterThan(0)
      expect(SCHOOL_BY_ID.get(school.id)).toBe(school)
      expect(WEAPON_BY_ID.has(school.weaponId)).toBe(true)
    }
  })

  it('gives each school a different weapon', () => {
    // The whole point of the rewrite: a school that shared a weapon with
    // another would be a label, and the previous version of this screen was
    // rejected for exactly that.
    const weapons = SCHOOLS.map((s) => s.weaponId)
    expect(new Set(weapons).size).toBe(weapons.length)
  })

  it('hands over a kit this build can actually resolve', () => {
    for (const school of SCHOOLS) {
      for (const id of school.kit) expect(ITEM_BY_ID.has(id)).toBe(true)
      expect(ITEMS.some((i) => i.slot === 'weapon' && i.styleId === school.weaponId)).toBe(true)
    }
  })

  it('grants a comparable head start whichever is chosen', () => {
    // No school may be the obvious pick. They differ in shape, not in size.
    const totals = SCHOOLS.map((s) => Object.values(s.grants).reduce((a, b) => a + b, 0))
    expect(Math.max(...totals) - Math.min(...totals)).toBeLessThanOrEqual(1)
  })

  it('applies its grant onto the attribute spread', () => {
    const wanderer = SCHOOL_BY_ID.get('wanderer')!
    const spent = applySchool(wanderer, emptyAttributes())
    expect(spent.swift).toBe(wanderer.grants.swift)
    expect(spent.body).toBe(0)
    // The source spread is not mutated — creation applies this to a fresh
    // character, and a shared mutable default would leak between them.
    expect(emptyAttributes().spirit).toBe(0)
  })

  it('stays small enough that it colours a build without deciding one', () => {
    // Three or four points is swamped by level five. A school that locked a
    // build would be a trap laid on the screen where the player knows least.
    for (const school of SCHOOLS) {
      const total = Object.values(school.grants).reduce((a, b) => a + b, 0)
      expect(total).toBeLessThanOrEqual(4)
    }
  })

  it('rolls a name that is two plausible words', () => {
    const rng = new Rng(77)
    for (let i = 0; i < 200; i++) {
      const name = rollName(() => rng.next())
      expect(name.split(' ').length).toBe(2)
      expect(name.length).toBeLessThanOrEqual(24)
    }
  })
})

describe('weapons', () => {
  it('gives every weapon a distinct id, blade and blurb', () => {
    expect(new Set(WEAPONS.map((w) => w.id)).size).toBe(WEAPONS.length)
    expect(new Set(WEAPONS.map((w) => w.bladeId)).size).toBe(WEAPONS.length)
    for (const weapon of WEAPONS) {
      expect(BLADE_BY_ID.has(weapon.bladeId)).toBe(true)
      expect(weapon.blurb.trim().length).toBeGreaterThan(0)
    }
  })

  it('lets no weapon lead on both output and coverage', () => {
    // The one property that keeps six weapons being six choices rather than a
    // damage ladder with one right answer. A weapon ahead on single-target DPS
    // must give up swept area, and vice versa.
    for (const a of WEAPONS) {
      for (const b of WEAPONS) {
        if (a === b) continue
        const dominates =
          singleTargetDps(a) > singleTargetDps(b) * 1.02 &&
          sweptAreaPerSecond(a) > sweptAreaPerSecond(b) * 1.02
        expect(dominates, `${a.name} dominates ${b.name}`).toBe(false)
      }
    }
  })

  it('keeps single-target output within a band', () => {
    // Shape is meant to be the difference, not raw numbers. A weapon at double
    // another's DPS would be the answer regardless of how it felt.
    const dps = WEAPONS.map(singleTargetDps)
    expect(Math.max(...dps) / Math.min(...dps)).toBeLessThan(1.6)
  })

  it('never lets an arc close a full circle', () => {
    // At PI the sweep can no longer miss, and "which way am I facing" would
    // silently stop mattering — which is most of what the game asks.
    for (const weapon of WEAPONS) {
      expect(weapon.halfAngle).toBeLessThan(Math.PI)
      expect(weapon.halfAngle).toBeGreaterThan(0)
    }
  })

  it('fells the opening enemy quickly on every weapon a school can start with', () => {
    // The lesson the old constants left behind: a starting weapon that cannot
    // clear the starting enemy is not a difficulty curve, it is a wall.
    //
    // Stated as TIME rather than as one sweep, which is what the first version
    // of this test got wrong: a fast short weapon needing two blows can still
    // beat a slow one needing a single swing. Blows are not the unit the
    // player feels; seconds are.
    //
    // THE BAR IS PER CLASS NOW, and it has to be. The zhanmadao's whole
    // premise is that it is slow — a bar it could pass would be a bar that
    // says the slow class must not be slow. What matters is that neither
    // class leaves a new player swinging at the first bandit for an
    // uncomfortable time, and "uncomfortable" is a different number when one
    // blow also threatens seven other bodies.
    const bandit = 10
    const CEILING: Record<string, number> = { sweep: 1.1, throw: 0.7 }
    for (const school of SCHOOLS) {
      const weapon = WEAPON_BY_ID.get(school.weaponId)!
      const stats = deriveStats(new Map(), { spent: emptyAttributes(), weapon, worn: [] })
      // A volley puts every blade on a single body only when they all connect;
      // against the opening bandit, on open ground, one does.
      const perBlow = stats.slashDamage
      const blows = Math.ceil(bandit / perBlow)
      const ttk = blows * stats.slashInterval
      expect(ttk, `${weapon.name} takes ${ttk.toFixed(2)}s`).toBeLessThanOrEqual(
        CEILING[weapon.strike]!,
      )
    }
  })

  it('drives the attack through deriveStats, and carries the class with it', () => {
    const great = WEAPON_BY_ID.get('great')!
    const feidao = WEAPON_BY_ID.get('feidao')!
    const withGreat = deriveStats(new Map(), { spent: emptyAttributes(), weapon: great, worn: [] })
    const withDaggers = deriveStats(new Map(), { spent: emptyAttributes(), weapon: feidao, worn: [] })

    // The one branch the simulation makes has to survive the derivation, or
    // the thrower silently swings an invisible arc. See Stats.strike.
    expect(withGreat.strike).toBe('sweep')
    expect(withDaggers.strike).toBe('throw')
    expect(withDaggers.throwCount).toBeGreaterThan(1)
    expect(withGreat.throwCount).toBe(1)

    // Distance against coverage — the two ends of the game. The daggers reach
    // more than twice as far; the zhanmadao threatens a wedge an order of
    // magnitude wider than the volley's spread.
    expect(withDaggers.slashRange).toBeGreaterThan(withGreat.slashRange * 2)
    expect(withGreat.slashHalfAngle).toBeGreaterThan(withDaggers.slashHalfAngle * 4)
  })
})

describe('the item table, as bases', () => {
  it('gives every base a unique id', () => {
    const ids = ITEMS.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every base a wardrobe style, so nothing is invisible', () => {
    // The figures have no interior detail, so a piece that does not alter the
    // outline cannot be seen at all. Every base points at a silhouette.
    for (const item of ITEMS) expect(item.styleId).toBeTruthy()
  })

  it('never puts two bases of one slot on the same silhouette', () => {
    const bySlot = new Map<string, Set<string>>()
    for (const item of ITEMS) {
      const seen = bySlot.get(item.slot) ?? new Set<string>()
      expect(seen.has(item.styleId), `${item.slot}/${item.styleId}`).toBe(false)
      seen.add(item.styleId)
      bySlot.set(item.slot, seen)
    }
  })

  it('opens the shallowest ground with something for every slot', () => {
    // A first expedition that cannot drop a hat has a dead slot in its bag.
    for (const slot of SLOTS) {
      expect(dropTable(1).some((i) => i.slot === slot), slot).toBe(true)
    }
  })

  it('widens the table as the ground gets deeper, never narrows it', () => {
    for (let depth = 2; depth <= MAX_DEPTH; depth++) {
      expect(dropTable(depth).length).toBeGreaterThanOrEqual(dropTable(depth - 1).length)
    }
  })

  it('pays a long expedition a handful of finds, not a bagful', () => {
    // REPLACED, not retuned, because its premise died. This test used to
    // assert the rate was HIGH — "loot can BE the in-run progression" — which
    // was true while a find better than what you carried went on where it fell.
    // A playtest reversed that: nothing is worn during a run any more (see the
    // pickup handler in main.ts), so a find is once again read on the way out,
    // and the quantity that made a mid-run swap likely just fills the end
    // screen with grey.
    //
    // The bounds below are the two failures that actually matter, one on each
    // side. Under three on the longest run and an expedition can end with
    // nothing to look at; over six and the pack (24) fills in four runs and the
    // end screen becomes a list nobody reads.
    const longRun = dropChance(1) * 264 // The Post Road, measured by runLength.mts
    expect(longRun).toBeGreaterThan(3)
    expect(longRun).toBeLessThan(6)
  })

  it('never lets deeper ground pay worse per kill than shallow ground', () => {
    // The tilt has been retuned twice. Both times the shape had to survive:
    // deeper is a better place to hunt, or choosing it is a punishment.
    for (let depth = 2; depth <= MAX_DEPTH; depth++) {
      expect(dropChance(depth), `depth ${depth}`).toBeGreaterThan(dropChance(depth - 1))
    }
  })
})

describe('the pack', () => {
  const roll = (baseId: string, rarity: Rarity = 0, depth = 1): OwnedItem => ({
    uid: mintUid(baseId),
    baseId,
    rarity,
    affixes: [{ kind: 'body', amount: rollAmount('body', depth, 0.5) }],
    power: null,
    depth,
  })

  it('holds two copies of one base as two different pieces', () => {
    // The point of the whole rework. The old bag collapsed them into one row,
    // which is why a second Hemp Robe used to be worth nothing.
    const inv = emptyInventory()
    expect(acquire(inv, roll('r-plain'))).toBe('kept')
    expect(acquire(inv, roll('r-plain'))).toBe('kept')
    expect(inv.owned).toHaveLength(2)
    expect(inv.owned[0]!.uid).not.toBe(inv.owned[1]!.uid)
  })

  it('refuses a find when the pack is full, rather than eating it', () => {
    const inv = emptyInventory()
    for (let i = 0; i < BAG_CAPACITY; i++) expect(acquire(inv, roll('r-plain'))).toBe('kept')
    expect(acquire(inv, roll('r-plain'))).toBe('full')
  })

  it('does not count worn pieces against the pack', () => {
    // A player who fills the bag and then cannot equip anything, because the
    // piece they want to take off has nowhere to go, is fighting the interface.
    const inv = emptyInventory()
    const first = roll('r-plain')
    acquire(inv, first)
    equip(inv, first.uid)
    for (let i = 0; i < BAG_CAPACITY; i++) acquire(inv, roll('r-plain'))
    expect(carried(inv)).toHaveLength(BAG_CAPACITY)
    expect(inv.owned).toHaveLength(BAG_CAPACITY + 1)
  })

  it('equips by instance, so one copy can be worn and the other kept', () => {
    const inv = emptyInventory()
    const a = roll('r-plain')
    const b = roll('r-plain')
    acquire(inv, a)
    acquire(inv, b)
    expect(equip(inv, b.uid)).toBe(true)
    expect(equippedIn(inv, 'robe')!.uid).toBe(b.uid)
    expect(carried(inv).map((e) => e.uid)).toEqual([a.uid])
  })

  it('refuses to throw away something being worn', () => {
    const inv = emptyInventory()
    const a = roll('r-plain')
    acquire(inv, a)
    equip(inv, a.uid)
    expect(discard(inv, a.uid)).toBe(false)
    expect(inv.owned).toHaveLength(1)
  })

  it('throws away a carried piece for good', () => {
    const inv = emptyInventory()
    const a = roll('r-plain')
    acquire(inv, a)
    expect(discard(inv, a.uid)).toBe(true)
    expect(inv.owned).toHaveLength(0)
  })

  it('sorts a slot best rung first', () => {
    const inv = emptyInventory()
    acquire(inv, roll('r-plain', 0))
    acquire(inv, roll('r-travelling', 3))
    acquire(inv, roll('r-plain', 1))
    expect(carriedInSlot(inv, 'robe').map((e) => e.rarity)).toEqual([3, 1, 0])
  })

  it('drops a piece whose base this build no longer knows', () => {
    const inv = emptyInventory()
    acquire(inv, roll('r-plain'))
    acquire(inv, roll('no-such-base'))
    expect(sanitise(inv).owned).toHaveLength(1)
  })

  it('unequips a slot pointing at a uid that is not in the bag', () => {
    // Equipped-but-not-owned is not a state the game can produce, but a
    // hand-edited save can, and honouring it would be a free item.
    const inv = emptyInventory()
    const a = roll('r-plain')
    acquire(inv, a)
    inv.equipped.robe = 'ghost#1'
    expect(sanitise(inv).equipped.robe).toBeUndefined()
  })

  it('mints a fresh uid per instance rather than reusing the base id', () => {
    expect(mintUid('r-plain')).not.toBe(mintUid('r-plain'))
  })
})

describe('the v1 -> v2 migration', () => {
  // These are the tests that protect a save somebody actually played for. The
  // shape changed twice at once — ownership became instances, and the file
  // became a roster — precisely so it would only ever change once.

  it('reads a v1 file, which was the bare character with bare item ids', () => {
    const c = createCharacter('Bai', 'wanderer')
    grantXp(c, 900)

    // Exactly what a v1 build wrote: the character, with owned as bare ids.
    const v1 = JSON.stringify({
      ...c,
      inventory: { owned: ['r-plain', 'w-great'], equipped: { robe: 'r-plain' } },
    })

    const roster = parseRoster(v1)!
    expect(roster.swordsmen).toHaveLength(1)
    expect(roster.active).toBe(0)
    const back = roster.swordsmen[0]!
    expect(back.name).toBe('Bai')
    expect(back.level).toBe(c.level)
    // Every piece survives, as a rolled instance carrying one line — a bare id
    // described a piece whose line came from a table that no longer holds one.
    expect(back.inventory.owned.map((e) => e.baseId).sort()).toEqual(['r-plain', 'w-great'])
    expect(back.inventory.owned.every((e) => e.affixes.length === 1)).toBe(true)
    // The equipped slot pointed at a BASE id; it must come forward pointing at
    // the instance that base became, or the swordsman loads undressed.
    const robe = back.inventory.owned.find((e) => e.baseId === 'r-plain')!
    expect(back.inventory.equipped.robe).toBe(robe.uid)
  })

  it('carries a v2 rank forward as a bigger line, not a lost one', () => {
    // The promise those ranks made to the player who earned them: a rank 4 robe
    // stays a better robe than a rank 0 one across the migration.
    const c = createCharacter('Bai', 'wanderer')
    const withRank = (rank: number): number => {
      const raw = JSON.stringify({
        ...c,
        inventory: { owned: [{ id: 'r-plain', rank, rites: [] }], equipped: {} },
      })
      return parseCharacter(raw)!.inventory.owned[0]!.affixes[0]!.amount
    }
    expect(withRank(4)).toBeGreaterThan(withRank(0))
  })

  it('round-trips a v2 roster', () => {
    const a = createCharacter('Bai', 'wanderer')
    const b = createCharacter('Qin', 'garrison')
    const robe: OwnedItem = {
      uid: mintUid('r-plain'),
      baseId: 'r-plain',
      rarity: 3,
      affixes: [{ kind: 'body', amount: 9 }],
      power: null,
      depth: 4,
    }
    const spear: OwnedItem = {
      uid: mintUid('w-feidao'),
      baseId: 'w-feidao',
      rarity: 4,
      affixes: [{ kind: 'edge', amount: 12 }],
      power: 'frost',
      depth: 5,
    }
    acquire(a.inventory, robe)
    equip(a.inventory, robe.uid)
    acquire(b.inventory, spear)
    grantXp(b, 4000)

    const back = parseRoster(serialiseRoster({ active: 1, swordsmen: [a, b] }))!
    expect(back.swordsmen.map((s) => s.name)).toEqual(['Bai', 'Qin'])
    expect(back.active).toBe(1)
    // The rolled instance survives whole: rung, lines and named power. Losing
    // any of the three would silently change a piece the player earned.
    const backRobe = back.swordsmen[0]!.inventory.owned[0]!
    expect(backRobe.rarity).toBe(3)
    expect(backRobe.affixes).toEqual([{ kind: 'body', amount: 9 }])
    expect(back.swordsmen[0]!.inventory.equipped.robe).toBe(backRobe.uid)
    const backSpear = back.swordsmen[1]!.inventory.owned[0]!
    expect(backSpear.rarity).toBe(4)
    expect(backSpear.power).toBe('frost')
    expect(back.swordsmen[1]!.level).toBe(b.level)
  })

  it('pulls an out-of-range active index back into the roster', () => {
    // A hand-edited or truncated file must not index past the end and leave the
    // hub with nothing to draw.
    const c = createCharacter('Bai', 'wanderer')
    const back = parseRoster(JSON.stringify({ v: 2, active: 9, swordsmen: [c] }))!
    expect(back.active).toBe(0)
  })

  it('refuses a roster that parsed to nothing rather than returning an empty one', () => {
    // The caller lands on character creation when this returns null. Returning
    // { swordsmen: [] } would instead crash the hub on its first render.
    expect(parseRoster(JSON.stringify({ v: 2, active: 0, swordsmen: [] }))).toBeNull()
    expect(parseRoster('not json')).toBeNull()
    expect(parseRoster('null')).toBeNull()
  })

  it('never keeps more swordsmen than the roster allows', () => {
    const many = Array.from({ length: ROSTER_LIMIT + 4 }, (_, i) =>
      createCharacter(`Bai ${i}`, 'wanderer'),
    )
    const back = parseRoster(serialiseRoster({ active: 0, swordsmen: many }))!
    expect(back.swordsmen).toHaveLength(ROSTER_LIMIT)
  })

  it('survives whatever nonsense is in the swordsmen array', () => {
    for (const raw of ['{"v":2,"swordsmen":[null,3,"x"]}', '{"v":2,"swordsmen":{}}']) {
      expect(() => parseRoster(raw)).not.toThrow()
    }
  })
})

describe('what a piece grants', () => {
  const wearing = (affixes: Affix[]): OwnedItem => ({
    uid: mintUid('r-plain'),
    baseId: 'r-plain',
    rarity: 2,
    affixes,
    power: null,
    depth: 1,
  })

  it('adds its attribute lines into the same currency as bought points', () => {
    // An item point and a spent point must be worth exactly the same thing,
    // including reaching the same diminishing return.
    const worn = wearing([
      { kind: 'body', amount: 5 },
      { kind: 'edge', amount: 3 },
    ])
    const attrs = wornAttributes([worn])
    expect(attrs.body).toBe(5)
    expect(attrs.edge).toBe(3)
    expect(attrs.swift).toBe(0)
  })

  it('sums the same kind across several worn pieces', () => {
    const attrs = wornAttributes([
      wearing([{ kind: 'body', amount: 4 }]),
      wearing([{ kind: 'body', amount: 6 }]),
    ])
    expect(attrs.body).toBe(10)
  })

  it('keeps the sweep-shape lines out of the attributes', () => {
    const worn = wearing([
      { kind: 'reach', amount: 10 },
      { kind: 'haste', amount: 5 },
      { kind: 'vigour', amount: 20 },
    ])
    const attrs = wornAttributes([worn])
    expect(attrs.body + attrs.edge + attrs.swift + attrs.spirit).toBe(0)
    const shape = wornShape([worn])
    expect(shape.reach).toBeCloseTo(0.1)
    // Points into the Speed pool now, not a fraction off the interval.
    expect(shape.speed).toBeCloseTo(5)
    expect(shape.vigour).toBe(20)
  })

  it('lengthens the sweep and quickens it, through deriveStats', () => {
    const bare = deriveStats(new Map(), emptyKit())
    const kitted = deriveStats(new Map(), {
      ...emptyKit(),
      worn: [wearing([{ kind: 'reach', amount: 20 }, { kind: 'haste', amount: 20 }])],
    })
    expect(kitted.slashRange).toBeGreaterThan(bare.slashRange)
    expect(kitted.slashInterval).toBeLessThan(bare.slashInterval)
  })

  it('stays finite and positive under an absurd pile of gear', () => {
    // A save can carry more than the game will ever hand out, and NaN reaching
    // the simulation is a black screen on a phone.
    const absurd = Array.from({ length: 40 }, () =>
      wearing([
        { kind: 'body', amount: 999 },
        { kind: 'reach', amount: 999 },
        { kind: 'haste', amount: 999 },
        { kind: 'vigour', amount: 999 },
      ]),
    )
    const stats = deriveStats(new Map(), { ...emptyKit(), worn: absurd })
    for (const value of Object.values(stats)) {
      if (typeof value !== 'number') continue
      expect(Number.isFinite(value)).toBe(true)
    }
    expect(stats.slashInterval).toBeGreaterThan(0)
    expect(stats.maxHp).toBeGreaterThan(0)
  })

  it('caps the shape lines so a bag of one kind cannot delete the weapon', () => {
    // Reach is still clamped where it is gathered. Speed is not: its ceiling
    // moved to where the pool is SPENT, so gear and attributes share one cap
    // instead of each having a private one the other could sail past. The
    // clamp is checked through deriveStats below, which is where it now lives.
    const many = Array.from({ length: 12 }, () => wearing([{ kind: 'reach', amount: 40 }]))
    expect(wornShape(many).reach).toBeLessThanOrEqual(1.5)

    const fast = Array.from({ length: 12 }, () => wearing([{ kind: 'haste', amount: 20 }]))
    const stats = deriveStats(new Map(), { ...emptyKit(), worn: fast })
    const floor = emptyKit().weapon.interval / (1 + SPEED_CAP / 100)
    expect(stats.slashInterval).toBeGreaterThanOrEqual(floor - 1e-9)
  })
})


describe('the five conditions', () => {
  const step = (
    sense: ReturnType<typeof createSense>,
    over: Partial<Parameters<typeof senseConditions>[1]>,
    seconds: number,
    dt = TICK_S,
  ) => {
    const input = {
      speed: 0,
      maxSpeed: 200,
      moveX: 0,
      moveY: 0,
      nearby: 0,
      hp: 100,
      maxHp: 100,
      ...over,
    }
    for (let t = 0; t < seconds; t += dt) senseConditions(sense, input, dt)
    return sense.active
  }

  it('holds nothing at the first frame', () => {
    // A condition that fires instantly would trip while dodging, and the player
    // would never learn what caused it.
    const sense = createSense()
    expect(step(sense, {}, TICK_S)).toEqual(noConditions())
  })

  it('wants the posture held before it counts', () => {
    const a = createSense()
    expect(step(a, { speed: 0 }, 0.3).still).toBe(false)
    expect(step(a, { speed: 0 }, 0.5).still).toBe(true)

    const b = createSense()
    expect(step(b, { speed: 200, moveX: 1 }, 0.5).running).toBe(false)
    expect(step(b, { speed: 200, moveX: 1 }, 0.7).running).toBe(true)
  })

  it('never holds two postures at once', () => {
    // The guard against the whole system rotting into "everything fires always",
    // which is passive with extra steps.
    const sense = createSense()
    const rng = new Rng(9)
    for (let i = 0; i < 4000; i++) {
      const speed = rng.next() * 220
      const angle = rng.next() * Math.PI * 2
      const moving = speed > 4
      senseConditions(
        sense,
        {
          speed,
          maxSpeed: 200,
          moveX: moving ? Math.cos(angle) : 0,
          moveY: moving ? Math.sin(angle) : 0,
          nearby: Math.floor(rng.next() * 9),
          hp: rng.next() * 100,
          maxHp: 100,
        },
        TICK_S,
      )
      const postures = [sense.active.still, sense.active.running, sense.active.turn]
      expect(postures.filter(Boolean).length).toBeLessThanOrEqual(1)
    }
  })

  it('reads a reversal of TRAVEL, not of facing', () => {
    // Facing persists while standing still, so a player who stops and starts
    // would otherwise read as having turned without having moved.
    const sense = createSense()
    step(sense, { speed: 200, moveX: 1, moveY: 0 }, 0.4)
    expect(sense.active.turn).toBe(false)
    senseConditions(
      sense,
      { speed: 200, maxSpeed: 200, moveX: -1, moveY: 0, nearby: 0, hp: 100, maxHp: 100 },
      TICK_S,
    )
    expect(sense.active.turn).toBe(true)
  })

  it('ignores a gentle change of course', () => {
    // Only a reversal past 120° counts. Steering around a rock is not a turn.
    const sense = createSense()
    step(sense, { speed: 200, moveX: 1, moveY: 0 }, 0.4)
    const a = Math.PI / 4
    senseConditions(
      sense,
      {
        speed: 200,
        maxSpeed: 200,
        moveX: Math.cos(a),
        moveY: Math.sin(a),
        nearby: 0,
        hp: 100,
        maxHp: 100,
      },
      TICK_S,
    )
    expect(sense.active.turn).toBe(false)
  })

  it('lets a turn fade rather than latch', () => {
    const sense = createSense()
    step(sense, { speed: 200, moveX: 1 }, 0.4)
    step(sense, { speed: 200, moveX: -1 }, TICK_S)
    expect(sense.active.turn).toBe(true)
    step(sense, { speed: 200, moveX: -1 }, 1.2)
    expect(sense.active.turn).toBe(false)
  })

  it('treats being surrounded and being in peril as situations, not postures', () => {
    // These two are things that happen TO you, so they may overlap a posture.
    // An art on one of them is a safety net rather than a plan.
    const sense = createSense()
    const active = step(sense, { speed: 0, nearby: 6, hp: 20, maxHp: 100 }, 0.8)
    expect(active.still).toBe(true)
    expect(active.surrounded).toBe(true)
    expect(active.peril).toBe(true)
  })

  it('does not call a crowd of four surrounded, nor a third of health safe', () => {
    const sense = createSense()
    expect(step(sense, { nearby: 4, hp: 31, maxHp: 100 }, 0.1).surrounded).toBe(false)
    expect(sense.active.peril).toBe(false)
    expect(step(createSense(), { nearby: 5, hp: 30, maxHp: 100 }, 0.1)).toMatchObject({
      surrounded: true,
      peril: true,
    })
  })

  it('survives a maxHp of zero rather than reporting NaN peril', () => {
    const active = step(createSense(), { hp: 0, maxHp: 0 }, 0.1)
    expect(active.peril).toBe(false)
  })

  it('names what holds, in a stable order', () => {
    const sense = createSense()
    step(sense, { speed: 0, nearby: 7, hp: 10, maxHp: 100 }, 0.8)
    expect(activeSeals(sense.active)).toEqual(['still', 'surrounded', 'peril'])
  })
})

describe('arts', () => {
  // The data layer only — nothing here acts on the simulation yet, and these
  // tests exist so that stays true by construction rather than by memory.

  it('gives every weapon its own scroll of five', () => {
    // "Your class is the weapon in hand" is only true if the weapon changes
    // what you can DO. A weapon with no scroll is a weapon with no class.
    for (const weapon of WEAPONS) {
      expect(artsFor(weapon.id)).toHaveLength(5)
    }
    expect(ARTS).toHaveLength(WEAPONS.length * 5)
  })

  it('covers every condition exactly once per weapon', () => {
    // No weapon may have a dead condition. A player who changes weapon keeps
    // the same five things to do while everything they produce changes, and
    // that is the whole reason six classes cost one control scheme.
    for (const weapon of WEAPONS) {
      const used = artsFor(weapon.id).map((a) => a.condition).sort()
      expect(used).toEqual(CONDITIONS.map((c) => c.id).sort())
    }
  })

  it('has unique ids and seals within a scroll', () => {
    expect(new Set(ARTS.map((a) => a.id)).size).toBe(ARTS.length)
    for (const weapon of WEAPONS) {
      const seals = artsFor(weapon.id).map((a) => a.seal)
      expect(new Set(seals).size).toBe(seals.length)
    }
  })

  it('names a weapon that exists', () => {
    // A scroll pointing at a weapon style the wardrobe does not have would be
    // five arts nobody can ever equip.
    const styles = new Set(WEAPONS.map((w) => w.id))
    for (const art of ARTS) expect(styles.has(art.weapon)).toBe(true)
  })

  it('says something in the player’s own terms', () => {
    for (const art of ARTS) {
      expect(art.blurb.length).toBeGreaterThan(20)
      // The card is one line on a phone. Anything longer wraps to three.
      expect(art.blurb.length).toBeLessThan(75)
    }
  })

  it('keeps the new simulation work small and visible', () => {
    // Six new features is the honest cost of this scroll; the guard is here so
    // that adding a seventh is a decision rather than an accident.
    expect(NEW_EFFECTS).toHaveLength(6)
    const newOnes = ARTS.filter((a) => NEW_EFFECTS.includes(a.effect))
    expect(newOnes.length).toBeLessThanOrEqual(ARTS.length / 2)
  })

  it('is worth something at grade zero, and more at five', () => {
    // An art that reads as nothing until levelled is an art nobody equips.
    expect(artScale(0)).toBe(1)
    expect(artScale(MAX_ART_LEVEL)).toBeGreaterThan(artScale(0))
    let previous = 0
    for (let level = 0; level <= MAX_ART_LEVEL; level++) {
      const value = artScale(level)
      expect(value).toBeGreaterThan(previous)
      previous = value
    }
    expect(artScale(99)).toBe(artScale(MAX_ART_LEVEL))
  })

  it('cannot carry more arts than a scroll holds', () => {
    expect(EQUIPPED_ARTS).toBeLessThan(5)
  })
})

describe('the ladder, worn', () => {
  // The ladder has to be visible on the SWORDSMAN, not only on a card — the one
  // place a player is not looking while deciding what to put on. These marks
  // used to read `rank`; they read `rarity` now, over the same 0..5 domain,
  // which is why the render side needed no change at all.
  it('leaves the bottom rungs unmarked', () => {
    expect(socketsAt(0)).toBe(0)
    expect(socketsAt(1)).toBe(0)
  })

  it('marks a better rung more loudly than a worse one', () => {
    for (let rung = 1; rung <= 5; rung++) {
      expect(socketsAt(rung)).toBeGreaterThanOrEqual(socketsAt(rung - 1))
    }
    expect(socketsAt(5)).toBeGreaterThan(socketsAt(2))
  })

  it('draws something on the figure for a good piece, and nothing for a plain one', () => {
    const figure = buildSwordsmanTopDown(1, 1, gearFromIds({}))
    expect(rankMarks('robe', 0, figure)).toHaveLength(0)
    expect(rankMarks('robe', 5, figure).length).toBeGreaterThan(0)
  })
})


describe('save', () => {
  it('round-trips a character', () => {
    const c = createCharacter('Bai', 'wanderer')
    // Creation hands over the school's kit, so a real character always owns
    // something. An empty inventory means "written before equipment existed",
    // which parsing deliberately repairs — see the migration test below.
    for (const baseId of ['r-plain', 's-wide', 'h-crown', 'w-feidao']) {
      const entry: OwnedItem = {
        uid: mintUid(baseId),
        baseId,
        rarity: 1,
        affixes: [{ kind: 'body', amount: 4 }],
        power: null,
        depth: 1,
      }
      acquire(c.inventory, entry)
      equip(c.inventory, entry.uid)
    }
    grantXp(c, 900)
    spendPoint(c, 'body')
    recordRun(c, { kills: 12, seconds: 60, insight: 3, depth: 1 })
    // Set here because the real game sets it in the same step that records the
    // run; see the migration test below for why parsing infers it.
    c.taught = true
    const back = parseCharacter(serialiseCharacter(c))
    expect(back).toEqual(c)
  })

  it('hands a pre-equipment save its school kit rather than nothing', () => {
    // The migration that matters most here: a character already on someone's
    // phone was written before equipment existed. Opening the hub to a naked
    // swordsman with no weapon would look exactly like their progress had been
    // eaten.
    const back = parseCharacter(
      JSON.stringify({ name: 'Lu', origin: 'garrison', level: 6, runs: 4 }),
    )!
    expect(back.inventory.owned.length).toBeGreaterThan(0)
    expect(back.inventory.equipped.weapon).toBeDefined()
    // `equipped` points at an INSTANCE uid now, not at a base id, so the base
    // is reached through the row rather than looked up directly.
    const wornWeapon = back.inventory.owned.find((e) => e.uid === back.inventory.equipped.weapon)!
    const weapon = ITEM_BY_ID.get(wornWeapon.baseId)!
    // And the weapon it hands over is the one their school actually uses.
    expect(weapon.styleId).toBe(SCHOOL_BY_ID.get('garrison')!.weaponId)
  })

  it('does not hand a tutorial to a save that predates the field', () => {
    // The migration that matters: a character already on someone's phone was
    // written before `taught` existed. Defaulting it to false would greet a
    // veteran with "drag anywhere to move" on their next expedition.
    const back = parseCharacter(JSON.stringify({ name: 'Lu', level: 6, runs: 4 }))!
    expect(back.taught).toBe(true)
  })

  it('does teach a save that has never finished an expedition', () => {
    const back = parseCharacter(JSON.stringify({ name: 'Lu', level: 1, runs: 0 }))!
    expect(back.taught).toBe(false)
  })

  it('falls back when the stored origin is not one this build knows', () => {
    const back = parseCharacter(JSON.stringify({ origin: 'a-school-from-the-future' }))!
    expect(SCHOOL_BY_ID.has(back.origin)).toBe(true)
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
    const swarm = new Swarm(new Rng(seed), regionAt(depth))
    const motes = new Motes()
    const bolts = new Bolts()
    const hazards = new Hazards()
    const rng = new Rng(seed ^ 0x5bf03635)
    const run = createRun()
    const stats = deriveStats(new Map(), kit(spent))
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

describe('appearance', () => {
  it('survives a save round-trip', () => {
    const c = createCharacter('Bai', 'wanderer', { seed: 4242, build: 2, sash: 3, bearing: 1, pigment: 2 })
    expect(parseCharacter(serialiseCharacter(c))!.look).toEqual(c.look)
  })

  it('gives a save written before appearance existed a usable default', () => {
    // A character already on someone's phone has no `look` at all. Leaving it
    // undefined would reach the figure builder as NaN widths, which does not
    // throw — it silently draws nothing, and an invisible player character is
    // the worst failure this field could cause.
    const back = parseCharacter(JSON.stringify({ name: 'Lu', level: 6, runs: 4 }))!
    expect(back.look).toEqual(DEFAULT_LOOK)
    expect(Number.isFinite(buildOf(back.look).width)).toBe(true)
  })

  it('clamps indices that no longer exist to something drawable', () => {
    const back = parseCharacter(
      JSON.stringify({ look: { seed: Number.NaN, build: 99, sash: -4 } }),
    )!
    expect(BUILDS[back.look.build]).toBeDefined()
    expect(SASHES[back.look.sash]).toBeDefined()
    expect(Number.isFinite(back.look.seed)).toBe(true)
    expect(back.look.seed).toBeGreaterThan(0)
  })

  it('changes the silhouette rather than only the label', () => {
    // A build option that does not alter the geometry is a menu entry with no
    // consequence, which is precisely what the first creation screen was.
    const gear = gearFromIds({})
    const wide = (b: number): number => {
      const figure = buildSwordsmanTopDown(7, 1, gear, b)
      let max = 0
      for (const stroke of figure.body) {
        for (let i = 0; i < stroke.poly.length; i += 2) max = Math.max(max, Math.abs(stroke.poly[i]!))
      }
      return max
    }
    expect(wide(BUILDS[2]!.width)).toBeGreaterThan(wide(BUILDS[0]!.width) * 1.15)
    // Height must not move: it decides how the camera frames the figure, so
    // scaling it would be a simulation change wearing a cosmetic costume.
    expect(buildSwordsmanTopDown(7, 1, gear, 1.4).height).toBe(
      buildSwordsmanTopDown(7, 1, gear, 0.8).height,
    )
  })

  it('draws the two classes as two different bodies, not one body twice', () => {
    // The report this exists for: the weapon portraits were "a mesma
    // personagem seis vezes, com um traço diferente ao lado". Every one of them
    // passed the test below — the SVG strings differed, because the blade
    // differed — while the swordsman holding it was byte-identical. So string
    // inequality is not the bar. The bar is that the BODY differs, measured
    // where a player actually looks.
    //
    // `buildSwordsmanTopDown` excludes the held blade by construction (the
    // renderer rotates that separately), so everything measured here is the
    // figure itself.
    const widest = (blade: string, lo: number, hi: number): number => {
      const figure = buildSwordsmanTopDown(7, 1, gearFromIds({ blade }))
      let max = 0
      for (const stroke of figure.body) {
        for (let i = 0; i < stroke.poly.length; i += 2) {
          const y = stroke.poly[i + 1]!
          if (y >= lo && y <= hi) max = Math.max(max, Math.abs(stroke.poly[i]!))
        }
      }
      return max
    }
    // Shoulders: the zhanmadao is braced, the daggers are not.
    const shoulderBand = [-34, -26] as const
    expect(widest('great', ...shoulderBand)).toBeGreaterThan(
      widest('feidao', ...shoulderBand) * 1.15,
    )
    // Hip: and the other way round, because the thrower wears their blades
    // there. Two silhouettes that merely DIFFER are not enough at forty pixels
    // — they have to differ in opposite directions, and this is the assertion
    // that says so.
    const hipBand = [-18, -10] as const
    expect(widest('feidao', ...hipBand)).toBeGreaterThan(widest('great', ...hipBand) * 1.1)
  })

  it('draws every school as a different silhouette in the DOM', () => {
    // The creation screen's whole claim is that picking a school changes what
    // you see. Identical markup for two schools would make that a lie.
    const drawn = SCHOOLS.map((school) =>
      portraitSvg(gearFromIds({ blade: school.weaponId }), DEFAULT_LOOK),
    )
    expect(new Set(drawn).size).toBe(SCHOOLS.length)
    for (const svg of drawn) expect(svg).toContain('<polygon')
  })
})

describe('what a death actually keeps', () => {
  const find = (slot: string, rank = 1) => ({ slot, rank })

  it('keeps everything on a bank, regardless of where it was found', () => {
    const finds = [find('weapon'), find('robe'), find('robe', 3)]
    const out = settleFound(finds, 0, new Set(), true, (f) => f.slot)
    expect(out).toEqual(finds)
  })

  it('loses everything on a death when nothing was secured and every slot was already filled', () => {
    const finds = [find('weapon'), find('robe')]
    const out = settleFound(finds, 0, new Set(), false, (f) => f.slot)
    expect(out).toEqual([])
  })

  it('keeps finds made before the last gate cleared, even on death', () => {
    const finds = [find('weapon'), find('robe'), find('head')]
    // Two were found before the checkpoint (securedCount = 2); the third was
    // found afterward, pushing into the tier that killed the run.
    const out = settleFound(finds, 2, new Set(), false, (f) => f.slot)
    expect(out).toEqual([finds[0], finds[1]])
  })

  it('keeps the first find for a slot that started the expedition empty', () => {
    const finds = [find('weapon')]
    const out = settleFound(finds, 0, new Set(['weapon']), false, (f) => f.slot)
    expect(out).toEqual(finds)
  })

  it('keeps only the FIRST of two finds for the same empty slot, not both', () => {
    // A death should never be able to erase a run's only find — but it is
    // still a death, so a second piece for the same slot is not free.
    const finds = [find('weapon', 1), find('weapon', 4)]
    const out = settleFound(finds, 0, new Set(['weapon']), false, (f) => f.slot)
    expect(out).toEqual([finds[0]])
  })

  it('does not exempt a slot that was already filled at the start', () => {
    const finds = [find('robe')]
    const out = settleFound(finds, 0, new Set(['weapon']), false, (f) => f.slot)
    expect(out).toEqual([])
  })

  it('never returns more than what was passed in', () => {
    const finds = [find('weapon'), find('robe'), find('head'), find('shoulders')]
    for (const secured of [0, 1, 2, 4]) {
      for (const banked of [true, false]) {
        const out = settleFound(finds, secured, new Set(['weapon', 'head']), banked, (f) => f.slot)
        expect(out.length).toBeLessThanOrEqual(finds.length)
        for (const f of out) expect(finds).toContain(f)
      }
    }
  })
})


describe('the save, once the 秘笈 ladder is gone', () => {
  it('reads a save that still carries manual ranks, and drops them', () => {
    // The migration that matters, and the honest one. A real save from the
    // shipped build has a `manuals` record in it. An art's grade now comes from
    // the rungs of the gear worn, so a manual rank would be a second, invisible
    // ladder climbing the same number — folding it in would hand some saves a
    // head start nothing on screen could explain. It is dropped, and the
    // swordsman comes back playable.
    const before = createCharacter('Wei Zilan')
    const record = JSON.parse(serialiseCharacter(before)) as Record<string, unknown>
    record.manuals = { 'jian-point': 3, 'no-such-art': 2 }
    const after = parseCharacter(JSON.stringify(record))
    expect(after).not.toBeNull()
    expect(after!.name).toBe('Wei Zilan')
    expect((after as unknown as Record<string, unknown>).manuals).toBeUndefined()
  })

  it('does not write manuals back out', () => {
    // A field that came back on the round trip would resurrect the ladder in
    // every save the moment anything read it again.
    const c = createCharacter()
    const record = JSON.parse(serialiseCharacter(c)) as Record<string, unknown>
    expect(record.manuals).toBeUndefined()
  })
})
