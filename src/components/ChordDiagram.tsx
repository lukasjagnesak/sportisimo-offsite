import type { Voicing } from '../music/chords';
import { useStore } from '../store';

interface Props {
  voicing: Voicing | null;
  name?: string;
  size?: number;
  /** Zvýraznění strun (indexy 0–5), např. právě drnkané. */
  active?: number[];
  className?: string;
  onClick?: () => void;
}

/** Klasický svislý diagram akordu (jak ve zpěvnících). */
export function ChordDiagram({ voicing, name, size = 120, active = [], className, onClick }: Props) {
  const leftHanded = useStore((s) => s.settings.leftHanded);
  const W = 100;
  const H = 120;
  const padX = 18;
  const top = name ? 36 : 16;
  const frets = 5;
  const gridW = W - padX * 2;
  const gridH = H - top - 8;
  const sx = gridW / 5;
  const sy = gridH / frets;

  if (!voicing) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={size} className={className} role="img" aria-label={`${name ?? ''} – prstoklad neznámý`}>
        {name && <text x={W / 2} y={16} textAnchor="middle" className="cd-name">{name}</text>}
        <text x={W / 2} y={H / 2 + 10} textAnchor="middle" className="cd-muted">?</text>
      </svg>
    );
  }
  const fretted = voicing.frets.filter((f) => f > 0);
  const maxF = fretted.length ? Math.max(...fretted) : 0;
  const minF = fretted.length ? Math.min(...fretted) : 0;
  const base = maxF <= frets ? 1 : minF;
  const stringX = (i: number) => padX + (leftHanded ? 5 - i : i) * sx;
  const fretY = (f: number) => top + (f - base + 0.5) * sy;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={size} className={`chord-diagram ${className ?? ''}`} role="img" aria-label={`Akord ${name ?? ''}`} onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      {name && (
        <text x={W / 2} y={16} textAnchor="middle" className="cd-name">
          {name}
        </text>
      )}
      {/* Pražec / nultý pražec */}
      {base === 1 ? (
        <rect x={padX - 1} y={top - 3} width={gridW + 2} height={4} className="cd-nut" />
      ) : (
        <text x={leftHanded ? W - padX + 4 : padX - 5} y={top + sy * 0.65} textAnchor={leftHanded ? 'start' : 'end'} className="cd-base">
          {base}
        </text>
      )}
      {Array.from({ length: frets + 1 }, (_, i) => (
        <line key={`f${i}`} x1={padX} x2={padX + gridW} y1={top + i * sy} y2={top + i * sy} className="cd-fret" />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <line
          key={`s${i}`}
          x1={stringX(i)}
          x2={stringX(i)}
          y1={top}
          y2={top + gridH}
          className={`cd-string ${active.includes(i) ? 'active' : ''}`}
          strokeWidth={0.6 + (5 - i) * 0.18}
        />
      ))}
      {voicing.barre && (
        <rect
          x={Math.min(stringX(voicing.barre.from), stringX(voicing.barre.to)) - 4}
          y={fretY(voicing.barre.fret) - 5}
          width={Math.abs(stringX(voicing.barre.to) - stringX(voicing.barre.from)) + 8}
          height={10}
          rx={5}
          className="cd-barre"
        />
      )}
      {voicing.frets.map((f, i) => {
        const x = stringX(i);
        if (f < 0)
          return (
            <text key={i} x={x} y={top - 6} textAnchor="middle" className="cd-mute">
              ×
            </text>
          );
        if (f === 0) return <circle key={i} cx={x} cy={top - 9} r={3.2} className={`cd-open ${active.includes(i) ? 'active' : ''}`} />;
        const inBarre = voicing.barre && voicing.barre.fret === f && i >= voicing.barre.from && i <= voicing.barre.to && voicing.fingers[i] === 1;
        return (
          <g key={i}>
            {!inBarre && <circle cx={x} cy={fretY(f)} r={5.5} className={`cd-dot ${active.includes(i) ? 'active' : ''}`} />}
            {voicing.fingers[i] > 0 && (!inBarre || i === voicing.barre!.from) && (
              <text x={x} y={fretY(f) + 2.6} textAnchor="middle" className="cd-finger">
                {voicing.fingers[i]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
