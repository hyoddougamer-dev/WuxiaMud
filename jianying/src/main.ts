/**
 * 剑影 Jiànyǐng — a persistent swordsman, and the expeditions that raise them.
 *
 * The game is now two loops rather than one, and the split is the point:
 *
 *   HUB          the character. Permanent, visible, and where growth is spent.
 *   EXPEDITION   a survivors-like run. Temporary, dangerous, and thrown away.
 *
 * The survivors-like alone was reported as directionless — every run started
 * and ended at zero, so nothing carried, and the player had no way to see that
 * anything had been accomplished. The hub is the answer: an expedition always
 * converts into cultivation XP, always moves a permanent bar, and the
 * conversion is itemised on the way out so it can be read rather than trusted.
 *
 * The one combat decision worth repeating here is that the blade aims at the
 * nearest enemy rather than along the direction of travel. Aiming along
 * movement was the original plan and the headless simulation killed it: enemies
 * chase, so they sit BEHIND a moving player, and a forward arc swept empty
 * ground for zero kills in every play style except standing perfectly still.
 */
import { Container, Graphics } from 'pixi.js'
import { SplashScreen } from '@capacitor/splash-screen'
import { GameLoop } from './core/loop'
import { Rng, expeditionSeed } from './core/rng'
import { clamp01, easing, lerp } from './core/tween'
import { ENEMY_KINDS, KIND_BY_ID, riftTargetFor, tierEffectiveDepth, MAX_ENEMIES, FIRST_RIFT_FRACTION } from './data/enemies'
import { buildBlade, buildSwordsmanTopDown, sashPoly, sashSpine } from './render/figure'
import { buildEnemyArt } from './render/enemyArt'
import { Crowd } from './render/crowd'
import { allRankMarks } from './render/rankMarks'
import { createCamera, fitCamera, resetCamera, updateCamera } from './render/camera'
import { createFloaters } from './render/floaters'
import { mixColor, palette } from './render/palette'
import { drawDropMark } from './render/dropMark'
import { createStage } from './render/stage'
import { CHARGE_WINDUP, Swarm } from './sim/enemies'
import { Motes } from './sim/pickups'
import { Bolts } from './sim/projectiles'
import { Hazards } from './sim/hazards'
import { Drops } from './sim/drops'
import { HURT_IMMUNITY, ORBIT_RADIUS, SLASH_VISUAL, createRun, updateCombat } from './sim/combat'
import { deriveStats } from './sim/loadout'
import { xpForLevel } from './data/insight'
import { createPlayer, playerSpeed, playerSpeedRatio, updatePlayer } from './sim/player'
import {
  DODGE_IMMUNITY,
  createDodge,
  dodgeCharge,
  startDodge,
  updateDodge,
} from './sim/dodge'
import { SURROUND_RADIUS, activeSeals, createSense, senseConditions } from './sim/conditions'

import { MIGHT } from './sim/arts'
import { defaultBar } from './data/skills'
import { createShi, updateShi } from './sim/shi'
import { applySkills, createBar, updateBar } from './sim/skills'
import {
  type Character,
  createCharacter,
  grantXp,
  recordRun,
  rewardFor,
  settleFound,
} from './meta/character'
import { kitOf } from './meta/kit'
import { bearingOf, buildOf, pigmentOf, sashOf } from './meta/look'
import { clampDepth, regionAt } from './data/regions'
import { applySchool, schoolById } from './meta/schools'
import {
  acquire,
  baseOf,
  equip,
  equippedIn,
  equippedItems,
  mintUid,
  type OwnedItem,
} from './meta/inventory'
import { ITEMS, ITEM_BY_ID, SLOTS, type Slot } from './data/items'
import { BAG_CAPACITY } from './meta/inventory'
import { rollAffixes, rollAmount, rollPower, type AffixKind } from './data/affixes'
import { rarityOf, rollRarity, type Rarity } from './data/rarity'
import { bladeOf, weaponById } from './data/weapons'
import { gearFromIds } from './render/wardrobe'
import type { Kit, Stats } from './sim/loadout'
import { ROSTER_LIMIT, loadCharacter, saveCharacter } from './meta/save'
import { createBanners } from './ui/banner'
import { createCodex } from './ui/codex'
import { createCreator } from './ui/create'
import { createHud, type Found, type RunSummary } from './ui/hud'
import { feel, unlock as unlockFeel } from './feel'
import { createHub } from './ui/hub'
import { createJoystick } from './ui/joystick'
import { strings } from './ui/strings'
import { createTitle } from './ui/title'
import { createTutorial } from './ui/tutorial'

const BUILD = '1.10.0'

async function hideSplash(): Promise<void> {
  try {
    await SplashScreen.hide()
  } catch {
    // Web build, or the plugin is unavailable. Nothing to hide.
  }
}

/**
 * Puts a failure on the screen instead of leaving a silent black rectangle.
 * On a phone there is no console to open, so rendering the message is the only
 * diagnostic channel that survives the trip to a device.
 */
function showFatal(err: unknown): void {
  const bootScreen = document.getElementById('boot')
  if (!bootScreen) return
  bootScreen.classList.remove('gone')
  bootScreen.style.opacity = '1'
  bootScreen.innerHTML = ''

  const title = document.createElement('div')
  title.textContent = strings.fatalTitle
  title.style.cssText = 'color:#c1272d;font-size:16px;margin-bottom:12px'

  const detail = document.createElement('pre')
  detail.textContent = err instanceof Error ? `${err.message}\n\n${err.stack ?? ''}` : String(err)
  detail.style.cssText =
    'color:#e8dcc0;font-size:11px;white-space:pre-wrap;word-break:break-word;' +
    'max-width:88vw;max-height:70vh;overflow:auto;text-align:left;opacity:0.8'

  bootScreen.append(title, detail)
}

async function boot(): Promise<void> {
  const host = document.getElementById('stage')!
  const hud = document.getElementById('hud')!
  const hint = document.getElementById('hint')!
  const uiRoot = document.getElementById('ui')!
  const bootScreen = document.getElementById('boot')!

  hint.textContent = strings.moveHint

  const stage = await createStage(host)
  const sashRng = new Rng(1337)

  const enemyArt = buildEnemyArt(ENEMY_KINDS)

  // The character is read before anything else is built: a save that fails to
  // parse must produce a fresh swordsman, never a boot that dies halfway.
  const loaded = await loadCharacter()
  // `let` because character creation replaces the record wholesale rather than
  // mutating a half-made one into shape.
  let character: Character = loaded.character
  const isFirstLaunch = loaded.fresh
  // The whole roster is written, not just the swordsman being played. The save
  // file is a roster from v2 onward even while it holds one — see meta/save.ts.
  const roster = loaded.roster
  const persist = (): void => {
    roster.swordsmen[roster.active] = character
    void saveCharacter(roster)
  }

  const player = createPlayer(0, 0)
  const camera = createCamera(0, 0)
  // Re-rolled at the start of every expedition, so two runs in a row are two
  // different roads rather than the same one twice.
  let runSeed = expeditionSeed()
  const swarm = new Swarm(new Rng(runSeed), regionAt(character.depth))
  const motes = new Motes()
  const bolts = new Bolts()
  const dodge = createDodge()
  const hazards = new Hazards()
  /** Equipment lying where its owner fell. See sim/drops.ts. */
  const drops = new Drops()
  // The combat rng — crits' timing aside, everything it draws (drop rolls,
  // splitter scatter angles) on a stream of its own, so it never shifts the
  // enemy spawn sequence a seed is supposed to guarantee.
  let pickRng = new Rng(runSeed ^ 0x5bf03635)
  /** Drop quality, on its own stream for the same reason `pickRng` has one. */
  let dropRng = new Rng(runSeed ^ 0x1b873593)
  /** Which of the five conditions hold right now. See sim/conditions.ts. */
  const sense = createSense()
  /**
   * Everything the character permanently brings: bought attributes, the
   * equipped weapon, and the worn armour. Rebuilt whenever the hub changes
   * something, and read once at the start of an expedition.
   */
  /**
   * What is worn in a slot.
   *
   * A thin wrapper over the inventory, and it stays a wrapper rather than being
   * inlined at its four call sites because it briefly was not one: for three
   * commits a find better than what you carried went on where it fell, and this
   * function layered that run-local choice over the saved one. That reversed on
   * a playtest — see the pickup handler — and what is left is the plain read.
   */
  const inSlot = (slot: Slot): OwnedItem | null => equippedIn(character.inventory, slot) ?? null

  // Shared with the hub's comparison sheet — see meta/kit.ts for why that
  // matters more than the four lines it saves.
  const currentKit = (): Kit => kitOf(character)

  /** The wardrobe styles the equipped armour and weapon add up to. */
  const currentGear = () => {
    const school = schoolById(character.origin)
    const weaponItem = inSlot('weapon')
    const weapon = weaponById((weaponItem ? baseOf(weaponItem) : null)?.styleId ?? school.weaponId)
    const styleIn = (slot: 'robe' | 'shoulders' | 'head'): string | undefined => {
      const entry = inSlot(slot)
      return entry ? (baseOf(entry)?.styleId ?? undefined) : undefined
    }
    return gearFromIds({
      robe: styleIn('robe'),
      shoulders: styleIn('shoulders'),
      head: styleIn('head'),
      blade: bladeOf(weapon).id,
    })
  }

  let kit = currentKit()
  let stats = deriveStats(kit)
  /**
   * The live numbers: the permanent sheet with every skill that is firing
   * folded in.
   *
   * `live` is a scratch object reused every frame — see sim/skills.ts, which
   * explains why the skills are a second layer rather than part of deriveStats.
   * Everything downstream reads `live`; `stats` stays the permanent baseline
   * the hub quotes and a comparison sheet measures against.
   */
  const live: Stats = deriveStats(kit)
  /**
   * The same numbers with NOTHING live, published for the harness.
   *
   * Its own scratch object, so computing it cannot disturb what the simulation
   * is reading. See the dataset.base line.
   */
  const resting: Stats = deriveStats(kit)
  /**
   * A bar with nothing in it, for the baseline the harness compares against.
   *
   * Its own frozen object, so computing the baseline cannot disturb what the
   * simulation is reading. See the dataset.base line.
   */
  const EMPTY_BAR = createBar()
  /** 势 — filled by moving, spent by firing. See sim/shi.ts. */
  const shi = createShi()
  /**
   * The three slotted skills. Two fire themselves, the third waits for the
   * button; see sim/skills.ts.
   *
   * Built from the weapon, because the weapon is the class. Until the skills
   * screen lands, this is the default bar rather than a stored choice — which
   * is why it is rebuilt in `refreshKit` alongside the stats: swapping to
   * flying daggers has to swap the skills with them, or the bar would be
   * offering a greatsword's techniques to somebody holding knives.
   */
  let bar = createBar(defaultBar(kit.weapon.id))
  /**
   * Recomputes the permanent stats AND the skill bar, together.
   *
   * They are recomputed in several places — a level-up, a new expedition, a
   * swordsman swap, a weapon change, a piece put on mid-run — and the gear
   * decides both. Leaving them as two adjacent lines would eventually mean a
   * site that refreshed one and not the other, and the symptom of that is a
   * bar full of skills for a weapon you are no longer holding.
   */
  const refreshKit = (): void => {
    stats = deriveStats(kit)
    const wanted = defaultBar(kit.weapon.id)
    // Only when the SET actually changes, so a level-up does not silently wipe
    // every cooldown the player has spent the last ten seconds waiting out.
    if (bar.slots.map((slot) => slot.skill?.id ?? '-').join(',') !== wanted.join(',')) {
      bar = createBar(wanted)
    }
  }
  let run = createRun(kit.weapon.interval)
  run.hp = stats.maxHp
  run.guard = stats.guard
  /** The place being walked. Chosen in the hub before every expedition. */
  let region = regionAt(clampDepth(character.depth, character.depth))
  const depthOf = (): number => region.depth
  /**
   * How many gates this expedition has pushed past. 1 at the first floor of
   * any rift, and reset there on every new expedition — it is not permanent
   * progress, it is how far into THIS descent the player has gone.
   */
  let tier = 1

  // The figure is rebuilt whenever equipment changes, since equipment IS the
  // geometry here — a longer hem is literally a longer silhouette.
  let figure = buildSwordsmanTopDown(7, 1, currentGear())
  let bladeStrokes = buildBlade(2, 1, currentGear().blade)

  resetCamera(camera, 0, 0)
  fitCamera(camera, stage.height)
  const joystick = createJoystick(host)
  const ui = createHud(uiRoot)
  // A still thumb dodges the way the swordsman already faces — see startDodge.
  // Ignored while the world is frozen for a card or a gate, since the player is
  // reading, not fighting, and a dash charged there would be spent for nothing.
  ui.onDodge(() => {
    if (!playing || run.over || gateUp || run.pendingLevelUps > 0) return
    startDodge(dodge, player, joystick.state.x, joystick.state.y)
  })
  // The manual slot. Same guard as the dodge: ignored while the world is
  // frozen for a gate, since the player is reading rather than fighting and a
  // cast spent there would go off at nothing.
  ui.onCast(() => {
    if (!playing || run.over || gateUp || run.pendingLevelUps > 0) return
    wantCast = true
  })
  const banners = createBanners(uiRoot)
  const codex = createCodex(uiRoot)
  const title = createTitle(uiRoot)
  const creator = createCreator(uiRoot)
  const floaters = createFloaters()
  const tutorial = createTutorial(banners)
  // Declared before the hub so the codex button has something to call; the hub
  // is what closes it, so the two would otherwise reference each other.
  let openHub: () => void = () => {}
  // Assigned below, once creation exists. Declared here because the hub's
  // "new swordsman" button needs something to call and creation needs the hub
  // to return to, so one of the two has to be forward-declared.
  let startCreation: (fromHub?: boolean) => void = () => {}
  const hub = createHub(
    uiRoot,
    persist,
    () => {
      hub.hide()
      codex.show(() => {
        codex.hide()
        openHub()
      })
    },
    {
      all: () => roster.swordsmen,
      activeIndex: () => roster.active,
      select: (index) => switchTo(index),
      // Additive, and therefore no warning: nothing is lost by making another.
      // The active swordsman is written back first — creation can take a while
      // and the app may be closed in the middle of it.
      add: () => {
        persist()
        hub.hide()
        startCreation()
      },
      discard: () => confirmNewCharacter(),
      limit: ROSTER_LIMIT,
    },
  )

  /**
   * Puts down one swordsman and picks up another.
   *
   * The active one is written back BEFORE switching. Without that, points spent
   * or gear equipped since the last save would be silently thrown away by the
   * act of looking at somebody else — a data loss with no error and no undo.
   */
  const switchTo = (index: number): void => {
    if (index < 0 || index >= roster.swordsmen.length || index === roster.active) return
    roster.swordsmen[roster.active] = character
    roster.active = index
    character = roster.swordsmen[index]!
    kit = currentKit()
    refreshKit()
    region = regionAt(clampDepth(character.depth, character.depth))
    rebuildFigure()
    void saveCharacter(roster)
    openHub()
  }

  /**
   * Asks before discarding a swordsman, and means it.
   *
   * Creation used to be reachable only when there was no save, which made the
   * school picker unreachable for everyone who had ever played — the one screen
   * a returning player most wanted to see was the one screen they could not.
   * Opening it now has a cost, so it is stated in full and defaults to keeping:
   * the destructive button is the second one, and dismissing does nothing.
   */
  const confirmNewCharacter = (): void => {
    const veil = document.createElement('div')
    veil.className = 'confirm'
    veil.innerHTML = `
      <div class="confirm-box">
        <div class="confirm-title">${strings.discardTitle}</div>
        <div class="confirm-body">${strings.discardBody}</div>
        <div class="confirm-row">
          <button class="confirm-keep" type="button">${strings.keep}</button>
          <button class="confirm-go" type="button">${strings.discardConfirm}</button>
        </div>
      </div>
    `
    uiRoot.appendChild(veil)
    const close = (): void => veil.remove()
    veil.querySelector<HTMLButtonElement>('.confirm-keep')!.addEventListener('click', close)
    // A tap on the darkened area is a dismissal, and dismissal keeps.
    veil.addEventListener('click', (event) => {
      if (event.target === veil) close()
    })
    veil.querySelector<HTMLButtonElement>('.confirm-go')!.addEventListener('click', () => {
      close()
      // Both callers land here — the hub's button and the title's. Hiding a
      // screen that is not showing is harmless, and branching on which one is
      // up would be one more thing to get wrong.
      hub.hide()
      title.hide()

      // With a roster, giving one up no longer has to mean starting over. Drop
      // the active swordsman; if others remain, one of them is picked up and
      // the player stays in the hub they were already standing in.
      roster.swordsmen.splice(roster.active, 1)
      if (roster.swordsmen.length > 0) {
        roster.active = Math.min(roster.active, roster.swordsmen.length - 1)
        character = roster.swordsmen[roster.active]!
        kit = currentKit()
        refreshKit()
        region = regionAt(clampDepth(character.depth, character.depth))
        rebuildFigure()
        void saveCharacter(roster)
        openHub()
        return
      }
      startCreation()
    })
  }

  // ---- Scene ------------------------------------------------------------

  // One Graphics for the whole swarm, cleared and redrawn each frame.
  // Hundreds of individual display objects would cost more in transform and
  // draw-call overhead than redrawing the geometry does.
  // The crowd's silhouettes, rasterised once per kind. `enemyGfx` keeps only
  // what is drawn for ONE enemy at a time — a charger's windup lane — which is
  // rare and is geometry that genuinely changes.
  const crowd = new Crowd(stage.app.renderer, enemyArt, MAX_ENEMIES)
  crowd.view.zIndex = -2
  stage.world.addChild(crowd.view)

  const enemyGfx = new Graphics()
  enemyGfx.zIndex = -2
  stage.world.addChild(enemyGfx)

  const shadow = new Graphics()
  shadow.ellipse(0, 0, 15, 5).fill({ color: palette.inkSoft, alpha: 0.18 })
  shadow.zIndex = -1
  stage.world.addChild(shadow)

  // 闪 — the after-images the dodge leaves. Their own layer, under the
  // swordsman, so the live figure always reads on top of its own ghosts.
  //
  // Silhouettes rather than a motion blur, and that is the whole reason this
  // effect belongs in THIS game: a blur is a photographic idea, while a row of
  // figures fading into the paper is what an ink painter does to show speed.
  // The shapes come from the same polygons the character is drawn from, so a
  // ghost is always wearing exactly what the swordsman is wearing.
  const trailGfx = new Graphics()
  trailGfx.zIndex = 1
  stage.world.addChild(trailGfx)

  // Qi motes: the first colour on the field, and the reason to walk back into
  // ground you have just cleared.
  const moteGfx = new Graphics()
  moteGfx.zIndex = -3
  stage.world.addChild(moteGfx)

  const boltGfx = new Graphics()
  boltGfx.zIndex = 1
  stage.world.addChild(boltGfx)

  // Equipment on the ground. Above the motes and below the fighting, because a
  // piece must be findable in a crowd without ever hiding what is hitting you.
  const dropGfx = new Graphics()
  dropGfx.zIndex = -2
  stage.world.addChild(dropGfx)

  // Enemy fire, drawn above the crowd so it is never lost in a press of bodies.
  const hazardGfx = new Graphics()
  hazardGfx.zIndex = 4
  stage.world.addChild(hazardGfx)

  // The sweep and the shockwave, ink marks that fade over their short lives.
  const slashGfx = new Graphics()
  slashGfx.zIndex = 1
  stage.world.addChild(slashGfx)

  const orbitGfx = new Graphics()
  orbitGfx.zIndex = 3
  stage.world.addChild(orbitGfx)

  stage.world.addChild(floaters.view)

  const swordsman = new Container()
  const sashGfx = new Graphics()

  const bladeGfx = new Graphics()
  const bodyGfx = new Graphics()

  /**
   * Re-bakes the swordsman's geometry from whatever is equipped.
   *
   * Cheap and rare: it runs when an expedition starts, not per frame, so the
   * hot loop still draws two static Graphics. This is the whole payoff of the
   * art direction — changing equipment is changing the polygons, so there is
   * no sprite to swap and no atlas to rebuild.
   */
  const rebuildFigure = (): void => {
    const gear = currentGear()
    // The look drives the brush hand and the build, so the swordsman fought
    // with is the same one chosen at creation and shown in the hub — not a
    // default that quietly ignores half of what the player picked.
    figure = buildSwordsmanTopDown(
      character.look.seed,
      1,
      gear,
      buildOf(character.look).width,
      bearingOf(character.look),
    )
    bladeStrokes = buildBlade(character.look.seed + 1, 1, gear.blade)
    // The dye the robe was given at creation. Null keeps it ink.
    const dye = pigmentOf(character.look).colour

    bladeGfx.clear()
    for (const stroke of bladeStrokes) {
      // As on the body, a carved mark is drawn in PAPER over what is under it —
      // here it is the gap between the two fists on the haft, and in ink it
      // would weld them into one thick section.
      const colour = stroke.part === 'cut' ? palette.paper : palette.ink
      bladeGfx.poly(stroke.poly).fill({ color: colour, alpha: stroke.alpha })
    }
    // The weapon turns about the BUTT of its grip, not about the middle of the
    // blade. `buildBlade` puts the origin at the fist with the haft running
    // behind it, so rotating about the origin swung that haft through the
    // swordsman's own body — pointing right put the pommel out through their
    // left ribs, pointing up drove it down through the skirt. Reported as the
    // hold looking wrong, and it was. Moving the pivot back by the grip's
    // length hangs the whole weapon off the hands, which is where a person
    // holds one.
    bladeGfx.pivot.x = -(gear.blade.grip ?? 0)
    bodyGfx.clear()
    // Rank marks last, over the body, in gold — see render/rankMarks.ts. The
    // figure has to exist before they can hang off it, so they are collected
    // here and drawn after the loop below.
    const ranked = equippedItems(character.inventory).flatMap((entry) => {
      const base = baseOf(entry)
      return base ? [{ slot: base.slot, rank: entry.rarity }] : []
    })
    for (const strokes of [figure.bleed, figure.body]) {
      for (const stroke of strokes) {
        // Robe marks carry the dye; the rest stay ink, so the silhouette still
        // reads black against the paper at the size the game actually draws.
        // A cut is painted the colour of the ground it sits on, which is what
        // makes it a hole rather than a pale mark — see FigureStroke.part.
        const colour =
          stroke.part === 'cut'
            ? palette.paper
            : stroke.part === 'robe' && dye !== null
              ? dye
              : palette.ink
        bodyGfx.poly(stroke.poly).fill({ color: colour, alpha: stroke.alpha })
      }
    }
    for (const stroke of allRankMarks(ranked, figure, 1, character.look.seed)) {
      bodyGfx.poly(stroke.poly).fill({ color: palette.gold, alpha: stroke.alpha })
    }
  }
  rebuildFigure()

  // Depth inside the character is dynamic: a blade aimed away from the camera
  // passes BEHIND the body, a sash streaming toward it falls in FRONT.
  swordsman.sortableChildren = true
  bodyGfx.zIndex = 0
  swordsman.addChild(sashGfx, bodyGfx, bladeGfx)
  swordsman.zIndex = 2
  stage.world.addChild(swordsman)

  /** Chest height, in world units — where the blade pivots. */
  const BLADE_PIVOT_Y = -26

  const stickGfx = new Graphics()
  stage.overlay.addChild(stickGfx)

  stage.app.renderer.on('resize', () => fitCamera(camera, stage.height))

  // ---- Run lifecycle ----------------------------------------------------

  let gameOverShown = false
  /** True while the gate's bank-or-push choice is on screen. */
  let gateUp = false
  /** True between "Set out" and the end screen. False while the hub is up. */
  let playing = false

  /**
   * The simulation's channel to the screen.
   *
   * Everything here answers the same reported problem — not being able to tell
   * what was happening. A number over a struck enemy, a number over the player
   * when something lands, and a banner naming whatever just took a bite.
   */
  /** Equipment found during the current expedition, in the order found. */
  let foundThisRun: Found[] = []
  /**
   * What the drop table should treat as already owned.
   *
   * Includes what was found earlier in this same expedition, so a run cannot
   * hand out the same robe three times before the player has had a chance to
   * put it away.
   */
  let ownedThisRun = new Set<string>()
  /**
   * How much of `foundThisRun` is safe from a death — see `settleFound` in
   * meta/character.ts for the whole rule. Advances to `foundThisRun.length`
   * the instant a gate clears, whether the player then banks or pushes on.
   */
  let securedFindCount = 0
  /**
   * Pieces on the ground, by the handle the drop pool carries.
   *
   * The simulation holds a position and a rung; the instance itself lives here,
   * because the roll is the caller's business and the sim has no business
   * knowing what a Hemp Robe is.
   */
  const onGround = new Map<string, Found>()
  /**
   * Skills already explained this expedition. Reset with everything else.
   *
   * Per RUN rather than per save on purpose: the skills you carry change with
   * the blade in your hand, so one you last saw six expeditions ago on a
   * different weapon deserves its line again. It costs one banner.
   */
  let taughtSkills = new Set<string>()
  /**
   * How fast the swordsman was actually moving last frame, 0..1.
   *
   * 势 is filled from this, and it is LAST frame's on purpose: the pool has to
   * be advanced before the bar spends from it, and movement for this frame has
   * not happened yet at that point. One frame at 60Hz.
   */
  let paceLastFrame = 0
  /**
   * True on the frame the cast button was pressed, cleared the moment the bar
   * has seen it.
   *
   * A flag rather than a queue: a press with the skill cooling or the pool
   * short does nothing at all. A queued cast on a phone fires at a moment the
   * player has stopped meaning, which reads as the game ignoring them and then
   * acting on its own. See updateBar.
   */
  let wantCast = false
  /**
   * Which slot the piece at `uid` fits, for the mark drawn on the ground.
   *
   * The simulation's pool carries a position and a rung and nothing else — it
   * has no business knowing what a Hemp Robe is (see sim/drops.ts). The
   * instance lives here, so the renderer asks here. Falls back to the robe's
   * silhouette, which reads as "a thing you wear" rather than as nothing.
   */
  const slotOnGround = (uid: string): string => {
    const found = onGround.get(uid)
    return (found ? baseOf(found) : null)?.slot ?? 'robe'
  }
  /** Wall clock of the last qi tick, for the throttle in `events.qi`. */
  let lastQiSound = 0
  /** True only when the run ends by choosing "leave", never by dying. */
  let bankedThisEnd = false
  /**
   * Which slots were empty when the expedition began — the one class of find
   * a death can never take, or a player's first weapon could vanish with
   * them and teach nothing but that finding gear was pointless.
   */
  let emptySlotsAtStart = new Set<string>()
  /**
   * Loot's worth, in the unit `rollRank` and the drop table read — the same
   * region can pay out better gear at a deeper 阶, since no new item ever
   * unlocks past what the base regions already hold. See tierEffectiveDepth.
   */
  const effectiveDepth = (): number => tierEffectiveDepth(region.depth, tier)

  const events = {
    hit(x: number, y: number, amount: number, killed: boolean, crit?: boolean): void {
      floaters.hit(x, y, amount, killed, crit)
      // Three different sounds for one event, because the player is told three
      // different things: it landed, it landed doubled, it was the last of it.
      if (crit) feel.crit()
      else if (killed) feel.kill()
      else feel.hit()
    },
    mend(x: number, y: number, amount: number): void {
      floaters.mend(x, y, amount)
    },
    hurt(amount: number, source: string): void {
      floaters.hurt(player.x, player.y, amount)
      banners.show(source, 'danger', `−${Math.round(amount)}`)
      feel.hurt()
    },
    /**
     * Qi reaching the swordsman. THROTTLED, and that is the whole design of it.
     *
     * A magnet pulling in a stream fires this on most frames, which at sixty a
     * second is not a sound, it is a tone. Rationing it to about twelve a
     * second turns the same stream into a rattle — you still hear that qi is
     * flowing and how fast, without the mix being eaten by it.
     */
    qi(): void {
      const now = performance.now()
      if (now - lastQiSound < 80) return
      lastQiSound = now
      feel.qi()
    },
    swing(thrown: boolean): void {
      if (thrown) feel.throw()
      else feel.sweep()
    },
    parry(x: number, y: number, count: number): void {
      floaters.parry(x, y, count)
      // A short, dry tick of haptics: the parry has to be FELT as well as seen,
      // because it happens while the player is looking at the crowd and not at
      // the swordsman. See haptics.ts for why this is the lightest tap there is.
      feel.parry()
    },
    drop(x: number, y: number, itemId: string, luck: number): void {
      const item = ITEM_BY_ID.get(itemId)
      if (!item) return
      // The whole roll happens here, on its own seeded stream so that adding
      // the ladder did not shift the enemy sequence a replay expects: which
      // rung, then the lines, then — on 神 and 仙 only — the named power.
      const depth = effectiveDepth()
      const rarity = rollRarity(depth, dropRng.next(), luck)
      const found: OwnedItem = {
        uid: mintUid(item.id),
        baseId: item.id,
        rarity,
        affixes: rollAffixes(rarity, depth, dropRng),
        power: rollPower(rarity, item.slot, dropRng.next()),
        depth: Math.round(depth),
      }
      // Rolled here, at the moment of death, so a seeded expedition rolls the
      // same piece whether or not the player ever goes to fetch it. It lands on
      // the GROUND rather than in the bag — see sim/drops.ts for why that
      // reversed an earlier decision.
      onGround.set(found.uid, found)
      drops.drop(x, y, found.uid, rarity)
      ownedThisRun.add(item.id)
      // Only the good rungs interrupt. A grey piece announcing itself on every
      // third kill would train the player to ignore the banner entirely, and
      // then the purple one would go unread too.
      if (rarity >= 3) banners.show(item.name, 'gold', rarityOf(rarity).name)
    },
  }

  const beginExpedition = (chosen: number): void => {
    region = regionAt(clampDepth(chosen, character.depth))
    player.x = 0
    player.y = 0
    player.prevX = 0
    player.prevY = 0
    player.vx = 0
    player.vy = 0
    runSeed = expeditionSeed()
    tier = 1
    swarm.reset(runSeed, region, tier)
    motes.clear()
    bolts.clear()
    hazards.clear()
    floaters.clear()
    banners.clear()
    ui.hideGate()
    foundThisRun = []
    drops.clear()
    onGround.clear()
    taughtSkills = new Set()
    paceLastFrame = 0
    wantCast = false
    shi.value = 0
    for (const slot of bar.slots) {
      slot.cooling = 0
      slot.live = 0
      slot.cast = 0
    }
    ownedThisRun = new Set(character.inventory.owned.map((entry) => entry.baseId))
    securedFindCount = 0
    bankedThisEnd = false
    // Slots empty right now, before this expedition finds anything for them —
    // see settleFound. Read from the equipped record directly rather than
    // through `character.inventory.equipped[slot]` truthiness at settle time,
    // because settling itself equips into empty slots as it goes.
    emptySlotsAtStart = new Set(
      SLOTS.filter((slot) => !character.inventory.equipped[slot]),
    )
    // The kit is read here, and this is the only place permanent power touches
    // a run: after this the expedition knows nothing about the hub.
    kit = currentKit()
    refreshKit()
    rebuildFigure()
    pickRng = new Rng(runSeed ^ 0x5bf03635)
    dropRng = new Rng(runSeed ^ 0x1b873593)
    run = createRun(kit.weapon.interval)
    run.hp = stats.maxHp
    run.guard = stats.guard
    // The rift's gate, at the first floor. See riftTargetFor in data/enemies.ts
    // and the calibration in docs/CORRIDAS.md for where region.riftBase comes
    // from.
    run.riftTarget = riftTargetFor(region.riftBase, tier)
    // THE FIRST EXPEDITION IS A SHORT ONE. See FIRST_RIFT_FRACTION: the gate is
    // tuned for a player who has a build to watch arrive, and the first run is
    // the one where nobody has one. Same flag the tutorial uses, so it happens
    // exactly once per swordsman.
    if (!character.taught) run.riftTarget = Math.round(run.riftTarget * FIRST_RIFT_FRACTION)
    ui.setWhere(region.name)
    resetCamera(camera, 0, 0)
    gameOverShown = false
    gateUp = false
    playing = true
    ui.hideGameOver()
    ui.setPlaying(true)
    hub.hide()
    tutorial.reset()

    // The place is announced by name, and so is its rule — a region whose rule
    // the player has to infer from being slowed is a bug, not a discovery.
    banners.show(region.name, 'plain', `${region.seal} · ${kit.weapon.name}`)
    if (region.ruleText) banners.show(region.ruleText, 'gold')
  }

  /**
   * Carries the same swordsman to a harder floor of the same rift.
   *
   * Everything that makes a push a FLOOR rather than a fresh expedition: the
   * build, the kills, the insight and the elapsed clock all continue. Only the
   * field resets — a new swarm, a new (harder) target — because the floor
   * just cleared is not somewhere to keep fighting.
   */
  const pushDeeper = (): void => {
    tier++
    swarm.reset(runSeed ^ (tier * 0x9e3779b9), region, tier)
    motes.clear()
    bolts.clear()
    hazards.clear()
    run.gateCleared = false
    run.riftValue = 0
    run.riftTarget = riftTargetFor(region.riftBase, tier)
    // The tier belongs beside the rift, not only in a banner that fades: it is
    // the difference between "the same road again" and "a harder floor".
    ui.setWhere(`${region.name} · ${strings.tier} ${tier}`)
    ui.hideGate()
    gateUp = false
    banners.show(`${strings.tier} ${tier}`, 'gold')
  }

  openHub = (): void => {
    playing = false
    ui.hideGameOver()
    ui.setPlaying(false)
    banners.clear()
    floaters.clear()
    title.hide()
    creator.hide()
    codex.hide()
    hub.show(character, beginExpedition)
  }

  /**
   * Converts a finished expedition into permanent progress.
   *
   * Called exactly once per death, before the end screen is drawn, so the
   * screen can itemise what the run was actually worth rather than promising it.
   */
  const settleExpedition = (): RunSummary => {
    // The reward reads the EFFECTIVE depth — the same number that decided
    // loot this run — so pushing a gate pays in cultivation as well as gear.
    // `recordRun` and the screen's own region lookup read the real, integer
    // region depth instead: a lifetime stat or a name should never show a
    // fractional "depth 6.5" a tier produced.
    const result = { kills: run.kills, seconds: run.elapsed, insight: run.level, depth: depthOf() }
    const reward = rewardFor({ ...result, depth: effectiveDepth() })
    const gain = grantXp(character, reward.total)
    recordRun(character, result)

    // What a death forfeits — see settleFound in meta/character.ts for the
    // whole rule. `bankedThisEnd` is only ever true when the run ended by
    // choosing "leave" at a gate, never by dying.
    const slotOfFind = (entry: Found): string => baseOf(entry)?.slot ?? ''
    const eligible = settleFound(
      foundThisRun,
      securedFindCount,
      emptySlotsAtStart,
      bankedThisEnd,
      slotOfFind,
    )
    const forfeited = foundThisRun.filter((f) => !eligible.includes(f))

    // One list where there were three. "Raised" and "duplicate" were states
    // only the old one-row-per-piece bag could produce; every find is now its
    // own rolled instance, so every find that fits is simply kept — and one
    // that does not fit is counted rather than silently dropped.
    const kept: Found[] = []
    let noRoom = 0
    for (const found of eligible) {
      if (acquire(character.inventory, found) === 'full') {
        noRoom++
        continue
      }
      kept.push(found)
    }
    kept.sort((a, b) => b.rarity - a.rarity)
    // Anything for an EMPTY slot goes straight on, and nothing else does.
    //
    // Making a player visit the hub to equip their very first weapon would be
    // ceremony for its own sake. Beyond that the choice is theirs: a rung is
    // the game's opinion of better, and quietly acting on it is what the
    // mid-run auto-equip was doing wrong.
    for (const found of kept) {
      const slot = slotOfFind(found) as Slot
      if (slot && !character.inventory.equipped[slot]) equip(character.inventory, found.uid)
    }

    // One expedition is enough teaching. Coaching that keeps firing after the
    // player has understood the game stops being help and becomes noise they
    // have no way to dismiss mid-fight.
    character.taught = true
    persist()
    return {
      seconds: run.elapsed,
      kills: run.kills,
      depth: depthOf(),
      killedBy: run.killedBy,
      reward,
      gain,
      level: character.level,
      kept,
      noRoom,
      forfeited,
    }
  }

  // ---- Simulation -------------------------------------------------------

  let time = 0

  const update = (dt: number): void => {
    time += dt
    joystick.tick(dt)
    banners.update(dt)
    floaters.update(dt)

    if (!playing || run.over) return

    // 内力 — what a level-up is now.
    //
    // It used to push the next carried art up a grade, and that was the report
    // "skills sobem em combate não faz sentido" was about: an art you did not
    // choose, at a grade you could not keep, announced in a banner you could
    // not act on. A level is a flat, dull two numbers now (see applyMight), and
    // the interesting growth inside a run is the piece on the ground.
    //
    // The gain in maximum health is handed to CURRENT health too. Raising the
    // ceiling without raising what stands under it would read as the bar
    // shrinking at the exact moment the player was told they got stronger.
    while (run.pendingLevelUps > 0) {
      run.pendingLevelUps--
      // The ceiling rises in `live` on the next frame (applySkills folds 内力 in);
      // what stands under it has to rise with it here, or the bar would appear
      // to shrink at the exact moment the player was told they got stronger.
      run.hp += MIGHT.maxHp
      banners.show(strings.mightGained, 'gold', `${strings.level} ${run.level}`)
      feel.level()
    }

    // The gate freezes the field exactly like the cards used to: the player is
    // choosing, and a crowd closing in while they read the choice would be
    // indefensible. Shown once per clearing — `run.gateCleared` stays true
    // until `pushDeeper` or the reward screen clears it, and BOTH of them now
    // actually do (see showGameOver below; for a long time only one did).
    if (run.gateCleared) {
      if (!gateUp) {
        gateUp = true
        // Clearing the gate is the proof of progress — everything found up to
        // here is secured whether the player then leaves or pushes on. See
        // settleFound in meta/character.ts for the whole rule this feeds.
        securedFindCount = foundThisRun.length
        feel.gate()
        ui.showGate(
          tier,
          () => {
            // Bank: ends the expedition exactly as a death would, except
            // nothing killed the swordsman — `killedBy` stays null, and
            // `showGameOver` already reads that as "no cause" rather than as
            // a lie about how the run ended. `bankedThisEnd` is what tells
            // settleExpedition this was a leave rather than a death, so
            // NOTHING found this run is at risk.
            bankedThisEnd = true
            run.gateCleared = false
            run.over = true
          },
          pushDeeper,
        )
      }
      return
    }

    const insightBefore = run.level

    // THE SKILLS, resolved before anything reads a stat this frame.
    //
    // Three steps in a fixed order and the order is the design. The pool is
    // advanced from LAST frame's movement, then the bar fires whatever it can
    // afford, then the live sheet is rebuilt from whatever is now running. Any
    // other order lets a skill be paid for out of 势 the player has not earned
    // yet, or fold into a sheet that was already read.
    //
    // `sense.active` still holds what was true at the END of the previous
    // frame, and that is on purpose: sensing first would mean sensing from a
    // position the player has not moved to yet, and a speed skill would depend
    // on a move that depends on the speed skill. One frame of lag at 60Hz is
    // sixteen milliseconds — not a thing anyone can feel, and the only way out
    // of the circle.
    updateShi(shi, { pace: paceLastFrame, turned: sense.active.turn }, dt)
    const casts = updateBar(bar, shi, sense.active, wantCast, dt)
    wantCast = false
    applySkills(stats, bar, live, run.level)
    for (const index of casts.fired) {
      const skill = bar.slots[index]?.skill
      if (!skill) continue
      feel.cast()
      // TAUGHT AT THE MOMENT IT FIRES, once per skill per expedition.
      //
      // A tile lighting in the HUD is a signal aimed at a player who is looking
      // at the HUD, and nobody is — they are watching the field with something
      // chasing them. So the first cast says what it is, in the banner the
      // player already reads for damage and finds. After that the tile is
      // enough, and a message that keeps firing stops teaching and becomes
      // noise.
      if (taughtSkills.has(skill.id)) continue
      taughtSkills.add(skill.id)
      banners.show(`${skill.seal} ${skill.name}`, 'gold', skill.blurb)
    }

    const { x: ix, y: iy } = joystick.state
    // The region bends the player, not the enemies, and that asymmetry is the
    // whole design: wading slows you while the marsh does not slow what lives
    // in it, and the cliff wind moves you whether or not your thumb agrees.
    const rule = region.rule
    const windAngle = rule.driftPeriod ? (time / rule.driftPeriod) * Math.PI * 2 : 0
    const drift = rule.drift ?? 0
    // 闪 first, and it REPLACES normal movement while it runs — see sim/dodge.ts.
    // Blending the two would let the thumb steer the dash, and a dash you can
    // curve is a speed boost rather than a commitment.
    const speedNow = live.moveSpeed * (rule.playerSpeed ?? 1)
    const dashing = updateDodge(dodge, player, dt, speedNow)
    if (dashing) {
      // Held rather than set once: the dash lasts several ticks and combat
      // decrements immunity on each of them.
      run.immunity = Math.max(run.immunity, DODGE_IMMUNITY)
    } else {
      updatePlayer(
        player,
        ix,
        iy,
        dt,
        speedNow,
        Math.cos(windAngle) * drift,
        Math.sin(windAngle) * drift,
      )
    }
    // The five conditions, read before combat resolves so that what the HUD
    // lights this frame is the same state an art would have fired on.
    const stickLen = Math.hypot(ix, iy)
    let nearby = 0
    swarm.grid.query(player.x, player.y, SURROUND_RADIUS, () => {
      nearby++
    })
    senseConditions(
      sense,
      {
        speed: playerSpeed(player),
        maxSpeed: live.moveSpeed * (rule.playerSpeed ?? 1),
        // The direction of TRAVEL, taken from the thumb rather than from the
        // figure's facing — facing persists while standing still, so a player
        // who stops and starts would read as having turned.
        //
        // Normalised, because the turn test is a dot product against a
        // threshold: at half deflection two opposite pushes only reach −0.25,
        // so a reversal made without shoving the stick to the rim would not
        // have counted as a reversal.
        moveX: stickLen > 0 ? ix / stickLen : 0,
        moveY: stickLen > 0 ? iy / stickLen : 0,
        nearby,
        hp: run.hp,
        maxHp: live.maxHp,
      },
      dt,
    )
    // Read once, here, so 势 and the 疾 condition can never disagree about how
    // fast the swordsman is going.
    const topSpeed = live.moveSpeed * (rule.playerSpeed ?? 1)
    paceLastFrame = topSpeed > 0 ? playerSpeed(player) / topSpeed : 0

    swarm.update(player.x, player.y, run.elapsed, dt, hazards)
    // Pieces on the ground. The pool asks before handing one over, so a full
    // pack leaves it lying there rather than eating it — the player can drop
    // something in the hub and come back for it.
    for (const uid of drops.update(player.x, player.y, dt, () => foundThisRun.length < BAG_CAPACITY)) {
      const found = onGround.get(uid)
      if (!found) continue
      onGround.delete(uid)
      foundThisRun.push(found)
      const base = baseOf(found)
      floaters.found(player.x, player.y)
      feel.found()
      if (!base) continue
      // NOT WORN. A find goes into the pack and is dealt with at the end.
      //
      // This reverses a decision made three commits ago, on the player's own
      // report, and the trade is worth writing down because it is a real one.
      //
      // The idea was that a piece better than what you carry went on where it
      // fell: cross the field to the purple sword at minute six and a fourth
      // art wakes mid-fight. That is a good beat, and it is what made minute
      // eight differ from minute one once the arts stopped growing during a
      // run. It measured well and it verified in a browser.
      //
      // It is still wrong, for a reason no measurement reaches. The game was
      // making a build decision on the player's behalf, silently, in the middle
      // of a fight — swapping the WEAPON meant the whole scroll of arts changed
      // under a thumb already busy. "Better rung" is the game's opinion of
      // better, not the player's: a 良 fan with the wrong lines is not an
      // upgrade over a 凡 jian you built a ranking around. An automatic
      // improvement you did not ask for is indistinguishable from the game
      // playing itself, which is the complaint this whole rework started from.
      //
      // What replaces the beat is not nothing — the run still grows through
      // 内力, and the expedition still ends in a real decision at the gate. If
      // the mid-run change comes back it should come back as a CHOICE, offered
      // where the game already stops and asks one.
      banners.show(base.name, found.rarity >= 3 ? 'gold' : 'plain', rarityOf(found.rarity).name)
    }
    updateCombat(
      {
        run,
        player,
        swarm,
        motes,
        bolts,
        hazards,
        stats: live,
        rng: pickRng,
        events,
        depth: effectiveDepth(),
        owned: ownedThisRun,
      },
      dt,
    )
    updateCamera(camera, player, live.moveSpeed, dt)

    // A boss used to simply walk on from off-screen, indistinguishable from a
    // larger silhouette in a crowd of silhouettes until it started firing.
    //
    // Named for the REGION's own boss, not always the Warlord — the rift is
    // meant to ask each place's own question, and a banner that named the
    // wrong one on four of five floors would say otherwise.
    if (swarm.takeBossArrival()) {
      banners.show(KIND_BY_ID.get(region.bossId)!.name, 'danger', strings.bossApproaches)
    }
    if (run.level > insightBefore) {
      banners.show(`${strings.insightReached} ${run.level}`, 'gold')
    }

    // First expedition only. Every lesson fires on a condition rather than a
    // timer, so it lands the moment it is about to be useful.
    if (!character.taught) {
      tutorial.update({
        elapsed: run.elapsed,
        kills: run.kills,
        motes: motes.pool.size,
        rift: Number.isFinite(run.riftTarget) ? run.riftValue / run.riftTarget : 0,
        // Everything found this run, whether still on the ground or already
        // carried — the lesson is about what a piece IS, not about picking up.
        found: foundThisRun.length + onGround.size,
        hp: run.hp,
        maxHp: live.maxHp,
        insight: run.level,
      })
    }
  }

  // ---- Render -----------------------------------------------------------

  const render = (alpha: number): void => {
    const wx = lerp(player.prevX, player.x, alpha)
    const wy = lerp(player.prevY, player.y, alpha)
    const zoom = camera.zoom

    // The world container carries the whole camera transform, so everything
    // inside it is positioned in plain world coordinates.
    stage.world.scale.set(zoom)
    stage.world.x = stage.width / 2 - camera.x * zoom
    stage.world.y = stage.height / 2 - camera.y * zoom

    const ratio = playerSpeedRatio(player, live.moveSpeed)
    const bobRate = 2.0 + ratio * 6
    const bob = Math.sin(time * bobRate) * (0.6 + ratio * 1.3)

    // --- enemies -------------------------------------------------------
    enemyGfx.clear()
    crowd.begin()
    for (let i = 0; i < swarm.pool.size; i++) {
      const e = swarm.pool.at(i)
      const ex = lerp(e.prevX, e.x, alpha)
      const ey = lerp(e.prevY, e.y, alpha)
      const art = enemyArt.get(e.kind.id)
      if (!art) continue

      // A struck enemy washes toward cinnabar. It is the only feedback in the
      // build that a hit landed, and without it the swarm just thins silently.
      // Base colour is the kind's accent: cinnabar for the threats that reach
      // you from outside the sweep, gold for a boss, ink for everything else.
      const base = art.accent
      const tint = e.hitFlash > 0 ? mixColor(base, palette.cinnabar, e.hitFlash / 0.12) : base
      // Idle sway, phase-shifted per enemy so a crowd never pulses in unison.
      const sway = Math.sin(time * 3.4 + e.phase) * 0.6

      // Only the solid pass. The bleed underlay is a wide, 16%-alpha wash that
      // sells ink soaking into paper at the size the PLAYER is drawn — on an
      // enemy nine world units across it is invisible, so it is baked out of
      // the silhouette entirely.
      // ONE SPRITE, TINTED. This was a polygon rebuild per body per frame and
      // it cost 27ms at a full field — the whole 60fps budget, and the reason a
      // real phone reported 21-30 fps late in a run. See render/crowd.ts for
      // the measurement and why nothing ever caught it.
      crowd.place(e.kind.id, ex + sway, ey, tint)

      // A charger winding up draws a cinnabar line along the lane it is about
      // to cross. The dash is only fair because it is announced.
      if (e.kind.behaviour === 'charger' && e.state === CHARGE_WINDUP) {
        const tx = wx - ex
        const ty = wy - ey
        const tl = Math.hypot(tx, ty) || 1
        enemyGfx
          .poly([
            ex + (tx / tl) * 14,
            ey + (ty / tl) * 14,
            ex + (tx / tl) * 260 - (ty / tl) * 5,
            ey + (ty / tl) * 260 + (tx / tl) * 5,
            ex + (tx / tl) * 260 + (ty / tl) * 5,
            ey + (ty / tl) * 260 - (tx / tl) * 5,
          ])
          .fill({ color: palette.cinnabar, alpha: 0.16 })
      }

      // Only bosses carry a health bar. On a normal enemy it would be noise on
      // something that dies to one or two sweeps.
      if (e.kind.behaviour === 'boss') {
        const w = 74
        const pct = Math.max(0, e.hp / e.maxHp)
        const by = ey - e.kind.radius * 2.4
        enemyGfx.rect(ex - w / 2, by, w, 5).fill({ color: palette.ink, alpha: 0.16 })
        enemyGfx.rect(ex - w / 2, by, w * pct, 5).fill({ color: palette.cinnabar, alpha: 0.9 })
      }
    }
    // Hides whatever last frame used and this one did not. Without it a wave
    // that thins leaves its dead standing.
    crowd.end()

    // --- enemy fire ----------------------------------------------------
    hazardGfx.clear()
    for (let i = 0; i < hazards.pool.size; i++) {
      const h = hazards.pool.at(i)
      const hx = lerp(h.prevX, h.x, alpha)
      const hy = lerp(h.prevY, h.y, alpha)
      hazardGfx.circle(hx, hy, h.radius).fill({ color: palette.cinnabar, alpha: 0.9 })
      hazardGfx.circle(hx, hy, h.radius * 2).fill({ color: palette.cinnabar, alpha: 0.14 })
    }

    // --- the sweep -----------------------------------------------------
    //
    // ONLY the sweeper gets an arc. Drawing one for the thrower was the single
    // worst thing on screen for that class: `slashRange` is its FLIGHT
    // distance, 250 units, so the crescent came out as a two-hundred-and-fifty
    // unit band across most of the screen every half second — and it arrived
    // where the daggers had not got to yet. The thrower's blow is the daggers.
    // What it gets here instead is the release: a short flick at the hand,
    // pointing where the volley just went.
    slashGfx.clear()
    if (run.slashVisual > 0 && live.strike === 'throw') {
      const life = run.slashVisual / SLASH_VISUAL
      const angle = Math.atan2(run.slashAimY, run.slashAimX)
      const ease = easing.outCubic(life)
      // A wedge from the hand, gone in a fifth of a second. It exists to answer
      // "did that come out of ME" — nothing more, because the blades in flight
      // are already carrying the information.
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      const px = -sin
      const py = cos
      const near = 10
      const far = 10 + 26 * ease
      const w = 5 * (1 - ease * 0.5)
      slashGfx
        .poly([
          wx + cos * near + px * w, wy + sin * near + py * w - 14,
          wx + cos * far, wy + sin * far - 14,
          wx + cos * near - px * w, wy + sin * near - py * w - 14,
        ])
        .fill({ color: palette.ink, alpha: 0.42 * life })
    } else if (run.slashVisual > 0) {
      const life = run.slashVisual / SLASH_VISUAL
      const angle = Math.atan2(run.slashAimY, run.slashAimX)
      const ease = easing.outCubic(life)
      // A filled wedge was the first attempt and it read as a spotlight: a
      // 200-degree cone is most of the screen, and shading all of it buries the
      // characters. A crescent traces the same reach as a brush mark instead —
      // the edge of the sweep, not the area it covers.
      const reach = live.slashRange * (0.72 + 0.28 * ease)
      const width = 15 * ease
      const steps = 20

      const outer: number[] = []
      const inner: number[] = []
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const a = angle - live.slashHalfAngle + 2 * live.slashHalfAngle * t
        // Thickest mid-sweep, tapering to nothing at both ends, the way a blade
        // enters and leaves the arc.
        const w = width * Math.sin(t * Math.PI)
        const cos = Math.cos(a)
        const sin = Math.sin(a)
        outer.push(wx + cos * (reach + w * 0.5), wy + sin * (reach + w * 0.5))
        inner.push(wx + cos * (reach - w * 0.5), wy + sin * (reach - w * 0.5))
      }
      const band = outer.slice()
      for (let i = inner.length - 2; i >= 0; i -= 2) band.push(inner[i]!, inner[i + 1]!)
      slashGfx.poly(band).fill({ color: palette.ink, alpha: 0.5 * life })
    }

    // --- qi motes ------------------------------------------------------
    moteGfx.clear()
    for (let i = 0; i < motes.pool.size; i++) {
      const m = motes.pool.at(i)
      const mx = lerp(m.prevX, m.x, alpha)
      const my = lerp(m.prevY, m.y, alpha)
      // A slow pulse, phase-shifted by age, so a field of motes shimmers
      // instead of sitting there as flat dots.
      const pulse = 0.78 + Math.sin(time * 5 + m.age * 9) * 0.22
      moteGfx.circle(mx, my, 3.6 * pulse).fill({ color: palette.gold, alpha: 0.92 })
      moteGfx.circle(mx, my, 7 * pulse).fill({ color: palette.gold, alpha: 0.16 })
    }

    // --- equipment on the ground ---------------------------------------
    //
    // Drawn in the piece's own rung colour, which is the whole point: the
    // decision "is that worth crossing the field for" has to be answerable at
    // a glance, from across the screen, while something is chasing you.
    dropGfx.clear()
    for (let i = 0; i < drops.pool.size; i++) {
      const d = drops.pool.at(i)
      const dx = lerp(d.prevX, d.x, alpha)
      const dy = lerp(d.prevY, d.y, alpha)
      const tier = rarityOf(d.rarity as Rarity)
      // A shaft of light standing on the ground, with the piece as a mark at
      // its foot. It settles over the first third of a second so a drop reads
      // as having LANDED rather than having always been there.
      const settle = clamp01(d.age / 0.32)
      const rise = easing.outCubic(settle)
      const pulse = 0.86 + Math.sin(time * 3.4 + d.age * 5) * 0.14
      // The better the rung, the taller the shaft — a grey piece has barely
      // any, a gold one is visible across the field.
      //
      // FAINT, and it took a screenshot to see why. These numbers were tuned
      // when the piece itself was a small dark lozenge and the shaft was doing
      // all the work of being seen. The mark now carries a full plaque and a
      // coloured ring, so the old shaft — opaque, wide-footed — turned every
      // drop into a traffic cone standing on the field. Its job is now only
      // "there is something over there", read peripherally, so it is a hint of
      // colour in the air rather than an object in its own right.
      const height = (14 + d.rarity * 11) * rise
      const width = 3 + d.rarity
      const alphaTop = 0.02 + d.rarity * 0.014
      const alphaFoot = 0.05 + d.rarity * 0.026
      dropGfx
        .poly([
          dx - width, dy,
          dx + width, dy,
          dx + width * 0.45, dy - height,
          dx - width * 0.45, dy - height,
        ])
        .fill({ color: tier.colour, alpha: alphaTop * pulse })
      dropGfx
        .ellipse(dx, dy, (8 + d.rarity * 1.8) * pulse, (2.6 + d.rarity * 0.7) * pulse)
        .fill({ color: tier.colour, alpha: alphaFoot })
      // The piece itself — the plaque, the slot's silhouette, the rung's ring.
      // See render/dropMark.ts for why rarity is not allowed to touch any of
      // it except the ring's colour.
      drawDropMark(
        dropGfx,
        dx,
        dy,
        slotOnGround(d.id),
        tier.colour,
        rise,
        time,
        // Phased off the position, so a pile of three does not bob in unison
        // and read as one object.
        d.x * 0.07 + d.y * 0.11,
      )
    }

    // --- sword qi ------------------------------------------------------
    boltGfx.clear()
    for (let i = 0; i < bolts.pool.size; i++) {
      const b = bolts.pool.at(i)
      const bx = lerp(b.prevX, b.x, alpha)
      const by = lerp(b.prevY, b.y, alpha)
      const a = Math.atan2(b.vy, b.vx)
      // A THROWN BLADE is not sword qi, and it must not be drawn as it. Kind 1
      // is a dagger the player let go of: a small hard lozenge, tumbling. Kind
      // 0 is qi released from an art: a wide soft crescent. The `kind` field
      // was already being set at the fire site and read nowhere, which meant
      // the whole 飞刀 class was firing crescents — an ink game's way of saying
      // "you are still playing the swordsman".
      if (b.kind === 1) {
        // The tumble is derived from the bolt's own position rather than from
        // the clock, so a volley of three spins out of phase instead of three
        // blades turning in lockstep like a machine.
        const spin = a + (b.x * 0.06 + b.y * 0.05) + time * 13
        const cos = Math.cos(spin)
        const sin = Math.sin(spin)
        const px = -sin
        const py = cos
        boltGfx
          .poly([
            bx + cos * 9, by + sin * 9,
            bx + px * 2.1, by + py * 2.1,
            bx - cos * 4, by - sin * 4,
            bx - px * 2.1, by - py * 2.1,
          ])
          .fill({ color: palette.ink, alpha: 0.92 })
        continue
      }
      // Drawn as a short crescent aligned with travel — the same brush
      // vocabulary as the sweep, so the arts read as one hand.
      const pts: number[] = []
      const steps = 9
      for (let k = 0; k <= steps; k++) {
        const t = k / steps
        const spread = (t - 0.5) * 1.5
        const w = 13 * Math.sin(t * Math.PI)
        pts.push(bx + Math.cos(a + spread) * (16 + w * 0.5), by + Math.sin(a + spread) * (16 + w * 0.5))
      }
      for (let k = steps; k >= 0; k--) {
        const t = k / steps
        const spread = (t - 0.5) * 1.5
        const w = 13 * Math.sin(t * Math.PI)
        pts.push(bx + Math.cos(a + spread) * (16 - w * 0.5), by + Math.sin(a + spread) * (16 - w * 0.5))
      }
      boltGfx.poly(pts).fill({ color: palette.ink, alpha: 0.72 })
    }

    // --- guardian blades and thunder palm -------------------------------
    orbitGfx.clear()
    if (live.orbitBlades > 0) {
      const step = (Math.PI * 2) / live.orbitBlades
      for (let b = 0; b < live.orbitBlades; b++) {
        const a = run.orbitAngle + step * b
        const bx = wx + Math.cos(a) * ORBIT_RADIUS
        const by = wy + Math.sin(a) * ORBIT_RADIUS
        // Each blade is a small tapered mark tangent to its circle, so the set
        // reads as swords in flight rather than as beads on a string.
        const tangent = a + Math.PI / 2
        const tipX = Math.cos(tangent) * 15
        const tipY = Math.sin(tangent) * 15
        const perpX = Math.cos(a) * 3.4
        const perpY = Math.sin(a) * 3.4
        orbitGfx
          .poly([bx - tipX, by - tipY, bx + perpX, by + perpY, bx + tipX, by + tipY, bx - perpX, by - perpY])
          .fill({ color: palette.ink, alpha: 0.85 })
      }
    }
    if (run.novaVisual > 0) {
      const life = run.novaVisual / 0.42
      const r = run.novaVisualRadius * (1.06 - 0.28 * life)
      orbitGfx
        .circle(wx, wy, r)
        .stroke({ width: 3 + 7 * life, color: palette.gold, alpha: 0.55 * life })
    }

    // --- the dodge's wake ----------------------------------------------
    trailGfx.clear()
    if (dodge.trail.length > 0) {
      // Oldest is faintest. Drawn from the tail forward so the nearest ghost —
      // the one that reads as "you were just there" — sits over the older ones.
      for (let i = dodge.trail.length - 1; i >= 0; i--) {
        const ghost = dodge.trail[i]!
        const fade = (1 - i / dodge.trail.length) * 0.34
        // World coordinates, like `swordsman.x` — the camera is a transform on
        // the world container, so subtracting it here would apply it twice.
        const gx = ghost.x
        const gy = ghost.y
        for (const stroke of figure.body) {
          // Carved marks are holes in a solid figure; on a translucent ghost
          // they would punch paper-coloured gaps out of the ground behind it.
          if (stroke.part === 'cut') continue
          const pts: number[] = []
          for (let k = 0; k < stroke.poly.length; k += 2) {
            pts.push(gx + stroke.poly[k]!, gy + stroke.poly[k + 1]!)
          }
          trailGfx.poly(pts).fill({ color: palette.ink, alpha: fade * stroke.alpha })
        }
      }
    }

    // --- character -----------------------------------------------------
    swordsman.x = wx
    swordsman.y = wy + bob
    swordsman.rotation = clamp01(ratio) * (player.vx / live.moveSpeed) * 0.13

    // --- being hit ------------------------------------------------------
    // This was a 14 Hz square wave over the whole 0.85s immunity window: the
    // entire swordsman, blade and sash included, blinked on and off twelve
    // times per hit. Reported as "fica bugada visualmente e stutter", and that
    // reading is exactly right — a figure flickering at that rate is what a
    // broken sprite looks like, not what being hit looks like. It also fought
    // the one thing the player must not lose track of while hurt, which is
    // where they are.
    //
    // Two signals now, and both DECAY with the immunity that remains, so the
    // feedback answers "how much longer am I safe?" instead of just strobing:
    //
    //   the first fifth of a second is a cinnabar flash — the impact itself,
    //   short and unmissable, the same red the damage numbers use;
    //
    //   the rest is a soft shimmer that fades out with the window. It never
    //   drops below two thirds opacity, so the figure is legible throughout.
    const hurt = run.immunity > 0 ? run.immunity / HURT_IMMUNITY : 0
    if (hurt > 0) {
      const impact = Math.max(0, (hurt - 0.78) / 0.22)
      // From cinnabar back to no tint over that first fifth of a second.
      swordsman.tint = mixColor(0xffffff, palette.cinnabar, impact)
      swordsman.alpha = 1 - 0.3 * hurt * (0.5 + 0.5 * Math.sin(time * 34))
    } else {
      swordsman.tint = 0xffffff
      swordsman.alpha = 1
    }

    shadow.x = wx
    shadow.y = wy
    const lift = 1 - Math.abs(bob) / 2.6
    shadow.scale.set(0.88 + lift * 0.16)
    shadow.alpha = 0.7 + lift * 0.3

    const aimX = run.aimX
    const aimY = run.aimY
    bladeGfx.rotation = Math.atan2(aimY, aimX)
    bladeGfx.y = BLADE_PIVOT_Y
    // Foreshortening: a weapon pointed at or away from the camera covers less
    // ground on screen than one held across it. At 0.5 the shortening was too
    // deep for a weapon this long — a 斩马刀 aimed straight up collapsed to a
    // stub about as wide as it was tall, which reads as a different object
    // rather than as the same object turned. Two thirds is enough to sell the
    // turn and leaves the blade recognisable at every angle.
    bladeGfx.scale.x = 0.66 + 0.34 * Math.abs(aimX)
    bladeGfx.zIndex = aimY < 0 ? -1 : 2

    sashRng.snapshot = 1337
    const spine = sashSpine(figure.sashAnchor, time, -aimX, -aimY, ratio * live.moveSpeed, 1)
    const poly = sashPoly(spine, sashRng, 1)
    sashGfx.clear()
    // A null colour is a swordsman who wears no sash, and drawing nothing is
    // the honest reading of that — not a grey one.
    const sashColour = sashOf(character.look).colour
    if (poly.length >= 6 && sashColour !== null) {
      sashGfx.poly(poly).fill({ color: sashColour, alpha: 0.88 })
    }
    sashGfx.zIndex = -aimY > 0 ? 3 : -2

    // --- ground --------------------------------------------------------
    stage.ground.tileScale.set(zoom)
    stage.ground.tilePosition.x = -camera.x * zoom
    stage.ground.tilePosition.y = -camera.y * zoom

    // --- ui ------------------------------------------------------------
    ui.update(run.hp, live.maxHp, run.elapsed, run.kills, run.xp, xpForLevel(run.level), run.level)
    ui.setRift(run.riftValue, run.riftTarget)
    // `bar` IS what updateBar reads each frame, so the strip and the simulation
    // cannot disagree about what is in hand — the exact class of lie this
    // project keeps having to dig out.
    ui.setBar(bar, shi.value)
    ui.setPostures(sense.active)
    ui.setDodge(dodgeCharge(dodge))
    if (playing && run.over && !gameOverShown) {
      gameOverShown = true
      // The gate comes down FIRST, whatever route got here.
      //
      // This is where the bug lived: banking set `run.over` and left the gate
      // panel standing, so the reward screen rendered UNDERNEATH it and the
      // player — reading the same panel they had just tapped — concluded that
      // "Leave with it" did nothing. It was doing exactly what it said.
      //
      // Doing it here rather than only in the bank handler is the point. Every
      // route to the end screen passes through this line, so no future one can
      // reintroduce it; the handler that forgets is no longer able to be wrong.
      ui.hideGate()
      gateUp = false
      // Cleared before the end screen goes up, or the last banner of the run
      // sits on top of it — an "Insight 7" drawn straight through the seal,
      // which is what shipped in the first version of this screen.
      banners.clear()
      floaters.clear()
      feel.death()
      ui.showGameOver(settleExpedition(), openHub)
    }

    stickGfx.clear()
    if (playing && joystick.state.active && !run.over && !gateUp) {
      const s = joystick.state
      stickGfx
        .circle(s.originX, s.originY, 54)
        .stroke({ width: 1.5, color: palette.ink, alpha: 0.18 })
      stickGfx.circle(s.thumbX, s.thumbY, 20).fill({ color: palette.ink, alpha: 0.24 })
    }
  }

  const loop = new GameLoop({ update, render })
  loop.start()

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) loop.resetClock()
  })

  let hudTimer = 0
  const hudTick = (): void => {
    hudTimer++
    if (hudTimer % 20 === 0) {
      // The HUD carries the diagnosis, not just the frame rate.
      //
      // "It stutters on my phone" is not something anyone can act on, and this
      // machine cannot reproduce it: with no GPU it is fill-rate bound long
      // before it reaches the enemy density a real device sees. So the device
      // has to be able to report its own numbers, and they have to be legible
      // in a photograph of the screen — the same reason the renderer name and
      // the build string are already up there.
      //
      //   u  milliseconds of JavaScript in the simulation, per frame
      //   r  milliseconds of JavaScript building the frame, per frame
      //   ▲  the single worst frame in the last half second
      //
      // A high ▲ with low u and r means the pause is not in this code.
      const s = loop.stats
      hud.textContent =
        `${s.fps} fps · ${swarm.count}e · u${s.updateMs.toFixed(1)} r${s.renderMs.toFixed(1)} ` +
        `▲${s.worstFrameMs.toFixed(0)} · ${stage.rendererType} · ${BUILD}`
      // The hint must not bleed through the level-up cards, which sit exactly
      // where it is drawn.
      const showHint = playing && joystick.idleTime() > 3 && !run.over && !gateUp
      hint.style.opacity = showHint ? '0.55' : '0'
      // The harness needs to know which screen it is looking at: a screenshot
      // of the hub and a screenshot of a stalled boot are both "not the game".
      document.body.dataset.screen = title.visible
        ? 'title'
        : creator.visible
          ? 'create'
          : codex.visible
            ? 'codex'
            : hub.visible
              ? 'hub'
              : run.over
                ? 'over'
                : 'run'
      document.body.dataset.level = String(character.level)
      // Published so the screenshot harness can assert that a synthetic drag
      // actually moved the player. An invisible overlay once swallowed every
      // touch on the device while the game itself kept running perfectly, and
      // nothing in the pipeline noticed — a screenshot of a stationary
      // character looks identical to a screenshot of a moving one.
      // Pieces lying on the field, for the harness. A drop that never appears
      // and a drop that appears and is invisible look identical in a
      // screenshot, and only one of them is a rendering bug.
      document.body.dataset.drops = String(drops.count)
      document.body.dataset.found = String(foundThisRun.length)
      // The bar as the simulation holds it: how many slots are FILLED, how
      // many are LIVE this instant, and the whole 势 pool. This is the claim
      // unit tests cannot reach — they prove `updateBar` fires a slot, not that
      // a thumb on a joystick fills a pool that a button then spends.
      document.body.dataset.bar =
        `${bar.slots.filter((slot) => slot.skill).length}/` +
        `${bar.slots.filter((slot) => slot.live > 0).length}/` +
        `${shi.value.toFixed(2)}`
      document.body.dataset.worn = SLOTS.map((slot) => inSlot(slot)?.rarity ?? -1).join(',')
      // Which full-screen panels are up. Published because the bug they had
      // was invisible to every other check: banking left the gate standing on
      // top of the reward screen, and a screenshot of two stacked overlays
      // still looks like a screen. The harness asserts they are never both up.
      document.body.dataset.panels =
        `${gateUp ? 'gate' : ''}${gateUp && gameOverShown ? '+' : ''}${gameOverShown ? 'over' : ''}`
      document.body.dataset.px = String(Math.round(player.x))
      document.body.dataset.py = String(Math.round(player.y))
      // Which conditions hold, for the harness. The seals lighting on screen is
      // the feature; this is how a machine can assert that it happened, and the
      // unit tests cannot — they exercise the detector, not the wiring from a
      // thumb on a joystick through to a class on a tile.
      document.body.dataset.conditions = activeSeals(sense.active).join(',')
      // What the SKILLS are actually doing to the numbers, right now.
      //
      // The conditions lighting a tile was the last step's feature and it has
      // its own line above. This one exists because the failure this step can
      // have is quieter and worse: the seals light, the strip looks alive, and
      // the simulation reads the untouched baseline anyway. A machine can only
      // catch that by comparing a live stat against the permanent one, so both
      // are published. Rounded, because the harness compares strings.
      //
      // The baseline is published WITH 内力 folded in — a second copy of `live`
      // computed with an EMPTY bar — precisely so that a difference between the
      // two can only ever be a live skill. Publishing `stats` raw was enough
      // while a level-up did nothing to the numbers; now that a level adds flat
      // damage, a raw baseline would differ from `live` on every run past level
      // one and the check would pass without a single skill firing.
      //
      // Every channel a skill can move, not the seven the sweep uses. Several
      // of the fourteen effects (crit, echo, guard, heal) touch none of the
      // sweep numbers, so a build whose skills were any of those read as "no
      // stat moved" — the verifier reporting a working feature as broken,
      // which is worse than no verifier.
      const vector = (s: Stats): string =>
        `${s.slashDamage.toFixed(1)},${s.slashInterval.toFixed(3)},` +
        `${s.slashRange.toFixed(0)},${s.slashHalfAngle.toFixed(2)},` +
        `${s.moveSpeed.toFixed(0)},${s.orbitBlades},${s.boltInterval.toFixed(2)},` +
        `${s.critEvery},${s.echoDamage.toFixed(2)},${s.pushForce.toFixed(0)},` +
        `${s.damageScale.toFixed(2)},${s.healPerKill.toFixed(2)},${s.pickupRadius.toFixed(0)}`
      document.body.dataset.live = vector(live)
      applySkills(stats, EMPTY_BAR, resting, run.level)
      document.body.dataset.base = vector(resting)
      // Published so a performance report can be turned into a measurement.
      // "It stutters on my phone" is unactionable; "render costs 9ms with 240
      // enemies" points at one loop.
      document.body.dataset.perf = JSON.stringify({
        fps: loop.stats.fps,
        update: +loop.stats.updateMs.toFixed(2),
        render: +loop.stats.renderMs.toFixed(2),
        worst: +loop.stats.worstFrameMs.toFixed(1),
        enemies: swarm.count,
      })
    }
    requestAnimationFrame(hudTick)
  }
  hudTick()

  /**
   * The way in.
   *
   *   first launch:  title -> create -> codex -> hub
   *   returning:     title -> hub
   *
   * Opening straight on the hub was the previous behaviour and it was reported
   * as exactly what it was: a panel of attributes and roads with no name on it,
   * no premise, and no reason to care about a single number on the screen. A
   * management screen is a fine second impression and a poor first one.
   */
  /**
   * Opens character creation.
   *
   * Reached two ways, and the difference is one argument: on a first launch
   * there is nothing to go back to, so no way out is offered; from the hub
   * there is, so cancelling returns the existing swordsman untouched.
   */
  startCreation = (fromHub = true): void => {
    // Named for readability rather than reproducibility: this stream feeds
    // nothing the simulation depends on.
    const nameRng = new Rng((Date.now() ^ 0x9e3779b9) >>> 0)
    creator.show(
      () => nameRng.next(),
      (name, school, look) => {
        character = createCharacter(name, school.id, look)
        // Added to the roster rather than overwriting whoever was active. The
        // one case that replaces is an empty roster, which is a first launch or
        // the last swordsman having just been given up.
        if (roster.swordsmen.length === 0) {
          roster.swordsmen.push(character)
          roster.active = 0
        } else if (fromHub && roster.swordsmen.length < ROSTER_LIMIT) {
          roster.swordsmen.push(character)
          roster.active = roster.swordsmen.length - 1
        } else {
          // Full, or a first launch that somehow found a roster. Replacing the
          // active one is the only remaining honest outcome, and the hub does
          // not offer `+` at all once the roster is full.
          roster.swordsmen[roster.active] = character
        }
        character.spent = applySchool(school, character.spent)
        // The school's kit and weapon are handed over and worn, so the very
        // first expedition is fought with the weapon that was chosen rather
        // than with a default the player never picked.
        const weaponItem = ITEMS.find((i) => i.slot === 'weapon' && i.styleId === school.weaponId)
        // A starting piece does not roll — see starterInstance in meta/save.ts
        // for why the first genuinely rolled thing should be the first DROP.
        const kinds: AffixKind[] = ['body', 'swift', 'edge', 'edge']
        ;[...school.kit, weaponItem?.id].forEach((id, i) => {
          if (!id) return
          const entry: OwnedItem = {
            uid: mintUid(id),
            baseId: id,
            rarity: 0,
            affixes: [{ kind: kinds[i]!, amount: rollAmount(kinds[i]!, 1, 0.5) }],
            power: null,
            depth: 1,
          }
          acquire(character.inventory, entry)
          equip(character.inventory, entry.uid)
        })
        kit = currentKit()
        refreshKit()
        rebuildFigure()
        persist()
        creator.hide()
        // The codex lands here on a first launch, between choosing a swordsman
        // and first seeing the hub — after the player has something to care
        // about, and before they are shown numbers they have no frame for. A
        // returning player has read it, so they go straight through.
        if (fromHub) {
          openHub()
          return
        }
        codex.show(() => {
          codex.hide()
          openHub()
        })
      },
      fromHub
        ? () => {
            creator.hide()
            openHub()
          }
        : undefined,
    )
  }

  const enter = (): void => {
    title.show(isFirstLaunch ? null : character.name, () => {
      // THE FIRST REAL GESTURE IN THE SESSION, and the only place audio can be
      // started. A context created before a tap lands 'suspended' and stays
      // that way silently — the game would simply have no sound and nothing
      // would say why. See feel/sound.ts.
      unlockFeel()
      title.hide()
      if (!isFirstLaunch) {
        openHub()
        return
      }
      startCreation(false)
    },
    // Start over, from the one screen where somebody actually looks for it.
    // The same confirmation as the hub's — destructive, and it says so.
    () => confirmNewCharacter(),
    )
  }
  enter()

  const fadeStart = performance.now()
  const fade = (): void => {
    const t = Math.min(1, (performance.now() - fadeStart) / 620)
    bootScreen.style.opacity = String(1 - easing.outCubic(t))
    if (t < 1) requestAnimationFrame(fade)
    else bootScreen.classList.add('gone')
  }
  requestAnimationFrame(fade)

  document.body.dataset.ready = '1'
  await hideSplash()
}

// A watchdog independent of boot(): if the game hangs before ever reaching the
// hide call, the splash still comes down and whatever is on the webview —
// an error, a blank canvas — becomes visible and reportable.
setTimeout(() => void hideSplash(), 4000)

boot().catch((err) => {
  console.error(err)
  showFatal(err)
  void hideSplash()
})

window.addEventListener('error', (e) => showFatal(e.error ?? e.message))
window.addEventListener('unhandledrejection', (e) => showFatal(e.reason))
