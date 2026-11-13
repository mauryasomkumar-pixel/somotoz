import React, { useState, useRef, useEffect, memo } from 'react';
import { Film, Download, FileText, Video, Loader2, Pause, Play } from 'lucide-react';
import { ChatMediaData } from '../../types';
import {
  downloadCanvasFrame,
  recordAndDownloadCanvasVideo,
  downloadVideoStoryboard,
} from '../../utils/mediaExport';

export const CanvasVideoSimulator = memo<{ media: ChatMediaData }>(({ media }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [motionSpeed, setMotionSpeed] = useState<number>(1);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordProgressText, setRecordProgressText] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const frames = media.videoFrames || [
    'Scene 01: Establishing cyber-neural matrix grid',
    'Scene 02: Particle vector stream flow acceleration',
    'Scene 03: Radiant convergence peak with geometric resonance',
  ];

  useEffect(() => {
    let tick = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lowerPrompt = (media.prompt || '').toLowerCase();
    const isOcean = /\b(ocean|sea|beach|water|wave|island)\b/i.test(lowerPrompt);
    const isSpace = /\b(space|galaxy|cosmos|planet|star|nebula)\b/i.test(lowerPrompt);
    const isCity = /\b(city|urban|building|skyline|tokyo|street)\b/i.test(lowerPrompt);

    const particles: Array<{ x: number; y: number; size: number; speed: number; opacity: number }> = [];
    for (let p = 0; p < 45; p++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.2 + 0.8,
        speed: Math.random() * 0.8 + 0.3,
        opacity: Math.random() * 0.7 + 0.3,
      });
    }

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const panOffset = isPlaying ? (tick * 0.6 * motionSpeed) % w : 0;

      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      if (isSpace) {
        skyGrad.addColorStop(0, '#030712');
        skyGrad.addColorStop(0.5, '#1e1b4b');
        skyGrad.addColorStop(1, '#0f172a');
      } else if (isOcean) {
        skyGrad.addColorStop(0, '#0284c7');
        skyGrad.addColorStop(0.5, '#38bdf8');
        skyGrad.addColorStop(1, '#fef08a');
      } else if (isCity) {
        skyGrad.addColorStop(0, '#090514');
        skyGrad.addColorStop(0.6, '#2e1065');
        skyGrad.addColorStop(1, '#db2777');
      } else {
        skyGrad.addColorStop(0, '#1e1b4b');
        skyGrad.addColorStop(0.35, '#431407');
        skyGrad.addColorStop(0.7, '#ea580c');
        skyGrad.addColorStop(1, '#fbbf24');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      const sunX = isSpace ? w * 0.4 : isOcean ? w * 0.75 : w * 0.5;
      const sunY = h * 0.38;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 140);
      sunGlow.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      sunGlow.addColorStop(0.3, isSpace ? 'rgba(168, 85, 247, 0.5)' : 'rgba(251, 191, 36, 0.6)');
      sunGlow.addColorStop(0.8, isSpace ? 'rgba(99, 102, 241, 0.2)' : 'rgba(234, 88, 12, 0.2)');
      sunGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 140, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isSpace ? '#c084fc' : '#fffbeb';
      ctx.beginPath();
      ctx.arc(sunX, sunY, isSpace ? 32 : 24, 0, Math.PI * 2);
      ctx.fill();

      if (isSpace) {
        ctx.strokeStyle = 'rgba(224, 231, 255, 0.4)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(sunX, sunY, 80, 16, -0.3, 0, Math.PI * 2);
        ctx.stroke();
      } else if (isOcean) {
        ctx.fillStyle = '#0369a1';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.58);
        for (let x = 0; x <= w; x += 10) {
          const y = h * 0.58 + Math.sin((x + panOffset * 2) * 0.02) * 8;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.fill();

        ctx.fillStyle = '#075985';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.7);
        for (let x = 0; x <= w; x += 10) {
          const y = h * 0.7 + Math.sin((x - panOffset * 1.5) * 0.025) * 10;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.fill();
      } else if (isCity) {
        ctx.fillStyle = '#1e1035';
        for (let i = -1; i < 12; i++) {
          const bX = i * 65 - ((panOffset * 0.4) % 65);
          const bH = 70 + (Math.sin(i * 3) + 1) * 35;
          ctx.fillRect(bX, h * 0.65 - bH, 50, bH + 100);
        }
        ctx.fillStyle = '#0b0416';
        for (let i = -1; i < 10; i++) {
          const bX = i * 85 - (panOffset % 85);
          const bH = 110 + (Math.sin(i * 5) + 1) * 45;
          ctx.fillRect(bX, h * 0.7 - bH, 65, bH + 100);
          ctx.fillStyle = '#fde047';
          ctx.fillRect(bX + 10, h * 0.7 - bH + 15, 6, 6);
          ctx.fillRect(bX + 24, h * 0.7 - bH + 15, 6, 6);
          ctx.fillRect(bX + 10, h * 0.7 - bH + 35, 6, 6);
          ctx.fillStyle = '#0b0416';
        }
      } else {
        ctx.fillStyle = '#311042';
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(0, h * 0.62);
        ctx.lineTo(w * 0.25, h * 0.45);
        ctx.lineTo(w * 0.55, h * 0.64);
        ctx.lineTo(w * 0.8, h * 0.42);
        ctx.lineTo(w, h * 0.58);
        ctx.lineTo(w, h);
        ctx.fill();

        ctx.fillStyle = '#180720';
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(0, h * 0.72);
        ctx.lineTo(w * 0.35, h * 0.55);
        ctx.lineTo(w * 0.7, h * 0.74);
        ctx.lineTo(w, h * 0.62);
        ctx.lineTo(w, h);
        ctx.fill();
      }

      for (const pt of particles) {
        pt.y -= pt.speed * (isPlaying ? motionSpeed : 0.2);
        pt.x += Math.sin(tick * 0.02 + pt.y) * 0.4;
        if (pt.y < 0) {
          pt.y = h;
          pt.x = Math.random() * w;
        }

        ctx.fillStyle = isSpace
          ? `rgba(199, 210, 254, ${pt.opacity})`
          : isOcean
          ? `rgba(254, 240, 138, ${pt.opacity})`
          : `rgba(251, 191, 36, ${pt.opacity})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }

      const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.4, w / 2, h / 2, w * 0.7);
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      const currentFrameText = frames[activeFrameIndex] || frames[0] || 'Scene Simulation';
      ctx.fillStyle = 'rgba(10, 10, 24, 0.85)';
      ctx.fillRect(12, h - 42, w - 24, 30);
      ctx.strokeStyle = '#FF007A';
      ctx.lineWidth = 1;
      ctx.strokeRect(12, h - 42, w - 24, 30);

      ctx.fillStyle = '#FF007A';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`REC [${isPlaying ? 'LIVE 60FPS' : 'PAUSED'}] | ${currentFrameText.slice(0, 52)}`, 22, h - 23);

      tick++;
      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, activeFrameIndex, frames, motionSpeed, media.prompt]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveFrameIndex((prev) => (prev + 1) % frames.length);
    }, 2400 / motionSpeed);
    return () => clearInterval(interval);
  }, [isPlaying, frames.length, motionSpeed]);

  const handleDownloadVideo = async () => {
    if (!canvasRef.current || isRecordingVideo) return;
    setIsRecordingVideo(true);
    setIsPlaying(true);

    try {
      await recordAndDownloadCanvasVideo(
        canvasRef.current,
        3500,
        media.prompt || 'video-scene',
        (_progress, status) => {
          setRecordProgressText(status);
        }
      );
    } catch (e) {
      console.error('Video recording failed:', e);
    } finally {
      setIsRecordingVideo(false);
      setRecordProgressText(null);
    }
  };

  const handleDownloadFrame = () => {
    downloadCanvasFrame(canvasRef.current, media.prompt || 'frame');
  };

  const handleDownloadStoryboard = () => {
    downloadVideoStoryboard(frames, media.prompt || 'video-storyboard', media.duration);
  };

  return (
    <div className="bg-gradient-to-b from-[#0C0C1C] via-[#080814] to-[#04040A] border border-[#FF007A]/60 clip-cyber-card overflow-hidden shadow-[0_0_25px_rgba(255,0,122,0.15)] font-mono">
      <div className="px-3 py-2 bg-[#080814] border-b border-[#25253D] flex flex-wrap items-center justify-between gap-2 text-xs text-[#EDEDED]">
        <div className="flex items-center space-x-2">
          <span className="flex items-center gap-1.5 text-[#FF007A] font-semibold">
            <Film className="w-3.5 h-3.5 text-[#FF007A]" />
            Video Generator ({media.duration || '0:12'})
          </span>
          <span className="text-[10px] text-[#A1A1AA] bg-black/60 px-2 py-0.5 clip-badge-poly border border-[#2D2D45] hidden sm:inline">
            • 60 FPS Keyframe Engine
          </span>
        </div>

        <div className="flex items-center space-x-1.5 flex-wrap">
          <button
            onClick={() => setMotionSpeed((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1))}
            className="px-2 py-1 bg-black/80 hover:bg-[#18182E] border border-[#2D2D45] hover:border-[#FF007A] text-[#A1A1AA] hover:text-[#FF007A] text-[10px] flex items-center gap-1 transition-colors cursor-pointer clip-badge-poly"
            title="Playback speed"
          >
            <span>{motionSpeed}x Speed</span>
          </button>

          <button
            onClick={handleDownloadFrame}
            className="px-2.5 py-1 bg-black/80 hover:bg-[#18182E] border border-[#2D2D45] hover:border-[#FF007A] text-[#A1A1AA] hover:text-[#FF007A] text-[11px] flex items-center gap-1 transition-colors cursor-pointer clip-badge-poly"
            title="Download active scene frame as PNG image"
          >
            <Download className="w-3 h-3 text-[#FF007A]" />
            <span>Frame (.png)</span>
          </button>

          <button
            onClick={handleDownloadStoryboard}
            className="px-2.5 py-1 bg-black/80 hover:bg-[#18182E] border border-[#2D2D45] hover:border-[#FF007A] text-[#A1A1AA] hover:text-[#FF007A] text-[11px] flex items-center gap-1 transition-colors cursor-pointer clip-badge-poly"
            title="Download keyframes script as text file"
          >
            <FileText className="w-3 h-3 text-[#FF007A]" />
            <span>Script (.txt)</span>
          </button>

          <button
            onClick={handleDownloadVideo}
            disabled={isRecordingVideo}
            className="px-3 py-1 bg-[#FF007A] hover:bg-[#E0006A] text-white font-bold text-[11px] border border-[#FF007A] clip-badge-poly shadow-[0_0_12px_rgba(255,0,122,0.4)] flex items-center gap-1 transition-all cursor-pointer active:scale-95"
            title="Record and download motion animation as WebM video file"
          >
            {isRecordingVideo ? <Loader2 className="w-3 h-3 animate-spin text-white" /> : <Video className="w-3 h-3 text-white" />}
            <span>{isRecordingVideo ? recordProgressText || 'Recording...' : 'Download Video (.webm)'}</span>
          </button>
        </div>
      </div>

      <div className="relative bg-[#030308] flex items-center justify-center overflow-hidden">
        <canvas ref={canvasRef} width={640} height={260} className="w-full h-auto max-h-[260px]" />

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute inset-0 m-auto w-12 h-12 bg-[#FF007A] hover:bg-[#E0006A] text-white flex items-center justify-center transition-transform hover:scale-110 shadow-[0_0_20px_rgba(255,0,122,0.6)] clip-badge-poly cursor-pointer"
          title={isPlaying ? 'Pause' : 'Play'}
          aria-label={isPlaying ? 'Pause video simulation' : 'Play video simulation'}
        >
          {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 ml-0.5 text-white" />}
        </button>

        <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-black/90 border border-[#FF007A]/50 text-[10px] text-[#FF007A] clip-badge-poly flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-[#FF007A] rounded-full animate-ping" />
          Scene {activeFrameIndex + 1}/{frames.length}
        </div>

        <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/80 backdrop-blur-md border border-[#FF007A]/50 text-[10px] font-mono font-bold tracking-widest text-[#FF007A] pointer-events-none shadow-lg clip-badge-poly">
          SOMOTOZ
        </div>
      </div>

      <div className="p-2.5 bg-[#080814] border-t border-[#25253D] space-y-1.5">
        <div className="text-[11px] text-[#A1A1AA] font-semibold flex items-center justify-between">
          <span>Keyframe Breakdown Timeline</span>
          <span className="text-[#FF007A] text-[10px]">{isPlaying ? 'PLAYING (60FPS)' : 'PAUSED'}</span>
        </div>
        <div className="space-y-1">
          {frames.map((kf, idx) => (
            <div
              key={idx}
              onClick={() => {
                setActiveFrameIndex(idx);
                setIsPlaying(true);
              }}
              className={`px-2.5 py-1 text-[11px] transition-colors cursor-pointer flex items-center gap-2 border clip-badge-poly ${
                activeFrameIndex === idx
                  ? 'bg-black text-[#FF007A] border-[#FF007A] shadow-[0_0_10px_rgba(255,0,122,0.25)]'
                  : 'bg-[#0E0E20] text-[#A1A1AA] border-[#222238] hover:border-[#FF007A]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF007A]" />
              <span className="truncate">{kf}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default CanvasVideoSimulator;
