import { useEffect, useRef, useState } from 'react'
import { realm } from '../core/realms.ts'

/** How long the whole sequence runs. Long enough to land, short enough to not annoy. */
export const BREAK_MS = 2_600

/**
 * 突破 The one moment the game has been saving up for.
 *
 * Nine times in fifty days the realm changes, and until now it changed by a number
 * ticking over. The sequence is three beats: the screen draws breath and the light
 * pulls *inward*, then it lets go — a flash, a shake, the phase colour of the new
 * realm washing out past the edges — then the name settles.
 *
 * Pulling in before blowing out is the whole trick. An explosion with no inhale is a
 * flashbang; the inhale is what makes it read as gathered rather than as noise.
 */
export function Breakthrough({ to, onDone }: { to: number; onDone: () => void }) {
  const r = realm(to)
  useEffect(() => {
    const t = setTimeout(onDone, BREAK_MS)
    return () => clearTimeout(t)
  }, [to, onDone])

  return (
    <div className="bt" role="status" aria-live="polite">
      <div className="bt-in" />
      <div className="bt-out" />
      <div className="bt-ring" />
      <div className="bt-name">
        <span className="bt-zh han">{r.zh}</span>
        <span className="bt-en h-display">{r.name}</span>
        <span className="bt-sub">Realm {to}</span>
      </div>
      <span className="visually-hidden">Broken through to {r.name}, realm {to}.</span>
    </div>
  )
}

/**
 * Fires once each time the realm goes up, and never on the first render — loading a
 * save at realm seven is not a breakthrough, and celebrating one would be a lie the
 * player sees straight through.
 */
export function useBreakthrough(realmNow: number | undefined): {
  playing: number | null
  clear: () => void
} {
  const seen = useRef<number | null>(null)
  const [playing, setPlaying] = useState<number | null>(null)

  useEffect(() => {
    if (realmNow === undefined) return
    const was = seen.current
    seen.current = realmNow
    if (was !== null && realmNow > was) setPlaying(realmNow)
  }, [realmNow])

  return { playing, clear: () => setPlaying(null) }
}
