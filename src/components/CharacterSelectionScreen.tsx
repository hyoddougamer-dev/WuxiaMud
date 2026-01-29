// ============================================
// CHARACTER SELECTION SCREEN - 凌云道 (Língyún Dào)
// Multi-character management with slots
// ============================================

import React, { useState, useEffect } from 'react';
import { 
  User, Plus, Trash2, Play, Star, Shield, Sword, 
  Sparkles, Clock, X, AlertTriangle, ChevronRight, Settings, Crown,
  Zap, Heart, Coins, Flame, Snowflake, Skull, Leaf, Music, Moon, Gem, Dog, Globe
} from 'lucide-react';
import { hybridClassSystem } from '../data/hybridClasses';

// Types
interface SavedCharacter {
  id: string;
  name: string;
  avatar: string;
  level: number;
  realm: string;
  selectedClass: number;
  spiritStones: number;
  playTime: number; // in seconds
  lastPlayed: number; // timestamp
  saveData: any; // Full player state
}

interface CharacterSlot {
  index: number;
  character: SavedCharacter | null;
  isLocked: boolean;
}

interface CharacterSelectionScreenProps {
  onSelectCharacter: (saveData: any) => void;
  onCreateNew: () => void;
  maxSlots?: number;
  characterSlots?: SavedCharacter[]; // From Supabase
  onSaveSlots?: (slots: SavedCharacter[]) => Promise<void>; // Save to Supabase
}

// Constants
const STORAGE_KEY = 'wuxia_characters_v1';
const MAX_FREE_SLOTS = 5;

// Helper to format play time
const formatPlayTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

// Helper to format last played
const formatLastPlayed = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor(diff / (1000 * 60));
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (mins > 0) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  return 'Just now';
};

// Get class icon
const getClassIcon = (id: number): React.ReactNode => {
  const icons = [Flame, Snowflake, Sparkles, Skull, Zap, Shield, Leaf, Dog, Flame, Music, Moon, Gem];
  const IconComponent = icons[id - 1] || Sword;
  return <IconComponent size={18} />;
};

// Get realm color
const getRealmColor = (realm: string): string => {
  if (realm.includes('Qi')) return 'text-green-400 bg-green-500/20 border-green-500/30';
  if (realm.includes('Foundation')) return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
  if (realm.includes('Golden')) return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
  return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
};

// Character Card Component
const CharacterCard: React.FC<{
  slot: CharacterSlot;
  onSelect: () => void;
  onDelete: () => void;
  onCreate: () => void;
  isSelected: boolean;
}> = ({ slot, onSelect, onDelete, onCreate, isSelected }) => {
  const { character, isLocked } = slot;
  
  if (isLocked) {
    return (
      <div className="relative h-48 rounded-2xl border-2 border-dashed border-gray-700/50 bg-gray-900/30 flex flex-col items-center justify-center opacity-50">
        <Shield size={32} className="text-gray-600 mb-2" />
        <span className="text-sm text-gray-600 font-medium">Locked Slot</span>
        <span className="text-xs text-gray-700 mt-1">Premium Feature</span>
      </div>
    );
  }
  
  if (!character) {
    return (
      <button
        onClick={onCreate}
        className="relative h-48 rounded-2xl border-2 border-dashed border-amber-500/30 bg-gradient-to-br from-amber-900/10 to-transparent hover:border-amber-500/60 hover:from-amber-900/20 transition-all group flex flex-col items-center justify-center"
      >
        <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mb-3 group-hover:bg-amber-500/20 transition-all">
          <Plus size={28} className="text-amber-500" />
        </div>
        <span className="text-amber-400 font-bold">Create Character</span>
        <span className="text-xs text-gray-500 mt-1">Start a new journey</span>
      </button>
    );
  }
  
  const classData = hybridClassSystem.find(c => c.id === character.selectedClass);
  
  return (
    <div 
      className={`relative h-48 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden group ${
        isSelected 
          ? 'border-amber-500 shadow-lg shadow-amber-500/30 bg-gradient-to-br from-amber-900/30 to-amber-900/10' 
          : 'border-gray-700/50 bg-gradient-to-br from-[#1a1d28] to-[#12151c] hover:border-amber-500/50'
      }`}
      onClick={onSelect}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_30%,rgba(255,200,100,0.3),transparent_50%)]" />
      
      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-red-900/50 hover:bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
      >
        <Trash2 size={14} className="text-red-300" />
      </button>
      
      {/* Content */}
      <div className="relative p-4 h-full flex flex-col">
        {/* Top row: Avatar + Info */}
        <div className="flex items-start gap-3 mb-3">
          <div className="relative">
            <div className={`w-16 h-16 rounded-xl overflow-hidden border-2 ${isSelected ? 'border-amber-400' : 'border-gray-600'}`}>
              <img 
                src={character.avatar} 
                alt={character.name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-avatar.png'; }}
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#12151c]">
              {character.level}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={`font-bold text-lg truncate ${isSelected ? 'text-amber-300' : 'text-white'}`}>
              {character.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getRealmColor(character.realm)}`}>
                {character.realm}
              </span>
            </div>
          </div>
        </div>
        
        {/* Class info */}
        <div className="flex items-center gap-2 mb-auto">
          <span className="text-lg">{getClassIcon(character.selectedClass)}</span>
          <span className="text-sm text-gray-400">{classData?.name || 'Unknown'}</span>
        </div>
        
        {/* Bottom stats */}
        <div className="flex items-center justify-between text-xs border-t border-gray-700/50 pt-2 mt-2">
          <div className="flex items-center gap-3">
            <span className="text-gray-500 flex items-center gap-1">
              <Clock size={10} />
              {formatPlayTime(character.playTime)}
            </span>
            <span className="text-amber-400/70 flex items-center gap-1">
              <Coins size={10} />
              {character.spiritStones.toLocaleString()}
            </span>
          </div>
          <span className="text-gray-600">{formatLastPlayed(character.lastPlayed)}</span>
        </div>
      </div>
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber-500 to-amber-600" />
      )}
    </div>
  );
};

// Main Component
export const CharacterSelectionScreen: React.FC<CharacterSelectionScreenProps> = ({
  onSelectCharacter,
  onCreateNew,
  maxSlots = MAX_FREE_SLOTS,
  characterSlots = [],
  onSaveSlots
}) => {
  const [characters, setCharacters] = useState<SavedCharacter[]>(characterSlots);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Update characters when props change
  useEffect(() => {
    setCharacters(characterSlots);
    // Auto-select first character
    if (characterSlots.length > 0 && !selectedId) {
      setSelectedId(characterSlots[0].id);
    }
  }, [characterSlots, selectedId]);
  
  // Build slots
  const slots: CharacterSlot[] = [];
  for (let i = 0; i < maxSlots; i++) {
    slots.push({
      index: i,
      character: characters[i] || null,
      isLocked: i >= MAX_FREE_SLOTS,
    });
  }
  
  // Handle character selection
  const handlePlay = async () => {
    const char = characters.find(c => c.id === selectedId);
    
    if (char) {
      // Update last played
      const updated = characters.map(c => 
        c.id === selectedId ? { ...c, lastPlayed: Date.now() } : c
      );
      
      // Save to Supabase if available, otherwise localStorage
      if (onSaveSlots) {
        await onSaveSlots(updated);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      
      onSelectCharacter(char.saveData);
    }
  };
  
  // Handle delete
  const handleDelete = async (id: string) => {
    const updated = characters.filter(c => c.id !== id);
    setCharacters(updated);
    
    // Save to Supabase if available, otherwise localStorage
    if (onSaveSlots) {
      await onSaveSlots(updated);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    
    setShowDeleteConfirm(null);
    if (selectedId === id) {
      setSelectedId(updated[0]?.id || null);
    }
  };
  
  const selectedChar = characters.find(c => c.id === selectedId);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-8">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      >
        <source src="/background-video.mp4" type="video/mp4" />
      </video>
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0c10]/90 via-[#151820]/80 to-[#0a0c10]/90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,200,100,0.08),transparent_50%)]" />
      
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-amber-500/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float-particle ${4 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>
      
      <div className="relative w-full max-w-5xl mx-4">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <img 
            src="/logo.png" 
            alt="Língyún Dào" 
            className="h-28 mx-auto mb-4 drop-shadow-[0_0_25px_rgba(255,180,50,0.4)]"
          />
          <h2 className="text-xl text-amber-400/80 font-serif tracking-wider mb-1">選擇角色</h2>
          <p className="text-gray-400 text-sm">Select a character or begin a new journey</p>
        </div>
        
        {/* Character Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {slots.map((slot) => (
            <CharacterCard
              key={slot.index}
              slot={slot}
              isSelected={selectedId === slot.character?.id}
              onSelect={() => slot.character && setSelectedId(slot.character.id)}
              onDelete={() => slot.character && setShowDeleteConfirm(slot.character.id)}
              onCreate={onCreateNew}
            />
          ))}
        </div>
        
        {/* Action Bar */}
        <div className="flex items-center justify-center gap-4 bg-[#12151c]/80 backdrop-blur-sm border border-amber-600/30 rounded-2xl p-4 shadow-2xl">
          {/* Play Button */}
          <button
            onClick={handlePlay}
            disabled={!selectedId}
            className={`flex items-center gap-3 px-8 py-3 rounded-xl font-bold text-lg transition-all ${
              selectedId
                ? 'bg-gradient-to-r from-amber-600 to-amber-800 text-white hover:from-amber-500 hover:to-amber-700 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            <Play size={20} />
            <span>進入世界</span>
            <span className="text-sm font-normal opacity-80">Enter World</span>
            <ChevronRight size={20} />
          </button>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-6 text-gray-500 text-xs flex items-center justify-center gap-1">
          <Globe size={12} /> 凌雲道 · Progress synced to cloud
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-b from-[#1a1d28] to-[#12151c] border-2 border-red-500/40 rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle size={32} className="text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Character?</h3>
              <p className="text-gray-400 text-sm mb-6">
                This action cannot be undone. All progress for this character will be permanently lost.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold transition-all"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to save character to multi-character system
export const saveCharacterToSlot = (playerData: any): void => {
  const saved = localStorage.getItem(STORAGE_KEY);
  let characters: SavedCharacter[] = [];
  
  if (saved) {
    try {
      characters = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved characters');
    }
  }
  
  // Find existing character by name or create new
  const existingIndex = characters.findIndex(c => c.name === playerData.name);
  
  const charData: SavedCharacter = {
    id: existingIndex >= 0 ? characters[existingIndex].id : `char_${Date.now()}`,
    name: playerData.name,
    avatar: playerData.avatar,
    level: playerData.level,
    realm: playerData.realm,
    selectedClass: playerData.selectedClass,
    spiritStones: playerData.spiritStones,
    playTime: existingIndex >= 0 ? characters[existingIndex].playTime : 0,
    lastPlayed: Date.now(),
    saveData: playerData,
  };
  
  if (existingIndex >= 0) {
    characters[existingIndex] = charData;
  } else {
    characters.push(charData);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
};

// Helper to update play time
export const updatePlayTime = (playerName: string, additionalSeconds: number): void => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  
  try {
    const characters: SavedCharacter[] = JSON.parse(saved);
    const index = characters.findIndex(c => c.name === playerName);
    if (index >= 0) {
      characters[index].playTime += additionalSeconds;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
    }
  } catch (e) {
    console.error('Failed to update play time');
  }
};

export default CharacterSelectionScreen;
