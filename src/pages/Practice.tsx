import { useEffect, useRef, useState } from 'react';
import { audioContext, click, playNote, strumChord } from '../audio/engine';
import { ChordDiagram } from '../components/ChordDiagram';
import { ChromaBars, LevelMeter, MicButton, Stepper, useChordLabel } from '../components/common';
import { Fretboard } from '../components/Fretboard';
import { useChordListener, useLiveInput, usePersistentState } from '../hooks';
import { chordPitchClasses, getVoicing, parseChord } from '../music/chords';
import { addPracticeMinutes, recordChanges, recordChordHit, useStore } from '../store';

export const CHORD_SETS: { id: string; name: string; chords: string[] }[] = [
  { id: 'first', name: 'První akordy', chords: ['Em', 'Am', 'E', 'A', 'D'] },
  { id: 'basic', name: 'Základní otevřené', chords: ['C', 'D', 'E', 'G', 'A', 'Am', 'Em', 'Dm'] },
  { id: 'sevenths', name: 'Septakordy', chords: ['A7', 'B7', 'C7', 'D7', 'E7', 'G7', 'Am7', 'Em7', 'Dm7'] },
  { id: 'barre', name: 'Barré', chords: ['F', 'Bm', 'B', 'F#m', 'Cm', 'Gm', 'Fm'] },
  { id: 'colors', name: 'Barevné akordy', chords: ['Cmaj7', 'Fmaj7', 'Dsus2', 'Dsus4', 'Asus2', 'Asus4', 'Cadd9', 'Esus4'] },
];

const CHANGE_PAIRS = [
  ['Em', 'Am'],
  ['A', 'D'],
  ['D', 'E'],
  ['C', 'G'],
  ['G', 'D'],
  ['Am', 'C'],
  ['C', 'F'],
  ['G', 'Em'],
  ['E', 'Am'],
  ['D', 'Am'],
  ['A', 'E'],
  ['Em', 'C'],
];

function success() {
  const t = audioContext().currentTime;
  playNote(76, t, 0.15, 0.3);
  playNote(83, t + 0.08, 0.15, 0.4);
}

export function PracticePage() {
  const [tab, setTab] = usePersistentState<'quiz' | 'changes' | 'metronome'>('practice-tab', 'quiz');
  return (
    <div className="page">
      <h1>Trénink</h1>
      <div className="tabs">
        <button className={tab === 'quiz' ? 'on' : ''} onClick={() => setTab('quiz')}>
          🎯 Zahraj akord
        </button>
        <button className={tab === 'changes' ? 'on' : ''} onClick={() => setTab('changes')}>
          ⏱ Minuta změn
        </button>
        <button className={tab === 'metronome' ? 'on' : ''} onClick={() => setTab('metronome')}>
          🥁 Metronom
        </button>
      </div>
      {tab === 'quiz' && <ChordQuiz />}
      {tab === 'changes' && <OneMinuteChanges />}
      {tab === 'metronome' && <Metronome />}
    </div>
  );
}

function ChordQuiz() {
  const label = useChordLabel();
  const stats = useStore((s) => s.progress.chords);
  const threshold = useStore((s) => s.settings.micThreshold);
  const [setId, setSetId] = usePersistentState('quiz-set', 'first');
  const [showShape, setShowShape] = usePersistentState('quiz-shape', true);
  const set = CHORD_SETS.find((s) => s.id === setId) ?? CHORD_SETS[0];
  const [current, setCurrent] = useState(() => set.chords[0]);
  const [round, setRound] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastMs, setLastMs] = useState<number | null>(null);
  const started = useRef(Date.now());
  const mic = useLiveInput();

  const nextChord = () => {
    const options = set.chords.filter((c) => c !== current);
    setCurrent(options[Math.floor(Math.random() * options.length)]);
    setRound((r) => r + 1);
    started.current = Date.now();
  };

  useEffect(() => {
    setCurrent(set.chords[Math.floor(Math.random() * set.chords.length)]);
    started.current = Date.now();
  }, [setId]);

  const listen = useChordListener(
    mic.input,
    current,
    0,
    () => {
      const ms = Date.now() - started.current;
      recordChordHit(current, ms);
      setLastMs(ms);
      setStreak((s) => s + 1);
      success();
      setTimeout(nextChord, 600);
    },
    round,
  );

  const v = getVoicing(current);
  const chord = parseChord(current);
  return (
    <div className="quiz">
      <div className="row gap wrap">
        <select value={setId} onChange={(e) => setSetId(e.target.value)}>
          {CHORD_SETS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <label className="toggle-line">
          <input type="checkbox" checked={showShape} onChange={(e) => setShowShape(e.target.checked)} /> Ukazovat prstoklad (vypni pro test paměti)
        </label>
      </div>
      <div className="quiz-grid">
        <div className="card center">
          <div className="quiz-name">{label(current)}</div>
          {showShape ? <ChordDiagram voicing={v} size={180} /> : <div className="placeholder">Zahraj {label(current)} zpaměti</div>}
          <div className="row gap center wrap">
            <button className="btn" onClick={() => v && strumChord(v)}>
              🔊 Poslechnout
            </button>
            <button className="btn" onClick={nextChord}>
              Další ⏭
            </button>
          </div>
        </div>
        <div className="card">
          <MicButton state={mic.state} onStart={() => void mic.start()} onStop={mic.stop} />
          {mic.error && <p className="error">{mic.error}</p>}
          {mic.state === 'on' ? (
            <>
              <LevelMeter level={listen.level} threshold={threshold} />
              <div className={`big-feedback ${listen.stable ? 'ok' : listen.loud && !listen.check?.correct ? 'bad' : ''}`}>
                {listen.stable ? '✔ Výborně!' : listen.loud ? (listen.check?.correct ? 'Drž…' : `Slyším ${label(listen.candidates[0]?.name ?? '')}`) : 'Zahraj akord'}
              </div>
              <ChromaBars chroma={listen.frame?.chroma ?? null} expected={chord ? chordPitchClasses(chord) : []} missing={listen.loud ? listen.check?.missing : []} />
            </>
          ) : (
            <p className="muted">S mikrofonem aplikace sama pozná, že jsi akord zahrál(a) správně, a změří, jak rychle ho umíš chytit.</p>
          )}
          <div className="stats">
            <div>
              <span className="stat-label">Série</span>
              <b>{streak}</b>
            </div>
            <div>
              <span className="stat-label">Poslední čas</span>
              <b>{lastMs ? (lastMs / 1000).toFixed(1) + ' s' : '—'}</b>
            </div>
            <div>
              <span className="stat-label">Rekord pro {label(current)}</span>
              <b>{stats[current]?.bestMs ? (stats[current].bestMs! / 1000).toFixed(1) + ' s' : '—'}</b>
            </div>
          </div>
        </div>
      </div>
      {showShape && (
        <div className="card">
          <Fretboard voicing={v} />
        </div>
      )}
    </div>
  );
}

function OneMinuteChanges() {
  const label = useChordLabel();
  const best = useStore((s) => s.progress.changes);
  const threshold = useStore((s) => s.settings.micThreshold);
  const [pairIdx, setPairIdx] = usePersistentState('changes-pair', 0);
  const [a, b] = CHANGE_PAIRS[pairIdx] ?? CHANGE_PAIRS[0];
  const key = `${a}-${b}`;
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(60);
  const [count, setCount] = useState(0);
  const [expectA, setExpectA] = useState(false);
  const [result, setResult] = useState<{ count: number; record: boolean } | null>(null);
  const mic = useLiveInput();
  const countRef = useRef(0);
  countRef.current = count;

  useEffect(() => {
    if (!running) return;
    const end = Date.now() + 60000;
    const id = setInterval(() => {
      const l = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setLeft(l);
      if (l === 0) {
        clearInterval(id);
        setRunning(false);
        const record = recordChanges(key, countRef.current);
        addPracticeMinutes(1);
        setResult({ count: countRef.current, record });
        click(audioContext().currentTime, true, 0.8);
      }
    }, 200);
    return () => clearInterval(id);
  }, [running, key]);

  const expected = running ? (expectA ? a : b) : null;
  const listen = useChordListener(
    mic.input,
    expected,
    0,
    () => {
      setCount((c) => c + 1);
      setExpectA((x) => !x);
    },
    count,
  );

  const start = () => {
    setCount(0);
    setLeft(60);
    setExpectA(false);
    setResult(null);
    setRunning(true);
  };

  return (
    <div>
      <p className="lead">
        Metoda „one minute changes“: minutu střídej dva akordy tak rychle, jak to jde (čistě!). Každý den jeden pár – rychlost přechodů roste nejvíc ze všech cvičení.
      </p>
      <div className="row gap wrap">
        <select value={pairIdx} onChange={(e) => setPairIdx(Number(e.target.value))} disabled={running}>
          {CHANGE_PAIRS.map(([x, y], i) => (
            <option key={i} value={i}>
              {label(x)} ↔ {label(y)} {best[`${x}-${y}`] ? `(rekord ${best[`${x}-${y}`]})` : ''}
            </option>
          ))}
        </select>
        <MicButton state={mic.state} onStart={() => void mic.start()} onStop={mic.stop} labelOff="Počítat mikrofonem" />
        {mic.state === 'on' && <LevelMeter level={listen.level} threshold={threshold} />}
      </div>
      <div className="changes-grid">
        <div className={`card center ${running && !expectA ? 'target' : ''}`}>
          <ChordDiagram voicing={getVoicing(a)} name={label(a)} size={150} />
        </div>
        <div className="card center changes-center">
          <div className="timer">{left}s</div>
          <div className="count">{count}</div>
          <div className="muted small">změn</div>
          {!running ? (
            <button className="btn primary big" onClick={start}>
              Start
            </button>
          ) : (
            <button className="btn big" onClick={() => setCount((c) => c + 1)}>
              +1
            </button>
          )}
          {running && mic.state === 'on' && <div className="muted small">Teď: {label(expected ?? '')}</div>}
          {result && <div className={result.record ? 'ok' : ''}>{result.record ? `🏆 Nový rekord: ${result.count}!` : `Výsledek ${result.count} (rekord ${best[key] ?? 0})`}</div>}
        </div>
        <div className={`card center ${running && expectA ? 'target' : ''}`}>
          <ChordDiagram voicing={getVoicing(b)} name={label(b)} size={150} />
        </div>
      </div>
      <p className="muted small">Bez mikrofonu klikej na +1 (nebo ať počítá kamarád). Cíl: 30+ změn za minutu u základních akordů, 60 = plynulá hra.</p>
    </div>
  );
}

function Metronome() {
  const [bpm, setBpm] = usePersistentState('metro-bpm', 80);
  const [beats, setBeats] = usePersistentState('metro-beats', 4);
  const [trainer, setTrainer] = usePersistentState('metro-trainer', false);
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(-1);
  const [curBpm, setCurBpm] = useState(bpm);
  const taps = useRef<number[]>([]);

  useEffect(() => {
    if (!running) return;
    const c = audioContext();
    let next = c.currentTime + 0.1;
    let n = 0;
    let tempo = bpm;
    const queue: { t: number; n: number }[] = [];
    const id = setInterval(() => {
      while (next < c.currentTime + 0.12) {
        click(next, n % beats === 0);
        queue.push({ t: next, n });
        n++;
        // Trenér tempa: každé 4 takty +2 BPM.
        if (trainer && n % (beats * 4) === 0) {
          tempo = Math.min(240, tempo + 2);
          setCurBpm(tempo);
        }
        next += 60 / tempo;
      }
      while (queue.length && queue[0].t <= c.currentTime) {
        setBeat(queue.shift()!.n % beats);
      }
    }, 20);
    setCurBpm(bpm);
    return () => clearInterval(id);
  }, [running, bpm, beats, trainer]);

  const tap = () => {
    const now = performance.now();
    taps.current = [...taps.current.filter((t) => now - t < 3000), now];
    if (taps.current.length >= 2) {
      const d = taps.current.slice(1).map((t, i) => t - taps.current[i]);
      setBpm(Math.round(60000 / (d.reduce((x, y) => x + y, 0) / d.length)));
    }
  };

  return (
    <div className="card center metronome">
      <div className="metro-bpm">{running ? curBpm : bpm}</div>
      <div className="muted">BPM</div>
      <input type="range" min={30} max={220} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} />
      <div className="beats">
        {Array.from({ length: beats }, (_, i) => (
          <span key={i} className={`beat-dot ${beat === i && running ? 'on' : ''} ${i === 0 ? 'first' : ''}`} />
        ))}
      </div>
      <div className="row gap wrap center">
        <button className="btn primary big" onClick={() => setRunning(!running)}>
          {running ? '■ Stop' : '▶ Start'}
        </button>
        <button className="btn big" onClick={tap}>
          Ťukni tempo
        </button>
      </div>
      <div className="row gap wrap center">
        <span className="ctl-label">Dob v taktu</span>
        <Stepper value={beats} min={2} max={7} onChange={setBeats} />
        <label className="toggle-line">
          <input type="checkbox" checked={trainer} onChange={(e) => setTrainer(e.target.checked)} /> Trenér tempa (+2 BPM každé 4 takty)
        </label>
      </div>
    </div>
  );
}
