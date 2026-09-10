import type { Action, ActionEvent } from '../core/actions.ts'
import type { ElapsedReport } from '../core/progress.ts'
import type { PathId } from '../core/paths.ts'
import type { PlayerState } from '../core/state.ts'
import type { Ancestor } from '../core/ancestry.ts'

export interface CreateOptions {
  name?: string
  seal?: string
  origin?: string
  /** Which forebear's art to carry, if any. */
  inheritFrom?: string
}

/**
 * The seam between the game and wherever its truth lives.
 *
 * Today the truth is localStorage and the phone's own clock. Tomorrow it is Postgres
 * and an edge function. Both implement this and nothing above it can tell the
 * difference — which is the whole reason the core was written pure.
 */
export interface Session {
  readonly kind: 'local' | 'remote'
  /** Null when there is no cultivator yet. */
  load(): Promise<PlayerState | null>
  create(path: PathId, opts?: CreateOptions): Promise<PlayerState>
  /** The forebears. Outlives any single cultivator. */
  line(): Promise<Ancestor[]>
  /** Bring the world up to the present. Safe to call as often as you like. */
  tick(): Promise<{ state: PlayerState; report: ElapsedReport }>
  /**
   * Ask for a change. `nonce` makes a retry safe: the same nonce is never applied
   * twice, so a flaky network cannot hunt the same beast into two piles of loot.
   */
  act(action: Action, nonce: string): Promise<{ state: PlayerState; event: ActionEvent }>
  abandon(): Promise<void>
}

export function newNonce(): string {
  const b = new Uint8Array(12)
  crypto.getRandomValues(b)
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
}
