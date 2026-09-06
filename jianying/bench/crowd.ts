/**
 * How much a crowd costs to DRAW, isolated from the game.
 *
 * tools/perf.mts plays a real expedition and reports where the frame time goes,
 * which is the right instrument for "is it the update or the render" — and the
 * wrong one for this question, because it gives the game no input, so the
 * player stands still, the swarm walks into the sweep and dies, and the probe
 * peaked at TWENTY-THREE enemies across a hundred and fifty seconds. Every
 * performance number this project has ever printed was taken on an empty field.
 *
 * The report from a real phone is 21-30 fps LATE in a run, which is exactly
 * when the field is full. So the thing to measure is the draw cost against the
 * crowd size, with nothing else running, up to the pool's own ceiling.
 *
 * Two ways of drawing the same silhouettes, side by side:
 *
 *   GRAPHICS  what the game does — clear() and re-submit every polygon of every
 *             enemy, every frame, which makes Pixi re-triangulate all of it.
 *   SPRITES   each enemy KIND rasterised once into a texture; a crowd is then N
 *             sprites moved, which Pixi batches into one draw call.
 *
 * The absolute milliseconds are a CPU-rasterising container and predict nothing
 * about a phone. The RATIO between the two, and how each SCALES with the crowd,
 * transfer to any hardware.
 */
import { Application, Container, Graphics, Sprite, Texture } from 'pixi.js'
import { ENEMY_KINDS } from '../src/data/enemies'
import { buildEnemyArt } from '../src/render/enemyArt'
import { palette } from '../src/render/palette'

const SIZES = [50, 150, 300, 420]
/** Frames timed per size, after a warm-up. */
const FRAMES = 90

interface Body {
  x: number
  y: number
  phase: number
  kind: string
}

const app = new Application()
await app.init({ width: 390, height: 844, background: palette.paper, antialias: false })
document.body.appendChild(app.canvas)

const art = buildEnemyArt(ENEMY_KINDS)
const kinds = [...art.keys()]

const bodies = (n: number): Body[] =>
  Array.from({ length: n }, (_, i) => ({
    x: (i * 97) % 390,
    y: (i * 53) % 844,
    phase: i * 0.7,
    kind: kinds[i % kinds.length]!,
  }))

/** One texture per kind, rasterised once from the same polygons. */
const textures = new Map<string, Texture>()
for (const [id, a] of art) {
  const g = new Graphics()
  for (const s of a.body) g.poly([...s.poly]).fill({ color: a.accent, alpha: s.alpha })
  textures.set(id, app.renderer.generateTexture({ target: g, resolution: 2 }))
  g.destroy()
}

const gfx = new Graphics()
const pool = new Container()
app.stage.addChild(gfx, pool)

const sprites: Sprite[] = []
for (let i = 0; i < Math.max(...SIZES); i++) {
  const s = new Sprite()
  s.anchor.set(0.5)
  s.visible = false
  pool.addChild(s)
  sprites.push(s)
}

function drawGraphics(list: Body[], time: number): void {
  gfx.clear()
  for (const b of list) {
    const a = art.get(b.kind)!
    const sway = Math.sin(time * 3.4 + b.phase) * 0.6
    for (const s of a.body) {
      const poly = s.poly
      const moved = new Array<number>(poly.length)
      for (let k = 0; k < poly.length; k += 2) {
        moved[k] = poly[k]! + b.x + sway
        moved[k + 1] = poly[k + 1]! + b.y
      }
      gfx.poly(moved).fill({ color: a.accent, alpha: s.alpha })
    }
  }
}

function drawSprites(list: Body[], time: number): void {
  for (let i = 0; i < sprites.length; i++) {
    const s = sprites[i]!
    const b = list[i]
    if (!b) { s.visible = false; continue }
    s.visible = true
    s.texture = textures.get(b.kind)!
    s.x = b.x + Math.sin(time * 3.4 + b.phase) * 0.6
    s.y = b.y
  }
}

/** Median frame cost, because one GC pause must not decide the answer. */
async function time(draw: (l: Body[], t: number) => void, list: Body[]): Promise<number> {
  for (let i = 0; i < 20; i++) { draw(list, i * 0.016); app.render() }
  const ms: number[] = []
  for (let i = 0; i < FRAMES; i++) {
    const t0 = performance.now()
    draw(list, i * 0.016)
    app.render()
    ms.push(performance.now() - t0)
    await new Promise((r) => requestAnimationFrame(() => r(null)))
  }
  ms.sort((a, b) => a - b)
  return ms[Math.floor(ms.length / 2)]!
}

const rows: Array<{ n: number; graphics: number; sprites: number }> = []
for (const n of SIZES) {
  const list = bodies(n)
  pool.visible = false
  gfx.visible = true
  const g = await time(drawGraphics, list)
  gfx.clear()
  gfx.visible = false
  pool.visible = true
  const s = await time(drawSprites, list)
  rows.push({ n, graphics: g, sprites: s })
}
pool.visible = false
;(window as unknown as { CROWD: unknown }).CROWD = rows
document.title = 'done'
