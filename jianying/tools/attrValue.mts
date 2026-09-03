/**
 * What one point of each attribute is actually worth, measured.
 *
 *   npx tsx tools/attrValue.mts
 *
 * Every other balance tool in this project asks about a system — the rift, the
 * arts, a weapon. This one asks the question underneath all of them: given
 * twenty points and four places to put them, is there a choice? Measured with
 * no equipment, so what is being read is the ATTRIBUTE and not the gear.
 *
 * It exists because a spot check found there was no choice at all: Body took
 * the Broken Cliff in 142 seconds and Edge died there in 44, and the spread
 * build lost to both. A stat nobody would ever buy is not a build option, it
 * is a trap with a name.
 */
import { TICK_S } from '../src/core/loop'
import { Rng } from '../src/core/rng'
import { REGIONS } from '../src/data/regions'
import { WEAPONS } from '../src/data/weapons'
import { createPlayer, updatePlayer } from '../src/sim/player'
import { Swarm } from '../src/sim/enemies'
import { Motes } from '../src/sim/pickups'
import { Bolts } from '../src/sim/projectiles'
import { Hazards } from '../src/sim/hazards'
import { createRun, updateCombat } from '../src/sim/combat'
import { deriveStats } from '../src/sim/loadout'
import { applyArts, attune, equippedIds, surgeOf } from '../src/sim/arts'
import { SURROUND_RADIUS, createSense, senseConditions } from '../src/sim/conditions'
import { emptyAttributes, type AttributeId, type Attributes } from '../src/meta/character'
import { PILOTS } from './runLength.mts'

const SEEDS = [4242, 90210, 31337, 8675309]
/** Long enough to separate the sheets, short enough to run in a minute. */
const CAP = 300
/** Deep enough that the game kills you, so survival is what is being measured. */
const REGION = 'cliff'
export const BUDGET = 20

export interface Row {
  secs: number
  kills: number
  cleared: number
}

export function play(spent: Attributes, weaponId: string, regionId = REGION): Row {
  const region = REGIONS.find((r) => r.id === regionId)!
  const weapon = WEAPONS.find((w) => w.id === weaponId)!
  const out: Row = { secs: 0, kills: 0, cleared: 0 }
  for (const seed of SEEDS) {
    const player = createPlayer(0, 0)
    const swarm = new Swarm(new Rng(seed), region)
    const stats = deriveStats(new Map(), { spent, weapon, worn: [] })
    const live = deriveStats(new Map(), { spent, weapon, worn: [] })
    const run = createRun(stats.slashInterval)
    run.hp = stats.maxHp
    run.riftTarget = region.riftBase
    const sense = createSense()
    const carried = attune(equippedIds({}, weapon.id), 2, [2, 2, 2, 2])
    const ctx = {
      run, player, swarm, motes: new Motes(), bolts: new Bolts(),
      hazards: new Hazards(), stats: live, rng: new Rng(seed ^ 77), depth: region.depth,
    }
    // THE REGION'S OWN RULE, applied exactly as runLength.mts applies it.
    //
    // This harness left it out at first, and that made every deep-region number
    // it printed wrong: the Broken Cliff read as unclearable for the sweeper
    // while `--search` cleared it every time at a HARDER target. A place whose
    // whole character is its wind, measured without the wind, is a different
    // place. A tool that lies is worse than no tool.
    const rule = region.rule
    const drift = rule.drift ?? 0
    let t = 0
    for (let i = 0; i < Math.round(CAP / TICK_S); i++) {
      if (run.over || run.gateCleared) break
      t += TICK_S
      const [ix, iy] = PILOTS[1]![1](run.elapsed)
      const wind = rule.driftPeriod ? (t / rule.driftPeriod) * Math.PI * 2 : 0
      applyArts(stats, carried, sense.active, live, run.level, surgeOf(sense))
      updatePlayer(
        player,
        ix,
        iy,
        TICK_S,
        live.moveSpeed * (rule.playerSpeed ?? 1),
        Math.cos(wind) * drift,
        Math.sin(wind) * drift,
      )
      const len = Math.hypot(ix, iy)
      let nearby = 0
      swarm.grid.query(player.x, player.y, SURROUND_RADIUS, () => {
        nearby++
      })
      senseConditions(
        sense,
        {
          speed: Math.hypot(player.vx, player.vy),
          maxSpeed: live.moveSpeed * (rule.playerSpeed ?? 1),
          moveX: len > 0 ? ix / len : 0,
          moveY: len > 0 ? iy / len : 0,
          nearby,
          hp: run.hp,
          maxHp: live.maxHp,
        },
        TICK_S,
      )
      swarm.update(player.x, player.y, run.elapsed, TICK_S, ctx.hazards)
      while (run.pendingLevelUps > 0) run.pendingLevelUps--
      updateCombat(ctx, TICK_S)
    }
    out.secs += run.elapsed
    out.kills += run.kills
    out.cleared += run.gateCleared ? 1 : 0
  }
  const n = SEEDS.length
  return { secs: out.secs / n, kills: out.kills / n, cleared: out.cleared / n }
}

export const pure = (id: AttributeId, points: number): Attributes => ({
  ...emptyAttributes(),
  [id]: points,
})
export const spread = (points: number): Attributes => {
  const each = Math.floor(points / 4)
  return { ...emptyAttributes(), body: each, edge: each, swift: each, spirit: each }
}

const ATTRS: AttributeId[] = ['body', 'edge', 'swift', 'spirit']

if (process.argv[1]?.endsWith('attrValue.mts')) {
  console.log(
    `Twenty points, four ways. ${REGIONS.find((r) => r.id === REGION)!.name}, ` +
      `${SEEDS.length} seeds, engaged pilot, no equipment.\n`,
  )
  for (const weapon of WEAPONS) {
    console.log(`${weapon.name}`)
    console.log('  sheet         secs   kills  cleared')
    const rows: Array<[string, Row]> = []
    for (const id of ATTRS) rows.push([id + ' 20', play(pure(id, BUDGET), weapon.id)])
    rows.push(['spread', play(spread(BUDGET), weapon.id)])
    rows.push(['nothing', play(emptyAttributes(), weapon.id)])
    for (const [name, r] of rows) {
      console.log(
        '  ' + name.padEnd(13) + r.secs.toFixed(0).padStart(4) +
          r.kills.toFixed(0).padStart(8) + (r.cleared * 100).toFixed(0).padStart(8) + '%',
      )
    }
    // The number the whole tool exists for: how much better the best sheet is
    // than the worst. A build system where that gap is large has one build.
    const best = Math.max(...rows.slice(0, 5).map(([, r]) => r.secs))
    const worst = Math.min(...rows.slice(0, 5).map(([, r]) => r.secs))
    console.log(`  best / worst: ${(best / worst).toFixed(2)}x\n`)
  }
}
