/**
 * Admin Service - Functions for game administration
 * Only works for users with 'admin' or 'owner' role
 */

import { supabase } from './supabase';

export type UserRole = 'player' | 'moderator' | 'admin' | 'owner';

export interface GameConfig {
  id: string;
  exp_multiplier: number;
  drop_rate_multiplier: number;
  spirit_stones_multiplier: number;
  active_event: string | null;
  event_description: string | null;
  event_start: string | null;
  event_end: string | null;
  auto_ban_enabled: boolean;
  max_cheat_attempts_before_ban: number;
  maintenance_mode: boolean;
  maintenance_message: string | null;
  updated_at: string;
}

export interface CheatLogEntry {
  id: string;
  user_id: string;
  character_id: string | null;
  cheat_type: string;
  details: Record<string, unknown>;
  action_taken: 'blocked' | 'warned' | 'banned';
  detected_at: string;
}

export interface PlayerProfile {
  id: string;
  username: string;
  email: string | null;
  role: UserRole;
  is_banned: boolean;
  ban_reason: string | null;
  banned_at: string | null;
  cheat_attempts: number;
  last_cheat_attempt: string | null;
  created_at: string;
  last_login: string;
}

// ============================================
// Admin Check
// ============================================

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return data?.role || 'player';
}

export async function isAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === 'admin' || role === 'owner';
}

export async function isModerator(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === 'moderator' || role === 'admin' || role === 'owner';
}

// ============================================
// Game Configuration
// ============================================

export async function getGameConfig(): Promise<GameConfig | null> {
  const { data, error } = await supabase
    .from('game_config')
    .select('*')
    .eq('id', 'global')
    .single();

  if (error) {
    console.error('Failed to get game config:', error);
    return null;
  }

  return data;
}

// ============================================
// Event Management
// ============================================

export async function startEvent(
  eventName: string,
  description: string,
  expMultiplier: number = 1.0,
  dropMultiplier: number = 1.0,
  stonesMultiplier: number = 1.0,
  durationHours: number = 24
): Promise<{ success: boolean; error?: string; endsAt?: string }> {
  const { data, error } = await supabase.rpc('admin_set_event', {
    p_event_name: eventName,
    p_description: description,
    p_exp_mult: expMultiplier,
    p_drop_mult: dropMultiplier,
    p_stones_mult: stonesMultiplier,
    p_duration_hours: durationHours
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { 
    success: data.success, 
    error: data.error,
    endsAt: data.ends_at 
  };
}

export async function endEvent(): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('admin_end_event');

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: data.success, error: data.error };
}

// ============================================
// Player Management
// ============================================

export async function banPlayer(
  userId: string, 
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('admin_ban_player', {
    p_target_user_id: userId,
    p_reason: reason
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: data.success, error: data.error };
}

export async function unbanPlayer(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('admin_unban_player', {
    p_target_user_id: userId
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: data.success, error: data.error };
}

export async function getAllPlayers(): Promise<PlayerProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get players:', error);
    return [];
  }

  return data || [];
}

export async function getBannedPlayers(): Promise<PlayerProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_banned', true)
    .order('banned_at', { ascending: false });

  if (error) {
    console.error('Failed to get banned players:', error);
    return [];
  }

  return data || [];
}

// ============================================
// Cheat Log Monitoring
// ============================================

export async function getCheatLogs(
  limit: number = 100
): Promise<CheatLogEntry[]> {
  const { data, error } = await supabase
    .from('cheat_log')
    .select('*')
    .order('detected_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to get cheat logs:', error);
    return [];
  }

  return data || [];
}

export async function getPlayerCheatHistory(
  userId: string
): Promise<CheatLogEntry[]> {
  const { data, error } = await supabase
    .from('cheat_log')
    .select('*')
    .eq('user_id', userId)
    .order('detected_at', { ascending: false });

  if (error) {
    console.error('Failed to get player cheat history:', error);
    return [];
  }

  return data || [];
}

// ============================================
// Quick Event Presets
// ============================================

export const EVENT_PRESETS = {
  doubleExp: {
    name: '🔥 Double EXP Weekend',
    description: 'Gain 2x experience from all sources!',
    expMult: 2.0,
    dropMult: 1.0,
    stonesMult: 1.0,
    hours: 48
  },
  doubleDrops: {
    name: '💎 Treasure Hunt',
    description: 'Double drop rates from all enemies!',
    expMult: 1.0,
    dropMult: 2.0,
    stonesMult: 1.0,
    hours: 24
  },
  goldenWeek: {
    name: '🌟 Golden Week',
    description: '50% bonus to everything!',
    expMult: 1.5,
    dropMult: 1.5,
    stonesMult: 1.5,
    hours: 168 // 1 week
  },
  farmingFrenzy: {
    name: '💰 Spirit Stone Frenzy',
    description: 'Triple spirit stones from combat!',
    expMult: 1.0,
    dropMult: 1.0,
    stonesMult: 3.0,
    hours: 12
  }
} as const;

export async function startPresetEvent(
  preset: keyof typeof EVENT_PRESETS
): Promise<{ success: boolean; error?: string }> {
  const event = EVENT_PRESETS[preset];
  return startEvent(
    event.name,
    event.description,
    event.expMult,
    event.dropMult,
    event.stonesMult,
    event.hours
  );
}
