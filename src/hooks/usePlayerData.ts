// ============================================
// PLAYER DATA HOOK - 凌云道 (Língyún Dào)
// Manages loading and syncing player data with Supabase
// ============================================

import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface PlayerDataState {
  characterSlots: any[];
  settings: any;
  loading: boolean;
  error: string | null;
}

export const usePlayerData = () => {
  const { user } = useAuth();
  const [playerData, setPlayerData] = useState<PlayerDataState>({
    characterSlots: [],
    settings: {},
    loading: true,
    error: null,
  });

  // Carrega dados do jogador do Supabase
  useEffect(() => {
    if (!user) {
      setPlayerData({
        characterSlots: [],
        settings: {},
        loading: false,
        error: null,
      });
      return;
    }

    // Clear old localStorage to avoid conflicts
    // Data is now managed by Supabase
    localStorage.removeItem('wuxia_player_v26');
    localStorage.removeItem('wuxia_player_v25');
    localStorage.removeItem('wuxia_characters_v1');
    
    loadPlayerData();
  }, [user]);

  const loadPlayerData = async () => {
    try {
      setPlayerData(prev => ({ ...prev, loading: true, error: null }));

      // Timeout de 5 segundos
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );

      const queryPromise = supabase
        .from('player_data')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      const { data, error } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as any;

      if (error) {
        // Se não existir registo, criar um novo
        if (error.code === 'PGRST116') {
          await createPlayerData();
          return;
        }
        throw error;
      }

      setPlayerData({
        characterSlots: data?.character_slots || [],
        settings: data?.settings || {},
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Error loading player data:', error);
      setPlayerData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load player data',
      }));
    }
  };

  const createPlayerData = async () => {
    try {
      const { data, error } = await supabase
        .from('player_data')
        .insert({
          user_id: user!.id,
          character_slots: [],
          settings: {},
        })
        .select()
        .single();

      if (error) throw error;

      setPlayerData({
        characterSlots: [],
        settings: {},
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Error creating player data:', error);
      setPlayerData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to create player data',
      }));
    }
  };

  // Salva os slots de personagens no Supabase
  const saveCharacterSlots = async (slots: any[]) => {
    if (!user) return { error: 'No user logged in' };

    try {
      const { error } = await supabase
        .from('player_data')
        .update({
          character_slots: slots,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setPlayerData(prev => ({
        ...prev,
        characterSlots: slots,
      }));

      return { success: true };
    } catch (error: any) {
      console.error('Error saving character slots:', error);
      return { error: error.message || 'Failed to save character slots' };
    }
  };

  // Save settings to Supabase
  const saveSettings = async (settings: any) => {
    if (!user) return { error: 'No user logged in' };

    try {
      const { error } = await supabase
        .from('player_data')
        .update({
          settings: settings,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setPlayerData(prev => ({
        ...prev,
        settings: settings,
      }));

      return { success: true };
    } catch (error: any) {
      console.error('Error saving settings:', error);
      return { error: error.message || 'Failed to save settings' };
    }
  };

  // Recarrega os dados manualmente
  const refreshPlayerData = async () => {
    if (user) {
      await loadPlayerData();
    }
  };

  return {
    ...playerData,
    saveCharacterSlots,
    saveSettings,
    refreshPlayerData,
  };
};
