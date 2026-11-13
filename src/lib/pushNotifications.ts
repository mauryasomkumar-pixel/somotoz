import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { isRestrictedSwEnvironment } from './pwaService';

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isPushSupported()) return 'denied';
  return Notification.permission;
}

export async function requestPushPermission(uid?: string): Promise<{
  success: boolean;
  status: NotificationPermission;
  error?: string;
}> {
  if (!isPushSupported()) {
    return { success: false, status: 'denied', error: 'Push notifications are not supported by this browser.' };
  }

  try {
    const permission = await Notification.requestPermission();
    const currentUid = uid || auth.currentUser?.uid;

    if (permission === 'granted') {
      // Register FCM service worker on dedicated scope in production only (never overwrite root /sw.js)
      if ('serviceWorker' in navigator && !isRestrictedSwEnvironment()) {
        try {
          await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/firebase-cloud-messaging-push-scope',
          });
        } catch (swErr) {
          console.warn('[Push] Service worker registration notice:', swErr);
        }
      }

      // Update user preference in Firestore
      if (currentUid) {
        try {
          await updateDoc(doc(db, 'users', currentUid, 'profile', 'main'), {
            notificationsEnabled: true,
            notificationsUpdatedAt: Date.now(),
          });
        } catch (fsErr) {
          console.warn('[Push] Error updating user profile notifications:', fsErr);
        }
      }

      // Show welcome test notification
      showNotification('Somotoz Notifications Enabled', {
        body: 'You will now receive alerts for new messages, connection requests, and calls.',
        icon: '/pwa-192x192.png',
      });

      return { success: true, status: 'granted' };
    } else {
      if (currentUid) {
        try {
          await updateDoc(doc(db, 'users', currentUid, 'profile', 'main'), {
            notificationsEnabled: false,
          });
        } catch {}
      }
      return { success: false, status: permission };
    }
  } catch (err: any) {
    return { success: false, status: 'denied', error: err.message };
  }
}

export async function disablePushNotifications(uid?: string): Promise<boolean> {
  const currentUid = uid || auth.currentUser?.uid;
  if (currentUid) {
    try {
      await updateDoc(doc(db, 'users', currentUid, 'profile', 'main'), {
        notificationsEnabled: false,
      });
      return true;
    } catch {
      return false;
    }
  }
  return true;
}

export function showNotification(title: string, options?: NotificationOptions): void {
  if (!isPushSupported() || Notification.permission !== 'granted') return;

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          icon: '/pwa-192x192.png',
          badge: '/icon.svg',
          ...options,
        });
      });
    } else {
      new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/icon.svg',
        ...options,
      });
    }
  } catch (err) {
    console.warn('[Push] Notification dispatch failed:', err);
  }
}
