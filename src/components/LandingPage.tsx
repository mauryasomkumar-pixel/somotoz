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
  Volume2,
  MessageSquare,
  Image as ImageIcon,
  Video,
  Music,
  Flame,
  Sun,
  Moon,
  Glasses,
  Compass,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { UserProfile } from '../types';
import { useTheme } from '../context/ThemeContext';
import { ThemeSwitcher } from './ThemeSwitcher';

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

// Ambient Cybernetic Particle Canvas
const CyberParticleNetwork: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const particleCount = Math.min(45, Math.floor((width * height) / 25000));
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        size: Math.random() * 1.8 + 0.8,
        alpha: Math.random() * 0.4 + 0.15,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Connect near particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 255, 65, ${0.12 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      // Draw and update particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 65, ${p.alpha})`;
        ctx.shadowColor = '#00FF41';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-40" />;
};

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
  // Global Theme Context for Night, Day, and Eye Comfort (Mix) Modes
  const { theme, isAutoMode, autoThemeReason } = useTheme();
  const isLight = theme === 'white';
  const isMix = theme === 'mix';

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

  // Terminal Decoded Headings with Elite Hackathon Narrative
  const decodedHeroTitle = useTerminalDecode('SOMOTOZ AI SUITE', 80, 30);
  const decodedBadge = useTerminalDecode('SOMOTOZ // COGNITIVE ARCHITECTURE & MULTIMODAL CORE', 40, 20);

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
    <div
      className={`min-h-screen flex flex-col justify-between selection:bg-[#00F0FF] selection:text-black font-sans relative overflow-x-hidden transition-colors duration-300 ${
        isLight
          ? 'bg-[#F4F6FB] text-[#090D16]'
          : isMix
          ? 'bg-[#F6F2E9] text-[#231E19]'
          : 'bg-[#030308] text-[#EDEDED]'
      }`}
    >
      {/* Dynamic Background Grid & Ambient Cybernetic Particle Canvas */}
      <div
        className={`absolute inset-0 pointer-events-none [background-size:24px_24px] ${
          isLight
            ? 'bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] opacity-50'
            : isMix
            ? 'bg-[radial-gradient(#D8CEBF_1px,transparent_1px)] opacity-45'
            : 'bg-[radial-gradient(#1e1e2e_1px,transparent_1px)] opacity-35'
        }`}
      />
      {!isLight && <CyberParticleNetwork />}

      {/* Ambient Radial Glows */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[340px] blur-[150px] pointer-events-none ${
          isLight
            ? 'bg-[#0284C7]/10'
            : isMix
            ? 'bg-[#D97706]/12'
            : 'bg-[#00F0FF]/10'
        }`}
      />
      <div
        className={`absolute top-40 right-10 w-[400px] h-[400px] blur-[140px] pointer-events-none ${
          isLight
            ? 'bg-[#7C3AED]/8'
            : isMix
            ? 'bg-[#0D9488]/8'
            : 'bg-[#FF007A]/8'
        }`}
      />

      {/* Top Header with Embedded Theme Mode Selector & Non-Rectangular Branding */}
      <header
        className={`relative z-30 w-full border-b backdrop-blur-md transition-colors duration-300 ${
          isLight
            ? 'border-[#E2E8F0] bg-white/90 shadow-sm'
            : isMix
            ? 'border-[#E4DCD0] bg-[#FAF6EE]/90 shadow-sm'
            : 'border-[#252538] bg-[#0A0A14]/90'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Version Badge */}
          <div
            onClick={() => setViewState('landing')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div
              className={`w-9 h-9 clip-badge-poly flex items-center justify-center font-mono font-bold text-sm transition-all duration-300 ${
                isLight
                  ? 'bg-gradient-to-br from-[#0284C7] to-[#7C3AED] text-white shadow-[0_0_12px_rgba(2,132,199,0.4)]'
                  : isMix
                  ? 'bg-gradient-to-br from-[#D97706] to-[#0D9488] text-white shadow-[0_0_12px_rgba(217,119,6,0.4)]'
                  : 'bg-gradient-to-br from-[#00F0FF] to-[#A855F7] text-black shadow-[0_0_15px_rgba(0,240,255,0.5)]'
              }`}
            >
              S_
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`text-base font-bold tracking-tight font-mono transition-colors ${
                  isLight
                    ? 'text-[#090D16] group-hover:text-[#0284C7]'
                    : isMix
                    ? 'text-[#231E19] group-hover:text-[#D97706]'
                    : 'text-[#EDEDED] group-hover:text-[#00F0FF]'
                }`}
              >
                SOMOTOZ
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 clip-badge-poly font-bold border ${
                  isLight
                    ? 'bg-[#E2E8F0] text-[#0284C7] border-[#CBD5E1]'
                    : isMix
                    ? 'bg-[#EFE7DA] text-[#D97706] border-[#D8CEBF]'
                    : 'bg-[#141424] text-[#00F0FF] border-[#00F0FF]/40'
                }`}
              >
                v2.5
              </span>
            </div>
          </div>

          {/* Center / Right Control Area: Theme Switcher & Actions */}
          <div className="flex items-center flex-wrap gap-3 sm:gap-4">
            {/* Embedded Front-View Theme Mode Selector */}
            <div className="flex items-center">
              <ThemeSwitcher compact={true} />
            </div>

            {/* Architect Credit Badge */}
            <div
              className={`hidden xl:flex items-center space-x-2 text-xs font-mono px-3 py-1.5 clip-badge-poly border ${
                isLight
                  ? 'bg-white border-[#E2E8F0] text-[#475569]'
                  : isMix
                  ? 'bg-[#FAF6EE] border-[#E4DCD0] text-[#5F564D]'
                  : 'bg-black/60 border-[#2D2D45] text-[#A1A1AA]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${
                  isLight ? 'bg-[#0284C7]' : isMix ? 'bg-[#D97706]' : 'bg-[#00F0FF]'
                }`}
              />
              <span>
                Architect: <strong className={isLight ? 'text-[#090D16]' : isMix ? 'text-[#231E19]' : 'text-[#EDEDED]'}>Som Maurya</strong>
              </span>
              <span className="opacity-40">|</span>
              <span className="text-[11px] font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#A855F7] to-[#FF007A]">
                IIT Madras Data Science &amp; Computational Thinking
              </span>
            </div>

            {/* Auth Action Button */}
            {viewState === 'landing' ? (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setViewState('auth')}
                className={`px-4 py-2 text-xs font-mono font-bold clip-badge-poly transition-all cursor-pointer flex items-center space-x-2 ${
                  isLight
                    ? 'bg-gradient-to-r from-[#0284C7] to-[#7C3AED] text-white shadow-[0_0_15px_rgba(2,132,199,0.35)] hover:shadow-[0_0_20px_rgba(2,132,199,0.5)]'
                    : isMix
                    ? 'bg-gradient-to-r from-[#D97706] to-[#0D9488] text-white shadow-[0_0_15px_rgba(217,119,6,0.35)] hover:shadow-[0_0_20px_rgba(217,119,6,0.5)]'
                    : 'bg-gradient-to-r from-[#00F0FF] via-[#A855F7] to-[#FF007A] text-black shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)]'
                }`}
              >
                <span>ENTER WORKSPACE</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            ) : (
              <button
                onClick={() => setViewState('landing')}
                className={`px-3 py-1.5 text-xs font-mono clip-badge-poly border transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-white border-[#CBD5E1] text-[#475569] hover:text-[#090D16]'
                    : isMix
                    ? 'bg-[#FAF6EE] border-[#D8CEBF] text-[#5F564D] hover:text-[#231E19]'
                    : 'bg-[#121222] border-[#2D2D45] text-[#A1A1AA] hover:text-[#EDEDED]'
                }`}
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
          {/* VIEW 1: HERO LANDING WITH GEOMETRIC MOUSE-TRACKING ACCESS PORTAL          */}
          {/* ========================================================================= */}
          {viewState === 'landing' && (
            <motion.main
              key="landing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-10 lg:py-14 flex flex-col items-center justify-center text-center"
            >
              {/* Terminal Decode Header Badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={`inline-flex items-center space-x-2 px-4 py-1.5 clip-badge-poly text-xs font-mono mb-6 border transition-colors shadow-sm ${
                  isLight
                    ? 'bg-white border-[#CBD5E1] text-[#0284C7] shadow-[0_2px_10px_rgba(2,132,199,0.15)]'
                    : isMix
                    ? 'bg-[#FAF6EE] border-[#D8CEBF] text-[#D97706] shadow-[0_2px_10px_rgba(217,119,6,0.15)]'
                    : 'bg-[#0A0A14] border-[#00F0FF]/40 text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full inline-block animate-pulse ${
                    isLight ? 'bg-[#0284C7]' : isMix ? 'bg-[#D97706]' : 'bg-[#00F0FF]'
                  }`}
                />
                <span className="tracking-wider font-semibold">{decodedBadge}</span>
              </motion.div>

              {/* Main Headline */}
              <h1
                className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight font-display max-w-4xl leading-[1.08] mb-5 transition-colors ${
                  isLight ? 'text-[#090D16]' : isMix ? 'text-[#231E19]' : 'text-[#EDEDED]'
                }`}
              >
                {decodedHeroTitle}
              </h1>

              {/* Main Hero Statement */}
              <p
                className={`text-sm sm:text-base lg:text-lg max-w-3xl font-sans mb-3 leading-relaxed transition-colors ${
                  isLight ? 'text-[#1E293B]' : isMix ? 'text-[#3E342B]' : 'text-[#EDEDED]'
                }`}
              >
                Architected entirely from the ground up by{' '}
                <strong
                  className={`font-semibold ${
                    isLight ? 'text-[#0284C7]' : isMix ? 'text-[#D97706]' : 'text-[#00F0FF]'
                  }`}
                >
                  Som Maurya (IIT Madras Data Science &amp; Computational Thinking)
                </strong>
                . An enterprise-grade autonomous cognitive architecture built to obliterate legacy SaaS bottlenecks, featuring sub-50ms neural inference, multi-modal vector generation, real-time 60FPS motion physics simulation, and 432Hz harmonic frequency synthesis.
              </p>

              {/* Sub-headline */}
              <p
                className={`text-xs sm:text-sm max-w-2xl font-mono mb-8 leading-relaxed ${
                  isLight ? 'text-[#475569]' : isMix ? 'text-[#5F564D]' : 'text-[#A1A1AA]'
                }`}
              >
                Engineered for uncompromising speed (&lt;50ms response), decentralized secure cloud persistence, and elite multi-modal reasoning. Built to redefine what an individual full-stack engineer can achieve.
              </p>

              {/* Centralized Non-Rectangular "Access Portal" */}
              <div
                ref={portalRef}
                onMouseMove={handlePortalMouseMove}
                onMouseLeave={handlePortalMouseLeave}
                className={`relative w-full max-w-2xl p-[2px] clip-cyber-corner transition-all duration-300 ${
                  isLight
                    ? 'bg-gradient-to-br from-[#0284C7]/40 via-[#7C3AED]/30 to-[#0284C7]/20 shadow-[0_15px_40px_rgba(2,132,199,0.15)]'
                    : isMix
                    ? 'bg-gradient-to-br from-[#D97706]/40 via-[#0D9488]/30 to-[#D97706]/20 shadow-[0_15px_40px_rgba(217,119,6,0.15)]'
                    : 'bg-gradient-to-br from-[#00F0FF]/50 via-[#A855F7]/40 to-[#FF007A]/40 shadow-[0_0_50px_rgba(0,240,255,0.25)]'
                }`}
              >
                {/* Mouse-Tracking Glow Layer */}
                {mousePos.isHovered && (
                  <div
                    className="absolute pointer-events-none transition-opacity duration-200"
                    style={{
                      left: mousePos.x - 180,
                      top: mousePos.y - 180,
                      width: '360px',
                      height: '360px',
                      background: isLight
                        ? 'radial-gradient(circle, rgba(2, 132, 199, 0.25) 0%, rgba(124, 58, 237, 0.08) 45%, transparent 70%)'
                        : isMix
                        ? 'radial-gradient(circle, rgba(217, 119, 6, 0.25) 0%, rgba(13, 148, 136, 0.08) 45%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(0, 240, 255, 0.3) 0%, rgba(168, 85, 247, 0.12) 45%, transparent 70%)',
                      filter: 'blur(12px)',
                    }}
                  />
                )}

                {/* Inner Portal Container */}
                <div
                  className={`relative z-10 p-6 sm:p-8 clip-cyber-corner text-left space-y-6 backdrop-blur-xl ${
                    isLight
                      ? 'bg-white/95 text-[#090D16]'
                      : isMix
                      ? 'bg-[#FAF6EE]/95 text-[#231E19]'
                      : 'bg-[#0B0B16]/95 text-[#EDEDED]'
                  }`}
                >
                  {/* Top Bar of Portal */}
                  <div
                    className={`flex items-center justify-between border-b pb-4 ${
                      isLight
                        ? 'border-[#E2E8F0]'
                        : isMix
                        ? 'border-[#E4DCD0]'
                        : 'border-[#252538]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`w-3 h-3 clip-badge-poly animate-pulse ${
                          isLight ? 'bg-[#0284C7]' : isMix ? 'bg-[#D97706]' : 'bg-[#00F0FF]'
                        }`}
                      />
                      <span className="text-xs font-mono font-bold tracking-wider">
                        SOMOTOZ_WORKSPACE // READY
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2.5 py-0.5 clip-badge-poly font-semibold border ${
                        isLight
                          ? 'bg-[#F1F5F9] text-[#0284C7] border-[#CBD5E1]'
                          : isMix
                          ? 'bg-[#EFE7DA] text-[#D97706] border-[#D8CEBF]'
                          : 'bg-black text-[#00F0FF] border-[#00F0FF]/40'
                      }`}
                    >
                      SECURE_SANDBOX
                    </span>
                  </div>

                  {/* Kernel Status Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-[11px]">
                    <div
                      className={`p-3 clip-badge-poly border transition-all ${
                        isLight
                          ? 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#0284C7]'
                          : isMix
                          ? 'bg-[#FFFDF9] border-[#E4DCD0] hover:border-[#D97706]'
                          : 'bg-[#06060C] border-[#252538] hover:border-[#00F0FF]/60'
                      }`}
                    >
                      <span
                        className={`block text-[10px] uppercase font-bold tracking-wider ${
                          isLight ? 'text-[#64748B]' : isMix ? 'text-[#786E64]' : 'text-[#737373]'
                        }`}
                      >
                        AI Engine
                      </span>
                      <span
                        className={`font-bold ${
                          isLight ? 'text-[#0284C7]' : isMix ? 'text-[#D97706]' : 'text-[#00F0FF]'
                        }`}
                      >
                        Gemini 2.5 Multi-Modal
                      </span>
                    </div>

                    <div
                      className={`p-3 clip-badge-poly border transition-all ${
                        isLight
                          ? 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#0284C7]'
                          : isMix
                          ? 'bg-[#FFFDF9] border-[#E4DCD0] hover:border-[#D97706]'
                          : 'bg-[#06060C] border-[#252538] hover:border-[#00F0FF]/60'
                      }`}
                    >
                      <span
                        className={`block text-[10px] uppercase font-bold tracking-wider ${
                          isLight ? 'text-[#64748B]' : isMix ? 'text-[#786E64]' : 'text-[#737373]'
                        }`}
                      >
                        Response Time
                      </span>
                      <span
                        className={`font-bold ${
                          isLight ? 'text-[#0284C7]' : isMix ? 'text-[#D97706]' : 'text-[#00F0FF]'
                        }`}
                      >
                        &lt; 50ms Realtime
                      </span>
                    </div>

                    <div
                      className={`p-3 clip-badge-poly border col-span-2 sm:col-span-1 transition-all ${
                        isLight
                          ? 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#0284C7]'
                          : isMix
                          ? 'bg-[#FFFDF9] border-[#E4DCD0] hover:border-[#D97706]'
                          : 'bg-[#06060C] border-[#252538] hover:border-[#00F0FF]/60'
                      }`}
                    >
                      <span
                        className={`block text-[10px] uppercase font-bold tracking-wider ${
                          isLight ? 'text-[#64748B]' : isMix ? 'text-[#786E64]' : 'text-[#737373]'
                        }`}
                      >
                        Data Storage
                      </span>
                      <span
                        className={`font-bold ${
                          isLight ? 'text-[#090D16]' : isMix ? 'text-[#231E19]' : 'text-[#EDEDED]'
                        }`}
                      >
                        Encrypted Firestore
                      </span>
                    </div>
                  </div>

                  {/* Portal Call to Action Button */}
                  <div className="pt-2">
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setViewState('auth')}
                      className={`w-full py-4 px-6 clip-badge-poly font-mono font-bold text-sm tracking-wider flex items-center justify-center space-x-3 cursor-pointer shadow-lg transition-all ${
                        isLight
                          ? 'bg-gradient-to-r from-[#0284C7] to-[#7C3AED] text-white shadow-[0_8px_25px_rgba(2,132,199,0.3)] hover:shadow-[0_12px_30px_rgba(2,132,199,0.45)]'
                          : isMix
                          ? 'bg-gradient-to-r from-[#D97706] to-[#0D9488] text-white shadow-[0_8px_25px_rgba(217,119,6,0.3)] hover:shadow-[0_12px_30px_rgba(217,119,6,0.45)]'
                          : 'bg-gradient-to-r from-[#00F0FF] via-[#A855F7] to-[#FF007A] text-black shadow-[0_0_35px_rgba(0,240,255,0.4)] hover:shadow-[0_0_45px_rgba(0,240,255,0.6)]'
                      }`}
                    >
                      <Fingerprint className="w-5 h-5" />
                      <span>OPEN SOMOTOZ WORKSPACE</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>

                  {/* Footnote inside portal */}
                  <div
                    className={`flex items-center justify-between text-[11px] font-mono pt-1 ${
                      isLight ? 'text-[#64748B]' : isMix ? 'text-[#786E64]' : 'text-[#737373]'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Shield
                        className={`w-3.5 h-3.5 ${
                          isLight ? 'text-[#0284C7]' : isMix ? 'text-[#D97706]' : 'text-[#00F0FF]'
                        }`}
                      />
                      Private & Encrypted
                    </span>
                    <span>Direct Google Sign-in or Custom Account</span>
                  </div>
                </div>
              </div>

              {/* Bottom 4 Geometric Core Tool Blocks */}
              <div className="w-full max-w-5xl mt-14 text-left">
                <div className="flex items-center justify-between mb-5">
                  <span
                    className={`text-xs font-mono font-bold flex items-center gap-2 ${
                      isLight ? 'text-[#475569]' : isMix ? 'text-[#5F564D]' : 'text-[#A1A1AA]'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 clip-badge-poly ${
                        isLight ? 'bg-[#0284C7]' : isMix ? 'bg-[#D97706]' : 'bg-[#00F0FF]'
                      }`}
                    />
                    INTEGRATED COGNITIVE MODULES
                  </span>
                  <span
                    className={`text-xs font-mono font-bold ${
                      isLight ? 'text-[#0284C7]' : isMix ? 'text-[#D97706]' : 'text-[#00F0FF]'
                    }`}
                  >
                    4 / 4 ENGINES ONLINE
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Tool 01 // CHAT */}
                  <motion.div
                    whileHover={{ y: -6, scale: 1.02 }}
                    className={`relative p-5 clip-cyber-corner border transition-all duration-300 cursor-pointer group ${
                      isLight
                        ? 'bg-white border-[#E2E8F0] shadow-md hover:border-[#0284C7] hover:shadow-[0_10px_25px_rgba(2,132,199,0.2)]'
                        : isMix
                        ? 'bg-[#FAF6EE] border-[#E4DCD0] shadow-md hover:border-[#D97706] hover:shadow-[0_10px_25px_rgba(217,119,6,0.2)]'
                        : 'bg-gradient-to-br from-[#0C0C18] to-[#06060C] border-[#252538] hover:border-[#00F0FF] hover:shadow-[0_0_30px_rgba(0,240,255,0.25)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <MessageSquare
                          className={`w-4 h-4 ${
                            isLight ? 'text-[#0284C7]' : isMix ? 'text-[#D97706]' : 'text-[#00F0FF]'
                          }`}
                        />
                        <span
                          className={`text-xs font-mono font-bold ${
                            isLight ? 'text-[#090D16]' : isMix ? 'text-[#231E19]' : 'text-[#EDEDED]'
                          }`}
                        >
                          01 // CHAT
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 clip-badge-poly font-semibold ${
                          isLight
                            ? 'bg-[#E0F2FE] text-[#0284C7]'
                            : isMix
                            ? 'bg-[#FEF3C7] text-[#D97706]'
                            : 'bg-[#00F0FF]/15 text-[#00F0FF]'
                        }`}
                      >
                        REASONING
                      </span>
                    </div>
                    <h3
                      className={`text-sm font-bold mb-1.5 font-display transition-colors ${
                        isLight
                          ? 'text-[#090D16] group-hover:text-[#0284C7]'
                          : isMix
                          ? 'text-[#231E19] group-hover:text-[#D97706]'
                          : 'text-[#EDEDED] group-hover:text-[#00F0FF]'
                      }`}
                    >
                      AI Reasoning Engine
                    </h3>
                    <p
                      className={`text-[11px] leading-relaxed font-sans ${
                        isLight ? 'text-[#475569]' : isMix ? 'text-[#5F564D]' : 'text-[#A1A1AA]'
                      }`}
                    >
                      Multi-turn deep reasoning, mathematical proofing, architecture diagrams, and multilingual syntax processing.
                    </p>
                  </motion.div>

                  {/* Tool 02 // IMAGES */}
                  <motion.div
                    whileHover={{ y: -6, scale: 1.02 }}
                    className={`relative p-5 clip-cyber-card border transition-all duration-300 cursor-pointer group ${
                      isLight
                        ? 'bg-white border-[#E2E8F0] shadow-md hover:border-[#7C3AED] hover:shadow-[0_10px_25px_rgba(124,58,237,0.2)]'
                        : isMix
                        ? 'bg-[#FAF6EE] border-[#E4DCD0] shadow-md hover:border-[#7C3AED] hover:shadow-[0_10px_25px_rgba(124,58,237,0.2)]'
                        : 'bg-gradient-to-br from-[#0C0C18] to-[#06060C] border-[#252538] hover:border-[#A855F7] hover:shadow-[0_0_30px_rgba(168,85,247,0.25)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <ImageIcon
                          className={`w-4 h-4 ${
                            isLight ? 'text-[#7C3AED]' : isMix ? 'text-[#7C3AED]' : 'text-[#A855F7]'
                          }`}
                        />
                        <span
                          className={`text-xs font-mono font-bold ${
                            isLight ? 'text-[#090D16]' : isMix ? 'text-[#231E19]' : 'text-[#EDEDED]'
                          }`}
                        >
                          02 // IMAGES
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 clip-badge-poly font-semibold ${
                          isLight
                            ? 'bg-[#EDE9FE] text-[#7C3AED]'
                            : isMix
                            ? 'bg-[#EDE9FE] text-[#7C3AED]'
                            : 'bg-[#A855F7]/15 text-[#A855F7]'
                        }`}
                      >
                        1K PHOTOREAL
                      </span>
                    </div>
                    <h3
                      className={`text-sm font-bold mb-1.5 font-display transition-colors ${
                        isLight
                          ? 'text-[#090D16] group-hover:text-[#7C3AED]'
                          : isMix
                          ? 'text-[#231E19] group-hover:text-[#7C3AED]'
                          : 'text-[#EDEDED] group-hover:text-[#A855F7]'
                      }`}
                    >
                      Photoreal & Vector Suite
                    </h3>
                    <p
                      className={`text-[11px] leading-relaxed font-sans ${
                        isLight ? 'text-[#475569]' : isMix ? 'text-[#5F564D]' : 'text-[#A1A1AA]'
                      }`}
                    >
                      Cinematic 1K photorealism and crisp vector SVG generation powered by high-resolution optics and true lighting.
                    </p>
                  </motion.div>

                  {/* Tool 03 // VIDEO */}
                  <motion.div
                    whileHover={{ y: -6, scale: 1.02 }}
                    className={`relative p-5 clip-stealth-notch border transition-all duration-300 cursor-pointer group ${
                      isLight
                        ? 'bg-white border-[#E2E8F0] shadow-md hover:border-[#E11D48] hover:shadow-[0_10px_25px_rgba(225,29,72,0.2)]'
                        : isMix
                        ? 'bg-[#FAF6EE] border-[#E4DCD0] shadow-md hover:border-[#E11D48] hover:shadow-[0_10px_25px_rgba(225,29,72,0.2)]'
                        : 'bg-gradient-to-br from-[#0C0C18] to-[#06060C] border-[#252538] hover:border-[#FF007A] hover:shadow-[0_0_30px_rgba(255,0,122,0.25)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Video
                          className={`w-4 h-4 ${
                            isLight ? 'text-[#E11D48]' : isMix ? 'text-[#E11D48]' : 'text-[#FF007A]'
                          }`}
                        />
                        <span
                          className={`text-xs font-mono font-bold ${
                            isLight ? 'text-[#090D16]' : isMix ? 'text-[#231E19]' : 'text-[#EDEDED]'
                          }`}
                        >
                          03 // VIDEO
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 clip-badge-poly font-semibold ${
                          isLight
                            ? 'bg-[#FFE4E6] text-[#E11D48]'
                            : isMix
                            ? 'bg-[#FFE4E6] text-[#E11D48]'
                            : 'bg-[#FF007A]/15 text-[#FF007A]'
                        }`}
                      >
                        60FPS
                      </span>
                    </div>
                    <h3
                      className={`text-sm font-bold mb-1.5 font-display transition-colors ${
                        isLight
                          ? 'text-[#090D16] group-hover:text-[#E11D48]'
                          : isMix
                          ? 'text-[#231E19] group-hover:text-[#E11D48]'
                          : 'text-[#EDEDED] group-hover:text-[#FF007A]'
                      }`}
                    >
                      60FPS Motion Simulator
                    </h3>
                    <p
                      className={`text-[11px] leading-relaxed font-sans ${
                        isLight ? 'text-[#475569]' : isMix ? 'text-[#5F564D]' : 'text-[#A1A1AA]'
                      }`}
                    >
                      60FPS motion simulation, camera tracking, and procedural scene storyboard animation engine.
                    </p>
                  </motion.div>

                  {/* Tool 04 // MUSIC */}
                  <motion.div
                    whileHover={{ y: -6, scale: 1.02 }}
                    className={`relative p-5 clip-badge-poly border transition-all duration-300 cursor-pointer group ${
                      isLight
                        ? 'bg-white border-[#E2E8F0] shadow-md hover:border-[#0D9488] hover:shadow-[0_10px_25px_rgba(13,148,136,0.2)]'
                        : isMix
                        ? 'bg-[#FAF6EE] border-[#E4DCD0] shadow-md hover:border-[#0D9488] hover:shadow-[0_10px_25px_rgba(13,148,136,0.2)]'
                        : 'bg-gradient-to-br from-[#0C0C18] to-[#06060C] border-[#252538] hover:border-[#FFB800] hover:shadow-[0_0_30px_rgba(255,184,0,0.25)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Music
                          className={`w-4 h-4 ${
                            isLight ? 'text-[#0D9488]' : isMix ? 'text-[#0D9488]' : 'text-[#FFB800]'
                          }`}
                        />
                        <span
                          className={`text-xs font-mono font-bold ${
                            isLight ? 'text-[#090D16]' : isMix ? 'text-[#231E19]' : 'text-[#EDEDED]'
                          }`}
                        >
                          04 // MUSIC
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 clip-badge-poly font-semibold ${
                          isLight
                            ? 'bg-[#CCFBF1] text-[#0D9488]'
                            : isMix
                            ? 'bg-[#CCFBF1] text-[#0D9488]'
                            : 'bg-[#FFB800]/15 text-[#FFB800]'
                        }`}
                      >
                        432HZ
                      </span>
                    </div>
                    <h3
                      className={`text-sm font-bold mb-1.5 font-display transition-colors ${
                        isLight
                          ? 'text-[#090D16] group-hover:text-[#0D9488]'
                          : isMix
                          ? 'text-[#231E19] group-hover:text-[#0D9488]'
                          : 'text-[#EDEDED] group-hover:text-[#FFB800]'
                      }`}
                    >
                      Harmonic Soundscapes
                    </h3>
                    <p
                      className={`text-[11px] leading-relaxed font-sans ${
                        isLight ? 'text-[#475569]' : isMix ? 'text-[#5F564D]' : 'text-[#A1A1AA]'
                      }`}
                    >
                      432Hz harmonic acoustic modeling, procedural synthesizer frequencies, and binaural focus audio generation.
                    </p>
                  </motion.div>

                </div>
              </div>
            </motion.main>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2: AUTHENTICATION PAGE (SPLIT-SCREEN GEOMETRIC CARD)                 */}
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
              <div
                className={`clip-cyber-corner border grid grid-cols-1 lg:grid-cols-12 shadow-2xl transition-colors ${
                  isLight
                    ? 'bg-white border-[#CBD5E1] shadow-[0_20px_50px_rgba(2,132,199,0.12)]'
                    : isMix
                    ? 'bg-[#FAF6EE] border-[#D8CEBF] shadow-[0_20px_50px_rgba(217,119,6,0.12)]'
                    : 'bg-[#0B0B16] border-[#252538] shadow-[0_0_50px_rgba(0,240,255,0.2)]'
                }`}
              >
                {/* Left Side: Developer Credentials */}
                <div
                  className={`lg:col-span-5 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r flex flex-col justify-between space-y-6 text-left font-mono ${
                    isLight
                      ? 'bg-[#F8FAFC] border-[#E2E8F0]'
                      : isMix
                      ? 'bg-[#FFFDF9] border-[#E4DCD0]'
                      : 'bg-[#070710] border-[#252538]'
                  }`}
                >
                  <div className="space-y-4">
                    <div
                      className={`flex items-center space-x-2 text-xs font-bold ${
                        isLight ? 'text-[#0284C7]' : isMix ? 'text-[#D97706]' : 'text-[#00F0FF]'
                      }`}
                    >
                      <Terminal className="w-4 h-4" />
                      <span>SOMOTOZ_AUTH</span>
                    </div>

                    <h2
                      className={`text-2xl font-bold font-display ${
                        isLight ? 'text-[#090D16]' : isMix ? 'text-[#231E19]' : 'text-[#EDEDED]'
                      }`}
                    >
                      Enter Somotoz AI Suite.
                    </h2>

                    <p
                      className={`text-xs leading-relaxed font-sans ${
                        isLight ? 'text-[#475569]' : isMix ? 'text-[#5F564D]' : 'text-[#A1A1AA]'
                      }`}
                    >
                      Created by{' '}
                      <strong className={isLight ? 'text-[#090D16]' : isMix ? 'text-[#231E19]' : 'text-[#EDEDED]'}>
                        Som Maurya
                      </strong>{' '}
                      (Data Science & Computational Thinking, Kaggle 5-Day AI Agents Intensive, AI for Bharat, INDIA RUNS).
                    </p>

                    {/* Developer System Specs */}
                    <div
                      className={`p-3 clip-badge-poly border space-y-2 text-[11px] ${
                        isLight
                          ? 'bg-white border-[#CBD5E1]'
                          : isMix
                          ? 'bg-[#FAF6EE] border-[#D8CEBF]'
                          : 'bg-[#040408] border-[#252538]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={isLight ? 'text-[#64748B]' : isMix ? 'text-[#786E64]' : 'text-[#737373]'}>
                          DEVELOPER
                        </span>
                        <span className={`font-bold ${isLight ? 'text-[#090D16]' : isMix ? 'text-[#231E19]' : 'text-[#EDEDED]'}`}>
                          Som Maurya
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={isLight ? 'text-[#64748B]' : isMix ? 'text-[#786E64]' : 'text-[#737373]'}>
                          AI FRAMEWORK
                        </span>
                        <span className={`font-bold ${isLight ? 'text-[#0284C7]' : isMix ? 'text-[#D97706]' : 'text-[#00F0FF]'}`}>
                          AI Agents & Data Science
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={isLight ? 'text-[#64748B]' : isMix ? 'text-[#786E64]' : 'text-[#737373]'}>
                          DATABASE
                        </span>
                        <span className={`font-bold ${isLight ? 'text-[#090D16]' : isMix ? 'text-[#231E19]' : 'text-[#EDEDED]'}`}>
                          Google Cloud Firestore
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={isLight ? 'text-[#64748B]' : isMix ? 'text-[#786E64]' : 'text-[#737373]'}>
                          SECURITY
                        </span>
                        <span className={`font-bold ${isLight ? 'text-[#0284C7]' : isMix ? 'text-[#D97706]' : 'text-[#00F0FF]'}`}>
                          Private & Encrypted
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`pt-4 border-t text-[11px] space-y-1 ${
                      isLight
                        ? 'border-[#E2E8F0] text-[#64748B]'
                        : isMix
                        ? 'border-[#E4DCD0] text-[#786E64]'
                        : 'border-[#252538] text-[#737373]'
                    }`}
                  >
                    <div
                      className={`flex items-center gap-1.5 font-bold ${
                        isLight ? 'text-[#0284C7]' : isMix ? 'text-[#D97706]' : 'text-[#00F0FF]'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>User Privacy Guaranteed</span>
                    </div>
                    <p>Your notes and prompts remain private and secure.</p>
                  </div>
                </div>

                {/* Right Side: Interactive Login / Register Form Container */}
                <div
                  className={`lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center ${
                    isLight ? 'bg-white' : isMix ? 'bg-[#FAF6EE]' : 'bg-[#0B0B16]'
                  }`}
                >
                  {/* Mode Switcher Pill */}
                  <div
                    className={`flex p-1 mb-6 font-mono text-xs clip-badge-poly border ${
                      isLight
                        ? 'bg-[#F1F5F9] border-[#CBD5E1]'
                        : isMix
                        ? 'bg-[#EFE7DA] border-[#D8CEBF]'
                        : 'bg-black border-[#252538]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className={`flex-1 py-2 font-bold clip-badge-poly transition-all cursor-pointer ${
                        authMode === 'login'
                          ? isLight
                            ? 'bg-[#0284C7] text-white shadow-md'
                            : isMix
                            ? 'bg-[#D97706] text-white shadow-md'
                            : 'bg-[#00F0FF] text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                          : isLight
                          ? 'text-[#64748B] hover:text-[#090D16]'
                          : isMix
                          ? 'text-[#786E64] hover:text-[#231E19]'
                          : 'text-[#A1A1AA] hover:text-[#EDEDED]'
                      }`}
                    >
                      LOG IN
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('register')}
                      className={`flex-1 py-2 font-bold clip-badge-poly transition-all cursor-pointer ${
                        authMode === 'register'
                          ? isLight
                            ? 'bg-[#0284C7] text-white shadow-md'
                            : isMix
                            ? 'bg-[#D97706] text-white shadow-md'
                            : 'bg-[#00F0FF] text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                          : isLight
                          ? 'text-[#64748B] hover:text-[#090D16]'
                          : isMix
                          ? 'text-[#786E64] hover:text-[#231E19]'
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
                      className={`w-full py-3 px-4 clip-badge-poly text-xs font-mono flex items-center justify-center space-x-3 transition-all duration-200 cursor-pointer border group ${
                        isLight
                          ? 'bg-white hover:bg-[#F8FAFC] border-[#CBD5E1] text-[#090D16] shadow-sm hover:border-[#0284C7]'
                          : isMix
                          ? 'bg-[#FAF6EE] hover:bg-[#FFFDF9] border-[#D8CEBF] text-[#231E19] shadow-sm hover:border-[#D97706]'
                          : 'bg-black hover:bg-[#121222] border-[#252538] hover:border-[#00F0FF] text-[#EDEDED] shadow-[0_0_15px_rgba(0,0,0,0.5)]'
                      }`}
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
                      <span className="font-semibold">
                        {isAuthenticating ? 'SIGNING IN WITH GOOGLE...' : 'Continue with Google'}
                      </span>
                    </button>

                    {/* Facebook / Meta Sign In */}
                    <button
                      type="button"
                      onClick={handleSocialMeta}
                      className={`w-full py-3 px-4 clip-badge-poly text-xs font-mono flex items-center justify-center space-x-3 transition-all duration-200 cursor-pointer border group ${
                        isLight
                          ? 'bg-white hover:bg-[#F8FAFC] border-[#CBD5E1] text-[#090D16] shadow-sm hover:border-[#0284C7]'
                          : isMix
                          ? 'bg-[#FAF6EE] hover:bg-[#FFFDF9] border-[#D8CEBF] text-[#231E19] shadow-sm hover:border-[#D97706]'
                          : 'bg-black hover:bg-[#121222] border-[#252538] hover:border-[#00F0FF] text-[#EDEDED] shadow-[0_0_15px_rgba(0,0,0,0.5)]'
                      }`}
                    >
                      <svg className="w-4 h-4 text-[#1877F2] fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      <span className="font-semibold">
                        Continue with Meta
                      </span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="relative flex py-2 items-center mb-6">
                    <div className={`flex-grow border-t ${isLight ? 'border-[#E2E8F0]' : isMix ? 'border-[#E4DCD0]' : 'border-[#252538]'}`}></div>
                    <span
                      className={`flex-shrink mx-3 text-[10px] font-mono px-2 clip-badge-poly border ${
                        isLight
                          ? 'text-[#64748B] bg-[#F1F5F9] border-[#CBD5E1]'
                          : isMix
                          ? 'text-[#786E64] bg-[#EFE7DA] border-[#D8CEBF]'
                          : 'text-[#737373] bg-black border-[#252538]'
                      }`}
                    >
                      OR SIGN IN WITH EMAIL & PHONE
                    </span>
                    <div className={`flex-grow border-t ${isLight ? 'border-[#E2E8F0]' : isMix ? 'border-[#E4DCD0]' : 'border-[#252538]'}`}></div>
                  </div>

                  {authError && (
                    <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500 text-rose-500 text-xs font-mono clip-badge-poly">
                      {authError}
                    </div>
                  )}

                  {/* Manual Inputs Form with Floating Labels */}
                  <form onSubmit={handleFormSubmit} className="space-y-4 text-left font-sans">
                    {/* Full Name (Only in Register Mode) */}
                    {authMode === 'register' && (
                      <div className="relative">
                        <div
                          className={`relative border clip-badge-poly transition-all duration-200 ${
                            isLight
                              ? 'bg-white border-[#CBD5E1] focus-within:border-[#0284C7]'
                              : isMix
                              ? 'bg-[#FFFDF9] border-[#D8CEBF] focus-within:border-[#D97706]'
                              : 'bg-black border-[#252538] focus-within:border-[#00F0FF]'
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
                            className={`w-full px-3.5 pt-5 pb-2 bg-transparent text-xs font-mono focus:outline-none ${
                              isLight ? 'text-[#090D16]' : isMix ? 'text-[#231E19]' : 'text-[#EDEDED]'
                            }`}
                          />
                          <label
                            htmlFor="fullName"
                            className={`absolute left-3.5 transition-all duration-200 pointer-events-none font-mono text-xs ${
                              focusedField === 'fullName' || fullName
                                ? `top-1.5 text-[10px] font-bold ${
                                    isLight ? 'text-[#0284C7]' : isMix ? 'text-[#D97706]' : 'text-[#00F0FF]'
                                  }`
                                : isLight
                                ? 'top-3.5 text-[#94A3B8]'
                                : isMix
                                ? 'top-3.5 text-[#A89F91]'
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
                        className={`relative border clip-badge-poly transition-all duration-200 ${
                          isLight
                            ? 'bg-white border-[#CBD5E1] focus-within:border-[#0284C7]'
                            : isMix
                            ? 'bg-[#FFFDF9] border-[#D8CEBF] focus-within:border-[#D97706]'
                            : 'bg-black border-[#252538] focus-within:border-[#00F0FF]'
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
                          className={`w-full px-3.5 pt-5 pb-2 bg-transparent text-xs font-mono focus:outline-none ${
                            isLight ? 'text-[#090D16]' : isMix ? 'text-[#231E19]' : 'text-[#EDEDED]'
                          }`}
                        />
                        <label
                          htmlFor="email"
                          className={`absolute left-3.5 transition-all duration-200 pointer-events-none font-mono text-xs ${
                            focusedField === 'email' || email
                              ? `top-1.5 text-[10px] font-bold ${
                                  isLight ? 'text-[#0284C7]' : isMix ? 'text-[#D97706]' : 'text-[#00F0FF]'
                                }`
                              : isLight
                              ? 'top-3.5 text-[#94A3B8]'
                              : isMix
                              ? 'top-3.5 text-[#A89F91]'
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
                        className={`relative border flex clip-badge-poly transition-all duration-200 ${
                          isLight
                            ? 'bg-white border-[#CBD5E1] focus-within:border-[#0284C7]'
                            : isMix
                            ? 'bg-[#FFFDF9] border-[#D8CEBF] focus-within:border-[#D97706]'
                            : 'bg-black border-[#252538] focus-within:border-[#00F0FF]'
                        }`}
                      >
                        {/* Country Code Trigger */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                            className={`h-full px-3 py-3 border-r flex items-center space-x-1.5 text-xs font-mono transition-colors cursor-pointer ${
                              isLight
                                ? 'bg-[#F8FAFC] border-[#E2E8F0] text-[#090D16] hover:bg-[#F1F5F9]'
                                : isMix
                                ? 'bg-[#FFFDF9] border-[#E4DCD0] text-[#231E19] hover:bg-[#FAF6EE]'
                                : 'bg-[#0D0D0D] border-[#262626] text-[#EDEDED] hover:bg-[#171717]'
                            }`}
                          >
                            <span className="text-sm">{selectedCountry.flag}</span>
                            <span className={`font-bold ${isLight ? 'text-[#0284C7]' : isMix ? 'text-[#D97706]' : 'text-[#00F0FF]'}`}>
                              {selectedCountry.dial}
                            </span>
                            <ChevronDown className={`w-3 h-3 ${isLight ? 'text-[#64748B]' : isMix ? 'text-[#786E64]' : 'text-[#737373]'}`} />
                          </button>

                          {/* Country Selector Dropdown */}
                          {countryDropdownOpen && (
                            <div
                              className={`absolute top-full left-0 mt-1 w-64 max-h-56 clip-badge-poly border shadow-2xl z-50 overflow-hidden flex flex-col ${
                                isLight
                                  ? 'bg-white border-[#0284C7]'
                                  : isMix
                                  ? 'bg-[#FAF6EE] border-[#D97706]'
                                  : 'bg-[#0D0D16] border-[#00F0FF]'
                              }`}
                            >
                              <div className={`p-2 border-b ${isLight ? 'border-[#E2E8F0] bg-[#F8FAFC]' : isMix ? 'border-[#E4DCD0] bg-[#FFFDF9]' : 'border-[#262626] bg-black'}`}>
                                <div className={`flex items-center space-x-1.5 px-2 py-1 border clip-badge-poly ${isLight ? 'border-[#CBD5E1] bg-white' : isMix ? 'border-[#D8CEBF] bg-[#FAF6EE]' : 'border-[#333333] bg-[#121212]'}`}>
                                  <Search className={`w-3 h-3 ${isLight ? 'text-[#64748B]' : isMix ? 'text-[#786E64]' : 'text-[#737373]'}`} />
                                  <input
                                    type="text"
                                    placeholder="Search country..."
                                    value={countrySearch}
                                    onChange={(e) => setCountrySearch(e.target.value)}
                                    className={`w-full bg-transparent text-[11px] font-mono focus:outline-none ${
                                      isLight ? 'text-[#090D16]' : isMix ? 'text-[#231E19]' : 'text-[#EDEDED]'
                                    }`}
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
                                    className={`w-full px-2.5 py-1.5 text-left flex items-center justify-between clip-badge-poly transition-colors ${
                                      selectedCountry.code === c.code
                                        ? isLight
                                          ? 'bg-[#E0F2FE] text-[#0284C7] font-bold'
                                          : isMix
                                          ? 'bg-[#FEF3C7] text-[#D97706] font-bold'
                                          : 'bg-black text-[#00F0FF] font-bold'
                                        : isLight
                                        ? 'text-[#090D16] hover:bg-[#F1F5F9]'
                                        : isMix
                                        ? 'text-[#231E19] hover:bg-[#EFE7DA]'
                                        : 'text-[#EDEDED] hover:bg-[#171717]'
                                    }`}
                                  >
                                    <span className="flex items-center space-x-2">
                                      <span>{c.flag}</span>
                                      <span className="text-[11px] truncate max-w-[130px]">{c.name}</span>
                                    </span>
                                    <span className={`text-[10px] ${isLight ? 'text-[#64748B]' : isMix ? 'text-[#786E64]' : 'text-[#737373]'}`}>{c.dial}</span>
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
                            className={`w-full px-3.5 pt-5 pb-2 bg-transparent text-xs font-mono focus:outline-none ${
                              isLight ? 'text-[#090D16]' : isMix ? 'text-[#231E19]' : 'text-[#EDEDED]'
                            }`}
                          />
                          <label
                            htmlFor="phone"
                            className={`absolute left-3.5 transition-all duration-200 pointer-events-none font-mono text-xs ${
                              focusedField === 'phone' || phoneNumber
                                ? `top-1.5 text-[10px] font-bold ${
                                    isLight ? 'text-[#0284C7]' : isMix ? 'text-[#D97706]' : 'text-[#00F0FF]'
                                  }`
                                : isLight
                                ? 'top-3.5 text-[#94A3B8]'
                                : isMix
                                ? 'top-3.5 text-[#A89F91]'
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
                        className={`relative border clip-badge-poly transition-all duration-200 ${
                          isLight
                            ? 'bg-white border-[#CBD5E1] focus-within:border-[#0284C7]'
                            : isMix
                            ? 'bg-[#FFFDF9] border-[#D8CEBF] focus-within:border-[#D97706]'
                            : 'bg-black border-[#252538] focus-within:border-[#00F0FF]'
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
                          className={`w-full px-3.5 pt-5 pb-2 pr-10 bg-transparent text-xs font-mono focus:outline-none ${
                            isLight ? 'text-[#090D16]' : isMix ? 'text-[#231E19]' : 'text-[#EDEDED]'
                          }`}
                        />
                        <label
                          htmlFor="password"
                          className={`absolute left-3.5 transition-all duration-200 pointer-events-none font-mono text-xs ${
                            focusedField === 'password' || password
                              ? `top-1.5 text-[10px] font-bold ${
                                  isLight ? 'text-[#0284C7]' : isMix ? 'text-[#D97706]' : 'text-[#00F0FF]'
                                }`
                              : isLight
                              ? 'top-3.5 text-[#94A3B8]'
                              : isMix
                              ? 'top-3.5 text-[#A89F91]'
                              : 'top-3.5 text-[#737373]'
                          }`}
                        >
                          Password
                        </label>

                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`absolute right-3 top-4 transition-colors cursor-pointer ${
                            isLight ? 'text-[#64748B] hover:text-[#090D16]' : isMix ? 'text-[#786E64] hover:text-[#231E19]' : 'text-[#737373] hover:text-[#EDEDED]'
                          }`}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className={`w-full py-3.5 px-4 clip-badge-poly font-mono font-bold text-xs tracking-wider flex items-center justify-center space-x-2 cursor-pointer shadow-lg transition-all ${
                          isLight
                            ? 'bg-gradient-to-r from-[#0284C7] to-[#7C3AED] text-white shadow-[0_4px_15px_rgba(2,132,199,0.3)]'
                            : isMix
                            ? 'bg-gradient-to-r from-[#D97706] to-[#0D9488] text-white shadow-[0_4px_15px_rgba(217,119,6,0.3)]'
                            : 'bg-gradient-to-r from-[#00F0FF] via-[#A855F7] to-[#FF007A] text-black shadow-[0_0_25px_rgba(0,240,255,0.4)]'
                        }`}
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>
                          {authMode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
                        </span>
                      </motion.button>
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
              <div
                className={`p-8 clip-cyber-corner border space-y-6 font-mono shadow-2xl ${
                  isLight
                    ? 'bg-white border-[#0284C7] shadow-[0_10px_40px_rgba(2,132,199,0.2)]'
                    : isMix
                    ? 'bg-[#FAF6EE] border-[#D97706] shadow-[0_10px_40px_rgba(217,119,6,0.2)]'
                    : 'bg-[#0B0B16] border-[#00F0FF] shadow-[0_0_50px_rgba(0,240,255,0.3)]'
                }`}
              >
                <div
                  className={`relative mx-auto w-20 h-20 clip-badge-poly flex items-center justify-center border shadow-lg ${
                    isLight
                      ? 'bg-[#F0F9FF] border-[#0284C7]'
                      : isMix
                      ? 'bg-[#FEF3C7] border-[#D97706]'
                      : 'bg-black border-[#00F0FF]'
                  }`}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className={`absolute inset-1 border border-dashed ${
                      isLight ? 'border-[#0284C7]/40' : isMix ? 'border-[#D97706]/40' : 'border-[#00F0FF]/40'
                    }`}
                  />
                  {authStage.includes('ACCESS_GRANTED') ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 10, stiffness: 150 }}
                    >
                      <Check
                        className={`w-10 h-10 ${
                          isLight ? 'text-[#0284C7]' : isMix ? 'text-[#D97706]' : 'text-[#00F0FF]'
                        }`}
                      />
                    </motion.div>
                  ) : (
                    <Fingerprint
                      className={`w-10 h-10 animate-pulse ${
                        isLight ? 'text-[#0284C7]' : isMix ? 'text-[#D97706]' : 'text-[#00F0FF]'
                      }`}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <h3
                    className={`text-xl font-bold font-display ${
                      isLight ? 'text-[#090D16]' : isMix ? 'text-[#231E19]' : 'text-[#EDEDED]'
                    }`}
                  >
                    {authStage.includes('ACCESS_GRANTED') ? 'ACCESS GRANTED' : 'AUTHENTICATING'}
                  </h3>
                  <p
                    className={`text-xs font-mono font-bold tracking-wide ${
                      isLight ? 'text-[#0284C7]' : isMix ? 'text-[#D97706]' : 'text-[#00F0FF]'
                    }`}
                  >
                    &gt; {authStage}
                  </p>
                </div>

                <div
                  className={`p-3 clip-badge-poly border text-left text-[11px] space-y-1 ${
                    isLight
                      ? 'bg-[#F8FAFC] border-[#E2E8F0]'
                      : isMix
                      ? 'bg-[#FFFDF9] border-[#E4DCD0]'
                      : 'bg-black border-[#252538]'
                  }`}
                >
                  <div className="flex justify-between">
                    <span className={isLight ? 'text-[#64748B]' : isMix ? 'text-[#786E64]' : 'text-[#737373]'}>USER:</span>
                    <span className={`font-bold ${isLight ? 'text-[#090D16]' : isMix ? 'text-[#231E19]' : 'text-[#EDEDED]'}`}>
                      {activeDecryptedUser?.displayName || 'Somotoz User'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isLight ? 'text-[#64748B]' : isMix ? 'text-[#786E64]' : 'text-[#737373]'}>SECURITY:</span>
                    <span className={`font-bold ${isLight ? 'text-[#0284C7]' : isMix ? 'text-[#D97706]' : 'text-[#00F0FF]'}`}>
                      Encrypted Sandbox
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isLight ? 'text-[#64748B]' : isMix ? 'text-[#786E64]' : 'text-[#737373]'}>STATUS:</span>
                    <span className={`font-bold ${isLight ? 'text-[#090D16]' : isMix ? 'text-[#231E19]' : 'text-[#EDEDED]'}`}>
                      Opening Workspace...
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div
                  className={`w-full h-1.5 overflow-hidden ${
                    isLight ? 'bg-[#E2E8F0]' : isMix ? 'bg-[#E4DCD0]' : 'bg-[#171727]'
                  }`}
                >
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.8, ease: 'easeInOut' }}
                    className={`h-full ${
                      isLight ? 'bg-[#0284C7]' : isMix ? 'bg-[#D97706]' : 'bg-[#00F0FF]'
                    }`}
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
              <div
                className={`clip-cyber-corner border shadow-2xl overflow-hidden ${
                  isLight
                    ? 'bg-white border-[#0284C7]'
                    : isMix
                    ? 'bg-[#FAF6EE] border-[#D97706]'
                    : 'bg-[#0B0B16] border-[#00F0FF]'
                }`}
              >
                {/* Header bar */}
                <div
                  className={`border-b p-4 flex items-center justify-between ${
                    isLight
                      ? 'bg-[#F8FAFC] border-[#E2E8F0]'
                      : isMix
                      ? 'bg-[#FFFDF9] border-[#E4DCD0]'
                      : 'bg-[#121222] border-[#252538]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 clip-badge-poly ${
                        isLight ? 'bg-[#0284C7]' : isMix ? 'bg-[#D97706]' : 'bg-[#00F0FF]'
                      }`}
                    />
                    <span
                      className={`text-sm font-bold ${
                        isLight ? 'text-[#090D16]' : isMix ? 'text-[#231E19]' : 'text-[#EDEDED]'
                      }`}
                    >
                      SOMOTOZ WORKSPACE // ONLINE
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className={isLight ? 'text-[#64748B]' : isMix ? 'text-[#786E64]' : 'text-[#737373]'}>
                      USER:{' '}
                      <strong className={isLight ? 'text-[#0284C7]' : isMix ? 'text-[#D97706]' : 'text-[#00F0FF]'}>
                        {activeDecryptedUser?.displayName || 'Somotoz User'}
                      </strong>
                    </span>
                    <button
                      onClick={() => setViewState('landing')}
                      className="px-2.5 py-1 clip-badge-poly border border-rose-500/40 text-rose-500 hover:bg-rose-500/10 text-[11px] cursor-pointer"
                    >
                      LOGOUT
                    </button>
                  </div>
                </div>

                {/* Dashboard layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
                  {/* Sidebar */}
                  <div
                    className={`md:col-span-4 border-r p-4 space-y-4 ${
                      isLight
                        ? 'bg-[#F8FAFC] border-[#E2E8F0]'
                        : isMix
                        ? 'bg-[#FFFDF9] border-[#E4DCD0]'
                        : 'bg-[#070710] border-[#252538]'
                    }`}
                  >
                    <div
                      className={`text-xs uppercase tracking-wider font-bold ${
                        isLight ? 'text-[#64748B]' : isMix ? 'text-[#786E64]' : 'text-[#737373]'
                      }`}
                    >
                      Main Tools
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div
                        className={`p-2.5 clip-badge-poly border flex items-center justify-between font-bold ${
                          isLight
                            ? 'bg-[#E0F2FE] border-[#0284C7] text-[#0284C7]'
                            : isMix
                            ? 'bg-[#FEF3C7] border-[#D97706] text-[#D97706]'
                            : 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#00F0FF]'
                        }`}
                      >
                        <span>Daily Notes & Journal</span>
                        <span className="text-[10px]">ACTIVE</span>
                      </div>
                      <div
                        className={`p-2.5 clip-badge-poly border flex items-center justify-between ${
                          isLight
                            ? 'bg-white border-[#E2E8F0] text-[#475569]'
                            : isMix
                            ? 'bg-[#FAF6EE] border-[#E4DCD0] text-[#5F564D]'
                            : 'bg-black border-[#252538] text-[#A1A1AA]'
                        }`}
                      >
                        <span>Chat (Text & Media)</span>
                        <span className="text-[10px]">READY</span>
                      </div>
                      <div
                        className={`p-2.5 clip-badge-poly border flex items-center justify-between ${
                          isLight
                            ? 'bg-white border-[#E2E8F0] text-[#475569]'
                            : isMix
                            ? 'bg-[#FAF6EE] border-[#E4DCD0] text-[#5F564D]'
                            : 'bg-black border-[#252538] text-[#A1A1AA]'
                        }`}
                      >
                        <span>Knowledge Hub</span>
                        <span className="text-[10px]">READY</span>
                      </div>
                      <div
                        className={`p-2.5 clip-badge-poly border flex items-center justify-between ${
                          isLight
                            ? 'bg-white border-[#E2E8F0] text-[#475569]'
                            : isMix
                            ? 'bg-[#FAF6EE] border-[#E4DCD0] text-[#5F564D]'
                            : 'bg-black border-[#252538] text-[#A1A1AA]'
                        }`}
                      >
                        <span>Focus Sounds & Music</span>
                        <span className="text-[10px]">READY</span>
                      </div>
                    </div>
                  </div>

                  {/* Main Area */}
                  <div className="md:col-span-8 p-6 space-y-6">
                    <div
                      className={`p-4 clip-badge-poly border space-y-2 ${
                        isLight
                          ? 'bg-[#F8FAFC] border-[#E2E8F0]'
                          : isMix
                          ? 'bg-[#FFFDF9] border-[#E4DCD0]'
                          : 'bg-black border-[#252538]'
                      }`}
                    >
                      <div
                        className={`text-xs font-bold ${
                          isLight ? 'text-[#0284C7]' : isMix ? 'text-[#D97706]' : 'text-[#00F0FF]'
                        }`}
                      >
                        &gt; WELCOME
                      </div>
                      <h2
                        className={`text-xl font-bold font-display ${
                          isLight ? 'text-[#090D16]' : isMix ? 'text-[#231E19]' : 'text-[#EDEDED]'
                        }`}
                      >
                        Hello, {activeDecryptedUser?.displayName || 'User'}. Somotoz Workspace is ready.
                      </h2>
                      <p
                        className={`text-xs leading-relaxed font-sans ${
                          isLight ? 'text-[#475569]' : isMix ? 'text-[#5F564D]' : 'text-[#A1A1AA]'
                        }`}
                      >
                        All tools and data storage are synchronized. Start exploring AI chat, vector illustrations, video generation, or focus music.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div
                        className={`p-4 clip-badge-poly border space-y-1 ${
                          isLight
                            ? 'bg-white border-[#E2E8F0]'
                            : isMix
                            ? 'bg-[#FAF6EE] border-[#E4DCD0]'
                            : 'bg-black border-[#252538]'
                        }`}
                      >
                        <span className={`text-[10px] ${isLight ? 'text-[#64748B]' : isMix ? 'text-[#786E64]' : 'text-[#737373]'}`}>
                          STORAGE QUOTA
                        </span>
                        <p className={`font-bold ${isLight ? 'text-[#0284C7]' : isMix ? 'text-[#D97706]' : 'text-[#00F0FF]'}`}>
                          Encrypted Private Storage
                        </p>
                      </div>
                      <div
                        className={`p-4 clip-badge-poly border space-y-1 ${
                          isLight
                            ? 'bg-white border-[#E2E8F0]'
                            : isMix
                            ? 'bg-[#FAF6EE] border-[#E4DCD0]'
                            : 'bg-black border-[#252538]'
                        }`}
                      >
                        <span className={`text-[10px] ${isLight ? 'text-[#64748B]' : isMix ? 'text-[#786E64]' : 'text-[#737373]'}`}>
                          MULTIMODAL SUITE
                        </span>
                        <p className={`font-bold ${isLight ? 'text-[#0284C7]' : isMix ? 'text-[#D97706]' : 'text-[#00F0FF]'}`}>
                          Chat + SVG + Video + Music
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={onSignIn}
                        className={`px-5 py-3 clip-badge-poly font-mono font-bold text-xs shadow-lg cursor-pointer ${
                          isLight
                            ? 'bg-[#0284C7] text-white shadow-[0_4px_15px_rgba(2,132,199,0.3)]'
                            : isMix
                            ? 'bg-[#D97706] text-white shadow-[0_4px_15px_rgba(217,119,6,0.3)]'
                            : 'bg-[#00F0FF] text-black shadow-[0_0_20px_rgba(0,240,255,0.4)]'
                        }`}
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
      <footer
        className={`relative z-30 w-full border-t py-5 px-4 sm:px-6 transition-colors ${
          isLight
            ? 'border-[#E2E8F0] bg-white text-[#64748B]'
            : isMix
            ? 'border-[#E4DCD0] bg-[#FAF6EE] text-[#786E64]'
            : 'border-[#252538] bg-[#0A0A14] text-[#737373]'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span>SOMOTOZ AI SUITE</span>
            <span>•</span>
            <span>GEMINI MULTIMODAL</span>
            <span>•</span>
            <span>FIRESTORE CLOUD</span>
          </div>

          <div className="flex items-center space-x-2 flex-wrap justify-center sm:justify-end gap-y-1">
            <span>ARCHITECTED WITH PASSION BY</span>
            <strong
              className={`underline underline-offset-2 ${
                isLight ? 'text-[#0284C7]' : isMix ? 'text-[#D97706]' : 'text-[#00F0FF]'
              }`}
            >
              SOM MAURYA
            </strong>
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#A855F7] to-[#FF007A]">
              (IIT MADRAS DATA SCIENCE &amp; COMPUTATIONAL THINKING)
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
