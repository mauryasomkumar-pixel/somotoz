import { getAdminAuthHeaders } from './adminService';
import { FALLBACK_SHAYARI_QUOTES, ShayariQuote } from '../data/fallbackQuotes';
import { AppTheme } from '../types';

export type MoodId = 'happy' | 'chill' | 'romantic' | 'heartbroken' | 'mood_off' | 'motivated' | 'focus';
export type QuoteCategory = 'love' | 'breakup' | 'mood_off' | 'motivation' | 'genz';

export interface MoodConfig {
  id: MoodId;
  label: string;
  icon: string;
  category: QuoteCategory;
  accentColor: string;
  description: string;
}

export const MOOD_DEFINITIONS: MoodConfig[] = [
  {
    id: 'happy',
    label: 'Happy',
    icon: '✨',
    category: 'genz',
    accentColor: '#10B981',
    description: 'Vibrant, joyful, and celebrating life',
  },
  {
    id: 'chill',
    label: 'Chill',
    icon: '☕',
    category: 'genz',
    accentColor: '#00F0FF',
    description: 'Relaxed, serene, and steady flow',
  },
  {
    id: 'romantic',
    label: 'Romantic',
    icon: '💖',
    category: 'love',
    accentColor: '#EC4899',
    description: 'Love, butterflies, and poetic longing',
  },
  {
    id: 'heartbroken',
    label: 'Heartbroken',
    icon: '💔',
    category: 'breakup',
    accentColor: '#8B5CF6',
    description: 'Healing from heartache and memories',
  },
  {
    id: 'mood_off',
    label: 'Mood Off',
    icon: '🌧️',
    category: 'mood_off',
    accentColor: '#64748B',
    description: 'Quiet pause, heavy mind, needing peace',
  },
  {
    id: 'motivated',
    label: 'Motivated',
    icon: '⚡',
    category: 'motivation',
    accentColor: '#F59E0B',
    description: 'Driven, unstoppable momentum and fire',
  },
  {
    id: 'focus',
    label: 'Focus',
    icon: '🎯',
    category: 'motivation',
    accentColor: '#38BDF8',
    description: 'Deep concentration and clear execution',
  },
];

/**
 * Classifies user's freeform one-liner into one of the 7 moods using Gemini API.
 * PRIVACY GUARANTEE: The raw text is discarded server-side and never saved.
 */
export async function detectMoodFromText(text: string): Promise<MoodId> {
  try {
    const headers = await getAdminAuthHeaders();
    const res = await fetch('/api/mood/detect', {
      method: 'POST',
      headers,
      body: JSON.stringify({ text }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.mood) {
        return data.mood as MoodId;
      }
    }
  } catch (err) {
    console.warn('[Mood Detection Notice] Falling back to client keyword analysis:', err);
  }

  // Client-side heuristic fallback if offline or API unavailable
  const lower = text.toLowerCase();
  if (lower.includes('love') || lower.includes('ishq') || lower.includes('pyaar') || lower.includes('miss') || lower.includes('crush')) {
    return 'romantic';
  }
  if (lower.includes('break') || lower.includes('hurt') || lower.includes('crying') || lower.includes('dhoka') || lower.includes('alone')) {
    return 'heartbroken';
  }
  if (lower.includes('sad') || lower.includes('gussa') || lower.includes('annoyed') || lower.includes('tired') || lower.includes('drain') || lower.includes('off')) {
    return 'mood_off';
  }
  if (lower.includes('grind') || lower.includes('hustle') || lower.includes('code') || lower.includes('win') || lower.includes('build') || lower.includes('fire')) {
    return 'motivated';
  }
  if (lower.includes('study') || lower.includes('work') || lower.includes('deep') || lower.includes('concentrat') || lower.includes('read')) {
    return 'focus';
  }
  if (lower.includes('happy') || lower.includes('khush') || lower.includes('laugh') || lower.includes('fun') || lower.includes('party')) {
    return 'happy';
  }
  return 'chill';
}

/**
 * Fetches a shayari/quote from the Gemini-backed API, with daily quota caching and offline fallback.
 */
export async function fetchShayariQuote(params: {
  category: QuoteCategory;
  mood: MoodId;
  language: 'hinglish' | 'english';
  forceFresh?: boolean;
}): Promise<ShayariQuote> {
  const { category, mood, language, forceFresh = false } = params;

  try {
    const headers = await getAdminAuthHeaders();
    const res = await fetch('/api/quotes/generate', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        category,
        mood,
        language,
        forceFresh,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.quote && data.quote.text) {
        return data.quote;
      }
    }
  } catch (e) {
    console.warn('[Quotes API notice] Using rich offline quote bank:', e);
  }

  // Offline / Fallback Bank lookup
  const filtered = FALLBACK_SHAYARI_QUOTES.filter(
    (q) => q.category === category && q.language === language
  );
  const pool = filtered.length > 0 ? filtered : FALLBACK_SHAYARI_QUOTES.filter((q) => q.category === category);
  const fallbackPool = pool.length > 0 ? pool : FALLBACK_SHAYARI_QUOTES;
  const randomIndex = Math.floor(Math.random() * fallbackPool.length);
  return fallbackPool[randomIndex];
}

/**
 * Favorites persistence in localStorage
 */
const FAVORITES_KEY = 'somotoz_favorite_quotes';

export function getFavoriteQuotes(): ShayariQuote[] {
  try {
    const saved = localStorage.getItem(FAVORITES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteQuote(quote: ShayariQuote): boolean {
  try {
    const favorites = getFavoriteQuotes();
    const index = favorites.findIndex((f) => f.text === quote.text);
    if (index >= 0) {
      favorites.splice(index, 1);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      return false; // Removed
    } else {
      favorites.unshift(quote);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites.slice(0, 50)));
      return true; // Added
    }
  } catch {
    return false;
  }
}

export function isQuoteFavorite(quoteText: string): boolean {
  try {
    const favorites = getFavoriteQuotes();
    return favorites.some((f) => f.text === quoteText);
  } catch {
    return false;
  }
}

/**
 * Exports the shayari line as a canvas card that matches the active theme.
 */
export async function exportQuoteImageCard(params: {
  quote: ShayariQuote;
  theme: AppTheme;
  moodAccentColor?: string;
}): Promise<void> {
  const { quote, theme, moodAccentColor = '#00F0FF' } = params;

  const canvas = document.createElement('canvas');
  const width = 1200;
  const height = 800;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Theme palettes
  const isLight = theme === 'white';
  const isMix = theme === 'mix';

  const bgColor = isLight ? '#FFFFFF' : isMix ? '#FAF6ED' : '#0B0B14';
  const surfaceColor = isLight ? '#F4F5F7' : isMix ? '#EDE6D6' : '#141424';
  const primaryTextColor = isLight ? '#0F172A' : isMix ? '#1A1A1A' : '#FFFFFF';
  const secondaryTextColor = isLight ? '#475569' : isMix ? '#4A3E31' : '#A1A1AA';
  const borderColor = isLight ? '#CBD5E1' : isMix ? '#D3C7B5' : '#2D2D45';
  const accent = moodAccentColor;

  // 1. Draw outer background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // 2. Draw subtle decorative radial glow
  const gradient = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, 500);
  gradient.addColorStop(0, `${accent}1A`);
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 3. Inner Card Container with rounded corners
  const margin = 50;
  const cardX = margin;
  const cardY = margin;
  const cardW = width - margin * 2;
  const cardH = height - margin * 2;
  const radius = 24;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, radius);
  ctx.fillStyle = surfaceColor;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = borderColor;
  ctx.stroke();
  ctx.restore();

  // 4. Accent corner highlight bar
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cardX + 2, cardY + 2, cardW - 4, 8, [radius, radius, 0, 0]);
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.restore();

  // 5. Header Branding & Category Pill
  ctx.font = 'bold 20px "Space Grotesk", sans-serif';
  ctx.fillStyle = accent;
  ctx.fillText('SOMOTOZ // SHAYARI & WISDOM', cardX + 50, cardY + 70);

  ctx.font = '600 16px "JetBrains Mono", monospace';
  ctx.fillStyle = secondaryTextColor;
  const categoryLabel = `#${quote.category.toUpperCase()} · ${quote.moodTag.toUpperCase()}`;
  ctx.fillText(categoryLabel, cardX + cardW - 50 - ctx.measureText(categoryLabel).width, cardY + 70);

  // Divider line
  ctx.beginPath();
  ctx.moveTo(cardX + 50, cardY + 95);
  ctx.lineTo(cardX + cardW - 50, cardY + 95);
  ctx.strokeStyle = `${borderColor}80`;
  ctx.lineWidth = 1;
  ctx.stroke();

  // 6. Large Quote Mark
  ctx.font = 'italic bold 90px "Plus Jakarta Sans", serif';
  ctx.fillStyle = `${accent}30`;
  ctx.fillText('“', cardX + 50, cardY + 180);

  // 7. Main Quote Text (Wrap words cleanly)
  ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = primaryTextColor;

  const maxLineWidth = cardW - 140;
  const words = quote.text.split(' ');
  let line = '';
  const lines: string[] = [];

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxLineWidth && n > 0) {
      lines.push(line.trim());
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());

  let startY = cardY + 240;
  for (const textLine of lines) {
    ctx.fillText(textLine, cardX + 70, startY);
    startY += 52;
  }

  // 8. Translation / Meaning Subtitle
  if (quote.translation) {
    startY += 20;
    ctx.font = 'italic 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = secondaryTextColor;

    const transWords = quote.translation.split(' ');
    let transLine = '';
    const transLines: string[] = [];

    for (let n = 0; n < transWords.length; n++) {
      const test = transLine + transWords[n] + ' ';
      if (ctx.measureText(test).width > maxLineWidth && n > 0) {
        transLines.push(transLine.trim());
        transLine = transWords[n] + ' ';
      } else {
        transLine = test;
      }
    }
    transLines.push(transLine.trim());

    for (const tl of transLines) {
      ctx.fillText(`“${tl}”`, cardX + 70, startY);
      startY += 32;
    }
  }

  // 9. Attribution & Footer
  const footerY = cardY + cardH - 50;
  ctx.font = 'bold 18px "Space Grotesk", sans-serif';
  ctx.fillStyle = accent;
  ctx.fillText(`— ${quote.attribution}`, cardX + 70, footerY);

  ctx.font = '500 15px "JetBrains Mono", monospace';
  ctx.fillStyle = secondaryTextColor;
  const brandWatermark = 'somotoz.ai • mindful AI suite';
  ctx.fillText(brandWatermark, cardX + cardW - 70 - ctx.measureText(brandWatermark).width, footerY);

  // 10. Trigger Share or Download
  canvas.toBlob(async (blob) => {
    if (!blob) return;

    const filename = `somotoz-shayari-${Date.now()}.png`;
    const file = new File([blob], filename, { type: 'image/png' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: 'Somotoz Shayari',
          text: `"${quote.text}" — ${quote.attribution}`,
          files: [file],
        });
        return;
      } catch (err) {
        // User cancelled or unsupported, fallback to download
      }
    }

    // Direct download fallback
    const link = document.createElement('a');
    link.download = filename;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }, 'image/png');
}
