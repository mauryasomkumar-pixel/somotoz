import React from 'react';
import { Moon, Sun, Eye, Clock, Check, Zap } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { AppTheme } from '../types';

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
  const { theme, setTheme, isAutoMode, setIsAutoMode, autoThemeReason } = useTheme();

  const themes: Array<{
    id: AppTheme;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    activeBorder: string;
    description: string;
  }> = [
    {
      id: 'black',
      label: 'Night Mode',
      shortLabel: 'Night',
      icon: Moon,
      accentColor: '#00F0FF',
      activeBorder: 'border-[#00F0FF]',
      description: 'Obsidian Black & Multi-Color Neon Glow',
    },
    {
      id: 'white',
      label: 'Day Mode',
      shortLabel: 'Day',
      icon: Sun,
      accentColor: '#0284C7',
      activeBorder: 'border-[#0284C7]',
      description: 'Platinum Surface & Jewel-Toned Accents',
    },
    {
      id: 'mix',
      label: 'Eye-Comfort',
      shortLabel: 'Comfort',
      icon: Eye,
      accentColor: '#D97706',
      activeBorder: 'border-[#D97706]',
      description: 'Warm Sepia Cream & Gentle Amber Glow',
    },
  ];

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1 p-1 bg-[#0A0A12]/90 border border-[#2D2D45] clip-slant ${className}`}>
        {/* Realtime Auto Toggle */}
        <button
          onClick={() => setIsAutoMode(!isAutoMode)}
          className={`px-2 py-1 text-[9px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
            isAutoMode
              ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40'
              : 'text-[#737373] hover:text-[#EDEDED] border border-transparent'
          }`}
          title={isAutoMode ? `Real-Time Auto Active: ${autoThemeReason}` : 'Click to enable Real-Time Auto Sync'}
        >
          <Zap className={`w-3 h-3 ${isAutoMode ? 'text-[#00F0FF] animate-pulse' : 'text-[#737373]'}`} />
          <span>AUTO</span>
        </button>

        <div className="w-[1px] h-3.5 bg-[#2D2D45]" />

        {themes.map((t) => {
          const Icon = t.icon;
          const isActive = theme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`p-1.5 transition-all cursor-pointer relative group flex items-center justify-center ${
                isActive
                  ? `bg-[#141424] text-white border ${t.activeBorder} shadow-[0_0_8px_rgba(0,240,255,0.2)]`
                  : 'text-[#737373] hover:text-[#EDEDED] border border-transparent hover:border-[#3F3F5A]'
              }`}
              title={`${t.label} - ${t.description} (Click to manually set for this tab session)`}
              aria-label={`Switch to ${t.label}`}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: isActive ? t.accentColor : undefined }} />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabels && (
        <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#A1A1AA] tracking-wider px-1 font-mono">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-[#00F0FF]" />
            THEME MODE
          </span>
          <button
            onClick={() => setIsAutoMode(!isAutoMode)}
            className={`px-1.5 py-0.5 text-[9px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
              isAutoMode
                ? 'text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/30'
                : 'text-[#737373] bg-[#141424] border border-[#2D2D45] hover:text-[#EDEDED]'
            }`}
            title="Toggle between Real-Time Clock Sync vs Manual Tab Session Lock"
          >
            <Zap className={`w-2.5 h-2.5 ${isAutoMode ? 'text-[#00F0FF] animate-pulse' : 'text-[#737373]'}`} />
            {isAutoMode ? 'REAL-TIME AUTO' : 'MANUAL LOCK'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0A0A12]/80 border border-[#2D2D45] font-mono clip-slant">
        {themes.map((t) => {
          const Icon = t.icon;
          const isActive = theme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`p-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-1 border ${
                isActive
                  ? `bg-[#141424] ${t.activeBorder} text-white shadow-[0_0_10px_rgba(0,240,255,0.15)]`
                  : 'bg-[#080811] border-[#1F1F35] text-[#A1A1AA] hover:border-[#3F3F5A] hover:text-white'
              }`}
              title={`${t.description} (Session locked)`}
            >
              <div className="flex items-center space-x-1">
                <Icon className="w-3.5 h-3.5" style={{ color: isActive ? t.accentColor : '#737373' }} />
                {isActive && <Check className="w-2.5 h-2.5" style={{ color: t.accentColor }} />}
              </div>
              <span className="text-[10px] font-bold leading-tight truncate w-full">
                {t.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
      
      {isAutoMode && (
        <div className="text-[9px] text-[#00F0FF]/80 font-mono flex items-center gap-1 px-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
          <span>Synced: {autoThemeReason}</span>
        </div>
      )}
    </div>
  );
};
