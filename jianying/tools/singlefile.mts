/**
 * O jogo inteiro num ficheiro HTML, para poder ser aberto a partir de um link.
 *
 *   npx tsx tools/singlefile.mts
 *
 * Isto existe por causa de uma barreira que era maior do que parecia. Testar o
 * jogo exigia ou um APK no telemóvel, ou Node + npm install + um terminal no
 * PC. Nenhuma das duas é difícil, mas ambas são trabalho ANTES do primeiro
 * segundo de jogo — e quando alguém só quer ver como está, esse trabalho é o
 * que faz desistir.
 *
 * Um ficheiro único não precisa de nada: abre-se no browser e joga-se.
 *
 * Escreve dois ficheiros a partir do mesmo build:
 *
 *   dist-single/jianying.html           documento completo, para abrir do disco
 *   dist-single/jianying-artifact.html  só o conteúdo, para publicar como página
 *
 * O segundo existe porque o publicador de páginas envolve o que recebe no seu
 * próprio <!doctype>/<head>/<body>, e um documento completo lá dentro daria
 * HTML aninhado.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'dist-single')

console.log('== build')
execFileSync('npx', ['vite', 'build', '--config', 'vite.config.single.ts'], {
  cwd: ROOT,
  stdio: 'inherit',
})

const html = readFileSync(join(OUT, 'index.html'), 'utf8')
const js = readFileSync(join(OUT, 'app.js'), 'utf8')

// O Vite iça módulos para o <head>, por isso a tag pode estar em qualquer sítio.
const tag = /<script type="module"[^>]*src="[^"]*app\.js"[^>]*><\/script>/
if (!tag.test(html)) throw new Error('não encontrei a tag do bundle em dist-single/index.html')

// Duas armadilhas, e ambas silenciosas.
//
// Uma ocorrência de `</script>` dentro de uma string do bundle fecharia a tag
// mais cedo e partiria a página inteira, sem erro visível até a abrires.
//
// E a substituição vai por FUNÇÃO, não por string: numa string de substituição
// o `$` é especial, e `$&` reinsere o texto que acabou de ser substituído. Um
// bundle minificado tem `$&` algures quase de certeza — este tinha —, portanto
// a tag `<script src="app.js">` voltava a aparecer no meio do próprio código
// que a devia ter substituído. A verificação abaixo foi o que apanhou isso.
const inlined = html.replace(
  tag,
  () => `<script type="module">\n${js.replace(/<\/script>/g, '<\\/script>')}\n</script>`,
)
if (inlined.includes('app.js')) throw new Error('sobrou uma referência ao ficheiro externo')
writeFileSync(join(OUT, 'jianying.html'), inlined)

// --- a versão para publicar ---------------------------------------------
const pick = (source: string, re: RegExp, what: string): string => {
  const m = re.exec(source)
  if (!m) throw new Error(`não encontrei ${what}`)
  return m[0]
}
const head = pick(inlined, /<head>[\s\S]*?<\/head>/, 'o <head>')
const body = /<body>([\s\S]*)<\/body>/.exec(inlined)?.[1]
if (body === undefined) throw new Error('não encontrei o <body>')

// O jogo é PORTRAIT e desenhado para um polegar. Numa janela de computador
// larga mostraria muito mais terreno do que um telemóvel mostra — o que é uma
// dificuldade diferente, não só um aspeto diferente. As quatro camadas são
// `position: fixed; inset: 0`, e o canvas dimensiona-se pelo #stage
// (`resizeTo: host`, em render/stage.ts), por isso encolhê-las para uma coluna
// dá o enquadramento certo e o `fitCamera` reage ao resize como reagiria a
// rodar o telemóvel. Num telemóvel a media query não pega e nada muda.
const frame = `
<style>
  @media (min-aspect-ratio: 1/1) {
    #stage, #ui, #hint, #hud {
      left: calc(50vw - 23.1vh);
      right: calc(50vw - 23.1vh);
    }
    #stage {
      box-shadow: 0 0 0 1px rgba(232, 220, 192, 0.14), 0 24px 60px -20px rgba(0, 0, 0, 0.8);
    }
  }
</style>
`

const parts = [
  pick(head, /<link\s+rel="icon"[^>]*>/, 'o ícone'),
  pick(head, /<title>[\s\S]*?<\/title>/, 'o título'),
  pick(head, /<style>[\s\S]*?<\/style>/, 'a folha de estilo'),
  frame,
  body,
  // DEPOIS do markup: o main.ts procura #stage assim que corre. Como módulo é
  // sempre diferido, mas a ordem certa não custa nada e não depende disso.
  pick(head, /<script type="module">[\s\S]*?<\/script>/, 'o bundle'),
]
const page = parts.join('\n')
for (const forbidden of ['<!doctype', '<html', '<head', '<body']) {
  if (page.toLowerCase().includes(forbidden)) throw new Error(`sobrou um ${forbidden}`)
}
writeFileSync(join(OUT, 'jianying-artifact.html'), page)

const kb = (n: number): string => `${Math.round(n / 1024)} kB`
console.log(`\ndist-single/jianying.html           ${kb(inlined.length)}  (abrir do disco)`)
console.log(`dist-single/jianying-artifact.html  ${kb(page.length)}  (publicar)`)
