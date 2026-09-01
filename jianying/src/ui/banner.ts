/**
 * Event banners — one line, centre screen, gone in two seconds.
 *
 * The gap this fills: several important things used to happen with no
 * announcement at all. A boss walked on from off-screen and was, for its first
 * few seconds, just a larger silhouette in a crowd of silhouettes. Insight
 * levels arrived as a bar quietly resetting. A player who cannot see an event
 * happen cannot learn from it, and "I do not understand what is going on" is
 * the exact complaint this answers.
 *
 * Deliberately not a log. A scrolling feed of everything would be a second
 * thing to read during a fight the player is already struggling to parse; a
 * banner is legible peripherally and demands nothing.
 */

export type BannerTone = 'plain' | 'danger' | 'gold'

export interface Banners {
  /** Queues a line. `sub` is a smaller second line, optional. */
  show(text: string, tone?: BannerTone, sub?: string): void
  update(dt: number): void
  clear(): void
}

/** Seconds a banner holds before the next one is allowed through. */
const HOLD = 1.9

interface Queued {
  text: string
  sub: string
  tone: BannerTone
}

export function createBanners(root: HTMLElement): Banners {
  const el = document.createElement('div')
  el.className = 'banner'
  el.hidden = true
  root.appendChild(el)

  const queue: Queued[] = []
  let timer = 0
  let showing = false

  const paint = (item: Queued): void => {
    el.className = `banner banner-${item.tone}`
    el.innerHTML = ''
    const main = document.createElement('div')
    main.className = 'banner-main'
    main.textContent = item.text
    el.appendChild(main)
    if (item.sub) {
      const sub = document.createElement('div')
      // A SENTENCE is styled differently from a LABEL, and it has to be: the
      // sub line was built for two or three tracked-out words ("Rare", "not
      // banked"), and the arts now put a full sentence through it. At 0.2em
      // letter-spacing a sentence runs off a phone and wraps into a mess.
      sub.className = item.sub.length > 22 ? 'banner-sub banner-say' : 'banner-sub'
      sub.textContent = item.sub
      el.appendChild(sub)
    }
    el.hidden = false
    // Next frame so the entry transition runs from its start state rather than
    // being coalesced into the same style recalculation.
    requestAnimationFrame(() => el.classList.add('shown'))
  }

  return {
    show(text, tone = 'plain', sub = '') {
      // A short queue, not an unbounded one: if six things happen at once the
      // player will read two of them, and holding the rest for twelve seconds
      // would show news about a fight that already ended.
      if (queue.length >= 3) queue.shift()
      queue.push({ text, tone, sub })
    },

    update(dt) {
      if (showing) {
        timer -= dt
        if (timer > 0) return
        showing = false
        el.classList.remove('shown')
        // Held hidden for the fade, so the next banner does not cut in over the
        // outgoing one mid-transition.
        timer = 0.28
        return
      }
      if (timer > 0) {
        timer -= dt
        if (timer > 0) return
        el.hidden = true
      }
      const next = queue.shift()
      if (!next) return
      paint(next)
      showing = true
      timer = HOLD
    },

    clear() {
      queue.length = 0
      showing = false
      timer = 0
      el.classList.remove('shown')
      el.hidden = true
    },
  }
}
