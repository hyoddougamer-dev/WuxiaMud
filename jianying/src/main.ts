/**
 * Phase 1 — a game you can lose.
 *
 * Enemies chase, the sword answers on its own, contact hurts, and the run ends.
 * The one design decision worth recording here is that the blade aims at the
 * nearest enemy rather than along the direction of travel. Aiming along
 * movement was the original plan and the headless simulation killed it: enemies
 * chase, so they sit BEHIND a moving player, and a forward arc swept empty
 * ground for zero kills in every play style except standing perfectly still.
 */
import { Container, Graphics } from 'pixi.js'
import { SplashScreen } from '@capacitor/splash-screen'
import { GameLoop } from './core/loop'
import { Rng, dailySeed } from './core/rng'
import { clamp01, easing, lerp } from './core/tween'
import { ENEMY_KINDS } from './data/enemies'
import { buildBlade, buildSwordsmanTopDown, sashPoly, sashSpine } from './render/figure'
import { buildEnemyArt } from './render/enemyArt'
import { createCamera, fitCamera, resetCamera, updateCamera } from './render/camera'
import { mixColor, palette } from './render/palette'
import { createStage } from './render/stage'
import { Swarm } from './sim/enemies'
import {
  PLAYER_MAX_HP,
  SLASH_HALF_ANGLE,
  SLASH_RANGE,
  SLASH_VISUAL,
  createRun,
  updateCombat,
} from './sim/combat'
import { createPlayer, MAX_SPEED, playerSpeedRatio, updatePlayer } from './sim/player'
import { createHud } from './ui/hud'
import { createJoystick } from './ui/joystick'
import { strings } from './ui/strings'

const BUILD = '1.0.0'

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

  const figure = buildSwordsmanTopDown(7, 1)
  const bladeStrokes = buildBlade(2, 1)
  const enemyArt = buildEnemyArt(ENEMY_KINDS)

  const player = createPlayer(0, 0)
  const camera = createCamera(0, 0)
  const runSeed = dailySeed()
  const swarm = new Swarm(new Rng(runSeed))
  let run = createRun()

  resetCamera(camera, 0, 0)
  fitCamera(camera, stage.height)
  const joystick = createJoystick(host)
  const ui = createHud(uiRoot)

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

  // The sweep, drawn as an ink wedge that fades over its short life.
  const slashGfx = new Graphics()
  slashGfx.zIndex = 1
  stage.world.addChild(slashGfx)

  const character = new Container()
  const sashGfx = new Graphics()

  const bladeGfx = new Graphics()
  for (const stroke of bladeStrokes) {
    bladeGfx.poly(stroke.poly).fill({ color: palette.ink, alpha: stroke.alpha })
  }

  const bodyGfx = new Graphics()
  for (const stroke of figure.bleed) {
    bodyGfx.poly(stroke.poly).fill({ color: palette.ink, alpha: stroke.alpha })
  }
  for (const stroke of figure.body) {
    bodyGfx.poly(stroke.poly).fill({ color: palette.ink, alpha: stroke.alpha })
  }

  // Depth inside the character is dynamic: a blade aimed away from the camera
  // passes BEHIND the body, a sash streaming toward it falls in FRONT.
  character.sortableChildren = true
  bodyGfx.zIndex = 0
  character.addChild(sashGfx, bodyGfx, bladeGfx)
  character.zIndex = 2
  stage.world.addChild(character)

  /** Chest height, in world units — where the blade pivots. */
  const BLADE_PIVOT_Y = -26

  const stickGfx = new Graphics()
  stage.overlay.addChild(stickGfx)

  stage.app.renderer.on('resize', () => fitCamera(camera, stage.height))

  // ---- Run lifecycle ----------------------------------------------------

  let gameOverShown = false

  const restart = (): void => {
    player.x = 0
    player.y = 0
    player.prevX = 0
    player.prevY = 0
    player.vx = 0
    player.vy = 0
    swarm.reset(runSeed)
    run = createRun()
    resetCamera(camera, 0, 0)
    gameOverShown = false
    ui.hideGameOver()
  }

  // ---- Simulation -------------------------------------------------------

  let time = 0

  const update = (dt: number): void => {
    time += dt
    joystick.tick(dt)

    if (run.over) return

    const { x: ix, y: iy } = joystick.state
    updatePlayer(player, ix, iy, dt)
    swarm.update(player.x, player.y, run.elapsed, dt)
    updateCombat(run, player, swarm, dt)
    updateCamera(camera, player, MAX_SPEED, dt)
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

    const ratio = playerSpeedRatio(player)
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
      const tint = e.hitFlash > 0 ? mixColor(palette.ink, palette.cinnabar, e.hitFlash / 0.12) : palette.ink
      // Idle sway, phase-shifted per enemy so a crowd never pulses in unison.
      const sway = Math.sin(time * 3.4 + e.phase) * 0.6

      const push = (poly: number[], a: number): void => {
        // Translate in place rather than using a container per enemy.
        const moved = new Array<number>(poly.length)
        for (let k = 0; k < poly.length; k += 2) {
          moved[k] = poly[k]! + ex + sway
          moved[k + 1] = poly[k + 1]! + ey
        }
        enemyGfx.poly(moved).fill({ color: tint, alpha: a })
      }
      for (const s of art.bleed) push(s.poly, s.alpha)
      for (const s of art.body) push(s.poly, s.alpha)
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
      const reach = SLASH_RANGE * (0.72 + 0.28 * ease)
      const width = 15 * ease
      const steps = 20

      const outer: number[] = []
      const inner: number[] = []
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const a = angle - SLASH_HALF_ANGLE + 2 * SLASH_HALF_ANGLE * t
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

    // --- character -----------------------------------------------------
    character.x = wx
    character.y = wy + bob
    character.rotation = clamp01(ratio) * (player.vx / MAX_SPEED) * 0.13
    // Flash the swordsman while immune, so being hit is legible.
    character.alpha = run.immunity > 0 && Math.floor(time * 14) % 2 === 0 ? 0.45 : 1

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
    const spine = sashSpine(figure.sashAnchor, time, -aimX, -aimY, ratio * MAX_SPEED, 1)
    const poly = sashPoly(spine, sashRng, 1)
    sashGfx.clear()
    if (poly.length >= 6) {
      sashGfx.poly(poly).fill({ color: palette.cinnabar, alpha: 0.88 })
    }
    sashGfx.zIndex = -aimY > 0 ? 3 : -2

    // --- ground --------------------------------------------------------
    stage.ground.tileScale.set(zoom)
    stage.ground.tilePosition.x = -camera.x * zoom
    stage.ground.tilePosition.y = -camera.y * zoom

    // --- ui ------------------------------------------------------------
    ui.update(run.hp, PLAYER_MAX_HP, run.elapsed, run.kills)
    if (run.over && !gameOverShown) {
      gameOverShown = true
      ui.showGameOver(run.elapsed, run.kills, restart)
    }

    stickGfx.clear()
    if (joystick.state.active && !run.over) {
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
      hud.textContent =
        `${loop.stats.fps} fps · ${swarm.count} · ${stage.rendererType} · ${BUILD}`
      hint.style.opacity = joystick.idleTime() > 3 && !run.over ? '0.55' : '0'
      // Published so the screenshot harness can assert that a synthetic drag
      // actually moved the player. An invisible overlay once swallowed every
      // touch on the device while the game itself kept running perfectly, and
      // nothing in the pipeline noticed — a screenshot of a stationary
      // character looks identical to a screenshot of a moving one.
      document.body.dataset.px = String(Math.round(player.x))
      document.body.dataset.py = String(Math.round(player.y))
    }
    requestAnimationFrame(hudTick)
  }
  hudTick()

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
