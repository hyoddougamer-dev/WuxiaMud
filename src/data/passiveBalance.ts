/**
 * PASSIVE ABILITY BALANCE REFERENCE
 * 
 * Complete mechanics specification for all 12 hybrid classes.
 * Used for playtesting validation and balance adjustments.
 * 
 * Key Metrics:
 * - Cooldown: Time between passive triggers (lower = more frequent)
 * - Proc Chance: % chance ability triggers on specific condition
 * - Damage/Defense Bonus: % increase to offensive/defensive stats
 * - Duration: How long buffs/effects last in seconds
 * - Max Stacks: Maximum accumulation of status effects
 */

export const passiveBalanceTable = {
  // ========================================
  // CLASS 1: BLAZING SWORD (Fire Element)
  // Archetype: Aggressive Damage Dealer
  // ========================================
  class_1_inferno_aura: {
    name: "Inferno Aura",
    element: "Fire",
    category: "Passive Damage Aura",
    cooldown: 2,
    effectType: "burning",
    effectDuration: 4,
    effectMaxStacks: 5,
    procChance: 40, // 40% chance to trigger burning on enemy
    damagePerSecond: 2, // per stack
    maxDamageBonus: 8, // 8% of max HP per trigger
    description: "Every 2 seconds, deal damage aura around self (8% max HP) and potentially burn the enemy.",
    balanceNotes: "Strong consistent damage, scaling well vs multiple enemies. Burning stacks for DoT.",
  },

  // ========================================
  // CLASS 2: GLACIAL SHADOW (Ice Element)
  // Archetype: Control/CC Specialist
  // ========================================
  class_2_frostbite_chain: {
    name: "Frostbite Chain",
    element: "Ice",
    category: "Conditional CC",
    cooldown: 3,
    triggerCondition: "Critical Hit (15% chance)",
    effectType: "frozen",
    effectDuration: 2.5,
    effectMaxStacks: 3,
    freezeDefenseReduction: -30, // Enemy takes 30% more damage when frozen
    freezeMovementSlow: 50, // Enemy movement reduced 50% when frozen
    description: "On critical hit (15% crit rate), freeze enemy for 2.5 seconds and reduce their damage output.",
    balanceNotes: "Conditional trigger makes it balanced. Freeze duration is SHORT to prevent stalling.",
  },

  // ========================================
  // CLASS 3: SPELLFIRE DUELIST (Fire Element)
  // Archetype: Magic Damage Amplifier
  // ========================================
  class_3_spell_echo: {
    name: "Spell Echo",
    element: "Fire",
    category: "Damage Multiplier",
    cooldown: 4,
    triggerCondition: "Passive Ready",
    effectMultiplier: 2.0, // Double spell damage
    spellDamageBonus: 100, // % increase (100% = double damage)
    description: "Every 4 seconds, next spell deals double damage (100% bonus).",
    balanceNotes: "Longer cooldown balances strong multiplier. Spell-focused class.",
  },

  // ========================================
  // CLASS 4: TOXIC VIPER (Void Element)
  // Archetype: DoT Burst Specialist
  // ========================================
  class_4_poison_cloud: {
    name: "Poison Cloud",
    element: "Void",
    category: "Stack-based DoT",
    stacksPerHit: 1,
    maxStacks: 5,
    burstCooldown: 2.5,
    effectType: "corrupted",
    effectDuration: 5,
    effectMaxStacks: 4,
    damagePerStack: 1, // per second per stack
    description: "Gain 1 poison stack per hit. At 5 stacks, burst and apply corrupted effect (5 stacks, 5s duration, 1 DoT/s per stack).",
    balanceNotes: "Requires setup (5 hits) before burst. High sustained damage if kept active.",
  },

  // ========================================
  // CLASS 5: ASURA OF WAR (Fire Element)
  // Archetype: Offensive Buff Provider
  // ========================================
  class_5_asura_rage: {
    name: "Asura Rage",
    element: "Fire",
    category: "Self Damage Buff",
    cooldown: 2.5,
    triggerCondition: "Passive Ready",
    damageBonus: 20, // +20% damage
    buffDuration: 3,
    stacksPerTrigger: 1,
    description: "Every 2.5 seconds, gain +20% damage buff for 3 seconds.",
    balanceNotes: "Straightforward damage buff. Good for sustained consistent DPS.",
  },

  // ========================================
  // CLASS 6: FROZEN STEEL GUARD (Ice Element)
  // Archetype: Defensive Tank
  // ========================================
  class_6_glacial_barrier: {
    name: "Glacial Barrier",
    element: "Ice",
    category: "Self Defense Buff",
    cooldown: 3,
    triggerCondition: "Passive Ready",
    defenseBonus: 30, // +30% defense
    buffDuration: 2.5,
    effectResistanceBonus: 10, // +10% effect resistance while active
    description: "Every 3 seconds, gain +30% defense buff for 2.5 seconds. Also grants +10% effect resistance.",
    balanceNotes: "Tank class, longer cooldown but stronger defense. No outgoing damage boost.",
  },

  // ========================================
  // CLASS 7: VERDANT BLADE MONARCH (Wood Element)
  // Archetype: Healing/Support
  // ========================================
  class_7_natures_blessing: {
    name: "Nature's Blessing",
    element: "Wood",
    category: "Conditional Heal",
    stacksPerHit: 1,
    triggerStacks: 3,
    cooldown: 2,
    healBonus: 12, // 12% of max HP per trigger
    effectType: "entangled",
    entangleProcChance: 30, // 30% chance to entangle enemy on heal
    entangleDuration: 3,
    entangleSlow: -25, // Enemy speed reduced 25%
    description: "Gain 1 heal stack per hit. At 3 stacks, heal for 12% max HP and potentially entangle enemy.",
    balanceNotes: "Heal class with support CC. Lower damage but sustain-focused.",
  },

  // ========================================
  // CLASS 8: WILDERNESS STALKER (Wood Element)
  // Archetype: Speed/Mobility Specialist
  // ========================================
  class_8_beast_hunt: {
    name: "Beast Hunt",
    element: "Wood",
    category: "Speed Buff",
    cooldown: 3,
    triggerCondition: "Passive Ready",
    speedBonus: 25, // +25% attack speed
    buffDuration: 3,
    description: "Every 3 seconds, gain +25% attack speed buff for 3 seconds.",
    balanceNotes: "Speed class, more attacks = more procs. Offensive mobility focus.",
  },

  // ========================================
  // CLASS 9: PHOENIX CRY CULTIVATOR (Fire Element)
  // Archetype: Comeback/Threshold Specialist
  // ========================================
  class_9_phoenix_rebirth: {
    name: "Phoenix Rebirth",
    element: "Fire",
    category: "Conditional Damage Buff",
    triggerCondition: "HP < 30%",
    cooldown: 3,
    damageBonus: 35, // +35% damage when low health
    buffDuration: 4,
    description: "When HP drops below 30%, gain +35% damage buff for 4 seconds. Cooldown: 3s.",
    balanceNotes: "Risk/reward class. Strong comeback potential at low health.",
  },

  // ========================================
  // CLASS 10: DIVINE MELODY HEALER (Lightning Element)
  // Archetype: Healer with CC
  // ========================================
  class_10_divine_grace: {
    name: "Divine Grace",
    element: "Lightning",
    category: "Healing Stack",
    stacksPerHeal: 1,
    triggerStacks: 2,
    cooldown: 2.5,
    healingBonus: 25, // +25% bonus healing
    effectType: "stunned",
    stunProcChance: 25, // 25% chance to stun on heal
    stunDuration: 1.5,
    stunDamageReduction: -50, // Stunned enemy does 50% less damage
    description: "Gain 1 healing stack per heal action. At 2 stacks, gain +25% healing bonus and potentially stun enemy.",
    balanceNotes: "Healer class with offensive CC. Low damage but high support value.",
  },

  // ========================================
  // CLASS 11: PHANTOM MUSICIAN (Void Element)
  // Archetype: Evasion/Speed Specialist
  // ========================================
  class_11_shadow_step: {
    name: "Shadow Step",
    element: "Void",
    category: "Mobility with CC",
    cooldown: 2,
    triggerCondition: "Passive Ready",
    speedBonus: 20, // +20% speed
    buffDuration: 2.5,
    effectType: "entangled",
    entangleProcChance: 35, // 35% chance to entangle on attack
    entangleDuration: 3,
    entangleSlow: -25, // Enemy speed reduced 25%
    description: "Every 2 seconds, gain +20% speed buff for 2.5s and potentially entangle enemy.",
    balanceNotes: "Speed/mobility class with offensive CC. Fast but lower damage.",
  },

  // ========================================
  // CLASS 12: UNBREAKABLE SPIRIT SAGE (Lightning Element)
  // Archetype: Scaling Defense Tank
  // ========================================
  class_12_spirit_fortitude: {
    name: "Spirit Fortitude",
    element: "Lightning",
    category: "Stacking Defense",
    stacksPerSecond: 2,
    maxStacks: 20,
    defensePerStack: 3, // 3% defense per stack (max 60% at 20 stacks)
    maxDefenseBonus: 60,
    description: "Gain 2 defense stacks per second. Each stack grants +3% defense (max 20 stacks = +60% defense).",
    balanceNotes: "Scaling tank. Stronger over time in long fights. Resets if taking damage.",
  },
};

/**
 * EFFECT BALANCE TABLE
 * Properties of status effects that can be applied by passives
 */
export const effectBalanceTable = {
  burning: {
    name: "Burning",
    type: "Damage Over Time",
    duration: 4,
    maxStacks: 5,
    damagePerStack: 2, // per second
    maxDamage: 10, // 2 * 5 stacks
    procChance: 40,
    description: "Takes 2 damage per second per stack. Stacks up to 5 times.",
  },

  frozen: {
    name: "Frozen",
    type: "Control",
    duration: 2.5,
    maxStacks: 3,
    damageReductionPerStack: 10, // 10% per stack
    maxDamageReduction: 30,
    movementSlow: 50, // 50% slower
    procChance: 35,
    description: "Enemy movement slowed 50%. Takes 10% more damage per stack (max 30%).",
  },

  entangled: {
    name: "Entangled",
    type: "Movement Slow",
    duration: 3,
    maxStacks: 2,
    movementSlowPerStack: 12.5, // 12.5% per stack (max 25%)
    maxMovementSlow: 25,
    procChance: 30,
    description: "Enemy movement speed reduced. Stacks to -25% max.",
  },

  stunned: {
    name: "Stunned",
    type: "Hard CC",
    duration: 1.5,
    maxStacks: 1,
    cannotAct: true,
    damageReduction: 50, // Cannot attack, 50% damage reduction
    procChance: 25,
    description: "Cannot attack. Takes 50% reduced damage from physical attacks.",
  },

  corrupted: {
    name: "Corrupted",
    type: "Damage Over Time",
    duration: 5,
    maxStacks: 4,
    damagePerStack: 1, // per second (lower than burning)
    maxDamage: 4,
    procChance: 30,
    description: "Takes 1 damage per second per stack. Lasts longer than Burning (5s vs 4s).",
  },
};

/**
 * COMBAT PACING REFERENCE
 * Combat duration guide for playtesting
 */
export const combatPacingGuide = {
  tickRate: 1.5, // Combat tick every 1.5 seconds
  passiveCooldowns: {
    fast: "2-2.5s", // Classes 1, 4, 11, 10
    medium: "3s", // Classes 5, 6, 7, 8, 9, 12
    slow: "4s", // Class 3
  },
  expectedCombatDuration: "15-30 seconds for level-appropriate mobs",
  balanceGoal: "Passives trigger 4-10 times per combat, creating dynamic gameplay.",
};

/**
 * PLAYTESTING CHECKLIST
 */
export const playtestingChecklist = [
  "Class 1 (Inferno Aura): Verify 8% damage aura and 40% burn proc feel balanced vs other damage dealers",
  "Class 2 (Frostbite Chain): Confirm frozen duration (2.5s) doesn't feel too long, crit trigger feels fair",
  "Class 3 (Spell Echo): Test if 4s cooldown with 2x damage feels rewarding enough",
  "Class 4 (Poison Cloud): Verify 5-hit setup before burst feels fair, DoT damage is satisfying",
  "Class 5 (Asura Rage): Confirm +20% damage buff for 3s feels balanced vs other offensive classes",
  "Class 6 (Glacial Barrier): Test if +30% defense for 2.5s feels strong enough for tank playstyle",
  "Class 7 (Nature's Blessing): Verify heal (12% max HP every 3 hits) + 30% entangle proc is balanced",
  "Class 8 (Beast Hunt): Confirm +25% speed buff feels impactful for attack frequency",
  "Class 9 (Phoenix Rebirth): Test if +35% damage at <30% HP feels like good comeback mechanic",
  "Class 10 (Divine Grace): Verify healing bonus (+25%) + 25% stun proc is useful for support role",
  "Class 11 (Shadow Step): Confirm +20% speed + 35% entangle proc feels balanced for speed class",
  "Class 12 (Spirit Fortitude): Test if +3% defense per stack (capping at +60%) scaling feels smooth",
  "Effect Durations: Verify status effects expire at right time, don't feel too oppressive",
  "Effect Stacking: Confirm visual clarity when multiple effects are active",
  "Resistance System: Test that level-based effect resistance works correctly",
];

/**
 * BALANCE ADJUSTMENTS REFERENCE
 * Suggested tweaks if playtesting reveals issues
 */
export const balanceAdjustmentGuide = {
  tooWeak: {
    solutions: [
      "Increase cooldown (more frequent triggers)",
      "Increase damage/defense/healing bonus %",
      "Increase proc chance for status effects",
      "Increase stack count or stack limit",
      "Reduce effect cooldown",
    ],
  },
  tooStrong: {
    solutions: [
      "Increase cooldown (less frequent triggers)",
      "Decrease damage/defense/healing bonus %",
      "Decrease proc chance for status effects",
      "Reduce effect duration",
      "Add cooldown to effect stacking",
    ],
  },
  pacing: {
    note: "If combat feels too long, increase cooldowns. If too fast, decrease cooldowns.",
    hint: "Target 20-25 second combat with 5-8 passive triggers.",
  },
};
