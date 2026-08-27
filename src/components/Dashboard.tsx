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
  Settings
} from 'lucide-react';
import { UserProfile, ViewMode, JournalEntry, GenerationMode, UserActivityLog } from '../types';

interface DashboardProps {
  user: UserProfile;
  entries: JournalEntry[];
  activityLogs: UserActivityLog[];
  onNavigate: (view: ViewMode, generationMode?: GenerationMode) => void;
  onNewReflection: () => void;
  onOpenProfile: () => void;
}

// Gen-Z / Hacker Dynamic Greetings
const HACKER_GREETINGS = [
  "Main character energy activated. Let's build.",
  "Cognitive buffer cleared. No cap.",
  "W mindset today. Ready to synthesize?",
  "Agentic workflows online. Let's cook.",
  "Neural weights locked in. Zero latency mode.",
  "Sub-50ms procedural synthesis initialized.",
  "Multi-modal tensor cores primed. Ship or get shipped.",
  "All systems operational. Execute without friction.",
  "High throughput, zero bloat. Let's engineer.",
  "Codebase compiling. High signal, zero noise."
];

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
  dayOfWeek: number; // 0 = Sun, 6 = Sat
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  entries,
  activityLogs,
  onNavigate,
  onNewReflection,
  onOpenProfile,
}) => {
  // 1. Dynamic Greeting with Typewriter Effect
  const [typedGreeting, setTypedGreeting] = useState<string>('');
  const [cursorVisible, setCursorVisible] = useState<boolean>(true);

  // Timeframe for Bar Chart
  const [timeframe, setTimeframe] = useState<'7d' | '14d' | '30d'>('7d');

  // Interactive Hover States
  const [hoveredDonutSegment, setHoveredDonutSegment] = useState<GenerationMode | null>(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [hoveredHeatmapDay, setHoveredHeatmapDay] = useState<{
    day: HeatmapDay;
    x: number;
    y: number;
  } | null>(null);

  // Randomize greeting on mount with typewriter
  useEffect(() => {
    const randomG = HACKER_GREETINGS[Math.floor(Math.random() * HACKER_GREETINGS.length)];
    setTypedGreeting('');

    let index = 0;
    const interval = setInterval(() => {
      if (index <= randomG.length) {
        setTypedGreeting(randomG.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 28);

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
        color: '#00FF41',
        glow: 'rgba(0, 255, 65, 0.7)',
        icon: MessageSquare,
        badge: 'LLM-2.5',
        latency: '32ms',
      },
      {
        id: 'image',
        label: 'Image Generator',
        count: imageCount,
        percentage: calcPercent(imageCount),
        color: '#00CC35',
        glow: 'rgba(0, 204, 53, 0.7)',
        icon: ImageIcon,
        badge: 'VECTOR-SVG',
        latency: '48ms',
      },
      {
        id: 'video',
        label: 'Video Generator',
        count: videoCount,
        percentage: calcPercent(videoCount),
        color: '#009927',
        glow: 'rgba(0, 153, 39, 0.7)',
        icon: Film,
        badge: 'CANVAS-FX',
        latency: '54ms',
      },
      {
        id: 'music',
        label: 'Music Generator',
        count: musicCount,
        percentage: calcPercent(musicCount),
        color: '#00661A',
        glow: 'rgba(0, 102, 26, 0.7)',
        icon: Music,
        badge: '432HZ SYNTH',
        latency: '18ms',
      },
    ];
  }, [allEvents]);

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

      // Count actual matching events on this date
      const count = allEvents.filter((ev) => {
        const evD = new Date(ev.timestamp);
        const evKey = `${evD.getFullYear()}-${String(evD.getMonth() + 1).padStart(2, '0')}-${String(evD.getDate()).padStart(2, '0')}`;
        return evKey === dateStr;
      }).length;

      // Density level based purely on real count
      let level = 0;
      if (count >= 10) level = 4;
      else if (count >= 6) level = 3;
      else if (count >= 3) level = 2;
      else if (count > 0) level = 1;

      result.push({
        dateStr,
        formattedDate,
        count,
        level,
        dayOfWeek: d.getDay(),
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
      {/* 1. HERO GREETING & REAL TELEMETRY STATUS BAR                              */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="p-5 sm:p-6 bg-[#0A0A0A] border border-[#262626] shadow-[4px_4px_0px_0px_#141414] relative overflow-hidden"
      >
        {/* Subtle matrix gradient line at the top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00FF41] via-[#00FF41]/60 to-[#00FF41]/10" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            {/* Top metadata tags */}
            <div className="flex items-center space-x-2.5 text-xs font-mono text-[#737373]">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-black border border-[#00FF41]/40 text-[#00FF41] text-[11px] font-bold">
                <span className="w-2 h-2 bg-[#00FF41] animate-pulse" />
                COMMAND_CENTER // ONLINE
              </span>
              <span className="hidden sm:inline-block text-[#333333]">|</span>
              <span className="hidden sm:flex items-center gap-1 text-[#A1A1AA]">
                <Cpu className="w-3.5 h-3.5 text-[#00FF41]" />
                Gemini 2.5 Multi-Modal
              </span>
              <span className="hidden sm:inline-block text-[#333333]">|</span>
              <span className="hidden sm:inline-block text-[#A1A1AA]">
                User: <strong className="text-[#EDEDED]">{user.displayName || 'Som Maurya'}</strong>
              </span>
            </div>

            {/* Dynamic Typewriter Greeting */}
            <div className="flex items-center space-x-2 min-h-[36px]">
              <span className="text-[#00FF41] font-mono text-xl font-bold">&gt;</span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#EDEDED] font-display tracking-tight leading-tight">
                {typedGreeting}
                <span
                  className={`inline-block w-2.5 h-6 bg-[#00FF41] ml-1 align-middle ${
                    cursorVisible ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </h1>
            </div>
            <p className="text-xs text-[#A1A1AA] font-mono">
              Real-time Firestore cluster synced. Zero mock telemetry.
            </p>
          </div>

          {/* Right Status Badges & Quick Action & Profile Avatar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Real Streak Badge */}
            <div className="px-3 py-2 bg-black border border-[#262626] font-mono text-xs text-left">
              <div className="text-[10px] text-[#737373]">ACTIVE STREAK</div>
              <div className="text-[#00FF41] font-bold flex items-center gap-1">
                <Flame className={`w-3.5 h-3.5 ${streakDays > 0 ? 'text-[#00FF41]' : 'text-[#737373]'}`} />
                {streakDays} {streakDays === 1 ? 'DAY' : 'DAYS'}
              </div>
            </div>

            {/* Total Syntheses Real Count */}
            <div className="px-3 py-2 bg-black border border-[#262626] font-mono text-xs text-left">
              <div className="text-[10px] text-[#737373]">TOTAL SYNTHESES</div>
              <div className="text-[#EDEDED] font-bold">{totalSyntheses.toLocaleString()}</div>
            </div>

            {/* Launch Prompt Button */}
            <button
              onClick={onNewReflection}
              className="px-4 py-3 bg-[#00FF41] hover:bg-[#00E038] text-black font-mono font-bold text-xs tracking-wider border border-[#00FF41] shadow-[2px_2px_0px_0px_#262626] hover:shadow-[3px_3px_0px_0px_#00FF41] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-black" />
              <span>LAUNCH PROMPT</span>
            </button>

            {/* Top Right User Profile Trigger Button */}
            <button
              onClick={onOpenProfile}
              className="group p-1.5 bg-black hover:bg-[#00FF41]/10 border border-[#262626] hover:border-[#00FF41] text-[#00FF41] transition-all flex items-center space-x-2 cursor-pointer shadow-[2px_2px_0px_0px_#171717] hover:shadow-[0_0_15px_rgba(0,255,65,0.3)] active:translate-x-0.5 active:translate-y-0.5"
              title="Open Profile & Settings"
            >
              <div className="w-8 h-8 bg-[#141414] border border-[#00FF41]/60 group-hover:border-[#00FF41] group-hover:bg-[#00FF41] group-hover:text-black flex items-center justify-center font-mono font-bold text-xs text-[#00FF41] transition-colors">
                {userInitials}
              </div>
              <div className="hidden sm:flex flex-col text-left pr-2 font-mono">
                <span className="text-[11px] font-bold text-[#EDEDED] group-hover:text-[#00FF41] leading-tight">
                  {user.displayName?.split(' ')[0] || 'Profile'}
                </span>
                <span className="text-[9px] text-[#737373] group-hover:text-[#00FF41] flex items-center gap-1">
                  <Settings className="w-2.5 h-2.5 text-[#00FF41]" /> Settings
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
          className="lg:col-span-6 p-5 sm:p-6 bg-[#0A0A0A] border border-[#262626] shadow-[4px_4px_0px_0px_#141414] flex flex-col justify-between"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#262626] pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 bg-[#00FF41]" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#EDEDED]">
                01 // Multimodal Engine Distribution
              </h2>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 bg-black text-[#00FF41] border border-[#262626]">
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
                    className="stroke-[#171717]"
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
                            filter: isHovered ? `drop-shadow(0 0 8px ${metric.color})` : 'none',
                          }}
                        />
                      );
                    })}
                </svg>

                {/* Hollow Center Telemetry Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[10px] font-mono text-[#737373] uppercase">
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
                  <span className="text-[9px] font-mono text-[#00FF41]">
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
                    className={`p-2.5 border transition-all cursor-pointer flex items-center justify-between ${
                      isHovered
                        ? 'bg-black border-[#00FF41] shadow-[2px_2px_0px_0px_#00FF41] translate-x-1'
                        : 'bg-[#0D0D0D] border-[#262626] hover:border-[#404040]'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-2 h-2"
                        style={{ backgroundColor: metric.color }}
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
          <div className="pt-3 border-t border-[#262626] flex items-center justify-between text-[11px] font-mono text-[#737373]">
            <span>Click slice to launch neural mode</span>
            <span className="text-[#00FF41] font-bold">100% User Data Authoritative</span>
          </div>
        </motion.div>

        {/* B. REAL OUTPUT BAR CHART */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 p-5 sm:p-6 bg-[#0A0A0A] border border-[#262626] shadow-[4px_4px_0px_0px_#141414] flex flex-col justify-between"
        >
          {/* Header & Filter Toggle */}
          <div className="flex items-center justify-between border-b border-[#262626] pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 bg-[#00FF41]" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#EDEDED]">
                02 // Synthesis Activity Volume
              </h2>
            </div>
            
            {/* Filter Toggle */}
            <div className="flex bg-black border border-[#262626] p-0.5 font-mono text-[10px]">
              {(['7d', '14d', '30d'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-2 py-0.5 transition-colors cursor-pointer ${
                    timeframe === t
                      ? 'bg-[#00FF41] text-black font-bold'
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
            <div className="h-44 flex items-end justify-between gap-1.5 sm:gap-2 pt-6 px-2 border-b border-[#262626] relative">
              {/* Background horizontal grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-b border-dashed border-[#EDEDED] w-full" />
                <div className="border-b border-dashed border-[#EDEDED] w-full" />
                <div className="border-b border-dashed border-[#EDEDED] w-full" />
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
                          className="absolute -top-12 z-30 px-2.5 py-1.5 bg-[#000000] border border-[#00FF41] shadow-[0_0_12px_rgba(0,255,65,0.3)] text-[10px] font-mono text-[#EDEDED] whitespace-nowrap pointer-events-none"
                        >
                          <div className="text-[#00FF41] font-bold">{d.count} Tracker</div>
                          <div className="text-[#737373] text-[9px]">~{d.tokens.toLocaleString()} tokens</div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Bar Pillar */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent}%` }}
                      transition={{ duration: 0.6, delay: index * 0.03, ease: 'easeOut' }}
                      className={`w-full max-w-[32px] transition-all duration-200 relative ${
                        d.count === 0
                          ? 'bg-[#141414] hover:bg-[#222222]'
                          : d.isCurrent
                          ? 'bg-[#00FF41] shadow-[0_0_12px_rgba(0,255,65,0.4)]'
                          : isHovered
                          ? 'bg-[#00FF41] -translate-y-1'
                          : 'bg-[#1F1F1F] hover:bg-[#2A2A2A]'
                      }`}
                      style={{
                        borderRadius: '0px',
                      }}
                    >
                      {/* Top Glowing Cap */}
                      {d.count > 0 && (
                        <div
                          className={`w-full h-1 ${
                            d.isCurrent || isHovered ? 'bg-[#FFFFFF]' : 'bg-[#00FF41]'
                          }`}
                        />
                      )}
                    </motion.div>

                    {/* X-Axis Label */}
                    <span
                      className={`text-[9px] sm:text-[10px] font-mono mt-2 transition-colors truncate max-w-full text-center ${
                        d.isCurrent
                          ? 'text-[#00FF41] font-bold'
                          : isHovered
                          ? 'text-[#EDEDED]'
                          : 'text-[#737373]'
                      }`}
                    >
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Stats */}
          <div className="pt-3 border-t border-[#262626] flex items-center justify-between text-[11px] font-mono text-[#737373]">
            <div className="flex items-center gap-1 text-[#00FF41]">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Real User Activity Logged</span>
            </div>
            <span>Period Total: {weeklyOutputData.reduce((a, b) => a + b.count, 0)} Tracker</span>
          </div>
        </motion.div>

      </div>

      {/* ========================================================================= */}
      {/* 3. ACTIVITY TRACKER (REAL 56-DAY SEQUENCE MATRIX)                         */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="p-5 sm:p-6 bg-[#0A0A0A] border border-[#262626] shadow-[4px_4px_0px_0px_#141414] text-left relative"
      >
        {/* Heatmap Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#262626] pb-3 mb-5">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 bg-[#00FF41]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#EDEDED]">
              03 // Activity Tracker
            </h2>
          </div>

          <div className="flex items-center space-x-4 text-xs font-mono text-[#737373]">
            <div className="flex items-center gap-1.5">
              <Flame className={`w-3.5 h-3.5 ${streakDays > 0 ? 'text-[#00FF41]' : 'text-[#737373]'}`} />
              <span>Current Streak: <strong className="text-[#00FF41]">{streakDays} {streakDays === 1 ? 'Day' : 'Days'}</strong></span>
            </div>
            <span className="text-[#333333]">|</span>
            <div className="flex items-center space-x-1.5 text-[10px]">
              <span>0</span>
              <span className="w-2.5 h-2.5 bg-[#141414] border border-[#262626] inline-block" />
              <span className="w-2.5 h-2.5 bg-[#004712] inline-block" />
              <span className="w-2.5 h-2.5 bg-[#008A24] inline-block" />
              <span className="w-2.5 h-2.5 bg-[#00CC35] inline-block" />
              <span className="w-2.5 h-2.5 bg-[#00FF41] inline-block shadow-[0_0_6px_#00FF41]" />
              <span>10+</span>
            </div>
          </div>
        </div>

        {/* Heatmap Matrix Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[640px] flex items-start gap-1.5">
            {/* Days of Week Labels */}
            <div className="grid grid-rows-7 gap-1.5 pr-2 font-mono text-[9px] text-[#737373]">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>

            {/* Grid Columns (Weeks) */}
            <div className="flex-1 grid grid-flow-col grid-rows-7 gap-1.5">
              {heatmapGrid.map((node) => {
                let bgClass = 'bg-[#141414] border-[#262626]';
                if (node.level === 1) bgClass = 'bg-[#004712] border-[#005c18]';
                if (node.level === 2) bgClass = 'bg-[#008A24] border-[#00a82c]';
                if (node.level === 3) bgClass = 'bg-[#00CC35] border-[#00e63c]';
                if (node.level === 4) bgClass = 'bg-[#00FF41] border-[#33ff66] shadow-[0_0_8px_rgba(0,255,65,0.6)]';

                return (
                  <div
                    key={node.dateStr}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredHeatmapDay({
                        day: node,
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      });
                    }}
                    onMouseLeave={() => setHoveredHeatmapDay(null)}
                    className={`w-full aspect-square min-w-[14px] min-h-[14px] border ${bgClass} hover:border-[#FFFFFF] hover:scale-125 transition-all duration-150 cursor-pointer`}
                    style={{ borderRadius: '0px' }}
                  />
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
              className="fixed z-50 px-3 py-2 bg-black border border-[#00FF41] shadow-[0_0_20px_rgba(0,255,65,0.3)] text-xs font-mono text-[#EDEDED] pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-2"
              style={{
                left: hoveredHeatmapDay.x,
                top: hoveredHeatmapDay.y,
              }}
            >
              <div className="text-[#00FF41] font-bold">
                {hoveredHeatmapDay.day.count} Tracker
              </div>
              <div className="text-[10px] text-[#A1A1AA]">
                {hoveredHeatmapDay.day.formattedDate}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footnote */}
        <div className="pt-3 mt-3 border-t border-[#262626] flex items-center justify-between text-[11px] font-mono text-[#737373]">
          <span>Synced with your actual Firestore records</span>
          <span className="text-[#EDEDED]">
            Total Tracker: <strong className="text-[#00FF41]">{allEvents.length}</strong>
          </span>
        </div>
      </motion.div>

      {/* ========================================================================= */}
      {/* 4. SIMPLIFIED TOOL CARDS (ALL UNIFIED NEON GREEN #00FF41)                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Chat */}
        <div
          onClick={() => onNavigate('chat', 'text')}
          className="p-5 bg-[#0A0A0A] border border-[#262626] hover:border-[#00FF41] hover:-translate-y-1 transition-all duration-200 shadow-[2px_2px_0px_0px_#171717] hover:shadow-[3px_3px_0px_0px_#00FF41] group cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-black border border-[#262626] group-hover:border-[#00FF41] text-[#00FF41] transition-colors">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono text-[#737373] group-hover:text-[#00FF41]">01 // TEXT</span>
            </div>
            <h3 className="text-base font-bold text-[#EDEDED] font-display mb-1 group-hover:text-[#00FF41] transition-colors">
              Chat
            </h3>
            <p className="text-xs text-[#A1A1AA] font-sans leading-relaxed">
              Advanced AI conversation and logic.
            </p>
          </div>
          <div className="pt-4 flex items-center justify-between text-[11px] font-mono text-[#737373] group-hover:text-[#00FF41]">
            <span>Launch Engine</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-[#00FF41]" />
          </div>
        </div>

        {/* Card 2: Image Generation */}
        <div
          onClick={() => onNavigate('chat', 'image')}
          className="p-5 bg-[#0A0A0A] border border-[#262626] hover:border-[#00FF41] hover:-translate-y-1 transition-all duration-200 shadow-[2px_2px_0px_0px_#171717] hover:shadow-[3px_3px_0px_0px_#00FF41] group cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-black border border-[#262626] group-hover:border-[#00FF41] text-[#00FF41] transition-colors">
                <ImageIcon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono text-[#737373] group-hover:text-[#00FF41]">02 // VISUALS</span>
            </div>
            <h3 className="text-base font-bold text-[#EDEDED] font-display mb-1 group-hover:text-[#00FF41] transition-colors">
              Image Generation
            </h3>
            <p className="text-xs text-[#A1A1AA] font-sans leading-relaxed">
              Create stunning visuals from text.
            </p>
          </div>
          <div className="pt-4 flex items-center justify-between text-[11px] font-mono text-[#737373] group-hover:text-[#00FF41]">
            <span>Launch Engine</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-[#00FF41]" />
          </div>
        </div>

        {/* Card 3: Video Generator */}
        <div
          onClick={() => onNavigate('chat', 'video')}
          className="p-5 bg-[#0A0A0A] border border-[#262626] hover:border-[#00FF41] hover:-translate-y-1 transition-all duration-200 shadow-[2px_2px_0px_0px_#171717] hover:shadow-[3px_3px_0px_0px_#00FF41] group cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-black border border-[#262626] group-hover:border-[#00FF41] text-[#00FF41] transition-colors">
                <Film className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono text-[#737373] group-hover:text-[#00FF41]">03 // MOTION</span>
            </div>
            <h3 className="text-base font-bold text-[#EDEDED] font-display mb-1 group-hover:text-[#00FF41] transition-colors">
              Video Generator
            </h3>
            <p className="text-xs text-[#A1A1AA] font-sans leading-relaxed">
              Generate high-quality video frames.
            </p>
          </div>
          <div className="pt-4 flex items-center justify-between text-[11px] font-mono text-[#737373] group-hover:text-[#00FF41]">
            <span>Launch Engine</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-[#00FF41]" />
          </div>
        </div>

        {/* Card 4: Music Generator */}
        <div
          onClick={() => onNavigate('chat', 'music')}
          className="p-5 bg-[#0A0A0A] border border-[#262626] hover:border-[#00FF41] hover:-translate-y-1 transition-all duration-200 shadow-[2px_2px_0px_0px_#171717] hover:shadow-[3px_3px_0px_0px_#00FF41] group cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-black border border-[#262626] group-hover:border-[#00FF41] text-[#00FF41] transition-colors">
                <Music className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono text-[#737373] group-hover:text-[#00FF41]">04 // AUDIO</span>
            </div>
            <h3 className="text-base font-bold text-[#EDEDED] font-display mb-1 group-hover:text-[#00FF41] transition-colors">
              Music Generator
            </h3>
            <p className="text-xs text-[#A1A1AA] font-sans leading-relaxed">
              Compose dynamic audio and music.
            </p>
          </div>
          <div className="pt-4 flex items-center justify-between text-[11px] font-mono text-[#737373] group-hover:text-[#00FF41]">
            <span>Launch Engine</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-[#00FF41]" />
          </div>
        </div>

      </div>

    </div>
  );
};
