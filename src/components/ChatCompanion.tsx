import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Sparkles, Bot, User, Globe, RefreshCw, BookPlus, MessageSquare,
  Image as ImageIcon, Film, Music, Play, Pause, Download, Copy, Check,
  Volume2, VolumeX, Maximize2, Zap, Terminal, Activity, Eye, Sliders
} from 'lucide-react';
import { ChatMessage, ChatRole, GenerationMode, ChatMediaData, JournalEntry } from '../types';

interface ChatCompanionProps {
  initialReflection?: JournalEntry | null;
  onSaveToJournal?: (content: string, title?: string) => void;
}

const MODES: Array<{
  id: GenerationMode;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badge: string;
}> = [
  {
    id: 'text',
    label: 'Text Intelligence',
    desc: 'Reasoning, systems architecture, analysis & mindful guidance',
    icon: MessageSquare,
    color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40',
    badge: 'LLM-3.7',
  },
  {
    id: 'image',
    label: 'Vector Visuals',
    desc: 'Generate futuristic vector graphics, diagrams & SVG art',
    icon: ImageIcon,
    color: 'text-purple-400 border-purple-500/40 bg-purple-950/40',
    badge: 'GEN-ART',
  },
  {
    id: 'video',
    label: 'Neural Video',
    desc: 'Synthesize cinematic motion keyframes & scene simulations',
    icon: Film,
    color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40',
    badge: 'MOTION-FX',
  },
  {
    id: 'music',
    label: 'Audio Synth',
    desc: 'Procedural harmonic synthesis & Web Audio melody composer',
    icon: Music,
    color: 'text-amber-400 border-amber-500/40 bg-amber-950/40',
    badge: 'SYNTH-WAVE',
  },
];

const ROLES: Array<{
  id: ChatRole;
  name: string;
  desc: string;
  icon: string;
}> = [
  {
    id: 'ai_engineer',
    name: 'AI Systems Architect',
    desc: 'Deep technical, systems design & multimodal AI engineering',
    icon: '⚡',
  },
  {
    id: 'empathetic_listener',
    name: 'Empathetic Companion',
    desc: 'Warm emotional validation & mindful reflection presence',
    icon: '🌿',
  },
  {
    id: 'cognitive_reframer',
    name: 'Cognitive Reframer',
    desc: 'CBT-informed perspective & distortion untangler',
    icon: '🧠',
  },
  {
    id: 'socratic_guide',
    name: 'Socratic Inquirer',
    desc: 'Insightful open questions to uncover core truth',
    icon: '🧭',
  },
  {
    id: 'mindfulness_coach',
    name: 'Mindfulness Guide',
    desc: 'Somatic awareness, grounding & presence practices',
    icon: '✨',
  },
];

export const ChatCompanion: React.FC<ChatCompanionProps> = ({
  initialReflection,
  onSaveToJournal,
}) => {
  const [selectedMode, setSelectedMode] = useState<GenerationMode>('text');
  const [selectedRole, setSelectedRole] = useState<ChatRole>('ai_engineer');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'model',
      content: initialReflection
        ? `⚡ **Somotoz Multimodal Environment Initialized**.\n\nWorking memory loaded with reflection: **"${initialReflection.title}"**.\nSelect any mode below (**Text**, **Image**, **Video**, or **Music**) to synthesize responses.`
        : `⚡ **Welcome to Somotoz Multimodal Intelligence**.\n\nHow can I engineer or reflect with you today? You can converse with text reasoning, generate responsive SVG illustrations, storyboard cinematic video simulations, or compose procedural Web Audio synth melodies.`,
      timestamp: Date.now(),
      mode: 'text',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useSearchGrounding, setUseSearchGrounding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isLoading) return;

    setErrorMsg(null);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      mode: selectedMode,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const payloadMessages = newMessages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages.length > 0 ? payloadMessages : [{ role: 'user', content: text }],
          mode: selectedMode,
          role: selectedRole,
          contextReflection: initialReflection ? `${initialReflection.title}\n${initialReflection.content}` : undefined,
          useSearchGrounding: useSearchGrounding,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to receive response from Somotoz.');
      }

      const modelMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: data.reply,
        timestamp: Date.now(),
        mode: data.mode || selectedMode,
        media: data.media,
        sources: data.sources && data.sources.length > 0 ? data.sources : undefined,
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMsg(err.message || 'Unable to connect with Somotoz engine.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        content: `⚡ **Session Reset**. Memory buffer cleared. Ready for next prompt or media generation.`,
        timestamp: Date.now(),
        mode: 'text',
      },
    ]);
    setErrorMsg(null);
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-6rem)] p-3 sm:p-6 flex flex-col gap-3 font-sans">
      {/* Header Bar */}
      <div className="bg-[#0d1322] rounded-2xl p-4 border border-slate-800/90 shadow-xl flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight font-mono">
                  Somotoz Multimodal Workspace
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                  v2.4
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Multimodal Generation (Text • Vector Art • Video Simulation • Procedural Audio)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Grounding toggle */}
            <button
              onClick={() => setUseSearchGrounding(!useSearchGrounding)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium border flex items-center space-x-1.5 transition-all cursor-pointer ${
                useSearchGrounding
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-xs'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
              title="Ground response with live web research"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>{useSearchGrounding ? 'Search Grounded (ON)' : 'Search Grounding'}</span>
            </button>

            <button
              onClick={handleReset}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
              title="Reset conversation"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Multimodal Mode Selector Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
          {MODES.map((mode) => {
            const isSelected = selectedMode === mode.id;
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? `${mode.color} ring-1 ring-cyan-400/40 shadow-lg shadow-cyan-500/10`
                    : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-300' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    <span className="text-xs font-semibold font-mono text-slate-200">{mode.label}</span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950/80 text-slate-400 border border-slate-800">
                    {mode.badge}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 line-clamp-1 mt-1 font-sans">{mode.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Persona/Role Selector for Text Mode */}
        {selectedMode === 'text' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar pt-1 font-mono">
            <span className="text-slate-500 text-[11px] shrink-0 mr-1 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-cyan-400" /> Persona:
            </span>
            {ROLES.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium shrink-0 transition-colors cursor-pointer flex items-center space-x-1 ${
                  selectedRole === role.id
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-xs'
                    : 'bg-slate-900/90 text-slate-400 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>{role.icon}</span>
                <span>{role.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 bg-[#0d1322] rounded-2xl border border-slate-800/90 shadow-xl p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-semibold shadow-md ${
                  isUser
                    ? 'bg-gradient-to-br from-cyan-500 to-indigo-600 text-white'
                    : 'bg-slate-900 border border-slate-800 text-cyan-400'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-tr-xs shadow-md shadow-cyan-500/10'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-xs shadow-lg'
                }`}
              >
                {/* Text Content */}
                <div className="prose prose-invert prose-sm max-w-none text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>

                {/* Inline Media Rendering */}
                {msg.media && (
                  <div className="mt-4 pt-3 border-t border-slate-800/90">
                    {msg.media.type === 'image' && <InlineImageViewer media={msg.media} />}
                    {msg.media.type === 'video' && <InlineVideoSimulator media={msg.media} />}
                    {msg.media.type === 'music' && <InlineAudioSynthesizer media={msg.media} />}
                  </div>
                )}

                {/* Grounding citations if present */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-800/80 text-xs text-slate-400 space-y-1 font-mono">
                    <p className="font-semibold text-[11px] text-cyan-400 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-cyan-400" />
                      Grounded Citations:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((s, idx) => (
                        <a
                          key={idx}
                          href={s.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-cyan-400 hover:text-cyan-300 hover:underline text-[11px] truncate max-w-[240px]"
                        >
                          {s.title || s.uri}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save model takeaway to journal action */}
                {!isUser && msg.id !== 'welcome' && onSaveToJournal && (
                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex justify-end">
                    <button
                      onClick={() => onSaveToJournal(msg.content, 'Somotoz AI Note')}
                      className="text-[11px] font-mono font-medium text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 hover:underline cursor-pointer"
                    >
                      <BookPlus className="w-3 h-3" />
                      <span>Save as Journal Log</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Futuristic "Generating..." loading animation */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 flex items-center justify-center shadow-xs">
              <Bot className="w-4 h-4 animate-spin text-cyan-400" />
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl rounded-tl-xs p-4 text-sm text-slate-300 space-y-2 max-w-md w-full">
              <div className="flex items-center justify-between font-mono text-[11px] text-cyan-400">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                  [COMPUTING NEURAL TENSORS]
                </span>
                <span className="text-slate-500 uppercase">{selectedMode} PIPELINE</span>
              </div>
              
              {/* Pulsing Quantum Skeleton */}
              <div className="space-y-2 pt-1">
                <div className="h-3.5 bg-gradient-to-r from-cyan-900/40 via-purple-900/40 to-cyan-900/40 rounded-md w-full animate-pulse" />
                <div className="h-3 bg-slate-800/60 rounded-md w-4/5 animate-pulse" />
                <div className="h-3 bg-slate-800/60 rounded-md w-3/5 animate-pulse" />
              </div>

              <div className="flex items-center space-x-1.5 pt-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-[11px] font-mono text-slate-400">
                  Synthesizing {selectedMode.toUpperCase()} response stream...
                </span>
              </div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs rounded-xl font-mono">
            {errorMsg}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form with Intuitive Multimodal Icons */}
      <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
        <div className="relative flex items-center bg-[#0d1322] border border-slate-800 focus-within:border-cyan-500/80 rounded-2xl shadow-xl transition-all">
          {/* Active Mode Tag */}
          <div className="hidden sm:flex items-center pl-3 pr-1 text-xs font-mono text-cyan-400 shrink-0">
            <span className="px-2 py-1 rounded-md bg-cyan-950/80 border border-cyan-500/30 text-[10px] uppercase flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {selectedMode}
            </span>
          </div>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              selectedMode === 'image'
                ? "Describe the visual vector illustration to generate (e.g., 'Cyberpunk neural network mandala')..."
                : selectedMode === 'video'
                ? "Describe the cinematic motion sequence (e.g., 'Anamorphic light trails in Tokyo 2099')..."
                : selectedMode === 'music'
                ? "Describe the melody or track (e.g., 'Lo-fi chillwave meditation synth melody')..."
                : "Ask a technical engineering question, explore concepts, or reflect..."
            }
            disabled={isLoading}
            className="flex-1 px-4 py-3.5 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden font-sans"
          />

          {/* Inline Mode Selector Icons right next to send button */}
          <div className="flex items-center space-x-1 pr-2">
            <button
              type="button"
              onClick={() => setSelectedMode('text')}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                selectedMode === 'text'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
              title="Switch to Text Intelligence"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode('image')}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                selectedMode === 'image'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
              title="Switch to Vector Visuals Generator"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode('video')}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                selectedMode === 'video'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
              title="Switch to Neural Video Synthesis"
            >
              <Film className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode('music')}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                selectedMode === 'music'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
              title="Switch to Audio Synth Melodies"
            >
              <Music className="w-4 h-4" />
            </button>

            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="ml-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 active:scale-95 disabled:opacity-40 text-white rounded-xl text-xs font-mono font-semibold transition-all shadow-md shadow-cyan-500/20 flex items-center space-x-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Execute</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

/**
 * 1. Inline Image / SVG Renderer Component
 */
const InlineImageViewer: React.FC<{ media: ChatMediaData }> = ({ media }) => {
  const [copied, setCopied] = useState(false);

  const handleCopySvg = () => {
    if (!media.svgData) return;
    navigator.clipboard.writeText(media.svgData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSvg = () => {
    if (!media.svgData) return;
    const blob = new Blob([media.svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `somotoz-art-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl bg-slate-950 border border-purple-500/30 overflow-hidden shadow-xl">
      {/* Header bar */}
      <div className="px-3 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
        <span className="flex items-center gap-1.5 text-purple-400 font-semibold">
          <ImageIcon className="w-3.5 h-3.5" />
          Vector Render Engine (SVG)
        </span>
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleCopySvg}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            title="Copy SVG XML"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy SVG'}</span>
          </button>
          <button
            onClick={handleDownloadSvg}
            className="px-2 py-1 rounded bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            title="Download SVG"
          >
            <Download className="w-3 h-3" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="p-3 bg-[#090d16] flex items-center justify-center">
        {media.svgData ? (
          <div
            className="w-full max-h-[400px] flex items-center justify-center rounded-lg overflow-hidden [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[380px] shadow-inner"
            dangerouslySetInnerHTML={{ __html: media.svgData }}
          />
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-500 text-xs font-mono">
            No SVG data available
          </div>
        )}
      </div>

      {/* Prompt Caption */}
      <div className="px-3 py-1.5 bg-slate-900/60 border-t border-slate-800 text-[11px] font-mono text-slate-400 truncate">
        Prompt: <span className="text-purple-300">{media.prompt}</span>
      </div>
    </div>
  );
};

/**
 * 2. Inline Video Simulator Component with Keyframes & Animated Canvas
 */
const InlineVideoSimulator: React.FC<{ media: ChatMediaData }> = ({ media }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const frames = media.videoFrames || [
    'Scene 01: Establishing cyber grid matrix',
    'Scene 02: Particle vector stream flow',
    'Scene 03: Neural convergence climax',
  ];

  useEffect(() => {
    let tick = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw cyber matrix grid
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.lineWidth = 1;
      const gridSize = 24;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw animated dynamic particle wave
      const waveOffset = isPlaying ? tick * 0.05 : 0;
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#10b981';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 12;

      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += 4) {
        const y = canvas.height / 2 + Math.sin(x * 0.02 + waveOffset) * 40 + Math.cos(x * 0.01 - waveOffset * 0.5) * 20;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw floating keyframe nodes
      for (let i = 0; i < frames.length; i++) {
        const nodeX = (canvas.width / (frames.length + 1)) * (i + 1);
        const nodeY = canvas.height / 2 + Math.sin(nodeX * 0.02 + waveOffset) * 40;
        
        ctx.fillStyle = activeFrameIndex === i ? '#34d399' : '#065f46';
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, activeFrameIndex === i ? 8 : 5, 0, Math.PI * 2);
        ctx.fill();
      }

      tick++;
      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, activeFrameIndex, frames.length]);

  // Keyframe stepper when playing
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveFrameIndex((prev) => (prev + 1) % frames.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isPlaying, frames.length]);

  return (
    <div className="rounded-xl bg-slate-950 border border-emerald-500/30 overflow-hidden shadow-xl font-mono">
      <div className="px-3 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <Film className="w-3.5 h-3.5" />
          Neural Motion Player ({media.duration || '0:12'})
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
          4K Neural 60FPS
        </span>
      </div>

      {/* Video Viewport Canvas */}
      <div className="relative bg-[#090d16] flex items-center justify-center overflow-hidden">
        <canvas ref={canvasRef} width={640} height={260} className="w-full h-auto max-h-[260px]" />

        {/* Play / Pause overlay */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-emerald-500/80 hover:bg-emerald-400 text-slate-950 flex items-center justify-center transition-transform hover:scale-110 shadow-lg cursor-pointer"
          title={isPlaying ? 'Pause simulation' : 'Play video simulation'}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>

        <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-slate-950/80 border border-slate-800 text-[10px] text-emerald-300">
          Scene {activeFrameIndex + 1}/{frames.length}
        </div>
      </div>

      {/* Keyframe Timeline Bar */}
      <div className="p-2.5 bg-slate-900/90 border-t border-slate-800 space-y-1.5">
        <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
          <span>Keyframe Breakdown</span>
          <span className="text-emerald-400 text-[10px]">{isPlaying ? 'SIMULATION RUNNING' : 'PAUSED'}</span>
        </div>
        <div className="space-y-1">
          {frames.map((kf, idx) => (
            <div
              key={idx}
              onClick={() => {
                setActiveFrameIndex(idx);
                setIsPlaying(true);
              }}
              className={`px-2 py-1 rounded text-[11px] transition-colors cursor-pointer flex items-center gap-2 ${
                activeFrameIndex === idx
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-950/60 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="truncate">{kf}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * 3. Inline Audio Synthesizer with Real Web Audio API Oscillators
 */
const InlineAudioSynthesizer: React.FC<{ media: ChatMediaData }> = ({ media }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeNoteIndex, setActiveNoteIndex] = useState<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const notes = media.audioNotes || [
    { freq: 261.63, duration: 0.4, type: 'sine' },
    { freq: 293.66, duration: 0.4, type: 'sine' },
    { freq: 329.63, duration: 0.5, type: 'triangle' },
    { freq: 392.00, duration: 0.5, type: 'sine' },
    { freq: 440.00, duration: 0.6, type: 'sine' },
    { freq: 523.25, duration: 0.8, type: 'triangle' },
  ];

  const playSequence = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      setIsPlaying(true);
      let currentTime = ctx.currentTime + 0.05;

      notes.forEach((n, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = (n.type as OscillatorType) || 'sine';
        osc.frequency.setValueAtTime(n.freq, currentTime);

        // Envelope
        gain.gain.setValueAtTime(0.001, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.2, currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + n.duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(currentTime);
        osc.stop(currentTime + n.duration);

        // Visual tracker timeout
        const delayMs = (currentTime - ctx.currentTime) * 1000;
        setTimeout(() => {
          setActiveNoteIndex(idx);
        }, Math.max(0, delayMs));

        currentTime += n.duration;
      });

      const totalDurationMs = (currentTime - ctx.currentTime) * 1000;
      timeoutRef.current = setTimeout(() => {
        setIsPlaying(false);
        setActiveNoteIndex(null);
      }, totalDurationMs);
    } catch (e) {
      console.error('Audio playback failed:', e);
      setIsPlaying(false);
    }
  };

  const stopPlayback = () => {
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsPlaying(false);
    setActiveNoteIndex(null);
  };

  return (
    <div className="rounded-xl bg-slate-950 border border-amber-500/30 overflow-hidden shadow-xl font-mono">
      <div className="px-3 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
          <Music className="w-3.5 h-3.5" />
          Web Audio Neural Synthesizer
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
          {media.genre || 'Cyber Synth'} • {media.tempo || 120} BPM
        </span>
      </div>

      {/* Synthesizer Display & Equalizer Bars */}
      <div className="p-4 bg-[#090d16] flex flex-col items-center justify-center gap-3">
        <div className="flex items-center space-x-1.5 h-12">
          {notes.map((note, idx) => {
            const isActive = activeNoteIndex === idx;
            return (
              <div
                key={idx}
                style={{
                  height: isActive ? '100%' : `${Math.max(20, (note.freq / 600) * 100)}%`,
                }}
                className={`w-3.5 rounded-t-sm transition-all duration-75 ${
                  isActive
                    ? 'bg-amber-400 shadow-lg shadow-amber-400/50 scale-y-110'
                    : 'bg-amber-900/40 hover:bg-amber-800'
                }`}
                title={`${note.freq.toFixed(1)} Hz`}
              />
            );
          })}
        </div>

        {/* Playback Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={isPlaying ? stopPlayback : playSequence}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            <span>{isPlaying ? 'Stop Synth' : 'Play Synthesizer'}</span>
          </button>

          <span className="text-[11px] text-slate-400">
            {notes.length} Oscillators ({media.tempo || 120} BPM)
          </span>
        </div>
      </div>

      <div className="px-3 py-1.5 bg-slate-900/60 border-t border-slate-800 text-[11px] text-slate-400 truncate">
        Composition: <span className="text-amber-300">{media.prompt}</span>
      </div>
    </div>
  );
};
