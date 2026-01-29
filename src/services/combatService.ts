/**
 * Combat Service - Server-validated combat system
 * All combat rewards are validated and capped by the server
 */

import { supabase } from './supabase';

export interface CombatSession {
  session_id: string;
  enemy_id: string;
  enemy_level: number;
}

export interface CombatResult {
  success: boolean;
  error?: string;
  result?: 'victory' | 'defeat' | 'fled';
  exp_gained?: number;
  stones_gained?: number;
  items?: unknown[];
}

/**
 * Start a combat session (must be called before claiming rewards)
 * This creates a server-side record of the combat
 */
export async function startCombat(
  characterId: string,
  enemyId: string,
  enemyLevel: number
): Promise<{ success: boolean; session?: CombatSession; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('start_combat', {
      p_character_id: characterId,
      p_enemy_id: enemyId,
      p_enemy_level: enemyLevel
    });

    if (error) {
      console.error('Failed to start combat:', error);
      return { success: false, error: error.message };
    }

    if (!data.success) {
      return { success: false, error: data.error };
    }

    return {
      success: true,
      session: {
        session_id: data.session_id,
        enemy_id: data.enemy_id,
        enemy_level: data.enemy_level
      }
    };
  } catch (err) {
    console.error('Combat start error:', err);
    return { success: false, error: 'Failed to start combat' };
  }
}

/**
 * End a combat session and claim rewards
 * The server validates and caps all rewards
 */
export async function endCombat(
  sessionId: string,
  result: 'victory' | 'defeat' | 'fled',
  expClaimed: number,
  stonesClaimed: number,
  itemsClaimed: unknown[] = []
): Promise<CombatResult> {
  try {
    const { data, error } = await supabase.rpc('end_combat', {
      p_session_id: sessionId,
      p_result: result,
      p_exp_claimed: expClaimed,
      p_stones_claimed: stonesClaimed,
      p_items_claimed: itemsClaimed
    });

    if (error) {
      console.error('Failed to end combat:', error);
      return { success: false, error: error.message };
    }

    return {
      success: data.success,
      error: data.error,
      result: data.result,
      exp_gained: data.exp_gained,
      stones_gained: data.stones_gained,
      items: data.items
    };
  } catch (err) {
    console.error('Combat end error:', err);
    return { success: false, error: 'Failed to end combat' };
  }
}

/**
 * Combat Manager class for easier integration
 * Wraps the combat flow in a simple interface
 */
export class CombatManager {
  private currentSession: CombatSession | null = null;
  private characterId: string;

  constructor(characterId: string) {
    this.characterId = characterId;
  }

  /**
   * Start a new combat
   */
  async start(enemyId: string, enemyLevel: number): Promise<boolean> {
    const result = await startCombat(this.characterId, enemyId, enemyLevel);
    
    if (result.success && result.session) {
      this.currentSession = result.session;
      return true;
    }
    
    console.warn('Failed to start combat:', result.error);
    return false;
  }

  /**
   * Check if combat is in progress
   */
  isInCombat(): boolean {
    return this.currentSession !== null;
  }

  /**
   * Get current session info
   */
  getSession(): CombatSession | null {
    return this.currentSession;
  }

  /**
   * End combat with victory and claim rewards
   * Returns the validated rewards from server
   */
  async victory(
    expClaimed: number,
    stonesClaimed: number,
    itemsClaimed: unknown[] = []
  ): Promise<CombatResult> {
    if (!this.currentSession) {
      return { success: false, error: 'No active combat session' };
    }

    const result = await endCombat(
      this.currentSession.session_id,
      'victory',
      expClaimed,
      stonesClaimed,
      itemsClaimed
    );

    this.currentSession = null;
    return result;
  }

  /**
   * End combat with defeat
   */
  async defeat(): Promise<CombatResult> {
    if (!this.currentSession) {
      return { success: false, error: 'No active combat session' };
    }

    const result = await endCombat(
      this.currentSession.session_id,
      'defeat',
      0,
      0,
      []
    );

    this.currentSession = null;
    return result;
  }

  /**
   * Flee from combat
   */
  async flee(): Promise<CombatResult> {
    if (!this.currentSession) {
      return { success: false, error: 'No active combat session' };
    }

    const result = await endCombat(
      this.currentSession.session_id,
      'fled',
      0,
      0,
      []
    );

    this.currentSession = null;
    return result;
  }

  /**
   * Force clear session (for cleanup on component unmount)
   */
  clearSession(): void {
    this.currentSession = null;
  }
}

/**
 * React hook for combat management
 */
import { useState, useCallback, useRef, useEffect } from 'react';

export function useCombat(characterId: string | null) {
  const managerRef = useRef<CombatManager | null>(null);
  const [isInCombat, setIsInCombat] = useState(false);
  const [session, setSession] = useState<CombatSession | null>(null);

  // Initialize manager when character changes
  useEffect(() => {
    if (characterId) {
      managerRef.current = new CombatManager(characterId);
    } else {
      managerRef.current = null;
    }
    setIsInCombat(false);
    setSession(null);
  }, [characterId]);

  const startCombat = useCallback(async (enemyId: string, enemyLevel: number) => {
    if (!managerRef.current) return false;
    
    const success = await managerRef.current.start(enemyId, enemyLevel);
    if (success) {
      setIsInCombat(true);
      setSession(managerRef.current.getSession());
    }
    return success;
  }, []);

  const endVictory = useCallback(async (exp: number, stones: number, items: unknown[] = []) => {
    if (!managerRef.current) return { success: false, error: 'No manager' };
    
    const result = await managerRef.current.victory(exp, stones, items);
    setIsInCombat(false);
    setSession(null);
    return result;
  }, []);

  const endDefeat = useCallback(async () => {
    if (!managerRef.current) return { success: false, error: 'No manager' };
    
    const result = await managerRef.current.defeat();
    setIsInCombat(false);
    setSession(null);
    return result;
  }, []);

  const flee = useCallback(async () => {
    if (!managerRef.current) return { success: false, error: 'No manager' };
    
    const result = await managerRef.current.flee();
    setIsInCombat(false);
    setSession(null);
    return result;
  }, []);

  return {
    isInCombat,
    session,
    startCombat,
    endVictory,
    endDefeat,
    flee
  };
}
