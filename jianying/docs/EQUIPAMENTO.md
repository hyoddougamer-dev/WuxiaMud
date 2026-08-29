# 装 — o equipamento como corpo, e os ícones das artes

*Duas perguntas tuas: ícones para as artes em vez de caracteres, e uma aba de
equipamento com slots por peça de corpo e as stats aplicáveis. Este documento
responde às duas e diz o que fica por construir.*

---

## 1. Os ícones das artes

### Porquê não um pack

| Opção | Porque perde |
|---|---|
| **Pack de ícones** (game-icons.net, CC0 packs) | Chega desenhado noutro estilo de linha e tinha de ser redesenhado peça a peça para casar com a tinta. Não se tinge por estado sem uma segunda cópia de cada. E este contentor não alcança nenhum desses hosts — eu não os conseguiria sequer buscar. |
| **Gerados por IA** | Trinta imagens que têm de concordar umas com as outras, num jogo que não tem um único asset rasterizado. Cada uma precisaria de um passe de filtro, e a inconsistência entre elas só aparece quando estão lado a lado. |
| **Manter os caracteres** | No hub, ao lado do nome, 点 está certo. Na barra durante uma corrida é um teste de leitura: meio segundo, um polegar ocupado, quatro selos com contagem de traços parecida. E 点 não diz nada sobre atravessar inimigos. |

### O que foi feito

`src/render/artGlyph.ts` — os ícones saem do **mesmo `sweep()`** que desenha as
figuras. Custam zero bytes, escalam, tingem-se por estado, são determinísticos,
e alimentam tanto o Pixi como o SVG do DOM — pelo que o tile da barra e o cartão
do hub não podem divergir.

**O ícone é o efeito, não o nome.** Não um símbolo decorativo da arte: um
*diagrama* do que ela faz. Uma linha a espetar dois anéis é `pierce`. Uma cópia
esbatida atrás do golpe é `echo`. Um espiral a fechar é `magnet`. Dezasseis
efeitos, dezasseis formas — e a forma é a explicação, que é o único tipo de
ícone que sobrevive a ser visto de relance com coisas a perseguir-te.

O **selo da condição fica**, pequeno, por baixo. São cinco formas e não
dezasseis, e é a metade que o jogador tem de *aprender* em vez de reconhecer.

### A regra, e como foi aprendida

O primeiro rascunho desenhou cada efeito como uma figurinha fiel. Um a um
estavam todos bem. Juntos, ao tamanho do tile, seis dos dezasseis eram
ilegíveis:

- `arc`, `guard`, `push` — a mesma meia-lua
- `rate`, `bolt` — as mesmas três riscas paralelas
- `damage`, `pierce`, `echo` — a mesma barra diagonal

A regra que ficou: **cada glifo é dono de uma classe de silhueta que mais nenhum
pode usar** — uma barra, uma pilha de traços, um anel, um espiral, um escudo,
uma estrela, uma linha de cota, uma urna. O detalhe lá dentro é decoração. A
34px um traço interior é um pixel e não existe.

### O pack gratuito — existe, e é bom

Medi outra vez em vez de repetir o que tinha assumido. **Todos** os hosts de
ícones estão bloqueados deste contentor — `game-icons.net`, `kenney.nl`,
`opengameart.org` respondem 000, e todas as APIs de geração de imagem também
(`api.openai.com`, `fal.run`, `api.replicate.com`, `huggingface.co`). O **npm
passa**.

E é por aí que há uma via: o game-icons.net inteiro publica-se como
`@iconify-json/game-icons` — **4134 ícones, CC BY 3.0**, paths SVG. Isso é
melhor do que descarregar ficheiros: fica uma dependência com versão fixa, que
funciona offline e no CI, para sempre.

Encaixa muito melhor do que eu disse à primeira. São silhuetas monocromáticas
numa grelha de 512 — o mesmo modelo de render que tudo o resto neste jogo, por
isso tingem-se por estado e escalam. A minha objeção anterior era sobre um pack
rasterizado, e este não é.

`tools/pack.ts` põe os dois lado a lado nos dezasseis efeitos, na paleta do jogo
e ao tamanho do tile → `docs/pack.png`. A diferença é uma decisão, não um
defeito:

- **o pack desenha a COISA** (uma espada, um escudo, um coração)
- **os meus desenham o EFEITO** (uma linha a espetar dois anéis, uma parede e o
  que foge dela)

**A recomendação: os dois.** O pack veste a grelha do equipamento — tem `belt`,
`bracers`, `leather-boot`, `gem-pendant`, `shoulder-armor`, `robe`, e ali
"desenha a coisa" é exatamente o que se quer, onde hoje há apenas um selo. As
artes ficam com os diagramas, onde o que importa é o efeito e não o objeto.

Se ficar o pack, falta uma linha de créditos no ecrã de título: *Icons by
game-icons.net, CC BY 3.0*.

### E gerar com IA?

`tools/generate.mts` + `.github/workflows/jianying-art.yml` — carregas num botão
no telemóvel, a chave vem de um secret do repositório, as imagens voltam como
artifact. Nada é commitado sozinho.

**Mas não para os ícones das artes.** Dezasseis marcas de 34px que têm de se
distinguir umas das outras são o pior uso possível de um modelo generativo: não
se lhe pode dizer "faz esta diferente daquela", as dezasseis teriam de concordar
entre si, e cada regeneração dá um conjunto novo. O manifesto
(`tools/art/manifest.ts`) gera o caso oposto — uma imagem grande, vista uma vez,
onde o detalhe é o ponto: key art, as cinco regiões, dois chefes.

`tools/inkify.mts` é a metade que decide se funciona, e a que as pessoas saltam:
luminância → curva de contraste → duotone papel/tinta → grão. Sem esse passo,
oito imagens geradas parecem oito jogos diferentes.

**O que verifiquei e o que não:** o encanamento (manifesto, montagem do prompt,
`--dry-run`, os caminhos de erro) e o passe de tinta, testado numa imagem a
cores a sério. **Não verifiquei uma única chamada nem um único pixel gerado** —
não consigo, está bloqueado daqui. A primeira corrida a sério é tua e pode
precisar de um ajuste.

### O que o teste apanha, e o que não apanha

`tests/glyphs.spec.ts` verifica: todo o efeito usado por uma arte tem glifo,
nenhum glifo é vazio ou inunda a caixa, a geometria não muda entre chamadas, e
dois glifos não são quase-literalmente a mesma geometria.

**Não apanha colisão perceptual, e é honesto dizê-lo.** Tentei duas métricas.
Carimbar numa grelha fixa dá 0.03 à antiga `arc` contra a antiga `guard` —
duas meias-luas de raios diferentes pintam células diferentes. Normalizar cada
glifo pela sua caixa dá 0.03 ao mesmo par, porque a `guard` tinha uma marca
extra que lhe movia a caixa. Nenhum dos números se parece com o que uma pessoa
vê. Por isso quem apanha isso continua a ser `tools/glyphs.ts` — os dezasseis
lado a lado ao tamanho a que são lidos. Essa folha não é um extra; é o teste da
propriedade que mais importa aqui.

---

## 2. A aba de equipamento

### O que está mal hoje

Três coisas, e todos os bons resolvem-nas da mesma maneira:

1. **Nada mostra o que não tens vestido.** Um slot vazio simplesmente não
   aparece, por isso "o que me falta?" — a pergunta que manda o jogador para
   fora outra vez — não tem resposta no ecrã que devia fazê-la.
2. **A figura e as peças estão em sítios diferentes.** Metade visível do jogo é
   uma silhueta, e o ecrã onde a mudas mostra-a em miniatura ao canto.
3. **Não há comparação.** Lês o que uma peça dá, mas não o que a troca custa —
   e é esse o único número de que a decisão precisa.

### O que a proposta faz

**A figura em cima, em tamanho real; os slots por baixo, em grelha.**

Tentei primeiro o paperdoll clássico, com duas colunas de slots a ladear a
figura. A aritmética mata-o: duas colunas de 128px num ecrã de 390 deixam 106px
de meio, o que dá um espadachim **mais pequeno do que o hub já mostra**. Em
retrato num telemóvel os slots vão para baixo — que é onde o Diablo Immortal, o
único ARPG grande que teve de resolver exatamente esta forma, também os pôs.

**Oito slots**, e o número não é arbitrário. Este guarda-roupa tem uma lei: uma
peça tem de mudar o **contorno**, senão não muda nada, porque estas figuras não
têm detalhe interior. Anéis, amuletos e luvas seriam itens que possuis e não
consegues ver. Sobra tudo o que mexe numa linha:

| Selo | Slot | Existe? | O que muda na silhueta |
|---|---|---|---|
| 首 | Cabeça | **sim** | chapéu, coroa, coque, véu |
| 肩 | Ombros | **sim** | barra dos ombros, mangas, pauldrons, manto |
| 袍 | Túnica | **sim** | altura, largura da bainha, sobreposição, cinto |
| 器 | Arma | **sim** | a lâmina, e a classe de combate |
| 带 | Cinto | novo | barra da cintura, cordões pendentes |
| 腕 | Braçadeiras | novo | punhos, nos pontos que a figura já expõe |
| 靴 | Botas | novo | o fundo da silhueta, altura e abas |
| 佩 | Pendente | novo | jade suspenso do cinto, contra a saia |

**As stats são as derivadas, não os quatro atributos.** "23 Body" é uma moeda
que o jogador não pode gastar; "Golpe 41" é a coisa entre as quais está a
escolher, e a linha dourada por baixo diz quanto disso o equipamento está a
pagar.

**Um slot vazio manda-te a algum lado**, em vez de ficar ali a ser vazio: o
aviso em baixo diz que região deixa cair a peça em falta.

### Escolher dentro de um slot

Uma folha por cima do paperdoll, com a figura visível por trás — o que estás a
escolher é uma silhueta, e as deste jogo mudam mesmo. Cada linha mostra a
**diferença** contra o que tens vestido, com o sinal colorido: dourado para
ganho, cinábrio para perda, as mesmas duas cores que o jogo já usa para
progresso e dano em todo o lado.

---

## O que falta construir

Os ícones **estão feitos e testados**. A aba é **desenho**, e o que ela custa é
isto, por ordem:

| # | Passo | Verificável por |
|---|---|---|
| 1 | Glifos na barra do HUD e no hub, a substituir os selos | harness: a barra acende com o glifo certo |
| 2 | Quatro estilos novos no guarda-roupa: cinto, braçadeiras, botas, pendente | `tools/wardrobe.ts`: as silhuetas novas são mesmo diferentes |
| 3 | Quatro slots novos em `data/items.ts`, com itens que os preencham | teste: todo o estilo aparece exatamente uma vez |
| 4 | Migração do save — inventário com quatro slots lê num de oito | teste: save v2 sobrevive |
| 5 | O ecrã: figura em cima, grelha por baixo, stats derivadas | harness: percorrer os oito slots |
| 6 | A folha de comparação com deltas | harness: trocar uma peça e ver a silhueta mudar |

O passo 2 é o único com risco real: quatro peças novas têm de ser
**visivelmente** diferentes numa silhueta sem interior, e a folha de contacto
do guarda-roupa é quem decide se são.
