/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentNoiseNode: AudioNode | null = null;
  private isNoisePlaying: boolean = false;
  private currentNoiseType: "brown" | "white" | "cosmic" | "binaural" | "none" = "none";
  private noiseVolume: number = 0.5; // Default master noise volume level (50%)

  private initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (!this.masterGain) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.noiseVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Set master noise volume dynamically
   */
  public setVolume(volume: number) {
    this.noiseVolume = Math.max(0, Math.min(1.5, volume)); // support boost up to 150%
    if (this.ctx) {
      this.initContext();
      if (this.masterGain) {
        this.masterGain.gain.setValueAtTime(this.noiseVolume, this.ctx.currentTime);
      }
    }
  }

  public getVolume(): number {
    return this.noiseVolume;
  }

  /**
   * Play a clean, rewarding "Ding" for completing a micro-task or step.
   */
  public playStepComplete() {
    try {
      const ctx = this.initContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1); // Slide up to E6

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("AudioEngine error playing step complete:", e);
    }
  }

  /**
   * Play a rich, satisfying dual-tone chime for completing a main task.
   */
  public playTaskComplete() {
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;

      // Primary tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      // Harmony tone (delayed slightly for a beautiful chime effect)
      setTimeout(() => {
        if (!this.ctx || this.ctx.state === "closed") return;
        const now2 = this.ctx.currentTime;
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(783.99, now2); // G5
        osc2.frequency.exponentialRampToValueAtTime(1046.50, now2 + 0.15); // C6
        gain2.gain.setValueAtTime(0, now2);
        gain2.gain.linearRampToValueAtTime(0.1, now2 + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.001, now2 + 0.4);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now2);
        osc2.stop(now2 + 0.4);
      }, 70);

      osc1.start(now);
      osc1.stop(now + 0.4);
    } catch (e) {
      console.warn("AudioEngine error playing task complete:", e);
    }
  }

  /**
   * Play a celebratory rising arpeggio for Leveling Up.
   */
  public playLevelUp() {
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
      const noteDuration = 0.08;

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteStart = now + i * noteDuration;

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0, noteStart);
        gain.gain.linearRampToValueAtTime(0.15, noteStart + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.25);
      });
    } catch (e) {
      console.warn("AudioEngine error playing level up:", e);
    }
  }

  /**
   * Play a gentle, rhythmic alarm chime when a timer completes.
   */
  public playTimerComplete() {
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;

      for (let i = 0; i < 4; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const chimeStart = now + i * 0.45;

        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, chimeStart); // D5
        osc.frequency.linearRampToValueAtTime(440.00, chimeStart + 0.2); // A4

        gain.gain.setValueAtTime(0, chimeStart);
        gain.gain.linearRampToValueAtTime(0.15, chimeStart + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, chimeStart + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(chimeStart);
        osc.stop(chimeStart + 0.45);
      }
    } catch (e) {
      console.warn("AudioEngine error playing timer complete:", e);
    }
  }

  /**
   * Start generating ADHD-focused background noise.
   */
  public startNoise(type: "brown" | "white" | "cosmic" | "binaural") {
    try {
      this.stopNoise();
      const ctx = this.initContext();
      this.currentNoiseType = type;
      this.isNoisePlaying = true;

      if (type === "white") {
        this.currentNoiseNode = this.createWhiteNoiseNode(ctx);
      } else if (type === "brown") {
        this.currentNoiseNode = this.createBrownNoiseNode(ctx);
      } else if (type === "cosmic") {
        this.currentNoiseNode = this.createCosmicHumNode(ctx);
      } else if (type === "binaural") {
        this.currentNoiseNode = this.createBinauralBeatNode(ctx);
      }
    } catch (e) {
      console.error("AudioEngine error starting noise:", e);
    }
  }

  /**
   * Stop any active background noise.
   */
  public stopNoise() {
    try {
      if (this.currentNoiseNode) {
        // If it's a list or composite node, we'll need to stop the nested source nodes.
        // Usually, in our helper functions we'll store custom dispose/stop methods or disconnect it.
        (this.currentNoiseNode as any).stop?.();
        this.currentNoiseNode.disconnect();
        this.currentNoiseNode = null;
      }
      this.isNoisePlaying = false;
      this.currentNoiseType = "none";
    } catch (e) {
      console.warn("AudioEngine error stopping noise:", e);
    }
  }

  public isPlaying(): boolean {
    return this.isNoisePlaying;
  }

  public getNoiseType(): string {
    return this.currentNoiseType;
  }

  /**
   * Helper: Generate procedural Brown Noise (extremely relaxing for ADHD minds).
   */
  private createBrownNoiseNode(ctx: AudioContext): AudioNode {
    const bufferSize = 10 * ctx.sampleRate; // 10 seconds of buffer
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise formula: accumulate and filter out high frequencies
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Gain compensation
    }

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(450, ctx.currentTime); // Soft, warm filter

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.20, ctx.currentTime); // Boosted base gain

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    source.start(0);

    // Attach custom stop method for later disposal
    (gain as any).stop = () => {
      source.stop();
      source.disconnect();
      filter.disconnect();
    };

    return gain;
  }

  /**
   * Helper: Generate White Noise.
   */
  private createWhiteNoiseNode(ctx: AudioContext): AudioNode {
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.04, ctx.currentTime); // Boosted base gain

    source.connect(gain);
    gain.connect(this.masterGain!);

    source.start(0);

    (gain as any).stop = () => {
      source.stop();
      source.disconnect();
    };

    return gain;
  }

  /**
   * Helper: Cosmic Hum - Low frequency rumbling synth waves.
   */
  private createCosmicHumNode(ctx: AudioContext): AudioNode {
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const mainGain = ctx.createGain();

    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(55, now); // A1 note (very low deep pitch)

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(55.5, now); // Slightly detuned for beautiful chorus effect

    lfo.type = "sine";
    lfo.frequency.setValueAtTime(0.2, now); // Slow 0.2Hz wave
    lfoGain.gain.setValueAtTime(15, now); // Modulate filter cutoff by 15Hz

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(110, now); // Steep cutoff to keep it low and rumbly
    filter.Q.setValueAtTime(3, now);

    mainGain.gain.setValueAtTime(0.25, now); // Boosted base gain

    // Connections
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency); // Modulate filter frequency with LFO

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(mainGain);
    mainGain.connect(this.masterGain!);

    osc1.start(now);
    osc2.start(now);
    lfo.start(now);

    (mainGain as any).stop = () => {
      osc1.stop();
      osc2.stop();
      lfo.stop();
      osc1.disconnect();
      osc2.disconnect();
      lfo.disconnect();
      lfoGain.disconnect();
      filter.disconnect();
    };

    return mainGain;
  }

  /**
   * Helper: Binaural Beats for focus (Alpha waves: ~8Hz difference).
   */
  private createBinauralBeatNode(ctx: AudioContext): AudioNode {
    const now = ctx.currentTime;
    const oscL = ctx.createOscillator();
    const oscR = ctx.createOscillator();
    const pannerL = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const pannerR = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const gain = ctx.createGain();

    // Left ear drone
    oscL.type = "sine";
    oscL.frequency.setValueAtTime(140, now); // Base frequency

    // Right ear drone - detuned by 8Hz (creates 8Hz Alpha waves in brain)
    oscR.type = "sine";
    oscR.frequency.setValueAtTime(148, now);

    gain.gain.setValueAtTime(0.20, now); // Boosted base gain

    if (pannerL && pannerR) {
      pannerL.pan.setValueAtTime(-1, now); // Full left
      pannerR.pan.setValueAtTime(1, now);  // Full right

      oscL.connect(pannerL);
      pannerL.connect(gain);

      oscR.connect(pannerR);
      pannerR.connect(gain);
    } else {
      // Fallback if StereoPanner is not supported
      oscL.connect(gain);
      oscR.connect(gain);
    }

    gain.connect(this.masterGain!);

    oscL.start(now);
    oscR.start(now);

    (gain as any).stop = () => {
      oscL.stop();
      oscR.stop();
      oscL.disconnect();
      oscR.disconnect();
      if (pannerL) pannerL.disconnect();
      if (pannerR) pannerR.disconnect();
    };

    return gain;
  }
}

export const audioEngine = new AudioEngine();
