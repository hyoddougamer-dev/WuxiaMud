import { Figure } from '../art/Figure.tsx'
import { realm, realmColour } from '../../core/realms.ts'
import type { PlayerState } from '../../core/state.ts'

/**
 * The co-op layer needs accounts and a server clock, neither of which exist in this
 * slice. Rather than fake it, the screen shows the shape the player will inherit and
 * says plainly what is missing.
 */
export function Lineage({ state }: { state: PlayerState }) {
  const r = realm(state.realm)
  return (
    <div className="screen">
      <p className="label">Your lineage · one generation</p>

      <div className="panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ ['--flame-lo' as string]: realmColour(Math.max(1, state.realm - 2)), ['--flame-mid' as string]: realmColour(state.realm), ['--flame-hi' as string]: realmColour(Math.min(9, state.realm + 2)) }}>
            <Figure symbol="s-meditate" size={54} motes={4} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="cn" style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--jade)' }}>You</p>
            <p className="cd" style={{ fontSize: 11.5, color: 'var(--text-soft)' }}>{r.name} · no master yet</p>
          </div>
        </div>
      </div>

      <div className="card locked">
        <Figure symbol="s-elder" size={44} dim />
        <span className="cb">
          <span className="cn">No master</span>
          <span className="cd">Matching is by timezone and activity, never by build.</span>
        </span>
      </div>

      <div className="card locked">
        <Figure symbol="s-meditate" size={44} dim />
        <span className="cb">
          <span className="cn">Open disciple seat</span>
          <span className="cd">Part of your cultivation would flow here.</span>
        </span>
      </div>

      <div className="notice">
        Lineage is the reason this game exists, and it is the one system that cannot be
        faked locally. It needs accounts and a server-owned clock — because once merit
        flows between people, a forged clock steals from someone real. It arrives in
        weeks 8–10, after the authoritative clock lands.
      </div>
    </div>
  )
}
