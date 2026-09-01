/**
 * The loot ladder, as behaviour rather than as a table.
 *
 * The system this replaces had a `rarity: 0 | 1 | 2` that only ever weighted a
 * drop table — never coloured anything, never changed what a piece rolled — and
 * one fixed stat per item, so a second Hemp Robe was worth nothing. These tests
 * pin the properties that make the replacement a loot game instead of a table
 * of gear: that the ladder has a bottom, that depth tilts it without closing
 * any rung, that two copies of one base genuinely differ, and that rarity and
 * depth stay independent axes.
 */
import { describe, expect, it } from 'vitest'
import { Rng } from '../src/core/rng'
import {
  AFFIX_SPECS,
  AFFIX_BY_KIND,
  NAMED_POWERS,
  affixLine,
  affixWeight,
  isPercent,
  rollAffixes,
  rollAmount,
  rollPower,
  type Affix,
} from '../src/data/affixes'
import {
  MAX_RARITY,
  RARITIES,
  hasNamedPower,
  rarityOdds,
  rarityOf,
  rarityStyle,
  rollRarity,
  type Rarity,
} from '../src/data/rarity'

/** Rolls many tiers at a depth and counts each. */
function tierCounts(depth: number, rolls = 20000): number[] {
  const rng = new Rng(90210)
  const counts = new Array(RARITIES.length).fill(0) as number[]
  for (let i = 0; i < rolls; i++) counts[rollRarity(depth, rng.next())]!++
  return counts
}

describe('the rarity ladder', () => {
  it('runs six rungs, each rarer than the one below', () => {
    expect(RARITIES).toHaveLength(6)
    for (let i = 1; i < RARITIES.length; i++) {
      expect(RARITIES[i]!.weight).toBeLessThan(RARITIES[i - 1]!.weight)
    }
  })

  it('never rolls more lines on a lower rung than on a higher one', () => {
    for (let i = 1; i < RARITIES.length; i++) {
      expect(RARITIES[i]!.affixes).toBeGreaterThanOrEqual(RARITIES[i - 1]!.affixes)
    }
  })

  it('keeps the packed colour and the CSS colour saying the same thing', () => {
    // They are written twice — once for the renderer, once for the DOM — and
    // the day they disagree the ground label and the bag tile show different
    // colours for one piece, which is the one thing this ladder must never do.
    for (const tier of RARITIES) {
      expect(tier.css.toLowerCase()).toBe(`#${tier.colour.toString(16).padStart(6, '0')}`)
    }
  })

  it('makes the shallowest ground mostly common', () => {
    // The ladder has to have a bottom for its top to mean anything. A player
    // who sees purple in their first ten minutes has been robbed of the moment.
    const counts = tierCounts(1)
    const total = counts.reduce((a, b) => a + b, 0)
    expect(counts[0]! / total).toBeGreaterThan(0.55)
    expect((counts[4]! + counts[5]!) / total).toBeLessThan(0.02)
  })

  it('tilts toward the good rungs as the ground gets deeper', () => {
    const shallow = tierCounts(1)
    const deep = tierCounts(5)
    const shallowTotal = shallow.reduce((a, b) => a + b, 0)
    const deepTotal = deep.reduce((a, b) => a + b, 0)
    expect(deep[0]! / deepTotal).toBeLessThan(shallow[0]! / shallowTotal)
    expect(deep[3]! / deepTotal).toBeGreaterThan(shallow[3]! / shallowTotal)
  })

  it('leaves every rung reachable on the easiest road', () => {
    // Deliberate: the shallow road can still, rarely, hand over something
    // extraordinary. A tier that is literally impossible below depth N turns
    // four of the five regions into a queue rather than a choice.
    const counts = tierCounts(1, 400000)
    for (const tier of RARITIES) expect(counts[tier.id]!).toBeGreaterThan(0)
  })

  it('reserves a named power for the top two rungs only', () => {
    expect(hasNamedPower(0)).toBe(false)
    expect(hasNamedPower(3)).toBe(false)
    expect(hasNamedPower(4)).toBe(true)
    expect(hasNamedPower(MAX_RARITY)).toBe(true)
  })

  it('quotes odds that match what it actually rolls', () => {
    // The odds a player is shown and the odds the game rolls come from one
    // place on purpose: the first version of the sheet quoted hand-typed
    // numbers beside a table that had since been retuned.
    const odds = rarityOdds(3)
    expect(odds.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6)
    const counts = tierCounts(3, 60000)
    const total = counts.reduce((a, b) => a + b, 0)
    for (const tier of RARITIES) {
      expect(counts[tier.id]! / total).toBeCloseTo(odds[tier.id]!, 1)
    }
  })
})

describe('the lines a piece rolls', () => {
  it('rolls exactly as many lines as the tier promises', () => {
    const rng = new Rng(4242)
    for (const tier of RARITIES) {
      expect(rollAffixes(tier.id, 3, rng)).toHaveLength(tier.affixes)
    }
  })

  it('never rolls the same kind twice on one piece', () => {
    // Two "+3 Body" rows read as a bug, and a player cannot tell them from a
    // single "+6 Body" that would have been simpler to print.
    const rng = new Rng(31337)
    for (let i = 0; i < 400; i++) {
      const affixes = rollAffixes(3, 4, rng)
      const kinds = affixes.map((a) => a.kind)
      expect(new Set(kinds).size).toBe(kinds.length)
    }
  })

  it('makes two copies of one base genuinely different', () => {
    // The whole point. Under the old model a Hemp Robe was +2 Body forever, so
    // the second one was worth nothing and there was nothing to compare.
    const rng = new Rng(1618)
    const a = rollAffixes(2, 3, rng)
    const b = rollAffixes(2, 3, rng)
    const show = (xs: Affix[]): string => xs.map(affixLine).join(', ')
    expect(show(a)).not.toBe(show(b))
  })

  it('grows a line with depth without letting luck cross a rung', () => {
    // The relationship the ladder rests on: a lucky roll is worth comparing
    // against an unlucky one of the same tier, but never beats a tier above.
    const worst = rollAmount('body', 5, 0)
    const best = rollAmount('body', 5, 1)
    expect(best).toBeGreaterThan(worst)
    expect(best).toBeLessThan(worst * 2)
    expect(rollAmount('body', 5, 0.5)).toBeGreaterThan(rollAmount('body', 1, 0.5))
  })

  it('never rolls a line worth nothing', () => {
    for (const spec of AFFIX_SPECS) {
      for (const depth of [1, 3, 5, 8]) {
        expect(rollAmount(spec.kind, depth, 0)).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('reads a percent line as a percent and a flat line as a number', () => {
    expect(affixLine({ kind: 'body', amount: 5 })).toBe('+5 Body')
    expect(affixLine({ kind: 'reach', amount: 8 })).toBe('+8% sweep reach')
    expect(isPercent('reach')).toBe(true)
    expect(isPercent('body')).toBe(false)
  })

  it('keeps the sweep-shape lines scarcer than the attributes', () => {
    // Reach and haste multiply everything rather than adding to it, so at equal
    // frequency they would be the only lines anyone read.
    const attr = AFFIX_BY_KIND.get('body')!.weight
    expect(AFFIX_BY_KIND.get('reach')!.weight).toBeLessThan(attr)
    expect(AFFIX_BY_KIND.get('haste')!.weight).toBeLessThan(attr)
  })

  it('makes every rung stronger than the one below it, all the way up', () => {
    // The bug this exists to catch, which the first version of these tests
    // missed: 神 and 仙 roll the same FOUR lines as 宝, so before tiers carried
    // a potency the top three rungs were separated only by the named power —
    // and a sampled 宝 came out plainly stronger than the 神 beside it. Testing
    // only that "a high tier beats a low tier" hid it; the ladder has to be
    // monotone at every single step.
    const rng = new Rng(8675309)
    const mean = (rarity: Rarity): number => {
      let total = 0
      for (let i = 0; i < 1500; i++) total += affixWeight(rollAffixes(rarity, 3, rng))
      return total / 1500
    }
    const means = RARITIES.map((tier) => mean(tier.id))
    for (let i = 1; i < means.length; i++) {
      expect(means[i]!, RARITIES[i]!.name).toBeGreaterThan(means[i - 1]!)
    }
  })

  it('rolls a bigger line on a better rung, at the same depth', () => {
    // The other half of the same repair, at the level of a single line rather
    // than a whole piece.
    expect(rollAmount('body', 3, 0.5, rarityOf(5).potency)).toBeGreaterThan(
      rollAmount('body', 3, 0.5, rarityOf(0).potency),
    )
  })

  it('keeps the top two rungs rare but reachable within a sitting', () => {
    // Set from how often a player would SEE one, not from how rare the word
    // sounds. The first pass put a divine at one piece in forty-five runs — a
    // colour most players would never meet. At roughly three drops an
    // expedition these land near one in a dozen runs, and the rarest near one
    // in seventy, which is a chase rather than a rumour.
    const odds = rarityOdds(3)
    expect(odds[4]!).toBeGreaterThan(0.01)
    expect(odds[4]!).toBeLessThan(0.05)
    expect(odds[5]!).toBeGreaterThan(0.002)
    expect(odds[5]!).toBeLessThan(0.015)
  })
})

describe('named powers', () => {
  it('gives none to a piece below divine', () => {
    expect(rollPower(0, 'weapon', 0.5)).toBeNull()
    expect(rollPower(3, 'weapon', 0.5)).toBeNull()
  })

  it('only ever rolls a power that suits the slot it is worn on', () => {
    for (let i = 0; i <= 20; i++) {
      const id = rollPower(4, 'weapon', i / 20)
      expect(id).not.toBeNull()
      expect(NAMED_POWERS.find((p) => p.id === id)!.slot).toBe('weapon')
    }
  })

  it('rolls nothing rather than something ill-fitting for a slot with no power', () => {
    // A slot with no power in the table rolls a divine piece with four strong
    // lines, which is a fine thing to find. Inventing a power to fill the gap
    // is how a table ends up full of names with nothing under them.
    expect(rollPower(4, 'boots', 0.5)).toBeNull()
  })

  it('describes every power as a rule it changes, not a number', () => {
    // A legendary that granted "+18 Edge" would be a rare with a better colour.
    for (const power of NAMED_POWERS) {
      expect(power.blurb.length).toBeGreaterThan(20)
      expect(power.blurb).not.toMatch(/^\+\d/)
    }
  })

  it('names every power uniquely', () => {
    const ids = NAMED_POWERS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('keeps every rarity tier addressable by id', () => {
    for (const tier of RARITIES) expect(rarityOf(tier.id).seal).toBe(tier.seal)
  })
})

describe('how loudly a card is drawn', () => {
  /**
   * The ladder a playtest asked for: "as bordas deviam ter mais impacto
   * consoante o grau". Hue alone was doing the whole job, so 凡 and 仙 were the
   * same 3px edge in different colours — six shades, not six steps. These pin
   * the shape of the replacement, because a ladder tuned by eye in a stylesheet
   * is a ladder that goes non-monotone the first time someone adjusts one row.
   */
  it('rises on every channel, at every step', () => {
    for (let i = 1; i < RARITIES.length; i++) {
      const lower = RARITIES[i - 1]!.card
      const upper = RARITIES[i]!.card
      expect(upper.edge, `edge ${i}`).toBeGreaterThan(lower.edge)
      expect(upper.wash, `wash ${i}`).toBeGreaterThanOrEqual(lower.wash)
      expect(upper.glow, `glow ${i}`).toBeGreaterThanOrEqual(lower.glow)
      expect(upper.weight, `weight ${i}`).toBeGreaterThanOrEqual(lower.weight)
    }
  })

  it('leaves the common rung a real border and nothing else', () => {
    // A common piece is a new player's first upgrade, so it must stay
    // FINDABLE — but it must not glow, or the loud rungs stop being loud.
    const common = RARITIES[0]!.card
    expect(common.edge).toBeGreaterThan(0)
    expect(common.wash).toBe(0)
    expect(common.glow).toBe(0)
  })

  it('keeps the glow for the top three, so most of what drops stays quiet', () => {
    // 宝 and above is roughly one drop in twenty at depth one. If the glow
    // started lower it would be on most cards, which is the same as nowhere.
    const glowing = RARITIES.filter((t) => t.card.glow > 0).map((t) => t.id)
    expect(glowing).toEqual([3, 4, 5])
  })

  it('hands every channel to the DOM in one string, so no surface gets half', () => {
    const style = rarityStyle(rarityOf(5))
    for (const key of ['--rung:', '--rung-rgb:', '--rung-edge:', '--rung-wash:', '--rung-glow:', '--rung-weight:']) {
      expect(style, key).toContain(key)
    }
    // The rgb triple has to match the packed colour, or the wash and the
    // border would be two different reds.
    expect(style).toContain('--rung-rgb:193,39,45')
    expect(style).toContain('--rung:#c1272d')
  })
})
