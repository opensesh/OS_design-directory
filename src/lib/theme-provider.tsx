import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Theme provider component - locked to permanent dark mode
 *
 * The toggle has been removed but we keep the provider structure
 * so useTheme() continues to work without errors.
 *
 * To restore light mode toggle in the future:
 * - See git history for original implementation
 * - All CSS variables for light/dark themes are preserved
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Always apply dark mode on mount
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add('dark');

    // Remove no-transitions class after initial paint to enable smooth transitions
    requestAnimationFrame(() => {
      root.classList.remove('no-transitions');
    });

    setMounted(true);
  }, []);

  // Prevent hydration mismatch by returning null until mounted
  if (!mounted) {
    return null;
  }

  // Provide fixed dark theme values - setTheme is a no-op
  const contextValue: ThemeContextValue = {
    theme: 'dark',
    resolvedTheme: 'dark',
    setTheme: () => {}, // No-op since theme is locked
  };

  return (
    <ThemeContext.Provider value={contextValue}>
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
