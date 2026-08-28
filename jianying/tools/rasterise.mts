/**
 * Turns an SVG sheet into a PNG.
 *
 *   npx tsx tools/rasterise.mts shots/progression.svg
 *
 * The contact sheets are written as SVG because that is what the figure
 * geometry naturally produces and it stays crisp at any zoom. But an SVG is
 * awkward to look at on a phone — some viewers refuse it, others render it at
 * the wrong scale — and these sheets exist precisely to be looked at on a
 * phone. So there is a PNG beside every one.
 *
 * Chromium rather than a rasteriser library: it is already installed for the
 * screenshot harness, and it is the same engine the game runs in, so what comes
 * out is what the device would draw rather than a second opinion about it.
 */
import { chromium } from 'playwright'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const CHROMIUM = existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined

const input = process.argv[2]
if (!input) {
  console.error('usage: npx tsx tools/rasterise.mts <file.svg> [scale]')
  process.exit(1)
}
const scale = Number(process.argv[3] ?? 1.5)
const output = input.replace(/\.svg$/, '.png')

const svg = await readFile(input, 'utf8')
const box = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
if (!box) {
  console.error(`no viewBox in ${input} — cannot size the page`)
  process.exit(1)
}
const width = Math.ceil(Number(box[1]))
const height = Math.ceil(Number(box[2]))

// Spread rather than a possibly-undefined property: under
// exactOptionalPropertyTypes, `executablePath: undefined` is not the same as
// omitting it, and Playwright treats the two differently.
const browser = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const page = await browser.newPage({
  viewport: { width, height },
  deviceScaleFactor: scale,
})
// setContent rather than navigating to the file: loading an SVG as a document
// makes Chromium apply its own sizing, and screenshotting that hangs waiting
// for a layout that never settles.
await page.setContent(`<body style="margin:0">${svg}</body>`)
await page.waitForTimeout(600)
await page.screenshot({ path: output })
await browser.close()

console.log(`png:    ${output}  ${width}×${height} at ${scale}×`)
