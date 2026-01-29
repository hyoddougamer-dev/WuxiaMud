// ============================================
// CHARACTER CREATION - 凌云道 (Língyún Dào)
// Premium character creation wizard
// ============================================

import React, { useState } from 'react';
import { User, Sword, Sparkles, ChevronRight, ChevronLeft, Check, Star, Flame, Wind, Shield, Zap, ArrowLeft, Home, Snowflake, Skull, Leaf, Music, Moon, Gem, Dog } from 'lucide-react';
import { hybridClassSystem } from '../data/hybridClasses';
import { avatarList } from '../data/constants';
import { getClassSkills } from '../data/skillSystem';
import { getPlayerSprite } from '../data/combatAssets';
import { ELEMENT_ICON_PATHS } from '../data/elementSystem';

// Helper to get skill icon path
const getSkillIconPath = (skill: any): string => {
  if (!skill) return '';
  const elementFolderMap: Record<string, string> = {
    'Fire': 'fire',
    'Ice': 'ice',
    'Lightning': 'lightning',
    'Wood': 'wood',
    'Void': 'void',
    'None': 'universal'
  };
  const folder = elementFolderMap[skill.element] || 'universal';
  return `/assets/combat/skills/${folder}/${skill.id.toLowerCase()}.png`;
};

interface CharacterCreationProps {
  onComplete: (characterData: {
    name: string;
    avatar: string;
    selectedClass: number;
  }) => void;
  onBack?: () => void; // Optional callback to go back to character selection
}

const WUXIA_NAME_PREFIXES = [
  "Xiao", "Lin", "Chen", "Wei", "Zhang", "Liu", "Wang", "Li", "Feng", "Long",
  "Bai", "Yun", "Shan", "Tian", "Ming", "Qing", "Hong", "Lan", "Yu", "Huo"
];

const WUXIA_NAME_SUFFIXES = [
  "Chen", "Wei", "Feng", "Long", "Yun", "Shan", "Ming", "Hao", "Lei", "Jian",
  "Xue", "Ling", "Yang", "Zhi", "Ren", "Wu", "Kai", "Jun", "Bo", "Tao"
];

// Class category colors and info
const getClassCategory = (id: number) => {
  if (id <= 4) return { name: 'Sword', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: Sword };
  if (id <= 8) return { name: 'Saber', color: 'from-red-500 to-orange-500', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: Sword };
  return { name: 'Zither', color: 'from-purple-500 to-pink-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: Music };
};

const getElementColor = (element: string) => {
  const colors: Record<string, string> = {
    'Fire': 'text-orange-400 bg-orange-500/20 border-orange-500/40',
    'Ice': 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40',
    'Lightning': 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40',
    'Poison': 'text-green-400 bg-green-500/20 border-green-500/40',
    'Wind': 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40',
    'Earth': 'text-amber-400 bg-amber-500/20 border-amber-500/40',
    'Nature': 'text-lime-400 bg-lime-500/20 border-lime-500/40',
    'Beast': 'text-orange-400 bg-orange-500/20 border-orange-500/40',
    'Void': 'text-purple-400 bg-purple-500/20 border-purple-500/40',
    'Shadow': 'text-gray-400 bg-gray-500/20 border-gray-500/40',
    'Holy': 'text-amber-300 bg-amber-400/20 border-amber-400/40',
  };
  return colors[element] || 'text-gray-400 bg-gray-500/20 border-gray-500/40';
};

export const CharacterCreation: React.FC<CharacterCreationProps> = ({ onComplete, onBack }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(avatarList[0]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredClass, setHoveredClass] = useState<number | null>(null);
  const [avatarGender, setAvatarGender] = useState<'male' | 'female'>('male');

  // Separate avatars by gender (first 10 are male, last 10 are female)
  const maleAvatars = avatarList.slice(0, 10);
  const femaleAvatars = avatarList.slice(10, 20);

  const generateRandomName = () => {
    const prefix = WUXIA_NAME_PREFIXES[Math.floor(Math.random() * WUXIA_NAME_PREFIXES.length)];
    const suffix = WUXIA_NAME_SUFFIXES[Math.floor(Math.random() * WUXIA_NAME_SUFFIXES.length)];
    setName(`${prefix} ${suffix}`);
  };

  const nextStep = () => {
    if (step < 3) {
      setIsAnimating(true);
      setTimeout(() => {
        setStep(step + 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setStep(step - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const canProceed = () => {
    if (step === 1) return name.trim().length >= 2;
    if (step === 2) return selectedAvatar !== null;
    if (step === 3) return selectedClass !== null;
    return false;
  };

  const handleComplete = () => {
    if (name && selectedAvatar && selectedClass) {
      onComplete({
        name: name.trim(),
        avatar: selectedAvatar,
        selectedClass: selectedClass,
      });
    }
  };

  const getClassIcon = (id: number) => {
    const icons = [Flame, Snowflake, Sparkles, Skull, Zap, Shield, Leaf, Dog, Flame, Music, Moon, Gem];
    const IconComponent = icons[id - 1] || Sword;
    return <IconComponent size={16} />;
  };

  const displayClass = selectedClass ? hybridClassSystem.find(c => c.id === selectedClass) : 
                       hoveredClass ? hybridClassSystem.find(c => c.id === hoveredClass) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#0a0c10]">
      {/* Video Background - fills entire window */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-70"
        style={{ minWidth: '100%', minHeight: '100%' }}
      >
        <source src="/background-video.mp4" type="video/mp4" />
      </video>
      
      {/* Base dark overlay - very light to let video shine */}
      <div className="absolute inset-0 bg-[#0a0c10]/20" />
      
      {/* Epic gradient overlays - subtle */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-transparent to-purple-900/10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c10]/40 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,200,100,0.08),transparent_60%)]" />
      
      {/* Golden floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full ${i % 3 === 0 ? 'bg-amber-400/40' : i % 3 === 1 ? 'bg-yellow-300/30' : 'bg-orange-400/25'}`}
            style={{
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              left: `${5 + Math.random() * 90}%`,
              top: `${5 + Math.random() * 90}%`,
              animation: `float-particle ${5 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Scrollable content wrapper */}
      <div className="relative w-full h-full overflow-y-auto custom-scrollbar py-8">
        <div className="w-full max-w-5xl mx-auto px-4">
        {/* Back to Character Selection Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="absolute -top-2 left-0 flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-amber-400 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Characters
          </button>
        )}

        {/* Header - Cleaner design */}
        <div className="text-center mb-6 pt-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-amber-500/50" />
            <Sparkles className="text-amber-500" size={20} />
            <div className="w-8 h-0.5 bg-gradient-to-l from-transparent to-amber-500/50" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1 tracking-wide">
            Create Your Cultivator
          </h1>
          <p className="text-gray-500 text-sm">Begin your path to immortality</p>
        </div>

        {/* Progress Steps - Minimal design */}
        <div className="flex justify-center items-center gap-3 mb-8">
          {[
            { num: 1, label: 'Identity' },
            { num: 2, label: 'Appearance' },
            { num: 3, label: 'Path' }
          ].map((s, i) => (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center gap-1">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                  ${step > s.num 
                    ? 'bg-amber-500 text-white' 
                    : step === s.num 
                      ? 'bg-amber-500/20 text-amber-400 border-2 border-amber-500' 
                      : 'bg-[#1a1d28] text-gray-600 border border-gray-700/50'
                  }
                `}>
                  {step > s.num ? <Check size={16} /> : s.num}
                </div>
                <span className={`text-[10px] font-medium ${step >= s.num ? 'text-amber-400' : 'text-gray-600'}`}>
                  {s.label}
                </span>
              </div>
              {i < 2 && (
                <div className={`w-20 h-0.5 mb-4 transition-all duration-300 ${step > s.num ? 'bg-amber-500' : 'bg-gray-800'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Content Card - Semi-transparent to show video */}
        <div className={`
          bg-[#12151c]/85 backdrop-blur-sm border border-gray-700/60 rounded-2xl shadow-2xl overflow-hidden
          transition-all duration-200
          ${isAnimating ? 'opacity-0 scale-98' : 'opacity-100 scale-100'}
        `}>
          
          {/* STEP 1: Name */}
          {step === 1 && (
            <div className="p-8">
              <div className="max-w-lg mx-auto">
                <div className="text-center mb-8">
                  {/* Epic golden gradient icon */}
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 opacity-20 blur-xl animate-pulse" />
                    <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-amber-500/30 via-yellow-500/20 to-amber-600/30 flex items-center justify-center border border-amber-400/40 shadow-lg shadow-amber-500/20">
                      <User className="text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" size={32} />
                    </div>
                    {/* Decorative sparkles */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-ping opacity-60" />
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-yellow-300 rounded-full animate-ping opacity-40" style={{ animationDelay: '0.3s' }} />
                  </div>
                  <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 mb-2">Choose Your Name</h2>
                  <p className="text-gray-400 text-sm">How shall the martial world know you?</p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name..."
                      maxLength={20}
                      className="w-full px-5 py-4 bg-[#0a0c10] border border-gray-700/50 rounded-xl text-white text-lg text-center focus:outline-none focus:border-amber-500/50 focus:bg-[#0d0f14] transition-all placeholder-gray-600"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-600">
                      {name.length}/20
                    </span>
                  </div>

                  <button
                    onClick={generateRandomName}
                    className="w-full py-3 bg-[#1a1d28] border border-gray-700/50 rounded-xl text-gray-300 hover:text-amber-400 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all flex items-center justify-center gap-2 group"
                  >
                    <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
                    Generate Random Name
                  </button>

                  <div className="bg-[#1a1d28]/50 border border-gray-800/50 rounded-xl p-4 mt-6">
                    <p className="text-xs text-gray-400 mb-2 font-medium flex items-center gap-1"><Sparkles size={12} /> Naming Tips:</p>
                    <ul className="text-xs text-gray-500 space-y-1">
                      <li>• Traditional: Family Name + Given Name (e.g., Xiao Chen)</li>
                      <li>• Single names work too (e.g., Shadowblade)</li>
                      <li>• 2-20 characters allowed</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Avatar */}
          {step === 2 && (
            <div className="p-8">
              <div className="text-center mb-6">
                {/* Epic purple gradient icon */}
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-400 via-pink-500 to-purple-600 opacity-20 blur-xl animate-pulse" />
                  <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-purple-500/30 via-pink-500/20 to-purple-600/30 flex items-center justify-center border border-purple-400/40 shadow-lg shadow-purple-500/20">
                    <Star className="text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" size={32} />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-ping opacity-60" />
                </div>
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-400 to-purple-200 mb-2">Choose Your Appearance</h2>
                <p className="text-gray-400 text-sm">Select an avatar that represents you</p>
              </div>

              {/* Selected Avatar Preview */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 opacity-30 blur-lg animate-pulse" />
                  <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-amber-500 shadow-xl shadow-amber-500/30">
                    <img 
                      src={selectedAvatar} 
                      alt="Selected"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full text-[10px] font-bold text-white shadow-lg shadow-amber-500/30">
                    ✨ SELECTED
                  </div>
                </div>
              </div>

              {/* Gender Tabs */}
              <div className="flex justify-center gap-2 mb-4">
                <button
                  onClick={() => {
                    setAvatarGender('male');
                    if (!maleAvatars.includes(selectedAvatar)) {
                      setSelectedAvatar(maleAvatars[0]);
                    }
                  }}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                    avatarGender === 'male'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-[#1a1d28] text-gray-400 hover:text-white hover:bg-[#252a38] border border-gray-700/50'
                  }`}
                >
                  <span>♂</span> Male
                </button>
                <button
                  onClick={() => {
                    setAvatarGender('female');
                    if (!femaleAvatars.includes(selectedAvatar)) {
                      setSelectedAvatar(femaleAvatars[0]);
                    }
                  }}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                    avatarGender === 'female'
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30'
                      : 'bg-[#1a1d28] text-gray-400 hover:text-white hover:bg-[#252a38] border border-gray-700/50'
                  }`}
                >
                  <span>♀</span> Female
                </button>
              </div>

              {/* Avatar Grid - Based on selected gender */}
              <div className="grid grid-cols-5 gap-3 p-4 bg-[#0a0c10]/50 rounded-xl border border-gray-800/50">
                {(avatarGender === 'male' ? maleAvatars : femaleAvatars).map((avatar, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`
                      relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 hover:z-10 group
                      ${selectedAvatar === avatar 
                        ? 'border-amber-500 shadow-lg shadow-amber-500/40 ring-4 ring-amber-500/20' 
                        : 'border-gray-700/50 hover:border-gray-500 hover:shadow-lg hover:shadow-white/10'
                      }
                    `}
                  >
                    <img 
                      src={avatar} 
                      alt={`Avatar ${index + 1}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                    />
                    {selectedAvatar === avatar && (
                      <div className="absolute inset-0 bg-amber-500/10 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
                          <Check size={14} className="text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              <p className="text-center text-xs text-gray-500 mt-4">
                {avatarGender === 'male' ? '10 male avatars available' : '10 female avatars available'}
              </p>
            </div>
          )}

          {/* STEP 3: Class Selection */}
          {step === 3 && (
            <div className="flex flex-col lg:flex-row">
              {/* Class Grid */}
              <div className="flex-1 p-6 border-b lg:border-b-0 lg:border-r border-gray-800/50">
                <div className="text-center mb-4 lg:hidden">
                  <h2 className="text-xl font-bold text-white mb-1">Choose Your Path</h2>
                  <p className="text-gray-500 text-sm">Select a martial discipline</p>
                </div>

                {/* Class Categories */}
                {['Sword', 'Saber', 'Zither'].map((category, catIndex) => {
                  const categoryClasses = hybridClassSystem.filter((_, i) => 
                    catIndex === 0 ? i < 4 : catIndex === 1 ? i >= 4 && i < 8 : i >= 8
                  );
                  const catInfo = getClassCategory(catIndex === 0 ? 1 : catIndex === 1 ? 5 : 9);
                  
                  return (
                    <div key={category} className="mb-4 last:mb-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm"><catInfo.icon size={14} /></span>
                        <span className={`text-xs font-bold uppercase tracking-wider bg-gradient-to-r ${catInfo.color} bg-clip-text text-transparent`}>
                          {category} Arts
                        </span>
                        <div className="flex-1 h-px bg-gray-800" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {categoryClasses.map((cls) => (
                          <button
                            key={cls.id}
                            onClick={() => setSelectedClass(cls.id)}
                            onMouseEnter={() => setHoveredClass(cls.id)}
                            onMouseLeave={() => setHoveredClass(null)}
                            className={`
                              relative p-3 rounded-xl border transition-all text-left group
                              ${selectedClass === cls.id 
                                ? `${catInfo.bg} ${catInfo.border} border-2` 
                                : 'bg-[#1a1d28]/50 border-gray-800/50 hover:border-gray-600'
                              }
                            `}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getClassIcon(cls.id)}</span>
                              <div className="flex-1 min-w-0">
                                <div className={`font-bold text-sm truncate ${selectedClass === cls.id ? 'text-white' : 'text-gray-300'}`}>
                                  {cls.name}
                                </div>
                                <div className={`text-[10px] px-1.5 py-0.5 rounded ${getElementColor(cls.element)}`}>
                                  {cls.element}
                                </div>
                              </div>
                            </div>
                            
                            {selectedClass === cls.id && (
                              <div className="absolute top-1 right-1">
                                <Check size={14} className="text-amber-400" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Class Details Panel */}
              <div className="lg:w-80 p-6 bg-[#0a0c10]/30">
                <div className="hidden lg:block text-center mb-4">
                  <h2 className="text-lg font-bold text-white mb-1">Class Details</h2>
                  <p className="text-gray-600 text-xs">Hover or select to see info</p>
                </div>

                {displayClass ? (
                  <div className="space-y-4">
                    {/* Class Sprite Preview */}
                    <div className="flex justify-center">
                      <div className="relative">
                        <img 
                          src={getPlayerSprite(displayClass.id)}
                          alt={displayClass.name}
                          className="h-40 w-auto object-contain drop-shadow-[0_0_20px_rgba(251,191,36,0.3)]"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        {/* Glow effect under sprite */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-amber-500/20 rounded-full blur-lg" />
                      </div>
                    </div>
                    
                    {/* Class Header */}
                    <div className="text-center p-4 bg-[#1a1d28]/50 rounded-xl border border-gray-800/50">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <span className="text-2xl">{getClassIcon(displayClass.id)}</span>
                        <h3 className="text-xl font-bold text-white">{displayClass.name}</h3>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full border ${getElementColor(displayClass.element)}`}>
                        {displayClass.element} Affinity
                      </span>
                    </div>

                    {/* Passive Ability */}
                    <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={14} className="text-purple-400" />
                        <span className="text-xs font-bold text-purple-400 uppercase">Passive Ability</span>
                      </div>
                      <h4 className="font-bold text-white text-sm mb-1">{displayClass.passive.name}</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">{displayClass.passive.description}</p>
                    </div>

                    {/* Class Skills with Tooltips */}
                    <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Sword size={14} className="text-cyan-400" />
                        <span className="text-xs font-bold text-cyan-400 uppercase">Class Skills</span>
                      </div>
                      <div className="space-y-2">
                        {getClassSkills(displayClass.id).slice(0, 4).map((skill: any, i: number) => (
                          <div 
                            key={i} 
                            className="group relative flex items-center gap-2 p-2 bg-black/30 rounded-lg border border-cyan-500/10 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all cursor-help"
                          >
                            <div className="w-8 h-8 rounded-lg bg-black/40 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              <img 
                                src={getSkillIconPath(skill)} 
                                alt={skill.name}
                                className="w-7 h-7 object-contain"
                                onError={(e) => { 
                                  (e.target as HTMLImageElement).style.display = 'none'; 
                                }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-cyan-300 truncate">{skill.name}</p>
                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${
                                  skill.unlockLevel <= 1 ? 'bg-green-500/20 text-green-400' : 
                                  skill.unlockLevel <= 10 ? 'bg-amber-500/20 text-amber-400' : 
                                  'bg-red-500/20 text-red-400'
                                }`}>
                                  Lv.{skill.unlockLevel || 1}
                                </span>
                              </div>
                              <p className="text-[9px] text-gray-500 truncate">
                                {skill.damage ? `${skill.damage} DMG` : 'Utility'} • {skill.qiCost} QI • CD: {skill.cooldown || 0}s
                              </p>
                            </div>
                            
                            {/* Tooltip on hover - positioned to the left */}
                            <div className="absolute right-full mr-2 top-0 z-50 w-56 p-3 bg-[#0d0f14] border border-cyan-500/40 rounded-lg shadow-xl shadow-black/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none">
                              <div className="flex items-center gap-2 mb-2">
                                <img 
                                  src={getSkillIconPath(skill)} 
                                  alt={skill.name}
                                  className="w-8 h-8 object-contain"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                                <div>
                                  <p className="font-bold text-cyan-300">{skill.name}</p>
                                  <p className="text-[9px] text-gray-500">Unlock: Level {skill.unlockLevel || 1}</p>
                                </div>
                              </div>
                              <p className="text-xs text-gray-400 mb-2">{skill.description || 'No description available.'}</p>
                              <div className="grid grid-cols-3 gap-1 text-[9px]">
                                <div className="bg-red-500/10 rounded p-1 text-center">
                                  <span className="text-red-400">{skill.damage || 0}</span>
                                  <p className="text-gray-500">DMG</p>
                                </div>
                                <div className="bg-cyan-500/10 rounded p-1 text-center">
                                  <span className="text-cyan-400">{skill.qiCost}</span>
                                  <p className="text-gray-500">QI</p>
                                </div>
                                <div className="bg-amber-500/10 rounded p-1 text-center">
                                  <span className="text-amber-400">{skill.cooldown || 0}s</span>
                                  <p className="text-gray-500">CD</p>
                                </div>
                              </div>
                              {/* Arrow pointing right */}
                              <div className="absolute right-0 top-3 translate-x-full border-8 border-transparent border-l-cyan-500/40"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-600">
                    <Sword size={48} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Select a class to see details</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="flex justify-between items-center p-6 border-t border-gray-800/50 bg-[#0d0f14]">
            <button
              onClick={step === 1 && onBack ? onBack : prevStep}
              className={`
                px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all text-sm
                ${step === 1 && !onBack
                  ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed' 
                  : 'bg-[#1a1d28] text-gray-300 hover:text-white hover:bg-[#252a38] border border-gray-700/50'
                }
              `}
              disabled={step === 1 && !onBack}
            >
              <ChevronLeft size={16} />
              {step === 1 && onBack ? 'Cancel' : 'Back'}
            </button>

            {step < 3 ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className={`
                  px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all text-sm
                  ${canProceed()
                    ? 'bg-amber-500 text-white hover:bg-amber-400 shadow-lg shadow-amber-500/20'
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  }
                `}
              >
                Continue
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!canProceed()}
                className={`
                  px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all text-sm
                  ${canProceed()
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/20'
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  }
                `}
              >
                <Sparkles size={16} />
                Begin Journey
              </button>
            )}
          </div>
        </div>

        {/* Footer tip */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-600">
            Your progress will be saved automatically
          </p>
        </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterCreation;
