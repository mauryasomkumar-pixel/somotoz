import React, { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  BookOpen,
  ArrowRight,
  Clock,
  ChevronRight,
  Smile,
  Zap,
  Waves,
  Moon
} from 'lucide-react';
import { UserProfile, ViewMode, JournalEntry, UserActivityLog } from '../types';

interface DashboardProps {
  user: UserProfile;
  entries: JournalEntry[];
  activityLogs: UserActivityLog[];
  onNavigate: (view: ViewMode) => void;
  onNewReflection: () => void;
  onOpenProfile?: () => void;
}

const MOODS = [
  { id: 'peaceful', label: 'Peaceful', icon: '🌿' },
  { id: 'focused', label: 'Focused', icon: '⚡' },
  { id: 'inspired', label: 'Inspired', icon: '✨' },
  { id: 'calm', label: 'Calm', icon: '🌊' },
  { id: 'reflective', label: 'Reflective', icon: '🌙' },
];

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  const firstName = name.split(' ')[0] || 'friend';
  if (hour >= 5 && hour < 12) {
    return `Good morning, ${firstName}`;
  } else if (hour >= 12 && hour < 17) {
    return `Good afternoon, ${firstName}`;
  } else if (hour >= 17 && hour < 22) {
    return `Good evening, ${firstName}`;
  }
  return `Good night, ${firstName}`;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  entries = [],
  activityLogs = [],
  onNavigate,
  onNewReflection,
}) => {
  const userName = user.displayName || user.email?.split('@')[0] || 'there';
  const greeting = getGreeting(userName);
  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const [selectedMood, setSelectedMood] = useState<string>(() => {
    try {
      return localStorage.getItem('somotoz_today_mood') || 'peaceful';
    } catch {
      return 'peaceful';
    }
  });

  const handleSelectMood = (moodId: string) => {
    setSelectedMood(moodId);
    try {
      localStorage.setItem('somotoz_today_mood', moodId);
    } catch {}
  };

  // Combine recent entries and activities for "Your activity"
  const recentItems = entries.slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 md:pb-8 font-sans">
      {/* 1. GREETING */}
      <section className="space-y-1">
        <span className="text-xs font-semibold text-[var(--accent-color)] uppercase tracking-wider">
          {todayFormatted}
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
          {greeting}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
          Welcome to your space for messaging, creative generation, and mindful reflections.
        </p>
      </section>

      {/* 2. TODAY'S MOOD */}
      <section className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Today's Mood
          </h2>
          <span className="text-xs text-[var(--text-muted)]">How are you feeling right now?</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          {MOODS.map((mood) => {
            const isSelected = selectedMood === mood.id;
            return (
              <button
                key={mood.id}
                type="button"
                onClick={() => handleSelectMood(mood.id)}
                className={`py-3 px-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                  isSelected
                    ? 'bg-[var(--accent-color)]/15 border-[var(--accent-color)] text-[var(--text-primary)] font-semibold shadow-xs'
                    : 'bg-[var(--bg-elevated)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-color)]/40'
                }`}
              >
                <span className="text-2xl">{mood.icon}</span>
                <span className="text-xs">{mood.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. QUICK BUTTONS */}
      <section className="space-y-3">
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* New Chat */}
          <button
            type="button"
            onClick={() => onNavigate('somochat')}
            className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent-color)] hover:bg-[var(--bg-elevated)] shadow-sm text-left transition-all cursor-pointer group flex flex-col justify-between gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-500 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-color)] transition-colors">
                  New chat
                </h3>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Message people privately with mutual consent.
              </p>
            </div>
          </button>

          {/* Ask AI */}
          <button
            type="button"
            onClick={() => onNavigate('chat')}
            className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent-color)] hover:bg-[var(--bg-elevated)] shadow-sm text-left transition-all cursor-pointer group flex flex-col justify-between gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-color)] transition-colors">
                  Ask AI
                </h3>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Chat, create images, simulate video, and synthesize music.
              </p>
            </div>
          </button>

          {/* Write Journal */}
          <button
            type="button"
            onClick={() => onNewReflection()}
            className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent-color)] hover:bg-[var(--bg-elevated)] shadow-sm text-left transition-all cursor-pointer group flex flex-col justify-between gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-color)] transition-colors">
                  Write journal
                </h3>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Capture daily thoughts, insights, and reflections.
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* 4. RECENT ACTIVITY ("Your activity") */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Your activity
          </h2>
          {recentItems.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('write')}
              className="text-xs text-[var(--accent-color)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View all journal notes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentItems.length === 0 ? (
          /* Empty State: Friendly message and ONE button */
          <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-[var(--bg-elevated)] text-[var(--text-secondary)] flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">No recent activity yet</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
                Start a conversation, ask AI a question, or write down your thoughts to build your history.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('chat')}
              className="px-5 py-2.5 rounded-xl bg-[var(--accent-color)] text-black font-semibold text-xs hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask AI Something</span>
            </button>
          </div>
        ) : (
          /* Populated Activity List */
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] divide-y divide-[var(--border-color)] overflow-hidden shadow-sm">
            {recentItems.map((entry) => {
              const formattedDate = new Date(entry.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });
              return (
                <div
                  key={entry.id}
                  onClick={() => onNavigate('view')}
                  className="p-4 flex items-center justify-between hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer group"
                >
                  <div className="space-y-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-color)] transition-colors truncate">
                        {entry.title || 'Untitled Note'}
                      </span>
                      {entry.moodTags && entry.moodTags.length > 0 && (
                        <span className="text-[11px] text-[var(--text-secondary)] hidden sm:inline">
                          · {entry.moodTags.join(', ')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] truncate">
                      {entry.content.slice(0, 90)}...
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-[var(--text-muted)]">{formattedDate}</span>
                    <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
