import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  MessageSquare,
  Image as ImageIcon,
  Film,
  Music,
  BookOpen,
  Globe,
  Headphones,
  Plus,
  Terminal,
  LogOut,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Shield,
  Code2,
  Cpu,
  User,
  Trash2,
  Clock,
  Star,
  X
} from 'lucide-react';
import { ViewMode, GenerationMode, UserProfile, JournalEntry } from '../types';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useTheme } from '../context/ThemeContext';

interface CommandSidebarProps {
  currentView: ViewMode;
  currentChatMode?: GenerationMode;
  onSelectView: (view: ViewMode, chatMode?: GenerationMode) => void;
  onNewReflection: () => void;
  onLogout: () => void;
  onOpenProfile?: () => void;
  user: UserProfile;
  entryCount: number;
  entries?: JournalEntry[];
  onSelectEntry?: (entry: JournalEntry) => void;
  onDeleteEntry?: (entry: JournalEntry, e: React.MouseEvent) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const CommandSidebar: React.FC<CommandSidebarProps> = ({
  currentView,
  currentChatMode = 'text',
  onSelectView,
  onNewReflection,
  onLogout,
  onOpenProfile,
  user,
  entryCount,
  entries = [],
  onSelectEntry,
  onDeleteEntry,
  isOpenMobile,
  onCloseMobile,
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

  const sidebarBgClass = isLight
    ? 'bg-[#F4F6FB]/95 border-r-2 border-[#CBD5E1]'
    : isMix
    ? 'bg-[#F6F2E9]/95 border-r-2 border-[#D3C7B5]'
    : 'bg-gradient-to-b from-[#0B0B16] via-[#07070F] to-[#030307] border-r border-[#25253D]';

  const headerBgClass = isLight
    ? 'bg-white border-b border-[#CBD5E1]'
    : isMix
    ? 'bg-[#ECE5D6] border-b border-[#D3C7B5]'
    : 'bg-black/70 border-b border-[#25253D]';

  const itemInactiveClass = isLight
    ? 'bg-white/90 border-slate-200 text-slate-700 hover:border-sky-300 hover:text-slate-950 shadow-xs'
    : isMix
    ? 'bg-[#FAF6EE]/90 border-[#D8CEBF] text-[#3E342B] hover:border-amber-400 hover:text-[#231E19] shadow-xs'
    : 'bg-[#0E0E1C] border-[#25253D] text-[#A1A1AA] hover:border-[#3D3D60] hover:text-[#EDEDED]';

  const [showDevModal, setShowDevModal] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);

  // Command Navigation Items - Unified Primary Workspace
  const navItems = [
    {
      id: 'dashboard' as ViewMode,
      label: 'Dashboard',
      shortLabel: 'Overview',
      desc: 'Activity overview, analytics & streaks',
      icon: LayoutDashboard,
      badge: 'v2.5',
      accent: '#00F0FF',
      glow: 'shadow-[0_0_15px_rgba(0,240,255,0.25)]',
      borderActive: isLight ? 'border-sky-500 bg-sky-50 text-sky-800 ring-1 ring-sky-400' : isMix ? 'border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-500' : 'border-[#00F0FF] bg-black/90 text-[#00F0FF]',
      textActive: isLight ? 'text-sky-800' : isMix ? 'text-amber-900' : 'text-[#00F0FF]',
    },
    {
      id: 'chat' as ViewMode,
      chatMode: 'text' as GenerationMode,
      label: 'Multimodal AI Chat',
      shortLabel: 'Unified Chat',
      desc: 'Text, Image, Video, Music & Voice all-in-one.',
      icon: MessageSquare,
      badge: 'UNIFIED 2.5',
      accent: '#00F0FF',
      glow: 'shadow-[0_0_15px_rgba(0,240,255,0.25)]',
      borderActive: isLight ? 'border-sky-500 bg-sky-50 text-sky-800 ring-1 ring-sky-400' : isMix ? 'border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-500' : 'border-[#00F0FF] bg-black/90 text-[#00F0FF]',
      textActive: isLight ? 'text-sky-800' : isMix ? 'text-amber-900' : 'text-[#00F0FF]',
    },
  ];

  // Secondary Engine Items
  const secondaryItems = [
    {
      id: 'write' as ViewMode,
      label: 'Daily Notes & Journal',
      icon: BookOpen,
      count: entryCount,
      accent: '#00F0FF',
    },
    {
      id: 'wisdom' as ViewMode,
      label: 'Knowledge Hub',
      icon: Globe,
      accent: '#A855F7',
    },
    {
      id: 'soundscapes' as ViewMode,
      label: 'Focus Sounds & Music',
      icon: Headphones,
      accent: '#FFB800',
    },
  ];

  const formatRelativeTime = (timestamp: number) => {
    const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSeconds < 60) return 'just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const sidebarContent = (
    <aside className={`w-72 sm:w-80 h-full flex flex-col justify-between select-none font-mono shrink-0 overflow-y-auto backdrop-blur-md transition-colors duration-300 ${sidebarBgClass} ${textPrimaryClass}`}>
      
      {/* 1. TOP BRAND HEADER WITH ASYMMETRICAL POLYGON TRIM */}
      <div className={`p-4 clip-stealth-notch transition-colors ${headerBgClass}`}>
        <div
          onClick={() => {
            onSelectView('dashboard');
            onCloseMobile();
          }}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className={`w-9 h-9 flex items-center justify-center font-mono font-bold text-sm clip-badge-poly border shadow-sm transition-all group-hover:scale-105 ${
            isLight
              ? 'bg-sky-50 border-sky-300 text-sky-700 shadow-[0_0_10px_rgba(2,132,199,0.2)]'
              : isMix
              ? 'bg-amber-100 border-amber-300 text-amber-800 shadow-[0_0_10px_rgba(217,119,6,0.2)]'
              : 'bg-black/90 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.4)]'
          }`}>
            S_
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-1.5">
              <span className={`text-sm font-bold tracking-tight transition-colors ${textPrimaryClass}`}>
                SOMOTOZ
              </span>
              <span className={`text-[10px] px-2 py-0.5 clip-badge-poly border font-bold ${
                isLight
                  ? 'bg-sky-100 text-sky-800 border-sky-300'
                  : isMix
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-black/80 text-[#00F0FF] border-[#00F0FF]/40'
              }`}>
                AI SUITE
              </span>
            </div>
            <div className={`text-[10px] flex items-center gap-1.5 mt-0.5 ${textMutedClass}`}>
              <span className="w-1.5 h-1.5 bg-[#00F0FF] rounded-full animate-ping" />
              <span>KERNEL // v2.5 ONLINE</span>
            </div>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={() => {
            onNewReflection();
            onCloseMobile();
          }}
          className={`w-full mt-4 py-2.5 px-3 border text-xs font-bold clip-badge-poly active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            isLight
              ? 'bg-sky-600 hover:bg-sky-700 text-white border-sky-600 shadow-md'
              : isMix
              ? 'bg-amber-700 hover:bg-amber-800 text-white border-amber-700 shadow-md'
              : 'bg-gradient-to-r from-[#00F0FF]/15 to-[#A855F7]/15 hover:from-[#00F0FF]/25 hover:to-[#A855F7]/25 border-[#00F0FF] text-[#00F0FF] hover:text-[#FFFFFF] shadow-[0_0_15px_rgba(0,240,255,0.2)]'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>NEW NOTE / PROMPT</span>
        </button>
      </div>

      {/* 2. COMMAND NAVIGATION & HISTORY ITEMS */}
      <div className="p-3 flex-1 space-y-5">
        
        {/* Main Neural Suite Section */}
        <div>
          <div className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider flex items-center justify-between ${textSecondaryClass}`}>
            <span>MAIN TOOLS</span>
            <span className={`text-[9px] font-bold ${
              isLight ? 'text-sky-600' : isMix ? 'text-amber-700' : 'text-[#00F0FF]'
            }`}>2 ACTIVE</span>
          </div>

          <div className="mt-1.5 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.id === currentView &&
                (!item.chatMode || item.chatMode === currentChatMode);

              return (
                <button
                  key={`${item.id}-${item.chatMode || 'default'}`}
                  onClick={() => {
                    onSelectView(item.id, item.chatMode);
                    onCloseMobile();
                  }}
                  className={`w-full p-2.5 text-left border transition-all duration-200 cursor-pointer flex items-center justify-between group clip-cyber-card ${
                    isActive
                      ? item.borderActive
                      : itemInactiveClass
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-1.5 border transition-all duration-200 clip-badge-poly ${
                        isActive
                          ? isLight
                            ? 'bg-sky-600 border-sky-600 text-white shadow-sm'
                            : isMix
                            ? 'bg-amber-700 border-amber-700 text-white shadow-sm'
                            : 'bg-black border-[#00F0FF] text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                          : isLight
                          ? 'bg-slate-100 border-slate-200 text-slate-600 group-hover:text-sky-600'
                          : isMix
                          ? 'bg-[#ECE5D6] border-[#D8CEBF] text-amber-800 group-hover:text-amber-900'
                          : 'bg-black/80 border-[#2D2D45] text-[#737373] group-hover:text-[#00F0FF] group-hover:border-[#00F0FF]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {/* Magnetic Shift on Hover */}
                    <div className="group-hover:translate-x-1 transition-transform duration-200">
                      <div className={`text-xs font-bold tracking-tight ${
                        isActive ? (isLight ? 'text-sky-900' : isMix ? 'text-amber-950' : item.textActive) : textPrimaryClass
                      }`}>
                        {item.label}
                      </div>
                      <div className={`text-[10px] truncate max-w-[150px] ${textMutedClass}`}>
                        {item.desc}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] px-2 py-0.5 border clip-badge-poly ${
                      isActive
                        ? isLight
                          ? 'bg-sky-100 text-sky-800 border-sky-300 font-bold'
                          : isMix
                          ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                          : `bg-black ${item.textActive} ${item.borderActive}`
                        : isLight
                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                        : isMix
                        ? 'bg-[#ECE5D6] text-amber-800 border-[#D8CEBF]'
                        : 'bg-black/80 text-[#737373] border-[#2D2D45] group-hover:text-[#EDEDED]'
                    }`}
                  >
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Hubs */}
        <div>
          <div className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider ${textSecondaryClass}`}>
            JOURNAL & TOOLS
          </div>

          <div className="mt-1.5 space-y-1.5">
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.id === currentView ||
                (item.id === 'write' && (currentView === 'view' || currentView === 'edit'));

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectView(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full p-2 text-left border transition-all duration-200 cursor-pointer flex items-center justify-between group clip-cyber-card ${
                    isActive
                      ? isLight
                        ? 'bg-sky-50 border-sky-500 text-sky-800 shadow-[0_0_12px_rgba(2,132,199,0.15)] ring-1 ring-sky-400'
                        : isMix
                        ? 'bg-amber-50 border-amber-600 text-amber-900 shadow-[0_0_12px_rgba(217,119,6,0.15)] ring-1 ring-amber-500'
                        : 'bg-black/90 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                      : itemInactiveClass
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-3.5 h-3.5 ${
                      isActive
                        ? isLight ? 'text-sky-600' : isMix ? 'text-amber-700' : 'text-[#00F0FF]'
                        : isLight ? 'text-slate-500 group-hover:text-sky-600' : isMix ? 'text-amber-800 group-hover:text-amber-900' : 'text-[#737373] group-hover:text-[#00F0FF]'
                    }`} />
                    <span className={`text-xs font-semibold group-hover:translate-x-0.5 transition-transform ${
                      isActive
                        ? isLight ? 'text-sky-900 font-bold' : isMix ? 'text-amber-950 font-bold' : 'text-[#00F0FF]'
                        : textPrimaryClass
                    }`}>
                      {item.label}
                    </span>
                  </div>

                  {item.count !== undefined && (
                    <span className={`text-[10px] font-mono px-2 py-0.5 border clip-badge-poly font-bold ${
                      isLight
                        ? 'bg-sky-100 text-sky-800 border-sky-300'
                        : isMix
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-black text-[#00F0FF] border-[#2D2D45]'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. DEDICATED COLLAPSIBLE PAST PROMPTS / HISTORY SECTION */}
        <div>
          <div
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
            className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider flex items-center justify-between cursor-pointer group ${textSecondaryClass}`}
          >
            <div className="flex items-center space-x-1.5">
              <Clock className={`w-3 h-3 ${isLight ? 'text-sky-600' : isMix ? 'text-amber-700' : 'text-[#00F0FF]'}`} />
              <span>HISTORY & RECENT PROMPTS</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className={`text-[9px] font-mono font-bold ${
                isLight ? 'text-sky-700' : isMix ? 'text-amber-800' : 'text-[#00F0FF]'
              }`}>
                {entries.length}
              </span>
              {isHistoryExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {isHistoryExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-1.5 space-y-1 overflow-hidden"
              >
                {entries.length === 0 ? (
                  <div className={`p-3 border text-center text-[10px] clip-cyber-card ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-500'
                      : isMix
                      ? 'bg-[#ECE5D6] border-[#D3C7B5] text-[#5F564D]'
                      : 'bg-[#0E0E1C] border-[#25253D] text-[#737373]'
                  }`}>
                    No past prompts or entries recorded yet.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                    <AnimatePresence>
                      {entries.slice(0, 8).map((entry) => (
                        <motion.div
                          key={entry.id}
                          layout
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, height: 0, margin: 0, padding: 0 }}
                          transition={{ duration: 0.2 }}
                          onClick={() => {
                            if (onSelectEntry) {
                              onSelectEntry(entry);
                            } else {
                              onSelectView('view');
                            }
                            onCloseMobile();
                          }}
                          className={`group relative p-2.5 border transition-all cursor-pointer flex items-center justify-between clip-cyber-card hover:translate-x-1 ${
                            isLight
                              ? 'bg-white hover:bg-sky-50/70 border-slate-200 hover:border-sky-400 shadow-xs'
                              : isMix
                              ? 'bg-[#FAF6EE] hover:bg-[#ECE5D6] border-[#D8CEBF] hover:border-amber-400 shadow-xs'
                              : 'bg-[#0E0E1C] hover:bg-black/90 border-[#25253D] hover:border-[#00F0FF]'
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate flex-1 min-w-0 pr-6">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 animate-pulse ${
                              isLight ? 'bg-sky-600' : isMix ? 'bg-amber-600' : 'bg-[#00F0FF]'
                            }`} />
                            <div className="truncate flex-1">
                              <div className={`text-[11px] font-bold truncate leading-tight ${textPrimaryClass}`}>
                                {entry.title || 'Untitled Prompt'}
                              </div>
                              <div className={`text-[9px] flex items-center space-x-1.5 mt-0.5 ${textMutedClass}`}>
                                <span>{formatRelativeTime(entry.createdAt)}</span>
                                {entry.moodTags && entry.moodTags.length > 0 && (
                                  <span className={`truncate font-medium ${
                                    isLight ? 'text-sky-700' : isMix ? 'text-amber-800' : 'text-[#00F0FF]/80'
                                  }`}>
                                    #{entry.moodTags[0]}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Delete Trash Action Button with hover opacity */}
                          {onDeleteEntry && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteEntry(entry, e);
                              }}
                              className={`opacity-0 group-hover:opacity-100 p-1 clip-badge-poly transition-all cursor-pointer absolute right-1.5 top-1/2 -translate-y-1/2 border ${
                                isLight
                                  ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200'
                                  : isMix
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-300'
                                  : 'text-[#737373] hover:text-rose-400 hover:bg-rose-950/60 border-transparent hover:border-rose-600/40'
                              }`}
                              title="Delete history entry"
                              aria-label="Delete history entry"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* 4. BOTTOM TRIPLE THEME SWITCHER, USER SESSION & SPECS */}
      <div className={`p-3.5 space-y-2.5 clip-stealth-notch transition-colors ${
        isLight ? 'bg-white border-t border-[#CBD5E1]' : isMix ? 'bg-[#ECE5D6] border-t border-[#D3C7B5]' : 'bg-[#07070F] border-t border-[#25253D]'
      }`}>
        
        {/* Sleek Triple Theme Selector Widget */}
        <ThemeSwitcher compact={false} showLabels={true} />

        {/* User Card */}
        <div
          onClick={onOpenProfile}
          className={`p-2.5 border transition-all flex items-center justify-between cursor-pointer group clip-cyber-card ${
            isLight
              ? 'bg-slate-50 hover:bg-white border-slate-200 hover:border-sky-400 shadow-xs'
              : isMix
              ? 'bg-[#FAF6EE] hover:bg-white border-[#D8CEBF] hover:border-amber-400 shadow-xs'
              : 'bg-black/80 border-[#25253D] hover:border-[#00F0FF]'
          }`}
          title="Open Profile Settings"
        >
          <div className="flex items-center space-x-2 truncate">
            <div className={`w-6 h-6 flex items-center justify-center text-xs font-bold clip-badge-poly border ${
              isLight
                ? 'bg-sky-100 border-sky-300 text-sky-800'
                : isMix
                ? 'bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-[#141424] border-[#2D2D45] text-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.3)]'
            }`}>
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="truncate">
              <div className={`text-[11px] font-bold truncate ${textPrimaryClass}`}>
                {user.displayName || 'User'}
              </div>
              <div className={`text-[9px] truncate ${textMutedClass}`}>{user.email}</div>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onLogout();
            }}
            className={`p-1.5 clip-badge-poly transition-colors cursor-pointer border ${
              isLight
                ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 border-transparent hover:border-rose-200'
                : isMix
                ? 'text-amber-800 hover:text-rose-700 hover:bg-rose-50 border-transparent hover:border-rose-300'
                : 'text-[#737373] hover:text-rose-400 hover:bg-rose-950/40 border-transparent hover:border-rose-600/40'
            }`}
            title="Log out session"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Developer Signature - Clickable for Technical Specs */}
        <div
          onClick={() => setShowDevModal(true)}
          className={`px-2.5 py-1.5 border transition-all cursor-pointer flex items-center justify-between group clip-badge-poly ${
            isLight
              ? 'bg-slate-50 hover:bg-white border-slate-200 hover:border-sky-400'
              : isMix
              ? 'bg-[#FAF6EE] hover:bg-white border-[#D8CEBF] hover:border-amber-400'
              : 'bg-black/80 border-[#222238] hover:border-[#00F0FF]'
          }`}
        >
          <div className="flex items-center space-x-1.5 text-[11px]">
            <span className="w-1.5 h-1.5 bg-[#00F0FF] rounded-full animate-ping" />
            <span className={textMutedClass}>Dev:</span>
            <span className={`font-bold ${
              isLight ? 'text-sky-700' : isMix ? 'text-amber-800' : 'text-[#00F0FF]'
            }`}>Som Maurya</span>
          </div>
          <span className={`text-[9px] ${textMutedClass}`}>Specs &rarr;</span>
        </div>

      </div>

      {/* Developer Information Modal */}
      <AnimatePresence>
        {showDevModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`max-w-md w-full border p-6 space-y-4 clip-cyber-card relative ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : isMix ? 'bg-[#FAF6EE] border-[#D3C7B5] text-[#231E19]' : 'bg-[#0A0A14] border-[#00F0FF] text-[#EDEDED] shadow-[0_0_30px_rgba(0,240,255,0.3)]'
              }`}
            >
              <button
                onClick={() => setShowDevModal(false)}
                className="absolute top-4 right-4 text-[#737373] hover:text-[#EDEDED] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-black border border-[#00F0FF] flex items-center justify-center text-[#00F0FF] clip-badge-poly">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Somotoz Architecture</h3>
                  <p className="text-xs text-[#737373]">Engineered by Som Maurya</p>
                </div>
              </div>

              <div className="text-xs space-y-2 border-y py-3 border-[#2D2D45]">
                <div className="flex justify-between">
                  <span className="text-[#737373]">Developer:</span>
                  <span className="font-bold">Som Maurya</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#737373]">Institution:</span>
                  <span className="font-bold">IIT Madras</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#737373]">Specialization:</span>
                  <span className="font-bold">Data Science & Computational Thinking</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#737373]">Email:</span>
                  <span className="font-mono text-[10px]">mauryasomkumar@gmail.com</span>
                </div>
              </div>

              <p className="text-[11px] text-[#737373] leading-relaxed">
                Powered by Google Gemini 2.5 Flash, Cloud Run serverless runtime, and resilient offline procedural engines.
              </p>

              <button
                onClick={() => setShowDevModal(false)}
                className="w-full py-2 bg-[#00F0FF] text-black font-bold text-xs clip-badge-poly cursor-pointer hover:bg-[#38BDF8] transition-colors"
              >
                CLOSE TECHNICAL SPECS
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block h-full">{sidebarContent}</div>

      {/* Mobile Drawer with Backdrop */}
      {isOpenMobile && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-50 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
