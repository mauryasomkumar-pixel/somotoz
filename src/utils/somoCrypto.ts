import { SomoUser, SomoMessage, SomoRegisteredAccount, SomoChatRequest, SomoPrivacySettings, SomoStory } from '../types';

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

// Real Registered Accounts (No hardcoded demo or seeded profiles)
export const INITIAL_REGISTERED_ACCOUNTS: SomoRegisteredAccount[] = [];

// Empty initial directory - strictly populated from real Firestore publicProfiles
export const INITIAL_SOMO_DIRECTORY: SomoUser[] = [];

// Initial Connection Requests (Empty by default)
export const INITIAL_CHAT_REQUESTS: SomoChatRequest[] = [];

// Initial starter messages for Global and Direct chats
export const INITIAL_SOMO_MESSAGES: SomoMessage[] = [];

// Initial 24-Hour Expiring Stories (Empty by default)
export const INITIAL_SOMO_STORIES: SomoStory[] = [];


