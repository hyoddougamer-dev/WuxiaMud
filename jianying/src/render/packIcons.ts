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
import { PACK_ICON_DATA, PACK_VIEWBOX } from './packIconData'

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

/**
 * Icons for the five conditions — and the rule that produced them.
 *
 * A SEAL MAY NEVER BE THE ONLY THING CARRYING A MECHANIC. The strip used to put
 * 静 on a tile and nothing else, which asks a player who reads no Chinese to
 * learn that "静" means "stop moving" by dying a few times. The seals are the
 * game's identity and they stay — beside the name, on the scroll, in the hub —
 * but wherever a mark tells the player what to DO, it has to be a picture of
 * doing it.
 *
 * Picked by laying every candidate out at 40px AND at 16px, which is the size
 * the strip actually draws. Half the shortlist turned to mush at 16 and was
 * dropped for that alone (running-ninja, surrounded-shield, bleeding-heart).
 */
export const PACK_CONDITION_ICON: Record<string, string> = {
  /** A seated figure. Squat and symmetric — the opposite silhouette to `run`. */
  still: 'meditation',
  /** A running figure. Leaning and asymmetric, unmistakable at 16px. */
  running: 'run',
  /**
   * A hooked arrow doubling back. Chosen over the rotation icons, which read as
   * "spin" — the condition is reversing, not turning on the spot.
   */
  turn: 'return-arrow',
  /** A ring of marks around a centre. It draws the mechanic literally. */
  surrounded: 'encirclement',
  /** A split heart. The only heart on a live tile, so nothing collides. */
  peril: 'broken-heart',
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

/**
 * A pack icon per WEAPON style, so a weapon card shows the weapon.
 *
 * The equipment tab was a column of text cards with a single icon at the top of
 * each slot heading — reported from a device as "no icons". A slot icon alone
 * cannot help, because every card under one heading shares it; what a player
 * scanning for their sabre needs is the card itself to look like a sabre. The
 * six styles map onto six shapes already in the bundle, so this costs no new
 * icon data.
 */
export const PACK_WEAPON_ICON: Record<string, string> = {
  jian: 'katana',
  dao: 'crescent-blade',
  great: 'broadsword',
  twin: 'triple-scratches',
  spear: 'barbed-spear',
  fan: 'concentric-crescents',
}

/**
 * One pack icon as a complete `<svg>` string, sized by the CSS around it.
 *
 * The bodies use `currentColor`, so a single `color` on the wrapper tints the
 * whole thing — which is what lets one copy of the geometry serve a lit tile, a
 * dim tile, a hub card and a printed sheet. `glyphSvg` in artGlyph.ts has the
 * same shape on purpose: a caller can swap which icon set it draws from without
 * knowing anything else about either.
 */
export function packIconSvg(
  name: string,
  colour: number,
  opacity = 1,
  className = 'pack-icon',
): string {
  const icon = PACK_ICON_DATA[name]
  // An unknown name means someone edited a name without re-running the
  // extractor. Returning empty keeps the UI alive; the test is what catches it.
  if (!icon) return ''
  const [left, top, width, height] = icon.box ?? PACK_VIEWBOX
  return (
    `<svg class="${className}" viewBox="${left} ${top} ${width} ${height}" ` +
    `xmlns="http://www.w3.org/2000/svg" aria-hidden="true" ` +
    `color="#${colour.toString(16).padStart(6, '0')}" opacity="${opacity}">${icon.body}</svg>`
  )
}

/** The icon for an effect, ready to drop into the DOM. */
export const effectIconSvg = (
  effect: EffectKind,
  colour: number,
  opacity = 1,
  className = 'pack-icon',
): string => packIconSvg(PACK_ICON[effect], colour, opacity, className)

/** The icon for a condition — a picture of what the player has to do. */
export const conditionIconSvg = (
  condition: string,
  colour: number,
  opacity = 1,
  className = 'pack-icon',
): string => packIconSvg(PACK_CONDITION_ICON[condition] ?? '', colour, opacity, className)

/**
 * The icon for one item: its weapon's shape, or failing that its slot's.
 *
 * A single place to ask, so the equipment tab, a reward screen and anything
 * later cannot disagree about what a given item looks like.
 */
export const itemIconSvg = (
  slot: string,
  styleId: string,
  colour: number,
  opacity = 1,
  className = 'pack-icon',
): string =>
  packIconSvg(
    (slot === 'weapon' ? PACK_WEAPON_ICON[styleId] : PACK_SLOT_ICON[slot]) ?? '',
    colour,
    opacity,
    className,
  )
