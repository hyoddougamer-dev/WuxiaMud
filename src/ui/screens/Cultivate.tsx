import { Figure } from '../art/Figure.tsx'
import { realm, V1_CEILING } from '../../core/realms.ts'
import { PATHS } from '../../core/paths.ts'
import {
  breakthroughCost, canBreakThrough, clockHours, grossPerSecond, modifiers,
  ratePerSecond, turmoilFactor, TURMOIL_FREE, TURMOIL_MAX,
} from '../../core/progress.ts'
import { odds } from '../../core/tribulation.ts'
import { canAscend } from '../../core/ancestry.ts'
import { short, duration } from '../../core/format.ts'
import type { PlayerState } from '../../core/state.ts'

const pc = (v: number) => `${Math.round(v * 100)}%`
const signed = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(Math.round(v * 100))}%`

export function Cultivate({ state, now, onAttempt, onSettle, onAscend }: {
  state: PlayerState
  now: number
  onAttempt: () => void
  onSettle: () => void
  onAscend: () => void
}) {
  const r = realm(state.realm)
  const cost = breakthroughCost(state)
  const rate = ratePerSecond(state, now)
  const gross = grossPerSecond(state, now)
  const m = modifiers(state)
  const pct = Math.min(100, (state.qi / cost) * 100)
  const ready = canBreakThrough(state)
  const atCeiling = state.realm >= V1_CEILING
  const path = PATHS[state.path]
  const hours = clockHours(state, now)
  const remaining = ready ? 0 : (cost - state.qi) / Math.max(rate, 1e-9)
  const o = odds(state)
  const injured = now < state.injuredUntil
  const strained = state.turmoil > TURMOIL_FREE

  return (
    <div className="screen lit">
      <div className="hero-fig">
        <Figure
          symbol={state.path === 'blade' ? 's-blade' : 's-meditate'}
          size={196}
          flames={!state.settling}
          ring={pct}
          label={`Your cultivator at ${r.name}, ${Math.floor(pct)} percent of the way to the next realm.`}
        />
      </div>

      <div className="realm-line">
        <p className="label">Realm {state.realm} · {path.name}</p>
        <p className="name h-display">{r.name}</p>
        <p className="zh han">{r.zh}</p>
      </div>

      {injured && (
        <div className="notice warn">
          Injured from a failed tribulation — generation is almost halved for{' '}
          {duration((state.injuredUntil - now) / 1000)}.
        </div>
      )}

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
        {m.upkeep > 0 && !state.settling && (
          <div className="row">
            <span className="k">…after upkeep of {short(m.upkeep)}/s</span>
            <span className="v num dim">gross {short(gross)}/s</span>
          </div>
        )}
        <div className="row">
          <span className="k">
            {path.clock === 'sinceBreakthrough' ? 'Intent sharpened for' : 'Momentum since opening'}
          </span>
          <span className="v num">{duration(hours * 3600)}</span>
        </div>
        {!ready && !atCeiling && !state.settling && (
          <div className="row">
            <span className="k">Ready in</span>
            <span className="v num">{duration(remaining)}</span>
          </div>
        )}
      </div>

      <div className={`panel${strained ? ' alarm' : ''}`}>
        <div className="row">
          <span className="k">Heart demon <span className="han">心魔</span></span>
          <span className={`v num${strained ? ' crimson' : ''}`}>{Math.floor(state.turmoil)} / {TURMOIL_MAX}</span>
        </div>
        <div className="bar turmoil"><i style={{ width: `${(state.turmoil / TURMOIL_MAX) * 100}%` }} /></div>
        <p className="hint">
          {state.settling
            ? 'Settling. Generation is at 15% while the heart quiets.'
            : strained
              ? `Turmoil is costing you ${Math.round((1 - turmoilFactor(state.turmoil)) * 100)}% of your generation, and the same again off any tribulation.`
              : `Free until ${TURMOIL_FREE}. Rises with every qi you gather — faster cultivation, louder demon.`}
        </p>
        <button className="cta ghost" onClick={onSettle}>
          {state.settling ? 'Resume cultivating' : 'Settle the heart'}
        </button>
      </div>

      {atCeiling ? (
        <>
          <div className="notice">
            You have reached <strong>{r.name}</strong>, as far as a single life goes. Great
            Vehicle and Tribulation are above you and no one has climbed them — that is what
            a line is for.
          </div>
          <button className="cta gold" onClick={onAscend} disabled={!canAscend(state)}>
            {canAscend(state) ? 'Seal an art and ascend' : 'Learn an art first'}
          </button>
        </>
      ) : (
        <>
          {ready && o.needed && (
            <div className="panel">
              <p className="label">The heavens are asking</p>
              <div className="ledger">
                <div className="lr"><span>Base at {r.name}</span><b>{pc(o.base)}</b></div>
                <div className="lr">
                  <span>Surplus qi · {(state.qi / cost).toFixed(1)}× the cost</span>
                  <b className={o.surplus > 0 ? 'up' : ''}>{signed(o.surplus)}</b>
                </div>
                <div className="lr">
                  <span>Heart demon at {Math.floor(state.turmoil)}</span>
                  <b className={o.turmoil < 0 ? 'dn' : ''}>{signed(o.turmoil)}</b>
                </div>
                {state.pillPrimed && (
                  <div className="lr"><span>Tribulation Pill</span><b className="up">{signed(o.pill)}</b></div>
                )}
                <div className="lr tot"><span>Your odds</span><b>{pc(o.total)}</b></div>
              </div>
            </div>
          )}
          <button className="cta" onClick={onAttempt} disabled={!ready}>
            {!ready
              ? `Needs ${short(cost - state.qi)} more qi`
              : o.needed
                ? 'Face it'
                : `Break through to ${realm(state.realm + 1).name}`}
          </button>
          {ready && o.needed && (
            <p className="hint centered">
              Waiting raises the second line. Settling removes the third.
            </p>
          )}
        </>
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
        {state.failedTribulations > 0 && (
          <div className="row">
            <span className="k">Tribulations failed</span>
            <span className="v num crimson">{state.failedTribulations}</span>
          </div>
        )}
      </div>
    </div>
  )
}
