const SUFFIX = ['', 'K', 'M', 'B', 'T', 'aa', 'ab', 'ac', 'ad']

/** Idle games live or die on number legibility. Three significant figures, always. */
export function short(n: number): string {
  if (!isFinite(n)) return '∞'
  if (n < 1000) return n < 10 ? n.toFixed(1) : Math.floor(n).toString()
  const tier = Math.min(Math.floor(Math.log10(n) / 3), SUFFIX.length - 1)
  const scaled = n / Math.pow(1000, tier)
  return (scaled < 10 ? scaled.toFixed(2) : scaled < 100 ? scaled.toFixed(1) : Math.floor(scaled).toString()) + SUFFIX[tier]
}

export function duration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '—'
  if (seconds < 60) return `${Math.ceil(seconds)}s`
  const m = Math.floor(seconds / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ${m % 60}m`
  return `${Math.floor(h / 24)}d ${h % 24}h`
}
