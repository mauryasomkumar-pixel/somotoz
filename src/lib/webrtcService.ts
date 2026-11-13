import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db, cleanForFirestore } from './firebase';
import { sendChatMessage } from './somochatService';

export type CallType = 'voice' | 'video';
export type CallStatus = 'calling' | 'ringing' | 'accepted' | 'declined' | 'ended' | 'missed';

export interface WebRTCCall {
  id: string;
  conversationId: string;
  callerUid: string;
  callerName: string;
  callerPhoto?: string;
  callerMood?: string;
  calleeUid: string;
  calleeName: string;
  calleePhoto?: string;
  calleeMood?: string;
  type: CallType;
  status: CallStatus;
  offer?: {
    type: string;
    sdp: string;
  };
  answer?: {
    type: string;
    sdp: string;
  };
  createdAt: number;
  endedAt?: number;
}

let turnWarningLogged = false;

export function hasTurnConfig(): boolean {
  const metaEnv = (import.meta as any).env || {};
  const turnUrl = metaEnv.VITE_TURN_SERVER_URL || metaEnv.VITE_TURN_URL;
  const hasConfig = Boolean(
    turnUrl && metaEnv.VITE_TURN_USERNAME && metaEnv.VITE_TURN_CREDENTIAL
  );
  if (!turnUrl && !turnWarningLogged) {
    turnWarningLogged = true;
    console.warn(
      '[WebRTC] TURN server environment variables (VITE_TURN_SERVER_URL, VITE_TURN_USERNAME, VITE_TURN_CREDENTIAL) are not set. Calls may not connect on some networks.'
    );
  }
  return Boolean(turnUrl) || hasConfig;
}

/**
 * Returns ICE servers config including Google's public STUN servers
 * and configurable TURN server from environment variables.
 */
export function getIceServers(): RTCConfiguration {
  const iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ];

  const metaEnv = (import.meta as any).env || {};
  const turnUrl = metaEnv.VITE_TURN_SERVER_URL || metaEnv.VITE_TURN_URL;
  if (turnUrl) {
    iceServers.push({
      urls: turnUrl,
      username: metaEnv.VITE_TURN_USERNAME || undefined,
      credential: metaEnv.VITE_TURN_CREDENTIAL || undefined,
    });
  } else {
    hasTurnConfig();
  }

  return {
    iceServers,
    iceCandidatePoolSize: 10,
  };
}

/**
 * Synthesizes ringtones and ringback tones via Web Audio API.
 * Guarantees crisp playback across all mobile browsers and installed PWAs without external audio files.
 */
export class CallToneManager {
  private ctx: AudioContext | null = null;
  private intervalId: any = null;
  private isPlaying = false;

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Incoming call melody ringtone: gentle melodic chime sequence
   */
  startIncomingRingtone() {
    this.stop();
    this.isPlaying = true;
    const playCadence = () => {
      if (!this.isPlaying) return;
      try {
        const ctx = this.getContext();
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.16);

          gain.gain.setValueAtTime(0, now + idx * 0.16);
          gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.16 + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.16 + 0.4);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.16);
          osc.stop(now + idx * 0.16 + 0.45);
        });
      } catch (err) {
        console.warn('Ringtone audio notice:', err);
      }
    };

    playCadence();
    this.intervalId = setInterval(playCadence, 2400);
  }

  /**
   * Outgoing ringback tone: standard dual-tone burst (440Hz + 480Hz)
   */
  startOutgoingRingback() {
    this.stop();
    this.isPlaying = true;
    const playTone = () => {
      if (!this.isPlaying) return;
      try {
        const ctx = this.getContext();
        const now = ctx.currentTime;
        [440, 480].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
          gain.gain.setValueAtTime(0.08, now + 1.2);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 1.35);
        });
      } catch (err) {
        console.warn('Ringback audio notice:', err);
      }
    };

    playTone();
    this.intervalId = setInterval(playTone, 3000);
  }

  /**
   * End call / beep tone
   */
  playEndCallChime() {
    this.stop();
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.3);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Ignored
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const toneManager = new CallToneManager();

/**
 * Initiates a new WebRTC voice or video call.
 */
export async function createCallSession(params: {
  conversationId: string;
  callerUid: string;
  callerName: string;
  callerPhoto?: string;
  callerMood?: string;
  calleeUid: string;
  calleeName: string;
  calleePhoto?: string;
  calleeMood?: string;
  type: CallType;
  offerSdp: RTCSessionDescriptionInit;
}): Promise<string> {
  const {
    conversationId,
    callerUid,
    callerName,
    callerPhoto,
    callerMood,
    calleeUid,
    calleeName,
    calleePhoto,
    calleeMood,
    type,
    offerSdp,
  } = params;

  const callsRef = collection(db, 'conversations', conversationId, 'calls');
  const now = Date.now();

  const callDoc = cleanForFirestore({
    conversationId,
    callerUid,
    callerName,
    callerPhoto: callerPhoto || undefined,
    callerMood: callerMood || undefined,
    calleeUid,
    calleeName,
    calleePhoto: calleePhoto || undefined,
    calleeMood: calleeMood || undefined,
    type,
    status: 'calling',
    offer: {
      type: offerSdp.type,
      sdp: offerSdp.sdp,
    },
    createdAt: now,
  });

  const docRef = await addDoc(callsRef, callDoc);
  return docRef.id;
}

/**
 * Listens for active incoming or ongoing calls in a conversation.
 */
export function subscribeToIncomingCall(
  conversationId: string,
  currentUid: string,
  onIncomingCall: (call: WebRTCCall | null) => void
): () => void {
  const callsRef = collection(db, 'conversations', conversationId, 'calls');
  // Listen for active calls directed to or initiated by user
  const q = query(
    callsRef,
    where('status', 'in', ['calling', 'ringing', 'accepted'])
  );

  return onSnapshot(
    q,
    (snapshot) => {
      let activeCall: WebRTCCall | null = null;
      snapshot.forEach((d) => {
        const data = d.data();
        // Ignore calls older than 5 minutes if still marked calling
        if (Date.now() - (data.createdAt || 0) < 300000) {
          activeCall = {
            id: d.id,
            conversationId,
            callerUid: data.callerUid,
            callerName: data.callerName || 'User',
            callerPhoto: data.callerPhoto,
            callerMood: data.callerMood,
            calleeUid: data.calleeUid,
            calleeName: data.calleeName || 'User',
            calleePhoto: data.calleePhoto,
            calleeMood: data.calleeMood,
            type: data.type || 'voice',
            status: data.status || 'calling',
            offer: data.offer,
            answer: data.answer,
            createdAt: data.createdAt || Date.now(),
            endedAt: data.endedAt,
          };
        }
      });
      onIncomingCall(activeCall);
    },
    (err) => {
      console.warn('[WebRTC Service] subscribeToIncomingCall notice:', err);
    }
  );
}

/**
 * Listens to a specific call document for answer, status updates, or termination.
 */
export function subscribeToCallDocument(
  conversationId: string,
  callId: string,
  onUpdate: (call: WebRTCCall | null) => void
): () => void {
  const callRef = doc(db, 'conversations', conversationId, 'calls', callId);
  return onSnapshot(
    callRef,
    (snap) => {
      if (!snap.exists()) {
        onUpdate(null);
        return;
      }
      const data = snap.data();
      onUpdate({
        id: snap.id,
        conversationId,
        callerUid: data.callerUid,
        callerName: data.callerName || 'User',
        callerPhoto: data.callerPhoto,
        callerMood: data.callerMood,
        calleeUid: data.calleeUid,
        calleeName: data.calleeName || 'User',
        calleePhoto: data.calleePhoto,
        calleeMood: data.calleeMood,
        type: data.type || 'voice',
        status: data.status || 'calling',
        offer: data.offer,
        answer: data.answer,
        createdAt: data.createdAt || Date.now(),
        endedAt: data.endedAt,
      });
    },
    (err) => {
      console.warn('[WebRTC Service] subscribeToCallDocument notice:', err);
    }
  );
}

/**
 * Callee accepts call: writes answer SDP and changes status to 'accepted'.
 */
export async function answerCallSession(
  conversationId: string,
  callId: string,
  answerSdp: RTCSessionDescriptionInit
): Promise<void> {
  const callRef = doc(db, 'conversations', conversationId, 'calls', callId);
  await updateDoc(callRef, {
    status: 'accepted',
    answer: {
      type: answerSdp.type,
      sdp: answerSdp.sdp,
    },
  });
}

/**
 * Callee declines call or call times out as missed.
 */
export async function declineCallSession(
  conversationId: string,
  callId: string,
  reason: 'declined' | 'missed',
  senderUid: string,
  callType: CallType
): Promise<void> {
  try {
    const callRef = doc(db, 'conversations', conversationId, 'calls', callId);
    await updateDoc(callRef, {
      status: reason,
      endedAt: Date.now(),
    });

    // Post missed call system message to chat
    if (reason === 'missed') {
      await sendChatMessage({
        conversationId,
        senderUid,
        type: 'system',
        text: `📞 Missed ${callType === 'video' ? 'video' : 'voice'} call`,
      });
    }
  } catch (err) {
    console.warn('[WebRTC Service] declineCallSession notice:', err);
  }
}

/**
 * Ends an ongoing call.
 */
export async function endCallSession(
  conversationId: string,
  callId: string,
  durationSeconds?: number
): Promise<void> {
  try {
    const callRef = doc(db, 'conversations', conversationId, 'calls', callId);
    await updateDoc(callRef, {
      status: 'ended',
      endedAt: Date.now(),
    });
  } catch (err) {
    console.warn('[WebRTC Service] endCallSession notice:', err);
  }
}

/**
 * Adds an ICE candidate for caller.
 */
export async function addCallerIceCandidate(
  conversationId: string,
  callId: string,
  candidate: RTCIceCandidate
): Promise<void> {
  try {
    const candRef = collection(
      db,
      'conversations',
      conversationId,
      'calls',
      callId,
      'callerCandidates'
    );
    await addDoc(candRef, candidate.toJSON());
  } catch (err) {
    console.warn('[WebRTC Service] addCallerIceCandidate notice:', err);
  }
}

/**
 * Adds an ICE candidate for callee.
 */
export async function addCalleeIceCandidate(
  conversationId: string,
  callId: string,
  candidate: RTCIceCandidate
): Promise<void> {
  try {
    const candRef = collection(
      db,
      'conversations',
      conversationId,
      'calls',
      callId,
      'calleeCandidates'
    );
    await addDoc(candRef, candidate.toJSON());
  } catch (err) {
    console.warn('[WebRTC Service] addCalleeIceCandidate notice:', err);
  }
}

/**
 * Subscribes to peer's ICE candidates.
 */
export function subscribeToIceCandidates(
  conversationId: string,
  callId: string,
  candidateCollection: 'callerCandidates' | 'calleeCandidates',
  onCandidate: (candidate: RTCIceCandidateInit) => void
): () => void {
  const candRef = collection(
    db,
    'conversations',
    conversationId,
    'calls',
    callId,
    candidateCollection
  );

  return onSnapshot(candRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        onCandidate(change.doc.data() as RTCIceCandidateInit);
      }
    });
  });
}
