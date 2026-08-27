/**
 * Combat: the sweeping slash, the arts, contact damage, and the end of a run.
 *
 * The player's only input is movement. Attacking is automatic and aimed at the
 * nearest threat, which is what makes the genre work one-handed: the tactical
 * decision is where to *stand* — what to pull the crowd into, and what to walk
 * away from — rather than when to press a button.
 */
import { contactDamage, rouse, type Swarm } from './enemies'
import type { Player } from './player'
import type { Motes } from './pickups'
import type { Bolts } from './projectiles'
import { BOLT_RADIUS } from './projectiles'
import type { Hazards } from './hazards'
import type { Stats } from './loadout'
import type { Rng } from '../core/rng'
import { xpForLevel } from '../data/techniques'
import { dropChance, rollDrop } from '../data/items'
import { DEFAULT_WEAPON } from '../data/weapons'

/**
 * The sweep's numbers no longer live here.
 *
 * Damage, interval, reach and arc all come from the equipped weapon now — see
 * data/weapons.ts — because that is what makes a class felt rather than
 * labelled: the thumb is entirely spent on movement, so the shape of the
 * automatic sweep IS how the game plays. A single set of constants here would
 * have made every school the same fight with a different name on it.
 *
 * One lesson from those constants is worth keeping, since it constrains every
 * weapon added later: the opening weapon must fell the opening enemy in one
 * sweep. At 7 damage a bandit took two sweeps while three arrived every second,
 * so the swarm grew faster than it could be cut down however well the player
 * moved. That is not a difficulty curve, it is a wall.
 */

/** Enemies beyond this are ignored when choosing what to aim at. */
const TARGET_SEARCH_RANGE = 260

/** Seconds the visual sweep lasts. Purely cosmetic; the hit is instantaneous. */
export const SLASH_VISUAL = 0.22

export const PLAYER_MAX_HP = 120

/**
 * Seconds of invulnerability after taking a hit.
 *
 * Without this, standing inside a crowd applies every enemy's damage every
 * single tick and the player evaporates in a fraction of a second with no
 * chance to read what happened.
 */
export const HURT_IMMUNITY = 0.85

/** The player's collision radius, in world units. */
export const PLAYER_RADIUS = 11

/** Radius of an orbiting blade's hitbox. */
export const ORBIT_RADIUS = 74
const ORBIT_BLADE_RADIUS = 15
const ORBIT_SPEED = 2.1

/** Seconds an orbiting blade cannot re-hit the same enemy. */
const ORBIT_RECHARGE = 0.4

export interface RunState {
  hp: number
  elapsed: number
  kills: number
  immunity: number
  slashCooldown: number
  slashVisual: number
  /** Where the blade currently points — the nearest threat, or facing. */
  aimX: number
  aimY: number
  slashAimX: number
  slashAimY: number

  // --- progression ---
  xp: number
  level: number
  /** Level-ups earned but not yet spent. The game pauses while > 0. */
  pendingLevelUps: number

  // --- arts ---
  orbitAngle: number
  boltCooldown: number
  novaCooldown: number
  /** Counts down while a shockwave is being drawn. */
  novaVisual: number
  novaVisualRadius: number

  /**
   * Name of whatever last took health off the player, and what finished them.
   *
   * The reported blocker was "understanding what is happening", and dying with
   * no idea what did it is the sharpest form of that. A run that ends with
   * "felled by Crossbow Hand" teaches the player to watch the back line; a run
   * that ends with a blank screen teaches nothing.
   */
  lastHurtBy: string | null
  killedBy: string | null

  over: boolean
}

/** `firstSweep` delays the opening sweep by the equipped weapon's interval. */
export function createRun(firstSweep = DEFAULT_WEAPON.interval): RunState {
  return {
    hp: PLAYER_MAX_HP,
    elapsed: 0,
    kills: 0,
    immunity: 0,
    slashCooldown: firstSweep,
    slashVisual: 0,
    aimX: 1,
    aimY: 0,
    slashAimX: 1,
    slashAimY: 0,
    xp: 0,
    level: 1,
    pendingLevelUps: 0,
    orbitAngle: 0,
    boltCooldown: 1.5,
    novaCooldown: 4.2,
    novaVisual: 0,
    novaVisualRadius: 0,
    lastHurtBy: null,
    killedBy: null,
    over: false,
  }
}

/**
 * Where the simulation reports what just happened.
 *
 * The simulation must stay renderer-agnostic — it runs headless in the balance
 * tests, where there is no screen to draw a number on — so it reports through
 * this sink rather than reaching for a Graphics object. An absent sink is the
 * normal case in tests and costs one null check per hit.
 */
export interface CombatEvents {
  /** An enemy took `amount` at (x, y). `killed` when that was the last of it. */
  hit(x: number, y: number, amount: number, killed: boolean): void
  /** The player took `amount` from something named `source`. */
  hurt(amount: number, source: string): void
  /** Something dropped equipment at (x, y). */
  drop?(x: number, y: number, itemId: string): void
}

/** Shortest absolute angular distance between two directions, in radians. */
function angleBetween(ax: number, ay: number, bx: number, by: number): number {
  const dot = ax * bx + ay * by
  const det = ax * by - ay * bx
  return Math.abs(Math.atan2(det, dot))
}

/**
 * Points the blade at the closest enemy, falling back to the direction of
 * travel when the field is clear.
 *
 * Aiming along movement was the original design and it did not survive contact
 * with the simulation: enemies chase, so they sit BEHIND a moving player, and
 * a forward-facing arc swept empty ground. Headless runs scored zero kills
 * across every style except standing perfectly still.
 */
function chooseAim(run: RunState, player: Player, swarm: Swarm): void {
  let bestDist = TARGET_SEARCH_RANGE * TARGET_SEARCH_RANGE
  let bestX = 0
  let bestY = 0
  let found = false

  for (let i = 0; i < swarm.pool.size; i++) {
    const e = swarm.pool.at(i)
    const dx = e.x - player.x
    const dy = e.y - player.y
    const d2 = dx * dx + dy * dy
    if (d2 < bestDist) {
      bestDist = d2
      bestX = dx
      bestY = dy
      found = true
    }
  }

  if (found) {
    const d = Math.sqrt(bestDist) || 1
    run.aimX = bestX / d
    run.aimY = bestY / d
  } else {
    run.aimX = player.faceX
    run.aimY = player.faceY
  }
}

export interface CombatContext {
  run: RunState
  player: Player
  swarm: Swarm
  motes: Motes
  bolts: Bolts
  hazards: Hazards
  stats: Stats
  rng: Rng
  /** Optional; the headless balance tests run without one. */
  events?: CombatEvents
  /** Expedition depth, which widens the drop table. */
  depth?: number
  /** Item ids already owned, so drops can favour something new. */
  owned?: ReadonlySet<string>
}

/** Shared, so the hot path does not allocate a set per kill. */
const EMPTY_OWNED: ReadonlySet<string> = new Set()

/** Applies damage to the enemy at `index`, dropping qi and scoring if it dies. */
function damageEnemy(ctx: CombatContext, index: number, amount: number): boolean {
  const e = ctx.swarm.pool.at(index)
  e.hp -= amount
  e.hitFlash = 0.12
  // Being struck is the only thing that turns a pilgrim. Done before the death
  // check, so one that dies to the blow never gets to be angry about it.
  rouse(e)
  // Reported at the body's position before the pool recycles it, so a killing
  // blow's number appears where the enemy died rather than where the next
  // spawn happens to land.
  ctx.events?.hit(e.x, e.y, amount, e.hp <= 0)
  if (e.hp > 0) return false

  // A boss is worth a scattering of qi rather than one mote, so clearing it
  // visibly pays — and so the level it grants arrives as a shower.
  const drops = Math.min(12, e.kind.qi)
  for (let d = 0; d < drops; d++) {
    ctx.motes.drop(e.x, e.y, Math.ceil(e.kind.qi / drops), ctx.rng)
  }
  // Equipment, rarely — and always from the body, before the pool recycles it.
  // A boss never leaves empty-handed: a fight that long resolving into the same
  // nothing as a bandit is the surest way to make it feel pointless.
  const depth = ctx.depth ?? 1
  const boss = e.kind.behaviour === 'boss'
  if (ctx.events?.drop && (boss || ctx.rng.next() < dropChance(depth))) {
    const item = rollDrop(depth, ctx.rng.next(), ctx.owned ?? EMPTY_OWNED)
    if (item) ctx.events.drop(e.x, e.y, item.id)
  }

  // Splitting happens before the corpse is released, since it reads the
  // position that release would recycle.
  ctx.swarm.splitOnDeath(e, ctx.run.elapsed)
  ctx.swarm.kill(index)
  ctx.run.kills++
  return true
}

/** Advances one tick of combat. */
export function updateCombat(ctx: CombatContext, dt: number): void {
  const { run, player, swarm, stats } = ctx
  // A pending level-up freezes the world: the player is choosing, and enemies
  // walking into them while a menu is open would be indefensible.
  if (run.over || run.pendingLevelUps > 0) return

  run.elapsed += dt
  if (run.immunity > 0) run.immunity = Math.max(0, run.immunity - dt)
  if (run.slashVisual > 0) run.slashVisual = Math.max(0, run.slashVisual - dt)
  if (run.novaVisual > 0) run.novaVisual = Math.max(0, run.novaVisual - dt)

  chooseAim(run, player, swarm)
  const aimX = run.aimX
  const aimY = run.aimY

  // --- qi motes --------------------------------------------------------
  const gained = ctx.motes.update(player.x, player.y, stats.pickupRadius, dt)
  if (gained > 0) {
    run.xp += gained
    // A loop, not an if: a dense harvest can cross several thresholds at once,
    // and swallowing the extra levels would quietly rob the player.
    while (run.xp >= xpForLevel(run.level)) {
      run.xp -= xpForLevel(run.level)
      run.level++
      run.pendingLevelUps++
    }
  }

  // --- the sweep -------------------------------------------------------
  run.slashCooldown -= dt
  if (run.slashCooldown <= 0) {
    run.slashCooldown += stats.slashInterval
    run.slashVisual = SLASH_VISUAL
    run.slashAimX = aimX
    run.slashAimY = aimY

    // Iterating backwards lets a dead enemy be released without disturbing the
    // indices still to be visited.
    for (let i = swarm.pool.size - 1; i >= 0; i--) {
      const e = swarm.pool.at(i)
      const dx = e.x - player.x
      const dy = e.y - player.y
      const distance = Math.hypot(dx, dy)
      if (distance > stats.slashRange + e.kind.radius) continue
      if (distance > 0.001) {
        if (angleBetween(aimX, aimY, dx / distance, dy / distance) > stats.slashHalfAngle) continue
      }
      damageEnemy(ctx, i, stats.slashDamage)
    }
  }

  // --- guardian blades -------------------------------------------------
  if (stats.orbitBlades > 0) {
    run.orbitAngle += ORBIT_SPEED * dt
    const step = (Math.PI * 2) / stats.orbitBlades
    for (let b = 0; b < stats.orbitBlades; b++) {
      const a = run.orbitAngle + step * b
      const bx = player.x + Math.cos(a) * ORBIT_RADIUS
      const by = player.y + Math.sin(a) * ORBIT_RADIUS
      for (let i = swarm.pool.size - 1; i >= 0; i--) {
        const e = swarm.pool.at(i)
        // Per-enemy cooldown, or a blade parked on a slow enemy would delete it
        // sixty times a second.
        if (e.orbitImmunity > 0) continue
        const reach = ORBIT_BLADE_RADIUS + e.kind.radius
        const dx = e.x - bx
        const dy = e.y - by
        if (dx * dx + dy * dy > reach * reach) continue
        e.orbitImmunity = ORBIT_RECHARGE
        damageEnemy(ctx, i, stats.orbitDamage)
      }
    }
  }

  // --- sword qi --------------------------------------------------------
  if (stats.boltInterval > 0) {
    run.boltCooldown -= dt
    if (run.boltCooldown <= 0) {
      run.boltCooldown += stats.boltInterval
      ctx.bolts.fire(player.x, player.y - 20, aimX, aimY, stats.boltDamage, 2)
    }
  }
  ctx.bolts.update(dt)

  for (let bi = ctx.bolts.pool.size - 1; bi >= 0; bi--) {
    const bolt = ctx.bolts.pool.at(bi)
    for (let i = swarm.pool.size - 1; i >= 0; i--) {
      if (bolt.pierce <= 0) break
      const e = swarm.pool.at(i)
      const reach = BOLT_RADIUS + e.kind.radius
      const dx = e.x - bolt.x
      const dy = e.y - bolt.y
      if (dx * dx + dy * dy > reach * reach) continue
      bolt.pierce--
      damageEnemy(ctx, i, bolt.damage)
    }
  }

  // --- thunder palm ----------------------------------------------------
  if (stats.novaInterval > 0) {
    run.novaCooldown -= dt
    if (run.novaCooldown <= 0) {
      run.novaCooldown += stats.novaInterval
      run.novaVisual = 0.42
      run.novaVisualRadius = stats.novaRadius
      for (let i = swarm.pool.size - 1; i >= 0; i--) {
        const e = swarm.pool.at(i)
        const reach = stats.novaRadius + e.kind.radius
        const dx = e.x - player.x
        const dy = e.y - player.y
        if (dx * dx + dy * dy > reach * reach) continue
        damageEnemy(ctx, i, stats.novaDamage)
      }
    }
  }

  // --- enemy projectiles -----------------------------------------------
  ctx.hazards.update(dt)
  if (run.immunity <= 0) {
    const shot = ctx.hazards.strike(player.x, player.y, PLAYER_RADIUS)
    if (shot > 0) {
      const source = ctx.hazards.lastStrikeSource || 'a stray bolt'
      run.hp -= shot
      run.immunity = HURT_IMMUNITY
      run.lastHurtBy = source
      ctx.events?.hurt(shot, source)
      if (run.hp <= 0) {
        run.hp = 0
        run.over = true
        run.killedBy = source
        return
      }
    }
  }

  // --- contact damage --------------------------------------------------
  if (run.immunity <= 0) {
    for (let i = 0; i < swarm.pool.size; i++) {
      const e = swarm.pool.at(i)
      const dx = e.x - player.x
      const dy = e.y - player.y
      const reach = e.kind.radius + PLAYER_RADIUS
      // A sleeping lurker and an unstruck pilgrim deal nothing, so walking
      // through either is safe — which is what makes both behaviours a real
      // question rather than a differently-shaped chaser.
      const damage = contactDamage(e)
      if (damage > 0 && dx * dx + dy * dy <= reach * reach) {
        run.hp -= damage
        run.immunity = HURT_IMMUNITY
        run.lastHurtBy = e.kind.name
        ctx.events?.hurt(damage, e.kind.name)
        if (run.hp <= 0) {
          run.hp = 0
          run.over = true
          run.killedBy = e.kind.name
        }
        // One hit per immunity window, no matter how many bodies are touching.
        break
      }
    }
  }
}
