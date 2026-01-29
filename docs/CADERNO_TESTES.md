# 📋 CADERNO DE TESTES - LÍNGYÚN DÀO
## Manual de Validação de Funcionalidades

---

## 🎯 COMO USAR ESTE DOCUMENTO

Cada teste tem:
- **ID**: Identificador único
- **Pré-condições**: O que precisa estar configurado
- **Passos**: Ações a executar
- **Resultado Esperado**: O que deve acontecer
- **Status**: ⬜ Não testado | ✅ Passou | ❌ Falhou

---

# MÓDULO 1: AUTENTICAÇÃO

## T1.1 - Registo de Novo Utilizador
**Pré-condições:** Nenhuma conta existe com este email
**Passos:**
1. Abrir a aplicação
2. Clicar em "Create Account"
3. Preencher username, email e password
4. Clicar em "Register"

**Resultado Esperado:**
- ✓ Conta criada com sucesso
- ✓ Email de verificação enviado (se configurado)
- ✓ Redirecionado para character select
- ✓ Profile criado na tabela `profiles`

**Status:** ⬜

---

## T1.2 - Login com Conta Existente
**Pré-condições:** Conta já registada
**Passos:**
1. Abrir a aplicação
2. Inserir email e password
3. Clicar em "Login"

**Resultado Esperado:**
- ✓ Login bem sucedido
- ✓ Redirecionado para character select
- ✓ `last_login` atualizado no profile

**Status:** ⬜

---

## T1.3 - Login com Credenciais Erradas
**Passos:**
1. Inserir email correto, password errada
2. Tentar login

**Resultado Esperado:**
- ✓ Mensagem de erro clara
- ✓ Não permite acesso

**Status:** ⬜

---

## T1.4 - Logout
**Pré-condições:** Estar logado
**Passos:**
1. Clicar no botão de Settings
2. Clicar em "Logout"

**Resultado Esperado:**
- ✓ Sessão terminada
- ✓ Redirecionado para login
- ✓ Character data guardado antes de sair

**Status:** ⬜

---

## T1.5 - Conta Banida
**Pré-condições:** Admin marcou conta como `is_banned = true`
**Passos:**
1. Tentar login com conta banida

**Resultado Esperado:**
- ✓ Mensagem de ban exibida
- ✓ Não permite jogar

**Status:** ⬜

---

# MÓDULO 2: CRIAÇÃO DE PERSONAGEM

## T2.1 - Criar Primeiro Personagem
**Pré-condições:** Conta nova sem personagens
**Passos:**
1. Na tela de character select, clicar em slot vazio
2. Escolher nome
3. Escolher avatar (masculino/feminino)
4. Escolher classe
5. Confirmar criação

**Resultado Esperado:**
- ✓ Personagem criado no slot 0
- ✓ Nome único validado
- ✓ Starter kit aplicado (arma + ring + necklace)
- ✓ Stats iniciais corretos (5 em cada)
- ✓ Tutorial inicia automaticamente

**Status:** ⬜

---

## T2.2 - Limite de 3 Slots
**Pré-condições:** Já tem 3 personagens
**Passos:**
1. Tentar criar 4º personagem

**Resultado Esperado:**
- ✓ Não permite criar
- ✓ Mensagem de slot limit

**Status:** ⬜

---

## T2.3 - Apagar Personagem
**Pré-condições:** Ter pelo menos 1 personagem
**Passos:**
1. Na tela de select, clicar no X do personagem
2. Confirmar deleção

**Resultado Esperado:**
- ✓ Personagem removido
- ✓ Slot fica vazio
- ✓ Inventário e dados apagados

**Status:** ⬜

---

## T2.4 - Validação de Nome
**Passos:**
1. Tentar criar personagem com nome:
   - Vazio → Erro
   - Menos de 2 chars → Erro
   - Mais de 20 chars → Erro
   - Com caracteres especiais → Verificar política

**Resultado Esperado:**
- ✓ Validação clara
- ✓ Mensagens de erro informativas

**Status:** ⬜

---

# MÓDULO 3: TUTORIAL

## T3.1 - Completar Tutorial
**Pré-condições:** Personagem recém-criado
**Passos:**
1. Seguir cada passo do tutorial
2. Verificar que cada objetivo é marcado quando completo

**Resultado Esperado:**
- ✓ Tutorial guia corretamente
- ✓ Todos os passos completáveis
- ✓ `tutorialCompleted = true` após fim
- ✓ Tutorial não aparece em login subsequente

**Status:** ⬜

---

## T3.2 - Skip Tutorial (se disponível)
**Passos:**
1. Clicar em "Skip Tutorial"

**Resultado Esperado:**
- ✓ Tutorial encerrado
- ✓ Acesso normal ao jogo

**Status:** ⬜

---

# MÓDULO 4: COMBATE

## T4.1 - Iniciar Combate Normal
**Pré-condições:** Estar numa zona com mobs
**Passos:**
1. Clicar num mob no mapa
2. Confirmar combate

**Resultado Esperado:**
- ✓ Arena de combate abre
- ✓ Mob aparece com HP correto
- ✓ Skills disponíveis na hotbar
- ✓ É a vez do player primeiro

**Status:** ⬜

---

## T4.2 - Ataque Básico
**Passos:**
1. Em combate, clicar "Attack"

**Resultado Esperado:**
- ✓ Animação de ataque
- ✓ Dano calculado corretamente
- ✓ HP do mob reduz
- ✓ Log mostra dano
- ✓ Floating damage aparece

**Status:** ⬜

---

## T4.3 - Usar Skill
**Pré-condições:** Ter skill desbloqueada
**Passos:**
1. Clicar numa skill na hotbar

**Resultado Esperado:**
- ✓ QI consumido
- ✓ Dano/efeito aplicado
- ✓ Cooldown iniciado
- ✓ VFX exibido
- ✓ Não pode usar até cooldown acabar

**Status:** ⬜

---

## T4.4 - Sistema de Combos
**Pré-condições:** Conhecer sequência de combo da classe
**Passos:**
1. Executar skills na ordem do combo (ex: A → B → C)

**Resultado Esperado:**
- ✓ Combo tracker mostra progresso
- ✓ Efeito bónus ao completar
- ✓ Mensagem de combo no log

**Status:** ⬜

---

## T4.5 - Vantagem Elemental
**Passos:**
1. Atacar mob com elemento fraco ao teu

**Resultado Esperado:**
- ✓ Dano aumentado (1.25x)
- ✓ Indicador visual de "Super Effective"

**Status:** ⬜

---

## T4.6 - Desvantagem Elemental
**Passos:**
1. Atacar mob com elemento forte ao teu

**Resultado Esperado:**
- ✓ Dano reduzido (0.75x)
- ✓ Indicador de "Not Very Effective"

**Status:** ⬜

---

## T4.7 - Vitória em Combate
**Passos:**
1. Reduzir HP do mob a 0

**Resultado Esperado:**
- ✓ Mob morre
- ✓ EXP ganho
- ✓ Spirit Stones ganhos
- ✓ Loot modal aparece (se houver drops)
- ✓ Kill counter incrementado
- ✓ Quest objectives atualizados

**Status:** ⬜

---

## T4.8 - Morte do Player
**Passos:**
1. Deixar HP chegar a 0

**Resultado Esperado:**
- ✓ Death modal aparece
- ✓ Penalidade de EXP (5-10%)
- ✓ Durabilidade do gear reduzida
- ✓ Respawn na safe zone da região

**Status:** ⬜

---

## T4.9 - Flee (Fugir)
**Passos:**
1. Em combate, clicar "Flee"
2. Confirmar

**Resultado Esperado:**
- ✓ Combate termina
- ✓ Sem rewards
- ✓ Sem penalidade

**Status:** ⬜

---

## T4.10 - Auto-Combat
**Passos:**
1. Ativar auto-combat
2. Deixar correr

**Resultado Esperado:**
- ✓ Skills usadas automaticamente
- ✓ Potions usadas se configurado
- ✓ Timer de 30 min/dia
- ✓ Para se HP baixo (se configurado)
- ✓ Summary modal ao terminar

**Status:** ⬜

---

## T4.11 - Rate Limiting (Anti-Cheat)
**Passos:**
1. Tentar iniciar combates muito rápido (< 1s)

**Resultado Esperado:**
- ✓ Erro "Too fast!"
- ✓ Não permite spam

**Status:** ⬜

---

# MÓDULO 5: PROGRESSÃO

## T5.1 - Level Up
**Pré-condições:** EXP próximo do threshold
**Passos:**
1. Ganhar EXP suficiente para subir

**Resultado Esperado:**
- ✓ Level incrementa
- ✓ Recebe 3 AP
- ✓ Stats base aumentam automaticamente
- ✓ Max HP/QI aumentam
- ✓ Notificação de level up
- ✓ Novas skills desbloqueadas (nos níveis certos)

**Status:** ⬜

---

## T5.2 - Distribuir AP
**Passos:**
1. Ir à página Character
2. Adicionar pontos em stats

**Resultado Esperado:**
- ✓ AP gasto
- ✓ Stat aumenta
- ✓ Stats derivados (HP, damage) atualizam

**Status:** ⬜

---

## T5.3 - Reset de Stats
**Passos:**
1. Clicar em "Reset Stats"
2. Pagar custo

**Resultado Esperado:**
- ✓ Spirit Stones deduzidos
- ✓ AP retornado
- ✓ Stats voltam ao base

**Status:** ⬜

---

## T5.4 - Mudança de Realm
**Passos:**
1. Atingir level de threshold (10, 20, etc.)

**Resultado Esperado:**
- ✓ Realm muda (Mortal → Earth → Heaven → Spirit)
- ✓ Visual update

**Status:** ⬜

---

# MÓDULO 6: INVENTÁRIO

## T6.1 - Apanhar Loot
**Passos:**
1. Após combate, aceitar loot

**Resultado Esperado:**
- ✓ Items adicionados ao inventário
- ✓ Stackables empilham (max 99)
- ✓ Gear fica individual

**Status:** ⬜

---

## T6.2 - Equipar Item
**Passos:**
1. Clicar em arma no inventário
2. Clicar "Equip"

**Resultado Esperado:**
- ✓ Item move para slot
- ✓ Stats aplicados
- ✓ Item anterior vai para inventário

**Status:** ⬜

---

## T6.3 - Desequipar Item
**Passos:**
1. Clicar no slot equipado
2. Clicar "Unequip"

**Resultado Esperado:**
- ✓ Item volta ao inventário
- ✓ Stats removidos

**Status:** ⬜

---

## T6.4 - Usar Consumível
**Passos:**
1. Clicar em potion
2. Clicar "Use"

**Resultado Esperado:**
- ✓ HP ou QI restaurado
- ✓ Count reduz
- ✓ Item desaparece se count = 0

**Status:** ⬜

---

## T6.5 - Vender Item a NPC
**Passos:**
1. Falar com vendor NPC
2. Vender item

**Resultado Esperado:**
- ✓ Item removido
- ✓ Spirit Stones recebidos
- ✓ Valor correto baseado em tier/rarity

**Status:** ⬜

---

## T6.6 - Stack Overflow (99)
**Passos:**
1. Ter stack de 99 materiais
2. Apanhar mais do mesmo

**Resultado Esperado:**
- ✓ Novo stack criado
- ✓ Original mantém-se em 99

**Status:** ⬜

---

## T6.7 - Bank System
**Passos:**
1. Mover item para bank
2. Mover de volta

**Resultado Esperado:**
- ✓ Item transfere
- ✓ Espaço separado do inventário

**Status:** ⬜

---

# MÓDULO 7: CRAFTING

## T7.1 - Craftar Arma
**Pré-condições:** Ter materiais necessários
**Passos:**
1. Ir ao Forge
2. Selecionar receita
3. Clicar Craft

**Resultado Esperado:**
- ✓ Materiais consumidos
- ✓ Arma criada (sucesso) OU mensagem de falha
- ✓ Rarity rolada (pode ser higher tier)
- ✓ Stats secundários aplicados

**Status:** ⬜

---

## T7.2 - Falha de Craft + Pity
**Passos:**
1. Craftar várias vezes até falhar
2. Continuar até pity garantir sucesso

**Resultado Esperado:**
- ✓ Pity counter incrementa em falhas
- ✓ Após X falhas, próximo é garantido

**Status:** ⬜

---

## T7.3 - Reforging
**Pré-condições:** Ter item craftado
**Passos:**
1. Selecionar item para reforge
2. Usar materiais de upgrade
3. Confirmar

**Resultado Esperado:**
- ✓ Chance de upgrade de rarity
- ✓ Stats podem mudar
- ✓ Pity system funciona

**Status:** ⬜

---

## T7.4 - Salvage
**Passos:**
1. Selecionar item para salvar
2. Confirmar salvage

**Resultado Esperado:**
- ✓ Item destruído
- ✓ Parte dos materiais recuperados
- ✓ Quantidade baseada em rarity

**Status:** ⬜

---

## T7.5 - Repair
**Pré-condições:** Item com durabilidade baixa
**Passos:**
1. Ir ao repair
2. Pagar custo
3. Reparar

**Resultado Esperado:**
- ✓ Durabilidade restaurada
- ✓ Spirit Stones deduzidos

**Status:** ⬜

---

# MÓDULO 8: QUESTS

## T8.1 - Aceitar Quest de NPC
**Passos:**
1. Ir a zona com NPC
2. Falar com NPC
3. Aceitar quest

**Resultado Esperado:**
- ✓ Quest adicionada ao log
- ✓ Objectives visíveis
- ✓ Tracker atualiza

**Status:** ⬜

---

## T8.2 - Completar Objetivos
**Passos:**
1. Executar ação do objetivo (kill mobs, etc.)

**Resultado Esperado:**
- ✓ Progress incrementa
- ✓ Objetivo marca como completo quando atingido

**Status:** ⬜

---

## T8.3 - Entregar Quest
**Passos:**
1. Voltar ao NPC com quest completa
2. Entregar

**Resultado Esperado:**
- ✓ Rewards recebidos (EXP, items, stones)
- ✓ Quest move para completed
- ✓ Follow-up quest disponível (se existir)

**Status:** ⬜

---

## T8.4 - Abandonar Quest
**Passos:**
1. No quest log, abandonar quest

**Resultado Esperado:**
- ✓ Quest removida
- ✓ Pode re-aceitar depois

**Status:** ⬜

---

## T8.5 - Daily Quest Reset
**Passos:**
1. Completar daily quest
2. Esperar reset diário

**Resultado Esperado:**
- ✓ Quest disponível novamente
- ✓ Contadores resetados

**Status:** ⬜

---

# MÓDULO 9: BESTIARY

## T9.1 - Descobrir Novo Mob
**Passos:**
1. Matar mob pela primeira vez

**Resultado Esperado:**
- ✓ Mob aparece no bestiary
- ✓ Reward de discovery disponível

**Status:** ⬜

---

## T9.2 - Milestone Rewards
**Passos:**
1. Matar 10, 50, 100, etc. do mesmo mob
2. Claim reward

**Resultado Esperado:**
- ✓ Reward correto
- ✓ Não pode claim duas vezes

**Status:** ⬜

---

## T9.3 - Realm Mastery
**Passos:**
1. Matar todos os mobs de um realm
2. Claim mastery reward

**Resultado Esperado:**
- ✓ Título desbloqueado
- ✓ Bónus permanente

**Status:** ⬜

---

# MÓDULO 10: ACHIEVEMENTS

## T10.1 - Achievement Unlock
**Passos:**
1. Completar condição de achievement

**Resultado Esperado:**
- ✓ Achievement desbloqueia
- ✓ Notificação
- ✓ Reward claim disponível

**Status:** ⬜

---

## T10.2 - Claim Reward
**Passos:**
1. Ir a achievements
2. Claim reward de achievement completo

**Resultado Esperado:**
- ✓ Reward recebido
- ✓ Marcado como claimed

**Status:** ⬜

---

# MÓDULO 11: CULTIVATION

## T11.1 - Daily Login Reward
**Passos:**
1. Fazer login num novo dia

**Resultado Esperado:**
- ✓ Day counter incrementa
- ✓ Reward disponível
- ✓ Pode claim imediatamente

**Status:** ⬜

---

## T11.2 - Milestone Reward
**Passos:**
1. Atingir milestone (level, kills, etc.)
2. Claim na página cultivation

**Resultado Esperado:**
- ✓ Reward correto
- ✓ Não pode re-claim

**Status:** ⬜

---

## T11.3 - 28-Day Cycle
**Passos:**
1. Completar 28 dias de login

**Resultado Esperado:**
- ✓ Mega reward no dia 28
- ✓ Ciclo reinicia (ou mantém)

**Status:** ⬜

---

# MÓDULO 12: MARKET

## T12.1 - Listar Item para Venda
**Passos:**
1. Ir ao Market
2. Selecionar item
3. Definir preço
4. Confirmar listing

**Resultado Esperado:**
- ✓ Item removido do inventário
- ✓ Listing aparece no market
- ✓ Expira em 7 dias

**Status:** ⬜

---

## T12.2 - Comprar Item
**Pré-condições:** Ter spirit stones suficientes
**Passos:**
1. Encontrar listing
2. Clicar Buy
3. Confirmar

**Resultado Esperado:**
- ✓ Stones deduzidos
- ✓ Item recebido
- ✓ Vendedor recebe stones
- ✓ Listing removida

**Status:** ⬜

---

## T12.3 - Cancelar Listing
**Passos:**
1. Ir às minhas listings
2. Cancelar uma

**Resultado Esperado:**
- ✓ Item volta ao inventário
- ✓ Listing removida

**Status:** ⬜

---

## T12.4 - Não Comprar Próprio Item
**Passos:**
1. Tentar comprar própria listing

**Resultado Esperado:**
- ✓ Erro "Cannot buy own listing"

**Status:** ⬜

---

## T12.5 - Saldo Insuficiente
**Passos:**
1. Tentar comprar item mais caro que saldo

**Resultado Esperado:**
- ✓ Erro "Insufficient stones"

**Status:** ⬜

---

# MÓDULO 13: CHAT

## T13.1 - Enviar Mensagem Global
**Passos:**
1. Abrir chat
2. Escrever no canal Global
3. Enviar

**Resultado Esperado:**
- ✓ Mensagem aparece
- ✓ Outros jogadores vêem

**Status:** ⬜

---

## T13.2 - Canais Diferentes
**Passos:**
1. Mudar para Trade, Help, etc.

**Resultado Esperado:**
- ✓ Mensagens filtradas por canal

**Status:** ⬜

---

# MÓDULO 14: ADMIN

## T14.1 - Acesso Admin Panel
**Pré-condições:** Ter role 'admin' ou 'owner'
**Passos:**
1. Fazer login
2. Verificar que botão Admin aparece
3. Abrir Admin Panel

**Resultado Esperado:**
- ✓ Painel abre
- ✓ Stats e controlos visíveis

**Status:** ⬜

---

## T14.2 - Iniciar Evento
**Passos:**
1. No Admin Panel, selecionar evento preset
2. Clicar para ativar

**Resultado Esperado:**
- ✓ Evento ativo
- ✓ Multipliers aplicados
- ✓ Banner aparece para jogadores

**Status:** ⬜

---

## T14.3 - Terminar Evento
**Passos:**
1. Clicar "End Event"

**Resultado Esperado:**
- ✓ Multipliers voltam a 1.0
- ✓ Banner desaparece

**Status:** ⬜

---

## T14.4 - Ban Player
**Passos:**
1. Procurar player
2. Clicar Ban
3. Inserir razão

**Resultado Esperado:**
- ✓ `is_banned = true` na DB
- ✓ Log criado em cheat_log
- ✓ Player não consegue jogar

**Status:** ⬜

---

## T14.5 - Unban Player
**Passos:**
1. Procurar player banido
2. Clicar Unban

**Resultado Esperado:**
- ✓ Ban removido
- ✓ Player pode jogar

**Status:** ⬜

---

# MÓDULO 15: ANTI-CHEAT

## T15.1 - Stats Overflow Blocked
**Passos (requer manipulação direta na DB):**
1. Tentar UPDATE com stats acima do permitido

**Resultado Esperado:**
- ✓ Trigger bloqueia
- ✓ Error: "CHEAT DETECTED"
- ✓ Log em cheat_log

**Status:** ⬜

---

## T15.2 - Level Jump Blocked
**Passos:**
1. Tentar subir mais de 5 níveis de uma vez

**Resultado Esperado:**
- ✓ Bloqueado
- ✓ Logged

**Status:** ⬜

---

## T15.3 - Spirit Stones Overflow
**Passos:**
1. Tentar ganhar >10000 stones num sync

**Resultado Esperado:**
- ✓ Bloqueado
- ✓ Logged

**Status:** ⬜

---

## T15.4 - Auto-Ban após 3 Tentativas
**Passos:**
1. Trigger 3 cheat attempts

**Resultado Esperado:**
- ✓ Conta banida automaticamente
- ✓ Razão: "Auto-ban: Multiple cheat attempts"

**Status:** ⬜

---

# MÓDULO 16: CLOUD SAVE

## T16.1 - Save Automático
**Passos:**
1. Jogar por alguns minutos
2. Verificar que saves acontecem

**Resultado Esperado:**
- ✓ `updated_at` atualizado periodicamente
- ✓ Dados consistentes

**Status:** ⬜

---

## T16.2 - Load em Novo Device
**Passos:**
1. Fazer logout
2. Login noutro browser/device

**Resultado Esperado:**
- ✓ Personagem carrega corretamente
- ✓ Todos os dados intactos

**Status:** ⬜

---

## T16.3 - Conflict Resolution
**Passos:**
1. Jogar em dois dispositivos simultaneamente

**Resultado Esperado:**
- ✓ Último save ganha
- ✓ Sem corrupção de dados

**Status:** ⬜

---

# MÓDULO 17: PERFORMANCE

## T17.1 - Load Time
**Passos:**
1. Medir tempo de initial load

**Resultado Esperado:**
- ✓ < 3 segundos em boa conexão

**Status:** ⬜

---

## T17.2 - Combat Smoothness
**Passos:**
1. Combater por 10 minutos

**Resultado Esperado:**
- ✓ Sem stuttering
- ✓ VFX não causam lag

**Status:** ⬜

---

## T17.3 - Memory Leak
**Passos:**
1. Jogar por 30+ minutos
2. Monitorar memória do browser

**Resultado Esperado:**
- ✓ Memória estável
- ✓ Sem crescimento contínuo

**Status:** ⬜

---

# MÓDULO 18: MOBILE/RESPONSIVO

## T18.1 - Layout Mobile
**Passos:**
1. Abrir em smartphone (ou DevTools mobile view)

**Resultado Esperado:**
- ✓ Layout adapta
- ✓ Todos os botões acessíveis
- ✓ Texto legível

**Status:** ⬜

---

## T18.2 - Touch Controls
**Passos:**
1. Jogar em dispositivo touch

**Resultado Esperado:**
- ✓ Taps funcionam
- ✓ Scroll suave
- ✓ Sem hover issues

**Status:** ⬜

---

## T18.3 - Orientação
**Passos:**
1. Rodar dispositivo

**Resultado Esperado:**
- ✓ Layout ajusta
- ✓ Sem elementos cortados

**Status:** ⬜

---

# RESUMO DE TESTES

| Módulo | Total | Passou | Falhou | Pendente |
|--------|-------|--------|--------|----------|
| Autenticação | 5 | ⬜ | ⬜ | 5 |
| Criação | 4 | ⬜ | ⬜ | 4 |
| Tutorial | 2 | ⬜ | ⬜ | 2 |
| Combate | 11 | ⬜ | ⬜ | 11 |
| Progressão | 4 | ⬜ | ⬜ | 4 |
| Inventário | 7 | ⬜ | ⬜ | 7 |
| Crafting | 5 | ⬜ | ⬜ | 5 |
| Quests | 5 | ⬜ | ⬜ | 5 |
| Bestiary | 3 | ⬜ | ⬜ | 3 |
| Achievements | 2 | ⬜ | ⬜ | 2 |
| Cultivation | 3 | ⬜ | ⬜ | 3 |
| Market | 5 | ⬜ | ⬜ | 5 |
| Chat | 2 | ⬜ | ⬜ | 2 |
| Admin | 5 | ⬜ | ⬜ | 5 |
| Anti-Cheat | 4 | ⬜ | ⬜ | 4 |
| Cloud Save | 3 | ⬜ | ⬜ | 3 |
| Performance | 3 | ⬜ | ⬜ | 3 |
| Mobile | 3 | ⬜ | ⬜ | 3 |
| **TOTAL** | **76** | **0** | **0** | **76** |

---

*Documento gerado em Janeiro 2026*
*Para usar: Copiar este documento e preencher o Status de cada teste*
