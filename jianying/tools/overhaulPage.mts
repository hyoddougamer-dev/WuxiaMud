/**
 * The overhaul: how this becomes an ARPG a Diablo player recognises.
 *
 *   npx tsx tools/overhaulPage.mts        # writes docs/overhaul.html
 *
 * THE ONE-SENTENCE DIAGNOSIS, and everything here follows from it: in this game
 * you never CHOOSE a skill and you never see one fire BECAUSE you chose it.
 *
 * Today an art wakes if your weapon's rung reaches far enough down a list you
 * ranked, and it fires if your movement happens to satisfy a condition you were
 * never shown, scaled by a 势 bank that is drawn nowhere. Every part of that is
 * defensible on its own and the sum is a build the player cannot name. Ask
 * someone playing PoE what they are and you get "cyclone slayer" in two words.
 * Ask someone here and the honest answer is "I don't know, it does things."
 *
 * So the overhaul is not new systems. It is the same pieces, re-pointed at the
 * skeleton every ARPG in that list shares: skills you pick and watch, a
 * resource they spend, modifiers that name them, and loot that changes the
 * build rather than only the numbers. What stays unique is what was always
 * unique — the weapon IS the class, and movement is where power comes from.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { palette } from '../src/render/palette'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'docs')
const hex = (n: number): string => `#${n.toString(16).padStart(6, '0')}`
const INK = hex(palette.ink)
const CINNABAR = hex(palette.cinnabar)
const GOLD = hex(palette.goldDeep)

const FIGURE = `<svg viewBox="0 0 60 110" class="fig">
  <ellipse cx="30" cy="104" rx="16" ry="4" fill="${INK}" opacity="0.12"/>
  <path d="M30 14c7 0 11 5 11 12 0 9-4 14-11 14s-11-5-11-14c0-7 4-12 11-12z" fill="${INK}"/>
  <path d="M17 41h26l6 34-5 27H16l-5-27z" fill="${INK}"/>
  <path d="M20 41l-8 30 5 2 8-28z" fill="${INK}"/>
  <path d="M40 41l8 30-5 2-8-28z" fill="${INK}"/>
  <path d="M21 68h18l-2 8H23z" fill="${CINNABAR}" opacity="0.85"/>
  <path d="M46 26l7-9 3 3-8 9z" fill="${GOLD}"/>
</svg>`

const MOB = (x: number, y: number, s = 1): string =>
  `<svg viewBox="0 0 30 44" class="mob" style="left:${x}%;top:${y}%;--m:${s}">
    <path d="M15 6c4 0 6 3 6 7s-2 7-6 7-6-3-6-7 2-7 6-7z" fill="${INK}"/>
    <path d="M9 21h12l3 15-2 8H8l-2-8z" fill="${INK}"/>
  </svg>`

/** A skill tile: seal, cooldown sweep, momentum cost. */
const tile = (seal: string, ready: number, cost: number, active = false): string =>
  `<div class="tile${active ? ' tile-on' : ''}">
    <span class="tile-seal">${seal}</span>
    ${ready < 1 ? `<i class="tile-cd" style="height:${Math.round((1 - ready) * 100)}%"></i>` : ''}
    <u class="tile-cost">${'&#9679;'.repeat(cost)}</u>
  </div>`

// --- the three screens ------------------------------------------------------

const screenPlay = (): string => `<div class="scr">
  <div class="topbar">
    <div class="topbar-lead"><span>The Post Road</span><b>RIFT</b></div>
    <div class="topbar-rift"><i style="width:38%"></i></div>
    <div class="topbar-num">38%</div>
  </div>
  ${MOB(20, 30)}${MOB(74, 26, 0.9)}${MOB(62, 52, 0.85)}${MOB(34, 58, 0.8)}
  <div class="hero">${FIGURE}</div>
  <div class="cast">一斩</div>
  <div class="console">
    <div class="hp"><i style="width:74%"></i><em>152 / 205</em></div>
    <!-- THE RESOURCE. Every ARPG has one and this game's was invisible. -->
    <div class="shi">
      <span>势</span>
      <div class="shi-track">
        ${[1, 2, 3, 4].map((i) => `<i class="${i <= 3 ? 'on' : ''}"></i>`).join('')}
      </div>
      <b>3 / 4</b>
    </div>
    <div class="tiles">
      ${tile('沉', 1, 1)}${tile('山', 0.45, 2)}${tile('一斩', 1, 2, true)}
    </div>
  </div>
</div>`

const screenSkills = (): string => `<div class="scr scr-ui">
  <div class="ui-hd"><b>Skills</b><span>斩马刀 · pick three</span></div>
  <div class="slots">
    ${[
      ['沉', 'Sink', '1', '4s'],
      ['山', 'Mountain', '2', '9s'],
      ['一斩', 'One Cut', '2', '7s'],
    ].map(([s, n, c, cd]) => `<div class="slot">
      <span class="slot-seal">${s}</span>
      <b>${n}</b>
      <span class="slot-meta">${c} 势 · ${cd}</span>
    </div>`).join('')}
  </div>
  <div class="detail">
    <div class="detail-hd"><span>山</span><b>Mountain</b></div>
    <div class="detail-line">Plant yourself. What reaches you lands lighter for 4s.</div>
    <div class="detail-rows">
      <div><span>Custo</span><b>2 势</b></div>
      <div><span>Recarga</span><b>9 s</b></div>
      <div><span>Redução</span><b>34%</b></div>
    </div>
    <!-- THE CONDITION, as a printed modifier rather than as the firing rule. -->
    <div class="detail-cond">围 <b>Cercado:</b> +50% de redução com 3 ou mais inimigos perto</div>
    <div class="detail-gear">Do teu equipamento: <b>+18% Mountain</b> · <b>−1 势 de custo</b></div>
  </div>
  <div class="known"><span>Sabes mais 4</span>
    ${['碾', '裂', '定', '影'].map((s) => `<i>${s}</i>`).join('')}
  </div>
</div>`

const screenGear = (): string => `<div class="scr scr-ui">
  <div class="ui-hd"><b>Iron Pauldrons</b><span>神 Divine · Shoulders</span></div>
  <div class="affixes">
    ${[
      ['+57', 'Health', false],
      ['+11%', 'Sweep speed', false],
      ['+18%', 'Mountain damage', true],
      ['−1', 'Momentum cost of Mountain', true],
    ].map(([n, w, skill]) => `<div class="af${skill ? ' af-skill' : ''}">
      <b>${n}</b><span>${w}</span>
    </div>`).join('')}
  </div>
  <div class="power"><b>守 Unbroken Vigil</b><span>Standing still for two seconds mends a sliver of health.</span></div>
  <div class="cmp">
    ${[['Health', '148 → 205', true], ['Mountain', '34% → 52%', true], ['Momentum', '4 → 4', false]]
      .map(([w, v, up]) => `<div class="cmp-row"><span>${w}</span><b class="${up ? 'up' : ''}">${v}</b></div>`)
      .join('')}
  </div>
  <div class="wear">VESTIR</div>
</div>`

interface Change {
  n: string
  seal: string
  title: string
  before: string
  after: string
  why: string
}

const CHANGES: Change[] = [
  {
    n: '1',
    seal: '技',
    title: 'As artes viram skills que TU escolhes',
    before:
      'Hoje: o degrau da tua arma decide quantas artes "acordam", por uma ordem que ' +
      'ordenaste num ecrã. Com uma lâmina comum acorda UMA. Nunca escolhes; herdas.',
    after:
      'Passa a: sabes um conjunto de skills e metes <b>três</b> na barra. São tuas, ' +
      'aparecem no ecrã, e vês cada uma a recarregar e a disparar. Uma delas fica no ' +
      'botão grande para dispares quando quiseres.',
    why:
      'É a espinha de todos os ARPG que nomeaste. No Diablo pões 6, no Last Epoch 5. ' +
      'Num telemóvel a uma mão, três é o número que cabe — e três chega para uma build ' +
      'ter identidade.',
  },
  {
    n: '2',
    seal: '势',
    title: 'O momentum passa a ser o recurso',
    before:
      'Hoje: correr enche um banco invisível, parar descarrega-o num impulso. Nada disto ' +
      'está desenhado no ecrã. É a peça mais engenhosa do jogo e ninguém a vê.',
    after:
      'Passa a: uma barra de 势 por baixo da vida. <b>Mover enche. Skills gastam.</b> ' +
      'Quatro pontos, cada skill custa 1 ou 2.',
    why:
      'Mana, fúria, energia — todos os ARPG têm um recurso e é a primeira coisa que se ' +
      'aprende. Aqui o recurso vem do <b>movimento</b>, o que é único e wuxia: o qi junta-se ' +
      'em andamento. E de repente andar bem é uma decisão em vez de um hábito.',
  },
  {
    n: '3',
    seal: '境',
    title: 'As condições passam a ser modificadores escritos',
    before:
      'Hoje: a condição decide SE a arte dispara. Não vês qual está ativa, não sabes ' +
      'porque disparou, e "estar a virar" não é uma coisa que se planeie.',
    after:
      'Passa a: a condição está <b>impressa na skill</b> e multiplica-a. «山 Mountain — ' +
      '+50% de redução com 3 ou mais inimigos perto». Disparas na mesma; a condição ' +
      'decide quanto rende.',
    why:
      'É o «while X» do Grim Dawn e do PoE, que toda a gente percebe. Mantém o que era ' +
      'especial — o combate ainda te pede posição — e tira-lhe o mistério.',
  },
  {
    n: '4',
    seal: '器',
    title: 'O equipamento modifica skills, não só números',
    before:
      'Hoje: «+8 Spirit», que em segredo multiplica o poder das artes por uma fórmula que ' +
      'ninguém pode ver. As cartas de técnica dão os mesmos efeitos por outra via.',
    after:
      'Passa a: «<b>+18% Mountain</b>», «<b>−1 势 no custo de Mountain</b>», «Sink também ' +
      'empurra». As cartas desaparecem — os efeitos que só elas tinham viram skills.',
    why:
      'É o que faz um drop ser um acontecimento em vez de um número maior: uma peça pode ' +
      '<b>mudar a tua build</b>. Support gems no PoE, poderes lendários no Diablo, afixos ' +
      'no Last Epoch — todos fazem isto.',
  },
]

const page = (): string => `<title>剑影 — O Overhaul</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400;9..144,600;9..144,700&family=Archivo:wght@400;500;600&display=swap">
<style>
  :root {
    --paper: ${hex(palette.paper)}; --ink: ${INK};
    --gold: ${GOLD}; --cinnabar: ${CINNABAR};
    --wall: #141317; --wall-2: #1c1a21; --edge: #2b2833;
    --text: #e9e4d9; --dim: #958e83; --green: #5fa87a;
    --display: Fraunces, "Iowan Old Style", Georgia, serif;
    --body: Archivo, "Helvetica Neue", Arial, sans-serif;
    color-scheme: dark;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--wall); color: var(--text);
         font: 400 16px/1.6 var(--body); -webkit-font-smoothing: antialiased; }
  .wrap { max-width: 560px; margin: 0 auto; padding: 28px 18px 60px; }
  h1 { font: 700 clamp(29px, 8vw, 38px)/1.05 var(--display);
       font-variation-settings: "SOFT" 30, "WONK" 1, "opsz" 120;
       margin: 0 0 9px; letter-spacing: -0.02em; text-wrap: balance; }
  .deck { color: var(--dim); margin: 0 0 22px; font-size: 15px; }
  h2 { margin: 34px 0 4px; font: 600 22px/1.15 var(--display);
       font-variation-settings: "SOFT" 24, "WONK" 1, "opsz" 60; }
  .lede { color: var(--dim); font-size: 14px; margin: 0 0 16px; }

  .diag { padding: 17px 18px; margin-bottom: 26px; border-radius: 3px;
          background: var(--wall-2); border: 1px solid var(--edge);
          border-left: 3px solid var(--cinnabar); }
  .diag .lbl { display: block; font-size: 10.5px; letter-spacing: 0.14em;
               text-transform: uppercase; color: var(--cinnabar);
               filter: brightness(1.3); margin-bottom: 8px; }
  .diag p { margin: 0 0 10px; font: 500 18px/1.4 var(--display); }
  .diag small { display: block; font-size: 14px; line-height: 1.55;
                color: var(--dim); font-family: var(--body); }

  /* The skeleton, as five boxes with two marked missing. */
  .bones { display: grid; gap: 5px; margin-bottom: 8px; }
  .bone { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 10px;
          align-items: center; padding: 11px 13px; border-radius: 2px;
          background: var(--wall-2); border: 1px solid var(--edge);
          border-left: 3px solid var(--st); }
  .bone b { display: block; font-size: 14.5px; font-weight: 600; }
  .bone span { display: block; font-size: 12.5px; color: var(--dim); }
  .bone u { text-decoration: none; font-size: 10px; letter-spacing: 0.1em;
            text-transform: uppercase; color: var(--st); white-space: nowrap; }

  .ch { margin-bottom: 14px; border-radius: 3px; background: var(--wall-2);
        border: 1px solid var(--edge); border-left: 3px solid var(--gold); overflow: hidden; }
  .ch-hd { display: flex; align-items: center; gap: 12px; padding: 15px 16px 0; }
  .ch-seal { width: 36px; height: 36px; flex: none; display: grid; place-items: center;
             background: var(--gold); color: #12110f; border-radius: 2px; font-size: 17px; }
  .ch h3 { margin: 0; font: 600 17px/1.2 var(--display); }
  .ch-n { font-size: 11px; letter-spacing: 0.12em; color: var(--dim); }
  .ch-body { padding: 12px 16px 16px; }
  .ba { margin-bottom: 10px; padding-left: 11px; border-left: 2px solid var(--edge);
        font-size: 14px; color: var(--dim); }
  .ba.after { border-left-color: var(--green); color: var(--text); }
  .ch-why { margin: 0; font-size: 13.5px; color: var(--dim); }
  .ch-why b, .ba b { color: var(--text); font-weight: 600; }

  /* --- phones ---------------------------------------------------------- */
  .scr { width: 100%; aspect-ratio: 390 / 660; position: relative; margin: 0 0 12px;
         border-radius: 10px; overflow: hidden; background: var(--paper); color: var(--ink);
         box-shadow: 0 12px 34px -18px #000, 0 0 0 1px #000; }
  .fig { position: absolute; left: 50%; top: 44%; width: 58px; height: 106px;
         transform: translate(-50%, -50%); }
  .hero { position: absolute; inset: 0; }
  .mob { position: absolute; width: calc(26px * var(--m,1)); height: calc(38px * var(--m,1));
         transform: translate(-50%,-50%); opacity: 0.9; }
  .topbar { position: absolute; top: 0; left: 0; right: 0; padding: 8px 13px 7px;
            background: rgba(232,220,192,0.92); border-bottom: 1px solid rgba(13,13,13,0.1);
            display: grid; grid-template-columns: auto 1fr auto; gap: 9px; align-items: center; }
  .topbar-lead span { display: block; font-size: 8.5px; color: rgba(13,13,13,0.45); }
  .topbar-lead b { display: block; font-size: 9.5px; letter-spacing: 0.14em; }
  .topbar-rift { height: 8px; background: rgba(13,13,13,0.12); border-radius: 4px; overflow: hidden; }
  .topbar-rift i { display: block; height: 100%; background: var(--cinnabar); opacity: 0.85; }
  .topbar-num { font-size: 12px; font-weight: 700; }
  /* The big button: the one skill you fire yourself. */
  .cast { position: absolute; right: 15px; bottom: 25%; width: 62px; height: 62px;
          display: grid; place-items: center; border-radius: 50%; font-size: 17px;
          color: var(--paper); background: var(--cinnabar);
          box-shadow: 0 0 0 3px rgba(193,39,45,0.24); }
  .console { position: absolute; left: 0; right: 0; bottom: 0; padding: 9px 13px 13px; }
  .hp { position: relative; height: 15px; background: rgba(13,13,13,0.12);
        border-radius: 3px; overflow: hidden; margin-bottom: 7px; }
  .hp i { display: block; height: 100%; background: var(--ink); }
  .hp em { position: absolute; inset: 0; display: grid; place-items: center; font-style: normal;
           font-size: 10px; font-weight: 600; color: var(--paper); }
  .shi { display: grid; grid-template-columns: auto 1fr auto; gap: 8px; align-items: center;
         margin-bottom: 9px; }
  .shi > span { font-size: 12px; color: var(--gold); }
  .shi b { font-size: 10px; font-weight: 700; color: rgba(13,13,13,0.55); }
  .shi-track { display: flex; gap: 4px; }
  .shi-track i { flex: 1; height: 8px; border-radius: 2px; background: rgba(13,13,13,0.12); }
  .shi-track i.on { background: var(--gold); opacity: 0.85; }
  .tiles { display: flex; gap: 7px; }
  .tile { position: relative; flex: 1; height: 52px; display: grid; place-items: center;
          border: 1.5px solid rgba(13,13,13,0.28); border-radius: 3px; overflow: hidden;
          background: rgba(255,252,244,0.55); }
  .tile-on { border-color: var(--cinnabar); border-width: 2px; }
  .tile-seal { font-size: 15px; z-index: 1; }
  .tile-cd { position: absolute; left: 0; right: 0; bottom: 0; background: rgba(13,13,13,0.16); }
  .tile-cost { position: absolute; top: 3px; right: 4px; font-size: 6px; letter-spacing: 1px;
               color: var(--gold); text-decoration: none; }

  .scr-ui { padding: 14px; }
  .ui-hd { padding-bottom: 9px; margin-bottom: 11px; border-bottom: 1px solid rgba(13,13,13,0.14);
           display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
  .ui-hd b { font: 600 16px/1.2 var(--display); }
  .ui-hd span { font-size: 10.5px; color: rgba(13,13,13,0.5); }
  .slots { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; margin-bottom: 12px; }
  .slot { padding: 9px 7px; text-align: center; border-radius: 3px;
          border: 1.5px solid rgba(13,13,13,0.25); background: rgba(255,252,244,0.5); }
  .slot-seal { display: block; font-size: 17px; margin-bottom: 3px; }
  .slot b { display: block; font-size: 11px; }
  .slot-meta { display: block; font-size: 9px; color: rgba(13,13,13,0.5); margin-top: 2px; }
  .detail { padding: 11px 12px; border-radius: 3px; background: rgba(255,252,244,0.7);
            border: 1px solid rgba(13,13,13,0.14); margin-bottom: 11px; }
  .detail-hd { display: flex; align-items: baseline; gap: 8px; margin-bottom: 5px; }
  .detail-hd span { font-size: 17px; }
  .detail-hd b { font: 600 15px/1.2 var(--display); }
  .detail-line { font-size: 11.5px; color: rgba(13,13,13,0.65); margin-bottom: 8px; }
  .detail-rows { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 8px; }
  .detail-rows div { text-align: center; }
  .detail-rows span { display: block; font-size: 8.5px; letter-spacing: 0.08em;
                      text-transform: uppercase; color: rgba(13,13,13,0.42); }
  .detail-rows b { display: block; font-size: 13px; }
  .detail-cond { padding: 7px 9px; border-radius: 2px; font-size: 10.5px;
                 background: rgba(193,39,45,0.08); border: 1px solid rgba(193,39,45,0.22);
                 margin-bottom: 6px; }
  .detail-gear { font-size: 10.5px; color: var(--gold); }
  .known { display: flex; align-items: center; gap: 7px; font-size: 10px;
           color: rgba(13,13,13,0.5); }
  .known i { width: 28px; height: 28px; display: grid; place-items: center; font-style: normal;
             font-size: 13px; border: 1px dashed rgba(13,13,13,0.25); border-radius: 3px; }

  .affixes { display: grid; gap: 5px; margin-bottom: 10px; }
  .af { display: flex; gap: 9px; align-items: baseline; padding: 7px 10px; border-radius: 2px;
        background: rgba(255,252,244,0.55); border: 1px solid rgba(13,13,13,0.1); font-size: 12px; }
  .af b { font-weight: 700; min-width: 40px; }
  .af-skill { border-color: rgba(212,175,55,0.5); background: rgba(212,175,55,0.1); }
  .af-skill b, .af-skill span { color: var(--gold); }
  .power { padding: 9px 10px; border-radius: 2px; margin-bottom: 10px;
           border: 1px solid rgba(212,175,55,0.35); background: rgba(212,175,55,0.07); }
  .power b { display: block; font-size: 12px; color: var(--gold); }
  .power span { display: block; font-size: 10.5px; color: rgba(13,13,13,0.55); }
  .cmp { padding-top: 8px; border-top: 1px solid rgba(13,13,13,0.12); margin-bottom: 11px; }
  .cmp-row { display: flex; justify-content: space-between; font-size: 11.5px;
             color: rgba(13,13,13,0.55); line-height: 1.8; }
  .cmp-row b { color: rgba(13,13,13,0.8); font-weight: 600; }
  .cmp-row b.up { color: #2f7a4a; }
  .wear { padding: 10px; text-align: center; background: var(--ink); color: var(--paper);
          border-radius: 2px; font-size: 11px; letter-spacing: 0.1em; font-weight: 600; }

  .cap { font-size: 13px; color: var(--dim); margin: 0 0 22px; }
  .cap b { color: var(--text); }
  .sentence { padding: 16px 17px; border-radius: 3px; background: var(--wall-2);
              border: 1px solid var(--edge); border-left: 3px solid var(--green); }
  .sentence .lbl { display: block; font-size: 10.5px; letter-spacing: 0.14em;
                   text-transform: uppercase; color: var(--green); margin-bottom: 8px; }
  .sentence q { display: block; font: 500 17px/1.4 var(--display); margin-bottom: 9px; }
  .sentence p { margin: 0; font-size: 13.5px; color: var(--dim); }
</style>
<div class="wrap">
  <h1>O overhaul</h1>
  <p class="deck">Como isto passa a ser um ARPG que um jogador de Diablo reconhece ao segundo
    minuto — sem deixar de ser este jogo.</p>

  <div class="diag">
    <span class="lbl">O problema, numa frase</span>
    <p>Nunca escolhes uma skill, e nunca vês uma disparar <em>porque tu a escolheste</em>.</p>
    <small>Hoje uma arte acorda se o degrau da tua arma chegar suficientemente abaixo numa
      lista, e dispara se o teu movimento calhar de cumprir uma condição que nunca te
      mostraram, escalada por um banco de 势 que não está desenhado em lado nenhum. Cada peça
      é defensável e a soma é uma build que não consegues nomear. Pergunta a alguém no PoE o
      que ele é: «cyclone slayer», duas palavras. Aqui a resposta honesta é «não sei, faz
      coisas».</small>
  </div>

  <h2>A espinha que todos partilham</h2>
  <p class="lede">Diablo, PoE, Last Epoch, Grim Dawn — todos têm estas cinco.</p>
  <div class="bones">
    ${[
      ['Skills que escolhes e vês', 'a barra, os cooldowns', 'falta', 'var(--cinnabar)'],
      ['Um recurso que gastam', 'mana, fúria, energia', 'invisível', 'var(--cinnabar)'],
      ['Modificadores que as nomeiam', 'support gems, runas, afixos', 'quase', 'var(--gold)'],
      ['Loot legível por degraus', 'raridade, afixos, comparação', 'tens', 'var(--green)'],
      ['Escada sem topo', 'mapas, rifts, monólitos', 'tens', 'var(--green)'],
    ].map(([t, d, v, c]) => `<div class="bone" style="--st:${c}">
      <div><b>${t}</b><span>${d}</span></div><u>${v}</u>
    </div>`).join('')}
  </div>
  <p class="lede">Duas em falta. É só isso — e é por isso que «não se percebe nada».</p>

  <h2>As quatro mudanças</h2>
  ${CHANGES.map((c) => `<section class="ch">
    <div class="ch-hd">
      <div class="ch-seal">${c.seal}</div>
      <div><div class="ch-n">${c.n} de ${CHANGES.length}</div><h3>${c.title}</h3></div>
    </div>
    <div class="ch-body">
      <div class="ba">${c.before}</div>
      <div class="ba after">${c.after}</div>
      <p class="ch-why">${c.why}</p>
    </div>
  </section>`).join('')}

  <h2>Como fica</h2>
  <p class="lede">Três ecrãs. É o jogo inteiro.</p>

  ${screenPlay()}
  <p class="cap"><b>Em combate.</b> A fenda em cima. A vida com o seu número. Por baixo, o
    <b>势</b>: quatro pontos que o movimento enche e as skills gastam. Três skills na barra,
    cada uma a mostrar o custo e a recarregar à vista. O botão grande é a que tu disparas.</p>

  ${screenSkills()}
  <p class="cap"><b>As skills.</b> Escolhes três das que sabes. Cada uma diz o custo, a
    recarga, e o que faz — <b>em números</b>. A condição está impressa e multiplica; o que o
    teu equipamento lhe acrescenta está por baixo, com o nome dela.</p>

  ${screenGear()}
  <p class="cap"><b>O equipamento.</b> Os afixos a dourado nomeiam skills. Uma peça deixa de
    ser «+8 de um atributo» e passa a ser uma decisão de build — que é o que faz um drop ser
    um acontecimento.</p>

  <div class="sentence">
    <span class="lbl">O teste</span>
    <q>«斩马刀 com Sink, Mountain e One Cut, montado para alcance e custo de 势.»</q>
    <p>Se consegues dizer isto sobre a tua personagem numa frase, é um ARPG. Hoje não
      consegues — e nenhuma quantidade de tutorial resolve isso, porque não há nada para
      dizer.</p>
  </div>
</div>
`

await mkdir(OUT, { recursive: true })
const file = join(OUT, 'overhaul.html')
await writeFile(file, page(), 'utf8')
console.log(`wrote ${file}`)
