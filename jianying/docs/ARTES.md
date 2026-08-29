# 功法 — as artes, e porque não há botão

*Escrito depois de três decisões tuas: a classe é a arma na mão, as artes
aprendem-se de manuais que caem, e as três cartas de dentro da corrida
desaparecem para dar lugar a builds próprias.*

---

## O problema que isto resolve

O jogo tem hoje duas progressões e nenhuma delas é uma **build**:

| | Moeda | Onde | Dura |
|---|---|---|---|
| 境界 Realm → atributos | pontos | hub | permanente |
| Técnicas (as 3 cartas) | subidas de nível | expedição | uma corrida |

Os atributos são quatro números que sobem. As cartas são um sorteio. Em nenhum
dos dois o jogador **decide como quer lutar** — e é isso que um sistema de
skills tem de dar.

---

## A forma

**Uma arte é 功法: permanente, tua, e ligada à arma.**

- Cada arma tem o seu rolo de **cinco artes**. Só vês as da arma que tens na
  mão. Trocar de lança para sabre é trocar de estilo de combate, não de número.
- Uma arte **aprende-se uma vez**, de um 秘笈 (manual) que cai. Nunca se perde.
- Equipas **quatro** das que sabes, e defines a **ordem** por que acordam.
- Cada arte tem cinco graus.

## Não há botão. O movimento é o botão.

Cada arte tem uma **condição**, e a condição é uma coisa que o jogador controla
com o polegar que já está a usar. A arte dispara sozinha quando a condição
acontece.

| Selo | Condição | Como se lê |
|---|---|---|
| 静 | **parado** ~0.6s | plantar-se |
| 疾 | **a fundo** ~1s | correr sem parar |
| 转 | **virar** mais de 120° de repente | inverter |
| 围 | **cercado** por N inimigos | deixar-se rodear |
| 危 | **em perigo**, vida abaixo de um limiar | aguentar |

Isto é a diferença entre *automático passivo* e *automático condicional*, e é
toda a diferença que há:

- **Passivo** é um número que se aplica sempre. Ao minuto cinco estás a ver o
  jogo jogar-se sozinho.
- **Condicional** continua a ser um polegar e zero botões, mas o jogador
  **provoca** as suas artes. "Se eu parar, o meu golpe atravessa" é uma
  competência a sério, aprendida a jogar e não lida num menu.

**Porque não um interruptor auto/manual:** cada arte teria de ser desenhada
duas vezes e o jogo equilibrado duas vezes. Um survivors-like leva uma
passagem de equilíbrio, não duas. Se um dia fizer falta agência, o certo é
acrescentar **um** botão, não um modo.

---

## O que tirar as 3 cartas custa, e como se paga

As cartas são o motor do género: são elas que fazem a corrida **crescer**
enquanto os inimigos crescem. Tirá-las e mais nada é partir a curva — os
inimigos escalam do minuto 1 ao 15 e o jogador não.

**O pagamento:** subir de nível dentro da corrida passa a **avançar as tuas
artes equipadas, pela ordem que definiste no hub**. Cada 感悟 sobe a seguinte
da lista um grau.

Resultado: a corrida continua a crescer, a curva mantém-se, e o que cresce é a
build que montaste. Sem sorteio.

---

## Os trinta rolos

Seis armas, cinco artes cada, uma por condição. Os efeitos vêm de um
vocabulário fechado — ver `src/data/arts.ts`.

### 剑 Jian — 剑意, o corte preciso
静 **点** Point · o arco estreita e atravessa o primeiro inimigo
疾 **流** Flow · golpes mais frequentes enquanto não parares
转 **影** Shadow · virar deixa um eco do golpe onde estavas
围 **断** Sever · cercado, os golpes tornam-se críticos
危 **剑气** Sword Qi · em perigo, o golpe atira qi à distância

### 刀 Dao — 势, a lâmina que não pára
疾 **势** Momentum · o dano cresce com a velocidade
围 **卷** Furl · o arco alarga por cada inimigo perto
危 **血** Blood · em perigo, cada abate cura uma lasca
静 **压** Press · plantado, os golpes empurram
转 **破军** Army-breaker · virar varre o círculo inteiro

### 斩马刀 Zhanmadao — 重, o peso
静 **沉** Sink · plantado, dano muito maior
疾 **碾** Grind · a fundo, o golpe atinge duas vezes
危 **山** Mountain · em perigo, o dano recebido baixa
围 **裂** Rend · cercado, arco e alcance crescem
转 **一斩** One Cut · o golpe a seguir a virar é crítico

### 双刀 Twin — 疾, a distância curta
疾 **双** Pair · a fundo, um segundo golpe atrás de ti
围 **缠** Entangle · o ritmo sobe por cada inimigo perto
转 **燕** Swallow · virar dá um arranque de velocidade
静 **寸** Inch · parado, muito menos alcance e muito mais dano
危 **蝶** Butterfly · em perigo, lâminas em órbita

### 枪 Spear — 远, o alcance
静 **刺** Thrust · plantado, uma linha longa que atravessa
围 **扫** Sweep · cercado, o arco alarga
疾 **追** Pursue · o alcance cresce com a velocidade
转 **拦** Bar · virar empurra tudo o que está à frente
危 **龙** Dragon · em perigo, o golpe lança projéteis

### 扇 Fan — 变, a mudança
静 **展** Open · parado, o círculo completo
疾 **风** Wind · a fundo, o qi vem de mais longe
危 **藏** Conceal · em perigo, um instante de imunidade
围 **乱** Scatter · cercado, projéteis para tudo em volta
转 **回** Return · virar repete o golpe para trás

---

## O que isto custa em código, honestamente

O vocabulário de efeitos divide-se em dois:

**Já existe** — `damage` `rate` `range` `arc` `speed` `magnet` `orbit` `bolt`
`nova` `maxHp`. São alavancas que `deriveStats` já mexe.

**É novo, e é simulação a sério** — `pierce` (atravessar), `crit`, `echo`
(repetir o golpe), `push` (empurrão), `guard` (redução de dano), `heal`
(curar ao abater). Seis funcionalidades pequenas, mas seis.

É por isso que isto não são "trinta linhas de dados". A primeira passagem deve
usar sobretudo o que já existe, e as seis novas entram uma de cada vez, cada
uma com o seu teste.

---

## A ordem de construção

| # | Passo | Verificável por | Estado |
|---|---|---|---|
| A | Modelo de dados: condições, artes, o rolo de cada arma | testes: 5 por arma, ids únicos, toda a condição usada | **feito** |
| B | Deteção das condições na simulação, e o sinal no ecrã | harness: forçar cada condição e ver o selo acender | **feito** |
| C | Efeitos aplicados, começando pelos que já existem | `tools/regions.mts`: a curva não parte | |
| D | Aba 法 no hub: equipar quatro, definir a ordem | harness: equipar, reordenar, confirmar que persiste | |
| E | 秘笈 caem e ensinam | teste: um manual duplicado não ensina duas vezes | |
| F | As 3 cartas saem; 感悟 avança a lista | `regions.mts` outra vez, e o APK | |

### Passo B, como ficou

`src/sim/conditions.ts`. Três regras decidiram os números:

**Segurar, não piscar.** As duas posturas têm de ser mantidas antes de contarem
(静 0.55s, 疾 0.9s). Uma condição que dispare num só fotograma de velocidade
baixa acionava-se constantemente ao desviar, e o jogador nunca aprenderia o que
a causou. Esse atraso é também o jogo a pedir um compromisso — é isso que a
torna uma decisão.

**As posturas excluem-se.** 静, 疾 e 转 nunca são verdade ao mesmo tempo, por
construção: uma viragem suprime as outras duas enquanto dura, porque inverter a
direção passa por um instante de velocidade baixa que de outra forma leria como
estar parado. Há um teste que atira 4000 estados aleatórios ao detetor e exige
no máximo uma postura ativa.

**Situação não é postura.** 围 e 危 não são coisas que se seguram, são coisas
que te acontecem, e podem sobrepor-se a uma postura. Uma arte numa delas é uma
rede de segurança, não um plano.

A viragem lê a direção de **viagem**, não a de olhar: a figura continua a olhar
para onde apontou enquanto está parada, por isso quem pára e arranca leria como
tendo virado sem se ter mexido. E o vetor é normalizado, senão uma inversão
feita a meia deflexão só chega a −0.25 e não passava o limiar.

**A condição antes do efeito.** Se o jogador não conseguir ver *quando* uma
arte dispara, nenhum efeito a torna legível — e um sistema que o jogador não
consegue ler é um sistema que não existe.
