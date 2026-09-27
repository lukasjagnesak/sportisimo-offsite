import type { ReactNode } from 'react';
import { strumChord } from '../audio/engine';
import { displayChord, getVoicing } from '../music/chords';
import { noteName } from '../music/notes';
import type { MicState } from '../hooks';
import { useStore } from '../store';
import { ChordDiagram } from './ChordDiagram';

export function useChordLabel() {
  const notation = useStore((s) => s.settings.notation);
  return (name: string) => displayChord(name, notation);
}

export function useNoteLabel() {
  const notation = useStore((s) => s.settings.notation);
  return (pc: number) => noteName(pc, { notation });
}

/** Kartička akordu s diagramem; kliknutím zazní. */
export function ChordChip({ name, size = 90, capo = 0, active, onClick, badge }: { name: string; size?: number; capo?: number; active?: boolean; onClick?: () => void; badge?: ReactNode }) {
  const label = useChordLabel();
  const v = getVoicing(name);
  return (
    <button
      type="button"
      className={`chord-chip ${active ? 'active' : ''}`}
      onClick={() => {
        if (v) strumChord(v, { capo });
        onClick?.();
      }}
      title={`Zahrát ${label(name)}`}
    >
      <ChordDiagram voicing={v} name={label(name)} size={size} />
      {badge}
    </button>
  );
}

export function MicButton({ state, onStart, onStop, labelOn = 'Poslouchám', labelOff = 'Zapnout mikrofon' }: { state: MicState; onStart: () => void; onStop: () => void; labelOn?: string; labelOff?: string }) {
  const on = state === 'on';
  return (
    <button type="button" className={`btn mic ${on ? 'on' : ''}`} onClick={on ? onStop : onStart} disabled={state === 'starting'}>
      <span className="mic-dot" aria-hidden />
      {state === 'starting' ? 'Spouštím…' : on ? labelOn : labelOff}
    </button>
  );
}

export function LevelMeter({ level, threshold }: { level: number; threshold: number }) {
  const pct = Math.min(100, Math.sqrt(level / 0.3) * 100);
  const th = Math.min(100, Math.sqrt(threshold / 0.3) * 100);
  return (
    <div className="level" title="Hlasitost vstupu">
      <div className="level-bar" style={{ width: `${pct}%` }} />
      <div className="level-th" style={{ left: `${th}%` }} />
    </div>
  );
}

/** Sloupcový graf 12 tónů – co mikrofon slyší. */
export function ChromaBars({ chroma, expected = [], missing = [] }: { chroma: ArrayLike<number> | null; expected?: number[]; missing?: number[] }) {
  const note = useNoteLabel();
  const max = chroma ? Math.max(...Array.from(chroma), 1e-6) : 1;
  return (
    <div className="chroma">
      {Array.from({ length: 12 }, (_, pc) => {
        const v = chroma ? chroma[pc] / max : 0;
        return (
          <div key={pc} className={`chroma-col ${expected.includes(pc) ? 'exp' : ''} ${missing.includes(pc) ? 'miss' : ''}`}>
            <div className="chroma-bar-wrap">
              <div className="chroma-bar" style={{ height: `${Math.round(v * 100)}%` }} />
            </div>
            <div className="chroma-label">{note(pc)}</div>
          </div>
        );
      })}
    </div>
  );
}

export function Stepper({ value, onChange, min, max, format }: { value: number; onChange: (v: number) => void; min: number; max: number; format?: (v: number) => string }) {
  return (
    <span className="stepper">
      <button type="button" className="btn small" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Méně">
        −
      </button>
      <span className="stepper-val">{format ? format(value) : value}</span>
      <button type="button" className="btn small" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Více">
        +
      </button>
    </span>
  );
}

export function Toggle({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" aria-hidden />
      {children}
    </label>
  );
}
