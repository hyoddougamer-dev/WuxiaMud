// ============================================
// ENHANCED FLOATING DAMAGE - 凌云道
// Beautiful floating damage numbers with element colors
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { Flame, Snowflake, Leaf, Zap, Skull, Shield, Sparkles, Wind, Link } from 'lucide-react';
import { ResourceIcon } from '../ui/GameIcon';

// ============================================
// TYPES
// ============================================

export interface FloatingNumber {
  id: number;
  value: number | string;
  type: 'damage' | 'heal' | 'critical' | 'miss' | 'block' | 'dodge' | 'effect' | 'combo';
  element?: string;
  target: 'player' | 'enemy';
  x?: number; // Random offset for spread
  y?: number;
}

// ============================================
// ELEMENT COLORS
// ============================================

const ELEMENT_COLORS: Record<string, { primary: string; glow: string; text: string }> = {
  Fire: { primary: '#FF6B35', glow: 'rgba(255, 107, 53, 0.6)', text: 'text-orange-400' },
  Ice: { primary: '#00D4FF', glow: 'rgba(0, 212, 255, 0.6)', text: 'text-cyan-400' },
  Wood: { primary: '#4ADE80', glow: 'rgba(74, 222, 128, 0.6)', text: 'text-green-400' },
  Lightning: { primary: '#FFD700', glow: 'rgba(255, 215, 0, 0.6)', text: 'text-yellow-400' },
  Void: { primary: '#A855F7', glow: 'rgba(168, 85, 247, 0.6)', text: 'text-purple-400' },
};

const ELEMENT_ICONS: Record<string, React.ReactNode> = {
  Fire: <Flame size={14} className="text-orange-400" />,
  Ice: <Snowflake size={14} className="text-cyan-400" />,
  Wood: <Leaf size={14} className="text-green-400" />,
  Lightning: <Zap size={14} className="text-yellow-400" />,
  Void: <Skull size={14} className="text-purple-400" />,
};

// ============================================
// SINGLE FLOATING NUMBER COMPONENT
// ============================================

interface FloatingDamageNumberProps {
  number: FloatingNumber;
  onComplete: (id: number) => void;
}

const FloatingDamageNumber: React.FC<FloatingDamageNumberProps> = ({ number, onComplete }) => {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<'enter' | 'float' | 'exit'>('enter');

  useEffect(() => {
    // Enter phase
    setTimeout(() => setPhase('float'), 100);
    
    // Exit phase
    const exitTimer = setTimeout(() => {
      setPhase('exit');
      setTimeout(() => {
        setVisible(false);
        onComplete(number.id);
      }, 300);
    }, 1200);

    return () => clearTimeout(exitTimer);
  }, [number.id, onComplete]);

  if (!visible) return null;

  // Get color based on type and element
  const getColor = () => {
    if (number.type === 'heal') return '#22C55E';
    if (number.type === 'miss') return '#6B7280';
    if (number.type === 'block') return '#3B82F6';
    if (number.type === 'dodge') return '#06B6D4';
    if (number.type === 'critical') return '#F59E0B';
    if (number.type === 'combo') return '#EC4899';
    if (number.element && ELEMENT_COLORS[number.element]) {
      return ELEMENT_COLORS[number.element].primary;
    }
    return '#EF4444'; // Default red for damage
  };

  // Get text content
  const getText = () => {
    if (number.type === 'miss') return 'MISS!';
    if (number.type === 'block') return 'BLOCKED!';
    if (number.type === 'dodge') return 'DODGED!';
    if (number.type === 'heal') return `+${number.value}`;
    if (number.type === 'combo') return `${number.value}`;
    if (typeof number.value === 'number') {
      return number.value.toString();
    }
    return number.value;
  };

  // Get element icon
  const getIcon = (): React.ReactNode => {
    if (number.type === 'heal') return <ResourceIcon type="hp" size={14} />;
    if (number.type === 'critical') return <Sparkles size={14} className="text-yellow-400" />;
    if (number.type === 'miss') return <Wind size={14} className="text-gray-400" />;
    if (number.type === 'block') return <Shield size={14} className="text-blue-400" />;
    if (number.type === 'dodge') return <Wind size={14} className="text-cyan-400" />;
    if (number.type === 'combo') return <Link size={14} className="text-pink-400" />;
    if (number.element && ELEMENT_ICONS[number.element]) {
      return ELEMENT_ICONS[number.element];
    }
    return null;
  };

  const isCritical = number.type === 'critical';
  const isHeal = number.type === 'heal';
  const isSpecial = ['miss', 'block', 'dodge', 'combo'].includes(number.type);

  // Random position offset
  const offsetX = (number.x ?? (Math.random() * 60 - 30));
  const offsetY = (number.y ?? (Math.random() * 20));

  // Position based on target
  const basePosition = number.target === 'player' 
    ? { left: '25%' } 
    : { left: '75%' };

  // Animation styles
  const getAnimationStyle = () => {
    switch (phase) {
      case 'enter':
        return {
          transform: 'translateY(0) scale(0.5)',
          opacity: 0,
        };
      case 'float':
        return {
          transform: `translateY(-60px) scale(${isCritical ? 1.3 : 1})`,
          opacity: 1,
        };
      case 'exit':
        return {
          transform: 'translateY(-100px) scale(0.8)',
          opacity: 0,
        };
    }
  };

  return (
    <div
      className="absolute pointer-events-none z-50 flex items-center gap-1"
      style={{
        ...basePosition,
        top: `${30 + offsetY}%`,
        marginLeft: `${offsetX}px`,
        transition: 'all 0.3s ease-out',
        ...getAnimationStyle(),
      }}
    >
      {/* Icon */}
      {getIcon() && (
        <span className="text-2xl drop-shadow-lg">{getIcon()}</span>
      )}
      
      {/* Number/Text */}
      <span
        className={`
          font-black drop-shadow-2xl
          ${isCritical ? 'text-4xl sm:text-5xl' : isSpecial ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'}
          ${isHeal ? 'text-green-400' : ''}
        `}
        style={{
          color: getColor(),
          textShadow: `
            0 0 10px ${getColor()},
            0 0 20px ${getColor()}50,
            2px 2px 0 rgba(0,0,0,0.8),
            -2px -2px 0 rgba(0,0,0,0.8),
            2px -2px 0 rgba(0,0,0,0.8),
            -2px 2px 0 rgba(0,0,0,0.8)
          `,
        }}
      >
        {isCritical && <span className="text-yellow-300 mr-1">★</span>}
        {getText()}
        {isCritical && <span className="text-yellow-300 ml-1">★</span>}
      </span>

      {/* Critical label */}
      {isCritical && (
        <span 
          className="text-xs font-bold text-yellow-400 uppercase tracking-wider ml-1"
          style={{
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          }}
        >
          CRIT!
        </span>
      )}
    </div>
  );
};

// ============================================
// FLOATING DAMAGE CONTAINER (manages all numbers)
// ============================================

interface FloatingDamageContainerProps {
  numbers: FloatingNumber[];
  onRemove: (id: number) => void;
}

export const FloatingDamageContainer: React.FC<FloatingDamageContainerProps> = ({
  numbers,
  onRemove,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {numbers.map(num => (
        <FloatingDamageNumber
          key={num.id}
          number={num}
          onComplete={onRemove}
        />
      ))}
    </div>
  );
};

// ============================================
// HOOK FOR MANAGING FLOATING NUMBERS
// ============================================

export const useFloatingDamage = () => {
  const [numbers, setNumbers] = useState<FloatingNumber[]>([]);

  const addNumber = useCallback((
    value: number | string,
    type: FloatingNumber['type'],
    target: 'player' | 'enemy',
    element?: string
  ) => {
    const newNumber: FloatingNumber = {
      id: Date.now() + Math.random(),
      value,
      type,
      target,
      element,
      x: Math.random() * 60 - 30,
      y: Math.random() * 20,
    };

    setNumbers(prev => [...prev, newNumber]);
  }, []);

  const removeNumber = useCallback((id: number) => {
    setNumbers(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNumbers([]);
  }, []);

  return {
    numbers,
    addNumber,
    removeNumber,
    clearAll,
    FloatingDamageContainer: (
      <FloatingDamageContainer numbers={numbers} onRemove={removeNumber} />
    ),
  };
};

// ============================================
// SCREEN SHAKE EFFECT
// ============================================

export const triggerScreenShake = (intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
  const element = document.getElementById('combat-arena');
  if (!element) return;

  const shakeClass = {
    light: 'animate-shake-light',
    medium: 'animate-shake-medium',
    heavy: 'animate-shake-heavy',
  }[intensity];

  element.classList.add(shakeClass);

  const duration = { light: 200, medium: 400, heavy: 600 }[intensity];
  setTimeout(() => {
    element.classList.remove(shakeClass);
  }, duration);
};

// ============================================
// CSS ANIMATIONS (Add to index.css)
// ============================================

export const floatingDamageCSS = `
/* Floating Damage Animations */
@keyframes floatUp {
  0% {
    opacity: 0;
    transform: translateY(0) scale(0.5);
  }
  20% {
    opacity: 1;
    transform: translateY(-20px) scale(1.2);
  }
  80% {
    opacity: 1;
    transform: translateY(-60px) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-80px) scale(0.8);
  }
}

@keyframes criticalPop {
  0% {
    opacity: 0;
    transform: translateY(0) scale(0.3);
  }
  30% {
    opacity: 1;
    transform: translateY(-30px) scale(1.5);
  }
  50% {
    transform: translateY(-40px) scale(1.3);
  }
  100% {
    opacity: 0;
    transform: translateY(-100px) scale(0.8);
  }
}

/* Screen Shake Animations */
@keyframes shake-light {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

@keyframes shake-medium {
  0%, 100% { transform: translateX(0) translateY(0); }
  10% { transform: translateX(-4px) translateY(-2px); }
  30% { transform: translateX(4px) translateY(2px); }
  50% { transform: translateX(-4px) translateY(1px); }
  70% { transform: translateX(4px) translateY(-1px); }
  90% { transform: translateX(-2px) translateY(0); }
}

@keyframes shake-heavy {
  0%, 100% { transform: translateX(0) translateY(0) rotate(0); }
  10% { transform: translateX(-8px) translateY(-4px) rotate(-1deg); }
  20% { transform: translateX(8px) translateY(2px) rotate(1deg); }
  30% { transform: translateX(-6px) translateY(-2px) rotate(-0.5deg); }
  40% { transform: translateX(6px) translateY(4px) rotate(0.5deg); }
  50% { transform: translateX(-4px) translateY(-2px) rotate(-0.5deg); }
  60% { transform: translateX(4px) translateY(2px) rotate(0.5deg); }
  70% { transform: translateX(-2px) translateY(-1px); }
  80% { transform: translateX(2px) translateY(1px); }
  90% { transform: translateX(-1px); }
}

.animate-shake-light {
  animation: shake-light 0.2s ease-in-out;
}

.animate-shake-medium {
  animation: shake-medium 0.4s ease-in-out;
}

.animate-shake-heavy {
  animation: shake-heavy 0.6s ease-in-out;
}

/* Element burst flash effect */
@keyframes element-burst {
  0% { opacity: 0.7; }
  100% { opacity: 0; }
}

.element-burst {
  animation: element-burst 0.3s ease-out forwards;
}
`;
