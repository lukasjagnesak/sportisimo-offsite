import { useSyncExternalStore } from 'react';
import type { Notation } from './music/notes';

export interface Settings {
  notation: Notation;
  leftHanded: boolean;
  showNoteNames: boolean;
  /** Citlivost poslechu (min. hlasitost vstupu). */
  micThreshold: number;
}

export interface ChordStat {
  /** Kolikrát byl akord správně zahrán (ověřeno mikrofonem). */
  hits: number;
  /** Nejrychlejší čas, za který se akord povedlo zahrát (ms). */
  bestMs?: number;
  last?: string;
}

export interface Progress {
  chords: Record<string, ChordStat>;
  /** Nejlepší výsledky „minuty změn“, klíč „Am-C“. */
  changes: Record<string, number>;
  /** Minuty cvičení podle dne (YYYY-MM-DD). */
  days: Record<string, number>;
  songs: Record<string, { plays: number; bestScore?: number; last?: string }>;
  completedSteps: string[];
}

export interface StoredSong {
  id: string;
  source: string;
  updated: string;
}

interface State {
  settings: Settings;
  progress: Progress;
  songs: StoredSong[];
}

const KEY = 'kytara:v1';

const DEFAULT: State = {
  settings: { notation: 'czech', leftHanded: false, showNoteNames: false, micThreshold: 0.01 },
  progress: { chords: {}, changes: {}, days: {}, songs: {}, completedSteps: [] },
  songs: [],
};

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      settings: { ...DEFAULT.settings, ...parsed.settings },
      progress: { ...DEFAULT.progress, ...parsed.progress },
      songs: parsed.songs ?? [],
    };
  } catch {
    return DEFAULT;
  }
}

let state: State = load();
const listeners = new Set<() => void>();

function set(next: State) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Úložiště může být nedostupné (anonymní režim) – aplikace funguje dál bez ukládání.
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => select(state));
}

export const getState = () => state;

export function updateSettings(patch: Partial<Settings>) {
  set({ ...state, settings: { ...state.settings, ...patch } });
}

export const today = () => new Date().toISOString().slice(0, 10);

export function recordChordHit(chord: string, ms?: number) {
  const prev = state.progress.chords[chord] ?? { hits: 0 };
  const stat: ChordStat = {
    hits: prev.hits + 1,
    bestMs: ms !== undefined ? Math.min(prev.bestMs ?? Infinity, ms) : prev.bestMs,
    last: today(),
  };
  set({ ...state, progress: { ...state.progress, chords: { ...state.progress.chords, [chord]: stat } } });
}

export function recordChanges(pair: string, count: number): boolean {
  const prev = state.progress.changes[pair] ?? 0;
  if (count <= prev) return false;
  set({ ...state, progress: { ...state.progress, changes: { ...state.progress.changes, [pair]: count } } });
  return true;
}

export function addPracticeMinutes(minutes: number) {
  const d = today();
  const days = { ...state.progress.days, [d]: (state.progress.days[d] ?? 0) + minutes };
  set({ ...state, progress: { ...state.progress, days } });
}

export function recordSongPlay(id: string, score?: number) {
  const prev = state.progress.songs[id] ?? { plays: 0 };
  const next = {
    plays: prev.plays + 1,
    bestScore: score !== undefined ? Math.max(prev.bestScore ?? 0, score) : prev.bestScore,
    last: today(),
  };
  set({ ...state, progress: { ...state.progress, songs: { ...state.progress.songs, [id]: next } } });
}

export function toggleStep(id: string, done: boolean) {
  const steps = new Set(state.progress.completedSteps);
  if (done) steps.add(id);
  else steps.delete(id);
  set({ ...state, progress: { ...state.progress, completedSteps: [...steps] } });
}

export function saveSong(id: string, source: string) {
  const songs = state.songs.filter((s) => s.id !== id);
  songs.unshift({ id, source, updated: new Date().toISOString() });
  set({ ...state, songs });
}

export function deleteSong(id: string) {
  set({ ...state, songs: state.songs.filter((s) => s.id !== id) });
}

/** Počet po sobě jdoucích dní s cvičením (včetně dneška, nebo končící včera). */
export function streak(days: Record<string, number>): number {
  let n = 0;
  const d = new Date();
  if (!days[d.toISOString().slice(0, 10)]) d.setDate(d.getDate() - 1);
  while (days[d.toISOString().slice(0, 10)]) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function exportData(): string {
  return JSON.stringify(state, null, 2);
}

export function importData(json: string) {
  const parsed = JSON.parse(json) as Partial<State>;
  set({
    settings: { ...DEFAULT.settings, ...parsed.settings },
    progress: { ...DEFAULT.progress, ...parsed.progress },
    songs: parsed.songs ?? [],
  });
}
