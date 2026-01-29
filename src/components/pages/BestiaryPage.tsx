import React, { useState, useMemo } from 'react';
import { Book, Search, Skull, MapPin, Gem, ChevronDown, ChevronUp, Sword, Shield, Heart, Zap, Package, Target, Eye, EyeOff, Trophy, Gift, CheckCircle, Lock, Sparkles } from 'lucide-react';
import { mobDefinitions, mobImages, worldMap, bestiaryMap } from '../../data/constants';
import { ResourceIcon } from '../ui/GameIcon';
import { mobDropConfigs, getClassTokenById } from '../../data/dropSystem';
import { 
  mobKillMilestones, 
  discoveryMilestones, 
  realmMasteryMilestones, 
  tagMasteryMilestones,
  getDiscoveredCount,
  getTagKills,
  getRealmMasteryProgress,
  getNextMobMilestone,
  getClaimableRewards,
  calculateBestiaryBonuses,
  getMobRealm,
  ClaimableReward
} from '../../data/bestiaryRewards';

interface BestiaryProgress {
  claimedDiscovery: number[];
  claimedMobMilestones: Record<number, number[]>;
  claimedRealmMastery: string[];
  claimedTagMastery: Record<string, number[]>;
}

interface BestiaryPageProps {
  killCounter?: Record<number, number>;
  bestiaryProgress?: BestiaryProgress;
  onClaimReward?: (reward: ClaimableReward) => void;
}

// Get realm from level
const getRealmFromLevel = (level: number): string => {
  if (level <= 9) return 'Qi Condensation';
  if (level <= 19) return 'Foundation Est.';
  return 'Golden Core';
};

// Get quality color
const getQualityColor = (quality: string): string => {
  switch (quality) {
    case 'Normal': return 'text-gray-400 border-gray-500';
    case 'Trainee': return 'text-green-400 border-green-500';
    case 'Elite': return 'text-blue-400 border-blue-500';
    case 'Epic': return 'text-purple-400 border-purple-500';
    case 'Legendary': return 'text-amber-400 border-amber-500';
    default: return 'text-gray-400 border-gray-500';
  }
};

const getQualityBg = (quality: string): string => {
  switch (quality) {
    case 'Normal': return 'bg-gray-900/50';
    case 'Trainee': return 'bg-green-900/30';
    case 'Elite': return 'bg-blue-900/30';
    case 'Epic': return 'bg-purple-900/30';
    case 'Legendary': return 'bg-amber-900/30 animate-pulse';
    default: return 'bg-gray-900/50';
  }
};

// Get locations where mob spawns
const getMobLocations = (mobId: number): string[] => {
  const locations: string[] = [];
  Object.entries(bestiaryMap).forEach(([coords, mobIds]) => {
    if ((mobIds as number[]).includes(mobId)) {
      const zone = worldMap[coords];
      if (zone) {
        locations.push(zone.name);
      }
    }
  });
  return locations;
};

// Get mob tags for display
const getMobTags = (mobId: number): string[] => {
  const config = mobDropConfigs[mobId];
  return config?.tags || [];
};

// Get class token drop info
const getClassTokenDrop = (mobId: number): { name: string; classFor: string } | null => {
  const config = mobDropConfigs[mobId];
  if (!config?.classToken) return null;
  const token = getClassTokenById(config.classToken);
  if (!token) return null;
  return { name: token.name, classFor: token.classFor };
};

export const BestiaryPage: React.FC<BestiaryPageProps> = ({ 
  killCounter = {}, 
  bestiaryProgress = { claimedDiscovery: [], claimedMobMilestones: {}, claimedRealmMastery: [], claimedTagMastery: {} },
  onClaimReward 
}) => {
  const [activeTab, setActiveTab] = useState<'creatures' | 'rewards'>('creatures');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRealm, setSelectedRealm] = useState<string>('all');
  const [selectedQuality, setSelectedQuality] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'level' | 'kills' | 'name'>('level');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedMob, setExpandedMob] = useState<number | null>(null);
  const [showOnlyDiscovered, setShowOnlyDiscovered] = useState(false);

  // Calculate stats
  const totalKills = Object.values(killCounter).reduce((sum, k) => sum + k, 0);
  const discoveredCount = getDiscoveredCount(killCounter);
  
  // Get claimable rewards
  const claimableRewards = useMemo(() => getClaimableRewards(
    killCounter,
    bestiaryProgress.claimedDiscovery || [],
    bestiaryProgress.claimedMobMilestones || {},
    bestiaryProgress.claimedRealmMastery || [],
    bestiaryProgress.claimedTagMastery || {}
  ), [killCounter, bestiaryProgress]);

  // Calculate active bonuses
  const bonuses = useMemo(() => calculateBestiaryBonuses(
    killCounter,
    bestiaryProgress.claimedDiscovery || [],
    bestiaryProgress.claimedMobMilestones || {},
    bestiaryProgress.claimedRealmMastery || [],
    bestiaryProgress.claimedTagMastery || {}
  ), [killCounter, bestiaryProgress]);

  // Filter and sort mobs
  const filteredMobs = useMemo(() => {
    let mobs = [...mobDefinitions];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      mobs = mobs.filter(m => 
        m.name.toLowerCase().includes(term) ||
        m.drop?.toLowerCase().includes(term)
      );
    }

    if (selectedRealm !== 'all') {
      mobs = mobs.filter(m => getRealmFromLevel(m.level) === selectedRealm);
    }

    if (selectedQuality !== 'all') {
      mobs = mobs.filter(m => m.quality === selectedQuality);
    }

    if (showOnlyDiscovered) {
      mobs = mobs.filter(m => (killCounter[m.id] || 0) > 0);
    }

    mobs.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'level') comparison = a.level - b.level;
      else if (sortBy === 'kills') comparison = (killCounter[a.id] || 0) - (killCounter[b.id] || 0);
      else if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return mobs;
  }, [searchTerm, selectedRealm, selectedQuality, sortBy, sortOrder, showOnlyDiscovered, killCounter]);

  const toggleSort = (newSortBy: 'level' | 'kills' | 'name') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  // Calculate total bonus percentage
  const totalBonusPercent = bonuses.globalDropRate + bonuses.globalExpBonus + bonuses.globalAtkBonus;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#050608]">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/40 via-violet-900/40 to-purple-900/40 border-b-2 border-purple-600/40 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Book className="text-purple-400" size={28} />
            <div>
              <h2 className="text-xl font-bold text-purple-400 font-serif">Bestiary</h2>
              <p className="text-xs text-gray-400">Codex of encountered beasts and demons</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center px-4 py-2 bg-black/40 rounded-lg border border-purple-500/20">
              <p className="text-[10px] text-gray-500 uppercase">Discovered</p>
              <p className="text-lg font-bold text-purple-400">{discoveredCount} / {mobDefinitions.length}</p>
            </div>
            <div className="text-center px-4 py-2 bg-black/40 rounded-lg border border-red-500/20">
              <p className="text-[10px] text-gray-500 uppercase">Total Kills</p>
              <p className="text-lg font-bold text-red-400">{totalKills.toLocaleString()}</p>
            </div>
            {totalBonusPercent > 0 && (
              <div className="text-center px-4 py-2 bg-black/40 rounded-lg border border-green-500/20">
                <p className="text-[10px] text-gray-500 uppercase">Bonuses</p>
                <p className="text-lg font-bold text-green-400">+{totalBonusPercent}%</p>
              </div>
            )}
            {claimableRewards.length > 0 && (
              <div className="relative">
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-[10px] font-bold text-black animate-bounce">
                  {claimableRewards.length}
                </div>
                <button
                  onClick={() => setActiveTab('rewards')}
                  className="px-4 py-2 bg-amber-500/20 border border-amber-500 rounded-lg text-amber-400 hover:bg-amber-500/30 transition-all"
                >
                  <Gift size={20} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('creatures')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'creatures' 
                ? 'bg-purple-600 text-white' 
                : 'bg-black/40 text-gray-400 hover:text-white'
            }`}
          >
            <Book size={14} /> Creatures
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'rewards' 
                ? 'bg-purple-600 text-white' 
                : 'bg-black/40 text-gray-400 hover:text-white'
            }`}
          >
            <Trophy size={14} /> Rewards
            {claimableRewards.length > 0 && (
              <span className="px-2 py-0.5 bg-amber-500 text-black text-[10px] rounded-full font-bold">
                {claimableRewards.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* CREATURES TAB */}
      {activeTab === 'creatures' && (
        <>
          {/* Filters Bar */}
          <div className="bg-[#0a0c10] border-b border-[#2a2f3a] px-6 py-3">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or drop..."
                  className="w-full pl-9 pr-4 py-2 bg-[#151820] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <select
                value={selectedRealm}
                onChange={(e) => setSelectedRealm(e.target.value)}
                className="px-3 py-2 bg-[#151820] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Realms</option>
                <option value="Qi Condensation">Qi Condensation (1-9)</option>
                <option value="Foundation Est.">Foundation Est. (10-19)</option>
                <option value="Golden Core">Golden Core (20+)</option>
              </select>

              <select
                value={selectedQuality}
                onChange={(e) => setSelectedQuality(e.target.value)}
                className="px-3 py-2 bg-[#151820] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Qualities</option>
                <option value="Normal">Normal</option>
                <option value="Trainee">Trainee</option>
                <option value="Elite">Elite</option>
                <option value="Epic">Epic</option>
                <option value="Legendary">Legendary</option>
              </select>

              <div className="flex items-center gap-1 bg-[#151820] border border-gray-700 rounded-lg p-1">
                <button
                  onClick={() => toggleSort('level')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${sortBy === 'level' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  Level {sortBy === 'level' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => toggleSort('kills')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${sortBy === 'kills' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  Kills {sortBy === 'kills' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => toggleSort('name')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${sortBy === 'name' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </div>

              <button
                onClick={() => setShowOnlyDiscovered(!showOnlyDiscovered)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  showOnlyDiscovered 
                    ? 'bg-purple-600/30 border border-purple-500 text-purple-400' 
                    : 'bg-[#151820] border border-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                {showOnlyDiscovered ? <Eye size={14} /> : <EyeOff size={14} />}
                {showOnlyDiscovered ? 'Discovered' : 'Show All'}
              </button>
            </div>
          </div>

          {/* Mob List */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMobs.map((mob) => {
                const kills = killCounter[mob.id] || 0;
                const isDiscovered = kills > 0;
                const isExpanded = expandedMob === mob.id;
                const locations = getMobLocations(mob.id);
                const tags = getMobTags(mob.id);
                const classToken = getClassTokenDrop(mob.id);
                const mobImage = mobImages[mob.name];
                const nextMilestone = getNextMobMilestone(kills);
                const claimedMilestones = bestiaryProgress.claimedMobMilestones?.[mob.id] || [];

                return (
                  <div
                    key={mob.id}
                    className={`
                      rounded-xl border-2 overflow-hidden transition-all duration-200 cursor-pointer
                      ${getQualityColor(mob.quality)} ${getQualityBg(mob.quality)}
                      ${isExpanded ? 'ring-2 ring-purple-500/50' : ''}
                      ${!isDiscovered ? 'opacity-60 grayscale hover:opacity-80 hover:grayscale-0' : 'hover:scale-[1.02]'}
                    `}
                    onClick={() => setExpandedMob(isExpanded ? null : mob.id)}
                  >
                    <div className="p-4 flex gap-4">
                      <div className={`w-16 h-16 rounded-lg border-2 overflow-hidden flex-shrink-0 ${getQualityColor(mob.quality)}`}>
                        {mobImage ? (
                          <img src={mobImage} alt={mob.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-black/50">
                            <Skull size={24} className="text-gray-600" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className={`font-bold truncate ${isDiscovered ? '' : 'blur-sm'}`}>
                              {isDiscovered ? mob.name : '???'}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getQualityColor(mob.quality)}`}>
                                {mob.quality}
                              </span>
                              <span className="text-[10px] text-gray-500">Lv.{mob.level}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="flex items-center gap-1 text-red-400">
                              <Skull size={12} />
                              <span className="text-sm font-bold">{kills}</span>
                            </div>
                          </div>
                        </div>

                        {/* Next Milestone Progress */}
                        {isDiscovered && nextMilestone && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-[9px] text-gray-500 mb-1">
                              <span>Next: {nextMilestone.kills.toLocaleString()}</span>
                              <span>{nextMilestone.label}</span>
                            </div>
                            <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-amber-500 transition-all"
                                style={{ width: `${Math.min((kills / nextMilestone.kills) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Quick Stats */}
                        <div className="flex items-center gap-3 mt-2 text-[10px]">
                          <span className="flex items-center gap-1 text-red-400"><ResourceIcon type="hp" size={10} /> {mob.hp}</span>
                          <span className="flex items-center gap-1 text-amber-400"><Sword size={10} /> {mob.atk}</span>
                          <span className="flex items-center gap-1 text-blue-400"><Shield size={10} /> {mob.def}</span>
                        </div>
                      </div>

                      <div className="flex-shrink-0 self-center">
                        {isExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 border-t border-white/10 space-y-3">
                        {/* Milestones */}
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-2 flex items-center gap-1">
                            <Trophy size={10} /> Kill Milestones
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {mobKillMilestones.map((m, i) => {
                              const reached = kills >= m.kills;
                              const claimed = claimedMilestones.includes(m.kills);
                              return (
                                <span 
                                  key={i} 
                                  className={`text-[9px] px-2 py-1 rounded border flex items-center gap-0.5 ${
                                    claimed ? 'bg-green-900/30 border-green-500/50 text-green-400' :
                                    reached ? 'bg-amber-900/30 border-amber-500/50 text-amber-400' :
                                    'bg-gray-900/30 border-gray-600/50 text-gray-500'
                                  }`}
                                >
                                  {claimed ? <CheckCircle size={10} /> : reached ? <Sparkles size={10} /> : null} {m.kills.toLocaleString()}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* Locations */}
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center gap-1">
                            <MapPin size={10} /> Locations
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {locations.length > 0 ? locations.map((loc, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 bg-blue-900/30 border border-blue-500/30 rounded-full text-blue-400">{loc}</span>
                            )) : (
                              <span className="text-[10px] text-gray-500 italic">Unknown</span>
                            )}
                          </div>
                        </div>

                        {/* Drops */}
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center gap-1">
                            <Package size={10} /> Drops
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {mob.drop && (
                              <span className="text-[10px] px-2 py-0.5 bg-amber-900/30 border border-amber-500/30 rounded-full text-amber-400">{mob.drop}</span>
                            )}
                            {classToken && (
                              <span className="text-[10px] px-2 py-0.5 bg-purple-900/30 border border-purple-500/30 rounded-full text-purple-400 flex items-center gap-0.5"><Sparkles size={10} /> {classToken.name}</span>
                            )}
                          </div>
                        </div>

                        {/* Tags */}
                        {tags.length > 0 && (
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center gap-1">
                              <Target size={10} /> Tags
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {tags.map((tag, i) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 bg-gray-800 border border-gray-600 rounded-full text-gray-400 capitalize">{tag}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Detailed Stats */}
                        <div className="grid grid-cols-5 gap-2 pt-2 border-t border-white/5">
                          <div className="text-center p-2 bg-black/30 rounded-lg">
                            <ResourceIcon type="hp" size={14} className="mx-auto mb-1" />
                            <p className="text-xs font-bold text-red-400">{mob.hp}</p>
                            <p className="text-[8px] text-gray-500">HP</p>
                          </div>
                          <div className="text-center p-2 bg-black/30 rounded-lg">
                            <Sword size={14} className="mx-auto text-amber-400 mb-1" />
                            <p className="text-xs font-bold text-amber-400">{mob.atk}</p>
                            <p className="text-[8px] text-gray-500">ATK</p>
                          </div>
                          <div className="text-center p-2 bg-black/30 rounded-lg">
                            <Shield size={14} className="mx-auto text-blue-400 mb-1" />
                            <p className="text-xs font-bold text-blue-400">{mob.def}</p>
                            <p className="text-[8px] text-gray-500">DEF</p>
                          </div>
                          <div className="text-center p-2 bg-black/30 rounded-lg">
                            <ResourceIcon type="exp" size={14} className="mx-auto mb-1" />
                            <p className="text-xs font-bold text-green-400">{mob.exp}</p>
                            <p className="text-[8px] text-gray-500">EXP</p>
                          </div>
                          <div className="text-center p-2 bg-black/30 rounded-lg">
                            <ResourceIcon type="spiritStone" size={14} className="mx-auto mb-1" />
                            <p className="text-xs font-bold text-cyan-400">{mob.stones}</p>
                            <p className="text-[8px] text-gray-500">Stones</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filteredMobs.length === 0 && (
              <div className="text-center py-12">
                <Skull className="mx-auto text-gray-600 mb-4" size={48} />
                <p className="text-gray-500">No creatures match your search.</p>
                <button
                  onClick={() => { setSearchTerm(''); setSelectedRealm('all'); setSelectedQuality('all'); setShowOnlyDiscovered(false); }}
                  className="mt-4 px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-600/30 transition-all"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* REWARDS TAB */}
      {activeTab === 'rewards' && (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Claimable Rewards */}
          {claimableRewards.length > 0 && (
            <div className="bg-gradient-to-r from-amber-900/30 to-amber-800/20 border-2 border-amber-500/50 rounded-xl p-4">
              <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
                <Gift className="animate-bounce" size={20} /> Rewards Ready to Claim ({claimableRewards.length})
              </h3>
              <div className="grid gap-2">
                {claimableRewards.map((reward, i) => (
                  <div key={i} className="flex items-center justify-between bg-black/40 rounded-lg p-3 border border-amber-500/30">
                    <div>
                      <p className="text-sm text-white font-bold">{reward.label}</p>
                      <p className="text-[10px] text-gray-400 capitalize">{reward.type} milestone</p>
                    </div>
                    <button
                      onClick={() => onClaimReward?.(reward)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-sm transition-all flex items-center gap-2"
                    >
                      <Sparkles size={14} /> Claim
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Discovery Milestones */}
          <div className="bg-[#0a0c10] border border-purple-500/30 rounded-xl p-4">
            <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
              <Eye size={20} /> Discovery Milestones
            </h3>
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progress</span>
                <span>{discoveredCount} / 44 discovered</span>
              </div>
              <div className="h-3 bg-black/50 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400" style={{ width: `${(discoveredCount / 44) * 100}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              {discoveryMilestones.map((m, i) => {
                const reached = discoveredCount >= m.count;
                const claimed = (bestiaryProgress.claimedDiscovery || []).includes(m.count);
                return (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${
                    claimed ? 'bg-green-900/20 border-green-500/30' :
                    reached ? 'bg-amber-900/20 border-amber-500/30' :
                    'bg-black/30 border-gray-700/50'
                  }`}>
                    <div className="flex items-center gap-3">
                      {claimed ? <CheckCircle size={16} className="text-green-400" /> :
                       reached ? <Gift size={16} className="text-amber-400" /> :
                       <Lock size={16} className="text-gray-500" />}
                      <div>
                        <p className={`text-sm font-bold ${claimed ? 'text-green-400' : reached ? 'text-amber-400' : 'text-gray-400'}`}>
                          {m.count} Mobs Discovered
                        </p>
                        <p className="text-[10px] text-gray-500">{m.label}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold ${reached ? 'text-white' : 'text-gray-500'}`}>
                      {discoveredCount}/{m.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Realm Mastery */}
          <div className="bg-[#0a0c10] border border-cyan-500/30 rounded-xl p-4">
            <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
              <Trophy size={20} /> Realm Mastery (500 kills each mob)
            </h3>
            <div className="space-y-3">
              {(['qi', 'foundation', 'golden'] as const).map(realm => {
                const def = realmMasteryMilestones[realm];
                const progress = getRealmMasteryProgress(killCounter, realm);
                const complete = progress.complete >= progress.total;
                const claimed = (bestiaryProgress.claimedRealmMastery || []).includes(realm);
                return (
                  <div key={realm} className={`p-3 rounded-lg border ${
                    claimed ? 'bg-green-900/20 border-green-500/30' :
                    complete ? 'bg-amber-900/20 border-amber-500/30' :
                    'bg-black/30 border-gray-700/50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {claimed ? <CheckCircle size={14} className="text-green-400" /> :
                         complete ? <Gift size={14} className="text-amber-400" /> :
                         <Lock size={14} className="text-gray-500" />}
                        <span className={`text-sm font-bold ${claimed ? 'text-green-400' : complete ? 'text-amber-400' : 'text-gray-300'}`}>
                          {def.name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">{progress.complete}/{progress.total} mobs</span>
                    </div>
                    <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400" style={{ width: `${(progress.complete / progress.total) * 100}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">{def.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tag Mastery */}
          <div className="bg-[#0a0c10] border border-amber-500/30 rounded-xl p-4">
            <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
              <Target size={20} /> Tag Mastery
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(tagMasteryMilestones).map(([tag, tagDef]) => {
                const tagKills = getTagKills(killCounter, tag);
                const claimed = bestiaryProgress.claimedTagMastery?.[tag] || [];
                const maxMilestone = tagDef.milestones[tagDef.milestones.length - 1].kills;
                return (
                  <div key={tag} className="bg-black/30 border border-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg">{tagDef.icon}</span>
                      <span className="text-sm font-bold text-gray-300">{tagDef.name}</span>
                      <span className="text-xs text-gray-500">{tagKills.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-black/50 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400" style={{ width: `${Math.min((tagKills / maxMilestone) * 100, 100)}%` }} />
                    </div>
                    <div className="flex gap-1">
                      {tagDef.milestones.map((m, i) => {
                        const reached = tagKills >= m.kills;
                        const isClaimed = claimed.includes(m.kills);
                        return (
                          <span key={i} className={`text-[8px] px-1.5 py-0.5 rounded ${
                            isClaimed ? 'bg-green-900/50 text-green-400' :
                            reached ? 'bg-amber-900/50 text-amber-400' :
                            'bg-gray-900/50 text-gray-500'
                          }`}>
                            {m.kills >= 1000 ? `${m.kills/1000}k` : m.kills}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Bonuses Summary */}
          {(bonuses.titles.length > 0 || totalBonusPercent > 0 || bonuses.flatHpBonus > 0) && (
            <div className="bg-[#0a0c10] border border-green-500/30 rounded-xl p-4">
              <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                <Sparkles size={20} /> Active Bonuses
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {bonuses.globalDropRate > 0 && (
                  <div className="text-center p-3 bg-black/30 rounded-lg border border-green-500/20">
                    <p className="text-lg font-bold text-green-400">+{bonuses.globalDropRate}%</p>
                    <p className="text-[10px] text-gray-500">Drop Rate</p>
                  </div>
                )}
                {bonuses.globalExpBonus > 0 && (
                  <div className="text-center p-3 bg-black/30 rounded-lg border border-blue-500/20">
                    <p className="text-lg font-bold text-blue-400">+{bonuses.globalExpBonus}%</p>
                    <p className="text-[10px] text-gray-500">EXP Bonus</p>
                  </div>
                )}
                {bonuses.globalAtkBonus > 0 && (
                  <div className="text-center p-3 bg-black/30 rounded-lg border border-red-500/20">
                    <p className="text-lg font-bold text-red-400">+{bonuses.globalAtkBonus}%</p>
                    <p className="text-[10px] text-gray-500">ATK Bonus</p>
                  </div>
                )}
                {bonuses.flatHpBonus > 0 && (
                  <div className="text-center p-3 bg-black/30 rounded-lg border border-pink-500/20">
                    <p className="text-lg font-bold text-pink-400">+{bonuses.flatHpBonus}</p>
                    <p className="text-[10px] text-gray-500">Flat HP</p>
                  </div>
                )}
              </div>
              {bonuses.titles.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-400 mb-2">Earned Titles:</p>
                  <div className="flex flex-wrap gap-2">
                    {bonuses.titles.map((title, i) => (
                      <span key={i} className="px-3 py-1 bg-purple-900/30 border border-purple-500/50 rounded-full text-purple-400 text-sm font-bold flex items-center gap-1">
                        <Trophy size={12} /> {title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
