import React, { useState } from 'react';
import { Package, Search, Filter, Gem, Scroll, Sparkles, Hammer, Coins, Landmark, ArrowLeftRight, Lock, Trash2, ShoppingBag, Minus, Plus, Check, X, ScrollText, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { ItemIcon, SpiritStoneIcon } from '../ItemIcon';
import { uiFrameIcons } from '../../utils/iconSystem';
import { ResourceIcon } from '../ui/GameIcon';

interface InventoryPageProps {
  inventory: any[];
  bank?: any[];
  spiritStones: number;
  contribution: number;
  getItemById: (id: string) => any;
  getIcon: (type: string) => React.ReactNode;
  onEquip: (item: any) => void;
  onReforge: (item: any) => void;
  setHoverItem: (item: any) => void;
  setMousePos: (pos: {x: number, y: number}) => void;
  onDepositToBank?: (item: any, quantity?: number) => void;
  onWithdrawFromBank?: (item: any, quantity?: number) => void;
  onSellJunk?: (item: any) => void;
  onSellAllJunk?: () => void;
  onStackInventory?: () => number; // Returns number of stacks consolidated
  activeQuests?: any[]; // For quest item context
}

export const InventoryPage: React.FC<InventoryPageProps> = ({
  inventory = [],
  bank = [],
  spiritStones = 0,
  contribution = 0,
  getItemById,
  getIcon,
  onEquip,
  onReforge,
  setHoverItem,
  setMousePos,
  onDepositToBank,
  onWithdrawFromBank,
  onSellJunk,
  onSellAllJunk,
  onStackInventory,
  activeQuests = [],
}) => {
  const [inventoryTab, setInventoryTab] = useState(0);
  const [filter, setFilter] = useState<'all' | 'gear' | 'material' | 'junk' | 'consumable' | 'quest'>('all');
  const [viewMode, setViewMode] = useState<'inventory' | 'bank' | 'vendor' | 'quest'>('inventory');
  
  // Quantity selector for bank transfers
  const [quantitySelector, setQuantitySelector] = useState<{item: any, quantity: number, max: number, mode: 'deposit' | 'withdraw'} | null>(null);
  
  // Check if item is gear (weapon, ring, necklace - no armor in first release)
  const isGear = (item: any) => ['gear', 'weapon', 'ring', 'necklace'].includes(item.type);
  
  const filteredInventory = inventory.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'gear') return isGear(item);
    return item.type === filter;
  });
  
  const gearItems = inventory.filter(i => isGear(i));
  const materialItems = inventory.filter(i => i.type === 'material');
  const junkItems = inventory.filter(i => i.type === 'junk');
  const consumableItems = inventory.filter(i => i.type === 'consumable');
  const questItems = inventory.filter(i => i.type === 'quest' || i.isQuestItem);
  const totalJunkValue = junkItems.reduce((sum, item) => sum + (item.sellValue || 0) * (item.count || 1), 0);
  
  // Combine materials from inventory and bank for display
  const bankMaterials = (bank || []).filter(i => i.type === 'material');
  const allMaterials = [...materialItems, ...bankMaterials].reduce((acc, item) => {
    const key = item.id || item.iconType;
    if (acc[key]) {
      acc[key].count += item.count || 1;
      acc[key].inBank = acc[key].inBank || bankMaterials.some(b => (b.id || b.iconType) === key);
    } else {
      acc[key] = { 
        ...item, 
        count: item.count || 1, 
        inBank: bankMaterials.some(b => (b.id || b.iconType) === key),
        inInventory: materialItems.some(m => (m.id || m.iconType) === key)
      };
    }
    return acc;
  }, {} as Record<string, any>);
  const combinedMaterials = Object.values(allMaterials);
  
  // Handle quantity transfer
  const handleQuantityTransfer = () => {
    if (!quantitySelector) return;
    const { item, quantity, mode } = quantitySelector;
    if (mode === 'deposit' && onDepositToBank) {
      onDepositToBank(item, quantity);
    } else if (mode === 'withdraw' && onWithdrawFromBank) {
      onWithdrawFromBank(item, quantity);
    }
    setQuantitySelector(null);
  };
  
  // Open quantity selector for stackable items
  const openQuantitySelector = (item: any, mode: 'deposit' | 'withdraw') => {
    const max = item.count || 1;
    if (max === 1) {
      // Single item, transfer directly
      if (mode === 'deposit' && onDepositToBank) onDepositToBank(item, 1);
      else if (mode === 'withdraw' && onWithdrawFromBank) onWithdrawFromBank(item, 1);
    } else {
      // Multiple items, show selector
      setQuantitySelector({ item, quantity: max, max, mode });
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-auto">
      {/* LEFT: Resources & Filters */}
      <aside className="w-full md:w-56 lg:w-64 bg-[#0a0c10] border-b md:border-b-0 md:border-r border-[#2a2f3a] p-3 md:p-4 flex flex-col gap-3 md:gap-4 overflow-visible md:overflow-y-auto flex-shrink-0">
        {/* Wealth - Horizontal on Mobile */}
        <div>
          <div className="flex items-center gap-2 border-b border-[#2a2f3a] pb-2 mb-2 md:mb-3">
            <Coins size={14} className="text-amber-500" />
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Wealth</h3>
          </div>
          <div className="flex md:flex-col gap-2 md:space-y-2">
            <div className="flex items-center gap-2 md:gap-3 bg-[#151820] p-2 md:p-3 rounded-lg border border-white/5 flex-1">
              <SpiritStoneIcon size="md" />
              <div>
                <div className="text-[9px] md:text-[10px] text-gray-500">Spirit Stones</div>
                <div className="text-sm md:text-lg font-bold text-cyan-400">{spiritStones.toLocaleString()}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3 bg-[#151820] p-2 md:p-3 rounded-lg border border-white/5 flex-1">
              <Scroll size={16} className="text-purple-400" />
              <div>
                <div className="text-[9px] md:text-[10px] text-gray-500">Contribution</div>
                <div className="text-sm md:text-lg font-bold text-purple-400">{contribution.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters - Horizontal scroll on mobile */}
        <div>
          <div className="border-b border-[#2a2f3a] pb-2 mb-2 md:mb-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Filters</h3>
          </div>
          <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible scrollbar-hide pb-1 md:pb-0 md:space-y-1">
            <button 
              onClick={() => setFilter('all')} 
              className={`whitespace-nowrap text-left px-2 md:px-3 py-1.5 md:py-2 rounded text-xs md:text-sm flex-shrink-0 md:w-full ${filter === 'all' ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}
            >
              All ({inventory.length})
            </button>
            <button 
              onClick={() => setFilter('gear')} 
              className={`whitespace-nowrap text-left px-2 md:px-3 py-1.5 md:py-2 rounded text-xs md:text-sm flex-shrink-0 md:w-full ${filter === 'gear' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}
            >
              Gear ({gearItems.length})
            </button>
            <button 
              onClick={() => setFilter('material')} 
              className={`whitespace-nowrap text-left px-2 md:px-3 py-1.5 md:py-2 rounded text-xs md:text-sm flex-shrink-0 md:w-full ${filter === 'material' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}
            >
              Materials ({materialItems.length})
            </button>
            <button 
              onClick={() => setFilter('junk')} 
              className={`whitespace-nowrap text-left px-2 md:px-3 py-1.5 md:py-2 rounded text-xs md:text-sm flex-shrink-0 md:w-full ${filter === 'junk' ? 'bg-gray-600/20 text-gray-300 border border-gray-500/30' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}
            >
              Junk ({junkItems.length})
            </button>
            <button 
              onClick={() => setFilter('quest')} 
              className={`whitespace-nowrap text-left px-2 md:px-3 py-1.5 md:py-2 rounded text-xs md:text-sm flex-shrink-0 md:w-full ${filter === 'quest' ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}
            >
              <span className="flex items-center gap-1 md:gap-2">
                <ScrollText size={12} className="text-amber-500" />
                Quest ({questItems.length})
              </span>
            </button>
          </div>
        </div>

        {/* Vendor Section - Sell Junk */}
        <div className="mt-4">
          <div className="border-b border-[#2a2f3a] pb-2 mb-3">
            <h3 className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
              <ShoppingBag size={14} className="text-green-500" /> Vendor
            </h3>
          </div>
          <button 
            onClick={() => setViewMode('vendor')}
            className={`w-full py-3 rounded-lg border transition-all ${viewMode === 'vendor' ? 'bg-green-600/30 border-green-500/50 text-green-400' : 'bg-green-900/10 border-green-500/20 text-green-400/70 hover:bg-green-900/20'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <ShoppingBag size={16} />
              <span className="font-bold">Open Vendor</span>
            </div>
            {junkItems.length > 0 && (
              <div className="text-[10px] mt-1 text-green-300 flex items-center justify-center gap-1">
                {junkItems.length} items • {totalJunkValue.toLocaleString()} <ResourceIcon type="spiritStone" size={10} />
              </div>
            )}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mt-auto">
          <div className="bg-amber-900/20 border border-amber-500/20 rounded-lg p-3">
            <p className="text-[10px] text-amber-400 mb-2 font-bold uppercase">How to Use</p>
            <div className="space-y-1.5">
              <p className="text-[9px] text-gray-400">• <span className="text-green-400">Left-Click</span> gear → Equip</p>
              <p className="text-[9px] text-gray-400">• <span className="text-blue-400">Right-Click</span> → Bank/Reforge</p>
              <p className="text-[9px] text-gray-400">• <span className="text-amber-400">Vendor Tab</span> → Sell junk</p>
              <p className="text-[9px] text-gray-400">• <span className="text-purple-400">Consumables</span> → Use in combat</p>
            </div>
          </div>
        </div>
      </aside>

      {/* CENTER: Inventory/Bank Grid */}
      <main className="flex-1 flex flex-col p-3 md:p-6 overflow-y-auto">
        <div className="flex flex-wrap justify-between items-center border-b border-[#2a2f3a] pb-3 md:pb-4 mb-3 md:mb-4 gap-2">
          <div className="flex items-center gap-1 md:gap-4 overflow-x-auto scrollbar-hide">
            <button 
              onClick={() => setViewMode('inventory')}
              className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-lg transition-all flex-shrink-0 ${viewMode === 'inventory' ? 'bg-green-600/20 border border-green-500/30' : 'text-gray-500 hover:text-white'}`}
            >
              <Package size={16} className={viewMode === 'inventory' ? 'text-green-400' : 'text-gray-500'} />
              <span className={`font-serif font-bold text-xs md:text-sm ${viewMode === 'inventory' ? 'text-green-400' : 'text-gray-500'}`}>Inventory</span>
            </button>
            <button 
              onClick={() => setViewMode('bank')}
              className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-lg transition-all flex-shrink-0 ${viewMode === 'bank' ? 'bg-amber-600/20 border border-amber-500/30' : 'text-gray-500 hover:text-white'}`}
            >
              <Landmark size={16} className={viewMode === 'bank' ? 'text-amber-400' : 'text-gray-500'} />
              <span className={`font-serif font-bold text-xs md:text-sm ${viewMode === 'bank' ? 'text-amber-400' : 'text-gray-500'}`}>Vault</span>
            </button>
            <button 
              onClick={() => setViewMode('vendor')}
              className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-lg transition-all flex-shrink-0 ${viewMode === 'vendor' ? 'bg-green-600/20 border border-green-500/30' : 'text-gray-500 hover:text-white'}`}
            >
              <ShoppingBag size={16} className={viewMode === 'vendor' ? 'text-green-400' : 'text-gray-500'} />
              <span className={`font-serif font-bold text-xs md:text-sm ${viewMode === 'vendor' ? 'text-green-400' : 'text-gray-500'}`}>Sell</span>
              {junkItems.length > 0 && (
                <span className="px-1.5 md:px-2 py-0.5 bg-green-500/20 rounded-full text-[8px] md:text-[10px] text-green-400">{junkItems.length}</span>
              )}
            </button>
            <button 
              onClick={() => setViewMode('quest')}
              className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-lg transition-all flex-shrink-0 ${viewMode === 'quest' ? 'bg-amber-600/20 border border-amber-500/30' : 'text-gray-500 hover:text-white'}`}
            >
              <ScrollText size={16} className={viewMode === 'quest' ? 'text-amber-400' : 'text-gray-500'} />
              <span className={`font-serif font-bold ${viewMode === 'quest' ? 'text-amber-400' : 'text-gray-500'}`}>Quest Items</span>
              {questItems.length > 0 && (
                <span className="px-2 py-0.5 bg-amber-500/20 rounded-full text-[10px] text-amber-400">{questItems.length}</span>
              )}
            </button>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            {viewMode === 'inventory' && (
              <>{filteredInventory.length} / 96 items</>
            )}
            {viewMode === 'bank' && (
              <>{bank.length} / 100 slots</>
            )}
            {viewMode === 'vendor' && (
              <>{junkItems.length} junk items</>
            )}
            {viewMode === 'quest' && (
              <>{questItems.length} quest items</>
            )}
          </div>
        </div>

        {/* INVENTORY VIEW */}
        {viewMode === 'inventory' && (
          <>
            {/* Tab Buttons + Stack All */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                {[0, 1, 2].map(tab => (
                  <button 
                    key={tab} 
                    onClick={() => setInventoryTab(tab)} 
                    className={`px-4 py-2 text-sm font-bold uppercase rounded ${inventoryTab === tab ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30' : 'text-gray-500 hover:text-gray-300 border border-transparent'}`}
                  >
                    Tab {['I', 'II', 'III'][tab]}
                  </button>
                ))}
              </div>
              
              {/* Stack All Button */}
              {onStackInventory && (
                <button
                  onClick={() => {
                    const stacked = onStackInventory();
                    // Visual feedback handled by parent component
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/30 to-purple-800/30 hover:from-purple-600/50 hover:to-purple-800/50 border border-purple-500/40 rounded-lg text-purple-300 font-bold text-sm transition-all hover:shadow-lg hover:shadow-purple-500/20"
                  title="Consolidate all stackable items (materials, consumables, junk)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                    <path d="M14 14h7v7h-7z" opacity="0.5"/>
                    <path d="M17.5 14v7M14 17.5h7"/>
                  </svg>
                  Stack All
                </button>
              )}
            </div>

            {/* Inventory Grid */}
            <div className="grid grid-cols-8 gap-3 flex-1 content-start">
              {filteredInventory.slice(inventoryTab * 32, (inventoryTab + 1) * 32).map(item => {
                const isGearItem = isGear(item);
                const dbItem = isGearItem ? getItemById(item.itemId) : null;
                const displayItem = dbItem ? { ...dbItem, ...item } : item;
                
                return (
                  <div 
                    key={item.id} 
                    onClick={() => {
                      if (isGearItem) onEquip(item);
                      else if (item.type === 'junk' && onSellJunk) onSellJunk(item);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (onDepositToBank && (item.count || 1) > 1) {
                        openQuantitySelector(item, 'deposit');
                      } else if (onDepositToBank) {
                        onDepositToBank(item, 1);
                      } else if (isGearItem && item.rarity !== 'Legendary') {
                        onReforge(displayItem);
                      }
                    }}
                    onMouseEnter={(e) => { setHoverItem(displayItem); setMousePos({ x: e.clientX, y: e.clientY }); }}
                    onMouseMove={(e) => { setMousePos({ x: e.clientX, y: e.clientY }); }}
                    onMouseLeave={() => { setHoverItem(null); }}
                    className={`relative group aspect-square cursor-pointer flex items-center justify-center`}
                    style={{
                      backgroundImage: `url(${uiFrameIcons.inventorySlot})`,
                      backgroundSize: '100% 100%',
                    }}
                  >
                    <div className={`absolute inset-1 rounded flex items-center justify-center ${
                      item.rarity === 'Legendary' ? 'ring-1 ring-yellow-500/50' :
                      item.rarity === 'Epic' ? 'ring-1 ring-purple-500/50' :
                      item.rarity === 'Rare' ? 'ring-1 ring-blue-500/50' :
                      item.rarity === 'Uncommon' ? 'ring-1 ring-green-500/50' : ''
                    }`}>
                      <ItemIcon item={displayItem || item} size="lg" />
                    </div>
                    <span className="absolute bottom-1 right-1 text-[9px] font-bold text-gray-500">{item.count > 1 ? item.count : ''}</span>
                    {isGearItem && item.rarity !== 'Legendary' && (
                      <div className="absolute top-1 right-1 text-purple-400 opacity-0 group-hover:opacity-100">
                        <Sparkles size={10} />
                      </div>
                    )}
                    {/* Equip indicator for gear */}
                    {isGearItem && (
                      <div className="absolute bottom-1 left-1 text-green-400 opacity-0 group-hover:opacity-100 text-[8px] font-bold">
                        EQUIP
                      </div>
                    )}
                    {/* Sell indicator for junk */}
                    {item.type === 'junk' && (
                      <div className="absolute top-1 right-1 text-green-400 opacity-0 group-hover:opacity-100">
                        <Coins size={10} />
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Empty slots */}
              {[...Array(Math.max(0, 32 - filteredInventory.slice(inventoryTab * 32, (inventoryTab + 1) * 32).length))].map((_, i) => (
                <div key={`e-${i}`} className="aspect-square bg-[#0f1115] rounded-lg border border-transparent"></div>
              ))}
            </div>
          </>
        )}

        {/* BANK VIEW */}
        {viewMode === 'bank' && (
          <>
            {/* Bank Header */}
            <div className="bg-gradient-to-r from-amber-900/20 to-transparent p-4 rounded-lg border border-amber-500/20 mb-4">
              <div className="flex items-center gap-3">
                <Landmark className="text-amber-400" size={24} />
                <div>
                  <h3 className="text-amber-400 font-bold font-serif">Personal Vault Storage</h3>
                  <p className="text-xs text-gray-400">Safely store items. Right-click to withdraw.</p>
                </div>
              </div>
            </div>

            {/* Bank Grid - 100 slots (10x10) */}
            <div className="grid grid-cols-10 gap-2 flex-1 content-start">
              {bank.slice(0, 100).map((item, idx) => {
                const dbItem = item.type === 'gear' ? getItemById(item.itemId) : null;
                const displayItem = dbItem ? { ...dbItem, ...item } : item;
                const rarityColor = 
                  item.rarity === 'Legendary' ? 'border-yellow-500 bg-yellow-900/10' :
                  item.rarity === 'Epic' ? 'border-purple-500 bg-purple-900/10' :
                  item.rarity === 'Rare' ? 'border-blue-500 bg-blue-900/10' :
                  item.rarity === 'Uncommon' ? 'border-green-500 bg-green-900/10' :
                  'border-gray-600 bg-gray-900/10';
                
                return (
                  <div 
                    key={item.id || idx}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (onWithdrawFromBank && (item.count || 1) > 1) {
                        openQuantitySelector(item, 'withdraw');
                      } else if (onWithdrawFromBank) {
                        onWithdrawFromBank(item, 1);
                      }
                    }}
                    onMouseEnter={(e) => { setHoverItem(displayItem); setMousePos({ x: e.clientX, y: e.clientY }); }}
                    onMouseMove={(e) => { setMousePos({ x: e.clientX, y: e.clientY }); }}
                    onMouseLeave={() => { setHoverItem(null); }}
                    className={`relative group aspect-square bg-[#151820] border-2 ${rarityColor} rounded-lg hover:border-amber-500 cursor-pointer flex items-center justify-center`}
                  >
                    <ItemIcon item={displayItem || item} size="md" />
                    <span className="absolute bottom-0.5 right-0.5 text-[8px] font-bold text-gray-500">{item.count > 1 ? item.count : ''}</span>
                  </div>
                );
              })}
              {/* Empty bank slots */}
              {[...Array(Math.max(0, 100 - bank.length))].map((_, i) => (
                <div key={`be-${i}`} className="aspect-square bg-[#0a0c0e] rounded-lg border border-amber-900/20 flex items-center justify-center">
                  {i >= 50 && (
                    <Lock size={10} className="text-gray-700" />
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* VENDOR VIEW */}
        {viewMode === 'vendor' && (
          <>
            {/* Vendor Header */}
            <div className="bg-gradient-to-r from-green-900/30 to-transparent p-4 rounded-lg border border-green-500/20 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-900/30 rounded-full flex items-center justify-center border-2 border-green-500/30">
                    <ShoppingBag className="text-green-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-green-400 font-bold font-serif text-lg">Wandering Merchant</h3>
                    <p className="text-xs text-gray-400">"I'll take those trinkets off your hands, cultivator..."</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-500 uppercase">Your Spirit Stones</div>
                  <div className="text-xl font-bold text-cyan-400 flex items-center gap-1">{spiritStones.toLocaleString()} <ResourceIcon type="spiritStone" size={16} /></div>
                </div>
              </div>
            </div>

            {junkItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                  <Package className="text-gray-600" size={40} />
                </div>
                <h3 className="text-lg text-gray-400 font-serif mb-2">No Junk to Sell</h3>
                <p className="text-sm text-gray-500 max-w-md">
                  Defeat monsters to collect junk items. These can be sold here for Spirit Stones!
                </p>
              </div>
            ) : (
              <>
                {/* Sell All Button - Prominent */}
                <div className="bg-green-900/20 border-2 border-green-500/30 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm text-gray-400">Total Junk Items</div>
                      <div className="text-2xl font-bold text-white">{junkItems.length} items</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Total Value</div>
                      <div className="text-2xl font-bold text-green-400 flex items-center gap-1">{totalJunkValue.toLocaleString()} <ResourceIcon type="spiritStone" size={18} /></div>
                    </div>
                  </div>
                  <button 
                    onClick={onSellAllJunk}
                    className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-900/50"
                  >
                    <Coins size={20} />
                    Sell All Junk for {totalJunkValue.toLocaleString()} Spirit Stones
                  </button>
                </div>

                {/* Individual Junk Items Grid */}
                <div className="border-b border-[#2a2f3a] pb-2 mb-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Click individual items to sell
                  </h4>
                </div>
                <div className="grid grid-cols-4 gap-3 flex-1 content-start overflow-y-auto">
                  {junkItems.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => onSellJunk && onSellJunk(item)}
                      onMouseEnter={(e) => { setHoverItem(item); setMousePos({ x: e.clientX, y: e.clientY }); }}
                      onMouseMove={(e) => { setMousePos({ x: e.clientX, y: e.clientY }); }}
                      onMouseLeave={() => { setHoverItem(null); }}
                      className="relative group bg-[#151820] border-2 border-gray-600 hover:border-green-500 rounded-lg cursor-pointer p-3 transition-all hover:scale-[1.02] hover:bg-green-900/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-800/50 rounded-lg flex items-center justify-center shrink-0">
                          <ItemIcon item={item} size="lg" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-200 font-medium truncate">{item.name || item.iconType}</div>
                          <div className="text-[10px] text-gray-500">
                            {item.count > 1 && <span className="mr-1">x{item.count}</span>}
                            Junk
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold text-green-400 flex items-center gap-0.5">{(item.sellValue || 0) * (item.count || 1)}<ResourceIcon type="spiritStone" size={12} /></div>
                          <div className="text-[9px] text-gray-500">Sell</div>
                        </div>
                      </div>
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-green-500/10 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center pointer-events-none border-2 border-green-500/50">
                        <div className="bg-green-600 px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1">
                          <Coins size={12} /> Click to Sell
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* QUEST ITEMS VIEW */}
        {viewMode === 'quest' && (
          <>
            {/* Quest Items Header */}
            <div className="bg-gradient-to-r from-amber-900/30 to-transparent p-4 rounded-lg border border-amber-500/20 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-900/30 rounded-full flex items-center justify-center border-2 border-amber-500/30">
                  <ScrollText className="text-amber-400" size={24} />
                </div>
                <div>
                  <h3 className="text-amber-400 font-bold font-serif text-lg">Quest Items</h3>
                  <p className="text-xs text-gray-400">Items collected for quests. Cannot be sold or traded.</p>
                </div>
              </div>
            </div>

            {questItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                  <ScrollText className="text-gray-600" size={40} />
                </div>
                <h3 className="text-lg text-gray-400 font-serif mb-2">No Quest Items</h3>
                <p className="text-sm text-gray-500 max-w-md">
                  Accept quests and defeat the required monsters to collect quest items!
                </p>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto">
                {questItems.map((item) => {
                  // Find the related quest
                  const relatedQuest = activeQuests.find(q => 
                    q.objectives?.some((obj: any) => obj.itemId === item.id || obj.itemId === item.itemId)
                  );
                  const objective = relatedQuest?.objectives?.find((obj: any) => 
                    obj.itemId === item.id || obj.itemId === item.itemId
                  );
                  const requiredCount = objective?.count || 1;
                  const currentCount = item.count || 1;
                  const isComplete = currentCount >= requiredCount;
                  
                  return (
                    <div 
                      key={item.id}
                      className={`relative bg-[#151820] border-2 ${isComplete ? 'border-green-500/30' : 'border-amber-500/30'} rounded-lg p-4 transition-all hover:shadow-lg`}
                      onMouseEnter={(e) => { setHoverItem(item); setMousePos({x:e.clientX, y:e.clientY}); }}
                      onMouseLeave={() => setHoverItem(null)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`w-14 h-14 rounded-lg flex items-center justify-center shrink-0 ${
                          isComplete ? 'bg-green-900/30 border border-green-500/30' : 'bg-amber-900/30 border border-amber-500/30'
                        }`}>
                          <ItemIcon item={item} size="lg" />
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-lg font-bold text-amber-300">{item.name || item.iconType}</h4>
                            {isComplete && (
                              <span className="flex items-center gap-1 text-xs bg-green-600/30 text-green-400 px-2 py-0.5 rounded-full">
                                <CheckCircle2 size={12} />
                                Complete
                              </span>
                            )}
                          </div>
                          
                          {item.description && (
                            <p className="text-sm text-gray-400 mb-2 italic">"{item.description}"</p>
                          )}
                          
                          {/* Quest Progress */}
                          {relatedQuest && (
                            <div className="mt-2 bg-black/40 rounded-lg p-2 border border-amber-500/10">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-400">
                                  Quest: <span className="text-amber-400">{relatedQuest.title}</span>
                                </span>
                                <span className={`text-xs font-bold ${isComplete ? 'text-green-400' : 'text-amber-400'}`}>
                                  {currentCount} / {requiredCount}
                                </span>
                              </div>
                              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all ${isComplete ? 'bg-green-500' : 'bg-amber-500'}`}
                                  style={{ width: `${Math.min(100, (currentCount / requiredCount) * 100)}%` }}
                                />
                              </div>
                            </div>
                          )}
                          
                          {!relatedQuest && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                              <AlertCircle size={12} />
                              <span>No active quest for this item</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Count Badge */}
                        <div className={`text-center px-3 py-2 rounded-lg ${
                          isComplete ? 'bg-green-900/30' : 'bg-amber-900/30'
                        }`}>
                          <div className={`text-2xl font-bold ${isComplete ? 'text-green-400' : 'text-amber-400'}`}>
                            {currentCount}
                          </div>
                          <div className="text-[10px] text-gray-500">Collected</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* RIGHT: Materials Panel */}
      <aside className="w-72 bg-[#0a0c10] border-l border-[#2a2f3a] p-4 flex flex-col overflow-y-auto">
        <div className="border-b border-[#2a2f3a] pb-2 mb-4">
          <h3 className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
            <Hammer size={14} className="text-blue-500" /> Crafting Materials
          </h3>
          <p className="text-[9px] text-gray-600 mt-1">Shows all materials (inventory + vault)</p>
        </div>
        
        <div className="space-y-2 flex-1 overflow-y-auto">
          {combinedMaterials.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto text-gray-600 mb-3" size={32} />
              <p className="text-sm text-gray-500">No materials collected</p>
              <p className="text-xs text-gray-600 mt-1">Hunt monsters to gather materials!</p>
            </div>
          ) : (
            combinedMaterials.map((item: any, idx: number) => (
              <div 
                key={idx} 
                className="flex items-center gap-3 bg-[#151820] p-2 rounded border border-white/5 hover:border-blue-500/30 transition-all"
                onMouseEnter={(e) => { setHoverItem(item); setMousePos({ x: e.clientX, y: e.clientY }); }}
                onMouseMove={(e) => { setMousePos({ x: e.clientX, y: e.clientY }); }}
                onMouseLeave={() => { setHoverItem(null); }}
              >
                <div className="w-8 h-8 bg-blue-900/20 rounded flex items-center justify-center">
                  <ItemIcon item={item} size="md" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-300">{item.name || item.iconType}</div>
                  <div className="flex items-center gap-1 text-[9px]">
                    {item.inInventory && <span className="text-green-400 bg-green-900/30 px-1 rounded">Inv</span>}
                    {item.inBank && <span className="text-purple-400 bg-purple-900/30 px-1 rounded">Vault</span>}
                  </div>
                </div>
                <div className="text-sm font-bold text-blue-400">{item.count}</div>
              </div>
            ))
          )}
        </div>
      </aside>
      
      {/* Quantity Selector Modal */}
      {quantitySelector && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setQuantitySelector(null)}>
          <div className="bg-[#151820] border border-[#2a2f3a] rounded-xl p-6 shadow-2xl w-80" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-amber-400 mb-4">
              {quantitySelector.mode === 'deposit' ? 'Deposit to Vault' : 'Withdraw from Vault'}
            </h3>
            
            <div className="flex items-center gap-3 bg-[#0a0c10] p-3 rounded-lg mb-4">
              <div className="w-10 h-10 bg-blue-900/30 rounded flex items-center justify-center">
                <ItemIcon item={quantitySelector.item} size="lg" />
              </div>
              <div>
                <div className="text-sm text-gray-200">{quantitySelector.item.name || quantitySelector.item.iconType}</div>
                <div className="text-[10px] text-gray-500">Available: {quantitySelector.max}</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-4 mb-6">
              <button 
                onClick={() => setQuantitySelector(q => q ? {...q, quantity: Math.max(1, q.quantity - 10)} : null)}
                className="w-8 h-8 rounded bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400"
              >
                -10
              </button>
              <button 
                onClick={() => setQuantitySelector(q => q ? {...q, quantity: Math.max(1, q.quantity - 1)} : null)}
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center"
              >
                <Minus size={16} className="text-gray-400" />
              </button>
              <div className="text-3xl font-bold text-cyan-400 w-20 text-center">{quantitySelector.quantity}</div>
              <button 
                onClick={() => setQuantitySelector(q => q ? {...q, quantity: Math.min(q.max, q.quantity + 1)} : null)}
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center"
              >
                <Plus size={16} className="text-gray-400" />
              </button>
              <button 
                onClick={() => setQuantitySelector(q => q ? {...q, quantity: Math.min(q.max, q.quantity + 10)} : null)}
                className="w-8 h-8 rounded bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400"
              >
                +10
              </button>
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <button 
                onClick={() => setQuantitySelector(q => q ? {...q, quantity: 1} : null)}
                className="flex-1 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded"
              >
                Min
              </button>
              <button 
                onClick={() => setQuantitySelector(q => q ? {...q, quantity: Math.floor(q.max / 2)} : null)}
                className="flex-1 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded"
              >
                Half
              </button>
              <button 
                onClick={() => setQuantitySelector(q => q ? {...q, quantity: q.max} : null)}
                className="flex-1 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded"
              >
                Max
              </button>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setQuantitySelector(null)}
                className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center gap-2"
              >
                <X size={16} /> Cancel
              </button>
              <button 
                onClick={handleQuantityTransfer}
                className="flex-1 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg flex items-center justify-center gap-2 font-bold"
              >
                <Check size={16} /> Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
