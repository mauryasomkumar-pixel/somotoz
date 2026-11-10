import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'glass' | 'solid' | 'elevated' | 'cyber';
  glow?: boolean;
  hoverLift?: boolean;
  staggerIndex?: number;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'glass',
  glow = false,
  hoverLift = true,
  staggerIndex = 0,
  className = '',
  onClick,
  ...props
}) => {
  const { animationLevel, isLowEndDevice } = useTheme();
  const isReduced = animationLevel === 'off';
  const isLight = animationLevel === 'light' || isLowEndDevice;

  // Variant styling
  const variantStyles = {
    glass: 'bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--border-color)]',
    solid: 'bg-[var(--bg-card)] border border-[var(--border-color)]',
    elevated: 'bg-[var(--bg-elevated)] border border-[var(--border-color)]',
    cyber: 'bg-[var(--bg-card)] clip-cyber-corner border border-[var(--border-color)]',
  }[variant];

  // Hover lift style
  const liftStyle = hoverLift && !isReduced
    ? 'hover:-translate-y-1 hover:shadow-lg transition-transform transition-shadow duration-200'
    : '';

  // Glow style
  const glowStyle = glow && !isReduced
    ? 'animate-border-glow shadow-sm'
    : '';

  // Stagger entrance delay calculation (cap at 6 items to prevent runaway delay)
  const staggerDelay = !isReduced && staggerIndex > 0
    ? `${Math.min(staggerIndex, 6) * 45}ms`
    : undefined;

  return (
    <div
      className={`rounded-2xl relative overflow-hidden transition-colors ${variantStyles} ${liftStyle} ${glowStyle} ${className}`}
      style={{
        boxShadow: hoverLift ? undefined : undefined,
        animationDelay: staggerDelay,
        ...props.style,
      }}
      onClick={onClick}
      {...props}
    >
      {/* Subtle top edge specular highlight line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none opacity-40"
        style={{
          background: 'var(--theme-gradient-accent)',
        }}
      />
      {children}
    </div>
  );
};
