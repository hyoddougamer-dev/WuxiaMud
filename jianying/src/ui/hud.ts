/**
 * Run HUD and the end-of-expedition screen, in DOM rather than on the canvas.
 *
 * Text is the one thing a canvas is bad at: Pixi would need a font atlas, and
 * numbers that change every frame would either re-rasterise constantly or look
 * soft. The DOM renders crisp text at any device pixel ratio for free, and it
 * sits above the game without ever touching the render loop's budget.
 *
 * The end screen carries more weight than it used to. It is no longer a
 * scoreboard for something that has been thrown away — it is where an
 * expedition is converted into permanent progress, and every term of that
 * conversion is itemised. A player who dies at four minutes should be able to
 * read, without asking anyone, exactly what those four minutes bought.
 */
import { ART_BY_ID, MAX_ART_LEVEL, conditionKind, type Art } from '../data/arts'
import type { CarriedArt } from '../sim/arts'
import { activeSeals, type ConditionSense } from '../sim/conditions'
import { conditionIconSvg, effectIconSvg, itemIconSvg } from '../render/packIcons'
import { palette } from '../render/palette'
import { ITEM_BY_ID } from '../data/items'
import type { OwnedItem } from '../meta/inventory'
import { affixLine } from '../data/affixes'
import { rarityOf, rarityStyle } from '../data/rarity'
import { weaponById } from '../data/weapons'
import type { LevelGain, Reward } from '../meta/character'
import { regionAt } from '../data/regions'
import { realmOf } from '../meta/realms'
import { strings } from './strings'

/** Everything the end screen needs, assembled by main once the run is over. */
export interface RunSummary {
  seconds: number
  kills: number
  depth: number
  killedBy: string | null
  reward: Reward
  gain: LevelGain
  /** Level after the reward was applied. */
  level: number
  /**
   * Everything found this expedition and kept, best rung first.
   *
   * One list where there were three. "Raised" and "duplicate" were states only
   * the old one-row-per-piece bag could produce: a second copy either
   * overwrote the first or was worth nothing. Every find is now its own rolled
   * instance, so every find is simply a find.
   */
  kept: readonly Found[]
  /** Finds that would not fit in the pack. Counted, so the loss is visible. */
  noRoom: number
  /**
   * Found this expedition, but lost — a death forfeits anything found after
   * the last gate cleared, except a first piece for a slot that was empty
   * when the expedition began. See settleFound in meta/character.ts for the
   * whole rule. Always empty when the run ended by banking.
   */
  forfeited: readonly Found[]
}

/**
 * A piece as it came off the ground.
 *
 * The rolled instance itself, not a table row plus a number: what makes a find
 * a find now is the lines it rolled, and those live on the instance.
 */
export type Found = OwnedItem

export interface Hud {
  /** Called every frame with the current run state. */
  update(
    hp: number,
    maxHp: number,
    elapsed: number,
    kills: number,
    xp: number,
    xpNeeded: number,
    insight: number,
  ): void
  /**
   * Fills the rift's bar — the hairline across the very top edge of the
   * screen, the one thing that survives everything else this layout deletes.
   * `target` of `Infinity` (a run outside any rift) hides it rather than
   * drawing a bar that can never fill.
   */
  setRift(value: number, target: number): void
  /**
   * The arts in hand, and the ones the gear has not woken yet.
   *
   * `asleep` is drawn as empty slots rather than left out, and that is the
   * point of passing it at all. A player carrying a common blade sees ONE tile
   * and has no way to know that four more exist — so the strip reads as "this
   * is all there is" instead of as "this is what you have so far". Empty slots
   * turn the same strip into a promise, and when a better blade fills one
   * mid-fight the change happens in a place the player was already watching.
   */
  setScroll(carried: readonly CarriedArt[], asleep: readonly Art[]): void
  /**
   * Lights the tiles whose condition holds, and shows the 势 behind them.
   * Called every frame.
   */
  setConditions(sense: ConditionSense): void
  /**
   * The dodge's readiness, 0..1, and whether it can fire this instant.
   *
   * Drawn as a dial that fills rather than a number that counts down: the
   * question a thumb asks mid-fight is "now?", not "in how long?".
   */
  setDodge(charge: number): void
  /** Called when the dodge button is pressed. */
  onDodge(handler: () => void): void
  /** Shows the end screen. `onReturn` takes the player back to the hub. */
  showGameOver(summary: RunSummary, onReturn: () => void): void
  hideGameOver(): void
  /**
   * Shows the choice a cleared gate offers: bank what was earned, or push to
   * a harder floor carrying the same build. `onBank` and `onPush` each fire
   * at most once per `showGate` call.
   */
  showGate(tier: number, onBank: () => void, onPush: () => void): void
  hideGate(): void
  /** Hides or reveals the whole in-run HUD, for the hub. */
  setPlaying(playing: boolean): void
}

/** mm:ss */
function formatTime(seconds: number): string {
  const total = Math.floor(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function createHud(root: HTMLElement): Hud {
  root.innerHTML = `
    <div class="hud-rift" hidden><div class="hud-rift-fill"></div></div>
    <div class="hud-bar">
      <div class="hud-console">
        <span class="hud-hp">0</span>
        <span class="hud-time">0:00</span>
      </div>
      <div class="hud-health"><div class="hud-health-fill"></div></div>
      <!-- 势. Three pips, because the whole point of momentum is that you
           can see how much you have before deciding to spend it. Without this
           the charge-and-spend loop is a rule nobody can play to. -->
      <div class="hud-shi" aria-hidden="true">
        <i></i><i></i><i></i>
      </div>
      <div class="hud-arts"></div>
      <div class="hud-xp"><div class="hud-xp-fill"></div></div>
    </div>
    <!-- The dodge. On the RIGHT, level with where the joystick thumb sits
         on the left, because that is the only place a second thumb can reach
         without letting go of movement. Big: 76px, well over the 44px floor,
         because this is pressed in a panic and a missed press is a death.
         The face reads DODGE, not 闪: everywhere else in this game a seal sits
         BESIDE an English name, and a player who cannot read the seal loses
         nothing. Here it was the whole label, on the one control that has to
         be understood before it is first needed. -->
    <button class="hud-dodge" type="button" aria-label="${strings.dodgeLabel}">
      <svg viewBox="0 0 44 44" class="hud-dodge-dial" aria-hidden="true">
        <circle class="hud-dodge-track" cx="22" cy="22" r="19"></circle>
        <circle class="hud-dodge-fill" cx="22" cy="22" r="19"></circle>
      </svg>
      <span class="hud-dodge-seal">Dodge</span>
    </button>
    <div class="over" hidden>
      <div class="over-inner">
        <div class="over-seal">终</div>
        <div class="over-title">${strings.runOver}</div>
        <div class="over-cause"></div>
        <!-- The run in two numbers, large. These are what the player actually
             did; everything below is what it converted into. -->
        <div class="over-rows">
          <div class="over-stat">
            <b class="over-time">0:00</b><span>${strings.survived}</span>
          </div>
          <div class="over-stat">
            <b class="over-kills">0</b><span>${strings.felled}</span>
          </div>
        </div>
        <div class="over-reward"></div>
        <button class="over-again" type="button">${strings.toHub}</button>
      </div>
    </div>
    <div class="gate" hidden>
      <div class="gate-title">${strings.gateClearedTitle}</div>
      <div class="gate-sub">${strings.gateClearedBody}</div>
      <div class="gate-choices">
        <button type="button" class="gate-choice gate-bank">
          <div class="gate-choice-name">${strings.bankChoice}</div>
          <div class="gate-choice-note">${strings.bankNote}</div>
        </button>
        <button type="button" class="gate-choice gate-push">
          <div class="gate-choice-name gate-push-name">${strings.pushChoice}</div>
          <div class="gate-choice-note">${strings.pushNote}</div>
        </button>
      </div>
    </div>
  `

  const bar = root.querySelector<HTMLElement>('.hud-bar')!
  const dodgeEl = root.querySelector<HTMLButtonElement>('.hud-dodge')!
  const dodgeFill = root.querySelector<SVGCircleElement>('.hud-dodge-fill')!
  // The dial is drawn as a stroked circle whose dash offset is the charge, so
  // filling it costs one attribute write per frame rather than a redraw.
  const DIAL = 2 * Math.PI * 19
  dodgeFill.setAttribute('stroke-dasharray', `${DIAL}`)
  let dodgeHandler: (() => void) | null = null
  // pointerdown, not click: a click waits for the release, and a dodge that
  // fires when the thumb comes UP is a dodge that arrives after the hit.
  dodgeEl.addEventListener('pointerdown', (event) => {
    event.preventDefault()
    dodgeHandler?.()
  })
  // Keyboard, for playing at a desk. Space is the key everyone tries first and
  // Shift is the second guess; both sit under the hand that is not on the
  // mouse, which is the desk equivalent of "the thumb that is not on the
  // joystick". `repeat` is ignored, or holding the key down would become a
  // continuous dodge.
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return
    if (event.code !== 'Space' && event.code !== 'ShiftLeft' && event.code !== 'ShiftRight') return
    // Never steal the key from a text field — a swordsman's name has spaces
    // in it.
    const focused = document.activeElement
    if (focused instanceof HTMLInputElement || focused instanceof HTMLTextAreaElement) return
    event.preventDefault()
    dodgeHandler?.()
  })
  const rift = root.querySelector<HTMLElement>('.hud-rift')!
  const riftFill = root.querySelector<HTMLElement>('.hud-rift-fill')!
  const fill = root.querySelector<HTMLElement>('.hud-health-fill')!
  const xpFill = root.querySelector<HTMLElement>('.hud-xp-fill')!
  const hpEl = root.querySelector<HTMLElement>('.hud-hp')!
  const timeEl = root.querySelector<HTMLElement>('.hud-time')!
  const over = root.querySelector<HTMLElement>('.over')!
  const overTime = root.querySelector<HTMLElement>('.over-time')!
  const overKills = root.querySelector<HTMLElement>('.over-kills')!
  const overCause = root.querySelector<HTMLElement>('.over-cause')!
  const overReward = root.querySelector<HTMLElement>('.over-reward')!
  const again = root.querySelector<HTMLButtonElement>('.over-again')!
  const artsEl = root.querySelector<HTMLElement>('.hud-arts')!
  const shiEl = root.querySelector<HTMLElement>('.hud-shi')!
  const shiPips = Array.from(shiEl.querySelectorAll<HTMLElement>('i'))
  const gate = root.querySelector<HTMLElement>('.gate')!
  const gateBank = root.querySelector<HTMLButtonElement>('.gate-bank')!
  const gatePush = root.querySelector<HTMLButtonElement>('.gate-push')!
  const gatePushName = root.querySelector<HTMLElement>('.gate-push-name')!

  // Only touch the DOM when a displayed value actually changes. Writing the
  // same string 60 times a second is layout work for nothing.
  let lastTime = ''
  let lastHp = -1
  let lastPct = -1
  let lastXpPct = -1
  let lastRiftPct = -1

  /** The art tiles, in scroll order, so lighting one is a class toggle. */
  let artTiles: HTMLElement[] = []
  let lastScroll = ''
  let lastLit = ''
  let lastShi = -1
  let lastBurst = false

  let returnHandler: (() => void) | null = null
  again.addEventListener('click', () => {
    const handler = returnHandler
    returnHandler = null
    handler?.()
  })

  let bankHandler: (() => void) | null = null
  let pushHandler: (() => void) | null = null
  gateBank.addEventListener('click', () => {
    const handler = bankHandler
    bankHandler = null
    pushHandler = null
    handler?.()
  })
  gatePush.addEventListener('click', () => {
    const handler = pushHandler
    bankHandler = null
    pushHandler = null
    handler?.()
  })

  return {
    update(hp, maxHp, elapsed, kills, xp, xpNeeded, insight) {
      void kills
      void insight
      const pct = Math.max(0, Math.min(1, hp / maxHp))
      if (pct !== lastPct) {
        fill.style.transform = `scaleX(${pct})`
        // Cinnabar only when it matters. A bar that is always red stops being a
        // warning and becomes decoration.
        fill.style.background = pct < 0.3 ? 'var(--cinnabar)' : 'var(--ink)'
        lastPct = pct
      }
      const roundedHp = Math.ceil(hp)
      if (roundedHp !== lastHp) {
        hpEl.textContent = String(roundedHp)
        lastHp = roundedHp
      }
      const t = formatTime(elapsed)
      if (t !== lastTime) {
        timeEl.textContent = t
        lastTime = t
      }
      const xpPct = xpNeeded > 0 ? Math.max(0, Math.min(1, xp / xpNeeded)) : 0
      if (xpPct !== lastXpPct) {
        xpFill.style.transform = `scaleX(${xpPct})`
        lastXpPct = xpPct
      }
    },

    setRift(value, target) {
      if (!Number.isFinite(target)) {
        rift.hidden = true
        return
      }
      rift.hidden = false
      const pct = Math.max(0, Math.min(1, value / target))
      if (pct === lastRiftPct) return
      lastRiftPct = pct
      riftFill.style.transform = `scaleX(${pct})`
    },

    setPlaying(playing) {
      bar.style.display = playing ? '' : 'none'
      dodgeEl.style.display = playing ? '' : 'none'
      if (!playing) rift.hidden = true
    },

    setDodge(charge) {
      const ready = charge >= 1
      dodgeFill.setAttribute('stroke-dashoffset', `${DIAL * (1 - charge)}`)
      dodgeEl.classList.toggle('is-ready', ready)
    },
    onDodge(handler) {
      dodgeHandler = handler
    },
    setScroll(carried, asleep) {
      // The whole scroll used to show here regardless of grade; now each tile
      // is one AWAKE art with the grade the gear has set it to, followed by an
      // empty slot for each one still asleep.
      const key =
        carried.map((c) => `${c.art.id}:${c.level}`).join(',') +
        '|' +
        asleep.map((a) => a.id).join(',')
      if (key === lastScroll) return
      lastScroll = key
      lastLit = ''

      artsEl.innerHTML = ''
      artTiles = carried.map(({ art, level }) => {
        const tile = document.createElement('div')
        tile.className = 'art'
        tile.dataset.art = art.id
        // The EFFECT's icon above, a PICTOGRAM of the condition below — not the
        // condition's seal. A seal alone asked a player who reads no Chinese to
        // learn that 静 means "stop moving" by dying a few times; see
        // render/packIcons.ts PACK_CONDITION_ICON for the rule this follows.
        // The seals keep their place in the hub, where there is time to read a
        // name — see ui/hub.ts and the long-press panel there.
        let html =
          effectIconSvg(art.effect, palette.ink, 1, 'art-icon') +
          conditionIconSvg(art.condition, palette.ink, 1, 'art-cond-icon')
        html += '<div class="art-pips">'
        for (let p = 0; p < MAX_ART_LEVEL; p++) {
          html += `<span class="art-pip${p < level ? ' art-pip-on' : ''}"></span>`
        }
        html += '</div>'
        tile.innerHTML = html
        artsEl.appendChild(tile)
        return tile
      })

      // The empty slots. No effect icon and no pips — an icon here would say
      // "you have this, dimly", which is the opposite of true. What they carry
      // is the CONDITION's pictogram, faint: the shape of the thing this slot
      // will one day respond to, so the promise is specific rather than blank.
      for (const art of asleep) {
        const slot = document.createElement('div')
        slot.className = 'art art-asleep'
        slot.innerHTML = conditionIconSvg(art.condition, palette.ink, 1, 'art-cond-icon')
        artsEl.appendChild(slot)
      }
    },

    setConditions(sense) {
      const { active } = sense
      // 势 first: a pip that fills is the thing the player reads BEFORE
      // deciding to plant their feet, so it cannot wait on the tiles changing.
      const banked = Math.floor(sense.momentum)
      if (banked !== lastShi) {
        for (let i = 0; i < shiPips.length; i++) shiPips[i]!.classList.toggle('on', i < banked)
        lastShi = banked
      }
      const bursting = sense.burst > 0
      if (bursting !== lastBurst) {
        shiEl.classList.toggle('spending', bursting)
        lastBurst = bursting
      }

      // This is the tell, and without it the arts are invisible rules. A
      // conditional system is only learnable if the player can see which
      // condition is true at the moment it becomes true. A spending art lights
      // while its BURST runs, not while its condition holds — otherwise the
      // tile claims to be doing something for the whole minute you spend
      // surrounded, and it is not.
      const key = activeSeals(active).join(',') + (bursting ? '!' : '') + banked
      if (key === lastLit) return
      lastLit = key
      for (const tile of artTiles) {
        const art = ART_BY_ID.get(tile.dataset.art ?? '')
        if (!art) continue
        const spending = conditionKind(art.condition) === 'spend'
        const holds = active[art.condition]
        tile.classList.toggle('art-on', spending ? bursting : holds)
        // ARMED, and this state is not decoration. A player whose one woken
        // art is a spending one would otherwise stand in the right posture and
        // see nothing at all happen — which is the exact failure this whole
        // change set out to fix, moved to a new place. Armed says "you are
        // doing the right thing and you have nothing banked to spend", which
        // is the only way the loop can be learned from the screen.
        tile.classList.toggle('art-armed', spending && holds && !bursting)
      }
    },

    showGate(tier, onBank, onPush) {
      bankHandler = onBank
      pushHandler = onPush
      gatePushName.textContent = `${strings.pushChoice} · ${strings.tier} ${tier + 1}`
      gate.hidden = false
      requestAnimationFrame(() => gate.classList.add('shown'))
    },

    hideGate() {
      gate.classList.remove('shown')
      gate.hidden = true
      bankHandler = null
      pushHandler = null
    },

    showGameOver(summary, onReturn) {
      overTime.textContent = formatTime(summary.seconds)
      overKills.textContent = String(summary.kills)

      // Naming the killer is the smallest change with the largest effect on
      // comprehension: it turns an unexplained death into a lesson about one
      // specific enemy.
      overCause.textContent = summary.killedBy
        ? `${strings.felledBy} ${summary.killedBy}`
        : ''
      overCause.hidden = !summary.killedBy

      const { reward, gain } = summary

      // THE CONVERSION, AS A HEADLINE AND A RECEIPT — not four more rows.
      //
      // A playtest called this screen "a shopping list, only text", and it was
      // right: seven label/value rows of identical weight, so nothing led and
      // the eye had nowhere to land. What a player wants in the first second is
      // ONE number — what the expedition was worth — and only then where it
      // came from. So the total is the headline and the breakdown is a strip of
      // small chips beneath it, which says the same thing in a third of the
      // height and can be skipped entirely.
      let html = `<div class="rw-total-block">
        <b class="rw-total-n">${reward.total}</b>
        <span class="rw-total-label">${strings.cultivationGained}</span>
      </div>`
      const chip = (label: string, value: string): string =>
        `<span class="rw-chip"><i>${value}</i>${label}</span>`
      html += '<div class="rw-chips">'
      html += chip(strings.fromKills, `+${reward.kills}`)
      html += chip(strings.fromTime, `+${reward.time}`)
      if (reward.insight > 0) html += chip(strings.fromInsight, `+${reward.insight}`)
      if (reward.depthBonus > 1) {
        html += chip(regionAt(summary.depth).name, `×${reward.depthBonus.toFixed(1)}`)
      }
      html += '</div>'

      if (gain.levelsGained > 0) {
        html += `<div class="rw-gain">${strings.levelReached} ${summary.level}</div>`
        if (gain.realmAdvancedTo !== null) {
          html += `<div class="rw-realm">${strings.realmAdvanced} · ${
            realmOf(gain.realmAdvancedTo).name
          }</div>`
        }
        if (gain.depthUnlocked !== null) {
          html += `<div class="rw-road">${strings.roadOpened} · ${
            regionAt(gain.depthUnlocked).name
          }</div>`
        }
        const points = gain.pointsGained
        html += `<div class="rw-points">+${points} ${
          points === 1 ? strings.onePointToSpend : strings.pointsToSpend
        }</div>`
      }

      /**
       * One find, as a card rather than a line of text.
       *
       * The icon is the same one the pack and the ground mark use, so a piece
       * is recognisable in all three places without reading its name; the
       * border is its rung, which is the one property worth seeing from across
       * the screen. `lost` desaturates it and strikes the name: the whole point
       * of the death stake is that it is FELT, and a loss rendered as a grey
       * line of text is not felt.
       */
      const lootCard = (entry: Found, lost: boolean): string => {
        const base = ITEM_BY_ID.get(entry.baseId)
        if (!base) return ''
        const tier = rarityOf(entry.rarity)
        const name = base.slot === 'weapon' ? weaponById(base.styleId).name : base.name
        const lines = entry.affixes
          .map((a) => `<span class="loot-line">${affixLine(a)}</span>`)
          .join('')
        const power = entry.power ? `<span class="loot-power">${entry.power}</span>` : ''
        return (
          `<div class="loot${lost ? ' loot-lost' : ''}" style="${rarityStyle(tier)}">` +
          `<div class="loot-icon">${itemIconSvg(base.slot, base.styleId, palette.ink, 0.75, 'loot-svg')}</div>` +
          `<div class="loot-body">` +
          `<span class="loot-name">${tier.seal} ${name}</span>` +
          `<div class="loot-lines">${lines}${power}</div>` +
          `</div></div>`
        )
      }

      // Loot last, because it is the part worth scrolling for.
      if (summary.kept.length > 0) {
        html += `<div class="rw-head rw-found">${strings.found}</div>`
        html += `<div class="loot-grid">`
        for (const entry of summary.kept) html += lootCard(entry, false)
        html += `</div>`
      }
      if (summary.noRoom > 0) {
        // A find the pack could not hold is still a find that happened, and
        // saying nothing would look like the game had simply not dropped it.
        html += `<div class="rw-note">${strings.packWasFull} · ×${summary.noRoom}</div>`
      }
      // Forfeited last of all, and named — the whole point of the stake is
      // that it is felt, and a loss the player cannot see is not a stake, it
      // is a silent bug. Only a death ever produces this list; banking always
      // leaves it empty.
      if (summary.forfeited.length > 0) {
        html += `<div class="rw-head rw-lost">${strings.lostToDeath}</div>`
        html += `<div class="loot-grid">`
        for (const entry of summary.forfeited) html += lootCard(entry, true)
        html += `</div>`
      }
      overReward.innerHTML = html

      returnHandler = onReturn
      over.hidden = false
      // Next frame, so the transition has a chance to run from its start state.
      requestAnimationFrame(() => over.classList.add('shown'))
    },

    hideGameOver() {
      over.classList.remove('shown')
      over.hidden = true
      returnHandler = null
      lastPct = -1
      lastHp = -1
      lastXpPct = -1
      lastTime = ''
    },
  }
}
