import { useEffect } from 'react'

/**
 * Android's back button, which the game was ignoring entirely.
 *
 * Capacitor's default is that back at the root closes the app. So on a phone every
 * instinctive back — dismissing the tribulation result, backing out of the Gear tab —
 * quit the game instead. On a save that lives only on the device, an app that exits
 * when you did not mean it to is the worst possible default.
 *
 * The order below is what a person expects: close what is on top of the screen, then
 * return to the main tab, and only leave from there. Nothing here can lose progress —
 * every screen writes as it goes — so exiting from Cultivate is safe and deliberate.
 *
 * `@capacitor/app` is loaded lazily and its absence is fine: in a browser there is no
 * hardware back button and this hook simply does nothing.
 */
export function useBackButton(handler: () => boolean) {
  useEffect(() => {
    let remove: (() => void) | undefined
    let alive = true

    void (async () => {
      try {
        const { App } = await import('@capacitor/app')
        const listener = await App.addListener('backButton', () => {
          // The handler returns true when it consumed the press. When it does not,
          // we are at the root of the app and back means what it says.
          if (!handler()) void App.exitApp()
        })
        if (alive) remove = () => void listener.remove()
        else void listener.remove()
      } catch {
        /* no plugin, no hardware button — a browser tab, and nothing to do */
      }
    })()

    return () => { alive = false; remove?.() }
  }, [handler])
}
