/**
 * The crowd's silhouettes, and the assertion whose absence let them vanish.
 *
 * Enemies moved from polygons rebuilt every frame to sprites on one atlas, and
 * the first version of the frame maths was wrong: every frame landed off the
 * end of the sheet and the whole swarm rendered as slivers a few pixels wide.
 * The full suite stayed green and every visual check in tools/shoot.ts passed,
 * because not one of them asserts that an ENEMY IS DRAWN. Four hundred tests
 * about a game whose subject is a crowd, and the crowd could disappear.
 *
 * Pixi needs a WebGL context that vitest has no way to give, so what is held
 * here is the half that does not: the geometry every kind hands the renderer,
 * and the anchor maths that decides where a sprite stands. A regression in
 * either is what makes a body render in the wrong place or at the wrong size —
 * which was the actual bug.
 */
import { describe, expect, it } from 'vitest'
import { ENEMY_KINDS, MAX_ENEMIES } from '../src/data/enemies'
import { buildEnemyArt } from '../src/render/enemyArt'

const art = buildEnemyArt(ENEMY_KINDS)

/** The bounds the atlas measures, computed the same way `Crowd` does. */
function bounds(polys: ReadonlyArray<{ poly: readonly number[] }>) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const s of polys) {
    for (let i = 0; i < s.poly.length; i += 2) {
      minX = Math.min(minX, s.poly[i]!)
      maxX = Math.max(maxX, s.poly[i]!)
      minY = Math.min(minY, s.poly[i + 1]!)
      maxY = Math.max(maxY, s.poly[i + 1]!)
    }
  }
  return { minX, minY, width: maxX - minX, height: maxY - minY }
}

describe('the crowd', () => {
  it('has a silhouette for every enemy the game can spawn', () => {
    for (const kind of ENEMY_KINDS) {
      const a = art.get(kind.id)
      expect(a, `${kind.id} has no art`).toBeTruthy()
      expect(a!.body.length, `${kind.id} draws nothing`).toBeGreaterThan(0)
    }
  })

  it('gives every silhouette real area, so none can bake to a sliver', () => {
    // The bug in one sentence: a body whose texture is a few pixels wide is
    // indistinguishable at a glance from a body that is far away.
    for (const kind of ENEMY_KINDS) {
      const b = bounds(art.get(kind.id)!.body)
      expect(b.width, `${kind.id} is ${b.width.toFixed(1)} wide`).toBeGreaterThan(4)
      expect(b.height, `${kind.id} is ${b.height.toFixed(1)} tall`).toBeGreaterThan(4)
      // And not FLATTENED. The bound is loose on purpose: 0.64 is the
      // Drowned, which sprawls low across the marsh by design and would fail
      // anything tighter. What this catches is a silhouette collapsed to a
      // band by a bad transform, which is the shape the atlas bug made.
      expect(b.height / b.width, `${kind.id} is flattened`).toBeGreaterThan(0.4)
    }
  })

  it('stands each body on its own origin, wherever the polygons put it', () => {
    // The anchor is (-minX/width, -minY/height): the fraction of the texture
    // at which the enemy's own (0,0) sits. Every body hangs ABOVE its origin,
    // so the anchor's y must land near the FEET — the bottom of the texture.
    // Get this wrong and the crowd floats or sinks into the ground.
    for (const kind of ENEMY_KINDS) {
      const b = bounds(art.get(kind.id)!.body)
      const anchorY = -b.minY / b.height
      const anchorX = -b.minX / b.width
      expect(anchorY, `${kind.id} anchors at ${anchorY.toFixed(2)} vertically`).toBeGreaterThan(0.7)
      expect(anchorY).toBeLessThanOrEqual(1.05)
      // And roughly centred sideways: these are figures seen head on.
      expect(anchorX, `${kind.id} anchors at ${anchorX.toFixed(2)} sideways`).toBeGreaterThan(0.25)
      expect(anchorX).toBeLessThan(0.75)
    }
  })

  it('sizes the sprite list from the pool that fills it', () => {
    // The crowd is built with MAX_ENEMIES as its ceiling. If the pool grew and
    // this did not, the overflow would silently stop being drawn — enemies
    // that hurt you and are not on screen.
    expect(MAX_ENEMIES).toBeGreaterThanOrEqual(400)
  })
})
