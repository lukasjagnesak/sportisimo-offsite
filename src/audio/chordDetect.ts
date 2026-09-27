import { chordName, chordPitchClasses, parseChord, quality, voicingMidi, type Chord, type Voicing } from '../music/chords';
import { mod12 } from '../music/notes';
import type { ChromaFrame } from './dsp';

// Harmonické: (posun v půltónech, váha). Kytarová struna zní se silnými vyššími harmonickými.
const HARMONICS: [number, number][] = [
  [0, 1],
  [12, 0.5],
  [19, 0.3],
  [24, 0.18],
  [28, 0.12],
  [31, 0.08],
];

export function harmonicChroma(notes: { pc: number; weight: number }[]): Float32Array {
  const t = new Float32Array(12);
  for (const n of notes) for (const [off, w] of HARMONICS) t[mod12(n.pc + off)] += n.weight * w;
  return t;
}

export function chordTemplate(c: Chord): Float32Array {
  const pcs = chordPitchClasses(c);
  return harmonicChroma(pcs.map((pc, i) => ({ pc, weight: i === 0 ? 1.25 : 1 })));
}

/** Šablona přesně podle hraného prstokladu (zdvojené tóny mají větší váhu). */
export function voicingTemplate(v: Voicing, capo = 0): Float32Array {
  return harmonicChroma(
    voicingMidi(v, capo)
      .filter((m): m is number => m !== null)
      .map((m) => ({ pc: mod12(m), weight: 1 })),
  );
}

export function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na > 0 && nb > 0 ? dot / Math.sqrt(na * nb) : 0;
}

export interface VocabEntry {
  name: string;
  chord: Chord;
  template: Float32Array;
}

const vocabCache = new Map<string, VocabEntry[]>();

/** Slovník akordů pro rozpoznávání. */
export function vocabulary(qualities: string[] = ['maj', 'min']): VocabEntry[] {
  const key = qualities.join(',');
  let v = vocabCache.get(key);
  if (!v) {
    v = [];
    for (const q of qualities) {
      quality(q); // validace
      for (let root = 0; root < 12; root++) {
        const chord: Chord = { root, quality: q };
        v.push({ name: chordName(chord), chord, template: chordTemplate(chord) });
      }
    }
    vocabCache.set(key, v);
  }
  return v;
}

export interface Candidate {
  name: string;
  score: number;
}

/** Skóre akordu: podobnost chroma + malý bonus, pokud bas odpovídá základnímu tónu. */
export function scoreChord(frame: ChromaFrame, entry: VocabEntry): number {
  const sim = cosine(frame.chroma, entry.template);
  const bassRoot = entry.chord.bass ?? entry.chord.root;
  // Složitější akordy mírně penalizujeme, aby nevyhrávaly jen díky většímu počtu tónů.
  return sim + 0.12 * frame.bass[bassRoot] - 0.02 * (quality(entry.chord.quality).intervals.length - 3);
}

export function rankChords(frame: ChromaFrame, vocab: VocabEntry[]): Candidate[] {
  return vocab.map((e) => ({ name: e.name, score: scoreChord(frame, e) })).sort((a, b) => b.score - a.score);
}

export const LIVE_QUALITIES = ['maj', 'min', '7', 'm7', 'maj7', 'sus2', 'sus4'];

export interface CheckResult {
  /** Hraje se správný akord? */
  correct: boolean;
  /** Podobnost s očekávaným prstokladem 0–1. */
  match: number;
  /** Nejpravděpodobnější akord, který skutečně zní. */
  heard: string;
  /** Tóny akordu, které v chroma skoro chybí (např. přidušená struna). */
  missing: number[];
  /** Silné tóny, které do akordu nepatří. */
  extra: number[];
}

/**
 * Ověří, zda chroma odpovídá očekávanému akordu (se zohledněním konkrétního prstokladu).
 */
export function checkChord(frame: ChromaFrame, expectedName: string, v: Voicing | null, capo = 0): CheckResult {
  const expected = parseChord(expectedName);
  const vocab = vocabulary(LIVE_QUALITIES);
  const ranked = rankChords(frame, vocab);
  if (!expected) return { correct: false, match: 0, heard: ranked[0]?.name ?? '', missing: [], extra: [] };
  const sounding: Chord = { ...expected, root: mod12(expected.root + capo), bass: expected.bass === undefined ? undefined : mod12(expected.bass + capo) };
  const tmpl = v ? voicingTemplate(v, capo) : chordTemplate(sounding);
  const generic = chordTemplate(sounding);
  const match = Math.max(cosine(frame.chroma, tmpl), cosine(frame.chroma, generic));
  const expectedPcs = new Set(chordPitchClasses(sounding));
  // Nejlepší konkurent s jinou množinou tónů.
  const expKey = [...expectedPcs].sort().join(',');
  const rival = ranked.find((r) => {
    const c = parseChord(r.name)!;
    return [...new Set(chordPitchClasses(c))].sort().join(',') !== expKey;
  });
  const rivalScore = rival ? cosine(frame.chroma, vocab.find((e) => e.name === rival.name)!.template) : 0;
  const correct = match >= 0.8 && match >= rivalScore - 0.01;

  const maxC = Math.max(...frame.chroma);
  const missing = [...expectedPcs].filter((pc) => frame.chroma[pc] < maxC * 0.18);
  const extra: number[] = [];
  for (let pc = 0; pc < 12; pc++) {
    if (expectedPcs.has(pc)) continue;
    // Tóny vzniklé harmonickými (kvinta nad tónem akordu) nepočítáme jako chybu.
    const harmonic = [...expectedPcs].some((e) => mod12(e + 7) === pc || mod12(e + 4) === pc);
    if (frame.chroma[pc] > maxC * (harmonic ? 0.75 : 0.45)) extra.push(pc);
  }
  return { correct, match, heard: ranked[0].name, missing, extra };
}

export function chromaFromNotes(midis: number[]): ChromaFrame {
  const chroma = harmonicChroma(midis.map((m) => ({ pc: mod12(m), weight: 1 })));
  const bass = new Float32Array(12);
  bass[mod12(Math.min(...midis))] = 1;
  const s = chroma.reduce((a, b) => a + b, 0);
  return { chroma: chroma.map((x) => x / s), bass, energy: 1 };
}
