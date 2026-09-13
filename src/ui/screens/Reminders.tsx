import { useState } from 'react'
import { KIND_NAME, MOST_PER_DAY, type ReminderKind } from '../../core/reminders.ts'
import { ask, prefs, preview, setPrefs, worthAskingNow } from '../useReminders.ts'
import { duration } from '../../core/format.ts'
import type { PlayerState } from '../../core/state.ts'

const KINDS: ReminderKind[] = ['charges', 'tribulation', 'settled', 'injury']

/**
 * 報 What may reach you.
 *
 * Shows what would actually be sent rather than describing it — the same `due()` the
 * scheduler uses, rendered as the messages themselves with the time each is expected.
 * A settings screen that lists abstract categories is asking the player to imagine the
 * thing they are consenting to.
 */
export function Reminders({ state, now }: { state: PlayerState; now: number }) {
  const [p, setP] = useState(prefs)
  const coming = p.granted ? preview(state, now) : []

  // Nothing at all until the player has a reason to want to be told something. Asking on
  // the first launch gets refused, and a refusal on Android is close to permanent.
  if (!p.granted && !p.asked && !worthAskingNow(state)) return null

  return (
    <>
      <p className="label">What may reach you <span className="han">報</span></p>

      {!p.granted ? (
        <div className="panel">
          <p className="hint">
            The game can tell you when your hunts are about to overflow or a tribulation is
            waiting. Never more than {MOST_PER_DAY} a day, and every one is switchable here.
          </p>
          <button className="cta" onClick={() => void ask().then(() => setP(prefs()))}>
            Let it tell me
          </button>
          {p.asked && <p className="hint warnline">
            Android refused. Turn notifications on for Ninefold in the phone's settings.
          </p>}
        </div>
      ) : (
        <>
          {coming.length > 0 && (
            <div className="list">
              {coming.map((r) => (
                <div className="card" key={r.kind}>
                  <span className="cb">
                    <span className="cn">{r.title}</span>
                    <span className="cd">{r.body}</span>
                  </span>
                  <span className="cx">{duration(Math.max(0, (r.at - now) / 1000))}</span>
                </div>
              ))}
            </div>
          )}
          <div className="toggles">
            {KINDS.map((k) => (
              <button className="tg" key={k}
                      aria-pressed={p.on[k]}
                      onClick={() => setP(setPrefs({ on: { ...p.on, [k]: !p.on[k] } }))}>
                <span className="tb">
                  <span className="tn">{KIND_NAME[k].name}</span>
                  <span className="td">{KIND_NAME[k].note}</span>
                </span>
                <span className={`sw${p.on[k] ? ' on' : ''}`} />
              </button>
            ))}
          </div>
          <p className="hint">
            Booked when you close the app and cancelled the moment you open it. Nothing fires
            while you are looking at the screen.
          </p>
        </>
      )}
    </>
  )
}
