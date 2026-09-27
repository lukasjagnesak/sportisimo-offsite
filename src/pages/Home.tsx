import { ChordChip, useChordLabel } from '../components/common';
import { BUILTIN_SONGS } from '../music/library';
import { href } from '../router';
import { streak, toggleStep, today, useStore } from '../store';

interface Step {
  id: string;
  title: string;
  text: string;
  chords?: string[];
  songs?: string[];
  links?: { to: string; label: string }[];
}

const PATH: Step[] = [
  { id: 'tune', title: 'Nalaď kytaru', text: 'Rozladěná kytara zní špatně, i když hraješ správně. Ladit se vyplatí před každým cvičením.', links: [{ to: '/ladicka', label: 'Otevřít ladičku' }] },
  { id: 'posture', title: 'Držení a první tóny', text: 'Prsty levé ruky tiskni těsně za pražcem, špičkami, s oblým kloubem. Palec za krkem. Pravou rukou zkus postupně rozeznít každou prázdnou strunu. Nebolí-li bříška prstů, tiskneš moc slabě – bolest za pár týdnů zmizí.' },
  { id: 'em-am', title: 'První akordy: Em a Am', text: 'Nejsnazší dvojice – tvar prstů zůstává, jen se posune o strunu.', chords: ['Em', 'Am'], songs: ['cviceni-em-am'] },
  { id: 'd-a-e', title: 'D, A a E', text: 'S těmito akordy už zahraješ první lidovky.', chords: ['D', 'A', 'E', 'A7'], songs: ['kocka-leze-dirou'] },
  { id: 'g-c', title: 'G, C a G7', text: 'G, C a D jsou páteř tisíců písní.', chords: ['G', 'C', 'G7'], songs: ['skakal-pes', 'pec-nam-spadla', 'cviceni-g-c-d'] },
  { id: 'changes', title: 'Plynulé přechody', text: 'Každý den minutu střídej jeden pár akordů. Nejrychlejší cesta k plynulé hře.', links: [{ to: '/trenink', label: 'Minuta změn' }] },
  { id: 'rhythm', title: 'Rytmus: D – D U – U D U', text: 'Pravá ruka se pořád hýbe nahoru a dolů jako kyvadlo; na „pauzách“ jen mine struny.', chords: ['D7'], songs: ['holka-modrooka', 'saints'] },
  { id: 'sevenths', title: 'Septakordy a blues', text: 'A7, D7, E7 – zvuk blues a rock’n’rollu.', chords: ['E7', 'B7'], songs: ['blues-a'] },
  { id: 'fingerpicking', title: 'Rozklad prsty a 3/4 takt', text: 'Palec hraje bas (B), ukazováček, prostředníček a prsteníček struny 3, 2, 1. Aplikace ukazuje pořadí strun na hmatníku.', chords: ['Dm'], songs: ['amazing-grace', 'scarborough-fair'] },
  { id: 'rising', title: 'Rozklad v 6/8', text: 'Kometa a House of the Rising Sun – rozklad B 3 2 1 2 3 (palec, i, m, a, m, i).', chords: ['E7', 'G7'], songs: ['kometa', 'rising-sun'] },
  { id: 'barre', title: 'Barré: F a Bm', text: 'Ukazováček přitiskne všechny struny. Začni Fmaj7 a malým F (xx3211), plné barré přijde časem.', chords: ['Fmaj7', 'F', 'Bm'], songs: ['kruh-c'] },
  { id: 'own', title: 'Tvoje oblíbená písnička', text: 'Vlož odkaz na YouTube – aplikace rozpozná akordy a můžeš hrát s videem, klidně zpomaleně.', links: [{ to: '/rozpoznat', label: 'Rozpoznat z YouTube' }] },
];

export function HomePage() {
  const progress = useStore((s) => s.progress);
  const label = useChordLabel();
  const songTitle = (id: string) => BUILTIN_SONGS.find((s) => s.id === id)?.title ?? id;
  const learned = (c: string) => (progress.chords[c]?.hits ?? 0) >= 3;
  const isDone = (st: Step) => progress.completedSteps.includes(st.id) || (!!st.chords?.length && st.chords.every(learned));
  const nextStep = PATH.find((s) => !isDone(s));
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    return { key, day: d.toLocaleDateString('cs-CZ', { weekday: 'short' }), min: progress.days[key] ?? 0 };
  });
  const maxMin = Math.max(10, ...week.map((w) => w.min));
  const knownChords = Object.entries(progress.chords).filter(([, s]) => s.hits >= 3).length;

  return (
    <div className="page">
      <section className="hero">
        <h1>Naučme se hrát na kytaru 🎸</h1>
        <p className="lead">Akordy na hmatníku, rytmus a rozklad krok za krokem, aplikace poslouchá, jestli hraješ správně, a umí vytáhnout akordy z YouTube.</p>
      </section>

      <section className="stats-row">
        <div className="card stat">
          <span className="stat-label">Série dní</span>
          <b>🔥 {streak(progress.days)}</b>
        </div>
        <div className="card stat">
          <span className="stat-label">Dnes</span>
          <b>{Math.round(progress.days[today()] ?? 0)} min</b>
        </div>
        <div className="card stat">
          <span className="stat-label">Zvládnuté akordy</span>
          <b>{knownChords}</b>
        </div>
        <div className="card stat week">
          <span className="stat-label">Posledních 7 dní</span>
          <div className="week-bars">
            {week.map((w) => (
              <div key={w.key} className="wb" title={`${Math.round(w.min)} min`}>
                <div className="wb-bar" style={{ height: `${(w.min / maxMin) * 100}%` }} />
                <span>{w.day}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {nextStep && (
        <section className="card next-step">
          <div className="muted small">Další krok</div>
          <h2>{nextStep.title}</h2>
          <p>{nextStep.text}</p>
          <StepActions step={nextStep} songTitle={songTitle} />
        </section>
      )}

      <section className="card">
        <h3>Denní rutina (20 minut)</h3>
        <ol className="routine">
          <li>
            <a href={href('/ladicka')}>Ladění</a> a rozehřátí prstů – 2 min
          </li>
          <li>
            <a href={href('/trenink')}>Zahraj akord</a> – opakování akordů z aktuálního kroku – 5 min
          </li>
          <li>
            <a href={href('/trenink')}>Minuta změn</a> – 2 páry akordů – 3 min
          </li>
          <li>
            <a href={href('/pisne')}>Píseň</a> v režimu „Krok za krokem“, pak „Přehrávání“ se zpomaleným tempem – 10 min
          </li>
        </ol>
      </section>

      <section>
        <h2>Cesta učení</h2>
        <div className="path">
          {PATH.map((st, i) => {
            const done = isDone(st);
            return (
              <div key={st.id} className={`card path-step ${done ? 'done' : ''} ${st === nextStep ? 'current' : ''}`}>
                <div className="path-num">{done ? '✔' : i + 1}</div>
                <div className="path-body">
                  <div className="row between">
                    <h3>{st.title}</h3>
                    <label className="toggle-line small">
                      <input type="checkbox" checked={done} onChange={(e) => toggleStep(st.id, e.target.checked)} /> hotovo
                    </label>
                  </div>
                  <p className="muted">{st.text}</p>
                  {st.chords && (
                    <div className="chip-row">
                      {st.chords.map((c) => (
                        <ChordChip key={c} name={c} size={64} badge={learned(c) ? <span className="badge">✔</span> : null} />
                      ))}
                    </div>
                  )}
                  <StepActions step={st} songTitle={songTitle} />
                  {st.chords && !done && <p className="muted small">Krok se splní sám, až každý akord 3× správně zahraješ s mikrofonem ({st.chords.filter(learned).map(label).join(', ') || 'zatím žádný'}).</p>}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StepActions({ step, songTitle }: { step: Step; songTitle: (id: string) => string }) {
  return (
    <div className="row gap wrap">
      {step.songs?.map((id) => (
        <a key={id} className="btn" href={href(`/pisen/${id}`)}>
          ♪ {songTitle(id)}
        </a>
      ))}
      {step.links?.map((l) => (
        <a key={l.to} className="btn" href={href(l.to)}>
          {l.label}
        </a>
      ))}
    </div>
  );
}
