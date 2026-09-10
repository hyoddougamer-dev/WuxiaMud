import { useMemo, useState } from 'react'
import { Figure } from '../art/Figure.tsx'
import { PATH_LIST, PATHS } from '../../core/paths.ts'
import { SEALS, randomName, randomSeal, cleanName, type Seal } from '../../core/names.ts'
import { technique } from '../../core/techniques.ts'
import { OFF_PATH_BONUS, lineageBonus, type Ancestor } from '../../core/ancestry.ts'
import type { PathId } from '../../core/paths.ts'
import type { CreateOptions } from '../../net/session.ts'

const ART: Record<PathId, string> = { sword: 's-sword', blade: 's-blade' }
const rnd = () => Math.random()

/** Rate over 24h on a path's own clock, drawn small enough to read as a shape. */
function Curve({ path }: { path: PathId }) {
  const d = useMemo(() => {
    const p = PATHS[path]
    let s = ''
    for (let t = 0; t <= 24.001; t += 0.75) {
      const x = 1 + (t / 24) * 102
      const y = 20 - p.rateAt(t) * 18
      s += (t === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1)
    }
    return s
  }, [path])
  return (
    <svg viewBox="0 0 104 22" width="100%" height="22" preserveAspectRatio="none"
         role="img" aria-label={`${PATHS[path].name}: generation over 24 hours`}>
      <path d={`${d}L103 20L1 20Z`} fill="var(--flame-mid)" opacity=".14" />
      <path d={d} fill="none" stroke="var(--flame-mid)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="1" y1="20" x2="103" y2="20" stroke="var(--line)" strokeWidth="1" />
    </svg>
  )
}

export function Choose({ line, onChoose }: {
  line: Ancestor[]
  onChoose: (path: PathId, opts: CreateOptions) => void
}) {
  const [sel, setSel] = useState<PathId | null>(null)
  const [name, setName] = useState(() => randomName(rnd))
  const [seal, setSeal] = useState<Seal>(() => randomSeal(rnd))
  /**
   * `undefined` means "hasn't chosen", `null` means "chose to carry nothing".
   *
   * A useState initialiser runs once, on mount — and this screen mounts the instant
   * a cultivator ends, which is *before* the freshly written line arrives as a prop.
   * Capturing the default there silently dropped every inheritance made by ascending,
   * while inheriting worked fine on a cold start. Deriving it each render instead
   * means late props are simply used.
   */
  const [heir, setHeir] = useState<string | null | undefined>(undefined)
  const effectiveHeir = heir === undefined ? (line.length ? line[line.length - 1].id : null) : heir

  const chosen = line.find((a) => a.id === effectiveHeir)
  const bonus = lineageBonus(line)

  return (
    <div className="picker">
      <div>
        <p className="label">Ninefold <span className="han">九重</span></p>
        <h1>{line.length ? `Generation ${line.length + 1}` : 'Begin a line'}</h1>
      </div>

      {line.length > 0 && (
        <div className="notice">
          {line.length === 1 ? 'One forebear' : `${line.length} forebears`} stand behind you.
          The ground is warmer by <strong>{Math.round(bonus * 100)}%</strong>.
        </div>
      )}

      <div className="panel">
        <p className="label">Your name</p>
        <div className="namerow">
          <input
            className="nameinput"
            value={name}
            maxLength={24}
            aria-label="Cultivator name"
            onChange={(e) => setName(e.target.value)}
          />
          <button className="mini" onClick={() => setName(randomName(rnd))}>reroll</button>
        </div>
        <p className="label" style={{ marginTop: 4 }}>Your seal</p>
        <div className="seals">
          {SEALS.map((s) => (
            <button
              key={s}
              className={`sealbtn han${s === seal ? ' on' : ''}`}
              aria-pressed={s === seal}
              onClick={() => setSeal(s)}
            >{s}</button>
          ))}
        </div>
        <p className="hint">This is what will sign the art you leave behind.</p>
      </div>

      {line.length > 0 && (
        <div className="panel">
          <p className="label">Carry an art forward</p>
          {line.slice().reverse().map((a) => {
            const t = technique(a.techniqueId)
            const off = sel && a.path !== sel
            return (
              <button
                key={a.id}
                className={`card${effectiveHeir === a.id ? ' on' : ''}`}
                onClick={() => setHeir(effectiveHeir === a.id ? null : a.id)}
              >
                <span className="sealsm han">{a.seal}</span>
                <span className="cb">
                  <span className="cn">{a.artName}</span>
                  <span className="cd">{t?.text ?? '—'} · sealed by {a.name}</span>
                  {off && <span className="cd" style={{ color: 'var(--jade)' }}>
                    off-path · +{Math.round(OFF_PATH_BONUS * 100)}% stronger
                  </span>}
                </span>
                <span className={`cx${effectiveHeir === a.id ? '' : ' dim'}`}>
                  {effectiveHeir === a.id ? 'carried' : 'carry'}
                </span>
              </button>
            )
          })}
          <p className="hint">Costs no upkeep — the ancestor carries it, not you.</p>
        </div>
      )}

      <p className="label">Your path</p>
      <p className="hint" style={{ marginTop: -6 }}>
        A schedule, not a power level. Both make the same over a day; they differ in when.
      </p>

      {PATH_LIST.map((p) => (
        <button
          key={p.id}
          className={`pick${sel === p.id ? ' sel' : ''}`}
          onClick={() => setSel(p.id)}
          aria-pressed={sel === p.id}
        >
          <Figure symbol={ART[p.id]} size={66} flames={sel === p.id} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="pn">{p.name}</span> <span className="pz han">{p.zh}</span>
            <span className="pd" style={{ display: 'block' }}>{p.blurb}</span>
            <Curve path={p.id} />
            <span className="curvekey">
              {p.id === 'sword' ? 'best if you open it once a day' : 'best if you open it often'}
            </span>
          </span>
        </button>
      ))}

      <button
        className="cta"
        disabled={!sel || !cleanName(name)}
        onClick={() => sel && onChoose(sel, {
          name: cleanName(name),
          seal,
          inheritFrom: chosen?.id,
        })}
      >
        {line.length ? 'Take up the line' : 'Begin cultivating'}
      </button>
    </div>
  )
}
