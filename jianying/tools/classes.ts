/**
 * The two classes, side by side, in every robe the game can put them in.
 *
 *   npx tsx tools/classes.ts
 *
 * This sheet exists because of the report that started the whole overhaul: the
 * six weapon portraits were the same character six times. That was only
 * provable by rendering them together — the numbers said the weapons differed,
 * and they did, in a stroke beside a body nobody had changed.
 *
 * So the bar is now visual and the check is a photograph: put a 斩马刀 next to
 * a 飞刀 in the same robe, the same bearing, the same brush hand, and see
 * whether they are two people. If they are not, the stance numbers are wrong,
 * whatever they claim.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { palette } from '../src/render/palette'
import { gearFromIds, ROBES } from '../src/render/wardrobe'
import { portraitSvg } from '../src/render/silhouette'
import type { Look } from '../src/meta/look'

const hex = (c: number): string => `#${c.toString(16).padStart(6, '0')}`

const CLASSES = [
  { blade: 'great', seal: '斩', name: 'Heavy Zhanmadao' },
  { blade: 'feidao', seal: '飞刀', name: 'Flying Daggers' },
] as const

const cell = (robe: string, shoulders: string, head: string, blade: string, look: Look): string => {
  const svg = portraitSvg(gearFromIds({ robe, shoulders, head, blade }), look, { box: 88 })
  return `<div class="fig">${svg}</div>`
}

const rows: string[] = []
for (const robe of ROBES) {
  const cells: string[] = []
  for (const bearing of [0, 1]) {
    for (const c of CLASSES) {
      const look: Look = { seed: 7, build: 1, sash: 0, bearing, pigment: 0 }
      cells.push(
        `<div class="cell">${cell(robe.id, 'plain', 'topknot', c.blade, look)}` +
          `<div class="cap">${c.seal}</div></div>`,
      )
    }
  }
  rows.push(`<div class="row"><div class="lab">${robe.name}</div>${cells.join('')}</div>`)
}

const html = `<!doctype html><meta charset="utf-8"><style>
  body { margin: 0; background: ${hex(palette.paper)}; color: ${hex(palette.ink)};
         font-family: system-ui, sans-serif; padding: 18px 20px; }
  h1 { font-size: 15px; letter-spacing: .2em; text-transform: uppercase; color: ${hex(palette.goldDeep)}; margin: 0 0 4px; }
  .sub { font-size: 12px; color: rgba(13,13,13,.55); margin-bottom: 14px; }
  .row { display: flex; align-items: flex-end; gap: 6px; border-top: 1px solid rgba(13,13,13,.12); padding: 8px 0; }
  .lab { width: 128px; font-size: 12px; color: rgba(13,13,13,.6); }
  .cell { width: 104px; text-align: center; }
  .fig { height: 128px; display: flex; align-items: flex-end; justify-content: center; }
  .fig svg { height: 128px; }
  .cap { font-size: 12px; color: rgba(13,13,13,.5); }
  .head { display: flex; gap: 6px; margin-left: 128px; font-size: 11px; color: rgba(13,13,13,.45); }
  .head div { width: 104px; text-align: center; }
</style>
<h1>斩马刀 / 飞刀</h1>
<div class="sub">Same robe, same brush hand, same bearing — only the class differs.</div>
<div class="head"><div>man 斩</div><div>man 飞</div><div>woman 斩</div><div>woman 飞</div></div>
${rows.join('')}`

const OUT = join(fileURLToPath(new URL('..', import.meta.url)), 'docs')
await mkdir(OUT, { recursive: true })
await writeFile(join(OUT, 'classes.html'), html, 'utf8')
console.log('classes: docs/classes.html')
