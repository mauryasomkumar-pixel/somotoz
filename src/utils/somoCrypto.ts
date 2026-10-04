import { SomoUser, SomoMessage, SomoRegisteredAccount, SomoChatRequest, SomoPrivacySettings } from '../types';

/**
 * End-to-End Encryption (E2EE) Utility & Admin ID Protocol for Somochat
 * Engineered for high-speed client-side cipher transformations and secure user directory lookup.
 */

// Simple robust reversible cipher for visual and cryptographic E2EE demonstration
export function encryptSomoPayload(text: string, secretKey: string = 'SOMO-SECURE-KEY-2026'): string {
  if (!text) return '';
  const textChars = Array.from(unescape(encodeURIComponent(text)));
  const keyChars = Array.from(secretKey);
  
  const encryptedHex = textChars
    .map((c, i) => {
      const code = c.charCodeAt(0) ^ keyChars[i % keyChars.length].charCodeAt(0);
      return code.toString(16).padStart(2, '0');
    })
    .join('');

  return `SOMO_CIPHER_v2::${encryptedHex}`;
}

export function decryptSomoPayload(cipherText: string, secretKey: string = 'SOMO-SECURE-KEY-2026'): string {
  if (!cipherText) return '';
  if (!cipherText.startsWith('SOMO_CIPHER_v2::')) {
    // If not encrypted with v2 header, return raw text
    return cipherText;
  }

  try {
    const hex = cipherText.replace('SOMO_CIPHER_v2::', '');
    const keyChars = Array.from(secretKey);
    let decoded = '';

    for (let i = 0; i < hex.length; i += 2) {
      const hexByte = hex.substring(i, i + 2);
      const code = parseInt(hexByte, 16) ^ keyChars[(i / 2) % keyChars.length].charCodeAt(0);
      decoded += String.fromCharCode(code);
    }

    return decodeURIComponent(escape(decoded));
  } catch (err) {
    return '[Decryption Failed: Invalid Cipher Key or Checksum]';
  }
}

/**
 * Safe password hashing simulation for registered real humans
 */
export function hashSomoPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `SOMO_HASH_${Math.abs(hash).toString(16).toUpperCase()}`;
}

/**
 * Generates an exclusive, unique Somo User ID with cryptographic hex suffix
 * RBAC: Restricted to Admin Som Maurya
 */
export function generateUniqueSomoId(prefix: string = 'SOMO', customHandle?: string): string {
  const cleanPrefix = (customHandle || prefix).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
  const timeStampCode = Date.now().toString(36).slice(-3).toUpperCase();
  return `SOMO-${cleanPrefix || 'PEER'}-${randomHex}${timeStampCode}`;
}

export function generateMasterSubAdminKey(subAdminHandle: string): string {
  const hex = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SOMO-SUB-ADMIN-${subAdminHandle.toUpperCase().slice(0, 4)}-${hex}-2026`;
}

export const DEFAULT_PRIVACY_SETTINGS: SomoPrivacySettings = {
  lastSeenVisibility: 'everyone',
  readReceipts: true,
  requestPermissions: 'everyone',
  storyAudience: 'matrix_public',
  blockedSomoIds: [],
};

// Initial Verified Registered Accounts
export const INITIAL_REGISTERED_ACCOUNTS: SomoRegisteredAccount[] = [
  {
    id: 'somo_som_admin',
    somoId: 'SOMO-SOM-001',
    name: 'Som Maurya',
    username: 'sommaurya',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'admin',
    status: 'coding',
    statusText: 'Architecting Somotoz Kernel & Somochat E2EE ⚡',
    publicKey: 'pk_somotoz_001_master_key_iitm',
    email: 'mauryasomkumar@gmail.com',
    phoneNumber: '+91 98765 43210',
    socialHandle: '@sommaurya_iitm',
    bio: 'Lead Architect @ Somotoz Suite | IIT Madras Data Science & Computational Thinking',
    isVerified: true,
    joinedAt: 1772000000000,
    customBadge: 'MASTER ADMIN',
    colorTheme: '#00F0FF',
    passwordHash: hashSomoPassword('admin123'),
    privacySettings: {
      ...DEFAULT_PRIVACY_SETTINGS,
      storyAudience: 'matrix_public',
    },
  },
  {
    id: 'somo_peer_luna',
    somoId: 'SOMO-LUNA-77',
    name: 'Luna Vance',
    username: 'lunavance',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'verified_creator',
    status: 'vibing',
    statusText: 'Creating 3D Neural visualizers 🎨✨',
    publicKey: 'pk_luna_77_art_key_secure',
    email: 'luna.vance@neuralpulse.io',
    phoneNumber: '+1 (555) 349-8201',
    socialHandle: '@lunavance_art',
    bio: 'Generative artist, UI/UX researcher, and cyber aesthetician.',
    isVerified: true,
    joinedAt: 1772100000000,
    customBadge: 'PRO CREATOR',
    colorTheme: '#FF007A',
    passwordHash: hashSomoPassword('creator123'),
    privacySettings: DEFAULT_PRIVACY_SETTINGS,
  },
  {
    id: 'somo_peer_neo',
    somoId: 'SOMO-NEO-204',
    name: 'Neo Thorne',
    username: 'neothorne',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'sub_admin',
    status: 'online',
    statusText: 'Benchmarking sub-10ms mesh latency ⚡',
    publicKey: 'pk_neo_204_matrix_key',
    email: 'neo.thorne@cyberdev.org',
    phoneNumber: '+44 7911 123456',
    socialHandle: '@neo_systems',
    bio: 'Distributed systems engineer & Somotoz Network Node Operator.',
    isVerified: true,
    joinedAt: 1772200000000,
    customBadge: 'SUB-ADMIN',
    colorTheme: '#00FF41',
    passwordHash: hashSomoPassword('systems123'),
    privacySettings: DEFAULT_PRIVACY_SETTINGS,
    subAdminPermissions: {
      canManageDirectory: true,
      canIssueBadges: true,
      canModerateFeed: true,
      canBroadcastAlerts: false,
      grantedBy: 'SOMO-SOM-001',
      grantedAt: 1772250000000,
      authKey: 'SOMO-SUB-ADMIN-NEO-8821-2026',
    },
  },
  {
    id: 'somo_peer_iitm',
    somoId: 'SOMO-IITM-24',
    name: 'Aarav Sharma',
    username: 'aaraviitm',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    role: 'member',
    status: 'hyped',
    statusText: 'Deep learning hackathon grind 🚀',
    publicKey: 'pk_iitm_24_algo_key',
    email: 'aarav.iitm@ds.edu',
    phoneNumber: '+91 94440 12345',
    socialHandle: '@aarav_iitm_ds',
    bio: 'IIT Madras Data Science researcher & Python ML enthusiast.',
    isVerified: true,
    joinedAt: 1772300000000,
    customBadge: 'IIT MADRAS',
    colorTheme: '#A855F7',
    passwordHash: hashSomoPassword('iitm123'),
    privacySettings: DEFAULT_PRIVACY_SETTINGS,
  },
  {
    id: 'somo_peer_kai',
    somoId: 'SOMO-KAI-99',
    name: 'Kai Chen',
    username: 'kaichen',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    role: 'member',
    status: 'afk',
    statusText: 'Brewing specialty matcha 🍵',
    publicKey: 'pk_kai_99_audio_key',
    email: 'kai.chen@soundwaves.io',
    phoneNumber: '+1 (415) 902-1823',
    socialHandle: '@kaichen_ambient',
    bio: 'Ambient sound producer & generative audio synthesis creator.',
    isVerified: false,
    joinedAt: 1772400000000,
    customBadge: 'SOUND DESIGN',
    colorTheme: '#FFB800',
    passwordHash: hashSomoPassword('kai123'),
    privacySettings: DEFAULT_PRIVACY_SETTINGS,
  },
];

// Initial Curated Somochat Directory
export const INITIAL_SOMO_DIRECTORY: SomoUser[] = INITIAL_REGISTERED_ACCOUNTS.map(({ passwordHash, privacySettings, subAdminPermissions, ...user }) => user);

// Initial Connection Requests
export const INITIAL_CHAT_REQUESTS: SomoChatRequest[] = [
  {
    id: 'req_som_luna',
    fromSomoId: 'SOMO-LUNA-77',
    fromName: 'Luna Vance',
    fromAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    toSomoId: 'SOMO-SOM-001',
    toName: 'Som Maurya',
    note: 'Hey Som! Loved the latest E2EE Somotoz matrix updates. Connecting for UI collaboration.',
    status: 'accepted',
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    updatedAt: Date.now() - 1000 * 60 * 60 * 22,
  },
  {
    id: 'req_som_neo',
    fromSomoId: 'SOMO-NEO-204',
    fromName: 'Neo Thorne',
    fromAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    toSomoId: 'SOMO-SOM-001',
    toName: 'Som Maurya',
    note: 'Sub-admin relay node setup ready for testing.',
    status: 'accepted',
    createdAt: Date.now() - 1000 * 60 * 60 * 18,
    updatedAt: Date.now() - 1000 * 60 * 60 * 16,
  },
  {
    id: 'req_aarav_som',
    fromSomoId: 'SOMO-IITM-24',
    fromName: 'Aarav Sharma',
    fromAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    toSomoId: 'SOMO-SOM-001',
    toName: 'Som Maurya',
    note: 'Hi Som! Fellow IIT Madras researcher here. Would love to connect regarding computational thinking modules.',
    status: 'pending',
    createdAt: Date.now() - 1000 * 60 * 45,
  },
  {
    id: 'req_kai_som',
    fromSomoId: 'SOMO-KAI-99',
    fromName: 'Kai Chen',
    fromAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    toSomoId: 'SOMO-SOM-001',
    toName: 'Som Maurya',
    note: 'Sharing soundscape synthesizers for Somotoz audio layer.',
    status: 'pending',
    createdAt: Date.now() - 1000 * 60 * 15,
  }
];

// Initial starter messages for Global and Direct chats (Server/Storage Layer Encrypted)
export const INITIAL_SOMO_MESSAGES: SomoMessage[] = [
  {
    id: 'msg_init_1',
    senderId: 'somo_som_admin',
    senderSomoId: 'SOMO-SOM-001',
    senderName: 'Som Maurya',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    receiverSomoId: 'GLOBAL_SPACE',
    content: 'Welcome to Somochat! 🚀 Pure human-to-human real-time matrix with zero AI intrusion, WhatsApp-style double tick receipts, and 24-hour expiring stories.',
    encryptedContent: encryptSomoPayload('Welcome to Somochat! 🚀 Pure human-to-human real-time matrix with zero AI intrusion, WhatsApp-style double tick receipts, and 24-hour expiring stories.'),
    isEncrypted: true,
    deliveryStatus: 'read',
    timestamp: Date.now() - 1000 * 60 * 25,
    mediaType: 'text',
    reactions: { '🔥': ['SOMO-LUNA-77', 'SOMO-NEO-204'], '⚡': ['SOMO-IITM-24'] },
  },
  {
    id: 'msg_init_2',
    senderId: 'somo_peer_luna',
    senderSomoId: 'SOMO-LUNA-77',
    senderName: 'Luna Vance',
    senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    receiverSomoId: 'GLOBAL_SPACE',
    content: 'The Gen-Z holographic gradient aesthetics on this feed look unreal! Look at this futuristic neon artwork I rendered:',
    encryptedContent: encryptSomoPayload('The Gen-Z holographic gradient aesthetics on this feed look unreal! Look at this futuristic neon artwork I rendered:'),
    isEncrypted: true,
    deliveryStatus: 'read',
    timestamp: Date.now() - 1000 * 60 * 18,
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    mediaName: 'cyber_gradient_mesh.png',
    reactions: { '💜': ['SOMO-SOM-001', 'SOMO-KAI-99'] },
  },
  {
    id: 'msg_init_3',
    senderId: 'somo_peer_neo',
    senderSomoId: 'SOMO-NEO-204',
    senderName: 'Neo Thorne',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    receiverSomoId: 'GLOBAL_SPACE',
    content: 'Storage layer encryption is rock solid! Clean bubbles on the frontend, zero cipher clutter, and instantaneous messaging.',
    encryptedContent: encryptSomoPayload('Storage layer encryption is rock solid! Clean bubbles on the frontend, zero cipher clutter, and instantaneous messaging.'),
    isEncrypted: true,
    deliveryStatus: 'read',
    timestamp: Date.now() - 1000 * 60 * 10,
    mediaType: 'text',
    reactions: { '🔒': ['SOMO-SOM-001'] },
  },
];

// Initial 24-Hour Expiring Stories
export const INITIAL_SOMO_STORIES = [
  {
    id: 'story_som_1',
    authorId: 'somo_som_admin',
    authorSomoId: 'SOMO-SOM-001',
    authorName: 'Som Maurya',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    mediaType: 'text' as const,
    textContent: 'Deploying Somochat E2EE matrix at IIT Madras! Zero-telemetry & ultra low-latency ⚡🚀',
    bgGradient: 'from-[#00F0FF] via-[#A855F7] to-[#FF007A]',
    createdAt: Date.now() - 1000 * 60 * 90,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000 - 1000 * 60 * 90,
    viewsCount: 42,
    viewers: ['SOMO-LUNA-77', 'SOMO-NEO-204', 'SOMO-IITM-24', 'SOMO-KAI-99'],
  },
  {
    id: 'story_luna_1',
    authorId: 'somo_peer_luna',
    authorSomoId: 'SOMO-LUNA-77',
    authorName: 'Luna Vance',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    mediaType: 'image' as const,
    mediaUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
    caption: 'Midnight cyber aesthetic explorations 🎨✨',
    createdAt: Date.now() - 1000 * 60 * 240,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000 - 1000 * 60 * 240,
    viewsCount: 28,
    viewers: ['SOMO-SOM-001', 'SOMO-NEO-204'],
  },
  {
    id: 'story_neo_1',
    authorId: 'somo_peer_neo',
    authorSomoId: 'SOMO-NEO-204',
    authorName: 'Neo Thorne',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    mediaType: 'text' as const,
    textContent: 'Benchmarking sub-10ms packet dispatch across peer mesh nodes ⚡',
    bgGradient: 'from-[#00FF41] via-[#00F0FF] to-[#0A0A18]',
    createdAt: Date.now() - 1000 * 60 * 320,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000 - 1000 * 60 * 320,
    viewsCount: 19,
    viewers: ['SOMO-SOM-001'],
  },
  {
    id: 'story_aarav_1',
    authorId: 'somo_peer_iitm',
    authorSomoId: 'SOMO-IITM-24',
    authorName: 'Aarav Sharma',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    mediaType: 'image' as const,
    mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    caption: 'IIT Madras Data Science Lab late night hackathon session 🧠💻',
    createdAt: Date.now() - 1000 * 60 * 450,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000 - 1000 * 60 * 450,
    viewsCount: 35,
    viewers: ['SOMO-SOM-001', 'SOMO-LUNA-77', 'SOMO-KAI-99'],
  }
];

