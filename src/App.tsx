import { useEffect } from 'react';
import { ChordsPage } from './pages/Chords';
import { HomePage } from './pages/Home';
import { ListenPage } from './pages/Listen';
import { PracticePage } from './pages/Practice';
import { RecognizePage } from './pages/Recognize';
import { SettingsPage } from './pages/Settings';
import { SongPlayerPage } from './pages/SongPlayer';
import { EditorPage, SongsPage } from './pages/Songs';
import { TunerPage } from './pages/Tuner';
import { href, useRoute } from './router';

const NAV = [
  { path: '', label: 'Domů', icon: '🏠' },
  { path: 'pisne', label: 'Písně', icon: '🎵' },
  { path: 'akordy', label: 'Akordy', icon: '🎼' },
  { path: 'trenink', label: 'Trénink', icon: '🎯' },
  { path: 'poslech', label: 'Poslech', icon: '🎤' },
  { path: 'rozpoznat', label: 'Z nahrávky', icon: '🎧' },
  { path: 'ladicka', label: 'Ladička', icon: '🎚' },
];

export default function App() {
  const [page, param] = useRoute();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page, param]);

  let content;
  switch (page) {
    case 'pisne':
      content = <SongsPage />;
      break;
    case 'pisen':
      content = <SongPlayerPage id={param ?? ''} />;
      break;
    case 'editor':
      content = <EditorPage key={param ?? 'new'} id={param} />;
      break;
    case 'akordy':
      content = <ChordsPage key={param ?? ''} selected={param} />;
      break;
    case 'trenink':
      content = <PracticePage />;
      break;
    case 'poslech':
      content = <ListenPage />;
      break;
    case 'rozpoznat':
      content = <RecognizePage />;
      break;
    case 'ladicka':
      content = <TunerPage />;
      break;
    case 'nastaveni':
      content = <SettingsPage />;
      break;
    default:
      content = <HomePage />;
  }
  const active = page === 'pisen' || page === 'editor' ? 'pisne' : (page ?? '');

  return (
    <div className="app">
      <nav className="nav">
        <a className="brand" href={href('/')}>
          🎸 <span>Kytara</span>
        </a>
        <div className="nav-links">
          {NAV.map((n) => (
            <a key={n.path} href={href('/' + n.path)} className={active === n.path ? 'on' : ''}>
              <span className="nav-icon">{n.icon}</span>
              <span className="nav-label">{n.label}</span>
            </a>
          ))}
        </div>
        <a className={`nav-settings ${active === 'nastaveni' ? 'on' : ''}`} href={href('/nastaveni')} title="Nastavení">
          ⚙
        </a>
      </nav>
      <main>{content}</main>
    </div>
  );
}
