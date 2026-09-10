import type { Ancestor } from './ancestry.ts'
import { SAVE_VERSION, type PlayerState } from './state.ts'

const KEY = 'lineage.save.v1'

/**
 * Bring an older save forward, or return null if it is older than we can carry.
 *
 * Version four had no meridians, no gates and a bare hunt cooldown. All three have
 * sane empty values, so there is no reason to make someone who has been playing for a
 * fortnight start again — refusing to migrate is the lazy option, not the safe one.
 * Gates start empty on purpose: a gate only bars the realm you are standing in, so an
 * old cultivator meets their first bottleneck where they are and no earlier.
 */
function migrate(raw: Record<string, unknown>): PlayerState | null {
  const v = typeof raw.version === 'number' ? raw.version : 0
  if (v === SAVE_VERSION) return raw as unknown as PlayerState
  if (v === 4) {
    const { huntReadyAt: _drop, ...rest } = raw as Record<string, unknown> & { huntReadyAt?: number }
    return {
      ...rest,
      version: SAVE_VERSION,
      meridians: [],
      gates: [],
      // Epoch zero: charged since before the world, so the first thing an upgraded
      // save sees is a full set of hunts rather than a locked screen.
      huntAnchorAt: 0,
    } as unknown as PlayerState
  }
  return null
}

/** Browser-facing edge of the core. Everything above this file stays pure. */
export function load(): PlayerState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return migrate(JSON.parse(raw) as Record<string, unknown>)
  } catch {
    return null
  }
}

export function save(state: PlayerState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* private mode, quota, blocked storage — the game keeps running in memory */
  }
}

export function wipe(): void {
  try {
    localStorage.removeItem(KEY)
  } catch { /* ignore */ }
}

const LINE_KEY = 'ninefold.line.v1'

/**
 * The line outlives the cultivator, so it is stored apart from the save and is not
 * touched by abandoning a character. Losing it should take a deliberate act.
 */
export function loadLine(): Ancestor[] {
  try {
    const raw = localStorage.getItem(LINE_KEY)
    return raw ? (JSON.parse(raw) as Ancestor[]) : []
  } catch {
    return []
  }
}

export function saveLine(line: Ancestor[]): void {
  try { localStorage.setItem(LINE_KEY, JSON.stringify(line)) } catch { /* ignore */ }
}

export function wipeLine(): void {
  try { localStorage.removeItem(LINE_KEY) } catch { /* ignore */ }
}
