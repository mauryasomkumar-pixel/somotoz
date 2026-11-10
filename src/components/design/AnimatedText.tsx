import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';

export type EntranceStyle = 'blur-in' | 'letter-wave' | 'shimmer-sweep' | 'glow-pulse' | 'typewriter';

interface AnimatedTextProps {
  text: string;
  className?: string;
  style?: EntranceStyle;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  delayMs?: number;
  speedMs?: number;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  className = '',
  style = 'blur-in',
  as: Component = 'span',
  delayMs = 0,
  speedMs = 35,
}) => {
  const { animationLevel, isLowEndDevice, isTabVisible } = useTheme();
  const containerRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [typewriterCount, setTypewriterCount] = useState(0);

  // Fallback to simple render if animations are off or reduced motion is requested
  const isReduced = animationLevel === 'off';
  const isLight = animationLevel === 'light' || isLowEndDevice;

  // IntersectionObserver: trigger only when entering viewport, and only once
  useEffect(() => {
    if (isReduced) {
      setIsVisible(true);
      return;
    }

    const elem = containerRef.current;
    if (!elem) return;

    // Check if IntersectionObserver is available
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect(); // Only animate once
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(elem);
    return () => observer.disconnect();
  }, [isReduced]);

  // Typewriter effect timer
  useEffect(() => {
    if (style !== 'typewriter' || !isVisible || isReduced || isLight) {
      setTypewriterCount(text.length);
      return;
    }

    if (!isTabVisible) return;

    let index = 0;
    const interval = setInterval(() => {
      index++;
      setTypewriterCount(index);
      if (index >= text.length) {
        clearInterval(interval);
      }
    }, speedMs);

    return () => clearInterval(interval);
  }, [style, isVisible, isReduced, isLight, isTabVisible, text, speedMs]);

  // Split words for blur-in
  const words = useMemo(() => text.split(' '), [text]);
  // Split letters for letter wave
  const letters = useMemo(() => text.split(''), [text]);

  if (isReduced) {
    return (
      <Component ref={containerRef as any} className={className}>
        {text}
      </Component>
    );
  }

  // 1. Typewriter Entrance
  if (style === 'typewriter') {
    return (
      <Component ref={containerRef as any} className={`inline-block font-sans ${className}`}>
        {text.slice(0, typewriterCount)}
        {typewriterCount < text.length && (
          <span className="inline-block w-1.5 h-4 ml-0.5 bg-[var(--accent-color)] animate-pulse" />
        )}
      </Component>
    );
  }

  // 2. Letter Wave Entrance
  if (style === 'letter-wave' && !isLight) {
    return (
      <Component ref={containerRef as any} className={`inline-block ${className}`}>
        {letters.map((char, i) => (
          <span
            key={i}
            className="inline-block transition-transform duration-300"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
              transitionDelay: `${delayMs + i * 22}ms`,
              whiteSpace: char === ' ' ? 'pre' : 'normal',
            }}
          >
            {char}
          </span>
        ))}
      </Component>
    );
  }

  // 3. Shimmer Sweep Entrance
  if (style === 'shimmer-sweep') {
    return (
      <Component
        ref={containerRef as any}
        className={`relative inline-block overflow-hidden transition-all duration-500 ${className}`}
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(6px)',
          transitionDelay: `${delayMs}ms`,
        }}
      >
        <span>{text}</span>
        {isVisible && !isLight && (
          <span
            className="absolute inset-0 w-full h-full pointer-events-none animate-shimmer-sweep opacity-70"
            style={{
              background: 'var(--theme-gradient-shimmer)',
            }}
          />
        )}
      </Component>
    );
  }

  // 4. Soft Glow Pulse Entrance
  if (style === 'glow-pulse') {
    return (
      <Component
        ref={containerRef as any}
        className={`inline-block transition-all duration-700 ${isVisible ? 'animate-glow-pulse' : ''} ${className}`}
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.96)',
          transitionDelay: `${delayMs}ms`,
        }}
      >
        {text}
      </Component>
    );
  }

  // 5. Default: Word-by-Word Blur-In
  return (
    <Component ref={containerRef as any} className={`inline-flex flex-wrap gap-x-[0.3em] ${className}`}>
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block transition-all duration-500 ease-out"
          style={{
            opacity: isVisible ? 1 : 0,
            filter: isVisible ? 'blur(0px)' : 'blur(8px)',
            transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
            transitionDelay: `${delayMs + i * 45}ms`,
          }}
        >
          {word}
        </span>
      ))}
    </Component>
  );
};
