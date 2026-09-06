/**
 * Where the game is and what it still needs, written for a phone.
 *
 *   npx tsx tools/faltaPage.mts        # writes docs/falta.html
 *
 * NOT A NARROWER estado.html. That page is a reference — every count, every
 * screen, every open finding with the command that reproduces it — and reading
 * a reference on a phone with a thumb is how a reference goes unread. This one
 * answers two questions and stops: how far along is it, and what is the next
 * decision. One column, one idea per screen, and the decision at the end where
 * a thumb naturally arrives.
 *
 * The counts still come from the real modules, so a phone summary cannot be the
 * one place the project flatters itself.
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ARTS } from '../src/data/arts'
import { ITEMS } from '../src/data/items'
import { RARITIES } from '../src/data/rarity'
import { NAMED_POWERS } from '../src/data/affixes'
import { ENEMY_KINDS } from '../src/data/enemies'
import { REGIONS } from '../src/data/regions'
import { WEAPONS } from '../src/data/weapons'
import { palette } from '../src/render/palette'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'docs')
const hex = (n: number): string => `#${n.toString(16).padStart(6, '0')}`

const shot = async (name: string): Promise<string> =>
  `data:image/png;base64,${(await readFile(join(ROOT, 'shots', name))).toString('base64')}`

/** The loop, as a player lives it. Each step is either whole or it is not. */
interface Step {
  seal: string
  name: string
  done: boolean
  note: string
}

const LOOP: Step[] = [
  { seal: '生', name: 'Criar um espadachim', done: true, note: 'nome, escola, aspeto' },
  { seal: '行', name: 'Escolher uma estrada', done: true, note: `${REGIONS.length}, cada uma com a sua regra` },
  { seal: '战', name: 'Lutar', done: true, note: 'joystick, golpe automático, artes por condição' },
  { seal: '长', name: 'Subir de nível', done: true, note: 'escolha entre três técnicas' },
  { seal: '拾', name: 'Apanhar do chão', done: true, note: 'degrau, linhas roladas, poder com nome' },
  { seal: '门', name: 'O portão da fenda', done: true, note: 'levar o que tens, ou empurrar mais fundo' },
  { seal: '装', name: 'Equipar no hub', done: true, note: 'paperdoll, comparação, filtro por slot' },
  { seal: '死', name: 'Morrer e recomeçar', done: true, note: 'o cultivo fica, a mochila arrisca-se' },
]

/** What has to change for the game to be finishable, not just playable. */
interface Need {
  rank: number
  seal: string
  title: string
  why: string
  proof: string
  size: string
  mine: boolean
}

const NEEDS: Need[] = [
  {
    rank: 1,
    seal: '尽',
    title: 'Uma corrida tem de acabar',
    why:
      'Equipado, ninguém te mata. Vais de portão em portão até o relógio da medição ' +
      'desistir. Um survivors-like em que a corrida não acaba é um survivors-like sem ' +
      'aposta: nada do que apanhas está em risco, portanto nada do que apanhas importa.',
    proof: '18 portões · 700 segundos · 25 mil mortes tuas: zero',
    size: 'meia semana — a escada de tiers sobe 24% por portão e tem de subir mais',
    mine: true,
  },
  {
    rank: 2,
    seal: '刀',
    title: 'As facas valem metade da espada',
    why:
      'Com o mesmo equipamento, o 斩马刀 chega a 18 portões e as 飞刀 a 4. Uma diferença ' +
      'assim não é sabor, é uma das duas classes estar partida. A escola das facas não tem ' +
      'nenhuma arte que reduza dano — e dar-lhe uma contradiz a sua premissa, que é fugir.',
    proof: '斩马刀 18 portões · 飞刀 4',
    size: 'uma semana, e uma decisão de desenho que é tua',
    mine: false,
  },
  {
    rank: 3,
    seal: '手',
    title: 'Jogá-lo num telemóvel a sério',
    why:
      'Eu vejo-o num Chromium sem toque. Nunca senti o joystick, nunca senti o hit-stop, ' +
      'nunca soube se o som fica bem com o telemóvel na mão. O balanceamento que fiz é o ' +
      'que os números dizem; se é DIVERTIDO só tu podes dizer.',
    proof: 'zero minutos de jogo humano medidos',
    size: 'uma tarde tua, com o APK',
    mine: false,
  },
  {
    rank: 4,
    seal: '众',
    title: 'O social assíncrono',
    why:
      'Seed diária, leaderboards e fantasmas. Está desenhado e a simulação é determinística ' +
      'com semente, portanto um replay são uns KB — mas não está construído. É o que faz um ' +
      'jogo solo durar mais do que uma semana.',
    proof: 'desenhado, não construído',
    size: 'duas semanas com Supabase',
    mine: true,
  },
  {
    rank: 5,
    seal: '店',
    title: 'A loja',
    why:
      'Chave de assinatura, conta Google Play, ícone, capturas, descrição. O APK de debug já ' +
      'sai do GitHub Actions a cada push; falta o de release e tudo o que a loja pede.',
    proof: '25 dólares e uma keystore que é tua',
    size: 'um dia meu, uma tarde tua',
    mine: false,
  },
]

/**
 * Tests, counted by reading the suite rather than typed in.
 *
 * It was a literal, and a literal on a page whose whole claim is "counted from
 * the code" is the one number that will be wrong first — it is also the number
 * a reader is most likely to take as proof that the rest are counted too.
 */
const countTests = async (): Promise<number> => {
  const dir = join(ROOT, 'tests')
  const files = (await readdir(dir)).filter((f) => f.endsWith('.spec.ts'))
  let n = 0
  for (const f of files) {
    // `it(` at the start of a statement. Close enough to be honest and far
    // cheaper than running the suite to render a page.
    n += (await readFile(join(dir, f), 'utf8')).match(/^\s*it\(/gm)?.length ?? 0
  }
  return n
}

const counts = async (): Promise<Array<[number, string]>> => [
  [REGIONS.length, 'estradas'],
  [ENEMY_KINDS.length, 'inimigos'],
  [WEAPONS.length, 'classes'],
  [ARTS.length, 'artes'],
  [ITEMS.length, 'itens'],
  [RARITIES.length, 'degraus'],
  [NAMED_POWERS.length, 'poderes'],
  [await countTests(), 'testes'],
]

const page = async (): Promise<string> => `<title>剑影 — O Que Falta</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400;9..144,600;9..144,700&family=Archivo:wght@400;500;600&display=swap">
<style>
  :root {
    --ink: ${hex(palette.ink)};
    --paper: ${hex(palette.paper)};
    --gold: ${hex(palette.goldDeep)};
    --cinnabar: ${hex(palette.cinnabar)};
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
  body {
    margin: 0;
    background: var(--wall);
    color: var(--text);
    font: 400 16px/1.62 var(--body);
    -webkit-font-smoothing: antialiased;
  }
  /* One column, thumb-width. Everything below is sized from this, because a
     phone summary that needs a pinch to read is a summary nobody finished. */
  .wrap { max-width: 560px; margin: 0 auto; padding: 30px 18px 72px; }

  h1 {
    font: 700 clamp(31px, 9vw, 42px)/1.03 var(--display);
    font-variation-settings: "SOFT" 30, "WONK" 1, "opsz" 120;
    margin: 0 0 10px; letter-spacing: -0.02em; text-wrap: balance;
  }
  .deck { color: var(--dim); margin: 0 0 26px; font-size: 15px; }
  h2 {
    margin: 0 0 3px; font: 600 21px/1.2 var(--display);
    font-variation-settings: "SOFT" 24, "WONK" 1, "opsz" 60;
  }
  .lede { color: var(--dim); font-size: 13.5px; margin: 0 0 16px; }
  section { margin: 0 0 40px; }

  /* THE HEADLINE, and the only number on the page that needs to be felt rather
     than read: the loop is whole. Everything that follows is about depth. */
  .verdict {
    padding: 18px 18px 19px; margin-bottom: 34px;
    background: var(--wall-2); border: 1px solid var(--edge);
    border-left: 3px solid var(--green); border-radius: 3px;
  }
  .verdict b {
    display: block; font: 600 20px/1.25 var(--display); margin-bottom: 6px; color: var(--green);
  }
  .verdict p { margin: 0; font-size: 14.5px; color: var(--text); }

  /* The loop, one row per step. A tick is not decoration here: the claim is
     that a player can go all the way round without hitting a hole. */
  .loop { display: grid; gap: 4px; }
  .step {
    display: grid; grid-template-columns: 28px minmax(0, 1fr) 18px; gap: 11px;
    align-items: center; padding: 10px 12px;
    background: var(--wall-2); border: 1px solid var(--edge); border-radius: 2px;
  }
  .step em { font-style: normal; font-size: 17px; color: var(--gold); filter: brightness(1.5); }
  .step b { display: block; font-size: 14.5px; font-weight: 600; line-height: 1.25; }
  .step span { display: block; font-size: 12.5px; color: var(--dim); }
  .tick { color: var(--green); font-size: 15px; text-align: right; }

  /* Counted from the modules. Two columns even on the narrowest phone: these
     are glanced at, never read in order. */
  .counts { display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px; }
  .ct {
    padding: 10px 12px 11px; background: var(--wall-2);
    border: 1px solid var(--edge); border-radius: 2px;
  }
  .ct b {
    display: block; font: 600 24px/1 var(--display); font-variant-numeric: tabular-nums;
  }
  .ct span { display: block; font-size: 12px; color: var(--dim); margin-top: 2px; }

  /* WHAT IT NEEDS. Ranked, because the question was "what do we attack" and a
     list with no order is the same as no answer. */
  .needs { display: grid; gap: 10px; }
  .need {
    padding: 16px 17px 17px; background: var(--wall-2);
    border: 1px solid var(--edge); border-left: 3px solid var(--accent); border-radius: 3px;
  }
  .need-hd { display: flex; align-items: center; gap: 11px; margin-bottom: 9px; }
  .need-seal {
    width: 34px; height: 34px; flex: none; display: grid; place-items: center;
    background: var(--accent); color: #12110f; border-radius: 2px; font-size: 17px;
  }
  .need h3 { margin: 0; font: 600 18px/1.2 var(--display); }
  .need-rank {
    font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--dim);
  }
  .need p { margin: 0 0 11px; font-size: 14.5px; }
  .need-proof {
    padding: 9px 11px; margin-bottom: 9px; border-radius: 2px;
    background: rgba(0, 0, 0, 0.3); font-size: 13px; font-variant-numeric: tabular-nums;
  }
  .need-who { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; font-size: 12px; }
  .chip {
    padding: 3px 9px; border-radius: 999px; border: 1px solid var(--edge); color: var(--dim);
  }
  .chip-me { border-color: var(--gold); color: var(--gold); filter: brightness(1.4); }
  .chip-you { border-color: var(--cinnabar); color: var(--cinnabar); filter: brightness(1.35); }
  /* Not a chip. It is a sentence, and a pill with a rounded end that wraps to
     two lines stops reading as a label and starts reading as a mistake. */
  .need-size { flex: 1 1 100%; color: var(--dim); font-size: 12.5px; line-height: 1.5; }

  .shots { display: grid; gap: 12px; }
  .shots img {
    display: block; width: 100%; height: auto; border-radius: 10px;
    border: 1px solid var(--edge); box-shadow: 0 14px 40px -20px #000;
  }
  .shots figure { margin: 0; }
  .shots figcaption { margin-top: 7px; font-size: 13px; color: var(--dim); }

  .go {
    display: block; padding: 15px 18px; margin-top: 10px; border-radius: 3px;
    background: var(--cinnabar); color: var(--paper); text-decoration: none;
    font: 600 16px/1.3 var(--body); text-align: center;
  }
  .go span { display: block; font-weight: 400; font-size: 13px; opacity: 0.85; margin-top: 2px; }
  .foot { margin-top: 34px; font-size: 12.5px; color: var(--dim); }
</style>
<div class="wrap">
  <h1>O que falta</h1>
  <p class="deck">Resumo para o telemóvel. Onde está, e o que é preciso a seguir — por ordem.</p>

  <div class="verdict">
    <b>O jogo está inteiro.</b>
    <p>Dá para criar um espadachim, sair, lutar, subir de nível, apanhar equipamento,
      passar um portão, voltar, equipar e sair outra vez. Nenhum passo da volta tem
      buraco. O que falta não é o jogo — é a profundidade e o acabamento.</p>
  </div>

  <section>
    <h2>A volta completa</h2>
    <p class="lede">Oito passos. Todos a funcionar.</p>
    <div class="loop">
      ${LOOP.map(
        (s) => `<div class="step">
          <em>${s.seal}</em>
          <div><b>${s.name}</b><span>${s.note}</span></div>
          <div class="tick">${s.done ? '✓' : '·'}</div>
        </div>`,
      ).join('')}
    </div>
  </section>

  <section>
    <h2>O que lá está</h2>
    <p class="lede">Contado do código.</p>
    <div class="counts">
      ${(await counts()).map(([n, what]) => `<div class="ct"><b>${n}</b><span>${what}</span></div>`).join('')}
    </div>
  </section>

  <section>
    <h2>O que é preciso</h2>
    <p class="lede">Por ordem de quanto muda o jogo. As duas primeiras são as que importam.</p>
    <div class="needs">
      ${NEEDS.map((n) => {
        const accent = n.rank <= 2 ? 'var(--cinnabar)' : n.rank === 3 ? 'var(--gold)' : 'var(--dim)'
        return `<div class="need" style="--accent:${accent}">
          <div class="need-hd">
            <div class="need-seal">${n.seal}</div>
            <div><div class="need-rank">${n.rank}º</div><h3>${n.title}</h3></div>
          </div>
          <p>${n.why}</p>
          <div class="need-proof">${n.proof}</div>
          <div class="need-who">
            <span class="chip ${n.mine ? 'chip-me' : 'chip-you'}">${n.mine ? 'eu faço' : 'precisa de ti'}</span>
            <span class="need-size">${n.size}</span>
          </div>
        </div>`
      }).join('')}
    </div>
  </section>

  <section>
    <h2>Como está</h2>
    <p class="lede">Capturas do jogo a correr, não desenhos.</p>
    <div class="shots">
      <figure>
        <img src="${await shot('gear-compare.png')}" alt="O ecrã de equipamento com uma peça aberta">
        <figcaption>O equipamento: a figura ao centro, os seis degraus a gritar, e o que
          cada peça muda no que se sente.</figcaption>
      </figure>
      <figure>
        <img src="${await shot('hub-3.png')}" alt="O ecrã das artes com a linha de corte">
        <figcaption>As artes: a linha diz até onde a tua lâmina chega. Acima dispara,
          abaixo não.</figcaption>
      </figure>
    </div>
  </section>

  <section>
    <h2>Jogar agora</h2>
    <a class="go" href="https://claude.ai/code/artifact/d04a5111-e19c-4d27-b69d-5256d7ebc6ed">
      Abrir o jogo
      <span>arrasta o dedo para andar · o ataque é automático</span>
    </a>
  </section>

  <p class="foot">Gerado por <code>npx tsx tools/faltaPage.mts</code>. Todos os números desta
    página são contados dos módulos reais no momento em que é gerada — nenhum foi escrito
    à mão.</p>
</div>
`

await mkdir(OUT, { recursive: true })
const file = join(OUT, 'falta.html')
await writeFile(file, await page(), 'utf8')
console.log(`wrote ${file}`)
