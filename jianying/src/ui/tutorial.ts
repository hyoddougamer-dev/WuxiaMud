/**
 * Coaching for the first expedition, and only the first.
 *
 * Deliberately built on top of the banner queue rather than as modal steps.
 * A survivors-like cannot stop for a lesson: the crowd keeps arriving, and a
 * dialog the player must dismiss mid-fight is worse than no teaching at all.
 * So every lesson is one line that appears, is read peripherally, and leaves.
 *
 * Each step fires on a CONDITION rather than a timer, so it lands at the moment
 * it is about to be useful — the qi line when the first mote is on the ground,
 * the health line when something has actually hit you. A script on a stopwatch
 * would explain motes to a player who has not seen one and explain damage to a
 * player who has taken none.
 */
import type { Banners } from './banner'

export interface TutorialState {
  elapsed: number
  kills: number
  motes: number
  hp: number
  maxHp: number
  insight: number
  /** How full the rift is, 0..1. The expedition's actual objective. */
  rift: number
  /** Pieces of equipment on the ground or picked up this run. */
  found: number
}

export interface Tutorial {
  /** Called every tick during the first expedition. */
  update(state: TutorialState): void
  reset(): void
  /** True once every lesson has fired. */
  readonly done: boolean
}

interface Step {
  id: string
  /** Fires when this first returns true. */
  when(s: TutorialState): boolean
  text: string
  sub: string
}

/**
 * THE GOAL COMES FIRST, and it did not used to come at all.
 *
 * Every lesson here was a VERB: drag to move, the blade swings itself, walk
 * over the qi, this is dodge, dying ends the run. A playtest read the whole set
 * and came away with "não existe bem onboarding e explicação do que é o jogo ou
 * como funciona" — which is exactly right, because not one line said what the
 * player was trying to DO. The bar at the bottom was never named, filling it
 * was never given a purpose, and the choice at the gate — the thing the entire
 * loop is built around — was never mentioned before it appeared.
 *
 * So the first line is the objective and the last is the choice, and the verbs
 * live in between where they belong: instructions for a thing you already want.
 */
const STEPS: readonly Step[] = [
  {
    id: 'goal',
    when: (s) => s.elapsed > 0.6,
    text: 'Fill the rift',
    sub: 'Every kill feeds the bar at the top',
  },
  {
    id: 'move',
    when: (s) => s.elapsed > 2.5,
    text: 'Drag anywhere to move',
    sub: 'The blade swings on its own',
  },
  {
    id: 'aim',
    when: (s) => s.kills >= 1,
    text: 'It strikes at whatever is nearest',
    sub: 'So choose where to stand',
  },
  {
    id: 'qi',
    when: (s) => s.motes >= 3,
    text: 'Walk over the qi they drop',
    sub: 'It is the only way to gain Insight',
  },
  {
    id: 'insight',
    when: (s) => s.insight >= 2,
    text: 'Insight buys a technique',
    sub: 'Gone when this road ends',
  },
  {
    // TAUGHT AT THE FIRST PIECE ON THE GROUND, because the line only means
    // anything with the thing in front of you. It is also the single most
    // important sentence in the game and was never said: techniques are
    // temporary and GEAR IS NOT, which is the whole reason to go out again.
    id: 'loot',
    when: (s) => s.found >= 1,
    text: 'That one you keep',
    sub: 'Techniques end with the road. Equipment does not.',
  },
  {
    id: 'hurt',
    when: (s) => s.hp < s.maxHp,
    // Taught at the FIRST hit, and it replaces "you cannot cut your way out" —
    // which was true when there was nothing to do about it, and is now advice
    // that leads nowhere. The moment a player first loses health is the moment
    // they will listen to how not to, so the lesson goes exactly there.
    text: 'Dodge — tap it, or press space',
    sub: 'You cannot be touched mid-step',
  },
  {
    id: 'end',
    when: (s) => s.hp < s.maxHp * 0.4,
    text: 'Dying is how an expedition ends',
    sub: 'You keep the cultivation either way',
  },
  {
    // The gate, announced BEFORE it arrives. It used to appear with no warning
    // and ask for a decision the player had never been told they would face.
    id: 'gate',
    when: (s) => s.rift >= 0.55,
    text: 'Halfway',
    sub: 'Fill it and the road\u2019s keeper comes. Beat it and you choose: leave, or go deeper.',
  },
]

/** Seconds between lessons, so two conditions met at once do not collide. */
const SPACING = 3.4

export function createTutorial(banners: Banners): Tutorial {
  let index = 0
  /** Elapsed time of the last lesson shown, so they cannot pile up. */
  let last = 0

  return {
    get done() {
      return index >= STEPS.length
    },

    reset() {
      index = 0
      last = 0
    },

    update(state) {
      if (index >= STEPS.length) return
      // Steps fire in order. Out of order they would teach dying before
      // moving, and each line assumes the ones before it have been read.
      const step = STEPS[index]!
      if (!step.when(state)) return
      // Several conditions can come true in the same second — taking a hit
      // while a level-up lands, say. Spacing them keeps each one readable
      // instead of flashing three lines through one banner slot.
      if (last > 0 && state.elapsed - last < SPACING) return
      banners.show(step.text, 'plain', step.sub)
      last = state.elapsed
      index++
    },
  }
}
