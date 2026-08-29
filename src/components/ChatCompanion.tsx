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
  ArrowDown,
  Eye,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Layers
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
        ? `⚡ **Somotoz Master AI Core Initialized**.\n\nLoaded note context: **"${initialReflection.title}"**.\n\nI am ready to execute all multimodal tasks end-to-end with strict adherence to your instructions.`
        : `⚡ **Welcome to Somotoz AI Suite**.\n\nI am your Master AI Core and autonomous intelligence engine. I execute all user requests end-to-end with zero manual intervention required:\n\n• **📸 Real-World Photography & Imagination**: Hyper-realistic 1K cinematic visual synthesis with true-to-life lighting and textures.\n• **📖 Accessible Reading Mode**: Clean bullet points, short paragraphs, and simple language for effortless dyslexia-friendly reading.\n• **🏷️ Brand Watermark**: Minimalist "Somotoz" watermark embedded across all generated media outputs.\n• **⚡ Multimodal Execution**: Seamless Smart Chat reasoning, 60FPS Video motion sequences, and 432Hz harmonic Music synthesis.\n\nEnter any prompt or command below to begin!`,
      timestamp: Date.now(),
      mode: 'text',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [accessibleReadingMode, setAccessibleReadingMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('somotoz_accessible_mode') === 'true';
    } catch {
      return false;
    }
  });

  const toggleAccessibleMode = useCallback(() => {
    setAccessibleReadingMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('somotoz_accessible_mode', String(next));
      } catch {}
      return next;
    });
  }, []);

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

  const [isBannerExpanded, setIsBannerExpanded] = useState<boolean>(false);

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
    <div className="w-full max-w-6xl mx-auto h-full flex-1 p-1 sm:p-2 flex flex-col gap-2 font-sans overflow-hidden min-h-0">
      {/* Streamlined Top Status Bar - Zero Redundant Sub-Generator Bar */}
      <TopStatusBar
        selectedMode={selectedMode}
        activeLanguageStyle={activeLanguageStyle}
        useSearchGrounding={useSearchGrounding}
        onToggleGrounding={() => setUseSearchGrounding(!useSearchGrounding)}
        accessibleReadingMode={accessibleReadingMode}
        onToggleAccessibleMode={toggleAccessibleMode}
        onExportFullSession={handleExportFullSession}
        onReset={handleReset}
      />

      {/* Messages Scroll Area with Glassmorphism and Corner Chamfers - Maximized Flex 1 Height */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 bg-[var(--bg-card)] border border-[var(--border-color)] clip-cyber-card shadow-sm p-3 sm:p-5 overflow-y-auto space-y-4 font-sans relative text-[var(--text-primary)]"
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
              accessibleReadingMode={accessibleReadingMode}
              onToggleSpeak={handleToggleSpeak}
              onExportSingleMessage={handleExportSingleMessage}
              onSaveToJournal={onSaveToJournal}
            />
          );
        })}

        {/* ACTIVE STREAMING ASSISTANT BUBBLE (Instant Visual Feedback) */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 shrink-0 bg-[var(--bg-secondary)] border border-[var(--border-active)] text-[var(--border-active)] flex items-center justify-center clip-badge-poly shadow-sm">
              <Bot className="w-4 h-4 text-[var(--border-active)] animate-spin" />
            </div>

            <div className="max-w-[92%] sm:max-w-[82%] p-4 bg-[var(--chat-bot-bg)] chat-bot-message border border-[var(--border-active)] text-[var(--text-primary)] clip-cyber-card shadow-md space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-[var(--border-active)] border-b border-[var(--border-color)] pb-1.5">
                <span className="flex items-center gap-1.5 font-bold">
                  <Zap className="w-3.5 h-3.5 animate-pulse text-[var(--border-active)]" />
                  STREAMING REAL-TIME RESPONSE
                </span>
                <span className="text-[var(--text-secondary)] uppercase px-1.5 py-0.2 bg-[var(--bg-elevated)] border border-[var(--border-color)] clip-badge-poly text-[9px]">{selectedMode} MODE</span>
              </div>

              <div className={`text-[var(--text-primary)] whitespace-pre-wrap ${accessibleReadingMode ? 'leading-loose tracking-wide text-[15px]' : 'leading-relaxed'} min-h-[24px]`}>
                {activeStreamingText || (
                  <span className="text-[var(--text-muted)] italic font-mono flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-[var(--border-active)] rounded-full animate-ping" />
                    Thinking & generating in {activeLanguageStyle}...
                  </span>
                )}
                <span className="inline-block w-2 h-4 bg-[var(--border-active)] ml-1 animate-pulse align-middle" />
              </div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-mono clip-badge-poly">
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
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-[var(--bg-card)] border-2 border-[var(--border-active)] clip-cyber-card shadow-xl z-40 max-h-60 overflow-y-auto font-mono text-[var(--text-primary)]">
            <div className="px-3 py-1.5 bg-[var(--bg-elevated)] border-b border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--border-active)]">
              <span className="font-bold flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5" />
                AVAILABLE COMMANDS
              </span>
              <span className="text-[10px] text-[var(--text-secondary)]">Click or type to select</span>
            </div>
            <div className="divide-y divide-[var(--border-color)]">
              {filteredCommandSuggestions.map((cmd, idx) => (
                <button
                  key={cmd.command}
                  type="button"
                  onClick={() => handleApplyCommand(cmd.command)}
                  className={`w-full p-2.5 text-left flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                    idx === selectedSuggestionIndex
                      ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                      : 'hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-base">{cmd.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--border-active)]">{cmd.command}</span>
                        <span className="text-[11px] text-[var(--text-primary)]">{cmd.label}</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] font-sans mt-0.5">{cmd.desc}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-[var(--text-secondary)] bg-[var(--bg-input)] px-2 py-0.5 border border-[var(--border-color)] clip-badge-poly shrink-0">
                    {cmd.syntax}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Slash Action Chips Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[var(--text-muted)] text-[10px] uppercase font-bold shrink-0 mr-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-[var(--border-active)]" /> Commands:
          </span>

          <button
            type="button"
            onClick={() => handleApplyCommand('/image')}
            className={`px-2.5 py-1 text-[11px] font-mono border flex items-center gap-1 transition-all cursor-pointer clip-badge-poly ${
              detectedIntent.mode === 'image'
                ? 'bg-[#A855F7] text-black font-bold border-[#A855F7] shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[#A855F7] border-[var(--border-color)] hover:border-[#A855F7]'
            }`}
            title="Render visual artwork"
          >
            <span>✨</span>
            <span>/image [prompt]</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyCommand('/video')}
            className={`px-2.5 py-1 text-[11px] font-mono border flex items-center gap-1 transition-all cursor-pointer clip-badge-poly ${
              detectedIntent.mode === 'video'
                ? 'bg-[#FF007A] text-white font-bold border-[#FF007A] shadow-[0_0_12px_rgba(255,0,122,0.4)]'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[#FF007A] border-[var(--border-color)] hover:border-[#FF007A]'
            }`}
            title="Synthesize 60FPS motion sequence"
          >
            <span>🎬</span>
            <span>/video [prompt]</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyCommand('/music')}
            className={`px-2.5 py-1 text-[11px] font-mono border flex items-center gap-1 transition-all cursor-pointer clip-badge-poly ${
              detectedIntent.mode === 'music'
                ? 'bg-[#FFB800] text-black font-bold border-[#FFB800] shadow-[0_0_12px_rgba(255,184,0,0.4)]'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[#FFB800] border-[var(--border-color)] hover:border-[#FFB800]'
            }`}
            title="Compose 432Hz procedural audio"
          >
            <span>🎵</span>
            <span>/music [prompt]</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyCommand('/pdf')}
            className="px-2.5 py-1 text-[11px] font-mono border flex items-center gap-1 transition-all cursor-pointer clip-badge-poly bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--border-active)] border-[var(--border-color)] hover:border-[var(--border-active)]"
            title="Format response for instant PDF download"
          >
            <span>📄</span>
            <span>/pdf [topic]</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyCommand('/search')}
            className="px-2.5 py-1 text-[11px] font-mono border flex items-center gap-1 transition-all cursor-pointer clip-badge-poly bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--border-active)] border-[var(--border-color)] hover:border-[var(--border-active)]"
            title="Ground with live Google search"
          >
            <span>🌐</span>
            <span>/search [query]</span>
          </button>
        </div>

        {/* Unified Input Box with Real-Time Intent Pill & Chamfered Polygon Border */}
        <div className="relative flex items-center bg-[var(--bg-input)] border-2 border-[var(--border-color)] focus-within:border-[var(--border-active)] clip-cyber-card shadow-sm transition-all">
          <div className="hidden sm:flex items-center pl-3 pr-1 text-xs text-[var(--border-active)] shrink-0">
            <span
              className={`px-2.5 py-1 bg-[var(--bg-secondary)] border text-[10px] uppercase font-bold flex items-center gap-1 clip-badge-poly transition-colors ${
                detectedIntent.mode !== 'text' || detectedIntent.isExplicitSlash
                  ? 'border-[var(--border-active)] text-[var(--border-active)] shadow-sm'
                  : 'border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}
            >
              <Zap className={`w-3 h-3 ${detectedIntent.mode !== 'text' ? 'text-[var(--border-active)] animate-pulse' : 'text-[var(--text-muted)]'}`} />
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
            className="flex-1 px-3 sm:px-4 py-3.5 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none font-sans"
          />

          <div className="flex items-center space-x-1.5 pr-2">
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className={`p-2 border transition-all cursor-pointer clip-badge-poly ${
                showEmojiPicker
                  ? 'bg-[var(--border-active)] text-black border-[var(--border-active)] shadow-sm'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--border-active)] border-[var(--border-color)] hover:border-[var(--border-active)]'
              }`}
              title="Open Emoji Picker"
            >
              <Smile className="w-4 h-4" />
            </button>

            {/* Direct Module Switcher Buttons with Polygon Clips */}
            <button
              type="button"
              onClick={() => setSelectedMode('text')}
              className={`p-2 border transition-all cursor-pointer hidden md:flex clip-badge-poly ${
                selectedMode === 'text'
                  ? 'bg-[#00F0FF] text-black border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                  : 'bg-black/80 text-[#737373] hover:text-[#EDEDED] border-[#2D2D45]'
              }`}
              title="Switch to Smart Chat"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode('image')}
              className={`p-2 border transition-all cursor-pointer hidden md:flex clip-badge-poly ${
                selectedMode === 'image'
                  ? 'bg-[#A855F7] text-black border-[#A855F7] shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                  : 'bg-black/80 text-[#737373] hover:text-[#EDEDED] border-[#2D2D45]'
              }`}
              title="Switch to Image Generator"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode('video')}
              className={`p-2 border transition-all cursor-pointer hidden md:flex clip-badge-poly ${
                selectedMode === 'video'
                  ? 'bg-[#FF007A] text-white border-[#FF007A] shadow-[0_0_10px_rgba(255,0,122,0.4)]'
                  : 'bg-black/80 text-[#737373] hover:text-[#EDEDED] border-[#2D2D45]'
              }`}
              title="Switch to Video Generator"
            >
              <Film className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode('music')}
              className={`p-2 border transition-all cursor-pointer hidden md:flex clip-badge-poly ${
                selectedMode === 'music'
                  ? 'bg-[#FFB800] text-black border-[#FFB800] shadow-[0_0_10px_rgba(255,184,0,0.4)]'
                  : 'bg-black/80 text-[#737373] hover:text-[#EDEDED] border-[#2D2D45]'
              }`}
              title="Switch to Music Generator"
            >
              <Music className="w-4 h-4" />
            </button>

            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="ml-1 px-4 py-2.5 bg-gradient-to-r from-[#00F0FF] to-[#A855F7] hover:brightness-110 disabled:opacity-40 text-black text-xs font-mono font-bold border border-[#00F0FF] clip-badge-poly shadow-[0_0_15px_rgba(0,240,255,0.3)] active:scale-95 transition-all flex items-center space-x-1.5 cursor-pointer"
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
 * Streamlined Top Status Bar (Zero redundant mode buttons, maximized vertical workspace)
 */
const TopStatusBar = memo<{
  selectedMode: GenerationMode;
  activeLanguageStyle: string;
  useSearchGrounding: boolean;
  onToggleGrounding: () => void;
  accessibleReadingMode: boolean;
  onToggleAccessibleMode: () => void;
  onExportFullSession: () => void;
  onReset: () => void;
}>(({
  selectedMode,
  activeLanguageStyle,
  useSearchGrounding,
  onToggleGrounding,
  accessibleReadingMode,
  onToggleAccessibleMode,
  onExportFullSession,
  onReset,
}) => {
  const modeInfo: Record<GenerationMode, { label: string; icon: string; tag: string }> = {
    text: { label: 'Smart AI Chat', icon: '⚡', tag: 'REALTIME-SSE' },
    image: { label: 'Image Synthesis', icon: '🎨', tag: 'PHOTOREAL' },
    video: { label: 'Motion Sequence', icon: '🎬', tag: '60FPS' },
    music: { label: 'Procedural Audio', icon: '🎵', tag: '432HZ' },
  };

  const current = modeInfo[selectedMode] || modeInfo.text;

  return (
    <div className="bg-[var(--bg-card)] px-3 py-1.5 sm:py-2 border border-[var(--border-color)] clip-stealth-notch shadow-xs flex items-center justify-between gap-2 font-mono text-[var(--text-primary)] shrink-0 transition-colors">
      {/* Left: Active Module Identifier */}
      <div className="flex items-center space-x-2 min-w-0">
        <div className="w-6 h-6 sm:w-7 sm:h-7 bg-[var(--bg-secondary)] border border-[var(--border-active)] flex items-center justify-center clip-badge-poly shadow-xs shrink-0">
          <span className="text-xs">{current.icon}</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 truncate">
          <span className="text-xs sm:text-sm font-bold tracking-tight text-[var(--text-primary)] truncate">
            {current.label}
          </span>
          <span className="text-[9px] px-1.5 py-0.2 bg-[var(--bg-elevated)] text-[var(--border-active)] border border-[var(--border-active)]/40 clip-badge-poly hidden xs:inline-flex items-center gap-1 shrink-0 font-bold">
            <span className="w-1.5 h-1.5 bg-[var(--border-active)] rounded-full animate-ping" />
            {current.tag}
          </span>
          <span className="text-[9px] px-1.5 py-0.2 bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-color)] clip-badge-poly hidden md:inline-flex items-center gap-1 shrink-0">
            <Languages className="w-2.5 h-2.5 text-[var(--border-active)]" />
            {activeLanguageStyle}
          </span>
        </div>
      </div>

      {/* Right: Essential Tools */}
      <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
        <button
          onClick={onToggleAccessibleMode}
          className={`px-2 py-1 text-[10px] sm:text-[11px] font-mono border flex items-center space-x-1 transition-all cursor-pointer clip-badge-poly ${
            accessibleReadingMode
              ? 'bg-[var(--border-active)] text-black font-bold border-[var(--border-active)] shadow-xs'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--border-active)] border-[var(--border-color)]'
          }`}
          title="Toggle Accessible Dyslexia-Friendly Reading Mode"
        >
          <BookOpen className="w-3 h-3" />
          <span className="hidden sm:inline">{accessibleReadingMode ? 'Accessible' : 'Access'}</span>
        </button>

        <button
          onClick={onExportFullSession}
          className="px-2 py-1 text-[10px] sm:text-[11px] font-mono border flex items-center space-x-1 bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--border-active)] border-[var(--border-color)] hover:border-[var(--border-active)] transition-all cursor-pointer clip-badge-poly"
          title="Download conversation transcript as PDF document"
        >
          <FileDown className="w-3 h-3" />
          <span className="hidden sm:inline">PDF</span>
        </button>

        <button
          onClick={onToggleGrounding}
          className={`px-2 py-1 text-[10px] sm:text-[11px] font-mono border flex items-center space-x-1 transition-all cursor-pointer clip-badge-poly ${
            useSearchGrounding
              ? 'bg-[var(--border-active)] text-black font-bold border-[var(--border-active)] shadow-xs'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--border-active)] border-[var(--border-color)]'
          }`}
          title="Toggle Live Google Search Grounding"
        >
          <Globe className="w-3 h-3" />
          <span className="hidden sm:inline">{useSearchGrounding ? 'Web ON' : 'Web OFF'}</span>
        </button>

        <button
          onClick={onReset}
          className="p-1 sm:p-1.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--border-active)] text-[var(--text-secondary)] hover:text-[var(--border-active)] clip-badge-poly transition-colors cursor-pointer"
          title="Reset conversation"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
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
  accessibleReadingMode?: boolean;
  onToggleSpeak: (id: string, text: string) => void;
  onExportSingleMessage: (msg: ChatMessage) => void;
  onSaveToJournal?: (content: string, title?: string) => void;
}>(({
  message,
  isSpeaking,
  isPdfExplicitlyRequested,
  accessibleReadingMode,
  onToggleSpeak,
  onExportSingleMessage,
  onSaveToJournal,
}) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`w-8 h-8 shrink-0 flex items-center justify-center text-xs font-semibold font-mono border clip-badge-poly ${
          isUser
            ? 'bg-gradient-to-br from-[#00F0FF] to-[#A855F7] text-black border-[#00F0FF] shadow-sm'
            : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--border-active)] shadow-sm'
        }`}
      >
        {isUser ? <User className="w-4 h-4 text-black" /> : <Bot className="w-4 h-4 text-[var(--border-active)]" />}
      </div>

      <div
        className={`max-w-[92%] sm:max-w-[82%] p-3.5 sm:p-4 border transition-all ${
          accessibleReadingMode ? 'text-[15px] leading-loose tracking-wide' : 'text-sm leading-relaxed'
        } ${
          isUser
            ? 'chat-user-message bg-[var(--chat-user-bg)] border-[var(--border-active)]/70 text-[var(--text-primary)] clip-cyber-corner shadow-sm'
            : 'chat-bot-message bg-[var(--chat-bot-bg)] border-[var(--border-color)] hover:border-[var(--border-active)] text-[var(--text-primary)] clip-cyber-card shadow-sm'
        }`}
      >
        {/* Accessible Mode Tag */}
        {accessibleReadingMode && !isUser && (
          <div className="mb-2 pb-1.5 border-b border-[var(--border-color)] flex items-center justify-between text-[11px] font-mono text-[var(--border-active)]">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3 text-[var(--border-active)]" />
              Accessible Dyslexia-Friendly Layout
            </span>
            <span className="text-[10px] text-[var(--text-secondary)]">Optimized Spacing</span>
          </div>
        )}

        {/* Text Content */}
        <div className={`text-[var(--text-primary)] whitespace-pre-wrap ${accessibleReadingMode ? 'leading-loose tracking-wide font-sans text-[15px]' : 'leading-relaxed font-sans'}`}>
          {message.content}
        </div>

        {/* PROMPT-TRIGGERED CONDITIONAL PDF EXPORT ACTION PILL */}
        {isPdfExplicitlyRequested && (
          <div className="mt-3 p-2.5 bg-[#00F0FF]/10 border border-[#00F0FF] clip-badge-poly flex flex-wrap items-center justify-between gap-2 font-mono">
            <div className="flex items-center space-x-2 text-xs text-[#00F0FF]">
              <FileDown className="w-4 h-4 animate-bounce text-[#00F0FF]" />
              <span className="font-bold">PDF Format Requested by User</span>
            </div>
            <button
              onClick={() => onExportSingleMessage(message)}
              className="px-3 py-1 bg-[#00F0FF] hover:bg-[#00D0DF] text-black text-xs font-bold font-mono border border-[#00F0FF] clip-badge-poly shadow-[0_0_10px_rgba(0,240,255,0.4)] flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-black" />
              <span>Download PDF Document</span>
            </button>
          </div>
        )}

        {/* Inline Media Rendering for Image / Video / Music */}
        {message.media && (
          <div className="mt-4 pt-3 border-t border-[#25253D]">
            {message.media.type === 'image' && <InlineImageViewer media={message.media} />}
            {message.media.type === 'video' && <InlineVideoSimulator media={message.media} />}
            {message.media.type === 'music' && <InlineAudioSynthesizer media={message.media} />}
          </div>
        )}

        {/* Grounding citations if present */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-2 border-t border-[#25253D] text-xs text-[#737373] space-y-1 font-mono">
            <p className="font-semibold text-[11px] text-[#00F0FF] flex items-center gap-1">
              <Globe className="w-3 h-3 text-[#00F0FF]" />
              Verified Sources:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {message.sources.map((s, idx) => (
                <a
                  key={idx}
                  href={s.uri}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-0.5 bg-[#141424] border border-[#2D2D45] hover:border-[#00F0FF] text-[#A1A1AA] hover:text-[#00F0FF] text-[11px] truncate max-w-[240px] clip-badge-poly"
                >
                  {s.title || s.uri}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Actions on Model Messages */}
        {!isUser && message.id !== 'welcome' && (
          <div className="mt-3 pt-2 border-t border-[#25253D] flex flex-wrap items-center justify-between gap-2 font-mono">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onExportSingleMessage(message)}
                className="text-[11px] text-[#A1A1AA] hover:text-[#00F0FF] flex items-center space-x-1 transition-colors cursor-pointer"
                title="Download this response as formatted PDF"
              >
                <FileDown className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>Export PDF</span>
              </button>

              <button
                onClick={() => onToggleSpeak(message.id, message.content)}
                className={`text-[11px] flex items-center space-x-1 transition-colors cursor-pointer ${
                  isSpeaking ? 'text-[#00F0FF] font-bold' : 'text-[#A1A1AA] hover:text-[#00F0FF]'
                }`}
                title={isSpeaking ? 'Stop reading' : 'Read aloud with speech synthesis'}
              >
                {isSpeaking ? (
                  <VolumeX className="w-3.5 h-3.5 text-[#00F0FF]" />
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
                  className="text-[11px] font-medium text-[#00F0FF] hover:text-[#00D0DF] flex items-center space-x-1 cursor-pointer"
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
 * 1. Memoized Dynamic Inline Image Renderer (Photorealistic & High-Fidelity)
 */
const InlineImageViewer = memo<{ media: ChatMediaData }>(({ media }) => {
  const [copied, setCopied] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<'fit' | '100' | '150'>('fit');
  const [showCode, setShowCode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const hasRasterImage = Boolean(media.imageUrl || media.url);
  const imageSource = media.imageUrl || media.url || '';

  const handleCopy = () => {
    if (hasRasterImage && imageSource) {
      navigator.clipboard.writeText(imageSource);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }
    if (media.svgData) {
      navigator.clipboard.writeText(media.svgData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadImage = async () => {
    if (isExportingPng) return;
    setIsExportingPng(true);
    try {
      if (hasRasterImage && imageSource) {
        const link = document.createElement('a');
        link.href = imageSource;
        link.download = `photorealistic-${(media.prompt || 'render').slice(0, 32).replace(/\s+/g, '_')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (media.svgData) {
        await downloadPngImage(media.svgData, media.prompt || 'photorealistic-artwork');
      }
    } catch (e) {
      console.error('Image export error:', e);
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleDownloadSvg = () => {
    if (!media.svgData) return;
    downloadSvgImage(media.svgData, media.prompt || 'photorealistic-artwork');
  };

  return (
    <div className={`bg-gradient-to-b from-[#0C0C1C] via-[#080814] to-[#04040A] border border-[#A855F7]/60 clip-cyber-card overflow-hidden shadow-[0_0_25px_rgba(168,85,247,0.15)] font-mono ${isFullscreen ? 'fixed inset-4 z-50 flex flex-col bg-black border-[#A855F7] shadow-[0_0_40px_rgba(168,85,247,0.4)]' : ''}`}>
      <div className="px-3 py-2 bg-[#080814] border-b border-[#25253D] flex flex-wrap items-center justify-between gap-2 text-xs text-[#EDEDED]">
        <div className="flex items-center space-x-2">
          <span className="flex items-center gap-1.5 text-[#A855F7] font-semibold">
            <ImageIcon className="w-3.5 h-3.5 text-[#A855F7]" />
            {hasRasterImage ? 'Photorealistic Image (1K)' : 'Photorealistic Scenic Render'}
          </span>
          <span className="text-[10px] text-[#A1A1AA] bg-black/60 px-2 py-0.5 clip-badge-poly border border-[#2D2D45] hidden sm:inline">
            {hasRasterImage ? 'HDR Cinematic Optics' : 'Multi-Layer Atmospheric'}
          </span>
        </div>
        
        <div className="flex items-center space-x-1.5 flex-wrap">
          <button
            onClick={() => setZoomLevel(prev => prev === 'fit' ? '150' : 'fit')}
            className="px-2 py-1 bg-black/80 hover:bg-[#18182E] border border-[#2D2D45] hover:border-[#A855F7] text-[#A1A1AA] hover:text-[#A855F7] text-[10px] flex items-center gap-1 transition-colors cursor-pointer clip-badge-poly"
            title="Toggle zoom level"
          >
            <span>{zoomLevel === 'fit' ? 'Fit' : '150%'}</span>
          </button>

          {!hasRasterImage && media.svgData && (
            <button
              onClick={() => setShowCode(!showCode)}
              className={`px-2 py-1 border text-[10px] flex items-center gap-1 transition-colors cursor-pointer clip-badge-poly ${
                showCode
                  ? 'bg-[#A855F7] text-black font-bold border-[#A855F7]'
                  : 'bg-black/80 text-[#A1A1AA] hover:text-[#A855F7] border-[#2D2D45] hover:border-[#A855F7]'
              }`}
              title="Inspect SVG XML Source"
            >
              <Code className="w-3 h-3" />
              <span>XML</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="px-2.5 py-1 bg-black/80 hover:bg-[#18182E] border border-[#2D2D45] hover:border-[#A855F7] text-[#A1A1AA] hover:text-[#A855F7] text-[11px] flex items-center gap-1 transition-colors cursor-pointer clip-badge-poly"
            title={hasRasterImage ? 'Copy image data URL' : 'Copy SVG XML code'}
          >
            {copied ? <Check className="w-3 h-3 text-[#A855F7]" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {!hasRasterImage && media.svgData && (
            <button
              onClick={handleDownloadSvg}
              className="px-2.5 py-1 bg-black/80 hover:bg-[#18182E] border border-[#2D2D45] hover:border-[#A855F7] text-[#A1A1AA] hover:text-[#A855F7] text-[11px] flex items-center gap-1 transition-colors cursor-pointer clip-badge-poly"
              title="Download vector SVG file"
            >
              <Download className="w-3 h-3 text-[#A855F7]" />
              <span>SVG</span>
            </button>
          )}

          <button
            onClick={handleDownloadImage}
            disabled={isExportingPng}
            className="px-3 py-1 bg-[#A855F7] hover:bg-[#9333EA] text-black font-bold text-[11px] border border-[#A855F7] clip-badge-poly shadow-[0_0_12px_rgba(168,85,247,0.4)] flex items-center gap-1 transition-all cursor-pointer active:scale-95"
            title="Download full resolution photorealistic PNG"
          >
            {isExportingPng ? <Loader2 className="w-3 h-3 animate-spin text-black" /> : <Download className="w-3 h-3 text-black" />}
            <span>{isExportingPng ? 'Saving...' : 'Download PNG'}</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 bg-black/80 hover:bg-[#18182E] border border-[#2D2D45] hover:border-[#A855F7] text-[#737373] hover:text-[#A855F7] clip-badge-poly cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className={`relative p-4 bg-[#030308] flex items-center justify-center overflow-auto ${isFullscreen ? 'flex-1' : 'min-h-[260px]'}`}>
        {hasRasterImage ? (
          <div
            style={{
              transform: zoomLevel === '150' ? 'scale(1.5)' : 'scale(1)',
              transition: 'transform 0.2s ease',
            }}
            className="relative w-full flex items-center justify-center overflow-hidden"
          >
            <img
              src={imageSource}
              alt={media.prompt || 'Photorealistic AI Generation'}
              className="max-h-[480px] w-auto object-contain border border-[#25253D] shadow-lg clip-cyber-card"
              loading="lazy"
            />
            {/* Somotoz Minimalist Watermark */}
            <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/80 backdrop-blur-md border border-[#A855F7]/50 text-[10px] font-mono font-bold tracking-widest text-[#A855F7] pointer-events-none shadow-lg clip-badge-poly">
              SOMOTOZ
            </div>
          </div>
        ) : showCode && media.svgData ? (
          <pre className="w-full max-h-[350px] overflow-auto p-3 bg-[#060610] border border-[#25253D] text-[11px] text-[#A855F7] leading-tight select-all clip-badge-poly">
            {media.svgData}
          </pre>
        ) : media.svgData ? (
          <div
            style={{
              transform: zoomLevel === '150' ? 'scale(1.5)' : 'scale(1)',
              transition: 'transform 0.2s ease',
            }}
            className="relative w-full max-h-[440px] flex items-center justify-center overflow-hidden [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[400px]"
          >
            <div dangerouslySetInnerHTML={{ __html: media.svgData }} className="w-full h-full flex items-center justify-center" />
            {/* Somotoz Minimalist Watermark */}
            <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/80 backdrop-blur-md border border-[#A855F7]/50 text-[10px] font-mono font-bold tracking-widest text-[#A855F7] pointer-events-none shadow-lg clip-badge-poly">
              SOMOTOZ
            </div>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-[#737373] text-xs font-mono">
            No image data available
          </div>
        )}
      </div>

      <div className="px-3 py-2 bg-[#080814] border-t border-[#25253D] text-[11px] font-mono text-[#737373] flex items-center justify-between gap-2">
        <div className="truncate">
          Prompt: <span className="text-[#EDEDED]">{media.prompt}</span>
        </div>
        <span className="text-[10px] text-[#A855F7] shrink-0 font-bold px-2 py-0.5 bg-black/60 border border-[#2D2D45] clip-badge-poly">
          [100% Photorealistic Engine]
        </span>
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

    const lowerPrompt = (media.prompt || '').toLowerCase();
    const isOcean = /\b(ocean|sea|beach|water|wave|island)\b/i.test(lowerPrompt);
    const isSpace = /\b(space|galaxy|cosmos|planet|star|nebula)\b/i.test(lowerPrompt);
    const isCity = /\b(city|urban|building|skyline|tokyo|street)\b/i.test(lowerPrompt);

    // Particle field initialization
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

      // 1. Sky & Atmospheric Background Gradient
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
        // Nature / Sunset Golden Hour Default
        skyGrad.addColorStop(0, '#1e1b4b');
        skyGrad.addColorStop(0.35, '#431407');
        skyGrad.addColorStop(0.7, '#ea580c');
        skyGrad.addColorStop(1, '#fbbf24');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Celestial Body & Volumetric Glow
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

      // Core Sun / Planet
      ctx.fillStyle = isSpace ? '#c084fc' : '#fffbeb';
      ctx.beginPath();
      ctx.arc(sunX, sunY, isSpace ? 32 : 24, 0, Math.PI * 2);
      ctx.fill();

      // 3. Parallax Midground Scenery
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
          const bX = (i * 65 - (panOffset * 0.4) % 65);
          const bH = 70 + (Math.sin(i * 3) + 1) * 35;
          ctx.fillRect(bX, h * 0.65 - bH, 50, bH + 100);
        }
        ctx.fillStyle = '#0b0416';
        for (let i = -1; i < 10; i++) {
          const bX = (i * 85 - panOffset % 85);
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

      // 4. Volumetric Light Particles
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

      // 5. Cinematic Vignette & Letterbox
      const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.4, w / 2, h / 2, w * 0.7);
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      // 6. HUD Active Timeline Indicator
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
            onClick={() => setMotionSpeed(prev => prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1)}
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
        >
          {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 ml-0.5 text-white" />}
        </button>

        <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-black/90 border border-[#FF007A]/50 text-[10px] text-[#FF007A] clip-badge-poly flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-[#FF007A] rounded-full animate-ping" />
          Scene {activeFrameIndex + 1}/{frames.length}
        </div>

        {/* Minimalist Somotoz Watermark */}
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
          >
            <option value="sine">Sine Wave</option>
            <option value="triangle">Triangle Wave</option>
            <option value="sawtooth">Sawtooth Wave</option>
            <option value="square">Square Wave</option>
          </select>

          <button
            onClick={() => setTempo(prev => prev === 120 ? 140 : prev === 140 ? 90 : 120)}
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
        <span className="truncate">Prompt: <span className="text-[#EDEDED]">{media.prompt}</span></span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[#FFB800]">{notes.length} Harmonics</span>
          <span className="px-2 py-0.5 bg-black border border-[#2D2D45] text-[9px] text-[#FFB800] font-bold clip-badge-poly">SOMOTOZ</span>
        </div>
      </div>
    </div>
  );
});
