import { MATERIALS, count, canPay, pay, type Satchel } from './materials.ts'
import type { PlayerState } from './state.ts'

/**
 * 瓶頸. From the third realm on, having the qi is not enough.
 *
 * The measurement of the first build said the quiet part out loud: every realm was
 * cleared by waiting, so the length of the game was the length of a timer and nothing
 * a player did changed its shape. A bottleneck is a stated, checkable condition that
 * must be met before the tribulation will even open — and every condition is drawn
 * from a system that already exists, so passing one teaches the game rather than
 * interrupting it.
 *
 * Two rules keep this from being a wall. Nothing here is random: the requirements are
 * listed in full, in the same words the code checks, from the moment the realm opens.
 * And nothing here can be failed: a bottleneck is met or not yet met, never lost.
 */
export interface Requirement {
  /** Plain enough to read on a phone without a wiki. */
  readonly label: string
  readonly need: number
  have(s: PlayerState): number
  /** A ceiling rather than a floor: a quiet heart is "at most", not "at least". */
  readonly atMost?: boolean
}

export interface Bottleneck {
  /** The realm you must be standing in. Passing it opens that realm's tribulation. */
  readonly realm: number
  readonly name: string
  readonly zh: string
  /** One line of fiction, so the checklist is a scene and not a form. */
  readonly text: string
  readonly requires: readonly Requirement[]
  /** Consumed when the bottleneck is broken. Also shown as a requirement. */
  readonly offering: Satchel
}

const arts: Requirement = { label: 'Arts learned', need: 0, have: (s) => s.learned.length }
const knows = (n: number): Requirement => ({ ...arts, need: n })
const opens = (n: number): Requirement => ({ label: 'Meridians opened', need: n, have: (s) => s.meridians.length })
const seen = (n: number): Requirement => ({ label: 'Beasts recorded', need: n, have: (s) => s.seenBeasts.length })
const quiet = (n: number): Requirement => ({ label: 'Heart demon', need: n, atMost: true, have: (s) => Math.round(s.turmoil) })

export const BOTTLENECKS: readonly Bottleneck[] = [
  {
    realm: 3, name: 'The Heart Gate', zh: '心關',
    text: 'The core will not form around a mind that is still arguing with itself.',
    requires: [quiet(15)],
    offering: {},
  },
  {
    realm: 4, name: 'The Bone Gate', zh: '骨關',
    text: 'A soul needs a frame that will not powder under it. Spirit cores are burnt into the marrow.',
    requires: [knows(3)],
    offering: { core: 3 },
  },
  {
    realm: 5, name: 'The Mind Gate', zh: '識關',
    text: 'Severing the spirit is not survivable by someone who only knows one way to do things.',
    requires: [knows(5), opens(3)],
    offering: {},
  },
  {
    realm: 6, name: 'The Fate Gate', zh: '命關',
    text: 'To refine the void you must first have seen enough of the world to know what is missing from it.',
    requires: [seen(6), opens(5)],
    offering: { essence: 1 },
  },
  {
    realm: 7, name: 'The Dao Gate', zh: '道關',
    text: 'Unity asks whether the body you have spent a life opening is one thing yet, or still twelve.',
    requires: [opens(8), quiet(25)],
    offering: { essence: 3 },
  },
  {
    realm: 8, name: 'The Calamity Gate', zh: '劫關',
    text: 'The last gate is not guarded. It simply asks for everything you have, and counts it.',
    requires: [opens(11), knows(9), seen(9)],
    offering: { essence: 10 },
  },
]

export function bottleneckAt(realmId: number): Bottleneck | undefined {
  return BOTTLENECKS.find((b) => b.realm === realmId)
}

/** Already broken — the gate for this realm stays open once passed. */
export function passed(s: PlayerState, realmId: number = s.realm): boolean {
  return s.gates.includes(realmId)
}

export function metRequirement(s: PlayerState, r: Requirement): boolean {
  return r.atMost ? r.have(s) <= r.need : r.have(s) >= r.need
}

/** Everything the gate asks, materials included, as one list the UI can tick off. */
export function checklist(s: PlayerState, b: Bottleneck): { label: string; have: number; need: number; atMost: boolean; ok: boolean }[] {
  const rows = b.requires.map((r) => ({
    label: r.label, have: r.have(s), need: r.need, atMost: !!r.atMost, ok: metRequirement(s, r),
  }))
  for (const [k, v] of Object.entries(b.offering)) {
    const have = count(s.satchel, k as keyof Satchel)
    const name = MATERIALS.find((m) => m.id === k)?.name ?? k
    rows.push({ label: `Offer ${name}`, have, need: v ?? 0, atMost: false, ok: have >= (v ?? 0) })
  }
  return rows
}

export function canBreakGate(s: PlayerState): boolean {
  const b = bottleneckAt(s.realm)
  if (!b || passed(s)) return false
  return b.requires.every((r) => metRequirement(s, r)) && canPay(s.satchel, b.offering)
}

/** Breaking a gate spends the offering and is permanent for that realm. */
export function breakGate(s: PlayerState): PlayerState {
  if (!canBreakGate(s)) return s
  const b = bottleneckAt(s.realm)!
  return { ...s, satchel: pay(s.satchel, b.offering), gates: [...s.gates, s.realm] }
}

/** No gate at this realm, or its gate is already broken. */
export function gateOpen(s: PlayerState): boolean {
  return !bottleneckAt(s.realm) || passed(s)
}
