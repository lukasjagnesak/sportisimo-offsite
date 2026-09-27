import { useEffect, useState } from 'react';
import { arpeggiate, playNote, strumChord } from '../audio/engine';
import { ChordDiagram } from '../components/ChordDiagram';
import { ChromaBars, LevelMeter, MicButton, useChordLabel, useNoteLabel } from '../components/common';
import { Fretboard } from '../components/Fretboard';
import { useChordListener, useLiveInput } from '../hooks';
import { chordName, chordPitchClasses, getVoicings, INTERVAL_NAMES, LIBRARY_QUALITIES, parseChord, quality, ROOT_ORDER, voicingMidi } from '../music/chords';
import { mod12, STANDARD_TUNING } from '../music/notes';
import { href } from '../router';
import { recordChordHit, useStore } from '../store';

const QUALITY_LABEL: Record<string, string> = {
  maj: 'dur',
  min: 'moll',
  '7': '7',
  m7: 'm7',
  maj7: 'maj7',
  sus2: 'sus2',
  sus4: 'sus4',
  add9: 'add9',
  '6': '6',
  dim: 'dim',
  aug: 'aug',
  '9': '9',
  m7b5: 'm7b5',
  '5': 'power (5)',
};

export function ChordsPage({ selected }: { selected?: string }) {
  const note = useNoteLabel();
  const label = useChordLabel();
  const [q, setQ] = useState('maj');
  const stats = useStore((s) => s.progress.chords);
  const chord = selected ? parseChord(selected) : null;

  if (chord && selected) return <ChordDetail name={chordName(chord)} />;

  return (
    <div className="page">
      <h1>Akordy</h1>
      <p className="lead">Klikni na akord pro detail: prstoklad na hmatníku, další polohy, tóny a ověření mikrofonem.</p>
      <div className="tabs wrap">
        {LIBRARY_QUALITIES.map((id) => (
          <button key={id} className={q === id ? 'on' : ''} onClick={() => setQ(id)}>
            {QUALITY_LABEL[id] ?? id}
          </button>
        ))}
      </div>
      <p className="muted small">{quality(q).label} – intervaly: {quality(q).intervals.map((i) => INTERVAL_NAMES[i] ?? i).join(', ')}</p>
      <div className="chord-grid">
        {ROOT_ORDER.map((root) => {
          const name = chordName({ root, quality: q });
          const v = getVoicings({ root, quality: q })[0] ?? null;
          const hits = stats[name]?.hits ?? 0;
          return (
            <a key={root} className="chord-tile" href={href(`/akordy/${encodeURIComponent(name)}`)}>
              <ChordDiagram voicing={v} name={label(name)} size={110} />
              <span className="tile-sub">{note(root)}</span>
              {hits > 0 && <span className="badge" title="Kolikrát jsi akord správně zahrál(a)">✔ {hits}</span>}
            </a>
          );
        })}
      </div>
    </div>
  );
}

function ChordDetail({ name }: { name: string }) {
  const label = useChordLabel();
  const note = useNoteLabel();
  const chord = parseChord(name)!;
  const voicings = getVoicings(chord);
  const [vi, setVi] = useState(0);
  const v = voicings[vi] ?? null;
  const mic = useLiveInput();
  const threshold = useStore((s) => s.settings.micThreshold);
  const [done, setDone] = useState(0);
  // Každé zahrání se počítá jednou – znovu až po odmlce.
  const [episode, setEpisode] = useState(0);
  const listen = useChordListener(mic.input, name, 0, () => {
    recordChordHit(name);
    setDone((d) => d + 1);
  }, episode);
  useEffect(() => {
    if (!listen.loud) setEpisode((e) => e + 1);
  }, [listen.loud]);
  const pcs = chordPitchClasses(chord);
  const q = quality(chord.quality);
  const midis = v ? voicingMidi(v) : [];

  return (
    <div className="page">
      <a href={href('/akordy')} className="back">
        ← Všechny akordy
      </a>
      <h1>
        {label(name)} <span className="muted">– {q.label}</span>
      </h1>
      <div className="detail-grid">
        <div className="card center">
          <ChordDiagram voicing={v} name={label(name)} size={200} />
          <div className="row gap wrap center">
            <button className="btn primary" onClick={() => v && strumChord(v)}>
              🔊 Úhoz
            </button>
            <button className="btn" onClick={() => v && arpeggiate(v)}>
              Struna po struně
            </button>
          </div>
          {voicings.length > 1 && (
            <div className="voicing-pick">
              <span className="muted small">Další polohy:</span>
              <div className="row gap wrap center">
                {voicings.map((x, i) => (
                  <button key={i} className={`mini-voicing ${i === vi ? 'on' : ''}`} onClick={() => setVi(i)}>
                    <ChordDiagram voicing={x} size={64} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="card">
          <Fretboard voicing={v} onPick={(s, f) => playNote(STANDARD_TUNING[s] + f)} />
          <table className="tones">
            <thead>
              <tr>
                <th>Struna</th>
                <th>Pražec</th>
                <th>Prst</th>
                <th>Tón</th>
                <th>Funkce</th>
              </tr>
            </thead>
            <tbody>
              {v &&
                [5, 4, 3, 2, 1, 0].map((s) => {
                  const m = midis[s];
                  const iv = m === null ? null : mod12(m - chord.root);
                  return (
                    <tr key={s} className={m === null ? 'muted' : ''}>
                      <td>{6 - s}.</td>
                      <td>{v.frets[s] < 0 ? '× nehraje' : v.frets[s] === 0 ? 'prázdná' : v.frets[s]}</td>
                      <td>{v.fingers[s] ? ['', 'ukazováček', 'prostředníček', 'prsteníček', 'malíček'][v.fingers[s]] : ''}</td>
                      <td>{m === null ? '' : note(m)}</td>
                      <td>{iv === null ? '' : INTERVAL_NAMES[iv] ?? ''}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          <p className="muted small">
            Tóny akordu: <b>{pcs.map(note).join(' – ')}</b>. {v?.barre && `Barré: ukazováček přitiskne ${v.barre.to - v.barre.from + 1} struny na ${v.barre.fret}. pražci.`}
          </p>
        </div>
        <div className="card">
          <h3>Zahraj ho – poslouchám</h3>
          <p className="muted small">Zapni mikrofon a zahraj akord. Aplikace pozná, jestli zní správně, a řekne ti, který tón chybí.</p>
          <MicButton state={mic.state} onStart={() => void mic.start()} onStop={mic.stop} />
          {mic.error && <p className="error">{mic.error}</p>}
          {mic.state === 'on' && (
            <>
              <LevelMeter level={listen.level} threshold={threshold} />
              <div className={`big-feedback ${listen.stable ? 'ok' : listen.loud && listen.check && !listen.check.correct ? 'bad' : ''}`}>
                {!listen.loud ? 'Zahraj akord…' : listen.stable ? '✔ Správně!' : listen.check?.correct ? 'Skoro…' : `Slyším spíš ${label(listen.candidates[0]?.name ?? '')}`}
              </div>
              {listen.loud && listen.check && !listen.check.correct && listen.check.missing.length > 0 && <p className="bad small">Chybí: {listen.check.missing.map(note).join(', ')}</p>}
              <ChromaBars chroma={listen.frame?.chroma ?? null} expected={pcs} missing={listen.loud ? listen.check?.missing : []} />
              {done > 0 && <p className="ok small">Tento akord jsi správně zahrál(a) {done}× v této relaci.</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
