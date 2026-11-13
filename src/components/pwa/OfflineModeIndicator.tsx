import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useTheme } from '../../context/ThemeContext';

interface OfflineModeIndicatorProps {
  className?: string;
}

export const OfflineModeIndicator: React.FC<OfflineModeIndicatorProps> = ({
  className = '',
}) => {
  const { isOnline, justReconnected } = useOnlineStatus();
  const { theme } = useTheme();
  const isLight = theme === 'white';
  const isMix = theme === 'mix';

  if (isOnline && !justReconnected) {
    return null;
  }

  if (isOnline && justReconnected) {
    const onlineStyles = isLight
      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
      : isMix
      ? 'bg-emerald-100/90 text-emerald-900 border-emerald-500/40'
      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';

    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Connection restored. Back online."
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${onlineStyles} ${className}`}
      >
        <Wifi className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Back Online</span>
      </div>
    );
  }

  const offlineStyles = isLight
    ? 'bg-amber-100 text-amber-950 border-amber-400'
    : isMix
    ? 'bg-amber-200/90 text-amber-950 border-amber-600/50'
    : 'bg-amber-500/20 text-amber-300 border-amber-500/50';

  return (
    <div
      role="status"
      aria-live="assertive"
      aria-label="Offline Mode: Internet connection lost"
      title="Offline Mode — Internet connection dropped. Using cached data until reconnected."
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${offlineStyles} ${className}`}
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>Offline Mode</span>
    </div>
  );
};
