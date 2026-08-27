/**
 * Phase 0 entry point.
 *
 * The goal of this build is to prove the whole pipeline end to end — code here,
 * built in CI, installed as an APK on a real phone — so it deliberately
 * contains no gameplay. What it does contain is the art direction and the
 * motion language, because those are the two things that cannot be judged from
 * a description and need to be looked at on a real screen.
 */
import { Container, Graphics } from 'pixi.js'
import { SplashScreen } from '@capacitor/splash-screen'
import { GameLoop } from './core/loop'
import { Rng } from './core/rng'
import { easing, expDecay, lerp } from './core/tween'
import { buildSwordsman, sashPoly, sashSpine } from './render/figure'
import { palette } from './render/palette'
import { createStage } from './render/stage'

const BUILD = '0.1.0 · fase 0'

/**
 * Dismisses the native splash screen.
 *
 * Forgetting this is what made the first APK a black screen: the splash is a
 * native view sitting ON TOP of the webview, so the game was running and
 * rendering the whole time, entirely hidden behind it.
 *
 * Safe to call more than once, and a no-op in a browser where the plugin is
 * not implemented — hence the swallowed error rather than a guard.
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
 *
 * On a phone there is no console to open, so an uncaught error during boot is
 * indistinguishable from a crash, a hang, or a blank canvas. Rendering the
 * message is the only diagnostic channel that survives the trip to a device.
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
  const bootScreen = document.getElementById('boot')!

  const stage = await createStage(host)
  const rng = new Rng(20260827)
  const sashRng = new Rng(1337)

  const scale = Math.min(3.2, Math.max(1.8, stage.width / 165))
  const figure = buildSwordsman(7, scale)

  // Distant mountain washes. Empty paper is part of the 留白 tradition, but a
  // completely bare field reads as "unfinished" rather than "composed" — two
  // faint ridges give the eye a horizon to place the figure against.
  const mountains = new Graphics()
  const ridgeRng = new Rng(4)
  for (let layer = 0; layer < 3; layer++) {
    const baseY = stage.height * (0.30 + layer * 0.055)
    const pts: number[] = [-40, stage.height]
    let x = -40
    while (x < stage.width + 40) {
      const step = ridgeRng.range(40, 110)
      const peak = ridgeRng.range(18, 62) * (1 - layer * 0.22)
      pts.push(x, baseY - peak * 0.35, x + step * 0.5, baseY - peak)
      x += step
    }
    pts.push(stage.width + 40, baseY, stage.width + 40, stage.height)
    mountains
      .poly(pts)
      .fill({ color: palette.inkSoft, alpha: 0.055 + layer * 0.035 })
  }
  mountains.zIndex = -1000
  stage.world.addChild(mountains)

  // A soft wash under the feet. Without it the silhouette floats: the eye has
  // nothing telling it where the figure meets the ground. It lives outside the
  // character container so the character's lean and turn-squash do not distort
  // it — a shadow that leans with its owner looks wrong immediately.
  const shadow = new Graphics()
  shadow.ellipse(0, 0, 13 * scale, 3.4 * scale).fill({ color: palette.inkSoft, alpha: 0.2 })
  shadow.zIndex = -1
  stage.world.addChild(shadow)

  // The character: static strokes drawn once, then only ever transformed.
  const character = new Container()
  const bodyGfx = new Graphics()
  // Bleed underneath, solid on top — the pair is what reads as wet ink.
  for (const stroke of figure.bleed) {
    bodyGfx.poly(stroke.poly).fill({ color: palette.ink, alpha: stroke.alpha })
  }
  for (const stroke of figure.body) {
    bodyGfx.poly(stroke.poly).fill({ color: palette.ink, alpha: stroke.alpha })
  }
  const sashGfx = new Graphics()
  character.addChild(sashGfx, bodyGfx)
  character.zIndex = 0
  stage.world.addChild(character)

  // A cinnabar seal, bottom-right, the way a painting is signed.
  const seal = new Graphics()
  seal.roundRect(0, 0, 30 * scale * 0.5, 30 * scale * 0.5, 3).fill({
    color: palette.cinnabar,
    alpha: 0.85,
  })
  stage.overlay.addChild(seal)

  // Wander state. The figure drifts between targets rather than sitting still,
  // which is what actually exercises the sash and the easing on screen.
  let x = stage.width / 2
  let y = stage.height * 0.58
  let targetX = x
  let targetY = y
  let prevX = x
  let prevY = y
  let velX = 0
  let velY = 0
  let time = 0
  let retargetIn = 0
  let facing = 1
  let facingTarget = 1

  const pickTarget = () => {
    targetX = rng.range(stage.width * 0.22, stage.width * 0.78)
    targetY = rng.range(stage.height * 0.42, stage.height * 0.74)
    retargetIn = rng.range(1.4, 3.0)
  }
  pickTarget()

  const update = (dt: number): void => {
    time += dt
    retargetIn -= dt
    if (retargetIn <= 0) pickTarget()

    prevX = x
    prevY = y

    // expDecay rather than a fixed lerp: the approach must not change speed
    // with the frame rate, or a 120Hz phone would play a different game.
    x = expDecay(x, targetX, 0.55, dt)
    y = expDecay(y, targetY, 0.65, dt)

    velX = (x - prevX) / dt
    velY = (y - prevY) / dt

    if (Math.abs(velX) > 6) facingTarget = velX > 0 ? 1 : -1
    // Turning is eased too — an instant flip is the single most robotic thing
    // a 2D character can do.
    facing = expDecay(facing, facingTarget, 0.08, dt)
  }

  const render = (alpha: number): void => {
    const px = lerp(prevX, x, alpha)
    const py = lerp(prevY, y, alpha)

    const speed = Math.hypot(velX, velY)
    // Gentle bob, faster when moving, so the figure never looks frozen.
    const bobRate = 2.2 + Math.min(speed / 55, 4)
    const bob = Math.sin(time * bobRate) * (1.1 + Math.min(speed / 90, 2.2)) * scale * 0.5
    // Lean into the direction of travel.
    const lean = Math.max(-0.16, Math.min(0.16, velX / 900))

    character.x = px
    character.y = py + bob
    character.rotation = lean
    character.scale.x = facing
    character.scale.y = 1

    // The shadow stays on the ground plane while the figure bobs above it, and
    // shrinks slightly as it rises — that offset is what sells the bob as
    // vertical motion rather than the whole scene drifting.
    shadow.x = px
    shadow.y = py
    const lift = 1 - Math.abs(bob) / (7 * scale)
    shadow.scale.set(0.9 + lift * 0.16, 0.9 + lift * 0.16)
    shadow.alpha = 0.75 + lift * 0.25

    sashGfx.clear()
    // Reusing one Rng and rewinding it keeps the ribbon's outline stable frame
    // to frame (it would otherwise crawl) without allocating in the hot path.
    sashRng.snapshot = 1337
    const spine = sashSpine(figure.sashAnchor, time, velX * facing, velY, scale)
    const poly = sashPoly(spine, sashRng, scale)
    if (poly.length >= 6) {
      sashGfx.poly(poly).fill({ color: palette.cinnabar, alpha: 0.88 })
    }

    // The ground drifts opposite to the figure — parallax without a camera yet.
    stage.ground.tilePosition.x = -px * 0.12
    stage.ground.tilePosition.y = -py * 0.12

    seal.x = stage.width - 30 * scale * 0.5 - 16
    seal.y = stage.height - 30 * scale * 0.5 - 16
    seal.rotation = Math.sin(time * 0.4) * 0.02
  }

  const loop = new GameLoop({ update, render })
  loop.start()

  // Android suspends rAF in the background; without this the first frame back
  // would simulate the entire time the app was away.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) loop.resetClock()
  })

  let hudTimer = 0
  const hudTick = () => {
    hudTimer++
    if (hudTimer % 20 === 0) {
      // The renderer type is on the HUD deliberately: if a device ever falls
      // back or fails, that single word is the difference between diagnosing it
      // from a photo and guessing.
      hud.textContent =
        `${loop.stats.fps} fps · ${Math.round(stage.width)}×${Math.round(stage.height)} · ` +
        `${stage.rendererType} · ${BUILD}`
    }
    requestAnimationFrame(hudTick)
  }
  hudTick()

  // Fade the boot seal out on an ease, not a cut.
  const fadeStart = performance.now()
  const fade = () => {
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
