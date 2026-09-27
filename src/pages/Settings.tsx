import { useState } from 'react';
import { Toggle } from '../components/common';
import { exportData, importData, updateSettings, useStore } from '../store';

export function SettingsPage() {
  const s = useStore((st) => st.settings);
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="page narrow">
      <h1>Nastavení</h1>
      <div className="card settings">
        <label>
          Zápis akordů
          <select value={s.notation} onChange={(e) => updateSettings({ notation: e.target.value as 'czech' | 'international' })}>
            <option value="czech">Český (H, B = Hb)</option>
            <option value="international">Mezinárodní (B, Bb)</option>
          </select>
        </label>
        <Toggle checked={s.leftHanded} onChange={(v) => updateSettings({ leftHanded: v })}>
          Levák (zrcadlově otočený hmatník)
        </Toggle>
        <Toggle checked={s.showNoteNames} onChange={(v) => updateSettings({ showNoteNames: v })}>
          Na hmatníku ukazovat názvy tónů místo prstů
        </Toggle>
        <label>
          Citlivost mikrofonu (práh hlasitosti): {s.micThreshold.toFixed(3)}
          <input type="range" min={0.002} max={0.06} step={0.001} value={s.micThreshold} onChange={(e) => updateSettings({ micThreshold: Number(e.target.value) })} />
          <span className="muted small">Pokud aplikace reaguje na hluk v místnosti, posuň doprava. Pokud neslyší kytaru, doleva.</span>
        </label>
      </div>
      <div className="card">
        <h3>Záloha dat</h3>
        <p className="muted small">Pokrok a vlastní písně se ukládají jen v tomto prohlížeči. Můžeš si je zálohovat nebo přenést do jiného zařízení.</p>
        <div className="row gap wrap">
          <button
            className="btn"
            onClick={() => {
              const blob = new Blob([exportData()], { type: 'application/json' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = 'kytara-zaloha.json';
              a.click();
            }}
          >
            Stáhnout zálohu
          </button>
          <label className="btn">
            Obnovit ze zálohy
            <input
              type="file"
              accept="application/json"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  importData(await f.text());
                  setMsg('Záloha obnovena.');
                } catch {
                  setMsg('Soubor se nepodařilo načíst.');
                }
              }}
            />
          </label>
        </div>
        {msg && <p>{msg}</p>}
      </div>
    </div>
  );
}
