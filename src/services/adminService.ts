/**
 * Admin Service - Functions for game administration
 * Only works for users with 'admin' or 'owner' role
 */

import { supabase } from './supabase';

export type UserRole = 'player' | 'moderator' | 'admin' | 'owner';

export interface GameConfig {
  id: string;
  exp_multiplier: number;
  drop_rate_multiplier: number;
  spirit_stones_multiplier: number;
  active_event: string | null;
  event_description: string | null;
  event_start: string | null;
  event_end: string | null;
  auto_ban_enabled: boolean;
  max_cheat_attempts_before_ban: number;
  maintenance_mode: boolean;
  maintenance_message: string | null;
  updated_at: string;
}

export interface CheatLogEntry {
  id: string;
  user_id: string;
  character_id: string | null;
  cheat_type: string;
  details: Record<string, unknown>;
  action_taken: 'blocked' | 'warned' | 'banned';
  detected_at: string;
}

export interface PlayerProfile {
  id: string;
  username: string;
  email: string | null;
  role: UserRole;
  is_banned: boolean;
  ban_reason: string | null;
  banned_at: string | null;
  cheat_attempts: number;
  last_cheat_attempt: string | null;
  created_at: string;
  last_login: string;
}

// ============================================
// Admin Check
// ============================================

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('[AdminService] No user logged in');
    return null;
  }

  console.log('[AdminService] Checking role for user:', user.id);

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('[AdminService] Error fetching role:', error);
    return 'player';
  }

  console.log('[AdminService] User role:', data?.role);
  return data?.role || 'player';
}

export async function isAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole();
  const result = role === 'admin' || role === 'owner';
  console.log('[AdminService] isAdmin check:', result, '(role:', role, ')');
  return result;
}

export async function isModerator(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === 'moderator' || role === 'admin' || role === 'owner';
}

// ============================================
// Game Configuration
// ============================================

export async function getGameConfig(): Promise<GameConfig | null> {
  const { data, error } = await supabase
    .from('game_config')
    .select('*')
    .eq('id', 'global')
    .single();

  if (error) {
    console.error('Failed to get game config:', error);
    return null;
  }

  return data;
}

// ============================================
// Event Management
// ============================================

export async function startEvent(
  eventName: string,
  description: string,
  expMultiplier: number = 1.0,
  dropMultiplier: number = 1.0,
  stonesMultiplier: number = 1.0,
  durationHours: number = 24
): Promise<{ success: boolean; error?: string; endsAt?: string }> {
  const { data, error } = await supabase.rpc('admin_set_event', {
    p_event_name: eventName,
    p_description: description,
    p_exp_mult: expMultiplier,
    p_drop_mult: dropMultiplier,
    p_stones_mult: stonesMultiplier,
    p_duration_hours: durationHours
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { 
    success: data.success, 
    error: data.error,
    endsAt: data.ends_at 
  };
}

export async function endEvent(): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('admin_end_event');

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: data.success, error: data.error };
}

// ============================================
// Player Management
// ============================================

export async function banPlayer(
  userId: string, 
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('admin_ban_player', {
    p_target_user_id: userId,
    p_reason: reason
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: data.success, error: data.error };
}

export async function unbanPlayer(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('admin_unban_player', {
    p_target_user_id: userId
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: data.success, error: data.error };
}

export async function getAllPlayers(): Promise<PlayerProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get players:', error);
    return [];
  }

  return data || [];
}

export async function getBannedPlayers(): Promise<PlayerProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_banned', true)
    .order('banned_at', { ascending: false });

  if (error) {
    console.error('Failed to get banned players:', error);
    return [];
  }

  return data || [];
}

// ============================================
// Cheat Log Monitoring
// ============================================

export async function getCheatLogs(
  limit: number = 100
): Promise<CheatLogEntry[]> {
  const { data, error } = await supabase
    .from('cheat_log')
    .select('*')
    .order('detected_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to get cheat logs:', error);
    return [];
  }

  return data || [];
}

export async function getPlayerCheatHistory(
  userId: string
): Promise<CheatLogEntry[]> {
  const { data, error } = await supabase
    .from('cheat_log')
    .select('*')
    .eq('user_id', userId)
    .order('detected_at', { ascending: false });

  if (error) {
    console.error('Failed to get player cheat history:', error);
    return [];
  }

  return data || [];
}

// ============================================
// Advanced Event System - Língyún Dào
// ============================================

// Event mechanics types - cada um com gameplay diferente!
export type EventMechanic = 
  | 'multiplier'      // Clássico: bonus de EXP/drops (boring mas útil)
  | 'world_boss'      // Boss mundial - todos contribuem
  | 'collection'      // Colecionar itens especiais do evento
  | 'realm_rush'      // Facilita breakthroughs
  | 'element_surge'   // Bonus para elementos específicos
  | 'class_spotlight' // Bonus para classes específicas
  | 'survival'        // Waves de inimigos, recompensas por duração
  | 'mystery'         // Pistas e enigmas para resolver
  | 'community_goal'  // Objetivo coletivo (X kills, X bosses)
  | 'double_or_nothing' // Apostar recompensas - risco/recompensa
  | 'mentor_blessing' // Veteranos ajudam novatos
  | 'secret_realm'    // Área especial desbloqueada
  | 'crafting_mastery' // Bonus de crafting
  | 'auction_fever'   // Mercado especial
  | 'karma_system';   // Ações boas/más afetam rewards

export type EventCategory = 
  | 'combat'       // Combate
  | 'social'       // Interação entre jogadores
  | 'progression'  // Progressão de personagem
  | 'economy'      // Mercado e crafting
  | 'exploration'  // Descoberta
  | 'challenge'    // Desafios especiais
  | 'seasonal';    // Feriados

export interface EventPreset {
  id: string;
  name: string;
  description: string;
  category: EventCategory;
  mechanic: EventMechanic;
  
  // Multipliers padrão (podem ser 1.0 se o evento não usar)
  expMult: number;
  dropMult: number;
  stonesMult: number;
  hours: number;
  
  // Visual
  icon: string;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  
  // Mecânicas especiais (opcional, depende do tipo)
  specialMechanics?: {
    // World Boss
    bossName?: string;
    bossHp?: number;
    communityDamageGoal?: number;
    
    // Collection
    collectibleItems?: string[];
    exchangeRewards?: string[];
    
    // Element/Class bonus
    targetElement?: string;
    targetClass?: string;
    bonusPercent?: number;
    
    // Survival
    waveCount?: number;
    survivalRewards?: { wave: number; reward: string }[];
    
    // Mystery
    clues?: string[];
    solution?: string;
    mysteryReward?: string;
    
    // Community Goal
    goalType?: 'kills' | 'bosses' | 'crafts' | 'trades';
    goalTarget?: number;
    currentProgress?: number;
    
    // Double or Nothing
    riskLevels?: { risk: number; reward: number }[];
    
    // Secret Realm
    realmName?: string;
    realmDescription?: string;
    uniqueDrops?: string[];
    
    // Crafting
    craftSuccessBonus?: number;
    freeRerollCount?: number;
    
    // Karma
    goodKarmaReward?: string;
    badKarmaConsequence?: string;
  };
  
  // Gameplay instructions
  howToParticipate: string;
  suggestedSchedule?: string;
}

export const EVENT_PRESETS: Record<string, EventPreset> = {
  // ============================================
  // 🐉 WORLD BOSS EVENTS
  // ============================================
  ancientDragonAwakens: {
    id: 'ancientDragonAwakens',
    name: '🐉 O Dragão Ancestral Desperta',
    description: 'Um dragão milenar acordou! Toda a comunidade deve unir forças para o derrotar. Cada ataque que fazes contribui para o HP global do boss.',
    category: 'combat',
    mechanic: 'world_boss',
    expMult: 1.5,
    dropMult: 1.0,
    stonesMult: 1.0,
    hours: 48,
    icon: '🐉',
    color: 'from-red-600 to-orange-500',
    rarity: 'legendary',
    specialMechanics: {
      bossName: 'Lóng Wáng - Rei Dragão',
      bossHp: 10000000,
      communityDamageGoal: 10000000
    },
    howToParticipate: 'Cada combate que vences adiciona dano ao Boss Mundial. Quando o dragão morrer, TODOS os participantes recebem recompensas baseadas na sua contribuição!',
    suggestedSchedule: 'Evento mensal épico'
  },
  
  demonLordInvasion: {
    id: 'demonLordInvasion',
    name: '👹 Invasão do Senhor Demónio',
    description: 'O Senhor Demónio e os seus generais atacam! Derrota-os antes que destruam as cidades.',
    category: 'combat',
    mechanic: 'world_boss',
    expMult: 2.0,
    dropMult: 2.0,
    stonesMult: 1.5,
    hours: 24,
    icon: '👹',
    color: 'from-purple-700 to-red-600',
    rarity: 'epic',
    specialMechanics: {
      bossName: 'Mó Jūn - Senhor Demónio',
      bossHp: 5000000,
      communityDamageGoal: 5000000
    },
    howToParticipate: 'Ataca inimigos para contribuir dano. Se a comunidade falhar, todos perdem 10% de Spirit Stones!',
    suggestedSchedule: 'Quinzenal - alto risco'
  },

  // ============================================
  // 🎁 COLLECTION EVENTS
  // ============================================
  lanternFestival: {
    id: 'lanternFestival',
    name: '🏮 Festival das Lanternas',
    description: 'Lanternas mágicas caem do céu! Coleciona-as e troca por recompensas exclusivas.',
    category: 'exploration',
    mechanic: 'collection',
    expMult: 1.0,
    dropMult: 1.0,
    stonesMult: 1.0,
    hours: 72,
    icon: '🏮',
    color: 'from-red-500 to-yellow-400',
    rarity: 'epic',
    specialMechanics: {
      collectibleItems: ['🔴 Lanterna Vermelha', '🟡 Lanterna Dourada', '🔵 Lanterna Celestial', '🟣 Lanterna Mística'],
      exchangeRewards: ['Pet Exclusivo', 'Título Especial', 'Skin de Arma', 'Mount Raro']
    },
    howToParticipate: 'Lanternas dropam de QUALQUER inimigo. Coleciona sets completos para trocar por rewards únicos no NPC do evento!',
    suggestedSchedule: 'Lunar New Year / Mid-Autumn'
  },

  spiritBeastHunt: {
    id: 'spiritBeastHunt',
    name: '🦊 Caça às Bestas Espirituais',
    description: 'Criaturas espirituais raras apareceram pelo mundo! Captura-as antes que desapareçam.',
    category: 'exploration',
    mechanic: 'collection',
    expMult: 1.2,
    dropMult: 1.5,
    stonesMult: 1.0,
    hours: 48,
    icon: '🦊',
    color: 'from-orange-400 to-amber-300',
    rarity: 'rare',
    specialMechanics: {
      collectibleItems: ['🦊 Raposa de Nove Caudas', '🐢 Tartaruga Negra', '🐦 Fénix Vermelho', '🐯 Tigre Branco', '🐲 Dragão Azure'],
      exchangeRewards: ['Spirit Beast Companion', 'Beast Transformation Skill', 'Beast Mount']
    },
    howToParticipate: 'Bestas aparecem aleatoriamente após combates. Tens 30 segundos para as capturar! Coleciona todas as 5 para um reward épico.',
    suggestedSchedule: 'Semanal - caça ao tesouro'
  },

  // ============================================
  // ⚡ REALM RUSH EVENTS
  // ============================================
  heavenlyTribulation: {
    id: 'heavenlyTribulation',
    name: '⛈️ Tribulação Celestial',
    description: 'Os céus abrem-se! Cultivadores podem tentar breakthrough com maior chance de sucesso.',
    category: 'progression',
    mechanic: 'realm_rush',
    expMult: 1.0,
    dropMult: 1.0,
    stonesMult: 1.0,
    hours: 12,
    icon: '⛈️',
    color: 'from-indigo-600 to-purple-700',
    rarity: 'epic',
    specialMechanics: {
      bonusPercent: 50 // +50% chance de breakthrough
    },
    howToParticipate: 'Durante o evento, tentativas de subir de Realm têm +50% de sucesso. CUIDADO: Falhar durante tribulação pode causar backlash!',
    suggestedSchedule: 'Flash event - 12h apenas'
  },

  spiritualVeinEruption: {
    id: 'spiritualVeinEruption',
    name: '💎 Erupção de Veias Espirituais',
    description: 'Veias de Qi puro emergem do solo! Meditar durante o evento dá EXP passivo massivo.',
    category: 'progression',
    mechanic: 'realm_rush',
    expMult: 3.0,
    dropMult: 1.0,
    stonesMult: 2.0,
    hours: 24,
    icon: '💎',
    color: 'from-cyan-400 to-blue-600',
    rarity: 'rare',
    specialMechanics: {
      bonusPercent: 200 // Meditação 3x mais eficaz
    },
    howToParticipate: 'MEDITAÇÃO dá 3x mais EXP! Perfeito para AFK farming. Combates também dão bonus.',
    suggestedSchedule: 'Perfeito para fins de semana'
  },

  // ============================================
  // 🔥 ELEMENT SURGE EVENTS
  // ============================================
  infernalAscension: {
    id: 'infernalAscension',
    name: '🔥 Ascensão Infernal',
    description: 'O elemento Fogo está em erupção! Cultivadores de fogo são imparáveis.',
    category: 'combat',
    mechanic: 'element_surge',
    expMult: 1.5,
    dropMult: 1.5,
    stonesMult: 1.0,
    hours: 24,
    icon: '🔥',
    color: 'from-orange-500 to-red-700',
    rarity: 'rare',
    specialMechanics: {
      targetElement: 'Fire',
      bonusPercent: 100 // +100% dano e rewards
    },
    howToParticipate: 'Cultivadores com elemento FOGO fazem 2x dano e ganham 2x rewards. Skills de fogo custam menos Qi!',
    suggestedSchedule: 'Rodar entre elementos semanalmente'
  },

  tidalWave: {
    id: 'tidalWave',
    name: '🌊 Maré Celestial',
    description: 'As águas sagradas transbordam! Cultivadores de água dominam.',
    category: 'combat',
    mechanic: 'element_surge',
    expMult: 1.5,
    dropMult: 1.5,
    stonesMult: 1.0,
    hours: 24,
    icon: '🌊',
    color: 'from-blue-400 to-cyan-600',
    rarity: 'rare',
    specialMechanics: {
      targetElement: 'Water',
      bonusPercent: 100
    },
    howToParticipate: 'Cultivadores com elemento ÁGUA têm cura aumentada e 2x rewards!',
    suggestedSchedule: 'Rodar entre elementos'
  },

  thunderousWrath: {
    id: 'thunderousWrath',
    name: '⚡ Ira do Trovão',
    description: 'Tempestades elétricas! Cultivadores de relâmpago são devastadores.',
    category: 'combat',
    mechanic: 'element_surge',
    expMult: 1.5,
    dropMult: 1.5,
    stonesMult: 1.0,
    hours: 24,
    icon: '⚡',
    color: 'from-yellow-400 to-purple-600',
    rarity: 'rare',
    specialMechanics: {
      targetElement: 'Lightning',
      bonusPercent: 100
    },
    howToParticipate: 'Cultivadores com elemento RELÂMPAGO têm velocidade e crítico aumentados!',
    suggestedSchedule: 'Rodar entre elementos'
  },

  // ============================================
  // 🎭 CLASS SPOTLIGHT EVENTS
  // ============================================
  swordSaintDay: {
    id: 'swordSaintDay',
    name: '⚔️ Dia do Santo da Espada',
    description: 'Em honra dos antigos Sword Saints! Espadachins brilham hoje.',
    category: 'combat',
    mechanic: 'class_spotlight',
    expMult: 2.0,
    dropMult: 2.0,
    stonesMult: 1.5,
    hours: 24,
    icon: '⚔️',
    color: 'from-gray-400 to-blue-500',
    rarity: 'rare',
    specialMechanics: {
      targetClass: 'Sword Cultivator',
      bonusPercent: 100
    },
    howToParticipate: 'Sword Cultivators ganham 2x tudo! Outras classes ganham bonus reduzido (1.2x).',
    suggestedSchedule: 'Rodar entre classes semanalmente'
  },

  // ============================================
  // 🏆 SURVIVAL EVENTS
  // ============================================
  endlessTower: {
    id: 'endlessTower',
    name: '🗼 Torre Infinita',
    description: 'Quantos andares consegues subir? Cada andar é mais difícil, mas as recompensas aumentam!',
    category: 'challenge',
    mechanic: 'survival',
    expMult: 1.0,
    dropMult: 1.0,
    stonesMult: 1.0,
    hours: 48,
    icon: '🗼',
    color: 'from-gray-700 to-purple-800',
    rarity: 'legendary',
    specialMechanics: {
      waveCount: 100,
      survivalRewards: [
        { wave: 10, reward: 'Bronze Chest' },
        { wave: 25, reward: 'Silver Chest' },
        { wave: 50, reward: 'Gold Chest' },
        { wave: 75, reward: 'Platinum Chest' },
        { wave: 100, reward: 'Legendary Title + Mount' }
      ]
    },
    howToParticipate: 'Entra na Torre e combate wave após wave. Morreste? Perdes tudo! Rewards só são dados quando DESISTES ou VENCES.',
    suggestedSchedule: 'Mensal - ranking competitivo'
  },

  waveDefense: {
    id: 'waveDefense',
    name: '🛡️ Defesa da Seita',
    description: 'Inimigos atacam em waves! Quantos consegues sobreviver?',
    category: 'challenge',
    mechanic: 'survival',
    expMult: 1.5,
    dropMult: 1.0,
    stonesMult: 1.0,
    hours: 24,
    icon: '🛡️',
    color: 'from-amber-600 to-red-700',
    rarity: 'epic',
    specialMechanics: {
      waveCount: 50,
      survivalRewards: [
        { wave: 5, reward: 'Basic Supplies' },
        { wave: 15, reward: 'Rare Materials' },
        { wave: 30, reward: 'Epic Gear Box' },
        { wave: 50, reward: 'Sect Defender Title' }
      ]
    },
    howToParticipate: 'Waves automáticas a cada 30 segundos. Sobrevive o máximo possível!',
    suggestedSchedule: 'Semanal - competitivo'
  },

  // ============================================
  // 🔮 MYSTERY EVENTS
  // ============================================
  ancientRiddle: {
    id: 'ancientRiddle',
    name: '🔮 Enigma dos Ancestrais',
    description: 'Um enigma milenar foi descoberto! Resolve as pistas para encontrar o tesouro.',
    category: 'exploration',
    mechanic: 'mystery',
    expMult: 1.0,
    dropMult: 1.0,
    stonesMult: 1.0,
    hours: 72,
    icon: '🔮',
    color: 'from-purple-500 to-indigo-700',
    rarity: 'epic',
    specialMechanics: {
      clues: [
        'Onde o sol nasce, a primeira pista espera...',
        'O guardião de pedra guarda o segredo...',
        'Quando a lua chora, o caminho revela-se...'
      ],
      mysteryReward: 'Ancient Artifact + Unique Title'
    },
    howToParticipate: 'Encontra pistas escondidas pelo mundo. Combina-as para descobrir a localização do tesouro! Primeiro a resolver ganha reward exclusivo.',
    suggestedSchedule: 'Mensal - evento de comunidade'
  },

  // ============================================
  // 🌍 COMMUNITY GOAL EVENTS
  // ============================================
  demonExtermination: {
    id: 'demonExtermination',
    name: '⚔️ Extermínio Demoníaco',
    description: 'A comunidade deve eliminar 1 milhão de demónios! Todos contribuem, todos ganham.',
    category: 'social',
    mechanic: 'community_goal',
    expMult: 1.2,
    dropMult: 1.2,
    stonesMult: 1.2,
    hours: 168, // 1 semana
    icon: '⚔️',
    color: 'from-red-600 to-purple-700',
    rarity: 'epic',
    specialMechanics: {
      goalType: 'kills',
      goalTarget: 1000000,
      currentProgress: 0
    },
    howToParticipate: 'Cada demónio que matas conta para o objetivo global. Se a comunidade atingir 1M kills, TODOS recebem mega-rewards!',
    suggestedSchedule: 'Mensal - objetivo semanal'
  },

  // ============================================
  // 🎲 RISK/REWARD EVENTS
  // ============================================
  fortuneGamble: {
    id: 'fortuneGamble',
    name: '🎲 Aposta da Fortuna',
    description: 'Arrisca as tuas recompensas de combate! Quanto mais arriscas, mais podes ganhar... ou perder.',
    category: 'challenge',
    mechanic: 'double_or_nothing',
    expMult: 1.0,
    dropMult: 1.0,
    stonesMult: 1.0,
    hours: 24,
    icon: '🎲',
    color: 'from-green-500 to-yellow-500',
    rarity: 'rare',
    specialMechanics: {
      riskLevels: [
        { risk: 25, reward: 150 },  // 25% de perder tudo, 150% reward
        { risk: 50, reward: 200 },  // 50% de perder tudo, 200% reward
        { risk: 75, reward: 400 }   // 75% de perder tudo, 400% reward!
      ]
    },
    howToParticipate: 'Após cada combate, escolhe o nível de risco. Se ganhares a aposta, rewards multiplicados. Se perderes... nada!',
    suggestedSchedule: 'Flash event - adrenalina pura'
  },

  // ============================================
  // 🏯 SECRET REALM EVENTS
  // ============================================
  hiddenParadise: {
    id: 'hiddenParadise',
    name: '🏯 Paraíso Escondido',
    description: 'Um portal para uma dimensão secreta abriu! Inimigos únicos e drops exclusivos.',
    category: 'exploration',
    mechanic: 'secret_realm',
    expMult: 2.0,
    dropMult: 3.0,
    stonesMult: 2.0,
    hours: 48,
    icon: '🏯',
    color: 'from-teal-400 to-emerald-600',
    rarity: 'legendary',
    specialMechanics: {
      realmName: 'Paraíso Jade',
      realmDescription: 'Uma dimensão onde o tempo flui diferente. Inimigos poderosos guardam tesouros antigos.',
      uniqueDrops: ['Jade Essence', 'Paradise Blossom', 'Immortal Peach', 'Heaven\'s Tear']
    },
    howToParticipate: 'Entra no portal (disponível em qualquer cidade). Dentro, encontras inimigos exclusivos e drops que SÓ existem aqui!',
    suggestedSchedule: 'Mensal - conteúdo limitado'
  },

  // ============================================
  // 🔨 CRAFTING EVENTS
  // ============================================
  masterCraftsmanWeek: {
    id: 'masterCraftsmanWeek',
    name: '🔨 Semana do Mestre Artesão',
    description: 'Os Deuses do Forge abençoam os craftsmen! Sucesso garantido e materiais extras.',
    category: 'economy',
    mechanic: 'crafting_mastery',
    expMult: 1.0,
    dropMult: 1.5,
    stonesMult: 1.0,
    hours: 168,
    icon: '🔨',
    color: 'from-orange-500 to-amber-600',
    rarity: 'epic',
    specialMechanics: {
      craftSuccessBonus: 25, // +25% success chance
      freeRerollCount: 3     // 3 rerolls grátis por dia
    },
    howToParticipate: 'Crafting tem +25% success. Cada dia tens 3 rerolls GRÁTIS para stats de items. Forge especial disponível!',
    suggestedSchedule: 'Mensal - economia'
  },

  // ============================================
  // 💰 ECONOMY EVENTS
  // ============================================
  grandAuction: {
    id: 'grandAuction',
    name: '💰 Grande Leilão Imperial',
    description: 'Items legendários vão a leilão! Compete com outros jogadores por tesouros únicos.',
    category: 'economy',
    mechanic: 'auction_fever',
    expMult: 1.0,
    dropMult: 1.0,
    stonesMult: 1.5,
    hours: 48,
    icon: '💰',
    color: 'from-yellow-500 to-amber-600',
    rarity: 'legendary',
    specialMechanics: {},
    howToParticipate: 'Participa em leilões ao vivo! Items únicos que nunca mais estarão disponíveis. Market fees reduzidas em 50%.',
    suggestedSchedule: 'Trimestral - evento especial'
  },

  // ============================================
  // ☯️ KARMA EVENTS
  // ============================================
  karmaBalance: {
    id: 'karmaBalance',
    name: '☯️ Balança do Karma',
    description: 'As tuas ações têm consequências! Karma bom dá bónus, karma mau traz desafios.',
    category: 'social',
    mechanic: 'karma_system',
    expMult: 1.0,
    dropMult: 1.0,
    stonesMult: 1.0,
    hours: 72,
    icon: '☯️',
    color: 'from-white to-gray-800',
    rarity: 'epic',
    specialMechanics: {
      goodKarmaReward: 'Celestial Blessing (+20% all stats)',
      badKarmaConsequence: 'Demonic Curse (-10% stats, mas +50% drops)'
    },
    howToParticipate: 'Ajudar outros jogadores = Good Karma. Matar muitos mobs fracos = Bad Karma. No final, cada caminho tem rewards diferentes!',
    suggestedSchedule: 'Mensal - roleplay'
  },

  // ============================================
  // 🤝 MENTOR EVENTS
  // ============================================
  masterAndDisciple: {
    id: 'masterAndDisciple',
    name: '🤝 Mestre e Discípulo',
    description: 'Veteranos ganham bónus por ajudar novatos. Novatos ganham EXP massivo com mentores.',
    category: 'social',
    mechanic: 'mentor_blessing',
    expMult: 1.0,
    dropMult: 1.0,
    stonesMult: 1.0,
    hours: 168,
    icon: '🤝',
    color: 'from-blue-400 to-purple-500',
    rarity: 'rare',
    specialMechanics: {
      bonusPercent: 50 // Discípulos ganham +50% EXP quando agrupados com mentor
    },
    howToParticipate: 'Jogadores Level 50+ podem ser Mentores. Quando agrupados com Discípulos (Level 1-30), AMBOS ganham bónus únicos!',
    suggestedSchedule: 'Após campanhas de marketing'
  },

  // ============================================
  // 🎄 SEASONAL (mantendo alguns)
  // ============================================
  lunarNewYear: {
    id: 'lunarNewYear',
    name: '🧧 Ano Novo Lunar',
    description: 'Festival de Primavera! Red envelopes caem do céu com surpresas.',
    category: 'seasonal',
    mechanic: 'collection',
    expMult: 1.5,
    dropMult: 1.5,
    stonesMult: 2.0,
    hours: 168,
    icon: '🧧',
    color: 'from-red-500 to-yellow-500',
    rarity: 'legendary',
    specialMechanics: {
      collectibleItems: ['🧧 Red Envelope (Bronze)', '🧧 Red Envelope (Silver)', '🧧 Red Envelope (Gold)', '🧧 Red Envelope (Imperial)'],
      exchangeRewards: ['Lucky Coins', 'Festival Pet', 'Dragon Dance Title', 'Emperor\'s Blessing']
    },
    howToParticipate: 'Abre Red Envelopes que dropam de todos os inimigos! Cada envelope contém surpresas - desde stones até items raros.',
    suggestedSchedule: 'Chinese New Year'
  }
} as const;

// Helper functions
export function getEventsByCategory(category: EventCategory): EventPreset[] {
  return Object.values(EVENT_PRESETS).filter(event => event.category === category);
}

export function getEventsByMechanic(mechanic: EventMechanic): EventPreset[] {
  return Object.values(EVENT_PRESETS).filter(event => event.mechanic === mechanic);
}

export function getEventsByRarity(rarity: EventPreset['rarity']): EventPreset[] {
  return Object.values(EVENT_PRESETS).filter(event => event.rarity === rarity);
}

// Calendário sugerido mais interessante
export const SUGGESTED_CALENDAR = {
  weekly: {
    monday: { event: 'spiritualVeinEruption', reason: 'Começar a semana com progression' },
    wednesday: { event: 'fortuneGamble', reason: 'Mid-week excitement' },
    friday: { event: 'spiritBeastHunt', reason: 'Exploração de fim de semana' },
    weekend: { event: 'endlessTower', reason: 'Challenge competitivo' }
  },
  monthly: {
    firstWeek: { event: 'ancientDragonAwakens', reason: 'World boss mensal' },
    secondWeek: { event: 'hiddenParadise', reason: 'Conteúdo exclusivo' },
    thirdWeek: { event: 'masterCraftsmanWeek', reason: 'Economia e crafting' },
    fourthWeek: { event: 'demonExtermination', reason: 'Community goal' }
  },
  rotating: {
    elements: ['infernalAscension', 'tidalWave', 'thunderousWrath'],
    classes: ['swordSaintDay']
  }
};

export async function startPresetEvent(
  preset: keyof typeof EVENT_PRESETS
): Promise<{ success: boolean; error?: string }> {
  const event = EVENT_PRESETS[preset];
  return startEvent(
    event.name,
    event.description,
    event.expMult,
    event.dropMult,
    event.stonesMult,
    event.hours
  );
}
