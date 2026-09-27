import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { audioContext, playStrings, strumChord } from '../audio/engine';
import { eventIndexAt, SongScheduler } from '../audio/scheduler';
import { ChordDiagram } from '../components/ChordDiagram';
import { ChordChip, ChromaBars, LevelMeter, MicButton, Stepper, Toggle, useChordLabel, useNoteLabel } from '../components/common';
import { Fretboard } from '../components/Fretboard';
import { PatternView } from '../components/PatternView';
import { useChordListener, useLiveInput, usePersistentState } from '../hooks';
import { chordPitchClasses, getVoicing, parseChord, transposeName } from '../music/chords';
import { mod12 } from '../music/notes';
import { defaultPatternFor, patternById, patternFingers, PATTERNS, RIGHT_FINGER_NAMES, stepStrings, type RightFinger } from '../music/patterns';
import { songChords, songEvents, type Song } from '../music/song';
import { href, navigate } from '../router';
import { useSong } from '../songs';
import { addPracticeMinutes, recordChordHit, recordSongPlay, saveSong, useStore } from '../store';

type Mode = 'play' | 'wait' | 'score';

export function SongPlayerPage({ id }: { id: string }) {
  const song = useSong(id);
  if (!song) {
    return (
      <div className="page">
        <p>Píseň nenalezena.</p>
        <a className="btn" href={href('/pisne')}>
          Zpět na písně
        </a>
      </div>
    );
  }
  return <SongPlayer key={song.id + song.source} song={song} />;
}

function SongPlayer({ song }: { song: Song }) {
  const label = useChordLabel();
  const note = useNoteLabel();
  const threshold = useStore((s) => s.settings.micThreshold);
  const events = useMemo(() => songEvents(song), [song]);
  const totalBeats = events.length ? events[events.length - 1].startBeat + events[events.length - 1].beats : 0;

  const [transpose, setTranspose] = useState(0);
  const [capo, setCapo] = useState(song.capo);
  const [tempoPct, setTempoPct] = usePersistentState(`tempo:${song.id}`, 100);
  const [patternId, setPatternId] = usePersistentState(`pattern:${song.id}`, song.patternId ?? defaultPatternFor(song.beatsPerBar).id);
  const [accompaniment, setAccompaniment] = usePersistentState('accompaniment', true);
  const [metronome, setMetronome] = usePersistentState('metronome', true);
  const [mode, setMode] = useState<Mode>('play');
  const [loopSection, setLoopSection] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(-1); // pozice v dobách
  const [waitIndex, setWaitIndex] = useState(0);
  const [scores, setScores] = useState<Record<number, { ok: number; total: number }>>({});
  const [finished, setFinished] = useState<number | null>(null);

  const pattern = patternById(patternId) ?? defaultPatternFor(song.beatsPerBar);
  const bpm = Math.round((song.bpm * tempoPct) / 100);
  const shift = transpose + song.capo - capo;
  const shape = useCallback((c: string) => transposeName(c, shift), [shift]);

  const mic = useLiveInput();
  const sched = useRef<SongScheduler | null>(null);
  const scoresRef = useRef(scores);
  scoresRef.current = scores;
  const startedAt = useRef<number | null>(null);

  const loop = useMemo(() => {
    if (loopSection === null) return null;
    const evs = events.filter((e) => e.section === loopSection);
    if (!evs.length) return null;
    return { start: evs[0].startBeat, end: evs[evs.length - 1].startBeat + evs[evs.length - 1].beats };
  }, [loopSection, events]);

  // Aktuální akord
  const currentIndex = mode === 'wait' ? waitIndex : pos >= 0 ? eventIndexAt(events, pos) : playing ? 0 : -1;
  const current = events[currentIndex] ?? events[0];
  const next = events[(currentIndex < 0 ? 0 : currentIndex) + 1];
  const curShape = current ? shape(current.chord) : null;
  const curVoicing = curShape ? getVoicing(curShape) : null;
  const curChord = curShape ? parseChord(curShape) : null;
  const beatInBar = pos >= 0 ? ((pos % song.beatsPerBar) + song.beatsPerBar) % song.beatsPerBar : -1;
  const [demoStep, setDemoStep] = useState(-1);
  const stepIndex = playing && pos >= 0 ? Math.floor(beatInBar * pattern.stepsPerBeat) % pattern.steps.length : demoStep;
  // Počítadlo kroků pro restart animace drnknutí.
  const stepCounter = playing && pos >= 0 ? Math.floor(pos * pattern.stepsPerBeat) : demoStep;
  const activeStrings = stepIndex >= 0 && curVoicing && curChord ? stepStrings(pattern.steps[stepIndex], curVoicing, curChord) : [];

  const rightFingers = useMemo(
    () => (pattern.type === 'pick' && curVoicing && curChord ? patternFingers(pattern, curVoicing, curChord) : undefined),
    [pattern, curVoicing, curChord],
  );

  // Předvedení vzoru na aktuálním akordu: dvakrát pomalu projde celý takt se zvukem.
  const demoTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopDemo = useCallback(() => {
    if (demoTimer.current) clearInterval(demoTimer.current);
    demoTimer.current = null;
    setDemoStep(-1);
  }, []);
  const startDemo = () => {
    if (!curVoicing || !curChord) return;
    stopDemo();
    audioContext();
    const stepMs = (60000 / Math.min(bpm, 90)) / pattern.stepsPerBeat * 1.4;
    let i = 0;
    const total = pattern.steps.length * 2;
    const tick = () => {
      if (i >= total) return stopDemo();
      const k = i % pattern.steps.length;
      const st = pattern.steps[k];
      if (st.kind !== 'rest') playStrings(curVoicing, stepStrings(st, curVoicing, curChord), { capo, spread: st.kind === 'pick' ? 0 : 0.02, gain: 0.3, mute: st.kind === 'chuck' });
      setDemoStep(k);
      i++;
    };
    tick();
    demoTimer.current = setInterval(tick, stepMs);
  };
  useEffect(() => stopDemo, [stopDemo]);

  // Pořadí drnkání strun (pro vzory s prsty).
  const order = useMemo(() => {
    const m = new Map<number, number[]>();
    if (pattern.type !== 'pick' || !curVoicing || !curChord) return m;
    let n = 0;
    pattern.steps.forEach((st) => {
      if (st.kind === 'rest') return;
      n++;
      for (const s of stepStrings(st, curVoicing, curChord)) m.set(s, [...(m.get(s) ?? []), n]);
    });
    return m;
  }, [pattern, curVoicing, curChord]);

  // Konfigurace plánovače
  const cfg = useMemo(
    () => ({ events, totalBeats, bpm, beatsPerBar: song.beatsPerBar, pattern, shape, capo, accompaniment, metronome, loop }),
    [events, totalBeats, bpm, song.beatsPerBar, pattern, shape, capo, accompaniment, metronome, loop],
  );
  useEffect(() => {
    sched.current?.update(cfg);
  }, [cfg]);

  const stop = useCallback(() => {
    sched.current?.stop();
    setPlaying(false);
    if (startedAt.current) {
      addPracticeMinutes((Date.now() - startedAt.current) / 60000);
      startedAt.current = null;
    }
  }, []);

  const play = useCallback(
    (fromBeat?: number) => {
      sched.current?.stop();
      stopDemo();
      const s = new SongScheduler(cfg);
      s.onEnd = () => {
        stop();
        setPos(-1);
        const vals = Object.values(scoresRef.current);
        const score = vals.length ? Math.round((100 * vals.reduce((a, v) => a + v.ok / Math.max(1, v.total), 0)) / vals.length) : undefined;
        recordSongPlay(song.id, mode === 'score' ? score : undefined);
        setFinished(mode === 'score' && score !== undefined ? score : -1);
      };
      sched.current = s;
      const start = fromBeat ?? (pos >= 0 && pos < totalBeats ? Math.floor(pos) : loop?.start ?? 0);
      s.start(start, 1);
      startedAt.current ??= Date.now();
      setFinished(null);
      if (fromBeat === undefined && start === 0) setScores({});
      setPlaying(true);
    },
    [cfg, pos, totalBeats, loop, stop, stopDemo, song.id, mode],
  );

  useEffect(() => () => sched.current?.stop(), []);

  // Animace pozice
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const loopFn = () => {
      const p = sched.current?.position() ?? 0;
      setPos(p);
      raf = requestAnimationFrame(loopFn);
    };
    raf = requestAnimationFrame(loopFn);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // Poslech: v režimu „čekání“ se po správném akordu posune dál.
  const expected = mode === 'wait' || (mode === 'score' && playing && pos >= 0) ? curShape : null;
  const waitStart = useRef(Date.now());
  const listen = useChordListener(
    mic.input,
    expected,
    capo,
    () => {
      if (mode !== 'wait' || !curShape) return;
      recordChordHit(curShape, Date.now() - waitStart.current);
      setTimeout(() => {
        setWaitIndex((i) => {
          if (i + 1 >= events.length) {
            recordSongPlay(song.id);
            setFinished(-1);
            return 0;
          }
          return i + 1;
        });
        waitStart.current = Date.now();
      }, 250);
    },
    waitIndex,
  );

  // Hodnocení: sběr vzorků pro aktuální akord (první doba je na přechod).
  useEffect(() => {
    if (mode !== 'score' || !playing || !mic.input || !listen.check || currentIndex < 0) return;
    const ev = events[currentIndex];
    if (pos - ev.startBeat < Math.min(1, ev.beats / 2)) return;
    setScores((s) => {
      const prev = s[currentIndex] ?? { ok: 0, total: 0 };
      return { ...s, [currentIndex]: { ok: prev.ok + (listen.check!.correct ? 1 : 0), total: prev.total + 1 } };
    });
  }, [listen.check]);

  // Klávesové zkratky: mezerník = play/pauza, šipky = akordy v režimu čekání.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (mode === 'wait') return;
        if (playing) stop();
        else play();
      } else if (e.code === 'ArrowRight' && mode === 'wait') setWaitIndex((i) => Math.min(events.length - 1, i + 1));
      else if (e.code === 'ArrowLeft' && mode === 'wait') setWaitIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playing, play, stop, mode, events.length]);

  const seek = (idx: number) => {
    const ev = events[idx];
    if (!ev) return;
    if (mode === 'wait') {
      setWaitIndex(idx);
      waitStart.current = Date.now();
      return;
    }
    setPos(ev.startBeat);
    if (playing) play(ev.startBeat);
    else {
      const v = getVoicing(shape(ev.chord));
      if (v) strumChord(v, { capo });
    }
  };

  const changeMode = (m: Mode) => {
    stop();
    setPos(-1);
    setMode(m);
    setScores({});
    setFinished(null);
    setWaitIndex(0);
    waitStart.current = Date.now();
    if (m === 'score') setAccompaniment(false);
    if (m !== 'play' && mic.state !== 'on') void mic.start();
  };

  const chords = useMemo(() => songChords(song).map(shape), [song, shape]);
  const expectedPcs = curChord ? chordPitchClasses(curChord).map((pc) => mod12(pc + capo)) : [];
  const soundingKey = song.key ? transposeName(song.key, transpose) : null;
  const fits = PATTERNS.filter((p) => p.beatsPerBar === song.beatsPerBar);

  // Mapování událostí na segmenty textu pro zvýraznění.
  const eventBySeg = useMemo(() => {
    const m = new Map<string, number>();
    events.forEach((e, i) => m.set(`${e.section}:${e.line}:${e.segment}`, i));
    return m;
  }, [events]);

  const scoreClass = (i: number) => {
    const s = scores[i];
    if (!s || s.total < 2) return '';
    const r = s.ok / s.total;
    return r > 0.6 ? 'score-good' : r > 0.3 ? 'score-mid' : 'score-bad';
  };

  return (
    <div className="page player">
      <header className="player-head">
        <div>
          <a href={href('/pisne')} className="back">
            ← Písně
          </a>
          <h1>{song.title}</h1>
          <div className="meta">
            {song.artist && <span>{song.artist}</span>}
            {soundingKey && <span>Tónina {label(soundingKey)}</span>}
            <span>
              {song.beatsPerBar}/{song.beatsPerBar === 6 ? 8 : 4}
            </span>
            <span>{bpm} BPM</span>
            {capo > 0 && <span className="pill">Kapodastr {capo}. pražec</span>}
          </div>
        </div>
        {!song.builtin ? (
          <a className="btn ghost" href={href(`/editor/${song.id}`)}>
            Upravit
          </a>
        ) : (
          <button
            className="btn ghost"
            title="Vytvoří vlastní kopii, do které si můžeš dopsat text nebo změnit akordy"
            onClick={() => {
              const id = `${song.id}-${Date.now().toString(36).slice(-4)}`;
              saveSong(id, song.source);
              navigate(`/editor/${id}`);
            }}
          >
            Upravit kopii
          </button>
        )}
      </header>

      <div className="mode-tabs" role="tablist">
        <button className={mode === 'play' ? 'on' : ''} onClick={() => changeMode('play')}>
          ▶ Přehrávání
          <small>tempo, doprovod</small>
        </button>
        <button className={mode === 'wait' ? 'on' : ''} onClick={() => changeMode('wait')}>
          🎤 Krok za krokem
          <small>počká, až akord zahraješ</small>
        </button>
        <button className={mode === 'score' ? 'on' : ''} onClick={() => changeMode('score')}>
          🎯 Hodnocení
          <small>hraješ do tempa, aplikace poslouchá</small>
        </button>
      </div>

      {mode !== 'play' && (
        <div className="mic-bar card">
          <MicButton state={mic.state} onStart={() => void mic.start()} onStop={mic.stop} />
          {mic.state === 'on' && <LevelMeter level={listen.level} threshold={threshold} />}
          {mic.error && <span className="error">{mic.error}</span>}
          {mic.state === 'on' && listen.loud && listen.candidates[0] && (
            <span className="heard">
              Slyším: <b>{label(transposeName(listen.candidates[0].name, -capo))}</b>
            </span>
          )}
          {mode === 'score' && accompaniment && <span className="hint">Tip: s doprovodem použijte sluchátka, jinak mikrofon slyší i aplikaci.</span>}
        </div>
      )}

      <section className="stage">
        <div className="now-card">
          <div className="now-label">{mode === 'wait' ? `Akord ${waitIndex + 1} / ${events.length}` : 'Teď'}</div>
          {curShape && (
            <div className={`now-chord ${mode !== 'play' && listen.stable ? 'correct' : ''} ${mode !== 'play' && listen.loud && listen.check && !listen.check.correct ? 'wrong' : ''}`}>
              <ChordDiagram voicing={curVoicing} name={label(curShape)} size={170} active={activeStrings} />
            </div>
          )}
          {mode !== 'play' && mic.state === 'on' && (
            <div className="feedback">
              {!listen.loud && <span className="muted">Zahraj {curShape && label(curShape)}…</span>}
              {listen.loud && listen.check?.correct && <span className="ok">✔ Správně!</span>}
              {listen.loud && listen.check && !listen.check.correct && (
                <span className="bad">
                  {listen.check.missing.length > 0
                    ? `Chybí tón ${listen.check.missing.map(note).join(', ')} – zkontroluj, jestli všechny struny znějí.`
                    : listen.check.extra.length > 0
                      ? `Navíc zní ${listen.check.extra.map(note).join(', ')} – nehraje se struna, která má být tlumená?`
                      : 'Ještě to není ono…'}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="next-card">
          <div className="now-label">Další</div>
          {next ? <ChordDiagram voicing={getVoicing(shape(next.chord))} name={label(shape(next.chord))} size={100} /> : <div className="muted">konec</div>}
          {mode === 'wait' && (
            <div className="row gap">
              <button className="btn small" onClick={() => seek(Math.max(0, waitIndex - 1))}>
                ←
              </button>
              <button className="btn small" onClick={() => seek(Math.min(events.length - 1, waitIndex + 1))}>
                →
              </button>
            </div>
          )}
        </div>
        <div className="board-card">
          <Fretboard voicing={curVoicing} capo={capo} active={activeStrings} order={order} rightFingers={rightFingers} pulseKey={stepIndex >= 0 ? stepCounter : undefined} />
          <div className="row between wrap gap board-tools">
            {rightFingers && rightFingers.size > 0 ? (
              <div className="rf-legend">
                Pravá ruka:{' '}
                {(['p', 'i', 'm', 'a'] as RightFinger[]).map((f) => (
                  <span key={f} className={`rf-chip f-${f}`}>
                    <b>{f}</b> {RIGHT_FINGER_NAMES[f]}
                  </span>
                ))}
                <span className="muted small"> · čísla u strun = pořadí drnknutí</span>
              </div>
            ) : (
              <span className="muted small">↓ úhoz dolů (od basů), ↑ úhoz nahoru. Zvýrazněné struny právě znějí.</span>
            )}
            {!playing && (
              <button className="btn small" onClick={() => (demoStep >= 0 ? stopDemo() : startDemo())}>
                {demoStep >= 0 ? '■ Stop' : pattern.type === 'pick' ? '▶ Předvést vybrnkávání' : '▶ Předvést rytmus'}
              </button>
            )}
          </div>
          <PatternView pattern={pattern} current={stepIndex} voicing={curVoicing} chord={curChord} />
          {mode !== 'play' && mic.state === 'on' && <ChromaBars chroma={listen.frame?.chroma ?? null} expected={expectedPcs} missing={listen.loud ? listen.check?.missing : []} />}
        </div>
      </section>

      {finished !== null && (
        <div className="card finished">
          {finished >= 0 ? (
            <>
              <h3>Hotovo! Skóre {finished} %</h3>
              <p>{finished > 80 ? 'Výborně, tahle píseň ti jde. Zkus zvýšit tempo.' : finished > 50 ? 'Dobrý základ. Zopakuj si místa označená červeně.' : 'Zpomal tempo a zkus to znovu – přesnost je důležitější než rychlost.'}</p>
            </>
          ) : (
            <h3>Hotovo! 🎉 Píseň je dohraná.</h3>
          )}
        </div>
      )}

      <section className="controls card">
        {mode !== 'wait' && (
          <div className="control-group">
            <button className="btn primary big" onClick={() => (playing ? stop() : play())}>
              {playing ? '⏸ Pauza' : '▶ Hrát'}
            </button>
            <button
              className="btn"
              onClick={() => {
                stop();
                setPos(-1);
              }}
            >
              ⏮ Od začátku
            </button>
          </div>
        )}
        <div className="control-group">
          <label>
            Tempo {tempoPct} % ({bpm} BPM)
            <input type="range" min={40} max={130} step={5} value={tempoPct} onChange={(e) => setTempoPct(Number(e.target.value))} />
          </label>
        </div>
        <div className="control-group">
          <label>
            Rytmus / rozklad
            <select value={pattern.id} onChange={(e) => setPatternId(e.target.value)}>
              {fits.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.type === 'pick' ? '🖐 ' : '↕ '}
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="control-group">
          <span className="ctl-label">Transpozice</span>
          <Stepper value={transpose} min={-6} max={6} onChange={setTranspose} format={(v) => (v > 0 ? `+${v}` : String(v))} />
        </div>
        <div className="control-group">
          <span className="ctl-label">Kapodastr</span>
          <Stepper value={capo} min={0} max={9} onChange={setCapo} format={(v) => (v ? `${v}.` : 'bez')} />
        </div>
        <div className="control-group">
          <Toggle checked={accompaniment} onChange={setAccompaniment}>
            Doprovod kytary
          </Toggle>
          <Toggle checked={metronome} onChange={setMetronome}>
            Metronom
          </Toggle>
        </div>
        <div className="control-group">
          <label>
            Opakovat část
            <select value={loopSection ?? ''} onChange={(e) => setLoopSection(e.target.value === '' ? null : Number(e.target.value))}>
              <option value="">celou píseň</option>
              {song.sections.map((s, i) => (
                <option key={i} value={i}>
                  {s.label || `Část ${i + 1}`}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="pattern-desc">{pattern.description}</p>
      </section>

      <section className="card">
        <h3>Akordy v písni</h3>
        <div className="chip-row">
          {chords.map((c) => (
            <ChordChip key={c} name={c} capo={capo} size={80} active={c === curShape} />
          ))}
        </div>
        {song.notes && <p className="notes">💡 {song.notes}</p>}
      </section>

      <section className="sheet card">
        {song.sections.map((sec, si) => (
          <div key={si} className={`sheet-section ${sec.kind} ${loopSection === si ? 'looped' : ''}`}>
            {sec.label && <div className="section-label">{sec.label}</div>}
            {sec.lines.map((ln, li) => (
              <div key={li} className={`sheet-line ${ln.bars ? 'bars' : ''}`}>
                {ln.segments.map((seg, gi) => {
                  const ei = eventBySeg.get(`${si}:${li}:${gi}`);
                  const isCur = ei !== undefined && ei === currentIndex && (playing || mode === 'wait' || pos >= 0);
                  return (
                    <span key={gi} className={`seg ${isCur ? 'current' : ''} ${ei !== undefined ? scoreClass(ei) : ''}`}>
                      <span className="seg-chord" onClick={() => ei !== undefined && seek(ei)}>
                        {seg.chord ? label(shape(seg.chord)) : ' '}
                        {seg.chord && seg.beats && !ln.bars && seg.beats !== song.beatsPerBar ? <sub>{seg.beats}</sub> : null}
                      </span>
                      <span className="seg-text">{ln.bars ? '' : seg.text || ' '}</span>
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </section>
      <p className="muted small">
        Zkratky: mezerník = přehrát/pauza. Kliknutím na akord v textu skočíš na dané místo.{' '}
        <button className="linkish" onClick={() => navigate('/trenink')}>
          Procvičit přechody akordů →
        </button>
      </p>
    </div>
  );
}
