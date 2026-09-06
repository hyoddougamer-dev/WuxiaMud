/**
 * Proposals for the two things the playtest broke on: the first five minutes,
 * and the HUD.
 *
 *   npx tsx tools/uiPage.mts        # writes docs/ui.html
 *
 * WHAT THE PLAYTEST ACTUALLY SAID, in his words: "foi muito chato porque não
 * existe bem onboarding e explicação do que é o jogo ou como funciona", and
 * "temos que melhorar a UI no geral". He also declined two of the six missions
 * — the Broken Cliff and the push to the fourth gate — because the start of the
 * game did not earn them. That is the strongest signal in the whole report: he
 * would not go deeper, so nothing I had ranked as urgent was.
 *
 * A tutorial DOES exist and fires six beats. Reading them in order is the
 * diagnosis: drag to move, the blade swings itself, it strikes what is
 * nearest, walk over the qi, dodge with this button, dying ends the
 * expedition. Every one is a VERB. Not one of them says what you are trying to
 * DO — that the bar at the bottom is a rift, that filling it calls the thing
 * guarding it, that killing that thing lets you choose between leaving with
 * what you found and pushing into a harder floor, and that the gear is what
 * you keep. The game explains its controls and never its point.
 *
 * The screens here are drawn from the real palette and the real strings where
 * strings exist, so nothing proposes a colour or a component the game cannot
 * already build.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { REGIONS } from '../src/data/regions'
import { palette } from '../src/render/palette'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'docs')
const hex = (n: number): string => `#${n.toString(16).padStart(6, '0')}`
const INK = hex(palette.ink)
const CINNABAR = hex(palette.cinnabar)
const GOLD = hex(palette.goldDeep)

/** A plain ink swordsman, so a mockup has a body without the renderer. */
const FIGURE = (scale = 1): string => `<svg viewBox="0 0 60 110" class="fig" style="--s:${scale}">
  <ellipse cx="30" cy="104" rx="16" ry="4" fill="${INK}" opacity="0.12"/>
  <path d="M30 14c7 0 11 5 11 12 0 9-4 14-11 14s-11-5-11-14c0-7 4-12 11-12z" fill="${INK}"/>
  <path d="M17 41h26l6 34-5 27H16l-5-27z" fill="${INK}"/>
  <path d="M20 41l-8 30 5 2 8-28z" fill="${INK}"/>
  <path d="M40 41l8 30-5 2-8-28z" fill="${INK}"/>
  <path d="M21 68h18l-2 8H23z" fill="${CINNABAR}" opacity="0.85"/>
  <path d="M46 26l7-9 3 3-8 9z" fill="${GOLD}"/>
</svg>`

/** Two enemies, so a field is not empty. */
const MOB = (x: number, y: number, s = 1): string =>
  `<svg viewBox="0 0 30 44" class="mob" style="left:${x}%;top:${y}%;--m:${s}">
    <path d="M15 6c4 0 6 3 6 7s-2 7-6 7-6-3-6-7 2-7 6-7z" fill="${INK}"/>
    <path d="M9 21h12l3 15-2 8H8l-2-8z" fill="${INK}"/>
  </svg>`

interface Proposal {
  id: string
  seal: string
  name: string
  tag: string
  screen: string
  buys: string
  costs: string
  pick?: boolean
}

// --- onboarding -------------------------------------------------------------

/** A — the first expedition is a short, scripted one. */
const onboardShort = (): string => `<div class="scr">
  <div class="play">
    <div class="teach teach-goal">
      <b>Enche a fenda</b>
      <span>Cada morte alimenta a barra em baixo</span>
    </div>
    ${MOB(20, 34)}${MOB(72, 28, 0.9)}${MOB(58, 52, 0.8)}
    <div class="hero">${FIGURE()}</div>
    <div class="dodge">DODGE</div>
    <div class="console">
      <div class="hp"><i style="width:86%"></i></div>
      <div class="rift-lead">FENDA · primeira estrada</div>
      <div class="rift"><i style="width:64%"></i><em>64%</em></div>
      <div class="arts">
        ${['静', '疾', '转', '围', '危'].map((s, i) => `<span class="${i === 0 ? 'on' : ''}">${s}</span>`).join('')}
      </div>
    </div>
  </div>
</div>`

/** B — a scroll read once before the first run. */
const onboardScroll = (): string => `<div class="scr scr-paper">
  <div class="intro">
    <div class="intro-seal">剑影</div>
    <h3>És um espadachim numa estrada que não te quer lá.</h3>
    <ol class="beats">
      <li><b>Mata para encher a fenda.</b> A barra em baixo. Não há outra forma de a encher.</li>
      <li><b>Cheia, chama o que a guarda.</b> Mata-o e o portão abre.</li>
      <li><b>No portão, escolhes.</b> Sair com o que apanhaste — ou empurrar para um andar mais
        duro, com o mesmo espadachim.</li>
      <li><b>Se morreres, perdes o que trazias.</b> O cultivo e o que já estava guardado ficam.</li>
    </ol>
    <div class="intro-go">Começar</div>
    <div class="intro-skip">já sei como é</div>
  </div>
</div>`

/** C — the beats stay inline but fire at the moment they matter. */
const onboardMoment = (): string => `<div class="scr">
  <div class="play">
    ${MOB(24, 30)}${MOB(70, 40, 0.85)}
    <div class="hero">${FIGURE()}</div>
    <div class="drop-mark"><i></i><span>珍</span></div>
    <div class="teach teach-side">
      <b>Isso fica contigo</b>
      <span>Equipamento não se perde ao subir de nível — perde-se ao morrer com ele</span>
    </div>
    <div class="dodge">DODGE</div>
    <div class="console">
      <div class="hp"><i style="width:72%"></i></div>
      <div class="rift"><i style="width:31%"></i><em>31%</em></div>
      <div class="arts">
        ${['静', '疾', '转', '围', '危'].map((s, i) => `<span class="${i === 1 ? 'on' : ''}">${s}</span>`).join('')}
      </div>
    </div>
  </div>
</div>`

// --- HUD --------------------------------------------------------------------

const hudNow = (): string => `<div class="scr">
  <div class="play">
    <div class="debug">24 fps · 6e · u0.1 r0.1 ▲50 · webgl</div>
    ${MOB(22, 32)}${MOB(74, 26, 0.9)}${MOB(60, 55, 0.8)}
    <div class="hero">${FIGURE()}</div>
    <div class="dodge">DODGE</div>
    <div class="console">
      <div class="row-now"><b>148</b><span>0:14</span></div>
      <div class="hp"><i style="width:72%"></i></div>
      <div class="arts">
        ${['静', '疾', '转', '围', '危'].map((s, i) => `<span class="${i === 0 ? 'on' : ''}">${s}</span>`).join('')}
      </div>
      <div class="rift-thin"><i style="width:31%"></i></div>
    </div>
  </div>
</div>`

const hudGoal = (): string => `<div class="scr">
  <div class="play">
    <div class="topbar">
      <div class="topbar-lead"><span>${REGIONS[0]!.name}</span><b>FENDA</b></div>
      <div class="topbar-rift"><i style="width:31%"></i></div>
      <div class="topbar-num">31%</div>
    </div>
    ${MOB(22, 34)}${MOB(74, 28, 0.9)}${MOB(60, 56, 0.8)}
    <div class="hero">${FIGURE()}</div>
    <div class="dodge">DODGE</div>
    <div class="console">
      <div class="hp hp-big"><i style="width:72%"></i><em>148 / 205</em></div>
      <div class="arts">
        ${['静', '疾', '转', '围', '危'].map((s, i) => `<span class="${i === 0 ? 'on' : ''}">${s}</span>`).join('')}
      </div>
    </div>
  </div>
</div>`

const hudRing = (): string => `<div class="scr">
  <div class="play">
    <div class="edge"><i style="width:31%"></i></div>
    ${MOB(22, 34)}${MOB(74, 28, 0.9)}${MOB(60, 56, 0.8)}
    <div class="hero hero-ring">
      <div class="ring"><svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="44" fill="none" stroke="${INK}" stroke-opacity="0.12" stroke-width="5"/>
        <circle cx="50" cy="50" r="44" fill="none" stroke="${CINNABAR}" stroke-width="5"
          stroke-linecap="round" stroke-dasharray="276" stroke-dashoffset="77"
          transform="rotate(-90 50 50)"/>
      </svg></div>
      ${FIGURE()}
    </div>
    <div class="dodge">DODGE</div>
    <div class="console console-bare">
      <div class="arts">
        ${['静', '疾', '转', '围', '危'].map((s, i) => `<span class="${i === 0 ? 'on' : ''}">${s}</span>`).join('')}
      </div>
    </div>
  </div>
</div>`

const ONBOARD: Proposal[] = [
  {
    id: 'o-a',
    seal: '引',
    name: 'A primeira corrida é curta',
    tag: 'a que eu escolhia',
    screen: onboardShort(),
    pick: true,
    buys:
      'A primeira expedição é guionada e dura cerca de <b>60 segundos</b>: poucos inimigos, ' +
      'um drop garantido, e um portão que abre cedo. Em três minutos vês a volta INTEIRA — ' +
      'lutar, apanhar, o portão, a escolha, o hub, equipar, sair outra vez. Só depois disso ' +
      'a fenda passa a pedir os 200 segundos normais.',
    costs:
      'É o único que mexe na simulação e não só na UI: precisa de uma expedição com regras ' +
      'próprias. Meio dia. E se o jogador sair a meio, tem de saber retomar.',
  },
  {
    id: 'o-b',
    seal: '序',
    name: 'O pergaminho, antes de sair',
    tag: 'o mais barato',
    screen: onboardScroll(),
    buys:
      'Quatro frases, uma vez, antes da primeira estrada. Diz o que nenhum tutorial teu diz ' +
      'hoje: o que é a fenda, o que faz o portão, e o que perdes ao morrer. Uma tarde de ' +
      'trabalho e usa ecrãs que já existem.',
    costs:
      'Ninguém lê ecrãs de texto em jogos de telemóvel. Resolve “não sei o que é isto” e não ' +
      'resolve “os primeiros minutos são chatos”, que foi a tua frase.',
  },
  {
    id: 'o-c',
    seal: '时',
    name: 'Cada dica no seu momento',
    tag: 'complementa o 引',
    screen: onboardMoment(),
    pick: true,
    buys:
      'O tutorial que existe dispara seis dicas e <b>todas são verbos</b> — arrasta, o golpe ' +
      'sai sozinho, apanha o qi. Nenhuma diz o objetivo. Aqui cada dica espera pelo momento ' +
      'em que importa: o primeiro item no chão explica o loot, a fenda a meio explica o ' +
      'portão, a primeira morte explica o que se perde.',
    costs:
      'Sozinho não chega. Continua a ser uma primeira corrida de 200 segundos — melhor ' +
      'explicada, igualmente longa.',
  },
]

const HUD: Proposal[] = [
  {
    id: 'h-now',
    seal: '今',
    name: 'O que existe hoje',
    tag: 'para comparares',
    screen: hudNow(),
    buys:
      'Tudo numa consola em baixo: vida, artes, e a fenda como uma linha fina de 3px. ' +
      'A metade de cima do ecrã fica livre para o jogo.',
    costs:
      'A fenda — o objetivo da corrida inteira — é a coisa mais discreta do ecrã, e não diz ' +
      'quanto falta nem do quê. A linha de debug no topo está lá desde o primeiro dia.',
  },
  {
    id: 'h-goal',
    seal: '的',
    name: 'O objetivo em cima',
    tag: 'a que eu escolhia',
    screen: hudGoal(),
    pick: true,
    buys:
      'A fenda sobe para o topo com nome, percentagem e a estrada em que estás — a barra ' +
      'onde o olho já vai quando quer saber “quanto falta”. A vida ganha o número absoluto, ' +
      'que é o que faltava para perceberes se equipar fez alguma coisa. Em baixo ficam só ' +
      'as artes.',
    costs:
      'Gasta 44px do topo, que é onde se vê o que aí vem. Num telefone com notch fica ' +
      'apertado e obriga a respeitar a safe-area a sério.',
  },
  {
    id: 'h-ring',
    seal: '环',
    name: 'A vida à volta do corpo',
    tag: 'o mais arriscado',
    screen: hudRing(),
    buys:
      'A vida é um anel à volta do espadachim, portanto lê-se sem tirar os olhos do combate ' +
      '— o problema que apontaste. A fenda é uma aresta de 3px no topo do ecrã. Fica quase ' +
      'todo o ecrã para o jogo.',
    costs:
      'Um anel à volta de uma silhueta de tinta num campo de tinta é ruído visual em cima da ' +
      'coisa que mais precisa de se ler. E números absolutos deixam de caber em lado nenhum.',
  },
]

const page = (): string => `<title>剑影 — Onboarding e HUD</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400;9..144,600;9..144,700&family=Archivo:wght@400;500;600&display=swap">
<style>
  :root {
    --ink: ${INK};
    --paper: ${hex(palette.paper)};
    --gold: ${GOLD};
    --cinnabar: ${CINNABAR};
    --wall: #141317;
    --wall-2: #1c1a21;
    --edge: #2b2833;
    --text: #e9e4d9;
    --dim: #958e83;
    --green: #5fa87a;
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
  h2 { margin: 30px 0 4px; font: 600 23px/1.15 var(--display);
       font-variation-settings: "SOFT" 24, "WONK" 1, "opsz" 60; }
  .lede { color: var(--dim); font-size: 14px; margin: 0 0 18px; }

  .said { padding: 15px 16px; margin-bottom: 24px; border-radius: 3px;
          background: var(--wall-2); border: 1px solid var(--edge);
          border-left: 3px solid var(--cinnabar); }
  .said b { display: block; font: 600 16px/1.25 var(--display);
            color: var(--cinnabar); filter: brightness(1.35); margin-bottom: 7px; }
  .said q { display: block; font-style: italic; font-size: 14.5px; margin-bottom: 8px; }
  .said p { margin: 0; font-size: 14px; color: var(--dim); }

  .p { margin-bottom: 16px; border-radius: 3px; background: var(--wall-2);
       border: 1px solid var(--edge); border-left: 3px solid var(--edge); overflow: hidden; }
  .p.pick { border-left-color: var(--green); }
  .p-hd { display: flex; align-items: center; gap: 11px; padding: 15px 16px 0; }
  .p-seal { width: 32px; height: 32px; flex: none; display: grid; place-items: center;
            background: var(--gold); color: #12110f; border-radius: 2px; font-size: 16px; }
  .p.pick .p-seal { background: var(--green); }
  .p h3 { margin: 0; font: 600 17px/1.2 var(--display); }
  .p-tag { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--dim); }
  .p.pick .p-tag { color: var(--green); }
  .p-body { padding: 13px 16px 16px; }
  .p-body p { margin: 0 0 10px; font-size: 14px; }
  .p-lbl { display: block; font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase;
           color: var(--gold); filter: brightness(1.6); margin-bottom: 2px; }
  .cost .p-lbl { color: var(--cinnabar); filter: brightness(1.3); }

  /* --- the phone ------------------------------------------------------ */
  .scr { width: 100%; aspect-ratio: 390 / 640; margin: 0 auto 14px; position: relative;
         border-radius: 10px; overflow: hidden; background: var(--paper); color: var(--ink);
         box-shadow: 0 12px 34px -18px #000, 0 0 0 1px #000; }
  .play { position: absolute; inset: 0; }
  .fig { position: absolute; left: 50%; top: 46%; width: calc(58px * var(--s, 1));
         height: calc(106px * var(--s, 1)); transform: translate(-50%, -50%); }
  .hero { position: absolute; inset: 0; }
  .mob { position: absolute; width: calc(26px * var(--m, 1)); height: calc(38px * var(--m, 1));
         transform: translate(-50%, -50%); opacity: 0.9; }
  .debug { position: absolute; top: 6px; left: 10px; font-size: 9px;
           color: rgba(13,13,13,0.34); letter-spacing: 0.02em; }
  .dodge { position: absolute; right: 16px; bottom: 27%; width: 56px; height: 56px;
           display: grid; place-items: center; border-radius: 50%;
           border: 2.5px solid var(--cinnabar); color: var(--cinnabar);
           font-size: 9px; font-weight: 600; letter-spacing: 0.06em; }
  .console { position: absolute; left: 0; right: 0; bottom: 0; padding: 9px 14px 13px; }
  .console-bare { padding-bottom: 16px; }
  .row-now { display: flex; justify-content: space-between; align-items: baseline;
             font-size: 13px; margin-bottom: 4px; }
  .row-now b { font-size: 17px; font-weight: 700; }
  .row-now span { font-size: 11px; color: rgba(13,13,13,0.45); }
  .hp { height: 5px; background: rgba(13,13,13,0.12); border-radius: 3px; overflow: hidden;
        margin-bottom: 8px; }
  .hp i { display: block; height: 100%; background: var(--ink); }
  .hp-big { position: relative; height: 15px; border-radius: 3px; margin-bottom: 9px; }
  .hp-big em { position: absolute; inset: 0; display: grid; place-items: center;
               font-style: normal; font-size: 10px; font-weight: 600; color: var(--paper);
               letter-spacing: 0.04em; }
  .rift-lead { font-size: 8.5px; letter-spacing: 0.14em; text-transform: uppercase;
               color: rgba(13,13,13,0.42); margin-bottom: 3px; }
  .rift { position: relative; height: 11px; background: rgba(13,13,13,0.12);
          border-radius: 3px; overflow: hidden; margin-bottom: 9px; }
  .rift i { display: block; height: 100%; background: var(--cinnabar); opacity: 0.85; }
  .rift em { position: absolute; right: 5px; top: -1px; font-style: normal; font-size: 9px;
             font-weight: 600; color: var(--paper); }
  .rift-thin { height: 3px; background: rgba(13,13,13,0.1); border-radius: 2px; margin-top: 7px; }
  .rift-thin i { display: block; height: 100%; background: var(--cinnabar); opacity: 0.6; }
  .arts { display: flex; gap: 5px; }
  .arts span { flex: 1; height: 30px; display: grid; place-items: center; font-size: 12px;
               border: 1px dashed rgba(13,13,13,0.22); border-radius: 2px;
               color: rgba(13,13,13,0.3); }
  .arts .on { border-style: solid; border-color: var(--gold); color: var(--gold);
              background: rgba(212,175,55,0.1); }
  /* the teaching overlays */
  .teach { position: absolute; left: 50%; transform: translateX(-50%); text-align: center;
           width: 84%; }
  .teach-goal { top: 15%; }
  .teach-side { top: 66%; }
  .teach b { display: block; font: 600 17px/1.25 var(--display); color: var(--gold); }
  .teach span { display: block; font-size: 11.5px; color: rgba(13,13,13,0.6); margin-top: 2px; }
  .drop-mark { position: absolute; left: 30%; top: 58%; }
  .drop-mark i { display: block; width: 20px; height: 20px; border-radius: 50%;
                 border: 3px solid #2f5d8a; background: rgba(255,252,244,0.8); }
  .drop-mark span { display: block; text-align: center; font-size: 9px; color: #2f5d8a; }
  .topbar { position: absolute; top: 0; left: 0; right: 0; padding: 9px 14px 8px;
            background: rgba(232,220,192,0.9); border-bottom: 1px solid rgba(13,13,13,0.1);
            display: grid; grid-template-columns: auto 1fr auto; gap: 9px; align-items: center; }
  .topbar-lead span { display: block; font-size: 8.5px; color: rgba(13,13,13,0.45); }
  .topbar-lead b { display: block; font-size: 10px; letter-spacing: 0.12em; }
  .topbar-rift { height: 9px; background: rgba(13,13,13,0.12); border-radius: 3px; overflow: hidden; }
  .topbar-rift i { display: block; height: 100%; background: var(--cinnabar); opacity: 0.85; }
  .topbar-num { font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .edge { position: absolute; top: 0; left: 0; right: 0; height: 3px; background: rgba(13,13,13,0.1); }
  .edge i { display: block; height: 100%; background: var(--cinnabar); }
  .ring { position: absolute; left: 50%; top: 46%; width: 96px; height: 96px;
          transform: translate(-50%, -50%); }
  .ring svg { width: 100%; height: 100%; }
  /* the scroll screen */
  .scr-paper .intro { position: absolute; inset: 0; padding: 26px 22px; }
  .intro-seal { display: inline-block; padding: 7px 11px; background: var(--cinnabar);
                color: var(--paper); font-size: 17px; border-radius: 2px; margin-bottom: 14px; }
  .intro h3 { margin: 0 0 14px; font: 600 18px/1.3 var(--display); color: var(--ink); }
  .beats { margin: 0 0 18px; padding-left: 18px; }
  .beats li { font-size: 12.5px; line-height: 1.5; margin-bottom: 9px; color: rgba(13,13,13,0.75); }
  .beats b { color: var(--ink); }
  .intro-go { padding: 12px; text-align: center; background: var(--ink); color: var(--paper);
              border-radius: 2px; font-size: 13px; font-weight: 600; letter-spacing: 0.08em; }
  .intro-skip { text-align: center; font-size: 11px; color: rgba(13,13,13,0.45); margin-top: 9px; }
</style>
<div class="wrap">
  <h1>Onboarding e HUD</h1>
  <p class="deck">Propostas para as duas coisas em que o playtest bateu. Cada ecrã usa a
    paleta e os componentes que o jogo já sabe desenhar — nada aqui propõe uma cor que não
    exista.</p>

  <div class="said">
    <b>O que disseste</b>
    <q>“Foi muito chato porque não existe bem onboarding e explicação do que é o jogo ou como
      funciona.” · “Temos que melhorar a UI no geral.”</q>
    <p>Fui ler o tutorial que existe. Dispara seis dicas: arrasta para andar · o golpe sai
      sozinho · acerta no mais próximo · apanha o qi · isto é o dodge · morrer acaba a
      expedição. <b>São todas verbos.</b> Nenhuma diz o que estás a tentar fazer — o que é a
      barra em baixo, o que acontece quando enche, o que ganhas ao escolher no portão. O jogo
      explica os comandos e nunca o objetivo.</p>
  </div>

  <h2>Onboarding</h2>
  <p class="lede">Três hipóteses. As duas marcadas a verde são complementares, não
    alternativas.</p>
  ${ONBOARD.map(
    (p) => `<section class="p${p.pick ? ' pick' : ''}" id="${p.id}">
      <div class="p-hd">
        <div class="p-seal">${p.seal}</div>
        <div><div class="p-tag">${p.tag}</div><h3>${p.name}</h3></div>
      </div>
      <div class="p-body">
        ${p.screen}
        <p><span class="p-lbl">O que compra</span>${p.buys}</p>
        <p class="cost"><span class="p-lbl">O que custa</span>${p.costs}</p>
      </div>
    </section>`,
  ).join('')}

  <h2>HUD</h2>
  <p class="lede">O primeiro é o que já existe, para teres com que comparar.</p>
  ${HUD.map(
    (p) => `<section class="p${p.pick ? ' pick' : ''}" id="${p.id}">
      <div class="p-hd">
        <div class="p-seal">${p.seal}</div>
        <div><div class="p-tag">${p.tag}</div><h3>${p.name}</h3></div>
      </div>
      <div class="p-body">
        ${p.screen}
        <p><span class="p-lbl">O que compra</span>${p.buys}</p>
        <p class="cost"><span class="p-lbl">O que custa</span>${p.costs}</p>
      </div>
    </section>`,
  ).join('')}
</div>
`

await mkdir(OUT, { recursive: true })
const file = join(OUT, 'ui.html')
await writeFile(file, page(), 'utf8')
console.log(`wrote ${file}`)
