import { useMemo } from 'react'

let seq = 0

/** A technique mark: the drawing, plus a blurred copy of itself. That blur is what turns
 *  a line drawing into a skill icon, and it costs one extra element. */
export function Glyph({ symbol, size = 28, label }: { symbol: string; size?: number; label?: string }) {
  const id = useMemo(() => `g${++seq}`, [])
  return (
    <svg
      width={size} height={size} viewBox="0 0 40 40"
      role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}
    >
      <defs>
        <filter id={`gb${id}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.9" />
        </filter>
      </defs>
      <g filter={`url(#gb${id})`} opacity="0.9" style={{ color: 'var(--flame-mid)' }}>
        <use href={`#${symbol}`} fill="currentColor" />
      </g>
      <g style={{ color: 'var(--flame-hi)' }}>
        <use href={`#${symbol}`} fill="currentColor" />
      </g>
    </svg>
  )
}
