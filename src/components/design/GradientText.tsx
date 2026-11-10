import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'div';
  animated?: boolean;
}

export const GradientText: React.FC<GradientTextProps> = ({
  children,
  className = '',
  as: Component = 'span',
  animated = true,
}) => {
  const { animationLevel } = useTheme();
  const isReduced = animationLevel === 'off';

  return (
    <Component
      className={`inline-block bg-clip-text text-transparent font-semibold ${
        animated && !isReduced ? 'animate-gradient-flow' : ''
      } ${className}`}
      style={{
        backgroundImage: 'var(--theme-gradient-accent)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      {children}
    </Component>
  );
};
