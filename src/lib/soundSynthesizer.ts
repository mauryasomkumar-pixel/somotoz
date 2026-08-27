/**
 * MindReflect Web Audio Ambient Soundscape Generator
 * Produces organic, procedural soundscapes (Rain, Ocean, Forest, Singing Bowl, Soft Noise)
 * without external asset dependencies.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private currentType: string | null = null;
  private nodes: { stop?: () => void; gain?: GainNode; intervals?: number[] } = {};
  private masterGain: GainNode | null = null;
  private volume: number = 0.5;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public stop() {
    if (this.nodes.stop) {
      this.nodes.stop();
    }
    if (this.nodes.intervals) {
      this.nodes.intervals.forEach((id) => window.clearInterval(id));
    }
    this.nodes = {};
    this.currentType = null;
  }

  public getCurrentType(): string | null {
    return this.currentType;
  }

  public play(type: 'rain' | 'ocean' | 'forest' | 'bowl' | 'whitenoise') {
    this.initContext();
    this.stop();
    this.currentType = type;

    if (!this.ctx || !this.masterGain) return;

    switch (type) {
      case 'rain':
        this.playRain();
        break;
      case 'ocean':
        this.playOcean();
        break;
      case 'forest':
        this.playForest();
        break;
      case 'bowl':
        this.playTibetanBowl();
        break;
      case 'whitenoise':
        this.playWhiteNoise();
        break;
    }
  }

  private createPinkNoiseBuffer(): AudioBuffer {
    const bufferSize = this.ctx!.sampleRate * 2;
    const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  private playRain() {
    if (!this.ctx || !this.masterGain) return;
    const buffer = this.createPinkNoiseBuffer();
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(850, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start();

    this.nodes.stop = () => {
      try {
        noise.stop();
        noise.disconnect();
      } catch (e) {}
    };
  }

  private playOcean() {
    if (!this.ctx || !this.masterGain) return;
    const buffer = this.createPinkNoiseBuffer();
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);

    // LFO for wave ebb and flow
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.1, this.ctx.currentTime); // 10 second wave cycle
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.5, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
    lfo.start();

    this.nodes.stop = () => {
      try {
        noise.stop();
        lfo.stop();
        noise.disconnect();
        lfo.disconnect();
      } catch (e) {}
    };
  }

  private playForest() {
    if (!this.ctx || !this.masterGain) return;
    // Ambient breeze
    const buffer = this.createPinkNoiseBuffer();
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    filter.Q.setValueAtTime(3, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start();

    // Occasional subtle bird chirp tones
    const intervals: number[] = [];
    const chirpInterval = window.setInterval(() => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const chirpGain = this.ctx.createGain();
      osc.type = 'sine';
      const baseFreq = 2200 + Math.random() * 800;
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, this.ctx.currentTime + 0.08);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, this.ctx.currentTime + 0.16);

      chirpGain.gain.setValueAtTime(0.015, this.ctx.currentTime);
      chirpGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.2);

      osc.connect(chirpGain);
      chirpGain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    }, 4500);

    intervals.push(chirpInterval);
    this.nodes.intervals = intervals;

    this.nodes.stop = () => {
      try {
        noise.stop();
        noise.disconnect();
      } catch (e) {}
    };
  }

  private playTibetanBowl() {
    if (!this.ctx || !this.masterGain) return;
    const frequencies = [216, 432, 648]; // Harmonic resonance
    const oscs: OscillatorNode[] = [];

    frequencies.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);

      const amp = i === 0 ? 0.3 : i === 1 ? 0.15 : 0.05;
      gain.gain.setValueAtTime(amp, this.ctx!.currentTime);

      // Slow harmonic pulsing
      const tremolo = this.ctx!.createOscillator();
      tremolo.frequency.setValueAtTime(0.15 + i * 0.05, this.ctx!.currentTime);
      const tremoloGain = this.ctx!.createGain();
      tremoloGain.gain.setValueAtTime(amp * 0.4, this.ctx!.currentTime);
      tremolo.connect(tremoloGain);
      tremoloGain.connect(gain.gain);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start();
      tremolo.start();
      oscs.push(osc);
    });

    this.nodes.stop = () => {
      try {
        oscs.forEach((o) => {
          o.stop();
          o.disconnect();
        });
      } catch (e) {}
    };
  }

  private playWhiteNoise() {
    if (!this.ctx || !this.masterGain) return;
    const buffer = this.createPinkNoiseBuffer();
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);

    noise.connect(gain);
    gain.connect(this.masterGain);
    noise.start();

    this.nodes.stop = () => {
      try {
        noise.stop();
        noise.disconnect();
      } catch (e) {}
    };
  }
}

export const soundSynth = new SoundSynthesizer();
