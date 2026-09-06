/**
 * The codex — what this game is, in one screen.
 *
 * Shown once after character creation, and reachable from the hub forever
 * after. The second part matters as much as the first: an explanation a player
 * can only ever see once, at the moment they know least, is barely an
 * explanation at all. Everything here should stay findable on the evening they
 * come back after a fortnight away.
 *
 * The content is deliberately about the LOOP rather than the controls. Controls
 * are taught in the first expedition, where they can be practised; what cannot
 * be taught by playing is why any of it accumulates — which was the actual
 * complaint, and is the one thing a survivors-like with a persistent character
 * has to say out loud.
 */
import { strings } from './strings'

export interface CodexScreen {
  show(onClose: () => void): void
  hide(): void
  readonly visible: boolean
}

interface Entry {
  seal: string
  title: string
  body: string
}

const ENTRIES: readonly Entry[] = [
  {
    seal: '一',
    title: 'You are a swordsman on the road',
    body: 'One thumb, one blade. Drag anywhere to move — the sword strikes on its own, always at whatever is nearest. The decision is never when to attack. It is where to stand.',
  },
  {
    seal: '二',
    title: 'An expedition is one road, walked until it kills you',
    body: 'It will. Enemies arrive faster than any swordsman can cut them, and every expedition ends the same way. That is the shape of the thing, not a failure.',
  },
  {
    seal: '三',
    title: 'Three skills, and 势 to fire them',
    body: 'You take three skills out. Two go off by themselves; the third is your button. Each costs 势 — four points that fill while you MOVE and buy nothing while you stand still. Standing still is what pays your damage off, and what stops paying for the next skill.',
  },
  {
    seal: '四',
    title: 'Cultivation is kept',
    body: 'Every expedition converts into cultivation, whether it went well or badly. Cultivation raises your Level, your Level raises your Realm, and each Level hands you a point to spend on your swordsman — permanently.',
  },
  {
    seal: '五',
    title: 'Growth opens the world, it does not soften it',
    body: 'Each Realm reached opens another place on the map, harder than the last and worth more. Staying on the Post Road forever remains possible; it simply pays less.',
  },
  {
    seal: '六',
    title: 'A place is not a difficulty — it has a rule',
    body: 'The marsh slows you. The cliff wind pushes and turns. In the Ghost Market everything you cut comes apart, so killing is not automatically right. Each place also keeps its own enemies, its own master, and gear that drops nowhere else — which is why you choose where to walk, and not merely how deep.',
  },
]

export function createCodex(root: HTMLElement): CodexScreen {
  const panel = document.createElement('div')
  panel.className = 'codex'
  panel.hidden = true
  root.appendChild(panel)

  let shown = false
  let onCloseHandler: (() => void) | null = null

  return {
    get visible() {
      return shown
    },

    show(onClose) {
      onCloseHandler = onClose
      panel.innerHTML = `
        <div class="codex-title">${strings.codexTitle}</div>
        <div class="codex-entries">
          ${ENTRIES.map(
            (e) => `
            <div class="codex-entry">
              <div class="codex-seal">${e.seal}</div>
              <div class="codex-body">
                <div class="codex-head">${e.title}</div>
                <div class="codex-text">${e.body}</div>
              </div>
            </div>`,
          ).join('')}
        </div>
        <button class="codex-go" type="button">${strings.understood}</button>
      `
      panel.querySelector<HTMLButtonElement>('.codex-go')!.addEventListener('click', () => {
        const handler = onCloseHandler
        onCloseHandler = null
        handler?.()
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
      onCloseHandler = null
    },
  }
}
