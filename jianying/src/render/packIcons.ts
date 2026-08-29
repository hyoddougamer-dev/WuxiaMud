/**
 * The pack's icon for each effect, as data the game and the sheets both read.
 *
 * game-icons.net, CC BY 3.0, carried as `@iconify-json/game-icons` — 4134
 * single-colour SVG silhouettes on a 512 grid, which is the same rendering
 * model as everything else here, so they tint per state and scale like the
 * geometry does.
 *
 * ATTRIBUTION IS NOT OPTIONAL. If these ship, the title screen carries
 * "Icons by game-icons.net, CC BY 3.0". That is the whole price.
 *
 * WHY THIS FILE EXISTS rather than a list inside the contact sheet: the same
 * rule the rest of this project runs on. A name chosen in the sheet and a name
 * chosen in the HUD are two lists that will disagree, and the day they disagree
 * nobody will notice, because both will render something.
 *
 * HOW THE NAMES WERE CHOSEN, and how the first attempt went wrong. The first
 * pass searched the set by the effect's own word and took the top hit, which is
 * a method that fails in a specific way: "range" returns `path-distance`, two
 * map pins joined by a dotted route — a picture of travelling somewhere, not of
 * reaching further. "rate" returns `speedometer`, a picture of the WORD speed.
 * Six of the sixteen were like that. Every name below was instead chosen by
 * laying eight candidates side by side at tile size and asking what a player
 * with a busy thumb would read in half a second.
 */
import type { EffectKind } from '../data/arts'

/** The credit line. Show it wherever these icons are shipped. */
export const PACK_CREDIT = 'Icons by game-icons.net, CC BY 3.0'

/**
 * One icon name per effect.
 *
 * Two constraints beyond "does it look like the effect", both learned from the
 * geometry glyphs and both still true for a pack:
 *   - no two may share a silhouette class at tile size, which is why `arc` is a
 *     crescent and `nova` is concentric rings rather than both being curves;
 *   - the register has to hold, which is why `magnet` is a vortex rather than a
 *     horseshoe magnet — a modern lab prop in a wuxia ink game reads as an
 *     accident.
 */
export const PACK_ICON: Record<EffectKind, string> = {
  // --- levers the simulation already has ---
  /** A plain heavy blade. Weight, with nothing else in the frame. */
  damage: 'broadsword',
  /** Three claw marks. Repetition, and no weapon attached to confuse it. */
  rate: 'triple-scratches',
  /**
   * A drawn bow.
   *
   * The weakest of the sixteen and worth saying so: the pack has no icon for
   * EXTENT. Everything that means "far" in it means "a ranged weapon", and this
   * is a melee sweep getting longer. A bow at least says distance instantly,
   * which the dotted map route it replaces did not say at all.
   */
  range: 'bow-arrow',
  /** A clean crescent. This icon owns the curve; nothing else may take one. */
  arc: 'crescent-blade',
  /** A winged foot. Older register than the running man beside it in the set. */
  speed: 'wingfoot',
  /** A spiral drawing inward. `magnet` itself is a horseshoe — wrong century. */
  magnet: 'vortex',
  /** A ring with bodies carried on it. */
  orbit: 'star-satellites',
  /** Arrows leaving, in a spread. */
  bolt: 'striking-arrows',
  /** Concentric rings. Found in the arc search, and the best nova in the set. */
  nova: 'concentric-crescents',
  /** A plain solid heart: capacity, not mending. `heal` takes the flask. */
  maxHp: 'hearts',

  // --- new simulation work ---
  /** A barbed spearhead. Sharp and single, where `bolt` is three and leaving. */
  pierce: 'barbed-spear',
  /** A burst radiating from one point. Impact, going nowhere. */
  crit: 'laser-burst',
  /** A mark repeating and trailing off. Named for exactly this. */
  echo: 'echo-ripples',
  /** Someone putting their shoulder into a wall. Unambiguous at any size. */
  push: 'push',
  /** A plain shield. The only filled symmetrical body in the set of sixteen. */
  guard: 'shield',
  /** A flask — a 丹 in this world. Distinct from the plain heart of maxHp. */
  heal: 'health-potion',
}

/** Icons for the equipment slots, where "draw the thing" is the right answer. */
export const PACK_SLOT_ICON: Record<string, string> = {
  head: 'asian-lantern',
  shoulders: 'shoulder-armor',
  robe: 'robe',
  weapon: 'katana',
  belt: 'belt',
  bracers: 'bracers',
  boots: 'leather-boot',
  charm: 'gem-pendant',
}
