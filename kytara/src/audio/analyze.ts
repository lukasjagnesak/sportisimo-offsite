import { chordDifficulty, chordPitchClasses, parseChord, transposeName } from '../music/chords';
import { mod12, noteName } from '../music/notes';
import { scoreChord, vocabulary, type VocabEntry } from './chordDetect';
import { magnitudeSpectrum, spectrumToChroma, type ChromaFrame } from './dsp';

export interface Segment {
  start: number;
  end: number;
  chord: string;
}

export interface KeyEstimate {
  tonic: number;
  mode: 'major' | 'minor';
  name: string;
  confidence: number;
}

export interface AnalysisResult {
  duration: number;
  bpm: number;
  beatsPerBar: number;
  /** Časy dob v sekundách. */
  beats: number[];
  /** Index doby, na které začíná první celý takt. */
  downbeat: number;
  /** Akord pro každou dobu ('N' = bez akordu). */
  beatChords: string[];
  segments: Segment[];
  key: KeyEstimate;
  /** Doporučený kapodastr, aby šly použít snadné tvary. */
  capo: number;
  chordCounts: { chord: string; beats: number }[];
}

export interface AnalyzeOptions {
  sevenths?: boolean;
  onProgress?: (fraction: number, stage: string) => void;
}

export const ANALYSIS_SAMPLE_RATE = 11025;

// ---------------------------------------------------------------------------
// Onsety a tempo

export function onsetEnvelope(signal: Float32Array, sr: number, hop = 256, n = 1024): Float32Array {
  const frames = Math.max(0, Math.floor((signal.length - n) / hop) + 1);
  const env = new Float32Array(frames);
  let prev: Float32Array | null = null;
  const maxBin = Math.floor((4000 / sr) * n);
  for (let t = 0; t < frames; t++) {
    const mag = magnitudeSpectrum(signal, t * hop, n);
    const logm = new Float32Array(maxBin);
    for (let k = 0; k < maxBin; k++) logm[k] = Math.log1p(mag[k] * 100);
    if (prev) {
      let s = 0;
      for (let k = 1; k < maxBin; k++) s += Math.max(0, logm[k] - prev[k]);
      env[t] = s;
    }
    prev = logm;
  }
  // Odečtení klouzavého průměru a normalizace.
  const w = Math.round(sr / hop / 2);
  const out = new Float32Array(frames);
  let std = 0;
  for (let t = 0; t < frames; t++) {
    let s = 0;
    let c = 0;
    for (let j = Math.max(0, t - w); j <= Math.min(frames - 1, t + w); j++) {
      s += env[j];
      c++;
    }
    out[t] = Math.max(0, env[t] - s / c);
    std += out[t] * out[t];
  }
  std = Math.sqrt(std / Math.max(1, frames)) || 1;
  for (let t = 0; t < frames; t++) out[t] /= std;
  return out;
}

export function estimateTempo(env: Float32Array, frameRate: number): number {
  const minLag = Math.floor((60 / 200) * frameRate);
  const maxLag = Math.ceil((60 / 55) * frameRate);
  let best = 0;
  let bestLag = Math.round((60 / 100) * frameRate);
  const ac = new Float32Array(maxLag + 2);
  for (let lag = minLag; lag <= maxLag + 1; lag++) {
    let s = 0;
    for (let t = lag; t < env.length; t++) s += env[t] * env[t - lag];
    ac[lag] = s / (env.length - lag);
  }
  for (let lag = minLag; lag <= maxLag; lag++) {
    const bpm = (60 * frameRate) / lag;
    // Preference kolem 105 BPM (log-gaussovské okno), aby se nevolil dvojnásobek/polovina.
    const w = Math.exp(-0.5 * Math.pow(Math.log2(bpm / 105) / 0.9, 2));
    // Zesílení periodicity: přičteme i dvojnásobné zpoždění.
    const v = w * (ac[lag] + 0.5 * (2 * lag <= maxLag + 1 ? ac[2 * lag] ?? 0 : 0));
    if (v > best) {
      best = v;
      bestLag = lag;
    }
  }
  // Parabolická interpolace.
  const a = ac[bestLag - 1] ?? 0;
  const b = ac[bestLag];
  const c = ac[bestLag + 1] ?? 0;
  const den = a - 2 * b + c;
  const shift = den !== 0 ? Math.max(-0.5, Math.min(0.5, (0.5 * (a - c)) / den)) : 0;
  return (60 * frameRate) / (bestLag + shift);
}

/** Sledování dob dynamickým programováním (Ellis 2007). Vrací indexy snímků. */
export function trackBeats(env: Float32Array, period: number, tightness = 80): number[] {
  const n = env.length;
  if (n === 0) return [];
  const score = new Float32Array(n);
  const back = new Int32Array(n).fill(-1);
  for (let t = 0; t < n; t++) {
    let best = 0;
    let bestTau = -1;
    const from = Math.max(0, Math.round(t - 2 * period));
    const to = Math.round(t - period / 2);
    for (let tau = from; tau <= to; tau++) {
      const pen = Math.log((t - tau) / period);
      const v = score[tau] - tightness * pen * pen;
      if (bestTau < 0 || v > best) {
        best = v;
        bestTau = tau;
      }
    }
    score[t] = env[t] + (bestTau >= 0 ? Math.max(0, best) : 0);
    back[t] = bestTau >= 0 && best > 0 ? bestTau : -1;
  }
  // Začneme z nejlepšího bodu v poslední periodě.
  let t = n - 1;
  for (let k = Math.max(0, Math.floor(n - period)); k < n; k++) if (score[k] > score[t]) t = k;
  const beats: number[] = [];
  while (t >= 0) {
    beats.push(t);
    t = back[t];
  }
  beats.reverse();
  // Doplníme doby na začátku, kde DP nenavázalo.
  while (beats.length && beats[0] - period > 0) beats.unshift(Math.round(beats[0] - period));
  return beats;
}

// ---------------------------------------------------------------------------
// Tónina (Krumhansl–Schmuckler)

const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

function pearson(a: ArrayLike<number>, b: ArrayLike<number>) {
  const n = a.length;
  let ma = 0;
  let mb = 0;
  for (let i = 0; i < n; i++) {
    ma += a[i];
    mb += b[i];
  }
  ma /= n;
  mb /= n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return da > 0 && db > 0 ? num / Math.sqrt(da * db) : 0;
}

export function estimateKey(chroma: ArrayLike<number>): KeyEstimate {
  let best: KeyEstimate = { tonic: 0, mode: 'major', name: 'C', confidence: 0 };
  for (let tonic = 0; tonic < 12; tonic++) {
    for (const mode of ['major', 'minor'] as const) {
      const prof = mode === 'major' ? MAJOR_PROFILE : MINOR_PROFILE;
      const rotated = Array.from({ length: 12 }, (_, i) => prof[mod12(i - tonic)]);
      const r = pearson(chroma, rotated);
      if (r > best.confidence) best = { tonic, mode, name: noteName(tonic) + (mode === 'minor' ? 'm' : ''), confidence: r };
    }
  }
  return best;
}

function diatonicSet(key: KeyEstimate): Set<string> {
  // Akordy stupnic (durová / přirozená mollová) jako 'root:quality'.
  const major = [
    [0, 'maj'],
    [2, 'min'],
    [4, 'min'],
    [5, 'maj'],
    [7, 'maj'],
    [9, 'min'],
  ] as const;
  const relTonic = key.mode === 'major' ? key.tonic : mod12(key.tonic + 3);
  const set = new Set<string>();
  for (const [iv, q] of major) {
    set.add(`${mod12(relTonic + iv)}:${q}`);
    set.add(`${mod12(relTonic + iv)}:${q === 'maj' ? '7' : 'm7'}`);
  }
  if (key.mode === 'minor') set.add(`${mod12(key.tonic + 7)}:maj`).add(`${mod12(key.tonic + 7)}:7`); // harmonická moll (E v a moll)
  return set;
}

// ---------------------------------------------------------------------------
// Viterbi přes akordy

function viterbi(emissions: Float32Array[], nStates: number, switchPenalty: (t: number) => number): number[] {
  const T = emissions.length;
  if (T === 0) return [];
  let prev = Float64Array.from(emissions[0]);
  const back: Int32Array[] = [];
  for (let t = 1; t < T; t++) {
    let bestPrev = 0;
    for (let s = 1; s < nStates; s++) if (prev[s] > prev[bestPrev]) bestPrev = s;
    const pen = switchPenalty(t);
    const cur = new Float64Array(nStates);
    const bk = new Int32Array(nStates);
    for (let s = 0; s < nStates; s++) {
      const stay = prev[s];
      const sw = prev[bestPrev] - pen;
      if (stay >= sw) {
        cur[s] = stay + emissions[t][s];
        bk[s] = s;
      } else {
        cur[s] = sw + emissions[t][s];
        bk[s] = bestPrev;
      }
    }
    back.push(bk);
    prev = cur;
  }
  let s = 0;
  for (let k = 1; k < nStates; k++) if (prev[k] > prev[s]) s = k;
  const path = new Array<number>(T);
  path[T - 1] = s;
  for (let t = T - 1; t > 0; t--) {
    s = back[t - 1][s];
    path[t - 1] = s;
  }
  return path;
}

// ---------------------------------------------------------------------------

export interface BeatFrame extends ChromaFrame {
  time: number;
}

/** Spočítá chroma pro krátká okna (používá i živé zachytávání). */
export function chromaFrames(signal: Float32Array, sr: number, fftSize = 4096, hop = 512, onProgress?: (f: number) => void): BeatFrame[] {
  const frames: BeatFrame[] = [];
  const total = Math.max(0, Math.floor((signal.length - fftSize) / hop) + 1);
  for (let t = 0; t < total; t++) {
    const mag = magnitudeSpectrum(signal, t * hop, fftSize);
    frames.push({ ...spectrumToChroma(mag, sr, fftSize), time: (t * hop + fftSize / 2) / sr });
    if (onProgress && t % 200 === 0) onProgress(t / total);
  }
  return frames;
}

/**
 * Z chroma snímků a časů dob sestaví akordy (Viterbi + odhad taktu a tóniny).
 * Oddělené od výpočtu spektra, aby šlo použít i pro živé zachytávání.
 */
export function chordsFromFrames(frames: BeatFrame[], beats: number[], duration: number, opts: AnalyzeOptions = {}): AnalysisResult {
  const vocab: VocabEntry[] = vocabulary(opts.sevenths ? ['maj', 'min', '7', 'm7'] : ['maj', 'min']);
  // Beat-synchronní průměr.
  const edges = [...beats, duration];
  const beatFrames: ChromaFrame[] = [];
  let fi = 0;
  for (let b = 0; b < beats.length; b++) {
    const chroma = new Float32Array(12);
    const bass = new Float32Array(12);
    let energy = 0;
    let count = 0;
    while (fi < frames.length && frames[fi].time < edges[b]) fi++;
    let k = fi;
    while (k < frames.length && frames[k].time < edges[b + 1]) {
      const f = frames[k];
      for (let i = 0; i < 12; i++) {
        chroma[i] += f.chroma[i] * f.energy;
        bass[i] += f.bass[i] * f.energy;
      }
      energy += f.energy;
      count++;
      k++;
    }
    const sum = chroma.reduce((a, x) => a + x, 0) || 1;
    const bsum = bass.reduce((a, x) => a + x, 0) || 1;
    beatFrames.push({ chroma: chroma.map((x) => x / sum), bass: bass.map((x) => x / bsum), energy: count ? energy / count : 0 });
  }
  const global = new Float32Array(12);
  for (const f of beatFrames) for (let i = 0; i < 12; i++) global[i] += f.chroma[i] * f.energy;
  const key = estimateKey(global);
  const diatonic = diatonicSet(key);

  const energies = beatFrames.map((f) => f.energy).sort((a, b) => a - b);
  const median = energies[Math.floor(energies.length / 2)] ?? 0;
  const nStates = vocab.length + 1; // poslední stav = bez akordu
  const kappa = 25;
  const emissions = beatFrames.map((f) => {
    const e = new Float32Array(nStates);
    const quiet = f.energy < median * 0.15;
    vocab.forEach((v, i) => {
      const prior = diatonic.has(`${v.chord.root}:${v.chord.quality}`) ? 0.035 : 0;
      e[i] = kappa * (scoreChord(f, v) + prior);
    });
    e[nStates - 1] = quiet ? kappa * 2 : kappa * 0.45;
    return e;
  });

  // První průchod: bez znalosti taktu.
  let path = viterbi(emissions, nStates, () => 4);
  // Odhad metra a první doby: změny akordů padají nejčastěji na začátek taktu.
  let beatsPerBar = 4;
  let downbeat = 0;
  let bestScore = -1;
  for (const meter of [4, 3]) {
    const counts = new Array(meter).fill(0);
    for (let t = 1; t < path.length; t++) if (path[t] !== path[t - 1]) counts[t % meter]++;
    const total = counts.reduce((a, b) => a + b, 0) || 1;
    const phase = counts.indexOf(Math.max(...counts));
    const score = counts[phase] / total - (meter === 3 ? 0.15 : 0);
    if (score > bestScore) {
      bestScore = score;
      beatsPerBar = meter;
      downbeat = phase;
    }
  }
  // Druhý průchod: změny na začátku taktu jsou levnější.
  path = viterbi(emissions, nStates, (t) => {
    const pos = (((t - downbeat) % beatsPerBar) + beatsPerBar) % beatsPerBar;
    if (pos === 0) return 3;
    if (beatsPerBar === 4 && pos === 2) return 5;
    return 8;
  });

  const beatChords = path.map((s) => (s === nStates - 1 ? 'N' : vocab[s].name));
  const segments: Segment[] = [];
  beatChords.forEach((c, b) => {
    const start = beats[b];
    const end = edges[b + 1];
    const last = segments[segments.length - 1];
    if (last && last.chord === c) last.end = end;
    else segments.push({ start, end, chord: c });
  });

  const countMap = new Map<string, number>();
  for (const c of beatChords) if (c !== 'N') countMap.set(c, (countMap.get(c) ?? 0) + 1);
  const chordCounts = [...countMap.entries()].map(([chord, n]) => ({ chord, beats: n })).sort((a, b) => b.beats - a.beats);
  const bpm = beats.length > 1 ? 60 / ((beats[beats.length - 1] - beats[0]) / (beats.length - 1)) : 0;

  return {
    duration,
    bpm: Math.round(bpm),
    beatsPerBar,
    beats,
    downbeat: downbeat % beatsPerBar,
    beatChords,
    segments,
    key,
    capo: suggestCapo(chordCounts.map((c) => c.chord)),
    chordCounts,
  };
}

/** Kompletní analýza mono signálu (ideálně 11 025 Hz). */
export function analyzeSignal(signal: Float32Array, sr: number, opts: AnalyzeOptions = {}): AnalysisResult {
  const duration = signal.length / sr;
  opts.onProgress?.(0, 'Hledám rytmus');
  const hop = 256;
  const env = onsetEnvelope(signal, sr, hop);
  const frameRate = sr / hop;
  const bpm = estimateTempo(env, frameRate);
  const period = (60 / bpm) * frameRate;
  const beatIdx = trackBeats(env, period);
  let beats = beatIdx.map((i) => (i * hop + 512) / sr).filter((t) => t < duration);
  if (beats.length < 2) {
    beats = [];
    for (let t = 0; t < duration; t += 60 / bpm) beats.push(t);
  }
  opts.onProgress?.(0.25, 'Počítám tóny');
  const frames = chromaFrames(signal, sr, 4096, 512, (f) => opts.onProgress?.(0.25 + f * 0.7, 'Počítám tóny'));
  opts.onProgress?.(0.95, 'Skládám akordy');
  return chordsFromFrames(frames, beats, duration, opts);
}

/** Najde kapodastr (0–7), se kterým jsou tvary akordů nejsnazší. */
export function suggestCapo(chords: string[]): number {
  let best = 0;
  let bestCost = Infinity;
  for (let capo = 0; capo <= 7; capo++) {
    let cost = capo * 0.45;
    for (const name of chords) {
      const c = parseChord(transposeName(name, -capo));
      cost += c ? chordDifficulty(c) : 5;
    }
    if (cost < bestCost - 1e-9) {
      bestCost = cost;
      best = capo;
    }
  }
  return best;
}

/** Vytvoří ChordPro zápis z výsledku analýzy (akordy v taktech, případně s kapodastrem). */
export function analysisToChordPro(r: AnalysisResult, title: string, capo = r.capo): string {
  const lines: string[] = [
    `{title: ${title}}`,
    `{artist: Rozpoznáno z nahrávky}`,
    `{bpm: ${r.bpm}}`,
    `{time: ${r.beatsPerBar}/4}`,
    `{key: ${r.key.name}}`,
  ];
  if (capo) lines.push(`{capo: ${capo}}`);
  lines.push(`{pattern: ${r.beatsPerBar === 3 ? 'waltz' : 'folk'}}`);
  const bars: string[][] = [];
  const shape = (c: string) => (c === 'N' ? 'N.C.' : transposeName(c, -capo));
  // Úvodní neúplný takt.
  const pickup = r.beatChords.slice(0, r.downbeat);
  for (let b = r.downbeat; b < r.beatChords.length; b += r.beatsPerBar) bars.push(r.beatChords.slice(b, b + r.beatsPerBar));
  // Vynecháme ticho na začátku a na konci.
  while (bars.length && bars[0].every((c) => c === 'N')) bars.shift();
  while (bars.length && bars[bars.length - 1].every((c) => c === 'N')) bars.pop();
  const barText = (bar: string[]) => {
    const parts: { c: string; n: number }[] = [];
    for (const c of bar) {
      const last = parts[parts.length - 1];
      if (last && last.c === c) last.n++;
      else parts.push({ c, n: 1 });
    }
    if (parts.length === 1 && bar.length === r.beatsPerBar) return shape(parts[0].c);
    return parts.map((p) => `${shape(p.c)}:${p.n}`).join(' ');
  };
  lines.push('{c: Akordy}');
  if (pickup.length && pickup.some((c) => c !== 'N')) lines.push(`| ${barText(pickup)} |`);
  for (let i = 0; i < bars.length; i += 4) {
    lines.push('| ' + bars.slice(i, i + 4).map(barText).join(' | ') + ' |');
  }
  return lines.join('\n');
}

export function chordTones(name: string): string {
  const c = parseChord(name);
  return c ? chordPitchClasses(c).map((pc) => noteName(pc)).join(' ') : '';
}
