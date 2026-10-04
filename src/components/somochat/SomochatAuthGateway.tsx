import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Lock,
  User,
  Key,
  Mail,
  Phone,
  Sparkles,
  Check,
  CheckCheck,
  ArrowRight,
  UserCheck,
  Copy,
  Eye,
  EyeOff,
  AtSign,
  Building,
  Radio,
  Zap,
  Globe
} from 'lucide-react';
import { SomoRegisteredAccount, SomoUserRole } from '../../types';
import {
  hashSomoPassword,
  generateUniqueSomoId,
  DEFAULT_PRIVACY_SETTINGS,
  INITIAL_REGISTERED_ACCOUNTS
} from '../../utils/somoCrypto';

interface SomochatAuthGatewayProps {
  onLoginSuccess: (account: SomoRegisteredAccount) => void;
  registeredAccounts: SomoRegisteredAccount[];
  onRegisterAccount: (newAccount: SomoRegisteredAccount) => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
];

export const SomochatAuthGateway: React.FC<SomochatAuthGatewayProps> = ({
  onLoginSuccess,
  registeredAccounts,
  onRegisterAccount,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Sign In Form States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // Registration Form States
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regBio, setRegBio] = useState('IIT Madras Data Science & Cyber Research Enthusiast ⚡');
  const [regSocial, setRegSocial] = useState('');
  const [regAvatar, setRegAvatar] = useState(AVATAR_PRESETS[0]);
  const [regIsHumanConfirmed, setRegIsHumanConfirmed] = useState(false);

  // Newly Registered Welcome Modal
  const [createdAccountModal, setCreatedAccountModal] = useState<SomoRegisteredAccount | null>(null);

  // Real-time preview of unique Somo ID based on username
  const livePreviewSomoId = React.useMemo(() => {
    const clean = (regUsername || 'USER').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    return `SOMO-${clean || 'PEER'}-XXXX`;
  }, [regUsername]);

  // Handle Login Submit
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      onShowToast('error', 'Missing Credentials', 'Please enter your username/email/Somo ID and password.');
      return;
    }

    setIsSubmittingLogin(true);
    const identifierClean = loginIdentifier.trim().toLowerCase();
    const targetHash = hashSomoPassword(loginPassword);

    // Find account by Somo ID, email, or username
    const found = registeredAccounts.find((acc) => {
      const matchId = acc.somoId.toLowerCase() === identifierClean;
      const matchEmail = acc.email?.toLowerCase() === identifierClean;
      const matchUsername = acc.username?.toLowerCase() === identifierClean;
      return (matchId || matchEmail || matchUsername);
    });

    setTimeout(() => {
      setIsSubmittingLogin(false);
      if (!found) {
        onShowToast('error', 'Account Not Found', 'No verified human account matches this identifier.');
        return;
      }

      if (found.isSuspended) {
        onShowToast('error', 'Account Suspended', 'This account has been suspended by Master Admin Som Maurya.');
        return;
      }

      if (found.passwordHash !== targetHash) {
        onShowToast('error', 'Incorrect Password', 'The password entered does not match our encrypted records.');
        return;
      }

      onShowToast('success', 'Authentication Verified', `Welcome back to Somochat, ${found.name}!`);
      onLoginSuccess(found);
    }, 400);
  };

  // Quick Demo Account Switcher
  const handleQuickLogin = (account: SomoRegisteredAccount) => {
    onShowToast('info', 'Quick Terminal Switch', `Switched to ${account.name} (${account.customBadge || account.role})`);
    onLoginSuccess(account);
  };

  // Handle Registration Submit
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    if (!regFullName.trim()) {
      onShowToast('error', 'Missing Name', 'Please enter your full human name.');
      return;
    }

    if (!regUsername.trim()) {
      onShowToast('error', 'Missing Username', 'Please choose a unique username.');
      return;
    }

    const cleanUser = regUsername.trim().toLowerCase();
    const existingUser = registeredAccounts.find(
      (a) => a.username?.toLowerCase() === cleanUser || a.email?.toLowerCase() === regEmail.trim().toLowerCase()
    );

    if (existingUser) {
      onShowToast('error', 'Username/Email Taken', 'An account already exists with this username or email.');
      return;
    }

    if (!regEmail.trim() || !regEmail.includes('@')) {
      onShowToast('error', 'Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!regPhone.trim()) {
      onShowToast('error', 'Phone Required', 'Please enter your contact phone number for human verification.');
      return;
    }

    if (regPassword.length < 6) {
      onShowToast('error', 'Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      onShowToast('error', 'Passwords Mismatch', 'The passwords entered do not match.');
      return;
    }

    if (!regIsHumanConfirmed) {
      onShowToast('error', 'Human Verification Required', 'Please check the box confirming you are a real human.');
      return;
    }

    // Check if registering Som Maurya
    const isSomMaster =
      regEmail.trim().toLowerCase() === 'mauryasomkumar@gmail.com' ||
      cleanUser === 'sommaurya' ||
      regFullName.trim().toLowerCase().includes('som maurya');

    const generatedSomoId = isSomMaster ? 'SOMO-SOM-001' : generateUniqueSomoId('USR', cleanUser.slice(0, 4));
    const assignedRole: SomoUserRole = isSomMaster ? 'admin' : 'member';
    const assignedBadge = isSomMaster ? 'MASTER ADMIN' : 'VERIFIED HUMAN';

    const newAccount: SomoRegisteredAccount = {
      id: `somo_usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      somoId: generatedSomoId,
      name: regFullName.trim(),
      username: cleanUser,
      email: regEmail.trim(),
      phoneNumber: regPhone.trim(),
      socialHandle: regSocial.trim() || `@${cleanUser}`,
      avatar: regAvatar,
      role: assignedRole,
      status: 'online',
      statusText: 'Verified Real Human on Somotoz Grid ⚡',
      publicKey: `pk_${Math.random().toString(36).substring(2, 12)}_auth`,
      bio: regBio.trim(),
      isVerified: true,
      joinedAt: Date.now(),
      customBadge: assignedBadge,
      colorTheme: isSomMaster ? '#00F0FF' : '#A855F7',
      passwordHash: hashSomoPassword(regPassword),
      privacySettings: DEFAULT_PRIVACY_SETTINGS,
    };

    onRegisterAccount(newAccount);
    setCreatedAccountModal(newAccount);
  };

  return (
    <div className="w-full h-full min-h-[calc(100vh-140px)] flex items-center justify-center p-3 sm:p-6 lg:p-12 select-none font-mono">
      <div className="w-full max-w-2xl bg-[var(--bg-card)]/90 backdrop-blur-2xl border border-[var(--border-color)] rounded-3xl p-5 sm:p-8 shadow-[0_0_50px_rgba(0,240,255,0.15)] relative overflow-hidden">
        
        {/* Futuristic Ambient Backlight */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#00F0FF]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[#A855F7]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header Branding */}
        <div className="text-center relative z-10 mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00F0FF] via-[#A855F7] to-[#FF007A] p-[2px] shadow-[0_0_25px_rgba(0,240,255,0.4)] mb-3">
            <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center text-[#00F0FF]">
              <Shield className="w-7 h-7" />
            </div>
          </div>
          
          <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight flex items-center justify-center gap-2">
            <span>SOMOCHAT GATEWAY</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00FF41]/15 text-[#00FF41] border border-[#00FF41]/40 font-bold">
              HUMAN ONLY
            </span>
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-md mx-auto">
            Zero-AI real-time matrix with WhatsApp-style delivery receipts, server-side encrypted storage, and permanent verified Somo IDs.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[var(--bg-input)]/80 border border-[var(--border-color)] mb-6 relative z-10">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'login'
                ? 'bg-gradient-to-r from-[#00F0FF] to-[#A855F7] text-black shadow-lg shadow-[#00F0FF]/25 font-black'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>SIGN IN</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'register'
                ? 'bg-gradient-to-r from-[#00F0FF] to-[#A855F7] text-black shadow-lg shadow-[#00F0FF]/25 font-black'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>REGISTER HUMAN ID</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: SIGN IN FORM                                                      */}
        {/* ========================================================================= */}
        {activeTab === 'login' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 relative z-10"
          >
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  Unique Somo ID / Username / Email
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. SOMO-SOM-001 or sommaurya or email"
                    className="w-full px-4 py-3 pl-10 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[#00F0FF] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] outline-none transition-colors"
                  />
                  <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  Terminal Access Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your security password"
                    className="w-full px-4 py-3 pl-10 pr-10 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[#00F0FF] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] outline-none transition-colors"
                  />
                  <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingLogin}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00F0FF] via-[#A855F7] to-[#FF007A] text-black font-extrabold text-xs tracking-wider uppercase hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.3)]"
              >
                {isSubmittingLogin ? (
                  <span>AUTHENTICATING MESH KEY...</span>
                ) : (
                  <>
                    <span>AUTHENTICATE & ENTER MATRIX</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Access Bar */}
            <div className="pt-4 border-t border-[var(--border-color)]">
              <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[#00F0FF]" />
                  <span>Verified Human Terminal Profiles (1-Click Switch)</span>
                </span>
                <span className="text-[#00FF41]">Active Mesh</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {registeredAccounts.slice(0, 5).map((acc) => (
                  <button
                    key={acc.somoId}
                    type="button"
                    onClick={() => handleQuickLogin(acc)}
                    className="p-2 rounded-xl bg-[var(--bg-input)]/60 hover:bg-[var(--bg-input)] border border-[var(--border-color)] hover:border-[#00F0FF] text-left transition-all cursor-pointer group flex items-center space-x-2"
                  >
                    <img
                      src={acc.avatar}
                      alt={acc.name}
                      className="w-7 h-7 rounded-full object-cover border border-[#00F0FF]/40 shrink-0"
                    />
                    <div className="truncate">
                      <div className="text-[11px] font-bold text-[var(--text-primary)] truncate group-hover:text-[#00F0FF]">
                        {acc.name}
                      </div>
                      <div className="text-[9px] text-[var(--text-muted)] font-mono truncate">
                        {acc.somoId}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: REGISTRATION FORM                                                 */}
        {/* ========================================================================= */}
        {activeTab === 'register' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 relative z-10 max-h-[65vh] overflow-y-auto pr-1"
          >
            <form onSubmit={handleRegister} className="space-y-3.5">
              
              {/* Generated Somo ID Live Preview Badge */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-[#00F0FF]/15 via-[#A855F7]/15 to-transparent border border-[#00F0FF]/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
                    Assigned Permanent Somo ID
                  </span>
                  <span className="text-sm font-black text-[#00F0FF] font-mono tracking-wide">
                    {livePreviewSomoId}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#00FF41]/20 text-[#00FF41] border border-[#00FF41]/40 font-bold">
                    VERIFIED REAL HUMAN
                  </span>
                </div>
              </div>

              {/* Full Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Full Legal / Display Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="e.g. Som Maurya or Aarav Sharma"
                      className="w-full px-3 py-2.5 pl-9 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[#00F0FF] text-[var(--text-primary)] text-xs outline-none"
                    />
                    <User className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Unique Username *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="e.g. sommaurya or aarav_ds"
                      className="w-full px-3 py-2.5 pl-9 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[#00F0FF] text-[var(--text-primary)] text-xs outline-none font-mono"
                    />
                    <AtSign className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-3" />
                  </div>
                </div>
              </div>

              {/* Email & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Verified Email *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. yourname@gmail.com"
                      className="w-full px-3 py-2.5 pl-9 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[#00F0FF] text-[var(--text-primary)] text-xs outline-none"
                    />
                    <Mail className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Phone / WhatsApp Number *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-3 py-2.5 pl-9 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[#00F0FF] text-[var(--text-primary)] text-xs outline-none font-mono"
                    />
                    <Phone className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-3" />
                  </div>
                </div>
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Password (Min 6 Chars) *
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 pl-9 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[#00F0FF] text-[var(--text-primary)] text-xs outline-none"
                    />
                    <Lock className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 pl-9 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[#00F0FF] text-[var(--text-primary)] text-xs outline-none"
                    />
                    <Lock className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-3" />
                  </div>
                </div>
              </div>

              {/* Academic/Social & Bio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Affiliation / Social Handle
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={regSocial}
                      onChange={(e) => setRegSocial(e.target.value)}
                      placeholder="e.g. @IITMadras or @github"
                      className="w-full px-3 py-2.5 pl-9 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[#00F0FF] text-[var(--text-primary)] text-xs outline-none"
                    />
                    <Building className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Status Vibe / Bio
                  </label>
                  <input
                    type="text"
                    value={regBio}
                    onChange={(e) => setRegBio(e.target.value)}
                    placeholder="Short research or builder bio"
                    className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[#00F0FF] text-[var(--text-primary)] text-xs outline-none"
                  />
                </div>
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                  Select Visual Matrix Avatar
                </label>
                <div className="flex items-center space-x-3 overflow-x-auto pb-1">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRegAvatar(preset)}
                      className={`relative rounded-full p-[2px] transition-all cursor-pointer shrink-0 ${
                        regAvatar === preset
                          ? 'bg-gradient-to-r from-[#00F0FF] to-[#A855F7] scale-110 shadow-lg shadow-[#00F0FF]/30'
                          : 'border border-[var(--border-color)] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={preset}
                        alt="Preset"
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Real Human Anti-Bot Confirmation */}
              <div className="p-3 rounded-xl bg-[var(--bg-input)]/90 border border-[var(--border-color)] flex items-start space-x-3 cursor-pointer"
                onClick={() => setRegIsHumanConfirmed(!regIsHumanConfirmed)}
              >
                <input
                  type="checkbox"
                  checked={regIsHumanConfirmed}
                  onChange={(e) => setRegIsHumanConfirmed(e.target.checked)}
                  className="mt-0.5 rounded text-[#00F0FF] focus:ring-0 cursor-pointer"
                />
                <div className="text-[11px] text-[var(--text-secondary)]">
                  <span className="font-bold text-[var(--text-primary)]">Human Integrity Verification</span>: I certify I am a verified human entity. I agree to zero-bot and zero-fake profile rules on Somotoz Grid.
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00F0FF] via-[#A855F7] to-[#FF007A] text-black font-black text-xs tracking-wider uppercase hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-[0_0_25px_rgba(0,240,255,0.4)]"
              >
                <UserCheck className="w-4 h-4" />
                <span>GENERATE PERMANENT ID & ENTER CHAT</span>
              </button>
            </form>
          </motion.div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUCCESSFUL REGISTRATION CELEBRATION MODAL                                 */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {createdAccountModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-[var(--bg-card)] border-2 border-[#00F0FF] rounded-3xl p-6 shadow-[0_0_60px_rgba(0,240,255,0.4)] text-center relative overflow-hidden"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00F0FF] to-[#A855F7] mx-auto flex items-center justify-center text-black mb-4 shadow-[0_0_30px_rgba(0,240,255,0.5)]">
                <Sparkles className="w-8 h-8" />
              </div>

              <h2 className="text-xl font-black text-[var(--text-primary)]">
                PERMANENT SOMO ID ISSUED!
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Your credentials are cryptographically secured on Somotoz Grid.
              </p>

              {/* ID Credential Card */}
              <div className="my-5 p-4 rounded-2xl bg-black/60 border border-[#00F0FF]/50 text-left">
                <div className="flex items-center space-x-3 mb-3">
                  <img
                    src={createdAccountModal.avatar}
                    alt={createdAccountModal.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#00F0FF]"
                  />
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{createdAccountModal.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00FF41]/20 text-[#00FF41] font-bold">
                        {createdAccountModal.customBadge}
                      </span>
                    </div>
                    <div className="text-xs text-[#00F0FF] font-mono font-black mt-0.5">
                      {createdAccountModal.somoId}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-gray-300 font-mono pt-2 border-t border-gray-800">
                  <div><strong>Email:</strong> {createdAccountModal.email}</div>
                  <div><strong>Phone:</strong> {createdAccountModal.phoneNumber}</div>
                  <div><strong>Username:</strong> @{createdAccountModal.username}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(createdAccountModal.somoId);
                    onShowToast('success', 'ID Copied', createdAccountModal.somoId);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-bold hover:border-[#00F0FF] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Somo ID</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const acc = createdAccountModal;
                    setCreatedAccountModal(null);
                    onLoginSuccess(acc);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#A855F7] text-black text-xs font-black hover:brightness-110 flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>Launch Somochat</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
