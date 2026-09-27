// Čisté DSP funkce bez závislosti na Web Audio API (použitelné ve workeru i v testech).

const fftCache = new Map<number, { cos: Float64Array; sin: Float64Array; rev: Uint32Array }>();

function fftTables(n: number) {
  let t = fftCache.get(n);
  if (!t) {
    const cos = new Float64Array(n / 2);
    const sin = new Float64Array(n / 2);
    for (let i = 0; i < n / 2; i++) {
      cos[i] = Math.cos((2 * Math.PI * i) / n);
      sin[i] = -Math.sin((2 * Math.PI * i) / n);
    }
    const rev = new Uint32Array(n);
    const bits = Math.log2(n);
    for (let i = 0; i < n; i++) {
      let r = 0;
      for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b);
      rev[i] = r;
    }
    t = { cos, sin, rev };
    fftCache.set(n, t);
  }
  return t;
}

/** Radix-2 FFT na místě. Délka musí být mocnina 2. */
export function fft(re: Float64Array, im: Float64Array) {
  const n = re.length;
  const { cos, sin, rev } = fftTables(n);
  for (let i = 0; i < n; i++) {
    const j = rev[i];
    if (j > i) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let size = 2; size <= n; size <<= 1) {
    const half = size >> 1;
    const step = n / size;
    for (let i = 0; i < n; i += size) {
      for (let j = 0; j < half; j++) {
        const k = j * step;
        const tre = re[i + j + half] * cos[k] - im[i + j + half] * sin[k];
        const tim = re[i + j + half] * sin[k] + im[i + j + half] * cos[k];
        re[i + j + half] = re[i + j] - tre;
        im[i + j + half] = im[i + j] - tim;
        re[i + j] += tre;
        im[i + j] += tim;
      }
    }
  }
}

const hannCache = new Map<number, Float64Array>();
export function hann(n: number): Float64Array {
  let w = hannCache.get(n);
  if (!w) {
    w = new Float64Array(n);
    for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
    hannCache.set(n, w);
  }
  return w;
}

/** Magnitudové spektrum okna signálu začínajícího na `offset` (Hannovo okno). */
export function magnitudeSpectrum(signal: Float32Array, offset: number, n: number): Float32Array {
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  const w = hann(n);
  for (let i = 0; i < n; i++) {
    const idx = offset + i;
    re[i] = idx >= 0 && idx < signal.length ? signal[idx] * w[i] : 0;
  }
  fft(re, im);
  const mag = new Float32Array(n / 2);
  for (let i = 0; i < n / 2; i++) mag[i] = Math.hypot(re[i], im[i]);
  return mag;
}

export function rms(signal: Float32Array, start = 0, end = signal.length): number {
  let s = 0;
  for (let i = start; i < end; i++) s += signal[i] * signal[i];
  return Math.sqrt(s / Math.max(1, end - start));
}

// ---------------------------------------------------------------------------
// Chroma: rozložení energie do 12 tónů (C … H) bez ohledu na oktávu.

export interface ChromaFrame {
  /** Chroma středních a vyšších tónů (normalizovaná na součet 1). */
  chroma: Float32Array;
  /** Chroma basového pásma (pro určení basu / základního tónu). */
  bass: Float32Array;
  /** Celková harmonická energie (nenormalizovaná). */
  energy: number;
}

interface BinMap {
  semis: Int32Array;
  weights: Float32Array;
  minSemi: number;
  count: number;
}
const binMapCache = new Map<string, BinMap>();

const MIN_MIDI = 36; // C2
const MAX_MIDI = 96; // C7
const BASS_MAX_MIDI = 55; // G3

function binMap(sampleRate: number, fftSize: number): BinMap {
  const key = `${sampleRate}:${fftSize}`;
  let m = binMapCache.get(key);
  if (m) return m;
  const nBins = fftSize / 2;
  const semis = new Int32Array(nBins).fill(-1);
  const weights = new Float32Array(nBins);
  const df = sampleRate / fftSize;
  for (let k = 1; k < nBins; k++) {
    const f = k * df;
    const midi = 69 + 12 * Math.log2(f / 440);
    if (midi < MIN_MIDI - 0.5 || midi > MAX_MIDI + 0.5) continue;
    const nearest = Math.round(midi);
    const dist = midi - nearest;
    // Šířka okna v půltónech podle rozlišení FFT na dané frekvenci.
    const binSemis = 17.31 * (df / f);
    const sigma = Math.max(0.2, binSemis * 0.6);
    semis[k] = nearest - MIN_MIDI;
    weights[k] = Math.exp(-(dist * dist) / (2 * sigma * sigma));
  }
  m = { semis, weights, minSemi: MIN_MIDI, count: MAX_MIDI - MIN_MIDI + 1 };
  binMapCache.set(key, m);
  return m;
}

/**
 * Převede magnitudové spektrum na půltónový profil a chroma.
 * `mag` jsou lineární amplitudy (ne dB) o délce fftSize/2.
 */
export function spectrumToChroma(mag: ArrayLike<number>, sampleRate: number, fftSize: number): ChromaFrame {
  const map = binMap(sampleRate, fftSize);
  const semi = new Float64Array(map.count);
  for (let k = 0; k < map.semis.length && k < mag.length; k++) {
    const s = map.semis[k];
    if (s >= 0) {
      const v = mag[k] * map.weights[k];
      if (v > semi[s]) semi[s] = v; // max místo součtu – potlačí rozmazání okna
    }
  }
  // Komprese dynamiky a odečtení lokálního průměru (potlačí šum a širokopásmové zvuky).
  const comp = semi.map((v) => Math.log1p(v * 1000));
  const white = new Float64Array(map.count);
  for (let i = 0; i < map.count; i++) {
    let s = 0;
    let n = 0;
    for (let j = Math.max(0, i - 6); j <= Math.min(map.count - 1, i + 6); j++) {
      s += comp[j];
      n++;
    }
    white[i] = Math.max(0, comp[i] - (s / n) * 1.0);
  }
  const chroma = new Float32Array(12);
  const bass = new Float32Array(12);
  let energy = 0;
  for (let i = 0; i < map.count; i++) {
    const midi = i + map.minSemi;
    const pc = midi % 12;
    const v = white[i];
    energy += v;
    if (midi <= BASS_MAX_MIDI) bass[pc] += v * (midi < 48 ? 1 : 0.6);
    if (midi >= 45) chroma[pc] += v;
  }
  normalizeSum(chroma);
  normalizeSum(bass);
  return { chroma, bass, energy };
}

export function normalizeSum(v: Float32Array) {
  let s = 0;
  for (const x of v) s += x;
  if (s > 0) for (let i = 0; i < v.length; i++) v[i] /= s;
  return v;
}

export function chromaOfSignal(signal: Float32Array, sampleRate: number, fftSize: number, offset = 0): ChromaFrame {
  return spectrumToChroma(magnitudeSpectrum(signal, offset, fftSize), sampleRate, fftSize);
}

// ---------------------------------------------------------------------------
// Detekce výšky tónu (YIN) – pro ladičku.

export function detectPitch(buf: Float32Array, sampleRate: number, minFreq = 60, maxFreq = 1200): { freq: number; clarity: number } | null {
  const maxTau = Math.min(Math.floor(sampleRate / minFreq), Math.floor(buf.length / 2));
  const minTau = Math.floor(sampleRate / maxFreq);
  const w = buf.length - maxTau;
  if (w <= 0) return null;
  if (rms(buf) < 0.005) return null;
  const d = new Float32Array(maxTau + 1);
  for (let tau = 1; tau <= maxTau; tau++) {
    let s = 0;
    for (let i = 0; i < w; i++) {
      const diff = buf[i] - buf[i + tau];
      s += diff * diff;
    }
    d[tau] = s;
  }
  // Kumulativní normalizovaný rozdíl.
  const cmnd = new Float32Array(maxTau + 1);
  cmnd[0] = 1;
  let run = 0;
  for (let tau = 1; tau <= maxTau; tau++) {
    run += d[tau];
    cmnd[tau] = run > 0 ? (d[tau] * tau) / run : 1;
  }
  const threshold = 0.15;
  let tau = -1;
  for (let t = Math.max(2, minTau); t < maxTau; t++) {
    if (cmnd[t] < threshold) {
      while (t + 1 < maxTau && cmnd[t + 1] < cmnd[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau < 0) {
    // Žádné jasné minimum – vezmeme globální minimum, pokud je dost výrazné.
    let best = Math.max(2, minTau);
    for (let t = best; t < maxTau; t++) if (cmnd[t] < cmnd[best]) best = t;
    if (cmnd[best] > 0.35) return null;
    tau = best;
  }
  // Parabolická interpolace.
  const a = cmnd[tau - 1];
  const b = cmnd[tau];
  const c = tau + 1 <= maxTau ? cmnd[tau + 1] : b;
  const denom = a - 2 * b + c;
  const shift = denom !== 0 ? (0.5 * (a - c)) / denom : 0;
  const freq = sampleRate / (tau + shift);
  return { freq, clarity: 1 - b };
}
