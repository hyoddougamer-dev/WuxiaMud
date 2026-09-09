import { SAVE_VERSION, type PlayerState } from './state.ts'

const KEY = 'lineage.save.v1'

/** Browser-facing edge of the core. Everything above this file stays pure. */
export function load(): PlayerState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PlayerState
    if (parsed.version !== SAVE_VERSION) return null
    return parsed
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
