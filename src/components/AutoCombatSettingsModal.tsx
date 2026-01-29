// ============================================
// AUTO-COMBAT SETTINGS MODAL - WuxiaMUD
// Premium aesthetic configuration modal
// ============================================

import React from 'react';
import { X, Sword, Package, Shield, Star, Clock, Settings, Sparkles, ChevronRight, AlertTriangle } from 'lucide-react';
import { ResourceIcon } from './ui/GameIcon';

export interface AutoCombatSettings {
  // Loot Settings
  autoLootAll: boolean;
  lootGear: boolean;
  lootConsumables: boolean;
  lootMaterials: boolean;
  lootJunk: boolean;
  lootTokens: boolean;
  minRarityToLoot: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
  
  // Auto-Potion Settings
  autoPotEnabled: boolean;
  autoPotHpThreshold: number;
  autoPotQiThreshold: number;
  
  // Combat Settings
  autoSkillsEnabled: boolean;       // NEW: Use skills automatically
  pauseOnLevelUp: boolean;
  pauseOnRareDrop: boolean;
  stopOnLowHp: boolean;
  lowHpThreshold: number;
  
  // Time Settings
  maxCombatMinutes: number;
}

export const defaultAutoCombatSettings: AutoCombatSettings = {
  autoLootAll: true,
  lootGear: true,
  lootConsumables: true,
  lootMaterials: true,
  lootJunk: true,
  lootTokens: true,
  minRarityToLoot: 'Common',
  
  autoPotEnabled: true,
  autoPotHpThreshold: 30,
  autoPotQiThreshold: 20,
  
  autoSkillsEnabled: true,  // NEW: Default to true for auto-skills
  pauseOnLevelUp: true,
  pauseOnRareDrop: true,
  stopOnLowHp: true,
  lowHpThreshold: 30,
  
  maxCombatMinutes: 0,
};

interface AutoCombatSettingsModalProps {
  isOpen: boolean;
  settings: AutoCombatSettings;
  onClose: () => void;
  onSave: (settings: AutoCombatSettings) => void;
  onStart: () => void;
  timeRemaining: number;
}

// Custom Toggle Switch Component
const ToggleSwitch: React.FC<{ 
  checked: boolean; 
  onChange: (checked: boolean) => void;
  color?: 'cyan' | 'red' | 'green' | 'amber' | 'purple';
}> = ({ checked, onChange, color = 'cyan' }) => {
  const colors = {
    cyan: 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-cyan-500/50',
    red: 'bg-gradient-to-r from-red-500 to-rose-500 shadow-red-500/50',
    green: 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-green-500/50',
    amber: 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/50',
    purple: 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-purple-500/50',
  };
  
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
        checked 
          ? `${colors[color]} shadow-lg` 
          : 'bg-gray-700/80'
      }`}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ${
        checked ? 'left-7' : 'left-1'
      }`}>
        {checked && <Sparkles size={8} className="absolute inset-0 m-auto text-gray-400" />}
      </div>
    </button>
  );
};

// Slider Component with visual feedback
const ThresholdSlider: React.FC<{
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  color: 'red' | 'blue' | 'amber';
  icon: React.ReactNode;
  label: string;
}> = ({ value, onChange, min, max, step, color, icon, label }) => {
  const colors = {
    red: { gradient: 'from-red-600 to-rose-500', text: 'text-red-400', bg: 'bg-red-500/20' },
    blue: { gradient: 'from-blue-600 to-cyan-500', text: 'text-blue-400', bg: 'bg-blue-500/20' },
    amber: { gradient: 'from-amber-600 to-orange-500', text: 'text-amber-400', bg: 'bg-amber-500/20' },
  };
  
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
      <div className={`w-8 h-8 rounded-lg ${colors[color].bg} flex items-center justify-center`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">{label}</span>
          <span className={`text-sm font-bold ${colors[color].text}`}>{value}%</span>
        </div>
        <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${colors[color].gradient} rounded-full transition-all`}
            style={{ width: `${percentage}%` }}
          />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

export const AutoCombatSettingsModal: React.FC<AutoCombatSettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
  onStart,
  timeRemaining
}) => {
  const [localSettings, setLocalSettings] = React.useState<AutoCombatSettings>(settings);
  const [isClosing, setIsClosing] = React.useState(false);
  
  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);
  
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };
  
  if (!isOpen) return null;
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const rarityOptions = ['Mortal', 'Earth', 'Heaven', 'Spirit', 'Immortal'] as const;
  const rarityColors = {
    'Mortal': 'text-gray-400 bg-gray-500/20 border-gray-500/40',
    'Earth': 'text-green-400 bg-green-500/20 border-green-500/40',
    'Heaven': 'text-blue-400 bg-blue-500/20 border-blue-500/40',
    'Spirit': 'text-purple-400 bg-purple-500/20 border-purple-500/40',
    'Immortal': 'text-amber-400 bg-amber-500/20 border-amber-500/40',
  };
  
  // Legacy rarity mapping for backwards compatibility
  const legacyToWuxia: Record<string, string> = {
    'Common': 'Mortal',
    'Uncommon': 'Earth',
    'Rare': 'Heaven',
    'Epic': 'Spirit',
    'Legendary': 'Immortal',
  };
  
  const handleSaveAndStart = () => {
    onSave(localSettings);
    onStart();
  };
  
  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
      isClosing ? 'opacity-0' : 'opacity-100'
    }`}>
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>
      
      {/* Modal */}
      <div className={`relative w-full max-w-md max-h-[85vh] overflow-hidden rounded-2xl transition-all duration-300 ${
        isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
      }`}>
        {/* Outer glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 rounded-2xl blur-sm opacity-50 animate-pulse" />
        
        {/* Main container */}
        <div className="relative bg-gradient-to-b from-[#1a1d28] via-[#151820] to-[#0f1218] border border-cyan-500/30 rounded-2xl overflow-hidden">
          
          {/* Header with animated gradient */}
          <div className="relative p-5 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/40 via-purple-900/30 to-cyan-900/40" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,255,255,0.1),transparent_50%)]" />
            
            {/* Decorative lines */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent" />
            
            <div className="relative flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-xl blur opacity-40 animate-pulse" />
                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Settings size={24} className="text-white animate-spin" style={{ animationDuration: '8s' }} />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-300">
                  Auto-Combat
                </h2>
                <p className="text-xs text-cyan-400/70">Configure your farming session</p>
              </div>
              <button 
                onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors group"
              >
                <X size={16} className="text-gray-400 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>
          
          {/* Time Display */}
          <div className="mx-4 mb-4 p-3 rounded-xl bg-gradient-to-r from-amber-900/30 via-orange-900/20 to-amber-900/30 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Clock size={16} className="text-amber-400" />
              </div>
              <span className="text-sm text-amber-300">Daily Time Remaining</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400 font-mono tracking-wider">
                {formatTime(timeRemaining)}
              </span>
              {timeRemaining < 300 && (
                <AlertTriangle size={16} className="text-amber-400 animate-pulse" />
              )}
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="max-h-[50vh] overflow-y-auto px-4 pb-4 space-y-4 scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent">
            
            {/* LOOT SETTINGS */}
            <section className="rounded-xl bg-gradient-to-br from-green-900/20 to-emerald-900/10 border border-green-500/20 overflow-hidden">
              <div className="flex items-center gap-2 p-3 border-b border-green-500/20 bg-green-900/20">
                <Package size={16} className="text-green-400" />
                <h3 className="text-sm font-bold text-green-400 uppercase tracking-wide">Loot Collection</h3>
              </div>
              
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <span className="text-sm text-gray-300">Auto-loot All Items</span>
                  <ToggleSwitch
                    checked={localSettings.autoLootAll}
                    onChange={(checked) => setLocalSettings(s => ({ ...s, autoLootAll: checked }))}
                    color="green"
                  />
                </div>
                
                {!localSettings.autoLootAll && (
                  <div className="ml-2 pl-3 border-l-2 border-green-500/30 space-y-1">
                    {[
                      { key: 'lootGear', label: 'Gear & Weapons', icon: <Sword size={12} className="text-purple-400" /> },
                      { key: 'lootConsumables', label: 'Pills & Consumables', icon: <ResourceIcon type="hp" size={12} /> },
                      { key: 'lootMaterials', label: 'Crafting Materials', icon: <Star size={12} className="text-amber-400" /> },
                      { key: 'lootJunk', label: 'Junk Items', icon: <Package size={12} className="text-gray-400" /> },
                      { key: 'lootTokens', label: 'Class Tokens', icon: <Shield size={12} className="text-cyan-400" /> },
                    ].map(({ key, label, icon }) => (
                      <div key={key} className="flex items-center justify-between p-1.5 rounded hover:bg-white/5 transition-colors">
                        <span className="text-xs text-gray-400 flex items-center gap-2">{icon} {label}</span>
                        <ToggleSwitch
                          checked={localSettings[key as keyof AutoCombatSettings] as boolean}
                          onChange={(checked) => setLocalSettings(s => ({ ...s, [key]: checked }))}
                          color="green"
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between p-2 rounded-lg bg-black/20">
                  <span className="text-sm text-gray-300">Min. Rarity</span>
                  <div className="flex gap-1">
                    {rarityOptions.map(rarity => (
                      <button
                        key={rarity}
                        onClick={() => setLocalSettings(s => ({ ...s, minRarityToLoot: rarity }))}
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase border transition-all ${
                          localSettings.minRarityToLoot === rarity
                            ? rarityColors[rarity]
                            : 'text-gray-600 bg-gray-800/50 border-gray-700/30 hover:border-gray-600'
                        }`}
                      >
                        {rarity.slice(0, 1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
            
            {/* AUTO-POTION SETTINGS */}
            <section className="rounded-xl bg-gradient-to-br from-red-900/20 to-rose-900/10 border border-red-500/20 overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-red-500/20 bg-red-900/20">
                <div className="flex items-center gap-2">
                  <ResourceIcon type="hp" size={16} />
                  <h3 className="text-sm font-bold text-red-400 uppercase tracking-wide">Auto-Potion</h3>
                </div>
                <ToggleSwitch
                  checked={localSettings.autoPotEnabled}
                  onChange={(checked) => setLocalSettings(s => ({ ...s, autoPotEnabled: checked }))}
                  color="red"
                />
              </div>
              
              {localSettings.autoPotEnabled && (
                <div className="p-3 space-y-1">
                  <ThresholdSlider
                    value={localSettings.autoPotHpThreshold}
                    onChange={(value) => setLocalSettings(s => ({ ...s, autoPotHpThreshold: value }))}
                    min={10}
                    max={80}
                    step={5}
                    color="red"
                    icon={<ResourceIcon type="hp" size={14} />}
                    label="Use HP Pill when below"
                  />
                  <ThresholdSlider
                    value={localSettings.autoPotQiThreshold}
                    onChange={(value) => setLocalSettings(s => ({ ...s, autoPotQiThreshold: value }))}
                    min={10}
                    max={80}
                    step={5}
                    color="blue"
                    icon={<ResourceIcon type="qi" size={14} />}
                    label="Use QI Pill when below"
                  />
                </div>
              )}
            </section>
            
            {/* COMBAT BEHAVIOR */}
            <section className="rounded-xl bg-gradient-to-br from-amber-900/20 to-orange-900/10 border border-amber-500/20 overflow-hidden">
              <div className="flex items-center gap-2 p-3 border-b border-amber-500/20 bg-amber-900/20">
                <Sword size={16} className="text-amber-400" />
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wide">Combat Behavior</h3>
              </div>
              
              <div className="p-3 space-y-2">
                {/* Auto-Skills Toggle */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-purple-900/20 to-indigo-900/10 border border-purple-500/20">
                  <div>
                    <span className="text-sm text-gray-300">Auto-Use Skills</span>
                    <p className="text-[10px] text-gray-500">Automatically use skills when available</p>
                  </div>
                  <ToggleSwitch
                    checked={localSettings.autoSkillsEnabled}
                    onChange={(checked) => setLocalSettings(s => ({ ...s, autoSkillsEnabled: checked }))}
                    color="purple"
                  />
                </div>
                
                {[
                  { key: 'pauseOnLevelUp', label: 'Pause on Level Up', desc: 'Stop to celebrate!' },
                  { key: 'pauseOnRareDrop', label: 'Pause on Rare+ Drop', desc: 'Check your loot' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <div>
                      <span className="text-sm text-gray-300">{label}</span>
                      <p className="text-[10px] text-gray-500">{desc}</p>
                    </div>
                    <ToggleSwitch
                      checked={localSettings[key as keyof AutoCombatSettings] as boolean}
                      onChange={(checked) => setLocalSettings(s => ({ ...s, [key]: checked }))}
                      color="amber"
                    />
                  </div>
                ))}
                
                <div className="p-2 rounded-lg bg-black/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">Stop on Low HP</span>
                    <ToggleSwitch
                      checked={localSettings.stopOnLowHp}
                      onChange={(checked) => setLocalSettings(s => ({ ...s, stopOnLowHp: checked }))}
                      color="red"
                    />
                  </div>
                  {localSettings.stopOnLowHp && (
                    <ThresholdSlider
                      value={localSettings.lowHpThreshold}
                      onChange={(value) => setLocalSettings(s => ({ ...s, lowHpThreshold: value }))}
                      min={10}
                      max={50}
                      step={5}
                      color="amber"
                      icon={<AlertTriangle size={14} className="text-amber-400" />}
                      label="Emergency stop threshold"
                    />
                  )}
                </div>
              </div>
            </section>
          </div>
          
          {/* Footer Actions */}
          <div className="p-4 border-t border-white/10 bg-black/40 flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-3 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 font-medium transition-all border border-gray-700/50 hover:border-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(localSettings)}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 text-white font-medium transition-all border border-cyan-500/30"
            >
              Save
            </button>
            <button
              onClick={handleSaveAndStart}
              disabled={timeRemaining <= 0}
              className={`flex-[1.5] py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 relative overflow-hidden group ${
                timeRemaining > 0 
                  ? 'bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 text-white border border-green-400/50 shadow-lg shadow-green-500/30' 
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700/30'
              }`}
            >
              {timeRemaining > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              )}
              <Sword size={18} className={timeRemaining > 0 ? 'group-hover:rotate-12 transition-transform' : ''} />
              <span>Start Farming</span>
              <ChevronRight size={16} className={timeRemaining > 0 ? 'group-hover:translate-x-1 transition-transform' : ''} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoCombatSettingsModal;
