// Pity System - Anti-Frustration Mechanics
// Garante progresso constante mesmo com RNG ruim

export interface PityState {
  // Drop Pity (boss kills sem gear drop)
  dropPity: number;
  lastDropKills: number;
  
  // Craft Pity (tentativas falhadas)
  craftPity: Record<number, number>; // tier -> fail count
  
  // Reforge Pity (tentativas Epic->Legendary falhadas)
  reforgePity: number;
  legendaryEssences: number;
}

// Pity Thresholds
export const PITY_CONFIG = {
  // Drop Pity: garantir drop após X kills sem sucesso
  DROP_PITY_THRESHOLD: 100,
  DROP_PITY_INCREMENT: 0.5, // +0.5% por kill sem drop
  
  // Craft Pity: aumentar success rate após falhas
  CRAFT_PITY_BONUS_PER_FAIL: 5, // +5% por falha
  CRAFT_PITY_MAX_BONUS: 20, // máximo +20% (4 falhas)
  CRAFT_PITY_GUARANTEED: 4, // após 4 falhas = 100% success
  
  // Reforge Pity: Epic -> Legendary
  REFORGE_PITY_ESSENCE_PER_FAIL: 1,
  REFORGE_PITY_SCROLL_COST: 5, // 5 essences = 1 scroll (100% success)
};

/**
 * Calcula bonus de drop rate baseado em pity counter
 */
export function getDropPityBonus(killsSinceDrop: number): number {
  if (killsSinceDrop >= PITY_CONFIG.DROP_PITY_THRESHOLD) {
    return 100; // Guaranteed drop
  }
  return Math.min(killsSinceDrop * PITY_CONFIG.DROP_PITY_INCREMENT, 50);
}

/**
 * Calcula bonus de craft success rate baseado em falhas
 */
export function getCraftPityBonus(failCount: number): number {
  if (failCount >= PITY_CONFIG.CRAFT_PITY_GUARANTEED) {
    return 100; // Guaranteed success
  }
  return Math.min(
    failCount * PITY_CONFIG.CRAFT_PITY_BONUS_PER_FAIL,
    PITY_CONFIG.CRAFT_PITY_MAX_BONUS
  );
}

/**
 * Check if player has Legendary Scroll (5 essences)
 */
export function canCraftLegendaryScroll(essences: number): boolean {
  return essences >= PITY_CONFIG.REFORGE_PITY_SCROLL_COST;
}

/**
 * Reset pity counters after success
 */
export function resetPityOnSuccess(pityState: PityState, type: 'drop' | 'craft' | 'reforge', tier?: number): PityState {
  const newState = { ...pityState };
  
  switch (type) {
    case 'drop':
      newState.lastDropKills = 0;
      // Don't reset dropPity total - accumulates over the game
      break;
      
    case 'craft':
      if (tier !== undefined) {
        newState.craftPity[tier] = 0;
      }
      break;
      
    case 'reforge':
      // Don't reset essences - allows accumulation for scroll
      break;
  }
  
  return newState;
}

/**
 * Increment pity counters after failure
 */
export function incrementPityOnFail(pityState: PityState, type: 'drop' | 'craft' | 'reforge', tier?: number): PityState {
  const newState = { ...pityState };
  
  switch (type) {
    case 'drop':
      newState.lastDropKills += 1;
      newState.dropPity = Math.min(newState.lastDropKills, PITY_CONFIG.DROP_PITY_THRESHOLD);
      break;
      
    case 'craft':
      if (tier !== undefined) {
        newState.craftPity[tier] = (newState.craftPity[tier] || 0) + 1;
      }
      break;
      
    case 'reforge':
      newState.reforgePity += 1;
      newState.legendaryEssences += PITY_CONFIG.REFORGE_PITY_ESSENCE_PER_FAIL;
      break;
  }
  
  return newState;
}

/**
 * Usa Legendary Scroll (consome 5 essences)
 */
export function useLegendaryScroll(pityState: PityState): PityState {
  if (!canCraftLegendaryScroll(pityState.legendaryEssences)) {
    return pityState;
  }
  
  return {
    ...pityState,
    legendaryEssences: pityState.legendaryEssences - PITY_CONFIG.REFORGE_PITY_SCROLL_COST,
    reforgePity: 0,
  };
}

/**
 * Initialize pity state for new player
 */
export function createInitialPityState(): PityState {
  return {
    dropPity: 0,
    lastDropKills: 0,
    craftPity: { 1: 0, 2: 0, 3: 0, 4: 0 },
    reforgePity: 0,
    legendaryEssences: 0,
  };
}

/**
 * Pity messages for UI
 */
export function getPityMessage(pityState: PityState, type: 'drop' | 'craft' | 'reforge', tier?: number): string | null {
  switch (type) {
    case 'drop':
      if (pityState.lastDropKills >= PITY_CONFIG.DROP_PITY_THRESHOLD) {
        return '🎁 GUARANTEED DROP on next boss kill!';
      }
      if (pityState.lastDropKills >= 50) {
        return `⚠️ ${pityState.lastDropKills} kills without drop. +${getDropPityBonus(pityState.lastDropKills).toFixed(1)}% drop chance!`;
      }
      return null;
      
    case 'craft':
      if (tier !== undefined) {
        const fails = pityState.craftPity[tier] || 0;
        if (fails >= PITY_CONFIG.CRAFT_PITY_GUARANTEED) {
          return '✨ GUARANTEED SUCCESS on next craft!';
        }
        if (fails > 0) {
          return `🔧 ${fails} fails. +${getCraftPityBonus(fails)}% success bonus!`;
        }
      }
      return null;
      
    case 'reforge':
      if (canCraftLegendaryScroll(pityState.legendaryEssences)) {
        return `✨ You can craft a Legendary Scroll! (${pityState.legendaryEssences}/5 essences)`;
      }
      if (pityState.legendaryEssences > 0) {
        return `💎 ${pityState.legendaryEssences}/5 Legendary Essences collected`;
      }
      return null;
  }
}
