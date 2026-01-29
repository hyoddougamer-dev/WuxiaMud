# 🎮 CLASS SYSTEM IMPLEMENTATION GUIDE

---

## 📋 PHASE 1: DATA INTEGRATION (1-2 hours)

### Step 1.1: Import Classes in App.tsx
```typescript
// At top of App.tsx
import { hybridClassSystem, classStatTemplates } from './data/hybridClasses';
```

### Step 1.2: Replace Class Detection Algorithm
**Current Location**: [src/App.tsx](src/App.tsx#L164-L176)

**Old Algorithm** (auto-detect by weapon + stats):
```typescript
const detectedPath = () => {
    const matching = classDefinitions.filter(c => c.wpn === weapon.subtype);
    if (matching.length === 0) return "Martial Artist";
    
    const scores = matching.map(c => {
        const primary = (stats as any)[c.stat1] || 0;
        const secondary = ((stats as any)[c.stat2] || 0) * 0.5;
        return { name: c.name, score: primary + secondary };
    });
    return scores.reduce((a, b) => (a.score > b.score ? a : b)).name;
};
```

**New Algorithm** (player choice with stat recommendations):
```typescript
const detectedPath = () => {
    // Return all compatible classes for this weapon
    const compatible = hybridClassSystem.filter(c => c.weapon === weapon.subtype);
    // Return full class objects for UI selection
    return compatible;
};

const recommendedClass = () => {
    // For auto-select, still score by stats
    const matching = detectedPath();
    if (matching.length === 0) return "Martial Artist";
    
    const scores = matching.map(c => {
        const primary = (stats as any)[c.statTemplate[Object.keys(c.statTemplate)[0] as keyof typeof c.statTemplate]] || 0;
        const secondary = ((stats as any)[c.statTemplate[Object.keys(c.statTemplate)[1] as keyof typeof c.statTemplate]] || 0) * 0.5;
        return { name: c.name, score: primary + secondary };
    });
    return scores.reduce((a, b) => (a.score > b.score ? a : b)).name;
};
```

### Step 1.3: Add Class State to App.tsx
```typescript
// Add to useState declarations
const [selectedClass, setSelectedClass] = useState<HybridClass | null>(null);
const [classDescription, setClassDescription] = useState("");

// Add useEffect to detect compatible classes
useEffect(() => {
    const compatible = hybridClassSystem.filter(c => c.weapon === weapon.subtype);
    if (compatible.length > 0 && !selectedClass) {
        // Auto-recommend best match but allow selection
        const recommended = compatible.reduce((a, b) => {
            const aScore = (stats as any)[Object.keys(a.statTemplate)[0]];
            const bScore = (stats as any)[Object.keys(b.statTemplate)[0]];
            return aScore > bScore ? a : b;
        });
        setSelectedClass(recommended);
        setClassDescription(recommended.description);
    }
}, [weapon, stats]);
```

---

## 🎨 PHASE 2: UI CLASS SELECTION SCREEN (2-3 hours)

### Step 2.1: Create ClassSelector Component
**File**: `src/components/ClassSelector.tsx`

```typescript
import React, { useState } from 'react';
import { HybridClass, hybridClassSystem } from '../data/hybridClasses';
import './ClassSelector.css';

interface ClassSelectorProps {
    weapon: { subtype: string };
    selectedClass: HybridClass | null;
    onSelectClass: (classItem: HybridClass) => void;
}

export const ClassSelector: React.FC<ClassSelectorProps> = ({
    weapon,
    selectedClass,
    onSelectClass
}) => {
    const [hoveredClass, setHoveredClass] = useState<HybridClass | null>(null);
    
    // Filter classes by weapon type
    const compatibleClasses = hybridClassSystem.filter(
        c => c.weapon === weapon.subtype
    );

    return (
        <div className="class-selector-container">
            <h2>Choose Your Class</h2>
            <p className="subtitle">{weapon.subtype} Classes Available</p>
            
            <div className="class-grid">
                {compatibleClasses.map((classItem) => (
                    <div
                        key={classItem.id}
                        className={`class-card ${selectedClass?.id === classItem.id ? 'selected' : ''} ${classItem.difficulty.toLowerCase()}`}
                        onClick={() => onSelectClass(classItem)}
                        onMouseEnter={() => setHoveredClass(classItem)}
                        onMouseLeave={() => setHoveredClass(null)}
                    >
                        {/* Class Header */}
                        <div className="class-header">
                            <h3>{classItem.name}</h3>
                            <span className={`element-badge ${classItem.element.toLowerCase()}`}>
                                {classItem.element}
                            </span>
                        </div>

                        {/* Class Stats */}
                        <div className="class-stats">
                            <div className="stat-row">
                                <span className="role">Role: {classItem.role}</span>
                            </div>
                            <div className="stat-row">
                                <span className="difficulty">Difficulty: {classItem.difficulty}</span>
                            </div>
                        </div>

                        {/* Quick Description */}
                        <p className="class-desc">{classItem.description}</p>

                        {/* Passive Preview */}
                        {hoveredClass?.id === classItem.id && (
                            <div className="passive-preview">
                                <h4>Passive: {classItem.passive.name}</h4>
                                <p>{classItem.passive.description}</p>
                            </div>
                        )}

                        {/* Selected Indicator */}
                        {selectedClass?.id === classItem.id && (
                            <div className="selected-indicator">✓ Selected</div>
                        )}
                    </div>
                ))}
            </div>

            {/* Detailed Class Info */}
            {selectedClass && (
                <div className="class-details">
                    <h3>{selectedClass.name} - Complete Profile</h3>
                    
                    <div className="details-grid">
                        {/* Stat Template */}
                        <div className="detail-section">
                            <h4>Stat Distribution</h4>
                            <div className="stat-distribution">
                                {Object.entries(selectedClass.statTemplate).map(([stat, value]) => (
                                    <div key={stat} className="stat-bar">
                                        <label>{stat.toUpperCase()}</label>
                                        <div className="bar-bg">
                                            <div 
                                                className="bar-fill" 
                                                style={{ width: `${(value / 69) * 100}%` }}
                                            >
                                                {value}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Passive Skill */}
                        <div className="detail-section">
                            <h4>Unique Passive: {selectedClass.passive.name}</h4>
                            <p className="passive-desc">{selectedClass.passive.description}</p>
                            <p className="mechanic-info">
                                <strong>Mechanic:</strong> {selectedClass.passive.mechanic}
                            </p>
                        </div>

                        {/* Gear Progression Preview */}
                        <div className="detail-section full-width">
                            <h4>Gear Progression Path</h4>
                            <div className="gear-tiers">
                                {selectedClass.gearSets.map((set) => (
                                    <div key={set.tier} className={`gear-tier tier-${set.tier}`}>
                                        <div className="tier-number">Tier {set.tier}</div>
                                        <div className="tier-level">{set.levelRange}</div>
                                        <div className="tier-name">{set.setName}</div>
                                        <div className="tier-bonus">+{set.bonus}% Bonus</div>
                                        <div className="tier-desc">{set.bonusDescription}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
```

### Step 2.2: Create ClassSelector.css
**File**: `src/components/ClassSelector.css`

```css
.class-selector-container {
    padding: 20px;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border-radius: 10px;
    color: #fff;
}

.class-selector-container h2 {
    text-align: center;
    margin-bottom: 10px;
    color: #ffde59;
    font-size: 28px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}

.subtitle {
    text-align: center;
    color: #aaa;
    margin-bottom: 20px;
    font-style: italic;
}

/* Class Grid */
.class-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
    margin-bottom: 30px;
}

.class-card {
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.class-card:hover {
    border-color: rgba(255, 222, 89, 0.5);
    background: rgba(255, 222, 89, 0.1);
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(255, 222, 89, 0.2);
}

.class-card.selected {
    border-color: #ffde59;
    background: rgba(255, 222, 89, 0.15);
    box-shadow: 0 0 20px rgba(255, 222, 89, 0.4);
}

.class-card.easy {
    border-left-color: #4ecca3;
}

.class-card.medium {
    border-left-color: #ffde59;
}

.class-card.hard {
    border-left-color: #ff6b6b;
}

.class-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    border-bottom: 1px solid rgba(255, 222, 89, 0.2);
    padding-bottom: 10px;
}

.class-header h3 {
    margin: 0;
    font-size: 16px;
    color: #ffde59;
}

.element-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
}

.element-badge.fire {
    background: rgba(255, 107, 107, 0.3);
    color: #ff6b6b;
}

.element-badge.ice {
    background: rgba(76, 204, 163, 0.3);
    color: #4ecca3;
}

.element-badge.wood {
    background: rgba(76, 204, 163, 0.3);
    color: #4ecca3;
}

.element-badge.lightning {
    background: rgba(255, 222, 89, 0.3);
    color: #ffde59;
}

.element-badge.void {
    background: rgba(150, 130, 220, 0.3);
    color: #9682dc;
}

.class-stats {
    margin-bottom: 10px;
    font-size: 12px;
}

.stat-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    color: #ddd;
}

.class-desc {
    margin: 0;
    color: #bbb;
    font-size: 13px;
    line-height: 1.4;
}

.passive-preview {
    margin-top: 10px;
    padding: 10px;
    background: rgba(255, 222, 89, 0.1);
    border-left: 3px solid #ffde59;
    border-radius: 4px;
    font-size: 12px;
}

.passive-preview h4 {
    margin: 0 0 5px 0;
    color: #ffde59;
    font-size: 13px;
}

.passive-preview p {
    margin: 0;
    color: #ddd;
    font-size: 11px;
    line-height: 1.3;
}

.selected-indicator {
    position: absolute;
    top: 10px;
    right: 10px;
    background: #ffde59;
    color: #1a1a2e;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: bold;
    font-size: 12px;
}

/* Detailed Info Section */
.class-details {
    background: rgba(255, 222, 89, 0.05);
    border: 1px solid rgba(255, 222, 89, 0.2);
    border-radius: 8px;
    padding: 20px;
    margin-top: 20px;
}

.class-details h3 {
    color: #ffde59;
    margin-top: 0;
    margin-bottom: 20px;
    text-align: center;
    font-size: 20px;
}

.details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
}

.detail-section {
    background: rgba(255, 255, 255, 0.03);
    padding: 15px;
    border-radius: 6px;
    border: 1px solid rgba(255, 222, 89, 0.1);
}

.detail-section.full-width {
    grid-column: 1 / -1;
}

.detail-section h4 {
    color: #ffde59;
    margin-top: 0;
    margin-bottom: 10px;
    font-size: 14px;
}

/* Stat Distribution */
.stat-distribution {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.stat-bar {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.stat-bar label {
    font-size: 12px;
    color: #bbb;
    text-transform: uppercase;
    font-weight: bold;
}

.bar-bg {
    background: rgba(0, 0, 0, 0.3);
    height: 20px;
    border-radius: 3px;
    overflow: hidden;
    border: 1px solid rgba(255, 222, 89, 0.2);
}

.bar-fill {
    background: linear-gradient(90deg, #ffde59 0%, #ffa500 100%);
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1a1a2e;
    font-size: 11px;
    font-weight: bold;
    min-width: 25px;
}

/* Passive Description */
.passive-desc {
    color: #ddd;
    font-size: 13px;
    line-height: 1.5;
    margin: 0 0 10px 0;
}

.mechanic-info {
    color: #aaa;
    font-size: 12px;
    line-height: 1.4;
    margin: 0;
    font-style: italic;
    padding: 10px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
}

/* Gear Tiers */
.gear-tiers {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
}

.gear-tier {
    background: rgba(0, 0, 0, 0.3);
    padding: 12px;
    border-radius: 6px;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
}

.gear-tier:hover {
    border-color: #ffde59;
    background: rgba(255, 222, 89, 0.1);
}

.tier-number {
    font-weight: bold;
    color: #ffde59;
    font-size: 16px;
    margin-bottom: 5px;
}

.tier-level {
    color: #aaa;
    font-size: 11px;
    margin-bottom: 5px;
}

.tier-name {
    color: #ddd;
    font-size: 12px;
    font-weight: bold;
    margin-bottom: 5px;
}

.tier-bonus {
    background: rgba(255, 222, 89, 0.2);
    color: #ffde59;
    padding: 4px;
    border-radius: 3px;
    font-size: 12px;
    font-weight: bold;
    margin-bottom: 5px;
}

.tier-desc {
    color: #aaa;
    font-size: 10px;
    line-height: 1.3;
}

.tier-1 { border-left: 3px solid #666; }
.tier-2 { border-left: 3px solid #4ecca3; }
.tier-3 { border-left: 3px solid #ffde59; }
.tier-4 { border-left: 3px solid #ff9f43; }
.tier-5 { border-left: 3px solid #ff6b6b; }

/* Responsive */
@media (max-width: 768px) {
    .class-grid {
        grid-template-columns: 1fr;
    }
    
    .gear-tiers {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .details-grid {
        grid-template-columns: 1fr;
    }
}
```

---

## 💾 PHASE 3: SAVE & PERSISTENCE (30 mins)

### Step 3.1: Update Player Data Structure
**File**: src/App.tsx

```typescript
interface PlayerData {
    username: string;
    level: number;
    exp: number;
    hp: number;
    maxHp: number;
    qi: number;
    maxQi: number;
    stats: {
        str: number;
        dex: number;
        con: number;
        spi: number;
        wil: number;
    };
    classId: number;          // NEW: Store selected class ID
    className: string;        // NEW: Store class name
    classPassive: string;     // NEW: Store passive name
    weapon: Weapon;
    // ... rest of player data
}
```

### Step 3.2: Save Class Selection
```typescript
const saveClassSelection = (selectedClass: HybridClass) => {
    const updatedPlayerData = {
        ...playerData,
        classId: selectedClass.id,
        className: selectedClass.name,
        classPassive: selectedClass.passive.name,
        // Apply stat template to stats
        stats: selectedClass.statTemplate
    };
    
    setPlayerData(updatedPlayerData);
    localStorage.setItem('playerData', JSON.stringify(updatedPlayerData));
};
```

---

## 🎯 PHASE 4: COMBAT INTEGRATION (1-2 hours)

### Step 4.1: Apply Passive Mechanics in Combat Loop
**Location**: [src/App.tsx](src/App.tsx#L180-L280)

```typescript
// In combat/attack logic
const applyPassiveEffect = (attacker: PlayerData, defender: any, damageDealt: number) => {
    const classData = hybridClassSystem.find(c => c.id === attacker.classId);
    if (!classData) return;
    
    switch(classData.passive.name) {
        case "Burning Blade":
            // Track hit counter
            handleBurningBlade(attacker, defender);
            break;
        case "Frostbite":
            handleFrostbite(attacker, defender);
            break;
        case "Desperate Power":
            applyDesperatePowerBonus(attacker);
            break;
        // ... handle all 12 passives
    }
};

// Example: Burning Blade implementation
const handleBurningBlade = (attacker: PlayerData, defender: any) => {
    // Implementation:
    // - Increment hit counter
    // - At 3 hits, set cooldown
    // - 4th hit within 8s = +40% damage + burn debuff
};
```

### Step 4.2: Gear Set Bonuses
```typescript
const getGearBonuses = (classId: number, playerLevel: number): {bonus: number, description: string} => {
    const classData = hybridClassSystem.find(c => c.id === classId);
    if (!classData) return { bonus: 0, description: "" };
    
    const applicableTier = classData.gearSets.find(set => {
        const [min, max] = set.levelRange.split('-').map(Number);
        return playerLevel >= min && playerLevel <= max;
    });
    
    return applicableTier 
        ? { bonus: applicableTier.bonus, description: applicableTier.bonusDescription }
        : { bonus: 0, description: "" };
};
```

---

## ✅ IMPLEMENTATION CHECKLIST

- [ ] Import hybridClasses.ts in App.tsx
- [ ] Replace class detection algorithm
- [ ] Add selectedClass state to App.tsx
- [ ] Create ClassSelector component
- [ ] Create ClassSelector.css styling
- [ ] Integrate ClassSelector into UI
- [ ] Update PlayerData interface with class fields
- [ ] Implement class selection save logic
- [ ] Implement passive mechanic handlers (12 total)
- [ ] Implement gear progression system
- [ ] Test class selection UI
- [ ] Test passive triggers in combat
- [ ] Test gear bonuses at each level
- [ ] Balance passive mechanics (playtest)

---

## 📝 TESTING GUIDE

### Unit Tests
```typescript
// Test stat allocation
expect(classStatTemplates[1]).toEqual({ str: 43, dex: 60, con: 26, spi: 34, wil: 9 });
expect(Object.values(classStatTemplates[1]).reduce((a,b) => a+b)).toBe(172); // Total AP

// Test gear progression
const blazing = hybridClassSystem[0];
expect(blazing.gearSets.length).toBe(5);
expect(blazing.gearSets.every(set => set.bonus <= 25)).toBe(true);
```

### Integration Tests
- [ ] Select each class → verify UI updates
- [ ] Switch weapon → class options change correctly
- [ ] Load saved player → correct class loads
- [ ] Attack with passive → passive triggers correctly
- [ ] Level up → gear bonus tier updates

### Balance Tests
- [ ] All 12 classes viable at level 1-29
- [ ] No class has >20% damage advantage over others
- [ ] Passives feel impactful but not game-breaking
- [ ] Hard classes reward skill (more damage potential)
- [ ] Easy classes accessible to new players

---

## 📚 DOCUMENTATION STRUCTURE

```
docs/
├── CLASS_SYSTEM_COMPLETE.md         ← Full class reference
├── CLASS_SYSTEM_IMPLEMENTATION.md   ← This file
├── PASSIVE_MECHANICS.md             ← Detailed passive logic
├── GEAR_PROGRESSION.md              ← Gear system details
└── BALANCE_NOTES.md                 ← Playtest findings
```

