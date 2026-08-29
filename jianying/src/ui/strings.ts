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
  chooseTechnique: 'Choose a technique',
  insight: 'Insight',
  newTechnique: 'New',

  // --- the persistent character ---------------------------------------
  cultivation: 'Cultivation',
  level: 'Level',
  realm: 'Realm',
  attributes: 'Attributes',
  /** Shown where a slot has nothing in it — the question that sends you out. */
  slotEmpty: 'Nothing found for this yet.',
  pointsToSpend: 'points to spend',
  onePointToSpend: 'point to spend',
  spend: '+',
  theWorld: 'The world',
  road: 'Road',
  depth: 'Depth',
  opensAtRealm: 'Opens at Realm',
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

  // --- title -----------------------------------------------------------
  /** The whole game in two lines. It is the first thing anyone reads. */
  pitch:
    'A swordsman walks the roads of a falling empire. Every road ends in death — ' +
    'and every death raises the sword that walks the next one.',
  beginRun: 'Begin',
  continueRun: 'Continue',

  // --- character creation ----------------------------------------------
  createTitle: 'Take up the sword',
  /** Says outright that nothing here can be got wrong. It cannot. */
  createSub: 'Every weapon can be found on the road. This is where you begin, not what you are.',
  yourName: 'Name',
  rollName: 'Another name',
  yourSchool: 'Where you trained',
  yourBearing: 'Your bearing',
  /**
   * Says outright which choices survive. Armour is the rest of the appearance
   * by design, so a player who picked a robe here would watch it vanish on the
   * first drop — better to be told than to find out by losing something.
   */
  bearingNote: 'What you wear is found on the road and will change. These are yours, and no drop takes them back.',
  bearingRow: 'You are',
  pigmentLabel: 'Dye',
  buildLabel: 'Build',
  sashLabel: 'Sash',
  brushLabel: 'Brush',
  anotherHand: 'Another hand',
  takeUpTheSword: 'Begin the road',
  back: 'Back',

  // --- starting over ------------------------------------------------------
  newSwordsman: 'New swordsman',
  roster: 'YOUR SWORDSMEN',
  rosterFull: 'No room for another. Give one up to make a new one.',
  giveUp: 'Give up this swordsman',
  discardTitle: 'Give up this swordsman?',
  discardBody: 'This swordsman is lost for good — level, attributes and everything found.',
  discardConfirm: 'Begin anew',
  keep: 'Keep',

  // --- equipment ---------------------------------------------------------
  equipment: 'Equipment',
  found: 'Found',
  alreadyYours: 'already yours',
  raised: 'sharpened',

  // --- codex -------------------------------------------------------------
  codexTitle: 'The way of it',
  understood: 'Understood',
  openCodex: 'What is this?',
} as const

export type StringKey = keyof typeof strings
