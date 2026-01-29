# 🎮 Combat UI - Recomendações de Melhoria

## 📌 Resumo das Correções Implementadas

### ✅ Já Corrigidos (Esta Sessão)
1. **Equipment Bonus Labels** - Mudado de STR/DEX/CON/SPI/WIL para OXP/WND/GLD/DAO/HRT
2. **Quest Tutorial Validations** - Adicionada função `onSpecialAction()` para validar objectivos especiais
3. **Combat Round Counter** - Corrigido duplicação de rounds (movido fora de callbacks nested)
4. **Forge Materials** - Agora usa `materialId` correctamente
5. **Music Toggle** - Melhorada lógica de unmute

---

## 🎨 Melhorias de UI Recomendadas

### 1. Combat Arena Frame - PRIORIDADE ALTA
**Problema**: Arena muito "flat", falta moldura temática
**Solução**: Adicionar moldura estilo pergaminho/madeira chinesa

```css
/* Adicionar em index.css */
.combat-arena-frame {
  position: relative;
  background: radial-gradient(ellipse at center, rgba(26, 15, 10, 0.9) 0%, rgba(10, 12, 16, 0.95) 100%);
  border: 4px solid transparent;
  border-image: linear-gradient(45deg, #78350f, #fbbf24, #78350f, #fbbf24) 1;
}

.combat-arena-frame::before {
  content: '';
  position: absolute;
  inset: -8px;
  background: url('/assets/ui/frame-corner.svg') no-repeat;
  background-size: 100% 100%;
  pointer-events: none;
}

/* Decoração de cantos chineses */
.wuxia-corner {
  position: absolute;
  width: 48px;
  height: 48px;
  background: url('/assets/ui/corner-ornament.png') no-repeat center;
  background-size: contain;
}
.wuxia-corner.top-left { top: -4px; left: -4px; }
.wuxia-corner.top-right { top: -4px; right: -4px; transform: rotate(90deg); }
.wuxia-corner.bottom-left { bottom: -4px; left: -4px; transform: rotate(-90deg); }
.wuxia-corner.bottom-right { bottom: -4px; right: -4px; transform: rotate(180deg); }
```

**Assets Necessários**:
- `/assets/ui/frame-corner.svg` - Ornamento de canto estilo chinês
- `/assets/ui/corner-ornament.png` - Decoração dourada para cantos

---

### 2. Combat Log Redesign - PRIORIDADE ALTA
**Problema**: Bloco de texto confuso, difícil de seguir
**Solução**: Log com ícones, cores por tipo, timestamps

```tsx
// Novo componente de Combat Log
const COMBAT_LOG_ICONS = {
  attack: '⚔️',
  damage_taken: '💔',
  heal: '💚',
  skill: '✨',
  crit: '💥',
  dodge: '💨',
  block: '🛡️',
  poison: '☠️',
  burn: '🔥',
  freeze: '❄️',
  passive: '⭐',
  buff: '⬆️',
  debuff: '⬇️',
};

// Melhorar formato do log
<div className="flex items-start gap-2 py-1">
  <span className="text-lg flex-shrink-0">{COMBAT_LOG_ICONS[log.icon] || '•'}</span>
  <span className="flex-1 text-xs">{log.text}</span>
  <span className="text-[8px] text-gray-600">{formatTime(log.timestamp)}</span>
</div>
```

---

### 3. Skill Hotbar Enhancement - PRIORIDADE ALTA
**Problema**: Botões pequenos, pouco feedback visual
**Solução**: Botões maiores com bordas estilo selo chinês

```css
/* Novo estilo para skill buttons */
.skill-button {
  width: 64px;
  height: 64px;
  position: relative;
  border: 3px solid;
  border-image: linear-gradient(45deg, #78350f, #fbbf24) 1;
  background: linear-gradient(135deg, rgba(26, 29, 36, 0.9), rgba(10, 12, 16, 0.95));
  border-radius: 8px;
  transition: all 0.2s ease;
}

.skill-button:hover {
  transform: scale(1.1);
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
}

.skill-button.on-cooldown {
  filter: grayscale(0.7);
}

/* Cooldown radial indicator */
.skill-cooldown-radial {
  position: absolute;
  inset: 0;
  background: conic-gradient(
    transparent calc(var(--cooldown-percent) * 1%),
    rgba(0, 0, 0, 0.7) calc(var(--cooldown-percent) * 1%)
  );
  border-radius: 8px;
}

/* Glow when ready */
.skill-button.ready {
  animation: skill-ready-pulse 2s ease-in-out infinite;
}

@keyframes skill-ready-pulse {
  0%, 100% { box-shadow: 0 0 5px rgba(34, 197, 94, 0.3); }
  50% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.8); }
}
```

---

### 4. Floating Damage Numbers - PRIORIDADE MÉDIA
**Problema**: Números desaparecem rápido, pouca diferenciação
**Solução**: Números maiores, trails, ícones de elemento

```css
/* Melhorar floating damage */
.floating-damage {
  font-family: 'Impact', 'Arial Black', sans-serif;
  font-size: 28px;
  text-shadow: 
    0 0 4px currentColor,
    2px 2px 0 rgba(0, 0, 0, 0.8),
    -2px -2px 0 rgba(0, 0, 0, 0.8);
  animation: damage-float 1.5s ease-out forwards;
}

.floating-damage.critical {
  font-size: 40px;
  animation: damage-critical 1.5s ease-out forwards;
}

@keyframes damage-float {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  20% {
    transform: translateY(-20px) scale(1.3);
  }
  100% {
    opacity: 0;
    transform: translateY(-80px) scale(0.8);
  }
}

@keyframes damage-critical {
  0% {
    opacity: 1;
    transform: translateY(0) scale(0.5);
  }
  15% {
    transform: translateY(-10px) scale(1.8);
  }
  30% {
    transform: translateY(-25px) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translateY(-100px) scale(0.6);
  }
}
```

**Cores por Elemento**:
```tsx
const ELEMENT_DAMAGE_COLORS = {
  Fire: '#ff6b35',      // Laranja brilhante
  Ice: '#00d4ff',       // Cyan brilhante
  Lightning: '#e879f9', // Rosa/púrpura
  Wood: '#4ade80',      // Verde
  Void: '#a855f7',      // Púrpura escuro
  Physical: '#f59e0b',  // Âmbar (default)
};
```

---

### 5. Turn Indicator Enhancement - PRIORIDADE MÉDIA
**Problema**: Pouco visível, não destaca bem
**Solução**: Banner mais proeminente no estilo "martial arts"

```tsx
// Novo Turn Indicator
<div className="turn-indicator-banner">
  <div className="turn-indicator-bg">
    {/* Decorações laterais */}
    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-full bg-gradient-to-r from-amber-600/0 to-amber-600/50" />
    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-full bg-gradient-to-l from-amber-600/0 to-amber-600/50" />
    
    {/* Texto principal */}
    <div className="flex items-center gap-4 px-8 py-3">
      <span className="text-3xl">{isPlayerTurn ? '⚔️' : '💢'}</span>
      <span className="text-xl font-bold tracking-widest uppercase text-amber-100">
        {isPlayerTurn ? '汝之回合' : '敵之回合'}
      </span>
      <span className="text-lg font-medium text-amber-200/80">
        {isPlayerTurn ? 'YOUR TURN' : 'ENEMY TURN'}
      </span>
      <span className="text-3xl">{isPlayerTurn ? '⚔️' : '💢'}</span>
    </div>
  </div>
</div>
```

---

### 6. Character Creation Visual - PRIORIDADE BAIXA
**Problema**: Background muito escuro, fora da temática
**Solução**: Reutilizar vídeo do login, adicionar moldura temática

```tsx
// Em CharacterCreation ou App.tsx (gameState === 'character-creation')
<div className="relative min-h-screen overflow-hidden">
  {/* Video Background (igual ao login) */}
  <video 
    autoPlay 
    loop 
    muted 
    className="absolute inset-0 w-full h-full object-cover opacity-30"
  >
    <source src="/assets/videos/wuxia-bg.mp4" type="video/mp4" />
  </video>
  
  {/* Overlay gradient */}
  <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />
  
  {/* Content */}
  <div className="relative z-10 ...">
    {/* Character creation form */}
  </div>
</div>
```

---

## 🎯 Assets para Gerar (AI Image Generation)

### 1. UI Frames e Ornamentos
| Asset | Descrição | Tamanho | Estilo |
|-------|-----------|---------|--------|
| `frame-corner.svg` | Ornamento de canto para molduras | 64x64 | Motivos chineses dourados |
| `corner-ornament.png` | Decoração de canto detalhada | 48x48 | Bronze/ouro antigo |
| `button-frame.png` | Frame para botões | 128x48 | Pergaminho enrolado |
| `panel-bg.png` | Background para painéis | 512x512 | Madeira escura com textura |
| `separator-line.svg` | Linha decorativa | 256x8 | Padrão cloud/wave chinês |

### 2. Combat Effects
| Asset | Descrição | Uso |
|-------|-----------|-----|
| `slash-effect.png` | Trail de espada | Attack animation |
| `hit-sparks.png` | Faíscas de impacto | On hit |
| `element-burst-fire.png` | Burst de fogo | Fire skills |
| `element-burst-ice.png` | Burst de gelo | Ice skills |
| `element-burst-lightning.png` | Burst de relâmpago | Lightning skills |

### 3. Skill Icons (se não existirem)
- Cada classe precisa de 4-6 ícones de skills no estilo Wuxia
- Tamanho: 64x64 PNG com transparência
- Estilo: Tinta chinesa + cores vibrantes do elemento

---

## 📋 Checklist de Implementação

### Fase 1 - Quick Wins (1-2 horas)
- [ ] Aumentar tamanho dos skill buttons para 64x64
- [ ] Adicionar tooltips aos skill buttons
- [ ] Melhorar cores do floating damage por elemento
- [ ] Adicionar ícones ao combat log

### Fase 2 - Visual Polish (2-4 horas)
- [ ] Implementar combat arena frame
- [ ] Redesign do turn indicator
- [ ] Cooldown radial nos skills
- [ ] Screen shake mais suave

### Fase 3 - Full Overhaul (4-8 horas)
- [ ] Character creation visual redesign
- [ ] Novo sistema de floating damage com trails
- [ ] Particle effects por elemento
- [ ] Sound effects (opcional)

---

## 💡 Dicas para Manter Consistência

1. **Paleta de Cores Wuxia**:
   - Dourado principal: `#fbbf24` / `#f59e0b`
   - Bronze/Cobre: `#92400e` / `#78350f`
   - Vermelho auspicioso: `#dc2626` / `#b91c1c`
   - Jade: `#059669` / `#047857`
   - Background: `#0a0c10` / `#12151c`

2. **Fontes**:
   - Títulos: Serif ou Brush Script chinês
   - Body: Sans-serif clean para legibilidade

3. **Evitar "AI Slop"**:
   - Usar gradientes subtis em vez de cores sólidas
   - Bordas com transparência gradual
   - Animações suaves (ease-out, cubic-bezier)
   - Evitar excesso de glow/brilho

4. **Mobile First**:
   - Skill buttons acessíveis em touch
   - Combat log scrollável com momentum
   - Floating damage visível em ecrãs pequenos
