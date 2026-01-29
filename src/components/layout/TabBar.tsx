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
      icon: <Swords size={20} />,
      color: 'from-red-600 to-orange-600',
    },
    {
      id: 'character',
      label: 'Character',
      icon: <User size={20} />,
      color: 'from-blue-600 to-cyan-600',
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: <Package size={20} />,
      color: 'from-green-600 to-emerald-600',
    },
    {
      id: 'forge',
      label: 'Forge',
      icon: <Hammer size={20} />,
      color: 'from-yellow-600 to-amber-600',
    },
    {
      id: 'bestiary',
      label: 'Bestiary',
      icon: <Book size={20} />,
      color: 'from-purple-600 to-violet-600',
    },
    {
      id: 'map',
      label: 'Cultivation',
      icon: <Sparkles size={20} />,
      color: 'from-purple-600 to-pink-600',
    },
    {
      id: 'market',
      label: 'Market',
      icon: <ShoppingCart size={20} />,
      color: 'from-amber-600 to-yellow-600',
    },
  ];

  return (
    <div className="bg-gradient-to-b from-black/90 to-gray-900/90 border-b-2 border-yellow-600/50 shadow-xl">
      <div className="flex items-center justify-between px-4 h-16">
        {/* Logo */}
        <div className="flex items-center">
          <img 
            src="/logo.png" 
            alt="Língyún Dào" 
            className="h-12 drop-shadow-[0_0_10px_rgba(255,180,50,0.3)]"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  group relative flex flex-col items-center justify-center
                  px-4 py-2 rounded-lg transition-all duration-200
                  ${
                    isActive
                      ? `bg-gradient-to-br ${tab.color} text-white shadow-lg scale-105`
                      : 'bg-black/40 text-gray-400 hover:text-white hover:bg-black/60'
                  }
                `}
              >
                {/* Icon */}
                <div className={`transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {tab.icon}
                </div>

                {/* Label */}
                <span className="text-xs font-medium mt-1">{tab.label}</span>

                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-white rounded-full animate-pulse"></div>
                )}

                {/* Hover Glow */}
                {!isActive && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/5 group-hover:to-white/10 rounded-lg transition-all"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* User Info & Settings */}
        <div className="flex items-center gap-3 text-gray-300">
          <div className="text-right">
            <p className="text-sm font-medium text-amber-400">{player?.name || 'Cultivator'}</p>
            <p className="text-xs text-gray-500">{player?.realm || 'Mortal'}</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-full flex items-center justify-center overflow-hidden">
            {player?.avatar ? <img src={player.avatar} className="w-full h-full object-cover" /> : <User size={20} className="text-white" />}
          </div>
          
          {/* Settings Button */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="w-10 h-10 rounded-lg bg-black/40 hover:bg-black/60 border border-white/10 hover:border-amber-500/50 flex items-center justify-center transition-all group"
              title="Settings"
            >
              <Settings size={18} className="text-gray-400 group-hover:text-amber-400 group-hover:rotate-90 transition-all duration-300" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
