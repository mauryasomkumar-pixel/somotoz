import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Cpu,
  Flame,
  MessageSquare,
  Image as ImageIcon,
  Film,
  Music,
  ArrowRight,
  TrendingUp,
  User,
  Shield,
  Activity,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Settings,
  Clock
} from 'lucide-react';
import { UserProfile, ViewMode, JournalEntry, GenerationMode, UserActivityLog } from '../types';
import { useTheme } from '../context/ThemeContext';
import { DynamicWelcomeBanner } from './DynamicWelcomeBanner';

interface DashboardProps {
  user: UserProfile;
  entries: JournalEntry[];
  activityLogs: UserActivityLog[];
  onNavigate: (view: ViewMode, generationMode?: GenerationMode) => void;
  onNewReflection: () => void;
  onOpenProfile: () => void;
}

// Function to compute accurate real-world time of day greeting
function getRealTimeGreeting(): string {
  const now = new Date();
  const hour = now.getHours();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  };
  const dateFormatted = now.toLocaleDateString('en-US', options);

  if (hour >= 5 && hour < 12) {
    return `Good Morning, Som // ${dateFormatted} — Neural Core Active`;
  } else if (hour >= 12 && hour < 17) {
    return `Good Afternoon, Som // ${dateFormatted} — High Throughput Mode`;
  } else if (hour >= 17 && hour < 22) {
    return `Good Evening, Som // ${dateFormatted} — Synthesis Optimal`;
  } else {
    return `Good Night, Som // ${dateFormatted} — Deep Cognitive Shift`;
  }
}

// Dynamic Theme-Adaptive High-Contrast Multi-Hue Color Palettes for Data Visualizations
// Vibrant non-monotonic spectrum (Cyan, Emerald, Electric Violet, Hot Magenta, Fiery Amber)
const THEME_CHART_PALETTES = {
  black: {
    // Obsidian Dark Canvas: Multi-Hue Electric Cyberpunk (Cyan, Neon Green, Hot Magenta, Vibrant Gold)
    text: '#00F0FF', // Electric Cyan
    textGlow: 'rgba(0, 240, 255, 0.85)',
    image: '#A855F7', // Ultraviolet Purple
    imageGlow: 'rgba(168, 85, 247, 0.85)',
    video: '#FF007A', // Neon Hot Magenta
    videoGlow: 'rgba(255, 0, 122, 0.85)',
    music: '#FFB800', // Electric Amber Gold
    musicGlow: 'rgba(255, 184, 0, 0.85)',
    barDefault: '#1F1F2E',
    barCurrent: '#00F0FF',
    barHover: '#FF007A',
    barGlow: 'rgba(0, 240, 255, 0.6)',
    track: '#13131A',
    gridLine: '#2D2D3D',
    cardBg: '#0A0A0F',
    cardBorder: '#2A2A3C',
  },
  white: {
    // Ultra-Clean High-Contrast Light Canvas: Vivid Multi-Color Jewel Tones
    text: '#0284C7', // Vivid Sky Blue
    textGlow: 'rgba(2, 132, 199, 0.4)',
    image: '#7C3AED', // Deep Violet
    imageGlow: 'rgba(124, 58, 237, 0.4)',
    video: '#E11D48', // Vibrant Rose Magenta
    videoGlow: 'rgba(225, 29, 72, 0.4)',
    music: '#D97706', // Rich Amber Gold
    musicGlow: 'rgba(217, 119, 6, 0.4)',
    barDefault: '#E2E8F0',
    barCurrent: '#0284C7',
    barHover: '#7C3AED',
    barGlow: 'rgba(2, 132, 199, 0.35)',
    track: '#EDF2F7',
    gridLine: '#CBD5E1',
    cardBg: '#FFFFFF',
    cardBorder: '#CBD5E1',
  },
  mix: {
    // Eye-Care Warm Canvas: Multi-Hue Deep Emerald, Royal Indigo, Coral & Ochre
    text: '#0D9488', // Deep Teal
    textGlow: 'rgba(13, 148, 136, 0.4)',
    image: '#6366F1', // Royal Indigo
    imageGlow: 'rgba(99, 102, 241, 0.4)',
    video: '#F43F5E', // Warm Coral Pink
    videoGlow: 'rgba(244, 63, 94, 0.4)',
    music: '#EA580C', // Sunset Ochre
    musicGlow: 'rgba(234, 88, 12, 0.4)',
    barDefault: '#E5E0D8',
    barCurrent: '#0D9488',
    barHover: '#6366F1',
    barGlow: 'rgba(13, 148, 136, 0.35)',
    track: '#EFEAE1',
    gridLine: '#CFC5B8',
    cardBg: '#FAF7F2',
    cardBorder: '#D6CEBE',
  },
};

// Usage metric category for Real Donut Chart
interface UsageMetric {
  id: GenerationMode;
  label: string;
  count: number;
  percentage: number;
  color: string;
  glow: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  latency: string;
}

// Heatmap Day Node
interface HeatmapDay {
  dateStr: string;
  formattedDate: string;
  count: number;
  level: number; // 0 to 4
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  weekIndex: number; // 0 to 7
  events: Array<{ timestamp: number; mode: GenerationMode; tokens: number; preview?: string }>;
}

// 7-Day Vibrant Color Map for Distinct Day-of-Week Fills
const DAY_OF_WEEK_CONFIG: Record<number, { name: string; short: string; darkColor: string; lightColor: string; mixColor: string; glow: string }> = {
  1: { name: 'Monday', short: 'Mon', darkColor: '#00F0FF', lightColor: '#0284C7', mixColor: '#0D9488', glow: 'rgba(0, 240, 255, 0.7)' },
  2: { name: 'Tuesday', short: 'Tue', darkColor: '#A855F7', lightColor: '#7C3AED', mixColor: '#6366F1', glow: 'rgba(168, 85, 247, 0.7)' },
  3: { name: 'Wednesday', short: 'Wed', darkColor: '#FF007A', lightColor: '#E11D48', mixColor: '#F43F5E', glow: 'rgba(255, 0, 122, 0.7)' },
  4: { name: 'Thursday', short: 'Thu', darkColor: '#FFB800', lightColor: '#D97706', mixColor: '#EA580C', glow: 'rgba(255, 184, 0, 0.7)' },
  5: { name: 'Friday', short: 'Fri', darkColor: '#00FF88', lightColor: '#059669', mixColor: '#10B981', glow: 'rgba(0, 255, 136, 0.7)' },
  6: { name: 'Saturday', short: 'Sat', darkColor: '#38BDF8', lightColor: '#2563EB', mixColor: '#3B82F6', glow: 'rgba(56, 189, 248, 0.7)' },
  0: { name: 'Sunday', short: 'Sun', darkColor: '#F43F5E', lightColor: '#DC2626', mixColor: '#F97316', glow: 'rgba(244, 63, 94, 0.7)' },
};

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  entries,
  activityLogs,
  onNavigate,
  onNewReflection,
  onOpenProfile,
}) => {
  const { theme } = useTheme();
  const currentTheme = (theme === 'white' || theme === 'mix') ? theme : 'black';
  const palette = THEME_CHART_PALETTES[currentTheme];

  // Dynamic Greeting & Rotating GenZ Quote State
  const [typedGreeting, setTypedGreeting] = useState<string>('');
  const [cursorVisible, setCursorVisible] = useState<boolean>(true);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Timeframe for Bar Chart
  const [timeframe, setTimeframe] = useState<'7d' | '14d' | '30d'>('7d');

  // Interactive Day-of-Week Filter for 56-Day Activity Matrix
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | null>(null); // null = all days

  // Interactive Selected Day Inspector Modal State
  const [inspectedDay, setInspectedDay] = useState<HeatmapDay | null>(null);

  // Interactive Hover States
  const [hoveredDonutSegment, setHoveredDonutSegment] = useState<GenerationMode | null>(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [hoveredHeatmapDay, setHoveredHeatmapDay] = useState<{
    day: HeatmapDay;
    x: number;
    y: number;
  } | null>(null);

  // Calculate greeting dynamically based on accurate real-world time
  useEffect(() => {
    const greetingText = getRealTimeGreeting();
    setTypedGreeting('');

    let index = 0;
    const interval = setInterval(() => {
      if (index <= greetingText.length) {
        setTypedGreeting(greetingText.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 22);

    return () => clearInterval(interval);
  }, []);

  // Blinking cursor effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  // ---------------------------------------------------------------------------
  // REAL DATA CALCULATIONS (NO RANDOM / NO FAKE METRICS)
  // ---------------------------------------------------------------------------

  // Combine all actual events: Journal entries + Dedicated Activity Logs + Chat messages
  const allEvents = useMemo(() => {
    const events: Array<{ timestamp: number; mode: GenerationMode; tokens: number }> = [];

    // From journal entries
    entries.forEach((e) => {
      const words = e.wordCount || e.content?.split(/\s+/).length || 10;
      events.push({
        timestamp: e.createdAt,
        mode: 'text',
        tokens: Math.round(words * 1.3),
      });

      if (e.artworkData) {
        events.push({
          timestamp: e.updatedAt || e.createdAt,
          mode: 'image',
          tokens: 240,
        });
      }

      if (e.chatThread) {
        e.chatThread.forEach((msg) => {
          events.push({
            timestamp: msg.timestamp,
            mode: msg.mode || 'text',
            tokens: Math.max(20, Math.round((msg.content?.length || 50) / 4)),
          });
        });
      }
    });

    // From real activity logs
    activityLogs.forEach((log) => {
      events.push({
        timestamp: log.timestamp,
        mode: log.mode,
        tokens: log.tokens || 120,
      });
    });

    return events;
  }, [entries, activityLogs]);

  // 1. Real Multimodal Tool Distribution (Donut Chart)
  const usageMetrics: UsageMetric[] = useMemo(() => {
    let textCount = 0;
    let imageCount = 0;
    let videoCount = 0;
    let musicCount = 0;

    allEvents.forEach((ev) => {
      if (ev.mode === 'text') textCount += 1;
      else if (ev.mode === 'image') imageCount += 1;
      else if (ev.mode === 'video') videoCount += 1;
      else if (ev.mode === 'music') musicCount += 1;
    });

    const total = textCount + imageCount + videoCount + musicCount;

    const calcPercent = (count: number) => {
      if (total === 0) return 0;
      return Math.round((count / total) * 100);
    };

    return [
      {
        id: 'text',
        label: 'Chat Logic',
        count: textCount,
        percentage: calcPercent(textCount),
        color: palette.text,
        glow: palette.textGlow,
        icon: MessageSquare,
        badge: 'LLM-2.5',
        latency: '32ms',
      },
      {
        id: 'image',
        label: 'Image Generator',
        count: imageCount,
        percentage: calcPercent(imageCount),
        color: palette.image,
        glow: palette.imageGlow,
        icon: ImageIcon,
        badge: '1K-HDR',
        latency: '48ms',
      },
      {
        id: 'video',
        label: 'Video Generator',
        count: videoCount,
        percentage: calcPercent(videoCount),
        color: palette.video,
        glow: palette.videoGlow,
        icon: Film,
        badge: '60FPS-MOTION',
        latency: '54ms',
      },
      {
        id: 'music',
        label: 'Music Generator',
        count: musicCount,
        percentage: calcPercent(musicCount),
        color: palette.music,
        glow: palette.musicGlow,
        icon: Music,
        badge: '432HZ-SYNTH',
        latency: '18ms',
      },
    ];
  }, [allEvents, palette]);

  const totalSyntheses = useMemo(() => {
    return usageMetrics.reduce((acc, curr) => acc + curr.count, 0);
  }, [usageMetrics]);

  // 2. Real Consecutive Streak Calculation
  const streakDays = useMemo(() => {
    if (allEvents.length === 0) return 0;

    // Set of active date strings in YYYY-MM-DD
    const activeDates = new Set<string>();
    allEvents.forEach((ev) => {
      const d = new Date(ev.timestamp);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      activeDates.add(key);
    });

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    // Streak is active if user had activity today or yesterday
    let currentStreak = 0;
    let checkDate = new Date(today);

    if (activeDates.has(todayStr)) {
      // Activity recorded today
      while (true) {
        const dStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        if (activeDates.has(dStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    } else if (activeDates.has(yesterdayStr)) {
      // Activity was yesterday, streak still alive today
      checkDate = new Date(yesterday);
      while (true) {
        const dStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        if (activeDates.has(dStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    return currentStreak;
  }, [allEvents]);

  // 3. Real Weekly / Timeframe Output Data
  const weeklyOutputData = useMemo(() => {
    const numDays = timeframe === '7d' ? 7 : timeframe === '14d' ? 14 : 30;
    const now = new Date();
    const result = [];

    for (let i = numDays - 1; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(now.getDate() - i);
      const dateKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
      
      const dayName = targetDate.toLocaleDateString('en-US', {
        weekday: numDays <= 7 ? 'short' : undefined,
        month: numDays > 7 ? 'numeric' : undefined,
        day: 'numeric',
      });

      // Filter events on this specific day
      const dayEvents = allEvents.filter((ev) => {
        const d = new Date(ev.timestamp);
        const evKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return evKey === dateKey;
      });

      const count = dayEvents.length;
      const tokens = dayEvents.reduce((acc, curr) => acc + curr.tokens, 0);
      const isCurrent = i === 0;

      result.push({
        day: dayName,
        dateKey,
        count,
        tokens,
        isCurrent,
      });
    }

    return result;
  }, [allEvents, timeframe]);

  const maxWeeklyCount = useMemo(() => {
    const max = Math.max(...weeklyOutputData.map((d) => d.count), 0);
    return max > 0 ? max : 1;
  }, [weeklyOutputData]);

  // 4. Real 56-Day Activity Heatmap Matrix
  const heatmapGrid = useMemo(() => {
    const totalDays = 56; // 8 weeks
    const result: HeatmapDay[] = [];
    const today = new Date();

    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const formattedDate = d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      // Filter matching events on this specific date
      const matchingEvents = allEvents
        .filter((ev) => {
          const evD = new Date(ev.timestamp);
          const evKey = `${evD.getFullYear()}-${String(evD.getMonth() + 1).padStart(2, '0')}-${String(evD.getDate()).padStart(2, '0')}`;
          return evKey === dateStr;
        })
        .map((ev) => ({
          timestamp: ev.timestamp,
          mode: ev.mode,
          tokens: ev.tokens,
          preview: ev.mode === 'text' ? 'Smart Chat Reasoning Session' : ev.mode === 'image' ? '1K Photorealistic Visual' : ev.mode === 'video' ? '60FPS Motion Storyboard' : '432Hz Procedural Melody',
        }));

      const count = matchingEvents.length;

      // Density level based purely on real count
      let level = 0;
      if (count >= 8) level = 4;
      else if (count >= 5) level = 3;
      else if (count >= 2) level = 2;
      else if (count > 0) level = 1;

      // Calculate week index (0 to 7)
      const weekIndex = Math.floor((totalDays - 1 - i) / 7);

      result.push({
        dateStr,
        formattedDate,
        count,
        level,
        dayOfWeek: d.getDay(),
        weekIndex,
        events: matchingEvents,
      });
    }

    return result;
  }, [allEvents]);

  // Donut SVG Calculations
  const radius = 68;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercentage = 0;

  const userInitials = useMemo(() => {
    if (!user.displayName) return 'U';
    const parts = user.displayName.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return user.displayName.slice(0, 2).toUpperCase();
  }, [user.displayName]);

  return (
    <div className="w-full text-[#EDEDED] font-sans space-y-6 select-none">
      
      {/* ========================================================================= */}
      {/* 1. DEDICATED FLOATING GREETING & GENZ QUOTES CONTAINER                    */}
      {/* ========================================================================= */}
      <DynamicWelcomeBanner userName={user.displayName} />

      {/* ========================================================================= */}
      {/* 2. REAL TELEMETRY STATUS BAR & LAUNCH CONTROLS                            */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        className="p-4 sm:p-5 bg-gradient-to-br from-[#0D0D18] via-[#080810] to-[#030306] border border-[#2D2D45] relative overflow-hidden clip-stealth-notch shadow-[0_0_30px_rgba(0,240,255,0.08)]"
      >
        {/* Subtle multi-hue gradient line at the top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00F0FF] via-[#A855F7] via-[#FF007A] to-[#FFB800]" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            {/* Top metadata tags */}
            <div className="flex items-center space-x-2.5 text-xs font-mono text-[#737373] flex-wrap gap-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-black/80 border border-[#00F0FF]/60 text-[#00F0FF] text-[11px] font-bold clip-badge-poly shadow-[0_0_12px_rgba(0,240,255,0.3)]">
                <span className="w-2 h-2 bg-[#00F0FF] animate-pulse rounded-full" />
                COMMAND_CENTER // ACTIVE
              </span>
              <span className="hidden sm:inline-block text-[#333333]">|</span>
              <span className="hidden sm:flex items-center gap-1 text-[#A1A1AA]">
                <Cpu className="w-3.5 h-3.5 text-[#A855F7]" />
                Gemini 2.5 Multi-Modal Engine
              </span>
              <span className="hidden sm:inline-block text-[#333333]">|</span>
              <span className="hidden sm:inline-block text-[#A1A1AA]">
                Active Architect: <strong className="text-[#EDEDED]">{user.displayName || 'Som Maurya'}</strong>
              </span>
            </div>

            <p className="text-xs text-[#A1A1AA] font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#FF007A] rounded-full animate-ping" />
              Real-time Firestore cluster synced. 100% live user syntheses.
            </p>
          </div>

          {/* Right Status Badges & Quick Action & Profile Avatar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Real Streak Badge */}
            <div className="px-3 py-2 bg-black/70 border border-[#2D2D45] font-mono text-xs text-left clip-badge-poly shadow-[0_0_15px_rgba(255,184,0,0.15)]">
              <div className="text-[10px] text-[#A1A1AA]">ACTIVE STREAK</div>
              <div className="text-[#FFB800] font-bold flex items-center gap-1">
                <Flame className={`w-3.5 h-3.5 ${streakDays > 0 ? 'text-[#FFB800] animate-bounce' : 'text-[#737373]'}`} />
                {streakDays} {streakDays === 1 ? 'DAY' : 'DAYS'}
              </div>
            </div>

            {/* Total Syntheses Real Count */}
            <div className="px-3 py-2 bg-black/70 border border-[#2D2D45] font-mono text-xs text-left clip-badge-poly shadow-[0_0_15px_rgba(168,85,247,0.15)]">
              <div className="text-[10px] text-[#A1A1AA]">TOTAL SYNTHESES</div>
              <div className="text-[#00F0FF] font-bold">{totalSyntheses.toLocaleString()}</div>
            </div>

            {/* Launch Prompt Button */}
            <button
              onClick={onNewReflection}
              className="px-5 py-3 bg-gradient-to-r from-[#00F0FF] via-[#A855F7] to-[#FF007A] hover:brightness-110 text-black font-mono font-bold text-xs tracking-wider clip-badge-poly shadow-[0_0_20px_rgba(0,240,255,0.4)] active:scale-95 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-black fill-black" />
              <span className="text-black font-extrabold">LAUNCH PROMPT</span>
            </button>

            {/* Top Right User Profile Trigger Button */}
            <button
              onClick={onOpenProfile}
              className="group p-1.5 bg-black/80 hover:bg-[#A855F7]/20 border border-[#2D2D45] hover:border-[#A855F7] text-[#A855F7] transition-all flex items-center space-x-2 cursor-pointer clip-badge-poly shadow-[0_0_15px_rgba(168,85,247,0.25)] active:translate-x-0.5 active:translate-y-0.5"
              title="Open Profile & Settings"
            >
              <div className="w-8 h-8 bg-[#141422] border border-[#A855F7]/80 group-hover:border-[#00F0FF] group-hover:bg-gradient-to-br group-hover:from-[#00F0FF] group-hover:to-[#A855F7] group-hover:text-black flex items-center justify-center font-mono font-bold text-xs text-[#00F0FF] transition-all clip-badge-poly">
                {userInitials}
              </div>
              <div className="hidden sm:flex flex-col text-left pr-2 font-mono">
                <span className="text-[11px] font-bold text-[#EDEDED] group-hover:text-[#00F0FF] leading-tight">
                  {user.displayName?.split(' ')[0] || 'Profile'}
                </span>
                <span className="text-[9px] text-[#A1A1AA] group-hover:text-[#A855F7] flex items-center gap-1">
                  <Settings className="w-2.5 h-2.5 text-[#A855F7]" /> Settings
                </span>
              </div>
            </button>
          </div>
        </div>
      </motion.div>

      {/* ========================================================================= */}
      {/* 2. VISUAL DATA CENTER: REAL DONUT SPLIT & REAL WEEKLY BAR OUTPUT           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* A. MULTIMODAL USAGE DONUT CHART */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 p-5 sm:p-6 bg-gradient-to-br from-[#0B0B14] via-[#07070E] to-[#030306] border border-[#2D2D45] clip-cyber-corner shadow-[0_0_30px_rgba(0,240,255,0.07)] flex flex-col justify-between"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#252538] pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 bg-[#00F0FF] clip-badge-poly" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#EDEDED]">
                01 // Multimodal Engine Distribution
              </h2>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-0.5 bg-black/80 text-[#00F0FF] border border-[#00F0FF]/40 clip-badge-poly shadow-[0_0_10px_rgba(0,240,255,0.25)]">
              REAL-TIME
            </span>
          </div>

          {/* Chart Content Area */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center my-2">
            
            {/* SVG Hollow Glowing Donut */}
            <div className="sm:col-span-6 flex flex-col items-center justify-center relative">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 180 180">
                  {/* Background Track */}
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    stroke={palette.track}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />

                  {/* Dynamic Segments based on real percentages */}
                  {totalSyntheses > 0 &&
                    usageMetrics.map((metric) => {
                      if (metric.percentage <= 0) return null;
                      const strokeDasharray = `${(metric.percentage / 100) * circumference} ${circumference}`;
                      const strokeDashoffset = -((cumulativePercentage / 100) * circumference);
                      cumulativePercentage += metric.percentage;

                      const isHovered = hoveredDonutSegment === metric.id;

                      return (
                        <motion.circle
                          key={metric.id}
                          cx="90"
                          cy="90"
                          r={radius}
                          stroke={metric.color}
                          strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          fill="transparent"
                          strokeLinecap="butt"
                          onMouseEnter={() => setHoveredDonutSegment(metric.id)}
                          onMouseLeave={() => setHoveredDonutSegment(null)}
                          onClick={() => onNavigate('chat', metric.id)}
                          initial={{ strokeDasharray: `0 ${circumference}` }}
                          animate={{ strokeDasharray }}
                          transition={{ duration: 1.2, ease: 'easeOut' }}
                          className="cursor-pointer transition-all duration-200"
                          style={{
                            filter: isHovered ? `drop-shadow(0 0 10px ${metric.color})` : `drop-shadow(0 0 4px ${metric.glow})`,
                          }}
                        />
                      );
                    })}
                </svg>

                {/* Hollow Center Telemetry Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[10px] font-mono text-[#A1A1AA] uppercase">
                    {hoveredDonutSegment
                      ? usageMetrics.find((m) => m.id === hoveredDonutSegment)?.badge
                      : totalSyntheses > 0
                      ? 'ALL MODALITIES'
                      : 'EMPTY LOGS'}
                  </span>
                  <span className="text-xl font-bold font-mono text-[#EDEDED] tracking-tight">
                    {hoveredDonutSegment
                      ? `${usageMetrics.find((m) => m.id === hoveredDonutSegment)?.percentage}%`
                      : totalSyntheses}
                  </span>
                  <span className="text-[9px] font-mono text-[#00F0FF]">
                    {hoveredDonutSegment
                      ? `${usageMetrics.find((m) => m.id === hoveredDonutSegment)?.latency}`
                      : totalSyntheses > 0
                      ? 'OPERATIONAL'
                      : 'READY'}
                  </span>
                </div>
              </div>
            </div>

            {/* Metric Breakdown Cards */}
            <div className="sm:col-span-6 space-y-2 font-mono text-xs">
              {usageMetrics.map((metric) => {
                const Icon = metric.icon;
                const isHovered = hoveredDonutSegment === metric.id;
                return (
                  <div
                    key={metric.id}
                    onMouseEnter={() => setHoveredDonutSegment(metric.id)}
                    onMouseLeave={() => setHoveredDonutSegment(null)}
                    onClick={() => onNavigate('chat', metric.id)}
                    className={`p-2.5 border transition-all cursor-pointer flex items-center justify-between clip-badge-poly ${
                      isHovered
                        ? 'bg-black/90 translate-x-1'
                        : 'bg-[#101018] hover:bg-[#161622]'
                    }`}
                    style={{
                      borderColor: isHovered ? metric.color : '#252538',
                      boxShadow: isHovered ? `0 0 12px ${metric.glow}` : 'none',
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-2 h-2 clip-badge-poly"
                        style={{ backgroundColor: metric.color, boxShadow: `0 0 6px ${metric.glow}` }}
                      />
                      <Icon className="w-3.5 h-3.5 text-[#A1A1AA]" />
                      <span className="text-[11px] font-bold text-[#EDEDED]">{metric.label}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[11px]">
                      <span className="text-[#737373]">{metric.count}</span>
                      <span className="font-bold" style={{ color: metric.color }}>
                        {metric.percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Footer Footnote */}
          <div className="pt-3 border-t border-[#252538] flex items-center justify-between text-[11px] font-mono text-[#737373]">
            <span>Click slice to launch neural mode</span>
            <span className="text-[#00F0FF] font-bold">100% User Data Authoritative</span>
          </div>
        </motion.div>

        {/* B. REAL OUTPUT BAR CHART */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 p-5 sm:p-6 bg-gradient-to-br from-[#0B0B14] via-[#07070E] to-[#030306] border border-[#2D2D45] clip-cyber-corner shadow-[0_0_30px_rgba(168,85,247,0.07)] flex flex-col justify-between"
        >
          {/* Header & Filter Toggle */}
          <div className="flex items-center justify-between border-b border-[#252538] pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 bg-[#A855F7] clip-badge-poly" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#EDEDED]">
                02 // Synthesis Activity Volume
              </h2>
            </div>
            
            {/* Filter Toggle */}
            <div className="flex bg-black/80 border border-[#2D2D45] p-0.5 font-mono text-[10px] clip-badge-poly">
              {(['7d', '14d', '30d'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-2.5 py-0.5 transition-all cursor-pointer clip-badge-poly ${
                    timeframe === t
                      ? 'bg-[#A855F7] text-black font-bold shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                      : 'text-[#737373] hover:text-[#EDEDED]'
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Minimalist Neo-Brutalist Bar Chart Area */}
          <div className="my-2 space-y-2">
            <div className="h-44 flex items-end justify-between gap-1.5 sm:gap-2 pt-6 px-2 border-b border-[#252538] relative">
              {/* Background horizontal grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-b border-dashed w-full" style={{ borderColor: palette.gridLine }} />
                <div className="border-b border-dashed w-full" style={{ borderColor: palette.gridLine }} />
                <div className="border-b border-dashed w-full" style={{ borderColor: palette.gridLine }} />
              </div>

              {weeklyOutputData.map((d, index) => {
                const heightPercent = d.count > 0 ? Math.max(14, (d.count / maxWeeklyCount) * 100) : 4;
                const isHovered = hoveredBarIndex === index;

                return (
                  <div
                    key={d.dateKey || index}
                    className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
                    onMouseEnter={() => setHoveredBarIndex(index)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                  >
                    {/* Tooltip Overlay */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute -top-12 z-30 px-2.5 py-1.5 bg-[#000000] border shadow-[0_0_15px_rgba(0,240,255,0.4)] text-[10px] font-mono text-[#EDEDED] whitespace-nowrap pointer-events-none clip-badge-poly"
                          style={{ borderColor: palette.barCurrent }}
                        >
                          <div className="font-bold" style={{ color: palette.barCurrent }}>{d.count} Syntheses</div>
                          <div className="text-[#737373] text-[9px]">~{d.tokens.toLocaleString()} tokens</div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Bar Pillar with Dynamic Multi-Hue Visuals & Chamfered Polygon */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent}%` }}
                      transition={{ duration: 0.6, delay: index * 0.03, ease: 'easeOut' }}
                      className="w-full max-w-[32px] transition-all duration-200 relative clip-badge-poly"
                      style={{
                        backgroundColor: d.count === 0
                          ? palette.track
                          : d.isCurrent
                          ? palette.barCurrent
                          : isHovered
                          ? palette.barHover
                          : palette.barDefault,
                        boxShadow: d.isCurrent
                          ? `0 0 16px ${palette.barGlow}`
                          : isHovered
                          ? `0 0 12px ${palette.barGlow}`
                          : 'none',
                        transform: isHovered ? 'translateY(-6px)' : 'none',
                      }}
                    >
                      {/* Top Glowing Cap */}
                      {d.count > 0 && (
                        <div
                          className="w-full h-1.5"
                          style={{
                            backgroundColor: d.isCurrent || isHovered ? '#FFFFFF' : palette.barCurrent,
                          }}
                        />
                      )}
                    </motion.div>

                    {/* X-Axis Label */}
                    <span
                      className="text-[9px] sm:text-[10px] font-mono mt-2 transition-colors truncate max-w-full text-center"
                      style={{
                        color: d.isCurrent ? palette.barCurrent : isHovered ? '#EDEDED' : '#737373',
                        fontWeight: d.isCurrent ? 'bold' : 'normal',
                      }}
                    >
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Stats */}
          <div className="pt-3 border-t border-[#252538] flex items-center justify-between text-[11px] font-mono text-[#737373]">
            <div className="flex items-center gap-1 text-[#A855F7]">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Real User Activity Logged</span>
            </div>
            <span>Period Total: {weeklyOutputData.reduce((a, b) => a + b.count, 0)} Tracker</span>
          </div>
        </motion.div>

      </div>

      {/* ========================================================================= */}
      {/* 3. ACTIVITY TRACKER (REAL 56-DAY SEQUENCE MATRIX WITH COLORFUL WEEKS)     */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="p-5 sm:p-6 bg-gradient-to-br from-[#0B0B14] via-[#07070E] to-[#030306] border border-[#2D2D45] clip-cyber-corner shadow-[0_0_30px_rgba(255,0,122,0.07)] text-left relative"
      >
        {/* Heatmap Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#252538] pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 bg-[#FF007A] clip-badge-poly" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#EDEDED]">
              03 // Colorful Week-Based Activity Matrix
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#737373]">
            <div className="flex items-center gap-1.5">
              <Flame className={`w-3.5 h-3.5 ${streakDays > 0 ? 'text-[#FFB800]' : 'text-[#737373]'}`} />
              <span>Current Streak: <strong className="text-[#FFB800]">{streakDays} {streakDays === 1 ? 'Day' : 'Days'}</strong></span>
            </div>
            <span className="text-[#333333]">|</span>
            <div className="flex items-center space-x-1 text-[10px]">
              <span className="text-[#A1A1AA] mr-1">Intensity:</span>
              <span className="w-3 h-3 bg-[#141422] border border-[#2D2D45] inline-block clip-badge-poly" title="0 events" />
              <span className="w-3 h-3 bg-[#00F0FF]/30 border border-[#00F0FF]/50 inline-block clip-badge-poly" title="1-2 events" />
              <span className="w-3 h-3 bg-[#00F0FF]/60 border border-[#00F0FF]/80 inline-block clip-badge-poly" title="3-4 events" />
              <span className="w-3 h-3 bg-[#00F0FF] border border-[#67E8F9] inline-block shadow-[0_0_6px_#00F0FF] clip-badge-poly" title="5-7 events" />
              <span className="w-3 h-3 bg-[#FF007A] border border-[#FDA4AF] inline-block shadow-[0_0_8px_#FF007A] clip-badge-poly" title="8+ events" />
            </div>
          </div>
        </div>

        {/* Interactive Day-of-Week Filters (Non-Rectangular Polygon Pills) */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4 font-mono text-[10px]">
          <span className="text-[#737373] text-[11px] mr-1">Filter Matrix:</span>
          
          <button
            onClick={() => setSelectedDayFilter(null)}
            className={`px-2.5 py-1 clip-badge-poly font-bold transition-all cursor-pointer ${
              selectedDayFilter === null
                ? 'bg-gradient-to-r from-[#00F0FF] to-[#A855F7] text-black shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                : 'bg-black/60 border border-[#2D2D45] text-[#A1A1AA] hover:text-[#EDEDED] hover:border-[#737373]'
            }`}
          >
            ALL 7 DAYS (56D)
          </button>

          {[1, 2, 3, 4, 5, 6, 0].map((dayNum) => {
            const config = DAY_OF_WEEK_CONFIG[dayNum];
            const isSelected = selectedDayFilter === dayNum;
            const dayColor = currentTheme === 'white' ? config.lightColor : currentTheme === 'mix' ? config.mixColor : config.darkColor;

            return (
              <button
                key={dayNum}
                onClick={() => setSelectedDayFilter(isSelected ? null : dayNum)}
                className="px-2 py-1 clip-badge-poly font-bold transition-all flex items-center gap-1 cursor-pointer"
                style={{
                  backgroundColor: isSelected ? dayColor : 'rgba(0,0,0,0.5)',
                  color: isSelected ? '#000000' : '#EDEDED',
                  border: `1px solid ${isSelected ? dayColor : 'rgba(45,45,69,0.8)'}`,
                  boxShadow: isSelected ? `0 0 10px ${config.glow}` : 'none',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: isSelected ? '#000000' : dayColor }}
                />
                <span>{config.short}</span>
              </button>
            );
          })}
        </div>

        {/* Heatmap Matrix Grid with Colorful 7-Day Spectrum */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[640px] flex items-start gap-1.5">
            {/* Days of Week Labels with their unique vibrant colors */}
            <div className="grid grid-rows-7 gap-1.5 pr-2 font-mono text-[9px] font-bold">
              {[1, 2, 3, 4, 5, 6, 0].map((dayNum) => {
                const config = DAY_OF_WEEK_CONFIG[dayNum];
                const dayColor = currentTheme === 'white' ? config.lightColor : currentTheme === 'mix' ? config.mixColor : config.darkColor;
                const isHighlighted = selectedDayFilter === null || selectedDayFilter === dayNum;

                return (
                  <div
                    key={dayNum}
                    onClick={() => setSelectedDayFilter(selectedDayFilter === dayNum ? null : dayNum)}
                    className={`h-[18px] flex items-center transition-all cursor-pointer ${
                      isHighlighted ? 'opacity-100' : 'opacity-30'
                    }`}
                    style={{ color: dayColor }}
                  >
                    <span>{config.short}</span>
                  </div>
                );
              })}
            </div>

            {/* Grid Columns (8 Weeks = 56 Days) */}
            <div className="flex-1 grid grid-flow-col grid-rows-7 gap-1.5">
              {heatmapGrid.map((node) => {
                const config = DAY_OF_WEEK_CONFIG[node.dayOfWeek] || DAY_OF_WEEK_CONFIG[1];
                const dayColor = currentTheme === 'white' ? config.lightColor : currentTheme === 'mix' ? config.mixColor : config.darkColor;
                const isFilteredOut = selectedDayFilter !== null && selectedDayFilter !== node.dayOfWeek;

                let cellBg = 'rgba(20, 20, 34, 0.8)';
                let cellBorder = 'rgba(45, 45, 69, 0.8)';
                let cellGlow = 'none';

                if (node.level === 1) {
                  cellBg = `${dayColor}25`;
                  cellBorder = `${dayColor}60`;
                } else if (node.level === 2) {
                  cellBg = `${dayColor}55`;
                  cellBorder = `${dayColor}90`;
                } else if (node.level === 3) {
                  cellBg = `${dayColor}AA`;
                  cellBorder = dayColor;
                  cellGlow = `0 0 8px ${config.glow}`;
                } else if (node.level === 4) {
                  cellBg = dayColor;
                  cellBorder = '#FFFFFF';
                  cellGlow = `0 0 12px ${config.glow}`;
                }

                return (
                  <motion.div
                    key={node.dateStr}
                    whileHover={{ scale: 1.3, zIndex: 20 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setInspectedDay(node)}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredHeatmapDay({
                        day: node,
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      });
                    }}
                    onMouseLeave={() => setHoveredHeatmapDay(null)}
                    style={{
                      backgroundColor: isFilteredOut ? 'rgba(10, 10, 15, 0.4)' : cellBg,
                      borderColor: isFilteredOut ? 'rgba(30, 30, 45, 0.3)' : cellBorder,
                      boxShadow: isFilteredOut ? 'none' : cellGlow,
                      opacity: isFilteredOut ? 0.2 : 1,
                    }}
                    className="w-full aspect-square min-w-[16px] min-h-[16px] border hover:border-[#FFFFFF] transition-all duration-150 cursor-pointer clip-badge-poly relative group"
                  >
                    {node.count > 0 && !isFilteredOut && (
                      <span className="absolute inset-0 flex items-center justify-center text-[7px] font-mono font-extrabold text-black opacity-0 group-hover:opacity-100">
                        {node.count}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Floating Tooltip for Heatmap */}
        <AnimatePresence>
          {hoveredHeatmapDay && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              className="fixed z-50 px-3 py-2 bg-black/95 border border-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.5)] text-xs font-mono text-[#EDEDED] pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-2 clip-badge-poly"
              style={{
                left: hoveredHeatmapDay.x,
                top: hoveredHeatmapDay.y,
              }}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: DAY_OF_WEEK_CONFIG[hoveredHeatmapDay.day.dayOfWeek]?.darkColor || '#00F0FF',
                  }}
                />
                <span className="font-bold text-[#00F0FF]">
                  {hoveredHeatmapDay.day.count} {hoveredHeatmapDay.day.count === 1 ? 'Synthesis' : 'Syntheses'}
                </span>
              </div>
              <div className="text-[10px] text-[#A1A1AA]">
                {hoveredHeatmapDay.day.formattedDate}
              </div>
              <div className="text-[9px] text-[#FF007A] mt-0.5">
                Click node to inspect day logs &gt;
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detailed Day Drill-Down Inspector Modal / Drawer */}
        <AnimatePresence>
          {inspectedDay && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-lg bg-[#0D0D18] border border-[#00F0FF]/60 clip-cyber-card shadow-[0_0_40px_rgba(0,240,255,0.25)] p-6 relative text-left space-y-4 max-h-[85vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-[#252538] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 clip-badge-poly"
                        style={{
                          backgroundColor: DAY_OF_WEEK_CONFIG[inspectedDay.dayOfWeek]?.darkColor || '#00F0FF',
                          boxShadow: `0 0 10px ${DAY_OF_WEEK_CONFIG[inspectedDay.dayOfWeek]?.glow}`,
                        }}
                      />
                      <h3 className="text-base font-bold text-[#EDEDED] font-display">
                        {inspectedDay.formattedDate}
                      </h3>
                    </div>
                    <p className="text-xs font-mono text-[#A1A1AA] mt-0.5">
                      Day Activity Breakdown // {DAY_OF_WEEK_CONFIG[inspectedDay.dayOfWeek]?.name}
                    </p>
                  </div>

                  <button
                    onClick={() => setInspectedDay(null)}
                    className="p-1.5 bg-black/60 border border-[#2D2D45] hover:border-[#FF007A] text-[#A1A1AA] hover:text-[#FF007A] clip-badge-poly transition-colors cursor-pointer text-xs font-mono"
                  >
                    CLOSE [X]
                  </button>
                </div>

                {/* Day Summary Stats */}
                <div className="grid grid-cols-3 gap-2 font-mono text-center">
                  <div className="p-2.5 bg-black/50 border border-[#2D2D45] clip-badge-poly">
                    <span className="text-[10px] text-[#A1A1AA] block">TOTAL EVENTS</span>
                    <span className="text-sm font-bold text-[#00F0FF]">{inspectedDay.count}</span>
                  </div>
                  <div className="p-2.5 bg-black/50 border border-[#2D2D45] clip-badge-poly">
                    <span className="text-[10px] text-[#A1A1AA] block">TOKENS PROCESSED</span>
                    <span className="text-sm font-bold text-[#A855F7]">
                      {inspectedDay.events.reduce((acc, ev) => acc + ev.tokens, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 bg-black/50 border border-[#2D2D45] clip-badge-poly">
                    <span className="text-[10px] text-[#A1A1AA] block">ACTIVITY LEVEL</span>
                    <span className="text-sm font-bold text-[#FFB800]">
                      {inspectedDay.level === 0 ? 'QUIET' : inspectedDay.level === 4 ? 'MAX' : `LVL ${inspectedDay.level}`}
                    </span>
                  </div>
                </div>

                {/* Events List or Empty State */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold text-[#EDEDED] uppercase tracking-wider">
                    Logged Interactions ({inspectedDay.events.length})
                  </h4>

                  {inspectedDay.events.length === 0 ? (
                    <div className="p-4 bg-black/40 border border-dashed border-[#2D2D45] clip-badge-poly text-center space-y-2">
                      <p className="text-xs text-[#737373] font-mono">
                        No telemetry recorded on this date.
                      </p>
                      <button
                        onClick={() => {
                          setInspectedDay(null);
                          onNewReflection();
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-[#00F0FF] to-[#A855F7] text-black font-mono font-bold text-xs clip-badge-poly cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                      >
                        Start Synthesis Now
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {inspectedDay.events.map((ev, idx) => {
                        const timeStr = new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return (
                          <div
                            key={idx}
                            className="p-2.5 bg-black/60 border border-[#2D2D45] hover:border-[#00F0FF]/60 clip-badge-poly flex items-center justify-between text-xs font-mono transition-colors"
                          >
                            <div className="flex items-center space-x-2.5">
                              <span
                                className="px-2 py-0.5 text-[9px] font-bold clip-badge-poly"
                                style={{
                                  backgroundColor: ev.mode === 'text' ? 'rgba(0,240,255,0.2)' : ev.mode === 'image' ? 'rgba(168,85,247,0.2)' : ev.mode === 'video' ? 'rgba(255,0,122,0.2)' : 'rgba(255,184,0,0.2)',
                                  color: ev.mode === 'text' ? '#00F0FF' : ev.mode === 'image' ? '#A855F7' : ev.mode === 'video' ? '#FF007A' : '#FFB800',
                                }}
                              >
                                {ev.mode.toUpperCase()}
                              </span>
                              <span className="text-[#EDEDED]">{ev.preview || 'Synthesis Operation'}</span>
                            </div>
                            <div className="text-right text-[#737373] text-[10px]">
                              <span>{timeStr}</span>
                              <span className="block text-[#A855F7]">{ev.tokens} tok</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-[#252538] flex items-center justify-between">
                  <button
                    onClick={() => {
                      setInspectedDay(null);
                      onNavigate('chat', 'text');
                    }}
                    className="px-4 py-2 bg-[#00F0FF] hover:bg-[#67E8F9] text-black font-mono font-bold text-xs clip-badge-poly cursor-pointer flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(0,240,255,0.3)]"
                  >
                    <span>Launch Chat Companion</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setInspectedDay(null)}
                    className="px-3 py-2 bg-transparent text-[#737373] hover:text-[#EDEDED] font-mono text-xs cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Footnote */}
        <div className="pt-3 mt-3 border-t border-[#252538] flex items-center justify-between text-[11px] font-mono text-[#737373]">
          <span>Synced with your actual Firestore records (56-Day Window)</span>
          <span className="text-[#EDEDED]">
            Total Tracker: <strong className="text-[#00F0FF]">{allEvents.length}</strong>
          </span>
        </div>
      </motion.div>

      {/* ========================================================================= */}
      {/* 4. MODULAR COGNITIVE TOOL SELECTORS (4 HYPER-MODERN GEOMETRIC CARDS)     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: AI Chat (Electric Cyan Engine) */}
        <div
          onClick={() => onNavigate('chat', 'text')}
          className="p-5 bg-gradient-to-br from-[#0C1222] via-[#080B14] to-[#04060A] border border-[#00F0FF]/30 hover:border-[#00F0FF] hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] transition-all duration-300 clip-cyber-card group cursor-pointer flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-black/80 border border-[#00F0FF]/60 text-[#00F0FF] group-hover:bg-[#00F0FF] group-hover:text-black transition-all clip-badge-poly shadow-[0_0_12px_rgba(0,240,255,0.3)]">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono text-[#00F0FF]/80 group-hover:text-[#00F0FF] px-2 py-0.5 bg-black/60 clip-badge-poly border border-[#00F0FF]/20">01 // REASONING</span>
            </div>
            <h3 className="text-base font-bold text-[#EDEDED] font-display mb-1 group-hover:text-[#00F0FF] transition-colors">
              AI Reasoning Engine
            </h3>
            <p className="text-xs text-[#A1A1AA] font-sans leading-relaxed">
              Multi-turn reasoning, mathematical proofing, architecture diagrams, and syntax processing.
            </p>
          </div>
          <div className="pt-4 flex items-center justify-between text-[11px] font-mono text-[#737373] group-hover:text-[#00F0FF]">
            <span>Launch Engine</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform text-[#00F0FF]" />
          </div>
        </div>

        {/* Card 2: Image Generation (Ultraviolet Purple Engine) */}
        <div
          onClick={() => onNavigate('chat', 'image')}
          className="p-5 bg-gradient-to-br from-[#1A0B2E] via-[#0F071C] to-[#06030A] border border-[#A855F7]/30 hover:border-[#A855F7] hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-300 clip-cyber-card group cursor-pointer flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#A855F7] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-black/80 border border-[#A855F7]/60 text-[#A855F7] group-hover:bg-[#A855F7] group-hover:text-black transition-all clip-badge-poly shadow-[0_0_12px_rgba(168,85,247,0.3)]">
                <ImageIcon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono text-[#A855F7]/80 group-hover:text-[#A855F7] px-2 py-0.5 bg-black/60 clip-badge-poly border border-[#A855F7]/20">02 // VISUALS</span>
            </div>
            <h3 className="text-base font-bold text-[#EDEDED] font-display mb-1 group-hover:text-[#A855F7] transition-colors">
              Photoreal & Vector Suite
            </h3>
            <p className="text-xs text-[#A1A1AA] font-sans leading-relaxed">
              Cinematic 1K photorealism and crisp vector SVG generation with true lighting and optics.
            </p>
          </div>
          <div className="pt-4 flex items-center justify-between text-[11px] font-mono text-[#737373] group-hover:text-[#A855F7]">
            <span>Launch Engine</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform text-[#A855F7]" />
          </div>
        </div>

        {/* Card 3: Video Generator (Neon Hot Magenta Engine) */}
        <div
          onClick={() => onNavigate('chat', 'video')}
          className="p-5 bg-gradient-to-br from-[#240B1A] via-[#14060F] to-[#080206] border border-[#FF007A]/30 hover:border-[#FF007A] hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(255,0,122,0.4)] transition-all duration-300 clip-cyber-card group cursor-pointer flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF007A] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-black/80 border border-[#FF007A]/60 text-[#FF007A] group-hover:bg-[#FF007A] group-hover:text-black transition-all clip-badge-poly shadow-[0_0_12px_rgba(255,0,122,0.3)]">
                <Film className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono text-[#FF007A]/80 group-hover:text-[#FF007A] px-2 py-0.5 bg-black/60 clip-badge-poly border border-[#FF007A]/20">03 // MOTION</span>
            </div>
            <h3 className="text-base font-bold text-[#EDEDED] font-display mb-1 group-hover:text-[#FF007A] transition-colors">
              60FPS Motion Simulator
            </h3>
            <p className="text-xs text-[#A1A1AA] font-sans leading-relaxed">
              60FPS motion keyframing, camera tracking, and procedural scene storyboard animation engine.
            </p>
          </div>
          <div className="pt-4 flex items-center justify-between text-[11px] font-mono text-[#737373] group-hover:text-[#FF007A]">
            <span>Launch Engine</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform text-[#FF007A]" />
          </div>
        </div>

        {/* Card 4: Music Generator (Electric Amber Gold Engine) */}
        <div
          onClick={() => onNavigate('chat', 'music')}
          className="p-5 bg-gradient-to-br from-[#241A0B] via-[#140E06] to-[#080502] border border-[#FFB800]/30 hover:border-[#FFB800] hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(255,184,0,0.4)] transition-all duration-300 clip-cyber-card group cursor-pointer flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FFB800] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-black/80 border border-[#FFB800]/60 text-[#FFB800] group-hover:bg-[#FFB800] group-hover:text-black transition-all clip-badge-poly shadow-[0_0_12px_rgba(255,184,0,0.3)]">
                <Music className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono text-[#FFB800]/80 group-hover:text-[#FFB800] px-2 py-0.5 bg-black/60 clip-badge-poly border border-[#FFB800]/20">04 // AUDIO</span>
            </div>
            <h3 className="text-base font-bold text-[#EDEDED] font-display mb-1 group-hover:text-[#FFB800] transition-colors">
              Harmonic Soundscapes
            </h3>
            <p className="text-xs text-[#A1A1AA] font-sans leading-relaxed">
              432Hz harmonic acoustic modeling, procedural synthesizer frequencies, and binaural focus sound.
            </p>
          </div>
          <div className="pt-4 flex items-center justify-between text-[11px] font-mono text-[#737373] group-hover:text-[#FFB800]">
            <span>Launch Engine</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform text-[#FFB800]" />
          </div>
        </div>

      </div>

      {/* Persistent Technical Footer */}
      <div className="pt-4 border-t border-[#252538] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-[#737373]">
        <div className="flex items-center space-x-2">
          <span className="text-[#00F0FF]">SOMOTOZ AI SUITE</span>
          <span>•</span>
          <span className="text-[#A855F7]">GEMINI MULTIMODAL</span>
          <span>•</span>
          <span className="text-[#FF007A]">CLOUD FIRESTORE</span>
        </div>
        <div className="flex items-center space-x-2 text-[#EDEDED]">
          <span>ENGINEERED WITH PASSION BY</span>
          <strong className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#A855F7] to-[#FF007A] underline decoration-[#00F0FF]/40 underline-offset-2">
            SOM MAURYA
          </strong>
          <span className="text-[#737373]">(DATA SCIENCE & COMPUTATIONAL THINKING)</span>
        </div>
      </div>

    </div>
  );
};
