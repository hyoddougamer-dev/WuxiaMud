/**
 * One page with every mockup on it, for reading on a phone.
 *
 *   npx tsx tools/mockupsPage.mts
 *
 * The files were being delivered as attachments and not arriving. A page is a
 * LINK, and a link survives whatever the client does with attachments — so the
 * screens are inlined as SVG (they carry no ids and no defs, so several can
 * share one document safely) rather than referenced, which also keeps them
 * sharp at any size and costs a fifth of what the PNGs would.
 *
 * Generated rather than hand-written, so a screen that changes in tools/ui.ts
 * cannot silently disagree with the page that shows it.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DOCS = join(ROOT, 'docs')

const svg = async (rel: string): Promise<string> => {
  const raw = await readFile(join(DOCS, rel), 'utf8')
  // Drop the fixed width/height so the CSS can size it; the viewBox stays.
  return raw.replace(/^<svg([^>]*?)\swidth="[\d.]+"\sheight="[\d.]+"/, '<svg$1')
}

interface Shot {
  file: string
  name: string
  seal: string
  note: string
}

const COMBAT: Shot[] = [
  {
    file: 'ui/01c-play-base.svg',
    name: 'C 底 — escolhida',
    seal: '底',
    note: 'Uma só consola em baixo: vida por cima da barra das artes, 感悟 por baixo, tudo à mesma largura. Metade de cima do telemóvel vazia. Os selos das condições saíram das casas — agora são pictogramas.',
  },
  {
    file: 'ui/11-play-rift.svg',
    name: 'C, com a fenda',
    seal: '杀',
    note: 'A mesma consola, mais a aresta de 3px no topo: a fenda a encher. É a única coisa que sobrevive a apagar a HUD de cima.',
  },
]

const LEARN: Shot[] = [
  {
    file: 'ui/15-tip.svg',
    name: 'Toque longo',
    seal: '解',
    note: 'Não há tooltips em combate porque não há hover num telemóvel e o polegar está ocupado a andar. O explicar acontece aqui, onde há tempo: o que acorda a arte, o que ela faz, e quanto vale o grau seguinte. É também onde 静 e o boneco sentado aparecem lado a lado — é assim que o pictograma ganha um nome.',
  },
]

const WORLD: Shot[] = [
  {
    file: 'ui/14-world.svg',
    name: 'A tab 界, com arte',
    seal: '界',
    note: 'Cada região tem a sua vinheta, desenhada por código no mesmo vocabulário de tinta do jogo. A tab e a fenda passaram a ser um só ecrã: o andar e os presságios estão na própria carta do sítio.',
  },
]

const RIFT: Shot[] = [
  {
    file: 'ui/10-rift.svg',
    name: 'Antes de entrar',
    seal: '隙',
    note: 'O detalhe de uma fenda: o que cai lá, e o preço de ressortear.',
  },
  {
    file: 'ui/12-gate.svg',
    name: 'O portão',
    seal: '关',
    note: 'A barra chega ao fim e o chefe entra. Um selo por cima dele, não em cima dele.',
  },
  {
    file: 'ui/13-push.svg',
    name: 'Sair ou descer',
    seal: '深',
    note: 'O chefe já pagou antes desta escolha. 收 levas tudo · 深 andar seguinte com a build que acabaste de fazer.',
  },
]

const shot = async (s: Shot): Promise<string> =>
  `<figure class="shot">
     <figcaption>
       <span class="seal" aria-hidden="true">${s.seal}</span>
       <span class="shot-name">${s.name}</span>
       <span class="shot-note">${s.note}</span>
     </figcaption>
     <div class="phone">${await svg(s.file)}</div>
   </figure>`

const combat = (await Promise.all(COMBAT.map(shot))).join('\n')
const learn = (await Promise.all(LEARN.map(shot))).join('\n')
const world = (await Promise.all(WORLD.map(shot))).join('\n')
const rift = (await Promise.all(RIFT.map(shot))).join('\n')
const sheet = await svg('corridas.svg')

const BRANCH = 'claude/mobile-gaming-project-from-scratch-5xeghp'
const REPO = `https://github.com/hyoddougamer-dev/WuxiaMud/blob/${BRANCH}/jianying/docs`

const html = `<title>A Fenda e a Interface</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Old+Mincho:wght@400;600;900&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
:root {
  --ink: #191510;
  --ground: #fbf8f1;
  --raised: #f3ede0;
  --line: #ddd2bd;
  --muted: #6d6455;
  --cinnabar: #b52a24;
  --gold: #8a6d22;
  --shadow: 0 1px 2px rgba(25,21,16,.06), 0 12px 34px -14px rgba(25,21,16,.28);
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --ink: #efe7d6;
    --ground: #14120e;
    --raised: #1d1a14;
    --line: #332d23;
    --muted: #9a907e;
    --cinnabar: #e2645c;
    --gold: #cfae57;
    --shadow: 0 1px 2px rgba(0,0,0,.5), 0 16px 40px -16px rgba(0,0,0,.75);
  }
}
:root[data-theme="dark"] {
  --ink: #efe7d6;
  --ground: #14120e;
  --raised: #1d1a14;
  --line: #332d23;
  --muted: #9a907e;
  --cinnabar: #e2645c;
  --gold: #cfae57;
  --shadow: 0 1px 2px rgba(0,0,0,.5), 0 16px 40px -16px rgba(0,0,0,.75);
}

* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--ground);
  color: var(--ink);
  font: 400 16px/1.62 "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.wrap { max-width: 640px; margin: 0 auto; padding: 0 20px 96px; }

/* --- masthead ------------------------------------------------------- */
header.top { padding: 56px 0 28px; }
.mark {
  font-family: "Zen Old Mincho", serif;
  font-weight: 900;
  font-size: clamp(40px, 13vw, 62px);
  line-height: .96;
  letter-spacing: .02em;
  margin: 0;
  text-wrap: balance;
}
.mark span { color: var(--cinnabar); }
.sub {
  margin: 14px 0 0;
  max-width: 40ch;
  color: var(--muted);
  font-size: 15.5px;
}
.rule { height: 1px; background: var(--line); border: 0; margin: 34px 0 0; }

/* --- the ask -------------------------------------------------------- */
.ask {
  margin: 34px 0 0;
  padding: 22px 22px 24px;
  background: var(--raised);
  border: 1px solid var(--line);
  border-left: 3px solid var(--cinnabar);
}
.ask h2 {
  font: 600 13px/1 "IBM Plex Sans", sans-serif;
  letter-spacing: .13em;
  text-transform: uppercase;
  color: var(--cinnabar);
  margin: 0 0 12px;
}
.ask p { margin: 0; font-size: 15.5px; }
.ask p + p { margin-top: 10px; color: var(--muted); font-size: 14.5px; }

/* --- sections ------------------------------------------------------- */
section { margin-top: 64px; }
.eyebrow {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin: 0 0 6px;
  font: 500 12px/1 "IBM Plex Mono", ui-monospace, monospace;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--muted);
}
.eyebrow b { color: var(--gold); font-weight: 500; }
h2.head {
  font-family: "Zen Old Mincho", serif;
  font-weight: 600;
  font-size: clamp(26px, 7vw, 34px);
  line-height: 1.15;
  margin: 0 0 10px;
  text-wrap: balance;
}
.lede { margin: 0 0 26px; color: var(--muted); font-size: 15.5px; max-width: 46ch; }
.lede strong { color: var(--ink); font-weight: 600; }

/* --- the phones ----------------------------------------------------- */
.rail {
  display: flex;
  gap: 22px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding: 4px 0 22px;
  margin: 0 -20px;
  padding-inline: 20px;
  scrollbar-width: thin;
}
.stack { display: flex; flex-direction: column; gap: 44px; }
.shot { margin: 0; scroll-snap-align: start; flex: 0 0 auto; }
.rail .shot { width: min(340px, 78vw); }
.stack .shot { width: 100%; max-width: 390px; }
figcaption { display: block; margin-bottom: 12px; }
.seal {
  font-family: "Zen Old Mincho", serif;
  font-size: 22px;
  color: var(--cinnabar);
  margin-right: 9px;
  vertical-align: -2px;
}
.shot-name {
  font-weight: 600;
  font-size: 17px;
  font-family: "Zen Old Mincho", serif;
}
.shot-note {
  display: block;
  margin-top: 5px;
  color: var(--muted);
  font-size: 13.5px;
  line-height: 1.5;
  max-width: 44ch;
}
.phone {
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
  background: #ded3b8;
  overflow: hidden;
}
.phone svg { display: block; width: 100%; height: auto; }
.swipe {
  font: 500 11.5px/1 "IBM Plex Mono", monospace;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 14px;
}

/* --- the numbers ---------------------------------------------------- */
table.data {
  width: 100%;
  border-collapse: collapse;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: 13.5px;
  font-variant-numeric: tabular-nums;
}
.data th {
  text-align: right;
  font-weight: 500;
  color: var(--muted);
  font-size: 11.5px;
  letter-spacing: .08em;
  text-transform: uppercase;
  padding: 0 0 8px;
  border-bottom: 1px solid var(--line);
}
.data th:first-child { text-align: left; }
.data td { padding: 9px 0; border-bottom: 1px solid var(--line); text-align: right; }
.data td:first-child { text-align: left; font-family: "Zen Old Mincho", serif; font-size: 15px; }
.data tr:last-child td { border-bottom: 0; }
.bad { color: var(--cinnabar); }

/* --- links ---------------------------------------------------------- */
.links { display: flex; flex-direction: column; gap: 2px; margin-top: 22px; }
.links a {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 13px 2px;
  border-bottom: 1px solid var(--line);
  color: var(--ink);
  text-decoration: none;
  font-size: 15px;
}
.links a span { color: var(--muted); font-size: 13px; font-family: "IBM Plex Mono", monospace; }
.links a:hover { color: var(--cinnabar); }
.links a:focus-visible { outline: 2px solid var(--cinnabar); outline-offset: 3px; }

.conds {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
  gap: 1px;
  background: var(--line);
  border: 1px solid var(--line);
  margin: 0 0 30px;
}
.conds div {
  background: var(--raised);
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.conds b {
  font-family: "Zen Old Mincho", serif;
  font-size: 19px;
  font-weight: 400;
  color: var(--cinnabar);
  line-height: 1;
}
.conds span { font-size: 12.5px; color: var(--muted); }

footer {
  margin-top: 70px;
  padding-top: 22px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 13px;
}
</style>

<div class="wrap">
  <header class="top">
    <h1 class="mark">剑影<br><span>A fenda</span> e a interface</h1>
    <p class="sub">Sete ecrãs a 390×844, o tamanho real do telemóvel. Tudo o que está aqui é proposta — nada disto está construído.</p>
    <hr class="rule">
  </header>

  <div class="ask">
    <h2>O que mudou nesta versão</h2>
    <p><strong>C 底 é a UI.</strong> Os selos chineses saíram de todo o lado onde carregavam uma regra — na barra das artes são agora pictogramas. E a tab 界 deixou de ser texto: cada região tem a sua pintura.</p>
    <p>As três propostas A / B / C continuam no GitHub, no fim da página.</p>
  </div>

  <section>
    <div class="eyebrow"><span>Escolhida</span> <b>C 底</b></div>
    <h2 class="head">UI de combate</h2>
    <p class="lede">Vida, 感悟 e a barra das artes num só bloco em baixo. A metade de cima do telemóvel — onde nada é lido durante uma luta — fica vazia.</p>
    <div class="rail">
${combat}
    </div>
  </section>

  <section>
    <div class="eyebrow"><span>Legibilidade</span> <b>sem chinês obrigatório</b></div>
    <h2 class="head">O selo nunca é a única pista</h2>
    <p class="lede">A crítica estava certa e o pior caso era a barra das artes: <strong>静</strong> sozinho, na única coisa que se lê a meio de uma luta, a pedir a quem não lê chinês que aprenda um carácter a morrer. A regra agora é uma só — <strong>onde uma marca carrega uma mecânica, é um desenho do que fazer</strong>. Os selos ficam onde são identidade: nos nomes, no rolo, no hub.</p>
    <div class="conds">
      <div><b>静</b><span>parar</span></div>
      <div><b>疾</b><span>correr</span></div>
      <div><b>转</b><span>inverter</span></div>
      <div><b>围</b><span>ser cercado</span></div>
      <div><b>危</b><span>vida baixa</span></div>
    </div>
    <div class="stack">
${learn}
    </div>
  </section>

  <section>
    <div class="eyebrow"><span>Arte</span> <b>desenhada por código</b></div>
    <h2 class="head">O mundo, não uma lista</h2>
    <p class="lede">Nenhum site de assets nem API de geração de imagem é alcançável da máquina onde isto é construído — foi essa a razão de existir a direção a tinta. Por isso as vinhetas são <strong>compostas em código</strong>, com os mesmos traços que o jogo já usa: cada sítio tem uma silhueta só sua — verticais no pântano, diagonais na falésia, círculos no mercado, uma faixa horizontal no passo, e a estrada é a única com ponto de fuga.</p>
    <div class="stack">
${world}
    </div>
  </section>

  <section>
    <div class="eyebrow"><span>Corrida</span> <b>裂隙</b></div>
    <h2 class="head">O resto da fenda</h2>
    <p class="lede">A barra enche <strong>a matar</strong>, não a sobreviver. Com corridas de 38 s a 227 s conforme a região, um portão ao relógio fazia com que quatro regiões nunca vissem o próprio chefe — uma barra é uma distância e ajusta-se sozinha.</p>
    <div class="stack">
${rift}
    </div>
  </section>

  <section>
    <div class="eyebrow"><span>Porquê</span> <b>medido</b></div>
    <h2 class="head">A corrida está partida</h2>
    <p class="lede">Espadachim a meio do jogo, sem equipamento, seis seeds, dois pilotos automáticos. O melhor dos dois, por região:</p>
    <table class="data">
      <thead><tr><th>região</th><th>dura</th><th>感悟</th><th>chefes</th></tr></thead>
      <tbody>
        <tr><td>官道 Post Road</td><td>227 s</td><td>11</td><td>1</td></tr>
        <tr><td>芦荡 Reed Marsh</td><td>103 s</td><td>8</td><td class="bad">0</td></tr>
        <tr><td>断崖 Broken Cliff</td><td>70 s</td><td>4</td><td class="bad">0</td></tr>
        <tr><td>鬼市 Ghost Market</td><td>53 s</td><td>8</td><td class="bad">0</td></tr>
        <tr><td>关隘 Pass</td><td>38 s</td><td>3</td><td class="bad">0</td></tr>
      </tbody>
    </table>
    <p class="lede" style="margin-top:22px">Uma build de quatro artes precisa de <strong>16 感悟</strong> para ficar feita. A melhor corrida do jogo dá 11. E quem foge vive 227 s e apanha 5; quem luta morre aos 133 s e apanha 11 — <strong>fugir é hoje a jogada vencedora</strong>, e é o que a barra corrige.</p>
  </section>

  <section>
    <div class="eyebrow"><span>Folha</span> <b>completa</b></div>
    <h2 class="head">A corrida e as escadas</h2>
    <p class="lede">A página toda, se quiseres o resto: a forma da fenda, o que se perde e o que fica, as quatro escadas, e as artes.</p>
    <div class="phone" style="max-width:390px">${sheet}</div>
  </section>

  <section>
    <div class="eyebrow"><span>Ficheiros</span> <b>GitHub</b></div>
    <h2 class="head">Onde isto vive</h2>
    <div class="links">
      <a href="${REPO}/ui/14-world.png">A tab 界, com arte <span>png</span></a>
      <a href="${REPO}/ui/15-tip.png">Toque longo <span>png</span></a>
      <a href="${REPO}/ui/01a-play-nada.png">UI A — 无字 <span>png</span></a>
      <a href="${REPO}/ui/01b-play-margem.png">UI B — 裱 <span>png</span></a>
      <a href="${REPO}/ui/01c-play-base.png">UI C — 底 <span>png</span></a>
      <a href="${REPO}/ui/10-rift.png">A fenda, antes de entrar <span>png</span></a>
      <a href="${REPO}/ui/11-play-rift.png">A barra a encher <span>png</span></a>
      <a href="${REPO}/ui/12-gate.png">O portão <span>png</span></a>
      <a href="${REPO}/ui/13-push.png">Sair ou descer <span>png</span></a>
      <a href="${REPO}/corridas.png">A folha das corridas <span>png</span></a>
      <a href="${REPO}/CORRIDAS.md">O documento, com resumo em cima <span>md</span></a>
      <a href="${REPO}/artes-mapa.png">As 30 artes, o mapa <span>png</span></a>
    </div>
  </section>

  <footer>
    剑影 Jiànyǐng · ramo <code>${BRANCH}</code><br>
    Os ecrãs são gerados por <code>tools/ui.ts</code> a partir dos dados do jogo, e esta página por <code>tools/mockupsPage.mts</code>.
  </footer>
</div>
`

await writeFile(join(DOCS, 'mockups.html'), html, 'utf8')
console.log(`page:   docs/mockups.html  ${(html.length / 1024).toFixed(0)} kB`)
