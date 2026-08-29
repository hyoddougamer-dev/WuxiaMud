/**
 * The hub — where the character lives between expeditions.
 *
 * The version this replaces was reported, accurately, as a wall of text. It was
 * one continuous scroll holding a header, a cultivation bar, four attribute
 * rows carrying two numbers each, four equipment slots of stacked full-width
 * cards, five map cards with a rule and a drop list apiece, a button and a row
 * of lifetime totals. Ten blocks, all text, all at once — and in a game drawn
 * entirely in ink silhouettes it never once drew the swordsman.
 *
 * That last part was the real failure. The wardrobe can assemble nine hundred
 * distinguishable figures and the whole point of the loot is that you can see
 * it, yet the screen where you choose your equipment described it in words.
 *
 * The rebuild follows what mobile action games have converged on, for reasons
 * that hold here too:
 *
 *   THE CHARACTER IS THE SCREEN.  Rendered large, centred, above everything.
 *     It is the reward for playing, so it gets the space rather than the stats.
 *   THREE TABS, NOT ONE SCROLL.  剑 who you are · 装 what you carry · 界 where
 *     you go. One screen answers one question. Three to five destinations is
 *     also the ceiling before a tab bar starts costing more than it saves.
 *   THE PRIMARY ACTION IS PINNED.  "Set out" sits above the tabs and never
 *     scrolls away, so leaving is never something you have to go and find.
 *   ONE LINE PER FACT.  An attribute is its rank and what it currently buys, on
 *     one line. It used to take two.
 *
 * Built as DOM rather than canvas for the same reason the HUD is: crisp text at
 * any device pixel ratio, real scrolling, real tap targets, and none of it
 * competing with the render loop — which is idle on this screen anyway. The
 * figure is inline SVG from the same pure geometry the game renders in play, so
 * it costs no canvas and cannot drift from what you will actually be.
 */
import {
  ATTRIBUTES,
  type Attributes,
  type Character,
  emptyAttributes,
  spendPoint,
  xpForCultivation,
} from '../meta/character'
import { MAX_DEPTH, REGIONS, depthReward, regionAt } from '../data/regions'
import { schoolById } from '../meta/schools'
import {
  equip,
  equippedIn,
  equippedItems,
  ownedInSlot,
  rankOf,
  type OwnedItem,
} from '../meta/inventory'
import { ITEM_BY_ID, SLOTS, SLOT_NAMES, statLine, type Item, type Slot } from '../data/items'
import { weaponById, type WeaponClass } from '../data/weapons'
import { LEVELS_PER_REALM, REALMS, realmIndex, realmOf, realmStep } from '../meta/realms'
import { BODY_HP, EDGE_DAMAGE, SPIRIT_ART, SWIFT_INTERVAL, attributeBonuses } from '../sim/loadout'
import { PLAYER_MAX_HP } from '../sim/combat'
import { portraitSvg } from '../render/silhouette'
import { gearFromIds } from '../render/wardrobe'
import { packIconSvg, PACK_SLOT_ICON } from '../render/packIcons'
import { palette } from '../render/palette'
import { strings } from './strings'

export interface HubScreen {
  /** Shows the hub for `character`. `onSetOut` receives the chosen depth. */
  show(character: Character, onSetOut: (depth: number) => void): void
  hide(): void
  readonly visible: boolean
}

/**
 * What the hub needs in order to draw the roster strip.
 *
 * Passed as a getter rather than a value because the roster changes underneath
 * the hub — a swordsman is added, or the active one switches — and a snapshot
 * taken when the hub was constructed would draw a stale strip forever.
 */
export interface RosterView {
  /** Every swordsman, in the order they were made. */
  all(): readonly Character[]
  /** Index of the one currently being played. */
  activeIndex(): number
  /** Switch to another swordsman. */
  select(index: number): void
  /** Make a new one. Only offered while there is room. */
  add(): void
  /** Give up the active swordsman. Asks first — see main.ts. */
  discard(): void
  /** How many the save will hold. */
  readonly limit: number
}

type TabId = 'self' | 'gear' | 'world'

interface Tab {
  readonly id: TabId
  readonly seal: string
  readonly name: string
}

const TABS: readonly Tab[] = [
  { id: 'self', seal: '剑', name: 'Swordsman' },
  { id: 'gear', seal: '装', name: 'Equipment' },
  { id: 'world', seal: '界', name: 'World' },
] as const

/** Escapes text destined for innerHTML. The name comes from a text field. */
function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
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
 * Showing "Body 4" tells a player nothing. Showing "148 health" tells them what
 * the last four points bought, which is the difference between spending a point
 * and guessing.
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
  roster: RosterView,
): HubScreen {
  const panel = document.createElement('div')
  panel.className = 'hub'
  panel.hidden = true
  root.appendChild(panel)

  let shown = false
  let character: Character | null = null
  let onSetOutHandler: ((depth: number) => void) | null = null
  let chosenDepth = 1
  // Kept across renders so spending a point does not throw the player back to
  // the first tab — a screen that loses your place on every tap feels broken
  // long before anyone works out why.
  let tab: TabId = 'self'

  /** The swordsman as they currently stand, gear and rank and all. */
  const portrait = (c: Character, box: number): string => {
    const worn = equippedItems(c.inventory)
    const styleFor = (slot: Slot): string | undefined =>
      worn.find((item) => item.slot === slot)?.styleId
    // Rank is worn, not merely listed. Without this the whole vertical axis
    // lives in a number on a card, which is the one place a player is not
    // looking while deciding what to put on.
    const ranked = worn.map((item) => ({ slot: item.slot, rank: rankOf(c.inventory, item.id) }))
    return portraitSvg(
      gearFromIds({
        robe: styleFor('robe'),
        shoulders: styleFor('shoulders'),
        head: styleFor('head'),
        blade: styleFor('weapon') ?? schoolById(c.origin).weaponId,
      }),
      c.look,
      { box, ranked },
    )
  }

  /**
   * One tappable equipment chip.
   *
   * A weapon shows how it plays rather than a stat, because that is what
   * changes when you equip it — "+2 damage" on a spear would describe the least
   * interesting thing about picking up a spear.
   */
  const itemCard = (
    item: Item,
    entry: OwnedItem,
    worn: boolean,
    slot: Slot,
  ): HTMLButtonElement => {
    const card = document.createElement('button')
    card.type = 'button'
    card.className =
      'item' + (worn ? ' item-worn' : '') + (item.rarity > 0 ? ` item-r${item.rarity}` : '')
    // At the rank held, not the base: a rank 4 robe that still advertises its
    // rank 0 line would make the whole axis invisible where it is compared.
    const line =
      slot === 'weapon' ? weaponById(item.styleId).blurb : statLine(item.stat, entry.rank)
    // Rank as pips rather than a number: the card is 158px wide on a phone and
    // already carries a name and a line of effect, and "rank 3" would need a
    // word of explanation that four dots does not.
    const pips =
      entry.rank > 0
        ? `<span class="item-rank">${'·'.repeat(entry.rank)}</span>`
        : ''
    card.innerHTML = `
      <div class="item-name">${item.name}${pips}</div>
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

  // --- the panes ---------------------------------------------------------

  /** 剑 — who you are. Figure, what your numbers currently buy, and the points. */
  const paneSelf = (c: Character, total: Attributes, weapon: WeaponClass): HTMLElement => {
    const pane = document.createElement('div')
    pane.className = 'pane'

    const stage = document.createElement('div')
    stage.className = 'stage'
    stage.innerHTML = portrait(c, 84)
    pane.appendChild(stage)

    const attrs = document.createElement('div')
    attrs.className = 'block'
    const attrHead = document.createElement('div')
    attrHead.className = 'block-head'
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

      // One line, not two. Seal, name, rank, and what it currently buys — the
      // old layout stacked the value under the name and doubled the height of
      // this block for no information gained.
      const gear = attr.id in c.spent ? total[attr.id] - c.spent[attr.id] : 0
      row.innerHTML = `
        <div class="attr-seal">${attr.seal}</div>
        <div class="attr-text">
          <span class="attr-name">${attr.name}</span>
          <span class="attr-rank">${c.spent[attr.id]}</span>${
            // The gear half is shown separately so a player can see which of
            // their numbers they bought and which they are wearing — and
            // therefore what a swap would cost them.
            gear > 0 ? `<span class="attr-gear">+${gear}</span>` : ''
          }
          <span class="attr-now">${currentValue(attr.id, total, weapon)}</span>
        </div>
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

      row.appendChild(button)
      attrs.appendChild(row)
    }
    pane.appendChild(attrs)

    if (c.runs > 0) {
      const totals = document.createElement('div')
      totals.className = 'hub-totals'
      totals.innerHTML = `
        <span>${strings.expeditions} <b>${c.runs}</b></span>
        <span>${strings.longest} <b>${formatTime(c.bestSeconds)}</b></span>
        <span>${strings.lifetimeKills} <b>${c.totalKills}</b></span>
      `
      pane.appendChild(totals)
    }

    pane.appendChild(rosterStrip())
    return pane
  }

  /**
   * The roster: every swordsman kept, and the way to make another.
   *
   * This replaced a single `New swordsman` button that DESTROYED the character
   * you were playing. That was merely blunt while the game was classless; with
   * the weapon in hand deciding how you fight, trying the spear would have
   * meant deleting the swordsman who carries a sabre, and no loot game asks
   * that. Switching is now free and discarding is a separate, stated act.
   */
  const rosterStrip = (): HTMLElement => {
    const block = document.createElement('div')
    block.className = 'block roster'

    const head = document.createElement('div')
    head.className = 'block-head'
    head.innerHTML =
      `<span>${strings.roster}</span>` +
      `<span class="block-note">${roster.all().length} / ${roster.limit}</span>`
    block.appendChild(head)

    const row = document.createElement('div')
    // Scrolls sideways rather than wrapping, for the same reason the equipment
    // slots do: this pane is already taller than a phone.
    row.className = 'roster-row'
    roster.all().forEach((entry, index) => {
      const active = index === roster.activeIndex()
      const card = document.createElement('button')
      card.type = 'button'
      card.className = 'roster-card' + (active ? ' roster-on' : '')
      card.innerHTML =
        `<div class="roster-figure">${portrait(entry, 62)}</div>` +
        `<div class="roster-name">${entry.name}</div>` +
        `<div class="roster-sub">${realmOf(entry.level).seal} ${entry.level}</div>`
      // Tapping the one already active is a no-op rather than a reload: a
      // rebuild that throws the player back to the first tab reads as a bug.
      if (!active) card.addEventListener('click', () => roster.select(index))
      row.appendChild(card)
    })

    if (roster.all().length < roster.limit) {
      const add = document.createElement('button')
      add.type = 'button'
      add.className = 'roster-card roster-add'
      add.innerHTML = `<div class="roster-plus">+</div><div class="roster-name">${strings.newSwordsman}</div>`
      add.addEventListener('click', () => roster.add())
      row.appendChild(add)
    }
    block.appendChild(row)

    if (roster.all().length >= roster.limit) {
      const note = document.createElement('div')
      note.className = 'roster-full'
      note.textContent = strings.rosterFull
      block.appendChild(note)
    }

    // Deliberately plain text rather than a button, and last. Giving up a
    // swordsman is now a rare, deliberate act instead of the only way to reach
    // character creation, so it should not look like the thing to tap.
    const give = document.createElement('button')
    give.type = 'button'
    give.className = 'roster-give'
    give.textContent = strings.giveUp
    give.addEventListener('click', () => roster.discard())
    block.appendChild(give)

    return block
  }

  /** 装 — what you carry. The figure stays, because this is where it changes. */
  const paneGear = (c: Character): HTMLElement => {
    const pane = document.createElement('div')
    pane.className = 'pane'

    const stage = document.createElement('div')
    stage.className = 'stage stage-small'
    stage.innerHTML = portrait(c, 84)
    pane.appendChild(stage)

    for (const slot of SLOTS) {
      const owned = ownedInSlot(c.inventory, slot)
      const wornId = c.inventory.equipped[slot]

      const group = document.createElement('div')
      group.className = 'slot'
      const label = document.createElement('div')
      label.className = 'slot-name'
      // The slot's own icon, so the eye finds "where are my shoulders" without
      // reading four headings. See src/render/packIcons.ts.
      label.innerHTML =
        packIconSvg(PACK_SLOT_ICON[slot] ?? '', palette.ink, 1, 'slot-icon') +
        `<span>${SLOT_NAMES[slot]}</span>`
      group.appendChild(label)

      if (owned.length === 0) {
        // An empty slot used to be skipped entirely, and that hid the single
        // most useful thing this screen can say. "What am I missing?" is the
        // question that sends a player back out, and it was unanswerable from
        // the screen that should be asking it.
        const empty = document.createElement('div')
        empty.className = 'slot-empty'
        empty.textContent = strings.slotEmpty
        group.appendChild(empty)
      } else {
        const row = document.createElement('div')
        // Scrolls sideways rather than stacking. A slot with six finds used to
        // add six full-width cards to a page that was already too long.
        row.className = 'slot-items'
        for (const { item, entry } of owned) {
          row.appendChild(itemCard(item, entry, item.id === wornId, slot))
        }
        group.appendChild(row)
      }
      pane.appendChild(group)
    }
    return pane
  }

  /** 界 — where you go. Five places, each with its rule and what it keeps. */
  const paneWorld = (c: Character): HTMLElement => {
    const pane = document.createElement('div')
    pane.className = 'pane'
    const unlocked = Math.min(MAX_DEPTH, c.depth)

    const map = document.createElement('div')
    map.className = 'map'
    for (const place of REGIONS) {
      const locked = place.depth > unlocked
      const chosen = place.depth === chosenDepth

      const card = document.createElement('button')
      card.type = 'button'
      card.className = 'place' + (chosen ? ' place-on' : '') + (locked ? ' place-locked' : '')
      card.disabled = locked

      const found = place.drops
        .map((id) => ITEM_BY_ID.get(id)?.name)
        .filter(Boolean)
        .join(' · ')

      card.innerHTML = `
        <div class="place-seal">${place.seal}</div>
        <div class="place-body">
          <div class="place-name">${place.name}</div>
          <div class="place-rule">${place.ruleText}</div>
          <div class="place-found">${found}</div>
          ${
            locked
              ? `<div class="place-locked-note">${strings.opensAtRealm} ${place.depth}</div>`
              : `<div class="place-reward">×${depthReward(place.depth).toFixed(1)} ${strings.reward}</div>`
          }
        </div>
      `
      card.addEventListener('click', () => {
        chosenDepth = place.depth
        render()
      })
      map.appendChild(card)
    }
    pane.appendChild(map)
    return pane
  }

  const render = (): void => {
    const c = character
    if (!c) return

    const realm = realmOf(c.level)
    const need = xpForCultivation(c.level)
    const pct = Math.max(0, Math.min(1, c.xp / need))

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
      if (
        stat.kind === 'body' ||
        stat.kind === 'edge' ||
        stat.kind === 'swift' ||
        stat.kind === 'spirit'
      ) {
        fromGear[stat.kind] += stat.amount
      }
    }
    const total: Attributes = {
      body: c.spent.body + fromGear.body,
      edge: c.spent.edge + fromGear.edge,
      swift: c.spent.swift + fromGear.swift,
      spirit: c.spent.spirit + fromGear.spirit,
    }

    panel.innerHTML = ''

    // --- identity, always on screen ---------------------------------------
    const head = document.createElement('div')
    head.className = 'hub-head'
    head.innerHTML = `
      <div class="hub-seal">${realm.seal}</div>
      <div class="hub-ident">
        <div class="hub-name">${escapeHtml(c.name)}</div>
        <div class="hub-realm">${realm.name}
          <span class="hub-level">${strings.level} ${c.level}</span>
          <span class="hub-step">${realmStep(c.level)} / ${
            // The top realm never promotes, so a "/ 5" there would promise a
            // ceremony that is never coming.
            realmIndex(c.level) === REALMS.length - 1 ? '∞' : LEVELS_PER_REALM
          }</span>
        </div>
        <div class="hub-cult-track"><div class="hub-cult-fill"></div></div>
      </div>
      <button class="hub-codex" type="button" aria-label="${strings.openCodex}">?</button>
    `
    head.querySelector<HTMLButtonElement>('.hub-codex')!.addEventListener('click', onOpenCodex)
    head.querySelector<HTMLElement>('.hub-cult-fill')!.style.transform = `scaleX(${pct})`
    head.title = `${strings.cultivation} ${c.xp} / ${need}`
    panel.appendChild(head)

    // --- the pane ---------------------------------------------------------
    const body = document.createElement('div')
    body.className = 'hub-body'
    body.appendChild(
      tab === 'self' ? paneSelf(c, total, weapon) : tab === 'gear' ? paneGear(c) : paneWorld(c),
    )
    panel.appendChild(body)

    // --- pinned action ----------------------------------------------------
    // Above the tabs and never scrolled away. Leaving is the reason the screen
    // exists; having to hunt for it was the single worst thing about the old
    // layout, since it sat under everything else.
    const region = regionAt(chosenDepth)
    const action = document.createElement('div')
    action.className = 'hub-action'
    action.innerHTML = `
      <div class="hub-dest">
        <span class="hub-dest-seal">${region.seal}</span>
        <span class="hub-dest-name">${region.name}</span>
      </div>
      <button class="hub-go" type="button">${strings.setOut}</button>
    `
    action.querySelector<HTMLButtonElement>('.hub-go')!.addEventListener('click', () => {
      const handler = onSetOutHandler
      // Cleared before calling, so a double tap cannot start two expeditions.
      onSetOutHandler = null
      handler?.(chosenDepth)
    })
    panel.appendChild(action)

    // --- tabs -------------------------------------------------------------
    const tabs = document.createElement('div')
    tabs.className = 'hub-tabs'
    for (const item of TABS) {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'tab' + (item.id === tab ? ' tab-on' : '')
      button.innerHTML = `<span class="tab-seal">${item.seal}</span><span class="tab-name">${item.name}</span>`
      button.addEventListener('click', () => {
        if (tab === item.id) return
        tab = item.id
        render()
      })
      tabs.appendChild(button)
    }
    panel.appendChild(tabs)
  }

  return {
    get visible() {
      return shown
    },

    show(c, onSetOut) {
      character = c
      onSetOutHandler = onSetOut
      chosenDepth = Math.min(Math.max(1, c.depth), MAX_DEPTH)
      // Opens on the swordsman. A player returning from a death wants to see
      // what the death bought before deciding where to go next.
      tab = 'self'
      render()
      panel.hidden = false
      shown = true
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
