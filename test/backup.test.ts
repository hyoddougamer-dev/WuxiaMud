import test from 'node:test'
import assert from 'node:assert/strict'
import { newPlayer, SAVE_VERSION, type PlayerState } from '../src/core/state.ts'
import { BACKUP_FORMAT, checksum, describe, pack, read, serialise, shouldRemind, REMIND_EVERY_MS } from '../src/core/backup.ts'
import type { Ancestor } from '../src/core/ancestry.ts'

const T0 = 1_700_000_000_000
const DAY = 86_400_000

const veteran = (over: Partial<PlayerState> = {}): PlayerState => ({
  ...newPlayer('blade', T0, { name: 'Ash', origin: 'hunter', generation: 3 }),
  realm: 7, qi: 4.4e9, insight: 812, createdAt: T0 - 52 * DAY,
  learned: ['frost', 'thread', 'wind', 'bell', 'thunder'],
  equipped: ['frost', 'wind'], mastery: { frost: 6, wind: 3 },
  meridians: ['lung', 'colon', 'stomach'], gates: [3, 4, 5, 6],
  forged: { ring: 9, seal: 4, bonecharm: 5 },
  wearing: { implement: 'seal', robe: null, charm: 'bonecharm' },
  satchel: { hide: 61, core: 22, essence: 4 },
  seenBeasts: ['hare', 'beetle', 'toad'], relics: ['cord'], wardens: ['grey'],
  ...over,
})

const forebears: Ancestor[] = [
  { id: 'a1', name: 'First', seal: '道', path: 'sword', realm: 9, generation: 1,
    artName: 'Old Frost', techniqueId: 'frost', mastery: 3, meridians: 6,
    ascendedAt: T0 - 100 * DAY },
]

test('a cultivator survives the round trip exactly', () => {
  const s = veteran()
  const out = read(serialise(s, forebears, T0))
  assert.equal(out.ok, true)
  if (!out.ok) return
  assert.deepEqual(out.backup.state, s, 'every field comes back')
  assert.deepEqual(out.backup.line, forebears, 'so does the line')
  assert.equal(out.backup.game, 'ninefold')
  assert.equal(out.backup.format, BACKUP_FORMAT)
  assert.equal(out.backup.save, SAVE_VERSION)
})

test('a finished cultivator stays small enough to paste', () => {
  // The whole design rests on this: a backup is a short piece of text a person can put
  // in a note or a message. If it ever stops being that, the screen needs rethinking.
  const text = serialise(veteran({ realm: 9 }), forebears, T0)
  assert.ok(text.length < 4000, `a backup is ${text.length} bytes`)
})

test('every refusal says what is wrong in words a player can act on', () => {
  const cases: [string, RegExp][] = [
    ['not json at all', /not readable text/],
    ['{}', /empty|different game/],
    [JSON.stringify({ game: 'othergame', format: 1, state: {} }), /different game/],
    [JSON.stringify({ game: 'ninefold', format: 99, state: {} }), /newer version/],
    [JSON.stringify({ game: 'ninefold', format: 1 }), /no cultivator/],
    [JSON.stringify({ game: 'ninefold', format: 1, state: { version: 1 } }), /older than/],
  ]
  for (const [text, why] of cases) {
    const out = read(text)
    assert.equal(out.ok, false, `${text.slice(0, 30)} must be refused`)
    if (!out.ok) {
      assert.match(out.why, why)
      assert.ok(/[.!]$/.test(out.why), 'a refusal is a sentence, not a code')
    }
  }
})

test('a backup mangled in transit is caught rather than half-applied', () => {
  const b = pack(veteran(), forebears, T0)
  // The thing that actually happens: a chat app eats or changes a character.
  const tampered = { ...b, state: { ...b.state, realm: 9 } }
  const out = read(JSON.stringify(tampered))
  assert.equal(out.ok, false)
  if (!out.ok) assert.match(out.why, /damaged in transit/)
})

test('the checksum notices a single changed character', () => {
  const a = checksum('{"realm":7}')
  assert.notEqual(a, checksum('{"realm":8}'))
  assert.equal(a, checksum('{"realm":7}'), 'and is a function, not a roll')
})

test('an older backup is carried forward, not refused', () => {
  // Someone restoring a save is often doing it because something already went wrong.
  // Refusing a version-8 backup on a version-9 build would be the cruellest moment to
  // be strict, and migrate() already knows how to bring it forward.
  const s = veteran()
  const old = { ...s, version: 8 } as unknown as Record<string, unknown>
  delete (old as Record<string, unknown>).forged
  const body = JSON.stringify({ state: old, line: forebears })
  const out = read(JSON.stringify({
    game: 'ninefold', format: 1, save: 8, writtenAt: T0,
    summary: { name: 'Ash', realm: 7, generation: 3, days: 52 },
    sum: checksum(body), state: old, line: forebears,
  }))
  assert.equal(out.ok, true, 'a version-8 backup opens')
  if (out.ok) {
    assert.equal(out.backup.state.version, SAVE_VERSION, 'and arrives migrated')
    assert.deepEqual(out.backup.state.forged, {}, 'with the missing field defaulted')
  }
})

test('the summary names the cultivator before anything is replaced', () => {
  const line = describe(pack(veteran(), forebears, T0))
  assert.match(line, /Ash/)
  assert.match(line, /realm 7/)
  assert.match(line, /generation 3/)
  assert.match(line, /52 days/)
  // A first-generation cultivator does not need the word "generation" in it.
  assert.doesNotMatch(describe(pack(veteran({ generation: 1 }), [], T0)), /generation/)
})

test('the reminder is gentle, and stops for good once a copy exists', () => {
  const s = veteran({ createdAt: T0 - 30 * DAY })
  assert.equal(shouldRemind(s, 0, 0, T0), true, 'it asks')
  assert.equal(shouldRemind(s, T0 - DAY, 0, T0), false, 'never again once a copy exists')
  assert.equal(shouldRemind(s, 0, T0 - DAY, T0), false, 'and not twice in a week')
  assert.equal(shouldRemind(s, 0, T0 - REMIND_EVERY_MS, T0), true, 'a week later, once more')
  const fresh = veteran({ createdAt: T0 - 2 * DAY })
  assert.equal(shouldRemind(fresh, 0, 0, T0), false, 'and never in the first week of a life')
})
