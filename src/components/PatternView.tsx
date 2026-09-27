import type { Chord, Voicing } from '../music/chords';
import { countLabel, stepStrings, type Pattern } from '../music/patterns';
import { useStore } from '../store';

interface Props {
  pattern: Pattern;
  current?: number;
  voicing?: Voicing | null;
  chord?: Chord | null;
  /** Zobrazit mini tabulaturu s tím, které struny hrát. */
  showTab?: boolean;
  compact?: boolean;
}


/**
 * Rytmický vzor: počítání (1 a 2 a…), směr úhozu nebo drnkané struny
 * a pod tím tabulatura pro aktuální akord, aby bylo vidět, které struny v jakém pořadí hrát.
 */
export function PatternView({ pattern, current = -1, voicing, chord, showTab = true, compact }: Props) {
  const czech = useStore((st) => st.settings.notation === 'czech');
  const names = ['E', 'A', 'D', 'G', czech ? 'H' : 'B', 'e'];
  const cols = pattern.steps.length;
  const tab = showTab && voicing && chord;
  return (
    <div className={`pattern ${compact ? 'compact' : ''}`} style={{ ['--cols' as string]: cols }}>
      <div className="pattern-row counts">
        <div className="tab-label" />
        {pattern.steps.map((_, i) => (
          <div key={i} className={`pc ${i === current ? 'now' : ''} ${i % pattern.stepsPerBeat === 0 ? 'beat' : 'off'}`}>
            {countLabel(i, pattern.stepsPerBeat)}
          </div>
        ))}
      </div>
      <div className="pattern-row symbols">
        <div className="tab-label" />
        {pattern.steps.map((st, i) => (
          <div key={i} className={`ps ${i === current ? 'now' : ''} kind-${st.kind}`}>
            {st.kind === 'strum' && (
              <span className={`arrow ${st.dir === 'D' ? 'down' : 'up'} ${st.treble ? 'light' : ''} ${st.accent ? 'accent' : ''}`}>{st.dir === 'D' ? '↓' : '↑'}</span>
            )}
            {st.kind === 'chuck' && <span className="chuck">✕</span>}
            {st.kind === 'pick' && <span className="pick">{st.strings.map((s) => (s === 'B' ? 'B' : s === 'A' ? 'A' : s)).join('+')}</span>}
            {st.kind === 'rest' && <span className="rest">·</span>}
          </div>
        ))}
      </div>
      {tab && (
        <div className="pattern-tab">
          {[5, 4, 3, 2, 1, 0].map((s) => (
            <div key={s} className="pattern-row tabline">
              <div className="tab-label">{names[s]}</div>
              {pattern.steps.map((st, i) => {
                const strings = stepStrings(st, voicing!, chord!);
                const hit = strings.includes(s);
                const fret = voicing!.frets[s];
                return (
                  <div key={i} className={`tc ${i === current ? 'now' : ''} ${hit ? 'hit' : ''} ${st.kind === 'strum' && hit ? 'strum' : ''}`}>
                    {hit ? (st.kind === 'chuck' ? 'x' : fret) : ''}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
