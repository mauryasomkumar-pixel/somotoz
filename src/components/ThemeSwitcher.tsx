import React from 'react';
import { Moon, Sun, Eye, Sparkles, Check } from 'lucide-react';
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
  const { theme, setTheme } = useTheme();

  const themes: Array<{
    id: AppTheme;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    description: string;
  }> = [
    {
      id: 'black',
      label: 'Black (Night)',
      shortLabel: 'Night',
      icon: Moon,
      accentColor: '#00FF41',
      description: 'Pure Black + Neon Green',
    },
    {
      id: 'white',
      label: 'White (Day)',
      shortLabel: 'Day',
      icon: Sun,
      accentColor: '#009633',
      description: 'Clean Off-White + High Contrast',
    },
    {
      id: 'mix',
      label: 'Mix (Eye-Care)',
      shortLabel: 'Eye-Care',
      icon: Eye,
      accentColor: '#2C6E49',
      description: 'Soft Warm Sepia / Reduced Strain',
    },
  ];

  if (compact) {
    return (
      <div
        className={`inline-flex items-center p-1 bg-black/60 dark:bg-black border border-[#262626] ${className}`}
        style={{ borderRadius: '2px' }}
      >
        {themes.map((t) => {
          const Icon = t.icon;
          const isActive = theme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`p-1.5 transition-all cursor-pointer relative group flex items-center justify-center ${
                isActive
                  ? 'bg-[#141414] text-[#00FF41] border border-[#00FF41] shadow-[1px_1px_0px_0px_#00FF41]'
                  : 'text-[#737373] hover:text-[#EDEDED] border border-transparent hover:border-[#333333]'
              }`}
              title={`${t.label} - ${t.description}`}
              aria-label={`Switch to ${t.label}`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {showLabels && (
        <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#737373] tracking-wider px-1 font-mono">
          <span>THEME MODE</span>
          <span className="text-[9px] text-[#00FF41]">
            {theme.toUpperCase()}
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 border border-[#262626] font-mono">
        {themes.map((t) => {
          const Icon = t.icon;
          const isActive = theme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`p-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-1 border ${
                isActive
                  ? 'bg-black border-[#00FF41] text-[#00FF41] shadow-[2px_2px_0px_0px_#00FF41]'
                  : 'bg-[#0D0D0D] border-[#262626] text-[#A1A1AA] hover:border-[#404040] hover:text-[#EDEDED]'
              }`}
              title={t.description}
            >
              <div className="flex items-center space-x-1">
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#00FF41]' : 'text-[#737373]'}`} />
                {isActive && <Check className="w-2.5 h-2.5 text-[#00FF41]" />}
              </div>
              <span className="text-[10px] font-bold leading-tight truncate w-full">
                {t.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
