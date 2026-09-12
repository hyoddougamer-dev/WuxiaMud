import { add, canPay, pay, count, type Satchel } from './materials.ts'
import { held, type PillId } from './pills.ts'
import { ratePerSecond, TURMOIL_MAX } from './progress.ts'
import { relicValue } from './relics.ts'
import type { PlayerState } from './state.ts'

/**
 * 奇遇. Something happened while you were away.
 *
 * A measured climb runs fifty-five to seventy-four days and, before this, absolutely
 * nothing surprising happened in any of them. Four buttons, two months, one shape.
 * That is the difference between an idle game somebody keeps on their phone and a
 * spreadsheet with a wallpaper.
 *
 * The rules an encounter has to obey, so it stays a game and not a slot machine:
 *
 *   Every option states its price and its payment before you pick it, in the same
 *   words the code uses. Nothing here is hidden.
 *   Everything is paid in currencies the game already has — qi, insight, materials,
 *   calm, a hunt held. No encounter introduces a resource that exists only here.
 *   Nothing is ever purely bad. The worst option is a trade you would not have made,
 *   never a punishment for opening the app.
 *   Walking away is always on the list, and is always free.
 */
export interface Outcome {
  /** One line, past tense, said back to the player after they choose. */
  readonly said: string
  readonly state: PlayerState
}

export interface Option {
  readonly label: string
  /** The price and the payment, before committing. */
  readonly detail: string
  /** False greys the option out — never hides it, so the cost stays legible. */
  can(s: PlayerState): boolean
  /** `roll` is injected, like everywhere else, so the server can supply its own. */
  take(s: PlayerState, roll: number): Outcome
}

export interface Encounter {
  readonly id: string
  readonly name: string
  readonly zh: string
  readonly realm: number
  /** Two or three sentences. This is the only prose the game hands out unprompted. */
  readonly text: string
  readonly options: readonly Option[]
}

/* ---------------------------------------------------------------- helpers */

const quiet = (s: PlayerState, n: number): PlayerState =>
  ({ ...s, turmoil: Math.max(0, s.turmoil - n) })
const stir = (s: PlayerState, n: number): PlayerState =>
  ({ ...s, turmoil: Math.min(TURMOIL_MAX, s.turmoil + n) })
const give = (s: PlayerState, sat: Satchel): PlayerState => {
  let next = s.satchel
  for (const [k, v] of Object.entries(sat)) next = add(next, k as keyof Satchel, v ?? 0)
  return { ...s, satchel: next }
}
const takePills = (s: PlayerState, id: PillId, n: number): PlayerState =>
  ({ ...s, pills: { ...s.pills, [id]: held(s.pills, id) + n } })

/** Walking away is on every list and costs nothing. */
const leave = (label: string, said: string): Option => ({
  label,
  detail: 'Nothing gained, nothing spent.',
  can: () => true,
  take: (s) => ({ said, state: s }),
})

/* ------------------------------------------------------------ encounters */

export const ENCOUNTERS: readonly Encounter[] = [
  {
    id: 'merchant', name: 'A Trader on the Road', zh: '行商', realm: 1,
    text: 'A man with a mule and too many bundles has stopped where the path narrows. He does not ask what realm you are; he asks what you are carrying.',
    options: [
      {
        label: 'Trade four hides',
        detail: 'Four Beast Hide for one Spirit Core.',
        can: (s) => count(s.satchel, 'hide') >= 4,
        take: (s) => ({
          said: 'He counts the hides twice, which is how you know the core is real.',
          state: give({ ...s, satchel: pay(s.satchel, { hide: 4 }) }, { core: 1 }),
        }),
      },
      {
        label: 'Buy what he knows',
        detail: 'Two Spirit Core for what he has seen on the roads.',
        can: (s) => count(s.satchel, 'core') >= 2,
        take: (s) => ({
          said: 'He talks for an hour. Half of it is nonsense and the other half is a map.',
          state: { ...s, satchel: pay(s.satchel, { core: 2 }), insight: s.insight + 40 },
        }),
      },
      leave('Walk past him', 'He is still shouting prices when the path turns.'),
    ],
  },
  {
    id: 'stele', name: 'A Broken Stele', zh: '古碑', realm: 2,
    text: 'Half a stone tablet, face down in the grass for long enough that the grass has grown through it. The characters on the underside are cut deep and are not in any hand you were taught.',
    options: [
      {
        label: 'Read it through',
        detail: 'A long sitting. Insight, and the hours it costs your calm.',
        can: () => true,
        take: (s) => ({
          said: 'You get perhaps a third of it. The third is worth the afternoon.',
          state: stir({ ...s, insight: s.insight + 55 }, 6),
        }),
      },
      {
        label: 'Take a rubbing',
        detail: 'Carry it away instead of understanding it. Three Beast Hide of stone-sense.',
        can: () => true,
        take: (s) => ({
          said: 'The paper comes away black and legible. You can argue with it later.',
          state: give(s, { hide: 3 }),
        }),
      },
      leave('Set it back down', 'It has waited this long.'),
    ],
  },
  {
    id: 'spring', name: 'A Spirit Spring', zh: '靈泉', realm: 2,
    text: 'Water coming out of rock at the temperature of a held breath. Nothing lives in it. Things live all around it.',
    options: [
      {
        label: 'Sit in it until dusk',
        detail: 'The heart quiets by forty.',
        can: (s) => s.turmoil > 0,
        take: (s) => ({
          said: 'You come out cold to the bone and quiet with it.',
          state: quiet(s, 40),
        }),
      },
      {
        label: 'Bottle what you can',
        detail: 'Two Settling Pills, kept for a worse day.',
        can: () => true,
        take: (s) => ({
          said: 'Two flasks. It will not keep longer than that.',
          state: takePills(s, 'settling', 2),
        }),
      },
      leave('Drink and move on', 'It tastes of nothing at all.'),
    ],
  },
  {
    id: 'trail', name: 'A Fresh Trail', zh: '獸跡', realm: 1,
    text: 'Something large came through here within the hour and was not being careful about it.',
    options: [
      {
        label: 'Follow it',
        detail: 'One hunt back, immediately.',
        can: () => true,
        take: (s) => ({
          said: 'It is still where the trail said it would be.',
          state: { ...s, huntAnchorAt: s.huntAnchorAt - 3 * 3_600_000 },
        }),
      },
      {
        label: 'Read the sign instead',
        detail: 'What it was, and what that means. Insight.',
        can: () => true,
        take: (s) => ({
          said: 'Four toes and a drag. You will know it next time without looking.',
          state: { ...s, insight: s.insight + 25 },
        }),
      },
      leave('Go the other way', 'Whatever it was, it keeps going.'),
    ],
  },
  {
    id: 'dying', name: 'A Dying Cultivator', zh: '垂死者', realm: 3,
    text: 'He failed a tribulation somewhere above and came down the mountain to do this part alone. He has a satchel and about an hour.',
    options: [
      {
        label: 'Sit with him',
        detail: 'He talks. Insight, and a heart that is quieter for it.',
        can: () => true,
        take: (s) => ({
          said: 'He tells you the name of his line twice, in case you forget it.',
          state: quiet({ ...s, insight: s.insight + 70 }, 12),
        }),
      },
      {
        label: 'Take the satchel',
        detail: 'Everything he was carrying. It costs twenty of your calm.',
        can: () => true,
        take: (s) => ({
          said: 'He does not stop you. That is the part you keep.',
          state: stir(give(s, { core: 3, essence: 1 }), 20),
        }),
      },
      leave('Leave him his hour', 'You are down the slope before it is over.'),
    ],
  },
  {
    id: 'storm', name: 'Thunder Over the Ridge', zh: '雷雨', realm: 4,
    text: 'A storm that has been sitting on the high ground for three days and shows no sign of being finished with it.',
    options: [
      {
        label: 'Cultivate under it',
        detail: 'Six hours of qi at once, and eighteen turmoil for the privilege.',
        can: () => true,
        take: (s, roll) => ({
          said: roll < 0.5
            ? 'You come down with your ears ringing and your dantian full.'
            : 'Twice it nearly takes you. The third time you stop arguing and gather.',
          state: stir({ ...s, qi: s.qi + ratePerSecond(s, s.lastSeenAt) * 6 * 3600 }, 18),
        }),
      },
      {
        label: 'Shelter and wait it out',
        detail: 'Two days of nothing. The heart settles by twenty-five.',
        can: () => true,
        take: (s) => ({
          said: 'You listen to it from under an overhang and think about very little.',
          state: quiet(s, 25),
        }),
      },
      leave('Go around the long way', 'The storm is still there a week later.'),
    ],
  },
  {
    id: 'challenge', name: 'A Challenge', zh: '挑戰', realm: 4,
    text: 'Someone your own realm, on a bridge wide enough for one, who has decided this is the day.',
    options: [
      {
        label: 'Accept',
        detail: 'Win and take a great deal of insight. Lose and wear it for two hours.',
        can: () => true,
        take: (s, roll) => roll < 0.6
          ? { said: 'It is over in four exchanges and they are gracious about it.',
              state: { ...s, insight: s.insight + 120 } }
          : { said: 'They were better. You will be, eventually, and you know why now.',
              state: stir({ ...s, insight: s.insight + 30, injuredUntil: Math.max(s.injuredUntil, 0) + 2 * 3_600_000 }, 10) },
      },
      {
        label: 'Refuse, and say why',
        detail: 'No fight. Saying it out loud costs eight of your calm.',
        can: () => true,
        take: (s) => ({
          said: 'They step aside. You think about it for longer than the fight would have taken.',
          state: stir(s, 8),
        }),
      },
    ],
  },
  {
    id: 'cave', name: 'A Sealed Cave', zh: '洞府', realm: 5,
    text: 'A door of stone with a talisman across it that has held for longer than the sect that wrote it. Somebody wanted what is behind this to stay behind it.',
    options: [
      {
        label: 'Break the seal',
        detail: 'What a dead cultivator left. Thirty turmoil, and it may take a bite out of you.',
        can: () => true,
        take: (s, roll) => roll < 0.65
          ? { said: 'Dust, a rack of jars, and one of them still worth opening.',
              state: stir(give(s, { core: 4, essence: 3 }), 30) }
          : { said: 'The talisman was the only thing holding the ceiling. You get out with less than you hoped.',
              state: stir({ ...give(s, { core: 2 }), injuredUntil: Math.max(s.injuredUntil, 0) + 3 * 3_600_000 }, 30) },
      },
      {
        label: 'Copy the talisman instead',
        detail: 'Leave the door shut and take the writing. Insight.',
        can: () => true,
        take: (s) => ({
          said: 'Whoever wrote this was frightened and very good. Both parts are instructive.',
          state: { ...s, insight: s.insight + 90 },
        }),
      },
      leave('Leave it sealed', 'You mark the place and do not come back.'),
    ],
  },
  {
    id: 'market', name: 'A Night Market', zh: '夜市', realm: 6,
    text: 'Lanterns in a valley that has no village in it. The stalls are open, the sellers are polite, and none of them will say where the goods came from.',
    options: [
      {
        label: 'Buy in bulk',
        detail: 'Six True Essence for eight Spirit Core. A poor rate, honestly given.',
        can: (s) => count(s.satchel, 'core') >= 8,
        take: (s) => ({
          said: 'The seller apologises for the price twice, which does not change it.',
          state: give({ ...s, satchel: pay(s.satchel, { core: 8 }) }, { essence: 6 }),
        }),
      },
      {
        label: 'Sell what you are carrying',
        detail: 'Four Beast Hide for two Tribulation Pills, already rolled.',
        can: (s) => canPay(s.satchel, { hide: 4 }),
        take: (s) => ({
          said: 'She takes the hides without weighing them and hands over the flask.',
          state: takePills({ ...s, satchel: pay(s.satchel, { hide: 4 }) }, 'tribulation', 2),
        }),
      },
      leave('Walk the length of it and leave', 'By morning there is nothing in the valley but grass.'),
    ],
  },
  {
    id: 'ruin', name: 'An Ancestor’s Marker', zh: '祖碑', realm: 7,
    text: 'A cairn with a seal cut into the top stone, weathered almost flat. Someone of a line like yours stopped here, a long time ago, and did not go any further.',
    options: [
      {
        label: 'Sit the night out beside it',
        detail: 'A great deal of insight, and the heart settles by fifteen.',
        can: () => true,
        take: (s) => ({
          said: 'You do not learn anything. You understand something, which is slower and keeps.',
          state: quiet({ ...s, insight: s.insight + 200 }, 15),
        }),
      },
      {
        label: 'Take the top stone',
        detail: 'Four True Essence in it, and twenty-five turmoil for the taking.',
        can: () => true,
        take: (s) => ({
          said: 'It comes away easily, which is somehow worse.',
          state: stir(give(s, { essence: 4 }), 25),
        }),
      },
      leave('Add a stone and go on', 'The cairn is one stone higher than you found it.'),
    ],
  },
]

export function encounter(id: string): Encounter | undefined {
  return ENCOUNTERS.find((e) => e.id === id)
}

/* ------------------------------------------------------------- the roll */

/** How often opening the game turns something up, once the gap below has passed. */
export const ENCOUNTER_CHANCE = 0.3
/**
 * The quiet hours between encounters.
 *
 * Without it the Blade Path — five sessions an evening — would meet five times as many
 * strangers as the Sword Path, and the one system whose whole job is to be a surprise
 * would become a thing you farm by reopening the app.
 */
export const ENCOUNTER_GAP_MS = 20 * 3_600_000

export function eligible(s: PlayerState): Encounter[] {
  return ENCOUNTERS.filter((e) => e.realm <= s.realm && e.id !== s.lastEncounter)
}

/**
 * What, if anything, is waiting when the player opens the game. Pure: the roll comes
 * from the caller, so the server draws it and the phone cannot re-roll for a better one.
 */
export function chanceFor(s: PlayerState): number {
  return Math.min(0.9, ENCOUNTER_CHANCE * (1 + relicValue(s, 'omen')))
}

export function draw(s: PlayerState, now: number, roll: number): Encounter | null {
  if (s.encounter) return encounter(s.encounter) ?? null
  if (now - s.lastEncounterAt < ENCOUNTER_GAP_MS) return null
  const chance = chanceFor(s)
  if (roll >= chance) return null
  const pool = eligible(s)
  if (!pool.length) return null
  // Re-use the same roll's low bits rather than asking for a second one: one action,
  // one roll, which is the rule the whole engine is built on.
  return pool[Math.floor((roll / chance) * pool.length) % pool.length]
}

/** Resolve the waiting encounter. Out-of-range or unaffordable choices change nothing. */
export function choose(s: PlayerState, index: number, now: number, roll: number): Outcome {
  const e = s.encounter ? encounter(s.encounter) : null
  if (!e) return { said: '', state: s }
  const option = e.options[index]
  if (!option || !option.can(s)) return { said: '', state: s }
  const out = option.take(s, roll)
  return {
    said: out.said,
    state: { ...out.state, encounter: null, lastEncounter: e.id, lastEncounterAt: now },
  }
}
