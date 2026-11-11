import React from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const ReconnectingBanner: React.FC = () => {
  const { isOnline, justReconnected } = useOnlineStatus();

  if (isOnline && !justReconnected) {
    return null;
  }

  if (justReconnected) {
    return (
      <aside
        aria-live="polite"
        className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-600/90 text-white text-xs font-semibold shadow-lg backdrop-blur-md animate-fade-in safe-top"
      >
        <Wifi className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Connected &bull; Back online</span>
      </aside>
    );
  }

  return (
    <aside
      aria-live="assertive"
      className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2 rounded-full bg-amber-500 text-black text-xs font-bold shadow-xl backdrop-blur-md animate-pulse safe-top max-w-[92vw]"
    >
      <WifiOff className="w-4 h-4 shrink-0 text-black" aria-hidden="true" />
      <span className="truncate">Reconnecting &bull; Queuing changes locally</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        aria-label="Retry connection now"
        className="p-1 hover:bg-black/10 rounded-full cursor-pointer shrink-0"
      >
        <RefreshCw className="w-3.5 h-3.5 text-black" />
      </button>
    </aside>
  );
};
