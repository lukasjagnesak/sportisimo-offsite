import { useRef, useState } from 'react';
import { referenceTone } from '../audio/engine';
import { LevelMeter, MicButton } from '../components/common';
import { useInterval, useLiveInput } from '../hooks';
import { freqToMidi, midiNoteName, midiToFreq } from '../music/notes';
import { useStore } from '../store';

const TUNINGS: { name: string; notes: number[] }[] = [
  { name: 'Standardní (E A D G H E)', notes: [40, 45, 50, 55, 59, 64] },
  { name: 'Drop D (D A D G H E)', notes: [38, 45, 50, 55, 59, 64] },
  { name: 'O půltón níž (Eb)', notes: [39, 44, 49, 54, 58, 63] },
  { name: 'Open G (D G D G H D)', notes: [38, 43, 50, 55, 59, 62] },
  { name: 'DADGAD', notes: [38, 45, 50, 55, 57, 62] },
];

export function TunerPage() {
  const notation = useStore((s) => s.settings.notation);
  const mic = useLiveInput();
  const [tuningIdx, setTuningIdx] = useState(0);
  const [fixed, setFixed] = useState<number | null>(null);
  const [reading, setReading] = useState<{ freq: number; rms: number } | null>(null);
  const hist = useRef<number[]>([]);
  const tuning = TUNINGS[tuningIdx].notes;

  useInterval(
    () => {
      const p = mic.input?.pitch();
      if (!p || p.clarity < 0.8 || p.rms < 0.004) {
        hist.current = hist.current.slice(1);
        if (!hist.current.length) setReading(null);
        return;
      }
      hist.current = [...hist.current, p.freq].slice(-5);
      const sorted = [...hist.current].sort((a, b) => a - b);
      setReading({ freq: sorted[Math.floor(sorted.length / 2)], rms: p.rms });
    },
    50,
    !!mic.input,
  );

  // Nejbližší struna (nebo zvolená).
  let target: number | null = fixed;
  if (reading && target === null) {
    const m = freqToMidi(reading.freq);
    target = tuning.reduce((best, s, i) => (Math.abs(s - m) < Math.abs(tuning[best] - m) ? i : best), 0);
  }
  const targetMidi = target !== null ? tuning[target] : null;
  const cents = reading && targetMidi !== null ? 1200 * Math.log2(reading.freq / midiToFreq(targetMidi)) : 0;
  const clamped = Math.max(-50, Math.min(50, cents));
  const inTune = reading && Math.abs(cents) < 5;
  const nearest = reading ? Math.round(freqToMidi(reading.freq)) : null;

  return (
    <div className="page">
      <h1>Ladička</h1>
      <p className="lead">Zahraj jednu prázdnou strunu. Ručička ukáže, jestli ji máš povolit (vlevo = moc nízko) nebo přitáhnout.</p>
      <div className="row gap wrap">
        <MicButton state={mic.state} onStart={() => void mic.start()} onStop={mic.stop} labelOff="Spustit ladičku" labelOn="Ladička běží" />
        <select value={tuningIdx} onChange={(e) => setTuningIdx(Number(e.target.value))}>
          {TUNINGS.map((t, i) => (
            <option key={i} value={i}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      {mic.error && <p className="error">{mic.error}</p>}
      <div className="card tuner">
        <svg viewBox="0 0 300 170" className="gauge">
          {Array.from({ length: 21 }, (_, i) => {
            const c = -50 + i * 5;
            const a = ((c / 50) * 60 - 90) * (Math.PI / 180);
            const r1 = i % 2 === 0 ? 118 : 124;
            return <line key={i} x1={150 + r1 * Math.cos(a)} y1={150 + r1 * Math.sin(a)} x2={150 + 132 * Math.cos(a)} y2={150 + 132 * Math.sin(a)} className={c === 0 ? 'tick zero' : 'tick'} />;
          })}
          <path d="M 35.7 84 A 132 132 0 0 1 264.3 84" className="gauge-arc" />
          <text x={40} y={165} className="gauge-lbl">
            −50
          </text>
          <text x={260} y={165} textAnchor="end" className="gauge-lbl">
            +50
          </text>
          <g style={{ transform: `rotate(${(clamped / 50) * 60}deg)`, transformOrigin: '150px 150px', transition: 'transform 0.12s' }}>
            <line x1={150} y1={150} x2={150} y2={30} className={`needle ${inTune ? 'ok' : ''}`} />
          </g>
          <circle cx={150} cy={150} r={7} className="needle-hub" />
        </svg>
        <div className={`tuner-note ${inTune ? 'ok' : ''}`}>{targetMidi !== null && reading ? midiNoteName(targetMidi, notation) : '—'}</div>
        <div className="tuner-info">
          {reading ? (
            <>
              {reading.freq.toFixed(1)} Hz · {cents > 0 ? '+' : ''}
              {cents.toFixed(0)} centů · slyším {nearest !== null ? midiNoteName(nearest, notation) : ''}
              <div className={inTune ? 'ok' : 'bad'}>{inTune ? '✔ Naladěno' : cents < 0 ? '↑ Přitáhni (moc nízko)' : '↓ Povol (moc vysoko)'}</div>
            </>
          ) : (
            <span className="muted">{mic.state === 'on' ? 'Zahraj strunu…' : 'Spusť ladičku'}</span>
          )}
        </div>
        {mic.state === 'on' && <LevelMeter level={reading?.rms ?? 0} threshold={0.004} />}
      </div>
      <div className="card">
        <h3>Struny</h3>
        <p className="muted small">Klikni pro referenční tón (můžeš ladit i podle sluchu). Dvojklikem strunu zamkneš pro ladění jen této struny.</p>
        <div className="strings-row">
          {tuning
            .map((m, i) => ({ m, i }))
            .reverse()
            .map(({ m, i }) => (
              <button
                key={i}
                className={`string-btn ${target === i && reading ? 'on' : ''} ${fixed === i ? 'fixed' : ''}`}
                onClick={() => referenceTone(m)}
                onDoubleClick={() => setFixed(fixed === i ? null : i)}
              >
                <b>{6 - i}.</b> {midiNoteName(m, notation)}
              </button>
            ))}
        </div>
        {fixed !== null && (
          <button className="btn small" onClick={() => setFixed(null)}>
            Automatický výběr struny
          </button>
        )}
      </div>
    </div>
  );
}
