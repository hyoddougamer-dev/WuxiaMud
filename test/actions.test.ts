import { test } from 'node:test'
import assert from 'node:assert/strict'
import { apply, needsRoll, type Action } from '../src/core/actions.ts'
import { newPlayer } from '../src/core/state.ts'
import { realm } from '../src/core/realms.ts'
import { slotsAt } from '../src/core/techniques.ts'

const T0 = 1_700_000_000_000
const run = (s = newPlayer('sword', T0), a: Action, roll = 0.5) =>
  apply(s, a, T0, roll, slotsAt(s.realm))

test('every action is data, so the same one can be re-run anywhere', () => {
  const s = { ...newPlayer('sword', T0), insight: 50 }
  const a: Action = { type: 'learn', id: 'frost' }
  const first = apply(s, a, T0, 0, 6).state
  const second = apply(s, JSON.parse(JSON.stringify(a)), T0, 0, 6).state
  assert.deepEqual(first, second, 'a serialised action must produce the identical state')
})

test('a refused action reports itself refused rather than silently doing nothing', () => {
  const poor = run(newPlayer('sword', T0), { type: 'learn', id: 'frost' })
  assert.equal(poor.applied, false)
  assert.equal(poor.state, newPlayer('sword', T0).learned === poor.state.learned ? poor.state : poor.state)
  assert.deepEqual(poor.state.learned, [])
})

test('only tribulation and hunting consume randomness', () => {
  assert.equal(needsRoll({ type: 'attempt' }), true)
  assert.equal(needsRoll({ type: 'hunt' }), true)
  for (const t of ['settle', 'equip', 'brew', 'open'] as const) {
    assert.equal(needsRoll({ type: t, id: 'x' } as Action), false)
  }
})

test('the roll decides the tribulation, and the caller supplies it', () => {
  const ready = { ...newPlayer('sword', T0), realm: 4, gates: [4], qi: realm(4).cost * 2 }
  const lucky = apply(ready, { type: 'attempt' }, T0, 0.01, 6)
  const unlucky = apply(ready, { type: 'attempt' }, T0, 0.999, 6)
  assert.equal(lucky.event.tribulation?.succeeded, true)
  assert.equal(unlucky.event.tribulation?.succeeded, false)
  assert.equal(lucky.state.realm, 5)
  assert.equal(unlucky.state.realm, 4)
})

test('actions carry their one-off event separately from the state', () => {
  const rich = { ...newPlayer('sword', T0), qi: 5000 }
  const out = apply(rich, { type: 'hunt' }, T0, 0.2, 6)
  assert.ok(out.event.spoils, 'the hunt must report what was taken')
  assert.equal(out.event.spoils!.state, out.state)
})

test('picking the flame you already hold is a no-op, not a toggle', () => {
  const s = { ...newPlayer('sword', T0), flame: 'bonechill' }
  assert.equal(apply(s, { type: 'flame', id: 'bonechill' }, T0, 0, 6).applied, false)
  assert.equal(apply(s, { type: 'flame', id: null }, T0, 0, 6).state.flame, null)
})

test('opening a session is an action like any other, so the server can own it', () => {
  const s = newPlayer('blade', T0)
  const out = apply(s, { type: 'open' }, T0 + 9_999, 0, 6)
  assert.equal(out.state.lastOpenedAt, T0 + 9_999)
})
