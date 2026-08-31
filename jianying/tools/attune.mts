/**
 * 器蕴, measured: does the gear rung actually drive the power curve?
 *
 * The whole claim of the design is that better gear is felt as arts — more of
 * them awake, and all of them higher. That is a claim about numbers, so it is
 * checked with numbers rather than believed.
 *
 * ARTS ONLY. The worn set is passed as bare rungs and no affixes are rolled, so
 * what this measures is exactly what `attune` grants and nothing else. A real
 * 神 set also carries four strong lines per piece, which would compound the
 * curve and make it impossible to say which half produced it.
 *
 * Twenty-four seeds, because six were not enough: at six the rung 1 → 2 step
 * read as a small REGRESSION, which is exactly the shape of the non-monotone
 * bug the rarity ladder shipped with once. At twenty-four the step is a rise,
 * and the dip was noise.
 *
 *   npx tsx tools/attune.mts
 */
import { TICK_S } from '../src/core/loop'
import { Rng } from '../src/core/rng'
import { REGIONS } from '../src/data/regions'
import { WEAPONS } from '../src/data/weapons'
import { Swarm } from '../src/sim/enemies'
import { Motes } from '../src/sim/pickups'
import { Bolts } from '../src/sim/projectiles'
import { Hazards } from '../src/sim/hazards'
import { deriveStats } from '../src/sim/loadout'
import { createPlayer, updatePlayer } from '../src/sim/player'
import { createRun, updateCombat } from '../src/sim/combat'
import { SURROUND_RADIUS, createSense, senseConditions } from '../src/sim/conditions'
import { applyArts, attune, awakeCount, artGrade, equippedIds } from '../src/sim/arts'
import type { Attributes } from '../src/meta/character'

const SEEDS = Array.from({ length: 24 }, (_, i) => i + 1)
const SPENT: Attributes = { body: 6, edge: 6, swift: 4, spirit: 2 }
const CEILING = 420
const FRESH: Attributes = { body: 0, edge: 0, swift: 0, spirit: 0 }

const kite = (t: number): [number, number] => [Math.cos(t * 0.9), Math.sin(t * 0.9)]

function play(regionId: string, rung: number, spent: Attributes): { secs: number; kills: number } {
  const region = REGIONS.find((r) => r.id === regionId)!
  let secs = 0
  let kills = 0
  for (const seed of SEEDS) {
    const weapon = WEAPONS[0]!
    const player = createPlayer(0, 0)
    const swarm = new Swarm(new Rng(seed), region)
    const motes = new Motes()
    const bolts = new Bolts()
    const hazards = new Hazards()
    const rng = new Rng(seed ^ 0x5bf03635)
    const stats = deriveStats(new Map(), { spent, weapon, worn: [] })
    const live = deriveStats(new Map(), { spent, weapon, worn: [] })
    const run = createRun(stats.slashInterval)
    run.hp = stats.maxHp
    const sense = createSense()
    const carried = attune(equippedIds({}, weapon.id), rung, [rung, rung, rung, rung])
    const rule = region.rule
    const drift = rule.drift ?? 0
    let t = 0
    for (let i = 0; i < Math.round(CEILING / TICK_S); i++) {
      if (run.over) break
      t += TICK_S
      const [ix, iy] = kite(run.elapsed)
      const wind = rule.driftPeriod ? (t / rule.driftPeriod) * Math.PI * 2 : 0
      applyArts(stats, carried, sense.active, live, run.level)
      updatePlayer(player, ix, iy, TICK_S, live.moveSpeed * (rule.playerSpeed ?? 1), Math.cos(wind) * drift, Math.sin(wind) * drift)
      const stickLen = Math.hypot(ix, iy)
      let nearby = 0
      swarm.grid.query(player.x, player.y, SURROUND_RADIUS, () => { nearby++ })
      senseConditions(sense, {
        speed: Math.hypot(player.vx, player.vy),
        maxSpeed: live.moveSpeed * (rule.playerSpeed ?? 1),
        moveX: stickLen > 0 ? ix / stickLen : 0,
        moveY: stickLen > 0 ? iy / stickLen : 0,
        nearby, hp: run.hp, maxHp: live.maxHp,
      }, TICK_S)
      swarm.update(player.x, player.y, run.elapsed, TICK_S, hazards)
      run.pendingLevelUps = 0
      updateCombat({ run, player, swarm, motes, bolts, hazards, stats: live, rng, depth: region.depth }, TICK_S)
    }
    secs += run.elapsed
    kills += run.kills
  }
  return { secs: secs / SEEDS.length, kills: kills / SEEDS.length }
}

for (const [label, spent] of [['fresh (no points)', FRESH], ['mid (6/6/4/2)', SPENT]] as const) {
  console.log(`\n${label} — The Post Road, kite pilot, ${CEILING}s ceiling`)
  console.log('rung  awake  grade   secs   kills')
  for (let rung = 0; rung <= 5; rung++) {
    const r = play('road', rung, spent)
    console.log(
      `${String(rung).padStart(4)}  ${String(awakeCount(rung, 5)).padStart(5)}  ` +
      `${String(artGrade([rung, rung, rung, rung])).padStart(5)}  ` +
      `${r.secs.toFixed(0).padStart(5)}  ${r.kills.toFixed(0).padStart(6)}`,
    )
  }
}
