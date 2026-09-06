/**
 * What the skill bar is worth, weapon by weapon, measured rather than argued.
 *
 *   npx tsx tools/skillBalance.mts
 *
 * `tools/regions.mts` answers "does each place play differently" and fixes the
 * weapon so that it measures places. This tool asks the other question: what
 * are three slotted skills worth, and does a run that fires them outlast a run
 * that does not?
 *
 * Two columns per row, same seeds, same region, same pilot: BARE is the run
 * with an empty bar, BAR is the run with the default three. The gap is the
 * whole value of the system this overhaul replaced two others with, and it has
 * to be positive by a real margin or the bar is decoration.
 *
 * THE MANUAL SLOT IS FIRED BY A ROBOT HERE, the instant it can be — which is a
 * FLOOR, not a ceiling. A person saves it for the moment they are surrounded
 * and collects the boost; this pilot spends it on an empty field as soon as the
 * pool allows. The bar merely beating bare on those terms is the honest test.
 *
 * TWO PILOTS, and the reason is in the code below: one of them was quietly
 * deciding the answer. Read both rows before believing either.
 */
import { TICK_S } from '../src/core/loop'
import { Rng } from '../src/core/rng'
import { REGIONS } from '../src/data/regions'
import { WEAPONS } from '../src/data/weapons'
import { CONDITION_BY_ID } from '../src/data/arts'
import { createPlayer, playerSpeed, updatePlayer } from '../src/sim/player'
import { Swarm } from '../src/sim/enemies'
import { Motes } from '../src/sim/pickups'
import { Bolts } from '../src/sim/projectiles'
import { Hazards } from '../src/sim/hazards'
import { createRun, updateCombat } from '../src/sim/combat'
import { deriveStats } from '../src/sim/loadout'
import { SKILL_BY_ID, defaultBar } from '../src/data/skills'
import { MIGHT } from '../src/sim/arts'
import { createShi, updateShi } from '../src/sim/shi'
import { MANUAL_SLOT, applySkills, createBar, updateBar } from '../src/sim/skills'
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

type Pilot = (t: number) => [number, number]

/**
 * Two pilots, because one of them was quietly deciding the answer.
 *
 * KITE runs a constant circle at full deflection. It holds 疾 forever and is
 * NEVER still — so every art on 静 scored exactly zero, and a weapon whose
 * scroll leans on standing still was reported as weak when it had simply never
 * been tested. Six of the game's thirty arts wait on 静.
 *
 * DUEL is closer to a person: it runs, plants its feet, reverses, and runs
 * again. It provokes all three postures, which means a row here is a claim
 * about the weapon rather than about the pilot's habits.
 *
 * Neither is a player. Both are honest about which one they are.
 */
const PILOTS: Array<[string, Pilot]> = [
  ['kite', (t) => [Math.cos(t * 0.9), Math.sin(t * 0.9)]],
  [
    'duel',
    (t) => {
      // A four-second bar: run out, plant, run back, plant.
      const phase = t % 4
      if (phase < 1.5) return [1, 0]
      if (phase < 2) return [0, 0]
      if (phase < 3.5) return [-1, 0]
      return [0, 0]
    },
  ],
]

/** Points a mid-game character would have spent. Held equal across every row. */
const SPENT = { ...emptyAttributes(), body: 6, edge: 6, swift: 4, spirit: 2 }

interface Result {
  secs: number
  kills: number
}

/**
 * How a run is allowed to grow.
 *
 *   bare  an empty bar — the honest zero to measure from. 内力 still runs, so
 *         the difference between the columns can only be the skills.
 *   bar   the default three, with the manual slot fired the instant it can be
 */
type Growth = 'bare' | 'bar'

/** The worst swing any pilot produced, for the exit code below. */
let worst = Infinity

function play(weaponId: string, growth: Growth, fly: Pilot): Result {
  const seeds = SEEDS
  const seconds = SECONDS
  const weapon = WEAPONS.find((w) => w.id === weaponId)!
  let secs = 0
  let kills = 0

  for (const seed of seeds) {
    const player = createPlayer(0, 0)
    const swarm = new Swarm(new Rng(seed), REGION)
    const motes = new Motes()
    const bolts = new Bolts()
    const hazards = new Hazards()
    const rng = new Rng(seed ^ 0x5bf03635)
    const stats = deriveStats({ spent: SPENT, weapon, worn: [] })
    const live = deriveStats({ spent: SPENT, weapon, worn: [] })
    const run = createRun(stats.slashInterval)
    run.hp = stats.maxHp

    const sense = createSense()
    const shi = createShi()
    // An empty bar is how "off" is expressed, rather than a branch: the same
    // code path runs in both rows, so the delta cannot be an artefact of one
    // row taking a different route through the simulation.
    const bar = createBar(growth === 'bar' ? defaultBar(weapon.id) : [])
    const rule = REGION.rule
    const drift = rule.drift ?? 0
    let t = 0
    /** Last frame's fraction of top speed, which is what fills 势. */
    let pace = 0

    for (let i = 0; i < Math.round(seconds / TICK_S); i++) {
      if (run.over) break
      t += TICK_S
      const [ix, iy] = fly(run.elapsed)
      const wind = rule.driftPeriod ? (t / rule.driftPeriod) * Math.PI * 2 : 0
      // The same three steps in the same order as main.ts, and it matters that
      // they are the same: a tool that resolves the bar differently from the
      // game is measuring a game nobody plays.
      updateShi(shi, { pace, turned: sense.active.turn }, TICK_S)
      // THE ROBOT FIRES THE MANUAL SLOT ON SIGHT. See the file's note: this is
      // the floor, because a person would hold it for a posture that pays.
      const manualCost = bar.slots[MANUAL_SLOT]?.skill?.cost ?? 0
      updateBar(bar, shi, sense.active, shi.ready >= manualCost, TICK_S)
      applySkills(stats, bar, live, run.level)
      const topSpeed = live.moveSpeed * (rule.playerSpeed ?? 1)
      updatePlayer(player, ix, iy, TICK_S, topSpeed, Math.cos(wind) * drift, Math.sin(wind) * drift)
      pace = topSpeed > 0 ? playerSpeed(player) / topSpeed : 0
      const stickLen = Math.hypot(ix, iy)
      let nearby = 0
      swarm.grid.query(player.x, player.y, SURROUND_RADIUS, () => {
        nearby++
      })
      senseConditions(
        sense,
        {
          speed: playerSpeed(player),
          maxSpeed: topSpeed,
          moveX: stickLen > 0 ? ix / stickLen : 0,
          moveY: stickLen > 0 ? iy / stickLen : 0,
          nearby,
          hp: run.hp,
          maxHp: live.maxHp,
        },
        TICK_S,
      )
      swarm.update(player.x, player.y, run.elapsed, TICK_S, hazards)
      // A level is CONSUMED rather than suppressed. Its 内力 is folded into
      // `live` by applySkills above, from run.level, so both rows need nothing
      // here beyond draining the queue and raising what stands under the
      // ceiling — exactly as the game does.
      while (run.pendingLevelUps > 0) {
        run.pendingLevelUps--
        run.hp += MIGHT.maxHp
      }
      updateCombat(
        { run, player, swarm, motes, bolts, hazards, stats: live, rng, depth: REGION.depth },
        TICK_S,
      )
    }
    secs += run.elapsed
    kills += run.kills
  }
  return { secs: secs / seeds.length, kills: kills / seeds.length }
}

for (const [pilotName, fly] of PILOTS) {
  console.log(`\nThe skill bar — pilot "${pilotName}". ${REGION.name}, ${SEEDS.length} seeds.`)
  console.log('weapon                secs: bare   bar   kills: bare   bar   the three slotted')
  let bareTotal = 0
  let barTotal = 0
  for (const weapon of WEAPONS) {
    const bare = play(weapon.id, 'bare', fly)
    const withBar = play(weapon.id, 'bar', fly)
    bareTotal += bare.secs
    barTotal += withBar.secs
    // The boost condition's SEAL, not its first letter: "still" and
    // "surrounded" both start with s, and reading one as the other sent a
    // whole tuning pass in the wrong direction once already.
    const slotted = defaultBar(weapon.id)
      .map((id) => SKILL_BY_ID.get(id)!)
      .map((sk) => `${CONDITION_BY_ID.get(sk.boost.when)!.seal}${sk.seal}`)
      .join(' ')
    console.log(
      `${weapon.name.padEnd(20)} ${bare.secs.toFixed(0).padStart(6)} ` +
        `${withBar.secs.toFixed(0).padStart(5)} ` +
        `${bare.kills.toFixed(0).padStart(9)} ${withBar.kills.toFixed(0).padStart(5)}   ${slotted}`,
    )
  }
  const swing = ((barTotal - bareTotal) / bareTotal) * 100
  console.log(`  the bar is worth ${swing >= 0 ? '+' : ''}${swing.toFixed(0)}% survival overall`)
  worst = Math.min(worst, swing)
}

/**
 * The bar, enforced HERE rather than in the suite, and that is a decision with
 * a measurement behind it.
 *
 * It belongs in the suite by rights — a number nobody is required to look at
 * is a number that drifts, and the one this replaced drifted 26% without
 * anybody noticing. It is not in the suite because it cannot be made cheap: a
 * single comparison is many runs of a simulation that slows to a few thousand
 * ticks a second once a late crowd is on the grid. The suite is sixty seconds,
 * and a suite that takes four minutes is a suite that gets skipped — which is
 * how this project lost its balance tests once already.
 *
 * So it exits non-zero instead. Run it before shipping a change to the skills,
 * the conditions, or 势.
 */
const FLOOR = 4
if (worst < FLOOR) {
  console.error(
    `\nFAIL: the bar is worth ${worst.toFixed(0)}% survival, under the ${FLOOR}% floor.\n` +
      `Three skills that cost a resource and a thumb have to buy more than this,\n` +
      `or the whole system is decoration over a game that plays itself.`,
  )
  process.exitCode = 1
}

console.log(
  '\nThe manual slot is fired ON SIGHT here, which is the dumbest possible play —\n' +
    'a person holds it for the posture that pays its boost. So this column is a\n' +
    'FLOOR for what three skills are worth, not a claim about a good build.',
)
