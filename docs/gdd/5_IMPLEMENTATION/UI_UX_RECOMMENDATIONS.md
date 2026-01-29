# 🎨 UI/UX Improvements - Detailed Recommendations

## 1. Character Creation Visual Redesign

### Problemas Actuais
- Background muito escuro/flat
- Falta coerência com o resto do jogo
- Não tem música/ambiente
- Pouco feedback visual nas escolhas

### Solução Proposta

#### A. Background & Ambiente
```tsx
// Em App.tsx ou CharacterCreation component
{gameState === 'character-creation' && (
  <div className="relative min-h-screen overflow-hidden">
    {/* Video Background - reutilizar do login */}
    <video 
      ref={bgVideoRef}
      autoPlay 
      loop 
      muted 
      playsInline
      className="absolute inset-0 w-full h-full object-cover opacity-40"
    >
      <source src="/assets/videos/wuxia-bg.mp4" type="video/mp4" />
    </video>
    
    {/* Overlay gradients */}
    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80" />
    <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/50" />
    
    {/* Animated particles */}
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div 
          key={i}
          className="absolute w-1 h-1 bg-amber-500/30 rounded-full animate-float-particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 5}s`
          }}
        />
      ))}
    </div>
    
    {/* Content */}
    <div className="relative z-10">
      {/* Character creation form */}
    </div>
  </div>
)}
```

#### B. Música Ambiente
```tsx
// Adicionar música suave diferente do login
useEffect(() => {
  if (gameState === 'character-creation') {
    const charCreationMusic = new Audio('/assets/audio/character-creation.mp3');
    charCreationMusic.volume = 0.3;
    charCreationMusic.loop = true;
    charCreationMusic.play();
    return () => charCreationMusic.pause();
  }
}, [gameState]);
```

#### C. Class Selection Cards
```css
/* Novo estilo para class cards */
.class-card {
  position: relative;
  padding: 24px;
  background: linear-gradient(135deg, rgba(26, 29, 36, 0.9), rgba(10, 12, 16, 0.8));
  border: 2px solid rgba(251, 191, 36, 0.3);
  border-radius: 12px;
  transition: all 0.3s ease;
  overflow: hidden;
}

.class-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.1), transparent);
  transition: left 0.5s ease;
}

.class-card:hover::before {
  left: 100%;
}

.class-card:hover {
  border-color: rgba(251, 191, 36, 0.8);
  transform: translateY(-4px);
  box-shadow: 0 10px 40px rgba(251, 191, 36, 0.2);
}

.class-card.selected {
  border-color: #f59e0b;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(26, 29, 36, 0.9));
}

/* Glow effect on selected */
.class-card.selected::after {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(45deg, #f59e0b, #fbbf24, #f59e0b);
  border-radius: 14px;
  z-index: -1;
  animation: glow-pulse 2s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
```

#### D. Preview de Personagem
```tsx
// Adicionar preview dinâmica baseada nas escolhas
const CharacterPreview = ({ classKey, stats }) => (
  <div className="relative w-64 h-80 mx-auto">
    {/* Silhouette baseada na classe */}
    <img 
      src={`/assets/classes/${classKey}-preview.png`}
      alt={classKey}
      className="w-full h-full object-contain"
    />
    
    {/* Aura animada baseada no elemento */}
    <div 
      className="absolute inset-0 opacity-30"
      style={{
        background: `radial-gradient(ellipse, ${ELEMENT_COLORS[getClassElement(classKey)]}, transparent)`,
        animation: 'aura-pulse 2s ease-in-out infinite'
      }}
    />
    
    {/* Stats preview */}
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/60 rounded-b-lg">
      <div className="grid grid-cols-5 gap-2 text-xs">
        {Object.entries(stats).map(([stat, value]) => (
          <div key={stat} className="text-center">
            <div className="text-amber-400">{getStatAbbr(stat)}</div>
            <div className="text-white font-bold">{value}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
```

---

## 2. Item Tooltips - Implementação Detalhada

### Problema Actual
- Não há tooltips quando hover em items
- Informação dos items só visível no modal de loot

### Solução: Tooltip Component Universal

#### A. Criar Tooltip Container
```tsx
// src/components/ItemTooltip.tsx
import { getStatAbbr, getRarityColor, getElementColor } from '../utils/helpers';

interface ItemTooltipProps {
  item: Equipment | null;
  position?: { x: number; y: number };
  children: React.ReactNode;
}

export const ItemTooltip: React.FC<ItemTooltipProps> = ({ item, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setIsVisible(true);
  };

  if (!item) return <>{children}</>;

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && createPortal(
        <div 
          ref={tooltipRef}
          className="fixed z-50 pointer-events-none"
          style={{
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <ItemTooltipContent item={item} />
        </div>,
        document.body
      )}
    </div>
  );
};
```

#### B. Tooltip Content
```tsx
// src/components/ItemTooltipContent.tsx
const ItemTooltipContent: React.FC<{ item: Equipment }> = ({ item }) => {
  const rarityColor = getRarityColor(item.rarity);
  const elementColor = item.element ? getElementColor(item.element) : null;

  return (
    <div 
      className="min-w-[240px] max-w-[320px] p-4 rounded-lg shadow-2xl border"
      style={{
        background: 'linear-gradient(135deg, rgba(26, 29, 36, 0.98), rgba(10, 12, 16, 0.98))',
        borderColor: rarityColor.border,
        boxShadow: `0 0 20px ${rarityColor.glow}40`
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 
          className="text-lg font-bold leading-tight"
          style={{ color: rarityColor.text }}
        >
          {item.name}
        </h3>
        {item.level && (
          <span className="text-xs text-gray-400 whitespace-nowrap">
            Lv.{item.level}
          </span>
        )}
      </div>

      {/* Rarity & Slot */}
      <div className="flex items-center gap-2 text-xs mb-3">
        <span style={{ color: rarityColor.text }}>{item.rarity}</span>
        <span className="text-gray-500">•</span>
        <span className="text-gray-400 capitalize">{item.slot}</span>
        {item.element && (
          <>
            <span className="text-gray-500">•</span>
            <span style={{ color: elementColor }}>{item.element}</span>
          </>
        )}
      </div>

      {/* Stats */}
      {item.stats && Object.keys(item.stats).length > 0 && (
        <div className="space-y-1 mb-3 py-2 border-t border-b border-gray-700/50">
          {Object.entries(item.stats).map(([stat, value]) => (
            <div key={stat} className="flex justify-between text-sm">
              <span className="text-gray-400">{getStatAbbr(stat)}</span>
              <span className="text-green-400">+{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Bonuses */}
      {item.bonuses && Object.keys(item.bonuses).length > 0 && (
        <div className="space-y-1 mb-3">
          {Object.entries(item.bonuses).map(([bonus, value]) => (
            <div key={bonus} className="text-xs text-amber-300">
              +{(value * 100).toFixed(0)}% {formatBonusName(bonus)}
            </div>
          ))}
        </div>
      )}

      {/* Set Info */}
      {item.setId && (
        <div className="mt-2 pt-2 border-t border-gray-700/50">
          <div className="text-xs text-purple-400">
            Set: {item.setId}
          </div>
        </div>
      )}

      {/* Description/Flavor */}
      {item.description && (
        <div className="mt-2 pt-2 border-t border-gray-700/50">
          <p className="text-xs text-gray-500 italic">
            "{item.description}"
          </p>
        </div>
      )}

      {/* Tooltip Arrow */}
      <div 
        className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full"
        style={{
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid rgba(26, 29, 36, 0.98)'
        }}
      />
    </div>
  );
};
```

#### C. Uso nos Componentes
```tsx
// Em CharacterPage.tsx - Equipment slots
{equipment[slot] ? (
  <ItemTooltip item={equipment[slot]}>
    <div className="equipment-slot filled">
      <img src={equipment[slot].icon} alt={equipment[slot].name} />
    </div>
  </ItemTooltip>
) : (
  <div className="equipment-slot empty">
    <span className="text-gray-500">{slot}</span>
  </div>
)}

// Em Inventory grid
{inventory.map(item => (
  <ItemTooltip key={item.id} item={item}>
    <div className="inventory-slot" onClick={() => handleItemClick(item)}>
      <img src={item.icon} alt={item.name} />
      {item.quantity > 1 && (
        <span className="quantity">{item.quantity}</span>
      )}
    </div>
  </ItemTooltip>
))}
```

---

## 3. Set Bonus Modal

### Problema Actual
- "Set Active" texto pequeno e confuso
- Não mostra que items pertencem ao set
- Difícil entender os bónus

### Solução: Modal Dedicado para Sets

```tsx
// src/components/SetBonusModal.tsx
interface SetBonusModalProps {
  setId: string;
  equippedPieces: Equipment[];
  allSetPieces: Equipment[];
  setData: SetData;
  onClose: () => void;
}

export const SetBonusModal: React.FC<SetBonusModalProps> = ({
  setId,
  equippedPieces,
  allSetPieces,
  setData,
  onClose
}) => {
  const equippedCount = equippedPieces.length;
  const totalPieces = allSetPieces.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative max-w-lg w-full mx-4 bg-gray-900 rounded-xl border border-purple-500/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-purple-900/30 to-transparent">
          <h2 className="text-2xl font-bold text-purple-400">
            {setData.name}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {equippedCount}/{totalPieces} pieces equipped
          </p>
        </div>

        {/* Set Pieces */}
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-sm font-medium text-gray-400 mb-3">SET PIECES</h3>
          <div className="grid grid-cols-2 gap-3">
            {allSetPieces.map(piece => {
              const isEquipped = equippedPieces.some(e => e.id === piece.id);
              return (
                <div 
                  key={piece.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    isEquipped 
                      ? 'border-purple-500/50 bg-purple-900/20' 
                      : 'border-gray-700 bg-gray-800/50 opacity-50'
                  }`}
                >
                  <div className="w-10 h-10 rounded bg-gray-700 flex items-center justify-center">
                    {piece.icon ? (
                      <img src={piece.icon} alt={piece.name} className="w-8 h-8" />
                    ) : (
                      <span className="text-xs text-gray-500">{piece.slot}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {piece.name}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {piece.slot}
                    </div>
                  </div>
                  {isEquipped && (
                    <div className="text-green-500 text-lg">✓</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Set Bonuses */}
        <div className="p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-3">SET BONUSES</h3>
          <div className="space-y-3">
            {Object.entries(setData.bonuses).map(([piecesRequired, bonus]) => {
              const isActive = equippedCount >= parseInt(piecesRequired);
              return (
                <div 
                  key={piecesRequired}
                  className={`p-4 rounded-lg border ${
                    isActive
                      ? 'border-green-500/50 bg-green-900/20'
                      : 'border-gray-700 bg-gray-800/30 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-bold ${isActive ? 'text-green-400' : 'text-gray-500'}`}>
                      {piecesRequired} Pieces
                    </span>
                    {isActive && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <ul className="space-y-1">
                    {bonus.effects.map((effect, i) => (
                      <li key={i} className={`text-sm ${isActive ? 'text-gray-200' : 'text-gray-500'}`}>
                        • {effect}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
```

### Como Activar o Modal
```tsx
// Em CharacterPage.tsx
const [showSetModal, setShowSetModal] = useState<string | null>(null);

// No render do set badge
{activeSet && (
  <button
    onClick={() => setShowSetModal(activeSet.id)}
    className="px-3 py-1 bg-purple-900/50 border border-purple-500/30 rounded-lg text-purple-400 text-sm hover:bg-purple-900/80 transition-colors"
  >
    <span className="text-lg mr-1">⚔️</span>
    {activeSet.name} ({activeSet.equipped}/{activeSet.total})
  </button>
)}

// Modal
{showSetModal && (
  <SetBonusModal
    setId={showSetModal}
    equippedPieces={getEquippedSetPieces(showSetModal)}
    allSetPieces={getAllSetPieces(showSetModal)}
    setData={getSetData(showSetModal)}
    onClose={() => setShowSetModal(null)}
  />
)}
```

---

## 📋 Resumo de Implementação

### Prioridade Alta
1. **Item Tooltips** - Impacto imediato na UX
2. **Set Bonus Modal** - Clareza sobre sets

### Prioridade Média
3. **Character Creation Background** - Coerência visual
4. **Character Preview** - Feedback na criação

### Prioridade Baixa
5. **Partículas animadas** - Polish
6. **Música de character creation** - Ambiente

### Estimativa de Tempo
- Item Tooltips: 2-3 horas
- Set Bonus Modal: 1-2 horas
- Character Creation Visual: 2-3 horas
- Total: ~7-8 horas de desenvolvimento
