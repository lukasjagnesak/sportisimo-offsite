import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { analysisToChordPro, type AnalysisResult } from '../audio/analyze';
import { analyzeInWorker, decodeToAnalysisRate, getMicrophone, getTabAudio, LiveInput } from '../audio/engine';
import { ChordDiagram } from '../components/ChordDiagram';
import { ChordChip, Stepper, useChordLabel } from '../components/common';
import { Fretboard } from '../components/Fretboard';
import { useChordListener } from '../hooks';
import { getVoicing, transposeName } from '../music/chords';
import { navigate } from '../router';
import { saveSong } from '../store';
import { slugify } from '../music/song';
import { loadYouTubeApi, youtubeId, type YTPlayer } from '../youtube';

type Source = { kind: 'file'; url: string; name: string } | { kind: 'youtube'; id: string; offset: number } | { kind: 'recording'; url: string };

// Poslední výsledek držíme v paměti, aby přežil přechod mezi stránkami.
let lastSession: { result: AnalysisResult; source: Source; title: string } | null = null;

export function RecognizePage() {
  const [tab, setTab] = useState<'file' | 'youtube' | 'record'>('youtube');
  const [result, setResult] = useState<AnalysisResult | null>(lastSession?.result ?? null);
  const [source, setSource] = useState<Source | null>(lastSession?.source ?? null);
  const [title, setTitle] = useState(lastSession?.title ?? '');
  const [progress, setProgress] = useState<{ f: number; stage: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sevenths, setSevenths] = useState(false);

  const runAnalysis = useCallback(
    async (data: ArrayBuffer, src: Source, name: string) => {
      setError(null);
      setResult(null);
      setProgress({ f: 0, stage: 'Dekóduji zvuk' });
      try {
        const { signal } = await decodeToAnalysisRate(data);
        if (signal.length < 11025 * 5) throw new Error('Nahrávka je příliš krátká (potřebuji aspoň 5 sekund).');
        const r = await analyzeInWorker(signal, { sevenths }, (f, stage) => setProgress({ f, stage }));
        setResult(r);
        setSource(src);
        setTitle(name);
        lastSession = { result: r, source: src, title: name };
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setProgress(null);
      }
    },
    [sevenths],
  );

  return (
    <div className="page">
      <h1>Rozpoznat akordy z nahrávky</h1>
      <p className="lead">Aplikace si píseň poslechne, najde tempo, tóninu a akordy a pak ti ukáže, jak ji hrát – synchronně s hudbou.</p>
      <div className="tabs">
        <button className={tab === 'youtube' ? 'on' : ''} onClick={() => setTab('youtube')}>
          ▶ YouTube
        </button>
        <button className={tab === 'file' ? 'on' : ''} onClick={() => setTab('file')}>
          📁 Soubor
        </button>
        <button className={tab === 'record' ? 'on' : ''} onClick={() => setTab('record')}>
          🎤 Nahrát mikrofonem
        </button>
      </div>
      <label className="toggle-line">
        <input type="checkbox" checked={sevenths} onChange={(e) => setSevenths(e.target.checked)} /> Rozpoznávat i septakordy (7, m7)
      </label>

      {tab === 'file' && <FileInput onFile={(buf, f) => void runAnalysis(buf, { kind: 'file', url: URL.createObjectURL(new Blob([buf], { type: f.type })), name: f.name }, f.name.replace(/\.[^.]+$/, ''))} />}
      {tab === 'youtube' && <YouTubeCapture onRecorded={(buf, id, offset) => void runAnalysis(buf, { kind: 'youtube', id, offset }, 'Píseň z YouTube')} activeSource={source?.kind === 'youtube' ? source : null} />}
      {tab === 'record' && <Recorder getStream={getMicrophone} label="Nahrát z mikrofonu" onRecorded={(buf, url) => void runAnalysis(buf, { kind: 'recording', url }, 'Nahrávka')} />}

      {progress && (
        <div className="card">
          <div className="progress">
            <div className="progress-bar" style={{ width: `${Math.round(progress.f * 100)}%` }} />
          </div>
          <p className="muted">{progress.stage}…</p>
        </div>
      )}
      {error && <p className="error">{error}</p>}
      {result && source && <AnalysisView key={JSON.stringify(source)} result={result} source={source} title={title} onTitle={setTitle} />}
    </div>
  );
}

function FileInput({ onFile }: { onFile: (buf: ArrayBuffer, f: File) => void }) {
  const [drag, setDrag] = useState(false);
  const handle = async (f: File | undefined) => {
    if (f) onFile(await f.arrayBuffer(), f);
  };
  return (
    <div
      className={`card dropzone ${drag ? 'drag' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        void handle(e.dataTransfer.files[0]);
      }}
    >
      <p>Přetáhni sem MP3, WAV, M4A, OGG nebo i video (MP4) – nebo</p>
      <label className="btn primary">
        Vybrat soubor
        <input type="file" accept="audio/*,video/*" hidden onChange={(e) => void handle(e.target.files?.[0])} />
      </label>
      <p className="muted small">Soubor se zpracuje jen ve tvém prohlížeči, nikam se neodesílá.</p>
    </div>
  );
}

/** Nahrávání z libovolného streamu (mikrofon / karta) do bufferu. */
function Recorder({ getStream, label, onRecorded, onStart, onStop, autoStopRef }: { getStream: () => Promise<MediaStream>; label: string; onRecorded: (buf: ArrayBuffer, url: string) => void; onStart?: () => void; onStop?: () => void; autoStopRef?: { current: (() => void) | null } }) {
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [live, setLive] = useState<LiveInput | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const label2 = useChordLabel();
  const listen = useChordListener(live, null);

  const stop = useCallback(() => {
    if (rec && rec.state !== 'inactive') rec.stop();
  }, [rec]);
  useEffect(() => {
    if (autoStopRef) autoStopRef.current = stop;
  }, [autoStopRef, stop]);

  useEffect(() => {
    if (!rec) return;
    const t0 = Date.now();
    const id = setInterval(() => setElapsed((Date.now() - t0) / 1000), 250);
    return () => clearInterval(id);
  }, [rec]);

  const start = async () => {
    setError(null);
    try {
      const stream = await getStream();
      const audioOnly = new MediaStream(stream.getAudioTracks());
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find((m) => MediaRecorder.isTypeSupported(m));
      const r = new MediaRecorder(audioOnly, mime ? { mimeType: mime } : undefined);
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      const li = new LiveInput(stream);
      r.onstop = async () => {
        li.stop();
        setLive(null);
        setRec(null);
        onStop?.();
        const blob = new Blob(chunks, { type: r.mimeType });
        onRecorded(await blob.arrayBuffer(), URL.createObjectURL(blob));
      };
      stream.getAudioTracks()[0].addEventListener('ended', () => r.state !== 'inactive' && r.stop());
      r.start(1000);
      setLive(li);
      setRec(r);
      setElapsed(0);
      onStart?.();
    } catch (e) {
      setError(e instanceof Error ? (e.name === 'NotAllowedError' ? 'Sdílení bylo zamítnuto.' : e.message) : String(e));
    }
  };

  return (
    <div className="recorder">
      {!rec ? (
        <button className="btn primary" onClick={() => void start()}>
          ● {label}
        </button>
      ) : (
        <div className="row gap wrap">
          <button className="btn danger" onClick={stop}>
            ■ Zastavit a analyzovat
          </button>
          <span className="rec-dot">REC {Math.floor(elapsed / 60)}:{String(Math.floor(elapsed % 60)).padStart(2, '0')}</span>
          {listen.loud && listen.candidates[0] && (
            <span className="heard">
              Právě slyším: <b>{label2(listen.candidates[0].name)}</b>
            </span>
          )}
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

function YouTubeCapture({ onRecorded, activeSource }: { onRecorded: (buf: ArrayBuffer, id: string, offset: number) => void; activeSource: { id: string } | null }) {
  const [url, setUrl] = useState('');
  const [id, setId] = useState<string | null>(activeSource?.id ?? null);
  const holder = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const offset = useRef(0);
  const stopRef = useRef<(() => void) | null>(null);
  const supported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getDisplayMedia;
  const isResultPlayer = activeSource?.id === id;

  useEffect(() => {
    if (!id || !holder.current || isResultPlayer) return;
    let cancelled = false;
    const el = document.createElement('div');
    holder.current.innerHTML = '';
    holder.current.appendChild(el);
    void loadYouTubeApi().then((YT) => {
      if (cancelled) return;
      player.current = new YT.Player(el, {
        videoId: id,
        width: '100%',
        height: '100%',
        playerVars: { rel: 0, playsinline: 1 },
        events: {
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.ENDED) stopRef.current?.();
          },
        },
      });
    });
    return () => {
      cancelled = true;
      player.current?.destroy();
      player.current = null;
    };
  }, [id, isResultPlayer]);

  return (
    <div className="card">
      <form
        className="row gap"
        onSubmit={(e) => {
          e.preventDefault();
          const v = youtubeId(url);
          setId(v);
        }}
      >
        <input className="grow" placeholder="Vlož odkaz na YouTube video…" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button className="btn" type="submit">
          Načíst
        </button>
      </form>
      {url && !youtubeId(url) && <p className="error small">Tohle nevypadá jako odkaz na YouTube.</p>}
      {id && !isResultPlayer && (
        <>
          <div className="yt-wrap" ref={holder} />
          <ol className="steps small">
            <li>Klikni na „Poslouchat tuto kartu“ a v okně prohlížeče vyber <b>tuto kartu</b> a zaškrtni <b>sdílet zvuk</b>.</li>
            <li>Video se spustí od začátku. Nech ho dohrát (nebo zastav ručně) – pak se spustí analýza.</li>
            <li>Potom uvidíš akordy synchronně s videem a můžeš hrát s ním.</li>
          </ol>
          {supported ? (
            <Recorder
              getStream={getTabAudio}
              label="Poslouchat tuto kartu"
              autoStopRef={stopRef}
              onStart={() => {
                const p = player.current;
                if (p) {
                  p.seekTo(0, true);
                  p.playVideo();
                }
                offset.current = 0;
              }}
              onStop={() => player.current?.pauseVideo()}
              onRecorded={(buf) => onRecorded(buf, id, offset.current)}
            />
          ) : (
            <p className="error">Tento prohlížeč neumí zachytit zvuk z karty. Použij Chrome nebo Edge na počítači, případně si zvuk ulož jako soubor.</p>
          )}
        </>
      )}
      <p className="muted small">
        YouTube nedovoluje stáhnout zvuk přímo, proto aplikace poslouchá zvuk karty, zatímco video hraje (jen ve tvém prohlížeči). Analýza tedy trvá tak dlouho jako skladba.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------

function AnalysisView({ result, source, title, onTitle }: { result: AnalysisResult; source: Source; title: string; onTitle: (t: string) => void }) {
  const label = useChordLabel();
  const [capo, setCapo] = useState(result.capo);
  const [time, setTime] = useState(0);
  const [rate, setRate] = useState(1);
  const audio = useRef<HTMLAudioElement>(null);
  const ytHolder = useRef<HTMLDivElement>(null);
  const yt = useRef<YTPlayer | null>(null);
  const shape = useCallback((c: string) => (c === 'N' ? 'N' : transposeName(c, -capo)), [capo]);

  // Přehrávač
  useEffect(() => {
    if (source.kind !== 'youtube' || !ytHolder.current) return;
    let cancelled = false;
    const el = document.createElement('div');
    ytHolder.current.innerHTML = '';
    ytHolder.current.appendChild(el);
    void loadYouTubeApi().then((YT) => {
      if (cancelled) return;
      yt.current = new YT.Player(el, { videoId: source.id, width: '100%', height: '100%', playerVars: { rel: 0, playsinline: 1 } });
    });
    return () => {
      cancelled = true;
      yt.current?.destroy();
      yt.current = null;
    };
  }, [source]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      let t = 0;
      if (source.kind === 'youtube') t = (yt.current?.getCurrentTime?.() ?? 0) - source.offset;
      else t = audio.current?.currentTime ?? 0;
      setTime(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [source]);

  const seek = (t: number) => {
    if (source.kind === 'youtube') yt.current?.seekTo(t + source.offset, true);
    else if (audio.current) audio.current.currentTime = t;
  };
  const setSpeed = (r: number) => {
    setRate(r);
    if (source.kind === 'youtube') yt.current?.setPlaybackRate(r);
    else if (audio.current) {
      audio.current.playbackRate = r;
      audio.current.preservesPitch = true;
    }
  };

  const beatIdx = useMemo(() => {
    const b = result.beats;
    let lo = 0;
    let hi = b.length - 1;
    let idx = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (b[mid] <= time) {
        idx = mid;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    return idx;
  }, [time, result.beats]);

  const segIdx = result.segments.findIndex((s) => time >= s.start && time < s.end);
  const cur = result.segments[segIdx];
  const nextSeg = result.segments.slice(segIdx + 1).find((s) => s.chord !== 'N');
  const curShape = cur && cur.chord !== 'N' ? shape(cur.chord) : null;

  const bars = useMemo(() => {
    const out: { beat: number; chords: string[] }[] = [];
    for (let b = result.downbeat; b < result.beatChords.length; b += result.beatsPerBar) out.push({ beat: b, chords: result.beatChords.slice(b, b + result.beatsPerBar) });
    return out;
  }, [result]);

  const save = () => {
    let cp = analysisToChordPro(result, title || 'Rozpoznaná píseň', capo);
    if (source.kind === 'youtube') cp = cp.replace('{artist:', `{youtube: ${source.id}}\n{artist:`);
    const id = `${slugify(title || 'pisen')}-${Date.now().toString(36).slice(-4)}`;
    saveSong(id, cp);
    navigate(`/editor/${id}`);
  };

  return (
    <section className="analysis">
      <div className="card">
        <div className="row between wrap">
          <input className="title-input" value={title} onChange={(e) => onTitle(e.target.value)} placeholder="Název písně" />
          <button className="btn primary" onClick={save}>
            💾 Uložit jako píseň (doplnit text)
          </button>
        </div>
        <div className="stats">
          <div>
            <span className="stat-label">Tónina</span>
            <b>{label(result.key.name)}</b>
          </div>
          <div>
            <span className="stat-label">Tempo</span>
            <b>{result.bpm} BPM</b>
          </div>
          <div>
            <span className="stat-label">Takt</span>
            <b>{result.beatsPerBar}/4</b>
          </div>
          <div>
            <span className="stat-label">Kapodastr</span>
            <Stepper value={capo} min={0} max={9} onChange={setCapo} format={(v) => (v ? `${v}.` : 'bez')} />
            {result.capo > 0 && capo === result.capo && <small className="ok"> doporučeno</small>}
          </div>
        </div>
        <div className="chip-row">
          {result.chordCounts.slice(0, 10).map((c) => (
            <ChordChip key={c.chord} name={shape(c.chord)} capo={capo} size={76} active={shape(c.chord) === curShape} />
          ))}
        </div>
      </div>

      <div className="analysis-grid">
        <div className="card">
          {source.kind === 'youtube' ? <div className="yt-wrap" ref={ytHolder} /> : <audio ref={audio} src={source.url} controls className="audio" />}
          <div className="row gap wrap">
            <span className="ctl-label">Rychlost</span>
            {[0.5, 0.75, 1].map((r) => (
              <button key={r} className={`btn small ${rate === r ? 'on' : ''}`} onClick={() => setSpeed(r)}>
                {Math.round(r * 100)} %
              </button>
            ))}
          </div>
        </div>
        <div className="card now-panel">
          <div className="row gap center">
            <div>
              <div className="now-label">Teď</div>
              {curShape ? <ChordDiagram voicing={getVoicing(curShape)} name={label(curShape)} size={150} /> : <div className="placeholder">—</div>}
            </div>
            <div>
              <div className="now-label">Další</div>
              {nextSeg ? <ChordDiagram voicing={getVoicing(shape(nextSeg.chord))} name={label(shape(nextSeg.chord))} size={90} /> : <div className="placeholder">—</div>}
              {nextSeg && <div className="muted small">za {Math.max(0, nextSeg.start - time).toFixed(1)} s</div>}
            </div>
          </div>
          <Fretboard voicing={curShape ? getVoicing(curShape) : null} capo={capo} />
        </div>
      </div>

      <div className="card">
        <div className="timeline">
          {result.segments.map((s, i) => (
            <button
              key={i}
              className={`tl-seg ${i === segIdx ? 'now' : ''} ${s.chord === 'N' ? 'nc' : ''}`}
              style={{ flexGrow: s.end - s.start }}
              onClick={() => seek(s.start)}
              title={`${s.start.toFixed(1)} s`}
            >
              {s.end - s.start > result.duration / 60 ? (s.chord === 'N' ? '' : label(shape(s.chord))) : ''}
            </button>
          ))}
          <div className="tl-cursor" style={{ left: `${Math.min(100, Math.max(0, (time / result.duration) * 100))}%` }} />
        </div>
        <h3>Takty</h3>
        <div className="bars">
          {bars.map((bar, i) => {
            const isNow = beatIdx >= bar.beat && beatIdx < bar.beat + result.beatsPerBar;
            return (
              <button key={i} className={`bar ${isNow ? 'now' : ''}`} onClick={() => seek(result.beats[bar.beat])}>
                {bar.chords.map((c, k) => (
                  <span key={k} className={`bar-beat ${isNow && beatIdx === bar.beat + k ? 'beat-now' : ''} ${k > 0 && bar.chords[k - 1] === c ? 'same' : ''}`}>
                    {c === 'N' ? '·' : k > 0 && bar.chords[k - 1] === c ? '/' : label(shape(c))}
                  </span>
                ))}
              </button>
            );
          })}
        </div>
        <p className="muted small">
          Automatické rozpoznávání není stoprocentní – nejlépe funguje u písní, kde je výrazně slyšet kytara nebo klavír. Po uložení můžeš akordy upravit a doplnit text.
        </p>
      </div>
    </section>
  );
}
