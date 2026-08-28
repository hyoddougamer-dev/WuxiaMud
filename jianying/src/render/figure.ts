/**
 * The swordsman, assembled from brush strokes.
 *
 * Nothing here has interior detail — it is a silhouette, and the readability
 * that buys is the whole reason the art direction was chosen.
 *
 * Every mark is emitted twice: a wide, faint "bleed" pass underneath and the
 * solid stroke on top. That pair is what sells ink soaking into paper; a single
 * hard-edged fill reads as a vector shape no matter how good its outline is.
 */
import { Rng } from '../core/rng'
import { bowedSpine, calligraphic, elliptic, sweep, tapered, type Point, type WidthProfile } from './ink'
import { DEFAULT_GEAR, type BladeStyle, type Gear } from './wardrobe'

export interface FigureStroke {
  poly: number[]
  alpha: number
  /**
   * What this mark is, for the two cases where ink is the wrong colour.
   *
   * `robe` takes the PIGMENT while everything else stays ink. That is not a
   * compromise on the art direction, it is how ink-and-colour painting has
   * always worked: 墨 for the line and the mass, mineral colour for the wash
   * inside it. Without the tag the only options were an entirely black figure
   * or an entirely coloured one, and both are wrong.
   *
   * `cut` is drawn in PAPER, over the marks below it. It is how a silhouette
   * gets interior structure without gaining interior detail: the collar of a
   * 交领 robe is not a line drawn on the chest, it is the paper showing through
   * where the two panels cross. Carving is the only tool available — a figure
   * with no interior can still have holes in it.
   */
  part?: 'robe' | 'cut'
}

/** Widens a profile by a constant, for the bleed pass. */
const widen =
  (profile: WidthProfile, by: number): WidthProfile =>
  (t) =>
    profile(t) + by

export interface Swordsman {
  /** Faint wide pass, drawn first. */
  bleed: FigureStroke[]
  /** Solid pass, drawn over the bleed. */
  body: FigureStroke[]
  /** Where the sash attaches, in local space. */
  sashAnchor: Point
  /** The sword hand, in local space. A portrait hangs the blade off it. */
  hand: Point
  /** Where the blade's tip sits at rest, for trail effects. */
  bladeTip: Point
  height: number
}

/**
 * The swordsman seen from a three-quarter overhead camera, facing the viewer.
 *
 * Local space: origin at the feet, ~44 units tall — shorter than the side
 * profile because an overhead camera foreshortens height. The character is
 * symmetric and never mirrors, which is the point: in a side profile, turning
 * left-to-right had to flip scale.x through zero, and that flip visibly
 * squashed the figure flat on every direction change.
 *
 * The sword is NOT part of this geometry. It is drawn separately so it can
 * rotate freely around the body to point wherever the player is heading, which
 * a baked-in arm cannot do across eight directions.
 *
 * Every measurement below comes from `gear` rather than being written into the
 * function. That is what makes equipment visible: a robe is not a picture laid
 * over the character, it is where the robe's spine goes, so a longer hem really
 * is a longer silhouette. See render/wardrobe.ts.
 */
export function buildSwordsmanTopDown(
  seed = 1,
  scale = 1,
  gear: Gear = DEFAULT_GEAR,
  build = 1,
  bearing: {
    shoulders: number
    hem: number
    hair: number
    waist: number
    cinch: number
    sleeve: number
  } = { shoulders: 1, hem: 1, hair: 0, waist: 0.42, cinch: 1.1, sleeve: 1 },
): Swordsman {
  const rng = new Rng(seed)
  const s = scale
  const body: FigureStroke[] = []
  const bleed: FigureStroke[] = []

  const mark = (
    from: Point,
    to: Point,
    bow: number,
    width: WidthProfile,
    opts: { alpha?: number; segments?: number; jitter?: number; bleedBy?: number } = {},
  ): void => {
    // bleedBy was 1.5 and alpha 0.16, which produced a soft grey halo around
    // everything — a glow, not ink. Tighter and darker reads as the paper
    // drinking the edge of a stroke, which is the effect this is imitating.
    const { alpha = 1, segments = 22, jitter = 0.85 * s, bleedBy = 1.0 * s } = opts
    const spine = bowedSpine(from, to, bow, segments)
    // Paper never bleeds. A carved mark with a soft halo would put a grey ring
    // around the collar, which is the one place a smudge reads as a mistake.
    if (bleedBy > 0 && tag.part !== 'cut') {
      const bleedPoly = sweep(spine, widen(width, bleedBy), rng, jitter * 0.4)
      if (bleedPoly.length >= 6) bleed.push({ poly: bleedPoly, alpha: alpha * 0.15, ...tag })
    }
    const poly = sweep(spine, width, rng, jitter)
    if (poly.length >= 6) body.push({ poly, alpha, ...tag })
  }

  // Set around the robe marks below and cleared afterwards, so the tag is
  // written once per garment rather than passed to twenty call sites.
  let tag: { part?: 'robe' | 'cut' } = {}

  const { robe, shoulders, head } = gear

  // Where the body's joints sit. Named rather than sprinkled through the marks
  // below, because the head, the neck, the collar and every hat share them: the
  // head used to be pinned at -40 in six separate places, so lowering it meant
  // finding all six.
  const shoulderY = -30 * s
  const headY = -41.5 * s
  // Never below the shoulder bar: a lower collar left a paper sliver across
  // the chest that read as a slash.
  const robeTop = Math.min(robe.top, shoulderY / s + 1)
  const waistY = robeTop + (robe.bottom - robeTop) * bearing.waist
  const waistWidth = robe.topWidth * bearing.cinch
  const hemWidth = robe.hemWidth * bearing.hem

  // ---- Legs -------------------------------------------------------------
  // Drawn first, so the robe falls over them and only what the hem clears is
  // ever seen. That is the point: a travelling coat cut to mid-calf now shows
  // boots under it and a court robe does not, from the same geometry. Before
  // this every figure went to the floor as one mass, which is what made them
  // all read as bells no matter what the hem did.
  for (const side of [-1, 1]) {
    mark(
      { x: side * 3.4 * s, y: -16 * s },
      { x: side * 3.2 * s, y: -1.2 * s },
      0,
      calligraphic(5.4 * s, 0.9, 0.55),
      { alpha: 0.95, segments: 12, jitter: 0.45 * s, bleedBy: 0.6 * s },
    )
    // A foot: short, flat, and pointing away from the centre line. Without it
    // the legs end in mid-air and the figure hovers.
    mark(
      { x: side * 1.6 * s, y: -1.4 * s },
      { x: side * 7 * s, y: -0.5 * s },
      0.8 * s,
      elliptic(2.5 * s),
      { alpha: 0.95, segments: 10, jitter: 0.25 * s, bleedBy: 0.5 * s },
    )
  }

  // ---- Robe -------------------------------------------------------------
  // Seen from above the hem reads as a skirt spreading toward the camera, so
  // the flare is stronger and the whole shape shorter than in profile.
  tag = { part: 'robe' }

  // TWO strokes, not one, and this is the change that turned the figure from a
  // shape into a person. It used to be a single sweep from collar to hem with a
  // straight width ramp — which is a bell. A bell has no waist, so it has no
  // posture, no sex and nothing for armour to sit on; widening its shoulders by
  // a few percent changed nothing anybody could see.
  //
  // Now the torso runs collar to waist and the skirt runs waist to hem, and
  // WHERE the waist sits plus HOW MUCH it pinches is what the eye reads first.
  // The chest follows the SHOULDERS, not the robe's collar width. `topWidth` is
  // nine units on court silks — a collar — and running the torso at that width
  // gave a twenty-unit shoulder bar sitting on an eight-unit stick, which is
  // why the sleeves read as two lobes with a person somewhere behind them. A
  // chest is about a third wider than the shoulder half-span; that it now comes
  // from the shoulder item is correct rather than a coupling to regret, since
  // pauldrons and a mantle genuinely do broaden a torso.
  const chest = Math.max(robe.topWidth, shoulders.span * bearing.shoulders * 1.5)
  mark(
    { x: 0, y: robeTop * s },
    { x: 0, y: waistY * s },
    robe.bow * 0.4 * s,
    // Narrows fast under the arm and then holds, which is where a waist is.
    (t) => (chest + Math.pow(t, 0.72) * (waistWidth - chest)) * s,
    { segments: 16, jitter: 0.9 * s, bleedBy: 0.6 * s },
  )
  mark(
    { x: 0, y: waistY * s },
    { x: 0, y: robe.bottom * s },
    robe.bow * s,
    // Cubed, not linear: cloth hangs straight from the waist and opens near the
    // ground. A linear ramp is a cone, and a cone is the bell again.
    (t) => (waistWidth + Math.pow(t, 1.7) * (hemWidth - waistWidth)) * s,
    { segments: 22, jitter: 1.1 * s, bleedBy: 0.6 * s },
  )

  // A second, shorter panel over the first. Two hems at different heights is
  // the cheapest way to read as "wearing more" rather than "wearing bigger".
  if (robe.overlay) {
    const outer = robe.overlay
    const outerSpread = outer.hemWidth - outer.topWidth
    mark(
      { x: 0, y: outer.top * s },
      { x: 0, y: outer.bottom * s },
      0,
      (t) => (outer.topWidth + t * outerSpread) * s,
      { alpha: 0.9, segments: 20, jitter: 0.9 * s },
    )
  }

  // ---- Collar -----------------------------------------------------------
  // Paper cut back into the chest: the opening of a 交领 robe, where the right
  // panel crosses under the left. Two strokes meeting low, so it reads as a V
  // and not as a stripe.
  //
  // This is the only interior structure the figure has, and it is what stops
  // the torso from being a featureless block between the shoulders and the
  // belt. It also moves with the bearing, because the apex is placed as a
  // fraction of the way down to the waist — a high waist pulls the collar
  // shorter, which is exactly what happens on a real garment.
  tag = { part: 'cut' }
  {
    const apexY = robeTop + (waistY - robeTop) * 0.55
    const openY = robeTop + 3
    for (const side of [-1, 1]) {
      mark(
        { x: side * chest * 0.26 * s, y: openY * s },
        { x: 0.5 * s, y: apexY * s },
        side * 0.5 * s,
        calligraphic(1.7 * s, 0.95, 0.1),
        { alpha: 1, segments: 12, jitter: 0.2 * s },
      )
    }
  }

  tag = {}

  // ---- Shoulders and sleeves --------------------------------------------
  // Elliptic, not calligraphic: a brush profile keeps most of its width at the
  // ends, which turned the shoulders into a hard rectangle.
  const span = shoulders.span * bearing.shoulders

  // A mantle sits behind everything, so it reads as cloth the arms hang over.
  // At 0.55 it came out mid-grey and read as a rendering fault rather than as a
  // garment — a wash that pale belongs in a background, not on a character.
  if (shoulders.mantle) {
    mark(
      { x: -shoulders.mantle * s, y: -27.5 * s },
      { x: shoulders.mantle * s, y: -27.5 * s },
      3 * s,
      elliptic(12.5 * s),
      { alpha: 0.8, segments: 22, jitter: 1.2 * s, bleedBy: 0.6 * s },
    )
  }

  // A shoulder is a shallow arc across the top of the chest. `cap` is 11 or 12
  // in the wardrobe, and drawn at that thickness the bar was as tall as the
  // head and swallowed everything from the jaw to the ribs — including the
  // whole dyed part of the robe, which is why a coloured swordsman only showed
  // colour below the waist. Those numbers were authored against the old figure,
  // where the "shoulders" were the top of a bell and had to be thick to read.
  mark(
    { x: -span * s, y: shoulderY },
    { x: span * s, y: shoulderY },
    0.5 * s,
    elliptic(shoulders.cap * 0.46 * s),
    { segments: 20, jitter: 0.5 * s, bleedBy: 0.7 * s },
  )

  /** The sword hand, filled in by the loop below and used for the portrait. */
  let hand: Point = { x: (span * 0.6) * s, y: shoulderY + 19 * s }

  for (const side of [-1, 1]) {
    // The cuff is where the sleeve ends, and everything else about the arm is
    // measured from it. Placing the wrist at a fixed depth instead left the
    // hands dangling in open paper below a wide sleeve, as two round knobs.
    const cuff = {
      x: side * (span * 0.52 + shoulders.sleeveOut * 0.2 * bearing.sleeve) * s,
      y: shoulderY + shoulders.sleeveDrop * 1.05 * bearing.sleeve * s,
    }
    const elbow = { x: side * (span * 0.72 + 1) * s, y: shoulderY + 9 * s }
    const wrist = { x: cuff.x - side * 1.4 * s, y: cuff.y + 2.6 * s }

    // ---- Arm -------------------------------------------------------------
    // Down, not out. The first version ran the arm along the sleeve's own
    // reach, which for court silks meant a limb sticking twenty units sideways
    // — a T-pose with claws on the end. Arms at rest hang, and the sleeve is
    // cloth draped over them; those are two different shapes and conflating
    // them was the whole mistake. Bare arms show all of this; a court sleeve
    // covers it down to the wrist, which is the difference the item should make.
    mark(
      { x: side * (span - 2.5) * s, y: shoulderY + 1 * s },
      elbow,
      side * 1.2 * s,
      tapered(4 * s, 0.3),
      { alpha: 0.95, segments: 10, jitter: 0.3 * s, bleedBy: 0.5 * s },
    )
    mark(elbow, wrist, -side * 1 * s, tapered(3.4 * s, 0.3), {
      alpha: 0.95,
      segments: 10,
      jitter: 0.3 * s,
      bleedBy: 0.5 * s,
    })

    // ---- Sleeve ----------------------------------------------------------
    // Drawn over the arm, hanging from the shoulder. `sleeveOut` now flares the
    // drape rather than relocating the limb, so wide court sleeves still read
    // as wide — the difference lands in the cloth, which is where it belongs.
    mark(
      { x: side * (span - 2) * s, y: shoulderY },
      cuff,
      -side * shoulders.sleeveBow * s,
      calligraphic(shoulders.sleeveWidth * 0.52 * s, 0.45, 0.4),
      { alpha: 0.92, bleedBy: 0.6 * s },
    )

    // The hand goes on last, over the cuff, so it is never buried by cloth.
    mark(
      wrist,
      { x: wrist.x - side * 0.4 * s, y: wrist.y + 1.8 * s },
      0,
      elliptic(2.3 * s),
      { alpha: 0.95, segments: 8, jitter: 0.2 * s, bleedBy: 0.3 * s },
    )
    if (side === 1) hand = { x: wrist.x, y: wrist.y + 1.2 * s }

    if (shoulders.pauldron) {
      mark(
        { x: side * (span - 1) * s, y: shoulderY - 1.5 * s },
        { x: side * (span + 5) * s, y: shoulderY + 3 * s },
        side * 1.5 * s,
        elliptic(shoulders.pauldron * s),
        { segments: 16, jitter: 0.4 * s },
      )
    }
  }

  // A belt is drawn after the sleeves so it reads as cinching them in.
  if (robe.belt !== undefined) {
    tag = { part: 'robe' }
    // Drawn at the bearing's waist rather than the style's fixed height: with a
    // waist that now moves, a belt pinned to a constant y lands halfway down
    // the skirt on one bearing and across the ribs on the other.
    const beltY = waistY
    mark(
      { x: -(waistWidth + 1.5) * s, y: beltY * s },
      { x: (waistWidth + 1.5) * s, y: beltY * s },
      0,
      elliptic(3.4 * s),
      { alpha: 0.8, segments: 14, jitter: 0.3 * s },
    )
    tag = {}
  }

  // ---- Hair -------------------------------------------------------------
  // Drawn before the head so it reads as falling BEHIND the collar. Nothing in
  // the wardrobe touches it, which is what lets it survive every drop.
  if (bearing.hair > 0) {
    mark(
      { x: 0, y: headY - 1 * s },
      { x: 0, y: headY + bearing.hair * s },
      0,
      // Narrow at the crown, widest just below the jaw, gone by the collar.
      // Two shapes were tried first and both failed for the same reason: any
      // profile that still has width where the spine STARTS cuts a square edge
      // there, and a square edge one unit wider than the skull reads as the
      // shoulders of a hood. Starting narrow hides the join inside the head.
      (u) => head.headWidth * 1.22 * Math.sin(Math.PI * (0.18 + 0.82 * u)) * s,
      { alpha: 0.94, segments: 18, jitter: 0.5 * s, bleedBy: 0.8 * s },
    )
  }

  // ---- Neck -------------------------------------------------------------
  // Short, narrow, and drawn between the shoulder bar and the head. It exists
  // because of what the comparison sheet showed: with the head sitting straight
  // on the shoulders there was no join, only a single mass with a hat on it. A
  // couple of units of paper either side of a thin stroke is all a neck needs
  // to be, and it is the difference between a person and a bollard.
  mark(
    { x: 0, y: shoulderY + 1 * s },
    { x: 0, y: headY + 2 * s },
    0,
    tapered(4.2 * s, 0.12),
    { alpha: 0.95, segments: 10, jitter: 0.2 * s, bleedBy: 0.4 * s },
  )

  // ---- Head -------------------------------------------------------------
  // Sits clear of the shoulders with just enough overlap to avoid a seam. In an
  // overhead view a head that merges into the torso leaves an unreadable blob.
  //
  // The spine is short on purpose. It used to run nearly a head-width wide,
  // which with an elliptic sweep on top made the head twice as wide as it was
  // tall — the blob the sheet showed. A stub spine gives a skull that is only
  // slightly wider than tall, which is what an overhead camera sees.
  const hw = head.headWidth
  mark(
    { x: -hw * 0.44 * s, y: headY + 0.2 * s },
    { x: hw * 0.44 * s, y: headY - 0.2 * s },
    0.3 * s,
    elliptic(hw * 0.94 * s),
    { segments: 22, jitter: 0.18 * s, bleedBy: 0.7 * s },
  )

  const skullTop = headY - hw * 0.5 * s

  if (head.knot) {
    // Rising straight up, since there is no profile to lean into.
    mark(
      { x: 0, y: skullTop + 1.5 * s },
      { x: head.knot.lean * 0.5 * s, y: skullTop - head.knot.rise * 0.62 * s },
      0.6 * s,
      // A 髮髻 is a bound bun sitting on the crown — wider than it is tall.
      // Swept by a calligraphic profile it tapered to a point and read as an
      // antenna, then as a plume; an ellipse over a short spine reads as hair.
      elliptic(head.knot.width * 1.45 * s),
      { segments: 14, jitter: 0.3 * s, bleedBy: 0.7 * s },
    )
  }

  if (head.crown) {
    // Squared off rather than tapered: a crown must not read as another topknot.
    mark(
      { x: 0, y: skullTop + 1.5 * s },
      { x: 0, y: skullTop - head.crown.rise * s },
      0,
      () => head.crown!.width * s,
      { segments: 10, jitter: 0.25 * s, bleedBy: 0.6 * s },
    )
    mark(
      { x: -head.crown.width * 0.9 * s, y: skullTop - head.crown.rise * 0.55 * s },
      { x: head.crown.width * 0.9 * s, y: skullTop - head.crown.rise * 0.55 * s },
      0,
      elliptic(2.2 * s),
      { alpha: 0.8, segments: 10, jitter: 0.2 * s, bleedBy: 0.4 * s },
    )
  }

  if (head.hat) {
    // Drawn last so the brim overlaps the head, which is what makes a disc read
    // as sitting ON somebody rather than floating above them.
    const brimY = headY - head.hat.lift * s
    mark(
      { x: -head.hat.span * s, y: brimY },
      { x: head.hat.span * s, y: brimY },
      1.2 * s,
      elliptic(head.hat.thickness * s),
      { alpha: 0.95, segments: 26, jitter: 0.5 * s, bleedBy: 1.1 * s },
    )
    if (head.veil) {
      for (const side of [-1, 1]) {
        mark(
          { x: side * head.hat.span * 0.72 * s, y: brimY },
          { x: side * head.hat.span * 0.55 * s, y: (brimY / s + head.veil) * s },
          side * 1.5 * s,
          calligraphic(3.4 * s, 0.8, 0.4),
          { alpha: 0.42, segments: 14, jitter: 0.5 * s },
        )
      }
    }
  }

  // The tallest thing worn decides how much room the figure needs.
  const crest = 53 + (head.hat ? head.hat.lift + 2 : 0) + (head.crown ? head.crown.rise - 6 : 0)

  // ---- Build ------------------------------------------------------------
  // Applied here, to finished polygons, rather than threaded through the
  // twenty mark() calls above. Those calls mix x-positions with perpendicular
  // width profiles — for a vertical spine the width IS the horizontal extent,
  // for a horizontal one the endpoints are — so widening "correctly" at the
  // call site means two different rules and twenty chances to apply the wrong
  // one. Scaling x once at the end is exact by construction, and it widens the
  // brush jitter along with everything else, which is what a broader stroke
  // genuinely looks like.
  //
  // x only. Height is deliberately untouched: it decides how much room the
  // figure needs and how the camera frames it, so scaling it would be a
  // simulation change dressed up as a cosmetic one.
  if (build !== 1) {
    for (const strokes of [bleed, body]) {
      for (const stroke of strokes) {
        for (let i = 0; i < stroke.poly.length; i += 2) stroke.poly[i]! *= build
      }
    }
  }

  return {
    bleed,
    body,
    // Tied at the waist, not across the shoulders. Anchored at the collar it
    // hooked out over the chest and read as a red strap; a sash is knotted at
    // the belt and its ends hang past the hem, which is also the one place a
    // second colour can sit without breaking the silhouette.
    sashAnchor: { x: 0, y: waistY * s },
    // Scaled with the build like every polygon above, so a broader swordsman
    // holds their sword further out rather than through their own ribs.
    hand: { x: hand.x * build, y: hand.y },
    bladeTip: { x: 0, y: 0 },
    height: crest * s,
  }
}

/**
 * The blade, as its own stroke, drawn pointing along +x from a pivot at the
 * character's hands. The renderer rotates it to the aim direction.
 */
export function buildBlade(
  seed = 2,
  scale = 1,
  style: BladeStyle = DEFAULT_GEAR.blade,
): FigureStroke[] {
  const rng = new Rng(seed)
  const s = scale
  const out: FigureStroke[] = []

  const width: WidthProfile = (t) =>
    (style.baseWidth - t * (style.baseWidth - style.tipWidth)) * s

  // Fanned about the hand, so twin blades and a fan are the same code with a
  // different count — the silhouette that results is completely different.
  const half = (style.count - 1) / 2
  for (let i = 0; i < style.count; i++) {
    const angle = (i - half) * style.spread
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const from = { x: 6 * s * cos, y: 6 * s * sin }
    const to = {
      x: style.reach * s * cos - -3 * s * sin,
      y: style.reach * s * sin + -3 * s * cos,
    }
    const spine = bowedSpine(from, to, style.bow * s, 24)

    const bleedPoly = sweep(spine, widen(width, 0.6 * s), rng, 0.4 * s)
    if (bleedPoly.length >= 6) out.push({ poly: bleedPoly, alpha: 0.14 })
    const poly = sweep(spine, width, rng, 0.2 * s)
    if (poly.length >= 6) out.push({ poly, alpha: 0.95 })
  }

  // A crossguard: short, perpendicular, and the one mark that separates a
  // heavy blade from a long one at a glance.
  if (style.guard) {
    const guard = bowedSpine(
      { x: 7 * s, y: -style.guard * s },
      { x: 7 * s, y: style.guard * s },
      0,
      8,
    )
    const guardPoly = sweep(guard, elliptic(2.6 * s), rng, 0.2 * s)
    if (guardPoly.length >= 6) out.push({ poly: guardPoly, alpha: 0.9 })
  }

  return out
}

/**
 * A sash that trails behind the figure.
 *
 * A travelling-wave approximation rather than a cloth simulation: each segment
 * lags the one before it in phase, and the whole ribbon is dragged opposite to
 * movement. It is a handful of sines, and it does more for "this character is
 * alive" than any amount of added detail would.
 *
 * `trailX`/`trailY` is the unit direction the ribbon should stream along —
 * normally the opposite of travel. In the overhead view this is a free 2D
 * vector rather than the old "behind means local -x", which only had a meaning
 * while the character could face two ways.
 */
export function sashSpine(
  anchor: Point,
  time: number,
  trailX: number,
  trailY: number,
  speed: number,
  scale = 1,
  segments = 16,
  length = 42,
): Point[] {
  const points: Point[] = []
  // Faster movement streams the ribbon straight out; at rest it settles.
  const pull = 0.45 + Math.min(1, speed / 220) * 0.55
  // The perpendicular, for the wave to travel along.
  const perpX = -trailY
  const perpY = trailX

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const reach = t * length * scale * pull
    // Later segments lag further in phase — that lag is the wave.
    const wave = Math.sin(time * 5.2 - t * 5.0) * (1.5 + t * 9) * scale
    // With little airflow the cloth simply hangs toward the camera.
    const settle = t * t * 16 * scale * (1 - Math.min(1, speed / 200))
    points.push({
      x: anchor.x + trailX * reach + perpX * wave * 0.55,
      y: anchor.y + trailY * reach + perpY * wave * 0.55 + settle,
    })
  }
  return points
}

/** Sweeps a sash spine into a drawable outline. */
export function sashPoly(spine: Point[], rng: Rng, scale = 1): number[] {
  return sweep(spine, calligraphic(4.6 * scale, 0.8, 0.04), rng, 0.35 * scale)
}
