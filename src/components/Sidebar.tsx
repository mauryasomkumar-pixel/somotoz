import React, { useState, useMemo } from 'react';
import { JournalEntry } from '../types';
import { Search, Plus, Star, Sparkles, Calendar, Tag, Trash2, X, BookOpen, ChevronRight, Terminal, Cpu } from 'lucide-react';

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

export const Sidebar: React.FC<SidebarProps> = ({
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
    
    // Check if yesterday
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
    <aside className="w-80 lg:w-88 h-full bg-[#0d1322] border-r border-slate-800/90 flex flex-col shrink-0 select-none text-slate-300">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800/80 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded-md bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <h2 className="font-semibold text-sm text-slate-100 tracking-tight font-mono">Memory Logs</h2>
            <span className="text-[11px] bg-slate-900 text-cyan-300 px-2 py-0.5 rounded-full font-mono border border-slate-800">
              {entries.length}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                onlyFavorites
                  ? 'bg-amber-950/60 text-amber-400 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title={onlyFavorites ? 'Show all reflections' : 'Show only starred'}
              aria-label="Filter favorites"
            >
              <Star className={`w-4 h-4 ${onlyFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-200 rounded-lg"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative font-mono">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries or #tags..."
            className="w-full pl-9 pr-8 py-2 bg-slate-900/80 hover:bg-slate-900 focus:bg-slate-950 text-xs text-slate-200 placeholder-slate-500 rounded-xl border border-slate-800 focus:outline-hidden focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Mood Tag Filters Bar */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar font-mono">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0 transition-colors cursor-pointer ${
                selectedTag === null
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0 transition-colors cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-xs'
                    : 'bg-slate-900/90 text-cyan-400/90 hover:bg-slate-800 border border-cyan-500/20'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          // Skeleton Loaders
          <div className="space-y-3 p-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 animate-pulse space-y-2">
                <div className="h-4 bg-slate-800 rounded-md w-3/4" />
                <div className="h-3 bg-slate-800 rounded-md w-full" />
                <div className="h-3 bg-slate-800 rounded-md w-1/2" />
                <div className="flex gap-1 pt-1">
                  <div className="h-4 bg-slate-800 rounded-full w-14" />
                  <div className="h-4 bg-slate-800 rounded-full w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          // Empty State
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-slate-600 mb-3 border border-slate-800">
              <BookOpen className="w-6 h-6 text-cyan-500/50" />
            </div>
            <p className="text-sm font-semibold text-slate-300 font-mono">
              {entries.length === 0 ? 'No logs recorded' : 'No matching entries'}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
              {entries.length === 0
                ? 'Your thoughts and reflections will be securely preserved in Firestore.'
                : 'Try adjusting your search terms or filter tags.'}
            </p>
            {entries.length === 0 && (
              <button
                onClick={() => {
                  onNewReflection();
                  onCloseMobile();
                }}
                className="mt-4 px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md shadow-cyan-500/20 cursor-pointer font-mono"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Write First Entry</span>
              </button>
            )}
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isSelected = selectedEntryId === entry.id;
            return (
              <div
                key={entry.id}
                onClick={() => {
                  onSelectEntry(entry);
                  onCloseMobile();
                }}
                className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header of card: Title & Favorite */}
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className={`text-sm font-semibold truncate flex-1 font-mono ${
                      isSelected ? 'text-cyan-300' : 'text-slate-200'
                    }`}
                  >
                    {entry.title || 'Untitled Entry'}
                  </h3>
                  <button
                    onClick={(e) => onToggleFavorite(entry.id, !!entry.isFavorite, e)}
                    className="p-1 text-slate-500 hover:text-amber-400 rounded-md transition-colors shrink-0 cursor-pointer"
                    title={entry.isFavorite ? 'Remove star' : 'Mark as favorite'}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        entry.isFavorite ? 'fill-amber-400 text-amber-400' : 'hover:text-amber-400'
                      }`}
                    />
                  </button>
                </div>

                {/* Excerpt */}
                <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                  {entry.content}
                </p>

                {/* Meta & Mood tags */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{formatDate(entry.createdAt)}</span>
                  </div>

                  {entry.aiResponse && (
                    <span className="flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-950/70 border border-cyan-500/30 px-1.5 py-0.5 rounded-md font-mono">
                      <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                      Synthesized
                    </span>
                  )}
                </div>

                {/* Mood Tag Pills */}
                {entry.moodTags && entry.moodTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {entry.moodTags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950 text-cyan-300/80 border border-slate-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Delete hover icon */}
                <button
                  onClick={(e) => onRequestDelete(entry, e)}
                  className="opacity-0 group-hover:opacity-100 absolute bottom-2.5 right-2.5 p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/60 rounded-md transition-all cursor-pointer"
                  title="Delete entry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Watermark Credit */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-xs font-mono text-slate-500">
        <div className="flex items-center space-x-1.5">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400 text-[11px]">Somotoz Core v2.4</span>
        </div>
        <span className="text-[11px] text-cyan-400/80 font-medium">
          Dev: <strong>Som Maurya</strong>
        </span>
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
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-50 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};

