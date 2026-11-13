import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  RefreshCw,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Globe,
  Quote as QuoteIcon,
  Check,
  Flame,
  Volume2
} from 'lucide-react';
import {
  MoodId,
  QuoteCategory,
  MOOD_DEFINITIONS,
  fetchShayariQuote,
  toggleFavoriteQuote,
  isQuoteFavorite,
  exportQuoteImageCard,
} from '../../lib/moodQuoteService';
import { ShayariQuote, FALLBACK_SHAYARI_QUOTES } from '../../data/fallbackQuotes';
import { useTheme } from '../../context/ThemeContext';

const MoodBackgroundCanvas = lazy(() =>
  import('./MoodBackgroundCanvas').then((m) => ({ default: m.MoodBackgroundCanvas }))
);

interface ShayariQuoteCardProps {
  currentMood: MoodId;
  onShowToast?: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

const CATEGORIES: Array<{ id: QuoteCategory; label: string; icon: string }> = [
  { id: 'love', label: 'Love', icon: '💖' },
  { id: 'breakup', label: 'Breakup', icon: '💔' },
  { id: 'mood_off', label: 'Mood Off', icon: '🌧️' },
  { id: 'motivation', label: 'Motivation', icon: '⚡' },
  { id: 'genz', label: 'Gen-Z One-Liners', icon: '🔥' },
];

type TextEntranceStyle = 'blur_in' | 'typewriter' | 'ink_spread' | 'glowing_underline';

const ENTRANCE_STYLES: TextEntranceStyle[] = ['blur_in', 'typewriter', 'ink_spread', 'glowing_underline'];

export const ShayariQuoteCard: React.FC<ShayariQuoteCardProps> = ({
  currentMood,
  onShowToast,
}) => {
  const { theme } = useTheme();

  // Find category based on mood
  const defaultCategory = useMemo(() => {
    const config = MOOD_DEFINITIONS.find((m) => m.id === currentMood);
    return config?.category || 'motivation';
  }, [currentMood]);

  const [selectedCategory, setSelectedCategory] = useState<QuoteCategory>(defaultCategory);
  const [language, setLanguage] = useState<'hinglish' | 'english'>('hinglish');
  const [currentQuote, setCurrentQuote] = useState<ShayariQuote>(() => {
    const initialPool = FALLBACK_SHAYARI_QUOTES.filter(
      (q) => q.category === defaultCategory && q.language === 'hinglish'
    );
    return initialPool[0] || FALLBACK_SHAYARI_QUOTES[0];
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFavorited, setIsFavorited] = useState<boolean>(() => isQuoteFavorite(currentQuote.text));
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Entrance style
  const [entranceStyle, setEntranceStyle] = useState<TextEntranceStyle>('blur_in');
  const [keyCounter, setKeyCounter] = useState(0);

  // Synchronize category when mood changes
  useEffect(() => {
    const newCategory = defaultCategory;
    setSelectedCategory(newCategory);
    loadQuote(newCategory, language, false);
  }, [currentMood, defaultCategory]);

  // Load a quote (API or fallback)
  const loadQuote = useCallback(
    async (cat: QuoteCategory, lang: 'hinglish' | 'english', forceFresh = false) => {
      setIsLoading(true);
      // Pick random entrance animation style
      const randomStyle = ENTRANCE_STYLES[Math.floor(Math.random() * ENTRANCE_STYLES.length)];
      setEntranceStyle(randomStyle);

      try {
        const quote = await fetchShayariQuote({
          category: cat,
          mood: currentMood,
          language: lang,
          forceFresh,
        });
        setCurrentQuote(quote);
        setIsFavorited(isQuoteFavorite(quote.text));
        setKeyCounter((prev) => prev + 1);
      } catch (e) {
        console.warn('Quote load notice:', e);
      } finally {
        setIsLoading(false);
      }
    },
    [currentMood]
  );

  // Swipe Handlers (Touch & Gestures)
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    // Threshold of 40px
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swiped Left -> Next quote
        loadQuote(selectedCategory, language, true);
      } else {
        // Swiped Right -> Previous/another quote
        loadQuote(selectedCategory, language, true);
      }
    }
    touchStartX.current = null;
  };

  // Toggle Favorite
  const handleToggleFavorite = () => {
    const newState = toggleFavoriteQuote(currentQuote);
    setIsFavorited(newState);
    if (onShowToast) {
      onShowToast(
        newState ? 'success' : 'info',
        newState ? 'Saved to Favorites' : 'Removed from Favorites',
        `"${currentQuote.text.slice(0, 45)}..."`
      );
    }
  };

  // Share / Export Card
  const handleShare = async () => {
    setIsExporting(true);
    try {
      const moodConfig = MOOD_DEFINITIONS.find((m) => m.id === currentMood);
      await exportQuoteImageCard({
        quote: currentQuote,
        theme,
        moodAccentColor: moodConfig?.accentColor,
      });
      if (onShowToast) {
        onShowToast('success', 'Card Exported', 'Quote card generated successfully.');
      }
    } catch (e) {
      if (onShowToast) {
        onShowToast('error', 'Export Failed', 'Could not export image card.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Copy text to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(`"${currentQuote.text}" — ${currentQuote.attribution}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    if (onShowToast) {
      onShowToast('info', 'Copied to Clipboard');
    }
  };

  // Words for word-by-word reveal
  const quoteWords = useMemo(() => currentQuote.text.split(' '), [currentQuote.text]);

  const activeMoodConfig = MOOD_DEFINITIONS.find((m) => m.id === currentMood) || MOOD_DEFINITIONS[0];

  return (
    <div className="relative rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden shadow-sm transition-all">
      {/* 1. Unique Mood Ambient Animation Canvas */}
      <Suspense fallback={null}>
        <MoodBackgroundCanvas mood={currentMood} className="opacity-70" />
      </Suspense>

      {/* 2. Top Header: Categories & Language Switch */}
      <div className="relative z-10 p-4 sm:p-5 border-b border-[var(--border-color)]/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[var(--bg-card)]/80 backdrop-blur-md">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  loadQuote(cat.id, language, true);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[var(--accent-color)] text-black font-bold shadow-xs'
                    : 'bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-color)]/40'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Language Switch: Hinglish vs English */}
        <div className="flex items-center gap-1 bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border-color)] self-end sm:self-auto shrink-0">
          <Globe className="w-3.5 h-3.5 text-[var(--text-muted)] ml-1" />
          <button
            type="button"
            onClick={() => {
              setLanguage('hinglish');
              loadQuote(selectedCategory, 'hinglish', true);
            }}
            className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              language === 'hinglish'
                ? 'bg-[var(--accent-color)] text-black shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Hinglish
          </button>
          <button
            type="button"
            onClick={() => {
              setLanguage('english');
              loadQuote(selectedCategory, 'english', true);
            }}
            className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              language === 'english'
                ? 'bg-[var(--accent-color)] text-black shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* 3. Main Quote Body (Supports Touch Swiping) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative z-10 p-6 sm:p-8 min-h-[190px] sm:min-h-[220px] flex flex-col justify-between"
      >
        {/* Subtle Decorative Quote Icon */}
        <QuoteIcon
          className="w-10 h-10 absolute top-5 left-5 opacity-10 pointer-events-none transition-colors"
          style={{ color: activeMoodConfig.accentColor }}
        />

        {/* Dynamic Text Entrance with 4 unique styles */}
        <AnimatePresence mode="wait">
          <div key={`${currentQuote.id}-${keyCounter}`} className="space-y-3 z-10">
            {/* Style 1: Blur-in Word by Word */}
            {entranceStyle === 'blur_in' && (
              <p className="text-lg sm:text-2xl font-bold text-[var(--text-primary)] leading-relaxed font-sans tracking-tight">
                {quoteWords.map((word, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, filter: 'blur(6px)', y: 4 }}
                    animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                    transition={{ duration: 0.28, delay: i * 0.04 }}
                    className="inline-block mr-1.5"
                  >
                    {word}
                  </motion.span>
                ))}
              </p>
            )}

            {/* Style 2: Typewriter */}
            {entranceStyle === 'typewriter' && (
              <motion.p
                initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
                animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
                transition={{ duration: 0.65, ease: 'easeOut' }}
                className="text-lg sm:text-2xl font-bold text-[var(--text-primary)] leading-relaxed font-sans tracking-tight"
              >
                {currentQuote.text}
              </motion.p>
            )}

            {/* Style 3: Ink-Spread */}
            {entranceStyle === 'ink_spread' && (
              <motion.p
                initial={{ opacity: 0, scale: 0.96, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="text-lg sm:text-2xl font-bold text-[var(--text-primary)] leading-relaxed font-sans tracking-tight"
              >
                {currentQuote.text}
              </motion.p>
            )}

            {/* Style 4: Glowing Underline */}
            {entranceStyle === 'glowing_underline' && (
              <div className="space-y-1">
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="text-lg sm:text-2xl font-bold text-[var(--text-primary)] leading-relaxed font-sans tracking-tight"
                >
                  {currentQuote.text}
                </motion.p>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '60px' }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="h-1 rounded-full bg-[var(--accent-color)] shadow-[0_0_8px_var(--accent-color)]"
                />
              </div>
            )}

            {/* English Meaning / Subtitle (if available) */}
            {currentQuote.translation && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.3 }}
                className="text-xs sm:text-sm text-[var(--text-secondary)] italic font-sans"
              >
                “{currentQuote.translation}”
              </motion.p>
            )}

            {/* Attribution */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.3 }}
              className="flex items-center gap-2 pt-1"
            >
              <span className="text-xs font-bold text-[var(--accent-color)] font-mono">
                — {currentQuote.attribution}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                · #{currentQuote.moodTag}
              </span>
            </motion.div>
          </div>
        </AnimatePresence>

        {/* Swipe hint on mobile */}
        <div className="text-[10px] text-[var(--text-muted)] pt-3 flex items-center justify-between sm:hidden">
          <span>👈 Swipe left/right for more</span>
          <span>Tap 'New one' to cycle</span>
        </div>
      </div>

      {/* 4. Action Footer: Prev, Next, New One, Favorite, Share */}
      <div className="relative z-10 px-4 py-3 sm:px-6 sm:py-3.5 border-t border-[var(--border-color)]/70 bg-[var(--bg-elevated)]/90 backdrop-blur-md flex items-center justify-between gap-2">
        {/* Navigation Arrows */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => loadQuote(selectedCategory, language, true)}
            disabled={isLoading}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer disabled:opacity-50"
            title="Previous / New line"
            aria-label="Previous quote"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => loadQuote(selectedCategory, language, true)}
            disabled={isLoading}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer disabled:opacity-50"
            title="Next line"
            aria-label="Next quote"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Center / Right Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Favorite Button */}
          <button
            type="button"
            onClick={handleToggleFavorite}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
              isFavorited
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-500'
                : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
            aria-label="Save to favorites"
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span className="hidden sm:inline">{isFavorited ? 'Favorited' : 'Favorite'}</span>
          </button>

          {/* Share Image Card Button */}
          <button
            type="button"
            onClick={handleShare}
            disabled={isExporting}
            className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-color)]/50 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium"
            title="Export as high-res image card"
            aria-label="Share quote card"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Share Card'}</span>
          </button>

          {/* New One Button */}
          <button
            type="button"
            onClick={() => loadQuote(selectedCategory, language, true)}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-[var(--accent-color)] text-black font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-60"
            title="Generate a fresh quote"
            aria-label="Generate new quote"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>New one</span>
          </button>
        </div>
      </div>
    </div>
  );
};
