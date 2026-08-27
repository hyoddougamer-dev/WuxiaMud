# 剑影 Jiànyǐng — Plano de Profundidade

> Como transformar níveis, mundo e classes de números em decisões — em quatro
> fases, cada uma a sair num APK que podes jogar.

## O diagnóstico

O jogo tem hoje **um sítio** (as 8 «estradas» são o mesmo chão com um
multiplicador), **um eixo de build** (4 atributos que só sobem) e **uma escolha
por item** (é maior, logo equipa-se). Nada disto tem custo, e sem custo não há
decisão.

**A regra que orienta tudo o que vem a seguir:** profundidade não é mais
números, é o mesmo número passar a custar alguma coisa.

---

## Fase 0 · Parar de repetir o mesmo dia
*meia sessão*

Antes de tudo, porque mina qualquer conteúdo que venha depois. A seed é
`dailySeed()`, portanto hoje todas as tuas expedições encontram os mesmos
inimigos pela mesma ordem e oferecem as mesmas técnicas nos mesmos momentos.
Passa a ser aleatória por corrida; a diária fica guardada para quando existir um
modo que a use.

→ **Sai APK.** Duas corridas seguidas deixam de ser iguais.

---

## Fase 1 · O mundo deixa de ser um número
*3–4 sessões · a maior*

Responde a «o mundo». Hoje uma estrada é vida ×1,38 e um nome bonito. Passa a
ser um **sítio**: roster próprio, uma regra que muda como se joga lá, boss
próprio, e itens que só caem ali. Vais ao Pântano porque é onde cai a peça que
queres, não porque é o número 2.

Reduzo de 8 estradas para **5 regiões**. Oito eram degraus vazios; cinco cheias
valem mais que oito ocas.

| Região | A regra do sítio | Traz |
|---|---|---|
| 官道 **Estrada Real** | Nenhuma. Aprende-se aqui. | Bandidos, cortadores de bolsas |
| 芦荡 **Pântano** | Andas 15% mais devagar. Eles não. | Alcance passa a valer. Sanguessuga, afogado |
| 断崖 **Escarpa** | Vento constante empurra-te para um lado. | Ficar parado deixa de existir. Bestas, atiradores |
| 鬼市 **Mercado dos Fantasmas** | Tudo o que morre divide-se uma vez. | Matar nem sempre é boa ideia. Efígies, papel |
| 关隘 **O Desfiladeiro** | Chegam em formação, de um lado só. | O Senhor da Guerra. Tudo ao mesmo tempo |

**O que traz:**

- **~12 inimigos novos.** Dois ou três exclusivos por região, para o campo mudar
  mesmo de sítio para sítio. A arquitetura já suporta: é a tabela de dados de
  `enemies.ts` mais uma silhueta por comportamento.
- **5 bosses, não 1.** Um por região, cada um a testar a regra do sítio. O do
  Pântano castiga quem não tem alcance; o da Escarpa castiga quem não se mexe
  com o vento.
- **Tabelas de drop por região.** É isto que faz escolher para onde ir. O item
  que queres passa a ter morada.
- **O seletor passa a mapa.** Em vez de oito quadradinhos numerados, cinco
  sítios com nome, regra e o que cai lá.

→ **Sai APK.** Pela primeira vez há um mundo, e uma razão para escolher parte dele.

---

## Fase 2 · As escolas ganham espinha
*2 sessões*

Responde a «classes». Hoje uma escola é uma arma — sente-se no primeiro segundo,
e depois desaparece, porque todos sorteiam as mesmas dez técnicas. Cada escola
passa a ter **quatro técnicas exclusivas** no sorteio, além das comuns. A arma é
o segundo a segundo; o baralho é a identidade da corrida.

| Escola | Baralho próprio | Faz o quê |
|---|---|---|
| 山门 Mountain Sect | 磐石 Rocha | Aguentar. Reduz dano, recupera vida ao matar |
| 将门 Frontier Garrison | 陷阵 Brecha | Momento. Dano cresce enquanto avanças |
| 游侠 Wandering Blade | 影 Sombra | Velocidade, esquiva, golpes críticos |
| 道观 Temple Acolyte | 气 Qi | Artes maiores, mais raio, mais órbita |
| 关隘 Pass Watch | 守 Guarda | Alcance, perfuração, controlo de zona |

Mais uma **passiva por escola**, sempre ativa, que se lê no primeiro minuto —
não um número escondido.

→ **Sai APK.** Duas escolas deixam de convergir para a mesma corrida.

---

## Fase 3 · Escolher passa a custar
*1–2 sessões · maior retorno por esforço*

Responde a «níveis» no sentido de build. É a fase mais barata e talvez a que
mais muda o jogo, porque introduz a primeira decisão real que o jogo alguma vez
pediu.

- **Todo o item ganha um custo.** Uma linha a mais, nada de folha de cálculo.
  «Ombreiras de ferro: +22 vida, −8% de movimento.» De repente equipar é uma
  decisão em vez de uma subida garantida, e um item deixa de ficar obsoleto só
  porque apareceu outro maior.
- **Atributos com limiares.** Aos 6, 12 e 20 pontos num atributo abre um **dom**
  com nome. Corpo 6: sobrevives a um golpe letal por expedição. Gume 6: cada
  quinto golpe bate duas vezes. Isto transforma quatro barras que só sobem em
  quatro caminhos que se escolhem — e dá razão para concentrar em vez de
  espalhar.
- **Reinos passam a portas.** Cada reino abre uma região e um limiar, em vez de
  só somar um ponto. Subir passa a ter um acontecimento.

→ **Sai APK.** Existe pela primeira vez a palavra «build».

---

## Fase 4 · A expedição ganha forma
*2 sessões*

Hoje uma corrida é uma rampa plana até morreres: o minuto três é o minuto um com
mais gente. Passa a ter **batidas com nome** em momentos fixos — uma vaga de
elite aos 60s, o boss aos 115s, um cerco aos 150s — para a corrida ter memória
em vez de ser uma linha.

- **Uma bifurcação a meio.** Aos ~70s, duas opções em cartas: «atalho — mais
  denso, mais qi» ou «desvio — mais calmo, menos». Uma escolha por corrida
  chega; duas já é um menu.
- **Grupos de elite com modificador visível.** Um bando com uma marca a cinábrio
  e uma propriedade — blindado, veloz, explode ao morrer. Dão bom loot. É o que
  faz olhar para o campo em vez de para o cronómetro.

→ **Sai APK.** A corrida tem princípio, meio e fim em vez de só fim.

---

## Paralelo · Som e vibração
*1 sessão*

Não é profundidade, e por isso não está numerado — mas é honestamente o maior
salto de sensação por esforço investido, e o buraco mais evidente que o jogo
tem. Zero áudio, zero hápticos, com o plugin já instalado e nunca chamado.
Encaixa em qualquer altura, e recomendo não deixar para o fim.

---

## O risco, e a trava

**A preocupação legítima:** já te sentiste perdido neste jogo mais do que uma
vez, e este plano acrescenta regiões, baralhos, limiares, custos e batidas.
Feito sem cuidado, torna o problema pior em vez de melhor.

**A trava:** cada fase acrescenta **exatamente uma coisa nova para perceber**, e
nenhuma sai sem que o codex do jogo cresça com ela. Se uma fase precisar de dois
conceitos novos ao mesmo tempo, parte-se em duas. E cada fase sai num APK — se
uma te confundir, paramos e arrumamos antes da seguinte, em vez de descobrir no
fim.

---

## Duas coisas que são tuas

**1 · Cinco regiões ou oito?**
Proponho cinco cheias em vez de oito ocas — mas isso apaga três estradas que já
têm nome escrito. Se preferires manter as oito, dá mais trabalho de conteúdo e
cada uma fica mais fina.

**2 · Custos nos itens: sim ou não?**
É a mudança com mais retorno e também a única que pode fazer o jogo parecer
*pior* a quem só quer números a subir. Trocas «isto é melhor» por «isto é
diferente». Acho que é o certo para o jogo que estamos a fazer, mas é uma
mudança de género e a decisão é tua.

---

*A partir do build 1.4.0 · ~9 sessões no total · cada fase sai num APK*
