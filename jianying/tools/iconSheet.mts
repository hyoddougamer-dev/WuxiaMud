/**
 * Every mark the game draws, on one page, at the two sizes it is drawn at.
 *
 *   npx tsx tools/iconSheet.mts        # writes docs/icons.html
 *
 * WHY A SHEET AND NOT JUST THE TEST. tests/packIcons.spec.ts proves no two
 * entries share GEOMETRY, which is the check a machine can make. It cannot tell
 * you that two different drawings read as the same thing at 16px on a phone —
 * a crescent and a curved blade are different paths and one silhouette. That
 * judgement needs an eye, and an eye needs them side by side at the real size.
 *
 * Both sizes, because half a shortlist has been dropped before for turning to
 * mush at 16 while looking fine at 40.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  PACK_ICON,
  PACK_CONDITION_ICON,
  PACK_SLOT_ICON,
  PACK_WEAPON_ICON,
  packIconSvg,
} from '../src/render/packIcons'
import { SKILLS } from '../src/data/skills'
import { CONDITION_BY_ID, type Condition } from '../src/data/arts'
import { palette } from '../src/render/palette'

const OUT = join(fileURLToPath(new URL('..', import.meta.url)), 'docs')

const cell = (label: string, sub: string, name: string): string => `
  <div class="cell">
    <div class="big">${packIconSvg(name, palette.ink, 1, 'ic')}</div>
    <div class="small">${packIconSvg(name, palette.ink, 1, 'ic')}</div>
    <b>${label}</b>
    <span>${sub}</span>
    <u>${name}</u>
  </div>`

const group = (title: string, note: string, cells: string): string => `
  <section>
    <h2>${title}</h2>
    <p>${note}</p>
    <div class="grid">${cells}</div>
  </section>`

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>剑影 · every mark</title>
<style>
  :root { --ink:#0d0d0d; --paper:#e8dcc0; --gold:#8a6d16; --cinnabar:#c1272d; }
  body { margin:0; background:var(--paper); color:var(--ink);
    font:14px/1.5 -apple-system,"Segoe UI",Roboto,sans-serif; }
  .page { max-width: 1000px; margin: 0 auto; padding: 34px 20px 64px; }
  h1 { font: 600 30px/1.1 Georgia, serif; margin: 0 0 6px; }
  .lede { max-width: 62ch; opacity: 0.72; margin: 0 0 6px; }
  h2 { font: 600 19px/1.2 Georgia, serif; margin: 34px 0 4px;
    padding-top: 16px; border-top: 1px solid rgba(13,13,13,0.16); }
  section p { max-width: 68ch; font-size: 13px; opacity: 0.62; margin: 0 0 16px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); gap: 10px; }
  .cell { display: grid; justify-items: center; gap: 2px;
    padding: 12px 8px 10px; border: 1px solid rgba(13,13,13,0.14); border-radius: 6px;
    background: rgba(255,255,255,0.24); }
  .big .ic { width: 40px; height: 40px; display: block; }
  /* The size the HUD tile and the hub row actually draw, side by side with the
     big one — the whole reason this page exists. */
  .small .ic { width: 16px; height: 16px; display: block; margin: 4px 0 4px; }
  .cell b { font-size: 12.5px; font-weight: 600; text-align: center; }
  .cell span { font-size: 11px; opacity: 0.6; text-align: center; }
  .cell u { font-family: ui-monospace, Menlo, monospace; font-size: 9.5px;
    opacity: 0.4; text-decoration: none; }
  .row { display:flex; flex-wrap:wrap; gap:8px; margin-top:6px; }
  .strip { display:flex; align-items:center; gap:6px; padding:6px 10px;
    border:1px solid rgba(13,13,13,0.16); border-radius:5px; background: rgba(255,255,255,0.3); }
  .strip .ic { width:16px; height:16px; }
  .strip em { font-style:normal; font-size:12px; }
  .seal { font: 400 15px/1 Georgia, serif; color: var(--cinnabar); }
</style></head><body><div class="page">
<h1>Every mark the game draws</h1>
<p class="lede">Thirty glyphs, each at 40px and at the 16px the HUD and the hub actually
draw them. A machine can prove no two share geometry; only an eye can say whether two
different drawings read as the same thing on a phone.</p>

${group(
  'Effects — what a skill does',
  'One per effect in the simulation\'s vocabulary. Thirteen of the sixteen are used by a skill; the three that are not are levers gear may take later.',
  Object.entries(PACK_ICON)
    .map(([effect, name]) => {
      const users = SKILLS.filter((s) => s.effect === effect).map((s) => s.name)
      return cell(effect, users.join(' · ') || '— no skill uses it —', name)
    })
    .join(''),
)}

${group(
  'Postures — what pays a skill more',
  'A seal may never be the only thing carrying a mechanic: these are pictures of what to DO, drawn beside the seal rather than instead of it.',
  Object.entries(PACK_CONDITION_ICON)
    .map(([id, name]) => {
      const cond = CONDITION_BY_ID.get(id as Condition)
      return cell(cond?.name ?? id, cond?.how ?? '', name)
    })
    .join(''),
)}

${group(
  'Slots and weapons — what a thing IS',
  'These sit on items rather than on abilities, and that is exactly why they may not repeat an effect mark: the same drawing must not mean "hits harder" on one screen and "this is what you are holding" on another.',
  [
    ...Object.entries(PACK_SLOT_ICON).map(([slot, name]) => cell(slot, 'slot', name)),
    ...Object.entries(PACK_WEAPON_ICON).map(([id, name]) => cell(id, 'weapon', name)),
  ].join(''),
)}

<section>
  <h2>The 法 list, as one weapon shows it</h2>
  <p>Every skill a swordsman of this class can slot, in the order and at the size the hub draws them. This is the run of marks a player scans in one look.</p>
  ${['great', 'feidao']
    .map(
      (w) => `<div class="row">${SKILLS.filter((s) => s.weapon === null || s.weapon === w)
        .map(
          (s) =>
            `<span class="strip">${packIconSvg(PACK_ICON[s.effect], palette.ink, 1, 'ic')}` +
            `<span class="seal">${s.seal}</span><em>${s.name}</em>` +
            `${packIconSvg(PACK_CONDITION_ICON[s.boost.when] ?? '', palette.ink, 0.5, 'ic')}</span>`,
        )
        .join('')}</div>`,
    )
    .join('')}
</section>
</div></body></html>`

await mkdir(OUT, { recursive: true })
await writeFile(join(OUT, 'icons.html'), html)
console.log(`icons sheet → docs/icons.html  (${Object.keys(PACK_ICON).length} effects, ` +
  `${Object.keys(PACK_CONDITION_ICON).length} postures, ` +
  `${Object.keys(PACK_SLOT_ICON).length + Object.keys(PACK_WEAPON_ICON).length} items)`)
