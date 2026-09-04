/**
 * What the game does to your ears and your hand, in one place.
 *
 * WHY THE TWO ARE ONE MODULE. Sound and haptics answer the same question — how
 * does the player learn that something happened without looking at it — and
 * every event that deserves one usually deserves the other. Kept apart, they
 * drift: a sound gets added and the tap does not, and the phone stops agreeing
 * with the speakers. Kept together, an event is named ONCE and both channels
 * are decided at the same moment, which is also the only way to keep them
 * balanced against each other.
 *
 * HAPTICS ARE RATIONED, AND SOUND IS NOT. A sound the player half-hears in a
 * mix costs nothing; a vibration is felt at full strength every time, so the
 * phone buzzing on every one of forty hits a second would be unusable and would
 * flatten the battery. Only the events a player must not miss get a tap: taking
 * damage, parrying, a level, the gate, death. Hits and qi do not.
 *
 * IT DEGRADES TO NOTHING. On a desktop browser Capacitor's Haptics plugin is
 * not implemented and every call rejects; in a headless test there is no
 * AudioContext at all. Both paths swallow that rather than reporting it,
 * because a game that throws when it cannot buzz is worse than a quiet one.
 */
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { sfx, unlock as unlockAudio, setMuted, isMuted, ready } from './sound'

export { setMuted, isMuted, ready }

/** Starts audio. Must be called from inside a real user gesture. */
export function unlock(): void {
  unlockAudio()
}

let hapticsOn = true

export function setHaptics(value: boolean): void {
  hapticsOn = value
}

/** Fire-and-forget. The web build rejects every one of these; that is fine. */
function buzz(style: ImpactStyle): void {
  if (!hapticsOn) return
  void Haptics.impact({ style }).catch(() => {})
}

function notify(type: NotificationType): void {
  if (!hapticsOn) return
  void Haptics.notification({ type }).catch(() => {})
}

/**
 * The events, named for what happened in the game.
 *
 * Callers say `feel.parry()`, never "play a 4kHz burst and a light tap". That
 * is what lets the whole palette be retuned in sound.ts without touching a
 * single call site — and there are call sites in the hot loop.
 */
export const feel = {
  sweep: (): void => sfx.sweep(),
  throw: (): void => sfx.throw(),
  hit: (): void => sfx.hit(),
  kill: (): void => sfx.kill(),
  crit: (): void => {
    sfx.crit()
    buzz(ImpactStyle.Light)
  },
  /** Saved from a shaft. Heard AND felt: the mechanic is invisible otherwise. */
  parry: (): void => {
    sfx.parry()
    buzz(ImpactStyle.Light)
  },
  hurt: (): void => {
    sfx.hurt()
    buzz(ImpactStyle.Medium)
  },
  qi: (): void => sfx.qi(),
  found: (): void => {
    sfx.found()
    buzz(ImpactStyle.Light)
  },
  level: (): void => {
    sfx.level()
    notify(NotificationType.Success)
  },
  boss: (): void => {
    sfx.boss()
    buzz(ImpactStyle.Heavy)
  },
  gate: (): void => {
    sfx.gate()
    notify(NotificationType.Success)
  },
  death: (): void => {
    sfx.death()
    notify(NotificationType.Error)
  },
  tap: (): void => sfx.tap(),
}
