import React, { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { JournalEntry } from '../types';
import { Search, Plus, Star, Sparkles, Calendar, Tag, Trash2, X, BookOpen, ChevronRight, Terminal, Zap } from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
  entries: JournalEntry[];
  selectedEntryId: string | null;
  isLoading: boolean;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewReflection: () => void;
  onToggleFavorite: (entryId: string, currentFav: boolean, e: React.MouseEvent) => void;
  onRequestDelete: (entry: JournalEntry, e: React.MouseEvent) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = memo(({
  entries,
  selectedEntryId,
  isLoading,
  onSelectEntry,
  onNewReflection,
  onToggleFavorite,
  onRequestDelete,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'white';
  const isMix = theme === 'mix';

  // Dynamic Theme Colors for Pristine Legibility
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

  const sidebarBgClass = isLight
    ? 'bg-[#F8FAFC]/95 border-r-2 border-[#CBD5E1]'
    : isMix
    ? 'bg-[#FAF6EE]/95 border-r-2 border-[#D3C7B5]'
    : 'bg-[#0A0A10]/95 border-r-2 border-[#252538]';

  const headerBgClass = isLight
    ? 'bg-white border-b border-[#CBD5E1]'
    : isMix
    ? 'bg-[#ECE5D6] border-b border-[#D3C7B5]'
    : 'bg-[#05050A] border-b border-[#252538]';

  const inputBgClass = isLight
    ? 'bg-white text-[#090D16] placeholder-[#94A3B8] border-[#CBD5E1] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]'
    : isMix
    ? 'bg-[#FDFBF7] text-[#231E19] placeholder-[#8C8070] border-[#D3C7B5] focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706]'
    : 'bg-[#030308] text-[#EDEDED] placeholder-[#737373] border-[#252538] focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF]';

  const footerBgClass = isLight
    ? 'bg-white border-t border-[#CBD5E1]'
    : isMix
    ? 'bg-[#ECE5D6] border-t border-[#D3C7B5]'
    : 'bg-[#05050A] border-t border-[#252538]';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Extract all unique mood tags across entries
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach((e) => {
      e.moodTags?.forEach((t) => tagSet.add(t));
    });
    return Array.from(tagSet);
  }, [entries]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.moodTags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTag = !selectedTag || entry.moodTags?.includes(selectedTag);
      const matchesFav = !onlyFavorites || entry.isFavorite;

      return matchesSearch && matchesTag && matchesFav;
    });
  }, [entries, searchQuery, selectedTag, onlyFavorites]);

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    if (isToday) {
      return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (isYesterday) {
      return `Yesterday, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const sidebarContent = (
    <aside className={`w-80 lg:w-88 h-full flex flex-col shrink-0 select-none font-mono relative backdrop-blur-md transition-colors duration-300 ${sidebarBgClass}`}>
      {/* Top Multi-Color Glowing Gradient Accent Border Line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#00F0FF] via-[#A855F7] via-[#FF007A] to-[#00FF41] z-20" />

      {/* Sidebar Header with Slanted Polygon Trim */}
      <div className={`p-4 flex flex-col gap-3.5 z-10 clip-slanted-header transition-colors ${headerBgClass}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className={`w-8 h-8 flex items-center justify-center clip-badge-poly border shadow-sm transition-all ${
              isLight
                ? 'bg-sky-50 border-sky-300 text-sky-700 shadow-[0_0_10px_rgba(2,132,199,0.15)]'
                : isMix
                ? 'bg-amber-100 border-amber-300 text-amber-800 shadow-[0_0_10px_rgba(217,119,6,0.15)]'
                : 'bg-black/90 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.35)]'
            }`}>
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`font-bold text-xs uppercase tracking-wider ${textPrimaryClass}`}>
                Journal & History
              </h2>
              <span className={`text-[10px] ${textMutedClass}`}>
                Chronological Memory
              </span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 clip-badge-poly border font-bold ${
              isLight
                ? 'bg-sky-100 text-sky-800 border-sky-300'
                : isMix
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-black text-[#00FF41] border-[#00FF41]/60'
            }`}>
              {entries.length}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* New Note Quick Action Button with Polygon cut */}
            <button
              onClick={onNewReflection}
              className={`p-1.5 border clip-badge-poly transition-all cursor-pointer ${
                isLight
                  ? 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-300 shadow-xs'
                  : isMix
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 shadow-xs'
                  : 'bg-black hover:bg-[#141414] text-[#00FF41] border-[#00FF41]/60 hover:border-[#00FF41] shadow-[0_0_8px_rgba(0,255,65,0.2)]'
              }`}
              title="Create new note"
              aria-label="New note"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            {/* Starred filter button */}
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`p-1.5 border clip-badge-poly transition-colors cursor-pointer ${
                onlyFavorites
                  ? isLight
                    ? 'bg-amber-100 text-amber-800 border-amber-400'
                    : isMix
                    ? 'bg-amber-200 text-amber-950 border-amber-500'
                    : 'bg-black text-[#FFB800] border-[#FFB800] shadow-[0_0_8px_rgba(255,184,0,0.4)]'
                  : isLight
                  ? 'text-slate-400 hover:text-amber-600 border-slate-200 hover:border-slate-300'
                  : isMix
                  ? 'text-amber-700/60 hover:text-amber-800 border-[#D3C7B5] hover:border-amber-400'
                  : 'text-[#737373] hover:text-[#FFB800] border-[#252538] hover:border-[#FFB800]/50'
              }`}
              title={onlyFavorites ? 'Show all notes' : 'Show only starred'}
              aria-label="Filter favorites"
            >
              <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-current' : ''}`} />
            </button>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className={`lg:hidden p-1.5 clip-badge-poly cursor-pointer ${
                isLight ? 'text-slate-500 hover:text-slate-900' : isMix ? 'text-amber-800 hover:text-black' : 'text-[#737373] hover:text-[#EDEDED]'
              }`}
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search input with Asymmetrical Polygon Geometry */}
        <div className="relative">
          <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${textMutedClass}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, insights, #tags..."
            className={`w-full pl-8 pr-8 py-2 text-xs transition-all clip-badge-poly outline-none font-sans ${inputBgClass}`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer ${
                isLight ? 'text-slate-400 hover:text-slate-700' : isMix ? 'text-amber-700 hover:text-black' : 'text-[#737373] hover:text-[#EDEDED]'
              }`}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Mood Tag Filters Bar with Asymmetrical Polygon Clip-Paths */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2.5 py-1 text-[10px] font-bold shrink-0 transition-all cursor-pointer clip-badge-poly border ${
                selectedTag === null
                  ? isLight
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : isMix
                    ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                    : 'bg-[#00F0FF] text-black border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : isMix
                  ? 'bg-[#E2DAC8] hover:bg-[#D9CEBA] text-[#231E19] border-[#D3C7B5]'
                  : 'bg-black text-[#A1A1AA] hover:text-[#EDEDED] border-[#252538]'
              }`}
            >
              ALL ({entries.length})
            </button>
            {allTags.map((tag) => {
              const isTagActive = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(isTagActive ? null : tag)}
                  className={`px-2.5 py-1 text-[10px] shrink-0 transition-all cursor-pointer clip-badge-poly border font-medium ${
                    isTagActive
                      ? isLight
                        ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-xs'
                        : isMix
                        ? 'bg-amber-700 text-white border-amber-700 font-bold shadow-xs'
                        : 'bg-[#00FF41] text-black border-[#00FF41] font-bold shadow-[0_0_10px_rgba(0,255,65,0.4)]'
                      : isLight
                      ? 'bg-white hover:bg-sky-50 text-sky-800 border-slate-200 hover:border-sky-300'
                      : isMix
                      ? 'bg-[#F4EFE6] hover:bg-[#ECE5D6] text-amber-900 border-[#D8CEBF] hover:border-amber-400'
                      : 'bg-black text-[#00F0FF]/90 hover:text-[#00F0FF] border-[#252538] hover:border-[#00F0FF]/50'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Entries List with Asymmetrical Polygon Geometry & Floating Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {isLoading ? (
          // Skeleton Loaders with Cyber Polygon Notch
          <div className="space-y-3 p-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`p-3.5 border animate-pulse space-y-2 clip-cyber-card ${
                  isLight ? 'bg-white border-slate-200' : isMix ? 'bg-[#ECE5D6] border-[#D3C7B5]' : 'bg-[#05050A] border-[#252538]'
                }`}
              >
                <div className={`h-4 w-3/4 ${isLight ? 'bg-slate-200' : isMix ? 'bg-[#D9CEBA]' : 'bg-[#1A1A28]'}`} />
                <div className={`h-3 w-full ${isLight ? 'bg-slate-200' : isMix ? 'bg-[#D9CEBA]' : 'bg-[#1A1A28]'}`} />
                <div className={`h-3 w-1/2 ${isLight ? 'bg-slate-200' : isMix ? 'bg-[#D9CEBA]' : 'bg-[#1A1A28]'}`} />
              </div>
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          // Empty State
          <div className={`h-64 flex flex-col items-center justify-center text-center p-6 clip-cyber-card border ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm'
              : isMix
              ? 'bg-[#ECE5D6] border-[#D3C7B5] shadow-sm'
              : 'bg-[#05050A] border-[#252538]'
          }`}>
            <div className={`w-11 h-11 flex items-center justify-center mb-3 clip-badge-poly border ${
              isLight
                ? 'bg-sky-50 border-sky-300 text-sky-600'
                : isMix
                ? 'bg-amber-100 border-amber-300 text-amber-700'
                : 'bg-black border-[#00F0FF]/50 text-[#00F0FF]'
            }`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <p className={`text-xs font-bold font-mono ${textPrimaryClass}`}>
              {entries.length === 0 ? 'NO NOTES RECORDED' : 'NO MATCHING NOTES'}
            </p>
            <p className={`text-[11px] mt-1 max-w-[200px] font-sans ${textSecondaryClass}`}>
              {entries.length === 0
                ? 'Your notes and reflections will appear here with AI insights.'
                : 'Try adjusting your search terms or mood filters.'}
            </p>
            {entries.length === 0 && (
              <button
                onClick={() => {
                  onNewReflection();
                  onCloseMobile();
                }}
                className={`mt-4 px-4 py-2 font-mono font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer clip-badge-poly ${
                  isLight
                    ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-md'
                    : isMix
                    ? 'bg-amber-700 hover:bg-amber-800 text-white shadow-md'
                    : 'bg-[#00FF41] hover:bg-[#00E038] text-black shadow-[0_0_15px_rgba(0,255,65,0.4)]'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>WRITE FIRST NOTE</span>
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence>
            {filteredEntries.map((entry) => {
              const isSelected = selectedEntryId === entry.id;
              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, height: 0, padding: 0, margin: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => {
                    onSelectEntry(entry);
                    onCloseMobile();
                  }}
                  className={`group relative p-3.5 border transition-all duration-200 cursor-pointer text-left overflow-hidden clip-cyber-card ${
                    isSelected
                      ? isLight
                        ? 'bg-white border-sky-500 shadow-[0_4px_20px_rgba(2,132,199,0.18)] ring-1 ring-sky-400 translate-x-1'
                        : isMix
                        ? 'bg-[#FAF6EE] border-amber-600 shadow-[0_4px_20px_rgba(217,119,6,0.18)] ring-1 ring-amber-500 translate-x-1'
                        : 'bg-black/95 border-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.3)] translate-x-1'
                      : isLight
                      ? 'bg-white/90 hover:bg-white border-slate-200 hover:border-sky-300 shadow-xs hover:translate-x-0.5'
                      : isMix
                      ? 'bg-[#F4EFE6] hover:bg-[#ECE5D6] border-[#D8CEBF] hover:border-amber-400 shadow-xs hover:translate-x-0.5'
                      : 'bg-[#080811] hover:bg-[#0D0D18] border-[#222238] hover:border-[#3D3D60] hover:translate-x-0.5'
                  }`}
                >
                  {/* Top Edge Gradient Accent when Selected */}
                  {isSelected && (
                    <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#00F0FF] via-[#A855F7] to-[#00FF41] z-10" />
                  )}

                  {/* Header of card: Title & Star Favorite */}
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className={`text-xs font-bold truncate flex-1 leading-snug ${
                        isSelected
                          ? isLight
                            ? 'text-sky-700 font-extrabold'
                            : isMix
                            ? 'text-amber-800 font-extrabold'
                            : 'text-[#00F0FF] font-extrabold'
                          : textPrimaryClass
                      }`}
                    >
                      {entry.title || 'Untitled Note'}
                    </h3>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(entry.id, !!entry.isFavorite, e);
                      }}
                      className={`p-1 transition-colors shrink-0 cursor-pointer clip-badge-poly ${
                        entry.isFavorite
                          ? isLight
                            ? 'text-amber-500 hover:text-amber-600'
                            : isMix
                            ? 'text-amber-600 hover:text-amber-700'
                            : 'text-[#FFB800] hover:text-[#FFA000]'
                          : isLight
                          ? 'text-slate-300 hover:text-amber-500'
                          : isMix
                          ? 'text-amber-700/40 hover:text-amber-600'
                          : 'text-[#555566] hover:text-[#FFB800]'
                      }`}
                      title={entry.isFavorite ? 'Remove star' : 'Mark as favorite'}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          entry.isFavorite ? 'fill-current' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* High-Contrast Excerpt - ZERO washed out text */}
                  <p className={`text-[11px] line-clamp-2 mt-1.5 leading-relaxed font-sans ${textSecondaryClass}`}>
                    {entry.content}
                  </p>

                  {/* Meta & Status Bar */}
                  <div className={`mt-2.5 pt-2 border-t flex items-center justify-between text-[10px] ${
                    isLight ? 'border-slate-100' : isMix ? 'border-[#E2DAC8]' : 'border-[#1F1F35]'
                  }`}>
                    <div className={`flex items-center space-x-1 font-mono ${textMutedClass}`}>
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span>{formatDate(entry.createdAt)}</span>
                    </div>

                    {entry.aiResponse && (
                      <span className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 clip-badge-poly border ${
                        isLight
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : isMix
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-black text-[#00FF41] border-[#00FF41]/60 shadow-[0_0_8px_rgba(0,255,65,0.2)]'
                      }`}>
                        <Sparkles className="w-2.5 h-2.5" />
                        INSIGHTS
                      </span>
                    )}
                  </div>

                  {/* Mood Tag Pills */}
                  {entry.moodTags && entry.moodTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {entry.moodTags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className={`text-[9px] font-mono px-2 py-0.5 clip-badge-poly border font-medium ${
                            isLight
                              ? 'bg-sky-50 text-sky-800 border-sky-200'
                              : isMix
                              ? 'bg-[#EFE7DA] text-amber-900 border-[#D8CEBF]'
                              : 'bg-black text-[#00F0FF]/90 border-[#252538]'
                          }`}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Delete Button (with smooth hover fade) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestDelete(entry, e);
                    }}
                    className={`opacity-0 group-hover:opacity-100 absolute bottom-2 right-2 p-1.5 transition-all cursor-pointer clip-badge-poly border shadow-xs ${
                      isLight
                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200'
                        : isMix
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-300'
                        : 'bg-rose-950/80 text-rose-300 hover:bg-rose-900 border-rose-600/60'
                    }`}
                    title="Delete note"
                    aria-label="Delete note"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Footer Theme Switcher & Creator Attribution with Stealth Notch Polygon */}
      <div className={`p-3.5 space-y-2.5 clip-stealth-notch transition-colors ${footerBgClass}`}>
        <ThemeSwitcher compact={true} showLabels={false} className="w-full justify-center" />
        
        {/* Creator & IIT Madras Attribution */}
        <div className={`flex flex-col space-y-1 text-xs pt-1 border-t ${
          isLight ? 'border-slate-100' : isMix ? 'border-[#E2DAC8]' : 'border-[#252538]'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Terminal className={`w-3.5 h-3.5 ${
                isLight ? 'text-sky-600' : isMix ? 'text-amber-700' : 'text-[#00FF41]'
              }`} />
              <span className={`text-[11px] font-bold ${textSecondaryClass}`}>Somotoz v2.5</span>
            </div>
            <span className={`text-[11px] font-bold ${
              isLight ? 'text-sky-700' : isMix ? 'text-amber-800' : 'text-[#00FF41]'
            }`}>
              Som Maurya
            </span>
          </div>
          <span className={`text-[9px] text-center ${textMutedClass}`}>
            IIT Madras Data Science & Computational Thinking
          </span>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block h-full">{sidebarContent}</div>

      {/* Mobile Drawer with Backdrop */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-50 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
});
