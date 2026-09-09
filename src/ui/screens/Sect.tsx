import { Figure } from '../art/Figure.tsx'
import { REALMS, V1_CEILING, realmColour } from '../../core/realms.ts'
import { BEASTS } from '../../core/beasts.ts'
import { FLAMES } from '../../core/flames.ts'
import { PATHS } from '../../core/paths.ts'
import { duration } from '../../core/format.ts'
import type { PlayerState } from '../../core/state.ts'

const RANK_TIER: Record<number, [string, string, string]> = {
  1: ['#4A1E08', '#7C3411', '#A65A22'],
  2: ['#8B3D10', '#D0741C', '#F0B25C'],
  3: ['#C06A1E', '#FCE2AA', '#FFFBEE'],
}

export function Sect({ state, onPickFlame, onWipe }: {
  state: PlayerState
  onPickFlame: (id: string | null) => void
  onWipe: () => void
}) {
  const path = PATHS[state.path]
  return (
    <div className="screen">
      <p className="label">The nine realms</p>
      <div className="panel">
        <div className="ladder">
          {REALMS.map((r) => {
            const locked = r.id > V1_CEILING
            const here = r.id === state.realm
            return (
              <div className={`rung${locked ? ' off' : ''}`} key={r.id}>
                <span
                  className={`dot${locked ? ' locked' : ''}${here ? ' here' : ''}`}
                  style={{ background: locked ? undefined : realmColour(r.id) }}
                >
                  {r.id}
                </span>
                <span className="rz han" style={{ color: locked ? undefined : 'var(--text)' }}>{r.zh}</span>
                <span className="rn">{r.name}</span>
              </div>
            )
          })}
        </div>
        <p className="muted" style={{ fontSize: 11.5 }}>
          Realms 8 and 9 arrive in update one. The ceiling is meant to be visible.
        </p>
      </div>

      <p className="label">Heavenly flames</p>
      <div className="list">
        {FLAMES.map((f) => {
          const eligible = state.realm >= f.realm
          const on = state.flame === f.id
          return (
            <button
              key={f.id}
              className={`card${on ? ' on' : ''}${eligible ? '' : ' locked'}`}
              disabled={!eligible}
              onClick={() => onPickFlame(on ? null : f.id)}
            >
              <span className="cb">
                <span className="cn">{f.name} <span className="han" style={{ fontSize: 10, color: 'var(--text-faint)' }}>{f.zh}</span></span>
                <span className="cd">{f.rule}</span>
              </span>
              <span className={`cx${eligible ? '' : ' dim'}`}>{on ? 'held' : eligible ? 'take' : `realm ${f.realm}`}</span>
            </button>
          )
        })}
      </div>

      <p className="label">Bestiary · {BEASTS.filter((b) => state.realm >= b.realm).length} of {BEASTS.length} encountered</p>
      <div className="grid">
        {BEASTS.map((b) => {
          const seen = state.realm >= b.realm
          const [lo, mid, hi] = RANK_TIER[b.rank]
          return (
            <div className="beast" key={b.id} title={seen ? b.note : 'Not yet encountered'}>
              <div style={seen ? { ['--flame-lo' as string]: lo, ['--flame-mid' as string]: mid, ['--flame-hi' as string]: hi } : undefined}>
                <Figure symbol={b.symbol} size={72} dim={!seen} label={seen ? `${b.name}. ${b.note}` : undefined} />
              </div>
              <span className="bn" style={seen ? undefined : { color: 'var(--stone)' }}>{seen ? b.name : '???'}</span>
              <span className="bz han">{seen ? b.zh : '—'}</span>
            </div>
          )
        })}
      </div>

      <p className="label">This cultivator</p>
      <div className="panel">
        <div className="row"><span className="k">Path</span><span className="v">{path.name} · {path.zh}</span></div>
        <div className="row"><span className="k">Active time</span><span className="v num">{duration(state.activeSeconds)}</span></div>
        <div className="row"><span className="k">Cultivating since</span><span className="v num">{new Date(state.createdAt).toLocaleDateString()}</span></div>
        <button className="cta ghost" onClick={onWipe}>Abandon this cultivator</button>
      </div>
    </div>
  )
}
