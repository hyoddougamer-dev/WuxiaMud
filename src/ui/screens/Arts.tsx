import { Glyph } from '../art/Glyph.tsx'
import { TECHNIQUES, slotsAt, technique, upkeepOf } from '../../core/techniques.ts'
import { modifiers } from '../../core/progress.ts'
import { short } from '../../core/format.ts'
import type { PlayerState } from '../../core/state.ts'

export function Arts({ state, onLearn, onEquip, onUnequip }: {
  state: PlayerState
  onLearn: (id: string) => void
  onEquip: (id: string) => void
  onUnequip: (id: string) => void
}) {
  const slots = slotsAt(state.realm)
  const equipped = state.equipped
  const upkeep = modifiers(state).upkeep

  return (
    <div className="screen">
      <div className="panel">
        <div className="row">
          <span className="k">Equipped</span>
          <span className="v num">{equipped.length} / {slots} slots</span>
        </div>
        <div className="row">
          <span className="k">Total upkeep</span>
          <span className="v num crimson">−{short(upkeep)} qi/s</span>
        </div>
        <div className="list">
          {equipped.length === 0 && <p className="hint">Nothing equipped. Learned arts do nothing until they sit in a slot — and every slot filled costs qi per second, so a full bar is rarely the right bar.</p>}
          {equipped.map((id) => {
            const t = technique(id)!
            return (
              <button key={id} className="card on" onClick={() => onUnequip(id)}>
                <Glyph symbol={t.glyph} />
                <span className="cb">
                  <span className="cn">{t.name}</span>
                  <span className="cd">{t.text}</span>
                </span>
                <span className="cx dim">unequip</span>
              </button>
            )
          })}
        </div>
      </div>

      <p className="label">All arts</p>
      <div className="list">
        {TECHNIQUES.map((t) => {
          const known = state.learned.includes(t.id)
          const on = equipped.includes(t.id)
          const locked = state.realm < t.realm
          const affordable = state.insight >= t.cost
          const full = equipped.length >= slots

          let action: string, disabled: boolean, click: () => void
          if (locked) { action = `realm ${t.realm}`; disabled = true; click = () => {} }
          else if (!known) { action = `${t.cost} insight`; disabled = !affordable; click = () => onLearn(t.id) }
          else if (on) { action = 'equipped'; disabled = false; click = () => onUnequip(t.id) }
          else { action = full ? 'no slot' : 'equip'; disabled = full; click = () => onEquip(t.id) }

          return (
            <button
              key={t.id}
              className={`card${locked ? ' locked' : ''}${on ? ' on' : ''}`}
              onClick={click}
              disabled={disabled}
              aria-label={`${t.name}. ${t.text}. ${action}`}
            >
              <Glyph symbol={t.glyph} />
              <span className="cb">
                <span className="cn">{t.name} <span className="han dim-han">{t.zh}</span></span>
                <span className="cd">{t.text}</span>
                <span className="cd dim">−{short(upkeepOf(t))} qi/s upkeep</span>
              </span>
              <span className={`cx${disabled ? ' dim' : ''}`}>{action}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
