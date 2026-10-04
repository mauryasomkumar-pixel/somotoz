import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  ShieldCheck,
  Lock,
  Search,
  Plus,
  Send,
  Image as ImageIcon,
  Mic,
  Smile,
  Copy,
  Check,
  CheckCheck,
  Clock,
  Sparkles,
  Users,
  Radio,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  X,
  Share2,
  Key,
  Play,
  Pause,
  Reply,
  Camera,
  Edit3,
  User,
  Info,
  Flame,
  Volume2,
  Palette,
  MessageSquare,
  UserPlus,
  Ban,
  Unlock,
  Sliders,
  LogOut,
  AlertTriangle,
  AtSign,
  Building
} from 'lucide-react';
import {
  UserProfile,
  SomoUser,
  SomoMessage,
  SomoStory,
  SomoMediaType,
  SomoUserStatus,
  SomoRegisteredAccount,
  SomoChatRequest,
  SomoConnectionStatus
} from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  encryptSomoPayload,
  decryptSomoPayload,
  generateUniqueSomoId,
  INITIAL_REGISTERED_ACCOUNTS,
  INITIAL_CHAT_REQUESTS,
  INITIAL_SOMO_MESSAGES,
  INITIAL_SOMO_STORIES,
  DEFAULT_PRIVACY_SETTINGS
} from '../utils/somoCrypto';
import { SomochatAuthGateway } from './somochat/SomochatAuthGateway';
import { SomochatRequestsModal } from './somochat/SomochatRequestsModal';
import { SomochatAdminConsole } from './somochat/SomochatAdminConsole';
import { SomochatPrivacyModal } from './somochat/SomochatPrivacyModal';

interface SomochatProps {
  currentUser: UserProfile | null;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  onLogActivity?: (mode: string, action: string, tokens?: number) => void;
}

export const Somochat: React.FC<SomochatProps> = ({
  currentUser,
  onShowToast,
  onLogActivity,
}) => {
  const { theme } = useTheme();

  // ============================================================================
  // 1. REGISTERED ACCOUNTS REPOSITORY
  // ============================================================================
  const [registeredAccounts, setRegisteredAccounts] = useState<SomoRegisteredAccount[]>(() => {
    const saved = localStorage.getItem('somotoz_somo_registered_accounts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_REGISTERED_ACCOUNTS;
  });

  useEffect(() => {
    localStorage.setItem('somotoz_somo_registered_accounts', JSON.stringify(registeredAccounts));
  }, [registeredAccounts]);

  // ============================================================================
  // 2. AUTHENTICATION & ACTIVE SESSION STATE
  // ============================================================================
  const [currentAuthUser, setCurrentAuthUser] = useState<SomoRegisteredAccount | null>(() => {
    const saved = localStorage.getItem('somotoz_current_somo_auth');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    // Default to Som Maurya (Master Admin) if user is logged in
    const defaultAdmin = INITIAL_REGISTERED_ACCOUNTS.find((a) => a.somoId === 'SOMO-SOM-001') || INITIAL_REGISTERED_ACCOUNTS[0];
    return defaultAdmin;
  });

  useEffect(() => {
    if (currentAuthUser) {
      localStorage.setItem('somotoz_current_somo_auth', JSON.stringify(currentAuthUser));
    } else {
      localStorage.removeItem('somotoz_current_somo_auth');
    }
  }, [currentAuthUser]);

  // Is Master Admin (Som Maurya)
  const isMasterAdmin = useMemo(() => {
    if (!currentAuthUser) return false;
    const email = currentAuthUser.email?.toLowerCase() || '';
    const name = currentAuthUser.name.toLowerCase();
    return email === 'mauryasomkumar@gmail.com' || name.includes('som') || currentAuthUser.somoId === 'SOMO-SOM-001';
  }, [currentAuthUser]);

  // Is Sub-Admin
  const isSubAdmin = currentAuthUser?.role === 'sub_admin';

  // ============================================================================
  // 3. CHAT REQUESTS & CONNECTION PROTOCOL
  // ============================================================================
  const [chatRequests, setChatRequests] = useState<SomoChatRequest[]>(() => {
    const saved = localStorage.getItem('somotoz_somo_chat_requests');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_CHAT_REQUESTS;
  });

  useEffect(() => {
    localStorage.setItem('somotoz_somo_chat_requests', JSON.stringify(chatRequests));
  }, [chatRequests]);

  // Incoming pending requests for current user
  const incomingPendingRequests = useMemo(() => {
    if (!currentAuthUser) return [];
    return chatRequests.filter(
      (r) => r.toSomoId === currentAuthUser.somoId && r.status === 'pending'
    );
  }, [chatRequests, currentAuthUser]);

  // Helper to determine relationship status between current user and a target Somo ID
  const getConnectionStatus = (targetSomoId: string): SomoConnectionStatus => {
    if (!currentAuthUser) return 'none';
    if (targetSomoId === currentAuthUser.somoId) return 'accepted';
    if (targetSomoId === 'GLOBAL_SPACE') return 'accepted';

    // Check if blocked
    const myBlocked = currentAuthUser.privacySettings?.blockedSomoIds || [];
    if (myBlocked.includes(targetSomoId)) return 'blocked';

    // Check target's blocked list
    const targetAccount = registeredAccounts.find((a) => a.somoId === targetSomoId);
    if (targetAccount?.privacySettings?.blockedSomoIds?.includes(currentAuthUser.somoId)) {
      return 'blocked';
    }

    // Check if accepted connection exists
    const acceptedReq = chatRequests.find(
      (r) =>
        r.status === 'accepted' &&
        ((r.fromSomoId === currentAuthUser.somoId && r.toSomoId === targetSomoId) ||
          (r.fromSomoId === targetSomoId && r.toSomoId === currentAuthUser.somoId))
    );
    if (acceptedReq) return 'accepted';

    // Check outgoing pending
    const outgoing = chatRequests.find(
      (r) => r.status === 'pending' && r.fromSomoId === currentAuthUser.somoId && r.toSomoId === targetSomoId
    );
    if (outgoing) return 'pending_outgoing';

    // Check incoming pending
    const incoming = chatRequests.find(
      (r) => r.status === 'pending' && r.fromSomoId === targetSomoId && r.toSomoId === currentAuthUser.somoId
    );
    if (incoming) return 'pending_incoming';

    return 'none';
  };

  // Directory derived from registered accounts
  const directory: SomoUser[] = useMemo(() => {
    return registeredAccounts.map(({ passwordHash, privacySettings, subAdminPermissions, ...user }) => user);
  }, [registeredAccounts]);

  // ============================================================================
  // 4. MESSAGES STORE & SERVER-SIDE CIPHER REPOSITORY
  // ============================================================================
  const [activeChannelId, setActiveChannelId] = useState<string>('GLOBAL_SPACE');
  const [messages, setMessages] = useState<SomoMessage[]>(() => {
    const saved = localStorage.getItem('somotoz_somo_messages');
    if (saved) {
      try {
        const parsed: SomoMessage[] = JSON.parse(saved);
        return parsed.map((m) => ({
          ...m,
          content: m.content || decryptSomoPayload(m.encryptedContent),
          deliveryStatus: m.deliveryStatus || 'read',
        }));
      } catch (e) {}
    }
    return INITIAL_SOMO_MESSAGES;
  });

  useEffect(() => {
    const encryptedForStorage = messages.map((m) => ({
      ...m,
      encryptedContent: m.encryptedContent || encryptSomoPayload(m.content),
    }));
    localStorage.setItem('somotoz_somo_messages', JSON.stringify(encryptedForStorage));
  }, [messages]);

  // ============================================================================
  // 5. 24-HOUR STORIES ENGINE
  // ============================================================================
  const [stories, setStories] = useState<SomoStory[]>(() => {
    const saved = localStorage.getItem('somotoz_somo_stories');
    if (saved) {
      try {
        const parsed: SomoStory[] = JSON.parse(saved);
        const now = Date.now();
        return parsed.filter((s) => s.expiresAt > now);
      } catch (e) {}
    }
    return INITIAL_SOMO_STORIES;
  });

  useEffect(() => {
    const now = Date.now();
    const activeStories = stories.filter((s) => s.expiresAt > now);
    localStorage.setItem('somotoz_somo_stories', JSON.stringify(activeStories));
  }, [stories]);

  // Filter stories based on privacy audience and blocklists
  const visibleStories = useMemo(() => {
    if (!currentAuthUser) return [];
    const myBlocked = currentAuthUser.privacySettings?.blockedSomoIds || [];

    return stories.filter((story) => {
      if (myBlocked.includes(story.authorSomoId)) return false;
      const authorAcc = registeredAccounts.find((a) => a.somoId === story.authorSomoId);
      if (authorAcc?.privacySettings?.blockedSomoIds?.includes(currentAuthUser.somoId)) return false;

      // If story audience is contacts only, check connection
      if (authorAcc?.privacySettings?.storyAudience === 'accepted_contacts') {
        const status = getConnectionStatus(story.authorSomoId);
        return status === 'accepted' || story.authorSomoId === currentAuthUser.somoId;
      }
      return true;
    });
  }, [stories, currentAuthUser, registeredAccounts, chatRequests]);

  // ============================================================================
  // 6. UI & NAVIGATION MODAL STATES
  // ============================================================================
  const [inputMessage, setInputMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<SomoMessage | null>(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioRecordingSeconds, setAudioRecordingSeconds] = useState(0);
  const [mediaAttachment, setMediaAttachment] = useState<{
    type: SomoMediaType;
    url: string;
    name: string;
  } | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Modals
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [showAdminConsole, setShowAdminConsole] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showDirectoryModal, setShowDirectoryModal] = useState(false);
  const [showStoryCreatorModal, setShowStoryCreatorModal] = useState(false);
  const [activeStoryViewer, setActiveStoryViewer] = useState<{
    storiesList: SomoStory[];
    currentIndex: number;
  } | null>(null);

  // Request Custom Note Modal
  const [requestTargetUser, setRequestTargetUser] = useState<SomoUser | null>(null);
  const [requestCustomNote, setRequestCustomNote] = useState('');

  // Mobile View Navigation State ('list' | 'chat')
  const [mobilePane, setMobilePane] = useState<'list' | 'chat'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  // Story Creator Form
  const [storyMediaType, setStoryMediaType] = useState<'text' | 'image'>('text');
  const [storyTextContent, setStoryTextContent] = useState('');
  const [storyBgGradient, setStoryBgGradient] = useState('from-[#00F0FF] via-[#A855F7] to-[#FF007A]');
  const [storyMediaUrl, setStoryMediaUrl] = useState('');
  const [storyCaption, setStoryCaption] = useState('');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storyFileInputRef = useRef<HTMLInputElement>(null);
  const audioTimerRef = useRef<NodeJS.Timeout | null>(null);
  const storyTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannelId]);

  // Audio timer
  useEffect(() => {
    if (isRecordingAudio) {
      setAudioRecordingSeconds(0);
      audioTimerRef.current = setInterval(() => {
        setAudioRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (audioTimerRef.current) clearInterval(audioTimerRef.current);
    }
    return () => {
      if (audioTimerRef.current) clearInterval(audioTimerRef.current);
    };
  }, [isRecordingAudio]);

  // Story Viewer Timer
  useEffect(() => {
    if (activeStoryViewer) {
      if (storyTimerRef.current) clearInterval(storyTimerRef.current);
      storyTimerRef.current = setInterval(() => {
        setActiveStoryViewer((prev) => {
          if (!prev) return null;
          if (prev.currentIndex < prev.storiesList.length - 1) {
            return { ...prev, currentIndex: prev.currentIndex + 1 };
          }
          return null;
        });
      }, 5000);
    } else {
      if (storyTimerRef.current) clearInterval(storyTimerRef.current);
    }
    return () => {
      if (storyTimerRef.current) clearInterval(storyTimerRef.current);
    };
  }, [activeStoryViewer]);

  // ============================================================================
  // 7. ACTION HANDLERS
  // ============================================================================

  // Send Message with WhatsApp double-tick simulation
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentAuthUser) return;
    if (!inputMessage.trim() && !mediaAttachment) return;

    // Check if target peer is blocked or not connected
    if (activeChannelId !== 'GLOBAL_SPACE') {
      const status = getConnectionStatus(activeChannelId);
      if (status === 'blocked') {
        onShowToast('error', 'Messaging Restricted', 'This peer is blocked. Unblock to resume messaging.');
        return;
      }
      if (status !== 'accepted') {
        onShowToast('error', 'Connection Required', 'You must be connected with this peer to send direct messages.');
        return;
      }
    }

    const rawContent = inputMessage.trim();
    const messageId = `somo_msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const encryptedPayload = encryptSomoPayload(rawContent || `[${mediaAttachment?.type.toUpperCase()}]`);

    const newMsg: SomoMessage = {
      id: messageId,
      senderId: currentAuthUser.id,
      senderSomoId: currentAuthUser.somoId,
      senderName: currentAuthUser.name,
      senderAvatar: currentAuthUser.avatar,
      receiverSomoId: activeChannelId,
      content: rawContent,
      encryptedContent: encryptedPayload,
      isEncrypted: true,
      timestamp: Date.now(),
      deliveryStatus: 'sending',
      mediaType: mediaAttachment?.type || 'text',
      mediaUrl: mediaAttachment?.url,
      mediaName: mediaAttachment?.name,
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName,
            senderSomoId: replyingTo.senderSomoId,
            content: replyingTo.content,
            mediaType: replyingTo.mediaType,
          }
        : undefined,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');
    setMediaAttachment(null);
    setReplyingTo(null);

    // WhatsApp-Style delivery tick progressions
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, deliveryStatus: 'sent' } : m))
      );
    }, 250);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, deliveryStatus: 'delivered' } : m))
      );
    }, 600);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, deliveryStatus: 'read' } : m))
      );
    }, 1200);

    if (onLogActivity) {
      onLogActivity('somochat', `Transmitted encrypted message to ${activeChannelId}`);
    }
  };

  // Send Connection Chat Request
  const handleSendChatRequest = (targetUser: SomoUser, noteText: string = '') => {
    if (!currentAuthUser) return;
    if (targetUser.somoId === currentAuthUser.somoId) return;

    // Check if request already exists
    const existing = chatRequests.find(
      (r) =>
        (r.fromSomoId === currentAuthUser.somoId && r.toSomoId === targetUser.somoId) ||
        (r.fromSomoId === targetUser.somoId && r.toSomoId === currentAuthUser.somoId)
    );

    if (existing && existing.status === 'pending') {
      onShowToast('info', 'Request Pending', 'A connection request is already awaiting response.');
      return;
    }

    const newRequest: SomoChatRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fromSomoId: currentAuthUser.somoId,
      fromName: currentAuthUser.name,
      fromAvatar: currentAuthUser.avatar,
      toSomoId: targetUser.somoId,
      toName: targetUser.name,
      note: noteText.trim() || undefined,
      status: 'pending',
      createdAt: Date.now(),
    };

    setChatRequests((prev) => [...prev, newRequest]);
    setRequestTargetUser(null);
    setRequestCustomNote('');
    onShowToast('success', 'Invitation Dispatched', `Chat request sent to ${targetUser.name} (${targetUser.somoId})!`);
  };

  // Accept Connection Request
  const handleAcceptRequest = (request: SomoChatRequest) => {
    setChatRequests((prev) =>
      prev.map((r) =>
        r.id === request.id ? { ...r, status: 'accepted', updatedAt: Date.now() } : r
      )
    );
    // Automatically switch active channel to the requester
    const otherSomoId = request.fromSomoId === currentAuthUser?.somoId ? request.toSomoId : request.fromSomoId;
    setActiveChannelId(otherSomoId);
    setMobilePane('chat');
  };

  // Decline Connection Request
  const handleDeclineRequest = (requestId: string) => {
    setChatRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  // Block User
  const handleBlockUser = (targetSomoId: string) => {
    if (!currentAuthUser) return;
    const currentBlocked = currentAuthUser.privacySettings?.blockedSomoIds || [];
    if (currentBlocked.includes(targetSomoId)) return;

    const updatedAccount: SomoRegisteredAccount = {
      ...currentAuthUser,
      privacySettings: {
        ...currentAuthUser.privacySettings,
        blockedSomoIds: [...currentBlocked, targetSomoId],
      },
    };

    setCurrentAuthUser(updatedAccount);
    setRegisteredAccounts((prev) =>
      prev.map((a) => (a.somoId === updatedAccount.somoId ? updatedAccount : a))
    );

    // Cancel any pending requests
    setChatRequests((prev) =>
      prev.filter(
        (r) =>
          !(
            (r.fromSomoId === currentAuthUser.somoId && r.toSomoId === targetSomoId) ||
            (r.fromSomoId === targetSomoId && r.toSomoId === currentAuthUser.somoId)
          )
      )
    );
  };

  // Unblock User
  const handleUnblockUser = (targetSomoId: string) => {
    if (!currentAuthUser) return;
    const currentBlocked = currentAuthUser.privacySettings?.blockedSomoIds || [];
    const updatedAccount: SomoRegisteredAccount = {
      ...currentAuthUser,
      privacySettings: {
        ...currentAuthUser.privacySettings,
        blockedSomoIds: currentBlocked.filter((id) => id !== targetSomoId),
      },
    };

    setCurrentAuthUser(updatedAccount);
    setRegisteredAccounts((prev) =>
      prev.map((a) => (a.somoId === updatedAccount.somoId ? updatedAccount : a))
    );
  };

  // Broadcast System Announcement across Matrix
  const handleBroadcastAnnouncement = (title: string, messageBody: string) => {
    if (!currentAuthUser) return;
    const broadcastMsg: SomoMessage = {
      id: `somo_broadcast_${Date.now()}`,
      senderId: currentAuthUser.id,
      senderSomoId: currentAuthUser.somoId,
      senderName: `⚡ SYSTEM BROADCAST [${currentAuthUser.name}]`,
      senderAvatar: currentAuthUser.avatar,
      receiverSomoId: 'GLOBAL_SPACE',
      content: `📢 **${title}**\n\n${messageBody}`,
      encryptedContent: encryptSomoPayload(`📢 ${title} - ${messageBody}`),
      isEncrypted: true,
      timestamp: Date.now(),
      deliveryStatus: 'read',
      mediaType: 'text',
    };
    setMessages((prev) => [...prev, broadcastMsg]);
    setActiveChannelId('GLOBAL_SPACE');
  };

  // Publish 24-Hour Story
  const handlePublishStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAuthUser) return;

    if (storyMediaType === 'text' && !storyTextContent.trim()) {
      onShowToast('error', 'Story Content Required', 'Please enter text for your story.');
      return;
    }

    if (storyMediaType === 'image' && !storyMediaUrl) {
      onShowToast('error', 'Image Required', 'Please attach or select an image for your story.');
      return;
    }

    const newStory: SomoStory = {
      id: `story_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      authorId: currentAuthUser.id,
      authorSomoId: currentAuthUser.somoId,
      authorName: currentAuthUser.name,
      authorAvatar: currentAuthUser.avatar,
      mediaType: storyMediaType,
      textContent: storyTextContent.trim(),
      bgGradient: storyBgGradient,
      mediaUrl: storyMediaUrl,
      caption: storyCaption.trim(),
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      viewsCount: 1,
      viewers: [currentAuthUser.somoId],
    };

    setStories((prev) => [newStory, ...prev]);
    setShowStoryCreatorModal(false);
    setStoryTextContent('');
    setStoryMediaUrl('');
    setStoryCaption('');
    onShowToast('success', '24H Story Published', 'Your story is live for 24 hours across the matrix!');
  };

  // Active Channel Target Peer
  const activePeer = useMemo(() => {
    if (activeChannelId === 'GLOBAL_SPACE') return null;
    return directory.find((u) => u.somoId === activeChannelId) || null;
  }, [activeChannelId, directory]);

  // Channel Messages Filtered
  const currentChatMessages = useMemo(() => {
    if (!currentAuthUser) return [];
    if (activeChannelId === 'GLOBAL_SPACE') {
      return messages.filter((m) => m.receiverSomoId === 'GLOBAL_SPACE');
    }
    return messages.filter(
      (m) =>
        (m.senderSomoId === currentAuthUser.somoId && m.receiverSomoId === activeChannelId) ||
        (m.senderSomoId === activeChannelId && m.receiverSomoId === currentAuthUser.somoId)
    );
  }, [messages, activeChannelId, currentAuthUser]);

  // Connected peers list (accepted contacts)
  const connectedPeers = useMemo(() => {
    if (!currentAuthUser) return [];
    return directory.filter((peer) => {
      if (peer.somoId === currentAuthUser.somoId) return false;
      return getConnectionStatus(peer.somoId) === 'accepted';
    });
  }, [directory, currentAuthUser, chatRequests]);

  // If user is not authenticated in Somochat, show the Gateway
  if (!currentAuthUser) {
    return (
      <SomochatAuthGateway
        onLoginSuccess={(account) => {
          setCurrentAuthUser(account);
          setRegisteredAccounts((prev) => {
            if (!prev.some((a) => a.somoId === account.somoId)) {
              return [...prev, account];
            }
            return prev;
          });
        }}
        registeredAccounts={registeredAccounts}
        onRegisterAccount={(newAcc) => {
          setRegisteredAccounts((prev) => [...prev, newAcc]);
        }}
        onShowToast={onShowToast}
      />
    );
  }

  const activeChannelConnectionStatus = activePeer ? getConnectionStatus(activePeer.somoId) : 'accepted';

  return (
    <div className="w-full h-full min-h-[calc(100vh-140px)] flex flex-col items-center justify-start p-2 sm:p-4 lg:p-8 select-none font-mono">
      
      {/* Strict 1.25cm / 48px Desktop Workspace Container */}
      <div className="w-full max-w-7xl h-[calc(100vh-130px)] min-h-[600px] bg-[var(--bg-card)]/90 backdrop-blur-2xl border border-[var(--border-color)] rounded-3xl shadow-2xl overflow-hidden flex flex-col relative">

        {/* ========================================================================= */}
        {/* TOP MATRIX NAVIGATION & CONTROL BAR                                       */}
        {/* ========================================================================= */}
        <div className="h-14 sm:h-16 px-3 sm:px-6 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-card)] shrink-0 z-20">
          
          {/* Left Brand Identity */}
          <div className="flex items-center space-x-3">
            {mobilePane === 'chat' && (
              <button
                type="button"
                onClick={() => setMobilePane('list')}
                className="md:hidden p-1.5 rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-[#00F0FF] via-[#A855F7] to-[#FF007A] p-[2px] shadow-lg shadow-[#00F0FF]/25">
              <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center text-[#00F0FF]">
                <Shield className="w-5 h-5" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black text-[var(--text-primary)] tracking-tight">
                  SOMOCHAT
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#00FF41]/15 text-[#00FF41] border border-[#00FF41]/40 font-bold hidden sm:inline-block">
                  E2EE MESH
                </span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] font-mono hidden sm:block">
                IIT Madras Cyber Architecture • Zero-AI Human Matrix
              </p>
            </div>
          </div>

          {/* Right Action Icons & Profile Control */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5">
            
            {/* Incoming Requests Badge Button */}
            <button
              type="button"
              onClick={() => setShowRequestsModal(true)}
              className="relative px-2.5 sm:px-3 py-1.5 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <UserPlus className="w-4 h-4 text-[#00F0FF]" />
              <span className="hidden sm:inline">Requests</span>
              {incomingPendingRequests.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#FF007A] text-white text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
                  {incomingPendingRequests.length}
                </span>
              )}
            </button>

            {/* Peer Discovery Search Button */}
            <button
              type="button"
              onClick={() => setShowDirectoryModal(true)}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Search className="w-4 h-4 text-[#A855F7]" />
              <span className="hidden sm:inline">Find Peers</span>
            </button>

            {/* Admin Console Button (Master Admin & Sub-Admins) */}
            {(isMasterAdmin || isSubAdmin) && (
              <button
                type="button"
                onClick={() => setShowAdminConsole(true)}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00F0FF]/20 to-[#A855F7]/20 hover:from-[#00F0FF]/30 hover:to-[#A855F7]/30 border border-[#00F0FF]/40 text-xs font-bold text-[#00F0FF] flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
              >
                <ShieldCheck className="w-4 h-4 text-[#00F0FF]" />
                <span className="hidden sm:inline">{isMasterAdmin ? 'Master Console' : 'Sub-Admin'}</span>
              </button>
            )}

            {/* My Profile Pill & Privacy Control */}
            <button
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="p-1 rounded-2xl bg-[var(--bg-input)] hover:bg-[var(--border-color)] border border-[var(--border-color)] flex items-center space-x-2 cursor-pointer transition-all pr-2"
            >
              <img
                src={currentAuthUser.avatar}
                alt={currentAuthUser.name}
                className="w-7 h-7 rounded-full object-cover border border-[#00F0FF]/50"
              />
              <div className="text-left hidden lg:block">
                <div className="text-[11px] font-bold text-[var(--text-primary)] truncate max-w-[100px]">
                  {currentAuthUser.name.split(' ')[0]}
                </div>
                <div className="text-[9px] text-[#00F0FF] font-mono">
                  {currentAuthUser.somoId}
                </div>
              </div>
              <Sliders className="w-3.5 h-3.5 text-[var(--text-muted)] hidden sm:block" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN SPLIT WORKSPACE: SIDEBAR + CHAT FEED                                 */}
        {/* ========================================================================= */}
        <div className="flex-1 flex overflow-hidden relative">

          {/* ======================================================================= */}
          {/* LEFT CHANNEL & DIRECT MESSAGES SIDEBAR                                   */}
          {/* ======================================================================= */}
          <div
            className={`w-full md:w-80 lg:w-96 border-r border-[var(--border-color)] bg-[var(--bg-card)]/50 flex flex-col shrink-0 ${
              mobilePane === 'chat' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* 24-Hour Expiring Stories Rail */}
            <div className="p-3 border-b border-[var(--border-color)] bg-black/20 overflow-x-auto flex items-center space-x-3 shrink-0">
              {/* Add Story Button */}
              <button
                type="button"
                onClick={() => setShowStoryCreatorModal(true)}
                className="flex flex-col items-center shrink-0 group cursor-pointer"
              >
                <div className="w-13 h-13 rounded-full border-2 border-dashed border-[#00F0FF] p-0.5 relative group-hover:scale-105 transition-transform flex items-center justify-center bg-[var(--bg-input)]">
                  <img
                    src={currentAuthUser.avatar}
                    alt="Me"
                    className="w-full h-full rounded-full object-cover opacity-80"
                  />
                  <div className="w-5 h-5 rounded-full bg-[#00F0FF] text-black absolute -bottom-1 -right-1 flex items-center justify-center font-bold text-xs shadow-md">
                    +
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[var(--text-muted)] mt-1 group-hover:text-[#00F0FF]">
                  My Story
                </span>
              </button>

              {/* Active Stories List */}
              {visibleStories.map((story, idx) => (
                <button
                  key={story.id}
                  type="button"
                  onClick={() =>
                    setActiveStoryViewer({
                      storiesList: visibleStories,
                      currentIndex: idx,
                    })
                  }
                  className="flex flex-col items-center shrink-0 group cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-full p-[2px] bg-gradient-to-tr from-[#00F0FF] via-[#A855F7] to-[#FF007A] group-hover:scale-105 transition-transform shadow-sm">
                    <img
                      src={story.authorAvatar}
                      alt={story.authorName}
                      className="w-full h-full rounded-full object-cover border-2 border-black"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-[var(--text-primary)] mt-1 truncate max-w-[55px]">
                    {story.authorName.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>

            {/* Channels & Direct Conversations List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Public Matrix
              </div>

              {/* Global Matrix Channel */}
              <button
                type="button"
                onClick={() => {
                  setActiveChannelId('GLOBAL_SPACE');
                  setMobilePane('chat');
                }}
                className={`w-full p-2.5 rounded-2xl flex items-center space-x-3 transition-all cursor-pointer text-left ${
                  activeChannelId === 'GLOBAL_SPACE'
                    ? 'bg-gradient-to-r from-[#00F0FF]/15 to-[#A855F7]/15 border border-[#00F0FF]/40 shadow-sm'
                    : 'hover:bg-[var(--bg-input)] border border-transparent'
                }`}
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00F0FF] to-[#A855F7] p-[2px] shrink-0">
                  <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center text-[#00F0FF]">
                    <Radio className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex-1 truncate">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <span># global-matrix</span>
                      <span className="text-[8px] px-1 py-0.2 rounded bg-[#00FF41]/20 text-[#00FF41] font-bold">
                        PUBLIC
                      </span>
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                    Open network chatter & master broadcasts
                  </p>
                </div>
              </button>

              <div className="px-2 pt-3 pb-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center justify-between">
                <span>Direct Human Chats</span>
                <span className="text-[#00F0FF]">{connectedPeers.length} Connected</span>
              </div>

              {/* Direct Peer Conversations */}
              {connectedPeers.length === 0 ? (
                <div className="p-4 text-center text-[var(--text-muted)] text-[11px] space-y-2">
                  <p>No direct peer chats yet.</p>
                  <button
                    type="button"
                    onClick={() => setShowDirectoryModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-[var(--bg-input)] hover:border-[#00F0FF] border border-[var(--border-color)] text-xs text-[#00F0FF] font-bold cursor-pointer"
                  >
                    + Search & Connect
                  </button>
                </div>
              ) : (
                connectedPeers.map((peer) => {
                  const isSelected = activeChannelId === peer.somoId;
                  const lastPeerMsg = messages
                    .filter(
                      (m) =>
                        (m.senderSomoId === currentAuthUser.somoId && m.receiverSomoId === peer.somoId) ||
                        (m.senderSomoId === peer.somoId && m.receiverSomoId === currentAuthUser.somoId)
                    )
                    .slice(-1)[0];

                  return (
                    <button
                      key={peer.somoId}
                      type="button"
                      onClick={() => {
                        setActiveChannelId(peer.somoId);
                        setMobilePane('chat');
                      }}
                      className={`w-full p-2.5 rounded-2xl flex items-center space-x-3 transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#00F0FF]/15 to-[#A855F7]/15 border border-[#00F0FF]/40 shadow-sm'
                          : 'hover:bg-[var(--bg-input)] border border-transparent'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={peer.avatar}
                          alt={peer.name}
                          className="w-10 h-10 rounded-full object-cover border border-[#00F0FF]/30"
                        />
                        <div
                          className={`w-3 h-3 rounded-full absolute -bottom-0.5 -right-0.5 border-2 border-black ${
                            peer.status === 'online'
                              ? 'bg-[#00FF41]'
                              : peer.status === 'coding'
                              ? 'bg-[#00F0FF]'
                              : peer.status === 'vibing'
                              ? 'bg-[#FF007A]'
                              : 'bg-gray-500'
                          }`}
                        />
                      </div>

                      <div className="flex-1 truncate">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                            {peer.name}
                          </span>
                          {lastPeerMsg && (
                            <span className="text-[9px] text-[var(--text-muted)]">
                              {new Date(lastPeerMsg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-[10px] text-[var(--text-muted)] truncate flex items-center gap-1">
                            {lastPeerMsg?.senderSomoId === currentAuthUser.somoId && (
                              <CheckCheck
                                className={`w-3 h-3 ${
                                  lastPeerMsg.deliveryStatus === 'read'
                                    ? 'text-[#00F0FF]'
                                    : 'text-[var(--text-muted)]'
                                }`}
                              />
                            )}
                            <span>{lastPeerMsg?.content || peer.statusText}</span>
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ======================================================================= */}
          {/* RIGHT CHAT STREAM & INPUT DOCK                                          */}
          {/* ======================================================================= */}
          <div
            className={`flex-1 flex flex-col bg-[var(--bg-card)]/30 overflow-hidden ${
              mobilePane === 'list' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Active Header */}
            <div className="h-14 px-4 border-b border-[var(--border-color)] bg-[var(--bg-card)]/80 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3 truncate">
                {activeChannelId === 'GLOBAL_SPACE' ? (
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00F0FF] to-[#A855F7] flex items-center justify-center text-black font-black text-xs">
                      #
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <span>global-matrix</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00FF41]/20 text-[#00FF41]">
                          Active Mesh
                        </span>
                      </div>
                      <p className="text-[9px] text-[var(--text-muted)]">
                        Zero-Knowledge Broadcast Relay
                      </p>
                    </div>
                  </div>
                ) : activePeer ? (
                  <div className="flex items-center space-x-2.5 truncate">
                    <img
                      src={activePeer.avatar}
                      alt={activePeer.name}
                      className="w-8 h-8 rounded-full object-cover border border-[#00F0FF]"
                    />
                    <div className="truncate">
                      <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <span>{activePeer.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00F0FF]/15 text-[#00F0FF] font-mono">
                          {activePeer.somoId}
                        </span>
                      </div>
                      <p className="text-[9px] text-[var(--text-muted)] truncate">
                        {activePeer.statusText}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Peer Actions Menu */}
              {activePeer && (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeChannelConnectionStatus === 'blocked') {
                        handleUnblockUser(activePeer.somoId);
                        onShowToast('success', 'User Unblocked', `Unblocked ${activePeer.name}.`);
                      } else {
                        handleBlockUser(activePeer.somoId);
                        onShowToast('error', 'User Blocked', `Blocked ${activePeer.name}.`);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer ${
                      activeChannelConnectionStatus === 'blocked'
                        ? 'bg-[#00FF41]/20 text-[#00FF41] border border-[#00FF41]/40'
                        : 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25'
                    }`}
                  >
                    <Ban className="w-3 h-3" />
                    <span>{activeChannelConnectionStatus === 'blocked' ? 'Unblock' : 'Block'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
              
              {/* Encryption Banner */}
              <div className="max-w-md mx-auto my-2 p-2 rounded-2xl bg-black/40 border border-[#00F0FF]/20 text-center">
                <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-[#00F0FF]">
                  <Lock className="w-3 h-3" />
                  <span>SERVER-SIDE ZERO-KNOWLEDGE ENCRYPTION ACTIVE</span>
                </div>
                <p className="text-[9px] text-[var(--text-muted)] mt-0.5">
                  Messages are rendered clean in memory and transformed to ciphertext in database storage.
                </p>
              </div>

              {/* Blocked or Non-Connected Notice */}
              {activePeer && activeChannelConnectionStatus === 'blocked' && (
                <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-center space-y-2 max-w-md mx-auto">
                  <Ban className="w-8 h-8 mx-auto text-red-400" />
                  <p className="text-xs font-bold text-red-300">Peer Connection Blocked</p>
                  <p className="text-[10px] text-red-400/80">
                    You cannot send or receive messages with this peer while blocked.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleUnblockUser(activePeer.somoId)}
                    className="px-4 py-1.5 rounded-xl bg-[#00FF41] text-black font-black text-xs cursor-pointer shadow-md"
                  >
                    Unblock {activePeer.name}
                  </button>
                </div>
              )}

              {/* Messages Render */}
              {currentChatMessages.map((msg) => {
                const isMe = msg.senderSomoId === currentAuthUser.somoId;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-end space-x-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMe && (
                      <img
                        src={msg.senderAvatar}
                        alt={msg.senderName}
                        className="w-7 h-7 rounded-full object-cover border border-[#00F0FF]/30 shrink-0 mb-1"
                      />
                    )}

                    <div
                      className={`max-w-[85%] sm:max-w-md rounded-2xl p-3 shadow-md relative ${
                        isMe
                          ? 'bg-gradient-to-r from-[#00F0FF]/25 to-[#A855F7]/25 border border-[#00F0FF]/50 text-[var(--text-primary)] rounded-br-none'
                          : 'bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-bl-none'
                      }`}
                    >
                      {/* Sender Name in Group/Global */}
                      {!isMe && activeChannelId === 'GLOBAL_SPACE' && (
                        <div className="text-[10px] font-bold text-[#00F0FF] mb-1 flex items-center gap-1">
                          <span>{msg.senderName}</span>
                          <span className="text-[8px] text-[var(--text-muted)] font-mono">
                            {msg.senderSomoId}
                          </span>
                        </div>
                      )}

                      {/* Reply Reference Preview */}
                      {msg.replyTo && (
                        <div className="mb-2 p-1.5 rounded-lg bg-black/30 border-l-2 border-[#00F0FF] text-[10px] text-[var(--text-secondary)] truncate">
                          <strong className="text-[#00F0FF]">{msg.replyTo.senderName}:</strong> {msg.replyTo.content}
                        </div>
                      )}

                      {/* Media Image Attachment */}
                      {msg.mediaType === 'image' && msg.mediaUrl && (
                        <div className="mb-2 rounded-xl overflow-hidden border border-[var(--border-color)]">
                          <img
                            src={msg.mediaUrl}
                            alt="Attachment"
                            className="max-h-60 w-full object-cover"
                          />
                        </div>
                      )}

                      {/* Audio Voice Note */}
                      {msg.mediaType === 'audio' && (
                        <div className="flex items-center space-x-2 py-1">
                          <button
                            type="button"
                            onClick={() =>
                              setPlayingAudioId(playingAudioId === msg.id ? null : msg.id)
                            }
                            className="w-8 h-8 rounded-full bg-[#00F0FF] text-black flex items-center justify-center cursor-pointer shadow-sm"
                          >
                            {playingAudioId === msg.id ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4 ml-0.5" />
                            )}
                          </button>
                          <div className="flex-1">
                            <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                              <div
                                className={`h-full bg-gradient-to-r from-[#00F0FF] to-[#A855F7] ${
                                  playingAudioId === msg.id ? 'w-3/4 animate-pulse' : 'w-1/3'
                                }`}
                              />
                            </div>
                            <span className="text-[9px] text-[var(--text-muted)] mt-0.5 block">
                              Voice Note (E2EE Audio)
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Text Content */}
                      {msg.content && (
                        <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap select-text">
                          {msg.content}
                        </p>
                      )}

                      {/* Timestamp & Delivery Double-Ticks */}
                      <div className="flex items-center justify-end space-x-1.5 mt-1 text-[9px] text-[var(--text-muted)]">
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>

                        {isMe && (
                          <span>
                            {msg.deliveryStatus === 'sending' && <Clock className="w-3 h-3 text-[var(--text-muted)]" />}
                            {msg.deliveryStatus === 'sent' && <Check className="w-3 h-3 text-[var(--text-muted)]" />}
                            {msg.deliveryStatus === 'delivered' && <CheckCheck className="w-3 h-3 text-[var(--text-muted)]" />}
                            {msg.deliveryStatus === 'read' && <CheckCheck className="w-3 h-3 text-[#00F0FF]" />}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Reply Bar */}
            {replyingTo && (
              <div className="px-4 py-2 bg-[var(--bg-input)] border-t border-[var(--border-color)] flex items-center justify-between text-xs">
                <div className="truncate">
                  <span className="text-[#00F0FF] font-bold">Replying to {replyingTo.senderName}:</span>{' '}
                  <span className="text-[var(--text-secondary)] truncate">{replyingTo.content}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="p-1 text-[var(--text-muted)] hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Media Attachment Bar */}
            {mediaAttachment && (
              <div className="px-4 py-2 bg-[var(--bg-input)] border-t border-[var(--border-color)] flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 truncate">
                  <ImageIcon className="w-4 h-4 text-[#00F0FF]" />
                  <span className="text-[var(--text-primary)] font-bold truncate">{mediaAttachment.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMediaAttachment(null)}
                  className="p-1 text-[var(--text-muted)] hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* ===================================================================== */}
            {/* ANCHORED NON-CLIPPING INPUT DOCK                                      */}
            {/* ===================================================================== */}
            <div className="p-3 sm:p-4 bg-[var(--bg-card)] border-t border-[var(--border-color)] shrink-0">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                
                {/* Image attachment button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[#00F0FF] transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        setMediaAttachment({
                          type: 'image',
                          url: reader.result as string,
                          name: file.name,
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />

                {/* Voice Note Simulation Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (isRecordingAudio) {
                      setIsRecordingAudio(false);
                      setMediaAttachment({
                        type: 'audio',
                        url: 'voice_audio_stream',
                        name: `Voice_Note_${audioRecordingSeconds}s.wav`,
                      });
                      onShowToast('info', 'Audio Recorded', `Recorded ${audioRecordingSeconds}s voice note.`);
                    } else {
                      setIsRecordingAudio(true);
                    }
                  }}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    isRecordingAudio
                      ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40'
                      : 'bg-[var(--bg-input)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[#00F0FF]'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </button>

                {/* Input Text Box */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    disabled={activePeer && activeChannelConnectionStatus === 'blocked'}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={
                      isRecordingAudio
                        ? `Recording Audio Voice Note (${audioRecordingSeconds}s)...`
                        : activePeer && activeChannelConnectionStatus === 'blocked'
                        ? 'Messaging blocked for this peer'
                        : `Transmit to ${activeChannelId === 'GLOBAL_SPACE' ? '# global-matrix' : activePeer?.name}...`
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[#00F0FF] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] outline-none transition-colors"
                  />
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={
                    (!inputMessage.trim() && !mediaAttachment) ||
                    (activePeer && activeChannelConnectionStatus === 'blocked')
                  }
                  className="p-2.5 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#A855F7] text-black font-black hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-[#00F0FF]/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: PEER DIRECTORY & SEARCH                                          */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showDirectoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#00F0FF]/15 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF]">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[var(--text-primary)]">
                      SOMOTOZ USER DIRECTORY
                    </h3>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      Verified real human discovery by Somo ID or name
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDirectoryModal(false)}
                  className="w-8 h-8 rounded-full bg-[var(--bg-input)] hover:bg-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="my-3 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Name, Username, or Somo ID..."
                  className="w-full px-3 py-2 pl-9 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] outline-none focus:border-[#00F0FF]"
                />
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-3" />
              </div>

              {/* Directory List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {directory
                  .filter((u) => {
                    if (u.somoId === currentAuthUser.somoId) return false;
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      u.name.toLowerCase().includes(q) ||
                      u.somoId.toLowerCase().includes(q) ||
                      u.username?.toLowerCase().includes(q) ||
                      u.bio?.toLowerCase().includes(q)
                    );
                  })
                  .map((peer) => {
                    const status = getConnectionStatus(peer.somoId);

                    return (
                      <div
                        key={peer.somoId}
                        className="p-3 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-color)] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center space-x-3 truncate">
                          <img
                            src={peer.avatar}
                            alt={peer.name}
                            className="w-10 h-10 rounded-full object-cover border border-[#00F0FF]/30 shrink-0"
                          />
                          <div className="truncate">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-[var(--text-primary)]">
                                {peer.name}
                              </span>
                              <span className="text-[8px] px-1.5 py-0.2 rounded bg-[#00F0FF]/20 text-[#00F0FF] font-mono">
                                {peer.somoId}
                              </span>
                            </div>
                            <p className="text-[10px] text-[var(--text-muted)] truncate">
                              {peer.bio || peer.statusText}
                            </p>
                          </div>
                        </div>

                        {/* Connection Action */}
                        <div className="shrink-0">
                          {status === 'accepted' && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveChannelId(peer.somoId);
                                setShowDirectoryModal(false);
                                setMobilePane('chat');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[#00FF41]/20 text-[#00FF41] border border-[#00FF41]/40 text-xs font-bold hover:bg-[#00FF41]/30 cursor-pointer"
                            >
                              Open Chat
                            </button>
                          )}

                          {status === 'pending_outgoing' && (
                            <span className="text-[10px] px-2.5 py-1 rounded-xl bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Sent</span>
                            </span>
                          )}

                          {status === 'pending_incoming' && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowDirectoryModal(false);
                                setShowRequestsModal(true);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-[#00F0FF] text-black text-xs font-black hover:brightness-110 cursor-pointer shadow-sm"
                            >
                              Respond
                            </button>
                          )}

                          {status === 'blocked' && (
                            <button
                              type="button"
                              onClick={() => {
                                handleUnblockUser(peer.somoId);
                                onShowToast('success', 'User Unblocked', `Unblocked ${peer.name}.`);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold cursor-pointer"
                            >
                              Unblock
                            </button>
                          )}

                          {status === 'none' && (
                            <button
                              type="button"
                              onClick={() => {
                                setRequestTargetUser(peer);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#A855F7] text-black text-xs font-black hover:brightness-110 cursor-pointer shadow-sm"
                            >
                              + Request
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: SEND CHAT REQUEST NOTE PROMPT                                    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {requestTargetUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-[var(--bg-card)] border border-[#00F0FF]/50 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={requestTargetUser.avatar}
                  alt={requestTargetUser.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#00F0FF]"
                />
                <div>
                  <h3 className="text-base font-black text-[var(--text-primary)]">
                    SEND CHAT INVITATION
                  </h3>
                  <p className="text-xs text-[#00F0FF] font-mono">
                    To: {requestTargetUser.name} ({requestTargetUser.somoId})
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Optional Introduction Note
                </label>
                <textarea
                  rows={3}
                  value={requestCustomNote}
                  onChange={(e) => setRequestCustomNote(e.target.value)}
                  placeholder="e.g. Hi! Loved your research on computational models. Let's connect on Somochat!"
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] outline-none resize-none focus:border-[#00F0FF]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRequestTargetUser(null)}
                  className="flex-1 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-muted)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChatRequest(requestTargetUser, requestCustomNote)}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#A855F7] text-black text-xs font-black hover:brightness-110 cursor-pointer shadow-md"
                >
                  Send Invitation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 3: CONNECTION REQUESTS MODAL                                        */}
      {/* ========================================================================= */}
      <SomochatRequestsModal
        isOpen={showRequestsModal}
        onClose={() => setShowRequestsModal(false)}
        mySomoUser={currentAuthUser}
        allRequests={chatRequests}
        onAcceptRequest={handleAcceptRequest}
        onDeclineRequest={handleDeclineRequest}
        onBlockUser={handleBlockUser}
        onUnblockUser={handleUnblockUser}
        directory={directory}
        onShowToast={onShowToast}
      />

      {/* ========================================================================= */}
      {/* MODAL 4: MASTER ADMIN & SUB-ADMIN CONSOLE                                 */}
      {/* ========================================================================= */}
      <SomochatAdminConsole
        isOpen={showAdminConsole}
        onClose={() => setShowAdminConsole(false)}
        currentUser={currentAuthUser}
        allAccounts={registeredAccounts}
        onUpdateAccount={(updated) => {
          setRegisteredAccounts((prev) =>
            prev.map((a) => (a.somoId === updated.somoId ? updated : a))
          );
          if (updated.somoId === currentAuthUser.somoId) {
            setCurrentAuthUser(updated);
          }
        }}
        onBroadcastAnnouncement={handleBroadcastAnnouncement}
        onShowToast={onShowToast}
      />

      {/* ========================================================================= */}
      {/* MODAL 5: IDENTITY & PRIVACY SETTINGS MODAL                                */}
      {/* ========================================================================= */}
      <SomochatPrivacyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        currentUser={currentAuthUser}
        onSaveProfile={(updated) => {
          setCurrentAuthUser(updated);
          setRegisteredAccounts((prev) =>
            prev.map((a) => (a.somoId === updated.somoId ? updated : a))
          );
        }}
        onSignOut={() => {
          setCurrentAuthUser(null);
          onShowToast('info', 'Signed Out', 'You have been disconnected from the Somochat matrix.');
        }}
        onOpenRequestsModal={() => setShowRequestsModal(true)}
        onShowToast={onShowToast}
      />

      {/* ========================================================================= */}
      {/* MODAL 6: 24-HOUR STORY CREATOR MODAL                                      */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showStoryCreatorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)] mb-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-[#00F0FF]" />
                  <h3 className="text-base font-black text-[var(--text-primary)]">
                    PUBLISH 24-HOUR STORY
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStoryCreatorModal(false)}
                  className="w-8 h-8 rounded-full bg-[var(--bg-input)] text-[var(--text-muted)] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePublishStory} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)]">
                  <button
                    type="button"
                    onClick={() => setStoryMediaType('text')}
                    className={`py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      storyMediaType === 'text' ? 'bg-[#00F0FF] text-black font-black' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    Text Story
                  </button>
                  <button
                    type="button"
                    onClick={() => setStoryMediaType('image')}
                    className={`py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      storyMediaType === 'image' ? 'bg-[#A855F7] text-white font-black' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    Photo / Visual
                  </button>
                </div>

                {storyMediaType === 'text' ? (
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                      Story Message
                    </label>
                    <textarea
                      rows={4}
                      value={storyTextContent}
                      onChange={(e) => setStoryTextContent(e.target.value)}
                      placeholder="What's happening in your node today? ⚡"
                      className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] outline-none resize-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                      Attach Image
                    </label>
                    <button
                      type="button"
                      onClick={() => storyFileInputRef.current?.click()}
                      className="w-full py-6 rounded-2xl border-2 border-dashed border-[#00F0FF]/40 hover:border-[#00F0FF] bg-[var(--bg-input)]/50 flex flex-col items-center justify-center cursor-pointer"
                    >
                      <Camera className="w-6 h-6 text-[#00F0FF] mb-1" />
                      <span className="text-xs text-[var(--text-primary)] font-bold">
                        {storyMediaUrl ? 'Image Selected (Click to change)' : 'Upload Visual Story'}
                      </span>
                    </button>
                    <input
                      type="file"
                      ref={storyFileInputRef}
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => setStoryMediaUrl(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00F0FF] via-[#A855F7] to-[#FF007A] text-black font-black text-xs uppercase tracking-wider hover:brightness-110 cursor-pointer shadow-md"
                >
                  Share to 24H Matrix
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 7: FULLSCREEN 24-HOUR STORY VIEWER                                 */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activeStoryViewer && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm h-[80vh] max-h-[650px] bg-black border border-[#00F0FF]/40 rounded-3xl overflow-hidden relative flex flex-col shadow-2xl"
            >
              {/* Progress bars */}
              <div className="absolute top-3 left-3 right-3 z-30 flex space-x-1">
                {activeStoryViewer.storiesList.map((_, i) => (
                  <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-[#00F0FF] ${
                        i < activeStoryViewer.currentIndex
                          ? 'w-full'
                          : i === activeStoryViewer.currentIndex
                          ? 'w-full transition-all duration-5000'
                          : 'w-0'
                      }`}
                    />
                  </div>
                ))}
              </div>

              {/* Author info */}
              <div className="absolute top-7 left-3 right-3 z-30 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <img
                    src={activeStoryViewer.storiesList[activeStoryViewer.currentIndex].authorAvatar}
                    alt="Author"
                    className="w-8 h-8 rounded-full object-cover border border-[#00F0FF]"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {activeStoryViewer.storiesList[activeStoryViewer.currentIndex].authorName}
                    </span>
                    <span className="text-[9px] text-gray-400 font-mono">
                      24h Expiring Story
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStoryViewer(null)}
                  className="w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Story Content */}
              <div className="w-full h-full flex items-center justify-center p-6 text-center relative">
                {activeStoryViewer.storiesList[activeStoryViewer.currentIndex].mediaType === 'image' ? (
                  <img
                    src={activeStoryViewer.storiesList[activeStoryViewer.currentIndex].mediaUrl}
                    alt="Story"
                    className="w-full h-full object-cover absolute inset-0"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-[#00F0FF]/30 via-[#A855F7]/30 to-[#FF007A]/30 flex items-center justify-center p-6">
                    <p className="text-base sm:text-lg font-black text-white leading-relaxed">
                      {activeStoryViewer.storiesList[activeStoryViewer.currentIndex].textContent}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
