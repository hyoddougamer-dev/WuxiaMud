// =====================================================
// VFX SPRITE COMPONENT - Animated Spritesheet Effects
// =====================================================
// Renders animated VFX from spritesheets
// =====================================================

import React, { useState, useEffect, useRef } from 'react';

interface VFXSpriteProps {
  // Spritesheet configuration
  spritesheet: string;           // Path to spritesheet image
  frameWidth: number;            // Width of each frame
  frameHeight: number;           // Height of each frame
  framesPerRow: number;          // How many frames per row
  totalFrames: number;           // Total number of frames in animation
  startRow?: number;             // Which row to start from (default 0)
  fps?: number;                  // Frames per second (default 24)
  
  // Position and size
  x: number;                     // X position on screen
  y: number;                     // Y position on screen
  scale?: number;                // Scale multiplier (default 1)
  
  // Playback
  loop?: boolean;                // Loop animation (default false)
  autoPlay?: boolean;            // Start automatically (default true)
  onComplete?: () => void;       // Callback when animation ends
  
  // Visual
  opacity?: number;              // Opacity 0-1
  rotation?: number;             // Rotation in degrees
  flipX?: boolean;               // Flip horizontally
  flipY?: boolean;               // Flip vertically
  blendMode?: string;            // CSS mix-blend-mode
  tint?: string;                 // CSS filter for color tinting
}

export const VFXSprite: React.FC<VFXSpriteProps> = ({
  spritesheet,
  frameWidth,
  frameHeight,
  framesPerRow,
  totalFrames,
  startRow = 0,
  fps = 24,
  x,
  y,
  scale = 1,
  loop = false,
  autoPlay = true,
  onComplete,
  opacity = 1,
  rotation = 0,
  flipX = false,
  flipY = false,
  blendMode = 'screen',
  tint,
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isPlaying) return;

    const frameInterval = 1000 / fps;
    
    intervalRef.current = setInterval(() => {
      setCurrentFrame(prev => {
        const nextFrame = prev + 1;
        
        if (nextFrame >= totalFrames) {
          if (loop) {
            return 0;
          } else {
            setIsPlaying(false);
            onComplete?.();
            return prev;
          }
        }
        
        return nextFrame;
      });
    }, frameInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, fps, totalFrames, loop, onComplete]);

  // Calculate sprite position in spritesheet (with startRow offset)
  const frameX = (currentFrame % framesPerRow) * frameWidth;
  const frameY = (startRow + Math.floor(currentFrame / framesPerRow)) * frameHeight;

  // Calculate scaled spritesheet dimensions
  const scaledSheetWidth = framesPerRow * frameWidth * scale;
  // Note: We don't know total rows, so we use 'auto' for height
  
  const style: React.CSSProperties = {
    position: 'absolute',
    left: x - (frameWidth * scale) / 2,
    top: y - (frameHeight * scale) / 2,
    width: frameWidth * scale,
    height: frameHeight * scale,
    backgroundImage: `url(${spritesheet})`,
    backgroundPosition: `-${frameX * scale}px -${frameY * scale}px`,
    backgroundSize: `${scaledSheetWidth}px auto`,
    opacity,
    transform: `rotate(${rotation}deg) scaleX(${flipX ? -1 : 1}) scaleY(${flipY ? -1 : 1})`,
    mixBlendMode: blendMode as any,
    filter: tint,
    pointerEvents: 'none',
    zIndex: 100,
  };

  if (!isPlaying && currentFrame >= totalFrames - 1 && !loop) {
    return null;
  }

  return <div style={style} />;
};

// =====================================================
// PRE-CONFIGURED VFX EFFECTS
// =====================================================

// Fire/Orange spritesheet configuration (512x1536, 8 cols x 24 rows)
export const FIRE_VFX_CONFIG = {
  spritesheet: '/assets/combat/effects/vfx_fire_spritesheet.png',
  frameWidth: 64,
  frameHeight: 64,
  framesPerRow: 8,
  totalRows: 24,
};

// VFX Effect Presets using the fire spritesheet
// Each row has 8 frames, so startRow * 8 = startFrame
export const VFX_PRESETS = {
  // Row 0-1: Small sparks/particles (startup effects)
  spark_small: {
    ...FIRE_VFX_CONFIG,
    startRow: 0,
    totalFrames: 8,
    fps: 24,
  },
  
  // Row 2-3: Medium explosions (normal hits)
  explosion_medium: {
    ...FIRE_VFX_CONFIG,
    startRow: 2,
    totalFrames: 8,
    fps: 20,
  },
  
  // Row 4-5: Large starburst explosions (crits)
  explosion_large: {
    ...FIRE_VFX_CONFIG,
    startRow: 4,
    totalFrames: 8,
    fps: 18,
  },
  
  // Row 6-7: Circular burst (skill activation)
  burst_circular: {
    ...FIRE_VFX_CONFIG,
    startRow: 6,
    totalFrames: 8,
    fps: 22,
  },
  
  // Row 8-9: Ring expand (buffs/shields)
  ring_expand: {
    ...FIRE_VFX_CONFIG,
    startRow: 8,
    totalFrames: 8,
    fps: 16,
  },
  
  // Row 10-11: Circle expand (AOE/heal)
  circle_expand: {
    ...FIRE_VFX_CONFIG,
    startRow: 10,
    totalFrames: 8,
    fps: 18,
  },
  
  // Row 12-13: Star sparkle (rare drops, level up)
  sparkle_star: {
    ...FIRE_VFX_CONFIG,
    startRow: 12,
    totalFrames: 8,
    fps: 20,
  },
  
  // Row 14-15: Flash/glow (block, counter, dodge)
  flash_glow: {
    ...FIRE_VFX_CONFIG,
    startRow: 14,
    totalFrames: 8,
    fps: 28,
  },
  
  // Row 16-17: Horizontal slash (sword attacks)
  slash_horizontal: {
    ...FIRE_VFX_CONFIG,
    startRow: 16,
    totalFrames: 8,
    fps: 24,
  },
  
  // Row 18-19: Crescent slash (saber attacks)
  slash_crescent: {
    ...FIRE_VFX_CONFIG,
    startRow: 18,
    totalFrames: 8,
    fps: 24,
  },
  
  // Row 20-21: Wave effect (zither/sound attacks)
  wave_sonic: {
    ...FIRE_VFX_CONFIG,
    startRow: 20,
    totalFrames: 8,
    fps: 20,
  },
  
  // Row 22-23: Impact/hit effect (general damage)
  impact_hit: {
    ...FIRE_VFX_CONFIG,
    startRow: 22,
    totalFrames: 8,
    fps: 26,
  },
};

// =====================================================
// EASY-TO-USE VFX COMPONENT
// =====================================================

interface QuickVFXProps {
  type: keyof typeof VFX_PRESETS;
  x: number;
  y: number;
  scale?: number;
  onComplete?: () => void;
  // Color variations
  color?: 'fire' | 'ice' | 'lightning' | 'poison' | 'void' | 'heal';
}

// Color filter presets
const COLOR_FILTERS = {
  fire: 'none', // Original orange
  ice: 'hue-rotate(180deg) saturate(1.5)', // Blue
  lightning: 'hue-rotate(60deg) saturate(2) brightness(1.2)', // Yellow/Electric
  poison: 'hue-rotate(90deg) saturate(1.2)', // Green
  void: 'hue-rotate(270deg) saturate(1.5)', // Purple
  heal: 'hue-rotate(120deg) saturate(1.5) brightness(1.1)', // Green/White
};

export const QuickVFX: React.FC<QuickVFXProps> = ({
  type,
  x,
  y,
  scale = 1,
  onComplete,
  color = 'fire',
}) => {
  const preset = VFX_PRESETS[type];
  
  if (!preset) {
    console.warn(`VFX preset "${type}" not found`);
    return null;
  }

  return (
    <VFXSprite
      spritesheet={preset.spritesheet}
      frameWidth={preset.frameWidth}
      frameHeight={preset.frameHeight}
      framesPerRow={preset.framesPerRow}
      totalFrames={preset.totalFrames}
      startRow={preset.startRow || 0}
      fps={preset.fps}
      x={x}
      y={y}
      scale={scale}
      onComplete={onComplete}
      tint={COLOR_FILTERS[color]}
      blendMode="screen"
    />
  );
};

// =====================================================
// VFX MANAGER - For spawning multiple effects
// =====================================================

interface ActiveVFX {
  id: number;
  type: keyof typeof VFX_PRESETS;
  x: number;
  y: number;
  scale: number;
  color: QuickVFXProps['color'];
}

let vfxIdCounter = 0;

export const useVFXManager = () => {
  const [effects, setEffects] = useState<ActiveVFX[]>([]);

  const spawnVFX = React.useCallback((
    type: keyof typeof VFX_PRESETS,
    x: number,
    y: number,
    options?: {
      scale?: number;
      color?: QuickVFXProps['color'];
    }
  ) => {
    const id = vfxIdCounter++;
    const newEffect: ActiveVFX = {
      id,
      type,
      x,
      y,
      scale: options?.scale || 1,
      color: options?.color || 'fire',
    };

    console.log('[VFX Manager] Adding effect:', newEffect);
    setEffects(prev => {
      const newEffects = [...prev, newEffect];
      console.log('[VFX Manager] Total effects now:', newEffects.length);
      return newEffects;
    });
  }, []);

  const removeVFX = React.useCallback((id: number) => {
    setEffects(prev => prev.filter(e => e.id !== id));
  }, []);

  // Render the VFX layer directly
  const VFXLayer = () => (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {effects.map(effect => (
        <QuickVFX
          key={effect.id}
          type={effect.type}
          x={effect.x}
          y={effect.y}
          scale={effect.scale}
          color={effect.color}
          onComplete={() => removeVFX(effect.id)}
        />
      ))}
    </div>
  );

  return { spawnVFX, VFXLayer, effects };
};

export default VFXSprite;
