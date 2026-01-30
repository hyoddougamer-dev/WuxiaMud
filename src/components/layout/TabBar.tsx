import React from 'react';
import { Swords, User, Package, Hammer, Book, Sparkles, Settings, ShoppingCart } from 'lucide-react';

export type TabType = 'world' | 'character' | 'inventory' | 'forge' | 'bestiary' | 'map' | 'market';

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenSettings?: () => void;
  player?: {
    name: string;
    title: string;
    realm: string;
    level: number;
    avatar?: string;
  };
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange, onOpenSettings, player }) => {
  const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode; color: string }> = [
    {
      id: 'world',
      label: 'World',
      icon: <Swords className="w-4 h-4 sm:w-5 sm:h-5" />,
      color: 'from-red-600 to-orange-600',
    },
    {
      id: 'character',
      label: 'Char',
      icon: <User className="w-4 h-4 sm:w-5 sm:h-5" />,
      color: 'from-blue-600 to-cyan-600',
    },
    {
      id: 'inventory',
      label: 'Items',
      icon: <Package className="w-4 h-4 sm:w-5 sm:h-5" />,
      color: 'from-green-600 to-emerald-600',
    },
    {
      id: 'forge',
      label: 'Forge',
      icon: <Hammer className="w-4 h-4 sm:w-5 sm:h-5" />,
      color: 'from-yellow-600 to-amber-600',
    },
    {
      id: 'bestiary',
      label: 'Mobs',
      icon: <Book className="w-4 h-4 sm:w-5 sm:h-5" />,
      color: 'from-purple-600 to-violet-600',
    },
    {
      id: 'map',
      label: 'Cult',
      icon: <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />,
      color: 'from-purple-600 to-pink-600',
    },
    {
      id: 'market',
      label: 'Shop',
      icon: <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />,
      color: 'from-amber-600 to-yellow-600',
    },
  ];

  return (
    <div className="bg-gradient-to-b from-black/90 to-gray-900/90 border-b-2 border-yellow-600/50 shadow-xl flex-shrink-0">
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between px-4 h-14">
        {/* Logo */}
        <div className="flex items-center">
          <img 
            src="/logo.png" 
            alt="Língyún Dào" 
            className="h-10 drop-shadow-[0_0_10px_rgba(255,180,50,0.3)]"
          />
        </div>

        {/* Tab Navigation - Desktop */}
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  group relative flex flex-col items-center justify-center
                  px-3 py-1.5 rounded-lg transition-all duration-200
                  ${
                    isActive
                      ? `bg-gradient-to-br ${tab.color} text-white shadow-lg`
                      : 'bg-black/40 text-gray-400 hover:text-white hover:bg-black/60'
                  }
                `}
              >
                <div className={`transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {tab.icon}
                </div>
                <span className="text-[10px] font-medium mt-0.5">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* User Info & Settings - Desktop */}
        <div className="flex items-center gap-2 text-gray-300">
          <div className="text-right hidden lg:block">
            <p className="text-xs font-medium text-amber-400">{player?.name || 'Cultivator'}</p>
            <p className="text-[10px] text-gray-500">{player?.realm || 'Mortal'}</p>
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
            {player?.avatar ? <img src={player.avatar} className="w-full h-full object-cover" /> : <User size={16} className="text-white" />}
          </div>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="w-8 h-8 rounded-lg bg-black/40 hover:bg-black/60 border border-white/10 hover:border-amber-500/50 flex items-center justify-center transition-all group"
              title="Settings"
            >
              <Settings size={14} className="text-gray-400 group-hover:text-amber-400 group-hover:rotate-90 transition-all duration-300" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Layout - Bottom Tab Bar Style at Top */}
      <div className="md:hidden flex items-center justify-between px-2 py-1.5">
        {/* Logo - Small */}
        <img 
          src="/logo.png" 
          alt="Língyún Dào" 
          className="h-8 drop-shadow-[0_0_10px_rgba(255,180,50,0.3)] flex-shrink-0"
        />

        {/* Tab Navigation - Mobile (scrollable) */}
        <div className="flex gap-0.5 overflow-x-auto scrollbar-hide flex-1 mx-2 justify-center">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex flex-col items-center justify-center flex-shrink-0
                  px-2 py-1 rounded-md transition-all duration-200 min-w-[40px]
                  ${
                    isActive
                      ? `bg-gradient-to-br ${tab.color} text-white`
                      : 'bg-black/40 text-gray-400'
                  }
                `}
              >
                {tab.icon}
                <span className="text-[8px] font-medium mt-0.5 truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Settings - Mobile */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center flex-shrink-0"
          >
            <Settings size={14} className="text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
};
