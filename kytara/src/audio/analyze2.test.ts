import { expect, it } from 'vitest';
import { getVoicing, voicingMidi } from '../music/chords';
import { midiToFreq } from '../music/notes';
import { analyzeSignal, ANALYSIS_SAMPLE_RATE as SR } from './analyze';
import { renderNotes } from './pluck';

it('recognizes G D Em C with damped chord changes', () => {
  const bpm = 96, beat = 60 / bpm;
  const prog = ['G', 'D', 'Em', 'C', 'G', 'D', 'C', 'C', 'G', 'D', 'Em', 'C', 'G', 'D', 'G', 'G'];
  const notes: { freq: number; time: number; gain?: number; dur?: number }[] = [];
  prog.forEach((n, ci) => {
    const m = voicingMidi(getVoicing(n)!).filter((x): x is number => x !== null);
    for (let b = 0; b < 4; b++) {
      const t = 0.4 + (ci * 4 + b) * beat;
      (b % 2 ? [...m].reverse() : m).forEach((x, i) => notes.push({ freq: midiToFreq(x), time: t + i * 0.01, gain: 0.2, dur: beat * 1.05 }));
    }
  });
  const r = analyzeSignal(renderNotes(notes, SR, 0.4 + prog.length * 4 * beat + 1), SR);
  const bars: string[] = [];
  for (let b = r.downbeat; b < r.beatChords.length; b += 4) bars.push(r.beatChords[b + 1] ?? '');
  const got = bars.filter((c) => c !== 'N').slice(0, prog.length);
  const hits = got.filter((c, i) => c === prog[i]).length;
  expect(hits / prog.length, got.join(' ')).toBeGreaterThanOrEqual(0.85);
});
