/**
 * Run HUD and the end-of-run screen, in DOM rather than on the canvas.
 *
 * Text is the one thing a canvas is bad at: Pixi would need a font atlas, and
 * numbers that change every frame would either re-rasterise constantly or look
 * soft. The DOM renders crisp text at any device pixel ratio for free, and it
 * sits above the game without ever touching the render loop's budget.
 */
import { TECHNIQUE_BY_ID, type Loadout } from '../data/techniques'
import { strings } from './strings'

export interface Hud {
  /** Called every frame with the current run state. */
  update(
    hp: number,
    maxHp: number,
    elapsed: number,
    kills: number,
    xp: number,
    xpNeeded: number,
    level: number,
  ): void
  /** Redraws the owned-technique strip. Cheap when nothing has changed. */
  updateLoadout(loadout: Loadout): void
  /** Shows the end screen. `onRestart` fires when the player asks for another. */
  showGameOver(elapsed: number, kills: number, onRestart: () => void): void
  hideGameOver(): void
}

/** mm:ss */
function formatTime(seconds: number): string {
  const total = Math.floor(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function createHud(root: HTMLElement): Hud {
  root.innerHTML = `
    <div class="hud-bar">
      <div class="hud-health"><div class="hud-health-fill"></div></div>
      <div class="hud-xp"><div class="hud-xp-fill"></div></div>
      <div class="hud-stats">
        <span class="hud-time">0:00</span>
        <span class="hud-realm">${strings.levelShort} 1</span>
        <span class="hud-kills">0</span>
      </div>
      <div class="hud-loadout"></div>
    </div>
    <div class="over" hidden>
      <div class="over-seal">终</div>
      <div class="over-title">${strings.runOver}</div>
      <div class="over-rows">
        <div><span>${strings.survived}</span><b class="over-time">0:00</b></div>
        <div><span>${strings.felled}</span><b class="over-kills">0</b></div>
      </div>
      <button class="over-again" type="button">${strings.again}</button>
    </div>
  `

  const fill = root.querySelector<HTMLElement>('.hud-health-fill')!
  const xpFill = root.querySelector<HTMLElement>('.hud-xp-fill')!
  const realmEl = root.querySelector<HTMLElement>('.hud-realm')!
  const timeEl = root.querySelector<HTMLElement>('.hud-time')!
  const killsEl = root.querySelector<HTMLElement>('.hud-kills')!
  const over = root.querySelector<HTMLElement>('.over')!
  const overTime = root.querySelector<HTMLElement>('.over-time')!
  const overKills = root.querySelector<HTMLElement>('.over-kills')!
  const again = root.querySelector<HTMLButtonElement>('.over-again')!
  const loadoutEl = root.querySelector<HTMLElement>('.hud-loadout')!

  // Only touch the DOM when a displayed value actually changes. Writing the
  // same string 60 times a second is layout work for nothing.
  let lastTime = ''
  let lastKills = -1
  let lastPct = -1
  let lastXpPct = -1
  let lastLevel = -1

  /** Serialised loadout, so the strip is only rebuilt when it really changes. */
  let lastLoadout = ''

  let restartHandler: (() => void) | null = null
  again.addEventListener('click', () => restartHandler?.())

  return {
    update(hp, maxHp, elapsed, kills, xp, xpNeeded, level) {
      const pct = Math.max(0, Math.min(1, hp / maxHp))
      if (pct !== lastPct) {
        fill.style.transform = `scaleX(${pct})`
        // Cinnabar only when it matters. A bar that is always red stops being a
        // warning and becomes decoration.
        fill.style.background = pct < 0.3 ? 'var(--cinnabar)' : 'var(--ink)'
        lastPct = pct
      }
      const t = formatTime(elapsed)
      if (t !== lastTime) {
        timeEl.textContent = t
        lastTime = t
      }
      if (kills !== lastKills) {
        killsEl.textContent = String(kills)
        lastKills = kills
      }
      const xpPct = xpNeeded > 0 ? Math.max(0, Math.min(1, xp / xpNeeded)) : 0
      if (xpPct !== lastXpPct) {
        xpFill.style.transform = `scaleX(${xpPct})`
        lastXpPct = xpPct
      }
      if (level !== lastLevel) {
        realmEl.textContent = `${strings.levelShort} ${level}`
        lastLevel = level
      }
    },

    updateLoadout(loadout) {
      // "I do not understand how many skills I have" was the report this
      // answers: without a persistent list, the only place a technique is ever
      // named is the card you tapped twenty seconds ago.
      let key = ''
      for (const [id, lv] of loadout) key += `${id}${lv},`
      if (key === lastLoadout) return
      lastLoadout = key

      loadoutEl.innerHTML = ''
      for (const [id, level] of loadout) {
        const tech = TECHNIQUE_BY_ID.get(id)
        if (!tech) continue
        const chip = document.createElement('span')
        chip.className = 'chip' + (tech.kind === 'art' ? ' chip-art' : '')
        chip.textContent = `${tech.name} ${level}`
        loadoutEl.appendChild(chip)
      }
    },

    showGameOver(elapsed, kills, onRestart) {
      overTime.textContent = formatTime(elapsed)
      overKills.textContent = String(kills)
      restartHandler = onRestart
      over.hidden = false
      // Next frame, so the transition has a chance to run from its start state.
      requestAnimationFrame(() => over.classList.add('shown'))
    },

    hideGameOver() {
      over.classList.remove('shown')
      over.hidden = true
      restartHandler = null
      lastPct = -1
      lastKills = -1
      lastXpPct = -1
      lastLevel = -1
      lastTime = ''
      lastLoadout = ''
      loadoutEl.innerHTML = ''
    },
  }
}
