import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type FontScale = 'normal' | 'grande' | 'extra-grande';

interface AccessibilityState {
  fontScale: FontScale;
  highContrast: boolean;
  reduceMotion: boolean;
  darkMode: boolean;
}

interface AccessibilityContextValue extends AccessibilityState {
  setFontScale: (v: FontScale) => void;
  setHighContrast: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
  setDarkMode: (v: boolean) => void;
}

const STORAGE_KEY = 'inventech_a11y_prefs';

const defaultState: AccessibilityState = {
  fontScale: 'normal',
  highContrast: false,
  reduceMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  darkMode: false,
};

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AccessibilityState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...defaultState, ...JSON.parse(raw) } : defaultState;
    } catch {
      return defaultState;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* localStorage indisponível — preferência não persiste, mas a tela continua funcionando */
    }
    const root = document.documentElement;
    root.classList.toggle('a11y-text-grande', state.fontScale === 'grande');
    root.classList.toggle('a11y-text-extra-grande', state.fontScale === 'extra-grande');
    root.classList.toggle('a11y-alto-contraste', state.highContrast);
    root.classList.toggle('a11y-reduzir-movimento', state.reduceMotion);
    root.classList.toggle('dark', state.darkMode);
  }, [state]);

  const value: AccessibilityContextValue = {
    ...state,
    setFontScale: (fontScale) => setState((s) => ({ ...s, fontScale })),
    setHighContrast: (highContrast) => setState((s) => ({ ...s, highContrast })),
    setReduceMotion: (reduceMotion) => setState((s) => ({ ...s, reduceMotion })),
    setDarkMode: (darkMode) => setState((s) => ({ ...s, darkMode })),
  };

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility deve ser usado dentro de AccessibilityProvider');
  return ctx;
}
