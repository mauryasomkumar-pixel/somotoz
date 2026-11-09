import React, { useState } from 'react';
import { Moon, Sun, Eye, Zap, Sparkles, Palette, Calendar, ChevronDown, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { BaseThemeMode } from '../types';

interface ThemeSwitcherProps {
  compact?: boolean;
  className?: string;
  showLabels?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  compact = false,
  className = '',
  showLabels = true,
}) => {
  const {
    theme,
    baseMode,
    isAutoMode,
    autoModeLabel,
    autoThemeReason,
    setBaseMode,
    activeMood,
    setMood,
    moodThemes,
    isThemeOfTheDayActive,
    setIsThemeOfTheDayActive,
    themeOfTheDay,
  } = useTheme();

  const [showAccentPicker, setShowAccentPicker] = useState(false);

  const baseModes: Array<{
    id: BaseThemeMode;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    tooltip: string;
  }> = [
    {
      id: 'auto',
      label: 'Auto',
      shortLabel: 'Auto',
      icon: Zap,
      tooltip: 'Auto: Day 06:00-16:59 • Eye Comfort 17:00-19:59 • Night 20:00-05:59',
    },
    {
      id: 'white' as any, // maps to day
      label: 'Day',
      shortLabel: 'Day',
      icon: Sun,
      tooltip: 'Day Mode: Crisp light pearl theme (Session only)',
    },
    {
      id: 'black' as any, // maps to night
      label: 'Night',
      shortLabel: 'Night',
      icon: Moon,
      tooltip: 'Night Mode: Deep obsidian dark theme (Session only)',
    },
    {
      id: 'mix' as any, // maps to eye-comfort
      label: 'Eye Comfort',
      shortLabel: 'Comfort',
      icon: Eye,
      tooltip: 'Eye Comfort: Warm sepia cream theme (Session only)',
    },
  ];

  // Map click to base mode
  const handleSelectMode = (id: string) => {
    if (id === 'auto') {
      setBaseMode('auto');
    } else if (id === 'white' || id === 'day') {
      setBaseMode('day');
    } else if (id === 'black' || id === 'night') {
      setBaseMode('night');
    } else if (id === 'mix' || id === 'eye-comfort') {
      setBaseMode('eye-comfort');
    }
  };

  const isModeActive = (id: string) => {
    if (id === 'auto') return isAutoMode;
    if (id === 'white' || id === 'day') return !isAutoMode && (baseMode === 'day' || theme === 'white');
    if (id === 'black' || id === 'night') return !isAutoMode && (baseMode === 'night' || theme === 'black');
    if (id === 'mix' || id === 'eye-comfort') return !isAutoMode && (baseMode === 'eye-comfort' || theme === 'mix');
    return false;
  };

  // 1. COMPACT MODE (Navbar, Sidebar, LandingPage)
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 p-1 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl ${className}`}>
        <div className="flex items-center gap-0.5">
          {/* Auto Button */}
          <button
            type="button"
            onClick={() => handleSelectMode('auto')}
            className={`p-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center ${
              isAutoMode
                ? 'bg-[var(--accent-color)] text-black font-extrabold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
            }`}
            title={`Real-Time Auto: ${autoThemeReason}`}
            aria-label="Switch to Auto theme mode"
          >
            <Zap className={`w-3.5 h-3.5 ${isAutoMode ? 'animate-pulse' : ''}`} />
          </button>

          {/* Day Button */}
          <button
            type="button"
            onClick={() => handleSelectMode('day')}
            className={`p-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center justify-center ${
              isModeActive('day')
                ? 'bg-[var(--accent-color)] text-black font-extrabold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
            }`}
            title="Day Mode (06:00-16:59) - Session Only"
            aria-label="Switch to Day mode"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>

          {/* Night Button */}
          <button
            type="button"
            onClick={() => handleSelectMode('night')}
            className={`p-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center justify-center ${
              isModeActive('night')
                ? 'bg-[var(--accent-color)] text-black font-extrabold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
            }`}
            title="Night Mode (20:00-05:59) - Session Only"
            aria-label="Switch to Night mode"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>

          {/* Eye Comfort Button */}
          <button
            type="button"
            onClick={() => handleSelectMode('eye-comfort')}
            className={`p-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center justify-center ${
              isModeActive('eye-comfort')
                ? 'bg-[var(--accent-color)] text-black font-extrabold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
            }`}
            title="Eye Comfort Mode (17:00-19:59) - Session Only"
            aria-label="Switch to Eye Comfort mode"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Small label next to switch: e.g. "Auto (Day)", "Auto (Night)" */}
        <span
          className="text-[10px] font-mono font-bold text-[var(--accent-color)] px-1.5 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] whitespace-nowrap shadow-xs select-none"
          title={`Active Theme: ${autoModeLabel}`}
        >
          {autoModeLabel}
        </span>
      </div>
    );
  }

  // 2. EXPANDED MODE (ProfileView, ProfileModal, Settings)
  return (
    <div className={`space-y-4 ${className}`}>
      {showLabels && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Base Theme Mode
            </span>
            <span className="text-[10px] font-mono font-bold text-[var(--accent-color)] px-2 py-0.5 rounded-full bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/30">
              {autoModeLabel}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAccentPicker(!showAccentPicker)}
            className="text-xs font-semibold text-[var(--accent-color)] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Mood & Accents</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showAccentPicker ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}

      {/* 4 Mode Buttons: Auto, Day, Night, Eye Comfort */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Auto */}
        <button
          type="button"
          onClick={() => handleSelectMode('auto')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
            isAutoMode
              ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10 shadow-xs'
              : 'border-[var(--border-color)] bg-[var(--bg-elevated)] hover:border-[var(--accent-color)]/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div
              className={`p-1.5 rounded-lg ${
                isAutoMode
                  ? 'bg-[var(--accent-color)] text-black'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)]'
              }`}
            >
              <Zap className={`w-4 h-4 ${isAutoMode ? 'animate-pulse' : ''}`} />
            </div>
            {isAutoMode && (
              <span className="text-[10px] font-bold uppercase text-[var(--accent-color)]">
                Active
              </span>
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-[var(--text-primary)]">Auto (Clock)</h4>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 line-clamp-1">
              {autoThemeReason}
            </p>
          </div>
        </button>

        {/* Day */}
        <button
          type="button"
          onClick={() => handleSelectMode('day')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
            isModeActive('day')
              ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10 shadow-xs'
              : 'border-[var(--border-color)] bg-[var(--bg-elevated)] hover:border-[var(--accent-color)]/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div
              className={`p-1.5 rounded-lg ${
                isModeActive('day')
                  ? 'bg-[var(--accent-color)] text-black'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)]'
              }`}
            >
              <Sun className="w-4 h-4" />
            </div>
            {isModeActive('day') && (
              <span className="text-[10px] font-bold uppercase text-[var(--accent-color)]">
                Active
              </span>
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-[var(--text-primary)]">Day Mode</h4>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
              06:00-16:59 • Light
            </p>
          </div>
        </button>

        {/* Night */}
        <button
          type="button"
          onClick={() => handleSelectMode('night')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
            isModeActive('night')
              ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10 shadow-xs'
              : 'border-[var(--border-color)] bg-[var(--bg-elevated)] hover:border-[var(--accent-color)]/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div
              className={`p-1.5 rounded-lg ${
                isModeActive('night')
                  ? 'bg-[var(--accent-color)] text-black'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)]'
              }`}
            >
              <Moon className="w-4 h-4" />
            </div>
            {isModeActive('night') && (
              <span className="text-[10px] font-bold uppercase text-[var(--accent-color)]">
                Active
              </span>
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-[var(--text-primary)]">Night Mode</h4>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
              20:00-05:59 • Dark
            </p>
          </div>
        </button>

        {/* Eye Comfort */}
        <button
          type="button"
          onClick={() => handleSelectMode('eye-comfort')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
            isModeActive('eye-comfort')
              ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10 shadow-xs'
              : 'border-[var(--border-color)] bg-[var(--bg-elevated)] hover:border-[var(--accent-color)]/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div
              className={`p-1.5 rounded-lg ${
                isModeActive('eye-comfort')
                  ? 'bg-[var(--accent-color)] text-black'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)]'
              }`}
            >
              <Eye className="w-4 h-4" />
            </div>
            {isModeActive('eye-comfort') && (
              <span className="text-[10px] font-bold uppercase text-[var(--accent-color)]">
                Active
              </span>
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-[var(--text-primary)]">Eye Comfort</h4>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
              17:00-19:59 • Sepia
            </p>
          </div>
        </button>
      </div>

      {/* Accordion or Section for Mood Themes & Theme of the Day (Accents only) */}
      {(showAccentPicker || !compact) && (
        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3 mt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent-color)]" />
              <span className="text-xs font-bold text-[var(--text-primary)]">
                Accent Layer: Mood & Theme of the Day
              </span>
            </div>
            <span className="text-[10px] text-[var(--text-muted)]">
              Accents only • Keeps high-contrast readability
            </span>
          </div>

          {/* Theme of the Day toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--accent-color)]" />
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">
                  Theme of the Day: {themeOfTheDay.dayName} ({themeOfTheDay.name} {themeOfTheDay.emoji})
                </p>
                <p className="text-[10px] text-[var(--text-secondary)]">
                  {themeOfTheDay.description}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsThemeOfTheDayActive(!isThemeOfTheDayActive)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isThemeOfTheDayActive
                  ? 'bg-[var(--accent-color)] text-black'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)]'
              }`}
            >
              {isThemeOfTheDayActive ? 'Enabled' : 'Enable'}
            </button>
          </div>

          {/* Mood Themes */}
          {!isThemeOfTheDayActive && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                Select Mood Accent
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {moodThemes.map((m) => {
                  const isSelected = activeMood === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMood(m.id)}
                      className={`p-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        isSelected
                          ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/15 shadow-xs'
                          : 'border-[var(--border-color)] bg-[var(--bg-elevated)] hover:border-[var(--accent-color)]/40'
                      }`}
                      title={m.description}
                    >
                      <span className="text-base">{m.emoji}</span>
                      <span className="text-[10px] font-semibold text-[var(--text-primary)] truncate w-full">
                        {m.name}
                      </span>
                      <div
                        className="w-3.5 h-1.5 rounded-full"
                        style={{ backgroundColor: m.accentColor }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
