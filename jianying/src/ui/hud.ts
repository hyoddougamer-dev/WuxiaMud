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
import { TECHNIQUE_BY_ID, type Loadout } from '../data/techniques'
import { ART_BY_ID, CONDITION_BY_ID, type Art } from '../data/arts'
import { activeSeals, type Conditions } from '../sim/conditions'
import { statLine, type Item } from '../data/items'
import { weaponById } from '../data/weapons'
import type { LevelGain, Reward } from '../meta/character'
import { regionAt, type Region } from '../data/regions'
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
  /** Equipment found for the first time, with the rank it dropped at. */
  kept: readonly Found[]
  /** Already owned, but found BETTER — the held piece was raised to this rank. */
  raised: readonly Found[]
  /** Equipment found that was already owned. Reported, not hidden. */
  duplicates: readonly Found[]
}

/** A piece as it came off the ground: which piece, and how good a one. */
export interface Found {
  item: Item
  rank: number
}

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
  /** Sets the arts shown in the strip — the scroll of the weapon in hand. */
  setScroll(arts: readonly Art[]): void
  /** Lights the tiles whose condition holds right now. Called every frame. */
  setConditions(active: Conditions): void
  /** Redraws the owned-technique strip. Cheap when nothing has changed. */
  updateLoadout(loadout: Loadout): void
  /** Names the road in the corner, so depth is visible during play. */
  /** Names the place and its rule in the corner, so both stay visible in play. */
  setRegion(region: Region): void
  /** Shows the end screen. `onReturn` takes the player back to the hub. */
  showGameOver(summary: RunSummary, onReturn: () => void): void
  hideGameOver(): void
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
    <div class="hud-bar">
      <div class="hud-health"><div class="hud-health-fill"></div></div>
      <div class="hud-xp"><div class="hud-xp-fill"></div></div>
      <div class="hud-stats">
        <span class="hud-time">0:00</span>
        <span class="hud-insight">${strings.insight} 1</span>
        <span class="hud-kills">0</span>
      </div>
      <div class="hud-road"></div>
      <div class="hud-arts"></div>
      <div class="hud-loadout"></div>
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
  `

  const bar = root.querySelector<HTMLElement>('.hud-bar')!
  const fill = root.querySelector<HTMLElement>('.hud-health-fill')!
  const xpFill = root.querySelector<HTMLElement>('.hud-xp-fill')!
  const insightEl = root.querySelector<HTMLElement>('.hud-insight')!
  const timeEl = root.querySelector<HTMLElement>('.hud-time')!
  const killsEl = root.querySelector<HTMLElement>('.hud-kills')!
  const roadEl = root.querySelector<HTMLElement>('.hud-road')!
  const over = root.querySelector<HTMLElement>('.over')!
  const overTime = root.querySelector<HTMLElement>('.over-time')!
  const overKills = root.querySelector<HTMLElement>('.over-kills')!
  const overCause = root.querySelector<HTMLElement>('.over-cause')!
  const overReward = root.querySelector<HTMLElement>('.over-reward')!
  const again = root.querySelector<HTMLButtonElement>('.over-again')!
  const loadoutEl = root.querySelector<HTMLElement>('.hud-loadout')!
  const artsEl = root.querySelector<HTMLElement>('.hud-arts')!

  // Only touch the DOM when a displayed value actually changes. Writing the
  // same string 60 times a second is layout work for nothing.
  let lastTime = ''
  let lastKills = -1
  let lastPct = -1
  let lastXpPct = -1
  let lastInsight = -1

  /** Serialised loadout, so the strip is only rebuilt when it really changes. */
  let lastLoadout = ''

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

  /** One itemised line on the reward breakdown. */
  const row = (label: string, value: string, cls = ''): string =>
    `<div class="rw ${cls}"><span>${label}</span><b>${value}</b></div>`

  return {
    update(hp, maxHp, elapsed, kills, xp, xpNeeded, insight) {
      const pct = Math.max(0, Math.min(1, hp / maxHp))
      if (pct !== lastPct) {
        fill.style.transform = `scaleX(${pct})`
        // Cinnabar only when it matters. A bar that is always red stops being a
        // warning and becomes decoration.
        fill.style.background = pct < 0.3 ? 'var(--cinnabar)' : 'var(--ink)'
        lastPct = pct
      }
      const t = formatTime(elapsed)
      if (t !== lastTime) {
        timeEl.textContent = t
        lastTime = t
      }
      if (kills !== lastKills) {
        killsEl.textContent = String(kills)
        lastKills = kills
      }
      const xpPct = xpNeeded > 0 ? Math.max(0, Math.min(1, xp / xpNeeded)) : 0
      if (xpPct !== lastXpPct) {
        xpFill.style.transform = `scaleX(${xpPct})`
        lastXpPct = xpPct
      }
      if (insight !== lastInsight) {
        // "Insight", never "Level": the permanent level lives in the hub, and
        // one word meaning two things on two screens was a real source of
        // confusion rather than a naming quibble.
        insightEl.textContent = `${strings.insight} ${insight}`
        lastInsight = insight
      }
    },

    setRegion(region) {
      // The rule sits under the name for the whole expedition. A player who has
      // to work out that they are being slowed has been given a puzzle instead
      // of a place.
      roadEl.innerHTML = ''
      const name = document.createElement('div')
      name.textContent = `${region.seal} ${region.name}`
      const rule = document.createElement('div')
      rule.className = 'hud-rule'
      rule.textContent = region.ruleText
      roadEl.append(name, rule)
    },

    setPlaying(playing) {
      bar.style.display = playing ? '' : 'none'
    },

    setScroll(arts) {
      // The whole scroll for the weapon in hand. Equipping four of them is a
      // later step; until it exists, showing all five is the honest thing —
      // inventing an equipped set the save does not hold would put a lie on the
      // screen for the sake of matching a mockup.
      const key = arts.map((a) => a.id).join(',')
      if (key === lastScroll) return
      lastScroll = key
      lastLit = ''

      artsEl.innerHTML = ''
      artTiles = arts.map((art) => {
        const tile = document.createElement('div')
        tile.className = 'art'
        tile.dataset.art = art.id
        // The art's seal above, the CONDITION's seal below. The condition is
        // what the player has to do, so it belongs on the tile rather than in a
        // menu they cannot open mid-fight.
        tile.innerHTML =
          `<span class="art-seal">${art.seal}</span>` +
          `<span class="art-cond">${CONDITION_BY_ID.get(art.condition)!.seal}</span>`
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

    updateLoadout(loadout) {
      // "I do not understand how many skills I have" was the report this
      // answers: without a persistent list, the only place a technique is ever
      // named is the card you tapped twenty seconds ago.
      let key = ''
      for (const [id, lv] of loadout) key += `${id}${lv},`
      if (key === lastLoadout) return
      lastLoadout = key

      loadoutEl.innerHTML = ''
      for (const [id, level] of loadout) {
        const tech = TECHNIQUE_BY_ID.get(id)
        if (!tech) continue
        const chip = document.createElement('span')
        chip.className = 'chip' + (tech.kind === 'art' ? ' chip-art' : '')
        chip.textContent = `${tech.name} ${level}`
        loadoutEl.appendChild(chip)
      }
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

      // Loot last, because it is the part worth scrolling for.
      if (summary.kept.length + summary.raised.length + summary.duplicates.length > 0) {
        html += `<div class="rw-head rw-found">${strings.found}</div>`
        const rank = (n: number): string => (n > 0 ? ` <i class="loot-rank">${'·'.repeat(n)}</i>` : '')
        for (const { item, rank: r } of summary.kept) {
          const line =
            item.slot === 'weapon' ? weaponById(item.styleId).name : statLine(item.stat, r)
          html += `<div class="loot"><span>${item.name}${rank(r)}</span><b>${line}</b></div>`
        }
        for (const { item, rank: r } of summary.raised) {
          // The interesting middle case: a piece already owned, found better.
          // Reporting this as "already yours" would hide the only thing that
          // actually happened to the player's equipment this run.
          html += `<div class="loot loot-raised"><span>${item.name}${rank(r)}</span><b>${strings.raised}</b></div>`
        }
        for (const { item } of summary.duplicates) {
          // Named rather than hidden: pretending a duplicate was a discovery
          // would be lying about the only loot the player actually got.
          html += `<div class="loot loot-dupe"><span>${item.name}</span><b>${strings.alreadyYours}</b></div>`
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
      lastKills = -1
      lastXpPct = -1
      lastInsight = -1
      lastTime = ''
      lastLoadout = ''
      loadoutEl.innerHTML = ''
    },
  }
}
