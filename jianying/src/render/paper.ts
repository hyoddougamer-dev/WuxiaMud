/**
 * Procedural aged-paper texture.
 *
 * Generated into an offscreen canvas at boot rather than shipped as an image:
 * it costs no download, scales to any device pixel ratio, and — because every
 * mark is drawn with wrap-around duplicates — tiles seamlessly.
 *
 * The grain matters more than it sounds. A flat fill reads as "unfinished
 * placeholder"; the same colour with fibre and blotching reads as a deliberate
 * material, and it is what lets plain black silhouettes look like ink on paper.
 */
import { Rng } from '../core/rng'

const SIZE = 256

/**
 * Runs `draw` once at (x,y) plus duplicates across each edge it is near, so a
 * mark straddling the boundary appears on both sides and the tile is seamless.
 */
function wrapped(
  x: number,
  y: number,
  radius: number,
  draw: (x: number, y: number) => void,
): void {
  const offsets: number[] = [0]
  if (x < radius) offsets.push(SIZE)
  else if (x > SIZE - radius) offsets.push(-SIZE)

  const yOffsets: number[] = [0]
  if (y < radius) yOffsets.push(SIZE)
  else if (y > SIZE - radius) yOffsets.push(-SIZE)

  for (const ox of offsets) {
    for (const oy of yOffsets) {
      draw(x + ox, y + oy)
    }
  }
}

export function createPaperTexture(seed = 20260827): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')!
  const rng = new Rng(seed)

  ctx.fillStyle = '#e8dcc0'
  ctx.fillRect(0, 0, SIZE, SIZE)

  // Broad tonal blotches — the unevenness of a hand-made sheet.
  for (let i = 0; i < 26; i++) {
    const x = rng.range(0, SIZE)
    const y = rng.range(0, SIZE)
    const r = rng.range(28, 84)
    const dark = rng.chance(0.55)
    wrapped(x, y, r, (px, py) => {
      const grad = ctx.createRadialGradient(px, py, 0, px, py, r)
      const alpha = rng.range(0.012, 0.05)
      grad.addColorStop(0, dark ? `rgba(120,100,70,${alpha})` : `rgba(255,248,225,${alpha})`)
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(px, py, r, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  // Fibres. Short, near-horizontal or near-vertical hairs pressed into the pulp.
  ctx.lineCap = 'round'
  for (let i = 0; i < 900; i++) {
    const x = rng.range(0, SIZE)
    const y = rng.range(0, SIZE)
    const len = rng.range(2, 11)
    const angle = rng.chance(0.5) ? rng.range(-0.4, 0.4) : rng.range(1.2, 1.95)
    const dx = Math.cos(angle) * len
    const dy = Math.sin(angle) * len
    const dark = rng.chance(0.6)
    ctx.strokeStyle = dark
      ? `rgba(96,80,56,${rng.range(0.04, 0.13)})`
      : `rgba(255,252,238,${rng.range(0.05, 0.16)})`
    ctx.lineWidth = rng.range(0.4, 1.1)
    wrapped(x, y, len + 2, (px, py) => {
      ctx.beginPath()
      ctx.moveTo(px, py)
      ctx.lineTo(px + dx, py + dy)
      ctx.stroke()
    })
  }

  // Foxing: the tiny dark specks of age.
  for (let i = 0; i < 240; i++) {
    const x = rng.range(0, SIZE)
    const y = rng.range(0, SIZE)
    const r = rng.range(0.3, 1.3)
    ctx.fillStyle = `rgba(90,70,45,${rng.range(0.05, 0.2)})`
    wrapped(x, y, r + 1, (px, py) => {
      ctx.beginPath()
      ctx.arc(px, py, r, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  return canvas
}
