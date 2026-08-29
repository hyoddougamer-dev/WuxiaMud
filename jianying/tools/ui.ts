/**
 * 剑影 Jiànyǐng — the interface, screen by screen, at the size of a phone.
 *
 *   npx tsx tools/ui.ts && npx tsx tools/rasterise.mts docs/ui.svg
 *
 * Every other sheet in docs/ is about the WORLD — figures, wardrobe, ranks,
 * arts. None of them shows the thing the player actually touches, and "este
 * menu é horrendo" was a report about the interface, not about the game.
 *
 * Frames are drawn at the real aspect (390×844, a Pixel 5) so nothing here can
 * quietly assume a screen the phone does not have. Figures come from the game's
 * own `portraitSvg`, and the arts, items and conditions are read from the same
 * data the game reads — a mockup that invents its own content is a drawing, not
 * a proposal.
 *
 * What is REAL today: the swordsman, the wardrobe, ranks, the roster, the four
 * attributes. What is PROPOSED: the 法 tab, the art strip, the 秘笈 drop, and
 * the HUD rearrangement. The sheet says which is which on every screen, because
 * a proposal that photographs like a build is how a plan gets mistaken for a
 * promise.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { palette } from '../src/render/palette'
import { portraitSvg } from '../src/render/silhouette'
import { gearFromIds } from '../src/render/wardrobe'
import { CONDITION_BY_ID, artsFor, type Art } from '../src/data/arts'
import { ITEM_BY_ID, statLine } from '../src/data/items'
import { W, hex, label } from './sheet'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'docs')

// --- phone geometry --------------------------------------------------------
/** A Pixel 5 in CSS pixels. Everything below is laid out in these units. */
const PH = { w: 390, h: 844 }
/** How much each frame is shrunk to fit four across the sheet. */
const SCALE = 0.66
const FW = PH.w * SCALE
const FH = PH.h * SCALE

const ink = hex(palette.ink)
const paper = hex(palette.paper)
const cinnabar = hex(palette.cinnabar)
const gold = hex(palette.gold)
const goldDeep = hex(palette.goldDeep)

const parts: string[] = []

/** Escapes the few characters that would break an SVG text node. */
const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

/**
 * One phone frame, with everything inside drawn in PHONE units.
 *
 * The caller writes `x`/`y` as if it were laying out a 390-wide screen; the
 * group scales. Without this every number in the file would carry the scale
 * factor and the layout would stop being checkable against a real screen.
 */
function frame(x: number, y: number, title: string, tag: string, body: string): string {
  const tagColour = tag === 'HOJE' ? palette.ink : palette.cinnabar
  return (
    label(x + FW / 2, y - 22, title, 12.5, ink, 0.85) +
    label(x + FW / 2, y - 8, tag, 9, hex(tagColour), tag === 'HOJE' ? 0.4 : 0.9) +
    `<g transform="translate(${x},${y}) scale(${SCALE})">` +
    `<rect width="${PH.w}" height="${PH.h}" rx="18" fill="${paper}"/>` +
    body +
    `<rect width="${PH.w}" height="${PH.h}" rx="18" fill="none" ` +
    `stroke="${ink}" stroke-opacity="0.22" stroke-width="1.5"/>` +
    `</g>`
  )
}

const text = (
  x: number,
  y: number,
  s: string,
  size: number,
  fill = ink,
  op = 1,
  anchor: 'start' | 'middle' | 'end' = 'start',
  weight = 'normal',
): string =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="system-ui, sans-serif" ` +
  `font-size="${size}" font-weight="${weight}" fill="${fill}" fill-opacity="${op}">${esc(s)}</text>`

const seal = (x: number, y: number, s: string, size: number, fill = ink, op = 1): string =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-family="serif" font-size="${size}" ` +
  `fill="${fill}" fill-opacity="${op}">${s}</text>`

const rule = (x: number, y: number, w: number, op = 0.12): string =>
  `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${ink}" fill-opacity="${op}"/>`

const box = (
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { fill?: number; fillOp?: number; stroke?: number; strokeOp?: number; r?: number } = {},
): string => {
  const {
    fill = palette.ink,
    fillOp = 0.04,
    stroke = palette.ink,
    strokeOp = 0.14,
    r = 4,
  } = opts
  return (
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${hex(fill)}" ` +
    `fill-opacity="${fillOp}" stroke="${hex(stroke)}" stroke-opacity="${strokeOp}"/>`
  )
}

/** A bar on a hairline track. Ink for health, gold for progress. */
const bar = (x: number, y: number, w: number, fraction: number, colour: string, h = 5): string =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${ink}" fill-opacity="0.09"/>` +
  `<rect x="${x}" y="${y}" width="${(w * Math.max(0, Math.min(1, fraction))).toFixed(1)}" ` +
  `height="${h}" rx="${h / 2}" fill="${colour}" fill-opacity="0.9"/>`

/** The swordsman, at a given height, centred on x. */
function figure(x: number, baseline: number, h: number, ids: Record<string, string>): string {
  return portraitSvg(gearFromIds(ids), { seed: 7, build: 1, sash: 0, bearing: 0, pigment: 2 }, {
    box: 86,
    ranked: [
      { slot: 'robe', rank: 3 },
      { slot: 'head', rank: 2 },
    ],
  }).replace(
    '<svg class="portrait-svg" ',
    `<svg width="${(h * 0.92).toFixed(0)}" height="${h}" x="${(x - h * 0.46).toFixed(0)}" ` +
      `y="${(baseline - h).toFixed(0)}" `,
  )
}

const KIT = { robe: 'lamellar', shoulders: 'pauldron', head: 'hat', blade: 'jian' }
const SCROLL = artsFor('jian')

/**
 * The art strip — what was asked for as a hotbar.
 *
 * It is a READOUT, not buttons, and that follows from the decision that the
 * game keeps one thumb on movement: each tile shows one equipped art and the
 * condition that wakes it, and lights when that condition holds. The player
 * learns "plant my feet and 点 fires" by watching this, which is the only way
 * a conditional system becomes legible.
 *
 * The same strip becomes tappable the day one art is made active. Designing it
 * as a readout first costs nothing and does not paint that door shut.
 */
function artStrip(x: number, y: number, arts: readonly Art[], litIndex: number): string {
  const out: string[] = []
  const tile = 62
  const gap = 8
  arts.forEach((art, i) => {
    const tx = x + i * (tile + gap)
    const lit = i === litIndex
    out.push(
      box(tx, y, tile, tile, {
        fill: lit ? palette.cinnabar : palette.ink,
        fillOp: lit ? 0.1 : 0.04,
        stroke: lit ? palette.cinnabar : palette.ink,
        strokeOp: lit ? 0.9 : 0.14,
        r: 5,
      }),
      seal(tx + tile / 2, y + 32, art.seal, art.seal.length > 1 ? 17 : 24, ink, lit ? 0.95 : 0.32),
      // The condition seal, small and beneath: this is the thing the player has
      // to DO, so it is on the tile rather than in a menu.
      seal(
        tx + tile / 2,
        y + 52,
        CONDITION_BY_ID.get(art.condition)!.seal,
        13,
        lit ? cinnabar : ink,
        lit ? 1 : 0.3,
      ),
    )
    // Grade pips along the bottom edge.
    for (let p = 0; p < 5; p++) {
      out.push(
        `<circle cx="${tx + 12 + p * 10}" cy="${y + tile + 8}" r="2.1" fill="${goldDeep}" ` +
          `fill-opacity="${p < 3 - i * 0.5 ? 0.85 : 0.15}"/>`,
      )
    }
  })
  return out.join('')
}

// ===========================================================================
// SCREEN 1 — in play
// ===========================================================================
function screenPlay(): string {
  const o: string[] = []
  const M = 16

  // --- top: health, insight, time ---
  o.push(
    text(M, 34, '128', 21, ink, 0.9, 'start', '600'),
    text(M + 40, 34, '/ 160', 12, ink, 0.4),
    bar(M, 42, 200, 0.8, ink, 6),
    // Insight sits directly under health and is gold, because gold means
    // progression everywhere else in this game and nowhere else.
    bar(M, 54, 200, 0.45, goldDeep, 3),
    text(M + 206, 52, '感悟 4', 10, goldDeep, 0.9),

    text(PH.w - M, 30, '12:04', 17, ink, 0.85, 'end'),
    text(PH.w - M, 48, '斩 341', 11, ink, 0.42, 'end'),
  )

  // --- the art strip ---
  o.push(artStrip(M, 74, SCROLL.slice(0, 4), 0))

  // A single line naming what just woke, in the player's words. It fades; it is
  // the bridge between "a seal lit" and "I understand why".
  o.push(
    text(M, 166, '静 · 点 Point', 12, cinnabar, 0.95, 'start', '600'),
    text(M, 182, 'Planted, the arc narrows and runs through what it hits.', 9.5, ink, 0.45),
  )

  // --- the field ---
  // Drawn at the camera distance the game actually uses: the swordsman is
  // about a fifth of the screen height, not a speck. A mockup that frames the
  // action further out than the game does flatters the layout, because the
  // empty space it leaves is space the real screen never has.
  o.push(`<g opacity="0.92">`)
  const cx = PH.w / 2
  const cy = 452
  const foes: Array<[number, number, number]> = [
    [-104, -96, 13], [-46, -128, 11], [38, -140, 12], [104, -104, 14],
    [148, -34, 12], [132, 58, 13], [64, 122, 11], [-24, 146, 14],
    [-112, 112, 12], [-158, 24, 13], [-74, -34, 10], [92, -26, 11],
    [-140, -150, 11], [176, 118, 12], [-176, -60, 10], [10, -186, 12],
  ]
  for (const [dx, dy, r] of foes) {
    o.push(
      `<ellipse cx="${cx + dx}" cy="${cy + dy}" rx="${r}" ry="${r * 1.3}" ` +
        `fill="${ink}" fill-opacity="0.85"/>`,
    )
  }
  // Qi left by the fallen. Gold, and the only gold on the field.
  for (const [dx, dy] of [[-64, 40], [46, -60], [-10, 74], [110, -70]]) {
    o.push(`<circle cx="${cx + dx!}" cy="${cy + dy!}" r="4" fill="${gold}" fill-opacity="0.75"/>`)
  }
  // The sweep, as the wedge the game draws — narrowed, because 点 is firing.
  // A straight grey triangle read as a rendering fault rather than a cut.
  o.push(
    `<path d="M ${cx} ${cy - 10} L ${cx + 146} ${cy - 58} A 154 154 0 0 1 ${cx + 152} ${cy + 12} Z" ` +
      `fill="${ink}" fill-opacity="0.13"/>`,
    `<path d="M ${cx + 146} ${cy - 58} A 154 154 0 0 1 ${cx + 152} ${cy + 12}" fill="none" ` +
      `stroke="${ink}" stroke-opacity="0.5" stroke-width="2.5"/>`,
  )
  o.push(figure(cx, cy + 40, 118, KIT))
  o.push(
    text(cx + 152, cy - 66, '−48', 16, cinnabar, 0.95, 'middle', '600'),
    text(cx + 108, cy - 112, '−31', 13, goldDeep, 0.8, 'middle'),
    text(cx - 92, cy - 118, '−31', 12, goldDeep, 0.6, 'middle'),
    `</g>`,
  )

  // --- region, bottom-left, fading ---
  o.push(
    text(M, PH.h - 96, '断崖  The Broken Cliff', 11, cinnabar, 0.55),
    text(M, PH.h - 80, 'Narrow ground. What falls on you was already above.', 9, ink, 0.32),
  )

  // --- the joystick, where the thumb is ---
  o.push(
    `<circle cx="${PH.w - 88}" cy="${PH.h - 96}" r="46" fill="none" stroke="${ink}" ` +
      `stroke-opacity="0.15" stroke-width="1.5"/>`,
    `<circle cx="${PH.w - 72}" cy="${PH.h - 110}" r="19" fill="${ink}" fill-opacity="0.2"/>`,
  )
  return o.join('')
}

// ===========================================================================
// SCREEN 2 — hub, the arts tab (新)
// ===========================================================================
function screenArts(): string {
  const o: string[] = []
  const M = 16
  o.push(header('Shen Baoyu', '筑基 Foundation Building', 12))

  o.push(
    text(M, 116, 'EQUIPADAS', 10, ink, 0.45, 'start', '600'),
    text(PH.w - M, 116, '感悟 24', 10, goldDeep, 0.9, 'end'),
    text(M, 132, 'A ordem por que acordam durante a expedição.', 9, ink, 0.38),
  )

  let y = 148
  SCROLL.slice(0, 3).forEach((art, i) => {
    o.push(
      box(M, y, PH.w - M * 2, 54),
      text(M + 14, y + 33, String(i + 1), 15, ink, 0.28, 'start', '600'),
      seal(M + 46, y + 34, art.seal, art.seal.length > 1 ? 15 : 21, ink, 0.9),
      text(M + 68, y + 26, art.name, 13, ink, 0.9),
      text(M + 68, y + 42, `${CONDITION_BY_ID.get(art.condition)!.name} · ${art.effect}`, 9.5, ink, 0.42),
      seal(PH.w - M - 92, y + 34, CONDITION_BY_ID.get(art.condition)!.seal, 17, cinnabar, 0.85),
    )
    for (let p = 0; p < 5; p++) {
      o.push(
        `<circle cx="${PH.w - M - 62 + p * 11}" cy="${y + 30}" r="3" fill="${goldDeep}" ` +
          `fill-opacity="${p < 3 - i ? 0.85 : 0.15}"/>`,
      )
    }
    y += 60
  })
  // The empty fourth slot, drawn as an invitation rather than as a hole.
  o.push(
    box(M, y, PH.w - M * 2, 54, { fillOp: 0, strokeOp: 0.16 }),
    text(PH.w / 2, y + 33, '+  quarta arte', 12, ink, 0.35, 'middle'),
  )
  y += 78

  o.push(
    rule(M, y - 14, PH.w - M * 2),
    text(M, y + 4, '剑  ROLO DO STRAIGHT JIAN', 10, ink, 0.45, 'start', '600'),
    text(M, y + 20, 'Só vês o rolo da arma que tens na mão.', 9, ink, 0.38),
  )
  y += 34

  SCROLL.slice(3).forEach((art, i) => {
    const known = i === 0
    o.push(
      box(M, y, PH.w - M * 2, 50, { fillOp: known ? 0.04 : 0.015, strokeOp: known ? 0.14 : 0.08 }),
      seal(M + 30, y + 32, art.seal, art.seal.length > 1 ? 14 : 20, ink, known ? 0.9 : 0.28),
      text(M + 56, y + 25, art.name, 12.5, ink, known ? 0.85 : 0.3),
      text(M + 56, y + 40, art.blurb.slice(0, 46) + '…', 9, ink, known ? 0.42 : 0.22),
      known
        ? text(PH.w - M - 14, y + 32, 'equipar', 10, cinnabar, 0.9, 'end')
        : text(PH.w - M - 14, y + 32, '秘笈 ?', 10, goldDeep, 0.65, 'end'),
    )
    y += 56
  })

  o.push(tabs(2))
  return o.join('')
}

/** The hub's top strip: seal, name, realm, bar. Shared by every hub screen. */
function header(name: string, realm: string, level: number): string {
  return (
    `<rect x="16" y="14" width="54" height="54" rx="4" fill="${cinnabar}"/>` +
    seal(43, 48, '筑基', 15, paper, 0.95) +
    text(82, 36, name, 19, ink, 0.92, 'start', '500') +
    text(82, 55, realm, 11, ink, 0.45) +
    text(82 + 168, 55, `Level ${level}`, 11, goldDeep, 0.9) +
    bar(82, 63, 250, 0.55, ink, 3) +
    rule(0, 88, PH.w, 0.16)
  )
}

/** The pinned bottom tab bar. `active` is the index. */
function tabs(active: number): string {
  const items: Array<[string, string]> = [
    ['剑', 'SWORDSMAN'],
    ['装', 'EQUIPMENT'],
    ['法', 'ARTS'],
    ['界', 'WORLD'],
  ]
  const o: string[] = [rule(0, PH.h - 74, PH.w, 0.16)]
  const w = PH.w / items.length
  items.forEach(([s, n], i) => {
    const on = i === active
    o.push(
      on
        ? `<rect x="${i * w}" y="${PH.h - 74}" width="${w}" height="2" fill="${cinnabar}"/>`
        : '',
      seal(i * w + w / 2, PH.h - 40, s, 20, ink, on ? 0.9 : 0.3),
      text(i * w + w / 2, PH.h - 22, n, 8.5, ink, on ? 0.7 : 0.28, 'middle'),
    )
  })
  return o.join('')
}

// ===========================================================================
// SCREEN 3 — hub, equipment
// ===========================================================================
function screenGear(): string {
  const o: string[] = [header('Shen Baoyu', '筑基 Foundation Building', 12)]
  o.push(figure(PH.w / 2, 240, 140, KIT))

  let y = 262
  const worn: Array<[string, string, number]> = [
    ['Weapon', 'w-jian', 2],
    ['Head', 'h-hat', 3],
    ['Shoulders', 's-pauldron', 4],
    ['Robe', 'r-lamellar', 5],
  ]
  for (const [slot, id, rank] of worn) {
    const item = ITEM_BY_ID.get(id)!
    o.push(
      text(16, y, slot, 9.5, ink, 0.4, 'start', '600'),
      box(16, y + 8, PH.w - 32, 52, { fill: palette.ink, fillOp: 0.9, strokeOp: 0 }),
      `<rect x="16" y="${y + 8}" width="3" height="52" fill="${gold}" fill-opacity="0.8"/>`,
      text(32, y + 30, item.name, 13, paper, 0.95),
      `<text x="32" y="${y + 30}" font-family="system-ui, sans-serif" font-size="13" ` +
        `fill="${paper}" fill-opacity="0"><tspan>${esc(item.name)}</tspan>` +
        `<tspan fill="${gold}" fill-opacity="0.9" dx="8">${'·'.repeat(rank)}</tspan></text>`,
      text(32, y + 47, statLine(item.stat, rank) || 'Fast and short.', 9.5, paper, 0.5),
    )
    y += 70
  }
  o.push(tabs(1))
  return o.join('')
}

// ===========================================================================
// SCREEN 4 — the reward, with a manual
// ===========================================================================
function screenReward(): string {
  const o: string[] = []
  o.push(
    `<rect width="${PH.w}" height="${PH.h}" rx="18" fill="${ink}"/>`,
    seal(PH.w / 2, 118, '殒', 44, paper, 0.22),
    text(PH.w / 2, 160, 'CUT DOWN AT THE BROKEN CLIFF', 11, paper, 0.5, 'middle'),
    text(PH.w / 2, 196, '12:04', 34, paper, 0.92, 'middle', '300'),
    text(PH.w / 2, 216, '341 felled · by a Cliff Shrike', 10.5, paper, 0.45, 'middle'),
    rule(28, 244, PH.w - 56, 0.0),
    `<rect x="28" y="244" width="${PH.w - 56}" height="1" fill="${paper}" fill-opacity="0.16"/>`,
  )

  let y = 276
  const lines: Array<[string, string, string]> = [
    ['Time survived', '+240', 'paper'],
    ['Foes felled', '+341', 'paper'],
    ['Depth 3', '×1.6', 'paper'],
  ]
  for (const [k, v] of lines) {
    o.push(
      text(28, y, k, 11.5, paper, 0.6),
      text(PH.w - 28, y, v, 11.5, paper, 0.85, 'end'),
    )
    y += 22
  }
  o.push(
    text(28, y + 8, '感悟 gained', 12.5, gold, 0.95),
    text(PH.w - 28, y + 8, '+912', 13, gold, 0.95, 'end'),
    text(28, y + 30, 'Foundation Building 12 → 13', 10, paper, 0.45),
  )
  y += 62

  // The manual. This is the drop that teaches an art, and it gets the whole
  // width and a seal, because a piece of armour is an upgrade and this is an
  // event.
  o.push(
    box(24, y, PH.w - 48, 92, { fill: palette.gold, fillOp: 0.1, stroke: palette.gold, strokeOp: 0.55, r: 5 }),
    seal(60, y + 46, '秘笈', 17, gold, 0.95),
    text(96, y + 34, 'Shadow  影', 14, paper, 0.95),
    text(96, y + 52, 'A manual for the Straight Jian.', 10, paper, 0.5),
    text(96, y + 70, 'Turning leaves an echo of the sweep.', 9.5, gold, 0.75),
    text(PH.w - 40, y + 46, 'LEARNED', 9, gold, 0.9, 'end'),
  )
  y += 106

  o.push(
    text(28, y, 'FOUND', 9.5, paper, 0.35, 'start', '600'),
    text(28, y + 20, 'Iron Pauldrons ····', 11.5, paper, 0.85),
    text(PH.w - 28, y + 20, 'sharpened', 11.5, cinnabar, 0.9, 'end'),
    text(28, y + 40, 'Bamboo Hat', 11.5, paper, 0.4),
    text(PH.w - 28, y + 40, 'already yours', 11.5, paper, 0.3, 'end'),
  )

  o.push(
    box(24, PH.h - 92, PH.w - 48, 54, { fill: palette.paper, fillOp: 0.95, strokeOp: 0, r: 4 }),
    text(PH.w / 2, PH.h - 58, 'RETURN TO THE HUB', 13, ink, 0.9, 'middle', '600'),
  )
  return o.join('')
}

// ===========================================================================
// SCREEN 5 — hub, the swordsman and the roster
// ===========================================================================
function screenSelf(): string {
  const o: string[] = [header('Shen Baoyu', '筑基 Foundation Building', 12)]
  o.push(figure(PH.w / 2, 262, 170, KIT))

  const M = 16
  let y = 292
  o.push(
    text(M, y, 'ATRIBUTOS', 10, ink, 0.45, 'start', '600'),
    text(PH.w - M, y, '1 ponto por gastar', 10, goldDeep, 0.9, 'end'),
  )
  y += 14
  const attrs: Array<[string, string, string, string]> = [
    ['体', 'Body', '0 +7', '169 health'],
    ['锋', 'Edge', '0 +3', '19.9 damage'],
    ['疾', 'Swiftness', '0', '0.60s per sweep'],
    ['神', 'Spirit', '0', '100% art power'],
  ]
  for (const [s, name, spent, effect] of attrs) {
    o.push(
      box(M, y, 34, 34, { fillOp: 0.05, strokeOp: 0 }),
      seal(M + 17, y + 24, s, 17, ink, 0.75),
      text(M + 44, y + 22, name, 13, ink, 0.9),
      text(M + 128, y + 22, spent, 11, goldDeep, 0.9),
      text(M + 168, y + 22, effect, 10.5, ink, 0.45),
      box(PH.w - M - 52, y, 52, 34, { fill: palette.ink, fillOp: 0.9, strokeOp: 0 }),
      text(PH.w - M - 26, y + 22, '+', 16, paper, 0.95, 'middle'),
      rule(M, y + 42, PH.w - M * 2, 0.08),
    )
    y += 48
  }

  y += 6
  o.push(
    text(M, y, 'OS TEUS ESPADACHINS', 10, ink, 0.45, 'start', '600'),
    text(PH.w - M, y, '2 / 6', 10, ink, 0.4, 'end'),
  )
  y += 10
  const roster: Array<[string, string, boolean]> = [
    ['Tang Mingzhu', '淬体 4', false],
    ['Shen Baoyu', '筑基 12', true],
  ]
  roster.forEach(([name, realm, active], i) => {
    const rx = M + i * 100
    o.push(
      box(rx, y, 92, 108, {
        fill: active ? palette.cinnabar : palette.ink,
        fillOp: active ? 0.06 : 0.03,
        stroke: active ? palette.cinnabar : palette.ink,
        strokeOp: active ? 0.85 : 0.14,
      }),
      figure(rx + 46, y + 74, 66, i === 0 ? { robe: 'court', head: 'bare', blade: 'twin' } : KIT),
      text(rx + 46, y + 90, name, 10, ink, 0.85, 'middle'),
      text(rx + 46, y + 102, realm, 9, ink, 0.4, 'middle'),
    )
  })
  o.push(
    box(M + 200, y, 92, 108, { fillOp: 0, strokeOp: 0.16 }),
    text(M + 246, y + 60, '+', 24, ink, 0.3, 'middle'),
  )

  o.push(tabs(0))
  return o.join('')
}

// ===========================================================================
// SCREEN 6 — hub, the world
// ===========================================================================
function screenWorld(): string {
  const o: string[] = [header('Shen Baoyu', '筑基 Foundation Building', 12)]
  const M = 16
  let y = 112
  o.push(text(M, y, 'ONDE CAMINHAR', 10, ink, 0.45, 'start', '600'))
  y += 12

  const places: Array<[string, string, string, boolean, boolean]> = [
    ['官道', 'The Post Road', 'Open ground. Nothing is against you but what walks it.', true, false],
    ['苇泽', 'The Reed Marsh', 'You cannot see far, and neither can they.', true, false],
    ['断崖', 'The Broken Cliff', 'Narrow ground. What falls on you was already above.', true, true],
    ['鬼市', 'The Ghost Market', 'Killing is not automatically the right answer here.', true, false],
    ['关', 'The Pass', 'Everything that has followed you is waiting at the top.', false, false],
  ]
  for (const [s, name, line, open, chosen] of places) {
    o.push(
      box(M, y, PH.w - M * 2, 76, {
        fill: chosen ? palette.cinnabar : palette.ink,
        fillOp: chosen ? 0.06 : open ? 0.03 : 0.01,
        stroke: chosen ? palette.cinnabar : palette.ink,
        strokeOp: chosen ? 0.85 : open ? 0.12 : 0.06,
      }),
      seal(M + 34, y + 34, s, 19, chosen ? cinnabar : ink, open ? 0.9 : 0.25),
      text(M + 62, y + 28, name, 13.5, ink, open ? 0.9 : 0.28),
      text(M + 62, y + 46, line.slice(0, 44) + (line.length > 44 ? '…' : ''), 9.5, ink, open ? 0.42 : 0.2),
      text(M + 62, y + 64, open ? '阶 0–3 finds' : 'closed until 金丹', 9, open ? goldDeep : ink, open ? 0.8 : 0.25),
    )
    y += 84
  }

  o.push(
    rule(0, PH.h - 148, PH.w, 0.16),
    text(M, PH.h - 122, '断崖', 11, cinnabar, 0.9),
    text(M, PH.h - 106, 'The Broken Cliff', 12.5, ink, 0.85),
    box(PH.w - M - 158, PH.h - 138, 158, 50, { fill: palette.ink, fillOp: 0.92, strokeOp: 0 }),
    text(PH.w - M - 79, PH.h - 106, 'SET OUT', 14, paper, 0.95, 'middle', '600'),
    tabs(3),
  )
  return o.join('')
}

// ===========================================================================
// SCREEN 7 — the strip, in its three states
// ===========================================================================
function screenStates(): string {
  const o: string[] = []
  const M = 16
  o.push(
    text(M, 40, 'A BARRA DAS ARTES', 12, ink, 0.85, 'start', '600'),
    text(M, 58, 'Um mostrador, nao botoes. O polegar fica no movimento.', 9.5, ink, 0.45),
  )

  const states: Array<[string, string, number]> = [
    ['Adormecida', 'A condicao nao se cumpre. O selo esta apagado.', -1],
    ['Acesa', 'A condicao cumpre-se agora. A arte esta a agir.', 0],
    ['Outra acende', 'Corres em vez de parares: 静 apaga, 疾 acende.', 1],
  ]
  let y = 92
  for (const [name, note, lit] of states) {
    o.push(
      text(M, y, name, 12, cinnabar, 0.95, 'start', '600'),
      text(M, y + 16, note, 9.5, ink, 0.45),
      artStrip(M, y + 28, SCROLL.slice(0, 4), lit),
    )
    y += 132
  }

  o.push(
    rule(M, y - 6, PH.w - M * 2),
    text(M, y + 18, 'O QUE O JOGADOR APRENDE', 10, ink, 0.45, 'start', '600'),
  )
  y += 34
  const lessons: Array<[string, string]> = [
    ['静  Planta os pes', 'e o teu golpe estreita e atravessa.'],
    ['疾  Nao pares', 'e os golpes vem mais depressa.'],
    ['转  Inverte de repente', 'e fica um eco do golpe onde estavas.'],
    ['围  Deixa-te rodear', 'e o golpe corta a dobrar.'],
  ]
  for (const [act, result] of lessons) {
    // Stacked, not two columns: at 390 wide the longest instruction ran into
    // its own result.
    o.push(text(M, y, act, 11.5, ink, 0.85), text(M + 16, y + 15, result, 10.5, ink, 0.5))
    y += 34
  }

  o.push(
    box(M, PH.h - 132, PH.w - M * 2, 74, { fill: palette.gold, fillOp: 0.09, stroke: palette.gold, strokeOp: 0.5 }),
    text(M + 14, PH.h - 108, 'Porque nao ha botao', 11.5, goldDeep, 0.95, 'start', '600'),
    text(M + 14, PH.h - 90, 'Um interruptor auto/manual obriga a desenhar', 9.5, ink, 0.55),
    text(M + 14, PH.h - 76, 'cada arte duas vezes e a equilibrar o jogo duas', 9.5, ink, 0.55),
    text(M + 14, PH.h - 62, 'vezes. Se fizer falta, um botao — nao um modo.', 9.5, ink, 0.55),
  )
  return o.join('')
}

// ===========================================================================
// the sheet
// ===========================================================================
parts.push(
  `<text x="40" y="42" font-family="system-ui, sans-serif" font-size="16" letter-spacing="3.5" ` +
    `fill="${ink}" fill-opacity="0.55">剑影 JIÀNYǏNG · A INTERFACE</text>`,
  `<text x="40" y="66" font-family="system-ui, sans-serif" font-size="12.5" fill="${cinnabar}">` +
    `Ecras a 390×844, o tamanho real. As figuras e os itens vem do codigo do jogo; ` +
    `o que e proposta esta marcado como tal em cada ecra.</text>`,
)

{
  const top = 132
  const gap = (W - 80 - FW * 4) / 3
  const screens: Array<[string, string, () => string]> = [
    ['Em jogo', 'PROPOSTA', screenPlay],
    ['Hub · 法 Artes', 'PROPOSTA', screenArts],
    ['Hub · 装 Equipamento', 'HOJE', screenGear],
    ['Fim de corrida', 'PROPOSTA', screenReward],
  ]
  screens.forEach(([title, tag, draw], i) => {
    parts.push(frame(40 + i * (FW + gap), top, title, tag, draw()))
  })
}

{
  const top = 132 + FH + 78
  const gap = (W - 80 - FW * 4) / 3
  const screens: Array<[string, string, () => string]> = [
    ['Hub · 剑 Espadachim', 'HOJE', screenSelf],
    ['Hub · 界 Mundo', 'HOJE', screenWorld],
    ['A barra, nos 3 estados', 'PROPOSTA', screenStates],
  ]
  screens.forEach(([title, tag, draw], i) => {
    parts.push(frame(40 + i * (FW + gap), top, title, tag, draw()))
  })
}

const H = 132 + FH * 2 + 78 + 60
const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
  `<rect width="${W}" height="${H}" fill="#ded3b8"/>` +
  parts.join('') +
  `</svg>`

await mkdir(OUT, { recursive: true })
await writeFile(join(OUT, 'ui.svg'), svg, 'utf8')
console.log(`sheet:  docs/ui.svg  ${W}×${H.toFixed(0)}`)
console.log(`frames: 4 at ${PH.w}×${PH.h} scaled ${SCALE}`)
