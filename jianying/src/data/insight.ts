/**
 * 悟 Insight — the level curve inside a single expedition.
 *
 * This is all that survives of data/techniques.ts. The file it came from
 * existed to feed a level-up screen that offered three cards, and that screen
 * is gone: a run no longer grows by drawing modifiers out of a pool, it grows
 * because you brought skills into it and they cost 势 to fire (see
 * data/skills.ts). What a level still does is raise two flat numbers, and this
 * curve is what says when.
 */

/** XP needed to go from `level` to the next one. */
export function xpForLevel(level: number): number {
  // Gentle curve: early levels arrive fast so the player learns that killing
  // leads to growing, then it stretches so later ones feel earned.
  return Math.round(5 + level * 3.2 + level * level * 0.55)
}
