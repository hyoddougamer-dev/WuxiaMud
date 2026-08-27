# 剑影 Jiànyǐng

Survivors-like wuxia para telemóvel. Portrait, um polegar, corridas curtas.

Projeto **independente** do Língyún Dào que vive em `../src` — tem o seu próprio
`package.json`, as suas dependências e o seu workflow de CI. Os dois não se tocam.

**Estado: Fase 0.** Ainda não há jogo. O que existe é o pipeline completo, do
código ao APK instalado, mais a direção de arte e a linguagem de movimento —
as duas coisas que não se conseguem avaliar por descrição.

---

## Como obténs o APK (sem PC)

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

## Comandos

```bash
npm install
npm run dev        # servidor de desenvolvimento
npm run typecheck  # tsc --noEmit
npm run lint
npm test           # testes de simulação (vitest)
npm run build      # typecheck + bundle de produção
npm run shoot      # screenshots a 393x851 -> shots/
npm run shoot -- --video
```

`npm run shoot` é o mecanismo que substitui um ecrã: arranca o build de
produção, carrega-o num Chromium com viewport de Pixel 5 e captura imagens. É
assim que o aspeto e o movimento são validados sem um telemóvel à mão.

---

## Arquitetura

```
src/
  core/     loop.ts (timestep fixo 60Hz)  rng.ts (seeded)  pool.ts  tween.ts
  render/   stage.ts  ink.ts  figure.ts  paper.ts  palette.ts
  sim/ ui/ net/ meta/   (vazios até à Fase 1)
tests/      testes headless da simulação
tools/      shoot.ts (harness de captura)
```

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

O harness reporta ~4 fps, e esse número **não** prevê o desempenho no telemóvel.
O container não tem GPU, portanto o Chromium rasteriza por CPU. Medido:

| pixels | fps |
|---|---|
| 0.33M | 15 |
| 0.75M | 7 |
| 2.31M | 4 |

Débito constante de ~5–9 Mpx/s — puramente limitado por preenchimento, uma
propriedade do rasterizador por software e não da lógica do jogo. O orçamento
real (≥55fps com 400 entidades) só pode ser medido no dispositivo.
