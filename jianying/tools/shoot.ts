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
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'
import { createServer, type Server } from 'node:http'
import { readFile, mkdir, rm } from 'node:fs/promises'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DIST = join(ROOT, 'dist')

/** Most recent mtime under a directory, so a stale bundle can be detected. */
function newestSourceTime(dir: string): number {
  let newest = 0
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    newest = Math.max(newest, entry.isDirectory() ? newestSourceTime(path) : statSync(path).mtimeMs)
  }
  return newest
}
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

/**
 * A save written by the previous build, exactly as v1 wrote it: the file WAS
 * the character, and `owned` was a list of bare ids.
 */
const V1_SAVE = JSON.stringify({
  name: 'Wen Zhaoyi',
  origin: 'mountain',
  level: 7,
  xp: 40,
  points: 3,
  runs: 5,
  depth: 2,
  taught: true,
  inventory: {
    owned: ['r-plain', 's-plain', 'h-topknot', 'w-jian', 'r-travelling'],
    equipped: { robe: 'r-travelling', shoulders: 's-plain', head: 'h-topknot', weapon: 'w-jian' },
  },
})

/**
 * Boots once with a v1 save in storage and asserts the swordsman came through.
 *
 * Runs in its own browser context so it cannot leave state behind for the
 * screenshots that follow.
 */
async function migrationCheck(parent: BrowserContext, url: string): Promise<void> {
  const context = await parent.browser()!.newContext({ viewport: VIEWPORT })
  try {
    const page = await context.newPage()
    await page.addInitScript(
      ([key, value]) => {
        try {
          window.localStorage.setItem(key!, value!)
        } catch {
          /* private mode; the assertion below will report it */
        }
      },
      ['jianying.character.v1', V1_SAVE],
    )
    await page.goto(url, { waitUntil: 'load' })
    await waitForFirstFrame(page)
    await page.waitForFunction(() => document.body.dataset.screen !== undefined, undefined, {
      timeout: 15_000,
    })
    const screen = await page.evaluate(() => document.body.dataset.screen)
    const level = await page.evaluate(() => document.body.dataset.level)
    // Landing on creation means the save was not read, which for a real player
    // is indistinguishable from their character having been deleted.
    if (screen === 'create') {
      console.error('v1:     MIGRATION LOST THE SAVE — booted into character creation')
      process.exitCode = 1
    } else if (level !== '7') {
      console.error(`v1:     migration read the save but level came back ${level}, expected 7`)
      process.exitCode = 1
    } else {
      console.log(`v1:     save migrated (screen ${screen}, level ${level})`)
    }
  } finally {
    await context.close()
  }
}

/**
 * A v2 save whose worn pieces are RANKED, for checking that rank is worn.
 *
 * Ranks cannot be reached by playing inside a harness run — they come off deep
 * drops — so the only way to see a raised swordsman is to write one.
 */
const RANKED_SAVE = JSON.stringify({
  v: 2,
  active: 0,
  swordsmen: [
    {
      name: 'Shen Baoyu',
      origin: 'mountain',
      level: 12,
      runs: 9,
      depth: 3,
      taught: true,
      inventory: {
        owned: [
          { id: 'r-lamellar', rank: 5, rites: [] },
          { id: 's-pauldron', rank: 4, rites: [] },
          { id: 'h-hat', rank: 3, rites: [] },
          { id: 'w-dao', rank: 2, rites: [] },
        ],
        equipped: { robe: 'r-lamellar', shoulders: 's-pauldron', head: 'h-hat', weapon: 'w-dao' },
      },
    },
  ],
})

/**
 * Boots with a ranked swordsman and asserts the rank is VISIBLE.
 *
 * The whole argument for putting rank on the figure is that a number on a card
 * is not progression in a game whose art direction is "the equipment is the
 * silhouette". If the marks are not drawn, that argument is a comment.
 */
async function rankCheck(parent: BrowserContext, url: string): Promise<void> {
  const context = await parent.browser()!.newContext({ viewport: VIEWPORT })
  try {
    const page = await context.newPage()
    await page.addInitScript(
      ([key, value]) => {
        try {
          window.localStorage.setItem(key!, value!)
        } catch {
          /* private mode; the assertion below will report it */
        }
      },
      ['jianying.save.v2', RANKED_SAVE],
    )
    await page.goto(url, { waitUntil: 'load' })
    await waitForFirstFrame(page)
    await page.waitForFunction(() => document.body.dataset.screen === 'title', { timeout: 15_000 })
    await page.locator('.title-go').click()
    await page.waitForFunction(() => document.body.dataset.screen === 'hub', { timeout: 10_000 })
    await page.waitForTimeout(400)
    await page.screenshot({ path: join(OUT, 'hub-ranked.png') })

    // Gold, and only on the figure. palette.gold is d4af37.
    const gold = await page
      .locator('.pane .stage .portrait-svg polygon[fill="#d4af37"]')
      .count()
      .catch(() => 0)
    // And the pips on the cards, which is the other half of the same claim.
    await page.locator('.hub-tabs .tab').nth(1).click()
    await page.waitForTimeout(250)
    const pips = await page.locator('.item-rank').count().catch(() => 0)
    await page.screenshot({ path: join(OUT, 'gear-ranked.png') })

    if (gold < 4) {
      console.error(`rank:   NOT WORN — only ${gold} gold marks on a swordsman ranked 5/4/3/2`)
      process.exitCode = 1
    } else if (pips === 0) {
      console.error('rank:   marks drawn, but no rank pips on the equipment cards')
      process.exitCode = 1
    } else {
      console.log(`rank:   ${gold} marks on the figure, ${pips} pips on the cards`)
    }
  } finally {
    await context.close()
  }
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
    // A stale bundle is worse than no bundle: the harness passes, the shots
    // look plausible, and every conclusion drawn from them is about code that
    // is no longer there. This was not a hypothetical — a whole pass of figure
    // work was reviewed against a build made before any of it existed.
    const built = statSync(join(DIST, 'index.html')).mtimeMs
    const newest = newestSourceTime(join(ROOT, 'src'))
    if (newest > built) {
      console.error(
        `dist/ is older than src/ by ${((newest - built) / 1000).toFixed(0)}s — ` +
          'run `npm run build` first, or the shots will show the previous build.',
      )
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

    // --- the v1 save, read once and for real ------------------------------
    // The unit tests prove the parser reads a v1 blob. They cannot prove the
    // GAME does, because boot resolves storage through Capacitor Preferences
    // first and only falls back to localStorage — so a migration that works in
    // a test can still leave a real player at character creation with their
    // swordsman gone. This is the only place that gap gets closed, and losing a
    // save is the worst thing this project can do to somebody.
    await migrationCheck(context, url)
    await rankCheck(context, url)

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
    // A first launch has nothing to start over from, so the button must be
    // absent here and present on the returning title captured at the end.
    if ((await page.locator('.title-new').count()) > 0) {
      console.warn('warn:   start-over offered on a first launch')
    }

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

    // The hub is four tabs now, so one screenshot can only ever show a quarter
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
    if (tabCount !== 4) console.warn('warn:   expected four tabs')
    if (placeCount !== 5) console.warn('warn:   expected five places on the world tab')

    // --- 法, and the fact that choosing there actually STICKS ---------------
    //
    // This tab exists because every art in the game acted and none of it was
    // reachable from the hub. The failure it has to be guarded against is the
    // one that shape of bug always takes: a list that renders, responds to a
    // tap, and writes nothing — so the player arranges a build, walks out, and
    // carries the default anyway.
    const artsTab = page.locator('.hub-tabs .tab', { hasText: 'Arts' })
    if ((await artsTab.count()) === 0) {
      console.error('arts:   no 法 tab in the hub')
      process.exitCode = 1
    } else {
      await artsTab.first().click()
      await page.waitForTimeout(250)
      const rows = await page.locator('.art-row').count()
      const before = await page.locator('.art-row-on').count()
      // Drop one, then read the SAVE rather than the screen.
      await page.locator('.art-row-on').first().click()
      await page.waitForTimeout(250)
      const after = await page.locator('.art-row-on').count()
      const stored = await page.evaluate(() => {
        const raw = localStorage.getItem('jianying.save.v2')
        if (!raw) return -1
        const arts = JSON.parse(raw).swordsmen?.[0]?.arts ?? {}
        const first = Object.values(arts)[0]
        return Array.isArray(first) ? first.length : -1
      })
      await page.screenshot({ path: join(OUT, 'hub-arts.png') })
      if (rows !== 5 || before !== 4 || after !== 3 || stored !== 3) {
        console.error(
          `arts:   the 法 tab is not wired — ${rows} rows, ${before} carried, ` +
            `${after} after dropping one, ${stored} in the save`,
        )
        process.exitCode = 1
      } else {
        console.log(`arts:   法 tab ${rows} rows, dropped one → ${after} carried and saved`)
      }
      await tabs.first().click()
      await page.waitForTimeout(200)
    }

    // The swordsman must actually be drawn. This is the check that would have
    // caught the whole reason for this redesign: a hub that describes your
    // equipment in words and never shows it.
    const portraitPolys = await page
      .locator('.pane .stage .portrait-svg polygon')
      .count()
      .catch(() => 0)
    console.log(`figure: ${portraitPolys} ink strokes`)
    if (portraitPolys < 8) console.warn('warn:   the hub is not drawing the swordsman')

    // --- the roster -------------------------------------------------------
    // Making a SECOND swordsman and switching back to the first. This is the
    // whole of the change: `New swordsman` used to destroy the character you
    // were playing, and the two things that can go wrong here — the second one
    // overwriting the first, or switching losing whatever the first had — are
    // both invisible from a screenshot and both unrecoverable for a player.
    const firstName = (await page.locator('.roster-card:not(.roster-add) .roster-name').first().textContent()) ?? ''
    await page.locator('.roster-add').click()
    await page.waitForFunction(() => document.body.dataset.screen === 'create', undefined, {
      timeout: 8000,
    })
    await page.locator('.create-go').click()
    await page.waitForFunction(() => document.body.dataset.screen === 'hub', undefined, {
      timeout: 8000,
    })
    await page.waitForTimeout(300)
    const names = await page.locator('.roster-card:not(.roster-add) .roster-name').allTextContents()
    // Scrolled to the bottom, because the roster is the last block on a pane
    // taller than the phone and the default shot cuts it in half.
    await page.locator('.hub-body').evaluate((el) => (el.scrollTop = el.scrollHeight))
    await page.waitForTimeout(250)
    await page.screenshot({ path: join(OUT, 'hub-roster.png') })
    if (names.length !== 2) {
      console.error(`roster: expected 2 swordsmen, found ${names.length}: ${names.join(", ")}`)
      process.exitCode = 1
    } else if (!names.includes(firstName)) {
      console.error(`roster: the first swordsman (${firstName}) is gone after adding a second`)
      process.exitCode = 1
    } else {
      // And back again. A switch that does not actually change who is drawn
      // would photograph as a working screen.
      const before = await page.locator('.pane .stage .portrait-svg').first().innerHTML()
      await page.locator('.roster-card:not(.roster-on):not(.roster-add)').first().click()
      await page.waitForTimeout(400)
      const active = await page.locator('.roster-on .roster-name').textContent()
      const after = await page.locator('.pane .stage .portrait-svg').first().innerHTML()
      const switched = active === firstName && before !== after
      console.log(`roster: ${names.length} swordsmen, switch ${switched ? 'ok' : 'BROKEN'}`)
      if (!switched) process.exitCode = 1
    }

    // Giving one up is now a separate, stated act rather than the only route to
    // character creation. The dialogue must still default to keeping.
    await page.locator('.roster-give').click()
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
      const card = page.locator('.gate .gate-push').first()
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

    // --- the five conditions, provoked on purpose -------------------------
    // The unit tests exercise the detector. They cannot prove the wiring from a
    // thumb on a joystick, through the simulation, to a lit tile on screen —
    // and that wiring IS the feature, because a conditional system the player
    // cannot see is a set of invisible rules.
    const conditions = async (): Promise<string> =>
      (await page.evaluate(() => document.body.dataset.conditions ?? '')) || '—'
    const held: string[] = []

    /**
     * Waits for a condition to hold, dismissing level-ups and re-provoking.
     *
     * Sampling once after a fixed delay was the first version and it was flaky:
     * a pending level-up freezes the simulation behind a choice, so a posture
     * that must be HELD can be interrupted at any moment, and the turn flash
     * lasts under a second. A flaky verifier is worse than none, because it
     * teaches you to ignore it.
     *
     * `provoke` runs on every poll, so the gesture is repeated rather than made
     * once and hoped for.
     */
    /**
     * Holds a posture until the game reports it, or the budget runs out.
     *
     * THE BUDGETS ARE GENEROUS AND THAT IS THE POINT. Two postures have to be
     * HELD before they count (静 for 0.55s, 疾 for 0.9s — see sim/conditions.ts)
     * and this bound is wall clock, so the two are only equivalent on a machine
     * keeping up. This harness has run at 9-14 fps on a loaded container where
     * the game's own budget is 55, and every observed flake of this check has
     * happened on one of those slow runs. The mechanism is not proven — a fixed
     * timestep should still accumulate real seconds — so the fix here is the
     * one that does not depend on being right about the cause: give a slow
     * machine several times the window it needs, and report the frame rate when
     * it still fails, so the next failure explains itself instead of being
     * dismissed as "flaky" a fourth time.
     */
    const waitForCondition = async (
      name: string,
      provoke: () => Promise<void>,
      ms: number,
    ): Promise<string> => {
      const until = Date.now() + ms
      let last = '—'
      while (Date.now() < until) {
        // A pending level-up freezes the simulation, so a posture that must be
        // held can never accumulate while a card is on screen. Draining once
        // before the loop was not enough: another can arrive mid-hold.
        const card = page.locator('.gate .gate-push').first()
        if (await card.isVisible().catch(() => false)) await card.click().catch(() => {})
        await provoke()
        last = await conditions()
        if (last.includes(name)) return last
      }
      return last
    }

    const screen = await page.evaluate(() => document.body.dataset.screen)
    if (screen !== 'run' && screen !== 'over') {
      console.error(`arts:   cannot provoke a condition — the game is on "${screen}", not running`)
      process.exitCode = 1
    }

    // 静 — let go and wait. The posture has to be HELD, so releasing for a
    // single frame is not enough, and that is the point.
    await page.mouse.up().catch(() => {})
    const sawStill = await waitForCondition(
      'still',
      () => page.waitForTimeout(120),
      9000,
    )
    if (sawStill.includes('still')) held.push('静')

    // 疾 — hold the stick at full deflection in one direction.
    await page.mouse.move(cx, cy)
    await page.mouse.down()
    await page.mouse.move(cx + 130, cy, { steps: 6 })
    const sawRunning = await waitForCondition(
      'running',
      () => page.waitForTimeout(120),
      12_000,
    )
    if (sawRunning.includes('running')) held.push('疾')
    await page.screenshot({ path: join(OUT, 'arts-running.png') })

    // 转 — reverse hard, over and over, without letting go. The flash lasts
    // under a second, so one reversal and one sample is a coin toss.
    let side = -1
    const sawTurn = await waitForCondition(
      'turn',
      async () => {
        side = -side
        await page.mouse.move(cx + side * 130, cy, { steps: 3 })
        await page.waitForTimeout(90)
      },
      12_000,
    )
    if (sawTurn.includes('turn')) held.push('转')
    const lit = await page.locator('.art-on').count()

    // Do the arts actually MOVE a number, or only light a tile?
    //
    // This is the check the previous step could not make. Its failure mode is
    // the quiet one: the seals light, the strip looks alive, and the simulation
    // goes on reading the untouched baseline. Sampled while the running posture
    // is still held, because the whole point is that it stops being true the
    // moment the condition does.
    const acting = await page.evaluate(() => {
      const d = document.body.dataset
      return { live: d.live ?? '', base: d.base ?? '' }
    })
    await page.mouse.up()

    // 围 and 危 are situations rather than postures — being surrounded, and
    // being nearly dead — and neither can be provoked reliably inside a short
    // harness run. They are covered by the unit tests instead, and the honest
    // thing is to name the three checked here rather than claim five.
    if (held.length < 3) {
      // The frame rate is part of the report, not a footnote: a failure at 9
      // fps and a failure at 60 are different failures, and without the number
      // the next person cannot tell which one they are looking at.
      const slowFps = await readFps(page)
      console.error(
        `arts:   NOT WIRED — only ${held.join(' ') || 'none'} of 静 疾 转 held ` +
          `(saw still="${sawStill}" running="${sawRunning}" turn="${sawTurn}") ` +
          `at ${slowFps} fps`,
      )
      process.exitCode = 1
    } else if (lit === 0) {
      console.error('arts:   conditions hold but no tile lit — the strip is not reading them')
      process.exitCode = 1
    } else if (acting.live === '' || acting.live === acting.base) {
      // Every weapon's scroll has at least one art on a posture this harness
      // provokes, so an identical pair here means the layer is not wired.
      console.error(
        `arts:   a condition held but no stat moved — live="${acting.live}" base="${acting.base}"`,
      )
      process.exitCode = 1
    } else {
      console.log(
        `arts:   ${held.join(' ')} provoked, ${lit} tile(s) lit, stats moved ` +
          `(${acting.base} → ${acting.live})`,
      )
    }

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
        const card = page.locator('.gate .gate-push').first()
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
      // The reason this exists: the hub's own button sits below the fold on a
      // tall phone with a levelled character, which is the same as not being
      // there. A returning player must be able to start over from the screen
      // they actually land on.
      const canRestart = await page.locator('.title-new').count()
      console.log(`restart: ${canRestart > 0 ? 'offered on the title' : 'MISSING'}`)
      if (canRestart === 0) console.warn('warn:   no way to start over from the title')
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
