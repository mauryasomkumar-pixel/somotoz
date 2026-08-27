import React, { useState } from 'react';
import { Search, Globe, BookOpen, Sparkles, ExternalLink, Compass, ShieldCheck, HeartPulse, Brain, Moon, Terminal, Cpu } from 'lucide-react';
import { GroundingSource } from '../types';

interface WisdomExplorerProps {
  onApplyTechnique?: (text: string) => void;
}

const FEATURED_TOPICS = [
  {
    title: '5-4-3-2-1 Somatic Grounding Technique',
    query: 'How does the 5-4-3-2-1 grounding method regulate the nervous system during stress?',
    icon: Compass,
    category: 'Somatic Systems',
  },
  {
    title: 'Cognitive Reframing & CBT Distortions',
    query: 'What are evidence-based CBT cognitive reframing strategies to overcome catastrophizing?',
    icon: Brain,
    category: 'Cognitive Architecture',
  },
  {
    title: 'Sleep Hygiene & Circadian Optimization',
    query: 'What does modern neuroscience say about the relationship between REM sleep and emotional resilience?',
    icon: Moon,
    category: 'Neuroscience & Health',
  },
  {
    title: 'Polyvagal Theory & Vagus Nerve Exercises',
    query: 'What are simple vagus nerve stimulation exercises for nervous system down-regulation?',
    icon: HeartPulse,
    category: 'Vagus Regulation',
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
        throw new Error(data.error || 'Failed to retrieve wisdom insights.');
      }

      setAnswer(data.answer);
      setSources(data.sources || []);
    } catch (err: any) {
      console.error('Wisdom search error:', err);
      setErrorMsg(err.message || 'Unable to complete search.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 font-sans">
      {/* Search Header */}
      <div className="bg-[#0d1322] rounded-2xl p-6 border border-slate-800/90 shadow-xl font-mono">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-md">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Somotoz Research & Grounding Hub
            </h1>
            <p className="text-xs text-slate-400">
              Evidence-based psychology, cognitive neuroscience, and mental models verified in real-time
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
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Inquire on somatic techniques, dopamine regulation, CBT schemas..."
              className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:bg-[#090d16] focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all font-sans"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
            className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 active:scale-95 disabled:opacity-40 text-white rounded-xl text-xs font-mono font-semibold transition-all shadow-md shadow-cyan-500/20 flex items-center space-x-1.5 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </form>
      </div>

      {/* Answer & Sources Display */}
      {isLoading ? (
        <div className="bg-[#0d1322] rounded-2xl p-8 border border-slate-800/90 shadow-xl flex flex-col items-center justify-center text-center space-y-3 font-mono">
          <div className="w-10 h-10 rounded-full border-3 border-cyan-900 border-t-cyan-400 animate-spin" />
          <p className="text-sm font-semibold text-slate-200">[GROUNDING RESEARCH & SYNTHESIZING INSIGHTS]</p>
          <p className="text-xs text-slate-500">Querying real-time scientific repositories and structuring actionable takeaways</p>
        </div>
      ) : answer ? (
        <div className="bg-[#0d1322] rounded-2xl p-6 sm:p-7 border border-slate-800/90 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 font-mono">
            <div className="flex items-center space-x-2 text-cyan-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Verified Research Synthesis</span>
            </div>
            <button
              onClick={() => {
                setAnswer(null);
                setSources([]);
                setSearchQuery('');
              }}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Clear
            </button>
          </div>

          <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap text-slate-200 font-sans">
            {answer}
          </div>

          {/* Sources Section */}
          {sources.length > 0 && (
            <div className="pt-4 border-t border-slate-800 font-mono">
              <h3 className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-2.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                Verified Grounding Citations ({sources.length}):
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.uri}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 hover:border-cyan-500/40 flex items-center justify-between gap-2 transition-colors group"
                  >
                    <span className="text-xs text-slate-300 group-hover:text-cyan-300 font-medium truncate">
                      {src.title || src.uri}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {errorMsg && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl font-mono">
          {errorMsg}
        </div>
      )}

      {/* Featured Topics Grid */}
      <div className="space-y-3 font-mono">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Explore Cognitive Science & Behavioral Architectures
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {FEATURED_TOPICS.map((topic, idx) => {
            const Icon = topic.icon;
            return (
              <div
                key={idx}
                onClick={() => handleSearch(topic.query)}
                className="p-4 bg-[#0d1322] hover:bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer shadow-lg group flex items-start gap-3.5"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-cyan-400 group-hover:bg-cyan-950 group-hover:border group-hover:border-cyan-500/30 flex items-center justify-center shrink-0 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
                    {topic.category}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300 mt-0.5 truncate font-sans">
                    {topic.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed font-sans">
                    {topic.query}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
