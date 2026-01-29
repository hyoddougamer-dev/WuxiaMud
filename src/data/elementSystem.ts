// ============================================
// ELEMENT DAMAGE SYSTEM
// Element interactions, resistances, multipliers
// ============================================

export type ElementType = 'Fire' | 'Ice' | 'Wood' | 'Lightning' | 'Void';

export interface ElementResistance {
  element: ElementType;
  resistance: number; // 0-100, damage reduction percentage
}

export interface DamageModifier {
  element: ElementType;
  baseMultiplier: number;
  critMultiplier: number;
}

// ============================================
// ELEMENT ADVANTAGE MATRIX
// Soft rock-paper-scissors system
// ============================================

export const elementAdvantage: Record<ElementType, Record<ElementType, number>> = {
  Fire: {
    Fire: 1.0,     // Fire vs Fire: neutral
    Ice: 1.3,      // Fire vs Ice: strong (melts)
    Wood: 0.9,     // Fire vs Wood: weak (trees resist)
    Lightning: 1.1, // Fire vs Lightning: slight advantage
    Void: 0.8,     // Fire vs Void: weak (void absorbs)
  },
  Ice: {
    Fire: 0.8,     // Ice vs Fire: weak
    Ice: 1.0,      // Ice vs Ice: neutral
    Wood: 1.2,     // Ice vs Wood: strong (freezes)
    Lightning: 0.9, // Ice vs Lightning: weak
    Void: 1.1,     // Ice vs Void: slight advantage
  },
  Wood: {
    Fire: 1.2,     // Wood vs Fire: strong (overgrows)
    Ice: 0.8,      // Wood vs Ice: weak
    Wood: 1.0,     // Wood vs Wood: neutral
    Lightning: 1.3, // Wood vs Lightning: strong (absorbs)
    Void: 0.9,     // Wood vs Void: weak
  },
  Lightning: {
    Fire: 0.95,    // Lightning vs Fire: slight weak
    Ice: 1.15,     // Lightning vs Ice: strong (shatters)
    Wood: 0.85,    // Lightning vs Wood: weak (grounded)
    Lightning: 1.0, // Lightning vs Lightning: neutral
    Void: 1.2,     // Lightning vs Void: strong (pierces)
  },
  Void: {
    Fire: 1.2,     // Void vs Fire: strong (consumes)
    Ice: 0.9,      // Void vs Ice: weak
    Wood: 1.15,    // Void vs Wood: strong (corrupts)
    Lightning: 0.85, // Void vs Lightning: weak
    Void: 1.0,     // Void vs Void: neutral
  },
};

// ============================================
// DAMAGE CALCULATION WITH ELEMENTS
// ============================================

/**
 * Calculate final damage with element advantage
 */
export const calculateElementDamage = (
  baseDamage: number,
  attackerElement: ElementType,
  defenderElement: ElementType,
  isCritical: boolean = false
): number => {
  const multiplier = elementAdvantage[attackerElement][defenderElement];
  const critBonus = isCritical ? 1.5 : 1;
  
  return Math.floor(baseDamage * multiplier * critBonus);
};

/**
 * Get element resistance for a given element
 */
export const getElementResistance = (
  resistances: ElementResistance[],
  element: ElementType
): number => {
  const found = resistances.find(r => r.element === element);
  return found?.resistance || 0;
};

/**
 * Apply resistances to damage
 */
export const applyResistance = (
  damage: number,
  resistance: number
): number => {
  // Resistance reduces damage (0% = no reduction, 100% = immune)
  const damageAfterResist = damage * (1 - resistance / 100);
  return Math.floor(Math.max(1, damageAfterResist)); // Minimum 1 damage
};

/**
 * Full damage calculation: base → element advantage → resistance
 */
export const calculateFinalDamage = (
  baseDamage: number,
  attackerElement: ElementType,
  defenderElement: ElementType,
  defenderResistances: ElementResistance[] = [],
  isCritical: boolean = false
): number => {
  const elementDamage = calculateElementDamage(baseDamage, attackerElement, defenderElement, isCritical);
  const resistance = getElementResistance(defenderResistances, attackerElement);
  const finalDamage = applyResistance(elementDamage, resistance);
  
  return finalDamage;
};

// ============================================
// MOB RESISTANCES BY LEVEL/TYPE
// ============================================

export const mobElementResistances: Record<number, ElementResistance[]> = {
  // Lvl 1-3: Weak resistances
  1: [
    { element: 'Fire', resistance: 5 },
    { element: 'Ice', resistance: 0 },
    { element: 'Wood', resistance: 0 },
    { element: 'Lightning', resistance: 0 },
    { element: 'Void', resistance: 0 },
  ],
  2: [
    { element: 'Fire', resistance: 8 },
    { element: 'Ice', resistance: 3 },
    { element: 'Wood', resistance: 5 },
    { element: 'Lightning', resistance: 0 },
    { element: 'Void', resistance: 0 },
  ],
  3: [
    { element: 'Fire', resistance: 10 },
    { element: 'Ice', resistance: 5 },
    { element: 'Wood', resistance: 8 },
    { element: 'Lightning', resistance: 3 },
    { element: 'Void', resistance: 0 },
  ],
  
  // Lvl 4-6: Medium resistances
  4: [
    { element: 'Fire', resistance: 12 },
    { element: 'Ice', resistance: 8 },
    { element: 'Wood', resistance: 10 },
    { element: 'Lightning', resistance: 5 },
    { element: 'Void', resistance: 3 },
  ],
  5: [
    { element: 'Fire', resistance: 15 },
    { element: 'Ice', resistance: 10 },
    { element: 'Wood', resistance: 12 },
    { element: 'Lightning', resistance: 8 },
    { element: 'Void', resistance: 5 },
  ],
  6: [
    { element: 'Fire', resistance: 18 },
    { element: 'Ice', resistance: 12 },
    { element: 'Wood', resistance: 15 },
    { element: 'Lightning', resistance: 10 },
    { element: 'Void', resistance: 8 },
  ],
  
  // Lvl 7-9: Higher resistances
  7: [
    { element: 'Fire', resistance: 20 },
    { element: 'Ice', resistance: 15 },
    { element: 'Wood', resistance: 18 },
    { element: 'Lightning', resistance: 12 },
    { element: 'Void', resistance: 10 },
  ],
  8: [
    { element: 'Fire', resistance: 22 },
    { element: 'Ice', resistance: 18 },
    { element: 'Wood', resistance: 20 },
    { element: 'Lightning', resistance: 15 },
    { element: 'Void', resistance: 12 },
  ],
  9: [
    { element: 'Fire', resistance: 25 },
    { element: 'Ice', resistance: 20 },
    { element: 'Wood', resistance: 22 },
    { element: 'Lightning', resistance: 18 },
    { element: 'Void', resistance: 15 },
  ],
  
  // Lvl 10+: Endgame resistances (scale automatically)
  10: [
    { element: 'Fire', resistance: 28 },
    { element: 'Ice', resistance: 22 },
    { element: 'Wood', resistance: 25 },
    { element: 'Lightning', resistance: 20 },
    { element: 'Void', resistance: 18 },
  ],
};

/**
 * Get resistances for mob by level
 */
export const getMobResistances = (mobLevel: number): ElementResistance[] => {
  if (mobElementResistances[mobLevel]) {
    return mobElementResistances[mobLevel];
  }
  
  // Scale up for levels > 10
  const baseLevel = 10;
  const baseResistances = mobElementResistances[baseLevel];
  const levelDiff = mobLevel - baseLevel;
  
  return baseResistances.map(r => ({
    element: r.element,
    resistance: Math.min(75, r.resistance + levelDiff * 1.5), // Cap at 75%
  }));
};

// ============================================
// ELEMENT AFFINITY EFFECTS
// Special effects based on element combinations
// ============================================

export interface ElementAffinityEffect {
  name: string;
  description: string;
  damageBonus: number;
  effectChance: number; // 0-1
  effect: string;
}

export const elementAffinities: Record<ElementType, ElementAffinityEffect> = {
  Fire: {
    name: 'Burning',
    description: 'Deal DoT damage over time',
    damageBonus: 15,
    effectChance: 0.4,
    effect: '5% damage/sec for 3s',
  },
  Ice: {
    name: 'Frozen',
    description: 'Chance to freeze enemy',
    damageBonus: 12,
    effectChance: 0.35,
    effect: 'Reduce attack speed by 50% for 2s',
  },
  Wood: {
    name: 'Entangled',
    description: 'Reduce enemy movement',
    damageBonus: 10,
    effectChance: 0.3,
    effect: 'Reduce dodge by 30% for 2s',
  },
  Lightning: {
    name: 'Stunned',
    description: 'Chance to stun enemy',
    damageBonus: 18,
    effectChance: 0.25,
    effect: 'Skip next action 50% chance',
  },
  Void: {
    name: 'Corrupted',
    description: 'Reduce resistances',
    damageBonus: 20,
    effectChance: 0.3,
    effect: 'Reduce all resistances by 20% for 3s',
  },
};

/**
 * Check if affinity effect triggers
 */
export const triggerAffinityEffect = (element: ElementType): boolean => {
  const affinity = elementAffinities[element];
  return Math.random() < affinity.effectChance;
};

// ============================================
// ELEMENT DAMAGE WITH FEEDBACK INFO
// ============================================

export interface ElementDamageResult {
  damage: number;
  baseDamage: number;
  multiplier: number;
  isCritical: boolean;
  isEffective: 'super' | 'normal' | 'resisted';
  attackerElement: ElementType;
  defenderElement?: ElementType;
  resistanceReduction: number;
}

/**
 * Calculate damage with full feedback information
 */
export const calculateDamageWithFeedback = (
  baseDamage: number,
  attackerElement: ElementType,
  defenderElement: ElementType = 'Fire',
  defenderResistances: ElementResistance[] = [],
  isCritical: boolean = false,
  critDamageMultiplier: number = 150 // Default 150% crit damage, can be boosted by secondary stats
): ElementDamageResult => {
  const multiplier = elementAdvantage[attackerElement][defenderElement];
  const critBonus = isCritical ? (critDamageMultiplier / 100) : 1;
  const elementDamage = Math.floor(baseDamage * multiplier * critBonus);
  
  const resistance = getElementResistance(defenderResistances, attackerElement);
  const resistanceReduction = Math.floor(elementDamage * (resistance / 100));
  const finalDamage = Math.max(1, elementDamage - resistanceReduction);
  
  // Determine effectiveness
  let isEffective: 'super' | 'normal' | 'resisted' = 'normal';
  if (multiplier >= 1.2) {
    isEffective = 'super';
  } else if (multiplier <= 0.85 || resistance >= 20) {
    isEffective = 'resisted';
  }
  
  return {
    damage: finalDamage,
    baseDamage,
    multiplier,
    isCritical,
    isEffective,
    attackerElement,
    defenderElement,
    resistanceReduction,
  };
};

// ============================================
// ELEMENT VISUAL COLORS
// ============================================

export const ELEMENT_COLORS: Record<ElementType, string> = {
  Fire: '#FF6B35',
  Ice: '#5BC0EB',
  Wood: '#8BC34A',
  Lightning: '#FFD93D',
  Void: '#9B59B6',
};

export const ELEMENT_EMOJI: Record<ElementType, string> = {
  Fire: '🔥',
  Ice: '❄️',
  Wood: '🌿',
  Lightning: '⚡',
  Void: '🌑',
};

// Icon paths for elements (use these instead of emojis!)
export const ELEMENT_ICON_PATHS: Record<ElementType, string> = {
  Fire: '/assets/icons/elements/element_fire.png',
  Ice: '/assets/icons/elements/element_ice.png',
  Wood: '/assets/icons/elements/element_nature.png',
  Lightning: '/assets/icons/elements/element_lightning.png',
  Void: '/assets/icons/elements/element_void.png',
};
