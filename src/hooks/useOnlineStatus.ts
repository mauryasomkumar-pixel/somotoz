import { useEffect, useState } from 'react';

interface OnlineStatusSnapshot {
  isOnline: boolean;
  justReconnected: boolean;
  offlineSince: number | null;
}

const HEALTH_ENDPOINT = '/api/health';
const HEALTH_TIMEOUT_MS = 4000;
const POLL_INTERVAL_MS = 30000;
const RETRY_DELAY_MS = 3000;
const REQUIRED_FAILURES = 2;

export function isRestrictedNetworkEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const hostname = window.location.hostname || '';
    const isIframe = window.self !== window.top;
    const isPreviewDomain = hostname.endsWith('.run.app');
    const isDev = Boolean((import.meta as any).env?.DEV);
    return isDev || isIframe || isPreviewDomain;
  } catch {
    // Cross-origin iframe access error means we are inside an iframe
    return true;
  }
}

let state: OnlineStatusSnapshot = {
  isOnline: true,
  justReconnected: false,
  offlineSince: null,
};

let consecutiveFailures = 0;
let isChecking = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectBannerTimer: ReturnType<typeof setTimeout> | null = null;
let listenersAttached = false;
const subscribers = new Set<(snapshot: OnlineStatusSnapshot) => void>();

function notifySubscribers() {
  const snapshot = { ...state };
  subscribers.forEach((cb) => cb(snapshot));
}

function clearTimers() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
}

function setOnlineState() {
  consecutiveFailures = 0;
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  const wasOffline = !state.isOnline;
  if (wasOffline) {
    if (reconnectBannerTimer) {
      clearTimeout(reconnectBannerTimer);
    }
    state = {
      isOnline: true,
      justReconnected: true,
      offlineSince: null,
    };
    reconnectBannerTimer = setTimeout(() => {
      state = { ...state, justReconnected: false };
      notifySubscribers();
    }, 4000);
    notifySubscribers();
  } else if (state.offlineSince !== null) {
    state = { ...state, offlineSince: null };
    notifySubscribers();
  }
}

function setOfflineState() {
  if (reconnectBannerTimer) {
    clearTimeout(reconnectBannerTimer);
    reconnectBannerTimer = null;
  }
  if (state.isOnline || state.justReconnected) {
    state = {
      isOnline: false,
      justReconnected: false,
      offlineSince: state.offlineSince ?? Date.now(),
    };
    notifySubscribers();
  }
}

async function pingHealthEndpoint(): Promise<boolean> {
  if (typeof fetch === 'undefined') return true;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

  try {
    const res = await fetch(HEALTH_ENDPOINT, {
      method: 'GET',
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
      signal: controller.signal,
    });
    if (!res.ok) return false;
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('application/json')) return false;
    const data = await res.json();
    return Boolean(data && data.ok === true);
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function verifyConnectivityNow(): Promise<boolean> {
  if (typeof window === 'undefined') return true;
  if (isChecking) return state.isOnline;

  const restricted = isRestrictedNetworkEnvironment();
  const navOffline = typeof navigator !== 'undefined' && navigator.onLine === false;

  isChecking = true;
  try {
    const ok = await pingHealthEndpoint();
    if (ok) {
      setOnlineState();
      return true;
    }

    // In restricted environment (AI Studio preview iframe), only mark offline if BOTH navigator.onLine === false AND /api/health failed
    if (restricted && !navOffline) {
      consecutiveFailures = 0;
      setOnlineState();
      return true;
    }

    // If navigator already reports offline and /api/health failed, mark offline immediately
    if (navOffline) {
      consecutiveFailures = REQUIRED_FAILURES;
      setOfflineState();
      return false;
    }

    consecutiveFailures += 1;
    if (consecutiveFailures >= REQUIRED_FAILURES) {
      setOfflineState();
      return false;
    }

    // Schedule confirmation check ~3 seconds later
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = setTimeout(() => {
      verifyConnectivityNow();
    }, RETRY_DELAY_MS);

    return state.isOnline;
  } finally {
    isChecking = false;
  }
}

function startPolling() {
  if (typeof document !== 'undefined' && document.hidden) return;
  if (!pollTimer) {
    pollTimer = setInterval(() => {
      if (typeof document === 'undefined' || !document.hidden) {
        verifyConnectivityNow();
      }
    }, POLL_INTERVAL_MS);
  }
}

function handleOnlineEvent() {
  verifyConnectivityNow();
}

function handleOfflineEvent() {
  verifyConnectivityNow();
}

function handleVisibilityChange() {
  if (typeof document === 'undefined') return;
  if (document.hidden) {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  } else {
    startPolling();
    verifyConnectivityNow();
  }
}

function handleFocusEvent() {
  verifyConnectivityNow();
}

function attachGlobalListeners() {
  if (listenersAttached || typeof window === 'undefined') return;
  listenersAttached = true;

  window.addEventListener('online', handleOnlineEvent);
  window.addEventListener('offline', handleOfflineEvent);
  window.addEventListener('focus', handleFocusEvent);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  startPolling();
  verifyConnectivityNow();
}

function detachGlobalListenersIfUnused() {
  if (subscribers.size > 0 || !listenersAttached || typeof window === 'undefined') return;
  listenersAttached = false;

  window.removeEventListener('online', handleOnlineEvent);
  window.removeEventListener('offline', handleOfflineEvent);
  window.removeEventListener('focus', handleFocusEvent);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  clearTimers();
}

export function useOnlineStatus() {
  const [snapshot, setSnapshot] = useState<OnlineStatusSnapshot>(() => ({ ...state }));

  useEffect(() => {
    subscribers.add(setSnapshot);
    attachGlobalListeners();
    setSnapshot({ ...state });

    return () => {
      subscribers.delete(setSnapshot);
      detachGlobalListenersIfUnused();
    };
  }, []);

  return {
    isOnline: snapshot.isOnline,
    justReconnected: snapshot.justReconnected,
    offlineSince: snapshot.offlineSince,
    recheckNow: verifyConnectivityNow,
  };
}
