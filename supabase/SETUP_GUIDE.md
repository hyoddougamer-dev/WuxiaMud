# 🛡️ Supabase Security Setup Guide

## Overview

This guide explains how to set up the secure server-side architecture for Língyún Dào.

## 📋 Step 1: Run the Database Schema

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project `lingyundao`
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the entire contents of `supabase/schema.sql`
6. Paste into the SQL editor
7. Click **Run**

You should see "Success. No rows returned" - this means all tables and policies were created.

## ✅ Verify the Setup

After running the schema, verify:

### Tables Created:
- `profiles` - User profiles
- `characters` - Character saves
- `inventory` - Player inventory items
- `market_listings` - Market listings
- `transactions` - Transaction log (audit trail)

### Check in Supabase:
1. Go to **Table Editor**
2. You should see all 5 tables listed
3. Each table should have a lock icon (🔒) indicating RLS is enabled

## 🔐 What's Protected

### Row Level Security (RLS)
- ✅ Users can only access their OWN characters
- ✅ Users can only modify their OWN inventory
- ✅ Market listings are visible to everyone, but only owner can modify
- ✅ Transactions are read-only (audit trail)

### Database Triggers
- ✅ Stats are validated against level (no impossible values)
- ✅ HP/QI cannot exceed maximum
- ✅ Spirit stones cannot be negative
- ✅ Timestamps auto-update

### Atomic Market Transactions
- ✅ `buy_market_item()` function handles purchases atomically
- ✅ Race conditions prevented with row locking
- ✅ Either everything succeeds, or nothing changes

## 🎮 How It Works

### Saving Character
```
Client                    Supabase
  |                          |
  |-- Save character ------->|
  |                          |-- Validate with trigger
  |                          |-- Check RLS policy
  |                          |-- Save to database
  |<---- Success/Error ------|
```

### Buying from Market
```
Client                    Supabase (Atomic)
  |                          |
  |-- Buy item ------------->|
  |                          |-- Lock listing row
  |                          |-- Verify buyer has gold
  |                          |-- Deduct gold from buyer
  |                          |-- Add gold to seller
  |                          |-- Transfer item
  |                          |-- Log transaction
  |<---- Success/Error ------|
```

## ⚠️ Security Notes

### What's Protected:
- Character data (stats, level, items)
- Spirit stones balance
- Market transactions
- Inventory

### What's NOT Protected Yet:
- Combat calculations (client-side for responsiveness)
- Crafting results (client-side)

### For Full Protection (Future):
Implement Edge Functions for:
- Combat validation
- Crafting validation
- Quest completion validation

## 📊 Monitoring

### View User Activity:
```sql
SELECT * FROM transactions 
ORDER BY created_at DESC 
LIMIT 100;
```

### Check Suspicious Activity:
```sql
-- Find characters with unusual stats
SELECT name, level, base_stats, spirit_stones 
FROM characters 
WHERE (base_stats->>'str')::int > level * 3 + 10;
```

### Market Stats:
```sql
SELECT 
  COUNT(*) as total_sales,
  SUM(price) as total_volume,
  AVG(price) as avg_price
FROM market_listings 
WHERE status = 'sold';
```

## 🚀 Next Steps

1. ✅ Run the SQL schema
2. ✅ Verify tables are created
3. Add environment variables to Vercel
4. Test with a new account

## 🔧 Troubleshooting

### "permission denied for table"
- RLS is blocking access
- Check if user is authenticated
- Verify policies are correct

### "violates check constraint"
- Data validation failed
- Check the values being saved
- Review trigger validation rules

### "duplicate key value"
- Trying to create duplicate entry
- Each user can only have one character per slot

---

**Need help?** Check the Supabase logs at Dashboard → Logs → Postgres
