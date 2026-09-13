import test from 'node:test'
import assert from 'node:assert/strict'
import { newPlayer, SAVE_VERSION, type PlayerState } from '../src/core/state.ts'
import { verify, why, earliestSeconds } from '../src/core/verify.ts'
import { relic } from '../src/core/relics.ts'
import { apply, type Action } from '../src/core/actions.ts'
import { advance, canBreakThrough, openSession } from '../src/core/progress.ts'
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
