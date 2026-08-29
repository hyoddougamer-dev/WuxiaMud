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
import { ARTS, CONDITION_BY_ID } from '../src/data/arts'
import { createPlayer, updatePlayer } from '../src/sim/player'
import { Swarm } from '../src/sim/enemies'
import { Motes } from '../src/sim/pickups'
import { Bolts } from '../src/sim/projectiles'
import { Hazards } from '../src/sim/hazards'
import { createRun, updateCombat } from '../src/sim/combat'
import { deriveStats } from '../src/sim/loadout'
import { offerTechniques, type Loadout } from '../src/data/techniques'
import { advanceArt, applyArts, artActs, beginProgress, equippedIds } from '../src/sim/arts'
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
 *   none   nothing at all — the floor, and the only honest zero to measure from
 *   cards  the three technique cards this change REPLACED, taken greedily
 *   arts   感悟 advancing the four equipped arts, which is what ships now
 *
 * The middle column is the one that matters and the reason this tool grew a
 * third mode. Removing the cards without measuring what they were worth would
 * be replacing the motor of the genre on a hunch: a survivors-like whose run
 * stops growing while the enemies keep growing is not a harder game, it is a
 * shorter one.
 */
type Growth = 'none' | 'cards' | 'arts'

function play(weaponId: string, growth: Growth, fly: Pilot): Result {
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
    // The card mode needs a live loadout, so stats are recomputed when one is
    // taken rather than derived once.
    const loadout: Loadout = new Map()
    let stats = deriveStats(loadout, { spent: SPENT, weapon, worn: [] })
    const live = deriveStats(loadout, { spent: SPENT, weapon, worn: [] })
    const run = createRun(stats.slashInterval)
    run.hp = stats.maxHp

    const sense = createSense()
    // An empty scroll is how "off" is expressed, rather than a branch: the same
    // code path runs in both rows, so the delta cannot be an artefact of one
    // row taking a different route through the simulation.
    const progress = beginProgress(growth === 'arts' ? equippedIds({}, weapon.id) : [])
    const rule = REGION.rule
    const drift = rule.drift ?? 0
    let t = 0

    for (let i = 0; i < Math.round(SECONDS / TICK_S); i++) {
      if (run.over) break
      t += TICK_S
      const [ix, iy] = fly(run.elapsed)
      const wind = rule.driftPeriod ? (t / rule.driftPeriod) * Math.PI * 2 : 0
      applyArts(stats, progress.carried, sense.active, live)
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
      // 感悟 is now the run's growth, so it is CONSUMED rather than suppressed.
      // Zeroing it — which is what this line used to do, back when growth came
      // from three cards this harness deliberately refused — would now measure
      // a run that cannot grow at all, and report the whole game as broken.
      while (run.pendingLevelUps > 0) {
        run.pendingLevelUps--
        if (growth === 'arts') {
          advanceArt(progress)
        } else if (growth === 'cards') {
          // Greedy: always the first on offer. A real player picks better than
          // this, so the card column is a FLOOR for what the cards were worth,
          // which is the conservative direction for the comparison to fail in.
          const offer = offerTechniques(loadout, () => rng.next())
          const pick = offer[0]
          if (pick) {
            const before = stats.maxHp
            loadout.set(pick.id, (loadout.get(pick.id) ?? 0) + 1)
            stats = deriveStats(loadout, { spent: SPENT, weapon, worn: [] })
            run.hp = Math.min(stats.maxHp, run.hp + (stats.maxHp - before))
          }
        }
      }
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

for (const [pilotName, fly] of PILOTS) {
  console.log(`\nThe arts — pilot "${pilotName}". ${REGION.name}, ${SEEDS.length} seeds.`)
  console.log(
    'weapon                live  secs: none  cards  arts   kills: none  cards  arts   what fires',
  )
  let cardsTotal = 0
  let artsTotal = 0
  for (const weapon of WEAPONS) {
    const carriedFour = ARTS.filter((a) => a.weapon === weapon.id).slice(0, 4)
    const liveCount = carriedFour.filter(artActs).length
    const none = play(weapon.id, 'none', fly)
    const cards = play(weapon.id, 'cards', fly)
    const arts = play(weapon.id, 'arts', fly)
    cardsTotal += cards.secs
    artsTotal += arts.secs
    // The condition's SEAL, not its first letter: "still" and "surrounded"
    // both start with s, and reading one as the other sent a whole tuning
    // pass in the wrong direction.
    const firing = carriedFour
      .map((a) => `${CONDITION_BY_ID.get(a.condition)!.seal}${a.effect}`)
      .join(' ')
    console.log(
      `${weapon.name.padEnd(20)} ${String(liveCount).padStart(4)} ` +
        `${none.secs.toFixed(0).padStart(5)} ${cards.secs.toFixed(0).padStart(6)} ` +
        `${arts.secs.toFixed(0).padStart(5)} ` +
        `${none.kills.toFixed(0).padStart(7)} ${cards.kills.toFixed(0).padStart(6)} ` +
        `${arts.kills.toFixed(0).padStart(5)}   ${firing}`,
    )
  }
  const swing = ((artsTotal - cardsTotal) / cardsTotal) * 100
  console.log(
    `  against the cards: ${swing >= 0 ? '+' : ''}${swing.toFixed(0)}% survival overall`,
  )
}

console.log(
  '\nThe card column is a FLOOR — it always takes the first card offered, and a\n' +
    'real player picks better — so the arts needing to beat it is the honest bar.\n' +
    'Well below it means the run stopped growing while the enemies kept growing,\n' +
    'which is not a harder game, only a shorter one.',
)
