import { describe, expect, it } from 'vitest';
import { chordName, chordPitchClasses, getVoicing, getVoicings, parseChord, searchVoicings, transposeName, voicingMidi } from './chords';
import { mod12 } from './notes';

describe('parseChord', () => {
  it('parses common names', () => {
    expect(parseChord('Am')).toEqual({ root: 9, quality: 'min' });
    expect(parseChord('F#m7')).toEqual({ root: 6, quality: 'm7' });
    expect(parseChord('Bbmaj7')).toEqual({ root: 10, quality: 'maj7' });
    expect(parseChord('G/B')).toEqual({ root: 7, quality: 'maj', bass: 11 });
    expect(parseChord('Hmi')).toEqual({ root: 11, quality: 'min' });
    expect(parseChord('B', true)).toEqual({ root: 10, quality: 'maj' });
    expect(parseChord('Hello')).toBeNull();
    expect(parseChord('Am7b5')?.quality).toBe('m7b5');
  });
  it('names and transposes', () => {
    expect(chordName({ root: 11, quality: 'min' }, 'czech')).toBe('Hm');
    expect(chordName({ root: 10, quality: 'maj' }, 'czech')).toBe('B');
    expect(transposeName('Am', 2)).toBe('Bm');
    expect(transposeName('D/F#', -2)).toBe('C/E');
  });
});

describe('voicings', () => {
  const names = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Am', 'Bm', 'C#m', 'Eb', 'Ab7', 'Gdim', 'Caug', 'Fmaj7', 'Esus4', 'Bbm7', 'G/B', 'C6', 'Dm9', 'F#7sus4'];
  for (const n of names) {
    it(`${n} voicing contains all required tones`, () => {
      const c = parseChord(n)!;
      const v = getVoicing(n)!;
      expect(v).toBeTruthy();
      const pcs = new Set(voicingMidi(v).filter((x): x is number => x !== null).map(mod12));
      const need = chordPitchClasses(c).filter((pc) => !(chordPitchClasses(c).length >= 4 && pc === mod12(c.root + 7)));
      for (const pc of need) expect(pcs.has(pc)).toBe(true);
      const bass = voicingMidi(v).find((x) => x !== null)!;
      expect(mod12(bass)).toBe(c.bass ?? c.root);
      expect(v.fingers.filter((f) => f > 4)).toEqual([]);
    });
  }
  it('search finds several positions', () => {
    expect(searchVoicings(parseChord('A')!).length).toBeGreaterThan(2);
    expect(getVoicings(parseChord('C')!)[0].frets).toEqual([-1, 3, 2, 0, 1, 0]);
  });
});
