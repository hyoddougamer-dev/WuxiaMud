/**
 * The art icons, at the size they will actually be read.
 *
 *   npx tsx tools/glyphs.ts && npx tsx tools/rasterise.mts docs/glyphs.svg 2
 *
 * Two questions decide whether procedural glyphs were the right call, and
 * neither can be answered by looking at one big drawing:
 *
 *   1. At 34px on a phone strip, are any two of the sixteen the same shape?
 *   2. With the wrong tile lit, can you still tell which is which?
 *
 * So the sheet shows each glyph three times — large enough to read the idea,
 * at tile size, and dimmed — and then every one of the thirty arts on its real
 * tile, grouped by weapon, exactly as the strip will draw them. If a pair
 * collides it will collide here, on a page, rather than in a run.
 */
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { palette } from '../src/render/palette'
import { glyphSvg } from '../src/render/artGlyph'
import { ARTS, CONDITION_BY_ID, NEW_EFFECTS, type EffectKind } from '../src/data/arts'
import { WEAPONS } from '../src/data/weapons'
import { W, hex, label } from './sheet'

const OUT = join(fileURLToPath(new URL('..', import.meta.url)), 'docs')

const ink = hex(palette.ink)
const paper = hex(palette.paper)
const cinnabar = hex(palette.cinnabar)
const goldDeep = hex(palette.goldDeep)

const EFFECTS: EffectKind[] = [
  'damage', 'rate', 'range', 'arc', 'speed', 'magnet', 'orbit', 'bolt', 'nova', 'maxHp',
  'pierce', 'crit', 'echo', 'push', 'guard', 'heal',
]

/** What each effect means, in the player's terms — the caption under the icon. */
const MEANS: Record<EffectKind, string> = {
  damage: 'hits harder',
  rate: 'hits more often',
  range: 'reaches further',
  arc: 'sweeps wider',
  speed: 'you move faster',
  magnet: 'qi comes to you',
  orbit: 'blades circle you',
  bolt: 'throws qi outward',
  nova: 'a ring, all around',
  maxHp: 'you hold more',
  pierce: 'runs through',
  crit: 'lands doubled',
  echo: 'strikes twice',
  push: 'shoves them off',
  guard: 'takes less',
  heal: 'a kill mends you',
}

const parts: string[] = []
const text = (
  x: number, y: number, s: string, size: number,
  fill = ink, op = 1, anchor: 'start' | 'middle' | 'end' = 'middle', weight = 'normal',
): string =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="system-ui, sans-serif" ` +
  `font-size="${size}" font-weight="${weight}" fill="${fill}" fill-opacity="${op}">${s}</text>`

const sealText = (x: number, y: number, s: string, size: number, fill: string, op: number): string =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-family="serif" font-size="${size}" ` +
  `fill="${fill}" fill-opacity="${op}">${s}</text>`

/** A glyph placed at a size, inside the sheet's coordinates. */
const glyph = (effect: EffectKind, x: number, y: number, size: number, lit: boolean, dim = false) =>
  glyphSvg(effect, {
    ink: palette.ink,
    self: lit ? palette.cinnabar : palette.ink,
    opacity: dim ? 0.34 : 1,
  }).replace(
    '<svg class="art-glyph" ',
    `<svg width="${size}" height="${size}" x="${x - size / 2}" y="${y - size / 2}" `,
  )

/** A real strip tile: the glyph, the condition seal beneath, the grade pips. */
function tile(x: number, y: number, effect: EffectKind, cond: string, lit: boolean, grade = 3): string {
  const S = 62
  const o: string[] = []
  o.push(
    `<rect x="${x}" y="${y}" width="${S}" height="${S}" rx="5" ` +
      `fill="${lit ? cinnabar : ink}" fill-opacity="${lit ? 0.1 : 0.04}" ` +
      `stroke="${lit ? cinnabar : ink}" stroke-opacity="${lit ? 0.9 : 0.14}"/>`,
    glyph(effect, x + S / 2, y + 24, 40, lit, !lit),
    sealText(x + S / 2, y + S - 8, cond, 13, lit ? cinnabar : ink, lit ? 1 : 0.3),
  )
  for (let p = 0; p < 5; p++) {
    o.push(
      `<circle cx="${x + 12 + p * 10}" cy="${y + S + 8}" r="2.1" fill="${goldDeep}" ` +
        `fill-opacity="${p < grade ? 0.85 : 0.15}"/>`,
    )
  }
  return o.join('')
}

// --- header ----------------------------------------------------------------
let y = 54
parts.push(
  text(W / 2, y, '功法 — o ícone é o efeito, não o nome', 26, ink, 0.9, 'middle', '600'),
  text(
    W / 2, y + 26,
    'Dezasseis efeitos, dezasseis formas. Desenhados pelo mesmo pincel que desenha as figuras — sem pack, sem ficheiros, sem licença.',
    12.5, ink, 0.5,
  ),
)
y += 66

// --- the sixteen, large ----------------------------------------------------
parts.push(text(60, y, 'O VOCABULÁRIO', 11, ink, 0.45, 'start', '600'))
parts.push(text(W - 60, y, 'grande · no tile · apagado', 11, ink, 0.35, 'end'))
y += 22

const COLS = 4
const CW = (W - 120) / COLS
EFFECTS.forEach((effect, i) => {
  const col = i % COLS
  const row = Math.floor(i / COLS)
  const x = 60 + col * CW
  const ty = y + row * 132
  const isNew = NEW_EFFECTS.includes(effect)
  parts.push(
    `<rect x="${x}" y="${ty}" width="${CW - 16}" height="120" rx="6" fill="${ink}" ` +
      `fill-opacity="0.025" stroke="${ink}" stroke-opacity="0.1"/>`,
    glyph(effect, x + 54, ty + 52, 82, false),
    glyph(effect, x + 122, ty + 44, 40, true),
    glyph(effect, x + 172, ty + 44, 40, false, true),
    text(x + 16, ty + 92, effect, 13, ink, 0.85, 'start', '600'),
    text(x + 16, ty + 108, MEANS[effect], 11, ink, 0.45, 'start'),
    isNew
      ? text(x + CW - 30, ty + 20, 'NOVO', 9, cinnabar, 0.85, 'end', '600')
      : text(x + CW - 30, ty + 20, 'já existe', 9, ink, 0.3, 'end'),
  )
})
y += Math.ceil(EFFECTS.length / COLS) * 132 + 16

// --- the thirty arts, on real tiles ----------------------------------------
parts.push(
  `<rect x="60" y="${y}" width="${W - 120}" height="1" fill="${ink}" fill-opacity="0.14"/>`,
)
y += 30
parts.push(
  text(60, y, 'OS TRINTA ROLOS, NO TAMANHO REAL DO TILE', 11, ink, 0.45, 'start', '600'),
  text(
    W - 60, y,
    'a primeira de cada arma está acesa · o selo pequeno é a condição',
    11, ink, 0.35, 'end',
  ),
)
y += 22

for (const weapon of WEAPONS) {
  const scroll = ARTS.filter((a) => a.weapon === weapon.id)
  if (scroll.length === 0) continue
  parts.push(
    sealText(78, y + 30, weapon.seal, 22, ink, 0.75),
    text(102, y + 20, weapon.name, 13, ink, 0.85, 'start', '600'),
    text(102, y + 36, `${scroll.length} artes`, 10.5, ink, 0.4, 'start'),
  )
  scroll.forEach((art, i) => {
    const x = 220 + i * 186
    const lit = i === 0
    parts.push(
      tile(x, y, art.effect, CONDITION_BY_ID.get(art.condition)!.seal, lit, 4 - Math.floor(i / 2)),
      text(x + 74, y + 20, `${art.seal} ${art.name}`, 12.5, lit ? cinnabar : ink, lit ? 0.95 : 0.85, 'start', '600'),
      text(x + 74, y + 36, art.effect, 10.5, ink, 0.42, 'start'),
      text(x + 74, y + 52, CONDITION_BY_ID.get(art.condition)!.name, 10.5, goldDeep, 0.65, 'start'),
    )
  })
  y += 96
}

y += 10
parts.push(
  `<rect x="60" y="${y}" width="${W - 120}" height="1" fill="${ink}" fill-opacity="0.14"/>`,
)
y += 28
parts.push(
  text(60, y, 'PORQUE NÃO UM PACK DE ÍCONES', 11, ink, 0.45, 'start', '600'),
  text(
    60, y + 20,
    'Um pack (game-icons.net e afins) chega desenhado noutro estilo de linha, tinha de ser redesenhado para casar com a tinta, e não se tinge por estado sem uma segunda cópia de cada.',
    11.5, ink, 0.5, 'start',
  ),
  text(
    60, y + 38,
    'Ícones gerados por IA seriam trinta imagens que têm de concordar umas com as outras, num jogo que não tem um único asset rasterizado. Estes saem do mesmo sweep() das figuras: escalam, tingem-se, e não podem divergir do jogo.',
    11.5, ink, 0.5, 'start',
  ),
)
y += 68

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${y}" viewBox="0 0 ${W} ${y}">` +
  `<rect width="${W}" height="${y}" fill="${paper}"/>` +
  parts.join('') +
  `</svg>`

await writeFile(join(OUT, 'glyphs.svg'), svg)
console.log(`glyphs: docs/glyphs.svg  ${W}×${y}`)
void label
