import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  Key,
  Sparkles,
  Terminal,
  Save,
  Globe,
  ChevronDown,
  SunMoon
} from 'lucide-react';
import { UserProfile } from '../types';
import { ThemeSwitcher } from './ThemeSwitcher';

interface CountryConfig {
  code: string;
  country: string;
  flag: string;
  placeholder: string;
  expectedLength: number | number[];
  hint: string;
  validate: (digits: string) => { isValid: boolean; message: string };
}

const COUNTRIES: CountryConfig[] = [
  {
    code: '+91',
    country: 'India',
    flag: '🇮🇳',
    placeholder: '98765 43210',
    expectedLength: 10,
    hint: 'Requires exactly 10 digits (starts with 6, 7, 8, or 9)',
    validate: (digits: string) => {
      if (digits.length === 0) return { isValid: true, message: '' };
      if (digits.length !== 10) {
        return { isValid: false, message: `India (+91) requires exactly 10 digits (currently ${digits.length}/10)` };
      }
      if (!/^[6-9]\d{9}$/.test(digits)) {
        return { isValid: false, message: 'India mobile numbers must start with 6, 7, 8, or 9' };
      }
      return { isValid: true, message: 'Valid 10-digit Indian number' };
    },
  },
  {
    code: '+1',
    country: 'US / Canada',
    flag: '🇺🇸',
    placeholder: '(415) 555-0199',
    expectedLength: 10,
    hint: 'Requires standard 10-digit North American format',
    validate: (digits: string) => {
      if (digits.length === 0) return { isValid: true, message: '' };
      if (digits.length !== 10) {
        return { isValid: false, message: `US (+1) requires exactly 10 digits (currently ${digits.length}/10)` };
      }
      if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(digits)) {
        return { isValid: false, message: 'Area code and central office code cannot start with 0 or 1' };
      }
      return { isValid: true, message: 'Valid 10-digit US/CA number' };
    },
  },
  {
    code: '+44',
    country: 'United Kingdom',
    flag: '🇬🇧',
    placeholder: '7911 123456',
    expectedLength: [10, 11],
    hint: 'Requires 10 or 11 digits',
    validate: (digits: string) => {
      if (digits.length === 0) return { isValid: true, message: '' };
      if (digits.length < 10 || digits.length > 11) {
        return { isValid: false, message: `UK (+44) requires 10 to 11 digits (currently ${digits.length})` };
      }
      return { isValid: true, message: 'Valid UK number' };
    },
  },
  {
    code: '+61',
    country: 'Australia',
    flag: '🇦🇺',
    placeholder: '412 345 678',
    expectedLength: 9,
    hint: 'Requires exactly 9 digits',
    validate: (digits: string) => {
      if (digits.length === 0) return { isValid: true, message: '' };
      if (digits.length !== 9) {
        return { isValid: false, message: `Australia (+61) requires 9 digits (currently ${digits.length}/9)` };
      }
      return { isValid: true, message: 'Valid Australian number' };
    },
  },
  {
    code: '+49',
    country: 'Germany',
    flag: '🇩🇪',
    placeholder: '151 23456789',
    expectedLength: [10, 11],
    hint: 'Requires 10 to 11 digits',
    validate: (digits: string) => {
      if (digits.length === 0) return { isValid: true, message: '' };
      if (digits.length < 10 || digits.length > 11) {
        return { isValid: false, message: `Germany (+49) requires 10-11 digits (currently ${digits.length})` };
      }
      return { isValid: true, message: 'Valid German number' };
    },
  },
  {
    code: '+971',
    country: 'UAE',
    flag: '🇦🇪',
    placeholder: '50 123 4567',
    expectedLength: 9,
    hint: 'Requires exactly 9 digits',
    validate: (digits: string) => {
      if (digits.length === 0) return { isValid: true, message: '' };
      if (digits.length !== 9) {
        return { isValid: false, message: `UAE (+971) requires 9 digits (currently ${digits.length}/9)` };
      }
      return { isValid: true, message: 'Valid UAE number' };
    },
  },
  {
    code: '+65',
    country: 'Singapore',
    flag: '🇸🇬',
    placeholder: '8123 4567',
    expectedLength: 8,
    hint: 'Requires exactly 8 digits',
    validate: (digits: string) => {
      if (digits.length === 0) return { isValid: true, message: '' };
      if (digits.length !== 8) {
        return { isValid: false, message: `Singapore (+65) requires 8 digits (currently ${digits.length}/8)` };
      }
      return { isValid: true, message: 'Valid Singapore number' };
    },
  },
];

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>, passwordData?: { currentPass: string; newPass: string }) => Promise<void>;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateProfile,
  onShowToast,
}) => {
  // Form State
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [rawPhoneNumber, setRawPhoneNumber] = useState('');
  const [bio, setBio] = useState('');

  // Password Change State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Status
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Parse existing phone number on mount or user change
  useEffect(() => {
    if (isOpen && user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setBio(user.bio || 'AI Architect & Data Engineer');
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setFormError(null);

      // Parse phone number if exists
      if (user.phoneNumber) {
        let matched = false;
        for (const country of COUNTRIES) {
          if (user.phoneNumber.startsWith(country.code)) {
            setCountryCode(country.code);
            const digits = user.phoneNumber.slice(country.code.length).replace(/\D/g, '');
            setRawPhoneNumber(digits);
            matched = true;
            break;
          }
        }
        if (!matched) {
          setCountryCode('+91');
          setRawPhoneNumber(user.phoneNumber.replace(/\D/g, ''));
        }
      } else {
        setCountryCode('+91');
        setRawPhoneNumber('');
      }
    }
  }, [isOpen, user]);

  // Selected Country Config
  const currentCountry = useMemo(() => {
    return COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];
  }, [countryCode]);

  // Digits only
  const phoneDigits = useMemo(() => {
    return rawPhoneNumber.replace(/\D/g, '');
  }, [rawPhoneNumber]);

  // Validation outcome
  const phoneValidation = useMemo(() => {
    return currentCountry.validate(phoneDigits);
  }, [currentCountry, phoneDigits]);

  const isPhoneValid = phoneValidation.isValid;

  // Expected target length formatted for display
  const expectedLengthDisplay = useMemo(() => {
    if (Array.isArray(currentCountry.expectedLength)) {
      return `${currentCountry.expectedLength[0]}-${currentCountry.expectedLength[1]}`;
    }
    return `${currentCountry.expectedLength}`;
  }, [currentCountry]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!displayName.trim()) {
      setFormError('Full Name cannot be empty.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }

    // Strict Phone Validation Check
    if (phoneDigits.length > 0 && !isPhoneValid) {
      setFormError(phoneValidation.message || 'Invalid phone number format for selected country.');
      return;
    }

    if (isChangingPassword) {
      if (!currentPassword) {
        setFormError('Please enter your current password.');
        return;
      }
      if (newPassword.length < 6) {
        setFormError('New password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setFormError('New password and confirmation do not match.');
        return;
      }
    }

    const fullPhoneNumber = phoneDigits.length > 0 ? `${countryCode} ${phoneDigits}` : null;

    setIsSaving(true);
    try {
      await onUpdateProfile(
        {
          displayName: displayName.trim(),
          email: email.trim(),
          phoneNumber: fullPhoneNumber,
          bio: bio.trim() || null,
          updatedAt: Date.now(),
        },
        isChangingPassword
          ? {
              currentPass: currentPassword,
              newPass: newPassword,
            }
          : undefined
      );

      onShowToast('success', 'Profile Updated', 'Your user credentials and phone number have been validated and saved.');
      onClose();
    } catch (err: any) {
      console.error('Profile update error:', err);
      const errMsg = err?.message || 'Failed to update profile settings.';
      setFormError(errMsg);
      onShowToast('error', 'Update Failed', errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none font-mono">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg bg-[#0A0A0A] border border-[#262626] shadow-[0_0_40px_rgba(0,255,65,0.15)] flex flex-col max-h-[90vh] overflow-hidden"
        style={{ borderRadius: '2px' }}
      >
        {/* Top Header */}
        <div className="p-5 border-b border-[#262626] bg-black flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-black border border-[#00FF41] text-[#00FF41] shadow-[2px_2px_0px_0px_#00FF41]">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#EDEDED] uppercase tracking-wider">
                User Profile & Settings
              </h2>
              <div className="text-[10px] text-[#737373] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#00FF41] animate-pulse" />
                <span>SECURE ENCLAVE // UID: {user.uid ? `${user.uid.slice(0, 10)}...` : 'LOCAL_SESSION'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#737373] hover:text-[#EDEDED] hover:bg-[#1A1A1A] border border-transparent hover:border-[#262626] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-[#EDEDED]">
          
          {/* Avatar & High Level Identity Banner */}
          <div className="p-4 bg-black border border-[#262626] flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 bg-[#141414] border-2 border-[#00FF41] flex items-center justify-center text-lg font-bold text-[#00FF41] shadow-[0_0_15px_rgba(0,255,65,0.3)]">
                {getInitials(displayName || user.displayName)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#00FF41] border border-black flex items-center justify-center">
                <Shield className="w-2.5 h-2.5 text-black" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#EDEDED] truncate">
                  {displayName || 'Neural Architect'}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41]/40 font-bold">
                  VERIFIED
                </span>
              </div>
              <p className="text-[10px] text-[#737373] truncate mt-0.5">{email || user.email}</p>
              <div className="text-[10px] text-[#00FF41] flex items-center gap-1 mt-1">
                <Sparkles className="w-3 h-3" />
                <span>Tier: Enterprise Engine Unlocked</span>
              </div>
            </div>
          </div>

          {/* Form Error Alert */}
          {formError && (
            <div className="p-3 bg-rose-950/40 border border-rose-600/60 text-rose-300 text-[11px] flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">{formError}</div>
            </div>
          )}

          {/* Section 1: General Identity */}
          <div className="space-y-3.5">
            <div className="text-[10px] uppercase font-bold text-[#737373] tracking-wider border-b border-[#1F1F1F] pb-1">
              01 // IDENTITY PARAMETERS
            </div>

            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[#A1A1AA] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#00FF41]" />
                <span>Full Name <strong className="text-rose-400">*</strong></span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Som Maurya"
                className="w-full px-3 py-2 bg-black border border-[#262626] text-[#EDEDED] placeholder-[#525252] focus:outline-none focus:border-[#00FF41] transition-colors"
                required
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[#A1A1AA] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#00FF41]" />
                <span>Email Address <strong className="text-rose-400">*</strong></span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full px-3 py-2 bg-black border border-[#262626] text-[#EDEDED] placeholder-[#525252] focus:outline-none focus:border-[#00FF41] transition-colors"
                required
              />
            </div>

            {/* Smart Phone Number with Country Code Dropdown & Strict Validation */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-[#A1A1AA] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#00FF41]" />
                  <span>Phone Number</span>
                </label>
                {phoneDigits.length > 0 && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 border ${
                      isPhoneValid
                        ? 'bg-[#00FF41]/10 text-[#00FF41] border-[#00FF41]/40'
                        : 'bg-rose-950/40 text-rose-400 border-rose-600/40'
                    }`}
                  >
                    {phoneDigits.length}/{expectedLengthDisplay} digits {isPhoneValid ? '✓' : '✗'}
                  </span>
                )}
              </div>

              {/* Country Code Dropdown + Number Input Container */}
              <div className="flex items-stretch gap-2">
                {/* Country Code Select */}
                <div className="relative shrink-0">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="h-full appearance-none px-3 py-2 pr-7 bg-black border border-[#262626] text-[#EDEDED] hover:border-[#00FF41] focus:outline-none focus:border-[#00FF41] transition-colors cursor-pointer text-xs font-mono font-bold"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code} className="bg-[#0A0A0A] text-[#EDEDED]">
                        {c.flag} {c.code} ({c.country})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#737373] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Raw Phone Number Input */}
                <div className="flex-1 relative">
                  <input
                    type="tel"
                    value={rawPhoneNumber}
                    onChange={(e) => setRawPhoneNumber(e.target.value)}
                    placeholder={currentCountry.placeholder}
                    className={`w-full px-3 py-2 bg-black border text-[#EDEDED] placeholder-[#525252] focus:outline-none transition-colors font-mono ${
                      phoneDigits.length > 0 && !isPhoneValid
                        ? 'border-rose-500/80 focus:border-rose-500'
                        : 'border-[#262626] focus:border-[#00FF41]'
                    }`}
                  />
                  {phoneDigits.length > 0 && (
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      {isPhoneValid ? (
                        <CheckCircle2 className="w-4 h-4 text-[#00FF41]" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Helper / Validation Feedback */}
              <div className="text-[10px] font-mono">
                {phoneDigits.length > 0 && !isPhoneValid ? (
                  <p className="text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{phoneValidation.message}</span>
                  </p>
                ) : (
                  <p className="text-[#737373] flex items-center justify-between mt-1">
                    <span>Format: {currentCountry.hint}</span>
                    <span className="text-[#00FF41]/80">{currentCountry.country} ({countryCode})</span>
                  </p>
                )}
              </div>
            </div>

            {/* Professional Headline / Bio */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[#A1A1AA]">
                Professional Headline / Specialty
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Data Science & Multi-Modal AI Research"
                className="w-full px-3 py-2 bg-black border border-[#262626] text-[#EDEDED] placeholder-[#525252] focus:outline-none focus:border-[#00FF41] transition-colors"
              />
            </div>
          </div>

          {/* Section 2: Security & Password */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-1">
              <div className="text-[10px] uppercase font-bold text-[#737373] tracking-wider flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-[#00FF41]" />
                <span>02 // SECURITY & ACCESS KEYS</span>
              </div>
              <button
                type="button"
                onClick={() => setIsChangingPassword(!isChangingPassword)}
                className={`text-[10px] px-2 py-0.5 border transition-colors cursor-pointer ${
                  isChangingPassword
                    ? 'bg-[#00FF41] text-black border-[#00FF41] font-bold'
                    : 'bg-black text-[#737373] hover:text-[#EDEDED] border-[#262626]'
                }`}
              >
                {isChangingPassword ? 'CANCEL PASSWORD CHANGE' : '+ CHANGE PASSWORD'}
              </button>
            </div>

            <AnimatePresence>
              {isChangingPassword && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 p-3.5 bg-black border border-[#262626] overflow-hidden"
                >
                  {/* Current Password */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#A1A1AA]">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter existing password"
                        className="w-full pl-3 pr-9 py-2 bg-[#0D0D0D] border border-[#262626] text-[#EDEDED] focus:outline-none focus:border-[#00FF41]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#EDEDED]"
                      >
                        {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#A1A1AA]">
                      New Password (min 6 characters)
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter secure new passphrase"
                        className="w-full pl-3 pr-9 py-2 bg-[#0D0D0D] border border-[#262626] text-[#EDEDED] focus:outline-none focus:border-[#00FF41]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#EDEDED]"
                      >
                        {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#A1A1AA]">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type new passphrase"
                        className="w-full pl-3 pr-9 py-2 bg-[#0D0D0D] border border-[#262626] text-[#EDEDED] focus:outline-none focus:border-[#00FF41]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#EDEDED]"
                      >
                        {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section 3: Visual Theme Selection */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-1">
              <div className="text-[10px] uppercase font-bold text-[#737373] tracking-wider flex items-center gap-1.5">
                <SunMoon className="w-3 h-3 text-[#00FF41]" />
                <span>03 // DISPLAY THEME PREFERENCE</span>
              </div>
            </div>

            <div className="p-3 bg-black border border-[#262626] space-y-2">
              <div className="text-[11px] text-[#A1A1AA]">
                Select your preferred terminal & interface contrast profile:
              </div>
              <ThemeSwitcher compact={false} showLabels={true} />
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-[#262626] flex items-center justify-between">
            <div className="text-[10px] font-mono text-[#737373]">
              {phoneDigits.length > 0 && !isPhoneValid && (
                <span className="text-rose-400">⚠️ Fix phone number to save</span>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2.5 bg-black hover:bg-[#171717] text-[#A1A1AA] hover:text-[#EDEDED] border border-[#262626] text-xs font-bold transition-colors cursor-pointer"
              >
                CANCEL
              </button>

              <button
                type="submit"
                disabled={isSaving || (phoneDigits.length > 0 && !isPhoneValid)}
                className={`px-5 py-2.5 text-xs font-bold tracking-wider border transition-all flex items-center space-x-2 cursor-pointer ${
                  phoneDigits.length > 0 && !isPhoneValid
                    ? 'bg-[#171717] text-[#737373] border-[#333333] cursor-not-allowed opacity-60'
                    : 'bg-[#00FF41] hover:bg-[#00E038] text-black border-[#00FF41] shadow-[2px_2px_0px_0px_#262626] hover:shadow-[3px_3px_0px_0px_#00FF41] active:translate-x-0.5 active:translate-y-0.5'
                }`}
                title={phoneDigits.length > 0 && !isPhoneValid ? 'Please resolve phone number validation error' : 'Save profile changes'}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>SYNCHRONIZING...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-black" />
                    <span>SAVE CHANGES</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

      </motion.div>
    </div>
  );
};
