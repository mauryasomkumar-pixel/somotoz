import React, { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { JournalEntry } from '../types';
import { Search, Plus, Star, Sparkles, Calendar, Tag, Trash2, X, BookOpen, ChevronRight, Terminal } from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';

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
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const sidebarContent = (
    <aside className="w-80 lg:w-88 h-full bg-[#0A0A0A] border-r border-[#262626] flex flex-col shrink-0 select-none text-[#EDEDED] font-mono">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-[#262626] flex flex-col gap-3 bg-black">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1 bg-black border border-[#00FF41] text-[#00FF41]">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <h2 className="font-bold text-xs text-[#EDEDED] uppercase tracking-wider">Journal & History</h2>
            <span className="text-[10px] bg-[#141414] text-[#00FF41] px-1.5 py-0.5 border border-[#262626]">
              {entries.length}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`p-1.5 border transition-colors cursor-pointer ${
                onlyFavorites
                  ? 'bg-black text-[#00FF41] border-[#00FF41]'
                  : 'text-[#737373] hover:text-[#00FF41] border-transparent hover:border-[#262626]'
              }`}
              title={onlyFavorites ? 'Show all notes' : 'Show only starred'}
              aria-label="Filter favorites"
            >
              <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-[#00FF41] text-[#00FF41]' : ''}`} />
            </button>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-[#737373] hover:text-[#EDEDED] cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes or #tags..."
            className="w-full pl-8 pr-8 py-2 bg-black text-xs text-[#EDEDED] placeholder-[#737373] border border-[#262626] focus:outline-none focus:border-[#00FF41] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#EDEDED] cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Mood Tag Filters Bar */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2 py-0.5 text-[10px] font-bold shrink-0 transition-colors cursor-pointer border ${
                selectedTag === null
                  ? 'bg-[#00FF41] text-black border-[#00FF41]'
                  : 'bg-black text-[#737373] hover:text-[#EDEDED] border-[#262626]'
              }`}
            >
              ALL
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2 py-0.5 text-[10px] shrink-0 transition-colors cursor-pointer border ${
                  selectedTag === tag
                    ? 'bg-[#00FF41] text-black border-[#00FF41] font-bold'
                    : 'bg-black text-[#00FF41]/80 hover:text-[#00FF41] border-[#262626]'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Entries List with Animated Fade-out on Delete */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          // Skeleton Loaders
          <div className="space-y-3 p-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3.5 border border-[#262626] bg-black animate-pulse space-y-2">
                <div className="h-4 bg-[#1A1A1A] w-3/4" />
                <div className="h-3 bg-[#1A1A1A] w-full" />
                <div className="h-3 bg-[#1A1A1A] w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          // Empty State
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[#737373]">
            <div className="w-10 h-10 bg-black border border-[#262626] flex items-center justify-center text-[#737373] mb-3">
              <BookOpen className="w-5 h-5 text-[#00FF41]" />
            </div>
            <p className="text-xs font-bold text-[#EDEDED]">
              {entries.length === 0 ? 'NO NOTES RECORDED' : 'NO MATCHING NOTES'}
            </p>
            <p className="text-[11px] text-[#737373] mt-1 max-w-[200px] font-sans">
              {entries.length === 0
                ? 'Your notes and reflections will appear here.'
                : 'Try adjusting your search terms or filter tags.'}
            </p>
            {entries.length === 0 && (
              <button
                onClick={() => {
                  onNewReflection();
                  onCloseMobile();
                }}
                className="mt-4 px-3.5 py-1.5 bg-[#00FF41] hover:bg-[#00E038] text-black font-bold text-xs flex items-center space-x-1.5 shadow-[2px_2px_0px_0px_#262626] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-black" />
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
                  transition={{ duration: 0.25 }}
                  onClick={() => {
                    onSelectEntry(entry);
                    onCloseMobile();
                  }}
                  className={`group relative p-3 border transition-all cursor-pointer text-left overflow-hidden ${
                    isSelected
                      ? 'bg-black border-[#00FF41] shadow-[2px_2px_0px_0px_#00FF41]'
                      : 'bg-[#0D0D0D] hover:bg-black border-[#262626] hover:border-[#404040]'
                  }`}
                  style={{ borderRadius: '2px' }}
                >
                  {/* Header of card: Title & Favorite */}
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className={`text-xs font-bold truncate flex-1 ${
                        isSelected ? 'text-[#00FF41]' : 'text-[#EDEDED]'
                      }`}
                    >
                      {entry.title || 'Untitled Note'}
                    </h3>
                    <button
                      onClick={(e) => onToggleFavorite(entry.id, !!entry.isFavorite, e)}
                      className="p-0.5 text-[#737373] hover:text-[#00FF41] transition-colors shrink-0 cursor-pointer"
                      title={entry.isFavorite ? 'Remove star' : 'Mark as favorite'}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          entry.isFavorite ? 'fill-[#00FF41] text-[#00FF41]' : 'hover:text-[#00FF41]'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Excerpt */}
                  <p className="text-[11px] text-[#A1A1AA] line-clamp-2 mt-1 leading-relaxed font-sans">
                    {entry.content}
                  </p>

                  {/* Meta & Mood tags */}
                  <div className="mt-2.5 pt-2 border-t border-[#262626] flex items-center justify-between text-[10px] text-[#737373]">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-[#737373]" />
                      <span>{formatDate(entry.createdAt)}</span>
                    </div>

                    {entry.aiResponse && (
                      <span className="flex items-center gap-1 text-[9px] text-[#00FF41] bg-black border border-[#00FF41]/40 px-1 py-0.2">
                        <Sparkles className="w-2.5 h-2.5 text-[#00FF41]" />
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
                          className="text-[9px] px-1.5 py-0.2 bg-black text-[#00FF41]/80 border border-[#262626]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Delete hover icon */}
                  <button
                    onClick={(e) => onRequestDelete(entry, e)}
                    className="opacity-0 group-hover:opacity-100 absolute bottom-2.5 right-2.5 p-1 text-[#737373] hover:text-rose-400 hover:bg-rose-950/60 border border-[#262626] hover:border-rose-600/50 transition-all cursor-pointer shadow-xs"
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

      {/* Footer Theme Switcher & Watermark Credit */}
      <div className="p-3 border-t border-[#262626] bg-black space-y-2">
        <ThemeSwitcher compact={true} showLabels={false} className="w-full justify-center" />
        <div className="flex items-center justify-between text-xs text-[#737373] pt-1">
          <div className="flex items-center space-x-1.5">
            <Terminal className="w-3.5 h-3.5 text-[#00FF41]" />
            <span className="text-[11px]">Somotoz Core v2.5</span>
          </div>
          <span className="text-[11px] text-[#00FF41] font-bold">
            Dev: Som Maurya
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
