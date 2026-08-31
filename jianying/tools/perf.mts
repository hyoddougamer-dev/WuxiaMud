/**
 * Performance probe.
 *
 * Plays a real expedition in a real browser and samples where the frame time
 * goes as the swarm grows. Exists because "it stutters on my phone" is not
 * something anyone can fix — the question is which of the two halves is
 * spending the budget, and how that scales with the number of enemies alive.
 *
 *   npx tsx tools/perf.mts [--seconds=120]
 *
 * The absolute numbers are NOT a device prediction: this container has no GPU,
 * so Chromium rasterises on the CPU. What transfers is the JS cost of update
 * and render, and above all how each one SCALES with enemy count — a render
 * cost that climbs linearly with the crowd is the same bug on any hardware.
 */
import { chromium } from 'playwright'
import { createServer, type Server } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DIST = join(ROOT, 'dist')

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
}

function serve(port: number): Promise<Server> {
  const server = createServer(async (req, res) => {
    const url = (req.url ?? '/').split('?')[0]!
    const file = join(DIST, normalize(url === '/' ? '/index.html' : url).replace(/^(\.\.[/\\])+/, ''))
    if (!file.startsWith(DIST) || !existsSync(file)) {
      res.writeHead(404).end('not found')
      return
    }
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' })
    res.end(await readFile(file))
  })
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)))
}

interface Sample {
  fps: number
  update: number
  render: number
  worst: number
  enemies: number
}

async function main(): Promise<void> {
  const seconds = Number(
    process.argv.find((a) => a.startsWith('--seconds='))?.slice('--seconds='.length) ?? 150,
  )
  if (!existsSync(join(DIST, 'index.html'))) {
    console.error('dist/ is missing — run `npm run build` first.')
    process.exitCode = 1
    return
  }

  const server = await serve(4610)
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  })

  try {
    const page = await browser.newPage({
      viewport: { width: 393, height: 851 },
      deviceScaleFactor: 2.625,
      isMobile: true,
      hasTouch: true,
    })
    page.on('pageerror', (e) => console.error('PAGE ERROR:', e.message))

    await page.goto('http://127.0.0.1:4610/', { waitUntil: 'load' })
    await page.waitForFunction(() => document.body.dataset.ready === '1', undefined, {
      timeout: 20_000,
    })

    // Straight through the entry flow to a running expedition.
    await page.waitForFunction(() => document.body.dataset.screen === 'title')
    await page.locator('.title-go').click()
    await page.waitForFunction(() => document.body.dataset.screen === 'create')
    await page.locator('.create-go').click()
    await page.waitForFunction(() => document.body.dataset.screen === 'codex')
    await page.locator('.codex-go').click()
    await page.waitForFunction(() => document.body.dataset.screen === 'hub')
    await page.locator('.hub-go').click()
    await page.waitForFunction(() => document.body.dataset.screen === 'run')

    const samples: Sample[] = []
    const deadline = Date.now() + seconds * 1000
    while (Date.now() < deadline) {
      // Standing still: the crowd grows fastest, which is the case that matters.
      const card = page.locator('.gate .gate-push').first()
      if (await card.isVisible().catch(() => false)) await card.click()
      if ((await page.evaluate(() => document.body.dataset.screen)) === 'over') break

      const raw = await page.evaluate(() => document.body.dataset.perf)
      if (raw) samples.push(JSON.parse(raw) as Sample)
      await page.waitForTimeout(1500)
    }

    // Bucket by enemy count, so the scaling is visible rather than averaged away.
    const buckets = new Map<number, Sample[]>()
    for (const s of samples) {
      const key = Math.floor(s.enemies / 40) * 40
      const list = buckets.get(key) ?? []
      list.push(s)
      buckets.set(key, list)
    }

    const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / (xs.length || 1)
    console.log(`\n${'enemies'.padStart(8)} ${'n'.padStart(4)} ${'update'.padStart(8)} ${'render'.padStart(8)} ${'worst'.padStart(8)} ${'fps'.padStart(5)}`)
    for (const key of [...buckets.keys()].sort((a, b) => a - b)) {
      const list = buckets.get(key)!
      console.log(
        `${`${key}-${key + 39}`.padStart(8)} ${String(list.length).padStart(4)} ` +
          `${mean(list.map((s) => s.update)).toFixed(2).padStart(8)} ` +
          `${mean(list.map((s) => s.render)).toFixed(2).padStart(8)} ` +
          `${Math.max(...list.map((s) => s.worst)).toFixed(0).padStart(8)} ` +
          `${mean(list.map((s) => s.fps)).toFixed(0).padStart(5)}`,
      )
    }
    const peak = samples.reduce((a, b) => (b.enemies > a.enemies ? b : a), samples[0]!)
    console.log(
      `\npeak: ${peak.enemies} enemies · update ${peak.update}ms · render ${peak.render}ms`,
    )
  } finally {
    await browser.close()
    server.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
