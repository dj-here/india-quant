export class MusicSynthesizer {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private stemGains: GainNode[] = [];
  private isPlaying: boolean = false;
  private isMuted: boolean = false;
  private loopInterval: any = null;
  private currentStep: number = 0;

  constructor() {}

  public init(): void {
    if (this.ctx || typeof window === "undefined") return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.musicGain.connect(this.ctx.destination);

      // Create 4 stem gains: [Pad, Bass, Arp, Drums]
      for (let i = 0; i < 4; i++) {
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(i === 0 ? 0.8 : 0.0, this.ctx.currentTime);
        gain.connect(this.musicGain);
        this.stemGains.push(gain);
      }
    } catch (e) {
      console.warn("MusicSynthesizer could not initialize Web Audio context.");
    }
  }

  public start(): void {
    if (this.isPlaying) return;
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    this.isPlaying = true;
    this.currentStep = 0;

    // 130 BPM = ~115ms per 16th note
    const stepDurationMs = 115;
    this.loopInterval = setInterval(() => {
      this.playSequencerStep();
    }, stepDurationMs);
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
  }

  public setVolume(volume: number): void {
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.isMuted ? 0 : volume, this.ctx.currentTime);
    }
  }

  public toggleMute(muted: boolean): void {
    this.isMuted = muted;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(muted ? 0 : 0.7, this.ctx.currentTime);
    }
  }

  /**
   * Adjusts active stem levels based on run elapsed seconds and intensity
   */
  public updateIntensity(timeSec: number): void {
    if (!this.ctx || this.stemGains.length < 4) return;
    const now = this.ctx.currentTime;

    // Stem 0: Ambient Pad (Always active)
    this.stemGains[0].gain.setTargetAtTime(0.75, now, 1.0);

    // Stem 1: Bass Pulse (Activates after 25s)
    const bassVol = timeSec > 25 ? 0.7 : 0.0;
    this.stemGains[1].gain.setTargetAtTime(bassVol, now, 1.5);

    // Stem 2: Fast Cyber Arp (Activates after 60s)
    const arpVol = timeSec > 60 ? 0.65 : 0.0;
    this.stemGains[2].gain.setTargetAtTime(arpVol, now, 1.5);

    // Stem 3: Heavy Driving Drums (Activates after 120s or during boss)
    const drumVol = timeSec > 120 ? 0.8 : 0.0;
    this.stemGains[3].gain.setTargetAtTime(drumVol, now, 1.5);
  }

  private playSequencerStep(): void {
    if (!this.ctx || !this.isPlaying || this.isMuted) return;
    const now = this.ctx.currentTime;
    const step = this.currentStep % 16;

    // 1. Bassline (Stem 1) on 8th notes (0, 2, 4, 6, 8, 10, 12, 14)
    if (step % 2 === 0 && this.stemGains[1].gain.value > 0.05) {
      const bassNotes = [110, 110, 130.81, 146.83];
      const note = bassNotes[Math.floor(this.currentStep / 8) % bassNotes.length];
      this.playSynthTone(note, 0.12, "sawtooth", this.stemGains[1], 0.25);
    }

    // 2. Arpeggio (Stem 2) on 16th notes
    if (this.stemGains[2].gain.value > 0.05) {
      const arpNotes = [220, 261.63, 329.63, 392.0, 440, 523.25, 659.25, 783.99];
      const note = arpNotes[(step * 3) % arpNotes.length];
      this.playSynthTone(note, 0.07, "triangle", this.stemGains[2], 0.18);
    }

    // 3. Cyber Drum Kick on beats 0, 4, 8, 12 (Stem 3)
    if (step % 4 === 0 && this.stemGains[3].gain.value > 0.05) {
      this.playKickDrum(now);
    }

    this.currentStep++;
  }

  private playSynthTone(freq: number, duration: number, type: OscillatorType, targetGain: GainNode, vol: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(targetGain);

    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  private playKickDrum(now: number): void {
    if (!this.ctx || this.stemGains.length < 4) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.1);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.stemGains[3]);

    osc.start(now);
    osc.stop(now + 0.13);
  }
}

export const musicSynthesizer = new MusicSynthesizer();
