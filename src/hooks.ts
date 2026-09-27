import { useCallback, useEffect, useRef, useState } from 'react';
import { checkChord, LIVE_QUALITIES, rankChords, vocabulary, type Candidate, type CheckResult } from './audio/chordDetect';
import type { ChromaFrame } from './audio/dsp';
import { getMicrophone, LiveInput } from './audio/engine';
import { getVoicing } from './music/chords';
import { getState } from './store';

export type MicState = 'off' | 'starting' | 'on' | 'error';

/** Správa mikrofonu (nebo jiného vstupu) s automatickým uklizením. */
export function useLiveInput() {
  const [state, setState] = useState<MicState>('off');
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState<LiveInput | null>(null);
  const ref = useRef<LiveInput | null>(null);

  const stop = useCallback(() => {
    ref.current?.stop();
    ref.current = null;
    setInput(null);
    setState('off');
  }, []);

  const start = useCallback(async (getStream: () => Promise<MediaStream> = getMicrophone, opts?: { monitor?: boolean }) => {
    ref.current?.stop();
    setState('starting');
    setError(null);
    try {
      const stream = await getStream();
      const li = new LiveInput(stream, opts);
      ref.current = li;
      setInput(li);
      setState('on');
      // Když uživatel ukončí sdílení v prohlížeči.
      stream.getAudioTracks()[0]?.addEventListener('ended', () => {
        if (ref.current === li) stop();
      });
      return li;
    } catch (e) {
      setError(e instanceof Error ? friendlyError(e) : String(e));
      setState('error');
      return null;
    }
  }, [stop]);

  useEffect(() => () => ref.current?.stop(), []);
  return { state, error, input, start, stop };
}

function friendlyError(e: Error): string {
  if (e.name === 'NotAllowedError') return 'Přístup byl zamítnut. Povolte mikrofon/sdílení v prohlížeči a zkuste to znovu.';
  if (e.name === 'NotFoundError') return 'Nenašel jsem žádný mikrofon.';
  return e.message;
}

/** Spouští callback v pravidelném intervalu, dokud je `active`. */
export function useInterval(cb: () => void, ms: number, active = true) {
  const saved = useRef(cb);
  saved.current = cb;
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => saved.current(), ms);
    return () => clearInterval(id);
  }, [ms, active]);
}

function averageFrames(frames: ChromaFrame[]): ChromaFrame {
  const chroma = new Float32Array(12);
  const bass = new Float32Array(12);
  let energy = 0;
  for (const f of frames) {
    for (let i = 0; i < 12; i++) {
      chroma[i] += f.chroma[i];
      bass[i] += f.bass[i];
    }
    energy += f.energy;
  }
  const n = frames.length || 1;
  return { chroma: chroma.map((x) => x / n), bass: bass.map((x) => x / n), energy: energy / n };
}

export interface ListenState {
  level: number;
  loud: boolean;
  frame: ChromaFrame | null;
  candidates: Candidate[];
  check: CheckResult | null;
  /** Správný akord drží stabilně (několik snímků po sobě). */
  stable: boolean;
}

const EMPTY: ListenState = { level: 0, loud: false, frame: null, candidates: [], check: null, stable: false };

/**
 * Průběžně poslouchá vstup a (volitelně) ověřuje očekávaný akord.
 * `expected` je název tvaru akordu, který hráč drží; `capo` posune znějící tóny.
 */
export function useChordListener(input: LiveInput | null, expected: string | null, capo = 0, onCorrect?: () => void, resetKey?: unknown) {
  const [st, setSt] = useState<ListenState>(EMPTY);
  const history = useRef<ChromaFrame[]>([]);
  const hits = useRef<boolean[]>([]);
  const fired = useRef(false);
  const cb = useRef(onCorrect);
  cb.current = onCorrect;

  useEffect(() => {
    hits.current = [];
    fired.current = false;
  }, [expected, capo, resetKey]);

  useInterval(
    () => {
      if (!input) return;
      const f = input.chroma();
      const threshold = getState().settings.micThreshold;
      const loud = f.rms > threshold;
      if (!loud) {
        history.current = [];
        hits.current = [...hits.current, false].slice(-5);
        setSt((s) => ({ ...s, level: f.rms, loud: false, stable: false, check: s.check && { ...s.check, correct: false } }));
        return;
      }
      history.current = [...history.current, f].slice(-4);
      const avg = averageFrames(history.current);
      const candidates = rankChords(avg, vocabulary(LIVE_QUALITIES)).slice(0, 5);
      let check: CheckResult | null = null;
      let stable = false;
      if (expected) {
        check = checkChord(avg, expected, getVoicing(expected), capo);
        hits.current = [...hits.current, check.correct].slice(-5);
        stable = hits.current.filter(Boolean).length >= 3 && hits.current.slice(-2).every(Boolean);
        if (stable && !fired.current) {
          fired.current = true;
          cb.current?.();
        }
      }
      setSt({ level: f.rms, loud, frame: avg, candidates, check, stable });
    },
    90,
    !!input,
  );

  useEffect(() => {
    if (!input) setSt(EMPTY);
  }, [input]);

  return st;
}

export function usePersistentState<T>(key: string, initial: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(() => {
    try {
      const raw = localStorage.getItem('kytara:ui:' + key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  const set = useCallback(
    (nv: T) => {
      setV(nv);
      try {
        localStorage.setItem('kytara:ui:' + key, JSON.stringify(nv));
      } catch {
        /* ignorovat */
      }
    },
    [key],
  );
  return [v, set];
}
