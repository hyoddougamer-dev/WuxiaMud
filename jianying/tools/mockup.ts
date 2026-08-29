/**
 * 剑影 Jiànyǐng — the whole visual system, on one page.
 *
 *   npx tsx tools/mockup.ts && npx tsx tools/rasterise.mts docs/mockup.svg
 *
 * There are eight other sheets in docs/ and every one of them answers a
 * question that was live the week it was written — auras, ranks, mixing,
 * progression. That is a good record and a bad answer to "show me where the
 * game is", because reading eight sheets to assemble one picture is exactly
 * the confusion this was supposed to remove.
 *
 * So this sheet is deliberately not a proposal. Every figure on it is built by
 * the same `buildSwordsmanTopDown` the game calls, through the same
 * `portraitSvg` the hub calls, from the same wardrobe numbers the drops hand
 * out. If something here looks wrong, it is wrong in the game.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { palette } from '../src/render/palette'
import { gearFromIds, ROBES, SHOULDERS, HEADS, BLADES } from '../src/render/wardrobe'
import { BEARINGS, BUILDS, PIGMENTS, SASHES, type Look } from '../src/meta/look'
import { portraitSvg } from '../src/render/silhouette'
import { SETS } from './setdata'
import { W, columns, heading, hex, label, wrap } from './sheet'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'docs')

const look = (over: Partial<Look> = {}): Look => ({
  seed: 7,
  build: 1,
  sash: 3,
  bearing: 0,
  pigment: 0,
  ...over,
})

/** portraitSvg sizes itself from CSS, so the sheet wraps it at a fixed size. */
function portrait(
  ids: Parameters<typeof gearFromIds>[0],
  l: Look,
  x: number,
  baseline: number,
  h: number,
): string {
  return portraitSvg(gearFromIds(ids), l, { box: 86 })
    .replace(
      '<svg class="portrait-svg" ',
      `<svg width="${(h * 0.92).toFixed(0)}" height="${h}" x="${(x - h * 0.46).toFixed(0)}" ` +
        `y="${(baseline - h).toFixed(0)}" `,
    )
}

const SET_IDS = (i: number): Parameters<typeof gearFromIds>[0] => {
  const set = SETS[i]!
  return {
    robe: set.pieces.robe,
    shoulders: set.pieces.shoulders,
    head: set.pieces.head,
    blade: set.pieces.weapon,
  }
}

const rows: string[] = []
let y = 0

const caption = (x: number, yy: number, top: string, sub: string, colour = palette.ink): string =>
  label(x, yy, top, 11, hex(colour), 0.9) + label(x, yy + 15, sub, 9.5, hex(palette.ink), 0.42)

// --- masthead --------------------------------------------------------------
rows.push(
  `<text x="40" y="42" font-family="system-ui, sans-serif" font-size="16" letter-spacing="3.5" ` +
    `fill="${hex(palette.ink)}" fill-opacity="0.55">剑影 JIÀNYǏNG · O ESTADO VISUAL</text>`,
  `<text x="40" y="66" font-family="system-ui, sans-serif" font-size="12.5" fill="${hex(palette.cinnabar)}">` +
    `Tudo nesta folha e desenhado pelo codigo do jogo, com os mesmos numeros que os drops entregam. ` +
    `Nao ha nada aqui que seja so uma proposta.</text>`,
)
y = 66

// --- 1. the figure ---------------------------------------------------------
y += 52
rows.push(
  heading(
    y,
    '一',
    'A figura',
    'Nao ha sprites. Cada marca e uma espinha varrida por um perfil de largura, por isso uma peca de equipamento nao e um desenho — sao numeros que mudam por onde a espinha passa. Isso e o que torna a variedade combinatoria em vez de linear, e e tambem o limite: uma peca so se le pela silhueta.',
  ),
)
y += 104

{
  const base = y + 250
  const x = columns(4, 90)
  const parts: Array<[string, string, Look, Parameters<typeof gearFromIds>[0]]> = [
    ['Homem · sem tinta', 'Casaco de viagem, dao', look({ bearing: 0 }), SET_IDS(0)],
    ['Mulher · sem tinta', 'A mesma roupa, o mesmo pincel', look({ bearing: 1 }), SET_IDS(0)],
    ['Homem · 靛 indigo', 'So a tunica leva pigmento', look({ bearing: 0, pigment: 2 }), SET_IDS(2)],
    ['Mulher · 朱 cinabrio', 'Cabeca e lamina ficam tinta', look({ bearing: 1, pigment: 1 }), SET_IDS(2)],
  ]
  parts.forEach(([top, sub, l, ids], i) => {
    rows.push(portrait(ids, l, x(i), base, 230), caption(x(i), base + 26, top, sub))
  })
  y = base + 62
}

// --- 2. man and woman ------------------------------------------------------
y += 34
rows.push(
  heading(
    y,
    '二',
    'Homem e mulher, em cada conjunto',
    'A tunica era UM traco do colarinho a bainha — um sino, e um sino nao tem cintura, por isso nao tinha onde a diferenca assentar. Agora sao dois tracos que se encontram numa cintura cuja ALTURA e APERTO vem do bearing. E a primeira coisa que o olho le em qualquer silhueta de epoca.',
  ),
)
y += 104

{
  const base = y + 168
  const x = columns(10, 56)
  SETS.slice(0, 5).forEach((set, i) => {
    BEARINGS.forEach((bearing, k) => {
      const cx = x(i * 2 + k)
      rows.push(
        portrait(SET_IDS(i), look({ bearing: k }), cx, base, 156),
        label(cx, base + 18, bearing.name, 10, hex(palette.ink), k === 1 ? 0.85 : 0.5),
      )
    })
    const mid = (x(i * 2) + x(i * 2 + 1)) / 2
    rows.push(
      label(mid, base + 40, set.seal, 14, hex(palette.cinnabar)),
      label(mid, base + 56, set.name, 10, hex(palette.ink), 0.45),
    )
  })
  y = base + 84
}

// --- 3. the wardrobe, slot by slot ----------------------------------------
y += 30
rows.push(
  heading(
    y,
    '三',
    'O guarda-roupa: 22 pecas, quatro encaixes',
    'Cada linha muda UMA coisa e deixa o resto igual, que e a unica forma honesta de mostrar o que uma peca faz. Seis tunicas, cinco ombros, cinco cabecas, seis armas — 900 silhuetas, e cada uma um contorno diferente, nao uma recolor.',
  ),
)
y += 104

{
  const slots: Array<[string, string, readonly { id: string; name: string }[], string]> = [
    ['袍', 'Tunica', ROBES, 'robe'],
    ['肩', 'Ombros', SHOULDERS, 'shoulders'],
    ['首', 'Cabeca', HEADS, 'head'],
    ['兵', 'Arma', BLADES, 'blade'],
  ]
  for (const [seal, name, list, key] of slots) {
    const base = y + 138
    rows.push(
      label(52, base - 54, seal, 15, hex(palette.cinnabar)),
      label(52, base - 34, name, 9.5, hex(palette.ink), 0.5),
    )
    const x = columns(list.length, 118)
    list.forEach((style, i) => {
      const ids: Record<string, string> = { [key]: style.id }
      rows.push(
        portrait(ids, look(), x(i), base, 128),
        label(x(i), base + 17, style.name, 9.5, hex(palette.ink), 0.62),
      )
    })
    y = base + 34
  }
  y += 6
}

// --- 4. what is yours ------------------------------------------------------
y += 26
rows.push(
  heading(
    y,
    '四',
    'O que e teu, e que nenhum drop te tira',
    'A tinta, a compleicao e a faixa sao escolhidas na criacao e sobrevivem a tudo o que se equipa. E a razao de existirem: um jogo de loot em que o aspeto e inteiramente ditado pela ultima peca que caiu nao tem personagem nenhuma, so um manequim.',
  ),
)
y += 104

{
  const base = y + 152
  const x = columns(PIGMENTS.length + BUILDS.length + SASHES.length, 46)
  let i = 0
  for (const pigment of PIGMENTS) {
    rows.push(
      portrait(SET_IDS(3), look({ pigment: PIGMENTS.indexOf(pigment) }), x(i), base, 140),
      label(x(i), base + 18, pigment.seal, 12, hex(pigment.colour ?? palette.ink), 0.95),
      label(x(i), base + 33, pigment.name, 8.5, hex(palette.ink), 0.4),
    )
    i++
  }
  for (const build of BUILDS) {
    rows.push(
      portrait(SET_IDS(3), look({ build: BUILDS.indexOf(build) }), x(i), base, 140),
      label(x(i), base + 18, build.name, 10, hex(palette.ink), 0.8),
      label(x(i), base + 33, 'compleicao', 8.5, hex(palette.ink), 0.4),
    )
    i++
  }
  // The travelling coat, not the layered robe the other two rows use: a sash is
  // tied at the waist and hangs BEHIND the figure, so a wide skirt swallows it
  // completely and the row would show four identical swordsmen.
  for (const sash of SASHES) {
    rows.push(
      portrait(SET_IDS(0), look({ sash: SASHES.indexOf(sash) }), x(i), base, 140),
      label(x(i), base + 18, sash.name, 10, hex(sash.colour ?? palette.ink), 0.85),
      label(x(i), base + 33, 'faixa', 8.5, hex(palette.ink), 0.4),
    )
    i++
  }
  y = base + 56
}

// --- 5. what is still missing ---------------------------------------------
y += 26
rows.push(
  heading(
    y,
    '五',
    'O que ainda nao existe',
    'Escrito aqui porque uma folha que so mostra o que esta feito e propaganda. Os passos 1, 1b e 2 da ORDEM ja estao no jogo — instancia de item com grau, roster de espadachins, e quatro stats em vez de dez. Estes quatro sao os que faltam, e nenhum deles esta desenhado neste documento.',
  ),
)
y += 100

{
  const todo: Array<[string, string, string]> = [
    ['3 · Sets', 'Posturas, nao bonus', 'Um set completo muda COMO se luta — o varrimento transforma-se com o movimento — em vez de somar +8% a alguma coisa.'],
    ['4 · Marcas', 'Rank visivel na peca', 'Ja existe codigo (rankMarksFor), com vocabulario por encaixe: uma bainha cresce, um chapeu nao. Hoje o grau le-se nos pontos do cartao, nao na figura.'],
    ['5 · Forja', 'Temperar com repetidas', 'A aba 炉. Precisa das marcas primeiro: sem elas o botao principal do ecra nao tem consequencia visivel.'],
    ['7 · Ritos', 'Encaixes e auras', 'O campo rites ja existe em cada peca e esta vazio de proposito, para nao custar uma segunda migracao de saves.'],
  ]
  const base = y
  const x = columns(todo.length, 130)
  todo.forEach(([tag, name, note], i) => {
    const cx = x(i)
    rows.push(
      label(cx, base, tag, 10, hex(palette.cinnabar), 0.9),
      label(cx, base + 20, name, 12.5, hex(palette.ink), 0.85),
    )
    wrap(note, 34).forEach((line, k) => {
      rows.push(label(cx, base + 42 + k * 15, line, 9.5, hex(palette.ink), 0.45))
    })
  })
  y = base + 120
}

const H = y + 34
const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
  `<rect width="${W}" height="${H}" fill="${hex(palette.paper)}"/>` +
  rows.join('') +
  `</svg>`

await mkdir(OUT, { recursive: true })
await writeFile(join(OUT, 'mockup.svg'), svg, 'utf8')
console.log(`mockup: docs/mockup.svg  ${W}×${H}`)
console.log(
  `pieces: ${ROBES.length} robes · ${SHOULDERS.length} shoulders · ` +
    `${HEADS.length} heads · ${BLADES.length} blades`,
)
