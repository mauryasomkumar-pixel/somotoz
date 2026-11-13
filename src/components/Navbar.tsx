import React, { memo } from 'react';
import {
  ShieldCheck,
  User,
  LogOut,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { UserProfile, ViewMode } from '../types';
import { ThemeSwitcher } from './ThemeSwitcher';
import { checkIsAdmin } from '../lib/adminService';
import { OfflineModeIndicator } from './pwa/OfflineModeIndicator';

interface NavbarProps {
  user: UserProfile;
  entryCount: number;
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  onNewReflection: () => void;
  onLogout: () => void;
  onOpenProfile?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

function getViewLabel(view: ViewMode): string {
  switch (view) {
    case 'dashboard':
      return 'Home';
    case 'somochat':
      return 'Chats';
    case 'chat':
      return 'Ask AI';
    case 'write':
    case 'view':
    case 'edit':
      return 'Journal';
    case 'discover':
    case 'wisdom':
    case 'soundscapes':
      return 'Discover';
    case 'profile':
      return 'Profile';
    case 'admin':
      return 'Admin';
    default:
      return 'Home';
  }
}

export const Navbar: React.FC<NavbarProps> = memo(({
  user,
  currentView,
  onSelectView,
  onLogout,
  onOpenProfile,
}) => {
  const isAdmin = checkIsAdmin(user);
  const viewTitle = getViewLabel(currentView);

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-card)]/90 backdrop-blur-md border-b border-[var(--border-color)] px-3 sm:px-6 py-2.5 sm:py-3 transition-colors font-sans">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        
        {/* Left: Brand Logo & Section Title Breadcrumb */}
        <div className="flex items-center space-x-2 sm:space-x-3 select-none min-w-0">
          <button
            type="button"
            onClick={() => onSelectView('dashboard')}
            className="flex items-center space-x-2 cursor-pointer group shrink-0"
          >
            <div className="w-8 h-8 rounded-xl bg-[var(--accent-color)] text-black flex items-center justify-center font-bold text-sm shadow-sm group-hover:opacity-90 transition-opacity">
              S
            </div>
            <span className="font-bold text-base sm:text-lg tracking-tight text-[var(--text-primary)] whitespace-nowrap">
              Somotoz
            </span>
          </button>

          <ChevronRight className="w-4 h-4 text-[var(--text-muted)] hidden sm:block shrink-0" />

          <span className="text-xs sm:text-sm font-semibold text-[var(--text-secondary)] hidden sm:inline-block truncate">
            {viewTitle}
          </span>
        </div>

        {/* Right: Persistent Offline Mode Indicator, Theme Options, Admin Badge, and Profile Shortcut */}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-3 shrink-0">
          {/* Persistent Offline Mode Indicator (Navigator API) */}
          <OfflineModeIndicator />

          {/* Quick Theme Switcher */}
          <ThemeSwitcher compact={true} />

          {/* Admin Badge (if user has admin role) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => onSelectView('admin')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                currentView === 'admin'
                  ? 'bg-amber-500 text-black shadow-xs'
                  : 'bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 border border-amber-500/30'
              }`}
              title="Administrator Console"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          )}

          {/* User Profile Trigger */}
          <button
            type="button"
            onClick={onOpenProfile || (() => onSelectView('profile'))}
            className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] transition-colors cursor-pointer shrink-0"
            title="Open Profile"
            aria-label="User Profile"
          >
            <div className="w-7 h-7 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-center font-bold text-xs text-[var(--accent-color)]">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="text-xs font-semibold hidden md:inline truncate max-w-[120px]">
              {user.displayName || 'Account'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
});
