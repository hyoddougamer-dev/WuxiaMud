import { migrate } from './save.ts'
import { verify, why } from './verify.ts'
import { SAVE_VERSION, type PlayerState } from './state.ts'
import type { Ancestor } from './ancestry.ts'

/**
 * 存 A cultivator that can leave the phone.
 *
 * Everything the game knows lives in one browser's localStorage and nowhere else. Clear
 * the site data, uninstall the app, lose the phone, and two months are gone — and the
 * player did nothing wrong. Every other thing left on the list is upside; this is the
 * only one that is downside, which is why it was built first.
 *
 * The whole fix costs almost nothing, because a finished cultivator is under a kilobyte.
 * There is no server here, no account and no network: a backup is a short piece of text
 * the player can put anywhere text goes.
 *
 * Deliberately JSON and not base64 at this layer. This module is pure — it has to run
 * wherever the rest of core runs — and `btoa` is a browser API. The encoding into one
 * pasteable line happens at the edge, in ui/backup.ts, which is also where clipboards
 * and files live.
 */

/** Bumped only when the shape of the envelope changes, not when the save does. */
export const BACKUP_FORMAT = 1

export interface Backup {
  /** So a file picked by mistake is refused rather than half-read. */
  readonly game: 'ninefold'
  readonly format: number
  /** The save version inside, for the same migration path a stored save takes. */
  readonly save: number
  readonly writtenAt: number
  /** Enough to describe the backup without trusting the body of it. */
  readonly summary: { name: string; realm: number; generation: number; days: number }
  readonly sum: number
  readonly state: PlayerState
  readonly line: Ancestor[]
}

/**
 * FNV-1a over the body. Not security — nothing here is worth forging, and a player who
 * edits their own save is only cheating themselves. It catches the thing that actually
 * happens: a backup pasted through a chat app that wrapped a line or ate a character.
 */
export function checksum(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h
}

function body(state: PlayerState, line: Ancestor[]): string {
  return JSON.stringify({ state, line })
}

export function pack(state: PlayerState, line: Ancestor[], now: number): Backup {
  return {
    game: 'ninefold',
    format: BACKUP_FORMAT,
    save: SAVE_VERSION,
    writtenAt: now,
    summary: {
      name: state.name,
      realm: state.realm,
      generation: state.generation,
      days: Math.max(0, Math.floor((now - state.createdAt) / 86_400_000)),
    },
    sum: checksum(body(state, line)),
    state,
    line,
  }
}

export function serialise(state: PlayerState, line: Ancestor[], now: number): string {
  return JSON.stringify(pack(state, line, now))
}

export type Read =
  | { ok: true; backup: Backup }
  | { ok: false; why: string }

/**
 * JSON can carry keys that object spread will happily copy onto a fresh object.
 * V8 parses `__proto__` as an own property rather than a prototype, so this is not the
 * pollution it looks like — but a state carrying keys the game never wrote is a state
 * nobody should reason about, and a server running this code may not be V8.
 */
const SMUGGLED = ['__proto__', 'constructor', 'prototype']

function scrub<T>(o: T): T {
  if (!o || typeof o !== 'object') return o
  for (const k of SMUGGLED) {
    if (Object.prototype.hasOwnProperty.call(o, k)) delete (o as Record<string, unknown>)[k]
  }
  return o
}

/**
 * Read a backup, and say plainly why not when it cannot be read.
 *
 * Every refusal names what is wrong in words a player can act on, because the moment
 * this function is being used is the moment someone has already lost their save once.
 * "Invalid file" is not a message, it is a shrug.
 */
export function read(text: string, now?: number): Read {
  let raw: unknown
  try {
    raw = JSON.parse(text.trim())
  } catch {
    return { ok: false, why: 'That is not a Ninefold backup — it is not readable text.' }
  }
  if (!raw || typeof raw !== 'object') return { ok: false, why: 'That backup is empty.' }

  const b = scrub(raw) as Partial<Backup>
  if (b.game !== 'ninefold') return { ok: false, why: 'That backup is from a different game.' }
  if (typeof b.format !== 'number' || b.format > BACKUP_FORMAT) {
    return { ok: false, why: 'That backup was written by a newer version of Ninefold. Update the app first.' }
  }
  if (!b.state || typeof b.state !== 'object') return { ok: false, why: 'That backup has no cultivator in it.' }

  const line = Array.isArray(b.line) ? (b.line as Ancestor[]) : []
  if (typeof b.sum === 'number' && checksum(body(b.state as PlayerState, line)) !== b.sum) {
    return { ok: false, why: 'That backup was damaged in transit — some of it is missing or altered.' }
  }

  // The same migration a stored save takes, so a backup made three versions ago opens.
  const state = scrub(migrate(scrub(b.state as unknown as Record<string, unknown>)))
  if (!state) return { ok: false, why: 'That backup is older than this version can carry forward.' }

  // The one door a hand-written state can walk through. It asks questions.
  if (now !== undefined) {
    const v = verify(state, now)
    if (!v.ok) return { ok: false, why: `That backup is not a cultivator the rules allow. ${why(v)}` }
  }

  return {
    ok: true,
    backup: { ...(b as Backup), state, line: line.map(scrub) },
  }
}

/** One line describing what is inside, shown before anything is replaced. */
export function describe(b: Backup): string {
  const s = b.summary
  const gen = s.generation > 1 ? `, generation ${s.generation}` : ''
  return `${s.name} · realm ${s.realm}${gen} · ${s.days} day${s.days === 1 ? '' : 's'} old`
}

/** A week. The reminder to keep a copy appears at most this often, and stops for good. */
export const REMIND_EVERY_MS = 7 * 86_400_000

/**
 * Whether to ask. Once a copy exists the question is never asked again — an app that
 * nags about backups is an app people learn to dismiss without reading.
 */
export function shouldRemind(
  s: PlayerState, lastBackupAt: number, lastAskedAt: number, now: number,
): boolean {
  if (lastBackupAt > 0) return false
  if (now - s.createdAt < REMIND_EVERY_MS) return false
  return now - lastAskedAt >= REMIND_EVERY_MS
}
