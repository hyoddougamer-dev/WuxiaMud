import React, { useState, useMemo } from 'react';
import { 
  X, Crown, Sword, Sparkles, Map, Hammer, Package, Star,
  Check, Lock, ChevronRight, Trophy, Award
} from 'lucide-react';
import {
  ALL_TITLES,
  TITLE_RARITY_STYLES,
  TITLE_CATEGORIES,
  getTitleById,
  getTitleProgress,
  checkTitleRequirement,
  type TitleDefinition,
  type TitleCategory,
  type TitleRarity,
  type PlayerTitleState,
  type PlayerStats,
  type UnlockedTitle,
} from '../data/titlesSystem';

// ============================================
// CATEGORY ICONS
// ============================================
const CategoryIcon: React.FC<{ category: TitleCategory; size?: number; className?: string }> = ({ 
  category, 
  size = 16, 
  className = '' 
}) => {
  const props = { size, className };
  switch (category) {
    case 'combat': return <Sword {...props} />;
    case 'cultivation': return <Sparkles {...props} />;
    case 'exploration': return <Map {...props} />;
    case 'crafting': return <Hammer {...props} />;
    case 'collection': return <Package {...props} />;
    case 'special': return <Star {...props} />;
    default: return <Trophy {...props} />;
  }
};

// ============================================
// TITLE CARD COMPONENT
// ============================================

// Helper to get CSS class for title rarity
const getTitleClass = (rarity: TitleRarity): string => {
  switch (rarity) {
    case 'gray': return 'title-mortal';
    case 'green': return 'title-earth';
    case 'blue': return 'title-heaven';
    case 'purple': return 'title-spirit';
    case 'gold': return 'title-immortal';
    default: return 'title-mortal';
  }
};

const TitleCard: React.FC<{
  title: TitleDefinition;
  isUnlocked: boolean;
  isActive: boolean;
  progress: number;
  unlockedAt?: Date;
  onSelect: () => void;
}> = ({ title, isUnlocked, isActive, progress, unlockedAt, onSelect }) => {
  const style = TITLE_RARITY_STYLES[title.rarity];
  const titleClass = getTitleClass(title.rarity);
  const isHighRarity = title.rarity === 'purple' || title.rarity === 'gold';
  
  return (
    <div
      onClick={isUnlocked ? onSelect : undefined}
      className={`relative p-4 rounded-xl border-2 transition-all ${
        isUnlocked
          ? `${style.border} ${style.bg} cursor-pointer hover:scale-[1.02] ${
              isActive ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#1a1f2e]' : ''
            } ${isHighRarity ? (title.rarity === 'gold' ? 'shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'shadow-[0_0_15px_rgba(168,85,247,0.25)]') : ''}`
          : 'border-gray-700/30 bg-gray-900/30 opacity-60'
      }`}
    >
      {/* Active Badge */}
      {isActive && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/50">
          <Crown size={14} className="text-white" />
        </div>
      )}
      
      {/* Lock Icon for locked titles */}
      {!isUnlocked && (
        <div className="absolute top-3 right-3">
          <Lock size={16} className="text-gray-600" />
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg ${style.bg} border ${style.border} flex items-center justify-center ${isHighRarity && isUnlocked ? 'animate-pulse' : ''}`}>
          <CategoryIcon category={title.category} size={20} className={style.text} />
        </div>
        <div className="flex-1 min-w-0">
          {/* Title Name with special CSS class for unlocked titles */}
          {isUnlocked ? (
            <span className={`title-badge ${titleClass}`}>
              {title.name}
            </span>
          ) : (
            <h4 className="font-bold text-gray-500">{title.name}</h4>
          )}
          <p className="text-xs text-gray-500 mt-1">{title.namePT}</p>
        </div>
      </div>
      
      {/* Description */}
      <p className="text-xs text-gray-400 mt-3">{title.description}</p>
      
      {/* Progress or Unlocked Date */}
      {isUnlocked ? (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center gap-1 text-xs text-green-400">
            <Check size={12} />
            <span>Unlocked</span>
          </div>
          {unlockedAt && (
            <span className="text-[10px] text-gray-500">
              {new Date(unlockedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      ) : (
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className={`h-full ${style.bg.replace('/10', '/40')} transition-all`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN COMPONENT PROPS
// ============================================
interface TitlesModalProps {
  isOpen: boolean;
  onClose: () => void;
  titleState: PlayerTitleState;
  playerStats: PlayerStats;
  onSelectTitle: (titleId: string | null) => void;
}

// ============================================
// TITLES MODAL COMPONENT
// ============================================
export const TitlesModal: React.FC<TitlesModalProps> = ({
  isOpen,
  onClose,
  titleState,
  playerStats,
  onSelectTitle,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TitleCategory | 'all'>('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  
  // Get unlocked title IDs
  const unlockedIds = useMemo(() => {
    return new Set(titleState.unlockedTitles.map(u => u.titleId));
  }, [titleState.unlockedTitles]);
  
  // Filter titles
  const filteredTitles = useMemo(() => {
    let titles = [...ALL_TITLES];
    
    if (selectedCategory !== 'all') {
      titles = titles.filter(t => t.category === selectedCategory);
    }
    
    if (showUnlockedOnly) {
      titles = titles.filter(t => unlockedIds.has(t.id));
    }
    
    // Sort: unlocked first, then by rarity
    const rarityOrder: Record<TitleRarity, number> = { gray: 0, green: 1, blue: 2, purple: 3, gold: 4 };
    titles.sort((a, b) => {
      const aUnlocked = unlockedIds.has(a.id) ? 1 : 0;
      const bUnlocked = unlockedIds.has(b.id) ? 1 : 0;
      if (aUnlocked !== bUnlocked) return bUnlocked - aUnlocked;
      return rarityOrder[b.rarity] - rarityOrder[a.rarity];
    });
    
    return titles;
  }, [selectedCategory, showUnlockedOnly, unlockedIds]);
  
  // Get active title info
  const activeTitle = titleState.activeTitle ? getTitleById(titleState.activeTitle) : null;
  
  // Stats
  const totalTitles = ALL_TITLES.length;
  const unlockedCount = titleState.unlockedTitles.length;
  
  if (!isOpen) return null;
  
  const categories: { id: TitleCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'combat', label: 'Combat' },
    { id: 'cultivation', label: 'Cultivation' },
    { id: 'exploration', label: 'Exploration' },
    { id: 'crafting', label: 'Crafting' },
    { id: 'collection', label: 'Collection' },
    { id: 'special', label: 'Special' },
  ];
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-[900px] max-h-[85vh] bg-gradient-to-br from-[#1a1f2e] to-[#151820] border-2 border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900/40 to-amber-800/20 border-b border-amber-500/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Crown size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-amber-400">Titles</h2>
                <p className="text-sm text-gray-400">
                  {unlockedCount} / {totalTitles} Unlocked
                </p>
              </div>
            </div>
            
            {/* Active Title Display */}
            {activeTitle && (
              <div className="flex items-center gap-3 px-4 py-2 bg-black/30 rounded-xl border border-white/10">
                <span className="text-xs text-gray-500">Active:</span>
                <div className="flex items-center gap-2">
                  <CategoryIcon 
                    category={activeTitle.category} 
                    size={14} 
                    className={TITLE_RARITY_STYLES[activeTitle.rarity].text} 
                  />
                  <span className={`title-badge ${getTitleClass(activeTitle.rarity)}`}>
                    {activeTitle.name}
                  </span>
                </div>
                <button
                  onClick={() => onSelectTitle(null)}
                  className="ml-2 text-xs text-gray-500 hover:text-red-400 transition-colors"
                >
                  Remove
                </button>
              </div>
            )}
            
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* Filters Bar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-white/5 bg-black/20">
          {/* Category Tabs */}
          <div className="flex items-center gap-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-amber-600/30 text-amber-400 border border-amber-500/50'
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          
          <div className="flex-1" />
          
          {/* Toggle */}
          <button
            onClick={() => setShowUnlockedOnly(!showUnlockedOnly)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              showUnlockedOnly
                ? 'bg-green-600/30 text-green-400 border border-green-500/50'
                : 'bg-gray-800/50 text-gray-500 hover:text-white'
            }`}
          >
            <Check size={12} />
            Unlocked Only
          </button>
        </div>
        
        {/* Titles Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTitles.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {filteredTitles.map(title => {
                const isUnlocked = unlockedIds.has(title.id);
                const isActive = titleState.activeTitle === title.id;
                const unlock = titleState.unlockedTitles.find(u => u.titleId === title.id);
                const progress = getTitleProgress(title, playerStats);
                
                return (
                  <TitleCard
                    key={title.id}
                    title={title}
                    isUnlocked={isUnlocked}
                    isActive={isActive}
                    progress={progress}
                    unlockedAt={unlock?.unlockedAt}
                    onSelect={() => onSelectTitle(isActive ? null : title.id)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Award size={48} className="mb-4 opacity-30" />
              <p className="text-lg">No titles found</p>
              <p className="text-sm mt-1">
                {showUnlockedOnly ? 'Unlock more titles to see them here!' : 'Try a different category'}
              </p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-white/10 bg-black/30 px-6 py-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Click on an unlocked title to equip it • Your title appears next to your name</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                Mortal
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Earth
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                Heaven
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                Spirit
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                Immortal
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TitlesModal;
