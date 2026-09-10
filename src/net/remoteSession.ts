import type { Action, ActionEvent } from '../core/actions.ts'
import type { ElapsedReport } from '../core/progress.ts'
import type { PathId } from '../core/paths.ts'
import type { PlayerState } from '../core/state.ts'
import type { Session } from './session.ts'

/**
 * The truth lives on the server. This class knows how to ask and nothing else — it
 * contains no game rules at all, on purpose: any rule that exists here is a rule the
 * player can rewrite with a debugger.
 */
export class RemoteSession implements Session {
  readonly kind = 'remote' as const

  constructor(
    private readonly baseUrl: string,
    private readonly token: () => string | null,
  ) {}

  private async call<T>(path: string, body?: unknown): Promise<T> {
    const jwt = this.token()
    const res = await fetch(`${this.baseUrl}/functions/v1/${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(jwt ? { authorization: `Bearer ${jwt}` } : {}),
      },
      body: JSON.stringify(body ?? {}),
    })
    if (!res.ok) throw new Error(`${path} failed: ${res.status} ${await res.text()}`)
    return res.json() as Promise<T>
  }

  async load(): Promise<PlayerState | null> {
    const r = await this.call<{ state: PlayerState | null }>('cultivator')
    return r.state
  }

  async create(path: PathId): Promise<PlayerState> {
    const r = await this.call<{ state: PlayerState }>('cultivator', { create: path })
    return r.state
  }

  async tick(): Promise<{ state: PlayerState; report: ElapsedReport }> {
    return this.call('tick')
  }

  async act(action: Action, nonce: string): Promise<{ state: PlayerState; event: ActionEvent }> {
    return this.call('act', { action, nonce })
  }

  async abandon(): Promise<void> {
    await this.call('cultivator', { abandon: true })
  }
}
