// ============================================
// QUEST DATABASE - WuxiaMUD
// Main Story, Side Quests, Dailies, Bounties
// ALL TEXT IN ENGLISH
// ============================================

import { Quest, NPC, Faction } from './questSystem';

// ============================================
// FACTIONS
// ============================================

export const factions: Record<string, Faction> = {
    azure_cloud: {
        id: 'azure_cloud',
        name: 'Azure Cloud Sect',
        description: 'Your home sect. The path of righteous cultivation.',
        tiers: [
            { name: 'Outer Disciple', required: 0, benefits: ['Access to sect facilities'] },
            { name: 'Inner Disciple', required: 500, benefits: ['10% shop discount', 'Better daily quests'] },
            { name: 'Core Disciple', required: 2000, benefits: ['20% shop discount', 'Elder training access'] },
            { name: 'Elder Candidate', required: 5000, benefits: ['30% shop discount', 'Secret techniques'] },
            { name: 'Sect Elder', required: 10000, benefits: ['50% shop discount', 'Peak access'] }
        ]
    },
    iron_claw: {
        id: 'iron_claw',
        name: 'Iron Claw Bandits',
        description: 'Ruthless outlaws who prey on travelers. Defeating them earns gratitude.',
        tiers: [
            { name: 'Unknown', required: 0, benefits: [] },
            { name: 'Bandit Hunter', required: 200, benefits: ['Bandits drop +10% gold'] },
            { name: 'Scourge of Thieves', required: 1000, benefits: ['Bandits drop +25% gold'] },
            { name: 'Iron Claw Nemesis', required: 3000, benefits: ['Bandits drop +50% gold', 'Rare bandit drops'] }
        ]
    },
    beast_tamers: {
        id: 'beast_tamers',
        name: 'Beast Tamer Guild',
        description: 'Masters of spirit beasts. They value those who understand nature.',
        tiers: [
            { name: 'Stranger', required: 0, benefits: [] },
            { name: 'Beast Friend', required: 300, benefits: ['Beast drops +15%'] },
            { name: 'Spirit Caller', required: 1500, benefits: ['Beast drops +30%', 'Taming skills available'] },
            { name: 'Beast Master', required: 5000, benefits: ['Beast drops +50%', 'Legendary beast access'] }
        ]
    },
    tomb_keepers: {
        id: 'tomb_keepers',
        name: 'Tomb Keepers',
        description: 'Ancient guardians of forbidden knowledge. Neutral but powerful.',
        tiers: [
            { name: 'Intruder', required: -1000, benefits: ['Tomb enemies +50% damage'] },
            { name: 'Unknown', required: 0, benefits: [] },
            { name: 'Seeker', required: 500, benefits: ['Tomb puzzles revealed'] },
            { name: 'Keeper Initiate', required: 2000, benefits: ['Secret tomb passages'] },
            { name: 'Tomb Keeper', required: 5000, benefits: ['Undead Emperor audience'] }
        ]
    }
};

// ============================================
// NPCs - ALL ENGLISH
// ============================================

export const npcs: Record<string, NPC> = {
    // === AZURE CLOUD SECT ===
    elder_xuanming: {
        id: 'elder_xuanming',
        name: 'Elder Xuanming',
        title: 'Sect Master',
        role: ['quest_giver', 'elder'],
        zone: '0,0',
        avatar: '👴',
        portrait: '👴',
        description: 'The venerable Sect Master of Azure Cloud. Three centuries of wisdom, and counting.',
        dialogue: {
            greeting: [
                "Welcome, young disciple. The Azure Cloud Sect has awaited your arrival.",
                "I sense potential within you. Whether it blooms or withers... that depends on you.",
                "Three hundred years I've walked this path. Perhaps you'll walk it with us."
            ],
            idle: [
                "*gazes at the distant peaks, lost in ancient memories*",
                "*strokes his beard contemplatively*",
                "The Dao flows through all things... even impatient disciples."
            ],
            farewell: [
                "Go forth, and may the Azure Cloud guide your path.",
                "Return when you've grown stronger. The sect believes in you.",
                "May the heavens favor your cultivation."
            ]
        },
        quests: ['main_001', 'main_004', 'main_005', 'trial_breakthrough_foundation', 'trial_breakthrough_golden'],
        faction: 'azure_cloud'
    },
    
    elder_qingfeng: {
        id: 'elder_qingfeng',
        name: 'Elder Qingfeng',
        title: 'Martial Hall Master',
        role: ['quest_giver', 'trainer', 'elder'],
        zone: '1,0',
        avatar: '🧙',
        portrait: '🧙',
        description: 'Master of the Martial Training Grounds. His methods are harsh, but effective.',
        dialogue: {
            greeting: [
                "Ah, a new face at the Training Grounds. Ready to forge your body and spirit?",
                "Show me your stance... Hmm. We have much work to do.",
                "In my 150 years, I've trained thousands. Let's see if you have what it takes."
            ],
            idle: [
                "*demonstrates a strike that creates a small shockwave*",
                "*observes disciples training with a critical eye*",
                "Faster! The enemies beyond our walls won't wait for you to be ready."
            ],
            farewell: [
                "Practice what I've taught. I'll know if you slack off.",
                "Return when your muscles ache and your spirit burns for more.",
                "Ten thousand repetitions make a master. Begin counting."
            ]
        },
        quests: ['main_002', 'main_003', 'daily_training_001', 'daily_training_002'],
        faction: 'azure_cloud'
    },
    
    alchemist_mei: {
        id: 'alchemist_mei',
        name: 'Alchemist Mei',
        title: 'Pill Pavilion Master',
        role: ['quest_giver', 'vendor', 'trainer'],
        zone: '-1,0',
        avatar: '👩‍🔬',
        portrait: '👩‍🔬',
        description: 'Young alchemy prodigy. Only blew up two furnaces this month—a personal record.',
        dialogue: {
            greeting: [
                "Welcome! Watch the floor, it's still sticky from the last explosion.",
                "Just finished some new pills! Only 30% chance of side effects!",
                "Herbs, pills, elixirs—everything you need to die more slowly!"
            ],
            idle: [
                "*stirs a cauldron that seems to be judging everyone*",
                "*examines herbs with an oversized magnifying glass*",
                "Hmm, this needs more... secret ingredient. Don't ask which."
            ],
            farewell: [
                "Come back if you need pills! Or antidotes for poisoning!",
                "Bring me rare herbs if you find any! I pay well! More or less!",
                "May your cauldron never explode~ ...much."
            ]
        },
        quests: ['side_alchemy_001', 'daily_herb_001'],
        vendorInventory: [1, 2, 3],
        faction: 'azure_cloud'
    },
    
    gardener_liu: {
        id: 'gardener_liu',
        name: 'Gardener Liu',
        title: 'Spirit Garden Keeper',
        role: ['quest_giver', 'villager'],
        zone: '0,1',
        avatar: '👨‍🌾',
        portrait: '👨‍🌾',
        description: 'Has tended the sect herbs for 40 years. Talks to plants. They answer. Do not ask.',
        dialogue: {
            greeting: [
                "Ah, the herbs grow well today! This one is called 'Slow Death'. Beautiful, isn't it?",
                "Young one, did you come to learn about herbs or just to trample my garden?",
                "These plants require constant care. Like disciples, but more useful."
            ],
            idle: [
                "*waters a flower that appears to have teeth*",
                "*pulls weeds while muttering threats*",
                "Grow strong, little ones... and venomous..."
            ],
            farewell: [
                "Respect nature, and it won't kill you. Probably.",
                "Remember: patience is key. And poison resistance.",
                "May your garden flourish. Far from mine."
            ]
        },
        quests: ['side_garden_001', 'daily_herb_002'],
        faction: 'azure_cloud'
    },
    
    disciple_chen: {
        id: 'disciple_chen',
        name: 'Senior Disciple Chen',
        title: 'Outer Sect Prefect',
        role: ['quest_giver', 'guard'],
        zone: '0,-1',
        avatar: '💂',
        portrait: '💂',
        description: 'A friendly senior who still remembers his first day. It was two weeks ago.',
        dialogue: {
            greeting: [
                "New disciple? I remember my first days... they were terrible.",
                "Need help? It's literally my job. Unfortunately.",
                "The sect can be confusing at first. And later. And always, actually."
            ],
            idle: [
                "*patrols the dormitories pretending to be busy*",
                "*helps a lost disciple for the third time today*",
                "Keep your quarters clean! Or don't. I'm not your mother."
            ],
            farewell: [
                "Don't hesitate to ask for help. Hesitate just a little.",
                "We were all beginners once. Some of us still are.",
                "Good luck! You'll need it. A lot."
            ]
        },
        quests: ['tutorial_001', 'side_disciple_001'],
        faction: 'azure_cloud'
    },
    
    // === WILDERNESS NPCs ===
    hermit_zhang: {
        id: 'hermit_zhang',
        name: 'Hermit Zhang',
        title: 'The Mad Sage',
        role: ['quest_giver', 'vendor'],
        zone: '-1,-4',
        avatar: '🧓',
        portrait: '🧓',
        description: 'Has lived alone in the swamp for decades. Solitude did him well. Or not. Hard to tell.',
        dialogue: {
            greeting: [
                "Hehehe... another seeker of secrets? Or did you come for the cookies?",
                "The Black Water whispers to those who listen... it says 'go away'...",
                "You have the look of one who has seen beyond the veil. Or who slept poorly."
            ],
            idle: [
                "*mumbles incomprehensible things that could be wisdom or a shopping list*",
                "*draws symbols in the air that disappear suspiciously*",
                "Yes, yes... the stars align... or those are spots in my vision..."
            ],
            farewell: [
                "Beware what lurks in the shadows... or don't, it's your problem.",
                "Hehehehe...",
                "Return when the moon is dark. Or whenever, I don't care."
            ]
        },
        quests: ['side_hermit_001', 'side_hermit_002'],
        vendorInventory: [8, 9, 10]
    },
    
    guard_captain_wu: {
        id: 'guard_captain_wu',
        name: 'Captain Wu',
        title: 'Gate Commander',
        role: ['quest_giver', 'guard'],
        zone: '0,2',
        avatar: '🛡️',
        portrait: '🛡️',
        description: 'Battle-hardened veteran. Has more scars than patience.',
        dialogue: {
            greeting: [
                "Halt! Oh, it's you. Thought you were another bandit disguised as a disciple.",
                "The wilderness grows more dangerous by the day. Not my problem, but...",
                "We could use capable cultivators like you. Or less incompetent ones."
            ],
            idle: [
                "*inspects guards with a look that makes veterans tremble*",
                "*watches the horizon as if expecting trouble*",
                "Stay alert, men! Or at least awake!"
            ],
            farewell: [
                "Be careful out there. Or don't. The paperwork's the same.",
                "Report any suspicious activity. Except mine.",
                "For the sect!"
            ]
        },
        quests: ['bounty_bandit_001', 'bounty_beast_001', 'bounty_ghost_001', 'daily_patrol_001'],
        faction: 'azure_cloud'
    },
    
    // === NEW NPCs FOR ARC 2 ===
    
    scribe_zhang: {
        id: 'scribe_zhang',
        name: 'Scribe Zhang',
        title: 'Keeper of the Sacred Library',
        role: ['quest_giver', 'vendor'],
        zone: '0,1',
        avatar: '📚',
        portrait: '📚',
        description: 'The ancient keeper of all written knowledge in the sect. His memory is legendary, but his patience is short.',
        dialogue: {
            greeting: [
                "Speak softly, young one. The scrolls are sleeping.",
                "Knowledge is power. But power without wisdom is just... a bigger explosion.",
                "I have catalogued every scroll in this library for three hundred years. Don't make me regret letting you in."
            ],
            idle: [
                "*meticulously organizes scrolls that were already perfectly organized*",
                "*reads an ancient text while somehow watching everything*",
                "Who moved this scroll?! It was 0.3 inches to the left yesterday!"
            ],
            farewell: [
                "Handle the scrolls with care. They are older than your entire bloodline.",
                "Knowledge awaits your return. So does my judgment.",
                "The library is always open... except when it isn't."
            ]
        },
        quests: ['main_006', 'side_library_001', 'side_library_002'],
        vendorInventory: [],
        faction: 'azure_cloud'
    },
    
    shadow_elder_moyin: {
        id: 'shadow_elder_moyin',
        name: 'Elder Moyin',
        title: 'Shadow Matriarch',
        role: ['quest_giver', 'elder'],
        zone: '-4,1',
        avatar: '👻',
        portrait: '👻',
        description: 'Leader of the Valley of Shadows sect. She is neither ally nor enemy—she simply IS. Her age is measured in millennia, not centuries.',
        dialogue: {
            greeting: [
                "So... the Azure Cloud sends their pawn into the shadows. How... expected.",
                "You seek answers about the Void. I see it in your qi. The question is: are you ready for them?",
                "I have watched empires rise and fall like waves on a shore. Your sect is but a ripple."
            ],
            idle: [
                "*her form flickers between solid and shadow*",
                "*multiple pairs of eyes seem to observe from within the darkness*",
                "The shadows whisper secrets... but not all secrets should be heard."
            ],
            farewell: [
                "Go, young one. Let the shadows guide you... or consume you. Your choice.",
                "We will meet again. The shadows have shown me this.",
                "Tell your masters: the darkness remembers old debts."
            ]
        },
        quests: ['main_007', 'side_shadow_001'],
        faction: 'shadow_sect'
    },
    
    elder_huoyan_corrupted: {
        id: 'elder_huoyan_corrupted',
        name: 'Corrupted Huoyan',
        title: 'The Fallen Flame',
        role: ['boss'],
        zone: '-5,0',
        avatar: '🔥',
        portrait: '🔥',
        description: 'Once the respected Elder of Fire Arts, now twisted by void corruption. His flames burn black with the power of the unsealing.',
        dialogue: {
            greeting: [
                "You... always the persistent little insect. I remember when you first arrived. So naive. So weak.",
                "Do you know why I turned to the Void? Because the sect's power is NOTHING compared to what awaits!",
                "The Emperor whispers to me. He shows me truths that your feeble masters could never comprehend!"
            ],
            idle: [
                "*black flames dance around his form, whispering in tongues unknown*",
                "*his eyes flicker between human and something... else*",
                "Yes... yes, I hear you, my Lord. Soon... very soon..."
            ],
            farewell: [
                "Run while you can. When He rises, there will be nowhere to hide.",
                "This is not the end, child. It is merely the beginning of your nightmares.",
                "We shall meet again... in the Void between worlds..."
            ]
        },
        quests: ['main_010'],
        faction: 'void_cult'
    },
    
    disciple_mei_lin: {
        id: 'disciple_mei_lin',
        name: 'Mei Lin',
        title: 'Senior Sister',
        role: ['quest_giver', 'vendor'],
        zone: '0,1',
        avatar: '👧',
        portrait: '👧',
        description: 'A talented senior disciple with a sharp tongue and sharper sword. Secretly kind beneath her competitive exterior.',
        dialogue: {
            greeting: [
                "Oh, it's you again. I heard about your 'heroics'. Not bad... for a beginner.",
                "What? No, I wasn't waiting for you. I was just... cultivating. Here. Coincidentally.",
                "If you need help, just ask. But don't expect me to go easy on you."
            ],
            idle: [
                "*practices sword forms with effortless grace*",
                "*pretends not to be watching your approach*",
                "No, I'm not competing with you. I'm just... tracking your progress. For the sect records."
            ],
            farewell: [
                "Try not to die out there. It would be... inconvenient.",
                "I'll be training if you need me. Not that you'd need me. Obviously.",
                "Good luck. Not that luck matters when you have skill. Which you're still developing."
            ]
        },
        quests: ['side_rival_001', 'side_rival_002', 'side_rival_003'],
        faction: 'azure_cloud'
    },
    
    alchemist_wang: {
        id: 'alchemist_wang',
        name: 'Alchemist Wang',
        title: 'Pill Master',
        role: ['vendor', 'quest_giver'],
        zone: '0,1',
        avatar: '⚗️',
        portrait: '⚗️',
        description: 'The sect\'s head alchemist. His pills are legendary—as are his explosions. The new laboratory is the third one this year.',
        dialogue: {
            greeting: [
                "Welcome, welcome! Mind the bubbling cauldron—it's only slightly unstable.",
                "Need pills? Need materials? Need your eyebrows back? I can help with two of those.",
                "My success rate is up to 73%! The explosions are getting smaller too!"
            ],
            idle: [
                "*mutters formulas while adding suspicious ingredients*",
                "*something bubbles ominously in the background*",
                "No, no, that's not supposed to glow purple... probably fine."
            ],
            farewell: [
                "Come back soon! Unless you hear explosions, then wait a bit.",
                "May your cultivation be as smooth as my pill refinement! ...That came out wrong.",
                "Remember: if a pill glows, it's either very good or very bad. Flip a coin!"
            ]
        },
        quests: ['side_alchemy_001', 'daily_herb_001'],
        vendorInventory: [8, 9],
        faction: 'azure_cloud'
    }
};

// ============================================
// TUTORIAL QUEST - Auto-accepted for new players
// ============================================

export const tutorialQuest: Quest = {
    id: 'tutorial_001',
    name: 'A Cultivator Awakens',
    type: 'main',
    chapter: 0,
    arc: 'Tutorial',
    description: 'You have just arrived at the Azure Cloud Sect with nothing but your cultivation potential and a basic weapon. Learn the fundamentals of being a cultivator: equip your gear, use your skills, and defeat your first enemy.',
    shortDesc: 'Learn the basics of cultivation',
    levelRequired: 1,
    autoAccept: true, // Special flag for tutorial
    objectives: [
        { id: 'tut_1', type: 'special', description: 'Open your Character tab and view your stats', target: 'view_character', required: 1, current: 0 },
        { id: 'tut_2', type: 'special', description: 'Check your equipped weapon in the gear slots', target: 'check_gear', required: 1, current: 0 },
        { id: 'tut_3', type: 'kill', description: 'Defeat a Spirit Rat to test your combat skills', target: 1, required: 1, current: 0 },
        { id: 'tut_4', type: 'special', description: 'Use an HP Pill from your inventory', target: 'use_consumable', required: 1, current: 0 },
        { id: 'tut_5', type: 'special', description: 'Visit the Forge tab to see crafting options', target: 'visit_forge', required: 1, current: 0 },
    ],
    rewards: {
        exp: 100,
        spiritStones: 25,
        items: [
            { itemId: 'CONS_HP_001', quantity: 5 },
            { itemId: 'CONS_QI_001', quantity: 3 }
        ],
        reputation: { azure_cloud: 25 },
        title: 'Initiated'
    },
    dialogue: {
        npcId: 'system',
        npcName: 'Cultivation Guide',
        intro: [
            "Welcome, young cultivator! I am your guide to the world of cultivation.",
            "You have been given starter equipment and supplies to begin your journey.",
            "Complete these basic tasks to familiarize yourself with your abilities."
        ],
        progress: [
            "Keep going! Each task you complete brings you closer to mastering the basics.",
            "Remember: every immortal started as a beginner just like you."
        ],
        complete: [
            "Excellent! You have mastered the fundamentals of cultivation.",
            "The path to immortality stretches endlessly before you. Go forth and grow stronger!"
        ]
    },
    zone: '0,0',
    nextQuest: 'main_001'
};

// ============================================
// MAIN STORY QUESTS - ARC 1: THE AWAKENING
// ============================================

export const mainQuests: Quest[] = [
    tutorialQuest, // Add tutorial as first quest
    {
        id: 'main_001',
        name: 'The Path Begins',
        type: 'main',
        chapter: 1,
        arc: 'The Awakening',
        description: 'You have been accepted into the Azure Cloud Sect as an Outer Disciple. Elder Xuanming, the Sect Master himself, wishes to speak with you about your future. This is a great honor—few disciples ever meet the Sect Master directly.',
        shortDesc: 'Report to the Sect Master',
        levelRequired: 1,
        objectives: [
            { id: 'obj_1', type: 'talk', description: 'Speak with Elder Xuanming at the Main Hall (0,0)', target: 'elder_xuanming', required: 1, current: 0 }
        ],
        rewards: {
            exp: 500,
            spiritStones: 50,
            items: [{ itemId: 'CONS_HP_001', quantity: 3 }],
            reputation: { azure_cloud: 50 }
        },
        dialogue: {
            npcId: 'elder_xuanming',
            npcName: 'Elder Xuanming',
            intro: [
                "Welcome, young one. I am Xuanming, Sect Master of Azure Cloud.",
                "You have taken your first step on the path of cultivation. It will be long, difficult, and often painful.",
                "Your journey begins at the Training Grounds. Elder Qingfeng will teach you the fundamentals of combat. Seek him to the east."
            ],
            progress: [
                "Elder Qingfeng awaits at the Training Grounds. He may seem harsh, but his methods are effective.",
                "Go east from here. The sound of training will guide you."
            ],
            complete: [
                "You've taken your first step on the path to immortality.",
                "Remember: every master was once a beginner. Your journey has only just begun."
            ]
        },
        zone: '0,0',
        nextQuest: 'main_002'
    },
    
    {
        id: 'main_002',
        name: 'First Steps in Combat',
        type: 'main',
        chapter: 1,
        arc: 'The Awakening',
        description: 'Elder Qingfeng will teach you the fundamentals of martial combat. The creatures beyond the sect gates serve as your training partners. Head to the North Gate where Spirit Rats and Garden Spiders roam. Defeat them to prove your worth and reach Level 2.',
        shortDesc: 'Complete martial training',
        levelRequired: 1,
        prerequisites: ['main_001'],
        objectives: [
            { id: 'obj_1', type: 'talk', description: 'Find Elder Qingfeng at the Training Grounds (1,0)', target: 'elder_qingfeng', required: 1, current: 0 },
            { id: 'obj_2', type: 'kill', description: 'Defeat Spirit Rats at the North Gate', target: 1, required: 3, current: 0 },
            { id: 'obj_3', type: 'reach_level', description: 'Reach Level 2 through combat experience', target: 2, required: 1, current: 0 }
        ],
        rewards: {
            exp: 1500,
            spiritStones: 120,
            items: [{ itemId: 'CONS_HP_001', quantity: 10 }, { itemId: 'CONS_QI_001', quantity: 5 }],
            reputation: { azure_cloud: 100 }
        },
        dialogue: {
            npcId: 'elder_qingfeng',
            npcName: 'Elder Qingfeng',
            intro: [
                "So, Elder Xuanming sent you. Good. Let me assess your potential.",
                "Your stance is weak, your breathing unsteady. But these things can be fixed.",
                "Head north to the Gate beyond our walls. The Spirit Rats there will test your mettle. Return when you've reached Level 2."
            ],
            progress: [
                "Still struggling? The creatures at the North Gate are mere vermin. Press on!",
                "Combat experience will strengthen you. Each battle teaches a lesson."
            ],
            complete: [
                "Your movements have improved. You no longer telegraph every strike.",
                "You've proven you can survive. Now the real training begins."
            ]
        },
        zone: '1,0',
        nextQuest: 'main_003'
    },
    
    {
        id: 'main_003',
        name: 'The Bandit Menace',
        type: 'main',
        chapter: 2,
        arc: 'The Awakening',
        description: 'The Iron Claw Bandits have been raiding merchant caravans along the Rocky Path to the northwest. Their camp lies at (-1,3). Elder Qingfeng believes disrupting their operation will both protect travelers and provide you valuable combat experience against human opponents.',
        shortDesc: 'Eliminate the bandit threat',
        levelRequired: 3,
        levelRecommended: 5,
        prerequisites: ['main_002'],
        objectives: [
            { id: 'obj_1', type: 'explore', description: 'Locate the Iron Claw Bandit Camp (-1,3)', target: '-1,3', required: 1, current: 0 },
            { id: 'obj_2', type: 'kill', description: 'Defeat 5 Bandit Thugs (common bandits)', target: 11, required: 5, current: 0 },
            { id: 'obj_3', type: 'kill', description: 'Defeat the Bandit Captain (their leader)', target: 16, required: 1, current: 0 },
            { id: 'obj_4', type: 'kill', description: '(Bonus) Defeat 3 Bandit Archers', target: 12, required: 3, current: 0, optional: true }
        ],
        rewards: {
            exp: 4000,
            spiritStones: 350,
            items: [{ itemId: 'SW_T1_002', quantity: 1 }],
            reputation: { azure_cloud: 150, iron_claw: 75 }
        },
        bonusRewards: {
            exp: 1000,
            spiritStones: 100
        },
        dialogue: {
            npcId: 'elder_qingfeng',
            npcName: 'Elder Qingfeng',
            intro: [
                "Disciple, the Iron Claw Bandits grow bold. They've been attacking merchants on the Rocky Path.",
                "Their camp lies to the northwest. The Bandit Captain leads them—a former cultivator who fell to greed.",
                "Eliminate the threat. Show them the Azure Cloud Sect protects these lands."
            ],
            progress: [
                "The bandit camp is at coordinates (-1,3). Follow the mountain path northwest.",
                "The Captain must fall for their organization to crumble."
            ],
            complete: [
                "Excellent work! The merchants will travel safely once more.",
                "You've proven yourself capable against human opponents. Your next challenge awaits."
            ]
        },
        zone: '-1,3',
        nextQuest: 'main_004'
    },
    
    {
        id: 'main_004',
        name: 'Whispers from the Tomb',
        type: 'main',
        chapter: 3,
        arc: 'The Awakening',
        description: 'Strange disturbances emanate from the Haunted Graveyard to the west. Corrupted Disciples—fallen cultivators twisted by dark energy—have been spotted wandering the graves. The Ancient Tomb beyond may be awakening.',
        shortDesc: 'Investigate the Ancient Tomb',
        levelRequired: 8,
        levelRecommended: 10,
        prerequisites: ['main_003'],
        objectives: [
            { id: 'obj_1', type: 'explore', description: 'Explore the Haunted Graveyard (-3,0)', target: '-3,0', required: 1, current: 0 },
            { id: 'obj_2', type: 'kill', description: 'Defeat Corrupted Disciples haunting the graveyard', target: 17, required: 5, current: 0 },
            { id: 'obj_3', type: 'explore', description: 'Find the Ancient Tomb Entrance (-4,0)', target: '-4,0', required: 1, current: 0 },
            { id: 'obj_4', type: 'collect', description: 'Collect Ancient Jade Fragment', target: 'ancient_jade', required: 1, current: 0 }
        ],
        rewards: {
            exp: 15000,
            spiritStones: 800,
            items: [{ itemId: 'SW_T2_001', quantity: 1 }, { itemId: 'CONS_HP_001', quantity: 20 }],
            reputation: { azure_cloud: 250, tomb_keepers: 150 }
        },
        dialogue: {
            npcId: 'elder_xuanming',
            npcName: 'Elder Xuanming',
            intro: [
                "Disciple, troubling reports come from the west. Corrupted Disciples wander the Haunted Graveyard.",
                "These were once cultivators like you, twisted by the dark Qi leaking from the Ancient Tomb.",
                "The Undead Emperor sealed himself there millennia ago. If the seals are weakening... investigate, but don't die."
            ],
            progress: [
                "The Haunted Graveyard is at (-3,0), west through the ruins.",
                "Defeat the Corrupted Disciples and find the Tomb Entrance further west."
            ],
            complete: [
                "An Ancient Jade Fragment! This is part of the seal!",
                "If the seals are breaking... we face grave danger. You've done well, disciple."
            ]
        },
        zone: '-3,0',
        nextQuest: 'main_005'
    },
    
    {
        id: 'main_005',
        name: 'Realm of the Thunder Dragon',
        type: 'main',
        chapter: 4,
        arc: 'The Awakening',
        description: 'To grow stronger, you must face the Thunder Dragons. Yes, dragons. Yes, it\'s as bad as it sounds.',
        shortDesc: 'Obtain a Thunder Dragon Core',
        levelRequired: 15,
        levelRecommended: 18,
        prerequisites: ['main_004'],
        objectives: [
            { id: 'obj_1', type: 'explore', description: 'Reach Thunder Peak Summit', target: '0,6', required: 1, current: 0 },
            { id: 'obj_2', type: 'kill', description: 'Defeat Thunder Dragon Whelps', target: 39, required: 3, current: 0 },
            { id: 'obj_3', type: 'kill', description: 'Defeat the Lightning Elemental', target: 33, required: 1, current: 0 },
            { id: 'obj_4', type: 'collect', description: 'Obtain Thunder Dragon Core', target: 'dragon_core', required: 1, current: 0 }
        ],
        rewards: {
            exp: 50000,
            spiritStones: 2500,
            items: [{ itemId: 'SW_T2_002', quantity: 1 }, { itemId: 'CONS_HP_001', quantity: 30 }, { itemId: 'CONS_QI_001', quantity: 20 }],
            reputation: { azure_cloud: 500 }
        },
        dialogue: {
            npcId: 'elder_xuanming',
            npcName: 'Elder Xuanming',
            intro: [
                "Your cultivation has progressed well. You're still weak, but less weak than before.",
                "To face what awakens in the tomb, you need more power. Much more.",
                "Journey to Thunder Peak Summit. The dragons there have cores of pure lightning Qi. You just have to... convince them to give one up."
            ],
            progress: [
                "The mountain is treacherous. The weather is worse. The dragons are even worse.",
                "Have you reached the summit? Still breathing? Impressive."
            ],
            complete: [
                "A Thunder Dragon Core! You've done the impossible!",
                "With this, we can prepare for what's coming. You've earned my respect. Didn't expect that."
            ]
        },
        zone: '0,6',
        nextQuest: 'main_006'
    },
    
    // ============================================
    // ARC 2: SHADOWS OF BETRAYAL
    // ============================================
    
    {
        id: 'main_006',
        name: 'The Sect in Turmoil',
        type: 'main',
        chapter: 5,
        arc: 'Shadows of Betrayal',
        description: 'You return from Thunder Peak victorious, but the sect is in chaos. Disciples whisper of a traitor among the Elders. Some claim to have seen shadowy figures in the Sacred Library at night. Elder Xuanming has called an emergency council.',
        shortDesc: 'Investigate the sect disturbance',
        levelRequired: 16,
        levelRecommended: 18,
        prerequisites: ['main_005'],
        objectives: [
            { id: 'obj_1', type: 'talk', description: 'Report to Elder Xuanming at the Main Hall', target: 'elder_xuanming', required: 1, current: 0 },
            { id: 'obj_2', type: 'explore', description: 'Search the Sacred Library for clues', target: '0,1', required: 1, current: 0 },
            { id: 'obj_3', type: 'collect', description: 'Find the torn scroll fragment', target: 'torn_scroll', required: 1, current: 0 },
            { id: 'obj_4', type: 'talk', description: 'Question the Library Keeper', target: 'scribe_zhang', required: 1, current: 0 }
        ],
        rewards: {
            exp: 40000,
            spiritStones: 2000,
            items: [{ itemId: 'CONS_HP_001', quantity: 25 }],
            reputation: { azure_cloud: 400 }
        },
        dialogue: {
            npcId: 'elder_xuanming',
            npcName: 'Elder Xuanming',
            intro: [
                "You return at a dark hour, disciple. While you battled dragons, shadows crept into our home.",
                "The Sacred Library has been breached. Ancient scrolls—techniques forbidden for millennia—have been accessed.",
                "I suspect one of our own. But accusing an Elder without proof would tear the sect apart."
            ],
            progress: [
                "The Library Keeper may have seen something. He watches all who enter.",
                "Look for anything out of place. The thief may have left traces."
            ],
            complete: [
                "This scroll fragment... it speaks of the Void Seal. Someone seeks to release what the Emperor bound!",
                "We have a traitor, and they seek to unleash ancient evil. Time is not our ally."
            ]
        },
        zone: '0,0',
        nextQuest: 'main_007'
    },
    
    {
        id: 'main_007',
        name: 'The Shadow Hunter',
        type: 'main',
        chapter: 6,
        arc: 'Shadows of Betrayal',
        description: 'The torn scroll reveals someone seeks the "Void Unbinding Technique"—a forbidden art to break divine seals. The only living practitioner of such arts resides in the Valley of Shadows. You must venture into enemy territory to learn more about this threat.',
        shortDesc: 'Journey to the Valley of Shadows',
        levelRequired: 18,
        levelRecommended: 20,
        prerequisites: ['main_006'],
        objectives: [
            { id: 'obj_1', type: 'explore', description: 'Navigate through the Haunted Graveyard', target: '-3,0', required: 1, current: 0 },
            { id: 'obj_2', type: 'kill', description: 'Defeat Shadow Assassins blocking your path', target: 24, required: 8, current: 0 },
            { id: 'obj_3', type: 'explore', description: 'Reach the Ancient Tomb Inner Chambers', target: '-4,1', required: 1, current: 0 },
            { id: 'obj_4', type: 'talk', description: 'Seek audience with the Shadow Elder', target: 'shadow_elder_moyin', required: 1, current: 0 },
            { id: 'obj_5', type: 'kill', description: '(Bonus) Defeat the Ancient Lich', target: 27, required: 1, current: 0, optional: true }
        ],
        rewards: {
            exp: 55000,
            spiritStones: 2800,
            items: [{ itemId: 'SW_T3_001', quantity: 1 }],
            reputation: { azure_cloud: 300 }
        },
        bonusRewards: {
            exp: 15000,
            spiritStones: 500
        },
        dialogue: {
            npcId: 'elder_xuanming',
            npcName: 'Elder Xuanming',
            intro: [
                "The Valley of Shadows... I had hoped never to send a disciple there.",
                "Their sect practices the shadow arts—not evil, but dangerous. They walk the line between light and dark.",
                "Shadow Elder Moyin is ancient, perhaps older than me. She may know who seeks the Void Unbinding Technique."
            ],
            progress: [
                "The path through the Corrupted Crossing is perilous. Shadow creatures test all who pass.",
                "Do not fight the Shadow Elder. She could erase your existence with a thought."
            ],
            complete: [
                "Moyin spoke to you? She must have sensed your importance to what's coming.",
                "The traitor seeks to free the Void Emperor... this is worse than I feared."
            ]
        },
        zone: '-3,-3',
        nextQuest: 'main_008'
    },
    
    {
        id: 'main_008',
        name: 'Masks of Deception',
        type: 'main',
        chapter: 7,
        arc: 'Shadows of Betrayal',
        description: 'Shadow Elder Moyin revealed that the Void Unbinding Technique requires three sacred components: a Shard of Sealed Darkness, the Blood of a True Cultivator, and the Soul Echo of the Bound. She suspects the traitor will strike during the upcoming Celestial Festival.',
        shortDesc: 'Uncover the traitor at the Festival',
        levelRequired: 20,
        levelRecommended: 22,
        prerequisites: ['main_007'],
        objectives: [
            { id: 'obj_1', type: 'talk', description: 'Attend the Celestial Festival opening ceremony', target: 'elder_xuanming', required: 1, current: 0 },
            { id: 'obj_2', type: 'explore', description: 'Patrol the Festival grounds for suspicious activity', target: '0,2', required: 1, current: 0 },
            { id: 'obj_3', type: 'talk', description: 'Interview the gathered Elders', target: 'elder_qingfeng', required: 1, current: 0 },
            { id: 'obj_4', type: 'special', description: 'Witness the traitor\'s revelation', target: 'traitor_reveal', required: 1, current: 0 },
            { id: 'obj_5', type: 'kill', description: 'Pursue and confront the Flame Demon', target: 31, required: 1, current: 0 }
        ],
        rewards: {
            exp: 70000,
            spiritStones: 3500,
            items: [{ itemId: 'SW_T3_002', quantity: 1 }, { itemId: 'CONS_HP_001', quantity: 30 }],
            reputation: { azure_cloud: 600 },
            title: 'Shadow Piercer'
        },
        dialogue: {
            npcId: 'elder_xuanming',
            npcName: 'Elder Xuanming',
            intro: [
                "The Celestial Festival... a time of celebration, now shadowed by treachery.",
                "The traitor will make their move. They need the Blood of a True Cultivator—and what better place than a gathering of our finest?",
                "Stay vigilant. Watch the Elders. Trust no one completely... not even me, if your instincts warn you."
            ],
            progress: [
                "The Festival grounds bustle with activity. Perfect cover for a traitor.",
                "Something feels wrong. The Qi in the air is disturbed."
            ],
            complete: [
                "Elder Huoyan... I trained him myself. Sixty years of brotherhood, and this is how it ends.",
                "He flees to the Ancient Tomb. He seeks to complete the ritual there."
            ]
        },
        zone: '0,2',
        nextQuest: 'main_009'
    },
    
    {
        id: 'main_009',
        name: 'Descent into Darkness',
        type: 'main',
        chapter: 8,
        arc: 'Shadows of Betrayal',
        description: 'Elder Huoyan—once a respected master of fire cultivation—has fled to the Ancient Tomb. He seeks to complete the Void Unbinding ritual and free the Void Emperor. You must pursue him through the depths of the tomb, facing the awakened guardians and the growing darkness.',
        shortDesc: 'Pursue the traitor into the tomb',
        levelRequired: 22,
        levelRecommended: 25,
        prerequisites: ['main_008'],
        objectives: [
            { id: 'obj_1', type: 'explore', description: 'Enter the Ancient Tomb Entrance', target: '-4,0', required: 1, current: 0 },
            { id: 'obj_2', type: 'kill', description: 'Defeat the Awakened Tomb Guardians', target: 25, required: 5, current: 0 },
            { id: 'obj_3', type: 'explore', description: 'Navigate the Inner Tomb Chambers', target: '-4,1', required: 1, current: 0 },
            { id: 'obj_4', type: 'kill', description: 'Defeat the Cursed Jade Guardian', target: 30, required: 1, current: 0 },
            { id: 'obj_5', type: 'explore', description: 'Reach the Tomb Inner Sanctum', target: '-5,0', required: 1, current: 0 }
        ],
        rewards: {
            exp: 85000,
            spiritStones: 4000,
            items: [{ itemId: 'SW_T3_003', quantity: 1 }],
            reputation: { azure_cloud: 700, tomb_keepers: 300 }
        },
        dialogue: {
            npcId: 'elder_xuanming',
            npcName: 'Elder Xuanming',
            intro: [
                "The tomb has fully awakened. Ancient defenses that slumbered for millennia now stir.",
                "Huoyan knows its passages—he studied them for decades. We thought it was scholarly interest...",
                "You must catch him before he reaches the Seal Chamber. If the Emperor awakens... there may be no stopping him."
            ],
            progress: [
                "The darkness grows thicker. Even the Tomb Keepers have fled to the upper levels.",
                "Do not let the whispers of the void touch your mind. They lie. They always lie."
            ],
            complete: [
                "You've reached the Seal Chamber... but you're not alone.",
                "Huoyan awaits. The final confrontation is at hand."
            ]
        },
        zone: '-4,-3',
        nextQuest: 'main_010'
    },
    
    {
        id: 'main_010',
        name: 'The Void Awakens',
        type: 'main',
        chapter: 9,
        arc: 'Shadows of Betrayal',
        description: 'In the heart of the Ancient Tomb, before the crumbling seal that holds the Void Emperor, you face Elder Huoyan. Corrupted by void energy, he has become something between human and demon. This is the battle that will determine the fate of the cultivation world.',
        shortDesc: 'Defeat Elder Huoyan and seal the Void',
        levelRequired: 25,
        levelRecommended: 28,
        prerequisites: ['main_009'],
        objectives: [
            { id: 'obj_1', type: 'talk', description: 'Confront Elder Huoyan at the Seal', target: 'elder_huoyan_corrupted', required: 1, current: 0 },
            { id: 'obj_2', type: 'kill', description: 'Defeat Corrupted Elder Huoyan (Boss)', target: 44, required: 1, current: 0 },
            { id: 'obj_3', type: 'special', description: 'Use the Thunder Dragon Core to reinforce the Seal', target: 'seal_void', required: 1, current: 0 },
            { id: 'obj_4', type: 'special', description: 'Escape the collapsing tomb', target: 'escape_tomb', required: 1, current: 0 }
        ],
        rewards: {
            exp: 150000,
            spiritStones: 10000,
            items: [{ itemId: 'SW_T4_001', quantity: 1 }],
            reputation: { azure_cloud: 1500, tomb_keepers: 500 },
            title: 'Void Sealer',
            unlocks: ['arc3_teaser']
        },
        dialogue: {
            npcId: 'elder_huoyan_corrupted',
            npcName: 'Corrupted Elder Huoyan',
            intro: [
                "You're too late, young one. The seal weakens with each breath. Soon, He will be free.",
                "You cannot understand. The Void Emperor offers power beyond anything our pathetic sect could imagine!",
                "When He rises, those who served him will be rewarded. Those who opposed... will be fuel for His ascension."
            ],
            progress: [
                "The void calls to all of us! Even now, I can feel it whispering to you!",
                "Fight all you want—the ritual is nearly complete!"
            ],
            complete: [
                "No... the Thunder Dragon Core... you actually did it...",
                "The seal... holds... for now. But He is patient. He has waited millennia. He will wait more.",
                "You have won this battle, young cultivator. But the war... the war is just beginning."
            ]
        },
        zone: '-4,-3'
    }
];

// ============================================
// DAILY QUESTS
// ============================================

export const dailyQuests: Quest[] = [
    {
        id: 'daily_training_001',
        name: 'Daily Martial Training',
        type: 'daily',
        description: 'A true cultivator never stops training. Head to the North Gate and defeat Spirit Rats and Garden Spiders. This daily practice keeps your combat reflexes sharp.',
        shortDesc: 'Defeat 10 creatures for training',
        levelRequired: 1,
        objectives: [
            { id: 'obj_1', type: 'kill', description: 'Defeat Spirit Rats at the North Gate', target: 1, required: 5, current: 0 },
            { id: 'obj_2', type: 'kill', description: 'Defeat Garden Spiders at the North Gate', target: 2, required: 5, current: 0 }
        ],
        rewards: {
            exp: 400,
            spiritStones: 80,
            reputation: { azure_cloud: 15 }
        },
        dialogue: {
            npcId: 'elder_qingfeng',
            npcName: 'Elder Qingfeng',
            intro: [
                "Daily practice is the foundation of mastery.",
                "Head to the North Gate and engage in combat with the Spirit Rats and Garden Spiders.",
                "Defeat 10 of them total. Return when you've sharpened your skills."
            ],
            progress: ["Your training continues. Keep fighting until you've reached your quota."],
            complete: ["Good. Consistent effort builds lasting strength. Return tomorrow."]
        },
        repeatable: true,
        cooldown: 24
    },
    
    {
        id: 'daily_training_002',
        name: 'Elite Combat Training',
        type: 'daily',
        description: 'For those seeking greater challenges. Venture to the Spirit Beast Den (3,0) or the Misty Poison Swamp (0,-3) and test yourself against Mountain Apes, Poison Spiders, and other dangerous creatures.',
        shortDesc: 'Defeat 5 elite enemies',
        levelRequired: 5,
        objectives: [
            { id: 'obj_1', type: 'kill', description: 'Defeat Mountain Apes at the Beast Den', target: 13, required: 3, current: 0 },
            { id: 'obj_2', type: 'kill', description: 'Defeat Poison Spiders at the Swamp or Den', target: 14, required: 2, current: 0 }
        ],
        rewards: {
            exp: 800,
            spiritStones: 150,
            items: [{ itemId: 'CONS_HP_001', quantity: 5 }],
            reputation: { azure_cloud: 20 }
        },
        dialogue: {
            npcId: 'elder_qingfeng',
            npcName: 'Elder Qingfeng',
            intro: [
                "You've grown strong enough to face real challenges.",
                "The Beast Den east of here holds Mountain Apes and Poison Spiders.",
                "Defeat 5 worthy opponents and return. Show me you're ready for harder trials."
            ],
            progress: ["Still hunting? The Beast Den is at (3,0), east through the Bamboo Forest."],
            complete: ["Excellent. Your growth is evident. Tomorrow, we push further."]
        },
        repeatable: true,
        cooldown: 24
    },
    
    {
        id: 'daily_herb_001',
        name: 'Herb Gathering',
        type: 'daily',
        description: 'Alchemist Mei needs fresh Spirit Essence for her pill refinement. Defeat Herb Spirits in the Spirit Garden (0,1) or Ghost Cultivators in the Ancient Tombs—they carry concentrated spiritual energy.',
        shortDesc: 'Collect 5 Spirit Essence',
        levelRequired: 1,
        objectives: [
            { id: 'obj_1', type: 'collect', description: 'Collect Spirit Essence (dropped by Herb Spirit, Ghost Cultivator)', target: 'Spirit Essence', required: 5, current: 0 }
        ],
        rewards: {
            exp: 300,
            spiritStones: 100,
            items: [{ itemId: 'CONS_HP_001', quantity: 5 }, { itemId: 'CONS_QI_001', quantity: 3 }]
        },
        dialogue: {
            npcId: 'alchemist_mei',
            npcName: 'Alchemist Mei',
            intro: [
                "Ah, perfect timing! My Spirit Essence supplies are running low.",
                "Herb Spirits in the garden and Ghost Cultivators carry what I need.",
                "Bring me 5 Spirit Essences and I'll reward you well!"
            ],
            progress: ["Still gathering? Herb Spirits are common in the Spirit Garden!"],
            complete: ["Wonderful! This essence is perfect quality. Come back tomorrow!"]
        },
        repeatable: true,
        cooldown: 24
    },
    
    {
        id: 'daily_herb_002',
        name: 'Gardener\'s Request',
        type: 'daily',
        description: 'Gardener Liu needs you to clear pests from the Spirit Garden. The Pestilent Worms have been infesting the herb beds and their poison sacs are useful for fertilizer.',
        shortDesc: 'Collect 3 Poison Sacs',
        levelRequired: 2,
        objectives: [
            { id: 'obj_1', type: 'collect', description: 'Collect Poison Sacs (dropped by Pestilent Worm)', target: 'Poison Sac', required: 3, current: 0 }
        ],
        rewards: {
            exp: 250,
            spiritStones: 80,
            items: [{ itemId: 'CONS_HP_001', quantity: 3 }],
            reputation: { azure_cloud: 10 }
        },
        dialogue: {
            npcId: 'gardener_liu',
            npcName: 'Gardener Liu',
            intro: [
                "Those wretched worms are back again, gnawing at my precious herbs!",
                "Kill a few Pestilent Worms and bring me their poison sacs.",
                "The sacs make excellent fertilizer... don't ask how."
            ],
            progress: ["Still hunting worms? They're everywhere in the garden, sadly."],
            complete: ["Excellent! The herbs will grow strong with these. Nature thanks you... menacingly."]
        },
        repeatable: true,
        cooldown: 24
    },
    
    {
        id: 'daily_patrol_001',
        name: 'Perimeter Patrol',
        type: 'daily',
        description: 'The sect needs disciples to patrol key locations. Visit the North Gate (0,2), South Gate (0,-2), and West Ruins (-2,0) to ensure our borders are secure.',
        shortDesc: 'Patrol 3 border locations',
        levelRequired: 3,
        objectives: [
            { id: 'obj_1', type: 'explore', description: 'Patrol North Gate (0,2)', target: '0,2', required: 1, current: 0 },
            { id: 'obj_2', type: 'explore', description: 'Patrol South Gate (0,-2)', target: '0,-2', required: 1, current: 0 },
            { id: 'obj_3', type: 'explore', description: 'Patrol West Ruins (-2,0)', target: '-2,0', required: 1, current: 0 }
        ],
        rewards: {
            exp: 500,
            spiritStones: 120,
            items: [{ itemId: 'CONS_HP_001', quantity: 3 }],
            reputation: { azure_cloud: 15 }
        },
        dialogue: {
            npcId: 'guard_captain_wu',
            npcName: 'Captain Wu',
            intro: [
                "We need eyes on our perimeter. Threats approach from all directions.",
                "Visit the North Gate, the South Gate, and the West Ruins.",
                "Report back when you've confirmed all is secure."
            ],
            progress: ["Continue your patrol. All three locations must be checked."],
            complete: ["Patrol complete. The sect thanks you for your vigilance."]
        },
        repeatable: true,
        cooldown: 24
    }
];

// ============================================
// BOUNTY QUESTS
// ============================================

export const bountyQuests: Quest[] = [
    {
        id: 'bounty_bandit_001',
        name: 'Bounty: Bandit Hunt',
        type: 'bounty',
        description: 'The Iron Claw Bandits at their camp (-1,3) continue to threaten merchant caravans. Hunt down their Thugs and Archers to keep the roads safe.',
        shortDesc: 'Hunt 15 bandits',
        levelRequired: 4,
        objectives: [
            { id: 'obj_1', type: 'kill', description: 'Defeat Bandit Thugs at the Bandit Camp (-1,3)', target: 11, required: 10, current: 0 },
            { id: 'obj_2', type: 'kill', description: 'Defeat Bandit Archers at the Bandit Camp (-1,3)', target: 12, required: 5, current: 0 }
        ],
        rewards: {
            exp: 1500,
            spiritStones: 300,
            items: [{ itemId: 'CONS_HP_001', quantity: 10 }],
            reputation: { azure_cloud: 30, iron_claw: 25 }
        },
        dialogue: {
            npcId: 'guard_captain_wu',
            npcName: 'Captain Wu',
            intro: [
                "Bounty available: The Iron Claw Bandits have set up camp northwest of here at (-1,3).",
                "Hunt down 10 Thugs and 5 Archers. Make them regret threatening our roads."
            ],
            progress: ["The Bandit Camp is at (-1,3). Keep hunting until you've met the quota."],
            complete: ["Bounty claimed. The roads are safer thanks to you."]
        },
        repeatable: true,
        cooldown: 12
    },
    
    {
        id: 'bounty_beast_001',
        name: 'Bounty: Beast Culling',
        type: 'bounty',
        description: 'Spirit beast populations at the Beast Den (3,0), Poison Swamp (0,-3), and Spirit Mine (0,4) are out of control. Cull Mountain Apes, Poison Spiders, and Rock Serpents.',
        shortDesc: 'Hunt spirit beasts',
        levelRequired: 6,
        objectives: [
            { id: 'obj_1', type: 'kill', description: 'Defeat Mountain Apes at the Beast Den (3,0)', target: 13, required: 5, current: 0 },
            { id: 'obj_2', type: 'kill', description: 'Defeat Poison Spiders at the Swamp (0,-3) or Den (3,0)', target: 14, required: 5, current: 0 },
            { id: 'obj_3', type: 'kill', description: 'Defeat Rock Serpents at the Spirit Mine (0,4)', target: 15, required: 3, current: 0 }
        ],
        rewards: {
            exp: 2500,
            spiritStones: 450,
            items: [{ itemId: 'CONS_HP_001', quantity: 15 }, { itemId: 'CONS_QI_001', quantity: 8 }],
            reputation: { beast_tamers: 40 }
        },
        dialogue: {
            npcId: 'guard_captain_wu',
            npcName: 'Captain Wu',
            intro: [
                "Beast populations are threatening travelers. Time for a culling.",
                "Mountain Apes at the Beast Den (3,0), Poison Spiders in the Swamp (0,-3), and Rock Serpents in the Spirit Mine (0,4). Hunt them all."
            ],
            progress: ["Still more beasts to hunt. Check the Den, Swamp, and Mine."],
            complete: ["Balance restored. The paths are safer now."]
        },
        repeatable: true,
        cooldown: 12
    },
    
    {
        id: 'bounty_ghost_001',
        name: 'Bounty: Restless Spirits',
        type: 'bounty',
        description: 'Ghost Cultivators and Corrupted Monks have been spotted at Thunder Peak Base (0,5) and the Ancient Tomb Entrance (-4,0). These fallen cultivators threaten travelers. Put them to rest permanently.',
        shortDesc: 'Defeat undead cultivators',
        levelRequired: 10,
        objectives: [
            { id: 'obj_1', type: 'kill', description: 'Defeat Ghost Cultivators at Thunder Peak Base (0,5)', target: 21, required: 8, current: 0 },
            { id: 'obj_2', type: 'kill', description: 'Defeat Corrupted Monks at the Tomb Entrance (-4,0)', target: 22, required: 5, current: 0 }
        ],
        rewards: {
            exp: 5000,
            spiritStones: 800,
            items: [{ itemId: 'CONS_HP_001', quantity: 20 }, { itemId: 'CONS_QI_001', quantity: 12 }],
            reputation: { tomb_keepers: 50 }
        },
        dialogue: {
            npcId: 'guard_captain_wu',
            npcName: 'Captain Wu',
            intro: [
                "Urgent bounty. Ghost Cultivators haunt Thunder Peak Base, and Corrupted Monks guard the Tomb Entrance.",
                "These restless spirits were once cultivators like us. Now they're a threat. Handle it."
            ],
            progress: ["Thunder Peak Base is north at (0,5). The Tomb is west at (-4,0). Keep fighting."],
            complete: ["Peace restored. The Tomb Keepers send their thanks."]
        },
        repeatable: true,
        cooldown: 12
    }
];

// ============================================
// SIDE QUESTS
// ============================================

export const sideQuests: Quest[] = [
    {
        id: 'side_alchemy_001',
        name: "Alchemist's Apprentice",
        type: 'side',
        description: 'Alchemist Mei needs ingredients for a new recipe. What could possibly go wrong?',
        shortDesc: 'Collect alchemy materials',
        levelRequired: 2,
        objectives: [
            { id: 'obj_1', type: 'collect', description: 'Collect Spirit Herbs', target: 'herb', required: 3, current: 0 },
            { id: 'obj_2', type: 'collect', description: 'Collect Beast Cores', target: 'core', required: 2, current: 0 }
        ],
        rewards: {
            exp: 800,
            spiritStones: 180,
            items: [{ itemId: 'CONS_HP_001', quantity: 10 }, { itemId: 'CONS_QI_001', quantity: 5 }]
        },
        dialogue: {
            npcId: 'alchemist_mei',
            npcName: 'Alchemist Mei',
            intro: ["I'm working on a new formula! Can you help gather materials? I promise it only explodes sometimes!"],
            progress: ["Still need more ingredients... don't forget!"],
            complete: ["Perfect! Now I can complete my research! And maybe not blow anything up!"]
        }
    },
    
    {
        id: 'side_garden_001',
        name: 'Garden Troubles',
        type: 'side',
        description: 'Spirit Rats from beyond the gates have been sneaking into the Herb Garden and eating the precious medicinal herbs. Gardener Liu needs someone to exterminate them.',
        shortDesc: 'Clear garden pests',
        levelRequired: 1,
        objectives: [
            { id: 'obj_1', type: 'talk', description: 'Speak with Gardener Liu at the Spirit Herb Garden (0,1)', target: 'gardener_liu', required: 1, current: 0 },
            { id: 'obj_2', type: 'kill', description: 'Defeat Spirit Rats at the North Gate (0,2)', target: 1, required: 5, current: 0 }
        ],
        rewards: {
            exp: 400,
            spiritStones: 100,
            items: [{ itemId: 'CONS_HP_001', quantity: 5 }]
        },
        dialogue: {
            npcId: 'gardener_liu',
            npcName: 'Gardener Liu',
            intro: [
                "Those cursed Spirit Rats from the North Gate keep sneaking into my garden!",
                "They're eating my precious Spirit Herbs! Go to the North Gate and cull their numbers!"
            ],
            progress: ["Have you dealt with the Spirit Rats? I can still smell their foul presence..."],
            complete: ["The garden is saved! Thank you, young cultivator! The herbs shall flourish once more!"]
        }
    },
    
    {
        id: 'side_hermit_002',
        name: "The Mad Sage's Request",
        type: 'side',
        description: 'Hermit Zhang wants something strange from Blackwater Lake. Better not ask why.',
        shortDesc: 'Collect blackwater sample',
        levelRequired: 12,
        prerequisites: ['side_hermit_001'],
        objectives: [
            { id: 'obj_1', type: 'explore', description: 'Visit Blackwater Lake', target: '0,-4', required: 1, current: 0 },
            { id: 'obj_2', type: 'kill', description: 'Defeat Abyssal Serpents', target: 26, required: 3, current: 0 },
            { id: 'obj_3', type: 'collect', description: 'Collect Blackwater Sample', target: 'blackwater', required: 1, current: 0 }
        ],
        rewards: {
            exp: 8000,
            spiritStones: 1200,
            items: [{ itemId: 'CONS_HP_001', quantity: 25 }, { itemId: 'CONS_QI_001', quantity: 15 }]
        },
        dialogue: {
            npcId: 'hermit_zhang',
            npcName: 'Hermit Zhang',
            intro: ["Heheheh... I need water from the black depths. And serpent venom. Don't ask why. Heheheh..."],
            progress: ["The waters call... can you hear them? No? Hmm, pity for you..."],
            complete: ["Yesssss... perfect! Take this, you've earned it. And tell no one."]
        }
    },
    
    {
        id: 'side_disciple_001',
        name: 'Lost and Found',
        type: 'side',
        description: 'A new disciple lost their training sword in the Bamboo Forest. Pests and Herb Spirits now guard the area. Help retrieve it.',
        shortDesc: 'Find lost training sword',
        levelRequired: 3,
        objectives: [
            { id: 'obj_1', type: 'explore', description: 'Search the Bamboo Forest (2,0)', target: '2,0', required: 1, current: 0 },
            { id: 'obj_2', type: 'kill', description: 'Clear Garden Spiders blocking the path', target: 2, required: 3, current: 0 },
            { id: 'obj_3', type: 'kill', description: 'Defeat Herb Spirits guarding the sword', target: 6, required: 2, current: 0 }
        ],
        rewards: {
            exp: 1200,
            spiritStones: 250,
            items: [{ itemId: 'CONS_HP_001', quantity: 8 }],
            reputation: { azure_cloud: 25 }
        },
        dialogue: {
            npcId: 'disciple_chen',
            npcName: 'Senior Disciple Chen',
            intro: ["A young disciple lost their sword in the Bamboo Forest east of here. Garden Spiders and Herb Spirits have made it their territory. Can you retrieve it?"],
            progress: ["Have you searched the Bamboo Forest (2,0)? The spirits there love shiny things..."],
            complete: ["You found it! The kid will be so relieved! And so am I!"]
        }
    },
    
    // ============================================
    // NEW SIDE QUESTS - LORE RICH
    // ============================================
    
    {
        id: 'side_rival_001',
        name: 'A Challenge from Mei Lin',
        type: 'side',
        description: 'Mei Lin, a senior disciple known for her competitive spirit, has noticed your rising reputation. She challenges you to prove your worth by defeating more enemies than her in a single day. Pride is on the line.',
        shortDesc: 'Defeat 20 enemies to prove your skill',
        levelRequired: 5,
        objectives: [
            { id: 'obj_1', type: 'talk', description: 'Accept Mei Lin\'s challenge at the Library (0,1)', target: 'disciple_mei_lin', required: 1, current: 0 },
            { id: 'obj_2', type: 'kill', description: 'Defeat Spirit Rats to prove your combat prowess', target: 1, required: 10, current: 0 },
            { id: 'obj_3', type: 'kill', description: 'Defeat Garden Spiders to continue proving yourself', target: 2, required: 10, current: 0 }
        ],
        rewards: {
            exp: 2000,
            spiritStones: 350,
            items: [{ itemId: 'CONS_HP_001', quantity: 10 }],
            reputation: { azure_cloud: 50 }
        },
        dialogue: {
            npcId: 'disciple_mei_lin',
            npcName: 'Mei Lin',
            intro: [
                "So you're the one everyone's been talking about. I'm not impressed... yet.",
                "Here's the deal: defeat 20 enemies. Any enemies. If you can't do that, you're nothing special.",
                "And before you ask—no, I'm not jealous of your progress. I'm just... testing you. For the sect."
            ],
            progress: ["Still fighting? I expected you'd give up by now. Hmph."],
            complete: [
                "Twenty enemies? Fine. I'll admit... you're not completely useless.",
                "Don't let this go to your head. I was just having an off day.",
                "*mutters* Maybe you are worth watching after all..."
            ]
        },
        zone: '0,1',
        nextQuest: 'side_rival_002'
    },
    
    {
        id: 'side_rival_002',
        name: 'The Secret Training Ground',
        type: 'side',
        description: 'Mei Lin reluctantly admits she knows a secret training spot where the sect\'s greatest disciples once trained. She invites you to join her... but only because she needs backup against the guardian beasts.',
        shortDesc: 'Explore the secret training ground with Mei Lin',
        levelRequired: 8,
        prerequisites: ['side_rival_001'],
        objectives: [
            { id: 'obj_1', type: 'explore', description: 'Meet Mei Lin at the Bamboo Forest (2,0)', target: '2,0', required: 1, current: 0 },
            { id: 'obj_2', type: 'kill', description: 'Defeat the Training Ground Guardians together', target: 6, required: 5, current: 0 },
            { id: 'obj_3', type: 'explore', description: 'Reach the Spirit Beast Den', target: '3,0', required: 1, current: 0 }
        ],
        rewards: {
            exp: 3500,
            spiritStones: 500,
            items: [{ itemId: 'SW_T1_003', quantity: 1 }],
            reputation: { azure_cloud: 75 }
        },
        dialogue: {
            npcId: 'disciple_mei_lin',
            npcName: 'Mei Lin',
            intro: [
                "Before you get any ideas—I'm not inviting you because I like you. I need backup.",
                "There's a secret training ground past the Bamboo Forest. Guardian beasts protect it.",
                "The sect's legendary disciples trained there. Maybe some of their talent will rub off on you."
            ],
            progress: ["Keep fighting! And no, I'm not going to carry you through this!"],
            complete: [
                "We made it. The Ancient Training Stones...",
                "You know, you're not... completely terrible. For a junior.",
                "If anyone asks, I did most of the work. Got it?"
            ]
        },
        zone: '3,0',
        nextQuest: 'side_rival_003'
    },
    
    {
        id: 'side_rival_003',
        name: 'The Price of Rivalry',
        type: 'side',
        description: 'Mei Lin has been missing for two days. Other disciples whisper that she went to challenge the Beast Den alone to prove she doesn\'t need you. Pride may have been her downfall. Find her before it\'s too late.',
        shortDesc: 'Rescue Mei Lin from the Beast Den',
        levelRequired: 12,
        prerequisites: ['side_rival_002'],
        objectives: [
            { id: 'obj_1', type: 'explore', description: 'Search for Mei Lin at the Beast Den (3,0)', target: '3,0', required: 1, current: 0 },
            { id: 'obj_2', type: 'kill', description: 'Clear the beasts blocking Mei Lin\'s location', target: 13, required: 8, current: 0 },
            { id: 'obj_3', type: 'kill', description: 'Defeat the Forest Guardian (Boss)', target: 19, required: 1, current: 0 },
            { id: 'obj_4', type: 'talk', description: 'Rescue Mei Lin', target: 'disciple_mei_lin', required: 1, current: 0 }
        ],
        rewards: {
            exp: 8000,
            spiritStones: 1200,
            items: [{ itemId: 'SW_T1_004', quantity: 1 }, { itemId: 'CONS_HP_001', quantity: 20 }],
            reputation: { azure_cloud: 150 },
            title: 'Loyal Companion'
        },
        dialogue: {
            npcId: 'disciple_mei_lin',
            npcName: 'Mei Lin',
            intro: [
                "What are YOU doing here?! I... I had everything under control!",
                "...Okay, maybe I was a little outnumbered. And surrounded. And out of pills.",
                "Fine! I admit it—I went in alone because I was jealous. There. Happy?!"
            ],
            progress: ["Just defeat that Alpha Ape! I'll... I'll stay back and... recover my qi. Obviously."],
            complete: [
                "You saved me. I... I don't know what to say. This never happened to me before.",
                "Thank you. Really. I was being an idiot, and you came anyway.",
                "Maybe... maybe having a rival isn't so bad. Maybe it's better than being alone."
            ]
        },
        zone: '3,0'
    },
    
    {
        id: 'side_library_001',
        name: 'The Forbidden Section',
        type: 'side',
        description: 'Scribe Zhang has noticed irregularities in the Sacred Library\'s restricted section. Ancient seals have been disturbed, and scrolls about the Void Emperor have been accessed without authorization. He needs your help to investigate.',
        shortDesc: 'Investigate the Library\'s forbidden section',
        levelRequired: 10,
        objectives: [
            { id: 'obj_1', type: 'talk', description: 'Speak with Scribe Zhang about the disturbance', target: 'scribe_zhang', required: 1, current: 0 },
            { id: 'obj_2', type: 'explore', description: 'Examine the broken seal in the restricted section', target: '0,1', required: 1, current: 0 },
            { id: 'obj_3', type: 'collect', description: 'Find the missing scroll fragment', target: 'scroll_fragment', required: 1, current: 0 },
            { id: 'obj_4', type: 'talk', description: 'Report your findings to Scribe Zhang', target: 'scribe_zhang', required: 1, current: 0 }
        ],
        rewards: {
            exp: 4000,
            spiritStones: 600,
            items: [{ itemId: 'CONS_QI_001', quantity: 15 }],
            reputation: { azure_cloud: 100 }
        },
        dialogue: {
            npcId: 'scribe_zhang',
            npcName: 'Scribe Zhang',
            intro: [
                "Disciple, I have a problem. A SERIOUS problem. Someone has been accessing the Forbidden Section.",
                "The scrolls about the Void Emperor... they've been moved. Read. The dust patterns don't lie.",
                "I know every soul who enters this library. But the seals were broken from INSIDE. That's impossible. Unless..."
            ],
            progress: ["Look carefully. Whoever did this left traces. They always leave traces."],
            complete: [
                "This scroll fragment... it's part of the Void Unbinding Technique. THAT scroll.",
                "Only the Elders have clearance for this section. One of them... one of them is a traitor.",
                "We must tell Elder Xuanming. But carefully. Very carefully."
            ]
        },
        zone: '0,1'
    },
    
    {
        id: 'side_library_002',
        name: 'The Secret Archives',
        type: 'side',
        description: 'Following your investigation, Scribe Zhang has discovered a hidden archive beneath the library that even he didn\'t know existed. Ancient knowledge awaits, but so do ancient guardians.',
        shortDesc: 'Explore the hidden archive beneath the library',
        levelRequired: 14,
        prerequisites: ['side_library_001'],
        objectives: [
            { id: 'obj_1', type: 'talk', description: 'Meet Scribe Zhang at the secret entrance', target: 'scribe_zhang', required: 1, current: 0 },
            { id: 'obj_2', type: 'kill', description: 'Defeat the ancient Library Guardians', target: 25, required: 5, current: 0 },
            { id: 'obj_3', type: 'explore', description: 'Reach the deepest chamber of the archive', target: '-1,0', required: 1, current: 0 },
            { id: 'obj_4', type: 'collect', description: 'Retrieve the Founding Sect Records', target: 'founding_records', required: 1, current: 0 },
            { id: 'obj_5', type: 'talk', description: 'Return the records to Scribe Zhang', target: 'scribe_zhang', required: 1, current: 0 }
        ],
        rewards: {
            exp: 8000,
            spiritStones: 1200,
            items: [{ itemId: 'SW_T3_002', quantity: 1 }],
            reputation: { azure_cloud: 200 },
            title: 'Keeper of Secrets'
        },
        dialogue: {
            npcId: 'scribe_zhang',
            npcName: 'Scribe Zhang',
            intro: [
                "I found it. The entrance that shouldn't exist. Beneath the Seventh Shelf of Forgotten Tales.",
                "The founding sect masters hid something here—knowledge so dangerous they buried it literally.",
                "The guardians still function after three centuries. Be careful, young one. Knowledge can kill."
            ],
            progress: ["The archive runs deep. Ancient wards protect each level. Persevere."],
            complete: [
                "These records... they speak of the FIRST sealing of the Void Emperor. By our own founders.",
                "The traitor isn't just trying to unseal him—they're trying to finish what our founders started!",
                "This changes everything. Elder Xuanming must see this immediately."
            ]
        },
        zone: '0,1'
    },
    
    {
        id: 'side_shadow_001',
        name: 'Lessons from the Dark',
        type: 'side',
        description: 'Shadow Elder Moyin offers to teach you the basics of shadow cultivation—not to corrupt you, but to help you understand your enemy. Knowledge is power, even when it comes from unexpected sources.',
        shortDesc: 'Learn shadow techniques from Elder Moyin',
        levelRequired: 18,
        prerequisites: ['main_007'],
        objectives: [
            { id: 'obj_1', type: 'talk', description: 'Accept Elder Moyin\'s offer at the Inner Tomb Chambers', target: 'shadow_elder_moyin', required: 1, current: 0 },
            { id: 'obj_2', type: 'kill', description: 'Practice shadow strikes on Shadow Assassins', target: 24, required: 10, current: 0 },
            { id: 'obj_3', type: 'special', description: 'Meditate in the Shadow Pool for 30 seconds', target: 'shadow_meditation', required: 1, current: 0 },
            { id: 'obj_4', type: 'talk', description: 'Demonstrate your understanding to Elder Moyin', target: 'shadow_elder_moyin', required: 1, current: 0 }
        ],
        rewards: {
            exp: 15000,
            spiritStones: 2000,
            items: [{ itemId: 'SW_T3_004', quantity: 1 }],
            title: 'Shadow Walker'
        },
        dialogue: {
            npcId: 'shadow_elder_moyin',
            npcName: 'Elder Moyin',
            intro: [
                "You seek to fight the void, yet you don't understand it. Ignorance will be your death.",
                "I offer you a lesson—not in darkness, but in understanding. Light cannot exist without shadow.",
                "Complete my training, and you will see the truth: the void is not evil. It simply... IS."
            ],
            progress: ["Feel the shadows around you. They are not your enemy. They are simply another path."],
            complete: [
                "Interesting... you adapted quickly. Most Azure Cloud disciples reject shadow arts instinctively.",
                "Remember this lesson: the Void Emperor was not evil. He was corrupted. There is a difference.",
                "Now you understand your enemy better. Use this knowledge wisely, young cultivator."
            ]
        },
        zone: '-4,1'
    },
    
    {
        id: 'side_hermit_001',
        name: 'The Mad Sage\'s Wisdom',
        type: 'side',
        description: 'Hermit Zhang, the eccentric sage who lives in the Black Water Swamp, claims to have visions of the future. Most dismiss him as mad, but his prophecies have proven true before. Perhaps there\'s method in his madness.',
        shortDesc: 'Seek wisdom from Hermit Zhang',
        levelRequired: 6,
        objectives: [
            { id: 'obj_1', type: 'explore', description: 'Navigate to Hermit Zhang\'s hut in the Swamp (-1,-4)', target: '-1,-4', required: 1, current: 0 },
            { id: 'obj_2', type: 'talk', description: 'Listen to the Hermit\'s prophecy', target: 'hermit_zhang', required: 1, current: 0 },
            { id: 'obj_3', type: 'collect', description: 'Bring him 3 Swamp Lotuses (he\'s hungry)', target: 'swamp_lotus', required: 3, current: 0 },
            { id: 'obj_4', type: 'kill', description: 'Defeat the swamp creatures disturbing his meditation', target: 14, required: 5, current: 0 }
        ],
        rewards: {
            exp: 2500,
            spiritStones: 400,
            items: [{ itemId: 'CONS_QI_001', quantity: 10 }]
        },
        dialogue: {
            npcId: 'hermit_zhang',
            npcName: 'Hermit Zhang',
            intro: [
                "Ah, I knew you were coming. The shadows told me. Or was that the fish? Hard to tell sometimes.",
                "You seek wisdom! Everyone seeks wisdom! But wisdom costs! Three Swamp Lotuses! ...I'm hungry.",
                "Also, kill some spiders. They keep interrupting my prophecies. Very rude, those spiders."
            ],
            progress: ["Lotuses? Spiders? PROPHECY AWAITS! ...After lunch."],
            complete: [
                "AH! I see now! I SEE! You are the one who will face the Void! Or... the Void will face you? Same thing, really.",
                "Listen: 'When fire turns black and loyalty dies, the sealed one stirs beneath moonless skies.'",
                "Remember my words, young one. Also, these lotuses are delicious. Thanks."
            ]
        },
        zone: '-1,-4'
    }
];

// ============================================
// TRIAL QUESTS - Time Limited Challenges
// High risk, high reward. Complete before time runs out!
// ============================================

export const trialQuests: Quest[] = [
    // === TRIAL 1: Speed Slaughter (Level 5+) ===
    {
        id: 'trial_001',
        name: 'Speed Slaughter: Forest Beasts',
        type: 'trial',
        description: 'The Martial Hall challenges you to defeat 10 forest beasts within 5 minutes. Show your combat prowess!',
        shortDesc: 'Defeat 10 beasts in 5 minutes',
        levelRequired: 5,
        timeLimit: 5, // 5 minutes
        objectives: [
            { id: 'obj_1', type: 'kill', description: 'Defeat Forest Beasts', target: 'forest_beast', required: 10, current: 0 }
        ],
        rewards: {
            exp: 500,
            spiritStones: 300,
            reputation: { azure_cloud: 50 }
        },
        dialogue: {
            npcId: 'elder_qingfeng',
            npcName: 'Elder Qingfeng',
            intro: [
                "Ready to prove yourself? This trial tests raw combat speed!",
                "Defeat 10 forest beasts within 5 minutes. No excuses, no rest.",
                "The timer starts NOW!"
            ],
            progress: [
                "Keep fighting! The clock is ticking!",
                "Don't slow down! Victory demands speed!"
            ],
            complete: [
                "Excellent! You've proven your worth as a true fighter!",
                "Here's your reward. Train harder for the next trial."
            ]
        },
        zone: '1,0'
    },

    // === TRIAL 2: Endurance Challenge (Level 10+) ===
    {
        id: 'trial_002',
        name: 'Endurance Trial: Cave Horrors',
        type: 'trial',
        description: 'Survive against the cave creatures! Defeat 20 enemies without dying within 10 minutes.',
        shortDesc: 'Defeat 20 enemies in 10 minutes, no deaths',
        levelRequired: 10,
        timeLimit: 10, // 10 minutes
        objectives: [
            { id: 'obj_1', type: 'kill', description: 'Defeat Cave Enemies', target: 'cave_creature', required: 20, current: 0 },
            { id: 'obj_2', type: 'special', description: 'Survive (no deaths)', target: 'no_death', required: 1, current: 1 }
        ],
        rewards: {
            exp: 1000,
            spiritStones: 600,
            items: [{ itemId: 'CONS_HP_001', quantity: 10 }],
            reputation: { azure_cloud: 100 }
        },
        dialogue: {
            npcId: 'elder_qingfeng',
            npcName: 'Elder Qingfeng',
            intro: [
                "This trial tests your endurance and survival instincts.",
                "Enter the caves and defeat 20 creatures. If you die, the trial fails.",
                "You have 10 minutes. Begin!"
            ],
            progress: [
                "Stay alive! That's the key!",
                "Use potions wisely. Your life matters more than time."
            ],
            complete: [
                "Outstanding! Not a scratch on you! Well... mostly.",
                "True cultivators know when to fight and when to heal."
            ]
        },
        zone: '2,0'
    },

    // === TRIAL 3: Boss Rush (Level 15+) ===
    {
        id: 'trial_003',
        name: 'Trial of Valor: Elite Slayer',
        type: 'trial',
        description: 'Challenge the elite enemies! Defeat 3 elite-class foes within 8 minutes to prove your strength.',
        shortDesc: 'Defeat 3 elite enemies in 8 minutes',
        levelRequired: 15,
        timeLimit: 8, // 8 minutes
        objectives: [
            { id: 'obj_1', type: 'kill', description: 'Defeat Elite Enemies', target: 'elite', required: 3, current: 0 }
        ],
        rewards: {
            exp: 2000,
            spiritStones: 1000,
            items: [{ itemId: 'SW_T2_001', quantity: 1 }],
            reputation: { azure_cloud: 200 },
            title: 'Elite Slayer'
        },
        dialogue: {
            npcId: 'elder_xuanming',
            npcName: 'Elder Xuanming',
            intro: [
                "The Trial of Valor is not for the faint-hearted.",
                "Seek out and defeat three elite-class enemies within 8 minutes.",
                "Return victorious, and you shall earn the title of Elite Slayer."
            ],
            progress: [
                "The elites won't fall easily. Use all your techniques!",
                "Remember your training. Every strike must count."
            ],
            complete: [
                "You have surpassed my expectations, young one!",
                "From this day forth, you are known as Elite Slayer!"
            ]
        },
        zone: '0,0'
    },

    // === TRIAL 4: Collection Rush (Level 8+) ===
    {
        id: 'trial_004',
        name: 'Harvest Trial: Herb Rush',
        type: 'trial',
        description: 'Alchemist Mei needs herbs urgently! Collect 10 Spirit Herbs from monsters within 6 minutes.',
        shortDesc: 'Collect 10 Spirit Herbs in 6 minutes',
        levelRequired: 8,
        timeLimit: 6, // 6 minutes
        objectives: [
            { id: 'obj_1', type: 'collect', description: 'Collect Spirit Herbs', target: 'herb', required: 10, current: 0 }
        ],
        rewards: {
            exp: 600,
            spiritStones: 400,
            items: [{ itemId: 'CONS_HP_001', quantity: 5 }, { itemId: 'CONS_QI_001', quantity: 5 }]
        },
        dialogue: {
            npcId: 'alchemist_mei',
            npcName: 'Alchemist Mei',
            intro: [
                "EMERGENCY! My pill furnace is about to explode without Spirit Herbs!",
                "Quick! Kill monsters that drop herbs! You have 6 minutes!",
                "Go go go! The furnace waits for no one!"
            ],
            progress: [
                "Faster! The furnace is rumbling!",
                "Almost there! Keep collecting!"
            ],
            complete: [
                "*throws herbs into furnace* PHEW! Just in time!",
                "You saved my pavilion! Take these pills as thanks!"
            ]
        },
        zone: '-1,0'
    },

    // === TRIAL 5: Zone Blitz (Level 12+) ===
    {
        id: 'trial_005',
        name: 'Zone Blitz: Multi-Area Hunt',
        type: 'trial',
        description: 'Travel to 3 different zones and defeat enemies in each within 12 minutes!',
        shortDesc: 'Hunt in 3 zones within 12 minutes',
        levelRequired: 12,
        timeLimit: 12, // 12 minutes
        objectives: [
            { id: 'obj_1', type: 'kill', description: 'Defeat enemies in Training Grounds (1,0)', target: 'training_mob', required: 5, current: 0 },
            { id: 'obj_2', type: 'kill', description: 'Defeat enemies in Mystic Forest (0,1)', target: 'forest_mob', required: 5, current: 0 },
            { id: 'obj_3', type: 'kill', description: 'Defeat enemies in Shadow Cave (2,0)', target: 'cave_mob', required: 5, current: 0 }
        ],
        rewards: {
            exp: 1500,
            spiritStones: 800,
            reputation: { azure_cloud: 150 }
        },
        dialogue: {
            npcId: 'scout_liang',
            npcName: 'Scout Liang',
            intro: [
                "Think you're fast? This trial tests both combat AND travel speed!",
                "Visit three zones and clear enemies in each. The clock starts now!",
                "Move swiftly, cultivator!"
            ],
            progress: [
                "Keep moving! Time waits for no one!",
                "Use the world map for quick travel!"
            ],
            complete: [
                "Incredible speed! You covered so much ground!",
                "You'd make a fine scout. Here's your reward!"
            ]
        },
        zone: '0,0'
    },

    // ============================================
    // BREAKTHROUGH TRIALS - Major Realm Advancement
    // These are the ONLY source for breakthrough pills
    // ============================================

    // === TRIAL OF FOUNDATION (Level 9 → Foundation Establishment) ===
    {
        id: 'trial_breakthrough_foundation',
        name: 'Trial of Foundation: The Crucible',
        type: 'trial',
        description: 'You have reached the peak of Qi Condensation. To break through to Foundation Establishment, you must prove your worth in the Crucible of Ascension. Defeat the guardians that bar your path and claim the Foundation Pill - the key to your next realm. This is the most dangerous challenge you have faced. Prepare well, cultivator.',
        shortDesc: 'Prove your worth to breakthrough to Foundation',
        levelRequired: 9,
        levelRecommended: 9,
        timeLimit: 15, // 15 minutes - generous but adds pressure
        objectives: [
            { id: 'obj_1', type: 'kill', description: 'Defeat Forest Guardian (Elite Boss)', target: 19, required: 1, current: 0 },
            { id: 'obj_2', type: 'kill', description: 'Defeat Frost Wolf (Elite Hunter)', target: 20, required: 1, current: 0 },
            { id: 'obj_3', type: 'kill', description: 'Defeat Crystal Golem (Elite Tank)', target: 18, required: 1, current: 0 },
            { id: 'obj_4', type: 'special', description: 'Complete without dying (auto-tracked)', target: 'no_death', required: 1, current: 1 }
        ],
        rewards: {
            exp: 5000,
            spiritStones: 1500,
            items: [{ itemId: 'CONS_FOUNDATION_PILL', quantity: 1 }],
            reputation: { azure_cloud: 500 },
            title: 'Foundation Seeker'
        },
        dialogue: {
            npcId: 'elder_xuanming',
            npcName: 'Elder Xuanming',
            intro: [
                "You stand at the threshold of a new realm, disciple.",
                "The Trial of Foundation is not merely a test of strength—it is a crucible that separates those who will ascend from those who will stagnate.",
                "Enter the trial grounds and defeat the three guardians: the Forest Guardian, the Frost Wolf, and the Crystal Golem.",
                "You must defeat all three without falling in battle. Only then will you prove worthy of the Foundation Pill.",
                "This is your moment. Seize it."
            ],
            progress: [
                "The guardians await. Each one tests a different aspect of your cultivation.",
                "Remember: fall even once, and you must begin anew. The path to Foundation allows no weakness."
            ],
            complete: [
                "You have done it! The guardians have fallen, and you stand unbroken!",
                "Take this Foundation Pill, forged in the ancient furnaces of our ancestors.",
                "When you are ready, consume it to shatter your current limits and establish your Foundation.",
                "This is not an ending, disciple—it is a beginning. Greater trials await beyond."
            ]
        },
        zone: '1,0' // Martial Training Grounds
    },

    // === TRIAL OF GOLDEN CORE (Level 19 → Golden Core) ===
    {
        id: 'trial_breakthrough_golden',
        name: 'Trial of Golden Core: The Tribulation',
        type: 'trial',
        description: 'You have perfected your Foundation. Now you must face the Tribulation of Golden Core—the most devastating trial known to cultivators. Face the lords of shadow and soul, and emerge victorious to claim the Golden Pill. Many have tried. Few have succeeded. Fewer still have survived.',
        shortDesc: 'Survive the Tribulation to ascend to Golden Core',
        levelRequired: 19,
        levelRecommended: 19,
        timeLimit: 20, // 20 minutes - intense battle
        objectives: [
            { id: 'obj_1', type: 'kill', description: 'Defeat the Shadow Lord (Legendary Boss)', target: 35, required: 1, current: 0 },
            { id: 'obj_2', type: 'kill', description: 'Defeat the Soul Reaver (Legendary Boss)', target: 36, required: 1, current: 0 },
            { id: 'obj_3', type: 'kill', description: 'Defeat Divine Beasts guarding the sanctum', target: 34, required: 2, current: 0 },
            { id: 'obj_4', type: 'kill', description: 'Defeat Lightning Elementals', target: 33, required: 3, current: 0 },
            { id: 'obj_5', type: 'special', description: 'Endure the Tribulation (no deaths)', target: 'no_death', required: 1, current: 1 }
        ],
        rewards: {
            exp: 20000,
            spiritStones: 5000,
            items: [{ itemId: 'CONS_GOLDEN_PILL', quantity: 1 }],
            reputation: { azure_cloud: 1000 },
            title: 'Golden Aspirant'
        },
        dialogue: {
            npcId: 'elder_xuanming',
            npcName: 'Elder Xuanming',
            intro: [
                "You have come far, disciple. Farther than most ever dream.",
                "The Trial of Golden Core is not a battle—it is a tribulation. The heavens themselves will test your resolve.",
                "You must face the Shadow Lord and the Soul Reaver—beings that have ended the journeys of countless Foundation cultivators.",
                "The Divine Beasts guard the path, and Lightning Elementals herald the tribulation's fury.",
                "Fail, and your cultivation may be crippled forever. Succeed, and you will join the ranks of Golden Core masters.",
                "I have taught you all I can. The rest... is up to you."
            ],
            progress: [
                "The tribulation rages on. Do not falter!",
                "Each enemy you defeat brings you closer to transcendence. Each death risks everything.",
                "The heavens are watching. Show them your determination!"
            ],
            complete: [
                "By the ancestors... you have done the impossible!",
                "The Shadow Lord and Soul Reaver lie defeated. The tribulation has acknowledged your worth!",
                "Take this Golden Pill. It contains the crystallized essence of a thousand years of cultivation wisdom.",
                "When you consume it, your Foundation will condense into a Golden Core of pure power.",
                "You are no longer merely a disciple. You are a master. Go forth, and shake the heavens!"
            ]
        },
        zone: '-5,0' // Tomb Inner Sanctum - most challenging area
    }
];

// ============================================
// EXPORT ALL QUESTS
// ============================================

export const allQuests: Quest[] = [
    ...mainQuests,
    ...dailyQuests,
    ...bountyQuests,
    ...sideQuests,
    ...trialQuests
];

export function getQuestById(id: string): Quest | undefined {
    return allQuests.find(q => q.id === id);
}

export function getQuestsByType(type: Quest['type']): Quest[] {
    return allQuests.filter(q => q.type === type);
}

export function getQuestsByZone(zone: string): Quest[] {
    return allQuests.filter(q => q.zone === zone);
}

export function getNPCsByZone(zone: string): NPC[] {
    return Object.values(npcs).filter(npc => npc.zone === zone);
}

export function getNPCById(id: string): NPC | undefined {
    return npcs[id];
}

export function getQuestsForNPC(npcId: string): Quest[] {
    const npc = npcs[npcId];
    if (!npc?.quests) return [];
    return npc.quests.map(qId => getQuestById(qId)).filter((q): q is Quest => q !== undefined);
}
