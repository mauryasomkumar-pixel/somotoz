import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  ripple?: boolean;
  animatedGradient?: boolean;
  className?: string;
  isLoading?: boolean;
}

interface RipplePoint {
  x: number;
  y: number;
  id: number;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  ripple = true,
  animatedGradient = false,
  className = '',
  isLoading = false,
  disabled,
  onClick,
  ...props
}) => {
  const { animationLevel, isLowEndDevice } = useTheme();
  const [ripples, setRipples] = useState<RipplePoint[]>([]);
  const isReduced = animationLevel === 'off';
  const isLight = animationLevel === 'light' || isLowEndDevice;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;

    if (ripple && !isReduced && !isLight) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now() + Math.random();

      setRipples((prev) => [...prev, { x, y, id }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    }

    onClick?.(e);
  };

  // Base sizing
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-xl font-medium',
    md: 'px-4 py-2 text-sm rounded-xl font-medium',
    lg: 'px-5 py-2.5 text-base rounded-2xl font-semibold',
    icon: 'p-2 rounded-xl flex items-center justify-center',
  }[size];

  // Variant appearance
  const variantStyles = {
    primary:
      'bg-[var(--accent-color)] text-[var(--accent-text)] shadow-sm hover:opacity-95 border border-[var(--accent-color)]/30',
    secondary:
      'bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[var(--border-color)]/50 border border-[var(--border-color)]',
    ghost:
      'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]',
    danger:
      'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30',
    outline:
      'bg-transparent border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-color)] hover:text-[var(--accent-color)]',
  }[variant];

  // Tiny bounce & press feedback
  const bounceStyle = !isReduced
    ? 'active:scale-95 transition-transform duration-100 ease-out'
    : '';

  // Moving gradient background
  const gradientStyle =
    animatedGradient && variant === 'primary' && !isReduced
      ? 'animate-gradient-flow'
      : '';

  return (
    <button
      className={`relative inline-flex items-center justify-center gap-2 select-none overflow-hidden cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-colors ${sizeStyles} ${variantStyles} ${bounceStyle} ${gradientStyle} ${className}`}
      onClick={handleClick}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Ripple effects */}
      {ripples.map((rip) => (
        <span
          key={rip.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            top: rip.y - 20,
            left: rip.x - 20,
            width: 40,
            height: 40,
            backgroundColor: 'var(--btn-ripple-color)',
            animation: 'ripple-effect 0.6s linear forwards',
          }}
        />
      ))}
      {children}
    </button>
  );
};
