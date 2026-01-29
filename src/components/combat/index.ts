// ============================================
// COMBAT COMPONENTS BARREL EXPORT
// ============================================

export { CombatFeedback, ELEMENT_COLORS, ELEMENT_ICONS } from './CombatFeedback';
export type { FloatingNumber, ElementPopup, PassiveTrigger } from './CombatFeedback';

export { EnhancedCombatLog, convertLegacyLog } from './EnhancedCombatLog';
export type { CombatLogEntry, CombatLogType } from './EnhancedCombatLog';

export { VisualCombatArena } from './VisualCombatArena';

// Enhanced UI Components (FASE 2/3)
export {
  EnhancedSkillButton,
  DefenseButton,
  VitalBarEnhanced,
  TurnIndicator,
  ComboIndicator,
  PassiveTriggerBanner,
  ElementEffectivenessPopup,
  CombatActionBar,
  CombatHUD
} from './EnhancedCombatUI';
export type { Skill } from './EnhancedCombatUI';

// Floating Damage System
export {
  FloatingDamageContainer,
  useFloatingDamage,
  triggerScreenShake,
  FloatingDamageOverlay
} from './FloatingDamage';
export type { FloatingDamageNumber } from './FloatingDamage';

// VFX Sprite System
export {
  VFXSprite,
  QuickVFX,
  useVFXManager,
  VFX_PRESETS,
  FIRE_VFX_CONFIG
} from './VFXSprite';
