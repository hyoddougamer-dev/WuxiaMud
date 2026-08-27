/**
 * Pixi application and layer setup.
 *
 * Layer order is fixed here so nothing later has to guess a z-index:
 *   ground -> world (entities, sorted by y) -> vfx -> overlay
 */
import { Application, Container, Texture, TilingSprite } from 'pixi.js'
import { createPaperTexture } from './paper'
import { palette } from './palette'

export interface Stage {
  app: Application
  ground: TilingSprite
  world: Container
  vfx: Container
  overlay: Container
  width: number
  height: number
}

export async function createStage(host: HTMLElement): Promise<Stage> {
  const app = new Application()

  await app.init({
    background: palette.ink,
    antialias: true,
    // Cap the resolution: a 3x-DPR phone renders 9x the pixels of a 1x one for
    // no visible gain on brush shapes, and that alone can halve the frame rate.
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
    resizeTo: host,
    powerPreference: 'high-performance',
  })

  host.appendChild(app.canvas)

  const paper = Texture.from(createPaperTexture())
  const ground = new TilingSprite({
    texture: paper,
    width: app.screen.width,
    height: app.screen.height,
  })

  const world = new Container()
  // Entities are drawn back-to-front by their y, so a figure lower on screen
  // correctly overlaps one standing behind it.
  world.sortableChildren = true

  const vfx = new Container()
  const overlay = new Container()

  app.stage.addChild(ground, world, vfx, overlay)

  const stage: Stage = {
    app,
    ground,
    world,
    vfx,
    overlay,
    width: app.screen.width,
    height: app.screen.height,
  }

  const onResize = () => {
    stage.width = app.screen.width
    stage.height = app.screen.height
    ground.width = app.screen.width
    ground.height = app.screen.height
  }
  app.renderer.on('resize', onResize)
  onResize()

  return stage
}
