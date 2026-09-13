import { read, serialise, type Backup, type Read } from '../core/backup.ts'
import type { PlayerState } from '../core/state.ts'
import type { Ancestor } from '../core/ancestry.ts'

/**
 * The browser edge of 存: clipboards, files and the one line of base64.
 *
 * Two ways out and two ways back, and the order they are offered in is a judgement
 * about what actually works on a phone rather than about what looks best in a menu.
 *
 * Copying is first because it always works. A finished cultivator is under a kilobyte,
 * so a backup is a short piece of text that fits in a note, a chat with yourself or an
 * email — and the clipboard is the one transport that behaves identically in a browser
 * tab, an installed PWA and an Android WebView.
 *
 * Downloading is offered second because it is nicer when it works and is the rough edge
 * of Capacitor's WebView: an anchor download can silently do nothing there. Something
 * that silently does nothing is the worst possible thing to put in front of someone who
 * is trying not to lose two months, so it is never the only door.
 */

const MARK = 'NINEFOLD1:'

/**
 * One pasteable line. Base64 so that a chat app cannot helpfully reformat the JSON
 * inside, and prefixed so a player who pastes the wrong clipboard gets told which
 * mistake they made rather than a parse error.
 */
export function encode(state: PlayerState, line: Ancestor[], now: number): string {
  const json = serialise(state, line, now)
  const bytes = new TextEncoder().encode(json)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return MARK + btoa(bin)
}

export function decode(text: string, now?: number): Read {
  const t = text.trim()
  if (!t) return { ok: false, why: 'Nothing was pasted.' }
  if (!t.startsWith(MARK)) {
    // A raw .json file is a perfectly good backup too, so try it before refusing.
    return t.startsWith('{')
      ? read(t, now)
      : { ok: false, why: 'That does not look like a Ninefold backup. It should begin with NINEFOLD1:' }
  }
  try {
    const bin = atob(t.slice(MARK.length).replace(/\s+/g, ''))
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    return read(new TextDecoder().decode(bytes), now)
  } catch {
    return { ok: false, why: 'That backup was damaged in transit — some of it is missing.' }
  }
}

/** True when the text reached the clipboard. Never throws; the caller shows the fallback. */
export async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export async function paste(): Promise<string | null> {
  try {
    return await navigator.clipboard.readText()
  } catch {
    return null
  }
}

/** Best-effort. Returns false rather than pretending, so the UI can say so. */
export function download(text: string, name: string): boolean {
  try {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
    return true
  } catch {
    return false
  }
}

/** Open the picker and hand back what is in the file. Null when the player cancels. */
export function pickFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json,text/plain'
    input.onchange = () => {
      const f = input.files?.[0]
      if (!f) return resolve(null)
      f.text().then(resolve).catch(() => resolve(null))
    }
    // A cancelled picker fires nothing at all in some browsers, so nothing is awaited
    // forever: the dialog is modal and the promise simply stays pending until the next
    // attempt replaces it, which is the same thing the player experiences.
    input.click()
  })
}

export function fileName(b: Backup): string {
  const s = b.summary
  return `ninefold-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-r${s.realm}-${s.days}d.json`
}

/** Where the last copy and the last nag are remembered. Not part of the save. */
const MARKS = 'ninefold.backup.marks'

export function marks(): { lastBackupAt: number; lastAskedAt: number } {
  try {
    const raw = localStorage.getItem(MARKS)
    if (raw) return { lastBackupAt: 0, lastAskedAt: 0, ...JSON.parse(raw) }
  } catch { /* private window, cleared storage — the reminder simply asks again */ }
  return { lastBackupAt: 0, lastAskedAt: 0 }
}

export function mark(patch: Partial<{ lastBackupAt: number; lastAskedAt: number }>): void {
  try {
    localStorage.setItem(MARKS, JSON.stringify({ ...marks(), ...patch }))
  } catch { /* nothing to do; the reminder is a courtesy, not a mechanism */ }
}
