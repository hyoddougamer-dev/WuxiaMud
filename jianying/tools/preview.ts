/**
 * One portrait, large, exactly as the DOM screens draw it.
 *
 *   npx tsx tools/preview.ts [bearing] [pigment] [robe shoulders head blade]
 *
 * The contact sheets shrink every figure to thumbnail size, which hides the
 * faults that only show at the size the hub actually renders. This draws one.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { palette } from '../src/render/palette'
import { gearFromIds } from '../src/render/wardrobe'
import { portraitSvg } from '../src/render/silhouette'
import type { Look } from '../src/meta/look'

const [b = '1', p = '2', robe = 'court', shoulders = 'wide', head = 'topknot', blade = 'jian'] =
  process.argv.slice(2)

const look: Look = { seed: 7, build: 1, sash: 0, bearing: +b, pigment: +p }
const gear = gearFromIds({ robe, shoulders, head, blade })
const hex = (c: number): string => `#${c.toString(16).padStart(6, '0')}`

// Every slot at full rank, so the marks can be judged rather than assumed.
const ranked = [
  { slot: 'robe' as const, rank: 5 },
  { slot: 'shoulders' as const, rank: 4 },
  { slot: 'head' as const, rank: 3 },
  { slot: 'weapon' as const, rank: 2 },
]
const inner = portraitSvg(gear, look, process.env.RANKED ? { box: 82, ranked } : { box: 82 }).replace(
  '<svg class="portrait-svg" ',
  '<svg width="600" height="640" x="0" y="0" ',
)
const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 640" width="600" height="640">` +
  `<rect width="600" height="640" fill="${hex(palette.paper)}"/>${inner}</svg>`

const OUT = join(fileURLToPath(new URL('..', import.meta.url)), 'docs')
await mkdir(OUT, { recursive: true })
await writeFile(join(OUT, 'preview.svg'), svg, 'utf8')
console.log(`preview: docs/preview.svg  ${robe}/${shoulders}/${head}/${blade}`)
