# Plano de Balanceamento - Level Up & Stats Scaling

> **Status:** ✅ Implementado (Fases 1-3 Completas)
> **Prioridade:** CRÍTICA
> **Data:** 27 Janeiro 2026
> **Versão:** 2.0 - Balanceamento Justo Player vs Monster

---

## 📋 Filosofia de Design

### Princípio Base
**Um jogador nível X com gear adequado deve conseguir matar um monstro nível X num combate 1v1 equilibrado.**

- Low-level grind permanece **relevante** (não se torna trivial)
- Monstros do mesmo nível são **desafio justo** (não pushovers)
- Gear e skills fazem **diferença real** no outcome
- End-game permanece **challenging**

---

## 📋 Problema Identificado

Actualmente, quando os jogadores sobem de nível, apenas ganham AP (Attribute Points) para distribuir manualmente. Isto causa:
1. Jogadores ficam "underpowered" se não alocarem AP correctamente
2. Não há scaling automático de HP/QI com o nível
3. Monstros de níveis mais altos tornam-se impossíveis de matar
4. Sem party system, jogadores solo precisam de balanceamento cuidadoso

---

## 🎯 Solução Proposta

### 1. Base Stats Auto-Scaling por Nível

Cada level up concede automaticamente:

| Stat | Scaling Base | Por Classe (Multiplicador) |
|------|-------------|---------------------------|
| **HP** | +12/level | Warrior: 1.3x, Tank: 1.5x, Mage: 0.8x |
| **QI** | +6/level | Mage: 1.4x, Healer: 1.3x, Warrior: 0.7x |
| **Base STR** | +1/3 levels | Warrior: +1/2 levels |
| **Base DEX** | +1/3 levels | Assassin: +1/2 levels |
| **Base CON** | +1/4 levels | Tank: +1/2 levels |
| **Base SPI** | +1/4 levels | Mage: +1/2 levels |
| **Base WIL** | +1/4 levels | Healer: +1/2 levels |

### 2. Tabela de Scaling por Classe

```typescript
const CLASS_LEVEL_SCALING = {
  // Warrior Classes
  'Sword Cultivator': { hp: 1.3, qi: 0.8, str: 1.5, dex: 1.0, con: 1.2, spi: 0.7, wil: 0.8 },
  'Blade Dancer': { hp: 1.1, qi: 0.9, str: 1.3, dex: 1.4, con: 0.9, spi: 0.8, wil: 0.9 },
  
  // Tank Classes
  'Iron Body': { hp: 1.5, qi: 0.7, str: 1.0, dex: 0.7, con: 1.6, spi: 0.8, wil: 1.0 },
  'Mountain Palm': { hp: 1.4, qi: 0.8, str: 1.2, dex: 0.8, con: 1.4, spi: 0.9, wil: 1.0 },
  
  // Mage Classes  
  'Flame Arts': { hp: 0.8, qi: 1.4, str: 0.6, dex: 0.8, con: 0.7, spi: 1.5, wil: 1.2 },
  'Thunder Path': { hp: 0.9, qi: 1.3, str: 0.7, dex: 1.0, con: 0.8, spi: 1.4, wil: 1.1 },
  
  // Assassin Classes
  'Shadow Step': { hp: 0.9, qi: 1.0, str: 1.1, dex: 1.6, con: 0.8, spi: 0.9, wil: 0.9 },
  'Poison Fang': { hp: 1.0, qi: 1.1, str: 1.0, dex: 1.4, con: 0.9, spi: 1.0, wil: 1.0 },
  
  // Healer Classes
  'Life Weaver': { hp: 1.1, qi: 1.3, str: 0.6, dex: 0.7, con: 1.0, spi: 1.2, wil: 1.4 },
  'Spirit Mender': { hp: 1.0, qi: 1.4, str: 0.7, dex: 0.8, con: 0.9, spi: 1.3, wil: 1.3 },
  
  // Hybrid Classes
  'Wanderer': { hp: 1.1, qi: 1.0, str: 1.0, dex: 1.1, con: 1.0, spi: 1.0, wil: 1.0 },
  'Default': { hp: 1.0, qi: 1.0, str: 1.0, dex: 1.0, con: 1.0, spi: 1.0, wil: 1.0 },
};
```

### 3. Fórmula de HP/QI Máximo

```typescript
// HP calculation
const calculateMaxHP = (level: number, con: number, classMultiplier: number) => {
  const baseHP = 100;
  const hpPerLevel = 15 * classMultiplier;
  const hpPerCon = 5;
  return Math.floor(baseHP + (level * hpPerLevel) + (con * hpPerCon));
};

// QI calculation  
const calculateMaxQI = (level: number, spi: number, classMultiplier: number) => {
  const baseQI = 50;
  const qiPerLevel = 8 * classMultiplier;
  const qiPerSpi = 3;
  return Math.floor(baseQI + (level * qiPerLevel) + (spi * qiPerSpi));
};
```

### 4. Exemplo de Progressão (Sword Cultivator)

| Level | HP Base | HP Total | QI Total | STR | DEX | CON | SPI | WIL |
|-------|---------|----------|----------|-----|-----|-----|-----|-----|
| 1 | 100 | 120 | 55 | 12 | 10 | 11 | 8 | 9 |
| 5 | 100 | 218 | 87 | 14 | 10 | 12 | 8 | 9 |
| 10 | 100 | 315 | 119 | 16 | 11 | 13 | 9 | 10 |
| 15 | 100 | 413 | 151 | 18 | 12 | 14 | 10 | 10 |
| 20 | 100 | 510 | 183 | 20 | 13 | 15 | 11 | 11 |
| 25 | 100 | 608 | 215 | 22 | 14 | 16 | 12 | 12 |
| 29 | 100 | 686 | 241 | 23 | 14 | 17 | 12 | 13 |

> **Nota:** Level cap actual é **29**

---

## ⚔️ Balanceamento Player vs Monster (1v1 Justo)

### Filosofia de Combat Balance

O objectivo é que **Player Nível X** vs **Monster Nível X** resulte em:
- **Sem gear:** Player ganha com ~30-40% HP restante
- **Com gear adequado:** Player ganha com ~50-60% HP restante  
- **Com gear excelente:** Player ganha com ~70-80% HP restante
- **Sem gear contra +2 níveis:** Combate muito difícil, possível morte

### Fórmula de Balanceamento Base

```typescript
// Monster stats ESCALAM com o player
const calculateMonsterStats = (monsterLevel: number, isBoss: boolean) => {
  const bossMultiplier = isBoss ? 2.5 : 1.0;
  
  return {
    hp: Math.floor((80 + (monsterLevel * 10)) * bossMultiplier),
    damage: Math.floor((8 + (monsterLevel * 1.5)) * bossMultiplier),
    defense: Math.floor(2 + (monsterLevel * 0.4)),
  };
};

// Player base stats (sem gear, sem AP allocation)
const calculatePlayerBaseStats = (level: number, classMultipliers: ClassScaling) => {
  return {
    hp: Math.floor(100 + (level * 12 * classMultipliers.hp)),
    damage: Math.floor(10 + (level * 1.2)),  // Base damage from level
    defense: Math.floor(2 + (level * 0.3)),
  };
};
```

### Tabela Comparativa Player vs Monster (Mesmo Nível)

| Level | Player HP (base) | Monster HP | Player DMG | Monster DMG | Resultado Esperado |
|-------|------------------|------------|------------|-------------|-------------------|
| 1 | 112 | 90 | 11 | 10 | Player ganha (~40% HP) |
| 5 | 160 | 130 | 16 | 16 | Player ganha (~35% HP) |
| 10 | 220 | 180 | 22 | 23 | Player ganha (~30% HP) |
| 15 | 280 | 230 | 28 | 31 | Combate apertado |
| 20 | 340 | 280 | 34 | 38 | Gear faz diferença |
| 25 | 400 | 330 | 40 | 46 | Gear essencial |
| 30 | 460 | 380 | 46 | 53 | End-game challenge |

### Importância do Gear

O gear adiciona **margem de segurança**:

| Gear Tier | HP Bonus | DMG Bonus | DEF Bonus | Vantagem |
|-----------|----------|-----------|-----------|----------|
| Common | +5% | +5% | +2 | Mínima |
| Uncommon | +10% | +10% | +4 | Noticeable |
| Rare | +20% | +20% | +8 | Confortável |
| Epic | +35% | +35% | +15 | Strong |
| Legendary | +50% | +50% | +25 | Dominante |

### Penalty por Diferença de Nível

```typescript
const getLevelDiffPenalty = (playerLevel: number, monsterLevel: number) => {
  const diff = monsterLevel - playerLevel;
  
  if (diff <= -5) return { playerDmgMod: 1.0, monsterDmgMod: 0.5, expMod: 0.2 };  // Trivial
  if (diff <= -3) return { playerDmgMod: 1.0, monsterDmgMod: 0.7, expMod: 0.5 };  // Easy
  if (diff <= 0) return { playerDmgMod: 1.0, monsterDmgMod: 1.0, expMod: 1.0 };   // Fair
  if (diff <= 2) return { playerDmgMod: 0.9, monsterDmgMod: 1.2, expMod: 1.3 };   // Hard
  if (diff <= 4) return { playerDmgMod: 0.8, monsterDmgMod: 1.5, expMod: 1.5 };   // Very Hard
  return { playerDmgMod: 0.6, monsterDmgMod: 2.0, expMod: 2.0 };                  // Deadly (5+ above)
};
```

---

## 🏔️ Low-Level Grind Relevance

### O Problema de Power Creep
Se os players escalarem muito rápido, os monstros low-level tornam-se irrelevantes.

### Soluções Implementadas:

1. **Scaling Moderado:** +12 HP/level (não +15), mantendo combates relevantes
2. **EXP Penalty:** Monstros 5+ níveis abaixo dão apenas 20% EXP
3. **Drop Penalty:** Loot reduzido de monstros muito fracos
4. **Áreas Level-Locked:** Algumas zonas requerem nível mínimo

### Tabela de EXP/Drop por Diferença de Nível

| Diferença | EXP Ganho | Drop Rate | Combat Feel |
|-----------|-----------|-----------|-------------|
| +5 acima | 200% | 150% | Deadly |
| +3 acima | 150% | 130% | Very Hard |
| +1 acima | 120% | 110% | Hard |
| Mesmo nível | 100% | 100% | Fair |
| -1 abaixo | 90% | 90% | Easy |
| -3 abaixo | 60% | 60% | Trivial |
| -5 abaixo | 20% | 30% | Waste of time |

---

## 📊 Sistema de Dificuldade

### Métricas de Combat

```typescript
const calculateCombatViability = (player, monster) => {
  // Damage per turn estimation
  const playerDamagePerTurn = calculatePlayerDamage(player);
  const monsterDamagePerTurn = calculateMonsterDamage(monster);
  
  // Turns to kill
  const turnsToKillMonster = Math.ceil(monster.hp / playerDamagePerTurn);
  const turnsToKillPlayer = Math.ceil(player.maxHp / monsterDamagePerTurn);
  
  // Viability ratio (should be > 1.2 for comfortable solo)
  return turnsToKillPlayer / turnsToKillMonster;
};
```

### Indicadores Visuais na UI

- 🟢 **Easy:** Viability > 2.0
- 🟡 **Normal:** Viability 1.2-2.0
- 🟠 **Hard:** Viability 0.8-1.2
- 🔴 **Very Hard:** Viability < 0.8
- ☠️ **Deadly:** Viability < 0.5

---

## 🔧 Implementação

### Fase 1: Base Stats Scaling (Prioridade Alta) ✅
- [x] Criar `levelScaling.ts` com tabelas de scaling
- [x] Modificar level up handler para aplicar stat increases
- [x] Actualizar `calculateMaxHP` e `calculateMaxQI`
- [x] Testar com classes diferentes
- [x] Adicionar migração para saves existentes

### Fase 2: Monster Rebalancing ✅
- [x] Adicionar indicador de dificuldade na UI (Easy/Normal/Hard/Very Hard/Deadly)
- [ ] Auditar todos os monstros por tier
- [ ] Ajustar HP/Damage para viabilidade solo

### Fase 3: Drop Rate Optimization ✅
- [x] Implementar level-based drop rate modifiers
- [x] Implementar level-based EXP modifiers
- [x] Prevenir farming excessivo de low-level monsters
- [x] Adicionar mensagens de aviso quando rewards são reduzidos

### Fase 4: Testing
- [ ] Criar personagem novo de cada classe
- [ ] Testar progressão 1→29
- [ ] Validar que cada tier é "passável"
- [ ] Ajustar valores conforme necessário

---

## 📝 Notas de Implementação

### Compatibilidade com Saves Existentes

Os jogadores existentes precisam de receber os stats que "faltam" baseado no seu nível actual:

```typescript
const migratePlayerStats = (player) => {
  const expectedStats = calculateExpectedStats(player.level, player.class);
  
  // Add missing HP/QI
  const missingHP = expectedStats.maxHp - player.maxHp;
  const missingQI = expectedStats.maxQi - player.maxQi;
  
  return {
    ...player,
    maxHp: player.maxHp + Math.max(0, missingHP),
    maxQi: player.maxQi + Math.max(0, missingQI),
    // Also recalculate base stats if needed
  };
};
```

---

**Aprovado por:** [Aguardando]
**Data de Implementação:** [A definir]
