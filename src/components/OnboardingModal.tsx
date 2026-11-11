import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Calendar,
  Camera,
  Sparkles,
  Check,
  AlertTriangle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  Eye,
  Zap,
  LogOut,
  ShieldAlert,
  Smile,
  Tag
} from 'lucide-react';
import { UserProfile } from '../types';
import { useTheme } from '../context/ThemeContext';
import { checkUsernameAvailability, saveFullUserProfile } from '../lib/profileService';
import { compressProfileImage } from '../utils/imageCompressor';

interface OnboardingModalProps {
  currentUser: UserProfile;
  isOpen: boolean;
  onComplete: (profile: UserProfile) => void;
  onLogout: () => void;
}

const MOOD_OPTIONS = [
  { id: 'peaceful', label: 'Peaceful', icon: '🌿' },
  { id: 'focused', label: 'Focused', icon: '⚡' },
  { id: 'inspired', label: 'Inspired', icon: '✨' },
  { id: 'calm', label: 'Calm', icon: '🌊' },
  { id: 'reflective', label: 'Reflective', icon: '🌙' },
];

const INTEREST_SUGGESTIONS = [
  'Mindful Living',
  'AI & Technology',
  'Creative Writing',
  'Philosophy',
  'Soundscapes',
  'Data Science',
  'Design & Art',
  'Deep Focus',
];

function calculateAge(dobString: string): number {
  if (!dobString) return 0;
  const birth = new Date(dobString);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  currentUser,
  isOpen,
  onComplete,
  onLogout,
}) => {
  const { theme, baseMode, setBaseMode, isAutoMode, autoModeLabel, setMood } = useTheme();

  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Username
  const [username, setUsername] = useState<string>(() => {
    if (currentUser.username) return currentUser.username;
    // Suggest initial username from display name or email prefix
    const base = (currentUser.displayName || currentUser.email?.split('@')[0] || 'user')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .slice(0, 15);
    return base.length >= 3 ? base : `user_${Math.random().toString(36).substring(2, 6)}`;
  });
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    isValid: boolean;
    isAvailable: boolean;
    message: string;
  }>({ isValid: true, isAvailable: true, message: '' });

  // Step 2: Date of Birth
  const [dateOfBirth, setDateOfBirth] = useState<string>(currentUser.dateOfBirth || '');
  const [isUnderage, setIsUnderage] = useState<boolean>(false);

  // Step 3: Photo & Bio
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(currentUser.photoURL || null);
  const [photoSizeBytes, setPhotoSizeBytes] = useState<number | null>(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [bio, setBio] = useState<string>(currentUser.bio || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 4: Mood, Theme, Gender & Interests
  const [selectedMood, setSelectedMood] = useState<string>(currentUser.mood || 'peaceful');
  const [selectedGender, setSelectedGender] = useState<string>(currentUser.gender || 'Prefer not to say');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(currentUser.interests || ['Mindful Living']);

  // Debounced live username availability check
  useEffect(() => {
    if (!username.trim()) {
      setUsernameStatus({ isValid: false, isAvailable: false, message: 'Please enter a username.' });
      return;
    }

    setIsCheckingUsername(true);
    const timer = setTimeout(async () => {
      const res = await checkUsernameAvailability(username, currentUser.uid);
      setUsernameStatus(res);
      setIsCheckingUsername(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [username, currentUser.uid]);

  // Check age whenever DOB changes
  useEffect(() => {
    if (!dateOfBirth) {
      setIsUnderage(false);
      return;
    }
    const age = calculateAge(dateOfBirth);
    setIsUnderage(age < 18);
  }, [dateOfBirth]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingPhoto(true);
    try {
      const { dataUrl, sizeBytes } = await compressProfileImage(file);
      setPhotoDataUrl(dataUrl);
      setPhotoSizeBytes(sizeBytes);
    } catch (err) {
      console.error('Photo compression error:', err);
    } finally {
      setIsCompressingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleFinalSubmit = async () => {
    if (isUnderage || !dateOfBirth) return;
    setIsSubmitting(true);

    try {
      const updatedProfile: UserProfile = {
        ...currentUser,
        username: username.trim().toLowerCase(),
        dateOfBirth,
        isAdult: true,
        photoURL: photoDataUrl || currentUser.photoURL,
        bio: bio.trim(),
        mood: selectedMood,
        gender: selectedGender,
        interests: selectedInterests,
        isOnboarded: true,
        status: 'active',
        usernameLastChangedAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = await saveFullUserProfile(
        currentUser.uid,
        updatedProfile,
        currentUser.username
      );

      if (result.success) {
        onComplete(updatedProfile);
      } else {
        alert(result.error || 'Could not save profile. Please try again.');
      }
    } catch (err: any) {
      alert(err.message || 'Submission error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl shadow-2xl p-6 sm:p-8 text-[var(--text-primary)] relative overflow-hidden"
      >
        {/* Header Step Counter */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4 mb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-color)]">
              Welcome to Somotoz · Step {step} of 4
            </span>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mt-0.5">
              {step === 1 && 'Choose your username'}
              {step === 2 && 'Verify your age'}
              {step === 3 && 'Add a photo & bio'}
              {step === 4 && 'Pick your mood & theme'}
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? 'w-6 bg-[var(--accent-color)]'
                    : i < step
                    ? 'w-3 bg-emerald-500'
                    : 'w-2 bg-[var(--border-color)]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* =========================================================================
            STEP 1: USERNAME (UNIQUE, 3-20 CHARS)
           ========================================================================= */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Your username is your unique public handle in Somotoz. It is visible to other users instead of your real name or email.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)] text-sm font-semibold">
                  @
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  maxLength={20}
                  placeholder="creative_soul"
                  className="w-full pl-8 pr-10 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[var(--accent-color)] rounded-xl text-sm font-semibold text-[var(--text-primary)] outline-none"
                  autoFocus
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                  {isCheckingUsername ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
                  ) : usernameStatus.isValid && usernameStatus.isAvailable ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <span
                  className={
                    usernameStatus.isAvailable && usernameStatus.isValid
                      ? 'text-emerald-500 font-medium'
                      : 'text-amber-500 font-medium'
                  }
                >
                  {isCheckingUsername ? 'Checking availability...' : usernameStatus.message}
                </span>
                <span className="text-[var(--text-muted)]">{username.length}/20</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[11px] text-[var(--text-secondary)] space-y-1">
              <p className="font-semibold text-[var(--text-primary)]">Rules:</p>
              <p>• 3 to 20 characters long</p>
              <p>• Letters, numbers, and underscores only</p>
              <p>• You can change it again once every 30 days in Settings</p>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 2: DATE OF BIRTH (18+ STRICT CHECK)
           ========================================================================= */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Somotoz and our social features are built for adults aged 18 and older. Your birthdate stays completely private and is never shown to others.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                Date of Birth
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full pl-10 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[var(--accent-color)] rounded-xl text-sm font-semibold text-[var(--text-primary)] outline-none"
                />
              </div>
            </div>

            {/* Underage Warning Banner */}
            {isUnderage && (
              <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <span>Somotoz is for Adults Only (18+)</span>
                </div>
                <p className="leading-relaxed text-amber-200">
                  Thank you for your interest. To ensure community safety, accounts and chat profiles can only be created by adults aged 18 and older. You cannot continue with this account.
                </p>
                <button
                  type="button"
                  onClick={onLogout}
                  className="mt-2 w-full py-2 bg-amber-500 text-black font-bold text-xs rounded-xl hover:bg-amber-400 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}

            {!isUnderage && dateOfBirth && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Age verified: You are 18 or older.</span>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            STEP 3: PROFILE PHOTO (<300 KB) & SHORT BIO
           ========================================================================= */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Add an optional avatar and bio. Photos are automatically compressed to under 300 KB to keep Somotoz fast and private.
            </p>

            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-[var(--bg-elevated)] border-2 border-[var(--border-color)] flex items-center justify-center overflow-hidden">
                  {photoDataUrl ? (
                    <img src={photoDataUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-[var(--text-muted)]" />
                  )}
                </div>
                {isCompressingPhoto && (
                  <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center text-white text-xs">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                  <span>Upload Photo</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <p className="text-[11px] text-[var(--text-muted)]">
                  {photoSizeBytes
                    ? `Compressed: ${(photoSizeBytes / 1024).toFixed(1)} KB (<300 KB)`
                    : 'Optional · JPEG or PNG'}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                Bio (Optional)
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 160))}
                rows={3}
                placeholder="Mindful creator, software tinkerer, and ambient music listener..."
                className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[var(--accent-color)] rounded-xl text-xs text-[var(--text-primary)] outline-none resize-none leading-relaxed"
              />
              <div className="text-right text-[10px] text-[var(--text-muted)]">
                {bio.length}/160
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 4: MOOD, THEME, GENDER & INTERESTS
           ========================================================================= */}
        {step === 4 && (
          <div className="space-y-5 animate-fade-in">
            {/* Mood */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                Current Mood *
              </label>
              <div className="grid grid-cols-5 gap-2">
                {MOOD_OPTIONS.map((mood) => {
                  const isSelected = selectedMood === mood.id;
                  return (
                    <button
                      key={mood.id}
                      type="button"
                      onClick={() => {
                        setSelectedMood(mood.id);
                        setMood(mood.id);
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        isSelected
                          ? 'bg-[var(--accent-color)]/20 border-[var(--accent-color)] text-[var(--text-primary)] font-bold'
                          : 'bg-[var(--bg-elevated)] border-[var(--border-color)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <span className="text-xl">{mood.icon}</span>
                      <span className="text-[10px] truncate">{mood.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Base Theme Mode (Auto / Day / Night / Eye Comfort) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                  Base Theme Preview
                </label>
                <span className="text-[10px] font-mono font-bold text-[var(--accent-color)] px-2 py-0.5 rounded-full bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/30">
                  {autoModeLabel}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'auto', label: 'Auto (Clock)', icon: Zap },
                  { id: 'day', label: 'Day', icon: Sun },
                  { id: 'night', label: 'Night', icon: Moon },
                  { id: 'eye-comfort', label: 'Eye Comfort', icon: Eye },
                ].map((th) => {
                  const isSelected =
                    th.id === 'auto'
                      ? isAutoMode
                      : !isAutoMode &&
                        ((th.id === 'day' && (baseMode === 'day' || theme === 'white')) ||
                         (th.id === 'night' && (baseMode === 'night' || theme === 'black')) ||
                         (th.id === 'eye-comfort' && (baseMode === 'eye-comfort' || theme === 'mix')));
                  const Icon = th.icon;
                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setBaseMode(th.id as any)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--accent-color)] text-black border-[var(--accent-color)] font-bold shadow-xs'
                          : 'bg-[var(--bg-elevated)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-color)]/50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="truncate">{th.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">
                Default is Auto (reads local device clock). Manual picks are temporary for this session only.
              </p>
            </div>

            {/* Optional Gender & Interests */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                  Interests (Optional)
                </label>
                <span className="text-[10px] text-[var(--text-muted)]">Select any</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {INTEREST_SUGGESTIONS.map((int) => {
                  const isSelected = selectedInterests.includes(int);
                  return (
                    <button
                      key={int}
                      type="button"
                      onClick={() => toggleInterest(int)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--accent-color)]/20 border-[var(--accent-color)] text-[var(--accent-color)] font-semibold'
                          : 'bg-[var(--bg-elevated)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {int}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Legal Terms & 18+ Agreement Note */}
        <div className="pt-4 text-center">
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            By proceeding, you confirm you are 18+ and agree to the Somotoz{' '}
            <span className="font-semibold text-[var(--text-primary)]">Terms of Use</span> and{' '}
            <span className="font-semibold text-[var(--text-primary)]">Privacy Policy</span>.
          </p>
        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-[var(--border-color)]">
          {step > 1 && !isUnderage ? (
            <button
              type="button"
              onClick={() => setStep((prev) => prev - 1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              disabled={
                (step === 1 && (!usernameStatus.isValid || !usernameStatus.isAvailable || isCheckingUsername)) ||
                (step === 2 && (!dateOfBirth || isUnderage))
              }
              onClick={() => setStep((prev) => prev + 1)}
              className="px-5 py-2.5 bg-[var(--accent-color)] disabled:opacity-40 text-black font-semibold text-xs rounded-xl hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer ml-auto"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting || isUnderage}
              onClick={handleFinalSubmit}
              className="px-6 py-2.5 bg-gradient-to-r from-[var(--accent-color)] to-emerald-400 text-black font-bold text-xs rounded-xl hover:opacity-95 transition-opacity flex items-center gap-2 cursor-pointer ml-auto shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Saving profile...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-black" />
                  <span>Complete Setup</span>
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
