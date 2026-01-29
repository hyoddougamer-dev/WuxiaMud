// ============================================
// NPC DIALOG COMPONENT - WuxiaMUD
// Immersive fullscreen dialogue with VN-style presentation
// ============================================

import React, { useState, useEffect } from 'react';
import { X, ChevronRight, MessageCircle, Scroll, ShoppingBag, Swords, Star, MapPin, Sparkles, Calendar, Target, Lock } from 'lucide-react';
import type { NPC } from '../data/questSystem';
import type { Quest, PlayerQuestState, PlayerQuestLog } from '../data/questSystem';
import { canAcceptQuest, isQuestComplete } from '../data/questSystem';
import { getQuestById, getQuestsForNPC, allQuests } from '../data/questDatabase';
import { getPlayerSprite } from '../data/combatAssets';
import { questIcons } from '../utils/iconSystem';

interface NPCDialogProps {
    npc: NPC;
    questLog: PlayerQuestLog;
    playerLevel: number;
    playerName?: string;
    playerClass?: number;
    zoneBackground?: string; // Background image from current zone
    onClose: () => void;
    onAcceptQuest: (questId: string) => void;
    onCompleteQuest: (questId: string) => void;
    onOpenVendor?: () => void;
    onTrain?: () => void;
}

type DialogState = 'greeting' | 'quest_list' | 'quest_detail' | 'quest_accept' | 'quest_complete' | 'dialogue_sequence';
type Speaker = 'player' | 'npc';

interface DialogueLine {
    speaker: Speaker;
    text: string;
    emotion?: 'neutral' | 'happy' | 'angry' | 'sad' | 'surprised';
}

export const NPCDialog: React.FC<NPCDialogProps> = ({
    npc,
    questLog,
    playerLevel,
    playerName = 'Cultivator',
    playerClass = 1,
    zoneBackground,
    onClose,
    onAcceptQuest,
    onCompleteQuest,
    onOpenVendor,
    onTrain
}) => {
    const [dialogState, setDialogState] = useState<DialogState>('greeting');
    const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
    const [dialogIndex, setDialogIndex] = useState(0);
    const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
    const [dialogueSequence, setDialogueSequence] = useState<DialogueLine[]>([]);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // Get quests for this NPC
    const npcQuests = getQuestsForNPC(npc.id);
    
    // Categorize quests
    const availableQuests = npcQuests.filter((q: Quest) => {
        const check = canAcceptQuest(q, playerLevel, questLog, allQuests);
        return check.canAccept;
    });

    const lockedQuests = npcQuests.filter((q: Quest) => {
        const isActive = questLog.active.some(s => s.questId === q.id);
        const isCompleted = questLog.completed.includes(q.id);
        const check = canAcceptQuest(q, playerLevel, questLog, allQuests);
        return !isActive && !isCompleted && !check.canAccept && q.levelRequired > playerLevel;
    });

    const activeQuests = npcQuests.filter((q: Quest) => {
        return questLog.active.some(s => s.questId === q.id);
    });

    const completableQuests = activeQuests.filter((q: Quest) => {
        const state = questLog.active.find(s => s.questId === q.id);
        return state && isQuestComplete(q, state);
    });

    const hasQuests = availableQuests.length > 0 || completableQuests.length > 0 || lockedQuests.length > 0;

    // Typewriter effect for dialogue
    useEffect(() => {
        if (dialogState === 'dialogue_sequence' && dialogueSequence[currentDialogueIndex]) {
            const fullText = dialogueSequence[currentDialogueIndex].text;
            setIsTyping(true);
            setDisplayedText('');
            
            let charIndex = 0;
            const interval = setInterval(() => {
                if (charIndex < fullText.length) {
                    setDisplayedText(fullText.slice(0, charIndex + 1));
                    charIndex++;
                } else {
                    setIsTyping(false);
                    clearInterval(interval);
                }
            }, 30);
            
            return () => clearInterval(interval);
        }
    }, [currentDialogueIndex, dialogState, dialogueSequence]);

    // Generate rich dialogue sequence for quest
    const generateQuestDialogue = (quest: Quest, isComplete: boolean): DialogueLine[] => {
        if (isComplete) {
            return [
                { speaker: 'npc', text: quest.dialogue.complete[0] || `Excellent work, ${playerName}. You have completed "${quest.name}".` },
                { speaker: 'player', text: 'I have done as you requested.' },
                { speaker: 'npc', text: quest.dialogue.complete[1] || 'Your efforts have not gone unnoticed. Take these rewards as a token of my gratitude.' }
            ];
        }
        
        // Build intro dialogue sequence
        const lines: DialogueLine[] = [];
        
        // NPC introduces the quest with lore
        lines.push({ 
            speaker: 'npc', 
            text: quest.dialogue.intro[0] || `${playerName}, I have a task that requires someone of your... unique talents.`
        });
        
        // Player response
        lines.push({ 
            speaker: 'player', 
            text: quest.type === 'main' 
                ? 'I sense this is no ordinary request. Tell me more.'
                : 'What would you have me do?'
        });
        
        // NPC gives more context
        if (quest.dialogue.intro[1]) {
            lines.push({ speaker: 'npc', text: quest.dialogue.intro[1] });
        } else {
            // Generate contextual lore based on quest type
            const loreLines: Record<string, string> = {
                main: 'This concerns the very balance of our world. Dark forces stir in the shadows...',
                side: 'While not urgent, this matter has troubled me for some time.',
                daily: 'The sect requires constant vigilance. This duty falls to those who walk the path.',
                bounty: 'A threat has emerged that cannot be ignored. Will you hunt it down?',
                trial: 'The path of cultivation is paved with trials. Are you ready to face yours?'
            };
            lines.push({ speaker: 'npc', text: loreLines[quest.type] || 'This matter requires your attention.' });
        }
        
        // Add objective summary
        lines.push({ 
            speaker: 'npc', 
            text: quest.dialogue.intro[2] || `Your task: ${quest.objectives.map(o => o.description).join(', ')}.`
        });
        
        // Player acceptance line
        lines.push({ 
            speaker: 'player', 
            text: quest.type === 'main' 
                ? 'I understand the gravity of this task. I will not fail.'
                : 'Consider it done.'
        });
        
        return lines;
    };

    // Get random greeting with more personality
    const getGreeting = () => {
        const greetings = npc.dialogue.greeting;
        const contextualGreetings = [
            `Ah, ${playerName}. Your presence graces us once more.`,
            `${playerName}... I have been expecting you.`,
            `Welcome, young cultivator. The heavens must have guided you here.`,
            ...greetings
        ];
        return contextualGreetings[dialogIndex % contextualGreetings.length];
    };

    const advanceDialogue = () => {
        if (isTyping) {
            // Skip to full text
            setDisplayedText(dialogueSequence[currentDialogueIndex].text);
            setIsTyping(false);
            return;
        }
        
        if (currentDialogueIndex < dialogueSequence.length - 1) {
            setCurrentDialogueIndex(prev => prev + 1);
        } else {
            // End of dialogue sequence
            if (selectedQuest) {
                const isComplete = completableQuests.some(q => q.id === selectedQuest.id);
                if (isComplete) {
                    onCompleteQuest(selectedQuest.id);
                } else {
                    onAcceptQuest(selectedQuest.id);
                }
            }
            onClose();
        }
    };

    const startQuestDialogue = (quest: Quest, isComplete: boolean) => {
        setSelectedQuest(quest);
        const sequence = generateQuestDialogue(quest, isComplete);
        setDialogueSequence(sequence);
        setCurrentDialogueIndex(0);
        setDialogState('dialogue_sequence');
    };

    const getQuestTypeIcon = (type: Quest['type']) => {
        const iconStyle = { width: 14, height: 14, objectFit: 'contain' as const };
        switch (type) {
            case 'main': return <img src={questIcons.main} alt="main" style={iconStyle} />;
            case 'side': return <img src={questIcons.side} alt="side" style={iconStyle} />;
            case 'daily': return <Calendar className="text-green-400" size={14} />;
            case 'bounty': return <img src={questIcons.bounty} alt="bounty" style={iconStyle} />;
            case 'trial': return <img src={questIcons.achievement} alt="trial" style={iconStyle} />;
        }
    };

    // Fullscreen VN-style dialogue view
    if (dialogState === 'dialogue_sequence') {
        const currentLine = dialogueSequence[currentDialogueIndex];
        const isSpeakingNPC = currentLine?.speaker === 'npc';
        
        return (
            <div className="fixed inset-0 z-[100]" onClick={advanceDialogue}>
                {/* Background with zone image or gradient fallback */}
                <div className="absolute inset-0">
                    {zoneBackground ? (
                        <>
                            <img 
                                src={zoneBackground}
                                alt="Zone background"
                                className="w-full h-full object-cover"
                            />
                            {/* Dark overlay for readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/40" />
                        </>
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-black" />
                    )}
                    {/* Decorative particles */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[...Array(20)].map((_, i) => (
                            <div 
                                key={i}
                                className="absolute w-1 h-1 bg-amber-500/30 rounded-full animate-pulse"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 3}s`
                                }}
                            />
                        ))}
                    </div>
                </div>
                
                {/* Character portraits - Large cinematic style */}
                <div className="absolute inset-x-0 top-0 h-2/3 flex items-center justify-center">
                    {/* Player portrait (left side) */}
                    <div className={`absolute left-[15%] transition-all duration-500 ${!isSpeakingNPC ? 'scale-110 brightness-100' : 'scale-95 brightness-50'}`}>
                        <div className="relative">
                            <div className="w-48 h-64 rounded-lg bg-gray-900 overflow-hidden shadow-2xl border-2 border-cyan-500/50">
                                <img 
                                    src={getPlayerSprite(playerClass)}
                                    alt={playerName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                                {/* Character glow overlay when speaking */}
                                {!isSpeakingNPC && (
                                    <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-transparent" />
                                )}
                            </div>
                            {/* Name plate */}
                            <div className={`mt-3 text-center transition-all ${!isSpeakingNPC ? 'opacity-100' : 'opacity-50'}`}>
                                <p className="text-lg font-bold text-cyan-300">{playerName}</p>
                                <p className="text-xs text-gray-500">Level {playerLevel} Cultivator</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* NPC portrait (right side) */}
                    <div className={`absolute right-[15%] transition-all duration-500 ${isSpeakingNPC ? 'scale-110 brightness-100' : 'scale-95 brightness-50'}`}>
                        <div className="relative">
                            <div className="w-48 h-64 rounded-lg bg-gray-900 overflow-hidden shadow-2xl border-2 border-amber-500/50">
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
                                            fallback.className = 'fallback-avatar w-full h-full flex items-center justify-center text-6xl';
                                            fallback.textContent = npc.avatar || '👤';
                                            parent.appendChild(fallback);
                                        }
                                    }}
                                />
                                {isSpeakingNPC && (
                                    <div className="absolute inset-0 bg-gradient-to-t from-amber-500/20 to-transparent" />
                                )}
                            </div>
                            <div className={`mt-2 text-center transition-all ${isSpeakingNPC ? 'opacity-100' : 'opacity-50'}`}>
                                <p className="text-lg font-bold text-amber-300">{npc.name}</p>
                                <p className="text-xs text-gray-500">{npc.title}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Dialogue box at bottom - VN style */}
                <div className="absolute inset-x-0 bottom-0 p-8">
                    <div className="max-w-4xl mx-auto">
                        {/* Speaker name indicator */}
                        <div className={`inline-block px-4 py-1 rounded-t-lg font-bold text-sm ${
                            isSpeakingNPC 
                                ? 'bg-amber-900/80 text-amber-300 border-t border-l border-r border-amber-500/50' 
                                : 'bg-cyan-900/80 text-cyan-300 border-t border-l border-r border-cyan-500/50'
                        }`}>
                            {isSpeakingNPC ? npc.name : playerName}
                        </div>
                        
                        {/* Main dialogue text */}
                        <div className={`p-6 rounded-lg rounded-tl-none min-h-[120px] border border-amber-500/30 ${
                                isSpeakingNPC 
                                    ? 'bg-gradient-to-br from-amber-900/40 to-amber-950/40' 
                                    : 'bg-gradient-to-br from-cyan-900/40 to-cyan-950/40'
                            }`}>
                            
                            {/* Dialogue text with typewriter effect */}
                            <p className="text-xl leading-relaxed text-gray-100 min-h-[80px]">
                                {displayedText}
                                {isTyping && <span className="animate-pulse">▌</span>}
                            </p>
                            
                            {/* Quest info if applicable */}
                            {selectedQuest && currentDialogueIndex === dialogueSequence.length - 1 && !isTyping && (
                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <div className="flex items-center gap-2 text-sm">
                                        {getQuestTypeIcon(selectedQuest.type)}
                                        <span className="font-bold text-amber-300">{selectedQuest.name}</span>
                                        {selectedQuest.rewards.exp && (
                                            <span className="ml-auto text-cyan-400">+{selectedQuest.rewards.exp} EXP</span>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {/* Continue indicator */}
                            {!isTyping && (
                                <div className="absolute bottom-2 right-4 flex items-center gap-1 text-xs text-gray-400 animate-pulse">
                                    <span>Click to continue</span>
                                    <ChevronRight size={14} />
                                </div>
                            )}
                        </div>{/* Close dialogue box */}
                    </div>
                </div>
                
                {/* Close button */}
                <button 
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/80 transition-colors"
                >
                    <X size={20} className="text-gray-400" />
                </button>
                
                {/* Progress indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                    {dialogueSequence.map((_, idx) => (
                        <div 
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-all ${
                                idx === currentDialogueIndex 
                                    ? 'bg-amber-500 w-4' 
                                    : idx < currentDialogueIndex 
                                        ? 'bg-amber-500/50' 
                                        : 'bg-gray-600'
                            }`}
                        />
                    ))}
                </div>
            </div>
        );
    }

    const renderDialogContent = () => {
        switch (dialogState) {
            case 'greeting':
                return (
                    <div className="space-y-4">
                        <p className="text-lg italic text-gray-300">"{getGreeting()}"</p>
                        
                        <div className="flex flex-wrap gap-2 mt-4">
                            {hasQuests && (
                                <button 
                                    onClick={() => setDialogState('quest_list')}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-700 to-cyan-600 hover:from-cyan-600 hover:to-cyan-500 rounded-lg shadow-lg shadow-cyan-900/30 transition-all"
                                >
                                    <Scroll size={16} /> Quests
                                    {completableQuests.length > 0 && (
                                        <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                                            {completableQuests.length}
                                        </span>
                                    )}
                                </button>
                            )}
                            
                            {npc.role.includes('vendor') && onOpenVendor && (
                                <button 
                                    onClick={onOpenVendor}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 rounded-lg shadow-lg shadow-amber-900/30 transition-all"
                                >
                                    <ShoppingBag size={16} /> Trade
                                </button>
                            )}
                            
                            {npc.role.includes('trainer') && onTrain && (
                                <button 
                                    onClick={onTrain}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 rounded-lg shadow-lg shadow-purple-900/30 transition-all"
                                >
                                    <Swords size={16} /> Train
                                </button>
                            )}
                            
                            <button 
                                onClick={onClose}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all"
                            >
                                Farewell
                            </button>
                        </div>
                    </div>
                );

            case 'quest_list':
                return (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
                                <Scroll size={18} />
                                Available Quests
                            </h3>
                            <button 
                                onClick={() => setDialogState('greeting')}
                                className="text-xs text-gray-400 hover:text-white"
                            >
                                ← Back
                            </button>
                        </div>
                        
                        {/* Completable quests first */}
                        {completableQuests.map((quest: Quest) => (
                            <button
                                key={quest.id}
                                onClick={() => startQuestDialogue(quest, true)}
                                className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-green-900/50 to-green-800/30 border border-green-500/50 rounded-lg hover:from-green-800/50 hover:to-green-700/30 text-left transition-all group"
                            >
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                    {getQuestTypeIcon(quest.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-green-300">{quest.name}</div>
                                    <div className="text-xs text-gray-400 truncate">{quest.objectives[0]?.description}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-green-400 text-xs font-bold flex items-center gap-1">
                                        <Sparkles size={12} />
                                        Ready!
                                    </span>
                                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </button>
                        ))}
                        
                        {/* Available quests */}
                        {availableQuests.map((quest: Quest) => (
                            <button
                                key={quest.id}
                                onClick={() => startQuestDialogue(quest, false)}
                                className="w-full flex items-center gap-3 p-3 bg-gray-800/50 border border-gray-600/50 rounded-lg hover:bg-gray-700/50 hover:border-cyan-500/30 text-left transition-all group"
                            >
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center">
                                    {getQuestTypeIcon(quest.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-gray-200">{quest.name}</div>
                                    <div className="text-xs text-gray-500 truncate">{quest.objectives[0]?.description}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 text-xs">Lv.{quest.levelRequired}</span>
                                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </button>
                        ))}

                        {/* Locked quests */}
                        {lockedQuests.slice(0, 3).map((quest: Quest) => (
                            <div
                                key={quest.id}
                                className="w-full flex items-center gap-3 p-3 bg-gray-900/50 border border-gray-700/30 rounded-lg opacity-50 cursor-not-allowed"
                            >
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800/50 flex items-center justify-center">
                                    <Lock size={16} className="text-gray-500" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-gray-500">{quest.name}</div>
                                    <div className="text-xs text-gray-600">Requires Level {quest.levelRequired}</div>
                                </div>
                            </div>
                        ))}
                        
                        {/* In-progress quests */}
                        {activeQuests.filter(q => !completableQuests.includes(q)).length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-700/50">
                                <div className="text-xs text-gray-500 mb-2">In Progress</div>
                                {activeQuests.filter(q => !completableQuests.includes(q)).map((quest: Quest) => {
                                    const state = questLog.active.find(s => s.questId === quest.id);
                                    const currentProgress = state?.objectives 
                                        ? Object.values(state.objectives).reduce((a: number, b: number) => a + b, 0)
                                        : 0;
                                    const totalRequired = quest.objectives
                                        ? quest.objectives.reduce((a: number, obj) => a + (obj.required || 1), 0)
                                        : 1;
                                    return (
                                        <div
                                            key={quest.id}
                                            className="flex items-center gap-2 p-2 bg-gray-800/30 rounded text-sm"
                                        >
                                            {getQuestTypeIcon(quest.type)}
                                            <span className="text-gray-400">{quest.name}</span>
                                            <span className="ml-auto text-xs text-amber-400">
                                                {currentProgress}/{totalRequired}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        
                        {availableQuests.length === 0 && completableQuests.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <Scroll size={32} className="mx-auto mb-2 opacity-50" />
                                <p>No quests available at this time.</p>
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-gradient-to-b from-gray-900 to-black border-2 border-amber-500/30 rounded-2xl w-[650px] max-h-[85vh] flex flex-col overflow-hidden shadow-2xl shadow-amber-900/20">
                {/* Decorative top border */}
                <div className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                
                {/* Header with close button */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-amber-500/20 bg-gray-900/50">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin size={10} />
                        {npc.zone || 'Unknown Location'}
                    </span>
                    <button onClick={onClose} className="p-1 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors">
                        <X size={16} className="text-gray-400" />
                    </button>
                </div>
                
                {/* Character Portraits */}
                <div className="p-4 bg-gradient-to-b from-gray-800/50 to-transparent">
                    <div className="flex items-center justify-center gap-8">
                        {/* Player Portrait */}
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/30 blur-lg animate-pulse" />
                                <div className="relative w-20 h-20 rounded-xl border-2 border-cyan-500/50 bg-gray-900 overflow-hidden shadow-lg shadow-cyan-900/30">
                                    <img 
                                        src={getPlayerSprite(playerClass)}
                                        alt={playerName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                </div>
                                <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-t border-l border-cyan-400" />
                                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 border-t border-r border-cyan-400" />
                                <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 border-b border-l border-cyan-400" />
                                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b border-r border-cyan-400" />
                            </div>
                            <p className="mt-2 text-sm font-bold text-cyan-300">{playerName}</p>
                            <p className="text-[10px] text-gray-500">Level {playerLevel}</p>
                        </div>
                        
                        {/* Dialogue indicator */}
                        <div className="flex flex-col items-center gap-1">
                            <MessageCircle size={20} className="text-amber-500/50" />
                            <div className="w-12 h-px bg-gradient-to-r from-cyan-500/50 via-amber-500/50 to-amber-500/50" />
                        </div>
                        
                        {/* NPC Portrait */}
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-500/30 to-yellow-500/30 blur-lg animate-pulse" />
                                <div className="relative w-20 h-20 rounded-xl border-2 border-amber-500/50 bg-gray-900 overflow-hidden shadow-lg shadow-amber-900/30">
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
                                                fallback.className = 'fallback-avatar w-full h-full flex items-center justify-center text-3xl';
                                                fallback.textContent = npc.avatar || '👤';
                                                parent.appendChild(fallback);
                                            }
                                        }}
                                    />
                                </div>
                                <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-t border-l border-amber-400" />
                                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 border-t border-r border-amber-400" />
                                <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 border-b border-l border-amber-400" />
                                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b border-r border-amber-400" />
                            </div>
                            <p className="mt-2 text-sm font-bold text-amber-300">{npc.name}</p>
                            <p className="text-[10px] text-gray-500">{npc.title}</p>
                        </div>
                    </div>
                </div>

                {/* Dialog content */}
                <div className="p-4 flex-1 overflow-y-auto">
                    {renderDialogContent()}
                </div>
                
                {/* Decorative bottom border */}
                <div className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
            </div>
        </div>
    );
};

export default NPCDialog;
