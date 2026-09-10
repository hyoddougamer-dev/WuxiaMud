import { apply, needsRoll, type Action } from '../core/actions.ts'
import { advance } from '../core/progress.ts'
import { slotsAt } from '../core/techniques.ts'
import { newPlayer, type PlayerState } from '../core/state.ts'
import * as store from '../core/save.ts'
import type { PathId } from '../core/paths.ts'
import type { Session } from './session.ts'

/**
 * The truth lives in this browser. Good enough while nothing a player does can reach
 * another player — and deliberately written against the same interface as the remote
 * one, so the day that stops being true is a configuration change.
 */
export class LocalSession implements Session {
  readonly kind = 'local' as const
  private state: PlayerState | null = null
  private seen = new Set<string>()

  async load(): Promise<PlayerState | null> {
    this.state = store.load()
    return this.state
  }

  async create(path: PathId): Promise<PlayerState> {
    this.state = newPlayer(path, Date.now())
    store.save(this.state)
    return this.state
  }

  async tick() {
    if (!this.state) throw new Error('no cultivator')
    const { state, report } = advance(this.state, Date.now())
    // The server will own this once it exists; until then it is the client's estimate.
    this.state = { ...state, activeSeconds: state.activeSeconds + report.creditedSeconds }
    store.save(this.state)
    return { state: this.state, report }
  }

  async act(action: Action, nonce: string) {
    if (!this.state) throw new Error('no cultivator')
    // Replaying a nonce returns the state it produced rather than doing the thing
    // again — the same guarantee the server gives, so behaviour matches everywhere.
    if (this.seen.has(nonce)) return { state: this.state, event: {} }

    const { state } = advance(this.state, Date.now())
    const roll = needsRoll(action) ? Math.random() : 0
    const out = apply(state, action, Date.now(), roll, slotsAt(state.realm))

    this.seen.add(nonce)
    this.state = out.state
    store.save(out.state)
    return { state: out.state, event: out.event }
  }

  async abandon() {
    store.wipe()
    this.state = null
    this.seen.clear()
  }
}
