/**
 * 一趟 — what a corrida is, what it gives, and what it costs. Phone width.
 *
 *   npx tsx tools/corridas.mts && npx tsx tools/rasterise.mts docs/corridas.svg 2
 *
 * Three questions were open at once — how runs work, how levelling works, and
 * whether the arts should open up or lock into classes — and they are one
 * question, because a run's LENGTH decides how much of a build the player ever
 * sees. So the page opens with the measurement rather than with the proposal.
 *
 * The bars are simulated when this file runs, by importing the same harness the
 * printed table uses (tools/runLength.mts). Nothing here is a remembered
 * number, which matters because the first thing this page says is unflattering
 * and the temptation to let it go stale would be real.
 */
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { palette } from '../src/render/palette'
import { REGIONS } from '../src/data/regions'
import { WEAPONS } from '../src/data/weapons'
import { ARTS, CONDITIONS, EQUIPPED_ARTS, MAX_ART_LEVEL } from '../src/data/arts'
import { REALMS, LEVELS_PER_REALM } from '../src/meta/realms'
import { BOSS_EVERY } from '../src/data/enemies'
import { INSIGHT_TO_FINISH, PILOTS, TARGET_SECONDS, play, type Row } from './runLength.mts'
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
const para = (body: string, size = 9.5, op = 0.5, chars = 66, fill = ink, x = M): void => {
  for (const line of wrap(body, chars)) {
    parts.push(text(x, y, line, size, fill, op))
    y += size + 4
  }
}

const heading = (s: string): void => {
  parts.push(rule(y))
  y += 22
  parts.push(text(M, y, s, 10, ink, 0.45, 'start', '600'))
  y += 14
}

// ===========================================================================
// 0 — the measurement
// ===========================================================================
const measured = new Map<string, Row[]>()
for (const region of REGIONS) {
  measured.set(region.id, PILOTS.map(([, fly]) => play(region.id, fly)))
}
/** The kinder of the two pilots, since the argument should use the best case. */
const best = (id: string): Row =>
  measured.get(id)!.reduce((a, b) => (a.secs >= b.secs ? a : b))
/**
 * Best 感悟 is a SEPARATE maximum, and it has to be.
 *
 * The pilot that survives longest is the one that kites, and kiting walks away
 * from the qi it just dropped — it lives 227 seconds and gathers five. Quoting
 * the survivor's insight beside the survivor's clock would understate the build
 * by half and make the case here look stronger than it is.
 */
const bestInsight = (id: string): number =>
  Math.max(...measured.get(id)!.map((r) => r.insight))

y = 36
parts.push(text(M, y, '一趟 — a corrida', 20, ink, 0.92, 'start', '600'))
y += 20
para('Primeiro o que MEDI, depois o que proponho.', 11, 0.6, 58, cinnabar)
y += 14

heading('QUANTO DURA UMA CORRIDA, HOJE')
para(
  'Um espadachim a meio do jogo, sem equipamento, seis seeds, dois pilotos ' +
    'automáticos. A barra é o melhor dos dois. O plano prometia 8 a 15 minutos.',
)
y += 6

{
  const LEFT = M + 112
  const RIGHT = W - M - 34
  const span = RIGHT - LEFT
  const FULL = TARGET_SECONDS
  // The target line first, so every bar is read against it rather than against
  // the longest bar — which would make the worst region look like a baseline.
  parts.push(
    `<rect x="${LEFT + span}" y="${y}" width="1.5" height="${REGIONS.length * 26 + 6}" ` +
      `fill="${cinnabar}" fill-opacity="0.55"/>`,
    text(RIGHT + 4, y + 8, '5:00', 8, cinnabar, 0.8),
    text(RIGHT + 4, y + 18, 'alvo', 8, cinnabar, 0.5),
  )
  y += 6
  for (const region of REGIONS) {
    const r = best(region.id)
    const w = Math.max(2, (Math.min(r.secs, FULL) / FULL) * span)
    parts.push(
      seal(M + 16, y + 13, region.seal, 12, ink, 0.7),
      text(M + 32, y + 13, region.name.replace('The ', ''), 8.5, ink, 0.5),
      `<rect x="${LEFT}" y="${y + 3}" width="${span}" height="13" rx="2" fill="${ink}" ` +
        `fill-opacity="0.05"/>`,
      `<rect x="${LEFT}" y="${y + 3}" width="${w.toFixed(1)}" height="13" rx="2" ` +
        `fill="${ink}" fill-opacity="0.55"/>`,
      text(LEFT + w + 5, y + 13, `${r.secs.toFixed(0)}s`, 8.5, ink, 0.7, 'start', '600'),
    )
    y += 26
  }
  y += 8
}

para(
  `Quatro das cinco regiões acabam ANTES do seu próprio chefe, que chega aos ` +
    `${BOSS_EVERY}s. E nem a melhor corrida do jogo chega a fazer uma build: ` +
    `${bestInsight(REGIONS[0]!.id).toFixed(0)} 感悟 no melhor caso, quando ` +
    `${EQUIPPED_ARTS} artes precisam de ${INSIGHT_TO_FINISH} para ficarem feitas. O jogador ` +
    `nunca chega a ver aquilo que escolheu na aba 法.`,
  9.5, 0.62, 66, cinnabar,
)
y += 6
para(
  'Isto não é um acerto de dificuldade. É a razão por que a corrida não tem ' +
    'forma nenhuma: não tem princípio, meio nem fim — tem um contador que pára.',
)
y += 10

// ===========================================================================
// 1 — the shape proposed
// ===========================================================================
heading('A FORMA QUE PROPONHO — CINCO MINUTOS, COM PORTÃO')

const ACTS: Array<[string, string, string, string]> = [
  ['起', '0:00', 'Sair', 'Poucos. A build toma forma: 4 感悟.'],
  ['行', '1:30', 'A estrada', 'O roster enche. A regra da região começa a morder.'],
  ['险', '3:30', 'O aperto', 'Densidade no máximo. A build aguenta ou não.'],
  ['关', '4:30', 'O portão', 'O chefe da região. Uma vez, não de 115 em 115s.'],
  ['深', '5:00', 'O fundo', 'Opcional. Ficas ou sais com tudo. Cada minuto multiplica.'],
]
{
  const RAIL = M + 22
  parts.push(
    `<rect x="${RAIL}" y="${y + 6}" width="1.5" height="${ACTS.length * 42 - 18}" ` +
      `fill="${ink}" fill-opacity="0.15"/>`,
  )
  ACTS.forEach(([s, at, name, what], i) => {
    const gate = i === 3
    parts.push(
      `<circle cx="${RAIL + 0.75}" cy="${y + 14}" r="${gate ? 6 : 4}" ` +
        `fill="${gate ? cinnabar : ink}" fill-opacity="${gate ? 0.9 : 0.3}"/>`,
      seal(M + 8, y + 18, s, 15, gate ? cinnabar : ink, gate ? 0.9 : 0.75, 'middle'),
      text(RAIL + 16, y + 11, name, 11, ink, 0.85, 'start', '600'),
      text(RAIL + 16, y + 24, what, 8.5, ink, 0.45),
      text(W - M, y + 11, at, 9.5, goldDeep, 0.85, 'end', '600'),
    )
    y += 42
  })
  y += 2
}

para(
  'O portão é a peça que falta. Um survivors-like que só acaba em morte nunca ' +
    'fecha nada; um que acaba num relógio perde o "até onde consigo ir". O 关 dá ' +
    'os dois: matas o chefe e a corrida CONTA como feita, e depois decides se ' +
    'sais com o prémio no bolso ou se continuas a ganhar mais arriscando o extra.',
)
y += 6
para(
  `Cinco minutos e não quinze, porque isto joga-se com uma mão à espera do ` +
    `autocarro. As horas ficam no que sobrevive à corrida, não dentro dela.`,
  9.5, 0.5, 66, cinnabar,
)
y += 10

// ===========================================================================
// 2 — what resets, what survives
// ===========================================================================
heading('O QUE MORRE CONTIGO E O QUE NÃO')
{
  const CW = (W - M * 2 - 10) / 2
  const cols: Array<[string, string, string[]]> = [
    ['PERDE-SE', cinnabar, ['感悟 e os graus das artes', 'a vida da corrida', 'o enxame']],
    ['FICA', goldDeep, ['境界 nível, realm, pontos', 'tudo o que caiu', '秘笈 aprendidos', 'profundidade aberta']],
  ]
  const h = 22 + 4 * 15
  cols.forEach(([head, colour, rows], i) => {
    const x = M + i * (CW + 10)
    parts.push(
      `<rect x="${x}" y="${y}" width="${CW}" height="${h}" rx="4" fill="${ink}" ` +
        `fill-opacity="0.03" stroke="${ink}" stroke-opacity="0.1"/>`,
      text(x + 10, y + 15, head, 9, colour, 0.9, 'start', '600'),
    )
    rows.forEach((r, k) => parts.push(text(x + 10, y + 32 + k * 15, r, 8.5, ink, 0.55)))
  })
  y += h + 10
}
para(
  'Morrer nunca tira nada. Essa é a metade MMORPG do desenho e não muda: a ' +
    'corrida é o episódio, a personagem é a série.',
)
y += 10

// ===========================================================================
// 3 — the four ladders
// ===========================================================================
heading('AS QUATRO ESCADAS — E PORQUE SÃO QUATRO')
para(
  'A confusão de "não percebo o que é isto" vem daqui: havia dois sistemas a ' +
    'chamar-se nível. Estes quatro não se tocam, e cada um tem uma fonte só sua.',
)
y += 6

const LADDERS: Array<[string, string, string, string]> = [
  ['感悟', 'Insight', 'dentro de UMA corrida', `sobe as ${EQUIPPED_ARTS} artes que levaste, grau 1→${MAX_ART_LEVEL}`],
  ['境界', 'Cultivo', 'para sempre', `${REALMS.length} realms × ${LEVELS_PER_REALM} níveis; pontos, e uma região nova por realm`],
  ['装备', 'Equipamento', 'para sempre', 'o que cai, de rank 1 a 5. Números e a figura.'],
  ['秘笈', 'Manuais', 'para sempre', 'QUAIS artes existem para levares. Caem dos chefes.'],
]
for (const [s, name, scope, what] of LADDERS) {
  parts.push(
    `<rect x="${M}" y="${y}" width="${W - M * 2}" height="40" rx="4" fill="${ink}" ` +
      `fill-opacity="0.025" stroke="${ink}" stroke-opacity="0.08"/>`,
    seal(M + 24, y + 25, s, 15, cinnabar, 0.8),
    text(M + 48, y + 17, name, 11, ink, 0.88, 'start', '600'),
    text(M + 48, y + 31, what, 8.5, ink, 0.45),
    text(W - M - 8, y + 17, scope, 8, goldDeep, 0.75, 'end'),
  )
  y += 44
}
y += 8

// ===========================================================================
// 4 — the arts: freedom, not classes
// ===========================================================================
heading('AS ARTES — MAIS LIBERDADE, NÃO CLASSES TRANCADAS')
para(
  'A arma já É a classe. Trancar também as artes dentro dela deixava o jogo ' +
    'com seis builds no total. E a falta de variedade é medível, não é uma ' +
    'impressão:',
)
y += 6

{
  const perWeapon = ARTS.length / WEAPONS.length
  const choose = (n: number, k: number): number => {
    let r = 1
    for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1)
    return Math.round(r)
  }
  const orders = (k: number): number => (k <= 1 ? 1 : k * orders(k - 1))
  const now = choose(perWeapon, EQUIPPED_ARTS)
  const then = choose(perWeapon * 2, EQUIPPED_ARTS)
  const rows: Array<[string, string, string]> = [
    [
      'HOJE',
      `${perWeapon} artes no rolo, levas ${EQUIPPED_ARTS}`,
      `${now} escolhas — só decides qual DEIXAS de fora`,
    ],
    [
      'PROPOSTA',
      `${perWeapon * 2} no rolo (duas por condição), levas ${EQUIPPED_ARTS}`,
      `${then} escolhas × ${orders(EQUIPPED_ARTS)} ordens = ${then * orders(EQUIPPED_ARTS)}`,
    ],
  ]
  rows.forEach(([tag, what, count], i) => {
    const on = i === 1
    parts.push(
      `<rect x="${M}" y="${y}" width="${W - M * 2}" height="52" rx="4" ` +
        `fill="${on ? cinnabar : ink}" fill-opacity="${on ? 0.05 : 0.025}" ` +
        `stroke="${on ? cinnabar : ink}" stroke-opacity="${on ? 0.35 : 0.08}"/>`,
      text(M + 10, y + 15, tag, 8.5, on ? cinnabar : ink, on ? 0.9 : 0.4, 'start', '600'),
      text(M + 10, y + 29, what, 9.5, ink, 0.7),
      text(M + 10, y + 41, count, 8.5, goldDeep, 0.9),
    )
    y += 58
  })
  y += 2
}

para(
  `Duas artes por condição, e não dez soltas: a grelha das ${CONDITIONS.length} ` +
    `condições continua sem buracos, e ganhas a escolha que hoje não existe — ` +
    `podes pôr AS DUAS na mesma condição e ser um especialista que planta os pés, ` +
    `ou espalhar por quatro e ser um oportunista. Isso é uma maneira de jogar, ` +
    `não um número maior.`,
)
y += 6
para(
  'E a ordem passa a contar, porque os 感悟 sobem as artes pela ordem em que as ' +
    'puseste: a primeira chega ao grau 5, a quarta pode nunca sair do 1. Levar ' +
    'quatro passa a ter um custo em vez de ser de graça.',
)
y += 6
para(
  'Os 秘笈 são o travão. Começas a conhecer as cinco de hoje; as outras cinco ' +
    'caem dos chefes da região que já dá aquela arma — o pântano ensina lança, o ' +
    'mercado ensina leque. A variedade CHEGA, em vez de ser despejada ao minuto um.',
  9.5, 0.5, 66, cinnabar,
)
y += 10

// ===========================================================================
// 5 — what this costs, honestly
// ===========================================================================
heading('O QUE ISTO CUSTA, POR ORDEM')
const STEPS: Array<[string, string]> = [
  ['1', 'A rampa: chegar aos 5 minutos e ao portão. É onde está o problema medido.'],
  ['2', 'Cartas fora, 感悟 sobe as artes. O código já existe e está testado, não é chamado.'],
  ['3', `As ${ARTS.length} passam a ${ARTS.length * 2}: cinco artes novas por arma. Dados, mais 秘笈 a cair.`],
  ['4', 'A UI de combate, quando escolheres entre A, B e C.'],
]
for (const [n, what] of STEPS) {
  parts.push(text(M + 4, y + 10, n, 11, cinnabar, 0.6, 'start', '600'))
  for (const line of wrap(what, 60)) {
    parts.push(text(M + 20, y + 10, line, 9.5, ink, 0.55))
    y += 13
  }
  y += 8
}
y += 12

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${y}" viewBox="0 0 ${W} ${y}">` +
  `<rect width="${W}" height="${y}" fill="${paper}"/>` +
  parts.join('') +
  `</svg>`

await writeFile(join(OUT, 'corridas.svg'), svg)
console.log(`runs:   docs/corridas.svg  ${W}×${Math.round(y)}`)
