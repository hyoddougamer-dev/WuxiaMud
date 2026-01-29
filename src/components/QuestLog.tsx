// ============================================
// QUEST LOG COMPONENT - WuxiaMUD
// Main quest log interface
// ============================================

import React, { useState, useMemo } from 'react';
import { Scroll, Star, Clock, Repeat, Target, CheckCircle, XCircle, ChevronDown, ChevronRight, Coins, Sparkles, MapPin, User, Lock } from 'lucide-react';
import type { Quest, QuestStatus, PlayerQuestLog, PlayerQuestState } from '../data/questSystem';
import { getQuestProgress, isQuestComplete, canAcceptQuest } from '../data/questSystem';
import { allQuests, getQuestById, getNPCById } from '../data/questDatabase';
import { questIcons } from '../utils/iconSystem';

// Quest type icon component using images
const QuestTypeIcon: React.FC<{ type: Quest['type']; size?: number }> = ({ type, size = 14 }) => {
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
            className="object-contain"
            style={{ width: size, height: size }}
        />
    );
};
import type { Quest, QuestStatus, PlayerQuestLog, PlayerQuestState } from '../data/questSystem';
import { getQuestProgress, isQuestComplete, canAcceptQuest } from '../data/questSystem';
import { allQuests, getQuestById, getNPCById } from '../data/questDatabase';

interface QuestLogProps {
    questLog: PlayerQuestLog;
    playerLevel: number;
    onAcceptQuest: (questId: string) => void;
    onAbandonQuest: (questId: string) => void;
    onCompleteQuest: (questId: string) => void;
    onClose: () => void;
}

type FilterTab = 'active' | 'available' | 'completed';

export const QuestLog: React.FC<QuestLogProps> = ({
    questLog,
    playerLevel,
    onAcceptQuest,
    onAbandonQuest,
    onCompleteQuest,
    onClose
}) => {
    const [activeFilter, setActiveFilter] = useState<FilterTab>('active');
    const [expandedQuest, setExpandedQuest] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState<string>('all');

    // Get quest type icon - now uses image component
    const getQuestTypeIcon = (type: Quest['type']) => {
        return <QuestTypeIcon type={type} size={14} />;
    };

    const getQuestTypeName = (type: Quest['type']) => {
        switch (type) {
            case 'main': return 'Main Story';
            case 'side': return 'Side Quest';
            case 'daily': return 'Daily';
            case 'bounty': return 'Bounty';
            case 'trial': return 'Trial';
        }
    };

    const getQuestTypeColor = (type: Quest['type']) => {
        switch (type) {
            case 'main': return 'border-yellow-500/50 bg-yellow-900/20';
            case 'side': return 'border-blue-500/50 bg-blue-900/20';
            case 'daily': return 'border-green-500/50 bg-green-900/20';
            case 'bounty': return 'border-red-500/50 bg-red-900/20';
            case 'trial': return 'border-purple-500/50 bg-purple-900/20';
        }
    };

    // Get active quests with full data
    const activeQuests = useMemo(() => {
        return questLog.active
            .map(state => {
                const quest = getQuestById(state.questId);
                return quest ? { quest, state } : null;
            })
            .filter((q): q is { quest: Quest; state: PlayerQuestState } => q !== null)
            .filter(q => typeFilter === 'all' || q.quest.type === typeFilter);
    }, [questLog.active, typeFilter]);

    // Get available quests
    const availableQuests = useMemo((): Quest[] => {
        return allQuests
            .filter((quest: Quest) => {
                const check = canAcceptQuest(quest, playerLevel, questLog, allQuests);
                return check.canAccept;
            })
            .filter((q: Quest) => typeFilter === 'all' || q.type === typeFilter);
    }, [questLog, playerLevel, typeFilter]);

    // Get locked quests (level too low)
    const lockedQuests = useMemo((): Quest[] => {
        return allQuests
            .filter((quest: Quest) => {
                const isActive = questLog.active.some(s => s.questId === quest.id);
                const isCompleted = questLog.completed.includes(quest.id);
                const check = canAcceptQuest(quest, playerLevel, questLog, allQuests);
                // Show as locked if: not available, not active, not completed, and level too low
                return !isActive && !isCompleted && !check.canAccept && quest.levelRequired > playerLevel;
            })
            .filter((q: Quest) => typeFilter === 'all' || q.type === typeFilter)
            .sort((a: Quest, b: Quest) => a.levelRequired - b.levelRequired);
    }, [questLog, playerLevel, typeFilter]);

    // Get completed quests
    const completedQuests = useMemo(() => {
        return questLog.completed
            .map(id => getQuestById(id))
            .filter((q): q is Quest => q !== undefined)
            .filter(q => typeFilter === 'all' || q.type === typeFilter);
    }, [questLog.completed, typeFilter]);

    const toggleExpand = (questId: string) => {
        setExpandedQuest(expandedQuest === questId ? null : questId);
    };

    const renderQuestObjectives = (quest: Quest, state?: PlayerQuestState) => {
        return (
            <div className="mt-2 space-y-1">
                {quest.objectives.map(obj => {
                    const current = state?.objectives[obj.id] || 0;
                    const isComplete = current >= obj.required;
                    return (
                        <div 
                            key={obj.id} 
                            className={`flex items-center gap-2 text-xs ${obj.optional ? 'text-purple-300' : 'text-gray-300'} ${isComplete ? 'line-through opacity-60' : ''}`}
                        >
                            {isComplete ? (
                                <CheckCircle size={12} className="text-green-400" />
                            ) : (
                                <div className="w-3 h-3 rounded-full border border-gray-500" />
                            )}
                            <span className="flex-1">{obj.description}</span>
                            <span className="text-gray-400">
                                {current}/{obj.required}
                            </span>
                            {obj.optional && (
                                <span className="text-purple-400 text-[10px]">(Bonus)</span>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderRewards = (quest: Quest) => {
        const { rewards } = quest;
        return (
            <div className="mt-3 p-2 bg-gray-800/50 rounded border border-gray-700/50">
                <div className="text-xs text-gray-400 mb-1">Rewards:</div>
                <div className="flex flex-wrap gap-2 text-xs">
                    {rewards.exp && (
                        <span className="flex items-center gap-1 text-cyan-400">
                            <Sparkles size={12} /> {rewards.exp} EXP
                        </span>
                    )}
                    {rewards.gold && (
                        <span className="flex items-center gap-1 text-yellow-400">
                            <Coins size={12} /> {rewards.gold} Gold
                        </span>
                    )}
                    {rewards.items?.map((item, i) => (
                        <span key={i} className="text-purple-400">
                            {item.quantity}x Item
                        </span>
                    ))}
                </div>
            </div>
        );
    };

    const renderQuestCard = (quest: Quest, state?: PlayerQuestState, showActions = true) => {
        const isExpanded = expandedQuest === quest.id;
        const progress = state ? getQuestProgress(quest, state) : 0;
        const canComplete = state && isQuestComplete(quest, state);
        const npc = getNPCById(quest.dialogue.npcId);

        return (
            <div 
                key={quest.id} 
                className={`border rounded-lg p-3 mb-2 ${getQuestTypeColor(quest.type)}`}
            >
                {/* Header */}
                <div 
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => toggleExpand(quest.id)}
                >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {getQuestTypeIcon(quest.type)}
                    <span className="font-medium flex-1">{quest.name}</span>
                    {quest.repeatable && <Repeat size={12} className="text-green-400" />}
                    {state && (
                        <span className="text-xs text-gray-400">{progress}%</span>
                    )}
                </div>

                {/* Progress bar for active quests */}
                {state && (
                    <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-cyan-500 transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                {/* Expanded content */}
                {isExpanded && (
                    <div className="mt-3 text-sm">
                        <p className="text-gray-300">{quest.description}</p>
                        
                        {/* Quest giver */}
                        {npc && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                                <User size={12} />
                                <span>{npc.name}</span>
                                {npc.title && <span className="text-gray-500">({npc.title})</span>}
                            </div>
                        )}

                        {/* Zone */}
                        {quest.zone && (
                            <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                                <MapPin size={12} />
                                <span>Location: {quest.zone}</span>
                            </div>
                        )}

                        {/* Level */}
                        <div className="mt-1 text-xs text-gray-400">
                            Level: {quest.levelRequired}
                            {quest.levelRecommended && ` (Recommended: ${quest.levelRecommended})`}
                        </div>

                        {/* Objectives */}
                        {renderQuestObjectives(quest, state)}

                        {/* Rewards */}
                        {renderRewards(quest)}

                        {/* Actions */}
                        {showActions && (
                            <div className="mt-3 flex gap-2">
                                {!state && (
                                    <button
                                        onClick={() => onAcceptQuest(quest.id)}
                                        className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 rounded text-xs"
                                    >
                                        Accept Quest
                                    </button>
                                )}
                                {state && canComplete && (
                                    <button
                                        onClick={() => onCompleteQuest(quest.id)}
                                        className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-xs"
                                    >
                                        Turn In Quest
                                    </button>
                                )}
                                {state && !quest.type.includes('main') && (
                                    <button
                                        onClick={() => onAbandonQuest(quest.id)}
                                        className="px-3 py-1 bg-red-600/50 hover:bg-red-500 rounded text-xs"
                                    >
                                        Abandon
                                    </button>
                                )}
                                {state && quest.type === 'main' && (
                                    <button
                                        onClick={() => onAbandonQuest(quest.id)}
                                        className="px-3 py-1 bg-orange-600/50 hover:bg-orange-500 rounded text-xs"
                                        title="Warning: Main quests can be restarted from NPCs"
                                    >
                                        Reset Quest
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-cyan-700 rounded-lg w-[600px] max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <div className="flex items-center gap-2">
                        <Scroll className="text-cyan-400" />
                        <h2 className="text-xl font-bold">Quest Log</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <XCircle />
                    </button>
                </div>

                {/* Filters */}
                <div className="flex border-b border-gray-700">
                    {(['active', 'available', 'completed'] as FilterTab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveFilter(tab)}
                            className={`flex-1 py-2 text-sm capitalize ${
                                activeFilter === tab 
                                    ? 'bg-cyan-900/50 text-cyan-400 border-b-2 border-cyan-400' 
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {tab}
                            <span className="ml-1 text-xs">
                                ({tab === 'active' ? activeQuests.length 
                                    : tab === 'available' ? availableQuests.length 
                                    : completedQuests.length})
                            </span>
                        </button>
                    ))}
                </div>

                {/* Type filter */}
                <div className="flex gap-2 p-2 border-b border-gray-700 text-xs">
                    {['all', 'main', 'side', 'daily', 'bounty', 'trial'].map(type => (
                        <button
                            key={type}
                            onClick={() => setTypeFilter(type)}
                            className={`px-2 py-1 rounded capitalize ${
                                typeFilter === type 
                                    ? 'bg-cyan-600 text-white' 
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            {type === 'all' ? 'All' : getQuestTypeName(type as Quest['type'])}
                        </button>
                    ))}
                </div>

                {/* Quest list */}
                <div className="flex-1 overflow-y-auto p-4">
                    {activeFilter === 'active' && (
                        activeQuests.length > 0 ? (
                            activeQuests.map(({ quest, state }) => renderQuestCard(quest, state))
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                No active quests. Check available quests!
                            </div>
                        )
                    )}

                    {activeFilter === 'available' && (
                        <>
                            {availableQuests.length > 0 ? (
                                availableQuests.map((quest: Quest) => renderQuestCard(quest))
                            ) : (
                                <div className="text-center text-gray-500 py-4">
                                    No quests available. Complete more quests or level up!
                                </div>
                            )}
                            
                            {/* Locked quests section */}
                            {lockedQuests.length > 0 && (
                                <>
                                    <div className="mt-4 mb-2 text-xs text-gray-500 uppercase tracking-wide flex items-center gap-2">
                                        <Lock size={12} /> Locked (Level too low)
                                    </div>
                                    {lockedQuests.map((quest: Quest) => (
                                        <div 
                                            key={quest.id} 
                                            className="border rounded-lg p-3 mb-2 border-gray-700/30 bg-gray-900/30 opacity-50 cursor-not-allowed"
                                            title={`Requires Level ${quest.levelRequired}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Lock size={14} className="text-gray-500" />
                                                {getQuestTypeIcon(quest.type)}
                                                <span className="font-medium flex-1 text-gray-500">{quest.name}</span>
                                                <span className="text-red-400/60 text-xs">Requires Lv.{quest.levelRequired}</span>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </>
                    )}

                    {activeFilter === 'completed' && (
                        completedQuests.length > 0 ? (
                            completedQuests.map(quest => renderQuestCard(quest, undefined, false))
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                No completed quests yet.
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuestLog;
