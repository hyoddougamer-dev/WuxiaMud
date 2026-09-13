import { useEffect, useRef } from 'react'
import { due, worthAsking, type Reminder, type ReminderKind, DEFAULT_ON } from '../core/reminders.ts'
import type { PlayerState } from '../core/state.ts'

/**
 * The edge that turns 報 into something a phone will actually do.
 *
 * Scheduling happens when the app goes to the background and is cancelled the moment it
 * comes back, which is the only correct order. A reminder is a promise about a future
 * the player is not watching; the instant they are watching, the promise is void — and a
 * notification that fires while you are already looking at the screen is the single
 * fastest way to teach someone to turn them all off.
 *
 * `@capacitor/local-notifications` is imported lazily and every failure is swallowed. In
 * a browser tab there is nothing to schedule and this hook does nothing at all, which is
 * the same shape as the back-button handler and for the same reason: the web build must
 * not care that the native build exists.
 */

const KEY = 'ninefold.reminders'

export interface ReminderPrefs {
  on: Record<ReminderKind, boolean>
  /** Asked once. A refusal on Android is close to permanent, so it is never asked twice. */
  asked: boolean
  granted: boolean
}

export function prefs(): ReminderPrefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<ReminderPrefs>
      return { on: { ...DEFAULT_ON, ...(p.on ?? {}) }, asked: !!p.asked, granted: !!p.granted }
    }
  } catch { /* private window — the defaults are correct anyway */ }
  return { on: { ...DEFAULT_ON }, asked: false, granted: false }
}

export function setPrefs(patch: Partial<ReminderPrefs>): ReminderPrefs {
  const next = { ...prefs(), ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* courtesy, not mechanism */ }
  return next
}

/** Stable small integers: Capacitor keys notifications by number, not by name. */
const ID: Record<ReminderKind, number> = { charges: 1, tribulation: 2, settled: 3, injury: 4 }

type Plugin = typeof import('@capacitor/local-notifications')['LocalNotifications']

async function plugin(): Promise<Plugin | null> {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    // In a browser the plugin resolves but every call throws unimplemented, so one
    // cheap call decides whether this device can do anything at all.
    await LocalNotifications.checkPermissions()
    return LocalNotifications
  } catch {
    return null
  }
}

export async function ask(): Promise<boolean> {
  const p = await plugin()
  if (!p) return false
  try {
    const r = await p.requestPermissions()
    const granted = r.display === 'granted'
    setPrefs({ asked: true, granted })
    return granted
  } catch {
    setPrefs({ asked: true, granted: false })
    return false
  }
}

async function clear(p: Plugin): Promise<void> {
  try {
    const pending = await p.getPending()
    if (pending.notifications.length) await p.cancel(pending)
  } catch { /* nothing pending, or nothing to cancel */ }
}

async function schedule(list: Reminder[]): Promise<void> {
  const p = await plugin()
  if (!p) return
  await clear(p)
  if (!list.length) return
  try {
    await p.schedule({
      notifications: list.map((r) => ({
        id: ID[r.kind],
        title: r.title,
        body: r.body,
        schedule: { at: new Date(r.at), allowWhileIdle: true },
      })),
    })
  } catch { /* denied, or a device that will not schedule — nothing is owed */ }
}

/**
 * Watches the foreground. On the way out it works out what the player is about to miss
 * and books it; on the way back in it cancels everything, because they are here.
 */
export function useReminders(state: PlayerState | null, now: number): void {
  const latest = useRef({ state, now })
  latest.current = { state, now }

  useEffect(() => {
    let remove: (() => void) | undefined
    let alive = true

    void (async () => {
      try {
        const { App } = await import('@capacitor/app')
        const listener = await App.addListener('appStateChange', ({ isActive }) => {
          const { state: s, now: t } = latest.current
          if (!s) return
          const p = prefs()
          if (!p.granted) return
          if (isActive) void plugin().then((pl) => pl && clear(pl))
          else void schedule(due(s, Date.now() || t, p.on))
        })
        if (alive) remove = () => void listener.remove()
        else void listener.remove()
      } catch {
        /* a browser tab: no lifecycle, nothing to schedule */
      }
    })()

    return () => { alive = false; remove?.() }
  }, [])
}

/** Exposed so the settings screen can show what would be sent, rather than describe it. */
export function preview(state: PlayerState, now: number): Reminder[] {
  return due(state, now, prefs().on)
}

export function worthAskingNow(state: PlayerState): boolean {
  return worthAsking(state, prefs().asked)
}
