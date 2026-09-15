import { useEffect, useRef } from 'react'
import { breath, field, intensity, moteCount } from '../../core/qi.ts'

/**
 * 氣場 The living layer behind the cultivator.
 *
 * A corona that breathes, three rings that swell with it, and motes rising out of the
 * floor. It sits behind everything, takes no pointer events, and reads its colour from
 * the three `--flame-*` variables the app already sets per realm — so the whole field
 * changes phase at a breakthrough without this component knowing what a realm is.
 *
 * Three things keep it honest on a phone:
 *
 *  - the motion is a pure function of the clock (`core/qi.ts`), so nothing accumulates,
 *    nothing drifts, and a tab asleep for an hour wakes up in the right place;
 *  - the loop stops entirely when the document is hidden, which is most of the life of
 *    an idle game;
 *  - `prefers-reduced-motion` draws one still frame and never starts a loop at all.
 */
export function QiField({ realm, progress, settling = false, speed = 1, className }: {
  realm: number
  /** 0..1 toward the next realm. Raises the burn. */
  progress: number
  settling?: boolean
  speed?: number
  className?: string
}) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const live = useRef({ realm, progress, settling, speed })
  live.current = { realm, progress, settling, speed }

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const c2d = cv.getContext('2d')
    if (!c2d) return

    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let w = 0, h = 0

    // The three ramp steps resolve against this element, so a realm change is picked
    // up on the next frame with no prop threading.
    const read = () => {
      const s = getComputedStyle(cv)
      return {
        lo: s.getPropertyValue('--flame-lo').trim() || '#8E2C1E',
        mid: s.getPropertyValue('--flame-mid').trim() || '#D0442C',
        hi: s.getPropertyValue('--flame-hi').trim() || '#F0937C',
      }
    }

    const size = () => {
      const dpr = Math.min(2, devicePixelRatio || 1)
      const r = cv.getBoundingClientRect()
      w = Math.max(1, Math.round(r.width))
      h = Math.max(1, Math.round(r.height))
      cv.width = Math.round(w * dpr)
      cv.height = Math.round(h * dpr)
      c2d.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = (t: number) => {
      const { realm: rm, progress: pg, settling: st, speed: sp } = live.current
      const c = read()
      const burn = intensity(rm, pg, st)
      const b = still ? 0.5 : breath(t)
      c2d.clearRect(0, 0, w, h)
      c2d.globalCompositeOperation = 'lighter'

      // 暈 the corona — the soft body of the aura, centred on the figure's chest
      const cx = w / 2, cy = h * 0.46
      const rad = Math.min(w, h) * (0.34 + b * 0.05) * (0.8 + burn * 0.5)
      const g = c2d.createRadialGradient(cx, cy, 0, cx, cy, rad)
      g.addColorStop(0, withAlpha(c.mid, 0.20 * burn * (0.8 + b * 0.4)))
      g.addColorStop(0.45, withAlpha(c.lo, 0.13 * burn))
      g.addColorStop(1, withAlpha(c.lo, 0))
      c2d.fillStyle = g
      c2d.beginPath(); c2d.arc(cx, cy, rad, 0, Math.PI * 2); c2d.fill()

      // 環 the rings, swelling on the same breath
      for (let i = 0; i < 3; i++) {
        const rr = rad * (0.46 + i * 0.20) * (0.97 + b * 0.06)
        c2d.strokeStyle = withAlpha(i === 0 ? c.hi : c.mid, (0.16 - i * 0.045) * burn)
        c2d.lineWidth = i === 0 ? 1.4 : 1
        c2d.beginPath(); c2d.arc(cx, cy, rr, 0, Math.PI * 2); c2d.stroke()
      }

      // 塵 the motes
      const n = moteCount(rm, still)
      for (const m of field(n, t, sp)) {
        const x = m.x * w
        const y = h - m.y * h
        const r = m.r * 1.5
        c2d.fillStyle = withAlpha(m.r > 1.05 ? c.hi : c.mid, m.a * burn)
        c2d.beginPath(); c2d.arc(x, y, r, 0, Math.PI * 2); c2d.fill()
      }
      c2d.globalCompositeOperation = 'source-over'
    }

    const frame = (t: number) => { draw(t); raf = requestAnimationFrame(frame) }
    const start = () => { if (!raf && !still && !document.hidden) raf = requestAnimationFrame(frame) }
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0 } }
    // Most of an idle game's life is spent in a background tab. Do not paint into it.
    const visible = () => { document.hidden ? stop() : start() }

    size()
    draw(performance.now())
    start()

    const ro = new ResizeObserver(() => { size(); draw(performance.now()) })
    ro.observe(cv)
    document.addEventListener('visibilitychange', visible)
    return () => { stop(); ro.disconnect(); document.removeEventListener('visibilitychange', visible) }
  }, [])

  return <canvas ref={ref} className={`qifield${className ? ' ' + className : ''}`} aria-hidden="true" />
}

/**
 * The ramp steps arrive as whatever the stylesheet said — usually `#RRGGBB`. Anything
 * else is passed through at full strength rather than silently painting nothing, which
 * is what a naive parser does the first time somebody writes a colour in oklch.
 */
function withAlpha(colour: string, a: number): string {
  const v = Math.max(0, Math.min(1, a))
  const m = /^#([0-9a-f]{6})$/i.exec(colour)
  if (m) {
    const n = parseInt(m[1]!, 16)
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${v})`
  }
  const s = /^#([0-9a-f]{3})$/i.exec(colour)
  if (s) {
    const [r, g, b] = [...s[1]!].map((ch) => parseInt(ch + ch, 16))
    return `rgba(${r}, ${g}, ${b}, ${v})`
  }
  return colour
}
