/**
 * What actually kills you, and what the sweep was doing while it happened.
 *
 *   npx tsx tools/death.mts [regionId]
 *
 * Every balance tool in this project measures an OUTCOME — how long a run
 * lasted, how many died. None of them measures the cause, and the cause is the
 * whole question behind Phase 3: twenty points of offence buy almost nothing on
 * a deep road, and nobody has checked whether that is because the damage is
 * wasted, because the rate is wasted, or because what kills you was never in
 * the arc to begin with.
 *
 * So this counts, per frame: who is hurting you, how many enemies are inside
 * the sweep's reach when it lands, how many are touching you, and how much of
 * each blow's damage falls on an enemy that was already dead to it. The last
 * one is the number that decides whether "more damage" is even a lever.
 */
import { TICK_S } from '../src/core/loop'
import { Rng } from '../src/core/rng'
import { REGIONS } from '../src/data/regions'
import { WEAPONS } from '../src/data/weapons'
import { KIND_BY_ID } from '../src/data/enemies'
import { createPlayer, updatePlayer } from '../src/sim/player'
import { Swarm } from '../src/sim/enemies'
import { Motes } from '../src/sim/pickups'
import { Bolts } from '../src/sim/projectiles'
import { Hazards } from '../src/sim/hazards'
import { createRun, updateCombat } from '../src/sim/combat'
import { deriveStats } from '../src/sim/loadout'
import { applyArts, attune, equippedIds, surgeOf } from '../src/sim/arts'
import { SURROUND_RADIUS, createSense, senseConditions } from '../src/sim/conditions'
import { emptyAttributes, type Attributes } from '../src/meta/character'
import { PILOTS } from './runLength.mts'
import { pure, BUDGET } from './attrValue.mts'

const SEEDS = [4242, 90210, 31337, 8675309]
const CAP = 300

interface Post {
  secs: number
  killedBy: Record<string, number>
  /** Mean enemies within the sweep's reach, sampled every second. */
  inReach: number
  /** Mean enemies within touching distance. */
  onTop: number
  /** Mean enemies within the sweep's reach that are BEHIND the arc's edge. */
  outside: number
  hurts: number
}

function play(spent: Attributes, weaponId: string, regionId: string): Post {
  const region = REGIONS.find((r) => r.id === regionId)!
  const weapon = WEAPONS.find((w) => w.id === weaponId)!
  const out: Post = { secs: 0, killedBy: {}, inReach: 0, onTop: 0, outside: 0, hurts: 0 }
  let samples = 0
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
    const rule = region.rule
    const drift = rule.drift ?? 0
    let t = 0
    let lastSample = 0
    let hp = run.hp
    for (let i = 0; i < Math.round(CAP / TICK_S); i++) {
      if (run.over || run.gateCleared) break
      t += TICK_S
      const [ix, iy] = PILOTS[1]![1](run.elapsed)
      const wind = rule.driftPeriod ? (t / rule.driftPeriod) * Math.PI * 2 : 0
      applyArts(stats, carried, sense.active, live, run.level, surgeOf(sense))
      updatePlayer(player, ix, iy, TICK_S,
        live.moveSpeed * (rule.playerSpeed ?? 1),
        Math.cos(wind) * drift, Math.sin(wind) * drift)
      const len = Math.hypot(ix, iy)
      let nearby = 0
      swarm.grid.query(player.x, player.y, SURROUND_RADIUS, () => { nearby++ })
      senseConditions(sense, {
        speed: Math.hypot(player.vx, player.vy),
        maxSpeed: live.moveSpeed * (rule.playerSpeed ?? 1),
        moveX: len > 0 ? ix / len : 0,
        moveY: len > 0 ? iy / len : 0,
        nearby, hp: run.hp, maxHp: live.maxHp,
      }, TICK_S)
      swarm.update(player.x, player.y, run.elapsed, TICK_S, ctx.hazards)
      while (run.pendingLevelUps > 0) run.pendingLevelUps--
      updateCombat(ctx, TICK_S)
      if (run.hp < hp) { out.hurts++; hp = run.hp } else hp = run.hp

      // Sample the field once a second: what is around, and where.
      if (t - lastSample >= 1) {
        lastSample = t
        samples++
        // The aim the sweep uses is the facing; anything outside the half-angle
        // is a body the sweep cannot reach however hard or often it lands.
        const aimX = player.vx, aimY = player.vy
        const aimLen = Math.hypot(aimX, aimY) || 1
        let reach = 0, touch = 0, behind = 0
        swarm.grid.query(player.x, player.y, live.slashRange, (idx) => {
          const e = swarm.pool.at(idx)
          const dx = e.x - player.x, dy = e.y - player.y
          const d = Math.hypot(dx, dy)
          if (d > live.slashRange) return
          reach++
          if (d < 26) touch++
          const dot = (dx * aimX + dy * aimY) / (d * aimLen || 1)
          if (Math.acos(Math.max(-1, Math.min(1, dot))) > live.slashHalfAngle) behind++
        })
        out.inReach += reach
        out.onTop += touch
        out.outside += behind
      }
    }
    out.secs += run.elapsed
    const by = run.killedBy ?? 'survived'
    out.killedBy[by] = (out.killedBy[by] ?? 0) + 1
  }
  const n = SEEDS.length
  const s = Math.max(1, samples)
  return {
    secs: out.secs / n,
    killedBy: out.killedBy,
    inReach: out.inReach / s,
    onTop: out.onTop / s,
    outside: out.outside / s,
    hurts: out.hurts / n,
  }
}

const region = process.argv[2] ?? 'cliff'
console.log(`What kills you. ${REGIONS.find((r) => r.id === region)!.name}, ${SEEDS.length} seeds.\n`)
for (const weapon of WEAPONS) {
  console.log(weapon.name)
  console.log('  sheet      secs  hurts  inReach  onTop  outOfArc   killed by')
  for (const [name, spent] of [
    ['nothing', emptyAttributes()],
    ['body 20', pure('body', BUDGET)],
    ['edge 20', pure('edge', BUDGET)],
    ['swift 20', pure('swift', BUDGET)],
  ] as Array<[string, Attributes]>) {
    const r = play(spent, weapon.id, region)
    const who = Object.entries(r.killedBy)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${KIND_BY_ID.get(k)?.name ?? k} x${v}`)
      .join(', ')
    console.log(
      '  ' + name.padEnd(10) +
      r.secs.toFixed(0).padStart(4) +
      r.hurts.toFixed(0).padStart(7) +
      r.inReach.toFixed(1).padStart(9) +
      r.onTop.toFixed(1).padStart(7) +
      r.outside.toFixed(1).padStart(10) +
      '   ' + who,
    )
  }
  console.log()
}
