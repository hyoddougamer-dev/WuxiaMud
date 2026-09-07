/**
 * 势 — the resource. Movement fills it, skills spend it.
 *
 * WHAT IT WAS. A hidden bank that charged while running, turning or surrounded,
 * and discharged on the rising edge of standing still, multiplying whatever art
 * happened to be firing. It was the most interesting idea in the game and it
 * was drawn nowhere, spent by nobody's decision, and explained by nothing. A
 * player could not have told you it existed.
 *
 * WHAT IT IS. Four points under the health bar. Moving fills them. Firing a
 * skill spends one to three. That is the shape every ARPG in the reference set
 * uses for mana, rage or energy — and the first thing any of their players
 * learns — with one difference that is this game's own: the resource comes from
 * MOVING, not from waiting. Standing still is the posture that pays your damage
 * off, and it is also the posture that stops paying for it. That tension is the
 * whole combat loop, and now it is a bar you can watch.
 *
 * WHY A POOL OF FOUR AND NOT A METER. Points are countable at a glance on a
 * phone, and a skill costing "2" against a bar of "63%" is a sum nobody does
 * mid-fight. Four is enough for a two-skill opener and short enough that it
 * empties, which is what makes filling it a thing you do on purpose.
 */

/** Points in the pool. Countable at a glance; see the file's note. */
export const MAX_SHI = 4

/**
 * Points per second at full speed.
 *
 * 0.62 fills the pool in about six and a half seconds of running, which is
 * roughly two crossings of a phone screen — long enough that a full pool is
 * something you set up, short enough that the loop turns over several times a
 * minute. Standing still earns nothing at all: the resource is movement.
 */
const FILL_PER_SECOND = 0.62

/**
 * What a hard turn is worth, as a fraction of a second's fill.
 *
 * Paid as an instant, not a rate, because a turn is a moment rather than a
 * posture — and because rewarding it per second rewarded wiggling, which is
 * neither wuxia nor fun to watch.
 */
const TURN_BONUS = 0.35

export interface Shi {
  /** 0..`max`, fractional. The HUD floors it; spending needs whole points. */
  value: number
  /**
   * The ceiling, which the Wheel can raise. MAX_SHI plus whatever 渊 adds.
   *
   * Carried on the pool rather than read from a constant, because the HUD has
   * to draw exactly this many pips: a pool of five drawn as four is a point the
   * player earned, banked and cannot see.
   */
  max: number
  /** Whole points available to spend right now. */
  readonly ready: number
}

export function createShi(max = MAX_SHI): Shi {
  return {
    value: 0,
    max: Math.max(1, Math.round(max)),
    get ready() {
      return Math.floor(this.value)
    },
  }
}

export interface ShiInput {
  /** How fast the swordsman is actually going, as a fraction of their top speed. */
  pace: number
  /** True on the frame a hard reversal is detected. See sim/conditions. */
  turned: boolean
  /** Multiplier on the fill rate. 1 with an empty Wheel. */
  fill?: number
  /**
   * Fraction of the running rate earned while STANDING STILL.
   *
   * Zero unless the 定心 keystone is held, and that keystone is the whole
   * reason this parameter exists: it inverts the loop the resource is built on,
   * which is a thing a keystone should be able to do and a stat should not.
   */
  stillFill?: number
  /** Extra 势 on a reversal, beyond TURN_BONUS. */
  turnGain?: number
}

/**
 * Advances the pool. Returns nothing: `shi.value` is the whole state.
 *
 * The still-fill floor is applied to the PACE, not added afterwards, so a
 * swordsman drifting at a third of top speed with 定心 held earns the better of
 * the two rather than both. Adding them would make a slow walk the best way to
 * fill, which is neither of the two postures the game is asking about.
 */
export function updateShi(shi: Shi, input: ShiInput, dt: number): void {
  const pace = Math.max(input.stillFill ?? 0, Math.max(0, Math.min(1, input.pace)))
  shi.value = Math.min(shi.max, shi.value + FILL_PER_SECOND * (input.fill ?? 1) * pace * dt)
  if (input.turned) {
    shi.value = Math.min(shi.max, shi.value + TURN_BONUS + (input.turnGain ?? 0))
  }
}

/** Puts `amount` back, never above the ceiling. Used by the 回身 refund. */
export function refundShi(shi: Shi, amount: number): void {
  shi.value = Math.min(shi.max, shi.value + Math.max(0, amount))
}

/**
 * Spends `cost` if the pool holds it. Returns whether it did.
 *
 * All-or-nothing on purpose: a skill that fires at half strength because you
 * were a point short is a skill whose tile lies about what it does, and the
 * whole point of this rewrite is that the tile does not lie.
 */
export function spendShi(shi: Shi, cost: number): boolean {
  if (shi.ready < cost) return false
  shi.value -= cost
  return true
}
