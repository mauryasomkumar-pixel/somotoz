import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface CountUpProps {
  end: number;
  start?: number;
  durationMs?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  end,
  start = 0,
  durationMs = 900,
  suffix = '',
  prefix = '',
  className = '',
}) => {
  const { animationLevel, isTabVisible } = useTheme();
  const [value, setValue] = useState(start);
  const containerRef = useRef<HTMLSpanElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const isReduced = animationLevel === 'off';

  useEffect(() => {
    if (isReduced) {
      setValue(end);
      return;
    }

    const elem = containerRef.current;
    if (!elem) return;

    if (typeof IntersectionObserver === 'undefined') {
      setHasStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(elem);
    return () => observer.disconnect();
  }, [isReduced, end]);

  useEffect(() => {
    if (!hasStarted || isReduced) {
      if (isReduced) setValue(end);
      return;
    }

    if (!isTabVisible) {
      setValue(end);
      return;
    }

    let startTime: number | null = null;
    let animId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / durationMs, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(start + (end - start) * eased));

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setValue(end);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [hasStarted, start, end, durationMs, isReduced, isTabVisible]);

  return (
    <span ref={containerRef} className={`font-mono tabular-nums ${className}`}>
      {prefix}
      {value.toLocaleString()}
      {suffix}
    </span>
  );
};
