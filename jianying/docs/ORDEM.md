# A ordem de implementação

*Escrito depois de oito documentos de proposta e nenhuma linha implementada.
O objetivo aqui não é decidir O QUÊ — isso já está nas folhas em `docs/` — é
decidir a SEQUÊNCIA, de forma a que nenhum passo obrigue a refazer o anterior.*

---

## O único nó de arquitetura, e porque tem de vir primeiro

Hoje, no save, um item que possuis é **uma string**:

```ts
// src/meta/inventory.ts
owned: string[]                    // ['r-lamellar', 'h-hat', ...]
equipped: Record<Slot, string>
```

Uma string não tem onde guardar um grau, nem encaixes, nem uma tinta própria.
**Tudo o que discutimos precisa de uma instância.**

Se construir o ecrã da forja antes de mudar isto, escrevo a forja contra
strings e volto a escrevê-la contra instâncias. Se mudar o save primeiro, a
forja nasce certa à primeira.

### A regra que evita a segunda migração

Definir a instância **uma vez, com espaço para o que vem a seguir**, mesmo que
os campos fiquem vazios durante meses:

```ts
interface OwnedItem {
  id: string        // qual item
  rank: number      // 阶 0..5 — de onde caiu decide o quão boa é a peça
  rites: string[]   // encaixes — vazio até ao passo 7, mas o campo existe
}
```

**FEITO.** `src/meta/inventory.ts`, save `jianying.save.v2`. Continua a haver
uma linha por peça — um telemóvel não aguenta uma lista de todas as cópias já
encontradas — mas uma segunda cópia deixou de não valer nada: encontrada num
sítio mais fundo, **sobe** a que já tens (`acquire` devolve `new` / `raised` /
`duplicate`, e o ecrã de recompensa diz qual). Os ritos sobrevivem à subida,
senão a forja seria uma armadilha.

Acrescentar `rites` mais tarde seria **uma segunda migração de save** em
telemóveis que já têm progresso. Acrescentar agora custa uma linha.

---

## Duas decisões tomadas, e porque cabem na mesma migração

**A classe é a arma na mão.** Não há um seletor de classe na criação. Todas as
armas caem, e a arma equipada decide as artes — trocar de lança para sabre é
trocar de estilo de combate. Isto mantém o loot como motor: uma arma nova não é
mais um número, é outra forma de lutar. O custo, declarado: nunca há uma
identidade fixa. És *quem usa lança agora*, não *um lanceiro*.

**`New swordsman` passa a ser um roster.** Com artes diferentes por arma,
experimentar outro caminho não pode custar apagar a personagem. O save passa a
guardar uma **lista** de espadachins (limite `ROSTER_LIMIT`), e criar um novo
acrescenta em vez de destruir.

A razão de estarem escritas aqui e não numa folha de proposta: as duas mudam o
formato do save, e o passo 1 também. Feitas em separado seriam **três**
migrações sobre telemóveis com progresso real. Feitas juntas são **uma** — e é
por isso que `jianying.save.v2` já nasce com o envelope do roster, mesmo
enquanto só lá está um espadachim. O ecrã do roster, quando chegar, não custa
migração nenhuma.

---

## A sequência

| # | Passo | Depende de | Muda algo visível? | Estado |
|---|---|---|---|---|
| **1** | **Instância de item no save** | — | **Não.** É o passo invisível. | **feito** |
| 1b | Roster de espadachins | 1 | Sim, a aba 剑 | **feito** |
| 2 | Stats: 10 tipos → 4 com escala | — | Sim, as linhas dos itens | **feito** |
| 3 | Sets: agrupar os 22 em 5 + inicial | 2 | Sim, nomes e agrupamento | |
| 4 | Marcas de grau na figura | 1 | Sim, o grau vê-se | **feito** |
| 5 | Aba 炉 Forja: temperar com repetidas | 1, 2, 4 | Sim, o ciclo novo | |
| 6 | *APK e jogar* | 5 | — | |
| 7 | Encaixes e ritos (auras) | 1, 6 | Sim, muito | |

### Passo 4, como ficou

`src/render/rankMarks.ts`. Cada encaixe tem o **seu próprio vocabulário** —
faixas empilhadas na coroa, borlas nos punhos, cordões no cinto, um cordão no
punho da arma — porque a primeira versão usava a mesma bainha para tudo e um
chapéu temperado ganhava bainha. Assim a figura diz *qual* peça subiu, não
apenas que alguma subiu.

As marcas penduram-se em **âncoras da figura construída** (`Swordsman.anchors`),
não em constantes: um punho move-se com o item de ombros, com o bearing e com a
compleição. As folhas de contacto tinham isto escrito à mão e desenhavam borlas
no ar em qualquer conjunto de mangas largas — agora `tools/sheet.ts` delega na
mesma geometria do jogo.

### Passo 2, como ficou

Dez tipos passaram a **quatro**, e os quatro são os que o hub já explica com o
efeito escrito nas unidades do jogador: 体 锋 疾 神. Os seis canais crus que
foram apagados — `maxHp`, `damage`, `rate`, `range`, `pickup`, `artPower` —
tinham dois problemas. Metade dizia a mesma coisa duas vezes (`body` já dá vida
e `maxHp` dava vida), e **nenhum deles passava pela curva de retorno
decrescente**, por isso uma túnica e o ecrã de atributos discordavam sobre
quanto valiam as mesmas palavras.

É também aqui que o **rank deixa de ser decoração**: `statAt` multiplica a
linha da peça em 30% por grau, e o cartão mostra o valor ao grau que tens.
Medido com `tools/regions.mts`: os segundos de sobrevivência em todas as cinco
regiões ficaram dentro do ruído, portanto isto foi legibilidade, não um buff.

### Porquê esta ordem e não outra

**1 antes de tudo.** É o único passo que toca no formato do save. Fazê-lo
primeiro, sozinho e sem nada visível, significa que a migração pode ser testada
isoladamente — e uma migração de save partida apaga o progresso de quem já
está a jogar. Nenhum outro passo tem esse risco.

**2 antes de 3.** Um set é dono de um stat. Agrupar antes de saber que stats
existem obriga a reagrupar.

**4 antes de 5.** A forja mostra a peça antes e depois de temperar. Sem as
marcas, o botão principal do ecrã não tem consequência visível — e um botão
sem consequência visível não se consegue testar no telemóvel.

**6 antes de 7.** Os ritos são a parte pesada (desenho + efeito real em
combate). Não vale construí-los antes de o ciclo de baixo ter sido sentido num
aparelho. Se temperar não souber bem, ritos por cima também não vão saber.

---

## O que fica de fora, de propósito

- **Áudio e vibração.** Não tocam em nada disto e podem ser feitos a qualquer
  altura, em paralelo. Continuam a ser o maior salto de sensação por esforço.
- **Mais itens.** A tabela tem 22 e não há folga no guarda-roupa. Os graus
  compram profundidade sem itens novos; expandir a tabela é um projeto próprio
  e vem depois de 6.
- **O sistema completo de quatro eixos** (`docs/system.png`). Fica guardado.
  É profundidade de Path of Exile num ecrã que se joga com um polegar, e não
  se constrói antes de o primeiro eixo estar provado.

---

## Uma decisão ainda por tomar

Cinco sets contra quatro stats não dividem. Duas saídas, e é preciso escolher
antes do passo 3:

- **Quatro sets**, um por stat, e o quinto conjunto de peças fica solto.
- **Cinco sets**, e dois partilham 锋 Edge distinguindo-se pela arma.

Nenhuma das duas obriga a refazer nada mais à frente — só têm de estar
decididas antes de agrupar.
