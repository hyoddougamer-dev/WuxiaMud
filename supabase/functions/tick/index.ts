import { advance } from '../../../src/core/progress.ts'
import { admin, cors, json, toRow, toState, userId } from '../_shared/mod.ts'

/**
 * Bring a cultivator up to the present.
 *
 * Idempotent without any bookkeeping: advance() credits the window between
 * last_seen_at and now, and last_seen_at only ever moves forward. A replayed
 * request credits roughly zero. Two racing requests are harmless.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const uid = await userId(req)
  if (!uid) return json({ error: 'unauthenticated' }, 401)

  const db = admin()
  const { data: row, error } = await db
    .from('cultivators').select('*').eq('user_id', uid).maybeSingle()
  if (error) return json({ error: error.message }, 500)
  if (!row) return json({ error: 'no cultivator' }, 404)

  const { state, report } = advance(toState(row), Date.now())

  const { error: wErr } = await db.from('cultivators').update(toRow(state)).eq('id', row.id)
  if (wErr) return json({ error: wErr.message }, 500)

  return json({ state, report })
})
