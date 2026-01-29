// ============================================
// SUPABASE CLIENT - 凌云道 (Língyún Dào)
// Database connection client
// ============================================

import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Replace these values with yours after creating the account
// You can get this from the Supabase dashboard
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-public-key-here';

// Create the Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// TypeScript types
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  last_login?: string;
}

export interface PlayerData {
  user_id: string;
  character_slots: any[];
  settings: any;
  created_at: string;
  updated_at: string;
}
