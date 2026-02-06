import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'os-design-directory-theme';

/**
 * Detect if the user is on a mobile device
 */
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 768px)').matches ||
         /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/**
 * Resolves the actual theme based on system preference
 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Get the default theme - dark for mobile, system for desktop
 */
function getDefaultTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  return isMobileDevice() ? 'dark' : 'system';
}

/**
 * Theme provider component - equivalent to next-themes for Vite/React
 * Manages theme state, localStorage persistence, and system preference detection
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');
  const [mounted, setMounted] = useState(false);

  /**
   * Resolve the actual theme from the preference
   */
  const resolve = useCallback((t: Theme): ResolvedTheme => {
    return t === 'system' ? getSystemTheme() : t;
  }, []);

  /**
   * Apply the resolved theme to the document
   */
  const apply = useCallback((r: ResolvedTheme) => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(r);
  }, []);

  /**
   * Set the theme preference and persist to localStorage
   */
  const setTheme = useCallback((newTheme: Theme) => {
    localStorage.setItem(STORAGE_KEY, newTheme);
    setThemeState(newTheme);
    const r = resolve(newTheme);
    setResolvedTheme(r);
    apply(r);
  }, [resolve, apply]);

  /**
   * Initialize theme from localStorage on mount
   * Mobile devices default to dark mode for better experience
   */
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial = stored || getDefaultTheme();
    setThemeState(initial);
    const r = resolve(initial);
    setResolvedTheme(r);
    apply(r);
    
    // Remove no-transitions class after initial paint to enable smooth transitions
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('no-transitions');
    });
    
    setMounted(true);
  }, [resolve, apply]);

  /**
   * Listen for system preference changes when in 'system' mode
   */
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handler = (e: MediaQueryListEvent) => {
      const r = e.matches ? 'dark' : 'light';
      setResolvedTheme(r);
      apply(r);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme, apply]);

  // Prevent hydration mismatch by returning null until mounted
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 * @throws Error if used outside ThemeProvider
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
