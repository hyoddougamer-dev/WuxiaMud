# 剑影 Jiànyǐng

Survivors-like wuxia para telemóvel. Portrait, um polegar, corridas curtas.

Projeto **independente** do Língyún Dào que vive em `../src` — tem o seu próprio
`package.json`, as suas dependências e o seu workflow de CI. Os dois não se tocam.

Duas classes — 斩马刀 e 飞刀 —, cinco regiões com regras próprias, equipamento
com raridade que acorda as artes (器蕴), e progressão permanente entre corridas.

---

## Como obténs o APK sem PC

A máquina onde o código é escrito não tem Android SDK nem acesso a
`dl.google.com`, por isso o APK **não** é compilado lá. É o GitHub Actions que o
faz:

```
código  →  push  →  GitHub Actions  →  APK  →  telemóvel
```

**Link fixo, sempre a versão mais recente:**

https://github.com/hyoddougamer-dev/WuxiaMud/releases/tag/jianying-latest

1. Abre o link no telemóvel.
2. Toca no ficheiro `.apk`.
3. Na primeira vez, o Android pede autorização para instalar desta origem, e o
   Play Protect avisa. É um build de *debug* não assinado para loja, por isso o
   aviso é esperado — **Instalar mesmo assim**.

Sem login e sem extrair zip. Cada build substitui o APK no mesmo link, por isso
nunca é preciso procurar a execução certa.

<details>
<summary>Alternativa: o artifact da execução</summary>

O mesmo APK fica também em **Actions → a execução → Artifacts**, mas isso é um
zip e exige sessão iniciada — sete passos no telemóvel em vez de três. Só vale a
pena para ir buscar um build antigo em concreto.

</details>

### Porque é que os updates instalam por cima

Cada runner do GitHub é descartável, por isso o Gradle criaria uma keystore de
debug **nova em cada build**. O Android considera dois APKs com assinaturas
diferentes apps diferentes, portanto instalar por cima falha com *"App não
instalada"* — e o telemóvel fica calado com a versão antiga.

A keystore fixa vive em `ci/debug.keystore.enc`, encriptada com AES-256. O
segredo `DEBUG_KEYSTORE_PASSPHRASE` do repositório é que a abre. Ficheiro
encriptado no repo em vez de base64 no segredo porque assim configurar isto é
uma colagem de 28 caracteres, e não de 3 KB — o que importa quando se trabalha
a partir do telemóvel.

Se o segredo faltar, o build não parte: emite um aviso e assina com uma chave
nova, e o APK resultante não instalará por cima do anterior.

A assinatura de *release* (para a loja) entra na Fase 6, essa sim com a keystore
inteira em GitHub Secrets.

---

## Testar num PC

Tudo o que se segue corre a partir de `jianying/` — a raiz do repositório é
outro projeto, com o seu próprio `package.json`. Precisas de **Node 22**.

```bash
cd jianying
npm install
```

### 1. Jogar no browser — o ciclo rápido

```bash
npm run dev          # http://127.0.0.1:5273
```

Abre as DevTools (F12), liga o **modo dispositivo** (Ctrl+Shift+M) e escolhe um
telemóvel de 393×851. Isto não é cosmético: o jogo é *portrait* e o joystick é
um evento de toque, por isso sem a emulação de toque estás a testar outra coisa.
Guardar um ficheiro recarrega em cerca de um segundo.

### 2. Jogar no telemóvel, com o código a correr no PC — o ciclo honesto

É a maior diferença que o PC te traz, e evita o ciclo de 5 minutos do APK:

```bash
npm run dev:lan      # imprime um endereço http://192.168.x.x:5273
```

Abre esse endereço no browser do telemóvel, na mesma rede. Toque real, ecrã
real, GPU real — e continua a recarregar sozinho quando gravas um ficheiro. Só
não passa por aqui o que é nativo (hápticos, barra de estado, gravação via
Capacitor Preferences), que só o APK exercita.

### 3. As verificações, antes de qualquer commit

```bash
npm run check        # typecheck + lint + 335 testes
```

Um só comando de propósito. Correr os três separadamente é o que faz com que se
esqueça sempre o terceiro.

### 4. As capturas automáticas

```bash
npx playwright install chromium   # só na primeira vez
npm run shoot                     # -> shots/
npm run shoot -- --full           # joga até morrer e verifica o ecrã final
```

`shoot` arranca o build de produção, carrega-o num Chromium a 393×851, navega
os ecrãs e captura imagens. Foi construído porque a máquina onde este código foi
escrito não tem telemóvel — no teu PC continua a valer, porque é o que apanha
"o botão desapareceu" sem tu teres de clicar por todo o lado.

Nota: `--full` corre uma expedição em tempo real, portanto é lento.

### 5. As ferramentas de medição

É aqui que o PC compensa mais, porque estas correm em segundos e respondem a
perguntas que jogar não responde:

```bash
npx tsx tools/runLength.mts     # quanto tempo demora uma corrida e o que rende
npx tsx tools/attune.mts        # a curva de poder do 器蕴, a 24 seeds
npx tsx tools/artsBalance.mts   # quanto vale cada arte, medido
npx tsx tools/regions.mts       # cada região joga mesmo de forma diferente?
npx tsx tools/perf.mts          # onde vai o tempo de frame, num browser real
npx tsx tools/classes.ts        # folha de contacto das duas classes
```

Nenhuma abre uma janela — usam a mesma simulação determinística dos testes, com
seeds fixas, por isso duas execuções dão o mesmo número. É o que torna
"parece-me mais forte" numa medição.

### 6. O APK, localmente

Só vale a pena para testar o que é nativo. Precisas de **JDK 21** e do **Android
SDK** com `platforms;android-36` e `build-tools;36.0.0`, com `ANDROID_HOME`
apontado para ele.

```bash
DEBUG_KEYSTORE_PASSPHRASE=... npm run apk
npm run install:phone            # telemóvel por USB, depuração USB ligada
```

A passphrase é a mesma que está em *Settings → Secrets and variables → Actions*.
Não é opcional: sem ela o Gradle assina com uma chave nova, e o Android trata
dois APKs com assinaturas diferentes como aplicações diferentes — o teu build
local recusa-se a instalar por cima do que veio do GitHub. O script fixa a
keystore estável e **verifica a impressão digital no fim**, que é a única coisa
que apanha isso antes do telemóvel.

Se não quiseres SDK nenhum, o `git push` continua a produzir o APK no GitHub
Actions, como sempre.

## Comandos, em resumo

```bash
npm run dev        # servidor de desenvolvimento (127.0.0.1:5273)
npm run dev:lan    # o mesmo, acessível ao telemóvel na mesma rede
npm run check      # typecheck + lint + testes
npm run typecheck  # tsc --noEmit
npm run lint
npm test           # testes de simulação (vitest)
npm run build      # typecheck + bundle de produção
npm run shoot      # screenshots a 393x851 -> shots/
npm run apk        # APK local, com a assinatura estável
```

---

## Arquitetura

```
src/
  core/     loop.ts (timestep fixo 60Hz)  rng.ts (seeded)  pool.ts  grid.ts  tween.ts
  data/     as tabelas — armas, artes, itens, afixos, raridade, regiões, inimigos
  sim/      combat  player  enemies  projectiles  drops  arts  loadout  hazards
  render/   figure  wardrobe  silhouette  ink  stage  camera  paper  palette
  ui/       hud  hub  create  title  codex  joystick  banner  tutorial
  meta/     character  inventory  save  realms  schools  look
  net/      (vazio — o assíncrono é da Fase 5)
tests/      13 ficheiros, 335 testes headless da simulação
tools/      shoot.ts (capturas) + as ferramentas de medição
```

A separação que carrega isto: **`data/` são tabelas, `sim/` lê-as, e nada em
`sim/` sabe desenhar**. É o que permite às ferramentas de medição jogarem
expedições inteiras em segundos, sem browser — e é por isso que uma pergunta de
equilíbrio se responde com um número em vez de uma opinião.

Quatro decisões carregam o resto do projeto:

**Timestep fixo a 60Hz**, com render interpolado. Sem isto, um telemóvel a 120Hz
jogaria a uma velocidade diferente de um a 60Hz — e replays gravados num não
reproduziriam no outro.

**RNG determinístico com seed.** Nenhuma parte da simulação chama `Math.random()`.
Isso paga três coisas ao mesmo tempo: testes de balanceamento headless, replays
guardados como `seed + inputs` (kilobytes, não vídeo), e anti-cheat por
re-simulação no servidor.

**Object pooling.** O loop quente não aloca. A pausa periódica que os jogadores
leem como "está mal otimizado" costuma ser o garbage collector, não o custo do
frame.

**Silhuetas sem detalhe interior.** Mantêm-se legíveis com centenas de entidades
no ecrã, que é exatamente a carga que este género produz.

## Arte

Tudo é geometria gerada por código — não há uma única imagem no repositório. O
papel, as montanhas, a figura e a faixa são pinceladas calculadas a partir de uma
seed.

Cada marca é desenhada duas vezes: uma passagem larga e ténue por baixo
(*bleed*) e o traço sólido por cima. Esse par é o que lê como tinta a absorver no
papel; um preenchimento de aresta dura lê sempre como forma vetorial.

A ondulação das bordas é ruído de baixa frequência (soma de harmónicas), não
aleatório por amostra — cerdas reais vagueiam devagar, não saltam entre pontos
adjacentes. Ruído independente fazia as bordas parecerem **rasgadas**.

Peças de alta fidelidade (bosses, key art) entram geradas por IA e passadas por
um filtro de tinta, para casarem com a base.

## Nota sobre performance

O harness reporta números de fps baixos — 4 a 15 —, e esse número **não** prevê o
desempenho no telemóvel nem no teu PC. A máquina onde este código foi escrito não
tem GPU, portanto o Chromium rasteriza por CPU. Medido lá:

| pixels | fps |
|---|---|
| 0.33M | 15 |
| 0.75M | 7 |
| 2.31M | 4 |

Débito constante de ~5–9 Mpx/s — puramente limitado por preenchimento, uma
propriedade do rasterizador por software e não da lógica do jogo. O orçamento
real (≥55fps com 400 entidades) só pode ser medido em hardware com GPU: no teu PC
com `npx tsx tools/perf.mts`, ou no telemóvel com `npm run dev:lan`. Os dois são
agora possíveis e nenhum era antes.
