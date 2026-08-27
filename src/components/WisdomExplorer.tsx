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
      <div className="bg-[#0A0A0A] border border-[#262626] hover:border-[#00FF41] shadow-[4px_4px_0px_0px_#141414] p-6 font-mono transition-all">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-9 h-9 bg-black border border-[#00FF41] text-[#00FF41] flex items-center justify-center shadow-[2px_2px_0px_0px_#00FF41]">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#EDEDED] tracking-tight">
              Knowledge & Guide Hub
            </h1>
            <p className="text-xs text-[#737373] font-sans">
              Explore easy-to-understand wellness guides, stress-relief techniques, and healthy habits.
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
              placeholder="Search for stress relief, study tips, better sleep, healthy habits..."
              className="w-full pl-10 pr-4 py-3 bg-black border border-[#262626] text-sm text-[#EDEDED] placeholder-[#525252] focus:outline-none focus:border-[#00FF41] transition-all font-sans"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
            className="px-5 py-3 bg-[#00FF41] hover:bg-[#00E038] disabled:opacity-40 text-black font-mono font-bold text-xs tracking-wider border border-[#00FF41] shadow-[2px_2px_0px_0px_#262626] hover:shadow-[3px_3px_0px_0px_#00FF41] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Search className="w-4 h-4 text-black" />
            <span>Search</span>
          </button>
        </form>
      </div>

      {/* Answer & Sources Display */}
      {isLoading ? (
        <div className="bg-[#0A0A0A] border border-[#00FF41] shadow-[0_0_20px_rgba(0,255,65,0.15)] p-8 flex flex-col items-center justify-center text-center space-y-3 font-mono">
          <div className="w-8 h-8 border-2 border-[#141414] border-t-[#00FF41] animate-spin" />
          <p className="text-sm font-bold text-[#EDEDED]">[SEARCHING KNOWLEDGE BASE]</p>
          <p className="text-xs text-[#737373] font-sans">Retrieving helpful insights and practical takeaways...</p>
        </div>
      ) : answer ? (
        <div className="bg-[#0A0A0A] border border-[#262626] hover:border-[#00FF41] shadow-[4px_4px_0px_0px_#141414] p-6 sm:p-7 space-y-6">
          <div className="flex items-center justify-between border-b border-[#262626] pb-4 font-mono">
            <div className="flex items-center space-x-2 text-[#00FF41]">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Helpful Guide & Summary</span>
            </div>
            <button
              onClick={() => {
                setAnswer(null);
                setSources([]);
                setSearchQuery('');
              }}
              className="text-xs text-[#737373] hover:text-[#EDEDED] font-mono cursor-pointer"
            >
              [Clear Search]
            </button>
          </div>

          <div className="text-sm sm:text-base leading-relaxed text-[#EDEDED] font-sans whitespace-pre-wrap">
            {answer}
          </div>

          {/* Sources List */}
          {sources.length > 0 && (
            <div className="pt-4 border-t border-[#262626] font-mono">
              <h4 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#00FF41]" />
                <span>Reference Sources</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.uri}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-black border border-[#262626] hover:border-[#00FF41] text-xs text-[#A1A1AA] hover:text-[#00FF41] flex items-center justify-between transition-colors"
                  >
                    <span className="truncate pr-2">{src.title || src.uri}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 text-[#00FF41]" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Error display */}
      {errorMsg && (
        <div className="p-4 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-mono">
          {errorMsg}
        </div>
      )}

      {/* Featured Topics Section */}
      <div className="space-y-3 font-mono">
        <h3 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-[#00FF41]" />
          <span>Popular Topics to Explore</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURED_TOPICS.map((topic, index) => {
            const Icon = topic.icon;
            return (
              <button
                key={index}
                onClick={() => handleSearch(topic.query)}
                className="p-4 bg-[#0A0A0A] border border-[#262626] hover:border-[#00FF41] hover:-translate-y-0.5 text-left transition-all cursor-pointer shadow-[2px_2px_0px_0px_#141414] hover:shadow-[3px_3px_0px_0px_#00FF41] group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-[#00FF41] bg-black px-2 py-0.5 border border-[#262626]">
                      {topic.category}
                    </span>
                    <div className="p-1.5 bg-black border border-[#262626] group-hover:border-[#00FF41] text-[#00FF41] transition-colors">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#EDEDED] group-hover:text-[#00FF41] transition-colors font-mono">
                    {topic.title}
                  </h4>
                  <p className="text-[11px] text-[#737373] mt-1 line-clamp-2 font-sans">
                    {topic.query}
                  </p>
                </div>

                <div className="pt-3 mt-2 flex items-center justify-between text-[10px] text-[#737373] group-hover:text-[#00FF41]">
                  <span>Explore Guide</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform text-[#00FF41]" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
