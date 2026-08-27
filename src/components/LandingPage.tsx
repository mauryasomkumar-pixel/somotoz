import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Shield, HeartHandshake, Tag, ArrowRight, Lock, BookOpen, Terminal, Cpu, MessageSquare, Image, Film, Music, Zap } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
  isAuthenticating: boolean;
  authError?: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignIn,
  isAuthenticating,
  authError,
}) => {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Header */}
      <header className="max-w-6xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
              Somotoz
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                AI Suite
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dev by <strong className="text-cyan-300">Som Maurya</strong></span>
          </div>

          <button
            onClick={onSignIn}
            disabled={isAuthenticating}
            className="px-4 py-2 text-xs sm:text-sm font-semibold font-mono text-cyan-300 bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 rounded-xl transition-all flex items-center space-x-2 shadow-sm cursor-pointer"
          >
            <span>Sign In</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto w-full px-6 py-12 lg:py-16 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl flex flex-col items-center"
        >
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-semibold uppercase tracking-wider mb-6 shadow-md shadow-cyan-500/10">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Next-Gen Multimodal AI Reflection & Engineering</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight font-mono">
            Synthesize Thoughts. Engineer Clarity.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl font-sans">
            <strong className="text-slate-200">Somotoz</strong> combines private cloud journaling with cutting-edge multimodal intelligence. Converse with empathetic reasoning, generate vector artwork, storyboard cinematic simulations, and compose procedural audio.
          </p>

          {authError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-mono max-w-md"
            >
              {authError}
            </motion.div>
          )}

          {/* Primary CTA: Google Sign In */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={onSignIn}
              disabled={isAuthenticating}
              className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 active:scale-95 text-white rounded-2xl font-semibold font-mono text-sm sm:text-base shadow-lg shadow-cyan-500/25 transition-all duration-200 flex items-center justify-center space-x-3 cursor-pointer disabled:opacity-60 group"
            >
              {isAuthenticating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connecting with Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3L1.6 7.2C.6 9.2 0 11.5 0 14s.6 4.8 1.6 6.8l3.7-3.1z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z"
                    />
                  </svg>
                  <span>Launch Somotoz Suite</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

          <div className="mt-4 flex items-center space-x-2 text-xs font-mono text-slate-500">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Isolated Firestore sandbox: <code className="text-cyan-300">users/{'{userId}'}/entries</code></span>
          </div>
        </motion.div>

        {/* Multimodal Preview Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-14 w-full max-w-4xl bg-[#0d1322] rounded-2xl shadow-2xl border border-slate-800/90 p-6 sm:p-8 text-left font-mono"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-cyan-500" />
              <span className="text-xs text-slate-500 pl-2">SOMOTOZ // MULTIMODAL KERNEL</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 text-xs font-semibold border border-cyan-500/30">
                #cyber-resilience
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 text-xs font-semibold border border-purple-500/30">
                #multimodal
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User reflection preview */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 block mb-2">
                User Input Stream
              </span>
              <h3 className="text-sm font-semibold text-slate-200 mb-2">
                Architecting calm in complex distributed systems
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                "Today felt demanding with the release deadline. Breaking the problem down into isolated micro-tasks unlocked immediate momentum and mental clarity."
              </p>
            </div>

            {/* AI Response preview */}
            <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 block mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Somotoz Synthesized Output
              </span>
              <p className="text-xs text-slate-300 leading-relaxed mb-3 font-sans">
                "You demonstrated cognitive agility. By isolating the single blocking factor, you transformed reactive tension into structured engineering flow."
              </p>
              <div className="mt-3 pt-3 border-t border-cyan-500/20 text-xs text-cyan-200">
                <span className="font-semibold block mb-1">Actionable Takeaway:</span>
                • Apply 20-minute strategic decomposition before scaling complex workflows.
              </div>
            </div>
          </div>
        </motion.div>

        {/* 4 Pillars Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-4 gap-4 w-full max-w-4xl text-left font-mono">
          <div className="p-5 rounded-2xl bg-[#0d1322] border border-slate-800/90 shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 text-cyan-400 flex items-center justify-center mb-3 border border-cyan-500/30">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-200 uppercase mb-1">Text Reasoning</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Structured CBT cognitive reframing, systems analysis, and grounded search.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0d1322] border border-slate-800/90 shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-purple-950 text-purple-400 flex items-center justify-center mb-3 border border-purple-500/30">
              <Image className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-200 uppercase mb-1">Vector Visuals</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Generative responsive SVG art with custom gradients and direct copy/download.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0d1322] border border-slate-800/90 shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center mb-3 border border-emerald-500/30">
              <Film className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-200 uppercase mb-1">Neural Video</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Interactive keyframe timeline simulations with dynamic animated canvas players.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0d1322] border border-slate-800/90 shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-amber-950 text-amber-400 flex items-center justify-center mb-3 border border-amber-500/30">
              <Music className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-200 uppercase mb-1">Neural Audio</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Live Web Audio API oscillator synthesis with harmonic frequencies & equalizer.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full px-6 py-6 border-t border-slate-800/80 text-xs font-mono text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>Somotoz AI Suite • Powered by Gemini 3.7 & Firestore</p>
        <p className="text-cyan-400/90">
          Developed by <strong>Som Maurya</strong>
        </p>
      </footer>
    </div>
  );
};

