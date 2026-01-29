// ============================================
// DEATH MODAL - WuxiaMUD
// Shows death penalties and consequences
// ============================================

import React, { useEffect, useState } from 'react';
import { Skull, AlertTriangle, XCircle, Wrench, Zap, Star, RefreshCw } from 'lucide-react';

interface DeathPenalty {
  xpLost: number;
  xpPercent: number;
  durabilityLost: number;
  damagedGear: { slot: string; name: string; newDurability: number }[];
  killedBy: string;
}

interface DeathModalProps {
  isOpen: boolean;
  penalty: DeathPenalty | null;
  onClose: () => void;
}

export const DeathModal: React.FC<DeathModalProps> = ({
  isOpen,
  penalty,
  onClose
}) => {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setAnimateIn(true), 50);
    } else {
      setAnimateIn(false);
    }
  }, [isOpen]);

  if (!isOpen || !penalty) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      {/* Blood drip effect on edges */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-red-900/50 to-transparent"></div>
      </div>

      {/* Modal */}
      <div className={`bg-gradient-to-b from-[#1a0a0a] to-[#0a0606] border-2 border-red-900/80 rounded-2xl shadow-2xl w-[420px] overflow-hidden transition-all duration-500 ${animateIn ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
        
        {/* Header - Death Theme */}
        <div className="relative">
          {/* Pulsing red glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/30 via-red-800/20 to-red-900/30 animate-pulse"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
          
          <div className="relative px-6 py-6 border-b border-red-900/50 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-red-800 to-red-950 flex items-center justify-center shadow-lg shadow-red-500/30 border-2 border-red-700/50">
              <Skull className="text-red-300" size={36} />
            </div>
            <h2 className="text-2xl font-bold text-red-400 font-serif tracking-wide">You Have Fallen</h2>
            <p className="text-sm text-red-300/70 mt-1">
              Defeated by: <span className="text-red-200 font-semibold">{penalty.killedBy}</span>
            </p>
          </div>
        </div>

        {/* Penalties Section */}
        <div className="p-5 space-y-4">
          {/* Warning Banner */}
          <div className="bg-red-950/50 border border-red-800/50 rounded-xl p-3 flex items-center gap-3">
            <AlertTriangle className="text-red-400 flex-shrink-0" size={20} />
            <p className="text-sm text-red-300">
              Death carries consequences on the path to immortality.
            </p>
          </div>

          {/* XP Loss */}
          <div className="bg-[#151010] border border-red-900/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-900/30 flex items-center justify-center border border-amber-700/30">
                  <Star className="text-amber-400" size={20} />
                </div>
                <div>
                  <span className="text-amber-300 text-sm font-medium">Experience Lost</span>
                  <p className="text-[10px] text-amber-400/60">{penalty.xpPercent}% of current progress</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-red-400">-{penalty.xpLost.toLocaleString()}</span>
            </div>
          </div>

          {/* Durability Loss */}
          <div className="bg-[#151010] border border-red-900/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-orange-900/30 flex items-center justify-center border border-orange-700/30">
                <Wrench className="text-orange-400" size={20} />
              </div>
              <div>
                <span className="text-orange-300 text-sm font-medium">Equipment Damaged</span>
                <p className="text-[10px] text-orange-400/60">-{penalty.durabilityLost}% durability to all gear</p>
              </div>
            </div>

            {penalty.damagedGear.length > 0 && (
              <div className="space-y-2 mt-3 pt-3 border-t border-orange-900/30">
                {penalty.damagedGear.map((gear, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 capitalize">{gear.slot}:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300">{gear.name}</span>
                      <div className="flex items-center gap-1">
                        <div className={`w-12 h-1.5 bg-gray-700 rounded-full overflow-hidden`}>
                          <div 
                            className={`h-full transition-all ${
                              gear.newDurability > 50 ? 'bg-green-500' :
                              gear.newDurability > 25 ? 'bg-yellow-500' :
                              gear.newDurability > 0 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${gear.newDurability}%` }}
                          />
                        </div>
                        <span className={`font-mono w-8 text-right ${
                          gear.newDurability > 50 ? 'text-green-400' :
                          gear.newDurability > 25 ? 'text-yellow-400' :
                          gear.newDurability > 0 ? 'text-orange-400' : 'text-red-400'
                        }`}>{gear.newDurability}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Warning for low durability */}
            {penalty.damagedGear.some(g => g.newDurability <= 0) && (
              <div className="mt-3 bg-red-900/30 border border-red-500/50 rounded-lg p-2 flex items-center gap-2">
                <XCircle size={14} className="text-red-400" />
                <span className="text-xs text-red-300">Some gear is broken! Visit the Blacksmith to repair.</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-red-900/30 bg-[#0a0606]">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-red-800 to-red-700 hover:from-red-700 hover:to-red-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 hover:shadow-red-500/40"
          >
            <RefreshCw size={18} />
            Rise Again
          </button>
          <p className="text-center text-[10px] text-gray-500 mt-2">
            Your HP has been restored to 1. Seek healing before continuing.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeathModal;
