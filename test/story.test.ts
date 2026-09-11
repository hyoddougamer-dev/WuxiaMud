import { test } from 'node:test'
import assert from 'node:assert/strict'
import { newPlayer } from '../src/core/state.ts'
import { ORIGINS } from '../src/core/origins.ts'
import { PATH_LIST } from '../src/core/paths.ts'
import { SEALS } from '../src/core/names.ts'
import { firstMorning, whatNeverLeaves, whereThisEnds, SEAL_VOW, PATH_RHYTHM } from '../src/core/story.ts'
import { breakthroughCost } from '../src/core/progress.ts'
import { huntCharges } from '../src/core/hunt.ts'
import { count } from '../src/core/materials.ts'

const T0 = 1_700_000_000_000

test('every seal and every path has its own line, and none is a placeholder', () => {
  for (const s of SEALS) {
    assert.ok(SEAL_VOW[s], `${s} has no vow`)
    assert.ok(SEAL_VOW[s].length > 15, `${s}'s vow is too thin to be worth reading`)
  }
  assert.equal(new Set(Object.values(SEAL_VOW)).size, SEALS.length, 'no two seals share a line')
  for (const p of PATH_LIST) assert.ok(PATH_RHYTHM[p.id].length > 40, `${p.id} needs a rhythm`)
})

test('the first morning reports the state, not the origin blurb', () => {
  // This is the whole reason the text is built from a PlayerState: the confirmation
  // screen used to recite origin.kit, which is prose that can drift from the code.
  for (const o of ORIGINS) {
    const s = newPlayer('sword', T0, { origin: o.id, seal: '道', name: 'Sim' })
    const rows = firstMorning(s, T0)
    const say = (k: string) => rows.find((r) => r.k === k)?.v

    assert.ok(say('First breakthrough')?.includes(String(breakthroughCost(s))),
      `${o.id} must be told the cost its own origin actually pays`)
    assert.equal(say('Hunts held')?.startsWith(String(huntCharges(s, T0))), true)

    if (count(s.satchel, 'hide') > 0) {
      assert.ok(say('Satchel')?.includes('Beast Hide'), `${o.id} carries hides and must be told`)
    } else {
      assert.equal(say('Satchel'), undefined, `${o.id} carries nothing, so there is no satchel line`)
    }
    if (s.turmoil > 0) assert.ok(say('Heart demon'), 'a loud heart on the first morning must be stated')
    if (s.learned.length) assert.ok(say('Already known'), 'a known art must be stated')
  }
})

test('what never leaves names the origin trait and the path, always', () => {
  for (const o of ORIGINS) {
    for (const p of PATH_LIST) {
      const s = newPlayer(p.id, T0, { origin: o.id })
      const rows = whatNeverLeaves(s)
      assert.ok(rows.some((r) => r.k === p.name), `${p.id} must appear`)
      assert.ok(rows.length >= 2)
      assert.equal(rows.filter((r) => r.keeps).length >= 2, true)
    }
  }
})

test('a second-generation cultivator is told what the line gave them', () => {
  const s = newPlayer('blade', T0, {
    origin: 'rogue', generation: 2, lineBonus: 0.04, meridians: ['lung'],
    inherited: { techniqueId: 'frost', from: 'Yuwen Bai', fromPath: 'sword', artName: 'Nine Winters Palm' },
  })
  const keeps = whatNeverLeaves(s)
  assert.ok(keeps.some((r) => r.v.includes('4%')), 'the line bonus is stated as a number')
  assert.ok(keeps.some((r) => r.v.includes('Nine Winters Palm')), 'the carried art is named')
  assert.ok(firstMorning(s, T0).some((r) => r.k === 'Meridians open'),
    'inherited meridians must show up on the first morning, not as a surprise later')
})

test('where this ends names the seal, its meaning and the ninth realm', () => {
  const s = newPlayer('sword', T0, { seal: '天' })
  const text = whereThisEnds(s)
  assert.ok(text.includes('天'))
  assert.ok(text.includes('heaven'))
  assert.ok(text.includes('Tribulation'), 'the top of the ladder is named')
  assert.ok(text.includes(SEAL_VOW['天']))
})
