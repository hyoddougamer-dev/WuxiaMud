// ============================================
// CULTIVATION SYSTEM - Daily Rewards & Milestones
// Replaces the unused Map tab
// ============================================

export interface DailyReward {
  day: number;
  rewards: {
    spiritStones?: number;
    items?: { itemId: string; quantity: number }[];
    exp?: number;
    title?: string;
  };
  isMilestone: boolean;
}

export interface CultivationMilestone {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  requirement: {
    type: 'level' | 'kills' | 'quests' | 'realm' | 'days_logged' | 'spirit_stones' | 'crafts';
    target: number | string;
  };
  rewards: {
    spiritStones?: number;
    items?: { itemId: string; quantity: number }[];
    exp?: number;
    title?: string;
    ap?: number;
  };
  icon: string;
}

export interface CultivationProgress {
  lastLoginDate: string; // ISO date string
  consecutiveLogins: number;
  totalLogins: number;
  claimedDailyRewards: number[]; // Day numbers claimed
  claimedMilestones: string[]; // Milestone IDs claimed
  cultivationPoints: number; // Bonus currency for this system
}

// ============================================
// DAILY LOGIN REWARDS (28-day cycle)
// BOOSTED rewards to incentivize daily logins
// ============================================

export const DAILY_REWARDS: DailyReward[] = [
  // Week 1 - Getting Started (generous to hook players)
  { day: 1, rewards: { spiritStones: 200, exp: 500, items: [{ itemId: 'CONS_HP_001', quantity: 10 }] }, isMilestone: false },
  { day: 2, rewards: { spiritStones: 300, exp: 750, items: [{ itemId: 'CONS_QI_001', quantity: 10 }] }, isMilestone: false },
  { day: 3, rewards: { spiritStones: 400, exp: 1000, items: [{ itemId: 'MAT_SWORD_001', quantity: 2 }] }, isMilestone: false },
  { day: 4, rewards: { spiritStones: 500, exp: 1500 }, isMilestone: false },
  { day: 5, rewards: { spiritStones: 600, exp: 2000, items: [{ itemId: 'CONS_HP_001', quantity: 15 }, { itemId: 'CONS_QI_001', quantity: 10 }] }, isMilestone: false },
  { day: 6, rewards: { spiritStones: 750, exp: 2500, items: [{ itemId: 'MAT_SABER_001', quantity: 2 }] }, isMilestone: false },
  { day: 7, rewards: { spiritStones: 2000, exp: 5000, items: [{ itemId: 'SW_T1_001', quantity: 1 }], title: 'Dedicated Disciple' }, isMilestone: true },
  
  // Week 2 - Building Momentum
  { day: 8, rewards: { spiritStones: 400, exp: 1000, items: [{ itemId: 'CONS_HP_001', quantity: 15 }] }, isMilestone: false },
  { day: 9, rewards: { spiritStones: 500, exp: 1500, items: [{ itemId: 'MAT_ZITHER_001', quantity: 2 }] }, isMilestone: false },
  { day: 10, rewards: { spiritStones: 600, exp: 2000, items: [{ itemId: 'CONS_QI_001', quantity: 15 }] }, isMilestone: false },
  { day: 11, rewards: { spiritStones: 750, exp: 2500 }, isMilestone: false },
  { day: 12, rewards: { spiritStones: 900, exp: 3000, items: [{ itemId: 'CONS_HP_001', quantity: 20 }] }, isMilestone: false },
  { day: 13, rewards: { spiritStones: 1000, exp: 3500, items: [{ itemId: 'MAT_SWORD_001', quantity: 3 }] }, isMilestone: false },
  { day: 14, rewards: { spiritStones: 3000, exp: 7500, items: [{ itemId: 'SW_T2_001', quantity: 1 }], title: 'Persistent Cultivator' }, isMilestone: true },
  
  // Week 3 - Serious Commitment  
  { day: 15, rewards: { spiritStones: 600, exp: 2000, items: [{ itemId: 'CONS_HP_001', quantity: 20 }] }, isMilestone: false },
  { day: 16, rewards: { spiritStones: 750, exp: 2500, items: [{ itemId: 'MAT_SABER_001', quantity: 3 }] }, isMilestone: false },
  { day: 17, rewards: { spiritStones: 900, exp: 3000, items: [{ itemId: 'CONS_QI_001', quantity: 20 }] }, isMilestone: false },
  { day: 18, rewards: { spiritStones: 1000, exp: 3500 }, isMilestone: false },
  { day: 19, rewards: { spiritStones: 1200, exp: 4000, items: [{ itemId: 'CONS_HP_001', quantity: 25 }] }, isMilestone: false },
  { day: 20, rewards: { spiritStones: 1500, exp: 4500, items: [{ itemId: 'MAT_ZITHER_001', quantity: 3 }] }, isMilestone: false },
  { day: 21, rewards: { spiritStones: 5000, exp: 10000, items: [{ itemId: 'SW_T2_002', quantity: 1 }], title: 'Unwavering Path' }, isMilestone: true },
  
  // Week 4 - True Dedication (best rewards)
  { day: 22, rewards: { spiritStones: 1000, exp: 3000, items: [{ itemId: 'CONS_HP_001', quantity: 25 }, { itemId: 'CONS_QI_001', quantity: 20 }] }, isMilestone: false },
  { day: 23, rewards: { spiritStones: 1250, exp: 4000, items: [{ itemId: 'MAT_SWORD_001', quantity: 5 }] }, isMilestone: false },
  { day: 24, rewards: { spiritStones: 1500, exp: 5000, items: [{ itemId: 'MAT_SABER_001', quantity: 5 }] }, isMilestone: false },
  { day: 25, rewards: { spiritStones: 1750, exp: 6000, items: [{ itemId: 'MAT_ZITHER_001', quantity: 5 }] }, isMilestone: false },
  { day: 26, rewards: { spiritStones: 2000, exp: 7500, items: [{ itemId: 'CONS_HP_001', quantity: 30 }] }, isMilestone: false },
  { day: 27, rewards: { spiritStones: 2500, exp: 10000 }, isMilestone: false },
  { day: 28, rewards: { spiritStones: 10000, exp: 25000, items: [{ itemId: 'SW_T3_001', quantity: 1 }], title: 'True Cultivator' }, isMilestone: true },
];

// ============================================
// CULTIVATION MILESTONES
// Using iconType instead of emojis for proper icon system
// ============================================

export const CULTIVATION_MILESTONES: CultivationMilestone[] = [
  // Level Milestones
  {
    id: 'level_5',
    name: 'First Steps',
    nameZh: '初学乍练',
    description: 'Reach Level 5',
    requirement: { type: 'level', target: 5 },
    rewards: { spiritStones: 500, exp: 2000 },
    icon: 'milestone_level'
  },
  {
    id: 'level_9_peak',
    name: 'Peak of Qi Condensation',
    nameZh: '凝气巅峰',
    description: 'Reach Level 9 - Seek the Trial of Foundation to advance!',
    requirement: { type: 'level', target: 9 },
    rewards: { spiritStones: 2000, exp: 5000, title: 'Qi Condensation Master' },
    icon: 'milestone_breakthrough'
  },
  {
    id: 'level_10',
    name: 'Foundation Builder',
    nameZh: '筑基之始',
    description: 'Reach Level 10 and establish your foundation',
    requirement: { type: 'level', target: 10 },
    rewards: { spiritStones: 1500, exp: 5000, ap: 2 },
    icon: 'milestone_level'
  },
  {
    id: 'level_15',
    name: 'Rising Dragon',
    nameZh: '龙腾虎跃',
    description: 'Reach Level 15',
    requirement: { type: 'level', target: 15 },
    rewards: { spiritStones: 3000, exp: 10000, title: 'Rising Dragon' },
    icon: 'milestone_dragon'
  },
  {
    id: 'level_19_peak',
    name: 'Peak of Foundation',
    nameZh: '筑基巅峰',
    description: 'Reach Level 19 - Seek the Trial of Golden Core to ascend!',
    requirement: { type: 'level', target: 19 },
    rewards: { spiritStones: 5000, exp: 20000, title: 'Foundation Perfected' },
    icon: 'milestone_breakthrough'
  },
  {
    id: 'level_20',
    name: 'Golden Core Initiate',
    nameZh: '金丹初成',
    description: 'Reach Level 20 and form your Golden Core',
    requirement: { type: 'level', target: 20 },
    rewards: { spiritStones: 5000, exp: 20000, ap: 5, title: 'Golden Core Initiate' },
    icon: 'milestone_golden_core'
  },
  
  // Kill Milestones
  {
    id: 'kills_100',
    name: 'Hundred Foes',
    nameZh: '百战不殆',
    description: 'Defeat 100 enemies',
    requirement: { type: 'kills', target: 100 },
    rewards: { spiritStones: 800, exp: 2000 },
    icon: 'milestone_combat'
  },
  {
    id: 'kills_500',
    name: 'Battle-Hardened',
    nameZh: '身经百战',
    description: 'Defeat 500 enemies',
    requirement: { type: 'kills', target: 500 },
    rewards: { spiritStones: 2500, exp: 7500, title: 'Battle-Hardened' },
    icon: 'milestone_sword'
  },
  {
    id: 'kills_1000',
    name: 'Slayer of Thousands',
    nameZh: '万夫莫敌',
    description: 'Defeat 1000 enemies',
    requirement: { type: 'kills', target: 1000 },
    rewards: { spiritStones: 5000, exp: 15000, ap: 3, title: 'Slayer of Thousands' },
    icon: 'milestone_slayer'
  },
  
  // Quest Milestones
  {
    id: 'quests_5',
    name: 'Helpful Disciple',
    nameZh: '乐于助人',
    description: 'Complete 5 quests',
    requirement: { type: 'quests', target: 5 },
    rewards: { spiritStones: 600, exp: 1500 },
    icon: 'milestone_scroll'
  },
  {
    id: 'quests_15',
    name: 'Quest Seeker',
    nameZh: '任务达人',
    description: 'Complete 15 quests',
    requirement: { type: 'quests', target: 15 },
    rewards: { spiritStones: 2000, exp: 5000, title: 'Quest Seeker' },
    icon: 'milestone_quest'
  },
  {
    id: 'quests_30',
    name: 'Legend Maker',
    nameZh: '传奇缔造者',
    description: 'Complete 30 quests',
    requirement: { type: 'quests', target: 30 },
    rewards: { spiritStones: 4000, exp: 12000, ap: 2, title: 'Legend Maker' },
    icon: 'milestone_legend'
  },
  
  // Login Milestones
  {
    id: 'days_7',
    name: 'Week Warrior',
    nameZh: '七日修行',
    description: 'Login for 7 consecutive days',
    requirement: { type: 'days_logged', target: 7 },
    rewards: { spiritStones: 1500, items: [{ itemId: 'CONS_HP_001', quantity: 20 }] },
    icon: 'milestone_calendar'
  },
  {
    id: 'days_30',
    name: 'Monthly Devotion',
    nameZh: '月修圆满',
    description: 'Login for 30 consecutive days',
    requirement: { type: 'days_logged', target: 30 },
    rewards: { spiritStones: 8000, ap: 5, title: 'Devoted Cultivator' },
    icon: 'milestone_moon'
  },
  
  // Wealth Milestones
  {
    id: 'stones_1000',
    name: 'First Fortune',
    nameZh: '初获财富',
    description: 'Accumulate 1,000 Spirit Stones (total earned)',
    requirement: { type: 'spirit_stones', target: 1000 },
    rewards: { spiritStones: 300, exp: 800 },
    icon: 'milestone_coins'
  },
  {
    id: 'stones_10000',
    name: 'Prosperous Path',
    nameZh: '财源广进',
    description: 'Accumulate 10,000 Spirit Stones (total earned)',
    requirement: { type: 'spirit_stones', target: 10000 },
    rewards: { spiritStones: 1500, exp: 5000, title: 'Wealthy Cultivator' },
    icon: 'milestone_gem'
  },
  
  // Crafting Milestones
  {
    id: 'crafts_5',
    name: 'Apprentice Smith',
    nameZh: '锻造学徒',
    description: 'Successfully craft 5 items',
    requirement: { type: 'crafts', target: 5 },
    rewards: { spiritStones: 600, items: [{ itemId: 'MAT_SWORD_001', quantity: 5 }] },
    icon: 'milestone_hammer'
  },
  {
    id: 'crafts_20',
    name: 'Master Craftsman',
    nameZh: '锻造大师',
    description: 'Successfully craft 20 items',
    requirement: { type: 'crafts', target: 20 },
    rewards: { spiritStones: 2500, ap: 2, title: 'Master Craftsman' },
    icon: 'milestone_anvil'
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function createInitialCultivationProgress(): CultivationProgress {
  return {
    lastLoginDate: '',
    consecutiveLogins: 0,
    totalLogins: 0,
    claimedDailyRewards: [],
    claimedMilestones: [],
    cultivationPoints: 0,
  };
}

export function checkDailyLogin(progress: CultivationProgress): {
  isNewDay: boolean;
  streakBroken: boolean;
  currentDay: number;
} {
  const today = new Date().toISOString().split('T')[0];
  const lastLogin = progress.lastLoginDate;
  
  if (!lastLogin) {
    return { isNewDay: true, streakBroken: false, currentDay: 1 };
  }
  
  if (lastLogin === today) {
    return { isNewDay: false, streakBroken: false, currentDay: progress.consecutiveLogins };
  }
  
  // Check if yesterday
  const lastDate = new Date(lastLogin);
  const todayDate = new Date(today);
  const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    // Consecutive day
    const newDay = (progress.consecutiveLogins % 28) + 1;
    return { isNewDay: true, streakBroken: false, currentDay: newDay };
  } else {
    // Streak broken
    return { isNewDay: true, streakBroken: true, currentDay: 1 };
  }
}

export function getDailyReward(day: number): DailyReward | undefined {
  return DAILY_REWARDS.find(r => r.day === day);
}

export function getUnclaimedMilestones(
  progress: CultivationProgress,
  playerStats: {
    level: number;
    totalKills: number;
    questsCompleted: number;
    totalStonesEarned: number;
    totalCrafts: number;
  }
): CultivationMilestone[] {
  return CULTIVATION_MILESTONES.filter(m => {
    if (progress.claimedMilestones.includes(m.id)) return false;
    
    switch (m.requirement.type) {
      case 'level':
        return playerStats.level >= (m.requirement.target as number);
      case 'kills':
        return playerStats.totalKills >= (m.requirement.target as number);
      case 'quests':
        return playerStats.questsCompleted >= (m.requirement.target as number);
      case 'days_logged':
        return progress.consecutiveLogins >= (m.requirement.target as number);
      case 'spirit_stones':
        return playerStats.totalStonesEarned >= (m.requirement.target as number);
      case 'crafts':
        return playerStats.totalCrafts >= (m.requirement.target as number);
      default:
        return false;
    }
  });
}

export function getMilestoneProgress(
  milestone: CultivationMilestone,
  playerStats: {
    level: number;
    totalKills: number;
    questsCompleted: number;
    totalStonesEarned: number;
    totalCrafts: number;
    consecutiveLogins: number;
  }
): { current: number; target: number; percent: number } {
  const target = milestone.requirement.target as number;
  let current = 0;
  
  switch (milestone.requirement.type) {
    case 'level':
      current = playerStats.level;
      break;
    case 'kills':
      current = playerStats.totalKills;
      break;
    case 'quests':
      current = playerStats.questsCompleted;
      break;
    case 'days_logged':
      current = playerStats.consecutiveLogins;
      break;
    case 'spirit_stones':
      current = playerStats.totalStonesEarned;
      break;
    case 'crafts':
      current = playerStats.totalCrafts;
      break;
  }
  
  return {
    current: Math.min(current, target),
    target,
    percent: Math.min(100, Math.floor((current / target) * 100)),
  };
}
