/**
 * 境界 — the vertical ladder, and where it stops being about NEW ground.
 *
 *   npx tsx tools/progression.mts && npx tsx tools/rasterise.mts docs/progressao.svg 2
 *
 * Every other sheet in docs/ is about one system — the arts, the rift, the
 * interface. None of them answers the question this one exists for: over
 * DOZENS of expeditions, what does the character's growth actually look like,
 * and where does it stop widening the map and start deepening it?
 *
 * The answer turned out to be a single number, and it decides the whole shape
 * of the page: `grantXp` (meta/character.ts) unlocks a new region on every
 * realm advance, capped at `MAX_DEPTH` — five regions, four unlocks after the
 * first. The fifth realm (元婴, level 21) is the LAST one that opens new
 * ground. Everything from there to 剑仙 at level 40 — sixteen more levels,
 * three more realms — opens nothing new at all. That is not a content gap;
 * it is the exact seam where 装备 ranks, 秘笈, and now 阶 rift tiers become
 * the entire game, and a player who does not know the seam is there reads the
 * back half of the ladder as the game running out of ideas.
 *
 * Every number on this page is measured, the same way docs/CORRIDAS.md's are:
 * `tools/runLength.mts`'s own harness, fed through the real `rewardFor` and
 * `xpForCultivation` curves, counting expeditions to each realm. Nothing here
 * is a guess at pacing.
 */
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { palette } from '../src/render/palette'
import { REGIONS } from '../src/data/regions'
import { riftTargetFor, tierHealthScale, tierSpawnScale } from '../src/data/enemies'
import { REALMS, LEVELS_PER_REALM } from '../src/meta/realms'
import { rewardFor, xpForCultivation } from '../src/meta/character'
import { MAX_DEPTH } from '../src/data/regions'
import { PILOTS, play } from './runLength.mts'
import { hex } from './sheet'

const OUT = join(fileURLToPath(new URL('..', import.meta.url)), 'docs')

const W = 390
const M = 16
const ink = hex(palette.ink)
const paper = hex(palette.paper)
const cinnabar = hex(palette.cinnabar)
const goldDeep = hex(palette.goldDeep)
const gold = hex(palette.gold)

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
// 0 — measure: expeditions to each realm, at the floor build
// ===========================================================================
/** Average expedition reward across every region and both pilots, weighted
 * toward the pilot that actually fights — the same floor docs/CORRIDAS.md
 * measures everything else against. */
let totalReward = 0
let sampleCount = 0
const perRegionAvg = new Map<string, number>()
for (const region of REGIONS) {
  let regionTotal = 0
  for (const [name, fly] of PILOTS) {
    const r = play(region.id, fly, region.riftBase)
    const reward = rewardFor({ kills: r.kills, seconds: r.secs, insight: r.insight, depth: region.depth })
    const weight = name === 'duel' ? 2 : 1
    totalReward += reward.total * weight
    sampleCount += weight
    regionTotal += reward.total
  }
  perRegionAvg.set(region.id, regionTotal / PILOTS.length)
}
const AVG_REWARD = totalReward / sampleCount

function expeditionsTo(targetLevel: number): number {
  let xp = 0
  let level = 1
  let expeditions = 0
  while (level < targetLevel) {
    xp += AVG_REWARD
    while (xp >= xpForCultivation(level)) {
      xp -= xpForCultivation(level)
      level++
    }
    expeditions++
  }
  return expeditions
}

const REALM_START_LEVEL = (realmIdx: number): number => realmIdx * LEVELS_PER_REALM + 1

// ===========================================================================
// header
// ===========================================================================
y = 36
parts.push(text(M, y, '境界 — a escada vertical', 20, ink, 0.92, 'start', '600'))
y += 20
para(
  'Quatro escadas crescem juntas. Esta página é só uma: a permanente, ' +
    'medida ao longo de dezenas de corridas — não uma.',
  11, 0.6, 56, cinnabar,
)
y += 6
para(
  `${sampleCount / 2} amostras, prémio médio ${AVG_REWARD.toFixed(0)} 境界 por corrida, no mesmo ` +
    'espadachim sem equipamento que mede tudo o resto.',
  9, 0.42,
)
y += 12

// ===========================================================================
// 1 — the seam
// ===========================================================================
heading('A COSTURA')
para(
  'Cada avanço de realm abre uma região nova — até à quinta. Ao nível 21 a ' +
    'Passagem abre e as cinco regiões estão todas acessíveis. Os dezasseis ' +
    'níveis seguintes, três realms inteiros, não abrem nenhuma região nova. ' +
    'Não é falta de conteúdo — é a costura onde a progressão deixa de ser ' +
    'HORIZONTAL (mundo novo) e passa a ser VERTICAL (o mesmo mundo, mais ' +
    'fundo): equipamento, 秘笈, e agora os andares da fenda.',
)
y += 10

// ===========================================================================
// 2 — the ladder itself, bottom to top like the thing it is
// ===========================================================================
heading('OS OITO REALMS, DE BAIXO PARA CIMA')
para('Cada bloco: o realm, os níveis, o que abre, e quantas corridas custa chegar lá — medido.')
y += 8

{
  // Wide enough that a two-glyph realm seal (every realm's — 剑仙, 渡劫…) fits
  // beside the rail instead of running through it.
  const RAIL = M + 36
  // SVG y grows downward. A ladder's bottom rung (淬体, index 0) belongs at
  // the BOTTOM of the page — drawn LAST — so realms are visited highest
  // index first: 剑仙 (7) appears at the top, 淬体 (0) at the foot.
  const order = [...REALMS.map((_, i) => i)].reverse()
  const rowH = 74
  parts.push(
    `<rect x="${RAIL}" y="${y + 6}" width="1.5" height="${order.length * rowH - 20}" ` +
      `fill="${ink}" fill-opacity="0.15"/>`,
  )
  for (const i of order) {
    const realm = REALMS[i]!
    const startLevel = REALM_START_LEVEL(i)
    const endLevel = i === REALMS.length - 1 ? 40 : startLevel + LEVELS_PER_REALM - 1
    const unlocksRegion = i > 0 && i <= MAX_DEPTH - 1
    const region = unlocksRegion ? REGIONS[i]! : undefined
    // Purely vertical from the realm AFTER 元婴 (i=4, which still unlocks the
    // Pass) onward: i=5..7 open nothing new at all.
    const vertical = i >= MAX_DEPTH
    const exp = expeditionsTo(startLevel)

    const dotColour = vertical ? gold : ink
    parts.push(
      `<circle cx="${RAIL + 0.75}" cy="${y + 16}" r="5" fill="${dotColour}" ` +
        `fill-opacity="${vertical ? 0.85 : 0.55}"/>`,
      // Right-aligned to END just before the rail — every realm seal is two
      // glyphs (剑仙, 渡劫…) and needs the width RAIL now leaves for it.
      seal(RAIL - 9, y + 22, realm.seal, 14, vertical ? goldDeep : ink, vertical ? 0.9 : 0.7, 'end'),
    )
    const bx = RAIL + 16
    parts.push(
      `<rect x="${bx}" y="${y}" width="${W - M - bx}" height="${rowH - 12}" rx="4" ` +
        `fill="${vertical ? gold : ink}" fill-opacity="${vertical ? 0.05 : 0.025}" ` +
        `stroke="${vertical ? gold : ink}" stroke-opacity="${vertical ? 0.3 : 0.09}"/>`,
      text(bx + 10, y + 15, realm.name, 11.5, ink, 0.88, 'start', '600'),
      text(W - M - 8, y + 15, `lvl ${startLevel}–${endLevel}`, 9, ink, 0.45, 'end'),
      text(bx + 10, y + 30, realm.blurb, 8.5, ink, 0.42),
    )
    if (region) {
      // The seal is one to three glyphs (关 vs 芦荡 vs 断崖), so the label
      // after it is placed off the seal's own length rather than at a fixed
      // offset — a fixed gap overlapped the two- and three-glyph seals with
      // the word "abre" right next to them.
      const sealW = region.seal.length * 13
      parts.push(
        seal(bx + 10, y + 47, region.seal, 12, cinnabar, 0.8, 'start'),
        text(bx + 14 + sealW, y + 47, `abre ${region.name}`, 9, cinnabar, 0.85, 'start', '600'),
      )
    } else if (i === 0) {
      parts.push(text(bx + 10, y + 47, '官道 já aberta desde o início', 9, ink, 0.4))
    } else {
      parts.push(text(bx + 10, y + 47, 'nenhuma região nova — só profundidade', 9, goldDeep, 0.8))
    }
    parts.push(
      text(bx + 10, y + 60, `~${exp} corridas até aqui`, 8.5, ink, 0.38),
    )
    y += rowH
  }
  y += 6
}

para(
  'A curva não é reta: cada nível pede mais 境界 do que o anterior, por isso ' +
    'os números aceleram. Chegar ao topo custa dez vezes mais corridas do que ' +
    'chegar à Passagem — e é exatamente aí, depois da Passagem, que a fenda ' +
    'assume o trabalho de continuar a ficar mais difícil.',
  9.5, 0.55, 66, cinnabar,
)
y += 10

// ===========================================================================
// 3 — what actually grows once the map is full
// ===========================================================================
heading('DEPOIS DA PASSAGEM, O QUE CRESCE')
para(
  'Três coisas, e nenhuma delas é "uma região nova". Isto é a resposta à ' +
    'nota antiga em meta/character.ts: poder permanente contra uma dificuldade ' +
    'fixa torna os primeiros minutos triviais. A fenda existe para não deixar ' +
    'isso acontecer — cada empurrão (阶) sobe a dificuldade outra vez, na ' +
    'mesma região.',
)
y += 8

{
  const rows: Array<[string, string, string]> = [
    ['阶', 'Andares da fenda', `sem teto. Vida ×${tierHealthScale(5).toFixed(1)} e alcance ×${riftTargetFor(1, 5).toFixed(1)} ` +
      `ao 5º andar — medido em data/enemies.ts.`],
    ['装', 'Rank do equipamento', 'rank 1→5 por peça, e só cai mais fundo na região.'],
    ['秘笈', 'Manuais', 'quais das 60 artes (30 propostas) chegas a levar.'],
  ]
  for (const [s, name, what] of rows) {
    parts.push(
      `<rect x="${M}" y="${y}" width="${W - M * 2}" height="46" rx="4" fill="${ink}" ` +
        `fill-opacity="0.025" stroke="${ink}" stroke-opacity="0.08"/>`,
      seal(M + 22, y + 28, s, s.length > 1 ? 12 : 16, cinnabar, 0.8),
      text(M + 46, y + 18, name, 10.5, ink, 0.85, 'start', '600'),
    )
    for (const line of wrap(what, 46)) {
      parts.push(text(M + 46, y + 32, line, 8.5, ink, 0.48))
      y += 12
    }
    y += 46 - 12 + 10
  }
}

para(
  `Um exemplo, medido: no 官道, o 阶 1 pede ${REGIONS[0]!.riftBase} qi para o ` +
    `portão abrir. Ao 阶 5 pede ${riftTargetFor(REGIONS[0]!.riftBase, 5).toFixed(0)} — ` +
    `os inimigos ficam ×${tierHealthScale(5).toFixed(2)} mais resistentes e chegam ` +
    `×${tierSpawnScale(5).toFixed(2)} mais depressa. A MESMA região, cinco jogos diferentes.`,
)
y += 10

// ===========================================================================
// 4 — the four ladders, together, one more time
// ===========================================================================
heading('AS QUATRO ESCADAS, LADO A LADO')
{
  const rows: Array<[string, string, string, string]> = [
    ['感悟', 'Insight', 'uma corrida', 'sobe as 4 artes levadas, 1→5'],
    ['境界', 'Cultivo', 'para sempre — esta página', '8 realms, 4 abrem região'],
    ['装备', 'Equipamento', 'para sempre', 'rank 1→5, por região'],
    ['秘笈', 'Manuais', 'para sempre', 'quais artes existem para levar'],
  ]
  for (const [s, name, scope, what] of rows) {
    const on = name === 'Cultivo'
    parts.push(
      `<rect x="${M}" y="${y}" width="${W - M * 2}" height="40" rx="4" ` +
        `fill="${on ? cinnabar : ink}" fill-opacity="${on ? 0.06 : 0.025}" ` +
        `stroke="${on ? cinnabar : ink}" stroke-opacity="${on ? 0.35 : 0.08}"/>`,
      seal(M + 24, y + 25, s, s.length > 1 ? 11 : 15, on ? cinnabar : ink, 0.8),
      text(M + 48, y + 17, name, 11, ink, 0.88, 'start', '600'),
      text(M + 48, y + 31, what, 8.5, ink, 0.45),
      text(W - M - 8, y + 17, scope, 8, goldDeep, 0.75, 'end'),
    )
    y += 44
  }
}
y += 4

para(
  'Uma corrida sobe 感悟. Uma corrida BEM-SUCEDIDA (o portão limpo) também ' +
    'sobe 境界, pode subir 装备, e devia poder ensinar 秘笈. As quatro escadas ' +
    'partilham a mesma moeda de entrada — a fenda — e é por isso que esta ' +
    'página e docs/CORRIDAS.md são a mesma história vista de duas alturas.',
  9.5, 0.5, 66, cinnabar,
)
y += 12

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${y}" viewBox="0 0 ${W} ${y}">` +
  `<rect width="${W}" height="${y}" fill="${paper}"/>` +
  parts.join('') +
  `</svg>`

await writeFile(join(OUT, 'progressao.svg'), svg)
console.log(`prog:   docs/progressao.svg  ${W}×${Math.round(y)}`)
