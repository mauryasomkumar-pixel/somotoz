import React, { useEffect, useRef } from 'react';
import { MoodId } from '../../lib/moodQuoteService';
import { useTheme } from '../../context/ThemeContext';

interface MoodBackgroundCanvasProps {
  mood: MoodId;
  className?: string;
}

export const MoodBackgroundCanvas: React.FC<MoodBackgroundCanvasProps> = ({
  mood,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Respect prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      return; // Skip particle loops, rely on CSS ambient gradients
    }

    let animationFrameId: number;
    let isTabVisible = !document.hidden;

    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Responsive Canvas Resizing
    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 280);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle cap for mobile / low-end performance
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 12 : 22;

    // Theme tint adaptation
    const isLight = theme === 'white';
    const isMix = theme === 'mix';

    // Particle state initialization based on mood
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      rotation: number;
      rotationSpeed: number;
      color: string;
      phase: number;
      extra?: any;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 8 + 4,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: (Math.random() - 0.5) * 0.8,
        opacity: Math.random() * 0.5 + 0.2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        color: '#00F0FF',
        phase: Math.random() * Math.PI * 2,
      });
    }

    let tick = 0;

    const render = () => {
      if (!isTabVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      tick += 0.015;

      // 1. LOVE (Romantic): Slow-drifting petals & floating hearts
      if (mood === 'romantic') {
        particles.forEach((p, idx) => {
          p.y -= 0.6 + (idx % 3) * 0.2;
          p.x += Math.sin(tick + p.phase) * 0.5;
          p.rotation += p.rotationSpeed;

          if (p.y < -20) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = isLight ? p.opacity * 0.45 : p.opacity * 0.6;

          if (idx % 2 === 0) {
            // Heart shape
            ctx.fillStyle = isLight ? '#F43F5E' : '#FB7185';
            ctx.beginPath();
            const s = p.size * 0.7;
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(-s, -s, -s * 1.5, s / 3, 0, s * 1.5);
            ctx.bezierCurveTo(s * 1.5, s / 3, s, -s, 0, 0);
            ctx.fill();
          } else {
            // Rose petal
            ctx.fillStyle = isLight ? '#FDA4AF' : '#E11D48';
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size * 1.2, p.size * 0.6, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        });
      }

      // 2. BREAKUP (Heartbroken): Rain drops sliding on glass
      else if (mood === 'heartbroken') {
        particles.forEach((p, idx) => {
          p.y += 2.5 + (idx % 4);
          p.x += Math.sin(p.y * 0.05) * 0.2;

          if (p.y > height + 20) {
            p.y = -10;
            p.x = Math.random() * width;
          }

          ctx.save();
          ctx.globalAlpha = isLight ? p.opacity * 0.35 : p.opacity * 0.5;
          ctx.strokeStyle = isLight ? '#64748B' : '#94A3B8';
          ctx.lineWidth = 1.5;

          // Droplet streak
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x, p.y + p.size * 2.2);
          ctx.stroke();

          // Droplet head
          ctx.fillStyle = isLight ? '#64748B' : '#CBD5E1';
          ctx.beginPath();
          ctx.arc(p.x, p.y + p.size * 2.2, 1.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      // 3. MOOD OFF: Soft clouds & drifting fog
      else if (mood === 'mood_off') {
        particles.forEach((p, idx) => {
          p.x += 0.3 + (idx % 3) * 0.1;
          if (p.x > width + 100) {
            p.x = -100;
            p.y = Math.random() * height;
          }

          ctx.save();
          const cloudGrad = ctx.createRadialGradient(p.x, p.y, p.size * 0.5, p.x, p.y, p.size * 3.5);
          const color = isLight ? 'rgba(148, 163, 184,' : isMix ? 'rgba(196, 181, 153,' : 'rgba(71, 85, 105,';
          cloudGrad.addColorStop(0, `${color} ${p.opacity * 0.25})`);
          cloudGrad.addColorStop(1, `${color} 0)`);

          ctx.fillStyle = cloudGrad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      // 4. MOTIVATED: Rising sparks with a sunrise glow
      else if (mood === 'motivated') {
        particles.forEach((p, idx) => {
          p.y -= 1.2 + (idx % 3) * 0.4;
          p.x += Math.sin(tick * 2 + p.phase) * 0.6;

          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }

          ctx.save();
          ctx.globalAlpha = p.opacity * 0.7;
          ctx.fillStyle = idx % 2 === 0 ? '#F59E0B' : '#EF4444';

          // Glowing spark diamond
          ctx.beginPath();
          const s = p.size * 0.5;
          ctx.moveTo(p.x, p.y - s);
          ctx.lineTo(p.x + s * 0.6, p.y);
          ctx.lineTo(p.x, p.y + s);
          ctx.lineTo(p.x - s * 0.6, p.y);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        });
      }

      // 5. HAPPY: Confetti burst
      else if (mood === 'happy') {
        const colors = ['#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6'];
        particles.forEach((p, idx) => {
          p.y += 0.8 + (idx % 2) * 0.5;
          p.x += Math.sin(tick + p.phase) * 0.8;
          p.rotation += 0.03;

          if (p.y > height + 15) {
            p.y = -10;
            p.x = Math.random() * width;
          }

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = p.opacity * 0.6;
          ctx.fillStyle = colors[idx % colors.length];

          // Confetti rectangle or ribbon
          ctx.fillRect(-p.size * 0.5, -p.size * 0.3, p.size, p.size * 0.5);
          ctx.restore();
        });
      }

      // 6. CHILL: Gentle waves
      else if (mood === 'chill') {
        ctx.save();
        ctx.lineWidth = 1.5;
        const waveColor = isLight ? 'rgba(2, 132, 199, 0.2)' : isMix ? 'rgba(217, 119, 6, 0.2)' : 'rgba(0, 240, 255, 0.25)';
        ctx.strokeStyle = waveColor;

        for (let w = 0; w < 3; w++) {
          ctx.beginPath();
          const yOffset = height * 0.45 + w * 35;
          const speed = tick * (0.8 + w * 0.3);

          for (let x = 0; x <= width; x += 15) {
            const y = yOffset + Math.sin(x * 0.015 + speed) * 12 + Math.cos(x * 0.008 + speed * 0.5) * 8;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      // 7. FOCUS: Calm pulsing concentric rings
      else if (mood === 'focus') {
        ctx.save();
        const centerX = width * 0.5;
        const centerY = height * 0.5;
        const ringColor = isLight ? 'rgba(14, 165, 233, ' : isMix ? 'rgba(217, 119, 6, ' : 'rgba(0, 240, 255, ';

        for (let r = 0; r < 4; r++) {
          const pulse = (tick * 15 + r * 35) % 140;
          const ringAlpha = Math.max(0, 0.35 - pulse / 140);
          ctx.beginPath();
          ctx.arc(centerX, centerY, 30 + pulse, 0, Math.PI * 2);
          ctx.strokeStyle = `${ringColor}${ringAlpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [mood, theme]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none rounded-2xl w-full h-full overflow-hidden ${className}`}
      aria-hidden="true"
    />
  );
};
