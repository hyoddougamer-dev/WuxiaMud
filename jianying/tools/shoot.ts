/**
 * Screenshot / video harness.
 *
 * This is the project's substitute for a device screen. The build machine has
 * no Android SDK and no emulator, so without this the art and the motion would
 * be written blind and only inspected after an APK install — a loop far too
 * slow to tune feel against.
 *
 *   npx tsx tools/shoot.ts               # hub, then three stills in play
 *   npx tsx tools/shoot.ts --video       # also record a webm
 *   npx tsx tools/shoot.ts --full        # play until death, verify the reward
 *   npx tsx tools/shoot.ts --url=http://127.0.0.1:5273
 *
 * `--full` is slow (an expedition runs in real time) and is the acceptance
 * check for the meta loop: it stands in the crowd until the character dies,
 * then asserts that the end screen appeared and that the permanent level
 * actually moved. Nothing cheaper can prove an expedition converts into
 * progress, because every part of that conversion happens after death.
 *
 * Defaults to the production build in dist/ (served statically) so what is
 * captured is what ships, not what the dev server transforms.
 */
import { chromium, type Browser, type Page } from 'playwright'
import { createServer, type Server } from 'node:http'
import { readFile, mkdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DIST = join(ROOT, 'dist')
const OUT = join(ROOT, 'shots')

// Pixel 5 — a realistic mid-range portrait target, not a flagship.
const VIEWPORT = { width: 393, height: 851 }
const DPR = 2.625

/** Preinstalled browser; overridable with CHROMIUM_PATH, empty to let Playwright choose. */
const CHROMIUM = existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
}

function serveDist(port: number): Promise<Server> {
  const server = createServer(async (req, res) => {
    try {
      const url = (req.url ?? '/').split('?')[0]!
      const rel = url === '/' ? '/index.html' : url
      // Contain path traversal: resolve inside DIST or refuse.
      const file = join(DIST, normalize(rel).replace(/^(\.\.[/\\])+/, ''))
      if (!file.startsWith(DIST) || !existsSync(file)) {
        res.writeHead(404).end('not found')
        return
      }
      const body = await readFile(file)
      res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' })
      res.end(body)
    } catch (err) {
      res.writeHead(500).end(String(err))
    }
  })
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)))
}

/** Waits for main.ts to flag that a real frame has been presented. */
async function waitForFirstFrame(page: Page): Promise<void> {
  await page.waitForFunction(() => document.body.dataset.ready === '1', undefined, {
    timeout: 20_000,
  })
}

async function readFps(page: Page): Promise<number> {
  const text = (await page.locator('#hud').textContent()) ?? ''
  return Number.parseInt(text, 10) || 0
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const wantVideo = args.includes('--video')
  const wantFull = args.includes('--full')
  const urlArg = args.find((a) => a.startsWith('--url='))?.slice('--url='.length)

  let server: Server | undefined
  let url = urlArg
  if (!url) {
    if (!existsSync(join(DIST, 'index.html'))) {
      console.error('dist/ is missing — run `npm run build` first.')
      process.exitCode = 1
      return
    }
    server = await serveDist(4599)
    url = 'http://127.0.0.1:4599/'
  }

  await rm(OUT, { recursive: true, force: true })
  await mkdir(OUT, { recursive: true })

  const chromiumPath = process.env.CHROMIUM_PATH ?? CHROMIUM

  let browser: Browser | undefined
  try {
    browser = await chromium.launch({
      // Use the Chromium already on the machine rather than the build revision
      // this Playwright version would otherwise download — the container ships
      // one and has no route to fetch another.
      ...(chromiumPath ? { executablePath: chromiumPath } : {}),
      // The sandbox is unavailable in this container; the page is our own build.
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    })
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: DPR,
      isMobile: true,
      hasTouch: true,
      colorScheme: 'dark',
      ...(wantVideo ? { recordVideo: { dir: OUT, size: VIEWPORT } } : {}),
    })
    const page = await context.newPage()

    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(String(e)))
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text())
    })

    await page.goto(url, { waitUntil: 'load' })
    await waitForFirstFrame(page)

    // --- the way in ------------------------------------------------------
    // title -> create -> codex -> hub on a first launch, which is what the
    // harness always is: each context starts with empty storage.
    await page.waitForFunction(() => document.body.dataset.screen === 'title', undefined, {
      timeout: 15_000,
    })
    await page.waitForTimeout(600)
    await page.screenshot({ path: join(OUT, 'title.png') })

    await page.locator('.title-go').click()
    await page.waitForFunction(() => document.body.dataset.screen === 'create', undefined, {
      timeout: 10_000,
    })
    await page.waitForTimeout(400)
    await page.screenshot({ path: join(OUT, 'create.png') })

    // The appearance controls, and proof that they reach the figure. Two of
    // these — man or woman, and the dye — were asked for by name, and a control
    // that changes a stored field but not the drawing would photograph as a
    // working screen while doing nothing.
    const dyes = page.locator('.dye-chip')
    const dyeCount = await dyes.count()
    const bearings = page.locator('.look-chips').first().locator('.look-chip')
    const bearingCount = await bearings.count()
    if (dyeCount > 0) {
      const before = await page.locator('.create-portrait svg').innerHTML()
      // A dyed robe and the other bearing, then back to the top to photograph
      // the figure they produce.
      await dyes.nth(2).click()
      await bearings.nth(1).click()
      await page.waitForTimeout(250)
      const after = await page.locator('.create-portrait svg').innerHTML()
      await page.locator('.create-scroll').evaluate((el) => (el.scrollTop = 0))
      await page.waitForTimeout(250)
      await page.screenshot({ path: join(OUT, 'create-dyed.png') })
      const dyed = /fill="#(2e4a6b|9e2b2b|40614a|8a5a2b|4a3355)"/.test(after)
      console.log(
        `look:   ${bearingCount} bearings, ${dyeCount} dyes — figure ${
          after !== before ? 'redraws' : 'DID NOT CHANGE'
        }, robe ${dyed ? 'dyed' : 'NOT DYED'}`,
      )
      if (after === before || !dyed) {
        console.warn('warn:   an appearance control is not reaching the figure')
      }
    } else {
      console.warn('warn:   no dye chips on the creation screen')
    }

    // Pick a non-default origin, so the grant is visible in the hub that
    // follows rather than being indistinguishable from a blank character.
    await page.locator('.origin').nth(2).click()
    await page.waitForTimeout(200)
    const chosenName = (await page.locator('.create-input').inputValue()) || '(blank)'
    await page.locator('.create-go').click()

    await page.waitForFunction(() => document.body.dataset.screen === 'codex', undefined, {
      timeout: 10_000,
    })
    await page.waitForTimeout(400)
    await page.screenshot({ path: join(OUT, 'codex.png') })
    await page.locator('.codex-go').click()

    // --- the hub ---------------------------------------------------------
    await page.waitForFunction(() => document.body.dataset.screen === 'hub', undefined, {
      timeout: 10_000,
    })
    await page.waitForTimeout(500)
    await page.screenshot({ path: join(OUT, 'hub.png') })
    console.log(`made:   ${chosenName}`)

    // Spend the starting point. This also proves the attribute button is
    // reachable — the same class of bug as the invisible overlay below would
    // leave a player unable to spend anything they earn.
    const addButton = page.locator('.attr-add:not([disabled])').first()
    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click()
      await page.waitForTimeout(200)
      await page.screenshot({ path: join(OUT, 'hub-spent.png') })
    } else {
      console.warn('warn:   no attribute point available to spend')
    }

    // The hub is three tabs now, so one screenshot can only ever show a third
    // of it. Walking them also proves the tab bar actually switches panes —
    // a bar that looks right and does nothing would photograph identically.
    const tabs = page.locator('.hub-tabs .tab')
    const tabCount = await tabs.count()
    for (let i = 0; i < tabCount; i++) {
      await tabs.nth(i).click()
      await page.waitForTimeout(220)
      await page.screenshot({ path: join(OUT, `hub-${i + 1}.png`) })
    }
    // The world tab is last, and the map must have all five places on it.
    const placeCount = await page.locator('.place').count()
    // Back to the swordsman, so what follows starts where a player would.
    await tabs.first().click()
    await page.waitForTimeout(200)
    console.log(`hub:    ${tabCount} tabs, ${placeCount} places`)
    if (tabCount !== 3) console.warn('warn:   expected three tabs')
    if (placeCount !== 5) console.warn('warn:   expected five places on the world tab')

    // The swordsman must actually be drawn. This is the check that would have
    // caught the whole reason for this redesign: a hub that describes your
    // equipment in words and never shows it.
    const portraitPolys = await page
      .locator('.pane .portrait-svg polygon')
      .count()
      .catch(() => 0)
    console.log(`figure: ${portraitPolys} ink strokes`)
    if (portraitPolys < 8) console.warn('warn:   the hub is not drawing the swordsman')

    // Character creation used to be reachable ONLY when no save existed, which
    // meant that from the second launch onward the school picker could not be
    // opened by any route. It was reported as "there is no character creation"
    // and that was exactly right. This walks the way back to it, and checks the
    // dialogue defaults to keeping rather than discarding.
    await page.locator('.hub-again').click()
    await page.waitForSelector('.confirm', { timeout: 4000 })
    await page.screenshot({ path: join(OUT, 'hub-discard.png') })
    await page.locator('.confirm-keep').click()
    await page.waitForTimeout(200)
    const keptCharacter = await page.locator('.confirm').count()
    const stillOnHub = await page.locator('.hub-tabs').isVisible()
    console.log(`again:  reachable, keep ${keptCharacter === 0 && stillOnHub ? 'ok' : 'BROKEN'}`)
    if (keptCharacter !== 0 || !stillOnHub) {
      console.warn('warn:   dismissing the discard dialogue did not return to the hub')
    }

    const levelBefore = await page.evaluate(() => Number(document.body.dataset.level ?? '0'))

    await page.locator('.hub-go').click()
    await page.waitForFunction(() => document.body.dataset.screen === 'run', undefined, {
      timeout: 10_000,
    })
    await page.waitForTimeout(700)

    // Drive the character with synthetic touches. Screenshotting an idle
    // character says nothing about how movement looks, and movement is the
    // whole reason this harness exists.
    const cx = VIEWPORT.width / 2
    const cy = VIEWPORT.height * 0.72
    const strides: Array<[number, number, string]> = [
      [70, -30, 'direita'],
      [-70, 40, 'esquerda-baixo'],
      [10, -75, 'cima'],
    ]

    /** Player position as the page reports it, in world units. */
    const readPos = async (): Promise<[number, number]> => {
      const d = await page.evaluate(() => [
        Number(document.body.dataset.px ?? '0'),
        Number(document.body.dataset.py ?? '0'),
      ])
      return [d[0]!, d[1]!]
    }

    let moved = 0
    for (let i = 0; i < strides.length; i++) {
      const [dx, dy] = strides[i]!
      const before = await readPos()

      await page.touchscreen.tap(cx, cy) // settle any prior gesture
      await page.mouse.move(cx, cy)
      await page.mouse.down()
      await page.mouse.move(cx + dx, cy + dy, { steps: 8 })
      // Long enough to reach full speed, so the sash and lean are developed.
      await page.waitForTimeout(1100)
      await page.screenshot({ path: join(OUT, `frame-${i + 1}.png`) })
      await page.mouse.up()
      await page.waitForTimeout(250)

      const after = await readPos()
      moved = Math.max(moved, Math.hypot(after[0] - before[0], after[1] - before[1]))

      // Levelling pauses the game behind a choice. Left unanswered, every
      // later stride would push against a frozen simulation and the harness
      // would report input as broken.
      const card = page.locator('.levelup .card').first()
      if (await card.isVisible().catch(() => false)) {
        await card.click()
        await page.waitForTimeout(150)
      }
    }

    // A screenshot cannot tell a moving character from a stationary one, so
    // input has to be asserted separately. It was not, and a full-screen
    // invisible overlay that ate every touch shipped to a device: the game ran,
    // the sword killed, and the player could not move a step.
    if (moved < 20) {
      console.error(`\ninput is not reaching the game — player moved ${moved.toFixed(1)} units`)
      process.exitCode = 1
      return
    }
    console.log(`input:  ok (moved ${moved.toFixed(0)} world units)`)

    await page.waitForTimeout(1500)
    const fps = await readFps(page)
    const hud = await page.locator('#hud').textContent()

    // --- the whole loop, end to end --------------------------------------
    if (wantFull) {
      console.log('full:   standing in the crowd until the expedition ends...')
      const deadline = Date.now() + 260_000
      while (Date.now() < deadline) {
        if ((await page.evaluate(() => document.body.dataset.screen)) === 'over') break
        // A level-up freezes the field behind a choice; left unanswered the
        // character would stand safely inside a menu and never die.
        const card = page.locator('.levelup .card').first()
        if (await card.isVisible().catch(() => false)) await card.click()
        await page.waitForTimeout(1000)
      }

      const over = await page.locator('.over').isVisible().catch(() => false)
      if (!over) {
        console.error('\nthe expedition never ended — no end screen inside the deadline')
        process.exitCode = 1
        return
      }
      await page.waitForTimeout(600)
      await page.screenshot({ path: join(OUT, 'reward.png') })

      const total = (await page.locator('.rw-total b').textContent()) ?? '0'
      const cause = (await page.locator('.over-cause').textContent()) ?? ''
      console.log(`reward: ${total.trim()} cultivation · ${cause.trim() || 'no cause shown'}`)

      await page.locator('.over-again').click()
      await page.waitForFunction(() => document.body.dataset.screen === 'hub', undefined, {
        timeout: 10_000,
      })
      await page.waitForTimeout(600)
      await page.screenshot({ path: join(OUT, 'hub-after.png') })

      const levelAfter = await page.evaluate(() => Number(document.body.dataset.level ?? '0'))
      // The single assertion that matters for this whole feature: an expedition
      // has to leave something behind. If this passes, the loop is closed.
      if (levelAfter <= levelBefore) {
        console.error(
          `\nthe expedition left nothing behind — level ${levelBefore} before, ${levelAfter} after`,
        )
        process.exitCode = 1
        return
      }
      console.log(`level:  ${levelBefore} -> ${levelAfter}`)

      // And it has to still be there after the app is closed and reopened,
      // which is the entire claim the persistent character makes. A reload is
      // the closest this harness gets to killing the app on a phone.
      await page.reload({ waitUntil: 'load' })
      await waitForFirstFrame(page)
      // A returning player lands on the title with a Continue button, not back
      // in character creation — being asked to pick an origin again would look
      // exactly like the save had been lost.
      await page.waitForFunction(() => document.body.dataset.screen === 'title', undefined, {
        timeout: 15_000,
      })
      const continueLabel = (await page.locator('.title-go').textContent())?.trim() ?? ''
      if (!/continue/i.test(continueLabel)) {
        console.error(`\nreturning player was offered "${continueLabel}", not Continue`)
        process.exitCode = 1
        return
      }
      await page.screenshot({ path: join(OUT, 'title-returning.png') })
      await page.locator('.title-go').click()
      await page.waitForFunction(() => document.body.dataset.screen === 'hub', undefined, {
        timeout: 10_000,
      })
      const levelReloaded = await page.evaluate(() => Number(document.body.dataset.level ?? '0'))
      if (levelReloaded !== levelAfter) {
        console.error(
          `\nprogress did not survive a reload — ${levelAfter} before, ${levelReloaded} after`,
        )
        process.exitCode = 1
        return
      }
      console.log(`saved:  ok (level ${levelReloaded} survived a reload)`)
    }

    await context.close()

    console.log(`hud:    ${hud?.trim()}`)
    console.log(`fps:    ${fps}`)
    console.log(`shots:  ${OUT}`)
    if (errors.length) {
      console.error(`\npage errors (${errors.length}):`)
      for (const e of errors.slice(0, 10)) console.error(`  ${e}`)
      process.exitCode = 1
      return
    }
    // This number is NOT a prediction of on-device frame rate.
    //
    // The container has no GPU, so Chromium falls back to SwiftShader and
    // rasterises every pixel on the CPU. Measured here across device scales:
    //   0.33M px -> 15 fps | 0.75M px -> 7 fps | 2.31M px -> 4 fps
    // That is a near-constant ~5-9 Mpx/s, i.e. purely fill-rate bound, which is
    // a property of the software rasteriser and not of the game's logic. A
    // phone GPU clears that by orders of magnitude.
    //
    // So this floor is only a smoke test for "the loop still runs". The real
    // 55fps-at-400-entities budget has to be measured on the device.
    if (fps < 3) {
      console.error(`\nfps ${fps} is below the software-rendering smoke floor of 3`)
      process.exitCode = 1
    }
  } finally {
    await browser?.close()
    server?.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
