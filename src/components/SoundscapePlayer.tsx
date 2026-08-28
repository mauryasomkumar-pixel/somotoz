import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, CloudRain, Waves, Wind, Radio, Sparkles, Moon, Clock, Terminal, Activity } from 'lucide-react';

interface SoundscapeTrack {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  type: 'rain' | 'ocean' | 'breeze' | 'synth432' | 'pink_noise';
}

const TRACKS: (SoundscapeTrack & { accent: string; glow: string })[] = [
  {
    id: 'rain',
    name: 'Gentle Rain',
    description: 'Soft peaceful rain sounds for relaxation',
    icon: CloudRain,
    type: 'rain',
    accent: '#00F0FF',
    glow: 'shadow-[0_0_20px_rgba(0,240,255,0.35)]',
  },
  {
    id: 'ocean',
    name: 'Ocean Waves',
    description: 'Gentle relaxing sea waves for calm thinking',
    icon: Waves,
    type: 'ocean',
    accent: '#00F0FF',
    glow: 'shadow-[0_0_20px_rgba(0,240,255,0.35)]',
  },
  {
    id: 'breeze',
    name: 'Whispering Forest',
    description: 'Peaceful breeze and soothing rustling leaves',
    icon: Wind,
    type: 'breeze',
    accent: '#00FF88',
    glow: 'shadow-[0_0_20px_rgba(0,255,136,0.35)]',
  },
  {
    id: 'synth432',
    name: 'Singing Bowl',
    description: 'Deep meditative relaxing harmonic frequency',
    icon: Sparkles,
    type: 'synth432',
    accent: '#A855F7',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.35)]',
  },
  {
    id: 'pink_noise',
    name: 'Pink Noise',
    description: 'Steady soothing sound for deep study & focus',
    icon: Radio,
    type: 'pink_noise',
    accent: '#FFB800',
    glow: 'shadow-[0_0_20px_rgba(255,184,0,0.35)]',
  },
];

export const SoundscapePlayer: React.FC = () => {
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Web Audio Context & Synthesizer references
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const activeNodesRef = useRef<any[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  const initAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
      const gain = audioCtxRef.current.createGain();
      gain.gain.value = volume;
      gain.connect(audioCtxRef.current.destination);
      gainNodeRef.current = gain;
    } else if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const stopCurrentSound = () => {
    activeNodesRef.current.forEach((node) => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {
        // Safe catch
      }
    });
    activeNodesRef.current = [];
  };

  const playTrack = (track: SoundscapeTrack) => {
    initAudioContext();
    stopCurrentSound();

    const ctx = audioCtxRef.current;
    const masterGain = gainNodeRef.current;
    if (!ctx || !masterGain) return;

    if (track.type === 'synth432') {
      // 432Hz Harmonic Sine Synth
      const osc = ctx.createOscillator();
      const subOsc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(432, ctx.currentTime);

      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(216, ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);

      const localGain = ctx.createGain();
      localGain.gain.setValueAtTime(0.35, ctx.currentTime);

      osc.connect(localGain);
      subOsc.connect(localGain);
      localGain.connect(filter);
      filter.connect(masterGain);

      osc.start();
      subOsc.start();
      activeNodesRef.current.push(osc, subOsc, filter, localGain);
    } else {
      // Noise-based Nature Generators (Rain, Ocean, Forest Breeze, Pink Noise)
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      if (track.type === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);
      } else if (track.type === 'ocean') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(450, ctx.currentTime);
        filter.Q.setValueAtTime(1.5, ctx.currentTime);
      } else if (track.type === 'breeze') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, ctx.currentTime);
      } else {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, ctx.currentTime);
      }

      const localGain = ctx.createGain();
      localGain.gain.setValueAtTime(0.4, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(localGain);
      localGain.connect(masterGain);

      whiteNoise.start();
      activeNodesRef.current.push(whiteNoise, filter, localGain);
    }

    setActiveTrackId(track.id);
    setIsPlaying(true);
  };

  const togglePlay = (track: SoundscapeTrack) => {
    if (activeTrackId === track.id && isPlaying) {
      stopCurrentSound();
      setIsPlaying(false);
    } else {
      playTrack(track);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(newVol, audioCtxRef.current.currentTime);
    }
  };

  const handleSetTimer = (minutes: number | null) => {
    setTimerMinutes(minutes);
    if (minutes) {
      setTimeLeft(minutes * 60);
    } else {
      setTimeLeft(null);
    }
  };

  useEffect(() => {
    if (timeLeft !== null && isPlaying) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            stopCurrentSound();
            setIsPlaying(false);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timeLeft, isPlaying]);

  useEffect(() => {
    return () => {
      stopCurrentSound();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0C0C1E] via-[#080816] to-[#04040D] border border-[#25253D] p-6 font-mono clip-stealth-notch shadow-[0_0_25px_rgba(0,240,255,0.15)] transition-all">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-black/90 border border-[#00F0FF] text-[#00F0FF] flex items-center justify-center clip-badge-poly shadow-[0_0_12px_rgba(0,240,255,0.4)]">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#EDEDED] tracking-tight flex items-center gap-2">
              Focus Sounds & Synthesizer
              <span className="text-[10px] px-2 py-0.5 bg-black/80 text-[#00F0FF] border border-[#00F0FF]/40 clip-badge-poly">
                432HZ / REAL-TIME
              </span>
            </h1>
            <p className="text-xs text-[#A1A1AA] font-sans">
              Calming background audio synthesizers and nature frequencies engineered for deep study and focus.
            </p>
          </div>
        </div>

        {/* Global Controls: Volume & Timer */}
        <div className="mt-5 pt-4 border-t border-[#25253D] flex flex-wrap items-center justify-between gap-4 font-mono">
          {/* Master Volume */}
          <div className="flex items-center space-x-3">
            <Volume2 className="w-4 h-4 text-[#00F0FF]" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-32 sm:w-40 h-1.5 bg-[#25253D] accent-[#00F0FF] cursor-pointer"
            />
            <span className="text-xs text-[#A1A1AA]">{Math.round(volume * 100)}%</span>
          </div>

          {/* Focus Timer */}
          <div className="flex items-center space-x-2 text-xs">
            <Clock className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span className="text-[#A1A1AA]">Timer:</span>
            {[10, 25, 45].map((mins) => (
              <button
                key={mins}
                onClick={() => handleSetTimer(timerMinutes === mins ? null : mins)}
                className={`px-2.5 py-1 border text-[11px] clip-badge-poly transition-all cursor-pointer ${
                  timerMinutes === mins
                    ? 'bg-[#00F0FF] text-black font-bold border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                    : 'bg-black/80 text-[#A1A1AA] hover:text-[#00F0FF] border-[#25253D] hover:border-[#00F0FF]'
                }`}
              >
                {mins}m
              </button>
            ))}
            {timeLeft !== null && (
              <span className="ml-2 text-[#00F0FF] font-bold px-2 py-0.5 bg-black border border-[#00F0FF] clip-badge-poly shadow-[0_0_8px_rgba(0,240,255,0.3)]">
                {formatTimer(timeLeft)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sound Cards Grid with Polygon Aesthetics & Floating Hover Physics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
        {TRACKS.map((track) => {
          const Icon = track.icon;
          const isCurrent = activeTrackId === track.id;
          const isCurrentPlaying = isCurrent && isPlaying;

          return (
            <div
              key={track.id}
              onClick={() => togglePlay(track)}
              className={`p-5 border transition-all duration-300 cursor-pointer flex items-center justify-between clip-cyber-card hover:translate-y-[-2px] ${
                isCurrentPlaying
                  ? `bg-black/90 border-[${track.accent}] ${track.glow}`
                  : 'bg-gradient-to-br from-[#0E0E1F] to-[#070712] hover:bg-[#121226] border-[#25253D] hover:border-[#3D3D65]'
              }`}
              style={{
                borderColor: isCurrentPlaying ? track.accent : undefined,
              }}
            >
              <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                <div
                  className="w-10 h-10 border flex items-center justify-center shrink-0 clip-badge-poly transition-all"
                  style={{
                    backgroundColor: isCurrentPlaying ? track.accent : 'rgba(0,0,0,0.8)',
                    color: isCurrentPlaying ? '#000000' : track.accent,
                    borderColor: track.accent,
                    boxShadow: isCurrentPlaying ? `0 0 15px ${track.accent}66` : 'none',
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xs sm:text-sm font-bold text-[#EDEDED] truncate">
                      {track.name}
                    </h3>
                    {isCurrentPlaying && (
                      <div className="flex items-center gap-0.5">
                        <span className="w-1 h-3 rounded-full animate-bounce" style={{ backgroundColor: track.accent, animationDelay: '0ms' }} />
                        <span className="w-1 h-4 rounded-full animate-bounce" style={{ backgroundColor: track.accent, animationDelay: '150ms' }} />
                        <span className="w-1 h-2 rounded-full animate-bounce" style={{ backgroundColor: track.accent, animationDelay: '300ms' }} />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-[#A1A1AA] mt-0.5 truncate font-sans">
                    {track.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="p-2.5 border ml-3 clip-badge-poly transition-all cursor-pointer"
                style={{
                  backgroundColor: isCurrentPlaying ? track.accent : 'rgba(0,0,0,0.9)',
                  color: isCurrentPlaying ? '#000000' : track.accent,
                  borderColor: track.accent,
                }}
                aria-label={isCurrentPlaying ? 'Pause sound' : 'Play sound'}
              >
                {isCurrentPlaying ? (
                  <Pause className="w-4 h-4 text-black" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
