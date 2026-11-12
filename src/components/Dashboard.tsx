import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Sparkles,
  BookOpen,
  ArrowRight,
  Clock,
  ChevronRight,
  RefreshCw,
  Bookmark,
  Share2,
  Check,
  Send,
  Loader2,
  Globe2
} from 'lucide-react';
import { UserProfile, ViewMode, JournalEntry, UserActivityLog } from '../types';
import { apiFetch } from '../lib/apiClient';
import { db, cleanForFirestore } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface DashboardProps {
  user: UserProfile;
  entries: JournalEntry[];
  activityLogs: UserActivityLog[];
  onNavigate: (view: ViewMode) => void;
  onNewReflection: () => void;
  onOpenProfile?: () => void;
}

export type DashboardMoodId = 'happy' | 'chill' | 'romantic' | 'heartbroken' | 'mood_off' | 'motivated' | 'focus';

interface MoodOption {
  id: DashboardMoodId;
  label: string;
  emoji: string;
  color: string;
  bgGlow: string;
}

const DASHBOARD_MOODS: MoodOption[] = [
  { id: 'happy', label: 'Happy', emoji: '😊', color: '#10B981', bgGlow: 'rgba(16, 185, 129, 0.15)' },
  { id: 'chill', label: 'Chill', emoji: '☕', color: '#06B6D4', bgGlow: 'rgba(6, 182, 212, 0.15)' },
  { id: 'romantic', label: 'Romantic', emoji: '🌹', color: '#EC4899', bgGlow: 'rgba(236, 72, 153, 0.15)' },
  { id: 'heartbroken', label: 'Heartbroken', emoji: '💔', color: '#6366F1', bgGlow: 'rgba(99, 102, 241, 0.15)' },
  { id: 'mood_off', label: 'Mood Off', emoji: '🌧️', color: '#64748B', bgGlow: 'rgba(100, 116, 139, 0.15)' },
  { id: 'motivated', label: 'Motivated', emoji: '🔥', color: '#F59E0B', bgGlow: 'rgba(245, 158, 11, 0.15)' },
  { id: 'focus', label: 'Focus', emoji: '🎯', color: '#8B5CF6', bgGlow: 'rgba(139, 92, 246, 0.15)' },
];

interface QuoteData {
  quote: string;
  inspiringLine: string;
  source: string;
  mood: string;
  lang: string;
  authorTag: string;
}

function getGreetingParts(name: string): { greetingText: string; timePeriod: string } {
  const hour = new Date().getHours();
  const firstName = (name || 'Friend').trim().split(' ')[0];
  if (hour >= 5 && hour < 12) {
    return { greetingText: `Good morning, ${firstName}`, timePeriod: 'morning' };
  } else if (hour >= 12 && hour < 17) {
    return { greetingText: `Good afternoon, ${firstName}`, timePeriod: 'afternoon' };
  } else if (hour >= 17 && hour < 22) {
    return { greetingText: `Good evening, ${firstName}`, timePeriod: 'evening' };
  }
  return { greetingText: `Good night, ${firstName}`, timePeriod: 'night' };
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  entries = [],
  onNavigate,
  onNewReflection,
}) => {
  const userName = user.displayName || user.username || user.email?.split('@')[0] || 'Friend';
  const { greetingText } = useMemo(() => getGreetingParts(userName), [userName]);
  const greetingWords = useMemo(() => greetingText.split(' '), [greetingText]);

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  // 1. Language Toggle: Hinglish (default) vs English
  const [lang, setLang] = useState<'hinglish' | 'english'>(() => {
    try {
      const saved = localStorage.getItem('somotoz_pref_lang');
      return saved === 'english' ? 'english' : 'hinglish';
    } catch {
      return 'hinglish';
    }
  });

  const handleToggleLang = (newLang: 'hinglish' | 'english') => {
    setLang(newLang);
    try {
      localStorage.setItem('somotoz_pref_lang', newLang);
    } catch {}
  };

  // 2. Mood State
  const [selectedMood, setSelectedMood] = useState<DashboardMoodId>(() => {
    try {
      const saved = localStorage.getItem('somotoz_dashboard_mood') as DashboardMoodId;
      if (DASHBOARD_MOODS.some((m) => m.id === saved)) return saved;
    } catch {}
    return 'chill';
  });

  const handleSelectMood = (moodId: DashboardMoodId) => {
    setSelectedMood(moodId);
    try {
      localStorage.setItem('somotoz_dashboard_mood', moodId);
    } catch {}
  };

  // 3. Freeform One-Line Feel Input
  const [feelInput, setFeelInput] = useState('');
  const [isDetectingMood, setIsDetectingMood] = useState(false);

  const handleDetectMood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feelInput.trim() || isDetectingMood) return;

    setIsDetectingMood(true);
    try {
      const res = await apiFetch<{ mood?: DashboardMoodId; detectedMood?: DashboardMoodId }>('/api/mood/detect', {
        method: 'POST',
        body: JSON.stringify({ text: feelInput.trim(), lang }),
      });
      const detected = res?.mood || res?.detectedMood;
      if (detected && DASHBOARD_MOODS.some((m) => m.id === detected)) {
        handleSelectMood(detected);
      }
      setFeelInput('');
    } catch (err) {
      console.warn('Mood detection failed:', err);
    } finally {
      setIsDetectingMood(false);
    }
  };

  // 4. Quote Generation & Caching
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const fetchQuote = useCallback(
    async (forceNew = false) => {
      setIsLoadingQuote(true);
      setIsSaved(false);
      try {
        const query = new URLSearchParams({
          mood: selectedMood,
          lang,
          ...(forceNew ? { refresh: '1' } : {}),
        });
        const res = await apiFetch<QuoteData>(`/api/quotes/generate?${query.toString()}`);
        if (res && res.quote) {
          setQuoteData(res);
        }
      } catch (err) {
        console.warn('Quote fetch failed, using fallback:', err);
        setQuoteData({
          quote: lang === 'hinglish'
            ? 'Khamoshiyon mein bhi ek dabi si aawaz hoti hai,\nHar nayi subah ek nayi parwaaz hoti hai.'
            : 'In quiet moments, courage softly grows,\nA gentle stream that steadily flows.',
          inspiringLine: lang === 'hinglish'
            ? 'Apne hausle par vishwas rakho, manzil khud raasta degi.'
            : 'Keep moving forward at your own calm pace.',
          source: 'Original by Somotoz',
          mood: selectedMood,
          lang,
          authorTag: 'Original by Somotoz',
        });
      } finally {
        setIsLoadingQuote(false);
      }
    },
    [selectedMood, lang]
  );

  // Fetch on mood or lang change
  useEffect(() => {
    fetchQuote(false);
  }, [fetchQuote]);

  // Save to Favourites in Firestore
  const handleSaveFavourite = async () => {
    if (!quoteData || isSaved) return;
    try {
      const favId = `fav_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const favRef = doc(db, 'users', user.uid, 'favourites', favId);
      await setDoc(
        favRef,
        cleanForFirestore({
          id: favId,
          quote: quoteData.quote,
          inspiringLine: quoteData.inspiringLine,
          mood: selectedMood,
          lang,
          authorTag: 'Original by Somotoz',
          createdAt: new Date().toISOString(),
        })
      );
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.warn('Failed to save favourite:', err);
    }
  };

  // Share or Copy Quote
  const handleShareQuote = async () => {
    if (!quoteData) return;
    const shareText = `"${quoteData.quote}"\n\n— ${quoteData.inspiringLine}\n(Original by Somotoz)`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Somotoz Shayari & Thought',
          text: shareText,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  };

  const activeMoodObj = useMemo(
    () => DASHBOARD_MOODS.find((m) => m.id === selectedMood) || DASHBOARD_MOODS[0],
    [selectedMood]
  );

  const recentItems = entries.slice(0, 4);

  return (
    <div className="max-w-4xl mx-auto space-y-7 pb-24 md:pb-12 font-sans relative">
      {/* Mood Particles / Ambient Animation Overlay */}
      <MoodParticles mood={selectedMood} />

      {/* 1. GREETING WITH WORD-BY-WORD REVEAL & LANGUAGE SWITCH */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[var(--accent-color)] uppercase tracking-wider">
              {todayFormatted}
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">•</span>
            <span className="text-[11px] text-[var(--text-muted)]">
              {activeMoodObj.emoji} {activeMoodObj.label} Mode
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] flex flex-wrap gap-x-2 tracking-tight">
            {greetingWords.map((word, idx) => (
              <motion.span
                key={`${word}-${idx}`}
                initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{
                  duration: 0.45,
                  delay: idx * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={idx === greetingWords.length - 1 ? 'text-[var(--accent-color)]' : ''}
              >
                {word}
              </motion.span>
            ))}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Your space for genuine human conversations, Urdu shayari, and creative ideas.
          </p>
        </div>

        {/* Hinglish vs English Language Switcher */}
        <div className="flex items-center self-start sm:self-auto bg-[var(--bg-elevated)] p-1 rounded-full border border-[var(--border-color)] text-xs shrink-0 shadow-xs">
          <Globe2 className="w-3.5 h-3.5 ml-2 mr-1 text-[var(--text-muted)]" />
          <button
            type="button"
            onClick={() => handleToggleLang('hinglish')}
            className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
              lang === 'hinglish'
                ? 'bg-[var(--accent-color)] text-black font-semibold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Hinglish
          </button>
          <button
            type="button"
            onClick={() => handleToggleLang('english')}
            className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
              lang === 'english'
                ? 'bg-[var(--accent-color)] text-black font-semibold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            English
          </button>
        </div>
      </section>

      {/* 2. TODAY'S MOOD CHIPS + OPTIONAL ONE-LINE FEEL INPUT */}
      <section className="p-5 rounded-3xl bg-[var(--bg-card)]/90 backdrop-blur-md border border-[var(--border-color)] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
            <span>How are you feeling right now?</span>
          </h2>
          <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">Tap or write a line</span>
        </div>

        {/* 7 Mood Chips */}
        <div className="flex flex-wrap gap-2">
          {DASHBOARD_MOODS.map((mood) => {
            const isSelected = selectedMood === mood.id;
            return (
              <button
                key={mood.id}
                type="button"
                onClick={() => handleSelectMood(mood.id)}
                className={`px-3.5 py-2 rounded-2xl border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'border-transparent text-white font-semibold shadow-md scale-102'
                    : 'bg-[var(--bg-elevated)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-color)]/30'
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: mood.color,
                        boxShadow: `0 4px 14px ${mood.bgGlow}`,
                      }
                    : {}
                }
              >
                <span className="text-sm">{mood.emoji}</span>
                <span>{mood.label}</span>
              </button>
            );
          })}
        </div>

        {/* Freeform One-Line Feel Input (discards text after classification) */}
        <form onSubmit={handleDetectMood} className="relative flex items-center pt-1">
          <input
            type="text"
            value={feelInput}
            onChange={(e) => setFeelInput(e.target.value)}
            placeholder={
              lang === 'hinglish'
                ? 'Ek line mein likhein kaisa lag raha hai (e.g. Aaj thoda sukoon chahiye)...'
                : 'Write how you feel in one line (e.g. Need some gentle calm today)...'
            }
            maxLength={140}
            className="w-full pl-4 pr-12 py-2.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-color)] transition-colors"
          />
          <button
            type="submit"
            disabled={!feelInput.trim() || isDetectingMood}
            className="absolute right-2 p-1.5 rounded-xl bg-[var(--accent-color)] text-black hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Detect mood"
            aria-label="Detect mood"
          >
            {isDetectingMood ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </form>
      </section>

      {/* 3. SHAYARI / QUOTE CARD: ONE CARD AT A TIME */}
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-7 border border-[var(--border-color)] bg-[var(--bg-card)]/90 backdrop-blur-md shadow-sm transition-all">
        {/* Glow ambient background matching mood */}
        <div
          className="absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-30"
          style={{ backgroundColor: activeMoodObj.color }}
        />

        <div className="relative z-10 space-y-4">
          {/* Card Header Tag */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--accent-color)]">
              <Sparkles className="w-3 h-3" />
              <span>Original by Somotoz</span>
            </span>

            <div className="flex items-center gap-1.5">
              {/* Save Favourite Button */}
              <button
                type="button"
                onClick={handleSaveFavourite}
                disabled={!quoteData || isSaved}
                className="p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--accent-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                title="Save favourite"
                aria-label="Save favourite"
              >
                {isSaved ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </button>

              {/* Share Image / Copy */}
              <button
                type="button"
                onClick={handleShareQuote}
                disabled={!quoteData}
                className="p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--accent-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                title="Share or copy quote"
                aria-label="Share or copy quote"
              >
                {isCopied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
              </button>

              {/* "New one" Button */}
              <button
                type="button"
                onClick={() => fetchQuote(true)}
                disabled={isLoadingQuote}
                className="px-3 py-1.5 rounded-xl bg-[var(--accent-color)] text-black font-semibold text-xs hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQuote ? 'animate-spin' : ''}`} />
                <span>New one</span>
              </button>
            </div>
          </div>

          {/* Quote Body */}
          <div className="py-2 min-h-[90px] flex flex-col justify-center">
            {isLoadingQuote && !quoteData ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-[var(--bg-elevated)] rounded-md w-3/4" />
                <div className="h-4 bg-[var(--bg-elevated)] rounded-md w-2/3" />
                <div className="h-3 bg-[var(--bg-elevated)] rounded-md w-1/2 mt-3" />
              </div>
            ) : quoteData ? (
              <motion.div
                key={quoteData.quote}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="space-y-3"
              >
                <p className="text-base sm:text-lg font-serif italic text-[var(--text-primary)] leading-relaxed whitespace-pre-line tracking-wide">
                  "{quoteData.quote}"
                </p>
                {quoteData.inspiringLine && (
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-sans border-l-2 pl-3 border-[var(--accent-color)]/60">
                    {quoteData.inspiringLine}
                  </p>
                )}
              </motion.div>
            ) : null}
          </div>
        </div>
      </section>

      {/* 4. QUICK ACTION SHORTCUTS */}
      <section className="space-y-3">
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          Explore Workspace
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* SomoChat */}
          <button
            type="button"
            onClick={() => onNavigate('somochat')}
            className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent-color)] hover:bg-[var(--bg-elevated)] shadow-sm text-left transition-all cursor-pointer group flex flex-col justify-between gap-4"
          >
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-500 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-color)] transition-colors">
                  SomoChat
                </h3>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Real people only. Message, share stories, and call accepted contacts.
              </p>
            </div>
          </button>

          {/* Ask AI */}
          <button
            type="button"
            onClick={() => onNavigate('chat')}
            className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent-color)] hover:bg-[var(--bg-elevated)] shadow-sm text-left transition-all cursor-pointer group flex flex-col justify-between gap-4"
          >
            <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-color)] transition-colors">
                  Ask AI
                </h3>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Multimodal companion for reasoning, SVG art, canvas video, and synth music.
              </p>
            </div>
          </button>

          {/* Write Journal */}
          <button
            type="button"
            onClick={() => onNewReflection()}
            className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent-color)] hover:bg-[var(--bg-elevated)] shadow-sm text-left transition-all cursor-pointer group flex flex-col justify-between gap-4"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-color)] transition-colors">
                  Write Journal
                </h3>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Private, thoughtful notes with automatic emotional sentiment intelligence.
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* 5. RECENT ACTIVITY */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Your Activity
          </h2>
          {recentItems.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('write')}
              className="text-xs text-[var(--accent-color)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View all notes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentItems.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-[var(--bg-elevated)] text-[var(--text-secondary)] flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">No recent activity yet</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
                Explore SomoChat to find new people or write down your first journal reflection.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('somochat')}
              className="px-5 py-2.5 rounded-2xl bg-[var(--accent-color)] text-black font-semibold text-xs hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Open SomoChat</span>
            </button>
          </div>
        ) : (
          <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] divide-y divide-[var(--border-color)] overflow-hidden shadow-sm">
            {recentItems.map((entry) => {
              const formattedDate = new Date(entry.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });
              return (
                <div
                  key={entry.id}
                  onClick={() => onNavigate('view')}
                  className="p-4 flex items-center justify-between hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer group"
                >
                  <div className="space-y-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-color)] transition-colors truncate">
                        {entry.title || 'Untitled Note'}
                      </span>
                      {entry.moodTags && entry.moodTags.length > 0 && (
                        <span className="text-[11px] text-[var(--text-secondary)] hidden sm:inline">
                          · {entry.moodTags.join(', ')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] truncate">
                      {entry.content.slice(0, 90)}...
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-[var(--text-muted)]">{formattedDate}</span>
                    <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

/**
 * Lightweight ambient mood particles component.
 * Respects prefers-reduced-motion.
 */
const MoodParticles: React.FC<{ mood: DashboardMoodId }> = ({ mood }) => {
  if (mood === 'romantic') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10 opacity-30 select-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute text-pink-400 text-lg animate-bounce"
            style={{
              top: `${15 + i * 14}%`,
              left: `${10 + (i * 16) % 80}%`,
              animationDuration: `${3.5 + i * 0.8}s`,
            }}
          >
            🌸
          </div>
        ))}
      </div>
    );
  }

  if (mood === 'heartbroken') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10 opacity-20 select-none">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-8 bg-indigo-400/60 rounded-full animate-pulse"
            style={{
              top: `${20 + i * 15}%`,
              left: `${15 + (i * 18) % 75}%`,
              animationDuration: `${1.8 + i * 0.4}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (mood === 'motivated') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10 opacity-35 select-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute text-amber-400 text-xs animate-ping"
            style={{
              top: `${25 + (i * 12) % 60}%`,
              right: `${10 + (i * 15) % 75}%`,
              animationDuration: `${2.2 + i * 0.5}s`,
            }}
          >
            ✨
          </div>
        ))}
      </div>
    );
  }

  return null;
};
