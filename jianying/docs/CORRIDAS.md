# 一趟 — a corrida, e as escadas

## Resumo (se não leres mais nada)

1. **Medi a corrida e ela está partida.** Dura 227 s na região mais fácil e 38 s
   na mais difícil. Quatro das cinco regiões acabam antes do seu próprio chefe
   (115 s), e a melhor corrida do jogo dá 11 dos 16 感悟 que uma build precisa
   para ficar feita. Nada mais importa até isto estar resolvido.
2. **A corrida passa a ser uma fenda 裂隙**, ao estilo dos rifts: uma barra que
   enche a matar, o chefe no fim, e depois sais com tudo ou desces um andar.
   Barra e não relógio — a razão está abaixo e é medida.
3. **Conteúdo PvE infinito vem de duas coisas, ambas só dados:** 天象 presságios
   sorteados por fenda, e 阶 andares sem teto.
4. **Artes: não trancar.** 5 no rolo dá 5 escolhas reais. 10 (duas por condição)
   dá 210. A arma já é a classe.
5. **Quatro escadas que deixam de partilhar a palavra "nível":** 感悟 (dentro da
   corrida), 境界 (permanente), 装备 (drops), 秘笈 (quais artes existem).

Folha visual: `docs/corridas.png`. Ecrãs: `docs/ui/10-rift`, `11-play-rift`,
`12-gate`, `13-push`.

---

## 1. O que foi medido

`npx tsx tools/runLength.mts` — seis seeds, espadachim a meio do jogo, sem
equipamento, dois pilotos automáticos.

| região | melhor dos dois pilotos | 感悟 (melhor) | chefes vistos |
|---|---|---|---|
| 官道 Post Road | 227 s | 11.2 | 1 |
| 芦荡 Reed Marsh | 103 s | 8.0 | 0 |
| 断崖 Broken Cliff | 70 s | 4.0 | 0 |
| 鬼市 Ghost Market | 53 s | 7.7 | 0 |
| 关隘 Pass | 38 s | 3.3 | 0 |

O plano prometia 8 a 15 minutos e nunca ninguém mediu uma. É por isto que os
sistemas parecem confusos: não chegam a acontecer dentro do tempo que a corrida
dura.

---

## 2. A fenda 裂隙

**A barra enche a matar. O chefe está no fim dela.**

Isto substitui a minha proposta anterior (três atos e um portão aos 4:30), e é
melhor por uma razão medida, não por gosto:

- **Um relógio não funciona aqui.** Com corridas de 38 s a 227 s conforme a
  região, um portão ao minuto 4:30 significa que as regiões fundas nunca veriam
  o seu próprio chefe. Uma barra é uma **distância**, não um relógio, e uma
  distância ajusta-se sozinha: o Pass é denso, por isso a barra enche depressa
  ainda que as corridas lá sejam curtas.
- **Corrige uma patologia medida.** O piloto que foge sobrevive 227 s e apanha 5
  感悟; o que luta morre aos 133 s e apanha 11. Fugir é hoje a jogada vencedora e
  mata a build. Com a barra alimentada por mortes, **fugir deixa de ser
  progresso**.
- A barra pesa por valor do inimigo, não por cabeça, para os 首 elites valerem um
  pedaço grande e valer a pena caçá-los em vez de limpar tudo por igual.

Depois do chefe: **收 sair com tudo** ou **深 descer ao andar seguinte** com a
build que acabaste de fazer. O prémio do chefe já está no bolso antes da
escolha — morrer no andar de baixo nunca tira o que já ganhaste, ou ninguém
carrega no segundo botão uma segunda vez.

### De onde vem o conteúdo PvE

Duas coisas, e nenhuma custa arte nova:

- **天象 presságios.** Dois ou três sorteados por fenda, vistos *antes* de
  entrar, uns a teu favor e outros não ("o que morre deixa uma nuvem que queima",
  "os arqueiros vêm a dobrar", "+40% qi"). Cinco regiões × um saco de presságios
  é combinatório, e é tudo dados.
- **阶 andares, sem teto.** Cada andar sobe a vida dos inimigos e o prémio. É o
  fim de jogo, e é uma linha de aritmética.

Três fendas abertas ao mesmo tempo, que rodam de X em X horas, e ressortear tem
um custo. Assim a escolha é ler as fendas, não moer a mesma.

---

## 3. O que morre e o que fica

| perde-se | fica |
|---|---|
| 感悟 e os graus das artes | 境界 nível, realm, pontos |
| a vida da corrida | tudo o que caiu |
| o enxame | 秘笈 aprendidos, andar máximo |

**Morrer nunca tira nada.** A corrida é o episódio, a personagem é a série.

---

## 4. As quatro escadas

| | escada | âmbito | fonte | o que dá |
|---|---|---|---|---|
| 感悟 | Insight | **uma corrida** | qi dos mortos | sobe as 4 artes que levaste, grau 1→5, pela ordem em que as puseste |
| 境界 | Cultivo | para sempre | XP no fim | 8 realms × 5 níveis; pontos, e uma região nova por realm |
| 装备 | Equipamento | para sempre | drops, rank 1–5 | números e a figura |
| 秘笈 | Manuais | para sempre | chefes | **quais** artes existem para levares |

As três cartas de técnica sorteadas saem: eram um segundo sistema de build a
competir com o primeiro, e sorteado — o oposto de escolher.

---

## 5. As artes — liberdade, não classes trancadas

A arma já *é* a classe. Trancar também as artes dentro dela deixa o jogo com
seis builds no total.

| | rolo | levas | escolhas reais |
|---|---|---|---|
| hoje | 5 | 4 | **5** — só decides qual deixas de fora, e como cada condição aparece uma vez, tirar uma arte é tirar uma condição inteira |
| proposta | 10 (duas por condição) | 4 | **210** × 24 ordens |

Duas por condição e não dez soltas: a grelha continua sem buracos, e ganhas a
escolha que hoje não existe — pôr *as duas* na mesma condição (especialista que
planta os pés) ou espalhar por quatro (oportunista).

A **ordem** é o terceiro eixo: os 感悟 sobem as artes pela ordem em que as
puseste, logo a primeira chega ao grau 5 e a quarta pode nunca sair do 1. O
código existe e está testado (`sim/arts.ts`), só não é chamado.

Os **秘笈** são o travão: começas com cinco, as outras caem dos chefes da região
que já dá aquela arma (o pântano ensina lança, o mercado ensina leque — a tabela
`drops` em `data/regions.ts` já tem a correspondência).

---

## 6. Ordem de construção

1. **A barra da fenda e o chefe no fim.** É o que dá forma à corrida, e resolve
   de caminho o problema medido de fugir ser a jogada vencedora.
2. **Cartas fora, 感悟 sobe as artes.** Código já escrito e testado.
3. **天象 e 阶.** Dados e aritmética; é aqui que aparece o conteúdo.
4. **De 30 para 60 artes**, mais os 秘笈 a cair.
5. **A UI de combate**, quando escolheres entre A, B e C.

---

## 7. O portão da 官道 favorece o lançador — medido, não sentido

*Escrito quando o roster passou de seis armas para duas.*

`data/regions.ts` aponta para aqui. Isto é o que a medição encontrou e que eu
**não** corrigi sozinho, porque é uma decisão de desenho e não um número.

### O que foi medido

`tools/runLength.mts`, piloto *duel*, 官道, alvo da fenda a 180 qi:

| classe | passa o portão | duração | mortes | qi ganho |
|---|---|---|---|---|
| 斩马刀 | **17 %** | 57 s | 88 | 212 |
| 飞刀 | **100 %** | 54 s | 85 | 231 |

O primeiro instinto foi baixar o dano das facas. Não funciona, e é aí que está
a informação: a 11, 8, 7, 6 e 5 de dano o resultado é **exatamente o mesmo** —
100 %, as mesmas mortes, os mesmos segundos. O dano não é a alavanca.

### Porquê

O portão é **um único chefe com 480 de vida a 242 de velocidade**, contra um
jogador a 250. Isso é:

- o combate ideal do lançador — 250 de alcance, 8 de margem de velocidade,
  nunca precisa de parar;
- o pior combate do ceifador — 106 de alcance, tem de ficar colado ~15 segundos
  a levar dano de contacto para entregar o mesmo total.

Não é um problema de equilíbrio de armas. É que **um chefe único e rápido é um
teste de cinesia, e só uma das duas classes joga a esse teste**.

### As três saídas, e o que cada uma custa

1. **O chefe traz companhia.** Levas pequenas à volta dele. Dá ao ceifador
   alguém em quem o arco vale a pena e obriga o lançador a escolher alvos.
   *Custo:* o portão deixa de ser um duelo, que era metade da intenção.
2. **O chefe fecha a distância à força** — um salto, ou um sopro que empurra.
   Tira ao lançador o kite gratuito sem tocar em números.
   *Custo:* mais simulação, e é a única que precisa de código novo a sério.
3. **Alcance a sério para o ceifador enquanto ataca** — um passo à frente
   embutido no golpe, em vez de mais dano.
   *Custo:* mexe no movimento da classe, que é o que menos quero mexer sem
   playtest teu.

A minha preferência é a **2**, porque é a única que corrige a causa (a
distância é grátis) em vez do sintoma. Mas isto muda como a corrida acaba, e
essa escolha é tua.

---

## 8. "As classes estão OP" — o que a medição diz, e é mais interessante

*Relatado depois de jogar: 200 mortes em 1:32, e a sensação de que as classes
começam demasiado fortes. Medido antes de mexer em nada.*

`tools/runLength.mts`, 6 seeds, espadachim a meio sem equipamento:

| região | segundos | mortes | limpou a fenda? |
|---|---|---|---|
| 官道 The Post Road | 57 | 88 | 17 % |
| 芦荡 The Reed Marsh | 53 | 41 | 67 % |
| 断崖 The Broken Cliff | 29 | 17 | 100 % |
| 鬼市 The Ghost Market | 35 | 141 | 83 % |
| 关隘 The Pass | 19 | 11 | 100 % |

**As duas coisas são verdade ao mesmo tempo**, e é por isso que o relato de
"confusão" está certo:

- os inimigos morrem depressa de mais — 1.5 a 4 mortes por segundo, e nenhum
  deles chega a ser uma ameaça individual;
- e o jogador também morre depressa. A intenção escrita era uma corrida de
  **300 segundos**; nenhuma região passa dos 57. A morte vem por dano de
  contacto acumulado, não por um erro concreto.

A causa está na frase que fecha o relato: *"não tendo como escapar de ataques"*.
Não há esquiva, não há recuo, não há nada que se faça no momento em que se está
prestes a levar dano. O único recurso é já não estar ali — o que o 飞刀 pode
fazer e o 斩马刀, com 106 de alcance, não.

Não é um número para afinar. É a mesma lacuna que a §7 encontrou no portão, vista
de outro lado: **o jogo não tem verbo defensivo**. Enquanto não tiver, subir a
vida dos inimigos só torna as corridas mais longas e igualmente passivas.
