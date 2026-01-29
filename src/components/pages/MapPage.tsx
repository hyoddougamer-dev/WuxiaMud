import React from 'react';
import { Map } from 'lucide-react';

export const MapPage: React.FC = () => {
  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800/40 to-slate-800/40 border-2 border-gray-600/40 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <Map className="text-gray-400" size={32} />
            <div>
              <h2 className="text-2xl font-bold text-gray-300 font-serif">World Map</h2>
              <p className="text-sm text-gray-400">Navigate the cultivation realm</p>
            </div>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="bg-black/60 border-2 border-gray-600/30 rounded-xl p-12 text-center">
          <Map className="mx-auto text-gray-500 mb-6" size={64} />
          <h3 className="text-2xl font-bold text-gray-300 mb-3">World Map Coming Soon</h3>
          <p className="text-gray-400 mb-6">
            Explore zones, track locations, and plan your cultivation journey
          </p>
          <div className="max-w-md mx-auto text-left bg-black/40 border border-gray-600/20 rounded-lg p-4">
            <p className="text-sm text-gray-300 mb-2 font-bold">Planned Features:</p>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Interactive zone map (22 zones)</li>
              <li>• Current location marker</li>
              <li>• Mob level ranges per zone</li>
              <li>• Zone unlock progression</li>
              <li>• Fast travel system</li>
              <li>• Points of interest</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
