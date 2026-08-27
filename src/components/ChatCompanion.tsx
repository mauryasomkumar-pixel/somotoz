import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Globe,
  RefreshCw,
  BookPlus,
  MessageSquare,
  Image as ImageIcon,
  Film,
  Music,
  Play,
  Pause,
  Download,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Zap,
  Sliders,
  Smile,
  FileDown,
  FileText,
  Loader2,
  Video,
  Code,
  Languages,
  ArrowDown
} from 'lucide-react';
import { ChatMessage, ChatRole, GenerationMode, ChatMediaData, JournalEntry } from '../types';
import { EmojiPicker } from './EmojiPicker';
import { exportMessageToPdf, exportConversationToPdf } from '../utils/pdfExport';
import { downloadMelodyWav } from '../utils/audioExport';
import {
  downloadSvgImage,
  downloadPngImage,
  downloadCanvasFrame,
  recordAndDownloadCanvasVideo,
  downloadVideoStoryboard
} from '../utils/mediaExport';
import { SLASH_COMMANDS, parseClientInputIntent } from '../utils/commandParser';

interface ChatCompanionProps {
  initialReflection?: JournalEntry | null;
  initialMode?: GenerationMode;
  onSaveToJournal?: (content: string, title?: string) => void;
  onActivityLog?: (mode: GenerationMode, action: string, tokens?: number) => void;
}

const MODES: Array<{
  id: GenerationMode;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
}> = [
  {
    id: 'text',
    label: 'Smart Chat',
    desc: 'Instant streaming token generation, reasoning & logic.',
    icon: MessageSquare,
    badge: 'REALTIME-SSE',
  },
  {
    id: 'image',
    label: 'Image Generator',
    desc: 'High-res scalable vector matrix illustrations.',
    icon: ImageIcon,
    badge: 'VECTOR-SVG',
  },
  {
    id: 'video',
    label: 'Video Generator',
    desc: 'Cinematic keyframe sequences & 60FPS motion FX.',
    icon: Film,
    badge: '60FPS-MOTION',
  },
  {
    id: 'music',
    label: 'Music Generator',
    desc: 'Synthesize harmonic frequencies & procedural audio.',
    icon: Music,
    badge: '432HZ-SYNTH',
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
    name: 'AI Architect',
    desc: 'Engineering, architecture, problem solving, and planning',
    icon: '⚡',
  },
  {
    id: 'empathetic_listener',
    name: 'Empathetic Companion',
    desc: 'Warm, positive, active listener to share thoughts',
    icon: '🌿',
  },
  {
    id: 'cognitive_reframer',
    name: 'Mindset & Clarity',
    desc: 'Constructive reframing and clear perspective',
    icon: '🧠',
  },
  {
    id: 'socratic_guide',
    name: 'Strategic Reasoning',
    desc: 'Probing questions to uncover deep insights',
    icon: '🧭',
  },
  {
    id: 'mindfulness_coach',
    name: 'Focus & Calm',
    desc: 'Calm presence, breathwork, and mindfulness',
    icon: '✨',
  },
];

function isPdfRequestedInText(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return (
    lower.includes('pdf') ||
    lower.includes('export to pdf') ||
    lower.includes('in pdf format') ||
    lower.includes('download pdf') ||
    lower.includes('generate pdf') ||
    lower.includes('save as pdf')
  );
}

function detectLanguageStyle(text: string): string {
  if (!text) return 'Auto-Detection Active';
  if (/[\u0900-\u097F]/.test(text)) {
    return 'हिन्दी (Hindi)';
  }
  const hinglishWords = ['kaisa', 'kaise', 'kya', 'hai', 'bhai', 'mujhe', 'samjhao', 'karna', 'bolo', 'aap', 'mera', 'accha', 'theek', 'shukriya', 'batao'];
  const words = text.toLowerCase().split(/\s+/);
  const matchCount = words.filter(w => hinglishWords.includes(w)).length;
  if (matchCount >= 2) {
    return 'Hinglish (Hindi in Latin)';
  }
  if (/[\u00C0-\u017F]/.test(text) || /\b(hola|gracias|como|estas|bueno|por favor)\b/i.test(text)) {
    return 'Español / Multilingual';
  }
  return 'English / Multilingual';
}

function cleanErrorMessage(raw: string | undefined): string {
  if (!raw) return 'Temporary connection interruption. Please retry.';
  if (raw.includes('503') || raw.includes('high demand') || raw.includes('UNAVAILABLE') || raw.includes('Service Unavailable')) {
    return 'High server demand detected. Engaging rapid fallback engine...';
  }
  if (raw.includes('quota') || raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return 'Rate limit reached. Processing with resilient fallback pipeline...';
  }
  // If raw string is JSON, try parsing
  try {
    const parsed = JSON.parse(raw);
    if (parsed.error?.message) {
      return cleanErrorMessage(parsed.error.message);
    }
    if (parsed.message) {
      return cleanErrorMessage(parsed.message);
    }
  } catch {
    // string is not json
  }
  return raw.replace(/[{}"\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
}

export const ChatCompanion: React.FC<ChatCompanionProps> = ({
  initialReflection,
  initialMode = 'text',
  onSaveToJournal,
  onActivityLog,
}) => {
  const [selectedMode, setSelectedMode] = useState<GenerationMode>(initialMode);
  const [selectedRole, setSelectedRole] = useState<ChatRole>('ai_engineer');

  useEffect(() => {
    if (initialMode) {
      setSelectedMode(initialMode);
    }
  }, [initialMode]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'model',
      content: initialReflection
        ? `⚡ **Somotoz AI Suite Initialized**.\n\nLoaded note context: **"${initialReflection.title}"**.\n\nYou can ask any question, or select dedicated modules above (**Smart Chat**, **Image Generator**, **Video Generator**, **Music Generator**) to generate media and insights with sub-second streaming!`
        : `⚡ **Welcome to Somotoz AI Suite**.\n\nI am your intelligent companion. Navigate our dedicated modules using the tabs above or the quick switcher buttons below:\n\n• **💬 Smart Chat**: Multi-turn reasoning, architecture, coding & conversation in English, Hindi, or Hinglish\n• **✨ Image Generator**: Scalable vector SVG matrix artwork synthesis\n• **🎬 Video Generator**: 60FPS motion keyframe sequences & storyboard rendering\n• **🎵 Music Generator**: 432Hz procedural harmonic synthesis & melodic composition\n\nClick any module tab, use the quick switcher buttons in the input bar, or type your prompt below!`,
      timestamp: Date.now(),
      mode: 'text',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeStreamingText, setActiveStreamingText] = useState<string>('');
  const [activeStreamingId, setActiveStreamingId] = useState<string | null>(null);
  const [useSearchGrounding, setUseSearchGrounding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAutoScrollEnabled = useRef(true);
  const activeStreamBufferRef = useRef<string>('');
  const animFrameIdRef = useRef<number | null>(null);

  // Real-time user intent parsing
  const detectedIntent = useMemo(() => {
    return parseClientInputIntent(inputText, selectedMode);
  }, [inputText, selectedMode]);

  // Autocomplete suggestions when user types "/"
  const filteredCommandSuggestions = useMemo(() => {
    const trimmed = inputText.trim();
    if (!trimmed.startsWith('/')) return [];
    const query = trimmed.toLowerCase();
    return SLASH_COMMANDS.filter((cmd) => {
      if (cmd.command.startsWith(query)) return true;
      if (cmd.aliases.some((a) => a.startsWith(query))) return true;
      return false;
    });
  }, [inputText]);

  // Smooth DOM Auto-Scroll using requestAnimationFrame to prevent layout thrashing
  const performSmoothScroll = useCallback(() => {
    if (!scrollContainerRef.current || !isAutoScrollEnabled.current) return;
    const container = scrollContainerRef.current;
    if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);

    animFrameIdRef.current = requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }, []);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 60;
    isAutoScrollEnabled.current = isAtBottom;
  };

  useEffect(() => {
    performSmoothScroll();
  }, [messages, activeStreamingText, isLoading, performSmoothScroll]);

  // Apply slash command chip or autocomplete item
  const handleApplyCommand = (commandStr: string) => {
    setInputText(`${commandStr} `);
    setShowEmojiPicker(false);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const len = commandStr.length + 1;
        inputRef.current.setSelectionRange(len, len);
      }
    }, 10);
  };

  // Insert Emoji at Cursor Position
  const handleInsertEmoji = (emoji: string) => {
    const input = inputRef.current;
    if (!input) {
      setInputText((prev) => prev + emoji);
      return;
    }
    const start = input.selectionStart ?? inputText.length;
    const end = input.selectionEnd ?? inputText.length;
    const nextText = inputText.substring(0, start) + emoji + inputText.substring(end);
    setInputText(nextText);

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 10);
  };

  // Speech Synthesis Read Aloud
  const handleToggleSpeak = useCallback((msgId: string, text: string) => {
    if (!window.speechSynthesis) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  }, [speakingMsgId]);

  // Unified Command & Intent Submit Handler (<0.1s instant UI feedback)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isLoading) return;

    setErrorMsg(null);
    setShowEmojiPicker(false);
    isAutoScrollEnabled.current = true;

    // Detect pipeline mode from explicit slash command or natural language intent
    const parsed = parseClientInputIntent(text, selectedMode);
    const effectiveMode = parsed.mode;
    const cleanPrompt = parsed.cleanPrompt || text;

    // Synchronize mode state if different
    if (effectiveMode !== selectedMode) {
      setSelectedMode(effectiveMode);
    }

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      mode: effectiveMode,
    };

    const newMessages = [...messages, userMsg];
    // 1. INSTANT STATE UPDATE: User bubble appears in <1ms
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    const modelMsgId = `model-${Date.now()}`;
    setActiveStreamingId(modelMsgId);
    setActiveStreamingText('');
    activeStreamBufferRef.current = '';

    try {
      const payloadMessages = newMessages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      // Try Real-Time SSE Stream Endpoint
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages.length > 0 ? payloadMessages : [{ role: 'user', content: text }],
          mode: effectiveMode,
          role: selectedRole,
          contextReflection: initialReflection ? `${initialReflection.title}\n${initialReflection.content}` : undefined,
          useSearchGrounding: useSearchGrounding || text.toLowerCase().startsWith('/search'),
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to initiate real-time streaming link.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let finalFullText = '';
      let finalMedia: ChatMediaData | undefined = undefined;
      let finalSources: Array<{ title: string; uri: string }> | undefined = undefined;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.replace(/^data:\s*/, '');
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);

            if (data.type === 'chunk') {
              activeStreamBufferRef.current += data.text;
              finalFullText = activeStreamBufferRef.current;
              setActiveStreamingText(activeStreamBufferRef.current);
            } else if (data.type === 'progress') {
              activeStreamBufferRef.current = `⚡ [Synthesizing ${effectiveMode.toUpperCase()} Pipeline...]`;
              setActiveStreamingText(activeStreamBufferRef.current);
            } else if (data.type === 'done') {
              finalFullText = data.fullText || activeStreamBufferRef.current;
              finalMedia = data.media;
              finalSources = data.sources;
            } else if (data.type === 'error') {
              throw new Error(data.error || 'Stream error occurred.');
            }
          } catch (pErr: any) {
            if (pErr?.message?.includes('Stream error')) throw pErr;
          }
        }
      }

      // Finalize Model Message
      const finalizedMsg: ChatMessage = {
        id: modelMsgId,
        role: 'model',
        content: finalFullText || 'System ready.',
        timestamp: Date.now(),
        mode: effectiveMode,
        media: finalMedia,
        sources: finalSources,
      };

      setMessages((prev) => [...prev, finalizedMsg]);

      // Activity Logging
      if (onActivityLog) {
        const estTokens = Math.max(20, Math.round((text.length + (finalFullText?.length || 50)) / 3));
        onActivityLog(
          effectiveMode,
          `Executed: "${text.slice(0, 35)}${text.length > 35 ? '...' : ''}"`,
          estTokens
        );
      }
    } catch (err: any) {
      console.warn('Streaming error, fallback triggered:', err);
      // Fallback to standard endpoint if streaming connection was interrupted
      try {
        const fallbackRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: text }],
            mode: effectiveMode,
            role: selectedRole,
            contextReflection: initialReflection ? `${initialReflection.title}\n${initialReflection.content}` : undefined,
            useSearchGrounding,
          }),
        });

        const fallbackData = await fallbackRes.json();
        if (fallbackRes.ok && fallbackData.reply) {
          const fallbackModelMsg: ChatMessage = {
            id: `model-${Date.now()}`,
            role: 'model',
            content: fallbackData.reply,
            timestamp: Date.now(),
            mode: fallbackData.mode || effectiveMode,
            media: fallbackData.media,
            sources: fallbackData.sources,
          };
          setMessages((prev) => [...prev, fallbackModelMsg]);
        } else {
          setErrorMsg(cleanErrorMessage(err.message || fallbackData?.error));
        }
      } catch (fbErr: any) {
        setErrorMsg(cleanErrorMessage(fbErr.message));
      }
    } finally {
      setIsLoading(false);
      setActiveStreamingId(null);
      setActiveStreamingText('');
      activeStreamBufferRef.current = '';
    }
  };

  const handleReset = useCallback(() => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingMsgId(null);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        content: `⚡ **Session Reset**. Ready for your next prompt or creative task.`,
        timestamp: Date.now(),
        mode: 'text',
      },
    ]);
    setErrorMsg(null);
    setShowEmojiPicker(false);
  }, []);

  const handleExportFullSession = useCallback(() => {
    exportConversationToPdf(messages);
  }, [messages]);

  const handleExportSingleMessage = useCallback((msg: ChatMessage) => {
    const msgIndex = messages.findIndex((m) => m.id === msg.id);
    let promptText: string | undefined = undefined;
    if (msgIndex > 0 && messages[msgIndex - 1].role === 'user') {
      promptText = messages[msgIndex - 1].content;
    }
    exportMessageToPdf(msg, promptText, { mode: msg.mode, role: selectedRole });
  }, [messages, selectedRole]);

  const lastUserMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') return messages[i];
    }
    return null;
  }, [messages]);

  const activeLanguageStyle = useMemo(() => {
    return lastUserMessage ? detectLanguageStyle(lastUserMessage.content) : 'Auto-Detection Active';
  }, [lastUserMessage]);

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-6rem)] p-2 sm:p-5 flex flex-col gap-3 font-sans">
      {/* Header Bar - Memoized Controls */}
      <HeaderBar
        selectedMode={selectedMode}
        activeLanguageStyle={activeLanguageStyle}
        useSearchGrounding={useSearchGrounding}
        onToggleGrounding={() => setUseSearchGrounding(!useSearchGrounding)}
        onExportFullSession={handleExportFullSession}
        onReset={handleReset}
        onSelectMode={(m) => setSelectedMode(m)}
        selectedRole={selectedRole}
        onSelectRole={(r) => setSelectedRole(r)}
      />

      {/* Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 bg-[#0A0A0A] border border-[#262626] shadow-[4px_4px_0px_0px_#141414] p-3 sm:p-4 overflow-y-auto space-y-4 font-sans relative"
      >
        {messages.map((msg, index) => {
          let priorPrompt = '';
          if (msg.role === 'model' && index > 0 && messages[index - 1].role === 'user') {
            priorPrompt = messages[index - 1].content;
          }
          const isPdfExplicitlyRequested = msg.role === 'model' && isPdfRequestedInText(priorPrompt);

          return (
            <ChatMessageItem
              key={msg.id}
              message={msg}
              isSpeaking={speakingMsgId === msg.id}
              isPdfExplicitlyRequested={isPdfExplicitlyRequested}
              onToggleSpeak={handleToggleSpeak}
              onExportSingleMessage={handleExportSingleMessage}
              onSaveToJournal={onSaveToJournal}
            />
          );
        })}

        {/* ACTIVE STREAMING ASSISTANT BUBBLE (Instant Visual Feedback) */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 shrink-0 bg-black border border-[#00FF41] text-[#00FF41] flex items-center justify-center shadow-[2px_2px_0px_0px_#00FF41]">
              <Bot className="w-4 h-4 text-[#00FF41] animate-spin" />
            </div>

            <div className="max-w-[92%] sm:max-w-[82%] p-3.5 sm:p-4 bg-black border border-[#00FF41] text-[#EDEDED] shadow-[3px_3px_0px_0px_#00FF41] space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#00FF41] border-b border-[#1A1A1A] pb-1.5">
                <span className="flex items-center gap-1.5 font-bold">
                  <Zap className="w-3.5 h-3.5 animate-pulse text-[#00FF41]" />
                  STREAMING REAL-TIME RESPONSE
                </span>
                <span className="text-[#737373] uppercase">{selectedMode} MODE</span>
              </div>

              <div className="text-[#EDEDED] whitespace-pre-wrap leading-relaxed min-h-[24px]">
                {activeStreamingText || (
                  <span className="text-[#737373] italic font-mono flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-[#00FF41] rounded-full animate-ping" />
                    Thinking & generating in {activeLanguageStyle}...
                  </span>
                )}
                <span className="inline-block w-2 h-4 bg-[#00FF41] ml-1 animate-pulse align-middle" />
              </div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-mono">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Input Form with Emoji Picker, Dynamic Intent Routing & Quick Slash Chips */}
      <form onSubmit={handleSendMessage} className="relative flex flex-col gap-2 font-mono">
        <EmojiPicker
          isOpen={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
          onSelectEmoji={handleInsertEmoji}
        />

        {/* Slash Command Autocomplete Dropdown Popup */}
        {filteredCommandSuggestions.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#0A0A0A] border-2 border-[#00FF41] shadow-[0_-4px_20px_rgba(0,255,65,0.15)] z-40 max-h-60 overflow-y-auto font-mono">
            <div className="px-3 py-1.5 bg-[#00FF41]/10 border-b border-[#00FF41]/40 flex items-center justify-between text-[11px] text-[#00FF41]">
              <span className="font-bold flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5" />
                AVAILABLE COMMANDS
              </span>
              <span className="text-[10px] text-[#737373]">Click or type to select</span>
            </div>
            <div className="divide-y divide-[#1F1F1F]">
              {filteredCommandSuggestions.map((cmd, idx) => (
                <button
                  key={cmd.command}
                  type="button"
                  onClick={() => handleApplyCommand(cmd.command)}
                  className={`w-full p-2.5 text-left flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                    idx === selectedSuggestionIndex
                      ? 'bg-[#141414] text-[#EDEDED]'
                      : 'hover:bg-[#121212] text-[#A1A1AA]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-base">{cmd.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#00FF41]">{cmd.command}</span>
                        <span className="text-[11px] text-[#EDEDED]">{cmd.label}</span>
                      </div>
                      <p className="text-[11px] text-[#737373] font-sans mt-0.5">{cmd.desc}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#525252] bg-black px-1.5 py-0.5 border border-[#262626] shrink-0">
                    {cmd.syntax}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Slash Action Chips Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[#737373] text-[10px] uppercase font-bold shrink-0 mr-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-[#00FF41]" /> Commands:
          </span>

          <button
            type="button"
            onClick={() => handleApplyCommand('/image')}
            className={`px-2 py-1 text-[11px] font-mono border flex items-center gap-1 transition-all cursor-pointer ${
              detectedIntent.mode === 'image'
                ? 'bg-[#00FF41] text-black font-bold border-[#00FF41] shadow-[2px_2px_0px_0px_#000000]'
                : 'bg-black text-[#A1A1AA] hover:text-[#00FF41] border-[#262626] hover:border-[#00FF41]'
            }`}
            title="Render visual artwork"
          >
            <span>✨</span>
            <span>/image [prompt]</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyCommand('/video')}
            className={`px-2 py-1 text-[11px] font-mono border flex items-center gap-1 transition-all cursor-pointer ${
              detectedIntent.mode === 'video'
                ? 'bg-[#00FF41] text-black font-bold border-[#00FF41] shadow-[2px_2px_0px_0px_#000000]'
                : 'bg-black text-[#A1A1AA] hover:text-[#00FF41] border-[#262626] hover:border-[#00FF41]'
            }`}
            title="Synthesize 60FPS motion sequence"
          >
            <span>🎬</span>
            <span>/video [prompt]</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyCommand('/music')}
            className={`px-2 py-1 text-[11px] font-mono border flex items-center gap-1 transition-all cursor-pointer ${
              detectedIntent.mode === 'music'
                ? 'bg-[#00FF41] text-black font-bold border-[#00FF41] shadow-[2px_2px_0px_0px_#000000]'
                : 'bg-black text-[#A1A1AA] hover:text-[#00FF41] border-[#262626] hover:border-[#00FF41]'
            }`}
            title="Compose 432Hz procedural audio"
          >
            <span>🎵</span>
            <span>/music [prompt]</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyCommand('/pdf')}
            className="px-2 py-1 text-[11px] font-mono border flex items-center gap-1 transition-all cursor-pointer bg-black text-[#A1A1AA] hover:text-[#00FF41] border-[#262626] hover:border-[#00FF41]"
            title="Format response for instant PDF download"
          >
            <span>📄</span>
            <span>/pdf [topic]</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyCommand('/search')}
            className="px-2 py-1 text-[11px] font-mono border flex items-center gap-1 transition-all cursor-pointer bg-black text-[#A1A1AA] hover:text-[#00FF41] border-[#262626] hover:border-[#00FF41]"
            title="Ground with live Google search"
          >
            <span>🌐</span>
            <span>/search [query]</span>
          </button>
        </div>

        {/* Unified Input Box with Real-Time Intent Pill */}
        <div className="relative flex items-center bg-[#0A0A0A] border-2 border-[#262626] focus-within:border-[#00FF41] shadow-[4px_4px_0px_0px_#141414] transition-all">
          <div className="hidden sm:flex items-center pl-3 pr-1 text-xs text-[#00FF41] shrink-0">
            <span
              className={`px-2 py-1 bg-black border text-[10px] uppercase font-bold flex items-center gap-1 transition-colors ${
                detectedIntent.mode !== 'text' || detectedIntent.isExplicitSlash
                  ? 'border-[#00FF41] text-[#00FF41] shadow-[1px_1px_0px_0px_#00FF41]'
                  : 'border-[#262626] text-[#737373]'
              }`}
            >
              <Zap className={`w-3 h-3 ${detectedIntent.mode !== 'text' ? 'text-[#00FF41] animate-pulse' : 'text-[#737373]'}`} />
              {detectedIntent.badgeLabel}
            </span>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              selectedMode === 'image'
                ? "Describe the visual illustration (e.g. 'Futuristic AI neural network matrix')..."
                : selectedMode === 'video'
                ? "Describe the motion sequence (e.g. 'Cyberpunk neon flight over metropolis')..."
                : selectedMode === 'music'
                ? "Describe the melody (e.g. 'Calming 432Hz ambient focus synthesizer')..."
                : "Ask anything in any language (English, Hindi, Hinglish, etc.)..."
            }
            disabled={isLoading}
            className="flex-1 px-3 sm:px-4 py-3.5 bg-transparent text-sm text-[#EDEDED] placeholder-[#525252] focus:outline-none font-sans"
          />

          <div className="flex items-center space-x-1 pr-2">
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className={`p-2 border transition-all cursor-pointer ${
                showEmojiPicker
                  ? 'bg-[#00FF41] text-black border-[#00FF41] shadow-[2px_2px_0px_0px_#00FF41]'
                  : 'bg-black text-[#737373] hover:text-[#00FF41] border-[#262626] hover:border-[#00FF41]'
              }`}
              title="Open Emoji Picker"
            >
              <Smile className="w-4 h-4" />
            </button>

            {/* Direct Module Switcher Buttons */}
            <button
              type="button"
              onClick={() => setSelectedMode('text')}
              className={`p-2 border transition-all cursor-pointer hidden md:flex ${
                selectedMode === 'text'
                  ? 'bg-[#00FF41] text-black border-[#00FF41]'
                  : 'bg-black text-[#737373] hover:text-[#EDEDED] border-[#262626]'
              }`}
              title="Switch to Smart Chat"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode('image')}
              className={`p-2 border transition-all cursor-pointer hidden md:flex ${
                selectedMode === 'image'
                  ? 'bg-[#00FF41] text-black border-[#00FF41]'
                  : 'bg-black text-[#737373] hover:text-[#EDEDED] border-[#262626]'
              }`}
              title="Switch to Image Generator"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode('video')}
              className={`p-2 border transition-all cursor-pointer hidden md:flex ${
                selectedMode === 'video'
                  ? 'bg-[#00FF41] text-black border-[#00FF41]'
                  : 'bg-black text-[#737373] hover:text-[#EDEDED] border-[#262626]'
              }`}
              title="Switch to Video Generator"
            >
              <Film className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode('music')}
              className={`p-2 border transition-all cursor-pointer hidden md:flex ${
                selectedMode === 'music'
                  ? 'bg-[#00FF41] text-black border-[#00FF41]'
                  : 'bg-black text-[#737373] hover:text-[#EDEDED] border-[#262626]'
              }`}
              title="Switch to Music Generator"
            >
              <Music className="w-4 h-4" />
            </button>

            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="ml-1 px-3 sm:px-4 py-2.5 bg-[#00FF41] hover:bg-[#00E038] disabled:opacity-40 text-black text-xs font-mono font-bold border border-[#00FF41] shadow-[2px_2px_0px_0px_#262626] hover:shadow-[3px_3px_0px_0px_#00FF41] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-black" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

/**
 * Optimized Memoized Header Bar (Prevents unnecessary re-renders during active token streaming)
 */
const HeaderBar = memo<{
  selectedMode: GenerationMode;
  activeLanguageStyle: string;
  useSearchGrounding: boolean;
  onToggleGrounding: () => void;
  onExportFullSession: () => void;
  onReset: () => void;
  onSelectMode: (mode: GenerationMode) => void;
  selectedRole: ChatRole;
  onSelectRole: (role: ChatRole) => void;
}>(({
  selectedMode,
  activeLanguageStyle,
  useSearchGrounding,
  onToggleGrounding,
  onExportFullSession,
  onReset,
  onSelectMode,
  selectedRole,
  onSelectRole,
}) => {
  return (
    <div className="bg-[#0A0A0A] p-3 sm:p-4 border border-[#262626] shadow-[4px_4px_0px_0px_#141414] flex flex-col gap-3 font-mono">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-black border border-[#00FF41] text-[#00FF41] flex items-center justify-center shadow-[2px_2px_0px_0px_#00FF41]">
            <Zap className="w-5 h-5 text-[#00FF41] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-[#EDEDED] tracking-tight">
                Somotoz AI Suite
              </h1>
              <span className="text-[10px] px-2 py-0.5 bg-black text-[#00FF41] border border-[#262626] flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#00FF41] rounded-full animate-ping" />
                ULTRA-FAST
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-[#141414] text-[#A1A1AA] border border-[#262626] hidden md:flex items-center gap-1">
                <Languages className="w-3 h-3 text-[#00FF41]" />
                {activeLanguageStyle}
              </span>
            </div>
            <p className="text-xs text-[#737373] font-sans">
              Instant real-time token streaming across Chat, Image, Video & Music generators.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onExportFullSession}
            className="px-2.5 py-1.5 text-xs font-mono font-medium border flex items-center space-x-1.5 bg-black hover:bg-[#121212] text-[#A1A1AA] hover:text-[#00FF41] border-[#262626] hover:border-[#00FF41] transition-all cursor-pointer shadow-[2px_2px_0px_0px_#171717]"
            title="Download full conversation transcript as PDF document"
          >
            <FileDown className="w-3.5 h-3.5 text-[#00FF41]" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>

          <button
            onClick={onToggleGrounding}
            className={`px-2.5 py-1.5 text-xs font-mono font-medium border flex items-center space-x-1.5 transition-all cursor-pointer ${
              useSearchGrounding
                ? 'bg-black text-[#00FF41] border-[#00FF41] shadow-[2px_2px_0px_0px_#00FF41]'
                : 'bg-black text-[#737373] border-[#262626] hover:text-[#EDEDED]'
            }`}
            title="Ground response with live web research"
          >
            <Globe className="w-3.5 h-3.5 text-[#00FF41]" />
            <span>{useSearchGrounding ? 'Web (ON)' : 'Web'}</span>
          </button>

          <button
            onClick={onReset}
            className="p-1.5 bg-black border border-[#262626] hover:border-[#00FF41] text-[#737373] hover:text-[#00FF41] transition-colors cursor-pointer"
            title="Reset conversation"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Multimodal Mode Selector Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#262626]">
        {MODES.map((mode) => {
          const isSelected = selectedMode === mode.id;
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className={`p-2.5 text-left border transition-all cursor-pointer flex flex-col justify-between group ${
                isSelected
                  ? 'bg-black border-[#00FF41] text-[#00FF41] shadow-[2px_2px_0px_0px_#00FF41]'
                  : 'bg-[#0D0D0D] hover:bg-[#141414] border-[#262626] hover:border-[#00FF41] text-[#737373]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-[#00FF41]' : 'text-[#737373] group-hover:text-[#EDEDED]'}`} />
                  <span className="text-xs font-semibold font-mono text-[#EDEDED]">{mode.label}</span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.2 bg-black text-[#A1A1AA] border border-[#262626]">
                  {mode.badge}
                </span>
              </div>
              <span className="text-[10px] text-[#737373] line-clamp-1 mt-1 font-sans">{mode.desc}</span>
            </button>
          );
        })}
      </div>

      {/* Persona/Role Selector for Text Mode */}
      {selectedMode === 'text' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar pt-1 font-mono">
          <span className="text-[#737373] text-[11px] shrink-0 mr-1 flex items-center gap-1">
            <Sliders className="w-3 h-3 text-[#00FF41]" /> Persona:
          </span>
          {ROLES.map((role) => (
            <button
              key={role.id}
              onClick={() => onSelectRole(role.id)}
              className={`px-2.5 py-1 text-[11px] font-medium shrink-0 transition-colors cursor-pointer flex items-center space-x-1 border ${
                selectedRole === role.id
                  ? 'bg-[#00FF41] text-black font-bold border-[#00FF41]'
                  : 'bg-black text-[#A1A1AA] hover:text-[#00FF41] border-[#262626] hover:border-[#00FF41]'
              }`}
            >
              <span>{role.icon}</span>
              <span>{role.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

/**
 * Isolated Memoized Chat Message Item (Never re-renders during active streaming of new messages)
 */
const ChatMessageItem = memo<{
  message: ChatMessage;
  isSpeaking: boolean;
  isPdfExplicitlyRequested: boolean;
  onToggleSpeak: (id: string, text: string) => void;
  onExportSingleMessage: (msg: ChatMessage) => void;
  onSaveToJournal?: (content: string, title?: string) => void;
}>(({
  message,
  isSpeaking,
  isPdfExplicitlyRequested,
  onToggleSpeak,
  onExportSingleMessage,
  onSaveToJournal,
}) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`w-8 h-8 shrink-0 flex items-center justify-center text-xs font-semibold font-mono border ${
          isUser
            ? 'bg-[#00FF41] text-black border-[#00FF41]'
            : 'bg-black border-[#262626] text-[#00FF41]'
        }`}
      >
        {isUser ? <User className="w-4 h-4 text-black" /> : <Bot className="w-4 h-4 text-[#00FF41]" />}
      </div>

      <div
        className={`max-w-[92%] sm:max-w-[82%] p-3.5 sm:p-4 text-sm leading-relaxed border transition-all ${
          isUser
            ? 'bg-black border-[#00FF41] text-[#EDEDED] shadow-[2px_2px_0px_0px_#00FF41]'
            : 'bg-black border-[#262626] hover:border-[#383838] text-[#EDEDED]'
        }`}
      >
        {/* Text Content */}
        <div className="text-[#EDEDED] whitespace-pre-wrap leading-relaxed font-sans">
          {message.content}
        </div>

        {/* PROMPT-TRIGGERED CONDITIONAL PDF EXPORT ACTION PILL */}
        {isPdfExplicitlyRequested && (
          <div className="mt-3 p-2.5 bg-[#00FF41]/10 border border-[#00FF41] flex flex-wrap items-center justify-between gap-2 font-mono">
            <div className="flex items-center space-x-2 text-xs text-[#00FF41]">
              <FileDown className="w-4 h-4 animate-bounce text-[#00FF41]" />
              <span className="font-bold">PDF Format Requested by User</span>
            </div>
            <button
              onClick={() => onExportSingleMessage(message)}
              className="px-3 py-1 bg-[#00FF41] hover:bg-[#00E038] text-black text-xs font-bold font-mono border border-[#00FF41] shadow-[2px_2px_0px_0px_#000000] flex items-center space-x-1.5 transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
            >
              <Download className="w-3.5 h-3.5 text-black" />
              <span>Download PDF Document</span>
            </button>
          </div>
        )}

        {/* Inline Media Rendering for Image / Video / Music */}
        {message.media && (
          <div className="mt-4 pt-3 border-t border-[#262626]">
            {message.media.type === 'image' && <InlineImageViewer media={message.media} />}
            {message.media.type === 'video' && <InlineVideoSimulator media={message.media} />}
            {message.media.type === 'music' && <InlineAudioSynthesizer media={message.media} />}
          </div>
        )}

        {/* Grounding citations if present */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-2 border-t border-[#262626] text-xs text-[#737373] space-y-1 font-mono">
            <p className="font-semibold text-[11px] text-[#00FF41] flex items-center gap-1">
              <Globe className="w-3 h-3 text-[#00FF41]" />
              Verified Sources:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {message.sources.map((s, idx) => (
                <a
                  key={idx}
                  href={s.uri}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-0.5 bg-[#141414] border border-[#262626] hover:border-[#00FF41] text-[#A1A1AA] hover:text-[#00FF41] text-[11px] truncate max-w-[240px]"
                >
                  {s.title || s.uri}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Actions on Model Messages */}
        {!isUser && message.id !== 'welcome' && (
          <div className="mt-3 pt-2 border-t border-[#262626] flex flex-wrap items-center justify-between gap-2 font-mono">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onExportSingleMessage(message)}
                className="text-[11px] text-[#A1A1AA] hover:text-[#00FF41] flex items-center space-x-1 transition-colors cursor-pointer"
                title="Download this response as formatted PDF"
              >
                <FileDown className="w-3.5 h-3.5 text-[#00FF41]" />
                <span>Export PDF</span>
              </button>

              <button
                onClick={() => onToggleSpeak(message.id, message.content)}
                className={`text-[11px] flex items-center space-x-1 transition-colors cursor-pointer ${
                  isSpeaking ? 'text-[#00FF41] font-bold' : 'text-[#A1A1AA] hover:text-[#00FF41]'
                }`}
                title={isSpeaking ? 'Stop reading' : 'Read aloud with speech synthesis'}
              >
                {isSpeaking ? (
                  <VolumeX className="w-3.5 h-3.5 text-[#00FF41]" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
                <span>{isSpeaking ? 'Stop Audio' : 'Read Aloud'}</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              {onSaveToJournal && (
                <button
                  onClick={() => onSaveToJournal(message.content, 'Somotoz AI Note')}
                  className="text-[11px] font-medium text-[#00FF41] hover:text-[#00E038] flex items-center space-x-1 cursor-pointer"
                >
                  <BookPlus className="w-3.5 h-3.5" />
                  <span>Save Note</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * 1. Memoized Dynamic Inline Image / SVG Renderer
 */
const InlineImageViewer = memo<{ media: ChatMediaData }>(({ media }) => {
  const [copied, setCopied] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<'fit' | '150'>('fit');
  const [showCode, setShowCode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleCopySvg = () => {
    if (!media.svgData) return;
    navigator.clipboard.writeText(media.svgData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSvg = () => {
    if (!media.svgData) return;
    downloadSvgImage(media.svgData, media.prompt || 'artwork');
  };

  const handleDownloadPng = async () => {
    if (!media.svgData || isExportingPng) return;
    setIsExportingPng(true);
    try {
      await downloadPngImage(media.svgData, media.prompt || 'artwork');
    } catch (e) {
      console.error('PNG export error:', e);
    } finally {
      setIsExportingPng(false);
    }
  };

  return (
    <div className={`bg-black border border-[#262626] overflow-hidden shadow-[2px_2px_0px_0px_#171717] font-mono ${isFullscreen ? 'fixed inset-4 z-50 flex flex-col bg-black border-[#00FF41] shadow-[0_0_30px_rgba(0,255,65,0.3)]' : ''}`}>
      <div className="px-3 py-2 bg-[#0A0A0A] border-b border-[#262626] flex flex-wrap items-center justify-between gap-2 text-xs text-[#EDEDED]">
        <div className="flex items-center space-x-2">
          <span className="flex items-center gap-1.5 text-[#00FF41] font-semibold">
            <ImageIcon className="w-3.5 h-3.5 text-[#00FF41]" />
            Vector Render (SVG)
          </span>
          <span className="text-[10px] text-[#737373] hidden sm:inline">
            • Scalable Neural Graphics
          </span>
        </div>
        
        <div className="flex items-center space-x-1.5 flex-wrap">
          <button
            onClick={() => setZoomLevel(prev => prev === 'fit' ? '150' : 'fit')}
            className="px-2 py-1 bg-black hover:bg-[#141414] border border-[#262626] hover:border-[#00FF41] text-[#A1A1AA] hover:text-[#00FF41] text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
            title="Toggle zoom level"
          >
            <span>{zoomLevel === 'fit' ? 'Fit' : '150%'}</span>
          </button>

          <button
            onClick={() => setShowCode(!showCode)}
            className={`px-2 py-1 border text-[10px] flex items-center gap-1 transition-colors cursor-pointer ${
              showCode
                ? 'bg-[#00FF41] text-black font-bold border-[#00FF41]'
                : 'bg-black text-[#A1A1AA] hover:text-[#00FF41] border-[#262626] hover:border-[#00FF41]'
            }`}
            title="Inspect SVG XML Source"
          >
            <Code className="w-3 h-3" />
            <span>XML</span>
          </button>

          <button
            onClick={handleCopySvg}
            className="px-2.5 py-1 bg-black hover:bg-[#141414] border border-[#262626] hover:border-[#00FF41] text-[#A1A1AA] hover:text-[#00FF41] text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            title="Copy SVG XML code to clipboard"
          >
            {copied ? <Check className="w-3 h-3 text-[#00FF41]" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownloadSvg}
            className="px-2.5 py-1 bg-black hover:bg-[#141414] border border-[#262626] hover:border-[#00FF41] text-[#A1A1AA] hover:text-[#00FF41] text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            title="Download vector SVG file"
          >
            <Download className="w-3 h-3 text-[#00FF41]" />
            <span>SVG</span>
          </button>

          <button
            onClick={handleDownloadPng}
            disabled={isExportingPng}
            className="px-2.5 py-1 bg-[#00FF41] hover:bg-[#00E038] text-black font-bold text-[11px] border border-[#00FF41] shadow-[2px_2px_0px_0px_#262626] flex items-center gap-1 transition-all cursor-pointer"
            title="Download high-resolution rasterized PNG"
          >
            {isExportingPng ? <Loader2 className="w-3 h-3 animate-spin text-black" /> : <Download className="w-3 h-3 text-black" />}
            <span>{isExportingPng ? 'Saving...' : 'Download PNG'}</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 bg-black hover:bg-[#141414] border border-[#262626] hover:border-[#00FF41] text-[#737373] hover:text-[#00FF41] cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className={`p-4 bg-black flex items-center justify-center overflow-auto ${isFullscreen ? 'flex-1' : 'min-h-[220px]'}`}>
        {showCode ? (
          <pre className="w-full max-h-[350px] overflow-auto p-3 bg-[#080808] border border-[#262626] text-[11px] text-[#00FF41] leading-tight select-all">
            {media.svgData}
          </pre>
        ) : media.svgData ? (
          <div
            style={{
              transform: zoomLevel === '150' ? 'scale(1.5)' : 'scale(1)',
              transition: 'transform 0.2s ease',
            }}
            className="w-full max-h-[420px] flex items-center justify-center overflow-hidden [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[380px]"
            dangerouslySetInnerHTML={{ __html: media.svgData }}
          />
        ) : (
          <div className="h-48 flex items-center justify-center text-[#737373] text-xs font-mono">
            No SVG data available
          </div>
        )}
      </div>

      <div className="px-3 py-1.5 bg-[#0A0A0A] border-t border-[#262626] text-[11px] font-mono text-[#737373] truncate">
        Prompt: <span className="text-[#EDEDED]">{media.prompt}</span>
      </div>
    </div>
  );
});

/**
 * 2. Memoized Dynamic Video Simulator
 */
const InlineVideoSimulator = memo<{ media: ChatMediaData }>(({ media }) => {
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

    const render = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(0, 255, 65, 0.12)';
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

      const waveOffset = isPlaying ? tick * 0.05 * motionSpeed : 0;
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#00FF41';
      ctx.shadowColor = '#00FF41';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += 3) {
        const y = canvas.height / 2 + Math.sin(x * 0.02 + waveOffset) * 45 + Math.cos(x * 0.01 - waveOffset * 0.6) * 22;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(0, 255, 65, 0.4)';
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += 4) {
        const y = canvas.height / 2 - Math.sin(x * 0.025 - waveOffset * 0.8) * 35;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      for (let i = 0; i < frames.length; i++) {
        const nodeX = (canvas.width / (frames.length + 1)) * (i + 1);
        const nodeY = canvas.height / 2 + Math.sin(nodeX * 0.02 + waveOffset) * 45;
        
        ctx.fillStyle = activeFrameIndex === i ? '#00FF41' : '#00661A';
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, activeFrameIndex === i ? 8 : 4.5, 0, Math.PI * 2);
        ctx.fill();

        if (activeFrameIndex === i) {
          ctx.strokeStyle = '#00FF41';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(nodeX, nodeY, 14, 0, Math.PI * 2);
          ctx.stroke();
        }
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
  }, [isPlaying, activeFrameIndex, frames.length, motionSpeed]);

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
        (progress, status) => {
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
    <div className="bg-black border border-[#262626] overflow-hidden shadow-[2px_2px_0px_0px_#171717] font-mono">
      <div className="px-3 py-2 bg-[#0A0A0A] border-b border-[#262626] flex flex-wrap items-center justify-between gap-2 text-xs text-[#EDEDED]">
        <div className="flex items-center space-x-2">
          <span className="flex items-center gap-1.5 text-[#00FF41] font-semibold">
            <Film className="w-3.5 h-3.5 text-[#00FF41]" />
            Video Generator ({media.duration || '0:12'})
          </span>
          <span className="text-[10px] text-[#737373] hidden sm:inline">
            • 60 FPS Keyframe Engine
          </span>
        </div>

        <div className="flex items-center space-x-1.5 flex-wrap">
          <button
            onClick={() => setMotionSpeed(prev => prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1)}
            className="px-2 py-1 bg-black hover:bg-[#141414] border border-[#262626] hover:border-[#00FF41] text-[#A1A1AA] hover:text-[#00FF41] text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
            title="Playback speed"
          >
            <span>{motionSpeed}x Speed</span>
          </button>

          <button
            onClick={handleDownloadFrame}
            className="px-2.5 py-1 bg-black hover:bg-[#141414] border border-[#262626] hover:border-[#00FF41] text-[#A1A1AA] hover:text-[#00FF41] text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            title="Download active scene frame as PNG image"
          >
            <Download className="w-3 h-3 text-[#00FF41]" />
            <span>Frame (.png)</span>
          </button>

          <button
            onClick={handleDownloadStoryboard}
            className="px-2.5 py-1 bg-black hover:bg-[#141414] border border-[#262626] hover:border-[#00FF41] text-[#A1A1AA] hover:text-[#00FF41] text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            title="Download keyframes script as text file"
          >
            <FileText className="w-3 h-3 text-[#00FF41]" />
            <span>Script (.txt)</span>
          </button>

          <button
            onClick={handleDownloadVideo}
            disabled={isRecordingVideo}
            className="px-2.5 py-1 bg-[#00FF41] hover:bg-[#00E038] text-black font-bold text-[11px] border border-[#00FF41] shadow-[2px_2px_0px_0px_#262626] flex items-center gap-1 transition-all cursor-pointer"
            title="Record and download motion animation as WebM video file"
          >
            {isRecordingVideo ? <Loader2 className="w-3 h-3 animate-spin text-black" /> : <Video className="w-3 h-3 text-black" />}
            <span>{isRecordingVideo ? recordProgressText || 'Recording...' : 'Download Video (.webm)'}</span>
          </button>
        </div>
      </div>

      <div className="relative bg-black flex items-center justify-center overflow-hidden">
        <canvas ref={canvasRef} width={640} height={260} className="w-full h-auto max-h-[260px]" />

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute inset-0 m-auto w-12 h-12 bg-[#00FF41] hover:bg-[#00E038] text-black flex items-center justify-center transition-transform hover:scale-105 shadow-[2px_2px_0px_0px_#000000] cursor-pointer"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-5 h-5 text-black" /> : <Play className="w-5 h-5 ml-0.5 text-black" />}
        </button>

        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/90 border border-[#262626] text-[10px] text-[#00FF41] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-[#00FF41] rounded-full animate-ping" />
          Scene {activeFrameIndex + 1}/{frames.length}
        </div>
      </div>

      <div className="p-2.5 bg-[#0A0A0A] border-t border-[#262626] space-y-1.5">
        <div className="text-[11px] text-[#A1A1AA] font-semibold flex items-center justify-between">
          <span>Keyframe Breakdown Timeline</span>
          <span className="text-[#00FF41] text-[10px]">{isPlaying ? 'PLAYING (60FPS)' : 'PAUSED'}</span>
        </div>
        <div className="space-y-1">
          {frames.map((kf, idx) => (
            <div
              key={idx}
              onClick={() => {
                setActiveFrameIndex(idx);
                setIsPlaying(true);
              }}
              className={`px-2.5 py-1 text-[11px] transition-colors cursor-pointer flex items-center gap-2 border ${
                activeFrameIndex === idx
                  ? 'bg-black text-[#00FF41] border-[#00FF41]'
                  : 'bg-[#0F0F0F] text-[#A1A1AA] border-[#1F1F1F] hover:border-[#00FF41]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF41]" />
              <span className="truncate">{kf}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

/**
 * 3. Memoized Dynamic Music Synthesizer
 */
const InlineAudioSynthesizer = memo<{ media: ChatMediaData }>(({ media }) => {
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
    { freq: 392.00, duration: 0.6, type: 'sine' },
    { freq: 440.00, duration: 0.8, type: 'sine' },
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
    <div className="bg-black border border-[#262626] overflow-hidden shadow-[2px_2px_0px_0px_#171717] font-mono">
      <div className="px-3 py-2 bg-[#0A0A0A] border-b border-[#262626] flex flex-wrap items-center justify-between gap-2 text-xs text-[#EDEDED]">
        <div className="flex items-center space-x-2">
          <span className="flex items-center gap-1.5 text-[#00FF41] font-semibold">
            <Music className="w-3.5 h-3.5 text-[#00FF41]" />
            Music Synthesizer ({media.genre || 'Cyber Synth'})
          </span>
          <span className="text-[10px] text-[#737373] hidden sm:inline">
            • 432Hz Harmonic Engine
          </span>
        </div>

        <div className="flex items-center space-x-1.5 flex-wrap">
          <select
            value={oscType}
            onChange={(e) => setOscType(e.target.value as OscillatorType)}
            className="px-2 py-1 bg-black border border-[#262626] text-[#A1A1AA] hover:text-[#00FF41] text-[10px] outline-none cursor-pointer"
            title="Oscillator Waveform"
          >
            <option value="sine">Sine Wave</option>
            <option value="triangle">Triangle Wave</option>
            <option value="sawtooth">Sawtooth Wave</option>
            <option value="square">Square Wave</option>
          </select>

          <button
            onClick={() => setTempo(prev => prev === 120 ? 140 : prev === 140 ? 90 : 120)}
            className="px-2 py-1 bg-black hover:bg-[#141414] border border-[#262626] hover:border-[#00FF41] text-[#A1A1AA] hover:text-[#00FF41] text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
            title="Adjust tempo BPM"
          >
            <span>{tempo} BPM</span>
          </button>

          <button
            onClick={handleDownloadWav}
            className="px-2.5 py-1 bg-[#00FF41] hover:bg-[#00E038] text-black font-bold text-[11px] border border-[#00FF41] shadow-[2px_2px_0px_0px_#262626] flex items-center gap-1 transition-all cursor-pointer"
            title="Synthesize and download standard 16-bit PCM WAV audio file"
          >
            <Download className="w-3 h-3 text-black" />
            <span>Download Audio (.wav)</span>
          </button>
        </div>
      </div>

      <div className="p-4 bg-black flex flex-col items-center justify-center gap-3">
        <div className="flex items-end justify-center gap-1.5 h-16 w-full max-w-sm px-4">
          {notes.map((n, i) => {
            const isActive = activeNoteIdx === i;
            const heightPercent = Math.min(100, Math.max(20, (n.freq / 600) * 100));
            return (
              <div
                key={i}
                style={{ height: `${heightPercent}%` }}
                className={`flex-1 transition-all duration-75 border ${
                  isActive
                    ? 'bg-[#00FF41] border-[#00FF41] shadow-[0_0_12px_#00FF41]'
                    : 'bg-[#141414] border-[#262626]'
                }`}
                title={`Note: ${n.freq.toFixed(1)} Hz (${n.duration}s)`}
              />
            );
          })}
        </div>

        <button
          onClick={playSequence}
          className={`px-5 py-2.5 font-bold text-xs flex items-center space-x-2 border transition-all cursor-pointer shadow-[2px_2px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 ${
            isPlaying
              ? 'bg-rose-500 hover:bg-rose-400 text-black border-rose-500'
              : 'bg-[#00FF41] hover:bg-[#00E038] text-black border-[#00FF41]'
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

      <div className="px-3 py-1.5 bg-[#0A0A0A] border-t border-[#262626] text-[11px] font-mono text-[#737373] flex justify-between items-center">
        <span>Prompt: <span className="text-[#EDEDED]">{media.prompt}</span></span>
        <span className="text-[#00FF41]">{notes.length} Harmonics Rendered</span>
      </div>
    </div>
  );
});
