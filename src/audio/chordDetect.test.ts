import { describe, expect, it } from 'vitest';
import { getVoicing, voicingMidi } from '../music/chords';
import { midiToFreq } from '../music/notes';
import { checkChord, rankChords, vocabulary, LIVE_QUALITIES } from './chordDetect';
import { chromaOfSignal, detectPitch } from './dsp';
import { pluckSamples, renderNotes } from './pluck';

const SR = 22050;

function strum(name: string, noise = 0.0) {
  const v = getVoicing(name)!;
  const notes = voicingMidi(v)
    .filter((m): m is number => m !== null)
    .map((m, i) => ({ freq: midiToFreq(m), time: i * 0.012 }));
  const sig = renderNotes(notes, SR, 1.2);
  let seed = 1;
  for (let i = 0; i < sig.length; i++) {
    seed = (seed * 16807) % 2147483647;
    sig[i] += (seed / 2147483647 - 0.5) * noise;
  }
  return sig;
}

describe('chord detection on synthesized guitar', () => {
  const chords = ['C', 'D', 'E', 'G', 'A', 'Am', 'Em', 'Dm', 'F', 'Bm', 'E7', 'A7', 'G7'];
  for (const name of chords) {
    it(`recognizes ${name}`, () => {
      const sig = strum(name, 0.02);
      const frame = chromaOfSignal(sig, SR, 8192, 2000);
      const res = checkChord(frame, name, getVoicing(name));
      expect(res.correct, `${name}: match ${res.match.toFixed(2)} heard ${res.heard}`).toBe(true);
      const top = rankChords(frame, vocabulary(['maj', 'min']))[0].name;
      if (!name.endsWith('7')) expect(top).toBe(name);
    });
  }
  it('rejects wrong chords', () => {
    const pairs = [['C', 'Am'], ['G', 'Em'], ['D', 'A'], ['E', 'Em'], ['Am', 'A'], ['G', 'C'], ['Dm', 'D']];
    for (const [played, expected] of pairs) {
      const frame = chromaOfSignal(strum(played, 0.02), SR, 8192, 2000);
      const res = checkChord(frame, expected, getVoicing(expected));
      expect(res.correct, `${played} played but ${expected} accepted (match ${res.match.toFixed(2)})`).toBe(false);
    }
  });
  it('rejects silence / noise', () => {
    const noise = new Float32Array(SR);
    let seed = 7;
    for (let i = 0; i < noise.length; i++) {
      seed = (seed * 16807) % 2147483647;
      noise[i] = (seed / 2147483647 - 0.5) * 0.1;
    }
    const frame = chromaOfSignal(noise, SR, 8192, 0);
    expect(checkChord(frame, 'C', getVoicing('C')).correct).toBe(false);
  });
  it('live vocabulary contains sevenths', () => {
    expect(vocabulary(LIVE_QUALITIES).length).toBe(12 * LIVE_QUALITIES.length);
  });
});

describe('pitch detection', () => {
  for (const midi of [40, 45, 50, 55, 59, 64]) {
    it(`detects string midi ${midi}`, () => {
      const s = pluckSamples(midiToFreq(midi), 44100, 0.5);
      const res = detectPitch(s.subarray(4000, 4000 + 4096), 44100)!;
      const cents = 1200 * Math.log2(res.freq / midiToFreq(midi));
      expect(Math.abs(cents)).toBeLessThan(5);
    });
  }
});
