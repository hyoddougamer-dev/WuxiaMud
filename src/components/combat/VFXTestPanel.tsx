// =====================================================
// VFX TEST COMPONENT - Para testar os efeitos visuais
// =====================================================

import React, { useState } from 'react';
import { QuickVFX, VFX_PRESETS, useVFXManager } from './VFXSprite';

type ColorType = 'fire' | 'ice' | 'lightning' | 'poison' | 'void' | 'heal';

const COLORS: ColorType[] = ['fire', 'ice', 'lightning', 'poison', 'void', 'heal'];

export const VFXTestPanel: React.FC = () => {
  const { spawnVFX, VFXLayer } = useVFXManager();
  const [selectedColor, setSelectedColor] = useState<ColorType>('fire');
  const [scale, setScale] = useState(2);

  const presetNames = Object.keys(VFX_PRESETS) as (keyof typeof VFX_PRESETS)[];

  const handleSpawnVFX = (type: keyof typeof VFX_PRESETS) => {
    // Spawn at center of test area
    spawnVFX(type, 300, 200, { scale, color: selectedColor });
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 overflow-auto">
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-amber-400">🔥 VFX Test Panel</h1>
        <p className="text-gray-400 text-sm mt-1">
          Spritesheet: 512×1536 (8×24 frames, 64×64 cada)
        </p>
      </div>

      <div className="flex">
        {/* Controls */}
        <div className="w-64 bg-gray-800 p-4 border-r border-gray-700">
          {/* Color Selection */}
          <div className="mb-6">
            <h3 className="text-white font-bold mb-2">🎨 Cor</h3>
            <div className="grid grid-cols-3 gap-2">
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-2 py-1 rounded text-sm font-medium capitalize transition-all ${
                    selectedColor === color
                      ? 'bg-amber-500 text-black'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Scale Slider */}
          <div className="mb-6">
            <h3 className="text-white font-bold mb-2">📐 Escala: {scale}x</h3>
            <input
              type="range"
              min="0.5"
              max="4"
              step="0.5"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* VFX Buttons */}
          <div className="space-y-2">
            <h3 className="text-white font-bold mb-2">⚡ Efeitos</h3>
            {presetNames.map(name => (
              <button
                key={name}
                onClick={() => handleSpawnVFX(name)}
                className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-sm text-left transition-all"
              >
                {name.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 relative" style={{ minHeight: '500px' }}>
          {/* Dark background to see effects */}
          <div className="absolute inset-0 bg-black">
            {/* Grid lines for reference */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)',
                backgroundSize: '64px 64px'
              }}
            />
            
            {/* Center crosshair */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-4 h-0.5 bg-red-500 absolute left-1/2 -translate-x-1/2" />
              <div className="w-0.5 h-4 bg-red-500 absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2" />
            </div>
            
            {/* VFX Layer */}
            <VFXLayer />
          </div>

          {/* Click anywhere to spawn */}
          <div 
            className="absolute inset-0 cursor-crosshair"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              spawnVFX('explosion_large', x, y, { scale, color: selectedColor });
            }}
          />

          {/* Instructions */}
          <div className="absolute bottom-4 left-4 right-4 bg-gray-800/80 p-3 rounded-lg">
            <p className="text-gray-300 text-sm">
              👆 Clica em qualquer lugar para spawnar explosão | 
              🎮 Usa os botões à esquerda para outros efeitos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VFXTestPanel;
