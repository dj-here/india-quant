export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMuted: boolean = false;
  private initialized: boolean = false;

  constructor() {}

  public init(): void {
    if (this.initialized || typeof window === "undefined") return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.masterGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.masterGain);

      this.initialized = true;
    } catch (e) {
      console.warn("Web Audio API not supported or blocked by browser.");
    }
  }

  public resumeContext(): void {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setVolume(master: number, sfx: number): void {
    if (!this.ctx || !this.masterGain || !this.sfxGain) return;
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : master, this.ctx.currentTime);
    this.sfxGain.gain.setValueAtTime(sfx, this.ctx.currentTime);
  }

  public toggleMute(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.8, this.ctx.currentTime);
    }
  }

  /**
   * Laser Firing SFX: Rapid frequency downward slide
   */
  public playLaser(pitchMod: number = 1.0): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resumeContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(880 * pitchMod, now);
    osc.frequency.exponentialRampToValueAtTime(110 * pitchMod, now + 0.12);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  /**
   * Heavy Explosion Crunch SFX: Low frequency noise burst
   */
  public playExplosion(pitchMod: number = 1.0): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resumeContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = "triangle";
    osc.frequency.setValueAtTime(160 * pitchMod, now);
    osc.frequency.exponentialRampToValueAtTime(30 * pitchMod, now + 0.28);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.29);
  }

  /**
   * Gem Pickup Chime with escalating pitch based on combo streak
   */
  public playGemPickup(combo: number = 0): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resumeContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    // Pentatonic scale frequency escalation
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const baseFreq = scale[Math.min(combo, 15) % scale.length];
    const octaveMult = 1 + Math.floor(Math.min(combo, 15) / scale.length) * 0.4;

    osc.type = "sine";
    osc.frequency.setValueAtTime(baseFreq * octaveMult, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * octaveMult * 1.25, now + 0.09);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Level Up Fanfare: 3-tone ascending chord
   */
  public playLevelUp(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resumeContext();

    const notes = [440, 554.37, 659.25, 880];
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const noteTime = now + idx * 0.08;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.22, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.36);
    });
  }

  /**
   * Boss Warning Siren: Dual frequency alert
   */
  public playBossWarning(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const cycleStart = now + i * 0.45;

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(440, cycleStart);
      osc.frequency.linearRampToValueAtTime(320, cycleStart + 0.4);

      gain.gain.setValueAtTime(0.25, cycleStart);
      gain.gain.linearRampToValueAtTime(0.001, cycleStart + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(cycleStart);
      osc.stop(cycleStart + 0.41);
    }
  }

  /**
   * Player Hit Damage grunt
   */
  public playPlayerHit(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resumeContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = "square";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.16);
  }
}

export const soundEngine = new SoundEngine();
