// Syntéza drnknuté struny algoritmem Karplus–Strong (čistá funkce, bez Web Audio).

export function pluckSamples(freq: number, sampleRate: number, duration = 2.5, opts: { brightness?: number; seed?: number } = {}): Float32Array {
  const n = Math.floor(sampleRate * duration);
  const out = new Float32Array(n);
  // Smyčka: zpožďovací linka (len) + průměrovací filtr (0,5 vzorku) + all-pass pro zlomek vzorku.
  const period = sampleRate / freq;
  let len = Math.floor(period - 0.5);
  let d = period - 0.5 - len;
  if (d < 0.1 && len > 2) {
    len -= 1;
    d += 1;
  }
  len = Math.max(2, len);
  const apC = (1 - d) / (1 + d);
  const buf = new Float32Array(len);
  let seed = opts.seed ?? 12345;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  // Počáteční šum filtrovaný dolní propustí (měkčí trsátko / prst).
  const brightness = opts.brightness ?? 0.5;
  let prev = 0;
  for (let i = 0; i < len; i++) {
    const r = rand() * 2 - 1;
    prev = prev + (r - prev) * (0.25 + brightness * 0.7);
    buf[i] = prev;
  }
  let mean = 0;
  for (const x of buf) mean += x;
  mean /= len;
  for (let i = 0; i < len; i++) buf[i] -= mean;
  // Útlum závislý na výšce – vysoké struny doznívají rychleji.
  const decay = Math.min(0.9985, 0.996 + 0.0028 * Math.min(1, 200 / freq));
  let idx = 0;
  let lastX = 0;
  let apX = 0;
  let apY = 0;
  for (let i = 0; i < n; i++) {
    const x = buf[idx];
    const lp = decay * 0.5 * (x + lastX);
    const ap = apC * lp + apX - apC * apY;
    apX = lp;
    apY = ap;
    lastX = x;
    out[i] = x;
    buf[idx] = ap;
    idx = (idx + 1) % len;
  }
  // Krátký náběh proti lupnutí.
  for (let i = 0; i < Math.min(64, n); i++) out[i] *= i / 64;
  return out;
}

/** Smíchá tóny do jednoho bufferu (pro testy i náhledy). */
export function renderNotes(
  notes: { freq: number; time: number; gain?: number; dur?: number }[],
  sampleRate: number,
  duration: number,
): Float32Array {
  const out = new Float32Array(Math.floor(sampleRate * duration));
  notes.forEach((note, k) => {
    const s = pluckSamples(note.freq, sampleRate, Math.min(note.dur ?? 3, duration - note.time), { seed: 1000 + k * 7919 });
    const fade = Math.min(s.length, Math.floor(sampleRate * 0.02));
    for (let i = 0; i < fade; i++) s[s.length - 1 - i] *= i / fade;
    const start = Math.floor(note.time * sampleRate);
    const g = note.gain ?? 0.3;
    for (let i = 0; i < s.length && start + i < out.length; i++) out[start + i] += s[i] * g;
  });
  return out;
}
