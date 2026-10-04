export interface AIReflectionResponse {
  title: string;
  conversationalReply: string;
  moodTags: string[];
  actionableTakeaways: string[];
}

export type GenerationMode = 'text' | 'image' | 'video' | 'music';

export interface ChatMediaData {
  type: GenerationMode;
  url?: string;
  imageUrl?: string;
  svgData?: string;
  prompt?: string;
  aspectRatio?: string;
  duration?: string;
  audioNotes?: Array<{ freq: number; duration: number; type?: OscillatorType }>;
  tempo?: number;
  genre?: string;
  videoFrames?: string[];
  animationType?: 'ambient_pulse' | 'cyber_wave' | 'neural_mesh' | 'cosmic_drift' | 'cinematic_motion' | string;
}

export interface FileAttachment {
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
  textContent?: string;
  base64?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  mode?: GenerationMode;
  media?: ChatMediaData;
  sources?: { title: string; uri: string }[];
  modelUsed?: string;
  attachments?: FileAttachment[];
}

export type ChatRole = 'ai_engineer' | 'empathetic_listener' | 'cognitive_reframer' | 'socratic_guide' | 'mindfulness_coach';

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  aiResponse?: AIReflectionResponse | null;
  moodTags: string[];
  createdAt: number; // Unix timestamp in ms for consistent UI/sorting
  updatedAt?: number;
  wordCount: number;
  isFavorite?: boolean;
  artworkData?: string | null; // Base64 or generated SVG data URI for visual mood art
  artworkPrompt?: string | null;
  chatThread?: ChatMessage[];
  transcribedAudio?: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  phoneNumber?: string | null;
  bio?: string | null;
  updatedAt?: number;
}

export interface UserActivityLog {
  id: string;
  userId: string;
  mode: GenerationMode;
  action: string;
  timestamp: number;
  tokens?: number;
  metadata?: Record<string, any>;
}

export type ViewMode = 'dashboard' | 'chat' | 'somochat' | 'write' | 'view' | 'edit' | 'wisdom' | 'soundscapes' | 'admin';

export type ActivityType = 'ai_query' | 'search' | 'reflection' | 'media_gen' | 'auth' | 'admin_action';

export interface AdminActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  activityType: ActivityType;
  query: string; // The prompt or search query inside Somotoz
  feature: string; // 'Chat Companion' | 'Wisdom Explorer' | 'Reflection Studio' | 'Neural Art' | etc.
  status: 'success' | 'error';
  timestamp: number;
  tokens?: number;
  modelUsed?: string;
  metadata?: Record<string, any>;
}

export interface ManagedUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
  createdAt: number;
  lastLoginAt: number;
  status: 'active' | 'disabled';
  disabledReason?: string;
  totalActivities: number;
  totalEntries: number;
  role: 'admin' | 'user';
  bio?: string;
}

export interface AdminAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalAiQueries: number;
  totalSearches: number;
  totalReflections: number;
  recentActivityCount: number;
  activityTrends: Array<{
    date: string;
    aiQueries: number;
    searches: number;
    reflections: number;
  }>;
}

export type AppTheme = 'black' | 'white' | 'mix';

export type SomoUserStatus = 'online' | 'vibing' | 'coding' | 'offline' | 'afk' | 'hyped';

export type SomoUserRole = 'admin' | 'sub_admin' | 'verified_creator' | 'member';

export interface SomoUser {
  id: string;
  somoId: string; // Unique, e.g. SOMO-SOM-001, SOMO-AURA-88
  name: string;
  username?: string;
  avatar: string;
  role: SomoUserRole;
  status: SomoUserStatus;
  statusText: string;
  publicKey: string;
  email?: string;
  phoneNumber?: string;
  socialHandle?: string;
  bio?: string;
  isVerified?: boolean;
  joinedAt: number;
  customBadge?: string;
  colorTheme?: string;
  isSuspended?: boolean;
}

export type SomoConnectionStatus = 'none' | 'pending_outgoing' | 'pending_incoming' | 'accepted' | 'blocked';

export interface SomoChatRequest {
  id: string;
  fromSomoId: string;
  fromName: string;
  fromAvatar: string;
  toSomoId: string;
  toName: string;
  note?: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  createdAt: number;
  updatedAt?: number;
}

export interface SomoPrivacySettings {
  lastSeenVisibility: 'everyone' | 'contacts_only' | 'nobody';
  readReceipts: boolean; // WhatsApp blue double-ticks
  requestPermissions: 'everyone' | 'verified_only';
  storyAudience: 'matrix_public' | 'accepted_contacts';
  blockedSomoIds: string[];
}

export interface SomoSubAdminPermissions {
  canManageDirectory: boolean;
  canIssueBadges: boolean;
  canModerateFeed: boolean;
  canBroadcastAlerts: boolean;
  grantedBy: string;
  grantedAt: number;
  authKey?: string;
}

export interface SomoRegisteredAccount extends SomoUser {
  passwordHash: string;
  privacySettings: SomoPrivacySettings;
  subAdminPermissions?: SomoSubAdminPermissions;
}

export type SomoMediaType = 'text' | 'image' | 'video' | 'audio' | 'sticker' | 'code';

export interface SomoMessage {
  id: string;
  senderId: string;
  senderSomoId: string;
  senderName: string;
  senderAvatar: string;
  receiverSomoId: string; // 'GLOBAL_SPACE' or specific somoId
  content: string; // Clean readable content in memory & UI
  encryptedContent: string; // Stored ciphertext payload (Zero-knowledge database layer)
  isEncrypted: boolean;
  cipherKey?: string;
  timestamp: number;
  mediaType?: SomoMediaType;
  mediaUrl?: string;
  mediaName?: string;
  mediaThumbnail?: string;
  audioDuration?: number;
  reactions?: Record<string, string[]>; // emoji -> array of SomoIds
  isRead?: boolean;
  deliveryStatus?: 'sending' | 'sent' | 'delivered' | 'read';
  replyTo?: {
    id: string;
    senderName: string;
    senderSomoId: string;
    content: string;
    mediaType?: SomoMediaType;
  };
  selfDestructIn?: number;
}

export interface SomoStory {
  id: string;
  authorId: string;
  authorSomoId: string;
  authorName: string;
  authorAvatar: string;
  mediaType: 'image' | 'video' | 'text';
  mediaUrl?: string;
  caption?: string;
  textContent?: string;
  bgGradient?: string;
  createdAt: number;
  expiresAt: number; // 24 hours after creation
  viewsCount: number;
  viewers?: string[];
}

export interface SomoChannel {
  id: string;
  somoId: string;
  name: string;
  avatar: string;
  type: 'direct' | 'global' | 'group';
  status?: SomoUserStatus;
  statusText?: string;
  isVerified?: boolean;
  role?: 'admin' | 'member' | 'verified_creator';
  unreadCount: number;
  lastMessage?: string;
  lastTimestamp?: number;
}



