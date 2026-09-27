import { voicingMidi, type Voicing } from '../music/chords';
import { midiToFreq } from '../music/notes';
import { detectPitch, spectrumToChroma, type ChromaFrame } from './dsp';
import { pluckSamples } from './pluck';
import { ANALYSIS_SAMPLE_RATE, type AnalysisResult, type AnalyzeOptions } from './analyze';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

export function audioContext(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext({ latencyHint: 'interactive' });
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function out(): GainNode {
  audioContext();
  return master!;
}

const pluckCache = new Map<number, AudioBuffer>();

function pluckBuffer(midi: number): AudioBuffer {
  const c = audioContext();
  let b = pluckCache.get(midi);
  if (!b) {
    const data = pluckSamples(midiToFreq(midi), c.sampleRate, 3, { brightness: 0.55, seed: midi * 31 });
    b = c.createBuffer(1, data.length, c.sampleRate);
    b.copyToChannel(data as Float32Array<ArrayBuffer>, 0);
    pluckCache.set(midi, b);
  }
  return b;
}

/** Zahraje jeden tón struny v čase `when` (sekundy AudioContextu). Vrací uzel pro případné utlumení. */
export function playNote(midi: number, when = 0, gain = 0.35, duration = 2.5): GainNode {
  const c = audioContext();
  const src = c.createBufferSource();
  src.buffer = pluckBuffer(midi);
  const g = c.createGain();
  const t = Math.max(when, c.currentTime);
  g.gain.setValueAtTime(gain, t);
  g.gain.setTargetAtTime(0, t + duration, 0.08);
  src.connect(g).connect(out());
  src.start(t);
  src.stop(t + duration + 0.6);
  return g;
}

// Utlumení doznívajících strun při novém úhozu (jako když se struna znovu rozezní).
const ringing = new Map<number, GainNode>();

export function playStrings(v: Voicing, strings: number[], opts: { when?: number; capo?: number; dir?: 'D' | 'U'; spread?: number; gain?: number; mute?: boolean } = {}) {
  const c = audioContext();
  const when = Math.max(opts.when ?? c.currentTime, c.currentTime);
  const midis = voicingMidi(v, opts.capo ?? 0);
  const spread = opts.spread ?? 0.012;
  strings.forEach((s, k) => {
    const m = midis[s];
    if (m === null) return;
    const t = when + k * spread;
    const prev = ringing.get(s);
    if (prev) {
      prev.gain.cancelScheduledValues(t);
      prev.gain.setTargetAtTime(0, t, 0.015);
    }
    const g = playNote(m, t, (opts.gain ?? 0.3) * (opts.mute ? 0.5 : 1), opts.mute ? 0.06 : 2.5);
    ringing.set(s, g);
  });
}

/** Úhoz celého akordu (dolů = od basu). */
export function strumChord(v: Voicing, opts: { when?: number; capo?: number; dir?: 'D' | 'U'; gain?: number } = {}) {
  let strings = v.frets.map((f, i) => (f >= 0 ? i : -1)).filter((i) => i >= 0);
  if (opts.dir === 'U') strings = strings.reverse();
  playStrings(v, strings, { ...opts, spread: 0.018 });
}

export function arpeggiate(v: Voicing, capo = 0) {
  const c = audioContext();
  const strings = v.frets.map((f, i) => (f >= 0 ? i : -1)).filter((i) => i >= 0);
  strings.forEach((s, k) => playStrings(v, [s], { when: c.currentTime + 0.05 + k * 0.28, capo, gain: 0.35 }));
}

export function click(when: number, accent: boolean, gain = 0.5) {
  const c = audioContext();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.frequency.value = accent ? 1760 : 1100;
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(gain * (accent ? 1 : 0.6), when + 0.001);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);
  osc.connect(g).connect(out());
  osc.start(when);
  osc.stop(when + 0.06);
}

export function referenceTone(midi: number, duration = 2) {
  const c = audioContext();
  const t = c.currentTime;
  const osc = c.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = midiToFreq(midi);
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.25, t + 0.02);
  g.gain.setTargetAtTime(0, t + duration - 0.3, 0.1);
  osc.connect(g).connect(out());
  osc.start(t);
  osc.stop(t + duration + 0.5);
  playNote(midi, t, 0.25);
}

// ---------------------------------------------------------------------------
// Vstupy: mikrofon a zvuk z karty prohlížeče

export async function getMicrophone(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Prohlížeč nepodporuje přístup k mikrofonu (je potřeba HTTPS).');
  return navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });
}

/** Zachytí zvuk z karty prohlížeče (např. YouTube). Funguje v Chrome/Edge na počítači. */
export async function getTabAudio(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getDisplayMedia) throw new Error('Prohlížeč nepodporuje sdílení zvuku z karty. Použijte Chrome nebo Edge na počítači.');
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    // Nestandardní volby Chromu: nabídnout aktuální kartu a sdílení zvuku.
    preferCurrentTab: true,
    selfBrowserSurface: 'include',
    systemAudio: 'include',
  } as DisplayMediaStreamOptions);
  if (stream.getAudioTracks().length === 0) {
    stream.getTracks().forEach((t) => t.stop());
    throw new Error('Nebyl sdílen žádný zvuk. Při výběru karty zaškrtněte „Sdílet i zvuk karty“.');
  }
  stream.getVideoTracks().forEach((t) => t.stop());
  return stream;
}

export interface LiveFrame extends ChromaFrame {
  rms: number;
  time: number;
}

/**
 * Průběžná analýza vstupu (mikrofon / karta): chroma pro akordy a čistý signál pro ladičku.
 */
export class LiveInput {
  readonly analyser: AnalyserNode;
  private source: MediaStreamAudioSourceNode;
  private freq: Float32Array<ArrayBuffer>;
  private time: Float32Array<ArrayBuffer>;
  private monitor?: GainNode;
  readonly stream: MediaStream;

  constructor(stream: MediaStream, opts: { fftSize?: number; monitor?: boolean } = {}) {
    this.stream = stream;
    const c = audioContext();
    this.source = c.createMediaStreamSource(stream);
    this.analyser = c.createAnalyser();
    this.analyser.fftSize = opts.fftSize ?? 16384;
    this.analyser.smoothingTimeConstant = 0.35;
    this.source.connect(this.analyser);
    if (opts.monitor) {
      this.monitor = c.createGain();
      this.monitor.gain.value = 1;
      this.source.connect(this.monitor).connect(c.destination);
    }
    this.freq = new Float32Array(this.analyser.frequencyBinCount);
    this.time = new Float32Array(this.analyser.fftSize);
  }

  get sampleRate() {
    return audioContext().sampleRate;
  }

  level(): number {
    this.analyser.getFloatTimeDomainData(this.time);
    let s = 0;
    for (const x of this.time) s += x * x;
    return Math.sqrt(s / this.time.length);
  }

  chroma(): LiveFrame {
    this.analyser.getFloatFrequencyData(this.freq);
    const mag = new Float32Array(this.freq.length);
    for (let i = 0; i < mag.length; i++) mag[i] = Math.pow(10, this.freq[i] / 20);
    const frame = spectrumToChroma(mag, this.sampleRate, this.analyser.fftSize);
    return { ...frame, rms: this.level(), time: audioContext().currentTime };
  }

  pitch(): { freq: number; clarity: number; rms: number } | null {
    this.analyser.getFloatTimeDomainData(this.time);
    const n = Math.min(this.time.length, 4096);
    const buf = this.time.subarray(this.time.length - n);
    let s = 0;
    for (const x of buf) s += x * x;
    const rms = Math.sqrt(s / n);
    const p = detectPitch(buf, this.sampleRate, 60, 1000);
    return p ? { ...p, rms } : null;
  }

  stop() {
    this.source.disconnect();
    this.monitor?.disconnect();
    this.stream.getTracks().forEach((t) => t.stop());
  }
}

// ---------------------------------------------------------------------------
// Offline analýza souboru

/** Dekóduje zvukový soubor a převede ho na mono 11 025 Hz. */
export async function decodeToAnalysisRate(data: ArrayBuffer): Promise<{ signal: Float32Array; original: AudioBuffer }> {
  const c = audioContext();
  const original = await c.decodeAudioData(data.slice(0));
  const length = Math.ceil(original.duration * ANALYSIS_SAMPLE_RATE);
  const off = new OfflineAudioContext(1, length, ANALYSIS_SAMPLE_RATE);
  const src = off.createBufferSource();
  src.buffer = original;
  src.connect(off.destination);
  src.start();
  const rendered = await off.startRendering();
  return { signal: rendered.getChannelData(0).slice(), original };
}

export function analyzeInWorker(signal: Float32Array, opts: Omit<AnalyzeOptions, 'onProgress'>, onProgress?: (f: number, stage: string) => void): Promise<AnalysisResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./analyze.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data as { type: 'progress'; fraction: number; stage: string } | { type: 'done'; result: AnalysisResult } | { type: 'error'; message: string };
      if (msg.type === 'progress') onProgress?.(msg.fraction, msg.stage);
      else if (msg.type === 'done') {
        resolve(msg.result);
        worker.terminate();
      } else {
        reject(new Error(msg.message));
        worker.terminate();
      }
    };
    worker.onerror = (e) => {
      reject(new Error(e.message));
      worker.terminate();
    };
    worker.postMessage({ signal, sampleRate: ANALYSIS_SAMPLE_RATE, opts }, [signal.buffer]);
  });
}
