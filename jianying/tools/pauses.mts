/**
 * How often does the game STOP?
 *
 * A level-up freezes the field until a card is tapped. That is correct — being
 * surrounded while reading three cards would be indefensible — but it means the
 * number of level-ups per expedition is also the number of times the game halts
 * and waits for the player. Past a certain rate that stops reading as a reward
 * and starts reading as the game blocking.
 *
 * The weapon rewrite changed kill rates by up to 40%, and the Insight curve was
 * tuned against the jian, so this measures every weapon against it.
 */
import { TICK_S } from '../src/core/loop'
import { Rng } from '../src/core/rng'
import { WEAPONS } from '../src/data/weapons'
import { regionAt } from '../src/data/regions'
import { emptyAttributes } from '../src/meta/character'
import { createRun, updateCombat } from '../src/sim/combat'
import { Swarm } from '../src/sim/enemies'
import { Hazards } from '../src/sim/hazards'
import { deriveStats } from '../src/sim/loadout'
import { Motes } from '../src/sim/pickups'
import { Bolts } from '../src/sim/projectiles'
import { createPlayer, updatePlayer } from '../src/sim/player'

const KITE = (t: number): [number, number] => [Math.cos(t * 0.25) * 0.3, Math.sin(t * 0.25) * 0.3]

for (const weapon of WEAPONS) {
  const rows: string[] = []
  for (const seed of [4242, 90210, 31337]) {
    const player = createPlayer(0, 0)
    const swarm = new Swarm(new Rng(seed), regionAt(1))
    const motes = new Motes()
    const bolts = new Bolts()
    const hazards = new Hazards()
    const rng = new Rng(seed ^ 0x5bf03635)
    const run = createRun(weapon.interval)
    const stats = deriveStats(new Map(), { spent: emptyAttributes(), weapon, worn: [] })
    run.hp = stats.maxHp

    let pauses = 0
    // Gaps between pauses, so a burst of five in two seconds is visible rather
    // than being averaged into a comfortable-looking mean.
    let lastPause = 0
    let shortest = Infinity
    let burst = 0

    for (let i = 0; i < Math.round(600 / TICK_S); i++) {
      if (run.over) break
      const [ix, iy] = KITE(run.elapsed)
      updatePlayer(player, ix, iy, TICK_S, stats.moveSpeed)
      swarm.update(player.x, player.y, run.elapsed, TICK_S, hazards)
      if (run.pendingLevelUps > 0) {
        pauses += run.pendingLevelUps
        const gap = run.elapsed - lastPause
        if (lastPause > 0) {
          shortest = Math.min(shortest, gap)
          if (gap < 5) burst++
        }
        lastPause = run.elapsed
        run.pendingLevelUps = 0
      }
      updateCombat({ run, player, swarm, motes, bolts, hazards, stats, rng }, TICK_S)
    }
    rows.push(
      `${run.elapsed.toFixed(0).padStart(4)}s ${String(run.kills).padStart(4)}k ` +
        `${String(pauses).padStart(3)} pauses  ${(run.elapsed / Math.max(1, pauses)).toFixed(1)}s apart  ` +
        `min ${shortest === Infinity ? '-' : shortest.toFixed(1)}s  ${burst} under 5s`,
    )
  }
  console.log(`\n${weapon.name}`)
  for (const r of rows) console.log(`  ${r}`)
}
