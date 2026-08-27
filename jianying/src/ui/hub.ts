/**
 * The hub — where the character lives between expeditions.
 *
 * This screen is the answer to two separate pieces of feedback. The first was
 * that the game had no shape: it opened straight into a fight and ended in a
 * fight, so there was nowhere for a player to stand and see what they had. The
 * second, and the one that drove the whole redesign, was not understanding what
 * was happening — and a survivors-like where every number is temporary and
 * invisible is genuinely hard to understand, no matter how well it plays.
 *
 * So the hub states everything plainly and in one place: what realm you are,
 * how far to the next level, what each attribute does in the units the HUD
 * shows, and which road you are about to walk. Nothing here is a surprise to be
 * discovered. The discovery belongs in the expedition.
 *
 * Built as DOM rather than canvas for the same reason the HUD is: crisp text at
 * any device pixel ratio, real scrolling, real tap targets, and none of it
 * competing with the render loop — which is idle on this screen anyway.
 */
import {
  ATTRIBUTES,
  type Attributes,
  type Character,
  emptyAttributes,
  spendPoint,
  xpForCultivation,
} from '../meta/character'
import { MAX_DEPTH, ROADS, depthReward, roadOf } from '../meta/depth'
import { schoolById } from '../meta/schools'
import { equip, equippedIn, equippedItems, ownedInSlot } from '../meta/inventory'
import { SLOTS, SLOT_NAMES, statLine, type Item, type Slot } from '../data/items'
import { weaponById, type WeaponClass } from '../data/weapons'
import { LEVELS_PER_REALM, REALMS, realmIndex, realmOf, realmStep } from '../meta/realms'
import { BODY_HP, EDGE_DAMAGE, SPIRIT_ART, SWIFT_INTERVAL, attributeBonuses } from '../sim/loadout'
import { PLAYER_MAX_HP } from '../sim/combat'
import { strings } from './strings'

export interface HubScreen {
  /** Shows the hub for `character`. `onSetOut` receives the chosen depth. */
  show(character: Character, onSetOut: (depth: number) => void): void
  hide(): void
  readonly visible: boolean
}

/** Escapes text destined for innerHTML. The name comes from a text field. */
function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  )
}

/** mm:ss, matching the HUD so the same duration reads the same everywhere. */
function formatTime(seconds: number): string {
  const total = Math.floor(seconds)
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, '0')}`
}

/**
 * What an attribute is currently worth, in the units the player sees in play.
 *
 * Showing "Body 4" tells a player nothing. Showing "Body 4 · 148 health" tells
 * them what the next point buys and what the last four bought, which is the
 * difference between spending a point and guessing.
 */
function currentValue(id: string, spent: Attributes, weapon: WeaponClass): string {
  const attr = attributeBonuses(spent)
  switch (id) {
    case 'body':
      return `${Math.round(PLAYER_MAX_HP + attr.maxHp)} health`
    case 'edge':
      // Quoted against the equipped weapon, because "12.3 damage" would be a
      // lie the moment the player picked up a zhanmadao.
      return `${(weapon.damage + attr.slashDamage).toFixed(1)} damage`
    case 'swift':
      return `${(weapon.interval * attr.slashIntervalScale).toFixed(2)}s per sweep`
    case 'spirit':
      return `${Math.round(attr.artScale * 100)}% art power`
    default:
      return ''
  }
}

/** The same figure one more point would produce, for the "→" preview. */
function nextValue(id: string, spent: Attributes, weapon: WeaponClass): string {
  switch (id) {
    case 'body':
      return `${Math.round(PLAYER_MAX_HP + (spent.body + 1) * BODY_HP)}`
    case 'edge':
      return `${(weapon.damage + (spent.edge + 1) * EDGE_DAMAGE).toFixed(1)}`
    case 'swift':
      return `${(weapon.interval * Math.pow(SWIFT_INTERVAL, spent.swift + 1)).toFixed(2)}s`
    case 'spirit':
      return `${Math.round((1 + (spent.spirit + 1) * SPIRIT_ART) * 100)}%`
    default:
      return ''
  }
}

/**
 * `onSave` fires whenever the character is mutated here.
 *
 * Persisting on every point spent rather than only on leaving: a player who
 * assigns points and then closes the app has made a decision, and losing it
 * would be indistinguishable from the game being broken.
 */
export function createHub(
  root: HTMLElement,
  onSave: () => void,
  onOpenCodex: () => void,
): HubScreen {
  const panel = document.createElement('div')
  panel.className = 'hub'
  panel.hidden = true
  root.appendChild(panel)

  let shown = false
  let character: Character | null = null
  let onSetOutHandler: ((depth: number) => void) | null = null
  let chosenDepth = 1

  /**
   * One tappable equipment card.
   *
   * A weapon shows how it plays rather than a stat, because that is what
   * changes when you equip it — "+2 damage" on a spear would describe the least
   * interesting thing about picking up a spear.
   */
  const itemCard = (item: Item, worn: boolean, slot: Slot): HTMLButtonElement => {
    const card = document.createElement('button')
    card.type = 'button'
    card.className =
      'item' + (worn ? ' item-worn' : '') + (item.rarity > 0 ? ` item-r${item.rarity}` : '')

    const line =
      slot === 'weapon' ? weaponById(item.styleId).blurb : statLine(item.stat)
    card.innerHTML = `
      <div class="item-name">${item.name}</div>
      <div class="item-line">${line}</div>
    `
    card.addEventListener('click', () => {
      if (!character || worn) return
      if (!equip(character.inventory, item.id)) return
      onSave()
      render()
    })
    return card
  }

  const render = (): void => {
    const c = character
    if (!c) return

    const realm = realmOf(c.level)
    const need = xpForCultivation(c.level)
    const pct = Math.max(0, Math.min(1, c.xp / need))
    const road = roadOf(chosenDepth)
    const unlocked = Math.min(MAX_DEPTH, c.depth)

    panel.innerHTML = ''

    // --- identity ------------------------------------------------------
    // The name and origin lead, and the realm follows. A panel that opens on
    // "Body Tempering" describes a rank; one that opens on "Bai Anzhi, of the
    // Mountain Sect" describes somebody the numbers below belong to.
    const school = schoolById(c.origin)
    const weaponItem = equippedIn(c.inventory, 'weapon')
    const weapon = weaponById(weaponItem?.styleId ?? school.weaponId)

    // Attributes granted by worn equipment count exactly like bought ones in
    // combat, so the hub must quote the combined figure. Quoting only the
    // bought half was a straightforward lie: it read "0.26s per sweep" while
    // the game ran at 0.24s, and this screen exists to be believed.
    const fromGear = emptyAttributes()
    for (const item of equippedItems(c.inventory)) {
      const stat = item.stat
      if (!stat) continue
      if (stat.kind === 'body' || stat.kind === 'edge' || stat.kind === 'swift' || stat.kind === 'spirit') {
        fromGear[stat.kind] += stat.amount
      }
    }
    const total: Attributes = {
      body: c.spent.body + fromGear.body,
      edge: c.spent.edge + fromGear.edge,
      swift: c.spent.swift + fromGear.swift,
      spirit: c.spent.spirit + fromGear.spirit,
    }
    const head = document.createElement('div')
    head.className = 'hub-head'
    head.innerHTML = `
      <div class="hub-seal">${realm.seal}</div>
      <div class="hub-ident">
        <div class="hub-name">${escapeHtml(c.name)}</div>
        <div class="hub-origin">${school.seal} ${school.name}</div>
        <div class="hub-realm">${realm.name}
          <span class="hub-level">${strings.level} ${c.level}</span>
          <span class="hub-step">${realmStep(c.level)} / ${
            // The top realm never promotes, so a "/ 5" there would promise a
            // ceremony that is never coming.
            realmIndex(c.level) === REALMS.length - 1 ? '∞' : LEVELS_PER_REALM
          }</span>
        </div>
      </div>
      <button class="hub-codex" type="button" aria-label="${strings.openCodex}">?</button>
    `
    head.querySelector<HTMLButtonElement>('.hub-codex')!.addEventListener('click', onOpenCodex)
    panel.appendChild(head)

    // --- cultivation bar -----------------------------------------------
    const bar = document.createElement('div')
    bar.className = 'hub-cult'
    bar.innerHTML = `
      <div class="hub-cult-row">
        <span>${strings.cultivation}</span>
        <b>${c.xp} / ${need}</b>
      </div>
      <div class="hub-cult-track"><div class="hub-cult-fill"></div></div>
    `
    panel.appendChild(bar)
    bar.querySelector<HTMLElement>('.hub-cult-fill')!.style.transform = `scaleX(${pct})`

    // --- attributes -----------------------------------------------------
    const attrs = document.createElement('div')
    attrs.className = 'hub-section'
    const attrHead = document.createElement('div')
    attrHead.className = 'hub-section-head'
    attrHead.innerHTML = `<span>${strings.attributes}</span>`
    if (c.points > 0) {
      const badge = document.createElement('b')
      badge.className = 'hub-points'
      badge.textContent = `${c.points} ${
        c.points === 1 ? strings.onePointToSpend : strings.pointsToSpend
      }`
      attrHead.appendChild(badge)
    }
    attrs.appendChild(attrHead)

    for (const attr of ATTRIBUTES) {
      const row = document.createElement('div')
      row.className = 'attr'

      const seal = document.createElement('div')
      seal.className = 'attr-seal'
      seal.textContent = attr.seal

      const text = document.createElement('div')
      text.className = 'attr-text'
      // The gear half is shown as its own "+n" rather than folded into the
      // rank, so a player can see which of their numbers they bought and which
      // they are wearing — and therefore what they would lose by swapping.
      const gear = fromGear[attr.id]
      text.innerHTML = `
        <div class="attr-name">${attr.name} <span class="attr-rank">${c.spent[attr.id]}</span>${
          gear > 0 ? `<span class="attr-gear">+${gear}</span>` : ''
        }</div>
        <div class="attr-now">${currentValue(attr.id, total, weapon)}</div>
      `

      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'attr-add'
      button.disabled = c.points <= 0
      // The button carries the preview, so the consequence of the tap is
      // written on the thing you are about to tap.
      button.innerHTML =
        c.points > 0
          ? `<span class="attr-plus">+</span><span class="attr-next">${nextValue(
              attr.id,
              total,
              weapon,
            )}</span>`
          : `<span class="attr-plus">+</span>`
      button.setAttribute('aria-label', `${attr.name}: ${attr.effect}`)
      button.addEventListener('click', () => {
        if (!character || !spendPoint(character, attr.id)) return
        onSave()
        render()
      })

      row.append(seal, text, button)
      attrs.appendChild(row)
    }
    panel.appendChild(attrs)

    // --- equipment --------------------------------------------------------
    // Four slots, each a row of what you own that fits it. No comparison table
    // and no tooltips: an item is a name, one line, and the silhouette it gives
    // you. A phone cannot hold a spreadsheet, and a player who has to study one
    // during a game about not standing still will simply stop reading it.
    const gearSection = document.createElement('div')
    gearSection.className = 'hub-section'
    gearSection.innerHTML = `<div class="hub-section-head"><span>${strings.equipment}</span></div>`

    for (const slot of SLOTS) {
      const owned = ownedInSlot(c.inventory, slot)
      if (owned.length === 0) continue
      const wornId = c.inventory.equipped[slot]

      const group = document.createElement('div')
      group.className = 'slot'
      const label = document.createElement('div')
      label.className = 'slot-name'
      label.textContent = SLOT_NAMES[slot]
      group.appendChild(label)

      const row = document.createElement('div')
      row.className = 'slot-items'
      for (const item of owned) {
        row.appendChild(itemCard(item, item.id === wornId, slot))
      }
      group.appendChild(row)
      gearSection.appendChild(group)
    }
    panel.appendChild(gearSection)

    // --- the road -------------------------------------------------------
    const roads = document.createElement('div')
    roads.className = 'hub-section'
    roads.innerHTML = `<div class="hub-section-head"><span>${strings.road}</span></div>`

    const pips = document.createElement('div')
    pips.className = 'road-pips'
    for (let d = 1; d <= MAX_DEPTH; d++) {
      const pip = document.createElement('button')
      pip.type = 'button'
      pip.className =
        'pip' + (d === chosenDepth ? ' pip-on' : '') + (d > unlocked ? ' pip-locked' : '')
      pip.textContent = String(d)
      pip.disabled = d > unlocked
      pip.setAttribute('aria-label', `${strings.depth} ${d}: ${ROADS[d - 1]!.name}`)
      pip.addEventListener('click', () => {
        chosenDepth = d
        render()
      })
      pips.appendChild(pip)
    }
    roads.appendChild(pips)

    const roadCard = document.createElement('div')
    roadCard.className = 'road-card'
    roadCard.innerHTML = `
      <div class="road-name"><span class="road-seal">${road.seal}</span> ${road.name}</div>
      <div class="road-blurb">${road.blurb}</div>
      <div class="road-reward">×${depthReward(chosenDepth).toFixed(1)} ${strings.reward}</div>
    `
    roads.appendChild(roadCard)
    panel.appendChild(roads)

    // --- set out --------------------------------------------------------
    const go = document.createElement('button')
    go.type = 'button'
    go.className = 'hub-go'
    go.textContent = strings.setOut
    go.addEventListener('click', () => {
      const handler = onSetOutHandler
      // Cleared before calling, so a double tap cannot start two expeditions.
      onSetOutHandler = null
      handler?.(chosenDepth)
    })
    panel.appendChild(go)

    // --- lifetime -------------------------------------------------------
    if (c.runs > 0) {
      const totals = document.createElement('div')
      totals.className = 'hub-totals'
      totals.innerHTML = `
        <span>${strings.expeditions} <b>${c.runs}</b></span>
        <span>${strings.longest} <b>${formatTime(c.bestSeconds)}</b></span>
        <span>${strings.lifetimeKills} <b>${c.totalKills}</b></span>
      `
      panel.appendChild(totals)
    }
  }

  return {
    get visible() {
      return shown
    },

    show(c, onSetOut) {
      character = c
      onSetOutHandler = onSetOut
      chosenDepth = Math.min(Math.max(1, c.depth), MAX_DEPTH)
      render()
      panel.hidden = false
      shown = true
      panel.scrollTop = 0
      requestAnimationFrame(() => panel.classList.add('shown'))
    },

    hide() {
      panel.classList.remove('shown')
      panel.hidden = true
      shown = false
      onSetOutHandler = null
    },
  }
}
