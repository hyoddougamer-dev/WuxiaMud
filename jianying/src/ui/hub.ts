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
import { barFor, kitOf } from '../meta/kit'
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
import { CONDITIONS, CONDITION_BY_ID, type Condition } from '../data/arts'
import { RING_GATE, armTalents, isKeystone, type Arm } from '../data/talents'
import {
  openRing,
  pointsInArm,
  pointsLeft,
  pointsSpent,
  ranksIn,
  refusalFor,
  respec,
  takeTalent,
} from '../meta/wheel'
import {
  SKILL_BY_ID,
  SLOTTED_SKILLS,
  skillsFor,
  type Skill,
} from '../data/skills'
import { skillReading } from '../sim/skills'
import { foldGearSkills } from '../sim/loadout'
import { noTalents } from '../sim/talents'
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

type TabId = 'self' | 'gear' | 'arts' | 'wheel' | 'world'

interface Tab {
  readonly id: TabId
  readonly seal: string
  readonly name: string
}

/**
 * FIVE TABS, and the labels shrank to let the fifth in.
 *
 * The comment at the top of this file said four was the ceiling before a tab
 * bar cost more than it saved, and that was true of "SWORDSMAN EQUIPMENT SKILLS
 * WORLD" — four words that already used the whole width. The Wheel is a
 * genuinely separate place to spend a genuinely separate currency, so it earns
 * a tab; what it cost is the long labels, and 78px per tab fits SELF, GEAR,
 * SKILLS, WHEEL, WORLD with room to spare. The seals were always the primary
 * mark anyway.
 */
const TABS: readonly Tab[] = [
  { id: 'self', seal: '剑', name: 'Self' },
  { id: 'gear', seal: '装', name: 'Gear' },
  { id: 'arts', seal: '法', name: 'Skills' },
  { id: 'wheel', seal: '轮', name: 'Wheel' },
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
  /** Which arm of the Wheel is being spent in. The compass switches it. */
  let wheelArm: Arm = 'core'

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
   * A TAP IS THE WHOLE INTERACTION. Tapping a slotted skill takes it off the
   * bar; tapping a known one puts it on, at the end. That single rule gives the
   * player both controls they need — WHICH three, and WHICH of the three is the
   * one they fire by hand, since the last slot is the manual one and a skill
   * appended lands there. Nothing to drag, nothing to long-press, and no
   * reordering gesture to learn on a phone.
   */
  const paneSkills = (c: Character, weapon: WeaponClass): HTMLElement => {
    const pane = document.createElement('div')
    pane.className = 'pane'

    const roster = skillsFor(weapon.id)
    const slotted = barFor(c, weapon.id)
    // What the WORN gear says about each skill by name. Folded from the same
    // function the expedition uses, so this screen cannot promise a discount
    // the run does not apply.
    const gear = foldGearSkills(kitOf(c).worn, noTalents())

    const head = document.createElement('div')
    head.className = 'block-head arts-head'
    head.innerHTML =
      `<span>${weapon.seal} ${escapeHtml(weapon.name)}</span>` +
      `<b class="arts-count">${slotted.length} / ${SLOTTED_SKILLS} ${escapeHtml(
        strings.skillSlots,
      )}</b>`
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
      const full = slotted.length >= SLOTTED_SKILLS
      const cond = CONDITION_BY_ID.get(skill.boost.when)!
      // WHAT YOUR GEAR ADDS, BY NAME. The whole point of a line that says
      // "+18% Mountain" is that it points at a row on this screen; if the row
      // does not answer back, the piece is a number again.
      const lines = gear.perSkill.get(skill.id)
      const gearLine = !lines
        ? ''
        : [
            lines.power > 0 ? `+${Math.round(lines.power * 100)}% power` : '',
            lines.cost < 0 ? `−${-lines.cost} 势` : '',
            lines.rest < 1 ? `−${Math.round((1 - lines.rest) * 100)}% rest` : '',
          ]
            .filter(Boolean)
            .join(' · ')
      // A BUTTON, because it does something. It was a div for exactly as long
      // as the slots were not editable.
      const row = document.createElement('button')
      row.type = 'button'
      row.className = 'sk-row' + (on ? ' sk-on' : ' sk-off') + (!on && full ? ' sk-blocked' : '')
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
          ${gearLine ? `<span class="sk-gear">装 ${escapeHtml(gearLine)}</span>` : ''}
        </span>
        <span class="sk-take">${escapeHtml(
          on ? strings.skillDrop : full ? strings.skillFull : strings.skillTake,
        )}</span>
      `
      row.addEventListener('click', () => {
        if (!character) return
        const next = slotted.filter((id) => id !== skill.id)
        // APPENDED, not inserted, and that IS the reordering control: the last
        // slot is the one you fire by hand, so taking a skill off and putting
        // it back is how you move it there. Two taps, and no gesture to learn
        // on a phone.
        if (!on) {
          if (full) return
          next.push(skill.id)
        }
        character.skills = { ...character.skills, [weapon.id]: next }
        onSave()
        render()
      })
      return row
    }

    const list = document.createElement('div')
    list.className = 'sk-list'
    slotted.forEach((id: string, i: number) => {
      const skill = SKILL_BY_ID.get(id)
      if (skill) list.appendChild(skillRow(skill, i + 1))
    })
    // EMPTY SLOTS ARE DRAWN, not left out. A player who has taken two skills
    // off has to be able to see that a third place exists and is theirs to
    // fill — a list that simply gets shorter reads as "this is all there is",
    // which is the same failure the arts strip had.
    for (let i = slotted.length; i < SLOTTED_SKILLS; i++) {
      const empty = document.createElement('div')
      empty.className = 'sk-row sk-empty'
      empty.innerHTML =
        `<span class="sk-place">${i + 1}</span>` +
        `<span class="sk-body"><span class="sk-name">${escapeHtml(
          i + 1 === SLOTTED_SKILLS ? strings.skillEmptyManual : strings.skillEmpty,
        )}</span></span>`
      list.appendChild(empty)
    }
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

  /**
   * 轮 — the Wheel: a compass to choose an arm, and a real list to spend in.
   *
   * THE FIRST VERSION WAS THE WHOLE BOARD AT ONCE, and it was reported as
   * "todos sem espaço, a UI feia para escolher, tudo demasiado compacto". That
   * is exactly right, and the arithmetic says so: nineteen nodes inside a
   * 340px square leaves each one about 34 pixels with a rank line inside it,
   * neighbours a few pixels away, and — because a 34px target is not something
   * to spend an irreversible point on by accident — a second tap on a separate
   * sheet before anything happens. Dense, ugly, and two steps.
   *
   * So the wheel splits in two, along the line the player's attention already
   * takes:
   *
   *   THE COMPASS says where you are. Small, five wedges, each filled by what
   *   you have spent in it — the at-a-glance overview a radial shape is
   *   genuinely good at, and the only job it keeps. Tapping a wedge picks an
   *   arm.
   *
   *   THE LIST is where you spend. One arm at a time, its nodes as cards with
   *   the room to say what they do, in ring order, with the Take button ON the
   *   card. Same shape as the 法 rows next door, which is the point: a player
   *   who has learned one screen has learned this one.
   *
   * Nothing about the model changed — same nineteen nodes, same gates, same one
   * keystone. This is the same board with the crowding taken out.
   */
  const paneWheel = (c: Character): HTMLElement => {
    const pane = document.createElement('div')
    pane.className = 'pane'
    const left = pointsLeft(c)

    const head = document.createElement('div')
    head.className = 'block-head arts-head'
    head.innerHTML =
      `<span>轮 ${escapeHtml(strings.wheelTitle)}</span>` +
      `<b class="arts-count${left > 0 ? ' wh-owed' : ''}">${left} ${escapeHtml(
        left === 1 ? strings.onePointToSpend : strings.pointsToSpend,
      )}</b>`
    pane.appendChild(head)

    const note = document.createElement('div')
    note.className = 'arts-note'
    note.textContent = strings.wheelNote
    pane.appendChild(note)

    // --- the compass -------------------------------------------------------
    const ARMS: Arm[] = ['core', 'still', 'running', 'turn', 'surrounded']
    const ANGLE: Record<string, number> = {
      still: -135,
      running: -45,
      surrounded: 45,
      turn: 135,
    }
    const armSeal: Record<string, string> = {
      core: '势',
      still: '静',
      running: '疾',
      turn: '转',
      surrounded: '围',
    }
    /** Points an arm can hold, for the fill on its wedge. */
    const armCap = (arm: Arm): number =>
      armTalents(arm).reduce((n, t) => n + t.ranks, 0)

    const compass = document.createElement('div')
    compass.className = 'wc'
    const parts: string[] = []
    for (const arm of ARMS) {
      if (arm === 'core') continue
      const a = ANGLE[arm]! * (Math.PI / 180)
      const spent = pointsInArm(c.wheel, arm)
      const full = spent / armCap(arm)
      const open = openRing(c.wheel, arm)
      // 56, not 46: at the shorter radius a wedge's fill ring and the hub's
      // own overlapped, and the overlap read as a stray gold mark between two
      // wedges rather than as either of the two rings it actually was.
      const x = 70 + Math.cos(a) * 56
      const y = 70 + Math.sin(a) * 56
      const on = arm === wheelArm
      parts.push(
        `<g class="wc-arm${on ? ' is-on' : ''} wc-open-${open}" data-arm="${arm}" ` +
          `tabindex="0" role="button" aria-label="${escapeHtml(
            CONDITION_BY_ID.get(arm as Condition)?.name ?? arm,
          )}">` +
          `<line x1="70" y1="70" x2="${x}" y2="${y}" class="wc-spoke" />` +
          `<circle cx="${x}" cy="${y}" r="17" class="wc-dot" />` +
          // The ring around a wedge fills as the arm does. One number, drawn
          // as an amount rather than written as a fraction.
          (spent > 0
          ? `<circle cx="${x}" cy="${y}" r="21" class="wc-fill" ` +
            `stroke-dasharray="${(full * 132).toFixed(1)} 132" ` +
            `transform="rotate(-90 ${x} ${y})" />`
          : '') +
          `<text x="${x}" y="${y}" class="wc-seal">${armSeal[arm]}</text>` +
          // Only once there IS something to count. Five zeroes under five
          // wedges is five pieces of noise saying the same nothing.
          (spent > 0 ? `<text x="${x}" y="${y + 30}" class="wc-count">${spent}</text>` : '') +
          `</g>`,
      )
    }
    const coreSpent = pointsInArm(c.wheel, 'core')
    parts.push(
      `<g class="wc-arm wc-core${wheelArm === 'core' ? ' is-on' : ''}" data-arm="core" ` +
        `tabindex="0" role="button" aria-label="${escapeHtml(strings.wheelCore)}">` +
        `<circle cx="70" cy="70" r="19" class="wc-dot" />` +
        (coreSpent > 0
          ? `<circle cx="70" cy="70" r="23" class="wc-fill" ` +
            `stroke-dasharray="${((coreSpent / armCap('core')) * 144.5).toFixed(1)} 144.5" ` +
            `transform="rotate(-90 70 70)" />`
          : '') +
        `<text x="70" y="70" class="wc-seal">${armSeal.core}</text>` +
        (coreSpent > 0 ? `<text x="70" y="102" class="wc-count">${coreSpent}</text>` : '') +
        `</g>`,
    )
    compass.innerHTML =
      `<svg viewBox="0 0 140 140" class="wc-svg" xmlns="http://www.w3.org/2000/svg">` +
      parts.join('') +
      `</svg>`
    pane.appendChild(compass)
    compass.querySelectorAll<SVGGElement>('[data-arm]').forEach((g) => {
      const pick = (): void => {
        wheelArm = (g.dataset.arm as Arm) ?? 'core'
        render()
      }
      g.addEventListener('click', pick)
      g.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          pick()
        }
      })
    })

    // --- the arm's own heading ---------------------------------------------
    const cond = wheelArm === 'core' ? null : CONDITION_BY_ID.get(wheelArm as Condition)
    const inArm = pointsInArm(c.wheel, wheelArm)
    const armHead = document.createElement('div')
    armHead.className = 'wh-arm-head'
    armHead.innerHTML =
      `<b>${armSeal[wheelArm]} ${escapeHtml(cond?.name ?? strings.wheelCore)}</b>` +
      `<span>${escapeHtml(cond?.how ?? strings.wheelCoreHow)}</span>`
    pane.appendChild(armHead)

    // --- the nodes, as cards with room ------------------------------------
    const list = document.createElement('div')
    list.className = 'wh-list'
    let lastRing = -1
    for (const talent of armTalents(wheelArm)) {
      const ranks = ranksIn(c.wheel, talent.id)
      const refusal = refusalFor(c, talent.id)
      const locked = talent.ring > openRing(c.wheel, talent.arm)
      const key = isKeystone(talent)

      // A LINE WHERE THE ARM STOPS REACHING, named with what it costs to pass.
      // It was a dashed outline on each node and a player had to work out for
      // themselves which gate they were short of.
      if (talent.ring !== lastRing && talent.ring > 1 && wheelArm !== 'core') {
        const need = RING_GATE * (talent.ring - 1)
        const cut = document.createElement('div')
        cut.className = 'wh-gate' + (inArm >= need ? ' is-open' : '')
        cut.innerHTML =
          `<span>${escapeHtml(
            inArm >= need ? strings.wheelGateOpen : strings.wheelGateShut,
          )} ${inArm}/${need}</span>`
        list.appendChild(cut)
      }
      lastRing = talent.ring

      const card = document.createElement('div')
      card.className =
        'wh-card' +
        (key ? ' wh-card-key' : '') +
        (ranks > 0 ? ' is-taken' : '') +
        (locked ? ' is-locked' : '')
      const pips = Array.from({ length: talent.ranks }, (_, i) =>
        `<i class="${i < ranks ? 'on' : ''}"></i>`,
      ).join('')
      card.innerHTML = `
        <div class="wh-card-head">
          <span class="wh-card-seal">${talent.seal}</span>
          <span class="wh-card-name">
            <b>${escapeHtml(talent.name)}</b>
            ${key ? `<em>${escapeHtml(strings.wheelKeystone)}</em>` : ''}
          </span>
          <span class="wh-pips">${pips}</span>
        </div>
        <p class="wh-does">${escapeHtml(talent.blurb)}</p>
        ${talent.cost ? `<p class="wh-cost">${escapeHtml(talent.cost)}</p>` : ''}
      `
      const take = document.createElement('button')
      take.type = 'button'
      take.className = 'wh-take'
      take.disabled = refusal !== null
      take.textContent =
        refusal === null
          ? ranks > 0
            ? strings.wheelTakeMore
            : strings.wheelTake
          : refusal === 'maxed'
            ? strings.wheelMaxed
            : refusal === 'no-points'
              ? strings.wheelNoPoints
              : refusal === 'ring-locked'
                ? `${strings.wheelLocked} ${RING_GATE * (talent.ring - 1)}`
                : strings.wheelOneKeystone
      take.addEventListener('click', () => {
        if (!character) return
        if (!takeTalent(character, talent.id)) return
        onSave()
        render()
      })
      card.appendChild(take)
      list.appendChild(card)
    }
    pane.appendChild(list)

    // The one rule that shapes a build, said where a player is standing when
    // they are about to reach the rim.
    const rule = document.createElement('div')
    rule.className = 'wh-rule'
    rule.textContent = strings.wheelKeystoneRule
    pane.appendChild(rule)

    // --- respec ------------------------------------------------------------
    // FREE AND ALWAYS, and said plainly on the button. There is no wiki for
    // this game: the only way to find out what a keystone does is to take it
    // and walk out, and a respec cost would make the interesting node the one
    // nobody dares press.
    if (pointsSpent(c.wheel) > 0) {
      const reset = document.createElement('button')
      reset.type = 'button'
      reset.className = 'wh-respec'
      reset.textContent = strings.wheelRespec
      reset.addEventListener('click', () => {
        if (!character) return
        respec(character)
        onSave()
        render()
      })
      pane.appendChild(reset)
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
            ? paneSkills(c, weapon)
            : tab === 'wheel'
              ? paneWheel(c)
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
      // Both currencies wear a badge on the tab that spends them, for the same
      // measured reason: a player reached level six holding seven unspent
      // points with two attributes at zero, because nothing outside that one
      // screen said to look. A wheel point is exactly as easy to forget.
      const owed = !character
        ? 0
        : item.id === 'self'
          ? character.points
          : item.id === 'wheel'
            ? pointsLeft(character)
            : 0
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
