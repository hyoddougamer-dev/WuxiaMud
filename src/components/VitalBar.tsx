import React from 'react';

interface VitalBarProps {
  label: string;
  val: number;
  max: number;
  color: string;
  text: string;
}

const VitalBar: React.FC<VitalBarProps> = ({ label, val, max, color, text }) => (
    <div className="flex flex-col gap-1 w-full">
        <div className="flex justify-between items-end">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${text}`}>{label}</span>
            <span className="text-[10px] font-mono text-gray-400">{val}/{max}</span>
        </div>
        <div className="h-2 bg-[#050608] rounded-full overflow-hidden border border-[#2a2f3a]">
            <div 
                className={`h-full ${color} transition-all duration-500`} 
                style={{width: `${Math.min(100, (val/max)*100)}%`}}
            ></div>
        </div>
    </div>
);

export default VitalBar;
