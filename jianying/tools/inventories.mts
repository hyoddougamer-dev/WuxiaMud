/**
 * Four inventory screens, side by side, so one can be CHOSEN.
 *
 *   npx tsx tools/inventories.mts        # writes docs/inventories.html
 *
 * The equipment tab shipped as a column of slot headings with a sideways row
 * of cards under each. It works and it is dull: the rarity ladder is doing all
 * of its speaking through a left border 2–7px wide, the pack is never seen as
 * a whole, and nothing on the screen looks like the thing the genre has taught
 * players to want to look at.
 *
 * So: the two archetypes the genre actually converged on, and two that only
 * this game could have. Every one of them is drawn from the REAL tables —
 * RARITIES for the ladder, ITEMS for the bases, rollAffixes for the lines,
 * itemIconSvg for the shapes. A mockup that invents its own colours is a
 * mockup that promises a screen the game cannot build.
 *
 * The pieces are rolled from one fixed seed, so re-running this produces the
 * same pack and two proposals can be compared without the loot moving.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Rng } from '../src/core/rng'
import { ITEMS, SLOT_NAMES, type Slot } from '../src/data/items'
import { RARITIES, rarityOf, type Rarity } from '../src/data/rarity'
import { NAMED_POWERS, affixLine, rollAffixes, type Affix } from '../src/data/affixes'
import { itemIconSvg } from '../src/render/packIcons'
import { palette } from '../src/render/palette'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'docs')

const hex = (n: number): string => `#${n.toString(16).padStart(6, '0')}`
const INK = hex(palette.ink)
const PAPER = hex(palette.paper)
const GOLD = hex(palette.goldDeep)
const CINNABAR = hex(palette.cinnabar)

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// --- the pack these screens all show ---------------------------------------

interface Piece {
  base: (typeof ITEMS)[number]
  rarity: Rarity
  affixes: Affix[]
  power: string | null
  depth: number
  worn: boolean
}

const byId = (id: string) => ITEMS.find((i) => i.id === id)!

/**
 * One pack, spanning the whole ladder.
 *
 * Hand-picked rungs rather than rolled ones: a rolled pack at honest weights
 * is eleven commons and a green, which is correct for the game and useless for
 * judging a screen whose entire job is showing six rungs apart. The LINES are
 * still rolled, at the tier's real potency, so the numbers are the game's.
 */
const rollPack = (): Piece[] => {
  const rng = new Rng(0x5eed)
  const spec: Array<[string, Rarity, number, string | null, boolean]> = [
    ['w-great', 5, 6, 'echo', true],
    ['r-lamellar', 4, 5, 'ward', true],
    ['h-hat', 3, 4, null, true],
    ['s-pauldron', 2, 4, null, true],
    ['w-feidao', 4, 5, 'frost', false],
    ['r-court', 3, 5, null, false],
    ['h-crown', 5, 6, 'greed', false],
    ['s-mantle', 1, 3, null, false],
    ['r-travelling', 2, 3, null, false],
    ['h-topknot', 0, 2, null, false],
    ['s-wide', 3, 4, null, false],
    ['r-tattered', 1, 3, null, false],
    ['h-veiled', 4, 5, null, false],
    ['s-plain', 0, 1, null, false],
    ['r-plain', 0, 2, null, false],
    ['w-feidao', 1, 2, null, false],
  ]
  return spec.map(([id, rarity, depth, power, worn]) => ({
    base: byId(id),
    rarity,
    affixes: rollAffixes(rarity, depth, rng),
    power,
    depth,
    worn,
  }))
}

const PACK = rollPack()
const wornIn = (slot: Slot) => PACK.find((p) => p.worn && p.base.slot === slot)
const powerOf = (p: Piece) => (p.power ? NAMED_POWERS.find((n) => n.id === p.power)! : null)

/** The rung's four channels, as inline custom properties. See data/rarity.ts. */
const rung = (r: Rarity): string => {
  const t = rarityOf(r)
  const rgb = `${(t.colour >> 16) & 0xff},${(t.colour >> 8) & 0xff},${t.colour & 0xff}`
  return (
    `--rung:${t.css};--rung-rgb:${rgb};--rung-edge:${t.card.edge}px;` +
    `--rung-wash:${t.card.wash};--rung-glow:${t.card.glow};--rung-weight:${t.card.weight}`
  )
}

const icon = (p: Piece, opacity = 0.75): string =>
  itemIconSvg(p.base.slot, p.base.styleId, palette.ink, opacity, 'ico')

// --- A · 铺 the paperdoll ---------------------------------------------------

const paperdoll = (): string => {
  const cell = (slot: Slot): string => {
    const p = wornIn(slot)
    if (!p) return `<div class="pd-slot pd-empty"><span>${SLOT_NAMES[slot]}</span></div>`
    return `<div class="pd-slot" style="${rung(p.rarity)}">
      ${icon(p, 0.85)}
      <b>${esc(p.base.name)}</b>
      <span>${rarityOf(p.rarity).seal} ${rarityOf(p.rarity).name}</span>
    </div>`
  }
  const loose = PACK.filter((p) => !p.worn)
  return `<div class="scr scr-a">
    <div class="hd"><b>Shen Baoyu</b><span>Foundation Building · 12</span></div>
    <div class="pd">
      <div class="pd-col">${cell('head')}${cell('shoulders')}</div>
      <div class="pd-fig">${FIGURE}</div>
      <div class="pd-col">${cell('robe')}${cell('weapon')}</div>
    </div>
    <div class="pd-bar"><span>PACK</span><b>${loose.length} / 24</b>
      <div class="pd-track"><i style="width:${Math.round((loose.length / 24) * 100)}%"></i></div>
    </div>
    <div class="pd-grid">
      ${loose
        .map(
          (p) => `<div class="pd-cell" style="${rung(p.rarity)}">
            ${icon(p, 0.7)}<i>${rarityOf(p.rarity).seal}</i>
          </div>`,
        )
        .join('')}
      ${Array.from({ length: 24 - loose.length }, () => '<div class="pd-cell pd-void"></div>').join('')}
    </div>
  </div>`
}

// --- B · 格 the grid --------------------------------------------------------

const grid = (): string => {
  const focus = PACK.find((p) => p.base.id === 'h-crown')!
  const t = rarityOf(focus.rarity)
  const power = powerOf(focus)
  return `<div class="scr scr-b">
    <div class="hd"><b>Pack</b><span>${PACK.filter((p) => !p.worn).length} / 24 · hold a cell</span></div>
    <div class="gd">
      ${PACK.map(
        (p) => `<div class="gd-cell${p.worn ? ' gd-worn' : ''}${
          p === focus ? ' gd-on' : ''
        }" style="${rung(p.rarity)}">${icon(p, 0.8)}${
          p.worn ? '<u></u>' : ''
        }</div>`,
      ).join('')}
    </div>
    <div class="tip" style="${rung(focus.rarity)}">
      <div class="tip-hd">
        <b>${esc(focus.base.name)}</b>
        <span>${t.seal} ${t.name} · ${SLOT_NAMES[focus.base.slot]}</span>
      </div>
      ${focus.affixes.map((a) => `<div class="tip-line">${esc(affixLine(a))}</div>`).join('')}
      ${
        power
          ? `<div class="tip-power"><b>${power.seal} ${esc(power.name)}</b><span>${esc(
              power.blurb,
            )}</span></div>`
          : ''
      }
      <div class="tip-act">WEAR · +2 art grade, −14 health</div>
    </div>
  </div>`
}

// --- C · 秤 the scales ------------------------------------------------------

/**
 * Not a list of what you own. A RANKING of what each piece would do to you.
 *
 * The deltas here are illustrative, not derived — this screen is a proposal
 * about layout, and wiring deriveStats into a mockup would make it slower to
 * change than the thing it is proposing.
 */
const scales = (): string => {
  const rows: Array<[string, Rarity, string, number]> = [
    ['Jade Crown', 5, '+2 art grade · +19 Spirit', 1],
    ['Veiled Hat', 4, '+14 Spirit · +9 Swiftness', 0.62],
    ['Bamboo Hat', 3, '+12 Spirit', 0],
    ['Bound Topknot', 0, '+4 Body', -0.34],
  ]
  return `<div class="scr scr-c">
    <div class="hd"><b>Head</b><span>4 pieces · ranked by what they do</span></div>
    <div class="sc-tabs">
      ${(['weapon', 'head', 'shoulders', 'robe'] as Slot[])
        .map((s) => `<span class="${s === 'head' ? 'on' : ''}">${SLOT_NAMES[s]}</span>`)
        .join('')}
    </div>
    <div class="sc-list">
      ${rows
        .map(([name, r, line, d]) => {
          const t = rarityOf(r)
          const worn = d === 0
          const pct = Math.round(Math.abs(d) * 46)
          return `<div class="sc-row${worn ? ' sc-worn' : ''}" style="${rung(r)}">
            <div class="sc-name"><b>${t.seal} ${esc(name)}</b><span>${esc(line)}</span></div>
            <div class="sc-bar">
              <div class="sc-mid"></div>
              <i class="${d >= 0 ? 'up' : 'down'}" style="width:${pct}%"></i>
            </div>
            <div class="sc-d ${worn ? 'now' : d > 0 ? 'up' : 'down'}">${
              worn ? 'WORN' : (d > 0 ? '+' : '') + Math.round(d * 31) + '%'
            }</div>
          </div>`
        })
        .join('')}
    </div>
    <div class="sc-foot">Measured against what you wear now, on the road you chose.</div>
  </div>`
}

// --- D · 卷 the scroll ------------------------------------------------------

/**
 * The ladder AS TYPOGRAPHY. No borders at all: the seal is the rung — its
 * size, its weight, its colour and, at the top, its halo. It is the only one of
 * the four that could not be a screenshot of some other game.
 */
const scroll = (): string => {
  const size = [22, 26, 31, 37, 44, 52]
  return `<div class="scr scr-d">
    <div class="hd"><b>What you carry</b><span>16 pieces · the seal is the rung</span></div>
    <div class="sl">
      ${PACK.filter((p) => !p.worn)
        .sort((a, b) => b.rarity - a.rarity)
        .map((p) => {
          const t = rarityOf(p.rarity)
          const power = powerOf(p)
          return `<div class="sl-row" style="${rung(p.rarity)}">
            <div class="sl-seal" style="font-size:${size[p.rarity]}px">${t.seal}</div>
            <div class="sl-body">
              <b>${esc(p.base.name)}</b>
              <span>${esc(p.affixes.map(affixLine).join(' · '))}</span>
              ${power ? `<em>${power.seal} ${esc(power.name)}</em>` : ''}
            </div>
            ${icon(p, 0.34)}
          </div>`
        })
        .join('')}
    </div>
  </div>`
}

// --- the ladder strip, on every page ---------------------------------------

const ladder = (): string =>
  `<div class="ladder">${RARITIES.map(
    (t) => `<div class="lg" style="${rung(t.id)}">
      <i>${t.seal}</i><b>${t.name}</b><span>${t.affixes} line${t.affixes > 1 ? 's' : ''}</span>
    </div>`,
  ).join('')}</div>`

/** A plain ink figure, so the paperdoll has a body without pulling the renderer in. */
const FIGURE = `<svg viewBox="0 0 60 110" class="fig" aria-hidden="true">
  <ellipse cx="30" cy="104" rx="17" ry="4" fill="${INK}" opacity="0.12"/>
  <path d="M30 14c7 0 11 5 11 12 0 9-4 14-11 14s-11-5-11-14c0-7 4-12 11-12z" fill="${INK}"/>
  <path d="M17 41h26l6 34-5 27H16l-5-27z" fill="${INK}"/>
  <path d="M20 41l-8 30 5 2 8-28z" fill="${INK}"/>
  <path d="M40 41l8 30-5 2-8-28z" fill="${INK}"/>
  <path d="M21 68h18l-2 8H23z" fill="${CINNABAR}" opacity="0.85"/>
  <path d="M46 26l6-8 3 3-7 8z" fill="${GOLD}"/>
</svg>`

interface Proposal {
  id: string
  seal: string
  name: string
  kin: string
  screen: string
  buys: string
  costs: string
}

const PROPOSALS: Proposal[] = [
  {
    id: 'a',
    seal: '铺',
    name: 'The Paperdoll',
    kin: 'Diablo II · Diablo IV',
    screen: paperdoll(),
    buys:
      'O que vestes é uma IMAGEM, não uma lista. As quatro peças ladeiam a figura, a ' +
      'mochila é uma grelha fixa de 24 casas por baixo, e uma casa vazia é tão visível ' +
      'quanto uma cheia — por isso “o que me falta?” é respondido pela forma do ecrã, não ' +
      'por um texto. É também o único dos quatro em que a raridade toca no CORPO: uma peça ' +
      '仙 acende a casa que está encostada à silhueta.',
    costs:
      'Quatro slots dão um paperdoll magro. O Diablo pendura dez peças na figura; aqui o ' +
      'terço do meio carrega uma silhueta que o separador 剑 já mostra, e a duplicação nota-se. ' +
      'A casa da grelha tem 56px: cabe um ícone e um selo, não um nome — tudo o resto exige ' +
      'um segundo toque.',
  },
  {
    id: 'b',
    seal: '格',
    name: 'The Grid',
    kin: 'Path of Exile · Last Epoch',
    screen: grid(),
    buys:
      'Tudo de uma vez, e a escada de raridade É o layout. Vinte e quatro casas, sem ' +
      'cabeçalhos de slot, sem scroll: o olho encontra os bordos grossos primeiro e o resto ' +
      'é textura. O canto vermelho marca o que está vestido sem lhe roubar o degrau. Manter ' +
      'premido abre a folha inteira — linhas, poder com nome, e o que vestir custa.',
    costs:
      'Os ícones de armadura são por SLOT, não por peça: todos os mantos do jogo desenham a ' +
      'mesma forma. Numa grelha isso significa que os bordos fazem o trabalho todo e seis ' +
      'mantos lêem-se como seis retângulos coloridos. Tem conserto, mas são seis ícones novos ' +
      'por slot — trabalho de arte, não de CSS.',
  },
  {
    id: 'c',
    seal: '秤',
    name: 'The Scales',
    kin: 'original — a comparação é o ecrã',
    screen: scales(),
    buys:
      'O ecrã não é o que tens, é o que cada peça FARIA. Um slot de cada vez, candidatos ' +
      'ordenados pela mudança que provocam, a peça vestida presa no zero. Nunca abres nada: a ' +
      'comparação é o layout, não um painel por cima dele. É o que serve o theorycrafting — ' +
      'quatro peças e quatro respostas, sem memorizar números entre ecrãs.',
    costs:
      'Esconde o item atrás do número. Uma peça 仙 que te entusiasmou a encontrar lê-se como ' +
      '“+31%”, e o loot deixa de ser um momento. E tem de escolher UM número para ordenar: ' +
      'uma build que quer alcance e outra que quer vida discordam sobre qual, por isso ou ' +
      'escolhes por elas ou acrescentas um seletor que traz de volta a complexidade que este ' +
      'ecrã existia para tirar.',
  },
  {
    id: 'd',
    seal: '卷',
    name: 'The Scroll',
    kin: 'original — o degrau é a tipografia',
    screen: scroll(),
    buys:
      'Zero bordos. O selo é o degrau: 凡 é pequeno e cinzento, 仙 é enorme e cinábrio com ' +
      'halo, e os seis passos são uma rampa de tamanho que se sente antes de se ler. É o único ' +
      'dos quatro que não podia ser a captura de ecrã do jogo de outra pessoa — e o único que ' +
      'usa os selos que o jogo já tem em vez de os repetir num canto.',
    costs:
      'Um jogador chega já a saber cinzento→verde→azul→roxo→dourado. Não chega a saber ' +
      '凡良珍宝神仙, portanto a primeira hora custa-lhe uma escada que antes vinha de graça. ' +
      'E uma linha tem 64px de altura: a mochila passa a ser um scroll, nunca um relance.',
  },
]

/**
 * The page these screens are shown on.
 *
 * SINGLE THEME, DELIBERATELY. Every artifact here is a phone running a game
 * drawn as ink on aged paper, and a mockup that turns paper into charcoal
 * because the reader's OS is dark is a mockup that lies about the product.
 * So the frames are always paper, the wall around them is always dark, and
 * every colour is painted explicitly rather than inherited.
 */
const page = (): string => `<title>The Pack, Four Ways</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400;9..144,600;9..144,700&family=Archivo:wght@400;500;600&display=swap">
<style>
  :root {
    /* The game's own four. Nothing on a phone frame may come from anywhere else. */
    --ink: ${INK};
    --paper: ${PAPER};
    --gold: ${GOLD};
    --cinnabar: ${CINNABAR};
    /* The wall. Warm-violet bias rather than neutral grey, so the paper frames
       read as warm objects on a cool ground instead of as brighter grey. */
    --wall: #141317;
    --wall-2: #1c1a21;
    --edge: #2b2833;
    --text: #e9e4d9;
    --dim: #958e83;
    --display: Fraunces, "Iowan Old Style", Georgia, serif;
    --body: Archivo, "Helvetica Neue", Arial, sans-serif;
    color-scheme: dark;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--wall);
    color: var(--text);
    font: 400 15px/1.65 var(--body);
    -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: 1160px; margin: 0 auto; padding: 40px 20px 96px; }

  h1 {
    font: 700 clamp(30px, 6vw, 46px)/1.05 var(--display);
    font-variation-settings: "SOFT" 30, "WONK" 1, "opsz" 120;
    margin: 0 0 10px;
    text-wrap: balance;
    letter-spacing: -0.015em;
  }
  .sub { color: var(--dim); margin: 0 0 26px; max-width: 62ch; }
  .sub b { color: var(--text); font-weight: 500; }

  /* The legend. Everything below refers to these six, so they are stated once,
     apart from any screen, before the first proposal. */
  .ladder { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 12px; }
  .lg {
    flex: 1 1 116px; padding: 9px 11px 10px; border-radius: 2px;
    background: rgba(var(--rung-rgb), calc(var(--rung-wash) * 3.4)), var(--wall-2);
    border: 1px solid rgba(var(--rung-rgb), 0.32);
    border-left: var(--rung-edge) solid var(--rung);
    box-shadow: 0 0 20px -6px rgba(var(--rung-rgb), var(--rung-glow));
  }
  .lg i {
    font-style: normal; font-size: 19px; line-height: 1;
    color: var(--rung); filter: brightness(1.85) saturate(0.9);
  }
  .lg b { display: block; font-family: var(--display); font-weight: 600; font-size: 14px; margin-top: 3px; }
  .lg span {
    display: block; font-size: 10.5px; letter-spacing: 0.07em;
    text-transform: uppercase; color: var(--dim);
  }
  .legend {
    margin: 0 0 30px; font-size: 12.5px; color: var(--dim);
    border-left: 2px solid var(--edge); padding-left: 11px;
  }

  /* Four seals, sticky, so a phone reader can jump rather than scroll. */
  .rail {
    position: sticky; top: 0; z-index: 5; display: flex; gap: 6px;
    padding: 10px 0; margin-bottom: 26px;
    background: linear-gradient(var(--wall) 72%, transparent);
  }
  .rail a {
    flex: 1; display: flex; align-items: center; gap: 8px;
    padding: 8px 11px; text-decoration: none; color: var(--text);
    background: var(--wall-2); border: 1px solid var(--edge); border-radius: 2px;
  }
  .rail a:hover, .rail a:focus-visible { border-color: var(--cinnabar); outline: none; }
  .rail em { font-style: normal; font-size: 17px; color: var(--cinnabar); }
  .rail span { font: 500 12px/1.2 var(--body); }
  @media (max-width: 620px) { .rail span { display: none; } .rail a { justify-content: center; } }

  .prop { padding-top: 14px; margin: 0 0 54px; scroll-margin-top: 68px; }
  .prop-hd { display: flex; align-items: center; gap: 13px; margin-bottom: 16px; }
  .prop-seal {
    width: 40px; height: 40px; flex: none; display: grid; place-items: center;
    background: var(--cinnabar); color: var(--paper); border-radius: 2px; font-size: 21px;
  }
  h2 {
    margin: 0; font: 600 25px/1.15 var(--display);
    font-variation-settings: "SOFT" 24, "WONK" 1, "opsz" 60;
    letter-spacing: -0.01em;
  }
  .kin {
    font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--dim);
  }
  .prop-body { display: grid; grid-template-columns: 390px minmax(0, 1fr); gap: 30px; align-items: start; }
  @media (max-width: 800px) { .prop-body { grid-template-columns: 1fr; } .scr { margin: 0 auto; } }
  .notes { max-width: 58ch; }
  .notes p { margin: 0 0 15px; }
  .lbl {
    display: block; font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--gold); filter: brightness(1.8); margin-bottom: 2px;
  }
  .cost .lbl { color: var(--cinnabar); filter: brightness(1.3); }

  /* ---------------------------------------------------------------- phone */
  .scr {
    width: 390px; height: 720px; overflow: hidden;
    background: var(--paper); color: var(--ink); border-radius: 13px;
    padding: 14px 14px 0; font: 400 13px/1.45 var(--body);
    box-shadow: 0 22px 60px -20px #000, 0 0 0 1px #000;
  }
  .scr .ico { width: 22px; height: 22px; }
  .hd {
    display: flex; align-items: baseline; justify-content: space-between; gap: 10px;
    padding-bottom: 9px; border-bottom: 1px solid rgba(13,13,13,0.14); margin-bottom: 11px;
  }
  .hd b { font: 600 16px/1.2 var(--display); }
  .hd span { font-size: 11px; color: rgba(13,13,13,0.5); }

  /* A — paperdoll */
  .pd { display: grid; grid-template-columns: 1fr 92px 1fr; gap: 7px; align-items: center; }
  .pd-col { display: grid; gap: 7px; }
  .pd-fig { display: grid; place-items: center; }
  .fig { width: 78px; height: 143px; }
  .pd-slot {
    padding: 7px 8px 7px 32px; position: relative; min-height: 46px; border-radius: 2px;
    background: rgba(var(--rung-rgb), calc(var(--rung-wash) * 1.5)), rgba(255,252,244,0.55);
    border: 1px solid rgba(13,13,13,0.1);
    border-left: var(--rung-edge) solid var(--rung);
    box-shadow: 0 0 12px -3px rgba(var(--rung-rgb), var(--rung-glow));
  }
  .pd-slot .ico { position: absolute; left: 6px; top: 50%; transform: translateY(-50%); }
  .pd-slot b {
    display: block; font-size: 11.5px; font-weight: var(--rung-weight);
    color: var(--rung); filter: saturate(0.9) brightness(0.9);
  }
  .pd-slot span { font-size: 10px; color: rgba(13,13,13,0.5); }
  .pd-empty { padding-left: 8px; border-left: 2px dashed rgba(13,13,13,0.2); }
  .pd-empty span { color: var(--cinnabar); opacity: 0.7; }
  .pd-bar {
    display: flex; gap: 8px; align-items: center; margin: 13px 0 8px;
    font-size: 10.5px; letter-spacing: 0.08em; color: rgba(13,13,13,0.5);
  }
  .pd-bar b { color: var(--ink); letter-spacing: 0; font-variant-numeric: tabular-nums; }
  .pd-track { flex: 1; height: 3px; background: rgba(13,13,13,0.1); border-radius: 2px; }
  .pd-track i { display: block; height: 100%; background: var(--ink); opacity: 0.45; }
  .pd-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
  .pd-cell {
    aspect-ratio: 1; position: relative; display: grid; place-items: center; border-radius: 2px;
    background: rgba(var(--rung-rgb), calc(var(--rung-wash) * 2)), rgba(255,252,244,0.5);
    border: var(--rung-edge) solid var(--rung);
    box-shadow: 0 0 10px -2px rgba(var(--rung-rgb), var(--rung-glow));
  }
  .pd-cell .ico { width: 30px; height: 30px; }
  .pd-cell i {
    position: absolute; right: 3px; bottom: 1px; font-style: normal;
    font-size: 11px; color: var(--rung); filter: brightness(0.85);
  }
  .pd-void { border: 1px dashed rgba(13,13,13,0.16); background: none; box-shadow: none; }

  /* B — grid */
  .gd { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
  .gd-cell {
    aspect-ratio: 1; position: relative; display: grid; place-items: center; border-radius: 2px;
    background: rgba(var(--rung-rgb), calc(var(--rung-wash) * 2.2)), rgba(255,252,244,0.5);
    border: var(--rung-edge) solid var(--rung);
    box-shadow: 0 0 14px -3px rgba(var(--rung-rgb), var(--rung-glow));
  }
  .gd-cell .ico { width: 30px; height: 30px; }
  /* A worn piece is corner-marked, not recoloured — the rung must keep the cell. */
  .gd-worn u {
    position: absolute; top: 0; right: 0; width: 0; height: 0;
    border-top: 11px solid var(--cinnabar); border-left: 11px solid transparent;
  }
  .gd-on { outline: 2px solid var(--ink); outline-offset: 2px; }
  .gd-void { border: 1px dashed rgba(13,13,13,0.16); background: none; box-shadow: none; }
  .tip {
    margin-top: 11px; padding: 11px 13px 12px; border-radius: 2px;
    background: rgba(var(--rung-rgb), calc(var(--rung-wash) * 2)), rgba(255,252,244,0.78);
    border: 2px solid var(--rung);
    box-shadow: 0 0 24px -5px rgba(var(--rung-rgb), var(--rung-glow));
  }
  .tip-hd b {
    display: block; font: var(--rung-weight) 17px/1.2 var(--display);
    color: var(--rung); filter: saturate(0.9) brightness(0.85);
  }
  .tip-hd span { font-size: 10.5px; color: rgba(13,13,13,0.5); }
  .tip-line { font-size: 12px; color: rgba(13,13,13,0.72); font-variant-numeric: tabular-nums; }
  .tip-power { margin-top: 7px; padding-top: 7px; border-top: 1px solid rgba(13,13,13,0.12); }
  .tip-power b { display: block; font-size: 12px; color: var(--gold); }
  .tip-power span { font-size: 11px; color: rgba(13,13,13,0.55); }
  .tip-act { margin-top: 9px; font-size: 10.5px; letter-spacing: 0.08em; color: var(--gold); }

  /* C — scales */
  .sc-tabs { display: flex; gap: 5px; margin-bottom: 11px; }
  .sc-tabs span {
    flex: 1; text-align: center; padding: 6px 0; font-size: 11px;
    border-bottom: 2px solid rgba(13,13,13,0.12); color: rgba(13,13,13,0.45);
  }
  .sc-tabs .on { border-bottom-color: var(--cinnabar); color: var(--ink); font-weight: 600; }
  .sc-list { display: grid; gap: 7px; }
  .sc-row {
    display: grid; grid-template-columns: minmax(0,1fr) 96px 52px; gap: 9px; align-items: center;
    padding: 9px 10px; border-radius: 2px;
    background: rgba(var(--rung-rgb), calc(var(--rung-wash) * 1.6)), rgba(255,252,244,0.5);
    border: 1px solid rgba(13,13,13,0.1);
    border-left: var(--rung-edge) solid var(--rung);
    box-shadow: 0 0 12px -3px rgba(var(--rung-rgb), var(--rung-glow));
  }
  .sc-worn { background: rgba(13,13,13,0.88); }
  .sc-worn .sc-name span { color: rgba(232,220,192,0.55); }
  .sc-name b {
    display: block; font: var(--rung-weight) 13.5px/1.25 var(--display);
    color: var(--rung); filter: saturate(0.9) brightness(1.05);
  }
  .sc-name span { font-size: 10.5px; color: rgba(13,13,13,0.55); }
  .sc-bar { position: relative; height: 6px; background: rgba(13,13,13,0.09); border-radius: 3px; }
  .sc-mid { position: absolute; left: 50%; top: -3px; bottom: -3px; width: 1px; background: rgba(13,13,13,0.3); }
  .sc-bar i { position: absolute; top: 0; bottom: 0; border-radius: 3px; }
  .sc-bar .up { left: 50%; background: #2f7a4a; }
  .sc-bar .down { right: 50%; background: var(--cinnabar); }
  .sc-d { text-align: right; font-size: 12.5px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .sc-d.up { color: #2f7a4a; }
  .sc-d.down { color: var(--cinnabar); }
  .sc-d.now { font-size: 9.5px; letter-spacing: 0.08em; color: rgba(232,220,192,0.7); }
  .sc-foot { margin-top: 13px; font-size: 10.5px; color: rgba(13,13,13,0.45); }

  /* D — scroll */
  .sl { display: grid; gap: 3px; }
  .sl-row {
    display: grid; grid-template-columns: 58px minmax(0,1fr) 22px; gap: 9px; align-items: center;
    padding: 7px 4px; border-bottom: 1px solid rgba(13,13,13,0.07);
  }
  .sl-seal {
    text-align: center; line-height: 1; color: var(--rung); font-weight: var(--rung-weight);
    filter: saturate(0.95) brightness(0.92);
    text-shadow: 0 0 calc(var(--rung-glow) * 34px) rgba(var(--rung-rgb), var(--rung-glow));
  }
  .sl-body b { display: block; font: var(--rung-weight) 13.5px/1.25 var(--display); }
  .sl-body span { display: block; font-size: 10.5px; color: rgba(13,13,13,0.55); }
  .sl-body em { font-style: normal; font-size: 10.5px; color: var(--gold); }

  @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
</style>
<div class="wrap">
  <h1>The Pack, Four Ways</h1>
  <p class="sub">Quatro ecrãs de inventário para o 剑影, todos desenhados a partir das
    tabelas do próprio jogo: os seis degraus e os seus pesos de bordo, lavagem e halo,
    as bases dos itens, as linhas roladas com a semente <b>0x5EED</b> e os ícones da mochila.
    Nenhum inventa uma cor que o jogo não saiba já produzir — o que vês é o que se pode
    construir, não uma ilustração.</p>
  ${ladder()}
  <p class="legend">A escada, uma vez, fora de qualquer ecrã. Sobe em quatro canais ao
    mesmo tempo — cor, espessura do bordo, lavagem de fundo e halo — porque só o tom
    fazia os seis degraus lerem-se como seis sombras em vez de seis passos.</p>

  <nav class="rail">
    ${PROPOSALS.map(
      (p) => `<a href="#${p.id}"><em>${p.seal}</em><span>${p.name}</span></a>`,
    ).join('')}
  </nav>

  ${PROPOSALS.map(
    (p) => `<section class="prop" id="${p.id}">
      <div class="prop-hd">
        <div class="prop-seal">${p.seal}</div>
        <div>
          <h2>${p.name}</h2>
          <div class="kin">${p.kin}</div>
        </div>
      </div>
      <div class="prop-body">
        ${p.screen}
        <div class="notes">
          <p><span class="lbl">O que compra</span>${p.buys}</p>
          <p class="cost"><span class="lbl">O que custa</span>${p.costs}</p>
        </div>
      </div>
    </section>`,
  ).join('')}
</div>
`

await mkdir(OUT, { recursive: true })
const file = join(OUT, 'inventories.html')
await writeFile(file, page(), 'utf8')
console.log(`wrote ${file}`)
