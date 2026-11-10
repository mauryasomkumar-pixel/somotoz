import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Mail,
  Calendar,
  ShieldCheck,
  Sun,
  Moon,
  Eye,
  LogOut,
  HelpCircle,
  Camera,
  Check,
  AlertTriangle,
  Loader2,
  Trash2,
  Save,
  AtSign,
  Clock,
  CheckCircle2,
  Edit3
} from 'lucide-react';
import { UserProfile, ViewMode } from '../types';
import { useTheme } from '../context/ThemeContext';
import { ThemeSwitcher } from './ThemeSwitcher';
import { checkIsAdmin } from '../lib/adminService';
import {
  checkUsernameAvailability,
  checkUsernameChangeCooldown,
  saveFullUserProfile,
  scheduleAccountDeletion
} from '../lib/profileService';
import { compressProfileImage } from '../utils/imageCompressor';

interface ProfileViewProps {
  user: UserProfile | null;
  onLogout: () => void;
  onNavigate: (view: ViewMode) => void;
  onOpenTour: () => void;
  onProfileUpdated?: (updated: UserProfile) => void;
}

const MOODS = [
  { id: 'peaceful', label: 'Peaceful', icon: '🌿' },
  { id: 'focused', label: 'Focused', icon: '⚡' },
  { id: 'inspired', label: 'Inspired', icon: '✨' },
  { id: 'calm', label: 'Calm', icon: '🌊' },
  { id: 'reflective', label: 'Reflective', icon: '🌙' },
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onLogout,
  onNavigate,
  onOpenTour,
  onProfileUpdated,
}) => {
  const { theme, setTheme } = useTheme();
  const isAdmin = checkIsAdmin(user);

  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [mood, setMood] = useState(user?.mood || 'peaceful');
  const [gender, setGender] = useState(user?.gender || 'Prefer not to say');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(user?.photoURL || null);
  const [photoSizeBytes, setPhotoSizeBytes] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Username Change State (Every 30 days)
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    isValid: boolean;
    isAvailable: boolean;
    message: string;
  }>({ isValid: true, isAvailable: true, message: '' });
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  const cooldown = checkUsernameChangeCooldown(user?.usernameLastChangedAt);

  // Account Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Accessible reading mode
  const [accessibleMode, setAccessibleMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('somotoz_accessible_mode') === 'true';
    } catch {
      return false;
    }
  });

  const toggleAccessibleMode = () => {
    const next = !accessibleMode;
    setAccessibleMode(next);
    try {
      localStorage.setItem('somotoz_accessible_mode', String(next));
    } catch {}
  };

  // Live availability check for username edit
  useEffect(() => {
    if (!newUsername.trim()) {
      setUsernameStatus({ isValid: false, isAvailable: false, message: 'Username is required.' });
      return;
    }

    if (newUsername.trim().toLowerCase() === user?.username?.toLowerCase()) {
      setUsernameStatus({ isValid: true, isAvailable: true, message: 'This is your current username.' });
      return;
    }

    setIsCheckingUsername(true);
    const timer = setTimeout(async () => {
      const res = await checkUsernameAvailability(newUsername, user?.uid);
      setUsernameStatus(res);
      setIsCheckingUsername(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [newUsername, user?.uid, user?.username]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const { dataUrl, sizeBytes } = await compressProfileImage(file);
      setPhotoDataUrl(dataUrl);
      setPhotoSizeBytes(sizeBytes);
    } catch (err) {
      console.error('Photo compression error:', err);
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.uid) return;
    setIsSaving(true);

    try {
      const updated: Partial<UserProfile> = {
        bio: bio.trim(),
        mood,
        gender,
        photoURL: photoDataUrl || user.photoURL,
        updatedAt: Date.now(),
      };

      const res = await saveFullUserProfile(user.uid, updated);
      if (res.success) {
        setIsEditing(false);
        onProfileUpdated?.({ ...user, ...updated });
      } else {
        alert(res.error || 'Failed to update profile.');
      }
    } catch (e: any) {
      alert(e.message || 'Save error.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeUsername = async () => {
    if (!user?.uid || !cooldown.canChange) return;
    if (!usernameStatus.isValid || !usernameStatus.isAvailable) return;

    setIsSavingUsername(true);
    try {
      const res = await saveFullUserProfile(
        user.uid,
        {
          username: newUsername.trim().toLowerCase(),
          usernameLastChangedAt: Date.now(),
        },
        user.username
      );

      if (res.success) {
        onProfileUpdated?.({
          ...user,
          username: newUsername.trim().toLowerCase(),
          usernameLastChangedAt: Date.now(),
        });
        alert('Username updated successfully!');
      } else {
        alert(res.error || 'Could not change username.');
      }
    } catch (err: any) {
      alert(err.message || 'Username change failed.');
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (!user?.uid) return;
    setIsDeletingAccount(true);

    try {
      const res = await scheduleAccountDeletion(user.uid, user.username);
      if (res.success) {
        onLogout();
      } else {
        alert(res.error || 'Could not schedule deletion.');
      }
    } catch (err: any) {
      alert(err.message || 'Deletion error.');
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-8 font-sans">
      {/* Header */}
      <div className="border-b border-[var(--border-color)] pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <User className="w-6 h-6 text-[var(--accent-color)]" />
            <span>Profile & Settings</span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Manage your public identity, theme preferences, and account security.
          </p>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-[var(--accent-color)]" />
            <span>Edit Profile</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-[var(--accent-color)] text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Changes</span>
          </button>
        )}
      </div>

      {/* 1. PUBLIC PROFILE CARD */}
      <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Public Profile (Visible in Chats)
          </h2>
          <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Real name & email stay private</span>
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative group self-start">
            <div className="w-18 h-18 rounded-2xl bg-[var(--bg-elevated)] border-2 border-[var(--border-color)] flex items-center justify-center overflow-hidden shrink-0">
              {photoDataUrl ? (
                <img src={photoDataUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-9 h-9 text-[var(--text-muted)]" />
              )}
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center text-white text-[10px] opacity-90 hover:opacity-100 cursor-pointer transition-opacity"
              >
                <Camera className="w-4 h-4 mb-0.5" />
                <span>Change</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                @{user?.username || 'user'}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[var(--accent-color)]/15 text-[var(--accent-color)] text-[10px] font-bold uppercase">
                {user?.mood || 'Peaceful'}
              </span>
            </div>

            {!isEditing ? (
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
                "{user?.bio || 'No bio written yet. Tap Edit Profile to add one.'}"
              </p>
            ) : (
              <div className="space-y-1 pt-1">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 160))}
                  rows={2}
                  placeholder="Share a short bio..."
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] outline-none resize-none"
                />
                <div className="text-right text-[10px] text-[var(--text-muted)]">
                  {bio.length}/160
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mood Selector (when editing) */}
        {isEditing && (
          <div className="pt-2 border-t border-[var(--border-color)] space-y-2">
            <label className="block text-xs font-semibold text-[var(--text-secondary)]">
              Update Mood
            </label>
            <div className="grid grid-cols-5 gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMood(m.id)}
                  className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    mood === m.id
                      ? 'bg-[var(--accent-color)]/20 border-[var(--accent-color)] text-[var(--text-primary)] font-bold'
                      : 'bg-[var(--bg-elevated)] border-[var(--border-color)] text-[var(--text-secondary)]'
                  }`}
                >
                  <span className="text-base">{m.icon}</span>
                  <span className="text-[10px] truncate">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. CHANGE USERNAME (ONCE EVERY 30 DAYS) */}
      <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Change Username
          </h2>
          <span className="text-[11px] text-[var(--text-muted)]">Permitted once every 30 days</span>
        </div>

        {!cooldown.canChange ? (
          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-start gap-3">
            <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                Username change on cooldown
              </p>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                You recently changed your username. To protect against impersonation, you can change it again in{' '}
                <strong className="text-[var(--text-primary)]">{cooldown.daysRemaining} days</strong>.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-[var(--text-secondary)]">
              Choose a new username (3–20 characters, letters, numbers, and underscore).
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)] text-sm font-semibold">
                  @
                </div>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  maxLength={20}
                  className="w-full pl-8 pr-10 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[var(--accent-color)] rounded-xl text-xs font-semibold text-[var(--text-primary)] outline-none"
                  placeholder="new_username"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                  {isCheckingUsername ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--text-muted)]" />
                  ) : usernameStatus.isValid && usernameStatus.isAvailable ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled={
                  isSavingUsername ||
                  !usernameStatus.isValid ||
                  !usernameStatus.isAvailable ||
                  newUsername.trim().toLowerCase() === user?.username?.toLowerCase()
                }
                onClick={handleChangeUsername}
                className="px-4 py-2.5 rounded-xl bg-[var(--accent-color)] disabled:opacity-40 text-black text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                {isSavingUsername ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Update Username</span>
              </button>
            </div>

            <p
              className={`text-[11px] ${
                usernameStatus.isAvailable ? 'text-emerald-500' : 'text-amber-500'
              }`}
            >
              {isCheckingUsername ? 'Checking availability...' : usernameStatus.message}
            </p>
          </div>
        )}
      </div>

      {/* 3. THEME & DISPLAY */}
      <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          Theme & Display
        </h2>

        <ThemeSwitcher compact={false} showLabels={false} />


        <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] mt-3">
          <div>
            <h4 className="text-xs font-bold text-[var(--text-primary)]">Accessible Reading Mode</h4>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Formats AI responses into shorter bullet points and easier reading text.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleAccessibleMode}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              accessibleMode ? 'bg-[var(--accent-color)]' : 'bg-[var(--border-color)]'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                accessibleMode ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 4. ADMIN CONSOLE & TOUR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onOpenTour}
          className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-left hover:border-[var(--accent-color)] transition-colors cursor-pointer space-y-1"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
            <HelpCircle className="w-4 h-4 text-[var(--accent-color)]" />
            <span>Feature Tour</span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)]">
            View the 3-step walkthrough of Chats, Ask AI, and Journal.
          </p>
        </button>

        {isAdmin && (
          <button
            type="button"
            onClick={() => onNavigate('admin')}
            className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left hover:bg-amber-500/15 transition-colors cursor-pointer space-y-1"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-amber-500">
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Console</span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Access real user management, query audit logs, and reports.
            </p>
          </button>
        )}
      </div>

      {/* 5. DANGER ZONE: ACCOUNT DELETION & LOGOUT */}
      <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20 shadow-sm space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-rose-500">
          Account Actions
        </h2>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex-1 py-3 rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-elevated)] text-xs font-semibold text-[var(--text-primary)] flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <LogOut className="w-4 h-4 text-[var(--text-secondary)]" />
            <span>Sign Out</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="flex-1 py-3 rounded-xl border border-rose-500/40 text-rose-500 hover:bg-rose-500/10 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-2xl space-y-4 font-sans text-[var(--text-primary)]">
            <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Schedule Account Deletion?
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                This will release your username <strong className="text-[var(--text-primary)]">@{user?.username}</strong>, remove your profile from SomoChat, and schedule your reflections for permanent deletion.
              </p>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border-color)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingAccount}
                onClick={handleConfirmDeleteAccount}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeletingAccount ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Confirm Deletion</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
