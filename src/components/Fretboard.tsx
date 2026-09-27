import type { Voicing } from '../music/chords';
import { midiNoteName, noteName, STANDARD_TUNING } from '../music/notes';
import type { RightFinger } from '../music/patterns';
import { useStore } from '../store';

interface Props {
  voicing: Voicing | null;
  capo?: number;
  /** Struny, které právě znějí (zvýrazní se). */
  active?: number[];
  /** Pořadí drnkání: pro každou strunu seznam čísel kroků (1, 2, …). */
  order?: Map<number, number[]>;
  /** Počet zobrazených pražců. */
  frets?: number;
  /** Zobrazit poznámky s názvy tónů u prstů. */
  showNotes?: boolean;
  /** Prst pravé ruky pro každou drnkanou strunu (p, i, m, a). */
  rightFingers?: Map<number, RightFinger>;
  /** Mění se s každým krokem vzoru – restartuje animaci drnknutí. */
  pulseKey?: number;
  /** Kliknutí na strunu/pražec (pro přehrání tónu). */
  onPick?: (string: number, fret: number) => void;
}

const INLAYS = [3, 5, 7, 9, 15, 17];

/** Vodorovný hmatník celé kytary s vyznačeným prstokladem. Nahoře 1. struna (e), dole 6. (E) – jako v tabulatuře. */
export function Fretboard({ voicing, capo = 0, active = [], order, rightFingers, pulseKey, frets: fretsProp, showNotes, onPick }: Props) {
  const { leftHanded, notation, showNoteNames } = useStore((s) => s.settings);
  // Na úzkém displeji stačí méně pražců (větší body), pokud je prstoklad nepotřebuje.
  const needed = voicing ? Math.max(0, ...voicing.frets) + capo + 1 : 0;
  const narrow = typeof window !== 'undefined' && window.innerWidth < 720;
  const frets = fretsProp ?? Math.max(narrow ? 5 : 12, needed);
  const notes = showNotes ?? showNoteNames;
  const H = 220;
  const left = 92;
  const right = order && order.size ? 130 : 30;
  // Šířka podle počtu pražců – na mobilu (méně pražců) vyjde hmatník větší.
  const W = left + right + frets * (narrow ? 88 : 72);
  const top = 26;
  const bottom = 22;
  const boardW = W - left - right;
  const boardH = H - top - bottom;
  // Reálné rozestupy pražců (logaritmicky se zužují), mírně zmírněné kvůli čitelnosti.
  const scale = (n: number) => {
    const real = (1 - Math.pow(2, -n / 12)) / (1 - Math.pow(2, -frets / 12));
    return 0.55 * real + 0.45 * (n / frets);
  };
  const fx = (n: number) => {
    const x = left + scale(n) * boardW;
    return leftHanded ? W - x : x;
  };
  const midX = (n: number) => (n === 0 ? (leftHanded ? W - left + 22 : left - 22) : (fx(n - 1) + fx(n)) / 2);
  // String index 0 = low E -> bottom row.
  const sy = (s: number) => top + ((5 - s) * boardH) / 5;

  const played = voicing ? voicing.frets.map((f) => (f < 0 ? -1 : f + capo)) : [];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="fretboard" role="img" aria-label="Hmatník">
      <defs>
        <linearGradient id="wood" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--wood-1)" />
          <stop offset="1" stopColor="var(--wood-2)" />
        </linearGradient>
      </defs>
      <rect x={Math.min(fx(0), fx(frets))} y={top - 10} width={Math.abs(fx(frets) - fx(0))} height={boardH + 20} rx={4} fill="url(#wood)" />
      {INLAYS.filter((n) => n <= frets).map((n) => (
        <circle key={n} cx={midX(n)} cy={top + boardH / 2} r={7} className="fb-inlay" />
      ))}
      {frets >= 12 && (
        <>
          <circle cx={midX(12)} cy={top + boardH * 0.3} r={7} className="fb-inlay" />
          <circle cx={midX(12)} cy={top + boardH * 0.7} r={7} className="fb-inlay" />
        </>
      )}
      {Array.from({ length: frets + 1 }, (_, n) => (
        <g key={n}>
          <line x1={fx(n)} x2={fx(n)} y1={top - 10} y2={top + boardH + 10} className={n === 0 ? 'fb-nut' : 'fb-fret'} />
          {n > 0 && (
            <text x={midX(n)} y={H - 4} textAnchor="middle" className="fb-num">
              {n}
            </text>
          )}
        </g>
      ))}
      {capo > 0 && (
        <g>
          <rect x={midX(capo) - 9} y={top - 16} width={18} height={boardH + 32} rx={6} className="fb-capo" />
          <text x={midX(capo)} y={top - 19} textAnchor="middle" className="fb-capo-label">
            kapo
          </text>
        </g>
      )}
      {Array.from({ length: 6 }, (_, s) => {
        const isActive = active.includes(s);
        const muted = voicing && voicing.frets[s] < 0;
        return (
          <g key={s}>
            <line
              x1={fx(0)}
              x2={fx(frets)}
              y1={sy(s)}
              y2={sy(s)}
              className={`fb-string ${isActive ? 'active' : ''} ${muted ? 'muted' : ''}`}
              strokeWidth={1.2 + (5 - s) * 0.5}
            />
            <text x={leftHanded ? W - 14 : 14} y={sy(s) + 5} textAnchor="middle" className="fb-label">
              {6 - s}
            </text>
            <text x={leftHanded ? W - 40 : 40} y={sy(s) + 5} textAnchor="middle" className="fb-label-note">
              {noteName(STANDARD_TUNING[s], { notation })}
            </text>
          </g>
        );
      })}
      {voicing?.barre && (
        <rect
          x={midX(voicing.barre.fret + capo) - 11}
          y={sy(voicing.barre.to) - 11}
          width={22}
          height={sy(voicing.barre.from) - sy(voicing.barre.to) + 22}
          rx={11}
          className="fb-barre"
        />
      )}
      {voicing &&
        played.map((f, s) => {
          const x = midX(f === capo && capo > 0 ? 0 : f);
          const y = sy(s);
          const isActive = active.includes(s);
          const midi = STANDARD_TUNING[s] + f;
          if (f < 0)
            return (
              <text key={s} x={midX(0)} y={y + 7} textAnchor="middle" className="fb-mute">
                ×
              </text>
            );
          if (voicing.frets[s] === 0) {
            const ox = capo > 0 ? midX(capo) + (leftHanded ? -22 : 22) : midX(0);
            return (
              <g key={s} onClick={() => onPick?.(s, f)} style={onPick ? { cursor: 'pointer' } : undefined}>
                <circle cx={ox} cy={y} r={10} className={`fb-open ${isActive ? 'active' : ''}`} />
                {notes && (
                  <text x={ox} y={y + 4} textAnchor="middle" className="fb-open-note">
                    {noteName(midi, { notation })}
                  </text>
                )}
              </g>
            );
          }
          const inBarre = voicing.barre && voicing.barre.fret === voicing.frets[s] && voicing.fingers[s] === 1;
          return (
            <g key={s} onClick={() => onPick?.(s, f)} style={onPick ? { cursor: 'pointer' } : undefined}>
              {!inBarre && <circle cx={x} cy={y} r={13} className={`fb-dot ${isActive ? 'active' : ''}`} />}
              {inBarre && isActive && <circle cx={x} cy={y} r={13} className="fb-dot active" />}
              <text x={x} y={y + 5} textAnchor="middle" className="fb-finger">
                {notes ? noteName(midi, { notation }) : voicing.fingers[s] || ''}
              </text>
              <title>{`${6 - s}. struna, ${f}. pražec – ${midiNoteName(midi, notation)}`}</title>
            </g>
          );
        })}
      {voicing &&
        pulseKey !== undefined &&
        active.map((s) => {
          const f = played[s];
          if (f === undefined || f < 0) return null;
          const x = voicing.frets[s] === 0 ? (capo > 0 ? midX(capo) + (leftHanded ? -22 : 22) : midX(0)) : midX(f);
          const finger = rightFingers?.get(s);
          return (
            <g key={`pulse-${pulseKey}-${s}`} className={`fb-pulse-g ${finger ? 'f-' + finger : ''}`}>
              <circle cx={x} cy={sy(s)} r={14} className="fb-pulse" />
              {finger && (
                <text x={x} y={sy(s) - 20} textAnchor="middle" className="fb-pulse-finger">
                  {finger}
                </text>
              )}
            </g>
          );
        })}
      {order &&
        [...order.entries()].map(([s, steps]) => (
          <g key={`o${s}`}>
            {rightFingers?.get(s) && (
              <text x={leftHanded ? right - 14 : W - right + 14} y={sy(s) + 5} textAnchor="middle" className={`fb-rf f-${rightFingers.get(s)}`}>
                {rightFingers.get(s)}
              </text>
            )}
            {steps.slice(0, 5).map((n, k) => {
              const x = leftHanded ? right - 37 - k * 21 : W - right + 37 + k * 21;
              return (
                <g key={k}>
                  <circle cx={x} cy={sy(s)} r={9.5} className={`fb-order ${rightFingers?.get(s) ? 'f-' + rightFingers.get(s) : ''}`} />
                  <text x={x} y={sy(s) + 4} textAnchor="middle" className="fb-order-num">
                    {n}
                  </text>
                </g>
              );
            })}
          </g>
        ))}
    </svg>
  );
}
