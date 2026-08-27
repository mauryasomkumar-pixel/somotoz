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
    <header className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#262626] px-3 sm:px-6 py-2.5 transition-colors font-mono">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
        
        {/* Left: Hamburger & Brand */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 bg-black border border-[#262626] text-[#A1A1AA] hover:text-[#00FF41] hover:border-[#00FF41] transition-colors cursor-pointer"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div
            onClick={() => onSelectView('dashboard')}
            className="flex items-center space-x-2.5 select-none cursor-pointer group"
          >
            <div className="w-8 h-8 bg-black border border-[#00FF41] flex items-center justify-center text-[#00FF41] font-bold text-sm shadow-[2px_2px_0px_0px_#00FF41] group-hover:shadow-[3px_3px_0px_0px_#00FF41] transition-all">
              S_
            </div>
            <div>
              <span className="text-sm sm:text-base font-bold tracking-tight text-[#EDEDED] flex items-center gap-1.5 group-hover:text-[#00FF41] transition-colors">
                SOMOTOZ
                <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.2 bg-[#171717] text-[#00FF41] border border-[#262626]">
                  v2.5
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="hidden md:flex items-center bg-black p-1 border border-[#262626] text-xs">
          {/* Dashboard Tab */}
          <button
            onClick={() => onSelectView('dashboard')}
            className={`px-3 py-1.5 font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              currentView === 'dashboard'
                ? 'bg-[#00FF41] text-black shadow-[2px_2px_0px_0px_#171717]'
                : 'text-[#A1A1AA] hover:text-[#EDEDED] hover:bg-[#121212]'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>DASHBOARD</span>
          </button>

          {/* Multimodal Chat Tab */}
          <button
            onClick={() => onSelectView('chat')}
            className={`px-3 py-1.5 font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              currentView === 'chat'
                ? 'bg-[#00FF41] text-black shadow-[2px_2px_0px_0px_#171717]'
                : 'text-[#A1A1AA] hover:text-[#EDEDED] hover:bg-[#121212]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>

          {/* Journal Tab */}
          <button
            onClick={() => onSelectView('write')}
            className={`px-3 py-1.5 font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              isJournalActive
                ? 'bg-[#00FF41] text-black shadow-[2px_2px_0px_0px_#171717]'
                : 'text-[#A1A1AA] hover:text-[#EDEDED] hover:bg-[#121212]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>JOURNAL ({entryCount})</span>
          </button>

          {/* Wisdom Engine */}
          <button
            onClick={() => onSelectView('wisdom')}
            className={`px-3 py-1.5 font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              currentView === 'wisdom'
                ? 'bg-[#00FF41] text-black shadow-[2px_2px_0px_0px_#171717]'
                : 'text-[#A1A1AA] hover:text-[#EDEDED] hover:bg-[#121212]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>WISDOM</span>
          </button>

          {/* Soundscapes / Music Generator */}
          <button
            onClick={() => onSelectView('soundscapes')}
            className={`px-3 py-1.5 font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              currentView === 'soundscapes'
                ? 'bg-[#00FF41] text-black shadow-[2px_2px_0px_0px_#171717]'
                : 'text-[#A1A1AA] hover:text-[#EDEDED] hover:bg-[#121212]'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Music Generator</span>
          </button>
        </nav>

        {/* Right: Theme Switcher & New Entry & Interactive Profile & Logout */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Quick Header Theme Switcher */}
          <div className="hidden sm:block">
            <ThemeSwitcher compact={true} showLabels={false} />
          </div>

          {/* Watermark badge */}
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 bg-black border border-[#262626] text-[11px] text-[#737373]">
            <span className="w-1.5 h-1.5 bg-[#00FF41] animate-pulse" />
            <span>Dev: <strong className="text-[#EDEDED]">Som Maurya</strong></span>
          </div>

          <button
            onClick={onNewReflection}
            className="px-3 sm:px-3.5 py-2 bg-[#00FF41] hover:bg-[#00E038] text-black font-bold text-xs tracking-wider border border-[#00FF41] shadow-[2px_2px_0px_0px_#262626] hover:shadow-[3px_3px_0px_0px_#00FF41] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Write new reflection or log"
          >
            <Plus className="w-3.5 h-3.5 text-black" />
            <span className="hidden sm:inline">NEW PROMPT</span>
            <span className="sm:hidden">NEW</span>
          </button>

          {/* Interactive User Profile Trigger Button */}
          <div className="flex items-center space-x-2 pl-2 border-l border-[#262626]">
            <button
              onClick={onOpenProfile}
              className="group flex items-center space-x-2 px-2.5 py-1.5 bg-black hover:bg-[#00FF41]/10 border border-[#262626] hover:border-[#00FF41] text-[#EDEDED] hover:text-[#00FF41] shadow-[2px_2px_0px_0px_#171717] hover:shadow-[0_0_12px_rgba(0,255,65,0.35)] transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
              title="Open Profile Settings"
              aria-label="Open User Profile & Settings"
            >
              <div className="w-6 h-6 bg-[#141414] border border-[#00FF41]/60 group-hover:border-[#00FF41] group-hover:bg-[#00FF41] group-hover:text-black flex items-center justify-center font-bold text-xs text-[#00FF41] transition-all">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:flex flex-col text-left font-mono leading-tight">
                <span className="text-xs font-bold text-[#EDEDED] group-hover:text-[#00FF41] truncate max-w-[110px]">
                  {user.displayName || 'Som Maurya'}
                </span>
                <span className="text-[9px] text-[#737373] group-hover:text-[#00FF41] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#00FF41] inline-block" /> SETTINGS
                </span>
              </div>
            </button>

            <button
              onClick={onLogout}
              className="p-2 text-[#737373] hover:text-rose-400 hover:bg-rose-950/40 border border-[#262626] hover:border-rose-600/40 transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex md:hidden items-center justify-around gap-1 mt-2 pt-2 border-t border-[#262626] text-[10px] font-mono font-bold">
        <button
          onClick={() => onSelectView('dashboard')}
          className={`flex-1 py-1.5 text-center border ${
            currentView === 'dashboard' ? 'bg-[#00FF41] text-black border-[#00FF41]' : 'bg-black text-[#A1A1AA] border-[#262626]'
          }`}
        >
          DASH
        </button>
        <button
          onClick={() => onSelectView('chat')}
          className={`flex-1 py-1.5 text-center border ${
            currentView === 'chat' ? 'bg-[#00FF41] text-black border-[#00FF41]' : 'bg-black text-[#A1A1AA] border-[#262626]'
          }`}
        >
          CHAT
        </button>
        <button
          onClick={() => onSelectView('write')}
          className={`flex-1 py-1.5 text-center border ${
            isJournalActive ? 'bg-[#00FF41] text-black border-[#00FF41]' : 'bg-black text-[#A1A1AA] border-[#262626]'
          }`}
        >
          LOGS ({entryCount})
        </button>
        <button
          onClick={() => onSelectView('wisdom')}
          className={`flex-1 py-1.5 text-center border ${
            currentView === 'wisdom' ? 'bg-[#00FF41] text-black border-[#00FF41]' : 'bg-black text-[#A1A1AA] border-[#262626]'
          }`}
        >
          WISDOM
        </button>
        <button
          onClick={() => onSelectView('soundscapes')}
          className={`flex-1 py-1.5 text-center border ${
            currentView === 'soundscapes' ? 'bg-[#00FF41] text-black border-[#00FF41]' : 'bg-black text-[#A1A1AA] border-[#262626]'
          }`}
        >
          MUSIC
        </button>
      </div>
    </header>
  );
});
