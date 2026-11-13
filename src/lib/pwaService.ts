import { registerSW } from 'virtual:pwa-register';

export interface PWAState {
  isRegistered: boolean;
  hasUpdate: boolean;
  updateSW: (reloadPage?: boolean) => Promise<void>;
}

const SW_CLEANUP_RELOAD_KEY = 'somotoz_sw_cleanup_reloaded_v2';
export const CACHE_RESET_NOTICE_KEY = 'somotoz_cache_reset_notice';

const ACTIVE_CACHE_PREFIXES = ['somotoz-v2', 'somotoz-pages-v2', 'workbox-precache-v2', 'google-fonts-cache', 'gstatic-fonts-cache'];

let updateSWFunction: ((reloadPage?: boolean) => Promise<void>) | null = null;

/**
 * Returns true in environments where a service worker must NOT be registered:
 * dev server, localhost, iframe embeds, or AI Studio *.run.app previews.
 */
export function isRestrictedSwEnvironment(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const hostname = window.location.hostname || '';
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
    const isRunApp = hostname.endsWith('.run.app');
    const isIframe = window.self !== window.top;
    const isDev = Boolean((import.meta as any).env?.DEV);
    return isDev || isLocalhost || isRunApp || isIframe;
  } catch {
    return true;
  }
}

/**
 * Unregister stale/conflicting service workers and delete obsolete caches.
 */
export async function cleanupOldServiceWorkersAndCaches(removeAll: boolean = false): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  let removedAnything = false;

  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        const scriptUrl =
          reg.active?.scriptURL ||
          reg.waiting?.scriptURL ||
          reg.installing?.scriptURL ||
          '';
        const isCurrentProdSw = !removeAll && scriptUrl.endsWith('/sw.js') && reg.scope === `${window.location.origin}/`;

        if (removeAll || !isCurrentProdSw) {
          const ok = await reg.unregister().catch(() => false);
          if (ok) removedAnything = true;
        }
      }
    } catch (err) {
      console.warn('[PWA] Service worker cleanup notice:', err);
    }
  }

  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        const keep = !removeAll && ACTIVE_CACHE_PREFIXES.some((prefix) => name.startsWith(prefix));
        if (!keep) {
          const ok = await caches.delete(name).catch(() => false);
          if (ok) removedAnything = true;
        }
      }
    } catch (err) {
      console.warn('[PWA] Cache cleanup notice:', err);
    }
  }

  return removedAnything;
}

/**
 * Unregisters all service workers, deletes all Cache Storage entries,
 * records a notice flag, and reloads cleanly.
 */
export async function resetAppCacheAndReload(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(CACHE_RESET_NOTICE_KEY, '1');
    if (window.location.search.includes('reset-sw')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('reset-sw');
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
  } catch {
    // Ignore storage/history errors
  }

  await cleanupOldServiceWorkersAndCaches(true);
  window.location.reload();
}

export function consumeCacheResetNotice(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const val = sessionStorage.getItem(CACHE_RESET_NOTICE_KEY);
    if (val === '1') {
      sessionStorage.removeItem(CACHE_RESET_NOTICE_KEY);
      return true;
    }
  } catch {
    // Ignore
  }
  return false;
}

/**
 * Register Service Worker for PWA asset caching ONLY in clean production environments.
 */
export async function initServiceWorker(options?: {
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
}): Promise<void> {
  if (typeof window === 'undefined') return;

  // Handle explicit ?reset-sw=1 escape hatch in any environment
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset-sw') === '1') {
      await resetAppCacheAndReload();
      return;
    }
  } catch {
    // Ignore URL parsing errors
  }

  const restricted = isRestrictedSwEnvironment();
  if (restricted) {
    // In dev, localhost, iframe, or *.run.app previews: remove any leftover SWs/caches and do not register
    await cleanupOldServiceWorkersAndCaches(true);
    return;
  }

  if (!('serviceWorker' in navigator)) {
    return;
  }

  // Clean up old/stale SWs (e.g. dev-sw.js, sw-custom.js-only, root firebase-messaging-sw.js)
  const hadStaleArtifacts = await cleanupOldServiceWorkersAndCaches(false);
  if (hadStaleArtifacts) {
    try {
      if (!sessionStorage.getItem(SW_CLEANUP_RELOAD_KEY)) {
        sessionStorage.setItem(SW_CLEANUP_RELOAD_KEY, '1');
        window.location.reload();
        return;
      }
    } catch {
      // Proceed even if sessionStorage is unavailable
    }
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
        console.log('[PWA] App shell cached for offline fallback.');
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

export async function triggerSwUpdate(): Promise<void> {
  if (updateSWFunction) {
    await updateSWFunction(true);
  }
}

/**
 * Trigger background sync message to Service Worker
 */
export async function notifyServiceWorkerSync(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || isRestrictedSwEnvironment()) return;

  try {
    const reg = await navigator.serviceWorker.ready;
    if (reg.active) {
      reg.active.postMessage({ type: 'TRIGGER_BACKGROUND_SYNC' });
    }
  } catch (e) {
    console.debug('[PWA] SW sync notification debug:', e);
  }
}
