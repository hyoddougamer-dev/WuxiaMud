# ⚖️ WuxiaMUD - Análise de Balanceamento Drop vs Craft

**Data:** 19 Janeiro 2026  
**Versão:** v25

---

## 📊 Sistema Atual (Problema Identificado)

### Taxas de Drop Atuais

| Fonte | Gear Rate | Material Rate | Problema |
|-------|-----------|---------------|----------|
| Mob Normal | 2% | 10-15% | OK |
| Boss/Elite | **35%** | 25% | **MUITO ALTO** |
| Pity Bonus | +0.5%/kill | - | OK |
| Pity Max | 100% após 100 kills | - | OK |

### 🔴 Problema: Bosses dão gear demais

Com **35% drop rate** em bosses:
- A cada 3 bosses = ~1 gear drop
- Bosses aparecem a cada ~5-10 combates em zonas corretas
- **Tempo para full T4 Legendary (3 slots):** ~20-30 horas
- **Meta original:** 70+ horas

---

## 🎯 Proposta de Rebalanceamento

### Opção A: Reduzir Boss Drop Rate (Recomendado)

```
ANTES: 35% boss, 2% normal
DEPOIS: 15% boss, 2% normal (mesmo assim 7.5x melhor que normal)
```

| Métrica | Antes | Depois |
|---------|-------|--------|
| Kills/Drop (Boss) | ~3 | ~7 |
| Kills/Drop (Normal) | ~50 | ~50 |
| Tempo para T4 drop | ~4h | ~10h |
| Tempo total BiS | ~25h | ~50h |

### Opção B: Adicionar Tier Lock aos Drops

```
Mobs só dropam gear do SEU tier (não acima)
- Lv 1-9 mobs: Drop T1 apenas
- Lv 10-14: Drop T1-T2
- Lv 15-19: Drop T1-T3
- Lv 20+: Drop T1-T4
```

### Opção C: Separar Drop de Gear por Slot

```
- Weapon: 1% normal, 10% boss (class-specific, mais raro)
- Ring: 0.5% normal, 5% boss
- Necklace: 0.5% normal, 5% boss
- Total: 2% normal, 20% boss (distribuído)
```

---

## 📈 Cálculo de Tempo para BiS

### Cenário: Jogador Eficiente

**Assumptions:**
- 3 combates/minuto
- 50% bosses (farm eficiente em zonas certas)
- 60% success rate médio em craft
- Pity system ativo

### Caminho DROP (sem craft)

| Slot | Drop Rate (Boss) | Esperado Kills | Tempo |
|------|------------------|----------------|-------|
| T4 Weapon | 15% | ~47 bosses | ~2h |
| T4 Ring | 5% | ~140 kills | ~1h |
| T4 Necklace | 5% | ~140 kills | ~1h |
| Upgrade Common→Legendary | ~20 reforges | ~15h |
| **Total** | | | **~19h** |

### Caminho CRAFT (drop materials)

| Slot | Mat Drops Needed | Kills para Mats | Craft Attempts | Tempo |
|------|------------------|-----------------|----------------|-------|
| T4 Weapon | ~60 mats | ~400 kills | ~5 crafts | ~6h |
| T4 Ring | ~24 mats | ~160 kills | ~3 crafts | ~3h |
| T4 Necklace | ~24 mats | ~160 kills | ~3 crafts | ~3h |
| Upgrade Common→Legendary | ~20 reforges | | ~15h |
| **Total** | | | | **~27h** |

### Caminho HÍBRIDO (Optimal)

```
Drops T1-T2 early → Craft T3-T4 → Reforge para Legendary
```

| Fase | Actividade | Tempo |
|------|------------|-------|
| 1 | Farm T1-T2 (drops diretos) | 2h |
| 2 | Farm T2 mats para craft T2 | 3h |
| 3 | Farm T3 mats + bosses | 8h |
| 4 | Craft T4 weapons | 10h |
| 5 | Reforge tudo para Legendary | 15h |
| **Total** | | **~38h** |

---

## 🛠️ Mudanças Recomendadas

### 1. Reduzir Boss Drop Rate

```typescript
// ANTES (App.tsx linha 554)
const baseGearRate = isBoss ? 0.35 : 0.02;

// DEPOIS
const baseGearRate = isBoss ? 0.12 : 0.02; // 12% boss, 2% normal
```

### 2. Adicionar Tier Check aos Drops

```typescript
// Gear só dropa no tier apropriado para o mob level
const mobTier = Math.ceil(mob.level / 7.5);
const potentialDrops = itemDatabase.filter(i => 
  i.tier === mobTier && 
  i.type !== 'consumable'
);
```

### 3. Aumentar Custo de Crafting T4

```typescript
// Aumentar quantidade de materiais para T4
costs: [
  { materialId: 'MAT_T4_001', quantity: 35 }, // era 20
  { materialId: 'MAT_T4_002', quantity: 20 }, // era 10
  { materialId: 'MAT_SP_001', quantity: 5 },  // era 2
  { materialId: 'MAT_SP_003', quantity: 1 },  // mantém
],
spiritStones: 80000, // era 50000
```

### 4. Reduzir Success Rate Base T4

```typescript
// T4 Weapon crafting
successRate: 50, // era 60
rarityTable: {
  Common: 40,    // era 30
  Uncommon: 35,  // mantém
  Rare: 18,      // era 25
  Epic: 6,       // era 9
  Legendary: 1,  // mantém
},
```

### 5. Aumentar Custo de Reforge Epic→Legendary

```typescript
// Reforge para Legendary mais caro
{
  id: 'REFORGE_EPIC_LEG',
  name: 'Reforge: Epic → Legendary',
  costs: [
    { materialId: 'MAT_SP_001', quantity: 50 }, // era 30
    { materialId: 'MAT_SP_002', quantity: 5 },  // era 3
  ],
  spiritStones: 150000, // era 100000
  successRate: 15,       // era 20
  onFailure: 'destroy',
}
```

---

## 📋 Resumo das Mudanças

| Parâmetro | Antes | Depois | Impacto |
|-----------|-------|--------|---------|
| Boss Gear Rate | 35% | 12% | -66% drops |
| T4 Craft Mats | 20+10+2+1 | 35+20+5+1 | +75% grind |
| T4 Craft Success | 60% | 50% | +40% tentativas |
| T4 Craft Stones | 50k | 80k | +60% custo |
| Reforge Epic→Leg Cost | 30+3 | 50+5 | +67% mats |
| Reforge Epic→Leg Rate | 20% | 15% | -25% success |

### Tempo Estimado para BiS (Após Mudanças)

| Via | Antes | Depois |
|-----|-------|--------|
| Drop Only | ~25h | ~45h |
| Craft Only | ~30h | ~50h |
| Híbrido | ~38h | **~60-70h** ✅ |

---

## ✅ Implementação Prioritária

1. **CRITICAL:** Reduzir boss drop rate 35% → 12%
2. **HIGH:** Aumentar custos T4 crafting
3. **MEDIUM:** Adicionar tier lock aos drops
4. **LOW:** Ajustar reforge costs

---

## ✅ IMPLEMENTADO (19 Jan 2026)

Todas as mudanças foram aplicadas com sucesso:

| Ficheiro | Mudança |
|----------|---------|
| `App.tsx` L554 | Boss drop: 35% → **12%** |
| `craftingSystem.ts` | T4 Weapon: 20+10+2+1 mats → **35+20+5+1** |
| `craftingSystem.ts` | T4 Weapon: 60% → **50%** success |
| `craftingSystem.ts` | T4 Weapon: 50k → **80k** stones |
| `craftingSystem.ts` | T4 Ring: 15+8+1 mats → **25+15+2** |
| `craftingSystem.ts` | T4 Ring: 65% → **55%** success |
| `craftingSystem.ts` | T4 Necklace: 15+8+1 mats → **25+15+2** |
| `craftingSystem.ts` | T4 Necklace: 65% → **55%** success |
| `craftingSystem.ts` | Epic→Leg: 30+3 mats → **50+5** |
| `craftingSystem.ts` | Epic→Leg: 20% → **15%** success |
| `craftingSystem.ts` | Epic→Leg: 100k → **150k** stones |

**Tempo Estimado para BiS: ~60-70 horas** ✅
