// ============================================
// GEAR COMPARISON HOOK
// Compare equipped vs hovered gear stats
// ============================================

import { useMemo } from 'react';

interface GearStats {
  str?: number;
  dex?: number;
  con?: number;
  spi?: number;
  wil?: number;
}

interface GearItem {
  id: string;
  name: string;
  slot: string;
  tier: number;
  rarity: string;
  stats: GearStats;
  element?: string;
  desc?: string;
  durability?: number;
  maxDurability?: number;
}

interface StatDiff {
  stat: string;
  current: number;
  new: number;
  diff: number;
  isPositive: boolean;
}

interface GearComparison {
  isUpgrade: boolean;
  isDowngrade: boolean;
  isSidegrade: boolean;
  totalDiff: number;
  statDiffs: StatDiff[];
  tierDiff: number;
}

const STAT_LABELS: Record<string, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  spi: 'Spirit',
  wil: 'Willpower',
};

const STAT_ICONS: Record<string, string> = {
  str: 'STR',
  dex: 'DEX',
  con: 'CON',
  spi: 'SPI',
  wil: 'WIL',
};

export function compareGear(equipped: GearItem | null, newItem: GearItem): GearComparison {
  const statDiffs: StatDiff[] = [];
  let totalDiff = 0;
  
  const allStats = ['str', 'dex', 'con', 'spi', 'wil'];
  
  allStats.forEach(stat => {
    const currentValue = equipped?.stats?.[stat as keyof GearStats] || 0;
    const newValue = newItem.stats?.[stat as keyof GearStats] || 0;
    const diff = newValue - currentValue;
    
    if (diff !== 0 || currentValue > 0 || newValue > 0) {
      statDiffs.push({
        stat,
        current: currentValue,
        new: newValue,
        diff,
        isPositive: diff > 0,
      });
      totalDiff += diff;
    }
  });
  
  const tierDiff = newItem.tier - (equipped?.tier || 0);
  
  return {
    isUpgrade: totalDiff > 0,
    isDowngrade: totalDiff < 0,
    isSidegrade: totalDiff === 0 && statDiffs.some(d => d.diff !== 0),
    totalDiff,
    statDiffs,
    tierDiff,
  };
}

export function useGearComparison(equipped: GearItem | null, hoveredItem: GearItem | null) {
  const comparison = useMemo(() => {
    if (!hoveredItem) return null;
    return compareGear(equipped, hoveredItem);
  }, [equipped, hoveredItem]);
  
  return comparison;
}

// Helper to format stat diff for display
export function formatStatDiff(diff: StatDiff): string {
  const icon = STAT_ICONS[diff.stat] || '';
  const label = STAT_LABELS[diff.stat] || diff.stat.toUpperCase();
  const sign = diff.diff > 0 ? '+' : '';
  const color = diff.diff > 0 ? 'text-green-400' : diff.diff < 0 ? 'text-red-400' : 'text-gray-400';
  
  return `${icon} ${label}: ${diff.current} → ${diff.new} (${sign}${diff.diff})`;
}

// Helper component props for rendering comparison
export function getComparisonColor(comparison: GearComparison | null): string {
  if (!comparison) return 'border-gray-600';
  if (comparison.isUpgrade) return 'border-green-500';
  if (comparison.isDowngrade) return 'border-red-500';
  if (comparison.isSidegrade) return 'border-yellow-500';
  return 'border-gray-600';
}

export function getComparisonLabel(comparison: GearComparison | null): { text: string; color: string } {
  if (!comparison) return { text: '', color: '' };
  if (comparison.isUpgrade) return { text: '▲ UPGRADE', color: 'text-green-400' };
  if (comparison.isDowngrade) return { text: '▼ DOWNGRADE', color: 'text-red-400' };
  if (comparison.isSidegrade) return { text: '◆ SIDEGRADE', color: 'text-yellow-400' };
  return { text: 'SAME', color: 'text-gray-400' };
}

export { STAT_LABELS, STAT_ICONS };
export type { GearItem, GearStats, StatDiff, GearComparison };
