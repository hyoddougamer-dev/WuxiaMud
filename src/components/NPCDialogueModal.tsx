import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, ChevronRight, Award, Scroll, Gift, 
  Clock, MapPin, Target, AlertTriangle,
  CheckCircle2, XCircle, Sparkles, Gem, Star
} from 'lucide-react';
import type { NPC, Quest } from '../data/questSystem';
import { uiFrameIcons } from '../utils/iconSystem';

// ============================================
// TYPES
// ============================================

interface DialoguePhase {
  type: 'greeting' | 'quest_offer' | 'quest_progress' | 'quest_complete' | 'idle' | 'farewell';
  text: string;
  speaker: 'npc' | 'player';
  options?: DialogueOption[];
}

interface DialogueOption {
  id: string;
  text: string;
  action: 'accept_quest' | 'decline_quest' | 'turn_in' | 'next' | 'close' | 'ask_progress';
  questId?: string;
  nextPhase?: DialoguePhase;
}

// Quest with status for active quests
interface ActiveQuest extends Quest {
  status?: 'active' | 'completed' | 'failed';
}

interface NPCDialogueModalProps {
  npc: NPC;
  quest?: Quest | null;
  activeQuests?: ActiveQuest[];
  completedQuestIds?: string[];
  onClose: () => void;
  onAcceptQuest: (questId: string) => void;
  onTurnInQuest: (questId: string) => void;
  playerName?: string;
  playerLevel?: number;
}

// ============================================
// NPC PORTRAIT COMPONENT
// ============================================

const NPCPortrait: React.FC<{
  npc: NPC;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}> = ({ npc, size = 'lg', animated = true }) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-40 h-40',
  };
  
  const imageSizes = {
    sm: 64,
    md: 96,
    lg: 160,
  };
  
  // Construct portrait path
  const portraitPath = `/assets/npcs/${npc.id}.png`;
  
  return (
    <div className={`relative ${sizeClasses[size]}`}>
      {/* Glowing background effect */}
      <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 ${animated ? 'animate-pulse' : ''}`} />
      
      {/* Portrait border */}
      <div className="absolute inset-1 rounded-full bg-gradient-to-br from-amber-600 via-yellow-500 to-amber-600 p-0.5">
        <div className="w-full h-full rounded-full bg-gray-900 overflow-hidden flex items-center justify-center">
          {/* Try to load image, fallback to avatar emoji */}
          <img 
            src={portraitPath}
            alt={npc.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to emoji avatar
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const fallback = document.createElement('span');
                fallback.className = 'text-4xl';
                fallback.textContent = npc.avatar || '👤';
                parent.appendChild(fallback);
              }
            }}
          />
        </div>
      </div>
      
      {/* Corner decorations */}
      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-amber-400" />
      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-amber-400" />
      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-amber-400" />
      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-amber-400" />
    </div>
  );
};

// ============================================
// TYPEWRITER TEXT EFFECT
// ============================================

const TypewriterText: React.FC<{
  text: string;
  speed?: number;
  onComplete?: () => void;
}> = ({ text, speed = 30, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    let index = 0;
    
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        setIsComplete(true);
        onComplete?.();
      }
    }, speed);
    
    return () => clearInterval(timer);
  }, [text, speed, onComplete]);
  
  return (
    <span>
      {displayedText}
      {!isComplete && <span className="animate-pulse">▌</span>}
    </span>
  );
};

// ============================================
// QUEST PREVIEW CARD
// ============================================

const QuestPreviewCard: React.FC<{
  quest: Quest;
  canAccept: boolean;
  isActive: boolean;
  isComplete: boolean;
  onAccept: () => void;
  onTurnIn: () => void;
}> = ({ quest, canAccept, isActive, isComplete, onAccept, onTurnIn }) => {
  const difficultyColors = {
    easy: 'text-green-400 bg-green-900/30',
    normal: 'text-blue-400 bg-blue-900/30',
    hard: 'text-orange-400 bg-orange-900/30',
    legendary: 'text-purple-400 bg-purple-900/30',
  };
  
  const typeColors: Record<string, string> = {
    main: 'border-yellow-500/50 bg-yellow-900/10',
    side: 'border-blue-500/50 bg-blue-900/10',
    daily: 'border-green-500/50 bg-green-900/10',
    bounty: 'border-red-500/50 bg-red-900/10',
    trial: 'border-purple-500/50 bg-purple-900/10',
  };
  
  return (
    <div className={`rounded-xl border-2 p-4 ${typeColors[quest.type] || typeColors.side}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-lg text-amber-200">{quest.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded-full text-blue-400 bg-blue-900/30">
              {quest.type.toUpperCase()}
            </span>
            <span className="text-xs text-gray-500">Level {quest.levelRequired || 1}+</span>
          </div>
        </div>
        {quest.type === 'main' && (
          <div className="bg-yellow-600/30 p-2 rounded-lg">
            <Sparkles size={20} className="text-yellow-400" />
          </div>
        )}
      </div>
      
      {/* Description */}
      <p className="text-sm text-gray-300 mb-4 italic">"{quest.description}"</p>
      
      {/* Objectives Preview */}
      {quest.objectives && quest.objectives.length > 0 && (
        <div className="bg-black/30 rounded-lg p-3 mb-4">
          <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Objectives</div>
          <div className="space-y-1">
            {quest.objectives.slice(0, 3).map((obj, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <Target size={12} className="text-cyan-400" />
                <span className="text-gray-300">{obj.description || `Complete: ${obj.target}`}</span>
              </div>
            ))}
            {quest.objectives.length > 3 && (
              <div className="text-xs text-gray-500">...and {quest.objectives.length - 3} more</div>
            )}
          </div>
        </div>
      )}
      
      {/* Rewards */}
      <div className="flex flex-wrap gap-2 mb-4">
        {quest.rewards?.exp && (
          <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-1 rounded flex items-center gap-1">
            <Sparkles size={10} /> {quest.rewards.exp} EXP
          </span>
        )}
        {quest.rewards?.spiritStones && (
          <span className="text-xs bg-cyan-900/40 text-cyan-300 px-2 py-1 rounded flex items-center gap-1">
            <Gem size={10} /> {quest.rewards.spiritStones}
          </span>
        )}
        {quest.rewards?.reputation && (
          <span className="text-xs bg-green-900/40 text-green-300 px-2 py-1 rounded flex items-center gap-1">
            <Star size={10} /> +Rep
          </span>
        )}
      </div>
      
      {/* Actions */}
      <div className="flex gap-2">
        {canAccept && !isActive && (
          <button
            onClick={onAccept}
            className="flex-1 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={16} />
            Accept Quest
          </button>
        )}
        
        {isActive && !isComplete && (
          <div className="flex-1 py-2 bg-gray-700/50 rounded-lg text-gray-400 text-center flex items-center justify-center gap-2">
            <Clock size={16} />
            In Progress
          </div>
        )}
        
        {isComplete && (
          <button
            onClick={onTurnIn}
            className="flex-1 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 animate-pulse"
          >
            <Gift size={16} />
            Turn In Quest
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================
// MAIN DIALOGUE MODAL
// ============================================

export const NPCDialogueModal: React.FC<NPCDialogueModalProps> = ({
  npc,
  quest,
  activeQuests = [],
  completedQuestIds = [],
  onClose,
  onAcceptQuest,
  onTurnInQuest,
  playerName = 'Cultivator',
  playerLevel = 1,
}) => {
  const [dialoguePhase, setDialoguePhase] = useState<'greeting' | 'quests' | 'farewell'>('greeting');
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [showQuests, setShowQuests] = useState(false);
  
  // Get random dialogue from category
  const getDialogue = useCallback((category: 'greeting' | 'idle' | 'farewell') => {
    const dialogues = npc.dialogue?.[category] || [];
    if (dialogues.length === 0) return 'Hello, traveler.';
    return dialogues[Math.floor(Math.random() * dialogues.length)];
  }, [npc]);
  
  // Check if NPC has available quests
  const availableQuests = (npc.quests || [])
    .filter(qId => !completedQuestIds.includes(qId) && !activeQuests.find(aq => aq.id === qId));
  
  // Check for quests that can be turned in
  const turnInQuests = activeQuests.filter(aq => 
    npc.quests?.includes(aq.id) && aq.status === 'completed'
  );
  
  const hasQuests = availableQuests.length > 0 || turnInQuests.length > 0;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 rounded-lg overflow-hidden border-2 border-amber-600/60 shadow-2xl shadow-amber-900/30 w-full max-w-4xl mx-4 wuxia-glow wuxia-corners">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-gray-800/50 via-amber-900/20 to-gray-800/50 px-6 py-4 border-b border-amber-500/20 wuxia-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mini portrait */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-yellow-600 p-0.5">
                <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center overflow-hidden">
                  <img 
                    src={`/assets/npcs/${npc.id}.png`}
                    alt={npc.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = `<span class="text-2xl">${npc.avatar || '👤'}</span>`;
                    }}
                  />
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-bold text-amber-200 font-serif">{npc.name}</h2>
                <p className="text-sm text-amber-400/70">{npc.title}</p>
              </div>
            </div>
            
            {/* Quest indicators */}
            <div className="flex items-center gap-3">
              {turnInQuests.length > 0 && (
                <span className="flex items-center gap-1 bg-green-600/30 text-green-400 px-3 py-1 rounded-full text-sm animate-pulse">
                  <Gift size={14} />
                  {turnInQuests.length} Ready
                </span>
              )}
              {availableQuests.length > 0 && (
                <span className="flex items-center gap-1 bg-yellow-600/30 text-yellow-400 px-3 py-1 rounded-full text-sm">
                  <Scroll size={14} />
                  {availableQuests.length} New
                </span>
              )}
            </div>
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex min-h-[400px]">
          {/* Portrait Side */}
          <div className="w-64 bg-gradient-to-b from-gray-800/50 to-transparent p-6 flex flex-col items-center justify-center border-r border-amber-500/10">
            <NPCPortrait npc={npc} size="lg" />
            
            {/* Location */}
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
              <MapPin size={12} />
              <span>{npc.zone || 'Unknown Location'}</span>
            </div>
            
            {/* Faction */}
            {npc.faction && (
              <div className="mt-2 text-xs text-purple-400 bg-purple-900/30 px-3 py-1 rounded-full">
                {npc.faction.replace(/_/g, ' ').toUpperCase()}
              </div>
            )}
          </div>
          
          {/* Dialogue Side */}
          <div className="flex-1 p-6 flex flex-col">
            {/* Greeting Phase */}
            {dialoguePhase === 'greeting' && (
              <div className="flex-1 flex flex-col">
                {/* Dialogue Bubble */}
                <div className="flex-1 bg-gray-800/30 rounded-xl p-6 mb-4 border border-amber-500/10">
                  <div className="text-xs text-amber-400/60 mb-2 uppercase tracking-wide">
                    {npc.name} says:
                  </div>
                  <p className="text-lg text-gray-100 leading-relaxed font-serif">
                    <TypewriterText 
                      text={getDialogue('greeting').replace('{player}', playerName)} 
                      speed={25}
                    />
                  </p>
                </div>
                
                {/* Options */}
                <div className="space-y-2">
                  {hasQuests && (
                    <button
                      onClick={() => setDialoguePhase('quests')}
                      className="w-full py-3 px-4 bg-gradient-to-r from-amber-900/40 to-yellow-900/40 hover:from-amber-800/50 hover:to-yellow-800/50 border border-amber-500/30 rounded-lg text-left transition-all flex items-center justify-between group"
                    >
                      <span className="flex items-center gap-3">
                        <Scroll className="text-amber-400" size={20} />
                        <span className="text-amber-200">What tasks do you have for me?</span>
                      </span>
                      <ChevronRight className="text-amber-400 group-hover:translate-x-1 transition-transform" size={20} />
                    </button>
                  )}
                  
                  <button
                    onClick={onClose}
                    className="w-full py-3 px-4 bg-gray-800/30 hover:bg-gray-700/30 border border-gray-600/30 rounded-lg text-left transition-all flex items-center justify-between group"
                  >
                    <span className="flex items-center gap-3">
                      <X className="text-gray-400" size={20} />
                      <span className="text-gray-300">Farewell, {npc.title}.</span>
                    </span>
                    <ChevronRight className="text-gray-400 group-hover:translate-x-1 transition-transform" size={20} />
                  </button>
                </div>
              </div>
            )}
            
            {/* Quests Phase */}
            {dialoguePhase === 'quests' && (
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-amber-300 flex items-center gap-2">
                    <Scroll size={20} />
                    Available Quests
                  </h3>
                  <button
                    onClick={() => setDialoguePhase('greeting')}
                    className="text-sm text-gray-400 hover:text-gray-300 flex items-center gap-1"
                  >
                    ← Back
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {/* Turn-in quests first */}
                  {turnInQuests.map(tq => (
                    <QuestPreviewCard
                      key={tq.id}
                      quest={tq}
                      canAccept={false}
                      isActive={true}
                      isComplete={true}
                      onAccept={() => {}}
                      onTurnIn={() => {
                        onTurnInQuest(tq.id);
                        onClose();
                      }}
                    />
                  ))}
                  
                  {/* Available quests */}
                  {availableQuests.length === 0 && turnInQuests.length === 0 && (
                    <div className="text-center py-8">
                      <Scroll className="mx-auto text-gray-600 mb-3" size={40} />
                      <p className="text-gray-400">No quests available at this time.</p>
                      <p className="text-sm text-gray-500 mt-1">Check back later or complete current quests.</p>
                    </div>
                  )}
                  
                  {/* Note: In a real implementation, you'd fetch quest details */}
                  {quest && !activeQuests.find(aq => aq.id === quest.id) && !completedQuestIds.includes(quest.id) && (
                    <QuestPreviewCard
                      quest={quest}
                      canAccept={playerLevel >= (quest.levelRequired || 1)}
                      isActive={false}
                      isComplete={false}
                      onAccept={() => {
                        onAcceptQuest(quest.id);
                        onClose();
                      }}
                      onTurnIn={() => {}}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gradient-to-r from-gray-800/50 via-amber-900/10 to-gray-800/50 px-6 py-3 border-t border-amber-500/10">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Press ESC to close</span>
            <span className="flex items-center gap-1">
              <Award size={12} className="text-amber-400" />
              Build relationships for better rewards
            </span>
          </div>
        </div>
      </div>{/* Close modal container */}
    </div>
  );
};

export default NPCDialogueModal;
