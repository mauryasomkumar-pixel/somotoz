import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppTheme } from '../types';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  isAutoMode: boolean;
  setIsAutoMode: (auto: boolean) => void;
  autoThemeReason: string;
  themeLabels: Record<AppTheme, { title: string; subtitle: string; icon: string; accentColor: string }>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_SESSION_KEY = 'somotoz_session_manual_theme';
const THEME_AUTO_KEY = 'somotoz_session_is_auto';

export const themeLabels: Record<AppTheme, { title: string; subtitle: string; icon: string; accentColor: string }> = {
  black: {
    title: 'Black (Night)',
    subtitle: 'Obsidian Black & Multi-Color Neon Glow',
    icon: 'Moon',
    accentColor: '#00F0FF',
  },
  white: {
    title: 'White (Day)',
    subtitle: 'Pearl Platinum & Rich Jewel Accents',
    icon: 'Sun',
    accentColor: '#0284C7',
  },
  mix: {
    title: 'Eye-Care (Comfort)',
    subtitle: 'Warm Sepia Cream & Gentle Amber Glow',
    icon: 'Eye',
    accentColor: '#D97706',
  },
};

/**
 * Computes intelligent theme based on real-world system clock:
 * - Night (20:00 - 06:00): Obsidian Night mode
 * - Day (06:00 - 16:00): Clean High-Contrast Day mode
 * - Afternoon/Evening Transition (16:00 - 20:00): Eye Comfort / Mix mode
 */
export function getRealTimeTheme(): { theme: AppTheme; reason: string } {
  const hour = new Date().getHours();
  if (hour >= 20 || hour < 6) {
    return { theme: 'black', reason: `Night Time (${hour >= 20 ? `${hour}:00` : `0${hour}:00`} - Night Glow Active)` };
  } else if (hour >= 6 && hour < 16) {
    return { theme: 'white', reason: `Day Time (${hour < 10 ? `0${hour}` : hour}:00 - High Contrast Day Mode)` };
  } else {
    return { theme: 'mix', reason: `Afternoon Twilight (${hour}:00 - Eye Comfort Mode)` };
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check if user manually locked theme in current tab session
  const [isAutoMode, setIsAutoModeState] = useState<boolean>(() => {
    try {
      const storedAuto = sessionStorage.getItem(THEME_AUTO_KEY);
      if (storedAuto === 'false') return false;
    } catch (e) {
      console.warn('SessionStorage unavailable', e);
    }
    return true; // Default is true (real-time auto sync)
  });

  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const storedManual = sessionStorage.getItem(THEME_SESSION_KEY);
      const storedAuto = sessionStorage.getItem(THEME_AUTO_KEY);
      if (storedAuto === 'false' && (storedManual === 'black' || storedManual === 'white' || storedManual === 'mix')) {
        return storedManual;
      }
    } catch (e) {
      console.warn('SessionStorage unavailable', e);
    }
    return getRealTimeTheme().theme;
  });

  const [autoThemeReason, setAutoThemeReason] = useState<string>(() => getRealTimeTheme().reason);

  // Manual theme selector (locks theme for current tab session)
  const setTheme = useCallback((newTheme: AppTheme) => {
    setThemeState(newTheme);
    setIsAutoModeState(false);
    try {
      sessionStorage.setItem(THEME_SESSION_KEY, newTheme);
      sessionStorage.setItem(THEME_AUTO_KEY, 'false');
    } catch (e) {
      console.warn('Could not write to sessionStorage', e);
    }
  }, []);

  // Set / toggle Auto mode
  const setIsAutoMode = useCallback((enableAuto: boolean) => {
    setIsAutoModeState(enableAuto);
    try {
      if (enableAuto) {
        sessionStorage.removeItem(THEME_SESSION_KEY);
        sessionStorage.setItem(THEME_AUTO_KEY, 'true');
        const rt = getRealTimeTheme();
        setThemeState(rt.theme);
        setAutoThemeReason(rt.reason);
      } else {
        sessionStorage.setItem(THEME_AUTO_KEY, 'false');
      }
    } catch (e) {
      console.warn('Could not write to sessionStorage', e);
    }
  }, []);

  // Periodic real-time clock check (every 30s) when in Auto mode
  useEffect(() => {
    if (!isAutoMode) return;

    const checkRealTime = () => {
      const rt = getRealTimeTheme();
      setAutoThemeReason(rt.reason);
      setThemeState((prev) => (prev !== rt.theme ? rt.theme : prev));
    };

    checkRealTime();
    const interval = setInterval(checkRealTime, 30000);
    return () => clearInterval(interval);
  }, [isAutoMode]);

  // Apply DOM attributes and root classes on theme change
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    const themeClassMap: Record<AppTheme, string[]> = {
      black: ['theme-black', 'theme-night', 'dark'],
      white: ['theme-white', 'theme-day', 'light', 'theme-day-mode'],
      mix: ['theme-mix', 'theme-eye-comfort', 'theme-comfort', 'theme-eye-care'],
    };

    const allThemeClasses = ['theme-black', 'theme-night', 'dark', 'theme-white', 'theme-day', 'light', 'theme-day-mode', 'theme-mix', 'theme-eye-comfort', 'theme-comfort', 'theme-eye-care'];

    root.setAttribute('data-theme', theme);
    body.setAttribute('data-theme', theme);

    // Remove old classes
    allThemeClasses.forEach((cls) => {
      root.classList.remove(cls);
      body.classList.remove(cls);
    });

    // Add current theme classes
    themeClassMap[theme].forEach((cls) => {
      root.classList.add(cls);
      body.classList.add(cls);
    });
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        isAutoMode,
        setIsAutoMode,
        autoThemeReason,
        themeLabels,
      }}
    >
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

