/**
 * What the game's data actually contains, and what of it actually runs.
 *
 *   npx tsx tools/estado.ts && npx tsx tools/rasterise.mts docs/estado.svg 2
 *
 * This sheet exists because of a fair question I caused: "random skill icons,
 * não existem skills definidos?" The arts ARE defined — thirty of them, one per
 * weapon per condition — but the simulation never reads their effect, so the
 * strip on the HUD lights up and nothing happens. Putting icons on an inert
 * system made it look live, and that is the whole confusion.
 *
 * So the page draws the distinction the code makes and the screen does not:
 * what exists as DATA, and what of it the simulation actually ACTS on. Every
 * number is counted from the real modules at render time, so this sheet cannot
 * flatter the project — if an art is added, it appears here; if the effects
 * land, the "inert" column has to be edited or it becomes a visible lie.
 */
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { palette } from '../src/render/palette'
import { ITEMS, MAX_RANK, type Slot } from '../src/data/items'
import { ARTS, CONDITIONS, MAX_ART_LEVEL, EQUIPPED_ARTS, NEW_EFFECTS } from '../src/data/arts'
import { artActs, LIVE_EFFECTS } from '../src/sim/arts'
import { WEAPONS } from '../src/data/weapons'
import { ATTRIBUTES } from '../src/meta/character'
import { REGIONS } from '../src/data/regions'
import { ENEMY_KINDS } from '../src/data/enemies'
import { PACK_SLOT_ICON } from '../src/render/packIcons'
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

const rule = (y: number, op = 0.14): string =>
  `<rect x="${M}" y="${y}" width="${W - M * 2}" height="1" fill="${ink}" fill-opacity="${op}"/>`

/** Wraps at an approximate character count — no measuring available here. */
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

const para = (body: string, size = 10, fill = ink, op = 0.55, chars = 60): void => {
  for (const line of wrap(body, chars)) {
    parts.push(text(M, y, line, size, fill, op))
    y += size + 4
  }
}

/**
 * One row of the ledger.
 *
 * `acts` is the only column that matters and the only one a reader is likely to
 * get wrong from looking at the game, so it is the one in colour.
 */
const row = (name: string, count: string, acts: boolean, note: string): void => {
  parts.push(
    `<rect x="${M}" y="${y}" width="${W - M * 2}" height="46" rx="4" fill="${ink}" ` +
      `fill-opacity="0.025" stroke="${acts ? ink : cinnabar}" ` +
      `stroke-opacity="${acts ? 0.16 : 0.4}"/>`,
    text(M + 10, y + 18, name, 11.5, ink, 0.9, 'start', '600'),
    text(M + 10, y + 33, note, 9, ink, 0.45),
    text(W - M - 10, y + 18, count, 11.5, ink, 0.75, 'end', '600'),
    text(W - M - 10, y + 33, acts ? 'age no jogo' : 'INERTE', 9,
      acts ? goldDeep : cinnabar, acts ? 0.85 : 0.95, 'end', '600'),
  )
  y += 54
}

// --- header ----------------------------------------------------------------
y = 34
parts.push(text(M, y, 'O que existe, e o que age', 19, ink, 0.92, 'start', '600'))
y += 20
para(
  'Contado a partir dos módulos reais quando esta folha é gerada. Se um número ' +
    'aqui estiver errado, é o código que mudou.',
  9.5, ink, 0.45, 66,
)
y += 8

// --- what acts -------------------------------------------------------------
parts.push(text(M, y, 'A CORRIDA — TUDO ISTO AGE', 10, goldDeep, 0.9, 'start', '600'))
y += 14

const bySlot = ITEMS.reduce<Record<string, number>>((acc, i) => {
  acc[i.slot] = (acc[i.slot] ?? 0) + 1
  return acc
}, {})
const slots: Slot[] = ['weapon', 'head', 'shoulders', 'robe']

row(
  'Itens',
  `${ITEMS.length}`,
  true,
  `${slots.map((s) => `${s} ${bySlot[s] ?? 0}`).join(' · ')}`,
)
row(
  'Linhas de stat',
  `${ITEMS.filter((i) => i.stat).length}`,
  true,
  `um atributo cada · graus 0–${MAX_RANK}, +30% por grau`,
)
row('Atributos', `${ATTRIBUTES.length}`, true, ATTRIBUTES.map((a) => a.name).join(' · '))
row('Armas', `${WEAPONS.length}`, true, 'cada uma muda como o golpe varre')
row('Inimigos', `${ENEMY_KINDS.length}`, true, 'com os comportamentos por região')
row('Regiões', `${REGIONS.length}`, true, 'cada uma com a sua regra')

y += 4
parts.push(rule(y))
y += 22

// --- half acting -----------------------------------------------------------
const acting = ARTS.filter(artActs).length
const waiting = ARTS.length - acting
parts.push(
  text(
    M, y,
    waiting === 0 ? 'AS ARTES — TODAS AGEM' : 'AS ARTES — PARTE AGE',
    10, waiting === 0 ? goldDeep : cinnabar, 0.95, 'start', '600',
  ),
)
y += 14
para(
  waiting === 0
    ? `As ${ARTS.length} mudam os números quando a condição se cumpre. O que falta ` +
      'já não são efeitos — é escolheres quais levas, e elas subirem de grau.'
    : `${acting} das ${ARTS.length} mudam os números. As outras esperam por efeitos ` +
      'que a simulação ainda não tem.',
  9.5, ink, 0.5, 62,
)
y += 6

row('Artes que agem', `${acting}`, acting === ARTS.length,
  `de ${ARTS.length} · ${LIVE_EFFECTS.length} efeitos ligados`)
if (waiting > 0) {
  row('Artes à espera', `${waiting}`, false, `precisam de: ${NEW_EFFECTS.join(', ')}`)
}
row('Condições', `${CONDITIONS.length}`, true,
  'a barra acende, e acender já significa alguma coisa')
row('Escolher as 4', `${EQUIPPED_ARTS}`, true,
  'aba 法 no hub · guardado por arma')
row('Graus 感悟', '1', false,
  `todas ao grau 1 de ${MAX_ART_LEVEL} · a corrida ainda cresce por cartas`)
row('秘笈 manuais que caem', '0', false, 'aprender uma arte ainda não existe')

y += 4
parts.push(rule(y))
y += 22

// --- the slots -------------------------------------------------------------
parts.push(text(M, y, 'OS SLOTS DE EQUIPAMENTO', 10, ink, 0.5, 'start', '600'))
y += 16

const SLOT_ROWS: Array<[string, string, boolean]> = [
  ['器 Arma', 'weapon', true],
  ['首 Cabeça', 'head', true],
  ['肩 Ombros', 'shoulders', true],
  ['袍 Túnica', 'robe', true],
  ['带 Cinto', 'belt', false],
  ['腕 Braçadeiras', 'bracers', false],
  ['靴 Botas', 'boots', false],
  ['佩 Pendente', 'charm', false],
]
const CW = (W - M * 2) / 4
SLOT_ROWS.forEach(([label, key, exists], i) => {
  const x = M + (i % 4) * CW
  const ty = y + Math.floor(i / 4) * 62
  parts.push(
    `<rect x="${x}" y="${ty}" width="${CW - 6}" height="54" rx="4" fill="${ink}" ` +
      `fill-opacity="${exists ? 0.03 : 0}" stroke="${exists ? ink : cinnabar}" ` +
      `stroke-opacity="${exists ? 0.16 : 0.35}"/>`,
    text(x + (CW - 6) / 2, ty + 20, label, 9.5, ink, exists ? 0.85 : 0.45, 'middle', '600'),
    text(x + (CW - 6) / 2, ty + 34, exists ? `${bySlot[key] ?? 0} itens` : 'não existe',
      8.5, exists ? goldDeep : cinnabar, exists ? 0.85 : 0.8, 'middle'),
    text(x + (CW - 6) / 2, ty + 46, PACK_SLOT_ICON[key] ?? '', 7, ink, 0.3, 'middle'),
  )
})
y += 62 * 2 + 6

parts.push(rule(y))
y += 22

// --- the recommendation ----------------------------------------------------
parts.push(text(M, y, 'ENTÃO, CRESCER A BASE DE DADOS?', 10, ink, 0.5, 'start', '600'))
y += 16
parts.push(
  text(M, y, 'Ainda não. Falta a build, não o conteúdo.', 12, cinnabar, 0.95, 'start', '600'),
)
y += 18
para(
  'Já escolhes as quatro que levas, na aba 法. Falta subirem de grau: vão todas ' +
    'ao grau 1 e a corrida continua a crescer por cartas sorteadas, por isso a ' +
    'ordem em que as puseste ainda não conta. Mais linhas na tabela não mudam isso.',
  10, ink, 0.55, 58,
)
y += 8

const STEPS: Array<[string, string, string]> = [
  ['✓', 'Efeitos das artes', `${LIVE_EFFECTS.length} ligados, ${acting} de ${ARTS.length} artes vivas`],
  ['✓', 'Os 6 efeitos novos', `${NEW_EFFECTS.join(', ')} — feitos`],
  ['✓', 'Aba 法 no hub', 'escolher as quatro que levas, por arma'],
  ['4', 'Afinar os passos', 'as artes ainda só empatam com as cartas; têm de as bater'],
  ['5', 'As cartas saem, 感悟 sobe as artes', 'só depois do 4 — a ordem passa a contar'],

  ['6', '秘笈 caem e ensinam', 'as artes tornam-se dropáveis'],
  ['7', 'Os 4 slots novos', 'guarda-roupa primeiro; itens depois'],
]
for (const [n, name, note] of STEPS) {
  parts.push(
    text(M + 4, y + 11, n, 12, ink, 0.25, 'start', '600'),
    text(M + 20, y + 11, name, 11, ink, 0.88, 'start', '600'),
  )
  y += 15
  for (const line of wrap(note, 54)) {
    parts.push(text(M + 20, y + 10, line, 9, ink, 0.45))
    y += 13
  }
  y += 6
}

y += 10
const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${y}" viewBox="0 0 ${W} ${y}">` +
  `<rect width="${W}" height="${y}" fill="${paper}"/>` +
  parts.join('') +
  `</svg>`

await writeFile(join(OUT, 'estado.svg'), svg)
console.log(`estado: docs/estado.svg  ${W}×${y}`)
