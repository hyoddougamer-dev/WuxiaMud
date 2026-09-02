/**
 * 山水 — one ink-wash vignette per region, drawn rather than fetched.
 *
 * "Queria a tab world mais elaborada e não meramente texto." The world tab is a
 * LIST, and a list of five rows cannot make anywhere feel like a place. This is
 * the answer, and the answer had to be code: every image host, asset site and
 * generation API is unreachable from the machine this game is built on — the
 * whole ink-wash direction exists because of that constraint. So the marsh is
 * not a picture of a marsh; it is reeds, water lines and mist, composed from the
 * same primitives the rest of the renderer uses.
 *
 * Three rules keep five vignettes from becoming five unrelated drawings:
 *
 *   DEPTH IS OPACITY. Far things are faint, near things are solid, and nothing
 *   in between is drawn with an outline. That single rule is what makes the
 *   whole set read as one hand.
 *
 *   EACH PLACE OWNS ONE SILHOUETTE. Vertical strokes belong to the marsh,
 *   diagonals to the cliff, circles to the market, a horizontal band to the
 *   pass, and the road gets the only vanishing point. Two places sharing a
 *   shape would be the icon-collision problem again, at a larger size.
 *
 *   SEEDED, SO IT IS STABLE. The same region draws the same picture every time.
 *   A vignette that reshuffled on every render would read as noise, and would
 *   make a screenshot impossible to compare against the next one.
 *
 * The output is an SVG fragment in a 0 0 W H user space, so it drops into the
 * DOM hub and into the mockup sheets unchanged.
 */
import { Rng } from '../core/rng'
import { palette } from './palette'

const hex = (c: number): string => `#${c.toString(16).padStart(6, '0')}`
const ink = hex(palette.ink)
const cinnabar = hex(palette.cinnabar)
const gold = hex(palette.gold)

export interface VignetteSize {
  readonly w: number
  readonly h: number
}

/** A soft wash — a wide, low ellipse with no edge. Distance, in one mark. */
const wash = (cx: number, cy: number, rx: number, ry: number, op: number): string =>
  `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ` +
  `ry="${ry.toFixed(1)}" fill="${ink}" fill-opacity="${op.toFixed(3)}"/>`

/** A tapered brush stroke from a to b, thick at the root. */
const stroke = (
  x1: number, y1: number, x2: number, y2: number, width: number, op: number, colour = ink,
): string =>
  `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}" ` +
  `stroke="${colour}" stroke-opacity="${op.toFixed(3)}" stroke-width="${width.toFixed(2)}" ` +
  `stroke-linecap="round" fill="none"/>`

/** A bowed stroke. `bow` is how far the middle leaves the straight line. */
const curve = (
  x1: number, y1: number, x2: number, y2: number, bow: number,
  width: number, op: number, colour = ink,
): string => {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  return (
    `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${(mx - (dy / len) * bow).toFixed(1)} ` +
    `${(my + (dx / len) * bow).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" ` +
    `stroke="${colour}" stroke-opacity="${op.toFixed(3)}" stroke-width="${width.toFixed(2)}" ` +
    `stroke-linecap="round" fill="none"/>`
  )
}

/**
 * The far hills every vignette stands in front of.
 *
 * Shared on purpose: it is the horizon line that tells the player these five
 * places are in one world rather than five separate games.
 */
function hills(rng: Rng, s: VignetteSize, base: number, count = 3): string {
  // MOUNDS ANCHORED TO A HORIZON, not free ellipses. The first version drew
  // full ellipses at the horizon height and every one of them read as a disc
  // hovering in the sky — five vignettes with a flying saucer in them. A hill
  // is a shape that MEETS the ground, so the primitive has to be a half-dome
  // sitting on `base` rather than a wash placed near it.
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const cx = s.w * (0.1 + t * 0.8) + rng.range(-s.w * 0.08, s.w * 0.08)
    const rx = rng.range(0.2, 0.34) * s.w
    const rise = rng.range(0.16, 0.3) * s.h
    out.push(
      `<path d="M ${(cx - rx).toFixed(1)} ${base.toFixed(1)} Q ${(cx - rx * 0.35).toFixed(1)} ` +
        `${(base - rise).toFixed(1)} ${cx.toFixed(1)} ${(base - rise * 0.92).toFixed(1)} Q ` +
        `${(cx + rx * 0.5).toFixed(1)} ${(base - rise * 0.75).toFixed(1)} ${(cx + rx).toFixed(1)} ` +
        `${base.toFixed(1)} Z" fill="${ink}" fill-opacity="${(0.07 + i * 0.035).toFixed(3)}"/>`,
    )
  }
  return out.join('')
}

/**
 * A ragged horizontal band of mist, the way a wet brush leaves it.
 *
 * Three overlapping ellipses of falling opacity rather than one: a single
 * ellipse has a mathematically perfect edge, which is the one thing a wash
 * never has, and at any size above a thumbnail that edge is what gives away
 * that nobody held a brush.
 */
function mist(rng: Rng, cx: number, cy: number, w: number, op: number): string {
  const out: string[] = []
  for (let i = 0; i < 3; i++) {
    out.push(
      wash(
        cx + rng.range(-w * 0.18, w * 0.18),
        cy + rng.range(-2.5, 2.5),
        w * rng.range(0.42, 0.62),
        rng.range(1.6, 4.2),
        op * rng.range(0.6, 1),
      ),
    )
  }
  return out.join('')
}

/**
 * The low sun, seen through that mist.
 *
 * PAPER, not gold. It is a hole punched in the wash — which is exactly how it
 * is made in a real ink painting, by leaving the paper untouched and laying the
 * cloud around it. Painting it gold would make it the only saturated thing on a
 * monochrome horizon, and the eye would read it as a pickup rather than as the
 * sun.
 */
function sun(cx: number, cy: number, r: number): string {
  return (
    `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r * 1.9).toFixed(1)}" ` +
    `fill="${hex(palette.paper)}" fill-opacity="0.30"/>` +
    `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" ` +
    `fill="${hex(palette.paper)}" fill-opacity="0.92"/>`
  )
}

/**
 * A 牌坊 fallen open — posts, a lintel, and half a roof.
 *
 * The Post Road's own blurb promises "relay stations standing open", and until
 * now the vignette drew none. It is the one built thing in the set, which is
 * what makes it the road's second silhouette without stealing anybody's first:
 * the marsh has verticals, the cliff diagonals, the market circles, the pass a
 * band, and none of them has a roofline.
 */
function ruin(x: number, base: number, w: number, h: number, op: number): string {
  const post = Math.max(1.6, w * 0.13)
  const out: string[] = [
    // Two posts and the lintel across them.
    `<rect x="${x.toFixed(1)}" y="${(base - h).toFixed(1)}" width="${post.toFixed(1)}" height="${h.toFixed(1)}" fill="${ink}" fill-opacity="${op.toFixed(2)}"/>`,
    `<rect x="${(x + w - post).toFixed(1)}" y="${(base - h).toFixed(1)}" width="${post.toFixed(1)}" height="${h.toFixed(1)}" fill="${ink}" fill-opacity="${op.toFixed(2)}"/>`,
    `<rect x="${x.toFixed(1)}" y="${(base - h).toFixed(1)}" width="${w.toFixed(1)}" height="${(h * 0.14).toFixed(1)}" fill="${ink}" fill-opacity="${op.toFixed(2)}"/>`,
  ]
  // The roof: a sagging line with its right end dropped, which is the whole of
  // "ruined". A level roof on the same posts reads as a gate still in service.
  out.push(
    `<path d="M ${(x - w * 0.22).toFixed(1)} ${(base - h * 1.02).toFixed(1)} Q ${(x + w * 0.5).toFixed(1)} ${(base - h * 1.3).toFixed(1)} ${(x + w * 1.18).toFixed(1)} ${(base - h * 0.86).toFixed(1)} L ${(x + w * 1.1).toFixed(1)} ${(base - h * 0.74).toFixed(1)} Q ${(x + w * 0.5).toFixed(1)} ${(base - h * 1.14).toFixed(1)} ${(x - w * 0.2).toFixed(1)} ${(base - h * 0.9).toFixed(1)} Z" fill="${ink}" fill-opacity="${op.toFixed(2)}"/>`,
  )
  return out.join('')
}

/** Scrub and rubble: flicked ink, dense at the root and thinning outward. */
function scatter(rng: Rng, cx: number, cy: number, w: number, n: number, op: number): string {
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    const t = rng.next()
    const x = cx + rng.range(-w, w) * (0.4 + t * 0.6)
    const y = cy + rng.range(-w * 0.1, w * 0.16)
    out.push(
      `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rng.range(0.8, 3.2).toFixed(1)}" ` +
        `ry="${rng.range(0.5, 1.6).toFixed(1)}" fill="${ink}" fill-opacity="${(op * rng.range(0.4, 1)).toFixed(2)}"/>`,
    )
  }
  return out.join('')
}

type Painter = (rng: Rng, s: VignetteSize) => string

const PAINTERS: Record<string, Painter> = {
  /**
   * 官道 — the only vanishing point in the set. Two strokes converging to a
   * point on the horizon is the cheapest possible drawing of "open ground and
   * somewhere to go", and no other region is allowed one.
   */
  road: (rng, s) => {
    const horizon = s.h * 0.58
    // Sky first, and it is most of the picture. The road's own blurb is about
    // open ground; a vignette where the ground starts two thirds of the way up
    // is a picture of a road, not of somewhere open.
    const out: string[] = [
      // The sun sits just clear of the hills so the mist can cross it. On the
      // horizon exactly it was bisected and read as a rising moon behind a
      // hill; a diameter above, it reads as low sun in haze.
      // The band FIRST and the sun punched into it. Paper on paper is nothing,
      // which is what the first attempt drew: a disc the same colour as the sky
      // it sat in. A sun in ink painting is not painted, it is LEFT — so there
      // has to be something for it to be left out of.
      mist(rng, s.w * 0.36, horizon - s.h * 0.14, s.w * 0.62, 0.3),
      mist(rng, s.w * 0.66, horizon - s.h * 0.115, s.w * 0.5, 0.24),
      // Bigger than it looks like it should be. At 0.032 of the height it was
      // technically present and practically invisible — a fourteen-unit disc
      // inside a band that wide is a smudge, not a sun.
      sun(s.w * 0.42, horizon - s.h * 0.125, s.h * 0.05),
      // One tight, dark band UNDER it. The sun only reads as bright against
      // something dark, and the wide soft bands above cannot supply that.
      mist(rng, s.w * 0.44, horizon - s.h * 0.075, s.w * 0.44, 0.34),
      hills(rng, s, s.h * 0.56),
      mist(rng, s.w * 0.5, horizon - s.h * 0.03, s.w * 0.95, 0.16),
      mist(rng, s.w * 0.2, horizon - s.h * 0.06, s.w * 0.5, 0.12),
    ]
    // A TRAPEZOID, not a triangle. Converging the verges all the way to a point
    // produced a filled shape with its apex in the sky, and every reading of it
    // was "a mountain" — the one silhouette this vignette must not own, since
    // the cliff already has it. A road keeps a width at the horizon.
    const lx = s.w * 0.1
    const rx = s.w * 0.9
    const fl = s.w * 0.44
    const fr = s.w * 0.56
    out.push(
      // The horizon itself, edge to edge, so the far end of the road is a place
      // the road ARRIVES at rather than a point it shrinks to.
      stroke(0, horizon, s.w, horizon, 1, 0.16),
      `<path d="M ${lx.toFixed(1)} ${s.h} L ${fl.toFixed(1)} ${horizon.toFixed(1)} L ` +
        `${fr.toFixed(1)} ${horizon.toFixed(1)} L ${rx.toFixed(1)} ${s.h} Z" ` +
        `fill="${hex(palette.paper)}" fill-opacity="0.75"/>`,
      curve(lx, s.h, fl, horizon, -2, 1.8, 0.22),
      curve(rx, s.h, fr, horizon, 2, 1.8, 0.22),
    )
    // Broken paving. The surface was one flat trapezoid, which reads as a ramp
    // rather than as a road that has not been repaired in years. Rows of dark
    // patches, thinning and flattening with distance, give it both texture and
    // the perspective the trapezoid only implies.
    for (let row = 0; row < 9; row++) {
      const t = Math.pow(row / 9, 1.5)
      const y = s.h + (horizon - s.h) * t
      const l = lx + (fl - lx) * t
      const r = rx + (fr - rx) * t
      const slabs = Math.max(2, Math.round(5 - t * 3))
      for (let i = 0; i < slabs; i++) {
        if (rng.next() > 0.72) continue
        const u = (i + rng.range(0.1, 0.9)) / slabs
        const w = ((r - l) / slabs) * rng.range(0.4, 0.85)
        out.push(
          `<ellipse cx="${(l + (r - l) * u).toFixed(1)}" cy="${y.toFixed(1)}" ` +
            `rx="${(w / 2).toFixed(1)}" ry="${Math.max(0.4, (1 - t) * 1.5).toFixed(1)}" ` +
            `fill="${ink}" fill-opacity="${(0.16 * (1 - t * 0.7)).toFixed(3)}"/>`,
        )
      }
    }

    // Scrub along both verges, heaviest near the camera.
    out.push(
      scatter(rng, lx, s.h * 0.94, s.w * 0.16, 14, 0.4),
      scatter(rng, rx, s.h * 0.9, s.w * 0.18, 16, 0.4),
      scatter(rng, (lx + fl) / 2, s.h * 0.78, s.w * 0.1, 9, 0.28),
    )

    // The ruined gate, on the rise to the right. Past the verge and above the
    // horizon line, so it reads as standing on higher ground rather than in the
    // road — which is where the blurb's relay stations are.
    out.push(
      scatter(rng, s.w * 0.83, horizon + s.h * 0.012, s.w * 0.1, 14, 0.3),
      ruin(s.w * 0.79, horizon + s.h * 0.008, s.w * 0.11, s.h * 0.062, 0.5),
    )

    // Milestones on the verges, outside the surface, shrinking with distance.
    // FEWER AND SMALLER, and none of them near the camera. At four a side and a
    // fifth of the frame tall they marched down both verges like fence posts
    // and became the loudest thing in the picture — a milestone is a detail
    // that tells you the road was maintained once, not the subject.
    for (let i = 0; i < 3; i++) {
      const t = 0.28 + (i / 3) * 0.6
      const hgt = s.h * (0.075 - t * 0.045)
      for (const side of [-1, 1]) {
        const near = side < 0 ? lx : rx
        const far = side < 0 ? fl : fr
        const x = near + (far - near) * t + side * 7
        const y = s.h + (horizon - s.h) * t
        out.push(
          `<rect x="${x.toFixed(1)}" y="${(y - hgt).toFixed(1)}" ` +
            `width="${Math.max(1.5, hgt * 0.26).toFixed(1)}" height="${hgt.toFixed(1)}" ` +
            `fill="${ink}" fill-opacity="${(0.5 - t * 0.3).toFixed(2)}"/>`,
        )
      }
    }
    for (let i = 0; i < 8; i++) {
      const x = rng.chance(0.5) ? rng.range(0, 0.12) * s.w : rng.range(0.88, 1) * s.w
      out.push(wash(x, rng.range(0.74, 0.96) * s.h, rng.range(4, 11), rng.range(1.5, 3.5), 0.08))
    }
    return out.join('')
  },

  /** 芦荡 — verticals. Reeds above head height, and the water keeps what it takes. */
  marsh: (rng, s) => {
    const out: string[] = [hills(rng, s, s.h * 0.52, 2)]
    for (let i = 0; i < 34; i++) {
      const x = rng.range(0, 1) * s.w
      const depth = rng.next()
      const top = s.h * (0.72 - depth * 0.5)
      out.push(
        curve(x, s.h * 0.98, x + rng.range(-7, 7), top, rng.range(-4, 4),
          0.8 + depth * 1.6, 0.12 + depth * 0.5),
      )
    }
    // Mist LAST but before the water: drawn under the far reeds it did nothing
    // at all, since there was nothing behind it to soften.
    out.push(
      `<rect x="0" y="${(s.h * 0.44).toFixed(1)}" width="${s.w}" height="${(s.h * 0.22).toFixed(1)}" ` +
        `fill="${hex(palette.paper)}" fill-opacity="0.5"/>`,
    )
    // Water: horizontals, and they must not touch the reed roots or the picture
    // stops reading as "standing in it".
    for (let i = 0; i < 5; i++) {
      const y = s.h * (0.86 + i * 0.03)
      out.push(stroke(rng.range(0, 0.4) * s.w, y, rng.range(0.6, 1) * s.w, y, 1, 0.1))
    }
    return out.join('')
  },

  /** 断崖 — diagonals. The road is half fallen, and the wind never stops. */
  cliff: (rng, s) => {
    const out: string[] = [hills(rng, s, s.h * 0.62, 2)]
    // The mass, as one angular body. Solid, because it is the near thing.
    out.push(
      `<path d="M 0 ${s.h} L 0 ${(s.h * 0.42).toFixed(1)} L ${(s.w * 0.2).toFixed(1)} ` +
        `${(s.h * 0.5).toFixed(1)} L ${(s.w * 0.3).toFixed(1)} ${(s.h * 0.36).toFixed(1)} L ` +
        `${(s.w * 0.42).toFixed(1)} ${s.h} Z" fill="${ink}" fill-opacity="0.72"/>`,
      `<path d="M ${s.w} ${s.h} L ${s.w} ${(s.h * 0.56).toFixed(1)} L ${(s.w * 0.82).toFixed(1)} ` +
        `${(s.h * 0.68).toFixed(1)} L ${(s.w * 0.7).toFixed(1)} ${s.h} Z" fill="${ink}" ` +
        `fill-opacity="0.5"/>`,
    )
    // A lone pine on the near edge — the one figurative mark in the vignette.
    // A LEANING trunk with drooping boughs. Drawn upright with three level
    // crossbars it came out as the character 丰 — a Chinese glyph accidentally
    // painted into the scenery, in the one project where that is a real hazard.
    const px = s.w * 0.27
    const py = s.h * 0.37
    const ph = s.h * 0.19
    out.push(curve(px, py, px + 5, py - ph, 4, 1.7, 0.72))
    for (let i = 0; i < 4; i++) {
      const t = 0.25 + i * 0.22
      const bx = px + 5 * t
      const by = py - ph * t
      const dir = i % 2 === 0 ? -1 : 1
      const reach = (10 - i * 1.4) * dir
      out.push(curve(bx, by, bx + reach, by + 3 + i, dir * 3, 1.2, 0.6))
    }
    // Wind. Long, thin, and all leaning the same way.
    for (let i = 0; i < 7; i++) {
      const y = rng.range(0.1, 0.55) * s.h
      const x = rng.range(0.25, 0.7) * s.w
      out.push(curve(x, y, x + rng.range(40, 95), y - rng.range(2, 12), rng.range(3, 9), 1, 0.14))
    }
    return out.join('')
  },

  /** 鬼市 — circles. A night market of paper offerings, lit from inside. */
  market: (rng, s) => {
    const out: string[] = [hills(rng, s, s.h * 0.7, 2)]
    // The line the lanterns hang from.
    const wire = s.h * 0.2
    out.push(curve(0, wire - 6, s.w, wire + 2, 7, 1, 0.2))
    for (let i = 0; i < 6; i++) {
      const t = (i + 0.5) / 6
      const x = t * s.w
      const y = wire + Math.sin(t * Math.PI) * 8 + rng.range(6, 16)
      const r = rng.range(5, 8.5)
      out.push(
        stroke(x, wire + Math.sin(t * Math.PI) * 8 - 2, x, y - r, 0.8, 0.25),
        `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${r.toFixed(1)}" ` +
          `ry="${(r * 1.15).toFixed(1)}" fill="${cinnabar}" fill-opacity="0.55"/>`,
        `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(r * 0.4).toFixed(1)}" ` +
          `ry="${(r * 0.5).toFixed(1)}" fill="${gold}" fill-opacity="0.7"/>`,
      )
    }
    // Paper figures below: flat, headed, and not quite people.
    for (let i = 0; i < 7; i++) {
      const x = rng.range(0.05, 0.95) * s.w
      const hgt = rng.range(0.2, 0.4) * s.h
      const w = hgt * 0.34
      out.push(
        `<path d="M ${(x - w / 2).toFixed(1)} ${s.h} L ${(x - w * 0.36).toFixed(1)} ` +
          `${(s.h - hgt).toFixed(1)} L ${(x + w * 0.36).toFixed(1)} ${(s.h - hgt).toFixed(1)} L ` +
          `${(x + w / 2).toFixed(1)} ${s.h} Z" fill="${ink}" fill-opacity="0.6"/>`,
        `<circle cx="${x.toFixed(1)}" cy="${(s.h - hgt - w * 0.3).toFixed(1)}" ` +
          `r="${(w * 0.3).toFixed(1)}" fill="${ink}" fill-opacity="0.6"/>`,
      )
    }
    return out.join('')
  },

  /** 关隘 — one horizontal band. A gate held for eleven years. */
  pass: (rng, s) => {
    const out: string[] = [hills(rng, s, s.h * 0.44, 3)]
    const top = s.h * 0.52
    out.push(
      `<rect x="0" y="${top.toFixed(1)}" width="${s.w}" height="${(s.h - top).toFixed(1)}" ` +
        `fill="${ink}" fill-opacity="0.68"/>`,
    )
    // Crenellations, and the gate arch — the only opening in the set.
    for (let x = 0; x < s.w; x += s.w / 13) {
      out.push(
        `<rect x="${x.toFixed(1)}" y="${(top - 7).toFixed(1)}" width="${(s.w / 26).toFixed(1)}" ` +
          `height="8" fill="${ink}" fill-opacity="0.68"/>`,
      )
    }
    const gx = s.w * 0.5
    const gw = s.w * 0.11
    out.push(
      `<path d="M ${(gx - gw).toFixed(1)} ${s.h} L ${(gx - gw).toFixed(1)} ` +
        `${(top + s.h * 0.16).toFixed(1)} Q ${gx.toFixed(1)} ${(top + s.h * 0.03).toFixed(1)} ` +
        `${(gx + gw).toFixed(1)} ${(top + s.h * 0.16).toFixed(1)} L ${(gx + gw).toFixed(1)} ` +
        `${s.h} Z" fill="${hex(palette.paper)}" fill-opacity="0.9"/>`,
    )
    // Banners on the wall. Cinnabar, because this is the one place with a side.
    for (let i = 0; i < 4; i++) {
      const x = s.w * (0.12 + i * 0.23) + rng.range(-6, 6)
      if (Math.abs(x - gx) < gw * 1.6) continue
      out.push(
        `<path d="M ${x.toFixed(1)} ${(top + 5).toFixed(1)} L ${(x + 11).toFixed(1)} ` +
          `${(top + 5).toFixed(1)} L ${(x + 11).toFixed(1)} ${(top + 5 + s.h * 0.26).toFixed(1)} L ` +
          `${(x + 5.5).toFixed(1)} ${(top + 5 + s.h * 0.21).toFixed(1)} L ${x.toFixed(1)} ` +
          `${(top + 5 + s.h * 0.26).toFixed(1)} Z" fill="${cinnabar}" fill-opacity="0.7"/>`,
      )
    }
    return out.join('')
  },
}

/** True when a region has its own painter. The map falls back to a plain wash. */
export const hasVignette = (regionId: string): boolean => regionId in PAINTERS

/**
 * The vignette for a region, as an SVG fragment in a `0 0 w h` user space.
 *
 * `seed` exists for the sheets, which draw the same place twice at two sizes
 * and want the same composition both times.
 */
export function regionVignette(regionId: string, size: VignetteSize, seed = 0x5eed): string {
  const paint = PAINTERS[regionId]
  const rng = new Rng(seed ^ regionId.length * 2654435761)
  if (!paint) return wash(size.w / 2, size.h * 0.8, size.w * 0.4, size.h * 0.25, 0.1)
  return paint(rng, size)
}
