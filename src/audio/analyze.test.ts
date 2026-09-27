import { describe, expect, it } from 'vitest';
import { getVoicing, voicingMidi } from '../music/chords';
import { midiToFreq } from '../music/notes';
import { parseChordPro, songEvents } from '../music/song';
import { analysisToChordPro, analyzeSignal, estimateKey, suggestCapo, ANALYSIS_SAMPLE_RATE as SR } from './analyze';
import { renderNotes } from './pluck';

function render(progression: string[], bpm: number, beatsPerChord: number, lead = 0.5) {
  const beat = 60 / bpm;
  const notes: { freq: number; time: number; gain?: number }[] = [];
  progression.forEach((name, ci) => {
    const midis = voicingMidi(getVoicing(name)!).filter((m): m is number => m !== null);
    for (let b = 0; b < beatsPerChord; b++) {
      const t = lead + (ci * beatsPerChord + b) * beat;
      const down = b % 2 === 0;
      const order = down ? midis : [...midis].reverse();
      order.forEach((m, i) => notes.push({ freq: midiToFreq(m), time: t + i * 0.01, gain: b % 4 === 0 ? 0.3 : 0.2 }));
    }
  });
  const dur = lead + progression.length * beatsPerChord * beat + 1;
  return renderNotes(notes, SR, dur);
}

describe('offline analysis', () => {
  it('finds tempo and chords of a strummed progression', () => {
    const prog = ['C', 'G', 'Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G', 'C', 'C'];
    const sig = render(prog, 100, 4);
    const r = analyzeSignal(sig, SR);
    expect(Math.abs(r.bpm - 100) < 4 || Math.abs(r.bpm - 200) < 8 || Math.abs(r.bpm - 50) < 3).toBe(true);
    const chords = r.segments.filter((s) => s.chord !== 'N' && s.end - s.start > 1).map((s) => s.chord);
    const expected = ['C', 'G', 'Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G', 'C'];
    let hits = 0;
    for (const s of r.segments) {
      if (s.chord === 'N') continue;
      const mid = (s.start + s.end) / 2;
      const idx = Math.floor((mid - 0.5) / (4 * 0.6));
      if (prog[idx] === s.chord) hits += s.end - s.start;
    }
    const total = prog.length * 4 * 0.6;
    expect(hits / total, `segments: ${chords.join(' ')}`).toBeGreaterThan(0.8);
    expect(chords.join(' ')).toContain(expected.slice(0, 4).join(' '));
    expect(r.key.name).toBe('C');
    const cp = analysisToChordPro(r, 'Test');
    const song = parseChordPro(cp);
    expect(songEvents(song).length).toBeGreaterThan(5);
  });

  it('estimates keys', () => {
    const cMajor = [1, 0, 0.6, 0, 0.8, 0.6, 0, 0.9, 0, 0.6, 0, 0.4];
    expect(estimateKey(cMajor).name).toBe('C');
    const aMinor = [0.7, 0, 0.5, 0, 0.9, 0.4, 0, 0.5, 0.3, 1, 0, 0.5];
    expect(estimateKey(aMinor).name).toBe('Am');
  });

  it('suggests capo for hard keys', () => {
    expect(suggestCapo(['C', 'G', 'Am', 'F'])).toBe(0);
    // Eb, Bb, Cm, Ab = C, G, Am, F s kapodastrem na 3.
    expect(suggestCapo(['Eb', 'Bb', 'Cm', 'Ab'])).toBeGreaterThan(0);
    expect(suggestCapo(['Bb', 'F', 'Gm', 'Eb'])).toBe(3);
  });
});
