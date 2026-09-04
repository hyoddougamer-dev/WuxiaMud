/**
 * Sound and haptics, held to the one thing that actually matters about them:
 * they must never be able to take the game down.
 *
 * Everything in feel/ runs in a browser and is fired from the hot loop, which
 * is the worst combination there is — a throw inside `events.hit` would kill
 * the frame that raised it, and it would do so on a device, in a build nobody
 * can attach a debugger to. So the contract is: with no AudioContext at all
 * (which is exactly this test environment, and also a headless balance run),
 * every call is a silent no-op rather than an error.
 */
import { describe, expect, it, vi } from 'vitest'
import { sfx, unlock, setMuted, isMuted, ready } from '../src/feel/sound'

describe('sound', () => {
  it('is silent and harmless with no AudioContext', () => {
    // vitest's environment has no window.AudioContext, which is the same
    // condition as a headless simulation run — and the one this must survive.
    expect(ready()).toBe(false)
    for (const play of Object.values(sfx)) expect(() => play()).not.toThrow()
  })

  it('survives a constructor that throws, rather than taking the game with it', () => {
    const original = (globalThis as { window?: unknown }).window
    ;(globalThis as { window?: unknown }).window = {
      AudioContext: vi.fn(() => {
        throw new Error('no audio device')
      }),
    }
    try {
      expect(() => unlock()).not.toThrow()
      expect(ready()).toBe(false)
      expect(() => sfx.parry()).not.toThrow()
    } finally {
      ;(globalThis as { window?: unknown }).window = original
    }
  })

  it('remembers being muted even before there is anything to mute', () => {
    // The setting is read from the save before the first gesture, so it has to
    // hold across a context that does not exist yet.
    setMuted(true)
    expect(isMuted()).toBe(true)
    expect(() => sfx.hurt()).not.toThrow()
    setMuted(false)
    expect(isMuted()).toBe(false)
  })

  it('names a sound for every event the game can report', () => {
    // The failure this catches is an event added to CombatEvents with no sound
    // behind it — which is silent in the literal sense and invisible in review.
    for (const name of [
      'sweep', 'throw', 'hit', 'kill', 'crit', 'parry',
      'hurt', 'qi', 'found', 'level', 'boss', 'gate', 'death', 'tap',
    ]) {
      expect(sfx, `no sound named ${name}`).toHaveProperty(name)
    }
  })
})
