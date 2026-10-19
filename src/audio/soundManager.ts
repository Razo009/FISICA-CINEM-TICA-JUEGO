class SoundManager {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private isMuted: boolean = false;
  private hasInteracted: boolean = false;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public unlock() {
    this.hasInteracted = true;
    this.initContext();
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.engineGain) {
      this.engineGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public updateEngineSound(speedKmh: number) {
    if (this.isMuted || !this.hasInteracted) return;
    this.initContext();
    if (!this.ctx) return;

    if (!this.engineOsc) {
      try {
        this.engineOsc = this.ctx.createOscillator();
        this.engineGain = this.ctx.createGain();
        this.engineOsc.type = 'sawtooth';
        this.engineOsc.frequency.setValueAtTime(45, this.ctx.currentTime);
        this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(220, this.ctx.currentTime);

        this.engineOsc.connect(filter);
        filter.connect(this.engineGain);
        this.engineGain.connect(this.ctx.destination);
        this.engineOsc.start();
      } catch {
        return;
      }
    }

    if (this.engineOsc && this.engineGain) {
      const targetGain = Math.min(0.08, Math.max(0.01, (speedKmh / 35) * 0.08));
      const targetFreq = 40 + Math.min(90, (speedKmh / 35) * 70);
      const t = this.ctx.currentTime;
      this.engineGain.gain.setTargetAtTime(speedKmh > 0.5 ? targetGain : 0.005, t, 0.1);
      this.engineOsc.frequency.setTargetAtTime(targetFreq, t, 0.1);
    }
  }

  public playClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.07);
    } catch {}
  }

  public playObserverSwitch() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(640, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.17);
    } catch {}
  }

  public playChime() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const notes = [659.25, 880, 1046.5]; // E5, A5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = this.ctx.currentTime + idx * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.45);
      });
    } catch {}
  }

  public playSuccessFanfare() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = this.ctx.currentTime + idx * 0.12;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.65);
      });
    } catch {}
  }
}

export const soundManager = new SoundManager();

/**
 * Triggers Xbox / Gamepad haptic rumble vibration
 */
export function triggerGamepadRumble(duration = 200, strongMagnitude = 0.5, weakMagnitude = 0.5) {
  if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
  const gamepads = navigator.getGamepads();
  for (let i = 0; i < gamepads.length; i++) {
    const gp = gamepads[i];
    if (gp && gp.vibrationActuator) {
      try {
        gp.vibrationActuator.playEffect('dual-rumble', {
          startDelay: 0,
          duration,
          weakMagnitude,
          strongMagnitude,
        });
      } catch {}
    }
  }
}
