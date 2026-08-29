/**
 * Generates the key art from `tools/art/manifest.ts`, then inks it.
 *
 *   OPENAI_API_KEY=... npx tsx tools/generate.mts            # everything
 *   OPENAI_API_KEY=... npx tsx tools/generate.mts key-art    # one piece
 *   npx tsx tools/generate.mts --dry-run                     # prompts only
 *
 * READ THIS BEFORE TRUSTING IT. I cannot run this script. Every image API is
 * blocked from the container I work in — api.openai.com, fal.run,
 * api.replicate.com and huggingface.co all answer 000, measured, not assumed.
 * So what is verified here is the plumbing (the manifest, the prompt assembly,
 * the file layout, `--dry-run`) and the post-process, which I tested on a real
 * colour image. What is NOT verified is a single call to a provider or a single
 * generated pixel. The first real run is yours, and it may need a fix.
 *
 * You have no PC, so the way to run it is `.github/workflows/art.yml` — push a
 * button on the phone, the key comes from a repository secret, the images come
 * back as a downloadable artifact. The key never touches this repository.
 *
 * A NOTE ON COST AND ON WHAT THIS IS FOR. Eight pieces at roughly $0.04-0.19
 * each depending on size and provider is a couple of dollars per full run, and
 * you will not like the first run. Generation is iteration: change one prompt,
 * regenerate that one piece, look at it. That is why `--dry-run` exists and why
 * the manifest is a file rather than an argument.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PIECES, STYLE, type ArtPiece } from './art/manifest'

const OUT = join(fileURLToPath(new URL('..', import.meta.url)), 'docs', 'generated')

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const only = args.filter((a) => !a.startsWith('--'))

/**
 * Providers, as a table rather than an if-chain.
 *
 * Two, because one is a lock-in and three is a maintenance burden nobody asked
 * for. Both return base64 PNG so the rest of the script does not branch.
 */
const PROVIDERS = {
  openai: {
    env: 'OPENAI_API_KEY',
    url: 'https://api.openai.com/v1/images/generations',
    headers: (key: string) => ({
      'content-type': 'application/json',
      authorization: `Bearer ${key}`,
    }),
    body: (piece: ArtPiece, prompt: string) =>
      JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        size: piece.size ?? '1024x1024',
        n: 1,
      }),
    // Both the current image models return b64 under data[0]; the older ones
    // could return a URL instead, which is why this reads defensively.
    extract: (json: any): string | undefined => json?.data?.[0]?.b64_json,
  },
  stability: {
    env: 'STABILITY_API_KEY',
    url: 'https://api.stability.ai/v2beta/stable-image/generate/core',
    headers: (key: string) => ({
      authorization: `Bearer ${key}`,
      accept: 'application/json',
      'content-type': 'application/json',
    }),
    body: (piece: ArtPiece, prompt: string) =>
      JSON.stringify({
        prompt,
        aspect_ratio:
          piece.size === '1024x1536' ? '2:3' : piece.size === '1536x1024' ? '3:2' : '1:1',
        output_format: 'png',
      }),
    extract: (json: any): string | undefined => json?.image,
  },
} as const

type ProviderId = keyof typeof PROVIDERS

/** The first provider whose key is present. Named explicitly with PROVIDER. */
function pickProvider(): ProviderId | undefined {
  const named = process.env.PROVIDER as ProviderId | undefined
  if (named) {
    if (!PROVIDERS[named]) throw new Error(`unknown PROVIDER "${named}"`)
    return named
  }
  return (Object.keys(PROVIDERS) as ProviderId[]).find((id) => process.env[PROVIDERS[id].env])
}

const wanted = only.length ? PIECES.filter((p) => only.includes(p.id)) : PIECES
if (only.length && wanted.length !== only.length) {
  const missing = only.filter((id) => !PIECES.some((p) => p.id === id))
  throw new Error(`no such piece: ${missing.join(', ')}`)
}

const fullPrompt = (piece: ArtPiece): string => `${STYLE}\n\n${piece.prompt}`

if (dryRun) {
  for (const piece of wanted) {
    console.log(`\n--- ${piece.id}  (${piece.use})  ${piece.size ?? '1024x1024'}`)
    console.log(fullPrompt(piece))
  }
  console.log(`\n${wanted.length} piece(s). No key used, nothing written.`)
  process.exit(0)
}

const providerId = pickProvider()
if (!providerId) {
  console.error(
    'No API key found. Set one of:\n' +
      (Object.keys(PROVIDERS) as ProviderId[]).map((id) => `  ${PROVIDERS[id].env}`).join('\n') +
      '\n\nOr run with --dry-run to see the prompts without calling anything.',
  )
  process.exit(1)
}

const provider = PROVIDERS[providerId]
const key = process.env[provider.env]!
await mkdir(OUT, { recursive: true })
console.log(`provider: ${providerId}   pieces: ${wanted.length}`)

let made = 0
const failed: string[] = []

for (const piece of wanted) {
  process.stdout.write(`  ${piece.id.padEnd(16)} `)
  try {
    const response = await fetch(provider.url, {
      method: 'POST',
      headers: provider.headers(key),
      body: provider.body(piece, fullPrompt(piece)),
    })
    if (!response.ok) {
      // The body carries the actual reason — a content refusal, a bad size, an
      // exhausted quota — and printing only the status turns all of those into
      // one unhelpful number.
      const detail = (await response.text()).slice(0, 400)
      failed.push(`${piece.id}: HTTP ${response.status} ${detail}`)
      console.log(`FAILED (${response.status})`)
      continue
    }
    const b64 = provider.extract(await response.json())
    if (!b64) {
      failed.push(`${piece.id}: response carried no image`)
      console.log('FAILED (no image in response)')
      continue
    }
    const file = join(OUT, `${piece.id}.png`)
    await writeFile(file, Buffer.from(b64, 'base64'))
    made++
    console.log(`ok  →  docs/generated/${piece.id}.png`)
  } catch (error) {
    failed.push(`${piece.id}: ${(error as Error).message}`)
    console.log(`FAILED (${(error as Error).message})`)
  }
}

console.log(`\n${made}/${wanted.length} generated into docs/generated/`)
if (failed.length) {
  console.log('\nfailures:')
  for (const line of failed) console.log(`  ${line}`)
}
if (made > 0) {
  console.log(
    '\nNext, and do not skip it — this is what makes them a set rather than\n' +
      'eight unrelated pictures:\n' +
      '  for f in docs/generated/*.png; do npx tsx tools/inkify.mts "$f"; done',
  )
}
// A partial run is a failure worth noticing in CI, but the images that DID come
// back are still on disk and still worth keeping.
process.exit(failed.length && made === 0 ? 1 : 0)
