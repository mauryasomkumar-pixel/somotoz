import React, { useState } from 'react';
import { motion } from 'motion/react';
import { JournalEntry } from '../types';
import {
  Sparkles,
  Calendar,
  Clock,
  Star,
  Edit3,
  Trash2,
  Copy,
  Check,
  Tag,
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Share2,
  FileText,
  Palette,
  Volume2,
  VolumeX,
  MessageSquare,
  RefreshCw,
  Loader2,
  Cpu,
  Terminal,
  Zap,
  Activity
} from 'lucide-react';

interface ReflectionDetailProps {
  entry: JournalEntry;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entry: JournalEntry, e: React.MouseEvent) => void;
  onToggleFavorite: (entryId: string, currentFav: boolean, e: React.MouseEvent) => void;
  onNewReflection: () => void;
  onSelectTag?: (tag: string) => void;
  onOpenChatWithReflection?: (entry: JournalEntry) => void;
  onUpdateEntryArtwork?: (entryId: string, svgData: string) => Promise<void>;
}

export const ReflectionDetail: React.FC<ReflectionDetailProps> = ({
  entry,
  onEdit,
  onDelete,
  onToggleFavorite,
  onNewReflection,
  onSelectTag,
  onOpenChatWithReflection,
  onUpdateEntryArtwork,
}) => {
  const [copied, setCopied] = useState(false);
  const [completedTakeaways, setCompletedTakeaways] = useState<Record<number, boolean>>({});
  const [artworkSvg, setArtworkSvg] = useState<string | null>(entry.artworkData || null);
  const [isGeneratingArt, setIsGeneratingArt] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const toggleTakeaway = (index: number) => {
    setCompletedTakeaways((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleCopy = async () => {
    const textToCopy = `Title: ${entry.title}\nDate: ${new Date(entry.createdAt).toLocaleDateString()}\n\nReflection:\n${entry.content}\n\nAI Insights:\n${entry.aiResponse?.conversationalReply || ''}\n\nMoods: ${entry.moodTags?.join(' ') || ''}\n\nTakeaways:\n${entry.aiResponse?.actionableTakeaways?.map((t) => `• ${t}`).join('\n') || ''}`;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  // Text-to-speech audio reader
  const handleToggleSpeak = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        const textToRead = `${entry.title}. ${entry.aiResponse?.conversationalReply || entry.content}`;
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
      }
    }
  };

  // Generative Art Request
  const handleGenerateArtwork = async () => {
    setIsGeneratingArt(true);
    try {
      const res = await fetch('/api/generate-art', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reflectionText: entry.content,
          moodTags: entry.moodTags,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate artwork');

      setArtworkSvg(data.svg);
      if (onUpdateEntryArtwork) {
        await onUpdateEntryArtwork(entry.id, data.svg);
      }
    } catch (err) {
      console.error('Art generation error:', err);
    } finally {
      setIsGeneratingArt(false);
    }
  };

  const formattedDate = new Date(entry.createdAt).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = new Date(entry.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 font-sans text-slate-200"
    >
      {/* Top Navigation & Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 font-mono">
        <button
          onClick={onNewReflection}
          className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-medium text-slate-400 hover:text-cyan-300 p-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>New Input</span>
        </button>

        <div className="flex items-center space-x-2">
          {/* TTS Audio Readout */}
          <button
            onClick={handleToggleSpeak}
            className={`p-2 rounded-xl transition-all border cursor-pointer ${
              isSpeaking
                ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-500/10'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
            }`}
            title={isSpeaking ? 'Stop reading' : 'Synthesize speech'}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4 text-cyan-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Discuss in Chat */}
          {onOpenChatWithReflection && (
            <button
              onClick={() => onOpenChatWithReflection(entry)}
              className="px-3 py-2 bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/80 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
              title="Discuss this reflection in Somotoz Multimodal Workspace"
            >
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>Discuss in Chat</span>
            </button>
          )}

          {/* Favorite Toggle */}
          <button
            onClick={(e) => onToggleFavorite(entry.id, !!entry.isFavorite, e)}
            className={`p-2 rounded-xl transition-all border cursor-pointer ${
              entry.isFavorite
                ? 'bg-amber-950/80 border-amber-500/50 text-amber-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-400 hover:bg-slate-800'
            }`}
            title={entry.isFavorite ? 'Starred reflection' : 'Star this reflection'}
          >
            <Star className={`w-4 h-4 ${entry.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            title="Copy reflection & insights"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Edit Button */}
          <button
            onClick={() => onEdit(entry)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>

          {/* Delete Button */}
          <button
            onClick={(e) => onDelete(entry, e)}
            className="p-2 bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-800 hover:bg-rose-950/60 rounded-xl transition-all cursor-pointer"
            title="Delete this reflection"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Entry Header Info */}
      <div className="space-y-3 font-mono">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <div className="flex items-center space-x-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center space-x-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{formattedTime}</span>
          </div>
          <div className="flex items-center space-x-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>{entry.wordCount} words</span>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
          {entry.title || 'Untitled Reflection'}
        </h1>

        {/* Mood Tags */}
        {entry.moodTags && entry.moodTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <Tag className="w-3.5 h-3.5 text-slate-500 mr-1" />
            {entry.moodTags.map((tag, idx) => (
              <button
                key={idx}
                onClick={() => onSelectTag && onSelectTag(tag)}
                className="text-xs font-semibold font-mono px-3 py-0.5 rounded-full bg-cyan-950/70 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-900 transition-colors cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Generative Mood Art Section */}
      <div className="bg-[#0d1322] rounded-2xl p-5 border border-slate-800/90 shadow-xl space-y-3 font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Vector Mood Illustration
            </h3>
          </div>
          <button
            onClick={handleGenerateArtwork}
            disabled={isGeneratingArt}
            className="px-3 py-1.5 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isGeneratingArt ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing Vector Art...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>{artworkSvg ? 'Regenerate Vector Art' : 'Synthesize Vector Art'}</span>
              </>
            )}
          </button>
        </div>

        {artworkSvg && (
          <div
            className="w-full max-h-72 overflow-hidden rounded-xl border border-purple-500/20 shadow-inner flex items-center justify-center bg-[#090d16] p-3"
            dangerouslySetInnerHTML={{ __html: artworkSvg }}
          />
        )}
      </div>

      {/* Main Grid: User Reflection & AI Companion Insights */}
      <div className="grid grid-cols-1 gap-6">
        {/* User's Original Reflection */}
        <div className="bg-[#0d1322] rounded-2xl p-6 sm:p-7 border border-slate-800/90 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>User Reflection Input</span>
            </div>
            <span className="text-[10px] text-slate-500">ENCRYPTED // USER_UID</span>
          </div>
          <div className="prose prose-invert max-w-none text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans">
            {entry.content}
          </div>
        </div>

        {/* AI Companion Empathy & Takeaways Card */}
        {entry.aiResponse ? (
          <div className="bg-[#0d1322] rounded-2xl p-6 sm:p-7 border border-cyan-500/30 shadow-xl space-y-6">
            {/* AI Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 font-mono">
              <div className="flex items-center space-x-2 text-cyan-300">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm tracking-tight">
                  Somotoz Cognitive Synthesis
                </span>
              </div>
              <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-500/30">
                SYSTEM DECODED
              </span>
            </div>

            {/* Conversational Empathetic Reply */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                Empathetic Analysis & Perspective Reframing
              </h4>
              <div className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap space-y-2 font-sans">
                {entry.aiResponse.conversationalReply}
              </div>
            </div>

            {/* Actionable Takeaways Checklist */}
            {entry.aiResponse.actionableTakeaways && entry.aiResponse.actionableTakeaways.length > 0 && (
              <div className="pt-4 border-t border-slate-800 space-y-3 font-mono">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Actionable Micro-Directives & Behavioral Systems
                </h4>
                <div className="space-y-2">
                  {entry.aiResponse.actionableTakeaways.map((takeaway, idx) => {
                    const isDone = !!completedTakeaways[idx];
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleTakeaway(idx)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                          isDone
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-900/90 hover:bg-slate-900 border-slate-800 text-slate-200'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isDone
                              ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                              : 'border-slate-700 bg-slate-950'
                          }`}
                        >
                          {isDone && <Check className="w-3.5 h-3.5 font-bold" />}
                        </div>
                        <p
                          className={`text-xs sm:text-sm font-sans leading-relaxed ${
                            isDone ? 'line-through opacity-60' : ''
                          }`}
                        >
                          {takeaway}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-center text-slate-500 text-xs font-mono">
            No AI synthesis response found for this reflection.
          </div>
        )}
      </div>
    </motion.div>
  );
};
