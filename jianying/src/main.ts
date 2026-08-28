/**
 * 剑影 Jiànyǐng — a persistent swordsman, and the expeditions that raise them.
 *
 * The game is now two loops rather than one, and the split is the point:
 *
 *   HUB          the character. Permanent, visible, and where growth is spent.
 *   EXPEDITION   a survivors-like run. Temporary, dangerous, and thrown away.
 *
 * The survivors-like alone was reported as directionless — every run started
 * and ended at zero, so nothing carried, and the player had no way to see that
 * anything had been accomplished. The hub is the answer: an expedition always
 * converts into cultivation XP, always moves a permanent bar, and the
 * conversion is itemised on the way out so it can be read rather than trusted.
 *
 * The one combat decision worth repeating here is that the blade aims at the
 * nearest enemy rather than along the direction of travel. Aiming along
 * movement was the original plan and the headless simulation killed it: enemies
 * chase, so they sit BEHIND a moving player, and a forward arc swept empty
 * ground for zero kills in every play style except standing perfectly still.
 */
import { Container, Graphics } from 'pixi.js'
import { SplashScreen } from '@capacitor/splash-screen'
import { GameLoop } from './core/loop'
import { Rng, expeditionSeed } from './core/rng'
import { clamp01, easing, lerp } from './core/tween'
import { ENEMY_KINDS, KIND_BY_ID } from './data/enemies'
import { buildBlade, buildSwordsmanTopDown, sashPoly, sashSpine } from './render/figure'
import { buildEnemyArt } from './render/enemyArt'
import { createCamera, fitCamera, resetCamera, updateCamera } from './render/camera'
import { createFloaters } from './render/floaters'
import { mixColor, palette } from './render/palette'
import { createStage } from './render/stage'
import { CHARGE_WINDUP, Swarm } from './sim/enemies'
import { Motes } from './sim/pickups'
import { Bolts } from './sim/projectiles'
import { Hazards } from './sim/hazards'
import { ORBIT_RADIUS, SLASH_VISUAL, createRun, updateCombat } from './sim/combat'
import { deriveStats } from './sim/loadout'
import { type Loadout, offerTechniques, xpForLevel } from './data/techniques'
import { createPlayer, playerSpeedRatio, updatePlayer } from './sim/player'
import { type Character, createCharacter, grantXp, recordRun, rewardFor } from './meta/character'
import { bearingOf, buildOf, pigmentOf, sashOf } from './meta/look'
import { clampDepth, regionAt } from './data/regions'
import { applySchool, schoolById } from './meta/schools'
import { acquire, equip, equippedIn, equippedItems } from './meta/inventory'
import { ITEMS, ITEM_BY_ID, type Item } from './data/items'
import { bladeOf, weaponById } from './data/weapons'
import { gearFromIds } from './render/wardrobe'
import type { Kit } from './sim/loadout'
import { loadCharacter, saveCharacter } from './meta/save'
import { createBanners } from './ui/banner'
import { createCodex } from './ui/codex'
import { createCreator } from './ui/create'
import { createHud, type RunSummary } from './ui/hud'
import { createHub } from './ui/hub'
import { createJoystick } from './ui/joystick'
import { createLevelUp } from './ui/levelup'
import { strings } from './ui/strings'
import { createTitle } from './ui/title'
import { createTutorial } from './ui/tutorial'

const BUILD = '1.7.0'

async function hideSplash(): Promise<void> {
  try {
    await SplashScreen.hide()
  } catch {
    // Web build, or the plugin is unavailable. Nothing to hide.
  }
}

/**
 * Puts a failure on the screen instead of leaving a silent black rectangle.
 * On a phone there is no console to open, so rendering the message is the only
 * diagnostic channel that survives the trip to a device.
 */
function showFatal(err: unknown): void {
  const bootScreen = document.getElementById('boot')
  if (!bootScreen) return
  bootScreen.classList.remove('gone')
  bootScreen.style.opacity = '1'
  bootScreen.innerHTML = ''

  const title = document.createElement('div')
  title.textContent = strings.fatalTitle
  title.style.cssText = 'color:#c1272d;font-size:16px;margin-bottom:12px'

  const detail = document.createElement('pre')
  detail.textContent = err instanceof Error ? `${err.message}\n\n${err.stack ?? ''}` : String(err)
  detail.style.cssText =
    'color:#e8dcc0;font-size:11px;white-space:pre-wrap;word-break:break-word;' +
    'max-width:88vw;max-height:70vh;overflow:auto;text-align:left;opacity:0.8'

  bootScreen.append(title, detail)
}

async function boot(): Promise<void> {
  const host = document.getElementById('stage')!
  const hud = document.getElementById('hud')!
  const hint = document.getElementById('hint')!
  const uiRoot = document.getElementById('ui')!
  const bootScreen = document.getElementById('boot')!

  hint.textContent = strings.moveHint

  const stage = await createStage(host)
  const sashRng = new Rng(1337)

  const enemyArt = buildEnemyArt(ENEMY_KINDS)

  // The character is read before anything else is built: a save that fails to
  // parse must produce a fresh swordsman, never a boot that dies halfway.
  const loaded = await loadCharacter()
  // `let` because character creation replaces the record wholesale rather than
  // mutating a half-made one into shape.
  let character: Character = loaded.character
  const isFirstLaunch = loaded.fresh
  const persist = (): void => {
    void saveCharacter(character)
  }

  const player = createPlayer(0, 0)
  const camera = createCamera(0, 0)
  // Re-rolled at the start of every expedition, so two runs in a row are two
  // different roads rather than the same one twice.
  let runSeed = expeditionSeed()
  const swarm = new Swarm(new Rng(runSeed), regionAt(character.depth))
  const motes = new Motes()
  const bolts = new Bolts()
  const hazards = new Hazards()
  // A stream of its own, so drawing technique offers never shifts the enemy
  // sequence a seed is supposed to guarantee.
  let pickRng = new Rng(runSeed ^ 0x5bf03635)
  let loadout: Loadout = new Map()

  /**
   * Everything the character permanently brings: bought attributes, the
   * equipped weapon, and the worn armour. Rebuilt whenever the hub changes
   * something, and read once at the start of an expedition.
   */
  const currentKit = (): Kit => {
    const school = schoolById(character.origin)
    const weaponItem = equippedIn(character.inventory, 'weapon')
    return {
      spent: character.spent,
      weapon: weaponById(weaponItem?.styleId ?? school.weaponId),
      worn: equippedItems(character.inventory).filter((item) => item.slot !== 'weapon'),
    }
  }

  /** The wardrobe styles the equipped armour and weapon add up to. */
  const currentGear = () => {
    const school = schoolById(character.origin)
    const weaponItem = equippedIn(character.inventory, 'weapon')
    const weapon = weaponById(weaponItem?.styleId ?? school.weaponId)
    return gearFromIds({
      robe: equippedIn(character.inventory, 'robe')?.styleId,
      shoulders: equippedIn(character.inventory, 'shoulders')?.styleId,
      head: equippedIn(character.inventory, 'head')?.styleId,
      blade: bladeOf(weapon).id,
    })
  }

  let kit = currentKit()
  let stats = deriveStats(loadout, kit)
  let run = createRun(kit.weapon.interval)
  run.hp = stats.maxHp
  /** The place being walked. Chosen in the hub before every expedition. */
  let region = regionAt(clampDepth(character.depth, character.depth))
  const depthOf = (): number => region.depth

  // The figure is rebuilt whenever equipment changes, since equipment IS the
  // geometry here — a longer hem is literally a longer silhouette.
  let figure = buildSwordsmanTopDown(7, 1, currentGear())
  let bladeStrokes = buildBlade(2, 1, currentGear().blade)

  resetCamera(camera, 0, 0)
  fitCamera(camera, stage.height)
  const joystick = createJoystick(host)
  const ui = createHud(uiRoot)
  const levelUp = createLevelUp(uiRoot)
  const banners = createBanners(uiRoot)
  const codex = createCodex(uiRoot)
  const title = createTitle(uiRoot)
  const creator = createCreator(uiRoot)
  const floaters = createFloaters()
  const tutorial = createTutorial(banners)
  // Declared before the hub so the codex button has something to call; the hub
  // is what closes it, so the two would otherwise reference each other.
  let openHub: () => void = () => {}
  // Assigned below, once creation exists. Declared here because the hub's
  // "new swordsman" button needs something to call and creation needs the hub
  // to return to, so one of the two has to be forward-declared.
  let startCreation: (fromHub?: boolean) => void = () => {}
  const hub = createHub(
    uiRoot,
    persist,
    () => {
      hub.hide()
      codex.show(() => {
        codex.hide()
        openHub()
      })
    },
    () => confirmNewCharacter(),
  )

  /**
   * Asks before discarding a swordsman, and means it.
   *
   * Creation used to be reachable only when there was no save, which made the
   * school picker unreachable for everyone who had ever played — the one screen
   * a returning player most wanted to see was the one screen they could not.
   * Opening it now has a cost, so it is stated in full and defaults to keeping:
   * the destructive button is the second one, and dismissing does nothing.
   */
  const confirmNewCharacter = (): void => {
    const veil = document.createElement('div')
    veil.className = 'confirm'
    veil.innerHTML = `
      <div class="confirm-box">
        <div class="confirm-title">${strings.discardTitle}</div>
        <div class="confirm-body">${strings.discardBody}</div>
        <div class="confirm-row">
          <button class="confirm-keep" type="button">${strings.keep}</button>
          <button class="confirm-go" type="button">${strings.discardConfirm}</button>
        </div>
      </div>
    `
    uiRoot.appendChild(veil)
    const close = (): void => veil.remove()
    veil.querySelector<HTMLButtonElement>('.confirm-keep')!.addEventListener('click', close)
    // A tap on the darkened area is a dismissal, and dismissal keeps.
    veil.addEventListener('click', (event) => {
      if (event.target === veil) close()
    })
    veil.querySelector<HTMLButtonElement>('.confirm-go')!.addEventListener('click', () => {
      close()
      // Both callers land here — the hub's button and the title's. Hiding a
      // screen that is not showing is harmless, and branching on which one is
      // up would be one more thing to get wrong.
      hub.hide()
      title.hide()
      startCreation()
    })
  }

  // ---- Scene ------------------------------------------------------------

  // One Graphics for the whole swarm, cleared and redrawn each frame.
  // Hundreds of individual display objects would cost more in transform and
  // draw-call overhead than redrawing the geometry does.
  const enemyGfx = new Graphics()
  enemyGfx.zIndex = -2
  stage.world.addChild(enemyGfx)

  const shadow = new Graphics()
  shadow.ellipse(0, 0, 15, 5).fill({ color: palette.inkSoft, alpha: 0.18 })
  shadow.zIndex = -1
  stage.world.addChild(shadow)

  // Qi motes: the first colour on the field, and the reason to walk back into
  // ground you have just cleared.
  const moteGfx = new Graphics()
  moteGfx.zIndex = -3
  stage.world.addChild(moteGfx)

  const boltGfx = new Graphics()
  boltGfx.zIndex = 1
  stage.world.addChild(boltGfx)

  // Enemy fire, drawn above the crowd so it is never lost in a press of bodies.
  const hazardGfx = new Graphics()
  hazardGfx.zIndex = 4
  stage.world.addChild(hazardGfx)

  // The sweep and the shockwave, ink marks that fade over their short lives.
  const slashGfx = new Graphics()
  slashGfx.zIndex = 1
  stage.world.addChild(slashGfx)

  const orbitGfx = new Graphics()
  orbitGfx.zIndex = 3
  stage.world.addChild(orbitGfx)

  stage.world.addChild(floaters.view)

  const swordsman = new Container()
  const sashGfx = new Graphics()

  const bladeGfx = new Graphics()
  const bodyGfx = new Graphics()

  /**
   * Re-bakes the swordsman's geometry from whatever is equipped.
   *
   * Cheap and rare: it runs when an expedition starts, not per frame, so the
   * hot loop still draws two static Graphics. This is the whole payoff of the
   * art direction — changing equipment is changing the polygons, so there is
   * no sprite to swap and no atlas to rebuild.
   */
  const rebuildFigure = (): void => {
    const gear = currentGear()
    // The look drives the brush hand and the build, so the swordsman fought
    // with is the same one chosen at creation and shown in the hub — not a
    // default that quietly ignores half of what the player picked.
    figure = buildSwordsmanTopDown(
      character.look.seed,
      1,
      gear,
      buildOf(character.look).width,
      bearingOf(character.look),
    )
    bladeStrokes = buildBlade(character.look.seed + 1, 1, gear.blade)
    // The dye the robe was given at creation. Null keeps it ink.
    const dye = pigmentOf(character.look).colour

    bladeGfx.clear()
    for (const stroke of bladeStrokes) {
      bladeGfx.poly(stroke.poly).fill({ color: palette.ink, alpha: stroke.alpha })
    }
    bodyGfx.clear()
    for (const strokes of [figure.bleed, figure.body]) {
      for (const stroke of strokes) {
        // Robe marks carry the dye; the rest stay ink, so the silhouette still
        // reads black against the paper at the size the game actually draws.
        // A cut is painted the colour of the ground it sits on, which is what
        // makes it a hole rather than a pale mark — see FigureStroke.part.
        const colour =
          stroke.part === 'cut'
            ? palette.paper
            : stroke.part === 'robe' && dye !== null
              ? dye
              : palette.ink
        bodyGfx.poly(stroke.poly).fill({ color: colour, alpha: stroke.alpha })
      }
    }
  }
  rebuildFigure()

  // Depth inside the character is dynamic: a blade aimed away from the camera
  // passes BEHIND the body, a sash streaming toward it falls in FRONT.
  swordsman.sortableChildren = true
  bodyGfx.zIndex = 0
  swordsman.addChild(sashGfx, bodyGfx, bladeGfx)
  swordsman.zIndex = 2
  stage.world.addChild(swordsman)

  /** Chest height, in world units — where the blade pivots. */
  const BLADE_PIVOT_Y = -26

  const stickGfx = new Graphics()
  stage.overlay.addChild(stickGfx)

  stage.app.renderer.on('resize', () => fitCamera(camera, stage.height))

  // ---- Run lifecycle ----------------------------------------------------

  let gameOverShown = false
  /** True between "Set out" and the end screen. False while the hub is up. */
  let playing = false

  /**
   * The simulation's channel to the screen.
   *
   * Everything here answers the same reported problem — not being able to tell
   * what was happening. A number over a struck enemy, a number over the player
   * when something lands, and a banner naming whatever just took a bite.
   */
  /** Equipment found during the current expedition, in the order found. */
  let foundThisRun: Item[] = []
  /**
   * What the drop table should treat as already owned.
   *
   * Includes what was found earlier in this same expedition, so a run cannot
   * hand out the same robe three times before the player has had a chance to
   * put it away.
   */
  let ownedThisRun = new Set<string>()

  const events = {
    hit(x: number, y: number, amount: number, killed: boolean): void {
      floaters.hit(x, y, amount, killed)
    },
    hurt(amount: number, source: string): void {
      floaters.hurt(player.x, player.y, amount)
      banners.show(source, 'danger', `−${Math.round(amount)}`)
    },
    drop(x: number, y: number, itemId: string): void {
      const item = ITEM_BY_ID.get(itemId)
      if (!item) return
      // Kept immediately rather than needing to be walked over. A drop the
      // player can fail to collect while being chased is a punishment dressed
      // as a reward, and this genre never gives them a safe moment to go back.
      foundThisRun.push(item)
      ownedThisRun.add(item.id)
      banners.show(item.name, 'gold', strings.found)
      floaters.found(x, y)
    },
  }

  const beginExpedition = (chosen: number): void => {
    region = regionAt(clampDepth(chosen, character.depth))
    player.x = 0
    player.y = 0
    player.prevX = 0
    player.prevY = 0
    player.vx = 0
    player.vy = 0
    runSeed = expeditionSeed()
    swarm.reset(runSeed, region)
    motes.clear()
    bolts.clear()
    hazards.clear()
    floaters.clear()
    banners.clear()
    loadout = new Map()
    foundThisRun = []
    ownedThisRun = new Set(character.inventory.owned)
    // The kit is read here, and this is the only place permanent power touches
    // a run: after this the expedition knows nothing about the hub.
    kit = currentKit()
    stats = deriveStats(loadout, kit)
    rebuildFigure()
    pickRng = new Rng(runSeed ^ 0x5bf03635)
    levelUp.hide()
    run = createRun(kit.weapon.interval)
    run.hp = stats.maxHp
    resetCamera(camera, 0, 0)
    gameOverShown = false
    playing = true
    ui.hideGameOver()
    ui.setPlaying(true)
    ui.setRegion(region)
    hub.hide()
    tutorial.reset()

    // The place is announced by name, and so is its rule — a region whose rule
    // the player has to infer from being slowed is a bug, not a discovery.
    banners.show(region.name, 'plain', `${region.seal} · ${kit.weapon.name}`)
    if (region.ruleText) banners.show(region.ruleText, 'gold')
  }

  openHub = (): void => {
    playing = false
    ui.hideGameOver()
    ui.setPlaying(false)
    banners.clear()
    floaters.clear()
    title.hide()
    creator.hide()
    codex.hide()
    hub.show(character, beginExpedition)
  }

  /**
   * Converts a finished expedition into permanent progress.
   *
   * Called exactly once per death, before the end screen is drawn, so the
   * screen can itemise what the run was actually worth rather than promising it.
   */
  const settleExpedition = (): RunSummary => {
    const result = {
      kills: run.kills,
      seconds: run.elapsed,
      insight: run.level,
      depth: depthOf(),
    }
    const reward = rewardFor(result)
    const gain = grantXp(character, reward.total)
    recordRun(character, result)

    // Duplicates are reported honestly rather than silently swallowed: owning
    // a second Hemp Robe is worth nothing here, and a reward screen that
    // pretended otherwise would be lying about the only loot the player got.
    const kept: Item[] = []
    const duplicates: Item[] = []
    for (const item of foundThisRun) {
      if (acquire(character.inventory, item.id)) {
        kept.push(item)
        // Anything for an empty slot goes straight on. Making a player visit
        // the hub to equip their very first weapon would be ceremony for its
        // own sake.
        if (!character.inventory.equipped[item.slot]) equip(character.inventory, item.id)
      } else {
        duplicates.push(item)
      }
    }
    // One expedition is enough teaching. Coaching that keeps firing after the
    // player has understood the game stops being help and becomes noise they
    // have no way to dismiss mid-fight.
    character.taught = true
    persist()
    return {
      seconds: run.elapsed,
      kills: run.kills,
      depth: depthOf(),
      killedBy: run.killedBy,
      reward,
      gain,
      level: character.level,
      kept,
      duplicates,
    }
  }

  // ---- Simulation -------------------------------------------------------

  let time = 0

  const update = (dt: number): void => {
    time += dt
    joystick.tick(dt)
    banners.update(dt)
    floaters.update(dt)

    if (!playing || run.over) return

    // A pending choice freezes the field. The player is reading three cards;
    // being surrounded while doing so would be indefensible.
    if (run.pendingLevelUps > 0) {
      if (!levelUp.visible) {
        levelUp.show(run.level, offerTechniques(loadout, () => pickRng.next()), loadout, (tech) => {
          const before = stats.maxHp
          loadout.set(tech.id, (loadout.get(tech.id) ?? 0) + 1)
          stats = deriveStats(loadout, kit)
          // Iron Skin heals for what it adds, so taking it while badly hurt is
          // a real decision rather than a promise for the next run.
          run.hp = Math.min(stats.maxHp, run.hp + (stats.maxHp - before))
          run.pendingLevelUps--
          levelUp.hide()
        })
      }
      return
    }

    const insightBefore = run.level

    const { x: ix, y: iy } = joystick.state
    // The region bends the player, not the enemies, and that asymmetry is the
    // whole design: wading slows you while the marsh does not slow what lives
    // in it, and the cliff wind moves you whether or not your thumb agrees.
    const rule = region.rule
    const windAngle = rule.driftPeriod ? (time / rule.driftPeriod) * Math.PI * 2 : 0
    const drift = rule.drift ?? 0
    updatePlayer(
      player,
      ix,
      iy,
      dt,
      stats.moveSpeed * (rule.playerSpeed ?? 1),
      Math.cos(windAngle) * drift,
      Math.sin(windAngle) * drift,
    )
    swarm.update(player.x, player.y, run.elapsed, dt, hazards)
    updateCombat(
      {
        run,
        player,
        swarm,
        motes,
        bolts,
        hazards,
        stats,
        rng: pickRng,
        events,
        depth: depthOf(),
        owned: ownedThisRun,
      },
      dt,
    )
    updateCamera(camera, player, stats.moveSpeed, dt)

    // A boss used to simply walk on from off-screen, indistinguishable from a
    // larger silhouette in a crowd of silhouettes until it started firing.
    if (swarm.takeBossArrival()) {
      banners.show(KIND_BY_ID.get('warlord')!.name, 'danger', strings.bossApproaches)
    }
    if (run.level > insightBefore) {
      banners.show(`${strings.insightReached} ${run.level}`, 'gold')
    }

    // First expedition only. Every lesson fires on a condition rather than a
    // timer, so it lands the moment it is about to be useful.
    if (!character.taught) {
      tutorial.update({
        elapsed: run.elapsed,
        kills: run.kills,
        motes: motes.pool.size,
        hp: run.hp,
        maxHp: stats.maxHp,
        insight: run.level,
      })
    }
  }

  // ---- Render -----------------------------------------------------------

  const render = (alpha: number): void => {
    const wx = lerp(player.prevX, player.x, alpha)
    const wy = lerp(player.prevY, player.y, alpha)
    const zoom = camera.zoom

    // The world container carries the whole camera transform, so everything
    // inside it is positioned in plain world coordinates.
    stage.world.scale.set(zoom)
    stage.world.x = stage.width / 2 - camera.x * zoom
    stage.world.y = stage.height / 2 - camera.y * zoom

    const ratio = playerSpeedRatio(player, stats.moveSpeed)
    const bobRate = 2.0 + ratio * 6
    const bob = Math.sin(time * bobRate) * (0.6 + ratio * 1.3)

    // --- enemies -------------------------------------------------------
    enemyGfx.clear()
    for (let i = 0; i < swarm.pool.size; i++) {
      const e = swarm.pool.at(i)
      const ex = lerp(e.prevX, e.x, alpha)
      const ey = lerp(e.prevY, e.y, alpha)
      const art = enemyArt.get(e.kind.id)
      if (!art) continue

      // A struck enemy washes toward cinnabar. It is the only feedback in the
      // build that a hit landed, and without it the swarm just thins silently.
      // Base colour is the kind's accent: cinnabar for the threats that reach
      // you from outside the sweep, gold for a boss, ink for everything else.
      const base = art.accent
      const tint = e.hitFlash > 0 ? mixColor(base, palette.cinnabar, e.hitFlash / 0.12) : base
      // Idle sway, phase-shifted per enemy so a crowd never pulses in unison.
      const sway = Math.sin(time * 3.4 + e.phase) * 0.6

      // Only the solid pass. The bleed underlay is a wide, 16%-alpha wash that
      // sells ink soaking into paper at the size the PLAYER is drawn — on an
      // enemy nine world units across it is invisible, and it was doubling the
      // polygon count of the single most repeated thing on screen. Halving that
      // halves both the arrays built here and the triangulation Pixi does with
      // them, which is the larger cost of the two.
      //
      // The array cannot be pooled, and that is worth recording because it
      // looks like free performance: Pixi keeps the array BY REFERENCE inside
      // the Polygon it builds, so writing the next stroke into a shared buffer
      // silently rewrites every polygon already submitted this frame. Measured
      // at 0.58ms per frame for 300 enemies, it is not the expensive half.
      for (const s of art.body) {
        const poly = s.poly
        const n = poly.length
        const moved = new Array<number>(n)
        for (let k = 0; k < n; k += 2) {
          moved[k] = poly[k]! + ex + sway
          moved[k + 1] = poly[k + 1]! + ey
        }
        enemyGfx.poly(moved).fill({ color: tint, alpha: s.alpha })
      }

      // A charger winding up draws a cinnabar line along the lane it is about
      // to cross. The dash is only fair because it is announced.
      if (e.kind.behaviour === 'charger' && e.state === CHARGE_WINDUP) {
        const tx = wx - ex
        const ty = wy - ey
        const tl = Math.hypot(tx, ty) || 1
        enemyGfx
          .poly([
            ex + (tx / tl) * 14,
            ey + (ty / tl) * 14,
            ex + (tx / tl) * 260 - (ty / tl) * 5,
            ey + (ty / tl) * 260 + (tx / tl) * 5,
            ex + (tx / tl) * 260 + (ty / tl) * 5,
            ey + (ty / tl) * 260 - (tx / tl) * 5,
          ])
          .fill({ color: palette.cinnabar, alpha: 0.16 })
      }

      // Only bosses carry a health bar. On a normal enemy it would be noise on
      // something that dies to one or two sweeps.
      if (e.kind.behaviour === 'boss') {
        const w = 74
        const pct = Math.max(0, e.hp / e.maxHp)
        const by = ey - e.kind.radius * 2.4
        enemyGfx.rect(ex - w / 2, by, w, 5).fill({ color: palette.ink, alpha: 0.16 })
        enemyGfx.rect(ex - w / 2, by, w * pct, 5).fill({ color: palette.cinnabar, alpha: 0.9 })
      }
    }

    // --- enemy fire ----------------------------------------------------
    hazardGfx.clear()
    for (let i = 0; i < hazards.pool.size; i++) {
      const h = hazards.pool.at(i)
      const hx = lerp(h.prevX, h.x, alpha)
      const hy = lerp(h.prevY, h.y, alpha)
      hazardGfx.circle(hx, hy, h.radius).fill({ color: palette.cinnabar, alpha: 0.9 })
      hazardGfx.circle(hx, hy, h.radius * 2).fill({ color: palette.cinnabar, alpha: 0.14 })
    }

    // --- the sweep -----------------------------------------------------
    slashGfx.clear()
    if (run.slashVisual > 0) {
      const life = run.slashVisual / SLASH_VISUAL
      const angle = Math.atan2(run.slashAimY, run.slashAimX)
      const ease = easing.outCubic(life)
      // A filled wedge was the first attempt and it read as a spotlight: a
      // 200-degree cone is most of the screen, and shading all of it buries the
      // characters. A crescent traces the same reach as a brush mark instead —
      // the edge of the sweep, not the area it covers.
      const reach = stats.slashRange * (0.72 + 0.28 * ease)
      const width = 15 * ease
      const steps = 20

      const outer: number[] = []
      const inner: number[] = []
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const a = angle - stats.slashHalfAngle + 2 * stats.slashHalfAngle * t
        // Thickest mid-sweep, tapering to nothing at both ends, the way a blade
        // enters and leaves the arc.
        const w = width * Math.sin(t * Math.PI)
        const cos = Math.cos(a)
        const sin = Math.sin(a)
        outer.push(wx + cos * (reach + w * 0.5), wy + sin * (reach + w * 0.5))
        inner.push(wx + cos * (reach - w * 0.5), wy + sin * (reach - w * 0.5))
      }
      const band = outer.slice()
      for (let i = inner.length - 2; i >= 0; i -= 2) band.push(inner[i]!, inner[i + 1]!)
      slashGfx.poly(band).fill({ color: palette.ink, alpha: 0.5 * life })
    }

    // --- qi motes ------------------------------------------------------
    moteGfx.clear()
    for (let i = 0; i < motes.pool.size; i++) {
      const m = motes.pool.at(i)
      const mx = lerp(m.prevX, m.x, alpha)
      const my = lerp(m.prevY, m.y, alpha)
      // A slow pulse, phase-shifted by age, so a field of motes shimmers
      // instead of sitting there as flat dots.
      const pulse = 0.78 + Math.sin(time * 5 + m.age * 9) * 0.22
      moteGfx.circle(mx, my, 3.6 * pulse).fill({ color: palette.gold, alpha: 0.92 })
      moteGfx.circle(mx, my, 7 * pulse).fill({ color: palette.gold, alpha: 0.16 })
    }

    // --- sword qi ------------------------------------------------------
    boltGfx.clear()
    for (let i = 0; i < bolts.pool.size; i++) {
      const b = bolts.pool.at(i)
      const bx = lerp(b.prevX, b.x, alpha)
      const by = lerp(b.prevY, b.y, alpha)
      const a = Math.atan2(b.vy, b.vx)
      // Drawn as a short crescent aligned with travel — the same brush
      // vocabulary as the sweep, so the arts read as one hand.
      const pts: number[] = []
      const steps = 9
      for (let k = 0; k <= steps; k++) {
        const t = k / steps
        const spread = (t - 0.5) * 1.5
        const w = 13 * Math.sin(t * Math.PI)
        pts.push(bx + Math.cos(a + spread) * (16 + w * 0.5), by + Math.sin(a + spread) * (16 + w * 0.5))
      }
      for (let k = steps; k >= 0; k--) {
        const t = k / steps
        const spread = (t - 0.5) * 1.5
        const w = 13 * Math.sin(t * Math.PI)
        pts.push(bx + Math.cos(a + spread) * (16 - w * 0.5), by + Math.sin(a + spread) * (16 - w * 0.5))
      }
      boltGfx.poly(pts).fill({ color: palette.ink, alpha: 0.72 })
    }

    // --- guardian blades and thunder palm -------------------------------
    orbitGfx.clear()
    if (stats.orbitBlades > 0) {
      const step = (Math.PI * 2) / stats.orbitBlades
      for (let b = 0; b < stats.orbitBlades; b++) {
        const a = run.orbitAngle + step * b
        const bx = wx + Math.cos(a) * ORBIT_RADIUS
        const by = wy + Math.sin(a) * ORBIT_RADIUS
        // Each blade is a small tapered mark tangent to its circle, so the set
        // reads as swords in flight rather than as beads on a string.
        const tangent = a + Math.PI / 2
        const tipX = Math.cos(tangent) * 15
        const tipY = Math.sin(tangent) * 15
        const perpX = Math.cos(a) * 3.4
        const perpY = Math.sin(a) * 3.4
        orbitGfx
          .poly([bx - tipX, by - tipY, bx + perpX, by + perpY, bx + tipX, by + tipY, bx - perpX, by - perpY])
          .fill({ color: palette.ink, alpha: 0.85 })
      }
    }
    if (run.novaVisual > 0) {
      const life = run.novaVisual / 0.42
      const r = run.novaVisualRadius * (1.06 - 0.28 * life)
      orbitGfx
        .circle(wx, wy, r)
        .stroke({ width: 3 + 7 * life, color: palette.gold, alpha: 0.55 * life })
    }

    // --- character -----------------------------------------------------
    swordsman.x = wx
    swordsman.y = wy + bob
    swordsman.rotation = clamp01(ratio) * (player.vx / stats.moveSpeed) * 0.13
    // Flash the swordsman while immune, so being hit is legible.
    swordsman.alpha = run.immunity > 0 && Math.floor(time * 14) % 2 === 0 ? 0.45 : 1

    shadow.x = wx
    shadow.y = wy
    const lift = 1 - Math.abs(bob) / 2.6
    shadow.scale.set(0.88 + lift * 0.16)
    shadow.alpha = 0.7 + lift * 0.3

    const aimX = run.aimX
    const aimY = run.aimY
    bladeGfx.rotation = Math.atan2(aimY, aimX)
    bladeGfx.y = BLADE_PIVOT_Y
    bladeGfx.scale.x = 0.5 + 0.5 * Math.abs(aimX)
    bladeGfx.zIndex = aimY < 0 ? -1 : 2

    sashRng.snapshot = 1337
    const spine = sashSpine(figure.sashAnchor, time, -aimX, -aimY, ratio * stats.moveSpeed, 1)
    const poly = sashPoly(spine, sashRng, 1)
    sashGfx.clear()
    // A null colour is a swordsman who wears no sash, and drawing nothing is
    // the honest reading of that — not a grey one.
    const sashColour = sashOf(character.look).colour
    if (poly.length >= 6 && sashColour !== null) {
      sashGfx.poly(poly).fill({ color: sashColour, alpha: 0.88 })
    }
    sashGfx.zIndex = -aimY > 0 ? 3 : -2

    // --- ground --------------------------------------------------------
    stage.ground.tileScale.set(zoom)
    stage.ground.tilePosition.x = -camera.x * zoom
    stage.ground.tilePosition.y = -camera.y * zoom

    // --- ui ------------------------------------------------------------
    ui.update(run.hp, stats.maxHp, run.elapsed, run.kills, run.xp, xpForLevel(run.level), run.level)
    if (playing && run.over && !gameOverShown) {
      gameOverShown = true
      // Cleared before the end screen goes up, or the last banner of the run
      // sits on top of it — an "Insight 7" drawn straight through the seal,
      // which is what shipped in the first version of this screen.
      banners.clear()
      floaters.clear()
      ui.showGameOver(settleExpedition(), openHub)
    }

    stickGfx.clear()
    if (playing && joystick.state.active && !run.over && !levelUp.visible) {
      const s = joystick.state
      stickGfx
        .circle(s.originX, s.originY, 54)
        .stroke({ width: 1.5, color: palette.ink, alpha: 0.18 })
      stickGfx.circle(s.thumbX, s.thumbY, 20).fill({ color: palette.ink, alpha: 0.24 })
    }
  }

  const loop = new GameLoop({ update, render })
  loop.start()

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) loop.resetClock()
  })

  let hudTimer = 0
  const hudTick = (): void => {
    hudTimer++
    if (hudTimer % 20 === 0) {
      // The HUD carries the diagnosis, not just the frame rate.
      //
      // "It stutters on my phone" is not something anyone can act on, and this
      // machine cannot reproduce it: with no GPU it is fill-rate bound long
      // before it reaches the enemy density a real device sees. So the device
      // has to be able to report its own numbers, and they have to be legible
      // in a photograph of the screen — the same reason the renderer name and
      // the build string are already up there.
      //
      //   u  milliseconds of JavaScript in the simulation, per frame
      //   r  milliseconds of JavaScript building the frame, per frame
      //   ▲  the single worst frame in the last half second
      //
      // A high ▲ with low u and r means the pause is not in this code.
      const s = loop.stats
      hud.textContent =
        `${s.fps} fps · ${swarm.count}e · u${s.updateMs.toFixed(1)} r${s.renderMs.toFixed(1)} ` +
        `▲${s.worstFrameMs.toFixed(0)} · ${stage.rendererType} · ${BUILD}`
      ui.updateLoadout(loadout)
      // The hint must not bleed through the level-up cards, which sit exactly
      // where it is drawn.
      const showHint = playing && joystick.idleTime() > 3 && !run.over && !levelUp.visible
      hint.style.opacity = showHint ? '0.55' : '0'
      // The harness needs to know which screen it is looking at: a screenshot
      // of the hub and a screenshot of a stalled boot are both "not the game".
      document.body.dataset.screen = title.visible
        ? 'title'
        : creator.visible
          ? 'create'
          : codex.visible
            ? 'codex'
            : hub.visible
              ? 'hub'
              : run.over
                ? 'over'
                : 'run'
      document.body.dataset.level = String(character.level)
      // Published so the screenshot harness can assert that a synthetic drag
      // actually moved the player. An invisible overlay once swallowed every
      // touch on the device while the game itself kept running perfectly, and
      // nothing in the pipeline noticed — a screenshot of a stationary
      // character looks identical to a screenshot of a moving one.
      document.body.dataset.px = String(Math.round(player.x))
      document.body.dataset.py = String(Math.round(player.y))
      // Published so a performance report can be turned into a measurement.
      // "It stutters on my phone" is unactionable; "render costs 9ms with 240
      // enemies" points at one loop.
      document.body.dataset.perf = JSON.stringify({
        fps: loop.stats.fps,
        update: +loop.stats.updateMs.toFixed(2),
        render: +loop.stats.renderMs.toFixed(2),
        worst: +loop.stats.worstFrameMs.toFixed(1),
        enemies: swarm.count,
      })
    }
    requestAnimationFrame(hudTick)
  }
  hudTick()

  /**
   * The way in.
   *
   *   first launch:  title -> create -> codex -> hub
   *   returning:     title -> hub
   *
   * Opening straight on the hub was the previous behaviour and it was reported
   * as exactly what it was: a panel of attributes and roads with no name on it,
   * no premise, and no reason to care about a single number on the screen. A
   * management screen is a fine second impression and a poor first one.
   */
  /**
   * Opens character creation.
   *
   * Reached two ways, and the difference is one argument: on a first launch
   * there is nothing to go back to, so no way out is offered; from the hub
   * there is, so cancelling returns the existing swordsman untouched.
   */
  startCreation = (fromHub = true): void => {
    // Named for readability rather than reproducibility: this stream feeds
    // nothing the simulation depends on.
    const nameRng = new Rng((Date.now() ^ 0x9e3779b9) >>> 0)
    creator.show(
      () => nameRng.next(),
      (name, school, look) => {
        character = createCharacter(name, school.id, look)
        character.spent = applySchool(school, character.spent)
        // The school's kit and weapon are handed over and worn, so the very
        // first expedition is fought with the weapon that was chosen rather
        // than with a default the player never picked.
        const weaponItem = ITEMS.find((i) => i.slot === 'weapon' && i.styleId === school.weaponId)
        for (const id of [...school.kit, weaponItem?.id]) {
          if (!id) continue
          acquire(character.inventory, id)
          equip(character.inventory, id)
        }
        kit = currentKit()
        stats = deriveStats(loadout, kit)
        rebuildFigure()
        persist()
        creator.hide()
        // The codex lands here on a first launch, between choosing a swordsman
        // and first seeing the hub — after the player has something to care
        // about, and before they are shown numbers they have no frame for. A
        // returning player has read it, so they go straight through.
        if (fromHub) {
          openHub()
          return
        }
        codex.show(() => {
          codex.hide()
          openHub()
        })
      },
      fromHub
        ? () => {
            creator.hide()
            openHub()
          }
        : undefined,
    )
  }

  const enter = (): void => {
    title.show(isFirstLaunch ? null : character.name, () => {
      title.hide()
      if (!isFirstLaunch) {
        openHub()
        return
      }
      startCreation(false)
    },
    // Start over, from the one screen where somebody actually looks for it.
    // The same confirmation as the hub's — destructive, and it says so.
    () => confirmNewCharacter(),
    )
  }
  enter()

  const fadeStart = performance.now()
  const fade = (): void => {
    const t = Math.min(1, (performance.now() - fadeStart) / 620)
    bootScreen.style.opacity = String(1 - easing.outCubic(t))
    if (t < 1) requestAnimationFrame(fade)
    else bootScreen.classList.add('gone')
  }
  requestAnimationFrame(fade)

  document.body.dataset.ready = '1'
  await hideSplash()
}

// A watchdog independent of boot(): if the game hangs before ever reaching the
// hide call, the splash still comes down and whatever is on the webview —
// an error, a blank canvas — becomes visible and reportable.
setTimeout(() => void hideSplash(), 4000)

boot().catch((err) => {
  console.error(err)
  showFatal(err)
  void hideSplash()
})

window.addEventListener('error', (e) => showFatal(e.error ?? e.message))
window.addEventListener('unhandledrejection', (e) => showFatal(e.reason))
