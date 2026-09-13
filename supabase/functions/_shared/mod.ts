import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import { migrate } from '../../../src/core/save.ts'
import { verify, why } from '../../../src/core/verify.ts'
import type { PlayerState } from '../../../src/core/state.ts'

/**
 * Shared plumbing for the three functions. Note what is NOT here: any game rule.
 * The rules live in src/core and are imported unchanged — the same modules the
 * phone runs. That is the entire migration, and it is why core takes `now` and
 * `roll` as arguments instead of reaching for them.
 */

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...cors },
  })

export const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
}

/** Service role: these functions are the only writer in the system. */
export function admin(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )
}

export async function userId(req: Request): Promise<string | null> {
  const auth = req.headers.get('authorization')
  if (!auth) return null
  const anon = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { authorization: auth } },
    auth: { persistSession: false },
  })
  const { data } = await anon.auth.getUser()
  return data.user?.id ?? null
}

/**
 * Rows are the storage shape; PlayerState is the game shape.
 *
 * There is almost nothing to translate now, and that is the point. This used to map
 * forty columns by hand and had drifted fourteen fields behind the engine — `version: 2`
 * and a `huntReadyAt` that was deleted when hunting moved to charges — so every call
 * threw before it reached a write. A translation layer that has to be kept in step with
 * a type is a translation layer that will fall behind it.
 *
 * Reading runs the same migrate() the phone runs, so a row stored three versions ago
 * comes back current. Writing runs the same verify(), so the one writer in the system
 * cannot persist a cultivator the rules do not allow — which is the property rankings
 * will rest on.
 */
export function toState(row: Record<string, unknown>): PlayerState {
  const raw = row.state as Record<string, unknown> | null
  if (!raw) throw new Error('That row holds no cultivator.')
  const s = migrate(raw)
  if (!s) throw new Error('That cultivator is older than this version can carry forward.')
  return s
}

const iso = (t: number) => (t > 0 ? new Date(t).toISOString() : null)

export function toRow(s: PlayerState): Record<string, unknown> {
  const v = verify(s, Date.now())
  if (!v.ok) {
    // The server is the only writer. If it is about to store something unreachable,
    // the bug is here and the write must not happen — a corrupt row outlives the
    // request that made it and would be handed to a leaderboard later.
    throw new Error(`Refusing to store a cultivator the rules do not allow. ${why(v)}`)
  }
  return {
    state: s,
    realm: s.realm,
    total_breakthroughs: s.totalBreakthroughs,
    last_seen_at: iso(s.lastSeenAt),
  }
}

/** The server's dice. A client that supplies its own is supplying nothing. */
export function serverRoll(): number {
  const b = new Uint32Array(1)
  crypto.getRandomValues(b)
  return b[0] / 4294967296
}
