import React from 'react';
import { Sparkles, Plus, LogOut, Menu, BookOpen, MessageSquare, Globe, Headphones, Terminal, Cpu } from 'lucide-react';
import { UserProfile, ViewMode } from '../types';

interface NavbarProps {
  user: UserProfile;
  entryCount: number;
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  onNewReflection: () => void;
  onLogout: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  entryCount,
  currentView,
  onSelectView,
  onNewReflection,
  onLogout,
  onToggleSidebar,
}) => {
  const isJournalActive = currentView === 'write' || currentView === 'view' || currentView === 'edit';

  return (
    <header className="sticky top-0 z-30 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800/90 px-3 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Hamburger & Brand */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => onSelectView('chat')}
            className="flex items-center space-x-2.5 select-none cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5 font-mono">
                Somotoz
                <span className="hidden sm:inline-block text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                  AI Engineer Suite
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="hidden md:flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onSelectView('chat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer font-mono ${
              currentView === 'chat'
                ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span>Multimodal Chat</span>
          </button>

          <button
            onClick={() => onSelectView('write')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer font-mono ${
              isJournalActive
                ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span>Journal ({entryCount})</span>
          </button>

          <button
            onClick={() => onSelectView('wisdom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer font-mono ${
              currentView === 'wisdom'
                ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>Wisdom Engine</span>
          </button>

          <button
            onClick={() => onSelectView('soundscapes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer font-mono ${
              currentView === 'soundscapes'
                ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Headphones className="w-3.5 h-3.5 text-amber-400" />
            <span>Neural Audio</span>
          </button>
        </nav>

        {/* Right: New Entry & Profile & Developer Credit */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Watermark badge */}
          <div className="hidden lg:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-cyan-500/20 text-[11px] font-mono text-cyan-300/80">
            <Terminal className="w-3 h-3 text-cyan-400" />
            <span>Dev by <strong className="text-cyan-200 font-semibold">Som Maurya</strong></span>
          </div>

          <button
            onClick={onNewReflection}
            className="px-3 sm:px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md shadow-cyan-500/20 flex items-center space-x-1.5 cursor-pointer font-mono"
            title="Write new reflection or log"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Entry</span>
            <span className="sm:hidden">New</span>
          </button>

          {/* User Profile & Logout */}
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full ring-2 ring-cyan-500/30 object-cover shadow-xs"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-cyan-950 text-cyan-300 flex items-center justify-center font-bold text-xs ring-1 ring-cyan-500/40 font-mono">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}

            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex md:hidden items-center justify-around gap-1 mt-2 pt-2 border-t border-slate-800 text-[11px] font-mono font-medium">
        <button
          onClick={() => onSelectView('chat')}
          className={`flex-1 py-1.5 text-center rounded-lg ${
            currentView === 'chat' ? 'bg-cyan-950/80 text-cyan-300 font-semibold border border-cyan-500/30' : 'text-slate-400'
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => onSelectView('write')}
          className={`flex-1 py-1.5 text-center rounded-lg ${
            isJournalActive ? 'bg-cyan-950/80 text-cyan-300 font-semibold border border-cyan-500/30' : 'text-slate-400'
          }`}
        >
          Journal
        </button>
        <button
          onClick={() => onSelectView('wisdom')}
          className={`flex-1 py-1.5 text-center rounded-lg ${
            currentView === 'wisdom' ? 'bg-cyan-950/80 text-cyan-300 font-semibold border border-cyan-500/30' : 'text-slate-400'
          }`}
        >
          Wisdom
        </button>
        <button
          onClick={() => onSelectView('soundscapes')}
          className={`flex-1 py-1.5 text-center rounded-lg ${
            currentView === 'soundscapes' ? 'bg-cyan-950/80 text-cyan-300 font-semibold border border-cyan-500/30' : 'text-slate-400'
          }`}
        >
          Audio
        </button>
      </div>
    </header>
  );
};


