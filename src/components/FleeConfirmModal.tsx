// ============================================
// FLEE CONFIRMATION MODAL - 凌云道 (Língyún Dào)
// Modal displayed when confirmBeforeFlee is enabled
// ============================================

import React from 'react';
import { AlertTriangle, Footprints, X } from 'lucide-react';

interface FleeConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  mobName?: string;
}

export const FleeConfirmModal: React.FC<FleeConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  mobName = 'the enemy',
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div 
        className="bg-gradient-to-b from-[#1a1d28] to-[#12151c] border-2 border-amber-500/40 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          {/* Header Icon */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Footprints size={32} className="text-amber-400" />
          </div>
          
          {/* Title */}
          <h3 className="text-xl font-bold text-white mb-2">Flee from Combat?</h3>
          
          {/* Description */}
          <p className="text-gray-400 text-sm mb-6">
            Are you sure you want to attempt to flee from <strong className="text-amber-400">{mobName}</strong>? 
            There's a <span className="text-red-400 font-medium">20% chance</span> the attempt will fail.
          </p>
          
          {/* Warning */}
          <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 mb-6 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-400 flex-shrink-0" />
            <p className="text-xs text-amber-300/80 text-left">
              If you fail to flee, you'll remain in combat and the enemy may attack.
            </p>
          </div>
          
          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium transition-all"
            >
              Stay & Fight
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold transition-all flex items-center justify-center gap-2"
            >
              <Footprints size={18} />
              Flee
            </button>
          </div>
          
          {/* Tip */}
          <p className="text-[10px] text-gray-600 mt-4">
            Tip: Disable this confirmation in Settings → Combat
          </p>
        </div>
      </div>
    </div>
  );
};

export default FleeConfirmModal;
