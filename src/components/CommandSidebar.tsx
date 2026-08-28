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

  // Command Navigation Items - Matching Simplified Tool Naming & Radiant Multi-Hue Identity
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
      borderActive: 'border-[#00F0FF]',
      textActive: 'text-[#00F0FF]',
    },
    {
      id: 'chat' as ViewMode,
      chatMode: 'text' as GenerationMode,
      label: 'Chat',
      shortLabel: 'Conversation',
      desc: 'Advanced AI conversation and logic.',
      icon: MessageSquare,
      badge: 'LLM-2.5',
      accent: '#00F0FF',
      glow: 'shadow-[0_0_15px_rgba(0,240,255,0.25)]',
      borderActive: 'border-[#00F0FF]',
      textActive: 'text-[#00F0FF]',
    },
    {
      id: 'chat' as ViewMode,
      chatMode: 'image' as GenerationMode,
      label: 'Image Generation',
      shortLabel: 'Visuals',
      desc: 'Photorealistic, high-fidelity visuals from text.',
      icon: ImageIcon,
      badge: 'PHOTOREAL 1K',
      accent: '#A855F7',
      glow: 'shadow-[0_0_15px_rgba(168,85,247,0.25)]',
      borderActive: 'border-[#A855F7]',
      textActive: 'text-[#A855F7]',
    },
    {
      id: 'chat' as ViewMode,
      chatMode: 'video' as GenerationMode,
      label: 'Video Generator',
      shortLabel: 'Motion FX',
      desc: 'Generate high-quality video frames.',
      icon: Film,
      badge: '60FPS',
      accent: '#FF007A',
      glow: 'shadow-[0_0_15px_rgba(255,0,122,0.25)]',
      borderActive: 'border-[#FF007A]',
      textActive: 'text-[#FF007A]',
    },
    {
      id: 'chat' as ViewMode,
      chatMode: 'music' as GenerationMode,
      label: 'Music Generator',
      shortLabel: 'Audio Synth',
      desc: 'Compose dynamic audio and music.',
      icon: Music,
      badge: '432HZ',
      accent: '#FFB800',
      glow: 'shadow-[0_0_15px_rgba(255,184,0,0.25)]',
      borderActive: 'border-[#FFB800]',
      textActive: 'text-[#FFB800]',
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
    <aside className="w-72 sm:w-80 h-full bg-gradient-to-b from-[#0B0B16] via-[#07070F] to-[#030307] border-r border-[#25253D] flex flex-col justify-between select-none text-[#EDEDED] font-mono shrink-0 overflow-y-auto">
      
      {/* 1. TOP BRAND HEADER */}
      <div className="p-4 border-b border-[#25253D] bg-black/70 clip-stealth-notch">
        <div
          onClick={() => {
            onSelectView('dashboard');
            onCloseMobile();
          }}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-9 h-9 bg-black/90 border border-[#00F0FF] flex items-center justify-center text-[#00F0FF] font-mono font-bold text-sm clip-badge-poly shadow-[0_0_12px_rgba(0,240,255,0.4)] group-hover:scale-105 group-hover:shadow-[0_0_18px_rgba(0,240,255,0.6)] transition-all">
            S_
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-bold tracking-tight text-[#EDEDED] group-hover:text-[#00F0FF] transition-colors">
                SOMOTOZ
              </span>
              <span className="text-[10px] px-1.5 py-0.2 bg-black/80 text-[#00F0FF] border border-[#00F0FF]/40 clip-badge-poly">
                AI SUITE
              </span>
            </div>
            <div className="text-[10px] text-[#737373] flex items-center gap-1.5 mt-0.5">
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
          className="w-full mt-4 py-2.5 px-3 bg-gradient-to-r from-[#00F0FF]/15 to-[#A855F7]/15 hover:from-[#00F0FF]/25 hover:to-[#A855F7]/25 border border-[#00F0FF] text-[#00F0FF] hover:text-[#FFFFFF] text-xs font-bold clip-badge-poly shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[#00F0FF]" />
          <span>NEW NOTE / PROMPT</span>
        </button>
      </div>

      {/* 2. COMMAND NAVIGATION & HISTORY ITEMS */}
      <div className="p-3 flex-1 space-y-5">
        
        {/* Main Neural Suite Section */}
        <div>
          <div className="px-2 py-1 text-[10px] uppercase font-bold text-[#A1A1AA] tracking-wider flex items-center justify-between">
            <span>MAIN TOOLS</span>
            <span className="text-[9px] text-[#00F0FF] font-bold">4 ACTIVE</span>
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
                      ? `bg-black/90 ${item.borderActive} ${item.textActive} ${item.glow}`
                      : 'bg-[#0E0E1C] border-[#25253D] text-[#A1A1AA] hover:border-[#3D3D60] hover:text-[#EDEDED] hover:translate-x-1'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-1.5 border transition-all duration-200 clip-badge-poly ${
                        isActive
                          ? `bg-black ${item.borderActive} ${item.textActive} shadow-[0_0_10px_rgba(0,240,255,0.3)]`
                          : 'bg-black/80 border-[#2D2D45] text-[#737373] group-hover:text-[#00F0FF] group-hover:border-[#00F0FF]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {/* Magnetic Shift on Hover */}
                    <div className="group-hover:translate-x-1 transition-transform duration-200">
                      <div className={`text-xs font-bold tracking-tight text-[#EDEDED] group-hover:${item.textActive}`}>
                        {item.label}
                      </div>
                      <div className="text-[10px] text-[#737373] truncate max-w-[150px]">
                        {item.desc}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] px-2 py-0.5 border clip-badge-poly ${
                      isActive
                        ? `bg-black ${item.textActive} ${item.borderActive}`
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
          <div className="px-2 py-1 text-[10px] uppercase font-bold text-[#A1A1AA] tracking-wider">
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
                      ? 'bg-black/90 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                      : 'bg-[#0E0E1C] border-[#25253D] text-[#A1A1AA] hover:border-[#3D3D60] hover:text-[#EDEDED] hover:translate-x-1'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#00F0FF]' : 'text-[#737373] group-hover:text-[#00F0FF]'}`} />
                    <span className="text-xs font-semibold text-[#EDEDED] group-hover:translate-x-0.5 transition-transform group-hover:text-[#00F0FF]">
                      {item.label}
                    </span>
                  </div>

                  {item.count !== undefined && (
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-[#00F0FF] border border-[#2D2D45] clip-badge-poly">
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
            className="px-2 py-1 text-[10px] uppercase font-bold text-[#A1A1AA] hover:text-[#EDEDED] tracking-wider flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center space-x-1.5">
              <Clock className="w-3 h-3 text-[#00F0FF]" />
              <span>HISTORY & RECENT PROMPTS</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-[9px] text-[#00F0FF] font-mono">
                {entries.length}
              </span>
              {isHistoryExpanded ? (
                <ChevronDown className="w-3 h-3 text-[#737373] group-hover:text-[#00F0FF]" />
              ) : (
                <ChevronRight className="w-3 h-3 text-[#737373] group-hover:text-[#00F0FF]" />
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
                  <div className="p-3 bg-[#0E0E1C] border border-[#25253D] text-center text-[10px] text-[#737373] clip-cyber-card">
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
                          className="group relative p-2 bg-[#0E0E1C] hover:bg-black/90 border border-[#25253D] hover:border-[#00F0FF] transition-all cursor-pointer flex items-center justify-between clip-cyber-card hover:translate-x-1"
                        >
                          <div className="flex items-center space-x-2 truncate flex-1 min-w-0 pr-6">
                            <div className="w-1.5 h-1.5 bg-[#00F0FF] rounded-full shrink-0 animate-pulse" />
                            <div className="truncate flex-1">
                              <div className="text-[11px] font-bold text-[#EDEDED] group-hover:text-[#00F0FF] truncate leading-tight">
                                {entry.title || 'Untitled Prompt'}
                              </div>
                              <div className="text-[9px] text-[#737373] flex items-center space-x-1.5 mt-0.5">
                                <span>{formatRelativeTime(entry.createdAt)}</span>
                                {entry.moodTags && entry.moodTags.length > 0 && (
                                  <span className="text-[#00F0FF]/80 truncate">
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
                              className="opacity-0 group-hover:opacity-100 p-1 text-[#737373] hover:text-rose-400 hover:bg-rose-950/60 border border-transparent hover:border-rose-600/40 clip-badge-poly transition-all cursor-pointer absolute right-1.5 top-1/2 -translate-y-1/2"
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
      <div className="p-3 border-t border-[#25253D] bg-[#07070F] space-y-2.5 clip-stealth-notch">
        
        {/* Sleek Triple Theme Selector Widget */}
        <ThemeSwitcher compact={false} showLabels={true} />

        {/* User Card */}
        <div
          onClick={onOpenProfile}
          className="p-2 bg-black/80 border border-[#25253D] hover:border-[#00F0FF] transition-all flex items-center justify-between cursor-pointer group clip-cyber-card"
          title="Open Profile Settings"
        >
          <div className="flex items-center space-x-2 truncate">
            <div className="w-6 h-6 bg-[#141424] border border-[#2D2D45] group-hover:border-[#00F0FF] flex items-center justify-center text-xs text-[#00F0FF] font-bold clip-badge-poly shadow-[0_0_8px_rgba(0,240,255,0.3)]">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="truncate">
              <div className="text-[11px] font-bold text-[#EDEDED] group-hover:text-[#00F0FF] truncate">
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
            className="p-1.5 text-[#737373] hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-600/40 clip-badge-poly transition-colors cursor-pointer"
            title="Log out session"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Developer Signature - Clickable for Technical Specs */}
        <div
          onClick={() => setShowDevModal(true)}
          className="px-2.5 py-1.5 bg-black/80 border border-[#222238] hover:border-[#00F0FF] transition-all cursor-pointer flex items-center justify-between group clip-badge-poly"
        >
          <div className="flex items-center space-x-1.5 text-[11px]">
            <span className="w-1.5 h-1.5 bg-[#00F0FF] rounded-full animate-ping" />
            <span className="text-[#737373] group-hover:text-[#EDEDED]">Dev:</span>
            <span className="font-bold text-[#00F0FF]">Som Maurya</span>
          </div>
          <span className="text-[9px] text-[#737373] group-hover:text-[#00F0FF]">
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
              className="w-full max-w-md bg-gradient-to-b from-[#0E0E1C] to-[#05050E] border border-[#00F0FF] shadow-[0_0_35px_rgba(0,240,255,0.3)] p-6 space-y-4 text-left font-mono clip-cyber-card"
            >
              <div className="flex items-center justify-between border-b border-[#25253D] pb-3">
                <div className="flex items-center space-x-2 text-[#00F0FF] text-xs font-bold">
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
                <div className="p-3 bg-black/80 border border-[#25253D] space-y-1 clip-badge-poly">
                  <div className="text-[#737373] text-[10px]">LEAD ENGINEER</div>
                  <div className="text-base font-bold text-[#EDEDED] font-display">Som Maurya</div>
                  <div className="text-[#00F0FF] text-[11px]">Data Science & Computational Thinking</div>
                </div>

                <div className="p-3 bg-black/80 border border-[#25253D] space-y-2 text-[11px] clip-badge-poly">
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
                    <span className="text-[#00F0FF]">Text, SVG, Canvas, 432Hz Synth</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737373]">THEMES:</span>
                    <span className="text-[#00F0FF]">Black (Night), White (Day), Mix (Eye-Care)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737373]">PERSISTENCE:</span>
                    <span className="text-[#EDEDED]">Google Cloud Firestore</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowDevModal(false)}
                className="w-full py-2.5 bg-[#00F0FF] text-black font-bold text-xs clip-badge-poly shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:bg-[#00D0DF] cursor-pointer"
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
