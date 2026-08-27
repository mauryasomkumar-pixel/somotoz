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
      className="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 font-sans text-[#EDEDED]"
    >
      {/* Top Navigation & Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#262626] font-mono">
        <button
          onClick={onNewReflection}
          className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-medium text-[#A1A1AA] hover:text-[#00FF41] p-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#00FF41]" />
          <span>Write New Note</span>
        </button>

        <div className="flex items-center space-x-2">
          {/* Export Note to PDF */}
          <button
            onClick={() => exportJournalEntryToPdf(entry)}
            className="px-2.5 py-1.5 bg-black hover:bg-[#141414] border border-[#262626] hover:border-[#00FF41] text-[#A1A1AA] hover:text-[#00FF41] text-xs font-mono flex items-center space-x-1.5 transition-all cursor-pointer shadow-[2px_2px_0px_0px_#171717]"
            title="Download note as PDF document"
          >
            <FileDown className="w-3.5 h-3.5 text-[#00FF41]" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>

          {/* Audio voice playback toggle */}
          <button
            onClick={handleToggleSpeak}
            className={`p-2 border transition-all cursor-pointer ${
              isSpeaking
                ? 'bg-[#00FF41] text-black border-[#00FF41]'
                : 'bg-black text-[#A1A1AA] hover:text-[#00FF41] border-[#262626] hover:border-[#00FF41]'
            }`}
            title={isSpeaking ? 'Stop speaking' : 'Listen to note'}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Copy to clipboard */}
          <button
            onClick={handleCopy}
            className="p-2 bg-black border border-[#262626] hover:border-[#00FF41] text-[#A1A1AA] hover:text-[#00FF41] transition-all cursor-pointer"
            title="Copy note text"
          >
            {copied ? <Check className="w-4 h-4 text-[#00FF41]" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Favorite Toggle */}
          <button
            onClick={(e) => onToggleFavorite(entry.id, !!entry.isFavorite, e)}
            className={`p-2 border transition-all cursor-pointer ${
              entry.isFavorite
                ? 'bg-black text-[#00FF41] border-[#00FF41]'
                : 'bg-black text-[#737373] hover:text-[#00FF41] border-[#262626] hover:border-[#00FF41]'
            }`}
            title={entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={`w-4 h-4 ${entry.isFavorite ? 'fill-[#00FF41] text-[#00FF41]' : ''}`} />
          </button>

          {/* Edit Entry */}
          <button
            onClick={() => onEdit(entry)}
            className="p-2 bg-black border border-[#262626] hover:border-[#00FF41] text-[#A1A1AA] hover:text-[#00FF41] transition-all cursor-pointer"
            title="Edit this note"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {/* Delete Entry */}
          <button
            onClick={(e) => onDelete(entry, e)}
            className="p-2 bg-black border border-[#262626] hover:border-rose-500 text-[#737373] hover:text-rose-400 transition-all cursor-pointer"
            title="Delete this note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-[#0A0A0A] border border-[#262626] hover:border-[#00FF41]/80 shadow-[4px_4px_0px_0px_#141414] p-6 sm:p-8 space-y-6">
        {/* Title and Timestamp */}
        <div className="space-y-3 border-b border-[#262626] pb-6">
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#737373]">
            <div className="flex items-center space-x-1.5 text-[#00FF41]">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-1.5 text-[#A1A1AA]">
              <Clock className="w-3.5 h-3.5" />
              <span>{formattedTime}</span>
            </div>
            <span>•</span>
            <span className="px-2 py-0.5 bg-black border border-[#262626] text-[#A1A1AA]">
              {entry.wordCount || entry.content.split(/\s+/).length} words
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#EDEDED] font-display tracking-tight leading-tight">
            {entry.title || 'Untitled Note'}
          </h1>

          {/* Mood Tags */}
          {entry.moodTags && entry.moodTags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 font-mono">
              {entry.moodTags.map((tag, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectTag && onSelectTag(tag)}
                  className="px-2.5 py-1 text-xs bg-black text-[#00FF41] border border-[#262626] hover:border-[#00FF41] transition-colors cursor-pointer"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Content */}
        <div className="text-sm sm:text-base leading-relaxed text-[#D4D4D8] font-sans whitespace-pre-wrap">
          {entry.content}
        </div>

        {/* Action button to discuss in chat */}
        {onOpenChatWithReflection && (
          <div className="pt-4 border-t border-[#262626] flex justify-end font-mono">
            <button
              onClick={() => onOpenChatWithReflection(entry)}
              className="px-4 py-2 bg-black hover:bg-[#141414] border border-[#262626] hover:border-[#00FF41] text-xs font-bold text-[#EDEDED] hover:text-[#00FF41] transition-all flex items-center space-x-2 cursor-pointer shadow-[2px_2px_0px_0px_#171717]"
            >
              <MessageSquare className="w-4 h-4 text-[#00FF41]" />
              <span>Discuss Note in Chat</span>
            </button>
          </div>
        )}
      </div>

      {/* AI Summary & Insights Card */}
      {entry.aiResponse && (
        <div className="bg-[#0A0A0A] border border-[#262626] hover:border-[#00FF41] shadow-[4px_4px_0px_0px_#141414] p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[#262626] pb-4 font-mono">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 bg-black border border-[#00FF41] text-[#00FF41] flex items-center justify-center shadow-[2px_2px_0px_0px_#00FF41]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#EDEDED]">
                  AI Summary & Insights
                </h2>
                <p className="text-xs text-[#737373]">Helpful perspective and highlights</p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-black text-[#00FF41] border border-[#262626]">
              COMPLETED
            </span>
          </div>

          {/* AI Conversational Feedback */}
          {entry.aiResponse.conversationalReply && (
            <div className="text-sm leading-relaxed text-[#EDEDED] font-sans bg-black p-5 border border-[#262626]">
              {entry.aiResponse.conversationalReply}
            </div>
          )}

          {/* Actionable Takeaways Checklist */}
          {entry.aiResponse.actionableTakeaways && entry.aiResponse.actionableTakeaways.length > 0 && (
            <div className="space-y-3 font-mono">
              <h3 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-[#00FF41]" />
                <span>Key Action Steps</span>
              </h3>
              <div className="space-y-2">
                {entry.aiResponse.actionableTakeaways.map((takeaway, idx) => {
                  const isDone = !!completedTakeaways[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleTakeaway(idx)}
                      className={`p-3 border transition-all cursor-pointer flex items-start space-x-3 ${
                        isDone
                          ? 'bg-black border-[#262626] text-[#737373] line-through'
                          : 'bg-[#0D0D0D] hover:bg-[#141414] border-[#262626] hover:border-[#00FF41] text-[#EDEDED]'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 mt-0.5 border flex items-center justify-center shrink-0 transition-colors ${
                          isDone ? 'bg-[#00FF41] border-[#00FF41] text-black' : 'border-[#404040] bg-black'
                        }`}
                      >
                        {isDone && <Check className="w-3 h-3 text-black" />}
                      </div>
                      <p className="text-xs sm:text-sm font-sans flex-1">{takeaway}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Visual Artwork Section */}
      <div className="bg-[#0A0A0A] border border-[#262626] hover:border-[#00FF41] shadow-[4px_4px_0px_0px_#141414] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono">
          <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4 text-[#00FF41]" />
            <h3 className="text-xs sm:text-sm font-bold text-[#EDEDED] uppercase tracking-wider">
              Visual Artwork
            </h3>
          </div>
          
          <div className="flex items-center space-x-1.5">
            {artworkSvg && (
              <>
                <button
                  onClick={() => downloadSvgImage(artworkSvg, entry.title || 'note-artwork')}
                  className="px-2.5 py-1.5 bg-black hover:bg-[#141414] border border-[#262626] hover:border-[#00FF41] text-[#A1A1AA] hover:text-[#00FF41] text-xs font-mono flex items-center space-x-1 transition-all cursor-pointer"
                  title="Download vector SVG"
                >
                  <Download className="w-3 h-3 text-[#00FF41]" />
                  <span>SVG</span>
                </button>
                <button
                  onClick={() => downloadPngImage(artworkSvg, entry.title || 'note-artwork')}
                  className="px-2.5 py-1.5 bg-black hover:bg-[#141414] border border-[#262626] hover:border-[#00FF41] text-[#A1A1AA] hover:text-[#00FF41] text-xs font-mono flex items-center space-x-1 transition-all cursor-pointer"
                  title="Download rasterized PNG"
                >
                  <Download className="w-3 h-3 text-[#00FF41]" />
                  <span>PNG</span>
                </button>
              </>
            )}

            <button
              onClick={handleGenerateArtwork}
              disabled={isGeneratingArt}
              className="px-3 py-1.5 bg-black hover:bg-[#141414] border border-[#262626] hover:border-[#00FF41] text-xs font-bold text-[#EDEDED] hover:text-[#00FF41] transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isGeneratingArt ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00FF41]" />
                  <span>Creating Art...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-[#00FF41]" />
                  <span>{artworkSvg ? 'Regenerate Art' : 'Create Artwork'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {artworkSvg ? (
          <div
            className="w-full h-64 sm:h-80 bg-black border border-[#262626] overflow-hidden flex items-center justify-center p-4"
            dangerouslySetInnerHTML={{ __html: artworkSvg }}
          />
        ) : (
          <div className="w-full py-12 bg-black border border-dashed border-[#262626] text-center font-mono text-xs text-[#737373] space-y-2">
            <Palette className="w-8 h-8 mx-auto text-[#333333]" />
            <p>No artwork generated for this note yet.</p>
            <button
              onClick={handleGenerateArtwork}
              className="text-[#00FF41] underline hover:text-[#00E038] cursor-pointer"
            >
              Click here to generate visual artwork
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
