import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, X, Compass, Sword, Package, Hammer, Star, Heart, Zap, Check, Lightbulb, Globe, User, Sparkles } from 'lucide-react';
import { weaponIcons, accessoryIcons, consumableIcons } from '../utils/iconSystem';

interface TutorialStep {
  id: number;
  title: string;
  content: string;
  icon: React.ReactNode;
  highlight?: string; // CSS selector or area to highlight
  action?: string; // Action hint
}

interface TutorialProps {
  onComplete: () => void;
  onSkip: () => void;
  playerName: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: "Welcome, Young Cultivator!",
    content: "You have taken your first step on the Path of Immortality. The Azure Cloud Sect has accepted you as an Outer Disciple. Your journey to become an immortal begins now!",
    icon: <Star className="text-amber-500" size={32} />,
    action: "Let's learn the essentials...",
  },
  {
    id: 2,
    title: "Your Starting Equipment",
    content: "You've received a starter weapon, accessories, healing pills, and 100 Spirit Stones. Check your INVENTORY tab to see everything. Pills can be used during combat to heal!",
    icon: <Package className="text-green-500" size={32} />,
    highlight: "inventory",
    action: "💡 Tip: HP Pills restore 50 HP, QI Pills restore 30 QI!",
  },
  {
    id: 3,
    title: "The World Awaits",
    content: "Use the arrow buttons to move through the world. Each zone has different enemies and difficulty levels. Start in safe green zones before venturing into dangerous areas!",
    icon: <Compass className="text-blue-500" size={32} />,
    highlight: "movement",
    action: "💡 Green = Safe (Lv1-5) | Yellow = Caution (Lv6-15) | Red = Deadly!",
  },
  {
    id: 4,
    title: "Combat Basics",
    content: "Click HUNT to find enemies. During combat, you auto-attack but can also use SKILLS (hotbar 1-4). Skills cost QI but deal more damage. Flee if HP gets too low!",
    icon: <Sword className="text-red-500" size={32} />,
    highlight: "combat",
    action: "💡 Use skills wisely - each has a cooldown and QI cost!",
  },
  {
    id: 5,
    title: "Your Class Powers",
    content: "Your chosen class has a unique PASSIVE ability that activates automatically during combat. Check the CHARACTER tab to see your class skills and passive effect!",
    icon: <Sparkles className="text-purple-500" size={32} />,
    highlight: "character",
    action: "💡 Passives can turn the tide of battle - learn yours!",
  },
  {
    id: 6,
    title: "Level Up & Stats",
    content: "Earn EXP from battles to level up. Each level gives Attribute Points (AP). Spend them on stats in CHARACTER tab: Ox Power for damage, Wind Walk for speed, Golden Body for HP, Dao Mind for QI, Heart Demon for resistances.",
    icon: <Star className="text-cyan-500" size={32} />,
    highlight: "stats",
    action: "💡 Match stats to your class - mages want Dao Mind, warriors want Ox Power!",
  },
  {
    id: 7,
    title: "Loot & Spirit Stones",
    content: "Enemies drop materials, junk, and gear. Sell junk items for Spirit Stones (currency). Use materials for crafting. Check drops in BESTIARY to plan your farming!",
    icon: <Lightbulb className="text-yellow-500" size={32} />,
    highlight: "bestiary",
    action: "💡 Each mob has unique drops - farm what you need!",
  },
  {
    id: 8,
    title: "Crafting & Forge",
    content: "Visit the FORGE tab to craft weapons and gear. Combine materials to create powerful equipment. Reforge existing gear to upgrade rarity: Common → Uncommon → Rare → Epic → Legendary!",
    icon: <Hammer className="text-orange-500" size={32} />,
    highlight: "forge",
    action: "💡 Higher tier zones drop better crafting materials!",
  },
  {
    id: 9,
    title: "Quests & NPCs",
    content: "Talk to NPCs (look for speech bubbles) to receive quests. Quests reward EXP, Spirit Stones, and special items. Follow the main questline to unlock new zones!",
    icon: <Globe className="text-teal-500" size={32} />,
    highlight: "quests",
    action: "💡 Main quests = Yellow icon | Side quests = Blue icon!",
  },
  {
    id: 10,
    title: "Begin Your Legend!",
    content: "You're ready to walk the Path of Immortality! Start by exploring nearby zones, defeat Training Dummies to practice, and speak to Elder Qingfeng for your first quest. May your Dao be strong!",
    icon: <Heart className="text-pink-500" size={32} />,
    action: "✨ Good luck, Cultivator! The path to immortality awaits!",
  },
];

export const Tutorial: React.FC<TutorialProps> = ({ onComplete, onSkip, playerName }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showConfirmSkip, setShowConfirmSkip] = useState(false);

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const nextStep = () => {
    if (!isLastStep) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 200);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (!isFirstStep) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handleSkip = () => {
    setShowConfirmSkip(true);
  };

  const confirmSkip = () => {
    onSkip();
  };

  return (
    <>
      {/* Full background with video like login/character creation */}
      <div className="fixed inset-0 z-40 bg-[#0a0c10]">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          style={{ minWidth: '100%', minHeight: '100%' }}
        >
          <source src="/background-video.mp4" type="video/mp4" />
        </video>
        
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-[#0a0c10]/60" />
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,200,100,0.12),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(100,150,255,0.08),transparent_50%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c10]/90 via-transparent to-transparent" />
          {/* Floating particles */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-amber-500/40 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
        
        {/* Logo at top */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
          <img 
            src="/logo.png" 
            alt="Língyún Dào" 
            className="h-20 drop-shadow-[0_0_20px_rgba(255,180,50,0.4)]"
          />
        </div>
      </div>

      {/* Skip Confirmation Modal */}
      {showConfirmSkip && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
          <div className="bg-[#1e2430] border-2 border-amber-500/30 rounded-xl p-6 max-w-sm mx-4 text-center">
            <p className="text-white mb-4">Are you sure you want to skip the tutorial?</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowConfirmSkip(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
              >
                Continue Tutorial
              </button>
              <button
                onClick={confirmSkip}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-all"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className={`
          bg-gradient-to-br from-[#1a1f2e] to-[#151820] border-2 border-amber-500/40 rounded-2xl 
          p-6 max-w-lg mx-4 shadow-2xl shadow-amber-500/20 pointer-events-auto
          transition-all duration-200 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
        `}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 uppercase tracking-widest">Tutorial</span>
              <span className="text-xs text-amber-500">
                {currentStep + 1} / {TUTORIAL_STEPS.length}
              </span>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-500 hover:text-white transition-colors p-1"
              title="Skip Tutorial"
            >
              <X size={18} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1 bg-gray-800 rounded-full mb-6 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}
            />
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-500/20 to-amber-700/20 rounded-full flex items-center justify-center">
              {step.icon}
            </div>
            <h2 className="text-xl font-serif font-bold text-amber-400 mb-3">
              {step.title.replace('Young Cultivator', playerName || 'Young Cultivator')}
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              {step.content}
            </p>
          </div>

          {/* Action Hint */}
          {step.action && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-6">
              <p className="text-amber-400 text-sm text-center font-medium flex items-center justify-center gap-2">
                <Lightbulb size={14} /> {step.action}
              </p>
            </div>
          )}

          {/* Feature Highlights for specific steps */}
          
          {/* Step 2: World Navigation Visual */}
          {step.id === 2 && (
            <div className="mb-6 p-4 bg-black/40 rounded-xl border border-blue-500/20">
              <div className="flex items-center justify-center gap-6">
                {/* Mini Map Mockup */}
                <div className="text-center">
                  <div className="grid grid-cols-3 gap-1 p-2 bg-black/60 rounded-lg border border-gray-700">
                    {['○', '○', '○', '○', '●', '○', '○', '○', '○'].map((cell, i) => (
                      <div key={i} className={`w-5 h-5 rounded flex items-center justify-center text-[10px] ${
                        cell === '●' ? 'bg-amber-500/30 text-amber-400' : 'bg-gray-800 text-gray-600'
                      }`}>{cell}</div>
                    ))}
                  </div>
                  <p className="text-[9px] text-gray-500 mt-1">Mini Map</p>
                </div>
                
                {/* Arrow Controls Mockup */}
                <div className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center text-gray-400">↑</div>
                    <div className="flex gap-1">
                      <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center text-gray-400">←</div>
                      <div className="w-8 h-8 bg-red-600/80 rounded flex items-center justify-center text-white text-[10px] font-bold">HUNT</div>
                      <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center text-gray-400">→</div>
                    </div>
                    <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center text-gray-400">↓</div>
                  </div>
                  <p className="text-[9px] text-gray-500 mt-1">Controls</p>
                </div>
                
                {/* Zone Tiers */}
                <div className="text-center">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-[10px] text-gray-400">Tier 1 - Safe</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-[10px] text-gray-400">Tier 2 - PvP</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-[10px] text-gray-400">Tier 3 - Danger</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 3: Combat Visual */}
          {step.id === 3 && (
            <div className="mb-6 p-4 bg-black/40 rounded-xl border border-red-500/20">
              <div className="flex items-center justify-between">
                {/* Player HP/QI */}
                <div className="text-center">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-20 h-3 bg-gray-800 rounded-full overflow-hidden">
                      <div className="w-3/4 h-full bg-gradient-to-r from-red-600 to-red-400" />
                    </div>
                    <span className="text-[10px] text-red-400">HP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-3 bg-gray-800 rounded-full overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-r from-cyan-600 to-cyan-400" />
                    </div>
                    <span className="text-[10px] text-cyan-400">QI</span>
                  </div>
                </div>
                
                {/* VS */}
                <div className="text-amber-500 font-bold text-lg px-4">VS</div>
                
                {/* Skill Hotbar Mockup */}
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="relative">
                      <div className="w-10 h-10 bg-gray-800 rounded-lg border border-amber-500/30 flex items-center justify-center">
                        <Sword size={16} className="text-amber-400" />
                      </div>
                      <span className="absolute -top-1 -left-1 w-4 h-4 bg-black text-amber-400 text-[9px] font-bold rounded flex items-center justify-center">{n}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-[9px] text-gray-500 text-center mt-2">Press 1-4 or click skills to attack!</p>
            </div>
          )}
          
          {/* Step 5: Inventory Visual */}
          {step.id === 5 && (
            <div className="mb-6 p-4 bg-black/40 rounded-xl border border-green-500/20">
              <div className="grid grid-cols-4 gap-3 justify-items-center">
                {[
                  { icon: weaponIcons.sword[1], label: 'Weapon', color: 'text-red-400', bg: 'bg-red-900/30 border-red-500/40' },
                  { icon: accessoryIcons.ring[1], label: 'Ring', color: 'text-purple-400', bg: 'bg-purple-900/30 border-purple-500/40' },
                  { icon: accessoryIcons.necklace[1], label: 'Necklace', color: 'text-cyan-400', bg: 'bg-cyan-900/30 border-cyan-500/40' },
                  { icon: consumableIcons.hp_pill, label: 'Pills', color: 'text-green-400', bg: 'bg-green-900/30 border-green-500/40' },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div className={`w-14 h-14 rounded-lg border flex items-center justify-center mb-1.5 ${item.bg}`}>
                      <img 
                        src={item.icon} 
                        alt={item.label}
                        className="w-8 h-8 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold ${item.color}`}>{item.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-3">Equip better gear to increase your power!</p>
            </div>
          )}

          {step.id === 4 && (
            <div className="grid grid-cols-5 gap-2 mb-6">
              {[
                { name: 'Ox Power', color: 'text-red-400', desc: 'Physical ATK' },
                { name: 'Wind Walk', color: 'text-emerald-400', desc: 'Speed & Crit' },
                { name: 'Golden Body', color: 'text-yellow-400', desc: 'Defense & HP' },
                { name: 'Dao Mind', color: 'text-cyan-400', desc: 'Magic Power' },
                { name: 'Heart Demon', color: 'text-purple-400', desc: 'Resistance' },
              ].map((stat) => (
                <div key={stat.name} className="text-center p-2 bg-black/30 rounded-lg">
                  <p className={`font-bold text-[10px] ${stat.color}`}>{stat.name}</p>
                  <p className="text-[8px] text-gray-500">{stat.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tab hints for navigation */}
          {step.id === 7 && (
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[
                { name: 'World', icon: <Globe size={18} className="text-blue-400" />, desc: 'Explore & Hunt' },
                { name: 'Character', icon: <User size={18} className="text-amber-400" />, desc: 'Stats & Gear' },
                { name: 'Forge', icon: <Hammer size={18} className="text-yellow-400" />, desc: 'Craft & Upgrade' },
              ].map((tab) => (
                <div key={tab.name} className="text-center p-2 bg-black/30 rounded-lg border border-amber-500/20">
                  <div className="flex justify-center mb-1">{tab.icon}</div>
                  <p className="text-xs text-amber-400 font-bold">{tab.name}</p>
                  <p className="text-[9px] text-gray-500">{tab.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={prevStep}
              disabled={isFirstStep}
              className={`
                px-4 py-2 rounded-lg font-medium flex items-center gap-1 transition-all
                ${isFirstStep 
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
                }
              `}
            >
              <ChevronLeft size={16} />
              Back
            </button>

            <div className="flex gap-1">
              {TUTORIAL_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentStep 
                      ? 'bg-amber-500 scale-125' 
                      : idx < currentStep 
                        ? 'bg-amber-500/50' 
                        : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextStep}
              className={`
                px-5 py-2 rounded-lg font-bold flex items-center gap-1 transition-all
                ${isLastStep
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-700 text-white hover:from-emerald-400 hover:to-emerald-600 shadow-lg shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-amber-500 to-amber-700 text-white hover:from-amber-400 hover:to-amber-600'
                }
              `}
            >
              {isLastStep ? (
                <>
                  <Check size={16} />
                  Start Playing
                </>
              ) : (
                <>
                  Next
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Tutorial;
