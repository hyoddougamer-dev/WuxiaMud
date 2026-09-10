import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Sprite } from './ui/art/Sprite.tsx'
import { Icon } from './ui/art/Icon.tsx'
import { Cultivate } from './ui/screens/Cultivate.tsx'
import { Arts } from './ui/screens/Arts.tsx'
import { Lineage } from './ui/screens/Lineage.tsx'
import { Sect } from './ui/screens/Sect.tsx'
import { Choose } from './ui/screens/Choose.tsx'
import { advance } from './core/progress.ts'
import { realmColour } from './core/realms.ts'
import { short, duration } from './core/format.ts'
import { makeSession, newNonce } from './net/index.ts'
import type { Action } from './core/actions.ts'
import type { Outcome } from './core/tribulation.ts'
import type { Spoils } from './core/hunt.ts'
import type { PlayerState } from './core/state.ts'
import type { PathId } from './core/paths.ts'
import type { PillId } from './core/pills.ts'

type Tab = 'cultivate' | 'lineage' | 'arts' | 'sect'

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'cultivate', icon: 'u-cultivate', label: 'Cultivate' },
  { id: 'lineage', icon: 'u-lineage', label: 'Lineage' },
  { id: 'arts', icon: 'u-techniques', label: 'Arts' },
  { id: 'sect', icon: 'u-sect', label: 'Sect' },
]

/** How often the display re-projects. Costs nothing: it is arithmetic, not a request. */
const PAINT_MS = 200
/** How often we ask the authority where we really are. */
const SYNC_MS = 15_000
const REPORT_FLOOR_SECONDS = 120

interface Welcome { away: number; gained: number; capped: number }

export default function App() {
  const session = useMemo(makeSession, [])

  /** What the authority last told us. The only thing ever written anywhere. */
  const [truth, setTruth] = useState<PlayerState | null>(null)
  const [booted, setBooted] = useState(false)
  const [tab, setTab] = useState<Tab>('cultivate')
  const [now, setNow] = useState(() => Date.now())
  const [welcome, setWelcome] = useState<Welcome | null>(null)
  const [trial, setTrial] = useState<Outcome | null>(null)
  const [spoils, setSpoils] = useState<Spoils | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  const busy = useRef(false)

  /**
   * What the player sees between syncs: the last authoritative state, projected
   * forward with the same pure function the authority uses. It is never saved and
   * never sent anywhere — if the two disagree, the next sync simply overwrites it.
   */
  const shown = useMemo(() => (truth ? advance(truth, now).state : null), [truth, now])

  const sync = useCallback(async (announce: boolean) => {
    if (busy.current) return
    busy.current = true
    try {
      const { state, report } = await session.tick()
      setTruth(state)
      if (announce && report.elapsedSeconds >= REPORT_FLOOR_SECONDS) {
        setWelcome({ away: report.elapsedSeconds, gained: report.qiGained, capped: report.cappedBy })
      }
    } catch (e) {
      setFailure(e instanceof Error ? e.message : String(e))
    } finally {
      busy.current = false
    }
  }, [session])

  const send = useCallback(async (action: Action) => {
    if (busy.current) return
    busy.current = true
    try {
      const { state, event } = await session.act(action, newNonce())
      setTruth(state)
      if (event.tribulation) setTrial(event.tribulation)
      if (event.spoils) setSpoils(event.spoils)
    } catch (e) {
      setFailure(e instanceof Error ? e.message : String(e))
    } finally {
      busy.current = false
    }
  }, [session])

  useEffect(() => {
    let alive = true
    session.load().then(async (s) => {
      if (!alive) return
      if (s) { await sync(true); await session.act({ type: 'open' }, newNonce()).then(r => setTruth(r.state)) }
      setBooted(true)
    }).catch((e) => { setFailure(String(e)); setBooted(true) })
    return () => { alive = false }
  }, [session, sync])

  /* Repaint often; ask the authority rarely. */
  useEffect(() => {
    if (!truth) return
    const paint = window.setInterval(() => setNow(Date.now()), PAINT_MS)
    const s = window.setInterval(() => void sync(false), SYNC_MS)
    return () => { window.clearInterval(paint); window.clearInterval(s) }
  }, [truth !== null, sync])

  useEffect(() => {
    const wake = () => {
      if (document.visibilityState !== 'visible') return
      void sync(true).then(() => send({ type: 'open' }))
    }
    document.addEventListener('visibilitychange', wake)
    window.addEventListener('focus', wake)
    return () => {
      document.removeEventListener('visibilitychange', wake)
      window.removeEventListener('focus', wake)
    }
  }, [sync, send])

  const start = async (path: PathId) => {
    try { setTruth(await session.create(path)) }
    catch (e) { setFailure(e instanceof Error ? e.message : String(e)) }
  }

  if (!booted) return (<><Sprite /><div className="app" /></>)
  if (!shown) return (<><Sprite /><div className="app"><Choose onChoose={start} /></div></>)

  const ramp = {
    ['--flame-lo' as string]: realmColour(Math.max(1, shown.realm - 2)),
    ['--flame-mid' as string]: realmColour(shown.realm),
    ['--flame-hi' as string]: realmColour(Math.min(9, shown.realm + 2)),
  }

  return (
    <>
      <Sprite />
      <div className="app" style={ramp}>
        {tab === 'cultivate' && (
          <Cultivate
            state={shown} now={now}
            onSettle={() => void send({ type: 'settle' })}
            onAttempt={() => void send({ type: 'attempt' })}
          />
        )}
        {tab === 'lineage' && <Lineage state={shown} />}
        {tab === 'arts' && (
          <Arts
            state={shown}
            onLearn={(id) => void send({ type: 'learn', id })}
            onEquip={(id) => void send({ type: 'equip', id })}
            onUnequip={(id) => void send({ type: 'unequip', id })}
          />
        )}
        {tab === 'sect' && (
          <Sect
            state={shown} now={now}
            onHunt={() => void send({ type: 'hunt' })}
            onBrew={(id: PillId) => void send({ type: 'brew', id })}
            onTakePill={(id: PillId) => void send({ type: 'takePill', id })}
            onPickFlame={(id) => void send({ type: 'flame', id })}
            onWipe={() => void session.abandon().then(() => { setTruth(null); setTab('cultivate') })}
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

        {trial && (
          <div className="scrim" role="dialog" aria-modal="true" aria-label="Tribulation">
            <div className={`modal${trial.succeeded ? '' : ' failed'}`}>
              <h2>{trial.succeeded ? 'The tribulation passes.' : 'The tribulation breaks you.'}</h2>
              <p>{trial.chance < 1
                ? `You went in at ${Math.round(trial.chance * 100)}%.`
                : 'The early realms give way without a fight.'}</p>
              <p>{trial.succeeded
                ? 'The heart quiets on the far side of it, and the next realm opens.'
                : 'You keep the realm you had, lose almost half your stored qi, and cultivate at little more than half speed for two hours.'}</p>
              <button className="cta" onClick={() => setTrial(null)}>
                {trial.succeeded ? 'Continue' : 'Endure it'}
              </button>
            </div>
          </div>
        )}

        {spoils && (
          <div className="scrim" role="dialog" aria-modal="true" aria-label="The hunt">
            <div className="modal">
              <h2>{spoils.beast.name}</h2>
              <p>{spoils.beast.note}</p>
              <p>Taken: <strong>{spoils.material.amount}× {spoils.material.id}</strong>, and{' '}
                <strong>{spoils.insight}</strong> insight.
                {spoils.firstSighting && ' Recorded in the bestiary.'}</p>
              <button className="cta" onClick={() => setSpoils(null)}>Continue</button>
            </div>
          </div>
        )}

        {welcome && (
          <div className="scrim" role="dialog" aria-modal="true" aria-label="While you were away">
            <div className="modal">
              <h2>While you were away</h2>
              <p>You cultivated for{' '}
                <strong>{duration(welcome.away - welcome.capped)}</strong> and gathered{' '}
                <strong>{short(welcome.gained)}</strong> qi.</p>
              {welcome.capped > 60 && (
                <p>You were gone {duration(welcome.away)}. Offline cultivation is capped, so{' '}
                  {duration(welcome.capped)} of that went unused — Cloud Step and Void Step raise the cap.</p>
              )}
              <button className="cta" onClick={() => setWelcome(null)}>Continue</button>
            </div>
          </div>
        )}

        {failure && (
          <div className="scrim" role="dialog" aria-modal="true" aria-label="Something went wrong">
            <div className="modal failed">
              <h2>The connection broke</h2>
              <p>{failure}</p>
              <p>Your progress is safe — nothing is written here, only asked for.</p>
              <button className="cta" onClick={() => { setFailure(null); void sync(false) }}>Try again</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
