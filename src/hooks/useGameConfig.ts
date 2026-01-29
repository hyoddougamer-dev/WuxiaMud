/**
 * Hook to get real-time game configuration (events, multipliers)
 * This automatically updates when admins change settings
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

export interface GameConfig {
  exp_multiplier: number;
  drop_rate_multiplier: number;
  spirit_stones_multiplier: number;
  active_event: string | null;
  event_description: string | null;
  event_start: string | null;
  event_end: string | null;
  maintenance_mode: boolean;
  maintenance_message: string | null;
}

const DEFAULT_CONFIG: GameConfig = {
  exp_multiplier: 1.0,
  drop_rate_multiplier: 1.0,
  spirit_stones_multiplier: 1.0,
  active_event: null,
  event_description: null,
  event_start: null,
  event_end: null,
  maintenance_mode: false,
  maintenance_message: null
};

export function useGameConfig() {
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('game_config')
        .select('*')
        .eq('id', 'global')
        .single();

      if (fetchError) {
        // If table doesn't exist yet, use defaults
        if (fetchError.code === 'PGRST116') {
          setConfig(DEFAULT_CONFIG);
        } else {
          throw fetchError;
        }
      } else if (data) {
        setConfig({
          exp_multiplier: Number(data.exp_multiplier) || 1.0,
          drop_rate_multiplier: Number(data.drop_rate_multiplier) || 1.0,
          spirit_stones_multiplier: Number(data.spirit_stones_multiplier) || 1.0,
          active_event: data.active_event,
          event_description: data.event_description,
          event_start: data.event_start,
          event_end: data.event_end,
          maintenance_mode: data.maintenance_mode || false,
          maintenance_message: data.maintenance_message
        });
      }
    } catch (err) {
      console.error('Failed to fetch game config:', err);
      setError(err instanceof Error ? err.message : 'Failed to load config');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('game_config_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_config',
          filter: 'id=eq.global'
        },
        (payload) => {
          console.log('🎉 Game config updated!', payload.new);
          const data = payload.new;
          setConfig({
            exp_multiplier: Number(data.exp_multiplier) || 1.0,
            drop_rate_multiplier: Number(data.drop_rate_multiplier) || 1.0,
            spirit_stones_multiplier: Number(data.spirit_stones_multiplier) || 1.0,
            active_event: data.active_event,
            event_description: data.event_description,
            event_start: data.event_start,
            event_end: data.event_end,
            maintenance_mode: data.maintenance_mode || false,
            maintenance_message: data.maintenance_message
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConfig]);

  // Check if event is still active
  const isEventActive = useCallback(() => {
    if (!config.active_event || !config.event_end) return false;
    return new Date(config.event_end) > new Date();
  }, [config]);

  // Get time remaining for event
  const getEventTimeRemaining = useCallback(() => {
    if (!config.event_end) return null;
    const endTime = new Date(config.event_end).getTime();
    const now = Date.now();
    const diff = endTime - now;
    
    if (diff <= 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  }, [config]);

  return {
    config,
    loading,
    error,
    isEventActive,
    getEventTimeRemaining,
    refetch: fetchConfig
  };
}

// Helper functions to apply multipliers
export function applyExpMultiplier(baseExp: number, config: GameConfig): number {
  return Math.floor(baseExp * config.exp_multiplier);
}

export function applyDropMultiplier(baseRate: number, config: GameConfig): number {
  return baseRate * config.drop_rate_multiplier;
}

export function applyStonesMultiplier(baseStones: number, config: GameConfig): number {
  return Math.floor(baseStones * config.spirit_stones_multiplier);
}
