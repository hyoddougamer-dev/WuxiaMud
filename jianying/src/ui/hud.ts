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
import { ART_BY_ID, MAX_ART_LEVEL } from '../data/arts'
import type { CarriedArt } from '../sim/arts'
import { activeSeals, type Conditions } from '../sim/conditions'
import { conditionIconSvg, effectIconSvg } from '../render/packIcons'
import { palette } from '../render/palette'
import { ITEM_BY_ID } from '../data/items'
import type { OwnedItem } from '../meta/inventory'
import { affixLine } from '../data/affixes'
import { rarityOf } from '../data/rarity'
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
  /** Sets the arts shown in the strip, each with the grade it has reached. */
  setScroll(carried: readonly CarriedArt[]): void
  /** Lights the tiles whose condition holds right now. Called every frame. */
  setConditions(active: Conditions): void
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
      <div class="hud-arts"></div>
      <div class="hud-xp"><div class="hud-xp-fill"></div></div>
    </div>
    <div class="over" hidden>
      <div class="over-inner">
        <div class="over-seal">终</div>
        <div class="over-title">${strings.runOver}</div>
        <div class="over-cause"></div>
        <div class="over-rows">
          <div><span>${strings.survived}</span><b class="over-time">0:00</b></div>
          <div><span>${strings.felled}</span><b class="over-kills">0</b></div>
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

  /** One itemised line on the reward breakdown. */
  const row = (label: string, value: string, cls = ''): string =>
    `<div class="rw ${cls}"><span>${label}</span><b>${value}</b></div>`

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
      if (!playing) rift.hidden = true
    },

    setScroll(carried) {
      // The whole scroll used to show here regardless of grade; now each tile
      // is one CARRIED art with the grade this run has actually raised it to.
      const key = carried.map((c) => `${c.art.id}:${c.level}`).join(',')
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
    },

    setConditions(active) {
      // This is the tell, and without it the arts are invisible rules. A
      // conditional system is only learnable if the player can see which
      // condition is true at the moment it becomes true.
      const key = activeSeals(active).join(',')
      if (key === lastLit) return
      lastLit = key
      for (const tile of artTiles) {
        const art = ART_BY_ID.get(tile.dataset.art ?? '')
        tile.classList.toggle('art-on', art !== undefined && active[art.condition])
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
      let html = `<div class="rw-head">${strings.cultivationGained}</div>`
      html += row(strings.fromKills, `+${reward.kills}`)
      html += row(strings.fromTime, `+${reward.time}`)
      if (reward.insight > 0) html += row(strings.fromInsight, `+${reward.insight}`)
      if (reward.depthBonus > 1) {
        html += row(
          `${strings.fromDepth} · ${regionAt(summary.depth).name}`,
          `×${reward.depthBonus.toFixed(1)}`,
        )
      }
      html += row(strings.total, `${reward.total}`, 'rw-total')

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

      // Loot last, because it is the part worth scrolling for. Each row is
      // coloured by its rung and carries its best line, so the screen can be
      // skimmed for the one thing worth opening the pack for.
      if (summary.kept.length > 0) {
        html += `<div class="rw-head rw-found">${strings.found}</div>`
        for (const entry of summary.kept) {
          const base = ITEM_BY_ID.get(entry.baseId)
          if (!base) continue
          const tier = rarityOf(entry.rarity)
          const name =
            base.slot === 'weapon' ? weaponById(base.styleId).name : base.name
          const line = entry.affixes[0] ? affixLine(entry.affixes[0]) : ''
          const more = entry.affixes.length > 1 ? ` +${entry.affixes.length - 1}` : ''
          html +=
            `<div class="loot" style="border-left-color:${tier.css}">` +
            `<span style="color:${tier.css}">${tier.seal} ${name}</span>` +
            `<b>${line}${more}</b></div>`
        }
      }
      if (summary.noRoom > 0) {
        // A find the pack could not hold is still a find that happened, and
        // saying nothing would look like the game had simply not dropped it.
        html += `<div class="loot loot-dupe"><span>${strings.packWasFull}</span><b>×${summary.noRoom}</b></div>`
      }
      // Forfeited last of all, and named — the whole point of the stake is
      // that it is felt, and a loss the player cannot see is not a stake, it
      // is a silent bug. Only a death ever produces this list; banking always
      // leaves it empty.
      if (summary.forfeited.length > 0) {
        html += `<div class="rw-head rw-lost">${strings.lostToDeath}</div>`
        for (const entry of summary.forfeited) {
          const base = ITEM_BY_ID.get(entry.baseId)
          if (!base) continue
          const tier = rarityOf(entry.rarity)
          html +=
            `<div class="loot loot-lost"><span>${tier.seal} ${base.name}</span>` +
            `<b>${strings.wasNotBanked}</b></div>`
        }
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
