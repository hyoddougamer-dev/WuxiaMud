import { test } from 'node:test'
import assert from 'node:assert/strict'
import { newPlayer } from '../src/core/state.ts'
import { apply } from '../src/core/actions.ts'
import { ascend, canAscend, lineageBonus, ANCESTOR_BONUS_CAP, generationOf, OFF_PATH_BONUS, ASCEND_REALM } from '../src/core/ancestry.ts'
import { modifiers, equip, learn } from '../src/core/progress.ts'
import { technique, schoolClash } from '../src/core/techniques.ts'

const T0 = 1_700_000_000_000
const top = (over = {}) => ({
  ...newPlayer('sword', T0, { name: 'Lin Ke', seal: '林' }),
  realm: ASCEND_REALM, learned: ['frost', 'wind'], ...over,
})

test('a life can only be sealed at the top, and only with something to leave', () => {
  assert.equal(canAscend({ ...top(), realm: 6 }), false)
  assert.equal(canAscend({ ...top(), learned: [] }), false)
  assert.equal(canAscend(top()), true)
})

test('ascending records a forebear and does not edit the cultivator', () => {
  const s = top()
  const out = ascend(s, [], 'Nine Winters Palm', 'frost', T0, 'a1')!
  assert.equal(out.ancestor.name, 'Lin Ke')
  assert.equal(out.ancestor.seal, '林')
  assert.equal(out.ancestor.artName, 'Nine Winters Palm')
  assert.equal(out.line.length, 1)
  assert.equal(s.realm, ASCEND_REALM, 'the state itself is untouched')
})

test('you cannot seal an art you never learned', () => {
  assert.equal(ascend(top(), [], 'Borrowed', 'thunder', T0, 'a1'), null)
})

test('an empty art name falls back to the technique rather than sealing nothing', () => {
  const out = ascend(top(), [], '   ', 'frost', T0, 'a1')!
  assert.equal(out.ancestor.artName, technique('frost')!.name)
})

test('the line warms the ground, and stops at the cap', () => {
  assert.equal(lineageBonus([]), 0)
  const many = Array.from({ length: 40 }, (_, i) => ({ id: String(i) })) as never
  assert.equal(lineageBonus(many), ANCESTOR_BONUS_CAP)
  assert.equal(generationOf([]), 1)
})

test('an inherited art costs no upkeep', () => {
  const plain = { ...newPlayer('sword', T0) }
  const heir = {
    ...newPlayer('sword', T0),
    inherited: { techniqueId: 'frost', from: 'Yuwen Bai', fromPath: 'sword' as const, artName: 'X' },
  }
  assert.equal(modifiers(heir).upkeep, modifiers(plain).upkeep, 'the ancestor carries it')
  assert.ok(modifiers(heir).rate > modifiers(plain).rate, 'and it still does something')
})

test('an art inherited across paths is worth more', () => {
  const same = {
    ...newPlayer('sword', T0),
    inherited: { techniqueId: 'frost', from: 'A', fromPath: 'sword' as const, artName: 'X' },
  }
  const cross = { ...same, inherited: { ...same.inherited!, fromPath: 'blade' as const } }
  const gain = modifiers(cross).rate - modifiers(same).rate
  assert.ok(Math.abs(gain - technique('frost')!.value * OFF_PATH_BONUS) < 1e-9)
})

test('the ascend action reports the forebear and refuses when it should', () => {
  const ok = apply(top(), { type: 'ascend', artName: 'Palm', techniqueId: 'frost' }, T0, 0, 6, [], () => 'id1')
  assert.equal(ok.applied, true)
  assert.equal(ok.event.ascended?.artName, 'Palm')

  const early = apply({ ...top(), realm: 3 }, { type: 'ascend', artName: 'x', techniqueId: 'frost' }, T0, 0, 6)
  assert.equal(early.applied, false)
  assert.equal(early.event.ascended, undefined)
})

test('two arts of the same school refuse to sit together', () => {
  let s = { ...newPlayer('sword', T0), insight: 999, realm: 7 }
  for (const id of ['frost', 'bone', 'wind']) s = learn(s, id)
  s = equip(s, 'frost', 6)
  s = equip(s, 'bone', 6)       // also 'ice'
  assert.deepEqual(s.equipped, ['frost'], 'the second ice art is refused')
  s = equip(s, 'wind', 6)       // 'cloud'
  assert.deepEqual(s.equipped, ['frost', 'wind'])
  assert.equal(schoolClash(['frost'], technique('bone')!)?.id, 'frost')
  assert.equal(schoolClash(['frost'], technique('wind')!), undefined)
})
