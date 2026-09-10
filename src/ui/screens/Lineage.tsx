import { Figure } from '../art/Figure.tsx'
import { realm, realmColour } from '../../core/realms.ts'
import { technique } from '../../core/techniques.ts'
import { PATHS } from '../../core/paths.ts'
import { OFF_PATH_BONUS, lineageBonus, ANCESTOR_BONUS_CAP, type Ancestor } from '../../core/ancestry.ts'
import type { PlayerState } from '../../core/state.ts'

/**
 * 燼堂 Cinder Hall. Every cultivator you have taken as far as they could go, and the
 * art each of them left. Locally this is your own line; the mechanic does not change
 * when it becomes other people's.
 */
export function Lineage({ state, line }: { state: PlayerState; line: Ancestor[] }) {
  const r = realm(state.realm)
  const bonus = lineageBonus(line)
  const inh = state.inherited ? technique(state.inherited.techniqueId) : null
  const offPath = state.inherited && state.inherited.fromPath !== state.path

  return (
    <div className="screen">
      <p className="label">Cinder Hall <span className="han">燼堂</span></p>

      <div className="panel">
        <div className="whoami">
          <div style={{
            ['--flame-lo' as string]: realmColour(Math.max(1, state.realm - 2)),
            ['--flame-mid' as string]: realmColour(state.realm),
            ['--flame-hi' as string]: realmColour(Math.min(9, state.realm + 2)),
          }}>
            <Figure symbol="s-meditate" size={62} motes={4} />
          </div>
          <div className="who">
            <p className="wn">{state.name} <span className="sealsm han">{state.seal}</span></p>
            <p className="wd">{r.name} · {PATHS[state.path].name}</p>
            <p className="wd">Generation {state.generation}</p>
          </div>
        </div>
        {line.length > 0 && (
          <div className="row">
            <span className="k">Standing on {line.length} {line.length === 1 ? 'forebear' : 'forebears'}</span>
            <span className="v num jade">+{Math.round(bonus * 100)}% generation</span>
          </div>
        )}
        {bonus >= ANCESTOR_BONUS_CAP && (
          <p className="hint">The line gives all it can. Past here, a forebear is a name and an art, not a number.</p>
        )}
      </div>

      {state.inherited && inh && (
        <>
          <p className="label">Carried forward</p>
          <div className="card on">
            <span className="cb">
              <span className="cn">{state.inherited.artName}</span>
              <span className="cd">{inh.text} · sealed by {state.inherited.from}</span>
              <span className="cd dim">
                no upkeep{offPath ? ` · off-path, ${Math.round(OFF_PATH_BONUS * 100)}% stronger` : ''}
              </span>
            </span>
          </div>
        </>
      )}

      <p className="label">
        {line.length === 0 ? 'The hall is empty' : `${line.length} ${line.length === 1 ? 'name' : 'names'}`}
      </p>

      {line.length === 0 ? (
        <div className="notice">
          Nobody has finished a life yet. Reach <strong>Unity</strong>, seal one art with your
          name, and this hall starts filling — each forebear leaving the ground a little
          warmer for whoever comes next.
        </div>
      ) : (
        <div className="list">
          {line.slice().reverse().map((a) => {
            const t = technique(a.techniqueId)
            const carried = state.inherited?.techniqueId === a.techniqueId
              && state.inherited?.from === a.name
            return (
              <div className={`card${carried ? ' on' : ''}`} key={a.id}>
                <span className="sealsm han">{a.seal}</span>
                <span className="cb">
                  <span className="cn">{a.artName}</span>
                  <span className="cd">
                    {a.name} · {realm(a.realm).name} · generation {a.generation}
                  </span>
                  <span className="cd dim">{t?.text ?? '—'} · {PATHS[a.path].name}</span>
                </span>
                {carried && <span className="cx">carried</span>}
              </div>
            )
          })}
        </div>
      )}

      <div className="notice">
        This is your own line. When accounts and a server clock exist, the same hall holds
        other people's — a master you did not choose, and an art from a path that is not
        yours. Nothing about the mechanic changes; only who the names belong to.
      </div>
    </div>
  )
}
