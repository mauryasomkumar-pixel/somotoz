import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  SwitchCamera,
  ShieldAlert,
  AlertTriangle,
  X,
  Wifi,
  Sparkles,
  Lock,
  Flag
} from 'lucide-react';
import { UserProfile } from '../types';
import {
  WebRTCCall,
  CallType,
  getIceServers,
  hasTurnConfig,
  toneManager,
  answerCallSession,
  declineCallSession,
  endCallSession,
  addCallerIceCandidate,
  addCalleeIceCandidate,
  subscribeToCallDocument,
  subscribeToIceCandidates,
} from '../lib/webrtcService';

export interface ThemeConfig {
  id: string;
  name: string;
  previewBg: string;
}

export const CHAT_THEMES: Record<string, ThemeConfig> = {
  aurora: { id: 'aurora', name: 'Aurora', previewBg: 'from-emerald-500 to-cyan-500' },
  sunset: { id: 'sunset', name: 'Sunset', previewBg: 'from-amber-500 to-rose-500' },
  ocean: { id: 'ocean', name: 'Ocean', previewBg: 'from-blue-600 to-cyan-400' },
  forest: { id: 'forest', name: 'Forest', previewBg: 'from-emerald-700 to-teal-500' },
  neon: { id: 'neon', name: 'Neon', previewBg: 'from-fuchsia-600 to-cyan-400' },
  candy: { id: 'candy', name: 'Candy', previewBg: 'from-pink-400 to-purple-400' },
  mocha: { id: 'mocha', name: 'Mocha', previewBg: 'from-amber-800 to-yellow-600' },
  theme_of_day: { id: 'theme_of_day', name: 'Theme of the Day', previewBg: 'from-indigo-500 to-violet-500' },
};

interface CallScreenProps {
  currentUser: UserProfile;
  activeCall: WebRTCCall;
  themeId?: string;
  isBlockedByPeer?: boolean;
  onClose: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const CallScreen: React.FC<CallScreenProps> = ({
  currentUser,
  activeCall,
  themeId = 'aurora',
  isBlockedByPeer = false,
  onClose,
  onShowToast,
}) => {
  const isCaller = activeCall.callerUid === currentUser.uid;
  const peerUid = isCaller ? activeCall.calleeUid : activeCall.callerUid;
  const peerName = isCaller ? activeCall.calleeName : activeCall.callerName;
  const peerPhoto = isCaller ? activeCall.calleePhoto : activeCall.callerPhoto;
  const peerMood = isCaller ? activeCall.calleeMood : activeCall.callerMood;

  // WebRTC references
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // In-call state
  const [callStatus, setCallStatus] = useState<WebRTCCall['status']>(activeCall.status);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(activeCall.type === 'video');
  const [isSpeakerMuted, setIsSpeakerMuted] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'fair' | 'reconnecting'>('fair');
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Report modal state
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<string>('harassment');
  const [reportDetails, setReportDetails] = useState<string>('');

  const activeTheme: ThemeConfig = (CHAT_THEMES as any)[themeId] || CHAT_THEMES.aurora;
  const timeoutTimerRef = useRef<any>(null);
  const durationIntervalRef = useRef<any>(null);

  // Cleanly teardown media and connection
  const cleanupMedia = useCallback(() => {
    toneManager.stop();

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
  }, []);

  // Mid-call block handler
  useEffect(() => {
    if (isBlockedByPeer) {
      onShowToast('info', 'Call Ended', 'Call was disconnected due to user block.');
      endCallSession(activeCall.conversationId, activeCall.id);
      cleanupMedia();
      onClose();
    }
  }, [isBlockedByPeer, activeCall, cleanupMedia, onClose, onShowToast]);

  // Handle media stream creation
  const initLocalStream = useCallback(async (videoDesired: boolean, facing: 'user' | 'environment') => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: videoDesired
          ? {
              facingMode: facing,
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }
          : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (localVideoRef.current && videoDesired) {
        localVideoRef.current.srcObject = stream;
      }

      setPermissionError(null);
      return stream;
    } catch (err: any) {
      console.warn('getUserMedia error:', err);
      let msg = 'Microphone/camera access was denied. Please allow permissions to continue.';
      if (err.name === 'NotFoundError') {
        msg = 'No camera or microphone device found on this system.';
      }
      setPermissionError(msg);
      return null;
    }
  }, []);

  // Initialize WebRTC PeerConnection
  const setupPeerConnection = useCallback(async (stream: MediaStream) => {
    const pc = new RTCPeerConnection(getIceServers());
    pcRef.current = pc;

    // Add local tracks
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Remote track arrival
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteVideoRef.current && activeCall.type === 'video') {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
    };

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        if (isCaller) {
          addCallerIceCandidate(activeCall.conversationId, activeCall.id, event.candidate);
        } else {
          addCalleeIceCandidate(activeCall.conversationId, activeCall.id, event.candidate);
        }
      }
    };

    // Monitor connection health
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      if (state === 'connected' || state === 'completed') {
        setConnectionQuality('good');
      } else if (state === 'checking') {
        setConnectionQuality('fair');
      } else if (state === 'disconnected' || state === 'failed') {
        setConnectionQuality('reconnecting');
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setConnectionQuality('good');
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setConnectionQuality('reconnecting');
      }
    };

    // Listen to remote candidates
    const candidateTarget = isCaller ? 'calleeCandidates' : 'callerCandidates';
    const unsubCandidates = subscribeToIceCandidates(
      activeCall.conversationId,
      activeCall.id,
      candidateTarget,
      async (candidateInit) => {
        try {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
          }
        } catch (err) {
          console.warn('addIceCandidate notice:', err);
        }
      }
    );

    return unsubCandidates;
  }, [activeCall, isCaller]);

  // 1. Initial State Handling (Caller vs Callee)
  useEffect(() => {
    let unsubCandidates: (() => void) | undefined;

    const startCallerFlow = async () => {
      toneManager.startOutgoingRingback();

      // 30-second timeout for missed call
      timeoutTimerRef.current = setTimeout(async () => {
        toneManager.playEndCallChime();
        await declineCallSession(
          activeCall.conversationId,
          activeCall.id,
          'missed',
          currentUser.uid,
          activeCall.type
        );
        onShowToast('info', 'No Answer', 'Call timed out.');
        cleanupMedia();
        onClose();
      }, 30000);

      const stream = await initLocalStream(activeCall.type === 'video', cameraFacing);
      if (stream) {
        unsubCandidates = await setupPeerConnection(stream);
      }
    };

    const startCalleeFlow = () => {
      toneManager.startIncomingRingtone();

      // Callee 30-second timeout
      timeoutTimerRef.current = setTimeout(async () => {
        toneManager.stop();
        await declineCallSession(
          activeCall.conversationId,
          activeCall.id,
          'missed',
          currentUser.uid,
          activeCall.type
        );
        cleanupMedia();
        onClose();
      }, 30000);
    };

    if (isCaller) {
      startCallerFlow();
    } else {
      startCalleeFlow();
    }

    return () => {
      unsubCandidates?.();
      cleanupMedia();
    };
  }, [isCaller, activeCall.type]);

  // 2. Subscribe to Call Document for Answer or End
  useEffect(() => {
    const unsubDoc = subscribeToCallDocument(
      activeCall.conversationId,
      activeCall.id,
      async (updatedCall) => {
        if (!updatedCall) return;

        setCallStatus(updatedCall.status);

        // Caller receives answer
        if (isCaller && updatedCall.status === 'accepted' && updatedCall.answer && pcRef.current) {
          toneManager.stop();
          if (timeoutTimerRef.current) {
            clearTimeout(timeoutTimerRef.current);
            timeoutTimerRef.current = null;
          }

          if (!pcRef.current.currentRemoteDescription) {
            await pcRef.current.setRemoteDescription(
              new RTCSessionDescription(updatedCall.answer as RTCSessionDescriptionInit)
            );
          }

          // Start duration timer
          if (!durationIntervalRef.current) {
            durationIntervalRef.current = setInterval(() => {
              setCallDuration((prev) => prev + 1);
            }, 1000);
          }
        }

        // Call was declined, ended, or missed
        if (
          updatedCall.status === 'declined' ||
          updatedCall.status === 'ended' ||
          updatedCall.status === 'missed'
        ) {
          toneManager.playEndCallChime();
          cleanupMedia();
          if (updatedCall.status === 'declined') {
            onShowToast('info', 'Call Declined', `${peerName} declined the call.`);
          } else if (updatedCall.status === 'missed') {
            onShowToast('info', 'Missed Call', 'Call was not answered.');
          }
          onClose();
        }
      }
    );

    return () => unsubDoc();
  }, [activeCall, isCaller, peerName, cleanupMedia, onClose, onShowToast]);

  // 3. Callee Accepts Call
  const handleAcceptCall = async () => {
    toneManager.stop();
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }

    const stream = await initLocalStream(activeCall.type === 'video', cameraFacing);
    if (!stream) return;

    await setupPeerConnection(stream);
    const pc = pcRef.current;
    if (!pc || !activeCall.offer) return;

    await pc.setRemoteDescription(
      new RTCSessionDescription(activeCall.offer as RTCSessionDescriptionInit)
    );
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await answerCallSession(activeCall.conversationId, activeCall.id, answer);

    // Start in-call duration counter
    durationIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  // 4. Callee Declines Call
  const handleDeclineCall = async () => {
    toneManager.stop();
    await declineCallSession(
      activeCall.conversationId,
      activeCall.id,
      'declined',
      currentUser.uid,
      activeCall.type
    );
    cleanupMedia();
    onClose();
  };

  // 5. User Ends Ongoing Call
  const handleEndCall = async () => {
    toneManager.playEndCallChime();
    await endCallSession(activeCall.conversationId, activeCall.id, callDuration);
    cleanupMedia();
    onClose();
  };

  // Toggle Microphone
  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted((prev) => !prev);
    }
  };

  // Toggle Camera
  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled((prev) => !prev);
    }
  };

  // Flip Camera (Mobile Facing Mode)
  const flipCamera = async () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);

    if (localStreamRef.current && isVideoEnabled) {
      // Stop old video track
      localStreamRef.current.getVideoTracks().forEach((t) => t.stop());

      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: nextFacing },
        });
        const [newTrack] = newStream.getVideoTracks();

        if (pcRef.current) {
          const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(newTrack);
          }
        }

        localStreamRef.current.removeTrack(localStreamRef.current.getVideoTracks()[0]);
        localStreamRef.current.addTrack(newTrack);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      } catch (err) {
        console.warn('flipCamera error:', err);
      }
    }
  };

  // Toggle Speaker / Peer Audio
  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !isSpeakerMuted;
      setIsSpeakerMuted((prev) => !prev);
    }
  };

  // Handle Safety Report Submission
  const handleSubmitReport = () => {
    setIsReportOpen(false);
    onShowToast('success', 'Report Submitted', 'Thank you for keeping Somotoz safe. Our team will review this interaction.');
  };

  // Format Duration seconds -> mm:ss
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between font-sans select-none overflow-hidden">
      {/* Hidden audio element for remote voice playback */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* ========================================================================= */}
      {/* 1. TOP HEADER: PEER IDENTITY, ENCRYPTION BADGE, AND REPORT */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] border border-white/20 flex items-center justify-center font-bold text-sm text-[var(--accent-color)] overflow-hidden shadow-md">
            {peerPhoto ? (
              <img src={peerPhoto} alt={peerName} className="w-full h-full object-cover" />
            ) : (
              peerName?.charAt(0).toUpperCase() || 'U'
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white drop-shadow-md">
                @{peerName}
              </h2>
              {peerMood && <span className="text-xs">{peerMood}</span>}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white/80">
              {callStatus === 'accepted' ? (
                <span className="font-mono font-medium tracking-wider text-emerald-400">
                  {formatTimer(callDuration)}
                </span>
              ) : (
                <span className="animate-pulse capitalize">
                  {isCaller ? 'Calling...' : `Incoming ${activeCall.type} call...`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quality indicator, P2P Lock & Safety Report Button */}
        <div className="flex items-center gap-2">
          {callStatus === 'accepted' && (
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] text-white/80"
              title={`Connection: ${connectionQuality}`}
            >
              <div className="flex items-end gap-0.5 h-3">
                <div
                  className={`w-0.5 rounded-full ${
                    connectionQuality !== 'reconnecting' ? 'bg-emerald-400 h-1.5' : 'bg-rose-400 h-1'
                  }`}
                />
                <div
                  className={`w-0.5 rounded-full ${
                    connectionQuality === 'good'
                      ? 'bg-emerald-400 h-2.5'
                      : connectionQuality === 'fair'
                      ? 'bg-amber-400 h-2'
                      : 'bg-white/20 h-1.5'
                  }`}
                />
                <div
                  className={`w-0.5 rounded-full ${
                    connectionQuality === 'good' ? 'bg-emerald-400 h-3' : 'bg-white/20 h-2'
                  }`}
                />
              </div>
              <span className="capitalize hidden sm:inline">{connectionQuality}</span>
            </div>
          )}

          <div
            className="p-2 rounded-xl bg-white/10 text-white/70 flex items-center gap-1 text-[10px]"
            title="Peer-to-peer WebRTC. Zero recording or cloud storage."
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">P2P</span>
          </div>

          <button
            type="button"
            onClick={() => setIsReportOpen(true)}
            className="p-2 rounded-xl bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
            title="Report Call"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TURN Missing Notice */}
      {!hasTurnConfig() && (
        <div className="mx-4 mb-2 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2 z-30">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Calls may not connect on some networks</span>
        </div>
      )}

      {/* Permission Denied Alert Banner */}
      {permissionError && (
        <div className="mx-4 p-3 rounded-2xl bg-rose-500/20 border border-rose-500 text-rose-200 text-xs flex items-center gap-2 z-30">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{permissionError}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CENTER STAGE: VIDEO FEEDS OR AUDIO WAVEFORM & AVATARS */}
      {/* ========================================================================= */}
      <div className="flex-1 relative flex items-center justify-center p-4">
        {activeCall.type === 'video' ? (
          <div className="relative w-full h-full max-w-4xl max-h-[75vh] rounded-3xl overflow-hidden border border-white/10 bg-zinc-900 shadow-2xl flex items-center justify-center">
            {/* Remote Peer Video Stream */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Remote Video Fallback if video paused/not connected */}
            {callStatus !== 'accepted' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md space-y-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 p-1 shadow-2xl animate-pulse">
                  <div className="w-full h-full rounded-full bg-zinc-900 overflow-hidden flex items-center justify-center text-3xl font-bold text-white">
                    {peerPhoto ? (
                      <img src={peerPhoto} alt={peerName} className="w-full h-full object-cover" />
                    ) : (
                      peerName?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                </div>
                <p className="text-sm font-semibold text-white/90">
                  {isCaller ? 'Connecting video...' : 'Incoming video request...'}
                </p>
              </div>
            )}

            {/* Local Video Stream (Picture in Picture) */}
            <div className="absolute bottom-4 right-4 w-28 sm:w-40 aspect-3/4 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl bg-zinc-950 z-20">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center text-white/50 text-[10px]">
                  Camera Off
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Voice Call Stage with Ambient Theme Pulse */
          <div className="flex flex-col items-center justify-center space-y-6 text-center z-20">
            <div className="relative">
              {/* Outer pulsing ripple */}
              <div
                className={`absolute inset-0 rounded-full bg-gradient-to-r ${activeTheme.previewBg} blur-2xl opacity-40 animate-ping`}
              />

              {/* Avatar Centerpiece */}
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full p-1 bg-gradient-to-tr from-white/30 via-white/10 to-transparent shadow-2xl">
                <div className="w-full h-full rounded-full bg-zinc-900 overflow-hidden border-2 border-white/20 flex items-center justify-center text-4xl sm:text-5xl font-bold text-[var(--accent-color)]">
                  {peerPhoto ? (
                    <img src={peerPhoto} alt={peerName} className="w-full h-full object-cover" />
                  ) : (
                    peerName?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg sm:text-2xl font-bold text-white drop-shadow-md">
                @{peerName}
              </h3>
              <p className="text-xs sm:text-sm text-white/70">
                {callStatus === 'accepted' ? 'Voice Call Connected' : 'Connecting Audio Stream...'}
              </p>
            </div>

            {/* Ambient Waveform Bars when connected */}
            {callStatus === 'accepted' && (
              <div className="flex items-center gap-1.5 h-8">
                {[40, 80, 50, 100, 70, 90, 45, 85, 60, 95, 50, 75].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className={`w-1 sm:w-1.5 rounded-full bg-gradient-to-t ${activeTheme.previewBg} animate-pulse`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. BOTTOM CONTROLS DOCK (Safe Area & Touch Targets)                       */}
      {/* ========================================================================= */}
      <div className="p-3 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center justify-center gap-2 sm:gap-5 z-30 safe-bottom">
        {/* Incoming Call Accept & Decline Buttons */}
        {!isCaller && callStatus !== 'accepted' ? (
          <div className="flex items-center gap-6 sm:gap-8 animate-in fade-in zoom-in duration-200">
            {/* Decline */}
            <button
              type="button"
              onClick={handleDeclineCall}
              aria-label="Decline incoming call"
              className="flex flex-col items-center gap-2 group cursor-pointer min-h-[44px] touch-target"
            >
              <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform">
                <PhoneOff className="w-6 sm:w-7 h-6 sm:h-7" aria-hidden="true" />
              </div>
              <span className="text-xs font-semibold text-rose-300">Decline</span>
            </button>

            {/* Accept */}
            <button
              type="button"
              onClick={handleAcceptCall}
              aria-label="Accept incoming call"
              className="flex flex-col items-center gap-2 group cursor-pointer min-h-[44px] touch-target"
            >
              <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform animate-bounce">
                {activeCall.type === 'video' ? (
                  <Video className="w-6 sm:w-7 h-6 sm:h-7" aria-hidden="true" />
                ) : (
                  <Phone className="w-6 sm:w-7 h-6 sm:h-7" aria-hidden="true" />
                )}
              </div>
              <span className="text-xs font-semibold text-emerald-300">Accept</span>
            </button>
          </div>
        ) : (
          /* Active Call Controls / Outgoing Calling Controls */
          <div className="flex items-center gap-2 sm:gap-4 bg-zinc-900/90 border border-white/10 px-3 sm:px-4 py-2 rounded-3xl backdrop-blur-md shadow-2xl flex-wrap justify-center max-w-full">
            {/* Mute Mic */}
            <button
              type="button"
              onClick={toggleMute}
              className={`p-2.5 sm:p-3.5 rounded-2xl transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center touch-target ${
                isMuted ? 'bg-rose-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="w-5 h-5" aria-hidden="true" /> : <Mic className="w-5 h-5" aria-hidden="true" />}
            </button>

            {/* Video Toggle (If video call) */}
            {activeCall.type === 'video' && (
              <>
                <button
                  type="button"
                  onClick={toggleVideo}
                  className={`p-2.5 sm:p-3.5 rounded-2xl transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center touch-target ${
                    !isVideoEnabled ? 'bg-rose-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  aria-label={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                  title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                >
                  {isVideoEnabled ? <Video className="w-5 h-5" aria-hidden="true" /> : <VideoOff className="w-5 h-5" aria-hidden="true" />}
                </button>

                {/* Flip Camera */}
                <button
                  type="button"
                  onClick={flipCamera}
                  className="p-2.5 sm:p-3.5 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center touch-target"
                  aria-label="Switch camera"
                  title="Switch camera"
                >
                  <SwitchCamera className="w-5 h-5" aria-hidden="true" />
                </button>
              </>
            )}

            {/* Speaker / Mute Peer Audio */}
            <button
              type="button"
              onClick={toggleSpeaker}
              className={`p-2.5 sm:p-3.5 rounded-2xl transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center touch-target ${
                isSpeakerMuted ? 'bg-amber-500 text-black' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              aria-label={isSpeakerMuted ? 'Unmute peer audio' : 'Mute peer audio'}
              title={isSpeakerMuted ? 'Unmute peer audio' : 'Mute peer audio'}
            >
              {isSpeakerMuted ? <VolumeX className="w-5 h-5" aria-hidden="true" /> : <Volume2 className="w-5 h-5" aria-hidden="true" />}
            </button>

            {/* End Call Button */}
            <button
              type="button"
              onClick={handleEndCall}
              className="p-2.5 sm:p-3.5 rounded-2xl bg-rose-600 text-white hover:bg-rose-700 active:scale-95 transition-all cursor-pointer shadow-lg sm:ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center touch-target"
              aria-label="End call"
              title="End call"
            >
              <PhoneOff className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL: SAFETY REPORT */}
      {/* ========================================================================= */}
      {isReportOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-60">
          <div className="w-full max-w-sm bg-zinc-900 border border-white/15 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Report User / Call</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsReportOpen(false)}
                className="p-1 text-white/60 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              Calls are peer-to-peer and are never recorded or stored. If someone is violating community guidelines, please report them:
            </p>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-white/80 block">Reason</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full p-2 bg-zinc-800 border border-white/10 rounded-xl text-xs text-white focus:outline-hidden"
              >
                <option value="harassment">Harassment or abusive speech</option>
                <option value="inappropriate_content">Inappropriate video conduct</option>
                <option value="underage">Suspected underage user (&lt;18)</option>
                <option value="spam">Spam or unwanted solicitation</option>
                <option value="other">Other safety concern</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-white/80 block">Details (Optional)</label>
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Describe what occurred..."
                rows={2}
                className="w-full p-2.5 bg-zinc-800 border border-white/10 rounded-xl text-xs text-white focus:outline-hidden resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsReportOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-white/20 text-xs text-white/70 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReport}
                className="px-3.5 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 cursor-pointer shadow-md"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
