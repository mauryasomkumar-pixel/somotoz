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
  Zap,
  Activity,
  FileDown,
  Download
} from 'lucide-react';
import { exportJournalEntryToPdf } from '../utils/pdfExport';
import { downloadSvgImage, downloadPngImage } from '../utils/mediaExport';
import { useTheme } from '../context/ThemeContext';

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
  const { theme } = useTheme();
  const isLight = theme === 'white';
  const isMix = theme === 'mix';

  const textPrimaryClass = isLight
    ? 'text-[#090D16]'
    : isMix
    ? 'text-[#231E19]'
    : 'text-[#EDEDED]';

  const textSecondaryClass = isLight
    ? 'text-[#334155]'
    : isMix
    ? 'text-[#4A3E31]'
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
    : 'bg-gradient-to-br from-[#0B0B14] via-[#07070E] to-[#030306] border-2 border-[#2D2D45] shadow-[0_0_35px_rgba(0,240,255,0.08)]';

  const subCardBgClass = isLight
    ? 'bg-[#F8FAFC] border border-[#CBD5E1]'
    : isMix
    ? 'bg-[#F4EFE6] border border-[#D8CEBF]'
    : 'bg-[#080811] border border-[#252538]';

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
    const textToCopy = `Title: ${entry.title}\nDate: ${new Date(entry.createdAt).toLocaleDateString()}\n\nNote:\n${entry.content}\n\nAI Insights:\n${entry.aiResponse?.conversationalReply || ''}\n\nMoods: ${entry.moodTags?.join(' ') || ''}\n\nKey Steps:\n${entry.aiResponse?.actionableTakeaways?.map((t) => `• ${t}`).join('\n') || ''}`;
    
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
      className={`max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 font-sans transition-colors duration-300 ${textPrimaryClass}`}
    >
      {/* Top Navigation & Action Controls with Asymmetrical Polygon Geometry */}
      <div className={`flex flex-wrap items-center justify-between gap-3 pb-3 border-b font-mono ${
        isLight ? 'border-slate-200' : isMix ? 'border-[#D8CEBF]' : 'border-[#262626]'
      }`}>
        <button
          onClick={onNewReflection}
          className={`inline-flex items-center space-x-1.5 text-xs sm:text-sm font-bold p-2 clip-badge-poly border transition-all cursor-pointer ${
            isLight
              ? 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-300'
              : isMix
              ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-black hover:bg-[#141414] text-[#00F0FF] border-[#00F0FF]/60 hover:border-[#00F0FF]'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Write New Note</span>
        </button>

        <div className="flex items-center space-x-2">
          {/* Export Note to PDF */}
          <button
            onClick={() => exportJournalEntryToPdf(entry)}
            className={`px-3 py-1.5 border text-xs font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer clip-badge-poly shadow-xs ${
              isLight
                ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 hover:border-sky-400'
                : isMix
                ? 'bg-[#FAF6EE] hover:bg-[#ECE5D6] text-[#231E19] border-[#D3C7B5] hover:border-amber-500'
                : 'bg-black hover:bg-[#141414] text-[#EDEDED] hover:text-[#00F0FF] border-[#262626] hover:border-[#00F0FF]'
            }`}
            title="Download note as PDF document"
          >
            <FileDown className="w-3.5 h-3.5 text-sky-600 dark:text-[#00F0FF]" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>

          {/* Audio voice playback toggle */}
          <button
            onClick={handleToggleSpeak}
            className={`p-2 border clip-badge-poly transition-all cursor-pointer ${
              isSpeaking
                ? isLight
                  ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                  : isMix
                  ? 'bg-amber-700 text-white border-amber-700 shadow-sm'
                  : 'bg-[#00FF41] text-black border-[#00FF41] shadow-[0_0_12px_rgba(0,255,65,0.4)]'
                : isLight
                ? 'bg-white hover:bg-slate-50 text-slate-700 hover:text-sky-700 border-slate-300'
                : isMix
                ? 'bg-[#FAF6EE] hover:bg-[#ECE5D6] text-[#231E19] hover:text-amber-800 border-[#D3C7B5]'
                : 'bg-black text-[#A1A1AA] hover:text-[#00F0FF] border-[#262626] hover:border-[#00F0FF]'
            }`}
            title={isSpeaking ? 'Stop speaking' : 'Listen to note'}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Copy to clipboard */}
          <button
            onClick={handleCopy}
            className={`p-2 border clip-badge-poly transition-all cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-50 text-slate-700 hover:text-sky-700 border-slate-300'
                : isMix
                ? 'bg-[#FAF6EE] hover:bg-[#ECE5D6] text-[#231E19] hover:text-amber-800 border-[#D3C7B5]'
                : 'bg-black hover:bg-[#141414] text-[#A1A1AA] hover:text-[#00F0FF] border-[#262626] hover:border-[#00F0FF]'
            }`}
            title="Copy note text"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-[#00FF41]" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Favorite Toggle */}
          <button
            onClick={(e) => onToggleFavorite(entry.id, !!entry.isFavorite, e)}
            className={`p-2 border clip-badge-poly transition-all cursor-pointer ${
              entry.isFavorite
                ? isLight
                  ? 'bg-amber-100 text-amber-800 border-amber-400'
                  : isMix
                  ? 'bg-amber-200 text-amber-950 border-amber-500'
                  : 'bg-black text-[#FFB800] border-[#FFB800] shadow-[0_0_10px_rgba(255,184,0,0.3)]'
                : isLight
                ? 'bg-white text-slate-400 hover:text-amber-600 border-slate-300 hover:border-amber-400'
                : isMix
                ? 'bg-[#FAF6EE] text-amber-700/60 hover:text-amber-800 border-[#D3C7B5] hover:border-amber-400'
                : 'bg-black text-[#737373] hover:text-[#FFB800] border-[#262626] hover:border-[#FFB800]'
            }`}
            title={entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={`w-4 h-4 ${entry.isFavorite ? 'fill-current' : ''}`} />
          </button>

          {/* Edit Entry */}
          <button
            onClick={() => onEdit(entry)}
            className={`p-2 border clip-badge-poly transition-all cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-50 text-slate-700 hover:text-sky-700 border-slate-300'
                : isMix
                ? 'bg-[#FAF6EE] hover:bg-[#ECE5D6] text-[#231E19] hover:text-amber-800 border-[#D3C7B5]'
                : 'bg-black hover:bg-[#141414] text-[#A1A1AA] hover:text-[#00F0FF] border-[#262626] hover:border-[#00F0FF]'
            }`}
            title="Edit this note"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {/* Delete Entry */}
          <button
            onClick={(e) => onDelete(entry, e)}
            className={`p-2 border clip-badge-poly transition-all cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border-slate-300 hover:border-rose-300'
                : isMix
                ? 'bg-[#FAF6EE] hover:bg-rose-50 text-amber-800/60 hover:text-rose-700 border-[#D3C7B5] hover:border-rose-300'
                : 'bg-black hover:bg-rose-950/40 text-[#737373] hover:text-rose-400 border-[#262626] hover:border-rose-600/50'
            }`}
            title="Delete this note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Card with Asymmetrical Polygon Geometry & Multi-Color Top Gradient */}
      <div className={`relative overflow-hidden clip-cyber-card p-6 sm:p-8 space-y-6 transition-all duration-300 ${cardBgClass}`}>
        {/* Top Multi-Color Glowing Gradient Accent Border */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#00F0FF] via-[#A855F7] via-[#FF007A] to-[#00FF41] z-20" />

        {/* Title and Timestamp */}
        <div className={`space-y-3 border-b pb-6 ${
          isLight ? 'border-slate-200' : isMix ? 'border-[#D8CEBF]' : 'border-[#262626]'
        }`}>
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className={`flex items-center space-x-1.5 font-bold ${
              isLight ? 'text-sky-700' : isMix ? 'text-amber-800' : 'text-[#00F0FF]'
            }`}>
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
            <span className={textMutedClass}>•</span>
            <div className={`flex items-center space-x-1.5 ${textSecondaryClass}`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{formattedTime}</span>
            </div>
            <span className={textMutedClass}>•</span>
            <span className={`px-2.5 py-0.5 clip-badge-poly border font-bold ${
              isLight
                ? 'bg-slate-100 text-slate-800 border-slate-300'
                : isMix
                ? 'bg-[#EFE7DA] text-[#231E19] border-[#D8CEBF]'
                : 'bg-black text-[#A1A1AA] border-[#262626]'
            }`}>
              {entry.wordCount || entry.content.split(/\s+/).length} words
            </span>
          </div>

          <h1 className={`text-xl sm:text-2xl md:text-3xl font-extrabold font-display tracking-tight leading-tight ${textPrimaryClass}`}>
            {entry.title || 'Untitled Note'}
          </h1>

          {/* Mood Tags with Asymmetrical Polygon Chips */}
          {entry.moodTags && entry.moodTags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 font-mono">
              {entry.moodTags.map((tag, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectTag && onSelectTag(tag)}
                  className={`px-3 py-1 text-xs clip-badge-poly border font-medium transition-all cursor-pointer ${
                    isLight
                      ? 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-200'
                      : isMix
                      ? 'bg-[#EFE7DA] hover:bg-[#E5DCF0] text-amber-900 border-[#D8CEBF]'
                      : 'bg-black hover:bg-[#141414] text-[#00FF41] border-[#262626] hover:border-[#00FF41]'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Content - Pin Sharp High Contrast Readability */}
        <div className={`text-sm sm:text-base leading-relaxed font-sans whitespace-pre-wrap ${
          isLight ? 'text-[#1E293B]' : isMix ? 'text-[#2D241E]' : 'text-[#D4D4D8]'
        }`}>
          {entry.content}
        </div>

        {/* Action button to discuss in chat */}
        {onOpenChatWithReflection && (
          <div className={`pt-4 border-t flex justify-end font-mono ${
            isLight ? 'border-slate-100' : isMix ? 'border-[#E2DAC8]' : 'border-[#262626]'
          }`}>
            <button
              onClick={() => onOpenChatWithReflection(entry)}
              className={`px-5 py-2.5 border text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer clip-badge-poly shadow-xs active:scale-95 ${
                isLight
                  ? 'bg-sky-600 hover:bg-sky-700 text-white border-sky-600 shadow-md'
                  : isMix
                  ? 'bg-amber-700 hover:bg-amber-800 text-white border-amber-700 shadow-md'
                  : 'bg-black hover:bg-[#141414] border-[#00F0FF] text-[#00F0FF] hover:text-[#FFFFFF] shadow-[0_0_15px_rgba(0,240,255,0.25)]'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Discuss Note in Chat</span>
            </button>
          </div>
        )}
      </div>

      {/* AI Summary & Insights Card with Asymmetrical Polygon Geometry */}
      {entry.aiResponse && (
        <div className={`relative overflow-hidden clip-cyber-card p-6 sm:p-8 space-y-6 transition-all duration-300 ${cardBgClass}`}>
          {/* Top Multi-Color Glowing Gradient Accent Border */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#00FF41] via-[#00F0FF] to-[#A855F7] z-20" />

          <div className={`flex items-center justify-between border-b pb-4 font-mono ${
            isLight ? 'border-slate-200' : isMix ? 'border-[#D8CEBF]' : 'border-[#262626]'
          }`}>
            <div className="flex items-center space-x-2.5">
              <div className={`w-9 h-9 flex items-center justify-center clip-badge-poly border shadow-sm ${
                isLight
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                  : isMix
                  ? 'bg-amber-100 border-amber-300 text-amber-800'
                  : 'bg-black border-[#00FF41] text-[#00FF41] shadow-[0_0_12px_rgba(0,255,65,0.4)]'
              }`}>
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className={`text-sm sm:text-base font-bold ${textPrimaryClass}`}>
                  AI Summary & Insights
                </h2>
                <p className={`text-xs ${textSecondaryClass}`}>Helpful perspective and highlights</p>
              </div>
            </div>
            <span className={`text-[10px] px-2.5 py-0.5 clip-badge-poly border font-bold ${
              isLight
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : isMix
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-black text-[#00FF41] border-[#00FF41]/60'
            }`}>
              COMPLETED
            </span>
          </div>

          {/* AI Conversational Feedback Box */}
          {entry.aiResponse.conversationalReply && (
            <div className={`text-sm leading-relaxed font-sans p-5 clip-badge-poly border transition-colors ${
              isLight
                ? 'bg-[#F8FAFC] text-[#090D16] border-[#CBD5E1]'
                : isMix
                ? 'bg-[#F4EFE6] text-[#231E19] border-[#D8CEBF]'
                : 'bg-black text-[#EDEDED] border-[#262626]'
            }`}>
              {entry.aiResponse.conversationalReply}
            </div>
          )}

          {/* Actionable Takeaways Checklist with High-Contrast Tokens */}
          {entry.aiResponse.actionableTakeaways && entry.aiResponse.actionableTakeaways.length > 0 && (
            <div className="space-y-3 font-mono">
              <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${textSecondaryClass}`}>
                <CheckCircle className={`w-3.5 h-3.5 ${
                  isLight ? 'text-emerald-600' : isMix ? 'text-amber-700' : 'text-[#00FF41]'
                }`} />
                <span>Key Action Steps</span>
              </h3>
              <div className="space-y-2">
                {entry.aiResponse.actionableTakeaways.map((takeaway, idx) => {
                  const isDone = !!completedTakeaways[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleTakeaway(idx)}
                      className={`p-3.5 border transition-all cursor-pointer flex items-start space-x-3 clip-badge-poly ${
                        isDone
                          ? isLight
                            ? 'bg-slate-100 border-slate-200 text-slate-400 line-through'
                            : isMix
                            ? 'bg-[#EAE4D6] border-[#D8CEBF] text-[#8C8070] line-through'
                            : 'bg-black border-[#262626] text-[#737373] line-through'
                          : subCardBgClass
                      }`}
                    >
                      <div
                        className={`w-4 h-4 mt-0.5 border flex items-center justify-center shrink-0 transition-colors clip-badge-poly ${
                          isDone
                            ? isLight
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : isMix
                              ? 'bg-amber-600 border-amber-600 text-white'
                              : 'bg-[#00FF41] border-[#00FF41] text-black'
                            : isLight
                            ? 'border-slate-300 bg-white'
                            : isMix
                            ? 'border-[#D3C7B5] bg-white'
                            : 'border-[#404040] bg-black'
                        }`}
                      >
                        {isDone && <Check className="w-3 h-3" />}
                      </div>
                      <p className={`text-xs sm:text-sm font-sans flex-1 ${
                        isDone ? '' : textPrimaryClass
                      }`}>{takeaway}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Visual Artwork Section with Asymmetrical Polygon Geometry */}
      <div className={`relative overflow-hidden clip-cyber-card p-6 space-y-4 transition-all duration-300 ${cardBgClass}`}>
        {/* Top Multi-Color Glowing Gradient Accent Border */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#A855F7] via-[#FF007A] to-[#FFB800] z-20" />

        <div className="flex flex-wrap items-center justify-between gap-2 font-mono">
          <div className="flex items-center space-x-2">
            <Palette className={`w-4 h-4 ${
              isLight ? 'text-purple-600' : isMix ? 'text-amber-700' : 'text-[#00FF41]'
            }`} />
            <h3 className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${textPrimaryClass}`}>
              Visual Artwork
            </h3>
          </div>
          
          <div className="flex items-center space-x-1.5">
            {artworkSvg && (
              <>
                <button
                  onClick={() => downloadSvgImage(artworkSvg, entry.title || 'note-artwork')}
                  className={`px-3 py-1.5 border text-xs font-mono font-bold flex items-center space-x-1 transition-all cursor-pointer clip-badge-poly ${
                    isLight
                      ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                      : isMix
                      ? 'bg-[#FAF6EE] hover:bg-[#ECE5D6] text-[#231E19] border-[#D3C7B5]'
                      : 'bg-black hover:bg-[#141414] text-[#EDEDED] hover:text-[#00FF41] border-[#262626] hover:border-[#00FF41]'
                  }`}
                  title="Download vector SVG"
                >
                  <Download className="w-3 h-3" />
                  <span>SVG</span>
                </button>
                <button
                  onClick={() => downloadPngImage(artworkSvg, entry.title || 'note-artwork')}
                  className={`px-3 py-1.5 border text-xs font-mono font-bold flex items-center space-x-1 transition-all cursor-pointer clip-badge-poly ${
                    isLight
                      ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                      : isMix
                      ? 'bg-[#FAF6EE] hover:bg-[#ECE5D6] text-[#231E19] border-[#D3C7B5]'
                      : 'bg-black hover:bg-[#141414] text-[#EDEDED] hover:text-[#00FF41] border-[#262626] hover:border-[#00FF41]'
                  }`}
                  title="Download rasterized PNG"
                >
                  <Download className="w-3 h-3" />
                  <span>PNG</span>
                </button>
              </>
            )}

            <button
              onClick={handleGenerateArtwork}
              disabled={isGeneratingArt}
              className={`px-3.5 py-1.5 border text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 clip-badge-poly ${
                isLight
                  ? 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-300'
                  : isMix
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-black hover:bg-[#141414] text-[#EDEDED] hover:text-[#00FF41] border-[#262626] hover:border-[#00FF41]'
              }`}
            >
              {isGeneratingArt ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00FF41]" />
                  <span>Creating Art...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{artworkSvg ? 'Regenerate Art' : 'Create Artwork'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {artworkSvg ? (
          <div
            className={`w-full h-64 sm:h-80 border overflow-hidden flex items-center justify-center p-4 clip-badge-poly ${
              isLight ? 'bg-slate-900 border-slate-300' : isMix ? 'bg-[#2A231D] border-[#D8CEBF]' : 'bg-black border-[#262626]'
            }`}
            dangerouslySetInnerHTML={{ __html: artworkSvg }}
          />
        ) : (
          <div className={`w-full py-12 border border-dashed text-center font-mono text-xs space-y-2 clip-badge-poly ${
            isLight
              ? 'bg-[#F8FAFC] border-slate-300 text-slate-500'
              : isMix
              ? 'bg-[#F4EFE6] border-[#D8CEBF] text-[#7D7365]'
              : 'bg-black border-[#262626] text-[#737373]'
          }`}>
            <Palette className={`w-8 h-8 mx-auto ${textMutedClass}`} />
            <p>No artwork generated for this note yet.</p>
            <button
              onClick={handleGenerateArtwork}
              className={`underline font-bold cursor-pointer ${
                isLight ? 'text-sky-600 hover:text-sky-700' : isMix ? 'text-amber-700 hover:text-amber-800' : 'text-[#00FF41] hover:text-[#00E038]'
              }`}
            >
              Click here to generate visual artwork
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
