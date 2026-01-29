// Bestiary Rewards System
// Defines all milestones, rewards, and helper functions

import { mobDefinitions } from './constants';
import { mobDropConfigs } from './dropSystem';

// ============================================
// MILESTONE DEFINITIONS
// ============================================

// Individual Mob Kill Milestones
export const mobKillMilestones = [
  { kills: 25, reward: { type: 'stones', amount: 'level-based' }, label: 'Spirit Stones' },
  { kills: 100, reward: { type: 'material', amount: 1 }, label: 'Guaranteed Material' },
  { kills: 250, reward: { type: 'damage_bonus', amount: 2 }, label: '+2% damage vs this mob' },
  { kills: 1000, reward: { type: 'damage_bonus', amount: 3, title: true }, label: '+3% damage + "[Mob] Hunter" title' },
  { kills: 5000, reward: { type: 'damage_bonus', amount: 5 }, label: '+5% damage total' },
  { kills: 10000, reward: { type: 'title_legendary' }, label: '"Bane of [Mob]" legendary title' },
] as const;

// Discovery Milestones (unique mobs killed at least once)
export const discoveryMilestones = [
  { count: 10, reward: { type: 'drop_rate', amount: 1 }, label: '+1% Drop Rate' },
  { count: 20, reward: { type: 'exp_bonus', amount: 1 }, label: '+1% EXP' },
  { count: 30, reward: { type: 'title', name: 'Beast Scholar' }, label: '"Beast Scholar" title' },
  { count: 40, reward: { type: 'atk_bonus', amount: 1 }, label: '+1% ATK' },
  { count: 44, reward: { type: 'title_stones', name: 'Bestiary Master', stones: 500 }, label: '"Bestiary Master" + 500 Stones' },
] as const;

// Realm Mastery (500 kills on EACH mob of realm)
export const realmMasteryMilestones = {
  qi: { 
    name: 'Qi Condensation',
    killsRequired: 500, 
    mobCount: 20, // mobs level 1-9
    reward: { type: 'realm_exp', amount: 3 },
    label: '+3% EXP from Qi mobs'
  },
  foundation: { 
    name: 'Foundation Establishment',
    killsRequired: 500, 
    mobCount: 16, // mobs level 10-19
    reward: { type: 'realm_stones', amount: 3 },
    label: '+3% Stones from Foundation mobs'
  },
  golden: { 
    name: 'Golden Core',
    killsRequired: 500, 
    mobCount: 8, // mobs level 20+
    reward: { type: 'realm_drop', amount: 2 },
    label: '+2% Drop Rate from Golden Core mobs'
  },
  apex: {
    name: 'Apex Predator',
    killsRequired: 500,
    mobCount: 44, // all mobs
    reward: { type: 'title_stones', name: 'Apex Predator', stones: 1000 },
    label: '"Apex Predator" title + 1000 Stones'
  }
} as const;

// Tag Mastery Milestones
export const tagMasteryMilestones = {
  beast: {
    name: 'Beast',
    icon: '🐺',
    milestones: [
      { kills: 2000, reward: { type: 'tag_atk', amount: 2 }, label: '+2% ATK vs Beasts' },
      { kills: 10000, reward: { type: 'tag_atk', amount: 3 }, label: '+3% ATK vs Beasts (total)' },
    ]
  },
  human: {
    name: 'Human',
    icon: '👤',
    milestones: [
      { kills: 2000, reward: { type: 'tag_def', amount: 2 }, label: '+2% DEF vs Humans' },
      { kills: 10000, reward: { type: 'tag_def', amount: 3 }, label: '+3% DEF vs Humans (total)' },
    ]
  },
  demon: {
    name: 'Demon',
    icon: '👹',
    milestones: [
      { kills: 2000, reward: { type: 'tag_crit', amount: 1 }, label: '+1% Crit vs Demons' },
      { kills: 10000, reward: { type: 'tag_crit', amount: 2 }, label: '+2% Crit vs Demons (total)' },
    ]
  },
  undead: {
    name: 'Undead',
    icon: '💀',
    milestones: [
      { kills: 2000, reward: { type: 'flat_hp', amount: 50 }, label: '+50 HP' },
      { kills: 10000, reward: { type: 'flat_hp', amount: 100 }, label: '+100 HP (total)' },
    ]
  },
  spirit: {
    name: 'Spirit',
    icon: '👻',
    milestones: [
      { kills: 2000, reward: { type: 'cultivation', amount: 2 }, label: '+2% Cultivation Speed' },
      { kills: 10000, reward: { type: 'cultivation', amount: 3 }, label: '+3% Cultivation Speed (total)' },
    ]
  },
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get realm from mob level
export const getMobRealm = (level: number): 'qi' | 'foundation' | 'golden' => {
  if (level <= 9) return 'qi';
  if (level <= 19) return 'foundation';
  return 'golden';
};

// Get mobs by realm
export const getMobsByRealm = (realm: 'qi' | 'foundation' | 'golden') => {
  return mobDefinitions.filter(m => getMobRealm(m.level) === realm);
};

// Get mob tags
export const getMobTags = (mobId: number): string[] => {
  return mobDropConfigs[mobId]?.tags || [];
};

// Calculate discovered mobs count
export const getDiscoveredCount = (killCounter: Record<number, number>): number => {
  return Object.keys(killCounter).filter(k => killCounter[parseInt(k)] > 0).length;
};

// Calculate total kills for a tag
export const getTagKills = (killCounter: Record<number, number>, tag: string): number => {
  let total = 0;
  Object.entries(killCounter).forEach(([mobIdStr, kills]) => {
    const mobId = parseInt(mobIdStr);
    const tags = getMobTags(mobId);
    if (tags.includes(tag)) {
      total += kills;
    }
  });
  return total;
};

// Get mobs with mastery complete (500+ kills) for a realm
export const getRealmMasteryProgress = (
  killCounter: Record<number, number>, 
  realm: 'qi' | 'foundation' | 'golden'
): { complete: number; total: number } => {
  const realmMobs = getMobsByRealm(realm);
  const complete = realmMobs.filter(m => (killCounter[m.id] || 0) >= 500).length;
  return { complete, total: realmMobs.length };
};

// Get next milestone for a mob
export const getNextMobMilestone = (kills: number): typeof mobKillMilestones[number] | null => {
  return mobKillMilestones.find(m => kills < m.kills) || null;
};

// Get next discovery milestone
export const getNextDiscoveryMilestone = (discovered: number): typeof discoveryMilestones[number] | null => {
  return discoveryMilestones.find(m => discovered < m.count) || null;
};

// Calculate stone reward based on mob level
export const calculateStoneReward = (mobLevel: number): number => {
  return 20 + (mobLevel * 4); // 20-100 based on level
};

// ============================================
// BONUS CALCULATORS
// ============================================

export interface BestiaryBonuses {
  globalDropRate: number;
  globalExpBonus: number;
  globalAtkBonus: number;
  flatHpBonus: number;
  cultivationBonus: number;
  realmExpBonus: Record<string, number>;
  realmStonesBonus: Record<string, number>;
  realmDropBonus: Record<string, number>;
  mobDamageBonus: Record<number, number>;
  tagAtkBonus: Record<string, number>;
  tagDefBonus: Record<string, number>;
  tagCritBonus: Record<string, number>;
  titles: string[];
}

export const calculateBestiaryBonuses = (
  killCounter: Record<number, number>,
  claimedDiscovery: number[],
  claimedMobMilestones: Record<number, number[]>,
  claimedRealmMastery: string[],
  claimedTagMastery: Record<string, number[]>
): BestiaryBonuses => {
  const bonuses: BestiaryBonuses = {
    globalDropRate: 0,
    globalExpBonus: 0,
    globalAtkBonus: 0,
    flatHpBonus: 0,
    cultivationBonus: 0,
    realmExpBonus: {},
    realmStonesBonus: {},
    realmDropBonus: {},
    mobDamageBonus: {},
    tagAtkBonus: {},
    tagDefBonus: {},
    tagCritBonus: {},
    titles: [],
  };

  // Discovery bonuses
  claimedDiscovery.forEach(milestone => {
    const def = discoveryMilestones.find(m => m.count === milestone);
    if (!def) return;
    
    if (def.reward.type === 'drop_rate') bonuses.globalDropRate += def.reward.amount;
    if (def.reward.type === 'exp_bonus') bonuses.globalExpBonus += def.reward.amount;
    if (def.reward.type === 'atk_bonus') bonuses.globalAtkBonus += def.reward.amount;
    if (def.reward.type === 'title') bonuses.titles.push(def.reward.name);
    if (def.reward.type === 'title_stones') bonuses.titles.push(def.reward.name);
  });

  // Mob damage bonuses (cumulative up to 5%)
  Object.entries(claimedMobMilestones).forEach(([mobIdStr, milestones]) => {
    const mobId = parseInt(mobIdStr);
    let totalBonus = 0;
    milestones.forEach(kills => {
      const def = mobKillMilestones.find(m => m.kills === kills);
      if (def?.reward.type === 'damage_bonus') {
        totalBonus = def.reward.amount; // Use highest, not cumulative
      }
      if (def?.reward.type === 'title_legendary') {
        const mob = mobDefinitions.find(m => m.id === mobId);
        if (mob) bonuses.titles.push(`Bane of ${mob.name}`);
      }
    });
    if (totalBonus > 0) {
      bonuses.mobDamageBonus[mobId] = Math.min(totalBonus, 5);
    }
  });

  // Realm mastery bonuses
  claimedRealmMastery.forEach(realm => {
    const def = realmMasteryMilestones[realm as keyof typeof realmMasteryMilestones];
    if (!def) return;
    
    if (def.reward.type === 'realm_exp') bonuses.realmExpBonus[realm] = def.reward.amount;
    if (def.reward.type === 'realm_stones') bonuses.realmStonesBonus[realm] = def.reward.amount;
    if (def.reward.type === 'realm_drop') bonuses.realmDropBonus[realm] = def.reward.amount;
    if (def.reward.type === 'title_stones') bonuses.titles.push(def.reward.name);
  });

  // Tag mastery bonuses
  Object.entries(claimedTagMastery).forEach(([tag, milestones]) => {
    const tagDef = tagMasteryMilestones[tag as keyof typeof tagMasteryMilestones];
    if (!tagDef) return;

    milestones.forEach(kills => {
      const def = tagDef.milestones.find(m => m.kills === kills);
      if (!def) return;

      if (def.reward.type === 'tag_atk') bonuses.tagAtkBonus[tag] = def.reward.amount;
      if (def.reward.type === 'tag_def') bonuses.tagDefBonus[tag] = def.reward.amount;
      if (def.reward.type === 'tag_crit') bonuses.tagCritBonus[tag] = def.reward.amount;
      if (def.reward.type === 'flat_hp') bonuses.flatHpBonus = def.reward.amount;
      if (def.reward.type === 'cultivation') bonuses.cultivationBonus = def.reward.amount;
    });
  });

  return bonuses;
};

// ============================================
// CLAIMABLE REWARDS CHECKER
// ============================================

export interface ClaimableReward {
  type: 'discovery' | 'mob' | 'realm' | 'tag';
  milestone: number;
  mobId?: number;
  realm?: string;
  tag?: string;
  label: string;
  reward: any;
}

export const getClaimableRewards = (
  killCounter: Record<number, number>,
  claimedDiscovery: number[],
  claimedMobMilestones: Record<number, number[]>,
  claimedRealmMastery: string[],
  claimedTagMastery: Record<string, number[]>
): ClaimableReward[] => {
  const claimable: ClaimableReward[] = [];
  const discovered = getDiscoveredCount(killCounter);

  // Check discovery milestones
  discoveryMilestones.forEach(m => {
    if (discovered >= m.count && !claimedDiscovery.includes(m.count)) {
      claimable.push({
        type: 'discovery',
        milestone: m.count,
        label: m.label,
        reward: m.reward,
      });
    }
  });

  // Check mob milestones
  Object.entries(killCounter).forEach(([mobIdStr, kills]) => {
    const mobId = parseInt(mobIdStr);
    const claimed = claimedMobMilestones[mobId] || [];
    const mob = mobDefinitions.find(m => m.id === mobId);
    
    mobKillMilestones.forEach(m => {
      if (kills >= m.kills && !claimed.includes(m.kills)) {
        claimable.push({
          type: 'mob',
          milestone: m.kills,
          mobId,
          label: mob ? `${mob.name}: ${m.label}` : m.label,
          reward: m.reward,
        });
      }
    });
  });

  // Check realm mastery
  (['qi', 'foundation', 'golden'] as const).forEach(realm => {
    if (claimedRealmMastery.includes(realm)) return;
    const progress = getRealmMasteryProgress(killCounter, realm);
    if (progress.complete >= progress.total) {
      const def = realmMasteryMilestones[realm];
      claimable.push({
        type: 'realm',
        milestone: 500,
        realm,
        label: `${def.name} Mastery: ${def.label}`,
        reward: def.reward,
      });
    }
  });

  // Check apex mastery (all realms complete)
  if (!claimedRealmMastery.includes('apex')) {
    const allComplete = (['qi', 'foundation', 'golden'] as const).every(realm => {
      const progress = getRealmMasteryProgress(killCounter, realm);
      return progress.complete >= progress.total;
    });
    if (allComplete) {
      claimable.push({
        type: 'realm',
        milestone: 500,
        realm: 'apex',
        label: realmMasteryMilestones.apex.label,
        reward: realmMasteryMilestones.apex.reward,
      });
    }
  }

  // Check tag mastery
  Object.entries(tagMasteryMilestones).forEach(([tag, tagDef]) => {
    const tagKills = getTagKills(killCounter, tag);
    const claimed = claimedTagMastery[tag] || [];
    
    tagDef.milestones.forEach(m => {
      if (tagKills >= m.kills && !claimed.includes(m.kills)) {
        claimable.push({
          type: 'tag',
          milestone: m.kills,
          tag,
          label: `${tagDef.icon} ${tagDef.name}: ${m.label}`,
          reward: m.reward,
        });
      }
    });
  });

  return claimable;
};
