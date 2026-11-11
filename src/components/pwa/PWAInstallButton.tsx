import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'badge' | 'button' | 'settings';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'badge',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone app, hide button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'settings') {
      return (
        <button
          type="button"
          onClick={install}
          aria-label="Install Somotoz application on this device"
          className={`w-full p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--accent-color)] text-left transition-all cursor-pointer flex items-center justify-between min-h-[44px] ${className}`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-color)]/15 text-[var(--accent-color)] flex items-center justify-center shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--text-primary)]">Install PWA</p>
              <p className="text-[11px] text-[var(--text-secondary)]">Run as standalone app with offline speed</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-[var(--accent-color)] px-2.5 py-1 rounded-md bg-[var(--accent-color)]/10">
            Install
          </span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={install}
        aria-label="Install Somotoz app"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-color)] text-[var(--accent-text)] text-xs font-bold hover:opacity-90 transition-opacity shadow-sm cursor-pointer min-h-[44px] ${className}`}
      >
        <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow (WebKit beforeinstallprompt is not supported)
  if (isIOS) {
    return (
      <>
        {variant === 'settings' ? (
          <button
            type="button"
            onClick={() => setShowIOSGuide(true)}
            aria-label="Install Somotoz on iPhone or iPad"
            className={`w-full p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--accent-color)] text-left transition-all cursor-pointer flex items-center justify-between min-h-[44px] ${className}`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-color)]/15 text-[var(--accent-color)] flex items-center justify-center shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">Add to Home Screen</p>
                <p className="text-[11px] text-[var(--text-secondary)]">Install on iPhone or iPad via Safari</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-[var(--accent-color)] px-2.5 py-1 rounded-md bg-[var(--accent-color)]/10">
              Guide
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowIOSGuide(true)}
            aria-label="Install Somotoz on iPhone"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] text-xs font-medium transition cursor-pointer min-h-[44px] ${className}`}
          >
            <Download className="w-3.5 h-3.5 text-[var(--accent-color)] shrink-0" aria-hidden="true" />
            <span>Install on iOS</span>
          </button>
        )}

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
          >
            <div className="w-full max-w-sm rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-6 shadow-2xl text-[var(--text-primary)] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
                <h3 id="ios-install-title" className="text-sm font-bold text-[var(--text-primary)]">
                  Install on iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Close installation guide"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-[var(--text-secondary)] leading-relaxed">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-[var(--text-primary)]">Step 1:</strong>
                    <p className="mt-0.5">Tap the <strong>Share</strong> button in the Safari bottom toolbar.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-[var(--text-primary)]">Step 2:</strong>
                    <p className="mt-0.5">Scroll down and tap <strong>Add to Home Screen</strong>.</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-[var(--accent-color)] text-[var(--accent-text)] text-xs font-bold hover:opacity-90 transition min-h-[44px]"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
