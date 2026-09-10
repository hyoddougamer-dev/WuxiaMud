import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'
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

const ms = (t: string | null) => (t ? new Date(t).getTime() : 0)

/** Rows are the storage shape; PlayerState is the game shape. One place to translate. */
export function toState(row: Record<string, unknown>): PlayerState {
  return {
    version: 2,
    path: row.path as PlayerState['path'],
    realm: row.realm as number,
    qi: row.qi as number,
    insight: row.insight as number,
    learned: (row.learned ?? []) as string[],
    equipped: (row.equipped ?? []) as string[],
    flame: (row.flame ?? null) as string | null,
    seenBeasts: (row.seen_beasts ?? []) as string[],
    turmoil: row.turmoil as number,
    settling: row.settling as boolean,
    satchel: (row.satchel ?? {}) as PlayerState['satchel'],
    pills: (row.pills ?? {}) as PlayerState['pills'],
    pillPrimed: row.pill_primed as boolean,
    injuredUntil: ms(row.injured_until as string | null),
    huntReadyAt: ms(row.hunt_ready_at as string | null),
    lastSeenAt: ms(row.last_seen_at as string),
    lastOpenedAt: ms(row.last_opened_at as string),
    lastBreakthroughAt: ms(row.last_breakthrough_at as string),
    createdAt: ms(row.created_at as string),
    totalBreakthroughs: row.total_breakthroughs as number,
    failedTribulations: row.failed_tribulations as number,
    activeSeconds: row.active_seconds as number,
  }
}

const iso = (t: number) => (t > 0 ? new Date(t).toISOString() : null)

export function toRow(s: PlayerState): Record<string, unknown> {
  return {
    path: s.path,
    realm: s.realm,
    qi: s.qi,
    insight: s.insight,
    turmoil: s.turmoil,
    settling: s.settling,
    learned: s.learned,
    equipped: s.equipped,
    flame: s.flame,
    seen_beasts: s.seenBeasts,
    satchel: s.satchel,
    pills: s.pills,
    pill_primed: s.pillPrimed,
    last_seen_at: iso(s.lastSeenAt),
    last_opened_at: iso(s.lastOpenedAt),
    last_breakthrough_at: iso(s.lastBreakthroughAt),
    injured_until: iso(s.injuredUntil),
    hunt_ready_at: iso(s.huntReadyAt),
    total_breakthroughs: s.totalBreakthroughs,
    failed_tribulations: s.failedTribulations,
    active_seconds: s.activeSeconds,
  }
}

/** The server's dice. A client that supplies its own is supplying nothing. */
export function serverRoll(): number {
  const b = new Uint32Array(1)
  crypto.getRandomValues(b)
  return b[0] / 4294967296
}
