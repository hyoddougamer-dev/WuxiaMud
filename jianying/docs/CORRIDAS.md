# 一趟 — a corrida, e as escadas

Três perguntas em aberto — como funcionam as corridas, como funciona a
progressão, e se as artes devem abrir ou trancar em classes. São a mesma
pergunta, porque **o comprimento de uma corrida decide quanto de uma build o
jogador chega a ver**.

A folha visual está em `docs/corridas.png` (390 de largura, para ler no
telemóvel). Este ficheiro é o detalhe e as razões.

---

## 0. O que foi medido

`npx tsx tools/runLength.mts` — seis seeds, espadachim a meio do jogo
(body 6, edge 6, swift 4, spirit 2), sem equipamento, dois pilotos automáticos.

| região | melhor dos dois pilotos | 感悟 (melhor) | chefes vistos |
|---|---|---|---|
| 官道 Post Road | 227 s | 11.2 | 1 |
| 芦荡 Reed Marsh | 103 s | 8.0 | 0 |
| 断崖 Broken Cliff | 70 s | 4.0 | 0 |
| 鬼市 Ghost Market | 53 s | 7.7 | 0 |
| 关隘 Pass | 38 s | 3.3 | 0 |

O plano prometia expedições de 8 a 15 minutos. **Nunca ninguém mediu uma.**

Duas consequências, e nenhuma é um acerto de dificuldade:

1. **Quatro das cinco regiões acabam antes do seu próprio chefe** (que chega aos
   115 s). Uma corrida sem chefe não tem princípio, meio nem fim — tem um
   contador que pára.
2. **Uma build de quatro artes precisa de 16 感悟 para ficar feita** (4 artes ×
   grau 1→5). O melhor caso medido dá 11. O jogador escolhe na aba 法 e nunca
   chega a ver o resultado da escolha.

Isto é o que torna tudo "confuso": não é a UI, é que o sistema nunca chega a
acontecer dentro do tempo que a corrida dura.

---

## 1. O que é uma corrida

**Cinco minutos, três atos e um portão.** Não quinze.

| | | |
|---|---|---|
| 起 | 0:00 | **Sair.** Poucos inimigos. A build toma forma — os primeiros 4 感悟. |
| 行 | 1:30 | **A estrada.** O roster enche, a regra da região começa a morder. |
| 险 | 3:30 | **O aperto.** Densidade no máximo. A build aguenta ou não. |
| 关 | 4:30 | **O portão.** O chefe da região. Uma vez, e não de 115 em 115 s. |
| 深 | 5:00 | **O fundo.** Opcional, sem limite. Cada minuto multiplica o prémio. |

### Porquê cinco e não quinze

Joga-se com uma mão, à espera do autocarro. Uma corrida de quatro minutos é uma
coisa que se faz num intervalo; uma de quinze precisa de uma sessão. As horas do
jogo ficam no que **sobrevive** à corrida (nível, equipamento, manuais), não
dentro dela. Há também um custo prático: cada harness de balanceamento passa a
demorar o triplo, e este projeto decide por medição.

### Porquê um portão

Um survivors-like que só acaba em morte nunca fecha nada. Um que acaba num
relógio perde o "até onde é que eu consigo ir". O 关 dá os dois:

- Matar o chefe **completa** a corrida (踏破). O prémio de conclusão fica no
  bolso nesse instante.
- Depois, o 深: ou sais com tudo, ou continuas. No fundo o enxame deixa de subir
  por degraus e passa a crescer, e o multiplicador sobe por minuto.
- Morrer no fundo **não tira** o que já estava no bolso.

Essa é a única decisão de ganância do jogo, e é grátis de construir: já existe
tudo menos a decisão.

### Alvo mensurável

`tools/runLength.mts` mede contra isto, e é por isso que é uma ferramenta
permanente e não um script:

- **300 s** até ao portão (hoje: 227 s no melhor caso, 38 s no pior).
- **16 感悟** lá chegado — exatamente o que quatro artes precisam.
  **Acabar a corrida acaba a build.**
- **Um** chefe, ao portão.

---

## 2. O que morre e o que fica

| perde-se | fica |
|---|---|
| 感悟 e os graus das artes | 境界 nível, realm, pontos de atributo |
| a vida da corrida | tudo o que caiu |
| o enxame | 秘笈 aprendidos |
| | profundidade aberta |

**Morrer nunca tira nada.** É a metade MMORPG do desenho e não muda: a corrida é
o episódio, a personagem é a série.

---

## 3. As quatro escadas

A confusão de "não percebo o que é isto" vem daqui: havia dois sistemas a
chamarem-se *nível*. Passam a ser quatro coisas que não se tocam, cada uma com
uma fonte só sua.

| | escada | âmbito | fonte | o que dá |
|---|---|---|---|---|
| 感悟 | Insight | **uma corrida** | qi dos mortos | sobe as 4 artes que levaste, grau 1→5, pela ordem em que as puseste |
| 境界 | Cultivo | para sempre | XP no fim da corrida | 8 realms × 5 níveis; 1 ponto por nível, 3 por realm, e uma região nova por realm |
| 装备 | Equipamento | para sempre | drops, rank 1–5 | números e a figura |
| 秘笈 | Manuais | para sempre | chefes e o fundo | **quais** artes existem para levares |

O 感悟 substitui as três cartas de técnica sorteadas. As cartas eram um segundo
sistema de build a competir com o primeiro, e sorteado — a coisa exatamente
oposta a escolher.

> Nota honesta, já registada em `meta/character.ts`: poder permanente contra uma
> curva fixa acaba por tornar triviais os primeiros minutos. A resposta é a
> profundidade, e a forma acima torna-a uma escolha *por corrida* em vez de só um
> desbloqueio.

---

## 4. As artes — liberdade, não classes trancadas

**Recomendação: não trancar.** A arma já *é* a classe. Trancar também as artes
dentro dela deixa o jogo com seis builds no total, e o jogador com nenhuma
autoria.

E a falta de variedade é medível, não é uma impressão:

| | rolo | levas | escolhas reais |
|---|---|---|---|
| hoje | 5 | 4 | **5** — só decides qual deixas de fora, e como cada condição aparece uma só vez, deixar de fora uma arte é deixar de fora uma condição inteira |
| proposta | 10 (duas por condição) | 4 | **210** × 24 ordens = 5040 |

### Porquê duas por condição e não dez soltas

A grelha das cinco condições continua sem buracos — é o que faz uma arma
diferente sem ensinar um esquema de controlo novo. Mas ganhas a escolha que hoje
não existe: **podes pôr as duas na mesma condição** e ser um especialista que
planta os pés, ou espalhar por quatro e ser um oportunista. Isso é uma *maneira
de jogar*, não um número maior.

### A ordem é o terceiro eixo

Os 感悟 sobem as artes pela ordem em que as puseste na aba 法: a primeira chega
ao grau 5, a quarta pode nunca sair do 1. Levar uma quarta arte passa a ter um
custo em vez de ser de graça. O código está escrito e testado
(`sim/arts.ts`: `beginProgress`, `advanceArt`) e ainda não é chamado.

### Os 秘笈 são o travão

Começas a conhecer as cinco de hoje. As outras cinco caem dos chefes da região
que já dá aquela arma — o pântano ensina lança, o mercado ensina leque, o
desfiladeiro ensina as duplas (a tabela `drops` em `data/regions.ts` já tem esta
correspondência). A variedade **chega**, em vez de ser despejada ao minuto um.

---

## 5. Ordem de construção

1. **A rampa.** Chegar aos 5 minutos e ao portão. É onde está o problema medido,
   e nada do resto vale nada sem isto. `tools/runLength.mts` é o juiz.
2. **Cartas fora, 感悟 sobe as artes.** O código existe e está testado; falta
   chamá-lo e apagar o ecrã das três cartas. `tools/artsBalance.mts` mede se a
   troca perde força.
3. **De 30 para 60 artes.** Cinco novas por arma, mais os 秘笈 a cair. Dados.
4. **A UI de combate**, quando escolheres entre A, B e C
   (`docs/ui/01a`, `01b`, `01c`).
