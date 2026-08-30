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
import { CONDITION_BY_ID, artsFor, type Art, type EffectKind } from '../src/data/arts'
import { effectIconSvg } from '../src/render/packIcons'
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
 * An art's icon at a given size, centred on (x, y).
 *
 * The seal was the tile's mark until this sheet was read at full size: four
 * seals of similar stroke count, glanced at with a thumb busy, are four
 * identical grey squares. The icon draws the EFFECT instead, and the seal moves
 * to where there is time to read it, beside the name.
 *
 * Reads `effectIconSvg` — the SAME function the game calls — rather than the
 * procedural glyphs in render/artGlyph.ts, which were built first and lost.
 * Drawing a mockup with icons the game does not ship is how a proposal starts
 * quietly describing a different product.
 */
const artIcon = (effect: EffectKind, x: number, y: number, size: number, lit: boolean): string =>
  effectIconSvg(effect, palette.ink, lit ? 1 : 0.34, 'art-icon').replace(
    '<svg class="art-icon" ',
    `<svg width="${size}" height="${size}" x="${x - size / 2}" y="${y - size / 2}" `,
  )

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
function artStrip(
  x: number,
  y: number,
  arts: readonly Art[],
  litIndex: number,
  tile = 62,
  gap = 8,
  /**
   * Grade pips under each tile.
   *
   * Off during play, because grades do not rise yet — the run still grows by
   * technique cards. Five dots that never move are the same lie as an icon on
   * an inert strip, and this project has already paid for that one.
   */
  pips = true,
): string {
  const out: string[] = []
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
      artIcon(art.effect, tx + tile / 2, y + 24, 40, lit),
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
    if (!pips) return
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
/**
 * In play — the version with nothing on it that does not have to be there.
 *
 * The screen this replaces carried five things the player never reads while
 * something is chasing them: the region's name, the region's rule, the name of
 * whichever art had just woken, its blurb, and a kill count. Each was defensible
 * on its own. Together they turned the top third of a phone into a document.
 *
 * WHAT SURVIVES, and the test each had to pass — can it be read in the quarter
 * second between two dodges?
 *
 *   health      a bar. The number is on it only because "how close am I" is the
 *               one question worth an exact answer.
 *   insight     a thinner gold bar under it. No number: the only thing that
 *               matters is how near the next 感悟 is, and a bar says that.
 *   time        two digits, top right, small.
 *   the strip   four tiles, and the seal of what wakes each.
 *
 * Everything else moved to where there is time: the region is a banner at the
 * start that fades, and an art's name and blurb live in the 法 tab.
 *
 * THE STRIP IS CENTRED AT THE BOTTOM, which is the change you asked for and is
 * right for a reason worth writing down: it was in the top-left corner, the
 * furthest point on the screen from a thumb, and it is the one element a player
 * needs to glance at CONSTANTLY. Bottom-centre is where the eye already is,
 * because that is where the swordsman is.
 *
 * The joystick floats — it appears wherever the thumb lands — so it can overlap
 * the strip. That is survivable only because the strip is a READOUT and not a
 * row of buttons: a thumb resting on it costs a little visibility and nothing
 * else. The day one art becomes tappable, this decision has to be revisited.
 */
function screenPlay(): string {
  const o: string[] = []
  const M = 16

  // --- top: two bars and the clock, and nothing else ---
  // The number sits ABOVE the bar, not on it: ink on a nearly-full ink bar is
  // invisible, which the first draft of this screen proved at full size.
  o.push(
    text(M, 26, '116', 13, ink, 0.75, 'start', '600'),
    text(PH.w - M, 26, '12:04', 13, ink, 0.5, 'end'),
    bar(M, 34, PH.w - M * 2, 0.72, ink, 7),
    bar(M, 45, PH.w - M * 2, 0.45, goldDeep, 3),
  )

  // --- the field ---
  o.push(`<g opacity="0.92">`)
  const cx = PH.w / 2
  const cy = 400
  const foes: Array<[number, number, number]> = [
    [-104, -96, 13], [-46, -128, 11], [38, -140, 12], [104, -104, 14],
    [148, -34, 12], [132, 58, 13], [64, 122, 11], [-24, 146, 14],
    [-112, 112, 12], [-158, 24, 13], [-74, -34, 10], [92, -26, 11],
    [-140, -150, 11], [176, 118, 12], [-176, -60, 10], [10, -186, 12],
    [-60, 190, 12], [120, 176, 11],
  ]
  for (const [dx, dy, r] of foes) {
    o.push(
      `<ellipse cx="${cx + dx}" cy="${cy + dy}" rx="${r}" ry="${r * 1.3}" ` +
        `fill="${ink}" fill-opacity="0.85"/>`,
    )
  }
  for (const [dx, dy] of [[-64, 40], [46, -60], [-10, 74], [110, -70]]) {
    o.push(`<circle cx="${cx + dx!}" cy="${cy + dy!}" r="4" fill="${gold}" fill-opacity="0.75"/>`)
  }
  o.push(
    `<path d="M ${cx} ${cy - 10} L ${cx + 146} ${cy - 58} A 154 154 0 0 1 ${cx + 152} ${cy + 12} Z" ` +
      `fill="${ink}" fill-opacity="0.13"/>`,
    `<path d="M ${cx + 146} ${cy - 58} A 154 154 0 0 1 ${cx + 152} ${cy + 12}" fill="none" ` +
      `stroke="${ink}" stroke-opacity="0.5" stroke-width="2.5"/>`,
  )
  o.push(figure(cx, cy + 40, 118, KIT))
  // Damage numbers stay: they are the only feedback that a blow landed, and
  // they are read as motion rather than as text.
  o.push(
    text(cx + 152, cy - 66, '−48', 16, cinnabar, 0.95, 'middle', '600'),
    text(cx + 108, cy - 112, '−31', 13, goldDeep, 0.8, 'middle'),
    `</g>`,
  )

  // --- the strip, centred, above the thumb ---
  {
    const tile = 58
    const gap = 9
    const total = tile * 4 + gap * 3
    const x = (PH.w - total) / 2
    const y = PH.h - 196
    o.push(artStrip(x, y, SCROLL.slice(0, 4), 1, tile, gap, false))
  }

  // --- the thumb, floating wherever it lands ---
  // Drawn low and off-centre, which is where a thumb actually rests. Sitting it
  // under the strip in the first draft put the ring straight through the tiles.
  o.push(
    `<circle cx="${PH.w / 2 - 66}" cy="${PH.h - 74}" r="42" fill="none" stroke="${ink}" ` +
      `stroke-opacity="0.1" stroke-width="1.5"/>`,
    `<circle cx="${PH.w / 2 - 50}" cy="${PH.h - 86}" r="17" fill="${ink}" fill-opacity="0.14"/>`,
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
      artIcon(art.effect, M + 50, y + 27, 34, false),
      text(M + 72, y + 26, `${art.name}  ${art.seal}`, 13, ink, 0.9),
      text(M + 72, y + 42, `${CONDITION_BY_ID.get(art.condition)!.name} · ${art.effect}`, 9.5, ink, 0.42),
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
    text(M, 58, 'Um mostrador, não botões. O polegar fica no movimento.', 9.5, ink, 0.45),
  )

  const states: Array<[string, string, number]> = [
    ['Adormecida', 'A condição não se cumpre. O selo está apagado.', -1],
    ['Acesa', 'A condição cumpre-se agora. A arte está a agir.', 0],
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
    ['静  Planta os pés', 'e o teu golpe estreita e atravessa.'],
    ['疾  Não pares', 'e os golpes vêm mais depressa.'],
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
    text(M + 14, PH.h - 108, 'Porque não há botão', 11.5, goldDeep, 0.95, 'start', '600'),
    text(M + 14, PH.h - 90, 'Um interruptor auto/manual obriga a desenhar', 9.5, ink, 0.55),
    text(M + 14, PH.h - 76, 'cada arte duas vezes e a equilibrar o jogo duas', 9.5, ink, 0.55),
    text(M + 14, PH.h - 62, 'vezes. Se fizer falta, um botão — não um modo.', 9.5, ink, 0.55),
  )
  return o.join('')
}

// ===========================================================================
// SCREEN 8 — the paperdoll (新)
// ===========================================================================
/**
 * Equipment as a body, not as a list.
 *
 * The tab today is four stacked shelves of horizontally-scrolling chips, and it
 * has three problems that every good loot screen solves the same way:
 *
 *   1. NOTHING SHOWS WHAT YOU ARE NOT WEARING. An empty slot is simply absent,
 *      so "what am I missing?" — the question that sends a player back out — is
 *      unanswerable from the screen that should be asking it.
 *   2. THE FIGURE AND THE ITEMS ARE IN DIFFERENT PLACES. The whole visible half
 *      of the game is a silhouette, and the screen where you change that
 *      silhouette shows it at thumbnail size off to one side.
 *   3. THERE IS NO COMPARISON. You can read what a piece gives, but not what
 *      swapping would cost, which is the only number the decision needs.
 *
 * The fix is the paperdoll every ARPG converged on for a reason: the body in the
 * middle at real size, the slots arranged around it where the pieces sit, and
 * each slot legible whether it is full or empty. Diablo, Path of Exile, Monster
 * Hunter and Last Epoch all differ wildly in depth and agree exactly here.
 *
 * EIGHT SLOTS, and the count is not arbitrary. This wardrobe has a standing law
 * — an item must change the OUTLINE or it changes nothing, because these
 * figures have no interior detail. Rings, amulets and gloves are invisible
 * here, so they are not slots. What is left is everything that moves a line:
 * head, shoulders, robe, belt, bracers, boots, the hanging charm, and the
 * weapon.
 */
function screenDoll(): string {
  const o: string[] = []
  const M = 14
  o.push(header('Shen Baoyu', '筑基 Foundation Building', 12))

  // The body first, and at a size worth looking at.
  //
  // The first draft flanked the figure with two columns of chips, the way a
  // desktop paperdoll does, and the arithmetic killed it: two 128px columns on
  // a 390px screen leave 106px of middle, which is a SMALLER swordsman than the
  // hub already shows. On a phone in portrait the slots go underneath — which
  // is what Diablo Immortal, the one mainstream ARPG that had to solve this
  // exact shape, also settled on.
  // The 86-unit viewBox is taller than the swordsman drawn inside it, so the
  // height passed here is the BOX, not the figure — asking for 232 gave a
  // swordsman with a hand's width of dead paper above his hat.
  o.push(figure(PH.w / 2, 362, 320, KIT))
  o.push(
    text(PH.w / 2, 358, 'toca numa peça para trocar', 9, ink, 0.3, 'middle'),
  )

  // --- the eight slots ---
  // Every one of these moves a line of the silhouette. That is not a style
  // preference, it is the wardrobe's standing law: these figures have no
  // interior detail, so a ring or a glove would be an item you own and cannot
  // see. Head, shoulders, robe, belt, bracers, boots, charm, weapon — and
  // nothing else qualifies.
  type SlotRow = [string, string, string, string, number]
  const slots: SlotRow[] = [
    ['首', 'Head', 'Bamboo Hat', '+4 Body', 2],
    ['肩', 'Shoulders', 'Iron Pauldrons', '+6 Edge', 4],
    ['袍', 'Robe', 'Lamellar Coat', '+9 Body', 3],
    ['器', 'Weapon', 'Straight Jian', 'sweep', 1],
    ['带', 'Belt', '', '', 0],
    ['腕', 'Bracers', 'Hide Bracers', '+3 Swift', 0],
    ['靴', 'Boots', '', '', 0],
    ['佩', 'Charm', 'Jade Pendant', '+5% art', 2],
  ]

  const TW = 84
  const TG = 10
  const top = 372
  slots.forEach(([sl, slotName, name, line, rank], i) => {
    const x = M + (i % 4) * (TW + TG)
    const y = top + Math.floor(i / 4) * 96
    const has = name !== ''
    o.push(
      box(x, y, TW, 84, {
        fill: palette.ink,
        fillOp: has ? 0.045 : 0,
        stroke: has ? palette.ink : palette.cinnabar,
        strokeOp: has ? 0.2 : 0.35,
        r: 5,
      }),
      // The slot's seal stays on the tile even when it is full. It is how you
      // find "where are my boots" without reading eight item names.
      seal(x + TW / 2, y + 26, sl, 19, ink, has ? 0.3 : 0.55),
    )
    if (has) {
      o.push(
        // Shrink rather than truncate. "Iron Pauldrons" cut to "Iron" is a
        // different item as far as the reader is concerned.
        text(x + TW / 2, y + 46, name, name.length > 12 ? 7.4 : 8.5, ink, 0.88, 'middle', '600'),
        text(x + TW / 2, y + 60, line, 8, goldDeep, 0.85, 'middle'),
      )
      for (let p = 0; p < 5; p++) {
        o.push(
          `<circle cx="${x + 22 + p * 10}" cy="${y + 72}" r="2" fill="${goldDeep}" ` +
            `fill-opacity="${p < rank ? 0.85 : 0.13}"/>`,
        )
      }
    } else {
      o.push(
        text(x + TW / 2, y + 48, slotName, 9, ink, 0.4, 'middle', '600'),
        text(x + TW / 2, y + 64, 'vazio', 8.5, cinnabar, 0.7, 'middle'),
      )
    }
  })

  // --- what the whole loadout actually buys ---
  // Derived numbers, not the four raw attributes. "23 Body" is a currency the
  // player cannot spend; "Golpe 41" is the thing they are choosing between, and
  // the gold line underneath says how much of it the gear is paying for.
  let y = top + 96 * 2 + 8
  o.push(rule(M, y, PH.w - M * 2, 0.16))
  y += 22
  o.push(
    text(M, y, 'O QUE ISTO DÁ', 10, ink, 0.45, 'start', '600'),
    text(PH.w - M, y, 'total · do equipamento', 9, ink, 0.35, 'end'),
  )
  y += 16

  const stats: Array<[string, string, string]> = [
    ['Golpe', '41', '+14'],
    ['Vida', '160', '+38'],
    ['Ritmo', '1.9/s', '+0.3'],
    ['Alcance', '118', '+6'],
  ]
  const SW = (PH.w - M * 2) / 4
  stats.forEach(([name, value, from], i) => {
    const x = M + i * SW
    o.push(
      text(x + SW / 2, y + 20, value, 16, ink, 0.9, 'middle', '600'),
      text(x + SW / 2, y + 35, from, 9.5, goldDeep, 0.9, 'middle'),
      text(x + SW / 2, y + 49, name, 9, ink, 0.42, 'middle'),
    )
  })
  y += 64

  // An empty slot should send you somewhere, not just sit there being empty.
  o.push(
    box(M, y, PH.w - M * 2, 42, {
      fill: palette.cinnabar,
      fillOp: 0.06,
      stroke: palette.cinnabar,
      strokeOp: 0.3,
    }),
    seal(M + 22, y + 27, '带', 15, cinnabar, 0.8),
    text(M + 42, y + 21, 'Duas peças em falta', 10, cinnabar, 0.9, 'start', '600'),
    text(M + 42, y + 34, 'Cinto e botas nunca caíram. Tenta o 断崖.', 9, ink, 0.5),
  )

  o.push(tabs(1))
  return o.join('')
}

// ===========================================================================
// SCREEN 9 — choosing inside a slot (新)
// ===========================================================================
/**
 * Tapping a slot: what you own for it, each one shown as the DIFFERENCE.
 *
 * This is the half the current screen has none of. A chip that says "+9 Body"
 * is only useful next to what you are already wearing, and doing that
 * subtraction in your head is the tax that makes people stop engaging with
 * loot. Every game that handles gear well shows the delta and colours its sign,
 * and it costs one line per row.
 *
 * A sheet over the paperdoll rather than a new screen, so the figure stays
 * visible behind: what you are choosing is a silhouette, and this game's
 * silhouettes genuinely differ.
 */
function screenCompare(): string {
  const o: string[] = []
  const M = 14
  o.push(header('Shen Baoyu', '筑基 Foundation Building', 12))
  o.push(figure(PH.w / 2, 360, 236, KIT))
  o.push(`<rect y="88" width="${PH.w}" height="${PH.h - 88}" fill="${ink}" fill-opacity="0.35"/>`)

  const top = 300
  o.push(
    `<rect y="${top}" width="${PH.w}" height="${PH.h - top}" rx="14" fill="${paper}"/>`,
    `<rect x="${PH.w / 2 - 18}" y="${top + 8}" width="36" height="3" rx="1.5" fill="${ink}" fill-opacity="0.2"/>`,
    seal(M + 16, top + 42, '袍', 18, ink, 0.75),
    text(M + 38, top + 38, 'Robe', 14, ink, 0.9, 'start', '600'),
    text(PH.w - M, top + 38, '4 na bagagem', 10, ink, 0.4, 'end'),
    rule(M, top + 54, PH.w - M * 2, 0.14),
  )

  // [name, line, rank, deltas, state]
  type Row = [string, string, number, Array<[string, number]>, 'worn' | 'better' | 'worse']
  const rows: Row[] = [
    ['Lamellar Coat', '+9 Body', 3, [], 'worn'],
    ['Court Silks', '+11 Body', 4, [['Vida', 8], ['Golpe', -2]], 'better'],
    ['Hemp Robe', '+4 Body', 1, [['Vida', -21]], 'worse'],
    ['Travelling Coat', '+6 Swiftness', 2, [['Passo', 12], ['Vida', -21]], 'worse'],
  ]

  let y = top + 66
  for (const [name, line, rank, deltas, state] of rows) {
    const on = state === 'worn'
    o.push(
      box(M, y, PH.w - M * 2, 62, {
        fill: on ? palette.ink : palette.ink,
        fillOp: on ? 0.07 : 0.02,
        stroke: on ? palette.ink : palette.ink,
        strokeOp: on ? 0.35 : 0.12,
        r: 5,
      }),
      text(M + 14, y + 22, name, 12, ink, 0.9, 'start', '600'),
      text(M + 14, y + 38, line, 9.5, ink, 0.45),
    )
    for (let p = 0; p < 5; p++) {
      o.push(
        `<circle cx="${M + 16 + p * 9}" cy="${y + 50}" r="2" fill="${goldDeep}" ` +
          `fill-opacity="${p < rank ? 0.85 : 0.13}"/>`,
      )
    }
    if (on) {
      o.push(text(PH.w - M - 14, y + 34, 'EQUIPADA', 9.5, ink, 0.45, 'end', '600'))
    } else {
      // The deltas, right-aligned and signed. Cinnabar for a loss and gold for
      // a gain — the same two colours this game uses for harm and progress
      // everywhere else, so the meaning is already learned.
      deltas.forEach(([what, n], i) => {
        const dy = y + 24 + i * 16
        o.push(
          text(PH.w - M - 52, dy, what, 9.5, ink, 0.42, 'end'),
          text(
            PH.w - M - 14,
            dy,
            `${n > 0 ? '+' : ''}${n}`,
            12,
            n > 0 ? goldDeep : cinnabar,
            0.95,
            'end',
            '600',
          ),
        )
      })
    }
    y += 70
  }

  o.push(
    text(M, PH.h - 96, 'Toca para vestir. A silhueta muda por trás.', 9.5, ink, 0.4),
    tabs(1),
  )
  return o.join('')
}

// ===========================================================================
// the screens
// ===========================================================================
/**
 * Every screen, once, so the contact sheet and the single-screen files cannot
 * disagree about what exists.
 */
const SCREENS: Array<{ file: string; title: string; tag: string; draw: () => string }> = [
  { file: '01-play', title: 'Em jogo', tag: 'PROPOSTA', draw: screenPlay },
  { file: '02-arts', title: 'Hub · 法 Artes', tag: 'PROPOSTA', draw: screenArts },
  { file: '03-gear', title: 'Hub · 装 Equipamento', tag: 'HOJE', draw: screenGear },
  { file: '08-doll', title: 'Hub · 装 Paperdoll', tag: 'PROPOSTA', draw: screenDoll },
  { file: '09-compare', title: 'Escolher num slot', tag: 'PROPOSTA', draw: screenCompare },
  { file: '04-reward', title: 'Fim de corrida', tag: 'PROPOSTA', draw: screenReward },
  { file: '05-self', title: 'Hub · 剑 Espadachim', tag: 'HOJE', draw: screenSelf },
  { file: '06-world', title: 'Hub · 界 Mundo', tag: 'HOJE', draw: screenWorld },
  { file: '07-strip', title: 'A barra, nos 3 estados', tag: 'PROPOSTA', draw: screenStates },
]

// ===========================================================================
// the sheet
// ===========================================================================
parts.push(
  `<text x="40" y="42" font-family="system-ui, sans-serif" font-size="16" letter-spacing="3.5" ` +
    `fill="${ink}" fill-opacity="0.55">剑影 JIÀNYǏNG · A INTERFACE</text>`,
  `<text x="40" y="66" font-family="system-ui, sans-serif" font-size="12.5" fill="${cinnabar}">` +
    `Ecrãs a 390×844, o tamanho real. As figuras e os itens vêm do código do jogo; ` +
    `o que e proposta esta marcado como tal em cada ecra.</text>`,
)

const PER_ROW = 4
const ROWS = Math.ceil(SCREENS.length / PER_ROW)
{
  const gap = (W - 80 - FW * PER_ROW) / (PER_ROW - 1)
  SCREENS.forEach(({ title, tag, draw }, i) => {
    const row = Math.floor(i / PER_ROW)
    const col = i % PER_ROW
    parts.push(frame(40 + col * (FW + gap), 132 + row * (FH + 78), title, tag, draw()))
  })
}

const H = 132 + FH * ROWS + 78 * (ROWS - 1) + 60
const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
  `<rect width="${W}" height="${H}" fill="#ded3b8"/>` +
  parts.join('') +
  `</svg>`

await mkdir(OUT, { recursive: true })
await writeFile(join(OUT, 'ui.svg'), svg, 'utf8')
console.log(`sheet:  docs/ui.svg  ${W}×${H.toFixed(0)}`)

// --- and one file per screen, at 1:1 ---------------------------------------
// The contact sheet was written for a wide monitor, and this project is read
// on a phone: seven frames shrunk to 66% and then viewed on a 390-wide screen
// leaves each one about a sixth of the phone's width, which is not a mockup,
// it is a thumbnail of one. These are full size, one at a time.
const ONE = join(OUT, 'ui')
await mkdir(ONE, { recursive: true })
const CAP = 46
for (const { file, title, tag, draw } of SCREENS) {
  const single =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PH.w} ${PH.h + CAP}" ` +
    `width="${PH.w}" height="${PH.h + CAP}">` +
    `<rect width="${PH.w}" height="${PH.h + CAP}" fill="#ded3b8"/>` +
    text(16, 22, title, 14, ink, 0.85, 'start', '600') +
    text(PH.w - 16, 22, tag, 10, hex(tag === 'HOJE' ? palette.ink : palette.cinnabar),
      tag === 'HOJE' ? 0.4 : 0.9, 'end') +
    `<g transform="translate(0,${CAP})">` +
    `<rect width="${PH.w}" height="${PH.h}" fill="${paper}"/>` +
    draw() +
    `</g></svg>`
  await writeFile(join(ONE, `${file}.svg`), single, 'utf8')
}
console.log(`single: docs/ui/ — ${SCREENS.length} screens at ${PH.w}×${PH.h}, 1:1`)
