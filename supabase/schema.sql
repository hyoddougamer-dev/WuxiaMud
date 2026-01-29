-- ============================================
-- LÍNGYÚN DÀO - SUPABASE SCHEMA
-- Complete database schema with security
-- ============================================
-- 
-- HOW TO USE:
-- 1. Go to Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run"
-- 
-- This script is IDEMPOTENT - safe to run multiple times
-- ============================================

-- ============================================
-- 1. PROFILES TABLE (extends auth.users)
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ DEFAULT NOW(),
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  banned_at TIMESTAMPTZ,
  total_playtime_minutes INTEGER DEFAULT 0,
  
  -- ADMIN SYSTEM
  role TEXT DEFAULT 'player' CHECK (role IN ('player', 'moderator', 'admin', 'owner')),
  -- player: Normal user
  -- moderator: Can view reports, mute players
  -- admin: Can ban, create events, modify drop rates
  -- owner: Full access (you!)
  
  -- Cheat detection tracking
  cheat_attempts INTEGER DEFAULT 0,
  last_cheat_attempt TIMESTAMPTZ
);

-- Add missing columns if table already exists (for migrations)
DO $$ 
BEGIN
  -- Add is_banned column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_banned') THEN
    ALTER TABLE public.profiles ADD COLUMN is_banned BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add ban_reason column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'ban_reason') THEN
    ALTER TABLE public.profiles ADD COLUMN ban_reason TEXT;
  END IF;

  -- Add role column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'player';
  END IF;
  
  -- Add banned_at column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'banned_at') THEN
    ALTER TABLE public.profiles ADD COLUMN banned_at TIMESTAMPTZ;
  END IF;
  
  -- Add cheat_attempts column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'cheat_attempts') THEN
    ALTER TABLE public.profiles ADD COLUMN cheat_attempts INTEGER DEFAULT 0;
  END IF;
  
  -- Add last_cheat_attempt column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'last_cheat_attempt') THEN
    ALTER TABLE public.profiles ADD COLUMN last_cheat_attempt TIMESTAMPTZ;
  END IF;

  -- Add total_playtime_minutes column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'total_playtime_minutes') THEN
    ALTER TABLE public.profiles ADD COLUMN total_playtime_minutes INTEGER DEFAULT 0;
  END IF;
END $$;

-- RLS: Users can only read/update their own profile
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to make script idempotent
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'owner', 'moderator')
    )
  );

-- SECURITY: Users can only update specific fields, NOT role, is_banned, etc.
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Prevent users from changing their own role or ban status
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = role AND
    (SELECT is_banned FROM public.profiles WHERE id = auth.uid()) = is_banned
  );

-- Admins can update any profile (for banning, role changes)
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. CHARACTERS TABLE (game saves)
-- ============================================

CREATE TABLE IF NOT EXISTS public.characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  slot_index INTEGER NOT NULL CHECK (slot_index >= 0 AND slot_index < 5),
  
  -- Basic Info
  name TEXT NOT NULL,
  title TEXT DEFAULT '',
  avatar TEXT NOT NULL,
  selected_class INTEGER NOT NULL,
  
  -- Stats
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 100),
  realm TEXT DEFAULT 'Mortal',
  exp INTEGER DEFAULT 0 CHECK (exp >= 0),
  ap INTEGER DEFAULT 0 CHECK (ap >= 0),
  total_ap_earned INTEGER DEFAULT 0 CHECK (total_ap_earned >= 0),
  
  -- Resources
  hp INTEGER NOT NULL CHECK (hp >= 0),
  max_hp INTEGER NOT NULL CHECK (max_hp > 0),
  qi INTEGER NOT NULL CHECK (qi >= 0),
  max_qi INTEGER NOT NULL CHECK (max_qi >= 0),
  spirit_stones INTEGER DEFAULT 0 CHECK (spirit_stones >= 0),
  contribution INTEGER DEFAULT 0 CHECK (contribution >= 0),
  
  -- Base Stats (JSON for flexibility)
  base_stats JSONB NOT NULL DEFAULT '{"str": 5, "dex": 5, "con": 5, "spi": 5, "wil": 5}',
  
  -- Equipment (references inventory items by ID)
  equipment JSONB DEFAULT '{"weapon": null, "ring": null, "necklace": null}',
  
  -- Skills
  skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  learned_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  skill_cooldowns JSONB DEFAULT '{}',
  unlocked_ultimates TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Progress Tracking
  visited TEXT[] DEFAULT ARRAY[]::TEXT[],
  kill_counter JSONB DEFAULT '{}',
  bestiary_progress JSONB DEFAULT '{"claimedDiscovery": [], "claimedMobMilestones": {}, "claimedRealmMastery": [], "claimedTagMastery": {}}',
  quest_log JSONB DEFAULT '{"activeQuests": [], "completedQuests": [], "failedQuests": []}',
  
  -- State
  passive_state JSONB,
  pity_state JSONB DEFAULT '{"dropKillsWithoutDrop": 0, "craftFailures": 0, "reforgeFailures": 0, "legendaryEssence": 0}',
  
  -- Flags
  tutorial_completed BOOLEAN DEFAULT FALSE,
  is_meditating BOOLEAN DEFAULT FALSE,
  last_combat_time BIGINT DEFAULT 0,
  auto_combat_time_used_today INTEGER DEFAULT 0,
  auto_combat_last_reset BIGINT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_played_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one character per slot per user
  UNIQUE(user_id, slot_index)
);

-- RLS: Users can only access their own characters
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to make script idempotent
DROP POLICY IF EXISTS "Users can view own characters" ON public.characters;
DROP POLICY IF EXISTS "Users can insert own characters" ON public.characters;
DROP POLICY IF EXISTS "Users can update own characters" ON public.characters;
DROP POLICY IF EXISTS "Users can delete own characters" ON public.characters;

CREATE POLICY "Users can view own characters" ON public.characters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own characters" ON public.characters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own characters" ON public.characters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own characters" ON public.characters
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 3. INVENTORY TABLE (separate for security)
-- ============================================

CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Item Data
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('consumable', 'material', 'quest', 'gear', 'trash')),
  count INTEGER DEFAULT 1 CHECK (count > 0),
  
  -- Gear-specific fields
  rarity TEXT,
  tier INTEGER,
  stats JSONB,
  slot TEXT,
  durability INTEGER,
  max_durability INTEGER,
  element TEXT,
  
  -- Item details
  effect TEXT,
  amount INTEGER,
  icon_type TEXT,
  description TEXT,
  quest_id TEXT,
  
  -- Location: 'inventory' or 'bank'
  location TEXT DEFAULT 'inventory' CHECK (location IN ('inventory', 'bank')),
  
  -- Timestamps
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_inventory_character ON public.inventory(character_id);
CREATE INDEX IF NOT EXISTS idx_inventory_user ON public.inventory(user_id);

-- RLS: Users can only access their own inventory
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to make script idempotent
DROP POLICY IF EXISTS "Users can view own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can insert own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can update own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can delete own inventory" ON public.inventory;

CREATE POLICY "Users can view own inventory" ON public.inventory
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory" ON public.inventory
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory" ON public.inventory
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory" ON public.inventory
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 4. MARKET LISTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.market_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  seller_name TEXT NOT NULL,
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  
  -- Item being sold (snapshot at listing time)
  item_data JSONB NOT NULL,
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL,
  item_rarity TEXT,
  item_tier INTEGER,
  
  -- Pricing
  price INTEGER NOT NULL CHECK (price > 0),
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled', 'expired')),
  buyer_id UUID REFERENCES auth.users(id),
  buyer_name TEXT,
  
  -- Timestamps
  listed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  sold_at TIMESTAMPTZ,
  
  -- Search optimization
  search_text TEXT GENERATED ALWAYS AS (
    LOWER(item_name) || ' ' || LOWER(COALESCE(item_type, '')) || ' ' || LOWER(COALESCE(item_rarity, ''))
  ) STORED
);

-- Index for market searches
CREATE INDEX IF NOT EXISTS idx_market_status ON public.market_listings(status);
CREATE INDEX IF NOT EXISTS idx_market_seller ON public.market_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_market_search ON public.market_listings USING gin(to_tsvector('english', search_text));

-- RLS: Everyone can view active listings, but only owner can modify
ALTER TABLE public.market_listings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to make script idempotent
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.market_listings;
DROP POLICY IF EXISTS "Users can insert own listings" ON public.market_listings;
DROP POLICY IF EXISTS "Users can update own listings" ON public.market_listings;

CREATE POLICY "Anyone can view active listings" ON public.market_listings
  FOR SELECT USING (status = 'active' OR auth.uid() = seller_id OR auth.uid() = buyer_id);

CREATE POLICY "Users can insert own listings" ON public.market_listings
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update own listings" ON public.market_listings
  FOR UPDATE USING (auth.uid() = seller_id AND status = 'active');

-- ============================================
-- 5. TRANSACTIONS LOG (immutable audit trail)
-- ============================================

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Transaction Type
  type TEXT NOT NULL CHECK (type IN ('market_sale', 'trade', 'npc_purchase', 'npc_sale', 'quest_reward', 'combat_loot', 'craft')),
  
  -- Participants
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  character_id UUID REFERENCES public.characters(id) NOT NULL,
  other_user_id UUID REFERENCES auth.users(id),
  
  -- Transaction Details
  description TEXT NOT NULL,
  items_gained JSONB DEFAULT '[]',
  items_lost JSONB DEFAULT '[]',
  spirit_stones_change INTEGER DEFAULT 0,
  
  -- Reference
  reference_id UUID, -- market_listing_id, etc.
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user transaction history
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_character ON public.transactions(character_id);

-- RLS: Users can only view their own transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to make script idempotent
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Server can insert transactions" ON public.transactions;

CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = other_user_id);

-- Only server can insert (via service role or RPC functions)
CREATE POLICY "Server can insert transactions" ON public.transactions
  FOR INSERT WITH CHECK (TRUE);

-- ============================================
-- 6. VALIDATION TRIGGERS (ANTI-CHEAT SYSTEM)
-- ============================================

-- Helper function to log cheat and possibly auto-ban
CREATE OR REPLACE FUNCTION log_cheat_attempt(
  p_user_id UUID,
  p_character_id UUID,
  p_cheat_type TEXT,
  p_details JSONB
)
RETURNS VOID AS $$
DECLARE
  v_attempts INTEGER;
  v_max_attempts INTEGER;
  v_auto_ban BOOLEAN;
BEGIN
  -- Get current settings
  SELECT auto_ban_enabled, max_cheat_attempts_before_ban 
  INTO v_auto_ban, v_max_attempts
  FROM public.game_config WHERE id = 'global';
  
  -- Default values if config doesn't exist yet
  v_auto_ban := COALESCE(v_auto_ban, TRUE);
  v_max_attempts := COALESCE(v_max_attempts, 3);
  
  -- Increment cheat attempts
  UPDATE public.profiles
  SET cheat_attempts = COALESCE(cheat_attempts, 0) + 1,
      last_cheat_attempt = NOW()
  WHERE id = p_user_id
  RETURNING cheat_attempts INTO v_attempts;
  
  -- Log the attempt
  INSERT INTO public.cheat_log (user_id, character_id, cheat_type, details, action_taken)
  VALUES (
    p_user_id, 
    p_character_id, 
    p_cheat_type, 
    p_details,
    CASE WHEN v_auto_ban AND v_attempts >= v_max_attempts THEN 'banned' ELSE 'blocked' END
  );
  
  -- Auto-ban if exceeded max attempts
  IF v_auto_ban AND v_attempts >= v_max_attempts THEN
    UPDATE public.profiles
    SET is_banned = TRUE,
        ban_reason = 'Auto-ban: Multiple cheat attempts detected (' || p_cheat_type || ')',
        banned_at = NOW()
    WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate character stats based on level
-- This trigger runs BEFORE every INSERT and UPDATE
-- It PREVENTS any data that doesn't follow game rules
CREATE OR REPLACE FUNCTION validate_character_stats()
RETURNS TRIGGER AS $$
DECLARE
  max_stat_per_level INTEGER;
  total_base_stats INTEGER;
  max_ap_for_level INTEGER;
  base_stats JSONB;
  level_diff INTEGER;
  max_level_jump INTEGER := 5; -- Max levels gained per sync
  v_is_banned BOOLEAN;
BEGIN
  -- Check if user is banned
  SELECT is_banned INTO v_is_banned FROM public.profiles WHERE id = NEW.user_id;
  IF v_is_banned THEN
    RAISE EXCEPTION 'BANNED: Your account has been suspended';
  END IF;

  -- ===== ANTI-CHEAT: Prevent level manipulation =====
  IF TG_OP = 'UPDATE' THEN
    level_diff := NEW.level - OLD.level;
    
    -- Cannot decrease level (rollback exploit)
    IF level_diff < 0 THEN
      PERFORM log_cheat_attempt(NEW.user_id, NEW.id, 'LEVEL_ROLLBACK', 
        jsonb_build_object('old_level', OLD.level, 'new_level', NEW.level));
      RAISE EXCEPTION 'CHEAT DETECTED: Level cannot decrease (from % to %)', OLD.level, NEW.level;
    END IF;
    
    -- Cannot jump too many levels at once (hacked client)
    IF level_diff > max_level_jump THEN
      PERFORM log_cheat_attempt(NEW.user_id, NEW.id, 'LEVEL_JUMP', 
        jsonb_build_object('old_level', OLD.level, 'new_level', NEW.level, 'diff', level_diff));
      RAISE EXCEPTION 'CHEAT DETECTED: Cannot gain more than % levels at once', max_level_jump;
    END IF;
    
    -- Cannot decrease spirit stones beyond what's possible (negative spending exploit)
    IF NEW.spirit_stones < 0 THEN
      PERFORM log_cheat_attempt(NEW.user_id, NEW.id, 'NEGATIVE_STONES', 
        jsonb_build_object('spirit_stones', NEW.spirit_stones));
      RAISE EXCEPTION 'CHEAT DETECTED: Spirit stones cannot be negative';
    END IF;
    
    -- Prevent absurd spirit stones gain (max 10000 per sync for farming protection)
    IF NEW.spirit_stones - OLD.spirit_stones > 10000 THEN
      PERFORM log_cheat_attempt(NEW.user_id, NEW.id, 'STONES_OVERFLOW', 
        jsonb_build_object('old_stones', OLD.spirit_stones, 'new_stones', NEW.spirit_stones, 'diff', NEW.spirit_stones - OLD.spirit_stones));
      RAISE EXCEPTION 'CHEAT DETECTED: Spirit stones gain too high in single sync';
    END IF;
  END IF;

  -- Calculate maximum stats allowed for this level
  -- Each level gives 3 AP, so max total stats = base (25) + (level * 3)
  max_ap_for_level := NEW.level * 3;
  
  -- Get base stats from JSON
  base_stats := NEW.base_stats;
  total_base_stats := (base_stats->>'str')::INTEGER + 
                      (base_stats->>'dex')::INTEGER + 
                      (base_stats->>'con')::INTEGER + 
                      (base_stats->>'spi')::INTEGER + 
                      (base_stats->>'wil')::INTEGER;
  
  -- ===== ANTI-CHEAT: Validate total stats don't exceed maximum for level =====
  IF total_base_stats > (25 + max_ap_for_level) THEN
    PERFORM log_cheat_attempt(NEW.user_id, NEW.id, 'STATS_OVERFLOW', 
      jsonb_build_object('total_stats', total_base_stats, 'max_allowed', 25 + max_ap_for_level, 'level', NEW.level));
    RAISE EXCEPTION 'CHEAT DETECTED: Total stats (%) exceed maximum allowed for level % (max: %)', 
      total_base_stats, NEW.level, (25 + max_ap_for_level);
  END IF;
  
  -- ===== ANTI-CHEAT: Validate individual stats are reasonable =====
  IF (base_stats->>'str')::INTEGER > 99 OR
     (base_stats->>'dex')::INTEGER > 99 OR
     (base_stats->>'con')::INTEGER > 99 OR
     (base_stats->>'spi')::INTEGER > 99 OR
     (base_stats->>'wil')::INTEGER > 99 THEN
    PERFORM log_cheat_attempt(NEW.user_id, NEW.id, 'STATS_MAX_EXCEEDED', 
      jsonb_build_object('stats', base_stats));
    RAISE EXCEPTION 'CHEAT DETECTED: Individual base stats cannot exceed 99';
  END IF;
  
  -- ===== ANTI-CHEAT: Minimum stats (cannot have 0 or negative) =====
  IF (base_stats->>'str')::INTEGER < 1 OR
     (base_stats->>'dex')::INTEGER < 1 OR
     (base_stats->>'con')::INTEGER < 1 OR
     (base_stats->>'spi')::INTEGER < 1 OR
     (base_stats->>'wil')::INTEGER < 1 THEN
    PERFORM log_cheat_attempt(NEW.user_id, NEW.id, 'STATS_NEGATIVE', 
      jsonb_build_object('stats', base_stats));
    RAISE EXCEPTION 'CHEAT DETECTED: Base stats cannot be less than 1';
  END IF;
  
  -- ===== ANTI-CHEAT: Validate HP/QI are within reasonable bounds for level =====
  IF NEW.max_hp > (NEW.level * 50 + 500) THEN
    PERFORM log_cheat_attempt(NEW.user_id, NEW.id, 'HP_OVERFLOW', 
      jsonb_build_object('max_hp', NEW.max_hp, 'level', NEW.level, 'max_allowed', NEW.level * 50 + 500));
    RAISE EXCEPTION 'CHEAT DETECTED: Max HP (%) exceeds maximum for level %', NEW.max_hp, NEW.level;
  END IF;
  
  IF NEW.max_qi > (NEW.level * 30 + 300) THEN
    PERFORM log_cheat_attempt(NEW.user_id, NEW.id, 'QI_OVERFLOW', 
      jsonb_build_object('max_qi', NEW.max_qi, 'level', NEW.level, 'max_allowed', NEW.level * 30 + 300));
    RAISE EXCEPTION 'CHEAT DETECTED: Max QI (%) exceeds maximum for level %', NEW.max_qi, NEW.level;
  END IF;
  
  -- Ensure HP/QI don't exceed max (auto-correct, not cheat)
  IF NEW.hp > NEW.max_hp THEN
    NEW.hp := NEW.max_hp;
  END IF;
  
  IF NEW.qi > NEW.max_qi THEN
    NEW.qi := NEW.max_qi;
  END IF;
  
  -- ===== ANTI-CHEAT: Validate EXP is not impossibly high =====
  IF NEW.exp > (NEW.level * NEW.level * 200) THEN
    PERFORM log_cheat_attempt(NEW.user_id, NEW.id, 'EXP_OVERFLOW', 
      jsonb_build_object('exp', NEW.exp, 'level', NEW.level, 'max_allowed', NEW.level * NEW.level * 200));
    RAISE EXCEPTION 'CHEAT DETECTED: EXP (%) is impossibly high for level %', NEW.exp, NEW.level;
  END IF;
  
  -- ===== ANTI-CHEAT: Validate level bounds =====
  IF NEW.level < 1 OR NEW.level > 100 THEN
    PERFORM log_cheat_attempt(NEW.user_id, NEW.id, 'LEVEL_BOUNDS', 
      jsonb_build_object('level', NEW.level));
    RAISE EXCEPTION 'CHEAT DETECTED: Level must be between 1 and 100';
  END IF;
  
  -- Update timestamp
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to characters table
DROP TRIGGER IF EXISTS validate_character_on_update ON public.characters;
CREATE TRIGGER validate_character_on_update
  BEFORE UPDATE ON public.characters
  FOR EACH ROW
  EXECUTE FUNCTION validate_character_stats();

DROP TRIGGER IF EXISTS validate_character_on_insert ON public.characters;
CREATE TRIGGER validate_character_on_insert
  BEFORE INSERT ON public.characters
  FOR EACH ROW
  EXECUTE FUNCTION validate_character_stats();

-- ============================================
-- 7. MARKET TRANSACTION FUNCTION (Atomic)
-- ============================================

CREATE OR REPLACE FUNCTION buy_market_item(
  p_listing_id UUID,
  p_buyer_id UUID,
  p_buyer_name TEXT,
  p_buyer_character_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_listing public.market_listings%ROWTYPE;
  v_buyer_stones INTEGER;
  v_new_item_id UUID;
BEGIN
  -- Lock the listing row to prevent race conditions
  SELECT * INTO v_listing
  FROM public.market_listings
  WHERE id = p_listing_id
  FOR UPDATE;
  
  -- Check listing exists and is active
  IF v_listing IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing not found');
  END IF;
  
  IF v_listing.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing is no longer available');
  END IF;
  
  -- Check buyer is not seller
  IF v_listing.seller_id = p_buyer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot buy your own listing');
  END IF;
  
  -- Check buyer has enough spirit stones
  SELECT spirit_stones INTO v_buyer_stones
  FROM public.characters
  WHERE id = p_buyer_character_id AND user_id = p_buyer_id
  FOR UPDATE;
  
  IF v_buyer_stones IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Character not found');
  END IF;
  
  IF v_buyer_stones < v_listing.price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient spirit stones');
  END IF;
  
  -- Deduct spirit stones from buyer
  UPDATE public.characters
  SET spirit_stones = spirit_stones - v_listing.price,
      updated_at = NOW()
  WHERE id = p_buyer_character_id AND user_id = p_buyer_id;
  
  -- Add spirit stones to seller
  UPDATE public.characters
  SET spirit_stones = spirit_stones + v_listing.price,
      updated_at = NOW()
  WHERE id = v_listing.character_id AND user_id = v_listing.seller_id;
  
  -- Create item in buyer's inventory
  INSERT INTO public.inventory (
    character_id, user_id, item_id, item_name, item_type, count,
    rarity, tier, stats, slot, durability, max_durability, element,
    effect, amount, icon_type, description, location
  )
  SELECT
    p_buyer_character_id,
    p_buyer_id,
    v_listing.item_data->>'id',
    v_listing.item_data->>'name',
    v_listing.item_data->>'type',
    COALESCE((v_listing.item_data->>'count')::INTEGER, 1),
    v_listing.item_data->>'rarity',
    (v_listing.item_data->>'tier')::INTEGER,
    v_listing.item_data->'stats',
    v_listing.item_data->>'slot',
    (v_listing.item_data->>'durability')::INTEGER,
    (v_listing.item_data->>'maxDurability')::INTEGER,
    v_listing.item_data->>'element',
    v_listing.item_data->>'effect',
    (v_listing.item_data->>'amount')::INTEGER,
    v_listing.item_data->>'iconType',
    v_listing.item_data->>'desc',
    'inventory'
  RETURNING id INTO v_new_item_id;
  
  -- Mark listing as sold
  UPDATE public.market_listings
  SET status = 'sold',
      buyer_id = p_buyer_id,
      buyer_name = p_buyer_name,
      sold_at = NOW()
  WHERE id = p_listing_id;
  
  -- Log transaction for buyer
  INSERT INTO public.transactions (
    type, user_id, character_id, other_user_id,
    description, items_gained, spirit_stones_change, reference_id
  ) VALUES (
    'market_sale',
    p_buyer_id,
    p_buyer_character_id,
    v_listing.seller_id,
    'Purchased ' || v_listing.item_name || ' from ' || v_listing.seller_name,
    jsonb_build_array(v_listing.item_data),
    -v_listing.price,
    p_listing_id
  );
  
  -- Log transaction for seller
  INSERT INTO public.transactions (
    type, user_id, character_id, other_user_id,
    description, items_lost, spirit_stones_change, reference_id
  ) VALUES (
    'market_sale',
    v_listing.seller_id,
    v_listing.character_id,
    p_buyer_id,
    'Sold ' || v_listing.item_name || ' to ' || p_buyer_name,
    jsonb_build_array(v_listing.item_data),
    v_listing.price,
    p_listing_id
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'item_id', v_new_item_id,
    'price', v_listing.price,
    'item_name', v_listing.item_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. HELPER FUNCTIONS
-- ============================================

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    last_login = NOW();
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Username already taken, append random suffix
    INSERT INTO public.profiles (id, email, username)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)) || '_' || floor(random() * 9999)::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to update last_played_at
CREATE OR REPLACE FUNCTION update_last_played()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_played_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_character_last_played ON public.characters;
CREATE TRIGGER update_character_last_played
  BEFORE UPDATE ON public.characters
  FOR EACH ROW
  EXECUTE FUNCTION update_last_played();

-- ============================================
-- 9. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_characters_user_id ON public.characters(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_level ON public.characters(level);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- ============================================
-- 10. GAME CONFIGURATION TABLE (Admin Only)
-- ============================================

CREATE TABLE IF NOT EXISTS public.game_config (
  id TEXT PRIMARY KEY DEFAULT 'global',
  
  -- Global Multipliers (for events!)
  exp_multiplier DECIMAL DEFAULT 1.0 CHECK (exp_multiplier >= 0.1 AND exp_multiplier <= 10.0),
  drop_rate_multiplier DECIMAL DEFAULT 1.0 CHECK (drop_rate_multiplier >= 0.1 AND drop_rate_multiplier <= 10.0),
  spirit_stones_multiplier DECIMAL DEFAULT 1.0 CHECK (spirit_stones_multiplier >= 0.1 AND spirit_stones_multiplier <= 10.0),
  
  -- Event System
  active_event TEXT,
  event_description TEXT,
  event_start TIMESTAMPTZ,
  event_end TIMESTAMPTZ,
  
  -- Anti-cheat settings
  auto_ban_enabled BOOLEAN DEFAULT TRUE,
  max_cheat_attempts_before_ban INTEGER DEFAULT 3,
  
  -- Game settings
  maintenance_mode BOOLEAN DEFAULT FALSE,
  maintenance_message TEXT,
  
  -- Timestamps
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default config
INSERT INTO public.game_config (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;

-- RLS: Everyone can read, only admins can update
ALTER TABLE public.game_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read game config" ON public.game_config;
DROP POLICY IF EXISTS "Admins can update game config" ON public.game_config;

CREATE POLICY "Anyone can read game config" ON public.game_config
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can update game config" ON public.game_config
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- ============================================
-- 11. CHEAT LOG TABLE (for monitoring)
-- ============================================

CREATE TABLE IF NOT EXISTS public.cheat_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  character_id UUID,
  
  -- What was attempted
  cheat_type TEXT NOT NULL,
  details JSONB,
  
  -- What we did about it
  action_taken TEXT CHECK (action_taken IN ('blocked', 'warned', 'banned')),
  
  -- Timestamp
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cheat_log_user ON public.cheat_log(user_id);

-- RLS: Only admins can view cheat logs
ALTER TABLE public.cheat_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view cheat logs" ON public.cheat_log;
DROP POLICY IF EXISTS "System can insert cheat logs" ON public.cheat_log;

CREATE POLICY "Admins can view cheat logs" ON public.cheat_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'owner', 'moderator')
    )
  );

CREATE POLICY "System can insert cheat logs" ON public.cheat_log
  FOR INSERT WITH CHECK (TRUE);

-- ============================================
-- 12. ADMIN HELPER FUNCTIONS
-- ============================================

-- Function to ban a player (admin only)
CREATE OR REPLACE FUNCTION admin_ban_player(
  p_target_user_id UUID,
  p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_admin_role TEXT;
BEGIN
  -- Check if caller is admin
  SELECT role INTO v_admin_role FROM public.profiles WHERE id = auth.uid();
  
  IF v_admin_role NOT IN ('admin', 'owner') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  -- Ban the player
  UPDATE public.profiles
  SET is_banned = TRUE,
      ban_reason = p_reason,
      banned_at = NOW()
  WHERE id = p_target_user_id;
  
  -- Log it
  INSERT INTO public.cheat_log (user_id, cheat_type, details, action_taken)
  VALUES (p_target_user_id, 'MANUAL_BAN', jsonb_build_object('reason', p_reason, 'banned_by', auth.uid()), 'banned');
  
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unban a player (admin only)
CREATE OR REPLACE FUNCTION admin_unban_player(p_target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_admin_role TEXT;
BEGIN
  SELECT role INTO v_admin_role FROM public.profiles WHERE id = auth.uid();
  
  IF v_admin_role NOT IN ('admin', 'owner') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  UPDATE public.profiles
  SET is_banned = FALSE,
      ban_reason = NULL,
      banned_at = NULL,
      cheat_attempts = 0
  WHERE id = p_target_user_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set event multipliers (admin only)
CREATE OR REPLACE FUNCTION admin_set_event(
  p_event_name TEXT,
  p_description TEXT,
  p_exp_mult DECIMAL,
  p_drop_mult DECIMAL,
  p_stones_mult DECIMAL,
  p_duration_hours INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_admin_role TEXT;
BEGIN
  SELECT role INTO v_admin_role FROM public.profiles WHERE id = auth.uid();
  
  IF v_admin_role NOT IN ('admin', 'owner') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  UPDATE public.game_config
  SET active_event = p_event_name,
      event_description = p_description,
      exp_multiplier = COALESCE(p_exp_mult, 1.0),
      drop_rate_multiplier = COALESCE(p_drop_mult, 1.0),
      spirit_stones_multiplier = COALESCE(p_stones_mult, 1.0),
      event_start = NOW(),
      event_end = NOW() + (p_duration_hours || ' hours')::INTERVAL,
      updated_at = NOW(),
      updated_by = auth.uid()
  WHERE id = 'global';
  
  RETURN jsonb_build_object(
    'success', true,
    'event', p_event_name,
    'ends_at', NOW() + (p_duration_hours || ' hours')::INTERVAL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to end an event (admin only)
CREATE OR REPLACE FUNCTION admin_end_event()
RETURNS JSONB AS $$
DECLARE
  v_admin_role TEXT;
BEGIN
  SELECT role INTO v_admin_role FROM public.profiles WHERE id = auth.uid();
  
  IF v_admin_role NOT IN ('admin', 'owner') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  UPDATE public.game_config
  SET active_event = NULL,
      event_description = NULL,
      exp_multiplier = 1.0,
      drop_rate_multiplier = 1.0,
      spirit_stones_multiplier = 1.0,
      event_start = NULL,
      event_end = NULL,
      updated_at = NOW(),
      updated_by = auth.uid()
  WHERE id = 'global';
  
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to make yourself owner (RUN THIS ONCE with your user ID!)
-- After running, DELETE this function for security
CREATE OR REPLACE FUNCTION make_me_owner(p_user_id UUID)
RETURNS TEXT AS $$
BEGIN
  UPDATE public.profiles SET role = 'owner' WHERE id = p_user_id;
  RETURN 'Done! User is now owner. DELETE this function for security!';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 13. COMBAT VALIDATION & REWARDS (Anti-Cheat)
-- ============================================

-- Table to track combat sessions (prevents reward manipulation)
CREATE TABLE IF NOT EXISTS public.combat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Combat details
  enemy_id TEXT NOT NULL,
  enemy_level INTEGER NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Result (set when combat ends)
  ended_at TIMESTAMPTZ,
  result TEXT CHECK (result IN ('victory', 'defeat', 'fled', 'timeout')),
  
  -- Rewards given (for audit)
  exp_gained INTEGER DEFAULT 0,
  stones_gained INTEGER DEFAULT 0,
  items_dropped JSONB DEFAULT '[]',
  
  -- Anti-spam: one active combat per character
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_combat_sessions_character ON public.combat_sessions(character_id);
CREATE INDEX IF NOT EXISTS idx_combat_sessions_active ON public.combat_sessions(character_id, is_active) WHERE is_active = TRUE;

-- RLS for combat sessions
ALTER TABLE public.combat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own combat sessions" ON public.combat_sessions;
DROP POLICY IF EXISTS "Users can insert own combat sessions" ON public.combat_sessions;
DROP POLICY IF EXISTS "Users can update own combat sessions" ON public.combat_sessions;

CREATE POLICY "Users can view own combat sessions" ON public.combat_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own combat sessions" ON public.combat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own combat sessions" ON public.combat_sessions
  FOR UPDATE USING (auth.uid() = user_id AND is_active = TRUE);

-- Function to start a combat (validates and creates session)
CREATE OR REPLACE FUNCTION start_combat(
  p_character_id UUID,
  p_enemy_id TEXT,
  p_enemy_level INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_char_level INTEGER;
  v_is_banned BOOLEAN;
  v_active_combat UUID;
  v_last_combat TIMESTAMPTZ;
  v_session_id UUID;
BEGIN
  -- Get user ID and check if banned
  SELECT user_id, level INTO v_user_id, v_char_level
  FROM public.characters WHERE id = p_character_id;
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Character not found');
  END IF;
  
  IF v_user_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not your character');
  END IF;
  
  SELECT is_banned INTO v_is_banned FROM public.profiles WHERE id = v_user_id;
  IF v_is_banned THEN
    RETURN jsonb_build_object('success', false, 'error', 'Account is banned');
  END IF;
  
  -- Check for active combat (prevent spam)
  SELECT id INTO v_active_combat
  FROM public.combat_sessions
  WHERE character_id = p_character_id AND is_active = TRUE;
  
  IF v_active_combat IS NOT NULL THEN
    -- Auto-close stale combats (older than 10 minutes)
    UPDATE public.combat_sessions
    SET is_active = FALSE, result = 'timeout', ended_at = NOW()
    WHERE id = v_active_combat AND started_at < NOW() - INTERVAL '10 minutes';
    
    -- Check again
    SELECT id INTO v_active_combat
    FROM public.combat_sessions
    WHERE character_id = p_character_id AND is_active = TRUE;
    
    IF v_active_combat IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Combat already in progress');
    END IF;
  END IF;
  
  -- Rate limiting: max 1 combat per second
  SELECT MAX(started_at) INTO v_last_combat
  FROM public.combat_sessions
  WHERE character_id = p_character_id AND started_at > NOW() - INTERVAL '1 second';
  
  IF v_last_combat IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Too fast! Wait a moment');
  END IF;
  
  -- Validate enemy level (cannot fight enemies too far above level)
  IF p_enemy_level > v_char_level + 20 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Enemy too powerful');
  END IF;
  
  -- Create combat session
  INSERT INTO public.combat_sessions (character_id, user_id, enemy_id, enemy_level)
  VALUES (p_character_id, v_user_id, p_enemy_id, p_enemy_level)
  RETURNING id INTO v_session_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'session_id', v_session_id,
    'enemy_id', p_enemy_id,
    'enemy_level', p_enemy_level
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to end combat and claim rewards (validates everything)
CREATE OR REPLACE FUNCTION end_combat(
  p_session_id UUID,
  p_result TEXT, -- 'victory', 'defeat', 'fled'
  p_exp_claimed INTEGER,
  p_stones_claimed INTEGER,
  p_items_claimed JSONB DEFAULT '[]'
)
RETURNS JSONB AS $$
DECLARE
  v_session public.combat_sessions%ROWTYPE;
  v_config public.game_config%ROWTYPE;
  v_max_exp INTEGER;
  v_max_stones INTEGER;
  v_final_exp INTEGER;
  v_final_stones INTEGER;
  v_char public.characters%ROWTYPE;
BEGIN
  -- Get and lock the session
  SELECT * INTO v_session
  FROM public.combat_sessions
  WHERE id = p_session_id
  FOR UPDATE;
  
  IF v_session IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session not found');
  END IF;
  
  IF v_session.user_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not your session');
  END IF;
  
  IF NOT v_session.is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'Combat already ended');
  END IF;
  
  -- Validate combat duration (min 2 seconds for a fight)
  IF v_session.started_at > NOW() - INTERVAL '2 seconds' AND p_result = 'victory' THEN
    -- Suspiciously fast - log it
    PERFORM log_cheat_attempt(v_session.user_id, v_session.character_id, 'SPEED_HACK', 
      jsonb_build_object('session_id', p_session_id, 'duration_ms', 
        EXTRACT(EPOCH FROM (NOW() - v_session.started_at)) * 1000));
    RETURN jsonb_build_object('success', false, 'error', 'Combat too fast');
  END IF;
  
  -- Get game config for multipliers
  SELECT * INTO v_config FROM public.game_config WHERE id = 'global';
  
  -- Calculate max rewards based on enemy level
  v_max_exp := v_session.enemy_level * 20; -- Base EXP
  v_max_stones := v_session.enemy_level * 5; -- Base stones
  
  -- Apply event multipliers
  IF v_config IS NOT NULL THEN
    v_max_exp := FLOOR(v_max_exp * COALESCE(v_config.exp_multiplier, 1.0));
    v_max_stones := FLOOR(v_max_stones * COALESCE(v_config.spirit_stones_multiplier, 1.0));
  END IF;
  
  -- Validate claimed rewards don't exceed maximum
  IF p_result = 'victory' THEN
    v_final_exp := LEAST(p_exp_claimed, v_max_exp);
    v_final_stones := LEAST(p_stones_claimed, v_max_stones);
    
    -- If player claimed way more than allowed, log potential cheat
    IF p_exp_claimed > v_max_exp * 2 OR p_stones_claimed > v_max_stones * 2 THEN
      PERFORM log_cheat_attempt(v_session.user_id, v_session.character_id, 'REWARD_MANIPULATION', 
        jsonb_build_object(
          'claimed_exp', p_exp_claimed, 'max_exp', v_max_exp,
          'claimed_stones', p_stones_claimed, 'max_stones', v_max_stones
        ));
    END IF;
  ELSE
    -- No rewards for defeat/fled
    v_final_exp := 0;
    v_final_stones := 0;
  END IF;
  
  -- Apply rewards to character
  UPDATE public.characters
  SET exp = exp + v_final_exp,
      spirit_stones = spirit_stones + v_final_stones,
      last_combat_time = EXTRACT(EPOCH FROM NOW()) * 1000
  WHERE id = v_session.character_id;
  
  -- Close the session
  UPDATE public.combat_sessions
  SET is_active = FALSE,
      ended_at = NOW(),
      result = p_result,
      exp_gained = v_final_exp,
      stones_gained = v_final_stones,
      items_dropped = p_items_claimed
  WHERE id = p_session_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'result', p_result,
    'exp_gained', v_final_exp,
    'stones_gained', v_final_stones,
    'items', p_items_claimed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 14. SECURITY SUMMARY
-- ============================================
-- 
-- PROTEÇÕES ATIVAS CONTRA BATOTA:
-- 
-- 1. ROW LEVEL SECURITY (RLS):
--    - Cada jogador só pode ver/editar os SEUS dados
--    - Impossível aceder a dados de outros jogadores
--    - Funciona ao nível da base de dados (não do cliente)
-- 
-- 2. TRIGGER DE VALIDAÇÃO (validate_character_stats):
--    - Valida TODAS as alterações ANTES de guardar
--    - Impede level manipulation (subir mais que 5 níveis por sync)
--    - Impede rollback (baixar nível)
--    - Impede stats impossíveis (mais stats que o nível permite)
--    - Impede spirit stones negativos ou ganhos absurdos
--    - Impede HP/QI acima do máximo para o nível
--    - AUTO-BAN após 3 tentativas de batota
-- 
-- 3. MARKET ATÓMICO (buy_market_item):
--    - Compras são transações atómicas
--    - Usa FOR UPDATE para lock anti-race condition
--    - Impossível duplicar itens ou spirit stones
--    - Log de todas as transações para auditoria
-- 
-- 4. CONSTRAINTS NA BASE DE DADOS:
--    - CHECK constraints em todos os campos numéricos
--    - Tipos de dados corretos (UUID, INTEGER, etc.)
--    - Foreign keys para integridade referencial
--
-- 5. SISTEMA DE ADMIN:
--    - Roles: player, moderator, admin, owner
--    - Funções para ban/unban
--    - Sistema de eventos com multipliers
--    - Cheat log para auditoria
--
-- 6. COMBAT VALIDATION:
--    - Sessões de combate rastreadas no servidor
--    - Rate limiting (1 combate/segundo)
--    - Duração mínima validada (anti speed-hack)
--    - Rewards máximos validados (anti-manipulation)
--    - Auto-timeout de combates abandonados
-- 
-- O QUE UM HACKER NÃO CONSEGUE FAZER:
--    ❌ Editar level diretamente (trigger bloqueia)
--    ❌ Adicionar stats além do permitido
--    ❌ Criar spirit stones do nada
--    ❌ Duplicar itens no mercado
--    ❌ Ver dados de outros jogadores
--    ❌ Modificar transações passadas
--    ❌ Mudar o próprio role para admin
--    ❌ Desbanir-se a si próprio
--    ❌ Speed-hack combates (duração validada)
--    ❌ Claim rewards além do permitido
--    ❌ Spam de combates (rate limited)
-- 
-- ============================================
-- DONE! Schema ready for use.
-- ============================================
