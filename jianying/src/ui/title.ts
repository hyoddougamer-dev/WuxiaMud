/**
 * The title screen — the first thing the game says about itself.
 *
 * It was missing, and its absence was reported in exactly those terms: the app
 * opened straight onto a panel of attributes and roads, with no name, no
 * premise, and nothing to explain why any of those numbers should matter. A
 * management screen is a fine second impression and a terrible first one.
 *
 * So this screen does three small things and stops: it names the game, it says
 * in two lines what you are and what you do, and it offers exactly one action.
 * A returning player passes through it in under a second; a new one arrives at
 * character creation already knowing what they are creating.
 */
import { strings } from './strings'
import { PACK_CREDIT } from '../render/packIcons'

export interface TitleScreen {
  /**
   * `returning` swaps Begin for Continue and shows who is waiting.
   *
   * `onNew` adds a quiet second action for a returning player: start over.
   * It lives here because this is where somebody looks for it — the hub has
   * the same button, but on a tall phone with a levelled character it sits
   * below the fold behind four attribute rows, which is the same as not
   * existing. A screen with one action is a good first impression; a screen
   * whose only other action is unreachable is a trap.
   */
  show(returning: string | null, onBegin: () => void, onNew?: () => void): void
  hide(): void
  readonly visible: boolean
}

export function createTitle(root: HTMLElement): TitleScreen {
  const panel = document.createElement('div')
  panel.className = 'title'
  panel.hidden = true
  root.appendChild(panel)

  let shown = false
  let onBeginHandler: (() => void) | null = null

  return {
    get visible() {
      return shown
    },

    show(returning, onBegin, onNew) {
      onBeginHandler = onBegin
      panel.innerHTML = `
        <div class="title-mark">
          <div class="title-seal">剑影</div>
          <div class="title-roman">Jiànyǐng</div>
        </div>
        <div class="title-pitch">${strings.pitch}</div>
        <button class="title-go" type="button">
          ${returning ? strings.continueRun : strings.beginRun}
        </button>
        ${returning ? `<div class="title-who">${returning}</div>` : ''}
        ${
          // Only for a returning player: on a first launch there is nothing to
          // start over from, and the option would be noise.
          returning && onNew
            ? `<button class="title-new" type="button">${strings.newSwordsman}</button>`
            : ''
        }
        <div class="title-credit">${PACK_CREDIT}</div>
      `
      panel.querySelector<HTMLButtonElement>('.title-go')!.addEventListener('click', () => {
        const handler = onBeginHandler
        // Cleared before calling, so a double tap cannot advance twice.
        onBeginHandler = null
        handler?.()
      })
      panel.querySelector<HTMLButtonElement>('.title-new')?.addEventListener('click', () => {
        // Deliberately does NOT clear onBeginHandler: the confirmation can be
        // dismissed, and Continue has to still work afterwards.
        onNew?.()
      })
      panel.hidden = false
      shown = true
      requestAnimationFrame(() => panel.classList.add('shown'))
    },

    hide() {
      panel.classList.remove('shown')
      panel.hidden = true
      shown = false
      onBeginHandler = null
    },
  }
}
