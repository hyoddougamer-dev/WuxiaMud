import test from 'node:test'
import assert from 'node:assert/strict'
import { newPlayer, SAVE_VERSION, type PlayerState } from '../src/core/state.ts'
import { verify, verifyLine, why, earliestSeconds } from '../src/core/verify.ts'
import { ANCESTOR_BONUS, ANCESTOR_BONUS_CAP } from '../src/core/ancestry.ts'
import { relic } from '../src/core/relics.ts'
import { FLAMES } from '../src/core/flames.ts'
import { inheritedEffect } from '../src/core/ancestry.ts'
import { valueAt } from '../src/core/mastery.ts'
import { apply, type Action } from '../src/core/actions.ts'
import { advance, canBreakThrough, modifiers, openSession } from '../src/core/progress.ts'
import { migrate } from '../src/core/save.ts'
import { canBreakGate } from '../src/core/bottlenecks.ts'
import { canHunt, huntCharges } from '../src/core/hunt.ts'
import { canTemper, PATTERNS, TEMPER_MAX, levelOf as forgeLevel } from '../src/core/forge.ts'
import { MERIDIANS, unlocked } from '../src/core/meridians.ts'
import { TECHNIQUES, slotsAt, schoolClash, technique } from '../src/core/techniques.ts'
import { canRefine, refineCost, levelOf as masteryOf, MASTERY_MAX } from '../src/core/mastery.ts'
import { canPay } from '../src/core/materials.ts'
import { GROUNDS, openAt } from '../src/core/grounds.ts'
import { canChallenge, WARDENS, wardenOf } from '../src/core/wardens.ts'
import { V1_CEILING } from '../src/core/realms.ts'

const T0 = 1_700_000_000_000
const H = 3_600_000

function rng(seed: number) {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

/**
 * The test that matters most.
 *
 * A checker that refuses honest players is worse than no checker, because the people it
 * hurts are the ones who did nothing wrong and the people it was aimed at simply do not
 * use the door it guards. So: drive the real engine through a real climb — hunting,
 * learning, equipping, forging, refining, opening meridians, breaking gates, facing
 * warders and the heavens — and assert the verdict is clean after every single action.
 */
test('a real climb never trips the verifier, not once, at any step', () => {
  for (const path of ['sword', 'blade'] as const) {
    const roll = rng(path === 'sword' ? 20260913 : 771)
    let s: PlayerState = newPlayer(path, T0, { origin: 'hunter', name: 'Probe' })
    let now = T0
    let steps = 0

    const check = (what: string) => {
      const v = verify(s, now)
      assert.equal(v.ok, true, `${path} · after ${what}: ${why(v)}`)
      steps++
    }
    check('birth')

    for (let day = 0; day < 220 && s.realm < V1_CEILING; day++) {
      now += 24 * H
      s = advance(s, now).state
      s = openSession(s, now, roll())
      if (s.encounter) { s = apply(s, { type: 'answer', index: 0 }, now, roll(), slotsAt(s.realm)).state; check('an encounter') }

      const act = (a: Action, what: string) => {
        const out = apply(s, a, now, roll(), slotsAt(s.realm))
        if (out.applied) { s = out.state; check(what) }
        return out.applied
      }

      // go where the deepest open ground is, and empty the charges
      const deepest = [...GROUNDS].filter((g) => openAt(g, s.realm)).pop()
      if (deepest && deepest.id !== s.ground) act({ type: 'travel', id: deepest.id }, 'travelling')
      while (canHunt(s, now) && huntCharges(s, now) > 0) if (!act({ type: 'hunt' }, 'a hunt')) break

      // a warden, when it will have us
      const boss = wardenOf(s.ground)
      if (boss && canChallenge(s, boss, huntCharges(s, now)) && !s.wardens.includes(boss.id)) {
        act({ type: 'challenge', id: boss.id }, 'a warden')
      }

      // learn, equip, refine
      for (const t of [...TECHNIQUES].sort((a, b) => b.cost - a.cost)) {
        if (s.realm >= t.realm && s.insight >= t.cost && !s.learned.includes(t.id)) {
          if (act({ type: 'learn', id: t.id }, 'learning an art')) break
        }
      }
      for (const id of s.learned) {
        const t = technique(id)
        if (t && !s.equipped.includes(id) && s.equipped.length < slotsAt(s.realm) && !schoolClash(s.equipped, t)) {
          act({ type: 'equip', id }, 'equipping')
        }
      }
      for (const id of s.equipped) {
        const t = technique(id)!
        if (masteryOf(s.mastery, id) < MASTERY_MAX && canRefine(s, id)
            && s.insight >= refineCost(t, masteryOf(s.mastery, id))) act({ type: 'refine', id }, 'refining')
      }

      // meridians and the forge
      for (;;) {
        const m = [...MERIDIANS].sort((a, b) => a.insight - b.insight).find((x) =>
          !s.meridians.includes(x.id) && unlocked(s.meridians, x) && s.realm >= x.realm
          && s.insight >= x.insight && canPay(s.satchel, x.mats))
        if (!m || !act({ type: 'meridian', id: m.id }, 'a meridian')) break
      }
      for (;;) {
        const p = PATTERNS.find((x) => canTemper(s, x.id) && forgeLevel(s.forged, x.id) < TEMPER_MAX)
        if (!p || !act({ type: 'temper', id: p.id }, 'tempering')) break
      }
      for (const slot of ['implement', 'robe', 'charm'] as const) {
        const p = PATTERNS.find((x) => x.slot === slot && forgeLevel(s.forged, x.id) > 0)
        if (p && s.wearing[slot] !== p.id) act({ type: 'wear', id: p.id, slot }, 'wearing something forged')
        const r = s.relics.find((id) => relic(id)?.slot === slot)
        if (r) act({ type: 'wear', id: r, slot }, 'wearing a relic')
      }

      // the heart, the gate, the heavens
      if (s.turmoil > 40 && !s.settling) act({ type: 'settle' }, 'settling')
      else if (s.settling && s.turmoil < 6) act({ type: 'settle' }, 'sitting up')
      if (canBreakGate(s)) act({ type: 'gate' }, 'breaking a gate')
      if (canBreakThrough(s)) act({ type: 'attempt' }, 'a tribulation')
    }

    assert.ok(steps > 300, `${path} only took ${steps} steps — the probe did not really play`)
    assert.ok(s.realm >= 5, `${path} only reached realm ${s.realm}`)
  }
})

/* --------------------------------------------------------------- what it refuses */

const honest = (over: Partial<PlayerState> = {}): PlayerState => ({
  ...newPlayer('sword', T0 - 200 * 24 * H, { origin: 'rogue', name: 'Real' }),
  realm: 5, totalBreakthroughs: 4, gates: [3, 4], qi: 1e6, insight: 40,
  learned: ['frost', 'thread', 'cloud'], equipped: ['frost', 'thread'],
  seenBeasts: ['hare', 'beetle', 'shrike'], meridians: ['lung'],
  ground: 'ash', satchel: { hide: 20 },
  ...over,
})

test('the honest baseline this file compares against is itself clean', () => {
  const v = verify(honest(), T0)
  assert.equal(v.ok, true, why(v))
})

test('a cultivator at the top of the ladder, with everything, is clean', () => {
  // The probe above is a naive player and stalls in the middle realms, so the end of the
  // game is covered here by construction: every warden down, every relic taken, every
  // meridian open, every pattern at the ceiling, six arts refined to nine.
  const finished = honest({
    realm: 9, totalBreakthroughs: 8, gates: [3, 4, 5, 6, 7, 8], generation: 3,
    // A third-generation cultivator stands on two forebears, so they carry what a line
    // is worth. Without it the state is not a wrong state, it is an unlikely one — and
    // the checker now says so, which is the point of a suspicion.
    lineBonus: ANCESTOR_BONUS * 2,
    createdAt: T0 - 90 * 24 * H, qi: 4e10, insight: 900,
    learned: TECHNIQUES.map((t) => t.id),
    equipped: ['ninewinter', 'unbroken', 'talisman', 'cauldron', 'heart', 'serpent'],
    mastery: Object.fromEntries(['ninewinter', 'unbroken', 'talisman', 'cauldron', 'heart', 'serpent']
      .map((id) => [id, MASTERY_MAX])),
    meridians: MERIDIANS.map((m) => m.id),
    seenBeasts: ['hare','beetle','shrike','serpent','crane','toad','fox','ape','moth',
                 'tiger','boar','lynx','roc','turtle','drake','qilin','wraith','hydra'],
    wardens: WARDENS.map((w) => w.id),
    relics: ['cord', 'robe', 'pendant', 'mantle', 'bell', 'blade', 'mirror'],
    forged: Object.fromEntries(PATTERNS.map((p) => [p.id, TEMPER_MAX])),
    wearing: { implement: 'skyiron', robe: 'trueweave', charm: 'knot' },
    ground: 'scar', satchel: { hide: 40, core: 30, essence: 20 }, flame: 'seaheart',
  })
  const v = verify(finished, T0)
  assert.equal(v.ok, true, why(v))
  assert.equal(v.suspicions.length, 0, 'and nothing about it is even strange')
})

test('every lie a save editor would tell is refused, with a reason', () => {
  const lies: [string, Partial<PlayerState>, RegExp][] = [
    ['a realm nobody climbed to', { realm: 9, totalBreakthroughs: 0 }, /breakthroughs/],
    ['an art from a realm not reached', { learned: ['ninewinter'], equipped: [] }, /not taught before realm/],
    ['more arts equipped than there are slots',
      { realm: 1, totalBreakthroughs: 0, gates: [], learned: ['frost','thread','cloud','wind'], equipped: ['frost','thread','cloud','wind'], meridians: [] }, /slots/],
    ['two arts of the same school', { learned: ['frost', 'bone'], equipped: ['frost', 'bone'] }, /same school/],
    ['a meridian opened out of order', { meridians: ['heartch'] }, /before it is not/],
    ['a meridian from a realm not reached', { realm: 2, totalBreakthroughs: 1, gates: [], meridians: ['lung', 'colon', 'heartch'] }, /does not open before/],
    ['a relic from a warden never beaten', { relics: ['blade'], wardens: [] }, /only comes off a warden/],
    ['a warden beaten without recording its ground', { wardens: ['grey'], seenBeasts: [] }, /without recording/],
    ['a gate ahead of the cultivator', { gates: [8] }, /is at 5/],
    ['a forge pattern past its ceiling', { forged: { ring: 12 } }, /ceiling is 9/],
    ['an art refined past its ceiling', { mastery: { frost: 20 } }, /ceiling is 9/],
    ['an art refined that was never learned', { mastery: { thunder: 2 } }, /never learned/],
    ['standing in a ground not yet open', { ground: 'scar' }, /opens at realm 7/],
    ['a beast recorded where it cannot be reached', { seenBeasts: ['qilin'] }, /opens at realm 7/],
    ['wearing a relic never taken', { wearing: { implement: 'bell', robe: null, charm: null } }, /never taken/],
    ['wearing something forged that was never forged', { forged: {}, wearing: { implement: 'ring', robe: null, charm: null } }, /never forged/],
    ['wearing a thing that does not exist', { wearing: { implement: 'excalibur', robe: null, charm: null } }, /does not exist/],
    ['an invented art', { learned: ['frost', 'godhand'] }, /no art called godhand/],
    ['an invented beast', { seenBeasts: ['dragon'] }, /no beast called dragon/],
    ['the same meridian twice', { meridians: ['lung', 'lung'] }, /listed twice/],
    ['negative qi', { qi: -5 }, /not a number a cultivator can hold/],
    ['a heart demon off the scale', { turmoil: 5000 }, /outside 0 and 100/],
    ['a fractional satchel', { satchel: { hide: 3.7 } }, /not a whole number/],
    ['a cultivator born tomorrow', { createdAt: T0 + 90 * 24 * H }, /born in the future/],
  ]
  for (const [name, patch, expect] of lies) {
    const v = verify(honest(patch), T0)
    assert.equal(v.ok, false, `${name} was allowed through`)
    assert.match(why(v), expect, name)
    for (const f of v.faults) {
      assert.ok(/[.!]$/.test(f.says), `"${f.says}" should be a sentence`)
      assert.doesNotMatch(f.says, /undefined|NaN|\[object/, `"${f.says}" is clean`)
    }
  }
})

test('the ninth realm cannot be reached in a week, by anybody', () => {
  // The check a ranking cannot do without, and the reason the floor is deliberately
  // generous: it assumes a rate ten times the best loadout in the game, so it can only
  // ever catch arithmetic that never happened.
  const rushed = honest({ realm: 9, totalBreakthroughs: 8, gates: [3,4,5,6,7,8],
                          createdAt: T0 - 7 * 24 * H })
  const v = verify(rushed, T0)
  assert.equal(v.ok, false)
  assert.match(why(v), /cannot be reached in under/)

  assert.equal(earliestSeconds(1), 0, 'the first realm costs no time')
  for (let r = 2; r <= 9; r++) {
    assert.ok(earliestSeconds(r) > earliestSeconds(r - 1), `realm ${r} takes longer than ${r - 1}`)
  }
  // And it must stay under the measured honest minimum, or it accuses real players.
  assert.ok(earliestSeconds(9) / 86_400 < 30, 'the floor must sit well under a real 35-day climb')
})

test('strange is reported, not refused', () => {
  // An idle game's honest edge cases look odd. Refusing a real player their own save is
  // far worse than letting a liar onto a leaderboard.
  const hoarder = honest({ qi: 1e12, insight: 500_000, satchel: { hide: 9000 } })
  const v = verify(hoarder, T0)
  assert.equal(v.ok, true, 'still allowed')
  assert.ok(v.suspicions.length >= 3, 'but noticed')
  assert.ok(v.suspicions.every((f) => /[.!]$/.test(f.says)))
})

test('a backup carrying smuggled keys is scrubbed, and pollutes nothing', async () => {
  const { read, checksum } = await import('../src/core/backup.ts')
  const line: never[] = []
  const dirty = JSON.parse(JSON.stringify(honest())) as Record<string, unknown>
  // The classic payload. V8 parses this as an own property rather than a prototype, so
  // it is not the pollution it looks like — but a state carrying keys the game never
  // wrote is a state nobody should have to reason about, and a server may not be V8.
  Object.defineProperty(dirty, '__proto__', { value: { pwned: true }, enumerable: true, configurable: true })
  Object.defineProperty(dirty, 'constructor', { value: 'nonsense', enumerable: true, configurable: true })

  const out = read(JSON.stringify({
    game: 'ninefold', format: 1, save: SAVE_VERSION, writtenAt: T0,
    summary: { name: 'Real', realm: 5, generation: 1, days: 200 },
    sum: checksum(JSON.stringify({ state: dirty, line })), state: dirty, line,
  }), T0)

  assert.equal(out.ok, true, 'a real save with a junk key still opens')
  if (out.ok) {
    for (const k of ['__proto__', 'constructor']) {
      assert.equal(Object.prototype.hasOwnProperty.call(out.backup.state, k), false, `${k} was stripped`)
    }
    assert.equal(out.backup.state.realm, 5, 'and the cultivator is intact')
  }
  assert.equal(({} as Record<string, unknown>).pwned, undefined, 'nothing anywhere was polluted')
  assert.equal(Object.prototype.toString.call({}), '[object Object]')
})

test('an unreachable backup is refused before it can be restored', async () => {
  const { read, checksum } = await import('../src/core/backup.ts')
  const lie = honest({ realm: 9, totalBreakthroughs: 0 })
  const line: never[] = []
  const out = read(JSON.stringify({
    game: 'ninefold', format: 1, save: lie.version, writtenAt: T0,
    summary: { name: 'Real', realm: 9, generation: 1, days: 200 },
    sum: checksum(JSON.stringify({ state: lie, line })), state: lie, line,
  }), T0)
  assert.equal(out.ok, false)
  if (!out.ok) assert.match(out.why, /not a cultivator the rules allow/)
})

/* ------------------------------------------ what the security review actually found */

test('a flame cannot be taken before its realm, through any door', () => {
  // This was enforced in exactly one place in the codebase: `disabled` on a button.
  // A disabled button stops a finger, not a POST, and the edge function hands whatever
  // arrives straight to apply(). A realm-one cultivator could take the Falling Heart
  // Flame and halve every breakthrough for the rest of their life.
  const young = { ...newPlayer('sword', T0), realm: 1 }
  for (const f of FLAMES) {
    const out = apply(young, { type: 'flame', id: f.id }, T0, 0.5, 2)
    if (f.realm > 1) {
      assert.equal(out.applied, false, `${f.name} needs realm ${f.realm} and was handed out at 1`)
      assert.equal(out.state.flame, null)
    }
  }
  const junk = apply(young, { type: 'flame', id: '<img src=x onerror=alert(1)>' }, T0, 0.5, 2)
  assert.equal(junk.applied, false, 'an invented flame id is not a flame')
  assert.equal(junk.state.flame, null)

  // And the legitimate path still works, in both directions.
  const old = { ...newPlayer('sword', T0), realm: 6 }
  const lit = apply(old, { type: 'flame', id: 'seaheart' }, T0, 0.5, 2)
  assert.equal(lit.applied, true)
  assert.equal(apply(lit.state, { type: 'flame', id: null }, T0, 0.5, 2).state.flame, null, 'and can be put down')

  // The verifier agrees, so a state that got one another way is refused too.
  assert.equal(verify(honest({ realm: 1, totalBreakthroughs: 0, gates: [], meridians: [],
                               learned: [], equipped: [], flame: 'fallheart' }), T0).ok, false)
})

test('the two fields that multiply the qi rate are bounded', () => {
  // verify() checked every id and every count and never looked at the two numbers that
  // feed modifiers().rate. A hand-written heirloom claiming a mastery of a million
  // passed clean and generated qi two hundred thousand times faster than the best
  // legal loadout — with the checker's own impossibility constant set at ten.
  const forged = honest({
    lineBonus: 1000,
    inherited: { techniqueId: 'ninewinter', from: 'Nobody', fromPath: 'blade', artName: 'x', mastery: 1_000_000 },
  })
  const v = verify(forged, T0)
  assert.equal(v.ok, false, 'the forged heirloom is refused')
  assert.match(why(v), /line is worth at most|ceiling is/)

  // Each half on its own, because either alone was enough.
  assert.equal(verify(honest({ lineBonus: 1000 }), T0).ok, false, 'an impossible lineage bonus')
  assert.equal(verify(honest({ inherited: { techniqueId: 'frost', from: 'A', fromPath: 'sword', artName: 'x', mastery: 999 } }), T0).ok,
               false, 'an impossible heirloom mastery')
  assert.equal(verify(honest({ inherited: { techniqueId: 'nosuchart', from: 'A', fromPath: 'sword', artName: 'x', mastery: 2 } }), T0).ok,
               false, 'an heirloom of an art that does not exist')
  assert.equal(verify(honest({ inherited: { techniqueId: 'frost', from: 'A', fromPath: 'jazz' as never, artName: 'x', mastery: 2 } }), T0).ok,
               false, 'a forebear who walked no path')

  // And a real inheritance still passes.
  assert.equal(verify(honest({ lineBonus: ANCESTOR_BONUS_CAP,
    inherited: { techniqueId: 'frost', from: 'Yuwen Bai', fromPath: 'blade', artName: 'Old Frost', mastery: 4 } }), T0).ok,
    true, 'an honest heirloom is untouched')
})

test('an inherited art is worth exactly what the same art equipped is worth', () => {
  // It used to compute its own curve — untapered and unbounded — so an heirloom at nine
  // was quietly worth more than the art in your own hands. One curve, in one place.
  const t = technique('ninewinter')!
  for (const lv of [0, 3, 5, 9]) {
    assert.equal(inheritedEffect(t, 'sword', 'sword', lv), valueAt(t, lv), `same path, mastery ${lv}`)
  }
  assert.equal(inheritedEffect(t, 'sword', 'sword', 1e6), valueAt(t, MASTERY_MAX), 'and it clamps')
  assert.equal(inheritedEffect(t, 'sword', 'sword', -5), valueAt(t, 0), 'in both directions')
  assert.ok(inheritedEffect(t, 'blade', 'sword', 4) > inheritedEffect(t, 'sword', 'sword', 4), 'off-path still pays')
})

test('a forged line is refused, because it outlives the cultivator that carried it', () => {
  const good = [{ id: 'a', name: 'First', seal: '道' as const, path: 'sword' as const, realm: 9,
                  generation: 1, techniqueId: 'frost', artName: 'Old Frost', meridians: 6,
                  mastery: 4, ascendedAt: T0 - 100 * 24 * H }]
  assert.equal(verifyLine(good, T0).ok, true, 'an honest forebear passes')
  assert.equal(verifyLine([], T0).ok, true, 'and so does no line at all')

  const lies: [string, Record<string, unknown>][] = [
    ['a mastery past the ceiling', { mastery: 1_000_000 }],
    ['more meridians than exist', { meridians: 99 }],
    ['a realm below where sealing begins', { realm: 2 }],
    ['an art that does not exist', { techniqueId: 'godhand' }],
    ['a path that does not exist', { path: 'jazz' }],
    ['a sealing in the future', { ascendedAt: T0 + 90 * 24 * H }],
  ]
  for (const [name, patch] of lies) {
    const v = verifyLine([{ ...good[0], ...patch } as never], T0)
    assert.equal(v.ok, false, `${name} was allowed through`)
    assert.ok(/[.!]$/.test(v.faults[0].says), `"${v.faults[0].says}" is a sentence`)
  }
  const twice = verifyLine([good[0], good[0]] as never, T0)
  assert.equal(twice.ok, false, 'the same forebear cannot appear twice')
})

test('the verifier refuses malformed state instead of throwing on it', () => {
  // A checker that crashes rather than refusing hands its caller a decision about what
  // a crash means, and that decision is a way around it.
  const shapes: unknown[] = [
    {}, { realm: 4 }, { ...honest(), learned: null }, { ...honest(), forged: 'nonsense' },
    { ...honest(), wearing: null }, { ...honest(), gates: 'all of them' },
    { ...honest(), mastery: [1, 2, 3] }, { ...honest(), seenBeasts: [1, 2, 3] },
  ]
  for (const shape of shapes) {
    const v = verify(shape as never, T0)
    assert.equal(v.ok, false, `${JSON.stringify(shape).slice(0, 40)} should be refused`)
    assert.ok(v.faults.length > 0)
  }
})

test('the shape the server stores round-trips through the engine', () => {
  // The server used to shred PlayerState into forty columns and had drifted fourteen
  // fields behind it, so advance() threw on `s.meridians is not iterable` before any
  // call reached a write. It now stores the state whole and reads it back through the
  // same migrate() the phone runs. This test is what stops that drift returning:
  // it fails the moment a field cannot survive the trip.
  const lived: PlayerState = {
    ...newPlayer('blade', T0 - 90 * 24 * H, { origin: 'castout', name: 'Server' }),
    realm: 7, totalBreakthroughs: 6, gates: [3, 4, 5, 6], qi: 3e9, insight: 420,
    learned: ['frost', 'thread', 'wind', 'bell', 'thunder'], equipped: ['frost', 'wind'],
    mastery: { frost: 5 }, meridians: ['lung', 'colon'], seenBeasts: ['hare', 'beetle', 'shrike'],
    forged: { ring: 7, vest: 3 }, wearing: { implement: 'ring', robe: 'vest', charm: null },
    satchel: { hide: 44, core: 12 }, ground: 'wood', flame: 'seaheart',
    lineBonus: ANCESTOR_BONUS, generation: 2,
    inherited: { techniqueId: 'frost', from: 'Yuwen Bai', fromPath: 'sword', artName: 'Old Frost', mastery: 3 },
  }

  // Exactly what toRow/toState do, minus the network: JSON in, migrate out.
  const stored = JSON.parse(JSON.stringify(lived)) as Record<string, unknown>
  const back = migrate(stored)
  assert.ok(back, 'the row comes back as a cultivator')
  assert.deepEqual(back, lived, 'and every field survives the trip')

  // The two calls that used to throw before reaching a write.
  assert.doesNotThrow(() => advance(back!, T0))
  assert.doesNotThrow(() => modifiers(back!))
  assert.equal(verify(back!, T0).ok, true, why(verify(back!, T0)))
})

test('the rate multiplier is bounded even by a state no checker ever saw', () => {
  // Defence in depth, and the reason for it: verify() refuses these states at the door,
  // but a number feeding the qi rate should not depend on a checker having run. Both
  // clamps live at the point of use, where the arithmetic happens.
  const s = newPlayer('sword', T0)
  const forged = {
    ...s, lineBonus: 1_000,
    inherited: { techniqueId: 'ninewinter', from: 'X', fromPath: 'blade' as const, artName: 'x', mastery: 1e6 },
  }
  const rate = modifiers(forged).rate
  assert.ok(rate < 5, `an unchecked forged state still multiplies by ${rate.toFixed(0)}`)

  // And it lands exactly where the legitimate ceiling is: a full line plus the best
  // art in the game inherited at the ceiling from the other path.
  const legit = {
    ...s, lineBonus: ANCESTOR_BONUS_CAP,
    inherited: { techniqueId: 'ninewinter', from: 'X', fromPath: 'blade' as const, artName: 'x', mastery: MASTERY_MAX },
  }
  assert.equal(rate, modifiers(legit).rate, 'the forged state is worth no more than the best honest one')
  assert.ok(modifiers(legit).rate > modifiers(s).rate, 'and an honest inheritance is still worth having')
})
