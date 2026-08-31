/**
 * Does each region actually play differently?
 *
 * A rule that does not change the shape of a run is decoration with a comment
 * on it. This plays every region headlessly and prints what each one does to
 * survival, kill rate and crowd size. If two regions produce the same row, one
 * of them is not a place.
 *
 * THE MEASUREMENT IS CONTROLLED, and it is worth being explicit about how,
 * because an earlier version of this tool was not and quietly reported
 * nonsense. Three things are held fixed across every row:
 *
 *   the weapon      the starting jian, everywhere. Weapon balance is tests/
 *                   balance.spec.ts's job; if the weapon changed per region
 *                   this table would be measuring weapons, not places.
 *   the pilot       the same kiting circle, so no row is flattered by better
 *                   play than another.
 *   the techniques  none. In-run level-ups are suppressed, so this is the
 *                   pessimistic floor rather than a run that snowballed.
 *
 * Two things vary with depth, because they are what a player genuinely brings:
 * attribute points earned by the level that opens the region, and the best
 * gear the SHALLOWER regions could have handed over on the way in. A region's
 * own drops are excluded — those are what you are walking in to find.
 */
import { TICK_S } from '../src/core/loop'
import { Rng } from '../src/core/rng'
import { REGIONS, type Region } from '../src/data/regions'
import { DEFAULT_WEAPON } from '../src/data/weapons'
import { LEVELS_PER_REALM } from '../src/meta/realms'
import { emptyAttributes, pointsForLevel, type Attributes } from '../src/meta/character'
import { ITEM_BY_ID, type Item, type Slot } from '../src/data/items'
import { rollAffixes } from '../src/data/affixes'
import { rollRarity } from '../src/data/rarity'
import { mintUid, type OwnedItem } from '../src/meta/inventory'
import { createRun, updateCombat } from '../src/sim/combat'
import { Swarm } from '../src/sim/enemies'
import { Hazards } from '../src/sim/hazards'
import { deriveStats } from '../src/sim/loadout'
import { applyArts, attune, equippedIds } from '../src/sim/arts'
import { SURROUND_RADIUS, createSense, senseConditions } from '../src/sim/conditions'
import { Motes } from '../src/sim/pickups'
import { Bolts } from '../src/sim/projectiles'
import { createPlayer, updatePlayer } from '../src/sim/player'

const KITE = (t: number): [number, number] => [Math.cos(t * 0.25) * 0.3, Math.sin(t * 0.25) * 0.3]

/**
 * The attribute points a player would plausibly have when a region first opens.
 *
 * Measuring a level-1 swordsman in a region that unlocks at level 21 says
 * nothing useful — it only proves that walking somewhere you cannot go is a bad
 * idea. Region N opens at realm N, which is level 1 + (N-1)*5, so this spends
 * the points that ladder would have handed over by then.
 */
function pointsFor(depth: number): { spent: Attributes; points: number } {
  const level = 1 + (depth - 1) * LEVELS_PER_REALM
  let points = 1
  for (let l = 2; l <= level; l++) points += pointsForLevel(l)
  // Spread evenly. A real player would specialise, so this is the pessimistic
  // reading of what the points are worth.
  const each = Math.floor(points / 4)
  return { spent: { body: each, edge: each, swift: each, spirit: each }, points }
}

/**
 * The armour the shallower regions could have supplied, one item per slot.
 *
 * Taking "the last three items in the drop lists" — which is what this used to
 * do — can hand over two robes and no hat, which nobody can wear. Grouping by
 * slot and keeping the rarest is both legal and what a player would do.
 */
function wornFor(region: Region): Item[] {
  const best = new Map<Slot, Item>()
  for (const earlier of REGIONS) {
    if (earlier.depth >= region.depth) continue
    for (const id of earlier.drops) {
      const item = ITEM_BY_ID.get(id)
      if (!item || item.slot === 'weapon') continue
      const held = best.get(item.slot)
      if (!held || item.depth > held.depth) best.set(item.slot, item)
    }
  }
  return [...best.values()]
}

const levelled = !process.argv.includes('--level-one')
console.log(
  levelled
    ? '\nEach region walked by the character who would just have unlocked it.'
    : '\nEvery region walked by a level-1 character with no gear.',
)
console.log('Same jian, same pilot, no techniques, in every row.\n')
console.log(
  `${'region'.padEnd(20)} ${'pts'.padStart(4)} ${'worn'.padStart(5)} ${'secs'.padStart(5)} ` +
    `${'kills'.padStart(6)} ${'peak'.padStart(5)} ${'kills/s'.padStart(8)}`,
)

for (const region of REGIONS) {
  const { spent, points } = levelled ? pointsFor(region.depth) : { spent: emptyAttributes(), points: 1 }
  const worn = levelled ? wornFor(region) : []
  // Held constant on purpose — see the header. Weapons are balanced elsewhere.
  const weapon = DEFAULT_WEAPON

  let secs = 0
  let kills = 0
  let peak = 0
  const gearRng = new Rng(0x9e3779b9)

const SEEDS = [4242, 90210, 31337]

  for (const seed of SEEDS) {
    const player = createPlayer(0, 0)
    const swarm = new Swarm(new Rng(seed), region)
    const motes = new Motes()
    const bolts = new Bolts()
    const hazards = new Hazards()
    const rng = new Rng(seed ^ 0x5bf03635)
    const stats = deriveStats(new Map(), {
      spent,
      weapon,
      // At the rank the PREVIOUS region would have handed out. A pilot who
      // just unlocked The Pass is not wearing post-road copies of their gear,
      // and measuring them as if they were would report every deep region as
      // harder than it actually plays.
      worn: worn.map((item): OwnedItem => {
        // Its own stream, so rolling gear never shifts the enemy sequence.
        const at = Math.max(1, region.depth - 1)
        const rarity = rollRarity(at, 0.8)
        return {
          uid: mintUid(item.id),
          baseId: item.id,
          rarity,
          affixes: rollAffixes(rarity, at, gearRng),
          power: null,
          depth: at,
        }
      }),
    })
    const run = createRun(stats.slashInterval)
    run.hp = stats.maxHp

    // The arts, wired exactly as main.ts runs them.
    //
    // NO POSTURE ever holds in this table, and that is the pilot rather than a
    // bug: KITE flies at 0.3 deflection, above the 0.1 that counts as 静 and
    // below the 0.86 that counts as 疾. So 静, 疾 and 转 contribute nothing
    // here and always will.
    //
    // The SITUATIONS do fire — being surrounded and being in peril happen to a
    // drifter like anyone else — and since the six new effects landed, that is
    // no longer a rounding error. Measured, arts off against arts on:
    // 117 → 131, 77 → 82, 73 → 76, 48 → 47, 62 → 61 seconds. Before those
    // effects existed the same comparison moved not one digit.
    //
    // The gentle pilot stays. It is the right one for the question this tool
    // asks — whether each PLACE plays differently — and chasing the postures
    // would turn this into a second, worse copy of tools/artsBalance.mts, which
    // flies properly and exists for exactly that.
    const sense = createSense()
    // 珍 across every slot — a middling real kit. See tools/artsBalance.mts.
    const carried = attune(equippedIds({}, weapon.id), 2, [2, 2, 2, 2])
    const live = deriveStats(new Map(), { spent, weapon, worn: [] })

    const rule = region.rule
    const drift = rule.drift ?? 0
    let t = 0

    for (let i = 0; i < Math.round(600 / TICK_S); i++) {
      if (run.over) break
      t += TICK_S
      const [ix, iy] = KITE(run.elapsed)
      const wind = rule.driftPeriod ? (t / rule.driftPeriod) * Math.PI * 2 : 0
      // Applied from the previous tick's sense, the one-frame lag main.ts has.
      applyArts(stats, carried, sense.active, live, run.level)
      updatePlayer(
        player,
        ix,
        iy,
        TICK_S,
        live.moveSpeed * (rule.playerSpeed ?? 1),
        Math.cos(wind) * drift,
        Math.sin(wind) * drift,
      )
      const stickLen = Math.hypot(ix, iy)
      let nearby = 0
      swarm.grid.query(player.x, player.y, SURROUND_RADIUS, () => {
        nearby++
      })
      senseConditions(
        sense,
        {
          speed: Math.hypot(player.vx, player.vy),
          maxSpeed: live.moveSpeed * (rule.playerSpeed ?? 1),
          moveX: stickLen > 0 ? ix / stickLen : 0,
          moveY: stickLen > 0 ? iy / stickLen : 0,
          nearby,
          hp: run.hp,
          maxHp: live.maxHp,
        },
        TICK_S,
      )
      swarm.update(player.x, player.y, run.elapsed, TICK_S, hazards)
      // Drained rather than suppressed. The 内力 a level grants is folded in
      // by applyArts above, from run.level, so there is nothing to spend here.
      run.pendingLevelUps = 0
      updateCombat(
        { run, player, swarm, motes, bolts, hazards, stats: live, rng, depth: region.depth },
        TICK_S,
      )
      peak = Math.max(peak, swarm.count)
    }
    secs += run.elapsed
    kills += run.kills
  }

  const s = secs / SEEDS.length
  const k = kills / SEEDS.length
  console.log(
    `${region.name.padEnd(20)} ${String(points).padStart(4)} ${String(worn.length).padStart(5)} ` +
      `${s.toFixed(0).padStart(5)} ${k.toFixed(0).padStart(6)} ` +
      `${String(peak).padStart(5)} ${(k / s).toFixed(2).padStart(8)}`,
  )
}
