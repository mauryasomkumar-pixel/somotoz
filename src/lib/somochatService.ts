import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from 'firebase/firestore';
import { db, cleanForFirestore } from './firebase';
import { UserProfile, PublicUserProfile } from '../types';

export interface SomoChatRequest {
  id: string;
  fromUid: string;
  toUid: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
  fromUsername?: string;
  fromPhoto?: string;
  fromMood?: string;
  toUsername?: string;
  toPhoto?: string;
  toMood?: string;
}

export type ChatTheme = 'aurora' | 'sunset' | 'ocean' | 'forest' | 'neon' | 'sepia';
export type DisappearingMode = 'off' | '24h' | 'seen';

export interface SomoConversation {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: number;
  lastMessageType?: 'text' | 'image' | 'voice' | 'sticker' | 'system';
  lastSenderUid?: string;
  typing?: Record<string, number>;
  lastRead?: Record<string, number>;
  mutedBy?: string[];
  blockedBy?: string[];
  createdAt: number;
  theme?: ChatTheme;
  disappearingMode?: DisappearingMode;
  participantProfiles?: Record<string, {
    username: string;
    photo?: string;
    mood?: string;
    lastSeen?: number;
  }>;
}

export interface SomoChatMessage {
  id: string;
  conversationId: string;
  senderUid: string;
  type: 'text' | 'image' | 'voice' | 'sticker' | 'system';
  text: string;
  mediaUrl?: string;
  replyTo?: {
    id: string;
    senderUid: string;
    text: string;
  } | null;
  reactions?: Record<string, string>;
  createdAt: number;
  expireAt?: number;
  deletedFor?: string[];
  deletedAt?: number;
}

/**
 * Generates a deterministic conversation ID for two users.
 */
export function getConversationId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_');
}

/**
 * Listens to all conversations where current user is a participant.
 */
export function subscribeToConversations(
  currentUid: string,
  onUpdate: (conversations: SomoConversation[]) => void,
  onError?: (err: any) => void
): () => void {
  const convsRef = collection(db, 'conversations');
  const q = query(convsRef, where('participants', 'array-contains', currentUid));

  return onSnapshot(
    q,
    (snapshot) => {
      const convs: SomoConversation[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const blockedBy = Array.isArray(data.blockedBy) ? data.blockedBy : [];
        // If current user blocked this conversation, hide it from active list
        if (blockedBy.includes(currentUid)) {
          return;
        }

        convs.push({
          id: docSnap.id,
          participants: data.participants || [],
          lastMessage: data.lastMessage || '',
          lastMessageAt: data.lastMessageAt || data.createdAt || 0,
          lastMessageType: data.lastMessageType || 'text',
          lastSenderUid: data.lastSenderUid,
          typing: data.typing || {},
          lastRead: data.lastRead || {},
          mutedBy: data.mutedBy || [],
          blockedBy,
          createdAt: data.createdAt || 0,
          theme: data.theme || 'aurora',
          disappearingMode: data.disappearingMode || 'off',
          participantProfiles: data.participantProfiles || {},
        });
      });

      // Sort by lastMessageAt descending
      convs.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
      onUpdate(convs);
    },
    (err) => {
      console.warn('[SomoChat Service] subscribeToConversations error:', err);
      onError?.(err);
    }
  );
}

/**
 * Listens to paginated messages for a conversation (limitCount defaults to 30).
 */
export function subscribeToMessages(
  conversationId: string,
  currentUid: string,
  limitCount: number = 30,
  onUpdate: (messages: SomoChatMessage[]) => void,
  onError?: (err: any) => void
): () => void {
  const msgsRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(msgsRef, orderBy('createdAt', 'desc'), limit(limitCount));

  return onSnapshot(
    q,
    (snapshot) => {
      const now = Date.now();
      const messages: SomoChatMessage[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const deletedFor = Array.isArray(data.deletedFor) ? data.deletedFor : [];
        const deletedAt = data.deletedAt;
        const expireAt = data.expireAt;

        // Disappear right away if deleted by user or marked with deletedAt
        if (deletedFor.includes(currentUid) || deletedAt) {
          return;
        }

        // Expire if beyond expireAt
        if (expireAt && expireAt < now) {
          return;
        }

        messages.push({
          id: docSnap.id,
          conversationId,
          senderUid: data.senderUid || '',
          type: data.type || 'text',
          text: data.text || '',
          mediaUrl: data.mediaUrl,
          replyTo: data.replyTo || null,
          reactions: data.reactions || {},
          createdAt: data.createdAt || 0,
          expireAt: data.expireAt,
          deletedFor,
          deletedAt: data.deletedAt,
        });
      });

      // Order chronological (oldest to newest) for chat stream rendering
      messages.reverse();
      onUpdate(messages);
    },
    (err) => {
      console.warn('[SomoChat Service] subscribeToMessages error:', err);
      onError?.(err);
    }
  );
}

/**
 * Sends a message in a conversation.
 */
export async function sendChatMessage(params: {
  conversationId: string;
  senderUid: string;
  type: 'text' | 'image' | 'voice' | 'sticker' | 'system';
  text: string;
  mediaUrl?: string;
  replyTo?: { id: string; senderUid: string; text: string } | null;
  expireDurationHours?: number; // e.g. 24 for 24 hours (Snapchat style)
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { conversationId, senderUid, type, text, mediaUrl, replyTo, expireDurationHours } = params;
    const now = Date.now();
    const expireAt = expireDurationHours ? now + expireDurationHours * 3600 * 1000 : undefined;

    const messageData = cleanForFirestore({
      senderUid,
      type,
      text: text.trim(),
      mediaUrl: mediaUrl || undefined,
      replyTo: replyTo || null,
      reactions: {},
      createdAt: now,
      expireAt: expireAt || undefined,
      deletedFor: [],
    });

    const msgsRef = collection(db, 'conversations', conversationId, 'messages');
    const newDoc = await addDoc(msgsRef, messageData);

    // Update conversation metadata
    const convRef = doc(db, 'conversations', conversationId);
    let preview = text.trim();
    if (!preview) {
      if (type === 'image') preview = '📷 Photo';
      else if (type === 'voice') preview = '🎙️ Voice note';
      else if (type === 'sticker') preview = '✨ Sticker';
      else preview = 'Sent a message';
    }

    await updateDoc(convRef, {
      lastMessage: preview.slice(0, 150),
      lastMessageAt: now,
      lastMessageType: type,
      lastSenderUid: senderUid,
      [`typing.${senderUid}`]: 0,
    });

    return { success: true, messageId: newDoc.id };
  } catch (err: any) {
    console.error('[SomoChat Service] sendChatMessage error:', err);
    return { success: false, error: err.message || 'Failed to send message.' };
  }
}

/**
 * Updates user typing status with timestamp or 0.
 */
export async function updateTypingIndicator(
  conversationId: string,
  uid: string,
  isTyping: boolean
): Promise<void> {
  try {
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
      [`typing.${uid}`]: isTyping ? Date.now() : 0,
    });
  } catch (err) {
    // Non-blocking
  }
}

/**
 * Marks conversation as read by the current user.
 */
export async function markConversationRead(
  conversationId: string,
  uid: string
): Promise<void> {
  try {
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
      [`lastRead.${uid}`]: Date.now(),
    });
  } catch (err) {
    // Non-blocking
  }
}

/**
 * Updates chat color theme for a conversation.
 */
export async function updateConversationTheme(
  conversationId: string,
  theme: ChatTheme
): Promise<void> {
  try {
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, { theme });
  } catch (err) {
    console.warn('[SomoChat Service] updateConversationTheme notice:', err);
  }
}

/**
 * Updates disappearing messages mode for a conversation ('off', '24h', 'seen').
 */
export async function updateConversationDisappearing(
  conversationId: string,
  mode: DisappearingMode
): Promise<void> {
  try {
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, { disappearingMode: mode });
  } catch (err) {
    console.warn('[SomoChat Service] updateConversationDisappearing notice:', err);
  }
}

/**
 * Heartbeat: Updates user presence lastSeen timestamp on publicProfiles.
 */
export async function updateUserPresence(uid: string): Promise<void> {
  try {
    const profileRef = doc(db, 'publicProfiles', uid);
    await updateDoc(profileRef, {
      lastSeen: Date.now(),
    });
  } catch {
    // Non-blocking
  }
}

/**
 * Listens to a user's public profile for real-time presence (lastSeen, mood, photo, username).
 */
export function subscribeToUserPresence(
  uid: string,
  onUpdate: (presence: { lastSeen?: number; mood?: string; username?: string; photoURL?: string }) => void
): () => void {
  const profileRef = doc(db, 'publicProfiles', uid);
  return onSnapshot(
    profileRef,
    (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        onUpdate({
          lastSeen: d.lastSeen,
          mood: d.mood,
          username: d.username,
          photoURL: d.photoURL,
        });
      }
    },
    () => {}
  );
}


/**
 * Deletes a message for the user right away (marks with deletedAt and deletedFor).
 */
export async function deleteChatMessage(
  conversationId: string,
  messageId: string,
  currentUid: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const now = Date.now();

    await updateDoc(msgRef, {
      deletedFor: arrayUnion(currentUid),
      deletedAt: now,
    });

    return { success: true };
  } catch (err: any) {
    console.error('[SomoChat Service] deleteChatMessage error:', err);
    return { success: false, error: err.message || 'Failed to delete message.' };
  }
}

/**
 * Adds or removes a reaction emoji to a message.
 */
export async function toggleMessageReaction(
  conversationId: string,
  messageId: string,
  currentUid: string,
  emoji: string
): Promise<void> {
  try {
    const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const snap = await getDoc(msgRef);
    if (!snap.exists()) return;

    const data = snap.data();
    const reactions = data.reactions || {};
    const currentReaction = reactions[currentUid];

    if (currentReaction === emoji) {
      delete reactions[currentUid];
    } else {
      reactions[currentUid] = emoji;
    }

    await updateDoc(msgRef, { reactions });
  } catch (err) {
    console.warn('[SomoChat Service] toggleMessageReaction notice:', err);
  }
}

/**
 * Blocks a user, removes the conversation from the blocker's list, and declines pending requests.
 */
export async function blockUserInChat(
  conversationId: string,
  blockerUid: string,
  blockedUid: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Add blockerUid to conversation blockedBy
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
      blockedBy: arrayUnion(blockerUid),
    });

    // 2. Decline any pending chat requests between them
    try {
      const reqId1 = `${blockerUid}_${blockedUid}`;
      const reqId2 = `${blockedUid}_${blockerUid}`;
      await updateDoc(doc(db, 'chatRequests', reqId1), { status: 'declined' }).catch(() => {});
      await updateDoc(doc(db, 'chatRequests', reqId2), { status: 'declined' }).catch(() => {});
    } catch {
      // Ignored
    }

    return { success: true };
  } catch (err: any) {
    console.error('[SomoChat Service] blockUserInChat error:', err);
    return { success: false, error: err.message || 'Could not block user.' };
  }
}

/**
 * Unblocks a user.
 */
export async function unblockUserInChat(
  conversationId: string,
  blockerUid: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
      blockedBy: arrayRemove(blockerUid),
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Could not unblock user.' };
  }
}

/**
 * Toggles mute notifications for a conversation.
 */
export async function toggleMuteConversation(
  conversationId: string,
  uid: string,
  isCurrentlyMuted: boolean
): Promise<void> {
  try {
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
      mutedBy: isCurrentlyMuted ? arrayRemove(uid) : arrayUnion(uid),
    });
  } catch (err) {
    console.warn('[SomoChat Service] toggleMuteConversation notice:', err);
  }
}

/**
 * Sends a chat request to a real user discovered on Somotoz.
 */
export async function sendChatRequest(
  fromUser: UserProfile,
  toUser: PublicUserProfile
): Promise<{ success: boolean; error?: string; alreadyConnected?: boolean }> {
  try {
    if (fromUser.uid === toUser.uid) {
      return { success: false, error: 'You cannot send a chat request to yourself.' };
    }

    // Check if conversation already exists
    const convId = getConversationId(fromUser.uid, toUser.uid);
    const convSnap = await getDoc(doc(db, 'conversations', convId));
    if (convSnap.exists()) {
      return { success: true, alreadyConnected: true };
    }

    // Check existing request
    const requestId = `${fromUser.uid}_${toUser.uid}`;
    const reqRef = doc(db, 'chatRequests', requestId);
    const existingReq = await getDoc(reqRef);

    if (existingReq.exists()) {
      const data = existingReq.data();
      if (data.status === 'pending') {
        return { success: true, error: 'A request has already been sent to this user.' };
      }
      if (data.status === 'accepted') {
        return { success: true, alreadyConnected: true };
      }
    }

    const payload: SomoChatRequest = {
      id: requestId,
      fromUid: fromUser.uid,
      toUid: toUser.uid,
      status: 'pending',
      createdAt: Date.now(),
      fromUsername: fromUser.username || fromUser.displayName || 'Somotoz User',
      fromPhoto: fromUser.photoURL || undefined,
      fromMood: fromUser.mood || 'peaceful',
      toUsername: toUser.username,
      toPhoto: toUser.photoURL || undefined,
      toMood: toUser.mood || 'peaceful',
    };

    await setDoc(reqRef, cleanForFirestore(payload));
    return { success: true };
  } catch (err: any) {
    console.error('[SomoChat Service] sendChatRequest error:', err);
    return { success: false, error: err.message || 'Failed to send request.' };
  }
}

/**
 * Listens to incoming chat requests for current user.
 */
export function subscribeToIncomingChatRequests(
  currentUid: string,
  onUpdate: (requests: SomoChatRequest[]) => void
): () => void {
  const reqsRef = collection(db, 'chatRequests');
  const q = query(
    reqsRef,
    where('toUid', '==', currentUid),
    where('status', '==', 'pending')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const reqs: SomoChatRequest[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        reqs.push({
          id: docSnap.id,
          fromUid: d.fromUid,
          toUid: d.toUid,
          status: d.status,
          createdAt: d.createdAt || 0,
          fromUsername: d.fromUsername,
          fromPhoto: d.fromPhoto,
          fromMood: d.fromMood,
          toUsername: d.toUsername,
          toPhoto: d.toPhoto,
          toMood: d.toMood,
        });
      });
      reqs.sort((a, b) => b.createdAt - a.createdAt);
      onUpdate(reqs);
    },
    (err) => {
      console.warn('[SomoChat Service] subscribeToIncomingChatRequests notice:', err);
    }
  );
}

/**
 * Listens to outgoing chat requests sent by current user.
 */
export function subscribeToOutgoingChatRequests(
  currentUid: string,
  onUpdate: (requests: SomoChatRequest[]) => void
): () => void {
  const reqsRef = collection(db, 'chatRequests');
  const q = query(
    reqsRef,
    where('fromUid', '==', currentUid),
    where('status', '==', 'pending')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const reqs: SomoChatRequest[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        reqs.push({
          id: docSnap.id,
          fromUid: d.fromUid,
          toUid: d.toUid,
          status: d.status,
          createdAt: d.createdAt || 0,
          fromUsername: d.fromUsername,
          fromPhoto: d.fromPhoto,
          fromMood: d.fromMood,
          toUsername: d.toUsername,
          toPhoto: d.toPhoto,
          toMood: d.toMood,
        });
      });
      onUpdate(reqs);
    },
    (err) => {
      console.warn('[SomoChat Service] subscribeToOutgoingChatRequests notice:', err);
    }
  );
}

/**
 * Accepts a chat request and creates the real conversation.
 */
export async function acceptChatRequest(
  request: SomoChatRequest,
  currentUser: UserProfile
): Promise<{ success: boolean; conversationId?: string; error?: string }> {
  try {
    const convId = getConversationId(request.fromUid, request.toUid);
    const now = Date.now();

    // 1. Mark request as accepted
    const reqRef = doc(db, 'chatRequests', request.id);
    await updateDoc(reqRef, { status: 'accepted' });

    // 2. Create or initialize conversation document
    const convRef = doc(db, 'conversations', convId);
    const convSnap = await getDoc(convRef);

    if (!convSnap.exists()) {
      const participants = [request.fromUid, request.toUid].sort();
      const participantProfiles = {
        [request.fromUid]: {
          username: request.fromUsername || 'Somotoz User',
          photo: request.fromPhoto || '',
          mood: request.fromMood || 'peaceful',
        },
        [request.toUid]: {
          username: currentUser.username || currentUser.displayName || 'Somotoz User',
          photo: currentUser.photoURL || '',
          mood: currentUser.mood || 'peaceful',
        },
      };

      const newConversation: SomoConversation = {
        id: convId,
        participants,
        lastMessage: 'Chat request accepted! Say hello 👋',
        lastMessageAt: now,
        lastMessageType: 'system',
        createdAt: now,
        typing: {},
        lastRead: { [currentUser.uid]: now },
        mutedBy: [],
        blockedBy: [],
        participantProfiles,
      };

      await setDoc(convRef, cleanForFirestore(newConversation));

      // Post initial system welcome message
      const msgsRef = collection(db, 'conversations', convId, 'messages');
      await addDoc(msgsRef, {
        senderUid: currentUser.uid,
        type: 'system',
        text: 'Connected on SomoChat! Send your first message.',
        createdAt: now,
        deletedFor: [],
      });
    }

    return { success: true, conversationId: convId };
  } catch (err: any) {
    console.error('[SomoChat Service] acceptChatRequest error:', err);
    return { success: false, error: err.message || 'Could not accept request.' };
  }
}

/**
 * Declines a chat request.
 */
export async function declineChatRequest(
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const reqRef = doc(db, 'chatRequests', requestId);
    await updateDoc(reqRef, { status: 'declined' });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Could not decline request.' };
  }
}

/**
 * Fetches real registered users from publicProfiles collection (strictly no bots).
 */
export async function fetchDiscoverRealUsers(
  currentUid: string,
  limitCount: number = 60
): Promise<PublicUserProfile[]> {
  try {
    // Try publicProfiles first
    let snap = await getDocs(query(collection(db, 'publicProfiles'), limit(limitCount)));
    if (snap.empty) {
      // Fallback to public_profiles
      snap = await getDocs(query(collection(db, 'public_profiles'), limit(limitCount)));
    }

    const users: PublicUserProfile[] = [];
    snap.forEach((d) => {
      const data = d.data() as PublicUserProfile;
      if (d.id !== currentUid && data.uid !== currentUid) {
        users.push({
          uid: d.id,
          username: data.username || 'user',
          photoURL: data.photoURL || null,
          bio: data.bio || '',
          mood: data.mood || 'peaceful',
          accentColor: data.accentColor,
          isAdult: data.isAdult !== false,
          updatedAt: data.updatedAt || Date.now(),
        });
      }
    });

    return users;
  } catch (err) {
    console.warn('[SomoChat Service] fetchDiscoverRealUsers notice:', err);
    return [];
  }
}

/**
 * Compresses an image file in-browser to under 300KB as JPEG Data URL.
 */
export async function compressImageToDataUrl(
  file: File,
  maxDimension = 1200,
  maxSizeBytes = 300 * 1024
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const image = new Image();
      image.onload = () => {
        let width = image.width;
        let height = image.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas context could not be acquired'));
        }

        ctx.drawImage(image, 0, 0, width, height);

        let quality = 0.85;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Progressively lower quality if size exceeds 300KB
        while (dataUrl.length > maxSizeBytes * 1.33 && quality > 0.3) {
          quality -= 0.15;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(dataUrl);
      };
      image.onerror = () => reject(new Error('Invalid image file'));
      image.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Could not read image file'));
    reader.readAsDataURL(file);
  });
}
