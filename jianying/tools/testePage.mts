/**
 * What I need him to test, because I cannot.
 *
 *   npx tsx tools/testePage.mts        # writes docs/teste.html
 *
 * THE PREMISE CHANGED AND THE ANALYSIS HAD TO. I had been reading this as a
 * survivors-like, where a run that never ends is a run with no stakes, and
 * ranked "make a run end" first. It is an ARPG with vertical progression, where
 * an endless push is the endgame — so the question is not whether the run ends,
 * it is whether the REWARD keeps pace with the danger. Measured under the right
 * lens the headline finding inverted: pushing eighteen tiers multiplies the
 * chance of an 仙 by 1.25x, while the SIZE of the lines on a piece grows 2.4x.
 * The invisible half of the reward scales and the visible half does not.
 *
 * That is precisely the kind of thing a playtest catches as "the drops feel the
 * same", and precisely the kind of thing no headless tool of mine can feel. So
 * this page is not a report. It is five things to DO with a thumb and the exact
 * question each one answers, sized so it can be finished in one sitting.
 *
 * NOTES ARE KEPT IN localStorage AND COPIED OUT IN ONE TAP. Not in a runtime
 * capability: this is one person, one device, one session, with a game running
 * beside it — a per-viewer convenience, and the state never has to be read back
 * by me from the page. What has to work is that his answers reach me, and a
 * button that puts every note on the clipboard does that in one tap where
 * retyping fifteen answers into a chat does not.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { REGIONS } from '../src/data/regions'
import { palette } from '../src/render/palette'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'docs')
const hex = (n: number): string => `#${n.toString(16).padStart(6, '0')}`

interface Mission {
  seal: string
  name: string
  minutes: string
  /** What to physically do. Imperative, one action. */
  doing: string
  /** The questions. Each one has to change something I would build. */
  asks: string[]
  /** Why I cannot answer it myself. Earns the ask. */
  blind: string
}

const MISSIONS: Mission[] = [
  {
    seal: '手',
    name: 'Os primeiros 60 segundos',
    minutes: '1 min',
    doing:
      'Começa uma expedição na ' + REGIONS[0]!.name + ' e não faças mais nada senão andar ' +
      'e deixar o golpe sair sozinho. Vira, pára, vira outra vez.',
    asks: [
      'O espadachim vai onde o polegar manda, ou tens de corrigir?',
      'Consegues virar sem levantar o dedo?',
      'O golpe acerta onde estás a olhar, ou parece sair atrasado?',
      'O botão DODGE está ao alcance sem largares o joystick?',
    ],
    blind:
      'Eu movo isto com o rato num Chromium sem toque. Nunca senti este joystick e o meu ' +
      'piloto de testes é uma função matemática — anda perfeito, o que é exatamente o que ' +
      'um polegar não faz.',
  },
  {
    seal: '挡',
    name: 'A lâmina a cortar flechas',
    minutes: '3 min',
    doing:
      'Vai ao ' + REGIONS[2]!.name + ' — tem besteiros e falcões. Deixa-os disparar-te e ' +
      'fica de frente para eles. Procura o 挡 dourado a saltar do teu espadachim.',
    asks: [
      'Vês o 挡? Percebeste, sem eu te dizer, que estás a cortar flechas no ar?',
      'Ouves o som do parry no meio dos golpes, ou perde-se?',
      'A vibração do parry ajuda ou é ruído?',
      'Depois de perceberes, o ALCANCE da tua arma passou a parecer importante?',
    ],
    blind:
      'É a maior mudança desta passagem e é a que mais me preocupa: um parry é a AUSÊNCIA ' +
      'de dano. Se não se vê nem se ouve, o jogador aprende que o alcance não faz nada — ' +
      'que era a conclusão certa há uma semana. Os números dizem que funciona; se se sente, ' +
      'não faço ideia.',
  },
  {
    seal: '目',
    name: 'Ler enquanto lutas',
    minutes: '2 min',
    doing:
      'Com o ecrã cheio de inimigos, tenta ler a vida, a barra da fenda e a fita das artes ' +
      'em baixo — sem parar de andar. Depois deixa cair equipamento e olha para ele de longe.',
    asks: [
      'Consegues ler a vida sem tirar os olhos do combate?',
      'A fita das artes: percebes qual está acesa e porquê?',
      'Um item no chão, a meio ecrã de distância: sabes o degrau só pela cor?',
      'Alguma coisa te apeteceu que fosse maior?',
    ],
    blind:
      'Vejo capturas paradas a 390px numa janela de PC. Não sei o que sobrevive a um telemóvel ' +
      'ao sol, com o polegar a tapar o canto de baixo.',
  },
  {
    seal: '门',
    name: 'Empurrar até ao 4º portão',
    minutes: '10 min',
    doing:
      'Numa corrida só, passa o portão e escolhe EMPURRAR de cada vez. Chega ao tier 4 ou 5. ' +
      'Repara no que cai no tier 1 e no que cai no tier 4.',
    asks: [
      'Os drops do tier 4 pareceram-te melhores que os do tier 1? Ou iguais?',
      'Em que tier começaste a sentir perigo a sério?',
      'Empurrar apeteceu, ou fizeste-o só porque eu pedi?',
      'Quando bancaste, o que ganhaste pareceu-te pago pelo risco?',
    ],
    blind:
      'ESTE É O TESTE MAIS IMPORTANTE DA LISTA. Medi que empurrar 18 portões multiplica a ' +
      'hipótese de um 仙 por 1,25 — praticamente nada — enquanto os NÚMEROS das linhas ' +
      'crescem 2,4x. Ou seja: as peças ficam melhores mas continuam da mesma cor. Se me ' +
      'disseres "pareceu igual", sei exatamente o que corrigir.',
  },
  {
    seal: '装',
    name: 'De volta ao hub',
    minutes: '3 min',
    doing:
      'Abre o separador 装, toca numa peça da mochila, lê a folha, veste-a. Depois toca num ' +
      'slot da figura. Depois vai ao separador 法.',
    asks: [
      'A folha de comparação disse-te o que precisavas para decidir?',
      'Percebeste que tocar num slot filtra a mochila?',
      'No 法: percebeste que a tua lâmina decide QUANTAS artes acordam, e que a ordem é tua?',
      'Faltou-te algum número para decidir?',
    ],
    blind:
      'Construí estes três ecrãs a olhar para capturas. Sei que funcionam; não sei se se ' +
      'percebem sem alguém ao lado a explicar.',
  },
  {
    seal: '久',
    name: 'E no fim',
    minutes: '—',
    doing: 'Quando te apetecer parar, pára. E repara em porquê.',
    asks: [
      'Quanto tempo jogaste ao todo?',
      'Paraste por tédio, por frustração, ou por satisfação?',
      'Apetecia-te voltar amanhã? Porquê ou porque não?',
      'Qual foi o momento mais divertido? E o mais chato?',
    ],
    blind:
      'A única pergunta que nenhuma ferramenta responde. Todo o balanceamento que fiz é o que ' +
      'os números dizem — se é DIVERTIDO só tu podes dizer, e é a pergunta que decide o que ' +
      'vale a pena construir a seguir.',
  },
]

const page = (): string => `<title>剑影 — O Teste</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400;9..144,600;9..144,700&family=Archivo:wght@400;500;600&display=swap">
<style>
  :root {
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
    margin: 0; background: var(--wall); color: var(--text);
    font: 400 16px/1.6 var(--body); -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: 560px; margin: 0 auto; padding: 28px 18px 40px; }
  h1 {
    font: 700 clamp(30px, 9vw, 40px)/1.04 var(--display);
    font-variation-settings: "SOFT" 30, "WONK" 1, "opsz" 120;
    margin: 0 0 9px; letter-spacing: -0.02em; text-wrap: balance;
  }
  .deck { color: var(--dim); margin: 0 0 22px; font-size: 15px; }

  /* The correction, first and in the open. He changed the premise; the
     analysis that followed from the old one has to be withdrawn out loud, not
     quietly replaced. */
  .fix {
    padding: 16px 17px 17px; margin-bottom: 26px; border-radius: 3px;
    background: var(--wall-2); border: 1px solid var(--edge);
    border-left: 3px solid var(--gold);
  }
  .fix b { display: block; font: 600 17px/1.25 var(--display); color: var(--gold);
           filter: brightness(1.3); margin-bottom: 6px; }
  .fix p { margin: 0 0 9px; font-size: 14.5px; }
  .fix p:last-child { margin: 0; }
  .fix .num {
    display: block; padding: 9px 11px; margin: 10px 0; border-radius: 2px;
    background: rgba(0,0,0,0.3); font-size: 13.5px; font-variant-numeric: tabular-nums;
  }

  .go {
    display: block; padding: 15px 18px; margin: 0 0 26px; border-radius: 3px;
    background: var(--cinnabar); color: var(--paper); text-decoration: none;
    font: 600 16px/1.3 var(--body); text-align: center;
  }
  .go span { display: block; font-weight: 400; font-size: 13px; opacity: 0.85; margin-top: 2px; }

  .m {
    margin-bottom: 12px; border-radius: 3px; background: var(--wall-2);
    border: 1px solid var(--edge); border-left: 3px solid var(--edge); overflow: hidden;
  }
  /* A mission whose notes have something in them. The only state the page
     shows, and it has to be visible while scrolling past at speed. */
  .m.filled { border-left-color: var(--green); }
  .m-hd { display: flex; align-items: center; gap: 11px; padding: 15px 16px 0; }
  .m-seal {
    width: 34px; height: 34px; flex: none; display: grid; place-items: center;
    background: var(--gold); color: #12110f; border-radius: 2px; font-size: 17px;
  }
  .m h2 { margin: 0; font: 600 18px/1.2 var(--display); }
  .m-min { font-size: 11.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--dim); }
  .m-body { padding: 11px 16px 16px; }
  .m-do {
    padding: 11px 12px; margin-bottom: 12px; border-radius: 2px;
    background: rgba(212,175,55,0.07); border: 1px solid rgba(212,175,55,0.2);
    font-size: 14.5px;
  }
  .m-do em { font-style: normal; display: block; font-size: 11px; letter-spacing: 0.1em;
             text-transform: uppercase; color: var(--gold); filter: brightness(1.4);
             margin-bottom: 4px; }
  .m ul { margin: 0 0 12px; padding-left: 20px; }
  .m li { margin-bottom: 6px; font-size: 14.5px; }
  .m-blind { font-size: 13px; color: var(--dim); margin: 0 0 12px; }
  .m-blind b { color: var(--text); font-weight: 600; }
  textarea {
    width: 100%; min-height: 82px; padding: 11px 12px; resize: vertical;
    font: 400 15px/1.5 var(--body); color: var(--text);
    background: rgba(0,0,0,0.32); border: 1px solid var(--edge); border-radius: 2px;
  }
  textarea:focus { outline: 2px solid var(--gold); outline-offset: 1px; border-color: transparent; }

  /* Pinned, because the point of writing notes is getting them to me and the
     button that does it must never be something you scroll to find. */
  /* The fade has to reach full opacity FAST. At 28% the cinnabar "open the
     game" button showed through the top of it as a red stripe, which reads as
     a rendering bug rather than as a soft edge. */
  .bar {
    position: sticky; bottom: 0; margin: 18px -18px -40px; padding: 16px 18px
      calc(14px + env(safe-area-inset-bottom, 0));
    background: linear-gradient(transparent, var(--wall) 14px);
  }
  .copy {
    display: block; width: 100%; padding: 15px; border: 0; border-radius: 3px;
    background: var(--gold); color: #12110f; font: 600 16px/1.2 var(--body); cursor: pointer;
  }
  .copy:active { transform: scale(0.99); }
  .copy.done { background: var(--green); }
  .hint { margin: 8px 0 0; font-size: 12px; color: var(--dim); text-align: center; }
</style>
<div class="wrap">
  <h1>O que preciso que testes</h1>
  <p class="deck">Seis coisas para fazer com o polegar, e a pergunta exata que cada uma
    responde. Escreve as respostas aqui — ficam guardadas neste telemóvel — e no fim carrega
    em copiar e cola-me tudo.</p>

  <div class="fix">
    <b>Primeiro, uma correção minha</b>
    <p>Eu li isto como survivors-like e pus “fazer a corrida acabar” em primeiro lugar. Num
      ARPG o empurrar sem fim <em>é</em> o endgame — a pergunta certa é se a recompensa
      acompanha o perigo. Medi outra vez:</p>
    <span class="num">empurrar 18 portões<br>hipótese de 仙 &times;1,25 &nbsp;·&nbsp;
      tamanho das linhas &times;2,4</span>
    <p>As peças fundas <em>são</em> melhores, mas continuam da mesma cor. A missão 门 é o
      teste disto.</p>
  </div>

  <a class="go" href="https://claude.ai/code/artifact/d04a5111-e19c-4d27-b69d-5256d7ebc6ed">
    Abrir o jogo
    <span>arrasta o dedo para andar · o ataque é automático</span>
  </a>

  ${MISSIONS.map(
    (m, i) => `<section class="m" id="m${i}">
      <div class="m-hd">
        <div class="m-seal">${m.seal}</div>
        <div><div class="m-min">${m.minutes}</div><h2>${m.name}</h2></div>
      </div>
      <div class="m-body">
        <div class="m-do"><em>Fazer</em>${m.doing}</div>
        <ul>${m.asks.map((a) => `<li>${a}</li>`).join('')}</ul>
        <p class="m-blind"><b>Porque não consigo ver isto:</b> ${m.blind}</p>
        <textarea data-note="${i}" data-name="${m.seal} ${m.name}"
          placeholder="As tuas respostas…" aria-label="Notas para ${m.name}"></textarea>
      </div>
    </section>`,
  ).join('')}

  <div class="bar">
    <button class="copy" type="button">Copiar tudo para me colares</button>
    <p class="hint">As notas ficam guardadas só neste telemóvel.</p>
  </div>
</div>
<script>
  // localStorage, wrapped, because it throws outright in some contexts (a
  // thumbnail capture, a browser set to block site data) and a checklist that
  // takes the page down rather than forgetting a note is a worse checklist.
  var KEY = 'jianying.teste.v1'
  var notes = {}
  try { notes = JSON.parse(localStorage.getItem(KEY) || '{}') } catch (e) { notes = {} }

  var areas = document.querySelectorAll('textarea[data-note]')
  function mark(a) {
    var card = a.closest('.m')
    if (card) card.classList.toggle('filled', a.value.trim().length > 0)
  }
  areas.forEach(function (a) {
    var id = a.getAttribute('data-note')
    if (notes[id]) a.value = notes[id]
    mark(a)
    a.addEventListener('input', function () {
      notes[id] = a.value
      try { localStorage.setItem(KEY, JSON.stringify(notes)) } catch (e) { /* full or blocked */ }
      mark(a)
    })
  })

  var btn = document.querySelector('.copy')
  btn.addEventListener('click', function () {
    // Only the missions actually answered. A wall of empty headings is worse
    // than a short honest report.
    var out = []
    areas.forEach(function (a) {
      if (a.value.trim()) out.push('## ' + a.getAttribute('data-name') + '\\n' + a.value.trim())
    })
    var text = out.length ? 'Playtest 剑影\\n\\n' + out.join('\\n\\n') : ''
    if (!text) { btn.textContent = 'Ainda não escreveste nada'; return }
    function done() {
      btn.textContent = 'Copiado — cola no chat'
      btn.classList.add('done')
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback)
    } else fallback()
    function fallback() {
      // Older mobile browsers, and any page not served over https. Selecting
      // the text is the worst case, not a dead button.
      var t = document.createElement('textarea')
      t.value = text
      t.style.position = 'fixed'
      t.style.opacity = '0'
      document.body.appendChild(t)
      t.select()
      try { document.execCommand('copy'); done() } catch (e) {
        btn.textContent = 'Copia à mão daqui'
        t.style.opacity = '1'
        t.style.inset = '10% 5%'
        t.style.height = '80%'
        return
      }
      document.body.removeChild(t)
    }
  })
</script>
`

await mkdir(OUT, { recursive: true })
const file = join(OUT, 'teste.html')
await writeFile(file, page(), 'utf8')
console.log(`wrote ${file}`)
