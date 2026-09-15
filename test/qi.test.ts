import test from 'node:test'
import assert from 'node:assert/strict'
import { breath, field, intensity, moteAt, moteCount, RISE_MS } from '../src/core/qi.ts'

const T0 = 1_700_000_000_000

test('a mote is a function of time, not of state', () => {
  // The same index at the same instant is the same mote, called twice or called a
  // thousand calls apart. This is what lets a sleeping tab wake up correct.
  const a = moteAt(7, T0)
  const b = moteAt(7, T0)
  assert.deepEqual(a, b)
  assert.notDeepEqual(moteAt(7, T0), moteAt(8, T0))
})

test('motes stay inside the field', () => {
  for (let t = 0; t < RISE_MS * 3; t += 137) {
    for (const m of field(70, T0 + t)) {
      assert.ok(m.y >= 0 && m.y <= 1, `y ${m.y} out of the field`)
      assert.ok(m.x > -0.2 && m.x < 1.2, `x ${m.x} escaped sideways`)
      assert.ok(m.a >= 0 && m.a <= 1, `alpha ${m.a} out of range`)
      assert.ok(m.r > 0, 'a mote with no radius is not a mote')
    }
  }
})

test('a mote fades in off the floor and out before the ceiling', () => {
  // Popping in at full opacity is the tell that a particle field is cheap.
  let sawFloor = false, sawCeiling = false
  for (let t = 0; t < RISE_MS; t += 23) {
    for (const m of field(40, T0 + t)) {
      if (m.y < 0.05) { assert.ok(m.a < 0.2, `opaque at the floor: ${m.a}`); sawFloor = true }
      if (m.y > 0.97) { assert.ok(m.a < 0.2, `opaque at the ceiling: ${m.a}`); sawCeiling = true }
    }
  }
  assert.ok(sawFloor && sawCeiling, 'the sweep never reached the edges')
})

test('motes rise, and rise faster when the speed is raised', () => {
  const slow = moteAt(3, T0 + 900, 0.5).y - moteAt(3, T0, 0.5).y
  const fast = moteAt(3, T0 + 900, 2.0).y - moteAt(3, T0, 2.0).y
  assert.ok(slow > 0 && fast > slow, 'the field is not moving upward with speed')
})

test('a higher realm carries more qi, up to a ceiling a phone can draw', () => {
  assert.ok(moteCount(1) < moteCount(5))
  assert.ok(moteCount(5) < moteCount(9))
  assert.ok(moteCount(9) <= 70, 'a phone will not draw more than this at sixty frames')
  assert.equal(moteCount(9, true), 0, 'reduced motion means no motion')
})

test('the breath swells and settles rather than sitting still', () => {
  const seen = new Set<number>()
  for (let t = 0; t < 4_200; t += 100) seen.add(Math.round(breath(T0 + t) * 20))
  assert.ok(seen.size > 8, 'the aura is not breathing')
  for (let t = 0; t < 9_000; t += 61) {
    const b = breath(T0 + t)
    assert.ok(b >= 0 && b <= 1, `breath ${b} out of range`)
  }
})

test('intensity climbs with the realm and with progress, and banks while settling', () => {
  assert.ok(intensity(1, 0) < intensity(9, 0), 'the ninth realm should not look like the first')
  assert.ok(intensity(4, 0) < intensity(4, 1), 'progress toward the gate should show')
  assert.ok(intensity(4, 1, true) < intensity(4, 0), 'a settling cultivator is visibly banked')
  for (const [r, p] of [[1, 0], [9, 1], [5, 0.5]] as const) {
    const v = intensity(r, p)
    assert.ok(v > 0 && v <= 1, `intensity ${v} out of range`)
  }
})
