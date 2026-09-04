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
  /**
   * The stamp that ends creation.
   *
   * A SEAL and not a button, because that is what finishes a Chinese painting:
   * the work is done when the artist presses their 印 into it. "Take up the
   * sword" was a good line and still is — it is what the seal reads underneath.
   */
  sealName: 'Seal this swordsman',
  sealHint: 'press the seal',
  /** The dodge button's accessible name. */
  dodgeLabel: 'Dodge',
  momentumLoop: 'Running and turning build momentum. Standing still or being ringed in spends all of it at once, in a single burst.',
  desperateRule: 'Below a third of your health, every art fires one grade higher.',
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

  // --- the persistent character ---------------------------------------
  cultivation: 'Cultivation',
  level: 'Level',
  realm: 'Realm',
  attributes: 'Attributes',
  /** Shown where a slot has nothing in it — the question that sends you out. */
  /**
   * On the empty slot card in the paperdoll, under the slot's own name. Short
   * because the card is 97px wide — the sentence it replaces wrapped to four
   * lines there, and the slot name above it already says what is missing.
   */
  slotEmpty: 'Empty',
  /** Heading for the five things a player can DO to wake an art. */
  conditions: 'What wakes them',
  /**
   * The 法 tab's one line of instruction.
   *
   * States the rule outright, because the whole point of routing the arts
   * through the gear is that the player can PREDICT them. Ranking five arts
   * while the blade in hand wakes two is a real decision, and it is only a
   * decision if the pane says which two.
   */
  artsNote:
    'Tap to rank an art. The blade in your hand decides how many wake, ' +
    'from the top of this list down; everything you wear decides their grade.',
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

  // --- the rift's gate ---------------------------------------------------
  /** Shown once the floor's boss falls — see RunState.gateCleared. */
  gateClearedTitle: 'Gate cleared',
  gateClearedBody: 'Everything found up to here is already yours.',
  bankChoice: 'Leave with it',
  bankNote: 'Return to the hub. Nothing is risked.',
  pushChoice: 'Push deeper',
  pushNote: 'Harder ground — and what you find there is not yours until the next gate.',
  tier: 'Tier',

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
  /** Shown when a find had nowhere to go. See BAG_CAPACITY in meta/inventory. */
  packWasFull: 'No room in your pack',
  /**
   * The button at the foot of the comparison sheet. It says what pressing it
   * will DO — not what the piece is. It read "tap again to wear" while the
   * sheet was a hint and the cell was the button; it is a real button now, and
   * copy that describes a gesture nobody makes any more is worse than none.
   */
  takeOff: 'Take it off',
  wearThis: 'Wear this',
  noChange: 'Changes nothing you can feel',
  /** Heading over the pack count. See BAG_CAPACITY in meta/inventory. */
  pack: 'Pack',
  /** Shown only after a death — never after banking. See settleFound. */
  lostToDeath: 'Lost with you',
  wasNotBanked: 'not banked',

  // --- 器蕴, the arts as read off the gear --------------------------------
  /** Banner on a level-up. 内力 is flat power, never an art. See applyMight. */
  mightGained: 'Inner force deepens',
  /** Headings on the 法 tab, which now reads the gear rather than a ladder. */
  artsAwake: 'awake',
  artsGrade: 'grade',
  artsAsleep: 'a better blade wakes this one next',
  artsFromGear: 'The blade in your hand decides how many wake. Everything you wear decides their grade.',

  // --- codex -------------------------------------------------------------
  codexTitle: 'The way of it',
  understood: 'Understood',
  openCodex: 'What is this?',
} as const

export type StringKey = keyof typeof strings
