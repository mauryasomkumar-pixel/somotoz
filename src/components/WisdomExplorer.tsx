import React, { useState } from 'react';
import { Search, Globe, BookOpen, Sparkles, ExternalLink, Compass, ShieldCheck, HeartPulse, Brain, Moon, Terminal, CheckCircle2, ArrowRight } from 'lucide-react';
import { GroundingSource } from '../types';

interface WisdomExplorerProps {
  onApplyTechnique?: (text: string) => void;
}

const FEATURED_TOPICS = [
  {
    title: '5-4-3-2-1 Grounding Method',
    query: 'How does the 5-4-3-2-1 grounding technique help calm the mind during moments of stress or anxiety?',
    icon: Compass,
    category: 'Stress Relief',
  },
  {
    title: 'Positive Mindset & Reframing',
    query: 'What are simple, effective ways to reframe negative thoughts into constructive, positive solutions?',
    icon: Brain,
    category: 'Mental Clarity',
  },
  {
    title: 'Better Sleep Habits',
    query: 'What are practical, science-backed daily habits to improve sleep quality and wake up refreshed?',
    icon: Moon,
    category: 'Rest & Health',
  },
  {
    title: 'Breathing for Instant Calm',
    query: 'What are easy breathing exercises like Box Breathing or 4-7-8 breathing to relax quickly?',
    icon: HeartPulse,
    category: 'Quick Relaxation',
  },
];

export const WisdomExplorer: React.FC<WisdomExplorerProps> = ({ onApplyTechnique }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearch = async (queryText: string) => {
    const q = queryText.trim();
    if (!q || isLoading) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSearchQuery(q);

    try {
      const res = await fetch('/api/search-wisdom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to search guide information.');
      }

      setAnswer(data.answer);
      setSources(data.sources || []);
    } catch (err: any) {
      console.error('Wisdom search error:', err);
      setErrorMsg(err.message || 'Unable to complete search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 font-sans">
      {/* Search Header */}
      <div className="bg-gradient-to-r from-[#0C0C1E] via-[#080816] to-[#04040D] border border-[#25253D] p-6 font-mono clip-stealth-notch shadow-[0_0_25px_rgba(0,240,255,0.15)] transition-all">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-black/90 border border-[#00F0FF] text-[#00F0FF] flex items-center justify-center clip-badge-poly shadow-[0_0_12px_rgba(0,240,255,0.4)]">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#EDEDED] tracking-tight flex items-center gap-2">
              Neural Knowledge & Grounding Hub
              <span className="text-[10px] px-2 py-0.5 bg-black/80 text-[#00F0FF] border border-[#00F0FF]/40 clip-badge-poly">
                GOOGLE SEARCH GROUNDING
              </span>
            </h1>
            <p className="text-xs text-[#A1A1AA] font-sans">
              Real-time grounded knowledge exploration, cognitive heuristics, algorithmic research, and scientific wellness guides.
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(searchQuery);
          }}
          className="mt-4 flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cognitive techniques, algorithmic reasoning, stress relief, healthy habits..."
              className="w-full pl-10 pr-4 py-3 bg-black/80 border border-[#25253D] text-sm text-[#EDEDED] placeholder-[#737373] focus:outline-none focus:border-[#00F0FF] transition-all font-sans clip-badge-poly"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
            className="px-5 py-3 bg-gradient-to-r from-[#00F0FF] to-[#A855F7] hover:brightness-110 disabled:opacity-40 text-black font-mono font-bold text-xs tracking-wider border border-[#00F0FF] clip-badge-poly shadow-[0_0_15px_rgba(0,240,255,0.4)] active:scale-95 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Search className="w-4 h-4 text-black" />
            <span>Search</span>
          </button>
        </form>
      </div>

      {/* Answer & Sources Display */}
      {isLoading ? (
        <div className="bg-[#0B0B16] border border-[#00F0FF] shadow-[0_0_25px_rgba(0,240,255,0.25)] p-8 flex flex-col items-center justify-center text-center space-y-3 font-mono clip-cyber-card">
          <div className="w-8 h-8 border-2 border-transparent border-t-[#00F0FF] border-r-[#A855F7] animate-spin clip-badge-poly" />
          <p className="text-sm font-bold text-[#EDEDED]">[SEARCHING GROUNDED KNOWLEDGE BASE]</p>
          <p className="text-xs text-[#A1A1AA] font-sans">Retrieving live real-time references and synthesizing insights...</p>
        </div>
      ) : answer ? (
        <div className="bg-[#0A0A14] border border-[#25253D] hover:border-[#00F0FF] shadow-[0_0_25px_rgba(0,240,255,0.1)] p-6 sm:p-7 space-y-6 clip-cyber-card transition-all">
          <div className="flex items-center justify-between border-b border-[#25253D] pb-4 font-mono">
            <div className="flex items-center space-x-2 text-[#00F0FF]">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Synthesized Grounding Output</span>
            </div>
            <button
              onClick={() => {
                setAnswer(null);
                setSources([]);
                setSearchQuery('');
              }}
              className="text-xs text-[#A1A1AA] hover:text-[#00F0FF] font-mono cursor-pointer transition-colors"
            >
              [Clear Search]
            </button>
          </div>

          <div className="text-sm sm:text-base leading-relaxed text-[#EDEDED] font-sans whitespace-pre-wrap">
            {answer}
          </div>

          {/* Sources List */}
          {sources.length > 0 && (
            <div className="pt-4 border-t border-[#25253D] font-mono">
              <h4 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>Verified Reference Citations</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.uri}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-black/80 border border-[#25253D] hover:border-[#00F0FF] text-xs text-[#A1A1AA] hover:text-[#00F0FF] flex items-center justify-between transition-all clip-badge-poly group"
                  >
                    <span className="truncate pr-2">{src.title || src.uri}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 text-[#00F0FF] group-hover:scale-110 transition-transform" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Error display */}
      {errorMsg && (
        <div className="p-4 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-mono clip-badge-poly">
          {errorMsg}
        </div>
      )}

      {/* Featured Topics Section */}
      <div className="space-y-3 font-mono">
        <h3 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-[#A855F7]" />
          <span>Curated Cognitive Explorations</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURED_TOPICS.map((topic, index) => {
            const Icon = topic.icon;
            const accents = ['#00F0FF', '#A855F7', '#FF007A', '#FFB800'];
            const accentColor = accents[index % accents.length];

            return (
              <button
                key={index}
                onClick={() => handleSearch(topic.query)}
                className="p-5 bg-gradient-to-br from-[#0C0C1C] to-[#06060E] border border-[#25253D] hover:border-[#00F0FF] text-left transition-all duration-300 cursor-pointer clip-cyber-card hover:translate-y-[-2px] group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 bg-black/80 border clip-badge-poly font-bold"
                      style={{ color: accentColor, borderColor: `${accentColor}40` }}
                    >
                      {topic.category}
                    </span>
                    <div
                      className="p-1.5 bg-black/80 border text-[#EDEDED] transition-all clip-badge-poly group-hover:scale-110"
                      style={{ borderColor: accentColor, color: accentColor }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#EDEDED] group-hover:text-[#00F0FF] transition-colors font-mono">
                    {topic.title}
                  </h4>
                  <p className="text-[11px] text-[#A1A1AA] mt-1 line-clamp-2 font-sans">
                    {topic.query}
                  </p>
                </div>

                <div className="pt-3 mt-2 flex items-center justify-between text-[10px] text-[#737373] group-hover:text-[#00F0FF]">
                  <span>Explore Heuristic</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1.5 transition-transform text-[#00F0FF]" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
