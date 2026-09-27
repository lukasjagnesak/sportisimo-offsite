// Základní práce s tóny: pitch class 0 = C … 11 = B (česky H).

export const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
// Nejběžnější zápis kořene akordu v kytarových zpěvnících.
export const COMMON_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

/** Standardní ladění, od nejhlubší struny (6. struna E2) po nejvyšší (1. struna E4), MIDI čísla. */
export const STANDARD_TUNING = [40, 45, 50, 55, 59, 64];
export const STRING_LABELS = ['E', 'A', 'D', 'G', 'B', 'e'];

export const mod12 = (n: number) => ((n % 12) + 12) % 12;

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function freqToMidi(freq: number): number {
  return 69 + 12 * Math.log2(freq / 440);
}

/**
 * Převede název tónu na pitch class. Podporuje mezinárodní i českou notaci:
 * H = B (h), v české notaci "B" znamená Bb. Vrací null, pokud nejde o tón.
 */
export function parseNote(name: string, czech = false): number | null {
  const m = /^([A-Ha-h])(#|b|is|es|s)?$/.exec(name.trim());
  if (!m) return null;
  const letter = m[1].toUpperCase();
  const acc = m[2] ?? '';
  const base: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11, H: 11 };
  let pc = base[letter];
  if (czech && letter === 'B' && !acc) return 10;
  if (acc === '#' || acc === 'is') pc += 1;
  else if (acc === 'b' || acc === 'es' || acc === 's') pc -= 1;
  return mod12(pc);
}

export type Notation = 'international' | 'czech';

export function noteName(pc: number, opts: { flats?: boolean; notation?: Notation } = {}): string {
  const p = mod12(pc);
  let name = opts.flats === undefined ? COMMON_NAMES[p] : opts.flats ? FLAT_NAMES[p] : SHARP_NAMES[p];
  if (opts.notation === 'czech') {
    if (name === 'B') name = 'H';
    else if (name === 'Bb' || name === 'A#') name = 'B';
  }
  return name;
}

export function midiNoteName(midi: number, notation: Notation = 'international'): string {
  return noteName(mod12(midi), { notation, flats: false }) + (Math.floor(midi / 12) - 1);
}
