// ============================================
// GEAR COMPARISON TOOLTIP
// Shows stat differences when hovering gear
// ============================================

import React from 'react';
import { ArrowUp, ArrowDown, Minus, TrendingUp, TrendingDown, Sword, Target, Heart, Sparkles, Brain } from 'lucide-react';
import type { GearComparison, StatDiff } from '../hooks/useGearComparison';

interface GearComparisonTooltipProps {
  comparison: GearComparison;
  className?: string;
}

const STAT_COLORS: Record<string, string> = {
  str: 'text-red-400',
  dex: 'text-green-400',
  con: 'text-orange-400',
  spi: 'text-blue-400',
  wil: 'text-purple-400',
};

const STAT_ICON_COMPONENTS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  str: ({ size = 12, className }) => <Sword size={size} className={className || 'text-red-400'} />,
  dex: ({ size = 12, className }) => <Target size={size} className={className || 'text-green-400'} />,
  con: ({ size = 12, className }) => <Heart size={size} className={className || 'text-orange-400'} />,
  spi: ({ size = 12, className }) => <Sparkles size={size} className={className || 'text-blue-400'} />,
  wil: ({ size = 12, className }) => <Brain size={size} className={className || 'text-purple-400'} />,
};

const STAT_LABELS: Record<string, string> = {
  str: 'STR',
  dex: 'DEX',
  con: 'CON',
  spi: 'SPI',
  wil: 'WIL',
};

const StatDiffRow: React.FC<{ diff: StatDiff }> = ({ diff }) => {
  if (diff.diff === 0 && diff.current === 0 && diff.new === 0) return null;
  
  const color = diff.diff > 0 ? 'text-green-400' : diff.diff < 0 ? 'text-red-400' : 'text-gray-500';
  const bgColor = diff.diff > 0 ? 'bg-green-500/10' : diff.diff < 0 ? 'bg-red-500/10' : 'bg-gray-500/10';
  const IconComponent = STAT_ICON_COMPONENTS[diff.stat];
  
  return (
    <div className={`flex items-center justify-between px-2 py-1 rounded ${bgColor}`}>
      <span className="flex items-center gap-1 text-xs">
        {IconComponent && <IconComponent size={12} />}
        <span className={STAT_COLORS[diff.stat]}>{STAT_LABELS[diff.stat]}</span>
      </span>
      <span className="flex items-center gap-1 text-xs">
        <span className="text-gray-500">{diff.current}</span>
        <span className="text-gray-600">→</span>
        <span className={color}>{diff.new}</span>
        {diff.diff !== 0 && (
          <span className={`${color} font-bold`}>
            ({diff.diff > 0 ? '+' : ''}{diff.diff})
          </span>
        )}
      </span>
    </div>
  );
};

export const GearComparisonTooltip: React.FC<GearComparisonTooltipProps> = ({ comparison, className = '' }) => {
  const { isUpgrade, isDowngrade, isSidegrade, totalDiff, statDiffs, tierDiff } = comparison;
  
  // Determine header style
  let headerBg = 'bg-gray-700';
  let headerText = 'COMPARISON';
  let HeaderIcon = Minus;
  
  if (isUpgrade) {
    headerBg = 'bg-green-600';
    headerText = 'UPGRADE';
    HeaderIcon = TrendingUp;
  } else if (isDowngrade) {
    headerBg = 'bg-red-600';
    headerText = 'DOWNGRADE';
    HeaderIcon = TrendingDown;
  } else if (isSidegrade) {
    headerBg = 'bg-yellow-600';
    headerText = 'SIDEGRADE';
    HeaderIcon = Minus;
  }
  
  // Filter to only show stats that have differences or values
  const relevantDiffs = statDiffs.filter(d => d.diff !== 0 || d.current > 0 || d.new > 0);
  
  if (relevantDiffs.length === 0) return null;
  
  return (
    <div className={`bg-gray-900/95 border border-gray-700 rounded-lg shadow-xl min-w-[180px] ${className}`}>
      {/* Header */}
      <div className={`${headerBg} px-3 py-1.5 rounded-t-lg flex items-center justify-between`}>
        <span className="text-white text-xs font-bold flex items-center gap-1">
          <HeaderIcon size={12} />
          {headerText}
        </span>
        <span className="text-white/80 text-xs">
          {totalDiff > 0 ? '+' : ''}{totalDiff} total
        </span>
      </div>
      
      {/* Tier difference */}
      {tierDiff !== 0 && (
        <div className={`px-3 py-1 text-xs border-b border-gray-800 ${tierDiff > 0 ? 'text-green-400' : 'text-red-400'}`}>
          Tier: {tierDiff > 0 ? '+' : ''}{tierDiff}
        </div>
      )}
      
      {/* Stat differences */}
      <div className="p-2 space-y-1">
        {relevantDiffs.map(diff => (
          <StatDiffRow key={diff.stat} diff={diff} />
        ))}
      </div>
      
      {/* Summary */}
      <div className={`px-3 py-1.5 border-t border-gray-800 text-xs flex items-center gap-1 ${
        isUpgrade ? 'text-green-400' : isDowngrade ? 'text-red-400' : 'text-yellow-400'
      }`}>
        {isUpgrade && <><TrendingUp size={12} /> Better overall stats</>}
        {isDowngrade && <><TrendingDown size={12} /> Worse overall stats</>}
        {isSidegrade && <><Minus size={12} /> Trade-off (different stats)</>}
      </div>
    </div>
  );
};

// Inline comparison badge for quick display
export const GearComparisonBadge: React.FC<{ comparison: GearComparison }> = ({ comparison }) => {
  if (comparison.totalDiff === 0 && !comparison.isSidegrade) return null;
  
  let bgColor = 'bg-gray-600';
  let icon = '=';
  
  if (comparison.isUpgrade) {
    bgColor = 'bg-green-600';
    icon = '↑';
  } else if (comparison.isDowngrade) {
    bgColor = 'bg-red-600';
    icon = '↓';
  } else if (comparison.isSidegrade) {
    bgColor = 'bg-yellow-600';
    icon = '↔';
  }
  
  return (
    <span className={`${bgColor} text-white text-[10px] px-1.5 py-0.5 rounded font-bold`}>
      {icon} {comparison.totalDiff > 0 ? '+' : ''}{comparison.totalDiff}
    </span>
  );
};

export default GearComparisonTooltip;
