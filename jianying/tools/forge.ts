/**
 * MOCKUP: the forge screen, at the size of the actual phone.
 *
 *   npx tsx tools/forge.ts
 *
 * Every other proposal sheet has been a wide contact sheet, which is a good way
 * to compare figures and a bad way to judge a screen. A layout that reads on a
 * 1180px page can be unusable at 393px, and 393px is the only width that
 * matters here. So this is rendered as real HTML at a real Pixel viewport,
 * using the game's own palette and the game's own figure geometry.
 *
 * SCOPE: levels only. No lineages, no sockets, no rites. That is a deliberate
 * cut, made after five documents produced more confusion than agreement — the
 * full four-axis system is Path of Exile's depth on a screen played with one
 * thumb, and there is no point building the other three axes before the first
 * one has been felt on a device.
 *
 * WHAT IT ADDS, and it is one sentence: a piece has a rank, duplicates raise
 * it, and every rank is visible on the silhouette.
 *
 * WHY THAT ONE FIRST. A duplicate is currently the game's most common
 * disappointment — the drop screen literally says "already yours" and the item
 * is dead weight. Under this it becomes the only thing that raises what you
 * wear. The most frequent bad moment in the loop turns into the currency, and
 * it needs no new drop table, no new items and no new geometry beyond the rank
 * marks themselves.
 */
import { chromium } from 'playwright'
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { palette } from '../src/render/palette'
import { gearFromIds } from '../src/render/wardrobe'
import { figure, hex, socketsAt } from './sheet'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'docs')
const CHROMIUM = existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined

// Pixel 5 — the same target the screenshot harness uses, so this mockup and the
// real screenshots are directly comparable.
const PHONE_W = 393
const PHONE_H = 851

const GEAR = gearFromIds({ robe: 'lamellar', shoulders: 'pauldron', head: 'hat', blade: 'dao' })

/** The swordsman at a rank, wrapped as a standalone svg the page can size. */
function portrait(rank: number, scale = 2.0): string {
  const cell = figure(GEAR, 7, scale, { accent: palette.gold, rank })
  const halfW = 46 * scale
  const top = -58 * scale
  return (
    `<svg viewBox="${-halfW} ${top} ${halfW * 2} ${(cell.bottom - top + 6 * scale).toFixed(1)}" ` +
    `style="width:100%;height:100%;overflow:visible">${cell.markup}</svg>`
  )
}

/** The 阶 pips. Five, because rank 5 is the ceiling. */
function pips(rank: number, cap: number): string {
  let out = ''
  for (let i = 1; i <= 5; i++) {
    const cls = i <= rank ? 'pip pip-on' : i <= cap ? 'pip' : 'pip pip-locked'
    out += `<span class="${cls}"></span>`
  }
  return out
}

interface Frame {
  caption: string
  note: string
  rank: number
  cap: number
  dupes: number
  state: 'ready' | 'capped' | 'empty'
}

const FRAMES: Frame[] = [
  {
    caption: 'Before',
    note: 'Two hems. Three spare Lamellar Skirts sitting in the chest doing nothing.',
    rank: 2,
    cap: 3,
    dupes: 3,
    state: 'ready',
  },
  {
    caption: 'After one temper',
    note: 'A third hem appears, and the health line moves. Two spares left.',
    rank: 3,
    cap: 3,
    dupes: 2,
    state: 'capped',
  },
  {
    caption: 'Nothing to feed it',
    note: 'The button says what is missing rather than greying out silently.',
    rank: 1,
    cap: 3,
    dupes: 0,
    state: 'empty',
  },
]

const HP_AT = (rank: number): number => 28 + rank * 6

function frameHtml(f: Frame): string {
  const next = f.rank + 1
  const canTemper = f.state === 'ready'
  const button =
    f.state === 'capped'
      ? `<button class="go go-off" disabled>
           <span class="go-seal">淬</span>
           <span class="go-text">Realm 3 reached<em>raise your cultivation to go further</em></span>
         </button>`
      : f.state === 'empty'
        ? `<button class="go go-off" disabled>
             <span class="go-seal">淬</span>
             <span class="go-text">No spare Lamellar Skirt<em>find another to temper this one</em></span>
           </button>`
        : `<button class="go">
             <span class="go-seal">淬</span>
             <span class="go-text">Temper to 阶 ${next}<em>spends 1 of your ${f.dupes} spares</em></span>
           </button>`

  return `
  <div class="frame">
    <div class="phone">
      <div class="head">
        <div class="seal">筑基</div>
        <div class="ident">
          <div class="name">Chen Liuyun</div>
          <div class="realm">Foundation <span class="lv">Realm 3</span></div>
          <div class="track"><i style="transform:scaleX(0.42)"></i></div>
        </div>
        <div class="help">?</div>
      </div>

      <div class="body">
        <div class="stage">${portrait(f.rank)}</div>

        <div class="piece">
          <div class="piece-name">Lamellar Skirt</div>
          <div class="piece-rank">
            <span class="rank-seal">阶 ${f.rank}</span>
            <span class="pips">${pips(f.rank, f.cap)}</span>
          </div>
          <div class="piece-stat">
            +${HP_AT(f.rank)} max health
            ${canTemper ? `<span class="arrow">→ +${HP_AT(next)}</span>` : ''}
          </div>
        </div>

        <div class="fuel">
          <span class="fuel-label">Spares in the chest</span>
          <span class="fuel-count ${f.dupes === 0 ? 'fuel-none' : ''}">${f.dupes}</span>
        </div>
        <div class="fuel-note">
          A duplicate used to be dead weight. It is the only thing that raises what you wear.
        </div>
      </div>

      ${button}

      <div class="tabs">
        <div class="tab"><b>剑</b><span>Swordsman</span></div>
        <div class="tab"><b>装</b><span>Equipment</span></div>
        <div class="tab tab-on"><b>炉</b><span>Forge</span></div>
        <div class="tab"><b>界</b><span>World</span></div>
      </div>
    </div>
    <div class="caption">${f.caption}</div>
    <div class="cap-note">${f.note}</div>
  </div>`
}

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    background: #cbbf9f;
    font-family: system-ui, -apple-system, sans-serif;
    padding: 34px 30px 40px;
    display: flex;
    gap: 30px;
    align-items: flex-start;
  }
  .frame { width: ${PHONE_W}px; }
  .phone {
    width: ${PHONE_W}px; height: ${PHONE_H}px;
    background: ${hex(palette.paper)};
    color: ${hex(palette.ink)};
    display: flex; flex-direction: column;
    border-radius: 6px; overflow: hidden;
    box-shadow: 0 6px 26px rgba(0,0,0,0.22);
  }
  .caption { margin-top: 14px; font-size: 15px; color: ${hex(palette.ink)}; }
  .cap-note { margin-top: 4px; font-size: 11.5px; line-height: 1.45; color: rgba(13,13,13,0.5); }

  /* --- header, copied from the shipped hub so this is comparable ------- */
  .head {
    flex: none; display: flex; align-items: center; gap: 14px;
    padding: 16px 18px 12px;
    border-bottom: 1px solid rgba(13,13,13,0.1);
  }
  .seal {
    flex: none; width: 52px; height: 52px; display: grid; place-content: center;
    font-family: serif; font-size: 17px; color: ${hex(palette.paper)};
    background: ${hex(palette.cinnabar)}; border-radius: 2px;
  }
  .ident { flex: 1; min-width: 0; }
  .name { font-size: 19px; }
  .realm { margin-top: 2px; font-size: 12.5px; color: rgba(13,13,13,0.55); }
  .lv { color: ${hex(palette.gold)}; margin-left: 5px; }
  .track { margin-top: 7px; height: 4px; background: rgba(13,13,13,0.12); border-radius: 2px; overflow: hidden; }
  .track i { display:block; height:100%; background: ${hex(palette.gold)}; transform-origin: left; }
  .help {
    flex: none; width: 30px; height: 30px; display: grid; place-content: center;
    font-size: 14px; color: rgba(13,13,13,0.4);
    border: 1px solid rgba(13,13,13,0.14); border-radius: 50%;
  }

  .body { flex: 1; min-height: 0; padding: 6px 18px 12px; display: flex; flex-direction: column; }
  .stage { height: 236px; display: flex; justify-content: center; align-items: flex-end; }

  /* --- the piece ------------------------------------------------------- */
  .piece { text-align: center; margin-top: 4px; }
  .piece-name { font-size: 17px; }
  .piece-rank {
    margin-top: 7px; display: flex; align-items: center; justify-content: center; gap: 10px;
  }
  .rank-seal { font-size: 15px; color: ${hex(palette.cinnabar)}; }
  .pips { display: inline-flex; gap: 5px; }
  .pip {
    width: 9px; height: 9px; border-radius: 50%;
    border: 1px solid rgba(13,13,13,0.28);
  }
  .pip-on { background: ${hex(palette.gold)}; border-color: ${hex(palette.gold)}; }
  /* Locked pips are dashed rather than hidden: the ceiling has to be visible
     BEFORE you hit it, or reaching it feels like a bug. */
  .pip-locked { border-style: dashed; opacity: 0.4; }
  .piece-stat { margin-top: 9px; font-size: 13px; color: rgba(13,13,13,0.6); }
  .arrow { color: ${hex(palette.cinnabar)}; margin-left: 6px; }

  /* --- the fuel -------------------------------------------------------- */
  .fuel {
    margin-top: auto; display: flex; align-items: center; justify-content: space-between;
    padding: 12px 14px;
    background: rgba(13,13,13,0.045); border-radius: 3px;
  }
  .fuel-label { font-size: 12px; color: rgba(13,13,13,0.5); }
  .fuel-count { font-size: 19px; color: ${hex(palette.goldDeep)}; }
  .fuel-none { color: rgba(13,13,13,0.28); }
  .fuel-note { margin-top: 8px; font-size: 10.5px; line-height: 1.45; color: rgba(13,13,13,0.38); }

  /* --- the action, pinned above the tabs ------------------------------- */
  .go {
    flex: none; display: flex; align-items: center; gap: 12px;
    margin: 12px 18px; padding: 13px 16px;
    font: inherit; text-align: left;
    color: ${hex(palette.paper)}; background: ${hex(palette.ink)};
    border: 0; border-radius: 3px;
  }
  .go-off {
    color: rgba(13,13,13,0.4); background: none;
    border: 1px solid rgba(13,13,13,0.16);
  }
  .go-seal { font-family: serif; font-size: 23px; }
  .go-off .go-seal { color: rgba(13,13,13,0.25); }
  .go-text { font-size: 14px; letter-spacing: 0.04em; }
  .go-text em { display: block; margin-top: 2px; font-style: normal; font-size: 10.5px; opacity: 0.6; }

  /* --- tabs ------------------------------------------------------------ */
  .tabs {
    flex: none; display: flex;
    border-top: 1px solid rgba(13,13,13,0.12); background: rgba(13,13,13,0.035);
  }
  .tab {
    flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
    padding: 9px 4px 12px; color: rgba(13,13,13,0.4);
    border-top: 2px solid transparent;
  }
  .tab b { font-family: serif; font-size: 17px; font-weight: 400; }
  .tab span { font-size: 8.5px; letter-spacing: 0.05em; text-transform: uppercase; }
  .tab-on {
    color: ${hex(palette.ink)};
    border-top-color: ${hex(palette.cinnabar)};
    background: ${hex(palette.paper)};
  }
</style></head><body>${FRAMES.map(frameHtml).join('')}</body></html>`

await mkdir(OUT, { recursive: true })
const page = join(OUT, 'forge.html')
await writeFile(page, html, 'utf8')

const browser = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const tab = await browser.newPage({
  viewport: { width: (PHONE_W + 30) * FRAMES.length + 30, height: PHONE_H + 140 },
  deviceScaleFactor: 2,
})
await tab.setContent(html)
await tab.waitForTimeout(500)
await tab.screenshot({ path: join(OUT, 'forge.png') })
await browser.close()

console.log(`page:   ${page}`)
console.log(`shot:   ${join(OUT, 'forge.png')}  ${FRAMES.length} frames at ${PHONE_W}×${PHONE_H}`)
console.log(`scope:  ranks only — no lineages, no sockets (${socketsAt(5)} would have been the socket count)`)
