# 剑影 Jiànyǐng — Estado

*build 1.5.0 · commit a098ba8 · 13 122 linhas · 191 testes*

> Um espadachim percorre as estradas de um império a cair. Cada estrada acaba em
> morte — e cada morte levanta a espada que percorre a seguinte.

## 一 · O conceito: dois ciclos

É esta a ideia central, e é a que resolveu o «não percebo o que está a
acontecer». Tudo o que ganhas pertence a um destes dois lados, e os dois nunca
partilham vocabulário.

**EXPEDIÇÃO — perde-se.** Uma corrida de 90 a 180 segundos. Recolhes qi, sobes
de **Insight**, escolhes técnicas que se acumulam depressa. Acaba sempre com a
tua morte, e tudo isto morre contigo.

**CULTIVO — fica.** Toda a expedição converte em cultivo, corresse bem ou mal. O
cultivo sobe o **Nível**, o nível sobe o **Reino**, e cada nível dá um ponto de
atributo permanente.

## 二 · O que está construído

| Sistema | Estado | Detalhe |
|---|---|---|
| Entrada | ✅ feito | Título → criação → codex → hub. Quem volta passa direto com «Continue», e a criação continua alcançável pelo hub. |
| Combate | ✅ feito | Golpe automático ao inimigo mais próximo. Seis armas com alcance, arco e ritmo próprios. |
| Inimigos | ✅ feito | 21 tipos em 8 comportamentos. Cada região tem o seu bestiário e o seu mestre. |
| Progressão na corrida | ✅ feito | 10 técnicas em duas famílias. ~5 subidas de Insight por corrida, ~20s de intervalo. |
| Progressão permanente | ✅ feito | 8 reinos de 5 níveis (淬体 → 剑仙), 4 atributos. Capacitor Preferences. |
| Equipamento | ⚠️ fino | Funciona: 22 itens, 4 slots, drops, inventário. Mas o wardrobe suporta 900 silhuetas e a tabela usa 22. |
| O mundo | ✅ feito | Cinco lugares, cada um com uma regra, bestiário, mestre e tabela de loot próprios. Abrem a cada reino. |
| Hub | ✅ refeito | Três abas (剑 装 界), identidade sempre visível, «Partir» fixo acima delas. Era um scroll único com dez blocos de texto. |
| Aparência | ✅ feito | A personagem é desenhada em SVG a partir da geometria do jogo, no hub e na criação. Compleição, faixa e mão do pincel são persistentes. |
| Legibilidade | ✅ feito | Números de dano em três cores, avisos de boss, «Felled by X», recompensa itemizada. |
| Tutorial | ✅ feito | Seis lições na primeira expedição, por condição e não por cronómetro. |
| Áudio | ❌ nada | Zero. Nem música nem efeitos. O buraco mais óbvio no *feel*. |
| Hápticos | ❌ nada | Plugin instalado e nunca chamado. |
| Online | ❌ nada | `src/net/` está vazia. Sem leaderboards, replays ou Supabase. |

## 三 · A arma é a classe

O polegar está todo gasto no movimento, portanto uma classe não pode ser um
conjunto de botões. É a forma do golpe automático — e mudar estes quatro números
muda onde tens de estar, que é a única decisão que o jogo pede.

| Arma | Escola | Dano | Ritmo | Alcance | Arco |
|---|---|---:|---:|---:|---:|
| 剑 Jian | Mountain Sect | 11 | 0,46s | 95 | 1,75 |
| 刀 Dao | Frontier Garrison | 16 | 0,60s | 90 | 2,15 |
| 双 Geminados | Wandering Blade | 7 | 0,27s | 76 | 1,35 |
| 扇 Leque | Temple Acolyte | 10 | 0,42s | 72 | 2,85 |
| 枪 Lança | Pass Watch | 21 | 0,62s | 168 | 0,60 |
| 斩 Zhanmadao | *só cai* | 30 | 0,95s | 106 | 2,35 |

A lança alcança 168 unidades num arco de 0,60 radianos; o leque alcança 72 em
2,85. São jogos diferentes com o mesmo polegar.

## 四 · Nuances que decidem como se joga

- **Nenhuma arma domina.** Há um teste que falha se uma arma liderar ao mesmo
  tempo em dano por segundo *e* em área varrida por segundo. Já apanhou dois
  erros reais — o zhanmadao tornava as armas iniciais obsoletas.
- **Crescer não torna o mesmo chão mais fácil.** Abre chão novo. Sem isto o
  poder permanente trivializaria o início de todas as corridas, que é a
  armadilha clássica de colar progressão permanente a um survivors-like.
- **Um item tem de mudar a silhueta.** As figuras não têm detalhe interior, por
  isso textura e material são invisíveis a este tamanho. Há um teste a garantir
  que dois itens do mesmo slot nunca partilham um estilo.
- **Atributos de item e comprados são a mesma moeda.** «+3 Corpo» numa túnica
  passa pela mesma curva que no hub. E as técnicas aplicam-se *depois*, para que
  «+4 de dano» numa carta continue a ser literalmente +4.
- **A escola é onde começas, não o que és.** Todas as armas caem.

## 五 · O mundo: cinco lugares, não cinco degraus

A profundidade era um multiplicador com uma frase de sabor por cima. Escolher a
estrada 4 em vez da 3 não era uma decisão, era aritmética. Agora cada lugar tem
uma **regra** que muda como se joga lá, um **bestiário** que não aparece noutro
sítio, um **mestre** próprio, e **equipamento que só cai ali**.

É a última parte que faz do mapa uma escolha: entras no pântano porque o Sudário
Esfarrapado está no pântano, e aceitas ser abrandado para o ir buscar.

| Lugar | Regra | Cai lá | Reino |
|---|---|---|---:|
| 官道 The Post Road | Chão aberto. Nada aqui é contra ti além do que o percorre. | Túnica de Cânhamo, Mangas Atadas, Nó de Cabelo, Jian, Dao | 1 |
| 芦荡 The Reed Marsh | Tu vadeias. Eles não — alcance vale mais do que fechar distância. | Sudário Esfarrapado, Braços Nus, Cabelo Solto, Lança | 2 |
| 断崖 The Broken Cliff | O vento empurra-te, e roda. Estar parado não é estar parado. | Casaco de Viagem, Mangas Largas, Chapéu de Bambu, Geminados | 3 |
| 鬼市 The Ghost Market | Tudo o que cortas parte-se. Matar não é automaticamente certo. | Sedas da Corte, Manto de Penas, Coroa de Jade, Leque | 4 |
| 关隘 The Pass | Vêm em fileira, de um lado só. Pela primeira vez tens uma frente. | Saia Lamelar, Vestimenta em Camadas, Ombreiras, Chapéu com Véu, Zhanmadao | 5 |

Dois comportamentos novos que existem para dar às regiões perguntas próprias:
**lurker** (imóvel e inofensivo até te aproximares — o pântano) e **enrager**
(só se torna perigoso depois de o atingires — o mercado, onde não matar é
frequentemente a jogada certa).

### Medido, não adivinhado

Cada região percorrida pela personagem que a acabaria de desbloquear, com a
mesma arma e o mesmo piloto em todas as linhas, para que a tabela compare
lugares e não armas. Três sementes por linha, sem técnicas.

| Lugar | pontos | segundos | mortes | pico | mortes/s |
|---|---:|---:|---:|---:|---:|
| The Post Road | 1 | 117 | 294 | 86 | 2,52 |
| The Reed Marsh | 8 | 71 | 78 | 101 | 1,10 |
| The Broken Cliff | 15 | 82 | 81 | 191 | 0,99 |
| The Ghost Market | 22 | 53 | 209 | 91 | 3,97 |
| The Pass | 29 | 61 | 47 | 164 | 0,77 |

Cinco linhas diferentes, e cada uma diferente **pela razão certa**: o mercado
mata muito e sobrevive pouco porque tudo se multiplica; o desfiladeiro tem o
maior pico de multidão porque o vento te empurra para dentro dela; o passo mata
menos do que qualquer outro sítio porque o que lá vive é pesado.

O que isto **não** prova: que é divertido. Um piloto sintético anda em círculo,
nunca recua para uma parede nem decide não matar uma efígie. Essa parte é tua.

## 六 · Honestamente, o que ainda incomoda

- **Pico de 191 inimigos no desfiladeiro.** O teto do pool é 420, portanto não
  rebenta — mas reportaste engasgos no telemóvel e este é o lugar onde a
  contagem sobe mais. O HUD mostra `fps · Ne · uX rY ▲Z`; se engasgar lá, uma
  fotografia dessa linha diz-me exatamente qual das três metades é a culpada.
- **The Post Road dura o dobro de tudo o resto.** É intencional (mais fundo =
  mais curto e melhor pago, ×3,2 no passo), mas 117s contra 53s é muito e pode
  ler-se como «as outras estão desequilibradas» em vez de «as outras são um
  negócio diferente».
- **Áudio e hápticos continuam a zero.** O maior buraco de *feel* que existe.
- **A tabela de itens usa 22 das 900 silhuetas** que o wardrobe sabe desenhar.

## 七 · Documentos, e a que pergunta cada um responde

| Documento | Responde a |
|---|---|
| `docs/progression.png` | O equipamento muda mesmo a personagem à medida que se joga? |
| `docs/auras.png` | **Proposta.** Cor e encantamento resolvem a convergência do fim de jogo? |
| `docs/ESTADO.md` | Este. O que existe, o que falta, o que ainda incomoda. |
| `docs/PLANO.md` | Que fases vêm a seguir, e o que saiu contra o que estava escrito. |

Só o `auras.png` é proposta. Os outros descrevem o que já está construído.

## 八 · O que vem a seguir

A Fase 1 fechou. Pela tua regra — uma fase de cada vez — o próximo passo é a
Fase 2: **baralhos de técnicas por escola**, para que a escolha na criação de
personagem continue a significar alguma coisa às três horas de jogo, e não
apenas nos primeiros trinta segundos.

---

*PixiJS 8 · TypeScript · Capacitor 8 · 185 testes · tsc e eslint limpos*
