import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart, Search, X, Tag, Clock, User, Gem, Package, 
  TrendingUp, TrendingDown, ChevronDown, ChevronUp, Sword, 
  Star, History, BarChart3, Plus, Filter, ArrowUpDown,
  CircleDot, Sparkles, AlertCircle
} from 'lucide-react';
import { SpiritStoneIcon } from '../ItemIcon';
import { materials, type Material } from '../../data/materials';
import { gearItems, type GearItem } from '../../data/gearItems';
import { accessoryItems, type AccessoryItem } from '../../data/accessoryItems';
import { RARITY_CONFIG, type ItemRarity } from '../../data/raritySystem';

// ============================================
// ICON MAPPINGS - Using actual game icons
// ============================================
const ICON_PATHS = {
  // Weapons
  weapons: {
    sword: {
      1: '/icons/weapons/wp_sword_t1.png',
      2: '/icons/weapons/wp_sword_t2.png',
      3: '/icons/weapons/wp_sword_t3.png',
      4: '/icons/weapons/wp_sword_t4.png',
    },
    saber: {
      1: '/icons/weapons/wp_saber_t1.png',
      2: '/icons/weapons/wp_saber_t2.png',
      3: '/icons/weapons/wp_saber_t3.png',
      4: '/icons/weapons/wp_saber_t4.png',
    },
    zither: {
      1: '/icons/weapons/wp_zither_t1.png',
      2: '/icons/weapons/wp_zither_t2.png',
      3: '/icons/weapons/wp_zither_t3.png',
      4: '/icons/weapons/wp_zither_t4.png',
    },
  },
  // Accessories
  accessories: {
    ring: {
      1: '/icons/accessories/ac_ring_t1.png',
      2: '/icons/accessories/ac_ring_t2.png',
      3: '/icons/accessories/ac_ring_t3.png',
      4: '/icons/accessories/ac_ring_t4.png',
    },
    necklace: {
      1: '/icons/accessories/ac_necklace_t1.png',
      2: '/icons/accessories/ac_necklace_t2.png',
      3: '/icons/accessories/ac_necklace_t3.png',
      4: '/icons/accessories/ac_necklace_t4.png',
    },
  },
  // Materials
  materials: {
    'MAT_T1_001': '/icons/materials/mat_ore_t1.png', // Spirit Iron Ore
    'MAT_T1_002': '/icons/materials/mat_qi_t1.png', // Qi Fragment
    'MAT_T2_001': '/icons/materials/mat_crystal_t2.png', // Azure Crystal
    'MAT_T2_002': '/icons/materials/mat_stone_t2.png', // Foundation Stone
    'MAT_T3_001': '/icons/materials/mat_thunder_t3.png', // Thunder Essence
    'MAT_T3_002': '/icons/materials/mat_iron_t3.png', // Sky Iron Ingot
    'MAT_T4_001': '/icons/materials/mat_core_t4.png', // Golden Core Fragment
    'MAT_T4_002': '/icons/materials/mat_essence_t4.png', // Core Qi Essence
    'MAT_SP_001': '/icons/materials/mat_bloodsteel.png', // Bloodsteel
    'MAT_SP_002': '/icons/materials/mat_jade_legendary.png', // Immortal Jade
    'MAT_SP_003': '/icons/tokens/token_sword.png', // Sword Dao Token
    'MAT_SP_004': '/icons/tokens/token_saber.png', // Saber Intent Fragment
    'MAT_SP_005': '/icons/tokens/token_zither.png', // Harmonic Zither String
  },
  // Junk items
  junk: {
    'spirit_stone': '/icons/junk/currency_spirit_stone.png',
  },
};

// Get weapon type from class ID
const getWeaponType = (classId: number): 'sword' | 'saber' | 'zither' => {
  if (classId >= 1 && classId <= 4) return 'sword';
  if (classId >= 5 && classId <= 8) return 'saber';
  return 'zither';
};

// Get icon for an item
const getItemIcon = (item: { id: string; type?: string; tier?: number; classId?: number; slot?: string }): string => {
  // Weapons
  if ('classId' in item && item.classId) {
    const weaponType = getWeaponType(item.classId);
    const tier = item.tier || 1;
    return ICON_PATHS.weapons[weaponType][tier as 1|2|3|4] || '';
  }
  // Accessories
  if ('slot' in item && (item.slot === 'ring' || item.slot === 'necklace')) {
    const tier = item.tier || 1;
    return ICON_PATHS.accessories[item.slot][tier as 1|2|3|4] || '';
  }
  // Materials
  if (ICON_PATHS.materials[item.id as keyof typeof ICON_PATHS.materials]) {
    return ICON_PATHS.materials[item.id as keyof typeof ICON_PATHS.materials];
  }
  return '';
};

// ============================================
// TYPES
// ============================================
type MarketCategory = 'all' | 'weapons' | 'accessories' | 'materials';
type OrderType = 'sell' | 'buy';

interface MarketOrder {
  id: string;
  type: OrderType;
  playerId: string;
  playerName: string;
  itemId: string;
  itemName: string;
  itemCategory: 'weapon' | 'accessory' | 'material';
  itemRarity: string;
  itemTier: number;
  itemIcon: string;
  quantity: number;
  pricePerUnit: number;
  createdAt: Date;
  expiresAt: Date;
}

interface MarketItemData {
  id: string;
  name: string;
  category: 'weapon' | 'accessory' | 'material';
  rarity: string;
  tier: number;
  icon: string;
  desc?: string;
}

interface PriceHistory {
  date: Date;
  avgPrice: number;
  volume: number;
}

// ============================================
// RARITY SYSTEM - Wuxia Grade Mapping
// ============================================

// Legacy to Wuxia rarity mapping
const LEGACY_TO_WUXIA: Record<string, ItemRarity> = {
  'Common': 'Mortal',
  'Uncommon': 'Earth',
  'Rare': 'Heaven',
  'Epic': 'Spirit',
  'Legendary': 'Immortal',
};

// Get normalized Wuxia rarity from any rarity string
const getNormalizedRarity = (rarity: string | undefined): ItemRarity => {
  if (!rarity) return 'Mortal';
  if (RARITY_CONFIG[rarity as ItemRarity]) return rarity as ItemRarity;
  return LEGACY_TO_WUXIA[rarity] || 'Mortal';
};

// Get display name for rarity
const getRarityDisplayName = (rarity: string): string => {
  const normalized = getNormalizedRarity(rarity);
  return RARITY_CONFIG[normalized]?.displayName || normalized;
};

// Wuxia rarity styling (supports both legacy and new names)
const rarityStyles: Record<string, { text: string; border: string; bg: string; glow: string }> = {
  // Wuxia names
  'Mortal': { text: 'text-gray-300', border: 'border-gray-500/50', bg: 'bg-gray-500/10', glow: '' },
  'Earth': { text: 'text-green-400', border: 'border-green-500/50', bg: 'bg-green-500/10', glow: 'shadow-green-500/20' },
  'Heaven': { text: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-500/10', glow: 'shadow-blue-500/20' },
  'Spirit': { text: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-500/10', glow: 'shadow-purple-500/30' },
  'Immortal': { text: 'text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-500/10', glow: 'shadow-amber-500/40' },
  // Legacy fallbacks (map to same colors)
  'Common': { text: 'text-gray-300', border: 'border-gray-500/50', bg: 'bg-gray-500/10', glow: '' },
  'Uncommon': { text: 'text-green-400', border: 'border-green-500/50', bg: 'bg-green-500/10', glow: 'shadow-green-500/20' },
  'Rare': { text: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-500/10', glow: 'shadow-blue-500/20' },
  'Epic': { text: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-500/10', glow: 'shadow-purple-500/30' },
  'Legendary': { text: 'text-orange-400', border: 'border-orange-500/50', bg: 'bg-orange-500/10', glow: 'shadow-orange-500/40' },
};

// Get style for a rarity (always uses normalized rarity for consistent styling)
const getRarityStyle = (rarity: string) => {
  const normalized = getNormalizedRarity(rarity);
  return rarityStyles[normalized] || rarityStyles['Mortal'];
};

// ============================================
// BUILD MARKET ITEMS FROM GAME DATA
// ============================================
const buildMarketItems = (): MarketItemData[] => {
  const items: MarketItemData[] = [];
  
  // Add weapons (only class 1, 5, 9 - one per weapon type for first release)
  gearItems
    .filter(g => [1, 5, 9].includes(g.classId)) // Sword class 1, Saber class 5, Zither class 9
    .forEach(gear => {
      items.push({
        id: gear.id,
        name: gear.name,
        category: 'weapon',
        rarity: gear.rarity,
        tier: gear.tier,
        icon: getItemIcon(gear),
        desc: gear.desc,
      });
    });
  
  // Add all accessories
  accessoryItems.forEach(acc => {
    items.push({
      id: acc.id,
      name: acc.name,
      category: 'accessory',
      rarity: acc.rarity,
      tier: acc.tier,
      icon: getItemIcon(acc),
      desc: acc.desc,
    });
  });
  
  // Add all materials
  materials.forEach(mat => {
    const tier = typeof mat.tier === 'number' ? mat.tier : parseInt(String(mat.tier).replace('T', '')) || 4;
    items.push({
      id: mat.id,
      name: mat.name,
      category: 'material',
      rarity: mat.rarity,
      tier,
      icon: getItemIcon({ id: mat.id, type: 'material', tier }),
      desc: mat.desc,
    });
  });
  
  return items;
};

// ============================================
// GENERATE MOCK ORDERS & HISTORY
// ============================================
const generateMockOrders = (items: MarketItemData[]): MarketOrder[] => {
  const orders: MarketOrder[] = [];
  const sellers = ['JadeSwordsman', 'MerchantWang', 'CrafterLiu', 'TraderChen', 'SageMaster', 'SwordSaint'];
  
  items.forEach((item, idx) => {
    const numSellOrders = Math.floor(Math.random() * 4) + 1;
    const numBuyOrders = Math.floor(Math.random() * 3);
    
    const basePrice = item.tier * (item.category === 'weapon' ? 800 : item.category === 'accessory' ? 500 : 50) 
      * (item.rarity === 'Legendary' ? 20 : item.rarity === 'Epic' ? 10 : item.rarity === 'Rare' ? 5 : 2);
    
    // Sell orders
    for (let i = 0; i < numSellOrders; i++) {
      const price = Math.floor(basePrice * (0.9 + Math.random() * 0.3));
      const qty = item.category === 'material' ? Math.floor(Math.random() * 30) + 5 : 1;
      orders.push({
        id: `sell_${item.id}_${i}`,
        type: 'sell',
        playerId: `p_${idx}_${i}`,
        playerName: sellers[Math.floor(Math.random() * sellers.length)],
        itemId: item.id,
        itemName: item.name,
        itemCategory: item.category,
        itemRarity: item.rarity,
        itemTier: item.tier,
        itemIcon: item.icon,
        quantity: qty,
        pricePerUnit: price,
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 5),
        expiresAt: new Date(Date.now() + Math.random() * 86400000 * 7 + 86400000),
      });
    }
    
    // Buy orders
    for (let i = 0; i < numBuyOrders; i++) {
      const price = Math.floor(basePrice * (0.6 + Math.random() * 0.25));
      const qty = item.category === 'material' ? Math.floor(Math.random() * 50) + 10 : 1;
      orders.push({
        id: `buy_${item.id}_${i}`,
        type: 'buy',
        playerId: `pb_${idx}_${i}`,
        playerName: sellers[Math.floor(Math.random() * sellers.length)],
        itemId: item.id,
        itemName: item.name,
        itemCategory: item.category,
        itemRarity: item.rarity,
        itemTier: item.tier,
        itemIcon: item.icon,
        quantity: qty,
        pricePerUnit: price,
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 3),
        expiresAt: new Date(Date.now() + Math.random() * 86400000 * 7 + 86400000),
      });
    }
  });
  
  return orders;
};

const generatePriceHistory = (itemId: string, basePrice: number): PriceHistory[] => {
  const history: PriceHistory[] = [];
  for (let i = 30; i >= 0; i--) {
    history.push({
      date: new Date(Date.now() - i * 86400000),
      avgPrice: Math.floor(basePrice * (0.8 + Math.random() * 0.4)),
      volume: Math.floor(Math.random() * 50) + 5,
    });
  }
  return history;
};

// ============================================
// COMPONENTS
// ============================================

// Item Card in List
const ItemListCard: React.FC<{
  item: MarketItemData;
  sellOrders: MarketOrder[];
  buyOrders: MarketOrder[];
  isSelected: boolean;
  onClick: () => void;
}> = ({ item, sellOrders, buyOrders, isSelected, onClick }) => {
  const style = getRarityStyle(item.rarity);
  const displayRarity = getRarityDisplayName(item.rarity);
  const lowestSell = sellOrders.length > 0 ? Math.min(...sellOrders.map(o => o.pricePerUnit)) : null;
  const highestBuy = buyOrders.length > 0 ? Math.max(...buyOrders.map(o => o.pricePerUnit)) : null;
  const totalSellQty = sellOrders.reduce((sum, o) => sum + o.quantity, 0);
  const totalBuyQty = buyOrders.reduce((sum, o) => sum + o.quantity, 0);
  
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 cursor-pointer transition-all border-b border-white/5 ${
        isSelected 
          ? `bg-gradient-to-r from-amber-900/30 to-amber-800/20 border-l-4 border-l-amber-500`
          : 'hover:bg-white/5'
      }`}
    >
      {/* Icon */}
      <div className={`w-12 h-12 rounded-lg border-2 ${style.border} ${style.bg} flex items-center justify-center overflow-hidden`}>
        {item.icon ? (
          <img src={item.icon} alt={item.name} className="w-10 h-10 object-contain" />
        ) : (
          <Package size={20} className={style.text} />
        )}
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-bold text-sm truncate ${style.text}`}>{item.name}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <span className={`px-1.5 py-0.5 rounded ${style.bg} ${style.text} font-bold`}>T{item.tier}</span>
          <span className="capitalize">{item.category}</span>
        </div>
      </div>
      
      {/* Sell Price */}
      <div className="text-right w-20">
        <div className="flex items-center justify-end gap-1 text-[10px] text-gray-500">
          <TrendingDown size={10} className="text-red-400" />
          Sell
        </div>
        {lowestSell ? (
          <>
            <div className="flex items-center justify-end gap-1">
              <SpiritStoneIcon size="xs" />
              <span className="text-cyan-400 font-bold text-sm">{lowestSell.toLocaleString()}</span>
            </div>
            <span className="text-[9px] text-gray-600">{totalSellQty} avail</span>
          </>
        ) : (
          <span className="text-gray-600 text-[10px]">—</span>
        )}
      </div>
      
      {/* Buy Price */}
      <div className="text-right w-20">
        <div className="flex items-center justify-end gap-1 text-[10px] text-gray-500">
          <TrendingUp size={10} className="text-green-400" />
          Buy
        </div>
        {highestBuy ? (
          <>
            <div className="flex items-center justify-end gap-1">
              <SpiritStoneIcon size="xs" />
              <span className="text-amber-400 font-bold text-sm">{highestBuy.toLocaleString()}</span>
            </div>
            <span className="text-[9px] text-gray-600">{totalBuyQty} wanted</span>
          </>
        ) : (
          <span className="text-gray-600 text-[10px]">—</span>
        )}
      </div>
    </div>
  );
};

// Order Row
const OrderRow: React.FC<{
  order: MarketOrder;
  isBuyOrder: boolean;
  onAction: () => void;
}> = ({ order, isBuyOrder, onAction }) => {
  const formatTime = (date: Date) => {
    const hours = Math.floor((date.getTime() - Date.now()) / 3600000);
    if (hours < 0) return 'Expired';
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-black/30 rounded-xl border border-white/5 hover:border-white/10 transition-all">
      <div className="flex-1">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <User size={12} />
          <span className="font-medium">{order.playerName}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
          <Clock size={10} />
          <span>Expires in {formatTime(order.expiresAt)}</span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-gray-400 text-xs">x{order.quantity}</div>
        <div className="flex items-center gap-1">
          <SpiritStoneIcon size="xs" />
          <span className="text-cyan-400 font-bold">{order.pricePerUnit.toLocaleString()}</span>
          <span className="text-gray-500 text-[10px]">/each</span>
        </div>
      </div>
      <button
        onClick={onAction}
        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
          isBuyOrder 
            ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white'
            : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
        }`}
      >
        {isBuyOrder ? 'Sell' : 'Buy'}
      </button>
    </div>
  );
};

// Create Order Modal
const CreateOrderModal: React.FC<{
  item: MarketItemData;
  orderType: 'buy' | 'sell';
  onClose: () => void;
  onSubmit: (price: number, quantity: number) => void;
}> = ({ item, orderType, onClose, onSubmit }) => {
  const [price, setPrice] = useState(100);
  const [quantity, setQuantity] = useState(1);
  const style = getRarityStyle(item.rarity);
  const displayRarity = getRarityDisplayName(item.rarity);
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-[450px] bg-gradient-to-br from-[#1a1f2e] to-[#151820] border-2 border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-amber-900/40 to-amber-800/20 border-b border-amber-500/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-amber-400">
              {orderType === 'buy' ? 'Place Buy Order' : 'Place Sell Order'}
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
              <X size={18} className="text-gray-400" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Item Preview */}
          <div className="flex items-center gap-4 p-4 bg-black/30 rounded-xl border border-white/10">
            <div className={`w-14 h-14 rounded-lg border-2 ${style.border} ${style.bg} flex items-center justify-center`}>
              {item.icon ? (
                <img src={item.icon} alt={item.name} className="w-12 h-12 object-contain" />
              ) : (
                <Package size={24} className={style.text} />
              )}
            </div>
            <div>
              <div className={`font-bold ${style.text}`}>{item.name}</div>
              <div className="text-xs text-gray-500">Tier {item.tier} • {item.rarity}</div>
            </div>
          </div>
          
          {/* Price Input */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Price per unit</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2"><SpiritStoneIcon size="sm" /></div>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
          
          {/* Quantity Input */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Quantity</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 bg-gray-800 border border-gray-700 rounded-lg hover:border-amber-500 transition-colors"
              >
                <span className="text-xl text-gray-400">−</span>
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white font-bold text-center focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 bg-gray-800 border border-gray-700 rounded-lg hover:border-amber-500 transition-colors"
              >
                <span className="text-xl text-gray-400">+</span>
              </button>
            </div>
          </div>
          
          {/* Total */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-900/30 to-cyan-800/20 rounded-xl border border-cyan-500/30">
            <span className="text-gray-400">Total Cost</span>
            <div className="flex items-center gap-2">
              <SpiritStoneIcon size="md" />
              <span className="text-2xl font-bold text-cyan-400">{(price * quantity).toLocaleString()}</span>
            </div>
          </div>
          
          {/* Submit */}
          <button
            onClick={() => onSubmit(price, quantity)}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              orderType === 'buy'
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-500/20'
            }`}
          >
            {orderType === 'buy' ? 'Place Buy Order' : 'Place Sell Order'}
          </button>
          
          <p className="text-center text-[10px] text-gray-500">5% market fee on completed transactions</p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
interface MarketViewProps {
  playerGold: number;
  playerId?: string;
  playerName?: string;
  onBuy?: (order: MarketOrder) => void;
  onSell?: (order: MarketOrder) => void;
}

export const MarketView: React.FC<MarketViewProps> = ({
  playerGold,
  playerId,
  playerName,
  onBuy,
  onSell,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory>('all');
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [selectedRarity, setSelectedRarity] = useState<ItemRarity | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<MarketItemData | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'tier' | 'price'>('tier');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [activeOrderTab, setActiveOrderTab] = useState<'sell' | 'buy'>('sell');
  const [showHistory, setShowHistory] = useState(false);
  const [createOrderModal, setCreateOrderModal] = useState<{ item: MarketItemData; type: 'buy' | 'sell' } | null>(null);
  
  // Build items and orders
  const marketItems = useMemo(() => buildMarketItems(), []);
  const allOrders = useMemo(() => generateMockOrders(marketItems), [marketItems]);
  
  // Filter items
  const filteredItems = useMemo(() => {
    let result = [...marketItems];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => item.name.toLowerCase().includes(q));
    }
    
    if (selectedCategory !== 'all') {
      const catMap: Record<string, string[]> = {
        weapons: ['weapon'],
        accessories: ['accessory'],
        materials: ['material'],
      };
      result = result.filter(item => catMap[selectedCategory]?.includes(item.category));
    }
    
    if (selectedTier !== null) {
      result = result.filter(item => item.tier === selectedTier);
    }
    
    // Rarity filter
    if (selectedRarity !== 'all') {
      result = result.filter(item => getNormalizedRarity(item.rarity) === selectedRarity);
    }
    
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'tier') cmp = a.tier - b.tier;
      else {
        const sellA = allOrders.filter(o => o.itemId === a.id && o.type === 'sell');
        const sellB = allOrders.filter(o => o.itemId === b.id && o.type === 'sell');
        const priceA = sellA.length > 0 ? Math.min(...sellA.map(o => o.pricePerUnit)) : Infinity;
        const priceB = sellB.length > 0 ? Math.min(...sellB.map(o => o.pricePerUnit)) : Infinity;
        cmp = priceA - priceB;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    
    return result;
  }, [marketItems, searchQuery, selectedCategory, selectedTier, selectedRarity, sortBy, sortDir, allOrders]);
  
  // Get orders for selected item
  const selectedItemOrders = useMemo(() => {
    if (!selectedItem) return { sell: [], buy: [] };
    return {
      sell: allOrders.filter(o => o.itemId === selectedItem.id && o.type === 'sell').sort((a, b) => a.pricePerUnit - b.pricePerUnit),
      buy: allOrders.filter(o => o.itemId === selectedItem.id && o.type === 'buy').sort((a, b) => b.pricePerUnit - a.pricePerUnit),
    };
  }, [selectedItem, allOrders]);
  
  // Price history for selected item
  const priceHistory = useMemo(() => {
    if (!selectedItem) return [];
    const basePrice = selectedItem.tier * (selectedItem.category === 'weapon' ? 800 : 300);
    return generatePriceHistory(selectedItem.id, basePrice);
  }, [selectedItem]);
  
  const categories: { id: MarketCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Items', icon: <Package size={16} /> },
    { id: 'weapons', label: 'Weapons', icon: <Sword size={16} /> },
    { id: 'accessories', label: 'Accessories', icon: <CircleDot size={16} /> },
    { id: 'materials', label: 'Materials', icon: <Sparkles size={16} /> },
  ];
  
  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-[#0a0d14] via-[#0f1218] to-[#0a0d14] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-900/30 via-amber-800/15 to-amber-900/30 border-b-2 border-amber-500/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30 flex items-center justify-center">
              <ShoppingCart size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500">
                Celestial Trading Post
              </h1>
              <p className="text-sm text-amber-200/60">Buy & sell orders • Real-time prices • Trade history</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Stats */}
            <div className="flex items-center gap-6 px-6 py-3 bg-black/40 rounded-xl border border-white/10">
              <div className="text-center">
                <div className="text-lg font-bold text-white">{filteredItems.length}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">Items</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-lg font-bold text-red-400">{allOrders.filter(o => o.type === 'sell').length}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">Sell Orders</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-lg font-bold text-green-400">{allOrders.filter(o => o.type === 'buy').length}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">Buy Orders</div>
              </div>
            </div>
            
            {/* Balance */}
            <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-cyan-900/40 to-cyan-800/20 border border-cyan-500/40 rounded-xl">
              <SpiritStoneIcon size="md" />
              <div>
                <div className="font-bold text-cyan-300 text-xl">{playerGold.toLocaleString()}</div>
                <div className="text-[10px] text-cyan-500">Spirit Stones</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters Bar */}
      <div className="flex items-center gap-3 px-6 py-3 bg-black/30 border-b border-white/5">
        {/* Categories */}
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setSelectedCategory(cat.id); setSelectedItem(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              selectedCategory === cat.id
                ? 'bg-amber-600/30 text-amber-400 border border-amber-500/50'
                : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:text-white'
            }`}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
        
        <div className="w-px h-8 bg-white/10 mx-2" />
        
        {/* Tier Filter */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4].map(tier => (
            <button
              key={tier}
              onClick={() => setSelectedTier(selectedTier === tier ? null : tier)}
              className={`w-9 h-9 rounded-lg font-bold text-sm transition-all ${
                selectedTier === tier
                  ? 'bg-purple-600/40 text-purple-300 border border-purple-500/50'
                  : 'bg-gray-800/50 text-gray-500 border border-gray-700/50 hover:text-white'
              }`}
            >
              T{tier}
            </button>
          ))}
        </div>
        
        <div className="w-px h-8 bg-white/10 mx-2" />
        
        {/* Rarity Filter */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setSelectedRarity('all'); setSelectedItem(null); }}
            className={`px-2 py-1.5 rounded-lg font-bold text-xs transition-all ${
              selectedRarity === 'all'
                ? 'bg-gray-600/40 text-white border border-gray-500/50'
                : 'bg-gray-800/50 text-gray-500 border border-gray-700/50 hover:text-white'
            }`}
          >
            All
          </button>
          {(['Mortal', 'Earth', 'Heaven', 'Spirit', 'Immortal'] as ItemRarity[]).map(rarity => {
            const style = getRarityStyle(rarity);
            const config = RARITY_CONFIG[rarity];
            return (
              <button
                key={rarity}
                onClick={() => { setSelectedRarity(rarity); setSelectedItem(null); }}
                className={`px-2 py-1.5 rounded-lg font-bold text-xs transition-all ${
                  selectedRarity === rarity
                    ? `${style.bg} ${style.text} border ${style.border}`
                    : `${style.text} opacity-50 hover:opacity-100 border border-transparent`
                }`}
              >
                {config.displayName.replace(' Grade', '')}
              </button>
            );
          })}
        </div>
        
        <div className="flex-1" />
        
        {/* Search */}
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSelectedItem(null); }}
            placeholder="Search items..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800/80 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        
        {/* Sort */}
        <select
          value={`${sortBy}-${sortDir}`}
          onChange={(e) => {
            const [field, dir] = e.target.value.split('-');
            setSortBy(field as any);
            setSortDir(dir as any);
          }}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-amber-500"
        >
          <option value="tier-asc">Tier ↑</option>
          <option value="tier-desc">Tier ↓</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="price-asc">Price ↑</option>
          <option value="price-desc">Price ↓</option>
        </select>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Item List */}
        <div className="w-[450px] border-r border-white/5 flex flex-col bg-black/20">
          <div className="flex-1 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <Package size={48} className="mb-4 opacity-30" />
                <p>No items found</p>
              </div>
            ) : (
              filteredItems.map(item => (
                <ItemListCard
                  key={item.id}
                  item={item}
                  sellOrders={allOrders.filter(o => o.itemId === item.id && o.type === 'sell')}
                  buyOrders={allOrders.filter(o => o.itemId === item.id && o.type === 'buy')}
                  isSelected={selectedItem?.id === item.id}
                  onClick={() => setSelectedItem(item)}
                />
              ))
            )}
          </div>
        </div>
        
        {/* Right Panel - Order Details */}
        <div className="flex-1 flex flex-col">
          {selectedItem ? (
            (() => {
              const selectedStyle = getRarityStyle(selectedItem.rarity);
              const selectedDisplayRarity = getRarityDisplayName(selectedItem.rarity);
              const isImmortal = getNormalizedRarity(selectedItem.rarity) === 'Immortal';
              
              return (
            <>
              {/* Item Header */}
              <div className="px-6 py-5 border-b border-white/5 bg-gradient-to-r from-black/40 to-transparent">
                <div className="flex items-start gap-5">
                  <div className={`w-20 h-20 rounded-xl border-2 ${selectedStyle.border} ${selectedStyle.bg} flex items-center justify-center shadow-lg ${selectedStyle.glow}`}>
                    {selectedItem.icon ? (
                      <img src={selectedItem.icon} alt={selectedItem.name} className="w-16 h-16 object-contain" />
                    ) : (
                      <Package size={32} className={selectedStyle.text} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className={`text-2xl font-bold ${selectedStyle.text}`}>
                        {selectedItem.name}
                      </h2>
                      {isImmortal && <Sparkles size={20} className="text-amber-400" />}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${selectedStyle.bg} ${selectedStyle.text}`}>
                        {selectedDisplayRarity}
                      </span>
                      <span className="text-xs text-gray-400">Tier {selectedItem.tier}</span>
                      <span className="text-xs text-gray-400 capitalize">{selectedItem.category}</span>
                    </div>
                    {selectedItem.desc && (
                      <p className="text-sm text-gray-500 mt-2 italic">{selectedItem.desc}</p>
                    )}
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        showHistory ? 'bg-purple-600/30 text-purple-400 border border-purple-500/50' : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:text-white'
                      }`}
                    >
                      <BarChart3 size={14} />
                      History
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Price History Panel (collapsible) */}
              {showHistory && (
                <div className="px-6 py-4 border-b border-white/5 bg-black/30">
                  <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                    <History size={14} />
                    30-Day Price History
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">Avg Price</div>
                      <div className="text-lg font-bold text-cyan-400 flex items-center gap-1">
                        <SpiritStoneIcon size="xs" />
                        {Math.floor(priceHistory.reduce((s, h) => s + h.avgPrice, 0) / priceHistory.length).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">Total Volume</div>
                      <div className="text-lg font-bold text-green-400">
                        {priceHistory.reduce((s, h) => s + h.volume, 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">Price Trend</div>
                      <div className="text-lg font-bold text-amber-400 flex items-center gap-1">
                        <TrendingUp size={14} />
                        Stable
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Order Tabs */}
              <div className="flex items-center gap-3 px-6 py-3 border-b border-white/5">
                <button
                  onClick={() => setActiveOrderTab('sell')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all ${
                    activeOrderTab === 'sell'
                      ? 'bg-red-600/30 text-red-400 border border-red-500/50'
                      : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:text-white'
                  }`}
                >
                  <TrendingDown size={16} />
                  Sell Orders ({selectedItemOrders.sell.length})
                </button>
                <button
                  onClick={() => setActiveOrderTab('buy')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all ${
                    activeOrderTab === 'buy'
                      ? 'bg-green-600/30 text-green-400 border border-green-500/50'
                      : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:text-white'
                  }`}
                >
                  <TrendingUp size={16} />
                  Buy Orders ({selectedItemOrders.buy.length})
                </button>
              </div>
              
              {/* Orders List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {activeOrderTab === 'sell' ? (
                  selectedItemOrders.sell.length > 0 ? (
                    <>
                      <div className="text-xs text-gray-500 mb-3 flex items-center gap-2 px-2">
                        <TrendingDown size={12} className="text-red-400" />
                        Players selling this item — Buy instantly at listed price
                      </div>
                      {selectedItemOrders.sell.map(order => (
                        <OrderRow key={order.id} order={order} isBuyOrder={false} onAction={() => onBuy?.(order)} />
                      ))}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                      <TrendingDown size={40} className="mb-3 opacity-30" />
                      <p>No sell orders</p>
                      <p className="text-xs mt-1">Be the first to sell this item!</p>
                    </div>
                  )
                ) : (
                  selectedItemOrders.buy.length > 0 ? (
                    <>
                      <div className="text-xs text-gray-500 mb-3 flex items-center gap-2 px-2">
                        <TrendingUp size={12} className="text-green-400" />
                        Players buying this item — Sell instantly at listed price
                      </div>
                      {selectedItemOrders.buy.map(order => (
                        <OrderRow key={order.id} order={order} isBuyOrder={true} onAction={() => onSell?.(order)} />
                      ))}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                      <TrendingUp size={40} className="mb-3 opacity-30" />
                      <p>No buy orders</p>
                      <p className="text-xs mt-1">Place a buy order for this item!</p>
                    </div>
                  )
                )}
              </div>
              
              {/* Action Footer */}
              <div className="px-6 py-4 border-t border-white/5 bg-black/30">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCreateOrderModal({ item: selectedItem, type: 'buy' })}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <Plus size={18} />
                    Place Buy Order
                  </button>
                  <button
                    onClick={() => setCreateOrderModal({ item: selectedItem, type: 'sell' })}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-500/20"
                  >
                    <Tag size={18} />
                    Place Sell Order
                  </button>
                </div>
              </div>
            </>
              );
            })()
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <ShoppingCart size={80} className="mb-6 opacity-15" />
              <p className="text-xl font-medium">Select an item</p>
              <p className="text-sm mt-2">Click on an item to view orders and trade</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Create Order Modal */}
      {createOrderModal && (
        <CreateOrderModal
          item={createOrderModal.item}
          orderType={createOrderModal.type}
          onClose={() => setCreateOrderModal(null)}
          onSubmit={(price, quantity) => {
            // Here you would create the order
            console.log('Creating order:', { item: createOrderModal.item, type: createOrderModal.type, price, quantity });
            setCreateOrderModal(null);
          }}
        />
      )}
    </div>
  );
};

export default MarketView;
