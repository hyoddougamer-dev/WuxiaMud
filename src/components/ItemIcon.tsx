// ============================================
// ITEM ICON COMPONENT - WuxiaMUD
// Renders item icons with fallback to Lucide icons
// ============================================

import React, { useState } from 'react';
import { Sword, Music, CircleDot, Award, Box, Sparkles, Gem, Plus } from 'lucide-react';
import { getItemIconPath, getWeaponType, getAccessoryType, materialIcons } from '../utils/iconSystem';

interface ItemIconProps {
  item: any;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'preview';
  className?: string;
  showFallback?: boolean;
}

// Size mappings in pixels
const SIZE_MAP = {
  xs: 12,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
  preview: 96, // For Forge preview
};

const SIZE_CLASS_MAP = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
  preview: 'w-24 h-24',
};

/**
 * ItemIcon - Renders an item icon with image or fallback
 */
export const ItemIcon: React.FC<ItemIconProps> = ({ 
  item, 
  size = 'md', 
  className = '',
  showFallback = true 
}) => {
  const [imageError, setImageError] = useState(false);
  const iconPath = getItemIconPath(item);
  const sizeClass = SIZE_CLASS_MAP[size];
  const pixelSize = SIZE_MAP[size];
  
  // If we have an icon path and no error, show image
  if (iconPath && !imageError) {
    return (
      <img 
        src={iconPath}
        alt={item?.name || 'Item'}
        className={`${sizeClass} object-contain ${className}`}
        onError={() => setImageError(true)}
        loading="lazy"
      />
    );
  }
  
  // Fallback to Lucide icons
  if (!showFallback) return null;
  
  return <FallbackIcon item={item} size={pixelSize} className={className} />;
};

/**
 * FallbackIcon - Lucide icon fallback when image not available
 */
const FallbackIcon: React.FC<{ item: any; size: number; className?: string }> = ({ 
  item, 
  size, 
  className = '' 
}) => {
  const type = item?.type?.toLowerCase() || '';
  const iconType = item?.iconType || '';
  
  // Weapon fallbacks
  if (type === 'weapon') {
    const weaponType = getWeaponType(item);
    if (weaponType === 'zither') {
      return <Music size={size} className={`text-purple-400 ${className}`} />;
    }
    return <Sword size={size} className={`text-blue-400 ${className}`} />;
  }
  
  // Accessory fallbacks
  if (type === 'ring') {
    return <CircleDot size={size} className={`text-yellow-400 ${className}`} />;
  }
  if (type === 'necklace') {
    return <Award size={size} className={`text-cyan-400 ${className}`} />;
  }
  
  // Consumable fallbacks
  if (type === 'consumable') {
    return <Plus size={size} className={`text-red-400 ${className}`} />;
  }
  
  // Material fallbacks
  if (iconType.includes('material') || iconType.includes('token')) {
    return <Gem size={size} className={`text-purple-400 ${className}`} />;
  }
  
  // Junk fallbacks
  if (iconType.includes('junk') || iconType.includes('currency')) {
    return <Sparkles size={size} className={`text-amber-400 ${className}`} />;
  }
  
  // Default
  return <Box size={size} className={`text-gray-400 ${className}`} />;
};

/**
 * WeaponPreview - Large weapon icon for Forge (128x128)
 */
export const WeaponPreview: React.FC<{ 
  weaponType: 'sword' | 'saber' | 'zither';
  tier: number;
  className?: string;
}> = ({ weaponType, tier, className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const iconPath = `/icons/weapons/preview/wp_${weaponType}_t${tier}.png`;
  
  if (!imageError) {
    return (
      <img 
        src={iconPath}
        alt={`${weaponType} Tier ${tier}`}
        className={`w-32 h-32 object-contain ${className}`}
        onError={() => setImageError(true)}
        loading="lazy"
      />
    );
  }
  
  // Fallback
  if (weaponType === 'zither') {
    return <Music size={128} className={`text-purple-400 ${className}`} />;
  }
  return <Sword size={128} className={`text-blue-400 ${className}`} />;
};

/**
 * MaterialIcon - Small material icon for crafting UI
 */
export const MaterialIcon: React.FC<{ 
  materialId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ materialId, size = 'sm', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  
  const iconPath = materialIcons[materialId];
  
  const sizeClass = SIZE_CLASS_MAP[size];
  const pixelSize = SIZE_MAP[size];
  
  if (iconPath && !imageError) {
    return (
      <img 
        src={iconPath}
        alt={materialId}
        className={`${sizeClass} object-contain ${className}`}
        onError={() => setImageError(true)}
        loading="lazy"
      />
    );
  }
  
  // Fallback
  return <Gem size={pixelSize} className={`text-purple-400 ${className}`} />;
};

/**
 * SpiritStoneIcon - Currency icon using cultivation asset
 */
export const SpiritStoneIcon: React.FC<{ 
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'sm', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  // Use the proper cultivation asset
  const iconPath = '/assets/icons/cultivation/spirit_stone_crystal.png';
  
  const sizeClass = SIZE_CLASS_MAP[size];
  const pixelSize = SIZE_MAP[size];
  
  if (!imageError) {
    return (
      <img 
        src={iconPath}
        alt="Spirit Stone"
        className={`${sizeClass} object-contain drop-shadow-lg ${className}`}
        onError={() => setImageError(true)}
        loading="lazy"
      />
    );
  }
  
  // Fallback to Lucide icon
  return <Gem size={pixelSize} className={`text-cyan-400 ${className}`} />;
};

export default ItemIcon;
