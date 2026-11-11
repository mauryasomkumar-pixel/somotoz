import React from 'react';

export const ChatListSkeleton: React.FC = () => {
  return (
    <div className="space-y-3 p-3 animate-pulse" aria-label="Loading conversations">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-elevated)]/60 border border-[var(--border-color)]/50"
        >
          <div className="w-12 h-12 rounded-full bg-[var(--border-color)]/60 shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-center justify-between">
              <div className="h-3.5 bg-[var(--border-color)] rounded w-28" />
              <div className="h-2.5 bg-[var(--border-color)]/50 rounded w-12" />
            </div>
            <div className="h-3 bg-[var(--border-color)]/40 rounded w-48" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const MessageListSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 p-4 animate-pulse" aria-label="Loading chat messages">
      <div className="flex justify-start">
        <div className="w-48 h-10 rounded-2xl rounded-bl-sm bg-[var(--bg-elevated)] border border-[var(--border-color)]/60" />
      </div>
      <div className="flex justify-end">
        <div className="w-64 h-14 rounded-2xl rounded-br-sm bg-[var(--accent-color)]/20 border border-[var(--accent-color)]/30" />
      </div>
      <div className="flex justify-start">
        <div className="w-56 h-12 rounded-2xl rounded-bl-sm bg-[var(--bg-elevated)] border border-[var(--border-color)]/60" />
      </div>
      <div className="flex justify-end">
        <div className="w-40 h-9 rounded-2xl rounded-br-sm bg-[var(--accent-color)]/20 border border-[var(--accent-color)]/30" />
      </div>
    </div>
  );
};

export const JournalListSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse" aria-label="Loading reflections">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-3 bg-[var(--border-color)]/60 rounded w-24" />
            <div className="h-3 bg-[var(--border-color)]/40 rounded w-16" />
          </div>
          <div className="h-4 bg-[var(--border-color)] rounded w-3/4" />
          <div className="space-y-1.5 pt-1">
            <div className="h-3 bg-[var(--border-color)]/40 rounded w-full" />
            <div className="h-3 bg-[var(--border-color)]/30 rounded w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const DiscoverListSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-pulse" aria-label="Loading discover directory">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center space-y-3"
        >
          <div className="w-16 h-16 rounded-full bg-[var(--border-color)] mx-auto" />
          <div className="h-3.5 bg-[var(--border-color)] rounded w-24 mx-auto" />
          <div className="h-3 bg-[var(--border-color)]/50 rounded w-32 mx-auto" />
          <div className="h-8 bg-[var(--border-color)]/30 rounded-xl w-full pt-1" />
        </div>
      ))}
    </div>
  );
};

export const AdminUsersSkeleton: React.FC = () => {
  return (
    <div className="space-y-2 p-2 animate-pulse" aria-label="Loading administrative list">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--border-color)]" />
            <div className="space-y-1.5">
              <div className="h-3 bg-[var(--border-color)] rounded w-32" />
              <div className="h-2.5 bg-[var(--border-color)]/50 rounded w-20" />
            </div>
          </div>
          <div className="h-7 w-20 bg-[var(--border-color)]/40 rounded-lg" />
        </div>
      ))}
    </div>
  );
};

export const ScreenLoadingFallback: React.FC<{ label?: string }> = ({ label = 'Loading screen...' }) => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-4 font-sans text-center">
      <div className="w-10 h-10 border-2 border-[var(--border-color)] border-t-[var(--accent-color)] rounded-full animate-spin" />
      <p className="text-xs font-semibold text-[var(--text-secondary)]">{label}</p>
    </div>
  );
};
