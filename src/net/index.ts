import { LocalSession } from './localSession.ts'
import { RemoteSession } from './remoteSession.ts'
import type { Session } from './session.ts'

export type { Session } from './session.ts'
export { newNonce } from './session.ts'

/**
 * One switch decides where the truth lives. Set both variables and the game plays
 * against the server; leave them out and it plays against this browser.
 *
 * There is deliberately no third mode. "Local but syncing" is where correctness goes
 * to die: two clocks, two copies, and a merge nobody can reason about.
 */
export function makeSession(): Session {
  const url = import.meta.env.VITE_SUPABASE_URL
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (url && anon) {
    return new RemoteSession(url, () => localStorage.getItem('ninefold.jwt') ?? anon)
  }
  return new LocalSession()
}
