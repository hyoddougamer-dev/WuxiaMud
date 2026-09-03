/**
 * How long a rift actually takes to fill, and what the player gets out of it.
 *
 *   npx tsx tools/runLength.mts
 *
 * The plan this game was written from promised expeditions of 8 to 15 minutes.
 * Nothing ever measured one, and the first measurement is the reason this file
 * exists: a mid-game swordsman lasted a hundred and thirty seconds on the
 * EASIEST region and under a minute on the deep ones, dying before its own
 * boss had landed twice — a run a third of the length it was designed for.
 *
 * That measurement is also why the corrida is a RIFT now rather than a clock.
 * A gate timed to the clock — 4:30, say — meant four of the five regions could
 * never once meet their own boss, because their runs simply did not last that
 * long. A bar fed by KILLS is a distance instead of a clock, and a distance
 * self-adjusts: the Pass is dense, so its bar fills fast even though runs
 * there are short. See `RunState.riftValue` in sim/combat.ts and
 * docs/CORRIDAS.md for the reasoning in full.
 *
 * This file does two jobs now:
 *
 *   MEASURE   how long a rift takes to fill and clear at each region's
 *             CURRENT `riftBase` (data/regions.ts), against the same yardstick
 *             the old clock used — a few minutes, not a few seconds.
 *   CALIBRATE with `--calibrate`, estimate a `riftBase` for every region from
 *             a clean run (target left at Infinity) and print it, so a change
 *             to the roster or the ramp can be re-measured rather than
 *             re-guessed. The value it prints is what belongs in
 *             data/regions.ts.
 *
 * Two pilots for the same reason `artsBalance.mts` has two: kite never stands
 * still and duel never stops turning, and a single one of them decides the
 * answer. Neither is a player; a real one lands between them.
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
import { applyArts, attune, equippedIds } from '../src/sim/arts'
import { SURROUND_RADIUS, createSense, senseConditions } from '../src/sim/conditions'
import { emptyAttributes } from '../src/meta/character'
import { EQUIPPED_ARTS, MAX_ART_LEVEL } from '../src/data/arts'

const SEEDS = [4242, 90210, 31337, 8675309, 1618, 271828]
/** Points a mid-game character would have spent. The same set artsBalance uses. */
const SPENT = { ...emptyAttributes(), body: 6, edge: 6, swift: 4, spirit: 2 }
/** Long enough that the harness never truncates a run the player would still be in. */
const CEILING = 1200

/** What a finished build costs, in 感悟. Four arts, grade one to five. */
export const INSIGHT_TO_FINISH = EQUIPPED_ARTS * (MAX_ART_LEVEL - 1)
/** Roughly how long one rift should take to fill and clear. */
export const TARGET_SECONDS = 300

export type Pilot = (t: number) => [number, number]
export const PILOTS: Array<[string, Pilot]> = [
  ['kite', (t) => [Math.cos(t * 0.9), Math.sin(t * 0.9)]],
  [
    'duel',
    (t) => {
      const phase = t % 4
      if (phase < 1.5) return [1, 0]
      if (phase < 2) return [0, 0]
      if (phase < 3.5) return [-1, 0]
      return [0, 0]
    },
  ],
]

export interface Row {
  secs: number
  insight: number
  kills: number
  /** True once averaged: how often the gate actually opened within CEILING. */
  cleared: number
  /** Qi earned by the ceiling — the number `--calibrate` turns into riftBase. */
  qiAtCeiling: number
}

/**
 * Plays one region with one pilot, `SEEDS.length` times, and averages.
 *
 * `riftTarget`, when finite, is what `RunState.riftTarget` is set to before
 * play starts — this is what lets the same function both measure a calibrated
 * region (pass its `riftBase`) and calibrate an uncalibrated one (pass
 * `Infinity` and read `qiAtCeiling` back out).
 */
export function play(
  regionId: string,
  fly: Pilot,
  riftTarget: number,
  /**
   * Which class to measure. Defaults to the first, as it always did.
   *
   * It became a parameter the day six weapons became two: with a roster of six
   * near-identical weapons, measuring one was a fair sample of all of them.
   * With one sweeper and one thrower it is a sample of half the game, and
   * calibrating a rift against half the game is how you ship a gate one class
   * cannot reach.
   */
  weaponId: string = WEAPONS[0]!.id,
  /**
   * How long to let a run go before giving up on it, in seconds.
   *
   * A parameter because the balance tests need a much shorter one than this
   * tool does: measuring pure survival with no gate means every run goes the
   * full distance, and at the module's own 1200s that is minutes of simulation
   * per region — fine for a tool somebody runs on purpose, far too slow for a
   * suite that has to stay runnable.
   */
  ceiling: number = CEILING,
  /**
   * How many seeds to average over. Fewer is noisier and much faster.
   *
   * The balance tests need this. Once a late crowd is on the grid the
   * simulation runs at a few thousand ticks a second, so six seeds of a
   * four-minute window is a couple of minutes of wall clock PER ASSERTION —
   * which turned a seven-second suite into a several-minute one the moment
   * those tests started measuring survival instead of time-to-clear. Their
   * bounds are loose enough to survive the extra noise. This tool keeps all
   * six, because a number somebody is going to paste into regions.ts should
   * not be the cheap version.
   */
  seeds: readonly number[] = SEEDS,
): Row {
  const region = REGIONS.find((r) => r.id === regionId)!
  const out: Row = { secs: 0, insight: 0, kills: 0, cleared: 0, qiAtCeiling: 0 }

  for (const seed of seeds) {
    const weapon = WEAPONS.find((w) => w.id === weaponId) ?? WEAPONS[0]!
    const player = createPlayer(0, 0)
    const swarm = new Swarm(new Rng(seed), region)
    const motes = new Motes()
    const bolts = new Bolts()
    const hazards = new Hazards()
    const rng = new Rng(seed ^ 0x5bf03635)
    const stats = deriveStats(new Map(), { spent: SPENT, weapon, worn: [] })
    const live = deriveStats(new Map(), { spent: SPENT, weapon, worn: [] })
    const run = createRun(stats.slashInterval)
    run.hp = stats.maxHp
    run.riftTarget = riftTarget
    const sense = createSense()
    // 珍 across every slot — a middling real kit. See tools/artsBalance.mts.
    const carried = attune(equippedIds({}, weapon.id), 2, [2, 2, 2, 2])
    const rule = region.rule
    const drift = rule.drift ?? 0
    let insight = 0
    let t = 0

    for (let i = 0; i < Math.round(ceiling / TICK_S); i++) {
      if (run.over || run.gateCleared) break
      t += TICK_S
      const [ix, iy] = fly(run.elapsed)
      const wind = rule.driftPeriod ? (t / rule.driftPeriod) * Math.PI * 2 : 0
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
      while (run.pendingLevelUps > 0) {
        run.pendingLevelUps--
        insight++
      }
      updateCombat(
        { run, player, swarm, motes, bolts, hazards, stats: live, rng, depth: region.depth },
        TICK_S,
      )
    }
    out.secs += run.elapsed
    out.insight += insight
    out.kills += run.kills
    out.cleared += run.gateCleared ? 1 : 0
    out.qiAtCeiling += run.riftValue
  }
  const n = seeds.length
  return {
    secs: out.secs / n,
    insight: out.insight / n,
    kills: out.kills / n,
    cleared: out.cleared / n,
    qiAtCeiling: out.qiAtCeiling / n,
  }
}

// Printing is guarded so `docs/corridas` can IMPORT this file and measure with
// the same code the table prints. A figure drawn from remembered numbers is a
// figure that goes stale the first time the ramp is touched.
if (process.argv[1]?.endsWith('runLength.mts')) {
  const calibrating = process.argv.includes('--calibrate')
  const searching = process.argv.includes('--search')

  if (searching) {
    /**
     * The search that actually sets `riftBase`, restored.
     *
     * data/regions.ts says these values "come from runLength.mts's own binary
     * search", and they no longer did — only `--calibrate` survived, which
     * measures something else entirely: the qi a clean run earns in five
     * minutes. That number is roughly a whole build's lifetime earnings, and
     * the same comment records that setting riftBase straight from it was
     * tried and was wrong, because a boss calibrated to it arrives the instant
     * before the player was going to die anyway.
     *
     * The criterion is the one that comment states: the LARGEST target at
     * which an unequipped, mid-cultivation swordsman clears the gate about
     * half the time against the ENGAGED pilot. Kiting should still almost
     * never clear — that is the point of the gate.
     */
    // How often the engaged pilot must clear. The default of 0.5 is the old
    // criterion — the largest target a mid swordsman clears about half the
    // time — which sets a gate that is a genuine test. Pass `--aim 0.9` for
    // the other design: a gate that reliably OPENS at a chosen moment, after
    // which staying is the player's choice rather than the game's.
    const aimArg = process.argv.indexOf('--aim')
    const AIM = aimArg > 0 ? Number(process.argv[aimArg + 1]) : 0.5
    /**
     * Search on TIME instead of on clear rate, when asked.
     *
     * These are two different questions and I ran the wrong one first.
     * Maximising the target subject to "clears 90% of the time" finds the
     * BIGGEST gate a swordsman can still beat — 258s on the Post Road — which
     * is a fine question and not the one being asked. The design says the gate
     * should OPEN at a chosen moment, after which staying is the player's
     * choice; that is a search for the target whose run lands near a number of
     * seconds, with clearing taken as a constraint rather than as the goal.
     */
    const secsArg = process.argv.indexOf('--secs')
    const WANT_SECS = secsArg > 0 ? Number(process.argv[secsArg + 1]) : 0
    /**
     * The search is a nested loop over an expensive thing, so it gets the
     * cheap settings — four seeds and a ceiling far below the module's own.
     *
     * At six seeds and 1200s it did not finish inside ten minutes, twice. The
     * ceiling is the bigger lever of the two: a search for the target that
     * opens a gate around a hundred seconds learns nothing from letting a run
     * that has not cleared by six minutes carry on to twenty, and every one of
     * those extra seconds is a late crowd on the grid at a few thousand ticks
     * a second.
     */
    const SEARCH_CEILING = 360
    const SEARCH_SEEDS = SEEDS.slice(0, 4)
    console.log(
      `A procurar riftBase. ${SEARCH_SEEDS.length} seeds, tecto ${SEARCH_CEILING}s. ` +
        (WANT_SECS > 0
          ? `Alvo: o portão abre por volta dos ${WANT_SECS}s, limpando >=${AIM * 100}%.\n`
          : `Alvo: o maior em que o piloto "duel" limpa ~${AIM * 100}% das vezes.\n`),
    )
    console.log('região              riftBase   limpou   secs/duel   secs/kite   kite limpou')
    for (const region of REGIONS) {
      let lo = 1
      // Generous and FIXED, not a multiple of the current value. Anchoring the
      // ceiling to `riftBase * 8` capped the search below the answer the first
      // time it ran: two regions reported 100% clears at the value it found,
      // which is the tell that the bound bound the result rather than the game
      // did. A search whose ceiling moves with the thing being searched for
      // cannot report that it ran out of room.
      let hi = 4096
      let best = lo
      let bestRow = play(region.id, PILOTS[1]![1], lo, WEAPONS[0]!.id, SEARCH_CEILING, SEARCH_SEEDS)
      // Eight steps, not twelve: each one now plays every weapon, so a step
      // costs double. Eight over 1..4096 lands within about sixteen, far finer
      // than four seeds of a chaotic simulation can resolve anyway.
      for (let step = 0; step < 8; step++) {
        const mid = Math.round((lo + hi) / 2)
        // EVERY weapon, and the worst of them decides.
        //
        // `play` defaults to the first weapon, and searching with that default
        // is how this produced a Ghost Market target of 1402 that the sweeper
        // reached in 110s and the thrower could not reach at all. The warning
        // is written on `play`'s own weapon parameter — "calibrating a rift
        // against half the game is how you ship a gate one class cannot
        // reach" — and I called the function without reading it. A gate is a
        // floor for the whole roster, so the search has to clear it with the
        // class that finds it hardest.
        const rows = WEAPONS.map((w) =>
          play(region.id, PILOTS[1]![1], mid, w.id, SEARCH_CEILING, SEARCH_SEEDS),
        )
        const row = rows.reduce((worst, r) => (r.secs > worst.secs ? r : worst))
        const everyoneClears = rows.every((r) => r.cleared >= AIM)
        if (WANT_SECS > 0) {
          // Time rises with the target, so this is still an ordered search:
          // too quick means the gate is too cheap, too slow means too dear. A
          // run that fails to clear counts as too slow, which keeps the answer
          // inside the range a player can actually beat.
          if (!everyoneClears || row.secs > WANT_SECS) {
            hi = mid - 1
          } else {
            best = mid
            bestRow = row
            lo = mid + 1
          }
        } else if (everyoneClears) {
          best = mid
          bestRow = row
          lo = mid + 1
        } else {
          hi = mid - 1
        }
        if (lo > hi) break
      }
      const kite = play(region.id, PILOTS[0]![1], best, undefined, SEARCH_CEILING, SEARCH_SEEDS)
      console.log(
        `${region.name.padEnd(18)} ${String(best).padStart(8)}   ` +
          `${(bestRow.cleared * 100).toFixed(0).padStart(5)}%   ` +
          `${bestRow.secs.toFixed(0).padStart(9)}   ${kite.secs.toFixed(0).padStart(9)}   ` +
          `${(kite.cleared * 100).toFixed(0).padStart(10)}%   riftBase: ${best},`,
      )
    }
    process.exit(0)
  }


  if (calibrating) {
    console.log(
      `Calibrando riftBase. ${SEEDS.length} seeds, espadachim a meio, ${TARGET_SECONDS}s sem alvo — ` +
        `o 感悟 acumulado nesse tempo é o valor a pôr em data/regions.ts.\n`,
    )
    console.log('região              感悟/kite  感悟/duel  riftBase sugerido (média)')
    for (const region of REGIONS) {
      const kite = play(region.id, PILOTS[0]![1], Infinity)
      const duel = play(region.id, PILOTS[1]![1], Infinity)
      // Capped at TARGET_SECONDS worth of qi even if the harness ran past it —
      // `qiAtCeiling` is read at whichever came first, `run.over` or the loop
      // ceiling, and a build that never dies would otherwise keep accumulating
      // past the window this is meant to measure.
      const suggested = Math.round((kite.qiAtCeiling + duel.qiAtCeiling) / 2)
      console.log(
        `${region.name.padEnd(18)} ${kite.qiAtCeiling.toFixed(0).padStart(9)} ` +
          `${duel.qiAtCeiling.toFixed(0).padStart(10)}  ${String(suggested).padStart(8)}` +
          `   riftBase: ${suggested},`,
      )
    }
    process.exit(0)
  }

  console.log(
    `A fenda, medida. ${SEEDS.length} seeds, espadachim a meio (${Object.entries(SPENT)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k} ${v}`)
      .join(' ')}), sem equipamento.\n` +
      `Alvo: ${TARGET_SECONDS}s para encher e limpar, ${INSIGHT_TO_FINISH} 感悟 lá chegado, um chefe.\n`,
  )

  for (const [name, fly] of PILOTS) {
    console.log(`piloto "${name}"`)
    console.log('  região              secs   感悟   kills   limpou?   até ao alvo')
    for (const region of REGIONS) {
      const r = play(region.id, fly, region.riftBase)
      const share = (r.secs / TARGET_SECONDS) * 100
      console.log(
        `  ${region.name.padEnd(18)} ${r.secs.toFixed(0).padStart(4)} ` +
          `${r.insight.toFixed(1).padStart(6)} ${r.kills.toFixed(0).padStart(7)} ` +
          `${(r.cleared * 100).toFixed(0).padStart(6)}%   ${share.toFixed(0).padStart(3)}%`,
      )
    }
    console.log()
  }

  console.log(
    'Uma fenda que nunca limpa não tem forma nenhuma: não tem princípio, meio\n' +
      'nem fim, só um contador que pára. E uma build de quatro artes precisa de\n' +
      `${INSIGHT_TO_FINISH} 感悟 para ficar feita — abaixo disso o jogador nunca chega a ver\n` +
      'aquilo que escolheu na aba 法.\n\n' +
      'Para recalibrar riftBase depois de mexer no roster ou na rampa:\n' +
      '  npx tsx tools/runLength.mts --calibrate',
  )
}
