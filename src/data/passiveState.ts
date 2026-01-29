// ============================================
// PASSIVE STATE TRACKING
// Tracks passive cooldowns, stacks, and triggers
// Integrated with buff/debuff system
// ============================================

import type { Effect } from './buffDebuffEngine';

export interface PassiveState {
  classId: number;
  passiveName: string;
  
  // Cooldowns (in seconds)
  cooldown: number;
  maxCooldown: number;
  
  // Stacks (for mechanics like poison stacks)
  stacks: number;
  maxStacks: number;
  
  // Tracking flags
  lastTrigger: number; // timestamp
  isActive: boolean;
  
  // Buffs/Debuffs
  activeBuff?: {
    name: string;
    type: 'damage' | 'defense' | 'speed' | 'freeze' | 'poison' | 'lifesteal';
    value: number;
    duration: number; // seconds
  };
  
  // Effects that passive can trigger
  triggeredEffect?: Effect;
}

// Map of passive states per player
export const playerPassiveStates: Map<number, PassiveState> = new Map();

// Initialize passive state for a class
export const initPassiveState = (classId: number, passiveName: string): PassiveState => {
  return {
    classId,
    passiveName,
    cooldown: 0,
    maxCooldown: 0,
    stacks: 0,
    maxStacks: 0,
    lastTrigger: Date.now(),
    isActive: false,
  };
};

// Check if passive cooldown is ready
export const isPassiveReady = (state: PassiveState): boolean => {
  return state.cooldown <= 0;
};

// Reduce cooldown by delta (called every combat tick)
export const reduceCooldown = (state: PassiveState, deltaSeconds: number): void => {
  state.cooldown = Math.max(0, state.cooldown - deltaSeconds);
};

// Add stack to passive
export const addStack = (state: PassiveState, amount: number = 1): void => {
  state.stacks = Math.min(state.maxStacks, state.stacks + amount);
};

// Consume stacks (e.g., for burst effects)
export const consumeStacks = (state: PassiveState, amount: number = 1): number => {
  const consumed = Math.min(amount, state.stacks);
  state.stacks -= consumed;
  return consumed;
};

// Trigger passive ability
export const triggerPassive = (state: PassiveState, cooldown: number = 3): void => {
  state.cooldown = cooldown;
  state.lastTrigger = Date.now();
  state.isActive = true;
};

// Apply buff effect
export const applyBuff = (
  state: PassiveState,
  buffType: 'damage' | 'defense' | 'speed' | 'freeze' | 'poison' | 'lifesteal',
  value: number,
  duration: number = 5
): void => {
  state.activeBuff = {
    name: `${state.passiveName} Buff`,
    type: buffType,
    value,
    duration,
  };
};

// Reduce buff duration
export const reduceBuff = (state: PassiveState, deltaSeconds: number): void => {
  if (state.activeBuff) {
    state.activeBuff.duration = Math.max(0, state.activeBuff.duration - deltaSeconds);
    if (state.activeBuff.duration <= 0) {
      state.activeBuff = undefined;
    }
  }
};

// ============================================
// PASSIVE-SPECIFIC LOGIC WITH EFFECT TRIGGERS
// ============================================

// Class 1: Inferno Aura - Passive damage aura that can trigger burning
export const handleInfernoAura = (state: PassiveState, targetHP: number, maxHP: number): number => {
  if (isPassiveReady(state)) {
    triggerPassive(state, 2);
    // 40% chance to trigger burning effect on mob
    if (Math.random() < 0.40) {
      state.triggeredEffect = {
        id: `inferno_${Date.now()}`,
        type: 'burning',
        source: 'passive',
        duration: 4,
        maxDuration: 4,
        stacks: 1,
        maxStacks: 5,
        potency: 0.8,
        damagePerTick: 2,
      };
    }
    return Math.floor(maxHP * 0.08); // 8% damage aura
  }
  reduceCooldown(state, 1.5);
  return 0;
};

// Class 2: Frostbite Chain - Freeze on critical hit
export const handleFrostbiteChain = (state: PassiveState, isCritical: boolean): boolean => {
  if (isCritical && isPassiveReady(state)) {
    triggerPassive(state, 3);
    applyBuff(state, 'freeze', 0, 2);
    // Trigger frozen effect on mob
    state.triggeredEffect = {
      id: `frostbite_${Date.now()}`,
      type: 'frozen',
      source: 'passive',
      duration: 2.5,
      maxDuration: 2.5,
      stacks: 1,
      maxStacks: 3,
      potency: 1.0,
      damageReduction: -30,
    };
    return true;
  }
  reduceCooldown(state, 1.5);
  return false;
};

// Class 3: Spell Echo - Cast spell twice
export const handleSpellEcho = (state: PassiveState, spellDamage: number): number => {
  if (isPassiveReady(state)) {
    triggerPassive(state, 4);
    return spellDamage; // Double spell damage
  }
  reduceCooldown(state, 1.5);
  return 0;
};

// Class 4: Poison Cloud - Build poison stacks, trigger corruption effect
export const handlePoisonCloud = (state: PassiveState, damageDealt: number): void => {
  addStack(state, 1); // +1 stack per hit
  
  // At 5 stacks, trigger poison burst
  if (state.stacks >= 5 && isPassiveReady(state)) {
    triggerPassive(state, 2.5);
    applyBuff(state, 'poison', 3, 4);
    // Trigger corrupted effect on mob
    state.triggeredEffect = {
      id: `poison_${Date.now()}`,
      type: 'corrupted',
      source: 'passive',
      duration: 5,
      maxDuration: 5,
      stacks: 3,
      maxStacks: 4,
      potency: 0.9,
      damagePerTick: 1,
    };
    state.stacks = 0; // Reset stacks after burst
  }
  reduceCooldown(state, 1.5);
};

// Class 5: Asura Rage - Damage buff on hit
export const handleAsuraRage = (state: PassiveState): number => {
  if (isPassiveReady(state)) {
    triggerPassive(state, 2.5);
    applyBuff(state, 'damage', 20, 3); // +20% damage for 3s
    return 20;
  }
  reduceCooldown(state, 1.5);
  return 0;
};

// Class 6: Glacial Barrier - Defense buff, applies frozen to self occasionally
export const handleGlacialBarrier = (state: PassiveState): number => {
  if (isPassiveReady(state)) {
    triggerPassive(state, 3);
    applyBuff(state, 'defense', 30, 2.5); // +30% defense for 2.5s
    return 30;
  }
  reduceCooldown(state, 1.5);
  return 0;
};

// Class 7: Nature's Blessing - Regeneration, heals and can entangle enemies
export const handleNaturesBlessing = (state: PassiveState, maxHP: number): number => {
  addStack(state, 1); // Heal stacks
  
  if (state.stacks >= 3 && isPassiveReady(state)) {
    triggerPassive(state, 2);
    const heal = Math.floor(maxHP * 0.12);
    // 30% chance to entangle enemy when healing
    if (Math.random() < 0.30) {
      state.triggeredEffect = {
        id: `nature_${Date.now()}`,
        type: 'entangled',
        source: 'passive',
        duration: 3,
        maxDuration: 3,
        stacks: 1,
        maxStacks: 2,
        potency: 0.7,
        speedBonus: -25,
      };
    }
    state.stacks = 0;
    return heal; // Heal for 12% max HP
  }
  reduceCooldown(state, 1.5);
  return 0;
};

// Class 8: Beast Hunt - Speed buff on kill
export const handleBeastHunt = (state: PassiveState): number => {
  if (isPassiveReady(state)) {
    triggerPassive(state, 3);
    applyBuff(state, 'speed', 25, 3); // +25% attack speed for 3s
    return 25;
  }
  reduceCooldown(state, 1.5);
  return 0;
};

// Class 9: Phoenix Rebirth - Damage scaling based on low HP
export const handlePhoenixRebirth = (state: PassiveState, currentHP: number, maxHP: number): number => {
  const hpPercent = currentHP / maxHP;
  if (hpPercent < 0.3 && isPassiveReady(state)) {
    triggerPassive(state, 3);
    applyBuff(state, 'damage', 35, 4); // +35% damage when low HP
    return 35;
  }
  reduceCooldown(state, 1.5);
  return 0;
};

// Class 10: Divine Grace - Healing bonus, can stun on heal
export const handleDivineGrace = (state: PassiveState, healingDone: number): number => {
  addStack(state, 1);
  
  if (state.stacks >= 2 && isPassiveReady(state)) {
    triggerPassive(state, 2.5);
    const bonusHeal = Math.floor(healingDone * 0.25);
    // 25% chance to stun enemy when healing
    if (Math.random() < 0.25) {
      state.triggeredEffect = {
        id: `grace_${Date.now()}`,
        type: 'stunned',
        source: 'passive',
        duration: 1.5,
        maxDuration: 1.5,
        stacks: 1,
        maxStacks: 1,
        potency: 1.0,
        damageBonus: -50,
      };
    }
    state.stacks = 0;
    return bonusHeal; // +25% bonus healing
  }
  reduceCooldown(state, 1.5);
  return 0;
};

// Class 11: Shadow Step - Speed on damage, can entangle target
export const handleShadowStep = (state: PassiveState, damageDealt: number): number => {
  if (isPassiveReady(state)) {
    triggerPassive(state, 2);
    applyBuff(state, 'speed', 20, 2.5); // +20% speed for 2.5s
    // 35% chance to entangle enemy
    if (Math.random() < 0.35) {
      state.triggeredEffect = {
        id: `shadow_${Date.now()}`,
        type: 'entangled',
        source: 'passive',
        duration: 3,
        maxDuration: 3,
        stacks: 1,
        maxStacks: 2,
        potency: 0.8,
        speedBonus: -25,
      };
    }
    return 20;
  }
  reduceCooldown(state, 1.5);
  return 0;
};

// Class 12: Spirit Fortitude - Defense stacking with stun resistance
export const handleSpiritFortitude = (state: PassiveState): number => {
  addStack(state, 2); // +2 stacks per tick
  const defenseBonus = state.stacks * 3; // 3% per stack (max 60% at 20 stacks)
  
  if (state.stacks >= 20) {
    state.stacks = 20; // Cap at 20
  }
  
  return Math.min(60, defenseBonus);
};
