import { Glyph } from '../art/Glyph.tsx'
import { RELICS, SLOTS, SLOT_NAME, owns, relic, worn, type Slot } from '../../core/relics.ts'
import { WARDENS } from '../../core/wardens.ts'
import { MATERIALS, count } from '../../core/materials.ts'
import { PILLS, brewable, held } from '../../core/pills.ts'
import type { PillId } from '../../core/pills.ts'
import type { PlayerState } from '../../core/state.ts'

/**
 * 行囊 What you are carrying, and what of it you have put on.
 *
 * Its own screen, deliberately apart from Arts. The two systems are opposites and
 * sitting them together would blur both: an art is knowledge bought with insight, six
 * at a time, costing qi every second to hold and refinable forever; a relic is an
 * object taken off something that did not want to give it up, one to a kind, free to
 * carry and never improved. Nothing here raises generation — that is what arts are
 * for — so nothing here competes with them.
 */
const MAT_GLYPH: Record<string, string> = { hide: 'g-stone', core: 'g-cauldron', essence: 'g-talisman' }

export function Gear({ state, onWear, onBrew, onTakePill }: {
  state: PlayerState
  onWear: (id: string | null, slot: Slot) => void
  onBrew: (id: PillId) => void
  onTakePill: (id: PillId) => void
}) {
  const held0 = state.relics.length

  return (
    <div className="screen">
      <p className="label">Worn <span className="han">法寶</span></p>
      <div className="slots">
        {SLOTS.map((slot) => {
          const on = worn(state, slot)
          return (
            <div key={slot} className={`slot${on ? ' filled' : ''}`}>
              <span className="sk han">{SLOT_NAME[slot].zh}</span>
              {on ? <Glyph symbol={on.glyph} size={26} /> : <span className="empty">—</span>}
              <span className="sn">{on ? on.name : SLOT_NAME[slot].name}</span>
            </div>
          )
        })}
      </div>
      <p className="hint">
        One to a slot, changeable whenever you like — the cost of a relic was taking it,
        not wearing it. No relic touches qi generation: that is what arts are for, and a
        relic that gave it would just be an art you could not refine.
      </p>

      {SLOTS.map((slot) => {
        const pool = RELICS.filter((r) => r.slot === slot)
        return (
          <div key={slot}>
            <p className="label">
              {SLOT_NAME[slot].name} <span className="han">{SLOT_NAME[slot].zh}</span>
            </p>
            <p className="hint" style={{ marginBottom: 8 }}>{SLOT_NAME[slot].note}</p>
            <div className="list">
              {pool.map((r) => {
                const have = owns(state, r.id)
                const on = state.wearing[slot] === r.id
                const w = WARDENS.find((x) => x.id === r.from)
                return (
                  <button
                    key={r.id}
                    className={`card${on ? ' on' : ''}${have ? '' : ' locked'}`}
                    disabled={!have}
                    onClick={() => onWear(on ? null : r.id, slot)}
                  >
                    <Glyph symbol={r.glyph} size={26} />
                    <span className="cb">
                      <span className="cn">{r.name} <span className="han dim-han">{r.zh}</span></span>
                      <span className="cd">{have ? r.text : `Taken from ${w?.name ?? 'a warden'}`}</span>
                      <span className="cd dim">{have ? r.note : `${w?.zh ?? ''} · not yet beaten`}</span>
                    </span>
                    <span className={`cx${have ? '' : ' dim'}`}>
                      {on ? 'worn' : have ? 'put on' : 'unclaimed'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      <p className="label">Satchel · {held0} of {RELICS.length} relics taken</p>
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
                  <button className="mini on" onClick={() => onTakePill(p.id)}
                          disabled={p.id === 'tribulation' && state.pillPrimed}>
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
        Pills and meridians draw on the same satchel. Brewing one you will not swallow is
        a channel you do not open.
      </p>

      <p className="label">Wardens put down · {state.wardens.length} of {WARDENS.length}</p>
      <div className="list">
        {WARDENS.map((w) => {
          const done = state.wardens.includes(w.id)
          const r = relic(w.relic)!
          return (
            <div className={`card${done ? ' on' : ' locked'}`} key={w.id}>
              <span className="cb">
                <span className="cn">{done ? w.name : '???'} <span className="han dim-han">{done ? w.zh : ''}</span></span>
                <span className="cd">{done ? r.name : `Somewhere under a hunting ground`}</span>
              </span>
              <span className={`cx${done ? '' : ' dim'}`}>{done ? 'taken' : 'standing'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
