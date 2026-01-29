// ============================================
// QUEST TRACKER COMPONENT - WuxiaMUD
// Minimal HUD tracker for active quests
// ============================================

import React from 'react';
import { Clock, ChevronRight, CheckCircle } from 'lucide-react';
import type { Quest, PlayerQuestState } from '../data/questSystem';
import { getQuestProgress, isQuestComplete } from '../data/questSystem';
import { getQuestById } from '../data/questDatabase';
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

interface QuestTrackerProps {
    activeQuests: PlayerQuestState[];
    maxDisplay?: number;
    onQuestClick?: (questId: string) => void;
    onOpenLog?: () => void;
}

export const QuestTracker: React.FC<QuestTrackerProps> = ({
    activeQuests,
    maxDisplay = 3,
    onQuestClick,
    onOpenLog
}) => {
    if (activeQuests.length === 0) return null;

    // Sort: main quests first, then by progress
    const sortedQuests = [...activeQuests]
        .map(state => {
            const quest = getQuestById(state.questId);
            return quest ? { quest, state } : null;
        })
        .filter((q): q is { quest: Quest; state: PlayerQuestState } => q !== null)
        .sort((a, b) => {
            // Main quests first
            if (a.quest.type === 'main' && b.quest.type !== 'main') return -1;
            if (a.quest.type !== 'main' && b.quest.type === 'main') return 1;
            // Then by progress (closer to complete first)
            const progressA = getQuestProgress(a.quest, a.state);
            const progressB = getQuestProgress(b.quest, b.state);
            return progressB - progressA;
        })
        .slice(0, maxDisplay);

    const hiddenCount = activeQuests.length - maxDisplay;

    return (
        <div className="bg-gray-900/80 border border-gray-700 rounded-lg p-2 w-64">
            {/* Header */}
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-700">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Quest Tracker</span>
                {onOpenLog && (
                    <button 
                        onClick={onOpenLog}
                        className="text-xs text-cyan-400 hover:text-cyan-300"
                    >
                        View All
                    </button>
                )}
            </div>

            {/* Tracked quests */}
            <div className="space-y-2">
                {sortedQuests.map(({ quest, state }) => {
                    const progress = getQuestProgress(quest, state);
                    const canComplete = isQuestComplete(quest, state);
                    
                    // Get next incomplete objective
                    const nextObjective = quest.objectives.find(obj => {
                        const current = state.objectives[obj.id] || 0;
                        return current < obj.required && !obj.optional;
                    });

                    return (
                        <div 
                            key={quest.id}
                            className={`p-2 rounded cursor-pointer transition-colors ${
                                canComplete 
                                    ? 'bg-green-900/30 border border-green-500/50' 
                                    : 'bg-gray-800/50 hover:bg-gray-800'
                            }`}
                            onClick={() => onQuestClick?.(quest.id)}
                        >
                            {/* Quest name */}
                            <div className="flex items-center gap-1.5 text-sm">
                                <QuestTypeIcon type={quest.type} size={14} />
                                <span className={`flex-1 truncate ${canComplete ? 'text-green-400' : ''}`}>
                                    {quest.name}
                                </span>
                                {canComplete && <CheckCircle size={12} className="text-green-400" />}
                            </div>

                            {/* Current objective */}
                            {nextObjective && !canComplete && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                                    <ChevronRight size={10} />
                                    <span className="truncate flex-1">{nextObjective.description}</span>
                                    <span className="text-cyan-400">
                                        {state.objectives[nextObjective.id] || 0}/{nextObjective.required}
                                    </span>
                                </div>
                            )}

                            {canComplete && (
                                <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
                                    <CheckCircle size={12} /> Ready to turn in!
                                </div>
                            )}

                            {/* Progress bar */}
                            <div className="mt-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all ${canComplete ? 'bg-green-500' : 'bg-cyan-500'}`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Hidden quests count */}
            {hiddenCount > 0 && (
                <button 
                    onClick={onOpenLog}
                    className="w-full mt-2 text-xs text-gray-500 hover:text-gray-400 text-center"
                >
                    +{hiddenCount} more quest{hiddenCount > 1 ? 's' : ''}...
                </button>
            )}
        </div>
    );
};

export default QuestTracker;
