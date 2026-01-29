// ============================================
// MARKET SERVICE - Secure Trading System
// Atomic transactions via Supabase RPC
// ============================================

import { supabase } from './supabase';
import type { InventoryItem } from '../types/game';

// ============================================
// TYPES
// ============================================

export interface MarketListing {
  id: string;
  seller_id: string;
  seller_name: string;
  item_data: InventoryItem;
  item_name: string;
  item_type: string;
  item_rarity: string | null;
  item_tier: number | null;
  price: number;
  status: 'active' | 'sold' | 'cancelled' | 'expired';
  listed_at: string;
  expires_at: string;
}

export interface MarketSearchParams {
  search?: string;
  itemType?: string;
  rarity?: string;
  minPrice?: number;
  maxPrice?: number;
  minTier?: number;
  maxTier?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc';
  page?: number;
  limit?: number;
}

export interface MarketResult {
  success: boolean;
  error?: string;
  data?: any;
}

// ============================================
// BROWSE MARKET
// ============================================

/**
 * Get active market listings with optional filters
 */
export async function getMarketListings(
  params: MarketSearchParams = {}
): Promise<{ listings: MarketListing[]; total: number }> {
  const {
    search,
    itemType,
    rarity,
    minPrice,
    maxPrice,
    minTier,
    maxTier,
    sortBy = 'date_desc',
    page = 1,
    limit = 20,
  } = params;

  let query = supabase
    .from('market_listings')
    .select('*', { count: 'exact' })
    .eq('status', 'active');

  // Apply filters
  if (search) {
    query = query.ilike('search_text', `%${search.toLowerCase()}%`);
  }

  if (itemType) {
    query = query.eq('item_type', itemType);
  }

  if (rarity) {
    query = query.eq('item_rarity', rarity);
  }

  if (minPrice !== undefined) {
    query = query.gte('price', minPrice);
  }

  if (maxPrice !== undefined) {
    query = query.lte('price', maxPrice);
  }

  if (minTier !== undefined) {
    query = query.gte('item_tier', minTier);
  }

  if (maxTier !== undefined) {
    query = query.lte('item_tier', maxTier);
  }

  // Apply sorting
  switch (sortBy) {
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'date_asc':
      query = query.order('listed_at', { ascending: true });
      break;
    case 'date_desc':
    default:
      query = query.order('listed_at', { ascending: false });
      break;
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching market listings:', error);
    return { listings: [], total: 0 };
  }

  return {
    listings: data || [],
    total: count || 0,
  };
}

/**
 * Get listings by current user
 */
export async function getMyListings(): Promise<MarketListing[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('market_listings')
    .select('*')
    .eq('seller_id', user.id)
    .in('status', ['active', 'sold'])
    .order('listed_at', { ascending: false });

  if (error) {
    console.error('Error fetching my listings:', error);
    return [];
  }

  return data || [];
}

// ============================================
// CREATE LISTING
// ============================================

/**
 * List an item for sale
 */
export async function createListing(
  characterId: string,
  item: InventoryItem,
  price: number,
  sellerName: string
): Promise<MarketResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Validate price
  if (price <= 0 || !Number.isInteger(price)) {
    return { success: false, error: 'Price must be a positive integer' };
  }

  if (price > 999999999) {
    return { success: false, error: 'Price is too high' };
  }

  try {
    // First, verify the item exists in the user's inventory
    const { data: inventoryItem, error: checkError } = await supabase
      .from('inventory')
      .select('*')
      .eq('character_id', characterId)
      .eq('item_id', item.id)
      .eq('user_id', user.id)
      .eq('location', 'inventory')
      .single();

    if (checkError || !inventoryItem) {
      return { success: false, error: 'Item not found in inventory' };
    }

    // Remove item from inventory
    const { error: deleteError } = await supabase
      .from('inventory')
      .delete()
      .eq('id', inventoryItem.id);

    if (deleteError) {
      return { success: false, error: 'Failed to remove item from inventory' };
    }

    // Create listing
    const { data: listing, error: listError } = await supabase
      .from('market_listings')
      .insert({
        seller_id: user.id,
        seller_name: sellerName,
        character_id: characterId,
        item_data: item,
        item_name: item.name,
        item_type: item.type,
        item_rarity: item.rarity || null,
        item_tier: item.tier || null,
        price: price,
        status: 'active',
      })
      .select()
      .single();

    if (listError) {
      // Try to restore the item if listing failed
      await supabase.from('inventory').insert(inventoryItem);
      return { success: false, error: 'Failed to create listing' };
    }

    return { success: true, data: listing };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// BUY ITEM (Atomic Transaction)
// ============================================

/**
 * Buy an item from the market
 * Uses the secure database function for atomicity
 */
export async function buyItem(
  listingId: string,
  buyerCharacterId: string,
  buyerName: string
): Promise<MarketResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    // Call the atomic database function
    const { data, error } = await supabase.rpc('buy_market_item', {
      p_listing_id: listingId,
      p_buyer_id: user.id,
      p_buyer_name: buyerName,
      p_buyer_character_id: buyerCharacterId,
    });

    if (error) {
      console.error('Error buying item:', error);
      return { success: false, error: error.message };
    }

    // The function returns a JSONB object
    if (data && data.success) {
      return { success: true, data: data };
    } else {
      return { success: false, error: data?.error || 'Purchase failed' };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// CANCEL LISTING
// ============================================

/**
 * Cancel a listing and return the item to inventory
 */
export async function cancelListing(
  listingId: string,
  characterId: string
): Promise<MarketResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    // Get the listing
    const { data: listing, error: fetchError } = await supabase
      .from('market_listings')
      .select('*')
      .eq('id', listingId)
      .eq('seller_id', user.id)
      .eq('status', 'active')
      .single();

    if (fetchError || !listing) {
      return { success: false, error: 'Listing not found or already sold' };
    }

    // Return item to inventory
    const itemData = listing.item_data as InventoryItem;
    const { error: insertError } = await supabase
      .from('inventory')
      .insert({
        character_id: characterId,
        user_id: user.id,
        item_id: itemData.id,
        item_name: itemData.name,
        item_type: itemData.type,
        count: itemData.count || 1,
        rarity: itemData.rarity,
        tier: itemData.tier,
        stats: itemData.stats,
        slot: itemData.slot,
        effect: itemData.effect,
        amount: itemData.amount,
        icon_type: itemData.iconType,
        description: itemData.desc,
        location: 'inventory',
      });

    if (insertError) {
      return { success: false, error: 'Failed to return item to inventory' };
    }

    // Update listing status
    const { error: updateError } = await supabase
      .from('market_listings')
      .update({ status: 'cancelled' })
      .eq('id', listingId);

    if (updateError) {
      return { success: false, error: 'Failed to cancel listing' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// MARKET STATS
// ============================================

/**
 * Get market statistics
 */
export async function getMarketStats(): Promise<{
  totalListings: number;
  totalVolume: number;
  averagePrice: number;
}> {
  const { count } = await supabase
    .from('market_listings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { data: soldStats } = await supabase
    .from('market_listings')
    .select('price')
    .eq('status', 'sold');

  const totalVolume = soldStats?.reduce((sum, l) => sum + l.price, 0) || 0;
  const averagePrice = soldStats?.length ? Math.floor(totalVolume / soldStats.length) : 0;

  return {
    totalListings: count || 0,
    totalVolume,
    averagePrice,
  };
}

// ============================================
// PRICE HISTORY
// ============================================

/**
 * Get price history for an item type
 */
export async function getPriceHistory(
  itemName: string,
  days: number = 7
): Promise<{ date: string; avgPrice: number; count: number }[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('market_listings')
    .select('price, sold_at')
    .eq('item_name', itemName)
    .eq('status', 'sold')
    .gte('sold_at', startDate.toISOString())
    .order('sold_at', { ascending: true });

  if (error || !data) return [];

  // Group by date
  const grouped: Record<string, { total: number; count: number }> = {};

  data.forEach(sale => {
    const date = new Date(sale.sold_at).toISOString().split('T')[0];
    if (!grouped[date]) {
      grouped[date] = { total: 0, count: 0 };
    }
    grouped[date].total += sale.price;
    grouped[date].count += 1;
  });

  return Object.entries(grouped).map(([date, stats]) => ({
    date,
    avgPrice: Math.floor(stats.total / stats.count),
    count: stats.count,
  }));
}
