/**
 * The swordsman, drawn as inline SVG for the DOM screens.
 *
 * This exists because the hub had a genuine hole in it: the game is drawn
 * entirely in ink silhouettes, the wardrobe can assemble nine hundred of them,
 * and the one screen where the player chooses their equipment did not draw the
 * character at all. It listed the items as text. So the whole visible half of a
 * loot game was invisible in the place it mattered most.
 *
 * The fix is cheap because the figure builders are pure geometry — they return
 * polygons, not draw calls. The same arrays Pixi batches into WebGL can be
 * written straight into `<polygon>` elements, which means:
 *
 *   - no second Pixi canvas competing with the game's renderer for context
 *   - no offscreen render target, no texture upload, no readback
 *   - it scales with the CSS around it, because it is vector
 *   - it works before the renderer has ever been initialised
 *
 * `tools/wardrobe.ts` writes the same polygons to a contact sheet. Both call
 * this, so the sheet and the game cannot drift apart.
 */
import { buildBlade, type FigureStroke } from './figure'
import { buildSwordsmanFront } from './portraitFigure'
import { allRankMarks } from './rankMarks'
import { hasVignette, regionVignette } from './regionArt'
import type { Slot } from '../data/items'
import { palette } from './palette'
import type { Gear } from './wardrobe'
import { bearingOf, buildOf, pigmentOf, sashOf, type Look } from '../meta/look'

const hex = (colour: number): string => `#${colour.toString(16).padStart(6, '0')}`

/** One stroke as an SVG polygon. Coordinates are trimmed — this goes in the DOM. */
export function strokeToPolygon(stroke: FigureStroke, colour: number, order?: number): string {
  const pts: string[] = []
  for (let i = 0; i < stroke.poly.length; i += 2) {
    pts.push(`${stroke.poly[i]!.toFixed(1)},${stroke.poly[i + 1]!.toFixed(1)}`)
  }
  // `order` turns the mark into one beat of the painting animation — see the
  // `paint` option. Absent, the polygon is static, which is what every sheet,
  // thumbnail and in-game draw wants.
  const brush = order === undefined ? '' : ` class="ps" style="--i:${order}"`
  return (
    `<polygon points="${pts.join(' ')}" fill="${hex(colour)}" ` +
    `fill-opacity="${stroke.alpha.toFixed(3)}"${brush}/>`
  )
}

export interface PortraitOptions {
  /**
   * Worn pieces and the rank each is held at, so the figure can wear its rank.
   *
   * Optional because most callers — a school card on the creation screen, a
   * roster thumbnail — are drawing a swordsman who owns nothing yet.
   */
  readonly ranked?: ReadonlyArray<{ slot: Slot; rank: number }>
  /** Height of the viewBox in figure units. Width is derived. */
  readonly box?: number
  /** Draw the blade beside the figure. */
  readonly blade?: boolean
  /** Ink colour. Defaults to the palette's. */
  readonly ink?: number
  /**
   * A region to stand the swordsman in, by id.
   *
   * This was the largest single finding of the art proposals, and the cheapest:
   * four treatments of the figure were rendered side by side and the one that
   * moved furthest was not a change to the figure at all — it was putting the
   * same figure somewhere. `regionArt.ts` had painted all five places since the
   * world tab was built and had never once been drawn behind a character.
   *
   * Optional because most callers want the figure alone: an item card, a
   * roster thumbnail, a contact sheet. A scene belongs where the swordsman is
   * the subject and the frame is big enough to hold both.
   */
  readonly region?: string
  /**
   * Brush the figure on, mark by mark, instead of showing it finished.
   *
   * The one thing this game can do that no character screen elsewhere can. The
   * whole renderer is brush strokes laid in a deliberate order — legs, robe,
   * collar, shoulders, sleeves, hair, neck, head, hat, blade — because that is
   * the order a painter works in, from the mass underneath to the detail on
   * top. Nothing has ever seen that order except the code.
   *
   * Revealing it turns character creation from filling in a form into watching
   * a swordsman being painted, and every later choice re-brushes them. It costs
   * one CSS animation and no new geometry, because the order was already there.
   */
  readonly paint?: boolean
  /**
   * Paint the figure in three values instead of one flat black.
   *
   * The other half of the direction that was chosen: the wide bleed pass under
   * every mark becomes a paper shadow, the robe drops to a mid grey with its
   * own darker wash beneath it, and full ink is kept for what has to read from
   * across a room — head, hands, blade.
   *
   * The order of those values matters more than the values. A first attempt
   * left head and arms at full black against a grey robe and they read as limbs
   * loose around a barrel; giving the robe its own shadow underneath is what
   * gives it volume and puts the limbs back on the body.
   *
   * It also lets the swordsman sit IN a painting rather than on top of one: a
   * pure black cut-out over an ink wash is a sticker, and this screen's whole
   * argument is that the character belongs to the picture.
   */
  readonly wash?: boolean
  /**
   * Ground colour, for carved marks. Defaults to the palette's paper.
   *
   * A cut is only a hole if it is painted the colour of what is behind it, so
   * anything drawing this portrait on a different ground has to say so — on the
   * title screen's dark panel the default would punch paper-coloured holes.
   */
  readonly ground?: number
  /**
   * Extra units of sky above the figure, widening nothing.
   *
   * A weapon needs VERTICAL room, and `box` buys both dimensions at once: it
   * sets the viewBox's height and, through `half`, its width. Growing it to fit
   * a longer 斩马刀 therefore also grew the card sideways, and since the portrait
   * is fitted into a fixed CSS box, the extra width shrank the whole drawing —
   * paying for a bigger sword with a smaller swordsman.
   *
   * This adds height alone. The figure loses a little scale, the weapon gains a
   * lot, and nothing about the composition's width changes.
   */
  readonly lift?: number
}

/**
 * A standing portrait of one swordsman, as a complete `<svg>` string.
 *
 * The viewBox is in figure units with the origin at the feet, so the caller
 * sizes it purely with CSS and never has to know the geometry's scale.
 */
/**
 * How the weapon is carried in a portrait: steep, nearly upright.
 *
 * At the old 62° the blade lay ACROSS the body and the haft crossed the skirt,
 * which is how somebody walking carries a weapon, not how a portrait shows one.
 * Held close to upright it stands beside the swordsman with its whole length
 * legible, which is the one thing a portrait of a class has to do.
 */
const BLADE_ANGLE = -78
const rad = (deg: number): number => (deg * Math.PI) / 180
const BLADE_COS = Math.cos(rad(BLADE_ANGLE))
const BLADE_SIN = Math.sin(rad(BLADE_ANGLE))

/** Where the leading fist closes on the haft, as a fraction back from the guard. */
const LEAD_HAND = 0.22
/** How far down the haft the off hand sits, from the leading one. */
const HAND_SPACING = 0.5

/**
 * How much the weapon is foreshortened so it fits the card.
 *
 * Derived from the headroom the box actually has above the fist rather than
 * from a constant. It WAS a constant — 52 — tuned when the hand sat eleven
 * units off the ground; the front elevation puts the fist at hip height on a
 * figure half again as tall, and the same 52 sent a zhanmadao's point out
 * through the top of the card.
 *
 * Only what is ABOVE the leading hand competes for that room, and getting that
 * wrong is what kept the 斩马刀 small. The first version budgeted `reach + grip`,
 * as though the haft stood up through the blade's space; it does not — it hangs
 * below the fist, toward the hem, where there is room to spare. Counting only
 * the blade plus the stub of haft above the leading hand gives the same card a
 * quarter more steel, which is the difference between a heavy weapon and a
 * picture of one.
 */
function bladeFit(gear: Gear, box: number, lift: number, handY: number): number {
  const grip = gear.blade.grip ?? 0
  // Two units of air, so the bleed around the point does not touch the edge.
  const headroom = box + lift - 8 + handY - 2
  const above = gear.blade.reach + grip * LEAD_HAND
  return Math.min(1, headroom / Math.abs(BLADE_SIN) / above)
}

export function portraitSvg(gear: Gear, look: Look, options: PortraitOptions = {}): string {
  const {
    box = 78,
    blade = true,
    ink = palette.ink,
    ground = palette.paper,
    ranked,
    region,
    paint = false,
    wash = false,
    lift = 0,
  } = options
  const build = buildOf(look).width
  const sash = sashOf(look)
  const bearing = bearingOf(look)
  // Null means undyed cloth, which stays ink — the default, and still the most
  // common thing a swordsman on this road is wearing.
  const dye = pigmentOf(look).colour

  // The viewBox does the sizing, so the geometry stays in its native units and
  // the brush jitter keeps the proportion it was tuned at.
  //
  // A FRONT ELEVATION, not the figure the game draws. This screen used to call
  // `buildSwordsmanTopDown` — the overhead sprite — and blow it up to 236px,
  // which is why the head read as a floating disc and the shoulders as two
  // lobes: those are the correct shapes for a camera looking DOWN, and the
  // portrait presents them as though it were at eye level. No amount of
  // contrast, filtering or washing fixes a drawing seen from the wrong angle,
  // and several turns were spent proving that the hard way. See portraitFigure.
  //
  // The posed grip: chest height, out to the sword side. Fixed rather than
  // derived, because it is a POSE — the point of it is that it is the same in
  // every portrait, so two swordsmen can be compared without their stances
  // being one more thing that differs.
  //
  // A two-handed weapon is held LOW and near the centre line, because that is
  // both how a 斩马刀 is actually rested and what buys it its size: the haft then
  // runs down toward the hem instead of up through the space the blade needs.
  const twoHanded = blade && gear.blade.twoHanded === true
  // OUTBOARD of the robe, at chest height, for both holds.
  //
  // The two-handed grip was tried at the centre line first, where a pair of
  // hands most naturally meets. It cannot go there. A silhouette has no
  // interior, so a black weapon in front of a black robe is described by its
  // outline and nothing else — and an outline is a mark this art direction
  // does not own. Reserving a hairline of paper around the haft to rescue it
  // only made that explicit: an outlined tube with a flanged end and two rings
  // on it reads as a syringe, which is exactly what it looked like.
  //
  // So the weapon stays clear of the body and the ARM does the crossing
  // instead. That trade is worth taking: an arm that disappears behind a robe
  // reads as an arm behind a robe, while a weapon that disappears is the
  // subject of the picture going missing.
  const grip = blade ? (twoHanded ? { x: 14, y: -40 } : { x: 15, y: -30 }) : undefined
  // The second fist, further down the same haft. Derived from the weapon's own
  // angle and grip length rather than placed by eye, so a longer haft spreads
  // the hands further apart instead of leaving one of them in mid-air.
  const off =
    twoHanded && grip
      ? (() => {
          const g = gear.blade.grip ?? 0
          const back = g * HAND_SPACING * bladeFit(gear, box, lift, grip.y)
          return { x: grip.x - back * BLADE_COS, y: grip.y - back * BLADE_SIN }
        })()
      : undefined
  const figure = buildSwordsmanFront(look.seed, gear, build, bearing, grip, off)

  const parts: string[] = []
  /** The beat each mark lands on, when `paint` is set. */
  let beat = 0
  const next = (): number | undefined => (paint ? beat++ : undefined)

  if (paint) {
    // Inside the SVG rather than in the stylesheet, so a portrait carries its
    // own animation wherever it is dropped — the creation screen, a sheet, a
    // mockup — and nothing has to remember to import a rule for it.
    //
    // `opacity` and not `fill-opacity`: every mark already carries its own
    // fill-opacity, which is the ink's weight and must survive. Element opacity
    // multiplies on top of it, so the mark fades in TO the weight it was
    // authored at instead of to full black.
    parts.push(
      `<style>` +
        `@keyframes ps-in{from{opacity:0;transform:translateY(2px)}to{opacity:1;transform:none}}` +
        `.ps{opacity:0;animation:ps-in .3s cubic-bezier(.2,.7,.3,1) both;` +
        `animation-delay:calc(var(--i) * 13ms);transform-box:fill-box;transform-origin:50% 100%}` +
        // A player who has asked the system not to animate gets the finished
        // painting, immediately. The reveal is a flourish; the figure is the
        // information, and information is never withheld for an effect.
        `@media (prefers-reduced-motion:reduce){.ps{opacity:1;animation:none}}` +
        `</style>`,
    )
  }

  // The place, first and faintest, behind everything including the shadow.
  // Held back to about two thirds so it stays a setting: at full strength the
  // milestones and the ruin compete with the figure, and the figure is what
  // this drawing is of.
  if (region !== undefined && hasVignette(region)) {
    const half = box * 0.46
    // A NESTED SVG WITH ITS OWN VIEWBOX, cropped rather than squashed. The
    // vignettes are composed for a tall frame — the world tab's — and a portrait
    // box is nearly square, so scaling one into the other stretched the mist
    // bands into saucers and opened the road to the full width. `slice` keeps
    // the composition's proportions and trims what does not fit, which is what
    // a crop is and what a squash never is.
    parts.push(
      `<svg x="${-half}" y="${-box + 8}" width="${half * 2}" height="${box}" ` +
        `viewBox="0 0 300 440" preserveAspectRatio="xMidYMax slice" opacity="0.6">` +
        regionVignette(region, { w: 300, h: 440 }, 0x51a7) +
        `</svg>`,
    )
  }

  // Ground shadow, first and underneath. One ellipse, and it does a surprising
  // amount of work: without it the figure floats, and a floating silhouette
  // reads as a sticker rather than as somebody standing.
  parts.push(
    `<ellipse cx="0" cy="2" rx="${(13 * build).toFixed(1)}" ry="3.4" ` +
      `fill="${hex(ink)}" fill-opacity="0.1"/>`,
  )

  if (sash.colour !== null) {
    // BEHIND the body, deliberately. In play the sash flips in front or behind
    // depending on which way the swordsman faces; a portrait has one pose, and
    // a ribbon draped over the chest reads as a strap rather than as cloth tied
    // at the back. Drawn as a curve rather than run through the game's cloth
    // simulation, because that simulation trails from velocity and wind — at a
    // standstill it hangs dead straight, which looks like a bug.
    //
    // It hangs from the waist knot and past the hem, and it is measured off the
    // figure's OWN hem rather than written down. The numbers here were tuned
    // against the overhead figure, which is half again shorter and much wider
    // at the skirt; on the front elevation the same curve fell entirely inside
    // the robe and only its outermost bulge escaped, so the one part of it the
    // eye could find was a red lump at the hip. Reported, correctly, as looking
    // like a wound rather than a ribbon.
    //
    // Clearing the hem is the whole trick: a ribbon is only legible where it is
    // NOT in front of cloth of another colour, so the tail has to swing wide of
    // the skirt and the length has to come from where the skirt actually ends.
    const a = figure.sashAnchor
    const hem = figure.anchors.hem
    const out = -(hem.halfWidth + 3.5 * build)
    const drop = hem.y - a.y
    parts.push(
      `<path d="M ${a.x.toFixed(1)} ${a.y.toFixed(1)} ` +
        `C ${(a.x - 2 * build).toFixed(1)} ${(a.y + drop * 0.3).toFixed(1)}, ` +
        `${(out * 0.75).toFixed(1)} ${(a.y + drop * 0.55).toFixed(1)}, ` +
        `${out.toFixed(1)} ${(a.y + drop * 0.86).toFixed(1)}" ` +
        `fill="none" stroke="${hex(sash.colour)}" stroke-width="${(2.6 * build).toFixed(1)}" ` +
        `stroke-linecap="round" stroke-opacity="0.9"/>`,
    )
  }

  // The robe takes the dye, a cut takes the ground, and every other mark stays
  // ink. That split is the whole of "colour without losing the silhouette" —
  // the head, the shoulders and the blade still read black against paper no
  // matter what the robe is dyed.
  const inkOf = (stroke: FigureStroke): number =>
    stroke.part === 'cut'
      ? ground
      : stroke.part === 'robe'
        ? // A dyed robe keeps its dye — the pigment IS the mid value, and
          // washing it grey would delete a choice the player made. Undyed cloth
          // takes the soft ink instead of the hard one, which is what turns a
          // flat silhouette into a figure with a lit side.
          (dye ?? (wash ? palette.inkSoft : ink))
        : ink
  const alphaOf = (stroke: FigureStroke): number =>
    wash && stroke.part === 'robe' && dye === null ? stroke.alpha * 0.74 : stroke.alpha
  // The bleed and the solid pass of one mark share a beat: they are the same
  // brush touching the paper once, and separating them made the figure appear
  // twice, faintly and then properly.
  const bleedCount = figure.bleed.length
  figure.bleed.forEach((stroke, i) =>
    parts.push(
      strokeToPolygon(
        // The bleed becomes a cast shadow on the paper rather than a halo of
        // the same ink. Same geometry, different job.
        wash ? { ...stroke, alpha: stroke.alpha * 2.6 } : stroke,
        wash && stroke.part !== 'cut' ? palette.paperShadow : inkOf(stroke),
        paint ? i : undefined,
      ),
    ),
  )
  if (wash) {
    // The robe again, darker, under itself. This second pass is what gives the
    // cloth volume without giving it any detail — and detail is the one thing
    // this art direction cannot afford.
    for (const stroke of figure.body) {
      if (stroke.part !== 'robe') continue
      parts.push(strokeToPolygon({ ...stroke, alpha: stroke.alpha * 0.34 }, ink))
    }
  }
  figure.body.forEach((stroke, i) =>
    parts.push(
      strokeToPolygon(
        { ...stroke, alpha: alphaOf(stroke) },
        inkOf(stroke),
        paint ? Math.min(i, bleedCount - 1) : undefined,
      ),
    ),
  )
  beat = Math.max(bleedCount, figure.body.length)

  // Rank, worn where it can be seen — over the body, because a hem lies on top
  // of the cloth it belongs to. Gold rather than ink: it is the one thing on
  // the figure that is not a garment, and it has to survive being drawn on a
  // robe that may itself be dyed.
  if (ranked && ranked.length > 0) {
    for (const stroke of allRankMarks(ranked, figure, 1, look.seed)) {
      parts.push(strokeToPolygon(stroke, palette.gold))
    }
  }

  if (blade) {
    // Held at the side, tip toward the ground — the way a sword is carried when
    // nobody is being cut. The first attempt left it floating clear of the
    // figure at shoulder height, which read as a stray brush mark rather than a
    // weapon; it now hangs from the hand the figure actually has, and is drawn
    // over the body so the grip reads as in front of the robe rather than
    // buried in it.
    // TWO fists on the haft when the weapon is held in both hands — which is
    // what `hands` has always documented for a 斩马刀, and what it was never set
    // to. They are not redundant with the figure's own posed hands: those are
    // drawn with the body, UNDER the weapon, and on a black robe under a black
    // weapon nothing of them survives. Removing the fists and trusting the
    // arms produced the worst version of this — a bare outlined tube with a
    // flange on the end, holding nothing, which reads as a torch.
    const marks = buildBlade(
      look.seed + 1,
      1,
      twoHanded ? { ...gear.blade, hands: 2 } : gear.blade,
    )
    const hand = figure.hand
    // Raised, not lowered. The hand sits about eleven units off the ground, so
    // a forty-unit blade pointed down leaves the frame before it leaves the
    // body — which is exactly what the first version did.
    //
    // Long weapons are then foreshortened to fit. A spear is nearly twice the
    // figure's height, and a box that contained it would shrink the swordsman
    // to a third of the card; drawing it at 0.6 keeps it reading as the longest
    // and thinnest thing in the wardrobe, which is the distinction that
    // matters, at the cost of its literal length. This is a portrait, and
    // portraits foreshorten.
    // The WHOLE weapon has to fit, haft included. Fitting on `reach` alone put
    // a two-handed sword's grip through the figure's knees and off the bottom
    // of the card, because the grip runs behind the hand and was not in the sum.
    const grip = gear.blade.grip ?? 0
    const fit = bladeFit(gear, box, lift, hand.y)
    // Steep — nearly vertical rather than the old 62°. At a shallower angle the
    // blade lay ACROSS the body and the haft crossed the skirt, which is how a
    // weapon is carried by somebody walking, not how it is shown in a portrait.
    // Held close to upright it stands beside the swordsman and its whole length
    // is legible, which is the one thing a portrait of a class has to do.
    // Slid ALONG the weapon's own axis, not sideways. The offset used to be on
    // the local y, which after the rotation runs across the blade — so the
    // whole sword drifted off to one side of the fist and read as planted in
    // the ground next to somebody rather than held. Moving along local x puts
    // the grip in the hand and lifts the pommel off the floor, which is where
    // a pommel belongs on a weapon that is being carried.
    parts.push(
      `<g transform="translate(${hand.x.toFixed(1)},${hand.y.toFixed(1)}) ` +
        `rotate(${BLADE_ANGLE}) scale(${fit.toFixed(3)}) ` +
        `translate(${(grip * LEAD_HAND).toFixed(1)},2)">`,
    )
    // A carved mark on the weapon takes the GROUND, like one on the body: the
    // gap between the two fists is a hole, and drawing it in ink would fill the
    // one thing that separates them.
    // The weapon last, and it is the right last mark: it is the only thing on
    // the figure that is not the person, and a painter signs off with it.
    const beats = marks.map(() => next())

    for (const [i, stroke] of marks.entries()) {
      parts.push(strokeToPolygon(stroke, stroke.part === 'cut' ? ground : ink, beats[i]))
    }
    parts.push('</g>')
  }

  // Wider than tall in ratio terms, because a lowered blade reaches further to
  // the side than the figure does and a tighter box clipped its tip.
  const half = box * 0.46
  return (
    `<svg class="portrait-svg" viewBox="${-half} ${-box + 8 - lift} ${half * 2} ${box + lift}" ` +
    `preserveAspectRatio="xMidYMax meet" aria-hidden="true">${parts.join('')}</svg>`
  )
}
