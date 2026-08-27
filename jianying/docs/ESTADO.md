# 剑影 Jiànyǐng — Estado

*build 1.4.0 · commit 1620294 · 9 605 linhas · 158 testes*

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
| Entrada | ✅ feito | Título → criação → codex → hub. Quem volta passa direto com «Continue». |
| Combate | ✅ feito | Golpe automático ao inimigo mais próximo. Seis armas com alcance, arco e ritmo próprios. |
| Inimigos | ✅ feito | 8 tipos em 6 comportamentos. Boss aos 115s. |
| Progressão na corrida | ✅ feito | 10 técnicas em duas famílias. ~5 subidas de Insight por corrida, ~20s de intervalo. |
| Progressão permanente | ✅ feito | 8 reinos de 5 níveis (淬体 → 剑仙), 4 atributos. Capacitor Preferences. |
| Equipamento | ⚠️ fino | Funciona: 22 itens, 4 slots, drops, inventário. Mas o wardrobe suporta 900 silhuetas e a tabela usa 22. |
| Profundidade | ⚠️ por ver | As 8 estradas existem, mas só abrem a cada reino — nível 6, 11, 16. É provável que nunca tenhas saído da primeira. |
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

## 五 · Encontrado ao verificar isto

### ⚠️ Todas as expedições do mesmo dia são idênticas

A seed da corrida é `dailySeed()` — ano, mês, dia. Vem do plano original, onde
havia um desafio diário partilhado. Mas esse modo nunca foi construído, e o jogo
tornou-se um ARPG de loot que se joga muitas vezes seguidas.

Resultado: hoje, todas as tuas corridas encontram os mesmos inimigos pela mesma
ordem *e* oferecem as mesmas três técnicas nos mesmos momentos. Se as corridas
te parecem repetitivas, esta é a causa mecânica — não é impressão.

A correção é pequena: seed aleatória por expedição, e guardar a diária para
quando o modo existir. Não a fiz sem te dizer porque muda deliberadamente uma
decisão de desenho anterior.

## 六 · O que eu faria a seguir

1. **Seed por corrida.** Corrige a repetição de raiz. Meia hora.
2. **Áudio e hápticos.** O maior salto de *feel* por esforço investido.
3. **Encher a tabela de itens.** De 22 para ~60, usando as silhuetas que o
   wardrobe já sabe desenhar. É escrever dados.
4. **Deixar-te ver as estradas fundas.** Estão trancadas atrás de reinos que
   demoram horas. Vale a pena abrir a segunda muito mais cedo.

---

*PixiJS 8 · TypeScript · Capacitor 8 · 158 testes · tsc e eslint limpos*
