import { apply, needsRoll, type Action } from '../../../src/core/actions.ts'
import { advance } from '../../../src/core/progress.ts'
import { slotsAt } from '../../../src/core/techniques.ts'
import { admin, cors, json, serverRoll, toRow, toState, userId } from '../_shared/mod.ts'

const ALLOWED = new Set([
  'settle', 'learn', 'equip', 'unequip', 'flame', 'brew', 'takePill', 'attempt', 'hunt', 'open',
])

/**
 * Run one action against the server's copy, with the server's clock and dice.
 *
 * The client sends *what it wants*, never *what happened*. Nothing it sends is
 * trusted beyond the shape of the request — the outcome is recomputed here.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const uid = await userId(req)
  if (!uid) return json({ error: 'unauthenticated' }, 401)

  let body: { action?: Action; nonce?: string }
  try { body = await req.json() } catch { return json({ error: 'bad body' }, 400) }

  const action = body.action
  const nonce = body.nonce
  if (!action || !ALLOWED.has(action.type)) return json({ error: 'unknown action' }, 400)
  if (!nonce || nonce.length < 8 || nonce.length > 64) return json({ error: 'bad nonce' }, 400)

  const db = admin()
  const { data: row, error } = await db
    .from('cultivators').select('*').eq('user_id', uid).maybeSingle()
  if (error) return json({ error: error.message }, 500)
  if (!row) return json({ error: 'no cultivator' }, 404)

  // Claim the nonce first. A duplicate loses the race against the primary key and
  // is answered with the current state rather than doing the thing a second time —
  // which is what makes a retry over a flaky connection safe.
  const claim = await db.from('applied_actions').insert({ cultivator_id: row.id, nonce })
  if (claim.error) {
    if (claim.error.code === '23505') return json({ state: toState(row), event: {}, replayed: true })
    return json({ error: claim.error.message }, 500)
  }

  const now = Date.now()
  const { state: current } = advance(toState(row), now)
  const out = apply(current, action, now, needsRoll(action) ? serverRoll() : 0, slotsAt(current.realm))

  const { error: wErr } = await db.from('cultivators').update(toRow(out.state)).eq('id', row.id)
  if (wErr) return json({ error: wErr.message }, 500)

  return json({ state: out.state, event: out.event, applied: out.applied })
})
