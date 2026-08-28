import React, { useState, useEffect } from 'react';
import { Terminal, Sparkles, Activity, Clock, Quote, Flame, Zap, RefreshCw, Cpu, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';

interface QuoteItem {
  id: string;
  lead: string;
  highlight1: string;
  middle: string;
  highlight2: string;
  tail: string;
  author: string;
  tag: string;
  accent: string;
  accentClass: string;
  badgeBg: string;
}

const GENZ_HIGH_IMPACT_QUOTES: QuoteItem[] = [
  {
    id: 'quote-1',
    lead: '',
    highlight1: 'Zero tech debt today,',
    middle: ' ',
    highlight2: 'pure dopamine tomorrow.',
    tail: ' Keep shipping.',
    author: 'Som Maurya',
    tag: 'HIGH_VELOCITY',
    accent: '#00F0FF',
    accentClass: 'from-[#00F0FF] to-[#38BDF8]',
    badgeBg: 'bg-[#00F0FF]/15 border-[#00F0FF]/40 text-[#00F0FF]'
  },
  {
    id: 'quote-2',
    lead: 'Shipping models ',
    highlight1: 'faster than GPU thermals',
    middle: ' throttle. ',
    highlight2: 'Built different.',
    tail: '',
    author: 'AI Core',
    tag: 'GPU_OVERCLOCK',
    accent: '#FF007A',
    accentClass: 'from-[#FF007A] to-[#FF529A]',
    badgeBg: 'bg-[#FF007A]/15 border-[#FF007A]/40 text-[#FF007A]'
  },
  {
    id: 'quote-3',
    lead: 'Main character energy: ',
    highlight1: 'O(1) time complexity',
    middle: ' & ',
    highlight2: 'sub-millisecond latency.',
    tail: '',
    author: 'System Architect',
    tag: 'OPTIMAL_FLOW',
    accent: '#FFB800',
    accentClass: 'from-[#FFB800] to-[#F59E0B]',
    badgeBg: 'bg-[#FFB800]/15 border-[#FFB800]/40 text-[#FFB800]'
  },
  {
    id: 'quote-4',
    lead: "Keep cookin', your loss function is ",
    highlight1: 'strictly converging',
    middle: ' to ',
    highlight2: 'global minima.',
    tail: '',
    author: 'Som Maurya',
    tag: 'GRADIENT_ASCENT',
    accent: '#A855F7',
    accentClass: 'from-[#A855F7] to-[#C084FC]',
    badgeBg: 'bg-[#A855F7]/15 border-[#A855F7]/40 text-[#A855F7]'
  },
  {
    id: 'quote-5',
    lead: 'Simplicity is the highest tier of ',
    highlight1: 'engineering flex.',
    middle: ' ',
    highlight2: 'Deconstruct complexity.',
    tail: '',
    author: 'Edsger Dijkstra',
    tag: 'FIRST_PRINCIPLES',
    accent: '#00FF41',
    accentClass: 'from-[#00FF41] to-[#10B981]',
    badgeBg: 'bg-[#00FF41]/15 border-[#00FF41]/40 text-[#00FF41]'
  },
  {
    id: 'quote-6',
    lead: 'Unapologetically optimized, ',
    highlight1: 'strictly high-throughput,',
    middle: ' ',
    highlight2: 'zero excuses.',
    tail: '',
    author: 'Somotoz Suite',
    tag: 'COMPUTE_DOMINANCE',
    accent: '#0284C7',
    accentClass: 'from-[#0284C7] to-[#00F0FF]',
    badgeBg: 'bg-[#0284C7]/15 border-[#0284C7]/40 text-[#0284C7]'
  },
  {
    id: 'quote-7',
    lead: 'Refactoring reality with ',
    highlight1: 'first-principles',
    middle: ' ',
    highlight2: 'computational thinking.',
    tail: '',
    author: 'Som Maurya',
    tag: 'DEEP_COGNITION',
    accent: '#F43F5E',
    accentClass: 'from-[#F43F5E] to-[#FB7185]',
    badgeBg: 'bg-[#F43F5E]/15 border-[#F43F5E]/40 text-[#F43F5E]'
  },
  {
    id: 'quote-8',
    lead: '',
    highlight1: 'Zero mock telemetry,',
    middle: ' ',
    highlight2: '100% production-ready momentum.',
    tail: '',
    author: 'Engineering Protocol',
    tag: 'PRODUCTION_MASTERY',
    accent: '#10B981',
    accentClass: 'from-[#10B981] to-[#00F0FF]',
    badgeBg: 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981]'
  }
];

interface DynamicWelcomeBannerProps {
  userName?: string | null;
}

export const DynamicWelcomeBanner: React.FC<DynamicWelcomeBannerProps> = ({ userName }) => {
  const { theme } = useTheme();
  const isLight = theme === 'white';
  const isMix = theme === 'mix';

  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * GENZ_HIGH_IMPACT_QUOTES.length));
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [direction, setDirection] = useState(1);

  // Live system clock ticker
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Compute live time-of-day greeting
  const hours = currentTime.getHours();
  let timeOfDayGreeting = 'Good Evening';
  let timeTag = 'EVENING SPRINT';
  let greetingColor = '#A855F7';

  if (hours >= 5 && hours < 12) {
    timeOfDayGreeting = 'Good Morning';
    timeTag = 'MORNING PRIME';
    greetingColor = '#FFB800';
  } else if (hours >= 12 && hours < 17) {
    timeOfDayGreeting = 'Good Afternoon';
    timeTag = 'AFTERNOON FLOW';
    greetingColor = '#00F0FF';
  } else if (hours >= 17 && hours < 22) {
    timeOfDayGreeting = 'Good Evening';
    timeTag = 'EVENING SPRINT';
    greetingColor = '#FF007A';
  } else {
    timeOfDayGreeting = 'Good Night';
    timeTag = 'LATE NIGHT COGNITION';
    greetingColor = '#00F0FF';
  }

  const activeQuoteObj = GENZ_HIGH_IMPACT_QUOTES[quoteIndex];

  // Auto-cycle quote every 7 seconds
  useEffect(() => {
    const quoteTimer = setInterval(() => {
      setDirection(1);
      setQuoteIndex((prev) => (prev + 1) % GENZ_HIGH_IMPACT_QUOTES.length);
    }, 7000);
    return () => clearInterval(quoteTimer);
  }, []);

  const handleCycleQuote = () => {
    setDirection(1);
    setQuoteIndex((prev) => (prev + 1) % GENZ_HIGH_IMPACT_QUOTES.length);
  };

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const resolvedDisplayName = userName && userName.trim().length > 0 
    ? userName 
    : 'Somkumar Maurya';

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`relative overflow-hidden clip-stealth-notch font-mono select-none transition-all duration-300 ${
        isLight
          ? 'bg-white/90 border-2 border-[#CBD5E1] shadow-[0_10px_35px_rgba(2,132,199,0.12)]'
          : isMix
          ? 'bg-[#FAF6EE]/95 border-2 border-[#D3C7B5] shadow-[0_10px_35px_rgba(217,119,6,0.12)]'
          : 'bg-gradient-to-br from-[#0F0F1E] via-[#090914] to-[#04040A] border-2 border-[#2D2D48] shadow-[0_0_35px_rgba(0,240,255,0.1)]'
      }`}
    >
      {/* 1. Multi-Color Glowing Gradient Top Accent Border */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#00F0FF] via-[#A855F7] via-[#FF007A] via-[#FFB800] to-[#00FF41] z-20" />
      
      {/* 2. Dynamic Ambient Radial Glow */}
      <div 
        className="absolute -top-16 -right-16 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700 z-0"
        style={{ backgroundColor: activeQuoteObj.accent }}
      />
      <div 
        className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none transition-all duration-700 z-0"
        style={{ backgroundColor: isLight ? '#0284C7' : isMix ? '#D97706' : '#00F0FF' }}
      />

      <div className="relative z-10 p-5 sm:p-6 space-y-4">
        
        {/* Top Header Row: System Telemetry & Live Clock Synchronization */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-inherit/40">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 clip-badge-poly flex items-center gap-1.5 border ${
                isLight
                  ? 'bg-[#E2E8F0] border-[#CBD5E1] text-[#0284C7]'
                  : isMix
                  ? 'bg-[#EFE7DA] border-[#D8CEBF] text-[#D97706]'
                  : 'bg-black/80 border-[#00F0FF]/60 text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.3)]'
              }`}
            >
              <Activity className="w-3 h-3 animate-pulse" />
              {timeTag}
            </span>

            <span className="text-inherit opacity-40 hidden sm:inline">|</span>

            <span 
              className={`text-[11px] font-medium flex items-center gap-1.5 px-2 py-0.5 clip-badge-poly border ${
                isLight
                  ? 'bg-slate-100/80 border-slate-200 text-[#27303F]'
                  : isMix
                  ? 'bg-[#ECE5D6]/80 border-[#D8CEBF] text-[#52483E]'
                  : 'bg-black/60 border-[#2D2D45] text-[#A1A1AA]'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-[#00F0FF]" />
              <strong>{formattedDate}</strong>
              <span className="opacity-40">//</span>
              <span className="font-bold text-[#00F0FF]">{formattedTime}</span>
            </span>

            <span className="text-inherit opacity-40 hidden md:inline">|</span>

            <span 
              className={`text-[10px] px-2 py-0.5 clip-badge-poly font-bold flex items-center gap-1 border transition-colors ${activeQuoteObj.badgeBg}`}
            >
              <Flame className="w-3 h-3" />
              #{activeQuoteObj.tag}
            </span>
          </div>

          {/* Real System Telemetry Tag */}
          <div className="flex items-center space-x-2 shrink-0">
            <span 
              className={`text-[10px] px-2 py-0.5 clip-badge-poly flex items-center gap-1 border ${
                isLight 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                  : isMix 
                  ? 'bg-amber-50 text-amber-800 border-amber-300' 
                  : 'bg-emerald-950/60 text-[#00FF41] border-emerald-700/60'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span className="font-bold">FIRESTORE CLUSTER ONLINE</span>
            </span>
          </div>
        </div>

        {/* Middle Row: Dynamic Time-of-Day Greeting & User Identity */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3.5">
            <div 
              className={`w-12 h-12 flex items-center justify-center shrink-0 clip-badge-poly border-2 transition-all duration-500 ${
                isLight
                  ? 'bg-gradient-to-br from-[#0284C7] to-[#7C3AED] text-white border-[#0284C7] shadow-[0_0_15px_rgba(2,132,199,0.35)]'
                  : isMix
                  ? 'bg-gradient-to-br from-[#D97706] to-[#0D9488] text-white border-[#D97706] shadow-[0_0_15px_rgba(217,119,6,0.35)]'
                  : 'bg-black/90 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.35)]'
              }`}
            >
              <Terminal className="w-6 h-6 animate-pulse" />
            </div>

            <div className="space-y-0.5">
              <div className="text-[11px] uppercase tracking-wider font-semibold opacity-70 flex items-center gap-1.5 flex-wrap">
                <span>{timeOfDayGreeting} // Active Session</span>
                <span>•</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#A855F7] to-[#FF007A] font-bold">
                  IIT Madras Data Science &amp; Computational Thinking
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight font-display flex items-center flex-wrap gap-x-2">
                <span className={isLight ? 'text-[#090D16]' : isMix ? 'text-[#231E19]' : 'text-[#FFFFFF]'}>
                  {timeOfDayGreeting},
                </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#A855F7] to-[#FF007A]">
                  {resolvedDisplayName}
                </span>
              </h1>
            </div>
          </div>

          {/* Right Action: Next Spark Cycle Button */}
          <div className="self-end md:self-center">
            <button
              onClick={handleCycleQuote}
              className={`px-3.5 py-2 text-xs font-mono font-bold clip-badge-poly transition-all cursor-pointer flex items-center gap-2 border active:scale-95 group ${
                isLight
                  ? 'bg-[#F1F5F9] hover:bg-[#E2E8F0] border-[#CBD5E1] text-[#090D16] hover:text-[#0284C7]'
                  : isMix
                  ? 'bg-[#EFE7DA] hover:bg-[#E2DAC8] border-[#D8CEBF] text-[#231E19] hover:text-[#D97706]'
                  : 'bg-black/80 hover:bg-[#141424] border-[#2D2D45] hover:border-[#00F0FF] text-[#EDEDED] hover:text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.15)]'
              }`}
              title="Cycle to next GenZ engineering spark"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#00F0FF] group-hover:rotate-180 transition-transform duration-500" />
              <span>Next Spark</span>
            </button>
          </div>
        </div>

        {/* Bottom Container: Dedicated Non-Rectangular Floating GenZ Quotes Box */}
        <div 
          className={`p-3.5 sm:p-4 clip-cyber-corner border relative overflow-hidden transition-all duration-300 ${
            isLight
              ? 'bg-[#F8FAFC] border-[#E2E8F0] text-[#090D16]'
              : isMix
              ? 'bg-[#F4EFE6] border-[#E4DCD0] text-[#231E19]'
              : 'bg-black/70 border-[#262638] text-[#EDEDED]'
          }`}
        >
          <div className="flex items-start space-x-3">
            <Quote 
              className="w-5 h-5 shrink-0 mt-0.5" 
              style={{ color: activeQuoteObj.accent }} 
            />

            <div className="flex-1 min-h-[3rem] flex items-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeQuoteObj.id}
                  initial={{ opacity: 0, x: direction * 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -direction * 18 }}
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  className="space-y-1 w-full"
                >
                  <p className="text-sm sm:text-base font-semibold leading-relaxed tracking-tight">
                    <span>{activeQuoteObj.lead}</span>
                    <span 
                      className={`px-1.5 py-0.5 mx-1 clip-badge-poly font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${activeQuoteObj.accentClass} ${
                        isLight 
                          ? 'bg-slate-200/80' 
                          : isMix 
                          ? 'bg-amber-100/80' 
                          : 'bg-white/10'
                      }`}
                    >
                      {activeQuoteObj.highlight1}
                    </span>
                    <span>{activeQuoteObj.middle}</span>
                    <span 
                      className={`px-1.5 py-0.5 mx-1 clip-badge-poly font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] via-[#A855F7] to-[#00F0FF] ${
                        isLight 
                          ? 'bg-slate-200/80' 
                          : isMix 
                          ? 'bg-amber-100/80' 
                          : 'bg-white/10'
                      }`}
                    >
                      {activeQuoteObj.highlight2}
                    </span>
                    <span>{activeQuoteObj.tail}</span>
                  </p>
                  <div className="flex items-center space-x-2 text-[11px] font-mono opacity-70 pt-0.5">
                    <span>— <strong>{activeQuoteObj.author}</strong></span>
                    <span>•</span>
                    <span className="font-bold uppercase" style={{ color: activeQuoteObj.accent }}>{activeQuoteObj.tag}</span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

