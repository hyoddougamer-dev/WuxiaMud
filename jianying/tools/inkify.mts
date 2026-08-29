/**
 * Pushes a raster image into this game's ink palette.
 *
 *   npx tsx tools/inkify.mts <in.png> [out.png]
 *
 * This is the half of AI art that decides whether it works, and it is the half
 * people skip. Generated images arrive with their own colour, their own
 * lighting and their own idea of contrast, and ten of them side by side look
 * like ten different games — which is exactly the inconsistency that makes
 * generated art read as cheap. Running every one through the same fixed
 * transform is what makes them a set.
 *
 * The transform, in order:
 *   1. luminance — colour is thrown away entirely, because this game has four
 *      colours and none of them is negotiable;
 *   2. a contrast curve with a black point and a white point, which is what
 *      turns a soft render into something with the weight of a brush mark;
 *   3. a duotone remap onto paper → ink, so the darks land on the game's ink
 *      and the lights land on the game's paper rather than on white;
 *   4. a little paper grain, at the same amplitude the game's own background
 *      uses, so the result sits on the page instead of floating above it.
 *
 * Chromium rather than an image library: it is already installed for the
 * screenshot harness and for `rasterise.mts`, so this adds no dependency, and
 * canvas gives exact per-pixel control.
 */
import { chromium } from 'playwright'
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { palette } from '../src/render/palette'

const CHROMIUM = existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined

const input = process.argv[2]
if (!input) {
  console.error('usage: npx tsx tools/inkify.mts <in.png> [out.png]')
  process.exit(1)
}
const output = process.argv[3] ?? input.replace(/(\.\w+)$/, '.ink$1')

/** Black point, white point and grain. Tuned once; every image gets the same. */
const BLACK = 0.18
const WHITE = 0.82
const GRAIN = 0.03

const rgb = (c: number): [number, number, number] => [(c >> 16) & 255, (c >> 8) & 255, c & 255]

const data = await readFile(input)
// Under exactOptionalPropertyTypes, `executablePath: undefined` is not the same
// as omitting it — the same shape rasterise.mts uses.
const browser = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const page = await browser.newPage()

const result = await page.evaluate(
  async ({ b64, ink, paper, black, white, grain }) => {
    const img = new Image()
    img.src = `data:image/png;base64,${b64}`
    await img.decode()

    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)

    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const px = frame.data

    for (let i = 0; i < px.length; i += 4) {
      // Rec. 709 luminance. A flat average turns reds and blues into the same
      // grey and loses the separation a generated image actually carries.
      const lum = (0.2126 * px[i]! + 0.7152 * px[i + 1]! + 0.0722 * px[i + 2]!) / 255
      let t = (lum - black) / (white - black)
      t = t < 0 ? 0 : t > 1 ? 1 : t
      // Grain from a cheap deterministic hash of the pixel index, written
      // inline: a named helper inside `page.evaluate` is rewritten by the TS
      // loader into a call to `__name`, which does not exist in the page.
      // Math.random() would also make the same input produce a different file
      // every run, and then no diff of a regenerated asset would be readable.
      let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b)
      h = (h ^ (h >>> 13)) >>> 0
      t += (h / 4294967296 - 0.5) * grain
      t = t < 0 ? 0 : t > 1 ? 1 : t
      for (let c = 0; c < 3; c++) {
        px[i + c] = Math.round(ink[c]! + (paper[c]! - ink[c]!) * t)
      }
      // Alpha is left alone: a generated piece with a cut-out background should
      // keep its cut-out.
    }
    ctx.putImageData(frame, 0, 0)
    return {
      png: canvas.toDataURL('image/png').split(',')[1]!,
      w: canvas.width,
      h: canvas.height,
    }
  },
  {
    b64: data.toString('base64'),
    ink: rgb(palette.ink),
    paper: rgb(palette.paper),
    black: BLACK,
    white: WHITE,
    grain: GRAIN,
  },
)

await browser.close()
await writeFile(output, Buffer.from(result.png, 'base64'))
console.log(`inkify: ${output}  ${result.w}×${result.h}`)
