import React from 'react';
import {
  MessageSquare,
  Sparkles,
  BookOpen,
  Compass,
  User,
  Home,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { ViewMode, UserProfile } from '../types';
import { checkIsAdmin } from '../lib/adminService';
import { PWAInstallButton } from './pwa/PWAInstallButton';

interface NavigationRailProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  user: UserProfile | null;
  onLogout?: () => void;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  currentView,
  onSelectView,
  user,
  onLogout,
}) => {
  const isAdmin = checkIsAdmin(user);

  // Normalize view to one of the 5 primary items or Home/Admin
  const isJournalActive =
    currentView === 'write' || currentView === 'view' || currentView === 'edit';
  const isHomeActive = currentView === 'dashboard';
  const isChatsActive = currentView === 'somochat';
  const isAskAIActive = currentView === 'chat';
  const isDiscoverActive =
    currentView === 'discover' || currentView === 'wisdom' || currentView === 'soundscapes';
  const isProfileActive = currentView === 'profile';
  const isAdminActive = currentView === 'admin';

  const navItems = [
    {
      id: 'somochat' as ViewMode,
      label: 'Chats',
      icon: MessageSquare,
      active: isChatsActive,
    },
    {
      id: 'chat' as ViewMode,
      label: 'Ask AI',
      icon: Sparkles,
      active: isAskAIActive,
    },
    {
      id: 'write' as ViewMode,
      label: 'Journal',
      icon: BookOpen,
      active: isJournalActive,
    },
    {
      id: 'discover' as ViewMode,
      label: 'Discover',
      icon: Compass,
      active: isDiscoverActive,
    },
    {
      id: 'profile' as ViewMode,
      label: 'Profile',
      icon: User,
      active: isProfileActive,
    },
  ];

  return (
    <>
      {/* =========================================================================
          1. LAPTOP & DESKTOP LEFT RAIL (hidden on mobile, visible on md and up)
         ========================================================================= */}
      <aside
        className="hidden md:flex flex-col items-center justify-between w-18 lg:w-20 shrink-0 bg-[var(--bg-card)] border-r border-[var(--border-color)] py-4 select-none z-30 transition-colors"
        aria-label="Main Navigation"
      >
        {/* Top: Home Brand Icon */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => onSelectView('dashboard')}
            title="Home"
            className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              isHomeActive
                ? 'bg-[var(--accent-color)] text-black shadow-md'
                : 'bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-color)]'
            }`}
          >
            <Home className="w-5 h-5" />
          </button>
          <span className="text-[10px] font-medium text-[var(--text-secondary)]">Home</span>
        </div>

        {/* Center: The 5 Core Nav Items */}
        <nav className="flex flex-col items-center gap-2 my-auto w-full px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`w-full py-2.5 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  item.active
                    ? 'bg-[var(--accent-color)]/15 text-[var(--accent-color)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                }`}
                title={item.label}
              >
                <Icon className={`w-5 h-5 ${item.active ? 'text-[var(--accent-color)]' : ''}`} />
                <span className="text-[11px] font-medium text-center leading-none">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Bottom: Admin Link (if admin) + Sign out */}
        <div className="flex flex-col items-center gap-2 pt-2 border-t border-[var(--border-color)] w-full px-2">
          {isAdmin && (
            <button
              type="button"
              onClick={() => onSelectView('admin')}
              title="Admin Console"
              className={`w-full py-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                isAdminActive
                  ? 'bg-amber-500/20 text-amber-500 font-bold'
                  : 'text-amber-500/80 hover:text-amber-500 hover:bg-[var(--bg-elevated)]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[9px] font-bold tracking-wider">ADMIN</span>
            </button>
          )}

          {/* PWA Install Button in desktop rail */}
          <div className="w-full flex justify-center py-1">
            <PWAInstallButton variant="button" className="!px-2 !py-2 !text-[11px]" />
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Sign Out"
              aria-label="Sign out of Somotoz"
              className="p-2.5 text-[var(--text-secondary)] hover:text-rose-400 rounded-xl hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center touch-target"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </aside>

      {/* =========================================================================
          2. MOBILE BOTTOM BAR (visible on mobile, hidden on md and up)
         ========================================================================= */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-card)]/95 backdrop-blur-lg border-t border-[var(--border-color)] px-2 pt-1 pb-[calc(0.6rem+env(safe-area-inset-bottom))] flex items-center justify-around select-none shadow-lg safe-nav-bottom"
        aria-label="Mobile Navigation"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onSelectView(item.id)}
              aria-label={item.label}
              className={`flex-1 min-h-[48px] py-1 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer touch-target ${
                item.active
                  ? 'text-[var(--accent-color)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div
                className={`p-1 rounded-full transition-transform ${
                  item.active ? 'scale-110 bg-[var(--accent-color)]/15' : ''
                }`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <span className="text-[10px] leading-none">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
