import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Terminal, Cpu, Sparkles, Activity, ShieldCheck } from 'lucide-react';

const TECH_GREETINGS = [
  "Welcome back, Engineer. Neural systems nominal. Ready to synthesize thoughts.",
  "Kernel booted. All cognitive pathways open for deep reflection and architectural clarity.",
  "Memory buffer initialized. What breakthroughs and lessons shall we log today?",
  "Multimodal tensors synchronized. Welcome to Somotoz AI Workspace.",
  "Clear your cache, isolate the signal, and engineer calm amidst the noise.",
  "Deep reasoning pipeline active. Log your thoughts and let AI distill the core truth.",
];

interface DynamicWelcomeBannerProps {
  userName?: string | null;
}

export const DynamicWelcomeBanner: React.FC<DynamicWelcomeBannerProps> = ({ userName }) => {
  const [greetingIndex, setGreetingIndex] = useState(() => Math.floor(Math.random() * TECH_GREETINGS.length));
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  const fullText = TECH_GREETINGS[greetingIndex];

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    let i = 0;
    const timer = setInterval(() => {
      if (i < fullText.length) {
        setDisplayedText((prev) => prev + fullText.charAt(i));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 25);

    return () => clearInterval(timer);
  }, [greetingIndex, fullText]);

  const handleCycleGreeting = () => {
    setGreetingIndex((prev) => (prev + 1) % TECH_GREETINGS.length);
  };

  return (
    <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden font-mono group">
      {/* Background Cyber Ambient Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-cyan-500/10 via-purple-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-start space-x-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/10">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Activity className="w-3 h-3 animate-pulse text-cyan-400" />
                SYSTEM PROMPT // {userName ? userName.toUpperCase() : 'USER_ACTIVE'}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800">
                AI KERNEL
              </span>
            </div>

            {/* Typewriter text */}
            <div className="mt-1 min-h-[1.75rem] flex items-center">
              <p className="text-xs sm:text-sm text-slate-200 font-mono tracking-tight leading-relaxed">
                {displayedText}
                {isTyping && <span className="inline-block w-1.5 h-3.5 bg-cyan-400 ml-1 animate-pulse" />}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
          <button
            onClick={handleCycleGreeting}
            className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1"
            title="Next greeting transmission"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Next Transmission</span>
          </button>
        </div>
      </div>
    </div>
  );
};
