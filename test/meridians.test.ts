import { test } from 'node:test'
import assert from 'node:assert/strict'
import { newPlayer, type PlayerState } from '../src/core/state.ts'
import { MERIDIANS, courseOf, meridian, unlocked } from '../src/core/meridians.ts'
import { modifiers, openMeridian, ratePerSecond } from '../src/core/progress.ts'
import { odds } from '../src/core/tribulation.ts'
import { inheritedMeridians, INHERITED_MERIDIAN_SHARE, type Ancestor } from '../src/core/ancestry.ts'
import { count } from '../src/core/materials.ts'
import { V1_CEILING } from '../src/core/realms.ts'

const T0 = 1_700_000_000_000

/** A cultivator rich enough that only the rules under test can refuse anything. */
function flush(over: Partial<PlayerState> = {}): PlayerState {
  return {
    ...newPlayer('sword', T0),
    realm: 9, insight: 100_000, qi: 1e12,
    satchel: { hide: 999, core: 999, essence: 999 },
    ...over,
  }
}

test('a meridian costs insight and materials, and cannot be bought twice', () => {
  const s = flush()
  const m = meridian('lung')!
  const after = openMeridian(s, 'lung')
  assert.deepEqual(after.meridians, ['lung'])
  assert.equal(after.insight, s.insight - m.insight)
  assert.equal(count(after.satchel, 'hide'), count(s.satchel, 'hide') - (m.mats.hide ?? 0))
  assert.equal(openMeridian(after, 'lung'), after, 'buying it again must be a no-op')
})

test('a course opens in order, and the three courses do not gate each other', () => {
  const s = flush()
  assert.equal(openMeridian(s, 'sintest'), s, 'the fourth hand meridian needs the third')

  // Opening the whole hand course must never unlock a foot or extraordinary step.
  let hand = s
  for (const m of courseOf('hand')) hand = openMeridian(hand, m.id)
  assert.equal(hand.meridians.length, 4)
  assert.equal(openMeridian(hand, 'spleen'), hand, 'foot step two still needs foot step one')
  assert.equal(openMeridian(hand, 'du'), hand, 'the Governing Vessel still needs the Conception')
})

test('realm and purse are both real gates', () => {
  const early = flush({ realm: 1 })
  assert.equal(openMeridian(early, 'lung'), early, 'the Lung Channel opens at realm 2')

  const broke = flush({ insight: 0 })
  assert.equal(openMeridian(broke, 'lung'), broke, 'insight is not optional')

  const empty = flush({ satchel: {} })
  assert.equal(openMeridian(empty, 'lung'), empty, 'nor are the materials')
})

test('cheapest-first is always a legal opening order', () => {
  // The line grants meridians by price, so if price order could ever skip a step the
  // inheritance would hand out something the rules say is unreachable.
  const open: string[] = []
  for (const m of [...MERIDIANS].sort((a, b) => a.insight - b.insight)) {
    assert.ok(unlocked(open, m), `${m.id} would be granted before its predecessor`)
    open.push(m.id)
  }
})

test('every meridian effect reaches the numbers it claims to', () => {
  const s = flush()
  const base = modifiers(s)
  const all = MERIDIANS.reduce((x, m) => openMeridian(x, m.id), s)
  const m = modifiers(all)

  assert.ok(m.rate > base.rate, 'generation')
  assert.ok(m.insight > base.insight, 'insight')
  assert.ok(m.breakthrough < base.breakthrough, 'breakthrough cost')
  assert.ok(m.offlineCapHours > base.offlineCapHours, 'offline cap')
  assert.ok(m.turmoilRate < base.turmoilRate, 'turmoil')
  assert.ok(m.settleDrain > base.settleDrain, 'settling')
  assert.ok(m.huntSpeed < base.huntSpeed, 'hunt charges')
  assert.ok(m.odds > base.odds, 'tribulation odds')
  assert.ok(ratePerSecond(all, T0) > ratePerSecond(s, T0))
})

test('the extraordinary vessels show up in the tribulation as their own line', () => {
  const s = flush({ realm: 6, qi: 1e12, turmoil: 0 })
  const before = odds(s)
  const after = odds(openMeridian(s, 'ren'))
  assert.equal(before.vessel, 0)
  assert.ok(after.vessel > 0)
  assert.ok(after.total > before.total, 'and it must actually move the total')
})

test('the line hands down a third of the best set of meridians ever opened', () => {
  const forebear = (n: number): Ancestor => ({
    id: 'a', name: 'Yuwen Bai', seal: '玄', path: 'sword', realm: V1_CEILING,
    generation: 1, techniqueId: 'frost', artName: 'Nine Winters Palm',
    meridians: n, ascendedAt: T0,
  })
  assert.deepEqual(inheritedMeridians([]), [])
  assert.equal(inheritedMeridians([forebear(2)]).length, 0, 'two is not yet worth a channel')
  assert.equal(inheritedMeridians([forebear(12)]).length, Math.floor(12 / INHERITED_MERIDIAN_SHARE))

  // Whatever is granted must itself be a legal state, or a second-generation player
  // starts holding a meridian the rules would never have sold them.
  const granted = inheritedMeridians([forebear(12)])
  const open: string[] = []
  for (const id of granted) {
    assert.ok(unlocked(open, meridian(id)!), `${id} was granted out of order`)
    open.push(id)
  }
})

test('an old save without meridians still runs', () => {
  // `meridians` and `gates` arrived in save version 5; the readers must not assume them.
  const s = flush()
  assert.equal(modifiers({ ...s, meridians: [] }).rate, modifiers(s).rate)
  assert.equal(openMeridian({ ...s, meridians: ['nonesuch'] }, 'lung').meridians.length, 2)
})
