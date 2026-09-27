import { useMemo, useState } from 'react';
import { useChordLabel } from '../components/common';
import { songChords, parseChordPro, chordsOverLyricsToChordPro, slugify, transposeSource, songEvents } from '../music/song';
import { href, navigate } from '../router';
import { useAllSongs } from '../songs';
import { deleteSong, saveSong, useStore } from '../store';
import { ChordDiagram } from '../components/ChordDiagram';
import { getVoicing } from '../music/chords';

const LEVELS = ['', 'Začátečník', 'Mírně pokročilý', 'Pokročilý'];

export function SongsPage() {
  const songs = useAllSongs();
  const label = useChordLabel();
  const progress = useStore((s) => s.progress.songs);
  const known = useStore((s) => s.progress.chords);
  const [filter, setFilter] = useState('');
  const list = songs.filter((s) => (s.title + ' ' + (s.artist ?? '')).toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="page">
      <div className="row between wrap">
        <h1>Písně</h1>
        <div className="row gap">
          <a className="btn" href={href('/rozpoznat')}>
            🎧 Rozpoznat z nahrávky
          </a>
          <a className="btn primary" href={href('/editor')}>
            + Přidat píseň
          </a>
        </div>
      </div>
      <input className="search" placeholder="Hledat…" value={filter} onChange={(e) => setFilter(e.target.value)} />
      <div className="song-list">
        {list.map((s) => {
          const chords = songChords(s);
          const p = progress[s.id];
          const knownCount = chords.filter((c) => (known[c]?.hits ?? 0) > 0).length;
          return (
            <a key={s.id} className="song-card" href={href(`/pisen/${s.id}`)}>
              <div className="song-title">
                {s.title}
                {!s.builtin && <span className="pill">vlastní</span>}
              </div>
              <div className="muted small">
                {s.artist} {s.level ? `· ${LEVELS[s.level]}` : ''} · {s.beatsPerBar}/{s.beatsPerBar === 6 ? 8 : 4}
              </div>
              <div className="song-chords">
                {chords.slice(0, 8).map((c) => (
                  <span key={c} className={`chord-tag ${(known[c]?.hits ?? 0) > 0 ? 'known' : ''}`}>
                    {label(c)}
                  </span>
                ))}
              </div>
              <div className="muted small">
                Znáš {knownCount}/{chords.length} akordů
                {p ? ` · hráno ${p.plays}×` : ''}
                {p?.bestScore !== undefined ? ` · nejlepší skóre ${p.bestScore} %` : ''}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

const TEMPLATE = `{title: Název písně}
{artist: Interpret}
{bpm: 90}
{time: 4/4}
{pattern: folk}

{c: Sloka 1}
[G]Text první řádky [D]s akordy v hranatých [Em]závorkách
[C]Akord trvá celý takt, [G:2]půl taktu se píše [D:2]takto

{c: Refrén}
| G | D | Em | C |
`;

export function EditorPage({ id }: { id?: string }) {
  const stored = useStore((s) => s.songs);
  const czech = useStore((s) => s.settings.notation === 'czech');
  const existing = stored.find((s) => s.id === id);
  const [source, setSource] = useState(existing?.source ?? TEMPLATE);
  const [paste, setPaste] = useState('');
  const song = useMemo(() => parseChordPro(source, id ?? 'new'), [source, id]);
  const label = useChordLabel();
  const chords = songChords(song);
  const unknown = chords.filter((c) => !getVoicing(c));

  const save = () => {
    const newId = id ?? `${slugify(song.title)}-${Date.now().toString(36).slice(-4)}`;
    saveSong(newId, source);
    navigate(`/pisen/${newId}`);
  };

  return (
    <div className="page">
      <a href={href('/pisne')} className="back">
        ← Písně
      </a>
      <h1>{id ? 'Upravit píseň' : 'Nová píseň'}</h1>
      <div className="editor-grid">
        <div className="card">
          <h3>Zápis (ChordPro)</h3>
          <textarea className="code" value={source} onChange={(e) => setSource(e.target.value)} rows={22} spellCheck={false} />
          <div className="row gap wrap">
            <button className="btn primary" onClick={save} disabled={songEvents(song).length === 0}>
              Uložit a hrát
            </button>
            <button className="btn" onClick={() => setSource(transposeSource(source, -1))}>
              Transponovat −1
            </button>
            <button className="btn" onClick={() => setSource(transposeSource(source, 1))}>
              Transponovat +1
            </button>
            {id && (
              <button
                className="btn danger"
                onClick={() => {
                  if (confirm('Opravdu smazat tuto píseň?')) {
                    deleteSong(id);
                    navigate('/pisne');
                  }
                }}
              >
                Smazat
              </button>
            )}
          </div>
          <details className="help">
            <summary>Nápověda k zápisu</summary>
            <ul>
              <li>
                <code>[Am]</code> akord před slabikou, na které se mění. Trvá jeden takt, <code>[Am:2]</code> jen 2 doby.
              </li>
              <li>
                <code>| Am | G F | E |</code> instrumentální řádek po taktech (akordy v taktu se rozdělí rovnoměrně).
              </li>
              <li>
                <code>{'{title: …}'}</code>, <code>{'{artist: …}'}</code>, <code>{'{bpm: 90}'}</code>, <code>{'{time: 3/4}'}</code>, <code>{'{capo: 2}'}</code>, <code>{'{key: G}'}</code>
              </li>
              <li>
                <code>{'{pattern: folk}'}</code> rytmus: down4, down-up8, folk, rock8, reggae, funk-chuck, country, waltz, waltz-du, arp4, arp-up, travis, pinch, waltz-arp, arp68, strum68
              </li>
              <li>
                <code>{'{c: Refrén}'}</code> nadpis části, <code>{'{note: …}'}</code> poznámka k písni.
              </li>
            </ul>
          </details>
        </div>
        <div className="card">
          <h3>Vložit ze zpěvníku</h3>
          <p className="muted small">Zkopírujte píseň z webu ve formátu „akordy nad textem“ – převedu ji. {czech ? 'Akordy H/B se čtou v české notaci.' : ''}</p>
          <textarea className="code" rows={8} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={'G         D\nHolka modrooká, nesedávej u potoka'} />
          <button
            className="btn"
            disabled={!paste.trim()}
            onClick={() => {
              const converted = chordsOverLyricsToChordPro(paste, czech);
              const header = source.split('\n').filter((l) => /^\{(title|t|artist|bpm|time|capo|key|pattern)\s*:/.test(l.trim()));
              setSource([...header, '', converted].join('\n'));
              setPaste('');
            }}
          >
            Převést a vložit
          </button>
          <h3>Náhled</h3>
          <div className="muted small">
            {song.title} · {song.bpm} BPM · {song.beatsPerBar}/{song.beatsPerBar === 6 ? 8 : 4} · {songEvents(song).length} akordů
          </div>
          <div className="chip-row">
            {chords.map((c) => (
              <ChordDiagram key={c} voicing={getVoicing(c)} name={label(c)} size={70} />
            ))}
          </div>
          {unknown.length > 0 && <p className="error">Nerozpoznané akordy: {unknown.join(', ')}</p>}
        </div>
      </div>
    </div>
  );
}
