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
  const [showDevModal, setShowDevModal] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);

  // Command Navigation Items - Matching Simplified Tool Naming
  const navItems = [
    {
      id: 'dashboard' as ViewMode,
      label: 'Dashboard',
      shortLabel: 'Overview',
      desc: 'Activity overview, analytics & streaks',
      icon: LayoutDashboard,
      badge: 'v2.5',
      accent: '#00FF41',
    },
    {
      id: 'chat' as ViewMode,
      chatMode: 'text' as GenerationMode,
      label: 'Chat',
      shortLabel: 'Conversation',
      desc: 'Advanced AI conversation and logic.',
      icon: MessageSquare,
      badge: 'LLM-2.5',
      accent: '#00FF41',
    },
    {
      id: 'chat' as ViewMode,
      chatMode: 'image' as GenerationMode,
      label: 'Image Generation',
      shortLabel: 'Visuals',
      desc: 'Create stunning visuals from text.',
      icon: ImageIcon,
      badge: 'VECTOR-SVG',
      accent: '#00FF41',
    },
    {
      id: 'chat' as ViewMode,
      chatMode: 'video' as GenerationMode,
      label: 'Video Generator',
      shortLabel: 'Motion FX',
      desc: 'Generate high-quality video frames.',
      icon: Film,
      badge: 'CANVAS',
      accent: '#00FF41',
    },
    {
      id: 'chat' as ViewMode,
      chatMode: 'music' as GenerationMode,
      label: 'Music Generator',
      shortLabel: 'Audio Synth',
      desc: 'Compose dynamic audio and music.',
      icon: Music,
      badge: '432HZ SYNTH',
      accent: '#00FF41',
    },
  ];

  // Secondary Engine Items
  const secondaryItems = [
    {
      id: 'write' as ViewMode,
      label: 'Daily Notes & Journal',
      icon: BookOpen,
      count: entryCount,
      accent: '#00FF41',
    },
    {
      id: 'wisdom' as ViewMode,
      label: 'Knowledge Hub',
      icon: Globe,
      accent: '#00FF41',
    },
    {
      id: 'soundscapes' as ViewMode,
      label: 'Focus Sounds & Music',
      icon: Headphones,
      accent: '#00FF41',
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
    <aside className="w-72 sm:w-80 h-full bg-[#0A0A0A] border-r border-[#262626] flex flex-col justify-between select-none text-[#EDEDED] font-mono shrink-0 overflow-y-auto">
      
      {/* 1. TOP BRAND HEADER */}
      <div className="p-4 border-b border-[#262626] bg-black">
        <div
          onClick={() => {
            onSelectView('dashboard');
            onCloseMobile();
          }}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-8 h-8 bg-black border border-[#00FF41] flex items-center justify-center text-[#00FF41] font-mono font-bold text-sm shadow-[2px_2px_0px_0px_#00FF41] group-hover:shadow-[3px_3px_0px_0px_#00FF41] transition-all">
            S_
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-bold tracking-tight text-[#EDEDED] group-hover:text-[#00FF41] transition-colors">
                SOMOTOZ
              </span>
              <span className="text-[10px] px-1 py-0.2 bg-[#171717] text-[#00FF41] border border-[#262626]">
                AI SUITE
              </span>
            </div>
            <div className="text-[10px] text-[#737373] flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-[#00FF41] animate-pulse" />
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
          className="w-full mt-4 py-2.5 px-3 bg-black hover:bg-[#141414] border border-[#00FF41] text-[#00FF41] hover:text-[#FFFFFF] text-xs font-bold shadow-[2px_2px_0px_0px_#262626] hover:shadow-[3px_3px_0px_0px_#00FF41] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center space-x-2 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[#00FF41]" />
          <span>NEW NOTE / PROMPT</span>
        </button>
      </div>

      {/* 2. COMMAND NAVIGATION & HISTORY ITEMS */}
      <div className="p-3 flex-1 space-y-5">
        
        {/* Main Neural Suite Section */}
        <div>
          <div className="px-2 py-1 text-[10px] uppercase font-bold text-[#737373] tracking-wider flex items-center justify-between">
            <span>MAIN TOOLS</span>
            <span className="text-[9px] text-[#00FF41]">4 ACTIVE</span>
          </div>

          <div className="mt-1.5 space-y-1">
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
                  className={`w-full p-2.5 text-left border transition-all duration-200 cursor-pointer flex items-center justify-between group ${
                    isActive
                      ? 'bg-black border-[#00FF41] text-[#00FF41] shadow-[2px_2px_0px_0px_#00FF41]'
                      : 'bg-[#0D0D0D] border-[#262626] text-[#A1A1AA] hover:border-[#404040] hover:text-[#EDEDED]'
                  }`}
                  style={{ borderRadius: '2px' }}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-1.5 border transition-all duration-200 ${
                        isActive
                          ? 'bg-black border-[#00FF41] text-[#00FF41] shadow-[0_0_10px_rgba(0,255,65,0.5)]'
                          : 'bg-black border-[#262626] text-[#737373] group-hover:text-[#00FF41] group-hover:border-[#00FF41] group-hover:shadow-[0_0_8px_rgba(0,255,65,0.4)]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {/* Magnetic Shift on Hover */}
                    <div className="group-hover:translate-x-1.5 transition-transform duration-200">
                      <div className="text-xs font-bold tracking-tight text-[#EDEDED] group-hover:text-[#00FF41]">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-[#737373] truncate max-w-[150px]">
                        {item.desc}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] px-1.5 py-0.5 border ${
                      isActive
                        ? 'bg-black text-[#00FF41] border-[#00FF41]'
                        : 'bg-black text-[#737373] border-[#262626] group-hover:text-[#EDEDED]'
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
          <div className="px-2 py-1 text-[10px] uppercase font-bold text-[#737373] tracking-wider">
            JOURNAL & TOOLS
          </div>

          <div className="mt-1.5 space-y-1">
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
                  className={`w-full p-2 text-left border transition-all duration-200 cursor-pointer flex items-center justify-between group ${
                    isActive
                      ? 'bg-black border-[#00FF41] text-[#00FF41] shadow-[2px_2px_0px_0px_#00FF41]'
                      : 'bg-[#0D0D0D] border-[#262626] text-[#A1A1AA] hover:border-[#404040] hover:text-[#EDEDED]'
                  }`}
                  style={{ borderRadius: '2px' }}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#00FF41]' : 'text-[#737373] group-hover:text-[#00FF41]'}`} />
                    <span className="text-xs font-semibold text-[#EDEDED] group-hover:translate-x-1 transition-transform group-hover:text-[#00FF41]">
                      {item.label}
                    </span>
                  </div>

                  {item.count !== undefined && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-black text-[#00FF41] border border-[#262626]">
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
            className="px-2 py-1 text-[10px] uppercase font-bold text-[#737373] hover:text-[#EDEDED] tracking-wider flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center space-x-1.5">
              <Clock className="w-3 h-3 text-[#00FF41]" />
              <span>HISTORY & RECENT PROMPTS</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-[9px] text-[#00FF41] font-mono">
                {entries.length}
              </span>
              {isHistoryExpanded ? (
                <ChevronDown className="w-3 h-3 text-[#737373] group-hover:text-[#00FF41]" />
              ) : (
                <ChevronRight className="w-3 h-3 text-[#737373] group-hover:text-[#00FF41]" />
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
                  <div className="p-3 bg-[#0D0D0D] border border-[#262626] text-center text-[10px] text-[#737373]">
                    No past prompts or entries recorded yet.
                  </div>
                ) : (
                  <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
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
                          className="group relative p-2 bg-[#0D0D0D] hover:bg-black border border-[#262626] hover:border-[#00FF41] transition-all cursor-pointer flex items-center justify-between"
                          style={{ borderRadius: '2px' }}
                        >
                          <div className="flex items-center space-x-2 truncate flex-1 min-w-0 pr-6">
                            <div className="w-1.5 h-1.5 bg-[#00FF41] shrink-0" />
                            <div className="truncate flex-1">
                              <div className="text-[11px] font-bold text-[#EDEDED] group-hover:text-[#00FF41] truncate leading-tight">
                                {entry.title || 'Untitled Prompt'}
                              </div>
                              <div className="text-[9px] text-[#737373] flex items-center space-x-1.5 mt-0.5">
                                <span>{formatRelativeTime(entry.createdAt)}</span>
                                {entry.moodTags && entry.moodTags.length > 0 && (
                                  <span className="text-[#00FF41]/80 truncate">
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
                              className="opacity-0 group-hover:opacity-100 p-1 text-[#737373] hover:text-rose-400 hover:bg-rose-950/60 border border-transparent hover:border-rose-600/40 transition-all cursor-pointer absolute right-1.5 top-1/2 -translate-y-1/2"
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
      <div className="p-3 border-t border-[#262626] bg-[#070707] space-y-2.5">
        
        {/* Sleek Triple Theme Selector Widget */}
        <ThemeSwitcher compact={false} showLabels={true} />

        {/* User Card */}
        <div
          onClick={onOpenProfile}
          className="p-2 bg-black border border-[#262626] hover:border-[#00FF41] transition-all flex items-center justify-between cursor-pointer group"
          title="Open Profile Settings"
        >
          <div className="flex items-center space-x-2 truncate">
            <div className="w-6 h-6 bg-[#141414] border border-[#333333] group-hover:border-[#00FF41] flex items-center justify-center text-xs text-[#00FF41] font-bold">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="truncate">
              <div className="text-[11px] font-bold text-[#EDEDED] group-hover:text-[#00FF41] truncate">
                {user.displayName || 'User'}
              </div>
              <div className="text-[9px] text-[#737373] truncate">{user.email}</div>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onLogout();
            }}
            className="p-1.5 text-[#737373] hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-600/40 transition-colors cursor-pointer"
            title="Log out session"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Developer Signature - Clickable for Technical Specs */}
        <div
          onClick={() => setShowDevModal(true)}
          className="px-2 py-1.5 bg-black border border-[#1A1A1A] hover:border-[#00FF41] transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center space-x-1.5 text-[11px]">
            <span className="w-1.5 h-1.5 bg-[#00FF41] animate-pulse" />
            <span className="text-[#737373] group-hover:text-[#EDEDED]">Dev:</span>
            <span className="font-bold text-[#00FF41]">Som Maurya</span>
          </div>
          <span className="text-[9px] text-[#737373] group-hover:text-[#00FF41]">
            [SPECS &rarr;]
          </span>
        </div>
      </div>

      {/* Developer Specs Popover Modal */}
      <AnimatePresence>
        {showDevModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0A0A0A] border border-[#00FF41] shadow-[0_0_30px_rgba(0,255,65,0.25)] p-6 space-y-4 text-left font-mono"
            >
              <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                <div className="flex items-center space-x-2 text-[#00FF41] text-xs font-bold">
                  <Terminal className="w-4 h-4" />
                  <span>DEVELOPER ARCHITECTURE SPECS</span>
                </div>
                <button
                  onClick={() => setShowDevModal(false)}
                  className="p-1 text-[#737373] hover:text-[#EDEDED] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-black border border-[#262626] space-y-1">
                  <div className="text-[#737373] text-[10px]">LEAD ENGINEER</div>
                  <div className="text-base font-bold text-[#EDEDED] font-display">Som Maurya</div>
                  <div className="text-[#00FF41] text-[11px]">Data Science & Computational Thinking</div>
                </div>

                <div className="p-3 bg-black border border-[#262626] space-y-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#737373]">CREDENTIALS:</span>
                    <span className="text-[#EDEDED]">Kaggle 5-Day AI Agents Intensive</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737373]">INITIATIVES:</span>
                    <span className="text-[#EDEDED]">AI for Bharat | INDIA RUNS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737373]">CORE ENGINES:</span>
                    <span className="text-[#00FF41]">Text, SVG, Canvas, 432Hz Synth</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737373]">THEMES:</span>
                    <span className="text-[#00FF41]">Black (Night), White (Day), Mix (Eye-Care)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737373]">PERSISTENCE:</span>
                    <span className="text-[#EDEDED]">Google Cloud Firestore</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowDevModal(false)}
                className="w-full py-2.5 bg-[#00FF41] text-black font-bold text-xs shadow-[2px_2px_0px_0px_#262626] hover:bg-[#00E038] cursor-pointer"
              >
                CLOSE SPECIFICATION
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
      <div className="hidden lg:block h-full">{sidebarContent}</div>

      {/* Mobile Drawer */}
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
};
