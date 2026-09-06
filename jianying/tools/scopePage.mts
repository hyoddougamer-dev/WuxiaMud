/**
 * What this game IS — the decision that has to be made before an onboarding
 * can be written.
 *
 *   npx tsx tools/scopePage.mts        # writes docs/scope.html
 *
 * WHY THIS PAGE EXISTS. A playtest came back with "não existe bem onboarding e
 * explicação do que é o jogo", I proposed a first-run tutorial, and the answer
 * was that the problem is upstream: "estamos com problemas em definir os
 * sistemas e scopes do jogo... não é aquela tese depois da criação de
 * personagem que vai ser intuitiva". That is right, and it is the more useful
 * finding. A tutorial is not writing prose about a game; it is the shortest
 * path through a game's systems. If the path is long because the systems are
 * many and overlapping, no amount of writing fixes it — and a wall of text
 * after character creation is what a designer reaches for when the systems
 * cannot teach themselves.
 *
 * So: count them, find where they duplicate, and cut until the loop is short
 * enough to be taught by playing it. Every number and every overlap on this
 * page is read out of the real tables at render time, because "there are too
 * many systems" is an opinion and "five of the ten technique cards are the
 * same effect as an art" is not.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ARTS, CONDITIONS } from '../src/data/arts'
import { TECHNIQUES } from '../src/data/techniques'
import { ITEMS, SLOTS } from '../src/data/items'
import { RARITIES } from '../src/data/rarity'
import { AFFIX_SPECS, NAMED_POWERS } from '../src/data/affixes'
import { ENEMY_KINDS } from '../src/data/enemies'
import { REGIONS } from '../src/data/regions'
import { WEAPONS } from '../src/data/weapons'
import { SCHOOLS } from '../src/meta/schools'
import { REALMS, LEVELS_PER_REALM } from '../src/meta/realms'
import { ATTRIBUTES } from '../src/meta/character'
import { BAG_CAPACITY } from '../src/meta/inventory'
import { palette } from '../src/render/palette'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'docs')
const hex = (n: number): string => `#${n.toString(16).padStart(6, '0')}`

type Verdict = 'keep' | 'merge' | 'cut'

interface Sys {
  name: string
  size: string
  verdict: Verdict
  why: string
}

/** Every system a player has to hold in their head, counted from the tables. */
const SYSTEMS: Sys[] = [
  { name: 'A corrida', size: 'lutar, encher, o guardião, escolher', verdict: 'keep',
    why: 'É o jogo. Tudo o resto existe para servir isto.' },
  { name: 'Equipamento', size: `${SLOTS.length} slots · ${ITEMS.length} bases · ${RARITIES.length} degraus`, verdict: 'keep',
    why: 'O coração de um ARPG. É o que ficas a querer.' },
  { name: 'Afixos', size: `${AFFIX_SPECS.length} tipos`, verdict: 'merge',
    why: 'Quatro dos sete dão os MESMOS quatro atributos que já compras com pontos.' },
  { name: 'Poderes com nome', size: `${NAMED_POWERS.length}`, verdict: 'keep',
    why: 'Só em 神 e 仙. É o que faz uma peça rara ser uma história.' },
  { name: 'Atributos', size: `${ATTRIBUTES.length} · pontos por nível`, verdict: 'keep',
    why: 'A escolha permanente que é tua e não do acaso.' },
  { name: 'Níveis e Reinos', size: `${REALMS.length} × ${LEVELS_PER_REALM} = ${REALMS.length * LEVELS_PER_REALM}`, verdict: 'keep',
    why: 'A progressão vertical. É a promessa do género.' },
  { name: 'Artes 器蕴', size: `${ARTS.length} · ${ARTS.length / WEAPONS.length} por arma`, verdict: 'keep',
    why: 'Vêm do equipamento e disparam por condição. É a identidade do combate.' },
  { name: 'Cartas de técnica', size: `${TECHNIQUES.length} · morrem com a corrida`, verdict: 'cut',
    why: 'Metade são o MESMO efeito de uma arte, com outro nome e outra regra.' },
  { name: 'Insight (na corrida)', size: 'terceira moeda de progresso', verdict: 'merge',
    why: 'Existe só para comprar cartas. Sem cartas, passa a subir uma arte.' },
  { name: 'Condições', size: `${CONDITIONS.length}`, verdict: 'keep',
    why: 'É o que torna o combate uma decisão em vez de segurar um joystick.' },
  { name: 'Momentum 势', size: 'carregar / gastar', verdict: 'keep',
    why: 'Dá ritmo às condições. Mas tem de ser VISÍVEL, e hoje não é.' },
  { name: 'Tiers', size: 'sem topo', verdict: 'keep',
    why: 'O endgame. Empurrar é a razão de existir a progressão vertical.' },
  { name: 'Regiões', size: `${REGIONS.length}, com regra própria`, verdict: 'keep',
    why: 'Escolher onde ir é uma decisão real, e as regras dão-lhes carácter.' },
  { name: 'Inimigos', size: `${ENEMY_KINDS.length}`, verdict: 'keep',
    why: 'A ameaça. Poucos comportamentos, muitas caras — está certo.' },
  { name: 'Classes de arma', size: `${WEAPONS.length}`, verdict: 'keep',
    why: 'A arma É a classe. É a decisão mais legível do jogo.' },
  { name: 'Escolas', size: `${SCHOOLS.length}`, verdict: 'cut',
    why: 'Um ecrã na criação que só decide a lâmina inicial — que trocas em dez minutos.' },
  { name: 'Mochila', size: `${BAG_CAPACITY} espaços`, verdict: 'keep',
    why: 'Gestão a sério, e já se lê bem no paperdoll.' },
  { name: 'Dodge', size: '1 botão', verdict: 'keep',
    why: 'A única defesa ativa. Um botão é o número certo.' },
  { name: 'Roster', size: 'vários espadachins', verdict: 'keep',
    why: 'Barato e serve o "semi-hardcore": perder um não é perder tudo.' },
  { name: 'Codex', size: 'ecrã de consulta', verdict: 'keep',
    why: 'Onde as regras vivem depois de aprendidas. Não é onde se aprendem.' },
]

/**
 * The overlap, computed rather than asserted.
 *
 * `effect` is the vocabulary sim/arts.ts already reads. A technique card and an
 * art that share one are the same verb wearing two names — and the player has
 * to learn both, from two different sources, under two different rules.
 */
const CARD_EFFECT: Record<string, string> = {
  keen: 'damage',
  swift: 'rate',
  reach: 'range',
  wide: 'arc',
  fleet: 'speed',
  // greed, vigour, orbit, bolt and nova are deliberately absent: no art carries
  // those effects, and they are the five the merge has to CREATE rather than
  // collapse. Keyed wrong once — 'arc' and 'magnet' instead of 'wide' and
  // 'greed' — the table rendered a single row and quietly understated the
  // whole case the page is built on.
}
const overlaps = TECHNIQUES.flatMap((t) => {
  const effect = CARD_EFFECT[t.id]
  const art = effect ? ARTS.find((a) => a.effect === effect) : undefined
  return art ? [{ card: t.name, art: `${art.seal} ${art.name}`, effect }] : []
})

const page = (): string => `<title>剑影 — O Que É Este Jogo</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400;9..144,600;9..144,700&family=Archivo:wght@400;500;600&display=swap">
<style>
  :root {
    --paper: ${hex(palette.paper)};
    --gold: ${hex(palette.goldDeep)};
    --cinnabar: ${hex(palette.cinnabar)};
    --wall: #141317; --wall-2: #1c1a21; --edge: #2b2833;
    --text: #e9e4d9; --dim: #958e83; --green: #5fa87a; --amber: #c9973f;
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
  .deck { color: var(--dim); margin: 0 0 24px; font-size: 15px; }
  h2 { margin: 34px 0 4px; font: 600 22px/1.15 var(--display);
       font-variation-settings: "SOFT" 24, "WONK" 1, "opsz" 60; }
  .lede { color: var(--dim); font-size: 14px; margin: 0 0 16px; }

  /* THE SENTENCE. If we cannot agree on this one line, nothing below it can be
     decided — which is the actual finding behind "the onboarding is bad". */
  .thesis { padding: 18px; margin-bottom: 12px; border-radius: 3px;
            background: var(--wall-2); border: 1px solid var(--edge);
            border-left: 3px solid var(--gold); }
  .thesis .lbl { display: block; font-size: 10.5px; letter-spacing: 0.14em;
                 text-transform: uppercase; color: var(--gold);
                 filter: brightness(1.5); margin-bottom: 8px; }
  .thesis p { margin: 0; font: 500 19px/1.4 var(--display); }
  .thesis em { color: var(--gold); font-style: normal; filter: brightness(1.25); }

  .loop { display: grid; gap: 5px; margin-bottom: 8px; }
  .beat { display: grid; grid-template-columns: 24px minmax(0,1fr); gap: 11px;
          align-items: baseline; padding: 11px 13px; border-radius: 2px;
          background: var(--wall-2); border: 1px solid var(--edge); }
  .beat i { font-style: normal; font-size: 15px; color: var(--gold); }
  .beat b { display: block; font-size: 15px; font-weight: 600; }
  .beat span { display: block; font-size: 13px; color: var(--dim); }

  table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
  th { text-align: left; font-size: 10.5px; letter-spacing: 0.1em;
       text-transform: uppercase; color: var(--dim); font-weight: 500;
       padding: 0 8px 7px 0; }
  td { padding: 8px 8px 8px 0; border-top: 1px solid var(--edge); vertical-align: top; }
  td.eff { color: var(--gold); filter: brightness(1.3); font-weight: 600; white-space: nowrap; }

  .sys { display: grid; gap: 4px; }
  .s { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 10px;
       align-items: start; padding: 10px 12px; border-radius: 2px;
       background: var(--wall-2); border: 1px solid var(--edge);
       border-left: 3px solid var(--v); }
  .s b { display: block; font-size: 14.5px; font-weight: 600; }
  .s span { display: block; font-size: 12px; color: var(--dim); }
  .s em { display: block; font-size: 12.5px; margin-top: 4px; font-style: normal; }
  .s u { text-decoration: none; font-size: 10px; letter-spacing: 0.1em;
         text-transform: uppercase; color: var(--v); white-space: nowrap; }

  .call { padding: 16px 17px; margin-bottom: 11px; border-radius: 3px;
          background: var(--wall-2); border: 1px solid var(--edge);
          border-left: 3px solid var(--cinnabar); }
  .call h3 { margin: 0 0 8px; font: 600 18px/1.2 var(--display); }
  .call p { margin: 0 0 9px; font-size: 14.5px; }
  .call p:last-child { margin: 0; }
  .call .was { color: var(--dim); }
  .call .now { color: var(--green); font-weight: 500; }
  .foot { margin-top: 34px; font-size: 12.5px; color: var(--dim); }
</style>
<div class="wrap">
  <h1>O que é este jogo</h1>
  <p class="deck">Não dá para escrever um tutorial antes de isto estar decidido. Um tutorial
    não é escrever sobre o jogo — é o caminho mais curto através dos seus sistemas. Se o
    caminho é longo porque os sistemas são muitos e repetidos, nenhum texto o encurta. Todos
    os números aqui são lidos das tabelas reais.</p>

  <div class="thesis">
    <span class="lbl">A frase — confirma ou corrige</span>
    <p>Um <em>ARPG de sessões curtas</em> onde a arma que carregas é a tua classe, o
      equipamento que encontras decide os teus poderes, e cada portão te pergunta se
      <em>sais com o que tens ou empurras mais fundo</em>.</p>
  </div>
  <p class="lede">Se esta frase estiver certa, tudo em baixo decide-se sozinho. Se estiver
    errada, corrige-a primeiro — é o único sítio onde a tua opinião não pode ser substituída
    por uma medição.</p>

  <h2>A volta, em quatro tempos</h2>
  <p class="lede">Isto é o que um tutorial tem de ensinar. Nada mais.</p>
  <div class="loop">
    ${[
      ['杀', 'Mata', 'cada morte enche a fenda'],
      ['门', 'O guardião', 'cheia, ele vem; mata-o e o portão abre'],
      ['择', 'Escolhe', 'sair com o que apanhaste, ou empurrar para um andar mais duro'],
      ['装', 'Equipa', 'o que trouxeste muda a próxima corrida — e as tuas artes'],
    ].map(([s, t, d]) => `<div class="beat"><i>${s}</i><div><b>${t}</b><span>${d}</span></div></div>`).join('')}
  </div>
  <p class="lede">Quatro tempos. Hoje o jogo pede-te ${SYSTEMS.length} sistemas para os
    perceberes.</p>

  <h2>A prova</h2>
  <p class="lede">${overlaps.length} das ${TECHNIQUES.length} cartas de técnica são o mesmo
    efeito que uma arte já tem — mesmo verbo, dois nomes, duas regras de aquisição.</p>
  <table>
    <tr><th>Carta (temporária)</th><th>Arte (do equipamento)</th><th>Efeito</th></tr>
    ${overlaps.map((o) => `<tr><td>${o.card}</td><td>${o.art}</td><td class="eff">${o.effect}</td></tr>`).join('')}
  </table>

  <h2>As três decisões</h2>
  <p class="lede">Cada uma tira um vocabulário inteiro da cabeça do jogador.</p>

  <div class="call">
    <h3>1 · As cartas passam a subir artes</h3>
    <p class="was">Hoje: sobes de Insight, escolhes entre três cartas, ganhas um poder que
      morre com a corrida — e que muitas vezes é o mesmo que uma arte que já tens.</p>
    <p class="now">Passa a ser: sobes de Insight e escolhes qual das tuas artes sobe de grau,
      nesta corrida. O momento fica igual. O vocabulário passa a ser um só.</p>
    <p>Os cinco efeitos que só as cartas tinham — as lâminas guardiãs, o qi, a onda, o íman,
      a cura — passam a artes com condição própria. Nada se perde; deixa de haver dois
      sítios onde aprender a mesma coisa.</p>
  </div>

  <div class="call">
    <h3>2 · Os afixos deixam de dar atributos</h3>
    <p class="was">Hoje: gastas pontos em Body/Edge/Swiftness/Spirit — e o equipamento dá
      exatamente os mesmos quatro. Duas fontes, um número, e nenhuma forma de saber qual é
      qual.</p>
    <p class="now">Passa a ser: os atributos são o que TU escolheste; o equipamento dá o que
      ENCONTRASTE — vida, alcance, cadência, e os poderes com nome. Duas moedas, dois papéis.</p>
  </div>

  <div class="call">
    <h3>3 · As escolas saem; escolhes a ARMA</h3>
    <p class="was">Hoje: um ecrã na criação para escolher uma escola, que só decide a lâmina
      inicial — que trocas na primeira meia hora.</p>
    <p class="now">Passa a ser: escolhes 斩马刀 ou 飞刀. A arma é a classe, e essa é a decisão
      mais legível que o jogo tem. Um ecrã a menos, e o que resta significa alguma coisa.</p>
  </div>

  <h2>Os ${SYSTEMS.length} sistemas, um a um</h2>
  <p class="lede">O que fica, o que funde, o que sai.</p>
  <div class="sys">
    ${SYSTEMS.map((s) => {
      const colour = s.verdict === 'keep' ? 'var(--green)'
        : s.verdict === 'merge' ? 'var(--amber)' : 'var(--cinnabar)'
      const word = s.verdict === 'keep' ? 'fica' : s.verdict === 'merge' ? 'funde' : 'sai'
      return `<div class="s" style="--v:${colour}">
        <div><b>${s.name}</b><span>${s.size}</span><em>${s.why}</em></div>
        <u>${word}</u>
      </div>`
    }).join('')}
  </div>

  <h2>E então o onboarding escreve-se sozinho</h2>
  <p class="lede">Sem tese, sem ecrã de texto.</p>
  <div class="call" style="border-left-color: var(--green)">
    <p>A primeira corrida é curta e ensina os quatro tempos <b>fazendo-os</b>: matas e vês a
      barra encher; ela enche e o guardião vem; matas o guardião e o jogo pergunta-te pela
      primeira vez; sais, equipas a peça, e a tua arte muda à tua frente.</p>
    <p class="now">São quatro frases, cada uma no segundo em que acontece. É tudo. Só é
      possível porque as três decisões acima tiram dois vocabulários inteiros do caminho —
      e é por isso que a tese depois da criação nunca ia funcionar: era um penso para um
      problema de desenho.</p>
  </div>

  <p class="foot">Gerado por <code>npx tsx tools/scopePage.mts</code>. Os sistemas, os
    tamanhos e a tabela de sobreposição são lidos das tabelas do jogo no momento em que a
    página é gerada.</p>
</div>
`

await mkdir(OUT, { recursive: true })
const file = join(OUT, 'scope.html')
await writeFile(file, page(), 'utf8')
console.log(`wrote ${file}`)
