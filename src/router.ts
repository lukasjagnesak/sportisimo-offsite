import { useSyncExternalStore } from 'react';

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

export function useRoute(): string[] {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash);
  return hash
    .replace(/^#\/?/, '')
    .split('/')
    .filter(Boolean)
    .map(decodeURIComponent);
}

export function navigate(path: string) {
  window.location.hash = path.startsWith('/') ? path : '/' + path;
}

export const href = (path: string) => '#' + (path.startsWith('/') ? path : '/' + path);
