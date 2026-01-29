// =====================================================
// VISUAL COMBAT ARENA - 2D Turn-Based Combat System
// =====================================================
// A more visual and animated combat experience
// =====================================================

import React, { useState, useEffect, useRef } from 'react';
import { Sword, Shield, Zap, Wind, Flame, Snowflake, Skull, TreePine, Leaf, Clock, AngryIcon, Sparkles } from 'lucide-react';
import { getPlayerSprite, getMobSprite, getZoneBackground } from '../../data/combatAssets';
import { useVFXManager, VFX_PRESETS } from './VFXSprite';
import { UI_ASSETS } from '../ui/UIFrames';
import { ELEMENT_ICON_PATHS } from '../../data/elementSystem';
import { ResourceIcon } from '../ui/GameIcon';

// =====================================================
// ASSET REQUIREMENTS - What you need to find/create:
// =====================================================
/*
📁 FOLDER STRUCTURE NEEDED:
   /public/assets/combat/
   ├── backgrounds/
   │   ├── forest_arena.png       (1920x600 - Battle background)
   │   ├── mountain_arena.png
   │   ├── temple_arena.png
   │   └── cave_arena.png
   ├── characters/
   │   ├── player/
   │   │   ├── idle.png           (256x256 - Standing pose)
   │   │   ├── attack.png         (256x256 - Attack pose)
   │   │   └── hurt.png           (256x256 - Damaged pose)
   │   └── enemies/
   │       ├── wolf_idle.png
   │       ├── bandit_idle.png
   │       └── demon_idle.png
   ├── effects/
   │   ├── slash_fire.png         (128x128 - Transparent)
   │   ├── slash_ice.png
   │   ├── slash_lightning.png
   │   ├── hit_impact.png
   │   ├── heal_glow.png
   │   └── shield_block.png
   └── ui/
       ├── skill_frame.png        (64x64 - Skill button border)
       ├── hp_bar_frame.png       (200x30 - HP bar border)
       └── turn_indicator.png

🎨 FREE ASSET SOURCES:
   1. https://itch.io/game-assets/free/tag-2d
      - Search: "martial arts", "wuxia", "chinese", "fantasy rpg"
      
   2. https://opengameart.org/
      - Search: "oriental", "martial arts", "rpg character"
      
   3. https://craftpix.net/freebies/
      - Has free character packs
      
   4. https://www.gameart2d.com/freebies.html
      - Free 2D game assets
      
   5. AI Generation (for custom assets):
      - Midjourney, DALL-E, Stable Diffusion
      - Prompt: "2D game character martial artist wuxia style idle pose transparent background pixel art"

🔧 RECOMMENDED SPECIFICATIONS:
   - Characters: 256x256px or 512x512px PNG with transparency
   - Backgrounds: 1920x600px minimum (can tile horizontally)
   - Effects: 128x128px or 256x256px PNG with transparency
   - UI Elements: Vector or high-res PNG
   - Style: Consistent art style (pixel art, anime, realistic - pick one!)
*/

// Types
interface CombatCharacter {
  name: string;
  hp: number;
  maxHp: number;
  qi?: number;
  maxQi?: number;
  level: number;
  image: string;
  element?: string;
}

interface Skill {
  id: string;
  name: string;
  icon: string;
  qiCost: number;
  cooldown: number;
  element: string;
  description: string;
}

interface CombatAction {
  type: 'attack' | 'skill' | 'defend' | 'item';
  actor: 'player' | 'enemy';
  skill?: Skill;
  damage?: number;
  isCrit?: boolean;
  element?: string;
}

interface VisualCombatArenaProps {
  player: CombatCharacter;
  enemy: CombatCharacter;
  playerSkills: Skill[];
  currentTurn: 'player' | 'enemy';
  isPlayerTurn: boolean;
  onUseSkill: (skillId: string) => void;
  onDefend: (type: 'block' | 'dodge' | 'counter') => void;
  onFlee: () => void;
  combatLog: Array<{ text: string; type: string; time: Date }>;
  lastAction?: CombatAction;
  effectState: any;
  comboBonusActive: any;
  comboProgress: any;
  blockCooldown: number;
  dodgeCooldown: number;
  counterCooldown: number;
  activeDefense: string | null;
  skillCooldowns: Record<string, number>;
}

// Element Colors and Icons
const ELEMENT_STYLES = {
  Fire: { color: '#ff6b35', glow: 'shadow-orange-500/50', icon: Flame, bg: 'from-orange-600/30 to-red-900/20' },
  Ice: { color: '#00d4ff', glow: 'shadow-cyan-500/50', icon: Snowflake, bg: 'from-cyan-600/30 to-blue-900/20' },
  Lightning: { color: '#ffd700', glow: 'shadow-yellow-500/50', icon: Zap, bg: 'from-yellow-600/30 to-amber-900/20' },
  Wood: { color: '#4ade80', glow: 'shadow-green-500/50', icon: Leaf, bg: 'from-green-600/30 to-emerald-900/20' },
  Void: { color: '#a855f7', glow: 'shadow-purple-500/50', icon: Skull, bg: 'from-purple-600/30 to-violet-900/20' },
  None: { color: '#9ca3af', glow: 'shadow-gray-500/50', icon: Sword, bg: 'from-gray-600/30 to-slate-900/20' },
};

// CSS Animations (add to index.css or App.css)
const combatAnimations = `
@keyframes combat-idle {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

@keyframes combat-attack {
  0% { transform: translateX(0) scale(1); }
  30% { transform: translateX(80px) scale(1.1); }
  50% { transform: translateX(100px) scale(1.15); }
  70% { transform: translateX(80px) scale(1.1); }
  100% { transform: translateX(0) scale(1); }
}

@keyframes combat-attack-enemy {
  0% { transform: translateX(0) scale(1); }
  30% { transform: translateX(-80px) scale(1.1); }
  50% { transform: translateX(-100px) scale(1.15); }
  70% { transform: translateX(-80px) scale(1.1); }
  100% { transform: translateX(0) scale(1); }
}

@keyframes combat-hurt {
  0% { transform: translateX(0); filter: brightness(1); }
  20% { transform: translateX(-20px); filter: brightness(2) hue-rotate(0deg); }
  40% { transform: translateX(15px); filter: brightness(1.5); }
  60% { transform: translateX(-10px); filter: brightness(1.2); }
  100% { transform: translateX(0); filter: brightness(1); }
}

@keyframes combat-skill-cast {
  0% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.2); filter: brightness(1.5) saturate(1.5); }
  100% { transform: scale(1); filter: brightness(1); }
}

@keyframes slash-effect {
  0% { transform: scale(0) rotate(-45deg); opacity: 0; }
  50% { transform: scale(1.5) rotate(0deg); opacity: 1; }
  100% { transform: scale(2) rotate(45deg); opacity: 0; }
}

@keyframes damage-number {
  0% { transform: translateY(0) scale(0.5); opacity: 0; }
  20% { transform: translateY(-20px) scale(1.2); opacity: 1; }
  80% { transform: translateY(-60px) scale(1); opacity: 1; }
  100% { transform: translateY(-80px) scale(0.8); opacity: 0; }
}

@keyframes heal-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); }
  50% { box-shadow: 0 0 40px 20px rgba(74, 222, 128, 0.3); }
}

@keyframes shield-pulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

@keyframes turn-glow {
  0%, 100% { box-shadow: 0 0 20px 5px currentColor; }
  50% { box-shadow: 0 0 40px 15px currentColor; }
}
`;

// Inject animations into document
if (typeof document !== 'undefined') {
  const styleId = 'combat-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = combatAnimations;
    document.head.appendChild(style);
  }
}

// =====================================================
// MAIN COMPONENT
// =====================================================
export const VisualCombatArena: React.FC<VisualCombatArenaProps> = ({
  player,
  enemy,
  playerSkills,
  currentTurn,
  isPlayerTurn,
  onUseSkill,
  onDefend,
  onFlee,
  combatLog,
  lastAction,
  effectState,
  comboBonusActive,
  comboProgress,
  blockCooldown,
  dodgeCooldown,
  counterCooldown,
  activeDefense,
  skillCooldowns,
}) => {
  // VFX Manager
  const { spawnVFX, VFXLayer } = useVFXManager();
  
  // Map element to VFX color
  const getVFXColor = (element: string): 'fire' | 'ice' | 'lightning' | 'poison' | 'void' | 'heal' => {
    switch (element) {
      case 'Fire': return 'fire';
      case 'Ice': return 'ice';
      case 'Lightning': return 'lightning';
      case 'Wood': return 'heal';
      case 'Void': return 'void';
      default: return 'fire';
    }
  };
  
  // Animation states
  const [playerAnimation, setPlayerAnimation] = useState<'idle' | 'attack' | 'hurt' | 'cast'>('idle');
  const [enemyAnimation, setEnemyAnimation] = useState<'idle' | 'attack' | 'hurt'>('idle');
  const [showSlashEffect, setShowSlashEffect] = useState<{ show: boolean; element: string; target: 'player' | 'enemy' }>({ show: false, element: 'None', target: 'enemy' });
  const [floatingNumbers, setFloatingNumbers] = useState<Array<{ id: number; value: string; type: string; target: 'player' | 'enemy'; color?: string }>>([]);
  const [showTurnBanner, setShowTurnBanner] = useState(true);
  
  const combatLogRef = useRef<HTMLDivElement>(null);
  const arenaRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const enemyRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll combat log
  useEffect(() => {
    if (combatLogRef.current) {
      combatLogRef.current.scrollTop = combatLogRef.current.scrollHeight;
    }
  }, [combatLog]);
  
  // Handle last action animations
  useEffect(() => {
    if (lastAction) {
      if (lastAction.actor === 'player') {
        // Player attacks
        setPlayerAnimation('attack');
        setTimeout(() => {
          setShowSlashEffect({ show: true, element: lastAction.element || 'None', target: 'enemy' });
          setEnemyAnimation('hurt');
          
          // Spawn VFX on enemy position
          const vfxColor = getVFXColor(lastAction.element || 'None');
          const enemyX = window.innerWidth * 0.7; // Right side of arena
          const enemyY = window.innerHeight * 0.4; // Center-ish
          
          // Choose VFX based on whether it's a crit or normal attack
          if (lastAction.isCrit) {
            spawnVFX('explosion_large', enemyX, enemyY, { scale: 3, color: vfxColor });
          } else {
            spawnVFX('slash_horizontal', enemyX, enemyY, { scale: 2.5, color: vfxColor });
          }
          
          // Add floating damage number
          if (lastAction.damage) {
            addFloatingNumber(
              lastAction.isCrit ? `CRIT ${lastAction.damage}!` : `-${lastAction.damage}`,
              lastAction.isCrit ? 'crit' : 'damage',
              'enemy',
              ELEMENT_STYLES[lastAction.element as keyof typeof ELEMENT_STYLES]?.color
            );
          }
        }, 400);
        
        setTimeout(() => {
          setPlayerAnimation('idle');
          setEnemyAnimation('idle');
          setShowSlashEffect({ show: false, element: 'None', target: 'enemy' });
        }, 1000);
      } else {
        // Enemy attacks
        setEnemyAnimation('attack');
        setTimeout(() => {
          setShowSlashEffect({ show: true, element: 'None', target: 'player' });
          setPlayerAnimation('hurt');
          
          // Spawn VFX on player position
          const playerX = window.innerWidth * 0.3; // Left side of arena
          const playerY = window.innerHeight * 0.35; // Upper area
          spawnVFX('slash_horizontal', playerX, playerY, { scale: 2, color: 'fire' });
          
          if (lastAction.damage) {
            addFloatingNumber(`-${lastAction.damage}`, 'damage', 'player');
          }
        }, 400);
        
        setTimeout(() => {
          setEnemyAnimation('idle');
          setPlayerAnimation('idle');
          setShowSlashEffect({ show: false, element: 'None', target: 'player' });
        }, 1000);
      }
    }
  }, [lastAction, spawnVFX]);
  
  // Floating number helper
  const addFloatingNumber = (value: string, type: string, target: 'player' | 'enemy', color?: string) => {
    const id = Date.now();
    setFloatingNumbers(prev => [...prev, { id, value, type, target, color }]);
    setTimeout(() => {
      setFloatingNumbers(prev => prev.filter(n => n.id !== id));
    }, 1500);
  };
  
  // Get animation class based on state
  const getAnimationClass = (character: 'player' | 'enemy', animation: string) => {
    const baseClass = 'transition-all duration-300';
    switch (animation) {
      case 'attack':
        return `${baseClass} ${character === 'player' ? 'animate-[combat-attack_0.8s_ease-out]' : 'animate-[combat-attack-enemy_0.8s_ease-out]'}`;
      case 'hurt':
        return `${baseClass} animate-[combat-hurt_0.5s_ease-out]`;
      case 'cast':
        return `${baseClass} animate-[combat-skill-cast_0.6s_ease-out]`;
      default:
        return `${baseClass} animate-[combat-idle_2s_ease-in-out_infinite]`;
    }
  };
  
  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      
      {/* ===== BATTLE ARENA ===== */}
      <div className="flex-1 relative overflow-hidden">
        
        {/* Background - Replace with your arena image */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-indigo-950/50 via-slate-900 to-black"
          style={{
            backgroundImage: `url('/assets/combat/backgrounds/forest_arena.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Atmospheric overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
          
          {/* Animated particles/fog effect */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ top: '20%', left: '10%' }} />
            <div className="absolute w-64 h-64 bg-red-500/10 rounded-full blur-3xl animate-pulse" style={{ top: '30%', right: '15%', animationDelay: '1s' }} />
          </div>
        </div>
        
        {/* Ground line */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-slate-900/80 to-transparent" />
        
        {/* ===== VFX LAYER ===== */}
        <VFXLayer />
        
        {/* ===== TURN INDICATOR BANNER ===== */}
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${showTurnBanner ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className={`px-8 py-3 rounded-full font-black text-lg uppercase tracking-widest border-2 backdrop-blur-sm ${
            isPlayerTurn 
              ? 'bg-blue-600/80 text-white border-blue-400 shadow-lg shadow-blue-500/50' 
              : 'bg-red-600/80 text-white border-red-400 shadow-lg shadow-red-500/50'
          }`} style={{ animation: 'turn-glow 2s ease-in-out infinite' }}>
            {isPlayerTurn 
              ? <span className="flex items-center gap-2"><Sword size={18} /> YOUR TURN</span>
              : <span className="flex items-center gap-2"><Skull size={18} /> ENEMY TURN</span>
            }
          </div>
        </div>
        
        {/* ===== CHARACTERS ===== */}
        <div className="absolute inset-0 flex items-end justify-between px-16 pb-32">
          
          {/* PLAYER CHARACTER */}
          <div className="relative flex flex-col items-center">
            {/* HP/QI Bars above character */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 space-y-2">
              {/* HP Bar with Frame */}
              <div className="relative">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-red-400 font-bold drop-shadow-lg flex items-center gap-1"><ResourceIcon type="hp" size={12} /> {player.hp}/{player.maxHp}</span>
                </div>
                <div className="relative h-6">
                  {/* HP Bar Frame overlay */}
                  <img 
                    src={UI_ASSETS.frames.hpBar}
                    alt=""
                    className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10"
                  />
                  {/* HP Fill */}
                  <div className="absolute inset-0 flex items-center px-1">
                    <div 
                      className="h-3 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 transition-all duration-700 rounded-sm"
                      style={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              
              {/* QI Bar with Frame */}
              {player.qi !== undefined && (
                <div className="relative">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-cyan-400 font-bold drop-shadow-lg flex items-center gap-1"><Sparkles size={12} /> {Math.ceil(player.qi || 0)}/{player.maxQi}</span>
                  </div>
                  <div className="relative h-5">
                    {/* QI Bar Frame overlay */}
                    <img 
                      src={UI_ASSETS.frames.qiBar}
                      alt=""
                      className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10"
                    />
                    {/* QI Fill */}
                    <div className="absolute inset-0 flex items-center px-1">
                      <div 
                        className="h-2 bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-500 transition-all duration-500 rounded-sm"
                        style={{ width: `${((player.qi || 0) / (player.maxQi || 100)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Player Name */}
              <div className="text-center mt-2">
                <div className="text-lg font-bold text-blue-200 drop-shadow-lg">{player.name}</div>
                <div className="text-xs text-blue-400">Lvl {player.level}</div>
              </div>
            </div>
            
            {/* Character Sprite */}
            <div className={`relative ${getAnimationClass('player', playerAnimation)}`}>
              {/* Glow effect when it's player's turn */}
              {isPlayerTurn && (
                <div className="absolute inset-0 rounded-full bg-blue-400/20 blur-2xl animate-pulse scale-150" />
              )}
              
              {/* Active Defense Shield */}
              {activeDefense && (
                <div className="absolute inset-0 rounded-full border-4 border-cyan-400 animate-[shield-pulse_1s_ease-in-out_infinite] scale-125 z-10">
                  <div className="absolute inset-0 bg-cyan-400/20 rounded-full" />
                </div>
              )}
              
              {/* Character Image */}
              <div className="w-64 h-64 relative">
                <img 
                  src={player.image || '/assets/combat/characters/player/idle.png'} 
                  alt={player.name}
                  className="w-full h-full object-contain drop-shadow-2xl"
                  style={{ transform: 'scaleX(1)' }} // Player faces right
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/256x256?text=Player';
                  }}
                />
                
                {/* Floating damage numbers */}
                {floatingNumbers.filter(n => n.target === 'player').map(num => (
                  <div
                    key={num.id}
                    className={`absolute left-1/2 -translate-x-1/2 font-black text-3xl animate-[damage-number_1.5s_ease-out_forwards] ${
                      num.type === 'damage' ? 'text-red-500' :
                      num.type === 'heal' ? 'text-green-400' :
                      num.type === 'crit' ? 'text-yellow-400' :
                      'text-white'
                    }`}
                    style={{ 
                      top: '20%',
                      color: num.color,
                      textShadow: '0 0 10px currentColor, 0 2px 4px black'
                    }}
                  >
                    {num.value}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* VS INDICATOR */}
          <div className="absolute left-1/2 bottom-48 -translate-x-1/2 z-20">
            <div className="text-5xl font-black text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse">
              VS
            </div>
          </div>
          
          {/* ENEMY CHARACTER */}
          <div className="relative flex flex-col items-center">
            {/* HP Bar above character */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 space-y-2">
              <div className="relative">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-red-400 font-bold drop-shadow-lg flex items-center gap-1"><ResourceIcon type="hp" size={12} /> {enemy.hp}/{enemy.maxHp}</span>
                </div>
                <div className="h-5 bg-black/60 rounded-full border-2 border-red-500/50 overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-red-700 via-red-600 to-orange-600 transition-all duration-700 relative"
                    style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/30" />
                  </div>
                </div>
              </div>
              
              {/* Enemy Name */}
              <div className="text-center mt-2">
                <div className="text-lg font-bold text-red-200 drop-shadow-lg">{enemy.name}</div>
                <div className="text-xs text-red-400">Lvl {enemy.level}</div>
              </div>
            </div>
            
            {/* Enemy Sprite */}
            <div className={`relative ${getAnimationClass('enemy', enemyAnimation)}`}>
              {/* Glow effect when it's enemy's turn */}
              {!isPlayerTurn && (
                <div className="absolute inset-0 rounded-full bg-red-400/20 blur-2xl animate-pulse scale-150" />
              )}
              
              {/* Enemy Image */}
              <div className="w-64 h-64 relative">
                <img 
                  src={enemy.image || '/assets/combat/characters/enemies/wolf_idle.png'} 
                  alt={enemy.name}
                  className="w-full h-full object-contain drop-shadow-2xl"
                  style={{ transform: 'scaleX(-1)' }} // Enemy faces left
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/256x256?text=Enemy';
                  }}
                />
                
                {/* Slash effect */}
                {showSlashEffect.show && showSlashEffect.target === 'enemy' && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center animate-[slash-effect_0.5s_ease-out_forwards] pointer-events-none"
                  >
                    <div 
                      className="w-32 h-32 bg-gradient-to-r opacity-80"
                      style={{
                        background: `linear-gradient(45deg, transparent, ${ELEMENT_STYLES[showSlashEffect.element as keyof typeof ELEMENT_STYLES]?.color || '#fff'}, transparent)`,
                        clipPath: 'polygon(0 40%, 100% 0, 100% 60%, 0 100%)',
                      }}
                    />
                  </div>
                )}
                
                {/* Floating damage numbers */}
                {floatingNumbers.filter(n => n.target === 'enemy').map(num => (
                  <div
                    key={num.id}
                    className={`absolute left-1/2 -translate-x-1/2 font-black animate-[damage-number_1.5s_ease-out_forwards] ${
                      num.type === 'crit' ? 'text-4xl text-yellow-400' :
                      num.type === 'damage' ? 'text-3xl text-green-400' :
                      'text-2xl text-white'
                    }`}
                    style={{ 
                      top: '20%',
                      color: num.color,
                      textShadow: `0 0 15px ${num.color || 'currentColor'}, 0 2px 4px black`
                    }}
                  >
                    {num.value}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* ===== COMBAT LOG (Compact, bottom-left) ===== */}
        <div className="absolute bottom-4 left-4 w-80 h-32 bg-black/70 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden z-30">
          <div className="px-3 py-1 bg-black/50 border-b border-white/10 text-xs text-gray-400 font-bold">
            📜 Battle Log
          </div>
          <div 
            ref={combatLogRef}
            className="h-24 overflow-y-auto p-2 space-y-1 text-xs custom-scrollbar"
          >
            {combatLog.slice(-10).map((log, i) => (
              <div 
                key={i} 
                className={`px-2 py-1 rounded ${
                  log.type === 'success' ? 'text-green-400' :
                  log.type === 'danger' ? 'text-red-400' :
                  log.type === 'combo' ? 'text-purple-400 font-bold' :
                  log.type === 'defense' ? 'text-cyan-400' :
                  log.type === 'crit' ? 'text-yellow-400 font-bold' :
                  'text-gray-300'
                }`}
              >
                {log.text}
              </div>
            ))}
          </div>
        </div>
        
        {/* ===== COMBO PROGRESS INDICATOR ===== */}
        {comboProgress && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40">
            <div className="bg-purple-900/80 backdrop-blur-sm rounded-xl px-6 py-3 border-2 border-purple-500 shadow-lg shadow-purple-500/30">
              <div className="text-center">
                <div className="text-sm text-purple-300 font-bold">{comboProgress.combo.name}</div>
                <div className="text-xs text-purple-400 mt-1">
                  Step {comboProgress.currentStep + 1} / {comboProgress.combo.sequence.length}
                </div>
                <div className="flex gap-1 mt-2 justify-center">
                  {comboProgress.combo.sequence.map((_: any, idx: number) => (
                    <div 
                      key={idx}
                      className={`w-3 h-3 rounded-full ${
                        idx <= comboProgress.currentStep ? 'bg-purple-400' : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* ===== COMBO BONUS ACTIVE ===== */}
        {comboBonusActive && !comboBonusActive.used && (
          <div className="absolute top-4 right-4 z-40">
            <div className="bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-sm rounded-xl px-4 py-2 border border-purple-400 shadow-lg animate-pulse">
              <div className="text-sm font-bold text-white flex items-center gap-1"><Flame size={14} /> COMBO BONUS READY!</div>
              <div className="text-xs text-purple-200">+{comboBonusActive.value}% {comboBonusActive.type}</div>
            </div>
          </div>
        )}
      </div>
      
      {/* ===== BOTTOM ACTION BAR ===== */}
      <div className="h-36 bg-gradient-to-t from-black via-slate-900/95 to-slate-900/90 border-t-2 border-amber-600/30 flex items-center px-4 gap-4 shrink-0">
        
        {/* DEFENSE ACTIONS */}
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500 font-bold mr-1 writing-vertical">DEFENSE</div>
          
          {/* Block */}
          <button
            onClick={() => onDefend('block')}
            disabled={blockCooldown > 0 || activeDefense !== null || !isPlayerTurn}
            className={`relative w-16 h-16 rounded-xl flex flex-col items-center justify-center transition-all ${
              blockCooldown > 0 || !isPlayerTurn
                ? 'bg-gray-800/50 text-gray-500 border-2 border-gray-700 cursor-not-allowed'
                : activeDefense === 'block'
                ? 'bg-cyan-500 text-white border-2 border-cyan-300 animate-pulse shadow-lg shadow-cyan-500/50'
                : 'bg-cyan-900/60 text-cyan-300 border-2 border-cyan-700 hover:bg-cyan-800 hover:border-cyan-500 hover:scale-110 active:scale-95'
            }`}
          >
            {blockCooldown > 0 && (
              <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center">
                <span className="text-xl font-black text-white">{blockCooldown}</span>
              </div>
            )}
            <Shield size={24} />
            <span className="text-[10px] font-bold mt-0.5">Block</span>
            <div className="absolute -top-1 -left-1 w-5 h-5 bg-slate-900 rounded flex items-center justify-center text-[10px] font-bold border border-cyan-500/50">Q</div>
          </button>
          
          {/* Dodge */}
          <button
            onClick={() => onDefend('dodge')}
            disabled={dodgeCooldown > 0 || activeDefense !== null || !isPlayerTurn}
            className={`relative w-16 h-16 rounded-xl flex flex-col items-center justify-center transition-all ${
              dodgeCooldown > 0 || !isPlayerTurn
                ? 'bg-gray-800/50 text-gray-500 border-2 border-gray-700 cursor-not-allowed'
                : activeDefense === 'dodge'
                ? 'bg-blue-500 text-white border-2 border-blue-300 animate-pulse shadow-lg shadow-blue-500/50'
                : 'bg-blue-900/60 text-blue-300 border-2 border-blue-700 hover:bg-blue-800 hover:border-blue-500 hover:scale-110 active:scale-95'
            }`}
          >
            {dodgeCooldown > 0 && (
              <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center">
                <span className="text-xl font-black text-white">{dodgeCooldown}</span>
              </div>
            )}
            <Wind size={24} />
            <span className="text-[10px] font-bold mt-0.5">Dodge</span>
            <div className="absolute -top-1 -left-1 w-5 h-5 bg-slate-900 rounded flex items-center justify-center text-[10px] font-bold border border-blue-500/50">W</div>
          </button>
          
          {/* Counter */}
          <button
            onClick={() => onDefend('counter')}
            disabled={counterCooldown > 0 || activeDefense !== null || !isPlayerTurn}
            className={`relative w-16 h-16 rounded-xl flex flex-col items-center justify-center transition-all ${
              counterCooldown > 0 || !isPlayerTurn
                ? 'bg-gray-800/50 text-gray-500 border-2 border-gray-700 cursor-not-allowed'
                : activeDefense === 'counter'
                ? 'bg-red-500 text-white border-2 border-red-300 animate-pulse shadow-lg shadow-red-500/50'
                : 'bg-red-900/60 text-red-300 border-2 border-red-700 hover:bg-red-800 hover:border-red-500 hover:scale-110 active:scale-95'
            }`}
          >
            {counterCooldown > 0 && (
              <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center">
                <span className="text-xl font-black text-white">{counterCooldown}</span>
              </div>
            )}
            <Sword size={24} />
            <span className="text-[10px] font-bold mt-0.5">Counter</span>
            <div className="absolute -top-1 -left-1 w-5 h-5 bg-slate-900 rounded flex items-center justify-center text-[10px] font-bold border border-red-500/50">E</div>
          </button>
        </div>
        
        {/* Divider */}
        <div className="w-px h-20 bg-gradient-to-b from-transparent via-amber-600/50 to-transparent" />
        
        {/* SKILLS */}
        <div className="flex-1 flex items-center gap-3 overflow-x-auto px-2">
          {playerSkills.map((skill, idx) => {
            const cooldown = skillCooldowns[skill.id] || 0;
            const isOnCooldown = cooldown > 0;
            const hasEnoughQi = (player.qi || 0) >= skill.qiCost;
            const isAvailable = hasEnoughQi && !isOnCooldown && isPlayerTurn;
            const elementStyle = ELEMENT_STYLES[skill.element as keyof typeof ELEMENT_STYLES] || ELEMENT_STYLES.None;
            
            return (
              <button
                key={skill.id}
                onClick={() => isAvailable && onUseSkill(skill.id)}
                disabled={!isAvailable}
                className={`group relative w-20 h-20 flex flex-col items-center justify-center transition-all wuxia-slot rounded-lg ${
                  isOnCooldown
                    ? 'cursor-not-allowed'
                    : !hasEnoughQi || !isPlayerTurn
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:scale-110 active:scale-95'
                }`}
              >
                {/* Skill background with element color */}
                <div className={`absolute inset-1 rounded-lg ${
                  isOnCooldown ? 'bg-gray-800/80' :
                  !hasEnoughQi || !isPlayerTurn ? 'bg-gray-800/60' :
                  `bg-gradient-to-br ${elementStyle.bg}`
                }`} />
                
                {/* Cooldown overlay */}
                {isOnCooldown && (
                  <div className="absolute inset-2 bg-black/70 rounded-lg flex items-center justify-center z-20">
                    <span className="text-2xl font-black text-white">{cooldown}</span>
                  </div>
                )}
                
                {/* Skill icon */}
                <span className="relative z-10 text-2xl">{skill.icon}</span>
                <span className="relative z-10 text-[9px] font-bold mt-1 text-center leading-tight max-w-full px-1 truncate">{skill.name}</span>
                
                {/* Qi cost indicator */}
                <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[8px] font-bold flex items-center gap-0.5 z-20 ${
                  hasEnoughQi ? 'bg-cyan-600 text-white' : 'bg-red-600 text-white'
                }`}>
                  <ResourceIcon type="qi" size={8} />{skill.qiCost}
                </div>
                
                {/* Hotkey */}
                <div className="absolute -top-1 -left-1 w-5 h-5 bg-slate-900 rounded flex items-center justify-center text-[10px] font-bold text-amber-400 border border-amber-500/50 z-20">
                  {idx + 1}
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900/95 border border-amber-500/40 rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                  <div className="text-sm font-bold text-amber-400">{skill.name}</div>
                  <div className="text-[10px] text-gray-300 mt-1 leading-relaxed">{skill.description}</div>
                  <div className="flex items-center gap-3 mt-2 text-[10px]">
                    <span className="text-cyan-400 flex items-center gap-0.5"><ResourceIcon type="qi" size={10} /> {skill.qiCost} Qi</span>
                    <span className="text-amber-400 flex items-center gap-0.5"><Clock size={10} /> {skill.cooldown}t</span>
                    {skill.element !== 'None' && (
                      <span className="flex items-center gap-0.5" style={{ color: elementStyle.color }}>
                        <img src={ELEMENT_ICON_PATHS[skill.element as keyof typeof ELEMENT_ICON_PATHS]} alt={skill.element} className="w-3 h-3" /> {skill.element}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Divider */}
        <div className="w-px h-20 bg-gradient-to-b from-transparent via-amber-600/50 to-transparent" />
        
        {/* FLEE BUTTON */}
        <button
          onClick={onFlee}
          disabled={!isPlayerTurn}
          className={`w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
            isPlayerTurn
              ? 'bg-gray-800/60 text-gray-300 border-gray-600 hover:bg-gray-700 hover:border-gray-500 hover:scale-110 active:scale-95'
              : 'bg-gray-800/30 text-gray-600 border-gray-700 cursor-not-allowed'
          }`}
        >
          <span className="text-xl">🏃</span>
          <span className="text-[9px] font-bold mt-0.5">Flee</span>
        </button>
      </div>
    </div>
  );
};

export default VisualCombatArena;
