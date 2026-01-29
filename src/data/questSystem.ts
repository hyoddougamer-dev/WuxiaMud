// ============================================
// QUEST SYSTEM CORE - WuxiaMUD
// Comprehensive quest tracking and management
// ============================================

// ============================================
// TYPE DEFINITIONS
// ============================================

export type QuestType = 'main' | 'side' | 'daily' | 'bounty' | 'trial';
export type QuestStatus = 'available' | 'active' | 'completed' | 'failed' | 'locked';
export type ObjectiveType = 'kill' | 'collect' | 'deliver' | 'explore' | 'craft' | 'talk' | 'reach_level' | 'equip' | 'cultivate' | 'special';

export interface QuestObjective {
    id: string;
    type: ObjectiveType;
    description: string;
    target: string | number;      // Mob ID, Item ID, Zone coord, NPC ID, or level number
    required: number;             // How many needed
    current: number;              // Current progress
    optional?: boolean;           // Optional bonus objective
}

export interface QuestRewardItem {
    id?: number;
    itemId?: string;
    quantity: number;
}

export interface QuestReward {
    exp?: number;
    gold?: number;
    spiritStones?: number;
    items?: QuestRewardItem[];
    reputation?: { factionId: string; amount: number }[] | Record<string, number>;
    unlocks?: string[];           // Quest IDs or feature unlocks
    title?: string;               // Title to unlock
}

export interface QuestDialogue {
    npcId: string;
    npcName: string;
    intro: string[];              // Dialogue when accepting quest
    progress: string[];           // Dialogue while quest is active
    complete: string[];           // Dialogue when turning in
}

export interface Quest {
    id: string;
    name: string;
    type: QuestType;
    chapter?: number;             // For main quests
    arc?: string;                 // Story arc name
    description: string;
    shortDesc: string;            // For quest log list
    levelRequired: number;
    levelRecommended?: number;
    prerequisites?: string[];     // Quest IDs that must be completed
    autoAccept?: boolean;         // Automatically accept when available (tutorial)
    objectives: QuestObjective[];
    rewards: QuestReward;
    bonusRewards?: QuestReward;   // For completing optional objectives
    dialogue: QuestDialogue;
    zone?: string;                // Primary zone coordinate
    timeLimit?: number;           // In minutes, for timed quests
    repeatable?: boolean;         // Daily quests are repeatable
    cooldown?: number;            // Hours until can repeat
    nextQuest?: string;           // Next quest in chain
}

export interface PlayerQuestState {
    questId: string;
    status: QuestStatus;
    objectives: { [objectiveId: string]: number };  // Current progress per objective
    startedAt?: number;           // Timestamp
    completedAt?: number;
    failedAt?: number;
    timesCompleted?: number;      // For repeatable quests
    lastCompletedAt?: number;
}

export interface PlayerQuestLog {
    active: PlayerQuestState[];
    completed: string[];          // Just IDs for completed
    failed: string[];
    dailyReset: number;           // Timestamp of last daily reset
}

// ============================================
// NPC DEFINITIONS
// ============================================

export type NPCRole = 'quest_giver' | 'vendor' | 'trainer' | 'elder' | 'guard' | 'villager' | 'boss';

export interface NPC {
    id: string;
    name: string;
    title?: string;
    role: NPCRole[];
    zone: string;                 // Zone coordinate
    avatar: string;
    portrait?: string;            // Emoji or image for dialog
    description: string;
    dialogue: {
        greeting: string[];
        idle: string[];
        farewell: string[];
    };
    quests?: string[];            // Quest IDs this NPC gives
    vendorInventory?: number[];   // Item IDs if vendor
    faction?: string;
}

// ============================================
// REPUTATION SYSTEM
// ============================================

export interface Faction {
    id: string;
    name: string;
    description: string;
    tiers: { name: string; required: number; benefits: string[] }[];
}

export interface PlayerReputation {
    factionId: string;
    amount: number;
    tier: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function createDefaultQuestLog(): PlayerQuestLog {
    return {
        active: [],
        completed: [],
        failed: [],
        dailyReset: Date.now()
    };
}

/**
 * Creates a quest log with the tutorial quest auto-accepted
 * Use this for new characters
 */
export function createQuestLogWithTutorial(tutorialQuestId: string = 'tutorial_001'): PlayerQuestLog {
    const questLog = createDefaultQuestLog();
    
    // Add tutorial quest as active
    const tutorialState: PlayerQuestState = {
        questId: tutorialQuestId,
        status: 'active',
        objectives: {
            'tut_1': 0,
            'tut_2': 0,
            'tut_3': 0,
            'tut_4': 0,
            'tut_5': 0
        },
        startedAt: Date.now()
    };
    
    questLog.active.push(tutorialState);
    
    return questLog;
}

export function getQuestProgress(quest: Quest, state: PlayerQuestState): number {
    if (!quest.objectives.length) return 100;
    
    let totalRequired = 0;
    let totalCurrent = 0;
    
    for (const obj of quest.objectives) {
        if (!obj.optional) {
            totalRequired += obj.required;
            totalCurrent += Math.min(state.objectives[obj.id] || 0, obj.required);
        }
    }
    
    return totalRequired > 0 ? Math.floor((totalCurrent / totalRequired) * 100) : 0;
}

export function isQuestComplete(quest: Quest, state: PlayerQuestState): boolean {
    for (const obj of quest.objectives) {
        if (!obj.optional) {
            const current = state.objectives[obj.id] || 0;
            if (current < obj.required) return false;
        }
    }
    return true;
}

export function hasOptionalObjectives(quest: Quest, state: PlayerQuestState): boolean {
    for (const obj of quest.objectives) {
        if (obj.optional) {
            const current = state.objectives[obj.id] || 0;
            if (current >= obj.required) return true;
        }
    }
    return false;
}

export function canAcceptQuest(
    quest: Quest, 
    playerLevel: number, 
    questLog: PlayerQuestLog,
    allQuests: Quest[]
): { canAccept: boolean; reason?: string } {
    // Check level requirement
    if (playerLevel < quest.levelRequired) {
        return { canAccept: false, reason: `Requires level ${quest.levelRequired}` };
    }
    
    // Check if already active
    if (questLog.active.find(q => q.questId === quest.id)) {
        return { canAccept: false, reason: 'Quest already active' };
    }
    
    // Check if already completed (for non-repeatable quests)
    if (questLog.completed.includes(quest.id) && !quest.repeatable) {
        return { canAccept: false, reason: 'Quest already completed' };
    }
    
    // Check prerequisites
    if (quest.prerequisites) {
        for (const preReqId of quest.prerequisites) {
            if (!questLog.completed.includes(preReqId)) {
                const preReq = allQuests.find(q => q.id === preReqId);
                return { 
                    canAccept: false, 
                    reason: `Complete "${preReq?.name || preReqId}" first` 
                };
            }
        }
    }
    
    // Check cooldown for repeatable quests
    if (quest.repeatable && questLog.completed.includes(quest.id)) {
        // Find when it was last completed - check active states for lastCompletedAt
        const existingState = questLog.active.find(q => q.questId === quest.id);
        if (existingState?.lastCompletedAt && quest.cooldown) {
            const hoursElapsed = (Date.now() - existingState.lastCompletedAt) / (1000 * 60 * 60);
            if (hoursElapsed < quest.cooldown) {
                const remaining = Math.ceil(quest.cooldown - hoursElapsed);
                return { canAccept: false, reason: `Available in ${remaining}h` };
            }
        }
    }
    
    return { canAccept: true };
}

// Result type for quest operations
export interface QuestOperationResult {
    success: boolean;
    questLog?: PlayerQuestLog;
    rewards?: QuestReward;
    message: string;
}

export function startQuest(
    questId: string, 
    questLog: PlayerQuestLog, 
    player: { level: number },
    questList?: Quest[]
): QuestOperationResult {
    // Import allQuests lazily to avoid circular dependency
    const getQuests = () => {
        if (questList) return questList;
        // Dynamic import fallback - but we should get questList passed in
        return [];
    };
    
    const allQuestsList = getQuests();
    const quest = allQuestsList.find(q => q.id === questId);
    
    if (!quest) {
        return { success: false, message: 'Quest not found.' };
    }
    
    // Check if can accept
    const check = canAcceptQuest(quest, player.level, questLog, allQuestsList);
    if (!check.canAccept) {
        return { success: false, message: check.reason || 'Cannot accept quest.' };
    }
    
    const state: PlayerQuestState = {
        questId: quest.id,
        status: 'active',
        objectives: {},
        startedAt: Date.now()
    };
    
    // Initialize objectives - check if already satisfied
    for (const obj of quest.objectives) {
        // Check reach_level objectives against current player level
        if (obj.type === 'reach_level' && typeof obj.target === 'number') {
            if (player.level >= obj.target) {
                state.objectives[obj.id] = obj.required; // Already satisfied!
            } else {
                state.objectives[obj.id] = 0;
            }
        } else {
            state.objectives[obj.id] = 0;
        }
    }
    
    // Clone the questLog to avoid mutation issues
    const newQuestLog: PlayerQuestLog = {
        ...questLog,
        active: [...questLog.active, state],
        completed: [...questLog.completed],
        failed: [...questLog.failed]
    };
    
    return { 
        success: true, 
        questLog: newQuestLog, 
        message: `Quest "${quest.name}" accepted!` 
    };
}

export function updateQuestObjective(
    questLog: PlayerQuestLog,
    questId: string,
    objectiveId: string,
    amount: number = 1
): boolean {
    const state = questLog.active.find(q => q.questId === questId);
    if (!state) return false;
    
    state.objectives[objectiveId] = (state.objectives[objectiveId] || 0) + amount;
    return true;
}

export function completeQuest(
    questId: string,
    questLog: PlayerQuestLog,
    player: { level: number },
    questList: Quest[]
): QuestOperationResult {
    const quest = questList.find(q => q.id === questId);
    
    if (!quest) {
        return { success: false, message: 'Quest not found.' };
    }
    
    const stateIndex = questLog.active.findIndex(q => q.questId === quest.id);
    if (stateIndex === -1) {
        return { success: false, message: 'Quest not active.' };
    }
    
    const state = questLog.active[stateIndex];
    
    if (!isQuestComplete(quest, state)) {
        return { success: false, message: 'Quest objectives not complete.' };
    }
    
    // Update state
    state.status = 'completed';
    state.completedAt = Date.now();
    
    if (quest.repeatable) {
        state.timesCompleted = (state.timesCompleted || 0) + 1;
        state.lastCompletedAt = Date.now();
    }
    
    // Clone and update questLog
    const newActive = [...questLog.active];
    newActive.splice(stateIndex, 1);
    
    const newCompleted = questLog.completed.includes(quest.id) 
        ? [...questLog.completed]
        : [...questLog.completed, quest.id];
    
    const newQuestLog: PlayerQuestLog = {
        ...questLog,
        active: newActive,
        completed: newCompleted,
        failed: [...questLog.failed]
    };
    
    // Calculate rewards (including bonus if applicable)
    const rewards: QuestReward = { ...quest.rewards };
    
    if (quest.bonusRewards && hasOptionalObjectives(quest, state)) {
        if (quest.bonusRewards.exp) rewards.exp = (rewards.exp || 0) + quest.bonusRewards.exp;
        if (quest.bonusRewards.gold) rewards.gold = (rewards.gold || 0) + quest.bonusRewards.gold;
        if (quest.bonusRewards.items) {
            rewards.items = [...(rewards.items || []), ...quest.bonusRewards.items] as QuestRewardItem[];
        }
    }
    
    return { 
        success: true, 
        questLog: newQuestLog, 
        rewards,
        message: `Quest "${quest.name}" completed!` 
    };
}

export function failQuest(questId: string, questLog: PlayerQuestLog): void {
    const stateIndex = questLog.active.findIndex(q => q.questId === questId);
    if (stateIndex === -1) return;
    
    const state = questLog.active[stateIndex];
    state.status = 'failed';
    state.failedAt = Date.now();
    
    questLog.active.splice(stateIndex, 1);
    if (!questLog.failed.includes(questId)) {
        questLog.failed.push(questId);
    }
}

export function abandonQuest(questId: string, questLog: PlayerQuestLog): PlayerQuestLog {
    const stateIndex = questLog.active.findIndex(q => q.questId === questId);
    if (stateIndex !== -1) {
        const newActive = [...questLog.active];
        newActive.splice(stateIndex, 1);
        return {
            ...questLog,
            active: newActive,
            completed: [...questLog.completed],
            failed: [...questLog.failed]
        };
    }
    return questLog;
}

// ============================================
// QUEST TRACKING HELPERS
// For combat/collection events
// ============================================

export function onMobKilled(
    mobId: number,
    questLog: PlayerQuestLog,
    allQuests: Quest[]
): { questId: string; objectiveId: string; newProgress: number }[] {
    const updates: { questId: string; objectiveId: string; newProgress: number }[] = [];
    
    for (const state of questLog.active) {
        const quest = allQuests.find(q => q.id === state.questId);
        if (!quest) continue;
        
        for (const obj of quest.objectives) {
            if (obj.type === 'kill' && obj.target === mobId) {
                const current = state.objectives[obj.id] || 0;
                if (current < obj.required) {
                    state.objectives[obj.id] = current + 1;
                    updates.push({
                        questId: quest.id,
                        objectiveId: obj.id,
                        newProgress: current + 1
                    });
                }
            }
        }
    }
    
    return updates;
}

export function onItemCollected(
    itemId: string | number,
    questLog: PlayerQuestLog,
    allQuests: Quest[]
): { questId: string; objectiveId: string; newProgress: number }[] {
    const updates: { questId: string; objectiveId: string; newProgress: number }[] = [];
    
    for (const state of questLog.active) {
        const quest = allQuests.find(q => q.id === state.questId);
        if (!quest) continue;
        
        for (const obj of quest.objectives) {
            if (obj.type === 'collect' && obj.target === itemId) {
                const current = state.objectives[obj.id] || 0;
                if (current < obj.required) {
                    state.objectives[obj.id] = current + 1;
                    updates.push({
                        questId: quest.id,
                        objectiveId: obj.id,
                        newProgress: current + 1
                    });
                }
            }
        }
    }
    
    return updates;
}

export function onZoneEntered(
    zoneCoord: string,
    questLog: PlayerQuestLog,
    allQuests: Quest[]
): { questId: string; objectiveId: string }[] {
    const updates: { questId: string; objectiveId: string }[] = [];
    
    for (const state of questLog.active) {
        const quest = allQuests.find(q => q.id === state.questId);
        if (!quest) continue;
        
        for (const obj of quest.objectives) {
            if (obj.type === 'explore' && obj.target === zoneCoord) {
                const current = state.objectives[obj.id] || 0;
                if (current < obj.required) {
                    state.objectives[obj.id] = 1;
                    updates.push({
                        questId: quest.id,
                        objectiveId: obj.id
                    });
                }
            }
        }
    }
    
    return updates;
}

/**
 * Handle special quest objectives (tutorial actions like viewing tabs, using items)
 * @param actionId - The action performed (e.g., 'view_character', 'check_gear', 'visit_forge', 'use_consumable')
 */
export function onSpecialAction(
    actionId: string,
    questLog: PlayerQuestLog,
    allQuests: Quest[]
): { questId: string; objectiveId: string; newProgress: number }[] {
    const updates: { questId: string; objectiveId: string; newProgress: number }[] = [];
    
    for (const state of questLog.active) {
        const quest = allQuests.find(q => q.id === state.questId);
        if (!quest) continue;
        
        for (const obj of quest.objectives) {
            if (obj.type === 'special' && obj.target === actionId) {
                const current = state.objectives[obj.id] || 0;
                if (current < obj.required) {
                    updates.push({
                        questId: quest.id,
                        objectiveId: obj.id,
                        newProgress: current + 1
                    });
                }
            }
        }
    }
    
    return updates;
}

export function onNPCTalk(
    npcId: string,
    questLog: PlayerQuestLog,
    allQuests: Quest[]
): { questId: string; objectiveId: string; newProgress: number }[] {
    const updates: { questId: string; objectiveId: string; newProgress: number }[] = [];
    
    for (const state of questLog.active) {
        const quest = allQuests.find(q => q.id === state.questId);
        if (!quest) continue;
        
        for (const obj of quest.objectives) {
            if (obj.type === 'talk' && obj.target === npcId) {
                const current = state.objectives[obj.id] || 0;
                if (current < obj.required) {
                    // Don't mutate - just return what the new progress would be
                    updates.push({
                        questId: quest.id,
                        objectiveId: obj.id,
                        newProgress: current + 1
                    });
                }
            }
        }
    }
    
    return updates;
}

export function onLevelUp(
    newLevel: number,
    questLog: PlayerQuestLog,
    allQuests: Quest[]
): { questId: string; objectiveId: string }[] {
    const updates: { questId: string; objectiveId: string }[] = [];
    
    for (const state of questLog.active) {
        const quest = allQuests.find(q => q.id === state.questId);
        if (!quest) continue;
        
        for (const obj of quest.objectives) {
            if (obj.type === 'reach_level' && typeof obj.target === 'number') {
                if (newLevel >= obj.target) {
                    state.objectives[obj.id] = obj.required;
                    updates.push({
                        questId: quest.id,
                        objectiveId: obj.id
                    });
                }
            }
        }
    }
    
    return updates;
}

/**
 * Sync all reach_level objectives with current player level.
 * Call this on game load or periodically to fix quests that were 
 * accepted before the player reached the required level.
 */
export function syncLevelObjectives(
    playerLevel: number,
    questLog: PlayerQuestLog,
    allQuests: Quest[]
): void {
    for (const state of questLog.active) {
        const quest = allQuests.find(q => q.id === state.questId);
        if (!quest) continue;
        
        for (const obj of quest.objectives) {
            if (obj.type === 'reach_level' && typeof obj.target === 'number') {
                if (playerLevel >= obj.target) {
                    state.objectives[obj.id] = obj.required;
                }
            }
        }
    }
}

// ============================================
// DAILY QUEST SYSTEM
// ============================================

export function shouldResetDailies(questLog: PlayerQuestLog): boolean {
    const now = new Date();
    const lastReset = new Date(questLog.dailyReset);
    
    // Reset at midnight UTC
    const todayMidnight = new Date(now);
    todayMidnight.setUTCHours(0, 0, 0, 0);
    
    return lastReset < todayMidnight;
}

export function resetDailyQuests(questLog: PlayerQuestLog): void {
    // Remove daily quests from completed to allow re-acceptance
    questLog.completed = questLog.completed.filter(id => !id.startsWith('daily_'));
    questLog.dailyReset = Date.now();
}

// ============================================
// REPUTATION HELPERS
// ============================================

export function getReputationTier(faction: Faction, amount: number): number {
    for (let i = faction.tiers.length - 1; i >= 0; i--) {
        if (amount >= faction.tiers[i].required) {
            return i;
        }
    }
    return 0;
}

export function getReputationTierName(faction: Faction, amount: number): string {
    const tier = getReputationTier(faction, amount);
    return faction.tiers[tier]?.name || 'Unknown';
}
