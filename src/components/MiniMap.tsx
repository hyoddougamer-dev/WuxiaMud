import React from 'react';
import { worldMap } from '../data/constants';

interface MiniMapProps {
  coords: { x: number; y: number };
  setMapOpen: (open: boolean) => void;
}

const MiniMap: React.FC<MiniMapProps> = ({ coords, setMapOpen }) => {
  const grid = [];
  for (let y = coords.y + 1; y >= coords.y - 1; y--) {
      for (let x = coords.x - 1; x <= coords.x + 1; x++) {
          const key = `${x},${y}`;
          const loc = worldMap[key as keyof typeof worldMap];
          const isPlayer = x === coords.x && y === coords.y;
          grid.push(
              <div 
                  key={key} 
                  className={`w-6 h-6 flex items-center justify-center border border-white/5 rounded-sm ${isPlayer ? 'bg-amber-500/20 border-amber-500' : 'bg-black/40'}`}
              >
                  {loc && <div className={`w-2 h-2 rounded-full ${loc.tier===1?'bg-emerald-500':loc.tier===2?'bg-amber-500':'bg-red-600'} ${isPlayer?'animate-pulse':''}`}></div>}
              </div>
          );
      }
  }
  return (
      <div 
          className="grid grid-cols-3 gap-0.5 bg-black/80 p-1 rounded border border-white/10 cursor-pointer hover:border-amber-500" 
          onClick={() => setMapOpen(true)}
      >
          {grid}
      </div>
  );
};

export default MiniMap;
