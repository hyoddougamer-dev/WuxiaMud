/**
 * User-facing text.
 *
 * English is the product's default language. Everything the player can read
 * lives here rather than being scattered through the code, so adding a second
 * language later is a matter of swapping this object — not hunting for string
 * literals across the renderer, the HUD and the error handler.
 *
 * A naming decision worth recording, because it was the source of real
 * confusion: the game has two things that used to both be called "level". One
 * is spent within a single expedition and buys a technique; the other is
 * permanent and buys an attribute point. They are now INSIGHT and LEVEL/REALM
 * respectively, and the words never cross. Two different meanings behind one
 * word on one screen is exactly the kind of thing that makes a game feel
 * incomprehensible for reasons a player cannot name.
 */
export const strings = {
  /** Shown until the player first touches the screen, and again if they idle. */
  moveHint: 'drag anywhere to move',
  /** Title on the fatal-error screen. */
  fatalTitle: 'Jiànyǐng failed to start',

  // --- end of expedition ---------------------------------------------
  runOver: 'Your road ends here',
  survived: 'Survived',
  felled: 'Felled',
  felledBy: 'Felled by',
  again: 'Walk it again',
  toHub: 'Return',

  // --- in-run progression --------------------------------------------
  /** The temporary, per-expedition track. */
  insight: 'Insight',
  chooseTechnique: 'Choose a technique',
  newTechnique: 'New',

  // --- the persistent character ---------------------------------------
  cultivation: 'Cultivation',
  level: 'Level',
  realm: 'Realm',
  attributes: 'Attributes',
  pointsToSpend: 'points to spend',
  onePointToSpend: 'point to spend',
  spend: '+',
  road: 'Road',
  depth: 'Depth',
  setOut: 'Set out',
  reward: 'reward',

  // --- the reward screen ----------------------------------------------
  cultivationGained: 'Cultivation gained',
  fromKills: 'Foes felled',
  fromTime: 'Time endured',
  fromInsight: 'Insight reached',
  fromDepth: 'Depth bonus',
  total: 'Total',
  levelReached: 'Level',
  realmAdvanced: 'Realm advanced',
  roadOpened: 'A deeper road opens',

  // --- lifetime totals -------------------------------------------------
  expeditions: 'Expeditions',
  longest: 'Longest',
  lifetimeKills: 'Foes felled',

  // --- banners ---------------------------------------------------------
  bossApproaches: 'approaches',
  insightReached: 'Insight',
} as const

export type StringKey = keyof typeof strings
