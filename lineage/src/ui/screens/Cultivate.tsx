import { Figure } from '../art/Figure.tsx'
import { realm, V1_CEILING } from '../../core/realms.ts'
import { PATHS } from '../../core/paths.ts'
import { breakthroughCost, canBreakThrough, clockHours, ratePerSecond } from '../../core/progress.ts'
import { short, duration } from '../../core/format.ts'
import type { PlayerState } from '../../core/state.ts'

export function Cultivate({ state, now, onBreakThrough }: {
  state: PlayerState
  now: number
  onBreakThrough: () => void
}) {
  const r = realm(state.realm)
  const cost = breakthroughCost(state)
  const rate = ratePerSecond(state, now)
  const pct = Math.min(100, (state.qi / cost) * 100)
  const ready = canBreakThrough(state)
  const atCeiling = state.realm >= V1_CEILING
  const path = PATHS[state.path]
  const hours = clockHours(state, now)
  const remaining = ready ? 0 : (cost - state.qi) / Math.max(rate, 1e-9)

  return (
    <div className="screen">
      <div className="glow-bed" />

      <div className="hero-fig">
        <Figure
          symbol={state.path === 'blade' ? 's-blade' : 's-meditate'}
          size={210}
          flames
          ring={pct}
          label={`Your cultivator at ${r.name}, ${Math.floor(pct)} percent of the way to the next realm.`}
        />
      </div>

      <div className="realm-line">
        <p className="label">Realm {state.realm} · {path.name}</p>
        <p className="name h-display">{r.name}</p>
        <p className="zh han">{r.zh}</p>
      </div>

      <div className="panel">
        <div className="row">
          <span className="k">Qi gathered</span>
          <span className="v num">{short(state.qi)} / {short(cost)}</span>
        </div>
        <div className="bar"><i style={{ width: `${pct}%` }} /></div>
        <div className="row">
          <span className="k">Generation</span>
          <span className="v num">{short(rate)} / s</span>
        </div>
        <div className="row">
          <span className="k">
            {path.clock === 'sinceBreakthrough' ? 'Intent sharpened for' : 'Momentum since opening'}
          </span>
          <span className="v num">{duration(hours * 3600)}</span>
        </div>
        {!ready && !atCeiling && (
          <div className="row">
            <span className="k">Ready in</span>
            <span className="v num">{duration(remaining)}</span>
          </div>
        )}
      </div>

      {atCeiling ? (
        <div className="notice">
          You have reached <strong>{r.name}</strong>, the ceiling of release one. Great Vehicle and
          Tribulation exist above you and are not yet reachable — that is deliberate, not a bug.
        </div>
      ) : (
        <button className="cta" onClick={onBreakThrough} disabled={!ready}>
          {ready ? `Break through to ${realm(state.realm + 1).name}` : `Needs ${short(cost - state.qi)} more qi`}
        </button>
      )}

      <div className="panel">
        <p className="label">Insight</p>
        <div className="row">
          <span className="k">Unspent</span>
          <span className="v num jade">{state.insight}</span>
        </div>
        <div className="row">
          <span className="k">Breakthroughs</span>
          <span className="v num">{state.totalBreakthroughs}</span>
        </div>
      </div>
    </div>
  )
}
