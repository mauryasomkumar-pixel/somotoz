import React, { useState } from 'react';
import { Compass, Sparkles, BookOpen, Headphones, Quote, RefreshCw } from 'lucide-react';
import { WisdomExplorer } from './WisdomExplorer';
import { SoundscapePlayer } from './SoundscapePlayer';

const INSPIRING_QUOTES = [
  {
    quote: 'Simplicity is about subtracting the obvious and adding the meaningful.',
    author: 'John Maeda',
    topic: 'Mindful Design',
  },
  {
    quote: 'Peace comes from within. Do not seek it without.',
    author: 'Buddha',
    topic: 'Inner Calm',
  },
  {
    quote: 'The secret of getting ahead is getting started.',
    author: 'Mark Twain',
    topic: 'Focus & Action',
  },
  {
    quote: 'Quiet the mind, and the soul will speak.',
    author: 'Ma Jaya Sati Bhagavati',
    topic: 'Clarity',
  },
  {
    quote: 'You do not rise to the level of your goals. You fall to the level of your systems.',
    author: 'James Clear',
    topic: 'Habits',
  },
  {
    quote: 'In the middle of difficulty lies opportunity.',
    author: 'Albert Einstein',
    topic: 'Perspective',
  },
];

export const DiscoverView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'knowledge' | 'soundscapes' | 'quotes'>('knowledge');
  const [quoteIndex, setQuoteIndex] = useState(0);

  const handleNextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % INSPIRING_QUOTES.length);
  };

  const currentQuote = INSPIRING_QUOTES[quoteIndex];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 md:pb-8 font-sans">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Compass className="w-6 h-6 text-[var(--accent-color)]" />
            <span>Discover</span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Explore mindful topics, calming ambient soundscapes, and daily inspiration.
          </p>
        </div>

        {/* Clean Segmented Tab Control */}
        <div className="flex items-center p-1 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('knowledge')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'knowledge'
                ? 'bg-[var(--accent-color)] text-black shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Knowledge Hub</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('soundscapes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'soundscapes'
                ? 'bg-[var(--accent-color)] text-black shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Soundscapes</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quotes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'quotes'
                ? 'bg-[var(--accent-color)] text-black shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Quote className="w-3.5 h-3.5" />
            <span>Quotes</span>
          </button>
        </div>
      </div>

      {/* 1. Knowledge Hub Tab */}
      {activeTab === 'knowledge' && (
        <div className="animate-fade-in">
          <WisdomExplorer />
        </div>
      )}

      {/* 2. Soundscapes Tab */}
      {activeTab === 'soundscapes' && (
        <div className="animate-fade-in">
          <SoundscapePlayer />
        </div>
      )}

      {/* 3. Daily Quotes Tab */}
      {activeTab === 'quotes' && (
        <div className="animate-fade-in max-w-2xl mx-auto py-8">
          <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm text-center space-y-6">
            <div className="w-12 h-12 mx-auto rounded-full bg-[var(--accent-color)]/15 text-[var(--accent-color)] flex items-center justify-center">
              <Quote className="w-6 h-6" />
            </div>

            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-color)]">
              {currentQuote.topic}
            </span>

            <blockquote className="text-lg sm:text-xl font-medium text-[var(--text-primary)] leading-relaxed italic">
              "{currentQuote.quote}"
            </blockquote>

            <p className="text-sm text-[var(--text-secondary)]">— {currentQuote.author}</p>

            <div className="pt-4 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={handleNextQuote}
                className="px-5 py-2.5 rounded-xl bg-[var(--accent-color)] text-black font-semibold text-xs hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>New quote</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
