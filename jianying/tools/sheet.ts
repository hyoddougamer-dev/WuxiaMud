/**
 * Shared drawing for the proposal sheets.
 *
 * Three sheets now render swordsmen at various sizes with various accents, and
 * a second copy of the figure code would be a second place for the blade angle
 * or the bleed-tinting rule to drift. The rule those sheets exist to
 * demonstrate cannot be demonstrated by two functions that disagree.
 *
 * Everything here is DRAWING. The item data, the set data and the layout of
 * each sheet stay in the sheet that owns them.
 */
import { Rng } from '../src/core/rng'
import { buildBlade, buildSwordsmanTopDown, type Swordsman } from '../src/render/figure'
import { rankMarks } from '../src/render/rankMarks'
import { strokeToPolygon } from '../src/render/silhouette'
import { palette } from '../src/render/palette'
import { DEFAULT_GEAR, gearFromIds, type Gear } from '../src/render/wardrobe'
import { ITEM_BY_ID, type Item, type Slot } from '../src/data/items'

export const W = 1180
export const hex = (c: number): string => `#${c.toString(16).padStart(6, '0')}`

export const INDIGO = 0x2e4a6b
export const MALACHITE = 0x4a6b52

// --- rarity ---------------------------------------------------------------

export interface Tier {
  readonly seal: string
  readonly name: string
  readonly colour: number | null
  readonly note: string
}

/**
 * Four tiers, and the accent gets louder rather than merely different.
 *
 * Deliberately reusing the accents the item cards ALREADY use in the hub: gold
 * for uncommon, cinnabar for rare. A player who has learnt what a gold edge
 * means on a card does not have to learn it again on the figure.
 */
export const TIERS: readonly Tier[] = [
  { seal: '常', name: 'Common', colour: null, note: 'Flat ink. Most of what drops.' },
  { seal: '珍', name: 'Uncommon', colour: palette.gold, note: 'A gold hairline along the piece.' },
  { seal: '奇', name: 'Rare', colour: palette.cinnabar, note: 'Cinnabar, and the ink bleeds wider.' },
  { seal: '神', name: 'Divine', colour: INDIGO, note: 'The bleed becomes a wash of qi.' },
]

// --- enchantments ---------------------------------------------------------

export interface Rite {
  readonly seal: string
  readonly name: string
  readonly colour: number
  readonly kind: 'motes' | 'wash' | 'arcs' | 'ghost' | 'trail'
  readonly line: string
}

/**
 * Five inscriptions, each with ONE effect that is visible in a still frame.
 *
 * "Visible in a still frame" is the acceptance test, and it is stricter than it
 * sounds: an enchantment that only reads while moving cannot be judged in the
 * hub, cannot be compared against another item, and cannot be photographed by a
 * player asking whether the drop was any good.
 */
export const RITES: readonly Rite[] = [
  {
    seal: '焰',
    name: 'Ember',
    colour: palette.cinnabar,
    kind: 'motes',
    line: 'Sparks rise from the hem. Burns what it cuts.',
  },
  {
    seal: '霜',
    name: 'Frost',
    colour: INDIGO,
    kind: 'wash',
    line: 'A cold wash clings to the figure. Slows what it cuts.',
  },
  {
    seal: '雷',
    name: 'Thunder',
    colour: palette.gold,
    kind: 'arcs',
    line: 'Arcs flicker off the blade. Strikes a second foe.',
  },
  {
    seal: '影',
    name: 'Shadow',
    colour: palette.inkSoft,
    kind: 'ghost',
    line: 'A second silhouette, half a step behind. Strikes twice, faintly.',
  },
  {
    seal: '毒',
    name: 'Venom',
    colour: MALACHITE,
    kind: 'trail',
    line: 'Green ink trails the sweep. What it cuts keeps bleeding.',
  },
]

/**
 * The blade is raised, not lowered, and hangs off the hand the figure has.
 *
 * It used to be pinned at a fixed point on the chest and angled down. The
 * figure now has arms and hands, and its hand sits about eleven units off the
 * ground — so a forty-unit blade pointed down leaves the frame before it leaves
 * the body. Kept in step with render/silhouette.ts on purpose: a contact sheet
 * that draws the weapon differently from the game is a sheet that lies.
 */
export const BLADE_ANGLE = -62

/** Longest blade a portrait draws at full length; past this it foreshortens. */
export const BLADE_FIT = 46

/** The aura markup for one effect, drawn behind or in front of the figure. */
export function auraFor(
  kind: Rite['kind'],
  colour: number,
  seed: number,
  scale: number,
  gear: Gear,
): { behind: string; front: string } {
  const rng = new Rng(seed)
  const c = hex(colour)
  const behind: string[] = []
  const front: string[] = []

  switch (kind) {
    case 'motes': {
      // Rising, and thinning as they rise. Sixteen is enough to read as a
      // stream; more turns into a cloud and stops looking like brushwork.
      for (let i = 0; i < 16; i++) {
        const t = i / 16
        const x = (rng.next() - 0.5) * 26 * scale
        const yy = -(6 + t * 46 + rng.next() * 8) * scale
        const r = (2.1 - t * 1.3) * scale * (0.6 + rng.next() * 0.6)
        front.push(
          `<circle cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" r="${Math.max(0.4, r).toFixed(1)}" ` +
            `fill="${c}" fill-opacity="${(0.62 - t * 0.42).toFixed(2)}"/>`,
        )
      }
      break
    }
    case 'wash': {
      // Rewritten. The first version was a soft radial field and it read as a
      // smudge — the one effect on the sheet you could not name after looking
      // at it. Cold is now a RING of frost drawn on the ground the figure
      // stands on, plus shards leaning off it. A mark on the ground is the
      // clearest possible statement that an effect has a radius, and radius is
      // exactly what "slows what it cuts" means.
      behind.push(
        `<ellipse cx="0" cy="${(1 * scale).toFixed(1)}" rx="${(26 * scale).toFixed(1)}" ry="${(8 * scale).toFixed(1)}" ` +
          `fill="none" stroke="${c}" stroke-width="${(1.8 * scale).toFixed(1)}" stroke-opacity="0.72"/>`,
        `<ellipse cx="0" cy="${(1 * scale).toFixed(1)}" rx="${(26 * scale).toFixed(1)}" ry="${(8 * scale).toFixed(1)}" ` +
          `fill="${c}" fill-opacity="0.1"/>`,
      )
      for (let i = 0; i < 9; i++) {
        const a = rng.next() * Math.PI * 2
        const d = (13 + rng.next() * 13) * scale
        const x = Math.cos(a) * d
        const yy = 1 * scale + Math.sin(a) * d * 0.3
        front.push(
          `<path d="M ${x.toFixed(1)} ${yy.toFixed(1)} l ${(1.6 * scale).toFixed(1)} ${(-5.5 * scale).toFixed(1)}" ` +
            `stroke="${c}" stroke-width="${(1.5 * scale).toFixed(1)}" stroke-opacity="0.8" stroke-linecap="round"/>`,
        )
      }
      break
    }
    case 'arcs': {
      // Off the blade specifically, not the body: the point of Thunder is that
      // it is a property of the weapon, and the aura has to say which slot it
      // came from or enchantments become a single undifferentiated glow.
      // Longer, fewer and heavier than the first attempt, which produced five
      // short scribbles that read as noise rather than as lightning. A bolt
      // needs length to be a bolt.
      const rad = (BLADE_ANGLE * Math.PI) / 180
      for (let i = 0; i < 3; i++) {
        const along = (16 + i * 11) * scale
        const bx = 8 * scale + Math.cos(rad) * along
        const by = -26 * scale + Math.sin(rad) * along
        const j = (m: number) => (rng.next() - 0.5) * m * scale
        front.push(
          `<path d="M ${bx.toFixed(1)} ${by.toFixed(1)} l ${j(11).toFixed(1)} ${(-7 * scale).toFixed(1)} ` +
            `l ${j(9).toFixed(1)} ${(-6 * scale).toFixed(1)} l ${j(12).toFixed(1)} ${(-8 * scale).toFixed(1)}" ` +
            `fill="none" stroke="${c}" stroke-width="${(1.6 * scale).toFixed(1)}" ` +
            `stroke-opacity="0.9" stroke-linecap="round" stroke-linejoin="round"/>`,
        )
      }
      break
    }
    case 'ghost': {
      // The figure itself, offset and faint. Costs nothing new to draw because
      // the geometry is already built, and it is the only effect here that
      // changes the SHAPE rather than adding light to it.
      const copy = buildSwordsmanTopDown(seed, scale, gear)
      const marks = [...copy.bleed, ...copy.body]
        .map((s) => strokeToPolygon(s, colour))
        .join('')
      behind.push(
        `<g transform="translate(${(-13 * scale).toFixed(1)},${(2 * scale).toFixed(1)})" ` +
          `opacity="0.42">${marks}</g>`,
      )
      break
    }
    case 'trail': {
      // The arc the sweep travels, left behind as wet ink. It is the only one
      // that shows what the weapon DOES rather than what it is.
      const r = 30 * scale
      front.push(
        `<path d="M ${(-r * 0.75).toFixed(1)} ${(-30 * scale).toFixed(1)} ` +
          `A ${r.toFixed(1)} ${(r * 0.72).toFixed(1)} 0 0 0 ${(r * 0.85).toFixed(1)} ${(-12 * scale).toFixed(1)}" ` +
          `fill="none" stroke="${c}" stroke-width="${(3.4 * scale).toFixed(1)}" ` +
          `stroke-opacity="0.42" stroke-linecap="round"/>`,
      )
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * (0.15 + rng.next() * 0.7)
        front.push(
          `<circle cx="${(-Math.cos(a) * r * 0.9).toFixed(1)}" ` +
            `cy="${(-26 * scale - Math.sin(a) * r * 0.35).toFixed(1)}" ` +
            `r="${(rng.next() * 1.8 * scale + 0.5).toFixed(1)}" fill="${c}" fill-opacity="0.5"/>`,
        )
      }
      break
    }
  }
  return { behind: behind.join(''), front: front.join('') }
}

/**
 * One figure, optionally accented and haloed.
 *
 * `accent` recolours the BLEED pass rather than the body. That choice is the
 * whole trick: the bleed is the wide faint pass that sells ink soaking into
 * paper, so tinting it reads as the piece glowing from within the paper, while
 * tinting the body would just produce a coloured cut-out and throw away the
 * silhouette the game depends on.
 */
export function figure(
  gear: Gear,
  seed: number,
  scale: number,
  opts: { accent?: number | null; rite?: Rite; build?: number; rank?: number; rankSlot?: Slot } = {},
): { markup: string; bottom: number; right: number } {
  const { accent = null, rite, build = 1, rank = 0, rankSlot = 'robe' } = opts
  const swordsman = buildSwordsmanTopDown(seed, scale, gear, build)
  const parts: string[] = []
  let bottom = 6 * scale
  let right = 13 * scale * build

  const halo = rite ? auraFor(rite.kind, rite.colour, seed, scale, gear) : null
  if (halo) parts.push(halo.behind)

  parts.push(
    `<ellipse cx="0" cy="${2 * scale}" rx="${11 * scale * build}" ry="${3.4 * scale}" ` +
      `fill="${hex(palette.ink)}" fill-opacity="0.1"/>`,
  )

  const rad = (BLADE_ANGLE * Math.PI) / 180
  const fit = Math.min(1, BLADE_FIT / gear.blade.reach)
  const originX = swordsman.hand.x
  const originY = swordsman.hand.y
  const blade = buildBlade(seed + 1, scale, gear.blade)
  for (const stroke of blade) {
    for (let i = 0; i < stroke.poly.length; i += 2) {
      const px = stroke.poly[i]! * fit
      const py = stroke.poly[i + 1]! * fit
      bottom = Math.max(bottom, originY + px * Math.sin(rad) + py * Math.cos(rad))
      right = Math.max(right, originX + px * Math.cos(rad) - py * Math.sin(rad))
    }
  }
  parts.push(
    `<g transform="translate(${originX},${originY}) rotate(${BLADE_ANGLE}) ` +
      `scale(${fit.toFixed(3)}) translate(${-7 * scale},${3 * scale})">` +
      blade.map((s) => strokeToPolygon(s, palette.ink)).join('') +
      `</g>`,
  )

  // The bleed carries the accent; the body stays ink, always.
  for (const stroke of swordsman.bleed) {
    parts.push(
      accent === null || stroke.part === 'cut'
        ? strokeToPolygon(stroke, stroke.part === 'cut' ? palette.paper : palette.ink)
        : strokeToPolygon({ poly: stroke.poly, alpha: stroke.alpha * 3.4 }, accent),
    )
  }
  for (const stroke of swordsman.body) {
    parts.push(strokeToPolygon(stroke, stroke.part === 'cut' ? palette.paper : palette.ink))
    for (let i = 0; i < stroke.poly.length; i += 2) {
      bottom = Math.max(bottom, stroke.poly[i + 1]!)
      right = Math.max(right, stroke.poly[i]!)
    }
  }

  // Over the body, because a hem lies on top of the cloth it belongs to.
  if (rank > 0) parts.push(rankMarksFor(rankSlot, rank, scale, build, accent ?? palette.gold))
  if (halo) parts.push(halo.front)
  return { markup: parts.join(''), bottom, right }
}

export function gearOf(ids: readonly string[]): Gear {
  const best = new Map<Slot, Item>()
  for (const id of ids) {
    const item = ITEM_BY_ID.get(id)
    if (!item) continue
    const held = best.get(item.slot)
    if (!held || item.depth > held.depth) best.set(item.slot, item)
  }
  return gearFromIds({
    robe: best.get('robe')?.styleId,
    shoulders: best.get('shoulders')?.styleId,
    head: best.get('head')?.styleId,
    blade: best.get('weapon')?.styleId,
  })
}

export function label(
  x: number,
  y: number,
  text: string,
  size: number,
  fill: string,
  op = 1,
  anchor: 'middle' | 'start' | 'end' = 'middle',
): string {
  return (
    `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="system-ui, sans-serif" ` +
    `font-size="${size}" fill="${fill}" fill-opacity="${op}">${text}</text>`
  )
}

/**
 * Greedy word wrap at a character budget.
 *
 * SVG `<text>` does not wrap, and the first version of this sheet simply ran
 * two of its explanatory notes off the right edge — the reader lost the end of
 * the sentence that justified the whole section. 13px system-ui averages about
 * 6.6px per character, so 1100px of usable width is roughly 165; 150 leaves
 * room for the wide characters.
 */
export function wrap(text: string, budget = 150): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    if (line && line.length + 1 + word.length > budget) {
      lines.push(line)
      line = word
    } else {
      line = line ? `${line} ${word}` : word
    }
  }
  if (line) lines.push(line)
  return lines
}

export function heading(y: number, seal: string, text: string, note: string): string {
  return (
    `<text x="40" y="${y}" font-family="system-ui, sans-serif" font-size="26" fill="${hex(palette.cinnabar)}">${seal}</text>` +
    `<text x="80" y="${y}" font-family="system-ui, sans-serif" font-size="21" fill="${hex(palette.ink)}">${text}</text>` +
    wrap(note)
      .map(
        (line, i) =>
          `<text x="40" y="${y + 24 + i * 18}" font-family="system-ui, sans-serif" font-size="13" ` +
          `fill="${hex(palette.ink)}" fill-opacity="0.55">${line}</text>`,
      )
      .join('')
  )
}

export function columns(count: number, reach: number): (i: number) => number {
  const step = (W - 80 - reach) / count
  return (i) => 40 + step * (i + 0.5)
}


// --- refinement -----------------------------------------------------------

/**
 * The marks a piece gains as it is tempered.
 *
 * 淬炼 — quenching and refining — is the same word the realm ladder already
 * uses for the body (淬体, Body Tempering, realm one). Applying it to steel is
 * not a metaphor borrowed from elsewhere: a named blade in this fiction IS one
 * that has been folded and quenched many times, so the vocabulary was already
 * sitting in the game waiting to be reused.
 *
 * The marks accumulate on the SILHOUETTE rather than brightening a colour,
 * because "clearly visible" was the requirement and a hairline getting slightly
 * warmer is not clearly visible. Hems stack at the skirt, cords hang from the
 * belt — both read at a glance and both are things real robes of the period
 * actually carried.
 */
export function robeRankMarks(
  rank: number,
  scale: number,
  build: number,
  colour: number,
): string {
  // Kept as the robe's marks. See rankMarksFor for why every slot needs its own.
  return rankMarksFor('robe', rank, scale, build, colour)
}

/**
 * Rank marks for ONE slot.
 *
 * A hole in my own proposal, found by drawing every item separately instead of
 * only the robe: hems at the skirt and cords at the belt are ROBE marks. A hat
 * cannot grow a hem, and a pair of shoulders has no belt. Reusing one mark for
 * every slot would have meant tempering a hat visibly changed the robe, which
 * is worse than showing nothing at all.
 *
 * So each slot gets marks that belong to it, and they read differently from one
 * another on purpose — you can tell WHICH piece was tempered, not merely that
 * something was.
 */
export function rankMarksFor(
  slot: Slot,
  rank: number,
  scale: number,
  build: number,
  colour: number,
  figure?: Swordsman,
): string {
  if (rank <= 0) return ''
  // Delegates to the game's own geometry. This file used to carry its own SVG
  // version of every mark, tuned against an older figure, and it drew tassels
  // in mid-air the moment the sleeves moved — a contact sheet that disagrees
  // with the game is worse than no sheet, because it reads as authority.
  const on = figure ?? buildSwordsmanTopDown(1, scale, DEFAULT_GEAR, build)
  return rankMarks(slot, rank, on, scale)
    .map((m) => strokeToPolygon(m, colour))
    .join('')
}

export { socketsAt } from '../src/render/rankMarks'

/** The socket row as filled and empty pips, for a caption. */
export function socketPips(x: number, y: number, open: number, filled: number, colour: number): string {
  const parts: string[] = []
  const step = 13
  const left = x - ((open - 1) * step) / 2
  for (let i = 0; i < open; i++) {
    const cx = left + i * step
    parts.push(
      i < filled
        ? `<circle cx="${cx}" cy="${y}" r="4" fill="${hex(colour)}" fill-opacity="0.9"/>`
        : `<circle cx="${cx}" cy="${y}" r="4" fill="none" stroke="${hex(palette.ink)}" stroke-opacity="0.3"/>`,
    )
  }
  return parts.join('')
}

// --- lineage seals --------------------------------------------------------

/**
 * The seals a lineage stamps on the painting, one per piece worn.
 *
 * This answers "every piece has to make a visible difference" without needing a
 * separate silhouette for every piece of every lineage — which would have been
 * six lineages times four slots of new geometry, and would have collapsed the
 * wardrobe's readability long before it was finished.
 *
 * Instead the answer comes from the medium itself. A Chinese painting collects
 * SEALS: the artist's, then every owner's, stamped in cinnabar down the side of
 * the work. So a swordsman collects the seals of the forges that made what they
 * wear. One piece, one seal. It is exact — you can count what someone is
 * wearing from across the screen — it costs one small square per piece, and it
 * is the single most recognisably Chinese mark there is.
 *
 * The last seal lights only when the lineage is complete, which is what makes
 * the fourth piece feel different from the third.
 */
export function lineageSeals(
  x: number,
  yBase: number,
  seal: string,
  worn: number,
  total: number,
  lit: boolean,
): string {
  const parts: string[] = []
  const size = 19
  const gap = 5
  for (let i = 0; i < total; i++) {
    const yy = yBase - i * (size + gap)
    const has = i < worn
    // An unstamped seal is an outline: the space is visibly reserved, so the
    // player can see how many pieces the lineage still wants.
    parts.push(
      has
        ? `<rect x="${x - size / 2}" y="${yy - size}" width="${size}" height="${size}" rx="2" ` +
            `fill="${hex(lit && i === total - 1 ? palette.cinnabar : palette.cinnabar)}" ` +
            `fill-opacity="${lit ? 1 : 0.78}"/>` +
            `<text x="${x}" y="${yy - 5}" text-anchor="middle" font-family="serif" font-size="12" ` +
            `fill="${hex(palette.paper)}">${seal}</text>`
        : `<rect x="${x - size / 2}" y="${yy - size}" width="${size}" height="${size}" rx="2" ` +
            `fill="none" stroke="${hex(palette.ink)}" stroke-opacity="0.18" stroke-dasharray="2 2"/>`,
    )
  }
  return parts.join('')
}
