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
import { parseCharacter, serialiseCharacter } from '../src/meta/save'
import { createRun, updateCombat } from '../src/sim/combat'
import {
  DEFAULT_WEAPON,
  WEAPONS,
  WEAPON_BY_ID,
  singleTargetDps,
  sweptAreaPerSecond,
} from '../src/data/weapons'
import { BLADE_BY_ID, HEADS, ROBES, SHOULDERS } from '../src/render/wardrobe'
import { Swarm } from '../src/sim/enemies'
import { Hazards } from '../src/sim/hazards'
import { deriveStats, type Kit } from '../src/sim/loadout'
import { ITEMS, ITEM_BY_ID, dropChance, rollDrop, statLine, type Item } from '../src/data/items'
import {
  acquire,
  emptyInventory,
  equip,
  equippedIn,
  ownedInSlot,
  sanitise,
} from '../src/meta/inventory'
import { Motes } from '../src/sim/pickups'
import { Bolts } from '../src/sim/projectiles'
import { createPlayer, updatePlayer } from '../src/sim/player'

const attrs = (partial: Partial<Attributes>): Attributes => ({ ...emptyAttributes(), ...partial })

/** A Kit carrying only bought attributes — the default weapon, nothing worn. */
const kit = (spent: Attributes = emptyAttributes(), worn: Item[] = []): Kit => ({
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
    expect(regionAt(c.depth)).toBeTruthy()
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
    const grown = deriveStats(new Map(), kit(attrs({ body: 5, edge: 5, swift: 5 })))
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
      const without = deriveStats(new Map(), kit(attrs({ edge })))
      const with3 = deriveStats(keen, kit(attrs({ edge })))
      expect(with3.slashDamage - without.slashDamage).toBeCloseTo(12, 9)
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
      for (const value of Object.values(stats)) {
        expect(Number.isFinite(value)).toBe(true)
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
    const temple = SCHOOL_BY_ID.get('temple')!
    const spent = applySchool(temple, emptyAttributes())
    expect(spent.spirit).toBe(temple.grants.spirit)
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
    // of this test got wrong: twin blades deal 7 against a 10hp bandit, so they
    // need two sweeps — but at 0.27s each that is 0.54s, quicker than the
    // jian's single 0.46s swing. Sweeps are not the unit the player feels.
    const bandit = 10
    for (const school of SCHOOLS) {
      const weapon = WEAPON_BY_ID.get(school.weaponId)!
      const stats = deriveStats(new Map(), { spent: emptyAttributes(), weapon, worn: [] })
      const sweeps = Math.ceil(bandit / stats.slashDamage)
      const ttk = sweeps * stats.slashInterval
      expect(ttk, `${weapon.name} takes ${ttk.toFixed(2)}s`).toBeLessThanOrEqual(0.7)
    }
  })

  it('drives the sweep through deriveStats', () => {
    const spear = WEAPON_BY_ID.get('spear')!
    const fan = WEAPON_BY_ID.get('fan')!
    const withSpear = deriveStats(new Map(), { spent: emptyAttributes(), weapon: spear, worn: [] })
    const withFan = deriveStats(new Map(), { spent: emptyAttributes(), weapon: fan, worn: [] })
    // Reach against coverage — the two ends of the roster.
    expect(withSpear.slashRange).toBeGreaterThan(withFan.slashRange * 2)
    expect(withFan.slashHalfAngle).toBeGreaterThan(withSpear.slashHalfAngle * 4)
  })
})

describe('items', () => {
  it('gives every item a distinct id and a real style', () => {
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length)
    for (const item of ITEMS) {
      expect(ITEM_BY_ID.get(item.id)).toBe(item)
      if (item.slot === 'weapon') {
        expect(WEAPON_BY_ID.has(item.styleId), item.name).toBe(true)
      } else {
        const table =
          item.slot === 'robe' ? ROBES : item.slot === 'shoulders' ? SHOULDERS : HEADS
        expect(table.some((s) => s.id === item.styleId), item.name).toBe(true)
      }
    }
  })

  it('never gives two items in a slot the same silhouette', () => {
    // An item that does not change the outline is invisible in this art
    // direction, so two items sharing a style would be the same item twice.
    for (const slot of ['robe', 'shoulders', 'head', 'weapon'] as const) {
      const styles = ITEMS.filter((i) => i.slot === slot).map((i) => i.styleId)
      expect(new Set(styles).size, slot).toBe(styles.length)
    }
  })

  it('gives every non-weapon exactly one readable line', () => {
    for (const item of ITEMS) {
      if (item.slot === 'weapon') {
        // The weapon IS the line; a stat on top would bury it.
        expect(item.stat).toBeUndefined()
        continue
      }
      expect(item.stat, item.name).toBeDefined()
      expect(statLine(item.stat).trim().length).toBeGreaterThan(0)
    }
  })

  it('keeps drops rare enough to stay an event', () => {
    // A survivors-like fells hundreds of things per expedition. At 5% a run
    // would end in a wall of duplicates and a drop would stop meaning anything.
    for (let depth = 1; depth <= MAX_DEPTH; depth++) {
      expect(dropChance(depth)).toBeLessThan(0.02)
      expect(dropChance(depth)).toBeGreaterThan(0)
    }
  })

  it('never rolls something the road has not unlocked', () => {
    const rng = new Rng(31)
    const nothing = new Set<string>()
    for (let depth = 1; depth <= MAX_DEPTH; depth++) {
      for (let i = 0; i < 400; i++) {
        const item = rollDrop(depth, rng.next(), nothing)!
        expect(item.depth).toBeLessThanOrEqual(depth)
      }
    }
  })

  it('favours something the player does not already have', () => {
    // Without this the shallow table is small enough that roughly half of all
    // drops come back "already yours", which is a slot machine that mostly
    // pays nothing rather than a loot game.
    const rng = new Rng(9001)
    const owned = new Set(['r-plain', 's-plain', 'h-topknot', 'w-jian'])
    let fresh = 0
    const runs = 3000
    for (let i = 0; i < runs; i++) {
      if (!owned.has(rollDrop(1, rng.next(), owned)!.id)) fresh++
    }
    expect(fresh / runs).toBeGreaterThan(0.75)
  })

  it('still returns something once everything is owned', () => {
    // A drop has to be something. Once the table is exhausted, a duplicate is
    // the honest answer rather than silence.
    const everything = new Set(ITEMS.map((i) => i.id))
    const rng = new Rng(5)
    for (let i = 0; i < 100; i++) {
      expect(rollDrop(MAX_DEPTH, rng.next(), everything)).not.toBeNull()
    }
  })

  it('feeds worn stats into the same maths as bought ones', () => {
    const robe = ITEM_BY_ID.get('r-layered')!
    const bare = deriveStats(new Map(), kit())
    const worn = deriveStats(new Map(), kit(emptyAttributes(), [robe]))
    // "+3 Body" on a robe must mean exactly what "+3 Body" means in the hub.
    expect(worn.maxHp).toBeCloseTo(deriveStats(new Map(), kit(attrs({ body: 3 }))).maxHp, 9)
    expect(worn.maxHp).toBeGreaterThan(bare.maxHp)
  })

  it('caps the rate bonus so the sweep cannot reach zero', () => {
    const absurd = Array.from({ length: 40 }, () => ITEM_BY_ID.get('s-plain')!)
    const stats = deriveStats(new Map(), kit(emptyAttributes(), absurd))
    expect(stats.slashInterval).toBeGreaterThan(0)
    expect(Number.isFinite(stats.slashInterval)).toBe(true)
  })
})

describe('inventory', () => {
  it('records an item once and reports the duplicate', () => {
    const inv = emptyInventory()
    expect(acquire(inv, 'r-plain')).toBe(true)
    // Owning is a fact, not a quantity: the hundredth Hemp Robe is worth
    // nothing, and a list that grew each time would be unusable by evening.
    expect(acquire(inv, 'r-plain')).toBe(false)
    expect(inv.owned).toEqual(['r-plain'])
  })

  it('refuses an id this build does not know', () => {
    const inv = emptyInventory()
    expect(acquire(inv, 'not-a-real-item')).toBe(false)
    expect(inv.owned).toEqual([])
  })

  it('refuses to equip what is not owned', () => {
    const inv = emptyInventory()
    expect(equip(inv, 'r-plain')).toBe(false)
    acquire(inv, 'r-plain')
    expect(equip(inv, 'r-plain')).toBe(true)
    expect(equippedIn(inv, 'robe')?.id).toBe('r-plain')
  })

  it('replaces rather than stacks within a slot', () => {
    const inv = emptyInventory()
    acquire(inv, 'r-plain')
    acquire(inv, 'r-travelling')
    equip(inv, 'r-plain')
    equip(inv, 'r-travelling')
    expect(equippedIn(inv, 'robe')?.id).toBe('r-travelling')
    expect(ownedInSlot(inv, 'robe')).toHaveLength(2)
  })

  it('drops ids a later build removed, and unequips the dangling slot', () => {
    // The migration that matters: an item renamed between builds must not make
    // a piece of the figure silently vanish.
    const repaired = sanitise({
      owned: ['r-plain', 'an-item-that-was-deleted'],
      equipped: { robe: 'an-item-that-was-deleted', head: 'h-hat' },
    })
    expect(repaired.owned).toEqual(['r-plain'])
    expect(repaired.equipped.robe).toBeUndefined()
    // Equipped-but-not-owned is not a state the game can produce, but a
    // hand-edited save can, and honouring it would be a free item.
    expect(repaired.equipped.head).toBeUndefined()
  })
})

describe('save', () => {
  it('round-trips a character', () => {
    const c = createCharacter('Bai', 'temple')
    // Creation hands over the school's kit, so a real character always owns
    // something. An empty inventory means "written before equipment existed",
    // which parsing deliberately repairs — see the migration test below.
    for (const id of ['r-plain', 's-wide', 'h-crown', 'w-fan']) {
      acquire(c.inventory, id)
      equip(c.inventory, id)
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
      JSON.stringify({ name: 'Lu', origin: 'watch', level: 6, runs: 4 }),
    )!
    expect(back.inventory.owned.length).toBeGreaterThan(0)
    expect(back.inventory.equipped.weapon).toBeDefined()
    const weapon = ITEM_BY_ID.get(back.inventory.equipped.weapon!)!
    // And the weapon it hands over is the one their school actually uses.
    expect(weapon.styleId).toBe(SCHOOL_BY_ID.get('watch')!.weaponId)
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
