// ============================================
// ENHANCED QUEST HUD TRACKER - WuxiaMUD
// Compact tracker for the game HUD
// ============================================

import React, { useState, useMemo } from 'react';
import { 
  Star, Scroll, Clock, Target, Sparkles, 
  ChevronUp, ChevronDown, CheckCircle, AlertCircle,
  Crown, BookOpen
} from 'lucide-react';
import type { Quest, PlayerQuestState } from '../../data/questSystem';
import { getQuestProgress, isQuestComplete } from '../../data/questSystem';
import { getQuestById } from '../../data/questDatabase';

interface QuestHudTrackerProps {
  activeQuests: PlayerQuestState[];
  maxDisplay?: number;
  onQuestClick?: (questId: string) => void;
  onOpenLog?: () => void;
  compact?: boolean;
}

const QUEST_TYPE_ICONS = {
  main: Crown,
  side: Scroll,
  daily: Clock,
  bounty: Target,
  trial: Sparkles
};

const QUEST_TYPE_COLORS = {
  main: 'text-yellow-400',
  side: 'text-blue-400',
  daily: 'text-green-400',
  bounty: 'text-red-400',
  trial: 'text-purple-400'
};

export const QuestHudTracker: React.FC<QuestHudTrackerProps> = ({
  activeQuests,
  maxDisplay = 3,
  onQuestClick,
  onOpenLog,
  compact = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredQuest, setHoveredQuest] = useState<string | null>(null);

  // Sort and limit quests
  const displayQuests = useMemo(() => {
    return [...activeQuests]
      .map(state => {
        const quest = getQuestById(state.questId);
        return quest ? { quest, state } : null;
      })
      .filter((q): q is { quest: Quest; state: PlayerQuestState } => q !== null)
      .sort((a, b) => {
        // Completable quests first
        const aComplete = isQuestComplete(a.quest, a.state);
        const bComplete = isQuestComplete(b.quest, b.state);
        if (aComplete && !bComplete) return -1;
        if (!aComplete && bComplete) return 1;
        // Main quests next
        if (a.quest.type === 'main' && b.quest.type !== 'main') return -1;
        if (a.quest.type !== 'main' && b.quest.type === 'main') return 1;
        // Then by progress
        return getQuestProgress(b.quest, b.state) - getQuestProgress(a.quest, a.state);
      })
      .slice(0, maxDisplay);
  }, [activeQuests, maxDisplay]);

  const hasCompletable = displayQuests.some(({ quest, state }) => isQuestComplete(quest, state));
  const hiddenCount = activeQuests.length - displayQuests.length;

  if (activeQuests.length === 0) {
    return null;
  }

  return (
    <div className={`
      bg-gray-900/90 backdrop-blur-sm border border-gray-700/50 rounded-lg
      transition-all duration-300 overflow-hidden
      ${compact ? 'w-48' : 'w-56'}
      ${hasCompletable ? 'border-green-500/50 shadow-lg shadow-green-500/10' : ''}
    `}>
      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-2 border-b border-gray-700/50 cursor-pointer hover:bg-gray-800/50"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <BookOpen size={14} className={hasCompletable ? 'text-green-400' : 'text-cyan-400'} />
          <span className="text-xs font-medium text-gray-300 uppercase tracking-wide">Quests</span>
          {hasCompletable && (
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-500">{activeQuests.length}</span>
          {isCollapsed ? (
            <ChevronDown size={14} className="text-gray-500" />
          ) : (
            <ChevronUp size={14} className="text-gray-500" />
          )}
        </div>
      </div>

      {/* Quest list */}
      {!isCollapsed && (
        <div className="p-2 space-y-1.5">
          {displayQuests.map(({ quest, state }) => {
            const Icon = QUEST_TYPE_ICONS[quest.type];
            const color = QUEST_TYPE_COLORS[quest.type];
            const progress = getQuestProgress(quest, state);
            const canComplete = isQuestComplete(quest, state);
            const isHovered = hoveredQuest === quest.id;

            // Get next incomplete objective
            const nextObjective = quest.objectives.find(obj => {
              const current = state.objectives[obj.id] || 0;
              return current < obj.required && !obj.optional;
            });

            return (
              <div
                key={quest.id}
                onClick={() => onQuestClick?.(quest.id)}
                onMouseEnter={() => setHoveredQuest(quest.id)}
                onMouseLeave={() => setHoveredQuest(null)}
                className={`
                  relative p-2 rounded cursor-pointer transition-all
                  ${canComplete 
                    ? 'bg-green-900/30 border border-green-500/50 animate-pulse-subtle' 
                    : isHovered
                      ? 'bg-gray-700/50'
                      : 'bg-gray-800/30'
                  }
                `}
              >
                {/* Quest name row */}
                <div className="flex items-center gap-1.5">
                  <Icon size={12} className={color} />
                  <span className={`text-xs font-medium truncate flex-1 ${canComplete ? 'text-green-400' : 'text-gray-200'}`}>
                    {quest.name}
                  </span>
                  {canComplete && <CheckCircle size={12} className="text-green-400 flex-shrink-0" />}
                </div>

                {/* Progress bar */}
                <div className="mt-1.5 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${canComplete ? 'bg-green-500' : 'bg-cyan-500'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Next objective (shown on hover or compact always) */}
                {(isHovered || compact) && nextObjective && (
                  <div className="mt-1.5 text-[10px] text-gray-400 truncate">
                    → {nextObjective.description} ({state.objectives[nextObjective.id] || 0}/{nextObjective.required})
                  </div>
                )}

                {/* Completion status */}
                {canComplete && (
                  <div className="mt-1 text-[10px] text-green-400 flex items-center gap-1">
                    <AlertCircle size={10} />
                    <span>Ready to turn in!</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Hidden count + View All */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-700/50">
            {hiddenCount > 0 && (
              <span className="text-[10px] text-gray-500">+{hiddenCount} more</span>
            )}
            {onOpenLog && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLog();
                }}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                View All →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestHudTracker;
