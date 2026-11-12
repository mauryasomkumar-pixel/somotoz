import { registerSW } from 'virtual:pwa-register';

export interface PWAState {
  isRegistered: boolean;
  hasUpdate: boolean;
  updateSW: (reloadPage?: boolean) => Promise<void>;
}

let updateSWFunction: ((reloadPage?: boolean) => Promise<void>) | null = null;

/**
 * Register Service Worker for PWA asset caching & background sync
 */
export function initServiceWorker(options?: {
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
}): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    updateSWFunction = registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log('[PWA] Service worker update available.');
        if (options?.onNeedRefresh) {
          options.onNeedRefresh();
        }
      },
      onOfflineReady() {
        console.log('[PWA] App shell and assets cached. Ready for offline use.');
        if (options?.onOfflineReady) {
          options.onOfflineReady();
        }
      },
      onRegisterError(error) {
        console.warn('[PWA] Service worker registration notice:', error);
      },
    });
  } catch (err) {
    console.warn('[PWA] Could not initialize service worker:', err);
  }
}

/**
 * Trigger background sync message to Service Worker
 */
export async function notifyServiceWorkerSync(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  try {
    const reg = await navigator.serviceWorker.ready;
    if (reg.active) {
      reg.active.postMessage({ type: 'TRIGGER_BACKGROUND_SYNC' });
    }
  } catch (e) {
    console.debug('[PWA] SW sync notification debug:', e);
  }
}
