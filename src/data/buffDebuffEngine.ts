/**
 * BUFF/DEBUFF ENGINE
 * Manages persistent effects during combat with duration tracking, stack management,
 * and effect resistance calculations
 */

export interface Effect {
  id: string;
  type: 'burning' | 'frozen' | 'entangled' | 'stunned' | 'corrupted' | 
        'damage_boost' | 'defense_boost' | 'speed_boost' | 'healing_boost';
  source: 'passive' | 'gear' | 'spell' | 'item';
  duration: number; // in seconds
  maxDuration: number;
  stacks: number;
  maxStacks: number;
  potency: number; // 0.0 to 1.0 scale
  damagePerTick?: number; // for DoT effects
  damageReduction?: number; // percentage
  damageBonus?: number; // percentage
  defenseBonus?: number; // percentage
  speedBonus?: number; // percentage
  healingBonus?: number; // percentage
}

export interface EffectState {
  player: Effect[];
  mob: Effect[];
  lastTriggerTime: number;
}

/**
 * Create a new effect with specified parameters
 */
export const createEffect = (
  type: Effect['type'],
  duration: number,
  source: Effect['source'] = 'passive',
  potency: number = 1.0,
  maxStacks: number = 1,
  damagePerTick?: number
): Effect => {
  return {
    id: `${type}_${Date.now()}_${Math.random()}`,
    type,
    source,
    duration,
    maxDuration: duration,
    stacks: 1,
    maxStacks,
    potency,
    damagePerTick,
  };
};

/**
 * Get effect properties for given effect type
 */
export const getEffectProperties = (type: Effect['type']) => {
  const effects: Record<string, Partial<Effect>> = {
    burning: {
      duration: 4,
      maxStacks: 5,
      damagePerTick: 2,
    },
    frozen: {
      duration: 2.5,
      maxStacks: 3,
      damageReduction: -30, // negative = increase damage taken
    },
    entangled: {
      duration: 3,
      maxStacks: 2,
      speedBonus: -25, // negative = slow
    },
    stunned: {
      duration: 1.5,
      maxStacks: 1,
      damageBonus: -50, // Stunned target does 50% less damage
    },
    corrupted: {
      duration: 5,
      maxStacks: 4,
      damagePerTick: 1,
    },
    damage_boost: {
      duration: 3,
      maxStacks: 3,
      damageBonus: 15,
    },
    defense_boost: {
      duration: 3,
      maxStacks: 3,
      defenseBonus: 20,
    },
    speed_boost: {
      duration: 3,
      maxStacks: 2,
      speedBonus: 25,
    },
    healing_boost: {
      duration: 4,
      maxStacks: 2,
      healingBonus: 30,
    },
  };
  return effects[type] || {};
};

/**
 * Apply an effect to a target (player or mob), handling stacking
 */
export const applyEffect = (
  effects: Effect[],
  effect: Effect,
  resist?: number
): Effect[] => {
  // Check if effect already exists
  const existingEffect = effects.find(e => e.type === effect.type);
  
  if (existingEffect) {
    // Increase stacks if under max
    if (existingEffect.stacks < existingEffect.maxStacks) {
      existingEffect.stacks += 1;
    }
    // Reset/refresh duration
    existingEffect.duration = existingEffect.maxDuration;
    return effects;
  }
  
  // New effect - apply resistance if provided
  if (resist && resist > 0) {
    const resistChance = Math.min(resist, 100) / 100;
    if (Math.random() < resistChance) {
      return effects; // Effect resisted
    }
  }
  
  return [...effects, effect];
};

/**
 * Reduce effect durations (called once per combat tick)
 */
export const reduceEffectDurations = (effects: Effect[], tickDuration: number): Effect[] => {
  return effects
    .map(effect => ({
      ...effect,
      duration: effect.duration - tickDuration,
    }))
    .filter(effect => effect.duration > 0);
};

/**
 * Get total damage modification from effects (DoT damage)
 */
export const getEffectDamage = (effects: Effect[]): number => {
  return effects.reduce((total, effect) => {
    if (effect.damagePerTick && effect.stacks) {
      return total + (effect.damagePerTick * effect.stacks);
    }
    return total;
  }, 0);
};

/**
 * Get defense modification from effects (percentage)
 */
export const getDefenseModifier = (effects: Effect[]): number => {
  return effects.reduce((total, effect) => {
    if (effect.defenseBonus && effect.stacks) {
      // Average per stack
      const perStack = effect.defenseBonus / effect.maxStacks;
      return total + (perStack * effect.stacks);
    }
    if (effect.damageReduction && effect.stacks) {
      // Apply negative reduction as defense increase
      const perStack = Math.abs(effect.damageReduction) / effect.maxStacks;
      return total + (perStack * effect.stacks);
    }
    return total;
  }, 0);
};

/**
 * Get damage modification from effects (percentage increase/decrease)
 */
export const getDamageModifier = (effects: Effect[]): number => {
  return effects.reduce((total, effect) => {
    if (effect.damageBonus && effect.stacks) {
      const perStack = effect.damageBonus / effect.maxStacks;
      return total + (perStack * effect.stacks);
    }
    if (effect.damageReduction && effect.stacks) {
      // Damage reduction decreases outgoing damage
      const perStack = effect.damageReduction / effect.maxStacks;
      return total + (perStack * effect.stacks);
    }
    return total;
  }, 0);
};

/**
 * Get speed/action speed modification (percentage)
 */
export const getSpeedModifier = (effects: Effect[]): number => {
  return effects.reduce((total, effect) => {
    if (effect.speedBonus && effect.stacks) {
      const perStack = effect.speedBonus / effect.maxStacks;
      return total + (perStack * effect.stacks);
    }
    return total;
  }, 0);
};

/**
 * Get healing effectiveness modification (percentage)
 */
export const getHealingModifier = (effects: Effect[]): number => {
  return effects.reduce((total, effect) => {
    if (effect.healingBonus && effect.stacks) {
      const perStack = effect.healingBonus / effect.maxStacks;
      return total + (perStack * effect.stacks);
    }
    return total;
  }, 0);
};

/**
 * Check if target is stunned (can't act)
 */
export const isStunned = (effects: Effect[]): boolean => {
  return effects.some(e => e.type === 'stunned' && e.duration > 0);
};

/**
 * Check if target is frozen (reduced damage output)
 */
export const isFrozen = (effects: Effect[]): boolean => {
  return effects.some(e => e.type === 'frozen' && e.duration > 0);
};

/**
 * Check if target is entangled (reduced speed)
 */
export const isEntangled = (effects: Effect[]): boolean => {
  return effects.some(e => e.type === 'entangled' && e.duration > 0);
};

/**
 * Format effects for display in UI
 */
export const formatEffects = (effects: Effect[]): string => {
  if (effects.length === 0) return "No active effects";
  
  return effects
    .map(e => {
      const stacks = e.stacks > 1 ? ` [x${e.stacks}]` : '';
      const duration = e.duration.toFixed(1);
      return `${e.type.toUpperCase()}${stacks} (${duration}s)`;
    })
    .join(', ');
};

/**
 * Get element affinity effect chance (used when triggering element affinity)
 */
export const getAffinityEffectChance = (type: Effect['type']): number => {
  const chances: Record<string, number> = {
    burning: 40,
    frozen: 35,
    entangled: 30,
    stunned: 25,
    corrupted: 30,
  };
  return chances[type] || 20;
};

/**
 * Calculate effect resistance for a given level and class
 * Higher levels naturally resist effects more
 */
export const calculateEffectResistance = (level: number, classId?: number): number => {
  // Base resistance scales with level: 5% per level
  let baseResist = Math.min(level * 5, 50);
  
  // Certain classes have higher resistance (WIL-based classes)
  const highResistClasses = [6, 12]; // Frozen Steel Guard, Unbreakable Spirit Sage
  if (classId && highResistClasses.includes(classId)) {
    baseResist += 10;
  }
  
  return Math.min(baseResist, 75); // Cap at 75% max resistance
};

/**
 * Initialize empty effect state for combat
 */
export const initEffectState = (): EffectState => ({
  player: [],
  mob: [],
  lastTriggerTime: 0,
});

/**
 * Remove all effects from both combatants (used when combat ends)
 */
export const clearAllEffects = (state: EffectState): EffectState => ({
  ...state,
  player: [],
  mob: [],
});
