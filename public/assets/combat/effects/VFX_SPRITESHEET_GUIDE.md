# 🔥 VFX SPRITESHEET - Guia de Configuração

## ✅ CONFIGURAÇÃO ATUAL

**Ficheiro:** `vfx_fire_spritesheet.png`  
**Resolução:** 512 × 1536 pixels  
**Frames:** 8 colunas × 24 linhas = 192 frames  
**Tamanho do frame:** 64 × 64 pixels  

---

## 🎮 EFEITOS DISPONÍVEIS (12 tipos)

| Preset | Linha | Uso Recomendado | Cor Original |
|--------|-------|-----------------|--------------|
| `spark_small` | 0-1 | Partículas, startup | 🔥 Laranja |
| `explosion_medium` | 2-3 | Hits normais | 🔥 Laranja |
| `explosion_large` | 4-5 | Crits, kills | 🔥 Laranja |
| `burst_circular` | 6-7 | Ativar skill | 🔥 Laranja |
| `ring_expand` | 8-9 | Buff, shield | 🔥 Laranja |
| `circle_expand` | 10-11 | AOE, heal | 🔥 Laranja |
| `sparkle_star` | 12-13 | Drops raros, level up | 🔥 Laranja |
| `flash_glow` | 14-15 | Block, counter, dodge | 🔥 Laranja |
| `slash_horizontal` | 16-17 | Ataques de Sword | 🔥 Laranja |
| `slash_crescent` | 18-19 | Ataques de Saber | 🔥 Laranja |
| `wave_sonic` | 20-21 | Ataques de Zither | 🔥 Laranja |
| `impact_hit` | 22-23 | Dano genérico | 🔥 Laranja |

---

## 🎨 CORES AUTOMÁTICAS (6 variações)

Com uma única spritesheet, tens 6 cores diferentes via filtros CSS:

| Cor | Filtro CSS | Resultado Visual |
|-----|------------|------------------|
| `fire` | Nenhum (original) | 🔥 Laranja/Vermelho |
| `ice` | hue-rotate(180deg) | ❄️ Azul/Cyan |
| `lightning` | hue-rotate(60deg) | ⚡ Amarelo/Dourado |
| `poison` | hue-rotate(90deg) | ☠️ Verde/Tóxico |
| `void` | hue-rotate(270deg) | 💀 Roxo/Void |
| `heal` | hue-rotate(120deg) | 💚 Verde/Brilhante |

---

## 🎮 COMO USAR NO CÓDIGO

### Básico - Spawnar um efeito:
```tsx
import { useVFXManager } from './components/combat';

// No componente:
const { spawnVFX, VFXLayer } = useVFXManager();

// Quando acontece algo:
spawnVFX('explosion_large', x, y, { 
  scale: 1.5, 
  color: 'fire' 
});

// No render:
<div className="combat-area">
  <VFXLayer />
</div>
```

### Por elemento da classe:
```tsx
// Sword classes (Fire) - ID 1, 5, 9
spawnVFX('slash_horizontal', enemyX, enemyY, { color: 'fire' });

// Ice classes - ID 2, 6
spawnVFX('slash_crescent', enemyX, enemyY, { color: 'ice' });

// Lightning classes - ID 3, 10
spawnVFX('explosion_medium', enemyX, enemyY, { color: 'lightning' });

// Poison/Void classes - ID 4, 11, 12
spawnVFX('impact_hit', enemyX, enemyY, { color: 'void' });

// Wood/Heal classes - ID 7, 8
spawnVFX('circle_expand', playerX, playerY, { color: 'heal' });
```

---

## 🧪 TESTAR OS EFEITOS

Importa o painel de teste:
```tsx
import { VFXTestPanel } from './components/combat/VFXTestPanel';

// Renderiza:
<VFXTestPanel />
```

Isto abre um painel interativo onde podes:
- Clicar para spawnar efeitos
- Mudar a cor
- Ajustar a escala
- Testar todos os 12 tipos

---

## ✅ CHECKLIST

- [x] Spritesheet guardada em `public/assets/combat/effects/vfx_fire_spritesheet.png`
- [x] Configuração correta: 512×1536, 64×64 frames, 8×24 grid
- [x] 12 presets de efeitos configurados
- [x] 6 cores disponíveis via filtros CSS
- [x] VFXTestPanel criado para testes
- [ ] Integrar no combate real (próximo passo)
