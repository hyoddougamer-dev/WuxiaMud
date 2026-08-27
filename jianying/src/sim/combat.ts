/**
 * Combat: the sweeping slash, contact damage, and the end of a run.
 *
 * The player's only input is movement. Attacking is automatic and aimed at the
 * nearest threat, which is what makes the genre work one-handed: the tactical
 * decision is where to *stand* — what to pull the crowd into, and what to walk
 * away from — rather than when to press a button.
 */
import type { Swarm } from './enemies'
import type { Player } from './player'

/** Seconds between sweeps. */
export const SLASH_INTERVAL = 0.46

/** How far the arc reaches, in world units. */
export const SLASH_RANGE = 95

/** Half-width of the arc, in radians. ~100 degrees either side of the aim. */
export const SLASH_HALF_ANGLE = 1.75

/**
 * Enough to fell the opening enemy in one sweep.
 *
 * At 7 it took two sweeps per bandit while three arrived every second, so the
 * swarm grew faster than it could be cut down no matter how well the player
 * moved. A starting weapon that cannot clear the starting enemy is not a
 * difficulty curve, it is a wall.
 */
export const SLASH_DAMAGE = 11

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

export interface RunState {
  hp: number
  elapsed: number
  kills: number
  /** Counts down; while positive the player cannot be hurt again. */
  immunity: number
  /** Counts down to the next sweep. */
  slashCooldown: number
  /** Counts down while the sweep is being drawn. */
  slashVisual: number
  /** Where the blade currently points — the nearest threat, or facing. */
  aimX: number
  aimY: number
  /** Aim direction the last sweep was actually thrown along. */
  slashAimX: number
  slashAimY: number
  over: boolean
}

export function createRun(): RunState {
  return {
    hp: PLAYER_MAX_HP,
    elapsed: 0,
    kills: 0,
    immunity: 0,
    slashCooldown: SLASH_INTERVAL,
    slashVisual: 0,
    aimX: 1,
    aimY: 0,
    slashAimX: 1,
    slashAimY: 0,
    over: false,
  }
}

/**
 * Points the blade at the closest enemy, falling back to the direction of
 * travel when the field is clear.
 *
 * Aiming along movement was the original design and it did not survive contact
 * with the simulation: enemies chase, so they sit BEHIND a moving player, and
 * a forward-facing arc swept empty ground. Headless runs scored zero kills
 * across every style except standing perfectly still.
 *
 * Auto-targeting also fits the control scheme. With one thumb spent entirely on
 * movement, the interesting decision is where to *stand* — what to pull the
 * crowd into and what to walk away from — not which way to face.
 */
function chooseAim(
  run: RunState,
  player: Player,
  swarm: Swarm,
): void {
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

/** Shortest absolute angular distance between two directions, in radians. */
function angleBetween(ax: number, ay: number, bx: number, by: number): number {
  const dot = ax * bx + ay * by
  const det = ax * by - ay * bx
  return Math.abs(Math.atan2(det, dot))
}

/** Advances one tick of combat. */
export function updateCombat(run: RunState, player: Player, swarm: Swarm, dt: number): void {
  if (run.over) return

  run.elapsed += dt
  if (run.immunity > 0) run.immunity = Math.max(0, run.immunity - dt)
  if (run.slashVisual > 0) run.slashVisual = Math.max(0, run.slashVisual - dt)

  chooseAim(run, player, swarm)
  const aimX = run.aimX
  const aimY = run.aimY

  // --- the sweep -------------------------------------------------------
  run.slashCooldown -= dt
  if (run.slashCooldown <= 0) {
    run.slashCooldown += SLASH_INTERVAL
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
      // The enemy's own radius counts, so a big body is hit at its edge rather
      // than only when its centre is inside the arc.
      if (distance > SLASH_RANGE + e.kind.radius) continue
      // A body overlapping the player is always in the arc; at zero distance
      // there is no direction to compare against.
      if (distance > 0.001) {
        if (angleBetween(aimX, aimY, dx / distance, dy / distance) > SLASH_HALF_ANGLE) continue
      }

      e.hp -= SLASH_DAMAGE
      e.hitFlash = 0.12
      if (e.hp <= 0) {
        swarm.kill(i)
        run.kills++
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
      if (dx * dx + dy * dy <= reach * reach) {
        run.hp -= e.kind.damage
        run.immunity = HURT_IMMUNITY
        if (run.hp <= 0) {
          run.hp = 0
          run.over = true
        }
        // One hit per immunity window, no matter how many bodies are touching.
        break
      }
    }
  }
}

/** The player's collision radius, in world units. */
export const PLAYER_RADIUS = 11
