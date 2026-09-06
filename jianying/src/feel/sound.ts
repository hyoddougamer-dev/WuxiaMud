/**
 * Every sound the game makes, synthesised.
 *
 * NO AUDIO FILES, AND THAT IS A DECISION RATHER THAN A LIMITATION. Three things
 * pushed it: the game ships as a single self-contained HTML file, where a
 * sample is a base64 blob that has to be decoded before the first frame; the
 * CC0 sound libraries are unreachable from the machine this was written on, so
 * anything sampled would have been unverifiable; and a game drawn as brush
 * strokes on paper wants sounds that behave the same way — dry, short,
 * unpitched, more gesture than note. A filtered noise burst IS a brush stroke.
 *
 * THE WHOLE PALETTE IS TWO PRIMITIVES. `noise` is a burst of filtered white
 * noise with an envelope — every impact, every cut, every step in the game is
 * one of these with a different filter and length. `tone` is a sine or triangle
 * with a pitch slide — used only where something must read as a NOTE rather
 * than an event: a level, a find, a gate. Keeping the vocabulary at two is what
 * stops thirty sounds from being thirty unrelated ideas.
 *
 * ALLOCATION. A survivors-like fires impact sounds dozens of times a second at
 * peak, and Web Audio nodes are created per voice by design — there is no pool
 * to reuse. What protects the frame rate instead is `VOICE_CEILING`: past it,
 * new voices are dropped rather than queued. A sound nobody can distinguish in
 * a wall of forty others is not worth a garbage collection.
 *
 * AUTOPLAY. A browser will not let audio start before the player touches
 * something, and a context created too early lands 'suspended' and stays that
 * way silently. `unlock` is called from the title screen's first tap, which is
 * a real gesture, and everything before that point is a no-op rather than a
 * queue — a burst of eleven sounds the moment the game starts is worse than
 * eleven sounds nobody heard.
 */

/** Concurrent voices past which new ones are dropped. */
const VOICE_CEILING = 14

/** How loud the whole game is, before per-sound gain. */
const MASTER = 0.32

let ctx: AudioContext | null = null
let master: GainNode | null = null
let voices = 0
let muted = false
/** One second of noise, generated once and replayed — see `noise`. */
let noiseBuffer: AudioBuffer | null = null

/** True once the context exists and is running. */
export function ready(): boolean {
  return ctx !== null && ctx.state === 'running' && !muted
}

/**
 * Starts audio. Must be called from inside a real user gesture.
 *
 * Safe to call repeatedly: a context that already runs is left alone, and one
 * the browser suspended (a backgrounded tab, a phone call) is resumed, which is
 * the case that would otherwise leave the game silent for the rest of a session
 * with no way back.
 */
export function unlock(): void {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return
      ctx = new Ctor()
      master = ctx.createGain()
      master.gain.value = muted ? 0 : MASTER
      master.connect(ctx.destination)
      // Two seconds of white noise, made once. Every percussive sound in the
      // game is a window onto this buffer through a different filter, which is
      // both cheaper than generating per voice and the reason they all sound
      // like they belong to one instrument.
      const frames = ctx.sampleRate * 2
      noiseBuffer = ctx.createBuffer(1, frames, ctx.sampleRate)
      const data = noiseBuffer.getChannelData(0)
      for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1
    }
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    // No audio is a fine outcome. A thrown constructor must never take the
    // game down with it, and this is the one place that can throw.
    ctx = null
  }
}

/** Silences everything without tearing the context down. */
export function setMuted(value: boolean): void {
  muted = value
  if (master && ctx) master.gain.setTargetAtTime(value ? 0 : MASTER, ctx.currentTime, 0.02)
}

export function isMuted(): boolean {
  return muted
}

interface NoiseOpts {
  /** Seconds. Everything here is under a fifth of one. */
  length: number
  /** Band centre, Hz. Low reads as weight, high as edge. */
  hz: number
  /** Filter Q. Higher is more pitched, more "ring". */
  q?: number
  gain?: number
  /** Hz the band slides to over the length. Falling reads as a body dropping. */
  slideTo?: number
  type?: BiquadFilterType
}

/** A filtered burst. The brush stroke of this palette. */
function noise(o: NoiseOpts): void {
  if (!ctx || !master || !noiseBuffer || muted || voices >= VOICE_CEILING) return
  const t = ctx.currentTime
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer
  // A random window into the buffer, so ten sweeps in a row are not ten
  // identical waveforms — which is what makes a repeated sound read as a loop.
  src.loop = true
  const filter = ctx.createBiquadFilter()
  filter.type = o.type ?? 'bandpass'
  filter.frequency.setValueAtTime(o.hz, t)
  if (o.slideTo !== undefined) filter.frequency.exponentialRampToValueAtTime(Math.max(40, o.slideTo), t + o.length)
  filter.Q.value = o.q ?? 1.2
  const env = ctx.createGain()
  // Percussive: up in three milliseconds, then decaying. An attack any slower
  // stops reading as an impact and starts reading as a swell.
  env.gain.setValueAtTime(0, t)
  env.gain.linearRampToValueAtTime(o.gain ?? 0.5, t + 0.003)
  env.gain.exponentialRampToValueAtTime(0.0001, t + o.length)
  src.connect(filter).connect(env).connect(master)
  voices++
  src.onended = () => { voices-- }
  src.start(t, Math.random() * 1.5)
  src.stop(t + o.length)
}

interface ToneOpts {
  hz: number
  length: number
  toHz?: number
  gain?: number
  type?: OscillatorType
}

/** A pitched slide. Reserved for the few things that are notes, not events. */
function tone(o: ToneOpts): void {
  if (!ctx || !master || muted || voices >= VOICE_CEILING) return
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.type = o.type ?? 'sine'
  osc.frequency.setValueAtTime(o.hz, t)
  if (o.toHz !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.toHz), t + o.length)
  const env = ctx.createGain()
  env.gain.setValueAtTime(0, t)
  env.gain.linearRampToValueAtTime(o.gain ?? 0.22, t + 0.012)
  env.gain.exponentialRampToValueAtTime(0.0001, t + o.length)
  osc.connect(env).connect(master)
  voices++
  osc.onended = () => { voices-- }
  osc.start(t)
  osc.stop(t + o.length)
}

/**
 * The game's sounds, named for what happens rather than for how they are made.
 *
 * Each one is tuned against the others rather than in isolation, because what a
 * player hears is the MIX: the sweep fires two or three times a second and must
 * sit under everything, a hurt happens rarely and must cut through, and a parry
 * has to be audible inside a wall of hits or the mechanic stays invisible.
 */
export const sfx = {
  /** The blade moving. Airy, low, and quiet — it happens constantly. */
  sweep(): void {
    noise({ length: 0.12, hz: 1900, slideTo: 700, q: 0.8, gain: 0.16 })
  },
  /** A blade leaving the hand. Shorter and higher than a sweep. */
  throw(): void {
    noise({ length: 0.07, hz: 3200, slideTo: 1600, q: 1.4, gain: 0.13 })
  },
  /** Landing on a body. The dry thud the whole palette is built around. */
  hit(): void {
    noise({ length: 0.07, hz: 320, slideTo: 150, q: 1.6, gain: 0.3 })
  },
  /** A body falling. The same thud, longer and lower, with a tail. */
  kill(): void {
    noise({ length: 0.17, hz: 240, slideTo: 90, q: 1.1, gain: 0.34 })
  },
  /** Every Nth blow. The one impact allowed a ring to it. */
  crit(): void {
    noise({ length: 0.24, hz: 620, slideTo: 190, q: 5.5, gain: 0.4 })
  },
  /**
   * A shaft cut out of the air.
   *
   * The hardest sound in the game to place, because a parry is the ABSENCE of
   * being hit and has to be heard as clearly as being hit is. High, metallic,
   * and pitched — the only percussive sound with a real ring — so it cuts
   * through a wall of low thuds instead of joining it. See Hazards.parry.
   */
  parry(): void {
    noise({ length: 0.19, hz: 4200, slideTo: 2600, q: 9, gain: 0.34 })
    tone({ hz: 2400, toHz: 1500, length: 0.13, gain: 0.09, type: 'triangle' })
  },
  /** The player taking damage. Low, close, and unlike anything else. */
  hurt(): void {
    noise({ length: 0.3, hz: 180, slideTo: 70, q: 0.7, gain: 0.5, type: 'lowpass' })
  },
  /** Qi collected. Deliberately tiny: it fires hundreds of times a run. */
  qi(): void {
    tone({ hz: 900, toHz: 1350, length: 0.05, gain: 0.045, type: 'sine' })
  },
  /** Equipment on the ground. A note, because a find is an event. */
  found(): void {
    tone({ hz: 700, toHz: 1050, length: 0.18, gain: 0.16, type: 'triangle' })
  },
  /** A level. Two notes rising — the only interval in the game. */
  level(): void {
    tone({ hz: 520, toHz: 780, length: 0.22, gain: 0.16, type: 'sine' })
    tone({ hz: 780, toHz: 1170, length: 0.3, gain: 0.12, type: 'sine' })
  },
  /** The rift's boss arriving. Low, long, and the only thing that swells. */
  boss(): void {
    tone({ hz: 110, toHz: 55, length: 1.1, gain: 0.3, type: 'triangle' })
    noise({ length: 0.9, hz: 200, slideTo: 60, q: 0.6, gain: 0.24, type: 'lowpass' })
  },
  /** The gate. The one sound allowed to feel like an arrival. */
  gate(): void {
    tone({ hz: 440, toHz: 660, length: 0.5, gain: 0.2, type: 'sine' })
    tone({ hz: 660, toHz: 880, length: 0.7, gain: 0.14, type: 'sine' })
  },
  /** Death. Everything else stops mattering, so it may be the longest. */
  death(): void {
    tone({ hz: 220, toHz: 60, length: 1.4, gain: 0.3, type: 'sine' })
    noise({ length: 1.0, hz: 300, slideTo: 50, q: 0.5, gain: 0.26, type: 'lowpass' })
  },
  /**
   * A skill going off.
   *
   * A rising pair a fifth apart — related to `level`'s interval and clearly not
   * it, because both say "something good just happened" and the player has to
   * be able to tell which. Short, because two of the three slots fire
   * themselves and a long sound would be playing most of the fight.
   */
  cast(): void {
    tone({ hz: 620, toHz: 930, length: 0.14, gain: 0.13, type: 'triangle' })
    noise({ length: 0.1, hz: 3000, slideTo: 1400, q: 6, gain: 0.09 })
  },
  /** A tap on a menu. Barely there; it must never be the loudest thing. */
  tap(): void {
    noise({ length: 0.035, hz: 2600, q: 2.2, gain: 0.1 })
  },
}
