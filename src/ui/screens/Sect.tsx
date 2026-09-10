import { Figure } from '../art/Figure.tsx'
import { Glyph } from '../art/Glyph.tsx'
import { REALMS, V1_CEILING, realmColour } from '../../core/realms.ts'
import { BEASTS } from '../../core/beasts.ts'
import { FLAMES } from '../../core/flames.ts'
import { PATHS } from '../../core/paths.ts'
import { MATERIALS, count } from '../../core/materials.ts'
import { PILLS, brewable, held } from '../../core/pills.ts'
import type { PillId } from '../../core/pills.ts'
import { canHunt, huntCost, huntCharges, nextChargeAt, HUNT_MAX_CHARGES } from '../../core/hunt.ts'
import { duration, short } from '../../core/format.ts'
import type { PlayerState } from '../../core/state.ts'

const RANK_TIER: Record<number, [string, string, string]> = {
  1: ['#4A1E08', '#7C3411', '#A65A22'],
  2: ['#8B3D10', '#D0741C', '#F0B25C'],
  3: ['#C06A1E', '#FCE2AA', '#FFFBEE'],
}
const MAT_GLYPH: Record<string, string> = { hide: 'g-stone', core: 'g-cauldron', essence: 'g-talisman' }

export function Sect({ state, now, onHunt, onBrew, onTakePill, onPickFlame, onWipe }: {
  state: PlayerState
  now: number
  onHunt: () => void
  onBrew: (id: PillId) => void
  onTakePill: (id: PillId) => void
  onPickFlame: (id: string | null) => void
  onWipe: () => void
}) {
  const path = PATHS[state.path]
  const huntReady = canHunt(state, now)
  const charges = huntCharges(state, now)
  const nextAt = nextChargeAt(state, now)
  const waiting = nextAt ? Math.max(0, nextAt - now) / 1000 : 0
  const broke = charges > 0 && state.qi < huntCost(state)

  return (
    <div className="screen">
      <p className="label">The hunt <span className="han">狩</span></p>
      <div className="panel">
        <p className="hint">
          Spend stored qi to hunt a spirit beast. Beasts give the materials every pill is
          made of, and the insight every art is bought with.
        </p>
        <div className="row">
          <span className="k">Hunts held</span>
          <span className="v num">{charges} of {HUNT_MAX_CHARGES}</span>
        </div>
        <div className="bar"><i style={{ width: `${(charges / HUNT_MAX_CHARGES) * 100}%` }} /></div>
        <div className="row">
          <span className="k">Cost</span>
          <span className="v num">{short(huntCost(state))} qi · five minutes of gathering</span>
        </div>
        {waiting > 0 && (
          <div className="row">
            <span className="k">Next hunt returns in</span>
            <span className="v num dim">{duration(waiting)}</span>
          </div>
        )}
        <button className="cta" onClick={onHunt} disabled={!huntReady}>
          {huntReady ? 'Hunt'
            : broke ? `Needs ${short(huntCost(state))} qi`
            : waiting > 0 ? `No hunts held · next in ${duration(waiting)}`
            : 'Nothing to hunt yet'}
        </button>
        <p className="hint">
          Hunts return on their own whether the app is open or not, and stop at{' '}
          {HUNT_MAX_CHARGES}. Checking in five times an evening earns no more than checking
          in once — which is the only reason both paths can afford the same meridians.
        </p>
      </div>

      <p className="label">Satchel</p>
      <div className="matrow">
        {MATERIALS.map((mt) => (
          <div className="mat" key={mt.id}>
            <Glyph symbol={MAT_GLYPH[mt.id]} size={22} />
            <span className="mn">{mt.name}</span>
            <span className="mv num">{count(state.satchel, mt.id)}</span>
          </div>
        ))}
      </div>

      <p className="label">Pills <span className="han">丹</span></p>
      <div className="list">
        {PILLS.map((p) => {
          const have = held(state.pills, p.id)
          const can = brewable(state.satchel, p)
          const costText = Object.entries(p.cost).map(([k, v]) => `${v}× ${k}`).join(' + ')
          return (
            <div className="card" key={p.id}>
              <span className="cb">
                <span className="cn">{p.name} <span className="han dim-han">{p.zh}</span></span>
                <span className="cd">{p.text}</span>
                <span className="cd dim">{costText}</span>
              </span>
              <span className="pillcol">
                {have > 0 && (
                  <button
                    className="mini on"
                    onClick={() => onTakePill(p.id)}
                    disabled={p.id === 'tribulation' && state.pillPrimed}
                  >
                    {p.id === 'tribulation' && state.pillPrimed ? 'primed' : `take (${have})`}
                  </button>
                )}
                <button className="mini" onClick={() => onBrew(p.id)} disabled={!can}>brew</button>
              </span>
            </div>
          )
        })}
      </div>

      <p className="label">The nine realms</p>
      <div className="panel">
        <div className="ladder">
          {REALMS.map((r) => {
            const locked = r.id > V1_CEILING || r.id > state.realm + 1
            const here = r.id === state.realm
            return (
              <div className={`rung${locked ? ' off' : ''}`} key={r.id}>
                <span
                  className={`dot${locked ? ' locked' : ''}${here ? ' here' : ''}`}
                  style={{ background: locked ? undefined : realmColour(r.id) }}
                >{r.id}</span>
                <span className="rz han" style={{ color: locked ? undefined : 'var(--text)' }}>{r.zh}</span>
                <span className="rn">{r.name}</span>
              </div>
            )
          })}
        </div>
        <p className="hint">
          All nine are climbable. The last two are most of the game — a Great Vehicle
          tribulation opens at 52%, and nothing but surplus qi, a quiet heart and the
          extraordinary vessels moves that number.
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
                <span className="cn">{f.name} <span className="han dim-han">{f.zh}</span></span>
                <span className="cd">{f.rule}</span>
              </span>
              <span className={`cx${eligible ? '' : ' dim'}`}>{on ? 'held' : eligible ? 'take' : `realm ${f.realm}`}</span>
            </button>
          )
        })}
      </div>

      <p className="label">Bestiary · {state.seenBeasts.length} of {BEASTS.length} taken</p>
      <div className="grid">
        {BEASTS.map((b) => {
          const seen = state.seenBeasts.includes(b.id)
          const [lo, mid, hi] = RANK_TIER[b.rank]
          return (
            <div className="beast" key={b.id} title={seen ? b.note : 'Not yet hunted'}>
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
