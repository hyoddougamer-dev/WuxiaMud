import { apply, needsRoll, type Action } from '../core/actions.ts'
import { advance } from '../core/progress.ts'
import { slotsAt } from '../core/techniques.ts'
import { newPlayer, type PlayerState } from '../core/state.ts'
import * as store from '../core/save.ts'
import type { PathId } from '../core/paths.ts'
import type { CreateOptions, Session } from './session.ts'
import { generationOf, inheritedMeridians, lineageBonus, type Ancestor } from '../core/ancestry.ts'
import { endsLife } from '../core/actions.ts'

/**
 * The truth lives in this browser. Good enough while nothing a player does can reach
 * another player — and deliberately written against the same interface as the remote
 * one, so the day that stops being true is a configuration change.
 */
export class LocalSession implements Session {
  readonly kind = 'local' as const
  private state: PlayerState | null = null
  private seen = new Set<string>()
  private ancestors: Ancestor[] = store.loadLine()

  async load(): Promise<PlayerState | null> {
    this.state = store.load()
    return this.state
  }

  async line(): Promise<Ancestor[]> {
    this.ancestors = store.loadLine()
    return this.ancestors
  }

  async create(path: PathId, opts: CreateOptions = {}): Promise<PlayerState> {
    const line = store.loadLine()
    this.ancestors = line
    const from = opts.inheritFrom ? line.find((a) => a.id === opts.inheritFrom) : undefined
    this.state = newPlayer(path, Date.now(), {
      name: opts.name,
      seal: opts.seal as PlayerState['seal'] | undefined,
      origin: opts.origin as PlayerState['origin'] | undefined,
      generation: generationOf(line),
      lineBonus: lineageBonus(line),
      meridians: inheritedMeridians(line),
      inherited: from
        ? { techniqueId: from.techniqueId, from: from.name, fromPath: from.path, artName: from.artName }
        : null,
    })
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
    const out = apply(state, action, Date.now(), roll, slotsAt(state.realm),
                      this.ancestors, () => crypto.randomUUID())

    this.seen.add(nonce)

    if (endsLife(action) && out.event.ascended) {
      // The line is written first and separately: a crash between these two must
      // leave a forebear recorded, never a cultivator erased for nothing.
      this.ancestors = [...this.ancestors, out.event.ascended]
      store.saveLine(this.ancestors)
      store.wipe()
      this.state = null
      return { state: out.state, event: out.event }
    }

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
