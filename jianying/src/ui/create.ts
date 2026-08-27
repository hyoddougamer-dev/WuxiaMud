/**
 * Character creation — the game's first question.
 *
 * The first version of this screen offered origins that granted three or four
 * attribute points, and the verdict on it was blunt and correct: you could not
 * feel it. Three points is a rounding error against a level-five character, so
 * it was a form field pretending to be a choice.
 *
 * A school now decides your WEAPON, and the weapon decides the shape of the
 * automatic sweep — its reach, its arc, its rhythm. Since the thumb is spent
 * entirely on movement, that shape is the whole of how the game plays, so a
 * spear school and a twin-blade school ask the player to stand in genuinely
 * different places from the opening second. Each card therefore leads with how
 * the weapon plays rather than with what it grants.
 *
 * Still nothing here can be got wrong: every weapon in the game drops, so a
 * school is where you begin, not what you are. It would be indefensible to lock
 * a build on the screen where the player knows least about the game, and the
 * subtitle says so.
 *
 * The name field is prefilled and paired with a roll button on purpose. A text
 * input is the first thing a phone player would meet, and forcing a keyboard
 * open before the game has shown them anything is a bad trade. Typing stays
 * available for anyone who wants it.
 */
import { weaponById } from '../data/weapons'
import { SCHOOLS, type School, rollName } from '../meta/schools'
import { strings } from './strings'

export interface CreateScreen {
  /** `roll` supplies randomness for the name. `onDone` receives both choices. */
  show(roll: () => number, onDone: (name: string, school: School) => void): void
  hide(): void
  readonly visible: boolean
}

export function createCreator(root: HTMLElement): CreateScreen {
  const panel = document.createElement('div')
  panel.className = 'create'
  panel.hidden = true
  root.appendChild(panel)

  let shown = false
  let chosen: School = SCHOOLS[0]!
  let onDoneHandler: ((name: string, school: School) => void) | null = null

  return {
    get visible() {
      return shown
    },

    show(roll, onDone) {
      onDoneHandler = onDone
      chosen = SCHOOLS[0]!

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
        <div class="create-section">${strings.yourSchool}</div>
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
      for (const school of SCHOOLS) {
        const weapon = weaponById(school.weaponId)
        const card = document.createElement('button')
        card.type = 'button'
        card.className = 'origin' + (school === chosen ? ' origin-on' : '')
        // The weapon leads. It is the part of this choice the player will feel
        // within a second of setting out, and the fiction is what makes them
        // want to.
        card.innerHTML = `
          <div class="origin-seal">${school.seal}</div>
          <div class="origin-text">
            <div class="origin-name">${school.name}</div>
            <div class="origin-weapon">${weapon.seal} ${weapon.name}</div>
            <div class="origin-effect">${weapon.blurb}</div>
            <div class="origin-blurb">${school.blurb}</div>
          </div>
        `
        card.addEventListener('click', () => {
          chosen = school
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
