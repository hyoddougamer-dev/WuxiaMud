/**
 * The free pack, next to the ones I drew, at the size they are read.
 *
 *   npx tsx tools/pack.ts && npx tsx tools/rasterise.mts docs/pack.svg 2
 *
 * "Which icons?" is not a question anyone should answer from an opinion, mine
 * included. So this sheet puts the two candidates side by side for all sixteen
 * effects, in this game's palette, at tile size — and the choice becomes a
 * thing you look at rather than a thing you are told.
 *
 * THE PACK IS game-icons.net, and it turns out to be reachable after all. Every
 * icon host is blocked from this container (game-icons.net, kenney.nl and
 * opengameart.org all answer 000, and so does every image-generation API), but
 * npm is not, and the whole set ships as `@iconify-json/game-icons` — 4134
 * icons as SVG paths, CC BY 3.0. That matters more than convenience: it means
 * the pack is a build dependency with a version number rather than a folder of
 * files somebody downloaded once, and it works offline, in CI, forever.
 *
 * It also fits far better than I first said. These are single-colour
 * silhouettes on a 512 grid — the same rendering model as everything else in
 * this game, so they tint per state and scale to any size, and my earlier
 * objection was about a raster pack that this is not.
 *
 * What the sheet is really asking you to compare:
 *   - the pack draws the THING (a sword, a shield, a heart)
 *   - mine draw the EFFECT (a line through two rings, a wall and what flees it)
 * Both are legible. They are different claims about what an icon is for.
 */
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { palette } from '../src/render/palette'
import { glyphSvg } from '../src/render/artGlyph'
import { type EffectKind } from '../src/data/arts'
import { PACK_ICON, PACK_SLOT_ICON, PACK_CREDIT } from '../src/render/packIcons'
import { W, hex } from './sheet'
import iconSet from '@iconify-json/game-icons/icons.json' with { type: 'json' }

const OUT = join(fileURLToPath(new URL('..', import.meta.url)), 'docs')

const ink = hex(palette.ink)
const paper = hex(palette.paper)
const cinnabar = hex(palette.cinnabar)
const goldDeep = hex(palette.goldDeep)

interface IconEntry {
  body: string
  left?: number
  top?: number
  width?: number
  height?: number
}
const SET = iconSet as unknown as {
  icons: Record<string, IconEntry>
  width: number
  height: number
}

/**
 * One pack icon as a placed `<svg>`.
 *
 * Iconify stores the body with a per-set viewBox and lets an individual icon
 * override any of the four numbers, so the override has to be honoured or a
 * handful of icons come out cropped. `currentColor` in the body is why a single
 * `color` on the wrapper tints the whole thing.
 */
function packIcon(name: string, x: number, y: number, size: number, colour: string, op = 1): string {
  const icon = SET.icons[name]
  if (!icon) return ''
  const vb = [
    icon.left ?? 0,
    icon.top ?? 0,
    icon.width ?? SET.width,
    icon.height ?? SET.height,
  ].join(' ')
  return (
    `<svg x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}" ` +
    `viewBox="${vb}" color="${colour}" opacity="${op}">${icon.body}</svg>`
  )
}

/**
 * What each effect means, in the player's terms — the caption under the icon.
 * The icon NAMES live in `src/render/packIcons.ts`, so this sheet and the game
 * cannot disagree about which icon an effect gets.
 */
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

const EFFECTS: EffectKind[] = [
  'damage', 'rate', 'range', 'arc', 'speed', 'magnet', 'orbit', 'bolt', 'nova', 'maxHp',
  'pierce', 'crit', 'echo', 'push', 'guard', 'heal',
]

const PICKS: Array<[EffectKind, string, string]> = EFFECTS.map((e) => [e, PACK_ICON[e], MEANS[e]])

const parts: string[] = []
const text = (
  x: number, y: number, s: string, size: number,
  fill = ink, op = 1, anchor: 'start' | 'middle' | 'end' = 'middle', weight = 'normal',
): string =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="system-ui, sans-serif" ` +
  `font-size="${size}" font-weight="${weight}" fill="${fill}" fill-opacity="${op}">${s}</text>`

const mine = (effect: EffectKind, x: number, y: number, size: number, lit: boolean, dim = false) =>
  glyphSvg(effect, {
    ink: palette.ink,
    self: lit ? palette.cinnabar : palette.ink,
    opacity: dim ? 0.34 : 1,
  }).replace(
    '<svg class="art-glyph" ',
    `<svg width="${size}" height="${size}" x="${x - size / 2}" y="${y - size / 2}" `,
  )

/** An empty strip tile, so both candidates are judged in the same frame. */
const tileBox = (x: number, y: number, s: number, lit: boolean) =>
  `<rect x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" rx="5" ` +
  `fill="${lit ? cinnabar : ink}" fill-opacity="${lit ? 0.1 : 0.04}" ` +
  `stroke="${lit ? cinnabar : ink}" stroke-opacity="${lit ? 0.9 : 0.14}"/>`

// --- header ----------------------------------------------------------------
let y = 52
parts.push(
  text(W / 2, y, 'O pack gratuito, ao lado dos meus', 26, ink, 0.9, 'middle', '600'),
  text(
    W / 2, y + 26,
    `game-icons.net · 4134 ícones · instalado por npm, sem descarregar nada — funciona offline e no CI. · ${PACK_CREDIT}`,
    12.5, ink, 0.5,
  ),
  text(
    W / 2, y + 44,
    'À esquerda o pack, à direita o meu. Mesma paleta, mesmo tile, mesmo tamanho a que são lidos.',
    12, cinnabar, 0.8,
  ),
)
y += 84

// --- column headings -------------------------------------------------------
const COLS = 2
const CW = (W - 100) / COLS
parts.push(
  text(60, y, 'EFEITO', 10, ink, 0.4, 'start', '600'),
  text(60 + CW / 2, y, 'PACK — desenha a COISA', 10, ink, 0.45, 'middle', '600'),
  text(60 + CW / 2 + CW * 0.42, y, 'MEU — desenha o EFEITO', 10, cinnabar, 0.8, 'middle', '600'),
)
y += 16

PICKS.forEach(([effect, name, means], i) => {
  const col = i % 2
  const row = Math.floor(i / 2)
  const x = 60 + col * (CW + 20)
  const ty = y + row * 96
  const lit = row === 0

  parts.push(
    `<rect x="${x}" y="${ty}" width="${CW - 20}" height="86" rx="6" fill="${ink}" ` +
      `fill-opacity="0.022" stroke="${ink}" stroke-opacity="0.1"/>`,
    text(x + 16, ty + 32, effect, 13, ink, 0.85, 'start', '600'),
    text(x + 16, ty + 48, means, 10.5, ink, 0.42, 'start'),
    text(x + 16, ty + 66, name, 9.5, goldDeep, 0.75, 'start'),
  )

  // The pack, big and on a tile.
  const px = x + CW * 0.42
  parts.push(
    packIcon(name, px, ty + 43, 62, ink, 0.88),
    tileBox(px + 66, ty + 43, 52, lit),
    packIcon(name, px + 66, ty + 43, 34, lit ? ink : ink, lit ? 0.9 : 0.34),
  )

  // Mine, same treatment.
  const mx = x + CW * 0.72
  parts.push(
    mine(effect, mx, ty + 43, 62, false),
    tileBox(mx + 66, ty + 43, 52, lit),
    mine(effect, mx + 66, ty + 43, 34, lit, !lit),
  )
})
y += Math.ceil(PICKS.length / 2) * 96 + 14

// --- the slots the pack also covers ----------------------------------------
parts.push(`<rect x="60" y="${y}" width="${W - 120}" height="1" fill="${ink}" fill-opacity="0.14"/>`)
y += 28
parts.push(
  text(60, y, 'E OS QUATRO SLOTS NOVOS — O PACK JÁ OS TEM', 11, ink, 0.45, 'start', '600'),
  text(
    W - 60, y,
    'ícones para a grelha do paperdoll, onde hoje há só um selo',
    10.5, ink, 0.35, 'end',
  ),
)
y += 20
const SLOTS: Array<[string, string]> = [
  ['带 Cinto', PACK_SLOT_ICON.belt!],
  ['腕 Braçadeiras', PACK_SLOT_ICON.bracers!],
  ['靴 Botas', PACK_SLOT_ICON.boots!],
  ['佩 Pendente', PACK_SLOT_ICON.charm!],
  ['首 Cabeça', PACK_SLOT_ICON.head!],
  ['肩 Ombros', PACK_SLOT_ICON.shoulders!],
  ['袍 Túnica', PACK_SLOT_ICON.robe!],
  ['器 Arma', PACK_SLOT_ICON.weapon!],
]
SLOTS.forEach(([label, name], i) => {
  const x = 60 + i * ((W - 120) / SLOTS.length)
  const w = (W - 120) / SLOTS.length
  parts.push(
    `<rect x="${x}" y="${y}" width="${w - 12}" height="94" rx="6" fill="${ink}" ` +
      `fill-opacity="0.022" stroke="${ink}" stroke-opacity="0.1"/>`,
    SET.icons[name] ? packIcon(name, x + (w - 12) / 2, y + 40, 50, ink, 0.85) : '',
    text(x + (w - 12) / 2, y + 76, label, 10.5, ink, 0.8),
    text(x + (w - 12) / 2, y + 89, SET.icons[name] ? name : `— sem "${name}"`, 8.5, goldDeep, 0.7),
  )
})
y += 118

// --- the decision ----------------------------------------------------------
parts.push(`<rect x="60" y="${y}" width="${W - 120}" height="1" fill="${ink}" fill-opacity="0.14"/>`)
y += 28
const NOTES: Array<[string, string]> = [
  [
    'O que o pack ganha',
    'Quatro mil ícones prontos, incluindo os quatro slots novos e tudo o que este jogo venha a precisar. ' +
      'Instala-se por npm com versão fixa, funciona offline e no CI, e é CC BY 3.0 — uma linha de créditos e está pago.',
  ],
  [
    'O que o pack perde',
    'Desenha a COISA, não o efeito. "broadsword" é uma espada bonita que não diz se atravessa, se repete ou se ' +
      'empurra — e as trinta artes distinguem-se precisamente por isso. Há um efeito que o pack não serve: "range" ' +
      'é extensão, e tudo o que ali significa longe significa uma ARMA de longe. "bow-arrow" é o mais fraco dos ' +
      'dezasseis, e é honesto dizê-lo. O traço é de xilogravura, mais duro que a tinta molhada das figuras.',
  ],
  [
    'O que os meus ganham',
    'Diagramam o efeito: uma linha a espetar dois anéis é atravessar. Saem do mesmo pincel das figuras, ' +
      'por isso não podem divergir do jogo, e cada estado (aceso, apagado, por grau) é o mesmo ficheiro tingido.',
  ],
  [
    'O que os meus perdem',
    'São dezasseis e só dezasseis. Um efeito novo é código novo, não uma linha numa lista — ' +
      'e nunca terão a riqueza de detalhe que um ícone desenhado à mão tem em grande.',
  ],
]
/**
 * Word wrap at an approximate character width.
 *
 * Splitting on sentences was tried first and the long ones ran off the sheet
 * and over the next column — a caption nobody can read is not a caption.
 */
const wrap = (body: string, chars: number): string[] => {
  const lines: string[] = []
  let line = ''
  for (const word of body.split(' ')) {
    if (line.length + word.length + 1 > chars) {
      lines.push(line)
      line = word
    } else {
      line = line ? `${line} ${word}` : word
    }
  }
  if (line) lines.push(line)
  return lines
}

const NOTE_W = (W - 130) / 2
NOTES.forEach(([head, body], i) => {
  const x = 60 + (i % 2) * (NOTE_W + 10)
  const ty = y + Math.floor(i / 2) * 96
  parts.push(text(x, ty, head, 11.5, i < 2 ? goldDeep : cinnabar, 0.9, 'start', '600'))
  wrap(body, 78).forEach((line, n) => {
    parts.push(text(x, ty + 18 + n * 14, line, 10.5, ink, 0.5, 'start'))
  })
})
y += 200

wrap(
  'Nada aqui obriga a escolher um só. O pack pode vestir a grelha do equipamento — onde "desenha a coisa" é ' +
    'exatamente o que se quer, e onde hoje há apenas um selo — e as artes ficarem com os diagramas, onde o que ' +
    'importa é o efeito e não o objeto.',
  150,
).forEach((line, n) => {
  parts.push(text(60, y + n * 17, line, 11.5, cinnabar, 0.85, 'start'))
})
y += 56

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${y}" viewBox="0 0 ${W} ${y}">` +
  `<rect width="${W}" height="${y}" fill="${paper}"/>` +
  parts.join('') +
  `</svg>`

await writeFile(join(OUT, 'pack.svg'), svg)
console.log(`pack:   docs/pack.svg  ${W}×${y}`)
const missing = [...PICKS.map((p) => p[1]), ...SLOTS.map((s) => s[1])].filter((n) => !SET.icons[n])
console.log(missing.length ? `MISSING: ${missing.join(', ')}` : 'every picked icon exists')
