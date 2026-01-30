// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Sparkles, Zap, Shield, Flame, Wind, Sword, Plus, Minus, Map as MapIcon, Skull, AlertTriangle, User, Compass, Box, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Star, Gem, X, Coins, Scroll, Hammer, CircleDot, Award, Footprints, ChevronsUp, Hexagon, Lock, BookOpen, Music, Droplet, Ghost, Leaf, Trash2, Heart, Clock, RefreshCw, Trophy, Crown } from 'lucide-react';

// Import from organized modules
import { zoneImages, mobImages, classDefinitions, itemDatabase, mobDefinitions, levelingTable, avatarList, worldMap, bestiaryMap } from './data/constants';
import { hybridClassSystem, classStatTemplates } from './data/hybridClasses';
import { gearItems, getClassGearByTier } from './data/gearItems';
import { materials, getDropTableForLevel, getBossDropTable, getMaterialById } from './data/materials';
import { getRecipeByTier, reforgeRecipes } from './data/craftingSystem';
import { applyGearBonuses, getGearSetBonus } from './data/gearSystem';
import { 
  vendorItems, getJunkByTier, getTierFromLevel, getDropRates, 
  getMobDropConfig, getClassTokenById, rollJunkDrop, rollClassTokenDrop, rollItemRarity 
} from './data/dropSystem';
import { allSkillsDatabase, getAvailableSkills, getClassSkills, getSkillById, isSkillUnlocked, getDefaultHotbar, getSkillDamageDescription, type Skill } from './data/skillSystem';
import { createInitialPityState, getDropPityBonus, getCraftPityBonus, resetPityOnSuccess, incrementPityOnFail, type PityState } from './data/pitySystem';
import { RARITY_CONFIG, type ItemRarity, getRarityMultiplier, rollSecondaryStats } from './data/raritySystem';
import { initPassiveState, isPassiveReady, triggerPassive, reduceCooldown, handleInfernoAura, handleFrostbiteChain, handleSpellEcho, handlePoisonCloud, handleAsuraRage, handleGlacialBarrier, handleNaturesBlessing, handleBeastHunt, handlePhoenixRebirth, handleDivineGrace, handleShadowStep, handleSpiritFortitude } from './data/passiveState';
import { calculateFinalDamage, getMobResistances, triggerAffinityEffect, elementAffinities, calculateDamageWithFeedback, ELEMENT_COLORS, ELEMENT_EMOJI, ELEMENT_ICON_PATHS, type ElementDamageResult, type ElementType } from './data/elementSystem';
import { 
  createEffect, applyEffect, reduceEffectDurations, getEffectDamage, 
  getDamageModifier, getDefenseModifier, getHealingModifier, isStunned, 
  isFrozen, calculateEffectResistance, initEffectState, clearAllEffects, 
  getAffinityEffectChance 
} from './data/buffDebuffEngine';
import type { EffectState } from './data/buffDebuffEngine';
import { getRarityColor, getTierColor, getStatLabel, getMobById, getLevelInfo, calculateTotalAP, calculateResetCost, getItemById } from './utils/helpers';
import { createDefaultQuestLog, createQuestLogWithTutorial, type PlayerQuestLog, startQuest, completeQuest, abandonQuest, onMobKilled, onNPCTalk, onLevelUp, onZoneEntered, onSpecialAction, syncLevelObjectives, isQuestComplete, canAcceptQuest } from './data/questSystem';
import { allQuests, getQuestById, getNPCsByZone, getQuestsForNPC } from './data/questDatabase';
import { QuestPanel, QuestHudTracker } from './components/quest';
import { NPCDialog } from './components/NPCDialog';
import { CraftingModal } from './components/CraftingModal';
import { ReforgingModal } from './components/ReforgingModal';
import { SalvageModal, type SalvageResult } from './components/SalvageModal';
import { LootPickupModal } from './components/LootPickupModal';
import { DeathModal } from './components/DeathModal';
import { RepairModal, calculateRepairCost } from './components/RepairModal';
import { SpiritStoneIcon } from './components/ItemIcon';
import { CombatLogIconComponent } from './components/combat/CombatFeedback';
import { formatStatusEffect, getStatusEffectDisplay, EMOJI_FALLBACKS } from './data/iconSystem';
import { ResourceIcon } from './components/ui/GameIcon';
import VitalBar from './components/VitalBar';
import QualityStars from './components/QualityStars';
import VisualWorldMap from './components/VisualWorldMap';
import GearSlot from './components/GearSlot';
import Tooltip from './components/Tooltip';
import MiniMap from './components/MiniMap';
import { AutoCombatSettingsModal, defaultAutoCombatSettings, type AutoCombatSettings } from './components/AutoCombatSettingsModal';
import { AutoCombatSummaryModal, emptySessionStats, type AutoCombatSessionStats } from './components/AutoCombatSummaryModal';

// Tab System
import { TabBar, type TabType } from './components/layout/TabBar';
import { WorldPage } from './components/pages/WorldPage';
import { CharacterPage } from './components/pages/CharacterPage';
import { InventoryPage } from './components/pages/InventoryPage';
import { ForgePage } from './components/pages/ForgePage';
import { BestiaryPage } from './components/pages/BestiaryPage';
import { MapPage } from './components/pages/MapPage';
import { CultivationPage } from './components/pages/CultivationPage';
import { createInitialCultivationProgress, type CultivationProgress, getDailyReward, checkDailyLogin, CULTIVATION_MILESTONES } from './data/cultivationSystem';
import { calculateBestiaryBonuses, getMobTags as getBestiaryMobTags, getMobRealm } from './data/bestiaryRewards';
import { 
  createDefaultTitleState, 
  getNewlyUnlockedTitles, 
  getUnlockedTitles, 
  getTitleById,
  TITLE_RARITY_STYLES,
  type PlayerTitleState, 
  type PlayerStats 
} from './data/titlesSystem';
import { TitlesModal } from './components/TitlesModal';
import { 
  getStatsGainedOnLevelUp, 
  calculateMaxHP, 
  calculateMaxQI, 
  migratePlayerStats, 
  BASE_SCALING,
  getCombatDifficulty,
  getLevelDiffModifiers
} from './data/levelScaling';

// Combo System
import { ComboTracker, ComboCompleteEffect } from './components/ComboTracker';
import { getCombosForClass, checkComboMatch, getNextPossibleCombos, type SkillCombo, type ComboProgress } from './data/comboSystem';

// Combat Assets - Sprites for visual combat
import { getPlayerSprite, getMobSprite, getZoneBackground } from './data/combatAssets';

// VFX System
import { useVFXManager, VFX_PRESETS } from './components/combat/VFXSprite';

// Onboarding
import { CharacterCreation } from './components/CharacterCreation';
import { Tutorial } from './components/Tutorial';
import { ToastContainer, useToast } from './components/Toast';
import { CharacterSelectionScreen } from './components/CharacterSelectionScreen';
import { SettingsMenu, SettingsButton } from './components/SettingsMenu';
import { FleeConfirmModal } from './components/FleeConfirmModal';
import { ZoneInfoPanel } from './components/ZoneInfoPanel';
import { AdminPanel } from './components/AdminPanel';
import { isAdmin } from './services/adminService';
import { EventBanner } from './components/EventBanner';
import { useRewardAnimation } from './components/RewardClaimAnimation';
import { AchievementsPanel } from './components/AchievementsPanel';
import { LeaderboardPanel } from './components/LeaderboardPanel';
import { ChatPanel, ChatButton } from './components/ChatPanel';
import { MarketView } from './components/pages/MarketView';
import { createInitialAchievements, type PlayerAchievements } from './data/achievementSystem';
import { useSettings } from './contexts/SettingsContext';
import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/LoginPage';
import { usePlayerData } from './hooks/usePlayerData';
import { applyStarterKit, getStarterKitByClassId, STARTER_RING, STARTER_NECKLACE } from './data/starterKits';
import { useMusic } from './contexts/MusicContext';

// Maximum stack size for stackable items (junk, materials, consumables)
const MAX_STACK = 99;

// Auto-Combat System Constants
const DAILY_AUTO_COMBAT_MINUTES = 30; // 30 minutes per day free auto-combat
const DAILY_AUTO_COMBAT_SECONDS = DAILY_AUTO_COMBAT_MINUTES * 60;

// ============================================
// DEV MODE - EXP MULTIPLIER
// Set to 1 for normal gameplay, higher for testing
// Access via console: window.setExpMultiplier(500)
// ============================================
const DEV_EXP_MULTIPLIER = { value: 1 };

// Expose to window for dev testing
if (typeof window !== 'undefined') {
  (window as any).setExpMultiplier = (multiplier: number) => {
    DEV_EXP_MULTIPLIER.value = multiplier;
    console.log(`🔥 EXP Multiplier set to ${multiplier}x`);
    return `EXP Multiplier: ${multiplier}x`;
  };
  (window as any).getExpMultiplier = () => DEV_EXP_MULTIPLIER.value;
}

// Unique ID generator to avoid duplicate keys
let itemIdCounter = 0;
const generateUniqueId = (): string => {
  itemIdCounter++;
  return `item_${Date.now()}_${itemIdCounter}_${Math.random().toString(36).substr(2, 9)}`;
};

// Check if item type is stackable (NOT equipment)
const isStackableType = (type: string): boolean => {
  const nonStackableTypes = ['weapon', 'armor', 'ring', 'necklace', 'amulet', 'accessory', 'helmet', 'chest', 'legs', 'boots', 'gloves'];
  return !nonStackableTypes.includes(type?.toLowerCase());
};

// Helper to add items to inventory with automatic stacking (max 99)
// Works for stackable items (consumables, materials, junk) - NOT equipment
const addItemToInventory = (
  inventory: any[], 
  newItem: any, 
  quantity: number = 1
): any[] => {
  const newInv = [...inventory];
  
  // Equipment items don't stack - add individually
  if (!isStackableType(newItem.type)) {
    for (let i = 0; i < quantity; i++) {
      newInv.push({ 
        ...newItem, 
        id: generateUniqueId(),
        count: 1 
      });
    }
    return newInv;
  }
  
  // Stackable items - find existing stack
  const matchKey = newItem.materialId || newItem.itemId || newItem.name;
  const existing = newInv.find(inv => 
    (inv.materialId && inv.materialId === newItem.materialId) ||
    (inv.itemId && inv.itemId === newItem.itemId) ||
    (inv.name && inv.name === newItem.name && inv.type === newItem.type)
  );
  
  if (existing) {
    const currentCount = existing.count || 1;
    const spaceInStack = MAX_STACK - currentCount;
    const toAdd = Math.min(quantity, spaceInStack);
    
    existing.count = currentCount + toAdd;
    
    // If there's overflow, create new stack(s)
    let overflow = quantity - toAdd;
    while (overflow > 0) {
      const stackSize = Math.min(overflow, MAX_STACK);
      newInv.push({ 
        ...newItem, 
        id: generateUniqueId(),
        count: stackSize 
      });
      overflow -= stackSize;
    }
  } else {
    // New item - create stack(s)
    let remaining = quantity;
    while (remaining > 0) {
      const stackSize = Math.min(remaining, MAX_STACK);
      newInv.push({ 
        ...newItem, 
        id: generateUniqueId(),
        count: stackSize 
      });
      remaining -= stackSize;
    }
  }
  
  return newInv;
};

// Legacy helper (kept for compatibility)
const addToStackableInventory = (inventory: any[], newItem: any, matchFn: (inv: any) => boolean): { newInv: any[], overflow: number } => {
  const existing = inventory.find(matchFn);
  if (existing) {
    const spaceInStack = MAX_STACK - (existing.count || 1);
    if (spaceInStack >= 1) {
      existing.count = Math.min((existing.count || 1) + 1, MAX_STACK);
      return { newInv: inventory, overflow: spaceInStack < 1 ? 1 : 0 };
    }
    // Stack is full, don't add more
    return { newInv: inventory, overflow: 1 };
  }
  // New item, add to inventory
  inventory.push({ ...newItem, count: 1 });
  return { newInv: inventory, overflow: 0 };
};

// Helper to determine weapon icon type based on subtype/name
const getWeaponIconType = (item: any): string => {
  const subtype = item?.subtype?.toLowerCase() || '';
  const name = item?.name?.toLowerCase() || '';
  const type = item?.type?.toLowerCase() || '';
  
  if (subtype === 'sword' || name.includes('sword') || name.includes('blade')) return 'weapon_sword';
  if (subtype === 'saber' || name.includes('saber')) return 'weapon_saber';
  if (subtype === 'zither' || name.includes('zither') || name.includes('melody')) return 'weapon_zither';
  if (type === 'ring' || name.includes('ring')) return 'accessory_ring';
  if (type === 'necklace' || name.includes('pendant') || name.includes('amulet') || name.includes('necklace')) return 'accessory_necklace';
  
  return 'weapon_sword'; // Default fallback
};

const getIcon = (type, className = "") => {
    switch(type) {
        case 'healing_pill': return <Plus size={14} className={className || "text-red-400"}/>;
        case 'foundation_pill': return <CircleDot size={14} className={className || "text-cyan-400"}/>;
        case 'monster_drop': return <Box size={14} className={className || "text-amber-500"}/>;
        // Weapon icons - will be replaced with actual images
        case 'weapon_sword': return <Sword size={14} className={className || "text-blue-400"}/>;
        case 'weapon_saber': return <Sword size={14} className={className || "text-red-400"}/>;
        case 'weapon_zither': return <Music size={14} className={className || "text-purple-400"}/>;
        case 'accessory_ring': return <CircleDot size={14} className={className || "text-yellow-400"}/>;
        case 'accessory_necklace': return <Award size={14} className={className || "text-cyan-400"}/>;
        default: return <Box size={14} className={className || "text-gray-500"}/>;
    }
};

// Skills are now imported from skillSystem.ts
// Helper function to get skill icon image path
const getSkillIconPath = (skill: Skill): string => {
    if (!skill) return '';
    const elementFolderMap: Record<string, string> = {
        'Fire': 'fire',
        'Ice': 'ice',
        'Lightning': 'lightning',
        'Wood': 'wood',
        'Void': 'void',
        'None': 'universal'
    };
    const folder = elementFolderMap[skill.element] || 'universal';
    return `/assets/combat/skills/${folder}/${skill.id.toLowerCase()}.png`;
};

const getSkillIcon = (skill: Skill) => {
    if (!skill) return '?';
    return skill.icon;
};

// --- MAIN APP COMPONENT ---
const App = () => {
  // === AUTHENTICATION ===
  const { user, loading: authLoading, signOut } = useAuth();
  
  // === PLAYER DATA FROM SUPABASE ===
  const { characterSlots, loading: playerDataLoading, saveCharacterSlots } = usePlayerData();
  
  // === GLOBAL SETTINGS ===
  const { settings: gameSettings } = useSettings();
  
  // === MUSIC ===
  const { playGameMusic, playLoginMusic, stopMusic } = useMusic();
  
  const statsConfig = [
    { id: 'str', label: "Ox Power", icon: <Sword size={14} />, color: "text-red-400", barColor: "bg-red-500" },
    { id: 'dex', label: "Wind Walk", icon: <Wind size={14} />, color: "text-emerald-400", barColor: "bg-emerald-500" },
    { id: 'con', label: "Golden Body", icon: <Shield size={14} />, color: "text-yellow-400", barColor: "bg-yellow-500" },
    { id: 'spi', label: "Dao Mind", icon: <Zap size={14} />, color: "text-cyan-400", barColor: "bg-cyan-500" },
    { id: 'wil', label: "Heart Demon", icon: <Flame size={14} />, color: "text-purple-400", barColor: "bg-purple-500" },
  ];

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<TabType>('world'); // Tab System
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [gameLog, setGameLog] = useState([{ text: "Welcome to the Path of Immortality.", type: "system" }]);
  const [inputValue, setInputValue] = useState("");
  const logEndRef = useRef(null);
  const [isAvatarModalOpen, setAvatarModalOpen] = useState(false);
  const [isMapOpen, setMapOpen] = useState(false);
  const [isSkillModalOpen, setSkillModalOpen] = useState(false);
  const [isQuestLogOpen, setIsQuestLogOpen] = useState(false); // Quest Log modal
  const [activeNPC, setActiveNPC] = useState<string | null>(null); // NPC Dialog
  const [inventoryTab, setInventoryTab] = useState(0);
  const [resetConfirmModal, setResetConfirmModal] = useState({ open: false, cost: 0, statsAllocated: 0 }); 
  const [isClassSelectorOpen, setClassSelectorOpen] = useState(false); // New: Class selector modal
  const [isCraftingModalOpen, setCraftingModalOpen] = useState(false); // New: Crafting modal
  const [isReforgingModalOpen, setReforgingModalOpen] = useState(false); // New: Reforging modal
  const [isSalvageModalOpen, setSalvageModalOpen] = useState(false); // New: Salvage modal
  const [selectedGearForReforge, setSelectedGearForReforge] = useState(null); // Gear to reforge
  const [selectedGearForSalvage, setSelectedGearForSalvage] = useState<any>(null); // Gear to salvage
  const [isTitlesModalOpen, setTitlesModalOpen] = useState(false); // Titles modal
  
  // LOOT PICKUP MODAL STATE
  const [lootModal, setLootModal] = useState<{
    isOpen: boolean;
    loot: any[];
    spiritStones: number;
    mobName: string;
  }>({ isOpen: false, loot: [], spiritStones: 0, mobName: '' });
  
  // DEATH PENALTY MODAL STATE
  const [deathModal, setDeathModal] = useState<{
    isOpen: boolean;
    penalty: {
      xpLost: number;
      xpPercent: number;
      durabilityLost: number;
      damagedGear: { slot: string; name: string; newDurability: number }[];
      killedBy: string;
    } | null;
  }>({ isOpen: false, penalty: null });
  
  // REPAIR MODAL STATE
  const [isRepairModalOpen, setRepairModalOpen] = useState(false);
  
  // FLEE CONFIRMATION MODAL STATE
  const [fleeModalOpen, setFleeModalOpen] = useState(false);
  
  // NEW FEATURE MODALS
  const [isAchievementsOpen, setAchievementsOpen] = useState(false);
  const [isLeaderboardOpen, setLeaderboardOpen] = useState(false);
  const [isChatOpen, setChatOpen] = useState(false);
  const [isChatMinimized, setChatMinimized] = useState(true);
  
  // AUTO-COMBAT STATE
  const [isAutoCombatActive, setAutoCombatActive] = useState(false);
  const autoCombatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startCombatRef = useRef<() => void>(() => {});
  
  // AUTO-COMBAT MODALS AND SETTINGS
  const [isAutoCombatSettingsOpen, setAutoCombatSettingsOpen] = useState(false);
  const [isAutoCombatSummaryOpen, setAutoCombatSummaryOpen] = useState(false);
  const [autoCombatSettings, setAutoCombatSettings] = useState<AutoCombatSettings>(defaultAutoCombatSettings);
  const [autoCombatSessionStats, setAutoCombatSessionStats] = useState<AutoCombatSessionStats>(emptySessionStats);
  const sessionStatsRef = useRef<AutoCombatSessionStats>(emptySessionStats);
  
  // BREAKTHROUGH SYSTEM
  
  // VFX SYSTEM
  const { spawnVFX, VFXLayer } = useVFXManager();
  
  // REWARD ANIMATION
  const { playRewardAnimation, RewardAnimationComponent } = useRewardAnimation();
  
  const [isBreakthroughModalOpen, setBreakthroughModalOpen] = useState(false);
  const [breakthroughPending, setBreakthroughPending] = useState(false);
  const [breakthroughPhase, setBreakthroughPhase] = useState<'idle' | 'preparing' | 'tribulation' | 'absorbing' | 'success'>('idle');
  const [breakthroughProgress, setBreakthroughProgress] = useState(0);
  
  // REFS FOR COMBAT LOOP (to avoid stale closures)
  const combatRef = useRef(null);
  const combatStatsRef = useRef<any>(null);
  const playerRef = useRef<any>(null);
  const isAutoCombatActiveRef = useRef(false);
  const autoCombatSettingsRef = useRef<AutoCombatSettings>(defaultAutoCombatSettings);
  const useSkillRef = useRef<(skillId: string) => void>(() => {});
  
  const [hoverItem, setHoverItem] = useState(null);
  const [mousePos, setMousePos] = useState({x:0, y:0});
  
  // PILL BUTTON TOOLTIP STATE
  const [pillTooltip, setPillTooltip] = useState<{ type: 'hp' | 'qi' | null; x: number; y: number }>({ type: null, x: 0, y: 0 });
  
  // SKILL HOTBAR TOOLTIP STATE
  const [skillTooltip, setSkillTooltip] = useState<{ skill: any | null; x: number; y: number }>({ skill: null, x: 0, y: 0 });
  
  // DEFENSE/ACTION TOOLTIP STATE
  const [actionTooltip, setActionTooltip] = useState<{ action: string | null; x: number; y: number }>({ action: null, x: 0, y: 0 });

  const [combat, setCombat] = useState(null);
  const [combatLog, setCombatLog] = useState([]);
  const combatLogRef = useRef(null);
  const [effectState, setEffectState] = useState<EffectState>(initEffectState());
  const [lastAttacker, setLastAttacker] = useState<'player' | 'enemy' | null>(null);
  const [passiveTriggers, setPassiveTriggers] = useState<Array<{id: string, icon: string, name: string}>>([]);
  const [combatRound, setCombatRound] = useState(1); // Real round counter
  
  // COMBO SYSTEM STATE
  const [comboProgress, setComboProgress] = useState<ComboProgress | null>(null);
  const [completedCombo, setCompletedCombo] = useState<SkillCombo | null>(null);
  const [comboBonusActive, setComboBonusActive] = useState<{
    type: string;
    value: number;
    used: boolean;
  } | null>(null);
  const [recentSkills, setRecentSkills] = useState<{ id: string; timestamp: number }[]>([]);
  
  // ====== DEFENSE SYSTEM ======
  const [activeDefense, setActiveDefense] = useState<'block' | 'dodge' | 'counter' | null>(null);
  const [blockCooldown, setBlockCooldown] = useState(0);
  const [dodgeCooldown, setDodgeCooldown] = useState(0);
  const [counterCooldown, setCounterCooldown] = useState(0);
  
  // COMBAT LOG CONTROL
  const [combatLogPaused, setCombatLogPaused] = useState(false);
  
  // COMBAT VISUAL FEEDBACK
  const [floatingDamage, setFloatingDamage] = useState<Array<{
    id: string;
    target: 'player' | 'enemy';
    value: number | string;
    type: 'damage' | 'heal' | 'crit' | 'miss' | 'dodge' | 'effect';
    color?: string;
    element?: ElementType;
  }>>([]);
  const [hitFlash, setHitFlash] = useState<{ player: boolean; enemy: boolean }>({ player: false, enemy: false });
  const [elementPopup, setElementPopup] = useState<{
    id: number;
    type: 'super' | 'resisted';
    element: ElementType;
    multiplier: number;
  } | null>(null);
  const [screenShake, setScreenShake] = useState(false);
  
  // COMBAT ANIMATIONS STATE
  const [combatAnimations, setCombatAnimations] = useState<{
    playerAttacking: boolean;
    enemyAttacking: boolean;
    playerSkillEffect: { element: ElementType; active: boolean } | null;
    enemyHit: boolean;
    playerHit: boolean;
    skillParticles: Array<{ id: number; element: ElementType; x: number; y: number }>;
  }>({
    playerAttacking: false,
    enemyAttacking: false,
    playerSkillEffect: null,
    enemyHit: false,
    playerHit: false,
    skillParticles: []
  });
  
  // Trigger attack animation
  const triggerAttackAnimation = (attacker: 'player' | 'enemy', element?: ElementType, isSkill?: boolean) => {
    if (attacker === 'player') {
      setCombatAnimations(prev => ({ 
        ...prev, 
        playerAttacking: true,
        playerSkillEffect: isSkill && element ? { element, active: true } : null
      }));
      
      // Add skill particles if it's a skill attack
      if (isSkill && element) {
        const particles = Array.from({ length: 8 }, (_, i) => ({
          id: Date.now() + i,
          element,
          x: Math.random() * 100 - 50,
          y: Math.random() * 100 - 50
        }));
        setCombatAnimations(prev => ({ ...prev, skillParticles: particles }));
        setTimeout(() => setCombatAnimations(prev => ({ ...prev, skillParticles: [] })), 800);
      }
      
      // Hit enemy after attack animation reaches target
      setTimeout(() => {
        setCombatAnimations(prev => ({ ...prev, enemyHit: true }));
        setTimeout(() => setCombatAnimations(prev => ({ ...prev, enemyHit: false })), 200);
        
        // === VFX SPAWN on ENEMY ===
        // Map element to VFX color (ElementType is PascalCase: 'Fire', 'Ice', etc.)
        let vfxColor: 'fire' | 'ice' | 'lightning' | 'poison' | 'void' | 'heal' = 'fire';
        const elementLower = element?.toLowerCase();
        if (elementLower === 'ice') vfxColor = 'ice';
        else if (elementLower === 'lightning') vfxColor = 'lightning';
        else if (elementLower === 'wood') vfxColor = 'heal';
        else if (elementLower === 'void') vfxColor = 'void';
        else if (elementLower === 'fire') vfxColor = 'fire';
        
        // Position near enemy sprite (right side, lower on screen where enemy is)
        const enemyX = window.innerWidth * 0.82;
        const enemyY = window.innerHeight * 0.65;
        
        console.log('[VFX] Player attack - spawning on enemy:', { element, elementLower, vfxColor, isSkill });
        
        // Always spawn VFX when player attacks (skill or basic attack)
        spawnVFX(isSkill ? 'explosion_medium' : 'slash_horizontal', enemyX, enemyY, { scale: 2.5, color: vfxColor });
      }, 250);
      
      setTimeout(() => setCombatAnimations(prev => ({ 
        ...prev, 
        playerAttacking: false,
        playerSkillEffect: null 
      })), 500);
    } else {
      setCombatAnimations(prev => ({ ...prev, enemyAttacking: true }));
      
      // Hit player after attack animation reaches target
      setTimeout(() => {
        setCombatAnimations(prev => ({ ...prev, playerHit: true }));
        setTimeout(() => setCombatAnimations(prev => ({ ...prev, playerHit: false })), 200);
        
        // === VFX SPAWN on PLAYER (when enemy hits us) ===
        const playerX = window.innerWidth * 0.18;
        const playerY = window.innerHeight * 0.65;
        spawnVFX('impact_hit', playerX, playerY, { scale: 2, color: 'fire' });
      }, 250);
      
      setTimeout(() => setCombatAnimations(prev => ({ ...prev, enemyAttacking: false })), 500);
    }
  };
  
  // TOAST NOTIFICATIONS
  const { toasts, addToast, removeToast } = useToast();
  
  // Helper to show element popup
  const showElementPopup = (type: 'super' | 'resisted', element: ElementType, multiplier: number) => {
    const id = Date.now();
    setElementPopup({ id, type, element, multiplier });
    setTimeout(() => setElementPopup(null), 1500);
  };
  
  // Helper to add floating damage
  const addFloatingDamage = (target: 'player' | 'enemy', value: number | string, type: 'damage' | 'heal' | 'crit' | 'miss' | 'dodge' | 'effect', color?: string, element?: ElementType) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setFloatingDamage(prev => [...prev, { id, target, value, type, color, element }]);
    setTimeout(() => {
      setFloatingDamage(prev => prev.filter(d => d.id !== id));
    }, 1500);
  };
  
  // Helper to trigger hit flash
  const triggerHitFlash = (target: 'player' | 'enemy') => {
    setHitFlash(prev => ({ ...prev, [target]: true }));
    setTimeout(() => setHitFlash(prev => ({ ...prev, [target]: false })), 300);
  };

  // Helper to trigger screen shake
  const triggerScreenShake = (intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
    const combatArena = document.getElementById('combat-arena');
    if (!combatArena) return;
    
    const shakeClass = `animate-shake-${intensity}`;
    combatArena.classList.add(shakeClass);
    
    const duration = intensity === 'light' ? 300 : intensity === 'medium' ? 500 : 800;
    setTimeout(() => {
      combatArena.classList.remove(shakeClass);
    }, duration);
  };

  // Helper to trigger element burst effect
  const triggerElementBurst = (element: ElementType) => {
    const combatArena = document.getElementById('combat-arena');
    if (!combatArena) return;
    
    const elementMap: Record<ElementType, string> = {
      'fire': 'animate-fire-burst',
      'ice': 'animate-ice-burst',
      'wood': 'animate-wood-burst',
      'lightning': 'animate-lightning-burst',
      'void': 'animate-void-burst',
    };
    
    const burstClass = elementMap[element];
    if (burstClass) {
      combatArena.classList.add(burstClass);
      setTimeout(() => {
        combatArena.classList.remove(burstClass);
      }, 600);
    }
  };

  // Helper to show element advantage indicator
  const showElementAdvantage = (advantage: number) => {
    if (advantage > 1) {
      const bonus = Math.round((advantage - 1) * 100);
      addFloatingDamage('enemy', `+${bonus}%`, 'effect', '#fbbf24');
    } else if (advantage < 1) {
      const penalty = Math.round((1 - advantage) * 100);
      addFloatingDamage('enemy', `-${penalty}%`, 'effect', '#9ca3af');
    }
  };

  const initialPlayerState = {
    name: "", // Empty - will be set in character creation
    title: "Outer Disciple",
    level: 1,
    realm: "Qi Condensation",
    hp: 100, maxHp: 100,
    qi: 30, maxQi: 50,
    exp: 0,
    ap: 4,
    totalAPEarned: 4,
    baseStats: { str: 10, dex: 10, con: 10, spi: 10, wil: 10 },
    avatar: avatarList[0],
    stats: { str: 10, dex: 10, con: 10, spi: 10, wil: 10 },
    // 3-Slot Equipment System (Weapon + Accessories)
    equipment: {
      weapon: null,    // Main weapon (Sword/Saber/Zither)
      ring: null,      // Accessory ring
      necklace: null,  // Accessory necklace
    },
    skills: ['', '', '', ''], // 4 hotbar slots
    learnedSkills: [], // Skills player has unlocked
    skillCooldowns: {}, // Track cooldowns: { skillId: ticksRemaining }
    unlockedUltimates: [], // Ultimate skills obtained via quest/drop
    spiritStones: 0,
    contribution: 0,
    visited: ["0,0"],
    lastCombatTime: 0,
    isMeditating: false,
    selectedClass: null, // Track selected hybrid class
    passiveState: null, // Passive state tracking
    pityState: createInitialPityState(), // Pity system for anti-frustration
    killCounter: {}, // Track kills per mob for bestiary
    bestiaryProgress: { // Bestiary rewards tracking
      claimedDiscovery: [],
      claimedMobMilestones: {},
      claimedRealmMastery: [],
      claimedTagMastery: {},
    },
    tutorialCompleted: false, // Track if tutorial has been completed
    characterCreated: false, // Track if character has been created
    inventory: [
      // Starter consumables for new players
      { id: 'starter_hp_pill', name: 'HP Restoring Pill', type: 'consumable', count: 3, effect: 'hp', amount: 50, iconType: 'hp_pill', desc: 'Restores 50 HP instantly.', rarity: 'Common', tier: 1 },
      { id: 'starter_qi_pill', name: 'QI Restoring Pill', type: 'consumable', count: 2, effect: 'qi', amount: 30, iconType: 'qi_pill', desc: 'Restores 30 QI instantly.', rarity: 'Common', tier: 1 },
    ],
    bank: [],
    questLog: createDefaultQuestLog(), // Quest system
    cultivationProgress: createInitialCultivationProgress(), // Daily rewards & milestones
    // Auto-Combat System
    autoCombatTimeUsedToday: 0, // Seconds of auto-combat used today
    autoCombatLastReset: Date.now(), // Timestamp of last daily reset
    // Titles System
    titleState: createDefaultTitleState(), // Player's unlocked titles and active title
    // Stats for title tracking
    totalKills: 0,           // Total kills for title tracking
    bossKills: 0,            // Boss kills for title tracking
    totalCrafts: 0,          // Total crafts for title tracking
    itemsCollected: 0,       // Items collected for title tracking
    totalSpiritStonesEarned: 0, // Total spirit stones earned
    deaths: 0,               // Total deaths
    immortalCrafts: 0,       // Immortal grade items crafted
  };

  // Player state - starts with initial state, will be populated from Supabase character selection
  const [player, setPlayer] = useState(initialPlayerState);

  // Helper function to apply hybrid class stats
  const selectHybridClass = (classId) => {
      const selectedClass = hybridClassSystem.find(c => c.id === classId);
      if (!selectedClass) return;
      
      // Initialize passive state for the selected class
      const passiveState = initPassiveState(classId, selectedClass.passive.name);
      
      // Get default hotbar for this class at player's level
      const defaultHotbar = getDefaultHotbar(classId, player.level || 1);
      
      // Get learned skills (tier 1-3 based on level)
      const classSkills = getClassSkills(classId);
      const learnedSkills = classSkills
          .filter(s => s.tier <= 3 && s.unlockLevel <= (player.level || 1))
          .map(s => s.id);
      
      setPlayer(p => ({
          ...p,
          selectedClass: classId,
          passiveState: passiveState,
          skills: defaultHotbar,
          learnedSkills: learnedSkills,
          skillCooldowns: {},
          // NO automatic gear assignment - player must find/loot equipment
      }));
      
      setClassSelectorOpen(false);
  };

  // ========================================
  // CHARACTER CREATION & TUTORIAL HANDLERS
  // ========================================
  
  // === GAME STATE MACHINE ===
  // States: 'loading' | 'character-select' | 'character-creation' | 'tutorial' | 'game'
  const [gameState, setGameState] = useState<'loading' | 'character-select' | 'character-creation' | 'tutorial' | 'game'>('loading');
  const [gameStateInitialized, setGameStateInitialized] = useState(false);
  
  // Initialize game state based on auth and player data - ONLY ONCE
  useEffect(() => {
    // Don't run if already initialized by user action
    if (gameStateInitialized) {
      return;
    }
    
    // Still loading auth
    if (authLoading) {
      setGameState('loading');
      return;
    }
    
    // Not logged in - will show login page (don't need to change gameState)
    if (!user) {
      // Just ensure we're not stuck in loading
      setGameState('loading');
      return;
    }
    
    // User logged in but player data still loading
    if (playerDataLoading) {
      setGameState('loading');
      return;
    }
    
    // User is logged in and data loaded - decide what to show
    if (characterSlots && characterSlots.length > 0) {
      // Has characters - show selection
      setGameState('character-select');
    } else {
      // No characters - go to creation
      setGameState('character-creation');
    }
  }, [playerDataLoading, authLoading, user, characterSlots, gameStateInitialized]);

  // === MUSIC TRANSITIONS ===
  // Handle music based on game state
  useEffect(() => {
    if (gameState === 'game') {
      playGameMusic();
    } else if (gameState === 'character-select' || gameState === 'character-creation') {
      // Ensure login music continues playing during character screens
      // Only start if not already playing (check isPlaying to avoid restart)
      playLoginMusic();
    }
  }, [gameState, playGameMusic, playLoginMusic]);

  const handleCharacterCreation = async (characterData: { name: string; avatar: string; selectedClass: number }) => {
    const selectedClass = hybridClassSystem.find(c => c.id === characterData.selectedClass);
    const passiveState = selectedClass ? initPassiveState(characterData.selectedClass, selectedClass.passive.name) : null;
    
    // Get default hotbar for this class
    const defaultHotbar = getDefaultHotbar(characterData.selectedClass, 1);
    
    // Get learned skills for this class at level 1
    const classSkills = getClassSkills(characterData.selectedClass);
    const learnedSkills = classSkills
      .filter(s => s.tier <= 1 && s.unlockLevel <= 1)
      .map(s => s.id);
    
    // Apply starter kit (equipment, consumables, spirit stones)
    const starterKit = getStarterKitByClassId(characterData.selectedClass);
    
    const newPlayer = {
      ...initialPlayerState,
      name: characterData.name,
      avatar: characterData.avatar,
      selectedClass: characterData.selectedClass,
      passiveState: passiveState,
      characterCreated: true,
      tutorialCompleted: false,
      // Apply starter equipment (weapon, ring, necklace)
      equipment: {
        weapon: { ...starterKit.weapon, id: `${starterKit.weapon.id}_${Date.now()}` },
        ring: { ...STARTER_RING, id: `${STARTER_RING.id}_${Date.now()}` },
        necklace: { ...STARTER_NECKLACE, id: `${STARTER_NECKLACE.id}_${Date.now()}` },
      },
      // Apply starter inventory (consumables only)
      inventory: [
        ...starterKit.consumables.map((item, i) => ({ ...item, id: `${item.id}_${Date.now()}_${i}` })),
      ],
      // Apply starter spirit stones
      spiritStones: starterKit.spiritStones,
      // Apply class skills
      skills: defaultHotbar,
      learnedSkills: learnedSkills,
      // Auto-accept tutorial quest for new players
      questLog: createQuestLogWithTutorial('tutorial_001'),
    };
    
    setPlayer(newPlayer);
    
    // Create new character slot
    const newCharSlot = {
      id: `char_${Date.now()}`,
      name: characterData.name,
      avatar: characterData.avatar,
      level: 1,
      realm: "Qi Condensation",
      selectedClass: characterData.selectedClass,
      spiritStones: starterKit.spiritStones,
      playTime: 0,
      lastPlayed: Date.now(),
      saveData: newPlayer,
    };
    
    // Add to existing slots or create new array
    const updatedSlots = characterSlots ? [...characterSlots, newCharSlot] : [newCharSlot];
    await saveCharacterSlots(updatedSlots);
    
    // Show tutorial after character creation
    setGameState('tutorial');
    
    addLog(`Welcome, ${characterData.name}! Your journey on the Path of Immortality begins...`, "system");
  };

  const handleTutorialComplete = () => {
    setPlayer(p => ({ ...p, tutorialCompleted: true }));
    setGameState('game');
    addLog("Tutorial completed! Explore the world and grow stronger!", "success");
  };

  const handleTutorialSkip = () => {
    setPlayer(p => ({ ...p, tutorialCompleted: true }));
    setGameState('game');
    addLog("Tutorial skipped. Good luck, cultivator!", "system");
  };

  // Handle selecting an existing character from the selection screen
  const handleSelectCharacter = (saveData: any) => {
    // Mark as initialized to prevent useEffect from overriding
    setGameStateInitialized(true);
    
    // Migrate player stats to new level scaling system if needed
    const migratedData = migratePlayerStats(saveData);
    
    // Load the character data
    setPlayer({
      ...migratedData,
      characterCreated: true,
    });
    
    // Go to game (skip tutorial if already completed or undefined)
    if (saveData?.tutorialCompleted !== false) {
      setGameState('game');
    } else {
      setGameState('tutorial');
    }
    addLog(`Welcome back, ${saveData.name}! Continue your path to immortality.`, "system");
    
    // Show migration notification if stats were updated
    if (migratedData.maxHp > (saveData.maxHp || 0) || migratedData.maxQi > (saveData.maxQi || 0)) {
      addLog(`⚡ Your cultivation base has been enhanced! Max HP: ${migratedData.maxHp}, Max QI: ${migratedData.maxQi}`, 'success');
    }
  };

  // Handle creating a new character from selection screen
  const handleCreateNewCharacter = () => {
    // Mark as initialized to prevent useEffect from overriding
    setGameStateInitialized(true);
    
    // Reset player to initial state
    setPlayer({
      ...initialPlayerState,
      characterCreated: false,
    });
    setGameState('character-creation');
  };

  // Handle returning to character selection from game
  const handleReturnToCharacterSelect = async () => {
    // Save current character first
    if (player.characterCreated && characterSlots) {
      const updatedSlots = characterSlots.map(slot => {
        if (slot.name === player.name) {
          return {
            ...slot,
            level: player.level,
            realm: player.realm,
            spiritStones: player.spiritStones,
            lastPlayed: Date.now(),
            saveData: player,
          };
        }
        return slot;
      });
      await saveCharacterSlots(updatedSlots);
    }
    
    // Reset player and go to selection
    setPlayer(initialPlayerState);
    setGameStateInitialized(false); // Allow useEffect to control state again
    setGameState('character-select');
  };

  // Global Settings Menu State
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  
  // Admin Panel State
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  
  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      const adminStatus = await isAdmin();
      setIsUserAdmin(adminStatus);
    };
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  // Save player data to Supabase (cloud persistence) - only when in game
  useEffect(() => {
      // Only sync with Supabase if we're in game state and character is created
      if (gameState === 'game' && player.characterCreated && user && characterSlots && characterSlots.length > 0) {
        const updatedSlots = characterSlots.map(slot => {
          if (slot.name === player.name) {
            return {
              ...slot,
              level: player.level,
              realm: player.realm,
              spiritStones: player.spiritStones,
              lastPlayed: Date.now(),
              saveData: player,
            };
          }
          return slot;
        });
        
        // Debounce save to Supabase (avoid too many updates)
        const timeoutId = setTimeout(() => {
          saveCharacterSlots(updatedSlots);
        }, 2000); // Save after 2 seconds of inactivity
        
        return () => clearTimeout(timeoutId);
      }
  }, [player, user, gameState]);

  // Sync reach_level quest objectives with current player level on load and level change
  useEffect(() => {
      if (player.questLog && player.level) {
          // This mutates questLog directly, then we trigger a save
          syncLevelObjectives(player.level, player.questLog, allQuests);
          // Force update to persist the synced objectives
          setPlayer(p => ({ ...p }));
      }
  }, [player.level, player.questLog]);

  // First Daily Login Check - Open Cultivation Tab
  // This runs once when entering game state to show daily rewards
  useEffect(() => {
    if (gameState !== 'game' || !player.characterCreated) return;
    
    const today = new Date().toISOString().split('T')[0];
    const cultivationProgress = player.cultivationProgress;
    
    // Check if this is a new day login
    if (!cultivationProgress?.lastLoginDate || cultivationProgress.lastLoginDate !== today) {
      // Update the last login date and increment streak
      setPlayer(p => {
        const progress = p.cultivationProgress || createInitialCultivationProgress();
        const lastLogin = progress.lastLoginDate;
        let newConsecutive = progress.consecutiveLogins || 0;
        let streakBroken = false;
        
        if (lastLogin) {
          const lastDate = new Date(lastLogin);
          const todayDate = new Date(today);
          const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            // Consecutive day - increment (cycle at 28)
            newConsecutive = (newConsecutive % 28) + 1;
          } else if (diffDays > 1) {
            // Streak broken - reset to 1
            newConsecutive = 1;
            streakBroken = true;
          }
        } else {
          // First ever login
          newConsecutive = 1;
        }
        
        return {
          ...p,
          cultivationProgress: {
            ...progress,
            lastLoginDate: today,
            consecutiveLogins: newConsecutive,
            totalLogins: (progress.totalLogins || 0) + 1,
          },
        };
      });
      
      // Open cultivation tab to show daily rewards
      setActiveTab('map');
      addToast('🎁 Daily rewards available! Check your Cultivation Path!', 'success');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, player.characterCreated]); // Run once when entering game

  // --- PASSIVE RECOVERY SYSTEM ---
  useEffect(() => {
    if (combat && combat.active) return;
    
    const recoveryInterval = setInterval(() => {
      setPlayer(p => {
        const timeSinceCombat = Date.now() - p.lastCombatTime;
        const isOutOfCombat = timeSinceCombat > 5000;
        
        if (isOutOfCombat && !p.isMeditating) {
          const hpRecovery = Math.ceil(p.maxHp * 0.02);
          const qiRecovery = Math.ceil(p.maxQi * 0.03);
          return {
            ...p,
            hp: Math.min(p.hp + hpRecovery, p.maxHp),
            qi: Math.min(p.qi + qiRecovery, p.maxQi)
          };
        }
        return p;
      });
    }, 2000);
    
    return () => clearInterval(recoveryInterval);
  }, [combat]);

  // --- DAILY LOGIN CHECK ---
  // Check if this is the first login of the day and open Cultivation tab
  useEffect(() => {
    if (gameState !== 'game' || !player.characterCreated) return;
    
    const today = new Date().toISOString().split('T')[0];
    const cultivationProgress = player.cultivationProgress || createInitialCultivationProgress();
    const lastLoginDate = cultivationProgress.lastLoginDate || '';
    
    // If this is the first login today, open Cultivation tab and update login streak
    if (lastLoginDate !== today) {
      // Calculate if streak is broken (more than 1 day since last login)
      const isNewStreak = !lastLoginDate || (() => {
        const lastDate = new Date(lastLoginDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 1;
      })();
      
      const newConsecutive = isNewStreak ? 1 : Math.min(28, (cultivationProgress.consecutiveLogins || 0) + 1);
      
      setPlayer(p => ({
        ...p,
        cultivationProgress: {
          ...cultivationProgress,
          lastLoginDate: today,
          consecutiveLogins: newConsecutive,
          totalLogins: (cultivationProgress.totalLogins || 0) + 1,
        },
      }));
      
      // Switch to Cultivation tab to show daily rewards
      setActiveTab('map'); // 'map' is the id, now shows Cultivation
      
      addToast(`🌅 Welcome back! Day ${newConsecutive} streak - claim your reward!`, 'success', 5000);
      addLog(`🌅 Daily login: Day ${newConsecutive} of your cultivation streak!`, 'success');
    }
  }, [gameState, player.characterCreated]);

  // --- AUTO-COMBAT SYSTEM ---
  // Check for daily reset of auto-combat time
  useEffect(() => {
    const now = Date.now();
    const lastReset = player.autoCombatLastReset || 0;
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    // Only reset if lastReset was set (player has used auto-combat before)
    // and it's been more than 24 hours since last reset
    if (lastReset > 0 && now - lastReset >= oneDayMs) {
      setPlayer(p => ({
        ...p,
        autoCombatTimeUsedToday: 0,
        autoCombatLastReset: now
      }));
      addLog('🌅 Daily auto-combat time reset! You have 30 minutes available.', 'success');
    }
  }, [player.autoCombatLastReset]);

  // Auto-combat session management
  const startAutoCombatSession = () => {
    // Check if player has exceeded daily limit
    if ((player.autoCombatTimeUsedToday || 0) >= DAILY_AUTO_COMBAT_SECONDS) {
      addToast('Daily auto-combat limit reached! Wait until tomorrow.', 'warning');
      return;
    }
    
    const newSession: AutoCombatSessionStats = {
      startTime: Date.now(),
      endTime: 0,
      totalKills: 0,
      totalExpGained: 0,
      totalSpiritStones: 0,
      lootCollected: [],
      levelsGained: 0,
      deaths: 0,
      bossesKilled: 0,
      stopReason: 'manual',
    };
    sessionStatsRef.current = newSession;
    setAutoCombatSessionStats(newSession);
    setAutoCombatActive(true);
    setAutoCombatSettingsOpen(false);
    
    // Initialize autoCombatLastReset if not set
    if (!player.autoCombatLastReset) {
      setPlayer(p => ({ ...p, autoCombatLastReset: Date.now() }));
    }
    
    addToast('Auto-combat started!', 'info');
    addLog('🔄 Auto-combat session started. Farming in progress...', 'info');
  };
  
  const stopAutoCombatSession = (reason: AutoCombatSessionStats['stopReason'] = 'manual') => {
    setAutoCombatActive(false);
    const finalStats = {
      ...sessionStatsRef.current,
      endTime: Date.now(),
      stopReason: reason,
    };
    setAutoCombatSessionStats(finalStats);
    setAutoCombatSummaryOpen(true);
    addLog(`⏹️ Auto-combat session ended: ${reason}`, 'info');
  };
  
  // Helper to track kills during auto-combat
  const trackAutoCombatKill = (mobName: string, exp: number, stones: number, loot: any[], isBoss: boolean) => {
    if (!isAutoCombatActive) return;
    
    sessionStatsRef.current = {
      ...sessionStatsRef.current,
      totalKills: sessionStatsRef.current.totalKills + 1,
      totalExpGained: sessionStatsRef.current.totalExpGained + exp,
      totalSpiritStones: sessionStatsRef.current.totalSpiritStones + stones,
      bossesKilled: sessionStatsRef.current.bossesKilled + (isBoss ? 1 : 0),
      lootCollected: [
        ...sessionStatsRef.current.lootCollected,
        ...loot.map(item => ({
          id: item.id,
          name: item.name,
          count: item.count || 1,
          rarity: item.rarity || 'Common',
          iconType: item.iconType,
        })),
      ],
    };
  };
  
  // Helper to track level ups during auto-combat
  const trackAutoCombatLevelUp = () => {
    if (!isAutoCombatActive) return;
    sessionStatsRef.current = {
      ...sessionStatsRef.current,
      levelsGained: sessionStatsRef.current.levelsGained + 1,
    };
    
    // Check if should pause on level up (use ref for latest value)
    if (autoCombatSettingsRef.current.pauseOnLevelUp) {
      stopAutoCombatSession('levelUp');
      addToast('🎉 Level Up! Auto-combat paused.', 'success', 4000);
    }
  };

  // Auto-combat time tracking
  useEffect(() => {
    if (!isAutoCombatActive) return;
    
    const timeTracker = setInterval(() => {
      setPlayer(p => {
        const newTimeUsed = (p.autoCombatTimeUsedToday || 0) + 1;
        
        // Check if time limit reached
        if (newTimeUsed >= DAILY_AUTO_COMBAT_SECONDS) {
          stopAutoCombatSession('timer');
          addToast('Auto-combat daily limit reached!', 'warning');
          addLog('⏱️ Auto-combat daily limit reached. Use scrolls to extend or wait until tomorrow.', 'warning');
          return { ...p, autoCombatTimeUsedToday: DAILY_AUTO_COMBAT_SECONDS };
        }
        
        return { ...p, autoCombatTimeUsedToday: newTimeUsed };
      });
    }, 1000);
    
    return () => clearInterval(timeTracker);
  }, [isAutoCombatActive]);

  // Auto-combat loop - automatically starts new fights
  useEffect(() => {
    if (!isAutoCombatActive) {
      if (autoCombatIntervalRef.current) {
        clearInterval(autoCombatIntervalRef.current);
        autoCombatIntervalRef.current = null;
      }
      return;
    }
    
    // Check for zone with enemies
    const key = `${coords.x},${coords.y}`;
    const hasMobs = bestiaryMap[key] && bestiaryMap[key].length > 0;
    
    if (!hasMobs) {
      stopAutoCombatSession('manual');
      addToast('No enemies in this zone!', 'warning');
      return;
    }
    
    // Start immediately if not in combat
    if (!combat || !combat.active) {
      // Small delay to let React state settle
      setTimeout(() => startCombatRef.current(), 100);
    }
    
    // Calculate interval based on speed setting (1x = 3s, 2x = 1.5s)
    const speedMultiplier = gameSettings.autoCombatSpeed === 'fast' ? 2 : 1;
    const intervalMs = 3000 / speedMultiplier;
    
    autoCombatIntervalRef.current = setInterval(() => {
      // Use refs to get current values to avoid stale closures
      const settings = autoCombatSettingsRef.current;
      
      setPlayer(currentPlayer => {
        // Check HP threshold - don't auto-start if too low
        const lowHpThreshold = settings.lowHpThreshold / 100;
        if (settings.stopOnLowHp && currentPlayer.hp < (currentPlayer.maxHp || 100) * lowHpThreshold) {
          stopAutoCombatSession('lowHp');
          addToast('Auto-combat paused - HP too low!', 'warning');
          addLog('⚠️ Auto-combat paused. Heal before continuing.', 'warning');
          return currentPlayer;
        }
        
        // Auto-pot logic - apply directly in state update to avoid conflicts
        if (settings.autoPotEnabled) {
          const hpPercent = (currentPlayer.hp / (currentPlayer.maxHp || 100)) * 100;
          const qiPercent = (currentPlayer.qi / (currentPlayer.maxQi || 50)) * 100;
          
          let newHp = currentPlayer.hp;
          let newQi = currentPlayer.qi;
          let newInventory = [...(currentPlayer.inventory || [])];
          let usedPill = false;
          
          // Auto-use HP pill if below threshold
          if (hpPercent < settings.autoPotHpThreshold) {
            const hpPillIdx = newInventory.findIndex((item: any) => 
              (item.type === 'consumable' && item.effect === 'hp' && (item.count || 0) > 0) ||
              (item.name === 'HP Restoring Pill' && (item.count || 0) > 0)
            );
            if (hpPillIdx !== -1) {
              const pill = newInventory[hpPillIdx];
              const healAmount = pill.amount || 50;
              newHp = Math.min(currentPlayer.hp + healAmount, currentPlayer.maxHp || 100);
              
              // Reduce pill count
              newInventory[hpPillIdx] = { ...pill, count: (pill.count || 1) - 1 };
              if (newInventory[hpPillIdx].count <= 0) {
                newInventory.splice(hpPillIdx, 1);
              }
              
              usedPill = true;
              addLog(`💊 Auto-pot: Used ${pill.name}! +${healAmount} HP`, 'success');
            }
          }
          
          // Auto-use QI pill if below threshold
          if (qiPercent < settings.autoPotQiThreshold) {
            const qiPillIdx = newInventory.findIndex((item: any) => 
              (item.type === 'consumable' && item.effect === 'qi' && (item.count || 0) > 0) ||
              (item.name === 'QI Restoring Pill' && (item.count || 0) > 0)
            );
            if (qiPillIdx !== -1) {
              const pill = newInventory[qiPillIdx];
              const restoreAmount = pill.amount || 30;
              newQi = Math.min(currentPlayer.qi + restoreAmount, currentPlayer.maxQi || 50);
              
              // Reduce pill count
              newInventory[qiPillIdx] = { ...pill, count: (pill.count || 1) - 1 };
              if (newInventory[qiPillIdx].count <= 0) {
                newInventory.splice(qiPillIdx, 1);
              }
              
              usedPill = true;
              addLog(`💊 Auto-pot: Used ${pill.name}! +${restoreAmount} QI`, 'success');
            }
          }
          
          // If we used pills, update stats in session
          if (usedPill) {
            sessionStatsRef.current = {
              ...sessionStatsRef.current,
              pillsUsed: (sessionStatsRef.current.pillsUsed || 0) + 1,
            };
            
            // Return updated player with new hp/qi/inventory
            currentPlayer = {
              ...currentPlayer,
              hp: newHp,
              qi: newQi,
              inventory: newInventory,
            };
          }
        }
        
        // Check time remaining
        if ((currentPlayer.autoCombatTimeUsedToday || 0) >= DAILY_AUTO_COMBAT_SECONDS) {
          stopAutoCombatSession('timer');
          return currentPlayer;
        }
        
        return currentPlayer;
      });
      
      // Check combat state and start if needed
      setCombat(currentCombat => {
        if (!currentCombat || !currentCombat.active) {
          // Use timeout to avoid state update during render
          setTimeout(() => startCombatRef.current(), 100);
        }
        return currentCombat;
      });
    }, intervalMs);
    
    return () => {
      if (autoCombatIntervalRef.current) {
        clearInterval(autoCombatIntervalRef.current);
        autoCombatIntervalRef.current = null;
      }
    };
  }, [isAutoCombatActive, coords, autoCombatSettings, gameSettings.autoCombatSpeed]);

  // Stop auto-combat on death
  useEffect(() => {
    if (deathModal.isOpen && isAutoCombatActive) {
      sessionStatsRef.current = {
        ...sessionStatsRef.current,
        deaths: sessionStatsRef.current.deaths + 1,
      };
      stopAutoCombatSession('death');
      addLog('⚠️ Auto-combat stopped due to death.', 'warning');
    }
  }, [deathModal.isOpen, isAutoCombatActive]);

  // Calculate remaining auto-combat time
  const autoCombatTimeRemaining = useMemo(() => {
    const used = player.autoCombatTimeUsedToday || 0;
    return Math.max(0, DAILY_AUTO_COMBAT_SECONDS - used);
  }, [player.autoCombatTimeUsedToday]);

  const formatAutoCombatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
        // Don't trigger hotkeys when typing in input fields
        const activeElement = document.activeElement;
        const isTyping = activeElement && (
            activeElement.tagName === 'INPUT' || 
            activeElement.tagName === 'TEXTAREA' || 
            activeElement.getAttribute('contenteditable') === 'true'
        );
        
        if (isTyping) return;
        
        // Map hotkey (M)
        if (e.key.toLowerCase() === 'm') {
            setMapOpen(prev => !prev);
        }
        // Quest Log hotkey (Q)
        if (e.key.toLowerCase() === 'q' && !combat) {
            setIsQuestLogOpen(prev => !prev);
        }
        // Skill hotkeys (1-4) during combat
        if (combat && combat.active && ['1', '2', '3', '4'].includes(e.key)) {
            const slotIndex = parseInt(e.key) - 1;
            const skillId = player.skills[slotIndex];
            if (skillId) {
                const skill = getSkillById(skillId);
                const cooldown = player.skillCooldowns?.[skillId] || 0;
                const hasEnoughQi = skill && combat.playerQi >= skill.qiCost;
                if (skill && hasEnoughQi && cooldown === 0) {
                    useSkill(skillId);
                }
            }
        }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [combat, player.skills, player.skillCooldowns]);

  // ========================================
  // QUEST SPECIAL ACTION TRACKING
  // Track tab changes for tutorial quest validation
  // ========================================
  useEffect(() => {
    if (!player.questLog?.active || player.questLog.active.length === 0) return;
    
    // Map tab names to special action IDs
    const tabActionMap: Record<string, string[]> = {
      'character': ['view_character'],
      'forge': ['visit_forge'],
    };
    
    const actionIds = tabActionMap[activeTab];
    if (!actionIds) return;
    
    // Also trigger check_gear if on character tab and has weapon equipped
    if (activeTab === 'character' && player.equipment?.weapon) {
      actionIds.push('check_gear');
    }
    
    actionIds.forEach(actionId => {
      const updates = onSpecialAction(actionId, player.questLog, allQuests);
      if (updates.length > 0) {
        setPlayer(p => {
          const newQuestLog = { ...p.questLog };
          newQuestLog.active = newQuestLog.active.map(state => {
            const update = updates.find(u => u.questId === state.questId);
            if (update) {
              return {
                ...state,
                objectives: {
                  ...state.objectives,
                  [update.objectiveId]: update.newProgress
                }
              };
            }
            return state;
          });
          return { ...p, questLog: newQuestLog };
        });
        
        // Show notification for completed objective
        updates.forEach(update => {
          const quest = allQuests.find(q => q.id === update.questId);
          const obj = quest?.objectives.find(o => o.id === update.objectiveId);
          if (obj) {
            addToast(`✅ ${obj.description}`, 'success');
          }
        });
      }
    });
  }, [activeTab]);

  // Helper to trigger special actions manually (for check_gear when viewing equipment)
  const triggerSpecialAction = (actionId: string) => {
    if (!player.questLog?.active || player.questLog.active.length === 0) return;
    
    const updates = onSpecialAction(actionId, player.questLog, allQuests);
    if (updates.length > 0) {
      setPlayer(p => {
        const newQuestLog = { ...p.questLog };
        newQuestLog.active = newQuestLog.active.map(state => {
          const update = updates.find(u => u.questId === state.questId);
          if (update) {
            return {
              ...state,
              objectives: {
                ...state.objectives,
                [update.objectiveId]: update.newProgress
              }
            };
          }
          return state;
        });
        return { ...p, questLog: newQuestLog };
      });
      
      updates.forEach(update => {
        const quest = allQuests.find(q => q.id === update.questId);
        const obj = quest?.objectives.find(o => o.id === update.objectiveId);
        if (obj) {
          addToast(`✅ ${obj.description}`, 'success');
        }
      });
    }
  };

  const hardReset = () => {
      if(confirm("Are you sure? This deletes your save.")) {
          localStorage.removeItem('wuxia_player_v25');
          localStorage.removeItem('wuxia_player_v26');
          setPlayer(initialPlayerState);
          window.location.reload();
      }
  };

  const getCurrentLocation = () => worldMap[`${coords.x},${coords.y}`] || { name: "The Void", tier: 3, quality: 0, desc: "You are lost.", img: zoneImages.westRuins, exits: [] };

  const totalStats = useMemo(() => {
      let totals = { ...player.stats };
      
      // Add level bonus stats from scaling system
      const levelBonus = player.levelBonusStats || { str: 0, dex: 0, con: 0, spi: 0, wil: 0 };
      totals.str += levelBonus.str || 0;
      totals.dex += levelBonus.dex || 0;
      totals.con += levelBonus.con || 0;
      totals.spi += levelBonus.spi || 0;
      totals.wil += levelBonus.wil || 0;
      
      // Add stats from NEW equipment system (6 slots)
      const equipment = player.equipment || {};
      Object.values(equipment).forEach((item: any) => {
        if (item && item.stats) {
          // Get rarity multiplier (default to 1.0 for items without rarity)
          const rarityMultiplier = item.rarity ? getRarityMultiplier(item.rarity as ItemRarity) : 1.0;
          
          Object.entries(item.stats).forEach(([stat, value]) => {
            if (totals[stat] !== undefined) {
              // Apply rarity multiplier to stats
              totals[stat] += Math.floor((value as number) * rarityMultiplier);
            }
          });
        }
      });
      
      return totals;
  }, [player.stats, player.equipment, player.levelBonusStats]);

  // Get class primary stat for damage scaling
  const getPrimaryStatMultiplier = (classId: number, stats: any) => {
    // Get the class's primary stat template
    const template = classStatTemplates[classId] || classStatTemplates[1];
    
    // Find the highest stat in the template (primary stat for this class)
    const statKeys = ['str', 'dex', 'con', 'spi', 'wil'] as const;
    let primaryStat = 'str';
    let maxValue = 0;
    
    for (const key of statKeys) {
      if (template[key] > maxValue) {
        maxValue = template[key];
        primaryStat = key;
      }
    }
    
    // Return bonus damage based on how much the player has invested in their class's primary stat
    // Each point in primary stat gives 1.2x scaling, secondary stats give 0.8x
    return {
      primaryStat,
      primaryValue: stats[primaryStat] || 0,
      bonus: Math.floor((stats[primaryStat] || 0) * 0.3) // +0.3 damage per primary stat point
    };
  };

  // Calculate secondary stat bonuses from equipment
  const secondaryStatBonuses = useMemo(() => {
    const bonuses = {
      critChance: 0,
      critDamage: 0,
      hpBonus: 0,
      qiBonus: 0,
      dodge: 0,
      block: 0,
      lifeSteal: 0,
      qiRegen: 0,
      damageReduction: 0,
    };
    
    const equipment = player.equipment || {};
    Object.values(equipment).forEach((item: any) => {
      if (item && item.secondaryStats && Array.isArray(item.secondaryStats)) {
        item.secondaryStats.forEach((stat: any) => {
          if (bonuses.hasOwnProperty(stat.type)) {
            bonuses[stat.type as keyof typeof bonuses] += stat.value;
          }
        });
      }
    });
    
    return bonuses;
  }, [player.equipment]);

  const combatStats = useMemo(() => {
      const classScaling = getPrimaryStatMultiplier(player.selectedClass || 1, totalStats);
      
      // Base physical attack from STR, with class primary stat bonus
      const basePAtk = Math.floor(totalStats.str * 1.5 + totalStats.spi * 0.2);
      // Base magical attack from SPI, with class primary stat bonus
      const baseMAtk = Math.floor(totalStats.spi * 1.5 + totalStats.str * 0.2);
      
      // Apply class scaling bonus to primary attack type
      // Physical classes (STR/DEX primary) get pAtk bonus
      // Magical classes (SPI/WIL primary) get mAtk bonus
      const isPrimaryPhysical = ['str', 'dex', 'con'].includes(classScaling.primaryStat);
      
      // Base crit and dodge from DEX + secondary stat bonuses
      const baseCrit = totalStats.dex * 0.5 + secondaryStatBonuses.critChance;
      const baseDodge = totalStats.dex * 0.4 + secondaryStatBonuses.dodge;
      
      return {
          pAtk: isPrimaryPhysical 
            ? basePAtk + classScaling.bonus 
            : basePAtk,
          mAtk: !isPrimaryPhysical 
            ? baseMAtk + classScaling.bonus 
            : baseMAtk,
          def: Math.floor(totalStats.con * 1.5 + (totalStats.con * 0.5)),
          crit: baseCrit.toFixed(1),
          critDamage: (150 + secondaryStatBonuses.critDamage), // Base 150% + bonus
          dodge: baseDodge.toFixed(1),
          block: secondaryStatBonuses.block,
          accuracy: (90 + totalStats.dex * 0.3).toFixed(1),
          primaryStat: classScaling.primaryStat,
          primaryBonus: classScaling.bonus,
          lifeSteal: secondaryStatBonuses.lifeSteal,
          qiRegen: secondaryStatBonuses.qiRegen,
          damageReduction: secondaryStatBonuses.damageReduction,
          hpBonus: secondaryStatBonuses.hpBonus,
          qiBonus: secondaryStatBonuses.qiBonus,
      };
  }, [totalStats, player.selectedClass, secondaryStatBonuses]);

  // Keep refs updated for combat loop (avoid stale closures)
  useEffect(() => {
    combatStatsRef.current = combatStats;
  }, [combatStats]);
  
  useEffect(() => {
    playerRef.current = player;
  }, [player]);
  
  useEffect(() => {
    combatRef.current = combat;
  }, [combat]);
  
  useEffect(() => {
    isAutoCombatActiveRef.current = isAutoCombatActive;
  }, [isAutoCombatActive]);
  
  useEffect(() => {
    autoCombatSettingsRef.current = autoCombatSettings;
  }, [autoCombatSettings]);

  // Calculate Bestiary Bonuses for combat
  const bestiaryBonuses = useMemo(() => {
    const progress = player.bestiaryProgress || { claimedDiscovery: [], claimedMobMilestones: {}, claimedRealmMastery: [], claimedTagMastery: {} };
    return calculateBestiaryBonuses(
      player.killCounter || {},
      progress.claimedDiscovery || [],
      progress.claimedMobMilestones || {},
      progress.claimedRealmMastery || [],
      progress.claimedTagMastery || {}
    );
  }, [player.killCounter, player.bestiaryProgress]);

  // Effective Max HP with Bestiary flat HP bonus + secondary stat HP bonus
  const effectiveMaxHp = useMemo(() => {
    return player.maxHp + (bestiaryBonuses.flatHpBonus || 0) + (secondaryStatBonuses.hpBonus || 0);
  }, [player.maxHp, bestiaryBonuses.flatHpBonus, secondaryStatBonuses.hpBonus]);

  // Effective Max QI with secondary stat QI bonus
  const effectiveMaxQi = useMemo(() => {
    return player.maxQi + (secondaryStatBonuses.qiBonus || 0);
  }, [player.maxQi, secondaryStatBonuses.qiBonus]);

  const detectedPath = useMemo(() => {
      // Get weapon from new equipment system
      const equippedWeapon = player.equipment?.weapon;
      const weaponType = equippedWeapon?.subtype || equippedWeapon?.type;
      if (!equippedWeapon || !weaponType) return { name: "Wandering Cultivator", desc: "No specific path." };
      const stats = totalStats;
      const possibleClasses = classDefinitions.filter(c => c.wpn === weaponType);
      let bestMatch = null;
      let maxScore = 0;
      possibleClasses.forEach(cls => {
          const score = stats[cls.stat1] + (stats[cls.stat2] * 0.5);
          if (score > maxScore) { maxScore = score; bestMatch = cls; }
      });
      return bestMatch || { name: "Martial Artist", desc: "Using " + weaponType };
  }, [player.equipment?.weapon, totalStats]);

  const addLog = (text, type = "normal") => {
    setGameLog(prev => [...prev, { text, type }].slice(-50));
  };
  
  // Track paused logs to add when resumed
  const pausedLogsRef = useRef<Array<{text: string, type: string, time: Date}>>([]);
  
  const addCombatLog = (text, type="normal") => {
    if (combatLogPaused) {
      // Store logs while paused (max 50)
      pausedLogsRef.current = [...pausedLogsRef.current, {text, type, time: new Date()}].slice(-50);
    } else {
      setCombatLog(prev => [...prev, {text, type, time: new Date()}].slice(-50));
    }
  };
  
  // When unpausing, add all stored logs
  useEffect(() => {
    if (!combatLogPaused && pausedLogsRef.current.length > 0) {
      setCombatLog(prev => [...prev, ...pausedLogsRef.current].slice(-50));
      pausedLogsRef.current = [];
    }
  }, [combatLogPaused]);
  
  const triggerPassiveVisual = (icon: string, name: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setPassiveTriggers(prev => [...prev, {id, icon, name}]);
    setTimeout(() => {
      setPassiveTriggers(prev => prev.filter(p => p.id !== id));
    }, 2000);
  };

  useEffect(() => { 
    // Only scroll main log if not in combat - DISABLED during combat to prevent page jumping
    if (!combat) {
      logEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
    }
  }, [gameLog, combat]);
  
  // Combat log scroll - DISABLED automatic scrolling, let browser handle native scroll
  useEffect(() => { 
    // Do nothing - let CSS handle the scroll naturally
    // The container has overflow-y-auto which handles scrolling automatically
  }, [combatLog]);

  useEffect(() => {
    let combatInterval;
    if (combat && combat.active) {
        combatInterval = setInterval(() => {
            // ========================================
            // ENHANCED COMBAT WITH EFFECTS, PASSIVES & ELEMENTS
            // ========================================
            
            // USE REFS to get current values (avoid stale closures)
            const currentCombat = combatRef.current;
            const currentCombatStats = combatStatsRef.current;
            const currentPlayer = playerRef.current;
            
            // Safety check - if combat ended, don't process
            if (!currentCombat || !currentCombat.active || !currentCombatStats) {
              return;
            }
            
            // Tick cooldowns - inline to avoid closure issues
            setPlayer(p => {
                if (!p.skillCooldowns) return p;
                const newCooldowns = { ...p.skillCooldowns };
                let hasChanges = false;
                Object.keys(newCooldowns).forEach(skillId => {
                    if (newCooldowns[skillId] > 0) {
                        newCooldowns[skillId]--;
                        hasChanges = true;
                    }
                });
                return hasChanges ? { ...p, skillCooldowns: newCooldowns } : p;
            });
            
            // === AUTO-SKILL USAGE (only during auto-combat) ===
            const isAutoActive = isAutoCombatActiveRef.current;
            const autoSettings = autoCombatSettingsRef.current;
            if (isAutoActive && autoSettings?.autoSkillsEnabled && currentPlayer) {
                // Find an available skill to use
                const hotbarSkills = currentPlayer.skills || [];
                for (let i = 0; i < hotbarSkills.length; i++) {
                    const skillId = hotbarSkills[i];
                    if (!skillId) continue;
                    
                    const skill = getSkillById(skillId);
                    if (!skill) continue;
                    
                    const cooldown = currentPlayer.skillCooldowns?.[skillId] || 0;
                    const hasEnoughQi = currentCombat.playerQi >= skill.qiCost;
                    
                    if (cooldown === 0 && hasEnoughQi) {
                        // Use this skill via the ref
                        // We use a small timeout to avoid state conflicts
                        setTimeout(() => {
                            // Re-check conditions before using
                            const latestCombat = combatRef.current;
                            const latestPlayer = playerRef.current;
                            if (latestCombat && latestCombat.active) {
                                const cd = latestPlayer?.skillCooldowns?.[skillId] || 0;
                                const qi = latestCombat.playerQi >= skill.qiCost;
                                if (cd === 0 && qi) {
                                    useSkillRef.current(skillId);
                                }
                            }
                        }, 50);
                        break; // Only use one skill per turn
                    }
                }
            }
            
            setEffectState(prev => {
              // Reduce all effect durations
              const newEffectState: EffectState = {
                ...prev,
                player: reduceEffectDurations(prev.player, 1.5),
                mob: reduceEffectDurations(prev.mob, 1.5),
              };
              
              // PLAYER DAMAGE CALCULATION - USE REFS
              const pAtk = currentCombatStats.pAtk;
              const pDef = currentCombatStats.def;
              const pDmgRaw = pAtk - currentCombat.mob.def;
              const pDmg = Math.max(1, Math.floor(pDmgRaw * (0.9 + Math.random() * 0.2)));
              
              // ACCURACY SYSTEM - Check if player hits
              const accuracyChance = parseFloat(combatStats.accuracy as string) / 100;
              const playerMissed = Math.random() > accuracyChance;
              
              // === PLAYER ATTACK PHASE ===
              let totalDamage = 0;
              let dotDamage = 0;
              let elementLog = "";
              let passiveBonusDamage = 0;
              let gearBonus = 0;
              let playerCanAttack = true;
              let elementResult: ElementDamageResult | null = null;
              let playerElement: ElementType = 'Fire';
              
              // Check if player is stunned (can't attack)
              if (isStunned(newEffectState.player)) {
                addCombatLog(`You are stunned and can't attack!`, "warning");
                addFloatingDamage('player', 'STUNNED', 'effect', '#f59e0b');
                playerCanAttack = false;
              } else if (playerMissed) {
                addCombatLog(`Your attack misses ${currentCombat.mob.name}!`, "warning");
                addFloatingDamage('enemy', 'MISS', 'miss');
                playerCanAttack = false;
              }
              
              if (playerCanAttack) {
                // ELEMENT SYSTEM WITH VISUAL FEEDBACK
                let elementalDamage = pDmg;
                
                if (currentPlayer.selectedClass) {
                  const playerClass = hybridClassSystem.find(c => c.id === currentPlayer.selectedClass);
                  playerElement = playerClass?.element || 'Fire';
                  const mobResists = getMobResistances(currentCombat.mob.level);
                  const critChance = parseFloat(currentCombatStats.crit as string) / 100;
                  const isCritical = Math.random() < critChance;
                  
                  // Use new function with feedback (includes crit damage from secondary stats)
                  // Get mob element from mob data (defaults to 'None' if not defined)
                  const mobElement = currentCombat.mob.element || 'None';
                  elementResult = calculateDamageWithFeedback(
                    pDmg,
                    playerElement,
                    mobElement,
                    mobResists,
                    isCritical,
                    currentCombatStats.critDamage || 150 // Use crit damage from secondary stats
                  );
                  
                  elementalDamage = elementResult.damage;
                  
                  // Show element effectiveness popup
                  if (elementResult.isEffective === 'super' && Math.random() < 0.3) {
                    // 30% chance to show popup (avoid spam)
                    showElementPopup('super', playerElement, elementResult.multiplier);
                    triggerScreenShake();
                  } else if (elementResult.isEffective === 'resisted' && Math.random() < 0.3) {
                    showElementPopup('resisted', playerElement, elementResult.multiplier);
                  }
                  
                  if (isCritical) {
                    elementLog = ` [CRITICAL!]`;
                  }
                }
                
                // PASSIVE SYSTEM
                if (currentPlayer.selectedClass && currentPlayer.passiveState) {
                  const classId = currentPlayer.selectedClass;
                  const passive = currentPlayer.passiveState;
                  
                  reduceCooldown(passive, 1.5);
                  
                  switch(classId) {
                    case 1: 
                      passiveBonusDamage = handleInfernoAura(passive, currentCombat.playerHp, currentPlayer.maxHp);
                      if (passive.triggeredEffect) {
                        newEffectState.mob = applyEffect(newEffectState.mob, passive.triggeredEffect, calculateEffectResistance(currentCombat.mob.level));
                        addCombatLog(`✨ Inferno Aura triggers! Enemy burning!`, "info");
                        passive.triggeredEffect = undefined;
                      }
                      break;
                    case 2: 
                      if (handleFrostbiteChain(passive, Math.random() < 0.15)) {
                        if (passive.triggeredEffect) {
                          newEffectState.mob = applyEffect(newEffectState.mob, passive.triggeredEffect, calculateEffectResistance(currentCombat.mob.level));
                          addCombatLog(`❄️ Frostbite Chain procs! Enemy frozen!`, "info");
                          passive.triggeredEffect = undefined;
                        }
                      }
                      break;
                    case 3: passiveBonusDamage = handleSpellEcho(passive, elementalDamage); break;
                    case 4: 
                      handlePoisonCloud(passive, elementalDamage);
                      if (passive.triggeredEffect) {
                        newEffectState.mob = applyEffect(newEffectState.mob, passive.triggeredEffect, calculateEffectResistance(currentCombat.mob.level));
                        addCombatLog(`☠️ Poison Cloud bursts! Enemy corrupted!`, "info");
                        passive.triggeredEffect = undefined;
                      }
                      break;
                    case 5: passiveBonusDamage = handleAsuraRage(passive); break;
                    case 6: passiveBonusDamage = handleGlacialBarrier(passive); break;
                    case 7: 
                      passiveBonusDamage = handleNaturesBlessing(passive, currentPlayer.maxHp);
                      if (passive.triggeredEffect) {
                        newEffectState.mob = applyEffect(newEffectState.mob, passive.triggeredEffect, calculateEffectResistance(currentCombat.mob.level));
                        addCombatLog(`🌿 Nature's Blessing entangles the enemy!`, "info");
                        passive.triggeredEffect = undefined;
                      }
                      break;
                    case 8: passiveBonusDamage = handleBeastHunt(passive); break;
                    case 9: passiveBonusDamage = handlePhoenixRebirth(passive, combat.playerHp, player.maxHp); break;
                    case 10: 
                      passiveBonusDamage = handleDivineGrace(passive, elementalDamage);
                      if (passive.triggeredEffect) {
                        newEffectState.mob = applyEffect(newEffectState.mob, passive.triggeredEffect, calculateEffectResistance(combat.mob.level));
                        addCombatLog(`⚡ Divine Grace stuns the enemy!`, "info");
                        passive.triggeredEffect = undefined;
                      }
                      break;
                    case 11: 
                      passiveBonusDamage = handleShadowStep(passive, elementalDamage);
                      if (passive.triggeredEffect) {
                        newEffectState.mob = applyEffect(newEffectState.mob, passive.triggeredEffect, calculateEffectResistance(currentCombat.mob.level));
                        addCombatLog(`🌑 Shadow Step entangles the enemy!`, "info");
                        passive.triggeredEffect = undefined;
                      }
                      break;
                    case 12: passiveBonusDamage = handleSpiritFortitude(passive); break;
                    default: 
                      console.error(`[PASSIVE ERROR] Unknown classId: ${classId}`);
                      break;
                  }
                  
                  setPlayer(p => ({ ...p, passiveState: passive }));
                }
                
                // GEAR BONUSES - Check both old and new equipment systems
                if (currentPlayer.equippedGear) {
                  gearBonus = getGearSetBonus(currentPlayer.equippedGear);
                }
                
                // NEW EQUIPMENT SET BONUSES: Add set bonuses from 3-slot equipment
                if (currentPlayer.equipment) {
                  ['weapon', 'ring', 'necklace'].forEach(slot => {
                    const item = currentPlayer.equipment[slot];
                    if (item?.setBonus) {
                      gearBonus += item.setBonus;
                    }
                  });
                }
                
                // BESTIARY BONUSES: Apply damage bonuses from bestiary milestones
                let bestiaryDamageBonus = 0;
                // 1. Specific mob damage bonus (max +5%)
                const mobSpecificBonus = bestiaryBonuses.mobDamageBonus[currentCombat.mob.id] || 0;
                bestiaryDamageBonus += mobSpecificBonus;
                // 2. Tag-based ATK bonus (e.g., +3% vs Beasts)
                const mobTags = getBestiaryMobTags(currentCombat.mob.id);
                mobTags.forEach(tag => {
                  if (bestiaryBonuses.tagAtkBonus[tag]) {
                    bestiaryDamageBonus += bestiaryBonuses.tagAtkBonus[tag];
                  }
                });
                // 3. Global ATK bonus from discovery milestones
                bestiaryDamageBonus += bestiaryBonuses.globalAtkBonus || 0;
                
                // EFFECT MODIFIERS: Apply damage multiplier from effects (frozen, stunned, etc.)
                const effectDamageModifier = getDamageModifier(newEffectState.player);
                const finalEffectModifier = 1 + (effectDamageModifier / 100);
                const bestiaryDamageMultiplier = 1 + (bestiaryDamageBonus / 100);
                
                // Final damage calculation with all bonuses
                totalDamage = Math.floor((elementalDamage + passiveBonusDamage + (elementalDamage * gearBonus / 100)) * finalEffectModifier * bestiaryDamageMultiplier);
                
                // Apply DoT damage from effects
                dotDamage = getEffectDamage(newEffectState.mob);
              }
              
              // === MOB ATTACK PHASE (always happens unless mob is dead) ===
              const mAtk = currentCombat.mob.atk;
              const effectDefenseModifier = getDefenseModifier(newEffectState.player);
              const finalDefenseModifier = 1 + (effectDefenseModifier / 100);
              
              // BESTIARY DEFENSE BONUSES: Apply tag-based DEF bonus
              const mobTagsForDef = getBestiaryMobTags(currentCombat.mob.id);
              let bestiaryDefBonus = 0;
              mobTagsForDef.forEach(tag => {
                if (bestiaryBonuses.tagDefBonus[tag]) {
                  bestiaryDefBonus += bestiaryBonuses.tagDefBonus[tag];
                }
              });
              const bestiaryDefMultiplier = 1 + (bestiaryDefBonus / 100);
              
              const mDmgRaw = mAtk - (pDef * finalDefenseModifier * bestiaryDefMultiplier);
              const mDmg = Math.max(1, Math.floor(mDmgRaw));
              
              // DODGE SYSTEM - Check if player dodges the attack
              const dodgeChance = parseFloat(currentCombatStats.dodge as string) / 100;
              const playerDodged = Math.random() < dodgeChance;
              
              // Check if mob is stunned
              let mobDamage = playerDodged ? 0 : mDmg;
              if (playerDodged) {
                addCombatLog(`💨 You swiftly dodge ${currentCombat.mob.name}'s attack!`, "defense");
                addFloatingDamage('player', 'DODGE', 'dodge');
              } else if (isStunned(newEffectState.mob)) {
                mobDamage = Math.floor(mDmg * 0.3); // 30% damage when stunned
                addCombatLog(`${currentCombat.mob.name} is stunned! Reduced damage.`, "info");
                addFloatingDamage('enemy', 'STUNNED', 'effect', '#f59e0b');
              }

              // ====== DEFENSE SYSTEM - Apply active defenses ======
              if (!playerDodged && activeDefense && mobDamage > 0) {
                  if (activeDefense === 'block') {
                      const originalDamage = mobDamage;
                      mobDamage = Math.floor(mobDamage * 0.5); // 50% reduction
                      addCombatLog(`🛡️ BLOCK! Damage reduced: ${originalDamage} → ${mobDamage}`, "defense");
                      addFloatingDamage('player', 'BLOCK -50%', 'effect', '#3b82f6');
                      setActiveDefense(null);
                      setBlockCooldown(5); // 5 combat ticks cooldown
                  } else if (activeDefense === 'dodge') {
                      mobDamage = 0;
                      addCombatLog(`💨 PERFECT DODGE! Attack completely avoided!`, "defense");
                      addFloatingDamage('player', '💨 PERFECT DODGE', 'dodge');
                      setActiveDefense(null);
                      setDodgeCooldown(8); // 8 combat ticks cooldown
                  } else if (activeDefense === 'counter') {
                      const counterDamage = Math.floor(mobDamage * 1.5); // 150% damage reflection
                      mobDamage = 0;
                      
                      // Apply counter damage to mob
                      setCombat(prev => prev ? ({
                          ...prev,
                          mobHp: Math.max(0, prev.mobHp - counterDamage)
                      }) : null);
                      
                      addCombatLog(`⚔️ COUNTER! Reflected ${counterDamage} damage!`, "defense");
                      addFloatingDamage('player', '⚔️ COUNTER', 'effect', '#dc2626');
                      addFloatingDamage('enemy', counterDamage, 'crit', '#dc2626');
                      triggerScreenShake('heavy');
                      setActiveDefense(null);
                      setCounterCooldown(12); // 12 combat ticks cooldown
                  }
              }

              // === APPLY COMBAT RESULTS ===
              setCombat(prev => {
                  if (!prev) return null;
                  const newMobHp = Math.max(0, prev.mobHp - totalDamage - dotDamage);
                  
                  // Apply damage reduction from secondary stats
                  const damageReductionPercent = currentCombatStats.damageReduction || 0;
                  const finalMobDamage = Math.max(1, Math.floor(mobDamage * (1 - damageReductionPercent / 100)));
                  
                  // Apply life steal from secondary stats
                  const lifeStealPercent = currentCombatStats.lifeSteal || 0;
                  const healedFromLifeSteal = Math.floor(totalDamage * lifeStealPercent / 100);
                  
                  const newPlayerHp = Math.min(effectiveMaxHp, Math.max(0, prev.playerHp - finalMobDamage + healedFromLifeSteal));
                  
                  // Apply QI regen from secondary stats
                  const qiRegenFromStats = currentCombatStats.qiRegen || 0;
                  const qiRecovery = Math.ceil(prev.maxPlayerQi * 0.01) + qiRegenFromStats;
                  const newPlayerQi = Math.min(prev.playerQi + qiRecovery, prev.maxPlayerQi + (currentCombatStats.qiBonus || 0));

                  // Log player damage if player attacked
                  if (playerCanAttack && totalDamage > 0) {
                    let damageBreakdown = [];
                    
                    // Add element emoji if available
                    const elementEmoji = ELEMENT_EMOJI[playerElement] || '';
                    damageBreakdown.push(`${elementEmoji}${totalDamage}`);
                    
                    if (elementLog.includes("CRITICAL")) damageBreakdown.push("🎯 CRIT");
                    if (elementResult?.isEffective === 'super') damageBreakdown.push("💥 SUPER!");
                    if (elementResult?.isEffective === 'resisted') damageBreakdown.push("🛡️ RESIST");
                    if (passiveBonusDamage > 0) damageBreakdown.push(`✨ +${passiveBonusDamage}`);
                    if (dotDamage > 0) damageBreakdown.push(`🔥 +${dotDamage} DoT`);
                    if (gearBonus > 0) damageBreakdown.push(`⚡ +${Math.floor((totalDamage / (1 + gearBonus/100)) * gearBonus / 100)}`);
                    
                    const damageLog = `You deal ${damageBreakdown.join(' | ')} damage!`;
                    const isCrit = elementLog.includes("CRITICAL");
                    addCombatLog(damageLog, isCrit ? "crit" : "success");
                    
                    // VISUAL FEEDBACK: Floating damage on enemy with element color
                    const elementColor = ELEMENT_COLORS[playerElement];
                    
                    if (isCrit) {
                      addFloatingDamage('enemy', totalDamage, 'crit', elementColor, playerElement);
                      triggerScreenShake('heavy'); // Heavy shake on crits
                      triggerElementBurst(playerElement); // Element burst only on crits
                    } else {
                      addFloatingDamage('enemy', totalDamage, 'damage', elementColor, playerElement);
                      triggerScreenShake('light'); // Light shake on normal hits
                      // No element burst on normal attacks - keeps it cleaner
                    }
                    
                    // Show element advantage indicator (subtle percentage)
                    if (elementResult?.isEffective === 'super') {
                      showElementAdvantage(elementResult.multiplier);
                    } else if (elementResult?.isEffective === 'resisted') {
                      showElementAdvantage(elementResult.multiplier);
                    }
                    
                    if (dotDamage > 0) {
                      setTimeout(() => addFloatingDamage('enemy', dotDamage, 'effect', '#f97316'), 200);
                    }
                    triggerHitFlash('enemy');
                  }
                  
                  // Visual effects for damage
                  if (playerCanAttack) {
                    setLastAttacker('player');
                    triggerAttackAnimation('player', playerElement, false); // Basic attack animation
                    setTimeout(() => setLastAttacker(null), 500);
                  }
                  
                  // Log active effects on mob
                  const mobEffects = newEffectState.mob.effects || [];
                  if (mobEffects.length > 0) {
                    const effectNames = mobEffects.map(e => formatStatusEffect(e.type, e.duration)).join(' | ');
                    addCombatLog(`📊 Active Effects: ${effectNames}`, "info");
                  }
                  
                  // Log mob damage (showing final damage after reductions)
                  if (finalMobDamage > 0) {
                    let damageLog = `${prev.mob.name} deals ${finalMobDamage} damage!`;
                    if (damageReductionPercent > 0) {
                      damageLog += ` (🛡️ ${damageReductionPercent}% reduced)`;
                    }
                    addCombatLog(damageLog, "danger");
                    // VISUAL FEEDBACK: Floating damage on player
                    addFloatingDamage('player', finalMobDamage, 'damage');
                    triggerHitFlash('player');
                    triggerScreenShake('medium'); // Medium shake when taking damage
                  }
                  
                  // Log life steal healing
                  if (healedFromLifeSteal > 0) {
                    addCombatLog(`💚 Life Steal: +${healedFromLifeSteal} HP`, "heal");
                    addFloatingDamage('player', `+${healedFromLifeSteal}`, 'heal');
                  }
                  
                  // Visual effects for enemy damage
                  if (finalMobDamage > 0) {
                    setLastAttacker('enemy');
                    triggerAttackAnimation('enemy'); // Enemy attack animation
                    setTimeout(() => setLastAttacker(null), 500);
                  }
                  
                  if (qiRecovery > 0 && newPlayerQi < prev.maxPlayerQi) addCombatLog(`+${qiRecovery} Qi restored`, "info");

                  // === AUTO-POT DURING COMBAT ===
                  // Check if auto-pot is enabled and apply immediately during combat
                  let finalPlayerHp = newPlayerHp;
                  let finalPlayerQi = newPlayerQi;
                  
                  if (autoCombatSettingsRef.current.autoPotEnabled && newPlayerHp > 0) {
                    const hpPercent = (newPlayerHp / prev.maxPlayerHp) * 100;
                    const qiPercent = (newPlayerQi / prev.maxPlayerQi) * 100;
                    
                    // Auto-use HP pill if below threshold
                    if (hpPercent < autoCombatSettingsRef.current.autoPotHpThreshold) {
                      setPlayer(currentP => {
                        const hpPillIdx = currentP.inventory.findIndex((item: any) => 
                          (item.type === 'consumable' && item.effect === 'hp' && (item.count || 0) > 0) ||
                          (item.name === 'HP Restoring Pill' && (item.count || 0) > 0)
                        );
                        if (hpPillIdx !== -1) {
                          const pill = currentP.inventory[hpPillIdx];
                          const healAmount = pill.amount || 50;
                          finalPlayerHp = Math.min(newPlayerHp + healAmount, prev.maxPlayerHp);
                          
                          const newInventory = [...currentP.inventory];
                          newInventory[hpPillIdx] = { ...pill, count: (pill.count || 1) - 1 };
                          if (newInventory[hpPillIdx].count <= 0) {
                            newInventory.splice(hpPillIdx, 1);
                          }
                          
                          addCombatLog(`💊 Auto-pot: ${pill.name}! +${healAmount} HP`, 'heal');
                          addFloatingDamage('player', `+${healAmount}`, 'heal');
                          
                          return { ...currentP, inventory: newInventory };
                        }
                        return currentP;
                      });
                    }
                    
                    // Auto-use QI pill if below threshold
                    if (qiPercent < autoCombatSettingsRef.current.autoPotQiThreshold) {
                      setPlayer(currentP => {
                        const qiPillIdx = currentP.inventory.findIndex((item: any) => 
                          (item.type === 'consumable' && item.effect === 'qi' && (item.count || 0) > 0) ||
                          (item.name === 'QI Restoring Pill' && (item.count || 0) > 0)
                        );
                        if (qiPillIdx !== -1) {
                          const pill = currentP.inventory[qiPillIdx];
                          const restoreAmount = pill.amount || 30;
                          finalPlayerQi = Math.min(newPlayerQi + restoreAmount, prev.maxPlayerQi);
                          
                          const newInventory = [...currentP.inventory];
                          newInventory[qiPillIdx] = { ...pill, count: (pill.count || 1) - 1 };
                          if (newInventory[qiPillIdx].count <= 0) {
                            newInventory.splice(qiPillIdx, 1);
                          }
                          
                          addCombatLog(`💊 Auto-pot: ${pill.name}! +${restoreAmount} Qi`, 'heal');
                          
                          return { ...currentP, inventory: newInventory };
                        }
                        return currentP;
                      });
                    }
                  }

                  // Check finalPlayerHp (after auto-pot) for death, not newPlayerHp
                  if (finalPlayerHp <= 0) {
                      endCombat(false, prev.mob, 0, finalPlayerQi);
                      return { ...prev, active: false, playerHp: 0 };
                  }
                  if (newMobHp <= 0) {
                      endCombat(true, prev.mob, finalPlayerHp, finalPlayerQi);
                      return { ...prev, active: false, mobHp: 0 };
                  }
                  return { ...prev, mobHp: newMobHp, playerHp: finalPlayerHp, playerQi: finalPlayerQi };
              });
              
              return newEffectState;
            });
            
            // Increment round counter OUTSIDE of nested callbacks to prevent double-increment
            setCombatRound(r => r + 1);
        }, 1500);
    }
    return () => clearInterval(combatInterval);
  }, [combat?.active]); // Only depend on combat.active to avoid constant recreation

  const startCombat = () => {
    const key = `${coords.x},${coords.y}`;
    const possibleMobIds = bestiaryMap[key];
    if (!possibleMobIds) return addLog("There are no enemies here.", "normal");
    const mobId = possibleMobIds[Math.floor(Math.random() * possibleMobIds.length)];
    const mobTemplate = getMobById(mobId); 

    // Calculate combat difficulty
    const difficulty = getCombatDifficulty(player.level, effectiveMaxHp, mobTemplate.level, mobTemplate.hp);
    const levelMods = getLevelDiffModifiers(player.level, mobTemplate.level);

    setCombat({ 
        active: true, 
        mob: mobTemplate, 
        mobHp: mobTemplate.hp, 
        playerHp: Math.min(player.hp, effectiveMaxHp), 
        maxPlayerHp: effectiveMaxHp,
        playerQi: player.qi,
        maxPlayerQi: player.maxQi,
        isPlayerTurn: true, // Turn indicator
        difficulty, // Add difficulty info
        levelMods, // Add level modifiers for exp/drop
    });
    setEffectState(initEffectState());
    setCombatLog([{text: `Encountered a ${mobTemplate.name} (Lvl ${mobTemplate.level}) - ${difficulty.label}!`, type: difficulty.label === 'Deadly' || difficulty.label === 'Very Hard' ? 'danger' : difficulty.label === 'Hard' ? 'warning' : 'normal'}]);
    setCombatRound(1); // Reset round counter
    setCombatAnimations({
      playerAttacking: false,
      enemyAttacking: false,
      playerSkillEffect: null,
      enemyHit: false,
      playerHit: false,
      skillParticles: []
    }); // Reset animations
  };

  // Keep ref updated with latest startCombat
  useEffect(() => {
    startCombatRef.current = startCombat;
  });

  // ====== BREAKTHROUGH SYSTEM ======
  const attemptBreakthrough = () => {
    const currentLevelInfo = getLevelInfo(player.level);
    if (!currentLevelInfo.breakthrough) {
      addToast('No breakthrough required at current level.', 'info');
      return;
    }
    
    // Check if player has the required pill
    const requiredPill = currentLevelInfo.breakthrough;
    const pillIndex = player.inventory.findIndex((item: any) => 
      item.name === requiredPill || 
      item.itemId === requiredPill.toLowerCase().replace(' ', '_')
    );
    
    if (pillIndex === -1) {
      addToast(`❌ You need ${requiredPill} to break through!`, 'error');
      addLog(`❌ Breakthrough failed! You don't have ${requiredPill}.`, 'danger');
      return;
    }
    
    // Consume the pill
    setPlayer(p => {
      const newInventory = [...p.inventory];
      const pill = newInventory[pillIndex];
      if (pill.count && pill.count > 1) {
        newInventory[pillIndex] = { ...pill, count: pill.count - 1 };
      } else {
        newInventory.splice(pillIndex, 1);
      }
      
      // Level up!
      const newLevel = p.level + 1;
      const nextLevelInfo = getLevelInfo(newLevel);
      const apGain = nextLevelInfo ? nextLevelInfo.apPerLevel : 4;
      
      // Calculate level scaling gains for breakthrough
      const classId = p.selectedClass || 0;
      const breakthroughGains = getStatsGainedOnLevelUp(newLevel, classId);
      
      const newMaxHp = (p.maxHp || BASE_SCALING.BASE_HP) + breakthroughGains.hpGain;
      const newMaxQi = (p.maxQi || BASE_SCALING.BASE_QI) + breakthroughGains.qiGain;
      const currentLevelBonusStats = p.levelBonusStats || { str: 0, dex: 0, con: 0, spi: 0, wil: 0 };
      const newLevelBonusStats = {
        str: (currentLevelBonusStats.str || 0) + breakthroughGains.statGains.str,
        dex: (currentLevelBonusStats.dex || 0) + breakthroughGains.statGains.dex,
        con: (currentLevelBonusStats.con || 0) + breakthroughGains.statGains.con,
        spi: (currentLevelBonusStats.spi || 0) + breakthroughGains.statGains.spi,
        wil: (currentLevelBonusStats.wil || 0) + breakthroughGains.statGains.wil,
      };
      
      return {
        ...p,
        level: newLevel,
        realm: nextLevelInfo.realm,
        ap: p.ap + apGain,
        totalAPEarned: p.totalAPEarned + apGain,
        maxHp: newMaxHp,
        maxQi: newMaxQi,
        levelBonusStats: newLevelBonusStats,
        inventory: newInventory,
        // Restore full HP/Qi on breakthrough
        hp: newMaxHp,
        qi: newMaxQi
      };
    });
    
    // Reset breakthrough pending flag
    setBreakthroughPending(false);
    setBreakthroughModalOpen(false);
    
    // Celebration
    const newLevel = player.level + 1;
    const newRealm = getLevelInfo(newLevel).realm;
    addToast(`🌟 BREAKTHROUGH SUCCESS! Welcome to ${newRealm}!`, 'success', 8000);
    addLog(`🌟 BREAKTHROUGH! You have advanced to ${newRealm}! Your cultivation base has been stabilized.`, 'success');
    addLog(`+${getLevelInfo(newLevel).apPerLevel} AP gained from breakthrough!`, 'success');
  };
  
  // Check if player can attempt breakthrough
  const canAttemptBreakthrough = () => {
    const currentLevelInfo = getLevelInfo(player.level);
    if (!currentLevelInfo.breakthrough) return false;
    if (player.exp < currentLevelInfo.req) return false;
    
    const requiredPill = currentLevelInfo.breakthrough;
    return player.inventory.some((item: any) => 
      item.name === requiredPill || 
      item.itemId === requiredPill.toLowerCase().replace(' ', '_')
    );
  };

  const endCombat = (win, mob, finalPlayerHp?: number, finalPlayerQi?: number) => {
      // Clear combo state when combat ends
      setComboProgress(null);
      setCompletedCombo(null);
      setComboBonusActive(null);
      setRecentSkills([]);
      
      // Clear defense state
      setActiveDefense(null);
      setBlockCooldown(0);
      setDodgeCooldown(0);
      setCounterCooldown(0);
      
      // Use passed HP/Qi values if available (to avoid stale closure issues)
      // Otherwise fall back to combat state (which may be stale)
      const currentPlayerHp = finalPlayerHp ?? combat?.playerHp ?? player.hp;
      const currentPlayerQi = finalPlayerQi ?? combat?.playerQi ?? player.qi;
      
      // Audio disabled for now
      if (win) {
          // Calculate bestiary bonuses for victory message
          const mobRealmForMsg = getMobRealm(mob.level);
          const expBonus = (bestiaryBonuses.globalExpBonus || 0) + (bestiaryBonuses.realmExpBonus[mobRealmForMsg] || 0);
          const stonesBonus = bestiaryBonuses.realmStonesBonus[mobRealmForMsg] || 0;
          const bonusExpAmount = Math.floor(mob.exp * (expBonus / 100));
          const bonusStonesAmount = Math.floor((mob.stones || 0) * (stonesBonus / 100));
          
          // Calculate total spirit stones (auto-collected)
          const totalStones = (mob.stones || 0) + bonusStonesAmount;
          
          // Show victory with bonus info
          let victoryMsg = `Victory! +${mob.exp + bonusExpAmount} Exp, +${totalStones} SS.`;
          if (bonusExpAmount > 0 || bonusStonesAmount > 0) {
            victoryMsg += ` (Bestiary: +${bonusExpAmount} Exp, +${bonusStonesAmount} SS)`;
          }
          addCombatLog(victoryMsg, "gold");
          
          // ====== COLLECT LOOT (don't add to inventory yet) ======
          const pendingLoot: any[] = [];
          let newPityState = { ...(player.pityState || createInitialPityState()) };
          let gearDropped = false;
          
          const mobQuality = mob.quality || 'Normal';
          const mobTier = getTierFromLevel(mob.level);
          const dropRates = getDropRates(mobQuality);
          const isBoss = mobQuality === 'Elite' || mobQuality === 'Epic' || mobQuality === 'Legendary';
          
          // Get level-based drop modifier (reduces drops from much lower level mobs)
          const levelMods = combat?.levelMods || getLevelDiffModifiers(player.level, mob.level);
          const dropModifier = levelMods.dropMod;
          
          // Show warning if drops are reduced due to level difference
          if (dropModifier < 1.0) {
            addCombatLog(`⚠️ Reduced drops (${Math.round(dropModifier * 100)}%) - mob too low level`, 'warning');
          }
          
          // 1) JUNK DROPS (Vendor Trash) - 40-90% based on quality, filtered by mob tags
          // Junk always drops normally (it's vendor trash)
          const junkDrop = rollJunkDrop(mob.level, mobQuality, mob.id);
          if (junkDrop) {
              pendingLoot.push({
                  id: generateUniqueId(),
                  name: junkDrop.name,
                  count: 1,
                  iconType: junkDrop.iconType,
                  desc: junkDrop.desc,
                  type: 'junk',
                  sellValue: junkDrop.sellValue,
                  tier: junkDrop.tier
              });
          }
          
          // 2) CLASS TOKEN DROPS (only from tagged mobs, 3-10% based on quality)
          const tokenDrop = rollClassTokenDrop(mob.id, mobQuality);
          if (tokenDrop) {
              pendingLoot.push({
                  id: generateUniqueId(),
                  name: tokenDrop.name,
                  count: 1,
                  iconType: tokenDrop.iconType,
                  desc: tokenDrop.desc,
                  type: 'token',
                  materialId: tokenDrop.id,
                  tier: 3,
                  rarity: 'Rare'
              });
          }
          
          // 3) GEAR DROPS (2-15% based on quality + pity bonus + bestiary bonus)
          // Apply level modifier (reduced drops from much lower level mobs)
          const baseGearRate = dropRates.gear * dropModifier;
          const pityBonus = getDropPityBonus(newPityState.lastDropKills) / 100;
          const mobRealm = getMobRealm(mob.level);
          const bestiaryDropBonus = (bestiaryBonuses.globalDropRate || 0) + (bestiaryBonuses.realmDropBonus[mobRealm] || 0);
          const bestiaryDropMultiplier = bestiaryDropBonus / 100;
          const finalGearRate = Math.min(1, baseGearRate + pityBonus + bestiaryDropMultiplier);
          
          if (Math.random() < finalGearRate) {
              const maxDropTier = Math.min(3, mobTier);
              const potentialDrops = itemDatabase.filter(i => 
                  i.tier === maxDropTier && 
                  i.type !== 'consumable'
              );
              if(potentialDrops.length > 0) {
                  const droppedItem = potentialDrops[Math.floor(Math.random() * potentialDrops.length)];
                  
                  // Use new rarity system - roll rarity based on mob type
                  const itemRarity = rollItemRarity(mob.level, mobQuality, pityBonus * 100);
                  
                  // Roll secondary stats based on rarity
                  const secondaryStats = rollSecondaryStats(itemRarity);
                  
                  pendingLoot.push({ 
                      id: generateUniqueId(), 
                      itemId: droppedItem.id, 
                      name: droppedItem.name, 
                      count: 1, 
                      iconType: getWeaponIconType(droppedItem), 
                      desc: droppedItem.desc, 
                      type: droppedItem.type || 'weapon',
                      tier: droppedItem.tier,
                      rarity: itemRarity,
                      stats: droppedItem.stats,
                      specialEffects: droppedItem.specialEffects,
                      secondaryStats: secondaryStats,
                      setBonus: droppedItem.setBonus || 0
                  });
                  gearDropped = true;
                  newPityState = resetPityOnSuccess(newPityState, 'drop');
              }
          }
          
          // Update pity counter if no gear dropped
          if (!gearDropped) {
              newPityState = incrementPityOnFail(newPityState, 'drop');
          }
          
          // 4) MATERIAL DROPS (12-35% based on quality) - Apply level modifier
          if (Math.random() < dropRates.material * dropModifier) {
              const dropTable = isBoss ? getBossDropTable(mob.level) : getDropTableForLevel(mob.level);
              const availableMats = dropTable.materials;
              if (availableMats.length > 0) {
                  const droppedMat = availableMats[Math.floor(Math.random() * availableMats.length)];
                  pendingLoot.push({
                      id: generateUniqueId(),
                      name: droppedMat.name,
                      count: 1,
                      iconType: droppedMat.iconType,
                      desc: droppedMat.desc,
                      type: 'material',
                      materialId: droppedMat.id,
                      tier: droppedMat.tier
                  });
              }
          }
          
          // 5) CONSUMABLE DROPS (10-25% based on quality) - Apply level modifier
          if (Math.random() < dropRates.consumable * dropModifier) {
              const consumableDrops = itemDatabase.filter(i => 
                  i.type === 'consumable' && 
                  i.tier === Math.min(2, mobTier)
              );
              if(consumableDrops.length > 0) {
                  const droppedItem = consumableDrops[Math.floor(Math.random() * consumableDrops.length)];
                  pendingLoot.push({ 
                      id: generateUniqueId(), 
                      itemId: droppedItem.id, 
                      name: droppedItem.name, 
                      count: 1, 
                      iconType: droppedItem.iconType || 'hp_pill', 
                      desc: droppedItem.desc, 
                      type: 'consumable',
                      tier: droppedItem.tier,
                      rarity: droppedItem.rarity,
                      effect: droppedItem.effect,
                      amount: droppedItem.amount
                  });
              }
          }

          // 6) Update kill counter for bestiary
          const newKillCounter = { ...(player.killCounter || {}) };
          newKillCounter[mob.id] = (newKillCounter[mob.id] || 0) + 1;

          // 7) Quest progress tracking - mob killed
          const currentQuestLog = JSON.parse(JSON.stringify(player.questLog || createDefaultQuestLog()));
          const questUpdates = onMobKilled(mob.id, currentQuestLog, allQuests);
          if (questUpdates.length > 0) {
              questUpdates.forEach(update => {
                  const quest = getQuestById(update.questId);
                  if (quest) {
                      const obj = quest.objectives.find(o => o.id === update.objectiveId);
                      if (obj) {
                          addCombatLog(`📜 ${obj.description} (${update.newProgress}/${obj.required})`, "quest");
                      }
                      const questState = currentQuestLog.active.find(s => s.questId === quest.id);
                      if (questState && isQuestComplete(quest, questState)) {
                          addToast(`✅ Quest "${quest.name}" ready to turn in!`, 'success', 4000);
                      }
                  }
              });
          }

          // BESTIARY EXP BONUS
          const mobRealmForExp = getMobRealm(mob.level);
          const bestiaryExpBonus = (bestiaryBonuses.globalExpBonus || 0) + (bestiaryBonuses.realmExpBonus[mobRealmForExp] || 0);
          const bonusExp = Math.floor(mob.exp * (bestiaryExpBonus / 100));
          // Apply level-based EXP modifier (reduced exp from much lower level mobs)
          const expModifier = levelMods.expMod;
          // Apply DEV EXP MULTIPLIER for testing (set via console: window.setExpMultiplier(500))
          const totalMobExp = Math.floor((mob.exp + bonusExp) * expModifier * DEV_EXP_MULTIPLIER.value);
          
          // Show warning if EXP is reduced due to level difference
          if (expModifier < 1.0) {
            addCombatLog(`⚠️ Reduced EXP (${Math.round(expModifier * 100)}%) - mob too low level`, 'warning');
          } else if (expModifier > 1.0) {
            addCombatLog(`⭐ Bonus EXP (${Math.round(expModifier * 100)}%) - challenging fight!`, 'success');
          }
          
          const rawExp = player.exp + totalMobExp;
          const nextLvl = getLevelInfo(player.level);
          let finalExp = rawExp;
          let finalLvl = player.level;
          let newAP = player.ap;
          let newTotalAP = player.totalAPEarned;
          let levelUpGains: { hpGain: number; qiGain: number; statGains: { str: number; dex: number; con: number; spi: number; wil: number } } | null = null;
          
          // BREAKTHROUGH CHECK: If level requires breakthrough, cap EXP and notify
          if (rawExp >= nextLvl.req && nextLvl.breakthrough) {
              // Cap EXP at requirement (can't overflow)
              finalExp = nextLvl.req;
              
              // Notify player only once per session
              if (!breakthroughPending) {
                  setBreakthroughPending(true);
                  addToast(`⚡ Breakthrough Required! You need ${nextLvl.breakthrough} to advance!`, 'warning', 6000);
                  addLog(`⚡ BREAKTHROUGH REQUIRED: Obtain ${nextLvl.breakthrough} to break through to ${nextLvl.realm === 'Qi Condensation' ? 'Foundation Establishment' : 'Golden Core'}!`, 'system');
              }
          } else if (rawExp >= nextLvl.req && !nextLvl.breakthrough) {
              finalLvl++;
              const nextLevelInfo = getLevelInfo(finalLvl);
              const apGain = nextLevelInfo ? nextLevelInfo.apPerLevel : 4;
              newAP += apGain;
              newTotalAP += apGain;
              
              // Calculate level scaling gains
              const classId = player.selectedClass || 0;
              levelUpGains = getStatsGainedOnLevelUp(finalLvl, classId);
              
              addLog(`Level Up! +${apGain} AP, +${levelUpGains.hpGain} Max HP, +${levelUpGains.qiGain} Max QI`, "success");
              if (levelUpGains.statGains.str > 0 || levelUpGains.statGains.dex > 0 || levelUpGains.statGains.con > 0) {
                const statGainMsg = Object.entries(levelUpGains.statGains)
                  .filter(([_, val]) => val > 0)
                  .map(([stat, val]) => `+${val} ${stat.toUpperCase()}`)
                  .join(', ');
                if (statGainMsg) addLog(`Stat bonuses: ${statGainMsg}`, 'success');
              }
              addToast(`🌟 Level Up! You are now level ${finalLvl}!`, 'success', 4000);
              onLevelUp(finalLvl, currentQuestLog, allQuests);
          }

          // Update player state (exp, stones, hp, qi, quest progress, pity, kill counter, titles)
          // Inventory is NOT updated here - it's updated when loot modal closes
          const isBossKill = mob.boss || mob.isBoss;
          setPlayer(p => {
            const newTotalKills = (p.totalKills || 0) + 1;
            const newBossKills = (p.bossKills || 0) + (isBossKill ? 1 : 0);
            
            // Build player stats for title checking
            const playerStatsForTitles: PlayerStats = {
              level: finalLvl,
              totalKills: newTotalKills,
              bossKills: newBossKills,
              zonesVisited: p.visited?.length || 0,
              totalCrafts: p.totalCrafts || 0,
              itemsCollected: p.itemsCollected || 0,
              totalSpiritStonesEarned: (p.totalSpiritStonesEarned || 0) + totalStones,
              deaths: p.deaths || 0,
              immortalCrafts: p.immortalCrafts || 0,
            };
            
            // Check for newly unlocked titles
            const currentTitleState = p.titleState || createDefaultTitleState();
            const newlyUnlocked = getNewlyUnlockedTitles(playerStatsForTitles, currentTitleState.unlockedTitles);
            
            // Show notifications for new titles
            if (newlyUnlocked.length > 0) {
              newlyUnlocked.forEach(title => {
                addToast(`🏆 Title Unlocked: ${title.name}!`, 'success', 5000);
                addLog(`🏆 NEW TITLE: "${title.name}" - ${title.description}`, 'system');
              });
            }
            
            // Get updated unlocks
            const updatedUnlocks = getUnlockedTitles(playerStatsForTitles, currentTitleState.unlockedTitles);
            
            // Calculate new max HP/QI if leveled up
            let newMaxHp = p.maxHp;
            let newMaxQi = p.maxQi;
            let newLevelBonusStats = p.levelBonusStats || { str: 0, dex: 0, con: 0, spi: 0, wil: 0 };
            
            if (levelUpGains) {
              newMaxHp = (p.maxHp || BASE_SCALING.BASE_HP) + levelUpGains.hpGain;
              newMaxQi = (p.maxQi || BASE_SCALING.BASE_QI) + levelUpGains.qiGain;
              newLevelBonusStats = {
                str: (newLevelBonusStats.str || 0) + levelUpGains.statGains.str,
                dex: (newLevelBonusStats.dex || 0) + levelUpGains.statGains.dex,
                con: (newLevelBonusStats.con || 0) + levelUpGains.statGains.con,
                spi: (newLevelBonusStats.spi || 0) + levelUpGains.statGains.spi,
                wil: (newLevelBonusStats.wil || 0) + levelUpGains.statGains.wil,
              };
            }
            
            return {
              ...p,
              level: finalLvl,
              realm: getLevelInfo(finalLvl).realm,
              exp: finalExp,
              ap: newAP,
              totalAPEarned: newTotalAP,
              maxHp: newMaxHp,
              maxQi: newMaxQi,
              levelBonusStats: newLevelBonusStats,
              spiritStones: p.spiritStones + totalStones,
              totalSpiritStonesEarned: (p.totalSpiritStonesEarned || 0) + totalStones,
              hp: currentPlayerHp,
              qi: currentPlayerQi,
              pityState: newPityState,
              killCounter: newKillCounter,
              totalKills: newTotalKills,
              bossKills: newBossKills,
              questLog: currentQuestLog,
              lastCombatTime: Date.now(),
              titleState: {
                ...currentTitleState,
                unlockedTitles: updatedUnlocks,
              },
            };
          });
          
          // Close combat UI
          setCombat(null);
          
          // AUTO-LOOT: If auto-combat is active, auto-collect all loot
          if (isAutoCombatActive && pendingLoot.length > 0) {
            // Auto-collect all items
            setPlayer(p => {
              let newInv = [...p.inventory];
              pendingLoot.forEach(item => {
                // Check if stackable and exists
                if (['junk', 'material', 'consumable', 'token'].includes(item.type)) {
                  const existingItem = newInv.find(inv => 
                    (inv.itemId && inv.itemId === item.itemId) || 
                    (inv.name === item.name && inv.type === item.type)
                  );
                  if (existingItem) {
                    existingItem.count = (existingItem.count || 1) + (item.count || 1);
                  } else {
                    newInv.push({ ...item, count: item.count || 1 });
                  }
                } else {
                  // Non-stackable - just add
                  newInv.push(item);
                }
              });
              return { ...p, inventory: newInv };
            });
            addLog(`⚔️ Auto-loot: Collected ${pendingLoot.length} item(s) from ${mob.name}`, 'success');
            
            // Track auto-combat statistics
            trackAutoCombatKill(
              mob.name, 
              totalMobExp, 
              totalStones, 
              pendingLoot, 
              isBoss
            );
            
            // Check for level up tracking
            if (finalLvl > player.level) {
              trackAutoCombatLevelUp();
            }
            
            // Check for rare drop pause
            if (autoCombatSettings.pauseOnRareDrop) {
              const hasRarePlus = pendingLoot.some(item => 
                item.rarity && ['Rare', 'Epic', 'Legendary'].includes(item.rarity)
              );
              if (hasRarePlus) {
                stopAutoCombatSession('rareDrop');
                addToast('Rare item found! Auto-combat paused.', 'success');
              }
            }
          } else if (pendingLoot.length > 0) {
            // Open loot modal for manual pickup
            setLootModal({
              isOpen: true,
              loot: pendingLoot,
              spiritStones: totalStones,
              mobName: mob.name
            });
          }
          
      } else {
          // DEFEAT - Apply death penalties
          addCombatLog("DEFEAT! You fall in battle...", "danger");
          
          // Fail any active quests with 'no_death' objective
          // This must be done BEFORE updating player state
          setPlayer(prevPlayer => {
            const questLog = prevPlayer.questLog || createDefaultQuestLog();
            let updatedQuestLog = { ...questLog };
            let questsFailed = false;
            
            updatedQuestLog.active = updatedQuestLog.active.map(questState => {
              const questDef = getQuestById(questState.questId);
              if (!questDef) return questState;
              
              // Check if quest has a no_death objective
              const noDeathObj = questDef.objectives.find(obj => obj.type === 'special' && obj.target === 'no_death');
              if (noDeathObj) {
                // Mark the objective as failed (current = 0)
                const newObjectives = { ...questState.objectives, [noDeathObj.id]: 0 };
                addLog(`❌ Quest Failed: ${questDef.name} - You died during the trial!`, 'danger');
                addToast(`❌ Quest Failed: ${questDef.name}`, 'error', 5000);
                questsFailed = true;
                return { ...questState, objectives: newObjectives };
              }
              return questState;
            });
            
            return { ...prevPlayer, questLog: updatedQuestLog };
          });
          
          // Calculate death penalties
          const XP_LOSS_PERCENT = 5; // 5% of current XP
          const DURABILITY_LOSS = 15; // 15% durability loss
          
          const xpLost = Math.floor(player.exp * (XP_LOSS_PERCENT / 100));
          const damagedGear: { slot: string; name: string; newDurability: number }[] = [];
          
          setPlayer(p => {
            // Apply XP loss (can't go below 0)
            const newExp = Math.max(0, p.exp - xpLost);
            
            // Apply durability loss to all equipped gear
            const newEquipment = { ...p.equipment };
            ['weapon', 'ring', 'necklace'].forEach(slot => {
              const gear = newEquipment[slot];
              if (gear) {
                // Initialize durability if not present
                const maxDur = gear.maxDurability || 100;
                const currentDur = gear.durability ?? 100;
                const newDur = Math.max(0, currentDur - DURABILITY_LOSS);
                
                newEquipment[slot] = {
                  ...gear,
                  durability: newDur,
                  maxDurability: maxDur
                };
                
                damagedGear.push({
                  slot: slot.charAt(0).toUpperCase() + slot.slice(1),
                  name: gear.name,
                  newDurability: newDur
                });
              }
            });
            
            // Increment death counter for titles
            const newDeaths = (p.deaths || 0) + 1;
            
            // Check for death-related titles
            const currentTitleState = p.titleState || createDefaultTitleState();
            const playerStatsForTitles: PlayerStats = {
              level: p.level,
              totalKills: p.totalKills || 0,
              bossKills: p.bossKills || 0,
              zonesVisited: p.visited?.length || 0,
              totalCrafts: p.totalCrafts || 0,
              itemsCollected: p.itemsCollected || 0,
              totalSpiritStonesEarned: p.totalSpiritStonesEarned || 0,
              deaths: newDeaths,
              immortalCrafts: p.immortalCrafts || 0,
            };
            
            const newlyUnlockedTitles = getNewlyUnlockedTitles(playerStatsForTitles, currentTitleState.unlockedTitles);
            let newTitleState = currentTitleState;
            
            if (newlyUnlockedTitles.length > 0) {
              newlyUnlockedTitles.forEach(title => {
                addToast(`🏆 Title Unlocked: ${title.name}!`, 'success', 5000);
              });
              
              newTitleState = {
                ...currentTitleState,
                unlockedTitles: [
                  ...currentTitleState.unlockedTitles,
                  ...newlyUnlockedTitles.map(t => ({ titleId: t.id, unlockedAt: Date.now() }))
                ],
              };
            }
            
            return { 
              ...p, 
              hp: 1, 
              exp: newExp,
              equipment: newEquipment,
              deaths: newDeaths,
              titleState: newTitleState,
              lastCombatTime: Date.now() 
            };
          });
          
          // Show death modal with penalties
          setDeathModal({
            isOpen: true,
            penalty: {
              xpLost,
              xpPercent: XP_LOSS_PERCENT,
              durabilityLost: DURABILITY_LOSS,
              damagedGear,
              killedBy: mob.name
            }
          });
          
          setTimeout(() => setCombat(null), 1500);
      }
  };

  // Handler for loot selection from modal
  const handleLootSelected = (selectedItems: any[], ignoredItems: any[]) => {
    if (selectedItems.length === 0) {
      addLog(`You left ${ignoredItems.length} item(s) behind.`, "gray");
      return;
    }
    
    setPlayer(p => {
      let newInv = [...p.inventory];
      
      selectedItems.forEach(item => {
        // Check if stackable and exists
        if (['junk', 'material', 'consumable', 'token'].includes(item.type)) {
          const existingItem = newInv.find(inv => 
            inv.name === item.name || 
            (item.materialId && inv.materialId === item.materialId)
          );
          
          if (existingItem) {
            if ((existingItem.count || 1) < MAX_STACK) {
              existingItem.count = Math.min((existingItem.count || 1) + 1, MAX_STACK);
            } else {
              // Stack full, add as new item
              newInv.push({ ...item });
            }
          } else {
            newInv.push({ ...item });
          }
        } else {
          // Non-stackable (gear)
          newInv.push({ ...item });
        }
      });
      
      // Track items collected for titles
      const newItemsCollected = (p.itemsCollected || 0) + selectedItems.length;
      
      // Check for collection-related titles
      const currentTitleState = p.titleState || createDefaultTitleState();
      const playerStatsForTitles: PlayerStats = {
        level: p.level,
        totalKills: p.totalKills || 0,
        bossKills: p.bossKills || 0,
        zonesVisited: p.visited?.length || 0,
        totalCrafts: p.totalCrafts || 0,
        itemsCollected: newItemsCollected,
        totalSpiritStonesEarned: p.totalSpiritStonesEarned || 0,
        deaths: p.deaths || 0,
        immortalCrafts: p.immortalCrafts || 0,
      };
      
      const newlyUnlockedTitles = getNewlyUnlockedTitles(playerStatsForTitles, currentTitleState.unlockedTitles);
      let newTitleState = currentTitleState;
      
      if (newlyUnlockedTitles.length > 0) {
        newlyUnlockedTitles.forEach(title => {
          addToast(`🏆 Title Unlocked: ${title.name}!`, 'success', 5000);
        });
        
        newTitleState = {
          ...currentTitleState,
          unlockedTitles: [
            ...currentTitleState.unlockedTitles,
            ...newlyUnlockedTitles.map(t => ({ titleId: t.id, unlockedAt: Date.now() }))
          ],
        };
      }
      
      return { 
        ...p, 
        inventory: newInv,
        itemsCollected: newItemsCollected,
        titleState: newTitleState,
      };
    });
    
    // Show summary toast
    if (selectedItems.length === 1) {
      addToast(`📦 Picked up ${selectedItems[0].name}!`, 'success', 2000);
    } else {
      addToast(`📦 Picked up ${selectedItems.length} items!`, 'success', 2000);
    }
    
    if (ignoredItems.length > 0) {
      addLog(`Left behind: ${ignoredItems.map(i => i.name).join(', ')}`, "gray");
    }
  };

  // === FLEE SYSTEM ===
  const handleFleeClick = () => {
    if (!combat || !combat.active) return;
    
    // Check if confirmation is needed
    if (gameSettings.confirmBeforeFlee) {
      setFleeModalOpen(true);
    } else {
      executeFleeAttempt();
    }
  };
  
  const executeFleeAttempt = () => {
    if (!combat || !combat.active) return;
    setFleeModalOpen(false);
    
    if (Math.random() < 0.8) {
      addCombatLog("You escaped safely!", "success");
      setTimeout(() => setCombat(null), 1000);
    } else {
      addCombatLog("Failed to flee!", "danger");
    }
  };
  
  // Legacy function for compatibility
  const attemptFlee = () => {
    handleFleeClick();
  };

  // ====== SKILL SYSTEM - Complete Implementation ======
  const useSkill = (skillId: string) => {
      if (!combat || !combat.active) return;
      const skill = getSkillById(skillId);
      if (!skill) return;

      // Check cooldown
      const currentCooldown = player.skillCooldowns?.[skillId] || 0;
      if (currentCooldown > 0) {
          addCombatLog(`${skill.name} on cooldown (${currentCooldown} ticks)!`, "warning");
          return;
      }

      if (combat.playerQi >= skill.qiCost) {
          // ====== COMBO SYSTEM - Track skill usage ======
          const currentTime = Date.now();
          const newRecentSkills = [...recentSkills, { id: skillId, timestamp: currentTime }]
              .filter(s => currentTime - s.timestamp < 10000) // Keep only skills from last 10 seconds
              .slice(-3); // Keep only last 3 skills
          setRecentSkills(newRecentSkills);

          // Check for combo matches
          const skillSequence = newRecentSkills.map(s => s.id);
          const classCombos = getCombosForClass(player.class);
          const matchedCombo = checkComboMatch(skillSequence, classCombos);

          if (matchedCombo) {
              // Check if this is a new combo completion
              const isNewCombo = !comboProgress || comboProgress.combo.id !== matchedCombo.id || comboProgress.currentStep === matchedCombo.sequence.length - 1;
              
              if (isNewCombo && skillSequence.length === matchedCombo.sequence.length) {
                  // Combo completed!
                  setCompletedCombo(matchedCombo);
                  setComboBonusActive({
                      type: matchedCombo.bonusEffect.type,
                      value: matchedCombo.bonusEffect.value,
                      used: false
                  });
                  setComboProgress(null);
                  addCombatLog(`🔗 COMBO COMPLETE: ${matchedCombo.name} (${matchedCombo.nameZh})! Bonus: ${matchedCombo.bonusEffect.type} +${matchedCombo.bonusEffect.value}%`, "combo");
                  
                  // Clear completed combo animation after 3 seconds
                  setTimeout(() => setCompletedCombo(null), 3000);
              } else if (skillSequence.length < matchedCombo.sequence.length) {
                  // Combo in progress
                  setComboProgress({
                      combo: matchedCombo,
                      currentStep: skillSequence.length - 1,
                      startTime: newRecentSkills[0].timestamp,
                      nextSkills: getNextPossibleCombos(skillSequence, classCombos)
                  });
              }
          } else {
              // No combo match, clear progress
              setComboProgress(null);
          }
          // Apply cooldown
          setPlayer(p => ({
              ...p,
              skillCooldowns: {
                  ...p.skillCooldowns,
                  [skillId]: skill.cooldown
              }
          }));

          setCombat(prev => {
              if (!prev) return null;
              let newQi = prev.playerQi - skill.qiCost;
              let newMobHp = prev.mobHp;
              let newPlayerHp = prev.playerHp;
              let combatEnded = false;
              
              // Process skill effects
              skill.effects.forEach(effect => {
                  switch (effect.type) {
                      case 'damage': {
                          // Apply bestiary bonuses to skill damage
                          let skillDamageBonus = 0;
                          skillDamageBonus += bestiaryBonuses.globalAtkBonus || 0;
                          if (prev.mob?.id) {
                              const mobTags = getBestiaryMobTags(prev.mob.id);
                              mobTags.forEach(tag => {
                                  if (bestiaryBonuses.tagAtkBonus[tag]) {
                                      skillDamageBonus += bestiaryBonuses.tagAtkBonus[tag];
                                  }
                              });
                          }
                          const bestiaryMultiplier = 1 + (skillDamageBonus / 100);
                          
                          // Apply combo bonus if available
                          let comboMultiplier = 1;
                          if (comboBonusActive && !comboBonusActive.used) {
                              if (comboBonusActive.type === 'damage_bonus') {
                                  comboMultiplier = 1 + (comboBonusActive.value / 100);
                                  setComboBonusActive(cb => cb ? { ...cb, used: true } : null);
                              } else if (comboBonusActive.type === 'damage_multiplier') {
                                  comboMultiplier = comboBonusActive.value;
                                  setComboBonusActive(cb => cb ? { ...cb, used: true } : null);
                              }
                          }
                          
                          // Use mAtk for magic skills (Zither classes), pAtk for physical
                          const baseDamage = skill.element !== 'None' && (skill.classId === 9 || skill.classId === 10 || skill.classId === 11 || skill.classId === 12)
                              ? combatStats.mAtk 
                              : combatStats.pAtk;
                          const multiplier = effect.value / 100;
                          const dmg = Math.floor(baseDamage * multiplier * bestiaryMultiplier * comboMultiplier);
                          newMobHp = newMobHp - dmg;
                          
                          // VISUAL FEEDBACK: Skill damage with element color and effects
                          const elementColors = {
                              'Fire': '#ff6b35',
                              'Ice': '#00d4ff',
                              'Wood': '#4ade80',
                              'Lightning': '#facc15',
                              'Void': '#a855f7',
                              'None': '#f59e0b'
                          };
                          
                          // Map element to ElementType for burst effect
                          const elementTypeMap: Record<string, ElementType> = {
                              'Fire': 'fire',
                              'Ice': 'ice',
                              'Wood': 'wood',
                              'Lightning': 'lightning',
                              'Void': 'void'
                          };
                          
                          const skillElement = elementTypeMap[skill.element];
                          
                          // SKILL ATTACK ANIMATION with element effect
                          triggerAttackAnimation('player', skillElement, true);
                          
                          addFloatingDamage('enemy', dmg, 'crit', elementColors[skill.element] || '#f59e0b');
                          triggerHitFlash('enemy');
                          triggerScreenShake(comboMultiplier > 1 ? 'heavy' : 'medium'); // Heavy shake on combo
                          
                          // Trigger element burst only for elemental skills (not "None")
                          if (skillElement && skill.element !== 'None') {
                            triggerElementBurst(skillElement);
                          }
                          
                          // Subtle passive visual instead of the box
                          triggerPassiveVisual(skill.icon, skill.name);
                          
                          const comboText = comboMultiplier > 1 ? ` [COMBO x${comboMultiplier.toFixed(1)}]` : '';
                          addCombatLog(`${skill.icon} ${skill.name}: ${dmg} ${skill.element} dmg${comboText}!`, "info");
                          break;
                      }
                      case 'heal': {
                          const healingModifier = getHealingModifier(effectState.player);
                          const healMultiplier = 1 + (healingModifier / 100);
                          const baseHeal = Math.floor(prev.maxPlayerHp * (effect.value / 100));
                          const heal = Math.floor(baseHeal * healMultiplier);
                          newPlayerHp = Math.min(newPlayerHp + heal, prev.maxPlayerHp);
                          
                          addFloatingDamage('player', heal, 'heal');
                          addCombatLog(`${skill.icon} ${skill.name}: +${heal} HP${healingModifier > 0 ? ` (${Math.floor(healingModifier)}% boost)` : ''}!`, "success");
                          break;
                      }
                      case 'shield': {
                          const shieldAmount = Math.floor(prev.maxPlayerHp * (effect.value / 100));
                          setEffectState(es => ({
                              ...es,
                              player: [...es.player, {
                                  type: 'shield',
                                  value: shieldAmount,
                                  duration: effect.duration || 5,
                                  icon: '🛡️',
                                  name: 'Shield'
                              }]
                          }));
                          addFloatingDamage('player', `🛡️${shieldAmount}`, 'effect', '#3b82f6');
                          addCombatLog(`${skill.icon} ${skill.name}: Shield for ${shieldAmount} HP!`, "info");
                          break;
                      }
                      case 'buff': {
                          setEffectState(es => ({
                              ...es,
                              player: [...es.player, {
                                  type: 'buff',
                                  stat: effect.stat || 'atk',
                                  value: effect.value,
                                  duration: effect.duration || 5,
                                  icon: '⬆️',
                                  name: `+${effect.value}% ${effect.stat?.toUpperCase() || 'ATK'}`
                              }]
                          }));
                          addFloatingDamage('player', `⬆️${effect.value}%`, 'effect', '#22c55e');
                          addCombatLog(`${skill.icon} ${skill.name}: +${effect.value}% ${effect.stat?.toUpperCase() || 'ATK'} for ${effect.duration || 5} ticks!`, "success");
                          break;
                      }
                      case 'debuff': {
                          setEffectState(es => ({
                              ...es,
                              mob: [...es.mob, {
                                  type: 'debuff',
                                  stat: effect.stat || 'atk',
                                  value: effect.value,
                                  duration: effect.duration || 5,
                                  icon: '⬇️',
                                  name: `-${effect.value}% ${effect.stat?.toUpperCase() || 'ATK'}`
                              }]
                          }));
                          addFloatingDamage('enemy', `⬇️${effect.value}%`, 'effect', '#ef4444');
                          addCombatLog(`${skill.icon} ${skill.name}: Enemy -${effect.value}% ${effect.stat?.toUpperCase() || 'ATK'}!`, "info");
                          break;
                      }
                      case 'dot': {
                          setEffectState(es => ({
                              ...es,
                              mob: [...es.mob, {
                                  type: 'dot',
                                  value: effect.value,
                                  duration: effect.duration || 3,
                                  icon: skill.element === 'Fire' ? '🔥' : skill.element === 'Void' ? '☠️' : '💔',
                                  name: skill.element === 'Fire' ? 'Burn' : skill.element === 'Void' ? 'Poison' : 'Bleed'
                              }]
                          }));
                          addCombatLog(`${skill.icon} ${skill.name}: Applied ${skill.element === 'Fire' ? 'Burn' : skill.element === 'Void' ? 'Poison' : 'DoT'}!`, "info");
                          break;
                      }
                      case 'stun': {
                          setEffectState(es => ({
                              ...es,
                              mob: [...es.mob, {
                                  type: 'stun',
                                  value: 1,
                                  duration: effect.duration || 1,
                                  icon: '💫',
                                  name: 'Stunned'
                              }]
                          }));
                          addFloatingDamage('enemy', '💫 STUN', 'effect', '#facc15');
                          addCombatLog(`${skill.icon} ${skill.name}: Enemy stunned for ${effect.duration || 1} ticks!`, "success");
                          break;
                      }
                      case 'freeze': {
                          setEffectState(es => ({
                              ...es,
                              mob: [...es.mob, {
                                  type: 'stun', // Freeze = Stun mechanically
                                  value: 1,
                                  duration: effect.duration || 2,
                                  icon: '🧊',
                                  name: 'Frozen'
                              }]
                          }));
                          addFloatingDamage('enemy', '🧊 FROZEN', 'effect', '#00d4ff');
                          addCombatLog(`${skill.icon} ${skill.name}: Enemy frozen for ${effect.duration || 2} ticks!`, "success");
                          break;
                      }
                      case 'lifesteal': {
                          // Lifesteal is applied after damage
                          const damageDealt = skill.effects.find(e => e.type === 'damage');
                          if (damageDealt) {
                              const baseDmg = combatStats.pAtk * (damageDealt.value / 100);
                              const lifeStealAmount = Math.floor(baseDmg * (effect.value / 100));
                              newPlayerHp = Math.min(newPlayerHp + lifeStealAmount, prev.maxPlayerHp);
                              addFloatingDamage('player', lifeStealAmount, 'heal');
                              addCombatLog(`Lifesteal: +${lifeStealAmount} HP!`, "success");
                          }
                          break;
                      }
                      case 'dodge': {
                          setEffectState(es => ({
                              ...es,
                              player: [...es.player, {
                                  type: 'buff',
                                  stat: 'dodge',
                                  value: effect.value,
                                  duration: effect.duration || 2,
                                  icon: '💨',
                                  name: `+${effect.value}% Dodge`
                              }]
                          }));
                          addCombatLog(`${skill.icon} ${skill.name}: +${effect.value}% Dodge for ${effect.duration || 2} ticks!`, "success");
                          break;
                      }
                      case 'reflect': {
                          setEffectState(es => ({
                              ...es,
                              player: [...es.player, {
                                  type: 'reflect',
                                  value: effect.value,
                                  duration: effect.duration || 3,
                                  icon: '🪞',
                                  name: `Reflect ${effect.value}%`
                              }]
                          }));
                          addCombatLog(`${skill.icon} ${skill.name}: Reflecting ${effect.value}% damage!`, "info");
                          break;
                      }
                      case 'cleanse': {
                          setEffectState(es => ({
                              ...es,
                              player: es.player.filter(e => e.type !== 'debuff' && e.type !== 'dot')
                          }));
                          addFloatingDamage('player', '✨ CLEANSE', 'effect', '#22c55e');
                          addCombatLog(`${skill.icon} ${skill.name}: All debuffs removed!`, "success");
                          break;
                      }
                  }
              });

              // ====== APPLY NON-DAMAGE COMBO BONUSES ======
              if (comboBonusActive && !comboBonusActive.used) {
                  switch (comboBonusActive.type) {
                      case 'heal': {
                          const comboHeal = Math.floor(prev.maxPlayerHp * (comboBonusActive.value / 100));
                          newPlayerHp = Math.min(newPlayerHp + comboHeal, prev.maxPlayerHp);
                          addFloatingDamage('player', comboHeal, 'heal');
                          addCombatLog(`🔗 Combo Heal: +${comboHeal} HP!`, "combo");
                          setComboBonusActive(cb => cb ? { ...cb, used: true } : null);
                          break;
                      }
                      case 'qi_restore': {
                          const qiRestore = comboBonusActive.value;
                          newQi = Math.min(newQi + qiRestore, prev.maxPlayerQi);
                          addFloatingDamage('player', `🌀+${qiRestore}`, 'effect', '#3b82f6');
                          addCombatLog(`🔗 Combo Qi Restore: +${qiRestore} Qi!`, "combo");
                          setComboBonusActive(cb => cb ? { ...cb, used: true } : null);
                          break;
                      }
                      case 'apply_effect': {
                          const effectValue = comboBonusActive.value || 0;
                          
                          // Check effect name to determine which effect to apply
                          if (completedCombo) {
                              const effectName = completedCombo.bonusEffect.effectName;
                              
                              if (effectName === 'stun' || effectName === 'Stun') {
                                  setEffectState(es => ({
                                      ...es,
                                      mob: [...es.mob, {
                                          type: 'stun',
                                          value: 1,
                                          duration: 2,
                                          icon: '💫',
                                          name: 'Stunned'
                                      }]
                                  }));
                                  addFloatingDamage('enemy', '💫 STUN', 'effect', '#facc15');
                                  addCombatLog(`🔗 Combo Effect: Enemy stunned!`, "combo");
                              } else if (effectName === 'freeze' || effectName === 'Freeze') {
                                  setEffectState(es => ({
                                      ...es,
                                      mob: [...es.mob, {
                                          type: 'stun',
                                          value: 1,
                                          duration: 2,
                                          icon: '🧊',
                                          name: 'Frozen'
                                      }]
                                  }));
                                  addFloatingDamage('enemy', '🧊 FROZEN', 'effect', '#00d4ff');
                                  addCombatLog(`🔗 Combo Effect: Enemy frozen!`, "combo");
                              } else if (effectName === 'burn' || effectName === 'Burn') {
                                  setEffectState(es => ({
                                      ...es,
                                      mob: [...es.mob, {
                                          type: 'dot',
                                          value: 50,
                                          duration: 3,
                                          icon: '🔥',
                                          name: 'Burn'
                                      }]
                                  }));
                                  addCombatLog(`🔗 Combo Effect: Applied Burn!`, "combo");
                              }
                          }
                          
                          setComboBonusActive(cb => cb ? { ...cb, used: true } : null);
                          break;
                      }
                      case 'cooldown_reset': {
                          // Reset the cooldown of the last used skill
                          const lastSkillId = recentSkills[recentSkills.length - 1]?.id;
                          if (lastSkillId) {
                              setPlayer(p => ({
                                  ...p,
                                  skillCooldowns: {
                                      ...p.skillCooldowns,
                                      [lastSkillId]: 0
                                  }
                              }));
                              const resetSkill = getSkillById(lastSkillId);
                              addCombatLog(`🔗 Combo: ${resetSkill?.name || 'Skill'} cooldown reset!`, "combo");
                          }
                          setComboBonusActive(cb => cb ? { ...cb, used: true } : null);
                          break;
                      }
                  }
              }

              // Check if mob died
              if (newMobHp <= 0) {
                  combatEnded = true;
                  // Capture current values for closure
                  const capturedHp = newPlayerHp;
                  const capturedQi = newQi;
                  setTimeout(() => endCombat(true, prev.mob, capturedHp, capturedQi), 100);
                  return { ...prev, active: false, mobHp: 0, playerHp: newPlayerHp, playerQi: newQi };
              }
              
              return { ...prev, mobHp: newMobHp, playerHp: newPlayerHp, playerQi: newQi };
          });
      } else addCombatLog("No Qi!", "warning");
  };
  
  // Keep ref updated for auto-skill usage in combat loop
  useEffect(() => {
    useSkillRef.current = useSkill;
  });

  // ====== DEFENSE SYSTEM ======
  const activateDefense = (type: 'block' | 'dodge' | 'counter') => {
      if (!combat || !combat.active) return;
      if (activeDefense !== null) return; // Already have an active defense
      
      // Check cooldown
      if (type === 'block' && blockCooldown > 0) return;
      if (type === 'dodge' && dodgeCooldown > 0) return;
      if (type === 'counter' && counterCooldown > 0) return;
      
      // Activate defense
      setActiveDefense(type);
      
      // Set duration timers
      const durations = {
          block: 2000,    // 2 seconds
          dodge: 1500,    // 1.5 seconds
          counter: 1000   // 1 second (precise timing)
      };
      
      // Log activation
      const messages = {
          block: '🛡️ Block stance activated!',
          dodge: '💨 Dodge ready!',
          counter: '⚔️ Counter stance ready!'
      };
      addCombatLog(messages[type], 'info');
      
      // Auto-deactivate after duration if not used
      setTimeout(() => {
          setActiveDefense(prev => {
              if (prev === type) {
                  addCombatLog(`${type === 'block' ? '🛡️' : type === 'dodge' ? '💨' : '⚔️'} ${type.charAt(0).toUpperCase() + type.slice(1)} expired!`, 'warning');
                  return null;
              }
              return prev;
          });
      }, durations[type]);
  };

  // Reduce cooldowns every combat tick
  const tickCooldowns = () => {
      setPlayer(p => {
          const newCooldowns = { ...p.skillCooldowns };
          Object.keys(newCooldowns).forEach(skillId => {
              if (newCooldowns[skillId] > 0) {
                  newCooldowns[skillId]--;
              }
          });
          return { ...p, skillCooldowns: newCooldowns };
      });
      
      // Reduce defense cooldowns
      setBlockCooldown(prev => Math.max(0, prev - 1));
      setDodgeCooldown(prev => Math.max(0, prev - 1));
      setCounterCooldown(prev => Math.max(0, prev - 1));
  };

  // Get available skills for current class and level
  const getPlayerAvailableSkills = (): Skill[] => {
      if (!player.selectedClass) return [];
      return getAvailableSkills(player.selectedClass, player.level);
  };

  // Auto-assign hotbar on class selection or level up
  const refreshHotbar = () => {
      if (!player.selectedClass) return;
      const defaultHotbar = getDefaultHotbar(player.selectedClass, player.level);
      setPlayer(p => ({ ...p, skills: defaultHotbar }));
  };

  // ====== EQUIPMENT SYSTEM (6 Slots) ======
  
  // Map item types to equipment slots (3 slots: weapon, ring, necklace)
  const getEquipmentSlot = (item: any): string | null => {
    if (!item) return null;
    
    // Check item.slot first (for crafted items)
    if (item.slot) return item.slot;
    
    // Check item.type for gear type
    const type = item.type?.toLowerCase() || '';
    const subtype = item.subtype?.toLowerCase() || '';
    
    if (type === 'weapon' || subtype === 'sword' || subtype === 'saber' || subtype === 'zither') return 'weapon';
    if (type === 'ring') return 'ring';
    if (type === 'necklace' || type === 'amulet') return 'necklace';
    
    // For gear items without specific type, default to weapon
    if (type === 'gear') return 'weapon';
    
    return null;
  };

  // Calculate total stats from equipped items
  const getEquipmentStats = useMemo(() => {
    const equipment = player.equipment || {};
    const bonusStats = { str: 0, dex: 0, con: 0, spi: 0, wil: 0 };
    
    Object.values(equipment).forEach((item: any) => {
      if (item && item.stats) {
        Object.entries(item.stats).forEach(([stat, value]) => {
          if (bonusStats[stat] !== undefined) {
            bonusStats[stat] += value as number;
          }
        });
      }
    });
    
    return bonusStats;
  }, [player.equipment]);

  // Equip an item from inventory
  const equipItem = (itemFromInv: any) => {
    const slot = getEquipmentSlot(itemFromInv);
    if (!slot) {
      addLog("Cannot equip this item.", "warning");
      return;
    }
    
    setPlayer(p => {
      const equipment = { ...(p.equipment || {}) };
      const currentEquipped = equipment[slot];
      let newInv = p.inventory.filter(i => i.id !== itemFromInv.id);
      
      // If there's already something equipped, put it back in inventory
      if (currentEquipped) {
        newInv.push({
          ...currentEquipped,
          id: generateUniqueId(),
        });
      }
      
      // Equip the new item
      equipment[slot] = {
        ...itemFromInv,
        equippedAt: Date.now(),
      };
      
      return {
        ...p,
        equipment,
        inventory: newInv,
      };
    });
    
    addLog(`✅ Equipped ${itemFromInv.name} in ${slot} slot.`, "success");
    addToast(`Equipped ${itemFromInv.name}`, 'success');
  };

  // Unequip an item from a slot
  const unequipItem = (slot: string) => {
    const equipment = player.equipment || {};
    const equippedItem = equipment[slot];
    
    if (!equippedItem) {
      addLog("Nothing equipped in that slot.", "warning");
      return;
    }
    
    setPlayer(p => {
      const newEquipment = { ...(p.equipment || {}) };
      newEquipment[slot] = null;
      
      // Add item back to inventory
      const newInv = [...p.inventory, {
        ...equippedItem,
        id: generateUniqueId(),
        equippedAt: undefined,
      }];
      
      return {
        ...p,
        equipment: newEquipment,
        inventory: newInv,
      };
    });
    
    addLog(`Unequipped ${equippedItem.name} from ${slot} slot.`, "info");
  };

  // Repair Equipment Functions
  const handleRepairGear = (slot: string, cost: number) => {
    if (player.spiritStones < cost) {
      addLog("Not enough Spirit Stones for repair!", "warning");
      return;
    }
    
    setPlayer(p => {
      const equipment = { ...p.equipment };
      const gear = equipment[slot];
      
      if (!gear) return p;
      
      equipment[slot] = {
        ...gear,
        durability: gear.maxDurability || 100,
      };
      
      return {
        ...p,
        equipment,
        spiritStones: p.spiritStones - cost,
      };
    });
    
    const gearName = player.equipment?.[slot]?.name || 'item';
    addLog(`🔧 Repaired ${gearName} for ${cost} Spirit Stones.`, "success");
    addToast(`Repaired ${gearName}`, 'success');
  };

  const handleRepairAllGear = (totalCost: number) => {
    if (player.spiritStones < totalCost) {
      addLog("Not enough Spirit Stones for repairs!", "warning");
      return;
    }
    
    setPlayer(p => {
      const equipment = { ...p.equipment };
      
      ['weapon', 'ring', 'necklace'].forEach(slot => {
        const gear = equipment[slot];
        if (gear && gear.durability < (gear.maxDurability || 100)) {
          equipment[slot] = {
            ...gear,
            durability: gear.maxDurability || 100,
          };
        }
      });
      
      return {
        ...p,
        equipment,
        spiritStones: p.spiritStones - totalCost,
      };
    });
    
    addLog(`🔧 Repaired all equipment for ${totalCost} Spirit Stones.`, "success");
    addToast('All equipment repaired!', 'success');
    setRepairModalOpen(false);
  };

  // Bank Functions
  const depositToBank = (item, quantity = null) => {
    if ((player.bank || []).length >= 100) {
      addLog("Personal Vault is full!", "warning");
      return;
    }
    
    const itemCount = item.count || 1;
    const transferQuantity = quantity !== null ? Math.min(quantity, itemCount) : itemCount;
    
    if (transferQuantity === itemCount) {
      // Transfer entire stack
      setPlayer(p => {
        const existingBankItem = (p.bank || []).find(i => (i.id === item.id || i.iconType === item.iconType) && i.type === item.type && i.type === 'material');
        if (existingBankItem && item.type === 'material') {
          // Check stack limit
          const currentCount = existingBankItem.count || 1;
          const canAdd = Math.min(itemCount, MAX_STACK - currentCount);
          if (canAdd <= 0) {
            addLog(`Cannot deposit - stack full (max ${MAX_STACK})`, "warning");
            return p;
          }
          return {
            ...p,
            inventory: p.inventory.filter(i => i.id !== item.id),
            bank: (p.bank || []).map(i => i.id === existingBankItem.id ? { ...i, count: Math.min((i.count || 1) + itemCount, MAX_STACK) } : i)
          };
        }
        return {
          ...p,
          inventory: p.inventory.filter(i => i.id !== item.id),
          bank: [...(p.bank || []), { ...item, id: generateUniqueId() }]
        };
      });
    } else {
      // Transfer partial stack
      setPlayer(p => {
        const existingBankItem = (p.bank || []).find(i => (i.id === item.id || i.iconType === item.iconType) && i.type === item.type && i.type === 'material');
        const updatedInventory = p.inventory.map(i => 
          i.id === item.id ? { ...i, count: itemCount - transferQuantity } : i
        ).filter(i => (i.count || 1) > 0);
        
        if (existingBankItem && item.type === 'material') {
          const currentCount = existingBankItem.count || 1;
          const canAdd = Math.min(transferQuantity, MAX_STACK - currentCount);
          if (canAdd <= 0) {
            addLog(`Cannot deposit - stack full (max ${MAX_STACK})`, "warning");
            return p;
          }
          return {
            ...p,
            inventory: updatedInventory,
            bank: (p.bank || []).map(i => i.id === existingBankItem.id ? { ...i, count: Math.min((i.count || 1) + transferQuantity, MAX_STACK) } : i)
          };
        }
        return {
          ...p,
          inventory: updatedInventory,
          bank: [...(p.bank || []), { ...item, id: generateUniqueId(), count: transferQuantity }]
        };
      });
    }
    addLog(`Deposited ${transferQuantity}x ${item.name || 'item'} to Personal Vault.`, "success");
  };

  const withdrawFromBank = (item, quantity = null) => {
    if (player.inventory.length >= 96) {
      addLog("Inventory is full!", "warning");
      return;
    }
    
    const itemCount = item.count || 1;
    const transferQuantity = quantity !== null ? Math.min(quantity, itemCount) : itemCount;
    
    if (transferQuantity === itemCount) {
      // Transfer entire stack
      setPlayer(p => {
        const existingInvItem = p.inventory.find(i => (i.id === item.id || i.iconType === item.iconType) && i.type === item.type && i.type === 'material');
        if (existingInvItem && item.type === 'material') {
          const currentCount = existingInvItem.count || 1;
          const canAdd = Math.min(itemCount, MAX_STACK - currentCount);
          if (canAdd <= 0) {
            addLog(`Cannot withdraw - inventory stack full (max ${MAX_STACK})`, "warning");
            return p;
          }
          return {
            ...p,
            bank: (p.bank || []).filter(i => i.id !== item.id),
            inventory: p.inventory.map(i => i.id === existingInvItem.id ? { ...i, count: Math.min((i.count || 1) + itemCount, MAX_STACK) } : i)
          };
        }
        return {
          ...p,
          bank: (p.bank || []).filter(i => i.id !== item.id),
          inventory: [...p.inventory, { ...item, id: generateUniqueId() }]
        };
      });
    } else {
      // Transfer partial stack
      setPlayer(p => {
        const existingInvItem = p.inventory.find(i => (i.id === item.id || i.iconType === item.iconType) && i.type === item.type && i.type === 'material');
        const updatedBank = (p.bank || []).map(i => 
          i.id === item.id ? { ...i, count: itemCount - transferQuantity } : i
        ).filter(i => (i.count || 1) > 0);
        
        if (existingInvItem && item.type === 'material') {
          const currentCount = existingInvItem.count || 1;
          const canAdd = Math.min(transferQuantity, MAX_STACK - currentCount);
          if (canAdd <= 0) {
            addLog(`Cannot withdraw - inventory stack full (max ${MAX_STACK})`, "warning");
            return p;
          }
          return {
            ...p,
            bank: updatedBank,
            inventory: p.inventory.map(i => i.id === existingInvItem.id ? { ...i, count: Math.min((i.count || 1) + transferQuantity, MAX_STACK) } : i)
          };
        }
        return {
          ...p,
          bank: updatedBank,
          inventory: [...p.inventory, { ...item, id: generateUniqueId(), count: transferQuantity }]
        };
      });
    }
    addLog(`Withdrew ${transferQuantity}x ${item.name || 'item'} from Personal Vault.`, "success");
  };

  // Sell Junk Item to Vendor
  const sellJunkItem = (item) => {
    if (item.type !== 'junk') {
      addLog("Only junk items can be sold!", "warning");
      return;
    }
    const sellValue = (item.sellValue || 0) * (item.count || 1);
    setPlayer(p => ({
      ...p,
      inventory: p.inventory.filter(i => i.id !== item.id),
      spiritStones: p.spiritStones + sellValue,
      totalSpiritStonesEarned: (p.totalSpiritStonesEarned || 0) + sellValue,
    }));
    addLog(`💰 Sold ${item.name} for ${sellValue} Spirit Stones!`, "success");
  };

  // Sell All Junk Items
  const sellAllJunk = () => {
    const junkItems = player.inventory.filter(i => i.type === 'junk');
    if (junkItems.length === 0) {
      addLog("No junk items to sell!", "info");
      return;
    }
    const totalValue = junkItems.reduce((sum, item) => sum + (item.sellValue || 0) * (item.count || 1), 0);
    setPlayer(p => ({
      ...p,
      inventory: p.inventory.filter(i => i.type !== 'junk'),
      spiritStones: p.spiritStones + totalValue,
      totalSpiritStonesEarned: (p.totalSpiritStonesEarned || 0) + totalValue,
    }));
    addLog(`💰 Sold ${junkItems.length} junk items for ${totalValue} Spirit Stones!`, "success");
  };

  // Stack/Consolidate Inventory Items
  const stackInventory = (): number => {
    const stackableTypes = ['material', 'consumable', 'junk'];
    let stacksConsolidated = 0;
    
    setPlayer(p => {
      const stackableItems = p.inventory.filter(item => stackableTypes.includes(item.type));
      const nonStackableItems = p.inventory.filter(item => !stackableTypes.includes(item.type));
      
      // Group items by their identifier (materialId, name, or id)
      const grouped: Record<string, any> = {};
      
      stackableItems.forEach(item => {
        // Create a unique key based on item identity
        const key = item.materialId || item.id || item.name;
        
        if (grouped[key]) {
          // Merge: add count to existing stack
          grouped[key].count = (grouped[key].count || 1) + (item.count || 1);
          stacksConsolidated++;
        } else {
          // First occurrence: clone item
          grouped[key] = { ...item, count: item.count || 1 };
        }
      });
      
      // Convert grouped back to array
      const consolidatedStackable = Object.values(grouped);
      
      return {
        ...p,
        inventory: [...nonStackableItems, ...consolidatedStackable]
      };
    });
    
    if (stacksConsolidated > 0) {
      addLog(`📦 Consolidated ${stacksConsolidated} item stacks!`, "success");
    } else {
      addLog("📦 Inventory already optimized!", "info");
    }
    
    return stacksConsolidated;
  };

  // Crafting and Reforging Handlers
  const handleCraft = (result: any) => {
    if (result.success && result.item) {
      // Success: Add crafted item, consume materials, deduct stones, reset pity
      setPlayer(p => {
        let newInv = [...p.inventory];
        
        // Consume materials from inventory
        if (result.materialsConsumed && Array.isArray(result.materialsConsumed)) {
          result.materialsConsumed.forEach((cost: {materialId: string, quantity: number}) => {
            // Find material by ID to get its name
            const materialDef = getMaterialById(cost.materialId);
            const materialName = materialDef?.name || cost.materialId;
            
            const matIndex = newInv.findIndex(item => 
              item.materialId === cost.materialId || 
              item.name === materialName ||
              item.name === cost.materialId
            );
            if (matIndex !== -1) {
              newInv[matIndex].count -= cost.quantity;
              if (newInv[matIndex].count <= 0) {
                newInv = newInv.filter((_, i) => i !== matIndex);
              }
            }
          });
        }
        
        // Add crafted item
        newInv.push({
          id: generateUniqueId(),
          itemId: result.item.id,
          name: result.item.name,
          type: 'gear',
          rarity: result.item.rarity,
          tier: result.item.tier,
          iconType: getWeaponIconType(result.item),
          count: 1,
          stats: result.item.stats,
          secondaryStats: result.item.secondaryStats, // Include secondary stats from crafting roll
          specialEffects: result.item.specialEffects
        });
        
        // Reset craft pity for this tier
        const newPityState = resetPityOnSuccess(
          p.pityState || createInitialPityState(), 
          'craft', 
          result.item.tier
        );
        
        // Track crafting stats for titles
        const newTotalCrafts = (p.totalCrafts || 0) + 1;
        const isImmortal = result.item.rarity === 'Immortal';
        const newImmortalCrafts = (p.immortalCrafts || 0) + (isImmortal ? 1 : 0);
        
        // Check for crafting-related titles
        const currentTitleState = p.titleState || createDefaultTitleState();
        const playerStatsForTitles: PlayerStats = {
          level: p.level,
          totalKills: p.totalKills || 0,
          bossKills: p.bossKills || 0,
          zonesVisited: p.visited?.length || 0,
          totalCrafts: newTotalCrafts,
          itemsCollected: p.itemsCollected || 0,
          totalSpiritStonesEarned: p.totalSpiritStonesEarned || 0,
          deaths: p.deaths || 0,
          immortalCrafts: newImmortalCrafts,
        };
        
        const newlyUnlockedTitles = getNewlyUnlockedTitles(playerStatsForTitles, currentTitleState.unlockedTitles);
        let newTitleState = currentTitleState;
        
        if (newlyUnlockedTitles.length > 0) {
          newlyUnlockedTitles.forEach(title => {
            addToast(`🏆 Title Unlocked: ${title.name}!`, 'success', 5000);
          });
          
          newTitleState = {
            ...currentTitleState,
            unlockedTitles: [
              ...currentTitleState.unlockedTitles,
              ...newlyUnlockedTitles.map(t => ({ titleId: t.id, unlockedAt: Date.now() }))
            ],
          };
        }
        
        return {
          ...p,
          inventory: newInv,
          spiritStones: p.spiritStones - (result.cost || 0),
          pityState: newPityState,
          totalCrafts: newTotalCrafts,
          immortalCrafts: newImmortalCrafts,
          titleState: newTitleState,
        };
      });
      addLog(`✨ Crafted ${result.item.rarity} ${result.item.name}!`, "success");
      addToast(`✨ Crafted ${result.item.name}!`, 'success', 4000);
    } else if (result.failed) {
      // Failed craft - consume materials based on fail penalty, increment pity
      setPlayer(p => {
        let newInv = [...p.inventory];
        
        // Consume materials (full or half based on penalty)
        if (result.materialsConsumed && Array.isArray(result.materialsConsumed)) {
          const consumeRate = result.failPenalty === 'half' ? 0.5 : (result.failPenalty === 'none' ? 0 : 1);
          result.materialsConsumed.forEach((cost: {materialId: string, quantity: number}) => {
            // Find material by ID to get its name
            const materialDef = getMaterialById(cost.materialId);
            const materialName = materialDef?.name || cost.materialId;
            
            const matIndex = newInv.findIndex(item => 
              item.materialId === cost.materialId || 
              item.name === materialName ||
              item.name === cost.materialId
            );
            if (matIndex !== -1) {
              const toConsume = Math.ceil(cost.quantity * consumeRate);
              newInv[matIndex].count -= toConsume;
              if (newInv[matIndex].count <= 0) {
                newInv = newInv.filter((_, i) => i !== matIndex);
              }
            }
          });
        }
        
        // Increment craft pity
        const newPityState = incrementPityOnFail(
          p.pityState || createInitialPityState(), 
          'craft', 
          result.tier
        );
        
        // Notify player of pity progress
        const pityBonus = getCraftPityBonus(newPityState.craftPity[result.tier] || 0);
        if (pityBonus > 0) {
          addLog(`🔧 Pity bonus: +${pityBonus}% success rate for next Tier ${result.tier} craft!`, "info");
        }
        
        return {
          ...p,
          inventory: newInv,
          spiritStones: p.spiritStones - (result.cost || 0),
          pityState: newPityState
        };
      });
      
      const penaltyMsg = result.failPenalty === 'half' ? '50% materials lost.' : 
                         result.failPenalty === 'none' ? 'No materials lost.' : 'Materials lost.';
      addLog(`❌ Crafting failed! ${penaltyMsg}`, "danger");
      addToast(`❌ Crafting failed! Materials lost.`, 'error');
    }
  };

  const handleReforge = (result: any) => {
    if (!result) return;
    
    if (result.outcome === 'success' && result.newItem) {
      // Upgrade successful - reset reforge pity
      setPlayer(p => {
        const newInv = p.inventory.map(item => 
          item.id === result.originalId 
            ? { ...item, rarity: result.newItem.rarity, name: result.newItem.name }
            : item
        );
        const newPityState = resetPityOnSuccess(
          p.pityState || createInitialPityState(),
          'reforge'
        );
        return {
          ...p,
          inventory: newInv,
          spiritStones: p.spiritStones - (result.cost || 0),
          pityState: newPityState
        };
      });
      addLog(`✨ Reforge success! ${result.newItem.rarity} ${result.newItem.name}`, "success");
      addToast(`✨ Reforge Success! ${result.newItem.rarity}!`, 'success', 4000);
    } else if (result.outcome === 'downgrade') {
      // Downgrade - increment reforge pity
      setPlayer(p => {
        const newInv = p.inventory.map(item => 
          item.id === result.originalId 
            ? { ...item, rarity: result.newRarity }
            : item
        );
        const newPityState = incrementPityOnFail(
          p.pityState || createInitialPityState(),
          'reforge'
        );
        return { 
          ...p, 
          inventory: newInv,
          pityState: newPityState
        };
      });
      addLog(`⬇️ Reforge failed! Item downgraded. (+1 Legendary Essence)`, "warning");
      addToast(`⬇️ Reforge failed - Item downgraded`, 'warning');
    } else if (result.outcome === 'destroy') {
      // Item destroyed - increment reforge pity
      setPlayer(p => {
        const newPityState = incrementPityOnFail(
          p.pityState || createInitialPityState(),
          'reforge'
        );
        return {
          ...p,
          inventory: p.inventory.filter(item => item.id !== result.originalId),
          pityState: newPityState
        };
      });
      addLog(`💥 Reforge catastrophe! Item destroyed. (+1 Legendary Essence)`, "danger");
    }
  };

  // Salvage Handler - Dismantle gear for materials
  const handleSalvage = (result: SalvageResult) => {
    if (!result.success) return;

    setPlayer(p => {
      // Remove the salvaged item
      const newInv = p.inventory.filter(item => item.id !== result.itemId);

      // Add materials to inventory
      result.materials.forEach(mat => {
        const existingMat = newInv.find(item => 
          item.materialId === mat.materialId || item.name === mat.name
        );
        if (existingMat) {
          existingMat.count = (existingMat.count || 1) + mat.quantity;
        } else {
          newInv.push({
            id: `${mat.materialId}_${Date.now()}`,
            materialId: mat.materialId,
            name: mat.name,
            type: 'material',
            count: mat.quantity,
          });
        }
      });

      // Add special material if received
      if (result.specialMaterial) {
        const existingSpecial = newInv.find(item => 
          item.materialId === result.specialMaterial?.materialId
        );
        if (existingSpecial) {
          existingSpecial.count = (existingSpecial.count || 1) + 1;
        } else {
          newInv.push({
            id: `${result.specialMaterial.materialId}_${Date.now()}`,
            materialId: result.specialMaterial.materialId,
            name: result.specialMaterial.name,
            type: 'material',
            count: 1,
          });
        }
      }

      return {
        ...p,
        inventory: newInv,
        spiritStones: p.spiritStones + result.spiritStones,
      };
    });

    addLog(`🔨 Salvaged ${result.itemName} for ${result.spiritStones} spirit stones!`, "success");
    addToast(`🔨 Salvaged! +${result.spiritStones} spirit stones`, 'success', 3000);

    // Close modal after a short delay
    setTimeout(() => {
      setSalvageModalOpen(false);
      setSelectedGearForSalvage(null);
    }, 1500);
  };

  const equipSkill = (skillId: string, slotIndex: number) => {
      if (slotIndex < 0 || slotIndex > 3) return;
      setPlayer(p => {
          const newSkills = [...p.skills];
          // If skill is already in another slot, swap it
          const existingIndex = newSkills.indexOf(skillId);
          if (existingIndex !== -1 && existingIndex !== slotIndex) {
              newSkills[existingIndex] = newSkills[slotIndex];
          }
          newSkills[slotIndex] = skillId;
          return { ...p, skills: newSkills };
      });
  };

  const movePlayer = (dir) => {
    const dMap = { n: {x:0, y:1}, s: {x:0, y:-1}, e: {x:1, y:0}, w: {x:-1, y:0} };
    const delta = dMap[dir] || dMap[dir.charAt(0)];
    if (!delta) return;
    const nextX = coords.x + delta.x;
    const nextY = coords.y + delta.y;
    const targetKey = `${nextX},${nextY}`;
    
    if (worldMap[targetKey]) {
        setCoords({x: nextX, y: nextY});
        addLog(`Travelled to ${worldMap[targetKey].name}.`, "system");
        setPlayer(prev => {
            // Update explore quest objectives
            onZoneEntered(targetKey, prev.questLog, allQuests);
            if (!prev.visited.includes(targetKey)) {
              const newVisited = [...prev.visited, targetKey];
              
              // Check for exploration titles
              const currentTitleState = prev.titleState || createDefaultTitleState();
              const playerStatsForTitles: PlayerStats = {
                level: prev.level,
                totalKills: prev.totalKills || 0,
                bossKills: prev.bossKills || 0,
                zonesVisited: newVisited.length,
                totalCrafts: prev.totalCrafts || 0,
                itemsCollected: prev.itemsCollected || 0,
                totalSpiritStonesEarned: prev.totalSpiritStonesEarned || 0,
                deaths: prev.deaths || 0,
                immortalCrafts: prev.immortalCrafts || 0,
              };
              
              const newlyUnlockedTitles = getNewlyUnlockedTitles(playerStatsForTitles, currentTitleState.unlockedTitles);
              let newTitleState = currentTitleState;
              
              if (newlyUnlockedTitles.length > 0) {
                newlyUnlockedTitles.forEach(title => {
                  addToast(`🏆 Title Unlocked: ${title.name}!`, 'success', 5000);
                });
                
                newTitleState = {
                  ...currentTitleState,
                  unlockedTitles: [
                    ...currentTitleState.unlockedTitles,
                    ...newlyUnlockedTitles.map(t => ({ titleId: t.id, unlockedAt: Date.now() }))
                  ],
                };
              }
              
              return { ...prev, visited: newVisited, titleState: newTitleState };
            }
            return prev;
        });
        const target = worldMap[targetKey];
        if (target.tier > 1 && Math.random() < 0.15) setTimeout(startCombat, 600);
    } else addLog("Blocked path.", "warning");
  };

  const travelFast = (targetX, targetY) => {
      const key = `${targetX},${targetY}`;
      const loc = worldMap[key];
      if (!player.visited.includes(key)) { addLog("Unknown location.", "warning"); return; }
      if (loc && loc.tier >= 3) { addLog("Too dangerous to fly.", "danger"); return; }
      if (loc) {
          setCoords({ x: targetX, y: targetY });
          setMapOpen(false);
          addLog(`Fast travelled to ${loc.name}.`, "system");
          // Update explore quest objectives
          setPlayer(prev => {
              onZoneEntered(key, prev.questLog, allQuests);
              return prev;
          });
      }
  };

  const allocateStat = (statId) => {
    if (player.ap > 0) setPlayer(prev => ({ ...prev, ap: prev.ap - 1, stats: { ...prev.stats, [statId]: prev.stats[statId] + 1 } }));
  };

  const openResetConfirm = () => {
    const statsAllocated = (player.stats.str - player.baseStats.str) + (player.stats.dex - player.baseStats.dex) + (player.stats.con - player.baseStats.con) + (player.stats.spi - player.baseStats.spi) + (player.stats.wil - player.baseStats.wil);
    const cost = calculateResetCost(player.level, statsAllocated);
    const hasEnough = player.level <= 9 || player.spiritStones >= cost;
    setResetConfirmModal({ open: true, cost: cost, statsAllocated: statsAllocated, hasEnough: hasEnough });
  };

  const confirmReset = () => {
    const statsAllocated = (player.stats.str - player.baseStats.str) + (player.stats.dex - player.baseStats.dex) + (player.stats.con - player.baseStats.con) + (player.stats.spi - player.baseStats.spi) + (player.stats.wil - player.baseStats.wil);
    const cost = calculateResetCost(player.level, statsAllocated);
    if (cost > 0 && player.spiritStones < cost) {
      addLog(`Reset costs ${cost} Spirit Stones. You only have ${player.spiritStones}.`, "danger");
      setResetConfirmModal({ open: false, cost: 0, statsAllocated: 0 });
      return;
    }
    const totalAPAvailable = calculateTotalAP(player.level);
    setPlayer((prev) => {
      const newState = { ...prev, ap: totalAPAvailable, stats: { ...prev.baseStats } };
      if (cost > 0) { newState.spiritStones = prev.spiritStones - cost; }
      return newState;
    });
    const message = cost > 0 ? `Stats reset! Cost: ${cost} Spirit Stones.` : "Stats reset for free!";
    addLog(message, "success");
    setResetConfirmModal({ open: false, cost: 0, statsAllocated: 0 });
  };

  const cancelReset = () => {
    setResetConfirmModal({ open: false, cost: 0, statsAllocated: 0 });
  };

  const useConsumable = (itemName) => {
    // Find the item first
    const invIndex = player.inventory.findIndex(i => i.name === itemName);
    if (invIndex === -1) { 
      addToast("Item not found in inventory!", "danger", 2000); 
      return;
    }
    
    const item = player.inventory[invIndex];
    if (!item || (item.count || 0) <= 0) { 
      addToast("No more of that item!", "danger", 2000); 
      return;
    }
    
    // Determine restoration amounts
    let hpRestore = 0, qiRestore = 0, logMsg = "";
    
    if (itemName === "HP Restoring Pill" || itemName.toLowerCase().includes('hp pill')) {
      hpRestore = 50;
      logMsg = `💊 Used HP Pill! +${hpRestore} HP`;
    } else if (itemName === "QI Restoring Pill" || itemName.toLowerCase().includes('qi pill')) {
      qiRestore = 30;
      logMsg = "💊 Used QI Pill! +30 QI";
    } else {
      addToast("Unknown consumable!", "danger", 2000);
      return;
    }
    
    // Update inventory - reduce count
    setPlayer(p => {
      const newInv = [...p.inventory];
      const idx = newInv.findIndex(i => i.name === itemName);
      if (idx === -1) return p;
      
      newInv[idx] = { ...newInv[idx], count: (newInv[idx].count || 1) - 1 };
      if (newInv[idx].count <= 0) {
        newInv.splice(idx, 1);
      }
      
      // Calculate new HP/QI
      const newHp = Math.min(p.hp + hpRestore, p.maxHp);
      const newQi = Math.min(p.qi + qiRestore, p.maxQi);
      
      return { 
        ...p, 
        inventory: newInv,
        hp: newHp,
        qi: newQi
      };
    });
    
    // Show toast notification
    addToast(logMsg, "success", 2000);
    addLog(logMsg, "success");
    
    // Trigger quest objective for using consumable
    triggerSpecialAction('use_consumable');
    
    // If in combat, also update combat state
    if (combat && combat.active) {
      addCombatLog(logMsg, "success");
      setCombat(prev => prev ? ({
        ...prev,
        playerHp: Math.min(prev.playerHp + hpRestore, prev.maxPlayerHp),
        playerQi: Math.min(prev.playerQi + qiRestore, prev.maxPlayerQi)
      }) : prev);
    }
  };

  // Quick-use consumables helpers
  const getConsumableCount = (itemName: string) => {
    const item = player.inventory.find(i => i.name === itemName);
    return item?.count || 0;
  };

  const hpPillCount = getConsumableCount("HP Restoring Pill");
  const qiPillCount = getConsumableCount("QI Restoring Pill");

  const handleCommand = (e) => {
    if (e.key !== 'Enter') return;
    const cmd = inputValue.trim().toLowerCase();
    setInputValue("");
    if (!cmd) return;
    addLog(`> ${cmd}`, "cmd");
    const parts = cmd.split(" ");
    if (['n', 's', 'e', 'w'].includes(parts[0])) { movePlayer(parts[0]); return; }
    
    if (parts[0] === 'meditate') {
        if (combat && combat.active) { addLog("Cannot meditate during combat!", "danger"); return; }
        if (player.isMeditating) { addLog("Already meditating!", "warning"); return; }
        
        setPlayer(p => ({ ...p, isMeditating: true }));
        addLog("You begin to meditate...", "system");
        
        const meditationInterval = setInterval(() => {
          setPlayer(p => {
            if (!p.isMeditating) {
              clearInterval(meditationInterval);
              return p;
            }
            const loc = getCurrentLocation();
            const multipliers = [1.0, 1.2, 1.5, 2.0, 3.5, 5.0];
            const multiplier = multipliers[loc.quality] || 1.0;
            const hpGain = Math.ceil(p.maxHp * 0.05 * multiplier);
            const qiGain = Math.ceil(p.maxQi * 0.08 * multiplier);
            
            const newHp = Math.min(p.hp + hpGain, p.maxHp);
            const newQi = Math.min(p.qi + qiGain, p.maxQi);
            
            if (newHp === p.maxHp && newQi === p.maxQi) {
              addLog("Meditation complete. Fully recovered.", "success");
              return { ...p, isMeditating: false, hp: newHp, qi: newQi };
            }
            
            return { ...p, hp: newHp, qi: newQi };
          });
        }, 1000);
        
        return;
    } else if (parts[0] === 'stop') {
        if (player.isMeditating) {
          setPlayer(p => ({ ...p, isMeditating: false }));
          addLog("Meditation stopped.", "system");
        }
        return;
    } else if (parts[0] === 'use' && parts[1]) {
        const itemName = parts.slice(1).join(" ");
        useConsumable(itemName);
        return;
    } else addLog("Unknown command.", "normal");
  };

  // MiniMap component (inline - simple, no external dependencies needed)

  const MiniMap = () => {
    const grid = [];
    for (let y = coords.y + 1; y >= coords.y - 1; y--) {
        for (let x = coords.x - 1; x <= coords.x + 1; x++) {
            const key = `${x},${y}`;
            const loc = worldMap[key];
            const isPlayer = x === coords.x && y === coords.y;
            grid.push(<div key={key} className={`w-6 h-6 flex items-center justify-center border border-white/5 rounded-sm ${isPlayer ? 'bg-amber-500/20 border-amber-500' : 'bg-black/40'}`}>{loc && <div className={`w-2 h-2 rounded-full ${loc.tier===1?'bg-emerald-500':loc.tier===2?'bg-amber-500':'bg-red-600'} ${isPlayer?'animate-pulse':''}`}></div>}</div>);
        }
    }
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="grid grid-cols-3 gap-0.5 bg-black/80 p-1 rounded border border-white/10 cursor-pointer hover:border-amber-500" onClick={() => setMapOpen(true)}>{grid}</div>
        <div className="text-[10px] text-amber-500/70 font-mono tracking-wider">
          [{coords.x}, {coords.y}]
        </div>
      </div>
    );
  };

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="h-screen bg-[#050608] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 mb-4">
            凌云道
          </div>
          <p className="text-amber-500/60 text-xs tracking-widest mb-6">LÍNGYÚN DÀO</p>
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <RefreshCw size={16} className="animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage onSuccess={() => {}} />;
  }

  // Show loading while player data loads
  if (playerDataLoading || gameState === 'loading') {
    return (
      <div className="h-screen bg-[#050608] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 mb-4">
            凌云道
          </div>
          <p className="text-amber-500/60 text-xs tracking-widest mb-6">LÍNGYÚN DÀO</p>
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <RefreshCw size={16} className="animate-spin" />
            <span>Loading player data...</span>
          </div>
        </div>
      </div>
    );
  }

  // === GAME STATE MACHINE RENDER ===
  
  // Character Selection Screen
  if (gameState === 'character-select') {
    return (
      <CharacterSelectionScreen
        onSelectCharacter={handleSelectCharacter}
        onCreateNew={handleCreateNewCharacter}
        characterSlots={characterSlots || []}
        onSaveSlots={saveCharacterSlots}
      />
    );
  }

  // Character Creation Screen
  if (gameState === 'character-creation') {
    return (
      <CharacterCreation 
        onComplete={handleCharacterCreation} 
        onBack={characterSlots && characterSlots.length > 0 ? () => setGameState('character-select') : undefined}
      />
    );
  }

  // Tutorial Screen
  if (gameState === 'tutorial') {
    return (
      <Tutorial 
        onComplete={handleTutorialComplete} 
        onSkip={handleTutorialSkip}
        playerName={player.name}
      />
    );
  }

  // === MAIN GAME VIEW ===
  return (
    <div className="h-screen bg-[#050608] text-gray-200 font-sans select-none overflow-hidden flex flex-col cursor-default">
        {/* TOAST NOTIFICATIONS */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        
        {/* REWARD CLAIM ANIMATION */}
        {RewardAnimationComponent}

        {/* LOOT PICKUP MODAL */}
        <LootPickupModal
          isOpen={lootModal.isOpen}
          loot={lootModal.loot}
          spiritStones={lootModal.spiritStones}
          mobName={lootModal.mobName}
          onClose={() => setLootModal({ isOpen: false, loot: [], spiritStones: 0, mobName: '' })}
          onLootSelected={handleLootSelected}
        />
        
        {/* DEATH PENALTY MODAL */}
        <DeathModal
          isOpen={deathModal.isOpen}
          penalty={deathModal.penalty}
          onClose={() => setDeathModal({ isOpen: false, penalty: null })}
        />
        
        {/* FLEE CONFIRMATION MODAL */}
        <FleeConfirmModal
          isOpen={fleeModalOpen}
          mobName={combat?.mobName || 'the enemy'}
          onConfirm={executeFleeAttempt}
          onCancel={() => setFleeModalOpen(false)}
        />
        
        {/* REPAIR MODAL */}
        <RepairModal
          isOpen={isRepairModalOpen}
          equippedGear={player.equipment || {}}
          playerSpiritStones={player.spiritStones}
          onClose={() => setRepairModalOpen(false)}
          onRepair={handleRepairGear}
          onRepairAll={handleRepairAllGear}
        />
        
        {/* AUTO-COMBAT SETTINGS MODAL */}
        <AutoCombatSettingsModal
          isOpen={isAutoCombatSettingsOpen}
          settings={autoCombatSettings}
          onClose={() => setAutoCombatSettingsOpen(false)}
          onSave={setAutoCombatSettings}
          onStart={startAutoCombatSession}
          timeRemaining={autoCombatTimeRemaining}
        />
        
        {/* AUTO-COMBAT SUMMARY MODAL */}
        <AutoCombatSummaryModal
          isOpen={isAutoCombatSummaryOpen}
          stats={autoCombatSessionStats}
          onClose={() => setAutoCombatSummaryOpen(false)}
        />
        
        {/* ACHIEVEMENTS PANEL */}
        {isAchievementsOpen && (
          <AchievementsPanel
            playerAchievements={player.achievements || createInitialAchievements()}
            onClose={() => setAchievementsOpen(false)}
          />
        )}
        
        {/* LEADERBOARD PANEL */}
        {isLeaderboardOpen && (
          <LeaderboardPanel
            currentPlayerId={user?.id}
            currentPlayerName={player.name}
            currentPlayerLevel={player.level}
            onClose={() => setLeaderboardOpen(false)}
          />
        )}
        
        {/* CHAT PANEL */}
        {isChatOpen && !isChatMinimized && (
          <ChatPanel
            playerName={player.name}
            playerLevel={player.level}
            playerTitle={player.title}
            currentZone={getCurrentLocation().name}
            isMinimized={isChatMinimized}
            onToggleMinimize={() => setChatMinimized(true)}
          />
        )}
        
        {/* CHAT BUTTON (when minimized or closed) */}
        {(isChatMinimized || !isChatOpen) && (
          <ChatButton 
            onClick={() => {
              setChatOpen(true);
              setChatMinimized(false);
            }}
          />
        )}
        
        {/* BREAKTHROUGH MODAL - Interactive Tribulation Experience */}
        {isBreakthroughModalOpen && (
          <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[200]">
            <div className={`
              bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 
              border-2 rounded-xl p-8 max-w-lg w-full mx-4 text-center relative overflow-hidden
              transition-all duration-1000
              ${breakthroughPhase === 'idle' ? 'border-amber-500/50' : ''}
              ${breakthroughPhase === 'preparing' ? 'border-cyan-500/70 shadow-[0_0_60px_rgba(6,182,212,0.4)]' : ''}
              ${breakthroughPhase === 'tribulation' ? 'border-purple-500/80 shadow-[0_0_80px_rgba(168,85,247,0.5)] animate-pulse' : ''}
              ${breakthroughPhase === 'absorbing' ? 'border-emerald-500/80 shadow-[0_0_100px_rgba(16,185,129,0.6)]' : ''}
              ${breakthroughPhase === 'success' ? 'border-amber-400 shadow-[0_0_120px_rgba(251,191,36,0.7)]' : ''}
            `} onClick={e => e.stopPropagation()}>
              
              {/* Dynamic lightning effects based on phase */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {(breakthroughPhase === 'tribulation' || breakthroughPhase === 'absorbing') && (
                  <>
                    <div className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-purple-500 via-transparent to-purple-500 animate-pulse opacity-80" />
                    <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gradient-to-b from-cyan-400 via-transparent to-cyan-400 animate-pulse opacity-60" style={{ animationDelay: '0.2s' }} />
                    <div className="absolute top-0 right-1/4 w-1 h-full bg-gradient-to-b from-purple-500 via-transparent to-purple-500 animate-pulse opacity-80" style={{ animationDelay: '0.4s' }} />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_40%,rgba(168,85,247,0.1)_100%)]" />
                  </>
                )}
                {breakthroughPhase === 'success' && (
                  <>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.3)_0%,transparent_70%)]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-amber-500/20 animate-ping" />
                  </>
                )}
              </div>
              
              <div className="relative z-10">
                {/* Phase: IDLE - Show preparation screen */}
                {breakthroughPhase === 'idle' && (() => {
                  const currentLevelInfo = getLevelInfo(player.level);
                  const nextRealm = player.level === 9 ? 'Foundation Establishment' : 
                                   player.level === 19 ? 'Golden Core' : 'Next Realm';
                  const requiredPill = currentLevelInfo.breakthrough;
                  const hasPill = player.inventory.some((item: any) => 
                    item.name === requiredPill || 
                    item.itemId === requiredPill?.toLowerCase().replace(' ', '_')
                  );
                  
                  return (
                    <>
                      <div className="text-6xl mb-4 animate-bounce">⚡</div>
                      <h2 className="text-2xl font-bold text-amber-400 mb-2">Realm Breakthrough</h2>
                      <p className="text-gray-300 mb-6">
                        You stand at the threshold of transcendence. The heavens await your challenge.
                      </p>
                      
                      <div className="bg-black/40 rounded-lg p-4 mb-4 border border-slate-700">
                        <div className="flex justify-between items-center">
                          <div className="text-left">
                            <div className="text-xs text-gray-500 uppercase tracking-wide">Current</div>
                            <div className="text-lg text-cyan-400 font-semibold">{currentLevelInfo.realm}</div>
                            <div className="text-sm text-cyan-300/70">{currentLevelInfo.layer}</div>
                          </div>
                          <div className="text-4xl text-amber-500 animate-pulse">→</div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500 uppercase tracking-wide">Ascending To</div>
                            <div className="text-lg text-emerald-400 font-semibold">{nextRealm}</div>
                            <div className="text-sm text-emerald-300/70">Stage 1</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`bg-black/40 rounded-lg p-4 mb-6 border ${hasPill ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Tribulation Catalyst</div>
                        <div className={`text-xl flex items-center justify-center gap-2 ${hasPill ? 'text-emerald-400' : 'text-red-400'}`}>
                          {hasPill ? '✓' : '✗'} {requiredPill}
                        </div>
                        {!hasPill && (
                          <p className="text-sm text-red-400/70 mt-2">
                            Complete the Trial Quest from Elder Xuanming to obtain this sacred pill.
                          </p>
                        )}
                        {hasPill && (
                          <p className="text-sm text-emerald-400/70 mt-2">
                            The pill resonates with your cultivation. You are ready.
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={() => { setBreakthroughModalOpen(false); setBreakthroughPhase('idle'); setBreakthroughProgress(0); }}
                          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          Not Yet
                        </button>
                        <button
                          onClick={() => {
                            if (!hasPill) return;
                            setBreakthroughPhase('preparing');
                            setBreakthroughProgress(0);
                          }}
                          disabled={!hasPill}
                          className={`px-8 py-3 rounded-lg font-bold transition-all ${
                            hasPill 
                              ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black shadow-lg shadow-amber-500/30 hover:scale-105' 
                              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {hasPill ? '⚡ Begin Tribulation' : 'Obtain Pill First'}
                        </button>
                      </div>
                    </>
                  );
                })()}
                
                {/* Phase: PREPARING - Countdown animation */}
                {breakthroughPhase === 'preparing' && (() => {
                  // Auto-advance to tribulation phase after 3 seconds
                  setTimeout(() => {
                    if (breakthroughPhase === 'preparing') {
                      setBreakthroughPhase('tribulation');
                      setBreakthroughProgress(0);
                    }
                  }, 3000);
                  
                  return (
                    <>
                      <div className="text-8xl mb-6 animate-pulse">🔮</div>
                      <h2 className="text-2xl font-bold text-cyan-400 mb-4">Condensing Pill Energy...</h2>
                      <p className="text-gray-300 mb-6">
                        The sacred pill dissolves into pure essence, merging with your cultivation base.
                      </p>
                      <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden mb-4">
                        <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 animate-[preparePulse_3s_ease-in-out_forwards] rounded-full" 
                             style={{ animation: 'preparePulse 3s ease-in-out forwards' }} />
                      </div>
                      <style>{`
                        @keyframes preparePulse {
                          0% { width: 0%; }
                          100% { width: 100%; }
                        }
                      `}</style>
                      <p className="text-cyan-300/70 text-sm animate-pulse">Prepare yourself for the Heavenly Tribulation...</p>
                    </>
                  );
                })()}
                
                {/* Phase: TRIBULATION - Click/tap challenge */}
                {breakthroughPhase === 'tribulation' && (() => {
                  const targetProgress = player.level === 9 ? 10 : 15; // More clicks for higher breakthrough
                  
                  if (breakthroughProgress >= targetProgress) {
                    // Advance to absorbing phase
                    setTimeout(() => {
                      if (breakthroughPhase === 'tribulation') {
                        setBreakthroughPhase('absorbing');
                        setBreakthroughProgress(0);
                      }
                    }, 500);
                  }
                  
                  return (
                    <>
                      <div className="text-6xl mb-4">⚡</div>
                      <h2 className="text-2xl font-bold text-purple-400 mb-2">HEAVENLY TRIBULATION</h2>
                      <p className="text-gray-300 mb-4">
                        Lightning descends from the heavens! Channel the tribulation energy!
                      </p>
                      
                      {/* Progress bar */}
                      <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden mb-4 border border-purple-500/30">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-600 via-purple-400 to-cyan-400 transition-all duration-200"
                          style={{ width: `${(breakthroughProgress / targetProgress) * 100}%` }}
                        />
                      </div>
                      <p className="text-purple-300 mb-4 text-sm">{breakthroughProgress} / {targetProgress} Lightning Strikes Absorbed</p>
                      
                      {/* Tribulation button */}
                      <button
                        onClick={() => setBreakthroughProgress(p => Math.min(p + 1, targetProgress))}
                        className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 via-purple-500 to-cyan-500 
                                   hover:from-purple-500 hover:via-purple-400 hover:to-cyan-400
                                   shadow-[0_0_40px_rgba(168,85,247,0.6)] hover:shadow-[0_0_60px_rgba(168,85,247,0.8)]
                                   transition-all duration-150 active:scale-90 active:shadow-[0_0_80px_rgba(168,85,247,1)]
                                   flex items-center justify-center text-5xl animate-pulse"
                      >
                        ⚡
                      </button>
                      <p className="text-purple-300/70 text-xs mt-4">TAP RAPIDLY to absorb the tribulation lightning!</p>
                    </>
                  );
                })()}
                
                {/* Phase: ABSORBING - Final transformation */}
                {breakthroughPhase === 'absorbing' && (() => {
                  // Auto-advance to success after 4 seconds and perform the actual breakthrough
                  setTimeout(() => {
                    if (breakthroughPhase === 'absorbing') {
                      attemptBreakthrough();
                      setBreakthroughPhase('success');
                    }
                  }, 4000);
                  
                  return (
                    <>
                      <div className="text-8xl mb-6 animate-spin" style={{ animationDuration: '2s' }}>🌟</div>
                      <h2 className="text-2xl font-bold text-emerald-400 mb-4">CORE FORMING...</h2>
                      <p className="text-gray-300 mb-6">
                        The tribulation energy condenses within your dantian, forging a new foundation of power!
                      </p>
                      <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden mb-4 border border-emerald-500/30">
                        <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full" 
                             style={{ animation: 'absorbPulse 4s ease-out forwards' }} />
                      </div>
                      <style>{`
                        @keyframes absorbPulse {
                          0% { width: 0%; }
                          100% { width: 100%; }
                        }
                      `}</style>
                      <p className="text-emerald-300/70 text-sm animate-pulse">Your cultivation is undergoing fundamental transformation...</p>
                    </>
                  );
                })()}
                
                {/* Phase: SUCCESS - Celebration */}
                {breakthroughPhase === 'success' && (() => {
                  const newRealm = player.realm;
                  
                  return (
                    <>
                      <div className="text-8xl mb-6">🎉</div>
                      <h2 className="text-3xl font-bold text-amber-400 mb-2 animate-pulse">BREAKTHROUGH SUCCESS!</h2>
                      <div className="text-5xl text-emerald-400 font-bold my-4">{newRealm}</div>
                      <p className="text-gray-300 mb-6">
                        You have transcended your former limits! A new chapter of your cultivation journey begins!
                      </p>
                      
                      <div className="bg-black/40 rounded-lg p-4 mb-6 border border-amber-500/30">
                        <div className="text-sm text-amber-300 mb-2">🏆 Achievements Unlocked:</div>
                        <div className="text-emerald-400">• New realm powers available</div>
                        <div className="text-emerald-400">• Attribute points gained</div>
                        <div className="text-emerald-400">• HP & QI fully restored</div>
                      </div>
                      
                      <button
                        onClick={() => { 
                          setBreakthroughModalOpen(false); 
                          setBreakthroughPhase('idle'); 
                          setBreakthroughProgress(0); 
                        }}
                        className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 
                                   text-black rounded-lg font-bold shadow-lg shadow-amber-500/30 hover:scale-105 transition-all"
                      >
                        Continue Journey ✨
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
        
        {/* GLOBAL SETTINGS MENU */}
        <SettingsMenu
          isOpen={showSettingsMenu}
          onClose={() => setShowSettingsMenu(false)}
          onSwitchCharacter={handleReturnToCharacterSelect}
          onLogout={async () => {
            await signOut();
            setGameStateInitialized(false);
            setGameState('loading');
          }}
          onResetGame={hardReset}
          playerName={player.name}
          isAdmin={isUserAdmin}
          onOpenAdminPanel={() => {
            setShowSettingsMenu(false);
            setShowAdminPanel(true);
          }}
        />
        
        {/* ADMIN PANEL */}
        {showAdminPanel && (
          <AdminPanel onClose={() => setShowAdminPanel(false)} />
        )}
        
        {/* EVENT BANNER - Shows active events */}
        <EventBanner />
        
        {/* TAB NAVIGATION */}
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} player={player} onOpenSettings={() => setShowSettingsMenu(true)} />

        {/* TAB CONTENT */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {activeTab === 'world' && (
            <WorldPage>
              {/* QUICK STATUS BAR */}
              <div className="bg-[#0a0c10] border-b border-[#2a2f3a] px-4 py-2 flex items-center justify-between">
                {/* LEFT: Avatar & Identity */}
                <div className="flex items-center gap-3">
                  <div 
                    onClick={() => setAvatarModalOpen(true)}
                    className="w-10 h-10 rounded-full border-2 border-amber-500/50 overflow-hidden cursor-pointer hover:border-amber-400 transition-all group"
                  >
                    <img src={player.avatar} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-serif font-bold text-amber-400">{player.name}</span>
                      {player.titleState?.activeTitle ? (() => {
                        const activeTitle = getTitleById(player.titleState.activeTitle);
                        if (!activeTitle) return <span className="text-[9px] px-1.5 py-0.5 bg-purple-900/50 border border-purple-500/30 rounded text-purple-300">{player.title}</span>;
                        const titleClass = `title-${activeTitle.rarity === 'gray' ? 'mortal' : 
                                                     activeTitle.rarity === 'green' ? 'earth' : 
                                                     activeTitle.rarity === 'blue' ? 'heaven' : 
                                                     activeTitle.rarity === 'purple' ? 'spirit' : 'immortal'}`;
                        return (
                          <span 
                            className={`title-badge ${titleClass}`}
                            title={activeTitle.description}
                          >
                            {activeTitle.name}
                          </span>
                        );
                      })() : (
                        <span className="text-[9px] px-1.5 py-0.5 bg-purple-900/50 border border-purple-500/30 rounded text-purple-300">{player.title}</span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      <span className="text-cyan-400">{player.realm}</span> • <span className="text-amber-300">{getLevelInfo(player.level)?.layer || 'Stage 1'}</span>
                    </div>
                  </div>
                </div>

                {/* CENTER: Vital Bars */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <ResourceIcon type="hp" size={12} />
                    <div className="w-24 h-2 bg-[#1a1d24] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-red-600 to-red-400" style={{width: `${(player.hp / player.maxHp) * 100}%`}}></div>
                    </div>
                    <span className="text-[9px] text-red-400 font-mono w-14">{player.hp}/{player.maxHp}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ResourceIcon type="qi" size={12} />
                    <div className="w-24 h-2 bg-[#1a1d24] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400" style={{width: `${(player.qi / player.maxQi) * 100}%`}}></div>
                    </div>
                    <span className="text-[9px] text-cyan-400 font-mono w-14">{player.qi}/{player.maxQi}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ResourceIcon type="exp" size={12} />
                    <div className="w-24 h-2 bg-[#1a1d24] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400" style={{width: `${Math.min(100, (player.exp / (getLevelInfo(player.level)?.req || 2200)) * 100)}%`}}></div>
                    </div>
                    {getLevelInfo(player.level)?.breakthrough && player.exp >= (getLevelInfo(player.level)?.req || 0) ? (
                      <button 
                        onClick={() => setBreakthroughModalOpen(true)}
                        className="text-[9px] px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded animate-pulse"
                      >
                        ⚡ BREAKTHROUGH
                      </button>
                    ) : (
                      <span className="text-[9px] text-amber-400 font-mono w-16">{player.exp}/{getLevelInfo(player.level)?.req || 2200}</span>
                    )}
                  </div>
                </div>

                {/* RIGHT: Resources & Quick Actions */}
                <div className="flex items-center gap-3">
                  {/* Quick-Use Pills Panel */}
                  <div className="flex items-center gap-1 bg-[#12151c] rounded-xl px-2 py-1.5 border border-white/10 relative">
                    <span className="text-[9px] text-gray-500 uppercase tracking-wide mr-1">Pills</span>
                    <button
                      onClick={() => useConsumable("HP Restoring Pill")}
                      onMouseEnter={(e) => setPillTooltip({ type: 'hp', x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setPillTooltip({ type: null, x: 0, y: 0 })}
                      onMouseMove={(e) => pillTooltip.type === 'hp' && setPillTooltip(p => ({ ...p, x: e.clientX, y: e.clientY }))}
                      disabled={hpPillCount === 0 || player.hp >= player.maxHp}
                      className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 transition-all ${
                        hpPillCount > 0 && player.hp < player.maxHp
                          ? 'bg-gradient-to-b from-red-900/50 to-red-950/50 border-red-500/60 hover:border-red-400 hover:shadow-lg hover:shadow-red-500/20 cursor-pointer'
                          : 'bg-gray-900/30 border-gray-700/30 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-inner">
                        <ResourceIcon type="hp" size={11} />
                      </div>
                      <span className="text-red-200 font-bold text-sm">{hpPillCount}</span>
                      {hpPillCount > 0 && player.hp < player.maxHp && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                      )}
                    </button>
                    <button
                      onClick={() => useConsumable("QI Restoring Pill")}
                      onMouseEnter={(e) => setPillTooltip({ type: 'qi', x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setPillTooltip({ type: null, x: 0, y: 0 })}
                      onMouseMove={(e) => pillTooltip.type === 'qi' && setPillTooltip(p => ({ ...p, x: e.clientX, y: e.clientY }))}
                      disabled={qiPillCount === 0 || player.qi >= player.maxQi}
                      className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 transition-all ${
                        qiPillCount > 0 && player.qi < player.maxQi
                          ? 'bg-gradient-to-b from-blue-900/50 to-blue-950/50 border-blue-500/60 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20 cursor-pointer'
                          : 'bg-gray-900/30 border-gray-700/30 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-inner">
                        <ResourceIcon type="qi" size={11} />
                      </div>
                      <span className="text-blue-200 font-bold text-sm">{qiPillCount}</span>
                      {qiPillCount > 0 && player.qi < player.maxQi && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      )}
                    </button>
                    
                    {/* Pill Tooltip */}
                    {pillTooltip.type && (
                      <div 
                        className="fixed z-[9999] bg-[#0a0c10] border border-amber-500/50 p-3 rounded shadow-xl w-52 pointer-events-none backdrop-blur-md"
                        style={{ 
                          top: Math.min(window.innerHeight - 150, pillTooltip.y + 15), 
                          left: Math.min(window.innerWidth - 220, pillTooltip.x + 15)
                        }}
                      >
                        <div className={`text-sm font-serif font-bold ${pillTooltip.type === 'hp' ? 'text-red-400' : 'text-blue-400'}`}>
                          {pillTooltip.type === 'hp' ? 'HP Restoring Pill' : 'QI Restoring Pill'}
                        </div>
                        <div className="text-[10px] text-gray-400 italic">🧪 Consumable • Tier 1</div>
                        <div className="text-[10px] text-gray-300 my-1 italic">
                          {pillTooltip.type === 'hp' 
                            ? 'A medicinal pill that restores vitality.' 
                            : 'A pill infused with spiritual energy.'}
                        </div>
                        <div className="mt-1 pt-2 border-t border-green-500/30 bg-green-900/20 rounded p-2">
                          <div className="text-[9px] text-green-400 uppercase font-bold mb-1">💊 Use Effect</div>
                          <div className="flex items-center gap-2">
                            {pillTooltip.type === 'hp' 
                              ? <ResourceIcon type="hp" size={12} />
                              : <ResourceIcon type="qi" size={12} />
                            }
                            <span className={`text-[11px] font-bold ${pillTooltip.type === 'hp' ? 'text-red-300' : 'text-blue-300'}`}>
                              Restores {pillTooltip.type === 'hp' ? '50 HP' : '30 QI'}
                            </span>
                          </div>
                          <div className="text-[9px] text-green-300 mt-2 bg-green-800/30 px-2 py-1 rounded border border-green-500/20">
                            💡 Click to use instantly
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Skill Hotbar Tooltip */}
                    {skillTooltip.skill && (
                      <div 
                        className="fixed z-[9999] bg-[#0a0c10] border border-amber-500/50 p-3 rounded shadow-xl w-56 pointer-events-none backdrop-blur-md"
                        style={{ 
                          top: Math.min(window.innerHeight - 200, skillTooltip.y - 170), 
                          left: Math.min(window.innerWidth - 240, skillTooltip.x - 110)
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <img 
                            src={getSkillIconPath(skillTooltip.skill)} 
                            alt={skillTooltip.skill.name} 
                            className="w-8 h-8 object-contain rounded"
                          />
                          <div>
                            <div className={`text-sm font-serif font-bold ${
                              skillTooltip.skill.element === 'Fire' ? 'text-orange-400' :
                              skillTooltip.skill.element === 'Ice' ? 'text-cyan-400' :
                              skillTooltip.skill.element === 'Wood' ? 'text-green-400' :
                              skillTooltip.skill.element === 'Lightning' ? 'text-yellow-400' :
                              skillTooltip.skill.element === 'Void' ? 'text-purple-400' :
                              'text-gray-300'
                            }`}>
                              {skillTooltip.skill.name}
                            </div>
                            <div className="text-[10px] text-gray-400 italic flex items-center gap-2">
                              <span className="flex items-center gap-1">
                                {skillTooltip.skill.element !== 'None' && (
                                  <img src={ELEMENT_ICON_PATHS[skillTooltip.skill.element]} alt={skillTooltip.skill.element} className="w-3 h-3" />
                                )}
                                {skillTooltip.skill.element}
                              </span>
                              <span>•</span>
                              <span className={`font-bold ${
                                skillTooltip.skill.tier === 4 ? 'text-purple-400' :
                                skillTooltip.skill.tier === 3 ? 'text-amber-400' :
                                skillTooltip.skill.tier === 2 ? 'text-blue-400' :
                                'text-gray-400'
                              }`}>Tier {skillTooltip.skill.tier}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-[10px] text-gray-300 my-2 italic border-t border-white/10 pt-2">
                          {getSkillDamageDescription(skillTooltip.skill, combatStats.pAtk, combatStats.mAtk, combatStats.primaryStat, combatStats.primaryBonus)}
                        </div>
                        
                        <div className="flex items-center justify-between gap-2 text-[10px] bg-black/30 rounded p-1.5 border border-white/5">
                          <div className="flex items-center gap-1">
                            <ResourceIcon type="qi" size={10} />
                            <span className="text-cyan-300 font-bold">{skillTooltip.skill.qiCost} QI</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <RefreshCw size={10} className="text-amber-400" />
                            <span className="text-amber-300 font-bold">{skillTooltip.skill.cooldown} Turn CD</span>
                          </div>
                        </div>
                        
                        <div className="text-[9px] text-gray-500 mt-2 text-center">
                          Press <span className="text-amber-400 font-bold">[1-4]</span> or click to use
                        </div>
                      </div>
                    )}
                    
                    {/* Defense/Action Tooltip */}
                    {actionTooltip.action && (
                      <div 
                        className="fixed z-[9999] bg-[#0a0c10] border border-amber-500/50 p-3 rounded shadow-xl w-52 pointer-events-none backdrop-blur-md"
                        style={{ 
                          top: Math.min(window.innerHeight - 140, actionTooltip.y - 130), 
                          left: Math.min(window.innerWidth - 220, actionTooltip.x - 100)
                        }}
                      >
                        {actionTooltip.action === 'block' && (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded bg-teal-900/50 border border-teal-500/50 flex items-center justify-center">
                                <Shield size={18} className="text-teal-400" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-teal-400">Block</div>
                                <div className="text-[10px] text-gray-500">Defensive Stance</div>
                              </div>
                            </div>
                            <p className="text-[10px] text-gray-300 mb-2">Reduce incoming damage by <span className="text-teal-400 font-bold">50%</span> this turn.</p>
                            <div className="text-[9px] text-gray-500 border-t border-white/10 pt-1.5">Press <span className="text-amber-400 font-bold">[Q]</span> • 3 turn cooldown</div>
                          </>
                        )}
                        {actionTooltip.action === 'dodge' && (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded bg-blue-900/50 border border-blue-500/50 flex items-center justify-center">
                                <Wind size={18} className="text-blue-400" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-blue-400">Dodge</div>
                                <div className="text-[10px] text-gray-500">Evasive Maneuver</div>
                              </div>
                            </div>
                            <p className="text-[10px] text-gray-300 mb-2">Attempt to <span className="text-blue-400 font-bold">evade</span> the next attack completely.</p>
                            <div className="text-[9px] text-gray-500 border-t border-white/10 pt-1.5">Press <span className="text-amber-400 font-bold">[W]</span> • 3 turn cooldown</div>
                          </>
                        )}
                        {actionTooltip.action === 'counter' && (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded bg-orange-900/50 border border-orange-500/50 flex items-center justify-center">
                                <Sword size={18} className="text-orange-400" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-orange-400">Counter</div>
                                <div className="text-[10px] text-gray-500">Riposte Strike</div>
                              </div>
                            </div>
                            <p className="text-[10px] text-gray-300 mb-2">Counter-attack for <span className="text-orange-400 font-bold">150% damage</span> if hit this turn.</p>
                            <div className="text-[9px] text-gray-500 border-t border-white/10 pt-1.5">Press <span className="text-amber-400 font-bold">[E]</span> • 4 turn cooldown</div>
                          </>
                        )}
                        {actionTooltip.action === 'flee' && (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded bg-red-900/50 border border-red-500/50 flex items-center justify-center">
                                <Footprints size={18} className="text-red-400" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-red-400">Flee</div>
                                <div className="text-[10px] text-gray-500">Escape Combat</div>
                              </div>
                            </div>
                            <p className="text-[10px] text-gray-300 mb-2">Attempt to <span className="text-red-400 font-bold">escape</span> from battle. Success chance based on speed.</p>
                            <div className="text-[9px] text-gray-500 border-t border-white/10 pt-1.5">Press <span className="text-amber-400 font-bold">[R]</span> to flee</div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Spirit Stones Display */}
                  <div className="flex items-center gap-2 bg-gradient-to-r from-cyan-950/50 to-blue-950/50 rounded-xl px-3 py-2 border border-cyan-600/40 shadow-lg shadow-cyan-500/10">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                      <SpiritStoneIcon size="sm" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] text-cyan-400/70 uppercase tracking-wider leading-none">Spirit Stones</span>
                      <span className="text-cyan-200 font-bold text-base leading-tight">{player.spiritStones.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {/* Repair Button - shows if any gear damaged */}
                  {(() => {
                    const hasDamagedGear = ['weapon', 'ring', 'necklace'].some(slot => {
                      const gear = player.equipment?.[slot];
                      return gear && (gear.durability ?? 100) < (gear.maxDurability ?? 100);
                    });
                    if (!hasDamagedGear) return null;
                    return (
                      <button
                        onClick={() => setRepairModalOpen(true)}
                        className="relative flex items-center gap-1.5 px-3 py-2 bg-gradient-to-b from-amber-900/50 to-orange-950/50 rounded-xl border-2 border-amber-500/60 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/20 transition-all"
                        title="Repair Equipment"
                      >
                        <Hammer size={16} className="text-amber-400" />
                        <span className="text-amber-200 text-xs font-bold">Repair</span>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse flex items-center justify-center">
                          <span className="text-[8px] text-black font-bold">!</span>
                        </div>
                      </button>
                    );
                  })()}
                </div>
              </div>

              {/* MAIN WORLD CONTENT */}
              <main className="flex-1 flex flex-col min-w-0 bg-black relative">
                <div className="flex-1 relative bg-[#151820] overflow-hidden group">
                    <div className="absolute inset-0 bg-cover bg-center transition-all duration-700 opacity-60" style={{backgroundImage: `url('${getCurrentLocation().img}')`}}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                    <div className="absolute top-4 left-4 z-10">
                        <div className="flex items-center gap-2 mb-1"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase flex items-center gap-1 ${getCurrentLocation().tier===1 ? 'bg-emerald-900/80 border-emerald-500/50 text-emerald-400' : getCurrentLocation().tier===2 ? 'bg-amber-900/80 border-amber-500/50 text-amber-400' : 'bg-red-900/80 border-red-500/50 text-red-400'}`}>{getCurrentLocation().tier === 1 ? <Shield size={8}/> : <Skull size={8}/>} Tier {getCurrentLocation().tier}</span><div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded border border-white/10"><span className="text-[9px] text-gray-400 font-bold uppercase mr-1">Quality</span><QualityStars quality={getCurrentLocation().quality} /></div></div>
                        <h2 className="text-3xl font-serif font-bold text-white drop-shadow-md">{getCurrentLocation().name}</h2>
                        <div className="text-sm text-gray-300 font-serif italic max-w-md drop-shadow-md mt-1">{getCurrentLocation().desc}</div>
                        
                        {/* ZONE INFO PANEL - Monster info for combat zones */}
                        {!getCurrentLocation().safeZone && bestiaryMap[`${coords.x},${coords.y}`] && (
                          <div className="mt-3">
                            <ZoneInfoPanel 
                              coords={coords} 
                              playerLevel={player.level} 
                              isCompact={true} 
                            />
                          </div>
                        )}
                        
                        {/* QUEST TRACKER */}
                        {player.questLog?.active && player.questLog.active.length > 0 && (
                          <div className="mt-3">
                            <QuestHudTracker 
                              activeQuests={player.questLog.active}
                              maxDisplay={2}
                              onOpenLog={() => setIsQuestLogOpen(true)}
                              onQuestClick={() => setIsQuestLogOpen(true)}
                            />
                          </div>
                        )}
                        
                        {/* MAIN QUEST PROMPT - Show when player has no active quests */}
                        {(!player.questLog?.active || player.questLog.active.length === 0) && 
                         (!player.questLog?.completed || player.questLog.completed.length === 0) && (
                          <div className="mt-3 bg-gradient-to-r from-yellow-900/80 to-amber-900/60 border border-yellow-500/50 rounded-lg p-3 max-w-xs animate-pulse">
                            <div className="flex items-center gap-2 text-yellow-400 font-bold text-sm mb-1">
                              <Star size={16} /> Begin Your Journey
                            </div>
                            <p className="text-xs text-yellow-200/80">
                              Visit <span className="text-yellow-400 font-bold">Elder Qingfeng</span> at the Main Hall to start your cultivation path!
                            </p>
                          </div>
                        )}
                    </div>
                    
                    {/* MINI MAP & QUICK ACCESS PANEL */}
                    <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-3">
                        {/* Mini Map */}
                        <div className="bg-black/80 p-1 rounded border border-white/10">
                            <MiniMap />
                        </div>
                        
                        {/* Quick Access Panel - Styled */}
                        <div className="bg-gradient-to-b from-[#1a1d24]/95 to-[#0d0f13]/95 backdrop-blur-md rounded-xl border border-amber-500/20 shadow-xl shadow-black/50 overflow-hidden">
                          {/* Header */}
                          <div className="px-3 py-1.5 bg-gradient-to-r from-amber-900/40 to-transparent border-b border-amber-500/20">
                            <span className="text-[9px] uppercase tracking-widest text-amber-400/70 font-bold">Quick Access</span>
                          </div>
                          
                          {/* Button Grid */}
                          <div className="p-2 grid grid-cols-2 gap-1.5">
                            <button onClick={() => setMapOpen(true)} className="group flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-900/20 hover:bg-amber-600/40 border border-amber-500/30 hover:border-amber-400 text-amber-400 hover:text-amber-200 transition-all">
                              <MapIcon size={14} className="group-hover:scale-110 transition-transform"/>
                              <span className="text-[10px] font-bold">Map</span>
                              <span className="ml-auto text-[8px] text-amber-600 group-hover:text-amber-400">[M]</span>
                            </button>
                            <button onClick={() => setIsQuestLogOpen(true)} className="group flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-900/20 hover:bg-purple-600/40 border border-purple-500/30 hover:border-purple-400 text-purple-400 hover:text-purple-200 transition-all">
                              <Scroll size={14} className="group-hover:scale-110 transition-transform"/>
                              <span className="text-[10px] font-bold">Quests</span>
                              <span className="ml-auto text-[8px] text-purple-600 group-hover:text-purple-400">[Q]</span>
                            </button>
                            <button onClick={() => setLeaderboardOpen(true)} className="group flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-900/20 hover:bg-cyan-600/40 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-cyan-200 transition-all">
                              <Award size={14} className="group-hover:scale-110 transition-transform"/>
                              <span className="text-[10px] font-bold">Rankings</span>
                            </button>
                            <button onClick={() => setAchievementsOpen(true)} className="group flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-900/20 hover:bg-yellow-600/40 border border-yellow-500/30 hover:border-yellow-400 text-yellow-400 hover:text-yellow-200 transition-all">
                              <Trophy size={14} className="group-hover:scale-110 transition-transform"/>
                              <span className="text-[10px] font-bold">Achieve</span>
                            </button>
                            <button onClick={() => setTitlesModalOpen(true)} className="group col-span-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-orange-900/30 to-amber-900/30 hover:from-orange-600/40 hover:to-amber-600/40 border border-orange-500/30 hover:border-orange-400 text-orange-400 hover:text-orange-200 transition-all">
                              <Crown size={14} className="group-hover:scale-110 transition-transform"/>
                              <span className="text-[10px] font-bold">Titles & Honors</span>
                            </button>
                          </div>
                        </div>
                    </div>

                    {/* NAVIGATION & HUNT */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                        {['w', 'n', 's', 'e'].map(dir => (<button key={dir} onClick={() => movePlayer(dir)} disabled={!getCurrentLocation().exits.includes(dir)} className={`w-10 h-10 flex items-center justify-center rounded border transition-all ${getCurrentLocation().exits.includes(dir) ? 'bg-black/60 border-white/20 hover:border-amber-500 text-gray-200 hover:text-amber-500' : 'bg-black/20 border-transparent text-gray-700 cursor-not-allowed'}`}>{dir === 'n' ? <ArrowUp size={16}/> : dir === 's' ? <ArrowDown size={16}/> : dir === 'w' ? <ArrowLeft size={16}/> : <ArrowRight size={16}/>}</button>))}
                    </div>
                    
                    {/* HUNT MONSTERS (Combat Zones) */}
                    {(bestiaryMap[`${coords.x},${coords.y}`] || bestiaryMap[getCurrentLocation().name]) && (
                      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
                        {/* Auto-Combat Toggle */}
                        <div className="flex items-center gap-2 bg-black/80 rounded-xl px-3 py-2 border border-white/10">
                          {/* Auto-Combat Button - Opens Settings when not active, Stops when active */}
                          <button
                            onClick={() => isAutoCombatActive ? stopAutoCombatSession('manual') : setAutoCombatSettingsOpen(true)}
                            disabled={autoCombatTimeRemaining <= 0 && !isAutoCombatActive}
                            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                              isAutoCombatActive
                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30 border-2 border-green-400'
                                : autoCombatTimeRemaining > 0
                                  ? 'bg-gradient-to-r from-purple-800 to-indigo-800 text-white hover:from-purple-700 hover:to-indigo-700 border-2 border-purple-500/50'
                                  : 'bg-gray-800/50 text-gray-500 cursor-not-allowed border-2 border-gray-700/30'
                            }`}
                          >
                            {isAutoCombatActive ? (
                              <>
                                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                                <span>Stop Auto</span>
                              </>
                            ) : (
                              <>
                                <RefreshCw size={14} />
                                <span>Auto-Combat</span>
                              </>
                            )}
                          </button>
                          
                          {/* Time Remaining Display */}
                          <div 
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border cursor-help ${
                              autoCombatTimeRemaining > 300 
                                ? 'bg-cyan-900/30 border-cyan-600/40 text-cyan-300' 
                                : autoCombatTimeRemaining > 0 
                                  ? 'bg-amber-900/30 border-amber-600/40 text-amber-300' 
                                  : 'bg-red-900/30 border-red-600/40 text-red-300'
                            }`}
                            title="Daily auto-combat time. Resets every day at 00:00 (midnight). Use Time Extension Scrolls to add more time."
                          >
                            <Clock size={14} />
                            <span className="font-mono font-bold">{formatAutoCombatTime(autoCombatTimeRemaining)}</span>
                          </div>
                        </div>
                        
                        {/* Manual Hunt Button */}
                        {!isAutoCombatActive && (
                          <button 
                            onClick={startCombat} 
                            className="bg-red-900/80 hover:bg-red-700 border border-red-500 text-white px-8 py-2 rounded-full font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 animate-pulse hover:animate-none hover:scale-105 transition-all"
                          >
                            <Sword size={16}/> Hunt Monsters
                          </button>
                        )}
                        
                        {isAutoCombatActive && (
                          <div className="text-xs text-green-400/80 flex items-center gap-1">
                            <Sparkles size={12} />
                            <span>Auto-hunting in progress... Click to stop</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* NPCs (Safe Zones) */}
                    {getCurrentLocation().safeZone && getNPCsByZone(`${coords.x},${coords.y}`).length > 0 && (
                      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-3">
                        {getNPCsByZone(`${coords.x},${coords.y}`).map(npc => {
                          // Check quest status for this NPC
                          const npcQuests = getQuestsForNPC(npc.id);
                          const questLog = player.questLog || createDefaultQuestLog();
                          const hasCompletable = npcQuests.some(q => {
                            const state = questLog.active.find(s => s.questId === q.id);
                            return state && isQuestComplete(q, state);
                          });
                          const hasAvailable = npcQuests.some(q => {
                            const check = canAcceptQuest(q, player.level, questLog, allQuests);
                            return check.canAccept;
                          });
                          
                          // Determine indicator and style
                          const indicator = hasCompletable ? '?' : hasAvailable ? '!' : '';
                          const indicatorClass = hasCompletable 
                            ? 'text-yellow-400 animate-bounce' 
                            : hasAvailable 
                            ? 'text-yellow-400 animate-pulse' 
                            : '';
                          const buttonClass = hasCompletable 
                            ? 'bg-green-900/80 hover:bg-green-700 border-green-500' 
                            : hasAvailable 
                            ? 'bg-yellow-900/80 hover:bg-yellow-700 border-yellow-500' 
                            : 'bg-purple-900/80 hover:bg-purple-700 border-purple-500';
                          
                          return (
                            <button
                              key={npc.id}
                              onClick={() => {
                                // Update talk objectives when talking to NPC
                                const updates = onNPCTalk(npc.id, player.questLog || createDefaultQuestLog(), allQuests);
                                if (updates.length > 0) {
                                  // Clone questLog with updates applied
                                  const newQuestLog = { ...(player.questLog || createDefaultQuestLog()) };
                                  newQuestLog.active = newQuestLog.active.map(state => {
                                    const update = updates.find(u => u.questId === state.questId);
                                    if (update) {
                                      return {
                                        ...state,
                                        objectives: { ...state.objectives, [update.objectiveId]: update.newProgress }
                                      };
                                    }
                                    return state;
                                  });
                                  setPlayer(p => ({ ...p, questLog: newQuestLog }));
                                  updates.forEach(u => {
                                    const quest = getQuestById(u.questId);
                                    if (quest) {
                                      addLog(`📜 Talked to ${npc.name} - quest progress updated!`, 'info');
                                    }
                                  });
                                }
                                setActiveNPC(npc);
                              }}
                              className={`${buttonClass} text-white px-6 py-2 rounded-full font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 hover:scale-105 transition-all relative`}
                            >
                              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/30 bg-gray-800 flex items-center justify-center">
                                <img 
                                  src={`/assets/npcs/${npc.id}.png`}
                                  alt={npc.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { 
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement!.innerHTML = `<span class="text-lg">${npc.portrait}</span>`;
                                  }}
                                />
                              </div>
                              {npc.name}
                              {indicator && (
                                <span className={`absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center bg-yellow-500 text-black rounded-full text-sm font-bold ${indicatorClass}`}>
                                  {indicator}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                </div>
                
                {/* GAME LOG */}
                <div className="h-40 flex flex-col bg-[#050608] border-t border-[#2a2f3a]">
                    <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1 custom-scrollbar">
                         {gameLog.map((log, i) => (<div key={i} className={`${log.type==='cmd'?'text-gray-500 font-bold':log.type==='danger'?'text-red-500 font-bold':log.type==='warning'?'text-amber-500':log.type==='success'?'text-emerald-400':log.type==='system'?'text-cyan-500':'text-gray-300'}`}>{log.text}</div>))}
                         <div ref={logEndRef} />
                    </div>
                </div>
              </main>
            </WorldPage>
          )}

          {activeTab === 'character' && (
            <CharacterPage
              player={player}
              totalStats={totalStats}
              combatStats={combatStats}
              skills={player.skills}
              allSkills={allSkillsDatabase}
              selectedClass={player.selectedClass}
              hybridClassSystem={hybridClassSystem}
              inventory={player.inventory.filter(i => ['weapon', 'ring', 'necklace', 'gear'].includes(i.type))}
              onAllocateStat={allocateStat}
              onOpenResetConfirm={openResetConfirm}
              onOpenClassSelector={() => setClassSelectorOpen(true)}
              onOpenSkillModal={() => setSkillModalOpen(true)}
              onUnequip={unequipItem}
              onEquip={equipItem}
              onHardReset={hardReset}
              onSwitchCharacter={handleReturnToCharacterSelect}
              GearSlot={GearSlot}
              setHoverItem={setHoverItem}
              setMousePos={setMousePos}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryPage
              inventory={player.inventory}
              bank={player.bank || []}
              spiritStones={player.spiritStones}
              contribution={player.contribution}
              getItemById={getItemById}
              getIcon={getIcon}
              onEquip={equipItem}
              onReforge={(item) => {
                setSelectedGearForReforge(item);
                setReforgingModalOpen(true);
              }}
              setHoverItem={setHoverItem}
              setMousePos={setMousePos}
              onDepositToBank={depositToBank}
              onWithdrawFromBank={withdrawFromBank}
              onSellJunk={sellJunkItem}
              onSellAllJunk={sellAllJunk}
              onStackInventory={stackInventory}
            />
          )}

          {activeTab === 'forge' && (
            <ForgePage
              playerClass={player.selectedClass || 1}
              playerMaterials={player.inventory.filter(i => i.type === 'material').reduce((acc, item) => {
                // Use materialId if available (for dropped materials), otherwise fall back to id
                const matId = item.materialId || item.id;
                acc[matId] = (acc[matId] || 0) + (item.count || 1);
                return acc;
              }, {} as Record<string, number>)}
              playerSpiritStones={player.spiritStones}
              onCraft={handleCraft}
              onReforge={handleReforge}
              onSalvage={(item) => {
                setSelectedGearForSalvage(item);
                setSalvageModalOpen(true);
              }}
              inventory={player.inventory.filter(i => i.type === 'gear' || i.type === 'weapon' || i.type === 'ring' || i.type === 'necklace')}
              equippedGear={player.equipment}
              onOpenRepair={() => setRepairModalOpen(true)}
            />
          )}

          {activeTab === 'bestiary' && (
            <BestiaryPage 
              killCounter={player.killCounter} 
              bestiaryProgress={player.bestiaryProgress}
              onClaimReward={(reward) => {
                setPlayer(p => {
                  const newProgress = { ...p.bestiaryProgress };
                  let stonesToAdd = 0;
                  
                  if (reward.type === 'discovery') {
                    newProgress.claimedDiscovery = [...(newProgress.claimedDiscovery || []), reward.milestone];
                    if (reward.reward.type === 'title_stones') stonesToAdd = reward.reward.stones;
                  } else if (reward.type === 'mob') {
                    newProgress.claimedMobMilestones = { ...newProgress.claimedMobMilestones };
                    const mobClaims = newProgress.claimedMobMilestones[reward.mobId] || [];
                    newProgress.claimedMobMilestones[reward.mobId] = [...mobClaims, reward.milestone];
                    // Stone rewards for mob milestones
                    if (reward.reward.type === 'stones') {
                      const mob = mobDefinitions.find(m => m.id === reward.mobId);
                      stonesToAdd = mob ? 20 + (mob.level * 4) : 50;
                    }
                  } else if (reward.type === 'realm') {
                    newProgress.claimedRealmMastery = [...(newProgress.claimedRealmMastery || []), reward.realm];
                    if (reward.reward.type === 'title_stones') stonesToAdd = reward.reward.stones;
                  } else if (reward.type === 'tag') {
                    newProgress.claimedTagMastery = { ...newProgress.claimedTagMastery };
                    const tagClaims = newProgress.claimedTagMastery[reward.tag] || [];
                    newProgress.claimedTagMastery[reward.tag] = [...tagClaims, reward.milestone];
                  }
                  
                  return {
                    ...p,
                    bestiaryProgress: newProgress,
                    spiritStones: p.spiritStones + stonesToAdd,
                  };
                });
                addLog(`🏆 Claimed: ${reward.label}`, 'success');
                addToast(`🏆 ${reward.label}`, 'success');
              }}
            />
          )}
          {activeTab === 'map' && (
            <CultivationPage
              player={{
                level: player.level,
                totalKills: Object.values(player.killCounter || {}).reduce((a: number, b: number) => a + b, 0),
                questsCompleted: player.questLog?.completed?.length || 0,
                totalStonesEarned: player.spiritStones + (player.totalStonesSpent || 0),
                totalCrafts: player.totalCrafts || 0,
              }}
              cultivationProgress={player.cultivationProgress || createInitialCultivationProgress()}
              onClaimDaily={(day) => {
                const reward = getDailyReward(day);
                if (!reward) return;
                
                setPlayer(p => {
                  const progress = p.cultivationProgress || createInitialCultivationProgress();
                  if (progress.claimedDailyRewards.includes(day)) return p;
                  
                  let spiritStonesBonus = reward.rewards.spiritStones || 0;
                  let expBonus = reward.rewards.exp || 0;
                  
                  // Add items to inventory with auto-stacking (HP/QI pills, materials, etc.)
                  let newInventory = [...(p.inventory || [])];
                  if (reward.rewards.items && reward.rewards.items.length > 0) {
                    for (const rewardItem of reward.rewards.items) {
                      const itemId = rewardItem.itemId;
                      const quantity = rewardItem.quantity || 1;
                      
                      if (itemId.startsWith('CONS_HP')) {
                        newInventory = addItemToInventory(newInventory, {
                          name: 'HP Restoring Pill',
                          type: 'consumable',
                          effect: 'hp',
                          amount: 50,
                          iconType: 'hp_pill',
                          desc: 'Restores 50 HP instantly.',
                          rarity: 'Common',
                          tier: 1,
                        }, quantity);
                        addLog(`💊 Received ${quantity}x HP Restoring Pill`, 'info');
                      } else if (itemId.startsWith('CONS_QI')) {
                        newInventory = addItemToInventory(newInventory, {
                          name: 'QI Restoring Pill',
                          type: 'consumable',
                          effect: 'qi',
                          amount: 30,
                          iconType: 'qi_pill',
                          desc: 'Restores 30 QI instantly.',
                          rarity: 'Common',
                          tier: 1,
                        }, quantity);
                        addLog(`💠 Received ${quantity}x QI Restoring Pill`, 'info');
                      } else if (itemId.startsWith('MAT_')) {
                        // Material items - add to materials section with stacking
                        const matName = itemId.includes('SWORD') ? 'Sword Material' : itemId.includes('SABER') ? 'Saber Material' : 'Zither Material';
                        const matIcon = itemId.includes('SWORD') ? 'token_sword' : itemId.includes('SABER') ? 'token_saber' : 'token_zither';
                        newInventory = addItemToInventory(newInventory, {
                          materialId: itemId,
                          name: matName,
                          type: 'material',
                          iconType: matIcon,
                        }, quantity);
                        addLog(`📦 Received ${quantity}x crafting materials`, 'info');
                      }
                    }
                  }
                  
                  addToast(`🎁 Day ${day} Reward: +${spiritStonesBonus} Spirit Stones${expBonus ? `, +${expBonus} EXP` : ''}!`, 'success');
                  addLog(`🎁 Claimed Day ${day} reward!`, 'success');
                  
                  return {
                    ...p,
                    inventory: newInventory,
                    spiritStones: p.spiritStones + spiritStonesBonus,
                    exp: p.exp + expBonus,
                    cultivationProgress: {
                      ...progress,
                      claimedDailyRewards: [...progress.claimedDailyRewards, day],
                    },
                  };
                });
              }}
              onClaimMilestone={(milestoneId) => {
                const milestone = CULTIVATION_MILESTONES.find(m => m.id === milestoneId);
                if (!milestone) return;
                
                setPlayer(p => {
                  const progress = p.cultivationProgress || createInitialCultivationProgress();
                  if (progress.claimedMilestones.includes(milestoneId)) return p;
                  
                  let spiritStonesBonus = milestone.rewards.spiritStones || 0;
                  let expBonus = milestone.rewards.exp || 0;
                  let apBonus = milestone.rewards.ap || 0;
                  
                  // Add items to inventory with auto-stacking (for breakthrough pills, etc.)
                  let newInventory = [...(p.inventory || [])];
                  if (milestone.rewards.items && milestone.rewards.items.length > 0) {
                    for (const rewardItem of milestone.rewards.items) {
                      const itemId = rewardItem.itemId;
                      const quantity = rewardItem.quantity || 1;
                      
                      if (itemId === 'CONS_FOUNDATION_PILL') {
                        // Special breakthrough pill - doesn't stack
                        newInventory = addItemToInventory(newInventory, {
                          name: 'Foundation Pill',
                          type: 'consumable',
                          effect: 'foundation_pill',
                          amount: 0,
                          iconType: 'foundation_pill',
                          desc: 'A sacred pill that enables breakthrough from Qi Condensation to Foundation Establishment. Consume at Level 9 peak.',
                          rarity: 'Epic',
                          tier: 1,
                        }, quantity);
                        addLog(`💊 Obtained Foundation Pill! Use it at Level 9 to breakthrough.`, 'success');
                      } else if (itemId === 'CONS_GOLDEN_PILL') {
                        newInventory = addItemToInventory(newInventory, {
                          name: 'Golden Pill',
                          type: 'consumable',
                          effect: 'golden_pill',
                          amount: 0,
                          iconType: 'golden_pill',
                          desc: 'A divine pill that enables breakthrough from Foundation Establishment to Golden Core realm. Consume at Level 19 peak.',
                          rarity: 'Legendary',
                          tier: 2,
                        }, quantity);
                        addLog(`💊 Obtained Golden Pill! Use it at Level 19 to breakthrough.`, 'success');
                      } else if (itemId.startsWith('CONS_HP')) {
                        newInventory = addItemToInventory(newInventory, {
                          name: 'HP Restoring Pill',
                          type: 'consumable',
                          effect: 'hp',
                          amount: 50,
                          iconType: 'hp_pill',
                          desc: 'Restores 50 HP instantly.',
                          rarity: 'Common',
                          tier: 1,
                        }, quantity);
                      } else if (itemId.startsWith('CONS_QI')) {
                        newInventory = addItemToInventory(newInventory, {
                          name: 'QI Restoring Pill',
                          type: 'consumable',
                          effect: 'qi',
                          amount: 30,
                          iconType: 'qi_pill',
                          desc: 'Restores 30 QI instantly.',
                          rarity: 'Common',
                          tier: 1,
                        }, quantity);
                      }
                    }
                  }
                  
                  addToast(`🏆 ${milestone.name}: +${spiritStonesBonus} Spirit Stones${apBonus ? `, +${apBonus} AP` : ''}!`, 'success');
                  addLog(`🏆 Milestone achieved: ${milestone.name}!`, 'success');
                  
                  return {
                    ...p,
                    inventory: newInventory,
                    spiritStones: p.spiritStones + spiritStonesBonus,
                    exp: p.exp + expBonus,
                    ap: p.ap + apBonus,
                    totalAPEarned: (p.totalAPEarned || 0) + apBonus,
                    cultivationProgress: {
                      ...progress,
                      claimedMilestones: [...progress.claimedMilestones, milestoneId],
                    },
                  };
                });
              }}
            />
          )}

          {activeTab === 'market' && (
            <MarketView
              playerGold={player.spiritStones}
              playerId={user?.id}
              playerName={player.name}
              onBuy={(order) => {
                // Handle buy order - deduct spirit stones and add item to inventory
                if (order.price * order.quantity > player.spiritStones) {
                  addToast('Not enough Spirit Stones!', 'danger');
                  return;
                }
                setPlayer(p => ({
                  ...p,
                  spiritStones: p.spiritStones - (order.price * order.quantity)
                }));
                addToast(`Purchased ${order.quantity}x ${order.itemName} for ${order.price * order.quantity} Spirit Stones`, 'success');
                addLog(`🛒 Bought ${order.quantity}x ${order.itemName} from market`, 'info');
              }}
              onSell={(order) => {
                // Handle sell order - add spirit stones with 5% transaction tax
                const grossAmount = order.totalPrice;
                const taxAmount = Math.floor(grossAmount * 0.05); // 5% tax
                const netAmount = grossAmount - taxAmount;
                
                setPlayer(p => ({
                  ...p,
                  spiritStones: p.spiritStones + netAmount
                }));
                addToast(`Sold ${order.quantity}x ${order.itemName} for ${netAmount} Spirit Stones (${taxAmount} tax)`, 'success');
                addLog(`💰 Sold ${order.quantity}x ${order.itemName} on market (5% tax: ${taxAmount})`, 'info');
              }}
            />
          )}
        </div>

        {/* --- MODALS (Outside Tab Content) --- */}
        
        {isMapOpen && <VisualWorldMap coords={coords} setCoords={setCoords} player={player} setMapOpen={setMapOpen} onTravel={travelFast} />}

        {isQuestLogOpen && (
          <QuestPanel
            questLog={player.questLog || createDefaultQuestLog()}
            playerLevel={player.level}
            playerName={player.name}
            playerClass={player.selectedClass || 1}
            onClose={() => setIsQuestLogOpen(false)}
            onAcceptQuest={(questId) => {
              const result = startQuest(questId, player.questLog || createDefaultQuestLog(), player, allQuests);
              if (result.success && result.questLog) {
                setPlayer(p => ({ ...p, questLog: result.questLog }));
                addToast(`📜 Quest accepted!`, 'success');
                addLog(`📜 New quest: ${getQuestById(questId)?.name || 'Quest'}`, 'info');
              } else {
                addToast(result.message, 'danger');
              }
            }}
            onAbandonQuest={(questId) => {
              setPlayer(p => ({
                ...p,
                questLog: abandonQuest(questId, p.questLog || createDefaultQuestLog())
              }));
              addToast('Quest abandoned!', 'warning');
            }}
            onCompleteQuest={(questId) => {
              const result = completeQuest(questId, player.questLog || createDefaultQuestLog(), player, allQuests);
              if (result.success && result.questLog && result.rewards) {
                const quest = getQuestById(questId);
                setPlayer(p => {
                  let newP = { ...p, questLog: result.questLog };
                  // EXP rewards
                  if (result.rewards!.exp) newP.exp = (newP.exp || 0) + result.rewards!.exp;
                  // Spirit Stones rewards
                  if (result.rewards!.spiritStones) newP.spiritStones = (newP.spiritStones || 0) + result.rewards!.spiritStones;
                  // Item rewards - add to inventory with auto-stacking
                  if (result.rewards!.items && result.rewards!.items.length > 0) {
                    let newInv = [...(newP.inventory || [])];
                    for (const rewardItem of result.rewards!.items) {
                      const itemId = rewardItem.itemId || rewardItem.id;
                      const quantity = rewardItem.quantity || 1;
                      const itemDef = itemId ? getItemById(typeof itemId === 'string' ? parseInt(itemId.replace(/\D/g, '')) : itemId) : null;
                      
                      if (itemDef) {
                        // Use addItemToInventory for automatic stacking
                        newInv = addItemToInventory(newInv, {
                          itemId: itemDef.id,
                          name: itemDef.name,
                          type: itemDef.type,
                          iconType: getWeaponIconType(itemDef),
                          desc: itemDef.desc,
                          rarity: itemDef.rarity,
                          tier: itemDef.tier
                        }, quantity);
                      } else if (typeof itemId === 'string' && itemId.startsWith('CONS_')) {
                        // Consumable items (HP/QI potions)
                        const isHP = itemId.includes('HP');
                        newInv = addItemToInventory(newInv, {
                          materialId: itemId,
                          name: isHP ? 'HP Restoring Pill' : 'QI Restoring Pill',
                          type: 'consumable',
                          effect: isHP ? 'hp' : 'qi',
                          amount: isHP ? 50 : 30,
                          iconType: isHP ? 'hp_pill' : 'qi_pill',
                          desc: isHP ? 'Restores 50 HP instantly.' : 'Restores 30 QI instantly.',
                          rarity: 'Common',
                          tier: 1
                        }, quantity);
                      }
                    }
                    newP.inventory = newInv;
                  }
                  // Reputation rewards
                  if (result.rewards!.reputation) {
                    const repData = result.rewards!.reputation;
                    if (!newP.reputation) newP.reputation = {};
                    if (Array.isArray(repData)) {
                      repData.forEach(r => {
                        newP.reputation![r.factionId] = (newP.reputation![r.factionId] || 0) + r.amount;
                      });
                    } else {
                      Object.entries(repData).forEach(([factionId, amount]) => {
                        newP.reputation![factionId] = (newP.reputation![factionId] || 0) + (amount as number);
                      });
                    }
                  }
                  return newP;
                });
                // Show detailed reward toast
                const rewardParts = [];
                if (result.rewards.exp) rewardParts.push(`+${result.rewards.exp} EXP`);
                if (result.rewards.spiritStones) rewardParts.push(`+${result.rewards.spiritStones} 💎`);
                if (result.rewards.items?.length) rewardParts.push(`+${result.rewards.items.length} items`);
                addToast(`✅ Quest completed! ${rewardParts.join(', ')}`, 'success', 5000);
                addLog(`✅ Quest completed: ${quest?.name}`, 'success');
                if (result.rewards.exp) addLog(`  → +${result.rewards.exp} EXP`, 'info');
                if (result.rewards.spiritStones) addLog(`  → +${result.rewards.spiritStones} Spirit Stones`, 'info');
                
                // Play reward animation
                const animRewards = [];
                if (result.rewards.exp) animRewards.push({ type: 'exp' as const, amount: result.rewards.exp });
                if (result.rewards.spiritStones) animRewards.push({ type: 'stones' as const, amount: result.rewards.spiritStones });
                if (result.rewards.items) {
                  result.rewards.items.forEach((item: any) => {
                    animRewards.push({ type: 'item' as const, name: item.name || 'Item', rarity: item.rarity });
                  });
                }
                if (animRewards.length > 0) playRewardAnimation(animRewards);
              } else {
                addToast(result.message, 'danger');
              }
            }}
          />
        )}

        {activeNPC && (
          <NPCDialog
            npc={activeNPC}
            questLog={player.questLog || createDefaultQuestLog()}
            playerLevel={player.level}
            playerName={player.name}
            playerClass={player.selectedClass || 1}
            zoneBackground={worldMap[`${coords.x},${coords.y}`]?.img}
            onClose={() => setActiveNPC(null)}
            onAcceptQuest={(questId) => {
              const result = startQuest(questId, player.questLog || createDefaultQuestLog(), player, allQuests);
              if (result.success && result.questLog) {
                setPlayer(p => ({ ...p, questLog: result.questLog }));
                addToast(`📜 Quest accepted!`, 'success');
                addLog(`📜 New quest: ${getQuestById(questId)?.name || 'Quest'}`, 'info');
              } else {
                addToast(result.message, 'danger');
              }
            }}
            onCompleteQuest={(questId) => {
              const result = completeQuest(questId, player.questLog || createDefaultQuestLog(), player, allQuests);
              if (result.success && result.questLog && result.rewards) {
                const quest = getQuestById(questId);
                setPlayer(p => {
                  let newP = { ...p, questLog: result.questLog };
                  // EXP rewards
                  if (result.rewards!.exp) newP.exp = (newP.exp || 0) + result.rewards!.exp;
                  // Spirit Stones rewards  
                  if (result.rewards!.spiritStones) newP.spiritStones = (newP.spiritStones || 0) + result.rewards!.spiritStones;
                  // Item rewards - add to inventory with auto-stacking
                  if (result.rewards!.items && result.rewards!.items.length > 0) {
                    let newInv = [...(newP.inventory || [])];
                    for (const rewardItem of result.rewards!.items) {
                      const itemId = rewardItem.itemId || rewardItem.id;
                      const quantity = rewardItem.quantity || 1;
                      const itemDef = itemId ? getItemById(typeof itemId === 'string' ? parseInt(itemId.replace(/\D/g, '')) : itemId) : null;
                      
                      if (itemDef) {
                        // Use addItemToInventory for automatic stacking
                        newInv = addItemToInventory(newInv, {
                          itemId: itemDef.id,
                          name: itemDef.name,
                          type: itemDef.type,
                          iconType: getWeaponIconType(itemDef),
                          desc: itemDef.desc,
                          rarity: itemDef.rarity,
                          tier: itemDef.tier
                        }, quantity);
                      } else if (typeof itemId === 'string' && itemId.startsWith('CONS_')) {
                        // Consumable items (HP/QI potions)
                        const isHP = itemId.includes('HP');
                        newInv = addItemToInventory(newInv, {
                          materialId: itemId,
                          name: isHP ? 'HP Restoring Pill' : 'QI Restoring Pill',
                          type: 'consumable',
                          effect: isHP ? 'hp' : 'qi',
                          amount: isHP ? 50 : 30,
                          iconType: isHP ? 'hp_pill' : 'qi_pill',
                          desc: isHP ? 'Restores 50 HP instantly.' : 'Restores 30 QI instantly.',
                          rarity: 'Common',
                          tier: 1
                        }, quantity);
                      }
                    }
                    newP.inventory = newInv;
                  }
                  // Reputation rewards
                  if (result.rewards!.reputation) {
                    const repData = result.rewards!.reputation;
                    if (!newP.reputation) newP.reputation = {};
                    if (Array.isArray(repData)) {
                      repData.forEach(r => {
                        newP.reputation![r.factionId] = (newP.reputation![r.factionId] || 0) + r.amount;
                      });
                    } else {
                      Object.entries(repData).forEach(([factionId, amount]) => {
                        newP.reputation![factionId] = (newP.reputation![factionId] || 0) + (amount as number);
                      });
                    }
                  }
                  return newP;
                });
                // Show detailed reward toast
                const rewardParts = [];
                if (result.rewards.exp) rewardParts.push(`+${result.rewards.exp} EXP`);
                if (result.rewards.spiritStones) rewardParts.push(`+${result.rewards.spiritStones} 💎`);
                if (result.rewards.items?.length) rewardParts.push(`+${result.rewards.items.length} items`);
                addToast(`✅ Quest completed! ${rewardParts.join(', ')}`, 'success', 5000);
                addLog(`✅ Quest completed: ${quest?.name}`, 'success');
                if (result.rewards.exp) addLog(`  → +${result.rewards.exp} EXP`, 'info');
                if (result.rewards.spiritStones) addLog(`  → +${result.rewards.spiritStones} Spirit Stones`, 'info');
                if (result.rewards.items?.length) addLog(`  → +${result.rewards.items.length} item(s)`, 'info');
                
                // Play reward animation
                const animRewards = [];
                if (result.rewards.exp) animRewards.push({ type: 'exp' as const, amount: result.rewards.exp });
                if (result.rewards.spiritStones) animRewards.push({ type: 'stones' as const, amount: result.rewards.spiritStones });
                if (result.rewards.items) {
                  result.rewards.items.forEach((item: any) => {
                    animRewards.push({ type: 'item' as const, name: item.name || 'Item', rarity: item.rarity });
                  });
                }
                if (animRewards.length > 0) playRewardAnimation(animRewards);
              } else {
                addToast(result.message, 'danger');
              }
            }}
          />
        )}

        {isSkillModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setSkillModalOpen(false)}>
                <div className="bg-[#1e293b] p-6 rounded-xl border border-amber-500/30 w-[500px] max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                    <h2 className="text-center text-amber-500 font-serif font-bold mb-4 uppercase flex items-center justify-center gap-2"><BookOpen size={16}/> Martial Arts</h2>
                    
                    {/* Current Hotbar */}
                    <div className="text-[10px] text-gray-500 uppercase font-bold mb-2">Active Hotbar (4 Slots)</div>
                    <div className="grid grid-cols-4 gap-3 mb-6">
                        {player.skills.map((sid, idx) => {
                             const skill = sid ? getSkillById(sid) : null;
                             return (
                                 <div key={idx} className={`aspect-square bg-[#0f1115] border rounded flex flex-col items-center justify-center gap-1 relative p-2 ${skill ? 'border-amber-500' : 'border-gray-700'}`}>
                                     <span className="absolute top-1 left-2 text-[8px] text-gray-500 font-bold">SLOT {idx+1}</span>
                                     {skill ? (
                                       <>
                                         <img src={getSkillIconPath(skill)} alt={skill.name} className="w-10 h-10 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                         <span className="text-[9px] text-gray-300 font-bold truncate max-w-full">{skill.name}</span>
                                         <span className="text-[8px] text-cyan-400">{skill.qiCost}⚡</span>
                                       </>
                                     ) : (
                                       <>
                                         <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-gray-600">?</div>
                                         <span className="text-[9px] text-gray-500">Empty</span>
                                       </>
                                     )}
                                 </div>
                             );
                        })}
                    </div>
                    
                    {/* Available Skills */}
                    <div className="text-[10px] text-gray-500 uppercase font-bold mb-2">Available Skills (Click to Equip)</div>
                    <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar flex-1">
                        {getPlayerAvailableSkills().map(skill => {
                            const isEquipped = player.skills.includes(skill.id);
                            return (
                                <div key={skill.id} className={`flex items-center justify-between p-3 bg-[#0f1115] rounded border group transition-all ${isEquipped ? 'border-amber-500/50 bg-amber-900/10' : 'border-white/5 hover:border-amber-500'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded border flex items-center justify-center overflow-hidden ${
                                            skill.element === 'Fire' ? 'bg-orange-900/30 border-orange-500/30' :
                                            skill.element === 'Ice' ? 'bg-cyan-900/30 border-cyan-500/30' :
                                            skill.element === 'Wood' ? 'bg-green-900/30 border-green-500/30' :
                                            skill.element === 'Lightning' ? 'bg-yellow-900/30 border-yellow-500/30' :
                                            skill.element === 'Void' ? 'bg-purple-900/30 border-purple-500/30' :
                                            'bg-gray-900/30 border-gray-500/30'
                                        }`}>
                                            <img src={getSkillIconPath(skill)} alt={skill.name} className="w-10 h-10 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-gray-200">{skill.name}</span>
                                                {skill.tier === 4 && <span className="text-[8px] px-1 py-0.5 bg-purple-600 text-white rounded font-bold">ULTIMATE</span>}
                                                {isEquipped && <span className="text-[8px] px-1 py-0.5 bg-amber-600 text-white rounded font-bold">EQUIPPED</span>}
                                            </div>
                                            <div className="text-[9px] text-gray-400 mt-0.5">{getSkillDamageDescription(skill, combatStats.pAtk, combatStats.mAtk, combatStats.primaryStat, combatStats.primaryBonus)}</div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[9px] text-cyan-400 font-bold">{skill.qiCost}⚡ Qi</span>
                                                <span className="text-[9px] text-amber-400 font-bold">{skill.cooldown}t CD</span>
                                                {skill.element !== 'None' && (
                                                    <span className={`text-[9px] font-bold flex items-center gap-0.5 ${
                                                        skill.element === 'Fire' ? 'text-orange-400' :
                                                        skill.element === 'Ice' ? 'text-cyan-400' :
                                                        skill.element === 'Wood' ? 'text-green-400' :
                                                        skill.element === 'Lightning' ? 'text-yellow-400' :
                                                        'text-purple-400'
                                                    }`}>
                                                      <img src={ELEMENT_ICON_PATHS[skill.element]} alt={skill.element} className="w-3 h-3" />
                                                      {skill.element}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {[0,1,2,3].map(slot => (
                                            <button key={slot} onClick={() => equipSkill(skill.id, slot)} className={`w-6 h-6 text-[10px] rounded font-bold border flex items-center justify-center transition-all ${
                                                player.skills[slot] === skill.id 
                                                    ? 'bg-amber-500 text-white border-amber-400' 
                                                    : 'bg-amber-900/50 text-amber-200 border-amber-500/50 hover:bg-amber-600'
                                            }`}>{slot+1}</button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        {getPlayerAvailableSkills().length === 0 && (
                            <div className="text-center text-gray-500 py-8">
                                <p className="text-sm">No skills available</p>
                                <p className="text-xs mt-1">Select a class to unlock skills</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {combat && (
            <div 
                id="combat-arena"
                className={`fixed inset-0 z-[100] combat-arena ${screenShake ? 'animate-screen-shake' : ''}`}
            >
                {/* ========== VFX LAYER ========== */}
                <VFXLayer />
                
                {/* ========== FULLSCREEN BACKGROUND ========== */}
                <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: `url(${getZoneBackground(`${coords.x},${coords.y}`)})`,
                    }}
                />
                {/* Subtle vignette effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
                
                {/* Corner Ornaments */}
                <div className="combat-corner top-left" />
                <div className="combat-corner top-right" />
                <div className="combat-corner bottom-left" />
                <div className="combat-corner bottom-right" />
                    
                {/* ELEMENT EFFECTIVENESS POPUP */}
                {elementPopup && (
                  <div className="absolute inset-0 flex items-center justify-center z-[150] pointer-events-none animate-element-popup">
                    <div 
                      className={`
                        px-8 py-4 rounded-xl border-2 backdrop-blur-md
                        ${elementPopup.type === 'super' 
                          ? 'bg-gradient-to-r from-yellow-900/90 to-orange-900/90 border-yellow-500' 
                          : 'bg-gradient-to-r from-gray-900/90 to-blue-900/90 border-gray-500'
                        }
                      `}
                      style={{
                        boxShadow: `0 0 40px ${ELEMENT_COLORS[elementPopup.element]}`,
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <img 
                          src={ELEMENT_ICON_PATHS[elementPopup.element]} 
                          alt={elementPopup.element} 
                          className="w-12 h-12 object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <div className="text-center">
                          <div className={`text-xl font-bold ${elementPopup.type === 'super' ? 'text-yellow-300' : 'text-gray-300'}`}>
                            {elementPopup.type === 'super' ? '超級有效！' : '效果不佳...'}
                          </div>
                          <div className={`text-lg font-bold ${elementPopup.type === 'super' ? 'text-yellow-400' : 'text-gray-400'}`}>
                            {elementPopup.type === 'super' ? 'SUPER EFFECTIVE!' : 'NOT VERY EFFECTIVE'}
                          </div>
                          <div className={`text-sm font-mono mt-1 ${elementPopup.type === 'super' ? 'text-yellow-200' : 'text-gray-400'}`}>
                            {elementPopup.multiplier > 1 ? '+' : ''}{Math.round((elementPopup.multiplier - 1) * 100)}% damage
                          </div>
                        </div>
                        <img 
                          src={ELEMENT_ICON_PATHS[elementPopup.element]} 
                          alt={elementPopup.element} 
                          className="w-12 h-12 object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ========== TOP HUD - Round Indicator (Wuxia style) ========== */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
                    <div className="flex flex-col items-center">
                        <div className="round-counter">
                            <span className="text-amber-100 font-bold text-2xl tabular-nums">{combatRound}</span>
                        </div>
                        {/* Turn indicator below */}
                        <div className={`turn-indicator mt-3 ${
                            lastAttacker === 'player' 
                                ? 'player-turn' 
                                : lastAttacker === 'enemy'
                                ? 'enemy-turn'
                                : ''
                        }`}>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{lastAttacker === 'player' ? '⚔️' : lastAttacker === 'enemy' ? '💢' : '⚡'}</span>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-amber-100 tracking-wider">
                                        {lastAttacker === 'player' ? '汝之回合' : lastAttacker === 'enemy' ? '敵之回合' : '戰鬥'}
                                    </div>
                                    <div className="text-xs text-amber-200/70 font-medium">
                                        {lastAttacker === 'player' ? 'YOUR TURN' : lastAttacker === 'enemy' ? 'ENEMY TURN' : 'COMBAT'}
                                    </div>
                                </div>
                                <span className="text-2xl">{lastAttacker === 'player' ? '⚔️' : lastAttacker === 'enemy' ? '💢' : '⚡'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ========== COMBAT LOG - Top Right Corner (Wuxia style) ========== */}
                <div className="absolute top-4 right-4 z-20 w-80">
                    <div className="combat-log">
                        <div className="flex items-center justify-between px-3 py-2 bg-black/40 border-b border-amber-500/20">
                            <span className="text-amber-400 font-bold text-xs flex items-center gap-2">
                                <span>📜</span>
                                <span className="tracking-wider">戰鬥記錄</span>
                            </span>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => setCombatLogPaused(!combatLogPaused)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${combatLogPaused ? 'bg-green-600 text-white' : 'bg-amber-600 text-black hover:bg-amber-500'}`}
                                >
                                    {combatLogPaused ? '▶' : '⏸'}
                                </button>
                                <button onClick={() => setCombatLog([])} className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600/80 text-white hover:bg-red-500">🗑</button>
                            </div>
                        </div>
                        <div className="max-h-32 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
                            {combatLog.slice(-6).map((log, i) => {
                                // Map log.type to CombatLogType for icon lookup
                                const iconType = log.type === 'success' ? 'player_attack' :
                                              log.type === 'danger' ? 'enemy_attack' :
                                              log.type === 'crit' ? 'player_crit' :
                                              log.type === 'gold' ? 'passive' :
                                              log.type === 'warning' ? 'warning' : 'system';
                                return (
                                    <div key={i} className={`combat-log-entry ${
                                        log.type === 'success' ? 'attack' :
                                        log.type === 'danger' ? 'damage' :
                                        log.type === 'crit' ? 'crit' :
                                        log.type === 'gold' ? 'skill' :
                                        ''
                                    }`}>
                                        <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                                            <CombatLogIconComponent type={iconType as any} />
                                        </span>
                                        <span className="flex-1 text-gray-300">{log.text}</span>
                                    </div>
                                );
                            })}
                            <div ref={combatLogRef} />
                        </div>
                    </div>
                </div>

                {/* COMBO TRACKER */}
                {comboProgress && (
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20">
                        <ComboTracker 
                            combo={comboProgress.combo}
                            currentStep={comboProgress.currentStep}
                            startTime={comboProgress.startTime}
                        />
                    </div>
                )}
                    
                {/* COMBO COMPLETE EFFECT */}
                {completedCombo && (
                    <div className="absolute inset-0 flex items-center justify-center z-[160] pointer-events-none">
                        <ComboCompleteEffect combo={completedCombo} />
                    </div>
                )}

                {/* ========== ARENA - CHARACTERS AT OPPOSITE ENDS ========== */}
                <div className="absolute inset-0 pointer-events-none">
                    
                    {/* SKILL PARTICLES EFFECT */}
                    {combatAnimations.skillParticles.length > 0 && (
                        <div className="absolute inset-0 pointer-events-none z-40">
                            {combatAnimations.skillParticles.map(particle => {
                                const colors: Record<string, string> = {
                                    fire: '#ff6b35',
                                    ice: '#00d4ff',
                                    lightning: '#c084fc',
                                    wood: '#4ade80',
                                    void: '#a855f7'
                                };
                                return (
                                    <div
                                        key={particle.id}
                                        className="absolute left-1/2 top-1/2 w-4 h-4 rounded-full animate-skill-particle"
                                        style={{
                                            backgroundColor: colors[particle.element] || '#fbbf24',
                                            boxShadow: `0 0 20px ${colors[particle.element] || '#fbbf24'}`,
                                            '--px': `${particle.x}px`,
                                            '--py': `${particle.y}px`
                                        } as React.CSSProperties}
                                    />
                                );
                            })}
                        </div>
                    )}
                    
                    {/* SLASH EFFECT when attacking */}
                    {combatAnimations.playerAttacking && (
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 pointer-events-none z-30">
                            <div 
                                className="w-full h-full animate-slash-effect"
                                style={{
                                    background: combatAnimations.playerSkillEffect 
                                        ? `linear-gradient(90deg, transparent, ${ELEMENT_COLORS[combatAnimations.playerSkillEffect.element]}, transparent)`
                                        : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)'
                                }}
                            />
                        </div>
                    )}
                    
                    {/* PLAYER CHARACTER - LEFT SIDE */}
                    <div 
                        className="absolute pointer-events-auto"
                        style={{
                            left: '5%',
                            bottom: '200px',
                            zIndex: combatAnimations.playerAttacking ? 15 : 10,
                            transform: combatAnimations.playerAttacking 
                                ? 'translateX(80px) scale(1.1)' 
                                : combatAnimations.playerHit 
                                ? 'translateX(-20px) scale(0.95)'
                                : 'translateX(0) scale(1)',
                            transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                            animation: !combatAnimations.playerAttacking && !combatAnimations.playerHit 
                                    ? 'idle-breathe 3s ease-in-out infinite' 
                                    : 'none'
                            }}
                        >
                            <img 
                                src={player.selectedClass ? getPlayerSprite(player.selectedClass) : player.avatar} 
                                className="h-64 lg:h-80 w-auto object-contain"
                                style={{ 
                                    filter: combatAnimations.playerHit 
                                        ? 'brightness(2) saturate(0.3)' 
                                        : combatAnimations.playerSkillEffect?.active
                                        ? `brightness(1.3) drop-shadow(0 0 40px ${ELEMENT_COLORS[combatAnimations.playerSkillEffect.element]})`
                                        : 'drop-shadow(0 0 25px rgba(59,130,246,0.5))',
                                    transition: 'filter 0.2s ease-out'
                                }}
                                onError={(e) => {e.target.src = player.avatar}}
                            />
                            
                            {/* Shadow/Glow under character */}
                            <div 
                                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-28 h-6 rounded-full blur-lg"
                                style={{
                                    backgroundColor: combatAnimations.playerAttacking 
                                        ? 'rgba(234, 179, 8, 0.6)' 
                                        : 'rgba(59, 130, 246, 0.4)',
                                    transform: `translateX(-50%) scale(${combatAnimations.playerAttacking ? 1.5 : 1})`,
                                    transition: 'all 0.3s ease-out'
                                }}
                            />
                            
                            {/* Green selection ring (like Broken Ranks) */}
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-8">
                                <div className="w-full h-full border-2 border-green-500/60 rounded-[50%] animate-pulse" 
                                    style={{ boxShadow: '0 0 15px rgba(34, 197, 94, 0.5)' }}
                                />
                            </div>
                            
                            {/* PASSIVE TRIGGER VISUAL */}
                            {passiveTriggers.length > 0 && (
                              <div className="absolute -top-16 left-1/2 -translate-x-1/2 pointer-events-none z-50 flex flex-col gap-1">
                                {passiveTriggers.map((trigger, idx) => (
                                  <div key={trigger.id} className="flex items-center gap-1 animate-floating-damage" style={{ animationDelay: `${idx * 0.1}s` }}>
                                    <span className="text-2xl drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">{trigger.icon}</span>
                                    <span className="text-sm text-purple-300 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{trigger.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* FLOATING DAMAGE NUMBERS - PLAYER */}
                            <div className="absolute inset-0 pointer-events-none overflow-visible">
                              {floatingDamage.filter(d => d.target === 'player').map((dmg, i) => (
                                <div 
                                  key={dmg.id} 
                                  className={`absolute left-1/2 -translate-x-1/2 font-black whitespace-nowrap z-50 animate-floating-damage ${
                                    dmg.type === 'damage' ? 'text-red-500 text-4xl' : 
                                    dmg.type === 'heal' ? 'text-green-400 text-4xl' : 
                                    dmg.type === 'dodge' ? 'text-cyan-400 text-2xl' : 
                                    dmg.type === 'miss' ? 'text-gray-400 text-2xl' :
                                    dmg.type === 'effect' ? 'text-amber-400 text-2xl' :
                                    'text-yellow-300 text-4xl'
                                  }`}
                                  style={{ 
                                    top: `${-30 - i * 45}px`,
                                    color: dmg.color || undefined,
                                    textShadow: '0 0 20px currentColor, 0 2px 4px rgba(0,0,0,0.9)'
                                  }}
                                >
                                  {dmg.type === 'damage' ? `-${dmg.value}` : dmg.type === 'heal' ? `+${dmg.value}` : dmg.value}
                                </div>
                              ))}
                            </div>
                        </div>

                    {/* ENEMY CHARACTER - RIGHT SIDE */}
                    <div 
                        className="absolute pointer-events-auto"
                        style={{
                            right: '5%',
                            bottom: '200px',
                            zIndex: combatAnimations.enemyAttacking ? 15 : 10,
                            transform: combatAnimations.enemyAttacking 
                                ? 'translateX(-80px) scale(1.1)' 
                                : combatAnimations.enemyHit 
                                ? 'translateX(20px) scale(0.95)'
                                : 'translateX(0) scale(1)',
                            transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                            animation: !combatAnimations.enemyAttacking && !combatAnimations.enemyHit 
                                ? 'idle-breathe 3s ease-in-out infinite 0.5s' 
                                : 'none'
                        }}
                    >
                        <img 
                            src={getMobSprite(combat.mob.id)} 
                            className="h-64 lg:h-80 w-auto object-contain"
                            style={{ 
                                filter: combatAnimations.enemyHit 
                                    ? 'brightness(2) saturate(0.3)' 
                                    : 'drop-shadow(0 0 25px rgba(239,68,68,0.5))',
                                transition: 'filter 0.2s ease-out'
                            }}
                            onError={(e) => {e.target.src = combat.mob.img || "https://via.placeholder.com/200?text=Enemy"}}
                        />
                        
                        {/* Shadow/Glow under character */}
                        <div 
                            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-28 h-6 rounded-full blur-lg"
                                style={{
                                    backgroundColor: combatAnimations.enemyAttacking 
                                        ? 'rgba(234, 88, 12, 0.6)' 
                                        : 'rgba(239, 68, 68, 0.4)',
                                    transform: `translateX(-50%) scale(${combatAnimations.enemyAttacking ? 1.5 : 1})`,
                                    transition: 'all 0.3s ease-out'
                                }}
                            />
                            
                            {/* Red selection ring (enemy) */}
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-8">
                                <div className="w-full h-full border-2 border-red-500/60 rounded-[50%] animate-pulse" 
                                    style={{ boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)' }}
                                />
                            </div>
                            
                            {/* Level badge */}
                            <div className="absolute -top-2 -right-2 bg-gradient-to-br from-red-600 to-red-900 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-red-400 shadow-lg">
                                Lv.{combat.mob.level}
                            </div>
                            
                            {/* FLOATING DAMAGE NUMBERS - ENEMY */}
                            <div className="absolute inset-0 pointer-events-none overflow-visible">
                              {floatingDamage.filter(d => d.target === 'enemy').map((dmg, i) => {
                                const elementIcon = dmg.element ? ELEMENT_ICON_PATHS[dmg.element] : null;
                                const elementColor = dmg.element ? ELEMENT_COLORS[dmg.element] : undefined;
                                
                                return (
                                  <div 
                                    key={dmg.id} 
                                    className={`absolute left-1/2 -translate-x-1/2 font-black whitespace-nowrap z-50 animate-floating-damage flex items-center gap-1 ${
                                      dmg.type === 'crit' ? 'text-5xl' : 
                                      dmg.type === 'damage' ? 'text-4xl' : 
                                      dmg.type === 'miss' ? 'text-gray-400 text-2xl' :
                                      dmg.type === 'effect' ? 'text-orange-400 text-2xl' :
                                      'text-white text-4xl'
                                    }`}
                                    style={{ 
                                      top: `${-30 - i * 45}px`,
                                      color: dmg.color || elementColor || (dmg.type === 'crit' ? '#fbbf24' : '#4ade80'),
                                      textShadow: `0 0 20px ${elementColor || 'currentColor'}, 0 2px 4px rgba(0,0,0,0.9)`
                                    }}
                                  >
                                    {elementIcon && <img src={elementIcon} alt={dmg.element || ''} className="w-8 h-8" />}
                                    {dmg.type === 'crit' ? `${dmg.value}!` : dmg.type === 'damage' ? `-${dmg.value}` : dmg.value}
                                  </div>
                                );
                              })}
                            </div>
                            
                        {/* Enemy effects */}
                        {effectState.mob.effects && effectState.mob.effects.length > 0 && (
                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex gap-1">
                                {effectState.mob.effects.map(e => {
                                    const icons = { burning: '🔥', frozen: '❄️', entangled: '🌿', stunned: '⚡', corrupted: '☠️' };
                                    return <span key={e.id} className="text-2xl animate-bounce drop-shadow-lg">{icons[e.type] || '✨'}</span>;
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ========== BOTTOM - HP BARS (Broken Ranks Style) ========== */}
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 w-full max-w-2xl px-4">
                    <div className="flex items-center gap-4">
                        {/* PLAYER HP */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                {/* Player portrait */}
                                <div className="w-12 h-12 border-2 border-cyan-500/50 rounded-lg overflow-hidden">
                                    <img 
                                        src={player.selectedClass ? getPlayerSprite(player.selectedClass) : player.avatar} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {e.target.src = player.avatar}}
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="text-white font-bold text-xs">{player.name}</span>
                                        <span className="text-green-300 text-[10px]">{combat.playerHp}/{player.maxHp}</span>
                                    </div>
                                    {/* HP Bar */}
                                    <div className="h-4 bg-gray-900 rounded border border-gray-700 overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-green-600 via-green-500 to-lime-400 transition-all duration-300"
                                            style={{width: `${(combat.playerHp/player.maxHp)*100}%`}}
                                        />
                                    </div>
                                    {/* QI Bar */}
                                    <div className="h-2 mt-1 bg-gray-900 rounded border border-gray-700 overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-cyan-600 to-blue-400 transition-all duration-300"
                                            style={{width: `${Math.max(0, Math.min(100, (combat.playerQi/combat.maxPlayerQi)*100))}%`}}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* VS Divider */}
                        <div className="flex flex-col items-center">
                            <span className="text-amber-400 text-2xl font-black drop-shadow-lg">⚔️</span>
                            <span className="text-[9px] text-amber-300/70 font-bold">VS</span>
                        </div>
                        
                        {/* ENEMY HP */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-row-reverse">
                                {/* Enemy portrait */}
                                <div className="w-12 h-12 border-2 border-red-500/50 rounded-lg overflow-hidden">
                                    <img 
                                        src={getMobSprite(combat.mob.id)} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {e.target.src = combat.mob.img}}
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="text-red-300 text-[10px]">{combat.mobHp}/{combat.mob.hp}</span>
                                        <div className="flex items-center gap-1">
                                          <span className="text-white font-bold text-xs">{combat.mob.name}</span>
                                          <span className="text-[9px] text-gray-400">Lv.{combat.mob.level}</span>
                                          {combat.difficulty && (
                                            <span 
                                              className="text-[8px] px-1 rounded font-bold uppercase"
                                              style={{ 
                                                backgroundColor: combat.difficulty.color + '33', 
                                                color: combat.difficulty.color,
                                                border: `1px solid ${combat.difficulty.color}55`
                                              }}
                                            >
                                              {combat.difficulty.label}
                                            </span>
                                          )}
                                        </div>
                                    </div>
                                    {/* HP Bar */}
                                    <div className="h-4 bg-gray-900 rounded border border-gray-700 overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-l from-red-600 via-red-500 to-orange-400 transition-all duration-300"
                                            style={{width: `${(combat.mobHp/combat.mob.hp)*100}%`}}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ========== CENTER ARENA EFFECTS ========== */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Battle Line / Energy Connection */}
                    <div className="absolute w-full h-1 top-1/2 -translate-y-1/2 opacity-30"
                        style={{
                            background: 'linear-gradient(90deg, transparent 10%, rgba(251,191,36,0.3) 30%, rgba(251,191,36,0.8) 50%, rgba(251,191,36,0.3) 70%, transparent 90%)',
                            filter: 'blur(2px)'
                        }}
                    />
                    
                    {/* Central VS Emblem */}
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-900/40 to-red-900/40 border-2 border-amber-500/30 flex items-center justify-center backdrop-blur-sm"
                            style={{ boxShadow: '0 0 40px rgba(251,191,36,0.2), inset 0 0 20px rgba(0,0,0,0.5)' }}>
                            <span className="text-3xl font-black text-amber-400/80 drop-shadow-lg" style={{ textShadow: '0 0 20px rgba(251,191,36,0.5)' }}>⚔️</span>
                        </div>
                        {/* Rotating outer ring */}
                        <div className="absolute inset-0 w-24 h-24 -m-2 rounded-full border border-amber-500/20 animate-spin" style={{ animationDuration: '20s' }} />
                        <div className="absolute inset-0 w-28 h-28 -m-4 rounded-full border border-dashed border-amber-500/10 animate-spin" style={{ animationDuration: '30s', animationDirection: 'reverse' }} />
                    </div>
                    
                    {/* Floating particles */}
                    <div className="absolute inset-0 overflow-hidden">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-1 h-1 bg-amber-400/60 rounded-full animate-float-particle"
                                style={{
                                    left: `${30 + Math.random() * 40}%`,
                                    top: `${30 + Math.random() * 40}%`,
                                    animationDelay: `${i * 0.5}s`,
                                    animationDuration: `${3 + Math.random() * 2}s`
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* ========== WUXIA HOTBAR ========== */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[100]">
                    {/* Outer ornamental frame */}
                    <div className="relative">
                        {/* Left dragon ornament */}
                        <div className="absolute -left-8 top-1/2 -translate-y-1/2 text-3xl opacity-60 drop-shadow-lg" style={{ filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.5))' }}>🐉</div>
                        {/* Right dragon ornament */}
                        <div className="absolute -right-8 top-1/2 -translate-y-1/2 text-3xl opacity-60 drop-shadow-lg transform scale-x-[-1]" style={{ filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.5))' }}>🐉</div>
                        
                        {/* Main hotbar container - scroll/parchment style */}
                        <div 
                            className="relative px-6 py-3"
                            style={{
                                background: 'linear-gradient(180deg, #2a1f14 0%, #1a1308 50%, #2a1f14 100%)',
                                borderTop: '3px solid #8b6914',
                                borderBottom: '3px solid #8b6914',
                                borderLeft: '2px solid #6b5210',
                                borderRight: '2px solid #6b5210',
                                boxShadow: '0 0 30px rgba(0,0,0,0.9), inset 0 0 40px rgba(0,0,0,0.5), 0 0 60px rgba(139,105,20,0.2)',
                                clipPath: 'polygon(2% 0%, 98% 0%, 100% 15%, 100% 85%, 98% 100%, 2% 100%, 0% 85%, 0% 15%)'
                            }}
                        >
                            {/* Top decorative border */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
                            {/* Bottom decorative border */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
                            
                            <div className="flex items-center gap-3">
                                {/* Defense Actions - styled as jade/stone buttons */}
                                <div className="flex items-center gap-1.5">
                                    {[
                                        { key: 'block', img: '/assets/combat/skills/defense/defend.png', cooldown: blockCooldown, label: 'Q', color: '#4fd1c5', desc: 'Reduce incoming damage by 50% this turn. 3 turn cooldown.' },
                                        { key: 'dodge', img: '/assets/combat/skills/defense/dodge.png', cooldown: dodgeCooldown, label: 'W', color: '#63b3ed', desc: 'Attempt to evade the next attack completely. 3 turn cooldown.' },
                                        { key: 'counter', img: '/assets/combat/skills/defense/flee.png', cooldown: counterCooldown, label: 'E', color: '#ed8936', desc: 'Counter-attack for 150% damage if hit this turn. 4 turn cooldown.' }
                                    ].map((def) => {
                                        const isActive = activeDefense === def.key;
                                        const isDisabled = def.cooldown > 0 || activeDefense !== null;
                                        
                                        return (
                                            <button
                                                key={def.key}
                                                onClick={() => activateDefense(def.key as 'block' | 'dodge' | 'counter')}
                                                disabled={isDisabled}
                                                onMouseEnter={(e) => setActionTooltip({ action: def.key, x: e.clientX, y: e.clientY })}
                                                onMouseLeave={() => setActionTooltip({ action: null, x: 0, y: 0 })}
                                                onMouseMove={(e) => actionTooltip.action === def.key && setActionTooltip(t => ({ ...t, x: e.clientX, y: e.clientY }))}
                                                className="relative group"
                                            >
                                                <div 
                                                    className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all overflow-hidden ${
                                                        isActive ? 'scale-110' : def.cooldown > 0 ? 'opacity-40' : 'hover:scale-105 hover:-translate-y-0.5'
                                                    }`}
                                                    style={{
                                                        background: isActive 
                                                            ? `linear-gradient(135deg, ${def.color}40 0%, ${def.color}20 100%)`
                                                            : 'linear-gradient(135deg, #3d3020 0%, #1a1508 100%)',
                                                        border: `2px solid ${isActive ? def.color : '#5c4a1f'}`,
                                                        boxShadow: isActive 
                                                            ? `0 0 20px ${def.color}60, inset 0 0 10px ${def.color}30`
                                                            : 'inset 0 2px 4px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)'
                                                    }}
                                                >
                                                    {def.cooldown > 0 && (
                                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg z-10">
                                                            <span className="text-sm font-bold text-amber-300">{def.cooldown}</span>
                                                        </div>
                                                    )}
                                                    <img src={def.img} alt={def.key} className="w-8 h-8 object-contain drop-shadow-md" />
                                                </div>
                                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-black/80 rounded text-[8px] text-amber-400/80 font-bold border border-amber-900/50">
                                                    {def.label}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                                
                                {/* Ornamental divider */}
                                <div className="flex flex-col items-center gap-0.5 px-1">
                                    <div className="w-[2px] h-3 bg-gradient-to-b from-transparent via-amber-600/60 to-transparent" />
                                    <span className="text-amber-500/60 text-xs">✦</span>
                                    <div className="w-[2px] h-3 bg-gradient-to-b from-transparent via-amber-600/60 to-transparent" />
                                </div>
                                
                                {/* Central Avatar with Yin-Yang style HP/QI */}
                                <div className="relative">
                                    <div 
                                        className="w-16 h-16 rounded-full overflow-hidden"
                                        style={{
                                            border: '3px solid #8b6914',
                                            boxShadow: '0 0 20px rgba(139,105,20,0.5), inset 0 0 15px rgba(0,0,0,0.8)'
                                        }}
                                    >
                                        <img 
                                            src={player.selectedClass ? getPlayerSprite(player.selectedClass) : player.avatar} 
                                            className="w-full h-full object-cover object-top"
                                            onError={(e) => {e.target.src = player.avatar}}
                                        />
                                    </div>
                                    {/* HP Arc */}
                                    <svg className="absolute -inset-1 w-[72px] h-[72px] -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="46" fill="none" stroke="#1a1508" strokeWidth="6" strokeDasharray="144.5 289" strokeLinecap="round" />
                                        <circle cx="50" cy="50" r="46" fill="none" stroke="url(#wuxiaHp)" strokeWidth="6" 
                                            strokeDasharray={`${(combat.playerHp/player.maxHp) * 144.5} 289`} strokeLinecap="round" 
                                            style={{ transition: 'stroke-dasharray 0.3s', filter: 'drop-shadow(0 0 4px #22c55e)' }} />
                                        <defs>
                                            <linearGradient id="wuxiaHp" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#22c55e" />
                                                <stop offset="100%" stopColor="#16a34a" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    {/* QI Arc */}
                                    <svg className="absolute -inset-1 w-[72px] h-[72px] rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="46" fill="none" stroke="#1a1508" strokeWidth="5" strokeDasharray="144.5 289" strokeLinecap="round" />
                                        <circle cx="50" cy="50" r="46" fill="none" stroke="url(#wuxiaQi)" strokeWidth="5" 
                                            strokeDasharray={`${Math.max(0, (combat.playerQi/combat.maxPlayerQi)) * 144.5} 289`} strokeLinecap="round"
                                            style={{ transition: 'stroke-dasharray 0.3s', filter: 'drop-shadow(0 0 4px #0ea5e9)' }} />
                                        <defs>
                                            <linearGradient id="wuxiaQi" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#0ea5e9" />
                                                <stop offset="100%" stopColor="#8b5cf6" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    {/* Values */}
                                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/80 rounded-full px-2 py-0.5 border border-amber-900/50">
                                        <span className="text-[9px] text-green-400 font-bold">{combat.playerHp}</span>
                                        <span className="text-[8px] text-amber-600">·</span>
                                        <span className="text-[9px] text-cyan-400 font-bold">{combat.playerQi}</span>
                                    </div>
                                </div>
                                
                                {/* Ornamental divider */}
                                <div className="flex flex-col items-center gap-0.5 px-1">
                                    <div className="w-[2px] h-3 bg-gradient-to-b from-transparent via-amber-600/60 to-transparent" />
                                    <span className="text-amber-500/60 text-xs">✦</span>
                                    <div className="w-[2px] h-3 bg-gradient-to-b from-transparent via-amber-600/60 to-transparent" />
                                </div>
                                
                                {/* Skills - Martial Arts style */}
                                <div className="flex items-center gap-1.5">
                                    {player.skills.map((sid, idx) => {
                                        const skill = sid ? getSkillById(sid) : null;
                                        const cooldown = player.skillCooldowns?.[sid] || 0;
                                        const isOnCooldown = cooldown > 0;
                                        const hasEnoughQi = skill && combat.playerQi >= skill.qiCost;
                                        const isAvailable = skill && hasEnoughQi && !isOnCooldown;
                                        
                                        const elementColors: Record<string, string> = {
                                            'Fire': '#f97316', 'Ice': '#22d3ee', 'Lightning': '#facc15',
                                            'Wood': '#22c55e', 'Void': '#a855f7', 'None': '#9ca3af'
                                        };
                                        const color = skill ? elementColors[skill.element] || '#9ca3af' : '#4b5563';
                                        
                                        return (
                                            <button 
                                                key={idx}
                                                onClick={() => skill && isAvailable && useSkill(skill.id)}
                                                disabled={!skill || !isAvailable}
                                                onMouseEnter={(e) => skill && setSkillTooltip({ skill, x: e.clientX, y: e.clientY })}
                                                onMouseLeave={() => setSkillTooltip({ skill: null, x: 0, y: 0 })}
                                                onMouseMove={(e) => skillTooltip.skill && setSkillTooltip(s => ({ ...s, x: e.clientX, y: e.clientY }))}
                                                className="relative group"
                                            >
                                                <div 
                                                    className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all overflow-hidden ${
                                                        !skill ? 'opacity-30' : 
                                                        isOnCooldown ? 'opacity-50' :
                                                        !hasEnoughQi ? 'opacity-40 grayscale' : 
                                                        'hover:scale-110 hover:-translate-y-1'
                                                    }`}
                                                    style={{
                                                        background: `linear-gradient(135deg, #3d3020 0%, #1a1508 100%)`,
                                                        border: `2px solid ${isAvailable ? color : '#3d3020'}`,
                                                        boxShadow: isAvailable 
                                                            ? `0 0 15px ${color}40, inset 0 0 8px ${color}20`
                                                            : 'inset 0 2px 4px rgba(0,0,0,0.5)'
                                                    }}
                                                >
                                                    {skill && isOnCooldown && (
                                                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg z-10">
                                                            <span className="text-sm font-bold text-amber-300">{cooldown}</span>
                                                        </div>
                                                    )}
                                                    {skill ? (
                                                        <img 
                                                            src={getSkillIconPath(skill)} 
                                                            alt={skill.name} 
                                                            className="w-9 h-9 object-contain drop-shadow-lg"
                                                            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML += `<span class="text-xl">${skill.icon}</span>`; }}
                                                        />
                                                    ) : (
                                                        <span className="text-xl text-gray-600">·</span>
                                                    )}
                                                </div>
                                                {/* Hotkey */}
                                                <div className="absolute -top-1 -left-1 w-4 h-4 rounded bg-black/80 text-[9px] text-amber-400 font-bold flex items-center justify-center border border-amber-800/50">
                                                    {idx + 1}
                                                </div>
                                                {/* QI Cost */}
                                                {skill && !isOnCooldown && (
                                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-black/80 rounded text-[8px] text-cyan-300 font-bold border border-cyan-900/50">
                                                        {skill.qiCost}
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                
                                {/* Ornamental divider */}
                                <div className="flex flex-col items-center gap-0.5 px-1">
                                    <div className="w-[2px] h-3 bg-gradient-to-b from-transparent via-amber-600/60 to-transparent" />
                                    <span className="text-amber-500/60 text-xs">✦</span>
                                    <div className="w-[2px] h-3 bg-gradient-to-b from-transparent via-amber-600/60 to-transparent" />
                                </div>
                                
                                {/* Flee - styled to match */}
                                <button 
                                    onClick={attemptFlee}
                                    onMouseEnter={(e) => setActionTooltip({ action: 'flee', x: e.clientX, y: e.clientY })}
                                    onMouseLeave={() => setActionTooltip({ action: null, x: 0, y: 0 })}
                                    onMouseMove={(e) => actionTooltip.action === 'flee' && setActionTooltip(t => ({ ...t, x: e.clientX, y: e.clientY }))}
                                    className="relative group"
                                >
                                    <div 
                                        className="w-11 h-11 rounded-lg flex items-center justify-center transition-all hover:scale-105 hover:-translate-y-0.5"
                                        style={{
                                            background: 'linear-gradient(135deg, #4a2020 0%, #2a1010 100%)',
                                            border: '2px solid #dc2626',
                                            boxShadow: '0 0 15px rgba(220,38,38,0.3), inset 0 0 8px rgba(220,38,38,0.2)'
                                        }}
                                    >
                                        <Footprints size={18} className="text-red-400"/>
                                    </div>
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-black/80 rounded text-[8px] text-amber-400/80 font-bold border border-amber-900/50">
                                        R
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {isAvatarModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setAvatarModalOpen(false)}>
                <div className="bg-[#1e293b] p-6 rounded-xl border border-amber-500/30" onClick={e => e.stopPropagation()}>
                    <h2 className="text-center text-amber-500 font-serif font-bold mb-4 uppercase">Select Appearance</h2>
                    <div className="grid grid-cols-3 gap-4">{avatarList.map((url, i) => (<img key={i} src={url} className="w-20 h-20 rounded bg-black object-cover cursor-pointer border-2 border-transparent hover:border-amber-500" onClick={() => { setPlayer(p => ({...p, avatar: url})); setAvatarModalOpen(false); }} onError={(e) => {e.target.style.display='none'}}/>))}</div>
                </div>
            </div>
        )}
        
        {resetConfirmModal.open && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-[#0f1115] border-2 border-amber-500/50 rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl">
              <div className="flex items-center gap-2 mb-4"><AlertTriangle size={20} className="text-amber-500" /><h3 className="text-lg font-bold text-white">Confirm Stats Reset</h3></div>
              <div className="bg-[#151820] p-4 rounded mb-4 border border-white/10 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-400">Current Level:</span><span className="text-white font-bold">{player.level}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Stats Allocated:</span><span className="text-white font-bold">{resetConfirmModal.statsAllocated}</span></div>
                <div className="border-t border-white/10 pt-2 mt-2"><div className="flex justify-between text-sm"><span className="text-gray-400">Reset Cost:</span><span className={player.level <= 9 ? 'text-emerald-400' : resetConfirmModal.hasEnough ? 'text-white' : 'text-red-500'}>{player.level <= 9 ? 'FREE' : `${resetConfirmModal.cost} Spirit Stones`}</span></div>{player.level > 9 && <div className="flex justify-between text-xs text-gray-500 mt-1"><span>Your Balance:</span><span className={resetConfirmModal.hasEnough ? 'text-cyan-400' : 'text-red-500'}>{player.spiritStones} SS</span></div>}</div></div>
              {player.level > 9 && !resetConfirmModal.hasEnough && <div className="bg-red-900/30 border border-red-500/50 rounded p-3 mb-4 text-xs text-red-300">You do not have enough Spirit Stones.</div>}
              <div className="flex gap-3"><button onClick={cancelReset} className="flex-1 px-4 py-2 bg-[#151820] hover:bg-[#1a1d24] border border-white/10 text-white rounded font-bold transition-colors">Cancel</button><button onClick={confirmReset} disabled={player.level > 9 && !resetConfirmModal.hasEnough} className={`flex-1 px-4 py-2 rounded font-bold transition-colors ${player.level <= 9 ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : resetConfirmModal.hasEnough ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}>{player.level <= 9 ? 'Reset (Free)' : 'Confirm Reset'}</button></div>
            </div>
          </div>
        )}
        
        {/* HYBRID CLASS SELECTOR MODAL */}
        {isClassSelectorOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
            <div className="bg-gradient-to-b from-[#0f1115] to-[#0a0c10] border-2 border-amber-500/40 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* HEADER */}
              <div className="sticky top-0 bg-gradient-to-r from-[#0f1115] to-[#1a1d24] border-b-2 border-amber-500/30 px-8 py-6 flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold text-amber-400 mb-1">⚔️ Select Your Martial Path</h2>
                  <p className="text-xs text-gray-400">Choose your cultivation method and stat allocation philosophy</p>
                </div>
                <button onClick={() => setClassSelectorOpen(false)} className="text-gray-400 hover:text-amber-400 transition-colors hover:scale-110">
                  <X size={28} />
                </button>
              </div>
              
              {/* INFO BOX */}
              <div className="px-8 py-6 border-b border-amber-500/20 bg-amber-900/10">
                <div className="flex items-start gap-3 p-4 bg-amber-500/5 rounded-lg border border-amber-500/20">
                  <span className="text-amber-400 text-xl mt-0.5">📌</span>
                  <div>
                    <p className="text-amber-300 font-bold mb-2">How Martial Paths Work</p>
                    <p className="text-gray-300 text-sm">Select a path to define your cultivation identity. Each path recommends a stat allocation strategy using the percentage shown. You maintain full control—manually allocate your AP points to match the recommendation or create your own custom build.</p>
                  </div>
                </div>
              </div>
              
              {/* CLASSES GRID */}
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hybridClassSystem.map(hybridClass => (
                    <div 
                      key={hybridClass.id} 
                      onClick={() => selectHybridClass(hybridClass.id)}
                      className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 group ${
                        player.selectedClass === hybridClass.id 
                          ? 'bg-gradient-to-br from-amber-500/20 to-amber-500/5 border-amber-400 shadow-lg shadow-amber-500/20' 
                          : 'bg-gradient-to-br from-[#151820] to-[#0a0c10] border-white/15 hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-500/10'
                      }`}
                    >
                      {/* CLASS NAME & ROLE */}
                      <div className="mb-4 flex items-start gap-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-xl text-amber-300 mb-1 group-hover:text-amber-200">{hybridClass.name}</h3>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs bg-white/10 px-2.5 py-1 rounded-full border border-white/10 text-gray-300">{hybridClass.weapon}</span>
                            <span className="text-xs bg-white/10 px-2.5 py-1 rounded-full border border-white/10 text-gray-300">{hybridClass.element}</span>
                          </div>
                          <p className="text-sm text-gray-400 italic">{hybridClass.role}</p>
                        </div>
                        <div className="text-4xl flex-shrink-0 mt-1">
                          {hybridClass.id === 1 && '🔥'}
                          {hybridClass.id === 2 && '❄️'}
                          {hybridClass.id === 3 && '✨'}
                          {hybridClass.id === 4 && '☠️'}
                          {hybridClass.id === 5 && '⚡'}
                          {hybridClass.id === 6 && '🛡️'}
                          {hybridClass.id === 7 && '🌿'}
                          {hybridClass.id === 8 && '🐺'}
                          {hybridClass.id === 9 && '🔥'}
                          {hybridClass.id === 10 && '🎵'}
                          {hybridClass.id === 11 && '🌑'}
                          {hybridClass.id === 12 && '💎'}
                        </div>
                      </div>
                      
                      {/* DESCRIPTION */}
                      <p className="text-xs text-gray-300 mb-4 leading-relaxed">{hybridClass.description}</p>
                      
                      {/* PASSIVE */}
                      <div className="mb-4 p-3 bg-black/40 rounded-lg border border-cyan-500/20">
                        <p className="font-bold text-cyan-400 text-sm mb-2">✨ {hybridClass.passive.name}</p>
                        <p className="text-gray-300 text-xs leading-relaxed">{hybridClass.passive.description}</p>
                      </div>
                      
                      {/* STAT ALLOCATION */}
                      <div className="mb-4 p-3 bg-white/5 rounded-lg border border-yellow-500/20">
                        <p className="font-bold text-yellow-400 text-sm mb-3">📊 Recommended Allocation:</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-300">Ox Power</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500" style={{width: `${hybridClass.statTemplate.str}%`}}></div>
                              </div>
                              <span className="text-red-400 font-bold w-8 text-right">{hybridClass.statTemplate.str}%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-300">Wind Walk</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{width: `${hybridClass.statTemplate.dex}%`}}></div>
                              </div>
                              <span className="text-emerald-400 font-bold w-8 text-right">{hybridClass.statTemplate.dex}%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-300">Golden Body</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-yellow-500" style={{width: `${hybridClass.statTemplate.con}%`}}></div>
                              </div>
                              <span className="text-yellow-400 font-bold w-8 text-right">{hybridClass.statTemplate.con}%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-300">Dao Mind</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-500" style={{width: `${hybridClass.statTemplate.spi}%`}}></div>
                              </div>
                              <span className="text-cyan-400 font-bold w-8 text-right">{hybridClass.statTemplate.spi}%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-300">Heart Demon</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500" style={{width: `${hybridClass.statTemplate.wil}%`}}></div>
                              </div>
                              <span className="text-purple-400 font-bold w-8 text-right">{hybridClass.statTemplate.wil}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* DIFFICULTY */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Difficulty:</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          hybridClass.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          hybridClass.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                          'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>{hybridClass.difficulty}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* FOOTER */}
              <div className="border-t-2 border-amber-500/20 px-8 py-6 bg-gradient-to-r from-[#0a0c10] to-[#151820]">
                <div className="flex items-center justify-between">
                  <div>
                    {player.selectedClass ? (
                      <div>
                        <p className="text-sm text-gray-300">
                          <span className="text-emerald-400 font-bold">✅ Path Selected:</span>
                          <span className="text-amber-300 font-bold ml-2">{hybridClassSystem.find(c => c.id === player.selectedClass)?.name}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Allocate your AP points according to the recommended percentages or create a custom build</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">Select a martial path to define your cultivation method</p>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setClassSelectorOpen(false)}
                  className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-amber-500/50"
                >
                  Close Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CRAFTING MODAL */}
        {isCraftingModalOpen && (
          <CraftingModal
            onClose={() => setCraftingModalOpen(false)}
            playerClass={player.selectedClass || 1}
            playerMaterials={player.inventory.reduce((acc, item) => {
              if (item.type === 'material') {
                // Use materialId for material ID matching (e.g., MAT_T1_001)
                const matId = item.materialId || item.id;
                acc[matId] = (acc[matId] || 0) + (item.count || 1);
              }
              return acc;
            }, {} as Record<string, number>)}
            playerSpiritStones={player.spiritStones}
            onCraft={handleCraft}
          />
        )}

        {/* REFORGING MODAL */}
        {isReforgingModalOpen && (
          <ReforgingModal
            onClose={() => {
              setReforgingModalOpen(false);
              setSelectedGearForReforge(null);
            }}
            selectedGear={selectedGearForReforge}
            playerMaterials={player.inventory.reduce((acc, item) => {
              if (item.type === 'material') {
                // Use materialId for material ID matching (e.g., MAT_T1_001)
                const matId = item.materialId || item.id;
                acc[matId] = (acc[matId] || 0) + (item.count || 1);
              }
              return acc;
            }, {} as Record<string, number>)}
            playerSpiritStones={player.spiritStones}
            onReforge={(result) => {
              if (result.success && result.newRarity && selectedGearForReforge) {
                // Upgrade successful - update gear rarity
                const reforgeRecipe = reforgeRecipes.find(r => 
                  r.fromRarity === selectedGearForReforge.rarity && r.toRarity === result.newRarity
                );
                
                if (reforgeRecipe) {
                  setPlayer(p => {
                    let newInv = [...p.inventory];
                    
                    // Consume materials
                    reforgeRecipe.costs.forEach(cost => {
                      const mat = materials.find(m => m.id === cost.materialId);
                      if (mat) {
                        const invItem = newInv.find(i => i.name === mat.name && i.type === 'material');
                        if (invItem) {
                          invItem.count -= cost.quantity;
                          if (invItem.count <= 0) {
                            newInv = newInv.filter(i => i.id !== invItem.id);
                          }
                        }
                      }
                    });
                    
                    // Update gear rarity
                    const gearItem = newInv.find(i => i.id === selectedGearForReforge.id);
                    if (gearItem) {
                      gearItem.rarity = result.newRarity;
                      gearItem.desc = `${result.newRarity} tier ${gearItem.tier || selectedGearForReforge.tier} weapon`;
                    }
                    
                    return {
                      ...p,
                      inventory: newInv,
                      spiritStones: p.spiritStones - reforgeRecipe.spiritStones
                    };
                  });
                }
                
                addLog(result.message, "gold");
              } else if (!result.success && result.destroyed && selectedGearForReforge) {
                // Gear destroyed
                const reforgeRecipe = reforgeRecipes.find(r => r.fromRarity === selectedGearForReforge.rarity);
                
                if (reforgeRecipe) {
                  setPlayer(p => {
                    let newInv = [...p.inventory];
                    
                    // Consume materials
                    reforgeRecipe.costs.forEach(cost => {
                      const mat = materials.find(m => m.id === cost.materialId);
                      if (mat) {
                        const invItem = newInv.find(i => i.name === mat.name && i.type === 'material');
                        if (invItem) {
                          invItem.count -= cost.quantity;
                          if (invItem.count <= 0) {
                            newInv = newInv.filter(i => i.id !== invItem.id);
                          }
                        }
                      }
                    });
                    
                    // Remove gear
                    newInv = newInv.filter(i => i.id !== selectedGearForReforge.id);
                    
                    return {
                      ...p,
                      inventory: newInv,
                      spiritStones: p.spiritStones - reforgeRecipe.spiritStones
                    };
                  });
                }
                
                addLog(result.message, "danger");
              } else if (!result.success && result.newRarity && selectedGearForReforge) {
                // Downgrade
                const reforgeRecipe = reforgeRecipes.find(r => r.fromRarity === selectedGearForReforge.rarity);
                
                if (reforgeRecipe) {
                  setPlayer(p => {
                    let newInv = [...p.inventory];
                    
                    // Consume materials
                    reforgeRecipe.costs.forEach(cost => {
                      const mat = materials.find(m => m.id === cost.materialId);
                      if (mat) {
                        const invItem = newInv.find(i => i.name === mat.name && i.type === 'material');
                        if (invItem) {
                          invItem.count -= cost.quantity;
                          if (invItem.count <= 0) {
                            newInv = newInv.filter(i => i.id !== invItem.id);
                          }
                        }
                      }
                    });
                    
                    // Downgrade gear
                    const gearItem = newInv.find(i => i.id === selectedGearForReforge.id);
                    if (gearItem) {
                      gearItem.rarity = result.newRarity;
                      gearItem.desc = `${result.newRarity} tier ${gearItem.tier || selectedGearForReforge.tier} weapon`;
                    }
                    
                    return {
                      ...p,
                      inventory: newInv,
                      spiritStones: p.spiritStones - reforgeRecipe.spiritStones
                    };
                  });
                }
                
                addLog(result.message, "warning");
              } else if (!result.success) {
                // Keep gear but consume materials
                const reforgeRecipe = reforgeRecipes.find(r => r.fromRarity === selectedGearForReforge?.rarity);
                
                if (reforgeRecipe) {
                  setPlayer(p => {
                    let newInv = [...p.inventory];
                    
                    reforgeRecipe.costs.forEach(cost => {
                      const mat = materials.find(m => m.id === cost.materialId);
                      if (mat) {
                        const invItem = newInv.find(i => i.name === mat.name && i.type === 'material');
                        if (invItem) {
                          invItem.count -= cost.quantity;
                          if (invItem.count <= 0) {
                            newInv = newInv.filter(i => i.id !== invItem.id);
                          }
                        }
                      }
                    });
                    
                    return {
                      ...p,
                      inventory: newInv,
                      spiritStones: p.spiritStones - reforgeRecipe.spiritStones
                    };
                  });
                }
                
                addLog(result.message, "warning");
              }
            }}
          />
        )}

        {/* SALVAGE MODAL */}
        {isSalvageModalOpen && selectedGearForSalvage && (
          <SalvageModal
            onClose={() => {
              setSalvageModalOpen(false);
              setSelectedGearForSalvage(null);
            }}
            selectedItem={selectedGearForSalvage}
            onSalvage={handleSalvage}
          />
        )}

        {/* TITLES MODAL */}
        <TitlesModal
          isOpen={isTitlesModalOpen}
          onClose={() => setTitlesModalOpen(false)}
          titleState={player.titleState || createDefaultTitleState()}
          playerStats={{
            level: player.level,
            totalKills: player.totalKills || 0,
            bossKills: player.bossKills || 0,
            zonesVisited: player.visited?.length || 0,
            totalCrafts: player.totalCrafts || 0,
            itemsCollected: player.itemsCollected || 0,
            totalSpiritStonesEarned: player.totalSpiritStonesEarned || 0,
            deaths: player.deaths || 0,
            immortalCrafts: player.immortalCrafts || 0,
          }}
          onSelectTitle={(titleId) => {
            setPlayer(p => ({
              ...p,
              titleState: {
                ...(p.titleState || createDefaultTitleState()),
                activeTitle: titleId,
              },
            }));
            if (titleId) {
              const title = getTitleById(titleId);
              if (title) {
                addToast(`👑 Title equipped: ${title.name}`, 'success');
              }
            } else {
              addToast(`Title removed`, 'info');
            }
          }}
        />

        {/* MODALS - Outside tab system */}
        {isAvatarModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setAvatarModalOpen(false)}>
                <div className="bg-[#1e293b] p-6 rounded-xl border border-amber-500/30" onClick={e => e.stopPropagation()}>
                    <h2 className="text-center text-amber-500 font-serif font-bold mb-4 uppercase">Select Appearance</h2>
                    <div className="grid grid-cols-3 gap-4">{avatarList.map((url, i) => (<img key={i} src={url} className="w-20 h-20 rounded bg-black object-cover cursor-pointer border-2 border-transparent hover:border-amber-500" onClick={() => { setPlayer(p => ({...p, avatar: url})); setAvatarModalOpen(false); }} onError={(e) => {e.target.style.display='none'}}/>))}</div>
                </div>
            </div>
        )}
        
        {/* Global item tooltip - MUST be last to overlay everything */}
        {hoverItem && <Tooltip hoverItem={hoverItem} mousePos={mousePos} />}
    </div>
  );
};

export default App;