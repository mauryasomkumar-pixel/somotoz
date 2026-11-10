import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
  className?: string;
}

export const AnimatedToggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  ariaLabel = 'Toggle switch',
  className = '',
}) => {
  const { animationLevel } = useTheme();
  const isReduced = animationLevel === 'off';

  const dimensions = {
    sm: { track: 'w-8 h-4.5 p-0.5', thumb: 'w-3.5 h-3.5', translate: 'translate-x-3.5' },
    md: { track: 'w-11 h-6 p-0.5', thumb: 'w-5 h-5', translate: 'translate-x-5' },
    lg: { track: 'w-14 h-7.5 p-1', thumb: 'w-5.5 h-5.5', translate: 'translate-x-6.5' },
  }[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${dimensions.track} ${
        checked
          ? 'bg-[var(--accent-color)] shadow-sm'
          : 'bg-[var(--bg-elevated)] border border-[var(--border-color)]'
      } ${className}`}
    >
      <span
        className={`inline-block rounded-full bg-white shadow-md transform pointer-events-none ${
          dimensions.thumb
        } ${checked ? dimensions.translate : 'translate-x-0'} ${
          isReduced ? '' : 'transition-transform duration-200 ease-out'
        }`}
      />
    </button>
  );
};
