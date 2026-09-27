import { useEffect, useRef, useState } from 'react';
import { ChordDiagram } from '../components/ChordDiagram';
import { ChromaBars, LevelMeter, MicButton, useChordLabel } from '../components/common';
import { useChordListener, useLiveInput } from '../hooks';
import { chordPitchClasses, getVoicing, parseChord } from '../music/chords';
import { useStore } from '../store';

/** Volný poslech: co právě hraji? Ukazuje rozpoznaný akord, jeho prstoklad a historii. */
export function ListenPage() {
  const label = useChordLabel();
  const mic = useLiveInput();
  const threshold = useStore((s) => s.settings.micThreshold);
  const listen = useChordListener(mic.input, null);
  const [history, setHistory] = useState<string[]>([]);
  const stableRef = useRef<{ name: string; count: number }>({ name: '', count: 0 });
  const [shown, setShown] = useState<string | null>(null);

  // Akord ukážeme, až je rozpoznaný stabilně několik snímků po sobě.
  useEffect(() => {
    const top = listen.loud ? listen.candidates[0] : undefined;
    const second = listen.candidates[1];
    if (!top || top.score < 0.72 || (second && top.score - second.score < 0.005)) return;
    const s = stableRef.current;
    if (s.name === top.name) s.count++;
    else stableRef.current = { name: top.name, count: 1 };
    if (stableRef.current.count === 3) {
      setShown(top.name);
      setHistory((h) => (h[h.length - 1] === top.name ? h : [...h, top.name].slice(-24)));
    }
  }, [listen]);

  const chord = shown ? parseChord(shown) : null;

  return (
    <div className="page">
      <h1>Poslech – co hraju?</h1>
      <p className="lead">Zahraj libovolný akord a aplikace ho pozná a ukáže prstoklad. Hodí se i k tomu, abys zjistil(a), co hraje někdo jiný.</p>
      <div className="row gap wrap">
        <MicButton state={mic.state} onStart={() => void mic.start()} onStop={mic.stop} />
        {mic.state === 'on' && <LevelMeter level={listen.level} threshold={threshold} />}
      </div>
      {mic.error && <p className="error">{mic.error}</p>}
      <div className="listen-grid">
        <div className="card center">
          <div className="now-label">Rozpoznaný akord</div>
          {shown ? <ChordDiagram voicing={getVoicing(shown)} name={label(shown)} size={200} /> : <div className="placeholder">{mic.state === 'on' ? 'Zahraj akord…' : 'Zapni mikrofon'}</div>}
          {listen.loud && listen.candidates.length > 0 && (
            <div className="candidates">
              {listen.candidates.slice(0, 4).map((c) => (
                <span key={c.name} className="cand">
                  {label(c.name)} <small>{Math.round(c.score * 100)}</small>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <h3>Tóny, které slyším</h3>
          <ChromaBars chroma={listen.frame?.chroma ?? null} expected={chord ? chordPitchClasses(chord) : []} />
          <h3>Historie</h3>
          <div className="history">
            {history.length === 0 && <span className="muted">Zatím nic.</span>}
            {history.map((h, i) => (
              <span key={i} className="chord-tag">
                {label(h)}
              </span>
            ))}
          </div>
          {history.length > 0 && (
            <button className="btn small" onClick={() => setHistory([])}>
              Vymazat
            </button>
          )}
          <p className="muted small">
            Tip: rozpoznávání funguje nejlépe v tichu a když necháš akord znít. Pokud reaguje na šum, zvyš práh citlivosti v Nastavení.
          </p>
        </div>
      </div>
    </div>
  );
}
