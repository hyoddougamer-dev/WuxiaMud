import { useMemo, useState } from 'react'
import { Figure } from '../art/Figure.tsx'
import { PATH_LIST, PATHS } from '../../core/paths.ts'
import { ORIGINS, origin } from '../../core/origins.ts'
import { SEALS, SEAL_MEANING, randomName, cleanName, type Seal } from '../../core/names.ts'
import { technique } from '../../core/techniques.ts'
import { newPlayer } from '../../core/state.ts'
import { firstMorning, whatNeverLeaves, whereThisEnds, SEAL_VOW } from '../../core/story.ts'
import { OFF_PATH_BONUS, inheritedMeridians, lineageBonus, type Ancestor } from '../../core/ancestry.ts'
import type { OriginId } from '../../core/origins.ts'
import type { PathId } from '../../core/paths.ts'
import type { CreateOptions } from '../../net/session.ts'

const PATH_ART: Record<PathId, string> = { sword: 's-sword', blade: 's-blade' }
const rnd = () => Math.random()

/** Rate over a day on a path's own clock, drawn small enough to read as a shape. */
function Curve({ path }: { path: PathId }) {
  const d = useMemo(() => {
    const p = PATHS[path]
    let s = ''
    for (let t = 0; t <= 24.001; t += 0.75) {
      s += (t === 0 ? 'M' : 'L') +
        (1 + (t / 24) * 102).toFixed(1) + ' ' + (20 - p.rateAt(t) * 18).toFixed(1)
    }
    return s
  }, [path])
  return (
    <svg viewBox="0 0 104 22" width="100%" height="22" preserveAspectRatio="none"
         role="img" aria-label={`${PATHS[path].name}: generation across a day`}>
      <path d={`${d}L103 20L1 20Z`} fill="var(--flame-mid)" opacity=".14" />
      <path d={d} fill="none" stroke="var(--flame-mid)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="1" y1="20" x2="103" y2="20" stroke="var(--line)" strokeWidth="1" />
    </svg>
  )
}

type Step = 'path' | 'origin' | 'self' | 'line' | 'confirm'

export function Choose({ line, onChoose }: {
  line: Ancestor[]
  onChoose: (path: PathId, opts: CreateOptions) => void
}) {
  const [step, setStep] = useState<Step>('path')
  const [path, setPath] = useState<PathId | null>(null)
  const [orig, setOrig] = useState<OriginId | null>(null)
  const [name, setName] = useState(() => randomName(rnd))
  const [seal, setSeal] = useState<Seal>('道')
  const [heir, setHeir] = useState<string | null | undefined>(undefined)

  /* `undefined` means "hasn't chosen", `null` means "chose to carry nothing". A
     useState initialiser runs once, on mount — and this screen mounts the instant a
     cultivator ends, before the freshly written line arrives as a prop. */
  const effectiveHeir = heir === undefined ? (line.length ? line[line.length - 1].id : null) : heir
  const carried = line.find((a) => a.id === effectiveHeir)

  /* The confirmation screen shows the real opening state, built by the same function
     that will build the cultivator a second later. Anything it reports — the satchel,
     the hunts held, the cost of the first breakthrough after the origin's discount —
     is therefore what actually happens, rather than a sentence describing it. */
  const now = Date.now()
  const preview = useMemo(() => (path && orig ? newPlayer(path, now, {
    name: cleanName(name) || 'Nameless',
    seal,
    origin: orig,
    generation: line.length + 1,
    lineBonus: lineageBonus(line),
    meridians: inheritedMeridians(line),
    inherited: carried
      ? { techniqueId: carried.techniqueId, from: carried.name, fromPath: carried.path, artName: carried.artName }
      : null,
  }) : null), [path, orig, seal, name, carried, line, now])

  const steps: Step[] = line.length
    ? ['path', 'origin', 'self', 'line', 'confirm']
    : ['path', 'origin', 'self', 'confirm']
  const at = steps.indexOf(step)
  const canGo =
    step === 'path' ? !!path :
    step === 'origin' ? !!orig :
    step === 'self' ? !!cleanName(name) :
    true

  const go = (d: 1 | -1) => setStep(steps[Math.min(steps.length - 1, Math.max(0, at + d))])

  return (
    <div className="picker">
      <div className="pk-head">
        <p className="label">Ninefold <span className="han">九重</span></p>
        <h1>{line.length ? `Generation ${line.length + 1}` : 'Begin a line'}</h1>
        <div className="pips" aria-label={`Step ${at + 1} of ${steps.length}`}>
          {steps.map((s, i) => <i key={s} className={i <= at ? 'on' : ''} />)}
        </div>
      </div>

      {/* ---------------------------------------------------------- 1 · PATH */}
      {step === 'path' && (
        <>
          <p className="ask">When will you open this game?</p>
          <p className="hint">
            Both paths make the same over a day. They differ in <em>when</em> it lands, so
            pick the one that matches your life rather than the one that sounds stronger.
          </p>
          {PATH_LIST.map((p) => (
            <button key={p.id} className={`pick${path === p.id ? ' sel' : ''}`}
                    onClick={() => setPath(p.id)} aria-pressed={path === p.id}>
              <Figure symbol={PATH_ART[p.id]} size={68} flames={path === p.id} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="pn">{p.name}</span> <span className="pz han">{p.zh}</span>
                <span className="pd">{p.blurb}</span>
                <Curve path={p.id} />
                <span className="curvekey">
                  {p.id === 'sword' ? 'once a day, or less' : 'several times an evening'}
                </span>
              </span>
            </button>
          ))}
        </>
      )}

      {/* -------------------------------------------------------- 2 · ORIGIN */}
      {step === 'origin' && (
        <>
          <p className="ask">Where were you before this?</p>
          <p className="hint">
            Each origin gives you something on the first morning and something that never
            goes away.
          </p>
          {ORIGINS.map((o) => (
            <button key={o.id} className={`pick col${orig === o.id ? ' sel' : ''}`}
                    onClick={() => setOrig(o.id)} aria-pressed={orig === o.id}>
              <span className="orow">
                <Figure symbol={o.art} size={54} flames={orig === o.id} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="pn">{o.name}</span> <span className="pz han">{o.zh}</span>
                  <span className="pd">{o.story}</span>
                </span>
              </span>
              <span className="effects">
                <span className="eff"><b>Brings</b>{o.kit}</span>
                <span className="eff keeps"><b>Keeps</b>{o.trait}</span>
              </span>
            </button>
          ))}
        </>
      )}

      {/* ---------------------------------------------------------- 3 · SELF */}
      {step === 'self' && (
        <>
          <p className="ask">Who are you?</p>
          <p className="hint">
            Your seal signs the one art you leave behind when you can climb no further.
            It is the only mark of you that outlives the character.
          </p>
          <div className="panel">
            <p className="label">Name</p>
            <div className="namerow">
              <input className="nameinput" value={name} maxLength={24}
                     aria-label="Cultivator name"
                     onChange={(e) => setName(e.target.value)} />
              <button className="mini" onClick={() => setName(randomName(rnd))}>reroll</button>
            </div>
            <p className="label" style={{ marginTop: 6 }}>Seal · {SEAL_MEANING[seal]}</p>
            <div className="seals">
              {SEALS.map((s) => (
                <button key={s} className={`sealbtn han${s === seal ? ' on' : ''}`}
                        aria-pressed={s === seal} aria-label={`${s}, ${SEAL_MEANING[s]}`}
                        onClick={() => setSeal(s)}>{s}</button>
              ))}
            </div>
            <p className="vow">{SEAL_VOW[seal]}</p>
          </div>
        </>
      )}

      {/* ---------------------------------------------------------- 4 · LINE */}
      {step === 'line' && (
        <>
          <p className="ask">What do you carry forward?</p>
          <p className="hint">
            An inherited art costs no upkeep — the ancestor carries it, not you — and is
            worth more when it comes from a path that is not yours.
          </p>
          {line.slice().reverse().map((a) => {
            const t = technique(a.techniqueId)
            const off = path && a.path !== path
            return (
              <button key={a.id} className={`card${effectiveHeir === a.id ? ' on' : ''}`}
                      onClick={() => setHeir(effectiveHeir === a.id ? null : a.id)}>
                <span className="sealsm han">{a.seal}</span>
                <span className="cb">
                  <span className="cn">{a.artName}</span>
                  <span className="cd">{t?.text ?? '—'} · sealed by {a.name}</span>
                  {off && (
                    <span className="cd" style={{ color: 'var(--jade)' }}>
                      off-path · +{Math.round(OFF_PATH_BONUS * 100)}% stronger
                    </span>
                  )}
                </span>
                <span className={`cx${effectiveHeir === a.id ? '' : ' dim'}`}>
                  {effectiveHeir === a.id ? 'carried' : 'carry'}
                </span>
              </button>
            )
          })}
          <button className={`card${effectiveHeir === null ? ' on' : ''}`} onClick={() => setHeir(null)}>
            <span className="cb">
              <span className="cn">Carry nothing</span>
              <span className="cd">Begin with only what your origin gave you.</span>
            </span>
          </button>
        </>
      )}

      {/* ------------------------------------------------------- 5 · CONFIRM */}
      {step === 'confirm' && path && orig && preview && (
        <>
          <p className="ask">This is who you are.</p>

          <div className="panel sheet">
            <div className="sheet-top">
              <div className="t9"><Figure symbol={PATH_ART[path]} size={78} flames motes={8} /></div>
              <div className="sheet-id">
                <p className="sn">{cleanName(name) || 'Nameless'}</p>
                <p className="sd">
                  {PATHS[path].name} <span className="han">{PATHS[path].zh}</span>
                  {' · '}{origin(orig).name} <span className="han">{origin(orig).zh}</span>
                </p>
                <p className="sd">Generation {line.length + 1}</p>
              </div>
              <span className="sealbig han" aria-label={`Seal: ${seal}, ${SEAL_MEANING[seal]}`}>{seal}</span>
            </div>
            <p className="quote">{origin(orig).story}</p>
          </div>

          <p className="label">The first morning</p>
          <div className="panel">
            <div className="ledger">
              {firstMorning(preview, now).map((l) => (
                <div className="lr" key={l.k}><span>{l.k}</span><b>{l.v}</b></div>
              ))}
            </div>
          </div>

          <p className="label">What never leaves you</p>
          <div className="panel">
            {whatNeverLeaves(preview).map((l) => (
              <p className={`keep${l.keeps ? '' : ' minor'}`} key={l.k}>
                <b>{l.k}</b>{l.v}
              </p>
            ))}
          </div>

          <p className="label">Where this ends</p>
          <div className="notice">{whereThisEnds(preview)}</div>

          <p className="hint centered">
            The path, the origin and the seal are fixed from here. They are who you were
            before the first breath, and nothing in nine realms undoes that.
          </p>
        </>
      )}

      <div className="pk-nav">
        {at > 0 && <button className="cta ghost" onClick={() => go(-1)}>Back</button>}
        {step !== 'confirm' ? (
          <button className="cta" disabled={!canGo} onClick={() => go(1)}>Next</button>
        ) : (
          <button className="cta" onClick={() => path && onChoose(path, {
            name: cleanName(name), seal, origin: orig ?? 'rogue', inheritFrom: carried?.id,
          })}>
            {line.length ? 'Take up the line' : 'Begin cultivating'}
          </button>
        )}
      </div>
    </div>
  )
}
