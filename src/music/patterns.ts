import { altBassString, bassString, type Chord, type Voicing } from './chords';

/**
 * Jeden krok vzoru (jedna doba nebo její dělení).
 *  - strum: úhoz dolů (D) / nahoru (U); `treble` = jen vyšší struny
 *  - pick: prsty drnkají vyjmenované struny (B = bas akordu, A = střídavý bas, 1–6 = číslo struny)
 *  - chuck: tlumený úder (perkusivní „čk“)
 */
export type Step =
  | { kind: 'rest' }
  | { kind: 'strum'; dir: 'D' | 'U'; treble?: boolean; accent?: boolean }
  | { kind: 'pick'; strings: PickString[] }
  | { kind: 'chuck' };

export type PickString = 'B' | 'A' | 1 | 2 | 3 | 4 | 5 | 6;

export interface Pattern {
  id: string;
  name: string;
  description: string;
  type: 'strum' | 'pick';
  beatsPerBar: number;
  stepsPerBeat: number;
  steps: Step[];
  /** Textová podoba kroků (tokeny oddělené mezerou). */
  source: string;
  level: 1 | 2 | 3;
}

/**
 * Tokeny: `D` `U` úhoz dolů/nahoru (velké = s důrazem, malé `d`/`u` = jen vyšší struny),
 * `-` pauza, `X` tlumený úder, jinak drnkání: `B` bas, `A` střídavý bas, číslice = struny (např. `B1` = bas + 1. struna).
 */
export function parseSteps(source: string): Step[] {
  return source
    .trim()
    .split(/\s+/)
    .map((tok): Step => {
      if (tok === '-' || tok === '.') return { kind: 'rest' };
      if (tok === 'X' || tok === 'x') return { kind: 'chuck' };
      if (tok === 'D' || tok === 'U') return { kind: 'strum', dir: tok };
      if (tok === 'd' || tok === 'u') return { kind: 'strum', dir: tok.toUpperCase() as 'D' | 'U', treble: true };
      if (tok === 'D>' || tok === 'U>') return { kind: 'strum', dir: tok[0] as 'D' | 'U', accent: true };
      const strings: PickString[] = [];
      for (const ch of tok) {
        if (ch === 'B' || ch === 'A') strings.push(ch);
        else if (/[1-6]/.test(ch)) strings.push(Number(ch) as PickString);
      }
      return strings.length ? { kind: 'pick', strings } : { kind: 'rest' };
    });
}

function p(
  id: string,
  name: string,
  type: Pattern['type'],
  beatsPerBar: number,
  stepsPerBeat: number,
  source: string,
  level: Pattern['level'],
  description: string,
): Pattern {
  const steps = parseSteps(source);
  if (steps.length !== beatsPerBar * stepsPerBeat) throw new Error(`Vzor ${id}: špatný počet kroků`);
  return { id, name, type, beatsPerBar, stepsPerBeat, steps, source, level, description };
}

export const PATTERNS: Pattern[] = [
  p('down4', 'Čtvrťové údery dolů', 'strum', 4, 2, 'D - D - D - D -', 1, 'Nejjednodušší rytmus: jeden úhoz dolů na každou dobu. Ideální na začátek a nácvik přechodů.'),
  p('down-up8', 'Osminy dolů–nahoru', 'strum', 4, 2, 'D U D U D U D U', 1, 'Ruka se pohybuje pořád nahoru a dolů jako kyvadlo, na dobu dolů, mezi dobami nahoru.'),
  p('folk', 'Pop / folk (D DU UDU)', 'strum', 4, 2, 'D - D U - U D U', 2, 'Nejpoužívanější doprovod v pop a folk písničkách. Ruka se hýbe pořád, na pauze jen minete struny.'),
  p('rock8', 'Rockové osminy', 'strum', 4, 2, 'D> D D D D> D D D', 2, 'Samé údery dolů s důrazem na 1. a 3. dobu. Hodí se pro energické písně.'),
  p('reggae', 'Offbeat / ska', 'strum', 4, 2, '- u - u - u - u', 2, 'Krátké údery nahoru jen do vyšších strun mezi dobami. Po úderu struny ztlumte dlaní.'),
  p('funk-chuck', 'Úder s tlumením (chuck)', 'strum', 4, 2, 'D - X U - U X U', 3, 'Na 2. a 4. dobu tlumený perkusivní úder hranou dlaně.'),
  p('country', 'Country: bas – úder', 'strum', 4, 2, 'B - d u A - d u', 2, 'Střídá se bas akordu a úder do vyšších strun, pak střídavý bas (kvinta).'),
  p('waltz', 'Valčík 3/4 (bas–úder–úder)', 'strum', 3, 2, 'B - d - d -', 1, 'Tříčtvrťový takt: na 1. dobu bas, na 2. a 3. úder do vyšších strun.'),
  p('waltz-du', 'Valčík 3/4 s osminami', 'strum', 3, 2, 'B - d u d u', 2, 'Bas na první dobu, pak údery dolů a nahoru.'),
  p('arp4', 'Rozklad 4/4 (B 3 2 3 1 3 2 3)', 'pick', 4, 2, 'B 3 2 3 1 3 2 3', 2, 'Palec hraje bas, ukazováček 3., prostředníček 2. a prsteníček 1. strunu.'),
  p('arp-up', 'Rozklad nahoru a dolů (B 3 2 1 2 3)', 'pick', 4, 2, 'B 3 2 1 2 3 2 3', 1, 'Klidný rozklad vhodný pro balady.'),
  p('travis', 'Travis picking', 'pick', 4, 2, 'B1 3 A 2 B 3 A 2', 3, 'Palec střídá bas (B) a střídavý bas (A) na každou dobu, prsty hrají melodii mezi nimi.'),
  p('pinch', 'Pinch: bas + melodie', 'pick', 4, 2, 'B1 - 3 2 A1 - 3 2', 2, 'Palec a prsteníček hrají současně (pinch), pak rozklad.'),
  p('waltz-arp', 'Rozklad 3/4 (B 3 2 1 2 3)', 'pick', 3, 2, 'B 3 2 1 2 3', 1, 'Rozklad v tříčtvrťovém taktu.'),
  p('arp68', 'Rozklad 6/8 (B 3 2 1 2 3)', 'pick', 6, 1, 'B 3 2 1 2 3', 2, 'Šestiosminový takt (např. House of the Rising Sun). Počítá se 1-2-3-4-5-6.'),
  p('strum68', 'Úhozy 6/8', 'strum', 6, 1, 'D d u D d u', 2, 'Dva „trojdobé“ celky v taktu, důraz na 1. a 4. dobu.'),
];

export const patternById = (id: string | undefined) => PATTERNS.find((x) => x.id === id);

export function defaultPatternFor(beatsPerBar: number, type: Pattern['type'] = 'strum'): Pattern {
  return PATTERNS.find((x) => x.beatsPerBar === beatsPerBar && x.type === type) ?? PATTERNS.find((x) => x.beatsPerBar === beatsPerBar) ?? PATTERNS[0];
}

/** Indexy strun (0 = 6. struna E … 5 = 1. struna e), které krok v daném akordu rozezní, ve správném pořadí. */
export function stepStrings(step: Step, v: Voicing, chord: Chord): number[] {
  const played = v.frets.map((f, i) => (f >= 0 ? i : -1)).filter((i) => i >= 0);
  switch (step.kind) {
    case 'strum': {
      let strings = played;
      if (step.treble) strings = played.filter((i) => i >= 2).slice(-4);
      else if (step.dir === 'U') strings = played.slice(-4);
      return step.dir === 'D' ? strings : [...strings].reverse();
    }
    case 'pick':
      return step.strings
        .map((s) => (s === 'B' ? bassString(v) : s === 'A' ? altBassString(v, chord) : 6 - s))
        .filter((i, k, arr) => i >= 0 && v.frets[i] >= 0 && arr.indexOf(i) === k);
    case 'chuck':
      return played;
    default:
      return [];
  }
}

export function stepLabel(step: Step): string {
  switch (step.kind) {
    case 'rest':
      return '';
    case 'chuck':
      return '✕';
    case 'strum':
      return step.dir === 'D' ? '↓' : '↑';
    case 'pick':
      return step.strings.join('+');
  }
}

export function countLabel(stepIndex: number, stepsPerBeat: number): string {
  const beat = Math.floor(stepIndex / stepsPerBeat) + 1;
  const sub = stepIndex % stepsPerBeat;
  if (sub === 0) return String(beat);
  if (stepsPerBeat === 2) return 'a';
  return ['', 'e', 'a', 'e'][sub] ?? '·';
}
