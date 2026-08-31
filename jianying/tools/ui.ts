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
import { conditionIconSvg, effectIconSvg } from '../src/render/packIcons'
import { ITEM_BY_ID, statLine } from '../src/data/items'
import { REGIONS } from '../src/data/regions'
import { regionVignette } from '../src/render/regionArt'
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

/** Trims to a length without cutting a word in half. */
const clip = (body: string, max: number): string => {
  if (body.length <= max) return body
  const cut = body.slice(0, max)
  const space = cut.lastIndexOf(' ')
  return `${space > max * 0.6 ? cut.slice(0, space) : cut}…`
}

/** The pictogram for a condition — what the player has to DO, drawn. */
const condIcon = (condition: string, x: number, y: number, size: number, lit: boolean): string =>
  conditionIconSvg(condition, lit ? palette.cinnabar : palette.ink, lit ? 1 : 0.3, 'c-icon').replace(
    '<svg class="c-icon" ',
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
      // 34 and not 40: at 40 the effect icon reached y+44 and the condition
      // pictogram below it started at y+38, so the two marks overlapped on
      // every tile — a spearhead with a seated figure inside it.
      artIcon(art.effect, tx + tile / 2, y + 22, 34, lit),
      // A PICTURE of what the player has to do, not the seal for it.
      //
      // "Muitos caracteres em chinês não pode induzir players em erro?" — yes,
      // and this tile was the worst case in the game: 静 alone, on the one
      // element a player must read mid-fight, asking someone who reads no
      // Chinese to learn a character by dying. The seals stay everywhere they
      // are identity (names, the scroll, the hub); wherever a mark carries a
      // MECHANIC it is now a pictogram — see render/packIcons PACK_CONDITION_ICON.
      condIcon(art.condition, tx + tile / 2, y + 46, 16, lit),
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
const PLAY_CX = PH.w / 2
const PLAY_CY = 400

/**
 * The fight itself — identical in every variant below.
 *
 * Held in one function on purpose. Three proposals that each redraw their own
 * swarm would differ in a dozen ways at once, and the only honest way to ask
 * "which chrome is right" is for the chrome to be the ONLY thing that differs.
 */
function playField(opts: { numbers?: boolean; ring?: number } = {}): string {
  const { numbers = true, ring } = opts
  const o: string[] = [`<g opacity="0.92">`]
  const cx = PLAY_CX
  const cy = PLAY_CY
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
  // Health as a ring drawn on the ground the swordsman stands on, for the
  // variant that refuses to put a bar anywhere. Under the figure, so it reads
  // as the circle of ground they hold rather than as a UI element on top.
  if (ring !== undefined) {
    const r = 46
    const c = 2 * Math.PI * r
    o.push(
      `<circle cx="${cx}" cy="${cy + 24}" r="${r}" fill="none" stroke="${ink}" ` +
        `stroke-opacity="0.1" stroke-width="4"/>`,
      `<circle cx="${cx}" cy="${cy + 24}" r="${r}" fill="none" stroke="${cinnabar}" ` +
        `stroke-opacity="0.85" stroke-width="4" stroke-linecap="round" ` +
        `stroke-dasharray="${(c * ring).toFixed(1)} ${c.toFixed(1)}" ` +
        `transform="rotate(-90 ${cx} ${cy + 24})"/>`,
    )
  }
  o.push(figure(cx, cy + 40, 118, KIT))
  if (numbers) {
    o.push(
      text(cx + 152, cy - 66, '−48', 16, cinnabar, 0.95, 'middle', '600'),
      text(cx + 108, cy - 112, '−31', 13, goldDeep, 0.8, 'middle'),
    )
  } else {
    // Without digits the blow still has to be felt. Ink spatter where the arc
    // bit, which is the game's own vocabulary rather than a borrowed one.
    for (const [dx, dy, r] of [[150, -64, 7], [136, -30, 4.5], [118, -96, 5.5], [162, -14, 3.5]]) {
      o.push(
        `<circle cx="${cx + dx!}" cy="${cy + dy!}" r="${r}" fill="${cinnabar}" ` +
          `fill-opacity="0.55"/>`,
      )
    }
  }
  o.push(`</g>`)
  return o.join('')
}

/** The floating thumb, low and off-centre — where a thumb actually rests. */
const thumb = (): string =>
  `<circle cx="${PH.w / 2 - 66}" cy="${PH.h - 74}" r="42" fill="none" stroke="${ink}" ` +
  `stroke-opacity="0.1" stroke-width="1.5"/>` +
  `<circle cx="${PH.w / 2 - 50}" cy="${PH.h - 86}" r="17" fill="${ink}" fill-opacity="0.14"/>`

/** The strip, at the position that was approved: centred, above the thumb. */
const STRIP = { tile: 58, gap: 9, y: PH.h - 196 }
const STRIP_W = STRIP.tile * 4 + STRIP.gap * 3
const STRIP_X = (PH.w - STRIP_W) / 2

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
  o.push(playField())
  o.push(artStrip(STRIP_X, STRIP.y, SCROLL.slice(0, 4), 1, STRIP.tile, STRIP.gap, false))
  o.push(thumb())
  return o.join('')
}

// ===========================================================================
// SCREEN 1a/1b/1c — three ways to dress the same fight
// ===========================================================================
/**
 * "A posição da hotbar parece-me bem, mas tudo o resto não."
 *
 * That is a verdict on the chrome and not on the strip, so the strip does not
 * move in any of the three below and everything else does. They are not
 * refinements of each other — each answers the question differently, and one of
 * them is meant to be picked rather than averaged:
 *
 *   A 无字  no digits anywhere. Health is the circle of ground you hold.
 *   B 裱    the HUD is the mounting of a hanging scroll, on the two margins.
 *   C 底    one console at the foot of the screen. The top is empty.
 *
 * All three delete the same thing the approved screen still carried: a
 * full-width bar across the top, which is the single most generic object in
 * mobile games and the one element that makes this look like every other
 * survivors-like on the store.
 */
function screenPlayA(): string {
  const o: string[] = []
  // Health is drawn on the ground under the swordsman, so the one number you
  // must never look away from is AT the thing you are already looking at.
  o.push(playField({ numbers: false, ring: 0.72 }))
  o.push(artStrip(STRIP_X, STRIP.y, SCROLL.slice(0, 4), 1, STRIP.tile, STRIP.gap, false))
  // Insight: a hairline under the strip, exactly its width. No number, because
  // the only question is "how close is the next one".
  o.push(
    `<rect x="${STRIP_X}" y="${STRIP.y + STRIP.tile + 12}" width="${STRIP_W}" height="2" ` +
      `rx="1" fill="${ink}" fill-opacity="0.1"/>`,
    `<rect x="${STRIP_X}" y="${STRIP.y + STRIP.tile + 12}" width="${(STRIP_W * 0.45).toFixed(0)}" ` +
      `height="2" rx="1" fill="${goldDeep}" fill-opacity="0.9"/>`,
  )
  o.push(thumb())
  return o.join('')
}

function screenPlayB(): string {
  const o: string[] = []
  const T = 5
  const top = 96
  const bottom = PH.h - 120
  const h = bottom - top
  // Two columns on the margins, like the silk mounting either side of a hanging
  // scroll. They fill UPWARD, which is the direction a scroll is read and the
  // direction "more" means in every other part of this game.
  const column = (x: number, fraction: number, colour: string): string =>
    `<rect x="${x}" y="${top}" width="${T}" height="${h}" rx="${T / 2}" fill="${ink}" ` +
    `fill-opacity="0.07"/>` +
    `<rect x="${x}" y="${(bottom - h * fraction).toFixed(0)}" width="${T}" ` +
    `height="${(h * fraction).toFixed(0)}" rx="${T / 2}" fill="${colour}" fill-opacity="0.85"/>`
  o.push(column(10, 0.72, cinnabar), column(PH.w - 10 - T, 0.45, goldDeep))
  // A seal, not a clock face: the minute is the only digit on the screen.
  o.push(
    `<rect x="${PH.w / 2 - 22}" y="18" width="44" height="26" rx="3" fill="${ink}" ` +
      `fill-opacity="0.05"/>`,
    text(PH.w / 2, 36, '4:12', 12, ink, 0.5, 'middle'),
  )
  o.push(playField())
  o.push(artStrip(STRIP_X, STRIP.y, SCROLL.slice(0, 4), 1, STRIP.tile, STRIP.gap, false))
  o.push(thumb())
  return o.join('')
}

function screenPlayC(): string {
  const o: string[] = []
  o.push(playField())
  // One block at the foot: health above the strip, insight below it, both
  // exactly the strip's width. Three objects become one, and the top half of
  // the phone — where nothing is ever read during a fight — stays empty.
  const hy = STRIP.y - 22
  o.push(
    text(STRIP_X, hy - 6, '116', 12, ink, 0.7, 'start', '600'),
    text(STRIP_X + STRIP_W, hy - 6, '4:12', 12, ink, 0.42, 'end'),
    bar(STRIP_X, hy, STRIP_W, 0.72, cinnabar, 6),
  )
  o.push(artStrip(STRIP_X, STRIP.y, SCROLL.slice(0, 4), 1, STRIP.tile, STRIP.gap, false))
  o.push(
    `<rect x="${STRIP_X}" y="${STRIP.y + STRIP.tile + 12}" width="${STRIP_W}" height="3" ` +
      `rx="1.5" fill="${ink}" fill-opacity="0.09"/>`,
    `<rect x="${STRIP_X}" y="${STRIP.y + STRIP.tile + 12}" width="${(STRIP_W * 0.45).toFixed(0)}" ` +
      `height="3" rx="1.5" fill="${goldDeep}" fill-opacity="0.9"/>`,
  )
  o.push(thumb())
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
    text(28, y + 8, '境界 cultivation', 12.5, gold, 0.95),
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
// SCREEN 14 — 界, the world as places rather than as a list
// ===========================================================================
/**
 * "Queria a tab world mais elaborada e não meramente texto."
 *
 * The tab was five rows of type, and five rows of type cannot make anywhere
 * feel like a place — which matters more here than in most games, because the
 * whole design asks the player to choose WHERE to walk rather than which
 * difficulty number to pick. If the marsh does not look like a marsh, that
 * choice is arithmetic again.
 *
 * The art is drawn by `render/regionArt.ts`, in code, in the game's own ink
 * vocabulary. That is not a compromise dressed up as a decision: every image
 * host, asset site and generation API is unreachable from the machine this is
 * built on, which is the same constraint that produced the ink direction in the
 * first place. It also means a region added later arrives with its own picture
 * instead of waiting on an art order, and the whole set weighs nothing.
 *
 * The tab and the rift are ONE screen now. Two screens — a list of places, then
 * a panel of what is rolled there — made the player navigate to find out what
 * was on offer, and a roll you have to go looking for is not an offer.
 */
function screenWorldMap(): string {
  const o: string[] = [header('Shen Baoyu', '筑基 Foundation Building', 12)]
  const M = 12
  const CW = PH.w - M * 2
  const VH = 104
  let y = 104

  o.push(
    text(M + 4, y, 'AS FENDAS ABERTAS', 10, ink, 0.45, 'start', '600'),
    text(PH.w - M - 4, y, 'viram em 2h14', 9, goldDeep, 0.75, 'end'),
  )
  y += 12

  // Omens, as marks rather than as sentences. Two or three per rift, and the
  // colour says which way they cut before a single word is read.
  const OMEN_ROWS: Array<Array<[string, boolean]>> = [
    [['丰', true], ['沉', false]],
    [['血雾', false], ['双弓', false], ['丰', true]],
    [['纸', false], ['疫', false]],
    [['群', false], ['玉', true]],
    [['?', false]],
  ]

  REGIONS.forEach((region, i) => {
    const open = i < 4
    const tier = [4, 6, 7, 9, 0][i]!
    o.push(`<g opacity="${open ? 1 : 0.42}">`)
    // The vignette, clipped by the card. Drawn first so everything else sits on
    // top of it, which is also the reading order: place, then name, then terms.
    o.push(
      `<svg x="${M}" y="${y}" width="${CW}" height="${VH}" viewBox="0 0 ${CW} ${VH}">` +
        `<rect width="${CW}" height="${VH}" fill="${paper}"/>` +
        regionVignette(region.id, { w: CW, h: VH }) +
        `</svg>`,
    )
    // A scrim only under the type, so the picture is not dimmed to make room
    // for words.
    o.push(
      `<rect x="${M}" y="${y + VH - 34}" width="${CW}" height="34" fill="${paper}" ` +
        `fill-opacity="0.82"/>`,
      `<rect x="${M}" y="${y}" width="${CW}" height="${VH}" fill="none" stroke="${ink}" ` +
        `stroke-opacity="0.16"/>`,
      seal(M + 22, y + VH - 12, region.seal, 14, ink, 0.85),
      text(M + 40, y + VH - 15, region.name.replace('The ', ''), 12, ink, 0.9, 'start', '600'),
      // Truncated at a WORD, not at a character. Cutting mid-word ("against
      // you b") reads as a rendering bug rather than as an abbreviation.
      text(M + 40, y + VH - 4, clip(region.ruleText, 44), 8, ink, 0.5),
    )
    if (open) {
      o.push(
        `<rect x="${M + CW - 52}" y="${y + 8}" width="44" height="20" rx="3" fill="${paper}" ` +
          `fill-opacity="0.85"/>`,
        text(M + CW - 30, y + 22, `阶 ${tier}`, 11, goldDeep, 0.95, 'middle', '600'),
      )
      // The omen chips, top-left over the sky where every vignette is empty.
      let ox = M + 8
      for (const [glyph, good] of OMEN_ROWS[i]!) {
        const w = glyph.length > 1 ? 26 : 18
        o.push(
          `<rect x="${ox}" y="${y + 8}" width="${w}" height="20" rx="3" ` +
            `fill="${good ? gold : cinnabar}" fill-opacity="0.16" stroke="${good ? gold : cinnabar}" ` +
            `stroke-opacity="0.5"/>`,
          seal(ox + w / 2, y + 22, glyph, glyph.length > 1 ? 9 : 12, good ? goldDeep : cinnabar, 0.95),
        )
        ox += w + 5
      }
    } else {
      o.push(
        `<rect x="${M + CW - 128}" y="${y + 8}" width="120" height="20" rx="3" fill="${paper}" ` +
          `fill-opacity="0.85"/>`,
        text(M + CW - 68, y + 22, 'fechada até 金丹', 9.5, ink, 0.6, 'middle'),
      )
    }
    o.push(`</g>`)
    y += VH + 10
  })

  o.push(
    text(PH.w / 2, y + 18, 'Toca numa fenda para ver o que cai lá.', 9.5, ink, 0.45, 'middle'),
    tabs(3),
  )
  return o.join('')
}

// ===========================================================================
// SCREEN 15 — the long press, which is what a phone has instead of a tooltip
// ===========================================================================
/**
 * "Não tem tooltips?"
 *
 * Not in combat, and that is deliberate rather than missing: there is nothing
 * to hover on a phone and nothing to tap during a fight — the thumb is spent on
 * moving. So the explaining happens in the two places where the player has
 * time, and the strip stays a readout.
 *
 *   LONG PRESS anywhere an art or a piece is shown in the hub, and this panel
 *   opens. It says what wakes the art, what the art then does, what the next
 *   grade is worth, and it says it in words, with the pictogram and the seal
 *   side by side — which is also where a player LEARNS that 静 means the seated
 *   figure means stop moving.
 *
 *   THE FIRST TIME a condition fires in a run, one line crosses the screen and
 *   never appears again. That is the teaching moment the strip cannot carry.
 */
function screenTip(): string {
  const o: string[] = [header('Shen Baoyu', '筑基 Foundation Building', 12)]
  const M = 16
  const art = SCROLL[0]!
  const cond = CONDITION_BY_ID.get(art.condition)!

  // The tab underneath, dimmed, so the panel reads as something that opened on
  // top of the scroll rather than as another screen.
  o.push(
    `<g opacity="0.25">`,
    text(M, 120, 'ROLO DO STRAIGHT JIAN', 10, ink, 0.45, 'start', '600'),
    ...SCROLL.slice(0, 4).map((a, i) =>
      [
        box(M, 136 + i * 58, PH.w - M * 2, 50),
        artIcon(a.effect, M + 34, 161 + i * 58, 30, false),
        text(M + 60, 166 + i * 58, a.name, 12.5, ink, 0.8),
      ].join(''),
    ),
    `</g>`,
    `<rect x="0" y="88" width="${PH.w}" height="${PH.h - 88}" fill="${ink}" fill-opacity="0.35"/>`,
  )

  const py = 232
  const ph = 384
  o.push(
    `<rect x="${M}" y="${py}" width="${PH.w - M * 2}" height="${ph}" rx="6" fill="${paper}"/>`,
    `<rect x="${M}" y="${py}" width="${PH.w - M * 2}" height="${ph}" rx="6" fill="none" ` +
      `stroke="${ink}" stroke-opacity="0.3"/>`,
    // The art itself.
    artIcon(art.effect, M + 44, py + 44, 44, true),
    text(M + 78, py + 38, art.name, 17, ink, 0.92, 'start', '600'),
    // Placed off the NAME's length. A fixed offset put 点 flush against
    // "Point" — the two ran together into one word.
    seal(M + 78 + art.name.length * 9.4 + 12, py + 38, art.seal, 15, cinnabar, 0.85),
    text(M + 78, py + 56, `Grau 3 de 5 · ${art.effect}`, 9.5, goldDeep, 0.9),
    rule(M + 16, py + 76, PH.w - M * 2 - 32),
  )

  // WHAT WAKES IT — the pictogram, the seal and the instruction, together. This
  // is the only place all three appear at once, and it is how the pictogram on
  // the strip acquires a meaning.
  let ty = py + 96
  o.push(
    text(M + 16, ty, 'O QUE A ACORDA', 9, ink, 0.4, 'start', '600'),
    `<rect x="${M + 16}" y="${ty + 10}" width="${PH.w - M * 2 - 32}" height="56" rx="4" ` +
      `fill="${cinnabar}" fill-opacity="0.06" stroke="${cinnabar}" stroke-opacity="0.3"/>`,
    condIcon(art.condition, M + 46, ty + 38, 30, true),
    text(M + 74, ty + 32, cond.name, 12.5, ink, 0.9, 'start', '600'),
    seal(M + 74 + cond.name.length * 7.4 + 12, ty + 32, cond.seal, 13, cinnabar, 0.8),
    text(M + 74, ty + 48, cond.how, 9.5, ink, 0.55),
  )
  ty += 84

  o.push(
    text(M + 16, ty, 'O QUE FAZ', 9, ink, 0.4, 'start', '600'),
    text(M + 16, ty + 18, art.blurb, 11, ink, 0.8),
    text(M + 16, ty + 36, 'Enquanto a condição se mantiver. Deixas de a cumprir,', 9.5, ink, 0.5),
    text(M + 16, ty + 49, 'e a arte adormece no mesmo instante.', 9.5, ink, 0.5),
  )
  ty += 74

  o.push(
    text(M + 16, ty, 'GRAU', 9, ink, 0.4, 'start', '600'),
    text(PH.w - M - 16, ty, '3 → 4', 9.5, goldDeep, 0.9, 'end', '600'),
  )
  for (let p = 0; p < 5; p++) {
    o.push(
      `<rect x="${M + 16 + p * 30}" y="${ty + 12}" width="24" height="5" rx="2.5" ` +
        `fill="${goldDeep}" fill-opacity="${p < 3 ? 0.85 : 0.16}"/>`,
    )
  }
  o.push(
    text(M + 16, ty + 36, 'Sobe com 感悟, pela ordem em que puseste as artes.', 9.5, ink, 0.5),
    text(M + 16, ty + 49, 'Esta é a primeira, por isso é a que sobe primeiro.', 9.5, ink, 0.5),
  )

  o.push(
    box(M + 16, py + ph - 56, PH.w - M * 2 - 32, 40, {
      fill: palette.ink, fillOp: 0.9, strokeOp: 0,
    }),
    text(PH.w / 2, py + ph - 30, 'FECHAR', 12, paper, 0.95, 'middle', '600'),
  )
  return o.join('')
}

// ===========================================================================
// SCREEN 10-13 — 裂隙, the rift
// ===========================================================================
/**
 * The rift, and why it beat the five-minute timer I had proposed.
 *
 * The proposal on the table was three acts and a gate at 4:30 — a CLOCK. The
 * measurement in tools/runLength.mts kills it: a run lasts 227 seconds on the
 * Post Road and 38 on the Pass, so a gate on the clock means the deep regions
 * never once meet their own boss. A bar filled by KILLING is a distance rather
 * than a clock, and a distance self-adjusts: the Pass is dense, so its bar fills
 * fast even though its runs are short.
 *
 * It also fixes a pathology the same harness measured. The kiting pilot survives
 * 227 seconds and gathers five 感悟; the duelling pilot dies at 133 and gathers
 * eleven. Running away is currently the winning play and it starves the build.
 * When the bar is fed by kills, running away stops being progress.
 *
 * The two additions on top are where "muito conteúdo PvE" actually comes from,
 * and neither one costs art:
 *
 *   天象 OMENS   two or three rolled per rift, seen BEFORE entering, some in
 *                your favour and some not. Five regions × a pool of omens is
 *                combinatorial, and it is all data.
 *   阶 TIERS     no ceiling. After the boss you bank, or you push the next tier
 *                straight away carrying the build you just finished growing.
 */
const OMENS: Array<[string, string, string, boolean]> = [
  ['血雾', 'Blood Mist', 'O que morre deixa uma nuvem que queima.', false],
  ['双弓', 'Twin Bows', 'Os arqueiros vêm a dobrar.', false],
  ['丰', 'Abundance', '+40% qi de tudo o que cai.', true],
]

function screenRift(): string {
  const o: string[] = [header('Shen Baoyu', '筑基 Foundation Building', 12)]
  const M = 16
  let y = 116

  o.push(
    text(M, y, '裂隙', 11, cinnabar, 0.9, 'start', '600'),
    text(M + 38, y, 'A FENDA', 10, ink, 0.45, 'start', '600'),
    text(PH.w - M, y, '阶 7', 13, goldDeep, 0.95, 'end', '600'),
  )
  y += 16
  o.push(text(M, y, 'Cada fenda é sorteada. Vês tudo antes de entrar.', 9, ink, 0.4))
  y += 18

  // The place. One line, because the region's rule is the only thing that
  // changes how it is played and the blurb is read once ever.
  o.push(
    box(M, y, PH.w - M * 2, 64),
    seal(M + 32, y + 38, '断崖', 18, ink, 0.85),
    text(M + 62, y + 26, 'The Broken Cliff', 13, ink, 0.9),
    text(M + 62, y + 44, 'O vento empurra-te, e vira.', 9.5, ink, 0.45),
  )
  y += 76

  o.push(text(M, y, '天象  OMENS', 10, ink, 0.45, 'start', '600'))
  y += 10
  for (const [s, name, what, good] of OMENS) {
    const colour = good ? palette.gold : palette.cinnabar
    o.push(
      box(M, y, PH.w - M * 2, 46, { fill: colour, fillOp: 0.05, stroke: colour, strokeOp: 0.35 }),
      seal(M + 28, y + 30, s, 15, hex(colour), 0.9),
      text(M + 54, y + 22, name, 11.5, ink, 0.85),
      text(M + 54, y + 37, what, 9, ink, 0.45),
      text(PH.w - M - 12, y + 29, good ? '+' : '−', 15, hex(colour), 0.8, 'end'),
    )
    y += 52
  }
  y += 4

  // Rerolling is the loop that makes a rift worth reading rather than entering
  // blind, and it costs something so that reading is a decision.
  o.push(
    box(M, y, (PH.w - M * 2 - 10) / 2, 46, { strokeOp: 0.3 }),
    text(M + (PH.w - M * 2 - 10) / 4, y + 22, 'RESSORTEAR', 11, ink, 0.7, 'middle', '600'),
    text(M + (PH.w - M * 2 - 10) / 4, y + 36, '1 · 玉符', 8.5, goldDeep, 0.8, 'middle'),
    box(M + (PH.w - M * 2 + 10) / 2, y, (PH.w - M * 2 - 10) / 2, 46, {
      fill: palette.ink, fillOp: 0.92, strokeOp: 0,
    }),
    text(PH.w - M - (PH.w - M * 2 - 10) / 4, y + 28, 'ENTRAR', 13, paper, 0.95, 'middle', '600'),
  )
  y += 58

  o.push(
    rule(M, y, PH.w - M * 2),
    text(M, y + 18, 'CAI AQUI', 9.5, ink, 0.4, 'start', '600'),
    text(M, y + 34, 'Duplas · 秘笈 do rolo das duplas · rank até 4', 9.5, ink, 0.55),
    text(M, y + 50, 'Chefe garantido no fim da barra.', 9.5, goldDeep, 0.8),
  )
  y += 74

  // Three open at once, and they expire. This is the whole content model in one
  // block: the places and the rosters are finite, the ROLL is not, and a player
  // who dislikes all three can wait for the turn rather than grind the one.
  o.push(
    rule(M, y, PH.w - M * 2),
    text(M, y + 18, 'OUTRAS FENDAS ABERTAS', 9.5, ink, 0.4, 'start', '600'),
    text(PH.w - M, y + 18, 'viram em 2h14', 9, goldDeep, 0.7, 'end'),
  )
  y += 28
  const others: Array<[string, string, string, string]> = [
    ['芦荡', 'Reed Marsh', '阶 6', '沉 · 群'],
    ['鬼市', 'Ghost Market', '阶 9', '纸 · 丰 · 疫'],
  ]
  for (const [s, name, tier, omens] of others) {
    o.push(
      box(M, y, PH.w - M * 2, 40, { fillOp: 0.02, strokeOp: 0.09 }),
      seal(M + 26, y + 26, s, 14, ink, 0.6),
      text(M + 50, y + 24, name, 11, ink, 0.7),
      text(PH.w - M - 12, y + 18, tier, 10, goldDeep, 0.85, 'end', '600'),
      text(PH.w - M - 12, y + 32, omens, 9, ink, 0.4, 'end'),
    )
    y += 46
  }

  o.push(tabs(3))
  return o.join('')
}

/**
 * The rift bar in play — a full-bleed edge, not a HUD block.
 *
 * Everything else on this screen is variant C, which is deliberate: the rift
 * needs exactly ONE new thing on screen, and the argument for C was that the top
 * half of a phone is never read during a fight. A three-pixel edge at the very
 * top is the one exception that survives, because it is read peripherally —
 * "how much is left" — and never looked at directly.
 */
function screenPlayRift(): string {
  const o: string[] = []
  const fill = 0.62
  o.push(
    `<rect x="0" y="0" width="${PH.w}" height="4" fill="${ink}" fill-opacity="0.08"/>`,
    `<rect x="0" y="0" width="${(PH.w * fill).toFixed(0)}" height="4" fill="${cinnabar}" ` +
      `fill-opacity="0.85"/>`,
  )
  o.push(playField())
  const hy = STRIP.y - 22
  o.push(
    text(STRIP_X, hy - 6, '116', 12, ink, 0.7, 'start', '600'),
    // The count that matters is what is LEFT of the rift, not the clock.
    text(STRIP_X + STRIP_W, hy - 6, '裂 62%', 12, cinnabar, 0.75, 'end'),
    bar(STRIP_X, hy, STRIP_W, 0.72, cinnabar, 6),
  )
  o.push(artStrip(STRIP_X, STRIP.y, SCROLL.slice(0, 4), 1, STRIP.tile, STRIP.gap, false))
  o.push(
    `<rect x="${STRIP_X}" y="${STRIP.y + STRIP.tile + 12}" width="${STRIP_W}" height="3" ` +
      `rx="1.5" fill="${ink}" fill-opacity="0.09"/>`,
    `<rect x="${STRIP_X}" y="${STRIP.y + STRIP.tile + 12}" width="${(STRIP_W * 0.45).toFixed(0)}" ` +
      `height="3" rx="1.5" fill="${goldDeep}" fill-opacity="0.9"/>`,
  )
  o.push(thumb())
  return o.join('')
}

/** The bar fills, and the thing at the end of it walks on. */
function screenGate(): string {
  const o: string[] = []
  o.push(
    `<rect x="0" y="0" width="${PH.w}" height="4" fill="${cinnabar}" fill-opacity="0.9"/>`,
  )
  o.push(playField())
  // The boss, larger and gold-marked, which is the game's existing rule for it.
  o.push(
    `<ellipse cx="${PLAY_CX + 6}" cy="${PLAY_CY - 130}" rx="34" ry="46" fill="${ink}" ` +
      `fill-opacity="0.92"/>`,
    `<path d="M ${PLAY_CX - 30} ${PLAY_CY - 162} L ${PLAY_CX + 42} ${PLAY_CY - 176}" ` +
      `stroke="${gold}" stroke-opacity="0.8" stroke-width="3" fill="none"/>`,
  )
  // The announcement: a seal and a name, and it fades. No instructions — the
  // player has one input and it is already in their thumb.
  //
  // It sits ABOVE the boss and not over it, which the first draft got wrong:
  // a 64-point seal laid across the one silhouette the player most needs to
  // read is an announcement that hides the thing it announces.
  o.push(
    seal(PH.w / 2, 136, '关', 60, cinnabar, 0.85),
    text(PH.w / 2, 164, 'O PORTÃO', 10.5, ink, 0.45, 'middle', '600'),
    text(PH.w / 2, 188, 'The Cliff Warden', 15, ink, 0.85, 'middle'),
  )
  o.push(artStrip(STRIP_X, STRIP.y, SCROLL.slice(0, 4), 1, STRIP.tile, STRIP.gap, false))
  o.push(thumb())
  return o.join('')
}

/**
 * Bank, or push. The one greed decision in the game.
 *
 * It is placed AFTER the reward is already counted, not before, so the choice is
 * "risk the extra" rather than "risk everything" — dying in the deep must never
 * take back what the gate already paid, or nobody ever presses the second
 * button twice.
 */
function screenPush(): string {
  const o: string[] = [`<rect width="${PH.w}" height="${PH.h}" rx="18" fill="${ink}"/>`]
  o.push(
    seal(PH.w / 2, 128, '踏破', 40, gold, 0.9),
    text(PH.w / 2, 164, 'FENDA FEITA · 阶 7', 11, paper, 0.5, 'middle', '600'),
    text(PH.w / 2, 200, '+1 240 境界', 26, gold, 0.95, 'middle', '300'),
    text(PH.w / 2, 222, 'já está no bolso, aconteça o que acontecer', 9.5, paper, 0.4, 'middle'),
    `<rect x="28" y="252" width="${PH.w - 56}" height="1" fill="${paper}" fill-opacity="0.16"/>`,
  )

  let y = 290
  const options: Array<[string, string, string, string, boolean]> = [
    ['收', 'SAIR COM TUDO', 'Voltas ao pátio. Nada disto se perde.', '', false],
    ['深', 'DESCER AO 阶 8', 'Levas a build que acabaste de fazer.', 'inimigos +12% · prémio ×1.4', true],
  ]
  for (const [s, name, what, extra, push] of options) {
    const h = extra ? 104 : 84
    o.push(
      `<rect x="24" y="${y}" width="${PH.w - 48}" height="${h}" rx="5" ` +
        `fill="${push ? gold : paper}" fill-opacity="${push ? 0.1 : 0.06}" ` +
        `stroke="${push ? gold : paper}" stroke-opacity="${push ? 0.6 : 0.25}"/>`,
      seal(64, y + 46, s, 26, push ? gold : paper, 0.9),
      text(104, y + 34, name, 13.5, paper, 0.95, 'start', '600'),
      text(104, y + 54, what, 9.5, paper, 0.45),
    )
    if (extra) o.push(text(104, y + 76, extra, 9.5, gold, 0.85))
    y += h + 14
  }

  o.push(
    text(PH.w / 2, y + 24, 'A build só se perde quando saíres.', 9.5, paper, 0.35, 'middle'),
    text(PH.w / 2, y + 42, 'É essa a decisão.', 9.5, cinnabar, 0.9, 'middle'),
  )
  y += 74

  // What is already banked, listed. The screen argues "push"; the honest
  // counterweight is showing the player exactly what they would be gambling
  // NOTHING of — the list is the proof that the offer is not a trick.
  o.push(
    `<rect x="28" y="${y}" width="${PH.w - 56}" height="1" fill="${paper}" fill-opacity="0.14"/>`,
    text(28, y + 22, 'JÁ NO BOLSO', 9.5, paper, 0.35, 'start', '600'),
  )
  const banked: Array<[string, string]> = [
    ['秘笈  Swallow  燕', 'arte nova'],
    ['Iron Pauldrons ····', 'rank 4'],
    ['Cliff Warden felled', '阶 7'],
  ]
  banked.forEach(([what, note], i) => {
    o.push(
      text(28, y + 46 + i * 20, what, 11, paper, i === 0 ? 0.9 : 0.55),
      text(PH.w - 28, y + 46 + i * 20, note, 9.5, i === 0 ? gold : paper, i === 0 ? 0.9 : 0.35, 'end'),
    )
  })
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
  { file: '01a-play-nada', title: 'Em jogo · A 无字', tag: 'PROPOSTA', draw: screenPlayA },
  { file: '01b-play-margem', title: 'Em jogo · B 裱', tag: 'PROPOSTA', draw: screenPlayB },
  { file: '01c-play-base', title: 'Em jogo · C 底', tag: 'PROPOSTA', draw: screenPlayC },
  { file: '10-rift', title: 'A fenda · antes de entrar', tag: 'PROPOSTA', draw: screenRift },
  { file: '11-play-rift', title: 'A fenda · a encher', tag: 'PROPOSTA', draw: screenPlayRift },
  { file: '12-gate', title: 'A fenda · o portão', tag: 'PROPOSTA', draw: screenGate },
  { file: '13-push', title: 'A fenda · sair ou descer', tag: 'PROPOSTA', draw: screenPush },
  { file: '14-world', title: 'Hub · 界 Mundo (novo)', tag: 'PROPOSTA', draw: screenWorldMap },
  { file: '15-tip', title: 'Toque longo · o que isto é', tag: 'PROPOSTA', draw: screenTip },
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
