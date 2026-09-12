import { useMemo } from 'react'

/**
 * The lit-silhouette composition from the art bible: aura behind, rim along the lit
 * edge, dark body on a vertical gradient, flames at the base. Colour comes from three
 * CSS variables on an ancestor, so one drawing covers every realm tier.
 *
 * Gradients are generated per instance because a paint server resolves custom
 * properties against its own element, not against whatever references it.
 */
export interface FigureProps {
  symbol: string
  size?: number
  flames?: boolean
  motes?: number
  /** Percentage of a qi ring drawn around the figure, or null for none. */
  ring?: number | null
  label?: string
  dim?: boolean
  className?: string
}

function rng(seed: number) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 4294967296)
}
function hash(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
const r1 = (v: number) => Math.round(v * 10) / 10

function tongue(x: number, base: number, w: number, h: number, drift: number) {
  return `M${r1(x - w)} ${base}C${r1(x - w * 0.92)} ${r1(base - h * 0.42)} ${r1(x + drift - w * 0.55)} ${r1(base - h * 0.78)} ${r1(x + drift)} ${r1(base - h)}` +
         `C${r1(x + drift + w * 0.55)} ${r1(base - h * 0.78)} ${r1(x + w * 0.92)} ${r1(base - h * 0.42)} ${r1(x + w)} ${base}Z`
}

let seq = 0

export function Figure({ symbol, size = 132, flames = false, motes, ring = null, label, dim = false, className }: FigureProps) {
  const art = useMemo(() => {
    const id = `f${++seq}`
    const rand = rng(hash(symbol) + Math.round(size))
    let back = '', front = ''
    if (flames) {
      for (let i = 0; i < 9; i++) back += tongue(16 + i * 8.6 + rand() * 2.4, 92, 2.6 + rand() * 2.2, 9 + rand() * 20, (rand() - 0.5) * 5)
      for (let j = 0; j < 4; j++) front += tongue(28 + j * 15 + rand() * 5, 93, 1.8 + rand() * 1.5, 5 + rand() * 8, (rand() - 0.5) * 3.5)
    }
    const dust: { x: number; y: number; r: number; o: number }[] = []
    const count = motes ?? (flames ? 8 : 0)
    for (let k = 0; k < count; k++) {
      const a = rand() * Math.PI * 2, rr = 42 + rand() * 26
      dust.push({ x: r1(50 + Math.cos(a) * rr), y: r1(50 + Math.sin(a) * rr * 0.92), r: r1(0.7 + rand() * 1.6), o: +(0.25 + rand() * 0.5).toFixed(2) })
    }
    return { id, back, front, dust }
  }, [symbol, size, flames, motes])

  const R = 60, C = 2 * Math.PI * R
  const { id, back, front, dust } = art

  return (
    <svg
      className={className}
      width={size}
      height={size * 1.06}
      viewBox="-19 -17 138 128"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <radialGradient id={`aura${id}`} cx="50%" cy="56%" r="52%">
          <stop offset="0%" stopColor="var(--flame-hi)" stopOpacity={dim ? 0 : 0.5} />
          <stop offset="36%" stopColor="var(--flame-mid)" stopOpacity={dim ? 0 : 0.28} />
          <stop offset="70%" stopColor="var(--flame-lo)" stopOpacity={dim ? 0 : 0.11} />
          <stop offset="100%" stopColor="var(--flame-lo)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`rim${id}`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--flame-hi)" />
          <stop offset="50%" stopColor="var(--flame-mid)" />
          <stop offset="100%" stopColor="var(--flame-lo)" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id={`flame${id}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--flame-lo)" stopOpacity="0.1" />
          <stop offset="45%" stopColor="var(--flame-mid)" stopOpacity="0.75" />
          <stop offset="100%" stopColor="var(--flame-hi)" />
        </linearGradient>
        <linearGradient id={`body${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--silhouette-hi)" />
          <stop offset="55%" stopColor="var(--silhouette-mid)" />
          <stop offset="100%" stopColor="var(--silhouette-lo)" />
        </linearGradient>
        <filter id={`bl${id}`} x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>

      <ellipse cx="50" cy="54" rx="58" ry="60" fill={`url(#aura${id})`} />

      {ring !== null && (
        <>
          <circle cx="50" cy="52" r={R} fill="none" stroke="var(--silhouette-rim)" strokeWidth="2.6" />
          <circle
            cx="50" cy="52" r={R} fill="none" stroke={`url(#rim${id})`} strokeWidth="2.6"
            strokeLinecap="round"
            strokeDasharray={`${r1((C * Math.min(Math.max(ring, 0), 100)) / 100)} ${r1(C)}`}
            transform="rotate(-90 50 52)"
          />
        </>
      )}

      {flames && (
        <>
          <ellipse cx="50" cy="90" rx="40" ry="8" fill="var(--flame-mid)" opacity="0.22" filter={`url(#bl${id})`} />
          <path d={back} fill={`url(#flame${id})`} filter={`url(#bl${id})`} opacity="0.8" />
          <path d={back} fill={`url(#flame${id})`} opacity="0.45" />
        </>
      )}

      {!dim && (
        <g transform="translate(2.1 -1.7)" fill={`url(#rim${id})`} style={{ color: 'var(--flame-mid)' }}>
          <use href={`#${symbol}`} width="100" height="100" />
        </g>
      )}
      <g fill={dim ? 'var(--silhouette-rim)' : `url(#body${id})`} style={{ color: dim ? 'var(--silhouette-rim)' : 'var(--silhouette-edge)' }}>
        <use href={`#${symbol}`} width="100" height="100" />
      </g>

      {flames && <path d={front} fill={`url(#flame${id})`} opacity="0.6" />}

      {dust.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="var(--flame-hi)" opacity={d.o} />
      ))}
    </svg>
  )
}
