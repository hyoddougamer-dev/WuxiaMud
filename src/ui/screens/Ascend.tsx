import { useState } from 'react'
import { Figure } from '../art/Figure.tsx'
import { technique } from '../../core/techniques.ts'
import { realm } from '../../core/realms.ts'
import type { PlayerState } from '../../core/state.ts'

/**
 * The one moment the whole fiction is built around: a life ends, and one art with a
 * name on it does not. The player types the name — it stops being a prestige button
 * and becomes an act of authorship.
 */
export function AscendModal({ state, onSeal, onCancel }: {
  state: PlayerState
  onSeal: (artName: string, techniqueId: string) => void
  onCancel: () => void
}) {
  const learned = state.learned.map(technique).filter((t): t is NonNullable<typeof t> => !!t)
  const [pick, setPick] = useState(learned[0]?.id ?? '')
  const chosen = technique(pick)
  const [name, setName] = useState(chosen?.name ?? '')

  return (
    <div className="scrim" role="dialog" aria-modal="true" aria-label="Ascend">
      <div className="modal gold tall">
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="t9"><Figure symbol="s-ascend" size={104} flames motes={14} /></div>
        </div>
        <h2>You go no further.</h2>
        <p>
          {state.name} reached <strong>{realm(state.realm).name}</strong>. Seal one art with
          your name, and whoever takes up the line may carry it.
        </p>

        <p className="label">Which art</p>
        <div className="list scrolly">
          {learned.map((t) => (
            <button
              key={t.id}
              className={`card${pick === t.id ? ' on' : ''}`}
              onClick={() => { setPick(t.id); setName(t.name) }}
            >
              <span className="cb">
                <span className="cn">{t.name}</span>
                <span className="cd">{t.text}</span>
              </span>
            </button>
          ))}
        </div>

        <p className="label">Call it what you like</p>
        <div className="namerow">
          <input
            className="nameinput gold"
            value={name}
            maxLength={32}
            aria-label="Name of the art you are sealing"
            onChange={(e) => setName(e.target.value)}
          />
          <span className="sealsm han">{state.seal}</span>
        </div>

        <button className="cta gold" disabled={!pick || !name.trim()} onClick={() => onSeal(name, pick)}>
          Seal it and ascend
        </button>
        <button className="cta ghost" onClick={onCancel}>Not yet</button>
      </div>
    </div>
  )
}
