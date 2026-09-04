/**
 * Twenty points, four places to put them: is there a choice?
 *
 * Every other balance test here asks about a system — the rift, the arts, a
 * weapon. This one asks the question underneath all of them, and it exists
 * because a spot check found the answer was no: on the Broken Cliff, Body took
 * the gate in 142 seconds and every other sheet died at about 45, which is the
 * same 45 a character who spent NOTHING dies at.
 *
 * The bar is deliberately low. It does not ask the four to be equal — a build
 * system where every stat is worth the same is a build system with one stat
 * wearing four hats. It asks only that a point spent is a point that DOES
 * something, and that no single attribute is the answer to every question.
 *
 * ONE REGION, TWO WEAPONS, FOUR SEEDS, and the region is the Post Road because
 * that is the ground a player actually stands on. Measuring builds on the
 * deepest region measures the difficulty curve instead, which is a real problem
 * and a different one — see the note on the Cliff below.
 */
import { describe, expect, it } from 'vitest'
import { WEAPONS } from '../src/data/weapons'
import { emptyAttributes, type AttributeId } from '../src/meta/character'
import { deriveStats, emptyKit, type Stats } from '../src/sim/loadout'
import { play, pure, spread, BUDGET } from '../tools/attrValue.mts'

const ATTRS: AttributeId[] = ['body', 'edge', 'swift', 'spirit']

describe('what each attribute is wired to', () => {
  // Read straight off `deriveStats`, because a run-level test cannot see a
  // change this fine: removing the movement wiring below leaves the Post Road
  // numbers inside the noise, and a guard that cannot see the thing it guards
  // is not a guard.
  const sheet = (id: AttributeId, n: number) => ({ ...emptyAttributes(), [id]: n })
  const at = (id: AttributeId, n: number) =>
    deriveStats(new Map(), { ...emptyKit(), spent: sheet(id, n) })

  it('makes Swiftness actually swift', () => {
    // It is called Swiftness and for a long time it did not move you at all —
    // `moveSpeed` answered only to the `fleet` card. In a game where the crowd
    // comes to you, moving is the primary defence, so that left Body as the
    // only attribute that could keep anybody alive.
    expect(at('swift', 20).moveSpeed).toBeGreaterThan(at('swift', 0).moveSpeed)
    // And it still speeds the sweep, which is the half it always did.
    expect(at('swift', 20).slashInterval).toBeLessThan(at('swift', 0).slashInterval)
  })

  it('keeps the other three out of the legs', () => {
    // One currency, one job each. Movement comes from the Speed pool alone, so
    // a player reading "Swiftness" knows where their feet come from.
    for (const id of ['body', 'edge', 'spirit'] as AttributeId[]) {
      expect(at(id, 20).moveSpeed, id).toBe(at(id, 0).moveSpeed)
    }
  })

  it('gives every attribute at least one stat it moves', () => {
    // The floor under everything below: an attribute that changes no number at
    // all is not weak, it is broken.
    const reads = [
      (s: Stats) => s.maxHp,
      (s: Stats) => s.armour,
      (s: Stats) => s.slashDamage,
      (s: Stats) => s.slashInterval,
      (s: Stats) => s.moveSpeed,
      (s: Stats) => s.artScale,
    ]
    for (const id of ATTRS) {
      const none = at(id, 0)
      const lots = at(id, 20)
      expect(reads.some((r) => r(lots) !== r(none)), id).toBe(true)
    }
  })
})

describe('twenty points', () => {
  it('buys something in three of the four, and records the one it does not', () => {
    // 锋 WAS THE HEADLINE HERE AND IS NOT ANY MORE. It changed nothing at all —
    // 154 seconds and 631 kills on the Post Road with no points, the same 154
    // and 631 with twenty — because everything common dies to one blow and the
    // player has damage to spare. Power now lengthens the sweep as well as
    // weighting it, which puts the surplus somewhere the player can use, and
    // both weapons left this list. See slashRange in sim/loadout.ts for the two
    // channels that were tried before reach and measured worse.
    //
    // 神 ON THE THROWER IS WHAT IS LEFT, and I did not predict it. Spirit does
    // reach the arts now — at grade 3 with a full bank, eighteen points take a
    // burst from 154 damage to 260, which is pinned in momentum.spec.ts — but
    // on the Post Road with the daggers that does not move the run by 5%. The
    // stat is wired; what it buys there is not yet enough to matter. Recorded
    // rather than smoothed over, because the difference between "wired" and
    // "worth buying" is exactly what I got wrong about it once already.
    //
    // Left failing-shaped on purpose: when these are given a job, the list
    // shrinks and the test tightens by itself.
    const inert: string[] = []
    for (const weapon of WEAPONS) {
      const none = play(emptyAttributes(), weapon.id, 'road')
      for (const id of ATTRS) {
        const spent = play(pure(id, BUDGET), weapon.id, 'road')
        const moved =
          Math.abs(spent.secs - none.secs) / Math.max(1, none.secs) > 0.05 ||
          Math.abs(spent.kills - none.kills) / Math.max(1, none.kills) > 0.05
        if (!moved) inert.push(`${weapon.id}:${id}`)
      }
    }
    // Exactly this one. Anything joining it turns the test red, and anything
    // leaving it does too — which is how a recorded defect tightens by itself
    // rather than waiting for somebody to remember to loosen it.
    expect(inert.sort()).toEqual(['feidao:spirit'])
  }, 120000)

  it('never makes one attribute the answer to everything', () => {
    // The failure this guards is a stat so far ahead that the other three are
    // decoration. Three times the next best is not a build system, it is one
    // build with three traps beside it.
    for (const weapon of WEAPONS) {
      const rows = ATTRS.map((id) => play(pure(id, BUDGET), weapon.id, 'road').secs)
      rows.push(play(spread(BUDGET), weapon.id, 'road').secs)
      const gap = Math.max(...rows) / Math.max(1, Math.min(...rows))
      expect(gap, `${weapon.name}: best sheet over worst`).toBeLessThan(1.6)
    }
  }, 120000)

  it('leaves the mixed sheet competitive, not last', () => {
    // A spread build losing to every pure one means the game is telling players
    // that thinking about a build is a mistake.
    for (const weapon of WEAPONS) {
      const mixed = play(spread(BUDGET), weapon.id, 'road').secs
      const pures = ATTRS.map((id) => play(pure(id, BUDGET), weapon.id, 'road').secs)
      expect(mixed, `${weapon.name}: spread against the best pure sheet`).toBeGreaterThan(
        Math.max(...pures) * 0.85,
      )
    }
  }, 120000)
})
