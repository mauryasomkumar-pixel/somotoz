import { verifyConnectivityNow } from '../hooks/useOnlineStatus';

export interface QueuedMessage {
  id: string;
  conversationId: string;
  senderUid: string;
  type: 'text' | 'image' | 'voice' | 'sticker' | 'system';
  text: string;
  mediaUrl?: string;
  replyTo?: any;
  createdAt: number;
  status: 'pending' | 'sending' | 'failed';
  retryCount: number;
}

const STORAGE_KEY = 'somotoz_offline_msg_queue';

export function getQueuedMessages(conversationId?: string): QueuedMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const all: QueuedMessage[] = JSON.parse(raw);
    if (!Array.isArray(all)) return [];
    if (conversationId) {
      return all.filter((m) => m.conversationId === conversationId);
    }
    return all;
  } catch (err) {
    console.error('[OfflineQueue] Read error:', err);
    return [];
  }
}

export function enqueueMessage(msg: Omit<QueuedMessage, 'id' | 'status' | 'retryCount'>): QueuedMessage {
  const queued: QueuedMessage = {
    ...msg,
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    status: 'pending',
    retryCount: 0,
  };

  try {
    const existing = getQueuedMessages();
    existing.push(queued);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.error('[OfflineQueue] Enqueue error:', err);
  }

  return queued;
}

export function removeQueuedMessage(id: string): void {
  try {
    const existing = getQueuedMessages();
    const updated = existing.filter((m) => m.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('[OfflineQueue] Remove error:', err);
  }
}

export async function flushMessageQueue(
  sendMessageFn: (msg: QueuedMessage) => Promise<boolean>
): Promise<number> {
  const isReachable = await verifyConnectivityNow().catch(() => false);
  if (!isReachable) {
    return 0;
  }

  const all = getQueuedMessages();
  if (all.length === 0) return 0;

  let successCount = 0;
  for (const item of all) {
    try {
      const ok = await sendMessageFn(item);
      if (ok) {
        removeQueuedMessage(item.id);
        successCount++;
      }
    } catch (err) {
      console.warn('[OfflineQueue] Flush item failed:', item.id, err);
    }
  }

  return successCount;
}
