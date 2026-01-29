// ============================================
// ENHANCED QUEST PANEL - WuxiaMUD
// Improved quest UI with lore integration
// ============================================

import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, ChevronRight, 
  Coins, MapPin, User, CheckCircle, XCircle, Repeat, Award,
  BookOpen, Swords, Shield, AlertTriangle, X, Filter,
  MessageCircle, Target, Sparkles, Crown, Scroll
} from 'lucide-react';
import type { Quest, QuestStatus, PlayerQuestLog, PlayerQuestState, QuestType } from '../../data/questSystem';
import { getQuestProgress, isQuestComplete, canAcceptQuest, hasOptionalObjectives } from '../../data/questSystem';
import { allQuests, getQuestById, getNPCById } from '../../data/questDatabase';
import { getPlayerSprite } from '../../data/combatAssets';
import { getItemById } from '../../utils/helpers';
import { questIcons } from '../../utils/iconSystem';

// Quest type icon component using images
const QuestTypeIcon: React.FC<{ type: QuestType; size?: number; className?: string }> = ({ type, size = 16, className = '' }) => {
    const getIconPath = () => {
        switch (type) {
            case 'main': return questIcons.main;
            case 'side': return questIcons.side;
            case 'daily': return questIcons.scroll;
            case 'bounty': return questIcons.bounty;
            case 'trial': return questIcons.achievement;
            default: return questIcons.scroll;
        }
    };
    
    return (
        <img 
            src={getIconPath()} 
            alt={type}
            className={`object-contain ${className}`}
            style={{ width: size, height: size }}
        />
    );
};

interface QuestPanelProps {
  questLog: PlayerQuestLog;
  playerLevel: number;
  playerName?: string;
  playerClass?: number;
  onAcceptQuest: (questId: string) => void;
  onAbandonQuest: (questId: string) => void;
  onCompleteQuest: (questId: string) => void;
  onClose: () => void;
}

type ViewMode = 'list' | 'detail';
type FilterTab = 'active' | 'available' | 'completed' | 'all';

// Quest type styling configuration
const QUEST_TYPE_CONFIG: Record<QuestType, {
  icon: React.ReactNode;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
}> = {
  main: {
    icon: <QuestTypeIcon type="main" size={14} />,
    name: 'Main Story',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/30',
    borderColor: 'border-yellow-500/50',
    glowColor: 'shadow-yellow-500/20'
  },
  side: {
    icon: <QuestTypeIcon type="side" size={14} />,
    name: 'Side Quest',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
    borderColor: 'border-blue-500/50',
    glowColor: 'shadow-blue-500/20'
  },
  daily: {
    icon: <QuestTypeIcon type="daily" size={14} />,
    name: 'Daily',
    color: 'text-green-400',
    bgColor: 'bg-green-900/30',
    borderColor: 'border-green-500/50',
    glowColor: 'shadow-green-500/20'
  },
  bounty: {
    icon: <QuestTypeIcon type="bounty" size={14} />,
    name: 'Bounty',
    color: 'text-red-400',
    bgColor: 'bg-red-900/30',
    borderColor: 'border-red-500/50',
    glowColor: 'shadow-red-500/20'
  },
  trial: {
    icon: <QuestTypeIcon type="trial" size={14} />,
    name: 'Trial',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/30',
    borderColor: 'border-purple-500/50',
    glowColor: 'shadow-purple-500/20'
  }
};

export const QuestPanel: React.FC<QuestPanelProps> = ({
  questLog,
  playerLevel,
  playerName = 'Cultivator',
  playerClass = 1,
  onAcceptQuest,
  onAbandonQuest,
  onCompleteQuest,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('active');
  const [selectedQuest, setSelectedQuest] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<QuestType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showDialogueView, setShowDialogueView] = useState(false);

  // Get active quests with full data
  const activeQuests = useMemo(() => {
    return questLog.active
      .map(state => {
        const quest = getQuestById(state.questId);
        return quest ? { quest, state } : null;
      })
      .filter((q): q is { quest: Quest; state: PlayerQuestState } => q !== null)
      .filter(q => typeFilter === 'all' || q.quest.type === typeFilter)
      .sort((a, b) => {
        // Main quests first
        if (a.quest.type === 'main' && b.quest.type !== 'main') return -1;
        if (a.quest.type !== 'main' && b.quest.type === 'main') return 1;
        // Then by progress
        return getQuestProgress(b.quest, b.state) - getQuestProgress(a.quest, a.state);
      });
  }, [questLog.active, typeFilter]);

  // Get available quests
  const availableQuests = useMemo((): Quest[] => {
    return allQuests
      .filter((quest: Quest) => {
        const check = canAcceptQuest(quest, playerLevel, questLog, allQuests);
        return check.canAccept;
      })
      .filter((q: Quest) => typeFilter === 'all' || q.type === typeFilter)
      .sort((a: Quest, b: Quest) => {
        if (a.type === 'main' && b.type !== 'main') return -1;
        if (a.type !== 'main' && b.type === 'main') return 1;
        return a.levelRequired - b.levelRequired;
      });
  }, [questLog, playerLevel, typeFilter]);

  // Get completed quests
  const completedQuests = useMemo(() => {
    return questLog.completed
      .map(id => getQuestById(id))
      .filter((q): q is Quest => q !== undefined)
      .filter(q => typeFilter === 'all' || q.type === typeFilter);
  }, [questLog.completed, typeFilter]);

  // Get the selected quest details
  const selectedQuestData = useMemo(() => {
    if (!selectedQuest) return null;
    const quest = getQuestById(selectedQuest);
    if (!quest) return null;
    const state = questLog.active.find(s => s.questId === selectedQuest);
    return { quest, state };
  }, [selectedQuest, questLog.active]);

  // Count badges - includes 'all' for type safety even though tab doesn't use it
  const counts: Record<FilterTab, number> = {
    active: activeQuests.length,
    available: availableQuests.length,
    completed: completedQuests.length,
    all: activeQuests.length + availableQuests.length + completedQuests.length
  };

  const renderQuestCard = (quest: Quest, state?: PlayerQuestState) => {
    const config = QUEST_TYPE_CONFIG[quest.type];
    const progress = state ? getQuestProgress(quest, state) : 0;
    const canComplete = state && isQuestComplete(quest, state);
    const isSelected = selectedQuest === quest.id;

    return (
      <div
        key={quest.id}
        onClick={() => setSelectedQuest(quest.id)}
        className={`
          relative p-3 rounded-lg cursor-pointer transition-all duration-200
          border ${config.borderColor} ${config.bgColor}
          hover:shadow-lg hover:${config.glowColor}
          ${isSelected ? 'ring-2 ring-cyan-400 scale-[1.02]' : ''}
          ${canComplete ? 'animate-pulse-subtle' : ''}
        `}
      >
        {/* Quest type badge */}
        <div className={`absolute -top-2 -left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${config.bgColor} border ${config.borderColor} ${config.color}`}>
          <span className="flex items-center gap-1">
            {config.icon}
            {config.name}
          </span>
        </div>

        {/* Quest content */}
        <div className="mt-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-white text-sm leading-tight">{quest.name}</h4>
            {quest.repeatable && <Repeat size={12} className="text-green-400 flex-shrink-0" />}
          </div>

          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{quest.shortDesc}</p>

          {/* Level requirement */}
          <div className="flex items-center gap-2 mt-2 text-[10px]">
            <span className={`px-1.5 py-0.5 rounded ${playerLevel >= quest.levelRequired ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
              Lv.{quest.levelRequired}
            </span>
            {quest.levelRecommended && (
              <span className="text-gray-500">
                (Rec: {quest.levelRecommended})
              </span>
            )}
          </div>

          {/* Progress bar for active quests */}
          {state && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-gray-400">Progress</span>
                <span className={canComplete ? 'text-green-400' : 'text-cyan-400'}>{progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${canComplete ? 'bg-green-500' : 'bg-cyan-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Complete indicator */}
          {canComplete && (
            <div className="mt-2 flex items-center gap-1 text-green-400 text-xs">
              <CheckCircle size={12} />
              <span>Ready to complete!</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderQuestDetail = () => {
    if (!selectedQuestData) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <BookOpen size={48} className="mx-auto mb-2 opacity-50" />
            <p>Select a quest to view details</p>
          </div>
        </div>
      );
    }

    const { quest, state } = selectedQuestData;
    const config = QUEST_TYPE_CONFIG[quest.type];
    const progress = state ? getQuestProgress(quest, state) : 0;
    const canComplete = state && isQuestComplete(quest, state);
    const npc = getNPCById(quest.dialogue.npcId);
    const hasBonus = state && hasOptionalObjectives(quest, state);

    return (
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
        {/* Quest header with lore styling */}
        <div className={`p-4 ${config.bgColor} border-b ${config.borderColor}`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${config.bgColor} border ${config.borderColor}`}>
              <span className={`${config.color}`}>{config.icon}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase tracking-wide ${config.color}`}>{config.name}</span>
                {quest.chapter && <span className="text-[10px] text-gray-500">Chapter {quest.chapter}</span>}
                {quest.arc && <span className="text-[10px] text-gray-500">• {quest.arc}</span>}
              </div>
              <h2 className="text-lg font-bold text-white mt-1">{quest.name}</h2>
              <p className="text-sm text-gray-400 mt-1">{quest.shortDesc}</p>
            </div>
          </div>
        </div>

        {/* Quest giver with portrait - Enhanced Dialogue View */}
        {npc && (
          <div className="p-4 border-b border-gray-700/50">
            {/* Toggle Dialogue View Button */}
            <button
              onClick={() => setShowDialogueView(!showDialogueView)}
              className="w-full mb-3 py-2 px-3 bg-gradient-to-r from-amber-900/30 to-yellow-900/30 hover:from-amber-800/40 hover:to-yellow-800/40 border border-amber-500/30 rounded-lg text-left transition-all flex items-center justify-between group"
            >
              <span className="flex items-center gap-2 text-amber-300 text-sm">
                <MessageCircle size={14} />
                {showDialogueView ? 'Hide Dialogue' : 'View Dialogue'}
              </span>
              <ChevronDown size={14} className={`text-amber-400 transition-transform ${showDialogueView ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Expanded Dialogue View with Player & NPC */}
            {showDialogueView ? (
              <div className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-xl border border-amber-500/20 overflow-hidden">
                {/* Decorative Header */}
                <div className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                
                {/* Dialogue Scene - Player & NPC face-to-face */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-6">
                    {/* Player Side */}
                    <div className="flex flex-col items-center w-32">
                      <div className="relative">
                        {/* Player Avatar */}
                        <div className="w-24 h-24 rounded-lg bg-gray-900 overflow-hidden border-2 border-amber-500/50">
                          <img 
                            src={getPlayerSprite(playerClass)}
                            alt={playerName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Player Name */}
                      <div className="mt-3 text-center">
                        <p className="text-sm font-bold text-cyan-300">{playerName}</p>
                        <p className="text-[10px] text-gray-500">Level {playerLevel}</p>
                      </div>
                    </div>
                    
                    {/* Dialogue Exchange */}
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="w-full space-y-3">
                        {/* NPC Speaking */}
                        <div className="flex items-start gap-2">
                          <div className="flex-1 bg-amber-900/20 border border-amber-500/30 rounded-lg rounded-tr-none p-3">
                            <p className="text-xs text-amber-400/80 mb-1">{npc.name}:</p>
                            <p className="text-sm text-gray-200 italic leading-relaxed">
                              "{state ? quest.dialogue.progress[0] : quest.dialogue.intro[0]}"
                            </p>
                          </div>
                        </div>
                        
                        {/* Arrow indicator */}
                        <div className="flex justify-center">
                          <div className="flex items-center gap-1 text-gray-600">
                            <div className="w-8 h-px bg-gray-600" />
                            <Swords size={12} className="text-amber-500/50" />
                            <div className="w-8 h-px bg-gray-600" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* NPC Side */}
                    <div className="flex flex-col items-center w-32">
                      <div className="relative">
                        {/* NPC Avatar */}
                        <div className="w-24 h-24 rounded-lg bg-gray-900 overflow-hidden border-2 border-amber-500/50">
                          <img 
                            src={`/assets/npcs/${npc.id}.png`}
                            alt={npc.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.fallback-avatar')) {
                                const fallback = document.createElement('div');
                                fallback.className = 'fallback-avatar w-full h-full flex items-center justify-center text-4xl';
                                fallback.textContent = npc.avatar || '👤';
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* NPC Name */}
                      <div className="mt-3 text-center">
                        <p className="text-sm font-bold text-amber-300">{npc.name}</p>
                        <p className="text-[10px] text-gray-500">{npc.title}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Location badge */}
                  <div className="mt-4 flex justify-center">
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-800/50 px-3 py-1 rounded-full">
                      <MapPin size={10} />
                      <span>{npc.zone}</span>
                    </div>
                  </div>
                </div>
                
                {/* Decorative Footer */}
                <div className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
              </div>
            ) : (
              /* Compact NPC View (original) */
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center text-2xl overflow-hidden">
                  <img 
                    src={`/assets/npcs/${npc.id}.png`}
                    alt={npc.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.fallback-text')) {
                        const fallback = document.createElement('span');
                        fallback.className = 'fallback-text';
                        fallback.textContent = npc.avatar || '👤';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>
                <div>
                  <h4 className="font-medium text-white">{npc.name}</h4>
                  {npc.title && <p className="text-xs text-gray-400">{npc.title}</p>}
                  <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                    <MapPin size={10} />
                    <span>{npc.zone}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full description */}
        <div className="p-4 border-b border-gray-700/50">
          <h4 className="text-xs uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1">
            <BookOpen size={12} />
            Description
          </h4>
          <p className="text-sm text-gray-300 leading-relaxed">{quest.description}</p>
        </div>

        {/* Objectives */}
        <div className="p-4 border-b border-gray-700/50">
          <h4 className="text-xs uppercase tracking-wide text-gray-400 mb-3 flex items-center gap-1">
            <Target size={12} />
            Objectives
          </h4>
          <div className="space-y-2">
            {quest.objectives.map(obj => {
              const current = state?.objectives[obj.id] || 0;
              const isComplete = current >= obj.required;
              const progressPercent = Math.min(100, (current / obj.required) * 100);
              
              return (
                <div 
                  key={obj.id}
                  className={`p-2 rounded-lg border ${
                    obj.optional 
                      ? 'bg-purple-900/20 border-purple-500/30' 
                      : isComplete 
                        ? 'bg-green-900/20 border-green-500/30' 
                        : 'bg-gray-800/50 border-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isComplete ? (
                      <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                    ) : (
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${obj.optional ? 'border-purple-500' : 'border-gray-500'}`} />
                    )}
                    <span className={`flex-1 text-sm ${isComplete ? 'text-gray-500 line-through' : obj.optional ? 'text-purple-300' : 'text-gray-200'}`}>
                      {obj.description}
                    </span>
                    <span className={`text-xs font-mono ${isComplete ? 'text-green-400' : 'text-gray-400'}`}>
                      {current}/{obj.required}
                    </span>
                    {obj.optional && (
                      <span className="text-[10px] text-purple-400 px-1.5 py-0.5 bg-purple-900/50 rounded">BONUS</span>
                    )}
                  </div>
                  {!isComplete && state && (
                    <div className="mt-1.5 h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${obj.optional ? 'bg-purple-500' : 'bg-cyan-500'}`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Rewards */}
        <div className="p-4">
          <h4 className="text-xs uppercase tracking-wide text-gray-400 mb-3 flex items-center gap-1">
            <Award size={12} />
            Rewards
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {quest.rewards.exp && (
              <div className="p-2 bg-cyan-900/30 border border-cyan-500/30 rounded-lg flex items-center gap-2">
                <Sparkles size={16} className="text-cyan-400" />
                <div>
                  <div className="text-xs text-gray-400">Experience</div>
                  <div className="text-sm font-bold text-cyan-400">{quest.rewards.exp.toLocaleString()}</div>
                </div>
              </div>
            )}
            {quest.rewards.spiritStones && (
              <div className="p-2 bg-amber-900/30 border border-amber-500/30 rounded-lg flex items-center gap-2">
                <Coins size={16} className="text-amber-400" />
                <div>
                  <div className="text-xs text-gray-400">Spirit Stones</div>
                  <div className="text-sm font-bold text-amber-400">{quest.rewards.spiritStones.toLocaleString()}</div>
                </div>
              </div>
            )}
            {quest.rewards.items?.map((item, i) => {
              const itemId = item.itemId || item.id || '';
              const itemData = itemId ? getItemById(String(itemId)) : null;
              const itemName = itemData?.name || itemId;
              return (
                <div key={i} className="p-2 bg-purple-900/30 border border-purple-500/30 rounded-lg flex items-center gap-2">
                  <Shield size={16} className="text-purple-400" />
                  <div>
                    <div className="text-xs text-gray-400">Item</div>
                    <div className="text-sm font-bold text-purple-400">{item.quantity}x {itemName}</div>
                  </div>
                </div>
              );
            })}
            {quest.rewards.title && (
              <div className="p-2 bg-yellow-900/30 border border-yellow-500/30 rounded-lg flex items-center gap-2">
                <Crown size={16} className="text-yellow-400" />
                <div>
                  <div className="text-xs text-gray-400">Title</div>
                  <div className="text-sm font-bold text-yellow-400">{quest.rewards.title}</div>
                </div>
              </div>
            )}
          </div>

          {/* Bonus rewards */}
          {quest.bonusRewards && hasBonus && (
            <div className="mt-3 p-2 bg-purple-900/20 border border-purple-500/30 rounded-lg">
              <div className="text-xs text-purple-400 mb-1 flex items-center gap-1"><Sparkles size={12} /> Bonus Rewards (Optional Objectives)</div>
              <div className="flex gap-2 text-xs">
                {quest.bonusRewards.exp && <span className="text-cyan-400">+{quest.bonusRewards.exp} EXP</span>}
                {quest.bonusRewards.spiritStones && <span className="text-amber-400">+{quest.bonusRewards.spiritStones} SS</span>}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="p-4 border-t border-gray-700/50 bg-gray-900/50 sticky bottom-0">
          <div className="flex gap-2">
            {!state && (
              <button
                onClick={() => onAcceptQuest(quest.id)}
                className="flex-1 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 rounded-lg font-medium text-sm transition-all wuxia-button"
              >
                Accept Quest
              </button>
            )}
            {state && canComplete && (
              <button
                onClick={() => onCompleteQuest(quest.id)}
                className="flex-1 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 rounded-lg font-medium text-sm transition-all animate-pulse wuxia-button"
              >
                Complete Quest
              </button>
            )}
            {state && !canComplete && (
              <button
                disabled
                className="flex-1 py-2 bg-gray-700 rounded-lg font-medium text-sm text-gray-400 cursor-not-allowed"
              >
                In Progress ({progress}%)
              </button>
            )}
            {state && (
              <button
                onClick={() => onAbandonQuest(quest.id)}
                className="px-4 py-2 bg-red-900/50 hover:bg-red-800/50 border border-red-500/50 rounded-lg text-red-400 text-sm transition-all"
              >
                Abandon
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border-2 border-amber-600/50 rounded-xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl wuxia-glow wuxia-corners">
        {/* Header */}
        <div className="p-4 border-b border-amber-500/30 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 wuxia-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-900/30 rounded-lg border border-cyan-500/30">
                <BookOpen size={20} className="text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Quest Journal</h2>
                <p className="text-xs text-gray-400">Track your journey through the cultivation world</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {(['active', 'available', 'completed'] as FilterTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${activeTab === tab 
                    ? 'bg-cyan-600 text-white' 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                  }
                `}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {counts[tab] > 0 && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${
                    activeTab === tab ? 'bg-white/20' : 'bg-gray-700'
                  }`}>
                    {counts[tab]}
                  </span>
                )}
              </button>
            ))}

            {/* Type filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`ml-auto px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-1 ${
                showFilters || typeFilter !== 'all' ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Filter size={14} />
              Filter
            </button>
          </div>

          {/* Type filters */}
          {showFilters && (
            <div className="flex gap-2 mt-3 flex-wrap">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-2 py-1 rounded text-xs transition-all ${
                  typeFilter === 'all' ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                All Types
              </button>
              {Object.entries(QUEST_TYPE_CONFIG).map(([type, config]) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type as QuestType)}
                  className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-all ${
                    typeFilter === type 
                      ? `${config.bgColor} ${config.color} border ${config.borderColor}` 
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {config.icon}
                  {config.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Quest list */}
          <div className="w-1/3 border-r border-gray-700 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-700">
            {activeTab === 'active' && (
              activeQuests.length > 0 
                ? activeQuests.map(({ quest, state }) => renderQuestCard(quest, state))
                : <div className="text-center text-gray-500 py-8">
                    <Scroll size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No active quests</p>
                    <p className="text-xs mt-1">Check available quests!</p>
                  </div>
            )}
            {activeTab === 'available' && (
              availableQuests.length > 0
                ? availableQuests.map(quest => renderQuestCard(quest))
                : <div className="text-center text-gray-500 py-8">
                    <AlertTriangle size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No available quests</p>
                    <p className="text-xs mt-1">Level up to unlock more!</p>
                  </div>
            )}
            {activeTab === 'completed' && (
              completedQuests.length > 0
                ? completedQuests.map(quest => renderQuestCard(quest))
                : <div className="text-center text-gray-500 py-8">
                    <CheckCircle size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No completed quests yet</p>
                    <p className="text-xs mt-1">Start your journey!</p>
                  </div>
            )}
          </div>

          {/* Quest detail */}
          <div className="flex-1 flex flex-col bg-gray-800/30">
            {renderQuestDetail()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestPanel;
