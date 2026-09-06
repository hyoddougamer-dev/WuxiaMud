/**
 * The swarm, drawn as sprites rather than as polygons rebuilt every frame.
 *
 * WHY, AND THE MEASUREMENT THAT FORCED IT. Enemies were drawn by clearing one
 * Graphics and re-submitting every polygon of every body, every frame, which
 * makes Pixi re-triangulate the whole crowd sixty times a second. The cost of
 * that, measured in `bench/crowd.ts` against the same silhouettes:
 *
 *     enemies   Graphics   Sprites
 *          50      3.1ms     0.1ms
 *         150      9.5ms     0.1ms
 *         300     18.1ms     0.2ms
 *         420     27.3ms     0.3ms      (a 60fps frame is 16.7ms)
 *
 * It is linear in the crowd and it eats the entire frame budget somewhere past
 * two hundred and eighty bodies — which is precisely the report from a real
 * phone: fine at first, 21 to 30 fps LATE in a run.
 *
 * Nobody caught it because every performance number this project ever printed
 * was taken on an empty field. `tools/perf.mts` plays a real expedition but
 * gives the game no input, so the swordsman stands still, the swarm walks into
 * the sweep and dies, and the probe peaked at TWENTY-THREE enemies across a
 * hundred and fifty seconds. The instrument was sound and the scenario was not.
 *
 * A silhouette is rasterised once per kind and every body of that kind is one
 * sprite, which Pixi batches into a single draw call. Moving a sprite is two
 * numbers. Everything the old loop varied per body survives:
 *
 *   the hit flash   `tint`, which is free — it was a per-frame colour mix
 *   the idle sway   an offset on x, as before
 *   the alpha       baked into the texture, since it never varied per body
 *
 * WHAT DOES NOT BELONG HERE. Anything drawn for ONE enemy at a time — a
 * charger's windup lane, a boss's ring — stays in Graphics: it is rare, it is
 * geometry that genuinely changes, and moving it here would cost a texture per
 * frame of animation to save nothing.
 */
import { Container, Graphics, Rectangle, Sprite, Texture, type Renderer } from 'pixi.js'
import type { EnemyArt } from './enemyArt'

/**
 * Supersampling for the rasterised silhouettes.
 *
 * The bodies are drawn at world scale and the camera never zooms, so 2 is
 * enough to stay crisp on a 3x-DPR phone without paying for a texture nobody
 * can see the detail of. See stage.ts, which caps the renderer at 2 for the
 * same reason.
 */
const TEXTURE_RESOLUTION = 2

interface Baked {
  texture: Texture
  /** Where the enemy's ORIGIN sits inside the texture, as 0..1 anchors. */
  anchorX: number
  anchorY: number
}

export class Crowd {
  readonly view = new Container()
  private readonly baked = new Map<string, Baked>()
  private readonly sprites: Sprite[] = []
  private readonly atlas: Texture
  private readonly capacity: number
  private used = 0

  /**
   * `capacity` is the enemy pool's ceiling: the sprites are all made once here
   * rather than as the crowd grows, because allocating a display object inside
   * the wave that is already costing frames is the worst possible moment.
   */
  constructor(renderer: Renderer, art: ReadonlyMap<string, EnemyArt>, capacity: number) {
    // ONE TEXTURE FOR EVERY KIND, and this is not a tidiness choice.
    //
    // The first version generated a texture per kind. It was correct and it was
    // SLOWER than the polygons it replaced — 14fps against 24 in the shoot
    // harness, with the draw-call counter going from 50 to 83 on a field of
    // nine. A sprite batch breaks whenever the base texture changes, and with a
    // texture per kind a mixed crowd breaks it on nearly every body, so the
    // whole point of using sprites was being paid for and never collected.
    //
    // Laid out side by side in one atlas, every sprite shares a base texture
    // and the entire crowd is one draw call however many kinds are in it.
    const pad = 2
    const laid: Array<{ id: string; g: Graphics; x: number; w: number; h: number; ox: number; oy: number }> = []
    let width = 0
    let height = 0
    for (const [id, a] of art) {
      const g = new Graphics()
      for (const s of a.body) {
        // Copied: Pixi keeps the array BY REFERENCE inside the Polygon it
        // builds, and these polygons are shared with anything else drawing
        // this kind.
        g.poly([...s.poly]).fill({ color: 0xffffff, alpha: s.alpha })
      }
      // The bounds of the strokes, in the units the polygons are written in —
      // the origin is (0,0) and the body hangs ABOVE it, so minY is negative
      // and the anchor lands near the feet. Computing it rather than assuming
      // it is what keeps a sprite standing where the polygon stood.
      const b = g.getLocalBounds()
      const w = Math.max(1, Math.ceil(b.width))
      const h = Math.max(1, Math.ceil(b.height))
      laid.push({ id, g, x: width, w, h, ox: -b.x, oy: -b.y })
      // Placed at the origin of its cell, so the frame maths below is the
      // cell's rectangle and nothing else.
      g.x = width - b.x
      g.y = -b.y
      width += w + pad
      height = Math.max(height, h)
    }

    const sheet = new Container()
    for (const l of laid) sheet.addChild(l.g)
    this.atlas = renderer.generateTexture({
      target: sheet,
      resolution: TEXTURE_RESOLUTION,
      frame: new Rectangle(0, 0, Math.max(1, width), Math.max(1, height)),
    })
    for (const l of laid) {
      this.baked.set(l.id, {
        // IN TEXTURE SPACE, NOT IN SOURCE PIXELS. A frame is expressed in the
        // same units the atlas was laid out in; the source's `resolution`
        // already accounts for the supersampling. Multiplying by it here
        // double-counted, every frame landed off the end of the sheet, and the
        // whole crowd rendered as slivers a few pixels wide — which the tests
        // did not notice, because nothing asserted that an enemy is DRAWN.
        texture: new Texture({
          source: this.atlas.source,
          frame: new Rectangle(l.x, 0, l.w, l.h),
        }),
        anchorX: l.ox / l.w,
        anchorY: l.oy / l.h,
      })
    }
    sheet.destroy({ children: true })

    this.capacity = capacity
  }

  /** Starts a frame. Every body drawn after this is one `place` call. */
  begin(): void {
    this.used = 0
  }

  place(kindId: string, x: number, y: number, tint: number): void {
    const baked = this.baked.get(kindId)
    // An unknown kind draws nothing rather than throwing: a save or a roster
    // change should cost a silhouette, never the run.
    if (!baked || this.used >= this.capacity) return
    // GROWN ON DEMAND, NEVER SHRUNK, and this is the whole difference between
    // this being faster and slower than the polygons it replaced. Making all
    // 420 up front cost more than it saved: a scene of nine enemies still
    // carried four hundred and eleven display objects for the renderer to walk
    // every frame, and the harness measured 14fps against 24. Grown lazily the
    // list is the high-water mark of the run and nothing more. A Sprite on a
    // shared atlas is a few numbers to allocate — the expensive part, the
    // texture, was paid once in the constructor.
    if (this.used >= this.sprites.length) {
      const fresh = new Sprite()
      this.view.addChild(fresh)
      this.sprites.push(fresh)
    }
    const s = this.sprites[this.used++]!
    if (s.texture !== baked.texture) {
      s.texture = baked.texture
      s.anchor.set(baked.anchorX, baked.anchorY)
    }
    s.x = x
    s.y = y
    // Guarded: in Pixi a tint assignment is a setter that dirties the sprite
    // whether or not the value changed, and the value is the SAME on every
    // enemy that is not currently flashing — which is nearly all of them,
    // nearly all of the time.
    if (s.tint !== tint) s.tint = tint
    if (!s.visible) s.visible = true
  }

  /** Hides whatever the last frame used and this one did not. */
  end(): void {
    for (let i = this.used; i < this.sprites.length; i++) {
      const s = this.sprites[i]!
      if (!s.visible) break
      s.visible = false
    }
  }

  destroy(): void {
    for (const b of this.baked.values()) b.texture.destroy(false)
    this.atlas.destroy(true)
    this.view.destroy({ children: true })
  }
}
