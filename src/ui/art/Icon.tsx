export function Icon({ symbol, size = 20 }: { symbol: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <use href={`#${symbol}`} />
    </svg>
  )
}
