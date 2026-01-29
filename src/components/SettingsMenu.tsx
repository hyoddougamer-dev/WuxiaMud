// ============================================
// SETTINGS MENU - 凌云道 (Língyún Dào)
// Global settings accessible from anywhere
// ============================================

import React, { useState } from 'react';
import { 
  Settings, X, Users, Volume2, VolumeX, Bell, 
  Trash2, AlertTriangle, Sun, Eye, EyeOff,
  ChevronRight, Zap, Gauge, Palette, Monitor, MessageSquare,
  Sparkles, Swords, Target, SkipForward, LogOut, Music
} from 'lucide-react';
import { useSettings, GameSettings, defaultSettings } from '../contexts/SettingsContext';
import { useMusic } from '../contexts/MusicContext';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchCharacter: () => void;
  onLogout?: () => void;
  onResetGame?: () => void;
  playerName?: string;
}

// Toggle component
const Toggle: React.FC<{
  enabled: boolean;
  onChange: () => void;
  color?: string;
}> = ({ enabled, onChange, color = 'bg-amber-500' }) => (
  <button
    onClick={onChange}
    className={`w-11 h-6 rounded-full transition-all relative ${enabled ? color : 'bg-gray-700'}`}
  >
    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${enabled ? 'left-6' : 'left-1'}`} />
  </button>
);

// Select component
const Select: React.FC<{
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}> = ({ value, options, onChange }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="bg-[#1a1d28] border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  isOpen,
  onClose,
  onSwitchCharacter,
  onLogout,
  onResetGame,
  playerName = 'Cultivator',
}) => {
  const { settings, updateSetting, resetSettings } = useSettings();
  const { volume, isMuted, setVolume, toggleMute, nextTrack, currentTrack } = useMusic();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeSection, setActiveSection] = useState<'general' | 'combat' | 'notifications' | 'accessibility'>('general');
  
  if (!isOpen) return null;

  // Extrair nome da música atual
  const currentTrackName = currentTrack ? currentTrack.split('/').pop()?.replace('.mp3', '').replace('-', ' ').toUpperCase() : 'No track';

  const handleResetConfirm = () => {
    if (onResetGame) {
      onResetGame();
    }
    resetSettings();
    setShowResetConfirm(false);
    onClose();
  };

  const sections = [
    { id: 'general', label: 'General', icon: <Settings size={16} /> },
    { id: 'combat', label: 'Combat', icon: <Swords size={16} /> },
    { id: 'notifications', label: 'Alerts', icon: <Bell size={16} /> },
    { id: 'accessibility', label: 'Access', icon: <Eye size={16} /> },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Settings Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-[101] w-full max-w-lg bg-gradient-to-b from-[#1a1d28] to-[#12151c] border-l-2 border-amber-500/30 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1a1d28] to-[#12151c] border-b border-amber-500/20 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Settings className="text-amber-400" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Settings</h2>
                <p className="text-xs text-gray-500">Playing as {playerName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-gray-800/50 hover:bg-gray-700 flex items-center justify-center transition-all"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-1 px-4 py-3 border-b border-gray-800/50 flex-shrink-0 overflow-x-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeSection === section.id
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              {section.icon}
              {section.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* GENERAL SECTION */}
          {activeSection === 'general' && (
            <>
              {/* Character Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                  <Users size={14} />
                  Character
                </h3>
                
                <button
                  onClick={() => { onSwitchCharacter(); onClose(); }}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-cyan-900/20 to-cyan-900/10 border border-cyan-500/30 rounded-xl hover:border-cyan-400 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <Users className="text-cyan-400" size={18} />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-white group-hover:text-cyan-300 transition-colors">Switch Character</div>
                      <div className="text-xs text-gray-500">Manage your characters</div>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-500 group-hover:text-cyan-400 transition-colors" size={20} />
                </button>

                {onLogout && (
                  <button
                    onClick={() => { onLogout(); onClose(); }}
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-red-900/20 to-red-900/10 border border-red-500/30 rounded-xl hover:border-red-400 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <LogOut className="text-red-400" size={18} />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-white group-hover:text-red-300 transition-colors">Logout</div>
                        <div className="text-xs text-gray-500">Sign out and return to login</div>
                      </div>
                    </div>
                    <ChevronRight className="text-gray-500 group-hover:text-red-400 transition-colors" size={20} />
                  </button>
                )}
              </div>

              {/* Visual Settings */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                  <Palette size={14} />
                  Visual
                </h3>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-[#151820] border border-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Target size={18} className="text-gray-400" />
                      <div>
                        <span className="text-sm text-white">Damage Numbers</span>
                        <p className="text-[10px] text-gray-500">Show floating damage in combat</p>
                      </div>
                    </div>
                    <Toggle enabled={settings.showDamageNumbers} onChange={() => updateSetting('showDamageNumbers', !settings.showDamageNumbers)} />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-[#151820] border border-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare size={18} className="text-gray-400" />
                      <div>
                        <span className="text-sm text-white">Combat Log</span>
                        <p className="text-[10px] text-gray-500">Show detailed combat messages</p>
                      </div>
                    </div>
                    <Toggle enabled={settings.showCombatLog} onChange={() => updateSetting('showCombatLog', !settings.showCombatLog)} />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-[#151820] border border-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Sparkles size={18} className="text-gray-400" />
                      <div>
                        <span className="text-sm text-white">Particles & Effects</span>
                        <p className="text-[10px] text-gray-500">Floating particles and glows</p>
                      </div>
                    </div>
                    <Toggle enabled={settings.showParticles} onChange={() => updateSetting('showParticles', !settings.showParticles)} />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#151820] border border-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Gauge size={18} className="text-gray-400" />
                      <div>
                        <span className="text-sm text-white">Animation Speed</span>
                        <p className="text-[10px] text-gray-500">UI transitions and effects</p>
                      </div>
                    </div>
                    <Select
                      value={settings.animationSpeed}
                      options={[
                        { value: 'slow', label: 'Slow' },
                        { value: 'normal', label: 'Normal' },
                        { value: 'fast', label: 'Fast' },
                      ]}
                      onChange={(v) => updateSetting('animationSpeed', v as any)}
                    />
                  </div>
                </div>
              </div>

              {/* Audio Settings */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                  <Music size={14} />
                  Audio
                </h3>
                
                <div className="space-y-2">
                  {/* Mute Toggle */}
                  <div className="flex items-center justify-between p-3 bg-[#151820] border border-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      {isMuted ? <VolumeX size={18} className="text-gray-400" /> : <Volume2 size={18} className="text-gray-400" />}
                      <div>
                        <span className="text-sm text-white">Music</span>
                        <p className="text-[10px] text-gray-500">{isMuted ? 'Muted' : 'Playing'}</p>
                      </div>
                    </div>
                    <Toggle enabled={!isMuted} onChange={toggleMute} color="bg-green-500" />
                  </div>
                  
                  {/* Volume Slider */}
                  <div 
                    className="p-3 bg-[#151820] border border-white/5 rounded-lg space-y-3"
                    onWheel={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Volume2 size={18} className="text-gray-400" />
                        <span className="text-sm text-white">Volume</span>
                      </div>
                      <span className="text-xs text-amber-400 font-mono">{Math.round(volume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
                    />
                  </div>
                  
                  {/* Current Track & Skip */}
                  <div className="flex items-center justify-between p-3 bg-[#151820] border border-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Music size={18} className="text-gray-400" />
                      <div>
                        <span className="text-sm text-white">Now Playing</span>
                        <p className="text-[10px] text-amber-400">{currentTrackName}</p>
                      </div>
                    </div>
                    <button
                      onClick={nextTrack}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-white flex items-center gap-1 transition-colors"
                    >
                      <SkipForward size={14} />
                      Skip
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* COMBAT SECTION */}
          {activeSection === 'combat' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                <Swords size={14} />
                Combat Preferences
              </h3>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-[#151820] border border-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <SkipForward size={18} className="text-gray-400" />
                    <div>
                      <span className="text-sm text-white">Auto-Combat Speed</span>
                      <p className="text-[10px] text-gray-500">How fast auto-combat plays</p>
                    </div>
                  </div>
                  <Select
                    value={settings.autoCombatSpeed}
                    options={[
                      { value: 'normal', label: 'Normal (1x)' },
                      { value: 'fast', label: 'Fast (2x)' },
                    ]}
                    onChange={(v) => updateSetting('autoCombatSpeed', v as any)}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-[#151820] border border-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Eye size={18} className="text-gray-400" />
                    <div>
                      <span className="text-sm text-white">Show Enemy Health</span>
                      <p className="text-[10px] text-gray-500">Display enemy HP values</p>
                    </div>
                  </div>
                  <Toggle enabled={settings.showEnemyHealth} onChange={() => updateSetting('showEnemyHealth', !settings.showEnemyHealth)} />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-[#151820] border border-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={18} className="text-gray-400" />
                    <div>
                      <span className="text-sm text-white">Confirm Before Flee</span>
                      <p className="text-[10px] text-gray-500">Ask before fleeing combat</p>
                    </div>
                  </div>
                  <Toggle enabled={settings.confirmBeforeFlee} onChange={() => updateSetting('confirmBeforeFlee', !settings.confirmBeforeFlee)} />
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS SECTION */}
          {activeSection === 'notifications' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                <Bell size={14} />
                Notifications & Alerts
              </h3>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-[#151820] border border-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    {settings.soundEnabled ? <Volume2 size={18} className="text-gray-400" /> : <VolumeX size={18} className="text-gray-600" />}
                    <div>
                      <span className="text-sm text-white">Sound Effects</span>
                      <p className="text-[10px] text-gray-500">Game audio (coming soon)</p>
                    </div>
                  </div>
                  <Toggle enabled={settings.soundEnabled} onChange={() => updateSetting('soundEnabled', !settings.soundEnabled)} />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-[#151820] border border-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Zap size={18} className="text-amber-400" />
                    <div>
                      <span className="text-sm text-white">Level Up Alert</span>
                      <p className="text-[10px] text-gray-500">Notification when you level up</p>
                    </div>
                  </div>
                  <Toggle enabled={settings.notifyOnLevelUp} onChange={() => updateSetting('notifyOnLevelUp', !settings.notifyOnLevelUp)} color="bg-amber-500" />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-[#151820] border border-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Sparkles size={18} className="text-purple-400" />
                    <div>
                      <span className="text-sm text-white">Rare Drop Alert</span>
                      <p className="text-[10px] text-gray-500">Notification for rare+ items</p>
                    </div>
                  </div>
                  <Toggle enabled={settings.notifyOnRareDrop} onChange={() => updateSetting('notifyOnRareDrop', !settings.notifyOnRareDrop)} color="bg-purple-500" />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-[#151820] border border-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Target size={18} className="text-green-400" />
                    <div>
                      <span className="text-sm text-white">Quest Complete Alert</span>
                      <p className="text-[10px] text-gray-500">Notification for quests</p>
                    </div>
                  </div>
                  <Toggle enabled={settings.notifyOnQuestComplete} onChange={() => updateSetting('notifyOnQuestComplete', !settings.notifyOnQuestComplete)} color="bg-green-500" />
                </div>
              </div>
            </div>
          )}

          {/* ACCESSIBILITY SECTION */}
          {activeSection === 'accessibility' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                <Eye size={14} />
                Accessibility
              </h3>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-[#151820] border border-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Monitor size={18} className="text-gray-400" />
                    <div>
                      <span className="text-sm text-white">Large Text</span>
                      <p className="text-[10px] text-gray-500">Increase font sizes</p>
                    </div>
                  </div>
                  <Toggle enabled={settings.largeText} onChange={() => updateSetting('largeText', !settings.largeText)} />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-[#151820] border border-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Sun size={18} className="text-gray-400" />
                    <div>
                      <span className="text-sm text-white">High Contrast</span>
                      <p className="text-[10px] text-gray-500">Improve text visibility</p>
                    </div>
                  </div>
                  <Toggle enabled={settings.highContrast} onChange={() => updateSetting('highContrast', !settings.highContrast)} />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-[#151820] border border-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <EyeOff size={18} className="text-gray-400" />
                    <div>
                      <span className="text-sm text-white">Reduced Motion</span>
                      <p className="text-[10px] text-gray-500">Minimize animations</p>
                    </div>
                  </div>
                  <Toggle enabled={settings.reducedMotion} onChange={() => updateSetting('reducedMotion', !settings.reducedMotion)} />
                </div>
              </div>
              
              <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-3 mt-4">
                <p className="text-[11px] text-gray-400">
                  <span className="text-blue-400 font-medium">Note:</span> Some accessibility features may require a page refresh to take full effect.
                </p>
              </div>
            </div>
          )}

          {/* Danger Zone - Always visible at bottom */}
          {onResetGame && (
            <div className="space-y-3 pt-4 border-t border-red-900/30">
              <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle size={14} />
                Danger Zone
              </h3>
              
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full flex items-center justify-between p-4 bg-red-900/10 border border-red-500/30 rounded-xl hover:border-red-500 hover:bg-red-900/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <Trash2 className="text-red-400" size={18} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-red-400">Reset Game Data</div>
                    <div className="text-xs text-gray-500">Delete all local progress (dev only)</div>
                  </div>
                </div>
                <ChevronRight className="text-gray-600 group-hover:text-red-400 transition-colors" size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 px-6 py-4 flex-shrink-0 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-lg font-bold text-amber-500/70">凌云道</span>
          </div>
          <p className="text-[10px] text-gray-700">Língyún Dào · Version 0.1.0 Alpha</p>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-b from-[#1a1d28] to-[#12151c] border-2 border-red-500/40 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle size={32} className="text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Reset All Data?</h3>
              <p className="text-gray-400 text-sm mb-6">
                This will permanently delete <strong className="text-red-400">ALL local data</strong> including settings. This is for development only.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetConfirm}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold transition-all"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Settings Button Component - to be placed in the header/top bar
export const SettingsButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 rounded-lg bg-[#1a1d28] border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 flex items-center justify-center transition-all group"
      title="Settings"
    >
      <Settings size={18} className="text-gray-400 group-hover:text-amber-400 transition-colors" />
    </button>
  );
};

// Re-export for compatibility
export { useSettings, defaultSettings } from '../contexts/SettingsContext';
export type { GameSettings } from '../contexts/SettingsContext';

export default SettingsMenu;
