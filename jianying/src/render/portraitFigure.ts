/**
 * The swordsman seen from the FRONT, standing still, for portraits.
 *
 * This exists because of a report I chased for several turns without finding:
 * "o preview do character está estranho". Every fix I tried was to the
 * treatment — filters, washes, contrast — and none of them worked, because the
 * treatment was never the problem. The creation screen was calling
 * `buildSwordsmanTopDown`: the figure the GAME uses, seen from a three-quarter
 * OVERHEAD camera, scaled up five times and presented as a portrait.
 *
 * Seen from above, a head is a disc and a shoulder is a cap on top of a mass —
 * both correct, both unreadable when the same drawing is shown at 236px as if
 * the camera were at eye level. That is the whole of it: the head looked like
 * it was floating because from overhead it IS a separate disc, and the
 * shoulders looked like sausages because from overhead they are.
 *
 * So this is a different drawing of the same person, not a tweak to that one.
 * It shares the wardrobe, the ink primitives and the `Swordsman` shape, so
 * everything downstream — dye, rank marks, the blade, the paint-in animation —
 * works unchanged.
 *
 * Local space: origin between the feet, ~66 units tall against the overhead
 * figure's 44. That is not a scale change, it is the foreshortening coming
 * back out: a standing person is about seven heads tall, and an overhead
 * camera compresses that to four and a half.
 */
import { Rng } from '../core/rng'
import {
  bowedSpine,
  calligraphic,
  elliptic,
  sweep,
  tapered,
  type Point,
  type WidthProfile,
} from './ink'
import { DEFAULT_GEAR, STANCES, type Gear } from './wardrobe'
import type { FigureStroke, Swordsman } from './figure'

/**
 * How much taller the same character is when the camera stops looking down.
 *
 * The wardrobe's vertical measurements were all authored against the overhead
 * figure. Rather than duplicate the whole table for this view — which would
 * mean every new robe had to be authored twice, and would drift — heights are
 * read from the same numbers and stretched by this.
 */
const RISE = 1.52

/**
 * How much NARROWER a hem is from the front.
 *
 * Widths do not get the same treatment, and one of them has to go the other
 * way. From overhead a skirt spreads toward the camera, so `hemWidth` is
 * authored huge — 24 on a hemp robe against a 9-unit shoulder half-span. Drawn
 * at that width from the front it is a bell with a head on it, which is the
 * exact shape this view exists to stop being.
 */
const HEM_FLARE = 0.48

/** A width profile through keyframes, linear between them. */
const through = (keys: readonly (readonly [number, number])[]): WidthProfile => {
  return (t: number): number => {
    for (let i = 1; i < keys.length; i++) {
      const a = keys[i - 1]!
      const b = keys[i]!
      if (t <= b[0]) {
        const span = b[0] - a[0]
        const u = span <= 0 ? 0 : (t - a[0]) / span
        return a[1] + (b[1] - a[1]) * u
      }
    }
    return keys[keys.length - 1]![1]
  }
}

const widen =
  (profile: WidthProfile, by: number): WidthProfile =>
  (t) =>
    profile(t) + by

/**
 * Converts a HALF-width profile into the full width `sweep` expects.
 *
 * `sweep()` halves whatever profile it is given, so a `WidthProfile` there is
 * the mark's full breadth. Every measurement in this file is a half-width,
 * because that is the currency the skeleton is written in: `span` is half a
 * shoulder span, and an arm PLACED at ±span has to be given a width in the same
 * units or the two silently disagree about how wide the body is.
 *
 * They did disagree, for a whole pass: the torso rendered at half the width its
 * own profile claimed, the arms hung outside a body that had shrunk away from
 * them, and the figure had a channel of bare paper down each side. Nothing in
 * the drawing said which of the two was wrong, which is why this is a named
 * conversion at every call site rather than a factor of two buried in the
 * numbers.
 */
const wide =
  (profile: WidthProfile): WidthProfile =>
  (t) =>
    profile(t) * 2

/**
 * Total height, in local units.
 *
 * Everything else on the figure is a fraction of this or of the head, so the
 * proportions cannot drift apart when one measurement is tuned. The first
 * version derived heights from the wardrobe's own numbers and the result was a
 * torso three head-widths across with a pea on top: those numbers describe a
 * figure seen from ABOVE, where a chest genuinely is the widest thing there is.
 */
const HEIGHT = 68

export function buildSwordsmanFront(
  seed = 1,
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
  /** Where the sword hand should be. The arm bends to it; see figure.ts. */
  reach?: Point,
  /**
   * Where the OFF hand should be, on a weapon held in both.
   *
   * Passing it is what turns a portrait of somebody standing beside a
   * zhanmadao into a portrait of somebody holding one. Fists painted on the
   * haft — `hands` in wardrobe.ts — cannot do this job: they say the weapon is
   * gripped without saying by whom, which is all a top-down sprite can manage
   * and less than a posed portrait should settle for.
   */
  offReach?: Point,
): Swordsman {
  const rng = new Rng(seed)
  const body: FigureStroke[] = []
  const bleed: FigureStroke[] = []
  let tag: { part?: 'robe' | 'cut' } = {}

  const mark = (
    from: Point,
    to: Point,
    bow: number,
    width: WidthProfile,
    opts: {
      alpha?: number
      segments?: number
      jitter?: number
      bleedBy?: number
    } = {},
  ): void => {
    const { alpha = 1, segments = 22, jitter = 0.75, bleedBy = 0.9 } = opts
    const spine = bowedSpine(from, to, bow, segments)
    if (bleedBy > 0 && tag.part !== 'cut') {
      const bleedPoly = sweep(spine, widen(width, bleedBy), rng, jitter * 0.4)
      if (bleedPoly.length >= 6) bleed.push({ poly: bleedPoly, alpha: alpha * 0.15, ...tag })
    }
    const poly = sweep(spine, width, rng, jitter)
    if (poly.length >= 6) body.push({ poly, alpha, ...tag })
  }

  const { robe, shoulders, head } = gear
  const stance = gear.blade.stance ?? STANCES.even

  // ---- The skeleton ------------------------------------------------------
  // Read this as a figure drawing, top to bottom. Every height is either a
  // fraction of HEIGHT or an offset in HEAD HEIGHTS, because that is how the
  // proportions of a standing person are actually specified — and specifying
  // them any other way is what produced every wrong version of this figure.
  //
  // `elliptic(max)` is a HALF-WIDTH perpendicular to the spine, and forgetting
  // that cost me the first pass: a vertical head spine under `elliptic(hw*1.94)`
  // drew a lens twenty units across and three tall, which the contact sheet
  // showed as a saucer hovering over the shoulders.
  const hh = 5.6 * build
  /** A face-on skull is an egg: clearly taller than it is wide. */
  const hw = hh * 0.78

  const crownY = -HEIGHT
  const headY = crownY + hh
  const chinY = headY + hh
  const shoulderY = chinY + hh * 0.58

  /**
   * Half the distance between the outer edges of the shoulders — the widest
   * measurement on the figure, as it is on a person.
   *
   * Anchored to the head and only NUDGED by the wardrobe, rather than taken
   * from it. The raw span runs 7.7 to 13 across the two schools, which against
   * a fixed skull is the difference between a coat-hanger and a doorway. Read
   * this way the classes still separate — the 斩马刀 is a head wider across the
   * shoulders than the 飞刀 — without either leaving human proportion.
   */
  const span = hw * 1.25 + shoulders.span * bearing.shoulders * stance.shoulders * build * 0.32
  const hipY = crownY + HEIGHT * 0.52
  const waistFrac = Math.min(0.86, Math.max(0.56, 0.55 + bearing.waist * stance.waist * 0.35))
  const waistY = shoulderY + (hipY - shoulderY) * waistFrac
  /** A cinched waist is NARROWER; `cinch` runs 1.28 on a man, 0.82 on a woman. */
  const waistWidth = span * (0.44 + 0.1 * bearing.cinch) * stance.waist
  const hemY = robe.bottom * RISE
  const hemWidth = Math.max(waistWidth * 1.32, robe.hemWidth * HEM_FLARE * bearing.hem * build)

  // ---- Legs --------------------------------------------------------------
  // Drawn first, so the robe falls over them and only what the hem clears is
  // ever seen — which is how a travelling coat shows boots and a court robe
  // does not, from one piece of geometry.
  const planted = stance.feet
  for (const side of [-1, 1]) {
    const foot = side * (2.4 + 1.6 * planted) * build
    mark(
      { x: side * 2.6 * build, y: hipY },
      { x: foot, y: -2 },
      0,
      wide(
        through([
          [0, 2.8 * build],
          [0.55, 2.2 * build],
          [1, 1.9 * build],
        ]),
      ),
      { alpha: 0.95, segments: 14, jitter: 0.35, bleedBy: 0.5 },
    )
    // A boot, flat and forward of the shin. Without it the legs end in mid-air.
    mark(
      { x: foot - side * 1.6 * build, y: -2.4 },
      { x: foot + side * 5 * build, y: -0.6 },
      0.5,
      // Flat. At 2.2 over this spine it was as tall as it was long, and two
      // spheres under a hem read as bowling balls rather than as feet.
      wide(elliptic(1.5 * build)),
      { alpha: 0.95, segments: 10, jitter: 0.22, bleedBy: 0.4 },
    )
  }

  // ---- Body ---------------------------------------------------------------
  // ONE stroke from the base of the skull to the waist, whose width profile IS
  // the outline of a torso. This is the mark that makes the front view work.
  //
  // The overhead figure draws a horizontal BAR for the shoulders, because seen
  // from above that is exactly what a shoulder is. Repeating that here gave the
  // two lobes the contact sheet showed: a level bar butted against a neck has
  // no trapezius, so the join reads as two objects rather than one body. Real
  // shoulders SLOPE — narrow at the neck, widest a little below it — and a
  // profile that swells over its first fifth draws that slope for free, with no
  // second mark that can fall out of register with the first.
  //
  // Widest at the deltoid, then IN to the ribs and in again to the waist. The
  // first pass had the chest wider than the shoulders, which is not a build,
  // it is a barrel.
  tag = { part: 'robe' }
  mark(
    // Starting just below the chin at NECK width, so the neck reads as a join
    // rather than a seam. The first pass began the torso inside the jaw and
    // half a head across, which set the skull straight onto a cone — a bullet,
    // not a person. And full shoulder width now arrives a fifth of the way
    // down instead of a tenth: a trapezius that rises in two units is not a
    // slope, it is a step, and a step reads as a wardrobe wearing a head.
    { x: 0, y: chinY + hh * 0.1 },
    { x: 0, y: waistY },
    robe.bow * 0.25,
    wide(
      through([
        [0, hw * 0.44],
        [0.17, span * 0.9],
        [0.29, span],
        [0.53, span * 0.88],
        [0.8, span * 0.74],
        [1, waistWidth],
      ]),
    ),
    { segments: 26, jitter: 0.7, bleedBy: 0.6 },
  )

  // The skirt. Cubed rather than linear: cloth hangs straight off the hips and
  // opens near the ground. A linear ramp is a cone, and a cone is a bell.
  mark(
    { x: 0, y: waistY },
    { x: 0, y: hemY },
    robe.bow,
    wide((t) => waistWidth + Math.pow(t, 1.6) * (hemWidth - waistWidth)),
    { segments: 24, jitter: 0.9, bleedBy: 0.6 },
  )

  if (robe.overlay) {
    const outer = robe.overlay
    const top = shoulderY + (waistY - shoulderY) * 0.25
    mark(
      { x: 0, y: top },
      { x: 0, y: top + (hemY - top) * 0.62 },
      0,
      wide(
        through([
          [0, span * 0.78],
          [1, Math.max(waistWidth, outer.hemWidth * HEM_FLARE * 0.8 * build)],
        ]),
      ),
      { alpha: 0.9, segments: 20, jitter: 0.8 },
    )
  }
  tag = {}

  // ---- Collar -------------------------------------------------------------
  // Paper cut back into the chest: the crossed opening of a 交领 robe, where the
  // right panel passes under the left. It is the only interior structure the
  // figure has, and the only thing stopping the torso being a slab.
  tag = { part: 'cut' }
  {
    const openY = chinY + hh * 0.55
    const apexY = openY + (waistY - openY) * 0.4
    for (const side of [-1, 1]) {
      mark(
        { x: side * span * 0.34, y: openY },
        { x: 0.4, y: apexY },
        side * 0.7,
        wide(calligraphic(1.1 * build, 0.95, 0.1)),
        { alpha: 1, segments: 14, jitter: 0.2 },
      )
    }
  }
  tag = {}

  if (shoulders.mantle) {
    tag = { part: 'robe' }
    mark(
      { x: -span * 1.15, y: shoulderY + 1 },
      { x: span * 1.15, y: shoulderY + 1 },
      3.5,
      wide(elliptic(6 * build)),
      { alpha: 0.8, segments: 22, jitter: 1, bleedBy: 0.6 },
    )
    tag = {}
  }

  let hand: Point = { x: span * 0.8, y: shoulderY + hh * 5 }
  const cuffs: Point[] = []

  // ---- Arms and sleeves ---------------------------------------------------
  // Two segments with a real elbow. The overhead figure gets away with one bent
  // stroke because from above an arm is mostly hidden behind its own shoulder;
  // from the front it is half of the figure's outline, and one stroke from
  // shoulder to wrist reads as a tube.
  //
  // They hang DOWN and slightly IN, ending near mid-thigh. Placed outboard of
  // the shoulder — which the first pass did, following `sleeveOut` — the figure
  // holds its elbows off its ribs like a bodybuilder, and the paper between arm
  // and body reads as a gap in the silhouette rather than as air.
  const armLength = HEIGHT * 0.45
  for (const side of [-1, 1]) {
    const target = side === 1 ? reach : offReach
    const posed = target !== undefined
    const flare = shoulders.sleeveOut * 0.04 * bearing.sleeve * build
    const shoulderPt = {
      x: side * (span - hw * 0.35),
      y: shoulderY + hh * 0.25,
    }
    // Inboard of the shoulder, not outboard of it. At `span * 0.94` the limb's
    // own width put its inner edge outside the ribs, and the paper between arm
    // and body read as a hole in the silhouette rather than as air. A hanging
    // arm TOUCHES the torso; the outline it makes is one shape, not three.
    // A posed elbow stays OUT while the wrist comes in, which is what an arm
    // reaching across the body actually does: the forearm crosses, the upper
    // arm does not. Dropped straight toward the target it folded the whole
    // limb into the ribs, and the off hand appeared to grow out of the waist.
    const elbow = posed
      ? { x: side * (span * 0.92 + flare), y: shoulderY + armLength * 0.46 }
      : { x: side * (span * 0.72 + flare), y: shoulderY + armLength * 0.5 }
    // An arm cannot reach further than it is long, and a swept stroke will
    // happily draw one that does — which is what a two-handed grip placed too
    // low produced: the off hand sat thirty-four units from a thirty-unit arm,
    // and the forearm simply stretched to it. Nothing failed; the figure just
    // grew a rubber limb. Clamping here rather than at the call site means the
    // pose is anatomically valid by construction, whatever a caller asks for.
    const want = posed ? { x: target.x, y: target.y } : null
    const wrist =
      want === null
        ? { x: side * (span * 0.64 + flare), y: shoulderY + armLength }
        : (() => {
            const dx = want.x - shoulderPt.x
            const dy = want.y - shoulderPt.y
            const far = Math.hypot(dx, dy)
            // 0.97, not 1: an arm at literally full stretch has no elbow left,
            // and a limb drawn dead straight reads as a stick.
            const cap = armLength * 0.97
            if (far <= cap) return want
            return { x: shoulderPt.x + (dx / far) * cap, y: shoulderPt.y + (dy / far) * cap }
          })()
    // Nearly at the wrist: a sleeve that stops at mid-forearm leaves the hand
    // as a bead on a stick.
    const cuff = {
      x: elbow.x + (wrist.x - elbow.x) * 0.8,
      y: elbow.y + (wrist.y - elbow.y) * 0.8,
    }

    mark(shoulderPt, elbow, -side * 1, wide(tapered(2.9 * build, 0.35)), {
      alpha: 0.95,
      segments: 12,
      jitter: 0.28,
      bleedBy: 0.45,
    })
    mark(elbow, wrist, side * 1.1, wide(tapered(2.4 * build, 0.32)), {
      alpha: 0.95,
      segments: 12,
      jitter: 0.28,
      bleedBy: 0.45,
    })

    // The sleeve, over the arm, hanging from the shoulder to the cuff. Never
    // narrower than the arm it covers, or the limb shows through it as a spine.
    tag = { part: 'robe' }
    mark(
      { x: side * (span - hw * 0.25), y: shoulderY },
      cuff,
      -side * shoulders.sleeveBow * 0.6,
      // `tapered`, not `calligraphic`: a brush profile presses hardest at its
      // middle, and over a stroke as long as an arm that press lands on the
      // bicep and puffs the sleeve into a leg-of-mutton. Cloth hanging off a
      // shoulder holds its width and closes at the cuff.
      wide(tapered(Math.max(shoulders.sleeveWidth * 0.46, 3.2) * build, 0.26)),
      { bleedBy: 0.55, segments: 18 },
    )
    tag = {}

    // The hand last, over the cuff, so cloth never buries it.
    mark(wrist, { x: wrist.x - side * 0.3, y: wrist.y + 1.9 }, 0, wide(elliptic(2.1 * build)), {
      alpha: 0.95,
      segments: 8,
      jitter: 0.2,
      bleedBy: 0.3,
    })
    if (side === 1) hand = posed ? { x: wrist.x, y: wrist.y } : { x: wrist.x, y: wrist.y + 1.2 }
    cuffs[side === -1 ? 0 : 1] = cuff

    if (shoulders.pauldron) {
      mark(
        { x: side * (span - hw * 0.55), y: shoulderY - 0.5 },
        { x: side * (span + hw * 0.12), y: shoulderY + hh * 0.55 },
        side * 1.2,
        wide(elliptic(shoulders.pauldron * 0.34 * build)),
        { segments: 16, jitter: 0.35 },
      )
    }
  }

  // A belt, after the sleeves, so it reads as cinching them in.
  if (robe.belt !== undefined) {
    tag = { part: 'robe' }
    mark(
      { x: -waistWidth * 0.92, y: waistY },
      { x: waistWidth * 0.92, y: waistY },
      0,
      wide(elliptic(1.8 * build)),
      { alpha: 0.8, segments: 14, jitter: 0.3 },
    )
    tag = {}
  }

  // ---- Knives at the hip --------------------------------------------------
  // The 飞刀 half of the class read: many small things breaking the hip line,
  // against the other class's one enormous one. Left hip, because the sword
  // hand is the right; angled down and out, so they cross the outline rather
  // than lie along it.
  for (let i = 0; i < stance.beltBlades; i++) {
    const y = waistY + 2 + i * 3
    mark(
      { x: -waistWidth * 0.5, y },
      // Out PAST the hanging arm, not under it. Drawn shorter they sat behind
      // the forearm and read as a smudge on the hip; the point of them is that
      // they break the outline, which means their tips have to reach paper.
      { x: -(span + 7), y: y + 9 },
      0.4,
      wide(calligraphic(2.2 * build, 0.9, 0.16)),
      { alpha: 0.92, segments: 8, jitter: 0.2, bleedBy: 0.4 },
    )
  }

  // ---- Hair ---------------------------------------------------------------
  // Before the head, so it falls BEHIND the collar. Narrow at the crown so the
  // join hides inside the skull — a profile with width where the spine starts
  // cuts a square edge there, which reads as the shoulders of a hood.
  if (bearing.hair > 0) {
    mark(
      { x: 0, y: headY - hh * 0.5 },
      { x: 0, y: chinY + Math.min(bearing.hair, 13) * 0.75 },
      0,
      wide((u) => hw * 1.3 * Math.sin(Math.PI * (0.2 + 0.8 * u))),
      { alpha: 0.94, segments: 18, jitter: 0.45, bleedBy: 0.7 },
    )
  }

  // ---- Neck ---------------------------------------------------------------
  // Runs from inside the skull to inside the shoulders, so neither join shows
  // a seam. About half a head wide, which is what a neck is.
  mark(
    { x: 0, y: chinY - hh * 0.35 },
    { x: 0, y: shoulderY + 1 },
    0,
    wide(tapered(hw * 0.44, 0.1)),
    {
      alpha: 0.95,
      segments: 10,
      jitter: 0.18,
      bleedBy: 0.35,
    },
  )

  // ---- Head ---------------------------------------------------------------
  // A VERTICAL spine under an elliptic sweep: the spine sets the height, the
  // profile sets the width, and the result is an egg standing on end. The
  // overhead figure runs its spine sideways for exactly the opposite reason,
  // and that one line is the difference between the two views.
  mark({ x: 0, y: crownY }, { x: 0, y: chinY }, 0, wide(elliptic(hw)), {
    segments: 24,
    jitter: 0.16,
    bleedBy: 0.55,
  })

  const skullTop = crownY

  if (head.knot) {
    mark(
      { x: 0, y: skullTop + 1.5 },
      { x: head.knot.lean * 0.5, y: skullTop - head.knot.rise * 0.85 },
      0.5,
      wide(elliptic(head.knot.width * 0.9 * build)),
      { segments: 14, jitter: 0.28, bleedBy: 0.6 },
    )
  }

  if (head.crown) {
    mark(
      { x: 0, y: skullTop + 2 },
      { x: 0, y: skullTop - head.crown.rise },
      0,
      wide((u) => head.crown!.width * 0.62 * (1 - u * 0.22) * build),
      { segments: 10, jitter: 0.22, bleedBy: 0.55 },
    )
    // The 簪 through it, crossing wider than the cap so the two read as two
    // objects rather than one black chimney.
    mark(
      {
        x: -head.crown.width * 0.95 * build,
        y: skullTop - head.crown.rise * 0.72,
      },
      {
        x: head.crown.width * 0.95 * build,
        y: skullTop - head.crown.rise * 0.58,
      },
      0,
      wide(calligraphic(1.6 * build, 0.7, 0.35)),
      { alpha: 0.9, segments: 10, jitter: 0.18, bleedBy: 0.35 },
    )
  }

  if (head.hat) {
    // A 斗笠 seen face-on is a shallow CONE, not the disc an overhead camera
    // sees. Bowed upward at the centre and drawn across the brow, it stays the
    // most distinctive silhouette in the wardrobe through the change of view —
    // which is the one thing that had to survive it.
    const brimY = headY - hh * 0.35
    mark(
      { x: -head.hat.span * 0.62 * build, y: brimY + 1.6 },
      { x: head.hat.span * 0.62 * build, y: brimY + 1.6 },
      -3.4,
      wide(elliptic(head.hat.thickness * 0.62 * build)),
      { alpha: 0.95, segments: 26, jitter: 0.4, bleedBy: 0.8 },
    )
    if (head.veil) {
      for (const side of [-1, 1]) {
        mark(
          { x: side * head.hat.span * 0.5 * build, y: brimY + 2.4 },
          {
            x: side * head.hat.span * 0.42 * build,
            y: brimY + 2.4 + head.veil * 0.85,
          },
          side * 1.2,
          wide(calligraphic(3 * build, 0.8, 0.4)),
          { alpha: 0.85, segments: 12, jitter: 0.35, bleedBy: 0.45 },
        )
      }
    }
  }

  return {
    bleed,
    body,
    sashAnchor: { x: -waistWidth * 0.6, y: waistY },
    hand,
    anchors: {
      crown: { x: 0, y: skullTop },
      cuffs: [
        cuffs[0] ?? { x: -span, y: shoulderY + armLength * 0.7 },
        cuffs[1] ?? { x: span, y: shoulderY + armLength * 0.7 },
      ],
      waist: { x: 0, y: waistY },
      hem: { y: hemY, halfWidth: hemWidth },
    },
    bladeTip: { x: hand.x, y: hand.y - gear.blade.reach },
    height: HEIGHT,
  }
}
