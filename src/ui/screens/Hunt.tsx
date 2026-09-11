import { Figure } from '../art/Figure.tsx'
import { Glyph } from '../art/Glyph.tsx'
import { BEASTS } from '../../core/beasts.ts'
import { MATERIALS, count } from '../../core/materials.ts'
import { PILLS, brewable, held } from '../../core/pills.ts'
import type { PillId } from '../../core/pills.ts'
import { canHunt, huntCost, huntCharges, nextChargeAt, quarry, HUNT_MAX_CHARGES } from '../../core/hunt.ts'
import { ratePerSecond } from '../../core/progress.ts'
import { duration, short } from '../../core/format.ts'
import type { PlayerState } from '../../core/state.ts'

/**
 * 狩 The hunt, and everything that comes back from it.
 *
 * This screen used to be called Sect and held seven unrelated things — the hunt, the
 * satchel, the pills, the ladder of realms, the heavenly flames, the bestiary and the
 * button that deletes your character. A tab has to answer one question, and this one
 * answers "what do I go out and get?": take a beast, carry the materials home, burn
 * them into pills. The flames went to the Body, the ladder to Cultivate, and the
 * cultivator's own record to the hall where the rest of the line is kept.
 */
const RANK_TIER: Record<number, [string, string, string]> = {
  1: ['#4A1E08', '#7C3411', '#A65A22'],
  2: ['#8B3D10', '#D0741C', '#F0B25C'],
  3: ['#C06A1E', '#FCE2AA', '#FFFBEE'],
}
const MAT_GLYPH: Record<string, string> = { hide: 'g-stone', core: 'g-cauldron', essence: 'g-talisman' }

export function Hunt({ state, now, onHunt, onBrew, onTakePill }: {
  state: PlayerState
  now: number
  onHunt: () => void
  onBrew: (id: PillId) => void
  onTakePill: (id: PillId) => void
}) {
  const ready = canHunt(state, now)
  const charges = huntCharges(state, now)
  const nextAt = nextChargeAt(state, now)
  const waiting = nextAt ? Math.max(0, nextAt - now) / 1000 : 0
  const broke = charges > 0 && state.qi < huntCost(state)
  const pool = quarry(state)
  // "Needs 150 qi" on a fresh save is a dead end unless it also says how long that is.
  const rate = ratePerSecond(state, now)
  const untilAfford = rate > 0 ? (huntCost(state) - state.qi) / rate : Infinity

  return (
    <div className="screen">
      <p className="label">The hunt <span className="han">狩</span></p>

      <div className="panel">
        <div className="charges" aria-label={`${charges} of ${HUNT_MAX_CHARGES} hunts held`}>
          {Array.from({ length: HUNT_MAX_CHARGES }, (_, i) => (
            <i key={i} className={i < charges ? 'on' : ''} />
          ))}
        </div>
        <div className="row">
          <span className="k">Hunts held</span>
          <span className="v num">{charges} of {HUNT_MAX_CHARGES}</span>
        </div>
        <div className="row">
          <span className="k">Cost of one</span>
          <span className="v num">{short(huntCost(state))} qi</span>
        </div>
        {waiting > 0 && (
          <div className="row">
            <span className="k">Next returns in</span>
            <span className="v num dim">{duration(waiting)}</span>
          </div>
        )}
        <div className="row">
          <span className="k">Quarry within reach</span>
          <span className="v num dim">{pool.length} of {BEASTS.length}</span>
        </div>
        <button className="cta" onClick={onHunt} disabled={!ready}>
          {ready ? 'Hunt'
            : broke ? `Needs ${short(huntCost(state) - state.qi)} more qi · ${duration(untilAfford)}`
            : waiting > 0 ? `No hunts held · next in ${duration(waiting)}`
            : 'Nothing to hunt yet'}
        </button>
        <p className="hint">
          A hunt costs five minutes of gathering and returns materials and insight —
          the two things meridians are bought with. Charges come back on their own
          whether the app is open or not and stop at {HUNT_MAX_CHARGES}, so checking in
          five times an evening earns no more than checking in once.
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

      <p className="label">The cauldron <span className="han">丹</span></p>
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
      <p className="hint">
        Pills and meridians draw on the same satchel. Brewing one you will not swallow
        is a channel you do not open.
      </p>

      <p className="label">Bestiary · {state.seenBeasts.length} of {BEASTS.length} taken</p>
      <div className="grid">
        {BEASTS.map((b) => {
          const seen = state.seenBeasts.includes(b.id)
          const reachable = b.realm <= state.realm
          const [lo, mid, hi] = RANK_TIER[b.rank]
          return (
            <div className="beast" key={b.id} title={seen ? b.note : `Found at realm ${b.realm}`}>
              <div style={seen ? { ['--flame-lo' as string]: lo, ['--flame-mid' as string]: mid, ['--flame-hi' as string]: hi } : undefined}>
                <Figure symbol={b.symbol} size={72} dim={!seen} label={seen ? `${b.name}. ${b.note}` : undefined} />
              </div>
              <span className="bn" style={seen ? undefined : { color: 'var(--stone)' }}>{seen ? b.name : '???'}</span>
              <span className="bz han">{seen ? b.zh : '—'}</span>
              <span className="brk">{seen ? MATERIALS[b.rank - 1].name : reachable ? 'in reach' : `realm ${b.realm}`}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
