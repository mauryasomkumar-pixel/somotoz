import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, Lightbulb, RotateCcw, AlertCircle, Heart, Feather, Compass, Mic, Square, Loader2, Terminal, Zap, Activity, Cpu } from 'lucide-react';
import { DynamicWelcomeBanner } from './DynamicWelcomeBanner';

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
    prompt: 'What are three specific things—small or significant—that brought you peace, comfort, or joy today?',
  },
  {
    id: 'unpacking',
    icon: Compass,
    title: 'Deconstruct Tension',
    prompt: 'What situation is taking up mental bandwidth right now? What parts can you engineer or control, and what must you release?',
  },
  {
    id: 'breakthrough',
    icon: Lightbulb,
    title: 'Lesson & Architecture',
    prompt: 'Reflect on a challenge you navigated recently. What did it reveal about your resilience, values, or mental models?',
  },
  {
    id: 'freewrite',
    icon: Feather,
    title: 'Freeform Thought Stream',
    prompt: 'Write without filtering. What is occupying your cognitive buffer right this second?',
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
        '[COMPUTING]: Parsing semantic structures...',
        '[REASONING]: Synthesizing emotional patterns & mood tags...',
        '[DECODING]: Generating compassionate insights & actionable takeaways...',
      ];
      timer = setInterval(() => {
        setLoadingStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 1800);
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
      setError('Microphone access denied or not supported in this browser.');
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
          throw new Error(data.error || 'Failed to transcribe audio.');
        }

        const transcribed = data.transcription || '';
        if (transcribed) {
          setContent((prev) => (prev.trim() ? `${prev.trim()}\n\n${transcribed}` : transcribed));
        }
        setIsTranscribing(false);
      };
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError(err.message || 'Audio transcription failed. You can continue typing manually.');
      setIsTranscribing(false);
    }
  };

  // Word count & character count
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim()) {
      setError('Please input or speak a reflection before submitting.');
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
      setError(err?.message || 'Failed to submit reflection. Please try again.');
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
    '[INGESTING]: Processing reflection text tokens...',
    '[REASONING]: Synthesizing emotional patterns & mood tags...',
    '[CONVERGING]: Formulating actionable insights...',
  ];

  return (
    <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-4 font-sans">
      {/* Dynamic Animated Welcome Transmission Banner */}
      {!isEditMode && <DynamicWelcomeBanner userName={userName} />}

      {/* Editor Card */}
      <div className="bg-[#0d1322] rounded-2xl shadow-xl border border-slate-800/90 overflow-hidden transition-all">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 font-mono">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/90 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-md">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                {isEditMode ? 'Edit Reflection Stream' : 'Reflection Input Terminal'}
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                  LIVE
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {isEditMode
                  ? 'Update reflection and regenerate multi-factor AI synthesis'
                  : 'Synthesize thoughts via manual keyboard buffer or voice microphone'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
            <span className="px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800">
              {wordCount} words
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
              {charCount} chars
            </span>
          </div>
        </div>

        {/* Prompt Inspiration Starters */}
        {!isEditMode && (
          <div className="px-6 pt-5 pb-2 font-mono">
            <div className="flex items-center space-x-2 mb-3">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Cognitive Ingestion Templates (Optional)
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
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start space-x-2.5 ${
                      isSelected
                        ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-200 ring-1 ring-cyan-400/30 shadow-md'
                        : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-950 text-slate-400'
                      }`}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1 font-sans">
                      <h4 className="text-xs font-semibold text-slate-200 font-mono">{item.title}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{item.prompt}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Audio Recording Bar */}
        <div className="px-6 pt-3 font-mono">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              {isRecording ? (
                <div className="flex items-center space-x-2 text-rose-400 font-medium text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span>Recording Voice ({recordingSeconds}s)...</span>
                </div>
              ) : isTranscribing ? (
                <div className="flex items-center space-x-2 text-cyan-400 font-medium text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Transcribing via Gemini Neural Transcriber...</span>
                </div>
              ) : (
                <div className="text-xs text-slate-400 flex items-center space-x-1.5">
                  <Mic className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Speak reflection via microphone for automatic transcription</span>
                </div>
              )}
            </div>

            <div>
              {isRecording ? (
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-md transition-colors cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-white" />
                  <span>End Recording</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  disabled={isTranscribing || isSubmitting}
                  className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Mic className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Voice Stream</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-3 space-y-4">
          {/* Optional Title Input */}
          <div>
            <label className="block text-xs font-mono font-medium text-slate-400 mb-1">
              Title <span className="text-slate-500 font-normal">(Optional — Somotoz AI can auto-synthesize one)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Architecting calm amid complex system releases..."
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 bg-slate-900/80 focus:bg-[#090d16] text-sm text-slate-100 placeholder-slate-500 rounded-xl border border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/80 transition-all font-sans"
            />
          </div>

          {/* Main Reflection Textarea */}
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              rows={10}
              placeholder="What is occupying your cognitive buffer today? Write candidly about projects, tensions, breakthroughs, emotional states, or open inquiries..."
              className="w-full p-4 bg-slate-900/70 focus:bg-[#090d16] text-slate-100 placeholder-slate-500 text-sm sm:text-base leading-relaxed rounded-xl border border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/80 transition-all resize-y min-h-[220px] font-sans"
            />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start space-x-2 font-mono">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading States Overlay Banner */}
          <AnimatePresence>
            {isSubmitting && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center space-x-3 text-cyan-200 font-mono"
              >
                <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-cyan-300">
                    Somotoz Neural Companion Synthesizing
                  </p>
                  <p className="text-xs text-cyan-400/90 transition-all duration-300">
                    {loadingMessages[loadingStep]}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800/80 font-mono">
            <div className="text-xs text-slate-400 flex items-center space-x-1.5">
              <span className="kbd px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-[10px] text-cyan-400">
                ⌘ / Ctrl + Enter
              </span>
              <span>to execute synthesis</span>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
              {isEditMode && onCancelEdit && (
                <button
                  type="button"
                  onClick={onCancelEdit}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}

              {content && !isSubmitting && !isEditMode && (
                <button
                  type="button"
                  onClick={() => {
                    setContent('');
                    setTitle('');
                    setActivePrompt(null);
                  }}
                  className="p-2.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
                  title="Clear buffer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 active:scale-95 text-white text-xs font-mono font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Executing Model...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-200" />
                    <span>{isEditMode ? 'Update & Re-Synthesize' : 'Synthesize Reflection'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
