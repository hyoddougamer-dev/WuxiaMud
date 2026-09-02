/**
 * Character creation — the game's first question, and now an answerable one.
 *
 * Three versions, and the reasons for each change are worth keeping.
 *
 * The FIRST offered origins granting three or four attribute points. The
 * verdict was blunt and correct: you could not feel it. Three points is a
 * rounding error against a level-five character, so it was a form field
 * pretending to be a choice.
 *
 * The SECOND made a school decide your WEAPON, which decides the shape of the
 * automatic sweep — reach, arc, rhythm. Since the thumb is spent entirely on
 * movement, that shape is the whole of how the game plays. That part was right
 * and is kept. What was wrong was that the screen still described the choice in
 * words. In a game drawn entirely in ink silhouettes, a creation screen made of
 * text is a menu about a game rather than the front door to one.
 *
 * THIS version draws the swordsman. Every control on it changes the figure
 * standing at the top of the screen, immediately, and that figure is built by
 * the same geometry the game will render in play — not an illustration of it.
 * Picking the Pass Watch does not merely say "spear": the silhouette grows a
 * bamboo hat and a spear appears at its back.
 *
 * On what can be chosen. Armour is the appearance, by design — a robe is where
 * the hem goes, which is what makes loot visible at a glance. That means any
 * robe chosen here would be erased by the first robe that dropped, and a
 * creation screen whose choices last ten minutes is worse than none. So the
 * appearance controls are exactly the three things equipment cannot overwrite:
 * build, sash and brush hand. See meta/look.ts. The screen says as much rather
 * than letting the player discover it by losing something.
 *
 * Nothing here can still be got wrong: every weapon in the game drops, so a
 * school is where you begin, not what you are. It would be indefensible to lock
 * a build on the screen where the player knows least, and the subtitle says so.
 */
import { weaponById } from '../data/weapons'
import { portraitSvg } from '../render/silhouette'
// The painting the whole screen is built on. Imported rather than referenced
// from public/, so Vite inlines it as a data URI in the single-file build —
// where an external URL would simply be a broken image.
import roadArt from '../assets/road.webp'
import { gearFromIds } from '../render/wardrobe'
import { BEARINGS, BUILDS, PIGMENTS, SASHES, type Look } from '../meta/look'
import { ITEM_BY_ID } from '../data/items'
import { SCHOOLS, type School, rollName } from '../meta/schools'
import { strings } from './strings'

export interface CreateScreen {
  /**
   * `roll` supplies randomness for names and brush hands. `onDone` receives
   * every choice; `onCancel`, when given, adds a way back out — which is what
   * lets an existing player open this screen to look without losing anything.
   */
  show(
    roll: () => number,
    onDone: (name: string, school: School, look: Look) => void,
    onCancel?: () => void,
  ): void
  hide(): void
  readonly visible: boolean
}

/** The gear a school hands over, as the wardrobe styles that draw it. */
function gearForSchool(school: School): ReturnType<typeof gearFromIds> {
  const styleOf = (slot: string): string | undefined =>
    school.kit.map((id) => ITEM_BY_ID.get(id)).find((item) => item?.slot === slot)?.styleId
  return gearFromIds({
    robe: styleOf('robe'),
    shoulders: styleOf('shoulders'),
    head: styleOf('head'),
    blade: school.weaponId,
  })
}

export function createCreator(root: HTMLElement): CreateScreen {
  const panel = document.createElement('div')
  panel.className = 'create'
  panel.hidden = true
  root.appendChild(panel)

  let shown = false
  let onDoneHandler: ((name: string, school: School, look: Look) => void) | null = null

  return {
    get visible() {
      return shown
    },

    show(roll, onDone, onCancel) {
      onDoneHandler = onDone
      let school: School = SCHOOLS[0]!
      let look: Look = { seed: Math.floor(roll() * 0xffff) + 1, build: 1, sash: 0, bearing: 0, pigment: 0 }

      panel.innerHTML = `
        <div class="create-stage">
          <div class="create-portrait"></div>
          <div class="create-caption">
            <span class="create-cap-school"></span>
            <span class="create-cap-weapon"></span>
          </div>
        </div>
        <div class="create-scroll">
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

          <!-- Who you are comes BEFORE where you trained. The first version put
               the school picker first and buried "man or woman" and the dye
               under five school cards, at the bottom of a long scroll — which
               is the wrong order for the two questions a player expects to be
               asked first, and the wrong order for the two that change the
               figure most visibly. -->
          <div class="create-section">${strings.yourBearing}</div>
          <div class="create-note">${strings.bearingNote}</div>
          <div class="create-looks"></div>

          <div class="create-section">${strings.yourSchool}</div>
          <div class="create-origins"></div>
        </div>
        <div class="create-foot">
          ${onCancel ? `<button class="create-back" type="button">${strings.back}</button>` : ''}
          <!-- 印 — the seal. A Chinese painting is finished when its author
               presses their seal into it, and this screen is a painting being
               made: the swordsman is brushed on stroke by stroke above. A
               rectangle reading SUBMIT at the end of that would throw the whole
               conceit away in its last inch. -->
          <button class="create-go" type="button" aria-label="${strings.sealName}">
            <span class="seal-mark" aria-hidden="true">
              <span class="seal-glyph">剑</span>
              <span class="seal-glyph">影</span>
            </span>
            <span class="seal-text">
              <span class="seal-title">${strings.takeUpTheSword}</span>
              <span class="seal-hint">${strings.sealHint}</span>
            </span>
          </button>
        </div>
      `

      panel.style.setProperty('--road-art', `url(${roadArt})`)
      const stage = panel.querySelector<HTMLElement>('.create-portrait')!
      const capSchool = panel.querySelector<HTMLElement>('.create-cap-school')!
      const capWeapon = panel.querySelector<HTMLElement>('.create-cap-weapon')!

      /** Redraws the figure. Cheap: it is one SVG string, built from pure geometry. */
      const redraw = (): void => {
        // Standing on the road they are about to walk, rather than on nothing.
        // See PortraitOptions.region: the vignettes were painted for the world
        // tab and had never been drawn behind a character, and putting the same
        // figure somewhere turned out to move further than any change to the
        // figure itself.
        // `paint` re-brushes the swordsman from nothing on every change. That
        // is deliberate rather than wasteful: a figure that redraws instantly
        // makes a choice feel like a setting, and a figure that is painted
        // again makes it feel like a decision about a person. The whole SVG is
        // rebuilt anyway — it is pure geometry, a few hundred polygons — so the
        // animation is the only thing being added.
        // No `region` here: the painting behind the whole screen already IS the
        // 官道, and a second drawn road inside the portrait put two roads at two
        // scales on one image.
        stage.innerHTML = portraitSvg(gearForSchool(school), look, {
          box: 82,
          paint: true,
          wash: true,
        })
        const weapon = weaponById(school.weaponId)
        capSchool.textContent = `${school.seal} ${school.name}`
        capWeapon.textContent = `${weapon.seal} ${weapon.name}`
      }

      // --- name -----------------------------------------------------------
      // Prefilled and paired with a roll button on purpose. A text input is the
      // first thing a phone player would meet, and forcing a keyboard open
      // before the game has shown them anything is a bad trade. Typing stays
      // available for anyone who wants it.
      const input = panel.querySelector<HTMLInputElement>('.create-input')!
      input.value = rollName(roll)
      panel.querySelector<HTMLButtonElement>('.create-roll')!.addEventListener('click', () => {
        input.value = rollName(roll)
      })

      // --- school ----------------------------------------------------------
      const list = panel.querySelector<HTMLElement>('.create-origins')!
      const cards: HTMLButtonElement[] = []
      for (const option of SCHOOLS) {
        const weapon = weaponById(option.weaponId)
        const card = document.createElement('button')
        card.type = 'button'
        card.className = 'origin' + (option === school ? ' origin-on' : '')
        // A thumbnail of the swordsman this school produces, so the row is a
        // rank of five different silhouettes rather than five paragraphs. This
        // is the whole reason the figure builder was made pure.
        card.innerHTML = `
          <div class="origin-figure">${portraitSvg(gearForSchool(option), look, {
            box: 76,
            blade: true,
          })}</div>
          <div class="origin-text">
            <div class="origin-name">${option.seal} ${option.name}</div>
            <div class="origin-weapon">${weapon.name}</div>
            <div class="origin-effect">${weapon.blurb}</div>
          </div>
        `
        card.addEventListener('click', () => {
          school = option
          for (const other of cards) other.classList.remove('origin-on')
          card.classList.add('origin-on')
          redraw()
        })
        cards.push(card)
        list.appendChild(card)
      }

      // --- bearing ---------------------------------------------------------
      const looks = panel.querySelector<HTMLElement>('.create-looks')!

      /** One row of mutually exclusive chips that writes back into `look`. */
      const chipRow = (
        label: string,
        options: readonly { name: string }[],
        current: () => number,
        set: (index: number) => void,
      ): void => {
        const row = document.createElement('div')
        row.className = 'look-row'
        const title = document.createElement('div')
        title.className = 'look-label'
        title.textContent = label
        const chips = document.createElement('div')
        chips.className = 'look-chips'
        options.forEach((option, index) => {
          const chip = document.createElement('button')
          chip.type = 'button'
          chip.className = 'look-chip' + (index === current() ? ' look-chip-on' : '')
          chip.textContent = option.name
          chip.addEventListener('click', () => {
            set(index)
            for (const other of chips.children) other.classList.remove('look-chip-on')
            chip.classList.add('look-chip-on')
            redraw()
          })
          chips.appendChild(chip)
        })
        row.append(title, chips)
        looks.appendChild(row)
      }

      chipRow(
        strings.bearingRow,
        BEARINGS,
        () => look.bearing,
        (index) => (look = { ...look, bearing: index }),
      )
      // --- dye -------------------------------------------------------------
      // Swatches, not named chips. A row of identical grey buttons reading
      // "Cinnabar / Indigo / Malachite" would be an absurd control in a game
      // whose complaint was that it looked monochrome.
      {
        const row = document.createElement('div')
        row.className = 'look-row'
        const title = document.createElement('div')
        title.className = 'look-label'
        title.textContent = strings.pigmentLabel
        const chips = document.createElement('div')
        chips.className = 'look-chips'
        PIGMENTS.forEach((pigment, index) => {
          const chip = document.createElement('button')
          chip.type = 'button'
          chip.className = 'dye-chip' + (index === look.pigment ? ' dye-chip-on' : '')
          chip.textContent = pigment.seal
          chip.style.background =
            pigment.colour === null
              ? 'rgba(13,13,13,0.08)'
              : `#${pigment.colour.toString(16).padStart(6, '0')}`
          if (pigment.colour === null) chip.style.color = 'rgba(13,13,13,0.55)'
          chip.setAttribute('aria-label', pigment.name)
          chip.addEventListener('click', () => {
            look = { ...look, pigment: index }
            for (const other of chips.children) other.classList.remove('dye-chip-on')
            chip.classList.add('dye-chip-on')
            redraw()
          })
          chips.appendChild(chip)
        })
        row.append(title, chips)
        looks.appendChild(row)
      }
      chipRow(
        strings.buildLabel,
        BUILDS,
        () => look.build,
        (index) => (look = { ...look, build: index }),
      )
      chipRow(
        strings.sashLabel,
        SASHES,
        () => look.sash,
        (index) => (look = { ...look, sash: index }),
      )

      // The brush hand has no menu, because there is nothing to name: it is the
      // jitter every stroke is swept with. A button that redraws it is the only
      // honest control for something you can see but cannot describe.
      const handRow = document.createElement('div')
      handRow.className = 'look-row'
      handRow.innerHTML = `<div class="look-label">${strings.brushLabel}</div>`
      const hand = document.createElement('button')
      hand.type = 'button'
      hand.className = 'look-chip'
      hand.textContent = strings.anotherHand
      hand.addEventListener('click', () => {
        look = { ...look, seed: Math.floor(roll() * 0xffff) + 1 }
        redraw()
      })
      handRow.appendChild(hand)
      looks.appendChild(handRow)

      // --- commit ------------------------------------------------------------
      panel.querySelector<HTMLButtonElement>('.create-go')!.addEventListener('click', () => {
        const handler = onDoneHandler
        onDoneHandler = null
        // An empty field must not produce a nameless character, so it falls
        // back to a rolled name rather than refusing to continue.
        const name = input.value.trim() || rollName(roll)
        handler?.(name.slice(0, 24), school, look)
      })
      panel.querySelector<HTMLButtonElement>('.create-back')?.addEventListener('click', () => {
        onDoneHandler = null
        onCancel?.()
      })

      redraw()
      panel.hidden = false
      shown = true
      panel.querySelector('.create-scroll')!.scrollTop = 0
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
