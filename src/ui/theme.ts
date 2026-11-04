// Light/dark, as in nano_sylabus lib/theme.ts: the choice lives in
// localStorage "ns-theme-v2" and on <html data-theme>. index.html applies it
// before first paint; the sidebar toggle changes it.

export type Theme = 'light' | 'dark';
const KEY = 'ns-theme-v2';
const listeners = new Set<(t: Theme) => void>();

export function getTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

export function setTheme(t: Theme) {
  document.documentElement.setAttribute('data-theme', t);
  document.documentElement.style.colorScheme = t;
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* private mode: applies for this visit */
  }
  listeners.forEach((l) => l(t));
}

export function onTheme(l: (t: Theme) => void) {
  listeners.add(l);
  return () => void listeners.delete(l);
}
