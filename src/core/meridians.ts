import type { MaterialId } from './materials.ts'

/**
 * 經脈. Twelve meridians, opened one at a time, permanently.
 *
 * This is the answer to the flattest problem the game had: qi rose on its own and
 * every other system was a small multiplier on it, so an active player had nothing to
 * *do* and content length was just wall-clock. A meridian is bought with insight and
 * beast materials — both of which come from hunting, the one thing you actually press
 * — so playing more buys power that idling never does. The bonuses are permanent and
 * unequippable: unlike an art there is no loadout decision, no upkeep and no clash.
 * Opening one is pure gain, which is exactly why it has to be earned.
 *
 * Three courses run in parallel and each opens in order, so at any moment you are
 * choosing which of three next meridians to save for rather than following one line.
 *
 * The prices are set against measured income, not guessed: about four hunts a day for
 * two months is roughly four thousand insight, and the twelve channels together cost
 * a little over three. A player finishes a climb having opened most of them and
 * having had to choose which, which is the point — the first draft cost a third of
 * that and the simulation ended runs holding twenty thousand unspent insight.
 */
export type Course = 'hand' | 'foot' | 'extra'

export const COURSE_NAME: Record<Course, { name: string; zh: string; note: string }> = {
  hand:  { name: 'Hand Course',  zh: '手經', note: 'Breath and gathering. Opens early and cheaply.' },
  foot:  { name: 'Foot Course',  zh: '足經', note: 'Endurance and the hunt. The middle of a life.' },
  extra: { name: 'Eight Extraordinary', zh: '奇經', note: 'The vessels that decide a tribulation.' },
}

export type MeridianEffect =
  | 'rate'         // fraction added to generation
  | 'insight'      // fraction added to insight gained
  | 'breakthrough' // fraction taken off the breakthrough cost
  | 'offlineCap'   // hours added to the offline cap
  | 'turmoil'      // fraction taken off how fast the heart stirs
  | 'settle'       // fraction added to how fast settling drains
  | 'hunt'         // fraction taken off the time a hunt charge takes
  | 'odds'         // flat addition to every tribulation's chance

export interface Meridian {
  readonly id: string
  readonly name: string
  readonly zh: string
  readonly course: Course
  /** Position within its course. Opens only after the one before it. */
  readonly step: number
  readonly realm: number
  readonly insight: number
  readonly mats: Partial<Record<MaterialId, number>>
  readonly kind: MeridianEffect
  readonly value: number
  readonly text: string
}

export const MERIDIANS: readonly Meridian[] = [
  // 手 — cheap, early, about producing more.
  { id: 'lung',    name: 'Lung Channel',    zh: '手太陰肺經',   course: 'hand',  step: 1, realm: 2, insight: 18,  mats: { hide: 2 },            kind: 'rate',         value: 0.08, text: '+8% qi generation' },
  { id: 'colon',   name: 'Large Intestine', zh: '手陽明大腸經', course: 'hand',  step: 2, realm: 2, insight: 33,  mats: { hide: 4 },            kind: 'offlineCap',   value: 2,    text: '+2h offline cap' },
  { id: 'heartch', name: 'Heart Channel',   zh: '手少陰心經',   course: 'hand',  step: 3, realm: 3, insight: 57,  mats: { hide: 10 },            kind: 'turmoil',      value: 0.15, text: 'the heart stirs 15% slower' },
  { id: 'sintest', name: 'Small Intestine', zh: '手太陽小腸經', course: 'hand',  step: 4, realm: 4, insight: 102, mats: { core: 3 },            kind: 'rate',         value: 0.14, text: '+14% qi generation' },

  // 足 — the middle of a life: endurance, and the hunt paying for itself.
  { id: 'stomach', name: 'Stomach Channel', zh: '足陽明胃經',   course: 'foot',  step: 1, realm: 3, insight: 45,  mats: { hide: 5 },            kind: 'hunt',         value: 0.20, text: 'hunt charges return 20% faster' },
  { id: 'spleen',  name: 'Spleen Channel',  zh: '足太陰脾經',   course: 'foot',  step: 2, realm: 4, insight: 84,  mats: { core: 2 },            kind: 'insight',      value: 0.25, text: '+25% insight from everything' },
  { id: 'kidney',  name: 'Kidney Channel',  zh: '足少陰腎經',   course: 'foot',  step: 3, realm: 5, insight: 156, mats: { core: 9 },            kind: 'rate',         value: 0.20, text: '+20% qi generation' },
  { id: 'bladder', name: 'Bladder Channel', zh: '足太陽膀胱經', course: 'foot',  step: 4, realm: 6, insight: 285, mats: { essence: 2 },         kind: 'settle',       value: 0.50, text: 'settling quiets the heart 50% faster' },

  // 奇 — the vessels. Expensive, late, and the only source of raw tribulation odds.
  { id: 'ren',     name: 'Conception Vessel', zh: '任脈',       course: 'extra', step: 1, realm: 5, insight: 210, mats: { core: 6 },            kind: 'odds',         value: 0.04, text: '+4% on every tribulation' },
  { id: 'du',      name: 'Governing Vessel',  zh: '督脈',       course: 'extra', step: 2, realm: 6, insight: 375, mats: { essence: 3 },         kind: 'breakthrough', value: 0.12, text: '−12% breakthrough cost' },
  { id: 'chong',   name: 'Thrusting Vessel',  zh: '衝脈',       course: 'extra', step: 3, realm: 7, insight: 645, mats: { essence: 6 },         kind: 'rate',         value: 0.32, text: '+32% qi generation' },
  { id: 'dai',     name: 'Girdling Vessel',   zh: '帶脈',       course: 'extra', step: 4, realm: 8, insight: 1080, mats: { essence: 12 },        kind: 'odds',         value: 0.08, text: '+8% on every tribulation' },
]

export function meridian(id: string): Meridian | undefined {
  return MERIDIANS.find((m) => m.id === id)
}

export function courseOf(course: Course): Meridian[] {
  return MERIDIANS.filter((m) => m.course === course).sort((a, b) => a.step - b.step)
}

/** The next unopened meridian in each course — the three things you can save toward. */
export function nextInCourse(open: readonly string[], course: Course): Meridian | undefined {
  return courseOf(course).find((m) => !open.includes(m.id))
}

/**
 * A meridian is reachable when the one before it in its own course is open. Courses
 * do not gate each other, so the ordering decision is real rather than cosmetic.
 */
export function unlocked(open: readonly string[], m: Meridian): boolean {
  if (m.step === 1) return true
  const before = courseOf(m.course).find((x) => x.step === m.step - 1)
  return !!before && open.includes(before.id)
}
