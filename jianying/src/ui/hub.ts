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
  spendPoint,
  xpForCultivation,
} from '../meta/character'
import { MAX_DEPTH, REGIONS, depthReward, regionAt } from '../data/regions'
import { schoolById } from '../meta/schools'
import {
  BAG_CAPACITY,
  baseOf,
  carried,
  carriedInSlot,
  equip,
  equippedIn,
  equippedItems,
  unequip,
  type OwnedItem,
} from '../meta/inventory'
import { ITEM_BY_ID, SLOTS, SLOT_NAMES, type Item, type Slot } from '../data/items'
import { kitOf } from '../meta/kit'
import { POWER_BY_ID, affixLine } from '../data/affixes'
import { rarityOf, rarityStyle } from '../data/rarity'
import { weaponById, type WeaponClass } from '../data/weapons'
import { LEVELS_PER_REALM, REALMS, realmIndex, realmOf, realmStep } from '../meta/realms'
import {
  BODY_HP,
  EDGE_POWER,
  SPIRIT_ART,
  SWIFT_SPEED,
  attributeBonuses,
  deriveStats,
  wornAttributes,
  type Kit,
  type Stats,
} from '../sim/loadout'
import { PLAYER_MAX_HP } from '../sim/combat'
import { portraitSvg } from '../render/silhouette'
import { gearFromIds } from '../render/wardrobe'
import { packIconSvg, effectIconSvg, itemIconSvg, PACK_SLOT_ICON } from '../render/packIcons'
import { CONDITIONS, CONDITION_BY_ID } from '../data/arts'
import {
  SKILL_BY_ID,
  SLOTTED_SKILLS,
  defaultBar,
  skillsFor,
  type Skill,
} from '../data/skills'
import { skillReading } from '../sim/skills'
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

type TabId = 'self' | 'gear' | 'arts' | 'world'

interface Tab {
  readonly id: TabId
  readonly seal: string
  readonly name: string
}

const TABS: readonly Tab[] = [
  { id: 'self', seal: '剑', name: 'Swordsman' },
  { id: 'gear', seal: '装', name: 'Equipment' },
  { id: 'arts', seal: '法', name: 'Skills' },
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
      return `${(weapon.damage * (1 + attr.power / 100)).toFixed(1)} damage`
    case 'swift':
      return `${(weapon.interval / (1 + attr.speed / 100)).toFixed(2)}s per sweep`
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
      return `${(weapon.damage * (1 + ((spent.edge + 1) * EDGE_POWER) / 100)).toFixed(1)}`
    case 'swift':
      return `${(weapon.interval / (1 + ((spent.swift + 1) * SWIFT_SPEED) / 100)).toFixed(2)}s`
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
  /** Which card is open for reading. One at a time; a tap elsewhere closes it. */
  let openCard: string | null = null

  /**
   * The viewBox height, in figure units, for the swordsman on this tab.
   *
   * The same 84 the 剑 tab uses, so both tabs draw one geometry at one scale
   * and a robe cannot look different depending on which screen you are on. How
   * BIG it lands is CSS — `.doll-fig .portrait-svg` — which is where the growth
   * from a 120px thumbnail to a 168px figure actually happened.
   */
  const DOLL_BOX = 84

  /** Cells across the pack. Mirrors `grid-template-columns` on `.pack`. */
  const PACK_COLUMNS = 4

  /**
   * Which slot the pack is narrowed to, or null for everything.
   *
   * Lives beside `openCard` rather than inside the pane, because the pane is
   * rebuilt on every render and a filter that forgot itself on each tap would
   * be a filter you could never use.
   */
  let focus: Slot | null = null
  let character: Character | null = null
  let onSetOutHandler: ((depth: number) => void) | null = null
  let chosenDepth = 1
  // Kept across renders so spending a point does not throw the player back to
  // the first tab — a screen that loses your place on every tap feels broken
  // long before anyone works out why.
  let tab: TabId = 'self'

  /** The swordsman as they currently stand, gear and rank and all. */
  const portrait = (c: Character, box: number, region?: string): string => {
    const worn = equippedItems(c.inventory)
    const styleFor = (slot: Slot): string | undefined => {
      const entry = worn.find((e) => baseOf(e)?.slot === slot)
      return entry ? (baseOf(entry)?.styleId ?? undefined) : undefined
    }
    // Rarity is WORN, not merely listed. Without this the whole ladder lives in
    // a colour on a card, which is the one place a player is not looking while
    // deciding what to put on.
    const ranked = worn.flatMap((entry) => {
      const base = baseOf(entry)
      return base ? [{ slot: base.slot, rank: entry.rarity }] : []
    })
    return portraitSvg(
      gearFromIds({
        robe: styleFor('robe'),
        shoulders: styleFor('shoulders'),
        head: styleFor('head'),
        blade: styleFor('weapon') ?? schoolById(c.origin).weaponId,
      }),
      c.look,
      // Spread rather than `region: region`: `exactOptionalPropertyTypes` is on,
      // so an explicit `undefined` is not the same as an absent key — and the
      // absent key is what "no scene" means here.
      { box, ranked, ...(region !== undefined ? { region } : {}) },
    )
  }

  // --- the comparison sheet ----------------------------------------------
  /**
   * The kit a swordsman would have with `entry` in `slot` — or with the slot
   * empty when it is null.
   *
   * The same shape `main.ts` builds from the live character, so what the sheet
   * predicts and what the expedition runs on come from one function rather
   * than two that can drift.
   */
  const kitWith = (c: Character, slot: Slot, entry: OwnedItem | null): Kit =>
    kitOf(c, { slot, entry })

  /**
   * What a player is deciding between, in the numbers they actually feel.
   *
   * NOT the rolled lines. A card already says "+8 Spirit", and a card saying
   * "+8 Spirit" answers a question nobody asked: the question is whether to
   * put this on, and that is answered by what happens to the cut, the reach
   * and the health. Spirit reaching art power, Edge reaching reach, Swiftness
   * reaching movement — none of that is legible from an affix name, and all of
   * it is legible here.
   *
   * Sweeps per second rather than the interval, because "bigger is better" for
   * every row on the sheet is worth more than matching the field name.
   */
  const SHEET: ReadonlyArray<{ name: string; of: (s: Stats) => number; unit?: string }> = [
    { name: 'Sweep damage', of: (s) => s.slashDamage },
    { name: 'Sweeps per second', of: (s) => 1 / s.slashInterval },
    { name: 'Reach', of: (s) => s.slashRange },
    { name: 'Health', of: (s) => s.maxHp },
    { name: 'Armour', of: (s) => s.armour },
    { name: 'Movement', of: (s) => s.moveSpeed },
    { name: 'Art power', of: (s) => s.artScale * 100, unit: '%' },
  ]

  /** Rounds the way the row is drawn, so a change too small to SEE is not one. */
  const asDrawn = (n: number): number => Math.round(n * 10) / 10

  const compareRows = (before: Stats, after: Stats): HTMLElement | null => {
    const moved = SHEET.filter((r) => asDrawn(r.of(before)) !== asDrawn(r.of(after)))
    if (moved.length === 0) return null
    const box = document.createElement('div')
    box.className = 'cmp'
    box.innerHTML = moved
      .map((r) => {
        const a = asDrawn(r.of(before))
        const b = asDrawn(r.of(after))
        const up = b > a
        return (
          `<div class="cmp-row"><span>${r.name}</span>` +
          `<b class="${up ? 'up' : 'down'}">${a}${r.unit ?? ''} → ${b}${r.unit ?? ''}` +
          `<i>${up ? '+' : ''}${asDrawn(b - a)}${r.unit ?? ''}</i></b></div>`
        )
      })
      .join('')
    return box
  }

  /**
   * One piece as a tappable CELL: its shape, its rung, and nothing else.
   *
   * The card this replaces carried the name and the rolled lines, and a row of
   * six of them was a sideways scroll a player had to work through one at a
   * time. A cell is 74px, so twelve fit in a glance and the rung — border
   * thickness, wash, halo and seal, all four channels of it — is what the eye
   * sorts them by. Identity moves into the sheet, which is where the decision
   * is actually made.
   */
  const itemCell = (item: Item, entry: OwnedItem, worn: boolean, slot: Slot): HTMLButtonElement => {
    const tier = rarityOf(entry.rarity)
    const cell = document.createElement('button')
    cell.type = 'button'
    cell.className = 'cell' + (worn ? ' cell-worn' : '') + (openCard === entry.uid ? ' cell-on' : '')
    cell.setAttribute('style', rarityStyle(tier))
    cell.setAttribute('aria-label', `${item.name}, ${tier.name}`)
    // Which slot it belongs to, so the harness can prove a filtered pack really
    // holds one kind rather than merely holding fewer things.
    cell.dataset.slot = slot
    cell.innerHTML =
      itemIconSvg(slot, item.styleId, palette.ink, 0.82, 'cell-icon') +
      `<i class="cell-seal">${tier.seal}</i>` +
      (entry.power ? '<u class="cell-power"></u>' : '')
    cell.addEventListener('click', () => {
      openCard = openCard === entry.uid ? null : entry.uid
      render()
    })
    return cell
  }

  /**
   * A worn slot, beside the figure.
   *
   * Named, unlike a pack cell: these four are the answer to "what am I wearing"
   * and that question is not answered by four icons. An empty one is drawn
   * rather than skipped — "what am I missing" is the question that sends a
   * player back out, and it used to be unanswerable from this screen.
   */
  const dollSlot = (c: Character, slot: Slot): HTMLElement => {
    const entry = equippedIn(c.inventory, slot)
    const base = entry ? baseOf(entry) : null
    const spares = carriedInSlot(c.inventory, slot).length
    const box = document.createElement('button')
    box.type = 'button'
    const focused = focus === slot

    // ONE TAP DOES BOTH HALVES OF THE QUESTION.
    //
    // The pack holds twenty-four pieces for four slots, so "what else could go
    // on my head" was a question the screen could not answer — you scanned
    // icons. Tapping a slot now narrows the pack to it AND, when something is
    // worn there, opens that piece's sheet, because the two things a player
    // wants at that moment are "what are my options" and "what am I giving up".
    // Tapping it again clears both.
    const onTap = () => {
      if (focused) {
        focus = null
        openCard = null
      } else {
        focus = slot
        openCard = entry ? entry.uid : null
      }
      render()
    }

    if (!entry || !base) {
      // An empty slot was drawn but dead. It is the single most useful thing
      // this screen says — "you have nothing here" — and tapping it did
      // nothing, which is the worst possible answer to the question it raises.
      box.className = 'doll-slot doll-empty' + (focused ? ' doll-on' : '')
      box.innerHTML =
        packIconSvg(PACK_SLOT_ICON[slot] ?? '', palette.ink, 0.35, 'doll-icon') +
        `<b>${SLOT_NAMES[slot]}</b>` +
        `<span>${spares > 0 ? `${spares} ${strings.inPack}` : strings.slotEmpty}</span>`
      box.addEventListener('click', onTap)
      return box
    }
    const tier = rarityOf(entry.rarity)
    box.className = 'doll-slot' + (focused ? ' doll-on' : '')
    box.setAttribute('style', rarityStyle(tier))
    box.innerHTML =
      itemIconSvg(slot, base.styleId, palette.ink, 0.85, 'doll-icon') +
      `<b>${escapeHtml(base.name)}</b><span>${tier.seal} ${tier.name}</span>` +
      // How many others could go here. The number is the whole reason to tap.
      (spares > 0 ? `<u class="doll-spares">${spares}</u>` : '')
    box.addEventListener('click', onTap)
    return box
  }

  /**
   * Everything about one piece, and the button that acts on it.
   *
   * It carries the NAME now. It did not have to when a card sat above it
   * holding the name and the lines, but the pack is icons in a grid, so a
   * sheet without a header is a sheet about an unnamed shape. What it says, in
   * order: what this is, what it rolled, what it does that no line can express,
   * and — the part the rest of the screen cannot answer — what changes if you
   * put it on.
   */
  const sheetFor = (c: Character, slot: Slot, entry: OwnedItem, worn: boolean): HTMLElement => {
    const base = baseOf(entry)
    const tier = rarityOf(entry.rarity)
    const power = entry.power ? POWER_BY_ID.get(entry.power) : null
    const before = deriveStats(kitWith(c, slot, equippedIn(c.inventory, slot)))
    const after = deriveStats(kitWith(c, slot, worn ? null : entry))
    const rows = compareRows(before, after)

    const sheet = document.createElement('div')
    sheet.className = 'sheet'
    sheet.setAttribute('style', rarityStyle(tier))
    // A weapon says how it PLAYS rather than what it rolled: a number on a
    // spear describes the least interesting thing about picking up a spear.
    const lines =
      slot === 'weapon' && base
        ? [weaponById(base.styleId).blurb]
        : entry.affixes.map(affixLine)
    sheet.innerHTML =
      `<div class="sheet-hd"><b>${escapeHtml(base?.name ?? '')}</b>` +
      `<span>${tier.seal} ${tier.name} · ${SLOT_NAMES[slot]}</span></div>` +
      lines.map((l) => `<div class="sheet-line">${escapeHtml(l)}</div>`).join('') +
      (power
        ? `<div class="sheet-power"><b>${power.seal} ${escapeHtml(power.name)}</b>` +
          `<span>${escapeHtml(power.blurb)}</span></div>`
        : '')
    if (rows) sheet.appendChild(rows)

    const act = document.createElement('button')
    act.type = 'button'
    act.className = 'sheet-act' + (worn ? ' sheet-off' : '')
    // Says what the tap will DO, not what the thing is. A worn piece coming off
    // is a loss, and the copy should not pretend otherwise.
    act.textContent = worn ? strings.takeOff : rows ? strings.wearThis : strings.noChange
    act.addEventListener('click', () => {
      if (worn) unequip(c.inventory, slot)
      else if (!equip(c.inventory, entry.uid)) return
      openCard = null
      onSave()
      render()
    })
    sheet.appendChild(act)
    return sheet
  }

  // --- the panes ---------------------------------------------------------

  /** 剑 — who you are. Figure, what your numbers currently buy, and the points. */
  const paneSelf = (c: Character, total: Attributes, weapon: WeaponClass): HTMLElement => {
    const pane = document.createElement('div')
    pane.className = 'pane'

    const stage = document.createElement('div')
    stage.className = 'stage'
    // The place they are about to walk. It changes when the destination
    // changes, which turns the map choice into something the portrait answers.
    stage.innerHTML = portrait(c, 84, regionAt(chosenDepth).id)
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

  /**
   * 装 — what you carry, as a paperdoll.
   *
   * The version this replaces was four slot headings, each with a sideways row
   * of full-width cards under it. It worked and it read as a form: the rarity
   * ladder spoke through a left border 2–7px wide, the pack was never seen as a
   * whole, and the piece you were wearing sat in the same row as the pieces you
   * were not, distinguishable only by a darker fill.
   *
   * THE FIGURE IS THE SCREEN. What you wear is a picture, not a list. The four
   * worn pieces flank the swordsman and the rung is drawn ON them, so the
   * ladder finally lands where a player is looking while deciding — and the
   * figure itself is already wearing what the cards describe, because
   * portraitSvg reads the same equipment.
   *
   * THE PACK IS A FIXED GRID, NOT A LIST. Twenty-four cells, always all
   * twenty-four: an empty cell is as loud as a full one, which turns "how much
   * room do I have" and "what am I missing" into things the SHAPE of the screen
   * answers. Four channels of rung on a 74px cell — colour, border thickness,
   * background wash and halo — is enough to sort a full pack at a glance
   * without reading a word.
   *
   * The sheet opens in the row below the cell you tapped, spanning the grid. It
   * used to sit under the whole row of cards; in a grid that would put it below
   * six rows of icons, far from the one you touched.
   */
  const paneGear = (c: Character): HTMLElement => {
    const pane = document.createElement('div')
    pane.className = 'pane pane-gear'

    const doll = document.createElement('div')
    doll.className = 'doll'
    const left = document.createElement('div')
    left.className = 'doll-col'
    left.append(dollSlot(c, 'head'), dollSlot(c, 'shoulders'))
    const fig = document.createElement('div')
    fig.className = 'doll-fig'
    // Big. It was a 120px thumbnail on the one screen whose whole subject is
    // what the swordsman looks like, which meant a new robe changed a stamp.
    fig.innerHTML = portrait(c, DOLL_BOX)
    const right = document.createElement('div')
    right.className = 'doll-col'
    right.append(dollSlot(c, 'robe'), dollSlot(c, 'weapon'))
    doll.append(left, fig, right)
    pane.appendChild(doll)

    // A worn piece opens its sheet directly under the figure, because that is
    // where it sits: taking something off is a decision about the four above,
    // not about the pack.
    const openWorn = SLOTS.map((slot) => equippedIn(c.inventory, slot)).find(
      (e) => e !== null && e.uid === openCard,
    )
    if (openWorn) {
      const base = baseOf(openWorn)
      if (base) pane.appendChild(sheetFor(c, base.slot, openWorn, true))
    }

    // HOW FULL THE PACK IS, BEFORE THE GRID AND NOT AFTER IT.
    //
    // The pack has held 24 pieces since it existed and the number appeared
    // nowhere: a player only learned the limit by losing a find, in a line on
    // the reward screen after the expedition was over. That is the wrong
    // moment — the decision it should inform is made here, before setting out.
    const all = carried(c.inventory)
    const loose = focus === null ? all : all.filter((e) => baseOf(e)?.slot === focus)
    const bag = document.createElement('div')
    bag.className = 'bag' + (all.length >= BAG_CAPACITY ? ' bag-full' : '')
    // The heading says what you are looking at. Filtered, it says which slot
    // and offers the way back — a grid that silently shows a quarter of the
    // pack with no label is a grid a player thinks has lost their things.
    bag.innerHTML =
      `<span>${focus ? SLOT_NAMES[focus] : strings.pack}</span>` +
      `<b>${loose.length} / ${focus ? all.length : BAG_CAPACITY}</b>` +
      `<div class="bag-bar"><i style="width:${Math.round(
        (all.length / BAG_CAPACITY) * 100,
      )}%"></i></div>`
    if (focus) {
      const clear = document.createElement('button')
      clear.type = 'button'
      clear.className = 'bag-clear'
      clear.textContent = strings.showAll
      clear.addEventListener('click', () => {
        focus = null
        openCard = null
        render()
      })
      bag.appendChild(clear)
    }
    pane.appendChild(bag)

    const grid = document.createElement('div')
    grid.className = 'pack'
    // Best rung first. A pack sorted by when you found things is a pack you
    // have to read; sorted by rung, the top-left corner is always the answer.
    const sorted = [...loose].sort((a, b) => b.rarity - a.rarity)
    const cells: HTMLElement[] = []
    let sheet: HTMLElement | null = null
    let openAt = -1
    for (const entry of sorted) {
      const base = baseOf(entry)
      if (!base) continue
      if (entry.uid === openCard) {
        openAt = cells.length
        sheet = sheetFor(c, base.slot, entry, false)
      }
      cells.push(itemCell(base, entry, false, base.slot))
    }
    // After the whole ROW that holds the tapped cell, not immediately after the
    // cell — inserting mid-row leaves the piece stranded alone on a line with
    // three empty tracks beside it, which reads as a layout that broke.
    if (sheet && openAt >= 0) {
      cells.splice(Math.min(cells.length, (Math.floor(openAt / PACK_COLUMNS) + 1) * PACK_COLUMNS), 0, sheet)
    }
    for (const cell of cells) grid.appendChild(cell)
    // Twenty-four cells when you are looking at everything, because the empty
    // ones are the pack's remaining room and that is worth seeing. Narrowed to
    // one slot they would mean nothing — four spare hats is not "twenty spare
    // hat spaces" — so a filtered grid draws only what it holds.
    const floor = focus === null ? BAG_CAPACITY : Math.ceil(cells.length / PACK_COLUMNS) * PACK_COLUMNS
    for (let i = sorted.length; i < floor; i++) {
      const void_ = document.createElement('div')
      void_.className = 'cell cell-void'
      grid.appendChild(void_)
    }
    pane.appendChild(grid)
    return pane
  }

  /**
   * 法 — the three skills you take out, and everything else you could.
   *
   * WHAT THIS REPLACES. A scroll of five arts, ranked by tapping, of which the
   * blade's rung decided how many "woke". Nothing on it was a decision the
   * player made in a fight: an art fired when a posture happened to hold, for
   * as long as the accident lasted, and the screen's job was to explain a rule
   * that could not be felt. The verdict was "não se percebe nada".
   *
   * A skill is now something you FIRE. So this screen answers three questions
   * in the order a player asks them: what am I taking out, what does each one
   * cost, and what else exists. Every number on it is read from the same table
   * the simulation reads, through the same `skillPower`, so the tile in a fight
   * and the row in the hub can never quote different figures.
   *
   * THE SLOTS ARE NOT YET EDITABLE HERE, and the screen says so rather than
   * pretending. Choosing which three go out is the next slice; showing a
   * fictional choice would be worse than showing a real constraint.
   */
  const paneSkills = (weapon: WeaponClass): HTMLElement => {
    const pane = document.createElement('div')
    pane.className = 'pane'

    const roster = skillsFor(weapon.id)
    const slotted = defaultBar(weapon.id)

    const head = document.createElement('div')
    head.className = 'block-head arts-head'
    head.innerHTML =
      `<span>${weapon.seal} ${escapeHtml(weapon.name)}</span>` +
      `<b class="arts-count">${SLOTTED_SKILLS} ${escapeHtml(strings.skillSlots)}</b>`
    pane.appendChild(head)

    const note = document.createElement('div')
    note.className = 'arts-note'
    note.textContent = strings.skillsNote
    pane.appendChild(note)

    /**
     * One skill, as a row.
     *
     * `place` is 1-based; the last slotted one is the manual slot, and it is
     * labelled rather than left to be inferred. Which of the three a player
     * presses is the only in-fight decision the system has, so which one that
     * is has to be legible from the screen that lists them.
     */
    const skillRow = (skill: Skill, place: number | null): HTMLElement => {
      const on = place !== null
      const manual = place === SLOTTED_SKILLS
      const cond = CONDITION_BY_ID.get(skill.boost.when)!
      const row = document.createElement('div')
      row.className = 'sk-row' + (on ? ' sk-on' : ' sk-off')
      // FOUR LINES, IN THE ORDER THE QUESTIONS ARRIVE. What is it, what does it
      // do, what does it cost me, and when is it worth more. An earlier draft
      // put the posture in a narrow right-hand column and every reading wrapped
      // to three lines inside it — the screen said everything and read as
      // nothing, which is the failure this whole overhaul is answering.
      row.innerHTML = `
        <span class="sk-place">${on ? place : ''}</span>
        ${effectIconSvg(skill.effect, palette.ink, 1, 'sk-icon')}
        <span class="sk-body">
          <span class="sk-name">
            ${skill.seal} ${escapeHtml(skill.name)}
            ${manual ? `<em class="sk-manual">${escapeHtml(strings.skillManual)}</em>` : ''}
          </span>
          <span class="sk-blurb">${escapeHtml(skill.blurb)}</span>
          <span class="sk-line">
            <b class="sk-does">${escapeHtml(skillReading(skill))}</b>
            <span class="sk-cost">${'&#9679;'.repeat(skill.cost)} 势</span>
            <span class="sk-time">${
              skill.duration > 0 ? `${skill.duration}s` : strings.skillInstant
            } · rest ${skill.cooldown}s</span>
          </span>
          <span class="sk-boost">
            <span class="sk-seal">${cond.seal}</span>
            ${escapeHtml(cond.name)} →
            <b>${escapeHtml(skillReading(skill, true))}</b>
          </span>
        </span>
      `
      return row
    }

    const list = document.createElement('div')
    list.className = 'sk-list'
    slotted.forEach((id, i) => {
      const skill = SKILL_BY_ID.get(id)
      if (skill) list.appendChild(skillRow(skill, i + 1))
    })
    // WHERE THE BAR STOPS, drawn as a line rather than counted. Everything
    // above it goes out with you; everything below is known and not taken.
    const cut = document.createElement('div')
    cut.className = 'sk-cut'
    cut.innerHTML = `<span>${weapon.seal} ${escapeHtml(strings.skillsKnown)}</span>`
    list.appendChild(cut)
    for (const skill of roster) {
      if (slotted.includes(skill.id)) continue
      list.appendChild(skillRow(skill, null))
    }
    pane.appendChild(list)

    // 势. The one rule the whole bar rests on, and the one thing a player
    // cannot work out by looking at the tiles: where the points come from.
    const legend = document.createElement('div')
    legend.className = 'block'
    const legendHead = document.createElement('div')
    legendHead.className = 'block-head'
    legendHead.innerHTML = `<span>${strings.conditions}</span>`
    legend.appendChild(legendHead)
    const loop = document.createElement('div')
    loop.className = 'cond-loop'
    loop.textContent = strings.shiLoop
    legend.appendChild(loop)
    for (const cond of CONDITIONS) {
      const row = document.createElement('div')
      row.className = 'cond-row cond-charge'
      row.innerHTML =
        `<span class="cond-seal">${cond.seal}</span>` +
        `<span class="cond-name">${escapeHtml(cond.name)}</span>` +
        `<span class="cond-how">${escapeHtml(cond.how)}</span>`
      legend.appendChild(row)
    }
    pane.appendChild(legend)

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
    const weapon = weaponById((weaponItem ? baseOf(weaponItem) : null)?.styleId ?? school.weaponId)

    // Attributes granted by worn equipment count exactly like bought ones in
    // combat, so the hub must quote the combined figure. Quoting only the
    // bought half was a straightforward lie: it read "0.26s per sweep" while
    // the game ran at 0.24s, and this screen exists to be believed.
    // One call rather than a second copy of the summing rule: the hub and the
    // simulation must never disagree about what the gear grants, and they did
    // once — the screen read "0.26s per sweep" while the game ran at 0.24s.
    const fromGear = wornAttributes(equippedItems(c.inventory))
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
      tab === 'self'
        ? paneSelf(c, total, weapon)
        : tab === 'gear'
          ? paneGear(c)
          : tab === 'arts'
            ? paneSkills(weapon)
            : paneWorld(c),
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
      // Unspent points ride on the tab itself, not just inside it.
      //
      // Measured on a real device: a player reached level six carrying SEVEN
      // unspent points, with Body and Spirit still at zero. Every level they
      // had earned was sitting in a drawer, which is most of why the game read
      // as "levels go up and nothing improves". The count was already on the
      // Swordsman tab — but only once you were already looking at it, and
      // nothing anywhere else on the screen said to look.
      const owed = item.id === 'self' && character ? character.points : 0
      const badge = owed > 0 ? `<span class="tab-owed">${owed}</span>` : ''
      button.innerHTML =
        `<span class="tab-seal">${item.seal}${badge}</span>` +
        `<span class="tab-name">${item.name}</span>`
      button.addEventListener('click', () => {
        if (tab === item.id) return
        tab = item.id
        // Leaving the tab closes whatever was open on it. Coming back to a
        // sheet you opened three screens ago is a sheet answering a question
        // you have stopped asking.
        openCard = null
        focus = null
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
      openCard = null
      focus = null
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
