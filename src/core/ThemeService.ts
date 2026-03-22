import type { IThemeService, Theme } from './interfaces/index.js';

const STORAGE_KEY = 'folioforge-theme';

class ThemeServiceImpl implements IThemeService {
  private _current: Theme = 'system';
  private _listeners = new Set<(r: 'light' | 'dark') => void>();
  private _mq: MediaQueryList;

  constructor() {
    this._mq = window.matchMedia('(prefers-color-scheme: dark)');
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    this._current = saved ?? 'system';
    this._mq.addEventListener('change', () => this._apply());
    this._apply();
  }

  get current(): Theme { return this._current; }
  get resolved(): 'light' | 'dark' {
    if (this._current === 'system') return this._mq.matches ? 'dark' : 'light';
    return this._current;
  }

  setTheme(t: Theme): void {
    this._current = t;
    localStorage.setItem(STORAGE_KEY, t);
    this._apply();
  }

  toggle(): void {
    this.setTheme(this.resolved === 'dark' ? 'light' : 'dark');
  }

  subscribe(cb: (r: 'light' | 'dark') => void): () => void {
    this._listeners.add(cb);
    return () => this._listeners.delete(cb);
  }

  private _apply(): void {
    document.documentElement.dataset['theme'] = this.resolved;
    this._listeners.forEach(cb => cb(this.resolved));
  }
}

export const themeService: IThemeService = new ThemeServiceImpl();
