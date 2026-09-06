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
import { CONDITIONS, type Condition } from '../data/arts'
import { MANUAL_SLOT, type SkillBar } from '../sim/skills'
import { conditionIconSvg, itemIconSvg } from '../render/packIcons'
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
  /** The road's name, shown beside the rift so the goal has a place. */
  setWhere(name: string): void
  /**
  /**
   * The three skills and the pool that fires them.
   *
   * ONE CALL FOR BOTH, because they are one reading: a tile is only "ready" if
   * its cooldown is done AND the pool can pay for it, and a player deciding
   * whether to press has to see those together or they will press a lit tile
   * that does nothing. Splitting them into two methods is how a HUD comes to
   * claim readiness it cannot deliver.
   */
  setBar(bar: SkillBar, shi: number): void
  /**
   * Which postures hold right now, so each tile can show whether its boost is
   * being paid.
   *
   * This is the whole of what the five conditions do after the overhaul. They
   * no longer decide WHETHER a skill happens — the player decides that, by
   * pressing — they decide what it is WORTH, and a multiplier the player
   * cannot see coming is a multiplier they cannot build around.
   */
  setPostures(active: Record<Condition, boolean>): void
  /**
   * The dodge's readiness, 0..1, and whether it can fire this instant.
   *
   * Drawn as a dial that fills rather than a number that counts down: the
   * question a thumb asks mid-fight is "now?", not "in how long?".
   */
  setDodge(charge: number): void
  /** Called when the dodge button is pressed. */
  onDodge(handler: () => void): void
  /**
   * Called when the CAST button is pressed — the manual skill slot.
   *
   * A second thumb control, above the dodge and slightly smaller. It exists
   * because a skill you never press is a skill you never chose: the two auto
   * slots hold the floor of a build, and this one is the moment. Its face
   * carries the slotted skill's seal rather than a generic word, so a player
   * looking down learns which of their three this button is.
   */
  onCast(handler: () => void): void
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

/** In a fixed order, so the change key in `setPostures` is stable. */
const POSTURES: readonly Condition[] = CONDITIONS.map((c) => c.id)

/** mm:ss */
function formatTime(seconds: number): string {
  const total = Math.floor(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function createHud(root: HTMLElement): Hud {
  root.innerHTML = `
    <!-- THE RIFT, AT THE TOP, WITH ITS NAME AND ITS NUMBER.
         It was a 3px line at the very bottom of the console: the objective of
         the entire expedition, drawn as the quietest thing on the screen, with
         no label saying what it was and no number saying how far. A playtest
         reported it as "the rift took a long time to fill", which is what
         "I cannot tell how far along I am" feels like from the inside. -->
    <div class="hud-rift" hidden>
      <div class="hud-rift-lead">
        <span class="hud-rift-where"></span>
        <b>${strings.riftLabel}</b>
      </div>
      <div class="hud-rift-track"><div class="hud-rift-fill"></div></div>
      <div class="hud-rift-pct">0%</div>
    </div>
    <div class="hud-bar">
      <div class="hud-console">
        <span class="hud-life"><span class="hud-hp">0</span><span class="hud-hp-max"></span></span>
        <span class="hud-time">0:00</span>
      </div>
      <div class="hud-health"><div class="hud-health-fill"></div></div>
      <!-- 势. Three pips, because the whole point of momentum is that you
           can see how much you have before deciding to spend it. Without this
           the charge-and-spend loop is a rule nobody can play to. -->
      <div class="hud-shi" aria-hidden="true">
        <i></i><i></i><i></i><i></i>
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
    <!-- CAST. Directly above the dodge so the same thumb reaches both without
         hunting, and smaller (60px, still well over the 44px floor) so the two
         are never confused by touch alone: the panic button is the big one at
         the bottom, always in the same place. Its dial is the skill's cooldown
         and its face is the skill's seal. -->
    <button class="hud-cast" type="button" hidden>
      <svg viewBox="0 0 44 44" class="hud-cast-dial" aria-hidden="true">
        <circle class="hud-cast-track" cx="22" cy="22" r="19"></circle>
        <circle class="hud-cast-fill" cx="22" cy="22" r="19"></circle>
      </svg>
      <span class="hud-cast-seal"></span>
      <u class="hud-cast-cost"></u>
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
  const castEl = root.querySelector<HTMLButtonElement>('.hud-cast')!
  const castFill = root.querySelector<SVGCircleElement>('.hud-cast-fill')!
  const castSeal = root.querySelector<HTMLElement>('.hud-cast-seal')!
  const castCost = root.querySelector<HTMLElement>('.hud-cast-cost')!
  // The dial is drawn as a stroked circle whose dash offset is the charge, so
  // filling it costs one attribute write per frame rather than a redraw.
  const DIAL = 2 * Math.PI * 19
  dodgeFill.setAttribute('stroke-dasharray', `${DIAL}`)
  castFill.setAttribute('stroke-dasharray', `${DIAL}`)
  let dodgeHandler: (() => void) | null = null
  let castHandler: (() => void) | null = null
  // pointerdown, not click: a click waits for the release, and a dodge that
  // fires when the thumb comes UP is a dodge that arrives after the hit.
  dodgeEl.addEventListener('pointerdown', (event) => {
    event.preventDefault()
    dodgeHandler?.()
  })
  castEl.addEventListener('pointerdown', (event) => {
    event.preventDefault()
    castHandler?.()
  })
  // Keyboard, for playing at a desk. Space is the key everyone tries first and
  // Shift is the second guess; both sit under the hand that is not on the
  // mouse, which is the desk equivalent of "the thumb that is not on the
  // joystick". `repeat` is ignored, or holding the key down would become a
  // continuous dodge.
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return
    const dodgeKey =
      event.code === 'Space' || event.code === 'ShiftLeft' || event.code === 'ShiftRight'
    // The cast sits on the other hand's home keys, so a desk player can hold
    // WASD and still fire: E is the ability key every ARPG on the reference
    // list uses, and Q is the one they all use for the second.
    const castKey = event.code === 'KeyE' || event.code === 'KeyQ'
    if (!dodgeKey && !castKey) return
    // Never steal the key from a text field — a swordsman's name has spaces
    // in it.
    const focused = document.activeElement
    if (focused instanceof HTMLInputElement || focused instanceof HTMLTextAreaElement) return
    event.preventDefault()
    if (dodgeKey) dodgeHandler?.()
    else castHandler?.()
  })
  let lastMaxHp = -1
  // LONG-PRESS THE TIMER TO SEE THE FRAME TIMES.
  //
  // The readout is off by default now — it is a diagnostic, and it was the
  // loudest thing on a screen that a playtest called ugly. But it is also the
  // only way a real device ever tells this project what its frames cost, which
  // is exactly how the crowd's render bug was finally found. So it stays one
  // gesture away, on the one element nobody taps by accident, and the choice
  // is remembered.
  const DIAG_KEY = 'jianying.diag'
  try {
    if (localStorage.getItem(DIAG_KEY) === '1') document.body.dataset.diag = '1'
  } catch {
    /* private mode; the readout simply stays off */
  }
  const timeForHold = root.querySelector<HTMLElement>('.hud-time')!
  let holdTimer = 0
  const startHold = (): void => {
    holdTimer = window.setTimeout(() => {
      const on = document.body.dataset.diag === '1'
      if (on) delete document.body.dataset.diag
      else document.body.dataset.diag = '1'
      try {
        localStorage.setItem(DIAG_KEY, on ? '0' : '1')
      } catch {
        /* the toggle still works for this session */
      }
    }, 700)
  }
  const cancelHold = (): void => window.clearTimeout(holdTimer)
  timeForHold.addEventListener('pointerdown', startHold)
  for (const e of ['pointerup', 'pointercancel', 'pointerleave']) {
    timeForHold.addEventListener(e, cancelHold)
  }

  const rift = root.querySelector<HTMLElement>('.hud-rift')!
  const riftFill = root.querySelector<HTMLElement>('.hud-rift-fill')!
  const riftPct = root.querySelector<HTMLElement>('.hud-rift-pct')!
  const whereEl = root.querySelector<HTMLElement>('.hud-rift-where')!
  const hpMaxEl = root.querySelector<HTMLElement>('.hud-hp-max')!
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
  let barTiles: HTMLElement[] = []
  let lastBarKey = ''
  let lastPostures = ''

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
      // THE CEILING, BESIDE THE NUMBER. Health read "148" and nothing else, so
      // a player who equipped a robe worth +57 health had no way to see it had
      // landed — the comparison sheet promised 148 becomes 205 and the HUD
      // never mentioned 205 again. Reported exactly that way: "não percebi se
      // os stats estão funcionais".
      const roundedMax = Math.round(maxHp)
      if (roundedMax !== lastMaxHp) {
        hpMaxEl.textContent = ` / ${roundedMax}`
        lastMaxHp = roundedMax
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
      // Rounded down, so it never says 100% while the boss has not been called.
      riftPct.textContent = `${Math.floor(pct * 100)}%`
    },

    setWhere(name) {
      whereEl.textContent = name
    },

    setPlaying(playing) {
      bar.style.display = playing ? '' : 'none'
      dodgeEl.style.display = playing ? '' : 'none'
      castEl.style.display = playing ? '' : 'none'
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
    onCast(handler) {
      castHandler = handler
    },
    setBar(bar, shi) {
      // Rebuilt only when the SET of skills changes; the per-frame work below
      // is a handful of class toggles and three transform writes.
      const key = bar.slots.map((s) => s.skill?.id ?? '-').join(',')
      if (key !== lastBarKey) {
        lastBarKey = key
        lastPostures = ''
        artsEl.innerHTML = ''
        barTiles = bar.slots.map((slot, i) => {
          const tile = document.createElement('div')
          tile.className = 'skill' + (i === MANUAL_SLOT ? ' skill-manual' : '')
          if (!slot.skill) {
            tile.classList.add('skill-empty')
            artsEl.appendChild(tile)
            return tile
          }
          tile.dataset.skill = slot.skill.id
          tile.dataset.when = slot.skill.boost.when
          // The seal reads at tile size where an effect glyph does not, and it
          // is the same character the skills screen and the codex use — one
          // name for one thing, everywhere. Beneath it, the cost in dots and
          // the PICTOGRAM of the posture that pays extra: a player who reads
          // no Chinese still learns "run and this one hits harder" by seeing
          // that mark light while they run.
          tile.innerHTML =
            `<i class="skill-cool"></i>` +
            `<span class="skill-seal">${slot.skill.seal}</span>` +
            `<u class="skill-cost">${'&#9679;'.repeat(slot.skill.cost)}</u>` +
            conditionIconSvg(slot.skill.boost.when, palette.ink, 1, 'skill-when')
          artsEl.appendChild(tile)
          return tile
        })
        // The cast button wears the manual slot's face.
        const manual = bar.slots[MANUAL_SLOT]?.skill ?? null
        castEl.hidden = manual === null
        if (manual) {
          castEl.setAttribute('aria-label', manual.name)
          castSeal.textContent = manual.seal
          castCost.innerHTML = '&#9679;'.repeat(manual.cost)
        }
      }
      const banked = Math.floor(shi)
      for (let i = 0; i < barTiles.length; i++) {
        const slot = bar.slots[i]!
        const tile = barTiles[i]!
        if (!slot.skill) continue
        const cool = tile.querySelector<HTMLElement>('.skill-cool')
        // A vertical wipe rather than a number: a cooldown is a shape you read
        // without counting, and counting is what a thumb has no time for.
        const left = slot.cooling / slot.skill.cooldown
        if (cool) cool.style.transform = `scaleY(${Math.max(0, Math.min(1, left))})`
        // READY MEANS FIREABLE, not merely off cooldown. A tile that lights
        // when the pool cannot pay for it teaches the player that pressing is
        // pointless, which is worse than a dark tile.
        const ready = slot.cooling <= 0 && banked >= slot.skill.cost
        tile.classList.toggle('is-ready', ready)
        tile.classList.toggle('is-live', slot.live > 0)
        if (i === MANUAL_SLOT) {
          // The button says the same thing the tile does, because a thumb on
          // the right of the screen is not reading the strip on the left.
          castFill.setAttribute('stroke-dashoffset', `${DIAL * Math.max(0, Math.min(1, left))}`)
          castEl.classList.toggle('is-ready', ready)
          castEl.classList.toggle('is-live', slot.live > 0)
        }
      }
      for (let i = 0; i < shiPips.length; i++) shiPips[i]!.classList.toggle('on', i < banked)
    },

    setPostures(active) {
      // One string compare against one DOM write per change. The five postures
      // change several times a second while a player is moving, and touching
      // three tiles every frame for a state that is usually the same is how a
      // HUD comes to cost more than the crowd it sits over.
      const key = POSTURES.filter((c) => active[c]).join(',')
      if (key === lastPostures) return
      lastPostures = key
      for (const tile of barTiles) {
        const when = tile.dataset.when as Condition | undefined
        tile.classList.toggle('is-boosted', when !== undefined && active[when])
      }
      const manualWhen = barTiles[MANUAL_SLOT]?.dataset.when as Condition | undefined
      castEl.classList.toggle('is-boosted', manualWhen !== undefined && active[manualWhen])
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
