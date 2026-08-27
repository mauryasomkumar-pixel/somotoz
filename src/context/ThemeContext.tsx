import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppTheme } from '../types';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  themeLabels: Record<AppTheme, { title: string; subtitle: string; icon: string }>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'somotoz_app_theme';

export const themeLabels: Record<AppTheme, { title: string; subtitle: string; icon: string }> = {
  black: {
    title: 'Black (Night)',
    subtitle: 'Pure Black & Neon Green',
    icon: 'Moon',
  },
  white: {
    title: 'White (Day)',
    subtitle: 'High-Contrast Clean Light',
    icon: 'Sun',
  },
  mix: {
    title: 'Mix Day (Eye-Care)',
    subtitle: 'Warm Sepia & Muted Sage',
    icon: 'Eye',
  },
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'black' || saved === 'white' || saved === 'mix') {
        return saved;
      }
    } catch (e) {
      console.warn('Could not read theme from localStorage', e);
    }
    return 'black';
  });

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      console.warn('Could not save theme to localStorage', e);
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.setAttribute('data-theme', theme);
    body.setAttribute('data-theme', theme);

    // Remove legacy theme classes and add active
    root.classList.remove('theme-black', 'theme-white', 'theme-mix');
    root.classList.add(`theme-${theme}`);
    body.classList.remove('theme-black', 'theme-white', 'theme-mix');
    body.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeLabels }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
