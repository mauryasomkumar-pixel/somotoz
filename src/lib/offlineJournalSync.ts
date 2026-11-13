import { JournalEntry, AIReflectionResponse } from '../types';
import { db, auth, cleanForFirestore } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { verifyConnectivityNow } from '../hooks/useOnlineStatus';

const DB_NAME = 'somotoz_offline_journal_db';
const DB_VERSION = 1;
const STORE_ENTRIES = 'cached_entries';
const STORE_QUEUE = 'offline_queue';

export interface OfflineQueueItem {
  id: string; // queue item ID
  entryId: string;
  userId: string;
  userEmail?: string;
  action: 'create' | 'update';
  entry: JournalEntry;
  createdAt: number;
  retryCount: number;
  lastAttemptAt?: number;
  errorMessage?: string;
}

/**
 * Initialize / open IndexedDB database for offline journal entries & background sync queue
 */
function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this browser environment.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Object store for all cached entries (mirror of cloud entries + offline entries)
      if (!db.objectStoreNames.contains(STORE_ENTRIES)) {
        const entryStore = db.createObjectStore(STORE_ENTRIES, { keyPath: 'id' });
        entryStore.createIndex('userId', 'userId', { unique: false });
        entryStore.createIndex('createdAt', 'createdAt', { unique: false });
        entryStore.createIndex('syncStatus', 'syncStatus', { unique: false });
      }

      // Object store for pending offline writes waiting to sync
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        const queueStore = db.createObjectStore(STORE_QUEUE, { keyPath: 'id' });
        queueStore.createIndex('userId', 'userId', { unique: false });
        queueStore.createIndex('entryId', 'entryId', { unique: false });
        queueStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Intelligent Procedural Reflection Generator for offline notes
 * Gives the user instant empathy, title, mood tags, and takeaways even with zero internet
 */
export function generateOfflineReflection(
  content: string,
  customTitle?: string,
  promptType?: string
): { finalTitle: string; aiPayload: AIReflectionResponse; moodTags: string[] } {
  const text = content.toLowerCase();
  const words = content.trim().split(/\s+/);
  const wordCount = words.length;

  // Determine smart title
  let finalTitle = customTitle;
  if (!finalTitle) {
    if (promptType === 'gratitude' || text.includes('grateful') || text.includes('thank')) {
      finalTitle = 'Moments of Gratitude & Peace';
    } else if (promptType === 'unpacking' || text.includes('stress') || text.includes('problem')) {
      finalTitle = 'Navigating Challenges with Focus';
    } else if (promptType === 'breakthrough' || text.includes('learned') || text.includes('realized')) {
      finalTitle = 'Key Breakthrough & Growth';
    } else {
      const snippet = words.slice(0, 4).join(' ');
      finalTitle = snippet.length > 3 ? `${snippet.charAt(0).toUpperCase() + snippet.slice(1)}...` : 'Mindful Reflection';
    }
  }

  // Derive contextual mood tags based on text sentiment keywords
  const moodTags: string[] = [];
  if (text.includes('stress') || text.includes('tired') || text.includes('heavy') || text.includes('anxious')) {
    moodTags.push('#unburdening', '#mindful-reset');
  } else if (text.includes('happy') || text.includes('excited') || text.includes('grateful') || text.includes('love')) {
    moodTags.push('#gratitude', '#joy');
  } else if (text.includes('work') || text.includes('goal') || text.includes('code') || text.includes('project')) {
    moodTags.push('#momentum', '#focus');
  } else if (text.includes('calm') || text.includes('peace') || text.includes('walk') || text.includes('breathe')) {
    moodTags.push('#clarity', '#grounded');
  } else {
    moodTags.push('#reflective', '#self-discovery');
  }
  moodTags.push('#somotoz');

  // Grounding actionable takeaways
  const actionableTakeaways: string[] = [
    'Take three slow, measured breaths to anchor the thoughts you just penned.',
    wordCount > 50
      ? 'Identify one micro-step you can execute in the next hour to move forward calmly.'
      : 'Revisit this thought when you reconnect to see deeper AI companion insights.',
  ];

  const aiPayload: AIReflectionResponse = {
    title: finalTitle,
    conversationalReply:
      'Saved securely to your offline vault. Even without an internet connection, pausing to capture what is on your mind brings immediate mental clarity. This reflection is safely stored on your device and will synchronize to your Somotoz cloud vault as soon as you are back online.',
    moodTags,
    actionableTakeaways,
  };

  return { finalTitle, aiPayload, moodTags };
}

/**
 * Save or update a journal entry locally while offline, queuing it for cloud sync
 */
export async function saveOfflineJournalEntry(params: {
  userId: string;
  userEmail?: string | null;
  content: string;
  customTitle?: string;
  promptType?: string;
  isEditing?: boolean;
  existingEntryId?: string;
}): Promise<JournalEntry> {
  const { userId, userEmail, content, customTitle, promptType, isEditing, existingEntryId } = params;
  const dbInstance = await openOfflineDB();

  const now = Date.now();
  const entryId = isEditing && existingEntryId ? existingEntryId : `entry_offline_${now}_${Math.random().toString(36).substring(2, 7)}`;
  const wordCount = content.trim().split(/\s+/).length;

  const { finalTitle, aiPayload, moodTags } = generateOfflineReflection(content, customTitle, promptType);

  const entry: JournalEntry = {
    id: entryId,
    userId,
    title: finalTitle,
    content,
    aiResponse: aiPayload,
    moodTags,
    createdAt: now,
    updatedAt: now,
    wordCount,
    isFavorite: false,
    isOfflinePending: true,
    syncStatus: 'pending',
  };

  // 1. Store in cached_entries
  await new Promise<void>((resolve, reject) => {
    const tx = dbInstance.transaction(STORE_ENTRIES, 'readwrite');
    const store = tx.objectStore(STORE_ENTRIES);
    const req = store.put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  // 2. Add or update in offline_queue
  const queueItem: OfflineQueueItem = {
    id: `queue_${entryId}`,
    entryId,
    userId,
    userEmail: userEmail || undefined,
    action: isEditing ? 'update' : 'create',
    entry,
    createdAt: now,
    retryCount: 0,
  };

  await new Promise<void>((resolve, reject) => {
    const tx = dbInstance.transaction(STORE_QUEUE, 'readwrite');
    const store = tx.objectStore(STORE_QUEUE);
    const req = store.put(queueItem);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  // 3. Dispatch local event for instant UI feedback
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('somotoz:offline-entry-saved', {
        detail: { entry, queueItem },
      })
    );
    window.dispatchEvent(new CustomEvent('somotoz:offline-queue-changed'));
  }

  // 4. Request Service Worker Background Sync (if supported by browser)
  requestServiceWorkerBackgroundSync();

  return entry;
}

/**
 * Register Background Sync with Service Worker
 */
export async function requestServiceWorkerBackgroundSync(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    if ('sync' in registration) {
      // Chromium background sync API
      await (registration as any).sync.register('sync-journal-entries');
    } else if (registration.active) {
      // Standard postMessage fallback
      registration.active.postMessage({ type: 'TRIGGER_BACKGROUND_SYNC' });
    }
  } catch (err) {
    // Graceful fallback for browsers without background sync permission
    console.debug('[OfflineSync] SW sync registration notice:', err);
  }
}

/**
 * Get all cached journal entries from IndexedDB for this user (sorted desc by createdAt)
 */
export async function getCachedJournalEntries(userId: string): Promise<JournalEntry[]> {
  try {
    const dbInstance = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = dbInstance.transaction(STORE_ENTRIES, 'readonly');
      const store = tx.objectStore(STORE_ENTRIES);
      const req = store.getAll();

      req.onsuccess = () => {
        const all: JournalEntry[] = req.result || [];
        const userEntries = all
          .filter((e) => e.userId === userId)
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        resolve(userEntries);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineSync] Failed to read cached entries:', err);
    return [];
  }
}

/**
 * Cache incoming server entries from Firestore into IndexedDB,
 * preserving any locally un-synced offline entries at the top
 */
export async function cacheServerJournalEntries(userId: string, serverEntries: JournalEntry[]): Promise<void> {
  try {
    const dbInstance = await openOfflineDB();
    const pendingItems = await getPendingQueueItems(userId);
    const pendingEntryIds = new Set(pendingItems.map((p) => p.entryId));

    const tx = dbInstance.transaction(STORE_ENTRIES, 'readwrite');
    const store = tx.objectStore(STORE_ENTRIES);

    for (const sEntry of serverEntries) {
      // Do not overwrite an entry that currently has pending offline modifications
      if (!pendingEntryIds.has(sEntry.id)) {
        store.put({
          ...sEntry,
          isOfflinePending: false,
          syncStatus: 'synced',
        });
      }
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[OfflineSync] Failed to cache server entries:', err);
  }
}

/**
 * Get all pending queue items waiting for cloud sync
 */
export async function getPendingQueueItems(userId: string): Promise<OfflineQueueItem[]> {
  try {
    const dbInstance = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = dbInstance.transaction(STORE_QUEUE, 'readonly');
      const store = tx.objectStore(STORE_QUEUE);
      const req = store.getAll();

      req.onsuccess = () => {
        const all: OfflineQueueItem[] = req.result || [];
        const userItems = all.filter((item) => item.userId === userId);
        resolve(userItems);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineSync] Failed to read pending queue:', err);
    return [];
  }
}

/**
 * Synchronize all pending offline entries to Firestore and enrich via Gemini AI if reachable
 */
export async function syncOfflineJournalQueue(
  userId: string,
  options?: {
    onEntrySynced?: (syncedEntry: JournalEntry) => void;
    onProgress?: (synced: number, total: number) => void;
  }
): Promise<{ syncedCount: number; failedCount: number; errors: string[] }> {
  const isReachable = await verifyConnectivityNow().catch(() => false);
  if (!isReachable) {
    return { syncedCount: 0, failedCount: 0, errors: ['Device is still offline'] };
  }

  const queue = await getPendingQueueItems(userId);
  if (queue.length === 0) {
    return { syncedCount: 0, failedCount: 0, errors: [] };
  }

  const dbInstance = await openOfflineDB();
  let syncedCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < queue.length; i++) {
    const queueItem = queue[i];
    try {
      // Mark entry as syncing in cached store
      await updateEntrySyncStatus(dbInstance, queueItem.entryId, 'syncing');

      // Attempt AI enrichment via /api/reflect if online
      let finalAiResponse = queueItem.entry.aiResponse;
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (auth.currentUser) {
          const idToken = await auth.currentUser.getIdToken().catch(() => null);
          if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch('/api/reflect', {
          method: 'POST',
          headers,
          signal: controller.signal,
          body: JSON.stringify({
            content: queueItem.entry.content,
            userId,
            userEmail: queueItem.userEmail,
          }),
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const resData = await res.json();
          if (resData.reflection) {
            finalAiResponse = {
              title: resData.reflection.title || queueItem.entry.title,
              conversationalReply: resData.reflection.conversationalReply,
              moodTags: resData.reflection.moodTags || queueItem.entry.moodTags,
              actionableTakeaways: resData.reflection.actionableTakeaways || queueItem.entry.aiResponse?.actionableTakeaways || [],
            };
          }
        }
      } catch (enrichErr) {
        console.info('[OfflineSync] Proceeding with saved procedural reflection:', enrichErr);
      }

      // Prepare final document for Firestore
      const enrichedEntry: JournalEntry = {
        ...queueItem.entry,
        aiResponse: finalAiResponse,
        moodTags: finalAiResponse?.moodTags || queueItem.entry.moodTags,
        title: finalAiResponse?.title || queueItem.entry.title,
        isOfflinePending: false,
        syncStatus: 'synced',
        updatedAt: Date.now(),
      };

      // Persist to user-isolated path `users/{userId}/entries/{entryId}`
      const entryDocRef = doc(db, 'users', userId, 'entries', queueItem.entryId);
      const cleanData = cleanForFirestore(enrichedEntry);
      await setDoc(entryDocRef, cleanData);

      // Update cached_entries in IndexedDB
      await new Promise<void>((resolve, reject) => {
        const tx = dbInstance.transaction(STORE_ENTRIES, 'readwrite');
        const store = tx.objectStore(STORE_ENTRIES);
        const req = store.put(enrichedEntry);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      // Remove from offline_queue in IndexedDB
      await new Promise<void>((resolve, reject) => {
        const tx = dbInstance.transaction(STORE_QUEUE, 'readwrite');
        const store = tx.objectStore(STORE_QUEUE);
        const req = store.delete(queueItem.id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      syncedCount++;
      if (options?.onEntrySynced) {
        options.onEntrySynced(enrichedEntry);
      }
      if (options?.onProgress) {
        options.onProgress(syncedCount, queue.length);
      }
    } catch (err: any) {
      failedCount++;
      errors.push(`Failed syncing entry ${queueItem.entryId}: ${err.message || String(err)}`);
      // Update queue item retry count
      await incrementQueueRetry(dbInstance, queueItem);
      await updateEntrySyncStatus(dbInstance, queueItem.entryId, 'pending');
    }
  }

  // Dispatch global queue change event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('somotoz:offline-queue-changed', {
        detail: { syncedCount, failedCount },
      })
    );
  }

  return { syncedCount, failedCount, errors };
}

/**
 * Update an entry's sync status in IndexedDB
 */
async function updateEntrySyncStatus(
  dbInstance: IDBDatabase,
  entryId: string,
  status: 'synced' | 'pending' | 'syncing'
): Promise<void> {
  return new Promise((resolve) => {
    const tx = dbInstance.transaction(STORE_ENTRIES, 'readwrite');
    const store = tx.objectStore(STORE_ENTRIES);
    const getReq = store.get(entryId);
    getReq.onsuccess = () => {
      const entry: JournalEntry = getReq.result;
      if (entry) {
        entry.syncStatus = status;
        entry.isOfflinePending = status !== 'synced';
        store.put(entry);
      }
      resolve();
    };
    getReq.onerror = () => resolve();
  });
}

/**
 * Increment retry count on queue failure
 */
async function incrementQueueRetry(dbInstance: IDBDatabase, queueItem: OfflineQueueItem): Promise<void> {
  return new Promise((resolve) => {
    const tx = dbInstance.transaction(STORE_QUEUE, 'readwrite');
    const store = tx.objectStore(STORE_QUEUE);
    queueItem.retryCount = (queueItem.retryCount || 0) + 1;
    queueItem.lastAttemptAt = Date.now();
    store.put(queueItem);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export async function clearOfflineJournalData(): Promise<void> {
  if (typeof window === 'undefined' || !window.indexedDB) return;
  try {
    const dbInstance = await openOfflineDB();
    await Promise.all([
      new Promise<void>((resolve) => {
        const tx = dbInstance.transaction(STORE_ENTRIES, 'readwrite');
        tx.objectStore(STORE_ENTRIES).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      }),
      new Promise<void>((resolve) => {
        const tx = dbInstance.transaction(STORE_QUEUE, 'readwrite');
        tx.objectStore(STORE_QUEUE).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      }),
    ]);
    dbInstance.close();
  } catch (err) {
    console.warn('[OfflineSync] Failed clearing local IndexedDB journal data:', err);
  }
}

/**
 * Hook to initialize auto-sync listeners when internet returns or service worker fires
 */
export function initOfflineSyncManager(
  userId: string,
  callbacks?: {
    onSyncComplete?: (count: number) => void;
    onEntrySynced?: (entry: JournalEntry) => void;
  }
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleSyncTrigger = async () => {
    const online = await verifyConnectivityNow().catch(() => false);
    if (online) {
      try {
        const result = await syncOfflineJournalQueue(userId, {
          onEntrySynced: callbacks?.onEntrySynced,
        });
        if (result.syncedCount > 0 && callbacks?.onSyncComplete) {
          callbacks.onSyncComplete(result.syncedCount);
        }
      } catch (e) {
        console.warn('[OfflineSync] Auto-sync run error:', e);
      }
    }
  };

  // 1. Listen for browser online event
  window.addEventListener('online', handleSyncTrigger);

  // 2. Listen for Service Worker messages (e.g. background sync triggered)
  const handleServiceWorkerMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'TRIGGER_OFFLINE_SYNC') {
      handleSyncTrigger();
    }
  };

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
  }

  // 3. Check shortly after mount
  const initialTimer = setTimeout(handleSyncTrigger, 1500);

  return () => {
    clearTimeout(initialTimer);
    window.removeEventListener('online', handleSyncTrigger);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    }
  };
}
