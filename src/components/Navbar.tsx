import React, { memo } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Globe,
  Headphones,
  Plus,
  Terminal,
  LogOut,
  Menu,
  Cpu
} from 'lucide-react';
import { UserProfile, ViewMode, GenerationMode } from '../types';
import { ThemeSwitcher } from './ThemeSwitcher';

interface NavbarProps {
  user: UserProfile;
  entryCount: number;
  currentView: ViewMode;
  onSelectView: (view: ViewMode, chatMode?: GenerationMode) => void;
  onNewReflection: () => void;
  onLogout: () => void;
  onOpenProfile?: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = memo(({
  user,
  entryCount,
  currentView,
  onSelectView,
  onNewReflection,
  onLogout,
  onOpenProfile,
  onToggleSidebar,
}) => {
  const isJournalActive = currentView === 'write' || currentView === 'view' || currentView === 'edit';

  return (
    <header className="sticky top-0 z-30 bg-[#070712]/95 backdrop-blur-md border-b border-[#25253D] px-3 sm:px-6 py-2.5 transition-colors font-mono clip-stealth-notch">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
        
        {/* Left: Hamburger & Brand */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 bg-black/80 border border-[#25253D] text-[#A1A1AA] hover:text-[#00F0FF] hover:border-[#00F0FF] clip-badge-poly transition-colors cursor-pointer"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div
            onClick={() => onSelectView('dashboard')}
            className="flex items-center space-x-2.5 select-none cursor-pointer group"
          >
            <div className="w-8 h-8 bg-black/90 border border-[#00F0FF] flex items-center justify-center text-[#00F0FF] font-bold text-sm clip-badge-poly shadow-[0_0_10px_rgba(0,240,255,0.4)] group-hover:shadow-[0_0_16px_rgba(0,240,255,0.6)] transition-all">
              S_
            </div>
            <div>
              <span className="text-sm sm:text-base font-bold tracking-tight text-[#EDEDED] flex items-center gap-1.5 group-hover:text-[#00F0FF] transition-colors">
                SOMOTOZ
                <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.2 bg-black/80 text-[#00F0FF] border border-[#00F0FF]/40 clip-badge-poly">
                  v2.5
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Navigation Tabs with Polygon Geometry */}
        <nav className="hidden md:flex items-center bg-black/80 p-1 border border-[#25253D] clip-cyber-card text-xs">
          {/* Dashboard Tab */}
          <button
            onClick={() => onSelectView('dashboard')}
            className={`px-3 py-1.5 font-bold flex items-center space-x-1.5 clip-badge-poly transition-all cursor-pointer ${
              currentView === 'dashboard'
                ? 'bg-[#00F0FF] text-black shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                : 'text-[#A1A1AA] hover:text-[#EDEDED] hover:bg-[#151528]'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>DASHBOARD</span>
          </button>

          {/* Multimodal Chat Tab */}
          <button
            onClick={() => onSelectView('chat')}
            className={`px-3 py-1.5 font-bold flex items-center space-x-1.5 clip-badge-poly transition-all cursor-pointer ${
              currentView === 'chat'
                ? 'bg-[#A855F7] text-black shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                : 'text-[#A1A1AA] hover:text-[#EDEDED] hover:bg-[#151528]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>CHAT</span>
          </button>

          {/* Journal Tab */}
          <button
            onClick={() => onSelectView('write')}
            className={`px-3 py-1.5 font-bold flex items-center space-x-1.5 clip-badge-poly transition-all cursor-pointer ${
              isJournalActive
                ? 'bg-[#00F0FF] text-black shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                : 'text-[#A1A1AA] hover:text-[#EDEDED] hover:bg-[#151528]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>JOURNAL ({entryCount})</span>
          </button>

          {/* Wisdom Engine */}
          <button
            onClick={() => onSelectView('wisdom')}
            className={`px-3 py-1.5 font-bold flex items-center space-x-1.5 clip-badge-poly transition-all cursor-pointer ${
              currentView === 'wisdom'
                ? 'bg-[#FF007A] text-white shadow-[0_0_12px_rgba(255,0,122,0.4)]'
                : 'text-[#A1A1AA] hover:text-[#EDEDED] hover:bg-[#151528]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>WISDOM</span>
          </button>

          {/* Soundscapes / Music Generator */}
          <button
            onClick={() => onSelectView('soundscapes')}
            className={`px-3 py-1.5 font-bold flex items-center space-x-1.5 clip-badge-poly transition-all cursor-pointer ${
              currentView === 'soundscapes'
                ? 'bg-[#FFB800] text-black shadow-[0_0_12px_rgba(255,184,0,0.4)]'
                : 'text-[#A1A1AA] hover:text-[#EDEDED] hover:bg-[#151528]'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>MUSIC</span>
          </button>
        </nav>

        {/* Right: Theme Switcher & New Entry & Interactive Profile & Logout */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Quick Header Theme Switcher */}
          <div className="hidden sm:block">
            <ThemeSwitcher compact={true} showLabels={false} />
          </div>

          {/* Watermark badge */}
          <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 bg-black/80 border border-[#25253D] text-[11px] text-[#A1A1AA] clip-badge-poly">
            <span className="w-1.5 h-1.5 bg-[#00F0FF] rounded-full animate-ping" />
            <span>Architect: <strong className="text-[#00F0FF]">Som Maurya</strong></span>
            <span className="opacity-40">|</span>
            <span className="text-[10px] font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#A855F7] to-[#FF007A]">
              IIT Madras DS &amp; CT
            </span>
          </div>

          <button
            onClick={onNewReflection}
            className="px-3 sm:px-3.5 py-2 bg-gradient-to-r from-[#00F0FF] to-[#A855F7] hover:brightness-110 text-black font-bold text-xs tracking-wider border border-[#00F0FF] clip-badge-poly shadow-[0_0_14px_rgba(0,240,255,0.4)] active:scale-95 transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Write new reflection or log"
          >
            <Plus className="w-3.5 h-3.5 text-black" />
            <span className="hidden sm:inline">NEW PROMPT</span>
            <span className="sm:hidden">NEW</span>
          </button>

          {/* Interactive User Profile Trigger Button */}
          <div className="flex items-center space-x-2 pl-2 border-l border-[#25253D]">
            <button
              onClick={onOpenProfile}
              className="group flex items-center space-x-2 px-2.5 py-1.5 bg-black/80 hover:bg-[#00F0FF]/10 border border-[#25253D] hover:border-[#00F0FF] text-[#EDEDED] hover:text-[#00F0FF] clip-badge-poly shadow-[0_0_10px_rgba(0,240,255,0.2)] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all cursor-pointer active:scale-95"
              title="Open Profile Settings"
              aria-label="Open User Profile & Settings"
            >
              <div className="w-6 h-6 bg-[#141424] border border-[#00F0FF]/60 group-hover:border-[#00F0FF] group-hover:bg-[#00F0FF] group-hover:text-black flex items-center justify-center font-bold text-xs text-[#00F0FF] clip-badge-poly transition-all">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:flex flex-col text-left font-mono leading-tight">
                <span className="text-xs font-bold text-[#EDEDED] group-hover:text-[#00F0FF] truncate max-w-[110px]">
                  {user.displayName || 'Som Maurya'}
                </span>
                <span className="text-[9px] text-[#737373] group-hover:text-[#00F0FF] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#00F0FF] inline-block" /> SETTINGS
                </span>
              </div>
            </button>

            <button
              onClick={onLogout}
              className="p-2 text-[#737373] hover:text-rose-400 hover:bg-rose-950/40 border border-[#25253D] hover:border-rose-600/40 clip-badge-poly transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex md:hidden items-center justify-around gap-1 mt-2 pt-2 border-t border-[#25253D] text-[10px] font-mono font-bold">
        <button
          onClick={() => onSelectView('dashboard')}
          className={`flex-1 py-1.5 text-center border clip-badge-poly ${
            currentView === 'dashboard' ? 'bg-[#00F0FF] text-black border-[#00F0FF]' : 'bg-black text-[#A1A1AA] border-[#25253D]'
          }`}
        >
          DASH
        </button>
        <button
          onClick={() => onSelectView('chat')}
          className={`flex-1 py-1.5 text-center border clip-badge-poly ${
            currentView === 'chat' ? 'bg-[#A855F7] text-black border-[#A855F7]' : 'bg-black text-[#A1A1AA] border-[#25253D]'
          }`}
        >
          CHAT
        </button>
        <button
          onClick={() => onSelectView('write')}
          className={`flex-1 py-1.5 text-center border clip-badge-poly ${
            isJournalActive ? 'bg-[#00F0FF] text-black border-[#00F0FF]' : 'bg-black text-[#A1A1AA] border-[#25253D]'
          }`}
        >
          LOGS ({entryCount})
        </button>
        <button
          onClick={() => onSelectView('wisdom')}
          className={`flex-1 py-1.5 text-center border clip-badge-poly ${
            currentView === 'wisdom' ? 'bg-[#FF007A] text-white border-[#FF007A]' : 'bg-black text-[#A1A1AA] border-[#25253D]'
          }`}
        >
          WISDOM
        </button>
        <button
          onClick={() => onSelectView('soundscapes')}
          className={`flex-1 py-1.5 text-center border clip-badge-poly ${
            currentView === 'soundscapes' ? 'bg-[#FFB800] text-black border-[#FFB800]' : 'bg-black text-[#A1A1AA] border-[#25253D]'
          }`}
        >
          MUSIC
        </button>
      </div>
    </header>
  );
});
