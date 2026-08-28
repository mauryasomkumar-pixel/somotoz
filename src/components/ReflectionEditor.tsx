import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Send, Lightbulb, Heart, Feather, Compass, Mic, Square, Loader2, Zap, BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';
import { DynamicWelcomeBanner } from './DynamicWelcomeBanner';
import { useTheme } from '../context/ThemeContext';

interface ReflectionEditorProps {
  initialContent?: string;
  initialTitle?: string;
  isSubmitting: boolean;
  onSubmit: (content: string, title?: string, promptType?: string) => Promise<void>;
  onCancelEdit?: () => void;
  isEditMode?: boolean;
  userName?: string | null;
}

const PROMPT_SUGGESTIONS = [
  {
    id: 'gratitude',
    icon: Heart,
    title: 'Daily Gratitude',
    prompt: 'What are three specific things—big or small—that brought you happiness, peace, or relief today?',
  },
  {
    id: 'unpacking',
    icon: Compass,
    title: 'Solve a Problem',
    prompt: 'What situation is causing stress or taking your energy right now? What is one step you can take to make it better?',
  },
  {
    id: 'breakthrough',
    icon: Lightbulb,
    title: 'Key Learning',
    prompt: 'Reflect on a challenge you recently faced. What did it teach you, and how will you handle it better next time?',
  },
  {
    id: 'freewrite',
    icon: Feather,
    title: 'Free Writing',
    prompt: 'Write whatever comes to mind freely. What are your main thoughts and feelings right now?',
  },
];

export const ReflectionEditor: React.FC<ReflectionEditorProps> = ({
  initialContent = '',
  initialTitle = '',
  isSubmitting,
  onSubmit,
  onCancelEdit,
  isEditMode = false,
  userName,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'white';
  const isMix = theme === 'mix';

  const textPrimaryClass = isLight
    ? 'text-[#090D16]'
    : isMix
    ? 'text-[#231E19]'
    : 'text-[#EDEDED]';

  const textSecondaryClass = isLight
    ? 'text-[#475569]'
    : isMix
    ? 'text-[#5F564D]'
    : 'text-[#A1A1AA]';

  const textMutedClass = isLight
    ? 'text-[#64748B]'
    : isMix
    ? 'text-[#7D7365]'
    : 'text-[#737373]';

  const cardBgClass = isLight
    ? 'bg-white/95 border-2 border-[#CBD5E1] shadow-[0_8px_30px_rgba(2,132,199,0.12)]'
    : isMix
    ? 'bg-[#FAF6EE]/95 border-2 border-[#D3C7B5] shadow-[0_8px_30px_rgba(217,119,6,0.12)]'
    : 'bg-gradient-to-br from-[#0B0B14] via-[#07070E] to-[#030306] border-2 border-[#2D2D45] shadow-[0_0_35px_rgba(0,255,65,0.08)]';

  const subCardBgClass = isLight
    ? 'bg-[#F8FAFC] border-[#CBD5E1]'
    : isMix
    ? 'bg-[#F4EFE6] border-[#D8CEBF]'
    : 'bg-[#0D0D14] border-[#262626]';

  const inputBgClass = isLight
    ? 'bg-white border-[#CBD5E1] text-[#090D16] placeholder-[#94A3B8] focus:border-[#0284C7]'
    : isMix
    ? 'bg-[#FDFBF7] border-[#D8CEBF] text-[#231E19] placeholder-[#A89F91] focus:border-[#D97706]'
    : 'bg-black border-[#262626] text-[#EDEDED] placeholder-[#525252] focus:border-[#00FF41]';

  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState(initialTitle);
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  // Audio Voice Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setContent(initialContent);
    setTitle(initialTitle);
  }, [initialContent, initialTitle]);

  // Loading animation sequence
  useEffect(() => {
    let timer: any;
    if (isSubmitting) {
      setLoadingStep(0);
      const steps = [
        'Reading and organizing your note...',
        'Understanding moods and key highlights...',
        'Creating helpful tips and key action takeaways...',
      ];
      timer = setInterval(() => {
        setLoadingStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 1600);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(timer);
  }, [isSubmitting]);

  // Recording Timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setRecordingSeconds(0);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  const handleStartRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleTranscribeBlob(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      setError('Microphone access was denied or is not supported in this browser.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscribeBlob = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const res = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Data,
            mimeType: 'audio/webm',
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to transcribe voice.');
        }

        const transcribed = data.transcription || '';
        if (transcribed) {
          setContent((prev) => (prev.trim() ? `${prev.trim()}\n\n${transcribed}` : transcribed));
        }
        setIsTranscribing(false);
      };
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError(err.message || 'Voice to text conversion failed. You can continue typing manually.');
      setIsTranscribing(false);
    }
  };

  // Word count & character count
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim()) {
      setError('Please type your thoughts or record voice before saving.');
      return;
    }
    setError(null);
    try {
      await onSubmit(content.trim(), title.trim() || undefined, activePrompt || undefined);
      if (!isEditMode) {
        setContent('');
        setTitle('');
        setActivePrompt(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save note. Please try again.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isSubmitting && content.trim()) {
        handleSubmit();
      }
    }
  };

  const handleApplyPrompt = (promptText: string, promptId: string) => {
    setActivePrompt(promptId);
    if (!content.trim()) {
      setContent(promptText + '\n\n');
    } else {
      setContent((prev) => `${prev.trim()}\n\n---\n${promptText}\n\n`);
    }
  };

  const loadingMessages = [
    'Reading and organizing your note...',
    'Understanding moods and key highlights...',
    'Creating helpful tips and key action takeaways...',
  ];

  return (
    <div className={`max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-5 font-sans transition-colors duration-300 ${textPrimaryClass}`}>
      {/* Welcome Banner */}
      {!isEditMode && <DynamicWelcomeBanner userName={userName} />}

      {/* Editor Card with Non-Rectangular Polygon & Multi-Color Glowing Gradient Border */}
      <div className={`relative overflow-hidden clip-cyber-card transition-all duration-300 ${cardBgClass}`}>
        {/* Top Multi-Color Glowing Gradient Accent Border */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#00FF41] via-[#00F0FF] via-[#A855F7] to-[#FF007A] z-20" />

        {/* Header Bar */}
        <div className={`px-5 py-4 border-b flex flex-wrap items-center justify-between gap-3 font-mono ${
          isLight ? 'bg-slate-50/90 border-[#CBD5E1]' : isMix ? 'bg-[#ECE5D6]/90 border-[#D8CEBF]' : 'bg-black/90 border-[#262626]'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 flex items-center justify-center clip-badge-poly border transition-all ${
              isLight
                ? 'bg-emerald-100 border-emerald-300 text-emerald-700 shadow-sm'
                : isMix
                ? 'bg-amber-100 border-amber-300 text-amber-800 shadow-sm'
                : 'bg-black border-[#00FF41] text-[#00FF41] shadow-[0_0_12px_rgba(0,255,65,0.4)]'
            }`}>
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-sm sm:text-base font-bold flex items-center gap-2 ${textPrimaryClass}`}>
                {isEditMode ? 'Edit Daily Note' : 'Daily Note & Journal'}
                <span className={`text-[9px] px-2 py-0.5 clip-badge-poly border font-bold ${
                  isLight
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : isMix
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-[#141414] text-[#00FF41] border-[#262626]'
                }`}>
                  ACTIVE
                </span>
              </h2>
              <p className={`text-xs ${textSecondaryClass}`}>
                {isEditMode
                  ? 'Update your note and generate fresh AI insights'
                  : 'Write your thoughts or speak using your microphone'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className={`px-2.5 py-0.5 clip-badge-poly border font-bold ${
              isLight
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : isMix
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-black text-[#00FF41] border-[#262626]'
            }`}>
              {wordCount} words
            </span>
            <span className={`px-2.5 py-0.5 clip-badge-poly border ${
              isLight
                ? 'bg-slate-100 text-slate-700 border-slate-300'
                : isMix
                ? 'bg-[#EFE7DA] text-[#231E19] border-[#D8CEBF]'
                : 'bg-black text-[#A1A1AA] border-[#262626]'
            }`}>
              {charCount} chars
            </span>
          </div>
        </div>

        {/* Quick Starters (Prompt Inspiration) */}
        {!isEditMode && (
          <div className="px-5 pt-4 pb-2 font-mono">
            <div className="flex items-center space-x-2 mb-2.5">
              <Zap className="w-3.5 h-3.5 text-[#00FF41]" />
              <span className={`text-[11px] font-bold uppercase tracking-wider ${textSecondaryClass}`}>
                Quick Starters (Optional)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PROMPT_SUGGESTIONS.map((item) => {
                const IconComponent = item.icon;
                const isSelected = activePrompt === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleApplyPrompt(item.prompt, item.id)}
                    className={`p-3 border text-left transition-all cursor-pointer flex items-start space-x-2.5 clip-badge-poly ${
                      isSelected
                        ? isLight
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-md ring-1 ring-emerald-500'
                          : isMix
                          ? 'bg-amber-50 border-amber-500 text-amber-950 shadow-md ring-1 ring-amber-500'
                          : 'bg-black border-[#00FF41] text-[#00FF41] shadow-[0_0_15px_rgba(0,255,65,0.3)]'
                        : subCardBgClass
                    }`}
                  >
                    <div
                      className={`p-1.5 border shrink-0 clip-badge-poly ${
                        isSelected
                          ? isLight
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : isMix
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-[#00FF41] text-black border-[#00FF41]'
                          : isLight
                          ? 'bg-slate-100 border-slate-300 text-emerald-700'
                          : isMix
                          ? 'bg-[#ECE5D6] border-[#D8CEBF] text-amber-800'
                          : 'bg-black border-[#262626] text-[#00FF41]'
                      }`}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1 font-sans">
                      <h4 className={`text-xs font-bold font-mono ${textPrimaryClass}`}>{item.title}</h4>
                      <p className={`text-[11px] line-clamp-1 mt-0.5 ${textSecondaryClass}`}>{item.prompt}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Audio Recording Bar */}
        <div className="px-5 pt-3 font-mono">
          <div className={`p-3 border flex items-center justify-between gap-3 clip-badge-poly ${subCardBgClass}`}>
            <div className="flex items-center space-x-2.5">
              {isRecording ? (
                <div className="flex items-center space-x-2 text-rose-500 font-medium text-xs">
                  <span className="w-2.5 h-2.5 bg-rose-500 animate-ping inline-block rounded-full" />
                  <span>Recording audio ({recordingSeconds}s)...</span>
                </div>
              ) : isTranscribing ? (
                <div className="flex items-center space-x-2 text-[#00FF41] font-medium text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Converting your voice to text...</span>
                </div>
              ) : (
                <div className={`text-xs flex items-center space-x-1.5 ${textSecondaryClass}`}>
                  <Mic className="w-3.5 h-3.5 text-[#00FF41]" />
                  <span>Voice Note: Click record to speak naturally</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {isRecording ? (
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-600 text-rose-300 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer clip-badge-poly"
                >
                  <Square className="w-3 h-3 text-rose-400" />
                  <span>Stop & Convert</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  disabled={isSubmitting || isTranscribing}
                  className={`px-3 py-1.5 border text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 clip-badge-poly ${
                    isLight
                      ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                      : isMix
                      ? 'bg-[#ECE5D6] hover:bg-[#E2DAC8] border-[#D8CEBF] text-[#231E19]'
                      : 'bg-black hover:bg-[#141414] border-[#262626] hover:border-[#00FF41] text-[#EDEDED] hover:text-[#00FF41]'
                  }`}
                >
                  <Mic className="w-3 h-3 text-[#00FF41]" />
                  <span>Record Voice</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 font-mono">
          {/* Title Input */}
          <div className="space-y-1.5">
            <label className={`block text-[11px] font-bold uppercase tracking-wider ${textSecondaryClass}`}>
              Note Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Today's learnings, project planning, morning reflection..."
              disabled={isSubmitting}
              className={`w-full px-3.5 py-2.5 border text-sm transition-all font-sans clip-badge-poly outline-none ${inputBgClass}`}
            />
          </div>

          {/* Main Content Textarea */}
          <div className="space-y-1.5">
            <label className={`block text-[11px] font-bold uppercase tracking-wider flex items-center justify-between ${textSecondaryClass}`}>
              <span>Your Thoughts & Notes</span>
              <span className={`text-[10px] ${textMutedClass}`}>Tip: Press Ctrl+Enter to save</span>
            </label>
            <textarea
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write what happened today, ideas you're thinking about, or challenges you're facing..."
              disabled={isSubmitting}
              className={`w-full px-3.5 py-3 border text-sm transition-all font-sans resize-y leading-relaxed clip-badge-poly outline-none ${inputBgClass}`}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center space-x-2 clip-badge-poly">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submitting Loading Status Banner */}
          {isSubmitting && (
            <div className={`p-4 border flex items-center space-x-3 clip-badge-poly ${
              isLight ? 'bg-emerald-50 border-emerald-500' : isMix ? 'bg-amber-50 border-amber-500' : 'bg-black border-[#00FF41] shadow-[0_0_15px_rgba(0,255,65,0.2)]'
            }`}>
              <Loader2 className="w-5 h-5 text-[#00FF41] animate-spin shrink-0" />
              <div className="font-mono text-xs">
                <p className="text-[#00FF41] font-bold">{loadingMessages[loadingStep]}</p>
                <p className={`text-[10px] ${textMutedClass}`}>Processing note with Somotoz AI...</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className={`pt-3 flex flex-wrap items-center justify-between gap-3 border-t ${
            isLight ? 'border-[#E2E8F0]' : isMix ? 'border-[#E2D9CA]' : 'border-[#262626]'
          }`}>
            {isEditMode && onCancelEdit ? (
              <button
                type="button"
                onClick={onCancelEdit}
                disabled={isSubmitting}
                className={`px-4 py-2 border text-xs font-bold transition-colors cursor-pointer clip-badge-poly ${
                  isLight
                    ? 'bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900'
                    : isMix
                    ? 'bg-[#ECE5D6] border-[#D8CEBF] text-[#231E19] hover:text-black'
                    : 'bg-black hover:bg-[#141414] border-[#262626] text-[#A1A1AA] hover:text-[#EDEDED]'
                }`}
              >
                CANCEL EDIT
              </button>
            ) : (
              <div className={`text-[11px] font-mono ${textMutedClass}`}>
                Saved securely to your private cloud storage
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-6 py-3 bg-[#00FF41] hover:bg-[#00E038] text-black font-mono font-bold text-xs tracking-wider border border-[#00FF41] clip-badge-poly shadow-[0_0_20px_rgba(0,255,65,0.4)] active:scale-95 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>ANALYZING & SAVING...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-black" />
                  <span>{isEditMode ? 'UPDATE NOTE' : 'SAVE & ANALYZE NOTE'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
