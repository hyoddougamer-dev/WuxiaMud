# 🎮 GUIA DE TESTE RÁPIDO - Combat System

## ⚡ TESTE RÁPIDO (5 minutos)

### 1️⃣ Entrar em Combate
- Login/criar personagem
- Escolher classe **Blazing Sword Immortal** (火剑 - Espada de Fogo)
- Entrar numa região e iniciar combate

---

### 2️⃣ Testar COMBOS

#### Combo Simples (Inferno Chain)
1. Click em **Fire Slash** (skill 1)
2. Observar: ComboTracker aparece no topo
3. Rapidamente click em **Flame Burst** (skill 2)
4. 🎉 **RESULTADO**:
   - "✨ COMBO: Inferno Chain" no combat log
   - Celebração visual (3 segundos)
   - Damage com bônus "[COMBO x1.5]"
   - Screen shake mais forte

#### Combo de 2 Skills (Phoenix Ascension)
1. **Flame Burst** → **Phoenix Strike**
2. 🎉 **RESULTADO**:
   - Combo completo
   - **HEAL 20% HP** aplicado
   - "+XX HP!" no combat log

---

### 3️⃣ Testar DEFESAS

#### Block (Q) - Mais Fácil
1. Esperar ataque do inimigo
2. Pressionar **Q** (ou click no botão 🛡️)
3. Botão fica azul e pulsa (ativo por 2s)
4. Inimigo ataca
5. 🎉 **RESULTADO**:
   - "🛡️ Blocked! Damage reduced: 100 → 50"
   - Floating text "BLOCK -50%"
   - Cooldown 5 ticks

#### Dodge (W) - Intermédio
1. Esperar ataque
2. Pressionar **W** (1.5s window)
3. 🎉 **RESULTADO**:
   - "💨 Perfect Dodge! Attack completely avoided!"
   - Zero damage
   - Cooldown 8 ticks

#### Counter (E) - Difícil
1. Esperar ataque
2. Pressionar **E** no **timing exato** (apenas 1s window!)
3. 🎉 **RESULTADO**:
   - "⚔️ Counter Strike! Reflected 150 damage!"
   - Inimigo recebe 150% do dano original
   - Heavy screen shake
   - Cooldown 12 ticks

---

### 4️⃣ Testar VISUAL EFFECTS

#### Element Bursts
1. Usar **Flame Burst** (skill elemental de fogo)
2. 🎉 **Observar**: 
   - Explosão vermelha/laranja no inimigo
   - Subtle border glow
   - Element advantage "+50%" se super effective

#### Screen Shake
- Normal attack = Light shake (2px)
- Skills = Medium shake (5px + rotation)
- Combos/Counter = Heavy shake (10px + rotation)

#### Passive Triggers
1. Passive de classe ativa
2. 🎉 **Observar**:
   - Ícone + nome flutua acima do avatar
   - Drop-shadow sutil
   - Sem backgrounds pesados

---

## 🎯 TESTE COMPLETO (15 minutos)

### Scenario 1: Master Combos
**Objetivo**: Testar todos os tipos de combo

1. **Damage Bonus Combo** (Blazing Sword Immortal):
   - Fire Slash → Flame Burst
   - Verificar: damage aumenta 50%

2. **Heal Combo** (Blazing Sword Immortal):
   - Flame Burst → Phoenix Strike
   - Verificar: HP restaurado

3. **Effect Combo** (Glacial Shadow class):
   - Ice Shard → Blizzard
   - Verificar: Inimigo fica stunned

### Scenario 2: Defense Master
**Objetivo**: Usar todas as 3 defesas num combate

1. Primeiro ataque: **Block** (Q)
2. Segundo ataque: **Dodge** (W)
3. Terceiro ataque: **Counter** (E)
4. Verificar cooldowns funcionam

### Scenario 3: Combo + Defense
**Objetivo**: Combinar táticas

1. Iniciar combo (Fire Slash)
2. Inimigo ataca → usar Block
3. Completar combo (Flame Burst)
4. Verificar: Sobreviveu e aplicou damage bonus

### Scenario 4: Visual Feedback
**Objetivo**: Testar todos os effects

1. Crit hit → Observar: floating number maior, cor dourada
2. Elemental skill → Observar: element burst
3. Passive trigger → Observar: floating icon+text
4. Element advantage → Observar: percentage indicator

---

## ✅ CHECKLIST DE FEATURES

### Combos
- [ ] ComboTracker aparece durante combo
- [ ] Barra de tempo conta down
- [ ] ComboCompleteEffect celebra conclusão
- [ ] Damage bonus aplicado corretamente
- [ ] Heal combos restauram HP
- [ ] Effect combos aplicam stun/freeze
- [ ] Combat log mostra "✨ COMBO"
- [ ] 15+ combos funcionam

### Defesas
- [ ] Block reduz 50% damage
- [ ] Dodge nega 100% damage
- [ ] Counter reflete 150% damage
- [ ] Cooldowns visíveis
- [ ] Botões pulsam quando ativos
- [ ] Expiram se não usados
- [ ] Combat log mostra resultado
- [ ] Hotkeys Q/W/E funcionam

### Visual Effects
- [ ] Screen shake em 3 intensidades
- [ ] Element bursts em 5 elementos
- [ ] Passive triggers flutuam
- [ ] Element advantage mostra %
- [ ] Floating damage numbers
- [ ] Combat log colorido
- [ ] Smooth animations

### Integration
- [ ] Combos + Defesas funcionam juntos
- [ ] Cooldowns tick corretamente
- [ ] Estado limpa ao fim do combate
- [ ] Performance boa (sem lag)
- [ ] Reduced motion mode funciona

---

## 🐛 BUGS A REPORTAR

Se encontrar bugs, reportar com:
1. **Passo-a-passo** para reproduzir
2. **Classe** usada
3. **Skills** envolvidas
4. **Screenshot** (se possível)
5. **Console errors** (F12 → Console)

---

## 💡 DICAS

1. **Combos**: Olhar para o ComboTracker para saber próxima skill
2. **Defesas**: Counter é hard mode - requer timing perfeito
3. **Timing**: Usar Block quando cooldowns altos estão em CD
4. **Combos longos**: Flame Burst → Phoenix Strike → Inferno = 20% heal!
5. **Counter pro**: Esperar pelo ataque forte do inimigo para refletir

---

**Bons testes! 武林至尊 (Wǔlín Zhìzūn) - Supreme Master of Martial Arts!**
