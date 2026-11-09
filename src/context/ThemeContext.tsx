import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { AppTheme, BaseThemeMode } from '../types';

export const THEME_SESSION_BASE_MODE_KEY = 'somotoz_manual_base_mode';
export const MOOD_SESSION_KEY = 'somotoz_session_mood_accent';
export const THEME_OF_DAY_SESSION_KEY = 'somotoz_session_use_theme_of_day';

export interface MoodThemeOption {
  id: string;
  name: string;
  emoji: string;
  accentColor: string;
  accentHover: string;
  accentText: string;
  gradient: string;
  description: string;
}

export interface ThemeOfTheDayOption {
  dayIndex: number;
  dayName: string;
  name: string;
  emoji: string;
  accentColor: string;
  accentHover: string;
  accentText: string;
  gradient: string;
  description: string;
}

export const MOOD_THEMES: MoodThemeOption[] = [
  {
    id: 'peaceful',
    name: 'Peaceful',
    emoji: '🌿',
    accentColor: '#10B981',
    accentHover: '#059669',
    accentText: '#FFFFFF',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    description: 'Serene emerald green for mindful clarity',
  },
  {
    id: 'focused',
    name: 'Focused',
    emoji: '⚡',
    accentColor: '#00F0FF',
    accentHover: '#0284C7',
    accentText: '#000000',
    gradient: 'linear-gradient(135deg, #00F0FF 0%, #0284C7 100%)',
    description: 'High-energy electric cyan for technical reasoning',
  },
  {
    id: 'inspired',
    name: 'Inspired',
    emoji: '✨',
    accentColor: '#A855F7',
    accentHover: '#9333EA',
    accentText: '#FFFFFF',
    gradient: 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)',
    description: 'Cosmic violet sparks for creative vision',
  },
  {
    id: 'calm',
    name: 'Calm',
    emoji: '🌊',
    accentColor: '#38BDF8',
    accentHover: '#0284C7',
    accentText: '#000000',
    gradient: 'linear-gradient(135deg, #38BDF8 0%, #2563EB 100%)',
    description: 'Ocean azure for soothing tension',
  },
  {
    id: 'reflective',
    name: 'Reflective',
    emoji: '🌙',
    accentColor: '#F59E0B',
    accentHover: '#D97706',
    accentText: '#000000',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    description: 'Warm amber gold for introspective writing',
  },
  {
    id: 'energetic',
    name: 'Energetic',
    emoji: '🔥',
    accentColor: '#F43F5E',
    accentHover: '#E11D48',
    accentText: '#FFFFFF',
    gradient: 'linear-gradient(135deg, #F43F5E 0%, #FB7185 100%)',
    description: 'Vibrant coral spark for intense momentum',
  },
];

export const THEMES_OF_THE_DAY: ThemeOfTheDayOption[] = [
  {
    dayIndex: 0,
    dayName: 'Sunday',
    name: 'Solar Dawn',
    emoji: '☀️',
    accentColor: '#F59E0B',
    accentHover: '#EA580C',
    accentText: '#000000',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)',
    description: 'Warm solar gold for tranquil renewal',
  },
  {
    dayIndex: 1,
    dayName: 'Monday',
    name: 'Genesis Mint',
    emoji: '🌱',
    accentColor: '#14B8A6',
    accentHover: '#0D9488',
    accentText: '#FFFFFF',
    gradient: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
    description: 'Clean mint for fresh weekly beginnings',
  },
  {
    dayIndex: 2,
    dayName: 'Tuesday',
    name: 'Coral Vitality',
    emoji: '🪸',
    accentColor: '#F43F5E',
    accentHover: '#E11D48',
    accentText: '#FFFFFF',
    gradient: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
    description: 'High-tempo coral for focused productivity',
  },
  {
    dayIndex: 3,
    dayName: 'Wednesday',
    name: 'Deep Iris',
    emoji: '🌌',
    accentColor: '#6366F1',
    accentHover: '#4F46E5',
    accentText: '#FFFFFF',
    gradient: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
    description: 'Midweek indigo wisdom for thoughtful execution',
  },
  {
    dayIndex: 4,
    dayName: 'Thursday',
    name: 'Zen Emerald',
    emoji: '🍃',
    accentColor: '#10B981',
    accentHover: '#047857',
    accentText: '#FFFFFF',
    gradient: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
    description: 'Forest emerald for sustained deep flow',
  },
  {
    dayIndex: 5,
    dayName: 'Friday',
    name: 'Cyber Pulse',
    emoji: '⚡',
    accentColor: '#00F0FF',
    accentHover: '#06B6D4',
    accentText: '#000000',
    gradient: 'linear-gradient(135deg, #00F0FF 0%, #06B6D4 100%)',
    description: 'Electric cyan pulse for creative celebration',
  },
  {
    dayIndex: 6,
    dayName: 'Saturday',
    name: 'Cosmic Twilight',
    emoji: '✨',
    accentColor: '#A855F7',
    accentHover: '#7C3AED',
    accentText: '#FFFFFF',
    gradient: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
    description: 'Expansive orchid violet for weekend exploration',
  },
];

export function getTodayTheme(): ThemeOfTheDayOption {
  const day = new Date().getDay();
  return THEMES_OF_THE_DAY[day] || THEMES_OF_THE_DAY[0];
}

/**
 * Calculates base mode based on user's local device time:
 * - Day: 06:00 - 16:59 (hour >= 6 && hour < 17) -> 'white'
 * - Eye Comfort: 17:00 - 19:59 (hour >= 17 && hour < 20) -> 'mix'
 * - Night: 20:00 - 05:59 (hour >= 20 || hour < 6) -> 'black'
 */
export function getAutoBaseModeByTime(date: Date = new Date()): {
  theme: AppTheme;
  mode: 'day' | 'night' | 'eye-comfort';
  label: string;
  reason: string;
} {
  const hour = date.getHours();
  const minutes = date.getMinutes();
  const timeFormatted = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  if (hour >= 6 && hour < 17) {
    return {
      theme: 'white',
      mode: 'day',
      label: 'Auto (Day)',
      reason: `Daylight Active (${timeFormatted} • 06:00-16:59)`,
    };
  } else if (hour >= 17 && hour < 20) {
    return {
      theme: 'mix',
      mode: 'eye-comfort',
      label: 'Auto (Eye Comfort)',
      reason: `Evening Twilight (${timeFormatted} • 17:00-19:59)`,
    };
  } else {
    return {
      theme: 'black',
      mode: 'night',
      label: 'Auto (Night)',
      reason: `Night Glow Active (${timeFormatted} • 20:00-05:59)`,
    };
  }
}

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

interface ThemeContextType {
  // Base mode & active theme
  theme: AppTheme; // 'white' | 'black' | 'mix'
  baseMode: BaseThemeMode; // 'auto' | 'day' | 'night' | 'eye-comfort'
  isAutoMode: boolean;
  autoModeLabel: string; // e.g. "Auto (Day)", "Auto (Night)", "Auto (Eye Comfort)"
  autoThemeReason: string;
  setBaseMode: (mode: BaseThemeMode) => void;
  setTheme: (theme: AppTheme) => void; // for backwards compatibility
  setIsAutoMode: (auto: boolean) => void; // for backwards compatibility
  themeLabels: Record<AppTheme, { title: string; subtitle: string; icon: string; accentColor: string }>;

  // Mood theme & Theme of the day accent layers
  activeMood: string;
  setMood: (mood: string) => void;
  moodThemes: MoodThemeOption[];
  isThemeOfTheDayActive: boolean;
  setIsThemeOfTheDayActive: (active: boolean) => void;
  themeOfTheDay: ThemeOfTheDayOption;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Base mode: default is 'auto'. Read ONLY from sessionStorage (never localStorage, never Firestore).
  const [baseMode, setBaseModeState] = useState<BaseThemeMode>(() => {
    try {
      const stored = sessionStorage.getItem(THEME_SESSION_BASE_MODE_KEY);
      if (stored === 'day' || stored === 'night' || stored === 'eye-comfort') {
        return stored;
      }
      if (stored === 'white') return 'day';
      if (stored === 'black') return 'night';
      if (stored === 'mix') return 'eye-comfort';
    } catch (e) {
      console.warn('SessionStorage unavailable', e);
    }
    return 'auto'; // Default is always Auto on fresh visit
  });

  // 2. Real-time clock calculation
  const [autoClock, setAutoClock] = useState(() => getAutoBaseModeByTime());

  // 3. Mood and Theme of the Day accent layers
  const [activeMood, setActiveMoodState] = useState<string>(() => {
    try {
      return sessionStorage.getItem(MOOD_SESSION_KEY) || 'peaceful';
    } catch {
      return 'peaceful';
    }
  });

  const [isThemeOfTheDayActive, setIsThemeOfTheDayActiveState] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(THEME_OF_DAY_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const themeOfTheDay = useMemo(() => getTodayTheme(), []);

  // Compute active base theme ('white' | 'black' | 'mix')
  const theme: AppTheme = useMemo(() => {
    if (baseMode === 'day') return 'white';
    if (baseMode === 'night') return 'black';
    if (baseMode === 'eye-comfort') return 'mix';
    return autoClock.theme;
  }, [baseMode, autoClock.theme]);

  const isAutoMode = baseMode === 'auto';

  // Label next to switch (e.g. "Auto (Day)", "Auto (Night)", "Day")
  const autoModeLabel = useMemo(() => {
    if (baseMode === 'auto') {
      return autoClock.label;
    }
    if (baseMode === 'day') return 'Day';
    if (baseMode === 'night') return 'Night';
    if (baseMode === 'eye-comfort') return 'Eye Comfort';
    return 'Auto';
  }, [baseMode, autoClock.label]);

  // Set Base Mode: saves ONLY to sessionStorage, never localStorage and never Firestore
  const setBaseMode = useCallback((mode: BaseThemeMode) => {
    setBaseModeState(mode);
    try {
      if (mode === 'auto') {
        sessionStorage.removeItem(THEME_SESSION_BASE_MODE_KEY);
        sessionStorage.setItem(THEME_SESSION_BASE_MODE_KEY, 'auto');
        setAutoClock(getAutoBaseModeByTime());
      } else {
        sessionStorage.setItem(THEME_SESSION_BASE_MODE_KEY, mode);
      }
    } catch (e) {
      console.warn('Could not write to sessionStorage', e);
    }
  }, []);

  // Backwards compatibility setTheme helper
  const setTheme = useCallback((newTheme: AppTheme) => {
    if (newTheme === 'white') setBaseMode('day');
    else if (newTheme === 'black') setBaseMode('night');
    else if (newTheme === 'mix') setBaseMode('eye-comfort');
  }, [setBaseMode]);

  // Backwards compatibility setIsAutoMode helper
  const setIsAutoMode = useCallback((enableAuto: boolean) => {
    if (enableAuto) {
      setBaseMode('auto');
    } else {
      // Lock current theme into manual tab session
      if (theme === 'white') setBaseMode('day');
      else if (theme === 'black') setBaseMode('night');
      else setBaseMode('eye-comfort');
    }
  }, [setBaseMode, theme]);

  // Mood setter: stores temporary mood in sessionStorage
  const setMood = useCallback((moodId: string) => {
    setActiveMoodState(moodId);
    try {
      sessionStorage.setItem(MOOD_SESSION_KEY, moodId);
    } catch {}
  }, []);

  // Theme of the day setter
  const setIsThemeOfTheDayActive = useCallback((active: boolean) => {
    setIsThemeOfTheDayActiveState(active);
    try {
      sessionStorage.setItem(THEME_OF_DAY_SESSION_KEY, active ? 'true' : 'false');
    } catch {}
  }, []);

  // Periodic real-time clock check (every minute) when in Auto mode
  useEffect(() => {
    if (baseMode !== 'auto') return;

    const tick = () => {
      const fresh = getAutoBaseModeByTime();
      setAutoClock((prev) => {
        if (prev.theme !== fresh.theme || prev.label !== fresh.label || prev.reason !== fresh.reason) {
          return fresh;
        }
        return prev;
      });
    };

    tick();
    const interval = setInterval(tick, 60000); // Check every minute

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        tick();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [baseMode]);

  // Apply DOM attributes, root classes, and accent variables
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    const themeClassMap: Record<AppTheme, string[]> = {
      black: ['theme-black', 'theme-night', 'dark'],
      white: ['theme-white', 'theme-day', 'light', 'theme-day-mode'],
      mix: ['theme-mix', 'theme-eye-comfort', 'theme-comfort', 'theme-eye-care'],
    };

    const allThemeClasses = [
      'theme-black', 'theme-night', 'dark',
      'theme-white', 'theme-day', 'light', 'theme-day-mode',
      'theme-mix', 'theme-eye-comfort', 'theme-comfort', 'theme-eye-care'
    ];

    root.setAttribute('data-theme', theme);
    body.setAttribute('data-theme', theme);

    // Remove old base theme classes
    allThemeClasses.forEach((cls) => {
      root.classList.remove(cls);
      body.classList.remove(cls);
    });

    // Add current base theme classes
    themeClassMap[theme].forEach((cls) => {
      root.classList.add(cls);
      body.classList.add(cls);
    });

    // Accent Layer: Theme of the Day or Mood Theme (Accents only, never changing base mode)
    let selectedAccentColor = '';
    let selectedAccentHover = '';
    let selectedAccentText = '';
    let selectedGradient = '';

    if (isThemeOfTheDayActive) {
      selectedAccentColor = themeOfTheDay.accentColor;
      selectedAccentHover = themeOfTheDay.accentHover;
      selectedAccentText = themeOfTheDay.accentText;
      selectedGradient = themeOfTheDay.gradient;
    } else {
      const foundMood = MOOD_THEMES.find((m) => m.id === activeMood) || MOOD_THEMES[0];
      selectedAccentColor = foundMood.accentColor;
      selectedAccentHover = foundMood.accentHover;
      selectedAccentText = foundMood.accentText;
      selectedGradient = foundMood.gradient;
    }

    if (selectedAccentColor) {
      root.style.setProperty('--accent-color', selectedAccentColor);
      root.style.setProperty('--border-active', selectedAccentColor);
      root.style.setProperty('--shadow-accent', selectedAccentColor);
      root.style.setProperty('--accent-hover', selectedAccentHover);
      root.style.setProperty('--accent-gradient', selectedGradient);

      // In Day mode, if the accent is very bright (e.g. #00F0FF), ensure button text is dark for readability
      if (theme === 'white') {
        root.style.setProperty('--accent-text', selectedAccentText);
      } else {
        root.style.setProperty('--accent-text', selectedAccentText);
      }
    }
  }, [theme, isThemeOfTheDayActive, themeOfTheDay, activeMood]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        baseMode,
        isAutoMode,
        autoModeLabel,
        autoThemeReason: autoClock.reason,
        setBaseMode,
        setTheme,
        setIsAutoMode,
        themeLabels,
        activeMood,
        setMood,
        moodThemes: MOOD_THEMES,
        isThemeOfTheDayActive,
        setIsThemeOfTheDayActive,
        themeOfTheDay,
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
