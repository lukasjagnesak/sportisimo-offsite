import { mod12, noteName, parseNote, STANDARD_TUNING, type Notation } from './notes';

export interface ChordQuality {
  id: string;
  /** Přípony, které se v zápisu akordu mohou objevit (první je kanonická). */
  suffixes: string[];
  intervals: number[];
  label: string;
}

export const QUALITIES: ChordQuality[] = [
  { id: 'maj', suffixes: ['', 'maj', 'M', 'dur'], intervals: [0, 4, 7], label: 'durový' },
  { id: 'min', suffixes: ['m', 'min', 'mi', '-', 'moll'], intervals: [0, 3, 7], label: 'mollový' },
  { id: '7', suffixes: ['7', 'dom7'], intervals: [0, 4, 7, 10], label: 'dominantní septakord' },
  { id: 'm7', suffixes: ['m7', 'min7', 'mi7', '-7'], intervals: [0, 3, 7, 10], label: 'mollový septakord' },
  { id: 'maj7', suffixes: ['maj7', 'M7', 'Δ', 'Δ7', 'j7'], intervals: [0, 4, 7, 11], label: 'velký septakord' },
  { id: 'sus2', suffixes: ['sus2'], intervals: [0, 2, 7], label: 'sus2' },
  { id: 'sus4', suffixes: ['sus4', 'sus'], intervals: [0, 5, 7], label: 'sus4' },
  { id: '7sus4', suffixes: ['7sus4', '7sus'], intervals: [0, 5, 7, 10], label: 'septakord sus4' },
  { id: 'add9', suffixes: ['add9', 'add2'], intervals: [0, 4, 7, 2], label: 'add9' },
  { id: '6', suffixes: ['6'], intervals: [0, 4, 7, 9], label: 'sextakord' },
  { id: 'm6', suffixes: ['m6', 'mi6'], intervals: [0, 3, 7, 9], label: 'mollový sextakord' },
  { id: '9', suffixes: ['9'], intervals: [0, 4, 7, 10, 2], label: 'nónový' },
  { id: 'm9', suffixes: ['m9', 'mi9'], intervals: [0, 3, 7, 10, 2], label: 'mollový nónový' },
  { id: 'dim', suffixes: ['dim', '°', 'o'], intervals: [0, 3, 6], label: 'zmenšený' },
  { id: 'dim7', suffixes: ['dim7', '°7', 'o7'], intervals: [0, 3, 6, 9], label: 'zmenšený septakord' },
  { id: 'm7b5', suffixes: ['m7b5', 'ø', 'ø7', 'mi7/5-'], intervals: [0, 3, 6, 10], label: 'polozmenšený' },
  { id: 'aug', suffixes: ['aug', '+', '5+'], intervals: [0, 4, 8], label: 'zvětšený' },
  { id: '5', suffixes: ['5'], intervals: [0, 7], label: 'power chord' },
];

const QUALITY_BY_ID = new Map(QUALITIES.map((q) => [q.id, q]));
export const quality = (id: string) => QUALITY_BY_ID.get(id)!;

export interface Chord {
  root: number;
  quality: string;
  /** Basový tón u „lomených“ akordů (např. G/B). */
  bass?: number;
}

// Přípony seřazené od nejdelší, aby "m7b5" vyhrálo nad "m".
const SUFFIX_TABLE = QUALITIES.flatMap((q) => q.suffixes.map((s) => ({ s, id: q.id }))).sort(
  (a, b) => b.s.length - a.s.length,
);

export function parseChord(text: string, czech = false): Chord | null {
  const t = text.trim();
  const m = /^([A-Ha-h](?:#|b|is|es)?)(.*?)(?:\/([A-Ha-h](?:#|b|is|es)?))?$/.exec(t);
  if (!m) return null;
  // Malé písmeno bez přípony se v některých zpěvnících používá pro moll (a = Am).
  let rootText = m[1];
  let suffix = m[2];
  if (rootText[0] === rootText[0].toLowerCase() && suffix === '') suffix = 'm';
  rootText = rootText[0].toUpperCase() + rootText.slice(1);
  const root = parseNote(rootText, czech);
  if (root === null) return null;
  const q = SUFFIX_TABLE.find((e) => e.s === suffix);
  if (!q) return null;
  const chord: Chord = { root, quality: q.id };
  if (m[3]) {
    const bass = parseNote(m[3], czech);
    if (bass === null) return null;
    if (bass !== root) chord.bass = bass;
  }
  return chord;
}

export function isChordToken(text: string, czech = false): boolean {
  return parseChord(text, czech) !== null;
}

export function chordName(c: Chord, notation: Notation = 'international'): string {
  const q = quality(c.quality);
  let s = noteName(c.root, { notation }) + q.suffixes[0];
  if (c.bass !== undefined) s += '/' + noteName(c.bass, { notation });
  return s;
}

/** Převede zápis akordu z/do české notace (H ↔ B). Nerozpoznatelné názvy vrací beze změny. */
export function displayChord(name: string, notation: Notation): string {
  const c = parseChord(name);
  return c ? chordName(c, notation) : name;
}

export function chordPitchClasses(c: Chord): number[] {
  const pcs = quality(c.quality).intervals.map((i) => mod12(c.root + i));
  if (c.bass !== undefined && !pcs.includes(c.bass)) pcs.push(c.bass);
  return pcs;
}

export function transposeChord(c: Chord, semitones: number): Chord {
  const out: Chord = { root: mod12(c.root + semitones), quality: c.quality };
  if (c.bass !== undefined) out.bass = mod12(c.bass + semitones);
  return out;
}

export function transposeName(name: string, semitones: number): string {
  if (semitones % 12 === 0) return name;
  const c = parseChord(name);
  return c ? chordName(transposeChord(c, semitones)) : name;
}

export const INTERVAL_NAMES: Record<number, string> = {
  0: 'základní tón',
  2: 'nóna',
  3: 'malá tercie',
  4: 'velká tercie',
  5: 'kvarta',
  6: 'zmenšená kvinta',
  7: 'kvinta',
  8: 'zvětšená kvinta',
  9: 'sexta',
  10: 'malá septima',
  11: 'velká septima',
};

// ---------------------------------------------------------------------------
// Prstoklady (voicings)

export interface Voicing {
  /** Pražce pro struny od 6. (E) po 1. (e); -1 = nehraje se, 0 = prázdná struna. */
  frets: number[];
  /** Prsty 1–4 (ukazováček…malíček), 0 = nic. */
  fingers: number[];
  /** Barré: pražec a rozsah strun (indexy 0–5). */
  barre?: { fret: number; from: number; to: number };
}

type Shape = [string, string];

// Ručně ověřené otevřené prstoklady nejčastějších akordů: [pražce, prsty], zápis od 6. struny.
const OPEN_SHAPES: Record<string, Shape> = {
  C: ['x32010', 'x32010'],
  D: ['xx0232', 'xx0132'],
  E: ['022100', '023100'],
  F: ['133211', '134211'],
  G: ['320003', '210003'],
  A: ['x02220', 'x01230'],
  B: ['x24442', 'x12341'],
  Cm: ['x35543', 'x13421'],
  Dm: ['xx0231', 'xx0231'],
  Em: ['022000', '023000'],
  Fm: ['133111', '134111'],
  'F#m': ['244222', '134111'],
  Gm: ['355333', '134111'],
  Am: ['x02210', 'x02310'],
  Bm: ['x24432', 'x13421'],
  C7: ['x32310', 'x32410'],
  D7: ['xx0212', 'xx0213'],
  E7: ['020100', '020100'],
  G7: ['320001', '320001'],
  A7: ['x02020', 'x02030'],
  B7: ['x21202', 'x21304'],
  Dm7: ['xx0211', 'xx0211'],
  Em7: ['020000', '020000'],
  Am7: ['x02010', 'x02010'],
  Cmaj7: ['x32000', 'x32000'],
  Dmaj7: ['xx0222', 'xx0111'],
  Emaj7: ['021100', '031200'],
  Fmaj7: ['xx3210', 'xx3210'],
  Gmaj7: ['320002', '320001'],
  Amaj7: ['x02120', 'x02130'],
  Dsus2: ['xx0230', 'xx0130'],
  Dsus4: ['xx0233', 'xx0134'],
  Asus2: ['x02200', 'x01200'],
  Asus4: ['x02230', 'x01230'],
  Esus4: ['022200', '023400'],
  Cadd9: ['x32033', 'x21034'],
  Gadd9: ['320203', '210304'],
  'G/B': ['x20003', 'x10003'],
  'C/G': ['332010', '342010'],
  'D/F#': ['200232', '100132'],
  E5: ['022xxx', '013xxx'],
  A5: ['x022xx', 'x013xx'],
};

function parseShape([f, fi]: Shape): Voicing {
  const frets = [...f].map((ch) => (ch === 'x' ? -1 : parseInt(ch, 36)));
  const fingers = [...fi].map((ch) => (ch === 'x' ? 0 : parseInt(ch, 36)));
  return withBarre({ frets, fingers });
}

/** Když jeden prst drží víc strun na stejném pražci, je to barré. */
function withBarre(v: Voicing): Voicing {
  const byFinger = new Map<number, number[]>();
  v.fingers.forEach((f, i) => {
    if (f > 0) byFinger.set(f, [...(byFinger.get(f) ?? []), i]);
  });
  for (const [, strings] of byFinger) {
    if (strings.length > 1 && strings.every((s) => v.frets[s] === v.frets[strings[0]])) {
      return { ...v, barre: { fret: v.frets[strings[0]], from: Math.min(...strings), to: Math.max(...strings) } };
    }
  }
  return v;
}

const OPEN_BY_KEY = new Map<string, Voicing>();
for (const [name, shape] of Object.entries(OPEN_SHAPES)) {
  const c = parseChord(name)!;
  OPEN_BY_KEY.set(chordKey(c), parseShape(shape));
}

function chordKey(c: Chord) {
  return `${c.root}:${c.quality}:${c.bass ?? ''}`;
}

/** Tóny (MIDI), které prstoklad zní, od nejhlubší struny. */
export function voicingMidi(v: Voicing, capo = 0): (number | null)[] {
  return v.frets.map((f, i) => (f < 0 ? null : STANDARD_TUNING[i] + f + capo));
}

/** Přiřadí prsty pražcům (heuristika včetně barré). */
export function assignFingers(frets: number[]): Voicing {
  const fretted = frets.map((f, i) => ({ f, i })).filter((x) => x.f > 0);
  const fingers = frets.map(() => 0);
  if (fretted.length === 0) return { frets, fingers };
  const minF = Math.min(...fretted.map((x) => x.f));
  const atMin = fretted.filter((x) => x.f === minF);
  const from = atMin[0].i;
  const canBarre = atMin.length >= 2 && !frets.some((f, i) => i > from && f >= 0 && f < minF);
  let barre: Voicing['barre'];
  let rest = fretted;
  if (canBarre && (fretted.length > 4 || atMin.length > 2)) {
    const to = Math.max(...atMin.map((x) => x.i));
    barre = { fret: minF, from, to };
    for (const x of atMin) fingers[x.i] = 1;
    rest = fretted.filter((x) => x.f !== minF);
  }
  const sorted = [...rest].sort((a, b) => a.f - b.f || a.i - b.i);
  let prev = barre ? 1 : 0;
  sorted.forEach((x, k) => {
    const rel = x.f - minF + 1;
    const maxAllowed = 4 - (sorted.length - 1 - k);
    const f = Math.max(1, Math.min(maxAllowed, Math.max(prev + 1, rel)));
    fingers[x.i] = f;
    prev = f;
  });
  return { frets, fingers, barre };
}

// Posuvné (barré) tvary: odsazení pražců od polohy základního tónu a prsty.
// E-tvar má základní tón na 6. struně, A-tvar na 5. struně.
type Movable = { offsets: (number | null)[]; fingers: number[] };
const E_SHAPES: Record<string, Movable> = {
  maj: { offsets: [0, 2, 2, 1, 0, 0], fingers: [1, 3, 4, 2, 1, 1] },
  min: { offsets: [0, 2, 2, 0, 0, 0], fingers: [1, 3, 4, 1, 1, 1] },
  '7': { offsets: [0, 2, 0, 1, 0, 0], fingers: [1, 3, 1, 2, 1, 1] },
  m7: { offsets: [0, 2, 0, 0, 0, 0], fingers: [1, 3, 1, 1, 1, 1] },
  maj7: { offsets: [0, null, 1, 1, 0, null], fingers: [1, 0, 3, 4, 1, 0] },
  sus4: { offsets: [0, 2, 2, 2, 0, 0], fingers: [1, 2, 3, 4, 1, 1] },
  '7sus4': { offsets: [0, 2, 0, 2, 0, 0], fingers: [1, 3, 1, 4, 1, 1] },
  '5': { offsets: [0, 2, 2, null, null, null], fingers: [1, 3, 4, 0, 0, 0] },
};
const A_SHAPES: Record<string, Movable> = {
  maj: { offsets: [null, 0, 2, 2, 2, 0], fingers: [0, 1, 2, 3, 4, 1] },
  min: { offsets: [null, 0, 2, 2, 1, 0], fingers: [0, 1, 3, 4, 2, 1] },
  '7': { offsets: [null, 0, 2, 0, 2, 0], fingers: [0, 1, 3, 1, 4, 1] },
  m7: { offsets: [null, 0, 2, 0, 1, 0], fingers: [0, 1, 3, 1, 2, 1] },
  maj7: { offsets: [null, 0, 2, 1, 2, 0], fingers: [0, 1, 3, 2, 4, 1] },
  sus2: { offsets: [null, 0, 2, 2, 0, 0], fingers: [0, 1, 3, 4, 1, 1] },
  sus4: { offsets: [null, 0, 2, 2, 3, 0], fingers: [0, 1, 2, 3, 4, 1] },
  '7sus4': { offsets: [null, 0, 2, 0, 3, 0], fingers: [0, 1, 3, 1, 4, 1] },
  '6': { offsets: [null, 0, 2, 2, 2, 2], fingers: [0, 1, 3, 3, 3, 3] },
  '9': { offsets: [null, 0, -1, 0, 0, null], fingers: [0, 2, 1, 3, 4, 0] },
  dim: { offsets: [null, 0, 1, 2, 1, null], fingers: [0, 1, 2, 4, 3, 0] },
  dim7: { offsets: [null, 0, 1, -1, 1, null], fingers: [0, 2, 3, 1, 4, 0] },
  m7b5: { offsets: [null, 0, 1, 0, 1, null], fingers: [0, 1, 3, 2, 4, 0] },
  aug: { offsets: [null, 0, -1, -2, -2, null], fingers: [0, 4, 3, 1, 1, 0] },
  '5': { offsets: [null, 0, 2, 2, null, null], fingers: [0, 1, 3, 4, 0, 0] },
};

function movableVoicings(c: Chord): Voicing[] {
  if (c.bass !== undefined) return [];
  const out: { v: Voicing; pos: number }[] = [];
  const add = (shape: Movable | undefined, rootString: number) => {
    if (!shape) return;
    let r = mod12(c.root - STANDARD_TUNING[rootString]);
    const minOff = Math.min(...shape.offsets.filter((o): o is number => o !== null));
    if (r + minOff < 0 || (r === 0 && minOff < 0)) r += 12;
    const frets = shape.offsets.map((o) => (o === null ? -1 : r + o));
    if (Math.max(...frets) > 15) return;
    const v = r === 0 ? assignFingers(frets) : withBarre({ frets, fingers: [...shape.fingers] });
    out.push({ v, pos: r });
  };
  add(E_SHAPES[c.quality], 0);
  add(A_SHAPES[c.quality], 1);
  return out.sort((a, b) => a.pos - b.pos).map((x) => x.v);
}

function fingersNeeded(frets: number[]): number {
  const fretted = frets.filter((f) => f > 0);
  if (fretted.length === 0) return 0;
  const minF = Math.min(...fretted);
  const lowest = frets.findIndex((f) => f === minF);
  const canBarre = !frets.some((f, i) => i > lowest && f >= 0 && f < minF);
  const atMin = fretted.filter((f) => f === minF).length;
  return canBarre && atMin > 1 ? fretted.length - atMin + 1 : fretted.length;
}

/**
 * Vyhledá hratelné prstoklady pro libovolný akord hrubou silou přes okna 4 pražců.
 * Vrací je seřazené od nejsnáze hratelného.
 */
export function searchVoicings(c: Chord, limit = 6): Voicing[] {
  const tones = chordPitchClasses(c);
  const required = new Set(tones);
  // U akordů se 4+ tóny lze vynechat kvintu.
  const fifth = mod12(c.root + 7);
  const optional = tones.length >= 4 && quality(c.quality).intervals.includes(7) ? fifth : -1;
  const bass = c.bass ?? c.root;
  const results: { frets: number[]; cost: number }[] = [];
  const seen = new Set<string>();

  for (let start = 0; start <= 12; start++) {
    const options: number[][] = STANDARD_TUNING.map((open) => {
      const opts = [-1];
      if (tones.includes(mod12(open))) opts.push(0);
      for (let f = Math.max(1, start); f <= start + 3; f++) if (tones.includes(mod12(open + f))) opts.push(f);
      return opts;
    });
    const cur = new Array(6).fill(-1);
    const rec = (s: number) => {
      if (s === 6) {
        const played = cur.map((f, i) => (f < 0 ? null : STANDARD_TUNING[i] + f));
        const firstIdx = played.findIndex((p) => p !== null);
        if (firstIdx < 0) return;
        const count = played.filter((p) => p !== null).length;
        if (count < Math.min(4, tones.length + 1) && c.quality !== '5') return;
        if (mod12(played[firstIdx]!) !== bass) return;
        const present = new Set(played.filter((p): p is number => p !== null).map(mod12));
        for (const t of required) if (!present.has(t) && t !== optional) return;
        // Tlumené struny jen na basové straně (vnitřní tlumení je těžké).
        const innerMute = cur.slice(firstIdx).filter((f) => f < 0).length;
        const fretted = cur.filter((f) => f > 0);
        const maxF = fretted.length ? Math.max(...fretted) : 0;
        const minF = fretted.length ? Math.min(...fretted) : 0;
        if (maxF - minF > 3) return;
        const need = fingersNeeded(cur);
        if (need > 4) return;
        const key = cur.join(',');
        if (seen.has(key)) return;
        seen.add(key);
        const cost =
          minF * 0.9 +
          (maxF - minF) * 0.6 +
          need * 0.5 +
          innerMute * 3 +
          firstIdx * 0.4 +
          (6 - count) * 0.3 +
          (fretted.length > 0 && fretted.length === cur.filter((f) => f >= 0).length && need < fretted.length ? 1.2 : 0);
        results.push({ frets: [...cur], cost });
        return;
      }
      for (const o of options[s]) {
        cur[s] = o;
        rec(s + 1);
      }
      cur[s] = -1;
    };
    rec(0);
  }
  results.sort((a, b) => a.cost - b.cost);
  // Odstraníme téměř duplicitní prstoklady ve stejné poloze.
  const out: Voicing[] = [];
  const positions: number[] = [];
  for (const r of results) {
    const pos = Math.min(...r.frets.filter((f) => f > 0).concat([99]));
    if (positions.filter((p) => Math.abs(p - pos) < 2).length >= 1 && out.length > 0) continue;
    positions.push(pos);
    out.push(assignFingers(r.frets));
    if (out.length >= limit) break;
  }
  return out;
}

const voicingCache = new Map<string, Voicing[]>();

/** Prstoklady pro akord: nejdřív ověřené otevřené, pak vyhledané. */
export function getVoicings(c: Chord): Voicing[] {
  const key = chordKey(c);
  const cached = voicingCache.get(key);
  if (cached) return cached;
  const list: Voicing[] = [];
  const open = OPEN_BY_KEY.get(key);
  if (open) list.push(open);
  for (const v of [...movableVoicings(c), ...searchVoicings(c)]) {
    if (!list.some((x) => x.frets.join() === v.frets.join())) list.push(v);
  }
  voicingCache.set(key, list);
  return list;
}

export function getVoicing(name: string): Voicing | null {
  const c = parseChord(name);
  if (!c) return null;
  return getVoicings(c)[0] ?? null;
}

/** Odhad obtížnosti akordu pro začátečníka (0 = snadný otevřený, výš = těžší). */
export function chordDifficulty(c: Chord): number {
  const v = OPEN_BY_KEY.get(chordKey(c));
  if (v) return v.barre ? 3 : 1;
  const s = getVoicings(c)[0];
  if (!s) return 10;
  const fretted = s.frets.filter((f) => f > 0);
  const pos = fretted.length ? Math.min(...fretted) : 0;
  return 4 + (s.barre ? 1 : 0) + pos * 0.2;
}

/**
 * Tón (MIDI) basové struny: nejnižší hraná struna. Vrací index struny.
 */
export function bassString(v: Voicing): number {
  return v.frets.findIndex((f) => f >= 0);
}

/** Alternativní bas: struna nad basem nesoucí kvintu (nebo jiný tón akordu). */
export function altBassString(v: Voicing, c: Chord): number {
  const b = bassString(v);
  const fifth = mod12(c.root + 7);
  for (let s = b + 1; s <= Math.min(b + 2, 3); s++) {
    if (v.frets[s] >= 0 && mod12(STANDARD_TUNING[s] + v.frets[s]) === fifth) return s;
  }
  for (let s = b + 1; s <= 3; s++) if (v.frets[s] >= 0) return s;
  return b;
}

export const ROOT_ORDER = [0, 2, 4, 5, 7, 9, 11, 1, 3, 6, 8, 10];
export const LIBRARY_QUALITIES = ['maj', 'min', '7', 'm7', 'maj7', 'sus2', 'sus4', 'add9', '6', 'dim', 'aug', '9', 'm7b5', '5'];
