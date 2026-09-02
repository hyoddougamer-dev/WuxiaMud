/**
 * Shrinks a generated image down to something a game can ship.
 *
 *   npx tsx tools/optimise.mts docs/generated/road.png src/assets/road.webp 800
 *
 * There is no ImageMagick, no Pillow and no sharp on the machine this project
 * is built on — measured, not assumed. There IS a Chromium, because the visual
 * harness needs one, and a browser is a perfectly good image pipeline: decode,
 * draw to a canvas at the target size, encode. It is the same trick the SVG
 * rasteriser already uses, pointed at a raster instead.
 *
 * WebP rather than PNG. These are ink washes — thousands of soft grey values
 * over paper grain, which is the worst possible case for PNG's lossless
 * palette and the best case for a lossy codec. The 2.6 MB original comes out
 * around a tenth of that with no visible loss at phone size, and the whole
 * point is that this file is inlined into the single-file build as base64,
 * where every kilobyte is a kilobyte the player waits for.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname } from 'node:path'
import { chromium } from 'playwright'

const [input, output, widthArg = '800', qualityArg = '0.74'] = process.argv.slice(2)
if (!input || !output) throw new Error('uso: optimise.mts <entrada> <saída.webp> [largura] [qualidade]')

const raw = await readFile(input)
const CHROMIUM = existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined
const browser = await chromium.launch({
  args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  ...(CHROMIUM ? { executablePath: CHROMIUM } : {}),
})
const page = await browser.newPage()

const encoded = await page.evaluate(
  async ({ b64, width, quality }: { b64: string; width: number; quality: number }) => {
    const img = new Image()
    img.src = `data:image/png;base64,${b64}`
    await img.decode()
    const scale = Math.min(1, width / img.naturalWidth)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * scale)
    canvas.height = Math.round(img.naturalHeight * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('sem contexto 2d')
    // High-quality downscale. The default is a box filter, which turns paper
    // grain into aliasing — the one artefact that would give away that this
    // painting has been through a machine.
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const url = canvas.toDataURL('image/webp', quality)
    if (!url.startsWith('data:image/webp')) throw new Error('este Chromium não codifica webp')
    return { data: url.slice(url.indexOf(',') + 1), w: canvas.width, h: canvas.height }
  },
  { b64: raw.toString('base64'), width: Number(widthArg), quality: Number(qualityArg) },
)
await browser.close()

const out = Buffer.from(encoded.data, 'base64')
await mkdir(dirname(output), { recursive: true })
await writeFile(output, out)
const kb = (n: number): string => `${Math.round(n / 1024)} kB`
console.log(`${input}  ${kb(raw.length)}  ->  ${output}  ${kb(out.length)}  (${encoded.w}x${encoded.h})`)
