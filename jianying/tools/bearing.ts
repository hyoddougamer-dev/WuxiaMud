/**
 * Man against woman, across the wardrobe.
 *
 *   npx tsx tools/bearing.ts
 *
 * Built because the first attempt at this was reported as invisible, and it
 * was: the difference was seven percent of shoulder width and a thin hair
 * stroke, applied to a robe that was ONE sweep from collar to hem. A bell has
 * no waist, so it has no sex — widening a bell slightly produces a slightly
 * wider bell.
 *
 * The sheet exists so the claim can be checked rather than asserted. Every pair
 * is the same gear, the same brush hand and the same build, differing only in
 * bearing. If a pair looks the same here it looks the same in the game, and the
 * work is not done.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { palette } from '../src/render/palette'
import { gearFromIds } from '../src/render/wardrobe'
import { BEARINGS, PIGMENTS, type Look } from '../src/meta/look'
import { portraitSvg } from '../src/render/silhouette'
import { SETS } from './setdata'
import { W, columns, heading, hex, label } from './sheet'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'docs')

const look = (bearing: number, pigment = 0): Look => ({
  seed: 7,
  build: 1,
  sash: 0,
  bearing,
  pigment,
})

const rows: string[] = []
let y = 0

/** portraitSvg sizes itself from CSS, so the sheet wraps it at a fixed size. */
function portrait(gear: ReturnType<typeof gearFromIds>, l: Look, x: number, yy: number, h: number): string {
  const svg = portraitSvg(gear, l, { box: 84 })
    .replace('<svg class="portrait-svg" ', `<svg width="${h * 0.92}" height="${h}" x="${x - h * 0.46}" y="${yy - h}" `)
  return svg
}

rows.push(
  `<text x="40" y="40" font-family="system-ui, sans-serif" font-size="15" letter-spacing="3" ` +
    `fill="${hex(palette.ink)}" fill-opacity="0.5">剑影 JIÀNYǏNG · MAN AND WOMAN — IN THE GAME</text>`,
  `<text x="40" y="62" font-family="system-ui, sans-serif" font-size="12.5" fill="${hex(palette.cinnabar)}">` +
    `Same gear, same brush hand, same build. Only the bearing differs. This is the shipped geometry, not a proposal.</text>`,
)
y = 62

// --- 1. the same set, both bearings --------------------------------------
y += 54
rows.push(
  heading(
    y,
    '一',
    'The waist is what carries it',
    'The robe used to be one sweep from collar to hem — a bell, and a bell has no waist, so widening its shoulders by a few percent changed nothing anybody could see. It is now a torso and a skirt, and where the waist sits is the first thing the eye reads in any period silhouette.',
  ),
)
y += 100

{
  const sets = SETS.slice(0, 5)
  const base = y + 210
  const x = columns(sets.length * 2, 60)
  sets.forEach((set, i) => {
    const gear = gearFromIds({
      robe: set.pieces.robe,
      shoulders: set.pieces.shoulders,
      head: set.pieces.head,
      blade: set.pieces.weapon,
    })
    BEARINGS.forEach((b, k) => {
      const cx = x(i * 2 + k)
      rows.push(portrait(gear, look(k), cx, base, 190))
      rows.push(label(cx, base + 22, b.name, 11.5, hex(palette.ink), k === 1 ? 0.85 : 0.55))
    })
    rows.push(label((x(i * 2) + x(i * 2 + 1)) / 2, base + 44, set.seal, 15, hex(palette.cinnabar)))
    rows.push(label((x(i * 2) + x(i * 2 + 1)) / 2, base + 62, set.name, 10.5, hex(palette.ink), 0.45))
  })
  y = base + 100
}

// --- 2. dyed ---------------------------------------------------------------
y += 26
rows.push(
  heading(
    y,
    '二',
    'And the dye, on both',
    'The robe takes the pigment and every other mark stays ink, so the silhouette survives at any colour. Six dyes, alternating bearing, on the same set.',
  ),
)
y += 96

{
  const set = SETS[1]!
  const gear = gearFromIds({
    robe: set.pieces.robe,
    shoulders: set.pieces.shoulders,
    head: set.pieces.head,
    blade: set.pieces.weapon,
  })
  const base = y + 200
  const x = columns(PIGMENTS.length, 60)
  PIGMENTS.forEach((pigment, i) => {
    const cx = x(i)
    rows.push(portrait(gear, look(i % 2, i), cx, base, 178))
    rows.push(
      label(cx, base + 22, `${pigment.seal} ${pigment.name}`, 11, hex(pigment.colour ?? palette.ink), 0.9),
    )
    rows.push(label(cx, base + 38, BEARINGS[i % 2]!.name, 9.5, hex(palette.ink), 0.4))
  })
  y = base + 76
}

const H = y + 30
const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
  `<rect width="${W}" height="${H}" fill="${hex(palette.paper)}"/>` +
  rows.join('') +
  `</svg>`

await mkdir(OUT, { recursive: true })
await writeFile(join(OUT, 'bearing.svg'), svg, 'utf8')
console.log(`sheet:  ${join(OUT, 'bearing.svg')}`)
console.log(
  `waist:  man ${BEARINGS[0]!.waist} cinch ${BEARINGS[0]!.cinch} · woman ${BEARINGS[1]!.waist} cinch ${BEARINGS[1]!.cinch}`,
)
