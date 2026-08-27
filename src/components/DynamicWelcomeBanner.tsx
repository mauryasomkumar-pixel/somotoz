import React, { useState, useEffect } from 'react';
import { Terminal, Sparkles, Activity } from 'lucide-react';

const FRIENDLY_GREETINGS = [
  "Welcome back! Somotoz is ready to help you write notes, plan tasks, or explore new ideas.",
  "Clear your mind and write down what's on your heart today.",
  "Take a peaceful breath. Log your reflections and let AI help you find clarity.",
  "Welcome to your Somotoz Workspace. What would you like to focus on today?",
  "Organize your thoughts, solve problems, and plan your day with ease.",
  "Write your notes freely. We'll help highlight key takeaways and insights.",
];

interface DynamicWelcomeBannerProps {
  userName?: string | null;
}

export const DynamicWelcomeBanner: React.FC<DynamicWelcomeBannerProps> = ({ userName }) => {
  const [greetingIndex, setGreetingIndex] = useState(() => Math.floor(Math.random() * FRIENDLY_GREETINGS.length));
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  const fullText = FRIENDLY_GREETINGS[greetingIndex];

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
    }, 22);

    return () => clearInterval(timer);
  }, [greetingIndex, fullText]);

  const handleCycleGreeting = () => {
    setGreetingIndex((prev) => (prev + 1) % FRIENDLY_GREETINGS.length);
  };

  return (
    <div className="bg-[#0A0A0A] border border-[#262626] hover:border-[#00FF41] p-4 sm:p-5 shadow-[4px_4px_0px_0px_#141414] transition-all font-mono">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-black border border-[#00FF41] text-[#00FF41] flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#00FF41]">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#00FF41] flex items-center gap-1.5">
                <Activity className="w-3 h-3 animate-pulse text-[#00FF41]" />
                HELLO // {userName ? userName.toUpperCase() : 'FRIEND'}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 bg-[#141414] text-[#A1A1AA] border border-[#262626]">
                SOMOTOZ
              </span>
            </div>

            {/* Typewriter text */}
            <div className="mt-1 min-h-[1.75rem] flex items-center">
              <p className="text-xs sm:text-sm text-[#EDEDED] font-mono tracking-tight leading-relaxed">
                {displayedText}
                {isTyping && <span className="inline-block w-1.5 h-3.5 bg-[#00FF41] ml-1 animate-pulse" />}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
          <button
            onClick={handleCycleGreeting}
            className="px-3 py-1.5 bg-black hover:bg-[#141414] border border-[#262626] hover:border-[#00FF41] text-[11px] font-mono text-[#A1A1AA] hover:text-[#00FF41] transition-all cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#171717] active:translate-x-0.5 active:translate-y-0.5"
            title="Next greeting note"
          >
            <Sparkles className="w-3 h-3 text-[#00FF41]" />
            <span>Next Tip</span>
          </button>
        </div>
      </div>
    </div>
  );
};
