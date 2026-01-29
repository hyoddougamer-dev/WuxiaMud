import { levelingTable, itemDatabase, mobDefinitions, mobImages } from '../data/constants';
import { type ItemRarity, RARITY_CONFIG, convertLegacyRarity } from '../data/raritySystem';

// Get rarity color class (supports both old and new rarity names)
export const getRarityColor = (rarity: string): string => {
    // Convert legacy rarity names to new Wuxia system
    const wuxiaRarity = convertLegacyRarity(rarity as any);
    return RARITY_CONFIG[wuxiaRarity].textClass;
};

// Get rarity color HEX value
export const getRarityHexColor = (rarity: string): string => {
    const wuxiaRarity = convertLegacyRarity(rarity as any);
    return RARITY_CONFIG[wuxiaRarity].color;
};

// Get rarity border color
export const getRarityBorderColor = (rarity: string): string => {
    const wuxiaRarity = convertLegacyRarity(rarity as any);
    return RARITY_CONFIG[wuxiaRarity].borderColor;
};

// Get rarity glow color
export const getRarityGlowColor = (rarity: string): string => {
    const wuxiaRarity = convertLegacyRarity(rarity as any);
    return RARITY_CONFIG[wuxiaRarity].glowColor;
};

// Get full rarity config
export const getRarityDisplayConfig = (rarity: string) => {
    const wuxiaRarity = convertLegacyRarity(rarity as any);
    return RARITY_CONFIG[wuxiaRarity];
};

// Get rarity display name (Wuxia themed)
export const getRarityDisplayName = (rarity: string): string => {
    const wuxiaRarity = convertLegacyRarity(rarity as any);
    return RARITY_CONFIG[wuxiaRarity].displayName;
};

export const getTierColor = (tier: number): string => {
    if (tier >= 3) return 'text-red-400';
    if (tier === 2) return 'text-amber-400';
    return 'text-emerald-400';
};

export const getStatLabel = (key: string) => {
    const map: Record<string, { name: string; abbr: string; color: string }> = {
        dex: { name: "Wind Walk", abbr: "WND", color: "text-emerald-400" },
        str: { name: "Ox Power", abbr: "OXP", color: "text-red-400" },
        con: { name: "Golden Body", abbr: "GLD", color: "text-yellow-400" },
        spi: { name: "Dao Mind", abbr: "DAO", color: "text-cyan-400" },
        wil: { name: "Heart Demon", abbr: "HRT", color: "text-purple-400" }
    };
    return map[key] || { name: key, abbr: key.toUpperCase(), color: "text-white" };
};

// Get stat abbreviation for compact display
export const getStatAbbr = (key: string): string => {
    const abbrMap: Record<string, string> = {
        str: 'OXP',
        dex: 'WND',
        con: 'GLD',
        spi: 'DAO',
        wil: 'HRT'
    };
    return abbrMap[key] || key.toUpperCase();
};

export const getMobById = (id: number) => {
    const def = mobDefinitions.find((m: any) => m.id === id);
    if (!def) return mobDefinitions[0];
    const imgUrl = (mobImages as any)[def.name] || (mobImages as any)["Training Dummy"];
    return { ...def, img: imgUrl };
};

export const getLevelInfo = (lvl: number) => {
    return levelingTable.find(l => l.lvl === lvl) || levelingTable[levelingTable.length - 1];
};

export const calculateTotalAP = (lvl: number): number => {
    let totalAP = 4;
    for (let i = 2; i <= lvl; i++) {
        const levelInfo = getLevelInfo(i);
        if (levelInfo) totalAP += levelInfo.apPerLevel;
    }
    return totalAP;
};

export const calculateResetCost = (lvl: number, totalStatsAllocated: number): number => {
    if (lvl <= 9) return 0;
    return Math.max(0, (lvl * 10) + (totalStatsAllocated * 5));
};

export const getItemById = (id: string) => {
    return itemDatabase.find(i => i.id === id);
};
