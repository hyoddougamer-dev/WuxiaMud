import React, { useState, useMemo } from 'react';
import { ShoppingCart, Search, X, Plus, Minus, Tag, Clock, User, Sword, Shield, Heart, Zap, Package, TrendingUp, TrendingDown, ArrowUpDown, DollarSign, Archive, Sparkles, Star, CircleDot, Crown, ChevronDown, ChevronUp, Filter, BarChart3 } from 'lucide-react';
import { SpiritStoneIcon } from './ItemIcon';
import { materials } from '../data/materials';
import { gearItems } from '../data/gearItems';
import { accessoryItems } from '../data/accessoryItems';
import { RARITY_CONFIG, type ItemRarity } from '../data/raritySystem';

// Market Category
export type MarketCategory = 'all' | 'weapons' | 'accessories' | 'materials';

// Rarity filter type
export type RarityFilter = 'all' | ItemRarity;

// Order Types (Albion Style)
export type OrderType = 'sell' | 'buy';

// Market Order
export interface MarketOrder {
  id: string;
  type: OrderType;
  playerId: string;
  playerName: string;
  itemId: string;
  itemName: string;
  itemType: 'weapon' | 'accessory' | 'material';
  itemRarity: string;
  itemTier: number;
  itemStats?: Record<string, number>;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  createdAt: Date;
  expiresAt: Date;
}

// Aggregated Market Item (for display)
export interface MarketItemSummary {
  itemId: string;
  itemName: string;
  itemType: 'weapon' | 'accessory' | 'material';
  itemRarity: string;
  itemTier: number;
  itemStats?: Record<string, number>;
  itemDesc?: string;
  lowestSellPrice: number | null;
  highestBuyPrice: number | null;
  sellOrderCount: number;
  buyOrderCount: number;
  totalSellQuantity: number;
  totalBuyQuantity: number;
  sellOrders: MarketOrder[];
  buyOrders: MarketOrder[];
}

// Price History Entry
export interface PriceHistoryEntry {
  date: Date;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  volume: number;
  rarity: ItemRarity;
}

// Generate simulated price history for 30 days
const generatePriceHistory = (rarity: ItemRarity, tier: number): PriceHistoryEntry[] => {
  const history: PriceHistoryEntry[] = [];
  const config = RARITY_CONFIG[rarity];
  const basePrice = tier * 500 * config.statMultiplier;
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000);
    const volatility = 0.15; // 15% price volatility
    const trend = Math.sin(i / 7) * 0.1; // Weekly trend
    const randomFactor = (Math.random() - 0.5) * volatility;
    
    const avgPrice = Math.floor(basePrice * (1 + trend + randomFactor));
    const minPrice = Math.floor(avgPrice * (0.85 + Math.random() * 0.05));
    const maxPrice = Math.floor(avgPrice * (1.1 + Math.random() * 0.1));
    const volume = Math.floor(Math.random() * 20) + 1;
    
    history.push({
      date,
      avgPrice,
      minPrice,
      maxPrice,
      volume,
      rarity,
    });
  }
  
  return history;
};

// Legacy to Wuxia rarity mapping
const LEGACY_TO_WUXIA: Record<string, ItemRarity> = {
  'Common': 'Mortal',
  'Uncommon': 'Earth',
  'Rare': 'Heaven',
  'Epic': 'Spirit',
  'Legendary': 'Immortal',
};

// Get normalized rarity
const getNormalizedRarity = (rarity: string | undefined): ItemRarity => {
  if (!rarity) return 'Mortal';
  if (RARITY_CONFIG[rarity as ItemRarity]) return rarity as ItemRarity;
  return LEGACY_TO_WUXIA[rarity] || 'Mortal';
};

// Wuxia rarity styling
const rarityConfig: Record<string, { text: string; border: string; bg: string; glow: string }> = {
  'Mortal': { text: 'text-gray-300', border: 'border-gray-500/50', bg: 'bg-gray-500/10', glow: '' },
  'Earth': { text: 'text-green-400', border: 'border-green-500/50', bg: 'bg-green-500/10', glow: 'shadow-green-500/20' },
  'Heaven': { text: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-500/10', glow: 'shadow-blue-500/20' },
  'Spirit': { text: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-500/10', glow: 'shadow-purple-500/20' },
  'Immortal': { text: 'text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-500/10', glow: 'shadow-amber-500/30' },
  // Legacy fallbacks
  'Common': { text: 'text-gray-300', border: 'border-gray-500/50', bg: 'bg-gray-500/10', glow: '' },
  'Uncommon': { text: 'text-green-400', border: 'border-green-500/50', bg: 'bg-green-500/10', glow: 'shadow-green-500/20' },
  'Rare': { text: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-500/10', glow: 'shadow-blue-500/20' },
  'Epic': { text: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-500/10', glow: 'shadow-purple-500/20' },
  'Legendary': { text: 'text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-500/10', glow: 'shadow-amber-500/30' },
};

// Generate mock orders from real game items
function generateMockOrders(): MarketOrder[] {
  const orders: MarketOrder[] = [];
  const sellers = ['DragonSlayer99', 'MerchantKing', 'CrafterPro', 'TradeMaster', 'JadeSage', 'SwordMaster', 'AlchemistGod'];
  
  // Add weapons
  gearItems.forEach((weapon, idx) => {
    const numSellOrders = Math.floor(Math.random() * 4);
    const numBuyOrders = Math.floor(Math.random() * 3);
    const basePrice = weapon.tier * 500 * (weapon.rarity === 'Legendary' ? 20 : weapon.rarity === 'Epic' ? 10 : weapon.rarity === 'Rare' ? 5 : 2);
    
    for (let i = 0; i < numSellOrders; i++) {
      const price = basePrice + Math.floor(Math.random() * basePrice * 0.3) - Math.floor(Math.random() * basePrice * 0.1);
      orders.push({
        id: `sell_weapon_${weapon.id}_${i}`,
        type: 'sell',
        playerId: `player_${idx}_${i}`,
        playerName: sellers[Math.floor(Math.random() * sellers.length)],
        itemId: weapon.id,
        itemName: weapon.name,
        itemType: 'weapon',
        itemRarity: weapon.rarity,
        itemTier: weapon.tier,
        itemStats: weapon.stats,
        quantity: 1,
        pricePerUnit: price,
        totalPrice: price,
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 5),
        expiresAt: new Date(Date.now() + Math.random() * 86400000 * 7),
      });
    }
    
    for (let i = 0; i < numBuyOrders; i++) {
      const price = basePrice - Math.floor(Math.random() * basePrice * 0.3);
      orders.push({
        id: `buy_weapon_${weapon.id}_${i}`,
        type: 'buy',
        playerId: `player_buy_${idx}_${i}`,
        playerName: sellers[Math.floor(Math.random() * sellers.length)],
        itemId: weapon.id,
        itemName: weapon.name,
        itemType: 'weapon',
        itemRarity: weapon.rarity,
        itemTier: weapon.tier,
        itemStats: weapon.stats,
        quantity: 1,
        pricePerUnit: price,
        totalPrice: price,
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 3),
        expiresAt: new Date(Date.now() + Math.random() * 86400000 * 7),
      });
    }
  });

  // Add accessories
  accessoryItems.forEach((acc, idx) => {
    const numSellOrders = Math.floor(Math.random() * 3) + 1;
    const numBuyOrders = Math.floor(Math.random() * 2);
    const basePrice = acc.tier * 300 * (acc.rarity === 'Legendary' ? 15 : acc.rarity === 'Epic' ? 8 : acc.rarity === 'Rare' ? 4 : 2);
    
    for (let i = 0; i < numSellOrders; i++) {
      const price = basePrice + Math.floor(Math.random() * basePrice * 0.25);
      orders.push({
        id: `sell_acc_${acc.id}_${i}`,
        type: 'sell',
        playerId: `player_acc_${idx}_${i}`,
        playerName: sellers[Math.floor(Math.random() * sellers.length)],
        itemId: acc.id,
        itemName: acc.name,
        itemType: 'accessory',
        itemRarity: acc.rarity,
        itemTier: acc.tier,
        itemStats: acc.stats,
        quantity: 1,
        pricePerUnit: price,
        totalPrice: price,
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 4),
        expiresAt: new Date(Date.now() + Math.random() * 86400000 * 7),
      });
    }
    
    for (let i = 0; i < numBuyOrders; i++) {
      const price = basePrice - Math.floor(Math.random() * basePrice * 0.2);
      orders.push({
        id: `buy_acc_${acc.id}_${i}`,
        type: 'buy',
        playerId: `player_accbuy_${idx}_${i}`,
        playerName: sellers[Math.floor(Math.random() * sellers.length)],
        itemId: acc.id,
        itemName: acc.name,
        itemType: 'accessory',
        itemRarity: acc.rarity,
        itemTier: acc.tier,
        itemStats: acc.stats,
        quantity: 1,
        pricePerUnit: price,
        totalPrice: price,
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 3),
        expiresAt: new Date(Date.now() + Math.random() * 86400000 * 7),
      });
    }
  });

  // Add materials
  materials.forEach((mat, idx) => {
    const numSellOrders = Math.floor(Math.random() * 5) + 2;
    const numBuyOrders = Math.floor(Math.random() * 4) + 1;
    const tierNum = typeof mat.tier === 'number' ? mat.tier : 4;
    const basePrice = tierNum * 25 * (mat.rarity === 'Legendary' ? 30 : mat.rarity === 'Epic' ? 15 : mat.rarity === 'Rare' ? 5 : 1);
    
    for (let i = 0; i < numSellOrders; i++) {
      const qty = Math.floor(Math.random() * 50) + 5;
      const price = basePrice + Math.floor(Math.random() * basePrice * 0.4);
      orders.push({
        id: `sell_mat_${mat.id}_${i}`,
        type: 'sell',
        playerId: `player_mat_${idx}_${i}`,
        playerName: sellers[Math.floor(Math.random() * sellers.length)],
        itemId: mat.id,
        itemName: mat.name,
        itemType: 'material',
        itemRarity: mat.rarity,
        itemTier: tierNum,
        quantity: qty,
        pricePerUnit: price,
        totalPrice: price * qty,
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 2),
        expiresAt: new Date(Date.now() + Math.random() * 86400000 * 7),
      });
    }
    
    for (let i = 0; i < numBuyOrders; i++) {
      const qty = Math.floor(Math.random() * 100) + 10;
      const price = basePrice - Math.floor(Math.random() * basePrice * 0.2);
      orders.push({
        id: `buy_mat_${mat.id}_${i}`,
        type: 'buy',
        playerId: `player_matbuy_${idx}_${i}`,
        playerName: sellers[Math.floor(Math.random() * sellers.length)],
        itemId: mat.id,
        itemName: mat.name,
        itemType: 'material',
        itemRarity: mat.rarity,
        itemTier: tierNum,
        quantity: qty,
        pricePerUnit: price,
        totalPrice: price * qty,
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 1),
        expiresAt: new Date(Date.now() + Math.random() * 86400000 * 7),
      });
    }
  });
  
  return orders;
}

// Aggregate orders into item summaries
function aggregateOrders(orders: MarketOrder[]): MarketItemSummary[] {
  const itemMap = new Map<string, MarketItemSummary>();
  
  orders.forEach(order => {
    if (!itemMap.has(order.itemId)) {
      itemMap.set(order.itemId, {
        itemId: order.itemId,
        itemName: order.itemName,
        itemType: order.itemType,
        itemRarity: order.itemRarity,
        itemTier: order.itemTier,
        itemStats: order.itemStats,
        lowestSellPrice: null,
        highestBuyPrice: null,
        sellOrderCount: 0,
        buyOrderCount: 0,
        totalSellQuantity: 0,
        totalBuyQuantity: 0,
        sellOrders: [],
        buyOrders: [],
      });
    }
    
    const summary = itemMap.get(order.itemId)!;
    
    if (order.type === 'sell') {
      summary.sellOrders.push(order);
      summary.sellOrderCount++;
      summary.totalSellQuantity += order.quantity;
      if (summary.lowestSellPrice === null || order.pricePerUnit < summary.lowestSellPrice) {
        summary.lowestSellPrice = order.pricePerUnit;
      }
    } else {
      summary.buyOrders.push(order);
      summary.buyOrderCount++;
      summary.totalBuyQuantity += order.quantity;
      if (summary.highestBuyPrice === null || order.pricePerUnit > summary.highestBuyPrice) {
        summary.highestBuyPrice = order.pricePerUnit;
      }
    }
  });
  
  // Sort orders within each summary
  itemMap.forEach(summary => {
    summary.sellOrders.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
    summary.buyOrders.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
  });
  
  return Array.from(itemMap.values());
}

// Item Icon Component
const ItemIcon: React.FC<{ type: string; rarity: string; size?: number }> = ({ type, rarity, size = 20 }) => {
  const style = rarityConfig[rarity] || rarityConfig['Common'];
  const Icon = type === 'weapon' ? Sword : type === 'accessory' ? Star : Package;
  return <Icon size={size} className={style.text} />;
};

// Format price with commas
const formatPrice = (price: number): string => {
  if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M`;
  if (price >= 1000) return `${(price / 1000).toFixed(1)}K`;
  return price.toLocaleString();
};

// Market Item Row Component (Albion Style)
const MarketItemRow: React.FC<{
  summary: MarketItemSummary;
  isSelected: boolean;
  onClick: () => void;
}> = ({ summary, isSelected, onClick }) => {
  const normalizedRarity = getNormalizedRarity(summary.itemRarity);
  const style = rarityConfig[normalizedRarity] || rarityConfig['Mortal'];
  const displayRarity = RARITY_CONFIG[normalizedRarity]?.displayName || normalizedRarity;
  
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border-b border-white/5 ${
        isSelected 
          ? `bg-gradient-to-r ${style.bg} border-l-2 ${style.border}`
          : 'hover:bg-white/5'
      }`}
    >
      {/* Item Icon */}
      <div className={`w-10 h-10 rounded-lg border ${style.border} ${style.bg} flex items-center justify-center`}>
        <ItemIcon type={summary.itemType} rarity={normalizedRarity} />
      </div>
      
      {/* Item Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-bold text-sm ${style.text}`}>{summary.itemName}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${style.bg} ${style.text} font-bold uppercase`}>
            T{summary.itemTier}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <span>{summary.itemType}</span>
          <span>•</span>
          <span className={style.text}>{displayRarity}</span>
        </div>
      </div>
      
      {/* Sell Orders Info */}
      <div className="text-right w-24">
        <div className="flex items-center justify-end gap-1">
          <TrendingDown size={12} className="text-red-400" />
          <span className="text-xs text-gray-400">Sell</span>
        </div>
        {summary.lowestSellPrice ? (
          <div className="flex items-center justify-end gap-1">
            <SpiritStoneIcon size="xs" />
            <span className="text-cyan-400 font-bold text-sm">{formatPrice(summary.lowestSellPrice)}</span>
          </div>
        ) : (
          <span className="text-gray-600 text-xs">No orders</span>
        )}
        <span className="text-[10px] text-gray-600">{summary.totalSellQuantity} available</span>
      </div>
      
      {/* Buy Orders Info */}
      <div className="text-right w-24">
        <div className="flex items-center justify-end gap-1">
          <TrendingUp size={12} className="text-green-400" />
          <span className="text-xs text-gray-400">Buy</span>
        </div>
        {summary.highestBuyPrice ? (
          <div className="flex items-center justify-end gap-1">
            <SpiritStoneIcon size="xs" />
            <span className="text-amber-400 font-bold text-sm">{formatPrice(summary.highestBuyPrice)}</span>
          </div>
        ) : (
          <span className="text-gray-600 text-xs">No orders</span>
        )}
        <span className="text-[10px] text-gray-600">{summary.totalBuyQuantity} wanted</span>
      </div>
    </div>
  );
};

// Order Detail Row
const OrderRow: React.FC<{
  order: MarketOrder;
  onAction: (order: MarketOrder) => void;
  actionLabel: string;
  actionStyle: string;
}> = ({ order, onAction, actionLabel, actionStyle }) => {
  const formatTime = (date: Date) => {
    const hours = Math.floor((date.getTime() - Date.now()) / 3600000);
    if (hours < 0) return 'Expired';
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-black/20 rounded-lg border border-white/5 hover:border-white/10 transition-all">
      <div className="flex-1">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <User size={10} />
          <span>{order.playerName}</span>
          <span className="text-gray-600">•</span>
          <Clock size={10} />
          <span>{formatTime(order.expiresAt)}</span>
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center gap-1 text-sm">
          <span className="text-gray-400">x{order.quantity}</span>
          <span className="text-gray-600">@</span>
          <SpiritStoneIcon size="xs" />
          <span className="text-cyan-400 font-bold">{formatPrice(order.pricePerUnit)}</span>
        </div>
      </div>
      <button
        onClick={() => onAction(order)}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${actionStyle}`}
      >
        {actionLabel}
      </button>
    </div>
  );
};

// Props
interface MarketPanelProps {
  playerGold: number;
  playerId?: string;
  playerName?: string;
  playerInventory?: any[];
  onClose: () => void;
  onBuy?: (order: MarketOrder) => void;
  onSell?: (order: MarketOrder) => void;
}

export const MarketPanel: React.FC<MarketPanelProps> = ({
  playerGold,
  playerId,
  playerName,
  playerInventory = [],
  onClose,
  onBuy,
  onSell
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory>('all');
  const [selectedRarity, setSelectedRarity] = useState<RarityFilter>('all');
  const [selectedItem, setSelectedItem] = useState<MarketItemSummary | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'tier' | 'price'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [orders] = useState<MarketOrder[]>(() => generateMockOrders());
  const [activeOrderTab, setActiveOrderTab] = useState<'sell' | 'buy'>('sell');
  
  // Aggregate orders into item summaries
  const itemSummaries = useMemo(() => {
    return aggregateOrders(orders);
  }, [orders]);
  
  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = [...itemSummaries];
    
    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.itemName.toLowerCase().includes(q)
      );
    }
    
    // Filter by rarity
    if (selectedRarity !== 'all') {
      result = result.filter(item => {
        const normalized = getNormalizedRarity(item.itemRarity);
        return normalized === selectedRarity;
      });
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      const categoryMap: Record<string, string[]> = {
        'weapons': ['weapon'],
        'accessories': ['accessory'],
        'materials': ['material'],
      };
      result = result.filter(item => categoryMap[selectedCategory]?.includes(item.itemType));
    }
    
    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name':
          cmp = a.itemName.localeCompare(b.itemName);
          break;
        case 'tier':
          cmp = a.itemTier - b.itemTier;
          break;
        case 'price':
          const priceA = a.lowestSellPrice || Infinity;
          const priceB = b.lowestSellPrice || Infinity;
          cmp = priceA - priceB;
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    
    return result;
  }, [itemSummaries, searchQuery, selectedCategory, sortBy, sortDir]);
  
  const handleBuyOrder = (order: MarketOrder) => {
    if (playerGold < order.totalPrice) {
      alert('Not enough Spirit Stones!');
      return;
    }
    onBuy?.(order);
  };
  
  const handleSellToOrder = (order: MarketOrder) => {
    onSell?.(order);
  };
  
  const toggleSort = (field: 'name' | 'tier' | 'price') => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };
  
  const categories: { id: MarketCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Items', icon: <Archive size={14} /> },
    { id: 'weapons', label: 'Weapons', icon: <Sword size={14} /> },
    { id: 'accessories', label: 'Accessories', icon: <Star size={14} /> },
    { id: 'materials', label: 'Materials', icon: <Package size={14} /> },
  ];
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-[1100px] max-h-[90vh] bg-gradient-to-br from-[#1a1f2e] via-[#151820] to-[#0f1218] border-2 border-amber-500/30 rounded-2xl shadow-2xl shadow-amber-500/10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-amber-900/40 via-amber-800/20 to-amber-900/40 border-b border-amber-500/30 px-6 py-4">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl" />
          </div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30 flex items-center justify-center">
                <ShoppingCart size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500">
                  Celestial Trading Post
                </h2>
                <p className="text-xs text-amber-200/60 mt-0.5">Place buy & sell orders • Trade with fellow cultivators</p>
              </div>
            </div>
            
            {/* Player Balance */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-900/40 to-cyan-800/20 border border-cyan-500/40 rounded-xl">
                <SpiritStoneIcon size="md" />
                <span className="font-bold text-cyan-300 text-lg">{playerGold.toLocaleString()}</span>
                <span className="text-xs text-cyan-500">Spirit Stones</span>
              </div>
              
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors group">
                <X size={20} className="text-gray-400 group-hover:text-white" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Category Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-white/5 bg-black/20">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSelectedItem(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-amber-600/30 text-amber-400 border border-amber-500/50'
                  : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:text-white hover:border-gray-500'
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
          
          {/* Search */}
          <div className="flex-1 relative ml-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedItem(null);
              }}
              placeholder="Search items..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800/80 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>
        
        {/* Rarity Filter Row */}
        <div className="flex items-center gap-2 px-6 py-2 border-b border-white/5 bg-black/10">
          <Filter size={14} className="text-gray-500" />
          <span className="text-[10px] text-gray-500 uppercase tracking-wider mr-2">Rarity:</span>
          <button
            onClick={() => { setSelectedRarity('all'); setSelectedItem(null); }}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              selectedRarity === 'all'
                ? 'bg-gray-600/50 text-white border border-gray-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          {(['Mortal', 'Earth', 'Heaven', 'Spirit', 'Immortal'] as ItemRarity[]).map(rarity => {
            const config = RARITY_CONFIG[rarity];
            return (
              <button
                key={rarity}
                onClick={() => { setSelectedRarity(rarity); setSelectedItem(null); }}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  selectedRarity === rarity
                    ? `${rarityConfig[rarity].bg} ${rarityConfig[rarity].text} border ${rarityConfig[rarity].border}`
                    : `${rarityConfig[rarity].text} opacity-60 hover:opacity-100`
                }`}
              >
                {config.displayName}
              </button>
            );
          })}
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Item List */}
          <div className="w-[500px] border-r border-white/5 flex flex-col">
            {/* Sort Headers */}
            <div className="flex items-center gap-2 px-4 py-2 bg-black/30 border-b border-white/5 text-[10px] text-gray-500 uppercase tracking-wider">
              <button onClick={() => toggleSort('name')} className="flex-1 flex items-center gap-1 hover:text-white transition-colors">
                Item Name
                {sortBy === 'name' && (sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
              </button>
              <button onClick={() => toggleSort('tier')} className="w-16 text-center hover:text-white transition-colors flex items-center justify-center gap-1">
                Tier
                {sortBy === 'tier' && (sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
              </button>
              <button onClick={() => toggleSort('price')} className="w-24 text-center hover:text-white transition-colors flex items-center justify-center gap-1">
                Best Sell
                {sortBy === 'price' && (sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
              </button>
              <div className="w-24 text-center">Best Buy</div>
            </div>
            
            {/* Item List */}
            <div className="flex-1 overflow-y-auto">
              {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <Package size={48} className="mb-4 opacity-30" />
                  <p>No items found</p>
                </div>
              ) : (
                filteredItems.map(item => (
                  <MarketItemRow
                    key={item.itemId}
                    summary={item}
                    isSelected={selectedItem?.itemId === item.itemId}
                    onClick={() => setSelectedItem(item)}
                  />
                ))
              )}
            </div>
          </div>
          
          {/* Right Panel - Order Details */}
          <div className="flex-1 flex flex-col bg-black/10">
            {selectedItem ? (
              (() => {
                const selectedNormalizedRarity = getNormalizedRarity(selectedItem.itemRarity);
                const selectedStyle = rarityConfig[selectedNormalizedRarity] || rarityConfig['Mortal'];
                const selectedDisplayRarity = RARITY_CONFIG[selectedNormalizedRarity]?.displayName || selectedNormalizedRarity;
                const isImmortal = selectedNormalizedRarity === 'Immortal';
                
                return (
              <>
                {/* Item Header */}
                <div className="px-6 py-4 border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-xl border-2 ${selectedStyle.border} ${selectedStyle.bg} flex items-center justify-center shadow-lg ${selectedStyle.glow}`}>
                      <ItemIcon type={selectedItem.itemType} rarity={selectedNormalizedRarity} size={28} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-xl font-bold ${selectedStyle.text}`}>
                          {selectedItem.itemName}
                        </h3>
                        {isImmortal && <Sparkles size={16} className="text-orange-400" />}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${selectedStyle.bg} ${selectedStyle.text} font-bold uppercase`}>
                          {selectedDisplayRarity}
                        </span>
                        <span className="text-xs text-gray-400">Tier {selectedItem.itemTier}</span>
                        <span className="text-xs text-gray-400 capitalize">{selectedItem.itemType}</span>
                      </div>
                      {/* Stats */}
                      {selectedItem.itemStats && Object.keys(selectedItem.itemStats).length > 0 && (
                        <div className="flex items-center gap-3 mt-2">
                          {Object.entries(selectedItem.itemStats).map(([stat, value]) => (
                            <span key={stat} className="text-xs text-gray-400">
                              +{value} <span className="text-gray-500 uppercase">{stat}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Price History Mini Chart (30 days) */}
                  {(() => {
                    const normalizedRarity = getNormalizedRarity(selectedItem.itemRarity);
                    const history = generatePriceHistory(normalizedRarity, selectedItem.itemTier);
                    const last7Days = history.slice(-7);
                    const maxPrice = Math.max(...last7Days.map(h => h.maxPrice));
                    const minPrice = Math.min(...last7Days.map(h => h.minPrice));
                    const priceRange = maxPrice - minPrice || 1;
                    const latestPrice = last7Days[last7Days.length - 1].avgPrice;
                    const firstPrice = last7Days[0].avgPrice;
                    const priceChange = latestPrice - firstPrice;
                    const priceChangePercent = ((priceChange / firstPrice) * 100).toFixed(1);
                    const isUp = priceChange >= 0;
                    
                    return (
                      <div className="mt-3 p-3 bg-black/30 rounded-lg border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <BarChart3 size={12} className="text-gray-500" />
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">7-Day Price History</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                              {isUp ? '+' : ''}{priceChangePercent}%
                            </span>
                            {isUp ? <TrendingUp size={12} className="text-green-400" /> : <TrendingDown size={12} className="text-red-400" />}
                          </div>
                        </div>
                        
                        {/* Mini Bar Chart */}
                        <div className="flex items-end justify-between gap-1 h-10">
                          {last7Days.map((day, idx) => {
                            const height = ((day.avgPrice - minPrice) / priceRange) * 100;
                            const isToday = idx === last7Days.length - 1;
                            return (
                              <div
                                key={idx}
                                className="flex-1 relative group"
                                title={`${day.date.toLocaleDateString()}: ${formatPrice(day.avgPrice)} (${day.volume} traded)`}
                              >
                                <div
                                  className={`w-full rounded-t transition-all ${
                                    isToday ? 'bg-cyan-400' : 'bg-gray-600 hover:bg-cyan-400/50'
                                  }`}
                                  style={{ height: `${Math.max(height, 10)}%` }}
                                />
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Price Range */}
                        <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500">
                          <span>Low: <span className="text-red-400">{formatPrice(minPrice)}</span></span>
                          <span>Avg: <span className="text-cyan-400">{formatPrice(latestPrice)}</span></span>
                          <span>High: <span className="text-green-400">{formatPrice(maxPrice)}</span></span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                
                {/* Order Tabs */}
                <div className="flex items-center gap-2 px-6 py-3 border-b border-white/5">
                  <button
                    onClick={() => setActiveOrderTab('sell')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      activeOrderTab === 'sell'
                        ? 'bg-red-600/30 text-red-400 border border-red-500/50'
                        : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:text-white'
                    }`}
                  >
                    <TrendingDown size={14} />
                    Sell Orders ({selectedItem.sellOrderCount})
                  </button>
                  <button
                    onClick={() => setActiveOrderTab('buy')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      activeOrderTab === 'buy'
                        ? 'bg-green-600/30 text-green-400 border border-green-500/50'
                        : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:text-white'
                    }`}
                  >
                    <TrendingUp size={14} />
                    Buy Orders ({selectedItem.buyOrderCount})
                  </button>
                </div>
                
                {/* Orders List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {activeOrderTab === 'sell' ? (
                    selectedItem.sellOrders.length > 0 ? (
                      <>
                        <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                          <TrendingDown size={12} className="text-red-400" />
                          Players selling this item — Buy now at listed price
                        </div>
                        {selectedItem.sellOrders.map(order => (
                          <OrderRow
                            key={order.id}
                            order={order}
                            onAction={handleBuyOrder}
                            actionLabel="Buy"
                            actionStyle="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white hover:from-cyan-500 hover:to-cyan-600"
                          />
                        ))}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <TrendingDown size={32} className="mb-3 opacity-30" />
                        <p className="text-sm">No sell orders</p>
                        <p className="text-xs mt-1">Be the first to sell this item!</p>
                      </div>
                    )
                  ) : (
                    selectedItem.buyOrders.length > 0 ? (
                      <>
                        <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                          <TrendingUp size={12} className="text-green-400" />
                          Players buying this item — Sell to them at listed price
                        </div>
                        <div className="text-[10px] text-amber-400/70 mb-2 flex items-center gap-1 bg-amber-900/20 px-2 py-1 rounded">
                          <SpiritStoneIcon size="xs" />
                          <span>5% transaction fee applies to all sales</span>
                        </div>
                        {selectedItem.buyOrders.map(order => {
                          const gross = order.totalPrice;
                          const tax = Math.floor(gross * 0.05);
                          const net = gross - tax;
                          return (
                            <div key={order.id} className="mb-2">
                              <OrderRow
                                order={order}
                                onAction={handleSellToOrder}
                                actionLabel="Sell"
                                actionStyle="bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500"
                              />
                              <div className="text-[10px] text-gray-500 mt-1 ml-2 flex items-center gap-2">
                                <span>Total: <span className="text-cyan-400">{formatPrice(gross)}</span></span>
                                <span className="text-amber-400">-{formatPrice(tax)} tax</span>
                                <span>=</span>
                                <span className="text-green-400 font-bold">{formatPrice(net)} net</span>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <TrendingUp size={32} className="mb-3 opacity-30" />
                        <p className="text-sm">No buy orders</p>
                        <p className="text-xs mt-1">Place a buy order to get this item!</p>
                      </div>
                    )
                  )}
                </div>
                
                {/* Action Footer */}
                <div className="px-6 py-4 border-t border-white/5 bg-black/30">
                  <div className="flex items-center gap-3">
                    <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20">
                      <Plus size={18} />
                      Place Buy Order
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-500/20">
                      <Tag size={18} />
                      Place Sell Order
                    </button>
                  </div>
                  <p className="text-center text-[10px] text-gray-500 mt-2">5% market fee on completed transactions</p>
                </div>
              </>
                );
              })()
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                <ShoppingCart size={64} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">Select an item</p>
                <p className="text-sm mt-1">Click on an item to view orders</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t border-white/10 bg-black/30 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>{filteredItems.length} items available</span>
            <span>•</span>
            <span>{orders.filter(o => o.type === 'sell').length} sell orders</span>
            <span>•</span>
            <span>{orders.filter(o => o.type === 'buy').length} buy orders</span>
          </div>
          <div className="text-xs text-gray-600">
            Orders expire after 7 days • Prices update in real-time
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketPanel;