# ⚔️ Combat System Improvement Plan
## 凌云道 (Língyún Dào) - Path Above the Clouds

**Objetivo:** Transformar o combate de "passivo e aborrecido" para "envolvente e satisfatório"
**Contexto:** Jogo text-based/UI-based (não 2D/3D), foco em decisões táticas e feedback visual

---

## 📊 Estado Atual vs Objetivo

| Aspecto | Atual | Objetivo |
|---------|-------|----------|
| Interatividade | 10% (auto-attack) | 70% (decisões constantes) |
| Feedback Visual | 20% (texto log) | 85% (animações UI) |
| Profundidade Tática | 15% (spam skills) | 75% (combos, timing) |
| Tensão/Emoção | 10% (zero risco) | 80% (momentos críticos) |
| Satisfação | 20% (repetitivo) | 90% (rewarding) |

---

## 🎯 Pilares da Melhoria

### Pilar 1: AGÊNCIA - O jogador decide
### Pilar 2: FEEDBACK - Cada ação tem impacto visível
### Pilar 3: TENSÃO - Risco e recompensa
### Pilar 4: PROGRESSÃO - Sempre a evoluir

---

# 📋 FASE 1: Quick Wins (1-3 dias)

## 1.1 Feedback Visual Imediato

### Damage Numbers Melhorados
```typescript
// Tipos de damage number com estilos diferentes
interface DamageNumber {
  value: number;
  type: 'normal' | 'crit' | 'dot' | 'heal' | 'shield' | 'block' | 'dodge';
  element?: 'fire' | 'ice' | 'wood' | 'lightning' | 'void';
  position: { x: number; y: number };
}

// Estilos por tipo
const DAMAGE_STYLES = {
  normal: 'text-white text-lg',
  crit: 'text-yellow-400 text-2xl font-bold animate-bounce',
  dot: 'text-purple-400 text-sm italic',
  heal: 'text-green-400 text-lg',
  shield: 'text-cyan-400 text-lg',
  block: 'text-gray-400 text-sm',
  dodge: 'text-blue-400 text-lg italic', // "MISS!"
};

// Cores por elemento
const ELEMENT_COLORS = {
  fire: 'text-orange-500 drop-shadow-[0_0_10px_#f97316]',
  ice: 'text-cyan-400 drop-shadow-[0_0_10px_#22d3ee]',
  wood: 'text-green-500 drop-shadow-[0_0_10px_#22c55e]',
  lightning: 'text-purple-400 drop-shadow-[0_0_10px_#a855f7]',
  void: 'text-gray-300 drop-shadow-[0_0_10px_#d1d5db]',
};
```

### Element Advantage Popup
```typescript
// Mostrar quando há vantagem elemental
{elementAdvantage > 1 && (
  <div className="absolute top-0 left-1/2 -translate-x-1/2 animate-bounce">
    <span className="text-yellow-400 font-bold text-sm">
      ⚡ SUPER EFFECTIVE! (+{Math.round((elementAdvantage - 1) * 100)}%)
    </span>
  </div>
)}

{elementAdvantage < 1 && (
  <div className="absolute top-0 left-1/2 -translate-x-1/2">
    <span className="text-gray-500 text-sm">
      ❌ Not very effective...
    </span>
  </div>
)}
```

### Screen Effects
```typescript
// Screen shake on big hits
const triggerScreenShake = (intensity: 'light' | 'medium' | 'heavy') => {
  const shakeClass = {
    light: 'animate-shake-light',
    medium: 'animate-shake-medium', 
    heavy: 'animate-shake-heavy',
  }[intensity];
  
  document.getElementById('combat-arena')?.classList.add(shakeClass);
  setTimeout(() => {
    document.getElementById('combat-arena')?.classList.remove(shakeClass);
  }, 300);
};

// Border flash on crits
const triggerCritFlash = () => {
  document.getElementById('combat-arena')?.classList.add('border-yellow-400', 'shadow-yellow-400/50');
  setTimeout(() => {
    document.getElementById('combat-arena')?.classList.remove('border-yellow-400', 'shadow-yellow-400/50');
  }, 200);
};
```

### CSS Animations para Combat
```css
@keyframes shake-light {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

@keyframes shake-medium {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px) rotate(-1deg); }
  75% { transform: translateX(5px) rotate(1deg); }
}

@keyframes shake-heavy {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-10px) rotate(-2deg); }
  40% { transform: translateX(10px) rotate(2deg); }
  60% { transform: translateX(-8px) rotate(-1deg); }
  80% { transform: translateX(8px) rotate(1deg); }
}

@keyframes damage-float {
  0% { opacity: 1; transform: translateY(0) scale(1); }
  50% { opacity: 1; transform: translateY(-30px) scale(1.2); }
  100% { opacity: 0; transform: translateY(-60px) scale(0.8); }
}

@keyframes crit-explode {
  0% { transform: scale(1); }
  50% { transform: scale(1.5); text-shadow: 0 0 20px gold; }
  100% { transform: scale(1); }
}
```

## 1.2 Passive Trigger Visibility

### Floating Passive Icons
```typescript
// Quando passive activa, mostrar ícone flutuante
const showPassiveTrigger = (passiveName: string, icon: string) => {
  addCombatLog(`✨ ${passiveName} activated!`, 'passive');
  
  // Mostrar ícone flutuante no avatar do player
  setFloatingEffects(prev => [...prev, {
    id: Date.now(),
    type: 'passive',
    text: passiveName,
    icon: icon,
  }]);
};

// UI Component
{floatingEffects.map(effect => (
  <div 
    key={effect.id}
    className="absolute -top-8 left-1/2 -translate-x-1/2 animate-float-up pointer-events-none"
  >
    <div className="bg-purple-900/80 border border-purple-500 rounded-lg px-2 py-1 flex items-center gap-1">
      <span>{effect.icon}</span>
      <span className="text-xs text-purple-300">{effect.text}</span>
    </div>
  </div>
))}
```

## 1.3 Combat Log Melhorado

### Log com Categorias e Cores
```typescript
type LogType = 'player_attack' | 'player_skill' | 'player_passive' | 
               'enemy_attack' | 'enemy_skill' | 
               'damage' | 'heal' | 'buff' | 'debuff' | 
               'crit' | 'dodge' | 'block' | 'death' | 'system';

const LOG_STYLES: Record<LogType, string> = {
  player_attack: 'text-blue-300 border-l-2 border-blue-500 pl-2',
  player_skill: 'text-cyan-300 border-l-2 border-cyan-500 pl-2 font-medium',
  player_passive: 'text-purple-300 border-l-2 border-purple-500 pl-2 italic',
  enemy_attack: 'text-red-300 border-l-2 border-red-500 pl-2',
  enemy_skill: 'text-orange-300 border-l-2 border-orange-500 pl-2 font-medium',
  damage: 'text-red-400',
  heal: 'text-green-400',
  buff: 'text-yellow-400',
  debuff: 'text-purple-400',
  crit: 'text-yellow-400 font-bold bg-yellow-900/20',
  dodge: 'text-blue-400 italic',
  block: 'text-gray-400',
  death: 'text-red-500 font-bold text-center bg-red-900/30 py-1',
  system: 'text-gray-500 text-center italic',
};
```

---

# 📋 FASE 2: Sistema de Combos (3-5 dias)

## 2.1 Definição de Combos

```typescript
// src/data/comboSystem.ts

interface SkillCombo {
  id: string;
  name: string;
  description: string;
  sequence: number[]; // Skill IDs in order
  timeWindow: number; // Milliseconds to complete
  bonusEffect: ComboEffect;
  visualEffect: string; // Animation class
}

interface ComboEffect {
  type: 'damage_multiplier' | 'bonus_damage' | 'apply_debuff' | 'heal' | 'qi_refund';
  value: number;
  element?: string;
}

const SKILL_COMBOS: SkillCombo[] = [
  // === CRIMSON BLADE COMBOS ===
  {
    id: 'inferno_chain',
    name: 'Inferno Chain',
    description: 'Fire Slash → Flame Burst = Explosion!',
    sequence: [1, 2], // Fire Slash, Flame Burst
    timeWindow: 4000,
    bonusEffect: { type: 'damage_multiplier', value: 1.5, element: 'fire' },
    visualEffect: 'combo-fire-explosion',
  },
  {
    id: 'phoenix_ascension',
    name: 'Phoenix Ascension',
    description: 'Flame Burst → Phoenix Strike → Inferno = Rebirth!',
    sequence: [2, 3, 4],
    timeWindow: 6000,
    bonusEffect: { type: 'heal', value: 0.2 }, // 20% HP heal
    visualEffect: 'combo-phoenix',
  },
  
  // === AZURE TEMPEST COMBOS ===
  {
    id: 'frozen_prison',
    name: 'Frozen Prison',
    description: 'Ice Shard → Blizzard = Deep Freeze!',
    sequence: [5, 6],
    timeWindow: 4000,
    bonusEffect: { type: 'apply_debuff', value: 3 }, // 3s stun
    visualEffect: 'combo-ice-prison',
  },
  
  // === UNIVERSAL COMBOS (any class) ===
  {
    id: 'meditation_strike',
    name: 'Focused Strike',
    description: 'Meditate → Any Attack = Empowered!',
    sequence: [-1, 0], // -1 = Meditate, 0 = any attack
    timeWindow: 5000,
    bonusEffect: { type: 'damage_multiplier', value: 2.0 },
    visualEffect: 'combo-focused',
  },
];
```

## 2.2 Combo Tracker UI

```typescript
// Component: ComboTracker.tsx

const ComboTracker: React.FC<{ currentCombo: ComboProgress | null }> = ({ currentCombo }) => {
  if (!currentCombo) return null;
  
  const combo = SKILL_COMBOS.find(c => c.id === currentCombo.comboId);
  if (!combo) return null;
  
  const progress = currentCombo.currentStep / combo.sequence.length;
  const timeLeft = Math.max(0, combo.timeWindow - (Date.now() - currentCombo.startTime));
  
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 border border-amber-500/50 rounded-lg px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="text-amber-400 font-bold">{combo.name}</span>
        <div className="flex gap-1">
          {combo.sequence.map((_, i) => (
            <div 
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < currentCombo.currentStep 
                  ? 'bg-amber-500' 
                  : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>
      <div className="h-1 bg-gray-700 rounded-full mt-1 overflow-hidden">
        <div 
          className="h-full bg-amber-500 transition-all duration-100"
          style={{ width: `${(timeLeft / combo.timeWindow) * 100}%` }}
        />
      </div>
    </div>
  );
};
```

## 2.3 Combo Completion Effect

```typescript
// Quando combo completa
const completeCombo = (combo: SkillCombo) => {
  // Mostrar popup dramático
  setComboComplete({
    name: combo.name,
    description: combo.description,
  });
  
  // Aplicar efeito
  applyComboEffect(combo.bonusEffect);
  
  // Screen effect
  triggerScreenShake('heavy');
  document.getElementById('combat-arena')?.classList.add(combo.visualEffect);
  
  // Som (quando implementarmos)
  playSound('combo_complete');
  
  // Combat log
  addCombatLog(`💥 COMBO: ${combo.name}!`, 'crit');
  
  // Limpar após animação
  setTimeout(() => {
    setComboComplete(null);
    document.getElementById('combat-arena')?.classList.remove(combo.visualEffect);
  }, 1500);
};
```

---

# 📋 FASE 3: Sistema de Defesa Ativa (3-5 dias)

## 3.1 Botões de Block/Dodge

```typescript
interface DefenseAction {
  type: 'block' | 'dodge' | 'counter';
  cooldown: number;
  duration: number;
  effect: string;
}

const DEFENSE_ACTIONS: Record<string, DefenseAction> = {
  block: {
    type: 'block',
    cooldown: 5000, // 5 segundos
    duration: 2000, // Activo por 2s
    effect: '50% damage reduction',
  },
  dodge: {
    type: 'dodge',
    cooldown: 8000,
    duration: 1500, // Window mais curto
    effect: '100% evasion for next attack',
  },
  counter: {
    type: 'counter',
    cooldown: 12000,
    duration: 1000, // Timing muito preciso
    effect: 'Reflect 150% damage if hit',
  },
};
```

## 3.2 UI dos Botões de Defesa

```tsx
const DefenseButtons: React.FC = () => {
  const [blockCooldown, setBlockCooldown] = useState(0);
  const [dodgeCooldown, setDodgeCooldown] = useState(0);
  const [counterCooldown, setCounterCooldown] = useState(0);
  const [activeDefense, setActiveDefense] = useState<string | null>(null);
  
  return (
    <div className="flex gap-2 justify-center my-2">
      {/* Block Button */}
      <button
        onClick={() => activateDefense('block')}
        disabled={blockCooldown > 0 || activeDefense !== null}
        className={`
          relative px-4 py-2 rounded-lg font-bold transition-all
          ${activeDefense === 'block' 
            ? 'bg-cyan-500 text-white animate-pulse' 
            : blockCooldown > 0 
              ? 'bg-gray-700 text-gray-500'
              : 'bg-cyan-900 text-cyan-300 hover:bg-cyan-800'
          }
        `}
      >
        🛡️ Block
        {blockCooldown > 0 && (
          <span className="absolute -top-1 -right-1 bg-gray-800 text-xs px-1 rounded">
            {Math.ceil(blockCooldown / 1000)}s
          </span>
        )}
      </button>
      
      {/* Dodge Button */}
      <button
        onClick={() => activateDefense('dodge')}
        disabled={dodgeCooldown > 0 || activeDefense !== null}
        className={`
          relative px-4 py-2 rounded-lg font-bold transition-all
          ${activeDefense === 'dodge'
            ? 'bg-blue-500 text-white animate-pulse'
            : dodgeCooldown > 0
              ? 'bg-gray-700 text-gray-500'
              : 'bg-blue-900 text-blue-300 hover:bg-blue-800'
          }
        `}
      >
        💨 Dodge
        {dodgeCooldown > 0 && (
          <span className="absolute -top-1 -right-1 bg-gray-800 text-xs px-1 rounded">
            {Math.ceil(dodgeCooldown / 1000)}s
          </span>
        )}
      </button>
      
      {/* Counter Button */}
      <button
        onClick={() => activateDefense('counter')}
        disabled={counterCooldown > 0 || activeDefense !== null}
        className={`
          relative px-4 py-2 rounded-lg font-bold transition-all
          ${activeDefense === 'counter'
            ? 'bg-red-500 text-white animate-pulse'
            : counterCooldown > 0
              ? 'bg-gray-700 text-gray-500'
              : 'bg-red-900 text-red-300 hover:bg-red-800'
          }
        `}
      >
        ⚔️ Counter
        {counterCooldown > 0 && (
          <span className="absolute -top-1 -right-1 bg-gray-800 text-xs px-1 rounded">
            {Math.ceil(counterCooldown / 1000)}s
          </span>
        )}
      </button>
    </div>
  );
};
```

## 3.3 Integração no Combat Loop

```typescript
// No combat tick, antes de aplicar dano ao player:
const processCombatTick = () => {
  // ... mob attack calculation ...
  
  let finalDamage = mobDamage;
  
  // Check active defense
  if (activeDefense === 'block') {
    finalDamage = Math.floor(finalDamage * 0.5);
    addCombatLog(`🛡️ Blocked! Damage reduced to ${finalDamage}`, 'block');
    setActiveDefense(null);
  } 
  else if (activeDefense === 'dodge') {
    finalDamage = 0;
    addCombatLog(`💨 Dodged! Attack completely avoided!`, 'dodge');
    setActiveDefense(null);
  }
  else if (activeDefense === 'counter') {
    finalDamage = 0;
    const counterDamage = Math.floor(mobDamage * 1.5);
    dealDamageToMob(counterDamage);
    addCombatLog(`⚔️ Countered! Reflected ${counterDamage} damage!`, 'crit');
    setActiveDefense(null);
  }
  
  // Apply remaining damage
  if (finalDamage > 0) {
    applyDamageToPlayer(finalDamage);
  }
};
```

---

# 📋 FASE 4: Enemy Patterns & Tells (5-7 dias)

## 4.1 Sistema de Ataques Especiais

```typescript
// src/data/enemyPatterns.ts

interface EnemySpecialAttack {
  id: string;
  name: string;
  description: string;
  warningMessage: string;
  warningDuration: number; // Tempo de aviso antes do ataque
  damageMultiplier: number;
  effect?: 'stun' | 'bleed' | 'burn' | 'freeze' | 'knockback';
  effectDuration?: number;
  cooldown: number; // Turnos entre usos
  visual: string; // CSS class for animation
}

const ENEMY_SPECIAL_ATTACKS: Record<string, EnemySpecialAttack[]> = {
  // Wolves
  'gray_wolf': [
    {
      id: 'pack_howl',
      name: 'Pack Howl',
      description: 'Calls for reinforcements',
      warningMessage: 'The wolf raises its head to howl!',
      warningDuration: 2000,
      damageMultiplier: 0, // No damage, summons ally
      cooldown: 10,
      visual: 'enemy-howl',
    },
  ],
  
  // Tigers
  'jade_tiger': [
    {
      id: 'pounce',
      name: 'Savage Pounce',
      description: 'Leaps at target for massive damage',
      warningMessage: '⚠️ The tiger crouches, preparing to pounce!',
      warningDuration: 2500,
      damageMultiplier: 2.5,
      effect: 'stun',
      effectDuration: 1,
      cooldown: 6,
      visual: 'enemy-pounce',
    },
  ],
  
  // Bosses
  'azure_dragon': [
    {
      id: 'dragon_breath',
      name: 'Azure Dragon Breath',
      description: 'Devastating AoE attack',
      warningMessage: '🔥 The dragon inhales deeply... TAKE COVER!',
      warningDuration: 3000,
      damageMultiplier: 4.0,
      effect: 'burn',
      effectDuration: 3,
      cooldown: 8,
      visual: 'enemy-dragon-breath',
    },
    {
      id: 'tail_sweep',
      name: 'Tail Sweep',
      description: 'Knockback attack',
      warningMessage: '⚠️ The dragon swings its massive tail!',
      warningDuration: 1500,
      damageMultiplier: 1.5,
      effect: 'knockback',
      cooldown: 4,
      visual: 'enemy-tail-sweep',
    },
  ],
};
```

## 4.2 Warning UI Component

```tsx
const EnemyWarning: React.FC<{ warning: WarningState | null }> = ({ warning }) => {
  if (!warning) return null;
  
  const timeLeft = Math.max(0, warning.duration - (Date.now() - warning.startTime));
  const progress = timeLeft / warning.duration;
  
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {/* Overlay pulsante */}
      <div className="absolute inset-0 bg-red-900/30 animate-pulse" />
      
      {/* Warning Card */}
      <div className="bg-black/90 border-2 border-red-500 rounded-xl px-6 py-4 animate-bounce">
        <div className="flex items-center gap-3">
          <span className="text-4xl">⚠️</span>
          <div>
            <p className="text-red-400 font-bold text-lg">{warning.attackName}</p>
            <p className="text-white text-sm">{warning.message}</p>
          </div>
        </div>
        
        {/* Timer bar */}
        <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-red-500 transition-all duration-100"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        
        <p className="text-center text-yellow-400 text-xs mt-2 animate-pulse">
          Use DODGE or BLOCK to defend!
        </p>
      </div>
    </div>
  );
};
```

## 4.3 Enemy Attack Patterns

```typescript
// Diferentes padrões de comportamento
interface EnemyAI {
  type: 'aggressive' | 'defensive' | 'tactical' | 'berserk';
  attackPattern: number[]; // Sequência de ataques (0 = normal, 1+ = special)
  enrageThreshold: number; // % HP para enrage
  enrageBonus: number; // Multiplicador quando enraged
}

const ENEMY_AI_PATTERNS: Record<string, EnemyAI> = {
  aggressive: {
    type: 'aggressive',
    attackPattern: [0, 0, 1, 0, 0, 1], // Special every 3rd attack
    enrageThreshold: 0.3,
    enrageBonus: 1.5,
  },
  defensive: {
    type: 'defensive',
    attackPattern: [0, 0, 0, 0, 1], // Rare specials
    enrageThreshold: 0.2,
    enrageBonus: 1.3,
  },
  tactical: {
    type: 'tactical',
    attackPattern: [0, 1, 0, 1, 0, 2], // Mix of specials
    enrageThreshold: 0.4,
    enrageBonus: 1.2,
  },
  berserk: {
    type: 'berserk',
    attackPattern: [0, 1, 1, 0, 1, 1], // Frequent specials
    enrageThreshold: 0.5,
    enrageBonus: 2.0,
  },
};
```

---

# 📋 FASE 5: Boss Fights (7-10 dias)

## 5.1 Multi-Phase Bosses

```typescript
interface BossPhase {
  id: number;
  name: string;
  hpThreshold: number; // Activa quando HP < X%
  abilities: string[]; // Special attacks available
  statModifiers: {
    attack: number;
    defense: number;
    speed: number;
  };
  music?: string; // Track específico
  dialogue?: string; // O que diz ao entrar na fase
  visual: string; // CSS class para arena
}

interface Boss {
  id: string;
  name: string;
  title: string;
  phases: BossPhase[];
  enrageTimer: number; // Segundos até enrage
  mechanics: BossMechanic[];
}

const BOSSES: Boss[] = [
  {
    id: 'elder_wolf_king',
    name: 'Elder Wolf King',
    title: 'Alpha of the Mountain Pack',
    phases: [
      {
        id: 1,
        name: 'The Hunt Begins',
        hpThreshold: 1.0,
        abilities: ['pack_howl', 'savage_bite'],
        statModifiers: { attack: 1.0, defense: 1.0, speed: 1.0 },
        dialogue: '"You dare enter my territory, mortal?"',
        visual: 'boss-phase-1',
      },
      {
        id: 2,
        name: 'Desperate Fury',
        hpThreshold: 0.5,
        abilities: ['pack_howl', 'savage_bite', 'frenzy'],
        statModifiers: { attack: 1.3, defense: 0.8, speed: 1.5 },
        dialogue: '"You will regret this... AWOOOO!"',
        visual: 'boss-phase-2',
      },
      {
        id: 3,
        name: 'Last Stand',
        hpThreshold: 0.2,
        abilities: ['savage_bite', 'frenzy', 'death_grip'],
        statModifiers: { attack: 2.0, defense: 0.5, speed: 2.0 },
        dialogue: '"I... will not... fall!"',
        visual: 'boss-phase-3-berserk',
      },
    ],
    enrageTimer: 180, // 3 minutos
    mechanics: ['dodge_pounce', 'interrupt_howl'],
  },
];
```

## 5.2 Boss Mechanics

```typescript
interface BossMechanic {
  id: string;
  name: string;
  description: string;
  type: 'dodge' | 'interrupt' | 'collect' | 'position' | 'dps_check';
  failurePenalty: string;
  successReward?: string;
}

const BOSS_MECHANICS: Record<string, BossMechanic> = {
  dodge_pounce: {
    id: 'dodge_pounce',
    name: 'Dodge the Pounce',
    description: 'When boss prepares to pounce, use DODGE within 2 seconds',
    type: 'dodge',
    failurePenalty: 'Take 300% damage and get stunned for 3s',
    successReward: 'Boss is vulnerable for 2s (50% more damage)',
  },
  interrupt_howl: {
    id: 'interrupt_howl',
    name: 'Silence the Howl',
    description: 'Use a skill during the howl to interrupt it',
    type: 'interrupt',
    failurePenalty: 'Wolf King summons 2 wolf adds',
    successReward: 'Wolf King is disoriented, -30% attack for 5s',
  },
};
```

## 5.3 Enrage Timer UI

```tsx
const EnrageTimer: React.FC<{ timeRemaining: number; isEnraged: boolean }> = ({ 
  timeRemaining, 
  isEnraged 
}) => {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const isLow = timeRemaining < 30;
  
  if (isEnraged) {
    return (
      <div className="bg-red-900/80 border border-red-500 rounded-lg px-4 py-2 animate-pulse">
        <p className="text-red-400 font-bold text-center">
          ☠️ ENRAGED ☠️
        </p>
        <p className="text-red-300 text-xs text-center">
          Boss deals 200% damage!
        </p>
      </div>
    );
  }
  
  return (
    <div className={`
      rounded-lg px-4 py-2 
      ${isLow ? 'bg-red-900/50 border border-red-500 animate-pulse' : 'bg-gray-900/50 border border-gray-700'}
    `}>
      <p className="text-xs text-gray-400">Enrage in:</p>
      <p className={`text-2xl font-mono font-bold ${isLow ? 'text-red-400' : 'text-white'}`}>
        {minutes}:{seconds.toString().padStart(2, '0')}
      </p>
    </div>
  );
};
```

---

# 📋 FASE 6: Qi Management & Timing (3-5 dias)

## 6.1 Qi Pressure System

```typescript
// Novo sistema de Qi regeneration
const QI_REGEN_RATES = {
  idle: 2.0,     // 2% per second fora de combate
  combat: 0.3,   // 0.3% per second em combate
  meditation: 5.0, // 5% per second a meditar (mas vulnerável)
};

// Meditate action
const handleMeditate = () => {
  if (isMeditating) {
    // Cancel meditation
    setIsMeditating(false);
    addCombatLog('You break your meditation stance.', 'system');
  } else {
    // Start meditation - vulnerable but regen Qi fast
    setIsMeditating(true);
    addCombatLog('You enter a meditation stance... (+500% Qi regen, but take 50% more damage)', 'system');
  }
};
```

## 6.2 Perfect Timing Bonus

```typescript
// Skill timing window for bonus damage
interface SkillTiming {
  earlyWindow: number;   // ms before optimal
  optimalWindow: number; // ms range for perfect
  lateWindow: number;    // ms after optimal
}

const calculateTimingBonus = (timeSinceAvailable: number): { multiplier: number; rating: string } => {
  // Skill just came off cooldown
  if (timeSinceAvailable < 200) {
    return { multiplier: 1.3, rating: 'PERFECT!' }; // +30% damage
  }
  if (timeSinceAvailable < 500) {
    return { multiplier: 1.15, rating: 'Great!' }; // +15% damage
  }
  if (timeSinceAvailable < 1000) {
    return { multiplier: 1.05, rating: 'Good' }; // +5% damage
  }
  return { multiplier: 1.0, rating: '' }; // Normal
};
```

---

# 📋 FASE 7: Sound Effects (3-5 dias)

## 7.1 Combat Sounds

```typescript
// src/data/sounds.ts

const COMBAT_SOUNDS = {
  // Player attacks
  player_hit_light: '/sounds/hit_light.mp3',
  player_hit_heavy: '/sounds/hit_heavy.mp3',
  player_crit: '/sounds/crit.mp3',
  player_miss: '/sounds/whoosh.mp3',
  
  // Player skills (by element)
  skill_fire: '/sounds/fire_burst.mp3',
  skill_ice: '/sounds/ice_shatter.mp3',
  skill_wood: '/sounds/nature_growth.mp3',
  skill_lightning: '/sounds/thunder.mp3',
  skill_void: '/sounds/void_pulse.mp3',
  
  // Defense
  block: '/sounds/shield_block.mp3',
  dodge: '/sounds/dodge_wind.mp3',
  counter: '/sounds/counter_strike.mp3',
  
  // Enemy
  enemy_hit: '/sounds/enemy_hit.mp3',
  enemy_die: '/sounds/enemy_death.mp3',
  enemy_special_warning: '/sounds/warning_bell.mp3',
  
  // Combos
  combo_start: '/sounds/combo_ding.mp3',
  combo_complete: '/sounds/combo_explosion.mp3',
  
  // UI
  level_up: '/sounds/level_up_fanfare.mp3',
  loot_drop: '/sounds/loot_sparkle.mp3',
  quest_complete: '/sounds/quest_complete.mp3',
  
  // Boss
  boss_phase_change: '/sounds/boss_roar.mp3',
  boss_enrage: '/sounds/enrage_drums.mp3',
};
```

---

# 📊 Resumo do Roadmap

| Fase | Funcionalidade | Esforço | Impacto |
|------|----------------|---------|---------|
| 1 | Feedback Visual | 1-3 dias | ⭐⭐⭐⭐⭐ |
| 2 | Sistema de Combos | 3-5 dias | ⭐⭐⭐⭐ |
| 3 | Defesa Ativa | 3-5 dias | ⭐⭐⭐⭐⭐ |
| 4 | Enemy Patterns | 5-7 dias | ⭐⭐⭐⭐ |
| 5 | Boss Fights | 7-10 dias | ⭐⭐⭐⭐⭐ |
| 6 | Qi Management | 3-5 dias | ⭐⭐⭐ |
| 7 | Sound Effects | 3-5 dias | ⭐⭐⭐⭐ |

**Total estimado:** 25-40 dias de desenvolvimento

---

# 🎯 Prioridade de Implementação

## Sprint 1 (Semana 1-2): "Make it Feel Good"
- [ ] Damage numbers coloridos por elemento
- [ ] Screen shake em hits grandes
- [ ] Element advantage popup
- [ ] Passive trigger icons
- [ ] Combat log com cores

## Sprint 2 (Semana 3): "Give Players Control"  
- [ ] Botões Block/Dodge/Counter
- [ ] Meditation stance
- [ ] Defense timing feedback

## Sprint 3 (Semana 4-5): "Add Depth"
- [ ] Sistema de combos (5 combos iniciais)
- [ ] Combo tracker UI
- [ ] Combo rewards

## Sprint 4 (Semana 6-7): "Challenging Enemies"
- [ ] Enemy special attacks (10 tipos)
- [ ] Warning system
- [ ] AI patterns

## Sprint 5 (Semana 8-10): "Epic Moments"
- [ ] 3 bosses com fases
- [ ] Boss mechanics
- [ ] Enrage timer
- [ ] Victory celebrations

---

*Este plano transforma o combate de "watch numbers go down" para "active tactical gameplay"*
