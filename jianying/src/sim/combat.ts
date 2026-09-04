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
import { BOLT_RADIUS, BOLT_SPEED } from './projectiles'
import type { Hazards } from './hazards'
import { afterArmour, type Stats } from './loadout'
import type { Rng } from '../core/rng'
import { xpForLevel } from '../data/techniques'
import { dropChance, rollDrop } from '../data/items'
import { BOSS_LUCK } from '../data/rarity'
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
/** Seconds between mends from 血, whatever the kill rate. */
const HEAL_INTERVAL = 0.5

/** Mends allowed per scrape, before the art has to be earned again. */
const HEAL_BUDGET = 8

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
  /** Guard remaining. Absorbs damage before health; refilled by felling. */
  guard: number
  /** Seconds since the last blow landed. Read by the HUD, not by guard. */
  calm: number
  elapsed: number
  kills: number
  immunity: number
  slashCooldown: number
  /**
   * Sweeps since the run began, for the crit counter.
   *
   * Counted rather than rolled — see Stats.critEvery. It also means a player
   * can learn the rhythm, which a chance never lets them do.
   */
  slashCount: number
  /**
   * Seconds until the next mend is allowed.
   *
   * 血 heals per kill, and the first measurement of it was a runaway: on the
   * Curved Dao it produced 525s against 179s for every other build, because
   * healing per kill scales with the CROWD, the crowd scales with time, and the
   * art's own condition (低 health) switches back on the moment you drop under
   * the line. The result was a player pinned just below the peril threshold,
   * healing faster than the game could hurt them, forever.
   *
   * A cooldown alone did not fix it — 525s became 523s — and neither did
   * shrinking the heal: at a quarter of the size it still produced 479s. That
   * is the tell that the problem is STRUCTURAL rather than a number. Any
   * sustained mend tied to a low-health condition is a stabilising loop: it
   * only has to match incoming damage at the threshold, and the player controls
   * how much damage comes in. Magnitude cannot beat a feedback loop.
   *
   * So the mend is bounded per SCRAPE instead of per second. The budget refills
   * only when the art is off — which is exactly when the player is no longer in
   * peril — so 血 is a second wind that has to be earned again by getting out
   * and getting back into trouble, rather than a floor you sit on.
   */
  healCooldown: number
  /** Mends left in this scrape. Refills only once the art switches off. */
  healBudget: number
  /** Seconds until a queued echo lands. 0 or less means none is queued. */
  echoTimer: number
  echoAimX: number
  echoAimY: number
  echoDamage: number
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

  // --- the rift ---------------------------------------------------------
  /**
   * Qi earned by killing, at the current floor. The gate — the fight — opens
   * once this reaches `riftTarget`. Reset to 0 on every push to a new floor.
   *
   * Fed by killing rather than by survival time on purpose: the old boss
   * timer measured how long the player had lasted, which rewarded running
   * away from a build that never got to act. A bar fed by kills cannot be
   * outrun — see docs/CORRIDAS.md for the measurement that forced the change.
   */
  riftValue: number
  /**
   * Qi needed to open the current floor's gate. Left at `Infinity` by
   * `createRun` — a caller that never sets it (the balance harnesses, mostly)
   * gets the old behaviour of no boss ever queuing, for free.
   */
  riftTarget: number
  /**
   * True from the instant the floor's boss falls until the caller resolves
   * the choice — bank what was earned, or push to a harder floor carrying the
   * same build. Freezes the world exactly like `pendingLevelUps`: the player
   * is choosing, and a crowd closing in while they read the screen would be
   * indefensible.
   */
  gateCleared: boolean
  /**
   * Shafts cut out of the air this run.
   *
   * Counted rather than merely felt, because it is the number that says whether
   * the parry is doing anything — and because the reward screen should be able
   * to tell a player that reach bought them something they never saw happen.
   */
  parried: number
}

/** `firstSweep` delays the opening sweep by the equipped weapon's interval. */
export function createRun(firstSweep = DEFAULT_WEAPON.interval): RunState {
  return {
    hp: PLAYER_MAX_HP,
    guard: 0,
    calm: 0,
    elapsed: 0,
    kills: 0,
    immunity: 0,
    slashCooldown: firstSweep,
    slashCount: 0,
    healCooldown: 0,
    healBudget: HEAL_BUDGET,
    echoTimer: 0,
    echoAimX: 0,
    echoAimY: 0,
    echoDamage: 0,
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
    riftValue: 0,
    riftTarget: Infinity,
    gateCleared: false,
    parried: 0,
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
  hit(x: number, y: number, amount: number, killed: boolean, crit?: boolean): void
  /** An art mended `amount` of the player's health at (x, y). */
  mend?(x: number, y: number, amount: number): void
  /** The player took `amount` from something named `source`. */
  hurt(amount: number, source: string): void
  /**
   * Something dropped equipment at (x, y).
   *
   * `luck` tilts the rarity roll the caller then makes — 1 for an ordinary
   * corpse, BOSS_LUCK for a boss. It travels with the event rather than being
   * inferred later because by the time the caller rolls, the corpse is gone.
   */
  drop?(x: number, y: number, itemId: string, luck: number): void
  /** `count` shafts were cut out of the air by a sweep centred at (x, y). */
  parry?(x: number, y: number, count: number): void
  /**
   * The blade moved. `thrown` for a volley, false for a sweep.
   *
   * Reported even when it hits nothing, because the sound of the weapon is how
   * a player learns its rhythm — and rhythm is the thing Speed buys.
   */
  swing?(thrown: boolean): void
  /** Qi reached the swordsman this frame. Fires often; the caller throttles. */
  qi?(): void
}

/** Shortest absolute angular distance between two directions, in radians. */
function angleBetween(ax: number, ay: number, bx: number, by: number): number {
  const dot = ax * bx + ay * by
  const det = ax * by - ay * bx
  return Math.abs(Math.atan2(det, dot))
}

/**
 * How far a boss pulls the blade's attention, once one is up.
 *
 * Deliberately CLOSE to striking distance rather than to search range. A first
 * attempt set this to 1.6× TARGET_SEARCH_RANGE and made things worse: the
 * blade would lock onto a boss still 300 units off and stay there, missing
 * every nearby chaser while closing the gap — sweeps that used to at least
 * clear the crowd around the player now hit nothing at all. A boss should win
 * the aim once the fight is actually reachable, not the moment it exists.
 */
const BOSS_FOCUS_RANGE = 190

/**
 * Points the blade at the closest enemy, falling back to the direction of
 * travel when the field is clear.
 *
 * Aiming along movement was the original design and it did not survive contact
 * with the simulation: enemies chase, so they sit BEHIND a moving player, and
 * a forward-facing arc swept empty ground. Headless runs scored zero kills
 * across every style except standing perfectly still.
 *
 * A BOSS IS PREFERRED OVER ANYTHING NEARER, once it is within reach. Without
 * this a boss standing in its own crowd is nearly unkillable: "nearest enemy"
 * keeps re-targeting whichever regular chaser has just pressed closest, and a
 * headless measurement of the rift found a boss losing 38 of 960 health over
 * three full minutes of continuous fighting — the swarm around it was
 * absorbing every sweep. A boss fight is meant to be the moment the blade
 * commits to one target; "nearest" was quietly refusing to let it.
 */
function chooseAim(run: RunState, player: Player, swarm: Swarm): void {
  let bossDist = BOSS_FOCUS_RANGE * BOSS_FOCUS_RANGE
  let bossX = 0
  let bossY = 0
  let bossFound = false

  let bestDist = TARGET_SEARCH_RANGE * TARGET_SEARCH_RANGE
  let bestX = 0
  let bestY = 0
  let found = false

  for (let i = 0; i < swarm.pool.size; i++) {
    const e = swarm.pool.at(i)
    const dx = e.x - player.x
    const dy = e.y - player.y
    const d2 = dx * dx + dy * dy
    if (e.kind.behaviour === 'boss') {
      if (d2 < bossDist) {
        bossDist = d2
        bossX = dx
        bossY = dy
        bossFound = true
      }
      continue
    }
    if (d2 < bestDist) {
      bestDist = d2
      bestX = dx
      bestY = dy
      found = true
    }
  }

  if (bossFound) {
    const d = Math.sqrt(bossDist) || 1
    run.aimX = bossX / d
    run.aimY = bossY / d
  } else if (found) {
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
function damageEnemy(ctx: CombatContext, index: number, amount: number, crit = false): boolean {
  const e = ctx.swarm.pool.at(index)
  e.hp -= amount
  e.hitFlash = 0.12
  // Being struck is the only thing that turns a pilgrim. Done before the death
  // check, so one that dies to the blow never gets to be angry about it.
  rouse(e)
  // Reported at the body's position before the pool recycles it, so a killing
  // blow's number appears where the enemy died rather than where the next
  // spawn happens to land.
  ctx.events?.hit(e.x, e.y, amount, e.hp <= 0, crit)
  if (e.hp > 0) return false

  // 血 — a felled enemy mends a sliver, at most once per HEAL_INTERVAL. Capped
  // at the maximum too, so the art is a way to stay standing rather than a way
  // to bank health for later. See RunState.healCooldown for why the interval
  // is not optional.
  if (ctx.stats.healPerKill > 0 && ctx.run.healCooldown <= 0 && ctx.run.healBudget > 0) {
    ctx.run.healCooldown = HEAL_INTERVAL
    ctx.run.healBudget--
    const before = ctx.run.hp
    ctx.run.hp = Math.min(ctx.stats.maxHp, ctx.run.hp + ctx.stats.healPerKill)
    // Announced at the PLAYER, not at the corpse that paid for it: the number
    // is about the swordsman's health, and 血 was previously the only art in
    // the game whose entire effect happened with nothing on screen to say so.
    // Suppressed at full health, where the art genuinely did nothing.
    const mended = ctx.run.hp - before
    if (mended > 0) ctx.events?.mend?.(ctx.player.x, ctx.player.y, mended)
  }

  // A boss is worth a scattering of qi rather than one mote, so clearing it
  // visibly pays — and so the level it grants arrives as a shower.
  const drops = Math.min(12, e.kind.qi)
  for (let d = 0; d < drops; d++) {
    ctx.motes.drop(e.x, e.y, Math.ceil(e.kind.qi / drops), ctx.rng, ctx.player.x, ctx.player.y)
  }
  // Equipment, rarely — and always from the body, before the pool recycles it.
  //
  // A boss never leaves empty-handed, AND what it leaves rolls on a tilted
  // table. That is what took over from the 秘笈 the boss used to guarantee:
  // permanent progression still comes reliably from clearing a gate, so the
  // answer to "why fight the boss instead of farming the easy ring forever" is
  // still a number the player can feel — it just arrives as a colour on the
  // ground now, rather than as a rank in a save file.
  // Splinters are exempt. Loot is rolled per corpse, and a region that
  // manufactures corpses would otherwise pay for the very habit it exists to
  // discourage — see Enemy.splinter.
  const depth = ctx.depth ?? 1
  const boss = e.kind.behaviour === 'boss'
  if (ctx.events?.drop && !e.splinter && (boss || ctx.rng.next() < dropChance(depth))) {
    const item = rollDrop(depth, ctx.rng.next(), ctx.owned ?? EMPTY_OWNED)
    if (item) ctx.events.drop(e.x, e.y, item.id, boss ? BOSS_LUCK : 1)
  }

  // The rift's bar, fed by the same qi that already drops as motes — a kill is
  // worth what it was already worth, read a second way. Every kill counts,
  // splinters included: a splinter is worth less because ITS kind carries less
  // qi, which is already proportional without a special case here.
  ctx.run.riftValue += e.kind.qi
  // The gate opens on the BOSS falling, not on the bar crossing its target a
  // swing or two earlier — crossing the target only queues the boss (see
  // updateCombat below). Reaching the number is not the fight; killing what it
  // summoned is.
  if (boss) ctx.run.gateCleared = true

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
  // A pending level-up or a cleared gate freezes the world: the player is
  // choosing, and enemies walking into them while a menu is open would be
  // indefensible.
  if (run.over || run.pendingLevelUps > 0 || run.gateCleared) return

  run.elapsed += dt
  if (run.immunity > 0) run.immunity = Math.max(0, run.immunity - dt)

  run.calm += dt
  if (run.slashVisual > 0) run.slashVisual = Math.max(0, run.slashVisual - dt)
  if (run.novaVisual > 0) run.novaVisual = Math.max(0, run.novaVisual - dt)

  chooseAim(run, player, swarm)
  const aimX = run.aimX
  const aimY = run.aimY

  // --- qi motes --------------------------------------------------------
  const gained = ctx.motes.update(player.x, player.y, stats.pickupRadius, dt)
  if (gained > 0) ctx.events?.qi?.()
  if (gained > 0) {
    run.xp += gained
    // A loop, not an if: a dense harvest can cross several thresholds at once,
    // and swallowing the extra levels would quietly rob the player.
    while (run.xp >= xpForLevel(run.level)) {
      run.xp -= xpForLevel(run.level)
      run.level++
      run.pendingLevelUps++
      // Guard back in full. This is its ONLY refill — see the note on it in
      // sim/loadout.ts for the two designs the harness rejected first.
      run.guard = stats.guard
    }
  }

  // --- the sweep -------------------------------------------------------
  //
  // One cut, used twice: the blow itself and, when 影 is awake, its echo a
  // fraction of a second later. Both go through `cut` so the two can never
  // disagree about what an arc is.
  const cut = (ax: number, ay: number, damage: number, crit = false): void => {
    // Iterating backwards lets a dead enemy be released without disturbing the
    // indices still to be visited.
    for (let i = swarm.pool.size - 1; i >= 0; i--) {
      const e = swarm.pool.at(i)
      const dx = e.x - player.x
      const dy = e.y - player.y
      const distance = Math.hypot(dx, dy)
      if (distance > stats.slashRange + e.kind.radius) continue
      if (distance > 0.001) {
        if (angleBetween(ax, ay, dx / distance, dy / distance) > stats.slashHalfAngle) continue
      }
      // 压 — shoved straight out from the swordsman, before the blow lands, so
      // a killing hit still throws the body rather than dropping it underfoot.
      if (stats.pushForce > 0 && distance > 0.001) {
        e.x += (dx / distance) * stats.pushForce
        e.y += (dy / distance) * stats.pushForce
      }
      damageEnemy(ctx, i, damage, crit)
    }
  }

  if (run.healCooldown > 0) run.healCooldown -= dt
  // Off means out of peril, which is the only thing that earns the next wind.
  if (stats.healPerKill <= 0) run.healBudget = HEAL_BUDGET

  /**
   * Looses one volley of thrown blades, fanned about the aim.
   *
   * The 飞刀's whole attack. It shares `cut`'s siblings — the crit counter, the
   * echo — because those are properties of ATTACKING, not of swinging; what it
   * does not share is the arc, since a thrown blade does not threaten the
   * wedge it flies through, only the line it flies down. That is the trade the
   * class is built on, and it is why the daggers cannot simply out-perform the
   * zhanmadao by standing further away.
   */
  const volley = (ax: number, ay: number, damage: number): void => {
    const n = Math.max(1, Math.round(stats.throwCount))
    // Flight time from the weapon's reach, so an art that lengthens reach
    // lengthens the throw. See Bolts.fire.
    const life = Math.max(0.05, stats.slashRange / BOLT_SPEED)
    const base = Math.atan2(ay, ax)
    for (let i = 0; i < n; i++) {
      // Fanned evenly across the spread, centred on the aim. With one blade
      // this is the aim exactly; the arts widen or narrow it from there.
      const t = n === 1 ? 0 : (i / (n - 1)) * 2 - 1
      const angle = base + t * stats.slashHalfAngle
      ctx.bolts.fire(
        player.x,
        player.y - 14,
        Math.cos(angle),
        Math.sin(angle),
        damage,
        // One body each. A piercing volley would make a packed line strictly
        // better for the thrower than for the sweeper, which is backwards.
        1,
        life,
        1,
      )
    }
  }

  run.slashCooldown -= dt
  if (run.slashCooldown <= 0) {
    run.slashCooldown += stats.slashInterval
    run.slashVisual = SLASH_VISUAL
    run.slashAimX = aimX
    run.slashAimY = aimY
    run.slashCount++

    // 断 — every Nth blow lands doubled. Counted, never rolled: see
    // Stats.critEvery for why a chance would have cost the run its seed.
    const crit = stats.critEvery > 0 && run.slashCount % stats.critEvery === 0
    const damage = crit ? stats.slashDamage * 2 : stats.slashDamage
    ctx.events?.swing?.(stats.strike === 'throw')
    if (stats.strike === 'throw') volley(aimX, aimY, damage)
    else cut(aimX, aimY, damage, crit)

    // THE BLADE ANSWERS ARROWS. See Hazards.parry for the measurement that
    // forced this: nothing in this game kills you by touching you, and until
    // the sweep could meet a shaft, no offensive stat converted into survival.
    //
    // A thrower parries too, and its arc is the volley's spread, so 散 widening
    // the fan widens what it swats down. That is the class's answer to danger
    // written in its own language — distance and coverage — rather than the
    // guard art the design note in data/arts.ts rules out for it.
    const swatted = ctx.hazards.parry(
      player.x,
      player.y,
      aimX,
      aimY,
      stats.slashRange,
      stats.slashHalfAngle,
    )
    if (swatted > 0) {
      run.parried += swatted
      ctx.events?.parry?.(player.x, player.y, swatted)
    }

    // 影 — the blow leaves a copy of itself where you were aiming. Queued
    // rather than struck twice at once, or it would read as one bigger number
    // instead of as a second blow.
    if (stats.echoDelay > 0 && stats.echoDamage > 0) {
      run.echoTimer = stats.echoDelay
      run.echoAimX = aimX
      run.echoAimY = aimY
      run.echoDamage = stats.slashDamage * stats.echoDamage
    }
  }

  // The echo lands on its own clock, and lands even if the condition that made
  // it has since dropped — it was already thrown.
  if (run.echoTimer > 0) {
    run.echoTimer -= dt
    if (run.echoTimer <= 0) {
      run.echoTimer = 0
      run.slashVisual = SLASH_VISUAL * 0.6
      run.slashAimX = run.echoAimX
      run.slashAimY = run.echoAimY
      // An echo is a second BLOW, so it takes whichever form this class's blow
      // takes. A thrown echo that arrived as an arc would be the one place the
      // two classes quietly became the same weapon again.
      if (stats.strike === 'throw') volley(run.echoAimX, run.echoAimY, run.echoDamage)
      else cut(run.echoAimX, run.echoAimY, run.echoDamage)
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

  /**
 * Everything that hurts the player goes through here.
 *
 * It was two copies before — one for projectiles, one for contact — and they
 * had already drifted: the same clamp and the same guard scale were written
 * twice, and any third source of damage would have written them a third time.
 * With three defensive layers to apply in a fixed order, two copies is a bug
 * waiting for the day somebody edits one of them.
 *
 * The order matters and is not arbitrary. Armour first, because it describes
 * how hard the blow lands; the flat scale second, because it is a blanket
 * modifier on what landed; guard last, because guard is a thing standing in
 * front of you and what it stops is whatever finally arrived.
 *
 * Returns true when the run ended.
 */
function takeDamage(ctx: CombatContext, raw: number, source: string): boolean {
  const { run, stats } = ctx
  if (raw <= 0) return false
  const armoured = afterArmour(raw, stats.armour)
  // Rounded up off zero so no amount of stacking can make a blow free. Being
  // hit for 1 still reads as being hit; being hit for 0 reads as a bug.
  const landed = Math.max(1, armoured * stats.damageScale)

  run.immunity = HURT_IMMUNITY
  run.lastHurtBy = source
  run.calm = 0

  const stopped = Math.min(run.guard, landed)
  run.guard -= stopped
  const through = landed - stopped
  run.hp -= through

  // Reported at what it cost in health, not at what was swung: a number that
  // says 30 while the bar drops by 4 teaches the player the wrong lesson about
  // their own armour. Guard eating the blow whole is still worth a beat, so a
  // fully absorbed hit reports 0 rather than nothing at all.
  ctx.events?.hurt(Math.round(through), source)

  if (run.hp <= 0) {
    run.hp = 0
    run.over = true
    run.killedBy = source
    return true
  }
  return false
}

// --- enemy projectiles -----------------------------------------------
  ctx.hazards.update(dt)
  if (run.immunity <= 0) {
    const raw = ctx.hazards.strike(player.x, player.y, PLAYER_RADIUS)
    if (raw > 0) {
      const source = ctx.hazards.lastStrikeSource || 'a stray bolt'
      if (takeDamage(ctx, raw, source)) return
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
      const raw = contactDamage(e)
      if (raw > 0 && dx * dx + dy * dy <= reach * reach) {
        takeDamage(ctx, raw, e.kind.name)
        // One hit per immunity window, no matter how many bodies are touching.
        break
      }
    }
  }

  // --- the gate ----------------------------------------------------------
  // Crossing the target QUEUES the boss; it does not open the gate by itself
  // — `damageEnemy` sets `gateCleared` only once that boss actually falls. The
  // one-frame lag before `swarm.update()` next runs and places it is the same
  // lag `applyArts` already accepts elsewhere in this codebase.
  if (!run.gateCleared && !swarm.bossAlive && run.riftValue >= run.riftTarget) {
    swarm.queueBoss()
  }
}
