import { Glyph } from '../art/Glyph.tsx'
import { TECHNIQUES, slotsAt, technique } from '../../core/techniques.ts'
import type { PlayerState } from '../../core/state.ts'

export function Arts({ state, onLearn, onEquip, onUnequip }: {
  state: PlayerState
  onLearn: (id: string) => void
  onEquip: (id: string) => void
  onUnequip: (id: string) => void
}) {
  const slots = slotsAt(state.realm)
  const equipped = state.equipped

  return (
    <div className="screen">
      <div className="panel">
        <div className="row">
          <span className="k">Equipped</span>
          <span className="v num">{equipped.length} / {slots} slots</span>
        </div>
        <div className="list">
          {equipped.length === 0 && <p className="muted" style={{ fontSize: 12.5 }}>Nothing equipped. Learned arts do nothing until they sit in a slot.</p>}
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
                <span className="cn">{t.name} <span className="han" style={{ fontSize: 10, color: 'var(--text-faint)' }}>{t.zh}</span></span>
                <span className="cd">{t.text}</span>
              </span>
              <span className={`cx${disabled ? ' dim' : ''}`}>{action}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
