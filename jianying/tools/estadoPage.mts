/**
 * Where the game actually stands, on one page.
 *
 *   npx tsx tools/estadoPage.mts        # writes docs/estado.html
 *
 * Not a status report I write from memory. Every count comes from the real
 * modules at render time and every screenshot is a live capture from
 * tools/shoot.ts, so this page cannot flatter the project: add an enemy and it
 * appears here, break a screen and the picture of it changes.
 *
 * The numbers that CANNOT be counted — how far ahead one attribute is, whether
 * the daggers' arts pay for themselves — are stated with the measurement that
 * produced them and the tool that reproduces it, rather than as a mood. The
 * open list is the point of the page: a status page that only lists what works
 * is an advertisement.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ARTS, CONDITIONS } from '../src/data/arts'
import { ITEMS } from '../src/data/items'
import { RARITIES } from '../src/data/rarity'
import { NAMED_POWERS, AFFIX_SPECS } from '../src/data/affixes'
import { ENEMY_KINDS } from '../src/data/enemies'
import { REGIONS } from '../src/data/regions'
import { WEAPONS } from '../src/data/weapons'
import { SCHOOLS } from '../src/meta/schools'
import { REALMS } from '../src/meta/realms'
import { palette } from '../src/render/palette'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'docs')

const hex = (n: number): string => `#${n.toString(16).padStart(6, '0')}`

/** A screenshot, inlined — a published page cannot reach the repo's files. */
const shot = async (name: string): Promise<string> => {
  const raw = await readFile(join(ROOT, 'shots', name))
  return `data:image/png;base64,${raw.toString('base64')}`
}

interface Count {
  n: number | string
  what: string
  note: string
}

const COUNTS: Count[] = [
  { n: REGIONS.length, what: 'estradas', note: 'cada uma com a sua regra: vento, gelo, nevoeiro' },
  { n: ENEMY_KINDS.length, what: 'inimigos', note: 'dois comportamentos além do perseguir' },
  { n: WEAPONS.length, what: 'classes', note: '斩马刀 corpo a corpo · 飞刀 à distância' },
  { n: ARTS.length, what: 'artes', note: `cinco por arma, ${CONDITIONS.length} condições que as acordam` },
  { n: ITEMS.length, what: 'bases de item', note: 'quatro slots' },
  { n: RARITIES.length, what: 'degraus', note: '凡 良 珍 宝 神 仙' },
  { n: AFFIX_SPECS.length, what: 'linhas de afixo', note: 'roladas por degrau e profundidade' },
  { n: NAMED_POWERS.length, what: 'poderes com nome', note: 'só em 神 e 仙' },
  { n: SCHOOLS.length, what: 'escolas', note: 'decidem a lâmina inicial' },
  { n: REALMS.length, what: 'reinos de cultivo', note: 'a progressão permanente' },
]

interface Phase {
  seal: string
  name: string
  state: 'done' | 'part' | 'open'
  what: string
}

const PHASES: Phase[] = [
  { seal: '基', name: 'Pipeline e APK', state: 'done',
    what: 'Vite + Pixi + Capacitor, o APK sai do GitHub Actions a cada push. Instalaste-o e correu.' },
  { seal: '战', name: 'Núcleo jogável', state: 'done',
    what: 'Joystick, movimento, spawner, colisões em grelha, ataque automático, dano, morte, cronómetro.' },
  { seal: '感', name: 'Feel', state: 'done',
    what: 'Hit-stop, screen shake, squash, partículas, números de dano em arco, câmara com atraso.' },
  { seal: '长', name: 'Progressão na corrida', state: 'done',
    what: 'Qi, subida de nível, escolha entre três técnicas, 势 momentum, artes que disparam por condição.' },
  { seal: '物', name: 'Conteúdo e loot', state: 'done',
    what: 'Instâncias com degrau e afixos rolados, drops no chão, mochila de 24, paperdoll com comparação.' },
  { seal: '世', name: 'Meta e persistência', state: 'part',
    what: 'Roster, reinos, atributos, save com migração — tudo local. A seed diária, os leaderboards e os fantasmas continuam por construir.' },
  { seal: '衡', name: 'Balanceamento', state: 'part',
    what: 'A fórmula em camadas está feita e medida. Os atributos ainda não estão todos a pagar-se — ver o que falta.' },
  { seal: '声', name: 'Áudio e release', state: 'open',
    what: 'Nada de som ainda. A assinatura de release e a loja também não.' },
]

interface Open {
  title: string
  body: string
  evidence: string
  tool: string
}

const OPEN: Open[] = [
  {
    title: '体 Body domina onde o jogo mata',
    body:
      'Numa estrada funda, uma corrida acaba por morreres, e o comprimento da corrida é ' +
      'quase todo comprado com quanto castigo aguentas. A ofensiva não tem canal que se ' +
      'converta em sobrevivência — só o alcance, e é fraco.',
    evidence:
      'Broken Cliff, 4 sementes: Body 20 → 130s e limpa sempre. Edge 20 → 55s, nunca limpa. ' +
      'Não gastar nada → 48s. Melhor sobre pior: 2,35×.',
    tool: 'npx tsx tools/attrValue.mts',
  },
  {
    title: '飞刀 as artes das facas não se pagam',
    body:
      'O 神 multiplica as artes, portanto vale o que a escola da arma converte. O 斩马刀 tem ' +
      '山 guard — cercado, o que te acerta pesa menos — e isso é sobrevivência. As cinco artes ' +
      'das facas são pierce, rate, echo, arc e speed: nenhuma é sobrevivência.',
    evidence:
      'Contra o piso das cartas: 斩马刀 +25% de sobrevivência, 飞刀 −19%. Duas ferramentas ' +
      'diferentes chegam ao mesmo veredicto.',
    tool: 'npx tsx tools/artsBalance.mts',
  },
  {
    title: 'O conteúdo acaba antes do equipamento',
    body:
      'Com tudo a degrau 4, todas as folhas limpam todas as regiões — incluindo a que não ' +
      'gastou um ponto. Não é que os atributos deixem de contar: é que não há estrada que um ' +
      'espadachim equipado possa perder, portanto não há nada para medir no topo.',
    evidence: 'Rung 4, The Pass: melhor sobre pior 1,04×. Todas limpam, todas em ~66s.',
    tool: 'npx tsx tools/attrValue.mts --geared',
  },
  {
    title: 'Fugir sobrevive a lutar, no Passo',
    body:
      'Numa das cinco estradas o piloto que só foge dura mais do que o que combate. É uma ' +
      'decisão de desenho por tomar — rampa de dificuldade, ou uma regra que puna a fuga — ' +
      'não um bug a corrigir às cegas.',
    evidence: 'Uma região em cinco. Preso por um teste para não piorar em silêncio.',
    tool: 'npx tsx tools/runLength.mts',
  },
]

const page = async (): Promise<string> => `<title>剑影 — Onde Estamos</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400;9..144,600;9..144,700&family=Archivo:wght@400;500;600&family=Archivo+Mono:wght@400;500&display=swap">
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
    --amber: #c9973f;
    --display: Fraunces, "Iowan Old Style", Georgia, serif;
    --body: Archivo, "Helvetica Neue", Arial, sans-serif;
    --mono: "Archivo Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
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
  .wrap { max-width: 1080px; margin: 0 auto; padding: 40px 20px 96px; }
  h1 {
    font: 700 clamp(32px, 7vw, 52px)/1.02 var(--display);
    font-variation-settings: "SOFT" 30, "WONK" 1, "opsz" 120;
    margin: 0 0 8px; letter-spacing: -0.018em; text-wrap: balance;
  }
  .deck { color: var(--dim); margin: 0 0 40px; max-width: 62ch; font-size: 16px; }
  h2 {
    margin: 0 0 4px; font: 600 24px/1.15 var(--display);
    font-variation-settings: "SOFT" 24, "WONK" 1, "opsz" 60; letter-spacing: -0.01em;
  }
  .lede { color: var(--dim); margin: 0 0 20px; max-width: 62ch; font-size: 14px; }
  section { margin: 0 0 52px; }

  /* Where it is. A ladder of phases, each with a state that is a WORD as well
     as a colour — "part" is the honest one and it must not hide. */
  .phases { display: grid; gap: 5px; }
  .ph {
    display: grid; grid-template-columns: 36px minmax(0, 1fr) 96px; gap: 14px;
    align-items: baseline; padding: 12px 14px;
    background: var(--wall-2); border: 1px solid var(--edge); border-radius: 2px;
    border-left: 3px solid var(--st);
  }
  .ph-seal { font-size: 19px; color: var(--st); line-height: 1; }
  .ph b { display: block; font: 600 15px/1.3 var(--body); }
  .ph span { display: block; font-size: 13px; color: var(--dim); }
  .ph em {
    font-style: normal; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--st); text-align: right;
  }

  /* What is in it. Counted from the modules, so the page cannot round up. */
  .counts { display: grid; grid-template-columns: repeat(auto-fill, minmax(158px, 1fr)); gap: 6px; }
  .ct { padding: 12px 13px 13px; background: var(--wall-2); border: 1px solid var(--edge); border-radius: 2px; }
  .ct b {
    display: block; font: 600 28px/1 var(--display); font-variant-numeric: tabular-nums;
    color: var(--text); margin-bottom: 2px;
  }
  .ct u { display: block; text-decoration: none; font-size: 13px; font-weight: 500; }
  .ct span { display: block; font-size: 11.5px; line-height: 1.4; color: var(--dim); margin-top: 3px; }

  /* The screens, as they actually render. */
  .screens { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 18px; }
  .sc figure { margin: 0; }
  .sc img {
    display: block; width: 100%; height: auto; border-radius: 10px;
    border: 1px solid var(--edge); box-shadow: 0 18px 44px -20px #000;
  }
  .sc figcaption { margin-top: 9px; font-size: 12.5px; color: var(--dim); }
  .sc figcaption b { display: block; color: var(--text); font-weight: 600; font-size: 13.5px; }

  /* What is open. The point of the page, so it gets the loudest treatment on
     it — and every entry carries the measurement and the command to repeat it,
     because a known problem without a reproduction is a rumour. */
  .opens { display: grid; gap: 10px; }
  .op {
    padding: 15px 17px 16px; background: var(--wall-2);
    border: 1px solid var(--edge); border-left: 3px solid var(--cinnabar); border-radius: 2px;
  }
  .op h3 { margin: 0 0 6px; font: 600 17px/1.25 var(--display); color: var(--text); }
  .op p { margin: 0 0 10px; font-size: 14px; max-width: 68ch; }
  .op .ev {
    margin: 0 0 9px; padding: 9px 11px; background: rgba(0, 0, 0, 0.28);
    border-radius: 2px; font: 400 12.5px/1.6 var(--mono); color: var(--text);
  }
  .op code {
    font: 500 12px/1.6 var(--mono); color: var(--gold); filter: brightness(1.55);
  }

  /* How to run it. */
  .steps { display: grid; gap: 12px; counter-reset: step; }
  .st {
    display: grid; grid-template-columns: 26px minmax(0, 1fr); gap: 13px;
    padding: 14px 15px; background: var(--wall-2);
    border: 1px solid var(--edge); border-radius: 2px;
  }
  .st-n {
    width: 26px; height: 26px; display: grid; place-items: center; border-radius: 50%;
    background: var(--cinnabar); color: var(--paper);
    font: 600 13px/1 var(--body); font-variant-numeric: tabular-nums;
  }
  .st b { display: block; font-size: 15px; font-weight: 600; margin-bottom: 3px; }
  .st p { margin: 8px 0 0; font-size: 13.5px; color: var(--dim); max-width: 66ch; }
  pre {
    margin: 0; padding: 10px 12px; overflow-x: auto; border-radius: 2px;
    background: rgba(0, 0, 0, 0.32); font: 400 13px/1.75 var(--mono); color: var(--text);
  }
  pre .c { color: var(--dim); }
  .foot {
    margin-top: 46px; padding-top: 18px; border-top: 1px solid var(--edge);
    font-size: 12.5px; color: var(--dim);
  }
</style>
<div class="wrap">
  <h1>剑影 — Onde Estamos</h1>
  <p class="deck">Todos os números desta página são contados dos módulos reais no momento em
    que é gerada, e todas as capturas são do jogo a correr no harness. O que não se pode
    contar — quanto um atributo está à frente do outro — vem com a medição que o produziu e
    o comando que a repete. A lista do que falta é o ponto da página: um estado que só lista
    o que funciona é publicidade.</p>

  <section>
    <h2>Onde está</h2>
    <p class="lede">Oito passagens. Três estados: feito, a meio, por começar.</p>
    <div class="phases">
      ${PHASES.map((p) => {
        const st = p.state === 'done' ? 'var(--green)' : p.state === 'part' ? 'var(--amber)' : 'var(--dim)'
        const word = p.state === 'done' ? 'feito' : p.state === 'part' ? 'a meio' : 'por começar'
        return `<div class="ph" style="--st:${st}">
          <div class="ph-seal">${p.seal}</div>
          <div><b>${p.name}</b><span>${p.what}</span></div>
          <em>${word}</em>
        </div>`
      }).join('')}
    </div>
  </section>

  <section>
    <h2>O que lá está dentro</h2>
    <p class="lede">Contado do código, não de memória.</p>
    <div class="counts">
      ${COUNTS.map(
        (c) => `<div class="ct"><b>${c.n}</b><u>${c.what}</u><span>${c.note}</span></div>`,
      ).join('')}
    </div>
  </section>

  <section>
    <h2>O ecrã de equipamento, agora</h2>
    <p class="lede">Capturas do jogo a correr, a 390&times;844 — não desenhos.</p>
    <div class="screens">
      <div class="sc"><figure>
        <img src="${await shot('gear-ranked.png')}" alt="A mochila fechada, com os seis degraus">
        <figcaption><b>A mochila</b>A figura ao centro, as quatro peças vestidas ao lado, 24 casas
          por baixo. Os seis degraus lêem-se sem ler uma palavra.</figcaption>
      </figure></div>
      <div class="sc"><figure>
        <img src="${await shot('gear-compare.png')}" alt="Uma peça aberta, com a folha de comparação">
        <figcaption><b>A folha</b>Nome, degrau, linhas roladas, poder com nome — e o que muda no
          que se sente. Só as linhas que mexem são desenhadas.</figcaption>
      </figure></div>
      <div class="sc"><figure>
        <img src="${await shot('gear-focus.png')}" alt="A mochila filtrada por slot">
        <figcaption><b>O filtro</b>Tocar num slot estreita a mochila a ele e abre o que lá está —
          "quais são as minhas opções" e "o que estou a dar" numa só passagem.</figcaption>
      </figure></div>
    </div>
  </section>

  <section>
    <h2>O que está aberto</h2>
    <p class="lede">Quatro coisas medidas e não resolvidas. Cada uma traz o número e o comando
      que o reproduz.</p>
    <div class="opens">
      ${OPEN.map(
        (o) => `<div class="op">
          <h3>${o.title}</h3>
          <p>${o.body}</p>
          <div class="ev">${o.evidence}</div>
          <code>${o.tool}</code>
        </div>`,
      ).join('')}
    </div>
  </section>

  <section>
    <h2>Como testar no PC</h2>
    <p class="lede">Precisas de Node 22 e de git. Tudo corre de dentro de <code>jianying/</code>
      — a raiz do repositório é outro projeto, com o seu próprio package.json.</p>
    <div class="steps">
      <div class="st"><div class="st-n">1</div><div>
        <b>Trazer o código</b>
        <pre>git clone https://github.com/hyoddougamer-dev/WuxiaMud.git
cd WuxiaMud
git checkout claude/mobile-gaming-project-from-scratch-5xeghp
cd jianying
npm install</pre>
      </div></div>
      <div class="st"><div class="st-n">2</div><div>
        <b>Jogar no browser</b>
        <pre>npm run dev            <span class="c"># http://127.0.0.1:5273</span></pre>
        <p>Abre as DevTools (F12), liga o modo dispositivo (Ctrl+Shift+M) e escolhe um telemóvel
          de 393&times;851. Não é cosmético: o jogo é vertical e o joystick é um evento de
          toque, por isso sem emulação de toque estás a testar outra coisa. Gravar um ficheiro
          recarrega em cerca de um segundo.</p>
      </div></div>
      <div class="st"><div class="st-n">3</div><div>
        <b>Jogar no telemóvel com o código a correr no PC</b>
        <pre>npm run dev:lan        <span class="c"># imprime http://192.168.x.x:5273</span></pre>
        <p>Abres esse endereço no telemóvel, na mesma rede. Toque real, ecrã real, GPU real, e
          continua a recarregar sozinho. Evita o ciclo de cinco minutos do APK. Só não passa por
          aqui o que é nativo — hápticos, barra de estado, gravação via Capacitor.</p>
      </div></div>
      <div class="st"><div class="st-n">4</div><div>
        <b>As verificações</b>
        <pre>npm run check          <span class="c"># typecheck + lint + os testes</span>
npm run build          <span class="c"># e depois</span>
npx tsx tools/shoot.ts <span class="c"># capturas + as asserções visuais</span></pre>
        <p>Um só comando de propósito para os três primeiros: corridos em separado, esquece-se
          sempre o terceiro. O <code>shoot</code> abre o Chromium, joga sozinho e falha com
          código diferente de zero se um ecrã deixou de dizer o que devia.</p>
      </div></div>
      <div class="st"><div class="st-n">5</div><div>
        <b>As ferramentas de balanceamento</b>
        <pre>npx tsx tools/attrValue.mts          <span class="c"># vinte pontos, quatro maneiras</span>
npx tsx tools/attrValue.mts --geared <span class="c"># o mesmo, equipado</span>
npx tsx tools/artsBalance.mts        <span class="c"># as artes contra as cartas</span>
npx tsx tools/runLength.mts          <span class="c"># quanto dura uma corrida</span></pre>
        <p>São simulações sem ecrã, com sementes fixas — o mesmo comando dá sempre o mesmo
          número. É com estas que se reproduz tudo o que está na lista acima.</p>
      </div></div>
    </div>
  </section>

  <p class="foot">Gerado por <code>npx tsx tools/estadoPage.mts</code>. Branch
    <code>claude/mobile-gaming-project-from-scratch-5xeghp</code>. O APK sai do GitHub Actions
    a cada push.</p>
</div>
`

await mkdir(OUT, { recursive: true })
const file = join(OUT, 'estado.html')
await writeFile(file, await page(), 'utf8')
console.log(`wrote ${file}`)
