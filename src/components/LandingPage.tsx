import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Terminal,
  ArrowRight,
  Lock,
  Code2,
  Cpu,
  Check,
  Play,
  Zap,
  Shield,
  Sparkles,
  Layers,
  ChevronDown,
  Eye,
  EyeOff,
  Search,
  CheckCircle2,
  KeyRound,
  UserCheck,
  Fingerprint,
  RefreshCw,
  Globe,
  Radio,
  Sliders,
  ChevronRight,
  ExternalLink,
  Volume2
} from 'lucide-react';
import { UserProfile } from '../types';

interface LandingPageProps {
  onSignIn: () => void;
  onManualAuth?: (user: UserProfile) => void;
  isAuthenticating: boolean;
  authError?: string | null;
}

// Country Code Data for Phone Input
interface CountryCode {
  code: string;
  name: string;
  dial: string;
  flag: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { code: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { code: 'AE', name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪' },
  { code: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷' },
  { code: 'CH', name: 'Switzerland', dial: '+41', flag: '🇨🇭' },
  { code: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱' },
  { code: 'KR', name: 'South Korea', dial: '+82', flag: '🇰🇷' },
  { code: 'SE', name: 'Sweden', dial: '+46', flag: '🇸🇪' },
];

// Terminal Matrix Scramble Hook
function useTerminalDecode(targetText: string, delay: number = 200, speed: number = 30) {
  const [displayText, setDisplayText] = useState('');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_#@%&<>';

  useEffect(() => {
    let iteration = 0;
    let interval: NodeJS.Timeout;

    const timer = setTimeout(() => {
      interval = setInterval(() => {
        setDisplayText(() =>
          targetText
            .split('')
            .map((char, index) => {
              if (char === ' ') return ' ';
              if (index < iteration) {
                return targetText[index];
              }
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join('')
        );

        if (iteration >= targetText.length) {
          clearInterval(interval);
        }

        iteration += 1 / 2;
      }, speed);
    }, delay);

    return () => {
      clearTimeout(timer);
      if (interval) clearInterval(interval);
    };
  }, [targetText, delay, speed]);

  return displayText || targetText;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignIn,
  onManualAuth,
  isAuthenticating,
  authError,
}) => {
  // Navigation Flow State: 'landing' -> 'auth' -> 'success' -> 'dashboard_preview'
  const [viewState, setViewState] = useState<'landing' | 'auth' | 'success' | 'dashboard_preview'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Form Fields State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Floating Label Focus States
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Authentication Sequence Simulation State
  const [authStage, setAuthStage] = useState<string>('');
  const [activeDecryptedUser, setActiveDecryptedUser] = useState<UserProfile | null>(null);

  // Mouse Tracking Coordinates for Access Portal
  const portalRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, isHovered: false });

  // Terminal Decoded Headings
  const decodedHeroTitle = useTerminalDecode('SOMOTOZ AI SUITE', 100, 35);
  const decodedBadge = useTerminalDecode('SOMOTOZ // AI WORKSPACE', 50, 25);

  const handlePortalMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!portalRef.current) return;
    const rect = portalRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      isHovered: true,
    });
  };

  const handlePortalMouseLeave = () => {
    setMousePos((prev) => ({ ...prev, isHovered: false }));
  };

  // Filtered Country Codes
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return COUNTRY_CODES;
    const q = countrySearch.toLowerCase();
    return COUNTRY_CODES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [countrySearch]);

  // Handle Form Submission with Decryption & Cinematic Success Redirect
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const userDisplayName = fullName.trim() || email.split('@')[0] || 'Somotoz User';
    const userEmail = email.trim() || 'user@somotoz.ai';
    const userProfile: UserProfile = {
      uid: 'user_' + Math.random().toString(36).substring(2, 9),
      displayName: userDisplayName,
      email: userEmail,
      photoURL: null,
    };

    setActiveDecryptedUser(userProfile);
    setViewState('success');
    setAuthStage('VERIFYING_ACCOUNT_CREDENTIALS...');

    setTimeout(() => {
      setAuthStage('CONNECTING_WORKSPACE_STORAGE...');
    }, 600);

    setTimeout(() => {
      setAuthStage('ACCESS_GRANTED // WELCOME');
    }, 1200);

    setTimeout(() => {
      if (onManualAuth) {
        onManualAuth(userProfile);
      } else {
        setViewState('dashboard_preview');
      }
    }, 2000);
  };

  // Handle Social Login
  const handleSocialGoogle = () => {
    onSignIn();
  };

  const handleSocialMeta = () => {
    const userProfile: UserProfile = {
      uid: 'meta_user_' + Math.random().toString(36).substring(2, 9),
      displayName: 'Somotoz Explorer',
      email: 'meta.user@somotoz.ai',
      photoURL: null,
    };
    setActiveDecryptedUser(userProfile);
    setViewState('success');
    setAuthStage('AUTHENTICATING_SESSION...');
    setTimeout(() => {
      setAuthStage('ACCESS_GRANTED // WELCOME');
    }, 1000);
    setTimeout(() => {
      if (onManualAuth) {
        onManualAuth(userProfile);
      } else {
        setViewState('dashboard_preview');
      }
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#EDEDED] flex flex-col justify-between selection:bg-[#00FF41] selection:text-black font-sans relative overflow-x-hidden">
      {/* Dynamic Background Grid */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#171717_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

      {/* Ambient Top Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[650px] h-[250px] bg-[#00FF41]/5 blur-[120px] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-30 w-full border-b border-[#262626] bg-[#0A0A0A]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div
            onClick={() => setViewState('landing')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-8 h-8 bg-black border border-[#00FF41] flex items-center justify-center text-[#00FF41] font-mono font-bold text-sm shadow-[2px_2px_0px_0px_#00FF41] group-hover:shadow-[3px_3px_0px_0px_#00FF41] transition-all">
              S_
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold tracking-tight text-[#EDEDED] font-mono group-hover:text-[#00FF41] transition-colors">
                SOMOTOZ
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#171717] text-[#00FF41] border border-[#262626]">
                v2.5
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-[#A1A1AA]">
              <span className="w-2 h-2 bg-[#00FF41] animate-pulse" />
              <span>Dev: <strong className="text-[#EDEDED]">Som Maurya</strong></span>
              <span className="text-[#404040]">|</span>
              <span className="text-[#737373]">Data Science & Computational Thinking</span>
            </div>

            {viewState === 'landing' ? (
              <button
                onClick={() => setViewState('auth')}
                className="px-4 py-2 text-xs font-mono font-bold text-black bg-[#00FF41] hover:bg-[#00E038] border border-[#00FF41] shadow-[2px_2px_0px_0px_#262626] hover:shadow-[3px_3px_0px_0px_#00FF41] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer flex items-center space-x-2"
              >
                <span>LOG IN / REGISTER</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setViewState('landing')}
                className="px-3 py-1.5 text-xs font-mono text-[#A1A1AA] hover:text-[#EDEDED] bg-[#121212] border border-[#262626] hover:border-[#404040] transition-colors cursor-pointer"
              >
                &larr; BACK TO PORTAL
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Dynamic Animated Body Content */}
      <div className="flex-1 flex flex-col justify-center relative z-20">
        <AnimatePresence mode="wait">
          
          {/* ========================================================================= */}
          {/* VIEW 1: HERO LANDING WITH CENTRAL MOUSE-TRACKING ACCESS PORTAL             */}
          {/* ========================================================================= */}
          {viewState === 'landing' && (
            <motion.main
              key="landing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-12 lg:py-16 flex flex-col items-center justify-center text-center"
            >
              {/* Terminal Decode Header Badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center space-x-2 px-3 py-1 bg-[#0A0A0A] border border-[#262626] text-xs font-mono text-[#00FF41] mb-6 shadow-[2px_2px_0px_0px_#171717]"
              >
                <span className="w-2 h-2 bg-[#00FF41] inline-block animate-pulse" />
                <span className="tracking-wider">{decodedBadge}</span>
              </motion.div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#EDEDED] font-display max-w-4xl leading-[1.08] mb-6">
                {decodedHeroTitle}
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-[#A1A1AA] max-w-2xl font-sans mb-10 leading-relaxed">
                Engineered by <strong className="text-[#EDEDED]">Som Maurya</strong>. An authentic multimodal workspace uniting AI conversation, vector artwork, video simulation, and focus music.
              </p>

              {/* Centralized "Access Portal" with Mouse-Tracking Glow */}
              <div
                ref={portalRef}
                onMouseMove={handlePortalMouseMove}
                onMouseLeave={handlePortalMouseLeave}
                className="relative w-full max-w-xl p-1 bg-[#0A0A0A]/90 border border-[#333333] shadow-[0_0_50px_-15px_rgba(0,255,65,0.15)] group transition-all duration-300 overflow-hidden"
                style={{
                  borderRadius: '2px',
                }}
              >
                {/* Mouse-Tracking Glow Layer */}
                {mousePos.isHovered && (
                  <div
                    className="absolute pointer-events-none transition-opacity duration-200"
                    style={{
                      left: mousePos.x - 175,
                      top: mousePos.y - 175,
                      width: '350px',
                      height: '350px',
                      background: 'radial-gradient(circle, rgba(0, 255, 65, 0.18) 0%, rgba(0, 255, 65, 0.04) 45%, transparent 70%)',
                      filter: 'blur(10px)',
                    }}
                  />
                )}

                {/* Inner Portal Container */}
                <div className="relative z-10 p-6 sm:p-8 bg-[#0D0D0D]/95 backdrop-blur-xl border border-[#262626] text-left space-y-6">
                  {/* Top Bar of Portal */}
                  <div className="flex items-center justify-between border-b border-[#262626] pb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 bg-[#00FF41] rounded-none animate-pulse" />
                      <span className="text-xs font-mono font-bold text-[#EDEDED]">
                        SOMOTOZ_WORKSPACE // READY
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-[#00FF41] border border-[#00FF41]/40">
                      SECURE
                    </span>
                  </div>

                  {/* Kernel Status Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-[11px]">
                    <div className="p-2.5 bg-black border border-[#262626]">
                      <span className="text-[#737373] block text-[10px]">AI ENGINE</span>
                      <span className="text-[#00FF41] font-bold">Gemini 2.5 Flash</span>
                    </div>
                    <div className="p-2.5 bg-black border border-[#262626]">
                      <span className="text-[#737373] block text-[10px]">RESPONSE TIME</span>
                      <span className="text-[#00FF41] font-bold">&lt; 50ms Realtime</span>
                    </div>
                    <div className="p-2.5 bg-black border border-[#262626] col-span-2 sm:col-span-1">
                      <span className="text-[#737373] block text-[10px]">DATA STORAGE</span>
                      <span className="text-[#EDEDED] font-bold">Encrypted Firestore</span>
                    </div>
                  </div>

                  {/* Portal Call to Action Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => setViewState('auth')}
                      className="w-full py-4 px-6 bg-[#00FF41] hover:bg-[#00E038] text-black font-mono font-bold text-sm tracking-wide border border-[#00FF41] shadow-[4px_4px_0px_0px_#333333] hover:shadow-[4px_4px_0px_0px_#00FF41] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all flex items-center justify-center space-x-3 cursor-pointer group/btn"
                    >
                      <Fingerprint className="w-5 h-5 text-black" />
                      <span>OPEN SOMOTOZ WORKSPACE</span>
                      <ArrowRight className="w-4 h-4 text-black group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  {/* Footnote inside portal */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#737373] pt-1">
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#00FF41]" />
                      Private & Secure
                    </span>
                    <span>Sign in with Google or create an account</span>
                  </div>
                </div>
              </div>

              {/* Bottom 4 Feature Cards with Green Glowing Border on Hover */}
              <div className="w-full max-w-5xl mt-16 text-left">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-[#737373] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#00FF41]" />
                    INTEGRATED CORE TOOLS
                  </span>
                  <span className="text-xs font-mono text-[#00FF41]">4 TOOLS ONLINE</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  <div className="p-4 bg-[#0A0A0A] border border-[#262626] hover:border-[#00FF41] hover:-translate-y-1 transition-all duration-200 shadow-[2px_2px_0px_0px_#171717] group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-[#EDEDED] group-hover:text-[#00FF41]">01 // CHAT</span>
                      <span className="text-[10px] font-mono text-[#737373]">#ai-chat</span>
                    </div>
                    <h3 className="text-xs font-bold text-[#EDEDED] mb-1 font-display">Chat</h3>
                    <p className="text-[11px] text-[#A1A1AA] leading-relaxed font-sans">Advanced AI conversation, technical questions, and thoughtful reasoning.</p>
                  </div>

                  <div className="p-4 bg-[#0A0A0A] border border-[#262626] hover:border-[#00FF41] hover:-translate-y-1 transition-all duration-200 shadow-[2px_2px_0px_0px_#171717] group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-[#EDEDED] group-hover:text-[#00FF41]">02 // IMAGES</span>
                      <span className="text-[10px] font-mono text-[#737373]">#vector-svg</span>
                    </div>
                    <h3 className="text-xs font-bold text-[#EDEDED] mb-1 font-display">Image Generation</h3>
                    <p className="text-[11px] text-[#A1A1AA] leading-relaxed font-sans">Create stunning vector visuals and downloadable SVG art from simple prompts.</p>
                  </div>

                  <div className="p-4 bg-[#0A0A0A] border border-[#262626] hover:border-[#00FF41] hover:-translate-y-1 transition-all duration-200 shadow-[2px_2px_0px_0px_#171717] group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-[#EDEDED] group-hover:text-[#00FF41]">03 // VIDEO</span>
                      <span className="text-[10px] font-mono text-[#737373]">#canvas-motion</span>
                    </div>
                    <h3 className="text-xs font-bold text-[#EDEDED] mb-1 font-display">Video Generator</h3>
                    <p className="text-[11px] text-[#A1A1AA] leading-relaxed font-sans">Generate high-quality animated scene frames with interactive playback.</p>
                  </div>

                  <div className="p-4 bg-[#0A0A0A] border border-[#262626] hover:border-[#00FF41] hover:-translate-y-1 transition-all duration-200 shadow-[2px_2px_0px_0px_#171717] group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-[#EDEDED] group-hover:text-[#00FF41]">04 // MUSIC</span>
                      <span className="text-[10px] font-mono text-[#737373]">#focus-audio</span>
                    </div>
                    <h3 className="text-xs font-bold text-[#EDEDED] mb-1 font-display">Music Generator</h3>
                    <p className="text-[11px] text-[#A1A1AA] leading-relaxed font-sans">Compose dynamic audio melodies and 432Hz focus sounds with live synthesizers.</p>
                  </div>

                </div>
              </div>
            </motion.main>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2: AUTHENTICATION PAGE (SPLIT-SCREEN 3D CARD)                        */}
          {/* ========================================================================= */}
          {viewState === 'auth' && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12"
            >
              <div className="bg-[#0A0A0A] border border-[#333333] shadow-[8px_8px_0px_0px_#171717] grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                
                {/* Left Side: Developer Credentials */}
                <div className="lg:col-span-5 bg-[#0D0D0D] p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-[#262626] flex flex-col justify-between space-y-6 text-left font-mono">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-xs text-[#00FF41]">
                      <Terminal className="w-4 h-4" />
                      <span className="font-bold">SOMOTOZ_AUTH</span>
                    </div>

                    <h2 className="text-2xl font-bold text-[#EDEDED] font-display">
                      Enter Somotoz AI Suite.
                    </h2>

                    <p className="text-xs text-[#A1A1AA] leading-relaxed font-sans">
                      Created by <strong className="text-[#EDEDED]">Som Maurya</strong> (Data Science & Computational Thinking, Kaggle 5-Day AI Agents Intensive, AI for Bharat, INDIA RUNS).
                    </p>

                    {/* Developer System Specs */}
                    <div className="p-3 bg-black border border-[#262626] space-y-2 text-[11px]">
                      <div className="flex items-center justify-between text-[#737373]">
                        <span>DEVELOPER</span>
                        <span className="text-[#EDEDED]">Som Maurya</span>
                      </div>
                      <div className="flex items-center justify-between text-[#737373]">
                        <span>AI FRAMEWORK</span>
                        <span className="text-[#00FF41]">AI Agents & Data Science</span>
                      </div>
                      <div className="flex items-center justify-between text-[#737373]">
                        <span>DATABASE</span>
                        <span className="text-[#EDEDED]">Google Cloud Firestore</span>
                      </div>
                      <div className="flex items-center justify-between text-[#737373]">
                        <span>SECURITY</span>
                        <span className="text-[#00FF41]">Private & Encrypted</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#262626] text-[11px] text-[#737373] space-y-1">
                    <div className="flex items-center gap-1.5 text-[#00FF41]">
                      <Shield className="w-3.5 h-3.5" />
                      <span>User Privacy Guaranteed</span>
                    </div>
                    <p>Your notes and prompts remain private and secure.</p>
                  </div>
                </div>

                {/* Right Side: Interactive Login / Register Form Container */}
                <div className="lg:col-span-7 p-6 sm:p-8 bg-[#0A0A0A] flex flex-col justify-center">
                  
                  {/* Mode Switcher Pill */}
                  <div className="flex bg-black border border-[#262626] p-1 mb-6 font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className={`flex-1 py-2 font-bold transition-all cursor-pointer ${
                        authMode === 'login'
                          ? 'bg-[#00FF41] text-black shadow-[2px_2px_0px_0px_#171717]'
                          : 'text-[#A1A1AA] hover:text-[#EDEDED]'
                      }`}
                    >
                      LOG IN
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('register')}
                      className={`flex-1 py-2 font-bold transition-all cursor-pointer ${
                        authMode === 'register'
                          ? 'bg-[#00FF41] text-black shadow-[2px_2px_0px_0px_#171717]'
                          : 'text-[#A1A1AA] hover:text-[#EDEDED]'
                      }`}
                    >
                      CREATE ACCOUNT
                    </button>
                  </div>

                  {/* Social Authentication Buttons */}
                  <div className="space-y-3 mb-6">
                    {/* Google Sign In */}
                    <button
                      type="button"
                      onClick={handleSocialGoogle}
                      disabled={isAuthenticating}
                      className="w-full py-3 px-4 bg-black hover:bg-[#121212] border border-[#333333] hover:border-[#00FF41] text-xs font-mono text-[#EDEDED] flex items-center justify-center space-x-3 transition-all duration-200 cursor-pointer shadow-[2px_2px_0px_0px_#171717] hover:shadow-[0_0_15px_rgba(0,255,65,0.25)] group"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                        />
                      </svg>
                      <span className="group-hover:text-[#00FF41] transition-colors">
                        {isAuthenticating ? 'SIGNING IN WITH GOOGLE...' : 'Continue with Google'}
                      </span>
                    </button>

                    {/* Facebook / Meta Sign In */}
                    <button
                      type="button"
                      onClick={handleSocialMeta}
                      className="w-full py-3 px-4 bg-black hover:bg-[#121212] border border-[#333333] hover:border-[#00FF41] text-xs font-mono text-[#EDEDED] flex items-center justify-center space-x-3 transition-all duration-200 cursor-pointer shadow-[2px_2px_0px_0px_#171717] hover:shadow-[0_0_15px_rgba(0,255,65,0.25)] group"
                    >
                      <svg className="w-4 h-4 text-[#00FF41] fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      <span className="group-hover:text-[#00FF41] transition-colors">
                        Continue with Meta
                      </span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="relative flex py-2 items-center mb-6">
                    <div className="flex-grow border-t border-[#262626]"></div>
                    <span className="flex-shrink mx-3 text-[10px] font-mono text-[#737373] bg-[#0A0A0A] px-2 border border-[#262626]">
                      OR SIGN IN WITH EMAIL & PHONE
                    </span>
                    <div className="flex-grow border-t border-[#262626]"></div>
                  </div>

                  {authError && (
                    <div className="mb-4 p-3 bg-[#1A0505] border border-rose-600 text-rose-300 text-xs font-mono">
                      {authError}
                    </div>
                  )}

                  {/* Manual Inputs Form with Floating Labels */}
                  <form onSubmit={handleFormSubmit} className="space-y-4 text-left font-sans">
                    
                    {/* Full Name (Only in Register Mode) */}
                    {authMode === 'register' && (
                      <div className="relative">
                        <div
                          className={`relative border transition-all duration-200 bg-black ${
                            focusedField === 'fullName'
                              ? 'border-[#00FF41] shadow-[0_0_15px_rgba(0,255,65,0.35)]'
                              : 'border-[#262626] hover:border-[#404040]'
                          }`}
                        >
                          <input
                            id="fullName"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            onFocus={() => setFocusedField('fullName')}
                            onBlur={() => setFocusedField(null)}
                            required
                            placeholder=" "
                            className="w-full px-3.5 pt-5 pb-2 bg-transparent text-xs text-[#EDEDED] font-mono focus:outline-none"
                          />
                          <label
                            htmlFor="fullName"
                            className={`absolute left-3.5 transition-all duration-200 pointer-events-none font-mono text-xs ${
                              focusedField === 'fullName' || fullName
                                ? 'top-1.5 text-[10px] text-[#00FF41]'
                                : 'top-3.5 text-[#737373]'
                            }`}
                          >
                            Full Name
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Email Input */}
                    <div className="relative">
                      <div
                        className={`relative border transition-all duration-200 bg-black ${
                          focusedField === 'email'
                            ? 'border-[#00FF41] shadow-[0_0_15px_rgba(0,255,65,0.35)]'
                            : 'border-[#262626] hover:border-[#404040]'
                        }`}
                      >
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => setFocusedField(null)}
                          required
                          placeholder=" "
                          className="w-full px-3.5 pt-5 pb-2 bg-transparent text-xs text-[#EDEDED] font-mono focus:outline-none"
                        />
                        <label
                          htmlFor="email"
                          className={`absolute left-3.5 transition-all duration-200 pointer-events-none font-mono text-xs ${
                            focusedField === 'email' || email
                              ? 'top-1.5 text-[10px] text-[#00FF41]'
                              : 'top-3.5 text-[#737373]'
                          }`}
                        >
                          Email Address
                        </label>
                      </div>
                    </div>

                    {/* Phone Number Input with Country Selector */}
                    <div className="relative">
                      <div
                        className={`relative border flex transition-all duration-200 bg-black ${
                          focusedField === 'phone' || countryDropdownOpen
                            ? 'border-[#00FF41] shadow-[0_0_15px_rgba(0,255,65,0.35)]'
                            : 'border-[#262626] hover:border-[#404040]'
                        }`}
                      >
                        {/* Country Code Trigger */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                            className="h-full px-3 py-3 bg-[#0D0D0D] border-r border-[#262626] flex items-center space-x-1.5 text-xs font-mono text-[#EDEDED] hover:bg-[#171717] transition-colors cursor-pointer"
                          >
                            <span className="text-sm">{selectedCountry.flag}</span>
                            <span className="text-[#00FF41] font-bold">{selectedCountry.dial}</span>
                            <ChevronDown className="w-3 h-3 text-[#737373]" />
                          </button>

                          {/* Country Selector Dropdown */}
                          {countryDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-64 max-h-56 bg-[#0D0D0D] border border-[#00FF41] shadow-[0_0_20px_rgba(0,255,65,0.25)] z-50 overflow-hidden flex flex-col">
                              <div className="p-2 border-b border-[#262626] bg-black">
                                <div className="flex items-center space-x-1.5 px-2 py-1 bg-[#121212] border border-[#333333]">
                                  <Search className="w-3 h-3 text-[#737373]" />
                                  <input
                                    type="text"
                                    placeholder="Search country..."
                                    value={countrySearch}
                                    onChange={(e) => setCountrySearch(e.target.value)}
                                    className="w-full bg-transparent text-[11px] font-mono text-[#EDEDED] focus:outline-none"
                                    autoFocus
                                  />
                                </div>
                              </div>

                              <div className="overflow-y-auto flex-1 p-1 space-y-0.5 font-mono text-xs">
                                {filteredCountries.map((c) => (
                                  <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCountry(c);
                                      setCountryDropdownOpen(false);
                                      setCountrySearch('');
                                    }}
                                    className={`w-full px-2.5 py-1.5 text-left flex items-center justify-between hover:bg-[#171717] transition-colors ${
                                      selectedCountry.code === c.code ? 'bg-black text-[#00FF41]' : 'text-[#EDEDED]'
                                    }`}
                                  >
                                    <span className="flex items-center space-x-2">
                                      <span>{c.flag}</span>
                                      <span className="text-[11px] truncate max-w-[130px]">{c.name}</span>
                                    </span>
                                    <span className="text-[10px] text-[#737373]">{c.dial}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Phone Number Input */}
                        <div className="relative flex-1">
                          <input
                            id="phone"
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            onFocus={() => setFocusedField('phone')}
                            onBlur={() => setFocusedField(null)}
                            placeholder=" "
                            className="w-full px-3.5 pt-5 pb-2 bg-transparent text-xs text-[#EDEDED] font-mono focus:outline-none"
                          />
                          <label
                            htmlFor="phone"
                            className={`absolute left-3.5 transition-all duration-200 pointer-events-none font-mono text-xs ${
                              focusedField === 'phone' || phoneNumber
                                ? 'top-1.5 text-[10px] text-[#00FF41]'
                                : 'top-3.5 text-[#737373]'
                            }`}
                          >
                            Phone Number
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Password Input */}
                    <div className="relative">
                      <div
                        className={`relative border transition-all duration-200 bg-black ${
                          focusedField === 'password'
                            ? 'border-[#00FF41] shadow-[0_0_15px_rgba(0,255,65,0.35)]'
                            : 'border-[#262626] hover:border-[#404040]'
                        }`}
                      >
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setFocusedField('password')}
                          onBlur={() => setFocusedField(null)}
                          required
                          placeholder=" "
                          className="w-full px-3.5 pt-5 pb-2 pr-10 bg-transparent text-xs text-[#EDEDED] font-mono focus:outline-none"
                        />
                        <label
                          htmlFor="password"
                          className={`absolute left-3.5 transition-all duration-200 pointer-events-none font-mono text-xs ${
                            focusedField === 'password' || password
                              ? 'top-1.5 text-[10px] text-[#00FF41]'
                              : 'top-3.5 text-[#737373]'
                          }`}
                        >
                          Password
                        </label>

                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-4 text-[#737373] hover:text-[#EDEDED] transition-colors cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-3">
                      <button
                        type="submit"
                        className="w-full py-3.5 px-4 bg-[#00FF41] hover:bg-[#00E038] text-black font-mono font-bold text-xs tracking-wider border border-[#00FF41] shadow-[3px_3px_0px_0px_#333333] hover:shadow-[3px_3px_0px_0px_#00FF41] active:translate-x-0 active:translate-y-0 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <KeyRound className="w-4 h-4 text-black" />
                        <span>
                          {authMode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
                        </span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 3: SUCCESS ANIMATION MODAL                                          */}
          {/* ========================================================================= */}
          {viewState === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, filter: 'blur(10px)' }}
              transition={{ duration: 0.35 }}
              className="max-w-md mx-auto w-full px-4 text-center"
            >
              <div className="p-8 bg-[#0A0A0A] border border-[#00FF41] shadow-[0_0_40px_rgba(0,255,65,0.25)] space-y-6 font-mono">
                <div className="relative mx-auto w-20 h-20 bg-black border border-[#00FF41] flex items-center justify-center shadow-[4px_4px_0px_0px_#00FF41]">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-1 border border-dashed border-[#00FF41]/40"
                  />
                  {authStage.includes('ACCESS_GRANTED') ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 10, stiffness: 150 }}
                    >
                      <Check className="w-10 h-10 text-[#00FF41]" />
                    </motion.div>
                  ) : (
                    <Fingerprint className="w-10 h-10 text-[#00FF41] animate-pulse" />
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-[#EDEDED] font-display">
                    {authStage.includes('ACCESS_GRANTED') ? 'ACCESS GRANTED' : 'AUTHENTICATING'}
                  </h3>
                  <p className="text-xs text-[#00FF41] font-mono tracking-wide">
                    &gt; {authStage}
                  </p>
                </div>

                <div className="p-3 bg-black border border-[#262626] text-left text-[11px] space-y-1">
                  <div className="flex justify-between text-[#737373]">
                    <span>USER:</span>
                    <span className="text-[#EDEDED] font-bold">
                      {activeDecryptedUser?.displayName || 'Somotoz User'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#737373]">
                    <span>SECURITY:</span>
                    <span className="text-[#00FF41]">Encrypted Sandbox</span>
                  </div>
                  <div className="flex justify-between text-[#737373]">
                    <span>STATUS:</span>
                    <span className="text-[#EDEDED]">Opening Workspace...</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-[#171717] overflow-hidden">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.8, ease: 'easeInOut' }}
                    className="h-full bg-[#00FF41]"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 4: DASHBOARD PREVIEW REDIRECT                                        */}
          {/* ========================================================================= */}
          {viewState === 'dashboard_preview' && (
            <motion.div
              key="dashboard_preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 text-left font-mono"
            >
              <div className="bg-[#0A0A0A] border border-[#00FF41] shadow-[6px_6px_0px_0px_#00FF41] overflow-hidden">
                {/* Header bar */}
                <div className="bg-[#121212] border-b border-[#262626] p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-[#00FF41]" />
                    <span className="text-sm font-bold text-[#EDEDED]">
                      SOMOTOZ WORKSPACE // ONLINE
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-[#737373]">
                    <span>USER: <strong className="text-[#00FF41]">{activeDecryptedUser?.displayName || 'Somotoz User'}</strong></span>
                    <button
                      onClick={() => setViewState('landing')}
                      className="px-2.5 py-1 bg-black border border-[#262626] text-rose-400 hover:border-rose-400 text-[11px] cursor-pointer"
                    >
                      LOGOUT
                    </button>
                  </div>
                </div>

                {/* Dashboard layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
                  {/* Sidebar */}
                  <div className="md:col-span-4 bg-[#0D0D0D] border-r border-[#262626] p-4 space-y-4">
                    <div className="text-xs text-[#737373] uppercase tracking-wider">
                      Main Tools
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="p-2.5 bg-black border border-[#00FF41] text-[#00FF41] flex items-center justify-between">
                        <span>Daily Notes & Journal</span>
                        <span className="text-[10px]">ACTIVE</span>
                      </div>
                      <div className="p-2.5 bg-black border border-[#262626] text-[#A1A1AA] hover:border-[#404040] flex items-center justify-between">
                        <span>Chat (Text & Media)</span>
                        <span className="text-[10px]">READY</span>
                      </div>
                      <div className="p-2.5 bg-black border border-[#262626] text-[#A1A1AA] hover:border-[#404040] flex items-center justify-between">
                        <span>Knowledge Hub</span>
                        <span className="text-[10px]">READY</span>
                      </div>
                      <div className="p-2.5 bg-black border border-[#262626] text-[#A1A1AA] hover:border-[#404040] flex items-center justify-between">
                        <span>Focus Sounds & Music</span>
                        <span className="text-[10px]">READY</span>
                      </div>
                    </div>
                  </div>

                  {/* Main Area */}
                  <div className="md:col-span-8 p-6 space-y-6">
                    <div className="p-4 bg-black border border-[#262626] space-y-2">
                      <div className="text-xs text-[#00FF41] font-bold">
                        &gt; WELCOME
                      </div>
                      <h2 className="text-xl font-bold text-[#EDEDED] font-display">
                        Hello, {activeDecryptedUser?.displayName || 'User'}. Somotoz Workspace is ready.
                      </h2>
                      <p className="text-xs text-[#A1A1AA] leading-relaxed font-sans">
                        All tools and data storage are synchronized. Start exploring AI chat, vector illustrations, video generation, or focus music.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="p-4 bg-black border border-[#262626] space-y-1">
                        <span className="text-[#737373] text-[10px]">STORAGE QUOTA</span>
                        <p className="text-[#00FF41] font-bold">Encrypted Private Storage</p>
                      </div>
                      <div className="p-4 bg-black border border-[#262626] space-y-1">
                        <span className="text-[#737373] text-[10px]">MULTIMODAL SUITE</span>
                        <p className="text-[#00FF41] font-bold">Chat + SVG + Video + Music</p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={onSignIn}
                        className="px-5 py-3 bg-[#00FF41] text-black font-mono font-bold text-xs border border-[#00FF41] shadow-[3px_3px_0px_0px_#333333] hover:shadow-[3px_3px_0px_0px_#00FF41] cursor-pointer"
                      >
                        SYNC WITH GOOGLE CLOUD ACCOUNT &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Persistent Technical Footer */}
      <footer className="relative z-30 w-full border-t border-[#262626] bg-[#0A0A0A] py-5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-[#737373]">
          <div className="flex items-center space-x-2">
            <span>SOMOTOZ AI SUITE</span>
            <span>•</span>
            <span>GEMINI 2.5</span>
            <span>•</span>
            <span>FIRESTORE CLOUD</span>
          </div>

          <div className="flex items-center space-x-2 text-[#EDEDED]">
            <span>ENGINEERED BY</span>
            <strong className="text-[#00FF41] underline decoration-[#00FF41]/40 underline-offset-2">
              SOM MAURYA
            </strong>
            <span className="text-[#737373]">(DATA SCIENCE & COMPUTATIONAL THINKING)</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
