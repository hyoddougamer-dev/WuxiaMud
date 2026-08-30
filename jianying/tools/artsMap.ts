/**
 * 功法 — the whole system on one page, at the width of a phone.
 *
 *   npx tsx tools/artsMap.ts && npx tsx tools/rasterise.mts docs/artes-mapa.svg 2
 *
 * "Estou completamente confuso com o que é suposto ser e estar estruturado."
 * That is a fair report and the fault is in what I built: the 法 tab shows a
 * LIST — five rows for the weapon in hand — and a list cannot show a system.
 * Nothing anywhere said that there are six scrolls, that each covers the same
 * five conditions, or that the condition is the thing the player controls.
 *
 * So this page leads with the shape rather than the contents:
 *
 *   1. the loop, in three marks — you do a thing, a seal lights, the art fires
 *   2. the five conditions, which are the whole control scheme
 *   3. a 6×5 grid of nothing but icons, where the structure is visible at a
 *      glance: every row is a weapon, every column is a condition, and there
 *      are no holes
 *   4. only then, the thirty in detail
 *
 * Every cell is read from `data/arts.ts` and drawn with the game's own icons,
 * so a page that disagrees with the game is impossible rather than unlikely.
 */
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { palette } from '../src/render/palette'
import { ARTS, CONDITIONS, MAX_ART_LEVEL, EQUIPPED_ARTS } from '../src/data/arts'
import { WEAPONS } from '../src/data/weapons'
import { effectIconSvg } from '../src/render/packIcons'
import { hex } from './sheet'

const OUT = join(fileURLToPath(new URL('..', import.meta.url)), 'docs')

const W = 390
const M = 16
const ink = hex(palette.ink)
const paper = hex(palette.paper)
const cinnabar = hex(palette.cinnabar)
const goldDeep = hex(palette.goldDeep)

const parts: string[] = []
const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

const text = (
  x: number, y: number, s: string, size: number,
  fill = ink, op = 1, anchor: 'start' | 'middle' | 'end' = 'start', weight = 'normal',
): string =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="system-ui, sans-serif" ` +
  `font-size="${size}" font-weight="${weight}" fill="${fill}" fill-opacity="${op}">${esc(s)}</text>`

const seal = (
  x: number, y: number, s: string, size: number, fill = ink, op = 1,
  anchor: 'start' | 'middle' | 'end' = 'middle',
): string =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="serif" font-size="${size}" ` +
  `fill="${fill}" fill-opacity="${op}">${s}</text>`

const icon = (effect: string, x: number, y: number, size: number, op = 1): string =>
  effectIconSvg(effect as never, palette.ink, op, 'x').replace(
    '<svg class="x" ',
    `<svg width="${size}" height="${size}" x="${x - size / 2}" y="${y - size / 2}" `,
  )

const rule = (y: number, op = 0.14): string =>
  `<rect x="${M}" y="${y}" width="${W - M * 2}" height="1" fill="${ink}" fill-opacity="${op}"/>`

const wrap = (body: string, chars: number): string[] => {
  const lines: string[] = []
  let line = ''
  for (const word of body.split(' ')) {
    if (line.length + word.length + 1 > chars) { lines.push(line); line = word }
    else line = line ? `${line} ${word}` : word
  }
  if (line) lines.push(line)
  return lines
}

let y = 0
const para = (body: string, size = 10, op = 0.55, chars = 62, fill = ink): void => {
  for (const line of wrap(body, chars)) {
    parts.push(text(M, y, line, size, fill, op))
    y += size + 4
  }
}

// ===========================================================================
// 1 — the loop
// ===========================================================================
y = 36
parts.push(text(M, y, '功法 — como funciona', 20, ink, 0.92, 'start', '600'))
y += 20
para('Não há botão de skill. O movimento é o botão.', 11, 0.6, 58, cinnabar)
y += 12

// Three marks in a row: what you do, what lights, what happens.
{
  const CW = (W - M * 2) / 3
  const steps: Array<[string, string, string]> = [
    ['1', 'FAZES', 'paras, corres,\nviras, deixas-te\ncercar'],
    ['2', 'ACENDE', 'o selo na barra\nilumina-se'],
    ['3', 'DISPARA', 'a arte age\nenquanto durar'],
  ]
  steps.forEach(([n, head, body], i) => {
    const x = M + i * CW
    parts.push(
      `<rect x="${x}" y="${y}" width="${CW - 8}" height="86" rx="5" fill="${ink}" ` +
        `fill-opacity="0.03" stroke="${ink}" stroke-opacity="0.12"/>`,
      text(x + 10, y + 18, n, 11, cinnabar, 0.5, 'start', '600'),
      text(x + 10, y + 34, head, 10, ink, 0.85, 'start', '600'),
    )
    body.split('\n').forEach((line, k) => {
      parts.push(text(x + 10, y + 50 + k * 12, line, 8.5, ink, 0.5))
    })
    if (i < 2) parts.push(text(x + CW - 6, y + 48, '→', 13, ink, 0.3, 'middle'))
  })
  y += 100
}

para(
  'A arte não é uma coisa que carregas — é uma coisa que PROVOCAS. Isso é a ' +
    'diferença entre um bónus passivo e uma competência.',
  9.5, 0.5, 66,
)
y += 10

// ===========================================================================
// 2 — the five conditions
// ===========================================================================
parts.push(rule(y))
y += 22
parts.push(text(M, y, 'AS CINCO CONDIÇÕES', 10, ink, 0.45, 'start', '600'))
y += 4
for (const cond of CONDITIONS) {
  parts.push(
    seal(M + 12, y + 20, cond.seal, 17, cinnabar, 0.85),
    text(M + 30, y + 15, cond.name, 11, ink, 0.85, 'start', '600'),
    text(M + 30, y + 27, cond.how, 9, ink, 0.45),
  )
  y += 34
}
y += 8

// ===========================================================================
// 3 — the grid: the whole system, icons only
// ===========================================================================
parts.push(rule(y))
y += 22
parts.push(text(M, y, 'AS TRINTA, DE UMA VEZ', 10, ink, 0.45, 'start', '600'))
y += 14
para(
  'Seis armas em linhas, cinco condições em colunas. Cada arma cobre as cinco ' +
    'exatamente uma vez — não há buracos, e é por isso que mudar de arma muda ' +
    'tudo o que fazes sem mudar o que tens de fazer.',
  9.5, 0.5, 66,
)
y += 8

{
  const LEFT = M + 30
  const CELL = (W - M * 2 - 30) / CONDITIONS.length
  // Column heads: the condition seals.
  CONDITIONS.forEach((cond, c) => {
    parts.push(seal(LEFT + c * CELL + CELL / 2, y + 12, cond.seal, 15, cinnabar, 0.8))
  })
  y += 22

  for (const weapon of WEAPONS) {
    parts.push(seal(M + 12, y + 26, weapon.seal, 17, ink, 0.7))
    CONDITIONS.forEach((cond, c) => {
      const art = ARTS.find((a) => a.weapon === weapon.id && a.condition === cond.id)
      const cx = LEFT + c * CELL + CELL / 2
      if (!art) {
        // A hole would be a real defect in the data, so it is drawn as one
        // rather than quietly left blank.
        parts.push(text(cx, y + 26, '—', 12, cinnabar, 0.9, 'middle', '600'))
        return
      }
      parts.push(
        `<rect x="${cx - CELL / 2 + 2}" y="${y + 2}" width="${CELL - 4}" height="40" rx="4" ` +
          `fill="${ink}" fill-opacity="0.025" stroke="${ink}" stroke-opacity="0.09"/>`,
        icon(art.effect, cx, y + 17, 22, 0.85),
        seal(cx, y + 37, art.seal, art.seal.length > 1 ? 8 : 10, ink, 0.5),
      )
    })
    y += 46
  }
  y += 4
}

// ===========================================================================
// 4 — the thirty in detail, weapon by weapon
// ===========================================================================
parts.push(rule(y))
y += 22
parts.push(text(M, y, 'O QUE CADA UMA FAZ', 10, ink, 0.45, 'start', '600'))
y += 14
para(
  `Levas ${EQUIPPED_ARTS} das 5 do rolo da arma que tens na mão. Cada uma tem ` +
    `${MAX_ART_LEVEL} graus.`,
  9.5, 0.5, 66,
)
y += 8

for (const weapon of WEAPONS) {
  // The blurb gets its own line. Right-aligning it beside the name collided
  // with every weapon whose name is longer than "Jian".
  parts.push(
    seal(M + 10, y + 14, weapon.seal, 15, ink, 0.75),
    text(M + 26, y + 13, weapon.name, 12, ink, 0.9, 'start', '600'),
  )
  y += 16
  for (const line of wrap(weapon.blurb ?? '', 62)) {
    parts.push(text(M + 26, y + 9, line, 8.5, ink, 0.42))
    y += 12
  }
  y += 4
  for (const cond of CONDITIONS) {
    const art = ARTS.find((a) => a.weapon === weapon.id && a.condition === cond.id)
    if (!art) continue
    parts.push(
      `<rect x="${M}" y="${y}" width="${W - M * 2}" height="34" rx="4" fill="${ink}" ` +
        `fill-opacity="0.02" stroke="${ink}" stroke-opacity="0.08"/>`,
      seal(M + 16, y + 22, cond.seal, 13, cinnabar, 0.75),
      icon(art.effect, M + 44, y + 17, 20, 0.8),
      text(M + 60, y + 15, `${art.seal} ${art.name}`, 10, ink, 0.88, 'start', '600'),
      text(M + 60, y + 27, art.blurb, 8, ink, 0.45),
      text(W - M - 8, y + 21, art.effect, 8, goldDeep, 0.7, 'end'),
    )
    y += 38
  }
  y += 6
}

// ===========================================================================
// what is not built yet
// ===========================================================================
parts.push(rule(y))
y += 22
parts.push(text(M, y, 'O QUE AINDA NÃO É VERDADE', 10, cinnabar, 0.9, 'start', '600'))
y += 14
para(
  'As 30 agem, e escolhes as quatro na aba 法. Mas vão todas ao grau 1 e não ' +
    'sobem: a corrida ainda cresce pelas 3 cartas sorteadas, por isso a ORDEM em ' +
    'que as puseste ainda não conta. É o passo seguinte.',
  9.5, 0.55, 66,
)
y += 14

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${y}" viewBox="0 0 ${W} ${y}">` +
  `<rect width="${W}" height="${y}" fill="${paper}"/>` +
  parts.join('') +
  `</svg>`

await writeFile(join(OUT, 'artes-mapa.svg'), svg)
console.log(`map:    docs/artes-mapa.svg  ${W}×${Math.round(y)}  (${ARTS.length} arts)`)
