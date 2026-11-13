import React, { useState, useRef, useEffect, useMemo, useCallback, memo, lazy, Suspense } from 'react';
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
  Layers,
  Mic,
  MicOff,
  Radio,
  Headphones,
  Paperclip,
  Upload,
  X,
  File,
  FileCode
} from 'lucide-react';
import { ChatMessage, ChatRole, GenerationMode, ChatMediaData, JournalEntry, FileAttachment } from '../types';
import { EmojiPicker } from './EmojiPicker';
import { MarkdownRenderer } from './MarkdownRenderer';
import { exportMessageToPdf, exportConversationToPdf } from '../utils/pdfExport';
import {
  downloadSvgImage,
  downloadPngImage,
} from '../utils/mediaExport';
import { SLASH_COMMANDS, parseClientInputIntent } from '../utils/commandParser';
import { auth } from '../lib/firebase';
import { apiFetch, ApiError } from '../lib/apiClient';

const CanvasVideoSimulator = lazy(() => import('./media/CanvasVideoSimulator'));
const MusicSynthesizer = lazy(() => import('./media/MusicSynthesizer'));

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

  const [isWelcomeCollapsed, setIsWelcomeCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('somotoz_welcome_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [showScrollBottom, setShowScrollBottom] = useState<boolean>(false);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'model',
      content: initialReflection
        ? `Loaded note: **"${initialReflection.title}"**. Ready to help you reflect, generate, or brainstorm.`
        : `**Welcome to Somotoz Ask AI**\n\nAsk questions, explore ideas, or create images, videos, and music right from the composer below.`,
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
  const [activeLoadingMode, setActiveLoadingMode] = useState<GenerationMode>('text');
  const [useSearchGrounding, setUseSearchGrounding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const [dailyLimits, setDailyLimits] = useState<{
    image?: { used: number; limit: number; remaining: number };
    music?: { used: number; limit: number; remaining: number };
    video?: { used: number; limit: number; remaining: number };
  } | null>(null);

  useEffect(() => {
    if (selectedMode === 'text' || !auth.currentUser) return;
    let cancelled = false;
    apiFetch<{
      success: boolean;
      limits?: {
        image: { used: number; limit: number; remaining: number };
        music: { used: number; limit: number; remaining: number };
        video: { used: number; limit: number; remaining: number };
      };
    }>('/api/generate/limits')
      .then((res) => {
        if (!cancelled && res?.limits) {
          setDailyLimits(res.limits);
        }
      })
      .catch(() => {
        // Silent best-effort fetch for remaining count display
      });
    return () => {
      cancelled = true;
    };
  }, [selectedMode]);

  const handleCancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // File Attachments & Multimodal Upload state
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const newAtts: FileAttachment[] = [];
    const fileArray = Array.from(files).slice(0, 5); // Process up to 5 files

    for (const file of fileArray) {
      if (file.size > 20 * 1024 * 1024) {
        setErrorMsg(`File "${file.name}" exceeds 20MB limit.`);
        setTimeout(() => setErrorMsg(null), 4000);
        continue;
      }

      if (file.type.startsWith('image/')) {
        const dataUrl = await new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result as string);
          reader.onerror = rej;
          reader.readAsDataURL(file);
        });
        newAtts.push({
          name: file.name,
          type: file.type || 'image/png',
          size: file.size,
          dataUrl,
          base64: dataUrl,
        });
      } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const dataUrl = await new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result as string);
          reader.onerror = rej;
          reader.readAsDataURL(file);
        });
        newAtts.push({
          name: file.name,
          type: 'application/pdf',
          size: file.size,
          dataUrl,
          base64: dataUrl,
        });
      } else {
        // Plain text, markdown, source code, data formats
        const textContent = await new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result as string);
          reader.onerror = rej;
          reader.readAsText(file);
        });
        newAtts.push({
          name: file.name,
          type: file.type || 'text/plain',
          size: file.size,
          textContent,
        });
      }
    }

    if (newAtts.length > 0) {
      setAttachments((prev) => [...prev, ...newAtts]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Speech Recognition & Voice Talk state
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isVoiceTalkActive, setIsVoiceTalkActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem('somotoz_voice_talk') === 'true';
    } catch {
      return false;
    }
  });
  const recognitionRef = useRef<any>(null);

  // Toggle Voice Talk Mode (automatically speaks AI responses)
  const toggleVoiceTalk = useCallback(() => {
    setIsVoiceTalkActive((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('somotoz_voice_talk', String(next));
      } catch {}
      return next;
    });
  }, []);

  // Web Speech Recognition (Speech-to-Text)
  const toggleSpeechRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser environment.');
      setTimeout(() => setSpeechError(null), 4000);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      setSpeechError(null);

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechTranscript('');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const captured = (final || interim).trim();
        if (captured) {
          setSpeechTranscript(captured);
          setInputText(captured);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission blocked. Please allow mic access in your browser.');
        } else if (event.error !== 'no-speech') {
          setSpeechError(`Speech error: ${event.error}`);
        }
        setIsListening(false);
        setTimeout(() => setSpeechError(null), 4000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Could not start speech recognition:', err);
      setSpeechError('Could not initialize microphone.');
      setIsListening(false);
      setTimeout(() => setSpeechError(null), 4000);
    }
  }, [isListening]);

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
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isAtBottom = distanceFromBottom < 80;
    isAutoScrollEnabled.current = isAtBottom;
    setShowScrollBottom(distanceFromBottom > 160);
  };

  const scrollToBottom = useCallback(() => {
    if (!scrollContainerRef.current) return;
    isAutoScrollEnabled.current = true;
    scrollContainerRef.current.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
    setShowScrollBottom(false);
  }, []);

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
    const currentAttachments = [...attachments];
    if ((!text && currentAttachments.length === 0) || isLoading) return;

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

    const displayText = text || (currentAttachments.length > 0 ? `Please analyze the ${currentAttachments.length} attached document/image file(s).` : '');

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: displayText,
      timestamp: Date.now(),
      mode: effectiveMode,
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
    };

    const newMessages = [...messages, userMsg];
    // 1. INSTANT STATE UPDATE: User bubble appears in <1ms
    setMessages(newMessages);
    setInputText('');
    setAttachments([]);
    setIsLoading(true);
    setActiveLoadingMode(effectiveMode);

    const modelMsgId = `model-${Date.now()}`;
    setActiveStreamingId(modelMsgId);
    setActiveStreamingText('');
    activeStreamBufferRef.current = '';

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Capture client local system time and period for seamless timezone context synchronization
    const now = new Date();
    const clientHour = now.getHours();
    const clientMinute = now.getMinutes();
    let clientTimeOfDay = 'night';
    if (clientHour >= 5 && clientHour < 12) clientTimeOfDay = 'morning';
    else if (clientHour >= 12 && clientHour < 17) clientTimeOfDay = 'afternoon';
    else if (clientHour >= 17 && clientHour < 22) clientTimeOfDay = 'evening';

    const clientTime = {
      hour: clientHour,
      minute: clientMinute,
      timeOfDay: clientTimeOfDay,
      dateStr: now.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }),
      timeStr: now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Browser Timezone',
    };

    // Dedicated Server-Side Hugging Face Media Generation Pipeline (Image / Music / Video)
    if (
      (effectiveMode === 'image' || effectiveMode === 'music' || effectiveMode === 'video') &&
      currentAttachments.length === 0
    ) {
      try {
        const hfResult = await apiFetch<{
          success: boolean;
          mode: GenerationMode;
          imageUrl?: string;
          audioUrl?: string;
          videoUrl?: string;
          prompt: string;
          modelUsed?: string;
          isAiGenerated?: boolean;
          used?: number;
          limit?: number;
          remaining?: number;
        }>(`/api/generate/${effectiveMode}`, {
          method: 'POST',
          body: JSON.stringify({ prompt: cleanPrompt }),
          signal: controller.signal,
        });

        if (typeof hfResult.remaining === 'number' && typeof hfResult.limit === 'number') {
          setDailyLimits((prev) => ({
            ...(prev || {}),
            [effectiveMode]: {
              used: hfResult.used ?? (hfResult.limit! - hfResult.remaining!),
              limit: hfResult.limit!,
              remaining: hfResult.remaining!,
            },
          }));
        }

        const aiMedia: ChatMediaData = {
          type: effectiveMode,
          imageUrl: hfResult.imageUrl,
          audioUrl: hfResult.audioUrl,
          videoUrl: hfResult.videoUrl,
          prompt: hfResult.prompt || cleanPrompt,
          isAiGenerated: true,
          remaining: hfResult.remaining,
          limit: hfResult.limit,
        };

        const aiLabelText =
          effectiveMode === 'image'
            ? `**AI generated** image for: "${aiMedia.prompt}"`
            : effectiveMode === 'music'
            ? `**AI generated** music track for: "${aiMedia.prompt}"`
            : `**AI generated** video for: "${aiMedia.prompt}"`;

        const finalizedHfMsg: ChatMessage = {
          id: modelMsgId,
          role: 'model',
          content: aiLabelText,
          timestamp: Date.now(),
          mode: effectiveMode,
          media: aiMedia,
          modelUsed: hfResult.modelUsed,
        };

        setMessages((prev) => [...prev, finalizedHfMsg]);

        if (onActivityLog) {
          onActivityLog(
            effectiveMode,
            `Generated AI ${effectiveMode}: "${cleanPrompt.slice(0, 35)}${cleanPrompt.length > 35 ? '...' : ''}"`,
            120
          );
        }

        abortControllerRef.current = null;
        setIsLoading(false);
        setActiveStreamingId(null);
        setActiveStreamingText('');
        activeStreamBufferRef.current = '';
        return;
      } catch (hfErr: any) {
        if (hfErr?.name === 'AbortError' || controller.signal.aborted) {
          setErrorMsg('Generation cancelled.');
          abortControllerRef.current = null;
          setIsLoading(false);
          setActiveStreamingId(null);
          setActiveStreamingText('');
          activeStreamBufferRef.current = '';
          return;
        }

        const errorCode = hfErr?.data?.code;
        if (errorCode === 'daily_limit_reached' && typeof hfErr?.data?.limit === 'number') {
          setDailyLimits((prev) => ({
            ...(prev || {}),
            [effectiveMode]: {
              used: hfErr.data.used ?? hfErr.data.limit,
              limit: hfErr.data.limit,
              remaining: 0,
            },
          }));
        }

        // Do not bypass safety blocks or invalid prompt lengths with fallback media
        if (
          errorCode === 'safety_blocked' ||
          (hfErr instanceof ApiError && hfErr.status === 400)
        ) {
          setErrorMsg(hfErr.message || 'This prompt cannot be generated due to safety or validation rules.');
          abortControllerRef.current = null;
          setIsLoading(false);
          setActiveStreamingId(null);
          setActiveStreamingText('');
          activeStreamBufferRef.current = '';
          return;
        }

        // Seamless Fallback to existing SVG / CanvasVideoSimulator / MusicSynthesizer via /api/chat
        try {
          const fallbackData = await apiFetch<{
            success: boolean;
            reply: string;
            mode?: GenerationMode;
            media?: ChatMediaData;
            sources?: Array<{ title: string; uri: string }>;
          }>('/api/chat', {
            method: 'POST',
            body: JSON.stringify({
              messages: [{ role: 'user', content: displayText, attachments: currentAttachments }],
              mode: effectiveMode,
              role: selectedRole,
              contextReflection: initialReflection ? `${initialReflection.title}\n${initialReflection.content}` : undefined,
              useSearchGrounding,
              clientTime,
            }),
            signal: controller.signal,
          });

          const fallbackModelMsg: ChatMessage = {
            id: modelMsgId,
            role: 'model',
            content: `Free AI limit reached or busy, showing the simple version.\n\n${fallbackData.reply}`,
            timestamp: Date.now(),
            mode: fallbackData.mode || effectiveMode,
            media: fallbackData.media,
            sources: fallbackData.sources,
          };
          setMessages((prev) => [...prev, fallbackModelMsg]);
        } catch (fbErr: any) {
          if (fbErr?.name !== 'AbortError') {
            setErrorMsg(
              fbErr instanceof ApiError
                ? fbErr.userFriendlyMessage
                : cleanErrorMessage(fbErr?.message)
            );
          }
        } finally {
          abortControllerRef.current = null;
          setIsLoading(false);
          setActiveStreamingId(null);
          setActiveStreamingText('');
          activeStreamBufferRef.current = '';
        }
        return;
      }
    }

    const chatHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (auth.currentUser) {
      try {
        const idToken = await auth.currentUser.getIdToken();
        chatHeaders['Authorization'] = `Bearer ${idToken}`;
      } catch (tokErr) {
        console.warn('Could not fetch fresh token for chat:', tokErr);
      }
    }

    try {
      const payloadMessages = newMessages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role,
          content: m.content,
          attachments: m.attachments,
        }));

      // Try Real-Time SSE Stream Endpoint
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: chatHeaders,
        signal: controller.signal,
        body: JSON.stringify({
          messages: payloadMessages.length > 0 ? payloadMessages : [{ role: 'user', content: displayText, attachments: currentAttachments }],
          attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
          mode: effectiveMode,
          role: selectedRole,
          contextReflection: initialReflection ? `${initialReflection.title}\n${initialReflection.content}` : undefined,
          useSearchGrounding: useSearchGrounding || text.toLowerCase().startsWith('/search'),
          clientTime,
        }),
      });

      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      if (!response.ok || !response.body || (!contentType.includes('text/event-stream') && !contentType.includes('application/json'))) {
        throw new Error('Streaming unavailable; using standard reply.');
      }

      if (contentType.includes('application/json')) {
        const jsonReply = await response.json();
        if (jsonReply?.reply) {
          setMessages((prev) => [
            ...prev,
            {
              id: modelMsgId,
              role: 'model',
              content: jsonReply.reply,
              timestamp: Date.now(),
              mode: jsonReply.mode || effectiveMode,
              media: jsonReply.media,
              sources: jsonReply.sources,
            },
          ]);
          return;
        }
        throw new Error(jsonReply?.error || 'Unexpected response format.');
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

      // If voice talk mode is active, or if /talk / /voice was requested, speak the response
      if (isVoiceTalkActive || text.toLowerCase().startsWith('/talk') || text.toLowerCase().startsWith('/voice')) {
        setTimeout(() => {
          handleToggleSpeak(modelMsgId, finalFullText || 'Done');
        }, 100);
      }

      // Activity Logging
      if (onActivityLog) {
        const estTokens = Math.max(20, Math.round((displayText.length + (finalFullText?.length || 50)) / 3));
        onActivityLog(
          effectiveMode,
          `Executed: "${displayText.slice(0, 35)}${displayText.length > 35 ? '...' : ''}"`,
          estTokens
        );
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        setErrorMsg('Request cancelled.');
        return;
      }
      console.warn('Streaming error, fallback triggered:', err);
      // Fallback to standard endpoint via apiFetch if streaming connection was interrupted
      try {
        const fallbackData = await apiFetch<{
          success: boolean;
          reply: string;
          mode?: GenerationMode;
          media?: ChatMediaData;
          sources?: Array<{ title: string; uri: string }>;
          error?: string;
        }>('/api/chat', {
          method: 'POST',
          signal: controller.signal,
          body: JSON.stringify({
            messages: [{ role: 'user', content: displayText, attachments: currentAttachments }],
            attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
            mode: effectiveMode,
            role: selectedRole,
            contextReflection: initialReflection ? `${initialReflection.title}\n${initialReflection.content}` : undefined,
            useSearchGrounding,
            clientTime,
          }),
        });

        if (fallbackData?.reply) {
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
          setErrorMsg('Unable to generate a response right now. Please try again.');
        }
      } catch (fbErr: any) {
        if (fbErr?.name === 'AbortError') {
          setErrorMsg('Request cancelled.');
        } else if (fbErr instanceof ApiError) {
          setErrorMsg(fbErr.userFriendlyMessage);
        } else {
          setErrorMsg(cleanErrorMessage(fbErr?.message));
        }
      }
    } finally {
      abortControllerRef.current = null;
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
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="gemini-chat-container font-sans"
    >
      {/* Drag and drop file upload overlay */}
      {isDraggingOver && (
        <div className="absolute inset-2 sm:inset-4 z-50 bg-[var(--bg-primary)]/90 backdrop-blur-md border-2 border-dashed border-[var(--border-active)] rounded-2xl flex flex-col items-center justify-center p-6 text-center shadow-2xl animate-fade-in pointer-events-none">
          <div className="w-16 h-16 rounded-2xl bg-[var(--border-active)]/15 border border-[var(--border-active)] flex items-center justify-center text-[var(--border-active)] mb-3 shadow-[0_0_24px_rgba(0,240,255,0.4)]">
            <Upload className="w-8 h-8 animate-bounce" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] font-mono">
            Drop Files & Documents for Deep Analysis
          </h3>
          <p className="text-xs text-[var(--text-secondary)] font-mono mt-1">
            Supports Images, PDFs, Docs, Source Code, CSV, and Datasets
          </p>
        </div>
      )}

      {/* Messages Scroll Area - Gemini-Style Upper Scrollable Viewport */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="gemini-chat-stream p-3 sm:p-5 md:p-6 space-y-4 font-sans relative text-[var(--text-primary)] scroll-smooth"
      >
        {messages.map((msg, index) => {
          if (msg.id === 'welcome') {
            return (
              <div
                key="welcome"
                className="p-3.5 sm:p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[var(--accent-color)]/15 text-[var(--accent-color)] flex items-center justify-center font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
                      Ask AI
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsWelcomeCollapsed((prev) => {
                        const next = !prev;
                        try {
                          localStorage.setItem('somotoz_welcome_collapsed', String(next));
                        } catch {}
                        return next;
                      });
                    }}
                    className="p-1 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
                    title={isWelcomeCollapsed ? 'Expand intro' : 'Collapse intro'}
                    aria-label={isWelcomeCollapsed ? 'Expand intro' : 'Collapse intro'}
                  >
                    {isWelcomeCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>

                {!isWelcomeCollapsed && (
                  <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
                    {msg.content}
                  </p>
                )}
              </div>
            );
          }

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

        {/* ACTIVE STREAMING / MEDIA GENERATION ASSISTANT BUBBLE */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 shrink-0 bg-[var(--bg-secondary)] border border-[var(--border-active)] text-[var(--border-active)] flex items-center justify-center clip-badge-poly shadow-sm">
              <Bot className="w-4 h-4 text-[var(--border-active)] animate-spin" />
            </div>

            <div className="max-w-[92%] sm:max-w-[82%] p-4 bg-[var(--chat-bot-bg)] chat-bot-message border border-[var(--border-active)] text-[var(--text-primary)] clip-cyber-card shadow-md space-y-2">
              <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[var(--border-active)] border-b border-[var(--border-color)] pb-1.5">
                <span className="flex items-center gap-1.5 font-bold">
                  <Zap className="w-3.5 h-3.5 animate-pulse text-[var(--border-active)]" />
                  {activeLoadingMode === 'text' ? 'STREAMING REAL-TIME RESPONSE' : `GENERATING ${activeLoadingMode.toUpperCase()}`}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[var(--text-secondary)] uppercase px-1.5 py-0.2 bg-[var(--bg-elevated)] border border-[var(--border-color)] clip-badge-poly text-[9px]">{activeLoadingMode} MODE</span>
                  <button
                    type="button"
                    onClick={handleCancelGeneration}
                    className="px-2 py-0.5 bg-rose-600/90 hover:bg-rose-500 text-white text-[10px] font-bold rounded cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <div className="min-h-[24px]">
                {activeStreamingText ? (
                  <div className="relative">
                    <MarkdownRenderer
                      content={activeStreamingText}
                      accessibleReadingMode={accessibleReadingMode}
                    />
                    <span className="inline-block w-2 h-4 bg-[var(--border-active)] ml-1 animate-pulse align-middle" />
                  </div>
                ) : (
                  <div className="text-[var(--text-muted)] italic font-mono text-xs flex flex-col gap-1 py-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[var(--border-active)] rounded-full animate-ping" />
                      <span>
                        {activeLoadingMode === 'text'
                          ? `Thinking & generating in ${activeLanguageStyle}...`
                          : `Generating ${activeLoadingMode}... This can take up to a minute`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {speechError && (
          <div className="p-3 bg-amber-950/50 border border-amber-600 text-amber-200 text-xs font-mono clip-badge-poly flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <MicOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              {speechError}
            </span>
            <button
              onClick={() => setSpeechError(null)}
              className="text-[10px] underline hover:text-amber-100 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {isListening && (
          <div className="p-2.5 bg-gradient-to-r from-[#00F0FF]/15 via-[#A855F7]/15 to-[#FF007A]/15 border border-[var(--border-active)] text-xs font-mono clip-badge-poly flex items-center justify-between gap-2 animate-pulse">
            <div className="flex items-center gap-2 text-[var(--border-active)]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="font-bold">LISTENING... SPEAK NOW:</span>
              <span className="text-[var(--text-primary)] italic max-w-[280px] sm:max-w-md truncate">
                {speechTranscript || 'Listening to your voice...'}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold clip-badge-poly cursor-pointer"
            >
              Stop
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-mono rounded-xl">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Jump to latest message floating indicator button */}
      {showScrollBottom && (
        <div className="absolute bottom-24 right-4 sm:right-8 z-30 pointer-events-auto">
          <button
            type="button"
            onClick={scrollToBottom}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--accent-color)] text-[var(--text-primary)] shadow-lg backdrop-blur-md text-xs font-medium cursor-pointer transition-all hover:scale-105 active:scale-95"
            aria-label="Jump to latest message"
          >
            <ArrowDown className="w-3.5 h-3.5 text-[var(--accent-color)]" />
            <span>Latest</span>
          </button>
        </div>
      )}

      {/* Gemini-Style Sticky Bottom Input Dock with Rounded Pill Styling */}
      <div className="gemini-chat-input-dock">
        <form
          onSubmit={handleSendMessage}
          className="relative flex flex-col gap-2 p-2 sm:p-3 bg-[var(--bg-card)]/95 backdrop-blur-xl border-2 border-[var(--border-color)] focus-within:border-[var(--border-active)] focus-within:shadow-[0_0_24px_rgba(0,240,255,0.18)] rounded-2xl sm:rounded-3xl transition-all duration-300 font-mono shadow-lg"
        >
          <EmojiPicker
            isOpen={showEmojiPicker}
            onClose={() => setShowEmojiPicker(false)}
            onSelectEmoji={handleInsertEmoji}
          />

          {/* Hidden File Input for Paperclip Attachments */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.csv,.json,.md,.js,.ts,.tsx,.jsx,.py,.html,.css,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Slash Command Autocomplete Dropdown Popup */}
          {filteredCommandSuggestions.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-3 bg-[var(--bg-card)] border-2 border-[var(--border-active)] clip-cyber-card shadow-2xl z-40 max-h-60 overflow-y-auto font-mono text-[var(--text-primary)] rounded-lg">
              <div className="px-3.5 py-2 bg-[var(--bg-elevated)] border-b border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--border-active)]">
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

          {/* Attached Files & Media Previews Tray */}
          {attachments.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
              {attachments.map((att, idx) => {
                const isImg = att.type?.startsWith('image/') || att.dataUrl?.startsWith('data:image/');
                return (
                  <div
                    key={idx}
                    className="relative flex items-center gap-2 px-2.5 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-active)]/60 text-xs font-mono rounded-lg clip-badge-poly shrink-0 shadow-sm"
                  >
                    {isImg && att.dataUrl ? (
                      <img
                        src={att.dataUrl}
                        alt={att.name}
                        className="w-7 h-7 object-cover rounded border border-[var(--border-color)]"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--border-active)]">
                        {att.type === 'application/pdf' ? (
                          <FileText className="w-4 h-4 text-rose-400" />
                        ) : (
                          <Paperclip className="w-4 h-4 text-[var(--border-active)]" />
                        )}
                      </div>
                    )}
                    <div className="max-w-[130px] sm:max-w-[180px]">
                      <p className="font-bold text-[var(--text-primary)] truncate text-[11px]">{att.name}</p>
                      <p className="text-[9px] text-[var(--text-secondary)]">
                        {att.size ? `${(att.size / 1024).toFixed(1)} KB` : att.type}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="p-1 text-[var(--text-muted)] hover:text-rose-400 transition-colors cursor-pointer rounded-full ml-1"
                      title="Remove attachment"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Clean Mode Selection Chips: Chat, Image, Video, Music + Remaining Daily Count */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-1 select-none">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: 'text' as const, label: 'Chat', icon: MessageSquare },
                { id: 'image' as const, label: 'Image', icon: ImageIcon },
                { id: 'video' as const, label: 'Video', icon: Film },
                { id: 'music' as const, label: 'Music', icon: Music },
              ].map((chip) => {
                const isSelected = selectedMode === chip.id;
                const ChipIcon = chip.icon;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setSelectedMode(chip.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--accent-color)] text-black shadow-xs'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
                    }`}
                  >
                    <ChipIcon className="w-3.5 h-3.5" />
                    <span>{chip.label}</span>
                  </button>
                );
              })}
            </div>
            {selectedMode !== 'text' && dailyLimits?.[selectedMode] && (
              <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                Daily {selectedMode} left: <strong className="text-[var(--text-primary)]">{dailyLimits[selectedMode]!.remaining}/{dailyLimits[selectedMode]!.limit}</strong>
              </span>
            )}
          </div>

          {/* Unified Single Input Box */}
          <div className="relative flex items-center bg-[var(--bg-input)] border border-[var(--border-color)] focus-within:border-[var(--border-active)] rounded-2xl shadow-sm transition-all">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isListening
                  ? 'Listening to speech... speak clearly...'
                  : attachments.length > 0
                  ? 'Ask instructions for attached files or tap Send...'
                  : selectedMode === 'image'
                  ? 'Describe the image you want to create...'
                  : selectedMode === 'video'
                  ? 'Describe the scene to simulate (60 FPS)...'
                  : selectedMode === 'music'
                  ? 'Describe the melody or ambient mood...'
                  : 'Ask anything, attach files, or tap Mic...'
              }
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-transparent text-sm sm:text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none font-sans"
            />

            <div className="flex items-center space-x-1.5 pr-2">
              {/* Sleek Paperclip File / Image Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 border transition-all cursor-pointer clip-badge-poly relative ${
                  attachments.length > 0
                    ? 'bg-[var(--border-active)] text-black border-[var(--border-active)] shadow-[0_0_12px_rgba(0,240,255,0.4)] font-bold'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--border-active)] border-[var(--border-color)] hover:border-[var(--border-active)]'
                }`}
                title="Attach files, images, PDFs, docs, or datasets for deep analysis"
              >
                <Paperclip className="w-4 h-4" />
                {attachments.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border border-black shadow-xs">
                    {attachments.length}
                  </span>
                )}
              </button>

              {/* Native Microphone Speech-To-Text Button */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`p-2 border transition-all cursor-pointer clip-badge-poly ${
                  isListening
                    ? 'bg-rose-600 text-white border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse font-bold'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-rose-400 border-[var(--border-color)] hover:border-rose-400'
                }`}
                title={isListening ? 'Stop speech recognition' : 'Speak using Speech-to-Text'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

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

              <button
                type="submit"
                disabled={isLoading || (!inputText.trim() && attachments.length === 0 && !isListening)}
                className="ml-1 px-4 py-2 bg-gradient-to-r from-[#00F0FF] to-[#A855F7] hover:brightness-110 disabled:opacity-40 text-black text-xs font-mono font-bold border border-[#00F0FF] clip-badge-poly shadow-sm active:scale-95 transition-all flex items-center space-x-1.5 cursor-pointer min-h-[38px]"
              >
                <Send className="w-3.5 h-3.5 text-black" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

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
        {/* Attached Files rendering in User Message */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-2.5 flex flex-wrap gap-2">
            {message.attachments.map((att, attIdx) => {
              const isImg = att.type?.startsWith('image/') || att.dataUrl?.startsWith('data:image/');
              return (
                <div
                  key={attIdx}
                  className="flex items-center gap-2 p-1.5 bg-black/40 border border-white/20 rounded-lg text-xs font-mono"
                >
                  {isImg && att.dataUrl ? (
                    <img
                      src={att.dataUrl}
                      alt={att.name}
                      className="w-10 h-10 object-cover rounded border border-white/20"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center text-[var(--border-active)]">
                      {att.type === 'application/pdf' ? (
                        <FileText className="w-5 h-5 text-rose-400" />
                      ) : (
                        <Paperclip className="w-5 h-5 text-cyan-300" />
                      )}
                    </div>
                  )}
                  <div className="max-w-[140px] truncate text-left">
                    <p className="font-semibold text-white truncate text-[11px]">{att.name}</p>
                    <p className="text-[9px] text-white/70">
                      {att.size ? `${(att.size / 1024).toFixed(1)} KB` : 'File'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

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

        {/* Clean Markdown Parsed Content */}
        {isUser ? (
          <div className={`text-[var(--text-primary)] whitespace-pre-wrap ${accessibleReadingMode ? 'leading-loose tracking-wide font-sans text-[15px]' : 'leading-relaxed font-sans text-[14px] sm:text-[14.5px]'}`}>
            {message.content}
          </div>
        ) : (
          <MarkdownRenderer
            content={message.content}
            accessibleReadingMode={accessibleReadingMode}
          />
        )}

        {/* PROMPT-TRIGGERED CONDITIONAL PDF EXPORT ACTION PILL */}
        {isPdfExplicitlyRequested && (
          <div className="mt-3 p-2.5 bg-[var(--bg-elevated)] border border-[var(--border-active)] clip-badge-poly flex flex-wrap items-center justify-between gap-2 font-mono">
            <div className="flex items-center space-x-2 text-xs text-[var(--border-active)]">
              <FileDown className="w-4 h-4 animate-bounce text-[var(--border-active)]" />
              <span className="font-bold">PDF Format Requested by User</span>
            </div>
            <button
              onClick={() => onExportSingleMessage(message)}
              className="px-3 py-1 bg-[var(--border-active)] hover:brightness-110 text-black text-xs font-bold font-mono border border-[var(--border-active)] clip-badge-poly shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-black" />
              <span>Download PDF Document</span>
            </button>
          </div>
        )}

        {/* Inline Media Rendering for Image / Video / Music */}
        {message.media && (
          <div className="mt-4 pt-3 border-t border-[var(--border-color)]">
            {message.media.type === 'image' && <InlineImageViewer media={message.media} />}
            {message.media.type === 'video' && (
              message.media.videoUrl ? (
                <div className="bg-[#080814] border border-[#FF007A]/60 rounded-xl overflow-hidden font-mono">
                  <div className="px-3 py-2 border-b border-[#25253D] flex items-center justify-between gap-2 text-xs text-[#EDEDED]">
                    <span className="flex items-center gap-1.5 text-[#FF007A] font-semibold">
                      <Film className="w-3.5 h-3.5" />
                      AI generated
                    </span>
                    <a
                      href={message.media.videoUrl}
                      download={`somotoz-video-${Date.now()}.mp4`}
                      className="px-2.5 py-1 bg-[#FF007A] text-white text-[11px] font-bold rounded flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </a>
                  </div>
                  <div className="p-3 bg-black flex justify-center">
                    <video
                      src={message.media.videoUrl}
                      controls
                      playsInline
                      className="max-h-[400px] w-full rounded border border-[#25253D]"
                    />
                  </div>
                </div>
              ) : (
                <Suspense
                  fallback={
                    <div className="h-56 rounded-xl bg-[#080814] border border-[#25253D] animate-pulse flex items-center justify-center text-xs font-mono text-[#FF007A]">
                      Loading Video Studio...
                    </div>
                  }
                >
                  <CanvasVideoSimulator media={message.media} />
                </Suspense>
              )
            )}
            {message.media.type === 'music' && (
              message.media.audioUrl ? (
                <div className="bg-[#080814] border border-[#FFB800]/60 rounded-xl overflow-hidden font-mono">
                  <div className="px-3 py-2 border-b border-[#25253D] flex items-center justify-between gap-2 text-xs text-[#EDEDED]">
                    <span className="flex items-center gap-1.5 text-[#FFB800] font-semibold">
                      <Music className="w-3.5 h-3.5" />
                      AI generated
                    </span>
                    <a
                      href={message.media.audioUrl}
                      download={`somotoz-music-${Date.now()}.wav`}
                      className="px-2.5 py-1 bg-[#FFB800] text-black text-[11px] font-bold rounded flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </a>
                  </div>
                  <div className="p-3 bg-[#030308] space-y-2">
                    <audio
                      src={message.media.audioUrl}
                      controls
                      className="w-full"
                    />
                    {message.media.prompt && (
                      <p className="text-[11px] text-[#A1A1AA] truncate">
                        Prompt: <span className="text-[#EDEDED]">{message.media.prompt}</span>
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <Suspense
                  fallback={
                    <div className="h-44 rounded-xl bg-[#080814] border border-[#25253D] animate-pulse flex items-center justify-center text-xs font-mono text-[#FFB800]">
                      Loading Music Synthesizer...
                    </div>
                  }
                >
                  <MusicSynthesizer media={message.media} />
                </Suspense>
              )
            )}
          </div>
        )}

        {/* Grounding citations if present */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-2 border-t border-[var(--border-color)] text-xs text-[var(--text-muted)] space-y-1 font-mono">
            <p className="font-semibold text-[11px] text-[var(--border-active)] flex items-center gap-1">
              <Globe className="w-3 h-3 text-[var(--border-active)]" />
              Verified Sources:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {message.sources.map((s, idx) => (
                <a
                  key={idx}
                  href={s.uri}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-0.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--border-active)] text-[var(--text-secondary)] hover:text-[var(--border-active)] text-[11px] truncate max-w-[240px] clip-badge-poly transition-colors"
                >
                  {s.title || s.uri}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Actions on Model Messages */}
        {!isUser && message.id !== 'welcome' && (
          <div className="mt-3 pt-2 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-2 font-mono">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onExportSingleMessage(message)}
                className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--border-active)] flex items-center space-x-1 transition-colors cursor-pointer"
                title="Download this response as formatted PDF"
              >
                <FileDown className="w-3.5 h-3.5 text-[var(--border-active)]" />
                <span>Export PDF</span>
              </button>

              <button
                onClick={() => onToggleSpeak(message.id, message.content)}
                className={`text-[11px] flex items-center space-x-1 transition-colors cursor-pointer ${
                  isSpeaking ? 'text-[var(--border-active)] font-bold' : 'text-[var(--text-secondary)] hover:text-[var(--border-active)]'
                }`}
                title={isSpeaking ? 'Stop reading' : 'Read aloud with speech synthesis'}
              >
                {isSpeaking ? (
                  <VolumeX className="w-3.5 h-3.5 text-[var(--border-active)]" />
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
                  className="text-[11px] font-medium text-[var(--border-active)] hover:opacity-80 flex items-center space-x-1 cursor-pointer transition-opacity"
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
            {media.isAiGenerated ? 'AI generated' : hasRasterImage ? 'Photorealistic Image (1K)' : 'Photorealistic Scenic Render'}
          </span>
          <span className="text-[10px] text-[#A1A1AA] bg-black/60 px-2 py-0.5 clip-badge-poly border border-[#2D2D45] hidden sm:inline">
            {media.isAiGenerated ? 'AI generated' : hasRasterImage ? 'HDR Cinematic Optics' : 'Multi-Layer Atmospheric'}
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
