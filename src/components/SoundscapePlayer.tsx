import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, CloudRain, Waves, Wind, Radio, Sparkles, Moon, Clock, Terminal, Activity } from 'lucide-react';

interface SoundscapeTrack {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  type: 'rain' | 'ocean' | 'breeze' | 'synth432' | 'pink_noise';
}

const TRACKS: SoundscapeTrack[] = [
  {
    id: 'rain',
    name: 'Gentle Rain',
    description: 'Soft peaceful rain sounds for relaxation',
    icon: CloudRain,
    type: 'rain',
  },
  {
    id: 'ocean',
    name: 'Ocean Waves',
    description: 'Gentle relaxing sea waves for calm thinking',
    icon: Waves,
    type: 'ocean',
  },
  {
    id: 'breeze',
    name: 'Whispering Forest',
    description: 'Peaceful breeze and soothing rustling leaves',
    icon: Wind,
    type: 'breeze',
  },
  {
    id: 'synth432',
    name: 'Singing Bowl',
    description: 'Deep meditative relaxing harmonic frequency',
    icon: Sparkles,
    type: 'synth432',
  },
  {
    id: 'pink_noise',
    name: 'Pink Noise',
    description: 'Steady soothing sound for deep study & focus',
    icon: Radio,
    type: 'pink_noise',
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
      <div className="bg-[#0A0A0A] border border-[#262626] hover:border-[#00FF41] shadow-[4px_4px_0px_0px_#141414] p-6 font-mono transition-all">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-9 h-9 bg-black border border-[#00FF41] text-[#00FF41] flex items-center justify-center shadow-[2px_2px_0px_0px_#00FF41]">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#EDEDED] tracking-tight">
              Focus Sounds & Music
            </h1>
            <p className="text-xs text-[#737373] font-sans">
              Calming background music and nature sounds to help you relax, study, and focus.
            </p>
          </div>
        </div>

        {/* Global Controls: Volume & Timer */}
        <div className="mt-5 pt-4 border-t border-[#262626] flex flex-wrap items-center justify-between gap-4 font-mono">
          {/* Master Volume */}
          <div className="flex items-center space-x-3">
            <Volume2 className="w-4 h-4 text-[#00FF41]" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-32 sm:w-40 h-1.5 bg-[#262626] accent-[#00FF41] cursor-pointer"
            />
            <span className="text-xs text-[#A1A1AA]">{Math.round(volume * 100)}%</span>
          </div>

          {/* Focus Timer */}
          <div className="flex items-center space-x-2 text-xs">
            <Clock className="w-3.5 h-3.5 text-[#00FF41]" />
            <span className="text-[#737373]">Timer:</span>
            {[10, 25, 45].map((mins) => (
              <button
                key={mins}
                onClick={() => handleSetTimer(timerMinutes === mins ? null : mins)}
                className={`px-2.5 py-1 border text-[11px] transition-all cursor-pointer ${
                  timerMinutes === mins
                    ? 'bg-[#00FF41] text-black font-bold border-[#00FF41]'
                    : 'bg-black text-[#A1A1AA] hover:text-[#00FF41] border-[#262626] hover:border-[#00FF41]'
                }`}
              >
                {mins}m
              </button>
            ))}
            {timeLeft !== null && (
              <span className="ml-2 text-[#00FF41] font-bold px-2 py-0.5 bg-black border border-[#262626]">
                {formatTimer(timeLeft)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sound Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
        {TRACKS.map((track) => {
          const Icon = track.icon;
          const isCurrent = activeTrackId === track.id;
          const isCurrentPlaying = isCurrent && isPlaying;

          return (
            <div
              key={track.id}
              onClick={() => togglePlay(track)}
              className={`p-5 border transition-all cursor-pointer flex items-center justify-between shadow-[2px_2px_0px_0px_#141414] hover:shadow-[3px_3px_0px_0px_#00FF41] ${
                isCurrentPlaying
                  ? 'bg-black border-[#00FF41]'
                  : 'bg-[#0A0A0A] hover:bg-[#111111] border-[#262626] hover:border-[#00FF41]'
              }`}
            >
              <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                <div
                  className={`w-10 h-10 border flex items-center justify-center shrink-0 transition-colors ${
                    isCurrentPlaying
                      ? 'bg-[#00FF41] text-black border-[#00FF41]'
                      : 'bg-black text-[#00FF41] border-[#262626]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xs sm:text-sm font-bold text-[#EDEDED] truncate">
                      {track.name}
                    </h3>
                    {isCurrentPlaying && (
                      <span className="w-2 h-2 bg-[#00FF41] animate-pulse inline-block" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#737373] mt-0.5 truncate font-sans">
                    {track.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className={`p-2.5 border ml-3 transition-colors ${
                  isCurrentPlaying
                    ? 'bg-[#00FF41] text-black border-[#00FF41]'
                    : 'bg-black text-[#EDEDED] border-[#262626]'
                }`}
                aria-label={isCurrentPlaying ? 'Pause sound' : 'Play sound'}
              >
                {isCurrentPlaying ? (
                  <Pause className="w-4 h-4 text-black" />
                ) : (
                  <Play className="w-4 h-4 text-[#00FF41]" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
