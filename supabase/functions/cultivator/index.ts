import { newPlayer } from '../../../src/core/state.ts'
import { admin, cors, json, toRow, toState, userId } from '../_shared/mod.ts'

/** Read, create or abandon the caller's cultivator. One per account. */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const uid = await userId(req)
  if (!uid) return json({ error: 'unauthenticated' }, 401)

  let body: { create?: 'sword' | 'blade'; abandon?: boolean } = {}
  try { body = await req.json() } catch { /* an empty body means "read" */ }

  const db = admin()

  if (body.abandon) {
    const { error } = await db.from('cultivators').delete().eq('user_id', uid)
    return error ? json({ error: error.message }, 500) : json({ state: null })
  }

  if (body.create) {
    if (body.create !== 'sword' && body.create !== 'blade') return json({ error: 'bad path' }, 400)
    const fresh = newPlayer(body.create, Date.now())
    const { data, error } = await db
      .from('cultivators')
      .insert({ user_id: uid, ...toRow(fresh) })
      .select('*').single()
    if (error) return json({ error: error.message }, error.code === '23505' ? 409 : 500)
    return json({ state: toState(data) })
  }

  const { data, error } = await db
    .from('cultivators').select('*').eq('user_id', uid).maybeSingle()
  if (error) return json({ error: error.message }, 500)
  return json({ state: data ? toState(data) : null })
})
