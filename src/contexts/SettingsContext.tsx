// ============================================
// SETTINGS CONTEXT - 凌云道 (Língyún Dào)
// Global settings provider for the game
// ============================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Settings storage key
const SETTINGS_KEY = 'lingyundao_settings_v1';

// Settings interface
export interface GameSettings {
  // Visual Settings
  showDamageNumbers: boolean;
  showCombatLog: boolean;
  combatLogSize: 'small' | 'medium' | 'large';
  animationSpeed: 'slow' | 'normal' | 'fast';
  showParticles: boolean;
  
  // Combat Settings
  autoCombatSpeed: 'normal' | 'fast'; // No instant - max 2x
  confirmBeforeFlee: boolean;
  showEnemyHealth: boolean;
  
  // Notification Settings
  soundEnabled: boolean;
  notifyOnLevelUp: boolean;
  notifyOnRareDrop: boolean;
  notifyOnQuestComplete: boolean;
  
  // Accessibility
  largeText: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
}

// Default settings
export const defaultSettings: GameSettings = {
  showDamageNumbers: true,
  showCombatLog: true,
  combatLogSize: 'medium',
  animationSpeed: 'normal',
  showParticles: true,
  autoCombatSpeed: 'normal',
  confirmBeforeFlee: true,
  showEnemyHealth: true,
  soundEnabled: true,
  notifyOnLevelUp: true,
  notifyOnRareDrop: true,
  notifyOnQuestComplete: true,
  largeText: false,
  highContrast: false,
  reducedMotion: false,
};

// Context type
interface SettingsContextType {
  settings: GameSettings;
  updateSetting: <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => void;
  resetSettings: () => void;
}

// Create context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Load settings from localStorage
const loadSettings = (): GameSettings => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old 'instant' to 'fast' if exists
      if (parsed.autoCombatSpeed === 'instant') {
        parsed.autoCombatSpeed = 'fast';
      }
      return { ...defaultSettings, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return defaultSettings;
};

// Save settings to localStorage
const saveSettings = (settings: GameSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
};

// Provider component
export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<GameSettings>(loadSettings);

  // Save settings when they change
  useEffect(() => {
    saveSettings(settings);
    
    // Apply accessibility settings to document
    const root = document.documentElement;
    
    // Large text
    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
    
    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }, [settings]);

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

// Hook to use settings
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// Hook for specific setting checks (for easy inline usage)
export const useSetting = <K extends keyof GameSettings>(key: K): GameSettings[K] => {
  const { settings } = useSettings();
  return settings[key];
};

export default SettingsContext;
