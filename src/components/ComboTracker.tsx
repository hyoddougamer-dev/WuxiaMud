// ============================================
// COMBO TRACKER - 凌云道 (Língyún Dào)
// Visual feedback for skill combo progress
// ============================================

import React from 'react';
import { Sparkles } from 'lucide-react';
import { SkillCombo } from '../data/comboSystem';

interface ComboTrackerProps {
  activeCombo: SkillCombo | null;
  currentStep: number;
  startTime: number;
  possibleCombos: SkillCombo[];
}

export const ComboTracker: React.FC<ComboTrackerProps> = ({
  activeCombo,
  currentStep,
  startTime,
  possibleCombos,
}) => {
  // Don't show if no active or possible combos
  if (!activeCombo && possibleCombos.length === 0) {
    return null;
  }

  const combo = activeCombo || possibleCombos[0];
  if (!combo) return null;

  const now = Date.now();
  const elapsed = now - startTime;
  const timeLeft = Math.max(0, combo.timeWindow - elapsed);
  const timeProgress = (timeLeft / combo.timeWindow) * 100;

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className="bg-gradient-to-r from-amber-900/80 to-orange-900/80 backdrop-blur-sm border border-amber-500/50 rounded-lg px-4 py-2 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
        {/* Combo Name */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{combo.icon}</span>
          <div>
            <div className="text-amber-300 font-bold text-sm">{combo.nameZh}</div>
            <div className="text-amber-400/80 text-xs">{combo.name}</div>
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex gap-2 mb-2">
          {combo.sequence.map((skill: string, idx: number) => {
            const isComplete = idx < currentStep;
            const isCurrent = idx === currentStep;
            
            return (
              <div
                key={idx}
                className={`w-3 h-3 rounded-full transition-all ${
                  isComplete
                    ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                    : isCurrent
                    ? 'bg-amber-500 animate-pulse shadow-[0_0_12px_rgba(251,191,36,1)]'
                    : 'bg-gray-600/50'
                }`}
              />
            );
          })}
        </div>

        {/* Time Bar */}
        <div className="h-1 bg-gray-800/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-100 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
            style={{ width: `${timeProgress}%` }}
          />
        </div>

        {/* Effect Preview */}
        {possibleCombos.length > 0 && (
          <div className="text-xs text-amber-300/70 mt-1 text-center">
            {combo.description}
          </div>
        )}
      </div>
    </div>
  );
};

// Combo Completion Effect - Big celebration
interface ComboCompleteProps {
  combo: SkillCombo;
  onComplete: () => void;
}

export const ComboCompleteEffect: React.FC<ComboCompleteProps> = ({ combo, onComplete }) => {
  React.useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
      <div className="animate-combo-explosion">
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white font-black text-4xl px-8 py-6 rounded-2xl border-4 border-amber-300 shadow-[0_0_60px_rgba(251,191,36,0.8)]">
          <div className="flex items-center gap-4">
            <span className="text-6xl animate-star-burst">{combo.icon}</span>
            <div>
              <div className="text-sm uppercase tracking-widest text-amber-200 flex items-center justify-center gap-2">
                <Sparkles size={14} /> COMBO! <Sparkles size={14} />
              </div>
              <div className="text-3xl">{combo.nameZh}</div>
              <div className="text-xl text-amber-200">{combo.name}</div>
            </div>
            <span className="text-6xl animate-star-burst">{combo.icon}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
