import { getVoicing, parseChord } from '../music/chords';
import { stepStrings, type Pattern } from '../music/patterns';
import type { ChordEvent } from '../music/song';
import { audioContext, click, playStrings } from './engine';

export interface SchedulerConfig {
  events: ChordEvent[];
  totalBeats: number;
  bpm: number;
  beatsPerBar: number;
  pattern: Pattern;
  /** Převod zapsaného akordu na hraný tvar. */
  shape: (chord: string) => string;
  capo: number;
  accompaniment: boolean;
  metronome: boolean;
  loop?: { start: number; end: number } | null;
}

interface Anchor {
  time: number;
  beat: number;
}

/**
 * Přehrávání písně s předstihem plánovaným do AudioContextu (přesné časování).
 * Pozici v písni lze kdykoli zjistit metodou `position()`.
 */
export class SongScheduler {
  private cfg: SchedulerConfig;
  private timer: ReturnType<typeof setInterval> | null = null;
  private anchors: Anchor[] = [];
  private nextStep = 0; // globální index kroku (v rámci písně)
  private nextTime = 0;
  onEnd?: () => void;

  constructor(cfg: SchedulerConfig) {
    this.cfg = cfg;
  }

  get stepDur() {
    return 60 / this.cfg.bpm / this.cfg.pattern.stepsPerBeat;
  }

  update(cfg: Partial<SchedulerConfig>) {
    const pos = this.running ? this.position() : null;
    this.cfg = { ...this.cfg, ...cfg };
    if (pos !== null && pos >= 0 && (cfg.bpm !== undefined || cfg.pattern !== undefined)) {
      // Změna tempa za běhu: navážeme od aktuální pozice.
      this.startAt(Math.max(0, pos), false);
    }
  }

  get running() {
    return this.timer !== null;
  }

  start(fromBeat = 0, countInBars = 1) {
    this.startAt(fromBeat, true, countInBars);
  }

  private startAt(fromBeat: number, withCountIn: boolean, countInBars = 1) {
    this.stopTimer();
    const c = audioContext();
    const spb = this.cfg.pattern.stepsPerBeat;
    this.nextStep = Math.ceil(fromBeat * spb - 1e-6);
    const beatDur = 60 / this.cfg.bpm;
    let t = c.currentTime + 0.08;
    if (withCountIn && countInBars > 0) {
      const n = this.cfg.beatsPerBar * countInBars;
      for (let i = 0; i < n; i++) click(t + i * beatDur, i % this.cfg.beatsPerBar === 0, 0.6);
      t += n * beatDur;
    }
    this.nextTime = t;
    this.anchors = [{ time: t, beat: this.nextStep / spb }];
    this.timer = setInterval(() => this.tick(), 25);
    this.tick();
  }

  private tick() {
    const c = audioContext();
    const horizon = c.currentTime + 0.12;
    const spb = this.cfg.pattern.stepsPerBeat;
    while (this.nextTime < horizon) {
      let beat = this.nextStep / spb;
      const loop = this.cfg.loop;
      if (loop && beat >= loop.end - 1e-6) {
        this.nextStep = Math.round(loop.start * spb);
        beat = loop.start;
        this.anchors.push({ time: this.nextTime, beat });
      }
      if (beat >= this.cfg.totalBeats - 1e-6) {
        const endTime = this.nextTime;
        this.stopTimer();
        setTimeout(() => this.onEnd?.(), Math.max(0, (endTime - c.currentTime) * 1000));
        return;
      }
      this.playStep(this.nextStep, this.nextTime);
      this.nextStep++;
      this.nextTime += this.stepDur;
    }
    if (this.anchors.length > 8) this.anchors = this.anchors.slice(-4);
  }

  private playStep(step: number, when: number) {
    const { pattern, beatsPerBar } = this.cfg;
    const spb = pattern.stepsPerBeat;
    const beat = step / spb;
    if (this.cfg.metronome && step % spb === 0) {
      click(when, Math.round(beat) % beatsPerBar === 0, 0.35);
    }
    if (!this.cfg.accompaniment) return;
    const ev = eventAt(this.cfg.events, beat);
    if (!ev) return;
    const shape = this.cfg.shape(ev.chord);
    const v = getVoicing(shape);
    const chord = parseChord(shape);
    if (!v || !chord) return;
    const barStep = Math.round(((beat % beatsPerBar) + beatsPerBar) % beatsPerBar * spb);
    const st = pattern.steps[barStep % pattern.steps.length];
    if (st.kind === 'rest') return;
    const strings = stepStrings(st, v, chord);
    const accent = st.kind === 'strum' && st.accent;
    playStrings(v, strings, {
      when,
      capo: this.cfg.capo,
      spread: st.kind === 'pick' ? 0 : 0.014,
      gain: st.kind === 'pick' ? 0.32 : accent ? 0.3 : st.kind === 'strum' && st.treble ? 0.18 : 0.22,
      mute: st.kind === 'chuck',
    });
  }

  /** Aktuální pozice v dobách (záporná během odpočítávání). */
  position(): number {
    const now = audioContext().currentTime;
    const beatDur = 60 / this.cfg.bpm;
    let a = this.anchors[0];
    for (const x of this.anchors) if (x.time <= now) a = x;
    if (!a) return 0;
    return a.beat + (now - a.time) / beatDur;
  }

  private stopTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  stop() {
    this.stopTimer();
  }
}

export function eventAt(events: ChordEvent[], beat: number): ChordEvent | undefined {
  // Binární vyhledávání posledního akordu, který začal před `beat`.
  let lo = 0;
  let hi = events.length - 1;
  let found: ChordEvent | undefined;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (events[mid].startBeat <= beat + 1e-6) {
      found = events[mid];
      lo = mid + 1;
    } else hi = mid - 1;
  }
  if (found && beat < found.startBeat + found.beats) return found;
  return found && beat >= 0 ? found : undefined;
}

export function eventIndexAt(events: ChordEvent[], beat: number): number {
  const ev = eventAt(events, beat);
  return ev ? events.indexOf(ev) : -1;
}
