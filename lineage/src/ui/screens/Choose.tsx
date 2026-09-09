import { useState } from 'react'
import { Figure } from '../art/Figure.tsx'
import { PATH_LIST } from '../../core/paths.ts'
import type { PathId } from '../../core/paths.ts'

const ART: Record<PathId, string> = { sword: 's-sword', blade: 's-blade' }

export function Choose({ onChoose }: { onChoose: (p: PathId) => void }) {
  const [sel, setSel] = useState<PathId | null>(null)
  return (
    <div className="picker">
      <div>
        <p className="label">Lineage</p>
        <h1>Choose a path</h1>
      </div>
      <p className="muted" style={{ fontSize: 13.5, marginTop: -6 }}>
        A path is a schedule, not a power level. Both produce roughly the same over a day —
        they differ in <em>when</em> it lands. You can change later; it costs one realm.
      </p>

      {PATH_LIST.map((p) => (
        <button
          key={p.id}
          className={`pick${sel === p.id ? ' sel' : ''}`}
          onClick={() => setSel(p.id)}
          aria-pressed={sel === p.id}
        >
          <Figure symbol={ART[p.id]} size={72} flames={sel === p.id} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="pn">{p.name}</span>{' '}
            <span className="pz han">{p.zh}</span>
            <span className="pd" style={{ display: 'block' }}>{p.blurb}</span>
          </span>
        </button>
      ))}

      <div className="notice">
        {sel === 'sword' && 'Best if you open the game once a day or less.'}
        {sel === 'blade' && 'Best if you open the game several times an evening.'}
        {!sel && 'Pick the one that matches how you actually live, not the one that sounds stronger.'}
      </div>

      <button className="cta" disabled={!sel} onClick={() => sel && onChoose(sel)}>
        Begin cultivating
      </button>
    </div>
  )
}
