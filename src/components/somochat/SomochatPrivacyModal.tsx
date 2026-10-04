import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  User,
  Shield,
  Eye,
  Check,
  CheckCheck,
  X,
  Lock,
  Phone,
  AtSign,
  Building,
  Radio,
  Palette,
  LogOut,
  Sliders,
  Sparkles,
  Ban
} from 'lucide-react';
import { SomoRegisteredAccount, SomoUserStatus, SomoPrivacySettings } from '../../types';

interface SomochatPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: SomoRegisteredAccount;
  onSaveProfile: (updated: SomoRegisteredAccount) => void;
  onSignOut: () => void;
  onOpenRequestsModal: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

const STATUS_OPTIONS: { status: SomoUserStatus; label: string; icon: string; color: string }[] = [
  { status: 'online', label: 'Online & Active', icon: '🟢', color: '#00FF41' },
  { status: 'coding', label: 'Coding / Building', icon: '⚡', color: '#00F0FF' },
  { status: 'vibing', label: 'Vibing / Creative', icon: '✨', color: '#FF007A' },
  { status: 'hyped', label: 'Hyped / Fast Pace', icon: '🚀', color: '#A855F7' },
  { status: 'afk', label: 'Away / In Research', icon: '🍵', color: '#FFB800' },
  { status: 'offline', label: 'Stealth / Offline', icon: '⚫', color: '#6B7280' },
];

export const SomochatPrivacyModal: React.FC<SomochatPrivacyModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveProfile,
  onSignOut,
  onOpenRequestsModal,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy'>('profile');

  // Profile Form States
  const [name, setName] = useState(currentUser.name);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phoneNumber || '');
  const [socialHandle, setSocialHandle] = useState(currentUser.socialHandle || '');
  const [status, setStatus] = useState<SomoUserStatus>(currentUser.status);
  const [statusText, setStatusText] = useState(currentUser.statusText);
  const [colorTheme, setColorTheme] = useState(currentUser.colorTheme || '#00F0FF');

  // Privacy Form States
  const [lastSeen, setLastSeen] = useState(currentUser.privacySettings?.lastSeenVisibility || 'everyone');
  const [readReceipts, setReadReceipts] = useState(currentUser.privacySettings?.readReceipts ?? true);
  const [requestPermissions, setRequestPermissions] = useState(currentUser.privacySettings?.requestPermissions || 'everyone');
  const [storyAudience, setStoryAudience] = useState(currentUser.privacySettings?.storyAudience || 'matrix_public');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onShowToast('error', 'Name Required', 'Please provide a valid display name.');
      return;
    }

    const updatedPrivacy: SomoPrivacySettings = {
      lastSeenVisibility: lastSeen,
      readReceipts,
      requestPermissions,
      storyAudience,
      blockedSomoIds: currentUser.privacySettings?.blockedSomoIds || [],
    };

    const updated: SomoRegisteredAccount = {
      ...currentUser,
      name: name.trim(),
      avatar,
      bio: bio.trim(),
      phoneNumber: phoneNumber.trim(),
      socialHandle: socialHandle.trim(),
      status,
      statusText: statusText.trim(),
      colorTheme,
      privacySettings: updatedPrivacy,
    };

    onSaveProfile(updated);
    onShowToast('success', 'Profile Updated', 'Your identity and privacy settings have been secured.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md font-mono select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="w-full max-w-xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center space-x-3">
            <img
              src={avatar}
              alt={name}
              className="w-11 h-11 rounded-full object-cover border-2 border-[#00F0FF]"
            />
            <div>
              <h2 className="text-base sm:text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
                <span>IDENTITY & PRIVACY CONTROL</span>
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] font-mono">
                {currentUser.somoId} • @{currentUser.username || 'user'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--bg-input)] hover:bg-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 gap-2 my-4 p-1 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-color)]">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#00F0FF] text-black shadow-md shadow-[#00F0FF]/25 font-black'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile Customization</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-[#A855F7] text-white shadow-md shadow-[#A855F7]/25 font-black'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy & Security</span>
          </button>
        </div>

        {/* Content Area */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto pr-1 space-y-4">
          
          {/* TAB 1: PROFILE CUSTOMIZATION */}
          {activeTab === 'profile' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs outline-none focus:border-[#00F0FF]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Bio / Research Affiliation
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. IIT Madras Data Science & Cyber Research"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs outline-none"
                />
              </div>

              {/* Status Vibe */}
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  Select Status Vibe
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.status}
                      type="button"
                      onClick={() => setStatus(opt.status)}
                      className={`p-2 rounded-xl border text-left flex items-center space-x-2 cursor-pointer transition-all ${
                        status === opt.status
                          ? 'bg-[var(--bg-input)] border-[#00F0FF] shadow-sm'
                          : 'bg-[var(--bg-input)]/50 border-[var(--border-color)] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <span className="text-sm">{opt.icon}</span>
                      <span className="text-[11px] font-bold text-[var(--text-primary)] truncate">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Custom Status Text
                </label>
                <input
                  type="text"
                  value={statusText}
                  onChange={(e) => setStatusText(e.target.value)}
                  placeholder="e.g. Engineering Somotoz Matrix ⚡"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 2: PRIVACY & SECURITY */}
          {activeTab === 'privacy' && (
            <div className="space-y-3.5">
              
              {/* WhatsApp-style Read Receipts */}
              <div className="p-3.5 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-color)] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <CheckCheck className={`w-4 h-4 ${readReceipts ? 'text-[#00F0FF]' : 'text-[var(--text-muted)]'}`} />
                    <span>WhatsApp-Style Read Receipts</span>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    When enabled, send and receive blue double-tick delivery receipts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReadReceipts(!readReceipts)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    readReceipts ? 'bg-[#00F0FF]' : 'bg-[var(--border-color)]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-black absolute top-0.5 transition-transform ${
                      readReceipts ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Last Seen Visibility */}
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  Who Can See My Last Seen & Online Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'everyone', label: 'Everyone' },
                    { val: 'contacts_only', label: 'Contacts Only' },
                    { val: 'nobody', label: 'Nobody' },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setLastSeen(item.val as any)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        lastSeen === item.val
                          ? 'bg-[#A855F7] text-white border-[#A855F7] shadow-sm'
                          : 'bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-color)]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Story Visibility Audience */}
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  24-Hour Stories Audience
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 'matrix_public', label: 'Public to Matrix Grid' },
                    { val: 'accepted_contacts', label: 'Accepted Contacts Only' },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setStoryAudience(item.val as any)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        storyAudience === item.val
                          ? 'bg-[#00FF41] text-black border-[#00FF41] font-black'
                          : 'bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-color)]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Blocked Users quick access */}
              <div className="p-3 rounded-2xl bg-red-950/20 border border-red-500/30 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                    <Ban className="w-3.5 h-3.5" />
                    <span>Blocked Peer Contacts ({currentUser.privacySettings?.blockedSomoIds?.length || 0})</span>
                  </div>
                  <p className="text-[10px] text-red-400/80 mt-0.5">
                    Blocked peers cannot message or view stories.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRequestsModal();
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold cursor-pointer"
                >
                  Manage Blocklist
                </button>
              </div>

            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                onSignOut();
                onClose();
              }}
              className="px-3 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch / Sign Out</span>
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#A855F7] text-black text-xs font-black hover:brightness-110 flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>Save & Apply</span>
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
};
