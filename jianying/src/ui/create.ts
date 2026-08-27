/**
 * Character creation — the game's first question.
 *
 * Two decisions and nothing else: a name, and where you trained. Both are
 * deliberately cheap. The origin grants three or four attribute points, which
 * colours the opening hour and is swamped by level five; the name is prefilled
 * and re-rollable. Nothing here can be got wrong, which is the point — this is
 * the screen on which the player knows least about the game, and it would be
 * indefensible to make it the screen where a build is locked in.
 *
 * The name field is prefilled and paired with a roll button on purpose. A text
 * input is the first thing a phone player would meet, and forcing a keyboard
 * open before the game has shown them anything is a bad trade. Typing stays
 * available for anyone who wants it.
 */
import { ORIGINS, type Origin, rollName } from '../meta/origins'
import { strings } from './strings'

export interface CreateScreen {
  /** `roll` supplies randomness for the name. `onDone` receives both choices. */
  show(roll: () => number, onDone: (name: string, origin: Origin) => void): void
  hide(): void
  readonly visible: boolean
}

export function createCreator(root: HTMLElement): CreateScreen {
  const panel = document.createElement('div')
  panel.className = 'create'
  panel.hidden = true
  root.appendChild(panel)

  let shown = false
  let chosen: Origin = ORIGINS[0]!
  let onDoneHandler: ((name: string, origin: Origin) => void) | null = null

  return {
    get visible() {
      return shown
    },

    show(roll, onDone) {
      onDoneHandler = onDone
      chosen = ORIGINS[0]!

      panel.innerHTML = `
        <div class="create-head">
          <div class="create-title">${strings.createTitle}</div>
          <div class="create-sub">${strings.createSub}</div>
        </div>
        <div class="create-section">${strings.yourName}</div>
        <div class="create-name">
          <input class="create-input" type="text" maxlength="24"
                 autocomplete="off" autocorrect="off" spellcheck="false" />
          <button class="create-roll" type="button" aria-label="${strings.rollName}">↻</button>
        </div>
        <div class="create-section">${strings.yourOrigin}</div>
        <div class="create-origins"></div>
        <button class="create-go" type="button">${strings.takeUpTheSword}</button>
      `

      const input = panel.querySelector<HTMLInputElement>('.create-input')!
      input.value = rollName(roll)
      panel.querySelector<HTMLButtonElement>('.create-roll')!.addEventListener('click', () => {
        input.value = rollName(roll)
      })

      const list = panel.querySelector<HTMLElement>('.create-origins')!
      const cards: HTMLButtonElement[] = []
      for (const origin of ORIGINS) {
        const card = document.createElement('button')
        card.type = 'button'
        card.className = 'origin' + (origin === chosen ? ' origin-on' : '')
        card.innerHTML = `
          <div class="origin-seal">${origin.seal}</div>
          <div class="origin-text">
            <div class="origin-name">${origin.name}</div>
            <div class="origin-blurb">${origin.blurb}</div>
            <div class="origin-effect">${origin.effect}</div>
          </div>
        `
        card.addEventListener('click', () => {
          chosen = origin
          for (const other of cards) other.classList.remove('origin-on')
          card.classList.add('origin-on')
        })
        cards.push(card)
        list.appendChild(card)
      }

      panel.querySelector<HTMLButtonElement>('.create-go')!.addEventListener('click', () => {
        const handler = onDoneHandler
        onDoneHandler = null
        // An empty field must not produce a nameless character, so it falls
        // back to a rolled name rather than refusing to continue.
        const name = input.value.trim() || rollName(roll)
        handler?.(name.slice(0, 24), chosen)
      })

      panel.hidden = false
      shown = true
      panel.scrollTop = 0
      requestAnimationFrame(() => panel.classList.add('shown'))
    },

    hide() {
      panel.classList.remove('shown')
      panel.hidden = true
      shown = false
      onDoneHandler = null
    },
  }
}
