// Audio Manager for Wuxia Combat
// Uses Web Audio API to synthesize authentic martial arts and mystical sounds

class AudioManager {
  private audioContext: AudioContext | null = null;
  private musicEnabled: boolean = true;
  private sfxEnabled: boolean = true;
  private musicVolume: number = 0.35;
  private sfxVolume: number = 0.6;
  private masterGain: GainNode | null = null;

  constructor() {
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    try {
      const audioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new audioContextClass();
      if (this.audioContext) {
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.masterGain.gain.value = this.musicVolume;
      }
    } catch (e) {
      console.log('Web Audio API not supported:', e);
    }
  }

  private playTone(frequency: number, duration: number, volume: number, waveType: OscillatorType = 'sine') {
    if (!this.audioContext || !this.masterGain || !this.sfxEnabled) return;

    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = waveType;
    osc.frequency.value = frequency;
    
    gain.gain.setValueAtTime(volume * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + duration);
  }

  private playMelody(notes: Array<{ freq: number; duration: number }>, volume: number) {
    if (!this.audioContext || !this.masterGain || !this.sfxEnabled) return;

    let time = this.audioContext.currentTime;
    notes.forEach(note => {
      setTimeout(() => {
        this.playTone(note.freq, note.duration, volume);
      }, (time - this.audioContext!.currentTime) * 1000);
      time += note.duration;
    });
  }

  playMusic(trackId: string) {
    if (!this.musicEnabled || !this.audioContext || !this.masterGain) return;

    // Play different background music based on track
    if (trackId === 'combat_music') {
      // Epic Chinese-inspired background melody
      const melody = [
        { freq: 262, duration: 0.4 }, // C
        { freq: 330, duration: 0.4 }, // E
        { freq: 392, duration: 0.4 }, // G
        { freq: 440, duration: 0.6 }, // A
        { freq: 392, duration: 0.4 }, // G
        { freq: 330, duration: 0.4 }, // E
        { freq: 294, duration: 0.4 }, // D
        { freq: 262, duration: 0.8 }, // C
      ];
      
      // Loop the melody
      const loop = () => {
        if (this.musicEnabled && trackId === 'combat_music') {
          this.playMelody(melody, this.musicVolume);
          setTimeout(loop, 4000);
        }
      };
      loop();
    }
  }

  stopMusic() {
    this.musicEnabled = false;
  }

  playSFX(trackId: string) {
    if (!this.sfxEnabled || !this.audioContext) return;

    switch (trackId) {
      case 'attack':
        // Sword slash - quick rising then falling tone
        this.playTone(200, 0.1, 0.7, 'triangle');
        setTimeout(() => this.playTone(150, 0.1, 0.6, 'triangle'), 50);
        break;
        
      case 'skill_cast':
        // Mystical energy - ascending tones
        this.playTone(440, 0.15, 0.8, 'sine');
        setTimeout(() => this.playTone(550, 0.15, 0.8, 'sine'), 75);
        setTimeout(() => this.playTone(660, 0.2, 0.9, 'sine'), 150);
        break;
        
      case 'damage_received':
        // Impact sound - low frequency thump
        this.playTone(100, 0.2, 0.8, 'sine');
        break;
        
      case 'critical':
        // Power strike - three ascending high tones
        this.playTone(600, 0.1, 0.9, 'triangle');
        setTimeout(() => this.playTone(750, 0.1, 0.9, 'triangle'), 100);
        setTimeout(() => this.playTone(900, 0.15, 1.0, 'triangle'), 200);
        break;
        
      case 'victory':
        // Victory fanfare - triumphant melody
        const victoryMelody = [
          { freq: 523, duration: 0.2 }, // C5
          { freq: 659, duration: 0.2 }, // E5
          { freq: 784, duration: 0.3 }, // G5
        ];
        this.playMelody(victoryMelody, 0.8);
        break;
        
      case 'defeat':
        // Defeat - descending sad tones
        this.playTone(400, 0.3, 0.7, 'sine');
        setTimeout(() => this.playTone(300, 0.4, 0.7, 'sine'), 300);
        break;
    }
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.musicVolume;
    }
  }

  setSFXVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) {
      this.stopMusic();
    } else {
      this.playMusic('combat_music');
    }
    return this.musicEnabled;
  }

  toggleSFX() {
    this.sfxEnabled = !this.sfxEnabled;
    return this.sfxEnabled;
  }

  isMusicEnabled() {
    return this.musicEnabled;
  }

  isSFXEnabled() {
    return this.sfxEnabled;
  }

  getMusicVolume() {
    return this.musicVolume;
  }

  getSFXVolume() {
    return this.sfxVolume;
  }
}

export const audioManager = new AudioManager();
