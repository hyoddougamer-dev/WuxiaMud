/**
 * Floating damage numbers.
 *
 * This exists for one reported problem, stated by the player in those words:
 * they could not tell what was happening. The build had exactly one piece of
 * hit feedback — a struck enemy washed briefly toward cinnabar — so a sweep
 * that killed four and a sweep that killed none looked nearly identical, and
 * whether a technique had improved anything was unknowable except by watching
 * the clock. A number over a body answers all of that instantly and is the
 * cheapest legibility fix in the genre.
 *
 * Two implementation notes that matter more than they look:
 *
 * 1. BitmapText, not Text. Pixi rasterises a `Text` whenever its string
 *    changes, and this system changes twenty strings a second. A bitmap font is
 *    rasterised once into an atlas and every number after that is a handful of
 *    quads.
 * 2. A fixed pool that saturates rather than growing. In a shockwave that
 *    catches fifty enemies at once, fifty numbers is not information, it is a
 *    wall — so the pool caps out and the excess is silently dropped. Player
 *    damage is the exception and may evict the oldest entry, because the one
 *    number that must never be lost is the one explaining why you are dying.
 */
import { BitmapFont, BitmapText, Container } from 'pixi.js'
import { palette } from './palette'

/** Simultaneous numbers. Past this it stops being readable anyway. */
const CAPACITY = 40

const FONT = 'jianying-num'

/** Seconds a number stays on screen. Short: it is a glance, not a readout. */
const LIFE = 0.62
const HURT_LIFE = 1.05

/** World units per second the number drifts upward. */
const RISE = 46

export interface Floaters {
  /** Damage dealt to an enemy at a world position. */
  hit(x: number, y: number, amount: number, killed: boolean, crit?: boolean): void
  /** Damage taken by the player. Always finds a slot. */
  hurt(x: number, y: number, amount: number): void
  /** A mark where equipment dropped. Always finds a slot. */
  found(x: number, y: number): void
  /** Health mended by an art. Always finds a slot — see `mend` below. */
  mend(x: number, y: number, amount: number): void
  update(dt: number): void
  clear(): void
  readonly view: Container
}

interface Slot {
  text: BitmapText
  life: number
  maxLife: number
  x: number
  y: number
  vx: number
  scale: number
  /** Ordering key for eviction; larger is newer. */
  born: number
}

/**
 * Installs the atlas. Called once — the digit set is fixed, so the whole font
 * is a single small texture and no glyph is ever rasterised again.
 */
function installFont(): void {
  BitmapFont.install({
    name: FONT,
    style: {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: 44,
      fontWeight: 'bold',
      fill: 0xffffff,
    },
    // Digits and the minus sign, nothing else. Tinting handles colour, so the
    // atlas stays one small texture regardless of how many colours appear.
    chars: [['0', '9'], '-', '!'],
    resolution: 2,
  })
}

let installed = false

export function createFloaters(): Floaters {
  if (!installed) {
    installFont()
    installed = true
  }

  const view = new Container()
  // Above the crowd but below the HUD: a number hidden behind a body is worse
  // than no number, since the player looks for it and finds nothing.
  view.zIndex = 6

  const slots: Slot[] = []
  for (let i = 0; i < CAPACITY; i++) {
    const text = new BitmapText({ text: '', style: { fontFamily: FONT, fontSize: 44 } })
    text.anchor.set(0.5, 0.5)
    text.visible = false
    view.addChild(text)
    slots.push({ text, life: 0, maxLife: LIFE, x: 0, y: 0, vx: 0, scale: 1, born: 0 })
  }

  let clock = 0

  /** Finds a free slot, or the oldest one when `evict` is set. */
  const take = (evict: boolean): Slot | null => {
    for (const slot of slots) if (slot.life <= 0) return slot
    if (!evict) return null
    let oldest = slots[0]!
    for (const slot of slots) if (slot.born < oldest.born) oldest = slot
    return oldest
  }

  const start = (
    slot: Slot,
    label: string,
    x: number,
    y: number,
    colour: number,
    scale: number,
    maxLife: number,
  ): void => {
    clock++
    slot.text.text = label
    slot.text.tint = colour
    slot.text.visible = true
    slot.life = maxLife
    slot.maxLife = maxLife
    slot.x = x
    slot.y = y
    // A little horizontal drift, alternating by birth order, so two numbers
    // spawned on the same body do not stack into an unreadable smear.
    slot.vx = (clock % 2 === 0 ? 1 : -1) * (8 + (clock % 5) * 3)
    slot.scale = scale
    slot.born = clock
  }

  return {
    view,

    hit(x, y, amount, killed, crit) {
      const slot = take(false)
      if (!slot) return
      // Rounded, because a player reading "13" learns the same thing as one
      // reading "12.87" and can do it in half the time.
      const label = String(Math.max(1, Math.round(amount)))
      start(
        slot,
        label,
        x,
        // Lifted well clear of the body. The first pass put the number at the
        // enemy's own position, where a dark glyph sat on a dark silhouette and
        // was effectively invisible — the exact failure this system exists to
        // fix.
        y - 30,
        // Three colours, three meanings, and they never overlap:
        //   ink      damage you are dealing
        //   gold     something died, and dropped qi for it
        //   cinnabar damage to you  (see `hurt` below)
        // Colouring a kill cinnabar would have been the obvious choice and the
        // wrong one — the same red would then mean both "you won" and "you are
        // losing", which is precisely the ambiguity this system removes.
        killed ? palette.goldDeep : palette.ink,
        // A doubled blow has to LOOK doubled. 锐 crit fires on a counted sweep
        // rather than a roll, so it is a reliable, readable beat — and until
        // now the only thing that changed on screen was a larger number, which
        // a player cannot tell apart from having hit a tougher enemy. Size is
        // the channel, not colour: the palette's three meanings already carry
        // "dealing", "killed" and "taking", and a fourth hue would blunt all
        // of them.
        (crit ? 1.55 : 1) * (killed ? 0.42 : 0.32),
        LIFE,
      )
    },

    hurt(x, y, amount) {
      const slot = take(true)
      if (!slot) return
      start(slot, `-${Math.round(amount)}`, x, y - 40, palette.cinnabar, 0.5, HURT_LIFE)
    },

    mend(x, y, amount) {
      // 血 mends a sliver on a kill, and did it completely silently — the bar
      // simply moved while the player was watching the fight, not the HUD. It
      // may always evict a damage number: knowing you are being kept alive is
      // worth more than one more figure in a stream of them.
      const slot = take(true)
      if (!slot) return
      start(slot, `+${Math.round(amount)}`, x, y - 46, palette.jade, 0.46, HURT_LIFE)
    },

    found(x, y) {
      // Loot is rare enough that it may always evict: missing the one mark that
      // says something dropped is worse than losing a damage number.
      const slot = take(true)
      if (!slot) return
      start(slot, '!', x, y - 34, palette.goldDeep, 0.55, HURT_LIFE)
    },

    update(dt) {
      for (const slot of slots) {
        if (slot.life <= 0) continue
        slot.life -= dt
        if (slot.life <= 0) {
          slot.text.visible = false
          continue
        }
        const t = slot.life / slot.maxLife
        slot.y -= RISE * dt * t
        slot.x += slot.vx * dt * t
        slot.text.x = slot.x
        slot.text.y = slot.y
        // Full opacity for the first two thirds, then out. Fading from the
        // first frame — the original behaviour — made every number look like a
        // watermark at exactly the moment it most needed to be read.
        slot.text.alpha = t > 0.4 ? 1 : t / 0.4
        // A brief pop on arrival, easing out — the same squash-and-stretch
        // vocabulary the rest of the game uses for impact.
        const pop = t > 0.82 ? 1 + (t - 0.82) * 1.6 : 1
        slot.text.scale.set(slot.scale * pop)
      }
    },

    clear() {
      for (const slot of slots) {
        slot.life = 0
        slot.text.visible = false
      }
    },
  }
}
