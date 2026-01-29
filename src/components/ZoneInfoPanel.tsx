import React from 'react';
import { Shield, AlertTriangle, Skull, MapPin, Users, Swords, Info, Star, Lock, Home } from 'lucide-react';
import { worldMap, bestiaryMap, mobDefinitions } from '../data/constants';

interface ZoneInfoPanelProps {
  coords: { x: number; y: number };
  playerLevel: number;
  isCompact?: boolean;
}

export const ZoneInfoPanel: React.FC<ZoneInfoPanelProps> = ({ coords, playerLevel, isCompact = false }) => {
  const key = `${coords.x},${coords.y}`;
  const zone = worldMap[key as keyof typeof worldMap] as { 
    name: string; 
    tier: number; 
    quality: number; 
    desc: string; 
    img: string; 
    exits: string[];
    safeZone?: boolean;
  } | undefined;
  
  if (!zone) return null;
  
  const isSafeZone = zone.safeZone === true;
  
  // Get mobs in this zone
  const mobIds = bestiaryMap[key as keyof typeof bestiaryMap] || [];
  const mobs = mobIds.map(id => mobDefinitions.find(m => m.id === id)).filter(Boolean);
  
  // Calculate zone level range
  const mobLevels = mobs.map(m => m?.level || 0);
  const minLevel = mobLevels.length > 0 ? Math.min(...mobLevels) : 0;
  const maxLevel = mobLevels.length > 0 ? Math.max(...mobLevels) : 0;
  
  // Calculate danger level (1-5 stars based on tier and player level difference)
  const getDangerLevel = (): number => {
    if (isSafeZone) return 0;
    if (mobLevels.length === 0) return 0;
    
    const avgMobLevel = mobLevels.reduce((a, b) => a + b, 0) / mobLevels.length;
    const levelDiff = avgMobLevel - playerLevel;
    
    if (levelDiff <= -5) return 1; // Very Easy
    if (levelDiff <= 0) return 2; // Easy
    if (levelDiff <= 3) return 3; // Normal
    if (levelDiff <= 6) return 4; // Hard
    return 5; // Deadly
  };
  
  const dangerLevel = getDangerLevel();
  
  const getDangerInfo = (level: number) => {
    switch (level) {
      case 0: return { label: 'Safe Zone', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', icon: Home };
      case 1: return { label: 'Very Easy', color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/40', icon: Shield };
      case 2: return { label: 'Easy', color: 'text-lime-400', bg: 'bg-lime-500/20', border: 'border-lime-500/40', icon: Shield };
      case 3: return { label: 'Normal', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/40', icon: AlertTriangle };
      case 4: return { label: 'Hard', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/40', icon: AlertTriangle };
      case 5: return { label: 'Deadly', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/40', icon: Skull };
      default: return { label: 'Unknown', color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/40', icon: Info };
    }
  };
  
  const dangerInfo = getDangerInfo(dangerLevel);
  const DangerIcon = dangerInfo.icon;
  
  // Get tier info
  const getTierInfo = (tier: number) => {
    switch (tier) {
      case 1: return { label: 'Qi Condensation', color: 'text-emerald-300', bg: 'bg-emerald-500/10' };
      case 2: return { label: 'Foundation', color: 'text-amber-300', bg: 'bg-amber-500/10' };
      case 3: return { label: 'Golden Core', color: 'text-red-300', bg: 'bg-red-500/10' };
      default: return { label: 'Unknown', color: 'text-gray-300', bg: 'bg-gray-500/10' };
    }
  };
  
  const tierInfo = getTierInfo(zone.tier);
  
  // Compact version for inline display
  if (isCompact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${dangerInfo.bg} ${dangerInfo.border}`}>
        <MapPin size={14} className={dangerInfo.color} />
        <span className="font-bold text-white text-sm">{zone.name}</span>
        <span className="text-gray-400">•</span>
        <DangerIcon size={14} className={dangerInfo.color} />
        <span className={`text-xs font-medium ${dangerInfo.color}`}>{dangerInfo.label}</span>
        {mobLevels.length > 0 && (
          <>
            <span className="text-gray-400">•</span>
            <span className="text-xs text-gray-400">Lv.{minLevel}-{maxLevel}</span>
          </>
        )}
      </div>
    );
  }
  
  // Full panel version
  return (
    <div className="bg-black/80 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden w-64">
      {/* Header */}
      <div className={`${dangerInfo.bg} border-b ${dangerInfo.border} px-4 py-3`}>
        <div className="flex items-center gap-2">
          <MapPin size={16} className={dangerInfo.color} />
          <h3 className="font-bold text-white text-sm">{zone.name}</h3>
        </div>
        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{zone.desc}</p>
      </div>
      
      {/* Stats */}
      <div className="p-3 space-y-2">
        {/* Danger Level */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <DangerIcon size={12} /> Danger
          </span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(i => (
              <Star 
                key={i} 
                size={12} 
                className={i <= dangerLevel ? dangerInfo.color : 'text-gray-700'} 
                fill={i <= dangerLevel ? 'currentColor' : 'none'}
              />
            ))}
            <span className={`text-xs ml-1 ${dangerInfo.color}`}>{dangerInfo.label}</span>
          </div>
        </div>
        
        {/* Tier */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Realm</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${tierInfo.bg} ${tierInfo.color}`}>
            {tierInfo.label}
          </span>
        </div>
        
        {/* Recommended Level */}
        {mobLevels.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Recommended</span>
            <span className={`text-xs font-bold ${
              playerLevel >= minLevel ? 'text-green-400' : 
              playerLevel >= minLevel - 2 ? 'text-amber-400' : 'text-red-400'
            }`}>
              Level {minLevel}-{maxLevel}
            </span>
          </div>
        )}
        
        {/* Monsters */}
        {mobs.length > 0 && (
          <div className="pt-2 border-t border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Swords size={12} /> Monsters
              </span>
              <span className="text-xs text-gray-400">{mobs.length} types</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {mobs.slice(0, 4).map((mob, i) => (
                <div key={i} className="text-[10px] px-2 py-0.5 bg-gray-800/80 rounded text-gray-300 border border-gray-700/50">
                  Lv.{mob?.level} {mob?.name?.split(' ')[0]}
                </div>
              ))}
              {mobs.length > 4 && (
                <div className="text-[10px] px-2 py-0.5 bg-gray-800/80 rounded text-gray-500">
                  +{mobs.length - 4} more
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Safe Zone Message */}
        {isSafeZone && (
          <div className="pt-2 border-t border-white/5">
            <div className="flex items-center gap-2 text-emerald-400/80">
              <Home size={14} />
              <span className="text-xs">No hostile creatures here</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
