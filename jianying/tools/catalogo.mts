/**
 * Everything in the game, on one page, read out of the real tables.
 *
 *   npx tsx tools/catalogo.mts
 *
 * GENERATED, NEVER WRITTEN BY HAND, and that is the whole point. A catalogue
 * typed out beside the code is a catalogue that starts lying the first time a
 * number is tuned, and this project has already shipped that mistake once: a
 * rarity sheet quoting hand-typed odds beside a table that had since been
 * retuned, which the player has no way to catch. Every figure below is computed
 * from the same functions the game rolls against.
 *
 * Writes docs/catalogo.html.
 */
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ITEMS, SLOTS, SLOT_NAMES, dropChance } from '../src/data/items'
import { ARTS, CONDITIONS, EQUIPPED_ARTS, MAX_ART_LEVEL } from '../src/data/arts'
import { ATTUNE_PER_GRADE, artGrade, awakeCount } from '../src/sim/arts'
import { WEAPONS, singleTargetDps, sweptAreaPerSecond } from '../src/data/weapons'
import { AFFIX_SPECS, NAMED_POWERS, isPercent, rollAmount } from '../src/data/affixes'
import { RARITIES, rarityOdds } from '../src/data/rarity'
import { REGIONS } from '../src/data/regions'
import { BAG_CAPACITY } from '../src/meta/inventory'
import { ATTRIBUTES } from '../src/meta/character'

const ROOT = fileURLToPath(new URL('..', import.meta.url))

const esc = (text: string): string =>
  text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

const pct = (n: number, places = 2): string => `${(n * 100).toFixed(places)}%`

// --- the ladder --------------------------------------------------------------
const rarityLadder = RARITIES.map((tier) => {
  const odds = [1, 3, 5].map((d) => rarityOdds(d)[tier.id]!)
  return `<tr>
    <td><b style="color:${tier.css}">${tier.seal} ${tier.name}</b></td>
    <td class="n">${tier.affixes}${tier.id >= 4 ? ' <i>+ power</i>' : ''}</td>
    <td class="n">×${tier.potency.toFixed(2)}</td>
    ${odds.map((o) => `<td class="n">${pct(o)}</td>`).join('')}
  </tr>`
}).join('\n')

// --- the lines ---------------------------------------------------------------
const lines = AFFIX_SPECS.map((spec) => {
  const at = (depth: number): string => {
    const lo = rollAmount(spec.kind, depth, 0)
    const hi = rollAmount(spec.kind, depth, 1, RARITIES[5]!.potency)
    return isPercent(spec.kind) ? `${lo}–${hi}%` : `${lo}–${hi}`
  }
  return `<tr>
    <td><b>${spec.seal} ${spec.name}</b></td>
    <td class="n">${at(1)}</td>
    <td class="n">${at(3)}</td>
    <td class="n">${at(5)}</td>
    <td class="n">${spec.weight}</td>
  </tr>`
}).join('\n')

// --- the weapons -------------------------------------------------------------
const weapons = WEAPONS.map((w) => {
  const arc = Math.round((w.halfAngle * 2 * 180) / Math.PI)
  return `<div class="card">
    <div class="card-head"><span class="seal">${w.seal}</span><b>${esc(w.name)}</b></div>
    <p class="blurb">${esc(w.blurb)}</p>
    <div class="stats">
      <span><i>damage</i>${w.damage}</span>
      <span><i>every</i>${w.interval.toFixed(2)}s</span>
      <span><i>reach</i>${w.range}</span>
      <span><i>arc</i>${arc}°</span>
      <span><i>dps</i>${singleTargetDps(w).toFixed(1)}</span>
      <span><i>swept/s</i>${Math.round(sweptAreaPerSecond(w) / 1000)}k</span>
    </div>
  </div>`
}).join('\n')

// --- the bases ---------------------------------------------------------------
const bases = SLOTS.map((slot) => {
  const rows = ITEMS.filter((i) => i.slot === slot)
    .map(
      (i) =>
        `<tr><td>${esc(i.name)}</td><td class="n">${i.depth}</td><td class="dim">${esc(i.styleId)}</td></tr>`,
    )
    .join('\n')
  return `<div class="halfcol">
    <div class="sub">${SLOT_NAMES[slot]} <i>${ITEMS.filter((i) => i.slot === slot).length}</i></div>
    <table class="t"><tbody>${rows}</tbody></table>
  </div>`
}).join('\n')

// --- the arts ----------------------------------------------------------------
const arts = WEAPONS.map((w) => {
  const rows = ARTS.filter((a) => a.weapon === w.id)
    .map((a) => {
      const cond = CONDITIONS.find((c) => c.id === a.condition)!
      return `<tr>
        <td><b>${a.seal} ${esc(a.name)}</b></td>
        <td class="dim">${esc(a.blurb)}</td>
        <td class="cond">${cond.seal} ${esc(cond.name)}</td>
        <td class="dim">${esc(a.effect)}</td>
      </tr>`
    })
    .join('\n')
  return `<div class="scroll">
    <div class="sub">${w.seal} ${esc(w.name)}</div>
    <table class="t"><tbody>${rows}</tbody></table>
  </div>`
}).join('\n')

// --- the named powers --------------------------------------------------------
const attuneLadder = RARITIES.map((tier) => {
  const rungs = [tier.id, tier.id, tier.id, tier.id]
  return (
    `<tr><td><b style="color:${tier.css}">${tier.seal}</b> ${tier.name}</td>` +
    `<td class="n">${awakeCount(tier.id, 5)} de 5</td>` +
    `<td>4× <b style="color:${tier.css}">${tier.seal}</b></td>` +
    `<td class="n">${artGrade(rungs)}</td></tr>`
  )
}).join('')

const powers = NAMED_POWERS.map(
  (p) => `<div class="power">
    <div class="card-head"><span class="seal gold">${p.seal}</span><b>${esc(p.name)}</b>
      <i class="slot">${esc(p.slot)}</i></div>
    <p class="blurb">${esc(p.blurb)}</p>
  </div>`,
).join('\n')

// --- the world ---------------------------------------------------------------
const world = REGIONS.map(
  (r) => `<tr>
    <td><b>${r.seal} ${esc(r.name)}</b></td>
    <td class="n">${r.depth}</td>
    <td class="n">${pct(dropChance(r.depth), 1)}</td>
    <td class="dim">${esc(r.ruleText)}</td>
  </tr>`,
).join('\n')

const html = `<title>剑影 · O Catálogo</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Old+Mincho:wght@400;600;900&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
:root {
  --ink: #191510; --ground: #fbf8f1; --raised: #f3ede0; --card: #ffffff;
  --line: #ddd2bd; --muted: #6d6455; --cinnabar: #b52a24; --gold: #8a6d22;
  --shadow: 0 1px 2px rgba(25,21,16,.05), 0 8px 22px -14px rgba(25,21,16,.24);
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --ink: #efe7d6; --ground: #14120e; --raised: #1d1a14; --card: #1a1712;
    --line: #332d23; --muted: #9a907e; --cinnabar: #e2645c; --gold: #cfae57;
    --shadow: 0 1px 2px rgba(0,0,0,.5), 0 12px 30px -16px rgba(0,0,0,.7);
  }
}
:root[data-theme="dark"] {
  --ink: #efe7d6; --ground: #14120e; --raised: #1d1a14; --card: #1a1712;
  --line: #332d23; --muted: #9a907e; --cinnabar: #e2645c; --gold: #cfae57;
  --shadow: 0 1px 2px rgba(0,0,0,.5), 0 12px 30px -16px rgba(0,0,0,.7);
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0; background: var(--ground); color: var(--ink);
  font: 400 15px/1.55 "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.wrap { max-width: 780px; margin: 0 auto; padding: 0 20px 90px; }
header { padding: 44px 0 8px; }
h1 {
  font-family: "Zen Old Mincho", serif; font-weight: 900;
  font-size: clamp(30px, 8vw, 44px); line-height: 1.02; margin: 0;
}
h1 span { color: var(--cinnabar); }
.sub-line { margin: 10px 0 0; color: var(--muted); max-width: 52ch; font-size: 14.5px; }
.counts {
  display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px;
  font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: 12px;
}
.counts span {
  padding: 4px 9px; background: var(--raised); border: 1px solid var(--line);
  border-radius: 3px;
}
.counts b { color: var(--cinnabar); font-weight: 600; }
section { padding: 34px 0 0; }
.eyebrow {
  font-family: "IBM Plex Mono", monospace; font-size: 11px; letter-spacing: .1em;
  text-transform: uppercase; color: var(--gold); margin: 0 0 5px;
}
h2 { font-family: "Zen Old Mincho", serif; font-weight: 600; font-size: 22px; margin: 0 0 5px; }
.note { color: var(--muted); font-size: 13.5px; margin: 0 0 16px; max-width: 60ch; }
.tablewrap { overflow-x: auto; }
table.t { width: 100%; border-collapse: collapse; font-size: 13.5px; }
table.t th, table.t td { text-align: left; padding: 7px 10px; border-bottom: 1px solid var(--line); }
table.t th {
  font-family: "IBM Plex Mono", monospace; font-size: 10.5px; text-transform: uppercase;
  letter-spacing: .06em; color: var(--muted); font-weight: 500;
}
table.t td.n { font-variant-numeric: tabular-nums; text-align: right; font-family: "IBM Plex Mono", monospace; font-size: 12.5px; }
table.t td.dim { color: var(--muted); font-size: 12.5px; }
table.t td.cond { color: var(--cinnabar); font-size: 12.5px; white-space: nowrap; }
table.t i { font-style: normal; color: var(--gold); }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
@media (max-width: 640px) { .grid2, .grid3 { grid-template-columns: 1fr; } }
.card, .power {
  background: var(--card); border: 1px solid var(--line); border-radius: 5px;
  padding: 13px 15px; box-shadow: var(--shadow);
}
.card-head { display: flex; align-items: baseline; gap: 8px; }
.card-head b { font-size: 15px; }
.seal { font-family: "Zen Old Mincho", serif; font-size: 17px; color: var(--cinnabar); }
.seal.gold { color: var(--gold); }
.slot {
  margin-left: auto; font-family: "IBM Plex Mono", monospace; font-size: 10px;
  letter-spacing: .06em; text-transform: uppercase; color: var(--muted); font-style: normal;
}
.blurb { margin: 5px 0 0; font-size: 13px; color: var(--muted); }
.stats { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 9px; font-family: "IBM Plex Mono", monospace; font-size: 12px; }
.stats i { font-style: normal; color: var(--muted); margin-right: 5px; }
.sub {
  font-family: "Zen Old Mincho", serif; font-size: 15px; margin: 0 0 6px;
  padding-bottom: 4px; border-bottom: 1px solid var(--line);
}
.sub i { font-style: normal; color: var(--muted); font-size: 12px; }
.scroll { margin-bottom: 20px; }
footer { margin-top: 44px; padding-top: 16px; border-top: 1px solid var(--line); color: var(--muted); font-size: 12.5px; }
footer code { font-family: "IBM Plex Mono", monospace; }
</style>

<div class="wrap">
<header>
  <h1>剑影 — <span>o catálogo</span></h1>
  <p class="sub-line">Tudo o que existe no jogo, lido das tabelas reais. Nada aqui foi escrito à mão: cada número vem da mesma função contra a qual o jogo rola, por isso não pode divergir do que vais encontrar.</p>
  <div class="counts">
    <span><b>${RARITIES.length}</b> raridades</span>
    <span><b>${AFFIX_SPECS.length}</b> tipos de linha</span>
    <span><b>${ITEMS.length}</b> bases</span>
    <span><b>${WEAPONS.length}</b> armas</span>
    <span><b>${ARTS.length}</b> artes</span>
    <span><b>${NAMED_POWERS.length}</b> poderes</span>
    <span><b>${REGIONS.length}</b> regiões</span>
    <span><b>${BAG_CAPACITY}</b> na mochila</span>
  </div>
</header>

<section>
  <p class="eyebrow">A escada</p>
  <h2>As seis raridades</h2>
  <p class="note">A raridade decide quantas linhas a peça rola e quanto maior cada uma sai. As probabilidades sobem com a profundidade, mas nenhum degrau fecha — a estrada mais fácil pode, raramente, entregar algo extraordinário.</p>
  <div class="tablewrap"><table class="t">
    <thead><tr><th>degrau</th><th class="n">linhas</th><th class="n">potência</th><th class="n">prof 1</th><th class="n">prof 3</th><th class="n">prof 5</th></tr></thead>
    <tbody>${rarityLadder}</tbody>
  </table></div>
</section>

<section>
  <p class="eyebrow">O que uma peça pode rolar</p>
  <h2>As ${AFFIX_SPECS.length} linhas</h2>
  <p class="note">Os quatro primeiros são os atributos que o hub já explica nas unidades do jogador. Os três últimos mudam a forma do golpe — e são mais raros de propósito, porque multiplicam tudo em vez de somar. Os intervalos vão do pior rolo comum ao melhor rolo imortal.</p>
  <div class="tablewrap"><table class="t">
    <thead><tr><th>linha</th><th class="n">prof 1</th><th class="n">prof 3</th><th class="n">prof 5</th><th class="n">peso</th></tr></thead>
    <tbody>${lines}</tbody>
  </table></div>
</section>

<section>
  <p class="eyebrow">Só em 神 e 仙</p>
  <h2>Os ${NAMED_POWERS.length} poderes com nome</h2>
  <p class="note">Cada um muda uma <b>regra</b>, nunca um número — uma lendária que desse "+18 Edge" seria uma rara com melhor cor. Um slot sem poder na tabela rola quatro linhas fortes em vez de receber um poder que não lhe assenta.</p>
  <div class="grid3">${powers}</div>
</section>

<section>
  <p class="eyebrow">A tua classe é o que levas na mão</p>
  <h2>As ${WEAPONS.length} armas</h2>
  <p class="note">O polegar está todo gasto no movimento, por isso a arma não é um conjunto de botões — é a forma do golpe que acontece sozinho. O DPS é próximo entre elas de propósito; o que difere é onde tens de estar.</p>
  <div class="grid2">${weapons}</div>
</section>

<section>
  <p class="eyebrow">De onde as peças saem</p>
  <h2>As ${ITEMS.length} bases</h2>
  <p class="note">Uma base é a silhueta e o slot, e nada mais — as linhas são roladas por drop. Duas bases do mesmo slot nunca partilham silhueta, senão uma peça seria invisível numa figura sem detalhe interior.</p>
  <div class="grid2">${bases}</div>
</section>

<section>
  <p class="eyebrow">${EQUIPPED_ARTS} ordenadas na aba 法 · a arma decide quantas acordam · grau até ${MAX_ART_LEVEL}</p>
  <h2>As ${ARTS.length} artes</h2>
  <p class="note">Cinco por arma, e cada arma cobre as cinco condições exatamente uma vez: nenhuma arma tem uma condição morta, e quem troca de arma mantém as mesmas cinco coisas a FAZER enquanto tudo o que elas produzem muda.</p>
  <p class="note"><b>As artes vêm do equipamento.</b> A arma decide <i>quais</i> e <i>quantas</i> acordam — uma lâmina 凡 acorda uma arte, uma 宝 acorda quatro, uma 神 acorda o pergaminho inteiro. O que vestes decide o <i>grau</i>: as raridades das quatro peças somadas, ${ATTUNE_PER_GRADE} pontos por grau, até ${MAX_ART_LEVEL}. Não há 感悟 a subir artes em combate e não há 秘笈 — duas escadas a subir o mesmo número, nenhuma delas presa a algo que se pudesse ver.</p>
  <div class="tablewrap"><table class="t">
    <thead><tr><th>arma</th><th class="n">artes acordadas</th><th>conjunto</th><th class="n">grau</th></tr></thead>
    <tbody>${attuneLadder}</tbody>
  </table></div>
  ${arts}
</section>

<section>
  <p class="eyebrow">Onde se caça</p>
  <h2>As ${REGIONS.length} regiões</h2>
  <div class="tablewrap"><table class="t">
    <thead><tr><th>região</th><th class="n">prof</th><th class="n">drop/abate</th><th>a sua pergunta</th></tr></thead>
    <tbody>${world}</tbody>
  </table></div>
</section>

<footer>
  Gerado por <code>tools/catalogo.mts</code> a partir de <code>src/data/</code>.
  Atributos: ${ATTRIBUTES.map((a) => `${a.seal} ${a.name}`).join(' · ')}.
</footer>
</div>
`

await writeFile(join(ROOT, 'docs', 'catalogo.html'), html, 'utf8')
console.log(
  `catalogo.html — ${RARITIES.length} raridades, ${AFFIX_SPECS.length} linhas, ${ITEMS.length} bases, ` +
    `${WEAPONS.length} armas, ${ARTS.length} artes, ${NAMED_POWERS.length} poderes, ${REGIONS.length} regiões`,
)
