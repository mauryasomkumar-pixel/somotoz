import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Square, CloudRain, Waves, Trees, BellRing, Wind, Clock, Sparkles, Activity } from 'lucide-react';
import { soundSynth } from '../lib/soundSynthesizer';

interface SoundscapePlayerProps {
  onClose?: () => void;
}

const SOUNDSCAPES = [
  {
    id: 'rain' as const,
    name: 'Gentle Rain',
    desc: 'Soft steady acoustic rainfall on leaves',
    icon: CloudRain,
    color: 'from-cyan-950/60 to-slate-900 border-cyan-500/40 text-cyan-400',
  },
  {
    id: 'ocean' as const,
    name: 'Ocean Waves',
    desc: 'Rhythmic tidal ebb & low-frequency flow',
    icon: Waves,
    color: 'from-blue-950/60 to-slate-900 border-blue-500/40 text-blue-400',
  },
  {
    id: 'forest' as const,
    name: 'Whispering Forest',
    desc: 'Mild pine breeze & subtle acoustic flora',
    icon: Trees,
    color: 'from-emerald-950/60 to-slate-900 border-emerald-500/40 text-emerald-400',
  },
  {
    id: 'bowl' as const,
    name: 'Tibetan Singing Bowl',
    desc: '432Hz deep meditative harmonic tone',
    icon: BellRing,
    color: 'from-amber-950/60 to-slate-900 border-amber-500/40 text-amber-400',
  },
  {
    id: 'whitenoise' as const,
    name: 'Pink Noise Flow',
    desc: 'Balanced acoustic focus masking & phase jitter',
    icon: Wind,
    color: 'from-purple-950/60 to-slate-900 border-purple-500/40 text-purple-400',
  },
];

export const SoundscapePlayer: React.FC<SoundscapePlayerProps> = () => {
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(0.5);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    setActiveSound(soundSynth.getCurrentType());
  }, []);

  // Timer countdown handler
  useEffect(() => {
    if (remainingSeconds === null) return;
    if (remainingSeconds <= 0) {
      soundSynth.stop();
      setActiveSound(null);
      setTimerMinutes(null);
      setRemainingSeconds(null);
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds]);

  const handleToggleSound = (type: 'rain' | 'ocean' | 'forest' | 'bowl' | 'whitenoise') => {
    if (activeSound === type) {
      soundSynth.stop();
      setActiveSound(null);
      setRemainingSeconds(null);
    } else {
      soundSynth.play(type);
      setActiveSound(type);
      if (timerMinutes) {
        setRemainingSeconds(timerMinutes * 60);
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    soundSynth.setVolume(val);
  };

  const handleSetTimer = (mins: number | null) => {
    setTimerMinutes(mins);
    if (mins && activeSound) {
      setRemainingSeconds(mins * 60);
    } else {
      setRemainingSeconds(null);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 font-sans">
      {/* Header */}
      <div className="bg-[#0d1322] rounded-2xl p-6 border border-slate-800/90 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Neural Soundscapes & Acoustics</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Real-time Web Audio API synthesized nature acoustics to eliminate distractions and anchor engineering focus.
          </p>
        </div>

        {/* Master Control Bar */}
        <div className="flex items-center space-x-4 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center space-x-2">
            {volume === 0 ? (
              <VolumeX className="w-4 h-4 text-slate-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            )}
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              title="Volume"
            />
          </div>

          {activeSound && (
            <button
              onClick={() => {
                soundSynth.stop();
                setActiveSound(null);
                setRemainingSeconds(null);
              }}
              className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-rose-400" />
              <span>Stop Synth</span>
            </button>
          )}
        </div>
      </div>

      {/* Soundscape Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SOUNDSCAPES.map((item) => {
          const Icon = item.icon;
          const isPlaying = activeSound === item.id;

          return (
            <div
              key={item.id}
              onClick={() => handleToggleSound(item.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                isPlaying
                  ? 'bg-gradient-to-br ' + item.color + ' ring-1 ring-cyan-400/50 shadow-lg shadow-cyan-500/10'
                  : 'bg-[#0d1322] hover:bg-slate-900 border-slate-800 shadow-md'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isPlaying ? 'bg-slate-950 border border-cyan-500/40 text-cyan-300 shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      isPlaying ? 'bg-cyan-400 text-slate-950 shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-400'
                    }`}
                  >
                    {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                  </div>
                </div>

                <h3 className="font-semibold text-white mt-3 text-sm sm:text-base font-mono">{item.name}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
              </div>

              {isPlaying && (
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-cyan-300">
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    OSCILLATORS ACTIVE
                  </span>
                  {remainingSeconds !== null && (
                    <span className="font-mono text-slate-200 bg-slate-950 px-2 py-0.5 rounded-md text-[11px] border border-slate-800">
                      {formatTimer(remainingSeconds)}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Focus Session Timer Presets */}
      <div className="bg-[#0d1322] rounded-2xl p-5 border border-slate-800/90 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
        <div className="flex items-center space-x-2 text-slate-300 text-xs sm:text-sm">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold">Deep Focus Session Timer:</span>
          {remainingSeconds !== null && (
            <span className="font-mono font-bold text-cyan-300">
              ({formatTimer(remainingSeconds)})
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {[5, 15, 30, 45].map((mins) => (
            <button
              key={mins}
              onClick={() => handleSetTimer(timerMinutes === mins ? null : mins)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                timerMinutes === mins
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {mins}m
            </button>
          ))}
          {timerMinutes && (
            <button
              onClick={() => handleSetTimer(null)}
              className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
