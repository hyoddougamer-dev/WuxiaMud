import React, { useState, useEffect } from 'react';
import { Compass, X, Plus, Minus, User, Shield, AlertTriangle, Lock } from 'lucide-react';
import { worldMap, zoneImages } from '../data/constants';

interface VisualWorldMapProps {
  coords: { x: number; y: number };
  setCoords: (coords: { x: number; y: number }) => void;
  player: any;
  setMapOpen: (open: boolean) => void;
  onTravel: (x: number, y: number) => void;
}

const VisualWorldMap: React.FC<VisualWorldMapProps> = ({ coords, setCoords, player, setMapOpen, onTravel }) => {
    const [view, setView] = useState({ x: -coords.x * 120, y: coords.y * 120, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

    useEffect(() => {
        setView(prev => ({ ...prev, x: -coords.x * 120, y: coords.y * 120 }));
    }, []);

    const handleWheel = (e: React.WheelEvent) => {
        const scaleAmount = -e.deltaY * 0.001;
        const newScale = Math.min(Math.max(view.scale + scaleAmount, 0.4), 3.0);
        setView(prev => ({ ...prev, scale: newScale }));
    };

    const handleZoom = (delta: number) => {
        setView(prev => ({ ...prev, scale: Math.min(Math.max(prev.scale + delta, 0.4), 3.0) }));
    };

    const handleMouseDown = (e: React.MouseEvent) => { 
        e.preventDefault();
        setIsDragging(true); 
        setLastMouse({ x: e.clientX, y: e.clientY }); 
    };
    
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const dx = e.clientX - lastMouse.x;
        const dy = e.clientY - lastMouse.y;
        setLastMouse({ x: e.clientX, y: e.clientY });
        setView(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    };

    const handleMouseUp = () => setIsDragging(false);
    const handleMouseLeave = () => setIsDragging(false);
    
    const nodeSpacing = 180; 
    const connections: Array<{x1: number; y1: number; x2: number; y2: number}> = [];
    Object.keys(worldMap).forEach(key => {
        const [x, y] = key.split(',').map(Number);
        const loc = worldMap[key as keyof typeof worldMap];
        if (loc.exits.includes('e') && worldMap[`${x+1},${y}` as keyof typeof worldMap]) connections.push({ x1: x*nodeSpacing, y1: -y*nodeSpacing, x2: (x+1)*nodeSpacing, y2: -y*nodeSpacing });
        if (loc.exits.includes('n') && worldMap[`${x},${y+1}` as keyof typeof worldMap]) connections.push({ x1: x*nodeSpacing, y1: -y*nodeSpacing, x2: x*nodeSpacing, y2: -(y+1)*nodeSpacing });
    });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="relative w-[95vw] h-[90vh] bg-[#1e293b] rounded-xl overflow-hidden shadow-2xl border-2 border-amber-600/50 flex flex-col">
                <div className="absolute top-0 w-full z-20 bg-black/80 p-4 flex justify-between items-center border-b border-amber-500/30">
                    <h2 className="text-2xl font-serif font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2"><Compass/> World Map</h2>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-400">Drag to move • Scroll to zoom</span>
                        <button onClick={() => setMapOpen(false)} className="bg-red-900/50 p-2 rounded text-white hover:bg-red-800"><X size={20}/></button>
                    </div>
                </div>
                <div 
                    className="relative flex-1 overflow-hidden cursor-move select-none" 
                    style={{ backgroundColor: '#0a0c0f' }}
                    onMouseDown={handleMouseDown} 
                    onMouseMove={handleMouseMove} 
                    onMouseUp={handleMouseUp} 
                    onMouseLeave={handleMouseLeave} 
                    onWheel={handleWheel}
                >
                    <div className="absolute inset-0 flex items-center justify-center transition-transform duration-75 ease-out origin-center" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
                        <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ width: '2500px', height: '2000px', left: '50%', top: '50%' }}>
                            <img 
                                src={zoneImages.paperMap} 
                                draggable={false} 
                                className="w-full h-full object-cover" 
                                style={{ 
                                    pointerEvents: 'none',
                                    opacity: 0.85,
                                    filter: 'saturate(1.1) contrast(1.05)',
                                }} 
                            />
                            {/* Overlay gradients for better edge blending */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30 pointer-events-none" />
                        </div>
                        <svg className="absolute overflow-visible pointer-events-none" style={{ top: '50%', left: '50%' }}>
                            {connections.map((line, i) => (
                                <line key={i} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#8B7355" strokeWidth="4" strokeOpacity="0.9" strokeDasharray="12,6" />
                            ))}
                        </svg>
                        <div className="absolute" style={{ top: '50%', left: '50%' }}>
                            {Object.keys(worldMap).map(key => {
                                const [x, y] = key.split(',').map(Number);
                                const loc = worldMap[key as keyof typeof worldMap];
                                const isCurrent = x === coords.x && y === coords.y;
                                const isVisited = player.visited.includes(key);
                                return (
                                    <div 
                                        key={key} 
                                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group ${isVisited ? 'cursor-pointer hover:z-50' : 'cursor-not-allowed opacity-40'}`} 
                                        style={{ left: `${x*nodeSpacing}px`, top: `${-y*nodeSpacing}px` }} 
                                        onClick={(e) => { e.stopPropagation(); onTravel(x, y); }}
                                    >
                                        {/* Player Marker - Highly Visible */}
                                        {isCurrent ? (
                                          <div className="relative">
                                            {/* Outer glow ring */}
                                            <div className="absolute -inset-3 bg-amber-500/40 rounded-full animate-ping" />
                                            <div className="absolute -inset-2 bg-amber-400/30 rounded-full animate-pulse" />
                                            {/* Main marker */}
                                            <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 border-4 border-amber-300 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.8)] z-30">
                                              <User size={28} className="text-amber-900 drop-shadow-lg" />
                                            </div>
                                          </div>
                                        ) : (
                                          <div className={`w-10 h-10 rounded-full border-3 flex items-center justify-center shadow-lg transition-all z-10 group-hover:scale-125 group-hover:z-20 ${
                                            !isVisited ? 'bg-gray-800/80 border-gray-600' :
                                            loc.tier === 1 ? 'bg-emerald-900/90 border-emerald-500 shadow-emerald-500/30' : 
                                            loc.tier === 2 ? 'bg-amber-900/90 border-amber-500 shadow-amber-500/30' : 
                                            'bg-red-900/90 border-red-500 shadow-red-500/30'
                                          }`}>
                                            {!isVisited ? <span className="text-xs font-bold text-gray-500">?</span> :
                                             loc.tier >= 3 ? <Lock size={18} className="text-red-400"/> : 
                                             loc.tier === 1 ? <Shield size={18} className="text-emerald-400"/> : 
                                             <AlertTriangle size={18} className="text-amber-400"/>}
                                          </div>
                                        )}
                                        {/* Zone Label */}
                                        {isCurrent ? (
                                          <div className="mt-3 px-4 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 rounded-lg text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap shadow-lg border-2 border-amber-400/50 z-30">
                                            📍 {loc.name}
                                          </div>
                                        ) : isVisited && (
                                          <div className={`mt-2 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shadow-lg transition-all group-hover:scale-110 ${
                                            loc.tier === 1 ? 'bg-emerald-900/90 border border-emerald-500/50 text-emerald-300' :
                                            loc.tier === 2 ? 'bg-amber-900/90 border border-amber-500/50 text-amber-300' :
                                            'bg-red-900/90 border border-red-500/50 text-red-300'
                                          }`}>
                                            {loc.name}
                                          </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2">
                    <button onClick={() => handleZoom(0.3)} className="w-12 h-12 bg-[#1e293b] border border-white/20 rounded-full flex items-center justify-center text-gray-200 hover:text-white hover:border-amber-500 hover:bg-amber-900/80 transition-all shadow-xl active:scale-95"><Plus size={24}/></button>
                    <button onClick={() => handleZoom(-0.3)} className="w-12 h-12 bg-[#1e293b] border border-white/20 rounded-full flex items-center justify-center text-gray-200 hover:text-white hover:border-amber-500 hover:bg-amber-900/80 transition-all shadow-xl active:scale-95"><Minus size={24}/></button>
                </div>
            </div>
        </div>
    );
};

export default VisualWorldMap;
