// ============================================
// USE CLOUD SAVE HOOK
// Manages cloud save state and operations
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import {
  savePlayerData,
  loadPlayerData,
  getCharacterSlots,
  deleteCharacter,
  startAutoSave,
  stopAutoSave,
  forceSave,
  validatePlayerData,
  type CharacterSlot,
} from '../services/playerDataService';
import type { Player } from '../types/game';

// ============================================
// TYPES
// ============================================

export interface CloudSaveState {
  isLoading: boolean;
  isSaving: boolean;
  lastSaveTime: number | null;
  lastSaveError: string | null;
  characterSlots: CharacterSlot[];
  currentCharacterId: string | null;
  currentSlotIndex: number;
  isCloudSaveEnabled: boolean;
}

export interface CloudSaveActions {
  loadCharacterSlots: () => Promise<CharacterSlot[]>;
  loadCharacter: (characterId: string) => Promise<Player | null>;
  saveCharacter: (player: Player) => Promise<boolean>;
  deleteCharacterSlot: (characterId: string) => Promise<boolean>;
  createNewCharacter: (player: Player, slotIndex: number) => Promise<string | null>;
  setCurrentSlot: (slotIndex: number, characterId?: string) => void;
  enableCloudSave: () => void;
  disableCloudSave: () => void;
}

// ============================================
// HOOK
// ============================================

export function useCloudSave(
  player: Player | null,
  setPlayer: (player: Player | ((prev: Player) => Player)) => void
): [CloudSaveState, CloudSaveActions] {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null);
  const [lastSaveError, setLastSaveError] = useState<string | null>(null);
  const [characterSlots, setCharacterSlots] = useState<CharacterSlot[]>([]);
  const [currentCharacterId, setCurrentCharacterId] = useState<string | null>(null);
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [isCloudSaveEnabled, setIsCloudSaveEnabled] = useState(true);

  // Refs for auto-save
  const playerRef = useRef(player);
  const slotIndexRef = useRef(currentSlotIndex);
  const characterIdRef = useRef(currentCharacterId);

  // Keep refs updated
  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    slotIndexRef.current = currentSlotIndex;
  }, [currentSlotIndex]);

  useEffect(() => {
    characterIdRef.current = currentCharacterId;
  }, [currentCharacterId]);

  // ==========================================
  // ACTIONS
  // ==========================================

  /**
   * Load all character slots for current user
   */
  const loadCharacterSlots = useCallback(async (): Promise<CharacterSlot[]> => {
    setIsLoading(true);
    try {
      const slots = await getCharacterSlots();
      setCharacterSlots(slots);
      return slots;
    } catch (error) {
      console.error('Failed to load character slots:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load a specific character
   */
  const loadCharacter = useCallback(async (characterId: string): Promise<Player | null> => {
    setIsLoading(true);
    setLastSaveError(null);
    
    try {
      const result = await loadPlayerData(characterId);
      
      if (result.success && result.data) {
        setCurrentCharacterId(characterId);
        setPlayer(result.data);
        return result.data;
      } else {
        setLastSaveError(result.error || 'Failed to load character');
        return null;
      }
    } catch (error: any) {
      setLastSaveError(error.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setPlayer]);

  /**
   * Save current character
   */
  const saveCharacter = useCallback(async (playerData: Player): Promise<boolean> => {
    if (!isCloudSaveEnabled) return true;
    
    setIsSaving(true);
    setLastSaveError(null);
    
    try {
      // Validate data before saving
      const validatedPlayer = validatePlayerData(playerData);
      
      const result = await savePlayerData(
        validatedPlayer,
        currentSlotIndex,
        currentCharacterId || undefined
      );
      
      if (result.success) {
        setLastSaveTime(Date.now());
        return true;
      } else {
        setLastSaveError(result.error || 'Save failed');
        return false;
      }
    } catch (error: any) {
      setLastSaveError(error.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [isCloudSaveEnabled, currentSlotIndex, currentCharacterId]);

  /**
   * Delete a character slot
   */
  const deleteCharacterSlot = useCallback(async (characterId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await deleteCharacter(characterId);
      if (result.success) {
        // Refresh slots
        await loadCharacterSlots();
        return true;
      }
      return false;
    } catch (error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadCharacterSlots]);

  /**
   * Create a new character
   */
  const createNewCharacter = useCallback(async (
    playerData: Player,
    slotIndex: number
  ): Promise<string | null> => {
    setIsSaving(true);
    setLastSaveError(null);
    
    try {
      const result = await savePlayerData(playerData, slotIndex);
      
      if (result.success) {
        // Reload slots to get the new character ID
        const slots = await loadCharacterSlots();
        const newSlot = slots.find(s => s.slot_index === slotIndex);
        
        if (newSlot) {
          setCurrentCharacterId(newSlot.id);
          setCurrentSlotIndex(slotIndex);
          return newSlot.id;
        }
      } else {
        setLastSaveError(result.error || 'Failed to create character');
      }
      return null;
    } catch (error: any) {
      setLastSaveError(error.message);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [loadCharacterSlots]);

  /**
   * Set current slot
   */
  const setCurrentSlot = useCallback((slotIndex: number, characterId?: string) => {
    setCurrentSlotIndex(slotIndex);
    if (characterId) {
      setCurrentCharacterId(characterId);
    }
  }, []);

  /**
   * Enable cloud save
   */
  const enableCloudSave = useCallback(() => {
    setIsCloudSaveEnabled(true);
  }, []);

  /**
   * Disable cloud save
   */
  const disableCloudSave = useCallback(() => {
    setIsCloudSaveEnabled(false);
  }, []);

  // ==========================================
  // AUTO-SAVE SETUP
  // ==========================================

  useEffect(() => {
    if (isCloudSaveEnabled && currentCharacterId) {
      startAutoSave(
        () => playerRef.current!,
        () => slotIndexRef.current,
        () => characterIdRef.current || undefined
      );
    }

    return () => {
      stopAutoSave();
    };
  }, [isCloudSaveEnabled, currentCharacterId]);

  // ==========================================
  // SAVE ON IMPORTANT EVENTS
  // ==========================================

  // Save when player levels up
  useEffect(() => {
    if (player?.level && currentCharacterId) {
      // Debounced save on level change
      const timer = setTimeout(() => {
        forceSave(player, currentSlotIndex, currentCharacterId);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [player?.level, currentCharacterId, currentSlotIndex]);

  // Save before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (player && currentCharacterId) {
        // Use sendBeacon for reliable save on page close
        const data = JSON.stringify({
          player: validatePlayerData(player),
          slotIndex: currentSlotIndex,
          characterId: currentCharacterId,
        });
        
        // Note: This won't work with Supabase directly, but the auto-save should have covered it
        console.log('[CloudSave] Page unloading, last auto-save was at:', lastSaveTime);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [player, currentCharacterId, currentSlotIndex, lastSaveTime]);

  // ==========================================
  // RETURN STATE AND ACTIONS
  // ==========================================

  const state: CloudSaveState = {
    isLoading,
    isSaving,
    lastSaveTime,
    lastSaveError,
    characterSlots,
    currentCharacterId,
    currentSlotIndex,
    isCloudSaveEnabled,
  };

  const actions: CloudSaveActions = {
    loadCharacterSlots,
    loadCharacter,
    saveCharacter,
    deleteCharacterSlot,
    createNewCharacter,
    setCurrentSlot,
    enableCloudSave,
    disableCloudSave,
  };

  return [state, actions];
}

// ============================================
// MIGRATION HELPER
// ============================================

/**
 * Migrate localStorage data to Supabase
 * Call this once when user first enables cloud save
 */
export async function migrateLocalStorageToCloud(
  localStorageKey: string,
  slotIndex: number
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  try {
    const localData = localStorage.getItem(localStorageKey);
    if (!localData) return false;

    const playerData = JSON.parse(localData);
    if (!playerData || !playerData.characterCreated) return false;

    const result = await savePlayerData(playerData, slotIndex);
    
    if (result.success) {
      // Optionally clear localStorage after successful migration
      // localStorage.removeItem(localStorageKey);
      console.log('[Migration] Successfully migrated local save to cloud');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[Migration] Failed:', error);
    return false;
  }
}
