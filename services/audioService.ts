
import { NOTE_FREQUENCIES, InstrumentType } from '../types';

class AudioService {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playNote(pitch: string, durationSeconds: number, volume: number = 0.3, instrument: InstrumentType = 'piano') {
    this.init();
    if (!this.ctx) return;

    const freq = NOTE_FREQUENCIES[pitch];
    if (!freq) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Instrument Profiles
    switch (instrument) {
      case 'piano':
        osc.type = 'sine';
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
        break;
      case 'organ':
        osc.type = 'triangle';
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, this.ctx.currentTime);
        break;
      case 'brass':
        osc.type = 'sawtooth';
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1500, this.ctx.currentTime);
        break;
      case 'strings':
        osc.type = 'sawtooth';
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, this.ctx.currentTime);
        break;
      default:
        osc.type = 'sine';
    }

    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    // ADSR-like envelope
    const attack = 0.02;
    const release = instrument === 'strings' ? 0.3 : 0.1;

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + durationSeconds + release);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + durationSeconds + release);
  }
}

export const audioService = new AudioService();
