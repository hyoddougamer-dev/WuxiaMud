/**
 * Phase 0.2 — overhead view, real input.
 *
 * The first build was a side profile watching an autopilot wander. Two things
 * were wrong with that, and they were related: easing the character's POSITION
 * toward a random target produced a lurch-then-drift motion, and a side profile
 * can only face two ways, so every turn flipped scale.x through zero and
 * visibly squashed the figure flat.
 *
 * Both are gone. Movement now integrates a velocity that eases toward a target
 * (see sim/player.ts), and the camera looks down at a symmetric character that
 * never mirrors. There is still no gameplay — but the movement is now something
 * a thumb can actually judge.
 */
import { Container, Graphics } from 'pixi.js'
import { SplashScreen } from '@capacitor/splash-screen'
import { GameLoop } from './core/loop'
import { Rng } from './core/rng'
import { clamp01, easing, expDecay, lerp } from './core/tween'
import { buildBlade, buildSwordsmanTopDown, sashPoly, sashSpine } from './render/figure'
import { createCamera, resetCamera, updateCamera } from './render/camera'
import { palette } from './render/palette'
import { createStage } from './render/stage'
import { createPlayer, MAX_SPEED, playerSpeedRatio, updatePlayer } from './sim/player'
import { createJoystick } from './ui/joystick'

const BUILD = '0.2.0 · vista ¾'

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
  title.textContent = '剑影 não arrancou'
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

  const stage = await createStage(host)
  const sashRng = new Rng(1337)

  const scale = Math.min(2.6, Math.max(1.5, stage.width / 200))
  const figure = buildSwordsmanTopDown(7, scale)
  const bladeStrokes = buildBlade(2, scale)

  const player = createPlayer(0, 0)
  const camera = createCamera(0, 0)
  resetCamera(camera, 0, 0)
  const joystick = createJoystick(host)

  // ---- Scene ------------------------------------------------------------

  // A soft wash under the feet, outside the character container so the body's
  // lean and bob do not distort it — a shadow that leans with its owner reads
  // as wrong immediately.
  const shadow = new Graphics()
  shadow.ellipse(0, 0, 15 * scale, 5 * scale).fill({ color: palette.inkSoft, alpha: 0.18 })
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

  // The blade pivots at chest height rather than at the feet.
  const bladePivotY = -26 * scale

  // Joystick ring, drawn in the overlay so the camera never moves it.
  const stickGfx = new Graphics()
  stage.overlay.addChild(stickGfx)

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

    // World -> screen. The player is drawn wherever the camera puts them, which
    // is near but not exactly at the centre once look-ahead is in play.
    const cx = stage.width / 2
    const cy = stage.height / 2
    const px = wx - camera.x + cx
    const py = wy - camera.y + cy

    const ratio = playerSpeedRatio(player)

    // Gentle bob, faster when moving, so the figure is never frozen.
    const bobRate = 2.0 + ratio * 6
    const bob = Math.sin(time * bobRate) * (1.0 + ratio * 2.2) * scale * 0.5

    character.x = px
    character.y = py + bob
    // A slight lean into travel. No mirroring: the figure is symmetric, which
    // is exactly what removes the squash-through-zero of the side profile.
    character.rotation = clamp01(ratio) * (player.vx / MAX_SPEED) * 0.13

    shadow.x = px
    shadow.y = py
    const lift = 1 - Math.abs(bob) / (5 * scale)
    shadow.scale.set(0.88 + lift * 0.16)
    shadow.alpha = 0.7 + lift * 0.3

    // Blade points where the player is heading.
    bladeGfx.rotation = Math.atan2(aimY, aimX)
    bladeGfx.y = bladePivotY
    // Foreshortening: aimed sideways the blade shows its full length, aimed
    // toward or away from the camera it is mostly pointing at the viewer and
    // should read as short. Scaling local x shortens it along its own axis.
    bladeGfx.scale.x = 0.5 + 0.5 * Math.abs(aimX)
    // Behind the body when aimed away from the camera.
    bladeGfx.zIndex = aimY < 0 ? -1 : 2

    // Sash streams opposite to travel; at rest it settles toward the camera.
    sashRng.snapshot = 1337
    const speed = ratio * MAX_SPEED
    const trailX = -aimX
    const trailY = -aimY
    // In front of the body when it streams toward the camera, behind otherwise.
    sashGfx.zIndex = trailY > 0 ? 3 : -2
    const spine = sashSpine(figure.sashAnchor, time, trailX, trailY, speed, scale)
    const poly = sashPoly(spine, sashRng, scale)
    sashGfx.clear()
    if (poly.length >= 6) {
      sashGfx.poly(poly).fill({ color: palette.cinnabar, alpha: 0.88 })
    }

    // The ground is the world: scrolling it by the camera is what makes the
    // player feel like they are moving through a place rather than on a
    // treadmill.
    stage.ground.tilePosition.x = -camera.x
    stage.ground.tilePosition.y = -camera.y

    // Joystick.
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
      // The hint fades once the player has understood the controls, and comes
      // back if they put the phone down and lose their place.
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
