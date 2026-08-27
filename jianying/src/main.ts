/**
 * Phase 0.3 — framed like the genre, driven by a thumb.
 *
 * The camera now owns framing. Until this version the figure's own scale
 * doubled as the zoom, so making the character readable also pinned the camera
 * right on top of it and the visible field shrank to almost nothing. A
 * survivors-like lives on seeing the swarm arrive, so the world is now measured
 * in world units and the camera decides how many of them fit on screen.
 *
 * Everything inside `stage.world` is therefore positioned in WORLD coordinates;
 * the container itself carries the camera transform. No manual world-to-screen
 * conversion is done anywhere below, which is what previously invited drift
 * between the character, its shadow and the ground.
 */
import { Container, Graphics } from 'pixi.js'
import { SplashScreen } from '@capacitor/splash-screen'
import { GameLoop } from './core/loop'
import { Rng } from './core/rng'
import { clamp01, easing, expDecay, lerp } from './core/tween'
import { buildBlade, buildSwordsmanTopDown, sashPoly, sashSpine } from './render/figure'
import { createCamera, fitCamera, resetCamera, updateCamera } from './render/camera'
import { palette } from './render/palette'
import { createStage } from './render/stage'
import { createPlayer, MAX_SPEED, playerSpeedRatio, updatePlayer } from './sim/player'
import { createJoystick } from './ui/joystick'
import { strings } from './ui/strings'

const BUILD = '0.3.0'

/**
 * Dismisses the native splash screen.
 *
 * Forgetting this is what made the first APK a black screen: the splash is a
 * native view sitting ON TOP of the webview, so the game was running and
 * rendering the whole time, entirely hidden behind it.
 */
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
  const bootScreen = document.getElementById('boot')!

  hint.textContent = strings.moveHint

  const stage = await createStage(host)
  const sashRng = new Rng(1337)

  // The figure is built once in world units. Its on-screen size is now purely a
  // function of camera zoom, which is what lets framing be tuned without
  // redrawing anything.
  const figure = buildSwordsmanTopDown(7, 1)
  const bladeStrokes = buildBlade(2, 1)

  const player = createPlayer(0, 0)
  const camera = createCamera(0, 0)
  resetCamera(camera, 0, 0)
  fitCamera(camera, stage.height)
  const joystick = createJoystick(host)

  // ---- Scene ------------------------------------------------------------

  // A soft wash under the feet, outside the character container so the body's
  // lean and bob do not distort it — a shadow that leans with its owner reads
  // as wrong immediately.
  const shadow = new Graphics()
  shadow.ellipse(0, 0, 15, 5).fill({ color: palette.inkSoft, alpha: 0.18 })
  shadow.zIndex = -1
  stage.world.addChild(shadow)

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

  // Depth inside the character is dynamic, not fixed: a blade aimed away from
  // the camera has to pass BEHIND the body, and a sash streaming toward the
  // camera has to fall in FRONT of it. With a static order, aiming upward drew
  // the sword straight through the swordsman's head.
  character.sortableChildren = true
  bodyGfx.zIndex = 0
  character.addChild(sashGfx, bodyGfx, bladeGfx)
  stage.world.addChild(character)

  /** Chest height, in world units — where the blade pivots. */
  const BLADE_PIVOT_Y = -26

  // Joystick ring, drawn in the overlay so the camera never moves or scales it.
  const stickGfx = new Graphics()
  stage.overlay.addChild(stickGfx)

  stage.app.renderer.on('resize', () => fitCamera(camera, stage.height))

  // ---- Simulation -------------------------------------------------------

  let time = 0
  // Aim eases toward facing so the blade sweeps around rather than snapping.
  let aimX = 1
  let aimY = 0

  const update = (dt: number): void => {
    time += dt
    joystick.tick(dt)

    const { x: ix, y: iy } = joystick.state
    updatePlayer(player, ix, iy, dt)
    updateCamera(camera, player, MAX_SPEED, dt)

    aimX = expDecay(aimX, player.faceX, 0.07, dt)
    aimY = expDecay(aimY, player.faceY, 0.07, dt)
  }

  // ---- Render -----------------------------------------------------------

  const render = (alpha: number): void => {
    const wx = lerp(player.prevX, player.x, alpha)
    const wy = lerp(player.prevY, player.y, alpha)
    const zoom = camera.zoom

    // The world container carries the whole camera transform, so everything
    // inside it can be positioned in plain world coordinates.
    stage.world.scale.set(zoom)
    stage.world.x = stage.width / 2 - camera.x * zoom
    stage.world.y = stage.height / 2 - camera.y * zoom

    const ratio = playerSpeedRatio(player)

    // Gentle bob, faster when moving, so the figure is never frozen.
    const bobRate = 2.0 + ratio * 6
    const bob = Math.sin(time * bobRate) * (0.6 + ratio * 1.3)

    character.x = wx
    character.y = wy + bob
    // A slight lean into travel. No mirroring: the figure is symmetric, which
    // is what removes the squash-through-zero the side profile suffered.
    character.rotation = clamp01(ratio) * (player.vx / MAX_SPEED) * 0.13

    shadow.x = wx
    shadow.y = wy
    const lift = 1 - Math.abs(bob) / 2.6
    shadow.scale.set(0.88 + lift * 0.16)
    shadow.alpha = 0.7 + lift * 0.3

    // Blade points where the player is heading.
    bladeGfx.rotation = Math.atan2(aimY, aimX)
    bladeGfx.y = BLADE_PIVOT_Y
    // Foreshortening: aimed sideways the blade shows its full length, aimed
    // toward or away from the camera it is mostly pointing at the viewer and
    // should read as short. Scaling local x shortens it along its own axis.
    bladeGfx.scale.x = 0.5 + 0.5 * Math.abs(aimX)
    bladeGfx.zIndex = aimY < 0 ? -1 : 2

    // Sash streams opposite to travel.
    sashRng.snapshot = 1337
    const spine = sashSpine(figure.sashAnchor, time, -aimX, -aimY, ratio * MAX_SPEED, 1)
    const poly = sashPoly(spine, sashRng, 1)
    sashGfx.clear()
    if (poly.length >= 6) {
      sashGfx.poly(poly).fill({ color: palette.cinnabar, alpha: 0.88 })
    }
    sashGfx.zIndex = -aimY > 0 ? 3 : -2

    // The ground is the world seen through the same lens, so it scrolls AND
    // scales with the camera. Scrolling it without scaling would make the paper
    // grain drift at a different rate from everything standing on it.
    stage.ground.tileScale.set(zoom)
    stage.ground.tilePosition.x = -camera.x * zoom
    stage.ground.tilePosition.y = -camera.y * zoom

    // Joystick, in screen space.
    stickGfx.clear()
    if (joystick.state.active) {
      const s = joystick.state
      stickGfx
        .circle(s.originX, s.originY, 54)
        .stroke({ width: 1.5, color: palette.ink, alpha: 0.18 })
      stickGfx.circle(s.thumbX, s.thumbY, 20).fill({ color: palette.ink, alpha: 0.24 })
    }
  }

  const loop = new GameLoop({ update, render })
  loop.start()

  // Android suspends rAF in the background; without this the first frame back
  // would simulate the entire time the app was away.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) loop.resetClock()
  })

  let hudTimer = 0
  const hudTick = (): void => {
    hudTimer++
    if (hudTimer % 20 === 0) {
      // The renderer type is on the HUD deliberately: if a device ever falls
      // back or fails, that single word is the difference between diagnosing it
      // from a photo and guessing.
      hud.textContent =
        `${loop.stats.fps} fps · ${Math.round(stage.width)}×${Math.round(stage.height)} · ` +
        `${stage.rendererType} · ${BUILD}`
      hint.style.opacity = joystick.idleTime() > 3 ? '0.55' : '0'
    }
    requestAnimationFrame(hudTick)
  }
  hudTick()

  // Fade the boot seal out on an ease, not a cut.
  const fadeStart = performance.now()
  const fade = (): void => {
    const t = Math.min(1, (performance.now() - fadeStart) / 620)
    bootScreen.style.opacity = String(1 - easing.outCubic(t))
    if (t < 1) requestAnimationFrame(fade)
    else bootScreen.classList.add('gone')
  }
  requestAnimationFrame(fade)

  // Signals to the screenshot harness that the first real frame is on screen.
  document.body.dataset.ready = '1'

  // Only now, with a frame actually presented, is it safe to drop the splash.
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

// Errors thrown after boot resolves (inside the loop, a plugin callback) would
// otherwise leave a frozen picture with no explanation.
window.addEventListener('error', (e) => showFatal(e.error ?? e.message))
window.addEventListener('unhandledrejection', (e) => showFatal(e.reason))
