import { useMemo } from 'react';
import { BUILTIN_SONGS } from './music/library';
import { parseChordPro, type Song } from './music/song';
import { useStore } from './store';

export function useAllSongs(): Song[] {
  const stored = useStore((s) => s.songs);
  return useMemo(() => [...stored.map((s) => parseChordPro(s.source, s.id)), ...BUILTIN_SONGS], [stored]);
}

export function useSong(id: string | undefined): Song | undefined {
  const songs = useAllSongs();
  return songs.find((s) => s.id === id);
}
