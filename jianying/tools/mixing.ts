/**
 * PROPOSAL sheet: mixed sets, and the class question answered.
 *
 *   npx tsx tools/mixing.ts
 *
 * Two things, and the second has been sitting undecided under every document so
 * far.
 *
 * MIXING. Every previous sheet showed sets worn whole, which quietly implied
 * that wearing one whole was the only thing to do. It is not — the pieces are
 * independent, so a swordsman is a combination and not a uniform. Six of the
 * 900 possible combinations are drawn here, each labelled with which forge
 * every piece came from, because "all the items are distinct" is a claim that
 * has to survive being MIXED, not only being shown in tidy rows.
 *
 * THE CLASS QUESTION. It kept being deferred, and it should not have been,
 * because the code already answered it and nobody wrote the answer down.
 *
 *   Every weapon in the game drops.
 *   A school decides your STARTING weapon and kit, and nothing after that.
 *   No item, region, technique or attribute is gated on it.
 *
 * So the game is already CLASSLESS, and calling the schools "classes" was a
 * label on something that does not exist. What actually behaves like a class is
 * the WEAPON in your hand — it sets reach, arc and rhythm, and since the thumb
 * is spent entirely on movement, that IS how the game plays. Section two shows
 * the same swordsman, same armour, four weapons: four different games.
 *
 * That is worth stating plainly rather than leaving implied, because it changes
 * what the hub should say. Picking up a spear is not finding a better item, it
 * is changing class mid-expedition — and a game that lets you do that should
 * say so out loud instead of filing it under "loot".
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { palette } from '../src/render/palette'
import { gearFromIds } from '../src/render/wardrobe'
import { weaponById } from '../src/data/weapons'
import { type Slot } from '../src/data/items'
import { SETS, SLOT_SEAL, nameOf } from './setdata'
import { W, columns, figure, heading, hex, label } from './sheet'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'docs')

const BY_SEAL = new Map(SETS.map((s) => [s.seal, s]))

/** A swordsman assembled from four sets, one slot at a time. */
interface Mix {
  readonly name: string
  readonly note: string
  /** Which set each slot is taken from. */
  readonly from: Record<Slot, string>
}

const MIXES: readonly Mix[] = [
  {
    name: 'The Ledger Keeper',
    note: 'Court silks over pauldrons. Somebody who was rich and is now armed.',
    from: { head: '莫邪', shoulders: '干将', robe: '莫邪', weapon: '龙泉' },
  },
  {
    name: 'The Reed Cutter',
    note: 'Bare arms, a long spear, nothing on the head. Reach and nothing else.',
    from: { head: '鱼肠', shoulders: '鱼肠', robe: '湛卢', weapon: '湛卢' },
  },
  {
    name: 'The Veiled Officer',
    note: 'Full plate under a veiled hat, and a fan. The fan is the joke.',
    from: { head: '干将', shoulders: '干将', robe: '干将', weapon: '莫邪' },
  },
  {
    name: 'The Road Warden',
    note: 'A travelling coat, wide sleeves, a bamboo hat, a heavy blade.',
    from: { head: '湛卢', shoulders: '湛卢', robe: '龙泉', weapon: '干将' },
  },
  {
    name: 'The Grave Robber',
    note: 'A torn shroud and twin knives. Everything about this is fast and poor.',
    from: { head: '鱼肠', shoulders: '龙泉', robe: '鱼肠', weapon: '鱼肠' },
  },
  {
    name: 'The Sect Elder',
    note: 'Jade crown, feather mantle, layered vestment. Carries a plain jian.',
    from: { head: '莫邪', shoulders: '莫邪', robe: '湛卢', weapon: '无谱' },
  },
]

const styleFor = (mix: Mix, slot: Slot): string => BY_SEAL.get(mix.from[slot])!.pieces[slot]!

const gearOfMix = (mix: Mix) =>
  gearFromIds({
    robe: styleFor(mix, 'robe'),
    shoulders: styleFor(mix, 'shoulders'),
    head: styleFor(mix, 'head'),
    blade: styleFor(mix, 'weapon'),
  })

const rows: string[] = []
let y = 0

const SLOTS: readonly Slot[] = ['head', 'shoulders', 'robe', 'weapon']

/** How many distinct figures the five sets can assemble. */
const COMBOS = SLOTS.reduce(
  (n, slot) => n * SETS.filter((s) => s.pieces[slot]).length,
  1,
)

rows.push(
  `<text x="40" y="40" font-family="system-ui, sans-serif" font-size="15" letter-spacing="3" ` +
    `fill="${hex(palette.ink)}" fill-opacity="0.5">剑影 JIÀNYǏNG · MIXED SETS, AND THE CLASS QUESTION — PROPOSAL</text>`,
  `<text x="40" y="62" font-family="system-ui, sans-serif" font-size="12.5" fill="${hex(palette.cinnabar)}">` +
    `Every figure is the game's own geometry. The set names and the stat lines are the proposal.</text>`,
)
y = 62

// --- 1. mixing ------------------------------------------------------------
y += 54
rows.push(
  heading(
    y,
    '一',
    `Nobody wears one set — there are ${COMBOS} swordsmen in these twenty-two items`,
    'Every sheet so far showed sets worn whole, which quietly implied that was the only thing to do. The pieces are independent. Six combinations below, each labelled with the forge every single piece came from — because "all the items are distinct" has to survive being mixed, not only being shown in tidy rows.',
  ),
)
y += 114

{
  const cells = MIXES.map((m, i) => figure(gearOfMix(m), 501 + i, 2.5, { accent: palette.gold, rank: 3 }))
  const base = y + 176
  const capY = base + Math.max(...cells.map((c) => c.bottom)) + 24
  const x = columns(MIXES.length, Math.max(...cells.map((c) => c.right)))
  MIXES.forEach((m, i) => {
    rows.push(`<g transform="translate(${x(i)},${base})">${cells[i]!.markup}</g>`)
    rows.push(label(x(i), capY, m.name, 13, hex(palette.ink), 0.82))
    // The provenance line is the point of the whole section: four seals, and
    // you can check every one of them against the catalogue.
    rows.push(
      label(
        x(i),
        capY + 20,
        SLOTS.map((s) => `${SLOT_SEAL[s]}${m.from[s]}`).join(' '),
        11,
        hex(palette.cinnabar),
        0.85,
      ),
    )
    const words = m.note.split(' ')
    const per = Math.ceil(words.length / 3)
    for (let k = 0; k < 3; k++) {
      rows.push(
        label(x(i), capY + 38 + k * 13, words.slice(k * per, (k + 1) * per).join(' '), 9.5, hex(palette.ink), 0.42),
      )
    }
  })
  y = capY + 96
}

// --- 2. the class question ------------------------------------------------
y += 22
rows.push(
  heading(
    y,
    '二',
    'The game is already classless — the weapon is the class',
    'This kept being deferred and the code had already decided it. Every weapon drops; a school sets your starting weapon and kit and nothing else; no item, region, technique or attribute is gated on it. What behaves like a class is the WEAPON: it sets reach, arc and rhythm, and since the thumb is spent entirely on movement, that is the whole of how the game plays.',
  ),
)
y += 114

{
  // Same armour on every figure — deliberately. If the armour changed too, the
  // row would prove nothing about the weapon.
  const armour = {
    robe: SETS[1]!.pieces.robe!,
    shoulders: SETS[1]!.pieces.shoulders!,
    head: SETS[1]!.pieces.head!,
  }
  const WEAPONS = ['jian', 'spear', 'fan', 'twin', 'great'] as const
  const cells = WEAPONS.map((w, i) =>
    figure(gearFromIds({ ...armour, blade: w }), 601 + i, 2.5, { accent: palette.gold, rank: 3 }),
  )
  const base = y + 176
  const capY = base + Math.max(...cells.map((c) => c.bottom)) + 24
  const x = columns(WEAPONS.length, Math.max(...cells.map((c) => c.right)))
  WEAPONS.forEach((w, i) => {
    const weapon = weaponById(w)
    rows.push(`<g transform="translate(${x(i)},${base})">${cells[i]!.markup}</g>`)
    rows.push(label(x(i), capY, `${weapon.seal} ${weapon.name}`, 13, hex(palette.ink), 0.82))
    rows.push(
      label(
        x(i),
        capY + 20,
        `${weapon.range} reach · ${weapon.interval.toFixed(2)}s · ${weapon.halfAngle.toFixed(2)} arc`,
        10.5,
        hex(palette.goldDeep),
        0.9,
      ),
    )
    const words = weapon.blurb.split(' ')
    const per = Math.ceil(words.length / 2)
    for (let k = 0; k < 2; k++) {
      rows.push(
        label(x(i), capY + 38 + k * 13, words.slice(k * per, (k + 1) * per).join(' '), 9.5, hex(palette.ink), 0.42),
      )
    }
  })
  y = capY + 84
}

// --- what follows from it -------------------------------------------------
y += 26
rows.push(
  `<rect x="40" y="${y}" width="${W - 80}" height="150" fill="${hex(palette.ink)}" fill-opacity="0.04"/>`,
  `<text x="60" y="${y + 28}" font-family="system-ui, sans-serif" font-size="13" fill="${hex(palette.cinnabar)}">What follows, if classless is the answer</text>`,
  `<text x="60" y="${y + 54}" font-family="system-ui, sans-serif" font-size="12" fill="${hex(palette.ink)}" fill-opacity="0.62">` +
    `1. The five schools stop being called classes. They are an OPENING — a name, a weapon and a kit — and the creation screen already says exactly that.</text>`,
  `<text x="60" y="${y + 74}" font-family="system-ui, sans-serif" font-size="12" fill="${hex(palette.ink)}" fill-opacity="0.62">` +
    `2. Picking up a spear mid-expedition is not a better item, it is a change of class. The game should say so out loud instead of filing it under loot.</text>`,
  `<text x="60" y="${y + 94}" font-family="system-ui, sans-serif" font-size="12" fill="${hex(palette.ink)}" fill-opacity="0.62">` +
    `3. Specialisation moves to the SETS. 体 endures, 锋 cuts, 疾 strikes often, 远 keeps its distance — chosen by what you wear, changed by what you swap.</text>`,
  `<text x="60" y="${y + 120}" font-family="system-ui, sans-serif" font-size="12" fill="${hex(palette.cinnabar)}" fill-opacity="0.85">` +
    `Still open: five sets against four stats do not divide. Either a fifth stat, or 鱼肠 and 莫邪 both keep 锋 Edge and differ by weapon alone.</text>`,
)
y += 174

const H = y + 30
const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
  `<rect width="${W}" height="${H}" fill="${hex(palette.paper)}"/>` +
  rows.join('') +
  `</svg>`

await mkdir(OUT, { recursive: true })
await writeFile(join(OUT, 'mixing.svg'), svg, 'utf8')
console.log(`sheet:   ${join(OUT, 'mixing.svg')}`)
console.log(`combos:  ${COMBOS} distinct swordsmen from the 22 items that exist`)
console.log(`classes: none — every weapon drops, a school gates nothing`)
console.log(`check:   ${MIXES.every((m) => SLOTS.every((s) => nameOf(s, styleFor(m, s)))) ? 'every mixed piece resolves to a real item' : 'BROKEN'}`)
