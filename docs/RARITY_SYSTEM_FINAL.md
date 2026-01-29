# Sistema de Raridades - Proposta Final

> **Versão:** 1.0 Final  
> **Data:** Janeiro 2026  
> **Status:** Aguardando Aprovação

---

## 📋 Sumário Executivo

Este documento define o sistema de raridades a implementar no Língyún Dào, incluindo:
- Sistema de 5 níveis de raridade com temática Wuxia
- Balanceamento de stats para todos os tiers
- Sistema de títulos seleccionáveis
- Preparação para futuro Cash Shop não-P2W

### Princípios Base
1. ✅ **Tudo é Tradeable** - Promover economia activa entre jogadores
2. ✅ **Semi-Hardcore** - Progressão requer esforço, mas é acessível
3. ✅ **100% Dropável** - Todos os items obtíveis in-game
4. ✅ **Sem P2W** - Cash Shop focado em conveniência, não poder

---

## 🎨 1. Níveis de Raridade

### Sistema Wuxia Grade (5 Níveis)

| Grade | Nome PT | Cor Hex | CSS Class | Drop Base | Stat Mult |
|-------|---------|---------|-----------|-----------|-----------|
| **Mortal** | Mortal | `#9CA3AF` | `rarity-mortal` | 55% | 1.0x |
| **Earth** | Terra | `#22C55E` | `rarity-earth` | 28% | 1.2x |
| **Heaven** | Celestial | `#3B82F6` | `rarity-heaven` | 12% | 1.45x |
| **Spirit** | Espiritual | `#A855F7` | `rarity-spirit` | 4% | 1.75x |
| **Immortal** | Imortal | `#F59E0B` | `rarity-immortal` | 1% | 2.2x |

### Implementação CSS
```css
.rarity-mortal { 
  color: #9CA3AF; 
  border-color: rgba(156, 163, 175, 0.5);
}
.rarity-earth { 
  color: #22C55E; 
  border-color: rgba(34, 197, 94, 0.5);
  text-shadow: 0 0 8px rgba(34, 197, 94, 0.3);
}
.rarity-heaven { 
  color: #3B82F6; 
  border-color: rgba(59, 130, 246, 0.5);
  text-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
}
.rarity-spirit { 
  color: #A855F7; 
  border-color: rgba(168, 85, 247, 0.5);
  text-shadow: 0 0 12px rgba(168, 85, 247, 0.5);
  animation: pulse-spirit 2s infinite;
}
.rarity-immortal { 
  color: #F59E0B; 
  border-color: rgba(245, 158, 11, 0.6);
  text-shadow: 0 0 15px rgba(245, 158, 11, 0.6);
  animation: glow-immortal 1.5s infinite alternate;
}
```

---

## ⚔️ 2. Stats Base por Tier e Raridade

### 2.1 Armas (Damage)

| Tier | Nível | Mortal | Earth | Heaven | Spirit | Immortal |
|------|-------|--------|-------|--------|--------|----------|
| **T1** | 1-9 | 10-15 | 12-18 | 15-22 | 18-26 | 22-33 |
| **T2** | 10-19 | 30-40 | 36-48 | 44-58 | 53-70 | 66-88 |
| **T3** | 20-29 | 75-95 | 90-114 | 109-138 | 131-166 | 165-209 |
| **T4** | 25-29 | 130-160 | 156-192 | 189-232 | 228-280 | 286-352 |

### 2.2 Acessórios (HP Bonus)

| Tier | Nível | Mortal | Earth | Heaven | Spirit | Immortal |
|------|-------|--------|-------|--------|--------|----------|
| **T1** | 1-9 | +12-18 | +15-22 | +18-26 | +21-32 | +26-40 |
| **T2** | 10-19 | +35-50 | +42-60 | +51-73 | +61-88 | +77-110 |
| **T3** | 20-29 | +90-120 | +108-144 | +131-174 | +158-210 | +198-264 |
| **T4** | 25-29 | +160-200 | +192-240 | +232-290 | +280-350 | +352-440 |

### 2.3 Materiais

Materiais mantêm raridade fixa baseada no tier:
- **T1 Materials:** Sempre Mortal Grade
- **T2 Materials:** Sempre Earth Grade  
- **T3 Materials:** Sempre Heaven Grade
- **T4 Materials:** Sempre Spirit Grade

---

## 🎯 3. Atributos Secundários

### Slots por Raridade
| Raridade | Nº Slots | Descrição |
|----------|----------|-----------|
| Mortal | 0 | Apenas stat base |
| Earth | 1 | 1 atributo aleatório |
| Heaven | 2 | 2 atributos aleatórios |
| Spirit | 3 | 3 atributos aleatórios |
| Immortal | 4 | 4 atributos (1 garantido é tier-max) |

### Pool de Atributos Secundários
| Atributo | Min | Max | Peso |
|----------|-----|-----|------|
| Crit Chance | +2% | +12% | 15% |
| Crit Damage | +8% | +35% | 12% |
| HP Bonus | +15 | +80 | 18% |
| QI Bonus | +10 | +50 | 15% |
| Dodge | +2% | +8% | 10% |
| Block | +3% | +10% | 10% |
| Life Steal | +1% | +6% | 8% |
| QI Regen | +2 | +12/turno | 7% |
| Damage Reduction | +2% | +10% | 5% |

### Geração de Stats
```
Para cada slot de atributo:
1. Roll atributo do pool (weighted random)
2. Roll valor entre min-max
3. Raridades mais altas tendem a valores mais altos:
   - Earth: valor = roll * 0.6-0.8
   - Heaven: valor = roll * 0.7-0.9
   - Spirit: valor = roll * 0.8-1.0
   - Immortal: valor = roll * 0.9-1.0
```

---

## 📊 4. Drop Rates por Zona

### 4.1 Mobs Normais
| Zona/Tier | Mortal | Earth | Heaven | Spirit | Immortal |
|-----------|--------|-------|--------|--------|----------|
| T1 (Lv 1-9) | 75% | 22% | 3% | 0% | 0% |
| T2 (Lv 10-19) | 55% | 32% | 11% | 2% | 0% |
| T3 (Lv 20-29) | 40% | 35% | 18% | 6% | 1% |

### 4.2 Bosses
| Boss Type | Mortal | Earth | Heaven | Spirit | Immortal |
|-----------|--------|-------|--------|--------|----------|
| Mini-Boss | 20% | 40% | 30% | 9% | 1% |
| Zone Boss | 5% | 25% | 40% | 25% | 5% |
| World Boss | 0% | 10% | 35% | 40% | 15% |

### 4.3 Modificadores
- **Kill Streak (10+):** +5% chance de subir 1 tier de raridade
- **First Kill of Day:** +10% para Heaven+
- **Quest Rewards:** Sempre Earth+ garantido

---

## 🔨 5. Crafting & Reforge

### 5.1 Crafting - Raridade Resultante

| Materiais Usados | Mortal | Earth | Heaven | Spirit | Immortal |
|------------------|--------|-------|--------|--------|----------|
| Todos Mortal | 80% | 18% | 2% | 0% | 0% |
| Maioria Earth | 40% | 45% | 13% | 2% | 0% |
| Maioria Heaven | 10% | 35% | 40% | 13% | 2% |
| Maioria Spirit | 0% | 15% | 35% | 40% | 10% |

### 5.2 Reforge - Upgrade de Raridade

| Upgrade | Custo Base | Taxa Sucesso | Fail = |
|---------|------------|--------------|--------|
| Mortal → Earth | 200 💎 | 70% | Mantém |
| Earth → Heaven | 800 💎 | 45% | Mantém |
| Heaven → Spirit | 3.000 💎 | 25% | -1 Tier (20%) |
| Spirit → Immortal | 15.000 💎 | 10% | -1 Tier (30%) |

**Nota:** Falha em Spirit+ pode resultar em downgrade. Isto mantém o valor de drops naturais Immortal.

### 5.3 Salvage (Desmontar)

| Raridade | Materials Obtidos | Spirit Stones |
|----------|-------------------|---------------|
| Mortal | 1x Mortal mat | 5-15 |
| Earth | 2x Mortal + 1x Earth mat | 30-60 |
| Heaven | 2x Earth + 1x Heaven mat | 150-250 |
| Spirit | 2x Heaven + 1x Spirit mat | 500-800 |
| Immortal | 3x Spirit mat + Special | 2.000-3.500 |

---

## 💰 6. Economia & Trading

### 6.1 Valores de Mercado Sugeridos (Spirit Stones)

| Item | Mortal | Earth | Heaven | Spirit | Immortal |
|------|--------|-------|--------|--------|----------|
| T1 Weapon | 30-80 | 150-300 | 800-1.5k | 4k-8k | 20k-40k |
| T2 Weapon | 150-300 | 600-1.2k | 3k-6k | 15k-30k | 80k-150k |
| T3 Weapon | 500-1k | 2k-4k | 10k-20k | 50k-100k | 300k-500k |
| T4 Weapon | 2k-4k | 8k-15k | 40k-80k | 200k-400k | 1M-2M |

### 6.2 Regras de Trading
- ✅ **Todos os items são tradeable**
- ✅ **Sem binding** - Items nunca ficam presos ao jogador
- ✅ **Taxa de transacção:** 5% ao vendedor (gold sink)
- ✅ **Histórico de preços:** 30 dias visível no mercado

---

## 🏆 7. Sistema de Títulos

### 7.1 Funcionamento

Os jogadores podem **escolher** qual título exibir de entre todos os que já desbloquearam.

```
Interface:
[Character Panel] → [Titles] → Lista de títulos com:
  - Nome do título
  - Como foi obtido
  - Data de obtenção
  - Botão "Equipar"
  
Título activo aparece:
  - Abaixo do nome do jogador
  - No chat ao lado do nome
  - No ranking/leaderboard
```

### 7.2 Lista de Títulos Disponíveis

#### Títulos de Combate
| Título | Requisito | Cor |
|--------|-----------|-----|
| Outer Disciple | 1ª kill | Cinzento |
| Inner Disciple | 50 kills | Verde |
| Asura Disciple | 200 kills | Azul |
| Sword Immortal | 500 kills | Roxo |
| Slaughter King | 800 kills | Dourado |
| Beast Slayer | 1º boss kill | Verde |
| Demon Vanquisher | 7 boss kills | Roxo |
| Beast Conqueror | 15 boss kills | Dourado |

#### Títulos de Cultivação
| Título | Requisito | Cor |
|--------|-----------|-----|
| Initiate | Nível 3 | Cinzento |
| Qi Condensation Master | Nível 9 | Verde |
| Foundation Disciple | Nível 10 | Verde |
| Foundation Elder | Nível 19 | Azul |
| Golden Core Cultivator | Nível 20 | Roxo |
| Golden Core Sovereign | Nível 29 | Dourado |

#### Títulos de Exploração
| Título | Requisito | Cor |
|--------|-----------|-----|
| Wanderer | 5 zonas visitadas | Cinzento |
| Explorer | 15 zonas visitadas | Verde |
| Realm Walker | Todas as zonas | Dourado |

#### Títulos de Crafting
| Título | Requisito | Cor |
|--------|-----------|-----|
| Apprentice Smith | 1º craft | Cinzento |
| Master Forger | 50 crafts | Azul |
| Divine Artisan | Craft item Immortal | Dourado |

#### Títulos de Colecção
| Título | Requisito | Cor |
|--------|-----------|-----|
| Treasure Hunter | 100 items colectados | Verde |
| Fortune Seeker | 50.000 💎 ganhos total | Azul |
| Wealthy Cultivator | 200.000 💎 ganhos total | Roxo |

#### Títulos Especiais (Eventos/Secretos)
| Título | Requisito | Cor |
|--------|-----------|-----|
| Resilient | Morrer 10 vezes | Cinzento |
| First of the Realm | Top 1 no ranking (semanal) | Dourado + Glow |
| Sect Founder | Criar uma Guild | Roxo |

### 7.3 Implementação Técnica

```typescript
interface PlayerTitle {
  id: string;
  name: string;
  obtainedAt: Date;
  source: 'achievement' | 'event' | 'special';
}

interface PlayerTitleState {
  unlockedTitles: PlayerTitle[];
  activeTitle: string | null; // ID do título equipado
}

// Exibição
function getDisplayTitle(player: Player): string | null {
  if (!player.titleState.activeTitle) return null;
  const title = player.titleState.unlockedTitles.find(
    t => t.id === player.titleState.activeTitle
  );
  return title?.name || null;
}
```

---

## 🛒 8. Preparação Cash Shop (Futuro)

### 8.1 Filosofia
- **Sem items P2W** - Nada que dê vantagem directa em combat/PvP
- **Sem currencies exclusivas** - Tudo comprável com Spirit Stones in-game
- **Conveniência, não poder** - Acelerar, não ultrapassar

### 8.2 Items Permitidos
| Categoria | Exemplos | Impacto |
|-----------|----------|---------|
| **XP Boosters** | +25% EXP por 1h | Acelera leveling |
| **Inventory Slots** | +10 slots permanentes | Quality of life |
| **Cosmetics** | Skins de armas, auras | Visual only |
| **Pet Skins** | Aparência de pets | Visual only |
| **Name Change** | Mudar nome 1x | Utility |
| **Respec Token** | Reset skill points | Utility |
| **Auto-Loot Pet** | Recolhe drops auto | Conveniência |
| **Storage Expansion** | +20 bank slots | Quality of life |

### 8.3 Items PROIBIDOS
- ❌ Armas/Armaduras exclusivas
- ❌ Stats bonus permanentes
- ❌ Skip de conteúdo (ex: boost para max level)
- ❌ Currency exclusiva não obtível in-game
- ❌ Caixas com items tradeable (inflação)
- ❌ Qualquer vantagem em PvP

### 8.4 Consumíveis de Progressão (Permitidos)
| Item | Efeito | Limitação |
|------|--------|-----------|
| Fortune Pill | +10% drop rate 30min | Max 2/dia |
| Cultivation Elixir | +15% EXP 1h | Max 3/dia |
| Spirit Recovery Pill | Instant HP/QI full | Não funciona em PvP |
| Teleport Scroll | Teleport para cidade | Cooldown 30min |

---

## 📈 9. Plano de Implementação

### Fase 1 - Core (Semana 1-2) ✅ COMPLETA
- [x] Adicionar campo `rarity` a todos os items existentes
- [x] Implementar cores/borders/glows por raridade
- [x] Actualizar UI de inventário e tooltips
- [x] Actualizar drop tables dos mobs

### Fase 2 - Stats (Semana 3) ✅ COMPLETA
- [x] Implementar multiplicadores de stats
- [x] Adicionar geração de atributos secundários
- [x] Actualizar sistema de combat para novos stats

### Fase 3 - Crafting (Semana 4) ✅ COMPLETA
- [x] Actualizar crafting para raridade variável
- [x] Implementar sistema de reforge upgrade
- [x] Adicionar salvage com returns baseados em raridade

### Fase 4 - Economy (Semana 5) ✅ COMPLETA
- [x] Actualizar Market com filtros de raridade
- [x] Implementar taxa de transacção (5% gold sink)
- [x] Adicionar histórico de preços por raridade (gráfico 7 dias)

### Fase 5 - Títulos (Semana 6) ✅ COMPLETA
- [x] Implementar sistema de títulos (24 títulos em 6 categorias)
- [x] Adicionar UI de selecção de título (TitlesModal)
- [x] Integrar títulos no header do jogador
- [x] Sistema de desbloqueio automático por estatísticas
- [x] Tracking de kills, mortes, crafts, zonas visitadas, items colectados

---

## ✅ 10. Checklist de Aprovação

Implementação completa:

- [x] Sistema de 5 raridades (Mortal → Immortal) aprovado
- [x] Multiplicadores de stats equilibrados
- [x] Drop rates - Spirit/Immortal só de Bosses
- [x] Custo de reforge balanceado
- [x] Crafting como foco principal para high-rarity
- [x] Lista de títulos completa e temática
- [x] Regras de Cash Shop futuro definidas
- [x] CSS implementado para cores/efeitos visuais
- [x] Sistema compatível com nomes legacy

---

**Aprovado por:** Bruno  
**Data:** 27 Janeiro 2026

---

*Documento criado para Língyún Dào - Wuxia Cultivation MUD*
