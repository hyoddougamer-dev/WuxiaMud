import { useCallback, useEffect, useRef, useState } from 'react'
import { Sprite } from './ui/art/Sprite.tsx'
import { Icon } from './ui/art/Icon.tsx'
import { Cultivate } from './ui/screens/Cultivate.tsx'
import { Arts } from './ui/screens/Arts.tsx'
import { Lineage } from './ui/screens/Lineage.tsx'
import { Sect } from './ui/screens/Sect.tsx'
import { Choose } from './ui/screens/Choose.tsx'
import { advance, breakThrough, equip, learn, openSession, unequip } from './core/progress.ts'
import { newPlayer, type PlayerState } from './core/state.ts'
import { slotsAt } from './core/techniques.ts'
import { realmColour } from './core/realms.ts'
import { short, duration } from './core/format.ts'
import * as store from './core/save.ts'
import type { PathId } from './core/paths.ts'

type Tab = 'cultivate' | 'lineage' | 'arts' | 'sect'

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'cultivate', icon: 'u-cultivate', label: 'Cultivate' },
  { id: 'lineage', icon: 'u-lineage', label: 'Lineage' },
  { id: 'arts', icon: 'u-techniques', label: 'Arts' },
  { id: 'sect', icon: 'u-sect', label: 'Sect' },
]

const TICK_MS = 200
const SAVE_MS = 5000
/** Anything shorter than this isn't worth interrupting the player for. */
const REPORT_FLOOR_SECONDS = 120

interface Welcome { away: number; gained: number; capped: number }

export default function App() {
  const [state, setState] = useState<PlayerState | null>(() => store.load())
  const [tab, setTab] = useState<Tab>('cultivate')
  const [now, setNow] = useState(() => Date.now())
  const [welcome, setWelcome] = useState<Welcome | null>(null)
  const lastSave = useRef(0)

  /** Bring the game forward to real time. Runs on mount and whenever the tab wakes. */
  const resume = useCallback(() => {
    setState((prev) => {
      if (!prev) return prev
      const t = Date.now()
      const { state: advanced, report } = advance(prev, t)
      if (report.elapsedSeconds >= REPORT_FLOOR_SECONDS) {
        setWelcome({ away: report.elapsedSeconds, gained: report.qiGained, capped: report.cappedBy })
      }
      return openSession({ ...advanced, lastSeenAt: t }, t)
    })
    setNow(Date.now())
  }, [])

  useEffect(() => { if (state) resume() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [])

  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'visible') resume() }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('focus', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('focus', onVis)
    }
  }, [resume])

  /* The tick only advances the clock; every gain is computed by the same pure
     `advance` the server will run. Nothing accrues in the render loop. */
  useEffect(() => {
    if (!state) return
    const h = window.setInterval(() => {
      const t = Date.now()
      setNow(t)
      setState((prev) => {
        if (!prev) return prev
        const { state: next } = advance(prev, t)
        return { ...next, activeSeconds: prev.activeSeconds + TICK_MS / 1000 }
      })
    }, TICK_MS)
    return () => window.clearInterval(h)
  }, [state !== null])

  useEffect(() => {
    if (!state) return
    const t = Date.now()
    if (t - lastSave.current < SAVE_MS) return
    lastSave.current = t
    store.save(state)
  }, [state])

  useEffect(() => {
    const flush = () => { setState((prev) => { if (prev) store.save(prev); return prev }) }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', flush)
    }
  }, [])

  const start = (path: PathId) => {
    const fresh = newPlayer(path, Date.now())
    store.save(fresh)
    setState(fresh)
  }

  if (!state) return (<><Sprite /><div className="app"><Choose onChoose={start} /></div></>)

  const ramp = {
    ['--flame-lo' as string]: realmColour(Math.max(1, state.realm - 2)),
    ['--flame-mid' as string]: realmColour(state.realm),
    ['--flame-hi' as string]: realmColour(Math.min(9, state.realm + 2)),
  }

  return (
    <>
      <Sprite />
      <div className="app" style={ramp}>
        {tab === 'cultivate' && (
          <Cultivate state={state} now={now} onBreakThrough={() => setState((s) => (s ? breakThrough(s, Date.now()) : s))} />
        )}
        {tab === 'lineage' && <Lineage state={state} />}
        {tab === 'arts' && (
          <Arts
            state={state}
            onLearn={(id) => setState((s) => (s ? learn(s, id) : s))}
            onEquip={(id) => setState((s) => (s ? equip(s, id, slotsAt(s.realm)) : s))}
            onUnequip={(id) => setState((s) => (s ? unequip(s, id) : s))}
          />
        )}
        {tab === 'sect' && (
          <Sect
            state={state}
            onPickFlame={(id) => setState((s) => (s ? { ...s, flame: id } : s))}
            onWipe={() => { store.wipe(); setState(null); setTab('cultivate') }}
          />
        )}

        <nav className="nav">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} aria-current={tab === t.id}>
              <Icon symbol={t.icon} size={19} />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        {welcome && (
          <div className="scrim" role="dialog" aria-modal="true" aria-label="While you were away">
            <div className="modal">
              <h2>While you were away</h2>
              <p>
                You cultivated for <strong>{duration(Math.min(welcome.away, welcome.away - welcome.capped))}</strong> and
                gathered <strong>{short(welcome.gained)}</strong> qi.
              </p>
              {welcome.capped > 60 && (
                <p>
                  You were gone {duration(welcome.away)}. Offline cultivation is capped, so{' '}
                  {duration(welcome.capped)} of that went unused — Cloud Step and Void Step raise the cap.
                </p>
              )}
              <button className="cta" onClick={() => setWelcome(null)}>Continue</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
