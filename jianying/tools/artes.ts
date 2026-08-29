/**
 * 功法 — the five conditions and the six scrolls, on one page.
 *
 *   npx tsx tools/artes.ts && npx tsx tools/rasterise.mts docs/artes.svg
 *
 * Reads src/data/arts.ts directly, so the sheet cannot describe a scroll the
 * game does not have. If an art is missing here it is missing there.
 *
 * This is a PROPOSAL sheet in one specific sense: the data exists and is
 * tested, but nothing in the simulation reads it yet. The grid below is what
 * has been agreed, not what is playable.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { palette } from '../src/render/palette'
import { ARTS, CONDITIONS, NEW_EFFECTS, artsFor, type Condition } from '../src/data/arts'
import { WEAPONS } from '../src/data/weapons'
import { W, columns, heading, hex, label, wrap } from './sheet'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'docs')

/** Cuts a line to fit the weapon column, which is 100px wide at 9px. */
const trim = (text: string, max: number): string =>
  text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`

const rows: string[] = []
let y = 0

rows.push(
  `<text x="40" y="42" font-family="system-ui, sans-serif" font-size="16" letter-spacing="3.5" ` +
    `fill="${hex(palette.ink)}" fill-opacity="0.55">剑影 JIÀNYǏNG · 功法 — AS ARTES</text>`,
  `<text x="40" y="66" font-family="system-ui, sans-serif" font-size="12.5" fill="${hex(palette.cinnabar)}">` +
    `Os dados existem e estao testados. A simulacao ainda nao le nada disto — e o que esta acordado, nao o que se joga.</text>`,
)
y = 66

// --- 1. the five conditions ------------------------------------------------
y += 52
rows.push(
  heading(
    y,
    '一',
    'Nao ha botao. O movimento e o botao.',
    'Cada arte espera por uma condicao, e a condicao e uma coisa que fazes com o polegar que ja esta no joystick. A arte dispara sozinha quando ela acontece. Isto e o que separa automatico PASSIVO — um numero que se aplica sempre, e ao minuto cinco estas a ver o jogo jogar-se — de automatico CONDICIONAL, em que provocas as tuas artes com a forma como te mexes.',
  ),
)
y += 118

{
  const base = y
  const x = columns(CONDITIONS.length, 96)
  CONDITIONS.forEach((condition, i) => {
    const cx = x(i)
    rows.push(
      // The seal is the tell: this is the glyph that will light on the HUD.
      `<text x="${cx}" y="${base + 34}" text-anchor="middle" font-family="serif" font-size="40" ` +
        `fill="${hex(palette.cinnabar)}">${condition.seal}</text>`,
      label(cx, base + 58, condition.name.toUpperCase(), 11, hex(palette.ink), 0.85),
    )
    wrap(condition.how, 26).forEach((line, k) => {
      rows.push(label(cx, base + 78 + k * 15, line, 10, hex(palette.ink), 0.5))
    })
  })
  y = base + 128
}

// --- 2. the six scrolls ----------------------------------------------------
y += 20
rows.push(
  heading(
    y,
    '二',
    'Seis rolos de cinco. A arma na mao decide qual ves.',
    'Cada arma cobre as cinco condicoes exactamente uma vez. Isso nao e enfeite: nenhuma arma tem uma condicao morta, e quem troca de arma mantem as mesmas cinco coisas a FAZER enquanto tudo o que elas produzem muda. E a forma mais barata de ter seis classes com um so esquema de controlo.',
  ),
)
y += 118

{
  const left = 148
  const cellW = (W - left - 60) / CONDITIONS.length
  // Column headers: the condition each column belongs to.
  CONDITIONS.forEach((condition, i) => {
    const cx = left + cellW * (i + 0.5)
    rows.push(
      `<text x="${cx}" y="${y}" text-anchor="middle" font-family="serif" font-size="19" ` +
        `fill="${hex(palette.cinnabar)}" fill-opacity="0.75">${condition.seal}</text>`,
    )
  })
  y += 22

  WEAPONS.forEach((weapon) => {
    const scroll = artsFor(weapon.id)
    const top = y
    rows.push(
      label(left - 100, top + 18, weapon.name, 12, hex(palette.ink), 0.85, 'start'),
      // Trimmed to the column: the Iron Fan's line ran under the first seal.
      label(left - 100, top + 35, trim(weapon.blurb.split('.')[0]!, 26), 9, hex(palette.ink), 0.38, 'start'),
    )
    CONDITIONS.forEach((condition, i) => {
      const art = scroll.find((a) => a.condition === condition.id)
      if (!art) return
      const cx = left + cellW * (i + 0.5)
      // Cinnabar for an effect the simulation already has; gold for one that is
      // new work. The cost of a scroll should be visible on the scroll.
      const isNew = (NEW_EFFECTS as readonly string[]).includes(art.effect)
      rows.push(
        `<text x="${cx}" y="${top + 20}" text-anchor="middle" font-family="serif" font-size="21" ` +
          `fill="${hex(isNew ? palette.gold : palette.ink)}">${art.seal}</text>`,
        label(cx, top + 37, art.name, 10, hex(palette.ink), 0.72),
        label(cx, top + 52, art.effect, 8.5, hex(isNew ? palette.gold : palette.ink), isNew ? 0.9 : 0.35),
      )
    })
    y = top + 74
  })
}

// --- 3. the cost -----------------------------------------------------------
y += 14
rows.push(
  heading(
    y,
    '三',
    'O que isto custa, sem enfeite',
    'Uma folha que so mostra o desenho e propaganda. Os selos a dourado em cima sao efeitos que a simulacao NAO tem — seis funcionalidades pequenas, mas seis, e cada uma entra com o seu teste. Os pretos usam alavancas que deriveStats ja mexe.',
  ),
)
y += 104

{
  const usedNew = ARTS.filter((a) => (NEW_EFFECTS as readonly string[]).includes(a.effect))
  const notes: Array<[string, string]> = [
    ['As 3 cartas saem', 'Sao o motor do genero: fazem a corrida crescer enquanto os inimigos crescem. Tira-las e mais nada e partir a curva.'],
    ['O pagamento', 'Subir de nivel na corrida passa a avancar as TUAS artes, pela ordem que definiste no hub. A curva mantem-se, e o que cresce e a tua build.'],
    [`${usedNew.length} de ${ARTS.length} artes`, 'usam algo que ainda nao existe na simulacao. A primeira passagem deve usar sobretudo o resto, senao isto nao sao 30 linhas de dados, sao 6 sistemas.'],
    ['A condicao antes do efeito', 'Se o jogador nao vir QUANDO uma arte dispara, nenhum efeito a torna legivel. O selo acender no HUD vem antes de tudo o resto.'],
  ]
  const base = y
  const x = columns(notes.length, 130)
  notes.forEach(([title, note], i) => {
    const cx = x(i)
    rows.push(label(cx, base, title, 12, hex(palette.cinnabar), 0.95))
    wrap(note, 34).forEach((line, k) => {
      rows.push(label(cx, base + 24 + k * 15, line, 9.5, hex(palette.ink), 0.5))
    })
  })
  y = base + 130
}

const H = y + 30
const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
  `<rect width="${W}" height="${H}" fill="${hex(palette.paper)}"/>` +
  rows.join('') +
  `</svg>`

await mkdir(OUT, { recursive: true })
await writeFile(join(OUT, 'artes.svg'), svg, 'utf8')
const conditions = new Set<Condition>(ARTS.map((a) => a.condition))
console.log(`sheet:  docs/artes.svg  ${W}×${H}`)
console.log(`scroll: ${WEAPONS.length} weapons × 5 arts, ${conditions.size} conditions`)
