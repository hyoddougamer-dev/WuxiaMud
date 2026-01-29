import React, { useState, useMemo } from 'react';
import { Trophy, X, Crown, Medal, Award, Lock, ChevronUp, Flame, Star, Sparkles } from 'lucide-react';

// Avatar paths
const MALE_AVATARS = Array.from({ length: 10 }, (_, i) => 
  `/assets/avatars/male/avatar_male_${String(i + 1).padStart(3, '0')}.png`
);
const FEMALE_AVATARS = Array.from({ length: 10 }, (_, i) => 
  `/assets/avatars/female/avatar_female_${String(i + 1).padStart(3, '0')}.png`
);
const ALL_AVATARS = [...MALE_AVATARS, ...FEMALE_AVATARS];

// Category icon paths
const CATEGORY_ICONS = {
  level: '/assets/icons/cultivation/qi_energy_swirl.png',
  kills: '/icons/weapons/wp_sword_t3.png',
  bosses: '/assets/icons/quests/bounty.png',
  fortune: '/assets/icons/cultivation/spirit_stone_crystal.png',
  arena: '/icons/weapons/wp_saber_t4.png',
  pvp: '/icons/weapons/wp_sword_t4.png',
  guild: '/assets/icons/cultivation/enlightment_halo.png'
};

// Ranking Categories Configuration
type CategoryId = 'level' | 'kills' | 'bosses' | 'fortune' | 'arena' | 'pvp' | 'guild';

interface CategoryConfig {
  id: CategoryId;
  label: string;
  shortLabel: string;
  iconPath: string;
  implemented: boolean;
  color: string;
  bgGradient: string;
  description: string;
}

const categoryConfigs: CategoryConfig[] = [
  {
    id: 'level',
    label: 'Cultivation Level',
    shortLabel: 'Level',
    iconPath: CATEGORY_ICONS.level,
    implemented: true,
    color: 'text-cyan-400',
    bgGradient: 'from-cyan-500/20 to-cyan-700/10',
    description: 'Highest cultivation realms'
  },
  {
    id: 'kills',
    label: 'Monster Kills',
    shortLabel: 'Kills',
    iconPath: CATEGORY_ICONS.kills,
    implemented: true,
    color: 'text-red-400',
    bgGradient: 'from-red-500/20 to-red-700/10',
    description: 'Total monsters slain'
  },
  {
    id: 'bosses',
    label: 'Boss Slayer',
    shortLabel: 'Bosses',
    iconPath: CATEGORY_ICONS.bosses,
    implemented: true,
    color: 'text-orange-400',
    bgGradient: 'from-orange-500/20 to-orange-700/10',
    description: 'Elite bosses defeated'
  },
  {
    id: 'fortune',
    label: 'Fortune',
    shortLabel: 'Wealth',
    iconPath: CATEGORY_ICONS.fortune,
    implemented: true,
    color: 'text-amber-400',
    bgGradient: 'from-amber-500/20 to-amber-700/10',
    description: 'Spirit Stones accumulated'
  },
  {
    id: 'arena',
    label: 'Arena Champion',
    shortLabel: 'Arena',
    iconPath: CATEGORY_ICONS.arena,
    implemented: false,
    color: 'text-purple-400',
    bgGradient: 'from-purple-500/20 to-purple-700/10',
    description: 'Arena victories'
  },
  {
    id: 'pvp',
    label: 'PvP Legend',
    shortLabel: 'PvP',
    iconPath: CATEGORY_ICONS.pvp,
    implemented: false,
    color: 'text-rose-400',
    bgGradient: 'from-rose-500/20 to-rose-700/10',
    description: 'Player kills in combat'
  },
  {
    id: 'guild',
    label: 'Guild Power',
    shortLabel: 'Guild',
    iconPath: CATEGORY_ICONS.guild,
    implemented: false,
    color: 'text-emerald-400',
    bgGradient: 'from-emerald-500/20 to-emerald-700/10',
    description: 'Combined guild strength'
  }
];

// Cultivation realm titles based on level (max 29)
function getCultivationTitle(level: number): string {
  if (level >= 27) return 'Golden Core Peak';
  if (level >= 24) return 'Golden Core Late';
  if (level >= 20) return 'Golden Core Early';
  if (level >= 17) return 'Foundation Peak';
  if (level >= 14) return 'Foundation Late';
  if (level >= 10) return 'Foundation Early';
  if (level >= 7) return 'Qi Condensation Peak';
  if (level >= 4) return 'Qi Condensation Late';
  return 'Qi Condensation Early';
}

// Ranking Entry
interface RankingEntry {
  rank: number;
  playerId: string;
  playerName: string;
  playerTitle: string;
  level: number;
  value: number;
  trend?: 'up' | 'down' | 'same';
  avatarPath: string;
}

// Generate mock rankings with realistic data
function generateMockRankings(category: CategoryId): RankingEntry[] {
  // Realistic player names for a wuxia game
  const mockPlayers = [
    { name: 'SwordSaint', level: 29 },
    { name: 'JadeEmperor', level: 28 },
    { name: 'DragonFist', level: 27 },
    { name: 'LotusBloom', level: 26 },
    { name: 'ThunderLord', level: 25 },
    { name: 'SilentBlade', level: 24 },
    { name: 'MoonShadow', level: 23 },
    { name: 'IronPalm', level: 22 },
    { name: 'WindDancer', level: 21 },
    { name: 'FlameHeart', level: 20 }
  ];

  // Value ranges based on category (realistic for max level 29)
  const getValueForCategory = (category: CategoryId, rank: number, level: number): number => {
    switch (category) {
      case 'level':
        return level; // Just return the level (max 29)
      case 'kills':
        // Top players at level 29 might have ~50k-100k kills
        return Math.floor((50000 + (rank === 1 ? 50000 : 0)) * (1 - rank * 0.08) * (0.9 + Math.random() * 0.2));
      case 'bosses':
        // Max 50-200 boss kills for top players
        return Math.floor((150 + (rank === 1 ? 50 : 0)) * (1 - rank * 0.08) * (0.9 + Math.random() * 0.2));
      case 'fortune':
        // Spirit Stones - top might have 500k-2M saved
        return Math.floor((1500000 + (rank === 1 ? 500000 : 0)) * (1 - rank * 0.08) * (0.9 + Math.random() * 0.2));
      default:
        return 1000 * (10 - rank);
    }
  };

  const trends: Array<'up' | 'down' | 'same'> = ['up', 'down', 'same'];

  return mockPlayers.map((player, index) => ({
    rank: index + 1,
    playerId: `player_${index}`,
    playerName: player.name,
    playerTitle: getCultivationTitle(player.level),
    level: player.level,
    value: getValueForCategory(category, index + 1, player.level),
    trend: trends[Math.floor(Math.random() * trends.length)],
    avatarPath: ALL_AVATARS[index % ALL_AVATARS.length]
  }));
}

// Medal Component for top 3
const RankMedal: React.FC<{ rank: number }> = ({ rank }) => {
  if (rank > 3) return null;

  const medalConfig = {
    1: {
      bg: 'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600',
      shadow: 'shadow-amber-500/50',
      icon: <Crown size={12} className="text-yellow-900" />
    },
    2: {
      bg: 'bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400',
      shadow: 'shadow-gray-400/50',
      icon: <Medal size={12} className="text-gray-700" />
    },
    3: {
      bg: 'bg-gradient-to-br from-orange-300 via-orange-400 to-orange-600',
      shadow: 'shadow-orange-500/50',
      icon: <Award size={12} className="text-orange-900" />
    }
  }[rank]!;

  return (
    <div className={`w-8 h-8 rounded-full ${medalConfig.bg} shadow-lg ${medalConfig.shadow} flex items-center justify-center`}>
      {medalConfig.icon}
    </div>
  );
};

// Ranking Row Component
const RankingRow: React.FC<{
  entry: RankingEntry;
  category: CategoryId;
  isCurrentPlayer?: boolean;
}> = ({ entry, category, isCurrentPlayer }) => {
  const config = categoryConfigs.find(c => c.id === category)!;

  const formatValue = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  const getRankStyle = () => {
    if (entry.rank === 1) return 'bg-gradient-to-r from-amber-900/40 via-amber-800/30 to-amber-900/40 border-amber-500/50';
    if (entry.rank === 2) return 'bg-gradient-to-r from-gray-700/40 via-gray-600/30 to-gray-700/40 border-gray-400/50';
    if (entry.rank === 3) return 'bg-gradient-to-r from-orange-900/40 via-orange-800/30 to-orange-900/40 border-orange-500/50';
    if (isCurrentPlayer) return 'bg-gradient-to-r from-cyan-900/40 via-cyan-800/30 to-cyan-900/40 border-cyan-500/50';
    return 'bg-gray-800/40 border-gray-700/30 hover:bg-gray-700/40';
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${getRankStyle()}`}>
      {/* Rank */}
      <div className="w-12 flex justify-center">
        {entry.rank <= 3 ? (
          <RankMedal rank={entry.rank} />
        ) : (
          <span className={`text-lg font-bold ${isCurrentPlayer ? 'text-cyan-400' : 'text-gray-400'}`}>
            #{entry.rank}
          </span>
        )}
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-700 shadow-lg border border-gray-600/50">
        <img 
          src={entry.avatarPath} 
          alt={entry.playerName}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials if image fails
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-cyan-600 to-blue-700">${entry.playerName.charAt(0).toUpperCase()}</div>`;
          }}
        />
      </div>

      {/* Player Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {/* Level Badge */}
          <span className="text-[10px] px-1.5 py-0.5 bg-cyan-900/50 text-cyan-400 rounded font-bold">
            Lv.{entry.level}
          </span>
          <span className={`font-bold ${entry.rank <= 3 ? 'text-white' : isCurrentPlayer ? 'text-cyan-300' : 'text-gray-200'}`}>
            {entry.playerName}
          </span>
          {entry.rank === 1 && <Sparkles size={14} className="text-amber-400" />}
          {isCurrentPlayer && <span className="text-[10px] px-1.5 py-0.5 bg-cyan-500/30 text-cyan-400 rounded font-bold uppercase">You</span>}
        </div>
        {entry.playerTitle && (
          <span className="text-[11px] text-gray-500">{entry.playerTitle}</span>
        )}
      </div>

      {/* Trend */}
      <div className="w-6">
        {entry.trend === 'up' && <ChevronUp size={16} className="text-green-400" />}
        {entry.trend === 'down' && <ChevronUp size={16} className="text-red-400 rotate-180" />}
      </div>

      {/* Value */}
      <div className={`text-right min-w-[80px] ${config.color}`}>
        <span className="text-lg font-bold">{formatValue(entry.value)}</span>
      </div>
    </div>
  );
};

// Category Tab Button
const CategoryTab: React.FC<{
  config: CategoryConfig;
  isActive: boolean;
  onClick: () => void;
}> = ({ config, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      disabled={!config.implemented}
      className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all group ${
        !config.implemented
          ? 'opacity-40 cursor-not-allowed'
          : isActive
            ? `bg-gradient-to-br ${config.bgGradient} border-2 border-current ${config.color} shadow-lg`
            : 'bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:text-white hover:border-gray-500'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden ${isActive ? 'ring-2 ring-current' : ''}`}>
        <img 
          src={config.iconPath} 
          alt={config.label}
          className="w-6 h-6 object-contain"
          style={{ filter: !config.implemented ? 'grayscale(100%)' : 'none' }}
        />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider">{config.shortLabel}</span>
      {!config.implemented && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-700 rounded-full flex items-center justify-center">
          <Lock size={8} className="text-gray-400" />
        </div>
      )}
    </button>
  );
};

// Props
interface LeaderboardPanelProps {
  currentPlayerId?: string;
  currentPlayerName?: string;
  currentPlayerLevel?: number;
  onClose: () => void;
}

export const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({
  currentPlayerId,
  currentPlayerName,
  currentPlayerLevel = 1,
  onClose
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('level');

  const rankings = useMemo(() => {
    return generateMockRankings(selectedCategory);
  }, [selectedCategory]);

  const activeConfig = categoryConfigs.find(c => c.id === selectedCategory)!;

  // Find current player's rank (based on their level)
  const playerRank = useMemo((): RankingEntry => {
    // Calculate realistic rank based on player level
    const baseRank = Math.max(1, 30 - currentPlayerLevel + Math.floor(Math.random() * 10));
    
    // Calculate value based on category and player level
    const getValue = (): number => {
      switch (selectedCategory) {
        case 'level':
          return currentPlayerLevel;
        case 'kills':
          return Math.floor(currentPlayerLevel * 1500 * (0.8 + Math.random() * 0.4));
        case 'bosses':
          return Math.floor(currentPlayerLevel * 5 * (0.8 + Math.random() * 0.4));
        case 'fortune':
          return Math.floor(currentPlayerLevel * 10000 * (0.8 + Math.random() * 0.4));
        default:
          return currentPlayerLevel * 100;
      }
    };
    
    return {
      rank: baseRank,
      playerId: currentPlayerId || 'current_player',
      playerName: currentPlayerName || 'You',
      playerTitle: getCultivationTitle(currentPlayerLevel),
      level: currentPlayerLevel,
      value: getValue(),
      trend: 'up' as const,
      avatarPath: MALE_AVATARS[0] // Default to first male avatar for current player
    };
  }, [currentPlayerId, currentPlayerName, currentPlayerLevel, selectedCategory]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-[700px] max-h-[85vh] bg-gradient-to-br from-[#1a1f2e] via-[#151820] to-[#0f1218] border-2 border-amber-500/30 rounded-2xl shadow-2xl shadow-amber-500/10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-amber-900/40 via-amber-800/20 to-amber-900/40 border-b border-amber-500/30 px-6 py-5">
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl" />
          </div>

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30 flex items-center justify-center">
                <Trophy size={28} className="text-white drop-shadow-lg" />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500">
                  Hall of Legends
                </h2>
                <p className="text-sm text-amber-200/60 mt-0.5">Witness the mightiest cultivators</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
            >
              <X size={22} className="text-gray-400 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-6 py-4 border-b border-white/5 bg-black/20">
          <div className="flex items-center justify-center gap-2">
            {categoryConfigs.map(config => (
              <CategoryTab
                key={config.id}
                config={config}
                isActive={selectedCategory === config.id}
                onClick={() => config.implemented && setSelectedCategory(config.id)}
              />
            ))}
          </div>
        </div>

        {/* Category Description */}
        <div className={`px-6 py-3 bg-gradient-to-r ${activeConfig.bgGradient} border-b border-white/5`}>
          <div className="flex items-center justify-center gap-2">
            <Flame size={14} className={activeConfig.color} />
            <span className={`text-sm font-medium ${activeConfig.color}`}>
              {activeConfig.description}
            </span>
            <Flame size={14} className={activeConfig.color} />
          </div>
        </div>

        {/* Rankings List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {rankings.map(entry => (
            <RankingRow
              key={entry.playerId}
              entry={entry}
              category={selectedCategory}
              isCurrentPlayer={entry.playerId === currentPlayerId}
            />
          ))}

          {/* Current Player Position (if not in top 10) */}
          {!rankings.find(r => r.playerId === currentPlayerId) && (
            <>
              <div className="flex items-center justify-center gap-3 py-3 text-gray-500">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                <span className="text-xs uppercase tracking-wider">Your Position</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
              </div>
              <RankingRow
                entry={playerRank}
                category={selectedCategory}
                isCurrentPlayer={true}
              />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-black/30">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <Star size={12} className="text-amber-500" />
              <span>Rankings update every hour</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <ChevronUp size={12} className="text-green-400" />
                <span>Climbing</span>
              </div>
              <div className="flex items-center gap-1">
                <ChevronUp size={12} className="text-red-400 rotate-180" />
                <span>Falling</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPanel;
