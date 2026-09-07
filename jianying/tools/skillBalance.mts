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
import { createPlayer, playerSpeed, updatePlayer } from '../src/sim/player'
import { Swarm } from '../src/sim/enemies'
import { Motes } from '../src/sim/pickups'
import { Bolts } from '../src/sim/projectiles'
import { Hazards } from '../src/sim/hazards'
import { createRun, updateCombat } from '../src/sim/combat'
import { deriveStats } from '../src/sim/loadout'
import { defaultBar } from '../src/data/skills'
import { MIGHT } from '../src/sim/arts'
import { MAX_SHI, createShi, updateShi } from '../src/sim/shi'
import { MANUAL_SLOT, applySkills, costOf, createBar, updateBar } from '../src/sim/skills'
import { foldTalents, noTalents } from '../src/sim/talents'
import type { Wheel } from '../src/data/talents'
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
/**
 * How long a row is allowed to run before it is called a survival.
 *
 * TEN MINUTES IS NOW THE BINDING CONSTRAINT ON MOST ROWS, and that is a
 * finding rather than a setting. With the Wheel folded in, ten of the sixteen
 * keystone columns sat exactly on this ceiling — so the tool can still say the
 * bar and the wheel are worth taking, and can no longer tell two good builds
 * apart. The one row that is not saturated (the greatsword under `kite`) shows
 * a real spread: 330 plain, 339 to 505 across the four keystones.
 *
 * Raising it is not free — every row is a full simulated expedition, and the
 * whole tool already takes about fifteen minutes. Left where it is, and
 * written down, so the next person reading a wall of 600s knows it is the
 * ceiling talking and not the build.
 */
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
type Growth = 'bare' | 'bar' | 'still' | 'run' | 'turn' | 'ring'

/**
 * A full wheel per keystone, spent the way a player would reach one.
 *
 * Six points into the arm to open the rim, then the keystone, then the hub —
 * which is the cheapest legal route to each of the four, and therefore the one
 * a build guide would print. Same total spend on every row, so the columns
 * differ by WHICH keystone rather than by how many points went in.
 */
const WHEELS: Record<string, Wheel> = {
  still: { rooted: 3, anvil: 3, stillpoint: 1, current: 3, deepwell: 2 },
  run: { gale: 3, swiftfoot: 3, traceless: 1, current: 3, deepwell: 2 },
  turn: { whirl: 3, pivot: 3, aboutface: 1, current: 3, deepwell: 2 },
  ring: { press: 3, ironring: 3, breakring: 1, current: 3, deepwell: 2 },
}

/** The worst swing any pilot produced, for the exit code below. */
let worst = Infinity
/** Keystone/weapon pairs that came in under the floor. */
let keystoneFailures = 0
/**
 * How far under a plain bar a keystone may fall.
 *
 * Slightly negative on purpose. Three of the four reward a posture the robot
 * pilots do not play for — 回身 pays only when you reverse, and neither pilot
 * reverses on purpose — so demanding a gain from every one of them would be
 * demanding that a keystone beat a plain bar while being used wrongly.
 */
const KEYSTONE_FLOOR = -8

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
    const boons = noTalents()
    foldTalents(WHEELS[growth] ?? {}, boons)
    const shi = createShi(MAX_SHI + boons.maxShi)
    // An empty bar is how "off" is expressed, rather than a branch: the same
    // code path runs in both rows, so the delta cannot be an artefact of one
    // row taking a different route through the simulation.
    const bar = createBar(growth === 'bare' ? [] : defaultBar(weapon.id))
    // THE WHEEL, folded once, exactly as an expedition does it.
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
      updateShi(
        shi,
        {
          pace,
          turned: sense.active.turn,
          fill: boons.fill,
          stillFill: boons.stillFill,
          turnGain: boons.turnGain,
        },
        TICK_S,
      )
      // THE ROBOT FIRES THE MANUAL SLOT ON SIGHT. See the file's note: this is
      // the floor, because a person would hold it for a posture that pays.
      const manual = bar.slots[MANUAL_SLOT]?.skill
      const manualCost = manual ? costOf(manual, boons) : 0
      updateBar(bar, shi, sense.active, shi.ready >= manualCost, TICK_S, boons)
      applySkills(stats, bar, live, run.level, boons)
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
  console.log(`\nThe bar and the Wheel — pilot "${pilotName}". ${REGION.name}, ${SEEDS.length} seeds.`)
  console.log(
    'weapon             bare    bar   静定心   疾无踪   转回身   围破围   best keystone',
  )
  let bareTotal = 0
  let barTotal = 0
  for (const weapon of WEAPONS) {
    const rows: Record<Growth, Result> = {
      bare: play(weapon.id, 'bare', fly),
      bar: play(weapon.id, 'bar', fly),
      still: play(weapon.id, 'still', fly),
      run: play(weapon.id, 'run', fly),
      turn: play(weapon.id, 'turn', fly),
      ring: play(weapon.id, 'ring', fly),
    }
    bareTotal += rows.bare.secs
    barTotal += rows.bar.secs
    const keys: Growth[] = ['still', 'run', 'turn', 'ring']
    const best = keys.reduce((a, b) => (rows[b].secs > rows[a].secs ? b : a))
    const label: Record<string, string> = {
      still: '定心 Stillpoint',
      run: '无踪 Traceless',
      turn: '回身 About-Face',
      ring: '破围 Breaking',
    }
    console.log(
      `${weapon.name.padEnd(18)} ${rows.bare.secs.toFixed(0).padStart(4)} ` +
        `${rows.bar.secs.toFixed(0).padStart(6)} ` +
        keys.map((k) => rows[k].secs.toFixed(0).padStart(7)).join(' ') +
        `   ${label[best]}`,
    )
    // EVERY KEYSTONE HAS TO BE WORTH TAKING, and that is a real bar. A rim node
    // that loses to a plain bar is a node the wheel would be better without —
    // it costs six points to reach and it is the choice the whole board turns
    // on. Reported per weapon rather than averaged, because a keystone that
    // works on one class and not the other is exactly the interesting case.
    for (const k of keys) {
      const swing = ((rows[k].secs - rows.bar.secs) / rows.bar.secs) * 100
      if (swing < KEYSTONE_FLOOR) {
        console.error(
          `  ! ${label[k]} on ${weapon.name} is ${swing.toFixed(0)}% against a plain bar`,
        )
        keystoneFailures++
      }
    }
  }
  const swing = ((barTotal - bareTotal) / bareTotal) * 100
  console.log(`  the bar alone is worth ${swing >= 0 ? '+' : ''}${swing.toFixed(0)}% survival`)
  worst = Math.min(worst, swing)
}

/**
 * The two bars, enforced HERE rather than in the suite.
 *
 * A number nobody is required to look at is a number that drifts, and the one
 * this replaced drifted 26% without anybody noticing. It is not in the suite
 * because it cannot be made cheap: this is forty-eight runs of a simulation
 * that slows to a few thousand ticks a second once a late crowd is on the grid.
 * The suite is a hundred seconds, and a suite that takes ten minutes is a suite
 * that gets skipped — which is how this project lost its balance tests once.
 *
 * So it exits non-zero instead. Run it before shipping a change to the skills,
 * the Wheel, the conditions, or 势.
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
if (keystoneFailures > 0) {
  console.error(
    `\nFAIL: ${keystoneFailures} keystone/weapon pairs came in under ${KEYSTONE_FLOOR}%.\n` +
      `A rim node costs six points to reach and is the choice the board turns on;\n` +
      `one that loses to a plain bar is a node the wheel would be better without.`,
  )
  process.exitCode = 1
}

console.log(
  '\nThe manual slot is fired ON SIGHT here, which is the dumbest possible play —\n' +
    'a person holds it for the posture that pays its boost, and three of the four\n' +
    'keystones reward exactly that. So every column is a FLOOR.',
)
