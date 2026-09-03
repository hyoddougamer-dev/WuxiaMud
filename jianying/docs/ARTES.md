# 功法 — as artes, e porque não há botão

> ## ⚠ Este documento é um REGISTO HISTÓRICO, não o estado do jogo
>
> Foi escrito para um jogo com seis armas, trinta artes e cinco condições. O
> jogo tem **duas armas, dez artes e quatro condições**, e a mecânica central
> mudou duas vezes desde que isto foi escrito. Ler isto como se fosse a
> descrição do sistema atual é ficar com três ideias falsas de uma só vez, e foi
> exatamente isso que uma auditoria encontrou.
>
> **O que continua verdadeiro:** não há botão — a condição é uma coisa que o
> polegar já faz. Só isso.
>
> **O que mudou desde então, e onde está descrito a sério:**
>
> - As seis armas passaram a duas, e as trinta artes a dez — `src/data/arts.ts`.
> - As cinco condições passaram a quatro, e 危 deixou de ser condição para ser
>   uma regra global (abaixo de um terço da vida, todas as artes sobem um grau)
>   — `src/data/arts.ts`, `DESPERATE_FRACTION`.
> - As condições passaram a ter dois lados: 疾 转 围 **carregam** 势, 静 **gasta**
>   tudo de uma vez numa descarga — `src/sim/conditions.ts`.
> - 神 passou a multiplicar o grau a que cada arte dispara, o que nunca tinha
>   feito — `src/sim/loadout.ts`, `src/sim/arts.ts`.
>
> A razão de cada uma dessas decisões, e a medição que a forçou, está nos
> comentários desses ficheiros. É lá que este projeto guarda o porquê.
>
> **Foi substituído:** *como* uma arte sobe de grau. Este documento descreve
> duas escadas — o 感悟 dentro da corrida e os 秘笈 entre corridas — e as duas
> saíram. Subiam o mesmo número, uma delas apagava-se ao fim de cada corrida, e
> nenhuma estava presa a algo que o jogador pudesse ver. Era isso o relatório
> *"skills sobem em combate não faz sentido"*.
>
> **A regra agora é uma frase: a arma decide o que fazes, o equipamento decide
> com que força.**
>
> - **Quais** as artes — o pergaminho da arma na mão, como sempre.
> - **Quantas acordam** — a raridade da arma. 凡 acorda uma; 宝 acorda quatro;
>   神 acorda o pergaminho inteiro.
> - **Que grau têm** — as raridades das quatro peças vestidas, somadas, quatro
>   pontos por grau.
>
> E o minuto 8 continua diferente do minuto 1, porque uma peça apanhada durante
> a corrida **veste-se ali**, se for de raridade melhor do que a que trazes.
> A espada roxa cai ao minuto seis, atravessas o campo até ela, e acorda-te uma
> quarta arte a meio da luta.
>
> Um nível (感悟) passou a ser 内力: dano e vida, plano e aborrecido de
> propósito, para nunca mais se confundir com uma arte.
>
> Código: a secção 器蕴 em `src/sim/arts.ts`. Medição: `npx tsx tools/attune.mts`.

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
| C | Efeitos aplicados, começando pelos que já existem | `tools/artsBalance.mts`: o ganho por arma | **feito — as 30 agem** |
| D | Aba 法 no hub: equipar quatro, definir a ordem | harness: equipar, reordenar, confirmar que persiste | modelo feito, ecrã por fazer |
| E | 秘笈 caem e ensinam | teste: um manual duplicado não ensina duas vezes | |
| F | As 3 cartas saem; 感悟 avança a lista | `artsBalance.mts`: bater a coluna das cartas | **bloqueado pelo passo 3** |

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

### Passo C, como ficou — e o que ainda não faz

`src/sim/arts.ts`. **8 dos 16 efeitos estão ligados, e 17 das 30 artes agem.**
Os outros 13 esperam pelas seis funcionalidades novas.

Duas coisas do vocabulário nunca chegam a ser precisas: **nenhuma arte usa
`maxHp` nem `nova`**. O primeiro é um alívio — uma vida máxima condicional
teria de decidir o que acontece à vida atual quando a condição cai, e todas as
respostas a isso são más.

**Uma segunda camada, não uma mudança à primeira.** `deriveStats` produz o que
a personagem traz de permanente e só muda quando o equipamento muda; recalcular
isso por frame poria o custo de tudo o que o jogador possui dentro de cada
tick. Uma arte é o contrário: é verdade enquanto a condição se cumpre e falsa no
instante em que deixa de se cumprir. Por isso as artes são uma camada barata
por cima, escrita num objeto reutilizado — um frame custa uma cópia de quinze
números e zero alocações.

**Um frame de atraso, de propósito.** As condições são sentidas no fim de um
frame, a partir do estado que esse frame produziu, e as artes aplicam-se no
início do seguinte. Sentir primeiro seria sentir a partir de uma posição onde o
jogador ainda não está, e a arte de velocidade passaria a depender de um
movimento que depende dela. Dezasseis milissegundos ninguém sente; a alternativa
é uma dependência circular.

**Três efeitos têm o seu próprio passo, e não os 35% partilhados:**

| Efeito | Por grau | Porquê |
|---|---|---|
| `range` | +22% | a área do golpe cresce com o **quadrado** do alcance — 35% seria quase o dobro dos abates |
| `speed` | +12% | num jogo cujo único verbo é mover, velocidade não é uma stat entre outras; a 35% nada te apanha e o género deixa de funcionar |
| `magnet` | +60% | o mais generoso, porque não tira nada aos inimigos — remove uma tarefa, não ganha um combate |

**Medido, não argumentado.** `tools/artsBalance.mts` joga cada arma com e sem o
seu rolo, mesmo piloto, mesmas sementes:

| Arma | vivas | sobrevivência | abates |
|---|---|---|---|
| Straight Jian | 2 | +24% | +40% |
| Curved Dao | 3 | −1% | +4% |
| Heavy Zhanmadao | 2 | +2% | +15% |
| Twin Blades | 4 | +4% | +7% |
| Long Spear | 3 | +20% | +40% |
| Iron Fan | 3 | +3% | +12% |

E `regions.mts` (que agora também corre as artes, senão mediria um jogo que
ninguém joga) mantém a ordem entre as cinco regiões, com sobrevivência a subir
entre 0 e 8%.

**O que a medição não vê, e é preciso dizê-lo.** O piloto anda em círculo: segura
疾 quase sempre, vira a cada volta, é cercado quando a multidão fecha, e só
chega a 危 se estiver a perder. **Nunca está parado.** Uma arte em 静 não
contribui nada nestas tabelas e parece grátis. São precisamente essas as que um
jogador provoca de propósito — e nenhum piloto headless as vai medir por nós.
Precisam de mãos.

---

## As cartas quase saíram, e a medição impediu-o

O plano deste documento é claro: as 3 cartas saem e 感悟 passa a subir as
quatro artes equipadas. Escrevi esse código — `beginProgress` e `advanceArt` em
`src/sim/arts.ts`, com testes — liguei-o, e depois medi.

`tools/artsBalance.mts` ganhou uma terceira coluna para isto: a mesma corrida
sem crescimento nenhum, com as **cartas**, e com as **artes**. O resultado:

| Arma | vivas de 4 | nada | cartas | artes |
|---|---|---|---|---|
| Straight Jian | 1 | 159 | 185 | **218** |
| Curved Dao | 2 | 135 | **179** | 139 |
| Heavy Zhanmadao | 2 | 117 | **161** | 118 |
| Twin Blades | 3 | 166 | **195** | 193 |
| Long Spear | 2 | 145 | **178** | 163 |
| Iron Fan | 3 | 150 | **185** | 155 |

**−9% de sobrevivência no total, e muito pior nos abates.** E a coluna das
cartas é um *chão*: o piloto escolhe sempre a primeira carta oferecida, e um
jogador escolhe melhor.

A causa está na coluna `vivas`: das quatro artes que cada arma carrega, só uma
a três fazem alguma coisa. Cada 感悟 que cai numa das outras é uma subida de
nível que não faz nada.

Por isso **a ordem deste documento não é uma preferência, é uma dependência**:
os seis efeitos que faltam têm de existir antes de as cartas poderem sair.
Tirá-las primeiro não tornava o jogo mais difícil — tornava-o mais curto.

As cartas ficaram. O que ficou também, e é ganho real:

- **`Character.arts`** — quais quatro artes carregas por arma, e por que ordem.
  Guardado, validado contra a tabela real, e com recurso às primeiras quatro do
  rolo para quem nunca abrir a aba.
- **A barra mostra as quatro que a simulação carrega**, não as cinco do rolo.
  Antes havia um tile no ecrã que nunca podia disparar.
- **`advanceArt`** está escrito e testado, à espera do passo F.

### E uma correção a mim próprio

Escrevi no `regions.mts` que as artes ali disparam porque o piloto "corre a
fundo e vira". É falso: esse piloto voa a 0.3 de deflexão, que fica acima dos
0.1 de 静 e abaixo dos 0.86 de 疾 — **nenhuma postura se cumpre naquela
tabela**. Medido: desligar as artes não muda um único dígito de nenhuma linha.
A ligação lá fica na mesma, para que no dia em que uma arte de situação (围,
危) conte, a tabela passe a refleti-la em vez de medir um jogo sem artes.


---

## Os seis efeitos novos, e o que eles custaram a acertar

`pierce` `crit` `echo` `push` `guard` `heal` estão feitos. **As 30 artes agem.**

Três decisões que não eram óbvias:

**`pierce` teve de virar uma troca.** O golpe já atinge *todos* os inimigos
dentro do arco, por isso "atravessa o que acerta" já era verdade e o efeito
seria uma palavra sem nada por trás. Passou a estocada a sério: o arco fecha a
metade e o alcance cresce. Estreito e longo é uma forma genuinamente diferente
de largo e curto — e custa alguma coisa, que uma arte condicional pode dar-se
ao luxo de custar.

**`crit` conta, não sorteia.** Um sorteio teria de puxar do RNG da corrida, e
cada puxão desloca todos os rolamentos de drop seguintes — o loot passaria a
depender de quantas vezes provocaste uma arte, e partia a propriedade
*mesma seed + mesmos inputs = mesma corrida* de que dependem os replays e os
harnesses. É a cada N golpes. Ganha-se ainda outra coisa: o jogador pode
aprender o ritmo, o que um sorteio nunca lhe deixa fazer.

**`guard` é multiplicativo.** Redução aditiva chega a zero, e um
survivors-like com um jogador invulnerável não é um jogo.

### 血 mudou de condição, e foi a medição que o obrigou

Em 危 esta arte dava **460 a 525 segundos** contra 135 sem artes e 179 com as
cartas — três vezes qualquer outra build. A causa é estrutural, e nenhuma
afinação lá chegou:

| Tentativa | Resultado |
|---|---|
| cooldown de 0.5s entre curas | 525 → **523** |
| cura reduzida a um quarto | **479** |
| orçamento por episódio de perigo | **460** |

Uma cura ligada a *vida baixa* é um ciclo estabilizador: só tem de igualar o
dano recebido no limiar onde dispara, e é o jogador que decide quanto dano
entra. **Magnitude não vence um ciclo de realimentação.**

Em 静 o ciclo não fecha: curar exige parar, e parar no meio da multidão é como
se morre. A arte passa a ser uma decisão sob pressão em vez de um chão onde te
sentas. 血 e 压 trocaram de condição; o rolo do sabre continua a cobrir as cinco.

### Dois pilotos, porque um estava a decidir a resposta

O `kite` corre em círculo a fundo: segura 疾 para sempre e **nunca está
parado**, por isso as seis artes de 静 do jogo pontuavam exatamente zero e uma
arma que se apoie em plantar-se era reportada como fraca sem nunca ter sido
testada.

O `duel` corre, planta-se, inverte, corre outra vez. Provoca as três posturas.

| Piloto | Artes contra as cartas |
|---|---|
| kite | +1% |
| duel | −4% |

E com o `duel` as seis armas ficam todas dentro de poucos pontos umas das
outras — nenhum outlier, que é o que interessa mais do que o total.

**Também havia um erro no rótulo da tabela:** usava a primeira letra da
condição, e `still` e `surrounded` começam ambas por *s*. Passou a usar o selo.

### Onde isto deixa o passo F

As artes estão agora **a par do chão das cartas**, não claramente acima. E esse
chão é generoso comigo: o piloto escolhe sempre a primeira carta oferecida, e um
jogador escolhe melhor. Tirar as cartas hoje ainda encurtaria a corrida.

Falta uma passagem de afinação sobre os passos das artes, medida contra as duas
colunas, antes de F. As cartas ficam até lá.
