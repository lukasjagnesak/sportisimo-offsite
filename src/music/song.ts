import { isChordToken, transposeName } from './chords';

export interface Segment {
  chord?: string;
  /** Délka akordu v dobách (výchozí je celý takt). */
  beats?: number;
  text: string;
}

export interface SongLine {
  segments: Segment[];
  /** Instrumentální řádek zapsaný v taktech: | Am | G F | */
  bars?: boolean;
}

export interface SongSection {
  label: string;
  kind: 'verse' | 'chorus' | 'other';
  lines: SongLine[];
}

export interface Song {
  id: string;
  title: string;
  artist?: string;
  bpm: number;
  beatsPerBar: number;
  key?: string;
  capo: number;
  patternId?: string;
  level?: 1 | 2 | 3;
  notes?: string;
  youtube?: string;
  source: string;
  sections: SongSection[];
  builtin?: boolean;
}

export interface ChordEvent {
  chord: string;
  startBeat: number;
  beats: number;
  section: number;
  line: number;
  segment: number;
}

const DIRECTIVE = /^\{\s*([a-z_]+)\s*(?::\s*(.*?))?\s*\}$/i;

export function parseChordPro(source: string, id = 'song'): Song {
  const song: Song = { id, title: 'Bez názvu', bpm: 90, beatsPerBar: 4, capo: 0, source, sections: [] };
  let section: SongSection | null = null;
  const ensureSection = (): SongSection => {
    if (!section) {
      section = { label: '', kind: 'verse', lines: [] };
      song.sections.push(section);
    }
    return section;
  };
  const startSection = (label: string, kind: SongSection['kind']) => {
    section = { label, kind, lines: [] };
    song.sections.push(section);
  };

  for (const raw of source.split(/\r?\n/)) {
    const line = raw.replace(/\s+$/, '');
    const d = DIRECTIVE.exec(line.trim());
    if (d) {
      const name = d[1].toLowerCase();
      const value = (d[2] ?? '').trim();
      switch (name) {
        case 'title':
        case 't':
          song.title = value;
          break;
        case 'artist':
        case 'subtitle':
        case 'st':
          song.artist = value;
          break;
        case 'bpm':
        case 'tempo':
          song.bpm = clampNum(parseFloat(value), 30, 260, 90);
          break;
        case 'time': {
          const n = parseInt(value.split('/')[0], 10);
          song.beatsPerBar = clampNum(n, 2, 12, 4);
          break;
        }
        case 'key':
          song.key = value;
          break;
        case 'capo':
          song.capo = clampNum(parseInt(value, 10), 0, 12, 0);
          break;
        case 'pattern':
          song.patternId = value;
          break;
        case 'level':
          song.level = clampNum(parseInt(value, 10), 1, 3, 1) as 1 | 2 | 3;
          break;
        case 'youtube':
          song.youtube = value;
          break;
        case 'note':
        case 'notes':
          song.notes = (song.notes ? song.notes + '\n' : '') + value;
          break;
        case 'soc':
        case 'start_of_chorus':
          startSection(value || 'Refrén', 'chorus');
          break;
        case 'sov':
        case 'start_of_verse':
          startSection(value || '', 'verse');
          break;
        case 'c':
        case 'comment':
        case 'section':
          startSection(value, /refr|chorus/i.test(value) ? 'chorus' : 'other');
          break;
        case 'eoc':
        case 'end_of_chorus':
        case 'eov':
        case 'end_of_verse':
          section = null;
          break;
      }
      continue;
    }
    if (line.trim() === '') {
      // Prázdný řádek ukončí sloku, pokud nejsme uvnitř explicitní sekce.
      if (section && (section as SongSection).lines.length && (section as SongSection).kind === 'verse' && !(section as SongSection).label) section = null;
      continue;
    }
    if (line.trim().startsWith('#')) continue;
    const trimmed = line.trim();
    if (trimmed.startsWith('|')) {
      ensureSection().lines.push(parseBarLine(trimmed, song.beatsPerBar));
      continue;
    }
    ensureSection().lines.push(parseLyricLine(line));
  }
  return song;
}

function clampNum(n: number, min: number, max: number, fallback: number) {
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

const CHORD_TAG = /\[([^\]]+)\]/g;

function splitChordTag(tag: string): { chord: string; beats?: number } {
  const m = /^(.*?):(\d+(?:\.\d+)?)$/.exec(tag.trim());
  if (m) return { chord: m[1].trim(), beats: parseFloat(m[2]) };
  return { chord: tag.trim() };
}

export function parseLyricLine(line: string): SongLine {
  const segments: Segment[] = [];
  let last = 0;
  let current: Segment = { text: '' };
  for (const m of line.matchAll(CHORD_TAG)) {
    current.text += line.slice(last, m.index);
    if (current.chord || current.text) segments.push(current);
    const { chord, beats } = splitChordTag(m[1]);
    current = { chord, beats, text: '' };
    last = m.index! + m[0].length;
  }
  current.text += line.slice(last);
  if (current.chord || current.text) segments.push(current);
  return { segments };
}

/** `| Am | G F | E:2 E7:2 |` – každá buňka je jeden takt, akordy v ní si takt rozdělí rovným dílem. */
export function parseBarLine(line: string, beatsPerBar: number): SongLine {
  const cells = line.split('|').map((c) => c.trim()).filter((c) => c.length > 0);
  const segments: Segment[] = [];
  for (const cell of cells) {
    const tokens = cell.split(/\s+/).map((t) => splitChordTag(t.replace(/^\[|\]$/g, '')));
    const explicit = tokens.reduce((s, t) => s + (t.beats ?? 0), 0);
    const free = tokens.filter((t) => t.beats === undefined).length;
    const each = free ? Math.max(0, beatsPerBar - explicit) / free : 0;
    for (const t of tokens) {
      if (t.chord === '%' && segments.length) {
        segments.push({ chord: segments[segments.length - 1].chord, beats: t.beats ?? each, text: '' });
      } else segments.push({ chord: t.chord, beats: t.beats ?? each, text: '' });
    }
  }
  return { segments, bars: true };
}

export function songEvents(song: Song): ChordEvent[] {
  const events: ChordEvent[] = [];
  let beat = 0;
  song.sections.forEach((sec, si) =>
    sec.lines.forEach((ln, li) =>
      ln.segments.forEach((seg, gi) => {
        if (!seg.chord) return;
        const beats = seg.beats ?? song.beatsPerBar;
        if (isNoChord(seg.chord)) {
          beat += beats;
          return;
        }
        events.push({ chord: seg.chord, startBeat: beat, beats, section: si, line: li, segment: gi });
        beat += beats;
      }),
    ),
  );
  return events;
}

export const isNoChord = (c: string) => /^(N\.?C\.?|N|-)$/i.test(c);

export function songChords(song: Song): string[] {
  return [...new Set(songEvents(song).map((e) => e.chord))];
}

/** Transponuje všechny akordy ve zdrojovém ChordPro textu. */
export function transposeSource(source: string, semitones: number): string {
  return source
    .split('\n')
    .map((line) => {
      if (DIRECTIVE.test(line.trim())) return line;
      if (line.trim().startsWith('|')) {
        return line.replace(/([^\s|]+)/g, (tok) => {
          const { chord, beats } = splitChordTag(tok);
          if (!isChordToken(chord)) return tok;
          return transposeName(chord, semitones) + (beats !== undefined ? ':' + beats : '');
        });
      }
      return line.replace(CHORD_TAG, (_m, tag: string) => {
        const { chord, beats } = splitChordTag(tag);
        return '[' + transposeName(chord, semitones) + (beats !== undefined ? ':' + beats : '') + ']';
      });
    })
    .join('\n');
}

/**
 * Převede běžný formát ze zpěvníků (akordy na řádku nad textem) na ChordPro.
 * Pozice akordu ve sloupci určuje, kam do textu se vloží.
 */
export function chordsOverLyricsToChordPro(text: string, czech = false): string {
  const lines = text.replace(/\t/g, '    ').split(/\r?\n/);
  const out: string[] = [];
  const isChordLine = (l: string) => {
    const toks = l.trim().split(/\s+/).filter(Boolean);
    return toks.length > 0 && toks.every((t) => isChordToken(t.replace(/[()]/g, ''), czech) || /^[|%x\d/.-]+$/.test(t));
  };
  const norm = (t: string) => {
    const c = t.replace(/[()]/g, '');
    return czech ? czechToIntl(c) : c;
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() && isChordLine(line)) {
      const chords = [...line.matchAll(/\S+/g)]
        .filter((m) => isChordToken(m[0].replace(/[()]/g, ''), czech))
        .map((m) => ({ pos: m.index!, chord: norm(m[0]) }));
      const next = lines[i + 1];
      if (next !== undefined && next.trim() && !isChordLine(next)) {
        let merged = '';
        let cursor = 0;
        const lyric = next.padEnd(Math.max(next.length, (chords.at(-1)?.pos ?? 0) + 1));
        for (const c of chords) {
          merged += lyric.slice(cursor, c.pos) + `[${c.chord}]`;
          cursor = c.pos;
        }
        merged += lyric.slice(cursor);
        out.push(formatSectionMarker(merged.replace(/\s+$/, '')));
        i++;
      } else {
        out.push('| ' + chords.map((c) => c.chord).join(' | ') + ' |');
      }
    } else {
      out.push(formatSectionMarker(line));
    }
  }
  return out.join('\n');
}

function czechToIntl(chord: string): string {
  // V české notaci H = B a B = Bb; do interního (mezinárodního) zápisu převedeme přes parser.
  return chord.replace(/^([A-Ha-h](?:#|b|is|es)?)/, (root) => {
    const r = root[0].toUpperCase() + root.slice(1);
    if (r === 'H') return 'B';
    if (r === 'B') return 'Bb';
    return r;
  }).replace(/\/(H|B)$/, (_m, b: string) => (b === 'H' ? '/B' : '/Bb'));
}

function formatSectionMarker(line: string): string {
  const m = /^\s*(R\d*:|Ref(?:\.|rén)?:|\d+\.(?=\s|$))\s*(.*)$/i.exec(line);
  if (!m) return line;
  const label = m[1].replace(':', '');
  const isChorus = /^r/i.test(label);
  return `{c: ${isChorus ? 'Refrén' : 'Sloka ' + label.replace('.', '')}}\n${m[2]}`;
}

export function slugify(s: string): string {
  return (
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'pisen'
  );
}
