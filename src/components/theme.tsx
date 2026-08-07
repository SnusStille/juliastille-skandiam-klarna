'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
}>({ theme: 'light', toggle: () => {}, setTheme: () => {} });

export const useTheme = () => useContext(ThemeContext);

/** Körs före första målningen så att mörkt läge inte blinkar till. */
export const themeScript = `(function(){try{var t=localStorage.getItem('julia-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}document.documentElement.dataset.theme=t;}catch(e){}})();`;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const current =
      (document.documentElement.dataset.theme as Theme | undefined) ??
      (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    setThemeState(current);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.classList.toggle('dark', next === 'dark');
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('julia-theme', next);
    } catch {
      /* privat läge — strunt samma */
    }
    setThemeState(next);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem('julia-theme', next);
      } catch {
        /* privat läge — strunt samma */
      }
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Byt till ljust läge' : 'Byt till mörkt läge'}
      title={theme === 'dark' ? 'Ljust läge' : 'Mörkt läge'}
      className={
        className ??
        'inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface text-muted transition hover:bg-raised hover:text-ink'
      }
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
