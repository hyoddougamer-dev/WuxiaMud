// ============================================
// COMBO SYSTEM - 凌云道 (Língyún Dào)
// Skill sequences that trigger powerful bonus effects
// Uses REAL skill IDs from skillSystem.ts
// ============================================

export interface SkillCombo {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  classIds: number[];
  sequence: string[]; // Skill IDs (BSI_001, GS_001, etc.)
  timeWindow: number;
  bonusEffect: ComboEffect;
  icon: string;
}

export interface ComboEffect {
  type: 'damage_bonus' | 'heal' | 'qi_restore' | 'apply_effect' | 'damage_multiplier' | 'cooldown_reset';
  value: number;
  target?: 'enemy' | 'self';
  effectName?: string;
  effectDuration?: number;
}

export interface ComboProgress {
  combo: SkillCombo;
  currentStep: number;
  startTime: number;
  nextSkills: SkillCombo[];
}

// ============================================
// COMBO DEFINITIONS - Using Real Skill IDs
// ============================================

export const SKILL_COMBOS: SkillCombo[] = [
  // =========================================
  // CLASS 1: BLAZING SWORD IMMORTAL (Fire)
  // Skills: BSI_001 Ember Slash, BSI_002 Flame Dance, BSI_003 Blazing Aura, BSI_004 Phoenix Strike
  // =========================================
  {
    id: 'inferno_chain',
    name: 'Inferno Chain',
    nameZh: '烈焰连击',
    description: 'Ember Slash → Flame Dance = +50% damage',
    classIds: [1],
    sequence: ['BSI_001', 'BSI_002'],
    timeWindow: 6000,
    bonusEffect: { type: 'damage_bonus', value: 50 },
    icon: '🔥'
  },
  {
    id: 'phoenix_ascension',
    name: 'Phoenix Ascension',
    nameZh: '凤凰升天',
    description: 'Blazing Aura → Phoenix Strike = Heal 20% HP',
    classIds: [1],
    sequence: ['BSI_003', 'BSI_004'],
    timeWindow: 8000,
    bonusEffect: { type: 'heal', value: 20 },
    icon: '🦅'
  },
  {
    id: 'blazing_finisher',
    name: 'Blazing Finisher',
    nameZh: '烈焰终结',
    description: 'Flame Dance → Phoenix Strike = x2 damage',
    classIds: [1],
    sequence: ['BSI_002', 'BSI_004'],
    timeWindow: 6000,
    bonusEffect: { type: 'damage_multiplier', value: 2.0 },
    icon: '🔥🦅'
  },

  // =========================================
  // CLASS 2: GLACIAL SHADOW (Ice)
  // Skills: GS_001 Frost Cut, GS_002 Frozen Mirror, GS_003 Blizzard Step, GS_004 Absolute Zero
  // =========================================
  {
    id: 'frozen_prison',
    name: 'Frozen Prison',
    nameZh: '冰封监狱',
    description: 'Frost Cut → Blizzard Step = Stun 2 ticks',
    classIds: [2],
    sequence: ['GS_001', 'GS_003'],
    timeWindow: 6000,
    bonusEffect: { type: 'apply_effect', value: 2, effectName: 'stun' },
    icon: '❄️'
  },
  {
    id: 'ice_mirror_combo',
    name: 'Mirror of Frost',
    nameZh: '霜之镜',
    description: 'Frozen Mirror → Absolute Zero = x2 damage',
    classIds: [2],
    sequence: ['GS_002', 'GS_004'],
    timeWindow: 8000,
    bonusEffect: { type: 'damage_multiplier', value: 2.0 },
    icon: '🪞🧊'
  },
  {
    id: 'glacial_rush',
    name: 'Glacial Rush',
    nameZh: '冰川冲击',
    description: 'Blizzard Step → Absolute Zero = +30 Qi restore',
    classIds: [2],
    sequence: ['GS_003', 'GS_004'],
    timeWindow: 6000,
    bonusEffect: { type: 'qi_restore', value: 30 },
    icon: '🌨️🧊'
  },

  // =========================================
  // CLASS 3: SPELLFIRE DUELIST (Lightning)
  // Skills: SD_001 Arc Blade, SD_002 Thunder Barrier, SD_003 Static Surge, SD_004 Tempest Blade
  // =========================================
  {
    id: 'lightning_chain',
    name: 'Lightning Chain',
    nameZh: '连锁闪电',
    description: 'Arc Blade → Static Surge = +60% damage',
    classIds: [3],
    sequence: ['SD_001', 'SD_003'],
    timeWindow: 6000,
    bonusEffect: { type: 'damage_bonus', value: 60 },
    icon: '⚡'
  },
  {
    id: 'thunder_storm',
    name: 'Thunder Storm',
    nameZh: '雷暴风云',
    description: 'Static Surge → Tempest Blade = x2.5 damage',
    classIds: [3],
    sequence: ['SD_003', 'SD_004'],
    timeWindow: 8000,
    bonusEffect: { type: 'damage_multiplier', value: 2.5 },
    icon: '⚡⛈️'
  },
  {
    id: 'defensive_surge',
    name: 'Defensive Surge',
    nameZh: '防御涌动',
    description: 'Thunder Barrier → Arc Blade = Heal 15% HP',
    classIds: [3],
    sequence: ['SD_002', 'SD_001'],
    timeWindow: 6000,
    bonusEffect: { type: 'heal', value: 15 },
    icon: '🛡️⚡'
  },

  // =========================================
  // CLASS 4: TOXIC VIPER (Void/Poison)
  // Skills: TV_001 Venom Strike, TV_002 Shadow Fang, TV_003 Toxic Mist, TV_004 Death's Embrace
  // =========================================
  {
    id: 'venom_burst',
    name: 'Venom Burst',
    nameZh: '毒液爆发',
    description: 'Venom Strike → Shadow Fang = +75% damage',
    classIds: [4],
    sequence: ['TV_001', 'TV_002'],
    timeWindow: 6000,
    bonusEffect: { type: 'damage_bonus', value: 75 },
    icon: '🐍'
  },
  {
    id: 'toxic_death',
    name: 'Toxic Death',
    nameZh: '剧毒死亡',
    description: 'Toxic Mist → Death\'s Embrace = x2 damage',
    classIds: [4],
    sequence: ['TV_003', 'TV_004'],
    timeWindow: 8000,
    bonusEffect: { type: 'damage_multiplier', value: 2.0 },
    icon: '☁️💀'
  },
  {
    id: 'shadow_poison',
    name: 'Shadow Poison',
    nameZh: '暗影毒素',
    description: 'Shadow Fang → Toxic Mist = +25 Qi restore',
    classIds: [4],
    sequence: ['TV_002', 'TV_003'],
    timeWindow: 6000,
    bonusEffect: { type: 'qi_restore', value: 25 },
    icon: '🦷☁️'
  },

  // =========================================
  // CLASS 5: ASURA OF WAR (Fire/Berserker)
  // Skills: AW_001 Berserker Slash, AW_002 War Cry, AW_003 Blood Frenzy, AW_004 Asura's Wrath
  // =========================================
  {
    id: 'war_frenzy',
    name: 'War Frenzy',
    nameZh: '战争狂怒',
    description: 'War Cry → Berserker Slash = +80% damage',
    classIds: [5],
    sequence: ['AW_002', 'AW_001'],
    timeWindow: 6000,
    bonusEffect: { type: 'damage_bonus', value: 80 },
    icon: '📢💢'
  },
  {
    id: 'blood_war',
    name: 'Blood War',
    nameZh: '血战',
    description: 'Blood Frenzy → Asura\'s Wrath = Heal 25% HP',
    classIds: [5],
    sequence: ['AW_003', 'AW_004'],
    timeWindow: 8000,
    bonusEffect: { type: 'heal', value: 25 },
    icon: '🩸👹'
  },
  {
    id: 'asura_chain',
    name: 'Asura Chain',
    nameZh: '修罗连击',
    description: 'Berserker Slash → Blood Frenzy = x1.8 damage',
    classIds: [5],
    sequence: ['AW_001', 'AW_003'],
    timeWindow: 6000,
    bonusEffect: { type: 'damage_multiplier', value: 1.8 },
    icon: '💢🩸'
  },

  // =========================================
  // CLASS 6: FROZEN STEEL GUARD (Ice/Tank)
  // Skills: FSG_001 Glacial Strike, FSG_002 Iron Fortress, FSG_003 Frost Guard, FSG_004 Frozen Colossus
  // =========================================
  {
    id: 'fortress_strike',
    name: 'Fortress Strike',
    nameZh: '堡垒打击',
    description: 'Iron Fortress → Glacial Strike = +50% damage',
    classIds: [6],
    sequence: ['FSG_002', 'FSG_001'],
    timeWindow: 6000,
    bonusEffect: { type: 'damage_bonus', value: 50 },
    icon: '🏰🗡️'
  },
  {
    id: 'frozen_defense',
    name: 'Frozen Defense',
    nameZh: '冰冻防御',
    description: 'Frost Guard → Frozen Colossus = +30 Qi restore',
    classIds: [6],
    sequence: ['FSG_003', 'FSG_004'],
    timeWindow: 8000,
    bonusEffect: { type: 'qi_restore', value: 30 },
    icon: '🛡️🗿'
  },

  // =========================================
  // CLASS 7: VERDANT BLADE MONARCH (Wood/Heal)
  // Skills: VBM_001 Nature's Cut, VBM_002 Regrowth, VBM_003 Thorns Aura, VBM_004 Forest King
  // =========================================
  {
    id: 'nature_combo',
    name: 'Nature Combo',
    nameZh: '自然连击',
    description: 'Nature\'s Cut → Regrowth = +40% damage',
    classIds: [7],
    sequence: ['VBM_001', 'VBM_002'],
    timeWindow: 6000,
    bonusEffect: { type: 'damage_bonus', value: 40 },
    icon: '🌿🌱'
  },
  {
    id: 'forest_heal',
    name: 'Forest Heal',
    nameZh: '森林治愈',
    description: 'Thorns Aura → Forest King = Heal 35% HP',
    classIds: [7],
    sequence: ['VBM_003', 'VBM_004'],
    timeWindow: 8000,
    bonusEffect: { type: 'heal', value: 35 },
    icon: '🌹🌳'
  },

  // =========================================
  // CLASS 8: WILDERNESS STALKER (Wood/Hunter)
  // Skills: WS_001 Predator Lunge, WS_002 Hunter's Mark, WS_003 Wild Instinct, WS_004 Beast Within
  // =========================================
  {
    id: 'marked_prey',
    name: 'Marked Prey',
    nameZh: '标记猎物',
    description: 'Hunter\'s Mark → Predator Lunge = +70% damage',
    classIds: [8],
    sequence: ['WS_002', 'WS_001'],
    timeWindow: 6000,
    bonusEffect: { type: 'damage_bonus', value: 70 },
    icon: '🎯🐆'
  },
  {
    id: 'beast_hunt',
    name: 'Beast Hunt',
    nameZh: '野兽狩猎',
    description: 'Wild Instinct → Beast Within = x2 damage',
    classIds: [8],
    sequence: ['WS_003', 'WS_004'],
    timeWindow: 8000,
    bonusEffect: { type: 'damage_multiplier', value: 2.0 },
    icon: '👁️🐺'
  },

  // =========================================
  // CLASS 9: PHOENIX CRY CULTIVATOR (Fire/Zither)
  // Skills: PCC_001 Blazing Note, PCC_002 Phoenix Song, PCC_003 Rebirth Flame, PCC_004 Phoenix Ascension
  // =========================================
  {
    id: 'phoenix_melody',
    name: 'Phoenix Melody',
    nameZh: '凤凰之歌',
    description: 'Blazing Note → Phoenix Song = +50% healing',
    classIds: [9],
    sequence: ['PCC_001', 'PCC_002'],
    timeWindow: 6000,
    bonusEffect: { type: 'heal', value: 15 },
    icon: '🎵🔥'
  },
  {
    id: 'rebirth_symphony',
    name: 'Rebirth Symphony',
    nameZh: '重生交响',
    description: 'Rebirth Flame → Phoenix Ascension = Heal 40% HP',
    classIds: [9],
    sequence: ['PCC_003', 'PCC_004'],
    timeWindow: 8000,
    bonusEffect: { type: 'heal', value: 40 },
    icon: '🔄🔥'
  },

  // =========================================
  // CLASS 10: DIVINE MELODY HEALER (Lightning/Zither)
  // Skills: DMH_001 Healing Chord, DMH_002 Protective Melody, DMH_003 Purifying Note, DMH_004 Divine Resonance
  // =========================================
  {
    id: 'blessed_harmony',
    name: 'Blessed Harmony',
    nameZh: '祝福和谐',
    description: 'Healing Chord → Protective Melody = +10% shield',
    classIds: [10],
    sequence: ['DMH_001', 'DMH_002'],
    timeWindow: 6000,
    bonusEffect: { type: 'heal', value: 10 },
    icon: '💚🎼'
  },
  {
    id: 'divine_purification',
    name: 'Divine Purification',
    nameZh: '神圣净化',
    description: 'Purifying Note → Divine Resonance = Heal 60% HP',
    classIds: [10],
    sequence: ['DMH_003', 'DMH_004'],
    timeWindow: 8000,
    bonusEffect: { type: 'heal', value: 60 },
    icon: '✨👼'
  },

  // =========================================
  // CLASS 11: PHANTOM MUSICIAN (Void/Zither)
  // Skills: PM_001 Haunting Note, PM_002 Soul Drain, PM_003 Phantom Veil, PM_004 Requiem of Shadows
  // =========================================
  {
    id: 'soul_resonance',
    name: 'Soul Resonance',
    nameZh: '灵魂共鸣',
    description: 'Haunting Note → Soul Drain = +80% lifesteal',
    classIds: [11],
    sequence: ['PM_001', 'PM_002'],
    timeWindow: 6000,
    bonusEffect: { type: 'heal', value: 25 },
    icon: '👻💜'
  },
  {
    id: 'requiem_of_death',
    name: 'Requiem of Death',
    nameZh: '死亡安魂曲',
    description: 'Phantom Veil → Requiem of Shadows = x2 damage',
    classIds: [11],
    sequence: ['PM_003', 'PM_004'],
    timeWindow: 8000,
    bonusEffect: { type: 'damage_multiplier', value: 2.0 },
    icon: '🌫️🎭'
  },

  // =========================================
  // CLASS 12: UNBREAKABLE SPIRIT SAGE (Void/Zither)
  // Skills: USS_001 Spirit Bolt, USS_002 Willpower Shield, USS_003 Mental Fortress, USS_004 Transcendence
  // =========================================
  {
    id: 'fortified_spirit',
    name: 'Fortified Spirit',
    nameZh: '坚毅之灵',
    description: 'Spirit Bolt → Willpower Shield = +20% damage reduction',
    classIds: [12],
    sequence: ['USS_001', 'USS_002'],
    timeWindow: 6000,
    bonusEffect: { type: 'damage_bonus', value: 20 },
    icon: '🔮🧠'
  },
  {
    id: 'ultimate_transcendence',
    name: 'Ultimate Transcendence',
    nameZh: '终极超越',
    description: 'Mental Fortress → Transcendence = x2.5 damage',
    classIds: [12],
    sequence: ['USS_003', 'USS_004'],
    timeWindow: 8000,
    bonusEffect: { type: 'damage_multiplier', value: 2.5 },
    icon: '🏛️🌌'
  },

  // =========================================
  // UNIVERSAL COMBOS (All classes)
  // Skills: UNI_001 Inner Focus, UNI_002 Meditative Stance, UNI_003 Qi Burst
  // =========================================
  {
    id: 'focused_burst',
    name: 'Focused Burst',
    nameZh: '凝聚爆发',
    description: 'Inner Focus → Qi Burst = x2 damage',
    classIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    sequence: ['UNI_001', 'UNI_003'],
    timeWindow: 8000,
    bonusEffect: { type: 'damage_multiplier', value: 2.0 },
    icon: '🧘💥'
  },
  {
    id: 'meditation_heal',
    name: 'Meditation Heal',
    nameZh: '冥想治愈',
    description: 'Inner Focus → Meditative Stance = Heal 30% HP',
    classIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    sequence: ['UNI_001', 'UNI_002'],
    timeWindow: 8000,
    bonusEffect: { type: 'heal', value: 30 },
    icon: '🧘💚'
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getCombosForClass(classId: number): SkillCombo[] {
  return SKILL_COMBOS.filter(combo => combo.classIds.includes(classId));
}

export function checkComboMatch(recentSkills: string[], combos: SkillCombo[]): SkillCombo | null {
  for (const combo of combos) {
    const seqLen = combo.sequence.length;
    const recentLen = recentSkills.length;
    
    if (recentLen < seqLen) continue;
    
    // Check if last N skills match the combo sequence
    const lastNSkills = recentSkills.slice(-seqLen);
    const matches = lastNSkills.every((skillId, idx) => skillId === combo.sequence[idx]);
    
    if (matches) {
      return combo;
    }
  }
  return null;
}

export function getNextPossibleCombos(recentSkills: string[], combos: SkillCombo[]): SkillCombo[] {
  if (recentSkills.length === 0) return [];
  
  const lastSkill = recentSkills[recentSkills.length - 1];
  
  return combos.filter(combo => {
    // Check if any combo starts with recent skills
    for (let i = 0; i < combo.sequence.length - 1; i++) {
      if (combo.sequence[i] === lastSkill) {
        return true;
      }
    }
    return false;
  });
}

export function getComboProgress(recentSkills: string[], combos: SkillCombo[]): ComboProgress | null {
  const lastSkill = recentSkills[recentSkills.length - 1];
  
  for (const combo of combos) {
    for (let i = 0; i < combo.sequence.length; i++) {
      if (combo.sequence[i] === lastSkill) {
        // Check if previous skills in sequence also match
        let matchCount = 0;
        for (let j = i; j >= 0; j--) {
          const recentIndex = recentSkills.length - 1 - (i - j);
          if (recentIndex >= 0 && recentSkills[recentIndex] === combo.sequence[j]) {
            matchCount++;
          } else {
            break;
          }
        }
        
        if (matchCount > 0 && matchCount < combo.sequence.length) {
          return {
            combo,
            currentStep: matchCount - 1,
            startTime: Date.now(),
            nextSkills: getNextPossibleCombos(recentSkills, combos)
          };
        }
      }
    }
  }
  
  return null;
}
