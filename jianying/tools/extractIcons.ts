/**
 * Copies only the icons the game actually names into a small source file.
 *
 *   npx tsx tools/extractIcons.ts
 *
 * This exists because of one number: `@iconify-json/game-icons/icons.json` is
 * 6.2 MB. Importing it from the game would put four thousand icons the player
 * will never see into the APK, and it would dominate the download of a game
 * whose entire art direction was chosen so that it ships no assets at all.
 *
 * A bundler cannot save us here. Tree-shaking works on module bindings, not on
 * keys of one enormous JSON object, so `icons['shield']` keeps the whole thing.
 * The fix is to extract at build time and commit the result: about twenty
 * paths, a few kilobytes, and no runtime dependency on the pack at all.
 *
 * The generated file is COMMITTED, deliberately. Generating it during the build
 * would put a 6 MB dev dependency in the APK's critical path for no gain, and
 * would mean a CI runner without the package could not build the game.
 * `tests/packIcons.spec.ts` fails if the committed file falls out of step with
 * the names, which is the thing that would otherwise rot silently.
 */
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import iconSet from '@iconify-json/game-icons/icons.json' with { type: 'json' }
import { PACK_ICON, PACK_SLOT_ICON } from '../src/render/packIcons'

interface IconEntry {
  body: string
  left?: number
  top?: number
  width?: number
  height?: number
}
const SET = iconSet as unknown as {
  icons: Record<string, IconEntry>
  width: number
  height: number
}

const OUT = join(fileURLToPath(new URL('..', import.meta.url)), 'src', 'render', 'packIconData.ts')

const wanted = [...new Set([...Object.values(PACK_ICON), ...Object.values(PACK_SLOT_ICON)])].sort()

const missing = wanted.filter((name) => !SET.icons[name])
if (missing.length) {
  console.error(`not in the set: ${missing.join(', ')}`)
  process.exit(1)
}

const rows = wanted.map((name) => {
  const icon = SET.icons[name]!
  // Only carry a viewBox override when the icon has one. Most do not, and
  // writing four numbers per row that all equal the set default would triple
  // the file for nothing.
  const box =
    icon.left !== undefined ||
    icon.top !== undefined ||
    icon.width !== undefined ||
    icon.height !== undefined
      ? `, box: [${icon.left ?? 0}, ${icon.top ?? 0}, ${icon.width ?? SET.width}, ${icon.height ?? SET.height}]`
      : ''
  return `  '${name}': { body: ${JSON.stringify(icon.body)}${box} },`
})

const file = `/**
 * Icon geometry, extracted from game-icons.net.
 *
 * GENERATED — do not edit. Run \`npx tsx tools/extractIcons.ts\` after changing
 * a name in \`packIcons.ts\`; \`tests/packIcons.spec.ts\` fails if you forget.
 *
 * Only the icons this game names are here. The full set is 6.2 MB and would
 * dominate the APK; see tools/extractIcons.ts for why a bundler cannot trim it.
 *
 * Icons by game-icons.net, CC BY 3.0 — https://game-icons.net
 */

export interface PackIconGeometry {
  /** SVG markup, using \`currentColor\` so one \`color\` on the wrapper tints it. */
  readonly body: string
  /** viewBox as [left, top, width, height]. Absent means the set default. */
  readonly box?: readonly [number, number, number, number]
}

/** The set's default viewBox for icons that do not override it. */
export const PACK_VIEWBOX: readonly [number, number, number, number] = [0, 0, ${SET.width}, ${SET.height}]

export const PACK_ICON_DATA: Record<string, PackIconGeometry> = {
${rows.join('\n')}
}
`

await writeFile(OUT, file)
const kb = (Buffer.byteLength(file) / 1024).toFixed(1)
console.log(`extracted ${wanted.length} icons → src/render/packIconData.ts  (${kb} kB, from 6.2 MB)`)
