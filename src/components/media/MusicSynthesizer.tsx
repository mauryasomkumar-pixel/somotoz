import React, { useState, useRef, useCallback, memo } from 'react';
import { Music, Download, Pause, Play } from 'lucide-react';
import { ChatMediaData } from '../../types';
import { downloadMelodyWav } from '../../utils/audioExport';

export const MusicSynthesizer = memo<{ media: ChatMediaData }>(({ media }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeNoteIdx, setActiveNoteIdx] = useState<number | null>(null);
  const [oscType, setOscType] = useState<OscillatorType>('sine');
  const [tempo, setTempo] = useState<number>(media.tempo || 120);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const isCancelledRef = useRef<boolean>(false);

  const notes = media.audioNotes || [
    { freq: 261.63, duration: 0.4, type: 'sine' },
    { freq: 293.66, duration: 0.4, type: 'sine' },
    { freq: 329.63, duration: 0.6, type: 'triangle' },
    { freq: 392.0, duration: 0.6, type: 'sine' },
    { freq: 440.0, duration: 0.8, type: 'sine' },
    { freq: 523.25, duration: 1.0, type: 'triangle' },
  ];

  const stopAudio = useCallback(() => {
    isCancelledRef.current = true;
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setIsPlaying(false);
    setActiveNoteIdx(null);
  }, []);

  const playSequence = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;
      isCancelledRef.current = false;
      setIsPlaying(true);

      const tempoScale = 120 / tempo;

      for (let i = 0; i < notes.length; i++) {
        if (isCancelledRef.current) break;
        const note = notes[i];
        setActiveNoteIdx(i);

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = oscType || (note.type as OscillatorType) || 'sine';
        osc.frequency.setValueAtTime(note.freq, ctx.currentTime);

        const dur = (note.duration || 0.4) * tempoScale;
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + dur);

        await new Promise((r) => setTimeout(r, dur * 1000));
      }

      if (!isCancelledRef.current) {
        setIsPlaying(false);
        setActiveNoteIdx(null);
      }
    } catch (e) {
      console.error('Audio synth error:', e);
      setIsPlaying(false);
      setActiveNoteIdx(null);
    }
  };

  const handleDownloadWav = () => {
    downloadMelodyWav(notes, media.genre || 'Cyber Ambient', tempo);
  };

  return (
    <div className="bg-gradient-to-b from-[#0C0C1C] via-[#080814] to-[#04040A] border border-[#FFB800]/60 clip-cyber-card overflow-hidden shadow-[0_0_25px_rgba(255,184,0,0.15)] font-mono">
      <div className="px-3 py-2 bg-[#080814] border-b border-[#25253D] flex flex-wrap items-center justify-between gap-2 text-xs text-[#EDEDED]">
        <div className="flex items-center space-x-2">
          <span className="flex items-center gap-1.5 text-[#FFB800] font-semibold">
            <Music className="w-3.5 h-3.5 text-[#FFB800]" />
            Music Synthesizer ({media.genre || 'Cyber Synth'})
          </span>
          <span className="text-[10px] text-[#A1A1AA] bg-black/60 px-2 py-0.5 clip-badge-poly border border-[#2D2D45] hidden sm:inline">
            • 432Hz Harmonic Engine
          </span>
        </div>

        <div className="flex items-center space-x-1.5 flex-wrap">
          <select
            value={oscType}
            onChange={(e) => setOscType(e.target.value as OscillatorType)}
            className="px-2 py-1 bg-black/80 border border-[#2D2D45] text-[#A1A1AA] hover:text-[#FFB800] text-[10px] outline-none cursor-pointer clip-badge-poly"
            title="Oscillator Waveform"
            aria-label="Oscillator Waveform"
          >
            <option value="sine">Sine Wave</option>
            <option value="triangle">Triangle Wave</option>
            <option value="sawtooth">Sawtooth Wave</option>
            <option value="square">Square Wave</option>
          </select>

          <button
            onClick={() => setTempo((prev) => (prev === 120 ? 140 : prev === 140 ? 90 : 120))}
            className="px-2 py-1 bg-black/80 hover:bg-[#18182E] border border-[#2D2D45] hover:border-[#FFB800] text-[#A1A1AA] hover:text-[#FFB800] text-[10px] flex items-center gap-1 transition-colors cursor-pointer clip-badge-poly"
            title="Adjust tempo BPM"
          >
            <span>{tempo} BPM</span>
          </button>

          <button
            onClick={handleDownloadWav}
            className="px-3 py-1 bg-[#FFB800] hover:bg-[#E6A600] text-black font-bold text-[11px] border border-[#FFB800] clip-badge-poly shadow-[0_0_12px_rgba(255,184,0,0.4)] flex items-center gap-1 transition-all cursor-pointer active:scale-95"
            title="Synthesize and download standard 16-bit PCM WAV audio file"
          >
            <Download className="w-3 h-3 text-black" />
            <span>Download Audio (.wav)</span>
          </button>
        </div>
      </div>

      <div className="p-4 bg-[#030308] flex flex-col items-center justify-center gap-3">
        <div className="flex items-end justify-center gap-1.5 h-16 w-full max-w-sm px-4">
          {notes.map((n, i) => {
            const isActive = activeNoteIdx === i;
            const heightPercent = Math.min(100, Math.max(20, (n.freq / 600) * 100));
            return (
              <div
                key={i}
                style={{ height: `${heightPercent}%` }}
                className={`flex-1 transition-all duration-75 border clip-badge-poly ${
                  isActive
                    ? 'bg-[#FFB800] border-[#FFB800] shadow-[0_0_12px_#FFB800]'
                    : 'bg-[#141424] border-[#25253D]'
                }`}
                title={`Note: ${n.freq.toFixed(1)} Hz (${n.duration}s)`}
              />
            );
          })}
        </div>

        <button
          onClick={playSequence}
          className={`px-5 py-2.5 font-bold text-xs flex items-center space-x-2 border transition-all cursor-pointer clip-badge-poly shadow-[0_0_15px_rgba(255,184,0,0.3)] active:scale-95 ${
            isPlaying
              ? 'bg-rose-500 hover:bg-rose-400 text-black border-rose-500'
              : 'bg-[#FFB800] hover:bg-[#E6A600] text-black border-[#FFB800]'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 text-black" />
              <span>Stop Synthesizer</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-black" />
              <span>Play Synthesizer</span>
            </>
          )}
        </button>
      </div>

      <div className="px-3 py-1.5 bg-[#080814] border-t border-[#25253D] text-[11px] font-mono text-[#737373] flex justify-between items-center gap-2">
        <span className="truncate">
          Prompt: <span className="text-[#EDEDED]">{media.prompt}</span>
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[#FFB800]">{notes.length} Harmonics</span>
          <span className="px-2 py-0.5 bg-black border border-[#2D2D45] text-[9px] text-[#FFB800] font-bold clip-badge-poly">
            SOMOTOZ
          </span>
        </div>
      </div>
    </div>
  );
});

export default MusicSynthesizer;
