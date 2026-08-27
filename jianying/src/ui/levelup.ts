/**
 * The level-up choice — three cards, one tap.
 *
 * This is the moment the run stops being a single unbroken action and becomes a
 * sequence of decisions. It is also, deliberately, the only screen that
 * interrupts play: everything else the player needs is glanceable, and a genre
 * built on continuous motion cannot afford a second thing that stops it.
 *
 * Cards are large and thumb-height on purpose. The player has one hand on the
 * phone and has just been in a fight; a row of small targets near the top of a
 * six-inch screen would be a worse interruption than the pause itself.
 */
import type { Technique } from '../data/techniques'
import { strings } from './strings'

export interface LevelUpScreen {
  /** Shows the offer. `onPick` receives the chosen technique. */
  show(level: number, offer: Technique[], owned: Map<string, number>, onPick: (t: Technique) => void): void
  hide(): void
  readonly visible: boolean
}

export function createLevelUp(root: HTMLElement): LevelUpScreen {
  const panel = document.createElement('div')
  panel.className = 'levelup'
  panel.hidden = true
  root.appendChild(panel)

  let onPickHandler: ((t: Technique) => void) | null = null
  let shown = false

  return {
    get visible() {
      return shown
    },

    show(level, offer, owned, onPick) {
      onPickHandler = onPick
      panel.innerHTML = ''

      const title = document.createElement('div')
      title.className = 'levelup-title'
      // Insight, not Realm: this track lasts one expedition. The permanent one
      // is shown in the hub, and reusing one word for both was a genuine source
      // of confusion about what was being kept.
      title.textContent = `${strings.insight} ${level}`
      panel.appendChild(title)

      const sub = document.createElement('div')
      sub.className = 'levelup-sub'
      sub.textContent = strings.chooseTechnique
      panel.appendChild(sub)

      const list = document.createElement('div')
      list.className = 'levelup-cards'

      for (const tech of offer) {
        const have = owned.get(tech.id) ?? 0
        const card = document.createElement('button')
        card.type = 'button'
        card.className = 'card' + (tech.kind === 'art' ? ' card-art' : '')

        const name = document.createElement('div')
        name.className = 'card-name'
        name.textContent = tech.name

        const blurb = document.createElement('div')
        blurb.className = 'card-blurb'
        blurb.textContent = tech.blurb

        const rank = document.createElement('div')
        rank.className = 'card-rank'
        // "New" is worth calling out: a fresh art changes what the run looks
        // like, and that is the choice most worth noticing.
        rank.textContent = have === 0 ? strings.newTechnique : `${have + 1} / ${tech.maxLevel}`

        card.append(name, blurb, rank)
        card.addEventListener('click', () => {
          const handler = onPickHandler
          // Cleared before calling, so a double tap cannot spend two level-ups.
          onPickHandler = null
          handler?.(tech)
        })
        list.appendChild(card)
      }

      panel.appendChild(list)
      panel.hidden = false
      shown = true
      requestAnimationFrame(() => panel.classList.add('shown'))
    },

    hide() {
      panel.classList.remove('shown')
      panel.hidden = true
      shown = false
      onPickHandler = null
    },
  }
}
