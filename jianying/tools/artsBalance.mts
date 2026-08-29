/**
 * What the arts are worth, weapon by weapon, measured rather than argued.
 *
 *   npx tsx tools/artsBalance.mts
 *
 * `tools/regions.mts` answers "does each place play differently" and fixes the
 * weapon to the jian so that it measures places. That makes it almost blind to
 * this question: the jian's scroll has only two arts with a lever the
 * simulation owns, so the regions table moved 0-8% and told us very little
 * about the other five weapons.
 *
 * This tool asks the other question. Same pilot, same seeds, same region, every
 * weapon — once with the arts off and once with them on — so the column that
 * matters is the DELTA. A weapon whose scroll happens to line up with what the
 * pilot provokes will show a big one, and that is the number that says whether
 * a grade of an art is worth 35% or something quieter.
 *
 * WHAT IT CANNOT SEE, stated because it changes how to read the table. The
 * pilot kites in a circle: it holds 疾 almost always, provokes 转 on every
 * lap, gets 围 when the crowd closes, and reaches 危 only if it is losing. It
 * is never 静, so an art on standing still contributes NOTHING here and will
 * look free. Those arts are the ones a real player provokes deliberately, and
 * no headless pilot is going to measure them for us — they need hands.
 */
import { TICK_S } from '../src/core/loop'
import { Rng } from '../src/core/rng'
import { REGIONS } from '../src/data/regions'
import { WEAPONS } from '../src/data/weapons'
import { ARTS } from '../src/data/arts'
import { createPlayer, updatePlayer } from '../src/sim/player'
import { Swarm } from '../src/sim/enemies'
import { Motes } from '../src/sim/pickups'
import { Bolts } from '../src/sim/projectiles'
import { Hazards } from '../src/sim/hazards'
import { createRun, updateCombat } from '../src/sim/combat'
import { deriveStats } from '../src/sim/loadout'
import { applyArts, artActs, carriedFor } from '../src/sim/arts'
import { SURROUND_RADIUS, createSense, senseConditions } from '../src/sim/conditions'
import { emptyAttributes } from '../src/meta/character'

/**
 * Six, not three.
 *
 * Three reported the Curved Dao as 9% WORSE with its arts on, which cannot be
 * true — an art only ever adds — and was the sample being too small to see
 * past. Six is enough that a sign is a sign.
 */
const SEEDS = [4242, 90210, 31337, 8675309, 1618, 271828]
/** One place for every row, so the only thing varying is the weapon. */
const REGION = REGIONS[0]!
const SECONDS = 600

/** The same kiting circle regions.mts flies, so the two tables are comparable. */
const KITE = (t: number): [number, number] => [Math.cos(t * 0.9), Math.sin(t * 0.9)]

/** Points a mid-game character would have spent. Held equal across every row. */
const SPENT = { ...emptyAttributes(), body: 6, edge: 6, swift: 4, spirit: 2 }

interface Result {
  secs: number
  kills: number
}

function play(weaponId: string, withArts: boolean): Result {
  const weapon = WEAPONS.find((w) => w.id === weaponId)!
  let secs = 0
  let kills = 0

  for (const seed of SEEDS) {
    const player = createPlayer(0, 0)
    const swarm = new Swarm(new Rng(seed), REGION)
    const motes = new Motes()
    const bolts = new Bolts()
    const hazards = new Hazards()
    const rng = new Rng(seed ^ 0x5bf03635)
    const stats = deriveStats(new Map(), { spent: SPENT, weapon, worn: [] })
    const live = deriveStats(new Map(), { spent: SPENT, weapon, worn: [] })
    const run = createRun(stats.slashInterval)
    run.hp = stats.maxHp

    const sense = createSense()
    // An empty scroll is how "off" is expressed, rather than a branch: the same
    // code path runs in both rows, so the delta cannot be an artefact of one
    // row taking a different route through the simulation.
    const carried = withArts ? carriedFor(weapon.id) : []
    const rule = REGION.rule
    const drift = rule.drift ?? 0
    let t = 0

    for (let i = 0; i < Math.round(SECONDS / TICK_S); i++) {
      if (run.over) break
      t += TICK_S
      const [ix, iy] = KITE(run.elapsed)
      const wind = rule.driftPeriod ? (t / rule.driftPeriod) * Math.PI * 2 : 0
      applyArts(stats, carried, sense.active, live)
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
      run.pendingLevelUps = 0
      updateCombat(
        { run, player, swarm, motes, bolts, hazards, stats: live, rng, depth: REGION.depth },
        TICK_S,
      )
    }
    secs += run.elapsed
    kills += run.kills
  }
  return { secs: secs / SEEDS.length, kills: kills / SEEDS.length }
}

console.log(`\nThe arts, weapon by weapon. ${REGION.name}, ${SEEDS.length} seeds, same pilot.`)
console.log('The pilot kites: it holds 疾, turns every lap, never stands still.\n')
console.log(
  'weapon                live  off   on   Δ%   kills off    on    Δ%   conditions that fire',
)

let worst = { weapon: '', delta: -Infinity }
for (const weapon of WEAPONS) {
  const scroll = ARTS.filter((a) => a.weapon === weapon.id)
  const liveCount = scroll.filter(artActs).length
  const off = play(weapon.id, false)
  const on = play(weapon.id, true)
  const dSecs = ((on.secs - off.secs) / Math.max(1, off.secs)) * 100
  const dKills = ((on.kills - off.kills) / Math.max(1, off.kills)) * 100
  if (dSecs > worst.delta) worst = { weapon: weapon.name, delta: dSecs }
  const firing = scroll
    .filter(artActs)
    .map((a) => `${a.condition[0]!.toUpperCase()}${a.effect}`)
    .join(' ')
  console.log(
    `${weapon.name.padEnd(20)} ${String(liveCount).padStart(4)} ` +
      `${off.secs.toFixed(0).padStart(4)} ${on.secs.toFixed(0).padStart(4)} ` +
      `${dSecs.toFixed(0).padStart(4)} ` +
      `${off.kills.toFixed(0).padStart(9)} ${on.kills.toFixed(0).padStart(5)} ` +
      `${dKills.toFixed(0).padStart(5)}   ${firing}`,
  )
}

console.log(
  `\nBiggest gain: ${worst.weapon} at ${worst.delta.toFixed(0)}% survival.\n` +
    'A grade-1 art is meant to be felt, not decisive. Past roughly +40% here the\n' +
    'scroll is carrying the run rather than shaping it, and a STEP in sim/arts.ts\n' +
    'wants lowering.',
)
