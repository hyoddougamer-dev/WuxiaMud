import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Sparkles, Zap, Shield, Flame, Wind, Sword, Plus, Minus, Map as MapIcon, Skull, AlertTriangle, User, Compass, Box, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Star, Gem, X, Coins, Scroll, Hammer, CircleDot, Award, Footprints, ChevronsUp, Hexagon, Lock, BookOpen, Music, Droplet, Ghost, Leaf, Trash2 } from 'lucide-react';

// --- ASSETS & DATA (Moved outside to prevent re-renders) ---
const zoneImages = {
    sectHall: "https://files.fm/thumb.php?i=uemv8pffwa&v=0",
    herbGarden: "https://files.fm/thumb.php?i=kqfzc3y4uc&v=0",
    training: "https://files.fm/thumb.php?i=5jwwuh5c4v&v=0",
    alchemy: "https://files.fm/thumb.php?i=4e8br3kdws&v=0",
    quarters: "https://files.fm/thumb.php?i=62axa3a2e7&v=0",
    northGate: "https://files.fm/thumb.php?i=ygnk33cj3e&v=0",
    rocky: "https://files.fm/thumb.php?i=kfs2m8shn6&v=0",
    bandit: "https://files.fm/thumb.php?i=ddumek7zvr&v=0",
    mine: "https://files.fm/thumb.php?i=p6vmv5jdvy&v=0",
    thunderBase: "https://files.fm/thumb.php?i=c939v86tyt&v=0",
    thunderSummit: "https://files.fm/thumb.php?i=dtvk2ys37p&v=0",
    southGate: "https://files.fm/thumb.php?i=w8axg6n4xp&v=0",
    swamp: "https://files.fm/thumb.php?i=g7zf3thjg2&v=0",
    blackwater: "https://files.fm/thumb.php?i=8syrr3m397&v=0",
    hut: "https://files.fm/thumb.php?i=tfj26z3u4z&v=0",
    westRuins: "https://files.fm/thumb.php?i=um4t9x3q3d&v=0",
    graveyard: "https://files.fm/thumb.php?i=cddmk5r3aa&v=0",
    tombEntrance: "https://files.fm/thumb.php?i=ynb8b7fw5p&v=0",
    tombInner: "https://files.fm/thumb.php?i=zshvbzec7t&v=0",
    bamboo: "https://files.fm/thumb.php?i=kzdgueemxs&v=0",
    beastDen: "https://files.fm/thumb.php?i=4f9r6snfjq&v=0",
    elder: "https://files.fm/thumb.php?i=73445u29cx&v=0",
    paperMap: "https://files.fm/thumb.php?i=e5c3ysqs9p&v=0"
};

const mobImages = {
    "Garden Spider": "https://files.fm/thumb.php?i=mrfpgcrsux&v=0",
    "Herb Spirit": "https://files.fm/thumb.php?i=43j69bnpca&v=0",
    "Junior Disciple": "https://files.fm/thumb.php?i=y8r7x2t5na&v=0",
    "Meditation Monk": "https://files.fm/thumb.php?i=m2kam7w4ms&v=0",
    "Novice Cultivator": "https://files.fm/thumb.php?i=a944p5ty7p&v=0",
    "Pestilent Worm": "https://files.fm/thumb.php?i=38ct4pfcmq&v=0",
    "Sect Guard": "https://files.fm/thumb.php?i=3a6edhqppk&v=0",
    "Sect Servant": "https://files.fm/thumb.php?i=q27rpquayu&v=0",
    "Spirit Rat": "https://files.fm/thumb.php?i=dcndspevwx&v=0",
    "Training Dummy": "https://files.fm/thumb.php?i=2jpfw7waf5&v=0",
    "Bandit Archer": "https://files.fm/thumb.php?i=4nqpb5b6x8&v=0",
    "Bandit Captain": "https://files.fm/thumb.php?i=d3trc2hjhd&v=0",
    "Bandit Thug": "https://files.fm/thumb.php?i=fckvxcz6dp&v=0",
    "Corrupted Disciple": "https://files.fm/thumb.php?i=d6ztdq55vp&v=0",
    "Corrupted Monk": "https://files.fm/thumb.php?i=jj4hcbd75f&v=0",
    "Crystal Golem": "https://files.fm/thumb.php?i=kcbdxrjeq2&v=0",
    "Forest Guardian": "https://files.fm/thumb.php?i=babzuq5rem&v=0",
    "Frost Wolf": "https://files.fm/thumb.php?i=xgkfku42js&v=0",
    "Ghost Cultivator": "https://files.fm/thumb.php?i=n9kwsvf4xg&v=0",
    "Iron Claw Chief": "https://files.fm/thumb.php?i=f6nd7p662g&v=0",
    "Mountain Ape": "https://files.fm/thumb.php?i=7beez9zf77&v=0",
    "Poison Spider": "https://files.fm/thumb.php?i=h7rjzrg9dc&v=0",
    "Rock Serpent": "https://files.fm/thumb.php?i=tp4e27gau7&v=0",
    "Shadow Assassin": "https://files.fm/thumb.php?i=hgqvkcn2fw&v=0",
    "Stone Guardian": "https://files.fm/thumb.php?i=8k5ghke73f&v=0",
    "Abyssal Serpent": "https://files.fm/thumb.php?i=tp4e27gau7&v=0",
    "Ancient Lich": "https://files.fm/thumb.php?i=3h7b3xmxs3&v=0",
    "Celestial Phoenix": "https://files.fm/thumb.php?i=59xwg66c2n&v=0",
    "Corrupted Elder Tree": "https://files.fm/thumb.php?i=7cqeak3cjv&v=0",
    "Cursed Jade Guardian": "https://files.fm/thumb.php?i=zt2qdr32pb&v=0",
    "Divine Beast": "https://files.fm/thumb.php?i=cbm66crzsr&v=0",
    "Flame Demon": "https://files.fm/thumb.php?i=hpjfzynb6s&v=0",
    "Ice Queen": "https://files.fm/thumb.php?i=ggqreuz84e&v=0",
    "Lightning Elemental": "https://files.fm/thumb.php?i=xwrf2eu62g&v=0",
    "Shadow Lord": "https://files.fm/thumb.php?i=dyktd66nb7&v=0",
    "Soul Reaver": "https://files.fm/thumb.php?i=9k6fa2dpme&v=0",
    "Stone Colossus": "https://files.fm/thumb.php?i=nuvg5q83qx&v=0",
    "Three-Headed Thunder Dragon": "https://files.fm/thumb.php?i=yjws533zat&v=0",
    "Thunder Dragon Whelp": "https://files.fm/thumb.php?i=7ttgrgzhae&v=0",
    "Undead Emperor": "https://files.fm/thumb.php?i=699z7veu5e&v=0",
    "Void Beast": "https://files.fm/thumb.php?i=p8x4kcu3gn&v=0"
};

const classDefinitions = [
    { id: 1, name: "Blazing Sword Immortal", wpn: "Sword", stat1: "dex", stat2: "spi", element: "Fire", desc: "Speed and Fire Damage." },
    { id: 2, name: "Phoenix Cry Cultivator", wpn: "Zither", stat1: "spi", stat2: "wil", element: "Fire", desc: "AoE Fire and Qi Control." },
    { id: 3, name: "Glacial Shadow", wpn: "Sword", stat1: "dex", stat2: "str", element: "Ice", desc: "Evasion and Crit Control." },
    { id: 4, name: "Asura of War", wpn: "Saber", stat1: "str", stat2: "con", element: "Fire", desc: "High Damage at Low HP." },
    { id: 5, name: "Toxic Viper", wpn: "Sword", stat1: "dex", stat2: "wil", element: "Wood", desc: "DoT and Mobility." },
    { id: 6, name: "Frozen Steel Guard", wpn: "Saber", stat1: "con", stat2: "str", element: "Ice", desc: "Tank with Crowd Control." },
    { id: 7, name: "Verdant Blade Monarch", wpn: "Saber", stat1: "str", stat2: "spi", element: "Wood", desc: "Lifesteal and Sustain." },
    { id: 8, name: "Scorching Sound Demon", wpn: "Zither", stat1: "con", stat2: "spi", element: "Fire", desc: "Tanky AoE Mage." },
    { id: 9, name: "Life-Stealing Swordsman", wpn: "Sword", stat1: "dex", stat2: "con", element: "Wood", desc: "Evasion Tank with Lifesteal." },
    { id: 10, name: "Winter's Bulwark", wpn: "Saber", stat1: "con", stat2: "wil", element: "Ice", desc: "Maximum Defense." },
    { id: 11, name: "Divine Melody Healer", wpn: "Zither", stat1: "spi", stat2: "wil", element: "Wood", desc: "Group Healing and Support." },
    { id: 12, name: "Phantom Musician", wpn: "Zither", stat1: "spi", stat2: "dex", element: "Ice", desc: "Evasion and Control." },
    { id: 13, name: "Spellfire Duelist", wpn: "Sword", stat1: "spi", stat2: "dex", element: "Fire", desc: "Hybrid Magic Sword." },
    { id: 14, name: "Wilderness Stalker", wpn: "Saber", stat1: "str", stat2: "dex", element: "Wood", desc: "Stealth and Tracking." },
    { id: 15, name: "Eternal Echo Scholar", wpn: "Zither", stat1: "wil", stat2: "spi", element: "Ice", desc: "Debuff Master." }
];

const itemDatabase = [
    { id: "CONS_HP_001", name: "HP Restoring Pill", type: "consumable", tier: 1, stats: {}, desc: "Restores 50 HP instantly.", rarity: "Common", effect: "hp", amount: 50 },
    { id: "CONS_QI_001", name: "QI Restoring Pill", type: "consumable", tier: 1, stats: {}, desc: "Restores 30 QI instantly.", rarity: "Common", effect: "qi", amount: 30 },
    { id: "WP_SW_001", name: "Rusty Sword", type: "weapon", tier: 1, stats: { dex: 1 }, desc: "A dull blade.", rarity: "Common", subtype: "Sword" },
    { id: "WP_SW_002", name: "Iron Sword", type: "weapon", tier: 1, stats: { dex: 3 }, desc: "Standard issue.", rarity: "Common", subtype: "Sword" },
    { id: "WP_SW_007", name: "Flaming Sword", type: "weapon", tier: 3, stats: { dex: 20, spi: 10 }, desc: "Ignites enemies.", rarity: "Rare", subtype: "Sword" },
    { id: "WP_SB_001", name: "Wooden Saber", type: "weapon", tier: 1, stats: { str: 1 }, desc: "Practice weapon.", rarity: "Common", subtype: "Saber" },
    { id: "WP_ZI_001", name: "Bamboo Zither", type: "weapon", tier: 1, stats: { spi: 2 }, desc: "Basic instrument.", rarity: "Common", subtype: "Zither" },
    { id: "AR_LI_001", name: "Novice Robes", type: "armor", tier: 1, stats: { dex: 1 }, desc: "Simple cloth.", rarity: "Common" },
    { id: "AR_HE_001", name: "Cloth Armor", type: "armor", tier: 1, stats: { con: 1 }, desc: "Thick cloth.", rarity: "Common" },
    { id: "AC_RG_001", name: "Ring of Novice", type: "ring", tier: 1, stats: { str: 1, dex: 1, con: 1, spi: 1, wil: 1 }, desc: "A lucky ring.", rarity: "Uncommon" },
    { id: "AF_T1_001", name: "Novice's Charm", type: "artifact", tier: 1, stats: { str: 2, dex: 2, con: 2, spi: 2, wil: 2 }, desc: "Small stat boost.", rarity: "Rare" }
];

const mobDefinitions = [
    { id: 1, name: "Spirit Rat", level: 1, quality: "Normal", hp: 140, atk: 9, def: 7, exp: 15, stones: 10, drop: "Rat Tail" },
    { id: 2, name: "Sect Servant", level: 2, quality: "Normal", hp: 180, atk: 12, def: 9, exp: 25, stones: 15, drop: "Broom" },
    { id: 3, name: "Training Dummy", level: 2, quality: "Normal", hp: 200, atk: 0, def: 10, exp: 15, stones: 15, drop: "Wood Scraps" },
    { id: 4, name: "Pestilent Worm", level: 2, quality: "Normal", hp: 220, atk: 13, def: 11, exp: 35, stones: 20, drop: "Poison Sac" },
    { id: 8, name: "Sect Guard", level: 4, quality: "Normal", hp: 350, atk: 20, def: 18, exp: 65, stones: 35, drop: "Guard Badge" },
    { id: 10, name: "Junior Disciple", level: 5, quality: "Trainee", hp: 400, atk: 22, def: 18, exp: 70, stones: 30, drop: "Disciple Token" },
    { id: 15, name: "Bandit Thug", level: 6, quality: "Trainee", hp: 500, atk: 25, def: 20, exp: 90, stones: 40, drop: "Stolen Purse" },
    { id: 16, name: "Bandit Archer", level: 7, quality: "Trainee", hp: 450, atk: 35, def: 15, exp: 95, stones: 45, drop: "Arrowhead" },
    { id: 20, name: "Forest Guardian", level: 9, quality: "Elite", hp: 1200, atk: 45, def: 40, exp: 250, stones: 100, drop: "Guardian Core" }
];

const levelingTable = [
    { lvl: 1, req: 220, realm: "Qi Condensation", layer: "Stage 1" },
    { lvl: 2, req: 564, realm: "Qi Condensation", layer: "Stage 2" },
    { lvl: 3, req: 996, realm: "Qi Condensation", layer: "Stage 3" },
    { lvl: 4, req: 1503, realm: "Qi Condensation", layer: "Stage 4" },
    { lvl: 5, req: 2076, realm: "Qi Condensation", layer: "Stage 5" },
    { lvl: 6, req: 2710, realm: "Qi Condensation", layer: "Stage 6" },
    { lvl: 7, req: 3400, realm: "Qi Condensation", layer: "Stage 7" },
    { lvl: 8, req: 4143, realm: "Qi Condensation", layer: "Stage 8" },
    { lvl: 9, req: 25000, realm: "Qi Condensation", layer: "Stage 9", breakthrough: "Foundation Pill" },
    { lvl: 10, req: 27800, realm: "Foundation Est.", layer: "Early" }
];

const allSkills = [
    { id: 'sk1', name: "Strike", cost: 5, type: 'atk', icon: <Sword size={14}/>, desc: "Deal 150% Physical Dmg." },
    { id: 'sk2', name: "Heal", cost: 10, type: 'heal', icon: <Plus size={14}/>, desc: "Heal 30 + Spirit." },
    { id: 'sk3', name: "Fireball", cost: 15, type: 'atk', icon: <Flame size={14}/>, desc: "Deal 200% Magic Dmg." },
];

const avatarList = [
    "https://files.fm/thumb.php?i=d2xn36mt5r&v=0",
    "https://fv5-5.failiem.lv/thumb.php?i=8mzd2gbt9c&v=0",
    "https://files.fm/thumb.php?i=z7ykk4b823&v=0",
    "https://fv5-5.failiem.lv/thumb.php?i=cnmp2q5952&v=0",
    "https://files.fm/thumb.php?i=6ecvm9bbfk&v=0",
    "https://files.fm/thumb.php?i=z73tka6mrm&v=0"
];

// FULL WORLD MAP DATA
const worldMap = {
    "0,0": { name: "Sect Main Hall", tier: 1, quality: 0, desc: "Spawn Point. The heart of the Azure Cloud Sect.", img: zoneImages.sectHall, exits: ['n', 's', 'e', 'w'] },
    "0,1": { name: "Spirit Herb Garden", tier: 1, quality: 0, desc: "Disciples tend to weak herbs.", img: zoneImages.herbGarden, exits: ['s', 'n'] },
    "1,0": { name: "Training Courtyard", tier: 1, quality: 0, desc: "Wooden swords clash.", img: zoneImages.training, exits: ['w', 'e'] },
    "-1,0": { name: "Alchemy Pavilion", tier: 1, quality: 0, desc: "Smoke and burnt pills.", img: zoneImages.alchemy, exits: ['e', 'w'] },
    "0,-1": { name: "Disciple Quarters", tier: 1, quality: 0, desc: "Simple huts for rest.", img: zoneImages.quarters, exits: ['n', 's'] },
    "0,2": { name: "North Gate", tier: 2, quality: 1, desc: "Border to the wild.", img: zoneImages.northGate, exits: ['s', 'n'] },
    "0,3": { name: "Rocky Path", tier: 2, quality: 1, desc: "Uneven terrain.", img: zoneImages.rocky, exits: ['s', 'n', 'w'] },
    "-1,3": { name: "Bandit Camp", tier: 2, quality: 1, desc: "Thugs lurk here.", img: zoneImages.bandit, exits: ['e'] },
    "0,4": { name: "Abandoned Mine", tier: 2, quality: 2, desc: "Rich in minerals.", img: zoneImages.mine, exits: ['s', 'n'] },
    "0,5": { name: "Thunder Mtn Base", tier: 3, quality: 2, desc: "The air crackles.", img: zoneImages.thunderBase, exits: ['s', 'n'] },
    "0,6": { name: "Thunder Summit", tier: 3, quality: 4, desc: "Heavenly Tribulation lightning.", img: zoneImages.thunderSummit, exits: ['s'] },
    "0,-2": { name: "South Gate", tier: 2, quality: 1, desc: "Exit to the swamp.", img: zoneImages.southGate, exits: ['n', 's'] },
    "0,-3": { name: "Misty Swamp", tier: 2, quality: 1, desc: "Poisonous fog.", img: zoneImages.swamp, exits: ['n', 's'] },
    "0,-4": { name: "Blackwater Lake", tier: 3, quality: 2, desc: "Dark waters hide beasts.", img: zoneImages.blackwater, exits: ['n', 'w'] },
    "-1,-4": { name: "Hermit's Hut", tier: 2, quality: 3, desc: "A strange aura.", img: zoneImages.hut, exits: ['e'] },
    "-2,0": { name: "West Ruins", tier: 2, quality: 1, desc: "Broken pillars.", img: zoneImages.westRuins, exits: ['e', 'w'] },
    "-3,0": { name: "Graveyard", tier: 2, quality: 1, desc: "Restless spirits.", img: zoneImages.graveyard, exits: ['e', 'w'] },
    "-4,0": { name: "Tomb Entrance", tier: 3, quality: 2, desc: "Sealed for centuries.", img: zoneImages.tombEntrance, exits: ['e', 'n'] },
    "-4,1": { name: "Inner Tomb", tier: 3, quality: 4, desc: "Ancient treasures.", img: zoneImages.tombInner, exits: ['s'] },
    "2,0": { name: "Bamboo Forest", tier: 2, quality: 1, desc: "Peaceful yet dangerous.", img: zoneImages.bamboo, exits: ['w', 'e'] },
    "3,0": { name: "Beast Den", tier: 2, quality: 2, desc: "Roars echo here.", img: zoneImages.beastDen, exits: ['w', 'e'] },
    "4,0": { name: "Elder's Peak", tier: 3, quality: 5, desc: "Dense spiritual energy.", img: zoneImages.elder, exits: ['w'] },
};

const bestiaryMap = {
    "0,0": [2], "1,0": [3], "0,1": [1], "-1,0": [2], "0,-1": [1, 4], "0,2": [8, 10],
    "0,3": [10, 15], "-1,3": [15, 16], "0,4": [16, 4], "2,0": [20]
};

// --- HELPER FUNCTIONS ---
const getRarityColor = (rarity) => {
    switch(rarity) {
        case 'Legendary': return 'text-amber-500';
        case 'Epic': return 'text-purple-400';
        case 'Rare': return 'text-cyan-400';
        case 'Uncommon': return 'text-green-400';
        default: return 'text-gray-300';
    }
};

const getTierColor = (tier) => {
    if (tier >= 3) return 'text-red-400';
    if (tier === 2) return 'text-amber-400';
    return 'text-emerald-400';
};

const getStatLabel = (key) => {
    const map = {
        dex: { name: "Wind Walk", color: "text-emerald-400" },
        str: { name: "Ox Power", color: "text-red-400" },
        con: { name: "Golden Body", color: "text-yellow-400" },
        spi: { name: "Dao Mind", color: "text-cyan-400" },
        wil: { name: "Heart Demon", color: "text-purple-400" }
    };
    return map[key] || { name: key, color: "text-white" };
};

const getIcon = (type, className = "") => {
    switch(type) {
        case 'healing_pill': return <Plus size={14} className={className || "text-red-400"}/>;
        case 'foundation_pill': return <CircleDot size={14} className={className || "text-cyan-400"}/>;
        case 'gear_box': return <Box size={14} className={className || "text-purple-400"}/>;
        case 'monster_drop': return <Box size={14} className={className || "text-amber-500"}/>;
        default: return <Box size={14} className={className || "text-gray-500"}/>;
    }
};

const getMobById = (id) => {
    const def = mobDefinitions.find(m => m.id === id);
    if (!def) return mobDefinitions[0];
    const imgUrl = mobImages[def.name] || mobImages["Training Dummy"];
    return { ...def, img: imgUrl };
};

const getLevelInfo = (lvl) => levelingTable.find(l => l.lvl === lvl) || levelingTable[levelingTable.length - 1];
const getItemById = (id) => itemDatabase.find(i => i.id === id);

// --- RESTORED COMPONENTS (MISSING IN v28) ---
const VitalBar = ({ label, val, max, color, text }) => (
    <div className="flex flex-col gap-1 w-full">
        <div className="flex justify-between items-end"><span className={`text-[10px] font-bold uppercase tracking-wider ${text}`}>{label}</span><span className="text-[10px] font-mono text-gray-400">{val}/{max}</span></div>
        <div className="h-2 bg-[#050608] rounded-full overflow-hidden border border-[#2a2f3a]"><div className={`h-full ${color} transition-all duration-500`} style={{width: `${Math.min(100, (val/max)*100)}%`}}></div></div>
    </div>
);

const QualityStars = ({ quality }) => (<div className="flex gap-0.5">{[...Array(5)].map((_, i) => (<Star key={i} size={8} className={i < quality ? "fill-amber-400 text-amber-400" : "text-gray-700"} />))}</div>);

// --- SEPARATED MAP COMPONENT TO FIX ZOOM/DRAG ---
const VisualWorldMap = ({ coords, setCoords, player, setMapOpen, onTravel }) => {
    const [view, setView] = useState({ x: -coords.x * 120, y: coords.y * 120, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

    // Initialize view to center on player once
    useEffect(() => {
        setView(prev => ({ ...prev, x: -coords.x * 120, y: coords.y * 120 }));
    }, []); // Empty dependency array to run only once on mount

    const handleWheel = (e) => {
        const scaleAmount = -e.deltaY * 0.001;
        const newScale = Math.min(Math.max(view.scale + scaleAmount, 0.4), 3.0);
        setView(prev => ({ ...prev, scale: newScale }));
    };

    const handleZoom = (delta) => {
        setView(prev => ({ ...prev, scale: Math.min(Math.max(prev.scale + delta, 0.4), 3.0) }));
    };

    const handleMouseDown = (e) => { 
        e.preventDefault(); // Prevents image ghost dragging
        setIsDragging(true); 
        setLastMouse({ x: e.clientX, y: e.clientY }); 
    };
    
    const handleMouseMove = (e) => {
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
    const connections = [];
    Object.keys(worldMap).forEach(key => {
        const [x, y] = key.split(',').map(Number);
        const loc = worldMap[key];
        if (loc.exits.includes('e') && worldMap[`${x+1},${y}`]) connections.push({ x1: x*nodeSpacing, y1: -y*nodeSpacing, x2: (x+1)*nodeSpacing, y2: -y*nodeSpacing });
        if (loc.exits.includes('n') && worldMap[`${x},${y+1}`]) connections.push({ x1: x*nodeSpacing, y1: -y*nodeSpacing, x2: x*nodeSpacing, y2: -(y+1)*nodeSpacing });
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
                    className="relative flex-1 bg-[#050608] overflow-hidden cursor-move select-none" 
                    onMouseDown={handleMouseDown} 
                    onMouseMove={handleMouseMove} 
                    onMouseUp={handleMouseUp} 
                    onMouseLeave={handleMouseLeave} 
                    onWheel={handleWheel}
                >
                    <div className="absolute inset-0 flex items-center justify-center transition-transform duration-75 ease-out origin-center" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
                        <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ width: '2500px', height: '2000px', left: '50%', top: '50%' }}>
                            <img src={zoneImages.paperMap} draggable="false" className="w-full h-full object-cover opacity-60" style={{ pointerEvents: 'none' }} />
                        </div>
                        <svg className="absolute overflow-visible pointer-events-none" style={{ top: '50%', left: '50%' }}>{connections.map((line, i) => (<line key={i} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#442a0f" strokeWidth="3" strokeOpacity="0.8" strokeDasharray="8,4" />))}</svg>
                        <div className="absolute" style={{ top: '50%', left: '50%' }}>
                            {Object.keys(worldMap).map(key => {
                                const [x, y] = key.split(',').map(Number);
                                const loc = worldMap[key];
                                const isCurrent = x === coords.x && y === coords.y;
                                const isVisited = player.visited.includes(key);
                                return (
                                    <div key={key} className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group ${isVisited ? 'cursor-pointer hover:z-50' : 'cursor-not-allowed opacity-50'}`} style={{ left: `${x*nodeSpacing}px`, top: `${-y*nodeSpacing}px` }} onClick={(e) => { e.stopPropagation(); onTravel(x, y); }}>
                                        <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-lg transition-all z-10 ${isCurrent ? 'bg-amber-100 border-amber-500 scale-125 z-20 shadow-[0_0_15px_rgba(245,158,11,0.6)]' : loc.tier === 1 ? 'bg-emerald-950 border-emerald-600' : loc.tier===2 ? 'bg-amber-950 border-amber-600' : 'bg-red-950 border-red-600'}`}>
                                            {isCurrent ? <User size={24} className="text-black animate-pulse" /> : 
                                             !isVisited ? <span className="text-xs font-bold text-gray-500">?</span> :
                                             loc.tier >= 3 ? <Lock size={20} className="text-red-500"/> : 
                                             loc.tier === 1 ? <Shield size={20} className="text-emerald-500"/> : <AlertTriangle size={20} className="text-amber-500"/>}
                                        </div>
                                        {isVisited && <div className="mt-2 px-3 py-1 bg-black/90 rounded text-[10px] font-bold uppercase tracking-wider border border-white/10 whitespace-nowrap shadow-lg group-hover:scale-110 transition-transform">{loc.name}</div>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                {/* ZOOM CONTROLS */}
                <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2">
                    <button onClick={() => handleZoom(0.3)} className="w-12 h-12 bg-[#1e293b] border border-white/20 rounded-full flex items-center justify-center text-gray-200 hover:text-white hover:border-amber-500 hover:bg-amber-900/80 transition-all shadow-xl active:scale-95"><Plus size={24}/></button>
                    <button onClick={() => handleZoom(-0.3)} className="w-12 h-12 bg-[#1e293b] border border-white/20 rounded-full flex items-center justify-center text-gray-200 hover:text-white hover:border-amber-500 hover:bg-amber-900/80 transition-all shadow-xl active:scale-95"><Minus size={24}/></button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN APP COMPONENT ---
const App = () => {
  const statsConfig = [
    { id: 'str', label: "Ox Power", icon: <Sword size={14} />, color: "text-red-400", barColor: "bg-red-500" },
    { id: 'dex', label: "Wind Walk", icon: <Wind size={14} />, color: "text-emerald-400", barColor: "bg-emerald-500" },
    { id: 'con', label: "Golden Body", icon: <Shield size={14} />, color: "text-yellow-400", barColor: "bg-yellow-500" },
    { id: 'spi', label: "Dao Mind", icon: <Zap size={14} />, color: "text-cyan-400", barColor: "bg-cyan-500" },
    { id: 'wil', label: "Heart Demon", icon: <Flame size={14} />, color: "text-purple-400", barColor: "bg-purple-500" },
  ];

  // --- STATE ---
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [gameLog, setGameLog] = useState([{ text: "Welcome to the Path of Immortality.", type: "system" }]);
  const [inputValue, setInputValue] = useState("");
  const logEndRef = useRef(null);
  const [isAvatarModalOpen, setAvatarModalOpen] = useState(false);
  const [isMapOpen, setMapOpen] = useState(false);
  const [isSkillModalOpen, setSkillModalOpen] = useState(false);
  const [inventoryTab, setInventoryTab] = useState(0); 
  
  const [hoverItem, setHoverItem] = useState(null);
  const [mousePos, setMousePos] = useState({x:0, y:0});

  const [combat, setCombat] = useState(null);
  const [combatLog, setCombatLog] = useState([]);
  const combatLogRef = useRef(null);

  const initialPlayerState = {
    name: "Xiao Chen",
    title: "Outer Disciple",
    level: 1,
    hp: 100, maxHp: 100,
    qi: 30, maxQi: 50,
    exp: 0, 
    ap: 5,
    avatar: avatarList[0],
    stats: { str: 10, dex: 10, con: 10, spi: 10, wil: 10 },
    gear: { weapon: "WP_SW_001", armor: "AR_LI_001", ring: null, amulet: null, artifact: null },
    skills: [ 'sk1', 'sk2', null ],
    learnedSkills: ['sk1', 'sk2'],
    spiritStones: 0,
    contribution: 0,
    visited: ["0,0"],
    lastCombatTime: 0,
    isMeditating: false,
    inventory: [
        { id: 1, name: "HP Restoring Pill", count: 3, iconType: 'healing_pill', desc: "+50 HP. Restores health instantly." },
        { id: 2, name: "QI Restoring Pill", count: 2, iconType: 'foundation_pill', desc: "+30 QI. Restores spiritual energy instantly." }
    ]
  };

  const [player, setPlayer] = useState(() => {
      const saved = localStorage.getItem('wuxia_player_v24');
      return saved ? JSON.parse(saved) : initialPlayerState;
  });

  useEffect(() => {
      localStorage.setItem('wuxia_player_v24', JSON.stringify(player));
  }, [player]);
  // --- PASSIVE RECOVERY SYSTEM ---
  useEffect(() => {
    if (combat && combat.active) return;
    
    const recoveryInterval = setInterval(() => {
      setPlayer(p => {
        const timeSinceCombat = Date.now() - p.lastCombatTime;
        const isOutOfCombat = timeSinceCombat > 5000;
        
        if (isOutOfCombat && !p.isMeditating) {
          const hpRecovery = Math.ceil(p.maxHp * 0.02);
          const qiRecovery = Math.ceil(p.maxQi * 0.03);
          return {
            ...p,
            hp: Math.min(p.hp + hpRecovery, p.maxHp),
            qi: Math.min(p.qi + qiRecovery, p.maxQi)
          };
        }
        return p;
      });
    }, 2000);
    
    return () => clearInterval(recoveryInterval);
  }, [combat]);


  useEffect(() => {
    const handleKeyPress = (e) => {
        if (e.key.toLowerCase() === 'm' && !inputValue) {
            setMapOpen(prev => !prev);
        }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [inputValue]);

  const hardReset = () => {
      if(confirm("Are you sure? This deletes your save.")) {
          localStorage.removeItem('wuxia_player_v24');
          setPlayer(initialPlayerState);
          window.location.reload();
      }
  };

  const getCurrentLocation = () => worldMap[`${coords.x},${coords.y}`] || { name: "The Void", tier: 3, quality: 0, desc: "You are lost.", img: zoneImages.westRuins, exits: [] };

  const totalStats = useMemo(() => {
      let totals = { ...player.stats };
      Object.values(player.gear).forEach(itemId => {
          if (!itemId) return;
          const item = getItemById(itemId);
          if (item && item.stats) {
              Object.keys(item.stats).forEach(stat => {
                  totals[stat] = (totals[stat] || 0) + item.stats[stat];
              });
          }
      });
      return totals;
  }, [player.stats, player.gear]);

  const combatStats = useMemo(() => {
      return {
          pAtk: Math.floor(totalStats.str * 1.5 + totalStats.spi * 0.2),
          mAtk: Math.floor(totalStats.spi * 1.5 + totalStats.str * 0.2),
          def: Math.floor(totalStats.con * 1.5 + (totalStats.con * 0.5)),
          crit: (totalStats.dex * 0.5).toFixed(1),
          dodge: (totalStats.dex * 0.4).toFixed(1),
      };
  }, [totalStats]);

  const detectedPath = useMemo(() => {
      const weapon = getItemById(player.gear.weapon);
      if (!weapon) return { name: "Wandering Cultivator", desc: "No specific path." };
      const stats = totalStats;
      const possibleClasses = classDefinitions.filter(c => c.wpn === weapon.subtype);
      let bestMatch = null;
      let maxScore = 0;
      possibleClasses.forEach(cls => {
          const score = stats[cls.stat1] + (stats[cls.stat2] * 0.5);
          if (score > maxScore) { maxScore = score; bestMatch = cls; }
      });
      return bestMatch || { name: "Martial Artist", desc: "Using " + weapon.subtype };
  }, [player.gear.weapon, totalStats]);

  const addLog = (text, type = "normal") => {
    setGameLog(prev => [...prev, { text, type }].slice(-50));
  };
  const addCombatLog = (text, type="normal") => setCombatLog(prev => [...prev, {text, type}].slice(-8));

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [gameLog]);
  useEffect(() => { combatLogRef.current?.scrollIntoView({ behavior: "smooth" }); }, [combatLog]);

  useEffect(() => {
    let combatInterval;
    if (combat && combat.active) {
        combatInterval = setInterval(() => {
            const pAtk = combatStats.pAtk;
            const pDmgRaw = pAtk - combat.mob.def;
            const pDmg = Math.max(1, Math.floor(pDmgRaw * (0.9 + Math.random() * 0.2)));

            const mAtk = combat.mob.atk;
            const mDef = combatStats.def;
            const mDmgRaw = mAtk - mDef;
            const mDmg = Math.max(1, Math.floor(mDmgRaw));

            setCombat(prev => {
                const newMobHp = prev.mobHp - pDmg;
                const newPlayerHp = prev.playerHp - mDmg;
                const qiRecovery = Math.ceil(prev.maxPlayerQi * 0.01);
                const newPlayerQi = Math.min(prev.playerQi + qiRecovery, prev.maxPlayerQi);

                addCombatLog(`You hit for ${pDmg} dmg!`, "success");
                addCombatLog(`${prev.mob.name} hits for ${mDmg} dmg!`, "danger");
                if (qiRecovery > 0 && newPlayerQi < prev.maxPlayerQi) addCombatLog(`+${qiRecovery} QI recovered.`, "info");

                if (newPlayerHp <= 0) {
                    endCombat(false, prev.mob);
                    return { ...prev, active: false, playerHp: 0 };
                }
                if (newMobHp <= 0) {
                    endCombat(true, prev.mob);
                    return { ...prev, active: false, mobHp: 0 };
                }
                return { ...prev, mobHp: newMobHp, playerHp: newPlayerHp, playerQi: newPlayerQi };
            });
        }, 1500);
    }
    return () => clearInterval(combatInterval);
  }, [combat, combatStats]);

  const startCombat = () => {
    const key = `${coords.x},${coords.y}`;
    const possibleMobIds = bestiaryMap[key];
    if (!possibleMobIds) return addLog("There are no enemies here.", "normal");
    const mobId = possibleMobIds[Math.floor(Math.random() * possibleMobIds.length)];
    const mobTemplate = getMobById(mobId); 

    setCombat({ 
        active: true, 
        mob: mobTemplate, 
        mobHp: mobTemplate.hp, 
        playerHp: player.hp, 
        maxPlayerHp: player.maxHp,
        playerQi: player.qi,
        maxPlayerQi: player.maxQi
    });
    setCombatLog([{text: `Encountered a ${mobTemplate.name} (Lvl ${mobTemplate.level})!`, type: "warning"}]);
  };

  const endCombat = (win, mob) => {
      if (win) {
          addCombatLog(`Victory! +${mob.exp} Exp, +${mob.stones} SS.`, "gold");
          if (mob.drop) addCombatLog(`Loot: ${mob.drop}`, "success");
          setPlayer(p => ({
            ...p,
            lastCombatTime: Date.now()
          }));
          setPlayer(p => {
             let newInv = [...p.inventory];
             if (Math.random() < 0.15) {
                 const potentialDrops = itemDatabase.filter(i => i.tier === Math.min(3, Math.ceil(mob.level/10)) && i.type !== 'consumable');
                 if(potentialDrops.length > 0) {
                     const droppedItem = potentialDrops[Math.floor(Math.random() * potentialDrops.length)];
                     newInv.push({ id: Date.now(), itemId: droppedItem.id, name: droppedItem.name, count: 1, iconType: 'gear_box', desc: droppedItem.desc, type: 'gear' });
                     addCombatLog(`Found: ${droppedItem.name}!`, "gold");
                 }
             }
             if (Math.random() < 0.15) {
                 const consumableDrops = itemDatabase.filter(i => i.type === 'consumable' && i.tier === Math.min(2, Math.ceil(mob.level/10)));
                 if(consumableDrops.length > 0) {
                     const droppedItem = consumableDrops[Math.floor(Math.random() * consumableDrops.length)];
                     const existingConsumable = newInv.find(inv => inv.name === droppedItem.name);
                     if (existingConsumable) {
                         existingConsumable.count += 1;
                     } else {
                         newInv.push({ id: Date.now(), itemId: droppedItem.id, name: droppedItem.name, count: 1, iconType: 'healing_pill', desc: droppedItem.desc, type: 'consumable' });
                     }
                     addCombatLog(`Found: ${droppedItem.name}!`, "success");
                 }
             }
             if (mob.drop && Math.random() > 0.4) {
                 const existingItem = newInv.find(i => i.name === mob.drop);
                 if (existingItem) existingItem.count += 1;
                 else newInv.push({ id: Date.now(), name: mob.drop, count: 1, iconType: 'monster_drop', desc: "Monster drop." });
             }

             const rawExp = p.exp + mob.exp;
             const nextLvl = getLevelInfo(p.level);
             let finalExp = rawExp;
             let finalLvl = p.level;
             
             if (rawExp >= nextLvl.req && !nextLvl.breakthrough) {
                 finalLvl++;
                 addLog("Level Up!", "success");
             }

             return {
              ...p,
              level: finalLvl,
              realm: getLevelInfo(finalLvl).realm,
              exp: finalExp,
              spiritStones: p.spiritStones + (mob.stones || 0),
              hp: combat.playerHp,
              qi: combat.playerQi,
              inventory: newInv
            };
          });
          setTimeout(() => setCombat(null), 2500);
      } else {
          addCombatLog("DEFEAT! You pass out...", "danger");
          setPlayer(p => ({ ...p, hp: 1, lastCombatTime: Date.now() }));
          setTimeout(() => setCombat(null), 2500);
      }
  };

  const attemptFlee = () => {
      if (!combat || !combat.active) return;
      if (Math.random() < 0.8) {
          addCombatLog("You escaped safely!", "success");
          setTimeout(() => setCombat(null), 1000);
      } else addCombatLog("Failed to flee!", "danger");
  };

  const useSkill = (skillId) => {
      if (!combat || !combat.active) return;
      const skill = allSkills.find(s => s.id === skillId);
      if (!skill) return;

      if (combat.playerQi >= skill.cost) {
          setCombat(prev => {
              const newQi = prev.playerQi - skill.cost;
              if (skill.type === 'atk') {
                   const dmg = Math.floor(combatStats.pAtk * 1.5);
                   const newMobHp = prev.mobHp - dmg;
                   if (newMobHp <= 0) { setTimeout(() => endCombat(true, prev.mob), 100); return { ...prev, active: false, mobHp: 0, playerQi: newQi }; }
                   addCombatLog(`${skill.name}: ${dmg} dmg!`, "info");
                   return { ...prev, mobHp: newMobHp, playerQi: newQi };
              } else if (skill.type === 'heal') {
                  const heal = 30 + totalStats.spi;
                  addCombatLog(`${skill.name}: +${heal} HP.`, "info");
                  return { ...prev, playerHp: Math.min(prev.playerHp + heal, prev.maxPlayerHp), playerQi: newQi };
              }
              return { ...prev, playerQi: newQi };
          });
      } else addCombatLog("No Qi!", "warning");
  };

  const equipItem = (itemFromInv) => {
      const dbItem = itemDatabase.find(i => i.id === itemFromInv.itemId);
      if (!dbItem) return;
      const slot = dbItem.type; 
      const currentEquippedId = player.gear[slot];
      let newInv = player.inventory.filter(i => i.id !== itemFromInv.id);

      if (currentEquippedId) {
          const oldItem = itemDatabase.find(i => i.id === currentEquippedId);
          if (oldItem) newInv.push({ id: Date.now(), itemId: oldItem.id, name: oldItem.name, count: 1, iconType: 'gear_box', desc: oldItem.desc, type: 'gear' });
      }

      setPlayer(p => ({
          ...p,
          gear: { ...p.gear, [slot]: dbItem.id },
          inventory: newInv
      }));
      addLog(`Equipped ${dbItem.name}.`, "success");
  };

  const equipSkill = (skillId, slotIndex) => {
      setPlayer(p => {
          const newSkills = [...p.skills];
          newSkills[slotIndex] = skillId;
          return { ...p, skills: newSkills };
      });
      setSkillModalOpen(false);
  };

  const movePlayer = (dir) => {
    const dMap = { n: {x:0, y:1}, s: {x:0, y:-1}, e: {x:1, y:0}, w: {x:-1, y:0} };
    const delta = dMap[dir] || dMap[dir.charAt(0)];
    if (!delta) return;
    const nextX = coords.x + delta.x;
    const nextY = coords.y + delta.y;
    const targetKey = `${nextX},${nextY}`;
    
    if (worldMap[targetKey]) {
        setCoords({x: nextX, y: nextY});
        addLog(`Travelled to ${worldMap[targetKey].name}.`, "system");
        setPlayer(prev => {
            if (!prev.visited.includes(targetKey)) return { ...prev, visited: [...prev.visited, targetKey] };
            return prev;
        });
        const target = worldMap[targetKey];
        if (target.tier > 1 && Math.random() < 0.15) setTimeout(startCombat, 600);
    } else addLog("Blocked path.", "warning");
  };

  const travelFast = (targetX, targetY) => {
      const key = `${targetX},${targetY}`;
      const loc = worldMap[key];
      if (!player.visited.includes(key)) { addLog("Unknown location.", "warning"); return; }
      if (loc && loc.tier >= 3) { addLog("Too dangerous to fly.", "danger"); return; }
      if (loc) {
          setCoords({ x: targetX, y: targetY });
          setMapOpen(false);
          addLog(`Fast travelled to ${loc.name}.`, "system");
      }
  };

  const allocateStat = (statId) => {
    if (player.ap > 0) setPlayer(prev => ({ ...prev, ap: prev.ap - 1, stats: { ...prev.stats, [statId]: prev.stats[statId] + 1 } }));
  };

  const useConsumable = (itemName) => {
    if (!combat || !combat.active) { addCombatLog("Can only use consumables during combat!", "danger"); return; }
    
    setPlayer(p => {
      const invIndex = p.inventory.findIndex(i => i.name === itemName);
      if (invIndex === -1) { addCombatLog("Item not found!", "danger"); return p; }
      
      const item = p.inventory[invIndex];
      if (item.count <= 0) { addCombatLog("No more of that item!", "danger"); return p; }
      
      let hpRestore = 0, qiRestore = 0, logMsg = "";
      
      if (itemName === "HP Restoring Pill") {
        hpRestore = 50;
        logMsg = "Used HP Restoring Pill! +50 HP";
      } else if (itemName === "QI Restoring Pill") {
        qiRestore = 30;
        logMsg = "Used QI Restoring Pill! +30 QI";
      } else {
        return p;
      }
      
      const newInv = [...p.inventory];
      newInv[invIndex].count -= 1;
      if (newInv[invIndex].count === 0) {
        newInv.splice(invIndex, 1);
      }
      
      addCombatLog(logMsg, "success");
      
      if (combat && combat.active) {
        setCombat(prev => ({
          ...prev,
          playerHp: Math.min(prev.playerHp + hpRestore, prev.maxPlayerHp),
          playerQi: Math.min(prev.playerQi + qiRestore, prev.maxPlayerQi)
        }));
      }
      
      return { ...p, inventory: newInv };
    });
  };

  const handleCommand = (e) => {
    if (e.key !== 'Enter') return;
    const cmd = inputValue.trim().toLowerCase();
    setInputValue("");
    if (!cmd) return;
    addLog(`> ${cmd}`, "cmd");
    const parts = cmd.split(" ");
    if (['n', 's', 'e', 'w'].includes(parts[0])) { movePlayer(parts[0]); return; }
    
    if (parts[0] === 'meditate') {
        if (combat && combat.active) { addLog("Cannot meditate during combat!", "danger"); return; }
        if (player.isMeditating) { addLog("Already meditating!", "warning"); return; }
        
        setPlayer(p => ({ ...p, isMeditating: true }));
        addLog("You begin to meditate...", "system");
        
        const meditationInterval = setInterval(() => {
          setPlayer(p => {
            if (!p.isMeditating) {
              clearInterval(meditationInterval);
              return p;
            }
            const loc = getCurrentLocation();
            const multipliers = [1.0, 1.2, 1.5, 2.0, 3.5, 5.0];
            const multiplier = multipliers[loc.quality] || 1.0;
            const hpGain = Math.ceil(p.maxHp * 0.05 * multiplier);
            const qiGain = Math.ceil(p.maxQi * 0.08 * multiplier);
            
            const newHp = Math.min(p.hp + hpGain, p.maxHp);
            const newQi = Math.min(p.qi + qiGain, p.maxQi);
            
            if (newHp === p.maxHp && newQi === p.maxQi) {
              addLog("Meditation complete. Fully recovered.", "success");
              return { ...p, isMeditating: false, hp: newHp, qi: newQi };
            }
            
            return { ...p, hp: newHp, qi: newQi };
          });
        }, 1000);
        
        return;
    } else if (parts[0] === 'stop') {
        if (player.isMeditating) {
          setPlayer(p => ({ ...p, isMeditating: false }));
          addLog("Meditation stopped.", "system");
        }
        return;
    } else if (parts[0] === 'use' && parts[1]) {
        const itemName = parts.slice(1).join(" ");
        useConsumable(itemName);
        return;
    } else addLog("Unknown command.", "normal");
  };

  // --- UI COMPONENTS ---
  const GearSlot = ({ label, itemId, type }) => {
      const item = getItemById(itemId);
      return (
          <div 
            className="flex items-center gap-3 bg-[#151820] p-2 rounded border border-white/5 relative group hover:border-amber-500/50"
            onMouseEnter={(e) => { if(item) { setHoverItem(item); setMousePos({x:e.clientX, y:e.clientY}); } }}
            onMouseLeave={() => setHoverItem(null)}
          >
              <div className={`w-8 h-8 rounded flex items-center justify-center border ${item ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-white/10 bg-black text-gray-500'}`}>
                  {type === 'weapon' ? <Sword size={14}/> : type === 'armor' ? <Shield size={14}/> : type==='ring'?<CircleDot size={14}/> : type==='amulet'?<Award size={14}/> : <Hexagon size={14}/>}
              </div>
              <div className="flex flex-col">
                  <span className="text-[9px] text-gray-500 uppercase font-bold">{label}</span>
                  <span className={`text-xs font-bold ${item ? getRarityColor(item.rarity) : 'text-gray-600'}`}>{item ? item.name : "Empty"}</span>
              </div>
          </div>
      );
  };

  const Tooltip = () => {
      if (!hoverItem) return null;
      const style = { 
        top: Math.min(window.innerHeight - 200, mousePos.y + 20), 
        left: Math.min(window.innerWidth - 240, mousePos.x + 20) 
      };

      return (
          <div className="fixed z-[9999] bg-[#0a0c10] border border-amber-500/50 p-3 rounded shadow-xl w-56 pointer-events-none flex flex-col gap-1 backdrop-blur-md" style={style}>
              <div className={`text-sm font-serif font-bold ${getRarityColor(hoverItem.rarity)}`}>{hoverItem.name}</div>
              <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-400 italic">{hoverItem.subtype || hoverItem.type}</span>
                  <span className={`text-[10px] font-bold ${getTierColor(hoverItem.tier)}`}>Tier {hoverItem.tier}</span>
              </div>
              <div className="text-[10px] text-gray-300 my-1">{hoverItem.desc}</div>
              {hoverItem.stats && (
                  <div className="mt-1 pt-2 border-t border-white/10 flex flex-col gap-0.5">
                      {Object.entries(hoverItem.stats).map(([key, val]) => {
                          const statData = getStatLabel(key);
                          return (
                              <div key={key} className="flex justify-between text-[10px]">
                                  <span className={`uppercase font-bold ${statData.color}`}>{statData.name}</span>
                                  <span className="text-white">+{String(val)}</span>
                              </div>
                          );
                      })}
                  </div>
              )}
          </div>
      );
  };

  const MiniMap = () => {
    const grid = [];
    for (let y = coords.y + 1; y >= coords.y - 1; y--) {
        for (let x = coords.x - 1; x <= coords.x + 1; x++) {
            const key = `${x},${y}`;
            const loc = worldMap[key];
            const isPlayer = x === coords.x && y === coords.y;
            grid.push(<div key={key} className={`w-6 h-6 flex items-center justify-center border border-white/5 rounded-sm ${isPlayer ? 'bg-amber-500/20 border-amber-500' : 'bg-black/40'}`}>{loc && <div className={`w-2 h-2 rounded-full ${loc.tier===1?'bg-emerald-500':loc.tier===2?'bg-amber-500':'bg-red-600'} ${isPlayer?'animate-pulse':''}`}></div>}</div>);
        }
    }
    return <div className="grid grid-cols-3 gap-0.5 bg-black/80 p-1 rounded border border-white/10 cursor-pointer hover:border-amber-500" onClick={() => setMapOpen(true)}>{grid}</div>;
  };

  return (
    <div className="h-screen bg-[#050608] text-gray-200 font-sans select-none overflow-hidden flex flex-col cursor-default" onMouseMove={(e) => setMousePos({x:e.clientX, y:e.clientY})}>
        <Tooltip />
        
        {/* HEADER */}
        <header className="h-20 shrink-0 bg-[#0f1115] border-b border-[#2a2f3a] flex items-center px-4 gap-6 shadow-lg z-20">
            <div className="flex items-center gap-3 w-80 shrink-0 cursor-pointer group" onClick={() => setAvatarModalOpen(true)}>
                <div className="relative"><img src={player.avatar} className="w-12 h-12 rounded bg-black border border-amber-500/40 object-cover" /><div className="absolute -bottom-1 -right-1 bg-amber-600 text-black text-[9px] font-bold px-1 rounded">{player.level}</div></div>
                <div className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                        <span className="text-amber-500 font-serif font-bold tracking-wide text-lg leading-none">{player.name}</span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest px-1 border border-white/10 rounded">{player.title}</span>
                    </div>
                    <span className="text-[10px] text-cyan-500 uppercase tracking-widest mt-1">{player.realm} ({getLevelInfo(player.level).layer})</span>
                </div>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-6">
                <VitalBar label="Vitality" val={player.hp} max={player.maxHp} color="bg-gradient-to-r from-red-900 to-red-600" text="text-red-400" />
                <VitalBar label="Qi Essence" val={player.qi} max={player.maxQi} color="bg-gradient-to-r from-cyan-900 to-cyan-500" text="text-cyan-400" />
                <div className="flex flex-col gap-1 relative w-full">
                    <div className="flex justify-between items-end"><span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Cultivation (XP)</span><span className="text-[10px] font-mono text-gray-400">{player.exp}/{getLevelInfo(player.level).req}</span></div>
                    <div className="h-2 bg-[#050608] rounded-full overflow-hidden border border-[#2a2f3a]"><div className="h-full bg-gradient-to-r from-amber-900 to-amber-500 transition-all duration-500" style={{width: `${Math.min(100, (player.exp/getLevelInfo(player.level).req)*100)}%`}}></div></div>
                </div>
            </div>
            <button onClick={hardReset} className="p-2 text-red-500 hover:text-red-300 border border-red-900 rounded"><Trash2 size={16}/></button>
        </header>

        {/* MAIN LAYOUT */}
        <div className="flex-1 flex min-h-0">
            {/* LEFT: STATS */}
            <aside className="w-64 bg-[#0a0c10] border-r border-[#2a2f3a] p-4 flex flex-col gap-4 overflow-y-auto">
                <div>
                   <div className="flex justify-between items-end border-b border-[#2a2f3a] pb-2 mb-2"><h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Base Attributes</h3>{player.ap > 0 && <span className="text-[10px] text-amber-500 font-bold animate-pulse">{player.ap} AP</span>}</div>
                   <div className="flex flex-col gap-3">
                       {statsConfig.map(stat => (
                           <div key={stat.id} className="group">
                               <div className="flex justify-between items-center mb-1"><div className="flex items-center gap-2 text-gray-400 group-hover:text-white transition-colors">{stat.icon}<span className="text-[11px] font-bold uppercase">{stat.label}</span></div><div className="flex items-center gap-2"><span className={`font-mono text-sm font-bold ${stat.color}`}>{totalStats[stat.id]}</span>{player.ap > 0 && (<button onClick={() => allocateStat(stat.id)} className="w-4 h-4 bg-amber-600 hover:bg-amber-500 text-black flex items-center justify-center rounded text-[10px]"><Plus size={10} strokeWidth={3} /></button>)}</div></div>
                               <div className="h-1 w-full bg-[#1a1d24] rounded-full overflow-hidden"><div className={`h-full ${stat.barColor} opacity-50`} style={{width: `${Math.min(totalStats[stat.id] * 2, 100)}%`}}></div></div>
                           </div>
                       ))}
                   </div>
                </div>

                {/* COMBAT STATS (DERIVED) */}
                <div>
                   <div className="flex justify-between items-end border-b border-[#2a2f3a] pb-2 mb-2"><h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Combat Stats</h3></div>
                   <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                       <div className="flex justify-between px-2 py-1 bg-[#151820] rounded border border-white/5"><span className="text-gray-500">P.Atk</span><span className="text-red-300 font-bold">{combatStats.pAtk}</span></div>
                       <div className="flex justify-between px-2 py-1 bg-[#151820] rounded border border-white/5"><span className="text-gray-500">M.Atk</span><span className="text-cyan-300 font-bold">{combatStats.mAtk}</span></div>
                       <div className="flex justify-between px-2 py-1 bg-[#151820] rounded border border-white/5"><span className="text-gray-500">Def</span><span className="text-yellow-300 font-bold">{combatStats.def}</span></div>
                       <div className="flex justify-between px-2 py-1 bg-[#151820] rounded border border-white/5"><span className="text-gray-500">Crit</span><span className="text-emerald-300 font-bold">{combatStats.crit}%</span></div>
                       <div className="flex justify-between px-2 py-1 bg-[#151820] rounded border border-white/5"><span className="text-gray-500">Dodge</span><span className="text-white font-bold">{combatStats.dodge}%</span></div>
                   </div>
                </div>

                {/* DAO PATH (THEORYCRAFT) */}
                <div>
                    <div className="flex justify-between items-end border-b border-[#2a2f3a] pb-2 mb-2"><h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Dao Path</h3></div>
                    <div className="bg-[#151820] p-3 rounded border border-amber-500/20">
                        <div className="text-xs font-serif font-bold text-amber-400 mb-1">{detectedPath.name}</div>
                        <div className="text-[10px] text-gray-400 italic">{detectedPath.desc}</div>
                        <div className="mt-2 flex gap-1">
                            {detectedPath.element === 'Fire' && <Flame size={12} className="text-red-500"/>}
                            {detectedPath.element === 'Ice' && <Zap size={12} className="text-cyan-400"/>}
                            {detectedPath.element === 'Wood' && <Leaf size={12} className="text-emerald-400"/>}
                        </div>
                    </div>
                </div>

                {/* SKILLS */}
                <div>
                    <div className="flex justify-between items-end border-b border-[#2a2f3a] pb-2 mb-2"><h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Skills</h3><button onClick={() => setSkillModalOpen(true)} className="text-[10px] text-amber-500 hover:underline">Manage</button></div>
                    <div className="grid grid-cols-3 gap-2">
                        {player.skills.map((sid, idx) => {
                            const skill = allSkills.find(s => s.id === sid);
                            return (
                                <div key={idx} onClick={() => setSkillModalOpen(true)} className="aspect-square bg-[#151820] border border-white/10 rounded flex items-center justify-center hover:border-amber-500 cursor-pointer text-gray-500 group relative">
                                    {skill ? skill.icon : <Plus size={12}/>}
                                    {skill && <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black px-2 py-1 text-[9px] rounded border border-white/20 whitespace-nowrap opacity-0 group-hover:opacity-100 z-50 pointer-events-none">{skill.name}</div>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </aside>

            {/* CENTER: WORLD */}
            <main className="flex-1 flex flex-col min-w-0 bg-black relative h-full">
                <div className="h-[60%] relative bg-[#151820] overflow-hidden group shrink-0">
                    <div className="absolute inset-0 bg-cover bg-center transition-all duration-700 opacity-60" style={{backgroundImage: `url('${getCurrentLocation().img}')`}}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                    <div className="absolute top-4 left-4 z-10">
                        <div className="flex items-center gap-2 mb-1"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase flex items-center gap-1 ${getCurrentLocation().tier===1 ? 'bg-emerald-900/80 border-emerald-500/50 text-emerald-400' : getCurrentLocation().tier===2 ? 'bg-amber-900/80 border-amber-500/50 text-amber-400' : 'bg-red-900/80 border-red-500/50 text-red-400'}`}>{getCurrentLocation().tier === 1 ? <Shield size={8}/> : <Skull size={8}/>} Tier {getCurrentLocation().tier}</span><div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded border border-white/10"><span className="text-[9px] text-gray-400 font-bold uppercase mr-1">Quality</span><QualityStars quality={getCurrentLocation().quality} /></div></div>
                        <h2 className="text-3xl font-serif font-bold text-white drop-shadow-md">{getCurrentLocation().name}</h2>
                        <div className="text-sm text-gray-300 font-serif italic max-w-md drop-shadow-md mt-1">{getCurrentLocation().desc}</div>
                    </div>
                    
                    {/* MINI MAP & MAP BUTTON */}
                    <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
                        <div className="bg-black/80 p-1 rounded border border-white/10 mb-2">
                            <MiniMap />
                        </div>
                        <button onClick={() => setMapOpen(true)} className="bg-amber-600/20 hover:bg-amber-600 border border-amber-500/50 text-amber-500 hover:text-white px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2"><MapIcon size={12}/> Map [M]</button>
                    </div>

                    {/* HUNT BTN */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                        {['w', 'n', 's', 'e'].map(dir => (<button key={dir} onClick={() => movePlayer(dir)} disabled={!getCurrentLocation().exits.includes(dir)} className={`w-10 h-10 flex items-center justify-center rounded border transition-all ${getCurrentLocation().exits.includes(dir) ? 'bg-black/60 border-white/20 hover:border-amber-500 text-gray-200 hover:text-amber-500' : 'bg-black/20 border-transparent text-gray-700 cursor-not-allowed'}`}>{dir === 'n' ? <ArrowUp size={16}/> : dir === 's' ? <ArrowDown size={16}/> : dir === 'w' ? <ArrowLeft size={16}/> : <ArrowRight size={16}/>}</button>))}
                    </div>
                    {bestiaryMap[`${coords.x},${coords.y}`] && (<div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20"><button onClick={startCombat} className="bg-red-900/80 hover:bg-red-700 border border-red-500 text-white px-8 py-2 rounded-full font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 animate-pulse hover:animate-none hover:scale-105 transition-all"><Sword size={16}/> Hunt Monsters</button></div>)}
                </div>
                <div className="h-[40%] flex flex-col bg-[#050608] border-t border-[#2a2f3a] min-h-0">
                    <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1 custom-scrollbar">
                         {gameLog.map((log, i) => (<div key={i} className={`${log.type==='cmd'?'text-gray-500 font-bold':log.type==='danger'?'text-red-500 font-bold':log.type==='warning'?'text-amber-500':log.type==='success'?'text-emerald-400':log.type==='system'?'text-cyan-500':'text-gray-300'}`}>{log.type==='cmd' ? '' : ''}{log.text}</div>))}
                         <div ref={logEndRef} />
                    </div>
                </div>
            </main>

            {/* RIGHT: GEAR & INV */}
            <aside className="w-64 bg-[#0a0c10] border-l border-[#2a2f3a] flex flex-col overflow-y-auto">
                <div className="p-3 bg-[#0f1115] border-b border-[#2a2f3a] text-xs font-bold uppercase text-gray-400 flex items-center gap-2"><Coins size={14} className="text-amber-500"/> Wealth</div>
                <div className="p-3 grid grid-cols-2 gap-2 text-[10px] text-gray-300 border-b border-[#2a2f3a]">
                    <div className="flex items-center gap-2 bg-[#151820] p-2 rounded border border-white/5"><Gem size={12} className="text-cyan-400"/> <span>{player.spiritStones} SS</span></div>
                    <div className="flex items-center gap-2 bg-[#151820] p-2 rounded border border-white/5"><Scroll size={12} className="text-purple-400"/> <span>{player.contribution} Pts</span></div>
                </div>

                <div className="p-3 bg-[#0f1115] border-b border-[#2a2f3a] text-xs font-bold uppercase text-gray-400 flex items-center gap-2"><Hammer size={14} className="text-amber-500"/> Equipped Gear</div>
                <div className="p-3 border-b border-[#2a2f3a] space-y-2">
                     <GearSlot label="Weapon" itemId={player.gear.weapon} type="weapon"/>
                     <GearSlot label="Armor" itemId={player.gear.armor} type="armor"/>
                     <GearSlot label="Ring" itemId={player.gear.ring} type="ring"/>
                     <GearSlot label="Amulet" itemId={player.gear.amulet} type="amulet"/>
                     <GearSlot label="Artifact" itemId={player.gear.artifact} type="artifact"/>
                </div>

                <div className="flex border-b border-[#2a2f3a] bg-[#0f1115]">
                    {[0, 1, 2].map(tab => (
                        <button key={tab} onClick={() => setInventoryTab(tab)} className={`flex-1 py-1 text-[10px] font-bold uppercase ${inventoryTab === tab ? 'text-amber-500 bg-[#151820] border-t-2 border-amber-500' : 'text-gray-500 hover:text-gray-300'}`}>Tab {['I', 'II', 'III'][tab]}</button>
                    ))}
                </div>

                <div className="p-2 grid grid-cols-4 gap-2 content-start flex-1">
                    {player.inventory.slice(inventoryTab * 16, (inventoryTab + 1) * 16).map(item => {
                        const dbItem = item.type === 'gear' ? getItemById(item.itemId) : null;
                        const displayItem = dbItem ? { ...dbItem, ...item } : item;
                        
                        return (
                            <div 
                                key={item.id} 
                                onClick={() => item.type === 'gear' && equipItem(item)} 
                                className={`relative group aspect-square bg-[#151820] border border-[#2a2f3a] rounded hover:border-amber-500 cursor-pointer flex items-center justify-center ${item.type==='gear' ? 'border-purple-500/30' : ''}`}
                                onMouseEnter={(e) => { if(item.type==='gear') { setHoverItem(displayItem); setMousePos({x:e.clientX, y:e.clientY}); } }}
                                onMouseLeave={() => setHoverItem(null)}
                            >
                                {getIcon(item.iconType)}
                                <span className="absolute bottom-0.5 right-1 text-[8px] font-bold text-gray-500">{item.count}</span>
                            </div>
                        );
                    })}
                    {[...Array(Math.max(0, 16 - player.inventory.slice(inventoryTab * 16, (inventoryTab + 1) * 16).length))].map((_, i) => (
                        <div key={`e-${i}`} className="aspect-square bg-[#0f1115] rounded border border-transparent"></div>
                    ))}
                </div>
            </aside>
        </div>

        {/* --- MODALS --- */}
        
        {isMapOpen && <VisualWorldMap coords={coords} setCoords={setCoords} player={player} setMapOpen={setMapOpen} onTravel={travelFast} />}

        {isSkillModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setSkillModalOpen(false)}>
                <div className="bg-[#1e293b] p-6 rounded-xl border border-amber-500/30 w-[400px]" onClick={e => e.stopPropagation()}>
                    <h2 className="text-center text-amber-500 font-serif font-bold mb-4 uppercase flex items-center justify-center gap-2"><BookOpen size={16}/> Martial Arts</h2>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {player.skills.map((sid, idx) => {
                             const skill = allSkills.find(s => s.id === sid);
                             return (
                                 <div key={idx} className="aspect-square bg-[#0f1115] border border-amber-500 rounded flex flex-col items-center justify-center gap-1 relative">
                                     <span className="absolute top-1 left-2 text-[8px] text-gray-500 font-bold">SLOT {idx+1}</span>
                                     {skill ? skill.icon : <div className="w-4 h-4 rounded-full bg-gray-800"/>}
                                     <span className="text-[10px] text-gray-300 font-bold">{skill ? skill.name : "Empty"}</span>
                                 </div>
                             );
                        })}
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold mb-2">Learned Skills (Click to Equip)</div>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {player.learnedSkills.map(sid => {
                            const skill = allSkills.find(s => s.id === sid);
                            return (
                                <div key={sid} className="flex items-center justify-between p-2 bg-[#0f1115] rounded border border-white/5 hover:border-amber-500 group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1 bg-black rounded border border-white/10">{skill.icon}</div>
                                        <div>
                                            <div className="text-xs font-bold text-gray-200">{skill.name}</div>
                                            <div className="text-[9px] text-cyan-400">{skill.cost} Qi</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {[0,1,2].map(slot => (
                                            <button key={slot} onClick={() => equipSkill(sid, slot)} className="w-5 h-5 bg-amber-900 text-amber-200 text-[9px] rounded font-bold border border-amber-500 hover:bg-amber-600 flex items-center justify-center">{slot+1}</button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        )}

        {combat && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
                <div className="w-[800px] h-[550px] bg-[#1a1d24] border-2 border-red-900/50 rounded-xl overflow-hidden flex flex-col shadow-2xl relative">
                    <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{backgroundImage: `url('https://www.transparenttextures.com/patterns/dark-matter.png')`}}></div>
                    <div className="relative z-10 bg-black/60 p-4 flex justify-between items-center border-b border-white/10">
                        <div className="text-red-500 font-bold uppercase tracking-widest flex items-center gap-2"><Sword size={18}/> Combat Mode</div>
                    </div>
                    
                    <div className="flex-1 flex relative z-10">
                        <div className="flex-1 p-6 flex flex-col items-center justify-start border-r border-white/5 bg-gradient-to-r from-blue-900/10 to-transparent pt-12">
                            <div className="w-44 h-44 flex items-center justify-center mb-4 flex-shrink-0">
                                <img src={player.avatar} className="w-full h-full rounded-lg border-4 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.3)] object-cover" />
                            </div>
                            <div className="text-center mb-3">
                                <div className="text-lg font-bold text-blue-200">{player.name}</div>
                                <div className="text-xs text-blue-400 font-semibold">Level {player.level} • {player.title}</div>
                            </div>
                            <div className="w-full max-w-[200px] space-y-3">
                                <div>
                                    <div className="flex justify-between text-xs mb-1 text-red-300"><span>HP</span><span>{combat.playerHp}/{player.maxHp}</span></div>
                                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-600"><div className="h-full bg-red-600 transition-all duration-300" style={{width: `${(combat.playerHp/player.maxHp)*100}%`}}></div></div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1 text-blue-300"><span>QI</span><span>{Math.ceil(combat.playerQi)}/{combat.maxPlayerQi}</span></div>
                                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-600"><div className="h-full bg-blue-600 transition-all duration-300" style={{width: `${Math.max(0, Math.min(100, (combat.playerQi/combat.maxPlayerQi)*100))}%`}}></div></div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="w-64 bg-black/40 flex flex-col border-r border-white/5"><div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2">{combatLog.map((log, i) => (<div key={i} className={`${log.type==='danger'?'text-red-400':log.type==='success'?'text-green-400':log.type==='gold'?'text-amber-400 font-bold':'text-gray-400'}`}>{log.text}</div>))}<div ref={combatLogRef} /></div></div>
                        
                        <div className="flex-1 p-6 flex flex-col items-center justify-start bg-gradient-to-l from-red-900/10 to-transparent pt-12">
                            <div className="relative w-44 h-44 flex items-center justify-center mb-4 flex-shrink-0">
                                <img src={combat.mob.img} className="w-full h-full rounded-lg border-4 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)] object-cover animate-pulse bg-black" onError={(e) => {e.target.src="https://via.placeholder.com/150?text=Monster"}}/>
                                <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">Lvl {combat.mob.level}</div>
                            </div>
                            <div className="text-lg font-bold text-red-200 mb-2">{combat.mob.name}</div>
                            <div className="w-full max-w-[200px] space-y-3">
                                <div>
                                    <div className="flex justify-between text-xs mb-1 text-red-300"><span>Enemy HP</span><span>{combat.mobHp}/{combat.mob.hp}</span></div>
                                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-600"><div className="h-full bg-red-600 transition-all duration-300" style={{width: `${(combat.mobHp/combat.mob.hp)*100}%`}}></div></div>
                                </div>
                                <div className="opacity-0 pointer-events-none">
                                    <div className="flex justify-between text-xs mb-1 text-blue-300"><span>QI</span><span>0/0</span></div>
                                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-600"><div className="h-full bg-blue-600 transition-all duration-300" style={{width: `0%`}}></div></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-20 bg-black/90 border-t border-white/10 flex items-center justify-center gap-4 relative z-20">
                        {player.skills.map((sid, idx) => {
                             const skill = allSkills.find(s => s.id === sid);
                             return (
                                <button 
                                    key={idx} 
                                    onClick={() => skill && useSkill(skill.id)}
                                    disabled={!skill || player.qi < skill.cost}
                                    className={`w-12 h-12 bg-[#1a1d24] border-2 rounded flex items-center justify-center relative group transition-all ${!skill ? 'border-white/10 opacity-50 cursor-default' : player.qi < skill.cost ? 'border-red-900 opacity-50 cursor-not-allowed' : 'border-gray-500 hover:border-amber-400 hover:scale-105 active:scale-95'}`}
                                >
                                    {skill ? skill.icon : null}
                                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-black rounded-full text-[9px] flex items-center justify-center border border-gray-700 text-gray-400">{idx+1}</span>
                                    {skill && <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black px-2 py-1 text-[9px] rounded border border-white/20 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none">
                                        <div className="font-bold text-amber-500">{skill.name}</div>
                                        <div className="text-cyan-400">{skill.cost} Qi</div>
                                    </div>}
                                </button>
                             );
                        })}
                        <div className="w-[1px] h-10 bg-white/10 mx-2"></div>
                        <button onClick={attemptFlee} className="w-12 h-12 bg-red-900/20 border-2 border-red-900/50 rounded flex items-center justify-center hover:bg-red-900/50 hover:border-red-500 transition-all group relative">
                            <Footprints size={20} className="text-red-400"/>
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black px-2 py-1 text-[9px] rounded border border-white/20 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none text-red-400 font-bold">Flee</div>
                        </button>
                    </div>
                </div>
            </div>
        )}
        
        {isAvatarModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setAvatarModalOpen(false)}>
                <div className="bg-[#1e293b] p-6 rounded-xl border border-amber-500/30" onClick={e => e.stopPropagation()}>
                    <h2 className="text-center text-amber-500 font-serif font-bold mb-4 uppercase">Select Appearance</h2>
                    <div className="grid grid-cols-3 gap-4">{avatarList.map((url, i) => (<img key={i} src={url} className="w-20 h-20 rounded bg-black object-cover cursor-pointer border-2 border-transparent hover:border-amber-500" onClick={() => { setPlayer(p => ({...p, avatar: url})); setAvatarModalOpen(false); }} onError={(e) => {e.target.style.display='none'}}/>))}</div>
                </div>
            </div>
        )}
    </div>
  );
};

export default App;